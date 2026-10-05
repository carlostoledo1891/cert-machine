#!/usr/bin/env node
/* verify.js — an independent exact verifier for the claimed δ₃ = 117/2192.
   instruments/delta3 · cert-machine

     node instruments/delta3/verify.js [cert.json …] [--record]

   What it decides, all in exact rational / BigInt arithmetic (floats only propose a
   Cholesky factor whose exact remainder is then checked — see psd.js):

   φ*:     the twelve-block colouring; Q(φ*) = −5/137 from block-pair areas of R; g* and
           h = −φ*g* from the antiderivative of φ*; h linear between multiples of 1/1096
           (every kink candidate is on that lattice — model.js); h continuous, h ≥ 0, its
           zeros, its one-sided slopes there, and ∫h = 5/137 = −Q(φ*).
   grids:  integers 0 … 1096, strictly increasing, containing every edge of φ*; the exact
           area of R over every ORDERED cell pair by two independent routes (trapezoid on
           the section length, and polygon clipping) that must agree; full / cut / absent;
           the bathtub constants a_i, b_i recomputed from h.
   slab:   the polynomial p = L_θ − B − Σ μ_f f is built from the verifier's own a, b,
           areas and the file's θ, μ; every form is accepted only if it is visibly
           nonnegative on R_k (a product of factors y_i, 1−y_i, m−lo, hi−m, or a triangle
           form on three distinct indices with s1·s2·s3 = +1); S + εI ⪰ 0 is proved
           exactly; the bound B − ε(1+n) is recomputed and must be > 0. On R_k,
           E ≥ L ≥ L_θ = B + Σ μf + vᵀSv ≥ B − ε|v|² ≥ B − ε(1+n).
   inner:  D = L₀ − Σλ y_i(1−y_j) − Σν_j y_j(rin−m) − κ m(rin−m) − yᵀNy − Σ c_i y_i must have
           zero constant and zero linear part (so each c_i is exactly what the linear
           budget leaves) and a quadratic part P ⪰ 0, every multiplier ≥ 0 and N ≥ 0
           entrywise. Then on {y ∈ [0,1]^n : m ≤ rin}, E ≥ L ≥ L₀ ≥ 0.
   cover:  the verified regions cover m ∈ [0, 1/2]; E(σ) = E(1−σ) does the rest.

   A refusal is a verdict: anything the verifier cannot establish is REFUSED with the
   reason, and the exit code is nonzero unless THEOREM A is VERIFIED.

   MIT licensed. Part of cert-machine. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Q = require('../interval/rational.js');
const M = require('./model.js');
const { provePSD } = require('./psd.js');

const ROOT = process.env.DELTA3_ROOT || path.resolve(__dirname, '..', '..');
const r = M.r;
const ZERO = r(0), ONE = r(1);
const U = M.U, U4 = 4n * BigInt(M.U) * BigInt(M.U);

class Refusal extends Error {}
const refuse = why => { throw new Refusal(why); };

/* strict: "p" or "p/q" with q > 0, nothing else */
function rat(x, what) {
  if (typeof x !== 'string' || !/^-?\d+(\/\d+)?$/.test(x)) refuse(what + ': not a rational string: ' + JSON.stringify(x).slice(0, 40));
  const [a, b] = x.split('/');
  if (b !== undefined && /^0+$/.test(b)) refuse(what + ': zero denominator');
  return Q.R(BigInt(a), BigInt(b === undefined ? 1 : b));
}
const nonneg = (q, what) => { if (Q.sign(q) < 0) refuse('multiplier: ' + what + ' is negative (' + Q.toString(q) + ')'); return q; };
const isIdx = (k, n) => Number.isInteger(k) && k >= 0 && k < n;

