/* instruments/kissing/basis.js — the kissing decision in Q(sqrt2, sqrt3) at the scale of thousands
   of vectors, exact, in JavaScript.

   fields.js decides in BigInt towers and is the reference; it is too slow for 35 million pairs.
   Here a vector is four INTEGER arrays over the Q-basis {1, sqrt2, sqrt3, sqrt6}:

       x_k = c1[k] + c2[k] sqrt2 + c3[k] sqrt3 + c6[k] sqrt6      (a common denominator cancels)

   and an inner product is again four integers (a, b, c, d) by the multiplication table
   sqrt2^2 = 2, sqrt3^2 = 3, sqrt6^2 = 6, sqrt2 sqrt3 = sqrt6, sqrt2 sqrt6 = 2 sqrt3, sqrt3 sqrt6 = 3 sqrt2.
   Those integers are accumulated in IEEE doubles, which is exact integer arithmetic as long as every
   partial sum stays below 2^53 in magnitude. The bound is computed from the data BEFORE anything
   runs (dim * 12 * max|coefficient|^2 must stay below 2^50) and the run is refused otherwise.

   The sign of a + b sqrt2 + c sqrt3 + d sqrt6 is decided exactly: same-signed components decide at
   once; the cases with only (a, c) or only (a, b) non-zero square once, inside the same 2^53 bound
   (checked per call); everything else goes to the BigInt tower in fields.js. No float decides; the
   doubles here only ever hold integers. */
'use strict';
const FD = require('./fields.js');

const LIM = 2 ** 50;
const SQ_LIM = 2 ** 25; /* |x| < 2^25 keeps 3 x^2 below 2^53 */

/* sign4 — exact sign of a + b sqrt2 + c sqrt3 + d sqrt6 for integer-valued doubles */
function sign4(a, b, c, d) {
  if (a >= 0 && b >= 0 && c >= 0 && d >= 0) return a || b || c || d ? 1 : 0;
  if (a <= 0 && b <= 0 && c <= 0 && d <= 0) return -1;
  if (b === 0 && d === 0 && Math.abs(a) < SQ_LIM && Math.abs(c) < SQ_LIM) {
    /* a + c sqrt3, mixed signs: compare a^2 with 3 c^2 (a tie is impossible: sqrt3 is irrational) */
    const t = a * a - 3 * c * c;
    if (t === 0) throw new Error('sign4: a^2 = 3c^2 with (a, c) != 0');
    return (a > 0) === (t > 0) ? 1 : -1;
  }
  if (c === 0 && d === 0 && Math.abs(a) < SQ_LIM && Math.abs(b) < SQ_LIM) {
    const t = a * a - 2 * b * b;
    if (t === 0) throw new Error('sign4: a^2 = 2b^2 with (a, b) != 0');
    return (a > 0) === (t > 0) ? 1 : -1;
  }
  slow++;
  return FD.Z23.sign(FD.z23(a, b, c, d));
}
let slow = 0;

/* vector constructor: {c1, c2, c3, c6} integer arrays of one length */
const vec = (c1, c2, c3, c6) => ({ c1, c2, c3, c6 });

function dot4(x, y, dim) {
  let a = 0, b = 0, c = 0, d = 0;
  const x1 = x.c1, x2 = x.c2, x3 = x.c3, x6 = x.c6, y1 = y.c1, y2 = y.c2, y3 = y.c3, y6 = y.c6;
  for (let k = 0; k < dim; k++) {
    const p1 = x1[k], p2 = x2[k], p3 = x3[k], p6 = x6[k], q1 = y1[k], q2 = y2[k], q3 = y3[k], q6 = y6[k];
    a += p1 * q1 + 2 * p2 * q2 + 3 * p3 * q3 + 6 * p6 * q6;
    b += p1 * q2 + p2 * q1 + 3 * (p3 * q6 + p6 * q3);
    c += p1 * q3 + p3 * q1 + 2 * (p2 * q6 + p6 * q2);
    d += p1 * q6 + p6 * q1 + p2 * q3 + p3 * q2;
  }
  return [a, b, c, d];
}

