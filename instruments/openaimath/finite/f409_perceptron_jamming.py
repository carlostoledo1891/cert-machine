"""F-409 — "Microscopic jamming in the negative spherical perceptron" (openai/math family 222).

THE CLAIM (build/main.tex:57-62, abstract; :236-251, Theorem thm:main): the contact-removed gap law and the force law
satisfy G_J(u) = u^(1-gamma+o(1)), F_J(s) = s^(1+theta+o(1)) with gamma = (2+theta)^-1,
0.4126930 < gamma < 0.4126934 and 0.4231063 < theta < 0.4231088, and "A finite numerical certificate for these exponent
intervals, together with its mathematical error bounds, is included." The exponents are gamma = 1 - 2a_*,
theta = 2a_*/(1-2a_*) - 1 (:313-317), where a_* is the root of lambda(a) = a in 0.2936533 < a_* < 0.2936535 (:308-311),
lambda(a) the lowest eigenvalue of H_a = -(1/2) d^2/dz^2 + (1/2)(B_a^2 + B_a'), B_a = z/2 + a M_a, and M_a the
stationary profile M'' + 2(qz + aM)M' - 2pM = 0, q = 1/2, p = q - a (cert:M-ode, :8940-8943). The finite certificate
(Section sec:certificate, :8871-9669) has two stages: (I) integer polynomial certificates — the profile M_a on cells
of width 1/100 over [-24, 24] (residual < 1e-23, :8928-8977), the Riccati shooting for the eigenvalue from x = 20
inward (:9135-9206), giving (:9499-9509) .2936535023 < lambda(.2936533) < .2936535043 and
.2936533037 < lambda(.2936535) < .2936533057, hence lambda(.2936533) > .2936533, lambda(.2936535) < .2936535 and a root
in (.2936533, .2936535); (II) binary64 interval stages (checkA, checkV, Env.checkH, Env.coarse, nonlineartest,
localcheck; :8898-8925, :9208-9463) that narrow every admissible coefficient to [0.285, 0.303] and prove a strict
contraction (local number .9196... < .95), so that the selected coefficient IS that root and the root is unique.

WHAT IS DECIDED HERE — stage (I), clean-room, in exact integer/rational arithmetic (no float in any decision):
  1. THE PROFILE. For a = .2936533 and a = .2936535 an own trial M~ (degree-18 polynomial per cell of width 1/100 in
     the cell coordinate s, integer coefficients over D = 2^120 — not the paper's 10^36 — built by an own rounded
     Taylor recurrence from M(0), M'(0) found by an own Newton shooting) is certified exactly: on all 4,800 cells the
     ODE residual, an exact integer polynomial in s, has sum of |coefficients| < 1e-23 (a bound on [0,1]); joins are
     exactly C^1 (values and s-derivatives carried as exact integer sums; opposite first coefficients at z = 0);
     |M~(24)| < 1e-23 and |M~(-24) - 24| < 1e-23; -1.01 <= M~' <= .01 on every cell; and M~(0) lies inside the
     printed value barriers phi(0) <= M(0) <= phi(0)/Phi(0).
  2. THE LEMMA CONSTANTS (Lemma cert:M-error, :8978-9023; Lemma cert:tail-enclosure, :9052-9133; the shooting bounds,
     :9135-9206) as rational inequalities, with rigorous rational enclosures of e^x (Taylor + geometric remainder) and
     pi (Machin, alternating bounds): .18 - .0082 > .17; .34^2/.09 < 1.29; .41 * .8 <= .34; .05 + .41 * .8 < .38;
     2 phi(0) < .8; |F(0)| <= (2e-22 + .1^2 e^1.29 2.1e-22/2)/(.1 e^-.076) < 2.4e-21; e^1.29 (2.4e-21 + 24 * 2.1e-22)
     < 4e-20; the source 1e-23 + (1 + .0082)1e-22 < 2.1e-22; the sided tail constants |d| < 1.4, |e| < 24, K < 3066
     over the stated c ranges; the identity R(T) = ((2c-5)e + d^2)/x^6 + 2de/x^8 + e^2/x^10 (as exact Laurent
     polynomials at every tested lambda); x^6|R(T)| <= 6.62|e| + d^2 + 1 and the barrier remainder <= .7 p K at
     x >= 12; the room identity 1.3pK - (6.62|e| + d^2 + 9) = 6.38|e| + 2.9d^2 + 30 > 0; the exponential-coefficient
     cost < 8 at p = .09, x = 12 (and x^6 e^(-px^2) decreasing there); |T| + K/x^7 < .071 at x = 12; the
     derivative-bound sum < .00514; the initial error at 20 < 2.41e-6; and the propagated bounds e^2[2.41e-6 +
     20(2e-9 + 3e-19)] < 2.9e-5, 2.41e-6 e^-6 + 20 e^2 (2e-9 + 3e-19) < 4.5e-7, 2.41e-6 e^-20 + 20 e^2 3e-19 < 1e-10.
     Each instance is ALSO evaluated at the actual parameters with the actual trial bounds.
  3. THE SHOOTING. For each a, three own Riccati trials per side S~ (degree 18 per inward cell, D = 2^120, the
     paper's printed seeds: lambda_mid = seed/1e10 and lambda_mid -+ 1e-9) from x = 20 (S~(20) = T(20) rounded) to 0,
     on top of the certified M~ — each certified exactly: residual sum of |coefficients| < 1e-20 on every cell; per-cell
     rational lower bounds of the drift 2 beta~ - 2 S~ - .002 whose negative parts sum to more than -2 (every inward
     integrating factor <= e^2), whose total exceeds 20 (factor 20 -> 0 below e^-20) and whose part on x >= 12.02
     exceeds 8 (factor below e^-6 there); the source bound 2a 1e-22 max|S~| + 2a 4e-20 + residual (< 3e-19); the
     bootstrap |E_S| < .001 closed for the middle trial over the whole window (source + 2e-9, tail value varied over
     the window) and for each endpoint trial; the error at x = 0 of each endpoint trial < 1e-10. Then the printed
     integer tests: the trial match S~_+(0) + S~_-(0) is < -1e-9 at the lower and > 1e-9 at the upper value, with
     total error < 2e-10, so the exact match changes sign inside each printed window.
  4. THE CONSEQUENCES, exact: the windows (seed -+ 10)/1e10 are the printed decimals; lambda(.2936533) > .2936533 and
     lambda(.2936535) < .2936535; gamma = 1 - 2a and theta = 2a/(1-2a) - 1 over (.2936533, .2936535) give exactly the
     printed gamma and theta bounds (abstract, theorem, :8861-8866), gamma = 1/(2+theta), and the two tail
     coefficients c_tail,+- of :7847-7851; the 16 printed digits of the theta endpoints (:8865) as roundings.
  5. PUBLISHED DATA, read after the clean-room trials had been built and run: the appendix listing hashes to the printed
     source sha256 (:9496-9497), and its table db's starting data for the final two tests (M(0), M'(0), seed) agree
     with our independently shot ones to < 1e-28 (observed: ~1e-30) and with the text's seeds.

RESULT (2026-10-10, this machine, ~30 s): every decided check passes. Our trials: profile residual <= 2.72e-30 (needed
1e-23), |M~(24)| = 2.4e-33, |M~(-24) - 24| = 1.3e-32 (a = .2936533); Riccati residual <= 4.7e-33 (needed 1e-20); error at
x = 0 <= 4.9e-16 per side (needed 1e-10); trial match at lo / seed / hi = -1.011e-8 / -4.75e-10 / +9.16e-9 (a = .2936533)
and -9.83e-9 / -1.98e-10 / +9.44e-9 (a = .2936535), slope ~9.64 per unit lambda — the paper's +-1e-9 tests hold with
margin ~9e-9; secant estimates lambda(.2936533) ~ .29365350335, lambda(.2936535) ~ .29365330472. All three forges
come back REFUTED.
DISCREPANCY (display, not a refutation): :8865 prints "0.4231087030795289\ldots" for the theta upper endpoint; the exact
endpoint 174614/412693 = 0.42310870307952885074... ends ...5288 when truncated to 16 digits — the printed string is the
16-digit rounding (the binary64 repr). The stated bounds 0.4231063 < theta < 0.4231088 hold exactly.

WHAT IS NOT DECIDED — hence the verdict REFUSED, not CERTIFIED:
  (a) STAGE (II), the six interval routines (checkA, checkV, Env.checkH, Env.coarse, nonlineartest, localcheck), which
      carry the 24 signed interval updates [0, .410] -> [0.285, 0.303] (:8476-8495) and the strict contraction at the
      root (:8504-8604) — i.e. that the selected coefficient equals the root and the root is unique. Their functionals
      (the Env envelopes, the 'adjusted' caps .1431 and .1301, geometric interpolation inside nonlinearfunctional, the
      grids, the arrays lm/lx/lz/shifts/cv/cp/den) are specified in the prose by reference to the program in Appendix
      app:code — the checking code, which a clean-room decider may not use — and a rebuild in exact arithmetic is beyond
      the run budget. Measured here (value['refused_cost']): one exact node evaluation ~0.8-1.0e-4 s; the paper's
      tabulation is 1.16e6 nodes per reference profile (50 samples per step for M, X, k, l and Q), i.e. ~95-115 s per
      reference, and stage (II) uses 47 reference profiles (the db table, counted after this decider ran) — ~1.2-1.5 h
      of one core for the exact tables alone, before any of the 151,552-cell integrals, inverse lookups or the 24 + 1
      sign tests; the paper's own binary64 NumPy run of everything took 338.52 s.
  (b) FILES (a fact): :9466-9476 cite "certificate/original_certificate.py" and "the accompanying reproducibility record"
      (software versions, source hashes, saved output of the October 4 run). The preprint directory holds only the PDF,
      README.md and build/main.tex. The program is nevertheless published: the appendix listing hashes exactly to the
      printed sha256. The reproducibility record (the saved output of the 338.52 s run) is not in the release.
  (c) ALL THEORY: existence/uniqueness/monotonicity of M_a and its Gaussian tails (eq:src40), the maximum principle and
      the comparison arguments behind the three lemmas (only their numeric steps are checked), the identification of
      lambda(a) as the lowest eigenvalue via a positive square-integrable match, the continuity of lambda(a), the
      contraction, and everything in Sections 2-8 that turns a_* into the exponents of the gap and force laws.
A component check of stage (I) is not a proof of the headline.

THE AUTHORS' CHECKER (Appendix app:code, read after this decider ran; never executed). Its stage-(I) routine certified(A)
asserts, in exact integers at D = 10^36: the profile residual (mstep, floor-rounded recurrence, full residual), the
boundary values at +-24, -1.01 <= M~' <= .01 (kp, rad), the Riccati residual (qint), |S~| < .95, the drift sums
(gs[1203:] > 8, negative part > -2, total > 20) and the signs of the match at lam -+ 10 — the same finite facts as here.
It does NOT compute the analytic constants of the three lemmas (K < 3066, 2.41e-6, the e^2 / e^-6 / e^-20 propagation, the
M-error lemma's numbers): those exist only in the prose, and are checked here. Stage (II) is binary64 NumPy interval
arithmetic with 2^-43 relative padding, whose rigor rests on the IEEE rounding argument of :9208-9291, not on exact
arithmetic. A grep for the printed seeds during the clean-room phase displayed the two db lines (:9816-9817) before the
listing was read; by then our Newton shooting had already converged to the same values (to ~1e-30), independently.
"""
import json
import os
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import CLONE, Sources, check  # noqa: E402

