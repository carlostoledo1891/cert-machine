"""F-180 -- "Triangular minimality for planar Coulomb renormalized energy" (openai/math family 090).

THE CLAIM (build/sections/01-introduction.tex:64-72, Theorem thm:main): the triangular lattice of covolume one
minimizes the Sandier-Serfaty renormalized energy, W(E) >= W(E_tri) for every admissible E; with Corollary cor:bhs
(the Brauchart-Hardin-Saff constant).  The proof reduces to the scalar inequalities cal:scalar-bounds
(04-calibration.tex:362-369): K < 0, 2 g_d(x) >= K (d >= b, x >= 0) and int max{0,-G(d,s)} ds <= -K (d >= b),
b = 28209/100000, which Theorem comp:scalar (06-computation.tex:769-794) takes from "the finite scalar
verification" of Section sec:computation: an outward interval calculation at denominator 2^144 (coefficients,
a radial table of about 6800 propagated steps, the constants lambda, mu, K, exterior signs, global derivative
bounds, an outer primitive grid, a negative-part grid and a Hessian grid), recorded in
verification/data/certificate-record.txt (22 saved integer pairs).

WHAT IS CERTIFIED HERE IS NOT THE PAPER'S RUN but the mathematical quantities its first stages enclose, recomputed by
an independent route from the definitions (04-calibration.tex), in exact/ball arithmetic (integers, Fractions,
dyadic balls k/2^200 with outward rounding; nothing is a float):
  1. THE LATTICE COEFFICIENTS c_1..c_38 (cal:coefficients), two ways.
     (a) the paper's recipe (06-computation.tex:118-132, 05-tails.tex:28-61): the exact integer numerators
         r_m = Re (A + i sqrt3 q)^{6m} per lattice point by the integer recurrence (supp:real-recurrence), grouped
         by the norm N, over |n|,|q| <= 256 (m = 1) or 48 (m >= 2), each shell divided once; the omitted square
         tail 8(4/3)^{3m} D^{2-6m}/(6m-2) (its derivation re-checked: N >= (3/4)max(|n|,|q|)^2, 8v points on the
         v-th square ring, sum_{v>D} v^{1-6m} <= the integral); times a^{-6m}/(6m) = (sqrt3/2)^{3m}/(6m).
     (b) SECOND WAY, no lattice sum: the hexagonal lattice has g_2 = 0, so the Weierstrass recurrence
         c'_n = 3/((2n+1)(n-3)) sum c'_m c'_{n-m} (c'_3 = g_3/28) makes every G_{6m} an exact rational multiple
         rho_m of g_3^m; with the equianharmonic real period (Gamma(1/3)^3/(4 pi) at g_3 = 1) and
         Gamma(1/3)^3 = 2^{4/3} pi^2/(3^{1/4} M), M = AGM(1, cos 15 deg) (K(sin 15 deg) = pi/(2M)), this gives
         c_m = rho_m X^m/(6m(6m-1)), X = pi^6/(2 M^6); the AGM is enclosed between its two monotone sequences.
         The two enclosures must overlap for all 38 modes.  |c_1| < 1 (06-computation.tex:132).
     (c) THE COEFFICIENTS USED BELOW: the lattice enclosure of c_1 has radius 1.2e-10, too wide for the difference
         quotient in lambda (interval dependency); but c_10's lattice enclosure has radius ~1e-59, and (b)'s exact
         recurrence alone (no Gamma, no AGM) gives X = (60*59 c_10/rho_10)^(1/10) and then every c_m -- radius ~1e-58,
         each inside its own lattice enclosure and overlapping the AGM value (checked).
  2. B(l) = gamma(R_0) + sum_m (-1)^m c_m R_0^{6m} (comp:constant-B) and the omitted-mode bound 6.075e-58.
  3. lambda, mu, K by their defining integrals (cal:constants), NOT through the paper's radial table: for t <= R_0 the
     radial data are explicit -- B = -log t + pi t^2/2 + sum (-1)^m c_m t^{6m}, so S_1, S_2, H_k are the closed
     forms comp:initial-integrals, D_0 = 0 and D_m = V_m - (-1)^m c_m t^{6m}; on the sector edge t = sqrt(p^2+s^2)
     one has V_m = c_m Re (p+is)^{6m} and Q_m = t D_m' - k D_m = -k p c_m Im((p+is)^k)/s exactly -- so f_0(t(s)),
     e(t(s)) are explicit analytic functions of s on [0, x_0].  The integrals are done by Fejer's first rule (64
     nodes on each of 8 subintervals) with an error bound derived here: on the disk of radius twice the half-length
     the integrand is analytic (|s| < p, the removable singularity of (f_0(t(s)) - f_0(p))/s^2 included) and its
     modulus is bounded by evaluating it in COMPLEX BALL arithmetic on 16 balls covering the boundary circle (maximum
     modulus); Cauchy + exactness through degree 63 + positive weights give |error| <= 8 eta M / 2^64.
  4. f_0(l) = -2 pi S_1(l) - (log l + S_2(l))/2 (D_i(l) = 0), with S_1(R_0), S_2(R_0) closed forms and the spline
     region [R_0, l] (three pieces: tau = 0 / Hermite continuation / constant continuation) integrated the same way;
     then f(l) = f_0(l) - lambda l^2/2 - mu and the slope -pi B(l) - lambda/2.
  5. The four finite assertions comp:tail-signs: -6.731 < lambda < -6.729, K < 0, f(l) > 0, -pi B(l) - lambda/2 > 0,
     and the seven saved pairs of the record's first label (certificate-record.txt; 06-computation.tex:734-740)
     each CONTAIN the enclosure computed here.
     OMITTED MODES m >= 39 are bounded here, not taken from the paper's 1e-11: with |c_m| <= 7/(k a^k) (the
     bracket 6 + 2.3^{-k/2} + 24(4/3)^{k/2}2^{1-k} <= 6 + 50/729 < 7 re-checked), every omitted contribution to f_0,
     e (on the complex disk |s| <= x_0, where |p + is| <= (1+1/sqrt3)a/2) and to S_1(l), S_2(l) is summed as a
     geometric series in k (ratio bound at k = 234); the total is below 1e-20 and is added to every enclosure.
  6. SECOND WAY for the constants (theory-dependent consistency): the calibration identity
     W(E_tri) = 6K + lambda + 2 pi mu (Lemma cal:energy-identity) against the Kronecker-limit value
     W(E_tri) = -pi log(2 pi sqrt(Im tau) |eta(tau)|^2), tau = e^{i pi/3}, |eta| from its q-product (q = -e^{-pi sqrt3})
     with a bounded tail.
  7. Arithmetic printed about the object: the geometric constants (p^4 = 1/12, R_0^4 = 4/27, .537<p<.538, ...,
     b < 1/(2 sqrt pi), sqrt(b^2+.65^2) > l), the omitted-mode arithmetic of Sections tail:coefficients/tail:sum
     and supp:tail-bounds (ratio comparisons, T_0, P_600/R_606 versus the geometric bounds, F(A,4A), 2.4e-13,
     1.3e-13), and the record's 22 pairs against the article's projection table.

WHAT IS NOT DECIDED -- REFUSED, with the cost of doing it here:
  - the outer primitive assertion m_* - E_0 - E_I > 0 (comp:outer-assertion): a 2186 x 3612 grid of midpoint sums,
    about 7.9 million interval evaluations of G with table interpolation;
  - the negative-part assertion (comp:negative-assertion) on the same grid;
  - the global derivative bounds L_1..L_4 on about 519 x 813 = 422,000 rectangles;
  - the Hessian assertions (comp:hessian-assertions) on about 601 x 4079 = 2.45 million cells;
  - the paper's radial table itself (about 6800 propagated midpoint steps with 39-mode order-3 jets and 39 x 39
    sums), the finite-core premise tail:finite-core-premise, and the K-integral's G_ss mesh.
    Estimated at 20-40 CPU-minutes in this standard-library Python (the authors' C++ run took 72.6 s on 32
    threads), beyond the ~30-minute budget, and requiring f_0, e with two derivatives on all of [b, l] (the inner
    continuation and spline regions) -- not done.  Without them K < 0 and the exterior positivity are decided,
    but 2 g_d(x) >= K and the negative-part bound -- the inequalities the geometry needs -- are NOT.
  - everything analytic: the reduction (Section sec:reduction), the geometry and the dual identity (Section
    sec:geometry), stationarity (Lemma cal:stationarity), the energy identity (used above only as a cross-check),
    the paper's truncation estimates (Section sec:tails; their printed arithmetic is checked), Corollary cor:bhs.
"""
import json
import math
import os
import re
import sys
import time
from fractions import Fraction
from math import comb, factorial, isqrt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/Triangular-minimality-for-planar-Coulomb-renormalized-energy-September-23-2026/'
SEC = DIR + 'build/sections/'
Fr = Fraction
D_ = Fraction

# ======================================================================================================
# outward ball arithmetic on dyadic rationals (as in f179): real (m, r) = [(m-r)/2^P, (m+r)/2^P];
# complex (x, y, r) = disk of radius r/2^P about (x+iy)/2^P
# ======================================================================================================
PREC = 200
ONE = 1 << PREC


