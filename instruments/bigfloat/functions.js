/* functions.js — certified transcendental enclosures over the bigfloat layer:
   pi (Machin), ln 2 (atanh series), exp, log, Li2 on the small disk. Every
   series is truncated with an EXPLICIT remainder bound added to the interval
   — the same truncated-series-plus-rigorous-tail pattern proved sound in
   instruments/interval/transcendental.js, here at arbitrary precision.

   Domains are checked and refused, never extrapolated. Tail bounds:
     atan(1/x)  alternating, terms decreasing => |R| <= first omitted term
     atanh(v)   |R| <= |v|^{2K+1} / ((2K+1)(1 - v^2))      [geometric]
     exp(x)     once |x|/(n+1) <= 1/2: |R| <= 2|t_{n+1}|   [ratio <= 1/2]
     Li2(z)     |R| <= |z|^{K+1} / ((K+1)^2 (1 - |z|))     [geometric]

   MIT licensed. Part of cert-machine. */
'use strict';

const B = require('./bigfloat.js');
const { I, fromInt, fromRatio, IONE, add, sub, neg, mul, div, sqr, cmp,
        roundDown, roundUp, addExact, subExact, bf, bitLen } = B;

/* magnitude exponent: value v satisfies |v| < 2^mag2(v) */
const mag2 = (v) => (v.m === 0n ? -Infinity : v.e + bitLen(v.m));

/* widen an interval symmetrically by the VALUE t >= 0 (a rigorous tail) */
function widen(x, t, P) {
  return I(roundDown(subExact(x.lo, t), P), roundUp(addExact(x.hi, t), P));
}

/* |X| upper endpoint as a value */
function absHi(X) {
  const a = X.lo.m < 0n ? B.negExact(X.lo) : X.lo;
  const b = X.hi.m < 0n ? B.negExact(X.hi) : X.hi;
  return cmp(a, b) >= 0 ? a : b;
}

/* ---- atan(1/x) for integer x >= 2: alternating series ---- */
function atanRecip(x, P) {
  if (!Number.isInteger(x) || x < 2) throw new Error('bigfloat.atanRecip: need integer x >= 2');
  const U = fromRatio(1n, BigInt(x), P);
  const U2 = mul(U, U, P);
  let sum = B.IZERO, pow = U, k = 0;
  for (;;) {
    const term = div(pow, fromInt(2 * k + 1), P);
    sum = (k % 2 === 0) ? add(sum, term, P) : sub(sum, term, P);
    pow = mul(pow, U2, P);
    k++;
    if (mag2(pow.hi) < -(P + 8)) break;
    if (k > 100000) throw new Error('bigfloat.atanRecip: series did not converge');
  }
  /* remainder bounded by the first omitted term u^{2k+1}/(2k+1) <= pow.hi */
  return widen(sum, pow.hi, P);
}

const PI_CACHE = new Map();
/* Machin: pi = 16 atan(1/5) - 4 atan(1/239) */
function pi(P) {
  if (PI_CACHE.has(P)) return PI_CACHE.get(P);
  const Pw = P + 16;
  const r = sub(mul(fromInt(16), atanRecip(5, Pw), Pw),
                mul(fromInt(4), atanRecip(239, Pw), Pw), P);
  PI_CACHE.set(P, r);
  return r;
}

const LN2_CACHE = new Map();
/* ln 2 = 2 atanh(1/3) = 2 sum v^{2k+1}/(2k+1), v = 1/3 */
function ln2(P) {
  if (LN2_CACHE.has(P)) return LN2_CACHE.get(P);
  const Pw = P + 16;
  const V = fromRatio(1n, 3n, Pw), V2 = mul(V, V, Pw);
  let sum = B.IZERO, pow = V, k = 0;
  for (;;) {
    sum = add(sum, div(pow, fromInt(2 * k + 1), Pw), Pw);
    pow = mul(pow, V2, Pw);
    k++;
    if (mag2(pow.hi) < -(Pw + 8)) break;
  }
  /* tail <= v^{2K+1}/((2K+1)(1-v^2)) = pow * 9/8 / (2K+1); positive series:
     widen upward only would suffice, symmetric widening is also sound */
  const tail = div(mul(pow, fromRatio(9n, 8n, Pw), Pw), fromInt(2 * k + 1), Pw).hi;
  const r = mul(fromInt(2), widen(sum, tail, Pw), P);
  LN2_CACHE.set(P, r);
  return r;
}

