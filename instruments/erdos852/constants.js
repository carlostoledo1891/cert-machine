/* constants.js — certified enclosures for the two uncertified constants
   holding up the conjectured asymptotic h(x) ~ c0 log x on Erdős #852
   (distinct runs of consecutive prime gaps). Both were produced by GPT
   models in the problem's discussion thread (Turturean, 2026-04-24) and
   published as bare decimals with no error bound; this instrument replaces
   them with interval enclosures whose every step carries a proof.

   c0 — the unique positive root of I0(c) = 1, where
        I0(c) = c + c log((e^{2c}-1)/(2c)) + (1/2) Li2(1 - e^{2c})
     is the saddle-point rate function of the iid geometric-gap model.
     EVALUATION: for c in the bracket, x = e^{2c}-1 > 1, so the dilog is
     taken through the inversion identity (Landen; Lewin, Polylogarithms,
     eq. 1.12: Li2(-x) + Li2(-1/x) = -pi^2/6 - (1/2) log^2 x for x > 0),
     leaving only Li2 on the small disk:
        I0(c) = c + c(log x - log 2c) - pi^2/12 - (1/4) log^2 x
                  - (1/2) Li2(-1/x).
     UNIQUENESS: I0'(c) = log((e^{2c}-1)/(2c)) by elementary calculus
     (Li2'(z) = -log(1-z)/z with 1-z = e^{2c} collapses every other term),
     and e^{2c} > 1 + 2c for c > 0 makes it strictly positive; the strict
     inequality is certified on the bracket, the derivative identity is the
     one consumed calculus fact (float-checked in the battery).

   C* — (1/2)(prod_{p >= 3} (1 + 1/(p-1)^3) - 1), the odd-prime
     singular-series pressure constant. Partial product over p <= LIMIT in
     directed-rounding bigfloat; the tail multiplier T = prod_{p > LIMIT}
     (1 + a_p) obeys 1 <= T <= exp(S) <= 1 + S + S^2 (valid for S <= 1/2)
     with the tail sum certified by
        sum_{p > LIMIT} 1/(p-1)^3 <= sum_{m >= LIMIT} 1/m^3
                                  <= int_{LIMIT-1}^inf dt/t^3
                                   = 1/(2(LIMIT-1)^2) = S,
     using only p >= LIMIT+1 => p-1 >= LIMIT. The same product engine runs
     the calibration prod_{p >= 3}(1 + 1/(p^2-1)) = pi^2/8 (Euler), whose
     truth the battery asserts — and whose failure under a zeroed tail is
     the mutation red control.

   MIT licensed. Part of cert-machine. */
'use strict';

const B = require('#instruments/bigfloat/bigfloat.js');
const F = require('#instruments/bigfloat/functions.js');
const { I, fromInt, fromRatio, IONE, add, sub, neg, mul, div, sqr, cmp, bf } = B;

/* ---- I0 on an interval C (all c in C must have e^{2c} - 1 > 1) ---- */
function I0(C, P) {
  const twoC = mul(fromInt(2), C, P);
  const E = F.exp(twoC, P);
  const x = sub(E, IONE, P);
  if (!(cmp(x.lo, bf(1n, 0)) > 0)) {
    throw new Error('erdos852.I0: need e^{2c} - 1 > 1 on the whole interval (inversion domain)');
  }
  const Lx = F.log(x, P);
  const L2c = F.log(twoC, P);
  const pi2 = sqr(F.pi(P), P);
  const li = F.li2Small(neg(div(IONE, x, P)), P);
  /* c + c(Lx - L2c) - pi^2/12 - Lx^2/4 - li/2 */
  let r = add(C, mul(C, sub(Lx, L2c, P), P), P);
  r = sub(r, div(pi2, fromInt(12), P), P);
  r = sub(r, div(sqr(Lx, P), fromInt(4), P), P);
  r = sub(r, div(li, fromInt(2), P), P);
  return r;
}

/* certify e^{2c} > 1 + 2c on the closed interval [a, b] (=> I0' > 0 there) */
function certifyIncreasing(a, b, P) {
  const C = I(a, b);
  const twoC = mul(fromInt(2), C, P);
  const E = F.exp(twoC, P);
  return B.isPositive(sub(E, add(IONE, twoC, P), P));
}

/* bisection for the root of I0 = 1, every sign decision certified.
   Returns { lo, hi, iters, note } with I0(lo) < 1 < I0(hi) proved. */
function rootC0(opts) {
  const P = (opts && opts.P) || 256;
  const targetBits = (opts && opts.targetBits) || 140;
  let a = bf(5n, -2);      /* 1.25   */
  let b = bf(11n, -3);     /* 1.375  */
  const one = fromInt(1);
  if (!B.isNegative(sub(I0(I(a), P), one, P))) throw new Error('erdos852.rootC0: I0(1.25) < 1 failed to certify');
  if (!B.isPositive(sub(I0(I(b), P), one, P))) throw new Error('erdos852.rootC0: I0(1.375) > 1 failed to certify');
  if (!certifyIncreasing(a, b, P)) throw new Error('erdos852.rootC0: monotonicity inequality failed to certify');
  /* dyadic midpoint: align exponents exactly, then halve */
  const mid = (u, v) => {
    const s = B.addExact(u, v);
    return { m: s.m, e: s.e - 1 };
  };
  let iters = 0, note = 'width target reached';
  while (iters < targetBits) {
    const m = mid(a, b);
    const d = sub(I0(I(m), P), one, P);
    if (B.isNegative(d)) a = m;
    else if (B.isPositive(d)) b = m;
    else { note = 'sign undecidable at working precision — bracket stops here'; break; }
    iters++;
  }
  return { lo: a, hi: b, iters, note, P };
}

