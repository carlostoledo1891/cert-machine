/* constants.js — certified brackets for the constants the Ramanujan Machine
   sheets speak: pi^2, Catalan's G, ln 2, and acosh(2) = log(2 + sqrt 3).
   Every bracket is a bigfloat interval whose endpoints are exact dyadic
   rationals; toFractions hands them to the exact-rational deciders.

   CATALAN'S CONSTANT, from the defining series alone. G = sum (-1)^k a_k
   with a_k = 1/(2k+1)^2. Write the tail from an EVEN index N as
   T = A_N = a_N - a_{N+1} + ... ; then 2 A_N = a_N + B with
   B = sum_j (-1)^j D_{N+j}, D_k = a_k - a_{k+1}, and when D is decreasing
   the alternating-series bound gives B in (0, D_N), so
        A_N  in  [ a_N / 2 ,  (a_N + D_N) / 2 ].
   D decreasing is the CONVEXITY of a_k, and it is PROVED, not assumed:
   (2k+3)^2(2k+5)^2 - 2(2k+1)^2(2k+5)^2 + (2k+1)^2(2k+3)^2 expands to
   exactly 96k^2 + 288k + 184 — every coefficient positive, so the second
   difference is positive for ALL k >= 0. proveConvexity() re-derives that
   expansion over exact rationals; catalanG() refuses to run without it,
   and the battery calls it independently. At N = 600000 the bracket is
   ~1.2e-18 wide — an order finer than any CF enclosure it will decide.

   MIT licensed. Part of cert-machine. */
'use strict';

const B = require('./bigfloat.js');
const F = require('./functions.js');
const M = require('#instruments/cf/minus.js');
const { I, fromInt, fromRatio, add, sub, mul, div, sqr } = B;

/* the convexity of 1/(2k+1)^2, as an exact polynomial identity */
function proveConvexity() {
  const P = M._poly;
  const lin = (c) => P.pOfInts([c, 2]);
  const sq = (c) => P.pMul(lin(c), lin(c));
  const poly = P.pAdd(P.pSub(P.pMul(sq(3), sq(5)), P.pMul(P.pOfInts([2]), P.pMul(sq(1), sq(5)))), P.pMul(sq(1), sq(3)));
  const r = P.nonnegFor(poly, 0);
  return { ok: r.ok, poly: poly.map(c => c.n + (c.d === 1n ? '' : '/' + c.d)),
    statement: '(2k+3)^2(2k+5)^2 - 2(2k+1)^2(2k+5)^2 + (2k+1)^2(2k+3)^2 has every coefficient >= 0, '
      + 'so a_k = 1/(2k+1)^2 is convex for all k >= 0' };
}

const G_CACHE = new Map();
function catalanG(P, N) {
  N = N || 600000;
  if (N % 2 !== 0) throw new Error('bigfloat.catalanG: N must be even (tail sign)');
  const key = P + ':' + N;
  if (G_CACHE.has(key)) return G_CACHE.get(key);
  if (!proveConvexity().ok) throw new Error('bigfloat.catalanG: convexity proof failed — REFUSING');
  let sum = B.IZERO;
  for (let k = 0; k < N; k++) {
    const odd = BigInt(2 * k + 1);
    const t = fromRatio(1n, odd * odd, P);
    sum = (k % 2 === 0) ? add(sum, t, P) : sub(sum, t, P);
  }
  const oN = BigInt(2 * N + 1), oN1 = BigInt(2 * N + 3);
  const aN = fromRatio(1n, oN * oN, P);
  const aN1 = fromRatio(1n, oN1 * oN1, P);
  const half = fromInt(2);
  /* tail in [aN/2, (aN + (aN - aN1))/2] = [aN/2, aN - aN1/2] */
  const tLo = div(aN, half, P).lo;
  const tHi = sub(aN, div(aN1, half, P), P).hi;
  const r = I(add(sum, I(tLo), P).lo, add(sum, I(tHi), P).hi);
  const out = { enclosure: I(r.lo, r.hi), N };
  G_CACHE.set(key, out);
  return out;
}

const CACHE = new Map();
function bracket(name, P) {
  const key = name + ':' + P;
  if (CACHE.has(key)) return CACHE.get(key);
  let iv;
  if (name === 'pi2') iv = sqr(F.pi(P), P);
  else if (name === 'ln2') iv = F.ln2(P);
  else if (name === 'G') iv = catalanG(P).enclosure;
  else if (name === 'acosh2') iv = F.log(add(fromInt(2), F.sqrt(fromInt(3), P), P), P);
  else if (name === 'catalanE') {
    /* E = 8G - pi * acosh(2), the constant of the sheet's "known" row */
    iv = sub(mul(fromInt(8), catalanG(P).enclosure, P), mul(F.pi(P), bracket('acosh2', P).iv, P), P);
  } else throw new Error('bigfloat.constants: unknown constant ' + name);
  const toFrac = (v) => (v.e >= 0 ? [v.m << BigInt(v.e), 1n] : [v.m, 1n << BigInt(-v.e)]);
  const r = { iv, lo: toFrac(iv.lo), hi: toFrac(iv.hi), width: B.widthNumber(iv) };
  CACHE.set(key, r);
  return r;
}

module.exports = { catalanG, proveConvexity, bracket };