/* bound(vectors) — the exactness guard: refuses unless every coefficient is an integer and
   dim * 12 * max^2 < 2^50 (each of the four accumulators sums at most 12 dim products) */
function bound(vectors) {
  const dim = vectors[0].c1.length;
  let mx = 0;
  for (const v of vectors) for (const key of ['c1', 'c2', 'c3', 'c6']) {
    const arr = v[key];
    if (arr.length !== dim) throw new Error('ragged vector');
    for (let k = 0; k < dim; k++) {
      const t = arr[k];
      if (!Number.isInteger(t)) throw new Error('non-integer coefficient ' + t);
      if (Math.abs(t) > mx) mx = Math.abs(t);
    }
  }
  const worst = dim * 12 * mx * mx;
  return { dim, maxCoeff: mx, worstPartialSum: worst, exact: worst < LIM };
}

/* certify(vectors) — every pair decided exactly. Requires ONE norm for all vectors, a rational
   integer N (b = c = d = 0), checked exactly here; then compatibility is 2<x,y> <= N, i.e.
   sign(N - 2a, -2b, -2c, -2d) >= 0, contact iff all four are zero. The largest inner product
   is tracked by exact comparison. */
function certify(vectors, opts = {}) {
  const t0 = Date.now();
  const n = vectors.length;
  const g = bound(vectors);
  if (!g.exact) throw new Error('basis.certify refused: dim*12*max^2 = ' + g.worstPartialSum + ' is not below 2^50, doubles would not be exact');
  const dim = g.dim;
  const N0 = dot4(vectors[0], vectors[0], dim);
  if (N0[1] || N0[2] || N0[3] || N0[0] <= 0) throw new Error('basis.certify: the first norm is not a positive rational integer');
  for (let i = 0; i < n; i++) {
    const N = dot4(vectors[i], vectors[i], dim);
    if (N[0] !== N0[0] || N[1] || N[2] || N[3]) return { verdict: 'REFUSED', reason: 'norm of row ' + i + ' differs from row 0 (non-uniform norms go to fields.certifyField)', n, dim };
  }
  const N = N0[0];
  slow = 0;
  let pairs = 0, contacts = 0, best = null, bestIJ = null;
  const hist = new Map();
  for (let i = 0; i < n; i++) {
    const x = vectors[i];
    for (let j = i + 1; j < n; j++) {
      const s = dot4(x, vectors[j], dim);
      pairs++;
      const sg = sign4(N - 2 * s[0], -2 * s[1], -2 * s[2], -2 * s[3]);
      if (sg < 0) return { verdict: 'REFUTED', n, dim, pairs, norm: N, witness: { i, j, dot: s }, ms: Date.now() - t0 };
      if (sg === 0) contacts++;
      if (opts.histogram) { const k = s.join(','); hist.set(k, (hist.get(k) || 0) + 1); }
      if (!best || sign4(s[0] - best[0], s[1] - best[1], s[2] - best[2], s[3] - best[3]) > 0) { best = s; bestIJ = [i, j]; }
    }
  }
  const out = { verdict: 'CERTIFIED', n, dim, pairs, contacts, norm: N, maxDot: best, maxDotPair: bestIJ,
    maxCosApprox: (best[0] + best[1] * Math.SQRT2 + best[2] * Math.sqrt(3) + best[3] * Math.sqrt(6)) / N,
    guard: g, bigintFallbacks: slow, ms: Date.now() - t0 };
  if (opts.histogram) out.histogram = [...hist.entries()].sort((p, q) => q[1] - p[1]);
  return out;
}

/* toField(v) — the same vector as an array of fields.Z23 elements (for the BigInt reference) */
const toField = (v) => v.c1.map((_, k) => FD.z23(v.c1[k], v.c2[k], v.c3[k], v.c6[k]));

module.exports = { sign4, dot4, bound, certify, vec, toField, fallbacks: () => slow };
