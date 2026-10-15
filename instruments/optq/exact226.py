#!/usr/bin/env python3
"""instruments/optq/exact226.py — the two one-line constructions of PR #226 (Patankar 2026) on teorth/optimizationproblems,
decided exactly in the standard library.

20a (thin-shell constant, lower bound 8): n = 1, X = E − 1 with E standard exponential. The registry's quantity is
Var(|X|²) for an isotropic log-concave X (mean 0, covariance I); the claim is Var(X²) = 8. Exact: E[E^k] = k! for
the standard exponential, so the moments of X = E − 1 are integer combinations; Var(X²) = E[(E−1)^4] − (E[(E−1)^2])².
Log-concavity of the exponential density e^{−t} on [0, ∞) and mean 0, variance 1 of E − 1 are checked from the same
moments (mean, variance) and stated for the density (log of e^{−t} is linear, hence concave; a cited fact of the
definition). Products of independent copies give Var(|X|²) = 8n in every n: the sum of independent variances.

20c (KLS constant for log-concave probability measures, lower bound √3): n = 1, μ uniform on [−√3, √3] (variance
(2√3)²/12 = 1, so isotropic; a uniform density is log-concave), A = (−∞, 0]: μ(A) = 1/2, μ⁺(A) = the density at the
boundary point 0 = 1/(2√3), so the Cheeger ratio μ⁺(A)/min(μ(A), 1 − μ(A)) = 1/√3 and ψ_μ ≥ √3 under the registry's
convention that the constant is the reciprocal of the Cheeger constant. Exact in Q(√3): computed with the square of
the ratio, (1/√3)² = 1/3, so the claim ψ ≥ √3 is ψ² ≥ 3, an exact rational statement.

usage: python3 -I instruments/optq/exact226.py
"""
import json, math
from fractions import Fraction as F


def exp_moment(k):  # E[E^k] for E ~ Exp(1)
    return F(math.factorial(k))


def central_moments_of_E_minus_1():
    # E[(E-1)^k] = Σ_j C(k,j) E[E^j] (−1)^{k−j}
    m = {}
    for k in range(1, 5):
        m[k] = sum(F(math.comb(k, j)) * exp_moment(j) * (-1) ** (k - j) for j in range(0, k + 1))
    return m


def decide_20a():
    m = central_moments_of_E_minus_1()
    mean, var = m[1], m[2] - m[1] ** 2
    var_x2 = m[4] - m[2] ** 2
    ok = mean == 0 and var == 1 and var_x2 == 8
    return {'claim': 'Var(X^2) = 8 for X = E - 1, E standard exponential; hence C_20a >= 8', 'mean': str(mean), 'variance': str(var), 'E[(E-1)^4]': str(m[4]), 'Var(X^2)': str(var_x2),
            'logConcave': 'the density e^{-t} 1_{t>=0}: log-linear on its support, hence log-concave (by definition)', 'verdict': 'CERTIFIED' if ok else 'REFUTED'}


def decide_20c():
    # uniform on [-s, s] with s^2 = 3: variance s^2/3 = 1; density 1/(2s); mu(A) = 1/2; mu+(A) = 1/(2s)
    s2 = F(3)
    variance = s2 / 3
    muA = F(1, 2)
    # the Cheeger ratio squared: (1/(2s))^2 / min(muA, 1-muA)^2 = (1/(4 s^2)) / (1/4) = 1/s^2 = 1/3
    ratio2 = (F(1, 4) / s2) / (muA ** 2)
    psi2 = 1 / ratio2          # the KLS constant as the reciprocal of the Cheeger ratio: psi^2 = 3
    ok = variance == 1 and psi2 == 3
    return {'claim': 'psi_mu >= sqrt(3) for mu uniform on [-sqrt3, sqrt3] and A = (-inf, 0]; hence C_20c >= sqrt(3)', 'variance': str(variance), 'mu(A)': str(muA), 'cheegerRatioSquared': str(ratio2), 'psiSquared': str(psi2),
            'logConcave': 'a uniform density on an interval is log-concave (constant on its support)', 'verdict': 'CERTIFIED' if ok else 'REFUTED'}


if __name__ == '__main__':
    print(json.dumps({'20a': decide_20a(), '20c': decide_20c()}))
