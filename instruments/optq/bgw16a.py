#!/usr/bin/env python3
"""instruments/optq/bgw16a.py — the 16a bound of PR #226 (Patankar 2026) on teorth/optimizationproblems, decided in the
standard library with no code of the claimant's.

The registry (constants/16a.md): L = max_{δ ≥ 1} [4πΘ(δ) − ln δ − ln(1 + ln δ)], Θ(δ) = sup{ |u(0)|² : u zero-mean on
T², ‖∇u‖² = 1, ‖Δu‖² = δ }. Its numerical row 2.15627 is BDZ2013's, whose torus is 2π × 2π (BDZ2013 eq. (2.4), (3.14)),
so T² = [0, 2π]² with Lebesgue measure. For the real zero-mean trigonometric polynomial u(x) = Σ_{0 < |k|² ≤ K²} c_k e^{ik·x}
with c_k = 1/(|k|²(|k|² + μ)) (c_k = c_{−k}, so u is real and u(0) = Σ c_k =: S_0): Parseval on [0, 2π]² gives
‖∇u‖² = (2π)² S_1, ‖Δu‖² = (2π)² S_2 with S_1 = Σ |k|² c_k², S_2 = Σ |k|⁴ c_k². Normalising ũ = u/‖∇u‖: ũ(0)² = S_0²/(4π² S_1)
and δ(ũ) = S_2/S_1, so Θ(δ) ≥ S_0²/(4π² S_1) and, provided δ ≥ 1,

        L ≥ S_0²/(π S_1) − ln δ − ln(1 + ln δ),     δ = S_2/S_1.

Everything is finite (a trigonometric polynomial), so there is no tail: the three sums are rationals, enclosed here as
fixed-point integers (floor and ceiling of every term at scale 2^200, grouped by n = |k|² with the lattice count r₂(n)
from a sieve over the octant), π from Machin's formula in integers, the logarithms from the decimal module's correctly
rounded ln (±1 ulp). The claim is a LOWER bound, so the verdict reads the lower end of the enclosure of the right-hand side.

usage: python3 -I instruments/optq/bgw16a.py [K] [mu_num/mu_den] [claimed]      (default 4000 41/5 2.156224; ~25 s)
"""
import json, math, sys, time
from array import array
from decimal import Decimal
from fractions import Fraction as F
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from ivdec import contexts, pi_iv, ln_iv, frac_iv, verdict

SCALE_BITS = 200


def r2_table(K):
    """r[n] = #{k ∈ Z² : |k|² = n} for 0 < n ≤ K², from the octant 0 ≤ a ≤ b with a² + b² ≤ K²."""
    K2 = K * K; r = array('I', bytes(4 * (K2 + 1)))
    for a in range(0, K + 1):
        a2 = a * a; bmax = math.isqrt(K2 - a2)
        for b in range(a, bmax + 1):
            n = a2 + b * b
            if n == 0: continue
            r[n] += 4 if (a == 0 or a == b) else 8
    return r


