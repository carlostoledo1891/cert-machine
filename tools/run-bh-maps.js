#!/usr/bin/env node
/* run-bh-maps.js — the black hole's lensing maps (Phase 1, COMPUTED) and their check against the decided curve.
   tools/ · cert-machine · 2026-10-31. Pre-registered in notes/black-hole-phase0-preregistration-2026-10-31.md,
   § Phase 1, committed before any ray was traced (455fa5fb).

   The maps (corpus/bh-maps/, manifest.json): for spins a ∈ {0, 1/2, 47/50, 499/500} at the camera's θo = 17°, a
   512 × 512 image plane over α, β ∈ [−20, 20] M, each pixel's ray traced backward (instruments/kerr/rays.js, double
   precision, Dormand–Prince with error control): the first three equatorial crossings n = 0, 1, 2 with r_s, φ_s and
   g (prograde Keplerian, cut at the ISCO), and the ray's fate. IEEE half floats, gzip.

   The check (certs/bh-maps-check.json): the maps against Phase 0's decided curve (instruments/kerr/kerr.js and
   certs/bh-shadow.json) and against Gralla & Lupsasca's closed form. The words: AGREES / DISAGREES (a computed layer
   is graded, never CERTIFIED).

   usage: node tools/run-bh-maps.js --maps    trace every map (worker threads, ~1–2 min) and write corpus/bh-maps/
          node tools/run-bh-maps.js           run the checks on the maps on disk and write certs/bh-maps-check.json
          node tools/run-bh-maps.js --check   the battery: the pins, a re-traced sample, the checks and the red
                                              controls re-derived; refused unless the record on disk is identical */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');

const ROOT = path.resolve(__dirname, '..');
const RAYS = require('../instruments/kerr/rays.js');
const OUTDIR = path.join(ROOT, 'corpus', 'bh-maps');
const MANIFEST = path.join(OUTDIR, 'manifest.json');
const OUT = path.join(ROOT, 'certs', 'bh-maps-check.json');
const PREREG = 'notes/black-hole-phase0-preregistration-2026-10-31.md';
const SHADOW = 'certs/bh-shadow.json';

/* ---------- the pre-registered parameters ---------- */
const N = 512, HALF = 20, PITCH = 2 * HALF / N;                  /* 5/64 M, exact */
const SPINS = ['0', '1/2', '47/50', '499/500'];
const DEFAULT_SPIN = '47/50';
const NCROSS = 3, TOL = 1e-12;
/* cos 17° and sin 17° as doubles, each asserted inside Phase 0's enclosure (certs/bh-shadow.json) */
const COS17 = 0.9563047559630355, SIN17 = 0.2923717047227367;
/* Phase 2 (pre-registered 2026-10-31, § Phase 2): the viewer's two views off 17°, at the default spin only — a picture of
   the model, not of M87*. cos and sin as fixed doubles, each asserted inside kerr.js's enclosure below */
const VIEWS = [
  { s: '47/50', deg: '45', cos: 0.7071067811865476, sin: 0.7071067811865475 },
  { s: '47/50', deg: '80', cos: 0.17364817766693041, sin: 0.984807753012208 }
];
const viewKey = v => v.s + ' @ ' + v.deg;
/* every map: the four spins at 17°, then the views */
const MAPS = SPINS.map(s => ({ key: s, s, deg: '17', cos: COS17, sin: SIN17 })).concat(VIEWS.map(v => Object.assign({ key: viewKey(v) }, v)));
const spinD = s => (s.includes('/') ? Number(s.split('/')[0]) / Number(s.split('/')[1]) : Number(s));
const tag = s => 'a' + s.replace('/', '_');
const mapTag = m => tag(m.s) + (m.deg === '17' ? '' : '-i' + m.deg);
const alphaOf = i => -HALF + (i + 0.5) * PITCH;                    /* column i, left to right */
const betaOf = j => HALF - (j + 0.5) * PITCH;                      /* row j, top to bottom */

const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const shaFile = f => sha256(fs.readFileSync(path.join(ROOT, f)));
const die = m => { console.error('run-bh-maps: REFUSED — ' + m); process.exit(1); };
let LAP = Date.now();
const lap = what => { if (process.env.BH_VERBOSE) console.error(what + ': ' + (Date.now() - LAP) + ' ms'); LAP = Date.now(); };
const ivOf = s =>s.replace(/[[\]]/g, '').split(',').map(x => Number(x.trim()));   /* an outward-printed "[lo, hi]" */

/* ---------- one pixel ---------- */
function pixel(a, cosO, sinO, riscoHi, i, j, out, o3, fate) {
  const al = alphaOf(i), be = betaOf(j);
  const t = RAYS.trace(a, cosO, sinO, al, be, { tol: TOL, maxCross: NCROSS });
  if (t.fate !== 'captured' && t.fate !== 'escaped') throw new Error('ray ' + i + ',' + j + ' ended ' + t.fate);
  const p = j * N + i;
  fate[p] = (t.fate === 'captured' ? 128 : 0) | Math.min(127, t.count);
  for (let n = 0; n < NCROSS; n++) {
    const c = t.crossings[n], b = (p * 3);
    let r = NaN, ph = NaN, g = NaN;
    if (c) { r = c.r; ph = c.phi; if (Number.isFinite(c.r) && c.r >= riscoHi) g = RAYS.gKepler(a, c.r, t.k.lam); }
    out[n][b] = RAYS.toHalf(r); out[n][b + 1] = RAYS.toHalf(ph); out[n][b + 2] = RAYS.toHalf(g);
  }
  return t;
}

