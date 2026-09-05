/* pi.js — π as a certified rational enclosure, to any precision.
 *
 * The whole SVP acceptance predicate is exact integers except for a power of π,
 * and dimension 300 needs π^150, so a double-precision π is useless: the
 * relative error would be multiplied by 150 and the records being audited sit
 * within 1.4 parts in 10^4 of the wall. What is needed is a bracket [lo, hi]
 * containing π, of stated width, PROVED rather than looked up.
 *
 * Machin, 1706:      π/4 = 4·arctan(1/5) − arctan(1/239)
 * with               arctan(1/x) = Σ (−1)^k / ((2k+1) x^(2k+1))
 *
 * The series alternates with terms strictly decreasing in magnitude, so the
 * truncation error after K terms is smaller than the first omitted term — the
 * one place an alternating series is generous. Every term is computed by integer
 * division of a fixed-point scale, which truncates toward zero and so costs at
 * most 1 unit per term. Both errors are accumulated explicitly and the bracket
 * is widened by their sum, so the result is a bracket by construction and not by
 * hope.
 */
'use strict';

/* S·arctan(1/x), as a bracket in scaled integers */
function arctanInv(x, S) {
  const X = BigInt(x), X2 = X * X;
  let sum = 0n, pow = X, k = 0n, terms = 0n;
  for (; ;) {
    const den = (2n * k + 1n) * pow;
    if (den > S) break;                      // the term is below one scaled unit
    const t = S / den;
    sum += (k % 2n === 0n) ? t : -t;
    terms++;
    k++; pow *= X2;
  }
  /* the first omitted term bounds the tail; each of `terms` divisions cost < 1 */
  const tail = S / ((2n * k + 1n) * pow) + 1n;
  const slack = terms + tail + 1n;
  return { lo: sum - slack, hi: sum + slack };
}

/* π as { lo, hi, S } with lo/S ≤ π ≤ hi/S. `digits` is decimal places. */
function piScaled(digits) {
  const guard = 12n;                         // absorb the accumulated slack
  const S = 10n ** (BigInt(digits) + guard);
  const a = arctanInv(5, S), b = arctanInv(239, S);
  /* π = 16·arctan(1/5) − 4·arctan(1/239); subtraction flips the second bracket */
  const lo = 16n * a.lo - 4n * b.hi;
  const hi = 16n * a.hi - 4n * b.lo;
  const drop = 10n ** guard;
  /* rescale down to the requested precision, rounding outward so it stays a bracket */
  const flo = lo / drop - 1n;
  const fhi = hi / drop + 1n;
  return { lo: flo, hi: fhi, S: 10n ** BigInt(digits) };
}

/* π^e as a bracket of exact rationals { loNum, loDen, hiNum, hiDen } */
function piPow(e, digits) {
  const p = piScaled(digits);
  if (p.lo <= 0n) throw new Error('precision too low');
  const E = BigInt(e);
  return {
    loNum: p.lo ** E, loDen: p.S ** E,
    hiNum: p.hi ** E, hiDen: p.S ** E,
    digits,
  };
}

module.exports = { arctanInv, piScaled, piPow };
