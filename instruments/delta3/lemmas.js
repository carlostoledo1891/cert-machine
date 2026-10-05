#!/usr/bin/env node
/* lemmas.js — exact TESTS (not proofs) of the two paper-proved steps the certificates
   stand on, and an exact count for the upper-bound side.
   instruments/delta3 · cert-machine

     node instruments/delta3/lemmas.js [--quick]     writes certs/delta3-lemmas.json

   (a) the centring identity  E(σ) := (Q(φ) − Q(φ*))/4 = ∫hσ + Q(φ*σ),  φ = φ*(1 − 2σ),
       and the symmetry E(σ) = E(1 − σ), on step functions σ;
   (b) the discretisation lemma E(σ) ≥ L(y) on step functions finer than a certificate
       grid — random ones and adversarial ones (σ on the exact bathtub minimiser {h < v},
       indicators of cells, flips next to breakpoints, mass on cut pairs, near-φ* and
       random colourings). L is the VERIFIER'S OWN L (verify.js evalL), so a wrong
       bathtub constant or cut bound in the verifier shows up here as a violation;
       E is computed from areas alone (no h), so the test is not circular in h;
   (c) the exact number of monochromatic 3-APs of the twelve-block colouring of
       {1, …, n}, n = 548k, against 117/2192 · n²;
   (d) a landscape probe: exact-integer greedy descent over ±1 colourings of the
       1096-cell grid from random starts, looking for anything below Q(φ*).

   Everything is decided in exact rationals / BigInt; the random generators only choose
   test cases (seeded, reproducible).

   MIT licensed. Part of cert-machine. */
'use strict';

const fs = require('fs');
const path = require('path');
const Q = require('../interval/rational.js');
const M = require('./model.js');
const V = require('./verify.js');

const r = M.r, ZERO = r(0), ONE = r(1), U = M.U;
const QSTAR = r(-5, 137);

/* ---- seeded RNG (mulberry32) — chooses cases, decides nothing ---- */
function rng(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), pick: arr => arr[Math.floor(next() * arr.length)] };
}
const lcm = (a, b) => a / Q.gcd(a, b) * b;

/* ---- step functions: pts[0] = 0 < … < pts[N] = 1 (rationals), vals[N] (rationals) ---- */

/* Σ_p Σ_q v_p v_q · area(R ∩ J_p × J_q), exactly. Rows are swept with the strip's
   structure: for a-piece p the b-pieces wholly inside the strip form one contiguous
   run (summed by prefix sums), the ones wholly outside cost nothing, and only the few
   that straddle a boundary line go through model.area4. */
function Qstep(pts, vals) {
  const N = vals.length;
  let u = 1n; for (const x of pts) u = lcm(u, x.d);
  let qd = 1n; for (const v of vals) qd = lcm(qd, v.d);
  const X = pts.map(x => x.n * (u / x.d));
  const F = vals.map(v => v.n * (qd / v.d));
  const Vq = F.map((f, q) => f * (X[q + 1] - X[q]));
  const pre = [0n]; for (let q = 0; q < N; q++) pre.push(pre[q] + Vq[q]);
  const first = pred => { let lo = 0, hi = N; while (lo < hi) { const mid = (lo + hi) >> 1; if (pred(mid)) hi = mid; else lo = mid + 1; } return lo; };
  let T = 0n;
  for (let p = 0; p < N; p++) {
    if (F[p] === 0n) continue;
    const a0 = X[p], a1 = X[p + 1];
    /* b-pieces that can meet the strip: X[q+1] > a0/2 and X[q] < (u + a1)/2 */
    const qa0 = first(q => 2n * X[q + 1] > a0);
    const qa1 = first(q => 2n * X[q] >= u + a1) - 1;
    /* wholly inside: X[q] ≥ a1/2 and X[q+1] ≤ (u + a0)/2 */
    const qf0 = first(q => 2n * X[q] >= a1);
    const qf1 = first(q => 2n * X[q + 1] > u + a0) - 1;
    if (qf0 <= qf1) T += 4n * F[p] * (X[p + 1] - X[p]) * (pre[qf1 + 1] - pre[qf0]);
    for (let q = qa0; q <= qa1; q++) {
      if (qf0 <= qf1 && q >= qf0 && q <= qf1) continue;
      if (F[q] === 0n) continue;
      T += F[p] * F[q] * M.area4(a0, a1, X[q], X[q + 1], u);
    }
  }
  return Q.R(T, 4n * u * u * qd * qd);
}

