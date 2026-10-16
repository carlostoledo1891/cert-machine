#!/usr/bin/env python3
"""instruments/optq/rbm70a.py — the 70a bound of PR #226 (Patankar 2026) on teorth/optimizationproblems, decided in the
standard library with no code of the claimant's.

The registry (constants/70a.md): C_70 is the infimum of C such that for every n and every pair of centrally symmetric
convex bodies B_1, B_2 ⊂ R^n some linear u with |det u| = 1 has |u(B_1) + B_2|^{1/n} ≤ C(|B_1|^{1/n} + |B_2|^{1/n}). A LOWER
bound is a pair for which the inequality fails for EVERY such u below some c. The PR's pair: B_1 the cube of side a
(centred), B_2 = rB the ball. The chain, read here and held:
  (1) Steiner: |P + rB| = Σ_j V_j(P) κ_{n−j} r^{n−j} for a convex body P (V_j the intrinsic volumes, κ_m the unit m-ball);
  (2) P = u(B_1) is a parallelotope spanned by v_1..v_n with |P| = aⁿ (|det u| = 1); a parallelotope is the zonotope of
      its edge segments, and for a zonotope V_j = Σ_{|S| = j} vol_j(parallelotope spanned by v_i, i ∈ S) (Shephard);
  (3) vol_j(face_S)² = det G_S for the Gram matrix G of the v_i, |P|² = det G; Szász's inequality for positive definite
      matrices, Π_{|S| = j} det G_S ≥ (det G)^{C(n−1, j−1)}, gives Π_S vol_j(face_S) ≥ a^{n C(n−1, j−1)};
  (4) AM–GM over the C(n, j) faces: V_j(P) ≥ C(n, j) (Π_S vol_j)^{1/C(n, j)} ≥ C(n, j) a^{j}, as C(n−1, j−1)/C(n, j) = j/n.
So |u(B_1) + rB| ≥ Σ_j C(n, j) a^j κ_{n−j} r^{n−j} = |B_1 + rB| for every admissible u, and with |B_1|^{1/n} = a,
|B_2|^{1/n} = κ_n^{1/n} r,

        C_70 ≥ ( Σ_{j=0}^{n} C(n, j) a^j κ_{n−j} r^{n−j} )^{1/n} / (a + κ_n^{1/n} r)     for every n, a, r.

The number is computed here for n = 300,000 and a/r = 13/1000 (r = 1) in directed-rounding decimal arithmetic: κ_m by the
exact recursion κ_m = κ_{m−2}·2π/m from κ_0 = 1, κ_1 = 2, the binomials by C(n, j+1) = C(n, j)(n−j)/(j+1), tʲ by
multiplication, every operation rounded outward on each side; π from Machin in integers; the n-th roots through the
module's correctly rounded ln and exp (±1 ulp). n = 2 has the closed form √(t² + 4t + π)/(t + √π), used as a calibration.

usage: python3 -I instruments/optq/rbm70a.py [n] [t_num/t_den] [claimed]       (default 300000 13/1000 1.201927; ~10 s)
"""
import json, sys, time
from decimal import Decimal
from fractions import Fraction as F
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from ivdec import contexts, pi_iv, ln_iv, exp_iv, sqrt_iv, verdict


def nth_root_iv(x_lo, x_hi, n, down, up, even):
    l_lo, l_hi = ln_iv(x_lo, x_hi, even)
    return exp_iv(down.divide(l_lo, n), up.divide(l_hi, n), even)


