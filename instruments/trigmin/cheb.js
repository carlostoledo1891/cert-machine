/* cheb.js — Chebyshev machinery for the chowla-cosine probe.
   PROBE — research/probes/chowla-cosine · ships nowhere · claimless.

   The one reduction this probe rides: cos(a x) = T_a(cos x) with T_a the
   Chebyshev polynomial of the first kind, INTEGER coefficients. So for a finite
   set A of positive integers,

       min over x in R of  f_A(x) = sum_{a in A} cos(a x)
     = min over y in [-1,1] of  P_A(y) = sum_{a in A} T_a(y),

   because cos maps R onto [-1,1]. P_A is an integer-coefficient polynomial of
   degree max(A), and a certified global minimum of P_A on [-1,1] is exact 1-D
   work — Sturm + interval Newton + exact rational evaluation (certify-min.js).

   This file is the polynomial layer only: T_a coefficients (BigInt recurrence),
   P_A assembly, exact evaluation at rationals, Horner interval evaluation.
   Interval and rational arithmetic come from core/interval — the single source;
   nothing here reimplements either. */
'use strict';
const path = require('path');
const IV = require('#instruments/interval/interval.js');
const Q = require('#instruments/interval/rational.js');

/* A polynomial is an array of BigInt, c[k] the coefficient of y^k, trimmed so
   the top entry is nonzero (the zero polynomial is [0n]). */
function trim(c) { let d = c.length - 1; while (d > 0 && c[d] === 0n) d--; return c.slice(0, d + 1); }
function deg(c) { return c.length - 1; }
function isZeroPoly(c) { return c.length === 1 && c[0] === 0n; }

/* Monomial coefficients of T_a via the recurrence T_{k+1} = 2y T_k - T_{k-1}.
   Coefficients grow like 2^a — BigInt, never Number. */
function chebT(a) {
  if (!Number.isInteger(a) || a < 0) throw new Error('chebT: a must be a non-negative integer');
  if (a === 0) return [1n];
  let prev = [1n], cur = [0n, 1n];
  for (let k = 1; k < a; k++) {
    const nxt = new Array(cur.length + 1).fill(0n);
    for (let i = 0; i < cur.length; i++) nxt[i + 1] = 2n * cur[i];
    for (let i = 0; i < prev.length; i++) nxt[i] -= prev[i];
    prev = cur; cur = nxt;
  }
  return cur;
}

/* P_A = sum_{a in A} T_a, streaming the recurrence once up to max(A). */
function polyForSet(A) {
  if (!Array.isArray(A) || A.length === 0) throw new Error('polyForSet: A must be a non-empty array');
  const seen = new Set();
  for (const a of A) {
    if (!Number.isInteger(a) || a < 1) throw new Error('polyForSet: members must be positive integers, got ' + a);
    if (seen.has(a)) throw new Error('polyForSet: A is a set — duplicate member ' + a);
    seen.add(a);
  }
  const maxA = A.reduce((m, x) => Math.max(m, x), 0);
  const acc = new Array(maxA + 1).fill(0n);
  let prev = [1n], cur = [0n, 1n];               /* T_0, T_1 */
  for (let a = 1; a <= maxA; a++) {
    if (seen.has(a)) for (let i = 0; i < cur.length; i++) acc[i] += cur[i];
    const nxt = new Array(cur.length + 1).fill(0n);
    for (let i = 0; i < cur.length; i++) nxt[i + 1] = 2n * cur[i];
    for (let i = 0; i < prev.length; i++) nxt[i] -= prev[i];
    prev = cur; cur = nxt;
  }
  return trim(acc);
}

function polyDeriv(c) {
  if (c.length === 1) return [0n];
  const o = new Array(c.length - 1);
  for (let k = 1; k < c.length; k++) o[k - 1] = BigInt(k) * c[k];
  return trim(o);
}

/* Homogeneous Horner: returns q^d * P(p/q) as a BigInt (q > 0), so the SIGN of
   the return value is the exact sign of P(p/q). No rounding anywhere. */
function evalHom(c, p, q) {
  const d = c.length - 1;
  let acc = c[d], qq = 1n;
  for (let k = d - 1; k >= 0; k--) { qq *= q; acc = acc * p + c[k] * qq; }
  return acc;
}

/* Exact value of P at a rational r = {n,d} from core/interval/rational.js. */
function evalExact(c, r) {
  return Q.R(evalHom(c, r.n, r.d), r.d ** BigInt(c.length - 1));
}

/* Exact sign of P at a rational, without building the fraction. */
function evalSign(c, r) {
  const v = evalHom(c, r.n, r.d);
  return v < 0n ? -1 : v > 0n ? 1 : 0;
}

/* A BigInt as an enclosing float interval — thin when exactly representable. */
function encloseBig(b) {
  const x = Number(b);
  if (Number.isSafeInteger(x) && BigInt(x) === b) return IV.iv(x);
  return [IV.nextDown(x), IV.nextUp(x)];
}

/* Horner evaluation of P over a float interval y, every step outward-rounded
   through core/interval. Sound always; TIGHT only while the monomial basis is
   well-conditioned (small degree, or |y| well inside 1) — the exact-rational
   path above is the one certify-min.js trusts for large degree. */
function hornerInterval(c, y) {
  let acc = encloseBig(c[c.length - 1]);
  for (let k = c.length - 2; k >= 0; k--) acc = IV.add(IV.mul(acc, y), encloseBig(c[k]));
  return acc;
}

module.exports = {
  trim, deg, isZeroPoly, chebT, polyForSet, polyDeriv,
  evalHom, evalExact, evalSign, encloseBig, hornerInterval,
  IV, Q
};