/* the same sum, pair by pair — the reference for Qstep in the unit checks */
function QstepBrute(pts, vals) {
  let acc = ZERO;
  for (let p = 0; p < vals.length; p++) for (let q = 0; q < vals.length; q++) {
    if (Q.sign(vals[p]) === 0 || Q.sign(vals[q]) === 0) continue;
    let u = lcm(lcm(pts[p].d, pts[p + 1].d), lcm(pts[q].d, pts[q + 1].d));
    const z = x => x.n * (u / x.d);
    const A = Q.R(M.area4(z(pts[p]), z(pts[p + 1]), z(pts[q]), z(pts[q + 1]), u), 4n * u * u);
    acc = Q.add(acc, Q.mul(Q.mul(vals[p], vals[q]), A));
  }
  return acc;
}

const signOn = (a, b) => {                                  /* φ* on the piece [a, b] */
  const mid = Q.mul(r(1, 2), Q.add(a, b));
  for (let k = 0; k < M.BLOCKS.length; k++) if (Q.cmp(mid, r(M.EDGES[k + 1], U)) < 0) return M.SIGNS[k];
  return M.SIGNS[M.BLOCKS.length - 1];
};

/* build a step σ from paints [[α, β, v], …] (disjoint), 0 elsewhere, with the φ* edges
   and the given extra breakpoints inserted so φ* is constant on every piece */
function buildSigma(paints, extra) {
  const bs = [ZERO, ONE, ...M.EDGES.map(e => r(e, U)), ...(extra || [])];
  for (const [a, b] of paints) bs.push(a, b);
  bs.sort(Q.cmp);
  const pts = bs.filter((x, k) => k === 0 || Q.cmp(x, bs[k - 1]) !== 0);
  const ps = paints.slice().sort((x, y) => Q.cmp(x[0], y[0]));
  const vals = [];
  let k = 0;
  for (let t = 0; t + 1 < pts.length; t++) {
    const mid = Q.mul(r(1, 2), Q.add(pts[t], pts[t + 1]));
    while (k < ps.length && Q.cmp(ps[k][1], mid) <= 0) k++;
    vals.push(k < ps.length && Q.cmp(ps[k][0], mid) < 0 ? ps[k][2] : ZERO);
  }
  for (const v of vals) if (Q.sign(v) < 0 || Q.cmp(v, ONE) > 0) throw new Error('sigma outside [0,1]');
  return { pts, vals };
}

/* E by the definition, from areas only: (Q(φ*(1 − 2σ)) − Q(φ*))/4 */
function Edirect(sg) {
  const phi = sg.vals.map((v, t) => Q.mul(r(signOn(sg.pts[t], sg.pts[t + 1])), Q.sub(ONE, Q.mul(r(2), v))));
  return Q.mul(r(1, 4), Q.sub(Qstep(sg.pts, phi), QSTAR));
}
/* E by the centred form: ∫hσ + Q(φ*σ) */
function Ecentred(sg) {
  let lin = ZERO;
  sg.vals.forEach((v, t) => { if (Q.sign(v)) lin = Q.add(lin, Q.mul(v, M.hIntegral(sg.pts[t], sg.pts[t + 1]))); });
  const ps = sg.vals.map((v, t) => Q.mul(r(signOn(sg.pts[t], sg.pts[t + 1])), v));
  return Q.add(lin, Qstep(sg.pts, ps));
}
const flip = sg => ({ pts: sg.pts, vals: sg.vals.map(v => Q.sub(ONE, v)) });
function mass(sg) { let m = ZERO; sg.vals.forEach((v, t) => { m = Q.add(m, Q.mul(v, Q.sub(sg.pts[t + 1], sg.pts[t]))); }); return m; }