/* ---- φ* facts ------------------------------------------------------------- */
let FACTS = null;
function phiStarFacts() {
  if (FACTS) return FACTS;
  const off = M.kinkCandidatesOffLattice();
  if (off.length) refuse('phi*: kink candidates off the 1/1096 lattice: ' + off.join(','));
  const hn = M.hNodes();                                   /* throws if h is discontinuous */
  const Qs = M.QstarByAreas();
  let I = ZERO;
  for (let x = 0; x < U; x++) I = Q.add(I, Q.mul(r(1, 2 * U), Q.add(hn[x], hn[x + 1])));
  const zeros = [], slopes = [];
  let minOff = null;
  for (let x = 0; x <= U; x++) {
    const s = Q.sign(hn[x]);
    if (s < 0) refuse('phi*: h < 0 at ' + x + '/' + U);
    if (s === 0) {
      zeros.push(x);
      slopes.push({ at: Q.toString(r(x, U)), left: x > 0 ? Q.toString(Q.mul(Q.sub(hn[x], hn[x - 1]), r(U))) : null, right: x < U ? Q.toString(Q.mul(Q.sub(hn[x + 1], hn[x]), r(U))) : null });
    } else if (minOff === null || Q.cmp(hn[x], minOff) < 0) minOff = hn[x];
  }
  for (let x = 0; x < U; x++) if (Q.sign(hn[x]) === 0 && Q.sign(hn[x + 1]) === 0) refuse('phi*: h vanishes on a whole piece at ' + x);
  const interior = M.EDGES.slice(1, -1);
  const zerosAreEdges = zeros.length === interior.length && zeros.every((z, k) => z === interior[k]);
  if (Q.cmp(Qs, r(-5, 137)) !== 0) refuse('phi*: Q(phi*) = ' + Q.toString(Qs) + ', not -5/137');
  if (Q.cmp(I, r(5, 137)) !== 0) refuse('phi*: ∫h = ' + Q.toString(I) + ', not 5/137');
  if (!zerosAreEdges) refuse('phi*: the zeros of h are not exactly the 11 breakpoints');
  const red = M.BLOCKS.filter((_, k) => k % 2 === 0).reduce((a, b) => a + b, 0);
  FACTS = {
    Q: Q.toString(Qs), hIntegral: Q.toString(I),
    hZeros: zeros.map(z => Q.toString(r(z, U))),
    hMinOffZeros: { value: Q.toString(minOff), note: 'least nonzero node value of h (h is linear between nodes)' },
    slopesAtZeros: slopes,
    balanced: red * 2 === 548,
    nodes: U + 1,
  };
  return FACTS;
}

/* ---- per-grid data: cells, signs, bathtub, ordered pairs ---------------------- */
const GRID_CACHE = new Map();
function gridData(grid) {
  const key = JSON.stringify(grid);
  if (GRID_CACHE.has(key)) return GRID_CACHE.get(key);
  if (!Array.isArray(grid) || grid.length < 2) refuse('grid: not a list of at least two points');
  for (const x of grid) if (!Number.isInteger(x)) refuse('grid: non-integer point ' + JSON.stringify(x));
  if (grid[0] !== 0 || grid[grid.length - 1] !== U) refuse('grid: must run from 0 to ' + U);
  for (let k = 0; k + 1 < grid.length; k++) if (!(grid[k] < grid[k + 1])) refuse('grid: not strictly increasing at ' + k);
  const set = new Set(grid);
  for (const e of M.EDGES) if (!set.has(e)) refuse('grid: the edge ' + e + '/' + U + ' of phi* is not a grid point');
  phiStarFacts();
  const n = grid.length - 1;
  const cells = [];
  for (let i = 0; i < n; i++) {
    const p = grid[i], q = grid[i + 1];
    const blk = M.blockOf(p, q);
    if (blk < 0) refuse('grid: cell ' + i + ' straddles an edge of phi*');
    const bt = M.bathtub(p, q);
    cells.push({ p, q, s: M.SIGNS[blk], w: r(q - p, U), a: bt.a, b: bt.b, flat: bt.flat });
  }
  const full = [], cut = [];
  let absent = 0;
  const G = grid.map(BigInt), Ub = BigInt(U);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const A4 = M.area4(G[i], G[i + 1], G[j], G[j + 1], Ub);
    const F4 = 4n * (G[i + 1] - G[i]) * (G[j + 1] - G[j]);
    const clip = M.area4Clip(G[i], G[i + 1], G[j], G[j + 1], Ub);
    if (clip.d !== 1n || clip.n !== A4) refuse('internal: the two area routines disagree at (' + i + ',' + j + ')');
    if (A4 < 0n || A4 > F4) refuse('internal: area out of range at (' + i + ',' + j + ')');
    const ww = Q.mul(cells[i].w, cells[j].w);
    const sgn = cells[i].s * cells[j].s;
    if (A4 === 0n) { absent++; continue; }
    if (A4 === F4) { full.push({ i, j, coef: Q.mul(r(sgn), ww) }); continue; }
    cut.push({ i, j, sgn, ww, Ain: Q.R(A4, U4), Aout: Q.R(F4 - A4, U4) });   /* lexicographic in (i, j) */
  }
  const gd = { key, grid, n, cells, full, cut, absent, w: cells.map(c => c.w) };
  GRID_CACHE.set(key, gd);
  return gd;
}

