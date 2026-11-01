#!/usr/bin/env node
/* run-bh-shadow.js — certs/bh-shadow.json: the black hole's decided layer (Phase 0), M87*.
   tools/ · cert-machine · 2026-10-31. Pre-registered in notes/black-hole-phase0-preregistration-2026-10-31.md,
   committed before any enclosure existed (76383c0d).

   Two deciders, no code shared: instruments/kerr/kerr.js (instruments/interval: outward-rounded doubles, verified
   roots, the kernel's π and cos/sin) and instruments/kerr/second.py (Python decimal with ROUND_FLOOR/ROUND_CEILING,
   fractions, Machin's π, Taylor cos/sin). For every core quantity the two enclosures must intersect (both hold the
   true value: disjoint enclosures prove a bug, and the record is refused). The inclination band is the first
   decider's alone (stated in the record).

   The words (the pre-registration's): a claim is a stated number or interval for one quantity.
     CERTIFIED  the enclosure lies inside the claim's interval (a printed decimal claims ± half a unit in its last digit)
     REFUTED    the enclosure is disjoint from it: false, proven, given the inputs
     REFUSED    outside the domain (a spin outside [0, 499/500], an inclination outside the band, a row not pinned),
                or neither inside nor disjoint at the enclosure's width
     COMPARED   the ring against the shadow: a ratio band, never a verdict on the black hole

   usage: node tools/run-bh-shadow.js           derive and write the record
          node tools/run-bh-shadow.js --check   the battery: re-derive everything, refuse unless the record on disk is
                                                identical, the deciders agree and every red control comes out as named */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const K = require('../instruments/kerr/kerr.js');
const Q = require('../instruments/interval/rational.js');
const I = require('../instruments/interval/interval.js');
const T = require('../instruments/interval/transcendental.js');
const A = require('../instruments/interval/algebraic.js');
const O = require('../design/outward.js');

const OUT = path.join(ROOT, 'certs', 'bh-shadow.json');
const PREREG = 'notes/black-hole-phase0-preregistration-2026-10-31.md';
const CHECK = process.argv.includes('--check');
const sha256 = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const die = m => { console.error('run-bh-shadow: REFUSED — ' + m); process.exit(1); };

/* ---------- the inputs (the pre-registration's table; each read from the source's own abstract, 2026-10-31) ---------- */

const ROWS = [
  { id: 'eht2019', label: 'EHT 2019 (the ring, GRMHD-calibrated)', thetaG: ['3.4', '4.2'],
    massForClock: ['5.6e9', '7.4e9'],
    published: 'θg = GM/(Dc²) = 3.8 ± 0.4 µas; M = 6.5 ± 0.2 (stat) ± 0.7 (sys) × 10⁹ M☉ at D = 16.8 (+0.8, −0.7) Mpc',
    read: 'θg ∈ [3.4, 4.2] µas (the measured angle; distance-free). For the clock (which needs M, not M/D): the stat and sys halves added linearly, M ∈ [5.6, 7.4] × 10⁹ M☉',
    source: 'EHT Collaboration 2019, First M87 EHT Results VI, ApJL 875, L6 (arXiv:1906.11243)',
    circular: 'this θg was derived FROM the 2017 ring with the GRMHD calibration, so the 2017 ring against this shadow returns that calibration: printed, never a test' },
  { id: 'gebhardt2011', label: 'stars (Gebhardt+11)', mass: ['6.2e9', '7.0e9'], distanceMpc: '17.9',
    published: '(6.6 ± 0.4) × 10⁹ M☉ at D = 17.9 Mpc', read: 'M ∈ [6.2, 7.0] × 10⁹ M☉ at 17.9 Mpc',
    source: 'Gebhardt et al. 2011, ApJ 729, 119 (arXiv:1101.1954), Gemini/NIFS stellar dynamics',
    distanceSource: { url: 'https://arxiv.org/abs/1101.1954',
      quote: 'We assume a distance to M87 of 17.9 Mpc. The value of the black-hole mass scales linearly with assumed distance.',
      where: '§1, the paper\'s own text (e-print gebhardt.tex, line 188)',
      eprint: 'https://arxiv.org/e-print/1101.1954', eprintSha256: '3149a3766d424df0c4441991be2bb1ed4150741089de8273c8fc0f706fc6c831' } },
  { id: 'liepold2023', label: 'stars (Liepold+23)', mass: ['5.12e9', '5.74e9'], distanceMpc: '16.8',
    published: '(5.37 +0.37 −0.25 ± 0.22) × 10⁹ M☉ at D = 16.8 Mpc (the ±0.22 is the distance systematic)',
    read: 'M ∈ [5.12, 5.74] × 10⁹ M☉ at 16.8 Mpc (the distance term cancels in M/D and is dropped)',
    source: 'Liepold, Ma & Walsh 2023, ApJL 945, L35 (arXiv:2302.07884), Keck IFS, triaxial orbit models',
    distanceSource: { url: 'https://arxiv.org/abs/2302.07884',
      quote: 'corresponding to a physical range of 50 pc–12 kpc at a distance of 16.8 ± 0.7 Mpc to M87, the value adopted in [EHT 2019 Paper VI] and in this work',
      where: '§1, the paper\'s own text (e-print M87.tex, line 193; LaTeX markup removed); Table 1\'s note: the second error is the systematic from the distance, 16.8 ± 0.7 Mpc',
      eprint: 'https://arxiv.org/e-print/2302.07884', eprintSha256: 'e95f7ffa8664fe5ceda79e2e6843b43068888f2297d75c97012d67338a9b7550' } },
  { id: 'walsh2013', label: 'gas (Walsh+13)', mass: ['2.8e9', '4.4e9'], distanceMpc: '17.9',
    published: '(3.5 +0.9 −0.7) × 10⁹ M☉ (68%) at D = 17.9 Mpc', read: 'M ∈ [2.8, 4.4] × 10⁹ M☉ at 17.9 Mpc',
    source: 'Walsh et al. 2013, ApJ 770, 86 (arXiv:1304.7273), HST/STIS gas dynamics',
    distanceSource: { url: 'https://arxiv.org/abs/1304.7273',
      quote: 'Throughout the paper, we assume a distance to M87 of D = 17.9 Mpc in order to allow for a direct comparison to the stellar-dynamical M_BH measurement by Gebhardt et al. (2011).',
      where: '§1, the paper\'s own text (e-print ms.tex, lines 221–224; LaTeX markup removed); the mass, its abstract: "M_BH = (3.5 +0.9 −0.7) × 10⁹ M☉ (68% confidence)"',
      eprint: 'https://arxiv.org/e-print/1304.7273', eprintSha256: 'fa4558b9f2cb24ac380970b3952683b2a1a00dd5d8697bbfdf08dd082c1e9c82' } }
];
const RINGS = [
  { id: 'eht2017', d: ['39', '45'], published: '42 ± 3 µas, "across all methods, a crescent diameter"',
    source: 'EHT Collaboration 2019, Paper VI (arXiv:1906.11243)' },
  { id: 'eht2017-2021', d: ['43.3', '44.5'], published: '43.9 ± 0.6 µas, persistent 2017–2021',
    source: 'EHT Collaboration, "Horizon-scale variability of M87* from 2017–2021 EHT observations" (arXiv:2509.24593)' }
];
const SPIN = { lo: '0', hi: '499/500' };
const INCL = { camera: '17', band: ['13.9', '20.5'] };
const SAMPLE_SPINS = ['0', '1/2', '47/50', '99/100', '499/500'];
const ROOT_SPINS = ['1/2', '47/50', '99/100', '499/500'];
const ISCO_AT = [['0', 1], ['1/2', 1], ['47/50', 1], ['99/100', 1], ['499/500', 1], ['99/100', -1], ['499/500', -1]];
const TOL17 = 1e-3, TOL_INCL = 2e-2;
/* Phase 2 (pre-registered 2026-10-31, § Phase 2): the viewer's two views off 17°, at the default spin only */
const VIEWS = [['47/50', '45'], ['47/50', '80']];

