"""A rigorous lower bound for the Brezis-Gallouet-Wainger constant L (Tao's table, entry 16a).

On the torus [0, 2 pi]^2 take the real, zero-mean trigonometric polynomial
    u(x) = sum_{0 < |k|^2 <= K^2} c_k e^{i k.x},   c_k = 1 / (|k|^2 (|k|^2 + mu)),
the truncated conditional extremal of Bartuccelli-Deane-Zelik (2013). Then
    ||grad u||^2 = (2 pi)^2 S1,  ||Lap u||^2 = (2 pi)^2 S2,  u(0) = S0,  delta = S2 / S1,
with S0 = sum c_k, S1 = sum |k|^2 c_k^2, S2 = sum |k|^4 c_k^2, and since ||u||_inf >= |u(0)|,
    L >= 4 pi u(0)^2 / ||grad u||^2 - ln delta - ln(1 + ln delta) = S0^2 / (pi S1) - ln delta - ln(1 + ln delta),
valid because delta >= 1. All sums run over n = |k|^2 with multiplicity r2(n) and are evaluated in
interval arithmetic (mpmath.iv), so the printed lower end is a rigorous bound.

    python3 tao/certificates/bgw.py --K 800 --mu 41/5
"""
import argparse
from fractions import Fraction

from mpmath import iv, mp


def r2_counts(K):
    counts = {}
    for a in range(-K, K + 1):
        for b in range(-K, K + 1):
            n = a * a + b * b
            if 0 < n <= K * K:
                counts[n] = counts.get(n, 0) + 1
    return counts


def certify(K, mu, dps=40):
    iv.dps = dps
    mu_i = iv.mpf(mu.numerator) / mu.denominator
    S0 = S1 = S2 = iv.mpf(0)
    for n, r in sorted(r2_counts(K).items()):
        c = 1 / (iv.mpf(n) * (n + mu_i))
        S0 += r * c
        S1 += r * n * c * c
        S2 += r * n * n * c * c
    delta = S2 / S1
    value = S0 * S0 / (iv.pi * S1) - iv.log(delta) - iv.log(1 + iv.log(delta))
    return value, delta


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--K", type=int, default=800)
    ap.add_argument("--mu", default="41/5")
    a = ap.parse_args()
    v, d = certify(a.K, Fraction(a.mu))
    mp.dps = 20
    print(f"K = {a.K}, mu = {a.mu}: delta in [{mp.nstr(mp.mpf(d.a.a), 12)}, {mp.nstr(mp.mpf(d.b.b), 12)}] (>= 1)")
    print(f"L >= {mp.nstr(mp.mpf(v.a.a), 15)}   (interval width {mp.nstr(mp.mpf(v.b.b) - mp.mpf(v.a.a), 3)}); table's lower bound: 1.82283")
