"""Reverse Brunn-Minkowski constant (Tao's table, entry 70a): C >= 1.2015, from a cube and a ball.

Claim. For every n, a > 0, r > 0:
    C_RBM >= ( sum_{j=0}^n binom(n, j) a^j kappa_{n-j} r^{n-j} )^{1/n} / (a + kappa_n^{1/n} r),
where kappa_m is the volume of the unit m-ball. Take B1 = [0, a]^n and B2 = r B (the ball).

Proof. Let u have |det u| = 1. P = u(B1) is a parallelotope spanned by v_1..v_n with |P| = a^n.
(1) Steiner: |P + rB| = sum_j V_j(P) kappa_{n-j} r^{n-j}, with V_j the intrinsic volumes.
(2) For a parallelotope, V_j(P) = sum over |S| = j of vol_j(parallelotope spanned by v_i, i in S).
(3) With G the Gram matrix of the v_i, vol_j(face_S)^2 = det G_S and |P|^2 = det G. Szasz's inequality
    gives prod_{|S|=j} det G_S >= (det G)^{binom(n-1, j-1)}, so prod_S vol_j(face_S) >= a^{n binom(n-1, j-1)}.
(4) AM-GM: V_j(P) >= binom(n, j) (prod_S vol_j)^{1/binom(n, j)} >= binom(n, j) a^j, since
    binom(n-1, j-1) / binom(n, j) = j / n.
So |u(B1) + B2| >= sum_j binom(n, j) a^j kappa_{n-j} r^{n-j} = |B1 + B2| for every u: the cube is already
in the worst position. Dividing by |B1|^{1/n} + |B2|^{1/n} = a + kappa_n^{1/n} r gives the claim. For
n = 2 this is the square-and-disk bound sqrt(1/2 + 1/sqrt(pi)) ~ 1.0316.

The script evaluates the right-hand side in interval arithmetic (binomials and ball volumes by exact
recursions, kappa_m = kappa_{m-2} 2 pi / m), so the printed lower end is rigorous.

    python3 tao/certificates/rbm_cube.py --n 10000 --t 0.0709
"""
import argparse
from fractions import Fraction

from mpmath import iv, mp


def bound(n, t, dps=60):
    iv.dps = dps
    t = iv.mpf(t.numerator) / t.denominator          # t = a / r, and r = 1
    two_pi = 2 * iv.pi
    kappa = [iv.mpf(1), iv.mpf(2)]
    for m in range(2, n + 1):
        kappa.append(kappa[m - 2] * two_pi / m)
    total, binom, tp = iv.mpf(0), iv.mpf(1), iv.mpf(1)   # binom(n, j), t^j
    for j in range(n + 1):
        total += binom * tp * kappa[n - j]
        binom = binom * (n - j) / (j + 1)
        tp = tp * t
    return total ** (iv.mpf(1) / n) / (t + kappa[n] ** (iv.mpf(1) / n))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=10000)
    ap.add_argument("--t", default="0.0709")
    a = ap.parse_args()
    b = bound(a.n, Fraction(a.t))
    mp.dps = 20
    print(f"70a: n = {a.n}, a/r = {a.t}: C_RBM >= {mp.nstr(mp.mpf(b.a.a), 12)} (interval width {mp.nstr(mp.mpf(b.b.b) - mp.mpf(b.a.a), 2)}); table: 1")