/* ---------- helpers ---------- */

const pq = s => (/\//.test(s) ? (([n, d]) => Q.R(BigInt(n), BigInt(d)))(s.split('/')) : K.decQ(s));
/* a rational printed outward at dp decimals, exactly (BigInt floor / ceiling) */
function qFix(q, dp, up) {
  const s = 10n ** BigInt(dp);
  let n = q.n * s, d = q.d;
  if (d < 0n) { n = -n; d = -d; }
  let f = n / d; if (n % d !== 0n && ((n < 0n) !== up)) f += up ? 1n : -1n;   /* BigInt / truncates toward 0 */
  const neg = f < 0n; const a = (neg ? -f : f).toString().padStart(dp + 1, '0');
  return (neg ? '-' : '') + (dp ? a.slice(0, a.length - dp) + '.' + a.slice(a.length - dp) : a);
}
const qEnc = ([lo, hi], dp) => '[' + qFix(lo, dp, false) + ', ' + qFix(hi, dp, true) + ']';
const enc = (X, dp) => O.enc(X, dp);
const ivQ = X => [Q.fromDouble(X[0]), Q.fromDouble(X[1])];
const meet = (a, b) => Q.cmp(a[0], b[1]) <= 0 && Q.cmp(b[0], a[1]) <= 0;      /* rational intervals intersect */
const inside = (a, b) => Q.cmp(b[0], a[0]) <= 0 && Q.cmp(a[1], b[1]) <= 0;    /* a ⊆ b */
/* the box a printed decimal claims: ± half a unit in its last digit */
function printedBox(s) {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(s); const k = m[2] ? m[2].length : 0;
  const v = K.decQ(s), h = Q.R(1n, 2n * 10n ** BigInt(k));
  return [Q.sub(v, h), Q.add(v, h)];
}
const mulPos = (X, Y) => I.mul(X, Y);   /* both positive */

/* ---------- the first decider ---------- */

function decideJS() {
  const R = {};
  /* (a) Schwarzschild */
  const dr = K.schwarzschildDoubleRoot(Q.R(27n));
  const s27 = A.sqrtRational(27n, 1n).iv;
  R.schwarzschild = { doubleRoot: dr, sqrt27: s27, diameter: I.mul(I.iv(2), s27) };
  /* (b) the photon-orbit radii */
  R.roots = {};
  for (const a of ROOT_SPINS) {
    const r = K.photonOrbitRoots(pq(a));
    R.roots[a] = { rMinus: r.rMinus, rPlus: r.rPlus, signs: r.signsAtEnds };
  }
  /* (b) the curve at the camera's 17°, at the sample spins; the mirror a → −a */
  const th17 = K.incl(INCL.camera);
  R.cos17 = th17.c; R.sin17 = th17.s;
  R.spins = {};
  for (const a of SAMPLE_SPINS) R.spins[a] = K.extents(K.qIv(pq(a)), th17);
  R.mirror = {};
  for (const a of ['1/2', '47/50', '499/500']) {
    const e = K.extents(K.qIv(Q.neg(pq(a))), th17);
    R.mirror[a] = { W: e.W, H: e.H, d: e.d, alphaMax: e.alpha.max, alphaMin: e.alpha.min };
  }
  /* Phase 2: the curve at the viewer's views off 17° */
  R.views = {};
  for (const [a, deg] of VIEWS) R.views[a + ' @ ' + deg] = K.extents(K.qIv(pq(a)), K.incl(deg));
  /* (b) the bands */
  R.band17 = K.band(pq(SPIN.lo), pq(SPIN.hi), INCL.camera, INCL.camera, { tol: TOL17 });
  R.bandIncl = K.band(pq(SPIN.lo), pq(SPIN.hi), INCL.band[0], INCL.band[1], { tol: TOL_INCL, keys: ['d'] });
  /* (c) θg per row, exact rationals */
  R.thetaG = {};
  for (const row of ROWS) {
    R.thetaG[row.id] = row.thetaG ? row.thetaG.map(K.decQ)
      : [K.thetaG(K.decQ(row.mass[0]), K.decQ(row.distanceMpc)), K.thetaG(K.decQ(row.mass[1]), K.decQ(row.distanceMpc))];
  }
  /* (e) ISCO, the clock */
  R.tgPerMsun = K.tG(Q.ONE);
  R.isco = {};
  for (const [a, dir] of ISCO_AT) {
    const Ab = K.qIv(pq(a)), r = K.isco(Ab, dir);
    R.isco[a + (dir > 0 ? ' pro' : ' retro')] = { r, Ptg: K.periodTg(r, Ab, dir) };
  }
  /* r_isco and its period over the whole spin range, by spin boxes of 1/10000 (the last one ends at 499/500) */
  const rng = { pro: { r: [Infinity, -Infinity], P: [Infinity, -Infinity] }, retro: { r: [Infinity, -Infinity], P: [Infinity, -Infinity] } };
  for (let k = 0; k < 9980; k++) {
    const Ab = K.qIv2(Q.R(BigInt(k), 10000n), Q.R(BigInt(k + 1), 10000n));
    for (const [nm, dir] of [['pro', 1], ['retro', -1]]) {
      const r = K.isco(Ab, dir), P = K.periodTg(r, Ab, dir);
      rng[nm].r = [Math.min(rng[nm].r[0], r[0]), Math.max(rng[nm].r[1], r[1])];
      rng[nm].P = [Math.min(rng[nm].P[0], P[0]), Math.max(rng[nm].P[1], P[1])];
    }
  }
  R.iscoRange = rng;
  return R;
}

/* ---------- the second decider ---------- */

function decidePY() {
  const inp = {
    rootSpins: ROOT_SPINS, spins: SAMPLE_SPINS,
    rows: ROWS.map(r => (r.thetaG ? { id: r.id, thetaG: r.thetaG } : { id: r.id, mass: r.mass, distanceMpc: r.distanceMpc })),
    isco: ISCO_AT.map(([a, d]) => [a, d > 0]),
    views: VIEWS
  };
  const res = cp.spawnSync('python3', ['-I', path.join(ROOT, 'instruments/kerr/second.py')],
    { input: JSON.stringify(inp), encoding: 'utf8', maxBuffer: 1 << 26 });
  if (res.status !== 0) die('the second decider failed: ' + (res.stderr || '').slice(-500));
  return JSON.parse(res.stdout);
}

/* ---------- agreement ---------- */

function agree(J, P) {
  const rows = [];
  const pIv = a => [K.decQ(a[0]), K.decQ(a[1])];
  const add = (name, jq, pqv) => { const ok = meet(jq, pqv); rows.push({ quantity: name, agree: ok }); if (!ok) die('the deciders DISAGREE on ' + name); };
  add('√27', ivQ(J.schwarzschild.sqrt27), pIv(P.sqrt27));
  for (const a of ROOT_SPINS) {
    add('r̃₋ at a = ' + a, J.roots[a].rMinus, pIv(P.roots[a].rMinus));
    add('r̃₊ at a = ' + a, J.roots[a].rPlus, pIv(P.roots[a].rPlus));
  }
  add('cos 17°', ivQ(J.cos17), pIv(P.cos17));
  add('sin 17°', ivQ(J.sin17), pIv(P.sin17));
  for (const a of SAMPLE_SPINS) for (const k of ['W', 'H', 'd']) add(k + ' at a = ' + a + ', 17°', ivQ(J.spins[a][k]), pIv(P.spins[a][k]));
  for (const [a, deg] of VIEWS) for (const k of ['W', 'H', 'd']) add(k + ' at a = ' + a + ', ' + deg + '°', ivQ(J.views[a + ' @ ' + deg][k]), pIv(P.views[a + ' @ ' + deg][k]));
  for (const k of ['W', 'H', 'd']) for (const m of ['min', 'max'])
    add(m + ' of ' + k + ' over the spin range, 17°', ivQ(J.band17[k][m]), pIv(P.band17[k][m]));
  for (const row of ROWS) add('θg, ' + row.id, J.thetaG[row.id], pIv(P.thetaG[row.id]));
  add('t_g per solar mass', [J.tgPerMsun, J.tgPerMsun], pIv(P.tg_per_msun_s));
  for (const [a, dir] of ISCO_AT) {
    const key = a + (dir > 0 ? ' pro' : ' retro');
    add('r_isco, a = ' + key, ivQ(J.isco[key].r), pIv(P.isco[key].r));
    add('ISCO period / t_g, a = ' + key, ivQ(J.isco[key].Ptg), pIv(P.isco[key].Ptg));
  }
  return rows;
}

/* ---------- derived: µas, ratios, the clock ---------- */

function derive(J) {
  const D = { predicted: {}, comparison: {}, clock: {} };
  const qd = q => K.qIv(q);
  for (const row of ROWS) {
    const tg = K.qIv2(J.thetaG[row.id][0], J.thetaG[row.id][1]);
    const b17 = [J.band17.d.min[0], J.band17.d.max[1]], bI = [J.bandIncl.d.min[0], J.bandIncl.d.max[1]];
    const p = {
      schwarzschild: mulPos(J.schwarzschild.diameter, tg),
      band17: mulPos(b17, tg),
      bandIncl: mulPos(bI, tg)
    };
    D.predicted[row.id] = p;
    D.comparison[row.id] = {};
    for (const ring of RINGS) {
      const Rg = K.qIv2(K.decQ(ring.d[0]), K.decQ(ring.d[1]));
      D.comparison[row.id][ring.id] = { band17: I.div(Rg, p.band17), bandIncl: I.div(Rg, p.bandIncl) };
    }
    /* the clock: t_g for the row's mass (it needs M, so it carries the row's distance), and the ISCO periods in days */
    const M = row.mass || row.massForClock;
    const tgS = K.qIv2(Q.mul(K.decQ(M[0]), J.tgPerMsun), Q.mul(K.decQ(M[1]), J.tgPerMsun));
    const day = I.iv(86400);
    const c = { tgHours: I.div(tgS, I.iv(3600)), iscoDays: {} };
    for (const k of Object.keys(J.isco)) c.iscoDays[k] = I.div(mulPos(J.isco[k].Ptg, tgS), day);
    c.rangeDays = { pro: I.div(mulPos(J.iscoRange.pro.P, tgS), day), retro: I.div(mulPos(J.iscoRange.retro.P, tgS), day) };
    D.clock[row.id] = c;
  }
  return D;
}

/* ---------- claims ---------- */

const inRange = s => { const a = pq(s); return Q.sign(a) >= 0 && Q.cmp(a, pq(SPIN.hi)) <= 0; };
function verdict(encl, claim) {
  if (inside(encl, claim)) return 'CERTIFIED';
  if (!meet(encl, claim)) return 'REFUTED';
  return 'REFUSED';
}

function claims(J, D) {
  const out = [];
  const add = (c, encl, claimed, extra = {}) => {
    const v = encl ? verdict(encl, claimed) : 'REFUSED';
    out.push(Object.assign({ claim: c.claim, by: c.by, claimed: c.claimedText, verdict: v,
      enclosure: encl ? qEnc(encl, c.dp || 6) : null }, extra));
  };
  const pt = (n, M, D_) => K.thetaG(K.decQ(M), K.decQ(D_));
  const scout = 'the scout (notes/black-hole-scout-2026-10-31.md, float64, not in the repository)';
  const dom = (c, why) => out.push({ claim: c.claim, by: c.by, claimed: c.claimedText, verdict: 'REFUSED', reason: why });

  /* the curve */
  add({ claim: 'mean diameter d̄ at a → 0, θo = 17°, in M', by: scout, claimedText: '10.39' }, ivQ(J.spins['0'].d), printedBox('10.39'));
  dom({ claim: 'mean diameter d̄ at a = 0.999, θo = 17°, in M', by: scout, claimedText: '9.67' },
    'spin 0.999 is outside the pre-registered range [0, 0.998]: not decided');
  add({ claim: 'd̄ over the spin range at 17° lies in [9.66, 10.40] M (the scout said over a ∈ [0, 1); read on [0, 0.998] only)', by: scout, claimedText: '[9.66, 10.40]' },
    [Q.fromDouble(J.band17.d.min[0]), Q.fromDouble(J.band17.d.max[1])], [K.decQ('9.66'), K.decQ('10.40')]);
  /* ISCO */
  for (const [a, dir, txt] of [['0', 1, '6'], ['47/50', 1, '2.136'], ['499/500', 1, '1.448'], ['99/100', -1, '8.79']]) {
    const key = a + (dir > 0 ? ' pro' : ' retro');
    add({ claim: 'r_isco at a = ' + a + (dir > 0 ? ' (prograde)' : ' (retrograde)') + ', in M', by: scout, claimedText: txt }, ivQ(J.isco[key].r), printedBox(txt));
  }
  /* t_g and the ISCO periods at M = 6.5e9 */
  const tg65 = Q.mul(K.decQ('6.5e9'), J.tgPerMsun);
  add({ claim: 't_g = GM/c³ at M = 6.5 × 10⁹ M☉, in hours', by: scout, claimedText: '8.89' }, [Q.div(tg65, Q.R(3600n)), Q.div(tg65, Q.R(3600n))], printedBox('8.89'));
  const tg65iv = K.qIv(tg65);
  for (const [key, txt] of [['0 pro', '34.2'], ['47/50 pro', '9.5'], ['499/500 pro', '6.4'], ['99/100 retro', '58']]) {
    const days = I.div(mulPos(J.isco[key].Ptg, tg65iv), I.iv(86400));
    add({ claim: 'ISCO period at a = ' + key + ', M = 6.5 × 10⁹ M☉, in days', by: scout, claimedText: txt, dp: 4 }, ivQ(days), printedBox(txt));
  }
  /* θg at the scout's point masses */
  for (const [nm, M, Dm, txt] of [['EHT 6.5e9 at 16.8 Mpc', '6.5e9', '16.8', '3.82'], ['Gebhardt+11 6.6e9 at 17.9', '6.6e9', '17.9', '3.64'],
    ['Liepold+23 5.37e9 at 16.8', '5.37e9', '16.8', '3.16'], ['Walsh+13 3.5e9 at 17.9', '3.5e9', '17.9', '1.93']]) {
    const t = pt(nm, M, Dm);
    add({ claim: 'θg for ' + nm + ', in µas', by: scout, claimedText: txt }, [t, t], printedBox(txt));
  }
  /* the predicted curve diameters at the scout's point masses, over the spin range at 17° */
  const b17 = [J.band17.d.min[0], J.band17.d.max[1]];
  for (const [nm, M, Dm, lo, hi] of [['EHT 6.5e9', '6.5e9', '16.8', '36.9', '39.7'], ['Gebhardt+11 6.6e9', '6.6e9', '17.9', '35.2', '37.8'],
    ['Liepold+23 5.37e9', '5.37e9', '16.8', '30.5', '32.8'], ['Walsh+13 3.5e9', '3.5e9', '17.9', '18.7', '20.1']]) {
    const t = K.qIv(pt(nm, M, Dm));
    const x = ivQ(mulPos(b17, t));
    add({ claim: 'the critical-curve d̄ over the spin range at 17°, ' + nm + ', in µas, lies in [' + lo + ', ' + hi + ']', by: scout, claimedText: '[' + lo + ', ' + hi + ']', dp: 4 },
      x, [printedBox(lo)[0], printedBox(hi)[1]]);
  }
  /* the ring ratio's arithmetic (its reading stays COMPARED) */
  const ring = K.qIv2(K.decQ('43.3'), K.decQ('44.5'));
  for (const [nm, M, Dm, lo, hi] of [['EHT 6.5e9', '6.5e9', '16.8', '1.09', '1.21'], ['Walsh+13 3.5e9', '3.5e9', '17.9', '2.1', '2.4']]) {
    const x = ivQ(I.div(ring, mulPos(b17, K.qIv(pt(nm, M, Dm)))));
    add({ claim: 'the 43.9 ± 0.6 µas ring over that curve (' + nm + ') lies in [' + lo + ', ' + hi + '] (arithmetic only; the reading is COMPARED)', by: scout, claimedText: '[' + lo + ', ' + hi + ']', dp: 4 },
      x, [printedBox(lo)[0], printedBox(hi)[1]]);
  }
  return out;
}

/* ---------- red controls ---------- */

function redControls(J, D) {
  const reds = [];
  const red = (name, expect, got) => { reds.push({ control: name, expected: expect, got, ok: expect === got }); };
  /* 1: a planted wrong Schwarzschild value */
  const s26 = A.sqrtRational(26n, 1n).iv;
  red('b_c = √26 claimed for √27', 'REFUTED', verdict(ivQ(J.schwarzschild.sqrt27), ivQ(s26)));
  red('b² = 28: is r = 3 a double root of r³ − b²(r − 2)?', 'no', K.schwarzschildDoubleRoot(Q.R(28n)).doubleRootAt3 ? 'yes' : 'no');
  /* 2: a mass moved outside its box: the gas row's θg claimed at 6.5e9 at 17.9 Mpc */
  const moved = K.thetaG(K.decQ('6.5e9'), K.decQ('17.9'));
  red('θg of the gas row claimed at a mass moved to 6.5 × 10⁹ (' + qFix(moved, 3, false) + ' µas)', 'REFUTED',
    verdict(J.thetaG.walsh2013, printedBox(qFix(moved, 2, false))));
  /* 3: spins outside the range */
  for (const a of ['999/1000', '1', '6/5']) {
    let got = inRange(a) ? 'decided' : 'REFUSED';
    if (got === 'REFUSED' && Q.cmp(pq(a), Q.ONE) >= 0) {   /* and the kernel itself refuses to compute there */
      let threw = 0;
      try { K.photonOrbitRoots(pq(a)); } catch (e) { threw++; }
      try { K.isco(K.qIv(pq(a))); } catch (e) { threw++; }
      if (threw !== 2) got = 'computed';
    }
    red('a spin outside [0, 0.998]: a = ' + a, 'REFUSED', got);
  }
  /* 4: forged diameters */
  red('d̄ at a = 0, 17°, EHT row claimed as 30 µas', 'REFUTED', verdict(ivQ(D.predicted.eht2019.schwarzschild), printedBox('30')));
  red('Schwarzschild d̄ claimed as 10.5 M', 'REFUTED', verdict(ivQ(J.spins['0'].d), printedBox('10.5')));
  /* 5: the limits and the mirror */
  const two27 = ivQ(J.schwarzschild.diameter);
  for (const k of ['W', 'H', 'd']) red('at a = 0 the enclosure of ' + k + ' holds 2√27', 'yes', meet(ivQ(J.spins['0'][k]), two27) ? 'yes' : 'no');
  for (const a of Object.keys(J.mirror)) for (const k of ['W', 'H', 'd'])
    red('mirror a → −a, a = ' + a + ': ' + k + ' unchanged (the enclosures intersect)', 'yes', meet(ivQ(J.mirror[a][k]), ivQ(J.spins[a][k])) ? 'yes' : 'no');
  for (const a of Object.keys(J.mirror))
    red('mirror a → −a, a = ' + a + ': α_max(−a) = −α_min(a)', 'yes', meet(ivQ(J.mirror[a].alphaMax), ivQ(I.neg(J.spins[a].alpha.min))) ? 'yes' : 'no');
  return reds;
}

/* ---------- the record ---------- */

function build() {
  const t0 = Date.now();
  const J = decideJS();
  const tJ = Date.now() - t0;
  const P = decidePY();
  const ag = agree(J, P);
  const D = derive(J);
  const C = claims(J, D);
  const reds = redControls(J, D);
  const bad = reds.filter(r => !r.ok);
  if (bad.length) die('red controls not as named: ' + JSON.stringify(bad));

  const M6 = X => enc(X, 6), U4 = X => enc(X, 4);
  const r = {
    what: 'M87*: the Kerr critical curve (the shadow edge) enclosed over the stated spin range and inclination, its diameter in µas for each published mass row, its ratio to the EHT ring (COMPARED), and the ISCO clock — the black hole\'s decided layer (Phase 0), no render, no page',
    preregistration: { path: PREREG, sha256: sha256(PREREG), committedBeforeAnyEnclosure: '76383c0d' },
    code: Object.fromEntries(['instruments/kerr/kerr.js', 'instruments/kerr/second.py', 'instruments/interval/interval.js',
      'instruments/interval/transcendental.js', 'instruments/interval/algebraic.js', 'instruments/interval/rational.js', 'design/outward.js']
      .map(f => [f, sha256(f)])),
    words: {
      CERTIFIED: 'the enclosure lies inside the claim\'s interval (a printed decimal claims ± half a unit in its last digit)',
      REFUTED: 'the enclosure is disjoint from the claim: false, proven, given the inputs',
      REFUSED: 'outside the pre-registered domain, or neither inside nor disjoint at the enclosure\'s width',
      COMPARED: 'the measured ring against the decided shadow: a ratio band, never a verdict on the black hole, on GR, or on which mass is right'
    },
    printing: 'every enclosure printed OUTWARD (design/outward.js; rationals by BigInt floor/ceiling): a lower end rounded down, an upper end up. M units at 6 decimals, µas and ratios at 4, θg as exact rationals and at 6',
    inputs: {
      constants: {
        c: '299 792 458 m/s (SI, exact)',
        GMsun: '1.327 124 4 × 10²⁰ m³ s⁻² (IAU 2015 Resolution B3, nominal; exact)',
        au: '149 597 870 700 m (IAU 2012 B2; exact); pc = (648 000/π) au (IAU 2015 B2)',
        thetaG: 'θg in µas = (M/M☉)·(GM☉/c²)/(D_Mpc · au): one au at one Mpc is one µas, π cancels, θg is an exact rational',
        tg: 't_g = GM/c³ = (M/M☉)·(GM☉/c²)/c s; t_g per solar mass ∈ ' + qEnc([J.tgPerMsun, J.tgPerMsun], 18) + ' s (exact: ' + Q.toString(J.tgPerMsun) + ')'
      },
      massRows: ROWS.map(rw => ({ id: rw.id, label: rw.label, published: rw.published, read: rw.read, source: rw.source, distanceSource: rw.distanceSource, circular: rw.circular })),
      distanceFree: 'a dynamical mass scales as M ∝ D, so M/D (θg) is what the data fix, whatever distance is assumed: the comparison with the ring needs no distance and none is propagated (the scout\'s finding). The clock needs M itself, so it carries each row\'s distance. Each dynamical row\'s distance is read from the paper\'s own text (its arXiv e-print source, sha256-pinned in distanceSource, read 2026-10-31): Gebhardt+11 and Walsh+13 assume 17.9 Mpc, Liepold+23 adopts 16.8 ± 0.7 Mpc. The Phase 0 values, first taken from a search summary, were the papers\' own: nothing moved',
      rings: RINGS,
      spin: 'a ∈ [0, 499/500] (0.998, Thorne 1974): ASSUMED, swept, never picked; |a| ≤ 0.998 by the mirror a → −a (checked below)',
      inclination: 'θo = 17° (the camera, the operator\'s ruling) and the band θo ∈ [13.9°, 20.5°] = 17.2° ± 3.3° (Mertens et al. 2016, A&A 595, A54, from the jet): ASSUMED. The EHT\'s 163° is the same curve mirrored (β² and α unchanged under cos θo → −cos θo)',
      diameter: 'W = max α − min α (horizontal extent), H = 2 max β (vertical extent), d̄ = (W + H)/2: a defined quantity, not "the" diameter'
    },
    premises: [
      { premise: 'the Kerr metric (GR, uncharged, vacuum; no plasma lensing)', standing: 'assumed' },
      { premise: 'the critical curve in closed form (Bardeen 1973; Gralla & Lupsasca 2020)', standing: 'decided (algebraic; enclosed here)' },
      { premise: 'spin a ∈ [0, 0.998]', standing: 'assumed (unconstrained by data)' },
      { premise: 'inclination 17° (17.2° ± 3.3°)', standing: 'assumed (jet kinematics)' },
      { premise: 'each mass row\'s published 68% range read as a box', standing: 'assumed (a box is not a hard bound on nature)' },
      { premise: 'the ring the EHT measures (a fit to visibilities)', standing: 'computed (by the EHT)' },
      { premise: 'the ring-to-shadow factor (GRMHD-calibrated in Paper VI; a thin disk\'s lensing ring ~5% outside the curve, Gralla, Holz & Wald 2019)', standing: 'compared, never decided: everything in the comparison rests on it' }
    ],
    enclosures: {
      schwarzschild: {
        claim: 'b_c = √27 M = 3√3 M: b² = 27 makes r = 3 a double root of r³ − b²(r − 2)',
        exact: 'f(3) = ' + J.schwarzschild.doubleRoot.f3 + ', f\'(3) = ' + J.schwarzschild.doubleRoot.fp3 + ' (rationals)',
        verdict: J.schwarzschild.doubleRoot.doubleRootAt3 ? 'CERTIFIED' : 'REFUTED',
        sqrt27: enc(J.schwarzschild.sqrt27, 15), diameter2sqrt27: enc(J.schwarzschild.diameter, 15)
      },
      photonOrbits: Object.fromEntries(ROOT_SPINS.map(a => [a, {
        rMinus: qEnc(J.roots[a].rMinus, 12), rPlus: qEnc(J.roots[a].rPlus, 12),
        how: 'roots of r(r − 3)² = 4a² in [1, 3] and [3, 4] by exact rational bisection to 2⁻⁵⁰; signs at 1, 3, 4: ' + [J.roots[a].signs.f1, J.roots[a].signs.f3, J.roots[a].signs.f4].join(', ')
      }])),
      curveAt17: {
        cos17: enc(J.cos17, 15), sin17: enc(J.sin17, 15),
        spins: Object.fromEntries(SAMPLE_SPINS.map(a => [a, { W: M6(J.spins[a].W), H: M6(J.spins[a].H), d: M6(J.spins[a].d) }]))
      },
      curveViews: {
        over: 'the viewer\'s two views off 17° (Phase 2, pre-registered 2026-10-31): a picture of the model, not of M87*; the default spin only',
        views: Object.fromEntries(VIEWS.map(([a, deg]) => [a + ' @ ' + deg, { spin: a, inclinationDeg: deg, W: M6(J.views[a + ' @ ' + deg].W), H: M6(J.views[a + ' @ ' + deg].H), d: M6(J.views[a + ' @ ' + deg].d) }]))
      },
      mirror: Object.fromEntries(Object.keys(J.mirror).map(a => ['-' + a, { W: M6(J.mirror[a].W), H: M6(J.mirror[a].H), d: M6(J.mirror[a].d) }])),
      band17: {
        over: 'every a ∈ [0, 499/500] at θo = 17°', tol: TOL17, boxes: J.band17.boxes,
        W: { min: M6(J.band17.W.min), max: M6(J.band17.W.max) }, H: { min: M6(J.band17.H.min), max: M6(J.band17.H.max) },
        d: { min: M6(J.band17.d.min), max: M6(J.band17.d.max) },
        band: 'd̄ ∈ ' + O.enc([J.band17.d.min[0], J.band17.d.max[1]], 6) + ' M for every spin in the range',
        read: 'min and max are each an enclosure of the extreme value over the range; the band is ⊆ [min.lo, max.hi]'
      },
      bandIncl: {
        over: 'every a ∈ [0, 499/500] and every θo ∈ [13.9°, 20.5°]', tol: TOL_INCL, boxes: J.bandIncl.boxes,
        d: { min: M6(J.bandIncl.d.min), max: M6(J.bandIncl.d.max) },
        band: 'd̄ ∈ ' + O.enc([J.bandIncl.d.min[0], J.bandIncl.d.max[1]], 6) + ' M',
        deciders: 'the first decider alone (the second does not carry a wide inclination box); W and H are not banded over inclination'
      },
      thetaG: Object.fromEntries(ROWS.map(rw => [rw.id, { uas: qEnc(J.thetaG[rw.id], 6), exact: J.thetaG[rw.id].map(Q.toString) }])),
      predictedUas: Object.fromEntries(ROWS.map(rw => [rw.id, {
        schwarzschild2sqrt27: U4(D.predicted[rw.id].schwarzschild), band17: U4(D.predicted[rw.id].band17), bandIncl: U4(D.predicted[rw.id].bandIncl)
      }])),
      comparison: {
        standing: 'COMPARED: ring ÷ predicted d̄ — the factor each row would need between the ring and the shadow edge. The factor is a calibrated premise (GRMHD), so this is a ratio band, not a verdict',
        rows: Object.fromEntries(ROWS.map(rw => [rw.id, Object.fromEntries(RINGS.map(rg => [rg.id, {
          band17: U4(D.comparison[rw.id][rg.id].band17), bandIncl: U4(D.comparison[rw.id][rg.id].bandIncl)
        }]))])),
        circular: ROWS[0].circular
      },
      isco: {
        formula: 'Bardeen, Press & Teukolsky 1972: Z₁ = 1 + (1 − a²)^(1/3)[(1 + a)^(1/3) + (1 − a)^(1/3)], Z₂ = √(3a² + Z₁²), r = 3 + Z₂ ∓ √((3 − Z₁)(3 + Z₁ + 2Z₂)); P = 2π (r^(3/2) ± a) t_g, coordinate time at infinity in the hole\'s rest frame (an observer sees it × (1 + z), z ≈ 0.0043, not applied)',
        at: Object.fromEntries(Object.keys(J.isco).map(k => [k, { r: M6(J.isco[k].r), periodTg: M6(J.isco[k].Ptg) }])),
        overSpinRange: { prograde: { r: M6(J.iscoRange.pro.r), periodTg: M6(J.iscoRange.pro.P) }, retrograde: { r: M6(J.iscoRange.retro.r), periodTg: M6(J.iscoRange.retro.P) } }
      },
      clock: Object.fromEntries(ROWS.map(rw => [rw.id, {
        tgHours: U4(D.clock[rw.id].tgHours),
        iscoDays: Object.fromEntries(Object.keys(D.clock[rw.id].iscoDays).map(k => [k, U4(D.clock[rw.id].iscoDays[k])])),
        iscoDaysOverSpinRange: { prograde: U4(D.clock[rw.id].rangeDays.pro), retrograde: U4(D.clock[rw.id].rangeDays.retro) }
      }]))
    },
    secondDecider: {
      decider: P.decider,
      rule: 'for every quantity the two enclosures intersect (both hold the true value); disjoint = a bug, the record refused',
      quantities: ag.length, agree: ag.every(x => x.agree),
      band17: { d: { min: P.band17.d.min, max: P.band17.d.max }, boxes: P.band17.boxes, note: 'a fixed spin grid, coarser than the first decider\'s branch and bound' },
      notCarried: 'the inclination band'
    },
    claims: C,
    redControls: reds,
    priorArt: [
      'Bardeen 1973, Timelike and null geodesics in the Kerr metric, in Black Holes (Les Houches), eds. DeWitt & DeWitt, p. 215 — the critical curve',
      'Bardeen, Press & Teukolsky 1972, ApJ 178, 347 — the ISCO',
      'Gralla & Lupsasca 2020, PRD 101, 044031 and 044032 (arXiv:1910.12873, 1910.12881) — the curve in this form',
      'Johnson et al. 2020, Sci. Adv. 6, eaaz1310 (arXiv:1907.04329) — the photon ring\'s universal structure',
      'Gralla, Holz & Wald 2019, PRD 100, 024018 (arXiv:1906.00873) — shadow, photon ring and lensing ring are different things',
      'C. Givord 2026, Elliptic Integrals in Kerr Spacetime: Explicit Reduction, AGM Evaluation… (Zenodo, DOI 10.5281/zenodo.19558035) — claims certified AGM error bounds for Kerr elliptic integrals; its method was not read, and Phase 0 needs no elliptic integral (the Lyapunov exponent is not among these claims)',
      'no prior interval enclosure of the Kerr shadow was found (the scout\'s search, 2026-10-31)'
    ],
    timing: { firstDeciderMs: tJ }
  };
  return r;
}

const rec = build();
const strip = o => { const c = JSON.parse(JSON.stringify(o)); delete c.timing; return JSON.stringify(c, null, 1); };
if (CHECK) {
  if (!fs.existsSync(OUT)) die(OUT + ' does not exist; run without --check first');
  const disk = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  if (strip(disk) !== strip(rec)) die('certs/bh-shadow.json does not re-derive identically');
  /* red control 7: a tampered pin — the gas row's upper mass moved by one unit in its last digit must change the record */
  const tampered = qEnc([K.thetaG(K.decQ('2.8e9'), K.decQ('17.9')), K.thetaG(K.decQ('4.5e9'), K.decQ('17.9'))], 6);
  if (tampered === disk.enclosures.thetaG.walsh2013.uas) die('a tampered mass row did not change the record');
  const nC = rec.claims.reduce((m, c) => (m[c.verdict] = (m[c.verdict] || 0) + 1, m), {});
  console.log('bh-shadow: PASS — the record re-derives; ' + rec.secondDecider.quantities + ' quantities, the two deciders agree; claims ' +
    JSON.stringify(nC) + '; ' + rec.redControls.length + ' red controls as named; a tampered row changes the record');
} else {
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  const nC = rec.claims.reduce((m, c) => (m[c.verdict] = (m[c.verdict] || 0) + 1, m), {});
  console.log('wrote ' + path.relative(ROOT, OUT) + ': claims ' + JSON.stringify(nC) + ', ' + rec.redControls.length + ' red controls, ' +
    rec.secondDecider.quantities + ' quantities agree (first decider ' + rec.timing.firstDeciderMs + ' ms)');
}