/* THEOREM-EXACT §2, third bullet (CERT-FORMAT's table): the two lower bounds on the cut
   pair's contribution s_i s_j ∬_in σσ, each as k + q·y_i y_j. Both hold because 0 ≤ σ ≤ 1. */
function cutBounds(c) {
  if (c.sgn > 0) return [{ k: ZERO, q: ZERO }, { k: Q.neg(c.Aout), q: c.ww }];
  return [{ k: Q.neg(c.Ain), q: ZERO }, { k: ZERO, q: Q.neg(c.ww) }];
}
/* the inner certificate's choice: the bound that vanishes at y = 0 */
function innerBound(c) {
  const b = cutBounds(c).find(x => Q.sign(x.k) === 0);
  if (!b) refuse('internal: no vanishing cut bound');
  return b;
}

/* ---- polynomials of degree ≤ 2 in y, with m = Σ w_k y_k kept symbolic until finish() ---- */
class Poly {
  constructor(w) {
    this.n = w.length; this.w = w;
    this.k = ZERO; this.g = new Array(this.n).fill(ZERO); this.C = new Array(this.n * this.n).fill(ZERO);
    this.mL = ZERO; this.mY = new Array(this.n).fill(ZERO); this.mM = ZERO;
  }
  addK(c) { if (Q.sign(c)) this.k = Q.add(this.k, c); }
  addY(i, c) { if (Q.sign(c)) this.g[i] = Q.add(this.g[i], c); }
  addYY(i, j, c) {                                         /* c · y_i y_j, i = j allowed */
    if (!Q.sign(c)) return;
    if (i > j) { const t = i; i = j; j = t; }
    const t = i * this.n + j; this.C[t] = Q.add(this.C[t], c);
  }
  /* c · F1 · F2 for affine factors F = { k, y: [[i, coef], …], m } */
  addProduct(c, F1, F2) {
    if (!F2) F2 = { k: ONE, y: [], m: ZERO };
    const cm = (a, b) => Q.mul(c, Q.mul(a, b));
    this.addK(cm(F1.k, F2.k));
    for (const [i, a] of F1.y) { this.addY(i, cm(a, F2.k)); if (Q.sign(F2.m)) this.mY[i] = Q.add(this.mY[i], cm(a, F2.m)); }
    for (const [j, b] of F2.y) { this.addY(j, cm(F1.k, b)); if (Q.sign(F1.m)) this.mY[j] = Q.add(this.mY[j], cm(F1.m, b)); }
    for (const [i, a] of F1.y) for (const [j, b] of F2.y) this.addYY(i, j, cm(a, b));
    this.mL = Q.add(this.mL, Q.add(cm(F1.k, F2.m), cm(F1.m, F2.k)));
    this.mM = Q.add(this.mM, cm(F1.m, F2.m));
  }
  finish() {                                               /* expand m = Σ w_k y_k */
    const { n, w } = this;
    for (let k = 0; k < n; k++) this.addY(k, Q.mul(this.mL, w[k]));
    for (let j = 0; j < n; j++) if (Q.sign(this.mY[j])) for (let k = 0; k < n; k++) this.addYY(k, j, Q.mul(this.mY[j], w[k]));
    if (Q.sign(this.mM)) for (let k = 0; k < n; k++) for (let l = k; l < n; l++)
      this.addYY(k, l, Q.mul(this.mM, Q.mul(r(k === l ? 1 : 2), Q.mul(w[k], w[l]))));
    this.mL = ZERO; this.mY.fill(ZERO); this.mM = ZERO;
    return this;
  }
  quad(i, j) { if (i > j) { const t = i; i = j; j = t; } const c = this.C[i * this.n + j]; return i === j ? c : Q.mul(c, r(1, 2)); }
}

/* the affine factors that are nonnegative on [0,1]^n (Y, O) and on the m-regions */
const Y = i => ({ k: ZERO, y: [[i, ONE]], m: ZERO });
const O = i => ({ k: ONE, y: [[i, r(-1)]], m: ZERO });
const Z = i => ({ k: ONE, y: [[i, r(-2)]], m: ZERO });     /* z = 1 − 2y ∈ [−1, 1] */
const ML = lo => ({ k: Q.neg(lo), y: [], m: ONE });        /* m − lo ≥ 0 on R_k */
const MH = hi => ({ k: hi, y: [], m: r(-1) });             /* hi − m ≥ 0 on R_k */

