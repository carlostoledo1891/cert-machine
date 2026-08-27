/* test-cap.js — the battery for mfg-cap.

   Structure, in the order a sceptic should read it:

     I  the interval library is correct           (vs EXACT BigInt rationals)
     S  the solver solves the stated PDE          (three INDEPENDENT witnesses)
     P  the proof proves                          (radii polynomial, enclosures)
     B  the bifurcation is where theory says      (and the proof refuses there)
     M  multiplicity by disjoint enclosure       (two solutions, one parameter set)
     X  falsifiers                                (each must turn its own target red)

   The S block exists because this project's first version had a machine-zero
   Fourier residual at a point that did NOT solve the PDE: p = u' is an ODD
   sequence and was being extended evenly, so the Galerkin system was simply a
   different system. No residual check could have caught it — only evaluating
   the PDE pointwise, and the Gibbs identity, both independent of the solver.
   That is why three witnesses are kept even though one would "pass".

   MIT licensed. Part of mfg-cap. */
'use strict';
const path = require('path');
/* THE KERNELS MOVED INTO core/ (migration phase 6) and this project's kernel/ dissolved with
   them: mfg1d.js and validate.js are core/mfg/, and interval.js was only a re-export of
   core/interval/interval.js, so it went away entirely. Resolved through the same upward search
   the rational import below already uses — a marker, not a count (C52). `upward` is a function
   declaration and is hoisted, so it is callable here. */
const I = require(upward(__dirname, path.join('core', 'interval', 'interval.js')));
const M = require(upward(__dirname, path.join('core', 'mfg', 'mfg1d.js')));
const V = require(upward(__dirname, path.join('core', 'mfg', 'validate.js')));
const TP = M.TWO_PI;

