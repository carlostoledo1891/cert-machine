"""formulas.py — the two papers' outer-range arithmetic, transcribed once, with equation numbers.

Anand, "Zeta 7 is Irrational" (Zenodo 22920911 v1, 2026-09-23), and, as a calibration, Fauzan,
"zeta(5) is irrational" (Zenodo 22826419, 2026-09-17), whose architecture Anand follows. Both use
K = 40n, N = 3n, h = 37n, alpha = N/K = 3/40, lambda = h/K = 37/40, and y = p/K in the outer range
K/3 < p <= 2h.

Each paper's outer exponent is written TWICE here, by two routes that share no expression:
  * `*_limit(y)` — the K -> infinity limit of -L_p/K at p = yK, as code over pwaff.Aff, so that
    pwaff.integrate proves it piecewise affine and integrates it exactly;
  * `*_Lp(K, p)` — the finite integer exponent L_p(K) of (60)/(5.1), third branch (3p > K),
    straight from (54), (58), (59), (62) [Anand] or (4.10), (4.14), (5.3) [Fauzan].
The printed tables and constants are at the bottom, copied from the PDFs (sha256 in PROVENANCE.json).
cert-machine's own code, standard library only. No line here is taken from the claimant or from the
issue's reproduction script.
"""
from fractions import Fraction as Q
from pwaff import Aff, amin, amax, above, floor_inv

ALPHA = Q(3, 40)      # N/K, both papers
LAM = Q(37, 40)       # h/K, both papers
Y0, Y1 = Q(1, 3), 2 * LAM      # the outer range in y = p/K: (1/3, 37/20]


# ---------------------------------------------------------------------------------------------------
# The scalar part: lim -v_p(S_K)/K for K/3 < p <= 2h (p odd, p > N, p^2 > 2h), derived here from
# Legendre: v_p(S_K) = 2h floor(K/p) - c h floor(N/p) - 2 sum_{i<h} floor(2i/p), and
# sum_{i<h} floor(2i/p) = sum_j #{i < h : 2i >= jp} -> K sum_j (lambda - j y/2)_+ .
# ---------------------------------------------------------------------------------------------------
def scalar_legendre(y, c_N):
    """c_N = 16 (Anand (62)) or 12 (Fauzan (5.3)). Written from Legendre, not from (73)."""
    k = floor_inv(y.cell, 'floor(K/p)')
    kN = (ALPHA * (1 / y.cell.mid)).__floor__()          # floor(N/p) = floor(alpha/y)
    if not (y.cell.lo > ALPHA):                            # certify floor(alpha/y) = 0 on the cell
        raise ValueError('outer range must have y > alpha')
    assert kN == 0
    s = Aff(0, 0, y.cell)
    for j in range(1, 13):
        s = s + (LAM - Q(j, 2) * y).pos(f'2i >= {j}p')
    assert (LAM - Q(13, 2) * y).at(y.cell.lo) <= 0       # j >= 13 never contributes for y > 1/3
    return -2 * LAM * k + c_N * LAM * kN + 2 * s


def scalar_printed(y, J):
    """The paper's own printed form: -2 lambda floor(1/y) + sum_{j=1}^{J} (2 lambda - j y)_+  [(73), (5.10)]."""
    k = floor_inv(y.cell, 'floor(1/y)')
    s = Aff(0, 0, y.cell)
    for j in range(1, J + 1):
        s = s + (2 * LAM - j * y).pos(f'(2lambda - {j}y)_+')
    return -2 * LAM * k + s


# ---------------------------------------------------------------------------------------------------
# Anand (54), (58), (59) in the limit: -gamma_p^out / K at p = yK.  gamma^out = 0 for p > K (§5.1).
# ---------------------------------------------------------------------------------------------------
def anand_neg_gamma(y):
    if above(y.cell, 1, 'p > K: gamma_out = 0 (§5.1)'):
        return Aff(0, 0, y.cell)
    k = floor_inv(y.cell, 'floor(K/p)')
    v = 1 - k * y                                              # (58) v = K - p floor(K/p)
    u = (ALPHA + v - y).pos('u = max(0, N + v - p + 1)')      # (58)
    t = amin(Aff(ALPHA, 0, y.cell), v, 't = min(N, v)') + u   # (58)
    r = amin(Aff(LAM, 0, y.cell), (1 + 6 * ALPHA - 3 * y).pos('r_p'), 'r_p = min(h, .)')   # (54)
    if above(y.cell, Q(1, 2), 'K < 2p'):                      # (59), first branch
        return 9 * (1 - y) - 8 * t + amin(r, y - ALPHA + u, 'min(r_p, p-1-N+u)')
    return 9 * (1 - y) - 16 * ALPHA - 7 * t + amin(r, y + u, 'min(r_p, p+u)')   # (59), second branch