/* exp on an interval with |x| <= 8: Taylor with ratio-1/2 tail */
function exp(X, P) {
  B.checkI(X);
  const A = absHi(X);
  if (mag2(A) > 3) throw new Error('bigfloat.exp: domain |x| <= 8, got magnitude 2^' + mag2(A));
  const Pw = P + 16;
  let sum = IONE, term = IONE, n = 0;
  for (;;) {
    n++;
    term = div(mul(term, X, Pw), fromInt(n), Pw);
    sum = add(sum, term, Pw);
    /* stop when the term is tiny AND the ratio |x|/(n+1) <= 1/2 */
    if (mag2(term.hi) < -(Pw + 8) && mag2(term.lo) < -(Pw + 8) && mag2(A) <= Math.log2(n + 1) - 1) break;
    if (n > 100000) throw new Error('bigfloat.exp: series did not converge');
  }
  /* |R| <= 2 |t_{n+1}| = 2 |t_n| A/(n+1) */
  const tA = absHi(term);
  const tail = div(mul(I(tA), I(A), Pw), fromInt(n + 1), Pw).hi;
  return widen(sum, addExact(tail, tail), P);
}

/* log at a single positive value v: v = m 2^k with m in [3/4, 3/2],
   atanh series on t = (m-1)/(m+1), |t| <= 1/5 */
const THREE_HALVES = bf(3n, -1);
function logPoint(v, P) {
  if (v.m <= 0n) throw new Error('bigfloat.log: need positive value');
  const Pw = P + 16;
  let k = mag2(v) - 1;                        /* v · 2^{-k} in [1, 2) */
  let M = { m: v.m, e: v.e - k };
  if (cmp(M, THREE_HALVES) > 0) { k += 1; M = { m: M.m, e: M.e - 1 }; }
  const Mi = I(M);
  const T = div(sub(Mi, IONE, Pw), add(Mi, IONE, Pw), Pw);
  const T2 = mul(T, T, Pw);
  let sum = B.IZERO, pow = T, j = 0;
  for (;;) {
    sum = add(sum, div(pow, fromInt(2 * j + 1), Pw), Pw);
    pow = mul(pow, T2, Pw);
    j++;
    if (mag2(pow.hi) < -(Pw + 8) && mag2(pow.lo) < -(Pw + 8)) break;
    if (j > 100000) throw new Error('bigfloat.log: series did not converge');
  }
  /* |t| <= 1/5 => tail <= |t|^{2J+1}/((2J+1)(1 - 1/25)) = |pow| · 25/24 / (2J+1) */
  const tail = div(mul(I(absHi(pow)), fromRatio(25n, 24n, Pw), Pw), fromInt(2 * j + 1), Pw).hi;
  let r = mul(fromInt(2), widen(sum, tail, Pw), Pw);
  if (k !== 0) r = add(r, mul(fromInt(k), ln2(Pw), Pw), Pw);
  return mul(r, IONE, P);   /* round to P */
}

/* interval log: strictly increasing => endpoint enclosures */
function log(X, P) {
  B.checkI(X);
  if (X.lo.m <= 0n) throw new Error('bigfloat.log: need positive interval');
  return I(logPoint(X.lo, P).lo, logPoint(X.hi, P).hi);
}

/* Li2 on |z| <= 5/8: sum z^k/k^2 with geometric tail */
const FIVE_EIGHTHS = bf(5n, -3);
function li2Small(X, P) {
  B.checkI(X);
  const A = absHi(X);
  if (cmp(A, FIVE_EIGHTHS) > 0) throw new Error('bigfloat.li2Small: domain |z| <= 5/8');
  const Pw = P + 16;
  let sum = B.IZERO, pow = X, k = 1;
  for (;;) {
    sum = add(sum, div(pow, fromInt(k * k), Pw), Pw);
    pow = mul(pow, X, Pw);
    k++;
    if (mag2(pow.hi) < -(Pw + 8) && mag2(pow.lo) < -(Pw + 8)) break;
    if (k > 100000) throw new Error('bigfloat.li2Small: series did not converge');
  }
  /* tail <= |z|^{K}/(K^2 (1-|z|)) <= |pow| · (8/3) / K^2   since 1-|z| >= 3/8 */
  const tail = div(mul(I(absHi(pow)), fromRatio(8n, 3n, Pw), Pw), fromInt(k * k), Pw).hi;
  return mul(widen(sum, tail, Pw), IONE, P);
}

module.exports = { pi, ln2, exp, log, logPoint, li2Small, atanRecip, mag2, widen, absHi };