/* CERT-FORMAT's form kinds, each as a product of nonnegative factors. Nonnegativity on
   R_k is by construction: a kind not in this table, or with the wrong index shape, is
   refused. */
const KINDS = {
  yy: ['pair', (i, j) => [Y(i), Y(j)]],
  '11': ['pair', (i, j) => [O(i), O(j)]],
  y1: ['pair', (i, j) => [Y(i), O(j)]],
  yd: ['one', i => [Y(i), O(i)]],
  '11d': ['one', i => [O(i), O(i)]],
  y: ['one', i => [Y(i)]],
  '1': ['one', i => [O(i)]],
  mlo: ['none', (_, lo) => [ML(lo)]],
  mhi: ['none', (_, lo, hi) => [MH(hi)]],
  mm: ['none', (_, lo, hi) => [ML(lo), MH(hi)]],
  mlo_y: ['one', (j, lo) => [ML(lo), Y(j)]],
  mlo_1: ['one', (j, lo) => [ML(lo), O(j)]],
  mhi_y: ['one', (j, lo, hi) => [MH(hi), Y(j)]],
  mhi_1: ['one', (j, lo, hi) => [MH(hi), O(j)]],
};

/* a triangle form 1 + s1 z_i z_j + s2 z_j z_k + s3 z_i z_k is affine in each z separately
   ONLY when i, j, k are distinct; then its minimum over [−1,1]³ is at a vertex, and with
   s1·s2·s3 = +1 a sign flip of one z turns it into 1 + Σ z z ≥ 0 on {±1}³
   ((z_i+z_j+z_k)² ≥ 1 for an odd sum). Anything else is refused. */
function addTriangle(p, mu, idx, n) {
  if (!Array.isArray(idx) || idx.length !== 4 || !Array.isArray(idx[3]) || idx[3].length !== 3) refuse('form: tri index must be [i, j, k, [s1, s2, s3]]');
  const [i, j, k, s] = idx;
  if (![i, j, k].every(t => isIdx(t, n))) refuse('form: tri index out of range');
  if (i === j || j === k || i === k) refuse('form: tri with a repeated index');
  if (!s.every(t => t === 1 || t === -1)) refuse('form: tri sign not ±1');
  if (s[0] * s[1] * s[2] !== 1) refuse('form: tri with s1·s2·s3 = −1 is not nonnegative');
  p.addProduct(mu, { k: ONE, y: [], m: ZERO });
  p.addProduct(Q.mul(mu, r(s[0])), Z(i), Z(j));
  p.addProduct(Q.mul(mu, r(s[1])), Z(j), Z(k));
  p.addProduct(Q.mul(mu, r(s[2])), Z(i), Z(k));
}

/* L_θ (theta = array) or L₀ (theta = 'inner') added into p with coefficient +1 */
function addL(p, gd, theta) {
  gd.cells.forEach((c, i) => { p.addY(i, c.a); p.addYY(i, i, c.b); });
  for (const f of gd.full) p.addYY(f.i, f.j, f.coef);
  gd.cut.forEach((c, t) => {
    if (theta === 'inner') { const b = innerBound(c); p.addK(b.k); p.addYY(c.i, c.j, b.q); return; }
    const [b1, b2] = cutBounds(c), th = theta[t], om = Q.sub(ONE, th);
    p.addK(Q.add(Q.mul(th, b1.k), Q.mul(om, b2.k)));
    p.addYY(c.i, c.j, Q.add(Q.mul(th, b1.q), Q.mul(om, b2.q)));
  });
}

/* L(y) exactly — the discretisation lemma's minorant — with mode 'max' (the lemma),
   'inner' (L₀) or a θ array (L_θ). Same data, same cutBounds as the certificates. */