function riscoFor(shadow, s) {
  const e = shadow.enclosures.isco.at[s + ' pro'];
  if (!e) die('no ISCO enclosure for a = ' + s + ' in ' + SHADOW);
  return ivOf(e.r)[1];                                             /* the upper end: g only where r_s is proven outside */
}

/* ---------- worker: a block of rows ---------- */
if (!isMainThread) {
  const { key, s, cos, sin, j0, j1 } = workerData;
  const a = spinD(s);
  const shadow = JSON.parse(fs.readFileSync(path.join(ROOT, SHADOW), 'utf8'));
  const risco = riscoFor(shadow, s);
  const rows = j1 - j0;
  const out = [0, 1, 2].map(() => new Uint16Array(N * N * 3)), fate = new Uint8Array(N * N);
  for (let j = j0; j < j1; j++) for (let i = 0; i < N; i++) pixel(a, cos, sin, risco, i, j, out, null, fate);
  parentPort.postMessage({
    key, j0, j1,
    layers: out.map(L => Buffer.from(L.buffer, j0 * N * 3 * 2, rows * N * 3 * 2)),
    fate: Buffer.from(fate.buffer, j0 * N, rows * N)
  });
  return;
}

/* ---------- main ---------- */
const MODE = process.argv.includes('--maps') ? 'maps' : process.argv.includes('--check') ? 'check' : 'record';
const shadow = JSON.parse(fs.readFileSync(path.join(ROOT, SHADOW), 'utf8'));
{
  const c = ivOf(shadow.enclosures.curveAt17.cos17), s = ivOf(shadow.enclosures.curveAt17.sin17);
  if (!(c[0] <= COS17 && COS17 <= c[1] && s[0] <= SIN17 && SIN17 <= s[1])) die('cos 17° / sin 17° outside Phase 0\'s enclosures');
  const K = require('../instruments/kerr/kerr.js');
  for (const v of VIEWS) {
    const th = K.incl(v.deg);
    if (!(th.c[0] <= v.cos && v.cos <= th.c[1] && th.s[0] <= v.sin && v.sin <= th.s[1])) die('cos / sin ' + v.deg + '° outside kerr.js\'s enclosure');
    if (!shadow.enclosures.curveViews || !shadow.enclosures.curveViews.views[viewKey(v)]) die('no Phase 0 enclosure for the view ' + viewKey(v) + ' in ' + SHADOW);
  }
}

/* a map is named by its spin (17°) or its key (a view, '47/50 @ 45') */
const mapOf = k => MAPS.find(m => m.key === k) || die('no map ' + k);
const fileName = (k, n) => { const t = mapTag(mapOf(k)); return n === 'fate' ? t + '-fate.u8.gz' : t + '-n' + n + '.rpg.f16.gz'; };

