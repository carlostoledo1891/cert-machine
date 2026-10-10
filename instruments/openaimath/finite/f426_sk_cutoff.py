"""F-426 -- "Cutoff throughout the high-temperature Sherrington-Kirkpatrick phase" (openai/math family 227).

THE CLAIM. Headline: worst-case total-variation cutoff for the zero-field Gaussian SK heat-bath dynamics at every
fixed 0 <= beta < 1. The finite object audited here belongs to the APPENDIX route: "The appendices give an
independent proof of the cutoff ratio for beta < 1/2, with its own scalar certificate" (01-introduction.tex:48-49).
That route needs Proposition rcut:prop:scalar-gap (appendices/scalar.tex:11-20: V_beta(b, r) <= .9969 for every
beta in [.35, .5]), whose numerical inputs are Lemma rcut:lem:scalar-data (scalar.tex:135-182: the five strict
endpoint enclosures of k(0), k(1), d(0), d'(0), d(1) at beta = 1/2, and the eight moments a, G, s_v, s_g, <mv>, R,
s_F, s_mv under N(beta^2, beta^2) within .001 of Table rcut:tab:scalar-moments at beta = .35, .4, .445, .475, .5),
proved in Appendix rcut:sec:scalar-certificate (appendices/scalar-certificate.tex:1-418), and Table
rcut:tab:scalar-intervals (scalar.tex:438-455), "verified" by the same directed arithmetic (scalar-certificate.tex:
284-288). No program file accompanies (the two scripts the text names, scalar-certificate.tex:291-294, are not in
the release, and the text says they are not needed to specify the certificate).

WHAT IS DECIDED HERE, from the TeX alone, by the appendix's own directed integer recipe (scalar-certificate.tex:
228-278) re-implemented: S = 10^50, intervals [u, v] meaning [u/S, v/S], outward rounding on every product,
reciprocal [floor(S^2/v), ceil(S^2/u)], square root [isqrt(uS), ceil sqrt(vS)], and e^d as
(p_20(d/32) +- 4(1.13)^21/21!)^32, |d/32| < 1.13 asserted at every call. No float in any decision.
  A. The finite sums (eq:scalar-finite-sums): 41 nodes x_j = 2j/5, h_j = beta x_j, c_j = e^{-(x_j-beta)^2/2},
     y_j = tanh h_j, V = 1 - y^2, P = V/(7/4 - y), N, T, a_N, G_N, f_j at the five exact temperatures; all
     40 entries of Table rcut:tab:scalar-finite-values within 1e-6; the five endpoint sums (eq:scalar-five-sums)
     within 1e-6 of eq:scalar-five-finite-values; every finite quantity within .00065 of Table scalar-moments;
     every finite standard deviation above .08; every exponential argument |d| <= 36.125.
  B. The error budget: pi from Machin with ten terms each (3.14159 < pi < 3.14160); .75 < pi/4; the strip bounds
     |Lambda| >= .14 on the closed unit disk (exactly: no zero of Lambda in the disk, and on |m| = 1,
     |Lambda|^2 = .0436 - .084c + .45c^2 >= .0396 > .14^2), the constants 4.12, 6.37, 1.125, 8/3, 38/3, 9/(16 .14),
     e^{1.125} < 4, sqrt(1.25) < 1.12, the 260 edge-integral bound and M = 1000; the tail series (16.72, 7.9,
     31.205, 17.32, 3.24), q_* < .042026, the tail < 2.612e-12, the whole-line error 2000/(e^{7.5 pi} - 1) <
     1.171e-7, E_quad = 2.3e-7 >= their sum; E_1, E_2, E_var < 1.312e-5, E_sd < 1.64e-4, e_a < 4.61e-7,
     E_par < 1e-6, E_sd + E_par < .000165, .00065 + .000165 = .000815 < .001; |F| <= 2|h| + 1.87, ||F||_2 < 3;
     the exponential recipe's own constants (e^{1.13} < 4, (1 + 16(1.13)^21/21!)^32 - 1 < 1e-12).
  C. Lemma scalar-data itself, entry by entry: each computed finite enclosure, widened by its transfer error
     (e_a for a, G, <mv>, R; E_sd for s_v, s_g, s_mv; E_sd + E_par for s_F), lies inside (center - .001,
     center + .001); each endpoint enclosure widened by e_a lies strictly inside eq:scalar-five-enclosures.
  D. Table rcut:tab:scalar-intervals: the four rows of U_0, U_1, 2 sqrt(U_0 U_1) (strict lower bounds) and
     s_F-bar (strict upper bound, with sqrt((z/j) e^{(z^2-j^2)/2}) enclosed by the recipe) recomputed from Table
     scalar-moments at radius .001 by eq:scalar-interval-slacks and eq:scalar-interval-cross; the four printed
     parenthesized coefficients; the a, l ranges of the monotonicity step; the uniform margins .513, .426, .920,
     .930 and the 92/93 absorption; the envelope arithmetic .9709, .9674, .0080, .9789, .9969.
  E. Exact identities the certificate uses: Lambda = .4464 + .25(m - .12)^2; l = .64 - .19a from <m> = <m^2>;
     32/27 - (1-m)(1+m)^2 = (m - 1/3)^2 (m + 5/3); 1.75 - m - (1 - m^2) = (m - 1/2)^2 + 1/2; the sign-averaged g
     equals (1-u)(1.75+u)/(1.75^2-u) and its derivative is 4(64u^2 - 392u - 35)/(16u - 49)^2 < 0 on [0, 1];
     d/da'(a'/(.64 - .19a')) = .64/(.64 - .19a')^2.

WHAT IS NOT DECIDED (theory, not the finite object):
  - the headline (cutoff for every beta < 1, proved in the main sections by a different argument), the appendix
    route's cutoff argument, and Proposition scalar-gap's functional reductions (Young's inequality, the kernel
    remainder lemma, the coherent-form expansion eq:scalar-full-expansion, the rank-two eigenvalue bound);
  - the analytic steps of the certificate: the whole-line trapezoid lemma (rcut:lem:scalar-trapezoid, read, not
    run), the |tanh(u+it)|^2 identity that puts m in the unit disk, the Gaussian edge modulus, holomorphy and decay,
    the error-transfer inequalities as inequalities (their NUMBERS are decided), and the monotonicities in beta
    (the density-ratio argument) that let four temperature intervals cover [.35, .5]. Every number those
    arguments consume is decided here.
"""
import math
import os
import re
import sys
import time
from fractions import Fraction as Fr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add as padd, const, mul, scale, sub as psub, var  # noqa: E402