function evalL(gd, y, mode) {
  const n = gd.n;
  let acc = ZERO;
  gd.cells.forEach((c, i) => { acc = Q.add(acc, Q.add(Q.mul(c.a, y[i]), Q.mul(c.b, Q.mul(y[i], y[i])))); });
  let Dy = 1n;
  for (const v of y) Dy = Dy / Q.gcd(Dy, v.d) * v.d;
  const Yz = y.map(v => v.n * (Dy / v.d));
  let fz = 0n;
  const Ub2 = BigInt(U) * BigInt(U);
  for (const f of gd.full) {
    if (Ub2 % f.coef.d !== 0n) throw new Error('evalL: full-pair coefficient off the lattice');
    fz += f.coef.n * (Ub2 / f.coef.d) * Yz[f.i] * Yz[f.j];
  }
  acc = Q.add(acc, Q.R(fz, Ub2 * Dy * Dy));
  gd.cut.forEach((c, t) => {
    const yy = Q.mul(y[c.i], y[c.j]);
    const val = b => Q.add(b.k, Q.mul(b.q, yy));
    if (mode === 'inner') { acc = Q.add(acc, val(innerBound(c))); return; }
    const [b1, b2] = cutBounds(c);
    if (mode === 'max') { const v1 = val(b1), v2 = val(b2); acc = Q.add(acc, Q.cmp(v1, v2) >= 0 ? v1 : v2); return; }
    const th = mode[t];
    acc = Q.add(acc, Q.add(Q.mul(th, val(b1)), Q.mul(Q.sub(ONE, th), val(b2))));
  });
  void n;
  return acc;
}

/* ---- the two certificate kinds -------------------------------------------------- */
function slabMatrix(p, eps) {
  const n = p.n;
  const S = Array.from({ length: n + 1 }, () => new Array(n + 1));
  S[0][0] = Q.add(p.k, eps);
  for (let i = 0; i < n; i++) { S[0][i + 1] = S[i + 1][0] = Q.mul(p.g[i], r(1, 2)); }
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
    const v = p.quad(i, j);
    S[i + 1][j + 1] = S[j + 1][i + 1] = i === j ? Q.add(v, eps) : v;
  }
  return S;
}

function verifySlab(cert, gd) {
  const n = gd.n;
  const lo = rat(cert.lo, 'lo'), hi = rat(cert.hi, 'hi');
  if (Q.sign(lo) < 0 || Q.cmp(lo, hi) >= 0 || Q.cmp(hi, ONE) > 0) refuse('region: need 0 ≤ lo < hi ≤ 1');
  const B = rat(cert.B, 'B'), eps = rat(cert.eps, 'eps');
  if (Q.sign(eps) < 0) refuse('multiplier: eps is negative');
  if (!Array.isArray(cert.theta) || cert.theta.length !== gd.cut.length) refuse('theta: expected one value per cut pair (' + gd.cut.length + '), got ' + (Array.isArray(cert.theta) ? cert.theta.length : typeof cert.theta));
  const theta = cert.theta.map((t, k) => {
    const v = rat(t, 'theta[' + k + ']');
    if (Q.sign(v) < 0 || Q.cmp(v, ONE) > 0) refuse('theta: theta[' + k + '] = ' + t + ' is outside [0,1]');
    return v;
  });
  if (!Array.isArray(cert.forms)) refuse('form: forms is not a list');
  const p = new Poly(gd.w);
  addL(p, gd, theta);
  p.addK(Q.neg(B));
  let tri = 0;
  cert.forms.forEach((f, t) => {
    if (!Array.isArray(f) || f.length !== 3) refuse('form: entry ' + t + ' is not [kind, idx, mu]');
    const [kind, idx, muS] = f;
    const mu = nonneg(rat(muS, 'mu[' + t + ']'), 'mu[' + t + '] (' + kind + ')');
    const negmu = Q.neg(mu);
    if (kind === 'tri') { tri++; addTriangle(p, negmu, idx, n); return; }
    if (!Object.prototype.hasOwnProperty.call(KINDS, kind)) refuse('form: unknown kind ' + JSON.stringify(kind));
    const [shape, factors] = KINDS[kind];
    let fs;
    if (shape === 'pair') {
      if (!Array.isArray(idx) || idx.length !== 2 || !isIdx(idx[0], n) || !isIdx(idx[1], n)) refuse('form: ' + kind + ' index out of range');
      fs = factors(idx[0], idx[1]);
    } else if (shape === 'one') {
      if (!isIdx(idx, n)) refuse('form: ' + kind + ' index out of range');
      fs = factors(idx, lo, hi);
    } else {
      if (idx !== null) refuse('form: ' + kind + ' takes no index');
      fs = factors(null, lo, hi);
    }
    p.addProduct(negmu, fs[0], fs[1]);
  });
  p.finish();
  const S = slabMatrix(p, eps);
  const psd = provePSD(S);
  const bound = Q.sub(B, Q.mul(eps, r(1 + n)));
  const out = { region: { lo, hi }, bound, psd, tri, forms: cert.forms.length };
  if (psd.verdict !== 'PSD') refuse('psd: S + eps·I is not proved PSD — ' + psd.why);
  if (Q.sign(bound) <= 0) refuse('bound: B − eps(1+n) = ' + Q.toString(bound) + ' is not positive');
  if (cert.claim !== undefined) {
    const claim = rat(cert.claim, 'claim');
    out.claimMatchesFile = Q.cmp(claim, bound) === 0;
    if (Q.cmp(claim, bound) > 0) refuse('claim: the file claims ' + Q.toString(claim) + ', more than the proved ' + Q.toString(bound));
  } else out.claimMatchesFile = null;
  return out;
}

