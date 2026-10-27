"""Independent verifier for certificate_c16_upper.json (C_16 upper bound).

Re-derives, with its own arithmetic, that  max_{delta>=1} F(delta) <= U:
  * box coverage: the boxes are contiguous and cover [1, D0] exactly; the asymptotic bound g(D0) <= U;
  * for every box [d1,d2] with its mu:  max(B_mu(d1), B_mu(d2)) <= U + 1e-9, where
        B_mu(delta) = S1(mu)(1+mu delta)/pi - log delta - log(1+log delta)      (convex in delta).
Independence from certify_c16_upper.py:
  * truncation radius R=1000 (certifier: 2000); r2(n) from the divisor sieve 4(d1-d3) (certifier: lattice enumeration);
  * partial sums by exact integer ceiling division to a 2^-100 grid (certifier: float64 + error factor);
  * pi: 3.14159265358979 < pi < 3.14159265358980 (hard-coded); Catalan G < 0.915965594177220 (hard-coded, G=0.9159655941772190...);
    also re-derived here from the alternating series (partial sums bracket G);
  * logs: rational atanh series (partial sum = lower bound, + geometric tail = upper bound); no mpmath, no numpy floats in bounds.
The tail bound for S1 is the same two-option bound (it is a theorem, not a computation):
  tail <= min( (Z2 - P2)/mu , pi log(1+1/(mu T^2)) + pi sqrt2/T ),  Z2 = (2 pi^2/3) G,  T = R - sqrt2.
Exit 0 iff VERIFIED.
"""

import json
import sys
from fractions import Fraction
from multiprocessing import Pool

import numpy as np

PREC = 100
SC = 1 << PREC
R = 1000
pi_lo = Fraction(314159265358979, 10**14)
pi_hi = Fraction(314159265358980, 10**14)
sqrt2_hi = Fraction(141421356237310, 10**14)  # sqrt2 = 1.41421356237309504...
assert sqrt2_hi * sqrt2_hi > 2
G_hi = Fraction(915965594177220, 10**15)
# Catalan check from alternating series: partial sums S_m with m even terms are below G, odd above... bracket G
s = Fraction(0)
for k in range(20001):
    s += Fraction((-1) ** k, (2 * k + 1) ** 2)
# after an odd number of terms (k=0..20000 -> 20001 terms, last term positive) the partial sum is an upper bound
assert s > G_hi - Fraction(1, 10**8) and s < G_hi + Fraction(1, 10**8), float(s)
# refine: use the partial sum itself as the rigorous upper bound if smaller
G_hi = min(G_hi, s) if s >= Fraction("0.91596559417721") else G_hi
Z2_hi = Fraction(2, 3) * pi_hi**2 * G_hi
T = R - sqrt2_hi