async function buildMaps() {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const os = require('os');
  const nW = Math.max(1, Math.min(8, os.cpus().length));
  const jobs = [];
  for (const m of MAPS) { const per = Math.ceil(N / nW); for (let j0 = 0; j0 < N; j0 += per) jobs.push({ key: m.key, s: m.s, cos: m.cos, sin: m.sin, j0, j1: Math.min(N, j0 + per) }); }
  const bufs = {};
  for (const m of MAPS) bufs[m.key] = { layers: [0, 1, 2].map(() => Buffer.alloc(N * N * 3 * 2)), fate: Buffer.alloc(N * N) };
  const t0 = Date.now();
  let next = 0;
  await new Promise((resolve, reject) => {
    let live = 0;
    const launch = () => {
      if (next >= jobs.length) { if (!live) resolve(); return; }
      const jb = jobs[next++]; live++;
      const w = new Worker(__filename, { workerData: jb });
      w.on('message', m => {
        m.layers.forEach((L, n) => Buffer.from(L).copy(bufs[m.key].layers[n], m.j0 * N * 3 * 2));
        Buffer.from(m.fate).copy(bufs[m.key].fate, m.j0 * N);
      });
      w.on('error', reject);
      w.on('exit', () => { live--; launch(); });
    };
    for (let k = 0; k < nW; k++) launch();
  });
  const files = {};
  for (const { key, s, deg } of MAPS) {
    const put = (n, raw, format) => {
      const gz = zlib.gzipSync(raw, { level: 9 });
      const name = fileName(key, n);
      fs.writeFileSync(path.join(OUTDIR, name), gz);
      files[name] = Object.assign({ spin: s }, deg === '17' ? {} : { inclinationDeg: deg }, { layer: n === 'fate' ? 'fate' : 'n = ' + n, format, bytes: gz.length, sha256: sha256(gz), rawBytes: raw.length, rawSha256: sha256(raw) });
    };
    for (let n = 0; n < NCROSS; n++) put(n, bufs[key].layers[n], 'gzip of 512 × 512 × 3 IEEE half floats, little-endian, interleaved (r_s in M, φ_s in rad, g); row 0 the top; NaN where absent');
    put('fate', bufs[key].fate, 'gzip of 512 × 512 bytes: bit 7 set = captured by the horizon, bits 0–6 = the number of equatorial crossings outside the horizon (capped at 127)');
  }
  const man = {
    what: 'the lensing maps of M87* (Phase 1): COMPUTED in double precision, stored as half floats; a picture of the Kerr geometry, not a decided object. The only decided curve is Phase 0\'s (certs/bh-shadow.json); certs/bh-maps-check.json grades these maps against it',
    standing: 'COMPUTED (dashed in the WARRANT grammar). The spin is ASSUMED (each map one chosen value), the inclination ASSUMED (the camera fixed at 17°), the disk model ASSUMED',
    preregistration: PREREG,
    grid: { n: N, alpha: [-HALF, HALF], beta: [-HALF, HALF], pitchM: '5/64', pixelCentre: 'α_i = −20 + (i + ½)·5/64, β_j = 20 − (j + ½)·5/64 (row 0 the top)',
      axes: 'Bardeen\'s image plane in units of M, observer at infinity: α to the right, β up along the projected spin axis; λ = −α sin θo, η = (α² − a²) cos²θo + β²' },
    camera: { inclinationDeg: 17, cos: COS17, sin: SIN17, note: 'the operator\'s ruling: fixed at 17° (the jet\'s 17.2° ± 3.3°, Mertens et al. 2016); the EHT\'s 163° is the mirror image' },
    spins: SPINS, defaultSpin: DEFAULT_SPIN,
    views: VIEWS.map(v => ({ key: viewKey(v), spin: v.s, inclinationDeg: v.deg, cos: v.cos, sin: v.sin, files: mapTag(v) + '-*',
      note: 'Phase 2 (pre-registered 2026-10-31): leaving M87*\'s 17° view, a picture of the model, not of M87*; the default spin only; cos and sin fixed doubles inside kerr.js\'s enclosures' })),
    spinNote: 'a = 47/50 = 0.94 is the CHOSEN default (the common GRMHD value 0.9375 is within 0.003; Phase 0 has enclosures at 0.94); a = 0 is Schwarzschild',
    layers: {
      'n = 0, 1, 2': 'the n-th crossing of the equatorial plane outside the horizon, counted backward from the observer (n = 0 the direct image, n = 1, 2 the first and second photon-ring images): r_s (M; +∞ for a crossing beyond 200 M on the way out), φ_s (rad in [0, 2π); φ = 0 the observer\'s azimuth, the near side; the prograde disk turns counter-clockwise in the image) and g = ν_obs/ν_emit',
      fate: 'captured or escaped, and the crossing count'
    },
    disk: {
      standing: 'ASSUMED (the operator\'s simple thin-disk model)',
      velocity: 'prograde Keplerian circular orbits, Ω = 1/(r^{3/2} + a); g = 1/[u^t (1 − Ω λ)], u^t = (r^{3/2} + a)/(r^{3/4} √(r^{3/2} − 3 r^{1/2} + 2a))',
      innerEdge: 'cut at the ISCO: g only where r_s ≥ the upper end of Phase 0\'s ISCO enclosure; inside it r_s and φ_s are kept, g is NaN (no plunging matter)',
      riscoUsed: Object.fromEntries(SPINS.map(s => [s, riscoFor(shadow, s)])),
      emissionForPhase2: 'declared, not used by the maps: optically thin, every image adds; J(r) ∝ r⁻² on [r_isco, 20 M]; I_obs = Σ_n g_n³ J(r_n)'
    },
    method: {
      tracer: 'instruments/kerr/rays.js: Mino-time second-order system r\'\' = R′/2, u\'\' = G′/2 with φ alongside; Dormand–Prince 5(4), local tolerance 1e-12; crossings by re-stepping (Illinois); start at r = 200 M after the exact far leg (Gauss–Legendre in 1/r, the decoupled polar motion integrated from the observer); captured below r₊ + 1e-6; escaped outgoing past 200 M, with the remaining crossings counted from the polar motion',
      reproducible: 'only + − × ÷ and √ per ray: bit-identical on any IEEE-754 machine (re-traced on a sample in --check)',
      code: { 'instruments/kerr/rays.js': shaFile('instruments/kerr/rays.js'), 'tools/run-bh-maps.js': shaFile('tools/run-bh-maps.js') }
    },
    files,
    totalBytes: Object.values(files).reduce((t, f) => t + f.bytes, 0),
    builtSeconds: Math.round((Date.now() - t0) / 1000)
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(man, null, 1) + '\n');
  console.log('wrote corpus/bh-maps/: ' + Object.keys(files).length + ' files, ' + man.totalBytes + ' bytes, ' + man.builtSeconds + ' s');
}

