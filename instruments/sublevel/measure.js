/* measure.js — certified measure of {x : |q(x)| < 1} for a monic polynomial
   with rational roots in [-1,1], with multiplicity.
   instruments/sublevel · cert-machine

   THE TARGET (Tao, teorth/erdosproblems#179, on Erdős #1038): over discrete
   probability measures mu = sum p_i delta_{a_i} on [-1,1], the supremum of
   |{x : U_mu(x) < 0}| is conjectured to be 2*sqrt(2), attained by the uniform
   measure on {-1,+1}. For RATIONAL weights p_i = k_i/N the potential
   condition U_mu(x) < 0 is exactly |q(x)| < 1 with q = prod (x-a_i)^{k_i},
   a monic polynomial of degree N with roots in [-1,1] — so certified sublevel
   measures of root-constrained monic polynomials ARE certified values of
   Tao's functional at rational-weight measures.

   EXACTNESS. Roots come in as fractions n_i/d over one common denominator d;
   then d^N q(x) = A(x) := prod (d x - n_i) has integer coefficients, and the
   boundary of the sublevel set consists of roots of the integer polynomials
   A - d^N and A + d^N. Those roots are isolated and refined by the certified
   Sturm machinery of instruments/trigmin/certify-min (exported, battery-held,
   calibrated on Mercer's closed forms); membership of each gap between
   consecutive boundary roots is decided by ONE exact BigInt comparison
   |A(t)| vs d^N at a rational test point (never a float); and the measure is
   summed with outward rounding from the root enclosures. The result is a true
   enclosure [lo, hi] of the sublevel measure.

   Everything decided here is a statement about ONE explicit measure — a
   certified LOWER-bound witness for the supremum, never an upper bound on it.

   MIT licensed. Part of cert-machine. */
'use strict';

const CM = require('#instruments/trigmin/certify-min.js');
const Q = require('#instruments/interval/rational.js');

const { squarefreePart, isolateAll, refineRoot } = CM;

/* ---------------- integer polynomial helpers (coeffs ascending, BigInt) ---- */
const mulPoly = (a, b) => {
  const r = new Array(a.length + b.length - 1).fill(0n);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) r[i + j] += a[i] * b[j];
  return r;
};
const trim = (p) => { const r = p.slice(); while (r.length > 1 && r[r.length - 1] === 0n) r.pop(); return r; };
const derivPoly = (p) => { const r = []; for (let i = 1; i < p.length; i++) r.push(p[i] * BigInt(i)); return r.length ? r : [0n]; };

/* exact rational evaluation of an integer polynomial by Horner */
function evalQ(p, t) {
  let acc = Q.R(0n);
  for (let i = p.length - 1; i >= 0; i--) acc = Q.add(Q.mul(acc, t), Q.R(p[i]));
  return acc;
}

/* ---------------- the measure ---------------------------------------------- */
/* roots: [{n: BigInt numerator, m: multiplicity}] over common denominator d.
   Every root must satisfy |n| <= d (roots in [-1,1]). Returns
   { lo, hi (Q), loD, hiD, N, boundaryRoots, intervalsInside }. */
