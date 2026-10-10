"""F-179 -- "A sharp Fourier certificate for planar circle packing" (openai/math family 090).

THE CLAIM (build/main.tex abstract; build/sections/introduction.tex:34-41, Theorem intro:main): there is a real
radial Schwartz f on R^2 with fhat(0) = 1, f(0) = 2/sqrt3, fhat >= 0 and f(x) <= 0 for |x| >= 1 -- the
two-dimensional case of Cohn-Elkies Conjecture 7.3 (the linear-programming bound is sharp for circle packing).
Its finite evidence is Lemma interpolation:finite (interpolation.tex:204-241) and Lemma signs:bernstein
(signs.tex:95-113), proved by "the primary interval calculation in Appendix sec:certificates" (certificates.tex),
plus the scalar substitutions of certificates.tex:487-572.

THE PUBLISHED OBJECT: the two coefficient tables (51 nodes of I_f = N cap [1,100], 102 coordinates each, integers
x 1e-10; build/data/coefficients.tex = verification/data/coefficients.tsv = certificate-inputs.json), the fixed
node-zero data and constants (fourier.tex:348-351), and the two rational 6x6 matrices W_+, W_- (x 1e-4).

WHAT IS DECIDED HERE, from the LaTeX alone (no release code was opened before this decider ran). Exact arithmetic:
integers, Fractions, the field Q(sqrt3)(i) for the trigonometric data, and outward ball arithmetic over the
dyadic rationals k/2^160 (midpoint and radius are integers; every product, quotient and shift is rounded outward
and the rounding is added to the radius; nothing is a float).
  A. The data: the three copies of each table agree; the node set is N cap [1,100].
  B. Exact algebra in Q(sqrt3)(i): P = prod (2 sin(pi(s-a)/12))^2 = sum P_j e^{i pi j s/6} expanded from
     w^-6 prod (w - rho^a)^2 equals the printed (P_0..P_6) (fourier.tex:66-68); P and P' vanish at every residue;
     Q_n = P''(n)/2 and D_n = P'''(n)/(6 Q_n) by the Fourier route equal the product/cotangent formula
     (fourier.tex:88-96) and the printed table (fourier.tex:98-107) and the forms of rational-check.tex:138-145,
     all exactly; Q_n > 197192/112500 > 7/4 and |D_n| < 286/135 < 53/25 by the printed rational chain; every
     positive j^2+jk+k^2 lies in N (a residue computation mod 12) and 15 is not such a value.
  C. The envelope constants (interpolation.tex:47-106): every b*_j, a*_j, g_j exactly from |lambda|^2, |z|^2,
     Im z at t_j = j/6 (rational); beta_j against the two endpoint values of 2hBt/(t^2+h^2)^2 (unimodal: its
     derivative has the sign of h^2 - 3t^2); B^2 - 2Bh^2 = 304/225 > 0 (monotonicity); M_j from the exact
     moduli |sum_{l>=j} P_l rho^{la}|^2 and |sum (t_l - u) P_l rho^{la}|^2 in Q(sqrt3) for every residue; the atom
     masses (5,4,4,4,2,4,2); the variation constants 25, 65pi^2/18, 32pi/3; the damping minimum 26/435.
  D. The interval certificates themselves, recomputed independently:
     - K_p^(l)(m)/l! = Re int lambda e^{i pi z m} (i pi z)^l/l! dmu (the folded measure re-derived: atoms e_j C P_j
       at t_j; on (t_{j-1},t_j) the density sum_n e^{-i pi t n}(-2 pi^2 c_n (H_{a,j} - t L_{a,j}) + 2 i pi d_n
       L_{a,j}), L_{a,j} = sum_{l>=j} P_l rho^{la}, H_{a,j} = sum_{l>=j} t_l P_l rho^{la}, all exact), integrated
       on each of the six pieces by Fejer's first rule with N = 256 nodes (positive weights, exact through degree
       255 -- Fejer 1933, discrete cosine orthogonality; positivity and total weight 2 are also checked by
       enclosure here), nodes and weights enclosed by ball arithmetic.  QUADRATURE ERROR, derived here: on the
       closed disk |t - c_j| <= R = 1/6 every integrand is analytic (the pole -ih has |c_j + ih| >= sqrt(601)/60
       > 1/6) and bounded by M_j, computed from |e^{-i pi t n}| <= e^{pi n R}, |t_l - t| <= |t_l - c_j| + R, and
       the exact image of the disk under 1/(t+ih) (centre conj(a)/Delta, radius R/Delta, a = c_j + ih,
       Delta = |a|^2 - R^2; proof: |Delta - conj(a) w|^2 - R^2|w|^2 = (|w-a|^2 - R^2)(|a|^2 - R^2)), so
       |lambda| <= 1/(b(|a|-R)), |z| <= B/(|a|-R) + h, Im z >= B(h-R)/Delta - h.  Cauchy's estimate on the
       half-radius segment and the exact, positive rule give |error| <= 4 eta M_j 2^-N / (1 - 1/2), eta = 1/12.
       The bound (about 1e-31 per moment) is added to every quadrature moment.
     - the direct moments p^(l)(m)/l! EXACTLY, with no quadrature, from the cardinal form p = P R: the Taylor
       coefficients A_k(m) = P^(k)(m)/k! are pi^k times elements of Q(sqrt3), and R(m+u) = c_m/u^2 + d_m/u +
       sum r_j u^j with r_j = C[j=0] + sum_{n != m} (-1)^j((j+1)c_n/(m-n)^{j+2} + d_n/(m-n)^{j+1}) (a finite
       list); the quadrature value of every direct moment is compared with this exact one (a SECOND WAY that
       checks the measure, the density formula and the rule on 1364 moments).
     - the J block D = S_{J,J} recomputed with a second rule (N = 192) and compared (SECOND WAY for the kernel).
     - then: ||W_eta||, ||I - W_eta(I - eta D)||, ||W_eta U|| on columns 7:9, 12:16, 19:100 against the table
       cert:matrix-table; ||S_{E cap [7,16],J}|| < .088; the printed enclosures of the two defect norms and the
       exterior norm (certificates.tex:405-413) contain the enclosures computed here; the W argument giving
       ||(I - eta D)^-1|| < 32 and ||(I - eta D)^-1 U|| < 3.7; all 204 residuals of cert:residual-bounds < 3e-10;
       the four table norms (exact integer sums) equal the printed values; all 84 x 29 = 2436 Bernstein
       coefficients B_k (signs.tex:95-113) above the grouped bounds of cert:bernstein-table and the lemma's
       thresholds; the printed enclosure of B at (2,16,-1/2,28).
  E. The scalar substitutions of certificates.tex:487-572: the four row envelopes and the atom tail
     (cert:row-substitutions), both rational lower sums (exact), sum M_j(pi t_j)^2/6, the second-derivative tail,
     the four perturbation caps, the variation 72.669, the five Taylor representatives, the six gap-midpoint
     quotients of P (> .68) and the printed closed forms, and the arithmetic of the analytic chain (.687, 90, 2521,
     91, 2540, R_f, R_t, .00002860012, the margins .735/.168/.017/.006/.00448) as ARITHMETIC ONLY.

WHAT IS NOT DECIDED (theory, not the finite object): that the cardinal family and its Gaussian transforms are what
the paper says (Lemma fourier:measure-lemma's convergence, Proposition fourier:transform); the row-envelope
inequality interpolation:row-envelope and the tail bounds it implies; the Neumann/Schur inversion on the infinite
l^1 space (Lemma interpolation:inverse) and the existence/uniqueness of the exact lists; the Taylor-quotient sign
argument (signs.tex:39-88), the perturbation and truncation estimates as inequalities between functions (their
numerical substitutions ARE checked), the log-concavity in Lemma signs:P-lower-bound, the unbounded region,
Poisson normalisation and the packing consequence.  Also not checked: the error analyses of the paper's own
alternative programs (independent-certification.tex: rounded exponentials, the N = 64 program, Taylor budgets),
which concern their code, not the object.
"""
import json
import math
import os
import re
import sys
import time
from fractions import Fraction
from math import comb, factorial, isqrt
from operator import mul

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/A-sharp-Fourier-certificate-for-planar-circle-packing-September-23-2026/'
SEC = DIR + 'build/sections/'
Fr = Fraction

# ======================================================================================================
# outward ball arithmetic on dyadic rationals: a real ball (m, r) is [(m - r)/2^PREC, (m + r)/2^PREC];
# a complex ball (x, y, r) is the disk of radius r/2^PREC about (x + iy)/2^PREC.  Every rounding is a floor,
# whose error (< 1 unit) is added to the radius together with a ceiling of the shifted radius.
# ======================================================================================================
PREC = 160
ONE = 1 << PREC