/* ---------- the decided curve (Phase 0's decider) ---------- */
function decidedCurve(s, deg) {
  const K = require('../instruments/kerr/kerr.js');
  const Q = require('../instruments/interval/rational.js');
  const I = require('../instruments/interval/interval.js');
  const A = require('../instruments/interval/algebraic.js');
  const aQ = s.includes('/') ? Q.R(BigInt(s.split('/')[0]), BigInt(s.split('/')[1])) : Q.R(BigInt(s));
  const Ab = K.qIv(aQ), th = K.incl(deg);
  const pt = u => {
    const e = K.evalBox(Ab, I.iv(u), th);
    if (!(e.ru2[1] <= 4 && e.b2[0] >= 0)) return e.ru2[0] > 4 || e.b2[1] < 0 ? 'off' : 'undecided';
    const b = A.sqrtInterval(I.iv(e.b2[0], e.b2[1]));
    return { u, alpha: e.alpha, beta: b, r: 3 + spinD(s) * u };
  };
  /* a coarse u grid, then refinement until consecutive points are < 0.01 M apart, then the ends (β → 0) */
  const M = 1024, us = [];
  for (let k = 0; k <= M; k++) us.push(-2 + 4 * k / M);
  let pts = us.map(u => ({ u, p: pt(u) }));
  const on = x => typeof x.p === 'object';
  const dist = (p, q) => Math.hypot((p.alpha[0] + p.alpha[1]) / 2 - (q.alpha[0] + q.alpha[1]) / 2, (p.beta[0] + p.beta[1]) / 2 - (q.beta[0] + q.beta[1]) / 2);
  for (let pass = 0; pass < 30; pass++) {
    const nx = []; let any = false;
    for (let k = 0; k < pts.length; k++) {
      nx.push(pts[k]);
      if (k + 1 < pts.length) {
        const A1 = pts[k], B1 = pts[k + 1];
        const need = (on(A1) && on(B1) && dist(A1.p, B1.p) > 0.01) ||
          (on(A1) !== on(B1) && Math.min(...[A1, B1].filter(on).map(x => (x.p.beta[0] + x.p.beta[1]) / 2)) > 1e-4 && B1.u - A1.u > 1e-14);
        if (need) { const u = (A1.u + B1.u) / 2; nx.push({ u, p: pt(u) }); any = true; }
      }
    }
    pts = nx;
    if (!any) break;
  }
  const arc = pts.filter(on).map(x => x.p);
  /* traversal: upper half (β > 0) by increasing u, then lower half by decreasing u */
  const mid = X => (X[0] + X[1]) / 2;
  const poly = arc.map(p => ({ a: mid(p.alpha), b: mid(p.beta), w: Math.max(p.alpha[1] - p.alpha[0], p.beta[1] - p.beta[0]) / 2, u: p.u, r: p.r }))
    .concat(arc.slice().reverse().map(p => ({ a: mid(p.alpha), b: -mid(p.beta), w: Math.max(p.alpha[1] - p.alpha[0], p.beta[1] - p.beta[0]) / 2, u: p.u, r: p.r })));
  return { points: poly, maxHalfWidth: Math.max(...poly.map(p => p.w)), endBeta: Math.min(...arc.map(p => mid(p.beta))) };
}

/* pseudo-angle in [0, 4): monotone in the polar angle, + − × ÷ only */
const pang = (x, y) => { const d = Math.abs(x) + Math.abs(y), t = y / d; return x >= 0 ? (y >= 0 ? t : 4 + t) : 2 - t; };

/* the decided curve as a radial function about the origin; refuses unless the curve is star-shaped there */
function radialOf(curve) {
  let P = curve.points.map(p => ({ ...p, t: pang(p.a, p.b), rho: Math.hypot(p.a, p.b) }));
  /* the traversal (upper half left to right, lower half back) runs clockwise: reverse it, then rotate it to start at
     the smallest pseudo-angle */
  P = P.reverse();
  let k0 = 0; for (let k = 1; k < P.length; k++) if (P[k].t < P[k0].t) k0 = k;
  const S = P.slice(k0).concat(P.slice(0, k0));
  for (let k = 1; k < S.length; k++) if (!(S[k].t > S[k - 1].t)) throw new Error('the decided curve is not star-shaped about the origin');
  /* the signed radial distance of (x, y) from the curve, along the ray from the origin: the intersection with the edge */
  return (x, y) => {
    const t = pang(x, y);
    let lo = 0, hi = S.length;                                        /* first index with S[k].t > t */
    while (lo < hi) { const m = (lo + hi) >> 1; if (S[m].t > t) hi = m; else lo = m + 1; }
    const A1 = S[(lo - 1 + S.length) % S.length], B1 = S[lo % S.length];
    /* the ray s·(x, y)/|(x, y)| meets the segment A1B1 */
    const rr = Math.hypot(x, y), dx = x / rr, dy = y / rr;
    const ex = B1.a - A1.a, ey = B1.b - A1.b;
    const den = dx * ey - dy * ex;
    const sAlong = (A1.a * ey - A1.b * ex) / den;
    return rr - sAlong;
  };
}

/* ---------- the checks ---------- */
function loadMaps() {
  if (!fs.existsSync(MANIFEST)) die('corpus/bh-maps/manifest.json does not exist; run with --maps first');
  const man = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const raw = {}, pins = [];
  for (const [name, f] of Object.entries(man.files)) {
    const gz = fs.readFileSync(path.join(OUTDIR, name));
    const r = zlib.gunzipSync(gz);
    pins.push({ file: name, ok: sha256(gz) === f.sha256 && sha256(r) === f.rawSha256 && gz.length === f.bytes });
    raw[name] = r;
  }
  return { man, raw, pins };
}
const halfAt = (buf, p, c) => buf.readUInt16LE((p * 3 + c) * 2);