/* cell averages y_i of σ on a certificate grid (σ's pieces refine the grid) */
function cellAverages(sg, gd) {
  const y = [];
  let t = 0;
  for (let i = 0; i < gd.n; i++) {
    const a = r(gd.grid[i], U), b = r(gd.grid[i + 1], U);
    let acc = ZERO;
    while (t < sg.vals.length && Q.cmp(sg.pts[t + 1], b) <= 0) {
      if (Q.cmp(sg.pts[t], a) < 0) throw new Error('sigma does not refine the grid');
      acc = Q.add(acc, Q.mul(sg.vals[t], Q.sub(sg.pts[t + 1], sg.pts[t])));
      t++;
    }
    y.push(Q.div(acc, Q.sub(b, a)));
  }
  return y;
}

/* ---- adversarial σ generators (each returns paints; the grid is added as breaks) ---- */
const gridBreaks = gd => gd.grid.map(x => r(x, U));
const randRat = (R, den) => r(R.int(0, den), den);

function genRandom(gd, R) {                                  /* 1–3 random pieces per cell */
  const paints = [];
  const level = R.next();
  for (let i = 0; i < gd.n; i++) {
    const p = gd.grid[i], q = gd.grid[i + 1], k = R.int(1, 3), sub = 7 * (q - p);
    const cuts = new Set([0, sub]); while (cuts.size < k + 1) cuts.add(R.int(1, sub - 1));
    const cs = [...cuts].sort((x, y) => x - y);
    for (let t = 0; t + 1 < cs.length; t++) {
      const v = R.next() < level ? (R.next() < 0.5 ? ONE : randRat(R, 16)) : ZERO;
      if (Q.sign(v)) paints.push([r(7 * p + cs[t], 7 * U), r(7 * p + cs[t + 1], 7 * U), v]);
    }
  }
  return paints;
}
function genBathtub(gd, R) {                                 /* σ = 1 on {h < v} in chosen cells */
  const paints = [];
  const frac = R.next();
  for (let i = 0; i < gd.n; i++) {
    if (R.next() > frac) continue;
    const p = gd.grid[i], q = gd.grid[i + 1];
    const y = r(R.int(1, 63), 64);
    const { set } = M.sublevel(p, q, Q.mul(y, r(q - p, U)));
    for (const [a, b] of set) paints.push([a, b, ONE]);
  }
  return paints;
}
function genCells(gd, R) {                                   /* indicators of whole cells */
  const paints = [], dens = R.next() * 0.6;
  for (let i = 0; i < gd.n; i++) if (R.next() < dens) paints.push([r(gd.grid[i], U), r(gd.grid[i + 1], U), R.next() < 0.7 ? ONE : randRat(R, 8)]);
  return paints;
}
function genBreakpoints(gd, R) {                             /* flips next to breakpoints: φ* moved slightly */
  const paints = [];
  for (const e of M.EDGES.slice(1, -1)) {
    if (R.next() < 0.4) continue;
    const d = r(R.int(1, 30), 5 * U);                        /* up to 6/1096: flips at edges 12/1096 apart never overlap */
    const side = R.next() < 0.5;
    const v = R.next() < 0.8 ? ONE : randRat(R, 4);
    const E = r(e, U);
    paints.push(side ? [E, Q.add(E, d), v] : [Q.sub(E, d), E, v]);
  }
  return paints;
}
function genCutPair(gd, R) {                                 /* mass in the two cells of a cut pair */
  const c = R.pick(gd.cut);
  const paints = [];
  const put = (i, atStart) => {
    const p = gd.grid[i], q = gd.grid[i + 1], len = r(R.int(1, 3 * (q - p)), 3 * U);
    const a = r(p, U), b = r(q, U);
    return atStart ? [a, Q.add(a, len), ONE] : [Q.sub(b, len), b, ONE];
  };
  if (c.i === c.j) paints.push(put(c.i, R.next() < 0.5));
  else { const A = put(c.i, R.next() < 0.5), B = put(c.j, R.next() < 0.5); paints.push(...[A, B].sort((x, y) => Q.cmp(x[0], y[0]))); }
  return paints;
}
function genColouring(gd, R) {                               /* a ±1 colouring on 1/2192 near φ* or random */
  const paints = [], near = R.next() < 0.5, pflip = near ? 0.02 : R.next() * 0.5;
  for (let x = 0; x < 2 * U; x++) if (R.next() < pflip) paints.push([r(x, 2 * U), r(x + 1, 2 * U), ONE]);
  return paints;
}
function genConstant(gd, R) { const c = randRat(R, 32); return Q.sign(c) ? [[ZERO, ONE, c]] : []; }