function sublevelMeasure(roots, d, opts) {
  if (d <= 0n) throw new Error('sublevel: denominator must be positive');
  let N = 0;
  for (const r of roots) {
    if (r.n < -d || r.n > d) throw new Error('sublevel: root ' + r.n + '/' + d + ' outside [-1,1]');
    if (!(r.m >= 1)) throw new Error('sublevel: bad multiplicity');
    N += r.m;
  }
  if (N < 1) throw new Error('sublevel: empty root list');

  /* A(x) = prod (d x - n_i)^{m_i}, integer coefficients */
  let A = [1n];
  for (const r of roots) for (let k = 0; k < r.m; k++) A = mulPoly(A, [-r.n, d]);
  A = trim(A);
  const dN = d ** BigInt(N);

  /* boundary polynomials; all roots of q = ±1 lie in (-3,3): |x| >= 3 makes
     every factor |x - n_i/d| >= 2, so |q| >= 2^N > 1 */
  const lo3 = Q.R(-3n), hi3 = Q.R(3n);
  const P1 = trim(A.map((c, i) => i === 0 ? c - dN : c));    /* q - 1 */
  const P2 = trim(A.map((c, i) => i === 0 ? c + dN : c));    /* q + 1 */

  const width = (opts && opts.width) || Q.R(1n, 1n << 40n);
  const enclosures = [];
  for (const P of [P1, P2]) {
    const sf = squarefreePart(P);
    const iso = isolateAll(sf, lo3, hi3);
    const sfd = derivPoly(sf);
    for (const [l, r] of iso.intervals) {
      const e = refineRoot(sf, sfd, null, l, r, width);
      enclosures.push({ lo: e[0], hi: e[1] });
    }
  }
  enclosures.sort((a, b) => Q.cmp(a.lo, b.lo));
  /* disjointness: refine widths were tight; verify, since overlapping
     enclosures would scramble the gap structure */
  for (let i = 1; i < enclosures.length; i++)
    if (Q.cmp(enclosures[i].lo, enclosures[i - 1].hi) < 0)
      throw new Error('sublevel: overlapping boundary-root enclosures — refine width too coarse');

  /* decide each gap by one exact comparison |A(t)| < d^N at a rational point */
  const inside = [];
  const points = [Q.R(-3n)];
  for (const e of enclosures) points.push(e.lo, e.hi);
  points.push(Q.R(3n));
  const gapInside = [];
  for (let g = 0; g <= enclosures.length; g++) {
    const L = g === 0 ? Q.R(-3n) : enclosures[g - 1].hi;
    const R = g === enclosures.length ? Q.R(3n) : enclosures[g].lo;
    const t = Q.div(Q.add(L, R), Q.R(2n));
    const val = evalQ(A, t);                                  /* exact rational */
    const absNum = val.n < 0n ? -val.n : val.n;
    /* |A(t)/den| < d^N  <=>  |num| < d^N * den (den > 0) */
    const isIn = absNum < dN * val.d;
    gapInside.push(isIn);
  }
  if (gapInside[0] || gapInside[gapInside.length - 1])
    throw new Error('sublevel: unbounded sublevel set — impossible for monic q');

  /* measure: for each maximal inside-run from boundary root i to boundary
     root j, the length is in [j.lo - i.hi, j.hi - i.lo]; outward sum */
  let mLo = Q.R(0n), mHi = Q.R(0n);
  const runs = [];
  let g = 1;
  while (g <= enclosures.length) {
    if (!gapInside[g]) { g++; continue; }
    const start = g;
    while (g <= enclosures.length && gapInside[g]) g++;
    /* inside gaps start..g-1: bounded left by enclosure[start-1], right by enclosure[g-1] */
    const Lenc = enclosures[start - 1], Renc = enclosures[g - 1];
    const lenLo = Q.sub(Renc.lo, Lenc.hi), lenHi = Q.sub(Renc.hi, Lenc.lo);
    mLo = Q.add(mLo, Q.sign(lenLo) > 0 ? lenLo : Q.R(0n));
    mHi = Q.add(mHi, lenHi);
    runs.push({ from: Q.toDouble(Lenc.lo), to: Q.toDouble(Renc.hi) });
  }
  return {
    lo: mLo, hi: mHi, loD: Q.toDouble(mLo), hiD: Q.toDouble(mHi),
    N, boundaryRoots: enclosures.length, runs
  };
}

/* the conjectured champion value, as a certified enclosure of 2*sqrt(2):
   returns {lo, hi} rationals with lo^2 <= 8 <= hi^2 and hi - lo tiny */
function twoSqrtTwo(bits) {
  const B = BigInt(bits || 60);
  let lo = 0n, hi = 3n << B;                                  /* find floor(sqrt(8*4^B)) by bisection */
  const target = 8n << (2n * B);
  while (hi - lo > 1n) { const m = (lo + hi) >> 1n; if (m * m <= target) lo = m; else hi = m; }
  return { lo: Q.R(lo, 1n << B), hi: Q.R(lo + 1n, 1n << B) };
}

module.exports = { sublevelMeasure, twoSqrtTwo, mulPoly, evalQ };