function verifyInner(cert, gd) {
  const n = gd.n;
  const rin = rat(cert.rin, 'rin');
  if (Q.sign(rin) <= 0 || Q.cmp(rin, ONE) > 0) refuse('region: need 0 < rin ≤ 1');
  if (!cert.lam || typeof cert.lam !== 'object' || Array.isArray(cert.lam)) refuse('multiplier: lam is not an object');
  if (!cert.N || typeof cert.N !== 'object' || Array.isArray(cert.N)) refuse('multiplier: N is not an object');
  if (!Array.isArray(cert.nu) || cert.nu.length !== n) refuse('multiplier: nu must have one entry per cell');
  if (!Array.isArray(cert.c) || cert.c.length !== n) refuse('multiplier: c must have one entry per cell');
  const kap = nonneg(rat(cert.kap, 'kap'), 'kap');
  const pair = (key, what) => {
    const m = /^(\d+),(\d+)$/.exec(key);
    if (!m) refuse('multiplier: bad ' + what + ' key ' + JSON.stringify(key));
    const i = +m[1], j = +m[2];
    if (!isIdx(i, n) || !isIdx(j, n)) refuse('multiplier: ' + what + ' index out of range in ' + key);
    return [i, j];
  };
  const MR = { k: rin, y: [], m: r(-1) };                  /* rin − m ≥ 0 on the region */
  const M0 = { k: ZERO, y: [], m: ONE };                   /* m ≥ 0 since y ≥ 0 */
  const p = new Poly(gd.w);
  addL(p, gd, 'inner');
  let nlam = 0, nN = 0;
  for (const [key, v] of Object.entries(cert.lam)) {
    const [i, j] = pair(key, 'lam');
    p.addProduct(Q.neg(nonneg(rat(v, 'lam ' + key), 'lam ' + key)), Y(i), O(j)); nlam++;
  }
  cert.nu.forEach((v, j) => p.addProduct(Q.neg(nonneg(rat(v, 'nu[' + j + ']'), 'nu[' + j + ']')), Y(j), MR));
  p.addProduct(Q.neg(kap), M0, MR);
  for (const [key, v] of Object.entries(cert.N)) {
    const [i, j] = pair(key, 'N');
    if (i > j) refuse('multiplier: N key ' + key + ' is not upper-triangular');
    const val = nonneg(rat(v, 'N ' + key), 'N ' + key);
    p.addProduct(Q.neg(Q.mul(val, r(i === j ? 1 : 2))), Y(i), Y(j)); nN++;
  }
  cert.c.forEach((v, i) => p.addProduct(Q.neg(nonneg(rat(v, 'c[' + i + ']'), 'c[' + i + ']')), Y(i)));
  p.finish();
  /* what is left must be exactly the quadratic form yᵀPy */
  if (Q.sign(p.k) !== 0) refuse('identity: constant term ' + Q.toString(p.k) + ' does not vanish');
  const badLin = p.g.findIndex(v => Q.sign(v) !== 0);
  if (badLin >= 0) refuse('identity: c[' + badLin + '] is not what the linear budget leaves (residual ' + Q.toString(p.g[badLin]) + ')');
  const P = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => p.quad(i, j)));
  const psd = provePSD(P);
  if (psd.verdict !== 'PSD') refuse('psd: P is not proved PSD — ' + psd.why);
  return { region: { lo: ZERO, hi: rin }, bound: ZERO, psd, tri: 0, forms: nlam + n + 1 + nN + n, claimMatchesFile: null };
}

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

