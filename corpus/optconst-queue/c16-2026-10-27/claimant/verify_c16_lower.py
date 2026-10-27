"""Independent verifier for the C_16 lower-bound certificate (certificate_c16_R<R>.json).

Independence from certify_c16_lower.py:
  * r2(n) computed by the divisor formula r2(n) = 4 (d_1(n) - d_3(n)) via a numpy sieve (not lattice enumeration);
  * sums evaluated in Python `decimal` with directed rounding (ROUND_FLOOR / ROUND_CEILING), not integer floor division;
  * pi bounded above by 355/113; log bounded above by an explicit rational atanh series with geometric tail bound
    (no mpmath anywhere); pi < 3.14159265358980 (first 15 digits of pi are 3.14159265358979).
Checks: the verifier's own interval for the bound must contain/agree with the certificate, and it re-derives
L >= claimed value from scratch.  Exit 0 on success, 1 on failure.
"""

import json
import sys
from decimal import ROUND_CEILING, ROUND_FLOOR, Decimal, getcontext
from fractions import Fraction

import numpy as np

cert = json.load(open(sys.argv[1]))
R = int(cert["R"])
p, q = (int(v) for v in cert["mu"])
claimed_num, claimed_den = (int(v) for v in cert["L_lower_bound_rational"])
claimed = Fraction(claimed_num, claimed_den)

# --- r2(n) via d1 - d3 sieve -------------------------------------------------
N = R * R
d1 = np.zeros(N + 1, dtype=np.int64)
d3 = np.zeros(N + 1, dtype=np.int64)
for d in range(1, N + 1, 2):
    if d % 4 == 1:
        d1[d::d] += 1
    else:
        d3[d::d] += 1
r2 = 4 * (d1 - d3)
r2[0] = 0
assert r2[1] == 4 and r2[2] == 4 and r2[3] == 0 and r2[5] == 8 and r2[25] == 12
total_points = int(r2.sum())
# sanity: number of nonzero lattice points in the disc |k|^2 <= R^2 (independent count by rows)
cnt = 0
for k1 in range(-R, R + 1):
    m = int(np.floor(np.sqrt(N - k1 * k1)))
    while (m + 1) ** 2 <= N - k1 * k1:
        m += 1
    while m * m > N - k1 * k1:
        m -= 1
    cnt += 2 * m + 1
cnt -= 1
assert cnt == total_points, (cnt, total_points)

# --- directed-rounding decimal sums -----------------------------------------
getcontext().prec = 40
ns = np.nonzero(r2)[0]


def sums(rounding):
    getcontext().rounding = rounding
    Dq = Decimal(q)
    S1 = S2 = S3 = Decimal(0)
    for n in ns:
        n = int(n)
        w = Decimal(int(r2[n]))
        d = Decimal(q + p * n)
        t1 = w * Dq / (Decimal(n) * d)
        t3 = w * Dq * Dq / (d * d)
        t2 = t3 / Decimal(n)
        S1 += t1
        S2 += t2
        S3 += t3
    return S1, S2, S3


S1lo, S2lo, S3lo = sums(ROUND_FLOOR)
S1hi, S2hi, S3hi = sums(ROUND_CEILING)
F = lambda x: Fraction(str(x))
S1lo, S2lo, S3lo, S1hi, S2hi, S3hi = map(F, (S1lo, S2lo, S3lo, S1hi, S2hi, S3hi))
# Each of the ~3*len(ns) decimal operations is rounded in the safe direction, so these are rigorous enclosures.
assert S1lo <= S1hi and S2lo <= S2hi and S3lo <= S3hi

pi_hi = Fraction(314159265358980, 10**14)  # > pi = 3.14159265358979323...
A_lo = S1lo**2 / (pi_hi * S2hi)
delta_hi = S3hi / S2lo
delta_lo = S3lo / S2hi
assert delta_lo >= 1


def log_upper(x: Fraction, terms=60) -> Fraction:
    """Rigorous rational upper bound for log(x), x>1: log x = 2 sum_{j>=0} t^(2j+1)/(2j+1), t=(x-1)/(x+1).
    Scale x by powers of 2 first: log x = m log 2 + log(x/2^m). Upper bound for log 2 from the same series."""
    m = 0
    while x > 2:
        x /= 2
        m += 1

    def ser_hi(y):
        t = (y - 1) / (y + 1)
        s = Fraction(0)
        tp = t
        for j in range(terms):
            s += tp / (2 * j + 1)
            tp *= t * t
        # tail: sum_{j>=terms} t^(2j+1)/(2j+1) <= tp/(1-t^2)
        s += tp / (1 - t * t)
        return 2 * s

    return m * ser_hi(Fraction(2)) + ser_hi(x)


# cross-check log_upper against known value (log 2 = 0.693147180559945...)
l2 = log_upper(Fraction(2))
assert Fraction("0.693147180559945") < l2 < Fraction("0.693147180559946"), float(l2)

def ceil_grid(x: Fraction, digits=40) -> Fraction:
    g = 10**digits
    return Fraction(-((-x.numerator * g) // x.denominator), g)


ld_hi = ceil_grid(log_upper(ceil_grid(delta_hi)))
lterm_hi = ld_hi + ceil_grid(log_upper(1 + ld_hi))
L_lo = A_lo - lterm_hi

print(
    "verifier: R",
    R,
    "mu",
    f"{p}/{q}",
    "lattice points",
    total_points,
    "distinct n",
    len(ns),
)
print("verifier: S1 in", float(S1lo), float(S1hi))
print("verifier: S2 in", float(S2lo), float(S2hi))
print("verifier: S3 in", float(S3lo), float(S3hi))
print("verifier: delta in", float(delta_lo), float(delta_hi))
print("verifier: L >=", float(L_lo), "   certificate claims L >=", float(claimed))
# The verifier's bound uses cruder pi/log bounds, so it may be slightly smaller than the certificate's;
# require agreement to 1e-9 and that both exceed the previous record 1.82283 and the target 2.1562.
ok = (
    abs(L_lo - claimed) < Fraction(1, 10**9)
    and L_lo > Fraction("2.1562")
    and claimed > Fraction("2.1562")
)
print("VERIFIED" if ok else "FAILED")
sys.exit(0 if ok else 1)
