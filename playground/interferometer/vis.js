/* vis.js — data layer for the interferometer experiment.  MIT, clean-room.

   Reads the Event Horizon Telescope's PUBLIC calibrated Stokes-I visibility
   CSVs (release 2024-D01-01, M87 April 2018; the same rows the collaboration
   published, untouched).  Column order, from the file's own header line:

       time(UTC), T1, T2, U(lambda), V(lambda), Iamp(Jy), Iphase(d), Isigma(Jy)

   Conventions fixed HERE and nowhere else, because every sign error in
   interferometry hides in a convention:
     - sky coordinates (l, m) in RADIANS, l east, m north;
     - V(u,v) = INT I(l,m) exp(-2*pi*i*(u*l + v*m)) dl dm;
     - u, v in wavelengths, so the phase argument is dimensionless;
     - amplitudes in Jy, phases in DEGREES in the file, radians internally.

   Nothing here fits, images or bounds anything: it loads, averages, and
   reports.  The measure-theoretic bound lives in lab-vis.js. */
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'data');
const UAS = 4.84813681109536e-12;          // one microarcsecond, in radians
const DAYS = { 111: '2018-04-21', 112: '2018-04-22', 115: '2018-04-25' };

function fileFor(day, band, pipe) {
  return path.join(DATA, `L2V1_M87_2018_${day}_${band}_${pipe}_netcal_10s_StokesI.csv`);
}