const GENERATORS = { random: genRandom, bathtub: genBathtub, cells: genCells, breakpoints: genBreakpoints, cutpair: genCutPair, colouring: genColouring, constant: genConstant };

/* one exact case on one grid: identity, symmetry, E ≥ L, E ≥ 0 */
function runCase(gd, gen, R, opts) {
  const paints = GENERATORS[gen](gd, R);
  const sg = buildSigma(paints, gridBreaks(gd));
  const E = Edirect(sg);
  const y = cellAverages(sg, gd);
  const L = V.evalL(gd, y, 'max');
  const out = { gen, m: Q.toDouble(mass(sg)), E: Q.toDouble(E), gap: Q.toDouble(Q.sub(E, L)), lemmaOk: Q.cmp(E, L) >= 0, nonneg: Q.sign(E) >= 0 };
  if (opts && opts.identity) {
    out.identityOk = Q.cmp(E, Ecentred(sg)) === 0;
    out.symmetryOk = Q.cmp(E, Edirect(flip(sg))) === 0;
  }
  return out;
}

/* the exact bathtub on a cell at y: ∫ h over the sublevel set of measure w·y */
function bathtubExact(p, q, y) {
  const { set } = M.sublevel(p, q, Q.mul(y, r(q - p, U)));
  let acc = ZERO;
  for (const [a, b] of set) acc = Q.add(acc, M.hIntegral(a, b));
  return acc;
}

/* (c) monochromatic 3-APs of the twelve-block colouring of {1..n}, n = 548k */
function countMono(k) {
  const n = 548 * k;
  const col = new Uint8Array(n + 1);
  let x = 1;
  M.BLOCKS.forEach((b, t) => { for (let s = 0; s < b * k; s++) col[x++] = t % 2; });
  let mono = 0;
  for (let a = 1; a <= n; a++) { const c = col[a]; for (let d = 1; a + 2 * d <= n; d++) if (col[a + d] === c && col[a + 2 * d] === c) mono++; }
  return { n, mono };
}

/* (d) greedy ±1 descent on N = 1096 cells with the exact integer kernel 4N²·area */
function landscape(starts, seed) {
  const N = U, Nb = BigInt(N);
  const A = new Array(N);
  for (let p = 0; p < N; p++) {
    A[p] = new Int32Array(N);
    for (let q = 0; q < N; q++) A[p][q] = Number(M.area4(BigInt(p), BigInt(p + 1), BigInt(q), BigInt(q + 1), Nb));
  }
  const K = Array.from({ length: N }, (_, p) => { const row = new Int32Array(N); for (let q = 0; q < N; q++) row[q] = A[p][q] + A[q][p]; return row; });
  const R = rng(seed);
  const target = -5 * 4 * N * N / 137;                       /* 4N²·Q(φ*) = −20·1096²/137, an integer */
  let best = Infinity, below = 0, atStar = 0;
  for (let s = 0; s < starts; s++) {
    const phi = new Int8Array(N);
    if (s % 2 === 0) for (let p = 0; p < N; p++) phi[p] = R.next() < 0.5 ? 1 : -1;
    else { for (let p = 0; p < N; p++) phi[p] = M.SIGNS[M.blockOf(p, p + 1)] * (R.next() < 0.15 ? -1 : 1); }
    const g = new Float64Array(N);                         /* integers < 2^31·N: exact */
    for (let p = 0; p < N; p++) { let t = 0; const row = K[p]; for (let q = 0; q < N; q++) t += row[q] * phi[q]; g[p] = t; }
    for (let it = 0; it < 20 * N; it++) {
      /* flipping p changes 4N²Q by −2φ_p(g_p − 2A_pp φ_p) */
      let bp = -1, bd = 0;
      for (let p = 0; p < N; p++) { const d = -2 * phi[p] * (g[p] - 2 * A[p][p] * phi[p]); if (d < bd) { bd = d; bp = p; } }
      if (bp < 0) break;
      const old = phi[bp]; phi[bp] = -old;
      for (let q = 0; q < N; q++) g[q] += K[q][bp] * (phi[bp] - old);
    }
    let val = 0; for (let p = 0; p < N; p++) for (let q = 0; q < N; q++) val += A[p][q] * phi[p] * phi[q];
    if (val < best) best = val;
    if (val < target) below++;
    if (val === target) atStar++;
  }
  return { N, starts, best4N2Q: best, bestQ: best / (4 * N * N), targetQ: -5 / 137, below, atPhiStar: atStar };
}

