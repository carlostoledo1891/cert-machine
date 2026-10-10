"""F-189 — "The Gaussian propeller bound in every dimension" (openai/math family 096).

THE CLAIM (build/main.tex:81-92, Theorem thm:main): for all positive integers d, k, every measurable partition
(A_1..A_k) of R^d satisfies sum_i || int_{A_i} x dgamma_d(x) ||^2 <= 9/(8 pi), sharp for d >= 2, k >= 3 (three
planar 2pi/3 sectors times the orthogonal complement).

THE PROOF'S SHAPE (main.tex:186-234, extremizers.tex:136-145): a minimal extremizer with C > 9/(8pi) has m active
cells spanning dimension m - 1; m <= 4 is excluded by Heilman-Jagannath-Naor's computer-assisted theorem in R^3
(an EXTERNAL input, not in this paper); m >= 5 is excluded by scalar probability bounds (scalars.tex), two
determinant constraints (geometry.tex) and a finite elimination (elimination.tex), whose numerical comparisons are
certified by rational enclosures (certificates.tex, Appendix cert:arithmetic).

DECIDED HERE, exactly (Fraction endpoints only; no float in any decision), written from the paper's LaTeX only (the
release publishes no checking code for this paper). Transcendentals are enclosed rigorously, by standard facts
stated where used: pi by Machin's formula with alternating arctangent partial sums (for 0 < x < 1 the partial sum
ending on a negative term is a lower bound, on a positive term an upper bound); e^{-y}, y >= 0, between E_{N+1}(y)
and E_N(y) for even N (Taylor's remainder has sign (-1)^{N+1}); Phi(x) = 1/2 + (1/sqrt(2pi)) int_0^x e^{-u^2/2} du
between the integrated partial sums J_{N+1}, J_N (x >= 0), Phi(-x) = 1 - Phi(x); arcsin x, 0 <= x < 1, between
Q_n(x) and Q_n(x) + x^{2n+3}/((2n+3)(1-x^2)) (binomial series with coefficients in (0,1]); square roots between
isqrt(floor(x D^2))/D and (isqrt(floor(x D^2)) + 1)/D. Interval operations on Fraction endpoints, rounded outward.
Every comparison is decided with a TIGHT recipe (pi to ~60 digits, N = 60, n = 40, D = 10^50); separately, every
enclosure claim is re-run with the PAPER'S OWN recipe (3.14159 < pi < 3.14160, E_14/E_15, J_14/J_15, Q_4 + tail,
D = 10^35; certificates.tex:9-63), and the claims that recipe does not reproduce are listed (value), not counted
as failures: the inequalities are true or false independently of the recipe used to see them.

  A. certificates.tex:10-15: Machin partial sums through indices 7 and 6 give 3.14159 < pi < 3.14160.
  B. The halfspace minimum (scalars.tex:39-57, certificates.tex:65-88): the strict enclosures of D_f(0.6119),
     D_f(0.6121), D_f on [0.6119, 0.6121] by endpoint enclosures (phi and Phi(-x) both decrease there), |D_f| < 0.001,
     f(0.612) > 0.884383832, 0.884383832(1 - 10^-7) > 0.8843837 > 0.884.
  C. The cap minimum (scalars.tex:59-100, certificates.tex:90-112): the enclosures of F(0.29), F(0.294), R(0.29) >
     0.9312526, p(0.294) - 0.294/pi > 0.22198 > 0, |F| < 0.004702, (9/4) 0.004702/(1-0.294^2)^4 < 0.015189 < 0.03,
     0.9312526 - 0.03(0.004) = 0.9311326 > 0.929; and the three derivative formulas R' = (9/4)F/(1-x^2)^4, F' = 6H,
     H' = (4x^2-3)/(pi sqrt(1-x^2)) by an exact differential-algebra computation (x, y = sqrt(1-x^2), y^{-1},
     s = arcsin x, w = 1/pi as formal symbols with D x = 1, D y = -x y^{-1}, D y^{-1} = x y^{-3}, D s = y^{-1},
     D w = 0; an expression reducing to 0 under y y^{-1} = 1, y^2 = 1 - x^2 is identically 0).
  D. The quantile table cert:quantiles (certificates.tex:128-147, 9 rows): 10^6 (P_0(a) - Phi(q_a)) > listed and
     G(q_a) < listed; each listed G bound < the U of the same a in sc:interval-table; and sc:interval-table
     (scalars.tex:248-269, 10 rows): 10^6 Delta(a,b,U) > listed, the rows tile (0, 2/3], P_0(2/3) = 103/300 < 1/2.
  E. The elimination (elimination.tex): d, s and the .734/.116 normalisation for both A; L <= 8/9 and the 101/34500
     excess; the .00321132 bound; Table elim:small-table (positivity of .415/b - .734, M(b) > listed, a^2 - q0^2 > 0,
     the last column; the four intervals tile [.23, .44]); the identity e(u) = du/(s+u)(s^2-u^2); e(.066) exactly;
     Table elim:four-table (e(1/sqrt5) > listed, e(.066) < e(1/sqrt5), the four-charge excess > listed, positive
     increment in m); eq:elim:cap-budget exactly; the t0 enclosures (decided by squaring, no root), t0 < .109,
     t0 < .12, .066 < t0; Table elim:final-table (column 1 exactly, columns 2-3 strict lower bounds); the final
     1.5(2.6-.12)^2 - 10(3/pi)^2 > .10667806.
  F. The finite algebra in geometry.tex: 8 - (1+x)^2((2-x)^2+1) = (1-x)^2(3-x^2); the expansion of
     sum_{j<k}(1+a_j)^2(1+a_k)^2 in s1, s2, s3; 3 + 4 + 2 + 2/3 + 1/9 = 88/9 < 10; the constant
     (27/6)(1/(2pi))(2/sqrt(2pi)) / B = 3/pi; and the attaining value 3 sin^2(pi/3)/(2pi) = 9/(8pi).

WHAT IS NOT DECIDED HERE: (1) the case m <= 4 — it is Heilman-Jagannath-Naor's computer-assisted theorem for R^3
(HJN Theorem 1.1), imported as an established input; its finite verification is not in this paper and is NOT
decided here. (2) Everything proved in prose: the reduction to conical extremizers and the effective dimension
(extremizers.tex), Ehrhard's/Borell's inequality, the rearrangement and translation arguments, Lemma
sc:truncated-variance (G nonincreasing, 0 < G < 1, monotonicity of P^2 G), the uniqueness/location arguments for
the two minima (M' < 1, the sign pattern of H), the geometry lemma geo:pair and its density bound, concavity of e
and F, and the kernel-clustering application with its Unique Games input. (3) The enclosure facts listed above are
standard theorems used, not re-proved. So this is a finite component, not the headline.

OBSERVATIONS (after the run). The release publishes no checking program for this paper; its only machine artefact
is the Lean development lean/OAI/Probability/GaussianPropeller (challenge OAI.GaussianPropeller.all_partitions,
permitted axioms propext/Quot.sound/Classical.choice). That development appears to contain its own four-cell
argument (FourCells.lean:65, lemma four_incompatibility, with numeric certificate files Cap/Large/Quartic/Small
Certificates.lean) instead of citing HJN as the paper does — read, not decided here (lane K's). Every printed
bound in the tables is reproduced by the paper's own coarse recipe as well as by the tight one; several are loose
against the true values because the recipe's pi enclosure (width 1e-5) dominates, e.g. G(-2.033) < 0.887728 is
printed while G(-2.033) = 0.8876583... — a valid but conservative bound, not a discrepancy.
"""
import os
import re
import sys
import math
from fractions import Fraction as Fr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, const, mul, pw, scale, sub, total, var  # noqa: E402

