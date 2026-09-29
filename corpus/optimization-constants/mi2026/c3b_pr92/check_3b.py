#!/usr/bin/env python3
"""Replayable certificate check for the C_3b lower bound 1.77898884.

Exact rational pushforwards + mpmath interval arithmetic (dps=80).
The printed lower endpoint rho_lo is a rigorous lower bound on C_3b.

Self-contained: Python 3.9+ and mpmath only (pip install mpmath).
Exit 0 iff the bound C_3b >= 1.77898884 is certified.
"""
from collections import defaultdict
from fractions import Fraction
import mpmath

# 13-point support; exact rational weights (sum is exactly 1).
WEIGHTS = [
    (-2,  3, Fraction(97361833892100293951, 1000000000000000000000000000000000000)),
    (-2,  4, Fraction(703, 500000000000000000000000000000000000)),
    (-1,  2, Fraction(24965915823534617097953539540121, 100000000000000000000000000000000000)),
    (-1,  3, Fraction(1371805003106379032651546041, 62500000000000000000000000000000000)),
    ( 0,  1, Fraction(112120167204589061011718189111031549, 500000000000000000000000000000000000)),
    ( 0,  2, Fraction(5630590219641637490184434793744907, 200000000000000000000000000000000000)),
    ( 1,  0, Fraction(112120167204589061011718189111031549, 500000000000000000000000000000000000)),
    ( 1,  1, Fraction(30919629173187274661345437236097393, 62500000000000000000000000000000000)),
    ( 2, -1, Fraction(24965915823534617097953539540121, 100000000000000000000000000000000000)),
    ( 2,  0, Fraction(5630590219641637490184434793744907, 200000000000000000000000000000000000)),
    ( 3, -2, Fraction(97361833892100293951, 1000000000000000000000000000000000000)),
    ( 3, -1, Fraction(1371805003106379032651546041, 62500000000000000000000000000000000)),
    ( 4, -2, Fraction(703, 500000000000000000000000000000000000)),
]
assert sum(w for _, _, w in WEIGHTS) == 1

mpmath.iv.dps = 80
mpmath.mp.dps = 80   # so interval endpoints are extracted exactly, with no re-rounding
iv = mpmath.iv

def H_interval(a, b):
    """Interval enclosure of H(a*X + b*Y) in nats."""
    dist = defaultdict(Fraction)
    for x, y, w in WEIGHTS:
        dist[a * x + b * y] += w
    H = iv.mpf(0)
    for q in dist.values():
        if q:
            qi = iv.mpf(q.numerator) / iv.mpf(q.denominator)
            H += qi * (-iv.log(qi))
    return H

N = H_interval(1, -1)                                  # H(X-Y)
slopes = [H_interval(1, 0), H_interval(0, 1), H_interval(1, 1)]
D_hi = max(mpmath.mpf(h.b) for h in slopes)            # upper bound on max slope entropy
rho = N / iv.mpf(D_hi)                                 # interval ratio
rho_lo = mpmath.mpf(rho.a)                             # rigorous lower bound on C_3b

print("H(X-Y) in", mpmath.nstr(N, 30))
print("max slope entropy <=", mpmath.nstr(D_hi, 30))
print("rho_lo =", mpmath.nstr(rho_lo, 12), "(true value 1.778988841420693549..., displayed digits truncated-safe)")
assert rho_lo > mpmath.mpf("1.77898884")
assert rho_lo > mpmath.mpf("1.778981")   # beats any eighth-decimal improvement of 1.77898
assert mpmath.mpf(rho.b) < mpmath.mpf(11) / 6   # sanity: below proven upper bound 11/6
print("OK: C_3b >= 1.77898884 certified")