def bound(n, t, prec=50):
    down, up, even = contexts(prec)
    pi_lo, pi_hi = pi_iv(prec)
    tl, th = down.divide(Decimal(t.numerator), Decimal(t.denominator)), up.divide(Decimal(t.numerator), Decimal(t.denominator))
    twopi_lo, twopi_hi = down.multiply(2, pi_lo), up.multiply(2, pi_hi)
    klo, khi = [Decimal(1), Decimal(2)], [Decimal(1), Decimal(2)]
    for m in range(2, n + 1):
        klo.append(down.divide(down.multiply(klo[m - 2], twopi_lo), m))
        khi.append(up.divide(up.multiply(khi[m - 2], twopi_hi), m))
    tot_lo = tot_hi = Decimal(0); b_lo = b_hi = Decimal(1); tp_lo = tp_hi = Decimal(1)
    for j in range(n + 1):
        tot_lo = down.add(tot_lo, down.multiply(down.multiply(b_lo, tp_lo), klo[n - j]))
        tot_hi = up.add(tot_hi, up.multiply(up.multiply(b_hi, tp_hi), khi[n - j]))
        b_lo = down.divide(down.multiply(b_lo, n - j), j + 1); b_hi = up.divide(up.multiply(b_hi, n - j), j + 1)
        tp_lo = down.multiply(tp_lo, tl); tp_hi = up.multiply(tp_hi, th)
    num_lo, num_hi = nth_root_iv(tot_lo, tot_hi, n, down, up, even)
    kr_lo, kr_hi = nth_root_iv(klo[n], khi[n], n, down, up, even)
    den_lo, den_hi = down.add(tl, kr_lo), up.add(th, kr_hi)
    return down.divide(num_lo, den_hi), up.divide(num_hi, den_lo), (tot_lo, tot_hi), (klo[n], khi[n])


def closed_form_n2(t, prec=50):
    """√(t² + 4t + π)/(t + √π) — the square-and-disk case by hand (κ_0 = 1, κ_1 = 2, κ_2 = π)."""
    down, up, even = contexts(prec)
    pi_lo, pi_hi = pi_iv(prec)
    tl, th = down.divide(Decimal(t.numerator), Decimal(t.denominator)), up.divide(Decimal(t.numerator), Decimal(t.denominator))
    in_lo = down.add(down.add(down.multiply(tl, tl), down.multiply(4, tl)), pi_lo)
    in_hi = up.add(up.add(up.multiply(th, th), up.multiply(4, th)), pi_hi)
    n_lo, n_hi = sqrt_iv(in_lo, in_hi, even)
    sp_lo, sp_hi = sqrt_iv(pi_lo, pi_hi, even)
    return down.divide(n_lo, up.add(th, sp_hi)), up.divide(n_hi, down.add(tl, sp_lo))


def decide(n=300000, t=F(13, 1000), claimed='1.201927', prec=50):
    t0 = time.time()
    lo, hi, tot, kn = bound(n, t, prec)
    v = verdict(lo, hi, Decimal(claimed))
    q = Decimal(1).scaleb(-24)  # printed outward: the low end down, the high end up
    return {'constant': 'C_70a (reverse Brunn–Minkowski)', 'claim': 'C_70a >= ' + claimed, 'verdict': v, 'n': n, 'a/r': str(t), 'decimalPrecision': prec,
            'enclosure': [str(lo.quantize(q, rounding='ROUND_FLOOR')), str(hi.quantize(q, rounding='ROUND_CEILING'))], 'width': str((hi - lo).normalize()), 'log10 of the Steiner sum': [str(tot[0].adjusted()), str(tot[1].adjusted())], 'log10 of kappa_n': [str(kn[0].adjusted()), str(kn[1].adjusted())],
            'seconds': round(time.time() - t0, 1),
            'read': 'Steiner; V_j of a zonotope as the sum of its j-face parallelotope volumes; Szász on the Gram matrix; AM–GM — each applied as stated, so the cube is in its worst position for every |det u| = 1'}


if __name__ == '__main__':
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 300000
    t = F(sys.argv[2]) if len(sys.argv) > 2 else F(13, 1000)
    claimed = sys.argv[3] if len(sys.argv) > 3 else '1.201927'
    print(json.dumps(decide(n, t, claimed)))
