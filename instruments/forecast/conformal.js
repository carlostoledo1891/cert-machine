/* conformal.js — prediction intervals whose coverage claim is a THEOREM.
   instruments/forecast · cert-machine

   Full conformal prediction over exchangeable values, exact arithmetic.
   Given n calibration values and a miss-rate alpha, the interval is a
   pair of order statistics [X_(l), X_(u)] of the calibration set, and
   the guarantee is the rank-uniformity lemma: for an exchangeable
   sequence X_1..X_{n+1} (distinct values), the rank of X_{n+1} among
   all n+1 is uniform on {1..n+1}, so

       P( X_(l) <= X_{n+1} <= X_(u) )  =  (u - l) / (n + 1)

   — a counting statement, not a model. Ties only enlarge coverage of
   the closed interval (the conservative direction). The hypothesis is
   EXCHANGEABILITY and it is part of every certificate this module
   emits: a non-exchangeable feed (trend, regime change) voids the
   theorem, and the adapter must say how it grouped data to make
   exchangeability plausible.

   The instrument REFUSES when n is too small for the requested alpha
   (the smallest provable miss-rate with n values is 2/(n+1)) — a
   coverage claim we cannot prove is a claim we do not make.

   Values are integers or exact rationals [num, den]. No floats decide
   anything. MIT licensed. Part of cert-machine.                          */
'use strict';

/* ---- exact rationals over BigInt ---- */
const rat = (x) => Array.isArray(x) ? [BigInt(x[0]), BigInt(x[1])] : [BigInt(x), 1n];
const cmp = (a, b) => { const d = a[0] * b[1] - b[0] * a[1]; return d < 0n ? -1 : d > 0n ? 1 : 0; };
const ratStr = (a) => a[1] === 1n ? String(a[0]) : String(a[0]) + '/' + String(a[1]);

/* interval(values, alphaNum, alphaDen) -> certificate | REFUSED
   alpha = alphaNum/alphaDen (e.g. 1,4 for 25%). Symmetric trim. */
function interval(values, alphaNum, alphaDen) {
  const n = values.length;
  const aN = BigInt(alphaNum), aD = BigInt(alphaDen);
  if (n < 1 || aN <= 0n || aN >= aD) return { verdict: 'REFUSED', why: 'need n >= 1 and 0 < alpha < 1' };
  const xs = values.map(rat).sort(cmp);
  /* need (u - l) / (n+1) >= 1 - alpha with 1 <= l < u <= n:
     max achievable u - l = n - 1, so feasibility is (n-1)*aD >= (n+1)*(aD-aN) */
  const N = BigInt(n);
  if ((N - 1n) * aD < (N + 1n) * (aD - aN)) {
    return { verdict: 'REFUSED', why: 'n = ' + n + ' cannot prove miss-rate ' + alphaNum + '/' + alphaDen
      + ' — the smallest provable miss-rate with n values is 2/(n+1) = 2/' + (n + 1) };
  }
  /* symmetric: trim t from each side, t = floor((n+1)*alpha/2), keep t >= 1 impossible?
     l = t or 1 if t = 0; largest symmetric t with coverage still >= 1 - alpha */
  let t = (N + 1n) * aN / (2n * aD);              /* floor */
  if (t < 1n) t = 1n;
  while (t > 1n && (N - 2n * t) * aD < (N + 1n) * (aD - aN)) t--;   /* back off until coverage holds */
  let l = t, u = N + 1n - t;                       /* order-stat indices, 1-based */
  if ((u - l) * aD < (N + 1n) * (aD - aN)) { l = 1n; u = N; }        /* fall back to the widest */
  const covNum = u - l, covDen = N + 1n;
  return {
    verdict: 'CERTIFIED-COVERAGE',
    lo: xs[Number(l) - 1], hi: xs[Number(u) - 1],
    loStr: ratStr(xs[Number(l) - 1]), hiStr: ratStr(xs[Number(u) - 1]),
    n, l: Number(l), u: Number(u),
    coverage: [covNum, covDen], coverageStr: String(covNum) + '/' + String(covDen),
    theorem: 'IF the next value is exchangeable with the ' + n + ' calibration values (distinct), THEN '
      + 'P(lo <= next <= hi) = ' + covNum + '/' + covDen + ' exactly (>= with ties) — rank-uniformity, a counting lemma.',
    hypothesis: 'exchangeability; the adapter must state how the data was grouped to make it plausible',
  };
}

/* exact coverage COUNT of an interval [lo,hi] over outcomes — the audit side */
function countCoverage(outcomes, lo, hi) {
  const L = rat(lo), H = rat(hi);
  let inside = 0;
  for (const y of outcomes) { const Y = rat(y); if (cmp(L, Y) <= 0 && cmp(Y, H) <= 0) inside++; }
  return { inside, total: outcomes.length };
}

module.exports = { interval, countCoverage, _rat: rat, _cmp: cmp };
