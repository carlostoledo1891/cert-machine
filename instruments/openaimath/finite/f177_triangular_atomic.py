"""F-177 — "An atomic certificate for triangular-lattice universal optimality" (openai/math family 090).

THE CLAIM (build/main.tex). Theorem thm:universal (l.68-77): the density-one triangular lattice A minimises the lower
energy E_g among locally finite planar sets of centred disk density one, for every nonnegative completely monotone g.
Theorem thm:gaussian (l.95-110): for every alpha > 0 a sharp Gaussian minorant f_alpha exists; "for alpha >= 1, the
construction uses two finite 20-by-20 interpolation blocks and an absolutely summable infinite correction."
The finite input is Lemma lem:finite-certificate (l.1295-1385), "the finite computational input, not the conclusion of
the construction" (l.1396), proved in Appendix app:finite-certificate (l.2158-2310) by outward-rounded interval
arithmetic on "the constants, matrices, and polynomials defined above".

WHAT IS DECIDED HERE — every item of Lemma lem:finite-certificate, rebuilt from the paper's definitions (l.651-1293),
with an interval kernel written for this audit: real intervals with endpoints k / 2^320 (rationals), every operation
rounded outward (floor for the lower end, ceiling for the upper end), complex numbers as rectangles; pi from Machin's
formula with the alternating-series bracket; e^x by Taylor on x / 2^s with a bounded tail and s squarings; cos/sin
by Taylor at the midpoint after reduction by 2 pi, widened by the radius (|cos'| <= 1). No float enters a decision.
  0. The sine product, EXACTLY: P(s) = prod_{a in I} (2 sin kappa(s - a))^2 = sum_j P_j e^{i pi j s / 18} is expanded
     in Z[w], w = e^{i pi / 18} (w^12 = w^6 - 1); P(n) = P'(n) = 0 for n in I, P_{-j} = conj P_j, and the
     zero-frequency masses of the folded atomic columns are real (l.821-826) — all exact identities in the field.
     The folded atomic masses (eq. analytic:atomic-c/-d, l.791-801) are checked exactly against their defining
     columns kappa^2 P csc^2 kappa(s-n) and kappa P cot kappa(s-n) at five integer points s off the node set.
  1. Q_n, D_n (Appendix recipe) for the 15 residues, cross-checked against the closed forms
     Q_n = 4 kappa^2 prod_{d != n} (2 sin kappa(n-d))^2 and D_n = 2 kappa sum_{d != n} cot kappa(n-d); item 2 bounds;
     the fifteen gap-midpoint values of P(s)/(s-m)^2, computed from the sine product itself.
  2. R_0, R (eq. finite-jet-map, rows c_n, d_n interleaved per node of f, k = v = H on M, k = h on V); interval
     Gauss-Jordan in diagonal order on (I -+ R | I): every pivot interval, the inverse-norm bounds; A_1, A_2 from
     eq. finite-system; the appendix's bound for sup_E ||A_i e||. ORDERING: the pivot claim depends on the order of
     the twenty unknowns, which the paper gives only as "ordered as c_n, d_n on L" (l.1161) and "row pair" (l.1155).
     Interleaved (c_1, d_1, c_3, d_3, ...) gives |pivots| in [0.12346, 1.72711] and passes; the blocked order
     (all c, then all d) would give a pivot 0.10291 < 0.12 on I - R. The norms do not depend on the order.
  3. The parameter polytope: 1/(pi(1/b - h)) < Z, e^{-2/Z}, e^{-3/Z}, e^{-6/Z} below W*, U*, P*, and the maximum of
     Delta = (Z - z) e^{-2/z} (at z = sqrt(1+2Z) - 1) below 0.00015 < Delta*.
  4. Item 3 (jet envelopes Psi, ||W||, the repetition bound, the omitted-target sums) and item 4 (curvature envelopes
     at s = 0, 1, 2, 14.5, 23; the degree-20 Taylor remainder envelope at every listed (m, y)).
  5. Item 5: all 27 degree-20 sign tests (21 Bernstein rows each) and the 4 exceptional degree-22 tests (23 rows
     each) — 659 row minima, each the EXACT minimum of the row over the polytope E (eq. polytope-row-minimum; its
     exactness is checked here as a statement about a product of boxes and one triangle), enclosed by intervals.
  6. The printed rational consequences in Sections 5-6: the e'_eps, e_eps table (l.1660-1664) and the individual
     error bounds, the deleted-jet budgets (l.1901-1907), r(Z, .5) = 836500/974643 > .8, B_2(1) = 3.481286, and the
     two-range K / barrier / margin table (l.2111-2117); the four endpoint differences 100079/455650, ... (l.964-967).

WHAT IS NOT DECIDED HERE (analysis, not the finite object): that the folded atomic and tail measures represent the
columns for all s and all summable lists (Section 3 — only the atomic identities are tested, at five points); the
Schwartz convergence and the Fourier transform of the Gaussian waves; the operator bounds of Section 4 as statements
about infinite matrices (the finite envelope sums that feed them ARE decided), the Schur elimination and Neumann
series, hence the existence of the exact interpolants; the Taylor-remainder, curvature and Gaussian-comparison
arguments of Section 5 and the sine-product log-concavity; the density-only linear-programming bound
(Cohn-Elkies / Cohn-Kumar / Cohn-de Courcy-Ireland framework), Poisson summation, the reciprocal-parameter duality,
the Bernstein-Widder mixture and the passage to completely monotone g. So the verdict is about the finite certificate
(a component), not about the universal-optimality theorem.
"""
import math
import os
import sys
import time
from fractions import Fraction as Fr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/An-atomic-certificate-for-triangular-lattice-universal-optimality-September-26-2026/'
PAPER = DIR + 'build/main.tex'
DATA = DIR + 'verification/CERTIFICATE.json'

# ---------------------------------------------------------------- outward-rounded real and complex intervals
PREC = 320
SC = 1 << PREC
SC2 = SC * SC