/* verify one parsed certificate; never throws on a bad certificate — refuses */
function verifyCertificate(cert, label) {
  const t0 = Date.now();
  const res = { file: label, kind: null, region: null, n: null, counts: null, verdict: 'REFUSED', why: null, bound: null, boundDecimal: null, claimMatchesFile: null, seconds: 0 };
  try {
    if (!cert || typeof cert !== 'object') refuse('format: not an object');
    const isInner = 'rin' in cert, isSlab = 'lo' in cert || 'hi' in cert;
    if (isInner === isSlab) refuse('format: cannot tell inner from slab');
    res.kind = isInner ? 'inner' : 'slab';
    const gd = gridData(cert.grid);
    res.n = gd.n;
    res.counts = { fullPairs: gd.full.length, cutPairs: gd.cut.length, forms: null, triangles: null };
    const out = isInner ? verifyInner(cert, gd) : verifySlab(cert, gd);
    res.region = { lo: Q.toString(out.region.lo), hi: Q.toString(out.region.hi) };
    res.counts.forms = out.forms; res.counts.triangles = out.tri;
    res.bound = Q.toString(out.bound); res.boundDecimal = Q.toDouble(out.bound).toExponential(7);
    res.claimMatchesFile = out.claimMatchesFile;
    res.psd = out.psd.method;
    res.verdict = 'VERIFIED';
  } catch (e) {
    if (!(e instanceof Refusal)) res.why = 'internal error: ' + e.message;
    else res.why = e.message;
    if (!res.region && cert && typeof cert === 'object') {
      try { res.region = 'rin' in cert ? { lo: '0', hi: String(cert.rin) } : { lo: String(cert.lo), hi: String(cert.hi) }; } catch (_) { /* leave null */ }
    }
  }
  res.seconds = (Date.now() - t0) / 1000;
  return res;
}

/* the verified regions must cover [0, 1/2]; φ → −φ maps σ to 1 − σ and m to 1 − m and
   leaves Q unchanged, so E ≥ 0 on m ≤ 1/2 gives it everywhere */
function cover(results) {
  const iv = results.filter(x => x.verdict === 'VERIFIED' && x.region)
    .map(x => [rat(x.region.lo, 'lo'), rat(x.region.hi, 'hi')])
    .sort((a, b) => Q.cmp(a[0], b[0]));
  let reach = ZERO, gap = null;
  for (const [lo, hi] of iv) {
    if (Q.cmp(reach, r(1, 2)) >= 0) break;
    if (Q.cmp(lo, reach) > 0) { gap = [reach, lo]; break; }
    if (Q.cmp(hi, reach) > 0) reach = hi;
  }
  const complete = gap === null && Q.cmp(reach, r(1, 2)) >= 0;
  return { intervals: iv.map(([a, b]) => [Q.toString(a), Q.toString(b)]), complete, gap: gap ? gap.map(Q.toString) : (complete ? null : [Q.toString(reach), '1/2']) };
}

function verifyAll(entries) {
  const t0 = Date.now();
  let facts = null, factsWhy = null;
  try { facts = phiStarFacts(); } catch (e) { factsWhy = e.message; }
  const results = entries.map(({ cert, label, sha }) => Object.assign(verifyCertificate(cert, label), sha ? { sha256: sha } : {}));
  const cov = cover(results);
  const ok = facts !== null && cov.complete
    && results.filter(x => x.verdict === 'VERIFIED').every(x => x.kind === 'inner' ? Q.sign(rat(x.bound, 'b')) >= 0 : Q.sign(rat(x.bound, 'b')) > 0);
  return {
    facts, factsWhy, results, cover: cov,
    theorem: { verdict: ok ? 'VERIFIED' : 'REFUSED', Qstar: '-5/137', delta3LowerBound: '117/2192' },
    seconds: (Date.now() - t0) / 1000,
  };
}

function defaultFiles() {
  const dir = path.join(ROOT, 'certs', 'delta3');
  return fs.readdirSync(dir).filter(f => /^(inner|slab)-.*\.json$/.test(f)).sort().map(f => path.join(dir, f));
}
function loadEntries(files) {
  return files.map(f => {
    const buf = fs.readFileSync(f);
    let cert = null;
    try { cert = JSON.parse(buf.toString('utf8')); } catch (_) { cert = null; }
    return { cert, label: path.relative(ROOT, path.resolve(f)), sha: sha256(buf) };
  });
}

