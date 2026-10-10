"""F-675 -- "A finite-time singularity of Calabi flow on projective space" (openai/math family 352).

THE CLAIM (build/sections/introduction.tex:20-30, Theorem thm:main): a smooth U(10)-invariant Kahler form in the
Fubini--Study class of CP^10 whose maximal Calabi flow exists on [0, T*) with T* finite and scalar curvature blowing
up like a (T* - t)^(-1/2).  Its finite input is Proposition cert:shoot (build/sections/certificate.tex:11-25):
  "For every parameter z* in [-R,R]^2, where R = 5 10^-10, let (k,d) be given by (prof:parameters), and let p be the
   origin solution of (prof:ode) supplied by Lemma prof:origin.  This solution extends to 0 <= s <= S0 = 56 and
   satisfies 1 + p(s) > 0.  For the coordinates of its jet relative to p_a, defined in (prof:coordinates), one has
   |q| <= .25R,  ||(Re xi, Im xi) - z*||_inf <= .13R."
with prof:ode p''' + (30/s)p'' + (B/s^2)p' + (C/s^3)(p-d) + p/(1+p) = 0, B = 751/4, C = -1215/4 (profile.tex:60-65),
(k,d) = (-.094617116666041, .400682721856639) + 10^-8 [[25190, -63731], [721855, 359157]] z* (profile.tex:93-102),
p_a and the coordinates (q, xi) of the jet at 56 in the eigenbasis of D0 (profile.tex:173-196).

WHAT IS DECIDED HERE -- the whole of Proposition cert:shoot, by a validated integration written for this audit (no
code of the release is read or run; the paper's integer-interval scheme, its Cauchy-disk remainder and its error
constants are NOT reused):
  O. The origin family (s in [0,1]).  The series p = d + k r + sum a_i r^i, r = s^(3/2), with the recurrence
     a_i = ([r^(i-2)](1/(1+p)) - [i=2]) / ((27/8)(i-1)(i+9)(i+10)) RE-DERIVED from prof:ode (the operator identity
     Q(2/3 s d/ds) = (8/27)(s^3 d^3 + 3 s^2 d^2 + s d) + ..., checked coefficient by coefficient), computed EXACTLY
     (Fraction) to i = 60 at the central (k0, d0), with its exact k- and d-derivatives.  Tails and the nonlinear
     parameter remainder by this decider's own majorant lemma: in the weighted algebra ||f|| = sum |f_i| 3^i, for every
     complex (k,d) with |k-k0|, |d-d0| <= 1/10 the map a -> T(a) is a contraction of the ball ||a|| <= 3/50 (constants
     checked exactly), so |a_i| <= (3/50) 3^-i, the jet is bounded by M_m on that polydisc, the derivative tails follow
     by Cauchy's estimate, and the second-order remainder by the two-variable Cauchy estimate.  1 + p > 0 on [0,1].
  I. The 288 blocks of the paper's schedule on [1,56] (lengths 1/32, 1/16, 1/8, 1/4), each split into FOUR Taylor
     steps (the paper uses eight) of order K = 20 (the paper: 46), 1152 steps, in midpoint-radius integer arithmetic at
     scale 2^-256 (the paper uses endpoint intervals): the state p and the 4x4 first-variation matrix are expanded in
     the step variable from the ODE multiplied by 4 s^3; the remainder is the LAGRANGE remainder, enclosed by
     evaluating the (K+1)-st Taylor coefficient over an a-priori enclosure of the state and of the variation on the
     whole step, obtained by Picard iteration y(0) + [0,1] f([s], Y) subset Y (Moore/Lohner; the paper instead adds a
     fixed Cauchy allowance justified by a hand-proved complex-disk bootstrap).  Each block restarts from the midpoint
     U_j of the previous enclosure (the jump is charged); M_j encloses the exact block transfer of the reference, and
     Mt_j is its midpoint.  SECOND WAY: at s = 81/64, a step start where r = s^(3/2) = 729/512 is rational, the
     origin series (110 terms, majorant tail; it converges for r < 3) and the integrator must agree on (p, p', p'')
     and on both parameter derivatives (to 1e-24; they agree to ~1e-32).
  E. Error propagation, this decider's own accounting: e_i = Tt_(i,0) e_0 + sum_j Tt_(i,j+1)[(M_j - Mt_j) delta_j + F_j
     + J_j] with Tt the products of the point matrices (enclosed for all 41,616 pairs), J_j the jumps, F_j the
     nonlinear forcing, bounded componentwise; a bootstrap |delta p| <= Delta with N = (delta p)^2/((1+p_ref)^2(1+p))
     <= Delta^2/(m_j^2(m_j - Delta)), m_j the certified minimum of 1 + p_ref on block j; within a block the linear
     part of delta p is bounded by the enclosed transfers themselves and the forcing by a logarithmic-norm (weighted
     infinity-norm) Gronwall bound with a per-block weight; the bootstrap closes strictly.
  P. The projection: the exact real coordinate matrix Gamma enclosed from the real root of D0 (bisection, exact
     rationals, uniqueness from the discriminant of D0') and the complex pair (quotient quadratic, interval sqrt),
     the rows of the inverse Vandermonde in complex interval arithmetic; P_a(d) and its d-derivative exactly; then
     |q| and ||(Re xi, Im xi) - z*|| bounded for ALL z* in the square, linear part exactly, and compared with .25R and
     .13R.  Gamma is applied directly; the paper's rational Lambda is only used to recompute the paper's printed
     comparisons.  RESULT: |q| <= 0.1150R (paper's budget: .2315R < .25R), ||(Re xi, Im xi) - z*|| <= 0.0031R (paper:
     .0901R < .13R), bootstrap |delta p| <= 2.43R (paper assumes 14R), min 1 + p_ref = 0.2469 on [1,56].
     A failure would be REFUTED only through a second, independent fact: a proven LOWER bound for |q| or |xi - z*| at
     the centre or a corner of the square exceeding the printed bound; otherwise a failed upper bound is REFUSED.
  N. The paper's printed numbers, recomputed: the origin constants (711/1100, .768, .4, .534, E60, .01169933, the
     parameter displacements, E_par, (cert:initial-error)); the schedule (288 blocks, sum 55, h s_c >= 32); the disk
     constants (.954, .190, .011, H2 < .123602, .04625, 2.1, 17.146, (128/3) 4^-45 < 48 4^-45, .008515625); the
     finite products and matching comparisons (cert:finite-products, cert:finite-matching) evaluated on THIS decider's
     reference trajectory (same schedule, different rounding: they are the paper's quantities up to ~1e-15); the
     perturbation and bootstrap arithmetic (.001, 580000, 250000, 2.72, 4.3, .1055747504R, 12.169035R, .2315396,
     .0901084); Lemma prof:root-bounds (root boxes, the two printed D0 values, alpha^2 - 3 beta, u_-, u_+, the Gamma
     table, |Gamma - Lambda| < .001, the row sums) and (cert:pa-variation).  Exponentials by a series with a proved tail.

OBSERVATIONS (after this decider ran, the release's verification/*.py were READ, never run): certificate.py performs
the integer-interval Taylor integration (degree 46, eight steps per block), adds to every coefficient sum the fixed
allowance 48 4^-45 whose validity is the paper's complex-disk bootstrap (the program asserts the step-start bounds that
argument needs, not the bound sup < 32 itself), truncates the origin series at 60 terms (the tail and the parameter
remainder are charged only in the text's budget), and asserts cert:finite-products and cert:finite-matching with the
rational Lambda.  arithmetic_allowances.py re-checks the text's rational constants (E60, E_par, H_2, 4.3, .1055747504R,
.2315396, ...) and tail-check.py the root/tail constants; neither re-derives the analytic chain.  This decider replaces
that chain by its own (Lagrange/Picard remainders, its own error recursion and bootstrap, the exact Gamma).

WHAT IS NOT DECIDED (theory): everything outside Proposition cert:shoot -- the geometry of U(10)-invariant metrics and
the reduction of Calabi flow to the flat equation, the shrinker ansatz and prof:profile-equation (the change of
variables to prof:ode IS re-derived), the tail Lemma prof:tail (contraction on [56, oo), its constants M_i and the
residual Lemma prof:tail-residual are not checked), the Brouwer matching, the weighted asymptotics, the parabolic
and compactness sections, and the blow-up.  The classical theorems this decider's own argument rests on are stated,
not proved: Picard--Lindelof enclosure, Lagrange's remainder, variation of constants, the logarithmic-norm Gronwall
bound, Cauchy's estimates, Banach's fixed point theorem and the continuity (bootstrap) argument.
"""
import json
import os
import sys
import time
from fractions import Fraction
from math import comb, isqrt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/A-finite-time-singularity-of-Calabi-flow-on-projective-space-September-24-2026/build/sections/'
CERT = DIR + 'certificate.tex'
PROF = DIR + 'profile.tex'
INTRO = DIR + 'introduction.tex'
F = Fraction
dec = Fraction        # a terminating decimal of the paper denotes its exact rational

R_ = dec('5e-10')
K0 = dec('-.094617116666041')
D0 = dec('.400682721856639')
PMAT = ((25190, -63731), (721855, 359157))         # times 10^-8
LAMBDA = ((30756, -27384, 33447), (34622, 13692, -16724), (-2925, -34040, -28850))   # times 10^-5
BB, CC = F(751, 4), F(-1215, 4)
S0 = 56