def anand_d(y):
    """(72): d(y) = (1 + 6 alpha - 3y - (1 + 2 alpha - 3y)_+)_+ on (1/3, 1/2), 0 elsewhere."""
    if above(y.cell, Q(1, 2), 'indicator (1/3,1/2)'):
        return Aff(0, 0, y.cell)
    return (1 + 6 * ALPHA - 3 * y - (1 + 2 * ALPHA - 3 * y).pos('d inner')).pos('d outer')


def anand_T_R2(y):
    """Reading R2 — the integrand whose integral IS lim (1/K^2) sum (-L_p) log p, L_p from (60):
    lim -gamma/K from (59) plus the scalar. This is what (61) defines and what the proof of
    Proposition 5.4 uses ("-gamma_out = K(R0 - d) + O(1)", so R0 - d IS lim -gamma/K)."""
    return anand_neg_gamma(y) + scalar_printed(y, 7)


def anand_T_R1(y):
    """Reading R1 — the literal (71) + (73): R0 := lim -gamma/K by (71), and d(y) of (72) subtracted
    AGAIN. It double-counts the rank correction; it is the reading most favourable to the claimant."""
    return anand_neg_gamma(y) - anand_d(y) + scalar_printed(y, 7)


def anand_T_R2_legendre(y):
    """R2 with the scalar derived from Legendre instead of copied from (73) — must be identical."""
    return anand_neg_gamma(y) + scalar_legendre(y, 16)


# ---------------------------------------------------------------------------------------------------
# Fauzan (4.10), (4.14) in the limit, and Fauzan's own printed R0, d (5.8), (5.9) — the calibration.
# ---------------------------------------------------------------------------------------------------
def fauzan_neg_gamma(y):
    if above(y.cell, 1, 'p > K: gamma_out = 0 (§5)'):
        return Aff(0, 0, y.cell)
    k = floor_inv(y.cell, 'floor(K/p)')
    v = 1 - k * y
    u = (ALPHA + v - y).pos('u')
    t = amin(Aff(ALPHA, 0, y.cell), v, 't') + u
    r = (1 + 4 * ALPHA - 2 * y).pos('r_p = max(0, K + 4N - 2p + 2)')       # (4.10)
    if above(y.cell, Q(1, 2), 'K < 2p'):
        return 7 * (1 - y) - 6 * t + amin(r, y - ALPHA + u, 'min')         # (4.14) first branch
    return 7 * (1 - y) - 12 * ALPHA - 5 * t + amin(r, y + u, 'min')        # (4.14) second branch


def fauzan_T_from_gamma(y):
    return fauzan_neg_gamma(y) + scalar_printed(y, 5)


def fauzan_T_printed_R0(y):
    """Fauzan's (5.10) integrand with his own printed R0 (5.8) and d (5.9)."""
    a = ALPHA
    if above(y.cell, 1, 'y > 1'):
        R0 = Aff(0, 0, y.cell)
    elif above(y.cell, Q(1, 2), 'y > 1/2'):
        R0 = 7 * (1 - y) - 6 * amin(Aff(a, 0, y.cell), 1 - y) - 6 * (1 + a - 2 * y).pos() + (1 + 4 * a - 2 * y).pos()
    else:
        R0 = 8 - 9 * y - 8 * a - 5 * amin(Aff(a, 0, y.cell), 1 - 2 * y) - 5 * (1 + a - 3 * y).pos()
    if above(y.cell, Q(1, 2), 'indicator'):
        d = Aff(0, 0, y.cell)
    else:
        d = (1 + 4 * a - 3 * y - (1 + a - 3 * y).pos()).pos()
    return R0 - d + scalar_printed(y, 5)


# ---------------------------------------------------------------------------------------------------
# The finite exponents, integers, at K = 40n — a second route that shares no expression with the
# limit functions above. L_p = v_p(S_K) + gamma_p^out, the third branch of (60) / (5.1).
# ---------------------------------------------------------------------------------------------------
def legendre_sum(m, p):
    s, q = 0, p
    while q <= m:
        s += m // q
        q *= p
    return s