function ledger(run) {
  const files = {};
  for (const f of ['instruments/delta3/model.js', 'instruments/delta3/psd.js', 'instruments/delta3/verify.js', 'instruments/delta3/lemmas.js', 'instruments/delta3/battery.js', 'instruments/interval/rational.js'])
    files[f] = sha256(fs.readFileSync(path.join(ROOT, f)));
  return {
    what: 'Independent exact verification of the claimed lower bound delta_3 >= 117/2192 (Theorem A: Q(phi) >= -5/137 for every measurable phi:[0,1]->[-1,1]), from the five claimant certificates, with a verifier written clean-room from THEOREM-EXACT.md and CERT-FORMAT.md only.',
    decidedOn: new Date().toISOString().slice(0, 10),
    verifier: {
      files, node: process.version,
      method: {
        areas: 'exact: 4u^2*area(R ∩ I_i×I_j) by the trapezoid rule on the piecewise-linear section length (kinks enumerated), cross-checked pair by pair against Sutherland-Hodgman clipping + shoelace in rationals',
        psd: 'exact: dyadic rescaling, float Cholesky of A - 2^-k I rounded to a dyadic factor L, exact remainder A - LL^T shown diagonally dominant (Gershgorin); fallback exact witness / Bareiss leading minors',
      },
    },
    phiStar: run.facts ? { Q: run.facts.Q, hIntegral: run.facts.hIntegral, hZeros: run.facts.hZeros, hMinOffZeros: run.facts.hMinOffZeros, slopesAtZeros: run.facts.slopesAtZeros } : { error: run.factsWhy },
    certificates: run.results.map(x => ({
      file: x.file, sha256: x.sha256, kind: x.kind, region: x.region, n: x.n, counts: x.counts,
      verdict: x.verdict, why: x.why, bound: x.bound, boundDecimal: x.boundDecimal,
      claimMatchesFile: x.claimMatchesFile, seconds: x.seconds, psdMethod: x.psd || null,
    })),
    cover: { intervals: run.cover.intervals, complete: run.cover.complete },
    theorem: run.theorem,
    seconds: run.seconds,
  };
}

function main() {
  const args = process.argv.slice(2);
  const record = args.includes('--record');
  const files = args.filter(a => !a.startsWith('--'));
  const entries = loadEntries(files.length ? files : defaultFiles());
  const run = verifyAll(entries);
  if (run.facts) {
    const f = run.facts;
    console.log('phi*   Q = ' + f.Q + ' (block areas)   ∫h = ' + f.hIntegral + '   h ≥ 0, linear between multiples of 1/1096, continuous');
    console.log('       zeros: ' + f.hZeros.join(' ') + '   one-sided slopes: ' + [...new Set(f.slopesAtZeros.flatMap(s => [s.left, s.right]))].join(' '));
  } else console.log('phi*   REFUSED: ' + run.factsWhy);
  for (const x of run.results) {
    const reg = x.region ? '[' + x.region.lo + ', ' + x.region.hi + ']' : '[?]';
    const head = (x.kind || '?').padEnd(6) + reg.padEnd(13) + ('n=' + x.n).padEnd(7);
    if (x.verdict === 'VERIFIED') {
      const cm = x.claimMatchesFile === null ? '' : x.claimMatchesFile ? '  (= file claim)' : '  (file claim is weaker)';
      console.log(head + 'VERIFIED  E ≥ ' + x.bound + ' ≈ ' + x.boundDecimal + cm + '   ' + x.seconds.toFixed(1) + ' s   ' + x.file);
    } else console.log(head + 'REFUSED   ' + x.why + '   ' + x.seconds.toFixed(1) + ' s   ' + x.file);
  }
  console.log('cover  ' + run.cover.intervals.map(([a, b]) => '[' + a + ',' + b + ']').join(' ∪ ') + '  ⊇ [0,1/2]: ' + (run.cover.complete ? 'COMPLETE' : 'INCOMPLETE (gap ' + JSON.stringify(run.cover.gap) + ')'));
  console.log('THEOREM A (Q ≥ −5/137, hence δ₃ ≥ 117/2192): ' + run.theorem.verdict + '   ' + run.seconds.toFixed(1) + ' s');
  if (record) {
    const out = path.join(ROOT, 'certs', 'delta3-ledger.json');
    fs.writeFileSync(out, JSON.stringify(ledger(run), null, 2) + '\n');
    console.log('wrote ' + path.relative(ROOT, out));
  }
  process.exit(run.theorem.verdict === 'VERIFIED' ? 0 : 1);
}

module.exports = {
  ROOT, Refusal, rat, phiStarFacts, gridData, cutBounds, innerBound, Poly, addL, evalL,
  verifyCertificate, verifyAll, cover, loadEntries, defaultFiles, ledger, sha256,
};
if (require.main === module) main();