DIR = 'preprints/Microscopic-jamming-in-the-negative-spherical-perceptron-September-24-2026'
MAIN = DIR + '/build/main.tex'
F = Fraction
DEG = 18            # polynomial degree per cell (the paper's degree)
D = 2 ** 120        # own coefficient scale (the paper uses 10^36)
NZ = 2400           # profile cells per side: |z| <= 24, width 1/100
NX = 2000           # Riccati cells per side: 0 <= x <= 20
AD = 10 ** 7        # parameter denominator of the final tests
LD = 10 ** 10       # eigenvalue denominator of the seeds
Q_HALF = F(1, 2)
BINOM = [[1]]
for _n in range(1, DEG + 1):
    BINOM.append([1] + [BINOM[-1][k - 1] + BINOM[-1][k] for k in range(1, _n)] + [1])


# ------------------------------------------------------------------ rigorous constants
def exp_enclosure(x, terms=90):
    """(lo, hi) with lo <= e^x <= hi, x rational, |x| < 60: Taylor partial sum (a lower bound for x >= 0) plus the
    geometric remainder bound x^N/N! / (1 - x/(N+1)); negative x by reciprocals"""
    x = F(x)
    if x < 0:
        lo, hi = exp_enclosure(-x, terms)
        return 1 / hi, 1 / lo
    assert terms + 1 > 2 * x
    s, t = F(0), F(1)
    for n in range(terms):
        s += t
        t = t * x / (n + 1)
    return s, s + t / (1 - x / (terms + 1))


def pi_enclosure():
    """Machin: pi = 16 atan(1/5) - 4 atan(1/239); alternating series, |remainder| <= first omitted term"""
    def atan(y, n=40):
        s = sum(F((-1) ** k) * y ** (2 * k + 1) / (2 * k + 1) for k in range(n))
        r = y ** (2 * n + 1) / (2 * n + 1)
        return s - r, s + r
    a_lo, a_hi = atan(F(1, 5))
    b_lo, b_hi = atan(F(1, 239))
    return 16 * a_lo - 4 * b_hi, 16 * a_hi - 4 * b_lo


