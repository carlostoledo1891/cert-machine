/* algebraic.js — verified double enclosures of a few algebraic and decimal-given numbers.

   Why this file exists (2026-10-09). The closed-form hunt compared FLOAT candidates —
   Math.sqrt(p/q), Math.pow(c, p/q), Math.cbrt(p/q), (p/q)·c with c a midpoint — against a
   certified enclosure and counted a miss as a refutation. For p/q the comparison is exact
   (round-to-nearest is monotone); for the others it is not, and the control page counted
   54.6 million of them as "refuted in double". A refutation is a DISJOINTNESS of two
   enclosures, so every candidate must be an enclosure first. These helpers build the ones
   that are not transcendental; exp, log and the constants come from transcendental.js.

   Every bracket returned here is VERIFIED in exact rational arithmetic before it is
   returned: the double endpoints are converted losslessly to rationals and the defining
   inequality (lo² ≤ p/q ≤ hi²; lo³ ≤ p/q ≤ hi³; D/10^k ≤ lo … ) is checked, widening one
   ulp at a time until it holds. Nothing is trusted on the strength of Math.sqrt.

   MIT licensed. Part of eqcert. */
'use strict';

const I = require('./interval.js');
const Q = require('./rational.js');

/* [loQ, hiQ] rational → the tightest double interval that contains it, verified */
function qToIv(loQ, hiQ) {
  if (Q.cmp(loQ, hiQ) > 0) throw new Error('algebraic.qToIv: inverted rational interval');
  let lo = Q.toDouble(loQ), hi = Q.toDouble(hiQ);
  for (let i = 0; i < 64 && Q.cmp(Q.fromDouble(lo), loQ) > 0; i++) lo = I.nextDown(lo);
  for (let i = 0; i < 64 && Q.cmp(Q.fromDouble(hi), hiQ) < 0; i++) hi = I.nextUp(hi);
  if (Q.cmp(Q.fromDouble(lo), loQ) > 0 || Q.cmp(Q.fromDouble(hi), hiQ) < 0) throw new Error('algebraic.qToIv: could not enclose');
  return I.iv(lo, hi);
}

/* a number given by its decimal digits: "0.5772156649015328606" means the half-open
   interval [digits, digits + one unit in the last place) — the box its digits allow */
function fromDecimalDigits(str) {
  const m = /^(\d+)\.(\d+)$/.exec(String(str).trim());
  if (!m) throw new Error('algebraic.fromDecimalDigits: expected d.ddd, got ' + str);
  const k = BigInt(m[2].length);
  const D = BigInt(m[1] + m[2]);
  const scale = 10n ** k;
  return qToIv(Q.R(D, scale), Q.R(D + 1n, scale));
}

/* integer n-th root of a nonnegative BigInt, floored */
function irootBig(n, r) {
  if (n < 0n) throw new Error('algebraic.irootBig: negative radicand');
  if (n < 2n) return n;
  let lo = 0n, hi = 1n;
  while (hi ** r <= n) hi <<= 1n;
  while (hi - lo > 1n) { const mid = (lo + hi) >> 1n; if (mid ** r <= n) lo = mid; else hi = mid; }
  return lo;
}

/* the r-th root (r = 2 or 3) of a positive rational p/q as a verified double interval.
   Returns { iv, exact } where exact is the rational root when p/q is a perfect r-th power
   (then the value is RATIONAL, however it is spelled, and must be decided exactly). */
function rootRational(p, q, r) {
  const pq = Q.R(p, q);
  if (Q.sign(pq) <= 0) throw new Error('algebraic.rootRational: radicand must be positive');
  const rn = BigInt(r);
  const pn = irootBig(pq.n, rn), qn = irootBig(pq.d, rn);
  if (pn ** rn === pq.n && qn ** rn === pq.d) return { exact: Q.R(pn, qn), iv: qToIv(Q.R(pn, qn), Q.R(pn, qn)) };
  const s = r === 2 ? Math.sqrt(Q.toDouble(pq)) : Math.cbrt(Q.toDouble(pq));
  let lo = Math.max(0, I.nextDown(s)), hi = I.nextUp(s);
  const powQ = (x) => { const d = Q.fromDouble(x); let out = d; for (let i = 1; i < r; i++) out = Q.mul(out, d); return out; };
  for (let i = 0; i < 64 && Q.cmp(powQ(lo), pq) > 0; i++) lo = I.nextDown(lo);
  for (let i = 0; i < 64 && Q.cmp(powQ(hi), pq) < 0; i++) hi = I.nextUp(hi);
  if (lo < 0) lo = 0;
  if (!(Q.cmp(powQ(lo), pq) <= 0 && Q.cmp(powQ(hi), pq) >= 0)) throw new Error('algebraic.rootRational: bracket did not verify');
  return { exact: null, iv: I.iv(lo, hi) };
}
const sqrtRational = (p, q) => rootRational(p, q, 2);
const cbrtRational = (p, q) => rootRational(p, q, 3);

/* square root of a nonnegative double interval, each end a verified bracket */
function sqrtInterval(X) {
  I.wf(X, 'sqrtInterval');
  if (X[0] < 0) throw new Error('algebraic.sqrtInterval: negative lower end');
  const lo = X[0] === 0 ? 0 : sqrtRational(Q.fromDouble(X[0]).n, Q.fromDouble(X[0]).d).iv[0];
  const hi = sqrtRational(Q.fromDouble(X[1]).n, Q.fromDouble(X[1]).d).iv[1];
  return I.iv(lo, hi);
}

/* exact disjointness tests against a double enclosure [lo, hi], no rounding anywhere:
     rational r:          r < lo  or  r > hi
     sqrt(p/q) (r = 2):   p/q > hi²  (hi ≥ 0)  or  lo > 0 and p/q < lo²;  hi < 0 is disjoint outright
     (a + b·sqrt(d))/c:   handled by the caller through an interval */
function rationalDisjoint(r, lo, hi) {
  return Q.cmp(r, Q.fromDouble(lo)) < 0 || Q.cmp(r, Q.fromDouble(hi)) > 0;
}
function sqrtRationalDisjoint(p, q, lo, hi) {
  const pq = Q.R(p, q);
  if (hi < 0) return true;
  const H = Q.fromDouble(hi);
  if (Q.cmp(pq, Q.mul(H, H)) > 0) return true;
  if (lo > 0) { const L = Q.fromDouble(lo); if (Q.cmp(pq, Q.mul(L, L)) < 0) return true; }
  return false;
}

module.exports = { qToIv, fromDecimalDigits, irootBig, rootRational, sqrtRational, cbrtRational, sqrtInterval, rationalDisjoint, sqrtRationalDisjoint };
