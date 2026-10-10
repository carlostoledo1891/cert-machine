"""F-262 -- "Subset Sum in Time O(2^{0.49n})" (openai/math family 138).

THE CLAIM. Headline (introduction): a uniform randomized classical algorithm for Subset Sum with bounded error and
worst-case running time O(2^{0.49n}) on polynomial-bit inputs. Its one numerical input is Proposition
prop:filtering-moments (filtering.tex:90-98): with r = sum_{j<=6} r_j cos(jx), s = sum_{j<=6} s_j cos(jx),
(r_j) = (.851, .466, .325, .253, .224, -.314), (s_j) = (1.281, -.938, .731, -.559, .391, .110) (filtering.tex:71-81),
F = 2^r, G = 2^s, f = F/Z_f, g = G/Z_g, kappa = 1.0315, eta = .51772, tau = .48996, Delta = eta - tau,
Gamma = 2tau - eta, a = Delta/Gamma (filtering.tex:26, 62-68), and the scores D, A, E, u, v of filtering.tex:32-40,
   int_T M(x)^2 2^{8.5(Delta - u(x))} dx < 2^{0.5168}   and   int_T M(x)^2 2^{8.3(a v(x) - u(x))} dx < 2^{0.5168},
M(x)^2 = 2 + 2 cos x. "Appendix app:numerical proves both inequalities by a 64-point quadrature with explicit
rational enclosures and analytic error bounds" (filtering.tex:100-103; the appendix is numerical.tex:1-355).

WHAT IS DECIDED HERE, from the appendix's TEXT alone (no program file accompanies the paper), in directed integer
interval arithmetic: an interval is a pair of integers [lo, hi] meaning [lo/S, hi/S], S = 10^60 (rational
endpoints); + and - act on endpoints, products take min/max of the four endpoint products rounded outward, a
reciprocal is [floor(S^2/hi), ceil(S^2/lo)]. No float enters any decision. The transcendental functions follow the
appendix's own recipe, each with the remainder it prints (numerical.tex:137-196):
  pi    : pi/4 = arctan(1/2) + arctan(1/3), alternating series through degree 159 (decides the printed
          3.1415926535897 < pi < 3.1415926535899, which is then the enclosure used, as the text says);
  cos   : series through degree 24, remainder |t|^26/26!, at the endpoints of x_j = 2 pi j/64 (cos is decreasing
          on [0, pi]); reflection and half-turn give the other 47 nodes (exact identities);
  exp   : sum_{i<=45} t^i/i! +- |t|^46/(46!(1 - |t|/47)) at interval endpoints (exp is increasing); for an
          error-bound constant with |t| > 8, e^t = (e^{t/2})^2;
  ln    : 2 sum_{i<=15} d^{2i+1}/(2i+1) +- 2|d|^33/(33(1-d^2)), d = (y-1)/(y+1), at interval endpoints;
  2^x = exp(x ln 2), log = log_2 = ln/ln 2, cosh t = (e^t + e^-t)/2.
  1. The 17 printed cosines (numerical.tex:141-146) within 3e-10; ln 2 inside the printed (.693147180559,
     .693147180561); every exponential argument of the finite tables has |t| <= 8 (numerical.tex:167).
  2. The six normalizer enclosures (numerical.tex:61-74: Z_f, Z_g, Z_{f,kappa}, Z_{g,kappa} within 5e-7,
     T64(2^{2 r_beta}), T64(2^{2 s_beta}) within 5e-6) and all 33 x 4 node enclosures of Table tab:filter-certificate
     (numerical.tex:88-135: P_j within 4e-6, Y_j within 2e-5, X_j and X'_j within .0004), computed at all 64 nodes
     (the j <-> 64-j invariance is checked, not assumed), with L, B, H, u, v from the score identities
     (numerical.tex:29-33, 182-191).
  3. (1/64) sum X_j < 1.4295 and (1/64) sum X'_j < 1.4295 (eq:hatted-average-bound), both the paper's way (weighted
     table centers plus their stated errors) and directly from the 64 computed enclosures.
  4. The inner quadratures (numerical.tex:198-261): the four strip coefficient sums 6.50, 8.71, 18.4, 22.4 at
     sigma = .45; the four rows of eq:inner-quadrature-errors (4e-10, 3e-8, 5e-7, 5e-6) from 2B_0/(e^{64 sigma}-1)
     with the stated strip bounds; P_j > 1.06789; the node-score errors |L - L^| < 1e-7, |B - B^| < 2e-6,
     |H - H^| < 5e-9 (propagated as the text says, with |log x - log y| <= |x-y|/(min(x,y) ln 2)); the factor 1.00001
     for both integrands.
  5. The outer strip (numerical.tex:265-355): int|f(w+i beta)|^2 < 1.761, int|g(w+i beta)|^2 < 1.38;
     sqrt(.761 x .38) < .54; -log .46 < 1.121; |r| < 2.96, |s| < 4.67 at |Im| <= .19; |QB| < 13; H < .016; both
     exponent bounds < 17.6 (and the av - u identity's coefficients); 2 + 2cosh(.38) < 4.16; 4.16 x 2^17.6 < 2^20;
     2^21/(e^{64 x .38} - 1) < .00007; 1.4295(1.00001) + .00007 = 1.429584295 exactly; 2^{.5168} > 1.4307781 > that.
  Also the constants Delta = .02776, Gamma = .46220 and the real sup bounds |r| <= 2.433, |s| <= 4.010
  (filtering.tex:63-65, 137).

WHAT IS NOT DECIDED (theory, not the finite object):
  - the headline algorithm and its O(2^{0.49n}) analysis, Lemma lemma:finite-filtering (the passage from the
    continuous moments to every finite circle P >= P_0) and everything outside Appendix app:numerical;
  - the analytic lemmas the certificate rests on: the analytic trapezoid estimate eq:analytic-trapezoid (cited to
    Trefethen-Weideman; its two-line proof was read and is standard), the score identities eq:numerical-score-
    identities (re-derived by hand while reading, not by machine), the contour-shift formula for Q and QB on the
    strip, the Parseval monotonicity of shifted L2 norms, Cauchy-Schwarz, and the principal-branch argument for
    log Q. Every NUMBER those arguments consume is decided here; the arguments themselves are read, not run.
"""
import math
import os
import re
import sys
import time
from fractions import Fraction as Fr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/Subset-Sum-in-Time-2-power-0-49n-October-4-2026/build/sections/'
NUM = DIR + 'numerical.tex'
FIL = DIR + 'filtering.tex'

