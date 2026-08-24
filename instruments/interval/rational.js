/* rational.js — exact arithmetic over BigInt fractions.

   Why this exists next to interval arithmetic rather than instead of it: the
   two answer different questions, and choosing the wrong one silently weakens
   a certificate.

     · INTERVAL arithmetic bounds a quantity you cannot compute exactly. It is
       the right tool when the problem is genuinely nonlinear (a Krawczyk
       enclosure, a radii polynomial).
     · EXACT arithmetic DECIDES. It is the right tool when the data is rational
       and the question is a sign — and it is the ONLY tool when the answer is
       a tie, because no interval method can ever decide whether a quantity is
       exactly zero.

   That distinction was learned, not designed. Certifying a multi-population
   Wardrop equilibrium, an unused edge turned out to carry a slack of exactly
   zero — an unused route exactly as short as the used ones. Interval
   arithmetic returned −1.6e−12 and could not conclude; exact rational
   arithmetic settled it immediately. Weak complementarity is invisible to
   floating point and to intervals alike.

   Every finite double is exactly m·2^e, so `fromDouble` is lossless and the
   bridge between the two worlds is exact in that direction.

   MIT licensed. Part of eqcert. */
'use strict';

function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; }

/* canonical: denominator > 0, reduced */
function R(n, d) {
  n = BigInt(n); d = d === undefined ? 1n : BigInt(d);
  if (d === 0n) throw new Error('rational: zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}
const ZERO = R(0n), ONE = R(1n);

/* every finite double is exactly m·2^e — this conversion loses nothing */
function fromDouble(x) {
  if (!Number.isFinite(x)) throw new Error('rational: non-finite double');
  let e = 0n, y = x;
  while (!Number.isInteger(y)) { y *= 2; e += 1n; if (e > 1200n) throw new Error('rational: conversion did not terminate'); }
  return R(BigInt(y), 1n << e);
}

const add = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => R(a.n * b.n, a.d * b.d);
const div = (a, b) => { if (b.n === 0n) throw new Error('rational: division by zero'); return R(a.n * b.d, a.d * b.n); };
const neg = a => R(-a.n, a.d);
const sign = a => (a.n < 0n ? -1 : a.n > 0n ? 1 : 0);
const cmp = (a, b) => { const l = a.n * b.d, r = b.n * a.d; return l < r ? -1 : l > r ? 1 : 0; };
const isZero = a => a.n === 0n;
const abs = a => (a.n < 0n ? neg(a) : a);

/* a double that is >= (resp <=) the exact value — for reporting only.
   Number(n)/Number(d) overflows on large heights, so scale first. */
function toDouble(a) {
  const q = Number(a.n) / Number(a.d);
  if (Number.isFinite(q)) return q;
  const shift = BigInt(Math.max(0, a.d.toString(2).length - 1000));
  return Number(a.n >> shift) / Number(a.d >> shift);
}
const toString = a => (a.d === 1n ? a.n.toString() : a.n + '/' + a.d);

/* is the exact value inside the closed float interval [lo, hi]? */
const inClosed = (a, lo, hi) => cmp(fromDouble(lo), a) <= 0 && cmp(a, fromDouble(hi)) <= 0;

/* ---- exact dense linear algebra (Gaussian elimination, no pivoting error) ----
   Returns null iff the matrix is EXACTLY singular — which is information, not
   a failure: a singular exact system is a proof of degeneracy, whereas a small
   float determinant is only a suspicion. */
function solve(A, b, n) {
  A = A.map(r => r.slice()); b = b.slice();
  for (let k = 0; k < n; k++) {
    let p = -1;
    for (let r = k; r < n; r++) if (sign(A[r][k]) !== 0) { p = r; break; }
    if (p < 0) return null;
    if (p !== k) { const t = A[k]; A[k] = A[p]; A[p] = t; const tb = b[k]; b[k] = b[p]; b[p] = tb; }
    for (let r = k + 1; r < n; r++) {
      if (sign(A[r][k]) === 0) continue;
      const f = div(A[r][k], A[k][k]);
      for (let c = k; c < n; c++) A[r][c] = sub(A[r][c], mul(f, A[k][c]));
      b[r] = sub(b[r], mul(f, b[k]));
    }
  }
  const x = new Array(n).fill(ZERO);
  for (let k = n - 1; k >= 0; k--) {
    let s = b[k];
    for (let c = k + 1; c < n; c++) s = sub(s, mul(A[k][c], x[c]));
    x[k] = div(s, A[k][k]);
  }
  return x;
}

/* residual of A x − b, exactly. Zero here is a proof, not a tolerance. */
function residual(A, x, b, n) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = ZERO;
    for (let j = 0; j < n; j++) if (sign(A[i][j]) !== 0) s = add(s, mul(A[i][j], x[j]));
    out[i] = sub(s, b[i]);
  }
  return out;
}
const allZero = v => v.every(isZero);

module.exports = {
  R, ZERO, ONE, fromDouble, toDouble, toString,
  add, sub, mul, div, neg, abs, sign, cmp, isZero, inClosed,
  solve, residual, allZero, gcd
};