function checkSpin(key, maps, opts) {
  const m = mapOf(key), s = m.s, cosO = m.cos, sinO = m.sin;
  const a = spinD(s), res = m.deg === '17' ? { spin: s } : { spin: s, inclinationDeg: m.deg };
  const fate = maps.raw[fileName(key, 'fate')], L = [0, 1, 2].map(n => maps.raw[fileName(key, n)]);
  const risco = riscoFor(shadow, s);
  /* what the layers hold (a description for the viewer, not a check) */
  res.coverage = {};
  for (let n = 0; n < NCROSS; n++) {
    let any = 0, far = 0, withG = 0;
    for (let p = 0; p < N * N; p++) {
      const r = RAYS.fromHalf(halfAt(L[n], p, 0));
      if (r === r) { any++; if (r === Infinity) far++; if (RAYS.fromHalf(halfAt(L[n], p, 2)) === RAYS.fromHalf(halfAt(L[n], p, 2))) withG++; }
    }
    res.coverage['n' + n] = { pixels: any, beyond200M: far, withG };
  }
  /* 1. re-trace a deterministic sample: every 97th pixel */
  let sampled = 0, bitDiff = 0;
  const out = [0, 1, 2].map(() => new Uint16Array(N * N * 3)), fz = new Uint8Array(N * N);
  const traces = [];
  for (let p = 0; p < N * N; p += 97) {
    const i = p % N, j = (p - i) / N;
    const t = pixel(a, cosO, sinO, risco, i, j, out, null, fz);
    sampled++;
    let same = fz[p] === fate[p];
    for (let n = 0; n < NCROSS; n++) for (let c = 0; c < 3; c++) if (out[n][p * 3 + c] !== halfAt(L[n], p, c)) same = false;
    if (!same) bitDiff++;
    traces.push(t);
  }
  lap(s + " retrace");
  res.retrace = { sampled, bitIdentical: sampled - bitDiff, differ: bitDiff, verdict: bitDiff === 0 ? 'AGREES' : 'DISAGREES' };
  /* 2. the closed form: angular Mino times and the master equation, on the sample */
  let nCross = 0, maxDtAng = 0, maxDr = 0, worst = null;
  for (const t of traces) {
    if (!(t.k.eta > 0)) continue;
    const ang = RAYS.angularCrossingTimes(t.k, NCROSS);
    let rt = null;
    if (t.fate === 'escaped') rt = RAYS.turningPoint(t.k, t.rmin);
    t.crossings.forEach((c, n) => {
      if (!Number.isFinite(c.r)) return;
      nCross++;
      const dA = Math.abs(c.tau - ang[n]);
      if (dA > maxDtAng) maxDtAng = dA;
      const outgoing = c.pr > 0;
      const Ir = RAYS.radialMino(t.k, c.r, outgoing, outgoing || rt !== null ? rt : null);
      const dI = Math.abs(Ir - ang[n]);
      const Rs = Math.max(0, RAYS.Rpoly(t.k, c.r));
      const dr = Math.sqrt(Rs) * dI + Math.abs(4 * c.r * c.r * c.r) * dI * dI;
      if (dr > maxDr) { maxDr = dr; worst = { alpha: t.k.alpha, beta: t.k.beta, n, r: c.r }; }
    });
  }
  lap(s + " closed form");
  res.closedForm = { crossings: nCross, maxMinoTimeVsAngular: maxDtAng.toExponential(2), maxRadiusErrorM: maxDr.toExponential(2),
    worstAt: worst && { alpha: worst.alpha, beta: worst.beta, n: worst.n, r: Number(worst.r.toFixed(6)) },
    threshold: '1e-6 M', verdict: maxDr < 1e-6 ? 'AGREES' : 'DISAGREES' };
  /* 3. pointwise against the decided curve */
  const curve = decidedCurve(s, m.deg);
  lap(s + " curve");
  res.curve = { decidedPoints: curve.points.length, maxBoxHalfWidthM: curve.maxHalfWidth.toExponential(2), smallestEndBeta: curve.endBeta.toExponential(2) };
  res.pointwise = pointwise(a, cosO, sinO, curve, 1e-6, 720);
  lap(s + ' pointwise');
  res.bisected = bisectEdge(a, cosO, sinO, curve, 24);
  lap(s + ' bisected');
  /* 4. the map's shadow edge */
  res.texture = textureCheck(fate, curve, phase0Of(key));
  lap(s + ' texture');
  /* 6. convergence of the photon-ring images */
  /* the views search the band edge out to 8·P, not 1.5·P (Phase 2 deviation 1): below a steeply inclined shadow a ray crosses the near disk plane far out and again behind the hole, so the n = 1 band reaches past 1.5·P */
  res.convergence = m.deg === '17' ? convergence(a, curve, cosO, sinO) : convergence(a, curve, cosO, sinO, 8);
  lap(s + ' convergence');
  return { res, curve };
}

function pointwise(a, cosO, sinO, curve, eps, count, opts = {}) {
  const P = curve.points, step = Math.max(1, Math.floor(P.length / count));
  let tested = 0, fail = 0;
  const failures = [];
  for (let k = 0; k < P.length; k += step) {
    const p = P[k], rho = Math.hypot(p.a, p.b);
    if (!(eps * rho > 10 * p.w)) throw new Error('a decided box is too wide for ε');
    const inn = RAYS.trace(a, cosO, sinO, p.a * (1 - eps), p.b * (1 - eps), { tol: TOL, maxCross: 0 });
    const out = RAYS.trace(a, cosO, sinO, p.a * (1 + eps), p.b * (1 + eps), { tol: TOL, maxCross: 0 });
    tested++;
    if (inn.fate !== 'captured' || out.fate !== 'escaped') { fail++; if (failures.length < 3) failures.push({ alpha: p.a, beta: p.b, inner: inn.fate, outer: out.fate }); }
  }
  return { epsilon: eps, points: tested, rule: 'the ray at (1 − ε)·P captured and at (1 + ε)·P escaped, P proven on the decided curve', fail, firstFailures: failures,
    verdict: fail === 0 ? 'AGREES' : 'DISAGREES', ...opts };
}