/* one CSV -> { src, mjd, freqGHz, rows: [{ t, t1, t2, u, v, amp, phase, sigma, re, im }] } */
function loadFile(day, band, pipe) {
  const txt = fs.readFileSync(fileFor(day, band, pipe), 'utf8');
  const lines = txt.replace(/\r/g, '').split('\n').filter(s => s.length > 0);
  const meta = lines[0].replace(/^#/, '').split(',');
  const head = lines[1].replace(/^#/, '').split(',');
  const EXPECT = 'time(UTC),T1,T2,U(lambda),V(lambda),Iamp(Jy),Iphase(d),Isigma(Jy)';
  if (head.join(',') !== EXPECT) throw new Error(`unexpected column order in ${day}/${band}/${pipe}:\n  ${head.join(',')}`);
  const get = (k) => { const f = meta.find(s => s.startsWith(k + ':')); return f ? f.slice(k.length + 1) : null; };
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const c = lines[i].split(',');
    if (c.length !== 8) throw new Error(`row ${i} of ${day}/${band}/${pipe} has ${c.length} fields`);
    const amp = +c[5], ph = +c[6] * Math.PI / 180;
    rows.push({
      t: +c[0], t1: c[1], t2: c[2], u: +c[3], v: +c[4],
      amp, phase: ph, sigma: +c[7],
      re: amp * Math.cos(ph), im: amp * Math.sin(ph),
      day, band, pipe,
    });
  }
  return { src: get('SRC'), mjd: +get('DATE(MJD)'), freqGHz: parseFloat(get('FREQ')), day, band, pipe, rows };
}

/* Coherent averaging inside fixed time windows, per baseline.
   window in SECONDS.  sigma of the mean is sigma_i/sqrt(n) combined in
   quadrature, then floored at `sysFrac` of the averaged amplitude: the
   released sigmas are thermal only, and no bound should pretend a systematic
   floor away.  Returns rows in the same shape (amp/phase recomputed). */
function average(rows, windowSec, sysFrac) {
  const W = windowSec / 3600;                       // the time column is hours
  const bins = new Map();
  for (const r of rows) {
    const key = `${r.t1}|${r.t2}|${Math.floor(r.t / W)}`;
    let b = bins.get(key);
    if (!b) { b = { t1: r.t1, t2: r.t2, n: 0, t: 0, u: 0, v: 0, re: 0, im: 0, s2: 0, day: r.day, band: r.band, pipe: r.pipe }; bins.set(key, b); }
    b.n++; b.t += r.t; b.u += r.u; b.v += r.v; b.re += r.re; b.im += r.im; b.s2 += r.sigma * r.sigma;
  }
  const out = [];
  for (const b of bins.values()) {
    const n = b.n, re = b.re / n, im = b.im / n;
    const amp = Math.hypot(re, im);
    const sig = Math.max(Math.sqrt(b.s2) / n, sysFrac * amp);
    out.push({ t: b.t / n, t1: b.t1, t2: b.t2, u: b.u / n, v: b.v / n, amp, phase: Math.atan2(im, re), sigma: sig, re, im, n, day: b.day, band: b.band, pipe: b.pipe });
  }
  out.sort((p, q) => p.t - q.t);
  return out;
}

/* Every (u,v) point also constrains its conjugate (-u,-v) because the sky is
   real.  We never store the conjugate row: the bound's dual handles it by
   working with the Hermitian pair explicitly where it matters. */

function stations(rows) {
  const s = new Set();
  for (const r of rows) { s.add(r.t1); s.add(r.t2); }
  return [...s].sort();
}
function baselines(rows) {
  const m = new Map();
  for (const r of rows) { const k = [r.t1, r.t2].sort().join('-'); m.set(k, (m.get(k) || 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
const uvMax = rows => rows.reduce((m, r) => Math.max(m, Math.hypot(r.u, r.v)), 0);
const uvMin = rows => rows.reduce((m, r) => Math.min(m, Math.hypot(r.u, r.v)), Infinity);

/* Total flux within a stated field of view.
   The shortest baseline b_min sees exp(-2*pi*i*u.x) with |2*pi*u.x| <= 2*pi*b_min*R,
   so for a source confined to |x| <= R the measured amplitude differs from the
   total flux by at most that phase excursion.  Returns { F, eps, bMin, phaseMax }
   — an interval on the zero-baseline flux DERIVED from the data plus the FOV
   hypothesis, not assumed. */
function fluxFromShortest(rows, fovRad, nsig) {
  let best = null;
  for (const r of rows) { const b = Math.hypot(r.u, r.v); if (!best || b < best.b) best = { b, r }; }
  const { b, r } = best;
  const phaseMax = 2 * Math.PI * b * fovRad;
  // |V(u)| >= F*cos(phaseMax) for a nonnegative source inside the FOV, and |V(u)| <= F.
  const lo = r.amp - nsig * r.sigma, hi = (r.amp + nsig * r.sigma) / Math.max(Math.cos(phaseMax), 1e-6);
  return { F: (lo + hi) / 2, eps: (hi - lo) / 2, bMin: b, phaseMax, amp: r.amp, sigma: r.sigma };
}

/* Synthetic sky, sampled at the REAL (u,v) points and given the REAL sigmas.
   model: [{ l, m, flux }] in radians / Jy.  Used only by the red team: a
   certificate that cannot contain a sky we built ourselves is wrong, and the
   only way to know is to build one. */
function syntheticRows(rows, model) {
  return rows.map(r => {
    let re = 0, im = 0;
    for (const s of model) {
      const th = 2 * Math.PI * (r.u * s.l + r.v * s.m);
      re += s.flux * Math.cos(th); im -= s.flux * Math.sin(th);
    }
    const amp = Math.hypot(re, im);
    return { t: r.t, t1: r.t1, t2: r.t2, u: r.u, v: r.v, amp, phase: Math.atan2(im, re), sigma: r.sigma, re, im, day: r.day, band: r.band, pipe: r.pipe };
  });
}
/* a thin ring of n point masses, radius R (uas), total flux F, plus an optional
   central point of flux c */
function ringModel(Ruas, F, n = 256, c = 0) {
  const m = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    m.push({ l: Ruas * UAS * Math.cos(t), m: Ruas * UAS * Math.sin(t), flux: F / n });
  }
  if (c > 0) m.push({ l: 0, m: 0, flux: c });
  return m;
}
const modelFluxWithin = (model, r0uas) => model.reduce((s, p) => s + (Math.hypot(p.l, p.m) / UAS <= r0uas ? p.flux : 0), 0);

module.exports = { UAS, DAYS, DATA, fileFor, loadFile, average, stations, baselines, uvMax, uvMin, fluxFromShortest, syntheticRows, ringModel, modelFluxWithin };