/* ---- odd-prime sieve ---- */
function oddPrimes(limit) {
  const sieve = new Uint8Array(limit + 1);
  const out = [];
  for (let i = 2; i * i <= limit; i++) if (!sieve[i]) for (let j = i * i; j <= limit; j += i) sieve[j] = 1;
  for (let p = 3; p <= limit; p += 2) if (!sieve[p]) out.push(p);
  return out;
}

/* generic certified Euler product over odd primes:
   prod_{3 <= p <= limit} (1 + fNum(p)/fDen(p)) x tail [1, 1 + S + S^2],
   S = tailS = {n, d} a PROVEN upper bound (rational) on sum_{p > limit} f(p).
   The caller supplies the tail-sum proof; the battery's mutation red feeds
   S = 0 into the calibration and must watch containment fail. */
function eulerProduct(opts) {
  const { limit, fNum, fDen, tailS, P } = opts;
  const primes = oddPrimes(limit);
  let prod = IONE;
  for (const p of primes) {
    const den = fDen(p), num = fNum(p);
    prod = mul(prod, fromRatio(den + num, den, P), P);
  }
  const S = fromRatio(tailS.n, tailS.d, P);
  if (!(cmp(S.hi, bf(1n, -1)) <= 0)) throw new Error('erdos852.eulerProduct: tail bound S must be <= 1/2 for exp(S) <= 1+S+S^2');
  if (S.lo.m < 0n) throw new Error('erdos852.eulerProduct: tail bound S must be >= 0');
  const upperMul = add(add(IONE, S, P), sqr(S, P), P);
  return {
    enclosure: I(prod.lo, B.roundUp(B.mulExact(prod.hi, upperMul.hi), P)),
    primes: primes.length, limit
  };
}

/* C* = (prod_{p>=3}(1 + 1/(p-1)^3) - 1)/2 */
function cstar(opts) {
  const limit = (opts && opts.limit) || 30000000;
  const P = (opts && opts.P) || 192;
  const L = BigInt(limit);
  const ep = eulerProduct({
    limit, P,
    fNum: () => 1n,
    fDen: (p) => { const q = BigInt(p) - 1n; return q * q * q; },
    /* sum_{p>limit} 1/(p-1)^3 <= sum_{m>=limit} 1/m^3 <= 1/(2(limit-1)^2) */
    tailS: { n: 1n, d: 2n * (L - 1n) * (L - 1n) }
  });
  const enclosure = div(sub(ep.enclosure, IONE, P), fromInt(2), P);
  return { enclosure, primes: ep.primes, limit, P };
}

/* calibration product: prod_{p>=3}(1 + 1/(p^2-1)) = pi^2/8 (Euler).
   tailZero is the battery's mutation seam — never passed by a family. */
function calibrationProduct(opts) {
  const limit = (opts && opts.limit) || 100000;
  const P = (opts && opts.P) || 128;
  const L = BigInt(limit);
  return eulerProduct({
    limit, P,
    fNum: () => 1n,
    fDen: (p) => BigInt(p) * BigInt(p) - 1n,
    /* sum_{p>limit} 1/(p^2-1) <= sum_{m>=limit} 1/(m^2-1) = (1/2)(1/(limit-1) + 1/limit) <= 1/(limit-1) */
    tailS: (opts && opts.tailZero) ? { n: 0n, d: 1n } : { n: 1n, d: L - 1n }
  });
}

const cmpRat = B.cmpRat;

/* decide a published decimal ("1.32322827686395...") against a certified
   enclosure, in exact integer arithmetic, under BOTH reading conventions:
     truncation — truth in [d, d + 10^-k]        (the trailing "..." reading)
     rounding   — truth in [d - h, d + h], h = 10^-k/2
   VERIFIED: enclosure inside the truncation window (the printed digits ARE
   the leading digits of the truth). VERIFIED_ROUNDED: truncation fails but
   the enclosure sits inside the rounding window (the printed value is a
   correct rounding; the "..." is wrong). REFUTED: enclosure provably
   disjoint from the union of both windows. UNDECIDED otherwise. */
function decideClaimedDigits(enclosure, claimStr) {
  const m = /^(\d+)\.(\d+)$/.exec(claimStr);
  if (!m) throw new Error('erdos852.decideClaimedDigits: claim must be "int.frac", got ' + claimStr);
  const k = m[2].length;
  const num = BigInt(m[1] + m[2]);
  const den = 10n ** BigInt(k);
  if (cmpRat(enclosure.lo, num, den) >= 0 && cmpRat(enclosure.hi, num + 1n, den) <= 0) {
    return { verdict: 'VERIFIED', digits: k };
  }
  if (cmpRat(enclosure.lo, 2n * num - 1n, 2n * den) >= 0 && cmpRat(enclosure.hi, 2n * num + 1n, 2n * den) <= 0) {
    return { verdict: 'VERIFIED_ROUNDED', digits: k };
  }
  /* union of the two windows is [(2num-1)/(2den), (num+1)/den] */
  if (cmpRat(enclosure.hi, 2n * num - 1n, 2n * den) < 0 || cmpRat(enclosure.lo, num + 1n, den) > 0) {
    return { verdict: 'REFUTED', digits: k };
  }
  return { verdict: 'UNDECIDED', digits: k };
}

module.exports = { I0, certifyIncreasing, rootC0, oddPrimes, eulerProduct, cstar, calibrationProduct, cmpRat, decideClaimedDigits };