function edgeAlong(a, cosO, sinO, p, it = 44) {
  let lo = 1 - 1e-3, hi = 1 + 1e-3;
  for (let k = 0; k < it; k++) {
    const m = (lo + hi) / 2;
    const t = RAYS.trace(a, cosO, sinO, p.a * m, p.b * m, { tol: TOL, maxCross: 0 });
    if (t.fate === 'captured') lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
function bisectEdge(a, cosO, sinO, curve, count) {
  const P = curve.points, step = Math.floor(P.length / count);
  let maxD = 0; const radii = [];
  for (let k = 0; k < count; k++) {
    const p = P[k * step], rho = Math.hypot(p.a, p.b), t = edgeAlong(a, cosO, sinO, p);
    const d = Math.abs(t - 1) * rho; if (d > maxD) maxD = d;
    radii.push(t * rho);
  }
  return { points: count, resolution: '2e-3 / 2^44 relative', maxDistanceToDecidedM: maxD.toExponential(2), radii };
}

/* Phase 0's extents for a map: the 17° sample spins, or the views (certs/bh-shadow.json curveViews) */
function phase0Of(key) { const m = mapOf(key); return m.deg === '17' ? shadow.enclosures.curveAt17.spins[m.s] : shadow.enclosures.curveViews.views[key]; }
function textureCheck(fate, curve, ph0) {
  const dist = radialOf(curve);
  let inside = 0, mismatch = 0, unjudged = 0, captured = 0;
  let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity;
  const BAND = 1e-4;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const p = j * N + i, x = alphaOf(i), y = betaOf(j);
    const cap = (fate[p] & 128) !== 0;
    if (cap) { captured++; aMin = Math.min(aMin, x); aMax = Math.max(aMax, x); bMin = Math.min(bMin, y); bMax = Math.max(bMax, y); }
    const d = dist(x, y);
    if (Math.abs(d) < BAND) { unjudged++; continue; }
    if (d < 0) inside++;
    if ((d < 0) !== cap) mismatch++;
  }
  const W = [aMax - aMin, aMax - aMin], H = [bMax - bMin, bMax - bMin];
  const slack = 4e-4;                                              /* (pitch/2)²/(2·4 M), twice: the row/column offset of an extreme */
  const res = { capturedPixels: captured, insideDecidedCurve: inside, mismatched: mismatch, unjudgedWithin1e4M: unjudged };
  const ext = {};
  const meets = (lo, hi, enc) => lo <= enc[1] && enc[0] <= hi;
  if (ph0) {
    for (const [key, X] of [['W', W], ['H', H]]) {
      const lo = X[0] - slack, hi = X[1] + 2 * PITCH, enc = ivOf(ph0[key]);
      ext[key] = { fromMap: Number(X[0].toFixed(6)), trueExtentIn: '[' + lo.toFixed(4) + ', ' + hi.toFixed(4) + ']', phase0: ph0[key], meets: meets(lo, hi, enc) };
    }
    const dlo = (W[0] + H[0]) / 2 - slack, dhi = (W[1] + H[1]) / 2 + 2 * PITCH, encd = ivOf(ph0.d);
    ext.d = { fromMap: Number(((W[0] + H[0]) / 2).toFixed(6)), trueExtentIn: '[' + dlo.toFixed(4) + ', ' + dhi.toFixed(4) + ']', phase0: ph0.d, meets: meets(dlo, dhi, encd) };
  }
  res.extents = ext;
  res.verdict = mismatch === 0 && Object.values(ext).every(e => e.meets) ? 'AGREES' : 'DISAGREES';
  return res;
}

function convergence(a, curve, cosO = COS17, sinO = SIN17, tOut = 1.5) {
  const P = curve.points, spokes = 8, step = Math.floor(P.length / spokes), rows = [];
  let ok = true;
  for (let k = 0; k < spokes; k++) {
    const p = P[k * step], rho = Math.hypot(p.a, p.b);
    const countAt = (t, cap) => RAYS.trace(a, cosO, sinO, p.a * t, p.b * t, { tol: TOL, maxCross: 0, stopAfter: cap }).count;
    const tLo = 1 + 1e-11, tHi = tOut;
    const ds = [];
    for (let n = 1; n <= 4; n++) {
      if (countAt(tLo, n + 1) < n + 1 || countAt(tHi, n + 1) >= n + 1) { ds.push(null); continue; }
      let lo = tLo, hi = tHi;
      for (let it = 0; it < 48; it++) { const m = (lo + hi) / 2; if (countAt(m, n + 1) >= n + 1) lo = m; else hi = m; }
      ds.push((lo - 1) * rho);
    }
    const gam = RAYS.lyapunov(a, p.r);
    const ratios = ds.slice(1).map((d, i) => (d && ds[i] ? d / ds[i] : null));
    const dec = ds.every(d => d !== null) && ds.every((d, i) => i === 0 || d < ds[i - 1]) && ds[3] < PITCH;
    let schw = null;
    if (a === 0) schw = ratios.slice(1).every(r => r !== null && Math.abs(r / Math.exp(-Math.PI) - 1) < 0.05);
    if (!dec || schw === false) ok = false;
    rows.push({ at: { alpha: Number(p.a.toFixed(4)), beta: Number(p.b.toFixed(4)), rOrbit: Number(p.r.toFixed(4)) },
      distanceM: ds.map(d => (d === null ? null : d.toExponential(3))), ratios: ratios.map(r => (r === null ? null : Number(r.toFixed(4)))),
      expMinusGamma: Number(Math.exp(-gam).toFixed(4)), decreasingAndBelowPixel: dec, ...(schw === null ? {} : { withinFivePercentOfExpMinusPi: schw }) });
  }
  return { spokes: rows, rule: 'the outer edge of the n-th lensing band (crossings drop below n + 1) along a spoke through a decided point, n = 1…4: strictly decreasing, the last below one pixel; at a = 0 successive ratios within 5% of e^(−π) for n ≥ 2', ...(tOut === 1.5 ? {} : { searchedOutTo: tOut + ' × P (Phase 2 deviation 1)' }), verdict: ok ? 'AGREES' : 'DISAGREES' };
}

/* a small fate-only map at any (a, θo), for the red control */
function smallFateMap(a, cosO, sinO, n) {
  const pitch = 2 * HALF / n, map = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const t = RAYS.trace(a, cosO, sinO, -HALF + (i + 0.5) * pitch, HALF - (j + 0.5) * pitch, { tol: TOL, maxCross: 0 });
    map[j * n + i] = t.fate === 'captured' ? 128 : 0;
  }
  return { map, pitch };
}
function classify(map, n, pitch, curve) {
  const dist = radialOf(curve);
  let mismatch = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const d = dist(-HALF + (i + 0.5) * pitch, HALF - (j + 0.5) * pitch);
    if (Math.abs(d) < 1e-4) continue;
    if ((d < 0) !== ((map[j * n + i] & 128) !== 0)) mismatch++;
  }
  return mismatch;
}