# ================================================================ midpoint-radius integer balls, scale 2^-P
P = 256
ONE = 1 << P


def bf(q):
    q = F(q)
    m = (q.numerator << P) // q.denominator
    return (m, 0 if (m * q.denominator == q.numerator << P) else 1)


def bi(n):
    return (n << P, 0)


ZERO = (0, 0)
B1 = bi(1)


def badd(x, y):
    return (x[0] + y[0], x[1] + y[1])


def bsub(x, y):
    return (x[0] - y[0], x[1] + y[1])


def bneg(x):
    return (-x[0], x[1])


def bmul(x, y):
    m1, r1 = x
    m2, r2 = y
    if r1 == 0 and r2 == 0:
        return ((m1 * m2) >> P, 1)
    e = abs(m1) * r2 + abs(m2) * r1 + r1 * r2
    return ((m1 * m2) >> P, (e >> P) + 2)


def bmuli(x, k):
    return (x[0] * k, x[1] * abs(k))


def bdivi(x, k):
    assert k > 0
    return (x[0] // k, x[1] // k + 2)


def bshift(x, e):
    """x * 2^e, exact for e >= 0, outward for e < 0"""
    if e >= 0:
        return (x[0] << e, x[1] << e)
    return (x[0] >> -e, (x[1] >> -e) + 2)


def binv(x):
    m, r = x
    am = abs(m)
    assert am > r, 'reciprocal of a ball containing zero'
    c = (1 << (2 * P)) // m
    rad = ((r << (2 * P)) // ((am - r) * am)) + 2
    return (c, rad)


def blo(x):
    return F(x[0] - x[1], ONE)


def bhi(x):
    return F(x[0] + x[1], ONE)


def babs_ub(x):
    return F(abs(x[0]) + x[1], ONE)


def bfrom_ends(lo, hi):
    """ball from integer endpoints (scale 2^-P)"""
    mid = (lo + hi) >> 1
    return (mid, max(hi - mid, mid - lo))


def bhull0(x):
    lo, hi = x[0] - x[1], x[0] + x[1]
    return bfrom_ends(min(0, lo), max(0, hi))


def bhull(x, y):
    return bfrom_ends(min(x[0] - x[1], y[0] - y[1]), max(x[0] + x[1], y[0] + y[1]))


def bsubset(x, y):
    return x[0] - x[1] >= y[0] - y[1] and x[0] + x[1] <= y[0] + y[1]


def bwiden(x, rel=8, absu=1 << 20):
    return (x[0], x[1] + x[1] // rel + absu)


# ================================================================ Fraction intervals (small exact algebra)
class FI:
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi=None):
        self.lo = F(lo)
        self.hi = F(lo if hi is None else hi)
        assert self.lo <= self.hi

    def __add__(s, o):
        o = o if isinstance(o, FI) else FI(o)
        return FI(s.lo + o.lo, s.hi + o.hi)
    __radd__ = __add__

    def __neg__(s):
        return FI(-s.hi, -s.lo)

    def __sub__(s, o):
        o = o if isinstance(o, FI) else FI(o)
        return FI(s.lo - o.hi, s.hi - o.lo)

    def __rsub__(s, o):
        return FI(o) - s

    def __mul__(s, o):
        o = o if isinstance(o, FI) else FI(o)
        ps = (s.lo * o.lo, s.lo * o.hi, s.hi * o.lo, s.hi * o.hi)
        return FI(min(ps), max(ps)).rnd()
    __rmul__ = __mul__

    def inv(s):
        assert s.lo > 0 or s.hi < 0
        return FI(1 / s.hi, 1 / s.lo).rnd()

    def __truediv__(s, o):
        o = o if isinstance(o, FI) else FI(o)
        return s * o.inv()

    def rnd(s, bits=320):
        q = 1 << bits
        lo = F((s.lo.numerator * q) // s.lo.denominator, q)
        hi = F(-((-s.hi.numerator * q) // s.hi.denominator), q)
        return FI(lo, hi)

    def mag(s):
        return max(abs(s.lo), abs(s.hi))

    def sq(s):
        if s.lo >= 0:
            return FI(s.lo ** 2, s.hi ** 2).rnd()
        if s.hi <= 0:
            return FI(s.hi ** 2, s.lo ** 2).rnd()
        return FI(0, max(s.lo ** 2, s.hi ** 2)).rnd()

    def sqrt(s, bits=300):
        assert s.lo >= 0
        q = 1 << bits
        lo = F(isqrt((s.lo.numerator * q * q) // s.lo.denominator), q)
        hi = F(isqrt(-((-s.hi.numerator * q * q) // s.hi.denominator)) + 1, q)
        assert lo * lo <= s.lo and hi * hi >= s.hi
        return FI(lo, hi)


def ball_fi(x):
    return FI(blo(x), bhi(x))


class CI:
    """complex interval as a pair of FI"""
    __slots__ = ('re', 'im')

    def __init__(self, re, im=0):
        self.re = re if isinstance(re, FI) else FI(re)
        self.im = im if isinstance(im, FI) else FI(im)

    def __add__(s, o):
        return CI(s.re + o.re, s.im + o.im)

    def __sub__(s, o):
        return CI(s.re - o.re, s.im - o.im)

    def __neg__(s):
        return CI(-s.re, -s.im)

    def __mul__(s, o):
        return CI(s.re * o.re - s.im * o.im, s.re * o.im + s.im * o.re)

    def __truediv__(s, o):
        den = o.re.sq() + o.im.sq()
        return CI((s.re * o.re + s.im * o.im) / den, (s.im * o.re - s.re * o.im) / den)


# ================================================================ rigorous exponential (upper bound)
def exp_ub(x, n=60):
    x = F(x)
    assert 0 <= x < n + 2
    s, t = F(0), F(1)
    for k in range(n + 1):
        s += t
        t = t * x / (k + 1)
    return s + t / (1 - x / (n + 2))     # t = x^(n+1)/(n+1)!; tail ratios <= x/(n+2)


# ================================================================ the ODE (prof:ode), re-derived from Q(y d/dy)
def ode_from_Q():
    """Q(D) = (D-1)(D+9)(D+10), D = (2/3) s d/ds; theta = s d/ds: theta^2 = s^2 d^2 + s d, theta^3 = s^3 d^3 + 3s^2 d^2 + s d.
    Returns the coefficients of s^3 d^3, s^2 d^2, s d, 1 of Q, and the multiplier 27/(8) that normalizes s^3 d^3."""
    q = [F(-90), F(71), F(18), F(1)]                      # Q(D) = D^3 + 18 D^2 + 71 D - 90
    assert [x for x in q] == [F(-1) * 9 * 10, F(9 * 10 - 9 - 10), F(9 + 10 - 1), F(1)]
    th = {1: [0, 1, 0, 0], 2: [0, 1, 1, 0], 3: [0, 1, 3, 1]}   # theta^n in the basis (1, s d, s^2 d^2, s^3 d^3)
    out = [q[0], F(0), F(0), F(0)]
    for nn in (1, 2, 3):
        c = q[nn] * F(2, 3) ** nn
        for i in range(4):
            out[i] += c * th[nn][i]
    norm = 1 / out[3]
    return [x * norm for x in out]                         # (const, s d, s^2 d^2, s^3 d^3) / leading


# ================================================================ the origin series (Lemma prof:origin)
def Dden(i):
    return F(27, 8) * (i - 1) * (i + 9) * (i + 10)


def origin_series(k, d, n):
    z = [1 + d, k]
    zk = [F(0), F(1)]
    zd = [F(1), F(0)]
    b, bk, bd = [], [], []
    for i in range(2, n + 1):
        m = i - 2
        while len(b) <= m:
            mm = len(b)
            if mm == 0:
                b.append(1 / z[0])
                bk.append(-b[0] * zk[0] * b[0])
                bd.append(-b[0] * zd[0] * b[0])
            else:
                b.append(-b[0] * sum(z[t] * b[mm - t] for t in range(1, mm + 1)))
                bk.append(-b[0] * (sum(zk[t] * b[mm - t] for t in range(0, mm + 1)) + sum(z[t] * bk[mm - t] for t in range(1, mm + 1))))
                bd.append(-b[0] * (sum(zd[t] * b[mm - t] for t in range(0, mm + 1)) + sum(z[t] * bd[mm - t] for t in range(1, mm + 1))))
        a = (b[m] - (1 if i == 2 else 0)) / Dden(i)
        z.append(a)
        zk.append(bk[m] / Dden(i))
        zd.append(bd[m] / Dden(i))
    return z, zk, zd


def gm(m, i):
    x = F(3 * i, 2)
    return [F(1), x, x * (x - 1)][m]


def jet_at_1(z):
    """(p(1), p'(1), p''(1)) from z_i = coefficients of 1 + p in r = s^(3/2) (z_0 = 1 + d)"""
    return [sum(z) - 1, sum(z[i] * gm(1, i) for i in range(1, len(z))), sum(z[i] * gm(2, i) for i in range(1, len(z)))]


def origin_lemma(n, eps=F(1, 10), rho=3, alpha=F(3, 50)):
    """this decider's majorant lemma: constants, tails and the jet bounds M_m on the complex polydisc"""
    D2 = Dden(2)
    kap = (abs(K0) + eps) * rho
    gam = 1 + D0 - eps
    mu = kap + alpha
    beta = 1 / (gam - mu)
    maps_in = F(rho * rho) / D2 * (beta + 1) <= alpha
    contr = F(rho * rho) * beta * beta / D2
    ok = mu < gam and maps_in and contr < 1

    def tailsum(m, start):
        """sum_{i >= start} g_m(i) rho^-i, bounded by a geometric series with the first ratio (ratios decrease)"""
        q = gm(m, start + 1) / (rho * gm(m, start))
        assert q < 1
        return gm(m, start) / F(rho) ** start / (1 - q)
    tails = [alpha * tailsum(m, n + 1) for m in range(3)]
    dtails = [t / eps for t in tails]
    M = [abs(D0) + eps + (abs(K0) + eps) + alpha * tailsum(0, 2),
         (abs(K0) + eps) * gm(1, 1) + alpha * tailsum(1, 2),
         (abs(K0) + eps) * gm(2, 1) + alpha * tailsum(2, 2)]
    pos = 1 + D0 - eps - mu / rho                     # 1 + p >= |1+d| - sum_{i>=1}|z_i| r^i, r <= 1 < rho
    return dict(ok=ok, beta=beta, contr=contr, tails=tails, dtails=dtails, M=M, pos=pos, eps=eps, alpha=alpha, rho=rho)


# ================================================================ the validated Taylor step
def coeffs(sc, Hb):
    H2 = bmul(Hb, Hb)
    H3 = bmul(H2, Hb)
    sc2 = bmul(sc, sc)
    sc3 = bmul(sc2, sc)
    c1 = [sc, Hb]
    c2 = [sc2, bmuli(bmul(sc, Hb), 2), H2]
    c3 = [sc3, bmuli(bmul(sc2, Hb), 3), bmuli(bmul(sc, H2), 3), H3]
    A3 = [bmuli(x, 4) for x in c3]
    A2 = [bmuli(bmul(Hb, x), 120) for x in c2]
    A1 = [bmuli(bmul(H2, x), 751) for x in c1]
    A0 = bmuli(H3, -1215)
    AN = [bmuli(bmul(H3, x), 4) for x in c3]
    return A3, A2, A1, A0, AN, binv(A3[0])


def lin_part(cf, X, n):
    A3, A2, A1 = cf[0], cf[1], cf[2]
    s = ZERO
    for a in range(1, min(3, n) + 1):
        m = n - a
        s = badd(s, bmuli(bmul(A3[a], X[m + 3]), (m + 1) * (m + 2) * (m + 3)))
    for a in range(0, min(2, n) + 1):
        m = n - a
        s = badd(s, bmuli(bmul(A2[a], X[m + 2]), (m + 1) * (m + 2)))
    for a in range(0, min(1, n) + 1):
        m = n - a
        s = badd(s, bmuli(bmul(A1[a], X[m + 1]), m + 1))
    return s


def series(cf, Pi, d, cols, K):
    """Taylor coefficients P_0..P_K of p in t (s = s_c + H t) and Q^c_0..Q^c_K of the variations, from
    4 s^3 p''' + 120 s^2 p'' + 751 s p' - 1215 (p - d) + 4 s^3 (1 - 1/(1+p)) = 0 (prof:ode times 4 s^3)"""
    A0, AN, inv = cf[3], cf[4], cf[5]
    Pc = list(Pi)
    Qs = [list(q) for q in cols]
    W, W2 = [], []
    WQ = [[] for _ in Qs]
    for n in range(K - 2):
        if n == 0:
            W.append(binv(badd(B1, Pc[0])))
        else:
            s = ZERO
            for i in range(1, n + 1):
                s = badd(s, bmul(Pc[i], W[n - i]))
            W.append(bneg(bmul(W[0], s)))
        s = ZERO
        for i in range(n + 1):
            s = badd(s, bmul(W[i], W[n - i]))
        W2.append(s)
        S = lin_part(cf, Pc, n)
        S = badd(S, bmul(A0, bsub(Pc[n], d) if n == 0 else Pc[n]))
        for a in range(0, min(3, n) + 1):
            S = badd(S, bmul(AN[a], bsub(B1, W[0]) if n - a == 0 else bneg(W[n - a])))
        Pc.append(bdivi(bneg(bmul(S, inv)), (n + 1) * (n + 2) * (n + 3)))
        for c, Q in enumerate(Qs):
            s = ZERO
            for i in range(n + 1):
                s = badd(s, bmul(W2[i], Q[n - i]))
            WQ[c].append(s)
            S = lin_part(cf, Q, n)
            S = badd(S, bmul(A0, bsub(Q[n], B1) if (n == 0 and c == 3) else Q[n]))
            for a in range(0, min(3, n) + 1):
                S = badd(S, bmul(AN[a], WQ[c][n - a]))
            Q.append(bdivi(bneg(bmul(S, inv)), (n + 1) * (n + 2) * (n + 3)))
    return Pc, Qs


def rhs_box(S, Hb, Y, d):
    """f~(S, Y) for the scaled state Y = (p, H p', H^2 p''): (Y1, Y2, H^3 p''')"""
    iS = binv(S)
    H2 = bmul(Hb, Hb)
    H3 = bmul(H2, Hb)
    t1 = bmul(bmul(Hb, iS), Y[2])                                  # H/s Y2
    t2 = bmul(bmul(H2, bmul(iS, iS)), Y[1])                        # H^2/s^2 Y1
    t3 = bmul(bmul(H3, bmul(bmul(iS, iS), iS)), bsub(Y[0], d))     # H^3/s^3 (Y0 - d)
    nl = bmul(H3, bsub(B1, binv(badd(B1, Y[0]))))                  # H^3 p/(1+p)
    F2 = bsub(badd(bmuli(t1, -30), bdivi(bmuli(t3, 1215), 4)), badd(bdivi(bmuli(t2, 751), 4), nl))
    return [Y[1], Y[2], F2]


def jac_box(S, Hb, Y):
    iS = binv(S)
    H2 = bmul(Hb, Hb)
    H3 = bmul(H2, Hb)
    iS3 = bmul(bmul(iS, iS), iS)
    w = binv(badd(B1, Y[0]))
    cH = bdivi(bmuli(bmul(H3, iS3), 1215), 4)                      # -C H^3/s^3
    j20 = bsub(cH, bmul(H3, bmul(w, w)))
    j21 = bneg(bdivi(bmuli(bmul(H2, bmul(iS, iS)), 751), 4))
    j22 = bmuli(bmul(Hb, iS), -30)
    j23 = bneg(cH)
    return j20, j21, j22, j23


def picard_y(S, Hb, y, d):
    B = [badd(y[i], bhull0(f)) for i, f in enumerate(rhs_box(S, Hb, y, d))]
    B = [bwiden(x, 2, 1 << 40) for x in B]
    for _ in range(60):
        Bn = [badd(y[i], bhull0(f)) for i, f in enumerate(rhs_box(S, Hb, B, d))]
        if all(bsubset(Bn[i], B[i]) for i in range(3)):
            return Bn
        B = [bwiden(bhull(B[i], Bn[i]), 4, 1 << 40) for i in range(3)]
    raise RuntimeError('Picard enclosure for the state failed')


def picard_v(S, Hb, Yhat):
    j20, j21, j22, j23 = jac_box(S, Hb, Yhat)
    I = [[B1 if r == c else ZERO for c in range(4)] for r in range(3)]

    def img(V):
        out = [[None] * 4 for _ in range(3)]
        for c in range(4):
            v3 = B1 if c == 3 else ZERO
            out[0][c] = badd(I[0][c], bhull0(V[1][c]))
            out[1][c] = badd(I[1][c], bhull0(V[2][c]))
            g = badd(badd(bmul(j20, V[0][c]), bmul(j21, V[1][c])), badd(bmul(j22, V[2][c]), bmul(j23, v3)))
            out[2][c] = badd(I[2][c], bhull0(g))
        return out
    V = [[bwiden(x, 2, 1 << 40) for x in row] for row in img(I)]
    for _ in range(60):
        Vn = img(V)
        if all(bsubset(Vn[r][c], V[r][c]) for r in range(3) for c in range(4)):
            return Vn
        V = [[bwiden(bhull(V[r][c], Vn[r][c]), 4, 1 << 40) for c in range(4)] for r in range(3)]
    raise RuntimeError('Picard enclosure for the variation failed')


HALF = bf(F(1, 2))


def step(sc, H, y, d, K):
    Hb = bf(H)
    cfp = coeffs(bf(sc), Hb)
    init = [[B1 if c == 0 else ZERO, B1 if c == 1 else ZERO, HALF if c == 2 else ZERO] for c in range(4)]
    Pc, Qs = series(cfp, [y[0], y[1], bmul(HALF, y[2])], d, init, K)
    S = bfrom_ends(bf(sc)[0], bf(sc + H)[0] + 1)
    Yhat = picard_y(S, Hb, y, d)
    Vhat = picard_v(S, Hb, Yhat)
    cfb = coeffs(S, Hb)
    Pb, Qb = series(cfb, [Yhat[0], Yhat[1], bmul(HALF, Yhat[2])], d,
                    [[Vhat[0][c], Vhat[1][c], bmul(HALF, Vhat[2][c])] for c in range(4)], K + 1)

    def ends(X, rem):
        s0, s1, s2 = ZERO, ZERO, ZERO
        for k in range(K + 1):
            s0 = badd(s0, X[k])
            if k >= 1:
                s1 = badd(s1, bmuli(X[k], k))
            if k >= 2:
                s2 = badd(s2, bmuli(X[k], k * (k - 1)))
        return [badd(s0, rem), badd(s1, bmuli(rem, K + 1)), badd(s2, bmuli(rem, (K + 1) * K))]
    y_end = ends(Pc, Pb[K + 1])
    Vt = [[None] * 4 for _ in range(3)]
    for c in range(4):
        col = ends(Qs[c], Qb[c][K + 1])
        for r in range(3):
            Vt[r][c] = col[r]
    return y_end, Vt, Yhat, Vhat, (Pb[K + 1], [Qb[c][K + 1] for c in range(4)])


def mat4(V3):
    return [list(V3[0]), list(V3[1]), list(V3[2]), [ZERO, ZERO, ZERO, B1]]


def mmul(A, B_):
    n, m, p = len(A), len(B_), len(B_[0])
    out = []
    for i in range(n):
        row = []
        for j in range(p):
            s = ZERO
            for k in range(m):
                if A[i][k] != ZERO and B_[k][j] != ZERO:
                    s = badd(s, bmul(A[i][k], B_[k][j]))
            row.append(s)
        out.append(row)
    return out


def schedule():
    out = []
    s = F(1)
    for (a, b_, ell, cnt) in ((1, 2, F(1, 32), 32), (2, 4, F(1, 16), 32), (4, 8, F(1, 8), 32), (8, 56, F(1, 4), 192)):
        for _ in range(cnt):
            out.append((s, ell))
            s += ell
    return out


def log2int(x):
    """e with x = 2^-e (x a power of two)"""
    e = 0
    while x < 1:
        x *= 2
        e += 1
    assert x == 1
    return e


_TRAJ = {}
PROBE = F(81, 64)        # a substep start where r = s^(3/2) = 729/512 is rational: the origin series checks the integrator


def trajectory(U0, d0b, K):
    """the reference trajectory over the 288 blocks, four validated steps per block"""
    key = (tuple(U0), d0b, K)
    if key in _TRAJ:
        return _TRAJ[key]
    blocks = schedule()
    U = list(U0)
    recs = []
    maxrem = F(0)
    probe = None
    rng = [None, None, F(0), F(0)]          # min p, max p, max |ell p'|, max |ell^2 p''| over all a-priori boxes
    for j, (sj, ell) in enumerate(blocks):
        H = ell / 4
        E = log2int(H)
        y = [U[0], bshift(U[1], -E), bshift(U[2], -2 * E)]
        Vacc = [[B1 if r == c else ZERO for c in range(4)] for r in range(4)]
        mj = None
        row0 = []
        for k in range(4):
            sc = sj + k * H
            if sc == PROBE:
                probe = ([y[0], bshift(y[1], E), bshift(y[2], 2 * E)], [[bshift(Vacc[r][c], E * ([0, 1, 2, 0][r] - [0, 1, 2, 0][c])) for c in range(4)] for r in range(3)])
            y, Vt, Yhat, Vhat, rems = step(sc, H, y, d0b, K)
            lo = dyadic_down(blo(badd(B1, Yhat[0])))
            mj = lo if mj is None else min(mj, lo)
            rng[0] = blo(Yhat[0]) if rng[0] is None else min(rng[0], blo(Yhat[0]))
            rng[1] = bhi(Yhat[0]) if rng[1] is None else max(rng[1], bhi(Yhat[0]))
            rng[2] = max(rng[2], 4 * babs_ub(Yhat[1]))
            rng[3] = max(rng[3], 16 * babs_ub(Yhat[2]))
            r0 = mmul([Vhat[0]], Vacc)[0]
            row0.append([r0[0], bshift(r0[1], -E), bshift(r0[2], -2 * E), r0[3]])
            Vacc = mmul(mat4(Vt), Vacc)
            maxrem = max(maxrem, babs_ub(rems[0]), *[babs_ub(x) for x in rems[1]])
        x_end = [y[0], bshift(y[1], E), bshift(y[2], 2 * E)]
        U = [(x[0], 0) for x in x_end]
        jump = [F(x[1], ONE) for x in x_end]
        ex = [0, 1, 2, 0]
        M = [[bshift(Vacc[r][c], E * (ex[r] - ex[c])) for c in range(4)] for r in range(3)]
        Mt = [[(x[0], 0) for x in row] for row in M] + [[ZERO, ZERO, ZERO, B1]]
        dM = [[F(x[1], ONE) for x in row] for row in M] + [[F(0)] * 4]
        recs.append(dict(s=sj, ell=ell, m=mj, row0=row0, Mt=Mt, dM=dM, jump=jump, M=M + [[ZERO, ZERO, ZERO, B1]]))
    out = dict(recs=recs, U_N=U, maxrem=maxrem, probe=probe, rng=rng)
    _TRAJ[key] = out
    return out


# ================================================================ pair products and the error recursion
P2 = 72
SH = P - P2


def lowball(x):
    """a scale-2^-P ball as a scale-2^-P2 ball containing it"""
    if x[1] == 0 and x[0] % (1 << SH) == 0:
        return (x[0] >> SH, 0)
    return (x[0] >> SH, (x[1] >> SH) + 2)


def lub(x):
    return abs(x[0]) + x[1]            # upper bound of |x| in units of 2^-P2


def lmatmul(T, M):
    """rows 0..2 of T (3x4, row 3 of T is e3) times M (4x4, row 3 e3), scale 2^-P2"""
    out = []
    for a in range(3):
        Ta = T[a]
        row = []
        for b_ in range(4):
            sm, sr = 0, 0
            for c in range(4):
                m1, r1 = Ta[c]
                m2, r2 = M[c][b_]
                if m1 == 0 and r1 == 0 or m2 == 0 and r2 == 0:
                    continue
                sm += (m1 * m2) >> P2
                sr += ((abs(m1) * r2 + abs(m2) * r1 + r1 * r2) >> P2) + 2
            row.append((sm, sr))
        out.append(row)
    return out


def dyadic_down(x, bits=40):
    return F((x.numerator << bits) // x.denominator, 1 << bits)


def dyadic_up(x, bits=40):
    return F(-((-x.numerator << bits) // x.denominator), 1 << bits)


def gronwall(sj, ell, mj):
    """weight w and the logarithmic-norm bound mu (infinity norm, weights 1, 1/w, 1/w^2, 1) of the Jacobian of the
    linearization on the block; returns (w, mu, upper bound of exp(mu ell)).  mj is a (dyadic) lower bound of 1 + p."""
    s1 = sj + ell
    best = None
    for k in range(-6, 60):
        w = F(k + 8, 4) if k >= 0 else F(2, 2 ** (-k))
        row2 = -F(30) / s1 + max(abs(CC) / sj ** 3, 1 / mj ** 2) / w ** 2 + BB / (sj ** 2 * w) + abs(CC) / (sj ** 3 * w ** 2)
        mu = max(w, row2)
        if best is None or mu < best[1]:
            best = (w, mu)
    w, mu = best
    return w, mu, exp_ub(dyadic_up(mu * ell))


def error_recursion(recs, Ys, e0, fvec, R):
    """E_i >= |e_i| componentwise for i = 0..N, with all pair products of the point transfers; also the norms the
    paper prints about those products"""
    N = len(recs)
    Mlow = [[[lowball(x) for x in row] for row in r['Mt']] for r in recs]
    Pe = 240
    SC = 1 << Pe

    def ceil_int(q):
        return -((-q.numerator * SC) // q.denominator)
    e0i = [ceil_int(x) for x in e0]
    WS = 1 << 40
    wint = [-((-(r['ell'] / r['m'] ** 3).numerator * WS) // (r['ell'] / r['m'] ** 3).denominator) for r in recs]   # ceil(ell/m^3 2^40)
    E = [list(e0)]
    etas = []
    stats = dict(maxT=F(1), maxS3=F(0), maxW3=F(0))
    one = (1 << P2, 0)
    for i in range(1, N + 1):
        j = i - 1
        r = recs[j]
        Dj = [(babs_ub(Ys[j][a][0]) + babs_ub(Ys[j][a][1])) * R + E[j][a] for a in range(4)]
        etas.append([ceil_int(sum(r['dM'][a][c] * Dj[c] for c in range(4)) + fvec[j][a] + (r['jump'][a] if a < 3 else 0)) if a < 3 else 0
                     for a in range(4)])
        T = [[one if a == b_ else (0, 0) for b_ in range(4)] for a in range(3)]
        acc = [0, 0, 0]
        s3 = 0
        w3 = 0
        for jj in range(i - 1, -1, -1):
            # here T = Tt_(i, jj+1)
            ub = [[lub(T[a][b_]) for b_ in range(4)] for a in range(3)]
            et = etas[jj]
            for a in range(3):
                acc[a] += ub[a][0] * et[0] + ub[a][1] * et[1] + ub[a][2] * et[2]
            nrm = max(max(sum(ub[a]) for a in range(3)), 1 << P2)
            stats['maxT'] = max(stats['maxT'], F(nrm, 1 << P2))
            n3 = max(sum(ub[a][:3]) for a in range(3))
            s3 += n3
            w3 += wint[jj] * n3
            T = lmatmul(T, Mlow[jj])
        ub = [[lub(T[a][b_]) for b_ in range(4)] for a in range(3)]
        stats['maxT'] = max(stats['maxT'], F(max(max(sum(ub[a]) for a in range(3)), 1 << P2), 1 << P2))
        for a in range(3):
            acc[a] += sum(ub[a][b_] * e0i[b_] for b_ in range(4))
        stats['maxS3'] = max(stats['maxS3'], F(s3, 1 << P2))
        stats['maxW3'] = max(stats['maxW3'], F(w3, (1 << P2) * WS))
        E.append([F(acc[a], (1 << P2) * SC) for a in range(3)] + [F(0)])
    return E, stats


# ================================================================ the coordinate matrix Gamma (prof:coordinates)
ALPHA_ = F(15, S0)
BETA_ = BB / (2 * S0 ** 2)
H0_ = 1 + CC / (2 * S0 ** 3)


def D0poly(x):
    return x ** 3 + ALPHA_ * x ** 2 + BETA_ * x + H0_


def gamma_enclosure(bits=200):
    lo, hi = F(-2), F(0)
    assert D0poly(lo) < 0 < D0poly(hi)
    for _ in range(bits + 2):
        mid = (lo + hi) / 2
        if D0poly(mid) < 0:
            lo = mid
        else:
            hi = mid
    l0 = FI(lo, hi)
    pq = l0 + ALPHA_                    # D0(x) = (x - l0)(x^2 + pq x + qq)
    qq = l0 * pq + BETA_
    u = pq * F(-1, 2)
    v2 = qq - pq.sq() * F(1, 4)
    assert v2.lo > 0
    v = v2.sqrt()
    lam0 = CI(l0)
    lam1 = CI(u, v)
    lam2 = CI(u, -v)
    one = CI(FI(1))
    d0p = (lam0 - lam1) * (lam0 - lam2)
    d1p = (lam1 - lam0) * (lam1 - lam2)
    row0 = [lam1 * lam2 / d0p, -(lam1 + lam2) / d0p, one / d0p]
    row1 = [lam0 * lam2 / d1p, -(lam0 + lam2) / d1p, one / d1p]
    G = [[x.re for x in row0], [x.re for x in row1], [x.im for x in row1]]
    # the real row must have zero imaginary part (up to the enclosure), as a sanity statement
    assert all(x.im.mag() < F(1, 10 ** 50) for x in row0)
    return G, l0, u, v, v2


def pa_poly():
    """P_a(d) = (p_a, p_a', p_a'')(56; d) as exact polynomials in d (lists, low to high)"""
    def pm(p, q):
        out = [F(0)] * (len(p) + len(q) - 1)
        for i, x in enumerate(p):
            for j, y in enumerate(q):
                out[i + j] += x * y
        return out

    def pa(*ps):
        n = max(len(p) for p in ps)
        return [sum((p[i] if i < len(p) else 0) for p in ps) for i in range(n)]

    def sc(p, k):
        return [k * x for x in p]
    a = [F(0), CC]
    b = pa(pm(a, a), sc(a, 567))
    d3 = pa(sc(pm(a, b), 2), sc(pm(pm(a, a), a), -1), sc(b, F(2025, 4)))
    d4 = pa(pm(b, b), sc(pm(a, d3), 2), sc(pm(pm(a, a), b), -3), pm(pm(a, a), pm(a, a)), sc(d3, F(567, 2)))
    ds = [a, b, d3, d4]
    jet = [[F(0)] * 9 for _ in range(3)]
    for jj, dj in enumerate(ds, start=1):
        m = 3 * jj
        fac = [F(1, S0 ** m), F(-m, S0 ** (m + 1)), F(m * (m + 1), S0 ** (m + 2))]
        for r in range(3):
            for i, x in enumerate(dj):
                jet[r][i] += fac[r] * x
    return jet, ds


def peval(p, x):
    s = F(0)
    for c in reversed(p):
        s = s * x + c
    return s


def pder(p):
    return [i * p[i] for i in range(1, len(p))]


def shift_poly(p, x0):
    """coefficients of p(x0 + t) in t"""
    out = []
    q = list(p)
    for k in range(len(p)):
        out.append(peval(q, x0) / 1)
        q = [x / (k + 1) for x in pder(q)] if k + 1 < len(p) else []
        if not q:
            break
    return out + [F(0)] * (len(p) - len(out))


# ================================================================ the decision
def series_ball(k, d, n, r):
    """the origin series and its two tangents in balls, evaluated with r = s^(3/2) a given rational, s = r^(2/3):
    returns (p, p', p'') and their k-, d-derivatives as balls (heads only; the caller adds the tails)"""
    kb, db = bf(k), bf(d)
    z = [badd(B1, db), kb]
    zk = [ZERO, B1]
    zd = [B1, ZERO]
    b_, bk, bd = [binv(z[0])], [], []
    bk.append(bneg(bmul(bmul(b_[0], zk[0]), b_[0])))
    bd.append(bneg(bmul(bmul(b_[0], zd[0]), b_[0])))
    for i in range(2, n + 1):
        m = i - 2
        while len(b_) <= m:
            mm = len(b_)
            s1 = ZERO
            for t in range(1, mm + 1):
                s1 = badd(s1, bmul(z[t], b_[mm - t]))
            b_.append(bneg(bmul(b_[0], s1)))
            for (zz, bb) in ((zk, bk), (zd, bd)):
                s2 = ZERO
                for t in range(0, mm + 1):
                    s2 = badd(s2, bmul(zz[t], b_[mm - t]))
                for t in range(1, mm + 1):
                    s2 = badd(s2, bmul(z[t], bb[mm - t]))
                bb.append(bneg(bmul(b_[0], s2)))
        den = Dden(i)
        inv = bf(1 / den)
        z.append(bmul(bsub(b_[m], B1) if i == 2 else b_[m], inv))
        zk.append(bmul(bk[m], inv))
        zd.append(bmul(bd[m], inv))
    rb = bf(r)
    # s = r^(2/3): p(s) = sum z_i r^i - 1; p'(s) = sum z_i (3i/2) r^i / s; p''(s) = sum z_i (3i/2)(3i/2-1) r^i / s^2
    out = []
    for zz in (z, zk, zd):
        acc = [ZERO, ZERO, ZERO]
        rp = B1
        for i, c in enumerate(zz):
            t = bmul(c, rp)
            acc[0] = badd(acc[0], t)
            acc[1] = badd(acc[1], bdivi(bmuli(t, 3 * i), 2))
            acc[2] = badd(acc[2], bdivi(bmuli(t, 3 * i * (3 * i - 2)), 4))
            rp = bmul(rp, rb)
        out.append(acc)
    return out


def decide(src=None, K=20, k0=K0, d0=D0, pmat=PMAT, bound_q=F(25, 100), bound_xi=F(13, 100)):
    src = src or Sources()
    checks = []
    t0 = time.time()
    cert = src.text(CERT)
    prof = src.text(PROF)
    intro = src.text(INTRO)
    fl = lambda s: ''.join(s.split())  # noqa: E731
    fc, fp = fl(cert), fl(prof)
    check(checks, 'the paper prints the proposition, the ODE, the parameters, p_a, D0 and Lambda as used here',
          all(x in fc for x in ('\\(z_*\\in[-R,R]^2\\),where\\(R=5\\cdot10^{-10}\\)', '|q|\\le.25R', '-z_*\\big\\|_\\infty\\le.13R')) and
          all(x in fp for x in ('\\frac{30}{s}p\'\'+\\fracB{s^2}p\'+\\fracC{s^3}(p-d)+\\fracp{1+p}=0', 'B=\\frac{751}{4},\\quadC=-\\frac{1215}{4}',
                                '-.094617116666041\\\\.400682721856639', '25190&-63731\\\\721855&359157', 'a=d_1=Cd,\\qquadb=d_2=a^2+567a',
                                'd_3=2ab-a^3+\\frac{2025}{4}b', 'd_4=b^2+2ad_3-3a^2b+a^4+\\frac{567}{2}d_3',
                                'D_0(\\lambda)=\\lambda^3+\\frac{15}{S_0}\\lambda^2+\\frac{B}{2S_0^2}\\lambda+1+\\frac{C}{2S_0^3}',
                                '30756&-27384&33447\\\\34622&13692&-16724\\\\-2925&-34040&-28850')) and
          all(x in fl(intro) for x in ('\\CP^{10}', 'whosemaximalsmoothCalabiflowhasexistenceinterval')),
          'certificate.tex:11-25, profile.tex:60-65, :93-102, :173-205')
    oq = ode_from_Q()
    check(checks, 'O. prof:ode re-derived from Q(y d/dy)(G-1) = (y^2/2)(1/G - 1/c): with D = (2/3) s d/ds, Q(D)/(8/27) has coefficients (1, 30, 751/4, -1215/4) on (s^3 d^3, s^2 d^2, s d, 1), and the right side becomes -p/(1+p)',
          oq == [CC, BB, F(30), F(1)], str([str(x) for x in oq]))
    # ---------------- O. the origin family
    nser = 60
    z, zk, zd = origin_series(k0, d0, nser)
    L = origin_lemma(nser)
    check(checks, 'O. majorant lemma: on |k-k0|, |d-d0| <= 1/10 (complex), 3|k| + 3/50 < |1+d|, (9/D_2)(beta + 1) <= 3/50 and 9 beta^2/D_2 = %.4f < 1 (D_2 = 891/2): |a_i| <= (3/50) 3^-i' % float(L['contr']),
          L['ok'] and Dden(2) == F(891, 2))
    jet_c = jet_at_1(z)
    jk = [x + (1 if i == 0 else 0) for i, x in enumerate(jet_at_1(zk))]     # jet_at_1 subtracts the constant 1 of z_0
    jd = [x + (1 if i == 0 else 0) for i, x in enumerate(jet_at_1(zd))]
    pm = [[F(x, 10 ** 8) for x in row] for row in pmat]
    Zh = [[jk[m] * pm[0][c] + jd[m] * pm[1][c] for c in range(2)] for m in range(3)] + [[pm[1][0], pm[1][1]]]
    dk = (abs(pm[0][0]) + abs(pm[0][1])) * R_
    dd = (abs(pm[1][0]) + abs(pm[1][1])) * R_
    tt = max(dk, dd) / L['eps']
    E2 = 1 / (1 - tt) ** 2 - 1 - 2 * tt
    U0 = [bf(x) for x in jet_c]
    eps0 = [L['tails'][m] + babs_ub(bsub(U0[m], bf(jet_c[m]))) + F(1, ONE) + L['dtails'][m] * (dk + dd) + L['M'][m] * E2 for m in range(3)]
    check(checks, 'O. 1 + p > 0 on [0,1] for every parameter of the polydisc: 1 + p >= |1+d| - (3|k| + 3/50)/3 >= %.4f' % float(L['pos']), L['pos'] > 0)
    check(checks, 'O. the initial error e_0 (series tails, rounding, tangent tails, second-order remainder M_m (j+1) t^j) is below 10^-19 in each jet entry',
          max(eps0) < F(1, 10 ** 19), ', '.join('%.3e' % float(x) for x in eps0))
    d0b = bf(d0)
    Zb = [[bf(x) for x in row] for row in Zh]
    # ---------------- I. the trajectory
    traj = trajectory(U0, d0b, K)
    recs = traj['recs']
    N = len(recs)
    check(checks, 'I. the schedule: 288 blocks, lengths 1/32 (32), 1/16 (32), 1/8 (32), 1/4 (192), from 1 to 56 (sum 55); h s_c >= 32 at each of the paper\'s 8 step starts per block',
          N == 288 and recs[0]['s'] == 1 and recs[-1]['s'] + recs[-1]['ell'] == 56 and sum(r['ell'] for r in recs) == 55 and
          all((r['s'] + k * r['ell'] / 8) / r['ell'] >= 32 for r in recs for k in range(8)))
    mmin = min(r['m'] for r in recs)
    maxjump = max(max(r['jump']) for r in recs)
    maxdM = max(max(max(row) for row in r['dM']) for r in recs)
    check(checks, 'I. every block enclosed: max Lagrange remainder coefficient %.2e, max jump %.2e, max transfer radius %.2e; min of 1 + p_ref over [1,56] = %.6f' % (
        float(traj['maxrem']), float(maxjump), float(maxdM), float(mmin)), maxjump < F(1, 10 ** 22) and maxdM < F(1, 10 ** 18) and mmin > 0)
    # second way on [1, 81/64]: the origin series (it converges for r < 3) against the integrator
    sb = series_ball(k0, d0, 110, F(729, 512))
    s_ = PROBE
    rr = F(729, 512)
    rad = [L['alpha'] * sum(gm(m, i) * (rr / 3) ** i for i in range(111, 400)) * 2 for m in range(3)]
    rad = [x + L['alpha'] * gm(m, 400) * (rr / 3) ** 400 * 10 for m, x in enumerate(rad)]

    def ser_val(acc, m, extra=1, main=False):
        v = ball_fi(acc[m])
        if main and m == 0:
            v = v - 1
        if m == 1:
            v = v / s_
        if m == 2:
            v = v / (s_ * s_)
        sc_ = [1, 1 / s_, 1 / s_ ** 2][m]
        return FI(v.lo - rad[m] * sc_ * extra, v.hi + rad[m] * sc_ * extra)
    st, Vp = traj['probe']
    # transfer from s = 1 to the probe: the probe block's partial transfer times the enclosed block transfers M_7 ... M_0
    jprobe = [j for j, r in enumerate(recs) if r['s'] <= PROBE < r['s'] + r['ell']][0]
    TT = [row[:] for row in Vp] + [[ZERO, ZERO, ZERO, B1]]
    for jj in range(jprobe - 1, -1, -1):
        TT = mmul(TT, recs[jj]['M'])
    Vp = TT
    ok_probe = True
    gaps = []
    for m in range(3):
        a_ = ser_val(sb[0], m, main=True)
        b2 = ball_fi(st[m])
        slack = F(1, 10 ** 24)
        ok_probe = ok_probe and not (a_.hi + slack < b2.lo or b2.hi + slack < a_.lo)
        gaps.append(float(abs((a_.lo + a_.hi) / 2 - (b2.lo + b2.hi) / 2)))
        # tangents: d jet(s)/dk = M(s,1) d jet(1)/dk
        for (ser, jt, cst) in ((sb[1], jk, 0), (sb[2], jd, 1)):
            a_ = ser_val(ser, m, extra=10)
            pred = FI(0)
            for c in range(3):
                pred = pred + ball_fi(Vp[m][c]) * jt[c]
            if cst:
                pred = pred + ball_fi(Vp[m][3])
            ok_probe = ok_probe and not (a_.hi + slack < pred.lo or pred.hi + slack < a_.lo)
            gaps.append(float(abs((a_.lo + a_.hi) / 2 - (pred.lo + pred.hi) / 2)))
    check(checks, 'I. second way: at s = 81/64 (r = 729/512) the origin series (110 terms, majorant tail) and the integrator agree on (p, p\', p\'\') and on both parameter derivatives (transfer x initial tangent)',
          ok_probe, 'max |difference of centres| %.1e' % max(gaps))
    # linear parts Y_j = Tt_(j,0) Z
    Ys = [Zb]
    for r in recs:
        Ys.append(mmul(r['Mt'], Ys[-1]))
    lam, psi = [], []
    for j, r in enumerate(recs):
        lj, pj = F(0), [F(0)] * 4
        for row0 in r['row0']:
            prod = mmul([row0], Ys[j])[0]
            lj = max(lj, babs_ub(prod[0]) + babs_ub(prod[1]))
            pj = [max(pj[c], babs_ub(row0[c])) for c in range(4)]
        lam.append(lj)
        psi.append(pj)
    # ---------------- E. bootstrap and error recursion
    lmax = max(lam)
    Delta = R_ * F(int(lmax * 100) + 6, 100)
    grs = [gronwall(r['s'], r['ell'], r['m']) for r in recs]
    nj = [Delta ** 2 / (r['m'] ** 2 * (r['m'] - Delta)) for r in recs]
    fvec = [[r['ell'] * nj[j] * grs[j][2] * x for x in (1 / grs[j][0] ** 2, 1 / grs[j][0], F(1), F(0))] for j, r in enumerate(recs)]
    e0 = [eps0[0], eps0[1], eps0[2], F(0)]
    Eb, stats = error_recursion(recs, Ys, e0, fvec, R_)
    newd = [R_ * lam[j] + sum(psi[j][c] * Eb[j][c] for c in range(4)) + recs[j]['ell'] * grs[j][2] / grs[j][0] ** 2 * nj[j] for j in range(N)]
    worst = max(newd)
    check(checks, 'E. bootstrap: assuming |delta p| <= Delta = %.2fR on [1,56], every block gives |delta p| <= %.4fR < Delta (linear part <= %.4fR, max weighted-Gronwall factor %.3f), and 1 + p >= m_j - Delta > 0' % (
        float(Delta / R_), float(worst / R_), float(lmax), float(max(g[2] for g in grs))),
        worst < Delta and all(r['m'] - Delta > 0 for r in recs))
    EN = Eb[N]
    check(checks, 'E. endpoint error |e_N| <= (%s) R (componentwise, all jumps, transfer radii, forcing and e_0 propagated through the 41,616 products)' % ', '.join('%.2e' % float(x / R_) for x in EN[:3]),
          max(EN[:3]) < R_ / 100)
    # ---------------- P. the projection
    G, l0, u, v, v2 = gamma_enclosure()
    jet, ds = pa_poly()
    Pa0 = [peval(jet[r], d0) for r in range(3)]
    Pa1 = [peval(pder(jet[r]), d0) for r in range(3)]
    shifted = [shift_poly(jet[r], d0) for r in range(3)]
    Ra = [sum(abs(c) * dd ** kk for kk, c in enumerate(shifted[r]) if kk >= 2) for r in range(3)]
    U_N = traj['U_N']
    Astar = [F(U_N[r][0], ONE) - Pa0[r] for r in range(3)]
    YN = Ys[N]
    Yp = [[ball_fi(YN[r][c]) - Pa1[r] * Zh[3][c] for c in range(2)] for r in range(3)]
    bounds = []
    for row in range(3):
        g = G[row]
        va = (g[0] * Astar[0] + g[1] * Astar[1] + g[2] * Astar[2]).mag()
        lin = F(0)
        for c in range(2):
            x = g[0] * Yp[0][c] + g[1] * Yp[1][c] + g[2] * Yp[2][c]
            if row >= 1 and c == row - 1:
                x = x - 1
            lin += x.mag() * R_
        err = sum(g[c].mag() * (EN[c] + Ra[c]) for c in range(3))
        bounds.append(va + lin + err)

    def lower_at(row, zz):
        """a proven lower bound of |row coordinate - (0, z1, z2)_row| at the parameter z* = zz"""
        g = G[row]
        x = g[0] * Astar[0] + g[1] * Astar[1] + g[2] * Astar[2]
        for c in range(2):
            x = x + (g[0] * Yp[0][c] + g[1] * Yp[1][c] + g[2] * Yp[2][c] - (1 if row >= 1 and c == row - 1 else 0)) * zz[c]
        mn = F(0) if x.lo <= 0 <= x.hi else min(abs(x.lo), abs(x.hi))
        return mn - sum(g[c].mag() * (EN[c] + Ra[c]) for c in range(3))
    pts = [(F(0), F(0))] + [(a_ * R_, b_ * R_) for a_ in (-1, 1) for b_ in (-1, 1)]
    lows = [max(lower_at(row, zz) for zz in pts) for row in range(3)]
    check(checks, 'P. |q| <= %.5fR <= %sR for every z* in the square (central miss %.5fR, linear %.5fR)' % (
        float(bounds[0] / R_), bound_q, float((G[0][0] * Astar[0] + G[0][1] * Astar[1] + G[0][2] * Astar[2]).mag() / R_), float(sum((G[0][0] * Yp[0][c] + G[0][1] * Yp[1][c] + G[0][2] * Yp[2][c]).mag() for c in range(2)))),
        bounds[0] <= bound_q * R_)
    check(checks, 'P. ||(Re xi, Im xi) - z*||_inf <= %.5fR <= %sR for every z* in the square' % (float(max(bounds[1:]) / R_), bound_xi),
          max(bounds[1:]) <= bound_xi * R_)
    # ---------------- N. the paper's printed numbers
    pr = []
    pr.append(('origin: .585 + (9/440)(1 + 1/(1.30-.8)) = 711/1100 < .8; 3(|k0| + .1) < .585; |1+d| > 1.30; |d| < .501; 3(|k0|+.1) + 27/440 < .8; 27/440 < .062; 36/440 < 1',
               dec('.585') + F(9, 440) * (1 + 1 / (dec('1.30') - dec('.8'))) == F(711, 1100) < dec('.8') and 3 * (abs(K0) + dec('.1')) < dec('.585') and
               1 + D0 - dec('.1') > dec('1.30') and D0 + dec('.1') < dec('.501') and 3 * (abs(K0) + dec('.1')) + F(27, 440) < dec('.8') and
               F(27, 440) < dec('.062') and F(36, 440) < 1 and Dden(2) > 440))
    sup1 = max(gm(1, i) / F(3) ** i for i in range(1, 50))
    sup2 = max(gm(2, i) / F(3) ** i for i in range(1, 50))
    pr.append(('origin jets: sup (3i/2)/3^i = 1/2, sup (3i/2)(3i/2-1)/3^i = 2/3 (ratios decrease after); .501 + .8/3 < .768, .8/2 <= .4, .8(2/3) < .534',
               sup1 == F(1, 2) and sup2 == F(2, 3) and dec('.501') + dec('.8') / 3 < dec('.768') and dec('.8') / 2 <= dec('.4') and dec('.8') * F(2, 3) < dec('.534')))
    E60 = dec('.8') * F(3 * 61, 2) ** 2 / F(3) ** 61
    tstar = dec('.11') * R_
    Epar = 2 * (1 / (1 - tstar) ** 2 - 1 - 2 * tstar)
    initerr = dec('5e-21') + E60 + Epar + dec('.12') * E60 * R_ + dec('1e-20') * R_ + F(3, 2 ** 256)
    pr.append(('origin tails: E60 = .8 (3*61/2)^2/3^61 < 5.267e-26; 10 * .01169933 <= .12; |dk| <= 4.44605e-13, |dd| <= 5.40506e-12 < .011R; E_par < 1.816e-20; cert:initial-error < 2.316e-20 < 2e-19',
               E60 < dec('5.267e-26') and all(F((i + 1) ** 2, i * i * 3) < 1 for i in range(61, 80)) and
               sum(abs(x) for row in PMAT for x in row) == 1169933 and 10 * dec('.01169933') <= dec('.12') and
               dk == dec('4.44605e-13') and dd == dec('5.40506e-12') and dd < dec('.011') * R_ and Epar < dec('1.816e-20') and initerr < dec('2.316e-20') < dec('2e-19')))
    e477 = exp_ub(dec('.954') / 2)
    a_ = dec('.01') + F(1, 2) * (dec('.190') * dec('.06') + dec('.011') * dec('1.3') + dec('.015625') * dec('.86') / dec('.14'))
    b_ = F(1, 2) * dec('.190') / 2
    H2b = e477 * a_ / (1 - e477 * b_)
    pr.append(('disks: 30/31.5 < .954, B/31.5^2 < .190, |C|/31.5^3 < .011, ell^3 <= .015625; H_2 <= e^.477(...) solves to < .123602 < .13; .06/2 + .13/8 = .04625 < .1',
               F(30) / dec('31.5') < dec('.954') and BB / dec('31.5') ** 2 < dec('.190') and abs(CC) / dec('31.5') ** 3 < dec('.011') and F(1, 4) ** 3 <= dec('.015625') and
               e477 * b_ < 1 and H2b < dec('.123602') < dec('.13') and dec('.06') / 2 + dec('.13') / 8 == dec('.04625') < dec('.1')))
    jn = F(30) / dec('31.5') + (BB) / dec('31.5') ** 2 + F(1215, 2) / dec('31.5') ** 3 + F(1, 64) / dec('.14') ** 2
    pr.append(('disks: Jacobian norm 30/31.5 + (751/4)/31.5^2 + (1215/2)/31.5^3 + (1/64)/.14^2 < 2.1; 6 e^1.05 < 17.146 < 32; 32 sum_{i>=45} 4^-i = (128/3) 4^-45 < 48 4^-45; .06/8 + .13/128 = .008515625 < .01; (floor(Q/100)+1)/Q > .01',
               jn < dec('2.1') and 6 * exp_ub(dec('1.05')) < dec('17.146') < 32 and F(128, 3) * F(1, 4 ** 45) < 48 * F(1, 4 ** 45) and
               32 * F(1, 4 ** 45) / (1 - F(1, 4)) == F(128, 3) / 4 ** 45 and dec('.06') / 8 + dec('.13') / 128 == dec('.008515625') < dec('.01') and
               F((2 ** 256) // 100 + 1, 2 ** 256) > dec('.01')))
    Lr = max(F(1), F(30, 32) + BB / 32 ** 2 + F(1215, 2) / 32 ** 3 + F(1, 64) / dec('.23') ** 2)
    pr.append(('transfers: 8500[(1 + 4e-15*8500)^288 - 1] < .001; 570000 + 288(.001) < 580000; 246000 + 55(.001)/.23^3 < 250000; 2.7 + .001(.02) < 2.72; e^L_real < 4.3',
               8500 * ((1 + dec('4e-15') * 8500) ** 288 - 1) < dec('.001') and 570000 + 288 * dec('.001') < 580000 and
               246000 + 55 * dec('.001') / dec('.23') ** 3 < 250000 and dec('2.7') + dec('.001') * dec('.02') < dec('2.72') and exp_ub(Lr) < dec('4.3')))
    eN = 580000 * dec('1e-19') + 8501 * dec('2e-19') + dec('4.3') * 250000 * dec('1.001') * (14 * R_) ** 2
    bs = dec('4.3') * (dec('2.72') + dec('.11')) * R_ + dec('4.3') * dec('1.001') * (14 * R_) ** 2 / dec('.23') ** 3
    pr.append(('nonlinear: .23/(.23 - 14R) < 1.001; the endpoint error sum = .1055747504R exactly < .11R; the bootstrap 4.3(2.72+.11)R + 4.3(1.001)(14R)^2/.23^3 < 12.169035R < 14R',
               dec('.23') / (dec('.23') - 14 * R_) < dec('1.001') and eN == dec('.1055747504') * R_ and eN < dec('.11') * R_ and bs < dec('12.169035') * R_))
    q1 = dec('.006') + dec('.003') * dec('.04') + dec('.116') + dec('.003') * dec('2.7') + dec('.92') * (dec('.11') + dec('.001') * dec('.02') + dec('.01') * dec('.011'))
    q2 = dec('.006') + dec('.003') * dec('.04') + dec('.001') + dec('.003') * dec('2.7') + dec('.68') * (dec('.11') + dec('.001') * dec('.02') + dec('.01') * dec('.011'))
    pr.append(('projection: .2315396 and .0901084 exactly, < .25 and < .13', q1 == dec('.2315396') < dec('.25') and q2 == dec('.0901084') < dec('.13')))
    # Lemma prof:root-bounds
    um, up = F(114617, 280000), F(573113, 1400000)
    tab = [[('.3074', '.3078'), ('-.2740', '-.2737'), ('.3344', '.3346')], [('.3461', '.3464'), ('.1368', '.1370'), ('-.1673', '-.1672')],
           [('-.0294', '-.0291'), ('-.3406', '-.3402'), ('-.2887', '-.2883')]]
    Lam = [[F(x, 10 ** 5) for x in row] for row in LAMBDA]
    rows_ok = all(dec(tab[a][b_][0]) < G[a][b_].lo and G[a][b_].hi < dec(tab[a][b_][1]) for a in range(3) for b_ in range(3))
    gl = max((G[a][b_] - Lam[a][b_]).mag() for a in range(3) for b_ in range(3))
    rs = [sum(G[a][b_].mag() for b_ in range(3)) for a in range(3)]
    Eb_ = (dec('1.08655') + um) ** 2 + dec('.8671') ** 2
    pr.append(('roots: alpha^2 - 3beta = -453/25088; D0(-1.08659), D0(-1.08655) as printed; -1.08659 < lambda0 < -1.08655, u_- < Re lambda1 < u_+, .40933 < u_-, u_+ < .40938, .8671 < Im lambda1 < .86721; the three printed rational comparisons; |lambda1|^2 = H0/r0 < .959^2',
               ALPHA_ ** 2 - 3 * BETA_ == F(-453, 25088) and D0poly(dec('-1.08659')) == F(-17566501197647, 343000000000000000) and
               D0poly(dec('-1.08655')) == F(187622583137, 2744000000000000) and dec('-1.08659') < l0.lo and l0.hi < dec('-1.08655') and
               um < u.lo and u.hi < up and dec('.40933') < um and up < dec('.40938') and dec('.8671') < v.lo and v.hi < dec('.86721') and
               dec('.8671') ** 2 < H0_ / dec('1.08659') - up ** 2 and H0_ / dec('1.08655') - um ** 2 < dec('.86721') ** 2 and H0_ / dec('1.08655') < dec('.959') ** 2))
    pr.append(('Gamma: every entry inside the printed table, |Gamma - Lambda| < .001 entrywise (max %.6f), row sums %.5f, %.5f, %.5f < .9164, .6507, .6587 (< .92, .68, .68); E > 46876434629/15680000000 > 2.9895 > 1.729^2; 1/(2(.40933)(.8671)(1.729)) = 500000000000/613674044347 < .82' % ((float(gl),) + tuple(float(x) for x in rs)),
               rows_ok and gl < dec('.001') and rs[0] < dec('.9164') and rs[1] < dec('.6507') and rs[2] < dec('.6587') and
               Eb_ == F(46876434629, 15680000000) and Eb_ > dec('2.9895') > dec('1.729') ** 2 and
               1 / (2 * dec('.40933') * dec('.8671') * dec('1.729')) == F(500000000000, 613674044347) < dec('.82')))
    # P_a: the coefficient table and (cert:pa-variation)
    dint = (dec('.40068272185'), dec('.40068272187'))
    dsh = [shift_poly(dj, dint[0]) for dj in ds]
    width = dint[1] - dint[0]

    def ub_on(p):
        return sum(abs(c) * width ** kk for kk, c in enumerate(shift_poly(p, dint[0])))
    tab1 = [122, 54200, 12500000, 5100000000]
    tab2 = [304, 100000, 65000000, 100000000000]
    dvar = max(ub_on(pder(jet[r])) for r in range(3))
    pr.append(('p_a: the parameter interval lies in [.40068272185, .40068272187]; |d_j| and |d_j\'| below the printed table; max |dP_a/dd| <= %.6f < .001735 < .01, so ||P_a(d) - P_a(d0)|| <= .01|d - d0|' % float(dvar),
               dint[0] <= D0 - dd and D0 + dd <= dint[1] and all(ub_on(ds[j]) < tab1[j] and ub_on(pder(ds[j])) < tab2[j] for j in range(4)) and dvar < dec('.001735') < dec('.01')))
    # cert:finite-products and cert:finite-matching on this decider's trajectory
    Znorm = max(sum(babs_ub(Zb[r][c]) for c in range(2)) for r in range(4))
    TZ = max(max(sum(babs_ub(Y[r][c]) for c in range(2)) for r in range(4)) for Y in Ys)
    Ytop = [[ball_fi(YN[r][c]) for c in range(2)] for r in range(3)]
    LA = [sum((Lam[a][c] * Astar[c] for c in range(3)), F(0)) for a in range(3)]
    LY = [[sum((Ytop[c][b_] * Lam[a][c] for c in range(3)), FI(0)) for b_ in range(2)] for a in range(3)]
    row1 = sum(LY[0][b_].mag() for b_ in range(2))
    botI = max(sum((LY[a][b_] - (1 if a - 1 == b_ else 0)).mag() for b_ in range(2)) for a in (1, 2))
    pr.append(('cert:finite-products on this decider\'s reference (same schedule): m_j > .23 (min %.4f), ||Z|| < .02 (%.5f), max ||Tt_(i,j)|| <= 8500 (%.1f), max_i sum ||Tt^(3)_(i,j+1)|| <= 570000 (%.0f), max_i sum ell_j/m_j^3 ||Tt^(3)|| <= 246000 (%.0f), max_i ||Tt_(i,0) Z|| <= 2.7 (%.4f)' % (
        float(mmin), float(Znorm), float(stats['maxT']), float(stats['maxS3']), float(stats['maxW3']), float(TZ)),
        mmin > dec('.23') and Znorm < dec('.02') and stats['maxT'] <= 8500 and stats['maxS3'] <= 570000 and stats['maxW3'] <= 246000 and TZ <= dec('2.7')))
    pr.append(('cert:finite-matching on this decider\'s reference: ||U_N - P_a(d0)|| < .04R (%.5fR), ||Lambda A*|| < .006R (%.5fR), ||(Lambda Y)_1|| < .116 (%.5f), ||(Lambda Y)_bottom - I_2|| < .001 (%.6f)' % (
        float(max(abs(x) for x in Astar) / R_), float(max(abs(x) for x in LA) / R_), float(row1), float(botI)),
        max(abs(x) for x in Astar) < dec('.04') * R_ and max(abs(x) for x in LA) < dec('.006') * R_ and row1 < dec('.116') and botI < dec('.001')))
    rg = traj['rng']
    pr.append(('cert:step-start on this decider\'s a-priori boxes (they contain every step start): -.76 < p < .4 (%.4f, %.4f), |ell p\'| < .06 (%.4f), |ell^2 p\'\'| < .01 (%.5f)' % tuple(float(x) for x in rg),
               rg[0] > dec('-.76') and rg[1] < dec('.4') and rg[2] < dec('.06') and rg[3] < dec('.01')))
    for name, ok in pr:
        check(checks, 'N. ' + name, ok)
    core = [c_ for c_ in checks if c_['check'][:2] in ('O.', 'I.', 'E.', 'P.')]
    ok_core = all(c_['pass'] for c_ in core)
    ok_all = all(c_['pass'] for c_ in checks)
    p_fail = any(not c_['pass'] for c_ in checks if c_['check'].startswith('P.'))
    rest_ok = all(c_['pass'] for c_ in core if not c_['check'].startswith('P.'))
    refuted = rest_ok and (lows[0] > bound_q * R_ or max(lows[1:]) > bound_xi * R_)
    if p_fail:
        check(checks, 'P. the failure re-derived a second way, as a proven LOWER bound at a corner or the centre of the square: |q| >= %.5fR, ||(Re xi, Im xi) - z*|| >= %.5fR' % (
            float(lows[0] / R_), float(max(lows[1:]) / R_)), refuted)
    verdict = 'CERTIFIED' if ok_all else ('REFUTED' if refuted else 'REFUSED')
    return {'verdict': verdict, 'checks': checks, 'sources': src.read,
            'decides': 'the whole of Proposition cert:shoot (existence on [0,56], 1 + p > 0, |q| <= .25R, ||(Re xi, Im xi) - z*|| <= .13R '
                       'for every z* in the square), by an independent validated integration; not the tail lemma, the matching or the theorem',
            'value': {'q_over_R': '%.6f' % float(bounds[0] / R_), 'xi_over_R': '%.6f' % float(max(bounds[1:]) / R_),
                      'Delta_over_R': '%.2f' % float(Delta / R_), 'min_1_plus_p': '%.6f' % float(mmin),
                      'max_T': '%.1f' % float(stats['maxT']), 'order': K, 'steps': 4 * N, 'runtime_s': round(time.time() - t0, 1)}}


def forge():
    """each must NOT certify"""
    out = []
    out.append(('printed bound .13R for the nonreal coordinates replaced by .001R (this decider proves >= .002R at z* = 0)', decide(bound_xi=dec('.001'))['verdict']))
    pmx = ((-63731, 25190), (359157, 721855))
    out.append(('parameter matrix with its two columns swapped (the trajectory is reused)', decide(pmat=pmx)['verdict']))
    out.append(('central d0 = .400682721856639 changed to .400682721857639 (+1e-12; a new trajectory)', decide(d0=D0 + dec('1e-12'))['verdict']))
    return out


if __name__ == '__main__':
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1, default=str))
    for c_ in res['checks']:
        print(('PASS ' if c_['pass'] else 'FAIL ') + c_['check'], c_['detail'])
    print('sources', json.dumps(res['sources'], indent=1))
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t))