DIR = 'preprints/Cutoff-throughout-the-high-temperature-Sherrington-Kirkpatrick-phase-September-24-2026/build/'
CERT = DIR + 'appendices/scalar-certificate.tex'
SCAL = DIR + 'appendices/scalar.tex'
INTRO = DIR + 'sections/01-introduction.tex'

S = 10 ** 50                                    # the appendix's scale
FACT = [math.factorial(i) for i in range(40)]
R20 = Fr(4) * Fr(113, 100) ** 21 / FACT[21]     # Taylor remainder of p_20 for |z| < 1.13, since e^1.13 < 4


def D(s):
    return Fr(s)


# ---------------------------------------------------------------- the appendix's directed integer arithmetic
def _ceil(n, d):
    return -((-n) // d)


def _ceil_isqrt(n):
    r = math.isqrt(n)
    return r if r * r == n else r + 1


class Iv:
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi):
        if lo > hi:
            raise ValueError('empty interval')
        self.lo, self.hi = lo, hi

    @staticmethod
    def q(x):
        """a rational input by its lower and upper nearest multiples of 1/S"""
        x = Fr(x)
        return Iv((x.numerator * S) // x.denominator, _ceil(x.numerator * S, x.denominator))

    def _c(self, o):
        return o if isinstance(o, Iv) else Iv.q(o)

    def __add__(self, o):
        o = self._c(o)
        return Iv(self.lo + o.lo, self.hi + o.hi)

    __radd__ = __add__

    def __sub__(self, o):
        o = self._c(o)
        return Iv(self.lo - o.hi, self.hi - o.lo)

    def __rsub__(self, o):
        return self._c(o) - self

    def __neg__(self):
        return Iv(-self.hi, -self.lo)

    def __mul__(self, o):
        o = self._c(o)
        p = (self.lo * o.lo, self.lo * o.hi, self.hi * o.lo, self.hi * o.hi)
        return Iv(min(p) // S, _ceil(max(p), S))

    __rmul__ = __mul__

    def idiv(self, k):
        return Iv(self.lo // k, _ceil(self.hi, k))

    def recip(self):
        if self.lo <= 0 <= self.hi:
            raise ZeroDivisionError('interval contains zero')
        return Iv((S * S) // self.hi, _ceil(S * S, self.lo))

    def __truediv__(self, o):
        return self * self._c(o).recip()

    def __rtruediv__(self, o):
        return self._c(o) * self.recip()

    def sqrt(self):
        if self.lo < 0:
            raise ValueError('square root of a negative interval')
        return Iv(math.isqrt(self.lo * S), _ceil_isqrt(self.hi * S))

    @property
    def flo(self):
        return Fr(self.lo, S)

    @property
    def fhi(self):
        return Fr(self.hi, S)

    def mag(self):
        return max(abs(self.flo), abs(self.fhi))

    def __repr__(self):
        return '[%.10g, %.10g]' % (float(self.flo), float(self.fhi))   # print only


ONE = Iv(S, S)
ZERO = Iv(0, 0)
EXP_ARGS = []


def isum(xs):
    t = ZERO
    for x in xs:
        t = t + x
    return t


def exp_rec(d):
    """e^d for a rational d: p_20(z) with z = d/32, widened by 4(1.13)^21/21!, raised to the 32nd power"""
    d = Fr(d)
    EXP_ARGS.append(abs(d))
    Z = Iv.q(d / 32)
    if Z.mag() >= Fr(113, 100):
        raise ValueError('exponential argument outside the recipe: |d/32| >= 1.13')
    t, p = ONE, ONE
    for i in range(1, 21):
        t = (t * Z).idiv(i)
        p = p + t
    r = _ceil(R20.numerator * S, R20.denominator)
    E = Iv(p.lo - r, p.hi + r)
    if E.lo <= 0:
        raise ValueError('nonpositive exponential enclosure')
    for _ in range(5):
        E = E * E
    return E


def lt(X, c):
    c = Fr(c)
    return 'pass' if X.fhi < c else ('fail' if X.flo >= c else 'open')


def gt(X, c):
    c = Fr(c)
    return 'pass' if X.flo > c else ('fail' if X.fhi <= c else 'open')


def within(X, c, e):
    lo, hi = Fr(c) - Fr(e), Fr(c) + Fr(e)
    if lo <= X.flo and X.fhi <= hi:
        return 'pass'
    return 'fail' if (X.fhi < lo or X.flo > hi) else 'open'


def strictly_inside(X, lo, hi):
    if Fr(lo) < X.flo and X.fhi < Fr(hi):
        return 'pass'
    return 'fail' if (X.fhi <= Fr(lo) or X.flo >= Fr(hi)) else 'open'


def exact(b):
    return 'pass' if b else 'fail'


def worst(sts):
    return 'pass' if all(s == 'pass' for s in sts) else ('fail' if 'fail' in sts else 'open')


def atan_alt(x, terms):
    """arctan x, 0 < x < 1, by `terms` terms of the alternating series: (lo, hi)"""
    s = sum(Fr((-1) ** k) * x ** (2 * k + 1) / (2 * k + 1) for k in range(terms))
    nxt = x ** (2 * terms + 1) / (2 * terms + 1)
    return (s, s + nxt) if terms % 2 == 0 else (s - nxt, s)


def exp_upper_taylor(x, N=30):
    """an upper bound on e^x, 0 <= x < N+2, by the Taylor sum and a geometric tail (independent of the recipe)"""
    x = Fr(x)
    return sum(x ** i / FACT[i] for i in range(N + 1)) + x ** (N + 1) / FACT[N + 1] / (1 - x / (N + 2))


# ---------------------------------------------------------------- reading the published object
def nows(s):
    return re.sub(r'\s+', '', s)


NUMS = r'(\.\d+)' + r'&(\.\d+)' * 8


def parse(src):
    cert, scal = src.text(CERT), src.text(SCAL)
    intro = src.text(INTRO)
    P = {}
    body = cert[cert.index('label{rcut:tab:scalar-finite-values}'):cert.index('\\end{table}', cert.index('label{rcut:tab:scalar-finite-values}'))]
    P['finite'] = [tuple(D(x) for x in m) for m in re.findall(NUMS + r'\\\\', body)]
    m = re.search(r'\\begin\{equation\}\s*(\.\d+),\\quad (\.\d+),\\quad (\.\d+),\\quad (\.\d+),\\quad (\.\d+)\.\s*'
                  r'\\label\{rcut:eq:scalar-five-finite-values\}', cert)
    P['five_finite'] = [D(m.group(i)) for i in range(1, 6)]
    body = scal[scal.index('label{rcut:tab:scalar-moments}'):scal.index('\\end{table}', scal.index('label{rcut:tab:scalar-moments}'))]
    P['moments'] = [tuple(D(x) for x in m) for m in re.findall(NUMS + r'\\\\', body)]
    lo = re.search(r'\\text\{lower bound\}&(\.\d+)&(\.\d+)&(\.\d+)&(\.\d+)&(\.\d+)\\\\', scal)
    hi = re.search(r'\\text\{upper bound\}&(\.\d+)&(\.\d+)&(\.\d+)&(\.\d+)&(\.\d+)', scal)
    P['five_lo'] = [D(lo.group(i)) for i in range(1, 6)]
    P['five_hi'] = [D(hi.group(i)) for i in range(1, 6)]
    P['intervals'] = [(D(m[0]), D(m[1]), tuple(D(x) for x in m[2:])) for m in
                      re.findall(r'\\\(\[(\.\d+),(\.\d+)\]\\\)&(\.\d+)&(\.\d+)&(\.\d+)&(\.\d+)\\\\', scal)]
    m = re.search(r'exceed\s*\\\((\.\d+),(\.\d+),(\.\d+),(\.\d+)\\\)', scal)
    P['paren'] = [D(m.group(i)) for i in range(1, 5)]
    m = re.search(r'respective centers\s*\\\[\s*(\.\d+),\\quad (\.\d+),\\quad (\.\d+),\\quad (\.\d+),\\quad (\.\d+)\.', scal)
    P['env_centers'] = [D(m.group(i)) for i in range(1, 6)]
    return cert, scal, intro, P


STATED = [
    (INTRO, 'The appendices give an independent proof of the cutoff ratio for \\(\\beta<1/2\\), with its own scalar certificate'),
    (CERT, 'On \\(|\\Im x|\\leq1.5\\), we have \\(|\\Im(\\beta x)|\\leq.75<\\pi/4\\).'),
    (CERT, '|m|\\leq1,\\qquad |v|\\leq2,\\qquad |\\Lambda{}|\\geq.14,\\qquad |1.75-m|\\geq.75,\\qquad |2-m|\\geq1.'),
    (CERT, '|F_{a\',G\'}(\\beta x)|\\leq1.5|x|+4.12.'),
    (CERT, 'this is at most \\(1.5|\\Re x|+6.37\\).'),
    (CERT, '\\(e^{1.125}\\varphi(\\Re x-\\beta)\\)'),
    (CERT, 'e^{1.125}\\bigl(1.5\\sqrt{1.25}+6.37\\bigr)^2<260.'),
    (CERT, '\\(e^{1.125}<4\\) and \\(\\sqrt{1.25}<1.12\\)'),
    (CERT, '\\(|g|\\leq8/3\\), \\(|(1+m)v/2-1.5g^2|\\leq38/3\\), and \\(|(1+v)^2/(16\\Lambda{})|\\leq9/(16\\cdot.14)\\).'),
    (CERT, 'Consequently \\(M=1000\\) works simultaneously'),
    (CERT, 'Choose mesh \\(\\Delta=.4\\) and retain \\(|x|\\leq8\\). At the omitted nodes \\(|x|\\geq8.4\\)'),
    (CERT, 'bounded by \\((1.5|x|+4.12)^2\\).'),
    (CERT, '\\frac{.4}{\\sqrt{2\\pi}}(16.72+.6j)^2 e^{-(7.9+.4j)^2/2},\\qquad j=0,1,\\ldots.'),
    (CERT, 'q_*:=e^{-3.24}\\left(\\frac{17.32}{16.72}\\right)^2<.042026.'),
    (CERT, '\\frac{.8(16.72)^2 e^{-31.205}}{\\sqrt{2\\pi}(1-q_*)} <2.612\\cdot10^{-12}.'),
    (CERT, '\\(2000/(e^{7.5\\pi}-1)<1.171\\cdot10^{-7}\\)'),
    (CERT, 'E_{\\mathrm{quad}}:=2.3\\cdot10^{-7}.'),
    (CERT, '\\(3.14159<\\pi<3.14160\\) suffices; it follows, for example, from \\(\\pi=16\\arctan(1/5)-4\\arctan(1/239)\\) and ten terms'),
    (CERT, 'encloses each of these quantities within \\(10^{-6}\\) of the corresponding entry'),
    (CERT, 'within \\(.00065\\) of the center'),
    (CERT, 'deviation above \\(.08\\).'),
    (CERT, 'Fix \\(S=10^{50}\\)'),
    (CERT, 'satisfy \\(|d|\\leq36.125\\).'),
    (CERT, '\\frac{4(1.13)^{21}}{21!},'),
    (CERT, '\\left(1+\\frac{16(1.13)^{21}}{21!}\\right)^{32}-1<10^{-12}.'),
    (CERT, 'because \\(e^{1.13}<4\\)'),
    (CERT, 'E_1=\\frac{5E_{\\mathrm{quad}}}{1-E_{\\mathrm{quad}}},\\qquad E_2=\\frac{17E_{\\mathrm{quad}}}{1-E_{\\mathrm{quad}}}.'),
    (CERT, 'E_{\\mathrm{var}}=E_2+E_1(8+E_1) <1.312\\cdot10^{-5}.'),
    (CERT, 'E_{\\mathrm{sd}}=E_{\\mathrm{var}}/.08 <1.64\\cdot10^{-4}.'),
    (CERT, '|F_{a\',G\'}(h)|\\leq2|h|+1.87,'),
    (CERT, '\\leq2\\sqrt{\\beta^2+\\beta^4}+1.87<3<4.'),
    (CERT, 'e_a:=\\frac{2E_{\\mathrm{quad}}}{1-E_{\\mathrm{quad}}} <4.61\\cdot10^{-7}.'),
    (CERT, '=h-\\frac{.64\\beta^2}{(.64-.19a\')^2}v,'),
    (CERT, '\\(\\tfrac12+\\tfrac14(.64)/(.45)^2\\) and \\(3/4\\)'),
    (CERT, ':=\\left(\\frac12+\\frac{.64}{4(.45)^2}+\\frac34\\right)e_a\\\\ &<10^{-6}.'),
    (CERT, 'E_{\\mathrm{sd}}+E_{\\mathrm{par}} <.000165.'),
    (CERT, '.00065+.000165=.000815<.001'),
    (CERT, 'since \\(1-m^2\\leq1.75-m\\)'),
    (SCAL, '\\Lambda{}=0.4464+0.25(m-0.12)^2\\geq0.4464'),
    (SCAL, 'l=\\langle \\Lambda{}\\rangle=0.64-0.19a.'),
    (SCAL, '\\((1+m)v=(1-m)(1+m)^2\\leq32/27\\) implies \\(\\rho\\leq16/27\\)'),
    (SCAL, '\\frac{(1-u)(1.75+u)}{1.75^2-u}.'),
    (SCAL, '\\(4(64u^2-392u-35)/(16u-49)^2<0\\) for \\(0\\leq u\\leq1\\)'),
    (SCAL, '\\max\\{.45+d(0)+k(0),\\ .70+k(1)+d(1)-d\'(0)\\}+|d\'(0)-.06|.'),
    (SCAL, 'enclosures in Equation~\\eqref{rcut:eq:scalar-five-enclosures} by radius \\(.0003\\) about'),
    (SCAL, 'at most \\(.9709\\) and \\(.9674\\), and the absolute-value term is at most \\(.0080\\).'),
    (SCAL, '\\leq.9789+.018=.9969.'),
    (SCAL, 'on \\(.795\\leq a\\leq.891\\), \\(.45\\leq l\\leq.489\\).'),
    (SCAL, '\\underline U_0={}&l_-+.018+j^2\\left(\\frac{a_-^2}{l_+}-a_--\\frac32G_+^2\\right)-z^2R_z^+,'),
    (SCAL, '\\underline U_1={}&.4644-\\frac{z(s_v)_z^+}{2}+j^2\\langle mv\\rangle_j^--z^2\\left(\\frac32((s_g)_z^+)^2+R_z^+\\right).'),
    (SCAL, '\\sqrt{\\frac zj\\exp\\left(\\frac{z^2-j^2}{2}\\right)}\\biggl[(s_F)_z^++(a_+-a_-)z+2(z^2-j^2)(s_{mv})_z^+'),
    (SCAL, '+\\left(\\frac{z^2a_+}{l_-}-\\frac{j^2a_-}{l_+}\\right)(s_v)_z^++3(z^2G_+-j^2G_-)(s_g)_z^+\\biggr].'),
    (SCAL, 'uniform margins \\(U_0>.513\\), \\(U_1>.426\\), \\(s_F<.920\\), and \\(2\\sqrt{U_0U_1}>.930\\).'),
    (SCAL, '\\leq\\frac{92}{93}\\bigl(U_0A^2+U_1\\|b_0\\|_2^2\\bigr).'),
    (SCAL, 'at most \\(-(.426/93)\\|b\\|_2^2\\)'),
]


# ---------------------------------------------------------------- the finite sums
def finite_sums(beta, five=False):
    beta = Fr(beta)
    b2 = beta * beta
    xs = [Fr(2 * j, 5) for j in range(-20, 21)]
    hs = [beta * x for x in xs]
    c = [exp_rec(-(x - beta) ** 2 / 2) for x in xs]
    E2 = [exp_rec(2 * h) for h in hs]
    y = [(e - 1) / (e + 1) for e in E2]
    V = [1 - yy * yy for yy in y]
    Pv = [v / (Fr(7, 4) - yy) for v, yy in zip(V, y)]
    W = isum(c)

    def N(f):
        return isum(ci * fi for ci, fi in zip(c, f)) / W

    def sd(f):
        m = N(f)
        return (N([fi * fi for fi in f]) - m * m).sqrt()

    aN, GN = N(V), N(Pv)
    cV = Fr(1, 2) - b2 * aN / (D('.64') - D('.19') * aN)
    f = [(v + aN) * h + 2 * b2 * yy * v + cV * v + D('.12') * yy + 3 * b2 * GN * p for v, yy, h, p in zip(V, y, hs, Pv)]
    yV = [yy * v for yy, v in zip(y, V)]
    rho = [v * (1 + yy) * Fr(1, 2) - D('1.5') * p * p for v, yy, p in zip(V, y, Pv)]
    out = [aN, GN, sd(V), sd(Pv), N(yV), N(rho), sd(f), sd(yV)]
    if not five:
        return out
    Lam = [D('.45') + D('.25') * yy * yy - D('.06') * yy for yy in y]
    k0 = N([(1 + v) * (1 + v) / la for v, la in zip(V, Lam)]).idiv(16)
    k1 = N([v * v / la for v, la in zip(V, Lam)]).idiv(16)
    d0 = N([v * v / (2 - yy) for v, yy in zip(V, y)]).idiv(4)
    dp0 = N([v * v / ((2 - yy) * (2 - yy)) for v, yy in zip(V, y)]).idiv(4)
    d1 = N([v * (1 + yy) for v, yy in zip(V, y)]).idiv(4)
    return out, [k0, k1, d0, dp0, d1]


# ---------------------------------------------------------------- the decision
def decide(src=None, finite_patch=None, interval_patch=None, f_const=None):
    t0 = time.time()
    src = src or Sources()
    checks, status = [], []
    EXP_ARGS.clear()

    def add(name, st, detail=''):
        status.append(st)
        check(checks, name, st == 'pass', ('' if st == 'pass' else '[%s] ' % st.upper()) + detail)

    cert, scal, intro, P = parse(src)
    texts = {CERT: nows(cert), SCAL: nows(scal), INTRO: nows(intro)}
    missing = [s for f, s in STATED if nows(s) not in texts[f]]
    add('every bound decided below is printed in the paper as quoted (%d statements)' % len(STATED),
        exact(not missing), '; '.join(missing[:3]))
    finite = [list(r) for r in P['finite']]
    if finite_patch:
        for (i, k), val in finite_patch.items():
            finite[i][k] = Fr(val)
    intervals = [list(r) for r in P['intervals']]
    if interval_patch:
        for (i, k), val in interval_patch.items():
            vals = list(intervals[i][2])
            vals[k] = Fr(val)
            intervals[i][2] = tuple(vals)
    moments = P['moments']
    betas = [r[0] for r in finite]
    add('the published object read: 5 x 8 finite values, 5 endpoint values, 5 x 8 moment centers, 5 + 5 strict '
        'bounds, 4 x 4 interval bounds, 4 parenthesized coefficients',
        exact(len(finite) == 5 and len(moments) == 5 and [r[0] for r in moments] == betas == [D('.35'), D('.4'), D('.445'), D('.475'), D('.5')]
              and len(P['five_finite']) == 5 and len(P['intervals']) == 4 and len(P['paren']) == 4),
        'temperatures %s' % [str(b) for b in betas])

    # ---- A. the finite sums
    computed = {}
    five = None
    for b in betas:
        if b == Fr(1, 2):
            computed[b], five = finite_sums(b, five=True)
        else:
            computed[b] = finite_sums(b)
    add('every exponential argument satisfies |d| <= 36.125 (and so |d/32| < 1.13)',
        exact(max(EXP_ARGS) <= D('36.125') and D('36.125') / 32 < D('1.13')), 'max |d| = %s' % max(EXP_ARGS))
    EXP_ARGS.clear()
    names = ['N(V)', 'N(P)', 'sqrt T(V)', 'sqrt T(P)', 'N(yV)', 'N(rho)', 'sqrt T(f)', 'sqrt T(yV)']
    for k, nm in enumerate(names):
        sts = [within(computed[b][k], finite[i][k + 1], D('1e-6')) for i, b in enumerate(betas)]
        dev = max(abs(float((computed[b][k].flo + computed[b][k].fhi) / 2 - finite[i][k + 1])) for i, b in enumerate(betas))
        add('Table scalar-finite-values column %s: the 5 printed centers within 1e-6' % nm, worst(sts),
            'largest |computed - printed| %.2e; %s' % (dev, [str(betas[i]) for i, s_ in enumerate(sts) if s_ != 'pass']))
    fnames = ['k(0) finite', 'k(1) finite', 'd(0) finite', "d'(0) finite", 'd(1) finite']
    for k, nm in enumerate(fnames):
        add('eq:scalar-five-finite-values: %s within 1e-6 of %s' % (nm, P['five_finite'][k]),
            within(five[k], P['five_finite'][k], D('1e-6')), str(five[k]))
    sts = [within(computed[b][k], moments[i][k + 1], D('.00065')) for i, b in enumerate(betas) for k in range(8)]
    dev = max(abs(float((computed[b][k].flo + computed[b][k].fhi) / 2 - moments[i][k + 1])) for i, b in enumerate(betas) for k in range(8))
    add('every finite quantity within .00065 of its Table scalar-moments center (40 entries)', worst(sts), 'largest %.6f' % dev)
    sts = [gt(computed[b][k], D('.08')) for b in betas for k in (2, 3, 6, 7)]
    add('every finite standard deviation above .08 (20 entries)', worst(sts),
        'smallest lower endpoint %.6f' % float(min(computed[b][k].flo for b in betas for k in (2, 3, 6, 7))))

    # ---- B. the error budget
    p5 = atan_alt(Fr(1, 5), 10)
    p239 = atan_alt(Fr(1, 239), 10)
    pi_lo, pi_hi = 16 * p5[0] - 4 * p239[1], 16 * p5[1] - 4 * p239[0]
    add('pi = 16 arctan(1/5) - 4 arctan(1/239), ten terms each: 3.14159 < pi < 3.14160',
        exact(D('3.14159') < pi_lo and pi_hi < D('3.14160')), '[%.15f, %.15f]' % (float(pi_lo), float(pi_hi)))
    PI = D('3.14159')
    add('|Im(beta x)| <= .5 x 1.5 = .75 < pi/4', exact(Fr(1, 2) * D('1.5') == D('.75') and D('.75') < PI / 4))
    mm = var(0, 1)
    Lam = padd(padd(const(D('.45'), 1), scale(mul(mm, mm), D('.25'))), scale(mm, D('-.06')))
    # roots of Lambda: m^2 - .24m + 1.7856 (times .25); complex pair with |root|^2 = 1.7856 > 1
    disc = D('.24') ** 2 - 4 * D('1.7856')
    cc = var(0, 1)
    re_ = padd(padd(const(D('.2'), 1), scale(mul(cc, cc), D('.5'))), scale(cc, D('-.06')))   # Re Lambda(e^{it}), c = cos t
    im2 = mul(psub(const(1, 1), mul(cc, cc)), mul(padd(scale(cc, D('.5')), const(D('-.06'), 1)), padd(scale(cc, D('.5')), const(D('-.06'), 1))))
    mod2 = padd(mul(re_, re_), im2)
    target = padd(padd(const(D('.0436'), 1), scale(cc, D('-.084'))), scale(mul(cc, cc), D('.45')))
    cmin = D('.084') / (2 * D('.45'))
    minval = D('.0436') - D('.084') * cmin + D('.45') * cmin ** 2
    add('|Lambda| >= .14 for |m| <= 1: Lambda has no zero in the closed disk (disc < 0, |root|^2 = 1.7856 > 1) and on '
        '|m| = 1, |Lambda|^2 = .0436 - .084c + .45c^2 >= %s > .14^2' % minval,
        exact(Lam == {(2,): D('.25'), (1,): D('-.06'), (0,): D('.45')} and disc < 0 and D('1.7856') > 1
              and mod2 == target and minval > D('.14') ** 2 and -1 <= cmin <= 1))
    add('|m| <= 1 gives |v| <= 2, |1.75 - m| >= .75, |2 - m| >= 1, |g| <= 2/.75 = 8/3', exact(1 + 1 == 2 and D('1.75') - 1 == D('.75') and Fr(2) / D('.75') == Fr(8, 3)))
    b = Fr(1, 2)
    c412 = 2 * b * b * 1 * 2 + D('.5') * 2 + D('.12') + 3 * b * b * Fr(8, 3)
    add('|F_{a\',G\'}(beta x)| <= (2+1) .5 |x| + [2 beta^2 1 2 + .5 x 2 + .12 + 3 beta^2 (8/3)] = 1.5|x| + 4.12 at beta <= .5, '
        'using 0 <= beta^2 a\'/l\' <= .25/.45 <= 1', exact(3 * b == D('1.5') and c412 == D('4.12') and b * b / D('.45') <= 1))
    add('edge |x| <= |Re x| + 1.5: 4.12 + 1.5 x 1.5 = 6.37; Gaussian edge factor e^{1.5^2/2} = e^{1.125}',
        exact(D('4.12') + D('1.5') * D('1.5') == D('6.37') and D('1.5') ** 2 / 2 == D('1.125')))
    e1125 = exp_rec(D('1.125'))
    add('e^{1.125} < 4 and sqrt(1.25) < 1.12, so e^{1.125}(1.5 sqrt 1.25 + 6.37)^2 < 4 (1.68 + 6.37)^2 < 260',
        exact(e1125.fhi < 4 and D('1.12') ** 2 > D('1.25') and 4 * (D('1.5') * D('1.12') + D('6.37')) ** 2 < 260),
        'e^1.125 = %s; 4(8.05)^2 = %s' % (e1125, 4 * (D('1.5') * D('1.12') + D('6.37')) ** 2))
    others = [Fr(8, 3), Fr(38, 3), Fr(9) / (16 * D('.14')), Fr(64, 9), Fr(4), Fr(1)]
    add('M = 1000 covers every edge integral: 260 and e^{1.125} x max(8/3, 2 + 1.5(8/3)^2 = 38/3, 9/(16 x .14), (8/3)^2, 4, 1) < 1000',
        exact(Fr(2) + D('1.5') * Fr(8, 3) ** 2 == Fr(38, 3) and 4 * max(others) < 1000 and 260 < 1000))
    add('tail series constants: 1.5 x 8.4 + 4.12 = 16.72, 8.4 - .5 = 7.9, 7.9^2/2 = 31.205, 16.72 + .6 = 17.32, '
        '(8.3^2 - 7.9^2)/2 = 3.24, and (1.5|x|+4.12)^2 dominates (|x| + 1.87)^2 and 38/3',
        exact(D('1.5') * D('8.4') + D('4.12') == D('16.72') and D('8.4') - D('.5') == D('7.9') and D('7.9') ** 2 / 2 == D('31.205')
              and D('16.72') + D('.6') == D('17.32') and (D('8.3') ** 2 - D('7.9') ** 2) / 2 == D('3.24')
              and D('1.5') >= 1 and D('4.12') >= D('1.87') and D('16.72') ** 2 >= Fr(38, 3)))
    qstar = exp_rec(D('-3.24')) * (D('17.32') / D('16.72')) ** 2
    add('q_* = e^{-3.24}(17.32/16.72)^2 < .042026', lt(qstar, D('.042026')), str(qstar))
    s2pi = Iv.q(2 * PI).sqrt()
    tail = (D('.8') * D('16.72') ** 2) * exp_rec(D('-31.205')) / (s2pi * (1 - Iv(qstar.hi, qstar.hi)))
    add('eq:scalar-tail-error: .8(16.72)^2 e^{-31.205}/(sqrt(2 pi)(1 - q_*)) < 2.612e-12', lt(tail, D('2.612e-12')), str(tail))
    whole = 2000 / (exp_rec(D('7.5') * PI) - 1)
    st = lt(whole, D('1.171e-7'))
    add('whole-line error 2M/(e^{2 pi t/Delta} - 1), 2 pi 1.5/.4 = 7.5 pi: 2000/(e^{7.5 pi} - 1) < 1.171e-7 (pi > 3.14159)',
        st if 2 * D('1.5') / D('.4') == D('7.5') else 'fail', str(whole))
    Eq = D('2.3e-7')
    add('E_quad = 2.3e-7 >= 1.171e-7 + 2.612e-12', exact(Eq >= D('1.171e-7') + D('2.612e-12')))
    E1, E2 = 5 * Eq / (1 - Eq), 17 * Eq / (1 - Eq)
    Evar = E2 + E1 * (8 + E1)
    Esd = Evar / D('.08')
    ea = 2 * Eq / (1 - Eq)
    Epar = (Fr(1, 2) + D('.64') / (4 * D('.45') ** 2) + Fr(3, 4)) * ea
    add('E_var = E_2 + E_1(8 + E_1) < 1.312e-5', exact(Evar < D('1.312e-5')), '%.6e' % float(Evar))
    add('E_sd = E_var/.08 < 1.64e-4', exact(Esd < D('1.64e-4')), '%.6e' % float(Esd))
    add('e_a = 2E_quad/(1 - E_quad) < 4.61e-7', exact(ea < D('4.61e-7')), '%.6e' % float(ea))
    add('E_par = (1/2 + .64/(4 .45^2) + 3/4) e_a < 1e-6, with .64/(4 .45^2) = (1/4)(.64)/(.45)^2', exact(Epar < D('1e-6')), '%.6e' % float(Epar))
    add('E_sd + E_par < .000165 and .00065 + .000165 = .000815 < .001',
        exact(Esd + Epar < D('.000165') and D('.00065') + D('.000165') == D('.000815') < D('.001')), '%.6e' % float(Esd + Epar))
    add('|F| <= 2|h| + 1.87 on the real line (.5 + .5 + .12 + .75) and ||F||_2 <= 2 sqrt(.25 + .0625) + 1.87 < 3',
        exact(D('.5') + D('.5') + D('.12') + D('.75') == D('1.87') and (Fr(3) - D('1.87')) ** 2 > 4 * (D('.25') + D('.0625'))))
    e113 = exp_upper_taylor(D('1.13'))
    rel = (1 + 16 * Fr(113, 100) ** 21 / FACT[21]) ** 32 - 1
    add('the exponential recipe: e^{1.13} < 4 (Taylor upper bound %.6f), 36.125/32 < 1.13, (1 + 16(1.13)^21/21!)^32 - 1 < 1e-12'
        % float(e113), exact(e113 < 4 and rel < D('1e-12')), '%.3e' % float(rel))

    # ---- C. Lemma scalar-data, entry by entry
    transfer = [ea, ea, Esd, Esd, ea, ea, Esd + Epar, Esd]
    sts = []
    for i, bb in enumerate(betas):
        for k in range(8):
            X = computed[bb][k]
            e = transfer[k]
            sts.append(strictly_inside(Iv(X.lo, X.hi) + Iv(-_ceil(e.numerator * S, e.denominator), _ceil(e.numerator * S, e.denominator)),
                                       moments[i][k + 1] - D('.001'), moments[i][k + 1] + D('.001')))
    add('Lemma scalar-data: every computed finite enclosure, widened by its transfer error, lies within .001 of its '
        'Table scalar-moments center (40 entries)', worst(sts))
    for k, nm in enumerate(['k(0)', 'k(1)', 'd(0)', "d'(0)", 'd(1)']):
        X = five[k]
        r = _ceil(ea.numerator * S, ea.denominator)
        add('eq:scalar-five-enclosures: %s in (%s, %s), strictly, after the e_a transfer' % (nm, P['five_lo'][k], P['five_hi'][k]),
            strictly_inside(Iv(X.lo - r, X.hi + r), P['five_lo'][k], P['five_hi'][k]), str(X))
    add('the five scaled endpoint integrands are bounded by one on the real line: (1+V)^2/(16 Lambda) <= 4/(16 x .4464), '
        'V^2/(16 Lambda), V^2/(4(2-y)), V^2/(4(2-y)^2) <= 1/4, V(1+y)/4 <= (32/27)/4',
        exact(Fr(4) / (16 * D('.4464')) <= 1 and Fr(32, 27) / 4 <= 1))

    # ---- D. Table scalar-intervals and the envelope arithmetic
    M = {r[0]: r[1:] for r in moments}       # a, G, s_v, s_g, <mv>, R, s_F, s_mv
    rad = D('.001')
    paren_ok, rng_ok, margins = [], [], []
    for row, (j, z, printed) in enumerate(intervals):
        Mj, Mz = M[j], M[z]
        a_m, a_p = Mz[0] - rad, Mj[0] + rad
        G_m, G_p = Mz[1] - rad, Mj[1] + rad
        l_m, l_p = D('.64') - D('.19') * a_p, D('.64') - D('.19') * a_m
        paren = a_m ** 2 / l_p - a_m - Fr(3, 2) * G_p ** 2
        U0 = l_m + D('.018') + j * j * paren - z * z * (Mz[5] + rad)
        U1 = D('.4644') - z * (Mz[2] + rad) / 2 + j * j * (Mj[4] - rad) - z * z * (Fr(3, 2) * (Mz[3] + rad) ** 2 + Mz[5] + rad)
        br = ((Mz[6] + rad) + (a_p - a_m) * z + 2 * (z * z - j * j) * (Mz[7] + rad)
              + (z * z * a_p / l_m - j * j * a_m / l_p) * (Mz[2] + rad) + 3 * (z * z * G_p - j * j * G_m) * (Mz[3] + rad))
        fac = (Iv.q(z / j) * exp_rec((z * z - j * j) / 2)).sqrt()
        sF = fac * br
        p0, p1, p2, p3 = printed
        add('Table scalar-intervals [%s, %s]: U_0 = %.7f > %s' % (j, z, float(U0), p0), exact(U0 > p0))
        add('Table scalar-intervals [%s, %s]: U_1 = %.7f > %s' % (j, z, float(U1), p1), exact(U1 > p1))
        add('Table scalar-intervals [%s, %s]: 2 sqrt(U_0 U_1) > %s (4 U_0 U_1 > %s^2)' % (j, z, p2, p2),
            exact(U0 > 0 and U1 > 0 and 4 * U0 * U1 > p2 ** 2), '2 sqrt = %.7f' % (2 * math.sqrt(float(U0 * U1))))
        add('Table scalar-intervals [%s, %s]: s_F-bar < %s' % (j, z, p3), lt(sF, p3), str(sF))
        paren_ok.append(paren > P['paren'][row])
        rng_ok.append(all(D('.795') <= x <= D('.891') for x in (a_m, a_p)) and all(D('.45') <= x <= D('.489') for x in (l_m, l_p))
                      and 2 * min(a_m, a_p) > max(l_m, l_p))
        margins.append((U0, U1, sF.fhi))
    add('the parenthesized coefficients a_-^2/l_+ - a_- - 1.5 G_+^2 exceed the printed .229787, .152558, .111290, .074675',
        exact(all(paren_ok)))
    add('the monotonicity step applies: every a_+-, l_+- in [.795, .891], [.45, .489], where 2a > l (so a^2/l - a increases in a)',
        exact(all(rng_ok)))
    pr = [r[2] for r in intervals]
    add('uniform margins from the printed table: U_0 > .513, U_1 > .426, s_F < .920, 2 sqrt(U_0 U_1) > .930',
        exact(min(p[0] for p in pr) > D('.513') and min(p[1] for p in pr) > D('.426') and max(p[3] for p in pr) < D('.920')
              and min(p[2] for p in pr) > D('.930')))
    add('the absorption: .920 = (92/93) .930, and -(1/93)(U_0 A^2 + U_1 |b_0|^2) <= -(.426/93)|b|^2 since .513 > .426',
        exact(D('.920') == Fr(92, 93) * D('.930') and D('.513') > D('.426')))
    cen = P['env_centers']
    add('the radius-.0003 boxes about .4277, .0899, .0926, .0523, .2289 contain the five strict enclosures',
        exact(all(cen[k] - D('.0003') <= P['five_lo'][k] and P['five_hi'][k] <= cen[k] + D('.0003') for k in range(5))))
    k0, k1, d0, dp0, d1 = (x + D('.0003') for x in cen)
    m1 = D('.45') + d0 + k0
    m2 = D('.70') + k1 + d1 - (cen[3] - D('.0003'))
    ab = max(abs(cen[3] - D('.0003') - D('.06')), abs(cen[3] + D('.0003') - D('.06')))
    add('envelope arithmetic: .45 + d(0) + k(0) <= .9709, .70 + k(1) + d(1) - d\'(0) <= .9674, |d\'(0) - .06| <= .0080, '
        'sum .9789, + .018 = .9969',
        exact(m1 <= D('.9709') and m2 <= D('.9674') and ab <= D('.0080') and D('.9709') + D('.0080') == D('.9789')
              and D('.9789') + D('.018') == D('.9969')), '%s, %s, %s' % (m1, m2, ab))

    # ---- E. exact identities
    m = var(0, 1)
    one = const(1, 1)
    lam2 = padd(const(D('.4464'), 1), scale(mul(padd(m, const(D('-.12'), 1)), padd(m, const(D('-.12'), 1))), D('.25')))
    add('Lambda = .45 + .25m^2 - .06m = .4464 + .25(m - .12)^2', exact(lam2 == Lam))
    # <Lambda> = .45 + .25<m^2> - .06<m> with <m> = <m^2> = 1 - a
    add('l = <Lambda> = .45 + (.25 - .06)(1 - a) = .64 - .19a', exact(D('.45') + (D('.25') - D('.06')) == D('.64') and D('.25') - D('.06') == D('.19')))
    lhs = psub(const(Fr(32, 27), 1), mul(psub(one, m), mul(padd(one, m), padd(one, m))))
    rhs = mul(mul(padd(m, const(Fr(-1, 3), 1)), padd(m, const(Fr(-1, 3), 1))), padd(m, const(Fr(5, 3), 1)))
    add('32/27 - (1-m)(1+m)^2 = (m - 1/3)^2 (m + 5/3) >= 0 on [-1, 1], so (1+m)v <= 32/27 and rho <= 16/27', exact(lhs == rhs))
    g1 = psub(psub(const(D('1.75'), 1), m), psub(one, mul(m, m)))
    g2 = padd(mul(padd(m, const(Fr(-1, 2), 1)), padd(m, const(Fr(-1, 2), 1))), const(Fr(1, 2), 1))
    add('1.75 - m - (1 - m^2) = (m - 1/2)^2 + 1/2 > 0, so g = v/(1.75 - m) is in [0, 1]', exact(g1 == g2))
    s_ = var(0, 1)      # s = tanh|h|, u = s^2; the sign + has probability (1 + s)/2
    u_ = mul(s_, s_)
    c175 = const(D('1.75'), 1)
    # (1-u)[(1+s)/(2(1.75-s)) + (1-s)/(2(1.75+s))] (1.75^2 - u)  ==  (1-u)(1.75+u)  (both sides times the denominators)
    left = mul(psub(one, u_), padd(mul(padd(one, s_), padd(c175, s_)), mul(psub(one, s_), psub(c175, s_))))
    right = scale(mul(psub(one, u_), padd(c175, u_)), 2)
    add('averaging g over the sign gives (1-u)(1.75+u)/(1.75^2-u), u = tanh^2|h| (cross-multiplied identity in s = tanh|h|)',
        exact(left == right))
    u = var(0, 1)
    Nn = mul(psub(one, u), padd(c175, u))
    Dd = psub(const(D('1.75') ** 2, 1), u)
    dN = {(1,): Fr(-2), (0,): Fr(1) - D('1.75')}       # d/du (1-u)(1.75+u) = -.75 - 2u
    num = psub(mul(dN, Dd), mul(Nn, const(-1, 1)))
    q = padd(scale(u, 16), const(-49, 1))
    paper = scale(padd(padd(scale(mul(u, u), 64), scale(u, -392)), const(-35, 1)), 4)
    add('d/du (1-u)(1.75+u)/(1.75^2-u) = 4(64u^2 - 392u - 35)/(16u - 49)^2, and 64u^2 - 392u - 35 < 0 on [0, 1] '
        '(convex; -35 and -363 at the ends)',
        exact(mul(num, mul(q, q)) == mul(paper, mul(Dd, Dd)) and -35 < 0 and 64 - 392 - 35 < 0))
    add('d/da\' [a\'/(.64 - .19a\')] = ((.64 - .19a\') + .19a\')/(.64 - .19a\')^2 = .64/(.64 - .19a\')^2', exact(D('.64') - D('.19') + D('.19') == D('.64')))

    ok = all(x == 'pass' for x in status)
    verdict = 'CERTIFIED' if ok else ('REFUTED' if 'fail' in status else 'REFUSED')
    value = {'finite_at_beta': {str(bb): [str(x) for x in computed[bb]] for bb in betas},
             'five_endpoint': [str(x) for x in five], 'E_var': '%.6e' % float(Evar), 'E_sd': '%.6e' % float(Esd),
             'e_a': '%.6e' % float(ea), 'E_par': '%.6e' % float(Epar), 'tail': str(tail), 'whole_line': str(whole),
             'interval_rows': [('%.7f' % float(u0), '%.7f' % float(u1), '%.7f' % float(sf)) for u0, u1, sf in margins],
             'scale': 'S = 10^50', 'runtime_s': round(time.time() - t0, 2)}
    return {'verdict': verdict, 'value': value, 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: Lemma rcut:lem:scalar-data and Table rcut:tab:scalar-intervals of the appendix '
                       'route (the independent beta < 1/2 proof) - the 205 quadrature terms, every finite enclosure, the '
                       'whole error budget and every interval bound recomputed by the appendix\'s directed integer recipe; '
                       'the trapezoid lemma, strip holomorphy and beta-monotonicity are read, not run, and the cutoff '
                       'headline (all beta < 1) is proved elsewhere in the paper by a different argument'}


def forge():
    """each must NOT certify"""
    out = []
    r = decide(finite_patch={(1, 1): D('.860658')})
    out.append(('Table scalar-finite-values: N(V) at beta = .4 printed .860648 -> .860658 (moved 1e-5, radius 1e-6)', r['verdict']))
    r = decide(interval_patch={(0, 0): D('.523818')})
    out.append(('Table scalar-intervals: U_0 on [.350, .400] printed .513818 -> .523818 (not a lower bound)', r['verdict']))
    r = decide(interval_patch={(3, 3): D('.904504')})
    out.append(('Table scalar-intervals: s_F-bar on [.475, .500] printed .914504 -> .904504 (not an upper bound)', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides')}, indent=1))
    print(json.dumps(res['value'], indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t))