function buildRecord() {
  const t0 = Date.now();
  const maps = loadMaps();
  const pinsOk = maps.pins.every(p => p.ok);
  if (maps.man.method.code["instruments/kerr/rays.js"] !== shaFile("instruments/kerr/rays.js")) die('rays.js changed since the maps were traced: run --maps');
  const per = {}, curves = {};
  for (const s of SPINS) { const { res, curve } = checkSpin(s, maps); per[s] = res; curves[s] = curve; }
  const perView = {};
  for (const v of VIEWS) { const k = viewKey(v); const { res, curve } = checkSpin(k, maps); perView[k] = res; curves[k] = curve; }
  /* 5. Schwarzschild: the bisected edge against √27 */
  const s27 = Math.sqrt(27);
  const dev = Math.max(...per['0'].bisected.radii.map(r => Math.abs(r - s27)));
  const schw = { sqrt27: '[5.196152422706631, 5.196152422706633] (Phase 0)', maxTracedEdgeMinusSqrt27M: dev.toExponential(2), threshold: '1e-8 M', verdict: dev < 1e-8 ? 'AGREES' : 'DISAGREES' };

  /* red controls */
  const reds = [];
  const red = (control, expect, got) => reds.push({ control, expected: expect, got, ok: expect === got });
  {
    const fate0 = maps.raw[fileName('0', 'fate')];
    const t = textureCheck(fate0, curves['47/50'], phase0Of('47/50'));
    red('the a = 0 map against the a = 47/50 decided curve (wrong spin): ' + t.mismatched + ' pixels mismatched', 'DISAGREES', t.verdict);
  }
  {
    const c25 = 0.9063077870366499, s25 = 0.42261826174069944;     /* cos 25°, sin 25° */
    const sm = smallFateMap(0.94, c25, s25, 128);
    const mm = classify(sm.map, 128, sm.pitch, curves['47/50']);
    red('a 128² map at a = 47/50, θo = 25° (wrong inclination) against the 17° decided curve: ' + mm + ' pixels mismatched', 'DISAGREES', mm > 0 ? 'DISAGREES' : 'AGREES');
    const pw = pointwise(0.94, c25, s25, curves['47/50'], 1e-6, 72);
    red('rays at θo = 25° at the a = 47/50, 17° decided points (' + pw.fail + ' of ' + pw.points + ' fail)', 'DISAGREES', pw.verdict);
  }
  {
    const pw = pointwise(0.5, COS17, SIN17, curves['47/50'], 1e-6, 72);
    red('rays at a = 1/2 at the a = 47/50 decided points (wrong spin; ' + pw.fail + ' of ' + pw.points + ' fail)', 'DISAGREES', pw.verdict);
  }
  {
    const name = fileName(DEFAULT_SPIN, 0);
    const gz = Buffer.from(fs.readFileSync(path.join(OUTDIR, name)));
    gz[Math.floor(gz.length / 2)] ^= 1;
    red('one byte of ' + name + ' flipped: the manifest pin', 'fails', sha256(gz) === maps.man.files[name].sha256 ? 'holds' : 'fails');
  }
  {
    const s26 = Math.sqrt(26);
    const d26 = Math.min(...per['0'].bisected.radii.map(r => Math.abs(r - s26)));
    red('a planted √26 for the Schwarzschild edge', 'DISAGREES', d26 < 1e-8 ? 'AGREES' : 'DISAGREES');
  }
  {
    /* Phase 2's two: a view against the other view's decided curve */
    const [v45, v80] = VIEWS.map(viewKey);
    const t = textureCheck(maps.raw[fileName(v45, 'fate')], curves[v80], phase0Of(v80));
    red('the 45° map against the 80° decided curve (wrong view): ' + t.mismatched + ' pixels mismatched', 'DISAGREES', t.verdict);
    const pw = pointwise(0.94, VIEWS[0].cos, VIEWS[0].sin, curves[v80], 1e-6, 72);
    red('rays at 45° at the 80° decided points (wrong view; ' + pw.fail + ' of ' + pw.points + ' fail)', 'DISAGREES', pw.verdict);
  }
  const badReds = reds.filter(r => !r.ok);
  if (badReds.length) die('red controls not as named: ' + JSON.stringify(badReds));
  for (const s of SPINS) delete per[s].bisected.radii;
  for (const k of Object.keys(perView)) delete perView[k].bisected.radii;

  const verdicts = [pinsOk ? 'AGREES' : 'DISAGREES', schw.verdict];
  for (const s of SPINS) for (const k of ['retrace', 'closedForm', 'pointwise', 'texture', 'convergence']) verdicts.push(per[s][k].verdict);
  for (const k0 of Object.keys(perView)) for (const k of ['retrace', 'closedForm', 'pointwise', 'texture', 'convergence']) verdicts.push(perView[k0][k].verdict);
  const all = verdicts.every(v => v === 'AGREES');
  const man = maps.man;
  return {
    what: 'M87*: the lensing maps of Phase 1 (COMPUTED, double precision, stored as half floats) graded against Phase 0\'s decided Kerr curve and against Gralla & Lupsasca\'s closed form',
    standing: 'COMPUTED: the maps draw dashed; only the Phase 0 curve draws solid. AGREES means the computed layer reached the premise ladder\'s "verified" rung against the decided one, at the stated resolution; it is never CERTIFIED',
    verdict: all ? 'AGREES' : 'DISAGREES',
    preregistration: { path: PREREG, sha256: shaFile(PREREG), section: 'Phase 1', committedBeforeAnyRay: '455fa5fb' },
    code: Object.fromEntries(['instruments/kerr/rays.js', 'instruments/kerr/kerr.js', 'tools/run-bh-maps.js', 'instruments/interval/interval.js',
      'instruments/interval/transcendental.js', 'instruments/interval/algebraic.js', 'instruments/interval/rational.js'].map(f => [f, shaFile(f)])),
    phase0: { record: SHADOW, sha256: shaFile(SHADOW) },
    maps: { manifest: 'corpus/bh-maps/manifest.json', manifestSha256: shaFile('corpus/bh-maps/manifest.json'), files: Object.keys(man.files).length,
      totalBytes: man.totalBytes, grid: man.grid, spins: man.spins, defaultSpin: man.defaultSpin, camera: man.camera, views: man.views, disk: man.disk },
    words: { AGREES: 'the check holds at its stated resolution', DISAGREES: 'it fails: the map (or the control) is not the decided geometry' },
    checks: {
      pins: { files: maps.pins.length, verdict: pinsOk ? 'AGREES' : 'DISAGREES', rule: 'every stored file and its decompressed bytes match the manifest\'s sha256' },
      schwarzschild: schw,
      perSpin: per,
      perView
    },
    redControls: reds,
    timing: { ms: Date.now() - t0 }
  };
}