class R:
    """the real interval [lo, hi] / 2^PREC (rational endpoints), every operation rounded outward"""
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi):
        if lo > hi:
            raise ArithmeticError('inverted interval')
        self.lo, self.hi = lo, hi

    def __add__(self, o):
        o = cv(o)
        return R(self.lo + o.lo, self.hi + o.hi)
    __radd__ = __add__

    def __neg__(self):
        return R(-self.hi, -self.lo)

    def __sub__(self, o):
        o = cv(o)
        return R(self.lo - o.hi, self.hi - o.lo)

    def __rsub__(self, o):
        return cv(o) - self

    def __mul__(self, o):
        if isinstance(o, int):
            return R(self.lo * o, self.hi * o) if o >= 0 else R(self.hi * o, self.lo * o)
        o = cv(o)
        p = (self.lo * o.lo, self.lo * o.hi, self.hi * o.lo, self.hi * o.hi)
        return R(min(p) >> PREC, -((-max(p)) >> PREC))
    __rmul__ = __mul__

    def recip(self):
        if self.lo <= 0 <= self.hi:
            raise ZeroDivisionError('interval contains 0')
        return R(SC2 // self.hi, -((-SC2) // self.lo))

    def __truediv__(self, o):
        if isinstance(o, int) and o > 0:
            return R(self.lo // o, -((-self.hi) // o))
        return self * cv(o).recip()

    def __rtruediv__(self, o):
        return cv(o) * self.recip()

    def mid(self):
        return (self.lo + self.hi) >> 1

    def mag(self):
        return max(abs(self.lo), abs(self.hi))

    def f(self):
        """a float for printed summaries only"""
        return (self.lo + self.hi) / 2 / SC

    def __repr__(self):
        return '[%.12g, %.12g]' % (self.lo / SC, self.hi / SC)


def q(x):
    x = Fr(x)
    n = x.numerator << PREC
    d = x.denominator
    return R(n // d, -((-n) // d))


def cv(x):
    return x if isinstance(x, R) else q(x)


def absr(x):
    if x.lo >= 0:
        return x
    if x.hi <= 0:
        return -x
    return R(0, max(-x.lo, x.hi))


def sqr(x):
    a = absr(x)
    return a * a


def rmin(*xs):
    xs = [cv(x) for x in xs]
    return R(min(x.lo for x in xs), min(x.hi for x in xs))


def rmax(*xs):
    xs = [cv(x) for x in xs]
    return R(max(x.lo for x in xs), max(x.hi for x in xs))


def sqrt(x):
    if x.lo < 0:
        raise ArithmeticError('sqrt of a possibly negative interval')
    lo = math.isqrt(x.lo * SC)
    t = x.hi * SC
    hi = math.isqrt(t)
    if hi * hi < t:
        hi += 1
    return R(lo, hi)


def rpow(x, n):
    out = q(1)
    for _ in range(n):
        out = out * x
    return out


def lt(a, b):
    """a < b for every point of both enclosures"""
    return cv(a).hi < cv(b).lo


def _machin_pi():
    def atan_bracket(x, terms):
        s_lo = s_hi = None
        s = Fr(0)
        for k in range(terms):
            s += Fr((-1) ** k, (2 * k + 1)) * x ** (2 * k + 1)
            if k % 2 == 0:
                s_hi = s          # partial sums ending on a + term lie above the limit
            else:
                s_lo = s
        return s_lo, s_hi
    a_lo, a_hi = atan_bracket(Fr(1, 5), 160)
    b_lo, b_hi = atan_bracket(Fr(1, 239), 60)
    return 16 * a_lo - 4 * b_hi, 16 * a_hi - 4 * b_lo


PI_LO, PI_HI = _machin_pi()
PI = R(q(PI_LO).lo, q(PI_HI).hi)


def _exp_pt(x):
    """enclosure of e^x for a narrow interval x: Taylor on x / 2^s, |x / 2^s| <= 1/16, then s squarings"""
    s = 0
    while max(abs(x.lo), abs(x.hi)) > (SC >> 4) << s:
        s += 1
    r = R(x.lo >> s, -((-x.hi) >> s))
    term = q(1)
    tot = q(1)
    k = 0
    while True:
        k += 1
        term = (term * r) / k
        tot = tot + term
        if term.mag() < 4:
            break
    t = term.mag() + 2       # the tail after degree k is at most |term_k| / 8 here
    tot = R(tot.lo - t, tot.hi + t)
    for _ in range(s):
        tot = tot * tot
    return tot


def exp(x):
    x = cv(x)
    return R(_exp_pt(R(x.lo, x.lo)).lo, _exp_pt(R(x.hi, x.hi)).hi)


def cos_sin(x):
    """enclosures of cos x and sin x for an interval x (reduced by 2 pi, evaluated at the midpoint, widened)"""
    x = cv(x)
    m = x.mid()
    rad = max(x.hi - m, m - x.lo)
    twopi = PI * 2
    tm = twopi.mid()
    k = (2 * m + tm) // (2 * tm)            # the nearest multiple of 2 pi, in integers
    y = R(m, m) - twopi * k
    ym = y.mid()
    rad += max(y.hi - ym, ym - y.lo)
    r = R(ym, ym)
    c = q(1)
    s = q(0)
    term = q(1)
    k = 0
    while True:
        k += 1
        term = (term * r) / k
        if k % 4 == 1:
            s = s + term
        elif k % 4 == 2:
            c = c - term
        elif k % 4 == 3:
            s = s - term
        else:
            c = c + term
        if k > 12 and term.mag() < 4:
            break
    t = 2 * term.mag() + 2 + rad
    return R(c.lo - t, c.hi + t), R(s.lo - t, s.hi + t)


class Z:
    """complex rectangle re + i im"""
    __slots__ = ('re', 'im')

    def __init__(self, re, im=0):
        self.re, self.im = cv(re), cv(im)

    def __add__(self, o):
        o = cz(o)
        return Z(self.re + o.re, self.im + o.im)
    __radd__ = __add__

    def __sub__(self, o):
        o = cz(o)
        return Z(self.re - o.re, self.im - o.im)

    def __neg__(self):
        return Z(-self.re, -self.im)

    def __mul__(self, o):
        if not isinstance(o, Z):
            o = cv(o)
            return Z(self.re * o, self.im * o)
        return Z(self.re * o.re - self.im * o.im, self.re * o.im + self.im * o.re)
    __rmul__ = __mul__

    def __truediv__(self, o):
        if not isinstance(o, Z):
            if isinstance(o, int) and o > 0:
                return Z(self.re / o, self.im / o)
            o = cv(o).recip()
            return Z(self.re * o, self.im * o)
        d = (sqr(o.re) + sqr(o.im)).recip()
        return self * Z(o.re * d, -o.im * d)

    def conj(self):
        return Z(self.re, -self.im)

    def absz(self):
        return sqrt(sqr(self.re) + sqr(self.im))


def cz(x):
    return x if isinstance(x, Z) else Z(cv(x), 0)


IU = Z(0, 1)


def cexp(w):
    w = cz(w)
    e = exp(w.re)
    c, s = cos_sin(w.im)
    return Z(e * c, e * s)


# ---------------------------------------------------------------- the cyclotomic field Q(w), w = e^{i pi/18}
DEG = 12


def _red(p):
    p = list(p) + [0] * max(0, DEG - len(p))
    for k in range(len(p) - 1, DEG - 1, -1):
        c = p[k]
        if c:
            p[k - 6] += c          # w^12 = w^6 - 1
            p[k - 12] -= c
            p[k] = 0
    return tuple(p[:DEG])


def fmul(a, b):
    p = [0] * (2 * DEG - 1)
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                if y:
                    p[i + j] += x * y
    return _red(p)


def fadd(a, b):
    return tuple(x + y for x, y in zip(a, b))


def fsc(a, c):
    return tuple(x * c for x in a)


F0 = tuple([0] * DEG)
F1 = _red([1])
WP = [_red([0] * k + [1]) for k in range(36)]       # w^k


def wpow(k):
    return WP[k % 36]


def fconj(a):
    out = F0
    for i, x in enumerate(a):
        if x:
            out = fadd(out, fsc(wpow(-i), x))
    return out


def fre(a):
    return fsc(fadd(a, fconj(a)), Fr(1, 2))


IF = wpow(9)                                        # i = w^9


def P_coefficients(I):
    """P_j, j = -15..15, exactly in Z[w]: prod_{a in I} (2 - w^{-a} X - w^{a} X^{-1})"""
    poly = {0: F1}
    for a in I:
        fac = {0: fsc(F1, 2), 1: fsc(wpow(-a), -1), -1: fsc(wpow(a), -1)}
        new = {}
        for d1, c1 in poly.items():
            for d2, c2 in fac.items():
                new[d1 + d2] = fadd(new.get(d1 + d2, F0), fmul(c1, c2))
        poly = new
    return {j: poly.get(j, F0) for j in range(-15, 16)}


# ---------------------------------------------------------------- the construction's data
I_RES = (0, 1, 3, 4, 7, 9, 12, 13, 16, 19, 21, 25, 27, 28, 31)
FN = (1, 3, 4, 7, 9, 12, 13, 16, 19, 21)
LN = (0,) + FN
T0 = tuple(n for n in range(25, 61) if n % 36 in I_RES)
BIG_B = Fr(4, 3)
DEFAULT = dict(h=Fr(17, 50), H=Fr(27, 50), c0=Fr(44, 100), C1=Fr(-6, 1000), C2=Fr(6, 1000),
               Zc=Fr(391, 1000), Ws=Fr(61, 10000), Ds=Fr(18, 100000), Us=Fr(48, 100000), Ps=Fr(3, 10000000),
               I=I_RES, bounds=None)
# printed lower/upper bounds of Lemma lem:finite-certificate
BOUNDS = dict(piv=(Fr(12, 100), Fr(174, 100)), inv_minus=Fr(1616, 100), inv_plus=Fr(389, 100), A1=Fr(258, 100),
              A2=Fr(280, 100), Qlo=Fr(157, 1000), Qhi=40, Dabs=Fr(283, 100), Q16=16,
              mids=[Fr(x) for x in ('0.165', '0.120', '0.054', '0.482', '0.656', '1.11', '0.337', '3.13', '9.26',
                                    '8.19', '19.08', '2.34', '0.706', '6.80', '14.1')],
              psi=[('f', 'W', 'h', 'H', Fr(335)), ('T', 'M', 'H', 'h', Fr(7, 10 ** 15)), ('T', 'W', 'h', 'h', Fr(23, 10 ** 9)),
                   ('T', 'V', 'h', 'h', Fr(127, 10 ** 9))],
              Wnorm=119, rep=Fr(25, 10 ** 11), omit_f=Fr(81, 10 ** 9), omit_T=Fr(92, 10 ** 30),
              curv_s=[Fr(0), Fr(1), Fr(2), Fr(29, 2), Fr(23)],
              curv_L=[Fr(1498), Fr('45.1'), Fr('13.8'), Fr('0.00458'), Fr('0.000022')],
              curv_V=[Fr(13530), Fr(151), Fr(31), Fr('0.00122'), Fr('0.000004')],
              curv_T=[Fr(26500), Fr(1160), Fr(800), Fr(800), Fr(800)],
              taylor_m1=Fr('0.00161'), taylor_other=Fr('0.0000075'),
              tests=[(1, Fr(-1), 2, 'T', Fr('0.174')), (1, Fr(-1), 1, 'Q1/2Z', Fr('0.057')), (1, Fr(1), 2, 'T', Fr('0.011')),
                     (3, Fr(-1), 1, '0.8Q1w', Fr('0.00055')), (3, Fr(1, 2), 1, '0.8Q1w', Fr('0.00055')),
                     (3, Fr(-1), 2, 'T', Fr('0.00097')), (3, Fr(1, 2), 2, 'T', Fr('0.00097')),
                     (4, Fr(-1, 2), 1, '-T', Fr('0.00047')), (4, Fr(3, 2), 1, '-T', Fr('0.00047')),
                     (4, Fr(-1, 2), 2, 'T', Fr('0.00097')), (4, Fr(3, 2), 2, 'T', Fr('0.00097')),
                     (7, Fr(-3, 2), 1, '-T', Fr('0.0028')), (7, Fr(1), 1, '-T', Fr('0.0028')),
                     (7, Fr(-3, 2), 2, 'T', Fr('0.0028')), (7, Fr(1), 2, 'T', Fr('0.0028')),
                     (9, Fr(-1), 1, '-T', Fr('0.0039')), (9, Fr(3, 2), 1, '-T', Fr('0.0039')),
                     (9, Fr(-1), 2, 'T', Fr('0.0039')), (9, Fr(3, 2), 2, 'T', Fr('0.0039')),
                     (12, Fr(-3, 2), 1, '-T', Fr('0.0020')), (12, Fr(1, 2), 1, '-T', Fr('0.0020')),
                     (12, Fr(-3, 2), 2, 'T', Fr('0.0020')), (12, Fr(1, 2), 2, 'T', Fr('0.0020')),
                     (13, Fr(-1, 2), 1, '-T', Fr('0.0020')), (13, Fr(3, 2), 1, '-T', Fr('0.0020')),
                     (13, Fr(-1, 2), 2, 'T', Fr('0.0020')), (13, Fr(3, 2), 2, 'T', Fr('0.0020'))],
              exceptional=[Fr('0.046'), Fr('0.056'), Fr('0.024'), Fr('0.027')])
CELLS = [(1, Fr(-1)), (1, Fr(1)), (3, Fr(-1)), (3, Fr(1, 2)), (4, Fr(-1, 2)), (4, Fr(3, 2)), (7, Fr(-3, 2)), (7, Fr(1)),
         (9, Fr(-1)), (9, Fr(3, 2)), (12, Fr(-3, 2)), (12, Fr(1, 2)), (13, Fr(-1, 2)), (13, Fr(3, 2))]


def build(par):
    """every finite array of Section 4, from the definitions"""
    h, H = par['h'], par['H']
    eta = H - h
    I = par['I']
    out = {}
    b = sqrt(q(3)) / 2
    kappa = PI / 36
    # the field layer
    Pj = P_coefficients(I)
    out['P'] = Pj
    exact = {}
    exact['conj'] = all(Pj[-j] == fconj(Pj[j]) for j in range(16))

    def sum_j(fn, n, weight):
        acc = F0
        for j in range(-15, 16):
            wgt = weight(j)
            if wgt:
                acc = fadd(acc, fsc(fmul(Pj[j], wpow(j * n)), wgt))
        return acc
    exact['zeros'] = all(sum_j(None, n, lambda j: 1) == F0 and sum_j(None, n, lambda j: j) == F0 for n in I)
    # numeric images of w^k
    OM = []
    for k in range(DEG):
        c, s = cos_sin(PI * Fr(k, 18))
        OM.append(Z(c, s))

    def num(a):
        acc = Z(0, 0)
        for k, x in enumerate(a):
            if x:
                acc = acc + OM[k] * Fr(x)
        return acc
    # Q_n, D_n by the appendix recipe, for every residue
    Q = {}
    D = {}
    for n in range(36):
        if n % 36 not in I:
            continue
        s2 = F0
        s3 = F0
        for j in range(16):
            pj = fmul(Pj[j], wpow(j * n))
            s2 = fadd(s2, fsc(pj, j * j))
            s3 = fadd(s3, fsc(pj, j ** 3))
        qn = num(fsc(fre(s2), Fr(-1, 324))).re * PI * PI          # Re sum p_j (i pi t_j)^2
        dn_num = num(fre(fmul(s3, fsc(IF, -1)))).re * Fr(1, 5832) * PI * PI * PI   # Re sum p_j (i pi t_j)^3
        Q[n] = qn
        D[n] = dn_num / (qn * 3)
    out['Q'], out['D'] = Q, D
    # closed forms (independent route): Q_n = 4 kappa^2 prod (2 sin kappa(n-d))^2, D_n = 2 kappa sum cot kappa(n-d)
    agree = True
    for n in Q:
        prod = q(4) * kappa * kappa
        cs = q(0)
        for d in I:
            if d != n:
                c, s = cos_sin(kappa * (n - d))
                prod = prod * sqr(s * 2)
                cs = cs + c / s
        cs = cs * kappa * 2
        if not (prod.lo <= Q[n].hi and Q[n].lo <= prod.hi and cs.lo <= D[n].hi and D[n].lo <= cs.hi):
            agree = False
    exact['closed_forms'] = agree
    # folded atomic masses (exact field elements before the kappa factors)
    bj = [1] + [2] * 15
    Mc, Md = {}, {}
    for n in LN:
        for j in range(16):
            acc = F0
            for l in range(j + 1, 16):
                acc = fadd(acc, fsc(fmul(Pj[l], wpow((l - j) * n)), l - j))
            Mc[j, n] = fsc(acc, -4 * bj[j])
            acc = Pj[j]
            for l in range(j + 1, 16):
                acc = fadd(acc, fsc(fmul(Pj[l], wpow((l - j) * n)), 2))
            Md[j, n] = fsc(fmul(IF, acc), bj[j])
    exact['real_zero_freq'] = all(Mc[0, n] == fconj(Mc[0, n]) and Md[0, n] == fconj(Md[0, n]) for n in LN)
    # the atomic identities, exactly, at integer s off the node set
    ok = True
    for s in (2, 5, 6, 8, 33):
        if s % 36 in I:
            continue
        Ps = sum_j(None, s, lambda j: 1)
        for n in LN:
            Y = wpow(s - n)
            Ym1 = fadd(Y, fsc(F1, -1))
            ac = F0
            ad = F0
            for j in range(16):
                ac = fadd(ac, fmul(Mc[j, n], wpow(j * s)))
                ad = fadd(ad, fmul(Md[j, n], wpow(j * s)))
            if fmul(fre(ac), fmul(Ym1, Ym1)) != fmul(fsc(Y, -4), Ps):
                ok = False
            if fmul(fre(ad), Ym1) != fmul(fmul(IF, fadd(Y, F1)), Ps):
                ok = False
    exact['atomic_identities'] = ok
    out['exact'] = exact
    # numeric matrices: M (16 x 22 complex, columns c_n, d_n interleaved over L), V (16)
    k2 = kappa * kappa
    M = [[None] * (2 * len(LN)) for _ in range(16)]
    for j in range(16):
        for ci, n in enumerate(LN):
            M[j][2 * ci] = num(Mc[j, n]) * k2
            M[j][2 * ci + 1] = num(Md[j, n]) * kappa
    V = [num(fsc(Pj[j], bj[j])) for j in range(16)]
    out['M'], out['V'] = M, V
    tj = [Fr(j, 18) for j in range(16)]

    def wave(k, v, j):
        X = BIG_B / (k * k + tj[j] * tj[j])
        lam = Z(q(k * X / BIG_B), q(tj[j] * X / BIG_B)) / b         # (k + i t) / (b (k^2 + t^2))
        zeta = (-tj[j] * X, k * X - v)                                # exact rationals
        return X, lam, zeta
    out['wave'] = wave
    # R_0 and R: rows (c_n, d_n) for n in f, columns c_0, d_0, C, then c_n, d_n for n in f
    def jet_rows(n, S, k, v):
        """eq. finite-jet-map: (1/Q_n) Re sum_j lambda e^{i pi zeta n} (-1, D_n - i pi zeta) S_j"""
        rc = q(0)
        rd = q(0)
        for j in range(16):
            X, lam, (zr, zi) = wave(k, v, j)
            E = cexp(Z(PI * (-zi * n), PI * (zr * n)))
            base = lam * E * S[j]
            rc = rc - base.re
            ipz = Z(PI * (-zi), PI * zr)                 # i pi zeta
            rd = rd + (base * (Z(D[n % 36], 0) - ipz)).re
        return rc / Q[n % 36], rd / Q[n % 36]
    cols = [('M', 0), ('M', 1), ('V', None)] + [('M', 2 * (1 + i) + e) for i in range(len(FN)) for e in (0, 1)]
    full = []
    for n in FN:
        rowc, rowd = [], []
        for kind, ci in cols:
            if kind == 'M':
                S = [M[j][ci] for j in range(16)]
                a, d_ = jet_rows(n, S, H, H)
            else:
                a, d_ = jet_rows(n, V, h, H)
            rowc.append(a)
            rowd.append(d_)
        full.append(rowc)
        full.append(rowd)
    R0 = [row[:3] for row in full]
    RR = [row[3:] for row in full]
    out['R0'], out['R'] = R0, RR
    out['b'], out['kappa'], out['eta'] = b, kappa, eta
    return out


def gauss_jordan(A):
    n = len(A)
    aug = [list(row) + [q(int(i == j)) for j in range(n)] for i, row in enumerate(A)]
    piv = []
    for c in range(n):
        p = aug[c][c]
        if p.lo <= 0 <= p.hi:
            return None, piv
        piv.append(p)
        inv = p.recip()
        aug[c] = [x * inv for x in aug[c]]
        aug[c][c] = q(1)
        for r in range(n):
            if r != c:
                f = aug[r][c]
                if f.lo == 0 and f.hi == 0:
                    continue
                aug[r] = [x - f * y for x, y in zip(aug[r], aug[c])]
                aug[r][c] = q(0)
    return [row[n:] for row in aug], piv


def colnorm(A):
    """upper end of the maximum absolute column sum"""
    best = q(0)
    for c in range(len(A[0])):
        s = q(0)
        for r in range(len(A)):
            s = s + absr(A[r][c])
        best = rmax(best, s)
    return best


def matmul(A, B):
    return [[sum((A[i][k] * B[k][j] for k in range(len(B))), q(0)) for j in range(len(B[0]))] for i in range(len(A))]


def bern(rows, N):
    """degree-N Bernstein coefficient rows of sum_r rows[r] tau^r (eq. bernstein-row-conversion)"""
    rows = rows + [[q(0)] * 8 for _ in range(N + 1 - len(rows))]
    out = []
    for i in range(N + 1):
        acc = [q(0)] * 8
        for r in range(i + 1):
            w = Fr(math.comb(i, r), math.comb(N, r))
            acc = [a + x * w for a, x in zip(acc, rows[r])]
        out.append(acc)
    return out


def polytope_min(row, par):
    """eq. polytope-row-minimum: the exact minimum over E of row . (z, 1, Zw - Delta, w, a, u, r, p)"""
    Zc, Ws, Ds, Us, Ps = par['Zc'], par['Ws'], par['Ds'], par['Us'], par['Ps']
    b_, c_, l_, d_, k_, j_, n_, r_ = row
    return (c_ + rmin(b_, 0) * Zc + rmin(d_ + l_ * Zc, 0) * Ws + rmin(-l_, 0) * Ds
            + rmin(0, j_, j_ + k_ * Zc) * Us + (rmin(n_, 0) + rmin(r_, 0)) * Ps)


def polytope_min_bruteforce(row, par):
    """the same minimum by enumerating the vertices of E (a product of segments and one triangle) — exact"""
    Zc, Ws, Ds, Us, Ps = par['Zc'], par['Ws'], par['Ds'], par['Us'], par['Ps']
    best = None
    for z in (0, Zc):
        for w in (0, Ws):
            for D_ in (0, Ds):
                for (a, u) in ((0, 0), (0, Us), (Zc * Us, Us)):
                    for r in (0, Ps):
                        for p in (0, Ps):
                            e = (z, 1, Zc * w - D_, w, a, u, r, p)
                            v = sum(x * y for x, y in zip(row, e))
                            best = v if best is None else min(best, v)
    return best


def decide(src=None, **over):
    t0 = time.time()
    par = dict(DEFAULT)
    par.update({k: v for k, v in over.items() if k in DEFAULT})
    BND = dict(BOUNDS)
    BND.update(over.get('bounds') or {})
    src = src or Sources()
    checks = []
    tex = src.text(PAPER)
    meta = src.text(DATA)
    flat = tex.replace('\n', ' ')
    check(checks, 'the paper prints the finite lemma, the polytope and the 659 row minima',
          all(s in flat for s in ('\\begin{lemma}[Finite certificate]', 'Z=0.391,\\quad W_*=0.0061', '27\\cdot21+4\\cdot23=659',
                                  '16.16<17', '3.89<5')), 'main.tex l.1129-1385, 2260-2265')
    check(checks, 'CERTIFICATE.json names the scope as finite constants, the two 20x20 blocks, the polytope, envelopes, Bernstein',
          'two 20-by-20 blocks' in meta and 'Infinite interpolation' in meta)
    h, H = par['h'], par['H']
    Zc, Ws, Ds, Us, Ps = par['Zc'], par['Ws'], par['Ds'], par['Us'], par['Ps']
    B = build(par)
    ex = B['exact']
    check(checks, '0. P_j exactly in Z[w]: P_{-j} = conj(P_j)', ex['conj'])
    check(checks, '0. P(n) = P\'(n) = 0 exactly at every residue of I (double zeros)', ex['zeros'])
    check(checks, '0. folded zero-frequency atomic masses are real (l.821-826), exactly', ex['real_zero_freq'])
    check(checks, '0. folded atomic masses reproduce kappa^2 P csc^2 and kappa P cot exactly at s = 2, 5, 6, 8, 33', ex['atomic_identities'])
    check(checks, '1. Q_n, D_n (appendix recipe) agree with the closed product / cotangent forms at all 15 residues', ex['closed_forms'])
    Q, D = B['Q'], B['D']
    b, kappa, eta = B['b'], B['kappa'], B['eta']
    qmin = min(Q.values(), key=lambda x: x.lo)
    qmax = max(Q.values(), key=lambda x: x.hi)
    dmax = max((absr(x) for x in D.values()), key=lambda x: x.hi)
    check(checks, 'item 2: %s < Q_n < %s at every residue' % (BND['Qlo'], BND['Qhi']),
          all(lt(BND['Qlo'], x) and lt(x, BND['Qhi']) for x in Q.values()), 'min %.6f, max %.4f' % (qmin.f(), qmax.f()))
    check(checks, 'item 2: |D_n| < %s at every residue' % BND['Dabs'], all(lt(absr(x), BND['Dabs']) for x in D.values()),
          'max %.6f' % dmax.f())
    check(checks, 'item 2: min(Q_16, Q_19, Q_21) > 16', all(lt(BND['Q16'], Q[n]) for n in (16, 19, 21)),
          ', '.join('%.4f' % Q[n].f() for n in (16, 19, 21)))
    # midpoint values, from the sine product itself
    I = par['I']
    nodes = list(I) + [36]
    mids_ok = True
    mid_vals = []
    for g in range(len(I)):
        a, a2 = nodes[g], nodes[g + 1]
        s = Fr(a + a2, 2)
        Pm = q(1)
        for d in I:
            _, sn = cos_sin(kappa * (s - d))
            Pm = Pm * sqr(sn * 2)
        val = Pm / q(Fr(a2 - a, 2) ** 2)
        mid_vals.append(val)
        if g < len(BND['mids']) and not lt(BND['mids'][g], val):
            mids_ok = False
    check(checks, 'item 2: the 15 gap-midpoint values of P(s)/(s-m)^2 exceed the printed bounds', mids_ok and len(I) == 15,
          ', '.join('%.4f' % v.f() for v in mid_vals))
    # Gauss-Jordan
    RR, R0 = B['R'], B['R0']
    n20 = len(RR)
    Im = [[(q(1) if i == j else q(0)) - RR[i][j] for j in range(n20)] for i in range(n20)]
    Ip = [[(q(1) if i == j else q(0)) + RR[i][j] for j in range(n20)] for i in range(n20)]
    invm, pm = gauss_jordan(Im)
    invp, pp = gauss_jordan(Ip)
    plo, phi = BND['piv']
    allp = pm + pp
    check(checks, 'item 1: every pivot of diagonal Gauss-Jordan on I-R and I+R excludes 0 (40 pivots)',
          invm is not None and invp is not None and len(allp) == 40)
    if invm is None or invp is None:
        return finish(checks, src, t0, {}, 'the interval Gauss-Jordan met a pivot containing 0')
    pabs = [absr(p) for p in allp]
    check(checks, 'item 1: %s < |pivot| < %s for all 40 pivots' % (plo, phi), all(lt(plo, p) and lt(p, phi) for p in pabs),
          'min %.5f, max %.5f' % (min(p.f() for p in pabs), max(p.f() for p in pabs)))
    nm = colnorm(invm)
    npl = colnorm(invp)
    check(checks, 'item 1: ||(I-R)^-1|| < %s' % BND['inv_minus'], lt(nm, BND['inv_minus']), '%.6f' % nm.f())
    check(checks, 'item 1: ||(I+R)^-1|| < %s' % BND['inv_plus'], lt(npl, BND['inv_plus']), '%.6f' % npl.f())
    # Y_f, gamma, U_+-, A_i
    Yf = [[q(0)] * 8 for _ in range(n20)]
    for p_, n in enumerate(FN[:4]):
        fac = Q[1] * exp(PI * eta * n) / Q[n]
        Yf[2 * p_][2 * p_] = fac
        Yf[2 * p_ + 1][2 * p_] = fac * (PI * eta - D[n])
        Yf[2 * p_ + 1][2 * p_ + 1] = -fac
    c0, C1, C2 = par['c0'], par['C1'], par['C2']
    rhs_p = [[Yf[r][c] + (R0[r][0] * (2 * c0) + R0[r][2] * (C2 + C1) if c == 1 else 0) for c in range(8)]
             for r in range(n20)]                                                          # Y_f + R_0 (gamma_2 + gamma_1)
    rhs_m = [[Yf[r][c] + (R0[r][2] * (C2 - C1) if c == 1 else 0) for c in range(8)] for r in range(n20)]  # ... (gamma_2 - gamma_1)
    Up = matmul(invm, rhs_p)
    Um = matmul(invp, rhs_m)
    A = {}
    for i, sgn in ((1, 1), (2, -1)):
        Af = [[(Up[r][c] + Um[r][c] * sgn) / 2 for c in range(8)] for r in range(n20)]
        Ci = C1 if i == 1 else C2
        A[i] = [[q(0), q(c0)] + [q(0)] * 6, [q(0)] * 8] + Af + [[q(0), q(Ci)] + [q(0)] * 6]
    bnd = [None, None, q(Fr('0.0024')), q(Ws), q(Zc * Us), q(Us), q(Ps), q(Ps)]
    check(checks, '|Zw - Delta| <= max(Z W*, Delta*) < 0.0024 (the coordinate bound used for e_3)', max(Zc * Ws, Ds) < Fr('0.0024'))
    for i, key in ((1, 'A1'), (2, 'A2')):
        Ai = A[i]
        m01 = rmax(*[sum((absr(Ai[r][0] * z + Ai[r][1]) for r in range(23)), q(0)) for z in (0, Zc)])
        rest = sum((sum((absr(Ai[r][c]) for r in range(23)), q(0)) * bnd[c] for c in range(2, 8)), q(0))
        tot = m01 + rest
        check(checks, 'item 1: sup_E ||A_%d e|| < %s (columns 1-2 at z = 0, Z, the rest by coordinate bounds)' % (i, BND[key]),
              lt(tot, BND[key]), '%.6f' % tot.f())
    # the polytope contains the data
    zmax = (PI * (b.recip() - h)).recip()
    check(checks, 'polytope: 1/(pi(1/b - h)) < Z', lt(zmax, Zc), '%.6f' % zmax.f())
    for nm_, ex_, bd in (('W*', 2, Ws), ('U*', 3, Us), ('P*', 6, Ps)):
        v = exp(q(Fr(-ex_) / Zc))
        check(checks, 'polytope: e^{-%d/Z} < %s' % (ex_, nm_), lt(v, bd), '%.4g' % v.f())
    zs = sqrt(q(1 + 2 * Zc)) - 1
    dmax_ = (q(Zc) - zs) * exp(q(-2) / zs)
    # the maximiser: derivative of (Z - z) e^{-2/z} vanishes where z^2 + 2z - 2Z = 0
    check(checks, 'polytope: Delta = (Z - z)e^{-2/z} has its maximum at z = sqrt(1+2Z) - 1, value < 0.00015 < Delta*',
          lt(dmax_, Fr('0.00015')) and Fr('0.00015') < Ds, '%.6g' % dmax_.f())
    # polytope row minimum formula, exactly, on random-but-fixed rational rows
    import random
    rnd = random.Random(177)
    okpm = True
    for _ in range(40):
        row = [Fr(rnd.randint(-50, 50), rnd.randint(1, 9)) for _ in range(8)]
        fm = polytope_min([q(x) for x in row], par)
        ex_min = polytope_min_bruteforce(row, par)
        if not (fm.lo <= q(ex_min).hi and q(ex_min).lo <= fm.hi):
            okpm = False
    check(checks, 'eq. polytope-row-minimum equals the vertex minimum of E (40 rational rows, exact enumeration)', okpm)
    # envelopes
    M, V = B['M'], B['V']
    wave = B['wave']
    Pj = B['P']
    absP = []
    for l in range(16):
        # |P_l| from its numeric image
        acc = Z(0, 0)
        for k_, x in enumerate(Pj[l]):
            if x:
                c, s = cos_sin(PI * Fr(k_, 18))
                acc = acc + Z(c, s) * x
        absP.append(acc.absz())
    Wm = [[q(0), q(0)]]
    for j in range(1, 16):
        wc = sum((absP[l] * (Fr(l - j) + Fr(1, 2)) for l in range(j, 16)), q(0)) * (PI / 18) * (PI / 18) * 2
        wd = sum((absP[l] for l in range(j, 16)), q(0)) * (PI / 18) * 2
        Wm.append([wc, wd])
    Wn = rmax(sum((r[0] for r in Wm), q(0)), sum((r[1] for r in Wm), q(0)))
    check(checks, 'item 3: ||W|| < 119 (tail variation matrix, eq. analytic:tail-variation)', lt(Wn, BND['Wnorm']), '%.4f' % Wn.f())
    absM = [[M[j][c].absz() for c in range(len(M[0]))] for j in range(16)]
    absV = [[V[j].absz()] for j in range(16)]
    absW = Wm
    mats = {'M': absM, 'V': absV, 'W': absW}

    def bracket(g, S):
        return rmax(*[sum((g[j] * S[j][c] for j in range(16)), q(0)) for c in range(len(S[0]))])

    def kv(name):
        return h if name == 'h' else H
    tj = [Fr(j, 18) for j in range(16)]

    def env_terms(k, v, j):
        X = BIG_B / (k * k + tj[j] * tj[j])
        ell = sqrt(q(X))
        db = PI * sqrt(q(v * v + (BIG_B - 2 * k * v) * X))
        Eb = PI * (k * X - v)
        return X, ell, db, Eb
    for Nset, Sname, kname, vname, ub in BND['psi']:
        k, v = kv(kname), kv(vname)
        g = []
        for j in range(16):
            X, ell, db, Eb = env_terms(k, v, j)
            nodes_ = FN if Nset == 'f' else T0
            acc = q(0)
            for n in nodes_:
                acc = acc + (absr(D[n % 36]) + db + 1) * ell * exp(-Eb * n) / Q[n % 36]
            if Nset == 'T':
                acc = acc / (q(1) - exp(-Eb * 36))
            g.append(acc)
        val = bracket(g, mats[Sname])
        check(checks, 'item 3: Psi_{%s,%s,%s}(%s) < %s' % (Nset, kname, vname, Sname, ub), lt(val, ub), '%.4g' % val.f())
    rep = (PI * eta + 1) / (exp(PI * eta * 36) - 1)
    check(checks, 'item 3: (1 + pi eta)/(e^{36 pi eta} - 1) < 2.5e-10', lt(rep, BND['rep']), '%.5g' % rep.f())
    of = sum(((q(1 + Zc) + absr(PI * eta - D[n % 36]) * Zc) / Q[n % 36] * exp(PI * eta * n + Fr(1 - n) / Zc)
              for n in FN if 9 <= n <= 21), q(0)) * Q[1]
    oT = sum(((q(1 + Zc) + absr(D[n % 36]) * Zc) / Q[n % 36] * exp(q(Fr(1 - n) / Zc)) for n in T0), q(0)) * Q[1]
    oT = oT / (q(1) - exp(q(Fr(-36) / Zc)))
    check(checks, 'item 3: omitted target envelope over f cap [9,21] < 8.1e-8', lt(of, BND['omit_f']), '%.5g' % of.f())
    check(checks, 'item 3: omitted target envelope over T < 9.2e-29', lt(oT, BND['omit_T']), '%.5g' % oT.f())
    # curvature envelopes
    okL = okV = okT = True
    vals = []
    for si, s in enumerate(BND['curv_s']):
        gA, gB = [], []
        for j in range(16):
            X, ell, db, Eb = env_terms(H, h, j)
            da2 = PI * PI * q(tj[j] ** 2 + (H - h) ** 2)
            gA.append(da2 * exp(-PI * (H - h) * s))
            gB.append(db * db * ell * exp(-Eb * s))
        Lv = (bracket(gA, absM) + bracket(gB, absM)) / 2
        gV = []
        for j in range(16):
            X, ell, db, Eb = env_terms(h, h, j)
            gV.append(db * db * ell * exp(-Eb * s))
        Vv = bracket(gV, absV) / 2
        ts = Fr(0) if s == 0 else Fr(5, 6)
        Xs = BIG_B / (h * h + ts * ts)
        ells = sqrt(q(Xs))
        dbs = PI * sqrt(q(h * h + (BIG_B - 2 * h * h) * Xs))
        Ebs = PI * (h * Xs - h)
        Tv = (PI * PI * Fr(25, 36) + dbs * dbs * ells * exp(-Ebs * s)) * 60
        vals.append('s=%s: L %.5g, V %.5g, T %.5g' % (s, Lv.f(), Vv.f(), Tv.f()))
        okL &= lt(Lv, BND['curv_L'][si])
        okV &= lt(Vv, BND['curv_V'][si])
        okT &= lt(Tv, BND['curv_T'][si])
    check(checks, 'item 4: L curvature envelope below 1498, 45.1, 13.8, .00458, .000022', okL, '; '.join(vals))
    check(checks, 'item 4: transformed-constant curvature envelope below 13530, 151, 31, .00122, .000004', okV)
    check(checks, 'item 4: T curvature envelope below 26500, 1160, 800, 800, 800', okT)
    okR = True
    rvals = []
    for (m, y) in CELLS:
        Y = abs(y)

        def gfun(d, E):
            return d * d * rpow(d * Y, 21) / math.factorial(23) * exp(-E * m) / (q(1) - d * Y / 24)

        def Efun(k, S):
            ga, gb = [], []
            for j in range(16):
                X, ell, db, Eb = env_terms(k, h, j)
                da = PI * sqrt(q(tj[j] ** 2 + (k - h) ** 2))
                ga.append(gfun(da, PI * (k - h)))
                gb.append(ell * gfun(db, Eb))
            return bracket(ga, S) + bracket(gb, S)
        envv = Efun(H, absM) * 3 + Efun(h, absV) * Fr(6, 1000)
        lim = BND['taylor_m1'] if m == 1 else BND['taylor_other']
        okR &= lt(envv, lim)
        rvals.append('(%d,%s) %.6g' % (m, y, envv.f()))
    check(checks, 'item 4: divided Taylor remainder envelope < .00161 at m = 1 and < .0000075 elsewhere (14 half-cells)', okR,
          ', '.join(rvals))
    # item 5: Taylor rows and Bernstein tests
    SA = {}
    for i in (1, 2):
        Ai = A[i]
        SA[i, 'M'] = [[sum((M[j][c] * Ai[c][e] for c in range(22)), Z(0, 0)) for e in range(8)] for j in range(16)]
        SA[i, 'V'] = [[V[j] * Ai[22][e] for e in range(8)] for j in range(16)]

    def taylor_rows(i, m, y):
        rows = [[q(0)] * 8 for _ in range(21)]
        for (k, Sname) in ((H, 'M'), (h, 'V')):
            for j in range(16):
                X, lam, (zr, zi) = wave(k, h, j)
                wa = Z(q(-(k - h)) * PI, PI * tj[j])
                wb = Z(PI * (-zi), PI * zr)
                a_ = wa * wa * cexp(wa * m) / 2
                b_ = wb * wb * cexp(wb * m) * lam / 2
                for r in range(21):
                    for e in range(8):
                        rows[r][e] = rows[r][e] + (a_ * SA[i, Sname][j][e] + b_ * SA[3 - i, Sname][j][e]).re
                    a_ = a_ * wa * y / (r + 3)
                    b_ = b_ * wb * y / (r + 3)
        return rows
    TR = {}
    for (m, y) in CELLS:
        for i in (1, 2):
            TR[i, m, y] = taylor_rows(i, m, y)
    Q1 = Q[1]
    allmins = []
    ok5 = True
    detail5 = []
    for (m, y, side, kind, lb) in BND['tests']:
        rows = [list(r) for r in TR[side, m, y]]
        if kind != 'T':
            rows = [[-x for x in r] for r in rows]
        if kind == 'Q1/2Z':
            rows[0][1] = rows[0][1] + Q1 / (2 * Zc)
        elif kind == '0.8Q1w':
            rows[0][3] = rows[0][3] + Q1 * Fr(8, 10)
        mins = [polytope_min(br, par) for br in bern(rows, 20)]
        allmins.extend(mins)
        worst = min(mins, key=lambda x: x.lo)
        good = all(lt(lb, x) for x in mins)
        ok5 &= good
        detail5.append('%s%s(%d,%s)>%s: %.7f%s' % ('' if kind == 'T' else kind + ' ', 'T%d' % side, m, y, lb, worst.f(), '' if good else ' FAIL'))
    check(checks, 'item 5: all 27 degree-20 sign tests, 567 Bernstein row minima over E, exceed the printed bounds', ok5 and len(allmins) == 567,
          '; '.join(detail5))
    # exceptional half-cell m = y = 1, side one
    negT1 = [[-x for x in r] for r in TR[1, 1, Fr(1)]]
    Arow = [[q(0), r[1]] + r[2:] for r in negT1]
    Drow = [[q(0), r[1] + r[0] * Zc] + r[2:] for r in negT1]

    def shift(rows, k):
        return [[q(0)] * 8 for _ in range(k)] + rows

    def addrows(*rs):
        n = max(len(r) for r in rs)
        out = []
        for i in range(n):
            acc = [q(0)] * 8
            for r in rs:
                if i < len(r):
                    acc = [a + x for a, x in zip(acc, r[i])]
            out.append(acc)
        return out

    def scale(rows, c):
        return [[x * c for x in r] for r in rows]

    def const(c, deg):
        rows = [[q(0)] * 8 for _ in range(deg + 1)]
        rows[deg][1] = cv(c)
        return rows
    B0 = lambda P: shift(P, 2)                                             # noqa: E731
    B1 = lambda P: addrows(shift(P, 2), scale(shift(P, 1), 2 * Zc))         # noqa: E731
    B2 = lambda P: addrows(shift(P, 2), scale(shift(P, 1), 4 * Zc), scale(P, 6 * Zc * Zc))  # noqa: E731
    polys = [addrows(const(Q1, 0), shift(Arow, 1)),
             addrows(const(Q1 * Zc, 0), const(Q1, 1), scale(B1(Arow), Fr(2, 3)), scale(B0(Drow), Fr(1, 3))),
             addrows(const(Q1 * 2 * Zc, 0), const(Q1, 1), scale(B2(Arow), Fr(1, 3)), scale(B1(Drow), Fr(2, 3))),
             addrows(const(Q1 * 3 * Zc, 0), const(Q1, 1), B2(Drow))]
    okx = True
    dx = []
    nrows = 0
    for p_, lb in zip(polys, BND['exceptional']):
        mins = [polytope_min(br, par) for br in bern(p_, 22)]
        nrows += len(mins)
        worst = min(mins, key=lambda x: x.lo)
        okx &= all(lt(lb, x) for x in mins)
        dx.append('>%s: %.7f' % (lb, worst.f()))
    check(checks, 'item 5: the four exceptional degree-22 tests at m = y = 1 (92 Bernstein row minima) exceed .046, .056, .024, .027',
          okx and nrows == 92, '; '.join(dx))
    # Section 5-6 rational consequences
    N_p, N_m = 17, 5
    beta, delta, d_ = Fr(3, 10 ** 10), Fr(3, 10 ** 8), Fr(82, 10 ** 9)
    dpp = Fr(1, 10 ** 26) + 6 * beta
    dpm = dpp + Fr(12, 1000) * Fr(13, 10 ** 8)
    ep = (dpp + beta * N_p * d_) / (1 - delta - 340 * beta * N_p)
    em = (dpm + beta * N_m * d_) / (1 - delta - 340 * beta * N_m)
    fp = N_p * (d_ + 340 * ep)
    fm = N_m * (d_ + 340 * em)
    check(checks, "Section 4 table: e'_+ < 1.800004e-9, e_+ < 1.179803e-5, e'_- < 3.360002e-9, e_- < 6.122004e-6 (exact rationals)",
          ep < Fr('1.800004e-9') and fp < Fr('1.179803e-5') and em < Fr('3.360002e-9') and fm < Fr('6.122004e-6'),
          '%.7g %.7g %.7g %.7g' % (ep, fp, em, fm))
    check(checks, 'Section 4: individual errors (e_+ + e_-)/2 < 1e-5 and (e\'_+ + e\'_-)/2 < 3e-9; 1 - delta - 340 beta N > 0',
          (fp + fm) / 2 < Fr(1, 10 ** 5) and (ep + em) / 2 < Fr(3, 10 ** 9) and 1 - delta - 340 * beta * N_p > 0)
    check(checks, 'Section 4: the finite bounds feed ||B|| < 340, ||D|| < 3e-8, ||C||+||A|| < 3e-10, ||K_TV|| < 1.3e-7, d = 8.2e-8',
          Fr(335) < 340 and Fr(23, 10 ** 9) < delta and Fr(7, 10 ** 15) + Fr(25, 10 ** 11) < beta and Fr(127, 10 ** 9) < Fr(13, 10 ** 8)
          and Fr(81, 10 ** 9) < d_)
    lines = [(Fr(1510) * Fr(1, 10 ** 5) + 26500 * Fr(3, 10 ** 9) + Fr(2, 1000), Fr('0.0171795'), Fr('0.018')),
             (Fr(46) * Fr(1, 10 ** 5) + 1160 * Fr(3, 10 ** 9) + Fr(2, 1000), Fr('0.00246348'), Fr('0.003')),
             (Fr(14) * Fr(1, 10 ** 5) + 800 * Fr(3, 10 ** 9) + Fr(1, 10 ** 5), Fr('0.0001524'), Fr('0.00016'))]
    check(checks, 'Lemma deleted-jets: .0171795 < .018, .00246348 < .003, .0001524 < .00016 (exact sums)',
          all(a == b_ and a < c for a, b_, c in lines))
    check(checks, 'Section 5: r(Z, .5) = 836500/974643 > .8 and 1/(2Z) > .8; B_2(1) = 1 + 4Z + 6Z^2 = 3.481286',
          (3 * Zc + Fr(1, 2)) / (6 * Zc * Zc + 4 * Zc * Fr(1, 2) + Fr(1, 4)) == Fr(836500, 974643) and Fr(836500, 974643) > Fr(8, 10)
          and 1 / (2 * Zc) > Fr(8, 10) and 1 + 4 * Zc + 6 * Zc * Zc == Fr('3.481286'))
    K1 = Fr('3.01') * Fr('0.00465') + 800 * Fr(3, 10 ** 9) + Fr(6, 1000) * Fr(2, 1000)
    K2 = Fr('3.01') * Fr('0.000023') + 800 * Fr(3, 10 ** 9) + Fr(6, 1000) * Fr(2, 1000)
    check(checks, 'Section 5 table: K = .0140109 / .00008363, .006*3 = .018 / .006*.054 = .000324, margins .0039891 / .00024037',
          K1 == Fr('0.0140109') and K2 == Fr('0.00008363') and Fr(6, 1000) * 3 - K1 == Fr('0.0039891')
          and Fr(6, 1000) * Fr('0.054') - K2 == Fr('0.00024037'))
    ends = []
    for k in (h, H):
        X = BIG_B / (k * k + Fr(25, 36))
        for v in (h, H):
            ends.append(k * X - v)
    check(checks, 'Section 3: the four endpoint differences kX_k(5/6) - v are 100079/455650, 8949/455650, 216419/554650, 105489/554650',
          ends == [Fr(100079, 455650), Fr(8949, 455650), Fr(216419, 554650), Fr(105489, 554650)])
    check(checks, 'Section 4: 1/X <= (k^2 + 25/36)/B < 3k for k = h, H', all((k * k + Fr(25, 36)) / BIG_B < 3 * k for k in (h, H)))
    allok = all(c['pass'] for c in checks)
    value = {'Q_min': '%.6f' % qmin.f(), 'inv_norm_I-R': '%.6f' % nm.f(), 'inv_norm_I+R': '%.6f' % npl.f(),
             'pivot_abs_range': '%.5f..%.5f' % (min(p.f() for p in pabs), max(p.f() for p in pabs)),
             'bernstein_rows': len(allmins) + nrows}
    return finish(checks, src, t0, value, None)


def finish(checks, src, t0, value, why):
    ok = all(c['pass'] for c in checks)
    value = dict(value)
    value['seconds'] = round(time.time() - t0, 1)
    if why:
        value['refused'] = why
    return {'verdict': 'CERTIFIED' if ok else ('REFUSED' if why else 'REFUTED'), 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: every inequality of Lemma lem:finite-certificate (the two 20x20 interval blocks and '
                       'their inverses, the parameter polytope, the jet / curvature / Taylor envelopes, all 659 Bernstein row '
                       'minima) and the printed rational consequences; not the analytic interpolation, sign propagation or '
                       'energy-transfer arguments, hence not the universal-optimality theorem',
            'value': value}


def forge():
    """each must NOT certify"""
    out = []
    r = decide(Ws=Fr(60, 10000))
    out.append(('the polytope constant W* = 0.0061 moved to 0.0060 (below e^{-2/Z} = 0.0060050)', r['verdict']))
    r = decide(c0=Fr(30, 100))
    out.append(('the fixed coefficient c_{i,0} = 0.44 changed to 0.30', r['verdict']))
    b = dict(BOUNDS)
    b['inv_minus'] = Fr(1610, 100)
    r = decide(bounds=b)
    out.append(('the printed bound ||(I-R)^-1|| < 16.16 tightened to 16.10', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    print(forge())