DIR = 'preprints/The-Gaussian-Propeller-Bound-in-Every-Dimension-September-24-2026/build/'
MAIN = DIR + 'main.tex'
SCAL = DIR + 'sections/scalars.tex'
GEOM = DIR + 'sections/geometry.tex'
ELIM = DIR + 'sections/elimination.tex'
CERT = DIR + 'sections/certificates.tex'


def F(s):
    return Fr(s)


# ---------------------------------------------------------------- intervals with Fraction endpoints

GRID = 10 ** 70


class I:
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi=None):
        lo = Fr(lo)
        hi = lo if hi is None else Fr(hi)
        assert lo <= hi
        # outward rounding to the grid keeps the Fractions small and the enclosure valid
        if lo.denominator > GRID:
            lo = Fr(math.floor(lo * GRID), GRID)
        if hi.denominator > GRID:
            hi = Fr(-math.floor(-hi * GRID), GRID)
        self.lo, self.hi = lo, hi

    @staticmethod
    def c(x):
        return x if isinstance(x, I) else I(x)

    def __add__(self, o):
        o = I.c(o)
        return I(self.lo + o.lo, self.hi + o.hi)
    __radd__ = __add__

    def __neg__(self):
        return I(-self.hi, -self.lo)

    def __sub__(self, o):
        return self + (-I.c(o))

    def __rsub__(self, o):
        return I.c(o) - self

    def __mul__(self, o):
        o = I.c(o)
        p = (self.lo * o.lo, self.lo * o.hi, self.hi * o.lo, self.hi * o.hi)
        return I(min(p), max(p))
    __rmul__ = __mul__

    def inv(self):
        assert self.lo > 0 or self.hi < 0, 'division by an interval containing 0'
        return I(1 / self.hi, 1 / self.lo)

    def __truediv__(self, o):
        return self * I.c(o).inv()

    def __rtruediv__(self, o):
        return I.c(o) * self.inv()

    def __repr__(self):
        return '[%.12g, %.12g]' % (float(self.lo), float(self.hi))


# ---------------------------------------------------------------- enclosure recipes

def atan_sum(x, n):
    return sum(Fr((-1) ** j) * x ** (2 * j + 1) / (2 * j + 1) for j in range(n + 1))


def machin(n_odd, n_even):
    """pi enclosure: 16 atan(1/5) - 4 atan(1/239), each atan between S_odd (lower) and S_even (upper)"""
    a5, b5 = atan_sum(Fr(1, 5), n_odd), atan_sum(Fr(1, 5), n_even)
    a239, b239 = atan_sum(Fr(1, 239), n_odd), atan_sum(Fr(1, 239), n_even)
    return I(16 * a5 - 4 * b239, 16 * b5 - 4 * a239)