(async () => {
  if (MODE === 'maps') { await buildMaps(); return; }
  const rec = buildRecord();
  const strip = o => { const c = JSON.parse(JSON.stringify(o)); delete c.timing; return JSON.stringify(c, null, 1); };
  const summary = () => SPINS.map(s => s + ': pointwise ' + rec.checks.perSpin[s].pointwise.verdict + ', texture ' + rec.checks.perSpin[s].texture.mismatched + ' mismatched').join('; ')
    + '; views ' + Object.keys(rec.checks.perView).map(k => k + '° ' + ['retrace', 'closedForm', 'pointwise', 'texture', 'convergence'].map(c => rec.checks.perView[k][c].verdict).join('/')).join(', ');
  if (MODE === 'check') {
    if (!fs.existsSync(OUT)) die(OUT + ' does not exist; run without --check first');
    if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(rec)) die('certs/bh-maps-check.json does not re-derive identically');
    if (rec.verdict !== 'AGREES') die('the maps DISAGREE with the decided layer');
    console.log('bh-maps: PASS — the record re-derives; the maps AGREE with Phase 0 (' + summary() + '); ' + rec.redControls.length + ' red controls as named (' + Math.round(rec.timing.ms / 1000) + ' s)');
  } else {
    fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
    console.log('wrote certs/bh-maps-check.json: ' + rec.verdict + ' (' + summary() + '); ' + rec.redControls.length + ' red controls (' + Math.round(rec.timing.ms / 1000) + ' s)');
  }
})().catch(e => die(e.stack || String(e)));