def ceil_grid(x: Fraction, digits=40) -> Fraction:
    g = 10**digits
    return Fraction(-((-x.numerator * g) // x.denominator), g)


def floor_grid(x: Fraction, digits=40) -> Fraction:
    g = 10**digits
    return Fraction((x.numerator * g) // x.denominator, g)


def _ser(y: Fraction, terms=60):
    t = (y - 1) / (y + 1)
    s = Fraction(0)
    tp = t
    for j in range(terms):
        s += tp / (2 * j + 1)
        tp *= t * t
    return 2 * s, 2 * tp / (1 - t * t)


LOG2_LO, tail2 = _ser(Fraction(2))
LOG2_HI = LOG2_LO + tail2


def log_lo(x: Fraction) -> Fraction:
    assert x > 0
    m = 0
    while x > 2:
        x /= 2
        m += 1
    while x < 1:
        x *= 2
        m -= 1
    # log x = m log2 + log(x'), x' in [1,2]; lower bound: smaller argument, no tail, log2 bound in the safe direction
    return floor_grid(m * (LOG2_LO if m >= 0 else LOG2_HI) + _ser(floor_grid(x))[0])


def log_hi(x: Fraction) -> Fraction:
    assert x > 0
    m = 0
    while x > 2:
        x /= 2
        m += 1
    while x < 1:
        x *= 2
        m -= 1
    s, tl = _ser(ceil_grid(x))
    return ceil_grid(m * (LOG2_HI if m >= 0 else LOG2_LO) + s + tl)


assert Fraction("0.693147180559945") < LOG2_LO < LOG2_HI < Fraction("0.693147180559946")
assert log_lo(Fraction(10)) < Fraction("2.302585092994046") and log_hi(Fraction(10)) > Fraction("2.302585092994045")

# ---- r2 via divisor sieve ---------------------------------------------------
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
ns = [int(n) for n in np.nonzero(r2)[0]]
ws = [int(r2[n]) for n in ns]
_cnt = -1  # independent lattice-point count by rows (excluding the origin)
for _k1 in range(-R, R + 1):
    _m = int((N - _k1 * _k1) ** 0.5)
    while (_m + 1) ** 2 <= N - _k1 * _k1:
        _m += 1
    while _m * _m > N - _k1 * _k1:
        _m -= 1
    _cnt += 2 * _m + 1
assert sum(ws) == _cnt, (sum(ws), _cnt)
P2_lo = Fraction(sum(w * SC // (n * n) for n, w in zip(ns, ws)), SC)


def S1_upper(mu: Fraction) -> Fraction:
    p, q = mu.numerator, mu.denominator
    # term = w q / (n (q + p n)); ceiling to grid
    tot = 0
    for n, w in zip(ns, ws):
        num = w * q * SC
        den = n * (q + p * n)
        tot += -((-num) // den)
    P1_hi = Fraction(tot, SC)
    tailA = (Z2_hi - P2_lo) / mu
    tailB = pi_hi * log_hi(1 + 1 / (mu * T * T)) + pi_hi * sqrt2_hi / T
    return P1_hi + min(tailA, tailB)


def B_upper(S1hi: Fraction, mu: Fraction, delta: Fraction) -> Fraction:
    ld = log_lo(delta)
    return S1hi * (1 + mu * delta) / pi_lo - ld - log_lo(1 + ld)


R0 = 100
T0 = R0 - sqrt2_hi
H_hi = Fraction(sum(-((-w * SC) // n) for n, w in zip(ns, ws) if n <= R0 * R0), SC)
K = H_hi / pi_lo - 2 * log_lo(T0) + sqrt2_hi / T0
assert K > 0


def g_upper(delta: Fraction) -> Fraction:
    # F(delta) <= g(delta) for delta > e (derivation in certify_c16_upper.py docstring); decreasing for delta >= e^e
    ld = log_lo(delta)
    return 1 + K + (K + log_hi(log_hi(delta))) / ld + 2 * T0 * T0 / (delta * ld)


def check_box(args):
    d1s, d2s, mus, b = args
    d1, d2 = Fraction(d1s), Fraction(d2s)
    mu = Fraction(float(mus))  # exact value of the float used by the certifier
    S1hi = S1_upper(mu)
    b = max(B_upper(S1hi, mu, d1), B_upper(S1hi, mu, d2))
    if d1 >= 16:
        b = min(b, g_upper(d1))
    return b


if __name__ == "__main__":
    cert = json.load(open(sys.argv[1]))
    U = Fraction(cert["U_rational"][0] + "/" + cert["U_rational"][1])
    D0 = Fraction(cert["D0"])
    assert int(cert["R0"]) == R0
    boxes = cert["boxes"]
    # coverage
    bs = sorted(boxes, key=lambda t: Fraction(t[0]))
    assert Fraction(bs[0][0]) == 1 and Fraction(bs[-1][1]) == D0
    for a, b in zip(bs, bs[1:]):
        assert Fraction(a[1]) == Fraction(b[0]), "gap in coverage"
    # asymptotic regime, own arithmetic
    assert D0 > Fraction(485165196)  # e^20 = 485165195.409...
    lD0 = log_lo(D0)
    g_D0 = 1 + K + (K + log_hi(log_hi(D0))) / lD0 + 2 * T0 * T0 / (D0 * lD0)
    print("verifier: K", float(K), "g(D0)", float(g_D0), "U", float(U))
    assert g_D0 <= U
    with Pool(4) as pool:
        vals = pool.map(check_box, [(b[0], b[1], b[2], b[3]) for b in bs], chunksize=8)
    Uv = max(max(vals), g_D0)
    worst = max(range(len(vals)), key=lambda i: vals[i])
    print(
        "verifier: boxes",
        len(bs),
        "max box bound",
        float(max(vals)),
        "at",
        bs[worst][:3],
    )
    print("verifier: U_v =", float(Uv), " certificate U =", float(U))
    ok = Uv <= U + Fraction(1, 10**9) and Uv > Fraction("2.1562")
    print("VERIFIED" if ok else "FAILED")
    sys.exit(0 if ok else 1)