def sum_floor_2i(h, p):
    """sum_{i=1}^{h-1} sum_{a>=1} floor(2i / p^a), by counting, for each p^a, the i with 2i >= j p^a."""
    s, q = 0, p
    while q <= 2 * (h - 1):
        j = 1
        while j * q <= 2 * (h - 1):
            s += (h - 1) - (-(-j * q // 2)) + 1          # #{i : ceil(jq/2) <= i <= h-1}
            j += 1
        q *= p
    return s


def vp_S(K, N, h, p, c_N, prime=True):
    """(62) / (5.3): v_p(S_K) = 2h sum floor(K/p^a) - c_N h sum floor(N/p^a) - 2 sum sum floor(2i/p^a)
    + (h-1) v_p(4). For p > K/3 every p^a with a >= 2 exceeds 2h, so only a = 1 contributes."""
    v4 = 2 if p == 2 else 0
    return 2 * h * legendre_sum(K, p) - c_N * h * legendre_sum(N, p) - 2 * sum_floor_2i(h, p) + (h - 1) * v4


def anand_gamma_out(K, N, h, p):
    if p > K:
        return 0                                                     # §5.1
    v = K - p * (K // p)
    u = max(0, N + v - p + 1)
    t = min(N, v) + u                                                # (58)
    r = min(h, max(0, K + 6 * N - 3 * p + 4))                        # (54)
    if K < 2 * p:
        return -9 * (K - p) + 8 * t - 1 - min(r, p - 1 - N + u)      # (59)
    return -9 * (K - p) + 3 + 16 * N + 7 * t - min(r, p + u)         # (59)


def fauzan_gamma_out(K, N, h, p):
    if p > K:
        return 0
    v = K - p * (K // p)
    u = max(0, N + v - p + 1)
    t = min(N, v) + u
    r = max(0, K + 4 * N - 2 * p + 2)                                # (4.10)
    if K < 2 * p:
        return -7 * (K - p) + 6 * t - 1 - min(r, p - 1 - N + u)      # (4.14)
    return -7 * (K - p) + 3 + 12 * N + 5 * t - min(r, p + u)         # (4.14)


def anand_Lp(n, p):
    K, N, h = 40 * n, 3 * n, 37 * n
    return vp_S(K, N, h, p, 16) + anand_gamma_out(K, N, h, p)


def fauzan_Lp(n, p):
    K, N, h = 40 * n, 3 * n, 37 * n
    return vp_S(K, N, h, p, 12) + fauzan_gamma_out(K, N, h, p)


# ---------------------------------------------------------------------------------------------------
# Printed values, copied from the PDFs.
# ---------------------------------------------------------------------------------------------------
# Anand, Table 5: "Affine pieces of the outer integrand T(y) = b + cy" (page 39), all nine rows.
ANAND_TABLE5 = [
    (Q(1, 3), Q(37, 100), Q(-75, 8), Q(8)),
    (Q(37, 100), Q(37, 80), Q(-99, 8), Q(16)),
    (Q(37, 80), Q(29, 60), Q(-569, 40), Q(20)),
    (Q(29, 60), Q(1, 2), Q(-569, 40), Q(20)),
    (Q(1, 2), Q(37, 60), Q(-107, 10), Q(9)),
    (Q(37, 60), Q(37, 40), Q(-251, 20), Q(12)),
    (Q(37, 40), Q(77, 80), Q(-72, 5), Q(14)),
    (Q(77, 80), Q(1), Q(1), Q(-2)),
    (Q(1), Q(37, 20), Q(-239, 20), Q(-2)),
]
# Fauzan, Table 4: "The affine pieces of the outer integrand" (page 28), all eleven rows.
FAUZAN_TABLE4 = [
    (Q(1, 3), Q(43, 120), Q(279, 40), Q(-9)),
    (Q(43, 120), Q(37, 100), Q(451, 40), Q(-21)),
    (Q(37, 100), Q(13, 30), Q(377, 40), Q(-16)),
    (Q(13, 30), Q(37, 80), Q(429, 40), Q(-19)),
    (Q(37, 80), Q(1, 2), Q(17, 4), Q(-5)),
    (Q(1, 2), Q(43, 80), Q(51, 10), Q(-3)),
    (Q(43, 80), Q(37, 60), Q(231, 20), Q(-15)),
    (Q(37, 60), Q(13, 20), Q(97, 10), Q(-12)),
    (Q(13, 20), Q(37, 40), Q(42, 5), Q(-10)),
    (Q(37, 40), Q(1), Q(1), Q(-2)),
    (Q(1), Q(37, 20), Q(37, 20), Q(-1)),
]

ANAND = {
    'A0': Q(9928298118277006344769, 7535670527041937280000),                       # (87)
    'Iout': Q(-11002997, 720000),                                                   # (122)
    'inner': Q(120667538150827615739401, 708353029541942104320000),                 # (121)
    'B0_decimal': '-13.7940839161',                                                 # A.3
    'A200': Q(-18734377106657057108806567, 1362217364503734816000000),              # B.1 / A.3
    'A100000': Q(-293600425556506260201513776490439, 21284646320370856500000000000000),
    'U': Q(44, 25),                                                                 # (96)
    'M0': Q(-109, 20),                                                              # (94)
    'P_mean': Q(11729, 720), 'C_bound': Q(22), 'Q_hi': Q(27, 8), 'Q_lo': Q(-1, 2),  # (84), (83)
    'tailT': 20,
    'claim118': -11, 'claim119': -12,
    'abstract_rate': -19000, 'degree_per_n': 37,
    'I_rho_decimal': '-3.143325089379538', 'Cstar_decimal': '3.649335128751705', 'sum_decimal': '1.751410218131243',
}

FAUZAN = {
    'Iout': Q(127751, 96000),                                                       # (5.10)
    'inner': Q(322437603634266857629, 7535670527041937280000),                      # (5.18)
    'tail': Q(-2689, 48000),                                                        # (5.16)
    'Astar': Q(9928298118277006344769, 7535670527041937280000),                     # (5.19)
    'A200': Q(127125602969131786927559, 94195881588024216000000),                   # B.3
    'U': Q(-2733991, 2000000),                                                      # (6.4), B.3
    'P_mean': Q(2923, 240), 'C_bound': Q(16), 'Q_hi': Q(13, 8), 'Q_lo': Q(-1, 2),   # (5.14), §5.3
    'abstract_rate': Q(-139, 5),
}


def anand_AM(M, A0, Iout, inner):
    """(88)-(89): A_M = A0 + I_out + int_3^20 R/x^3 + 9 lambda/M - 11549/(720 M^2) + 44/M^3."""
    M = Q(M)
    return A0 + Iout + inner + 9 * LAM / M - Q(11549, 720) / M ** 2 + 44 / M ** 3


def fauzan_AM(M, Astar):
    """(5.20): A_M = A* + 7 lambda/M - (2923/240 - 1/4)/M^2 + 32/M^3."""
    M = Q(M)
    return Astar + 7 * LAM / M - (Q(2923, 240) - Q(1, 4)) / M ** 2 + 32 / M ** 3


def tail_bound_85(T, lam_coef, P_T, P_mean, C_T, C_bound, Q_hi):
    """Upper bound for int_T^inf R/x^3 from the integration-by-parts identity (85)/(5.15):
       -lambda/T - P(T)/T^2 + Pbar/T^2 - 2C(T)/T^3 + 6 int C/x^4 + int Q/x^3,
    with |C| <= C_bound and Q <= Q_hi, so 6 int_T C/x^4 <= 2 C_bound/T^3 and int_T Q/x^3 <= Q_hi/(2T^2)."""
    T = Q(T)
    return -lam_coef / T - P_T / T ** 2 + P_mean / T ** 2 - 2 * C_T / T ** 3 + 2 * C_bound / T ** 3 + Q_hi / (2 * T ** 2)


def frac(x):
    x = Q(x)
    return x - (x.numerator // x.denominator)


def anand_P(x):
    """(84): P(x) = -lambda f(1-f) + (296/3) g(1-g), f = {x}, g = {alpha x}."""
    f, g = frac(x), frac(ALPHA * Q(x))
    return -LAM * f * (1 - f) + Q(296, 3) * g * (1 - g)


def anand_C(x):
    """(84): C(x) = -(37/240) G(f) + (5920/27) G(g), G(v) = v(1-v)(2v-1)."""
    G = lambda v: v * (1 - v) * (2 * v - 1)
    f, g = frac(x), frac(ALPHA * Q(x))
    return -Q(37, 240) * G(f) + Q(5920, 27) * G(g)


def fauzan_P(x):
    f, g = frac(x), frac(ALPHA * Q(x))
    return 74 * g * (1 - g) - LAM * f * (1 - f)
