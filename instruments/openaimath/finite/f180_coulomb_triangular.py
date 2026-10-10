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

WHAT IS CERTIFIED HERE IS NOT THE PAPER'S RUN but the mathematical quantities all its stages enclose, recomputed by
an independent route from the definitions (04-calibration.tex), in exact/ball arithmetic (integers, Fractions,
dyadic balls k/2^200 and fixed-point intervals k/2^100, all with outward rounding; nothing is a float):
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
  9. THE SWEEPS (added 2026-10-10): every remaining finite assertion of the certificate, on the paper's own meshes, with an
     independent radial table; outward fixed-point intervals (integers / 2^100) after the table; at most 3 worker processes.
     (a) THE RADIAL TABLE on [b, l]: the paper's breakpoints b, p-.06, p, R_0, R_0+.001, R_0+.075, l and densities
         (floor(8000 L)+1, floor(24000 L)+1 cells: 6825), NOT its midpoint propagation.  On [b, R_0] the truncated S_1, S_2,
         H_k are the exact closed forms comp:initial-integrals; D_m is 0, S((t-p+c)/c) q_m (cal:inner-continuation) or
         c_m (rho_m - (-1)^m t^{6m}) with rho_m = Re (p + i sqrt(t^2-p^2))^{6m} by rho_{m+1} = 2 rho_1 rho_m - t^12 rho_{m-1}
         (polynomials, no square root).  On [R_0, l] B, B_1, D_i are the spline formulas (cal:continuation, cal:radial-data)
         and S_1, S_2, H_k are integrated cell by cell by Taylor's formula (order 2 at the node plus the range of the order-3
         coefficient on the cell times h^4/4), starting from the closed forms at R_0.  Interval jets (order 3; a cell-wide
         leading interval gives natural extensions) yield, per cell, f_0, e and two derivatives at the left node and the
         range of the third derivatives of f_0, e on the cell: a Taylor model that every query evaluates on its exact
         sub-interval.  On [b, p-c] f_0 is the exact identity comp:inner-exact, e = 0 (checked against the general sector
         formula through the second derivative).  Every query adds the paper's 10^-11 (tail:uniform-error) and uses the
         exact exterior formula tail:exterior-formula beyond l.  Checked: node separation; C^1 continuity (C^2 inside pieces)
         of the Taylor data at all 6824 interior nodes; f_0(p), f_0(R_0), e(R_0) and f_0(l) overlap the complex-ball /
         Fejer route of parts 3-4 (f_0(l) agrees to ~4e-15).
     (b) THE FINITE-CORE PREMISE tail:finite-core-premise on every cell: max |B~_1|_{2,t} ~ 5424.6 < 6000 and
         max sum (k_i+1)^3 |D~_i|_{3,t} ~ 1,765,950 < 2e6 (tightest at t = p - c, where S''' = 60).
     (c) L_1..L_4 (comp:global-derivative-bounds) on 519 x 813 rectangles of side <= .0008 covering D = [b,.697] x [0,.65]:
         7.4479..., 2.4936..., 142.758..., 313.510..., each below the printed bound.
     (d) THE OUTER GRID (comp:outer-assertion) and THE NEGATIVE PART (comp:negative-assertion) on 2186 d-nodes x 3612
         s-steps (7.9 million G values): m_* - E_0 - E_I ~ 1.34e-5 > 0, N_* + K + .65(S_h L_2/4 + D_h L_1/2) ~ -4.61e-4 < 0.
     (e) THE HESSIAN (comp:hessian-assertions) on 601 x 4079 cells (A_j accumulated from s = 0), tested on the 601 x 401
         cells of D_0: inf g_dd ~ 1.100, inf g_xx ~ .0235, inf det ~ .0231 (the paper: 1.0529, .0128, .0086).
     Runtime, measured 2026-10-10 on 3 workers (Apple M2, another 3-process job running): the default decide() 281 s wall
     (coefficients/constants ~30 s, table 117 s, L bounds 16 s, outer + negative 19 s, Hessian 98 s); with the eight
     forges (three sweeps re-run on forged inputs) 466 s wall, 1239 CPU-seconds, 180 MB.

WHAT IS NOT DECIDED -- everything analytic; nothing finite is refused any more:
  - the reduction (Section sec:reduction), the geometry and the dual identity (Section sec:geometry), stationarity
    (Lemma cal:stationarity -- the Hessian step needs the EXACT stationary point (p, x_0)), the energy identity (used
    above only as a cross-check), Corollary cor:bhs;
  - the truncation estimates of Section sec:tails: their printed arithmetic is checked (part 7) and their hypothesis, the
    finite-core premise, is decided here (9b), but the derivation of the 10^-11 query error they deliver for f_0, e and two
    derivatives on [b, l] is theory, and the sweeps add exactly that 10^-11;
  - the paper's own radial table (midpoint propagation, the 45000-step lambda sums) and its K-integral G_ss mesh are not
    reproduced: the same mathematical quantities are enclosed here by other routes (closed forms and Taylor integration;
    Fejer quadrature with a complex-ball error bound for lambda, mu, K).
"""
import json
import math
import os
import re
import sys
import time
from fractions import Fraction
from bisect import bisect_left, bisect_right
from math import comb, factorial, gcd, isqrt

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


# ======================================================================================================
# 9. jets: [F_0, ..., F_N] with F_j a ball enclosing F^{(j)}(t)/j! (comp:arithmetic, "interval jets").  The
#    variable on a ball T is (T, 1, 0, ...); with a thin T the coefficients are point values, with a cell-wide T they
#    are the natural interval extensions of the derivative formulas, hence enclose every value on the cell.
# ======================================================================================================
Z0 = (0, 0)
ONEB = (ONE, 0)


def jconst(a, N):
    return [a] + [Z0] * N


def jvar(T, N):
    return [T, ONEB] + [Z0] * (N - 1)


def jadd(A, B):
    return [(a[0] + b[0], a[1] + b[1]) for a, b in zip(A, B)]


def jsub(A, B):
    return [(a[0] - b[0], a[1] + b[1]) for a, b in zip(A, B)]


def jneg(A):
    return [(-a[0], a[1]) for a in A]


def jmul(A, B):
    out = []
    n = min(len(A), len(B))
    for j in range(n):
        m = r = 0
        for i in range(j + 1):
            am, ar = A[i]
            bm, br = B[j - i]
            m += am * bm
            r += abs(am) * br + abs(bm) * ar + ar * br
        out.append((m >> PREC, (r >> PREC) + 2))
    return out


def jsc(A, c):
    """scalar ball times jet"""
    cm, cr = c
    ac = abs(cm)
    return [((a[0] * cm) >> PREC, ((abs(a[0]) * cr + ac * a[1] + a[1] * cr) >> PREC) + 2) for a in A]


def jint(A, n):
    """exact integer times jet"""
    return [(a[0] * n, a[1] * abs(n)) for a in A]


def jq(A, q):
    q = Fr(q)
    if q.denominator == 1:
        return jint(A, q.numerator)
    return jsc(A, rq(q))


def jmulvar(A, T):
    """A times the variable jet (T, 1, 0, ...)"""
    out = [rmul(A[0], T)]
    for j in range(1, len(A)):
        out.append(radd(rmul(A[j], T), A[j - 1]))
    return out


def jinv(A):
    b0 = rinv(A[0])
    B = [b0]
    for j in range(1, len(A)):
        s = Z0
        for i in range(1, j + 1):
            s = radd(s, rmul(A[i], B[j - i]))
        B.append(rneg(rmul(s, b0)))
    return B


def jder(A):
    """the jet of F' (one order less)"""
    return [(A[j][0] * j, A[j][1] * j) for j in range(1, len(A))]


def jlogvar(T, N):
    """log of the variable: (log T, 1/T, -1/(2T^2), 1/(3T^3), ...)"""
    out = [rlog(T)]
    iT = rinv(T)
    pw = ONEB
    for j in range(1, N + 1):
        pw = rmul(pw, iT)
        t = rdivint(pw, j)
        out.append(t if j % 2 else rneg(t))
    return out


def jpoly(coefs, X):
    """sum coefs[i] X^i by Horner; coefs are Fractions or balls"""
    N = len(X) - 1
    acc = None
    for cf in reversed(coefs):
        cb = rq(cf) if not isinstance(cf, tuple) else cf
        if acc is None:
            acc = jconst(cb, N)
        else:
            acc = jmul(acc, X)
            acc[0] = radd(acc[0], cb)
    return acc


def wsum(jets, weights, L):
    """sum_i (weights[i] / L) jets[i], integer weights, one rounding per coefficient"""
    out = []
    for n in range(len(jets[0])):
        m = sum(w * J[n][0] for w, J in zip(weights, jets))
        r = sum(abs(w) * J[n][1] for w, J in zip(weights, jets))
        out.append((m // L, -(-r // L) + 1))
    return out


def lcm_of(xs):
    L = 1
    for x in xs:
        L = L * x // gcd(L, x)
    return L


SPOLY = [Fr(0), Fr(0), Fr(0), Fr(10), Fr(-15), Fr(6)]                      # S(y) = 10y^3 - 15y^4 + 6y^5
PPOLY = [Fr(0), Fr(1), Fr(0), -6 / HS ** 2, 8 / HS ** 3, -3 / HS ** 4]     # P(z)
QPOLY = [Fr(0), Fr(0), Fr(1, 2), -Fr(3, 2) / HS, Fr(3, 2) / HS ** 2, -Fr(1, 2) / HS ** 3]   # Q(z)
NMODE = MMAX + 1                                                            # modes 0..38
KAP = [1] + list(range(1, MMAX + 1))                                        # k_i / 6
KLIST = [6 * m for m in range(1, MMAX + 1)]                                 # distinct exponents


class RadialJets:
    """the truncated radial functions (modes 0..38) of 04-calibration.tex as jets on each spline piece.
    pieces: 0 = [b, p-c] (inner, b_m = 0), 1 = [p-c, p] (inner continuation), 2 = [p, R_0] (edge polynomial),
            3 = [R_0, R_0+.001] (tau = 0), 4 = [R_0+.001, R_0+.075] (Hermite + tau), 5 = [R_0+.075, l] (constant + tau)"""

    def __init__(self, c):
        self.c = c
        am = {m: (c[m] if m % 2 == 0 else rneg(c[m])) for m in range(1, MMAX + 1)}
        self.am = am
        e = [2] + [6 * m for m in range(1, MMAX + 1)]
        v = [PI] + [rmul(rq(6 * m), am[m]) for m in range(1, MMAX + 1)]
        self.e, self.v = e, v
        s2 = {}
        for i in range(NMODE):
            for j in range(NMODE):
                E = e[i] + e[j]
                s2[E] = radd(s2.get(E, Z0), rdivint(rmul(v[i], v[j]), E))
            s2[e[i]] = radd(s2.get(e[i], Z0), rneg(rdivint((2 * v[i][0], 2 * v[i][1]), e[i])))
        self.s2 = s2
        self.LH = lcm_of([e[i] + k for i in range(NMODE) for k in KLIST])
        self.HW = {k: [self.LH // (e[i] + k) for i in range(NMODE)] for k in KLIST}
        self.s1 = {m: rdivint(am[m], 6 * m + 2) for m in range(1, MMAX + 1)}
        self.LM = lcm_of(range(2, 2 * MMAX + 1))
        self.QWf = [[6 * ki * kj * self.LM // (ki + kj) for kj in KAP] for ki in KAP]   # k_i k_j/(k_i+k_j), over LM
        self.QWe = [[self.LM // (ki + kj) for kj in KAP] for ki in KAP]                # 1/(2(k_i+k_j)), over 12 LM
        self.LD = lcm_of([6 * ki + 2 for ki in KAP])
        self.DW = [self.LD // (6 * ki + 2) for ki in KAP]
        # the Hermite data at R_0 (cal:continuation): gamma and V_m with two derivatives
        iR = rinv(R0)
        self.g = (radd(rneg(LOGR0), rdivint(rmul(PI, R02), 2)), radd(rneg(iR), rmul(PI, R0)), radd(rmul(iR, iR), PI))
        self.V0, self.V1, self.V2 = {}, {}, {}
        for m in range(1, MMAX + 1):
            k = 6 * m
            rk = rpow(R0, k)
            self.V0[m] = rmul(am[m], rk)
            self.V1[m] = rmul(rmul(am[m], rq(k)), rmul(rk, iR))
            self.V2[m] = rmul(rmul(am[m], rq(-k * (2 * k + 1))), rmul(rk, rmul(iR, iR)))
        self.A = tuple(self._sum(d) for d in (self.V0, self.V1, self.V2))
        # inner continuation T_0m, T_1m, T_2m (cal:inner-continuation)
        self.T = {}
        for m in range(1, MMAX + 1):
            k = 6 * m
            T0 = rmul(c[m], rpow(P_, k))
            T1 = rmul(rq(-k * (k - 1)), rmul(T0, rinv(P_)))
            T2 = rmul(rq(Fr(k * (k - 1)) * (Fr((k - 2) * (k - 3), 6) - Fr(1, 2))), rmul(T0, rinv(P2)))
            self.T[m] = (T0, T1, T2)
        # rho_1 = Re((p + i w)^6) = p^6 - 15 p^4 y + 15 p^2 y^2 - y^3, y = t^2 - p^2
        p4 = rmul(P2, P2)
        self.rho1 = [rmul(p4, P2), rmul(rq(-15), p4), rmul(rq(15), P2), rq(-1)]

    @staticmethod
    def _sum(d):
        s = Z0
        for x in d.values():
            s = radd(s, x)
        return s

    # ----------------------------------------------------------------------------------------------------
    def powers(self, X, top):
        """u = t^2, W[n] = t^{6n} for n <= top"""
        u = jmul(X, X)
        w = jmul(jmul(u, u), u)
        W = [jconst(ONEB, len(X) - 1), w]
        for _ in range(2, top + 1):
            W.append(jmul(W[-1], w))
        return u, W

    def closed_integrals(self, X, u, W):
        """S_1, S_2, H_k on (0, R_0] by comp:initial-integrals (exact identities)"""
        N = len(X) - 1
        logX = jlogvar(X[0], N)
        uW = {m: jmul(u, W[m]) for m in range(1, MMAX + 1)}
        u2 = jmul(u, u)
        S1 = jadd(jsc(u, rq(Fr(1, 4))), jneg(jmul(jq(u, Fr(1, 2)), logX)))
        S1 = jadd(S1, jsc(u2, rdivint(PI, 8)))
        for m in range(1, MMAX + 1):
            S1 = jadd(S1, jsc(uW[m], self.s1[m]))
        S2 = jadd(jsc(u, self.s2[2]), jsc(u2, self.s2[4]))
        for E, cf in self.s2.items():
            if E in (2, 4):
                continue
            if E % 6 == 0:
                S2 = jadd(S2, jsc(W[E // 6], cf))
            else:
                S2 = jadd(S2, jsc(uW[(E - 2) // 6], cf))
        Y = [jsc(u, PI)] + [jsc(W[m], self.v[m]) for m in range(1, MMAX + 1)]   # v_i t^{e_i}
        H = {k: wsum(Y, self.HW[k], self.LH) for k in KLIST}
        Ysum = Y[0]
        for y in Y[1:]:
            Ysum = jadd(Ysum, y)
        B1 = jmul(Ysum, jinv(X))                                             # B_1 = sum v_i t^{e_i - 1}
        return logX, S1, S2, H, B1

    def modes_inner(self, X, u, W, piece):
        """D_i, i = 0..38, on pieces 0, 1, 2 (D_0 = 0 there)"""
        N = len(X) - 1
        D = [jconst(Z0, N)]
        if piece == 0:
            for m in range(1, MMAX + 1):
                D.append(jneg(jsc(W[m], self.am[m])))
        elif piece == 1:
            y = jq(jadd(X, jconst(rneg(radd(P_, rq(-CC))), N)), 1 / CC)     # (t - p + c)/c
            Sy = jpoly(SPOLY, y)
            x = jadd(X, jconst(rneg(P_), N))                                   # t - p
            x2 = jmul(x, x)
            for m in range(1, MMAX + 1):
                T0, T1, T2 = self.T[m]
                q = jadd(jadd(jconst(T0, N), jsc(x, T1)), jsc(x2, T2))
                D.append(jsub(jmul(Sy, q), jsc(W[m], self.am[m])))
        else:
            y = jsub(u, jconst(P2, N))
            r1 = jpoly(self.rho1, y)
            u6 = W[2]
            rho_prev, rho = jconst(ONEB, N), r1
            two_r1 = jint(r1, 2)
            for m in range(1, MMAX + 1):
                D.append(jsc(jsub(rho, jint(W[m], 1 if m % 2 == 0 else -1)), self.c[m]))   # c_m (rho_m - (-1)^m t^k)
                rho_prev, rho = rho, jsub(jmul(two_r1, rho), jmul(u6, rho_prev))
        return D

    def spline(self, X, piece):
        """B, B_1 and D_i on the spline pieces 3, 4, 5 (cal:radial-data); X has order N, B_1 order N-1"""
        N = len(X) - 1
        z = jadd(X, jconst(rneg(R0), N))
        S1v = jpoly(SPOLY, jint(z, 10))
        omS = jsub(jconst(ONEB, N), S1v)
        if piece == 3:
            tau = jconst(Z0, N)
        else:
            tau = jpoly(SPOLY, jq(jadd(z, jconst(rq(Fr(-1, 1000)), N)), Fr(40, 3)))
        omt = jsub(jconst(ONEB, N), tau)
        if piece in (3, 4):
            Pz, Qz = jpoly(PPOLY, z), jpoly(QPOLY, z)
        else:
            Pz = Qz = jconst(Z0, N)
        u, W = self.powers(X, MMAX)
        Ar = jconst(Z0, N)
        for m in range(1, MMAX + 1):
            Ar = jadd(Ar, jsc(W[m], self.am[m]))
        logX = jlogvar(X[0], N)
        gam = jadd(jneg(logX), jsc(u, rdivint(PI, 2)))
        g0, g1, g2 = self.g
        Hg = jadd(jconst(g0, N), jadd(jsc(Pz, g1), jsc(Qz, g2)))
        A0, A1, A2 = self.A
        HV = jadd(jconst(A0, N), jadd(jsc(Pz, A1), jsc(Qz, A2)))
        B = jadd(jmul(omt, jadd(gam, jmul(omS, Ar))), jmul(tau, jadd(Hg, HV)))
        B1 = jadd(jder(B), jinv(X)[:N])
        D = [jmul(omt, jsub(Hg, gam))]
        for m in range(1, MMAX + 1):
            HVm = jadd(jconst(self.V0[m], N), jadd(jsc(Pz, self.V1[m]), jsc(Qz, self.V2[m])))
            Um = jmul(jsc(W[m], self.am[m]), omS)
            D.append(jmul(omt, jsub(HVm, Um)))
        return dict(B=B, B1=B1, D=D, u=u, W=W, logX=logX)

    # ----------------------------------------------------------------------------------------------------
    def f0e(self, X, u, logX, S1, S2, H, D, N):
        """f_0 and e (cal:f0-e) as jets of order N, from S_1, S_2, H_k (order N) and D_i (order N+1)"""
        Dn = [d[:N + 1] for d in D]
        uN, logN = u[:N + 1], logX[:N + 1]
        sumD = wsum(Dn, self.DW, self.LD)
        src = jadd(S1[:N + 1], jmul(uN, sumD))
        lin = jconst(Z0, N)
        for i in range(NMODE):
            k = 6 * KAP[i]
            lin = jadd(lin, jadd(jint(Dn[i], -2), jint(jmul(Dn[i], H[k][:N + 1]), 2 * k)))
        quad = jconst(Z0, N)
        for i in range(NMODE):
            y = wsum(Dn, self.QWf[i], self.LM)
            quad = jadd(quad, jmul(Dn[i], y))
        rest = jadd(jadd(logN, S2[:N + 1]), jadd(lin, quad))
        f0 = jadd(jsc(src, (-2 * PI[0], 2 * PI[1])), jsc(rest, rq(Fr(-1, 2))))
        XN = X[:N + 1]
        Q = [jsub(jmulvar(jder(D[i])[:N + 1], XN[0]) if N >= 0 else None, jint(Dn[i], 6 * KAP[i])) for i in range(NMODE)]
        e = jconst(Z0, N)
        for i in range(NMODE):
            y = wsum(Q, self.QWe[i], 12 * self.LM)
            e = jadd(e, jmul(Q[i], y))
        return f0, e


# ======================================================================================================
# 10. the radial table on [b, l]: nodes, Taylor data at each node, third-derivative ranges on each cell
# ======================================================================================================
DENS = (8000, 24000)                     # cells per unit length on [b, p-c] and on the later pieces (as the paper)
_RJ = {}                                 # the RadialJets object, inherited by forked workers


def knots():
    return [rq(B_EDGE), rsub(P_, rq(CC)), P_, R0, radd(R0, rq(Fr(1, 1000))), radd(R0, rq(HS)), L_]


def table_cells(dens=DENS):
    """[(piece, v, u)]: every piece cut into n = floor(density * length) + 1 equal cells (affine nodes)"""
    kn = knots()
    cells = []
    for piece in range(6):
        a, b = kn[piece], kn[piece + 1]
        L = rhi(rsub(b, a))
        n = int((dens[0] if piece == 0 else dens[1]) * L) + 1
        w = rsub(b, a)
        nodes = [a] + [radd(a, rdivint(rmul(w, rq(i)), n)) for i in range(1, n)] + [b]
        for i in range(n):
            cells.append((piece, nodes[i], nodes[i + 1]))
    return cells


def cellball(v, u):
    return rinterval(rlo(v), rhi(u))


def hjet(H0, B1, X, k, N):
    """H_k as a jet from its value and the ODE H_k' = B_1 - k H_k / t (comp:radial-odes, comp:jet-ode)"""
    iX = jinv(X[:N + 1])
    H = [H0]
    for j in range(N):
        s = Z0
        for r in range(j + 1):
            s = radd(s, rmul(H[r], iX[j - r]))
        H.append(rdivint(rsub(B1[j], rmul(rq(k), s)), j + 1))
    return H


def premise_terms(B1, D):
    """|B_1|_{2,t} and sum (k_i+1)^3 |D_i|_{3,t} (tail:finite-core-premise), upper bounds over the jet's ball"""
    b = sum(Fr(abs(B1[q][0]) + B1[q][1], ONE) for q in range(3))
    s = Fr(0)
    for i in range(NMODE):
        k = 6 * KAP[i]
        s += (k + 1) ** 3 * sum(Fr(abs(D[i][q][0]) + D[i][q][1], ONE) for q in range(4))
    return b, s


def increment_job(cell):
    """pass 1 on the spline pieces: int_v^u of t B, -2B_1 + t B_1^2 and t^k B_1 by Taylor order 2 at v plus the
    order-3 coefficient's range on the cell times h^4/4"""
    R = _RJ['R']
    piece, v, u = cell
    h = rsub(u, v)
    hp = [rpow(h, j) for j in range(1, 5)]
    out = []
    for kind in ('point', 'cell'):
        if kind == 'point':
            X = jvar(v, 3)
        else:
            X = jvar(cellball(v, u), 4)
        sp = R.spline(X, piece)
        N = 2 if kind == 'point' else 3
        B, B1, W = sp['B'], sp['B1'], sp['W']
        Y1 = jmulvar(B[:N + 1], X[0])
        Y2 = jadd(jint(B1[:N + 1], -2), jmulvar(jmul(B1[:N + 1], B1[:N + 1]), X[0]))
        Yk = {k: jmul(W[k // 6][:N + 1], B1[:N + 1]) for k in KLIST}
        out.append((Y1, Y2, Yk))
    (P1, P2_, Pk), (C1, C2, Ck) = out

    def integ(Pj, Cj):
        s = Z0
        for j in range(3):
            s = radd(s, rdivint(rmul(Pj[j], hp[j]), j + 1))
        return radd(s, rdivint(rmul(Cj[3], hp[3]), 4))
    return integ(P1, C1), integ(P2_, C2), {k: integ(Pk[k], Ck[k]) for k in KLIST}


def node_job(args):
    """pass 3: the Taylor data at the left node (f_0, e and two derivatives) and the third-derivative ranges on the
    cell, plus the finite-core premise terms on the cell"""
    R = _RJ['R']
    cell, start = args
    piece, v, u = cell
    C = cellball(v, u)
    res = {}
    for kind, T, N in (('point', v, 2), ('cell', C, 3)):
        X = jvar(T, N + 1)
        if piece == 0:
            u2, W = R.powers(X, MMAX)
            logX = jlogvar(T, N + 1)
            uu = jmul(u2, u2)
            f0 = jsub(jmul(jsub(jsc(u2, PI), jconst(rq(Fr(1, 2)), N + 1)), logX),
                      jsc(uu, rdivint(rmul(rq(3), rmul(PI, PI)), 8)))[:N + 1]          # comp:inner-exact
            e = jconst(Z0, N)
            Y = [jsc(u2, PI)] + [jsc(W[m], R.v[m]) for m in range(1, MMAX + 1)]
            Ys = Y[0]
            for y in Y[1:]:
                Ys = jadd(Ys, y)
            B1 = jmul(Ys, jinv(X))
            D = R.modes_inner(X, u2, W, 0)
        elif piece <= 2:
            u2, W = R.powers(X, 2 * MMAX)
            logX, S1, S2, H, B1 = R.closed_integrals(X, u2, W)
            D = R.modes_inner(X, u2, W, piece)
            f0, e = R.f0e(X, u2, logX, S1, S2, H, D, N)
        else:
            sp = R.spline(X, piece)
            B, B1, D, u2, logX = sp['B'], sp['B1'], sp['D'], sp['u'], sp['logX']
            Y1 = jmulvar(B[:N], T)
            Y2 = jadd(jint(B1[:N], -2), jmulvar(jmul(B1[:N], B1[:N]), T))
            if kind == 'point':
                S1v, S2v, Hv = start
                S1 = [S1v] + [rdivint(Y1[j], j + 1) for j in range(N)]
                S2 = [S2v] + [rdivint(Y2[j], j + 1) for j in range(N)]
                H = {k: hjet(Hv[k], B1, X, k, N) for k in KLIST}
            else:
                S1v, S2v, Hv = start
                S1 = [Z0] + [rdivint(Y1[j], j + 1) for j in range(N)]      # order 0 never used for the top coefficient
                S2 = [Z0] + [rdivint(Y2[j], j + 1) for j in range(N)]
                hh = rhi(rsub(u, v))
                b1 = B1[0]
                lo_b, hi_b = min(Fr(0), rlo(b1)), max(Fr(0), rhi(b1))
                extra = rinterval(hh * lo_b, hh * hi_b)
                ratio = rmul(v, rinv(T))
                H = {}
                for k in KLIST:
                    H0 = radd(rmul(rpow(ratio, k), Hv[k]), extra)
                    H[k] = hjet(H0, B1, X, k, N)
            f0, e = R.f0e(X, u2, logX, S1, S2, H, D, N)
        res[kind] = (f0, e, B1, D)
    f0p, ep, _, _ = res['point']
    f0c, ec, B1c, Dc = res['cell']
    prem = premise_terms(B1c, Dc)
    return dict(F=f0p[:3], E=ep[:3], F3=f0c[3], E3=ec[3], prem=prem)


def build_table(c, workers=3, dens=DENS, log=None):
    """the radial table; workers <= 3"""
    import multiprocessing
    R = RadialJets(c)
    _RJ['R'] = R
    cells = table_cells(dens)
    sp_idx = [i for i, cl in enumerate(cells) if cl[0] >= 3]
    ctx = multiprocessing.get_context('fork')
    t0 = time.time()
    with ctx.Pool(workers) as pool:
        incs = pool.map(increment_job, [cells[i] for i in sp_idx], chunksize=8)
    t1 = time.time()
    # pass 2: S_1, S_2, H_k at the nodes of [R_0, l], starting from the exact identities at R_0
    X = jvar(R0, 1)
    u2, W = R.powers(X, 2 * MMAX)
    _, S1, S2, H, _ = R.closed_integrals(X, u2, W)
    s1, s2, hk = S1[0], S2[0], {k: H[k][0] for k in KLIST}
    starts = {}
    for idx, (d1, d2, dk) in zip(sp_idx, incs):
        piece, v, u = cells[idx]
        starts[idx] = (s1, s2, dict(hk))
        s1, s2 = radd(s1, d1), radd(s2, d2)
        ratio = rmul(v, rinv(u))
        iu = rinv(u)
        hk = {k: radd(rmul(rpow(ratio, k), hk[k]), rmul(rpow(iu, k), dk[k])) for k in KLIST}
    end = (s1, s2, hk)
    t2 = time.time()
    jobs = [(cells[i], starts.get(i)) for i in range(len(cells))]
    with ctx.Pool(workers) as pool:
        data = pool.map(node_job, jobs, chunksize=4)
    t3 = time.time()
    if log is not None:
        log.update(t_increments=t1 - t0, t_accumulate=t2 - t1, t_nodes=t3 - t2, ncells=len(cells), nspline=len(sp_idx))
    return dict(cells=cells, data=data, end=end, R=R)


# ======================================================================================================
# 11. the sweeps, in fixed-point outward intervals: (lo, hi) integers meaning [lo/2^PS, hi/2^PS]
# ======================================================================================================
PS = 100
SH_ = PREC - PS
EPS_TAIL = Fr(1, 10 ** 11)          # tail:uniform-error (analytic, conditional on the premise decided here)
_SW = {}                            # the fixed-point table, inherited by forked workers


def fxb(a):
    """ball -> outward fixed-point interval"""
    return ((a[0] - a[1]) >> SH_, -((-(a[0] + a[1])) >> SH_))


def fxq(q):
    q = Fr(q) * (1 << PS)
    return (q.numerator // q.denominator, -(-q.numerator // q.denominator))


def iadd(a, b):
    return (a[0] + b[0], a[1] + b[1])


def isub(a, b):
    return (a[0] - b[1], a[1] - b[0])


def ineg(a):
    return (-a[1], -a[0])


def imul(a, b):
    p1, p2, p3, p4 = a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]
    return (min(p1, p2, p3, p4) >> PS, -((-max(p1, p2, p3, p4)) >> PS))


def iint(a, n):
    return (a[0] * n, a[1] * n) if n >= 0 else (a[1] * n, a[0] * n)


def iinv(a):
    """1/a for a > 0"""
    if a[0] <= 0:
        raise ZeroDivisionError('interval meets 0')
    Q2 = 1 << (2 * PS)
    return (Q2 // a[1], -(-Q2 // a[0]))


def ihull(a, b):
    return (min(a[0], b[0]), max(a[1], b[1]))


def isqr(a):
    if a[0] >= 0:
        return ((a[0] * a[0]) >> PS, -((-(a[1] * a[1])) >> PS))
    if a[1] <= 0:
        return ((a[1] * a[1]) >> PS, -((-(a[0] * a[0])) >> PS))
    return (0, -((-max(a[0] * a[0], a[1] * a[1])) >> PS))


def isqrt_i(a):
    return (isqrt(a[0] << PS), isqrt(a[1] << PS) + 1)


def fixed_table(T, consts):
    """the radial table in fixed point; every tuple component widened by EPS_TAIL"""
    cells, data = T['cells'], T['data']
    VL, VH, UL, UH = [], [], [], []
    TMF, TME = [], []
    for (piece, v, u), d in zip(cells, data):
        vl, vh = fxb(v)
        ul, uh = fxb(u)
        VL.append(vl); VH.append(vh); UL.append(ul); UH.append(uh)
        TMF.append([fxb(x) for x in d['F']] + [fxb(d['F3'])])
        TME.append([fxb(x) for x in d['E']] + [fxb(d['E3'])])
    lam, mu, K = fxb(consts['lam']), fxb(consts['mu']), fxb(consts['K'])
    pib = fxb(rmul(PI, consts['Bl']))
    f0l = fxb(consts['f0l'])
    ll, lh = fxb(L_)
    epsw = fxq(EPS_TAIL)[1]
    tab = dict(VL=VL, VH=VH, UL=UL, UH=UH, TMF=TMF, TME=TME, lam=lam, mu=mu, K=K, piB=pib, f0l=f0l, l=(ll, lh), epsw=epsw,
               n=len(cells))
    # per-cell full ranges (delta over [0, h]) of the six components, for the global derivative bounds (sparse tables)
    full = [cell_ranges(tab, i, 0, UH[i] - VL[i]) for i in range(len(cells))]
    tab['full'] = full
    tab['sparse'] = sparse_build(full)
    # value-only affine models: f_0 in F0 + F1 delta + R with R = F2[0,h^2] + F3[0,h^3]
    aff = []
    for i in range(len(cells)):
        h = UH[i] - VL[i]
        h2 = -((-(h * h)) >> PS)
        h3 = -((-(h2 * h)) >> PS)
        rows = []
        for tm in (TMF[i], TME[i]):
            R2 = imul(tm[2], (0, h2))
            R3 = imul(tm[3], (0, h3))
            c0 = iadd(iadd(tm[0], R2), R3)
            rows.append((c0[0] - epsw, c0[1] + epsw, tm[1][0], tm[1][1]))
        aff.append(rows)
    tab['aff'] = aff
    return tab


def _mpos(F, dl, dh):
    """F * delta for delta in [dl, dh], 0 <= dl"""
    a, b = F
    return ((a * dl if a >= 0 else a * dh) >> PS, -((-(b * dh if b >= 0 else b * dl)) >> PS))


def cell_ranges(tab, i, dl, dh):
    """the six components f0, f0', f0'', e, e', e'' for t = v_i + delta, delta in [dl, dh] (Taylor model), widened by eps"""
    out = []
    d2l, d2h = (dl * dl) >> PS, -((-(dh * dh)) >> PS)
    d3l, d3h = (d2l * dl) >> PS, -((-(d2h * dh)) >> PS)
    w = tab['epsw']
    for tm in (tab['TMF'][i], tab['TME'][i]):
        F0, F1, F2, F3 = tm
        v0 = iadd(iadd(F0, _mpos(F1, dl, dh)), iadd(_mpos(F2, d2l, d2h), _mpos(F3, d3l, d3h)))
        v1 = iadd(iadd(F1, _mpos(iint(F2, 2), dl, dh)), _mpos(iint(F3, 3), d2l, d2h))
        v2 = iadd(iint(F2, 2), _mpos(iint(F3, 6), dl, dh))
        out += [(v0[0] - w, v0[1] + w), (v1[0] - w, v1[1] + w), (v2[0] - w, v2[1] + w)]
    return out


def sparse_build(full):
    levels = [full]
    n = len(full)
    step = 1
    while 2 * step <= n:
        prev = levels[-1]
        levels.append([[ihull(a, b) for a, b in zip(prev[i], prev[i + step])] for i in range(n - 2 * step + 1)])
        step *= 2
    return levels


def sparse_hull(levels, i, j):
    """hull of cells i..j inclusive"""
    L = (j - i + 1).bit_length() - 1
    a, b = levels[L][i], levels[L][j - (1 << L) + 1]
    return [ihull(x, y) for x, y in zip(a, b)]


def exterior_tuple(tab, T):
    """tail:exterior-formula on T intersected with [l, inf): f_0 = f_0(l) - pi B(l)(t^2 - l^2), e = 0"""
    ll, lh = tab['l']
    Tp = (max(T[0], ll), T[1])
    pib = tab['piB']
    tt = isub(isqr(Tp), (((ll * ll) >> PS), -((-(lh * lh)) >> PS)))
    f0 = isub(tab['f0l'], imul(pib, tt))
    f1 = ineg(imul(iint(pib, 2), Tp))
    f2 = ineg(iint(pib, 2))
    z = (0, 0)
    return [f0, f1, f2, z, z, z]


def query(tab, T, precise=True):
    """hull of the six components over every true radius in T (T within [b, inf)); comp:lookup"""
    VL, VH, UH = tab['VL'], tab['VH'], tab['UH']
    res = None
    if T[0] <= UH[-1]:
        i0 = bisect_left(UH, T[0])                    # first cell with right end >= T_lo
        i1 = min(bisect_right(VL, T[1]) - 1, tab['n'] - 1)
        i0 = max(i0, 0)
        if i1 >= i0:
            if precise or i1 - i0 < 3:
                for i in range(i0, i1 + 1):
                    dl = max(0, T[0] - VH[i])
                    dh = min(UH[i] - VL[i], T[1] - VL[i])
                    r = cell_ranges(tab, i, dl, dh)
                    res = r if res is None else [ihull(a, b) for a, b in zip(res, r)]
            else:
                res = sparse_hull(tab['sparse'], i0, i1)
    if T[1] >= tab['l'][0]:
        r = exterior_tuple(tab, T)
        res = r if res is None else [ihull(a, b) for a, b in zip(res, r)]
    return res


def gfamily(tab, d, s, which):
    """G and the derivatives in `which` on the rectangle d x s (comp:rational-derivatives, comp:G-derivatives)"""
    d2, s2 = isqr(d), isqr(s)
    u = iadd(d2, s2)
    t = isqrt_i(u)
    tup = query(tab, t, precise=which.get('precise', True))
    f0, f01, f02, e, e1, e2 = tup
    lam, mu = tab['lam'], tab['mu']
    f = isub(isub(f0, imul(lam, (u[0] // 2, -(-u[1] // 2)))), mu)
    f1 = isub(f01, imul(lam, t))
    f2 = isub(f02, lam)
    iu = iinv(u)
    it = iinv(t)
    idd = iinv(d)
    iu2 = imul(iu, iu)
    A = imul(d, iu)
    Z = ineg(imul(imul(s2, idd), iu))
    out = {}
    if 'G' in which:
        out['G'] = iadd(imul(A, f), imul(Z, e))
    rd, rs = imul(d, it), imul(s, it)
    if 'Gd' in which or 'Gdd' in which:
        Ad = imul(isub(s2, d2), iu2)
        Zd = iadd(Ad, isqr(idd))
    if 'Gs' in which or 'Gss' in which:
        As_ = ineg(iint(imul(imul(d, s), iu2), 2))
    if 'Gd' in which:
        out['Gd'] = iadd(iadd(imul(Ad, f), imul(imul(A, f1), rd)), iadd(imul(Zd, e), imul(imul(Z, e1), rd)))
    if 'Gs' in which:
        out['Gs'] = iadd(iadd(imul(As_, f), imul(imul(A, f1), rs)), iadd(imul(As_, e), imul(imul(Z, e1), rs)))
    if 'Gdd' in which or 'Gss' in which:
        iu3 = imul(iu2, iu)
        Add = imul(iint(imul(d, isub(d2, iint(s2, 3))), 2), iu3)
        s2u, d2u = imul(s2, iu), imul(d2, iu)          # 1 - r_d^2 and 1 - r_s^2
    if 'Gdd' in which:
        Zdd = isub(Add, iint(imul(isqr(idd), idd), 2))
        rd2 = isqr(rd)
        out['Gdd'] = iadd(iadd(iadd(imul(Add, f), iint(imul(imul(Ad, f1), rd), 2)),
                               imul(A, iadd(imul(f2, rd2), imul(imul(f1, s2u), it)))),
                          iadd(iadd(imul(Zdd, e), iint(imul(imul(Zd, e1), rd), 2)),
                               imul(Z, iadd(imul(e2, rd2), imul(imul(e1, s2u), it)))))
    if 'Gss' in which:
        Ass = ineg(Add)
        rs2 = isqr(rs)
        out['Gss'] = iadd(iadd(iadd(imul(Ass, f), iint(imul(imul(As_, f1), rs), 2)),
                               imul(A, iadd(imul(f2, rs2), imul(imul(f1, d2u), it)))),
                          iadd(iadd(imul(Ass, e), iint(imul(imul(As_, e1), rs), 2)),
                               imul(Z, iadd(imul(e2, rs2), imul(imul(e1, d2u), it)))))
    return out


def partition(cuts, hmax):
    """exact rational nodes: each [cuts[k], cuts[k+1]] in ceil(length/hmax) equal steps"""
    nodes = [Fr(cuts[0])]
    for a, b in zip(cuts, cuts[1:]):
        a, b = Fr(a), Fr(b)
        n = -(-(b - a) // Fr(hmax))
        n = int(n)
        nodes += [a + (b - a) * i / n for i in range(1, n + 1)]
    return nodes


DOM_D = (B_EDGE, D_('.697'))
DOM_S = (Fr(0), D_('.65'))
D0_RECT = ((D_('.52528'), D_('.54930')), (D_('.29420'), D_('.32621')))


def _lbounds_job(rows):
    tab = _SW['tab']
    dn, sn = _SW['ldn'], _SW['lsn']
    which = {'G': 1, 'Gd': 1, 'Gs': 1, 'Gdd': 1, 'Gss': 1, 'precise': False}
    hull = {}
    for a in rows:
        d = (fxq(dn[a])[0], fxq(dn[a + 1])[1])
        for b in range(len(sn) - 1):
            s = (fxq(sn[b])[0], fxq(sn[b + 1])[1])
            o = gfamily(tab, d, s, which)
            for k, x in o.items():
                hull[k] = ihull(hull[k], x) if k in hull else x
    return hull


def global_bounds(tab, workers=3, hmax=D_('.0008')):
    dn = partition(DOM_D, hmax)
    sn = partition(DOM_S, hmax)
    _SW['tab'], _SW['ldn'], _SW['lsn'] = tab, dn, sn
    import multiprocessing
    rows = list(range(len(dn) - 1))
    chunks = [rows[i::workers * 8] for i in range(workers * 8)]
    with multiprocessing.get_context('fork').Pool(workers) as pool:
        parts = pool.map(_lbounds_job, chunks)
    hull = {}
    for h in parts:
        for k, x in h.items():
            hull[k] = ihull(hull[k], x) if k in hull else x
    return hull, (len(dn) - 1, len(sn) - 1)


def _outer_job(idx):
    """for each d node in idx: the midpoint sums Q(d, x_k) (comp:outer-grid) and N(d) (comp:negative-part)"""
    tab, g = _SW['tab'], _SW['grid']
    dn, smid2, sh, x_in = g['dn'], g['smid2'], g['sh'], g['x_in']
    VL, VH, UH, aff, n = tab['VL'], tab['VH'], tab['UH'], tab['aff'], tab['n']
    lam_l, lam_h = tab['lam']
    mu_l, mu_h = tab['mu']
    K_l, K_h = tab['K']
    f0l_l, f0l_h = tab['f0l']
    pib_l, pib_h = tab['piB']
    ll, lh = tab['l']
    l2l, l2h = (ll * ll) >> PS, -((-(lh * lh)) >> PS)
    lastU = UH[-1]
    lo_d, hi_d = g['d0']
    best = None
    best_hi = None
    worst_neg = None
    worst_neg_lo = None
    slow = 0
    ghull = None
    for a in idx:
        d = dn[a]
        dl, dh = fxq(d)
        d2l, d2h = fxq(d * d)
        idl, idh = fxq(1 / d)
        d_in = lo_d < d < hi_d
        Ql = Qh = 0
        Nh = Nl = 0
        val = -K_h                                           # x = 0: 2Q - K = -K
        val_hi = -K_l
        loc = 0
        i = 0
        for j in range(len(sh)):
            s2l, s2h = smid2[j]
            ul, uh = d2l + s2l, d2h + s2h
            if ul > l2h:                                     # entirely in the exterior: e = 0, f_0 exact formula
                fl = f0l_l + ((-(pib_h * (uh - l2l))) >> PS)       # minus the ceiling: a lower bound
                fh = f0l_h - ((pib_l * (ul - l2h)) >> PS)          # minus the floor: an upper bound
                el = eh = 0
            else:
                tl = isqrt(ul << PS)
                th = isqrt(uh << PS) + 1
                while i < n - 1 and UH[i] < tl:
                    i += 1
                if th >= ll or (i + 1 < n and VL[i + 1] <= th) or tl < VL[i]:
                    slow += 1
                    r = query(tab, (tl, th))
                    fl, fh = r[0]
                    el, eh = r[3]
                else:
                    (c0l, c0h, c1l, c1h), (e0l, e0h, e1l, e1h) = aff[i]
                    dl_ = tl - VH[i]
                    if dl_ < 0:
                        dl_ = 0
                    dh_ = th - VL[i]
                    fl = c0l + ((c1l * dl_ if c1l >= 0 else c1l * dh_) >> PS)
                    fh = c0h - ((-(c1h * dh_ if c1h >= 0 else c1h * dl_)) >> PS)
                    el = e0l + ((e1l * dl_ if e1l >= 0 else e1l * dh_) >> PS)
                    eh = e0h - ((-(e1h * dh_ if e1h >= 0 else e1h * dl_)) >> PS)
            # f = f_0 - lambda u/2 - mu  (lambda < 0)
            fl = fl + ((-lam_h * ul) >> (PS + 1)) - mu_h
            fh = fh - ((lam_l * uh) >> (PS + 1)) - mu_l
            # numerator d f - s^2 e / d
            nl = (dl * fl if fl >= 0 else dh * fl)
            nh = (dh * fh if fh >= 0 else dl * fh)
            s2e_l = s2l * el if el >= 0 else s2h * el
            s2e_h = s2h * eh if eh >= 0 else s2l * eh
            s2e_l = s2e_l >> PS
            s2e_h = -((-s2e_h) >> PS)
            ql = (s2e_h * idh if s2e_h >= 0 else s2e_h * idl)      # upper of s^2 e / d
            qq = (s2e_l * idl if s2e_l >= 0 else s2e_l * idh)      # lower
            nl = (nl - ql) >> PS
            nh = -((-(nh - qq)) >> PS)
            # divide by u > 0
            iul, iuh = (1 << (2 * PS)) // uh, -(-(1 << (2 * PS)) // ul)
            Gl = (nl * iul if nl >= 0 else nl * iuh) >> PS
            Gh = -((-(nh * iuh if nh >= 0 else nh * iul)) >> PS)
            if ghull is None:
                ghull = [Gl, Gh]
            else:
                if Gl < ghull[0]:
                    ghull[0] = Gl
                if Gh > ghull[1]:
                    ghull[1] = Gh
            hl, hh = sh[j]
            Ql += (Gl * hl if Gl >= 0 else Gl * hh) >> PS
            Qh -= (-(Gh * hh if Gh >= 0 else Gh * hl)) >> PS
            if Gl < 0:
                Nh -= (-(-Gl * hh)) >> PS
            if Gh < 0:
                Nl += (-Gh * hl) >> PS
            if not (d_in and x_in[j + 1]):
                v = 2 * Ql - K_h
                if v < val:
                    val, loc = v, j + 1
                v = 2 * Qh - K_l
                if v < val_hi:
                    val_hi = v
        if best is None or val < best[0]:
            best = (val, a, loc)
        if best_hi is None or val_hi < best_hi:
            best_hi = val_hi
        if worst_neg is None or Nh > worst_neg[0]:
            worst_neg = (Nh, a)
        if worst_neg_lo is None or Nl > worst_neg_lo:
            worst_neg_lo = Nl
    return best, worst_neg, slow, ghull, best_hi, worst_neg_lo


def outer_negative(tab, workers=3, d0=D0_RECT, Dh=D_('.00019'), Sh=D_('.00018')):
    dn = partition([DOM_D[0], d0[0][0], d0[0][1], DOM_D[1]], Dh)
    sn = partition([DOM_S[0], d0[1][0], d0[1][1], DOM_S[1]], Sh)
    smid2 = [fxq(((a + b) / 2) ** 2) for a, b in zip(sn, sn[1:])]
    sh = [fxq(b - a) for a, b in zip(sn, sn[1:])]
    x_in = [d0[1][0] < x < d0[1][1] for x in sn]
    _SW['tab'] = tab
    _SW['grid'] = dict(dn=dn, smid2=smid2, sh=sh, x_in=x_in, d0=d0[0])
    import multiprocessing
    idx = list(range(len(dn)))
    chunks = [idx[i::workers * 16] for i in range(workers * 16)]
    with multiprocessing.get_context('fork').Pool(workers) as pool:
        parts = pool.map(_outer_job, chunks)
    best = min((p[0] for p in parts), key=lambda x: x[0])
    neg = max((p[1] for p in parts), key=lambda x: x[0])
    slow = sum(p[2] for p in parts)
    gh = [min(p[3][0] for p in parts), max(p[3][1] for p in parts)]
    mstar_hi = min(p[4] for p in parts)
    nstar_lo = max(p[5] for p in parts)
    Dmax = max(b - a for a, b in zip(dn, dn[1:]))
    Smax = max(b - a for a, b in zip(sn, sn[1:]))
    return dict(mstar=Fr(best[0], 1 << PS), mstar_hi=Fr(mstar_hi, 1 << PS), at=(dn[best[1]], sn[best[2]]),
                Nstar=Fr(neg[0], 1 << PS), Nstar_lo=Fr(nstar_lo, 1 << PS), Nat=dn[neg[1]],
                slow=slow, Ghull=(Fr(gh[0], 1 << PS), Fr(gh[1], 1 << PS)), Dh=Dmax, Sh=Smax, nd=len(dn), ns=len(sn) - 1)


def _hess_job(rows):
    tab, g = _SW['tab'], _SW['hgrid']
    dn, sn, j0 = g['dn'], g['sn'], g['j0']
    which1 = {'Gdd': 1}
    which3 = {'Gdd': 1, 'Gd': 1, 'Gs': 1}
    mins = None
    hull = None
    for a in rows:
        d = (fxq(dn[a])[0], fxq(dn[a + 1])[1])
        Aacc = (0, 0)
        for j in range(len(sn) - 1):
            s = (fxq(sn[j])[0], fxq(sn[j + 1])[1])
            hj = fxq(sn[j + 1] - sn[j])
            if j < j0:
                F1 = gfamily(tab, d, s, which1)['Gdd']
            else:
                o = gfamily(tab, d, s, which3)
                F1, B, Cc = o['Gdd'], o['Gd'], o['Gs']
                A = iadd(Aacc, imul((0, hj[1]), F1))
                det = isub(imul(A, Cc), isqr(B))
                row = (A[0], Cc[0], det[0])
                mins = row if mins is None else tuple(min(x, y) for x, y in zip(mins, row))
                cur = (A, B, Cc, det)
                hull = cur if hull is None else tuple(ihull(x, y) for x, y in zip(hull, cur))
            Aacc = iadd(Aacc, imul(hj, F1))
    return mins, hull


def hessian(tab, workers=3, d0=D0_RECT, dstep=D_('.00004'), sstep=D_('.00008')):
    dn = partition([d0[0][0], d0[0][1]], dstep)
    sn = partition([Fr(0), d0[1][0], d0[1][1]], sstep)
    j0 = sn.index(d0[1][0])
    _SW['tab'] = tab
    _SW['hgrid'] = dict(dn=dn, sn=sn, j0=j0)
    import multiprocessing
    rows = list(range(len(dn) - 1))
    chunks = [rows[i::workers * 8] for i in range(workers * 8)]
    with multiprocessing.get_context('fork').Pool(workers) as pool:
        parts = pool.map(_hess_job, chunks)
    mins = tuple(min(p[0][k] for p in parts) for k in range(3))
    hull = tuple((min(p[1][k][0] for p in parts), max(p[1][k][1] for p in parts)) for k in range(4))
    Q = 1 << PS
    return dict(Amin=Fr(mins[0], Q), Cmin=Fr(mins[1], Q), detmin=Fr(mins[2], Q),
                hull={nm: (Fr(h[0], Q), Fr(h[1], Q)) for nm, h in zip(('g_dd', 'g_dx', 'g_xx', 'det'), hull)},
                ncells=(len(dn) - 1, len(sn) - 1), ntested=(len(dn) - 1) * (len(sn) - 1 - j0))


# ======================================================================================================
# 12. running the sweeps (cached), and the printed numbers they are compared with
# ======================================================================================================
SWEEP_PRINTED = dict(L=(D_('7.4636170'), D_('2.5091315'), D_('143.7890461'), D_('315.1489689')),
                     Gpair=(D_('-.0417514'), D_('.5279383')), gmin=(D_('.0000134'), D_('.0000162')),
                     drneg=(D_('.0024879'), D_('.0024882')), outer=D_('.0000120'), negative=D_('-.0004585'),
                     gdd=D_('1.0529222'), gxx=D_('.0128335'), det=D_('.0086252'),
                     hulls={'g_dd': (D_('1.0529222'), D_('1.8021395')), 'g_dx': (D_('.0335897'), D_('.1510293')),
                            'g_xx': (D_('.0128335'), D_('.0864224')), 'det': (D_('.0086252'), D_('.1342330'))})
PREMISE_BOUND = (6000, 2 * 10 ** 6)                  # tail:finite-core-premise


def sweep_table(workers):
    C = compute()
    if 'table' not in _CACHE:
        log = {}
        t = time.time()
        _CACHE['table'] = build_table(C['cx'], workers=workers, log=log)
        log['t_table'] = time.time() - t
        _CACHE['table_log'] = log
    return _CACHE['table']


def sweep_fixed(workers, mu_shift):
    key = ('fixed', mu_shift)
    if key not in _CACHE:
        T = sweep_table(workers)
        consts = dict(compute()['out'])
        if mu_shift:
            consts['mu'] = radd(consts['mu'], rq(mu_shift))
        _CACHE[key] = fixed_table(T, consts)
    return _CACHE[key]


def sweep_bounds(workers, mu_shift):
    key = ('bounds', mu_shift)
    if key not in _CACHE:
        t = time.time()
        hull, shape = global_bounds(sweep_fixed(workers, mu_shift), workers=workers)
        Q = 1 << PS
        L = tuple(Fr(max(-hull[k][0], hull[k][1]), Q) for k in ('Gd', 'Gs', 'Gdd', 'Gss'))
        _CACHE[key] = dict(L=L, hull={k: (Fr(v[0], Q), Fr(v[1], Q)) for k, v in hull.items()}, shape=shape,
                           seconds=time.time() - t)
    return _CACHE[key]


def table_checks(checks, value):
    T = _CACHE['table']
    cells, data = T['cells'], T['data']
    tab = sweep_fixed(3, 0)
    C = compute()
    out = C['out']
    R = T['R']
    order_ok = all(tab['VH'][i] < tab['VL'][i + 1] for i in range(tab['n'] - 1)) and tab['UH'][-1] >= tab['VL'][-1]
    per_piece = [sum(1 for c_ in cells if c_[0] == p) for p in range(6)]
    check(checks, '9. the radial table (an independent construction, not the paper\'s midpoint propagation): breakpoints b, p-.06, p, R_0, R_0+.001, '
          'R_0+.075, l (comp:breakpoints), floor(8000 L)+1 / floor(24000 L)+1 cells per piece = %s, %d cells; node balls strictly increasing (comp:node-separation)'
          % (per_piece, len(cells)), order_ok and len(cells) == sum(per_piece))
    # the general sector formula reproduces comp:inner-exact at p - c, through the second derivative
    pc = rsub(P_, rq(CC))
    X = jvar(pc, 3)
    u2, W = R.powers(X, 2 * MMAX)
    logX, S1, S2, H, _ = R.closed_integrals(X, u2, W)
    D = R.modes_inner(X, u2, W, 1)
    f0g, eg = R.f0e(X, u2, logX, S1, S2, H, D, 2)
    f0x = jsub(jmul(jsub(jsc(u2, PI), jconst(rq(Fr(1, 2)), 3)), logX), jsc(jmul(u2, u2), rdivint(rmul(rq(3), rmul(PI, PI)), 8)))
    ie = all(abs(f0g[j][0] - f0x[j][0]) <= f0g[j][1] + f0x[j][1] for j in range(3)) and all(rlt(rabs_hi(eg[j]), Fr(1, 10 ** 50)) for j in range(3))
    check(checks, '9. the sector formula cal:f0-e with the closed-form integrals comp:initial-integrals reproduces the exact identity comp:inner-exact '
          'f_0 = (pi t^2 - 1/2) log t - 3 pi^2 t^4/8, e = 0 at t = p - c, through the second derivative', ie)

    # C^1 across every node (and C^2 inside each piece) of the Taylor data
    def tm(Fs, F3, h, j):
        if j == 0:
            return radd(radd(Fs[0], rmul(Fs[1], h)), radd(rmul(Fs[2], rmul(h, h)), rmul(F3, rpow(h, 3))))
        if j == 1:
            return radd(Fs[1], radd(rmul(rq(2), rmul(Fs[2], h)), rmul(rq(3), rmul(F3, rmul(h, h)))))
        return radd(rmul(rq(2), Fs[2]), rmul(rq(6), rmul(F3, h)))
    bad = 0
    for i in range(len(cells) - 1):
        piece, v, u = cells[i]
        h = rsub(u, v)
        same = cells[i + 1][0] == piece
        for key, k3 in (('F', 'F3'), ('E', 'E3')):
            for j in range(3 if same else 2):
                a = tm(data[i][key], data[i][k3], h, j)
                b = data[i + 1][key][j]
                if j == 2:
                    b = (2 * b[0], 2 * b[1])
                if abs(a[0] - b[0]) > a[1] + b[1]:
                    bad += 1
    check(checks, '9. continuity of the table: at every one of the %d interior nodes, f_0, f_0\', e, e\' from the left cell\'s Taylor model (order 2 at its '
          'node + third-derivative range on the cell) overlap the right cell\'s node values (C^1), and f_0\'\', e\'\' too inside each piece' % (len(cells) - 1), bad == 0,
          '%d disagreements' % bad)
    ip = next(i for i, c_ in enumerate(cells) if c_[0] == 2)
    iR = next(i for i, c_ in enumerate(cells) if c_[0] == 3)
    s1, s2, _ = T['end']
    f0l_t = radd(rmul((-2 * PI[0], 2 * PI[1]), s1), rmul(rq(Fr(-1, 2)), radd(rlog(L_), s2)))

    def ov(a, b):
        return abs(a[0] - b[0]) <= a[1] + b[1]
    two = ov(data[ip]['F'][0], out['f0p']) and ov(data[iR]['F'][0], out['f0R']) and ov(data[iR]['E'][0], out['eR']) and ov(f0l_t, out['f0l'])
    value['f0(l)_table'] = (dec(rlo(f0l_t), 15, -1), dec(rhi(f0l_t), 15, 1))
    check(checks, '9. two routes agree: f_0(p), f_0(R_0), e(R_0) at the table nodes overlap the sector-edge complex-ball values of part 3, and f_0(l) = '
          '-2 pi S_1(l) - (log l + S_2(l))/2 from the table\'s Taylor-integrated S_1, S_2 on [R_0, l] (%s..%s) overlaps the Fejer-route f_0(l) of part 4'
          % value['f0(l)_table'], two)


def decide(src=None, printed=None, edge=None, parts=None, workers=3, mu_shift=0, outer_rect=None, hess_rect=None, premise_bound=None):
    t0 = time.time()
    src = src or Sources()
    printed = printed or PRINTED
    edge = B_EDGE if edge is None else edge
    parts = set(parts or ('text', 'coefficients', 'constants', 'arithmetic', 'record', 'table', 'premise', 'bounds', 'outer', 'hessian'))
    outer_rect = outer_rect or D0_RECT
    hess_rect = hess_rect or D0_RECT
    premise_bound = premise_bound or PREMISE_BOUND
    workers = min(int(workers), 3)
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
        check(checks, '0. the swept objects read off the paper: D = [b,.697] x [0,.65] (comp:domain), D_0 = [.52528,.54930] x [.29420,.32621] (comp:inner-domain), '
                      'E_0, E_I (comp:outer-errors), the negative-part assertion, the Hessian entries and assertions, the premise |B_1|_{2,t} < 6000, '
                      'sum (k_i+1)^3 |D_i|_{3,t} < 2e6 (tail:finite-core-premise), the query error 10^-11 (comp:lookup)',
              all(x in flat['06-computation'] for x in ('\\mathcalD=[b,.697]\\times[0,.65]', '\\mathcalD_0=[.52528,.54930]\\times[.29420,.32621]',
                                                         'E_0=\\frac{2(.65)S_h^2L_4}{24}', 'E_I=\\frac{2\\bigl(D_h^2(.65)L_3+S_h^2L_2\\bigr)}8',
                                                         'N_*+K+.65\\left(\\frac{S_hL_2}{4}+\\frac{D_hL_1}{2}\\right)<0', '\\infA_j>0,\\qquad\\infC_j>0',
                                                         '\\epsilon=[-10^{-11},10^{-11}]'))
              and all(x in flat['05-tails'] for x in ('|\\widetildeB_1|_{2,t}<6000', '\\sum_{i=0}^{38}(k_i+1)^3|\\widetildeD_i|_{3,t}<2\\cdot10^6')))

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

    # ---------------------------------------------------------------------------------------------------- the sweeps
    sweep_parts = parts & {'table', 'premise', 'bounds', 'outer', 'hessian'}
    if sweep_parts:
        ts = time.time()
        T = sweep_table(workers)
        value['seconds_table'] = round(_CACHE['table_log'].get('t_table', time.time() - ts), 1)
        value['table_cells'] = len(T['cells'])
    if 'table' in parts:
        table_checks(checks, value)
    if 'premise' in parts:
        data = T['data']
        b1 = max(d_['prem'][0] for d_ in data)
        sD = max(d_['prem'][1] for d_ in data)
        value['premise'] = ('%.4f' % float(b1), '%.2f' % float(sD))
        check(checks, '9. the finite-core premise tail:finite-core-premise on every one of the %d cells covering [b, l] (direct interval jets of the truncated '
              'B_1 and D_i, orders 2 and 3, mesh <= 1/8000 and 1/24000 finer than the paper\'s .00022): max |B_1|_{2,t} <= %s < %d and max sum (k_i+1)^3 |D_i|_{3,t} <= %s < %d'
              % (len(data), value['premise'][0], premise_bound[0], value['premise'][1], premise_bound[1]),
              b1 < premise_bound[0] and sD < premise_bound[1])
    if 'bounds' in parts or 'outer' in parts:
        Lb = sweep_bounds(workers, mu_shift)
        L1, L2, L3, L4 = Lb['L']
        value['L1..L4'] = [dec(x, 7, 1) for x in Lb['L']]
        value['G_hull'] = (dec(Lb['hull']['G'][0], 7, -1), dec(Lb['hull']['G'][1], 7, 1))
        value['seconds_bounds'] = round(Lb['seconds'], 1)
    if 'bounds' in parts:
        Lp = SWEEP_PRINTED['L']
        check(checks, '9. global derivative bounds (comp:global-derivative-bounds) on %d x %d closed rectangles of side <= .0008 covering D = [b,.697] x [0,.65], by interval '
              'substitution in comp:G-derivatives with the radial query of comp:lookup: L_1 = %s, L_2 = %s, L_3 = %s, L_4 = %s; each at most the printed '
              'L_1 <= 7.4636170, L_2 <= 2.5091315, L_3 <= 143.7890461, L_4 <= 315.1489689, which are therefore valid bounds'
              % (Lb['shape'][0], Lb['shape'][1], value['L1..L4'][0], value['L1..L4'][1], value['L1..L4'][2], value['L1..L4'][3]),
              all(x <= y for x, y in zip(Lb['L'], Lp)))
        gp = SWEEP_PRINTED['Gpair']
        check(checks, '9. the G hull on D, [%s, %s], overlaps the record\'s G pair [-.0417514, .5279383] (both enclose the range of G on D)' % value['G_hull'],
              Lb['hull']['G'][0] <= gp[1] and gp[0] <= Lb['hull']['G'][1])
    if 'outer' in parts:
        key = ('outer', mu_shift, outer_rect)
        if key not in _CACHE:
            t = time.time()
            r = outer_negative(sweep_fixed(workers, mu_shift), workers=workers, d0=outer_rect)
            r['seconds'] = time.time() - t
            _CACHE[key] = r
        on = _CACHE[key]
        value['seconds_outer'] = round(on['seconds'], 1)
        Dh, Sh = on['Dh'], on['Sh']
        E0 = 2 * D_('.65') * Sh ** 2 * L4 / 24
        EI = 2 * (Dh ** 2 * D_('.65') * L3 + Sh ** 2 * L2) / 8
        Kv = compute()['out']['K']
        outer_lhs = on['mstar'] - E0 - EI
        er_drop = D_('.65') * (Sh * L2 / 4 + Dh * L1 / 2)
        neg_lhs = on['Nstar'] + rhi(Kv) + er_drop
        value['outer'] = dict(m_star=dec(on['mstar'], 10, -1), min_node_upper=dec(on['mstar_hi'], 10, 1), at=[str(x) for x in on['at']],
                              E0=dec(E0, 10, 1), EI=dec(EI, 10, 1), m_star_minus_E0_EI=dec(outer_lhs, 10, -1), grid='%d x %d' % (on['nd'], on['ns']),
                              Dh=str(Dh), Sh=str(Sh), slow_queries=on['slow'])
        value['negative'] = dict(N_star=dec(on['Nstar'], 10, 1), N_max_lower=dec(on['Nstar_lo'], 10, -1), at_d=str(on['Nat']), er_drop=dec(er_drop, 10, 1),
                                 lhs=dec(neg_lhs, 10, 1))
        rect = outer_rect
        check(checks, '9. comp:outer-assertion: on the %d d-nodes x %d s-steps grid (D_h = %s <= .00019, S_h = %s <= .00018, cut at the sides of D_0 = %s), '
              'every node outside int D_0 has 2Q(d,x) - K >= m_* = %s (at d = %s, x = %s); E_0 = %s, E_I = %s; m_* - E_0 - E_I = %s > 0, '
              'so 2 g_d(x) > K on D minus int D_0'
              % (on['nd'], on['ns'], dec(Dh, 9, 1), dec(Sh, 9, 1), '[%s,%s] x [%s,%s]' % tuple(dec(x, 5, 1) for x in (rect[0][0], rect[0][1], rect[1][0], rect[1][1])),
                 value['outer']['m_star'], dec(on['at'][0], 6, -1), dec(on['at'][1], 6, -1), value['outer']['E0'], value['outer']['EI'],
                 value['outer']['m_star_minus_E0_EI']), outer_lhs > 0)
        check(checks, '9. comp:negative-assertion: N_* = %s (the largest negative-part midpoint sum, at d = %s), N_* + K + .65(S_h L_2/4 + D_h L_1/2) = %s < 0, so '
              'int_0^inf max(0, -G(d,s)) ds < -K for every d >= b' % (value['negative']['N_star'], dec(on['Nat'], 6, -1), value['negative']['lhs']), neg_lhs < 0)
        if rect == D0_RECT and not mu_shift:
            gm, dr = SWEEP_PRINTED['gmin'], SWEEP_PRINTED['drneg']
            check(checks, '9. printed outer/negative numbers: m_* - E_0 - E_I = %s >= .0000120 and the left side %s <= -.0004585 (06-computation.tex:741-743); '
                          'the min over eligible nodes of 2Q - K, [%s, %s], overlaps the record\'s gmin pair [.0000134, .0000162]; max_d N(d), [%s, %s], overlaps '
                          'the record\'s drneg pair [.0024879, .0024882] (same node counts 2186 x 3612)'
                  % (value['outer']['m_star_minus_E0_EI'], value['negative']['lhs'], value['outer']['m_star'], value['outer']['min_node_upper'],
                     value['negative']['N_max_lower'], value['negative']['N_star']),
                  outer_lhs >= SWEEP_PRINTED['outer'] and neg_lhs <= SWEEP_PRINTED['negative'] and on['mstar'] <= gm[1] and gm[0] <= on['mstar_hi']
                  and on['Nstar_lo'] <= dr[1] and dr[0] <= on['Nstar'] and on['nd'] == 2186 and on['ns'] == 3612)
    if 'hessian' in parts:
        key = ('hess', mu_shift, hess_rect)
        if key not in _CACHE:
            t = time.time()
            r = hessian(sweep_fixed(workers, mu_shift), workers=workers, d0=hess_rect)
            r['seconds'] = time.time() - t
            _CACHE[key] = r
        H = _CACHE[key]
        value['seconds_hessian'] = round(H['seconds'], 1)
        value['hessian'] = dict(g_dd_min=dec(H['Amin'], 7, -1), g_xx_min=dec(H['Cmin'], 7, -1), det_min=dec(H['detmin'], 7, -1),
                                hulls={k: (dec(a, 7, -1), dec(b, 7, 1)) for k, (a, b) in H['hull'].items()}, cells=H['ncells'], tested=H['ntested'])
        inside = (hess_rect[0][0] < rlo(P_) and rhi(P_) < hess_rect[0][1] and hess_rect[1][0] < rlo(X0) and rhi(X0) < hess_rect[1][1])
        check(checks, '9. comp:hessian-assertions on all %d cells of D_0 = [%s,%s] x [%s,%s] (601 d-steps <= .00004; s-steps <= .00008 from 0, %d cells accumulated '
              'for A_j): inf A_j >= %s > 0, inf C_j >= %s > 0, inf (A_j C_j - B_j^2) >= %s > 0 on every cell; (p, x_0) in the interior of D_0, so with the '
              'exact stationarity (Lemma cal:stationarity, analytic) 2 g_d(x) >= K on D_0'
              % (H['ntested'], dec(hess_rect[0][0], 5, -1), dec(hess_rect[0][1], 5, 1), dec(hess_rect[1][0], 5, -1), dec(hess_rect[1][1], 5, 1),
                 H['ncells'][0] * H['ncells'][1], value['hessian']['g_dd_min'], value['hessian']['g_xx_min'], value['hessian']['det_min']),
              H['Amin'] > 0 and H['Cmin'] > 0 and H['detmin'] > 0 and inside)
        if hess_rect == D0_RECT and not mu_shift:
            hp = SWEEP_PRINTED['hulls']
            check(checks, '9. printed Hessian numbers (06-computation.tex:744-746): g_dd >= 1.0529222, g_xx >= .0128335, det >= .0086252 hold (the enclosures '
                          'here are tighter), and each of the four hulls overlaps the record\'s hess-hull pair',
                  H['Amin'] >= SWEEP_PRINTED['gdd'] and H['Cmin'] >= SWEEP_PRINTED['gxx'] and H['detmin'] >= SWEEP_PRINTED['det']
                  and all(H['hull'][k][0] <= hp[k][1] and hp[k][0] <= H['hull'][k][1] for k in hp))
    if {'constants', 'arithmetic', 'premise', 'bounds', 'outer', 'hessian'} <= parts and mu_shift == 0 and outer_rect == D0_RECT and hess_rect == D0_RECT:
        names = ('5. comp:tail-signs: K < 0', '9. the finite-core premise', '9. comp:outer-assertion', '9. comp:negative-assertion', '9. comp:hessian-assertions',
                 '5. comp:tail-signs: f(l)', '5. comp:tail-signs: -pi B(l)', '7. b = 28209/100000 < 1/(2 sqrt pi)', '7. .537<p<.538')
        allok = all(any(c_['check'].startswith(n) and c_['pass'] for c_ in checks) for n in names)
        check(checks, '10. Theorem comp:scalar, its finite hypotheses: K < 0, the premise, the outer and negative-part assertions, the Hessian assertions and the '
                      'exterior signs (with sqrt(b^2+.65^2) > l and l < .697 from part 7) are ALL decided here -- by an independent radial table and the '
                      'paper\'s meshes; what remains is analytic (stationarity, the truncation estimate 10^-11, the reduction and the geometry)', allok)

    value['not_decided'] = ('analytic, not finite: the reduction (sec:reduction), the geometry and dual identity (sec:geometry), Lemma cal:stationarity '
                            '(used by the Hessian step), the truncation estimates of sec:tails (their printed arithmetic is checked in part 7; the '
                            'sweeps add their 10^-11 query error, which is conditional on the finite-core premise decided here), Corollary cor:bhs. '
                            'The paper\'s own radial table (midpoint propagation) and its K-integral G_ss mesh are not reproduced: the table is '
                            'built here by another route (closed forms on [b, R_0], Taylor integration on [R_0, l]) and K by Fejer quadrature.')
    ok = all(c_['pass'] for c_ in checks)
    verdict = 'CERTIFIED' if ok else ('REFUTED' if refuting else 'REFUSED')
    value['refuting'] = refuting
    value['seconds'] = round(time.time() - t0, 1)
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': ('a finite component -- the whole finite certificate of Section sec:computation (Proposition comp:finite-soundness), by an '
                        'independent route: the 38 lattice coefficients (two ways) and |c_1| < 1; lambda, mu, K, B(l), f_0(l), f(l), -pi B(l) - lambda/2 '
                        '(closed-form/Fejer route) each inside its saved pair; the exterior signs comp:tail-signs (K < 0 included); the finite-core '
                        'premise; the global derivative bounds L_1..L_4; the outer primitive assertion (2 g_d(x) > K off int D_0) and the negative-part '
                        'assertion on the paper\'s 2186 x 3612 grid; the Hessian assertions on the 601 x 401 cells of D_0; the printed arithmetic of the '
                        'truncation sections. Not the headline: ' + value['not_decided'])}


FORGE_DETAIL = []


def _fv(res):
    """the verdict, recording which checks failed and the swept numbers behind them"""
    v = res['value']
    keep = {k: v[k] for k in ('outer', 'negative', 'hessian', 'premise') if k in v}
    FORGE_DETAIL.append(([c_['check'][:60] for c_ in res['checks'] if not c_['pass']], keep))
    return res['verdict']


def forge():
    """each must NOT certify"""
    del FORGE_DETAIL[:]
    out = []
    pr = dict(PRINTED)
    pr['lam'] = (D_('-6.7300312'), D_('-6.7300295'))
    out.append(('saved lambda pair with upper end -6.7300295 (excludes the true lambda)', _fv(decide(printed=pr, parts=['constants']))))
    pr = dict(PRINTED)
    pr['mu'] = (D_('.4138834'), D_('.4138842'))
    out.append(('saved mu pair shifted up by 4e-7', _fv(decide(printed=pr, parts=['constants']))))
    pr = dict(PRINTED)
    pr['K'] = (D_('.0034809'), D_('.0034823'))
    out.append(('K printed with the opposite sign', _fv(decide(printed=pr, parts=['constants']))))
    out.append(('domain edge b = 0.2821 (above 1/(2 sqrt pi))', _fv(decide(edge=D_('.2821'), parts=['constants']))))
    # the sweeps
    out.append(('mu raised by 2/1000 in G (K, lambda kept): the outer and negative-part sweeps re-run on the forged G',
                _fv(decide(parts=['outer'], mu_shift=Fr(2, 1000)))))
    out.append(('the excluded rectangle D_0 shrunk to [.5368,.5378] x [.3098,.3107] around (p, x_0): the outer sweep re-run on the re-cut grid',
                _fv(decide(parts=['outer'], outer_rect=((D_('.5368'), D_('.5378')), (D_('.3098'), D_('.3107')))))))
    out.append(('convexity asserted on [.52528,.54930] x [0,.32621] (D_0 extended down to s = 0, where G_s = 0 by evenness; (p, x_0) still inside): '
                'the Hessian sweep re-run on all 601 x 4079 cells', _fv(decide(parts=['hessian'], hess_rect=((D_('.52528'), D_('.54930')), (Fr(0), D_('.32621')))))))
    out.append(('the finite-core premise with 2e6 replaced by 1.7e6', _fv(decide(parts=['premise'], premise_bound=(6000, 17 * 10 ** 5)))))
    return out


if __name__ == '__main__':
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1, default=str))
    for c_ in res['checks']:
        print(('PASS ' if c_['pass'] else 'FAIL ') + c_['check'], '|', c_['detail'])
    print('sources', json.dumps(res['sources'], indent=1))
    lg = _CACHE.get('table_log', {})
    print('decide %.1fs (table %.1fs: increments %.1fs, accumulation %.1fs, node data %.1fs; bounds %s s; outer %s s; hessian %s s; workers <= 3)'
          % (time.time() - t, lg.get('t_table', 0), lg.get('t_increments', 0), lg.get('t_accumulate', 0), lg.get('t_nodes', 0),
             res['value'].get('seconds_bounds'), res['value'].get('seconds_outer'), res['value'].get('seconds_hessian')))
    t = time.time()
    for (d, v), (failed, detail) in zip(forge(), FORGE_DETAIL):
        print('FORGE', v, '--', d)
        print('      failing:', failed, json.dumps(detail, default=str))
    print('forges %.1fs' % (time.time() - t))