class Recipe:
    def __init__(self, name, pi, N, D, n_asin):
        assert N % 2 == 0
        self.name, self.pi, self.N, self.D, self.n_asin = name, pi, N, D, n_asin
        self.sqrt2pi = self.sqrt(2 * pi)
        self.isq = self.sqrt2pi.inv()

    def sqrt(self, x):
        x = I.c(x)
        assert x.lo >= 0
        D = self.D
        lo = Fr(math.isqrt(math.floor(x.lo * D * D)), D)
        hi = Fr(math.isqrt(math.floor(x.hi * D * D)) + 1, D)
        return I(lo, hi)

    def expneg(self, y):
        """e^{-y} for an exact y >= 0: E_{N+1}(y) <= e^{-y} <= E_N(y)"""
        y = Fr(y)
        assert y >= 0
        terms, t = [], Fr(1)
        for j in range(self.N + 2):
            terms.append(t)
            t = t * (-y) / (j + 1)
        return I(sum(terms), sum(terms[:-1]))

    def J(self, x, n):
        return sum(Fr((-1) ** j) * x ** (2 * j + 1) / (2 ** j * math.factorial(j) * (2 * j + 1)) for j in range(n + 1))

    def Phi(self, x):
        x = Fr(x)
        if x < 0:
            return 1 - self.Phi(-x)
        return Fr(1, 2) + I(self.J(x, self.N + 1), self.J(x, self.N)) * self.isq

    def phi(self, x):
        return self.expneg(Fr(x) ** 2 / 2) * self.isq

    def asin(self, x):
        x = Fr(x)
        assert 0 <= x < 1
        n = self.n_asin
        Q = sum(Fr(math.comb(2 * j, j), 4 ** j * (2 * j + 1)) * x ** (2 * j + 1) for j in range(n + 1))
        return I(Q, Q + x ** (2 * n + 3) / ((2 * n + 3) * (1 - x * x)))


def tight():
    return Recipe('tight', machin(41, 40), 60, 10 ** 50, 40)


def paper():
    return Recipe('paper', I(F('3.14159'), F('3.14160')), 14, 10 ** 35, 4)


# ---------------------------------------------------------------- the functions of the paper

def f_half(R, x):          # f(x) = (9/4) e^{x^2} Phi(-x)
    x = Fr(x)
    return Fr(9, 4) * R.expneg(x * x).inv() * R.Phi(-x)


def Df(R, x):              # D_f(x) = 2x - phi(x)/Phi(-x)
    x = Fr(x)
    return 2 * x - R.phi(x) / R.Phi(-x)


def Df_interval(R, a, b):
    """D_f on [a,b] (0 < a < b): phi and Phi(-x) both decrease, so phi in [phi(b), phi(a)], Phi(-x) in
    [Phi(-b), Phi(-a)]; 2x in [2a, 2b]"""
    pa, pb = R.phi(a), R.phi(b)
    Pa, Pb = R.Phi(-Fr(a)), R.Phi(-Fr(b))
    return I(2 * Fr(a), 2 * Fr(b)) - I(pb.lo, pa.hi) / I(Pb.lo, Pa.hi)


def p_cap(R, x):           # p(x) = 1/2 - (arcsin x + x sqrt(1-x^2))/pi
    x = Fr(x)
    return Fr(1, 2) - (R.asin(x) + x * R.sqrt(1 - x * x)) / R.pi


def F_cap(R, x):           # F(x) = 6x p(x) - (2/pi)(1-x^2)^{3/2}
    x = Fr(x)
    return 6 * x * p_cap(R, x) - 2 * (1 - x * x) * R.sqrt(1 - x * x) / R.pi


def R_cap(R, x):           # R(x) = (9/4) p(x)/(1-x^2)^3
    x = Fr(x)
    return Fr(9, 4) * p_cap(R, x) / (1 - x * x) ** 3


def G(R, q):               # G(q) = phi(q)(q Phi(q) + phi(q)) / Phi(q)^2
    q = Fr(q)
    ph, Ph = R.phi(q), R.Phi(q)
    return ph * (q * Ph + ph) / (Ph * Ph)


def P0(a):
    return (F('0.415') + F('0.15') * Fr(a)) * Fr(a)


def Delta(R, a, b, U):     # B^2/(1+sqrt(1-a^2)) - U(0.415+0.15b)^2, B^2 = 9/(8 pi)
    a, b, U = Fr(a), Fr(b), Fr(U)
    return Fr(9, 8) / R.pi / (1 + R.sqrt(1 - a * a)) - U * (F('0.415') + F('0.15') * b) ** 2


# ---------------------------------------------------------------- the differential-algebra check (C)

NV = 5   # x, y = sqrt(1-x^2), yi = 1/y, s = arcsin x, w = 1/pi


def _v(i):
    return var(i, NV)


def deriv(p):
    """the derivation D on Q[x, y, yi, s, w]: Dx = 1, Dy = -x yi, D yi = x yi^3, Ds = yi, Dw = 0"""
    x, y, yi = _v(0), _v(1), _v(2)
    images = [const(1, NV), scale(mul(x, yi), -1), mul(x, pw(yi, 3, NV)), yi, {}]
    out = {}
    for m, c in p.items():
        for i, e in enumerate(m):
            if e and images[i]:
                mm = list(m)
                mm[i] -= 1
                out = add(out, mul({tuple(mm): c * e}, images[i]))
    return out


