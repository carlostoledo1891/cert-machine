#!/usr/bin/env python3
"""threshold.py — lane M of corpus/lonely-runner/preregistration.json: the finite-checking threshold of
Theorem thm:flag and Corollary cor:mass, recomputed from the definitions in the paper's Section 3 (written here; the
author's kz_flag_check.py and flag_constants_recheck.py are not read), and the logarithmic mass of a set of primes
compared with it. Exact rationals; logarithms by Python's decimal module, whose ln is correctly rounded, at 80
digits and widened by one unit in the last place, so every comparison is between rigorous enclosures.

  python3 -I threshold.py [--primes 89,131,...]        -> JSON on stdout

Definitions (paper, Proposition prop:prefix, Lemma lem:minimize, Theorem thm:flag, Lemma lem:divisor), n = 14, d = n-1:
  B_r = (2r / ((n+1)(n+1-r)))^2,  B_0 = 0,  c_i = B_i - B_{i-1},  K_n = prod_{i=1}^{d} c_i,  A_n = K_n^(-1/2),
  ratio hypothesis: c_{i+1}/c_i > 4/3 for 1 <= i < d,
  threshold: log(v_1...v_n) < n log(A_n / (2n))  (with the shape bound R_n < 1/2, Lemma lem:shape — READ, not checked),
  forced divisor: lcm(2..n+1) | v_1...v_n, so the primes must carry  n log(A_n/(2n)) - log lcm(2..n+1).
"""
import json
import math
import sys
from decimal import Decimal, getcontext
from fractions import Fraction

getcontext().prec = 80
ULP = Decimal(10) ** -75


def ln_enclosure(q):
    """[lo, hi] containing log(q) for a positive rational q"""
    x = Decimal(q.numerator) / Decimal(q.denominator)   # exact enough: 80 digits, then widened
    v = x.ln()
    return v - ULP, v + ULP


n = 14
d = n - 1
B = [Fraction(0)] + [Fraction(2 * r, (n + 1) * (n + 1 - r)) ** 2 for r in range(1, d + 1)]
c = [B[i] - B[i - 1] for i in range(1, d + 1)]
ratios = [c[i + 1] / c[i] for i in range(d - 1)]
K = Fraction(1)
for ci in c:
    K *= ci
# n log(A/(2n)) = n * (-1/2 log K - log(2n))
lk_lo, lk_hi = ln_enclosure(K)
l2n_lo, l2n_hi = ln_enclosure(Fraction(2 * n))
thr_lo = n * (-lk_hi / 2 - l2n_hi)
thr_hi = n * (-lk_lo / 2 - l2n_lo)
lcm = 1
for j in range(2, n + 2):
    lcm = lcm * j // math.gcd(lcm, j)
ll_lo, ll_hi = ln_enclosure(Fraction(lcm))
target_lo, target_hi = thr_lo - ll_hi, thr_hi - ll_lo
out = {
    'n': n,
    'K_n': '%d/%d' % (K.numerator, K.denominator),
    'minRatio': '%s' % min(ratios), 'ratioHypothesisHolds': all(r > Fraction(4, 3) for r in ratios),
    'A_n': str((Decimal(K.denominator) / Decimal(K.numerator)).sqrt())[:30],
    'threshold': [str(thr_lo)[:24], str(thr_hi)[:24]],
    'lcm': lcm,
    'target': [str(target_lo)[:24], str(target_hi)[:24]],
    'notChecked': 'the proofs of Section 3 (prop:prefix, lem:kz, lem:minimize, lem:det, lem:shape) are read, not certified',
}
if '--primes' in sys.argv:
    ps = [int(x) for x in sys.argv[sys.argv.index('--primes') + 1].split(',') if x]
    assert all(q > 13 and all(q % t for t in range(2, int(q ** 0.5) + 1)) for q in ps), 'not all primes > 13'
    lo = sum(ln_enclosure(Fraction(q))[0] for q in ps)
    hi = sum(ln_enclosure(Fraction(q))[1] for q in ps)
    out['primes'] = len(ps)
    out['mass'] = [str(lo)[:24], str(hi)[:24]]
    out['massExceedsTarget'] = lo > target_hi
    out['shortfall'] = None if lo > target_hi else str(target_hi - lo)[:12]
print(json.dumps(out, indent=1))