def sums(K, mu):
    """exact rational enclosures [lo, hi] of S_0, S_1, S_2 for c_k = 1/(n(n + mu)), n = |k|², mu = p/q."""
    p, q = mu.numerator, mu.denominator            # c_n = q/(n(qn + p)); c_n² = q²/(n²(qn + p)²)
    P = 1 << SCALE_BITS
    r = r2_table(K)
    lo = [0, 0, 0]; hi = [0, 0, 0]; terms = 0; points = 0
    for n, rn in enumerate(r):
        if not rn: continue
        terms += 1; points += rn
        d = q * n + p
        nums = (rn * q * P, rn * q * q * P, rn * q * q * P)
        dens = (n * d, n * d * d, d * d)                     # S_0, S_1 (= r n c²), S_2 (= r n² c²)
        for i in range(3):
            lo[i] += nums[i] // dens[i]
            hi[i] += -((-nums[i]) // dens[i])
    return [(F(lo[i], P), F(hi[i], P)) for i in range(3)], terms, points


def decide(K=4000, mu=F(41, 5), claimed='2.156224', prec=60):
    t0 = time.time()
    down, up, even = contexts(prec)
    (S0, S1, S2), terms, points = sums(K, mu)
    s0 = frac_iv(S0[0].numerator, S0[0].denominator, down, up)[0], frac_iv(S0[1].numerator, S0[1].denominator, down, up)[1]
    s1 = frac_iv(S1[0].numerator, S1[0].denominator, down, up)[0], frac_iv(S1[1].numerator, S1[1].denominator, down, up)[1]
    s2 = frac_iv(S2[0].numerator, S2[0].denominator, down, up)[0], frac_iv(S2[1].numerator, S2[1].denominator, down, up)[1]
    pi_lo, pi_hi = pi_iv(prec)
    # A = S_0²/(π S_1): lo from (S_0 lo)² over (π hi · S_1 hi), hi the other way
    A_lo = down.divide(down.multiply(s0[0], s0[0]), up.multiply(pi_hi, s1[1]))
    A_hi = up.divide(up.multiply(s0[1], s0[1]), down.multiply(pi_lo, s1[0]))
    d_lo, d_hi = down.divide(s2[0], s1[1]), up.divide(s2[1], s1[0])
    # g(δ) = ln δ + ln(1 + ln δ) is increasing in δ (δ ≥ 1): g_hi at δ_hi, g_lo at δ_lo
    l_lo, l_hi = ln_iv(d_lo, d_hi, even)
    g_hi = up.add(l_hi, ln_iv(up.add(1, l_hi), up.add(1, l_hi), even)[1])
    g_lo = down.add(l_lo, ln_iv(down.add(1, l_lo), down.add(1, l_lo), even)[0])
    L_lo, L_hi = down.subtract(A_lo, g_hi), up.subtract(A_hi, g_lo)
    claimedD = Decimal(claimed)
    admissible = d_lo >= 1
    v = verdict(L_lo, L_hi, claimedD) if admissible else 'REFUSED'
    # the lattice count against Gauss's circle formula N(K) = 1 + 4K + 4 Σ_{i=1..K} ⌊√(K² − i²)⌋ (the origin excluded here)
    gauss = 4 * K + 4 * sum(math.isqrt(K * K - i * i) for i in range(1, K + 1))
    if points != gauss: raise SystemExit('bgw16a: the sieve counted %d lattice points, Gauss\'s formula gives %d' % (points, gauss))
    q = Decimal(1).scaleb(-24)
    pr = lambda lo, hi: [str(lo.quantize(q, rounding='ROUND_FLOOR')), str(hi.quantize(q, rounding='ROUND_CEILING'))]  # printed outward
    return {'constant': 'C_16a (Brezis–Gallouët–Wainger remainder on the 2π-torus)', 'claim': 'C_16a >= ' + claimed, 'verdict': v,
            'K': K, 'mu': str(mu), 'latticePoints': points, 'latticePointsByGauss': gauss, 'distinctNorms': terms, 'scaleBits': SCALE_BITS, 'decimalPrecision': prec,
            'S0': pr(*s0), 'S1': pr(*s1), 'S2': pr(*s2),
            'delta': pr(d_lo, d_hi), 'deltaAtLeast1': admissible, 'A=S0^2/(pi S1)': pr(A_lo, A_hi),
            'enclosure': pr(L_lo, L_hi), 'width': str((L_hi - L_lo).normalize()), 'seconds': round(time.time() - t0, 1),
            'torus': '[0, 2π]² (BDZ2013 (2.4), (3.14); the registry\'s 2.15627 row is BDZ\'s)', 'tail': 'none: u is a trigonometric polynomial, every sum finite'}


if __name__ == '__main__':
    K = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
    mu = F(sys.argv[2]) if len(sys.argv) > 2 else F(41, 5)
    claimed = sys.argv[3] if len(sys.argv) > 3 else '2.156224'
    print(json.dumps(decide(K, mu, claimed)))