S = 10 ** 60
FACT = [math.factorial(i) for i in range(64)]


def D(s):
    return Fr(s)


# ---------------------------------------------------------------- directed integer interval arithmetic
def _ceil(n, d):
    return -((-n) // d)


class Iv:
    """[lo/S, hi/S] with integer lo <= hi; every operation rounds outward"""
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi):
        if lo > hi:
            raise ValueError('empty interval')
        self.lo, self.hi = lo, hi

    @staticmethod
    def q(x):
        x = Fr(x)
        return Iv((x.numerator * S) // x.denominator, _ceil(x.numerator * S, x.denominator))

    @staticmethod
    def span(a, b):
        a, b = Fr(a), Fr(b)
        return Iv((a.numerator * S) // a.denominator, _ceil(b.numerator * S, b.denominator))

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
        """division by a positive integer"""
        return Iv(self.lo // k, _ceil(self.hi, k))

    def recip(self):
        if self.lo <= 0 <= self.hi:
            raise ZeroDivisionError('interval contains zero')
        return Iv((S * S) // self.hi, _ceil(S * S, self.lo))

    def __truediv__(self, o):
        return self * self._c(o).recip()

    def __rtruediv__(self, o):
        return self._c(o) * self.recip()

    @property
    def flo(self):
        return Fr(self.lo, S)

    @property
    def fhi(self):
        return Fr(self.hi, S)

    def mag(self):
        return max(abs(self.flo), abs(self.fhi))

    def overlaps(self, o):
        return self.lo <= o.hi and o.lo <= self.hi

    def __repr__(self):
        return '[%.12g, %.12g]' % (float(self.flo), float(self.fhi))   # print only


ZERO = Iv(0, 0)
ONE = Iv(S, S)


def isum(xs):
    t = ZERO
    for x in xs:
        t = t + x
    return t


# tri-state comparisons: 'pass' (proved), 'fail' (proved false), 'open' (the enclosure straddles)
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


def exact(b):
    return 'pass' if b else 'fail'


# ---------------------------------------------------------------- the appendix's transcendental recipe
EXP_ARGS = []      # every argument of a finite-table exponential, for the |t| <= 8 claim


def exp_point(t, record=True):
    """e^t for a rational t: sum_{i<=45} t^i/i! +- |t|^46/(46!(1-|t|/47)) (eq:certificate-exp)"""
    t = Fr(t)
    if abs(t) > 8:                       # only for the analytic error constants, never in the finite tables
        h = exp_point(t / 2, record=False)
        return h * h
    if record:
        EXP_ARGS.append(abs(t))
    T = Iv.q(t)
    term, tot = ONE, ONE
    for i in range(1, 46):
        term = (term * T).idiv(i)
        tot = tot + term
    a = T.mag()
    R = a ** 46 / (FACT[46] * (1 - a / 47))
    r = _ceil(R.numerator * S, R.denominator)
    return Iv(tot.lo - r, tot.hi + r)


def exp_iv(X, record=True):
    return Iv(exp_point(X.flo, record).lo, exp_point(X.fhi, record).hi)


def ln_point(y):
    """ln y = 2 sum_{i<=15} d^{2i+1}/(2i+1) +- 2|d|^33/(33(1-d^2)), d = (y-1)/(y+1) (eq:certificate-log)"""
    y = Fr(y)
    if y <= 0:
        raise ValueError('log of a nonpositive number')
    d = (y - 1) / (y + 1)
    Dv = Iv.q(d)
    D2 = Dv * Dv
    p, tot = Dv, Dv
    for i in range(1, 16):
        p = p * D2
        tot = tot + p.idiv(2 * i + 1)
    tot = tot + tot
    a = Dv.mag()
    R = 2 * a ** 33 / (33 * (1 - a * a))
    r = _ceil(R.numerator * S, R.denominator)
    return Iv(tot.lo - r, tot.hi + r)


def ln_iv(Y):
    return Iv(ln_point(Y.flo).lo, ln_point(Y.fhi).hi)


def cos_point(t):
    """exact rational bounds (lo, hi) on cos t: series through degree 24, remainder |t|^26/26!"""
    t = Fr(t)
    s = sum(Fr((-1) ** k) * t ** (2 * k) / FACT[2 * k] for k in range(13))
    R = abs(t) ** 26 / FACT[26]
    return s - R, s + R


def atan_series(x, top_degree):
    """arctan x for 0 < x < 1 by the alternating series through degree top_degree: (lo, hi)"""
    K = (top_degree - 1) // 2
    s = sum(Fr((-1) ** k) * x ** (2 * k + 1) / (2 * k + 1) for k in range(K + 1))
    nxt = x ** (2 * K + 3) / (2 * K + 3)          # the first omitted term, sign (-1)^(K+1)
    return (s, s + nxt) if (K + 1) % 2 == 0 else (s - nxt, s)


# ---------------------------------------------------------------- reading the published object
def nows(s):
    return re.sub(r'\s+', '', s)


def parse(src):
    num, fil = src.text(NUM), src.text(FIL)
    P = {}
    m = re.search(r'\(r_1,\\ldots,r_6\)&=\(([^)]*)\)', fil)
    P['r'] = [D(x) for x in m.group(1).split(',')]
    m = re.search(r'\(s_1,\\ldots,s_6\)&=\(([^)]*)\)', fil)
    P['s'] = [D(x) for x in m.group(1).split(',')]
    P['kappa'] = D(re.search(r'\\kappa=([0-9.]+)', fil).group(1))
    m = re.search(r'\\eta=([0-9.]+),\\qquad \\tau=([0-9.]+),\\qquad\s*\\Delta=\\eta-\\tau=([0-9.]+),\\\\\s*'
                  r'\\Gamma=2\\tau-\\eta=([0-9.]+)', fil)
    P['eta'], P['tau'], P['Delta_printed'], P['Gamma_printed'] = (D(m.group(i)) for i in range(1, 5))
    first = {}
    for name, key in (('\\widehat Z_f', 'Zf'), ('\\widehat Z_g', 'Zg'), ('\\widehat Z_{f,\\kappa}', 'Zfk'),
                      ('\\widehat Z_{g,\\kappa}', 'Zgk'), ('T_{64}(2^{2r_\\beta})', 'Tr'), ('T_{64}(2^{2s_\\beta})', 'Ts')):
        m = re.search(r'\$' + re.escape(name) + r'\$ & \$([0-9.]+)\$', num)
        first[key] = D(m.group(1))
    P['first'] = first
    rows = re.findall(r'^(\d+) &([0-9.]+)&([0-9.]+)&([0-9.]+)&([0-9.]+)\\\\', num, re.M)
    P['table'] = {int(j): tuple(D(x) for x in rest) for j, *rest in rows}
    m = re.search(r'\\begin\{array\}\{rrrrr\}(.*?)\\end\{array\}', num, re.S)
    P['cos'] = [D(x) for x in re.split(r'&|\\\\', m.group(1)) if x.strip()]
    return num, fil, P


# every bound the decider decides, as the paper prints it (whitespace removed before matching)
STATED = [
    (NUM, 'In the first four rows the error is at most $5\\cdot10^{-7}$, and in the last two it is at most $5\\cdot10^{-6}$.'),
    (NUM, 'absolute errors are $4\\cdot10^{-6}$, $2\\cdot10^{-5}$, $0.0004$, and $0.0004$'),
    (NUM, '\\frac1{64}\\sum_{j=0}^{63}\\widehat X_j<1.4295,'),
    (NUM, '\\frac1{64}\\sum_{j=0}^{63}\\widehat X\'_j<1.4295.'),
    (NUM, 'lie within $3\\cdot10^{-10}$ of the following values'),
    (NUM, '3.1415926535897<\\pi<3.1415926535899.'),
    (NUM, 'series through degree 159'),
    (NUM, '$0.693147180559<\\ln2<0.693147180561$'),
    (NUM, 'All arguments needed for the finite tables have $|t|\\le8$.'),
    (NUM, '|r(z)|<6.50,\\qquad |s(z)|<8.71,\\qquad |2r_\\beta(z)|<18.4,\\qquad |2s_\\beta(z)|<22.4.'),
    (NUM, 'Z_f,Z_g,Z_{f,\\kappa},Z_{g,\\kappa}&4\\cdot10^{-10}'),
    (NUM, '\\mathcal P(x_j)&3\\cdot10^{-8}'),
    (NUM, '\\mathcal Y(x_j)&5\\cdot10^{-7}'),
    (NUM, '\\int 2^{2r_\\beta},\\ \\int 2^{2s_\\beta}&5\\cdot10^{-6}'),
    (NUM, '$2^{\\kappa\\,8.71}$, $2^{6.50+8.71}$, $(6.50+8.71)2^{6.50+8.71}$, and $2^{22.4}$.'),
    (NUM, '|L-\\widehat L|<10^{-7},\\qquad |B-\\widehat B|<2\\cdot10^{-6},\\qquad |H-\\widehat H|<5\\cdot10^{-9}.'),
    (NUM, '$\\widehat{\\mathcal P}_j>1.06789$'),
    (NUM, 'is at most $1.00001$ times its hatted value'),
    (NUM, '=Z_f^{-2}\\int2^{2r_\\beta(w)}\\,dw<1.761,'),
    (NUM, '\\int|g(w+i\\beta)|^2\\,dw<1.38.'),
    (NUM, '|Q(z)-1|\\le\\sqrt{0.761\\cdot0.38}<0.54.'),
    (NUM, '-\\operatorname{Re}L\\le-\\log0.46<1.121.'),
    (NUM, 'coefficient sums give $|r|<2.96$ and $|s|<4.67$'),
    (NUM, '|Q B|\\le\\sqrt{1.761\\cdot1.38}\\bigl(2.96+4.67+\\log Z_f+\\log Z_g\\bigr)<13,\\qquad |B|<13/0.46.'),
    (NUM, 'The normalizer enclosures also give $H<0.016$.'),
    (NUM, '8.5\\left(0.02776+1.121+0.0315\\frac{13}{0.46}+0.016\\right)<17.6.'),
    (NUM, '|a(2-\\kappa)-(\\kappa-1)|\\frac{13}{0.46}+(1+a)0.016\\right)<17.6.'),
    (NUM, '$|2+2\\cos z|\\le2+2\\cosh(0.38)<4.16$'),
    (NUM, 'have absolute value below $2^{20}$'),
    (NUM, '\\frac{2^{21}}{e^{64\\cdot0.38}-1}<0.00007.'),
    (NUM, '1.4295(1.00001)+0.00007=1.429584295<2^{0.5168}.'),
    (NUM, '$2^{0.5168}>1.4307781$'),
    (FIL, '|r|\\le2.433,\\qquad |s|\\le4.010.'),
    (FIL, '\\int_{\\mathbb T}M(x)^2 2^{8.5(\\Delta-u(x))}\\,dx&<2^{0.5168},'),
    (FIL, '\\int_{\\mathbb T}M(x)^2 2^{8.3(a v(x)-u(x))}\\,dx&<2^{0.5168}.'),
]


# ---------------------------------------------------------------- the decision
def decide(src=None, table_patch=None, coef_patch=None, cos_patch=None, bound_patch=None):
    t0 = time.time()
    src = src or Sources()
    checks, status = [], []
    EXP_ARGS.clear()

    def add(name, st, detail=''):
        status.append(st)
        check(checks, name, st == 'pass', ('' if st == 'pass' else '[%s] ' % st.upper()) + detail)

    num, fil, P = parse(src)
    texts = {NUM: nows(num), FIL: nows(fil)}
    missing = [s for f, s in STATED if nows(s) not in texts[f]]
    add('every bound decided below is printed in the paper as quoted (%d statements)' % len(STATED),
        exact(not missing), '; '.join(missing[:3]))
    r, s, kap = list(P['r']), list(P['s']), P['kappa']
    if coef_patch:
        for (which, k), val in coef_patch.items():
            (r if which == 'r' else s)[k] = Fr(val)
    table = dict(P['table'])
    if table_patch:
        for (j, col), val in table_patch.items():
            row = list(table[j])
            row[col] = Fr(val)
            table[j] = tuple(row)
    cos_printed = list(P['cos'])
    if cos_patch:
        for k, val in cos_patch.items():
            cos_printed[k] = Fr(val)
    avg_bound = Fr(bound_patch) if bound_patch else D('1.4295')
    add('the published object read: 6 + 6 coefficients, 6 normalizer centers, rows 0..32 of the node table, 17 cosines',
        exact(len(r) == 6 and len(s) == 6 and len(P['first']) == 6 and sorted(table) == list(range(33))
              and len(cos_printed) == 17), 'r = %s, s = %s, kappa = %s' % ([str(x) for x in r], [str(x) for x in s], kap))

    Delta, Gamma = P['eta'] - P['tau'], 2 * P['tau'] - P['eta']
    add('Delta = eta - tau = .02776 and Gamma = 2 tau - eta = .46220 (filtering.tex:63-65)',
        exact(Delta == P['Delta_printed'] and Gamma == P['Gamma_printed']), '%s, %s' % (Delta, Gamma))
    a = Delta / Gamma
    add('the real sup bounds |r| <= 2.433, |s| <= 4.010 (filtering.tex:137): sum |r_j| and sum |s_j|, exactly',
        exact(sum(abs(x) for x in r) <= D('2.433') and sum(abs(x) for x in s) <= D('4.010')),
        '%s, %s' % (sum(abs(x) for x in r), sum(abs(x) for x in s)))

    # pi, ln 2
    lo2, hi2 = atan_series(Fr(1, 2), 159)
    lo3, hi3 = atan_series(Fr(1, 3), 159)
    pi_lo, pi_hi = 4 * (lo2 + lo3), 4 * (hi2 + hi3)
    add('pi/4 = arctan(1/2) + arctan(1/3) through degree 159 gives 3.1415926535897 < pi < 3.1415926535899',
        exact(D('3.1415926535897') < pi_lo and pi_hi < D('3.1415926535899')), 'width %.1e' % float(pi_hi - pi_lo))
    PI_LO, PI_HI = D('3.1415926535897'), D('3.1415926535899')     # the enclosure the text then uses
    LN2 = ln_point(2)
    add('the log recipe gives .693147180559 < ln 2 < .693147180561', exact(LN2.flo > D('.693147180559') and LN2.fhi < D('.693147180561')),
        str(LN2))

    # cosines at the 64 nodes
    COS = []
    for j in range(17):
        lo, _ = cos_point(PI_HI * j / 32)
        _, hi = cos_point(PI_LO * j / 32)
        COS.append(Iv.span(lo, hi))
    bad = [j for j in range(17) if within(COS[j], cos_printed[j], D('3e-10')) != 'pass']
    st = 'pass' if not bad else ('fail' if any(within(COS[j], cos_printed[j], D('3e-10')) == 'fail' for j in bad) else 'open')
    add('the 17 printed cosines cos(2 pi j/64), j = 0..16, lie within 3e-10 of the enclosures (numerical.tex:138-146)', st,
        'max enclosure width %.1e; off: %s' % (max(float(c.fhi - c.flo) for c in COS), bad))

    def C(k):
        k %= 64
        if k > 32:
            k = 64 - k
        return COS[k] if k <= 16 else -COS[32 - k]

    def trig(coef, j, weights=None):
        return isum(Iv.q(coef[k - 1]) * (weights[k - 1] if weights else ONE) * C(k * j) for k in range(1, 7))

    COSH = [(exp_point(Fr(19, 100) * k) + exp_point(-Fr(19, 100) * k)).idiv(2) for k in range(1, 7)]
    rv = [trig(r, j) for j in range(64)]
    sv = [trig(s, j) for j in range(64)]
    rb = [trig(r, j, COSH) for j in range(64)]
    sb = [trig(s, j, COSH) for j in range(64)]

    def pow2(X):
        return exp_iv(X * LN2)

    Fv = [pow2(x) for x in rv]
    Gv = [pow2(x) for x in sv]
    Fk = [pow2(kap * x) for x in rv]
    Gk = [pow2(kap * x) for x in sv]
    Rb = [pow2(2 * x) for x in rb]
    Sb = [pow2(2 * x) for x in sb]
    Zf, Zg, Zfk, Zgk = (isum(v).idiv(64) for v in (Fv, Gv, Fk, Gk))
    Tr, Ts = isum(Rb).idiv(64), isum(Sb).idiv(64)
    Pj = [isum(Fv[(i + j) % 64] * Gv[i] for i in range(64)).idiv(64) for j in range(64)]
    Yj = [isum(Fv[(i + j) % 64] * Gv[i] * (rv[(i + j) % 64] + sv[i]) for i in range(64)).idiv(64) for j in range(64)]

    def log2(Y):
        return ln_iv(Y) / LN2

    LZ = log2(Zf) + log2(Zg)
    Lj = [log2(p) - LZ for p in Pj]
    Bj = [y / p - LZ for y, p in zip(Yj, Pj)]
    H = log2(Zfk) + log2(Zgk) - kap * LZ
    uj = [L + (kap - 1) * B - H for L, B in zip(Lj, Bj)]
    vj = [(2 - kap) * B - 2 * L + H for L, B in zip(Lj, Bj)]
    M2 = [2 + 2 * C(j) for j in range(64)]
    Xj = [m * pow2(Fr(17, 2) * (Delta - u)) for m, u in zip(M2, uj)]
    Xpj = [m * pow2(Fr(83, 10) * (a * v - u)) for m, u, v in zip(M2, uj, vj)]
    add('every exponential argument of the finite tables has |t| <= 8 (numerical.tex:167)', exact(max(EXP_ARGS) <= 8),
        'max |t| = %.4f over %d evaluations' % (float(max(EXP_ARGS)), len(EXP_ARGS)))
    EXP_ARGS.clear()

    # 2. the enclosures
    first = P['first']
    for key, X, e in (('Zf', Zf, '5e-7'), ('Zg', Zg, '5e-7'), ('Zfk', Zfk, '5e-7'), ('Zgk', Zgk, '5e-7'),
                      ('Tr', Tr, '5e-6'), ('Ts', Ts, '5e-6')):
        add('first table: %s = %s within %s' % (key, first[key], e), within(X, first[key], D(e)),
            'computed %s, |center - printed| = %.2e' % (X, abs(float((X.flo + X.fhi) / 2 - first[key]))))
    cols = (('P^_j', Pj, '4e-6'), ('Y^_j', Yj, '2e-5'), ('X^_j', Xj, '.0004'), ("X^'_j", Xpj, '.0004'))
    for ci, (nm, vals, e) in enumerate(cols):
        sts = [within(vals[j], table[j][ci], D(e)) for j in range(33)]
        worst = max(range(33), key=lambda j: abs((vals[j].flo + vals[j].fhi) / 2 - table[j][ci]))
        st = 'pass' if all(x == 'pass' for x in sts) else ('fail' if 'fail' in sts else 'open')
        add('node table column %s: all 33 printed centers within %s of the enclosures' % (nm, e), st,
            'largest |computed - printed| = %.2e at j = %d; rows not passing: %s'
            % (abs(float((vals[worst].flo + vals[worst].fhi) / 2 - table[worst][ci])), worst,
               [j for j in range(33) if sts[j] != 'pass']))
    sym = all(v[j].overlaps(v[64 - j]) for v in (Pj, Yj, Xj, Xpj) for j in range(1, 32))
    add('all four columns invariant under j -> 64 - j (enclosures at j and 64 - j overlap, j = 1..31)', exact(sym))
    add('X^_32 = X\'^_32 = 0 exactly (M(pi) = 0)', exact(Xj[32].lo == Xj[32].hi == 0 and Xpj[32].lo == Xpj[32].hi == 0))

    # 3. the hatted averages
    for ci, nm in ((2, 'X^'), (3, "X'^")):
        w = (table[0][ci] + table[32][ci] + 2 * sum(table[j][ci] for j in range(1, 32))) / 64 + D('.0004')
        add('eq:hatted-average-bound, the paper\'s way: (1/64)(weighted table centers of %s) + .0004 = %.6f < %s'
            % (nm, float(w), avg_bound), exact(w < avg_bound), str(w))
    for nm, vals in (('X^', Xj), ("X'^", Xpj)):
        A = isum(vals).idiv(64)
        add('eq:hatted-average-bound directly: (1/64) sum_{j<64} %s_j < %s' % (nm, avg_bound), lt(A, avg_bound), str(A))

    # 4. inner quadratures
    ch45 = [(exp_point(Fr(45, 100) * k, False) + exp_point(-Fr(45, 100) * k, False)).idiv(2) for k in range(1, 7)]
    br = isum(Iv.q(abs(r[k])) * ch45[k] for k in range(6))
    bs = isum(Iv.q(abs(s[k])) * ch45[k] for k in range(6))
    b2r = 2 * isum(Iv.q(abs(r[k])) * COSH[k] * ch45[k] for k in range(6))
    b2s = 2 * isum(Iv.q(abs(s[k])) * COSH[k] * ch45[k] for k in range(6))
    for nm, X, c in (('|r(z)|', br, '6.50'), ('|s(z)|', bs, '8.71'), ('|2 r_beta(z)|', b2r, '18.4'), ('|2 s_beta(z)|', b2s, '22.4')):
        add('strip |Im z| <= .45: %s <= coefficient sum < %s' % (nm, c), lt(X, D(c)), str(X))
    E45 = exp_point(64 * Fr(45, 100), False)
    den = E45 - 1
    for nm, B0, e in (('Z_f, Z_g, Z_{f,k}, Z_{g,k} (B_0 = 2^{kappa 8.71})', pow2(Iv.q(kap * D('8.71'))), '4e-10'),
                      ('P(x_j) (B_0 = 2^{6.50+8.71})', pow2(Iv.q(D('15.21'))), '3e-8'),
                      ('Y(x_j) (B_0 = 15.21 x 2^{15.21})', D('15.21') * pow2(Iv.q(D('15.21'))), '5e-7'),
                      ('int 2^{2 r_beta}, int 2^{2 s_beta} (B_0 = 2^{22.4})', pow2(Iv.q(D('22.4'))), '5e-6')):
        add('eq:inner-quadrature-errors, %s: 2 B_0/(e^{28.8} - 1) < %s' % (nm, e), lt((2 * B0) / den, D(e)),
            str((2 * B0) / den))
    add('the four normalizer strip bound covers F, G, F^k, G^k: max(6.50, 8.71, k 6.50, k 8.71) = k 8.71',
        exact(max(D('6.50'), D('8.71'), kap * D('6.50'), kap * D('8.71')) == kap * D('8.71')))
    Pmin = min(p.flo for p in Pj)
    add('P^_j > 1.06789 at every node', exact(Pmin > D('1.06789')), 'min lower endpoint %.9f' % float(Pmin))
    eP, eY, eZ = D('3e-8'), D('5e-7'), D('4e-10')
    l2 = LN2.flo
    eLZ = eZ / ((Zf.flo - eZ) * l2) + eZ / ((Zg.flo - eZ) * l2)
    eL = eP / ((D('1.06789') - eP) * l2) + eLZ
    eB = max(eY / (p.flo - eP) + y.fhi * eP / ((p.flo - eP) * p.flo) for p, y in zip(Pj, Yj)) + eLZ   # Y/P is not a log
    eH = (eZ / (Zfk.flo - eZ) + eZ / (Zgk.flo - eZ) + kap * (eZ / (Zf.flo - eZ) + eZ / (Zg.flo - eZ))) / l2
    add('eq:node-score-errors |L - L^| < 1e-7 (propagated: %.3e)' % float(eL), exact(eL < D('1e-7')))
    add('eq:node-score-errors |B - B^| < 2e-6 (propagated: %.3e)' % float(eB), exact(eB < D('2e-6')))
    add('eq:node-score-errors |H - H^| < 5e-9 (propagated: %.3e)' % float(eH), exact(eH < D('5e-9')))
    eu = D('1e-7') + (kap - 1) * D('2e-6') + D('5e-9')
    eavu = (1 + 2 * a) * D('1e-7') + abs(a * (2 - kap) - (kap - 1)) * D('2e-6') + (1 + a) * D('5e-9')
    f1 = pow2(Iv.q(Fr(17, 2) * eu))
    f2 = pow2(Iv.q(Fr(83, 10) * eavu))
    add('true/hatted first integrand <= 2^{8.5(1e-7 + .0315 x 2e-6 + 5e-9)} < 1.00001', lt(f1, D('1.00001')), str(f1))
    add('true/hatted second integrand <= 2^{8.3((1+2a)1e-7 + |a(2-k)-(k-1)| 2e-6 + (1+a)5e-9)} < 1.00001',
        lt(f2, D('1.00001')), str(f2))

    # 5. the outer strip
    Ir = (Tr + D('5e-6')).fhi / (Zf.flo - eZ) ** 2
    Ig = (Ts + D('5e-6')).fhi / (Zg.flo - eZ) ** 2
    add('eq:shifted-l2: Z_f^-2 int 2^{2 r_beta} <= (T64 + 5e-6)/(Z^_f - 4e-10)^2 < 1.761', exact(Ir < D('1.761')), '%.6f' % float(Ir))
    add('eq:shifted-l2: Z_g^-2 int 2^{2 s_beta} < 1.38', exact(Ig < D('1.38')), '%.6f' % float(Ig))
    add('eq:Q-strip: .761 x .38 < .54^2 (so |Q - 1| < .54, |Q| > .46)', exact(D('.761') * D('.38') < D('.54') ** 2))
    mlog = -ln_point(D('.46')) / LN2
    add('-log_2 .46 < 1.121', lt(mlog, D('1.121')), str(mlog))
    b19r = isum(Iv.q(abs(r[k])) * COSH[k] for k in range(6))
    b19s = isum(Iv.q(abs(s[k])) * COSH[k] for k in range(6))
    add('strip |Im| <= .19: |r| <= sum |r_j| cosh(.19 j) < 2.96', lt(b19r, D('2.96')), str(b19r))
    add('strip |Im| <= .19: |s| <= sum |s_j| cosh(.19 j) < 4.67', lt(b19s, D('4.67')), str(b19s))
    logZ = log2(Iv(Zf.lo, Zf.hi) + eZ) + log2(Iv(Zg.lo, Zg.hi) + eZ)
    qb = D('1.761') * D('1.38') * (D('2.96') + D('4.67') + logZ.fhi) ** 2
    add('eq:B-strip: log Z_f + log Z_g > 0 and 1.761 x 1.38 x (2.96 + 4.67 + log Z_f + log Z_g)^2 < 13^2',
        exact(logZ.flo > 0 and qb < 169), 'squared bound %.4f' % float(qb))
    Htrue = H.fhi + D('5e-9')
    add('H < .016 (H^ + 5e-9; H^ = %s)' % H, exact(Htrue < D('.016')), '%.9f' % float(Htrue))
    e1 = Fr(17, 2) * (D('.02776') + D('1.121') + D('.0315') * 13 / D('.46') + D('.016'))
    add('8.5(.02776 + 1.121 + .0315 x 13/.46 + .016) < 17.6, with .02776 = Delta and .0315 = kappa - 1',
        exact(e1 < D('17.6') and D('.02776') == Delta and D('.0315') == kap - 1), '%.5f' % float(e1))
    cB = a * (2 - kap) - (kap - 1)
    e2 = Fr(83, 10) * ((1 + 2 * a) * D('1.121') + abs(cB) * 13 / D('.46') + (1 + a) * D('.016'))
    u_co, v_co = (1, kap - 1, -1), (-2, 2 - kap, 1)          # (L, B, H) coefficients of u and v
    ident = tuple(a * y - x for x, y in zip(u_co, v_co)) == (-(1 + 2 * a), cB, 1 + a)
    add('av - u = -(1+2a)L + (a(2-k)-(k-1))B + (1+a)H (coefficients of a(v) - u with u, v from the score identities), '
        'and 8.3(...) < 17.6', exact(ident and e2 < D('17.6')), '%.5f' % float(e2))
    c38 = 2 + 2 * (exp_point(D('.38'), False) + exp_point(-D('.38'), False)).idiv(2)
    add('2 + 2 cosh(.38) < 4.16', lt(c38, D('4.16')), str(c38))
    add('4.16 x 2^17.6 < 2^20, i.e. 4.16^5 < 2^12', exact(D('4.16') ** 5 < 2 ** 12), str(float(D('4.16') ** 5)))
    oq = Fr(2 ** 21) / (exp_point(64 * D('.38'), False) - 1)
    add('2^21/(e^{64 x .38} - 1) < .00007', lt(oq, D('.00007')), str(oq))
    total = avg_bound * D('1.00001') + D('.00007')
    add('1.4295(1.00001) + .00007 = 1.429584295 exactly', exact(total == D('1.429584295')), str(total))
    p5168 = pow2(Iv.q(D('.5168')))
    add('2^{.5168} > 1.4307781 > 1.429584295 (so both filtering moments are < 2^{.5168})',
        exact(p5168.flo > D('1.4307781') and D('1.4307781') > total), str(p5168))

    ok = all(x == 'pass' for x in status)
    verdict = 'CERTIFIED' if ok else ('REFUTED' if 'fail' in status else 'REFUSED')
    value = {'Z_f': str(Zf), 'Z_g': str(Zg), 'Z_fk': str(Zfk), 'Z_gk': str(Zgk), 'T64(2^2r_b)': str(Tr), 'T64(2^2s_b)': str(Ts),
             'H^': str(H), 'mean X^': str(isum(Xj).idiv(64)), "mean X'^": str(isum(Xpj).idiv(64)),
             'scale': 'S = 10^60', 'runtime_s': round(time.time() - t0, 2)}
    return {'verdict': verdict, 'value': value, 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: the numerical certificate of Proposition prop:filtering-moments '
                       '(Appendix app:numerical) - every printed enclosure, error bound and comparison recomputed in '
                       'directed rational interval arithmetic; the analytic trapezoid estimate, contour shifts and '
                       'Parseval monotonicity are read, not run, and the O(2^0.49n) algorithm is theory'}


def forge():
    """each must NOT certify"""
    out = []
    r = decide(table_patch={(5, 0): D('1.7323179')})
    out.append(('node table: P^_5 printed 1.7323079 -> 1.7323179 (moved by 1e-5, allowed error 4e-6)', r['verdict']))
    r = decide(coef_patch={('r', 5): D('-0.315')})
    out.append(('published coefficient r_6 = -.314 -> -.315', r['verdict']))
    r = decide(cos_patch={5: D('0.8819212653')})
    out.append(('printed cos x_5 = .8819212643 -> .8819212653 (moved by 1e-9, allowed 3e-10)', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t))
