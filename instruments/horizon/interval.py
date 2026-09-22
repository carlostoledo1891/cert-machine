"""Sound interval arithmetic in Python, standard library only.

An interval is a pair of floats (lo, hi) with lo <= hi that CONTAINS the real
value it stands for. Every operation rounds outward with math.nextafter, so
containment survives every step; exp, log and 2^x are enclosed by truncated
series evaluated in exact rationals with a proved remainder, then rounded
outward once. This is the Python counterpart of instruments/interval
(interval.js, transcendental.js): the same discipline, the same containment
tests, no shared code — a cross-language witness for the fits it certifies.

Nothing here is fast. The consumers (instruments/horizon/fit.py) evaluate a
score over a few hundred data points a few dozen times; that is seconds.
"""
from __future__ import annotations

import math
from fractions import Fraction
from typing import Tuple

Iv = Tuple[float, float]

INF = float("inf")


def nd(x: float) -> float:
    return math.nextafter(x, -INF)


def nu(x: float) -> float:
    return math.nextafter(x, INF)


def iv(lo: float, hi: float = None) -> Iv:
    if hi is None:
        hi = lo
    if not (lo <= hi):
        raise ValueError(f"not an interval: [{lo}, {hi}]")
    return (float(lo), float(hi))


def from_fraction(q: Fraction) -> Iv:
    """The tightest float interval containing an exact rational."""
    f = float(q)                     # correctly rounded (round-to-nearest) by Python
    lo, hi = f, f
    while Fraction(lo) > q:
        lo = nd(lo)
    while Fraction(hi) < q:
        hi = nu(hi)
    return (lo, hi)


def add(a: Iv, b: Iv) -> Iv:
    return (nd(a[0] + b[0]), nu(a[1] + b[1]))


def sub(a: Iv, b: Iv) -> Iv:
    return (nd(a[0] - b[1]), nu(a[1] - b[0]))


def neg(a: Iv) -> Iv:
    return (-a[1], -a[0])


def mul(a: Iv, b: Iv) -> Iv:
    ps = (a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1])
    return (nd(min(ps)), nu(max(ps)))


def div(a: Iv, b: Iv) -> Iv:
    if b[0] <= 0 <= b[1]:
        raise ZeroDivisionError(f"division by an interval containing zero: {b}")
    qs = (a[0] / b[0], a[0] / b[1], a[1] / b[0], a[1] / b[1])
    return (nd(min(qs)), nu(max(qs)))


def scale(a: Iv, c: float) -> Iv:
    return mul(a, (c, c))


def hull(a: Iv, b: Iv) -> Iv:
    return (min(a[0], b[0]), max(a[1], b[1]))


def mid(a: Iv) -> float:
    return (a[0] + a[1]) / 2


def rad(a: Iv) -> float:
    return (a[1] - a[0]) / 2


def mag(a: Iv) -> float:
    return max(abs(a[0]), abs(a[1]))


def interior(a: Iv, b: Iv) -> bool:
    """a strictly inside b."""
    return b[0] < a[0] and a[1] < b[1]


def contains(a: Iv, x: float) -> bool:
    return a[0] <= x <= a[1]


# ------------------------------------------------------------ transcendentals
# exp on a rational: Taylor to N terms with the Lagrange remainder bounded by
# |x|^N / N! · exp(|x|) <= |x|^N / N! · 3^ceil(|x|)  for |x| <= the reduction
# bound below. Argument reduction: exp(x) = exp(r) · 2^k with x = k ln2 + r,
# |r| <= ln2/2 + (the width of the ln2 enclosure), and ln2 is enclosed by its
# own series. The whole thing is exact rational arithmetic until the last step.

_LN2_TERMS = 48
_EXP_TERMS = 26
_LOG_TERMS = 60


def _ln2_bounds() -> Tuple[Fraction, Fraction]:
    """ln 2 = 2 Σ_{k>=0} 1/((2k+1) 3^(2k+1)); the tail after K terms is below
    2/((2K+1) 3^(2K+1)) · 9/8 (a geometric bound)."""
    s = Fraction(0)
    for k in range(_LN2_TERMS):
        odd = 2 * k + 1
        s += Fraction(1, odd * 3 ** odd)
    s *= 2
    K = _LN2_TERMS
    tail = Fraction(2, (2 * K + 1) * 3 ** (2 * K + 1)) * Fraction(9, 8)
    return s, s + tail