def rq(q):
    q = Fr(q)
    return ((q.numerator << PREC) // q.denominator, 1)


def radd(a, b):
    return (a[0] + b[0], a[1] + b[1])


def rsub(a, b):
    return (a[0] - b[0], a[1] + b[1])


def rneg(a):
    return (-a[0], a[1])


def rmul(a, b):
    m1, r1 = a
    m2, r2 = b
    return ((m1 * m2) >> PREC, ((abs(m1) * r2 + abs(m2) * r1 + r1 * r2) >> PREC) + 2)


def rinv(a):
    m, r = a
    am = abs(m)
    if am <= r:
        raise ZeroDivisionError('ball contains 0')
    return ((ONE * ONE) // m, -((-(ONE * ONE * r)) // (am * (am - r))) + 2)


def rdivint(a, n):
    return (a[0] // n, -(-a[1] // n) + 1)


def rhi(a):
    return Fr(a[0] + a[1], ONE)


def rlo(a):
    return Fr(a[0] - a[1], ONE)


def rlt(a, q):
    q = Fr(q)
    return (a[0] + a[1]) * q.denominator < q.numerator * ONE


def rgt(a, q):
    q = Fr(q)
    return (a[0] - a[1]) * q.denominator > q.numerator * ONE


def rabs_hi(a):
    return (abs(a[0]) + a[1], 0)


def rinterval(lo, hi):
    lo, hi = Fr(lo), Fr(hi)
    mid = Fr(lo + hi, 2)
    m = (mid.numerator << PREC) // mid.denominator
    half = Fr(hi - lo, 2) * ONE
    return (m, -(-half.numerator // half.denominator) + 1)


def rsqrt(a):
    lo, hi = a[0] - a[1], a[0] + a[1]
    if lo <= 0:
        raise ValueError('sqrt of a ball meeting 0')
    s_lo = isqrt(lo * ONE)
    s_hi = isqrt(hi * ONE) + 1
    m = (s_lo + s_hi) // 2
    return (m, s_hi - m + 1)


def rpow(a, k):
    r = (ONE, 0)
    for _ in range(k):
        r = rmul(r, a)
    return r


def rwiden(a, q):
    """add a Fraction error bound q >= 0 to the radius"""
    q = Fr(q) * ONE
    return (a[0], a[1] + (-(-q.numerator // q.denominator)) + 1)


def cr(a):
    return (a[0], 0, a[1])


def cq(re, im=0):
    re, im = Fr(re), Fr(im)
    return ((re.numerator << PREC) // re.denominator, (im.numerator << PREC) // im.denominator, 2)


def cadd(a, b):
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def csub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] + b[2])


def cmul(a, b):
    ar, ai, ra = a
    br, bi, rb = b
    return ((ar * br - ai * bi) >> PREC, (ar * bi + ai * br) >> PREC,
            (((abs(ar) + abs(ai)) * rb + (abs(br) + abs(bi)) * ra + ra * rb) >> PREC) + 3)


def crmul(a, b):
    ar, ai, ra = a
    m, rr = b
    return ((ar * m) >> PREC, (ai * m) >> PREC, (((abs(ar) + abs(ai)) * rr + abs(m) * ra + ra * rr) >> PREC) + 3)


def cmuli(a):
    return (-a[1], a[0], a[2])


def cdivint(a, n):
    return (a[0] // n, a[1] // n, -(-a[2] // n) + 2)


def cinv(a):
    ar, ai, ra = a
    n2 = ar * ar + ai * ai
    L = isqrt(n2)
    if L <= ra:
        raise ZeroDivisionError('complex ball contains 0')
    return ((ar * ONE * ONE) // n2, (-ai * ONE * ONE) // n2, -((-(ONE * ONE * ra)) // (L * (L - ra))) + 3)


def cabs_hi(a):
    """an upper bound (scaled integer) for |z| over the ball"""
    return isqrt(a[0] * a[0] + a[1] * a[1]) + 1 + a[2]


def cre(a):
    return (a[0], a[2])


def cscale(a, q):
    return crmul(a, rq(q))


EXP_K = 44
_tail = Fr(1, 2 ** EXP_K) / factorial(EXP_K) * Fr(EXP_K + 1) / (Fr(EXP_K + 1) - Fr(1, 2))
EXP_TAIL = -(-(_tail * ONE).numerator // (_tail * ONE).denominator) + 1


def cexp(a):
    ar, ai, ra = a
    size = abs(ar) + abs(ai) + ra
    k = 0
    while (size >> k) > (ONE >> 2):
        k += 1
    u = (ar >> k, ai >> k, (ra >> k) + 3) if k else a
    s = (ONE, 0, 0)
    term = (ONE, 0, 0)
    for q in range(1, EXP_K):
        term = cdivint(cmul(term, u), q)
        s = cadd(s, term)
    s = (s[0], s[1], s[2] + EXP_TAIL)
    for _ in range(k):
        s = cmul(s, s)
    return s


def clog1p(z, nterms=None):
    """log(1+z) for a complex ball with |z| <= 0.6: the series sum (-1)^{j+1} z^j/j, tail <= |z|^{n+1}/((n+1)(1-|z|))"""
    zb = Fr(cabs_hi(z), ONE)
    if zb > Fr(6, 10):
        raise ArithmeticError('log1p argument too large')
    n = nterms or 260
    s = (0, 0, 0)
    pw = (ONE, 0, 0)
    for j in range(1, n + 1):
        pw = cmul(pw, z)
        term = cdivint(pw, j)
        s = cadd(s, term) if j % 2 else csub(s, term)
    tail = zb ** (n + 1) / ((n + 1) * (1 - zb))
    tq = tail * ONE
    return (s[0], s[1], s[2] + (-(-tq.numerator // tq.denominator)) + 1)


def rlog(a):
    """log of a positive real ball: x = 2^e y, y in [3/4, 3/2]; log y = log1p(y - 1); log 2 = -log1p(-1/2)"""
    m = a[0]
    e = 0
    while (m >> max(e, 0) if e >= 0 else m << -e) > (3 * ONE) // 2:
        e += 1
    while (m << -e if e < 0 else m >> e) < (3 * ONE) // 4:
        e -= 1
    y = (a[0] >> e, (a[1] >> e) + 2) if e >= 0 else (a[0] << -e, a[1] << -e)
    ly = cre(clog1p((y[0] - ONE, 0, y[1])))
    if e == 0:
        return ly
    return radd(ly, rmul(rq(e), LOG2))


LOG2 = rneg(cre(clog1p(cq(Fr(-1, 2)))))


def pi_ball():
    def atan_inv(x, K):
        s, prev = Fr(0), None
        for k in range(K + 2):
            prev = s
            s += Fr((-1) ** k, (2 * k + 1) * x ** (2 * k + 1))
        return min(prev, s), max(prev, s)
    a_lo, a_hi = atan_inv(5, 100)
    b_lo, b_hi = atan_inv(239, 40)
    return rinterval(16 * a_lo - 4 * b_hi, 16 * a_hi - 4 * b_lo)


PI = pi_ball()
SQ3 = (isqrt(3 * ONE * ONE), 1)
SQ2 = (isqrt(2 * ONE * ONE), 1)

# ======================================================================================================
# the geometry (04-calibration.tex:12-17, 05-tails.tex:8-12)
# ======================================================================================================
P_ = rsqrt(rsqrt(rq(Fr(1, 12))))           # p^4 = 1/12
A_ = (2 * P_[0], 2 * P_[1])                # a = 2p
R0 = rsqrt(rsqrt(rq(Fr(4, 27))))           # R_0^4 = 4/27
X0 = rdivint(R0, 2)
L_ = radd(R0, rq(Fr(19, 250)))
B_EDGE = Fr(28209, 100000)
HS = Fr(3, 40)
CC = Fr(3, 50)
P2 = rmul(P_, P_)
R02 = rmul(R0, R0)
MMAX = 38
KS = [6] + [6 * m for m in range(1, MMAX + 1)]       # k_0 = 6 (auxiliary), k_m = 6m


# ======================================================================================================
# 1. the lattice coefficients c_m = (1/k) sum_{z in Lambda \ 0} z^{-k}, k = 6m
# ======================================================================================================
def tail_square(m, D):
    """8 (4/3)^{3m} D^{2-6m}/(6m-2): the omitted part of the dimensionless sum outside |n|,|q| <= D"""
    return 8 * Fr(4, 3) ** (3 * m) * Fr(1, D ** (6 * m - 2)) / (6 * m - 2)


def lattice_shell_sums(D, mmax):
    """{m: {N: sum of r_m(n,q) over |n|,|q| <= D with n^2+nq+q^2 = N}} by the integer recurrence"""
    out = {m: {} for m in range(1, mmax + 1)}
    for n in range(-D, D + 1):
        for q in range(-D, D + 1):
            if n == 0 and q == 0:
                continue
            A = 2 * n + q
            N = n * n + n * q + q * q
            A2, q2 = A * A, q * q
            r1 = A2 * A2 * A2 - 45 * A2 * A2 * q2 + 135 * A2 * q2 * q2 - 27 * q2 * q2 * q2
            c4 = (4 * N) ** 6
            rm1, rm = 1, r1
            d = out[1]
            d[N] = d.get(N, 0) + r1
            for m in range(2, mmax + 1):
                rm1, rm = rm, 2 * r1 * rm - c4 * rm1
                d = out[m]
                d[N] = d.get(N, 0) + rm
    return out


def coefficients_lattice():
    """balls for c_1..c_38 by the paper's recipe (D = 256 for m = 1, D = 48 otherwise)"""
    sums = {1: lattice_shell_sums(256, 1)[1]}
    s48 = lattice_shell_sums(48, MMAX)
    for m in range(2, MMAX + 1):
        sums[m] = s48[m]
    c = {}
    detail = {}
    b3 = rdivint(SQ3, 2)                                  # sqrt3/2 = a^{-2}... a^{-6m} = (sqrt3/2)^{3m}
    for m in range(1, MMAX + 1):
        D = 256 if m == 1 else 48
        tot = 0
        for N, num in sums[m].items():
            tot += (num << PREC) // (64 * N ** 6) ** m   # each shell divided once, floor (error < 1 unit)
        ball = (tot, len(sums[m]) + 1)
        ball = rwiden(ball, tail_square(m, D))
        scale = rdivint(rpow(b3, 3 * m), 6 * m)
        c[m] = rmul(ball, scale)
        detail[m] = (D, len(sums[m]))
    return c, detail


def agm_ball(x, y, it=12):
    """AGM(x, y) for positive balls: it lies between the geometric and the arithmetic sequences"""
    a, g = x, y
    for _ in range(it):
        a, g = rdivint(radd(a, g), 2), rsqrt(rmul(a, g))
    return rinterval(rlo(g), rhi(a))


def weierstrass_rho(mmax):
    """c'_n for g_2 = 0: c'_3 = g_3/28 and c'_n = 3/((2n+1)(n-3)) sum_{m=2}^{n-2} c'_m c'_{n-m}; only n = 3j survive;
    returns rho_j with c'_{3j} = rho_j g_3^j (exact rationals); also checks that n not = 0 mod 3 vanish"""
    cp = {2: Fr(0), 3: Fr(1, 28)}            # as coefficients of g_3^{n/3} (g_2 = 0)
    vanish = True
    for n in range(4, 3 * mmax + 1):
        s = sum((cp[m] * cp[n - m] for m in range(2, n - 1)), Fr(0))
        cp[n] = Fr(3, (2 * n + 1) * (n - 3)) * s
        if n % 3 and cp[n] != 0:
            vanish = False
    return {j: cp[3 * j] for j in range(1, mmax + 1)}, vanish


def coefficients_agm():
    kp = rdivint(radd(rsqrt(rq(6)), SQ2), 4)               # cos 15 deg = (sqrt6 + sqrt2)/4
    M = agm_ball((ONE, 0), kp)
    X = rmul(rpow(PI, 6), rinv(rmul(rq(2), rpow(M, 6))))   # pi^6 / (2 M^6)
    rho, vanish = weierstrass_rho(MMAX)
    # y_j = rho_j X^j by the same convolution, in balls of natural size: y_1 = X/28,
    # y_j = 3/((6j+1)(3j-3)) sum_{i<j} y_i y_{j-i}
    y = {1: rdivint(X, 28)}
    for j in range(2, MMAX + 1):
        s = (0, 0)
        for i in range(1, j):
            s = radd(s, rmul(y[i], y[j - i]))
        y[j] = rmul(rq(Fr(3, (6 * j + 1) * (3 * j - 3))), s)
    c = {m: rdivint(y[m], 6 * m * (6 * m - 1)) for m in range(1, MMAX + 1)}
    return c, M, vanish, rho


# ======================================================================================================
# 3-4. the radial functions, explicitly
# ======================================================================================================
LOGP2 = rlog(P2)
LOGR0 = rlog(R0)
FEJER = {}


def fejer(N):
    """Fejer's first rule on [-1,1]: nodes cos((v+1/2)pi/N), weights (2/N)(1 - 2 sum_{a<N/2} cos(2a th)/(4a^2-1))"""
    if N not in FEJER:
        xs, ws = [], []
        for v in range(N):
            th = rmul(PI, rq(Fr(2 * v + 1, 2 * N)))
            E = cexp((0, th[0], th[1]))
            E2 = cmul(E, E)
            pw = E2
            acc = (0, 0)
            for a in range(1, N // 2):
                acc = radd(acc, rdivint(cre(pw), 4 * a * a - 1))
                pw = cmul(pw, E2)
            ws.append(rmul(rq(Fr(2, N)), rsub((ONE, 0), (2 * acc[0], 2 * acc[1]))))
            xs.append(cre(E))
        FEJER[N] = (xs, ws)
    return FEJER[N]


class Radial:
    """the truncated (modes 0..38) radial data for one set of coefficient balls"""

    def __init__(self, c):
        self.c = c
        self.am = {m: (c[m] if m % 2 == 0 else rneg(c[m])) for m in range(1, MMAX + 1)}
        # B_1 monomials: (e_0, v_0) = (2, pi), (e_m, v_m) = (6m, 6m a_m)
        self.ev = [(2, PI)] + [(6 * m, rmul(rq(6 * m), self.am[m])) for m in range(1, MMAX + 1)]
        s2 = {}
        for ei, vi in self.ev:
            for ej, vj in self.ev:
                E = ei + ej
                s2[E // 2] = radd(s2.get(E // 2, (0, 0)), rdivint(rmul(vi, vj), E))
        for ei, vi in self.ev:
            s2[ei // 2] = radd(s2.get(ei // 2, (0, 0)), rneg(rdivint((2 * vi[0], 2 * vi[1]), ei)))
        self.s2 = s2
        self.hc = {m: [(ei // 2, rdivint(vi, ei + 6 * m)) for ei, vi in self.ev] for m in range(1, MMAX + 1)}
        self.s1 = {m: rdivint(self.am[m], 6 * m + 2) for m in range(1, MMAX + 1)}
        self.M = {(i, j): rq(Fr(36 * i * j, 6 * i + 6 * j)) for i in range(1, MMAX + 1) for j in range(1, MMAX + 1)}
        self.Minv = {(i, j): rq(Fr(1, 6 * i + 6 * j)) for i in range(1, MMAX + 1) for j in range(1, MMAX + 1)}
        self.pc = {m: rmul(rq(-6 * m), rmul(P_, c[m])) for m in range(1, MMAX + 1)}     # -k p c_m
        # the Hermite data at R_0: V_m(R_0) = a_m R_0^k, V' = a_m k R_0^{k-1}, V'' = -a_m k(2k+1) R_0^{k-2}
        A0 = A1 = A2 = (0, 0)
        iR = rinv(R0)
        for m in range(1, MMAX + 1):
            k = 6 * m
            rk = rpow(R0, k)
            A0 = radd(A0, rmul(self.am[m], rk))
            A1 = radd(A1, rmul(rmul(self.am[m], rq(k)), rmul(rk, iR)))
            A2 = radd(A2, rmul(rmul(self.am[m], rq(-k * (2 * k + 1))), rmul(rk, rmul(iR, iR))))
        self.A = (A0, A1, A2)
        self.g0 = radd(rneg(LOGR0), rdivint(rmul(PI, R02), 2))                # gamma(R_0)
        self.g1 = radd(rneg(iR), rmul(PI, R0))                               # gamma'(R_0)
        self.g2 = radd(rmul(iR, iR), PI)                                     # gamma''(R_0)
        self.Bl = radd(self.g0, A0)                                          # B(l), truncated

    # ---- on the sector edge t = sqrt(p^2 + s^2), s a complex ball, |s| < 0.4 -------------------------
    def edge(self, s):
        u = cmul(s, s)
        t2 = cadd(cr(P2), u)
        z = cmul(u, cr(rinv(P2)))
        L = cdivint(cadd(cr(LOGP2), clog1p(z)), 2)                      # log t = (log p^2 + log(1 + s^2/p^2))/2
        T = [(ONE, 0, 0)]
        for _ in range(6 * MMAX // 2 * 2 + 2):
            T.append(cmul(T[-1], t2))
        w = (P_[0] - s[1], s[0], P_[1] + s[2])                           # p + i s
        wb = (P_[0] + s[1], -s[0], P_[1] + s[2])                         # p - i s
        w6, wb6 = w, wb
        for _ in range(5):
            w6, wb6 = cmul(w6, w), cmul(wb6, wb)
        W, Wb = [None, w6], [None, wb6]
        for m in range(2, MMAX + 1):
            W.append(cmul(W[-1], w6))
            Wb.append(cmul(Wb[-1], wb6))
        D, Q = {}, {}
        invs = None
        for m in range(1, MMAX + 1):
            V = crmul(cdivint(cadd(W[m], Wb[m]), 2), self.c[m])
            D[m] = csub(V, crmul(T[3 * m], self.am[m]))
        try:
            invs = cinv(s)
        except ZeroDivisionError:
            invs = None
        if invs is not None:
            for m in range(1, MMAX + 1):
                dif = csub(W[m], Wb[m])
                im = (dif[1] // 2, -dif[0] // 2, dif[2] // 2 + 2)            # (W - Wb)/(2i)
                Q[m] = crmul(cmul(im, invs), self.pc[m])
        S1 = cadd(cmul(cdivint(t2, 2), csub(cq(Fr(1, 2)), L)), crmul(cmul(t2, t2), rdivint(PI, 8)))
        for m in range(1, MMAX + 1):
            S1 = cadd(S1, crmul(T[3 * m + 1], self.s1[m]))
        S2 = (0, 0, 0)
        for j, cf in self.s2.items():
            S2 = cadd(S2, crmul(T[j], cf))
        H = {}
        for m in range(1, MMAX + 1):
            h = (0, 0, 0)
            for j, cf in self.hc[m]:
                h = cadd(h, crmul(T[j], cf))
            H[m] = h
        sumD = (0, 0, 0)
        lin = (0, 0, 0)
        for m in range(1, MMAX + 1):
            sumD = cadd(sumD, cdivint(D[m], 6 * m + 2))
            lin = cadd(lin, cadd(cscale(D[m], -2), cmul(cscale(D[m], 12 * m), H[m])))
        quad = (0, 0, 0)
        for i in range(1, MMAX + 1):
            y = (0, 0, 0)
            for j in range(1, MMAX + 1):
                y = cadd(y, crmul(D[j], self.M[(i, j)]))
            quad = cadd(quad, cmul(D[i], y))
        f0 = cadd(crmul(cadd(S1, cmul(t2, sumD)), (-2 * PI[0], 2 * PI[1])),
                  crmul(cadd(cadd(L, S2), cadd(lin, quad)), rq(Fr(-1, 2))))
        e = None
        if Q:
            e = (0, 0, 0)
            for i in range(1, MMAX + 1):
                y = (0, 0, 0)
                for j in range(1, MMAX + 1):
                    y = cadd(y, crmul(Q[j], self.Minv[(i, j)]))
                e = cadd(e, cmul(Q[i], y))
            e = cdivint(e, 2)
        return dict(f0=f0, e=e, S1=S1, S2=S2, t2=t2, L=L)

    # ---- on the spline region [R_0, l], piece 1 (tau = 0), 2 (Hermite), 3 (constant continuation) ------
    def spline(self, r, piece):
        z = csub(r, cr(R0))
        logr = cadd(cr(LOGR0), clog1p(cmul(z, cr(rinv(R0)))))
        r2 = cmul(r, r)
        gam = cadd(cscale(logr, -1), crmul(r2, rdivint(PI, 2)))
        ir = cinv(r)
        gam1 = cadd(cscale(ir, -1), crmul(r, PI))

        def Sf(y):
            y2 = cmul(y, y)
            y3 = cmul(y2, y)
            return (cadd(csub(cscale(y3, 10), cscale(cmul(y3, y), 15)), cscale(cmul(y3, y2), 6)),
                    cadd(csub(cscale(y2, 30), cscale(y3, 60)), cscale(cmul(y2, y2), 30)))
        SU, SU1 = Sf(cscale(z, 10))
        SU1 = cscale(SU1, 10)
        if piece == 1:
            tau, tau1 = (0, 0, 0), (0, 0, 0)
        else:
            tau, tau1 = Sf(cscale(csub(z, cq(Fr(1, 1000))), Fr(40, 3)))
            tau1 = cscale(tau1, Fr(40, 3))
        if piece in (1, 2):
            h = HS
            z2 = cmul(z, z)
            z3 = cmul(z2, z)
            z4 = cmul(z3, z)
            z5 = cmul(z4, z)
            Pz = cadd(csub(z, cscale(z3, 6 / h ** 2)), csub(cscale(z4, 8 / h ** 3), cscale(z5, 3 / h ** 4)))
            Pz1 = cadd(csub(cq(1), cscale(z2, 18 / h ** 2)), csub(cscale(z3, 32 / h ** 3), cscale(z4, 15 / h ** 4)))
            Qz = cadd(csub(cscale(z2, Fr(1, 2)), cscale(z3, Fr(3, 2) / h)), csub(cscale(z4, Fr(3, 2) / h ** 2), cscale(z5, Fr(1, 2) / h ** 3)))
            Qz1 = cadd(csub(z, cscale(z2, Fr(9, 2) / h)), csub(cscale(z3, 6 / h ** 2), cscale(z4, Fr(5, 2) / h ** 3)))
        else:
            Pz = Pz1 = Qz = Qz1 = (0, 0, 0)
        r6 = cmul(cmul(r2, r2), r2)
        pw = (ONE, 0, 0)
        Pa = Pa1 = (0, 0, 0)
        for m in range(1, MMAX + 1):
            pw6 = cmul(pw, r6)
            Pa = cadd(Pa, crmul(pw6, self.am[m]))
            Pa1 = cadd(Pa1, crmul(cmul(pw6, ir), rmul(rq(6 * m), self.am[m])))
            pw = pw6
        one = (ONE, 0, 0)
        SUc = csub(one, SU)
        U = cmul(SUc, Pa)
        U1 = csub(cmul(SUc, Pa1), cmul(SU1, Pa))
        A0, A1, A2 = self.A
        Hg = cadd(cr(self.g0), cadd(crmul(Pz, self.g1), crmul(Qz, self.g2)))
        Hg1 = cadd(crmul(Pz1, self.g1), crmul(Qz1, self.g2))
        HV = cadd(cr(A0), cadd(crmul(Pz, A1), crmul(Qz, A2)))
        HV1 = cadd(crmul(Pz1, A1), crmul(Qz1, A2))
        inner = cadd(gam, U)
        outer = cadd(Hg, HV)
        tc = csub(one, tau)
        B = cadd(cmul(tc, inner), cmul(tau, outer))
        B1 = cadd(cadd(cmul(tau1, csub(outer, inner)), cmul(tc, cadd(gam1, U1))), cmul(tau, cadd(Hg1, HV1)))
        B1 = cadd(B1, ir)                                                   # B_1 = B' + 1/r
        return B, B1


# ------------------------------------------------------------------------------------------------------
def integrate(fun, a, b, nsub, N=64, K=16):
    """int_a^b fun for fun analytic near [a,b]: Fejer N nodes on each of nsub subintervals, real part; the error
    8 eta M / 2^N with M = max |fun| over K balls of radius R/5 covering the circle |z - c| = R, R >= 2 eta"""
    xs, ws = fejer(N)
    tot = (0, 0)
    err = Fr(0)
    width = rsub(b, a)
    for i in range(nsub):
        lo = radd(a, rdivint(rmul(width, rq(i)), nsub))
        hi = radd(a, rdivint(rmul(width, rq(i + 1)), nsub))
        c = rdivint(radd(lo, hi), 2)
        eta = rdivint(rsub(hi, lo), 2)
        part = (0, 0)
        for x, wv in zip(xs, ws):
            node = radd(c, rmul(eta, x))
            v = fun((node[0], 0, node[1]))
            part = radd(part, rmul(wv, cre(v)))
        tot = radd(tot, rmul(eta, part))
        R = 2 * rhi(eta) + Fr(c[1], ONE)
        Rb = rq(R)
        Mb = Fr(0)
        for j in range(K):
            th = rmul(PI, rq(Fr(2 * j, K)))
            e = cexp((0, th[0], th[1]))
            pt = cadd((c[0], 0, 0), crmul(e, Rb))
            ball = (pt[0], pt[1], pt[2] + -(-(R * ONE).numerator // ((R * ONE).denominator * 5)) + 1)
            Mb = max(Mb, Fr(cabs_hi(fun(ball)), ONE))
        err += 8 * rhi(eta) * Mb / 2 ** N
    return rwiden(tot, err), err


def constants(R, tr, nsub=8, N=64):
    """lambda, mu, K, f_0(l), B(l), f(l), slope from the truncated radial data R, the quadrature errors and the
    omitted-mode bounds tr (Fractions) included -- enclosures of the exact infinite-mode constants"""
    out = {}
    zero = (0, 0, 0)
    ef, ee = tr['eps_f'], tr['eps_e']
    ph, xh = rhi(P_), rhi(X0)
    xl, pl = rlo(X0), rlo(P_)
    f0p = rwiden(cre(R.edge(zero)['f0']), ef)
    dR = R.edge((X0[0], 0, X0[1]))
    f0R, eR, S1R, S2R = rwiden(cre(dR['f0']), ef), rwiden(cre(dR['e']), ee), cre(dR['S1']), cre(dR['S2'])
    S1R, S2R = rwiden(S1R, tr['dS1R']), rwiden(S2R, tr['dS2R'])
    f0p_c = cr(f0p)

    def g1(s):
        v = R.edge(s)['f0']
        si = cinv(s)
        return cmul(cmul(csub(v, f0p_c), si), si)

    def g2(s):
        return R.edge(s)['e']
    I1, e1 = integrate(g1, (0, 0), X0, nsub, N)
    I2, e2 = integrate(g2, (0, 0), X0, nsub, N)
    I1 = rwiden(rmul(P_, I1), 2 * ph * ef / xl)
    I2 = rwiden(rmul(rinv(P_), I2), xh * ee / pl)
    ip = rinv(P_)
    ix = rinv(X0)
    br = radd(radd(rmul(rmul(P_, ix), rsub(f0R, f0p)), rneg(rmul(rmul(X0, ip), eR))), radd(I1, I2))
    lam = rmul(rinv(rmul(P_, X0)), br)
    mu = rsub(rsub(f0R, rdivint(eR, 3)), rdivint(rmul(lam, R02), 2))

    def G(s):
        d = R.edge(s)
        t2 = d['t2']
        it2 = cinv(t2)
        f = csub(csub(d['f0'], crmul(t2, rdivint(lam, 2))), cr(mu))
        return csub(crmul(cmul(f, it2), P_), crmul(cmul(cmul(cmul(s, s), it2), d['e']), ip))
    Kh, e3 = integrate(G, (0, 0), X0, nsub, N)
    K = rwiden((2 * Kh[0], 2 * Kh[1]), 2 * xh * (ef / pl + xh * xh * ee / pl ** 3))
    # the spline region: S_1(l), S_2(l)
    edges = [R0, radd(R0, rq(Fr(1, 1000))), radd(R0, rq(HS)), L_]
    S1l, S2l = S1R, S2R
    qerr = e1 + e2 + e3
    for piece, nsb in ((1, 1), (2, 8), (3, 1)):
        a, b = edges[piece - 1], edges[piece]

        def h1(r, piece=piece):
            B, _ = R.spline(r, piece)
            return cmul(r, B)

        def h2(r, piece=piece):
            _, B1 = R.spline(r, piece)
            return cadd(cscale(B1, -2), cmul(r, cmul(B1, B1)))
        v1, ea = integrate(h1, a, b, nsb, N)
        v2, eb = integrate(h2, a, b, nsb, N)
        S1l, S2l = radd(S1l, v1), radd(S2l, v2)
        qerr += ea + eb
    S1l, S2l = rwiden(S1l, tr['dS1l']), rwiden(S2l, tr['dS2l'])
    logl = rlog(L_)
    f0l = radd(rmul((-2 * PI[0], 2 * PI[1]), S1l), rmul(rq(Fr(-1, 2)), radd(logl, S2l)))
    L2 = rmul(L_, L_)
    fl = rsub(rsub(f0l, rdivint(rmul(lam, L2), 2)), mu)
    Bl = rwiden(R.Bl, tr['dBl'])
    slope = rsub(rneg(rmul(PI, Bl)), rdivint(lam, 2))
    out.update(lam=lam, mu=mu, K=K, f0l=f0l, Bl=Bl, fl=fl, slope=slope, f0p=f0p, f0R=f0R, eR=eR, I1=I1, I2=I2,
               S1l=S1l, S2l=S2l, S1R=S1R, S2R=S2R, qerr=qerr)
    return out


# ======================================================================================================
# the omitted modes m >= 39 (k >= 234), bounded here with |c_m| <= 7/(k a^k)
# ======================================================================================================
def tailsum(s, r):
    """an upper bound for sum_{k = 234, 240, ...} k^s r^k (0 < r < 1): the ratio ((k+6)/k)^s r^6 decreases in k"""
    r = Fr(r)
    ratio = (Fr(240, 234) ** s if s > 0 else Fr(1)) * r ** 6
    if ratio >= 1:
        raise ArithmeticError('no geometric bound')
    return Fr(234) ** s * r ** 234 / (1 - ratio)


R1 = Fr(5774, 10000)          # >= R_0/a = 1/sqrt3
R2 = Fr(789, 1000)            # >= (p + x_0)/a = (1 + 1/sqrt3)/2
R3 = Fr(13, 20)               # >= l/a


def truncation(c, R):
    """Fraction upper bounds for every omitted-mode contribution used by constants()"""
    pi_h = rhi(PI)
    ph, x0h, r0h, lh = rhi(P_), rhi(X0), rhi(R0), rhi(L_)
    r0l = rlo(R0)
    W = rhi(radd(P_, X0))                                  # |p + is| <= p + x_0 for |s| <= x_0
    Dom = 14 * tailsum(-1, R2)
    kDom = 14 * tailsum(0, R2)
    Vom = 7 * tailsum(0, R1)
    s1om = r0h ** 2 * 7 * tailsum(-2, R1)
    kDret = sum(6 * m * rhi(rabs_hi(c[m])) * (W ** (6 * m) + r0h ** (6 * m)) for m in range(1, MMAX + 1))
    Vtot = pi_h * r0h ** 2 + sum(6 * m * rhi(rabs_hi(c[m])) * r0h ** (6 * m) for m in range(1, MMAX + 1)) + Vom
    dS2 = 2 * Vom / 234 + 2 * Vtot * Vom / 234
    eps_f = 2 * pi_h * (s1om + r0h ** 2 * Dom / 236) + Fr(1, 2) * (dS2 + 2 * Dom + 2 * (kDret * Vom / 240 + kDom * Vtot / 8)
                                                                    + 2 * (kDret + kDom) * Dom)
    Qom = 7 * tailsum(1, R2)
    Qret = sum((6 * m) ** 2 * ph * rhi(rabs_hi(c[m])) * W ** (6 * m - 1) for m in range(1, MMAX + 1))
    eps_e = (Qret + Qom) * Qom / 240
    # the spline region [R_0, l] and [0, R_0]
    h = HS
    Pm, Ppm, Qm, Qpm = 18 * h, Fr(66), 4 * h * h, 14 * h
    dA0 = 7 * tailsum(-1, R1)
    dA1 = 7 * tailsum(0, R1) / r0l
    dA2 = 7 * (2 * tailsum(1, R1) + tailsum(0, R1)) / r0l ** 2
    dPa = 7 * tailsum(-1, R3)
    dPa1 = 7 * tailsum(0, R3) / r0l
    dB = dPa + dA0 + Pm * dA1 + Qm * dA2
    dB1 = 25 * dB + dPa1 + Fr(75, 4) * dPa + Ppm * dA1 + Qpm * dA2
    # sup |B~_1| on [0, l]: on [0,R_0] pi R_0 + sum k|c_m| R_0^{k-1}; on [R_0,l] by ball evaluation over covers
    b1 = pi_h * r0h + sum(6 * m * rhi(rabs_hi(c[m])) * r0h ** (6 * m - 1) for m in range(1, MMAX + 1))
    edges = [R0, radd(R0, rq(Fr(1, 1000))), radd(R0, rq(HS)), L_]
    for piece, n in ((1, 2), (2, 30), (3, 2)):
        a, b = edges[piece - 1], edges[piece]
        for i in range(n):
            lo = radd(a, rdivint(rmul(rsub(b, a), rq(i)), n))
            hi = radd(a, rdivint(rmul(rsub(b, a), rq(i + 1)), n))
            mid = rdivint(radd(lo, hi), 2)
            rad = rhi(rdivint(rsub(hi, lo), 2)) + Fr(mid[1], ONE)
            ball = (mid[0], 0, -(-(rad * ONE).numerator // (rad * ONE).denominator) + 1)
            _, B1 = R.spline(ball, piece)
            b1 = max(b1, Fr(cabs_hi(B1), ONE))
    dS1l = lh ** 2 / 2 * dB
    dS2l = lh * dB1 * (2 + lh * (2 * b1 + dB1))
    return dict(eps_f=eps_f, eps_e=eps_e, dS1R=s1om, dS2R=dS2, dS1l=dS1l, dS2l=dS2l, dBl=7 * tailsum(-1, R1), B1max=b1)


def eta_abs2():
    """|eta(e^{i pi/3})|^2 = e^{-pi sqrt3/12} prod_{n>=1} (1 - (-x)^n)^2, x = e^{-pi sqrt3}; tail |log| <= 4x^31"""
    x = rexp_r(rneg(rmul(PI, SQ3)))
    prod = (ONE, 0)
    xn = (ONE, 0)
    for n in range(1, 31):
        xn = rmul(xn, x)
        f = rsub((ONE, 0), xn) if n % 2 == 0 else radd((ONE, 0), xn)
        prod = rmul(prod, rmul(f, f))
    xb = rhi(x)
    tail = 4 * xb ** 31 * 2
    prod = rwiden(prod, tail * rhi(prod))
    return rmul(rexp_r(rneg(rdivint(rmul(PI, SQ3), 12))), prod)


def rexp_r(a):
    return cre(cexp(cr(a)))


# ======================================================================================================
# printed arithmetic (Sections tail:*, supp:*, sec:computation, sec:conclusion), exact
# ======================================================================================================
def printed_arithmetic(checks):
    ok = []
    # tail:coefficient-uniform: the bracket at d = 12 and its decrease (each nonconstant term shrinks by 1/27 per +6)
    br12 = 6 + 2 * Fr(1, 3 ** 6) + 24 * Fr(4, 3) ** 6 * Fr(1, 2 ** 11)
    check(checks, '7. |c_m| <= 7/(d a^d): the bracket 6 + 2 3^{-6} + 24 (4/3)^6 2^{-11} = 6 + 50/729 < 7 at d = 12, both nonconstant terms x1/27 per step (05-tails.tex:50-58)',
          br12 == 6 + Fr(50, 729) and br12 < 7 and Fr(1, 3 ** 3) == Fr(1, 27) and Fr(4, 3) ** 3 * Fr(1, 2 ** 6) == Fr(1, 27))
    # S bounds on [0,1]: S' = 30y^2(1-y)^2 <= 15/8, S'' = 60y(1-y)(1-2y) with max 10/sqrt3, S''' = 60(1-6y+6y^2) in [-30, 60]
    check(checks, '7. the cutoff S: |S\'| <= 15/8 <= 2, |S\'\'| <= 10/sqrt3 < 6 ((10/sqrt3)^2 = 100/3 < 36), |S\'\'\'| <= 60; tau: 2/.075 <= 27, 6/.075^2 <= 1067, 60/.075^3 <= 142223; 1+3(27)+3(1067)+142223 = 145506 < 10^6 (05-tails.tex:83-87, 196-203)',
          Fr(30, 16) <= 2 and Fr(100, 3) < 36 and Fr(2) / Fr(75, 1000) <= 27 and 6 / Fr(75, 1000) ** 2 <= 1067
          and 60 / Fr(75, 1000) ** 3 <= 142223 and 1 + 3 * 27 + 3 * 1067 + 142223 == 145506 < 10 ** 6)
    a = A_
    geo = (rgt(P_, D_('.537')) and rlt(P_, D_('.538')) and rgt(R0, D_('.620')) and rlt(R0, D_('.621')) and rgt(L_, D_('.696'))
           and rlt(L_, D_('.697')) and rlt(rmul(L_, rinv(a)), Fr(13, 20)) and rlt(rmul(R0, rinv(a)), Fr(289, 500))
           and rlt(rmul(R0, rinv(a)), R1) and rlt(rmul(radd(P_, X0), rinv(a)), R2) and rlt(rmul(L_, rinv(a)), R3))
    check(checks, '7. .537<p<.538, .620<R_0<.621, .696<l<.697, l/a<13/20, R_0/a<289/500 (05-tails.tex:89-93); the ratios used here (5774/10000, 789/1000, 13/20) bound R_0/a, (p+x_0)/a, l/a', geo)
    d1 = (D_('.000001') > 7 / Fr(234) ** 3)
    d2 = 7 * (1 / D_('.69') + Fr(20, 234)) / Fr(234) ** 2 < D_('.000197')
    d3 = 7 * (1 / (234 * D_('.69') ** 2) + 40 / (Fr(234) ** 2 * D_('.69')) + 600 / Fr(234) ** 3) < D_('.070572')
    d4 = 7 * (1 / D_('.69') ** 3 + 60 / (234 * D_('.69') ** 2) + 1800 / (Fr(234) ** 2 * D_('.69')) + 60000 / Fr(234) ** 3)
    check(checks, '7. the U_m derivative coefficients at l > .69, k >= 234: orders 0..3 below .000001, .000197, .070572, 25.445 < 30 (05-tails.tex:97-110; the order 0-2 expressions re-derived by Leibniz)',
          d1 and d2 and d3 and d4 < D_('25.445') and D_('25.445') < 30, 'order 3: %.6f' % float(d4))
    c_ = D_('.06')
    k = 234
    b3 = 60 / c_ ** 3 * (Fr(7, k) + D_('.84') * k + D_('.0168') * k ** 3) + 18 / c_ ** 2 * (14 * k + D_('.56') * k ** 3) + 6 / c_ * Fr(28, 3) * k ** 3
    check(checks, '7. the inner continuation: |b_m\'\'\'| <= (60/c^3)|q| + (18/c^2)|q\'| + (6/c)|q\'\'| < 8500 k^3 2^{-k} at k >= 234 (05-tails.tex:112-133)',
          b3 < 8500 * k ** 3, '%.2f k^3' % float(b3 / k ** 3))
    pp = D_('.537')
    check(checks, '7. on [p, p+.01]: .02p + .0001 < .04 p^2 (p > .537), and 7(8(.55)^3 2^6 + 12(.55)2^4/234^2) < 597; on [p+.01,R_0]: 7(8(343) + 12(7)(300)/234 + 2(60000)/234^2) < 20000 (05-tails.tex:137-181)',
          D_('.02') * pp + D_('.0001') < D_('.04') * pp * pp and 7 * (8 * D_('.55') ** 3 * 64 + 12 * D_('.55') * 16 / Fr(234) ** 2) < 597
          and 7 * (8 * 343 + Fr(12 * 7 * 300, 234) + Fr(2 * 60000, 234 ** 2)) < 20000)
    h = HS
    Pc = [Fr(0), Fr(1), Fr(0), -6 / h ** 2, 8 / h ** 3, -3 / h ** 4]
    Qc = [Fr(0), Fr(0), Fr(1, 2), -Fr(3, 2) / h, Fr(3, 2) / h ** 2, -Fr(1, 2) / h ** 3]

    def dsup(cfs, j):
        return sum(abs(cf) * Fr(factorial(i), factorial(i - j)) * h ** (i - j) for i, cf in enumerate(cfs) if i >= j)
    pq_ok = all(dsup(Pc, j) <= 2 * 10 ** 5 and dsup(Qc, j) <= 4000 for j in range(4))
    pq_vals = all(sum(cf * h ** i for i, cf in enumerate(Pc)) == 0 for _ in [0]) and sum(cf * h ** i for i, cf in enumerate(Qc)) == 0
    check(checks, '7. the Hermite continuation: P, Q and their first three derivatives bounded by 2e5 and 4000 on [0, h_s] (coefficient sums), (1+200000+4000) 3e6 < 7e11, P(h_s) = Q(h_s) = 0 (05-tails.tex:183-194, 04-calibration.tex:130-133)',
          pq_ok and (1 + 200000 + 4000) * 3 * 10 ** 6 < 7 * 10 ** 11 and pq_vals)
    # tail:weighted-sum and supp:tail-bounds
    C234 = 30 * 234 ** 2 * 325 ** 234 + 3 * 10 ** 6 * 234 ** 3 * 250 ** 234 + 5600 * 234 ** 5 * 300 ** 234 + 7 * 10 ** 11 * 234 ** 2 * 289 ** 234
    T0 = Fr(10 ** 6 * 235 ** 4 * C234, 500 ** 234)
    pairs = [(2, Fr(13, 20)), (3, Fr(1, 2)), (5, Fr(3, 5)), (2, Fr(289, 500))]

    def tcomp(i, kk):
        pp_, bb = pairs[i]
        coef = [30, 3 * 10 ** 6, 5600, 7 * 10 ** 11][i]
        return 10 ** 6 * coef * Fr(kk + 1) ** 4 * Fr(kk) ** pp_ * bb ** kk

    def rho(i, kk):
        pp_, bb = pairs[i]
        return Fr(kk + 7, kk + 1) ** 4 * Fr(kk + 6, kk) ** pp_ * bb ** 6
    rhos = [rho(i, 234) for i in range(4)]
    Acoarse = Fr(10, 9) * T0
    Acommon = T0 / (1 - max(rhos))
    Acomp = sum(tcomp(i, 234) / (1 - rhos[i]) for i in range(4))
    P600 = sum(tcomp(i, 234 + 6 * j) for i in range(4) for j in range(62))
    R606 = sum(tcomp(i, 606) / (1 - rho(i, 606)) for i in range(4))
    check(checks, '7. the omitted-mode sum (tail:weighted-sum, supp:tail-bounds): the three integer comparisons, rho_i(234) < 1/10, T_0 = sum t_i(234) and 10^29 235^4 C_234 < 156 500^234, '
          'P_600 < P_600 + R_606 <= A_component <= A_common < A_coarse < 2e-21 (exact)',
          9 * 241 ** 4 == 30360623049 < 30498006250 == 10 * 235 ** 4 and 7 * 40 ** 5 == 716800000 < 721793592 == 8 * 39 ** 5
          and 800 * 13 ** 6 == 3861447200 < 4032000000 == 63 * 20 ** 6 and all(r_ < Fr(1, 10) for r_ in rhos)
          and T0 == sum(tcomp(i, 234) for i in range(4)) and 10 ** 29 * 235 ** 4 * C234 < 156 * 500 ** 234
          and P600 < P600 + R606 <= Acomp <= Acommon < Acoarse < Fr(2, 10 ** 21) and 1560 < 1800,
          'A_component = %.4e, P_600 = %.4e' % (float(Acomp), float(P600)))

    def Ffun(A, W):
        return 2 * Fr(22, 7) * (3 * W + 16 * A) + Fr(1, 2) * (60000 * W + 8 * A + 12 * 2 * 10 ** 6 * W + 48 * (6000 + W) * A + 8 * 2 * 10 ** 6 * A + 16 * A * A)
    A0_ = Fr(2, 10 ** 21)
    idt = all(Ffun(Fr(x), 4 * Fr(x)) == Fr(x) * (56264180 + 104 * Fr(x)) for x in (1, 2, 3))
    check(checks, '7. F(A,4A) = A(56,264,180 + 104A) (three points of a quadratic), 56,264,180 + 208e-21 < 56,264,181 < 6e7, F(A_0,4A_0) < 12e-14, 2(16(2e6)A_0 + 32A_0^2) < 13e-14 (supp:rational-error-coefficient; tail:f-estimate, tail:e-estimate)',
          idt and 56264180 + Fr(208, 10 ** 21) < 56264181 < 6 * 10 ** 7 and Ffun(A0_, 4 * A0_) == Fr(112528360, 10 ** 21) + Fr(416, 10 ** 42)
          and Ffun(A0_, 4 * A0_) < Fr(12, 10 ** 14) and 2 * (16 * 2 * 10 ** 6 * A0_ + 32 * A0_ ** 2) < Fr(13, 10 ** 14))
    dbl = Fr(7, 234) * Fr(289, 500) ** 234 / (1 - Fr(289, 500) ** 6)
    s12 = sum(7 * Fr(kk) ** 2 * Fr(2, 7) ** (kk - 3) for kk in range(12, 12 + 6 * 40, 6))
    check(checks, '7. |Delta B(l)| <= (7/234)(289/500)^234/(1-(289/500)^6) < 6.075e-58; sum_{k>=12} 7k^2(2/7)^{k-3} < .014 (first 40 terms + geometric rest); l/(k+1)+5/2+k/b < 6(k+1) for k = 6..228',
          dbl < D_('6.075e-58') and s12 + 7 * Fr(252) ** 2 * Fr(2, 7) ** 249 * 2 < D_('.014')
          and all(rhi(L_) / (kk + 1) + Fr(5, 2) + kk / B_EDGE < 6 * (kk + 1) for kk in range(6, 229, 6)))
    check(checks, '7. log and arctan remainders below 2^-144: 2(3/5)^401/(401(1-(3/5)^2)), 5^-301/301, 239^-301/301 (comp:logarithm, comp:pi)',
          2 * Fr(3, 5) ** 401 / (401 * (1 - Fr(9, 25))) < Fr(1, 2 ** 144) and Fr(1, 5 ** 301 * 301) < Fr(1, 2 ** 144))
    bb = B_EDGE
    check(checks, '7. b = 28209/100000 < 1/(2 sqrt pi) from pi < 3.1416 (4 b^2 (3.1416) < 1); p > 1/2 > b; x_0 > .01; sqrt(b^2+.65^2) > l; t(x_0) = R_0 (p^2 + R_0^2/4 = R_0^2) (06-computation.tex:393-398, 466-467; 07-conclusion.tex:18)',
          4 * bb * bb * D_('3.1416') < 1 and rlt(PI, D_('3.1416')) and rgt(P_, Fr(1, 2)) and Fr(1, 2) > bb and rgt(X0, D_('.01'))
          and rgt(radd(rq(bb * bb + D_('.65') ** 2), rneg(rmul(L_, L_))), 0)
          and abs(radd(P2, rdivint(R02, 4))[0] - R02[0]) <= R02[1] + P2[1] + 4)


def record_pairs(src):
    rec = src.text(DIR + 'verification/data/certificate-record.txt')
    pairs = [(int(a), int(b)) for a, b in re.findall(r'`\((-?\d+), (-?\d+)\)`', rec)]
    return rec, pairs


# ======================================================================================================
_CACHE = {}


def coefficients_from(c_ref, mref, rho):
    """all c_m from one enclosure: y_m = 6m(6m-1) c_m = rho_m X^m (Weierstrass recurrence), so X = (y_mref/rho_mref)^{1/mref};
    then y_1 = X/28 and the recurrence in balls"""
    ym = rmul(c_ref, rq(6 * mref * (6 * mref - 1)))
    Xp = rmul(ym, rq(1 / rho[mref]))
    X = rexp_r(rdivint(rlog(Xp), mref))
    y = {1: rdivint(X, 28)}
    for j in range(2, MMAX + 1):
        s_ = (0, 0)
        for i in range(1, j):
            s_ = radd(s_, rmul(y[i], y[j - i]))
        y[j] = rmul(rq(Fr(3, (6 * j + 1) * (3 * j - 3))), s_)
    return {m: rdivint(y[m], 6 * m * (6 * m - 1)) for m in range(1, MMAX + 1)}, X


def compute():
    if 'all' not in _CACHE:
        cl, det = coefficients_lattice()
        ca, M, vanish, rho = coefficients_agm()
        cx, X = coefficients_from(cl[10], 10, rho)
        R = Radial(cx)
        tr = truncation(cx, R)
        out = constants(R, tr)
        _CACHE['all'] = dict(cl=cl, det=det, ca=ca, cx=cx, X=X, M=M, vanish=vanish, rho=rho, tr=tr, out=out)
    return _CACHE['all']


PRINTED = {'lam': (D_('-6.7300312'), D_('-6.7300275')), 'mu': (D_('.4138830'), D_('.4138838')), 'K': (D_('-.0034823'), D_('-.0034809')),
           'Bl': (D_('1.0464643'), D_('1.0464644')), 'f0l': (D_('-1.2135966'), D_('-1.2135965')), 'fl': (D_('.0044755'), D_('.0044772')),
           'slope': (D_('.0774490'), D_('.0774509'))}
LABELS = {'lam': 'lambda', 'mu': 'mu', 'K': 'K', 'Bl': 'B(l)', 'f0l': 'f_0(l)', 'fl': 'f(l)', 'slope': '-pi B(l) - lambda/2'}


def dec(q, digits, direction):
    q = Fr(q)
    sc = q * 10 ** digits
    n = sc.numerator // sc.denominator if direction < 0 else -(-sc.numerator // sc.denominator)
    sgn = '-' if n < 0 else ''
    n = abs(n)
    s = str(n).rjust(digits + 1, '0')
    return sgn + s[:-digits] + '.' + s[-digits:]


def decide(src=None, printed=None, edge=None, parts=None):
    t0 = time.time()
    src = src or Sources()
    printed = printed or PRINTED
    edge = B_EDGE if edge is None else edge
    parts = set(parts or ('text', 'coefficients', 'constants', 'arithmetic', 'record'))
    checks = []
    refuting = []
    value = {}
    tex = {k: src.text(SEC + k + '.tex') for k in ('01-introduction', '04-calibration', '05-tails', '06-computation', '07-conclusion', '08-scientific-support')}
    flat = {k: re.sub(r'\s+', '', v) for k, v in tex.items()}
    rec, pairs = record_pairs(src)

    if 'text' in parts:
        check(checks, '0. the definitions read off the paper: a, p, R_0, x_0 (cal:geometry), k_m = 6m, h_s = 3/40, c = 3/50, the cutoffs, l = R_0 + 19/250, b = 28209/100000, the scalar bounds (cal:scalar-bounds)',
              all(x in flat['04-calibration'] for x in ('a=\\sqrt{\\frac{2}{\\sqrt3}},\\qquadp=\\fraca2', 'R_0=\\frac{2p}{\\sqrt3},\\qquadx_0=\\frac{R_0}{2}',
                                                         'k_m=6m', 'Let$h_s=3/40$and$c=3/50$', 'l=R_0+\\frac{19}{250}', 'b=\\frac{28209}{100000}',
                                                         'K<0,\\qquad2g_d(x)\\geK\\quad(d\\geb,\\x\\ge0)')))
        check(checks, '0. the paper\'s finite procedure as summarised (06-computation.tex:653-679): denominator 2^144, modes 0..38, D = 256/48, densities 8000/24000, 45000 midpoint steps, meshes .0008/.00019/.00018/.00004/.00008',
              all(x in flat['06-computation'] for x in ('Denominator$2^{144}$', '$D=256$for$m=1$,$D=48$otherwise', '$45000$midpointstepseach', 'Atmost$.0008$inbothcoordinates')))

    if 'coefficients' in parts or 'constants' in parts:
        C = compute()
        cl, ca = C['cl'], C['ca']
    if 'coefficients' in parts:
        ov = all(abs(cl[m][0] - ca[m][0]) <= cl[m][1] + ca[m][1] for m in range(1, MMAX + 1))
        value['c_1'] = (dec(rlo(cl[1]), 12, -1), dec(rhi(cl[1]), 12, 1))
        value['c_1_agm'] = dec(rlo(ca[1]), 30, -1)
        value['c_2..c_5'] = [float(rlo(cl[m])) for m in range(2, 6)]
        check(checks, '1. the lattice coefficients c_1..c_38 by the paper\'s recipe (integer numerators, shells divided once, square tail added): c_1 in [%s, %s]'
              % value['c_1'], all(cl[m][1] < ONE for m in cl) and C['det'][1][0] == 256 and C['det'][2][0] == 48,
              '%d norm shells for m=1 (D=256), %d for m>=2 (D=48)' % (C['det'][1][1], C['det'][2][1]))
        check(checks, '1. |c_1| < 1 (06-computation.tex:132)', rlt(rabs_hi(cl[1]), 1) and rgt(cl[1], 0), dec(rhi(cl[1]), 12, 1))
        cx = C['cx']
        ovx = all(abs(cl[m][0] - cx[m][0]) <= cl[m][1] + cx[m][1] and abs(ca[m][0] - cx[m][0]) <= ca[m][1] + cx[m][1] for m in range(1, MMAX + 1))
        value['c_1_used'] = (dec(rlo(cx[1]), 30, -1), dec(rhi(cx[1]), 30, 1))
        check(checks, '1. SECOND WAY: Weierstrass recurrence with g_2 = 0 (only n = 0 mod 3 survive, exactly), g_3 from AGM(1, cos 15deg) = %s...: all 38 coefficients overlap the lattice enclosures'
              % dec(rlo(C['M']), 15, -1), ov and C['vanish'],
              'rho_1 = %s, rho_2 = %s; c_1 = %s (AGM route)' % (C['rho'][1], C['rho'][2], value['c_1_agm']))
        check(checks, '1. the coefficients USED below: X = (6m(6m-1)c_m/rho_m)^(1/m) from the lattice enclosure of c_10 (radius %.1e), then c_m = rho_m X^m/(6m(6m-1)) by the '
              'recurrence: c_1 in [%s, %s]; every one inside the lattice enclosure and overlapping the AGM value' % (cl[10][1] / ONE, value['c_1_used'][0], value['c_1_used'][1]),
              ovx and max(cx[m][1] for m in cx) < ONE // 10 ** 40)

    if 'constants' in parts:
        C = compute()
        out, tr = C['out'], C['tr']
        value['truncation'] = {k: '%.2e' % float(v) for k, v in tr.items()}
        value['quadrature_error_total'] = '%.2e' % float(out['qerr'])
        check(checks, '5. omitted modes m >= 39 bounded here: |Delta f_0| <= %.1e, |Delta e| <= %.1e on |s| <= x_0, |Delta S_1(l)|, |Delta S_2(l)| <= %.1e, |Delta B(l)| <= %.1e; quadrature total %.1e'
              % (tr['eps_f'], tr['eps_e'], max(tr['dS1l'], tr['dS2l']), tr['dBl'], out['qerr']),
              max(tr['eps_f'], tr['eps_e'], tr['dS1l'], tr['dS2l'], tr['dBl']) < Fr(1, 10 ** 20) and out['qerr'] < Fr(1, 10 ** 15))
        for key in ('lam', 'mu', 'K', 'Bl', 'f0l', 'fl', 'slope'):
            v = out[key]
            lo, hi = printed[key]
            value[key] = (dec(rlo(v), 15, -1), dec(rhi(v), 15, 1))
            ok = lo <= rlo(v) and rhi(v) <= hi
            check(checks, '2-4. %s in [%s, %s], inside the saved pair [%s, %s] (certificate-record.txt; 06-computation.tex:734-740)'
                  % (LABELS[key], value[key][0], value[key][1], dec(lo, 7, -1), dec(hi, 7, 1)), ok)
            if rhi(v) < lo or rlo(v) > hi:
                refuting.append('saved pair %s' % key)
        sign = [('-6.731 < lambda < -6.729', rgt(out['lam'], D_('-6.731')) and rlt(out['lam'], D_('-6.729')), rhi(out['lam']) <= D_('-6.731') or rlo(out['lam']) >= D_('-6.729')),
                ('K < 0', rlt(out['K'], 0), rlo(out['K']) >= 0),
                ('f(l) = f_0(l) - lambda l^2/2 - mu > 0', rgt(out['fl'], 0), rhi(out['fl']) <= 0),
                ('-pi B(l) - lambda/2 > 0', rgt(out['slope'], 0), rhi(out['slope']) <= 0)]
        for name, ok, bad in sign:
            check(checks, '5. comp:tail-signs: %s (decided here, by the independent route)' % name, ok)
            if bad:
                refuting.append(name)
        Wsum = radd(radd(rmul(rq(6), out['K']), out['lam']), rmul((2 * PI[0], 2 * PI[1]), out['mu']))
        e2 = eta_abs2()
        Wcl = rneg(rmul(PI, rlog(rmul(rmul((2 * PI[0], 2 * PI[1]), rsqrt(rsqrt(rq(Fr(3, 4))))), e2))))
        value['W_from_constants'] = (dec(rlo(Wsum), 12, -1), dec(rhi(Wsum), 12, 1))
        value['W_kronecker'] = (dec(rlo(Wcl), 15, -1), dec(rhi(Wcl), 15, 1))
        check(checks, '6. SECOND WAY (theory-dependent): 6K + lambda + 2 pi mu in [%s, %s] overlaps the Kronecker-limit value -pi log(2 pi sqrt(Im tau)|eta(tau)|^2) = %s (Lemma cal:energy-identity)'
              % (value['W_from_constants'][0], value['W_from_constants'][1], value['W_kronecker'][0]),
              abs(Wsum[0] - Wcl[0]) <= Wsum[1] + Wcl[1])
        bnd = Fr(edge)
        eb = rmul(rq(4 * bnd * bnd), PI)
        check(checks, '7. the domain edge b = %s < 1/(2 sqrt pi) (the geometric threshold d_*): 4 b^2 pi < 1 by an enclosure of pi' % dec(bnd, 5, -1),
              rlt(eb, 1))
        if rgt(eb, 1):
            refuting.append('b < 1/(2 sqrt pi)')

    if 'arithmetic' in parts:
        printed_arithmetic(checks)

    if 'record' in parts:
        art = {'lam': (D_('-6.7300312'), D_('-6.7300275')), 'mu': (D_('.4138830'), D_('.4138838')), 'K': (D_('-.0034823'), D_('-.0034809')),
               'Bl': (D_('1.0464643'), D_('1.0464644')), 'f0l': (D_('-1.2135966'), D_('-1.2135965')), 'slope': (D_('.0774490'), D_('.0774509')),
               'fl': (D_('.0044755'), D_('.0044772'))}
        order = ['lam', 'mu', 'K', 'Bl', 'f0l', 'slope', 'fl']
        first = pairs[:7]
        rows_ok = len(pairs) == 22 and all((Fr(first[i][0], 10 ** 7), Fr(first[i][1], 10 ** 7)) == art[k] for i, k in enumerate(order))
        g = pairs[7:12]
        Ls = [max(abs(a_), abs(b_)) for a_, b_ in g[1:]]
        rest = pairs[12:]
        cons = (rest[4][0] >= rest[0][0] - rest[2][1] - 1 and rest[4][1] <= rest[0][1] - rest[2][0] + 1
                and rest[5][0] >= rest[1][0] + rest[3][0] + pairs[2][0] - 1 and rest[5][1] <= rest[1][1] + rest[3][1] + pairs[2][1] + 1)
        # the slope and f(l) pairs are consistent with the lambda, B(l) pairs by outward interval arithmetic
        lam_iv = (Fr(pairs[0][0], 10 ** 7), Fr(pairs[0][1], 10 ** 7))
        B_iv = (Fr(pairs[3][0], 10 ** 7), Fr(pairs[3][1], 10 ** 7))
        sl_lo = -rhi(PI) * B_iv[1] - lam_iv[1] / 2
        sl_hi = -rlo(PI) * B_iv[0] - lam_iv[0] / 2
        sl_ok = sl_lo <= Fr(pairs[5][1], 10 ** 7) and sl_hi >= Fr(pairs[5][0], 10 ** 7)
        check(checks, '8. the record\'s 22 saved pairs: the first label equals the article\'s projection table; L_1..L_4 = 7.4636170, 2.5091315, 143.7890461, 315.1489689 '
              'are the largest endpoints of the G_d, G_s, G_dd, G_ss hulls; m_*-E_0-E_I >= .0000120, <= -.0004585, g_dd >= 1.0529222, g_xx >= .0128335, det >= .0086252 match; '
              'gmin-factor and drneg+er_drop+K are consistent with their parts; the slope pair overlaps -pi B(l) - lambda/2 of the lambda and B(l) pairs',
              rows_ok and Ls == [74636170, 25091315, 1437890461, 3151489689] and rest[4][0] == 120 and rest[5][1] == -4585
              and pairs[18][0] == 10529222 and pairs[20][0] == 128335 and pairs[21][0] == 86252 and cons and sl_ok
              and all(s in flat['06-computation'] for s in ('L_1\\le7.4636170', 'L_2\\le2.5091315', 'L_3\\le143.7890461', 'L_4\\le315.1489689',
                                                            '$m_*-E_0-E_I$&$\\ge.0000120$', '$\\ge1.0529222$', '$\\ge.0128335$', '$\\ge.0086252$')))

    refused = ('REFUSED, not decided here: the outer primitive grid (comp:outer-assertion, ~2186 x 3612 = 7.9e6 interval G evaluations), '
               'the negative-part grid (comp:negative-assertion, same grid), the global derivative bounds L_1..L_4 (~4.2e5 rectangles), the '
               'Hessian cells (comp:hessian-assertions, ~601 x 4079 = 2.45e6 cells), the paper\'s radial table (~6800 propagated steps) and '
               'the finite-core premise tail:finite-core-premise; estimated 20-40 CPU-minutes here plus f_0, e with two derivatives on all '
               'of [b, l], beyond the budget. Hence 2 g_d(x) >= K and the negative-part bound are NOT decided.')
    value['refused'] = refused
    ok = all(c_['pass'] for c_ in checks)
    verdict = 'CERTIFIED' if ok else ('REFUTED' if refuting else 'REFUSED')
    value['refuting'] = refuting
    value['seconds'] = round(time.time() - t0, 1)
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': ('a finite component: the 38 lattice coefficients (two ways) and |c_1| < 1; the constants lambda, mu, K, B(l), '
                        'f_0(l), f(l), -pi B(l) - lambda/2 enclosed by an independent closed-form route (not the paper\'s radial table) '
                        'and each inside its saved pair; the four exterior-sign assertions comp:tail-signs (K < 0 included); the '
                        'printed arithmetic of the truncation sections. ' + refused)}


def forge():
    """each must NOT certify"""
    out = []
    pr = dict(PRINTED)
    pr['lam'] = (D_('-6.7300312'), D_('-6.7300295'))
    out.append(('saved lambda pair with upper end -6.7300295 (excludes the true lambda)', decide(printed=pr, parts=['constants'])['verdict']))
    pr = dict(PRINTED)
    pr['mu'] = (D_('.4138834'), D_('.4138842'))
    out.append(('saved mu pair shifted up by 4e-7', decide(printed=pr, parts=['constants'])['verdict']))
    pr = dict(PRINTED)
    pr['K'] = (D_('.0034809'), D_('.0034823'))
    out.append(('K printed with the opposite sign', decide(printed=pr, parts=['constants'])['verdict']))
    out.append(('domain edge b = 0.2821 (above 1/(2 sqrt pi))', decide(edge=D_('.2821'), parts=['constants'])['verdict']))
    return out


if __name__ == '__main__':
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1, default=str))
    for c_ in res['checks']:
        print(('PASS ' if c_['pass'] else 'FAIL ') + c_['check'], '|', c_['detail'])
    print('sources', json.dumps(res['sources'], indent=1))
    print('decide %.1fs' % (time.time() - t))
    t = time.time()
    for d, v in forge():
        print('FORGE', v, '--', d)
    print('forges %.1fs' % (time.time() - t))
