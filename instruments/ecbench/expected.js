/* instruments/ecbench/expected.js — Table 1 of the benchmark paper, certified.

   The paper puts an "expected number of points outside" beside every count:
   E = n · α_t, with α = 1/(T · 365.25 · 24) the hourly exceedance probability
   of a T-year contour and α_t the probability the contour is exceeded
   ANYWHERE — α itself for total-exceedance constructions, and for IFORM
       α_t = 1 − χ²₂(β²) = exp(−β²/2),     β = Φ⁻¹(1 − α),
   because the IFORM contour is the image of the circle of radius β and the
   squared norm of a standard 2-D Gaussian is χ²₂. The total-exceedance value
   is an exact rational. The IFORM value needs Φ⁻¹, and it is ENCLOSED:

   erfc on x > 0 by Laplace's continued fraction
       √π e^{x²} erfc(x) = 1 / (x + (1/2)/(x + 1/(x + (3/2)/(x + 2/(x + …)))))
   whose elements are all positive, so consecutive convergents bracket the
   value [STANDARD: even/odd approximants of a positive continued fraction are
   monotone from opposite sides]. Both are evaluated in outward-rounded
   interval arithmetic and their hull is the enclosure. β is then bracketed by
   bisection on ½·erfc(β/√2) − α, tightening only when the sign is certain.
   Everything downstream (exp, the product with n) is interval arithmetic
   from instruments/interval. */
'use strict';
const path = require('path');
const IV = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const TR = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const Q = require(path.join(__dirname, '..', 'interval', 'rational.js'));

const sqrtIv = (a) => { if (a[0] < 0) throw new Error('sqrt of a negative interval'); return [IV.nextDown(Math.sqrt(a[0])), IV.nextUp(Math.sqrt(a[1]))]; };
const SQRT_PI = sqrtIv(TR.PI), SQRT2 = sqrtIv(IV.iv(2));

/* the N-th convergent of the Laplace fraction at a thin x, as an interval */
function convergent(x, N) {
  let t = IV.iv(x);                                  /* innermost: x */
  for (let k = N; k >= 1; k--) t = IV.add(IV.iv(x), IV.div(IV.iv(k / 2), t));   /* x + a_k / t */
  return IV.div(IV.ONE, t);
}
/* erfc(x) for x ≥ 1 as an interval; N chosen so the bracket is tight at the x this file meets */
function erfc(x, N) {
  if (!(x >= 1)) throw new Error('expected.erfc: the fraction is used for x ≥ 1 only, got ' + x);
  N = N || 80;
  const a = convergent(x, N), b = convergent(x, N + 1);
  const hull = [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
  const pre = IV.div(TR.exp(IV.neg(IV.sqr(IV.iv(x)))), SQRT_PI);   /* e^{−x²}/√π */
  return IV.mul(pre, hull);
}
/* ½·erfc(β/√2) − α as an interval, α thin */
function tailMinusAlpha(beta, alpha) {
  const z = IV.div(IV.iv(beta), SQRT2);
  /* z is an interval; erfc is decreasing, so evaluate at both ends */
  const lo = erfc(z[1]), hi = erfc(z[0]);
  const half = IV.mul(IV.iv(0.5), [lo[0], hi[1]]);
  return IV.sub(half, IV.iv(alpha));
}
/* bracket β = Φ⁻¹(1 − α): returns [lo, hi] with the sign certain outside it */
function betaBracket(alpha) {
  let lo = 1.5, hi = 9;
  if (!(tailMinusAlpha(lo, alpha)[0] > 0)) throw new Error('β bracket: lower end not certainly positive');
  if (!(tailMinusAlpha(hi, alpha)[1] < 0)) throw new Error('β bracket: upper end not certainly negative');
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const f = tailMinusAlpha(mid, alpha);
    if (f[0] > 0) lo = mid; else if (f[1] < 0) hi = mid; else break;   /* undecidable at this width: stop, keep the bracket */
    if (hi - lo < 1e-13) break;
  }
  return [lo, hi];
}

const dec = (r, d) => { /* rational -> fixed decimal string, truncated */
  const neg = Q.sign(r) < 0; const a = Q.abs(r);
  const scale = 10n ** BigInt(d); const t = (a.n * scale) / a.d;
  const s = t.toString().padStart(d + 1, '0');
  return (neg ? '-' : '') + s.slice(0, -d) + (d ? '.' + s.slice(-d) : '');
};

/* the expected numbers for n hourly observations and a T-year contour */
function expectedOutside(n, T) {
  const alphaQ = Q.R(1n, BigInt(T) * 8766n);                /* 365.25 × 24 = 8766 exactly */
  const totalQ = Q.mul(Q.R(BigInt(n)), alphaQ);
  const alpha = Number(alphaQ.n) / Number(alphaQ.d);        /* thin double image for the bracket; the enclosure below absorbs its rounding */
  /* α as an interval around the exact rational: the two doubles enclosing it */
  const aIv = [IV.nextDown(alpha), IV.nextUp(alpha)];
  /* bracket at both ends of aIv: β is decreasing in α */
  const bHiEnd = betaBracket(aIv[0]), bLoEnd = betaBracket(aIv[1]);
  const beta = [bLoEnd[0], bHiEnd[1]];
  const alphaT = TR.exp(IV.neg(IV.div(IV.sqr(beta), IV.iv(2))));   /* exp(−β²/2), monotone: the interval does it */
  const E = IV.mul(IV.iv(n), alphaT);
  return {
    alpha: { exact: Q.toString(alphaQ), decimal: dec(alphaQ, 12) },
    total: { exact: Q.toString(totalQ), decimal: dec(totalQ, 4) },
    beta: { lo: beta[0].toFixed(10), hi: beta[1].toFixed(10) },
    alphaT: { lo: alphaT[0].toExponential(8), hi: alphaT[1].toExponential(8) },
    iform: { lo: E[0].toFixed(3), hi: E[1].toFixed(3) },
  };
}

module.exports = { erfc, convergent, betaBracket, expectedOutside, tailMinusAlpha };
