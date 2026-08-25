/* forms.js — exact decision of a Möbius closed form (p + qK)/(s + tK)
   against a rigorous CF enclosure, for a certified constant bracket K.

   The zeta(3) sheet needed only r/zeta(3); the Catalan, pi^2 and ln 2
   sheets speak forms like 24/(18G - 11), (16 + 3pi^2)/(16 - pi^2) and
   1/(1 - log 2) — all Möbius in one constant. The bracket for K comes
   from instruments/bigfloat/constants.js (exact dyadic endpoints); the
   arithmetic here is raw BigInt fractions, never reduced, never floating:
   numerator and denominator intervals are formed with sign-aware endpoint
   selection, the denominator must be sign-definite (else REFUSED — a form
   whose denominator could vanish decides nothing), and disjointness
   against the CF enclosure is decided by cross-multiplication.

   HEAD-SHIFTED ROWS. Three pi^2 rows have a NEGATIVE first partial
   numerator (e.g. 16/(4+pi^2) = 1 - (-1)/(7 - 8/(19 - ...))), outside the
   minus-CF hypotheses a(n) > 0. Algebra, not new analysis: with
   x = b0 + c/y (c = -a(1) > 0) and claimed x = (p+qK)/(s+tK),
        y = c (s + tK) / ((p - b0 s) + (q - b0 t) K)
   — Möbius again. headShiftMobius performs that exact integer transform;
   the family then audits y (whose shifted spec satisfies the hypotheses)
   against the transformed form. Equivalent decision, zero new theory.

   MIT licensed. Part of cert-machine. */
'use strict';

const Q = require('#instruments/interval/rational.js');

/* raw fractions [n, d], d > 0, unreduced (matches minus.js conventions) */
const fCmp = (x, y) => { const l = x[0] * y[1], r = y[0] * x[1]; return l < r ? -1 : l > r ? 1 : 0; };
const fNorm = (x) => (x[1] < 0n ? [-x[0], -x[1]] : x);
function fToDouble(x) {
  const bits = (v) => (v < 0n ? -v : v).toString(2).length;
  const sh = BigInt(Math.max(0, Math.max(bits(x[0]), bits(x[1])) - 512));
  return Number(x[0] >> sh) / Number(x[1] >> sh);
}

/* interval p + q*K for integer p, q and K = {lo, hi} fractions */
function affine(p, q, K) {
  const at = (f) => fNorm([p * f[1] + q * f[0], f[1]]);
  const a = at(K.lo), b = at(K.hi);
  return q >= 0n ? { lo: a, hi: b } : { lo: b, hi: a };
}

/* the exact bracket of (p + qK)/(s + tK); REFUSED if the denominator
   interval touches 0 */
function mobiusBracket(form, K) {
  const p = BigInt(form.p), q = BigInt(form.q || 0), s = BigInt(form.s || 0), t = BigInt(form.t || 0);
  const num = affine(p, q, K), den = affine(s, t, K);
  const denPos = den.lo[0] > 0n, denNeg = den.hi[0] < 0n;
  if (!denPos && !denNeg) return { ok: false, why: 'form denominator interval contains 0 — REFUSED' };
  const quot = (a, b) => fNorm([a[0] * b[1], a[1] * b[0]]);
  const cands = [quot(num.lo, den.lo), quot(num.lo, den.hi), quot(num.hi, den.lo), quot(num.hi, den.hi)];
  let lo = cands[0], hi = cands[0];
  for (const c of cands) { if (fCmp(c, lo) < 0) lo = c; if (fCmp(c, hi) > 0) hi = c; }
  return { ok: true, lo, hi, width: fToDouble([hi[0] * lo[1] - lo[0] * hi[1], hi[1] * lo[1]]) };
}

/* the exact head-shift transform: x = b0 + c/y, x = (p+qK)/(s+tK)
   => y = (c s + c t K)/((p - b0 s) + (q - b0 t) K) */
function headShiftMobius(form, b0, c) {
  const p = BigInt(form.p), q = BigInt(form.q || 0), s = BigInt(form.s || 0), t = BigInt(form.t || 0);
  const B0 = BigInt(b0), C = BigInt(c);
  return { p: C * s, q: C * t, s: p - B0 * s, t: q - B0 * t };
}

/* decide: is the form bracket disjoint from the CF enclosure [lo, hi]
   (doubles, converted losslessly)? */
function decideForm(enclosure, form, K) {
  const mb = mobiusBracket(form, K);
  if (!mb.ok) return { verdict: 'REFUSED', why: mb.why };
  const cfLo = Q.fromDouble(enclosure[0]), cfHi = Q.fromDouble(enclosure[1]);
  const disjoint = fCmp([cfHi.n, cfHi.d], mb.lo) < 0 || fCmp(mb.hi, [cfLo.n, cfLo.d]) < 0;
  return { disjoint, formWidth: mb.width, formLo: fToDouble(mb.lo), formHi: fToDouble(mb.hi) };
}

module.exports = { mobiusBracket, headShiftMobius, decideForm, _f: { fCmp, fNorm, fToDouble } };