def reduce_y(p):
    """reduce modulo y*yi = 1 and y^2 = 1 - x^2: multiply by y^K to clear yi, then fold y^2; returns the pair
    (a, b) with y^K p = a + b y, a, b in Q[x, s, w] — p = 0 iff a = b = 0 suffices for the identity"""
    K = max((m[2] for m in p), default=0)
    out = {}
    one_minus_x2 = sub(const(1, NV), pw(_v(0), 2, NV))
    for m, c in p.items():
        e_y = m[1] + K - m[2]            # y^{m1} yi^{m2} y^K = y^{m1 + K - m2}
        base = {(m[0], 0, 0, m[3], m[4]): c}
        term = mul(base, pw(one_minus_x2, e_y // 2, NV))
        if e_y % 2:
            term = mul(term, _v(1))
        out = add(out, term)
    return out


def derivative_identities():
    x, y, yi, s, w = (_v(i) for i in range(NV))
    one = const(1, NV)
    om = sub(one, pw(x, 2, NV))                                   # 1 - x^2
    p = sub(scale(one, Fr(1, 2)), mul(w, add(s, mul(x, y))))       # p = 1/2 - (s + x y) w
    Fx = sub(scale(mul(x, p), 6), scale(mul(w, mul(om, y)), 2))    # F = 6xp - 2w (1-x^2) y
    Hx = sub(p, mul(w, mul(x, y)))                                 # H = p - w x y
    Rx = scale(mul(p, pw(mul(yi, yi), 3, NV)), Fr(9, 4))           # R = (9/4) p yi^6, yi^6 = (1-x^2)^-3
    ok1 = reduce_y(sub(deriv(Rx), scale(mul(Fx, pw(yi, 8, NV)), Fr(9, 4)))) == {}     # R' = (9/4) F (1-x^2)^-4
    ok2 = reduce_y(sub(deriv(Fx), scale(Hx, 6))) == {}                                 # F' = 6H
    ok3 = reduce_y(sub(deriv(Hx), mul(mul(w, sub(scale(pw(x, 2, NV), 4), scale(one, 3))), yi))) == {}   # H' = (4x^2-3) w / y
    return ok1, ok2, ok3


# ---------------------------------------------------------------- parsing the published tables

def flat(t):
    return re.sub(r'\s+', '', t)


def parse(cert, scal, elim):
    T = {}
    T['quant'] = [tuple(m) for m in re.findall(r'^(0\.\d+)&(-\d\.\d+)&(\d+)&(0\.\d+)\\\\\s*$', cert, re.M)]
    T['interval'] = [tuple(m) for m in re.findall(r'^(0(?:\.\d+)?)&(0\.\d+|\\\(2/3\\\))&(\d(?:\.\d+)?)&(\d+)\\\\\s*$', scal, re.M)]
    T['small'] = [tuple(m) for m in re.findall(r'^\$\[(\.\d+),(\.\d+)\]\$ & \$(\.\d+)\$ & \$(\.\d+)\$', elim, re.M)]
    T['four'] = [tuple(m) for m in re.findall(r'^\$(\.\d+)\$ & \$(\d)\$ & \$(\.\d+)\$ & \$(\.\d+)\$', elim, re.M)]
    T['final'] = [tuple(m) for m in re.findall(r'^\$(\.\d+)\$ & \$(\.\d+)\$ & \$(\.\d+)\$ & \$(\.\d+)\$', elim, re.M)]
    return T


# inline printed values, each with the exact LaTeX it is read from (whitespace removed)
INLINE = {
    'pi': (('3.14159', '3.14160'), CERT, '3.14159<\\pi<3.14160'),
    'Df1': (('-0.000131', '-0.000126'), CERT, '-0.000131&<&D_f(0.6119)<-0.000126'),
    'Df2': (('0.000120', '0.000124'), CERT, '0.000120&<&D_f(0.6121)<0.000124'),
    'DfI': (('-0.000430', '0.000424'), CERT, '-0.000430&<&D_f(x)<0.000424'),
    'f612': (('0.884383832',), CERT, '0.884383832&<&f(0.612)'),
    'fmin': (('0.8843837',), CERT, '>0.884383832(1-10^{-7})>0.8843837'),
    'F29': (('-0.0047010', '-0.0046981'), CERT, '-0.0047010&<&F(0.29)<-0.0046981'),
    'F294': (('0.0007683', '0.0007712'), CERT, '0.0007683&<&F(0.294)<0.0007712'),
    'R29': (('0.9312526',), CERT, '0.9312526&<&R(0.29)'),
    'H294': (('0.22198',), CERT, '0.22198&<&p(0.294)-0.294/\\pi'),
    'Fabs': (('0.004702',), CERT, '|F(x)|<0.004702'),
    'Rprime': (('0.015189', '0.03'), CERT, '<0.015189<0.03'),
    'Rmin': (('0.9311326',), CERT, '0.9312526-0.03(0.004)=0.9311326'),
    'excess': (('101/34500',), ELIM, '=\\frac{101}{34500}>0'),
    'big3': (('.00321132',), ELIM, '-8(3/\\pi)^2q_0^2>.00321132'),
    'e066': (('.023996676', '.024192696'), ELIM, '$e(.066)=.023996676$for$A=.929$and$e(.066)=.024192696$'),
    'cap': (('.0027688', '.0184672'), ELIM, '\\begin{cases}.0027688,&A=.929,\\\\.0184672,&A=.884.'),
    't0a': (('.1070554', '.1070555'), ELIM, '.1070554<t_0<.1070555'),
    't0b': (('.1176565', '.1176566'), ELIM, '.1176565<t_0<.1176566'),
    'last': (('.10667806',), ELIM, '1.5(2.6-.12)^2-10(3/\\pi)^2>.10667806>0'),
}


# ---------------------------------------------------------------- decide

def enclosure_claims(R, P, T):
    """every enclosure claim of the appendix and the tables as (name, bool) under recipe R; P = printed values"""
    out = []
    lo, hi = P['pi']
    if R.name == 'tight':
        out.append(('A. pi in (%s, %s)' % (lo, hi), F(lo) < R.pi.lo and R.pi.hi < F(hi)))
    v = Df(R, F('0.6119'))
    out.append(('B. %s < D_f(0.6119) < %s' % P['Df1'], F(P['Df1'][0]) < v.lo and v.hi < F(P['Df1'][1])))
    v = Df(R, F('0.6121'))
    out.append(('B. %s < D_f(0.6121) < %s' % P['Df2'], F(P['Df2'][0]) < v.lo and v.hi < F(P['Df2'][1])))
    v = Df_interval(R, F('0.6119'), F('0.6121'))
    out.append(('B. %s < D_f(x) < %s on [0.6119, 0.6121] (endpoint enclosures)' % P['DfI'], F(P['DfI'][0]) < v.lo and v.hi < F(P['DfI'][1])))
    v = f_half(R, F('0.612'))
    out.append(('B. f(0.612) > %s' % P['f612'][0], v.lo > F(P['f612'][0])))
    v = F_cap(R, F('0.29'))
    out.append(('C. %s < F(0.29) < %s' % P['F29'], F(P['F29'][0]) < v.lo and v.hi < F(P['F29'][1])))
    v = F_cap(R, F('0.294'))
    out.append(('C. %s < F(0.294) < %s' % P['F294'], F(P['F294'][0]) < v.lo and v.hi < F(P['F294'][1])))
    v = R_cap(R, F('0.29'))
    out.append(('C. R(0.29) > %s' % P['R29'][0], v.lo > F(P['R29'][0])))
    v = p_cap(R, F('0.294')) - F('0.294') / R.pi
    out.append(('C. p(0.294) - 0.294/pi > %s' % P['H294'][0], v.lo > F(P['H294'][0])))
    for a, q, mgap, gq in T['quant']:
        Ph = R.Phi(F(q))
        out.append(('D. a=%s q_a=%s: 10^6(P_0(a) - Phi(q_a)) > %s' % (a, q, mgap), 10 ** 6 * (P0(F(a)) - Ph.hi) > int(mgap)))
        g = G(R, F(q))
        out.append(('D. a=%s q_a=%s: G(q_a) < %s' % (a, q, gq), g.hi < F(gq)))
    for a, b, U, dl in T['interval']:
        bb = Fr(2, 3) if '2/3' in b else F(b)
        dv = Delta(R, F(a), bb, F(U))
        out.append(('D. interval [%s, %s], U = %s: 10^6 Delta > %s' % (a, b.replace('\\(', '').replace('\\)', ''), U, dl), 10 ** 6 * dv.lo > int(dl)))
    pi_lo = R.pi.lo
    q0 = F('.066')
    big = (F('.44') ** 2 - q0 ** 2) * (F('.44') ** 2 - 2 * q0 ** 2) - 8 * 9 * q0 ** 2 / pi_lo ** 2
    out.append(('E. (.44^2 - q0^2)(.44^2 - 2q0^2) - 8(3/pi)^2 q0^2 > %s' % P['big3'][0], big > F(P['big3'][0])))
    for a, b, ml, last in T['small']:
        a_, b_ = F(a), F(b)
        M = 1 - F('.116') / (F('.415') / b_ - F('.734')) - b_ ** 2 - 2 * q0 ** 2
        val = (a_ ** 2 - q0 ** 2) * M - 72 * q0 ** 2 / pi_lo ** 2
        out.append(('E. [%s, %s]: (a^2 - q0^2) M(b) - 8(3/pi)^2 q0^2 > %s' % (a, b, last), val > F(last)))
    for A, m, el, ex in T['four']:
        d = F(A) - F('.15')
        e_lo = F('.415') / R.sqrt(5).hi - d / 5             # e(1/sqrt5) = .415/sqrt5 - d/5, lower bound
        out.append(('E. A=%s: e(1/sqrt5) > %s' % (A, el), e_lo > F(el)))
    for A, ex, Fl, sl in T['final']:
        d = F(A) - F('.15')
        k = 2 if A == '.929' else 3
        sq = R.sqrt(F('2.6') * F('.066'))
        Fv = F('.415') * sq.lo - F('2.6') * d * F('.066') + k * (F('.415') * F('.066') - d * F('.066') ** 2) - (1 - F(A))
        out.append(('E. A=%s: F(.066) - (1-A) > %s' % (A, Fl), Fv > F(Fl)))
    last = F('1.5') * (F('2.6') - F('.12')) ** 2 - 90 / pi_lo ** 2
    out.append(('E. 1.5(2.6-.12)^2 - 10(3/pi)^2 > %s' % P['last'][0], last > F(P['last'][0])))
    return out


def decide(src=None, patch=None, table_patch=None):
    src = src or Sources()
    checks = []
    texs = {k: src.text(k) for k in (MAIN, SCAL, GEOM, ELIM, CERT)}
    flats = {k: flat(v) for k, v in texs.items()}
    check(checks, 'the theorem as printed (main.tex:81-92): sum ||z(A_i)||^2 <= 9/(8 pi)', '\\le\\frac9{8\\pi}.' in flats[MAIN])
    P = {k: v[0] for k, v in INLINE.items()}
    miss = [k for k, (vals, f, s) in INLINE.items() if s not in flats[f]]
    check(checks, 'every inline printed bound read from the LaTeX (%d strings)' % len(INLINE), not miss, str(miss))
    if patch:
        P.update(patch)
    T = parse(texs[CERT], texs[SCAL], texs[ELIM])
    if table_patch:
        for tab, i, row in table_patch:
            T[tab][i] = row
    check(checks, 'tables parsed: cert:quantiles 9 rows, sc:interval-table 10, elim:small-table 4, elim:four-table 2, elim:final-table 2',
          [len(T[k]) for k in ('quant', 'interval', 'small', 'four', 'final')] == [9, 10, 4, 2, 2],
          str([len(T[k]) for k in ('quant', 'interval', 'small', 'four', 'final')]))

    Rt = tight()
    # A. the paper's pi recipe
    pm = machin(7, 6)
    check(checks, 'A. Machin through indices 7 and 6: %s < pi < %s' % P['pi'], F(P['pi'][0]) < pm.lo and pm.hi < F(P['pi'][1]),
          'width %.3g' % float(pm.hi - pm.lo))
    check(checks, 'A. the tight pi enclosure lies inside the paper\'s', Rt.pi.lo > F('3.14159') and Rt.pi.hi < F('3.14160'))

    # every enclosure claim, tight recipe (decides)
    claims = enclosure_claims(Rt, P, T)
    for name, ok in claims:
        check(checks, name, ok)

    # B, C: the exact consequences
    check(checks, 'B. |D_f| < 0.001 on [0.6119, 0.6121] (from the printed interval)', max(-F(P['DfI'][0]), F(P['DfI'][1])) < F('0.001'))
    check(checks, 'B. %s (1 - 10^-7) > %s > 0.884' % (P['f612'][0], P['fmin'][0]),
          F(P['f612'][0]) * (1 - Fr(1, 10 ** 7)) > F(P['fmin'][0]) > F('0.884'))
    Fmax = max(-F(P['F29'][0]), F(P['F294'][1]))
    check(checks, 'C. |F| < %s on [0.29, 0.294] (F increasing there; endpoint enclosures)' % P['Fabs'][0], Fmax < F(P['Fabs'][0]) and F(P['H294'][0]) > 0)
    rp = Fr(9, 4) * F(P['Fabs'][0]) / (1 - F('0.294') ** 2) ** 4
    check(checks, 'C. (9/4) %s / (1 - 0.294^2)^4 < %s < %s' % (P['Fabs'][0], P['Rprime'][0], P['Rprime'][1]),
          rp < F(P['Rprime'][0]) < F(P['Rprime'][1]), '%.9f' % float(rp))
    check(checks, 'C. %s - 0.03(0.004) = %s > 0.929' % (P['R29'][0], P['Rmin'][0]),
          F(P['R29'][0]) - F(P['Rprime'][1]) * F('0.004') == F(P['Rmin'][0]) and F(P['Rmin'][0]) > F('0.929'))
    d1, d2, d3 = derivative_identities()
    check(checks, "C. R' = (9/4) F/(1-x^2)^4, F' = 6H, H' = (4x^2-3)/(pi sqrt(1-x^2)) (exact differential algebra)", d1 and d2 and d3, str((d1, d2, d3)))

    # D: the table structure
    qa = {a: gq for a, q, mg, gq in T['quant']}
    rows = T['interval']
    ok_link = all((a == '0' and U == '1') or (a in qa and F(qa[a]) < F(U)) for a, b, U, dl in rows)
    check(checks, 'D. each G(q_a) bound is strictly below the U of its interval row (row a = 0 uses G < 1, U = 1)', ok_link)
    ends = [(F(a), Fr(2, 3) if '2/3' in b else F(b)) for a, b, U, dl in rows]
    check(checks, 'D. the interval rows tile [0, 2/3] in order', ends[0][0] == 0 and ends[-1][1] == Fr(2, 3) and all(ends[i][1] == ends[i + 1][0] for i in range(len(ends) - 1)))
    check(checks, 'D. P_0(2/3) = 103/300 < 1/2', P0(Fr(2, 3)) == Fr(103, 300) < Fr(1, 2))

    # E: the elimination, exact rational parts
    q0 = F('.066')
    val = {}
    for A in ('.929', '.884'):
        d = F(A) - F('.15')
        s = F('.415') / d
        k = 2 if A == '.929' else 3
        one_A = 1 - F(A)
        e = (lambda u, d=d: F('.415') * u - d * u * u)
        norm = (d - F('.045') == F('.734') and one_A + F('.045') == F('.116')) if A == '.929' else (d == F('.734') and one_A == F('.116'))
        check(checks, 'E. A=%s: d = %s, s = .415/d, and the common charge normalises to (.415/sqrt c - .734) <= .116' % (A, d), norm)
        # e(u) = d u/(s+u) (s^2 - u^2), checked as a polynomial identity after multiplying by (s+u): 3 points suffice
        check(checks, 'E. A=%s: e(u)(s+u) = d u (s^2 - u^2) (degree 3, checked at 5 points)' % A,
              all(e(u) * (s + u) == d * u * (s * s - u * u) for u in (F('.42'), F('.5'), F('.7'), Fr(1, 3), Fr(2))))
        val[A] = {'d': d, 's': s, 'k': k, 'e': e, 'one_A': one_A}
    check(checks, 'E. L <= 2 (2/3)^2 = 8/9, and (1/9)(.415/.23 - .734) - .116 = %s > 0' % P['excess'][0],
          2 * Fr(2, 3) ** 2 == Fr(8, 9) and Fr(1, 9) * (F('.415') / F('.23') - F('.734')) - F('.116') == Fr(P['excess'][0]) > 0)
    check(checks, 'E. both factors positive: .44^2 - q0^2 > 0 and .44^2 - 2 q0^2 > 0', F('.44') ** 2 - q0 ** 2 > 0 and F('.44') ** 2 - 2 * q0 ** 2 > 0)
    sm = T['small']
    ok_small = True
    det = []
    for a, b, ml, last in sm:
        a_, b_ = F(a), F(b)
        den = F('.415') / b_ - F('.734')
        M = 1 - F('.116') / den - b_ ** 2 - 2 * q0 ** 2
        okr = den > 0 and M > F(ml) > 0 and a_ ** 2 - q0 ** 2 > 0
        ok_small &= okr
        det.append('M(%s)=%.8f' % (b, float(M)))
    check(checks, 'E. elim:small-table: .415/b - .734 > 0, M(b) > listed > 0 (M(b) exact), a^2 - q0^2 > 0', ok_small, ', '.join(det))
    ends = [(F(a), F(b)) for a, b, ml, last in sm]
    check(checks, 'E. elim:small-table intervals tile [.23, .44]', ends[0][0] == F('.23') and ends[-1][1] == F('.44') and all(ends[i][1] == ends[i + 1][0] for i in range(len(ends) - 1)))
    e066 = (val['.929']['e'](q0), val['.884']['e'](q0))
    check(checks, 'E. e(.066) = %s (A=.929) and %s (A=.884), exactly' % P['e066'], e066 == (F(P['e066'][0]), F(P['e066'][1])), str(e066))
    for A, m, el, ex in T['four']:
        V = val[A]
        d, s, e = V['d'], V['s'], V['e']
        K = d * F('.42') / (s + F('.42'))
        mm = int(m)
        rhs = K * (4 * s * s - 1 + (mm - 4) * q0 ** 2) + (mm - 4) * e(q0) - V['one_A']
        check(checks, 'E. A=%s, m=%s: K(4s^2 - 1 + (m-4)(.066)^2) + (m-4)e(.066) - (1-A) > %s (exact: %.10f)' % (A, m, ex, float(rhs)),
              rhs > F(ex) and K * q0 ** 2 + e(q0) > 0 and mm == (5 if A == '.929' else 6))
        check(checks, 'E. A=%s: e(.066) < listed e(1/sqrt5) bound (so the min is e(.066))' % A, e(q0) < F(el))
    for A, cv in zip(('.929', '.884'), P['cap']):
        V = val[A]
        ce = V['k'] * V['e'](F('.42')) - V['one_A']
        check(checks, 'E. A=%s: k e(.42) - (1-A) = %s exactly, > 0' % (A, cv), ce == F(cv) and ce > 0, str(ce))

    def t0_cmp(V, x):
        """sign of t0 - x, decided exactly: t0 = (.415 - sqrt(disc))/(2d), disc = .415^2 - 4d(1-A)/k > 0"""
        d, k, oa = V['d'], V['k'], V['one_A']
        disc = F('.415') ** 2 - 4 * d * oa / k
        assert disc > 0
        lhs = F('.415') - 2 * d * x         # t0 > x  <=>  lhs > sqrt(disc)
        if lhs <= 0:
            return -1
        return 1 if lhs * lhs > disc else (-1 if lhs * lhs < disc else 0)
    for A, key in (('.929', 't0a'), ('.884', 't0b')):
        V = val[A]
        lo, hi = P[key]
        check(checks, 'E. A=%s: %s < t0 < %s (by squaring, no root)' % (A, lo, hi), t0_cmp(V, F(lo)) == 1 and t0_cmp(V, F(hi)) == -1)
        check(checks, 'E. A=%s: .066 < t0 < %s' % (A, '.109' if A == '.929' else '.12'),
              t0_cmp(V, q0) == 1 and t0_cmp(V, F('.109') if A == '.929' else F('.12')) == -1 and t0_cmp(V, F('.12')) == -1)
    for A, ex, Fl, sl in T['final']:
        V = val[A]
        e, k = V['e'], V['k']
        exv = e(F('.23')) + k * e(q0) - V['one_A']
        check(checks, 'E. A=%s: e(.23) + k e(.066) - (1-A) = %s exactly' % (A, ex), exv == F(ex), str(exv))
        # s^2 - 2.6 t0 > sl  <=>  t0 < (s^2 - sl)/2.6
        check(checks, 'E. A=%s: s^2 - 2.6 t0 > %s (by squaring)' % (A, sl), t0_cmp(V, (V['s'] ** 2 - F(sl)) / F('2.6')) == -1)
    check(checks, 'E. the minima feed the lemma: 0.8843837 > .884 = A (m >= 6), 0.9311326 > .929 = A (m = 5)',
          F(P['fmin'][0]) > F('.884') and F(P['Rmin'][0]) > F('.929'))

    # F: the finite algebra of geometry.tex
    n1 = 1
    x = var(0, n1)
    one = const(1, n1)
    lhs = sub(scale(one, 8), mul(pw(add(one, x), 2, n1), add(pw(sub(scale(one, 2), x), 2, n1), one)))
    rhs = mul(pw(sub(one, x), 2, n1), sub(scale(one, 3), pw(x, 2, n1)))
    check(checks, 'F. 8 - (1+x)^2((2-x)^2+1) = (1-x)^2(3-x^2) (geometry.tex:187)', sub(lhs, rhs) == {} and 'geo:first-constraint' in texs[GEOM])
    a = [var(i, 3) for i in range(3)]
    o3 = const(1, 3)
    S = {}
    for j in range(3):
        for kk in range(j + 1, 3):
            S = add(S, mul(pw(add(o3, a[j]), 2, 3), pw(add(o3, a[kk]), 2, 3)))
    s1 = total(*a)
    s2 = total(mul(a[0], a[1]), mul(a[0], a[2]), mul(a[1], a[2]))
    s3 = mul(mul(a[0], a[1]), a[2])
    E = total(scale(o3, 3), scale(s1, 4), scale(pw(s1, 2, 3), 2), scale(mul(s1, s2), 2), pw(s2, 2, 3),
              scale(mul(add(scale(o3, 6), scale(s1, 2)), s3), -1))
    check(checks, 'F. sum_{j<k}(1+a_j)^2(1+a_k)^2 = 3+4s1+2s1^2+2s1s2+s2^2-(6+2s1)s3 (geometry.tex:219-220)', sub(S, E) == {})
    check(checks, 'F. 3+4+2+2/3+1/9 = 88/9 < 10', 3 + 4 + 2 + Fr(2, 3) + Fr(1, 9) == Fr(88, 9) < 10)
    # Bt < (27M/6) E[T_+^3] with M = t^2 c/(2 pi D), E[T_+^3] = 2/sqrt(2pi), B = 3/(2 sqrt(2pi)): D < (coef/pi) t c
    coef = Fr(27, 6) * Fr(1, 2) * 2 / Fr(3, 2)       # the sqrt(2pi) factors cancel; pi stays in the denominator
    check(checks, 'F. the pair-bound constant: (27/6)(1/(2pi))(2/sqrt(2pi)) / (3/(2 sqrt(2pi))) = 3/pi', coef == 3)
    check(checks, 'F. the attaining propeller: 3 sin^2(pi/3)/(2pi) = 9/(8pi) (sin^2(pi/3) = 3/4)', 3 * Fr(3, 4) / 2 == Fr(9, 8))

    # the paper's own recipe, for the record
    Rp = paper()
    paper_miss = [name for name, ok in enclosure_claims(Rp, P, T) if not ok]

    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: every finite numerical comparison and enclosure of the m >= 5 exclusion '
                       '(Appendix cert:arithmetic, Tables sc:interval-table, cert:quantiles, elim:small-table, '
                       'elim:four-table, elim:final-table and the inline bounds), plus the finite algebra of '
                       'geometry.tex; NOT the case m <= 4 (Heilman-Jagannath-Naor, external, computer-assisted) and '
                       'not the prose analysis',
            'value': {'pi_machin_7_6': [str(pm.lo), str(pm.hi)], 'paper_recipe_does_not_reproduce': paper_miss,
                      'n_enclosure_claims': len(claims)}}


def forge():
    """each must NOT certify"""
    out = []
    r = decide(patch={'t0a': ('.1070555', '.1070556')})
    out.append(('t0 enclosure for A=.929 moved up one unit: .1070555 < t0 < .1070556', r['verdict']))
    r = decide(table_patch=[('small', 2, ('.35', '.41', '.40622', '.01621418'))])
    out.append(('elim:small-table row [.35,.41]: M(b) bound .40621 -> .40622', r['verdict']))
    r = decide(table_patch=[('quant', 4, ('0.41', '-0.850', '470', '0.783737'))])
    out.append(('cert:quantiles row a=0.41: q_a moved -0.860 -> -0.850', r['verdict']))
    r = decide(table_patch=[('interval', 5, ('0.41', '0.48', '0.783', '392'))])
    out.append(('sc:interval-table row [0.41,0.48]: U lowered .788 -> .783 (below the G(q_a) bound)', r['verdict']))
    r = decide(patch={'cap': ('.0027689', '.0184672')})
    out.append(('cap budget for A=.929 printed .0027689 instead of .0027688', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    import time
    t0 = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1))
    for c_ in res['checks']:
        print(('PASS ' if c_['pass'] else 'FAIL ') + c_['check'], c_['detail'])
    print('sources:', json.dumps(res['sources'], indent=1))
    print('%.1fs' % (time.time() - t0))
    t1 = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t1))