def rq(q):
    q = Fr(q)
    return ((q.numerator << PREC) // q.denominator, 1)


def radd(a, b):
    return (a[0] + b[0], a[1] + b[1])


def rsub(a, b):
    return (a[0] - b[0], a[1] + b[1])


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
    """proves the ball lies strictly below q"""
    q = Fr(q)
    return (a[0] + a[1]) * q.denominator < q.numerator * ONE


def rgt(a, q):
    q = Fr(q)
    return (a[0] - a[1]) * q.denominator > q.numerator * ONE


def rabs_hi(a):
    return (abs(a[0]) + a[1], 0)


def rabs_iv(a):
    """an interval [lo, hi] (scaled integers) containing |x| for every x in the ball"""
    lo = max(0, abs(a[0]) - a[1])
    return lo, abs(a[0]) + a[1]


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


def cr(a):
    return (a[0], 0, a[1])


def cq(re, im=0):
    return ((Fr(re).numerator << PREC) // Fr(re).denominator, (Fr(im).numerator << PREC) // Fr(im).denominator, 2)


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
    """complex ball times real ball"""
    ar, ai, ra = a
    m, rr = b
    return ((ar * m) >> PREC, (ai * m) >> PREC, (((abs(ar) + abs(ai)) * rr + abs(m) * ra + ra * rr) >> PREC) + 3)


def cmuli(a):
    return (-a[1], a[0], a[2])


def cconj(a):
    return (a[0], -a[1], a[2])


def cdivint(a, n):
    return (a[0] // n, a[1] // n, -(-a[2] // n) + 2)


def cinv(a):
    ar, ai, ra = a
    n2 = ar * ar + ai * ai
    L = isqrt(n2)
    if L <= ra:
        raise ZeroDivisionError('complex ball contains 0')
    return ((ar * ONE * ONE) // n2, (-ai * ONE * ONE) // n2, -((-(ONE * ONE * ra)) // (L * (L - ra))) + 3)


def cre(a):
    return (a[0], a[2])


def cim(a):
    return (a[1], a[2])


def cabs1(a):
    return abs(a[0]) + abs(a[1]) + a[2]


EXP_K = 40
# tail of the exponential series after EXP_K terms for |u| <= 1/2: (1/2)^K/K! * (K+1)/(K+1/2), in units 2^-PREC
_tail = Fr(1, 2 ** EXP_K) / factorial(EXP_K) * Fr(EXP_K + 1) / (Fr(EXP_K + 1) - Fr(1, 2))
EXP_TAIL = -(-(_tail * ONE).numerator // (_tail * ONE).denominator) + 1


def cexp(a):
    """e^a for a complex ball: halve until |a| <= 1/4, Taylor to EXP_K terms with the tail above, square back"""
    ar, ai, ra = a
    size = abs(ar) + abs(ai) + ra
    k = 0
    while (size >> k) > (ONE >> 2):
        k += 1
    u = (ar >> k, ai >> k, (ra >> k) + 3) if k else a
    if 2 * (abs(u[0]) + abs(u[1]) + u[2]) > ONE:
        raise ArithmeticError('exp reduction failed')
    s = (ONE, 0, 0)
    term = (ONE, 0, 0)
    for q in range(1, EXP_K):
        term = cdivint(cmul(term, u), q)
        s = cadd(s, term)
    s = (s[0], s[1], s[2] + EXP_TAIL)
    for _ in range(k):
        s = cmul(s, s)
    return s


def rexp(a):
    return cre(cexp(cr(a)))


def pi_ball():
    """Machin: pi = 16 atan(1/5) - 4 atan(1/239); the alternating series lies between consecutive partial sums"""
    def atan_inv(x, K):
        s, prev = Fr(0), None
        for k in range(K + 2):
            prev = s
            s += Fr((-1) ** k, (2 * k + 1) * x ** (2 * k + 1))
        return min(prev, s), max(prev, s)
    a_lo, a_hi = atan_inv(5, 80)
    b_lo, b_hi = atan_inv(239, 30)
    return rinterval(16 * a_lo - 4 * b_hi, 16 * a_hi - 4 * b_lo), (16 * a_lo - 4 * b_hi, 16 * a_hi - 4 * b_lo)


PI, PI_IV = pi_ball()
SQ3 = (isqrt(3 * ONE * ONE), 1)       # floor(sqrt3 2^PREC) <= sqrt3 2^PREC < floor + 1
PI2 = rmul(PI, PI)

# ======================================================================================================
# exact arithmetic in Q(sqrt3) (pairs (a, b) = a + b sqrt3 of Fractions) and Q(sqrt3)(i) (pairs of those)
# ======================================================================================================
Z3 = (Fr(0), Fr(0))


def q3(a, b=0):
    return (Fr(a), Fr(b))


def q3add(x, y):
    return (x[0] + y[0], x[1] + y[1])


def q3sub(x, y):
    return (x[0] - y[0], x[1] - y[1])


def q3mul(x, y):
    return (x[0] * y[0] + 3 * x[1] * y[1], x[0] * y[1] + x[1] * y[0])


def q3sc(x, c):
    return (x[0] * c, x[1] * c)


def q3inv(x):
    n = x[0] * x[0] - 3 * x[1] * x[1]
    return (x[0] / n, -x[1] / n)


def q3sign(x):
    """exact sign of a + b sqrt3"""
    a, b = x
    if a >= 0 and b >= 0:
        return 0 if a == 0 and b == 0 else 1
    if a <= 0 and b <= 0:
        return -1
    if a > 0:            # b < 0: a + b sqrt3 > 0 iff a^2 > 3 b^2
        return 1 if a * a > 3 * b * b else (-1 if a * a < 3 * b * b else 0)
    return 1 if 3 * b * b > a * a else (-1 if 3 * b * b < a * a else 0)


def q3ball(x):
    return radd(rq(x[0]), rmul(rq(x[1]), SQ3))


K0 = (Z3, Z3)
K1 = (q3(1), Z3)


def kadd(x, y):
    return (q3add(x[0], y[0]), q3add(x[1], y[1]))


def ksub(x, y):
    return (q3sub(x[0], y[0]), q3sub(x[1], y[1]))


def kmul(x, y):
    return (q3sub(q3mul(x[0], y[0]), q3mul(x[1], y[1])), q3add(q3mul(x[0], y[1]), q3mul(x[1], y[0])))


def ksc(x, c):
    return (q3sc(x[0], c), q3sc(x[1], c))


def kconj(x):
    return (x[0], q3sc(x[1], -1))


def kpow(x, n):
    r = K1
    for _ in range(n):
        r = kmul(r, x)
    return r


def knorm2(x):
    return q3add(q3mul(x[0], x[0]), q3mul(x[1], x[1]))


def kball(x):
    re, im = q3ball(x[0]), q3ball(x[1])
    return (re[0], im[0], re[1] + im[1])


RHO = (q3(0, Fr(1, 2)), q3(Fr(1, 2)))          # e^{i pi/6} = sqrt3/2 + i/2
RHOP = [kpow(RHO, k) for k in range(12)]


def rho(k):
    return RHOP[k % 12]


A_RES = (0, 1, 3, 4, 7, 9)
B_PAR = None   # b = sqrt3/2 as a ball, set below
H = Fr(2, 5)
BB = Fr(4, 3)


def poly_P():
    """coefficients P_{-6..6} of P(s) = w^-6 prod_{a in A} (w - rho^a)^2, w = e^{i pi s/6}"""
    poly = [K1]
    for a in A_RES:
        for _ in range(2):
            new = [K0] * (len(poly) + 1)
            for i, c in enumerate(poly):
                new[i + 1] = kadd(new[i + 1], c)
                new[i] = ksub(new[i], kmul(c, rho(a)))
            poly = new
    return {j: poly[j + 6] for j in range(-6, 7)}


PJ = poly_P()
B_PAR = rdivint(SQ3, 2)                       # b = sqrt3/2
INV_B = rinv(B_PAR)
PIK = [(ONE, 0)]
for _k in range(40):
    PIK.append(rmul(PIK[-1], PI))

# ------------------------------------------------------------------------------------------------------
# node data, exactly.  Fourier route: P^(k)(n)/k! = (i pi/6)^k/k! sum_j j^k P_j rho^{jn}
# ------------------------------------------------------------------------------------------------------
I_UNIT = (Z3, q3(1))


def alpha_k(k, a):
    """A_k(n)/pi^k for n = a mod 12, an element of Q(sqrt3) (the imaginary part is checked to vanish)"""
    s = K0
    for j in range(-6, 7):
        s = kadd(s, ksc(kmul(PJ[j], rho(j * a)), Fr(j) ** k))
    s = ksc(kmul(kpow(I_UNIT, k), s), Fr(1, 6 ** k * factorial(k)))
    return s


ALPHA = {a: [alpha_k(k, a) for k in range(34)] for a in A_RES}


def q3_of_real(x):
    if x[1] != Z3:
        raise ValueError('expected a real element')
    return x[0]


QN = {a: q3_of_real(ALPHA[a][2]) for a in A_RES}                                    # Q_n / pi^2
DN = {a: q3mul(q3_of_real(ALPHA[a][3]), q3inv(QN[a])) for a in A_RES}              # D_n / pi


def cos_k(k):
    return rho(k)[0][0], rho(k)[0][1]


def qd_product_formula(a):
    """fourier.tex:88-96: Q/pi^2 = (1/36) prod (2 - 2cos(pi(a-a')/6)); D/pi = (1/6) sum sin/(1-cos) (half angle)"""
    q = q3(Fr(1, 36))
    d = Z3
    for a2 in A_RES:
        if a2 == a:
            continue
        c = rho(a - a2)[0]
        s = rho(a - a2)[1]
        q = q3mul(q, q3sub(q3(2), q3sc(c, 2)))
        d = q3add(d, q3mul(s, q3inv(q3sub(q3(1), c))))
    return q, q3sc(d, Fr(1, 6))


# the printed table (fourier.tex:100-106), transcribed: Q/pi^2 and D/pi as a + b sqrt3
PRINTED_QD = {0: (q3(Fr(1, 3)), q3(0, Fr(-7, 18))),
              1: (q3(Fr(4, 3), Fr(-2, 3)), q3(Fr(3, 18), Fr(1, 18))),
              3: (q3(Fr(4, 3), Fr(-2, 3)), q3(Fr(-3, 18), Fr(-1, 18))),
              4: (q3(Fr(1, 3)), q3(0, Fr(7, 18))),
              7: (q3(Fr(4, 3), Fr(2, 3)), q3(Fr(-3, 18), Fr(1, 18))),
              9: (q3(Fr(4, 3), Fr(2, 3)), q3(Fr(3, 18), Fr(-1, 18)))}


def Qball(n):
    return rmul(q3ball(QN[n % 12]), PI2)


def Dball(n):
    return rmul(q3ball(DN[n % 12]), PI)


# L_{a,j} = sum_{l>=j} P_l rho^{la}, H_{a,j} = sum_{l>=j} t_l P_l rho^{la}  (exact)
LAJ = {(a, j): None for a in A_RES for j in range(1, 7)}
HAJ = {}
for a in A_RES:
    for j in range(1, 7):
        Ls, Hs = K0, K0
        for l in range(j, 7):
            term = kmul(PJ[l], rho(l * a))
            Ls = kadd(Ls, term)
            Hs = kadd(Hs, ksc(term, Fr(l, 6)))
        LAJ[(a, j)] = Ls
        HAJ[(a, j)] = Hs

NODES_F = [n for n in range(1, 101) if n % 12 in A_RES]           # I_f
N0_40 = [0] + [n for n in range(1, 41) if n % 12 in A_RES]
J_NODES = [1, 3, 4]
E_NODES = [n for n in NODES_F if n >= 7]
EXT_ROWS = [n for n in E_NODES if n <= 16]


def nodes_N0(lo, hi):
    return [n for n in range(lo, hi + 1) if n == 0 or n % 12 in A_RES]


# ------------------------------------------------------------------------------------------------------
# the quadrature engine
# ------------------------------------------------------------------------------------------------------
LMAX = 30
MMAX = 100


class Engine:
    """Fejer's first rule with N nodes on each of the six pieces (t_{j-1}, t_j); per node every factor the
    moments need, as balls"""

    def __init__(self, N, mmax=MMAX, lmax=LMAX, emax=MMAX):
        self.N = N
        w, x = [], []
        for v in range(N):
            th = rmul(PI, rq(Fr(2 * v + 1, 2 * N)))
            E = cexp((0, th[0], th[1]))
            x.append(cre(E))
            E2 = cmul(E, E)
            pw = E2
            acc = (0, 0)
            for a in range(1, N // 2):              # the a = N/2 term is cos((v+1/2) pi) = 0 exactly
                acc = radd(acc, rdivint(cre(pw), 4 * a * a - 1))
                pw = cmul(pw, E2)
            wv = rmul(rq(Fr(2, N)), rsub((ONE, 0), (2 * acc[0], 2 * acc[1])))
            w.append(wv)
        self.x, self.w = x, w
        self.nodes = []
        HB = rq(H)
        for j in range(1, 7):
            cj = rq(Fr(2 * j - 1, 12))
            for v in range(N):
                t = radd(cj, rdivint(x[v], 12))
                om = rdivint(w[v], 12)
                E1 = cexp((0, rmul(PI, t)[0], rmul(PI, t)[1]))
                e1p = [(ONE, 0, 0)]
                for _ in range(emax):
                    e1p.append(cmul(e1p[-1], E1))
                zeta = cinv((t[0], HB[0], t[1] + HB[1]))
                lam = crmul(cmuli(zeta), INV_B)
                z = csub(cmul(cq(-BB), zeta), cq(0, H))
                piz = crmul(z, PI)
                Ez = cexp(cmuli(piz))
                ezp = [(ONE, 0, 0)]
                for _ in range(mmax):
                    ezp.append(cmul(ezp[-1], Ez))
                ipz = cmuli(piz)
                Zl = [lam]
                for l in range(1, lmax + 1):
                    Zl.append(cdivint(cmul(Zl[-1], ipz), l))
                pt = rmul(PI, t)
                cl = [(ONE, 0)]
                for l in range(1, lmax + 1):
                    cl.append(rdivint(rmul(cl[-1], pt), l))
                self.nodes.append(dict(j=j, t=t, om=om, e1p=e1p, ezp=ezp, Zl=Zl, cl=cl))
        self.n = len(self.nodes)
        # per-order arrays for the inner products
        self.ZR = [[nd['Zl'][l][0] for nd in self.nodes] for l in range(lmax + 1)]
        self.ZI = [[nd['Zl'][l][1] for nd in self.nodes] for l in range(lmax + 1)]
        self.Z1 = [max(abs(nd['Zl'][l][0]) + abs(nd['Zl'][l][1]) for nd in self.nodes) for l in range(lmax + 1)]
        self.ZRAD = [max(nd['Zl'][l][2] for nd in self.nodes) for l in range(lmax + 1)]
        self.CL = [[nd['cl'][l][0] for nd in self.nodes] for l in range(lmax + 1)]
        self.C1 = [max(abs(nd['cl'][l][0]) for nd in self.nodes) for l in range(lmax + 1)]
        self.CRAD = [max(nd['cl'][l][1] for nd in self.nodes) for l in range(lmax + 1)]
        # the basis factors alpha_c(a, j, t) = -2 pi^2 (H - t L), alpha_d(a, j) = 2 i pi L at each node
        Lb = {k: kball(v) for k, v in LAJ.items()}
        Hb = {k: kball(v) for k, v in HAJ.items()}
        m2pi2 = rq(0)
        m2pi2 = (-2 * PI2[0], 2 * PI2[1])
        twopi = (2 * PI[0], 2 * PI[1])
        for nd in self.nodes:
            j, t = nd['j'], nd['t']
            ac, ad = {}, {}
            for a in A_RES:
                ac[a] = crmul(csub(Hb[(a, j)], crmul(Lb[(a, j)], t)), m2pi2)
                ad[a] = crmul(cmuli(Lb[(a, j)]), twopi)
            nd['ac'], nd['ad'] = ac, ad
        self.qerr = None

    # --- the quadrature error, derived in the module docstring ------------------------------------
    def quad_error(self, wnorm=Fr(3), mmax=100, nmax=100, lmax=30):
        """an upper bound (Fraction) for |rule - integral| of any moment U or X with coefficient-list norm <=
        wnorm on nodes <= nmax, rows m <= mmax, orders l <= lmax, y = 1"""
        R = Fr(1, 6)
        eta = Fr(1, 12)
        total = Fr(0)
        absP = {l: rsqrt(q3ball(knorm2(PJ[l]))) for l in range(1, 7)}
        for j in range(1, 7):
            cj = Fr(2 * j - 1, 12)
            sP = (0, 0)
            sPt = (0, 0)
            for l in range(j, 7):
                sP = radd(sP, absP[l])
                sPt = radd(sPt, rmul(absP[l], rq(abs(Fr(l, 6) - cj) + R)))
            dens = rmul(rq(wnorm), rmul(rexp(rmul(PI, rq(nmax * R))),
                                        (max(rhi(rmul(rmul(rq(2), PI2), sPt)), rhi(rmul(rmul(rq(2), PI), sP))) * ONE // 1 + 1, 0)))
            # |a_j| >= floor-sqrt lower bound
            a2 = cj * cj + H * H
            alo = Fr(isqrt((a2 * ONE * ONE).numerator // (a2 * ONE * ONE).denominator), ONE)
            if not alo > R:
                raise ArithmeticError('disk meets the pole')
            zeta_max = 1 / (alo - R)
            Delta = a2 - R * R
            negim = max(Fr(0), H - BB * (H - R) / Delta)
            zmax = BB * zeta_max + H
            lam_max = rhi(rmul(rq(zeta_max), INV_B))
            # transformed factor: |lambda| e^{pi m negIm} (pi |z|)^l / l!  <=  |lambda| e^{pi m negIm} e^{pi zmax}
            tr = rmul(rq(lam_max), rexp(rmul(PI, rq(mmax * negim + zmax))))
            # direct factor: e^{pi m R} e^{pi (c_j + R)}
            di = rexp(rmul(PI, rq(mmax * R + cj + R)))
            M = rmul(dens, (max(rhi(tr), rhi(di)) * ONE // 1 + 1, 0))
            total += 4 * eta * rhi(M) * Fr(1, 2 ** self.N) * 2
        return total

    def set_qerr(self, q):
        self.qerr = q
        self.qerr_units = -(-(q * ONE).numerator // (q * ONE).denominator) + 1

    # --- densities -------------------------------------------------------------------------------
    def full_F(self, coef):
        """omega_k * density(t_k) for a full coefficient list {n: (c_n, d_n)} (rationals)"""
        cb = {n: (rq(c), rq(d)) for n, (c, d) in coef.items()}
        out = []
        for nd in self.nodes:
            f = (0, 0, 0)
            for n, (c, d) in cb.items():
                a = n % 12
                g = cadd(crmul(nd['ac'][a], c), crmul(nd['ad'][a], d))
                f = cadd(f, cmul(cconj(nd['e1p'][n]), g))
            out.append(crmul(f, nd['om']))
        return out

    def basis_F(self, n, kind):
        a = n % 12
        key = 'ac' if kind == 'c' else 'ad'
        return [crmul(cmul(cconj(nd['e1p'][n]), nd[key][a]), nd['om']) for nd in self.nodes]

    # --- moments ---------------------------------------------------------------------------------
    def X_moments(self, F, m, lmax):
        """Re sum_k F_k e^{i pi z_k m} lambda_k (i pi z_k)^l/l!, l = 0..lmax, as balls (quadrature error added)"""
        B = [cmul(Fk, nd['ezp'][m]) for Fk, nd in zip(F, self.nodes)]
        BR = [b[0] for b in B]
        BI = [b[1] for b in B]
        b1 = max(abs(b[0]) + abs(b[1]) for b in B)
        rb = max(b[2] for b in B)
        out = []
        for l in range(lmax + 1):
            s = sum(map(mul, BR, self.ZR[l])) - sum(map(mul, BI, self.ZI[l]))
            rad = self.n * (b1 * self.ZRAD[l] + self.Z1[l] * rb + rb * self.ZRAD[l])
            out.append((s >> PREC, (rad >> PREC) + 2 + self.qerr_units))
        return out

    def U_moments(self, F, m, lmax):
        """Re sum_k F_k e^{i pi t_k m} (i pi t_k)^l/l!  (the direct moments by quadrature, for the cross-check)"""
        A = [cmul(Fk, nd['e1p'][m]) for Fk, nd in zip(F, self.nodes)]
        AR = [a[0] for a in A]
        AI = [a[1] for a in A]
        a1 = max(abs(a[0]) + abs(a[1]) for a in A)
        ra = max(a[2] for a in A)
        out = []
        for l in range(lmax + 1):
            # Re(i^l w) = Re w, -Im w, -Re w, Im w
            comp, sgn = [(AR, 1), (AI, -1), (AR, -1), (AI, 1)][l % 4]
            s = sgn * sum(map(mul, comp, self.CL[l]))
            rad = self.n * (a1 * self.CRAD[l] + self.C1[l] * ra + ra * self.CRAD[l])
            out.append((s >> PREC, (rad >> PREC) + 2 + self.qerr_units))
        return out


# atoms: masses e_j C P_j at t_j = j/6 (e_0 = 1, e_j = 2)
def atom_data(mmax=MMAX, lmax=LMAX):
    out = []
    HB = rq(H)
    for j in range(7):
        t = rq(Fr(j, 6))
        zeta = cinv((t[0], HB[0], t[1] + HB[1]))
        lam = crmul(cmuli(zeta), INV_B)
        z = csub(cmul(cq(-BB), zeta), cq(0, H))
        piz = crmul(z, PI)
        Ez = cexp(cmuli(piz))
        ezp = [(ONE, 0, 0)]
        for _ in range(mmax):
            ezp.append(cmul(ezp[-1], Ez))
        Zl = [lam]
        for l in range(1, lmax + 1):
            Zl.append(cdivint(cmul(Zl[-1], cmuli(piz)), l))
        out.append(dict(P=kball(ksc(PJ[j], 1 if j == 0 else 2)), ezp=ezp, Zl=Zl))
    return out


def atom_X(atoms, C, m, lmax):
    Cb = rq(C)
    res = []
    for l in range(lmax + 1):
        s = (0, 0)
        for at in atoms:
            v = cmul(cmul(crmul(at['P'], Cb), at['ezp'][m]), at['Zl'][l])
            s = radd(s, cre(v))
        res.append(s)
    return res


# ------------------------------------------------------------------------------------------------------
# exact direct moments by the node-Taylor formula: p^(l)(m)/l! = c_m A_{l+2} + d_m A_{l+1} + sum_k A_k r_{l-k}
# ------------------------------------------------------------------------------------------------------
def U_exact(coef, C, m, lmax):
    a = m % 12
    Ab = [rmul(q3ball(q3_of_real(ALPHA[a][k])), PIK[k]) for k in range(lmax + 3)]
    r = []
    for jj in range(lmax + 1):
        s = rq(C) if jj == 0 else (0, 0)
        for n, (c, d) in coef.items():
            if n == m:
                continue
            dm = m - n
            s = radd(s, rq(Fr((-1) ** jj * (jj + 1)) * c / Fr(dm) ** (jj + 2) + Fr((-1) ** jj) * d / Fr(dm) ** (jj + 1)))
        r.append(s)
    cm, dm_ = coef.get(m, (Fr(0), Fr(0)))
    out = []
    for l in range(lmax + 1):
        s = radd(rmul(rq(cm), Ab[l + 2]), rmul(rq(dm_), Ab[l + 1]))
        for k in range(2, l + 1):
            s = radd(s, rmul(Ab[k], r[l - k]))
        out.append(s)
    return out


# ======================================================================================================
# the published data
# ======================================================================================================
def load(src):
    tsv = src.text(DIR + 'verification/data/coefficients.tsv')
    tex = src.text(DIR + 'build/data/coefficients.tex')
    js = json.loads(src.text(DIR + 'verification/data/certificate-inputs.json'))
    rows_tsv = [tuple(int(x) for x in ln.split('\t')) for ln in tsv.strip().split('\n')]
    rows_tex = [tuple(int(x) for x in ln.replace('\\\\', '').split('&')) for ln in tex.strip().split('\n') if '&' in ln]
    rows_js = [tuple(r) for r in js['tables']['coefficients']['rows']]
    W = {}
    Wsrc = {}
    for eta, name in ((1, 'W_plus'), (-1, 'W_minus')):
        a = [[int(x) for x in ln.split('\t')] for ln in src.text(DIR + 'verification/data/%s.tsv' % name).strip().split('\n')]
        b = [[int(x) for x in ln.replace('\\\\', '').split('&')] for ln in src.text(DIR + 'build/data/%s.tex' % name).strip().split('\n') if '&' in ln]
        c = js['tables'][name]['rows']
        W[eta] = a
        Wsrc[eta] = (a == b == c, js['tables'][name]['scale_denominator'], js['tables'][name]['coordinate_order'])
    fixed = {f['function']: (Fr(f['c_0']), Fr(f['d_0']), Fr(f['C'])) for f in js['fixed_inputs']}
    return dict(rows=rows_tsv, rows_same=(rows_tsv == rows_tex == rows_js), scale=js['tables']['coefficients']['scale_denominator'],
                W=W, Wsrc=Wsrc, fixed=fixed, js=js)


def inputs_from(rows, fixed, scale=10 ** 10):
    coef = {1: {0: (fixed[1][0], fixed[1][1])}, 2: {0: (fixed[2][0], fixed[2][1])}}
    for n, c1, d1, c2, d2 in rows:
        coef[1][n] = (Fr(c1, scale), Fr(d1, scale))
        coef[2][n] = (Fr(c2, scale), Fr(d2, scale))
    return coef, {1: fixed[1][2], 2: fixed[2][2]}


# the envelope table (interpolation.tex:47-61): j -> (b*_j, a*_j, g_j, M_j, beta_j)
D_ = Fraction
ENV = {0: (D_('2.887'), D_('2.934'), D_('2.933'), None, None),
       1: (D_('2.665'), D_('2.713'), D_('2.440'), D_(56), D_(0)),
       2: (D_('2.218'), D_('2.269'), D_('1.567'), D_(48), D_('4.8')),
       3: (D_('1.804'), D_('1.859'), D_('.900'), D_(35), D_('3.17')),
       4: (D_('1.486'), D_('1.548'), D_('.482'), D_(25), D_('1.946')),
       5: (D_('1.250'), D_('1.320'), D_('.224'), D_(19), D_('1.217')),
       6: (D_('1.073'), D_('1.151'), D_('.0597'), D_('6.284'), D_('.792'))}
MSTAR = [5, 4, 4, 4, 2, 4, 2]

# cert:matrix-table (certificates.tex:387-398) and cert:bernstein-table (certificates.tex:460-473)
MATRIX_TABLE = {1: (D_('30.84'), D_('.001'), D_('3.54'), D_('.44'), D_('.25')),
                -1: (D_('1.83'), D_('.001'), D_('.73'), D_('.32'), D_('.17'))}
BERN_TABLE = {0: (None, D_('.762')), 1: (D_('.314'), D_('.191')), 3: (D_('.028'), D_('.024')), 4: (D_('.028'), D_('.024')),
              7: (D_('.114'), D_('.112')), 9: (D_('.114'), D_('.112'))}
for _m in (12, 13, 15, 16):
    BERN_TABLE[_m] = (D_('.0105'), D_('.0094'))
for _m in (19, 21):
    BERN_TABLE[_m] = (D_('.123'), D_('.113'))
for _m in (24, 25, 27, 28):
    BERN_TABLE[_m] = (D_('.0111'), D_('.0113'))
for _m in (31, 33):
    BERN_TABLE[_m] = (D_('.121'), D_('.126'))
for _m in (36, 37, 39, 40):
    BERN_TABLE[_m] = (D_('.0107'), D_('.0115'))


def lemma_threshold(m):
    return D_('.74') if m == 0 else D_('.18') if m == 1 else D_('.02') if m in (3, 4) else D_('.009')


PRINTED = dict(
    defect={1: (D_('.00025422624910652544'), D_('.00025422624910652546')), -1: (D_('.00042288165102553355'), D_('.00042288165102553357'))},
    exterior=(D_('.08688748182289641591'), D_('.08688748182289641592')),
    exterior_bound=D_('.088'),
    bern_point=((2, 16, Fr(-1, 2), 28), (D_('.00951875955680'), D_('.00951875955684'))),
    residual=D_('3e-10'),
    norms=(D_('2.2516666247'), D_('.8927477314'), D_('.0000197471'), D_('.0000161623')),
    matrix=MATRIX_TABLE, bern=BERN_TABLE,
)


def half_gaps():
    """the 84 triples (i, m, y, nu) of signs.tex:19-37"""
    N0 = nodes_N0(0, 60)
    out = []
    for idx, m in enumerate(N0):
        if m > 40:
            break
        ys = [Fr(N0[idx + 1] - m, 2)]
        if m > 0:
            ys.append(Fr(N0[idx - 1] - m, 2))
        for y in ys:
            out.append((2, m, y, 0 if m == 0 else 2))
            if m + y >= 1 and m >= 1:
                out.append((1, m, y, 1 if m == 1 else 2))
    return out


# ======================================================================================================
_CACHE = {}


def engine(N=256):
    if ('E', N) not in _CACHE:
        E = Engine(N)
        E.set_qerr(E.quad_error())
        _CACHE[('E', N)] = E
    return _CACHE[('E', N)]


def atoms():
    if 'atoms' not in _CACHE:
        _CACHE['atoms'] = atom_data()
    return _CACHE['atoms']


def pair(X0, X1, m):
    Q = Qball(m)
    D = Dball(m)
    iq = rinv(Q)
    return (rmul((-X0[0], X0[1]), iq), rmul(rsub(rmul(D, X0), X1), iq))


def column(E, n, kind, rows):
    F = E.basis_F(n, kind)
    firsts, seconds = [], []
    for m in rows:
        X = E.X_moments(F, m, 1)
        a, b = pair(X[0], X[1], m)
        firsts.append(a)
        seconds.append(b)
    return firsts + seconds


def norm_iv(cols):
    """enclosure [lo, hi] (Fractions) of the induced l1 norm max_col sum_row |entry| of a ball matrix given by columns"""
    lo = hi = Fr(0)
    for col in cols:
        l_ = h_ = 0
        for e in col:
            a, b = rabs_iv(e)
            l_ += a
            h_ += b
        lo = max(lo, Fr(l_, ONE))
        hi = max(hi, Fr(h_, ONE))
    return lo, hi


def matmul_rat(W, cols, scale):
    """W (integer matrix / scale) times a ball matrix given by columns; returns columns"""
    out = []
    for col in cols:
        new = []
        for row in W:
            s = (0, 0)
            for w, e in zip(row, col):
                if w:
                    s = radd(s, rmul(rq(Fr(w, scale)), e))
            new.append(s)
        out.append(new)
    return out


def dec(q, digits, direction):
    """an exact decimal string of the Fraction q, rounded down (direction -1) or up (+1) at the given digits"""
    q = Fr(q)
    sc = q * 10 ** digits
    n = sc.numerator // sc.denominator if direction < 0 else -(-sc.numerator // sc.denominator)
    sgn = '-' if n < 0 else ''
    n = abs(n)
    s = str(n).rjust(digits + 1, '0')
    return sgn + s[:-digits] + '.' + s[-digits:]


def decide(src=None, rows_override=None, W_override=None, printed=None, parts=None):
    t0 = time.time()
    src = src or Sources()
    printed = printed or PRINTED
    parts = set(parts or ('data', 'algebra', 'envelope', 'scalar', 'matrix', 'residual', 'bernstein', 'second'))
    checks = []
    refuting = []           # claims whose enclosure lies entirely on the wrong side
    value = {}

    def claim_lt(name, ball, thr, detail=''):
        ok = rlt(ball, thr)
        check(checks, name, ok, detail or '[%.15g, %.15g] < %s' % (float(rlo(ball)), float(rhi(ball)), thr))
        if not ok and not rlt((-ball[0], ball[1]), -thr):   # not even possibly below: lo >= thr
            if rlo(ball) >= thr:
                refuting.append(name)
        return ok

    def claim_gt(name, ball, thr, detail=''):
        ok = rgt(ball, thr)
        check(checks, name, ok, detail or '[%.15g, %.15g] > %s' % (float(rlo(ball)), float(rhi(ball)), thr))
        if not ok and rhi(ball) <= thr:
            refuting.append(name)
        return ok

    tex = {k: src.text(SEC + k + '.tex') for k in ('introduction', 'fourier', 'interpolation', 'signs', 'certificates', 'rational-check')}
    flat = {k: re.sub(r'\s+', '', v) for k, v in tex.items()}
    data = load(src)
    rows = rows_override or data['rows']
    W = W_override or data['W']
    coef, Cc = inputs_from(rows, data['fixed'], data['scale'])
    sigma = {1: -1, 2: 1}

    # ---------------------------------------------------------------------------------------- A. data
    if 'data' in parts:
        check(checks, 'A. the theorem as stated: fhat(0)=1, f(0)=2/sqrt3, fhat>=0, f<=0 for |x|>=1 (introduction.tex:34-41)',
              all(s in flat['introduction'] for s in ('\\widehatf(0)=1', 'f(0)=\\frac{2}{\\sqrt3}', '\\widehatf(\\xi)\\ge0', 'f(x)\\le0\\quad(|x|\\ge1)')))
        check(checks, 'A. coefficients.tsv = data/coefficients.tex = certificate-inputs.json (51 rows, scale 1e10)',
              data['rows_same'] and len(data['rows']) == 51 and data['scale'] == 10 ** 10)
        check(checks, 'A. the table nodes are exactly I_f = N cap [1,100] (fourier.tex:32-33, interpolation.tex:206)',
              [r[0] for r in data['rows']] == NODES_F, '%d nodes' % len(NODES_F))
        check(checks, 'A. W_+ and W_- agree in .tsv, .tex and .json (scale 1e4, order c1,c3,c4,d1,d3,d4)',
              all(v[0] and v[1] == 10000 and v[2] == ['c_1', 'c_3', 'c_4', 'd_1', 'd_3', 'd_4'] for v in data['Wsrc'].values()))
        check(checks, 'A. fixed node-zero data and constants: json = fourier.tex:348-351 = certificates.tex:27-31',
              data['fixed'] == {1: (Fr(1), Fr(44, 100), Fr(-13, 1000)), 2: (Fr(0), Fr(-368, 1000), Fr(17, 1000))}
              and '(c_{1,0},d_{1,0},C_1)=(1,0.44,-0.013)' in flat['fourier'] and '(c_{2,0},d_{2,0},C_2)=(0,-0.368,0.017)' in flat['fourier'])

    # ---------------------------------------------------------------------------------------- B. exact algebra
    if 'algebra' in parts:
        b = q3(0, Fr(1, 2))
        printedP = {0: (q3(5), Z3), 1: (q3(-1), q3mul(q3(2), b)), 2: (q3(1), q3mul(q3(2), b)), 3: (q3(-2), Z3),
                    4: (q3(Fr(-1, 2)), b), 5: (q3(-1), q3sc(q3mul(q3(2), b), -1)), 6: (q3(1), Z3)}
        check(checks, 'B. P_j from w^-6 prod_a (w - rho^a)^2 equal the printed (P_0..P_6) (fourier.tex:66-68), P_-j = conj P_j',
              all(PJ[j] == printedP[j] for j in range(7)) and all(PJ[-j] == kconj(PJ[j]) for j in range(7)))
        dz = all(kadd(K0, ALPHA[a][0]) == K0 and ALPHA[a][1] == K0 for a in A_RES)
        check(checks, 'B. P(n) = P\'(n) = 0 exactly at every residue n mod 12 in A (double zeros)', dz)
        same = all((QN[a], DN[a]) == qd_product_formula(a) == PRINTED_QD[a] for a in A_RES)
        check(checks, 'B. Q_n = P\'\'(n)/2, D_n = P\'\'\'(n)/(6Q_n) (Fourier route) = product/cot formula (fourier.tex:88-96) = printed table (fourier.tex:98-107), exactly in Q(sqrt3)',
              same, '; '.join('a=%d: Q/pi^2=%s+%s r3, D/pi=%s+%s r3' % (a, QN[a][0], QN[a][1], DN[a][0], DN[a][1]) for a in A_RES))
        bb = q3(0, Fr(1, 2))
        rc = {1: (q3sc(q3sub(q3(1), bb), Fr(4, 3)), q3sc(q3add(q3(3), q3sc(bb, 2)), Fr(1, 18))),
              3: (q3sc(q3sub(q3(1), bb), Fr(4, 3)), q3sc(q3add(q3(3), q3sc(bb, 2)), Fr(-1, 18))),
              4: (q3(Fr(1, 3)), q3sc(bb, Fr(7, 9)))}
        check(checks, 'B. rational-check.tex:138-145: Q_1=Q_3=(4pi^2/3)(1-b), Q_4=pi^2/3, D_1=-D_3=pi(3+2b)/18, D_4=7pi b/9',
              all((QN[a], DN[a]) == rc[a] for a in rc))
        qlow = Fr(2, 3) * Fr(157, 50) ** 2 * (2 - Fr(26, 15))
        dhigh = max((abs(DN[a][0]) + abs(DN[a][1]) * Fr(26, 15)) * Fr(22, 7) for a in A_RES)
        check(checks, 'B. Q_n > 197192/112500 > 7/4 and |D_n| < 286/135 < 53/25 by the printed chain (pi in (157/50, 22/7), sqrt3 < 26/15)',
              qlow == Fr(197192, 112500) and qlow > Fr(7, 4) and Fr(26, 15) ** 2 > 3 and dhigh == Fr(286, 135) and Fr(286, 135) < Fr(53, 25)
              and rgt(PI, Fr(157, 50)) and rlt(PI, Fr(22, 7))
              and all(rgt(Qball(a), Fr(197192, 112500)) and rlt(rabs_hi(Dball(a)), Fr(286, 135)) for a in A_RES),
              'min Q_n = %.6f, max |D_n| = %.6f' % (min(float(rlo(Qball(a))) for a in A_RES), max(float(rhi(rabs_hi(Dball(a)))) for a in A_RES)))
        res = sorted({(j * j + j * k + k * k) % 12 for j in range(12) for k in range(12)})
        vals15 = [(j, k) for j in range(-6, 7) for k in range(-6, 7) if j * j + j * k + k * k == 15]
        check(checks, 'B. j^2+jk+k^2 mod 12 takes exactly the residues A = {0,1,3,4,7,9}; 15 is in N but is not a value (fourier.tex:35-45)',
              res == list(A_RES) and vals15 == [] and 15 % 12 in A_RES, str(res))
        absP = [knorm2(PJ[j]) for j in range(7)]
        sq = {l: absP[l] for l in range(7)}
        mods = [isqrt(int(sq[l][0])) if sq[l][1] == 0 and isqrt(int(sq[l][0])) ** 2 == sq[l][0] else None for l in range(7)]
        check(checks, 'B. |P_j| = 5,2,2,2,1,2,1: atom masses (5,4,4,4,2,4,2), sum_j |P_j| = 25, pi^2 sum |P_l| t_l^2 = 65pi^2/18, 2pi sum |P_l| t_l = 32pi/3',
              mods == [5, 2, 2, 2, 1, 2, 1] and [mods[0]] + [2 * x for x in mods[1:]] == MSTAR and mods[0] + 2 * sum(mods[1:]) == 25
              and sum(Fr(mods[l] * l * l, 36) for l in range(1, 7)) == Fr(65, 18) and 2 * sum(Fr(mods[l] * l, 6) for l in range(1, 7)) == Fr(32, 3)
              and '\\frac{65\\pi^2}{18}' in flat['fourier'] and '\\frac{32\\pi}{3}' in flat['fourier'])
        check(checks, 'B. Im z(t) = h(B/(t^2+h^2) - 1) has minimum 26/435 on [-1,1], at |t| = 1 (fourier.tex:258-260, 303-304)',
              H * (BB / (1 + H * H) - 1) == Fr(26, 435))

    # ---------------------------------------------------------------------------------------- C. envelopes
    if 'envelope' in parts:
        ok_b = ok_a = ok_g = ok_beta = True
        for j in range(7):
            tj = Fr(j, 6)
            T = tj * tj + H * H
            bs, as_, g, M, beta = ENV[j]
            ok_b &= Fr(3, 4) * bs * bs * T >= 1
            ok_a &= H * H + (BB * BB - 2 * BB * H * H) / T <= as_ * as_
            ok_g &= H * (BB / T - 1) >= g
            if j >= 1:
                f = lambda t: 2 * H * BB * t / (t * t + H * H) ** 2  # noqa: E731
                ok_beta &= beta <= min(f(Fr(j - 1, 6)), f(tj))
        check(checks, 'C. |lambda(t_j)| <= b*_j, |z(t_j)| <= a*_j, Im z(t_j) >= g_j at all seven endpoints (exact rational)', ok_b and ok_a and ok_g)
        check(checks, 'C. beta_j <= both endpoint values of -d Im z/dt = 2hBt/(t^2+h^2)^2 (unimodal, max at t = h/sqrt3), and B^2 - 2Bh^2 = 304/225 > 0',
              ok_beta and BB * BB - 2 * BB * H * H == Fr(304, 225))
        okM = True
        worst = []
        for j in range(1, 7):
            M = ENV[j][3]
            mx = (0, 0)
            for a in A_RES:
                L = LAJ[(a, j)]
                Hh = HAJ[(a, j)]
                cands = [rmul(PI, rsqrt(q3ball(knorm2(L)))) if knorm2(L) != Z3 else (0, 0)]
                for u in (Fr(j - 1, 6), Fr(j, 6)):
                    v = ksub(Hh, ksc(L, u))
                    cands.append(rmul(PI2, rsqrt(q3ball(knorm2(v)))) if knorm2(v) != Z3 else (0, 0))
                for cnd in cands:
                    if rhi(cnd) > rhi(mx):
                        mx = cnd
            val = (2 * mx[0], 2 * mx[1])
            okM &= rlt(val, M)
            worst.append('%.4f<%s' % (float(rhi(val)), M))
        check(checks, 'C. the density bound 2 max_a max{pi|L_{a,j}|, pi^2 max_u |H_{a,j} - u L_{a,j}|} < M_j for j = 1..6 (interpolation.tex:95-102)',
              okM, ', '.join(worst))

    # ---------------------------------------------------------------------------------------- E. scalar substitutions
    if 'scalar' in parts:
        scalar_checks(checks, claim_lt, claim_gt, coef, Cc, flat)

    # ---------------------------------------------------------------------------------------- D. interval certificates
    need_engine = parts & {'matrix', 'residual', 'bernstein', 'second'}
    if need_engine:
        E = engine(256)
        value['quadrature_error_bound_per_moment'] = '%.3e' % float(E.qerr)
        wsum = (0, 0)
        for w in E.w:
            wsum = radd(wsum, w)
        check(checks, 'D. Fejer rule N=256: all weights > 0 and their sum encloses 2; error bound per moment (derived here) < 1e-24',
              all(rgt(w, 0) for w in E.w) and rlo(wsum) <= 2 <= rhi(wsum) and E.qerr < Fr(1, 10 ** 24),
              'min weight %.3e, bound %.3e' % (min(float(rlo(w)) for w in E.w), float(E.qerr)))
        mono = True
        for k in range(0, 256, 5):
            s = (0, 0)
            for x, w in zip(E.x, E.w):
                p_ = (ONE, 0)
                for _ in range(k):
                    p_ = rmul(p_, x)
                s = radd(s, rmul(w, p_))
            exact = Fr(2, k + 1) if k % 2 == 0 else Fr(0)
            mono &= rlo(s) - Fr(1, 10 ** 40) <= exact <= rhi(s) + Fr(1, 10 ** 40)
        check(checks, 'D. corroboration of exactness: the rule integrates x^k on [-1,1] to within 1e-40 for k = 0,5,...,255', mono)

    at = atoms() if need_engine else None
    if 'matrix' in parts:
        E = engine(256)
        order = [(n, 'c') for n in J_NODES] + [(n, 'd') for n in J_NODES]
        colsJ = {}
        for n, kind in order:
            colsJ[(n, kind)] = column(E, n, kind, J_NODES + EXT_ROWS)
        Dcols = [[c for i, c in enumerate(colsJ[o]) if i % 9 < 3] for o in order]        # rows m in J
        Dcols = [col[:3] + col[3:] for col in Dcols]
        extcols = [[c for i, c in enumerate(colsJ[o]) if i % 9 >= 3] for o in order]    # rows m in E cap [7,16]
        Ucols = {}
        for n in E_NODES:
            for kind in ('c', 'd'):
                Ucols[(n, kind)] = column(E, n, kind, J_NODES)
        _CACHE['Dcols'] = Dcols
        value['D_block'] = [[float(rlo(e)) for e in col] for col in Dcols]
        for eta in (1, -1):
            Wm = W[eta]
            wnorm = max(sum(abs(Fr(Wm[r][c], 10000)) for r in range(6)) for c in range(6))
            tb = printed['matrix'][eta]
            check(checks, 'D. ||W_%+d|| = %s < %s (exact column sums; cert:matrix-table)' % (eta, wnorm, tb[0]), wnorm < tb[0])
            A = [[radd(((ONE if r == c else 0), 0), (-eta * Dcols[c][r][0], Dcols[c][r][1])) for r in range(6)] for c in range(6)]
            WA = matmul_rat(Wm, A, 10000)
            defect = [[rsub(((ONE if r == c else 0), 0), WA[c][r]) for r in range(6)] for c in range(6)]
            lo, hi = norm_iv(defect)
            value['defect_%+d' % eta] = (dec(lo, 24, -1), dec(hi, 24, 1))
            ok = hi < tb[1]
            check(checks, 'D. ||I - W_%+d(I %s D)|| in [%s, %s] < %s' % (eta, '-' if eta == 1 else '+', dec(lo, 24, -1), dec(hi, 24, 1), tb[1]), ok)
            if not ok and lo >= tb[1]:
                refuting.append('defect %+d' % eta)
            plo, phi = printed['defect'][eta]
            check(checks, 'D. the printed enclosure [%s, %s] of that defect norm contains the one computed here (certificates.tex:405-410)'
                  % (dec(plo, 20, -1), dec(phi, 20, 1)), plo <= lo and hi <= phi)
            if hi < plo or lo > phi:
                refuting.append('printed defect enclosure %+d' % eta)
            grp = {'7:9': [n for n in E_NODES if n <= 9], '12:16': [n for n in E_NODES if 12 <= n <= 16], '19:100': [n for n in E_NODES if n >= 19]}
            gvals = {}
            for gi, (gname, gnodes) in enumerate(grp.items()):
                cols = [Ucols[(n, k)] for n in gnodes for k in ('c', 'd')]
                WU = matmul_rat(Wm, cols, 10000)
                glo, ghi = norm_iv(WU)
                gvals[gname] = ghi
                ok = ghi < tb[2 + gi]
                check(checks, 'D. ||W_%+d U_{%s}|| <= %.6f < %s' % (eta, gname, ghi, tb[2 + gi]), ok)
                if not ok and glo >= tb[2 + gi]:
                    refuting.append('WU %s' % gname)
            dmax = hi
            inv_bound = wnorm / (1 - dmax)
            prod_bound = max(gvals.values()) / (1 - dmax)
            check(checks, 'D. the W argument: (I %s D) invertible, ||(I %s D)^-1|| <= ||W||/(1-defect) = %.4f < 32 and ||(I %s D)^-1 U|| <= %.4f < 3.7'
                  % ('-' if eta == 1 else '+', '-' if eta == 1 else '+', inv_bound, '-' if eta == 1 else '+', prod_bound),
                  dmax < 1 and inv_bound < 32 and prod_bound < Fr(37, 10) and tb[0] / (1 - tb[1]) < 32 and tb[2] / (1 - tb[1]) < Fr(37, 10))
        elo, ehi = norm_iv(extcols)
        value['exterior'] = (dec(elo, 24, -1), dec(ehi, 24, 1))
        ok = ehi < printed['exterior_bound']
        check(checks, 'D. ||S_{E cap [7,16],J}|| in [%s, %s] < %s (cert:exterior-block) < .09' % (dec(elo, 24, -1), dec(ehi, 24, 1), printed['exterior_bound']),
              ok and ehi < Fr(9, 100))
        if not ok and elo >= printed['exterior_bound']:
            refuting.append('exterior')
        plo, phi = printed['exterior']
        check(checks, 'D. the printed enclosure [%s, %s] of the exterior norm contains the one computed here (certificates.tex:412-413)'
              % (dec(plo, 20, -1), dec(phi, 20, 1)), plo <= elo and ehi <= phi)
        if ehi < plo or elo > phi:
            refuting.append('printed exterior enclosure')

    if 'second' in parts:
        E2 = Engine(192, mmax=4, emax=4)
        E2.set_qerr(E2.quad_error(wnorm=Fr(1), mmax=4, nmax=4))
        order = [(n, 'c') for n in J_NODES] + [(n, 'd') for n in J_NODES]
        D2 = [column(E2, n, k, J_NODES) for n, k in order]
        if 'Dcols' not in _CACHE:
            E = engine(256)
            _CACHE['Dcols'] = [column(E, n, k, J_NODES) for n, k in order]
        D1 = _CACHE['Dcols']
        agree = all(abs(D1[c][r][0] - D2[c][r][0]) <= D1[c][r][1] + D2[c][r][1] for c in range(6) for r in range(6))
        maxrad = max(max(D1[c][r][1], D2[c][r][1]) for c in range(6) for r in range(6))
        check(checks, 'SECOND WAY: the 36 entries of D = S_{J,J} recomputed with a Fejer rule of 192 nodes per piece (own error bound) overlap the N=256 enclosures',
              agree, 'max radius %.2e' % (maxrad / ONE))
        E = engine(256)
        okU = True
        n_cmp = 0
        for i in (1, 2):
            F = E.full_F(coef[i])
            for m in N0_40:
                Uq = E.U_moments(F, m, LMAX)
                Ue = U_exact(coef[i], Cc[i], m, LMAX)
                for l in range(LMAX + 1):
                    # the quadrature U omits the atoms (exact: C P^(l)(m)/l! = C pi^l alpha_l)
                    atom = rmul(rq(Cc[i]), rmul(q3ball(q3_of_real(ALPHA[m % 12][l])), PIK[l]))
                    tot = radd(Uq[l], atom)
                    okU &= abs(tot[0] - Ue[l][0]) <= tot[1] + Ue[l][1]
                    n_cmp += 1
        check(checks, 'SECOND WAY: all %d direct moments p^(l)(m)/l! (both tables, 22 centres, l <= 30) by quadrature of the folded measure overlap the exact node-Taylor values'
              % n_cmp, okU)

    if 'residual' in parts:
        E = engine(256)
        worst = Fr(0)
        okR = True
        nres = 0
        for i in (1, 2):
            F = E.full_F(coef[3 - i])
            for m in NODES_F:
                X = E.X_moments(F, m, 1)
                A_ = atom_X(at, Cc[3 - i], m, 1)
                X0, X1 = radd(X[0], A_[0]), radd(X[1], A_[1])
                Q = Qball(m)
                iq = rinv(Q)
                c_t, d_t = coef[i][m]
                rc_ = radd(rq(c_t), rmul(X0, iq))
                rd_ = radd(rq(d_t + (1 if (i == 1 and m == 1) else 0)), rmul(rsub(X1, rmul(Dball(m), X0)), iq))
                for r_ in (rc_, rd_):
                    nres += 1
                    hi = rhi(rabs_hi(r_))
                    worst = max(worst, hi)
                    if not hi < printed['residual']:
                        okR = False
                        if rabs_iv(r_)[0] >= printed['residual'] * ONE:
                            refuting.append('residual i=%d m=%d' % (i, m))
        value['max_residual'] = '%.4e' % float(worst)
        check(checks, 'D. all %d residuals of cert:residual-bounds are < %s (largest enclosure upper end %.4e), hence < 1e-9 (interpolation:finite-residuals)'
              % (nres, printed['residual'], worst), okR and nres == 204)
        nm = [sum(abs(Fr(x)) for r in rows for x in (r[1], r[2])) / 10 ** 10 + abs(coef[1][0][0]) + abs(coef[1][0][1]),
              sum(abs(Fr(x)) for r in rows for x in (r[3], r[4])) / 10 ** 10 + abs(coef[2][0][0]) + abs(coef[2][0][1]),
              sum(abs(Fr(x)) for r in rows if r[0] > 40 for x in (r[1], r[2])) / 10 ** 10,
              sum(abs(Fr(x)) for r in rows if r[0] > 40 for x in (r[3], r[4])) / 10 ** 10]
        check(checks, 'D. the four table norms (cert:table-norms) by integer addition: %s' % ', '.join(str(float(x)) for x in nm),
              tuple(nm) == printed['norms'] and nm[0] < Fr(229, 100) and nm[1] < Fr(229, 100) and nm[2] < Fr(2, 100000) and nm[3] < Fr(2, 100000))

    if 'bernstein' in parts:
        E = engine(256)
        Fs = {i: E.full_F(coef[i]) for i in (1, 2)}
        mom = {}
        for i in (1, 2):
            for m in N0_40:
                U = U_exact(coef[i], Cc[i], m, LMAX)
                X = E.X_moments(Fs[3 - i], m, LMAX)
                A_ = atom_X(at, Cc[3 - i], m, LMAX)
                mom[(i, m)] = [radd(U[l], radd(X[l], A_[l])) for l in range(LMAX + 1)]
        gaps = half_gaps()
        check(checks, 'D. the half-gaps: 22 centres in [0,40], 43 for index 2 and 41 for index 1, 84 in all (signs.tex:19-37)',
              len(N0_40) == 22 and sum(1 for g in gaps if g[0] == 2) == 43 and sum(1 for g in gaps if g[0] == 1) == 41)
        coefs = {(k, r): Fr(comb(k, r), comb(28, r)) for k in range(29) for r in range(k + 1)}
        mins = {}
        n_ineq = 0
        okB = True
        okL = True
        point = None
        for (i, m, y, nu) in gaps:
            T = []
            for r in range(29):
                v = mom[(i, m)][r + nu]
                T.append(rmul(rq(sigma[i] * y ** r), v))
            gb = printed['bern'][m][i - 1]
            for k in range(29):
                s = (0, 0)
                for r in range(k + 1):
                    s = radd(s, rmul(rq(coefs[(k, r)]), T[r]))
                n_ineq += 1
                key = (m, i)
                mins[key] = min(mins.get(key, Fr(10 ** 9)), rlo(s))
                if not rgt(s, gb):
                    okB = False
                    if rhi(s) <= gb:
                        refuting.append('Bernstein %s' % ((i, m, y, k),))
                if not rgt(s, lemma_threshold(m)):
                    okL = False
                if (i, m, y, k) == printed['bern_point'][0]:
                    point = s
        value['bernstein_minima'] = {'%d,%d' % k: '%.6f' % float(v) for k, v in sorted(mins.items())}
        check(checks, 'D. all %d Bernstein coefficients B_k exceed their grouped bounds of cert:bernstein-table' % n_ineq, okB and n_ineq == 2436,
              'group minima: ' + ', '.join('m=%d,i=%d:%.5f' % (k[0], k[1], float(v)) for k, v in sorted(mins.items())))
        check(checks, 'D. hence all exceed the thresholds of Lemma signs:bernstein (.74 at m=0, .18 at m=1, .02 at m=3,4, .009 beyond), and every table bound exceeds its threshold',
              okL and all((b_ is None or b_ > lemma_threshold(m)) for m, v in printed['bern'].items() for b_ in v))
        plo, phi = printed['bern_point'][1]
        check(checks, 'D. B at (i,m,y,k) = (2,16,-1/2,28) in [%s, %s], inside the printed [%s, %s] (certificates.tex:477-479)'
              % (dec(rlo(point), 22, -1), dec(rhi(point), 22, 1), dec(plo, 14, -1), dec(phi, 14, 1)),
              point is not None and plo <= rlo(point) and rhi(point) <= phi)
        if point is not None and (rhi(point) < plo or rlo(point) > phi):
            refuting.append('printed Bernstein enclosure')

    ok = all(c_['pass'] for c_ in checks)
    verdict = 'CERTIFIED' if ok else ('REFUTED' if refuting else 'REFUSED')
    value['refuting'] = refuting
    value['seconds'] = round(time.time() - t0, 1)
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': ('a finite component: every finite certificate the proof cites -- Lemma interpolation:finite (the two '
                        'inverse certificates via W_+-, the exterior block, the 204 residuals, the table norms) and Lemma '
                        'signs:bernstein (2436 Bernstein coefficients), recomputed with an independent quadrature and error bound, '
                        'the exact node data and envelope constants, and every scalar substitution of certificates.tex:487-572; '
                        'NOT the theorem, whose infinite inversion, sign argument and normalisation are analytic')}


# ======================================================================================================
# E. the scalar substitutions (certificates.tex:487-572 and the sections they cite)
# ======================================================================================================
def Lj(j, s):
    """a ball whose upper end bounds L_j(s) = b*_{j-1} e^{-pi g_j s} min{1/6, 1/(pi beta_j s)} (used only for upper bounds)"""
    g, beta = ENV[j][2], ENV[j][4]
    f = rq(Fr(1, 6))
    if beta != 0 and s != 0:
        alt = rinv(rmul(PI, rq(beta * s)))
        if rhi(alt) < rhi(f):
            f = alt
    return rmul(rq(ENV[j - 1][0]), rmul(rexp(rmul(PI, rq(-g * s))), f))


def LPj(j, s):
    return rmul(rq(MSTAR[j] * ENV[j][0]), rexp(rmul(PI, rq(-ENV[j][2] * s))))


def rpow(a, k):
    r = (ONE, 0)
    for _ in range(k):
        r = rmul(r, a)
    return r


def rsum(xs):
    s = (0, 0)
    for x in xs:
        s = radd(s, x)
    return s


def row_envelope(x):
    tot = (0, 0)
    for n in range(x + 1, x + 13):
        if n % 12 not in A_RES:
            continue
        iq = rinv(Qball(n))
        for j in range(1, 7):
            g = ENV[j][2]
            num = radd(radd((ONE, 0), rabs_hi(Dball(n))), rmul(PI, rq(ENV[j - 1][1])))
            geo = rinv(rsub((ONE, 0), rexp(rmul(PI, rq(-12 * g)))))
            tot = radd(tot, rmul(rmul(num, iq), rmul(rmul(rq(ENV[j][3]), Lj(j, Fr(n))), geo)))
    return tot


def atom_envelope(x):
    tot = (0, 0)
    for n in range(x + 1, x + 13):
        if n % 12 not in A_RES:
            continue
        iq = rinv(Qball(n))
        for j in range(0, 7):
            num = radd(radd((ONE, 0), rabs_hi(Dball(n))), rmul(PI, rq(ENV[j][1])))
            geo = rinv(rsub((ONE, 0), rexp(rmul(PI, rq(-12 * ENV[j][2])))))
            tot = radd(tot, rmul(rmul(num, iq), rmul(LPj(j, Fr(n)), geo)))
    return tot


def P_value(s):
    """P(s) = P_0 + 2 Re sum_{j=1}^6 P_j e^{i pi j s/6}, a real ball"""
    ang = rmul(PI, rq(Fr(s) / 6))
    w = cexp((0, ang[0], ang[1]))
    acc = kball(PJ[0])
    pw = (ONE, 0, 0)
    for j in range(1, 7):
        pw = cmul(pw, w)
        v = cmul(kball(PJ[j]), pw)
        acc = cadd(acc, (2 * v[0], 2 * v[1], 2 * v[2]))
    return cre(acc)


def scalar_checks(checks, claim_lt, claim_gt, coef, Cc, flat):
    pt = {j: rmul(PI, rq(Fr(j, 6))) for j in range(7)}
    # row envelopes and the atom tail (cert:row-substitutions; interpolation.tex:165-186)
    for x, pr, txt, used in ((0, D_('27.618723'), D_('27.7'), D_(28)), (4, D_('.269094'), D_('.272'), D_('.28')),
                             (16, D_('.014122'), D_('.0145'), D_('.015')), (100, D_('4.617010e-10'), D_('4.7e-10'), D_('5e-10'))):
        v = row_envelope(x)
        claim_lt('E. row envelope at cut %d < %s (cert:row-substitutions), hence < %s and < %s' % (x, pr, txt, used), v, pr)
    claim_lt('E. the atom-column envelope beyond 100 < 3.131186e-8 (certificates.tex:511-512), hence < 3.2e-8', atom_envelope(100), D_('3.131186e-8'))
    # the rational lower sums (signs:rational-lower-sum), exact
    s0 = Fr(83, 2)
    for i, pr, txt in ((1, D_('.01206834'), D_('.012')), (2, D_('.01656468'), D_('.016'))):
        sg = -1 if i == 1 else 1
        us = {n: sg * coef[i][n][0] for n in nodes_N0(0, 40)}
        vs = {n: sg * coef[i][n][1] for n in nodes_N0(0, 40)}
        val = sg * Cc[i] + min(sum(vs.values()), 0) / s0 + sum(min(us[n], 0) / (s0 - n) ** 2 + min(vs[n], 0) * n / (s0 * (s0 - n)) for n in us)
        check(checks, 'E. rational lower sum (signs:rational-lower-sum), index %d = %.10f > %s > %s, and - delta/(s0-40) = -.00002 leaves > .011 (exact)'
              % (i, float(val), pr, txt), val > pr and pr > txt and pr - Fr(2, 100000) > Fr(11, 1000) and Fr(3, 100000) / (s0 - 40) == Fr(2, 100000))
    sm = rsum(rdivint(rmul(rq(ENV[j][3]), rmul(pt[j], pt[j])), 6) for j in range(1, 7))
    claim_lt('E. sum_j M_j (pi t_j)^2 / 6 < 76.043 < 77', sm, D_('76.043'))
    t2 = radd(rq(Fr(5, 100000) * 77),
              radd(rmul(rq(Fr(23, 10)), rsum(rmul(rmul(rq(ENV[j][3]), Lj(j, s0)), rpow(rmul(PI, rq(ENV[j - 1][1])), 2)) for j in range(1, 7))),
                   rmul(rq(Fr(17, 1000)), rsum(rmul(LPj(j, s0), rpow(rmul(PI, rq(ENV[j][1])), 2)) for j in range(7)))))
    claim_lt('E. the second-derivative tail (signs:tail-second-derivative) < .005303 < .006', t2, D_('.005303'))
    delta = Fr(3, 100000)
    caps = {}
    for (ss, nu), pr in (((Fr(0), 0), D_('.003189')), ((Fr(1, 2), 1), D_('.003736')), ((Fr(1, 2), 2), D_('.009146')), ((Fr(2), 2), D_('.001796'))):
        v = rmul(rq(delta / factorial(nu)), rsum(rmul(rq(ENV[j][3]), radd(rdivint(rpow(pt[j], nu), 6), rmul(Lj(j, ss), rpow(rmul(PI, rq(ENV[j - 1][1])), nu))))
                                                 for j in range(1, 7)))
        caps[(ss, nu)] = v
        claim_lt('E. perturbation cap (signs:perturbation-envelope)/nu! at (s*,nu) = (%s,%d) < %s' % (ss, nu, pr), v, pr)
    check(checks, 'E. hence the caps of signs:perturbation-caps: < .004 (m=0), < .011 (m=1, both orders), < .002 (m>=3)',
          rlt(caps[(0, 0)], D_('.004')) and rlt(caps[(Fr(1, 2), 1)], D_('.011')) and rlt(caps[(Fr(1, 2), 2)], D_('.011')) and rlt(caps[(2, 2)], D_('.002')))
    tv = radd(rmul(rq(Fr(229, 100)), rsum(rdivint(rq(ENV[j][3]), 6) for j in range(1, 7))), rq(Fr(17, 1000) * sum(MSTAR)))
    claim_lt('E. 2.29 sum M_j/6 + .017 sum m*_j < 72.669 < 80 (direct-measure variation)', tv, D_('72.669'))
    for (m, Y, nu), pr in (((0, Fr(1, 2), 0), D_('1.578e-10')), ((1, Fr(1), 1), D_('2.007e-5')), ((1, Fr(1), 2), D_('5.735e-6')),
                           ((3, Fr(1), 2), D_('9.581e-11')), ((4, Fr(3, 2), 2), D_('6.133e-7'))):
        q = 29 + nu
        ratio = rmul(PI, rq(ENV[0][1] * Y / (q + 1)))
        if not rlt(ratio, 1):
            check(checks, 'E. Taylor representative (%d,%s,%d): ratio < 1' % (m, Y, nu), False)
            continue
        inner = radd(rmul(rq(80), rpow(rmul(PI, rq(Y)), q)),
                     radd(rmul(rq(Fr(23, 10)), rsum(rmul(rmul(rq(ENV[j][3]), Lj(j, Fr(m))), rpow(rmul(PI, rq(ENV[j - 1][1] * Y)), q)) for j in range(1, 7))),
                          rmul(rq(Fr(17, 1000)), rsum(rmul(LPj(j, Fr(m)), rpow(rmul(PI, rq(ENV[j][1] * Y)), q)) for j in range(7)))))
        v = rmul(rmul(rq(Y ** (-nu) / factorial(q)), rinv(rsub((ONE, 0), ratio))), inner)
        claim_lt('E. Taylor representative E(m,Y,nu) = (%d,%s,%d) < %s < .001 (cert:taylor-substitutions)' % (m, Y, nu, pr), v, pr)
    # P on the gap midpoints (Lemma signs:P-lower-bound)
    r2 = (isqrt(2 * ONE * ONE), 1)
    r6 = (isqrt(6 * ONE * ONE), 1)
    closed = {Fr(1, 2): radd(rq(12), (-8 * r2[0], 8 * r2[1])), Fr(7, 2): radd(rq(12), (-8 * r2[0], 8 * r2[1])), Fr(2): rq(1), Fr(8): rq(9),
              Fr(11, 2): rmul(rq(Fr(8, 9)), radd(radd(rq(3), r2), radd(SQ3, r6))), Fr(21, 2): rmul(rq(Fr(8, 9)), radd(radd(rq(3), r2), radd(SQ3, r6)))}
    dist = {Fr(1, 2): Fr(1, 2), Fr(7, 2): Fr(1, 2), Fr(2): Fr(1), Fr(8): Fr(1), Fr(11, 2): Fr(3, 2), Fr(21, 2): Fr(3, 2)}
    okP = okC = okI = True
    vals = []
    for smid, d in dist.items():
        quo = rmul(P_value(smid), rq(1 / d ** 2))
        vals.append('%s:%.6f' % (smid, float(rlo(quo))))
        okP &= rgt(quo, D_('.68'))
        okC &= abs(quo[0] - closed[smid][0]) <= quo[1] + closed[smid][1]
        ang = rmul(PI, rq((smid - 2) / 6))
        c = cre(cexp((0, ang[0], ang[1])))
        ident = rmul(rpow(rsub(rmul(rq(4), rmul(c, c)), rq(3)), 2), rpow(rsub(rq(1), rmul(rq(2), c)), 2))
        okI &= abs(ident[0] - P_value(smid)[0]) <= ident[1] + P_value(smid)[1]
    check(checks, 'E. P(s)/(s-m)^2 > .68 at the six gap midpoints of a period (Lemma signs:P-lower-bound); (283/200)^2 > 2 and 12 - 8(283/200) = .68',
          okP and Fr(283, 200) ** 2 > 2 and 12 - 8 * Fr(283, 200) == D_('.68'), ', '.join(vals))
    check(checks, 'E. the printed midpoint values 12-8sqrt2, 1, 9, (8/9)(3+sqrt2+sqrt3+sqrt6) and P = (4c^2-3)^2(1-2c)^2 agree with enclosures of the product (consistency, not equality)',
          okC and okI)
    # margins and the arithmetic of the analytic chain (arithmetic only)
    marg = [D_('.74') - D_('.004') - D_('.001'), D_('.18') - D_('.011') - D_('.001'), D_('.02') - D_('.002') - D_('.001'), D_('.009') - D_('.002') - D_('.001')]
    check(checks, 'E. arithmetic: the quotient margins .735, .168, .017, .006 (signs:finite-quotient) and .011(.68) - .006/2 = .00448 (signs:tail-margin)',
          marg == [D_('.735'), D_('.168'), D_('.017'), D_('.006')] and D_('.011') * D_('.68') - D_('.003') == D_('.00448')
          and D_('.00002') + D_('.00003') == D_('.00005'))
    dl = D_('5e-10')
    Rf = D_('1.1e-7')
    Rt = D_('2.29') * dl + D_('.017') * D_('3.2e-8')
    vf = max(32 + (1 + D_('3.7')) * D_('.11') * 32 / (1 - D_('.687')), (1 + D_('3.7')) / (1 - D_('.687')))
    cf = 90 + 90 * dl * (1 + 2520) / (1 - 2521 * dl)
    ct = (1 + 2520) / (1 - 2521 * dl)
    check(checks, 'E. arithmetic of Lemma interpolation:inverse and Prop. interpolation:solution: .09+.015<.11; .28+.11(3.7)=.687<1; %.4f<90; 2521 delta<1; '
          'coefficients %.6f<91, %.4f<2540; 102e-9<1.1e-7; 2(91R_f+2540R_t) = .00002860012 < .00003; 2.29+.00003<2.3' % (vf, cf, ct),
          D_('.09') + D_('.015') < D_('.11') and D_('.28') + D_('.11') * D_('3.7') == D_('.687') and vf < 90 and dl * (1 + 90 * 28) == 2521 * dl
          and 2521 * dl < 1 and cf < 91 and ct < 2540 and 102 * D_('1e-9') < Rf and 2 * (91 * Rf + 2540 * Rt) == D_('.00002860012')
          and D_('.00002860012') < D_('.00003') and D_('2.29') + D_('.00003') < D_('2.3'))
    # the paper's own quadrature-lemma arithmetic (cert:moment-error); not used by the decision above
    c1, c6 = Fr(1, 12), Fr(11, 12)
    d1, d6 = c1 * c1 + H * H - Fr(1, 36), c6 * c6 + H * H - Fr(1, 36)
    lowim = BB * (H - Fr(1, 6)) / d6 - H
    e1 = rmul(rq(1000), rexp(rmul(PI, rq(Fr(200, 6) + Fr(3, 2) * Fr(11, 10)))))
    e2 = rmul(rq(5000), rexp(rmul(PI, rq(Fr(100, 6) + 100 * D_('.081') + Fr(3, 2) * D_('6.2')))))
    check(checks, 'E. the paper\'s quadrature-lemma arithmetic: Delta_1 = 167/1200, Delta_6 = 389/400, Im z >= -1402/17505 > -.081, the 4.774/5.912 '
          'squarings, integrand bounds < 5.38e50 and < 1.51e50, 2^-254 1e53 < 3.455e-24 (their bound; this decider uses its own)',
          d1 == Fr(167, 1200) and d6 == Fr(389, 400) and lowim == Fr(-1402, 17505) and lowim > D_('-.081')
          and D_('1.732') ** 2 == D_('2.999824') and D_('24.515') ** 2 == D_('600.985225') and D_('4.774') * D_('1.732') * (D_('24.515') - 10) == D_('120.01826452')
          and (D_('5.912') - D_('.4')) * (D_('24.515') - 10) == D_('80.00668') and rlt(e1, D_('5.38e50')) and rlt(e2, D_('1.51e50'))
          and Fr(10 ** 53, 2 ** 254) < D_('3.455e-24'))


# ======================================================================================================
def forge():
    """each must NOT certify"""
    out = []
    src = Sources()
    data = load(src)
    rows = [list(r) for r in data['rows']]
    k = [r[0] for r in rows].index(7)
    rows[k][1] += 10                          # c~_{1,7} moved by 1e-9
    out.append(('table entry c~_{1,7} moved by 1e-9 (10 integer units)', decide(rows_override=[tuple(r) for r in rows], parts=['residual'])['verdict']))
    W = {e: [list(r) for r in m] for e, m in data['W'].items()}
    W[1][0][0] += 20                          # one entry of W_+ moved by 2e-3
    out.append(('W_+ entry (c1,c1) moved by 2e-3 (the defect bound .001 must fail)', decide(W_override=W, parts=['matrix'])['verdict']))
    pr = dict(PRINTED)
    pr['bern'] = dict(PRINTED['bern'])
    for m in (12, 13, 15, 16):
        pr['bern'][m] = (PRINTED['bern'][m][0], D_('.0096'))
    out.append(('Bernstein group bound for m in {12..16}, i=2 printed .0096 instead of .0094', decide(printed=pr, parts=['bernstein'])['verdict']))
    fixed = dict(data['fixed'])
    out.append(('constant C_1 = -0.012 instead of -0.013', decide_fixed({1: (Fr(1), Fr(44, 100), Fr(-12, 1000)), 2: fixed[2]})))
    pr = dict(PRINTED)
    pr['exterior'] = (D_('.08688748182289641592'), D_('.08688748182289641593'))
    out.append(('printed exterior-norm enclosure shifted by one unit in its last digit', decide(printed=pr, parts=['matrix'])['verdict']))
    return out


def decide_fixed(fixed):
    src = Sources()
    data = load(src)
    old = load.__globals__['inputs_from']

    def patched(rows, fx, scale=10 ** 10):
        return old(rows, fixed, scale)
    load.__globals__['inputs_from'] = patched
    try:
        return decide(src, parts=['residual'])['verdict']
    finally:
        load.__globals__['inputs_from'] = old


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