def sqrt_enclosure(x, digits=30):
    """(lo, hi) rational bounds of sqrt(x), x > 0 rational"""
    from math import isqrt
    S = 10 ** digits
    r = isqrt(x.numerator * S * S // x.denominator)
    lo, hi = F(r, S), F(r + 1, S)
    assert lo * lo <= x <= hi * hi
    return lo, hi


# ------------------------------------------------------------------ stage I: the profile
def m_cell(c0, c1, j, eps, A):
    """rounded Taylor recurrence for M'' + 2(qz + aM)M' - 2pM = 0 in the cell coordinate s, z = eps (j + s)/100;
    integer coefficients over D; the exact equation for the s^n coefficient of the residual R_int (see residual_m)"""
    c = [0] * (DEG + 1)
    c[0], c[1] = c0, c1
    p2 = AD - 2 * A
    for n in range(DEG - 1):
        S = 0
        for i in range(n + 1):
            S += c[i] * (n - i + 1) * c[n - i + 1]
        N = D * (AD * (j * (n + 1) * c[n + 1] + n * c[n]) - p2 * c[n]) + 200 * A * eps * S
        Qd = D * AD * 10 ** 4 * (n + 2) * (n + 1)
        c[n + 2] = -((2 * N + Qd) // (2 * Qd))
    return c


def run_side(c0, c1, eps, A, keep=False, ncell=NZ):
    cells = []
    for j in range(ncell):
        c = m_cell(c0, c1, j, eps, A)
        if keep:
            cells.append(c)
        c0 = sum(c)
        c1 = sum(n * c[n] for n in range(1, DEG + 1))
    return c0, cells


def shoot(u, A):
    vp, _ = run_side(u[0], u[1], 1, A)
    vm, _ = run_side(u[0], -u[1], -1, A)
    return vp, vm - 24 * D


def solve_profile(A, start=(D // 2, -(D // 200)), tol=D // 10 ** 31, itmax=20):
    """own Newton shooting on (M(0) D, M'(0) D/100): a way to FIND a trial; nothing here is a decision"""
    u = list(start)
    dd = D // 10 ** 12
    for it in range(itmax):
        f = shoot(u, A)
        if abs(f[0]) < tol and abs(f[1]) < tol:
            return u, it
        f0 = shoot([u[0] + dd, u[1]], A)
        f1 = shoot([u[0], u[1] + dd], A)
        J = [[F(f0[0] - f[0], dd), F(f1[0] - f[0], dd)], [F(f0[1] - f[1], dd), F(f1[1] - f[1], dd)]]
        det = J[0][0] * J[1][1] - J[0][1] * J[1][0]
        u = [u[0] - round((J[1][1] * f[0] - J[0][1] * f[1]) / det), u[1] - round((-J[1][0] * f[0] + J[0][0] * f[1]) / det)]
    return u, itmax


def residual_m(c, j, eps, A):
    """sum of |coefficients| of R_int(s) = D AD 10^4 C_ss + D AD (j+s) C_s - D (AD - 2A) C + 200 A eps C C_s, an exact
    integer polynomial; the ODE residual of M~ = C/D is R_int / (D^2 AD) (h^2 10^4 = 1), so on 0 <= s <= 1 it is at most
    sum|r_n| / (D^2 AD)"""
    r = [0] * (2 * DEG + 1)
    cs = [(n + 1) * c[n + 1] for n in range(DEG)]
    p2 = AD - 2 * A
    for n in range(DEG - 1):
        r[n] += D * AD * 10 ** 4 * (n + 2) * (n + 1) * c[n + 2]
    for n in range(DEG):
        r[n] += D * AD * j * cs[n]
        r[n + 1] += D * AD * cs[n]
    for n in range(DEG + 1):
        r[n] -= D * p2 * c[n]
    k = 200 * A * eps
    for i in range(DEG + 1):
        if c[i]:
            ki = k * c[i]
            for m in range(DEG):
                r[i + m] += ki * cs[m]
    return sum(abs(x) for x in r)


PROFILES = {}


def profile(A):
    """the certified trial for a = A/AD (cached): cells per side and its exact certificate data"""
    if A in PROFILES:
        return PROFILES[A]
    t = time.time()
    u, its = solve_profile(A)
    t_solve = time.time() - t
    t = time.time()
    side = {}
    for eps in (1, -1):
        end, cells = run_side(u[0], eps * u[1], eps, A, keep=True)
        res = max(residual_m(c, j, eps, A) for j, c in enumerate(cells))
        dmin, dmax = None, None
        joins = True
        for j, c in enumerate(cells):
            # M~'(z) = eps 100 C_s / D: constant eps 100 c_1, the rest bounded by 100 sum_{n>=2} n |c_n|
            rad = sum(n * abs(c[n]) for n in range(2, DEG + 1))
            lo, hi = F(eps * 100 * c[1] - 100 * rad, D), F(eps * 100 * c[1] + 100 * rad, D)
            dmin = lo if dmin is None else min(dmin, lo)
            dmax = hi if dmax is None else max(dmax, hi)
            if j + 1 < len(cells):
                nxt = cells[j + 1]
                joins &= nxt[0] == sum(c) and nxt[1] == sum(n * c[n] for n in range(1, DEG + 1))
        side[eps] = dict(cells=cells, end=end, res=res, dmin=dmin, dmax=dmax, joins=joins)
    P = dict(A=A, u=u, newton_iterations=its, side=side, t_solve=round(t_solve, 1), t_cert=round(time.time() - t, 1))
    PROFILES[A] = P
    return P


# ------------------------------------------------------------------ stage I: the Riccati shooting
def reverse(c):
    """coefficients of C(1 - t)"""
    out = [0] * (DEG + 1)
    for n, cn in enumerate(c):
        if cn:
            for m in range(n + 1):
                out[m] += cn * BINOM[n][m] * (-1 if m & 1 else 1)
    return out


def tail_coeffs(lam, p_eps):
    c = lam / p_eps - 1
    d = c * (c - 1) / (2 * p_eps)
    e = (2 * c - 3) * d / (2 * p_eps)
    K = (10 * abs(e) + 3 * d * d + 30) / p_eps
    return c, d, e, K


def T_at(x, c, d, e):
    return c / x + d / x ** 3 + e / x ** 5


def riccati(prof, eps, L):
    """inward trial for S' = 2 beta S - S^2 + 2(q - a k - lambda) on side eps, lambda = L/LD, x = (j + 1 - t)/100,
    S~ = G/D; beta~ = x/2 + eps a M~(eps x), k~ = -M~'(eps x) from the certified profile. With K = 10^4 AD LD D:
      K G_t = -AD LD D (j+1-t) G - 200 eps A LD Cr G + 100 AD LD G^2 - 100 AD (LD - 2L) D^2 + 2 10^4 eps A LD D Cr_t,
    Cr(t) = C_j(1 - t). The residual of S~ in x is rho_int / (100 AD LD D^2)."""
    A = prof['A']
    cells = prof['side'][eps]['cells']
    lam = F(L, LD)
    p_eps = Q_HALF if eps == 1 else F(AD - 2 * A, 2 * AD)
    c, d, e, Kt = tail_coeffs(lam, p_eps)
    T20 = T_at(F(20), c, d, e)
    g0 = (2 * T20.numerator * D + T20.denominator) // (2 * T20.denominator)
    K = 10 ** 4 * AD * LD * D
    c4 = 100 * AD * (LD - 2 * L) * D * D
    k1 = AD * LD * D
    k2 = 200 * eps * A * LD
    k3 = 100 * AD * LD
    k5 = 2 * 10 ** 4 * eps * A * LD * D
    resmax = 0
    smax = F(0)
    drift = []                       # (j, lower bound of 2 beta~ - 2 S~ - .002 on the cell)
    g = None
    for j in range(NX - 1, -1, -1):
        cr = reverse(cells[j])
        crt = [(m + 1) * cr[m + 1] for m in range(DEG)] + [0]
        g = [0] * (DEG + 1)
        g[0] = g0
        for n in range(DEG):
            ccg = 0
            cgg = 0
            for i in range(n + 1):
                ccg += cr[i] * g[n - i]
                cgg += g[i] * g[n - i]
            rhs = -k1 * ((j + 1) * g[n] - (g[n - 1] if n else 0)) - k2 * ccg + k3 * cgg + k5 * crt[n]
            if n == 0:
                rhs -= c4
            Qd = K * (n + 1)
            g[n + 1] = (2 * rhs + Qd) // (2 * Qd)
        # exact residual polynomial
        rho = [0] * (2 * DEG + 2)
        for n in range(DEG):
            rho[n] += K * (n + 1) * g[n + 1]
        for n in range(DEG + 1):
            rho[n] += k1 * (j + 1) * g[n]
            rho[n + 1] -= k1 * g[n]
        rho[0] += c4
        for n in range(DEG):
            rho[n] -= k5 * crt[n]
        for i in range(DEG + 1):
            if cr[i] or g[i]:
                a_i, b_i = k2 * cr[i], k3 * g[i]
                for m in range(DEG + 1):
                    rho[i + m] += a_i * g[m] - b_i * g[m]
        resmax = max(resmax, sum(abs(x) for x in rho))
        smax = max(smax, F(sum(abs(x) for x in g), D))
        # drift: (2 beta~ - 2 S~) * 100 AD D = AD D (j+1-t) + 200 eps A Cr - 200 AD G
        P = [200 * eps * A * cr[n] - 200 * AD * g[n] for n in range(DEG + 1)]
        P[0] += AD * D * (j + 1)
        P[1] -= AD * D
        low = P[0] + sum(min(0, x) for x in P[1:])
        drift.append((j, F(low, 100 * AD * D) - F(2, 1000)))
        g0 = sum(g)
    return dict(eps=eps, L=L, S0=F(g0, D), T20=T20, g20_err=abs(F((2 * T20.numerator * D + T20.denominator) // (2 * T20.denominator), D) - T20),
                c=c, d=d, e=e, K=Kt, res=F(resmax, 100 * AD * LD * D * D), smax=smax, drift=drift)


def drift_facts(tr):
    h = F(1, 100)
    neg = sum(min(F(0), g) * h for _, g in tr['drift'])
    total = sum(g * h for _, g in tr['drift'])
    upper = sum(g * h for j, g in tr['drift'] if j >= 1202)       # cells with x >= 12.02
    return neg, total, upper


def dec(x, n=30):
    """exact truncated decimal string of a rational (never via float)"""
    sgn = '-' if x < 0 else ''
    x = abs(F(x))
    ip = x.numerator // x.denominator
    return '%s%d.%s' % (sgn, ip, str(((x - ip) * 10 ** n).__floor__()).zfill(n))


def appendix_listing(tex):
    a = tex.index('\\begin{lstlisting}\n') + len('\\begin{lstlisting}\n')
    return tex[a:tex.index('\\end{lstlisting}')]


def db_entries(code):
    """the published table of starting data (Appendix app:code, read as DATA after this decider first ran):
    {A: (M(0) 10^36, -M'(0) 10^36/100, seed)}"""
    import re
    return {int(k): tuple(int(v) for v in vals.split(',')) for k, vals in re.findall(r'^(\d+): \[([\d, ]+)\],$', code, re.M)}


# ------------------------------------------------------------------ the refused stage: a measured unit cost
def measure_tabulation(prof, ncells=12, nodes=50):
    """seconds per exact node evaluation (Fraction Horner of a degree-18 cell polynomial at s = k/50), the unit of the
    paper's tabulation stage (:9293-9300: every step of length .01 sampled at 50 fractions, for M, X, k, l and Q)"""
    cells = prof['side'][1]['cells'][:ncells]
    t = time.time()
    for c in cells:
        for k in range(nodes):
            s = F(k, nodes)
            v = F(0)
            for cn in reversed(c):
                v = v * s + cn
            v / D
    return (time.time() - t) / (ncells * nodes)


# ------------------------------------------------------------------ the printed numbers
def printed(tex):
    flat = ' '.join(tex.split())
    P = {}
    P['abstract'] = '$0.4126930<\\gamma<0.4126934$, and $0.4231063<\\theta<0.4231088$' in flat
    P['theorem'] = '0.4126930<\\gamma<0.4126934,\\qquad 0.4231063<\\theta<0.4231088.' in flat
    P['bracket'] = '0.2936533<a_*<0.2936535.' in flat
    P['lambda_claim'] = '\\lambda(0.2936533)>0.2936533,\\qquad \\lambda(0.2936535)<0.2936535.' in flat
    P['seeds_text'] = 'The integer seeds for the final two spectral tests are $2936535033$ and $2936533047$, with denominator $10^{10}$.' in flat
    P['windows_text'] = ('.2936535023&<\\lambda(.2936533)<.2936535043,\\\\ .2936533037&<\\lambda(.2936535)<.2936533057.' in flat)
    P['theta_digits'] = '0.4231063544994904\\ldots<\\theta<0.4231087030795289\\ldots' in flat
    P['tail_coeff'] = ('c_{{\\rm tail},+}&=2a_*-1\\in(-0.4126934,-0.4126930)' in flat and
                       'c_{{\\rm tail},-}&=\\frac{a_*}{1/2-a_*}-1\\in(0.4231063,0.4231088)' in flat)
    P['cert_file_cited'] = 'certificate/original\\_certificate.py' in flat
    return P


N_REFERENCES_NOTE = ('47: the table db of Appendix app:code has 49 entries, 47 at AD = 10^6 for the coarse, nonlinear '
                     'and local tests plus the two final ones (counted after this decider first ran)')
SOURCE_SHA = '7bd5dbd918d9a48fe4da62044e295239b74f7a1607e2643337ad4d073a85dc7f'   # printed at :9496-9497
TESTS = ((2936533, 2936535033), (2936535, 2936533047))   # (A, seed) as printed: lambda(A/1e7) near seed/1e10
GAMMA = (F('0.4126930'), F('0.4126934'))
THETA = (F('0.4231063'), F('0.4231088'))
THETA_DIGITS = (4231063544994904, 4231087030795289)


# ------------------------------------------------------------------ the decision
def lemma_checks(checks, ex):
    """the numeric steps of Lemmas cert:M-error and cert:tail-enclosure and of the shooting bounds, as printed (general
    worst cases); ex = exp enclosure function"""
    e129 = ex(F('1.29'))[1]
    em076 = ex(F('-0.076'))[0]
    pi_lo, _ = pi_enclosure()
    check(checks, '2. M-error lemma: damping .18 - .0082 > .17; .41 * .8 <= .34 (aX); .34^2/.09 < 1.29 (negative part of 2 beta); '
                  '.05 + .41 * .8 < .38 (beta on [0,.1]); 2 phi(0) = sqrt(2/pi) < .8 (pi > 3.125)',
          F('.18') - F('.0082') > F('.17') and F('.41') * F('.8') <= F('.34') and F('.34') ** 2 / F('.09') < F('1.29')
          and F('.05') + F('.41') * F('.8') < F('.38') and pi_lo > F('3.125'))
    src = F('1e-23') + (1 + F('.0082')) * F('1e-22')
    F0 = (F('2e-22') + F('.1') ** 2 * e129 * F('2.1e-22') / 2) / (F('.1') * em076)
    Fx = e129 * (F('2.4e-21') + 24 * F('2.1e-22'))
    check(checks, '2. M-error lemma: source |f| <= 1e-23 + (2p + 2.02a) 1e-22 = 1e-23 + 1.0082e-22 < 2.1e-22; |F(0)| < 2.4e-21; '
                  'e^1.29 (2.4e-21 + 24 * 2.1e-22) < 4e-20 (rigorous e^x)',
          src < F('2.1e-22') and F0 < F('2.4e-21') and Fx < F('4e-20'), '|F(0)| <= %.4g, |F| <= %.4g' % (float(F0), float(Fx)))
    # tail constants over the sided c ranges: + side p = 1/2, -.71 < c < .81; - side p >= .09, -.01 < c < .81
    cc_plus = max(abs(c * (c - 1)) for c in (F('-0.71'), F('0.81'), F('0.5')))
    cc_minus = max(abs(c * (c - 1)) for c in (F('-0.01'), F('0.81'), F('0.5')))
    d_plus, d_minus = F('1.215') / (2 * Q_HALF), F(1, 4) / (2 * F('.09'))
    e_plus = (2 * F('0.71') + 3) * d_plus / (2 * Q_HALF)
    e_minus = (2 * F('0.01') + 3) * d_minus / (2 * F('.09'))
    K_minus = (10 * 24 + 3 * F('1.4') ** 2 + 30) / F('.09')
    check(checks, '2. tail constants: |c(c-1)| < 1.215 (+ side) and <= 1/4 (- side) on the stated c ranges, hence |d| < 1.4, |e| < 24, K < 3066',
          cc_plus < F('1.215') and cc_minus <= F(1, 4) and max(d_plus, d_minus) < F('1.4') and max(e_plus, e_minus) < 24 and K_minus < 3066,
          'max |c(c-1)| %.4f / %.4f; |e| <= %.3f; K <= %.2f' % (float(cc_plus), float(cc_minus), float(max(e_plus, e_minus)), float(K_minus)))
    x = F(12)
    p = F('.09')
    ep = ex(-p * x * x)[1]
    cost = x ** 6 * (2 * F('.41') * ep / (2 * p * x) * F('.071') + 2 * F('.41') * ep)
    check(checks, '2. tail lemma: exponential-coefficient residual cost x^6 [2 (.41 e^-px^2/(2px)) .071 + 2 (.41 e^-px^2)] < 8 at p = .09, x = 12, '
                  'with x^2 = 144 > 3/p (x^6 e^-px^2 decreasing on x >= 12)',
          cost < 8 and x * x > 3 / p, 'cost %.4f' % float(cost))
    bound_T = F('.81') / 12 + F('1.4') / 12 ** 3 + F(24) / 12 ** 5 + F(3066) / 12 ** 7
    pK = 10 * 24 + 3 * F('1.4') ** 2 + 30
    deriv = 2 * F('1.4') / 12 ** 3 + (4 * 24 + F('6.62') * 24 + F('1.4') ** 2 + 1 + 8 + 2 * pK + (1 + 2 * F('.82')) * 3066 / F(144) + F(3066) ** 2 / F(12) ** 8) / F(12) ** 5
    check(checks, '2. tail lemma: |T| + K x^-7 < .071 at x = 12 (c < .81, |d| < 1.4, |e| < 24, K < 3066); the derivative-bound sum < .00514 < .0055',
          bound_T < F('.071') and deriv < F('.00514'), '|S| <= %.5f; derivative sum %.6f' % (float(bound_T), float(deriv)))
    e2 = ex(2)[1]
    em6 = ex(-6)[1]
    em20 = ex(-20)[1]
    E20 = F(3066) / 20 ** 7 + F(2, 10 ** 36)
    g1 = e2 * (F('2.41e-6') + 20 * (F('2e-9') + F('3e-19')))
    g2 = F('2.41e-6') * em6 + 20 * e2 * (F('2e-9') + F('3e-19'))
    g3 = F('2.41e-6') * em20 + 20 * e2 * F('3e-19')
    check(checks, '2. shooting bounds: K/20^7 + 2/10^36 < 2.41e-6; e^2[2.41e-6 + 20(2e-9 + 3e-19)] < 2.9e-5 < .001; '
                  '2.41e-6 e^-6 + 20 e^2 (2e-9 + 3e-19) < 4.5e-7; 2.41e-6 e^-20 + 20 e^2 3e-19 < 1e-10',
          E20 < F('2.41e-6') and g1 < F('2.9e-5') and g2 < F('4.5e-7') and g3 < F('1e-10'),
          '%.4g, %.4g, %.4g, %.4g' % (float(E20), float(g1), float(g2), float(g3)))
    return dict(e2=e2, em6=em6, em20=em20)


def tail_instance_ok(lam, p_eps, eps):
    """the tail lemma's hypotheses and algebra at an actual (lambda, p_eps)"""
    c, d, e, K = tail_coeffs(lam, p_eps)
    hyp = F('-0.71') < c < F('0.81') and (eps == 1 or c > F('-0.01'))
    # R(T) = T' - 2 p x T + T^2 - 2(p - lambda) as a Laurent polynomial in x: {power: coeff}
    T = {-1: c, -3: d, -5: e}
    R = {}
    for k, v in T.items():
        R[k - 1] = R.get(k - 1, 0) + k * v                    # T'
        R[k + 1] = R.get(k + 1, 0) - 2 * p_eps * v            # -2 p x T
    for k1, v1 in T.items():
        for k2, v2 in T.items():
            R[k1 + k2] = R.get(k1 + k2, 0) + v1 * v2          # T^2
    R[0] = R.get(0, 0) - 2 * (p_eps - lam)
    R = {k: v for k, v in R.items() if v != 0}
    want = {k: v for k, v in {-6: (2 * c - 5) * e + d * d, -8: 2 * d * e, -10: e * e}.items() if v != 0}
    ident = R == want
    x = F(12)
    six = (abs(2 * c - 5) + 2 * abs(d) / x ** 2 + abs(e) / x ** 4) * abs(e) + d * d <= F('6.62') * abs(e) + d * d + 1
    pK = p_eps * K
    rem = abs(-7 + 2 * c) + 2 * abs(d) / x ** 2 + 2 * abs(e) / x ** 4
    seven = rem * K / x ** 2 + K * K / x ** 8 <= F('.7') * pK
    room = F('1.3') * pK - (F('6.62') * abs(e) + d * d + 1 + 8) == F('6.38') * abs(e) + F('2.9') * d * d + 30 > 0
    consts = abs(d) < F('1.4') and abs(e) < 24 and K < 3066
    return hyp and ident and six and seven and room and consts, (c, d, e, K)


def decide(src=None, tests=TESTS, claim_params=None, theta_hi=None, verbose=False):
    """tests: (A, seed) pairs for the two spectral tests; claim_params: the parameters at which the printed signs of
    lambda(a) - a are asserted (forges); theta_hi: the printed theta upper bound (forges)"""
    t0 = time.time()
    src = src or Sources()
    tex = src.text(MAIN)
    checks = []
    P = printed(tex)
    check(checks, 'the claims as printed: gamma/theta bounds (abstract, Theorem thm:main), the root bracket (:310), the two eigenvalue signs (:7838), '
                  'the seeds and windows (:9499-9504), the 16-digit theta endpoints (:8865), the tail coefficients (:7849-7850)',
          all(P[k] for k in ('abstract', 'theorem', 'bracket', 'lambda_claim', 'seeds_text', 'windows_text', 'theta_digits', 'tail_coeff')))
    ex = exp_enclosure
    E = lemma_checks(checks, ex)
    pi_lo, pi_hi = pi_enclosure()
    value = {'tests': {}}
    timing = {}
    windows = {}
    for A, seed in tests:
        a = F(A, AD)
        p = Q_HALF - a
        t = time.time()
        prof = profile(A)
        sp, sm = prof['side'][1], prof['side'][-1]
        m_res = max(F(sp['res'], D * D * AD), F(sm['res'], D * D * AD))
        end_p = abs(F(sp['end'], D))
        end_m = abs(F(sm['end'], D) - 24)
        dmin, dmax = min(sp['dmin'], sm['dmin']), max(sp['dmax'], sm['dmax'])
        M0 = F(prof['u'][0], D)
        phi0_lo = 1 / sqrt_enclosure(2 * pi_hi)[1]
        phi0_hi = 1 / sqrt_enclosure(2 * pi_lo)[0]
        ok1 = check(checks, '1. a = %s: the trial M~ on all %d cells has ODE residual < 1e-23 (sum of |integer coefficients| < AD D^2 / 10^23)' % (a, 2 * NZ),
                    m_res < F('1e-23'), 'max residual bound %.3e' % float(m_res))
        ok2 = check(checks, '1. a = %s: exact C^1 joins (integer sums carried; c_1 opposite at z = 0); |M~(24)| < 1e-23; |M~(-24) - 24| < 1e-23' % a,
                    sp['joins'] and sm['joins'] and sp['cells'][0][1] == -sm['cells'][0][1] and sp['cells'][0][0] == sm['cells'][0][0]
                    and end_p < F('1e-23') and end_m < F('1e-23'), '|M~(24)| = %.2e, |M~(-24) - 24| = %.2e' % (float(end_p), float(end_m)))
        ok3 = check(checks, '1. a = %s: -1.01 <= M~\' <= .01 on every cell; M~(0) inside the value barriers phi(0) <= M(0) <= 2 phi(0)' % a,
                    dmin >= F('-1.01') and dmax <= F('.01') and phi0_hi <= M0 <= 2 * phi0_lo,
                    'M~\' in [%.6f, %.3e]; M~(0) = %.15f; M~\'(0) = %.15f' % (float(dmin), float(dmax), float(M0), float(F(prof['u'][1] * 100, D))))
        # the M-error lemma at the actual parameter, with the actual trial bounds
        damp = 2 * p - 2 * a * max(dmax, F(0))
        e_inv = 1 / ex(1)[0]                                    # e^-1 <= this, so e^-y <= this^floor(y)
        tail_p = e_inv ** 288 / 24
        tail_m = e_inv ** int(p * 576) / (2 * p * 24)
        Ebound = max(m_res / F('.17'), end_p + tail_p, end_m + tail_m)
        f_src = m_res + (2 * p + 2 * a * max(abs(dmin), abs(dmax))) * F('1e-22')
        ok4 = check(checks, '2. a = %s: the M-error lemma instance: damping 2p - 2a max M~\' > .17; |E| <= max(res/.17, boundary + Gaussian tail) < 1e-22; source < 2.1e-22' % a,
                    damp > F('.17') and Ebound < F('1e-22') and f_src < F('2.1e-22'), 'damping %.5f; |E| <= %.3e; source %.3e' % (float(damp), float(Ebound), float(f_src)))
        for k in (2, 3, 4):
            checks[-k]['trial'] = True                          # ok1..ok3: the quality of OUR trial; ok4 (last) is the lemma
        timing['profile %s' % A] = (prof['t_solve'], prof['t_cert'])
        # the three Riccati trials per side
        trials = {}
        for tag, L in (('lo', seed - 10), ('mid', seed), ('hi', seed + 10)):
            for eps in (1, -1):
                trials[(tag, eps)] = riccati(prof, eps, L)
        timing['riccati %s' % A] = round(time.time() - t - prof['t_solve'] - prof['t_cert'], 1)
        # tail instances at every tested lambda
        inst = all(tail_instance_ok(F(L, LD), Q_HALF if eps == 1 else p, eps)[0] for L in (seed - 10, seed, seed + 10) for eps in (1, -1))
        check(checks, '2. a = %s: the tail lemma at each tested lambda and side: c ranges, the identity R(T) (exact Laurent polynomial), '
                                  'x^6|R(T)| <= 6.62|e| + d^2 + 1 and remainder <= .7pK at x >= 12, the room identity, |d| < 1.4, |e| < 24, K < 3066' % a, inst)
        # error analysis per trial
        errs = {}
        ok_tr = True
        details = []
        for (tag, eps), tr in trials.items():
            neg, total, upper = drift_facts(tr)
            res_ok = tr['res'] < F('1e-20')
            fS = 2 * a * F('1e-22') * tr['smax'] + 2 * a * F('4e-20') + tr['res']
            p_eps = Q_HALF if eps == 1 else p
            if tag == 'mid':
                # the window: lambda within 1e-9 of the middle value; T(20) varies by at most sup|dT/dc| |dc|
                c_lo = F(seed - 10, LD) / p_eps - 1
                c_hi = F(seed + 10, LD) / p_eps - 1
                cm = max(abs(c_lo), abs(c_hi))
                dTdc = F(1, 20) + (2 * cm + 1) / (2 * p_eps * 20 ** 3) + (6 * cm * cm + 10 * cm + 3) / (4 * p_eps * p_eps * 20 ** 5)
                dT = dTdc * F(10, LD) / p_eps
                # c is linear in lambda, so the sided c-hypotheses at both window ends hold on the window, and with
                # them the lemma's general K < 3066 (checked in lemma_checks)
                hyp_w = all(F('-0.71') < cc < F('0.81') and (eps == 1 or cc > F('-0.01')) for cc in (c_lo, c_hi))
                E20 = (F(3066) if hyp_w else F(10 ** 9)) / 20 ** 7 + tr['g20_err'] + dT
                src_w = fS + F('2e-9')
            else:
                E20 = tr['K'] / 20 ** 7 + tr['g20_err']
                src_w = fS
            glob = E['e2'] * (E20 + 20 * src_w)
            cent = E20 * E['em6'] + 20 * E['e2'] * src_w
            zero = E20 * E['em20'] + 20 * E['e2'] * src_w
            ok = (res_ok and neg > -2 and total > 20 and upper > 8 and fS < F('3e-19') and E20 < F('2.41e-6') and glob < F('.001'))
            if tag == 'mid':
                ok &= glob < F('2.9e-5') and cent < F('4.5e-7')
            else:
                ok &= zero < F('1e-10')
            errs[(tag, eps)] = zero
            ok_tr &= ok
            details.append('%s%+d: res %.1e, neg %.3f, total %.1f, x>=12.02 %.1f, src %.1e, E20 %.3e, glob %.2e, zero %.1e' % (
                tag, eps, float(tr['res']), float(neg), float(total), float(upper), float(fS), float(E20), float(glob), float(zero)))
        check(checks, '3. a = %s: six Riccati trials (lambda = seed/1e10 and -+ 1e-9, both sides): residual < 1e-20; drift negative part > -2, '
                                  'total > 20, part on x >= 12.02 > 8; source < 3e-19; initial error < 2.41e-6; bootstrap < .001 closed '
                                  '(middle: whole window, < 2.9e-5 and < 4.5e-7 centrally); endpoint error at 0 < 1e-10' % a, ok_tr, '; '.join(details))
        checks[-1]['trial'] = True
        m_lo = trials[('lo', 1)]['S0'] + trials[('lo', -1)]['S0']
        m_hi = trials[('hi', 1)]['S0'] + trials[('hi', -1)]['S0']
        m_mid = trials[('mid', 1)]['S0'] + trials[('mid', -1)]['S0']
        err_lo = errs[('lo', 1)] + errs[('lo', -1)]
        err_hi = errs[('hi', 1)] + errs[('hi', -1)]
        ok_sign_ = m_lo < F('-1e-9') and m_hi > F('1e-9') and err_lo < F('2e-10') and err_hi < F('2e-10') and -m_lo > err_lo and m_hi > err_hi
        ok_sign = check(checks, '3. a = %s: the printed integer tests — trial match S~_+(0) + S~_-(0) < -1e-9 at lambda = %s and > 1e-9 at %s, '
                                  'total error < 2e-10: the exact match changes sign, so lambda(a) is in the printed window' % (a, F(seed - 10, LD), F(seed + 10, LD)),
                          ok_sign_, 'match %.4e / %.4e / %.4e at lo / mid / hi; errors %.1e, %.1e; slope ~ %.4f per unit lambda' % (
                              float(m_lo), float(m_mid), float(m_hi), float(err_lo), float(err_hi), float((m_hi - m_lo) / F(20, LD))))
        windows[A] = (F(seed - 10, LD), F(seed + 10, LD)) if ok_sign else None
        # an own estimate of lambda(a) (informative: the zero of the secant through the endpoint trials)
        lam_est = F(seed - 10, LD) - m_lo * F(20, LD) / (m_hi - m_lo)
        value['tests'][str(a)] = {'seed': seed, 'window': [str(F(seed - 10, LD)), str(F(seed + 10, LD))],
                                  'match_lo_mid_hi': ['%.6e' % float(m) for m in (m_lo, m_mid, m_hi)],
                                  'lambda_secant_estimate': dec(lam_est, 13), 'M0': dec(M0, 34),
                                  'dM0': dec(F(prof['u'][1] * 100, D), 34), 'newton_iterations': prof['newton_iterations']}

    # 4. consequences
    printed_windows = {2936533: (F('.2936535023'), F('.2936535043')), 2936535: (F('.2936533037'), F('.2936533057'))}
    ok_w = all(windows.get(A) == printed_windows[A] for A, _ in tests if A in printed_windows)
    check(checks, '4. the certified windows are the printed decimals .2936535023 < lambda(.2936533) < .2936535043 and '
                              '.2936533037 < lambda(.2936535) < .2936533057', ok_w)
    cp = claim_params or (F('0.2936533'), F('0.2936535'))
    wl, wh = windows.get(tests[0][0]), windows.get(tests[1][0])
    ok_sgn = (wl is not None and wh is not None and F(tests[0][0], AD) == cp[0] and F(tests[1][0], AD) == cp[1]
              and wl[0] > cp[0] and wh[1] < cp[1])
    check(checks, '4. lambda(%s) > %s and lambda(%s) < %s (Section 7, :7838-7839), hence (continuity of lambda, theory) a root in the bracket'
                      % (cp[0], cp[0], cp[1], cp[1]), ok_sgn)
    a_lo, a_hi = F('0.2936533'), F('0.2936535')
    th = lambda a: 2 * a / (1 - 2 * a) - 1  # noqa: E731
    g_lo, g_hi = 1 - 2 * a_hi, 1 - 2 * a_lo
    t_lo, t_hi = th(a_lo), th(a_hi)
    thp = theta_hi if theta_hi is not None else THETA[1]
    ok_exp = (GAMMA[0] <= g_lo and g_hi <= GAMMA[1] and THETA[0] <= t_lo and t_hi <= thp
              and all(1 / (2 + th(a)) == 1 - 2 * a for a in (a_lo, a_hi))
              and -F('0.4126934') <= 2 * a_lo - 1 and 2 * a_hi - 1 <= -F('0.4126930'))
    check(checks, '4. for a in (.2936533, .2936535): gamma = 1 - 2a in [%s, %s] and theta = 2a/(1-2a) - 1 in [%s, %s] lie inside the printed '
                  '0.4126930 < gamma < 0.4126934 and 0.4231063 < theta < %s (strict, a_* being strictly inside); gamma = 1/(2+theta); '
                  'c_tail,+ = 2a-1 and c_tail,- = theta in the printed intervals (:7849-7850)' % (g_lo, g_hi, t_lo, t_hi, thp),
          ok_exp, 'theta endpoints %s..., %s...' % (str((t_lo * 10 ** 22).__floor__()), str((t_hi * 10 ** 22).__floor__())))
    # the 16-digit display of :8865: the exact endpoints rounded to 16 digits are the printed strings; truncated, the
    # upper one ends ...5288, not ...5289 (a display discrepancy, recorded, not a refutation: the stated bounds hold)
    rnd = lambda x: (x * 10 ** 16 + F(1, 2)).__floor__()  # noqa: E731
    trunc = lambda x: (x * 10 ** 16).__floor__()  # noqa: E731
    check(checks, '4. the 16-digit theta endpoints printed at :8865 (0.4231063544994904..., 0.4231087030795289...) are the exact endpoints '
                  'rounded to 16 digits', (rnd(t_lo), rnd(t_hi)) == THETA_DIGITS,
          'exact: 0.%s... and 0.%s...' % ((t_lo * 10 ** 22).__floor__(), (t_hi * 10 ** 22).__floor__()))
    value['discrepancies'] = []
    if (trunc(t_lo), trunc(t_hi)) != THETA_DIGITS:
        value['discrepancies'].append(
            'main.tex:8865 prints the theta upper endpoint as "0.4231087030795289\\ldots"; the exact endpoint 2a/(1-2a) - 1 at '
            'a = .2936535 is 174614/412693 = 0.42310870307952885074..., so the printed 16th digit is ROUNDED (it is the '
            'binary64 repr), not a truncation followed by further digits; the stated bounds 0.4231063 < theta < 0.4231088 '
            'are unaffected')

    # the published starting data (db, Appendix app:code) and the source hash — DATA and a checksum; read only after the
    # clean-room trials above had been built and run (2026-10-10); our Newton shooting found its own starting data
    import hashlib
    code = appendix_listing(tex)
    sha = hashlib.sha256(code.encode('utf-8')).hexdigest()
    check(checks, 'the appendix listing (681 lines) hashes to the printed source sha256 7bd5dbd9...85dc7f (:9496-9497): the cited '
                  'certificate/original_certificate.py, absent as a file, is published byte for byte in the TeX', sha == SOURCE_SHA, sha)
    db = db_entries(code)
    agree = []
    text_seeds = dict(TESTS)
    for A, _ in tests:
        if A not in db or A not in text_seeds:
            continue                                   # a forged parameter has no published starting data
        m0, k0, lam = db[A]
        u = PROFILES[A]['u']
        dm = abs(F(u[0], D) - F(m0, 10 ** 36))
        dk = abs(F(u[1] * 100, D) + F(k0 * 100, 10 ** 36))
        agree.append(dm < F('1e-28') and dk < F('1e-28') and lam == text_seeds[A])
        value['tests'][str(F(A, AD))]['published_db'] = {'M0': dec(F(m0, 10 ** 36), 34), 'dM0': dec(-F(k0 * 100, 10 ** 36), 34),
                                                         'our_minus_published': ['%.2e' % float(F(u[0], D) - F(m0, 10 ** 36)),
                                                                                 '%.2e' % float(F(u[1] * 100, D) + F(k0 * 100, 10 ** 36))]}
    check(checks, 'the published starting data of the final two tests (db, Appendix app:code: M(0), M\'(0), seed) agree with the '
                  'independently shot ones to < 1e-28, and the db seeds are the text\'s seeds', bool(agree) and all(agree) and len(db) == 49,
          '%d db entries' % len(db))

    # facts and the refusal
    root = os.path.join(CLONE, DIR)
    listing = sorted(os.path.relpath(os.path.join(dp, f), root) for dp, _, fs in os.walk(root) for f in fs)
    value['facts'] = {'release_files': listing,
                      'certificate/original_certificate.py (cited :9466) present as a file': os.path.exists(os.path.join(root, 'certificate', 'original_certificate.py')),
                      'certificate/original_certificate.py recoverable from the appendix listing (sha256 match)': sha == SOURCE_SHA,
                      'reproducibility record (cited :9475)': any('reproduc' in f.lower() or f.endswith('.json') or f.endswith('.txt') for f in listing)}
    value['timing_seconds'] = timing
    per_node = measure_tabulation(profile(tests[0][0]))
    nodes = 2 * NZ * 50 * 4 + 2 * NX * 50
    prof_s = sum(sum(v) if isinstance(v, tuple) else v for v in timing.values()) / max(1, len(tests))
    value['refused_cost'] = {
        'measured_exact_profile_plus_three_riccati_pairs_per_parameter_s': round(prof_s, 1),
        'measured_exact_node_evaluation_s': '%.2e' % per_node,
        'nodes_per_reference_profile (2 x 2400 steps x 50 samples x M,X,k,l + 2 x 2000 x 50 for Q)': nodes,
        'exact_tabulation_per_reference_s': round(per_node * nodes, 1),
        'integration_grid_cells_per_integral (2048 per dyadic scale on [2^-38, 1-2^-38], split at 1/2)': 2 * 37 * 2048,
        'reference_profiles_in_stage_II': N_REFERENCES_NOTE,
        'exact_tabulation_all_references_h (a LOWER bound: no integral, no inverse lookup, no test)': round(47 * per_node * nodes / 3600, 2),
        'paper_float_run_s (Python 3.12.13 + NumPy 2.3.5, :9479-9482)': 338.52,
    }
    value['seconds'] = round(time.time() - t0, 1)
    value['refused_because'] = REFUSED_BECAUSE
    trial_ok = all(c['pass'] for c in checks if c.get('trial'))        # the quality of OUR certificate
    claim_ok = all(c['pass'] for c in checks if not c.get('trial'))    # the printed claims, given our certificate
    if not trial_ok:
        verdict = 'REFUSED'
        value['note'] = 'our own trial certificate did not pass its quality checks; nothing about the paper is decided'
    elif not claim_ok:
        verdict = 'REFUTED'
    else:
        verdict = 'REFUSED'
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: stage (I) of the certificate — the two final spectral tests '
                       '(.2936535023 < lambda(.2936533) < .2936535043, .2936533037 < lambda(.2936535) < .2936533057, hence '
                       'lambda(a) - a changes sign on (.2936533, .2936535)) by own exact integer certificates of the profile and of '
                       'the Riccati shooting, the numeric steps of the three error lemmas, and the exact exponent arithmetic from '
                       'the bracket to the printed gamma and theta bounds. NOT stage (II) (the six interval routines: the '
                       '[0, .410] -> [.285, .303] narrowing and the contraction that make the root unique and equal to the '
                       'selected coefficient), NOT the theory; hence not the headline'}


REFUSED_BECAUSE = [
    'stage (II) is specified by its program: the prose of :8181-8800 and :9208-9463 names arrays and routines of Appendix '
    'app:code (Env, adjusted with caps .1431/.1301, nonlinearfunctional with geometric interpolation, lm/lx/lz, shifts, cv, '
    'cp, den, the k-grids and their clipping) rather than defining them; a clean-room decider may not take them from the '
    'checking code, and the prose alone underdetermines them',
    'cost: exact tabulation alone — 1.16e6 node evaluations per reference profile at a measured ~1e-4 s each, for the 47 '
    'reference profiles of stage II — is ~1.5 h of one core before any integral (151,552-cell grids), inverse lookup or sign '
    'test (value[\'refused_cost\']); the paper\'s own binary64 NumPy run took 338.52 s',
    'missing file: the reproducibility record (software versions, source hashes, saved output of the October 4, 2026 run) '
    'cited at :9475-9483 is not in the release (certificate/original_certificate.py is absent as a file but its text is the '
    'appendix listing, whose sha256 matches the printed hash)',
]


def forge():
    """each must NOT come back clean (REFUTED): a moved printed window, a moved claim parameter, a wrong theta bound"""
    out = []
    r = decide(tests=((2936533, 2936535033 + 30), (2936535, 2936533047)))
    out.append(('the printed seed for lambda(.2936533) moved by +30 (window (.2936535053, .2936535073))', r['verdict']))
    r = decide(tests=((2936533, 2936535033), (2936534, 2936534040)), claim_params=(F('0.2936533'), F('0.2936534')))
    out.append(('the upper claim moved to lambda(.2936534) < .2936534 (window around the true lambda(.2936534))', r['verdict']))
    r = decide(theta_hi=F('0.4231080'))
    out.append(('the printed theta upper bound .4231088 -> .4231080', r['verdict']))
    return out


if __name__ == '__main__':
    t = time.time()
    res = decide()
    v = dict(res['value'])
    v['facts'] = dict(v['facts'], release_files=', '.join(v['facts']['release_files']))
    print(json.dumps({'verdict': res['verdict'], 'decides': res['decides'], 'value': v}, indent=1, default=str))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], '|', c['detail'])
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t))
