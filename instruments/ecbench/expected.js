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
/* every decimal this file prints is DIRECTED (design/outward.js, the one copy of the rule): a lower end down, an upper end
   up, from the exact value. Until 2026-10-28 dec() cut a rational with integer division and the enclosures went through
   toFixed / toExponential, so the ledger carried 36524/36525 as "0.9999" (it is 0.99997…), 18503/35064 as "0.5276"
   (0.52769…), 18262/36525 as "0.4999" (0.49998…), and every IFORM and β enclosure with both ends rounded to nearest. */
const O = require(path.join(__dirname, '..', '..', 'design', 'outward.js'));

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

/* an exact rational at d decimals, three ways and never cut: lo = toward −∞, hi = toward +∞, nearest = half away
   from zero (for a reader that prints "≈"). lo === hi exactly when the rational is that decimal. */
function decQ(r, d) {
  const scale = 10n ** BigInt(d), num = r.n * scale, den = r.d;          /* den > 0 (rational.js normalises the sign) */
  const fl = num >= 0n ? num / den : -((-num + den - 1n) / den);         /* floor */
  const exact = fl * den === num, ce = exact ? fl : fl + 1n;
  const twice = 2n * (num - fl * den);                                    /* 2 × the remainder, in [0, 2·den) */
  const nr = exact ? fl : (num >= 0n ? (twice >= den ? ce : fl) : (twice > den ? ce : fl));
  const str = (t) => { const neg = t < 0n, s = (neg ? -t : t).toString().padStart(d + 1, '0');
    return (neg ? '-' : '') + (d ? s.slice(0, -d) + '.' + s.slice(-d) : s); };
  return { lo: str(fl), hi: str(ce), nearest: str(nr) };
}
/* an interval of doubles at d decimals, outward */
const ivOut = (iv, d) => ({ lo: O.down(iv[0], d), hi: O.up(iv[1], d) });
/* k significant digits, outward, in fixed notation */
const ivSig = (iv, k) => ({ lo: O.sig(iv[0], k, false), hi: O.sig(iv[1], k, true) });

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
  const out = {
    alpha: Object.assign({ exact: Q.toString(alphaQ) }, decQ(alphaQ, 12)),
    total: Object.assign({ exact: Q.toString(totalQ) }, decQ(totalQ, 4)),
    beta: ivOut(beta, 10),
    alphaT: ivSig(alphaT, 9),
    iform: ivOut(E, 3),
  };
  const fault = directedFault(out);
  if (fault) throw new Error('expected.expectedOutside(' + n + ', ' + T + '): ' + fault);
  return out;
}

/* THE REFUSAL, for the writer and every reader of the ledger (one copy): a printed pair must enclose what it prints. A
   rational's lo and hi must bracket its exact value within one unit of the last digit, its nearest must be one of them,
   and no `decimal` key may survive (that name held the cut strings). An enclosure's lo must not exceed its hi. Returns
   the first fault in words, or null. */
const lit = (t) => { const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(String(t)); if (!m) return null;
  const f = m[3] || ''; return { n: BigInt(m[1] + m[2] + f), d: 10n ** BigInt(f.length), k: f.length }; };
function directedFault(e) {
  for (const key of ['alpha', 'total']) {
    const v = e[key]; if (!v) continue;
    if ('decimal' in v) return key + ' carries a "decimal" string (the cut form this file no longer writes)';
    const [p, q = '1'] = String(v.exact).split('/'); const N = BigInt(p), D = BigInt(q);
    const lo = lit(v.lo), hi = lit(v.hi), nr = lit(v.nearest);
    if (!lo || !hi || !nr || lo.k !== hi.k) return key + ' has no directed pair at one precision';
    if (lo.n * D > N * lo.d) return key + '.lo ' + v.lo + ' is above ' + v.exact;
    if (hi.n * D < N * hi.d) return key + '.hi ' + v.hi + ' is below ' + v.exact;
    if (hi.n - lo.n > 1n) return key + ' is wider than one unit of its last digit';
    if (v.nearest !== v.lo && v.nearest !== v.hi) return key + '.nearest is neither end';
  }
  for (const key of ['beta', 'iform']) {
    const v = e[key]; if (!v) continue;
    const lo = lit(v.lo), hi = lit(v.hi);
    if (!lo || !hi || lo.k !== hi.k || lo.n > hi.n) return key + ' is not an outward pair at one precision';
  }
  return null;
}

module.exports = { erfc, convergent, betaBracket, expectedOutside, tailMinusAlpha, decQ, directedFault };