LN2_Q = _ln2_bounds()               # exact rational bounds on ln 2
LN2 = (nd(float(LN2_Q[0])), nu(float(LN2_Q[1])))


def _exp_small_bounds(r: Fraction) -> Tuple[Fraction, Fraction]:
    """exp(r) for a rational |r| <= 1: N Taylor terms; the remainder lies in
    [0, |r|^N/N! · 3] for r >= 0 and in [-|r|^N/N!, |r|^N/N!] for r < 0
    (|R_N| <= |r|^N/N! · max(1, e^r) <= 3 |r|^N / N!)."""
    if abs(r) > 1:
        raise ValueError("exp reduction failed: |r| > 1")
    s, term = Fraction(0), Fraction(1)
    for n in range(_EXP_TERMS):
        s += term
        term = term * r / (n + 1)
    tail = 3 * abs(r) ** _EXP_TERMS / math.factorial(_EXP_TERMS)
    return s - tail, s + tail


def exp_point(x: Fraction) -> Tuple[Fraction, Fraction]:
    """Rational bounds on exp(x) for a rational x with |x| <= 700."""
    if abs(x) > 700:
        raise ValueError("exp argument out of range")
    lo2, hi2 = LN2_Q
    k = int(round(x / lo2))                          # x = k ln2 + r
    # r lies in [x - k·hi2, x - k·lo2] or the reverse, depending on the sign of k
    r_lo, r_hi = (x - k * hi2, x - k * lo2) if k >= 0 else (x - k * lo2, x - k * hi2)
    e_lo = _exp_small_bounds(r_lo)[0]
    e_hi = _exp_small_bounds(r_hi)[1]
    p = Fraction(2) ** k
    return e_lo * p, e_hi * p


def exp(a: Iv) -> Iv:
    """exp is increasing: enclose at the two ends."""
    lo = exp_point(Fraction(a[0]))[0]
    hi = exp_point(Fraction(a[1]))[1]
    return (from_fraction(lo)[0], from_fraction(hi)[1])


def _log_mantissa_bounds(m: Fraction) -> Tuple[Fraction, Fraction]:
    """ln m for a rational m in [1/2, 2]: ln m = 2 atanh(u), u = (m-1)/(m+1),
    |u| <= 1/3; atanh(u) = Σ u^(2k+1)/(2k+1), the tail after K terms below
    |u|^(2K+1)/(2K+1) · 1/(1-u²) <= |u|^(2K+1)/(2K+1) · 9/8."""
    if not (Fraction(1, 2) <= m <= 2):
        raise ValueError("log mantissa out of range")
    u = (m - 1) / (m + 1)
    s, p = Fraction(0), u
    for k in range(_LOG_TERMS):
        s += p / (2 * k + 1)
        p = p * u * u
    tail = abs(u) ** (2 * _LOG_TERMS + 1) / (2 * _LOG_TERMS + 1) * Fraction(9, 8)
    return 2 * (s - tail), 2 * (s + tail)


def log_point(x: Fraction) -> Tuple[Fraction, Fraction]:
    """Rational bounds on ln x for a positive rational x: x = m · 2^k with
    m in [1/2, 2), ln x = ln m + k ln 2."""
    if x <= 0:
        raise ValueError("log of a non-positive number")
    k = 0
    m = x
    while m >= 2:
        m /= 2
        k += 1
    while m < 1:
        m *= 2
        k -= 1
    mlo, mhi = _log_mantissa_bounds(m)
    lo2, hi2 = LN2_Q
    if k >= 0:
        return mlo + k * lo2, mhi + k * hi2
    return mlo + k * hi2, mhi + k * lo2


def log(a: Iv) -> Iv:
    if a[0] <= 0:
        raise ValueError(f"log of an interval touching zero: {a}")
    lo = log_point(Fraction(a[0]))[0]
    hi = log_point(Fraction(a[1]))[1]
    return (from_fraction(lo)[0], from_fraction(hi)[1])


def log2(a: Iv) -> Iv:
    return div(log(a), LN2)


def exp2(a: Iv) -> Iv:
    """2^x = exp(x ln 2)."""
    return exp(mul(a, LN2))


def logistic(z: Iv) -> Iv:
    """1 / (1 + exp(-z)), increasing in z."""
    e = exp(neg(z))
    return div((1.0, 1.0), add((1.0, 1.0), e))