let fails = 0;
function check(name, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}
function mulberry32(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const t0 = Date.now();
console.log('kernels: ' + path.dirname(upward(__dirname, path.join('core', 'mfg', 'mfg1d.js'))) + '\n');

/* ================= I · the interval library, against exact rationals ======= */
/* The rational arithmetic used to cross-check the intervals comes from the
   shared toolkit rather than a local copy — this battery once carried its own,
   which made three implementations in the repository. eqcert/tests/
   test-single-source.js is the gate that found it. */
/* UPWARD SEARCH, not a fixed ascent. Three layouts, no single count correct in all:
   monorepo research/mfg-cap/<dir> · shared export mfg-cap/<dir> · standalone with eqcert vendored
   beside the project. Measured 2026-07-29: the fixed form pointed ABOVE the export root, so the
   PUBLIC `make check` (the published repo's own Makefile) died MODULE_NOT_FOUND. Fails BY NAME. */
function upward(from, rel) {
  const _fs = require('fs'), _p = require('path');
  for (let d = from; ; d = _p.dirname(d)) {
    const hit = _p.join(d, rel);
    if (_fs.existsSync(hit)) return hit;
    if (_p.dirname(d) === d) break;
  }
  throw new Error('could not find ' + rel + ' in any directory above ' + from);
}
const Q = require(upward(__dirname, path.join('core', 'interval', 'index.js'))).rational;
const toRat = Q.fromDouble, rAdd = Q.add, rSub = Q.sub, rMul = Q.mul, rDiv = Q.div, rCmp = Q.cmp;

function intervalSelfTest(add, sub, mul, div) {
  const rng = mulberry32(20260722);
  const sc = [1, 1e-9, 1e9, 1e-4];
  for (let t = 0; t < 3000; t++) {
    const a = (rng() - 0.5) * sc[t % 4];
    let b = (rng() - 0.5) * sc[(t + 1) % 4];
    if (b === 0) b = 0.5;
    const ra = toRat(a), rb = toRat(b);
    const cases = [[add([a, a], [b, b]), rAdd(ra, rb)], [sub([a, a], [b, b]), rSub(ra, rb)],
                   [mul([a, a], [b, b]), rMul(ra, rb)], [div([a, a], [b, b]), rDiv(ra, rb)]];
    for (const [iRes, exact] of cases)
      if (rCmp(toRat(iRes[0]), exact) > 0 || rCmp(exact, toRat(iRes[1])) > 0) return t;
  }
  return -1;
}
check('I1 nextUp/nextDown unit facts',
  I.nextUp(1) === 1 + Number.EPSILON && I.nextDown(1) === 1 - Number.EPSILON / 2 &&
  I.nextUp(0) === Number.MIN_VALUE && I.nextUp(I.nextDown(3.7)) === 3.7);
{
  const bad = intervalSelfTest(I.add, I.sub, I.mul, I.div);
  check('I2 every interval op encloses the EXACT rational result', bad < 0,
    bad < 0 ? '12000 ops over four magnitude scales' : 'first miss at op ' + bad);
}
check('I3 the norm is a Banach algebra norm: ||f*g|| <= ||f|| ||g||', (() => {
  const rng = mulberry32(5), nu = 1.05;
  for (let t = 0; t < 200; t++) {
    const K = 6;
    const f = [], g = [];
    for (let k = 0; k <= K; k++) { f.push(I.iv((rng() - 0.5) * 2)); g.push(I.iv((rng() - 0.5) * 2)); }
    const h = V.convI(f, g, 2 * K, 'e', 'e');
    const nf = I.mag(V.normNu(f, nu, true)), ng = I.mag(V.normNu(g, nu, true));
    const nh = I.mag(V.normNu(h, nu, true));
    if (nh > nf * ng * (1 + 1e-12)) return false;
  }
  return true;
})(), '200 random pairs');

/* ================= S · the solver solves the stated PDE =================== */
/* Three witnesses, each independent of the solver's own residual. */
function witnesses(sigma, c, A, N) {
  const P = M.makeProblem({ sigma, c, A, N });
  const s = M.solve(P);
  const { rho, a, b } = M.unpack(s.x, N);
  let wH = 0, wF = 0, wFlux = 0;
  const G = 2048;
  for (let i = 0; i < G; i++) {
    const t = i / G;
    let u1 = 0, u2 = 0, m = b[0], m1 = 0, m2 = 0;
    for (let k = 1; k <= N; k++) {
      const C = Math.cos(TP * k * t), S = Math.sin(TP * k * t), w = TP * k;
      u1 += -2 * a[k] * w * S; u2 += -2 * a[k] * w * w * C;
      m += 2 * b[k] * C; m1 += -2 * b[k] * w * S; m2 += -2 * b[k] * w * w * C;
    }
    const Vx = A * Math.cos(TP * t);
    wH = Math.max(wH, Math.abs(-sigma * u2 + 0.5 * u1 * u1 + rho - c * m - Vx));
    wF = Math.max(wF, Math.abs(-sigma * m2 - (m1 * u1 + m * u2)));
    wFlux = Math.max(wFlux, Math.abs(sigma * m1 + m * u1));
  }
  const g = M.evalOnGrid(s.x, P, 4096);
  const wv = g.us.map(u => Math.exp(-u / sigma));
  const Z = wv.reduce((x, y) => x + y, 0) / wv.length;
  let gib = 0;
  for (let i = 0; i < wv.length; i++) gib = Math.max(gib, Math.abs(g.ms[i] - wv[i] / Z));
  const mass = g.ms.reduce((x, y) => x + y, 0) / g.ms.length;
  return { s, wH, wF, wFlux, gib, mass, P };
}
{
  let wH = 0, wF = 0, gib = 0, mass = 0;
  for (const [sg, c, A, N] of [[0.5, 1, 1, 16], [0.3, 2, 1.5, 24], [0.2, 1, 2, 32]]) {
    const w = witnesses(sg, c, A, N);
    wH = Math.max(wH, w.wH); wF = Math.max(wF, w.wF); gib = Math.max(gib, w.gib);
    mass = Math.max(mass, Math.abs(w.mass - 1));
  }
  check('S1 witness 1/3 — the HJB equation holds POINTWISE on a fine grid', wH < 1e-12, wH.toExponential(2));
  check('S2 witness 2/3 — the Fokker-Planck equation holds POINTWISE', wF < 1e-11, wF.toExponential(2));
  check('S3 witness 3/3 — the Gibbs identity m = e^{-u/sigma}/Z, never used by the solver', gib < 1e-12, gib.toExponential(2));
  check('S4 mass is exactly normalised', mass < 1e-13, mass.toExponential(2));
}
check('S5 the reduced (Hopf-Cole) equation is the one the literature states', (() => {
  /* -2σ²w'' + Vw + (c/Z)w³ = ρw with w = e^{−u/2σ}. Settled by COMPUTATION:
     the opposite sign convention (which this project first wrote down) fails
     by O(1) on the same solution. Recorded in docs/FINDINGS_LIT_CAP.md. */
  const sigma = 0.5, c = 1, A = 1, N = 24;
  const P = M.makeProblem({ sigma, c, A, N }), s = M.solve(P);
  const { rho, a } = M.unpack(s.x, N);
  const G = 4096, ws = [];
  let Z = 0;
  for (let i = 0; i < G; i++) {
    const t = i / G; let u = 0;
    for (let k = 1; k <= N; k++) u += 2 * a[k] * Math.cos(TP * k * t);
    const w = Math.exp(-u / (2 * sigma)); ws.push(w); Z += w * w;
  }
  Z /= G;
  let right = 0, wrong = 0;
  const h = 1 / G;
  for (let i = 0; i < G; i++) {
    const w = ws[i], w2 = (ws[(i + 1) % G] - 2 * ws[i] + ws[(i - 1 + G) % G]) / (h * h);
    const Vx = A * Math.cos(TP * (i / G));
    right = Math.max(right, Math.abs(-2 * sigma * sigma * w2 + Vx * w + (c / Z) * w * w * w - rho * w));
    wrong = Math.max(wrong, Math.abs(-2 * sigma * sigma * w2 + rho * w - (c / Z) * w * w * w - Vx * w));
  }
  return right < 1e-5 && wrong > 1e-2;
})(), 'the stated form holds; the flipped one fails by O(1)');

/* ================= P · the proof proves ================================== */
{
  let ok = true, worstR = 0, worstZ1 = 0;
  for (const [sg, c, A, N] of [[0.5, 1, 1, 12], [0.5, 1, 1, 16], [0.3, 1, 1, 16], [0.3, 2, 1.5, 20], [1.0, 0.5, 0.5, 12]]) {
    const P = M.makeProblem({ sigma: sg, c, A, N }), s = M.solve(P);
    const r = V.validate(s.x, P, { nu: 1.05 });
    if (!r.ok) { ok = false; break; }
    worstR = Math.max(worstR, r.r); worstZ1 = Math.max(worstZ1, r.Z1);
  }
  check('P1 the monotone (Lasry-Lions) case is ENCLOSED across five parameter sets', ok,
    'worst radius ' + worstR.toExponential(2) + ', worst Z1 ' + worstZ1.toFixed(4));
}
check('P2 the contraction bounds are internally consistent (p(r) < 0 at the reported r)', (() => {
  const P = M.makeProblem({ sigma: 0.5, c: 1, A: 1, N: 16 }), s = M.solve(P);
  const r = V.validate(s.x, P, { nu: 1.05 });
  if (!r.ok) return false;
  const pr = 0.5 * r.Z2 * r.r * r.r - (1 - r.Z1) * r.r + r.Y0;
  return pr < 0 && r.Z1 < 1 && r.rMin <= r.r && r.r <= r.rMax;
})());
check('P3 Z1 dominates a direct numerical estimate of ||I - A DPhi|| (the bound is not optimistic)', (() => {
  /* Independent lower estimate: apply I − A·DΦ to random unit vectors in the
     finite block and measure the weighted-norm growth. The certified Z1 must
     exceed every sample; if it did not, the bound would be wrong. */
  const N = 12, nu = 1.05;
  const P = M.makeProblem({ sigma: 0.5, c: 1, A: 1, N }), s = M.solve(P);
  const r = V.validate(s.x, P, { nu });
  if (!r.ok) return false;
  const n = 2 * N + 1;
  const J = M.jacobian(s.x, P);
  const AN = M.inverse(J, n);
  const rng = mulberry32(11);
  let worst = 0;
  for (let t = 0; t < 300; t++) {
    const v = new Float64Array(n);
    for (let i = 0; i < n; i++) v[i] = rng() - 0.5;
    let nv = 0;
    for (let i = 0; i < n; i++) nv += (i === 0 ? 1 : 2 * Math.pow(nu, i <= N ? i : i - N)) * Math.abs(v[i]);
    const Jv = new Float64Array(n);
    for (let i = 0; i < n; i++) { let s2 = 0; for (let j = 0; j < n; j++) s2 += J[i * n + j] * v[j]; Jv[i] = s2; }
    const AJv = new Float64Array(n);
    for (let i = 0; i < n; i++) { let s2 = 0; for (let j = 0; j < n; j++) s2 += AN[i * n + j] * Jv[j]; AJv[i] = s2; }
    let d = 0;
    for (let i = 0; i < n; i++) d += (i === 0 ? 1 : 2 * Math.pow(nu, i <= N ? i : i - N)) * Math.abs(v[i] - AJv[i]);
    worst = Math.max(worst, d / nv);
  }
  return r.Z1 >= worst;
})(), 'certified Z1 >= sampled defect over 300 random directions');
check('P4 the density is certified POSITIVE over the whole enclosure', (() => {
  const P = M.makeProblem({ sigma: 0.3, c: 1, A: 2, N: 24 }), s = M.solve(P);
  const r = V.validate(s.x, P, { nu: 1.03 });
  if (!r.ok) return false;
  const pos = V.certifyPositivity(s.x, P, r.r);
  return pos.positive && pos.minM > 0;
})());

/* ================= B · the bifurcation, and refusal at it ================= */
const SG = 0.5, NB = 20, mk = c => M.makeProblem({ sigma: SG, c, A: 0, NB, N: NB });
check('B1 the constant state loses invertibility at c* = -sigma^2 (2 pi)^2 (predicted, then measured)', (() => {
  const cStar = -SG * SG * TP * TP;
  const det = c => {
    const P = M.makeProblem({ sigma: SG, c, A: 0, N: NB });
    const x = new Float64Array(2 * NB + 1); x[0] = c;
    const J = M.jacobian(x, P), n = 2 * NB + 1;
    const A2 = Float64Array.from(J); let d = 1;
    for (let k = 0; k < n; k++) {
      let pr = k, mx = Math.abs(A2[k * n + k]);
      for (let rr = k + 1; rr < n; rr++) { const v = Math.abs(A2[rr * n + k]); if (v > mx) { mx = v; pr = rr; } }
      if (mx === 0) return 0;
      if (pr !== k) { for (let cc = 0; cc < n; cc++) { const t = A2[k * n + cc]; A2[k * n + cc] = A2[pr * n + cc]; A2[pr * n + cc] = t; } d = -d; }
      d *= A2[k * n + k];
      for (let rr = k + 1; rr < n; rr++) { const f = A2[rr * n + k] / A2[k * n + k]; if (!f) continue; for (let cc = k; cc < n; cc++) A2[rr * n + cc] -= f * A2[k * n + cc]; }
    }
    return d;
  };
  return det(cStar + 0.02) > 0 && det(cStar - 0.02) < 0;
})(), 'c* = ' + (-SG * SG * TP * TP).toFixed(4) + ', determinant changes sign across it');
check('B2 the proof REFUSES at the bifurcation, where no enclosure can exist', (() => {
  const cStar = -SG * SG * TP * TP;
  const P = M.makeProblem({ sigma: SG, c: cStar, A: 0, N: NB });
  const x = new Float64Array(2 * NB + 1); x[0] = cStar;
  const r = V.validate(x, P, { nu: 1.02 });
  return !r.ok;                       /* singular linearisation => must refuse */
})(), 'a verifier that certified here would be broken');

/* ================= M · multiplicity, by disjoint enclosure ================ */
let MULT = null;
check('M1 two solutions at the SAME parameters, in DISJOINT certified balls', (() => {
  const mkc = c => M.makeProblem({ sigma: SG, c, A: 0, N: NB });
  const c0 = -10.5, cT = -12, nu = 1.02;
  const seed = new Float64Array(2 * NB + 1); seed[0] = c0; seed[1] = -SG * 0.35; seed[NB + 1] = 0.35;
  const st = M.solve(mkc(c0), { x0: seed, maxIter: 200 });
  const br = M.continueBranch(mkc, c0, cT, 24, st.x);
  if (!br.ok) return false;
  const P = mkc(cT);
  const rb = V.validate(br.x, P, { nu });
  const triv = new Float64Array(2 * NB + 1); triv[0] = cT;
  const rt = V.validate(triv, P, { nu });
  if (!rb.ok || !rt.ok) return false;
  const un = M.unpack(br.x, NB);
  let sep = Math.abs(cT - br.x[0]);
  for (let k = 1; k <= NB; k++) {
    sep += 2 * Math.pow(nu, k) * Math.abs(TP * k * un.a[k]);
    sep += 2 * Math.pow(nu, k) * Math.abs(un.b[k]);
  }
  const posb = V.certifyPositivity(br.x, P, rb.r);
  MULT = { cT, sep, rb: rb.r, rt: rt.r, a1: un.a[1], minM: posb.minM };
  return sep > rb.r + rt.r && posb.positive;
})(), MULT ? ('c = ' + MULT.cT + ': separation ' + MULT.sep.toFixed(3) + ' >> r1+r2 = ' +
  (MULT.rb + MULT.rt).toExponential(2) + ', both densities certified positive') : 'see above');
check('M2 the multiplicity regime is exactly where Lasry-Lions does NOT apply', (() => {
  /* c < 0 is anti-monotone: the coupling F(m) = c m is DEcreasing, so the
     classical uniqueness theorem has no content there. This is not a
     counterexample to it — it is the region the theorem never claimed. */
  return MULT && MULT.cT < 0;
})(), 'coupling c < 0 is anti-monotone (herding), uniqueness is not claimed there');

/* ================= X · falsifiers ======================================== */
console.log('\n    executing falsifiers');
let reds = 0; const redTotal = 6;
{
  const thinMul = (a, b) => { const p = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]]; return [Math.min(...p), Math.max(...p)]; };
  const bad = intervalSelfTest(I.add, I.sub, thinMul, I.div);
  if (bad >= 0) { reds++; console.log('       RED ok  X1 dropping the outward widening breaks the exact-rational enclosure (op ' + bad + ')'); }
  else console.log('       RED FAIL  X1 the self-test has no power');
}
{
  /* the parity bug that was actually live: extend p EVENLY and the pointwise
     PDE must break even though the Fourier residual stays machine-zero */
  const sigma = 0.5, c = 1, A = 1, N = 16;
  const P = M.makeProblem({ sigma, c, A, N });
  const s = M.solve(P);
  const { rho, a, b } = M.unpack(s.x, N);
  /* rebuild the residual with the WRONG (even) extension of p */
  const p = M.pOf(a);
  const ppWrong = M.conv(p, p, N, 'e', 'e');
  const ppRight = M.conv(p, p, N, 'o', 'o');
  let diff = 0;
  for (let k = 0; k <= N; k++) diff = Math.max(diff, Math.abs(ppWrong[k] - ppRight[k]));
  if (diff > 1e-3) { reds++; console.log('       RED ok  X2 even-extending p (the live bug) changes the equations by ' + diff.toExponential(2)); }
  else console.log('       RED FAIL  X2 parity does not matter — the witness set is not testing it');
}
{
  /* a candidate that is NOT a solution must be refused */
  const P = M.makeProblem({ sigma: 0.5, c: 1, A: 1, N: 16 });
  const s = M.solve(P);
  const bad = Float64Array.from(s.x); bad[1] += 0.05;
  const r = V.validate(bad, P, { nu: 1.05 });
  /* Newton-Kantorovich may still certify a nearby TRUE solution, but then the
     radius must be at least the size of the perturbation — it may never
     certify a tiny ball around a point that is not near a solution. */
  const honest = !r.ok || r.r > 1e-3;
  if (honest) { reds++; console.log('       RED ok  X3 a perturbed candidate is refused, or enclosed only in a ball big enough to contain the true solution (' + (r.ok ? 'r=' + r.r.toExponential(2) : r.why) + ')'); }
  else console.log('       RED FAIL  X3 certified a tiny ball around a non-solution');
}
{
  /* too few modes: the tail bound must fail rather than silently pass */
  const P = M.makeProblem({ sigma: 0.02, c: 4, A: 4, N: 6 });
  const s = M.solve(P);
  const r = V.validate(s.x, P, { nu: 1.05 });
  if (!r.ok) { reds++; console.log('       RED ok  X4 an under-resolved instance is REFUSED (' + r.why.slice(0, 46) + ')'); }
  else console.log('       RED FAIL  X4 certified an under-resolved instance, r=' + r.r.toExponential(2));
}
{
  /* the positivity certificate must refuse when the density really does dip */
  const P = M.makeProblem({ sigma: 0.5, c: 1, A: 1, N: 16 });
  const s = M.solve(P);
  const pos = V.certifyPositivity(s.x, P, 10);          /* absurd radius */
  if (!pos.positive) { reds++; console.log('       RED ok  X5 positivity is refused when the enclosure is too wide to exclude m <= 0'); }
  else console.log('       RED FAIL  X5 claimed positivity from an enclosure that cannot support it');
}
{
  /* Z2 must scale with ||A||: halving sigma must not leave the bounds unchanged */
  const P1 = M.makeProblem({ sigma: 0.5, c: 1, A: 1, N: 16 });
  const P2 = M.makeProblem({ sigma: 0.25, c: 1, A: 1, N: 16 });
  const r1 = V.validate(M.solve(P1).x, P1, { nu: 1.05 });
  const r2 = V.validate(M.solve(P2).x, P2, { nu: 1.05 });
  if (r1.ok && r2.ok && r2.Z1 > r1.Z1 * 1.2) { reds++; console.log('       RED ok  X6 the bounds respond to the problem: halving sigma raises Z1 ' + r1.Z1.toFixed(4) + ' -> ' + r2.Z1.toFixed(4)); }
  else console.log('       RED FAIL  X6 the bounds are insensitive to sigma — they are not measuring the operator');
}
check('X every falsifier turned its target red', reds === redTotal, reds + '/' + redTotal);

console.log('\n' + (Date.now() - t0) + ' ms · ' + (fails ? fails + ' FAILURE(S)' :
  'ALL PASS — solver verified by three independent witnesses; existence, local\n  uniqueness and density positivity certified in interval arithmetic; at least two\n  distinct solutions ENCLOSED in disjoint balls at one parameter set, in the regime\n  where uniqueness theory is silent.'));
process.exit(fails ? 1 : 0);