function main() {
  const quick = process.argv.includes('--quick');
  const t0 = Date.now();
  const files = V.defaultFiles();
  const certs = V.loadEntries(files).map(e => e.cert);
  const grids = [...new Map(certs.map(c => [JSON.stringify(c.grid), c.grid])).values()].map(g => V.gridData(g));
  const out = { what: 'Exact TESTS of the centring identity, the symmetry, the discretisation lemma (E >= L with the verifier\'s own L), the bathtub constants, and an exact count of monochromatic 3-APs of the PRS colouring. Tests, not proofs.', decidedOn: new Date().toISOString().slice(0, 10), node: process.version };

  /* (a)+(b) */
  const perGen = quick ? 3 : 300;
  const cases = [];
  let idN = 0, idOk = 0, symOk = 0, lemmaOk = 0, nonneg = 0, minGap = Infinity, minE = Infinity;
  grids.forEach((gd, gi) => {
    const R = rng(1000 + gi);
    for (const gen of Object.keys(GENERATORS)) for (let k = 0; k < perGen; k++) {
      const c = runCase(gd, gen, R, { identity: k % 3 === 0 });
      cases.push(Object.assign({ grid: gd.n }, c));
      if (c.identityOk !== undefined) { idN++; if (c.identityOk) idOk++; if (c.symmetryOk) symOk++; }
      if (c.lemmaOk) lemmaOk++;
      if (c.nonneg) nonneg++;
      /* σ ≡ 0 and σ ≡ 1 give E = L = 0 trivially; the extremes are reported without them */
      if (c.m > 0 && c.m < 1) { if (c.gap < minGap) minGap = c.gap; if (c.E < minE) minE = c.E; }
    }
  });
  out.identity = { cases: idN, identityHolds: idOk, symmetryHolds: symOk };
  out.discretisation = { cases: cases.length, holds: lemmaOk, ENonnegative: nonneg, smallestGapEminusL: minGap, smallestE: minE,
    byGenerator: Object.fromEntries(Object.keys(GENERATORS).map(g => [g, { cases: cases.filter(c => c.gen === g).length, holds: cases.filter(c => c.gen === g && c.lemmaOk).length, minGap: Math.min(...cases.filter(c => c.gen === g && c.m > 0 && c.m < 1).map(c => c.gap)), trivial: cases.filter(c => c.gen === g && !(c.m > 0 && c.m < 1)).length }])) };
  console.log('(a) centring identity  ' + idOk + '/' + idN + ' exact   symmetry E(σ) = E(1−σ)  ' + symOk + '/' + idN);
  console.log('(b) E(σ) ≥ L(y)        ' + lemmaOk + '/' + cases.length + '   E ≥ 0 in ' + nonneg + '/' + cases.length + '   over σ ≢ 0, 1: smallest E − L = ' + minGap.toExponential(3) + ', smallest E = ' + minE.toExponential(3));
  for (const [g, s] of Object.entries(out.discretisation.byGenerator)) console.log('      ' + g.padEnd(12) + s.holds + '/' + s.cases + '   min E − L ' + s.minGap.toExponential(3) + (s.trivial ? '   (' + s.trivial + ' trivial σ ≡ 0 or 1)' : ''));

  /* bathtub, exactly at its minimiser, on every cell of every grid, at y = k/16 */
  let btN = 0, btOk = 0, btTight = Infinity;
  for (const gd of grids) for (const c of gd.cells) for (let k = 1; k <= 16; k++) {
    const y = r(k, 16);
    const F = bathtubExact(c.p, c.q, y);
    const lb = Q.add(Q.mul(c.a, y), Q.mul(c.b, Q.mul(y, y)));
    btN++; if (Q.cmp(F, lb) >= 0) btOk++;
    const s = Q.toDouble(Q.sub(F, lb)); if (s < btTight) btTight = s;
  }
  /* and the single-piece reading of "max m′", to show it is not merely conservative-vs-not but wrong */
  let spN = 0, spBad = 0, spExample = null;
  const hn = M.hNodes();
  for (const gd of grids) for (const c of gd.cells) {
    let maxinv = null;
    for (let x = c.p; x < c.q; x++) { const k = Q.abs(Q.mul(Q.sub(hn[x + 1], hn[x]), r(U))); const inv = Q.div(ONE, k); if (maxinv === null || Q.cmp(inv, maxinv) > 0) maxinv = inv; }
    const bSingle = Q.div(Q.mul(c.w, c.w), Q.mul(r(2), maxinv));
    if (Q.cmp(bSingle, c.b) === 0) continue;
    for (let k = 1; k <= 64; k++) {
      const y = r(k, 64), F = bathtubExact(c.p, c.q, y);
      spN++;
      if (Q.cmp(F, Q.add(Q.mul(c.a, y), Q.mul(bSingle, Q.mul(y, y)))) < 0) { spBad++; if (!spExample) spExample = { cell: [c.p, c.q], y: Q.toString(y), F: Q.toString(F), bSingle: Q.toString(bSingle), bSummed: Q.toString(c.b) }; }
    }
  }
  out.bathtub = { cases: btN, holds: btOk, smallestSlack: btTight, singlePieceReading: { cases: spN, violations: spBad, example: spExample } };
  console.log('    bathtub at {h<v}   ' + btOk + '/' + btN + ' exact (smallest slack ' + btTight.toExponential(3) + ');  single-piece "max m′" reading violated in ' + spBad + '/' + spN + (spExample ? ' (e.g. cell ' + JSON.stringify(spExample.cell) + ' at y = ' + spExample.y + ')' : ''));

  /* (c) the upper-bound side */
  const ks = quick ? [1, 2, 4] : [1, 2, 4, 8, 16, 32, 64];
  out.counts = ks.map(k => {
    const { n, mono } = countMono(k);
    const exact = Q.R(BigInt(mono), BigInt(n) * BigInt(n));
    const dev = Q.sub(exact, r(117, 2192));
    return { k, n, mono, ratio: Q.toString(exact), ratioDecimal: Q.toDouble(exact).toFixed(10), minus117over2192: Q.toDouble(dev).toExponential(4), timesN: (Q.toDouble(dev) * n).toFixed(6) };
  });
  console.log('(c) V(548k)/n² for the PRS colouring  (117/2192 = ' + (117 / 2192).toFixed(10) + ')');
  for (const c of out.counts) console.log('      n = ' + String(c.n).padEnd(6) + ' mono = ' + String(c.mono).padEnd(10) + ' /n² = ' + c.ratioDecimal + '   − 117/2192 = ' + c.minus117over2192 + '   ×n = ' + c.timesN);

  /* (d) */
  const land = landscape(quick ? 20 : 400, 7);
  out.landscape = land;
  console.log('(d) landscape: ' + land.starts + ' greedy ±1 descents on 1096 cells, best Q = ' + land.bestQ.toFixed(10) + ' (Q(φ*) = ' + (-5 / 137).toFixed(10) + '), below φ*: ' + land.below + ', ending at Q(φ*): ' + land.atPhiStar);

  out.seconds = (Date.now() - t0) / 1000;
  out.allPass = idOk === idN && symOk === idN && lemmaOk === cases.length && nonneg === cases.length && btOk === btN && land.below === 0;
  if (!quick) fs.writeFileSync(path.join(V.ROOT, 'certs', 'delta3-lemmas.json'), JSON.stringify(out, null, 2) + '\n');
  console.log((out.allPass ? 'ALL TESTS PASS' : 'SOME TEST FAILED') + '   ' + out.seconds.toFixed(1) + ' s' + (quick ? '' : '   wrote certs/delta3-lemmas.json'));
  process.exit(out.allPass ? 0 : 1);
}

module.exports = { rng, Qstep, QstepBrute, buildSigma, Edirect, Ecentred, flip, mass, cellAverages, GENERATORS, runCase, bathtubExact, countMono, gridBreaks };
if (require.main === module) main();
