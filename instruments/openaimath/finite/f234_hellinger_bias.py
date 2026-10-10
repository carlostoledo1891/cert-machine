"""F-234 — "Hellinger contraction with arbitrary Boolean output bias" (openai/math family 119).

THE CLAIM (build/main.tex:54-61, Theorem thm:main; abstract main.tex:35-41): for every n, every f: {-1,1}^n -> {-1,1},
every rho in [-1,1], H(m) - E H(T_rho f) <= 1 - H(rho), H(t) = sqrt(1-t^2), m = E f. "The proof combines asymmetric
dimension induction, a calibrated noise-semigroup energy estimate, and finite exact arithmetic certificates"
(main.tex:39); "The proof is computer-assisted only through fixed scalar inequalities, independent of n" (main.tex:171).

WHAT IS DECIDED HERE, exactly (int/Fraction; the interval parts use integer endpoints at scale 10^12 with outward
rounding, as specified in scalar.tex sc:interval; no float in any decision; nothing from the release is run):
  A. Induction parameters (induction.tex Table ind:tab:parameters, parsed): r_0^2 <= delta <= r_1^2 comparisons
     (scalar.tex:27-31), U < 0 < V, L + U >= .488, the root-derivative margin a^2 - (s_hi/2L)^2 mu/Lambda >= 12133/44180000
     (induction.tex:312-318) on every row; b(m) = min{3/8, 9/16 - |m|/2, 1 - |m|} against the Z-law top-fraction maxima
     (induction.tex:94-117) and the knots (sc:knots).
  B. The seventeen profiles (scalar.tex:592-668, and data/profile_tables.txt, compared line by line): B(0) = 1,
     B(+-1) = 0, and the five sign checks (sc:profile-signs) by exact Bernstein coefficients — P > 0 on [-1,1], the E_B
     test (sc:E-test) on [0,1], J_{s1}, V_{s0}, V_{s1} > 0 on the five trapezoids of the knots — with de Casteljau
     bisection up to the depths of Table sc:tab:profile-depths (parsed; its copy in the data file compared).
  C. The three-coordinate base case (sc:base): the base column of Table sc:tab:profile-depths recomputed — 17 rows x 128
     subintervals x 3 positive sets x 2 orientations of (sc:base-normalized), interval arithmetic at 10^12 — and
     compared; the majority identity and its bound; the s = 0 limits of the three sets.
  D. The pair certificate (sc:interval): all 21 initial boxes (Cases 1, 2, 3 x 7 parameter rows) by the box test
     (interval value, or centre value + derivative enclosures (sc:center-test)), the delta exclusion, the tuple
     arithmetic (sc:tuple-product)-(sc:tuple-root), the E rule (sc:E-derivative), within the depths of Table
     sc:tab:interval-depths. Written here from the paper's recipes (scalar.tex:340-405); run over 2 worker processes.
  E. The central band (central.tex): the domain constants, the calibration bounds (alpha_0 series, .006257, .018641,
     .053154, .007720), the Bernstein row minima of P_1 (5,12) and P_2 (6,7) recomputed and compared entry by entry,
     the polynomial identities and signs of Lemma cen:k-bounds, T/m^2 > 4.5, alpha < 1.1, the margin .016, the
     resource constant .9857, the mean bound .298, sqrt 3 < 1.73206 and the 4.32 root bound, 444890776/228150625 < 39/20.
  F. The intermediate band (intermediate.tex): every rational comparison of the proposition (87/1000, the L and R
     bounds, Q_0 endpoints with 25435^2 < 6*10392^2 and 4761^2 < 5*2130^2, the R_0 slope, Q_*(21/25) = 425/483, the
     margins 49/25000, 121/25000), the angular bounds (sin, tan Taylor bounds, pi < 22/7 from a rigorous pi
     enclosure), the root coefficients (200/1089, 1889/1089, 625/3698, 3099/1849), the positive-series coefficients
     173/360, 11/24, 7/32, the parity structure of S, and all six minima of Table mid:certificate-table recomputed.
  G. The large-bias band (large-bias.tex): c_1..c_10 and the mass 46189/262144, the logarithm brackets, every entry
     of Table lb:arithmetic-table (Bbar, Sbar, Tbar for the four intervals) and the four displayed totals.

RUNTIME: the pair certificate dominates (798,493 boxes; with the default 2 worker processes Cases 1+2 took 4.6 min and
Case 3 4.3 min on a lightly loaded machine, the whole decide() 15 min under a load average of ~9); everything else
~25 s, the forges ~20 s. decide(parts=...) and decide(pair_cases=...) run a subset; the command line takes
--parts a,b and --pair-cases 1,2 and --no-forge.

WHAT IS NOT DECIDED (it rests on analysis, not on the finite objects): the compression lemma, the coordinate choice,
the averaging/Cauchy-Schwarz induction (Proposition ind:prop:asymmetric), the reduction of the pair inequality to the
three normalized expressions (Subsection sc:pair-reduction, including the representations (sc:representations) and the
divided-difference identities), the soundness of the enclosure rules (Bernstein, interval, mean-value test) — implemented
here as stated, not proved; the continuation criterion, the energy derivative, Lemmas lem:basic-energy, lem:fourier-
bounds, cen:edge, cen:k-bounds' ODE comparison, the Fourier-level argument, the angular identities and the positivity
of the omitted series terms in the intermediate band, the hypercontractive inequalities and monotonicity arguments of
the large-bias band, and the Courtade-Kumar corollary. A component check is not a proof of the theorem.
"""
import os
import re
import sys
import time
from fractions import Fraction
from math import comb, factorial, floor, gcd, isqrt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/Hellinger-contraction-with-arbitrary-Boolean-output-bias-September-24-2026/'
MAIN, IND, SCAL = DIR + 'build/main.tex', DIR + 'build/sections/induction.tex', DIR + 'build/sections/scalar.tex'
CEN, MID, LARGE = DIR + 'build/sections/central.tex', DIR + 'build/sections/intermediate.tex', DIR + 'build/sections/large-bias.tex'
CONT, DATA = DIR + 'build/sections/continuation.tex', DIR + 'verification/data/profile_tables.txt'
F = Fraction


def X(s):
    """a terminating decimal of the paper, as the exact rational it denotes"""
    return Fraction(s)


def squash(t):
    return re.sub(r'\s+', '', t)


# ===================================================================== exact bivariate polynomials
def pmul(A, B):
    out = {}
    for (i, j), a in A.items():
        for (k, l), b in B.items():
            key = (i + k, j + l)
            out[key] = out.get(key, 0) + a * b
    return {k: v for k, v in out.items() if v}


def padd(*Ps):
    out = {}
    for P in Ps:
        for k, v in P.items():
            out[k] = out.get(k, 0) + v
    return {k: v for k, v in out.items() if v}


def psc(P, c):
    c = F(c)
    return {k: v * c for k, v in P.items() if v * c}


def ppow(P, n):
    out = {(0, 0): F(1)}
    for _ in range(n):
        out = pmul(out, P)
    return out


def cst(c):
    return {(0, 0): F(c)} if c else {}


V0_, V1_ = {(1, 0): F(1)}, {(0, 1): F(1)}


def affine(P, l0, w0, l1, w1):
    """substitute var0 = l0 + w0 A, var1 = l1 + w1 B (mid:affine-coefficients)"""
    out = {}
    for (i, j), c in P.items():
        for a in range(i + 1):
            ca = c * comb(i, a) * l0 ** (i - a) * w0 ** a
            if not ca:
                continue
            for b in range(j + 1):
                v = ca * comb(j, b) * l1 ** (j - b) * w1 ** b
                if v:
                    out[(a, b)] = out.get((a, b), 0) + v
    return {k: v for k, v in out.items() if v}


def bern2(R, N1, N2):
    """tensor Bernstein coefficients of orders (N1, N2) on [0,1]^2 (arithmetic.tex:18-24), exact"""
    if any(i > N1 or j > N2 for (i, j) in R):
        raise ValueError('order below degree')
    arr = [[R.get((i, j), F(0)) for j in range(N2 + 1)] for i in range(N1 + 1)]
    tmp = [[sum(arr[a][j] * F(comb(i, a), comb(N1, a)) for a in range(i + 1)) for j in range(N2 + 1)] for i in range(N1 + 1)]
    return [[sum(tmp[i][b] * F(comb(j, b), comb(N2, b)) for b in range(j + 1)) for j in range(N2 + 1)] for i in range(N1 + 1)]


def degs(R):
    return max(i for i, j in R), max(j for i, j in R)


def uni(coeffs):
    return {(i, 0): F(c) for i, c in enumerate(coeffs) if c}


def same_poly(A, B):
    return padd(A, psc(B, -1)) == {}


def peval(P, x):
    s = F(0)
    for c in reversed(P):
        s = s * x + c
    return s


# ===================================================================== integer Bernstein with de Casteljau bisection
def _lcm(a, b):
    return a // gcd(a, b) * b


def to_int_array(R, N, K):
    den = 1
    for v in R.values():
        den = _lcm(den, v.denominator)
    arr = [[0] * (K + 1) for _ in range(N + 1)]
    for (k, l), v in R.items():
        arr[k][l] = v.numerator * (den // v.denominator)
    return arr


_TM = {}


def tmat(n):
    """T_ki = C(k,i) N!/C(N,i): power -> Bernstein, times N! (scalar.tex:792-797)"""
    if n not in _TM:
        _TM[n] = [[comb(k, i) * factorial(i) * factorial(n - i) if i <= k else 0 for i in range(n + 1)] for k in range(n + 1)]
    return _TM[n]


def bern_int(arr, N, K):
    TN, TK = tmat(N), tmat(K)
    tmp = [[sum(TN[n][i] * arr[i][l] for i in range(n + 1)) for l in range(K + 1)] for n in range(N + 1)]
    return [[sum(TK[k][j] * tmp[n][j] for j in range(k + 1)) for k in range(K + 1)] for n in range(N + 1)]


def _half(b):
    """2^n x de Casteljau halves: L_ik = 2^(n-i) C(i,k); the right half by index reversal (scalar.tex:800-807)"""
    n = len(b) - 1
    left = [sum(comb(i, k) * b[k] for k in range(i + 1)) << (n - i) for i in range(n + 1)]
    rb = b[::-1]
    right = [sum(comb(i, k) * rb[k] for k in range(i + 1)) << (n - i) for i in range(n + 1)][::-1]
    return left, right


def split2(arr):
    N, K = len(arr) - 1, len(arr[0]) - 1
    outs = [arr]
    if N > 0:
        new = []
        for a in outs:
            cols = [_half([a[i][l] for i in range(N + 1)]) for l in range(K + 1)]
            new += [[[cols[l][0][i] for l in range(K + 1)] for i in range(N + 1)],
                    [[cols[l][1][i] for l in range(K + 1)] for i in range(N + 1)]]
        outs = new
    if K > 0:
        new = []
        for a in outs:
            rows = [_half(a[i]) for i in range(N + 1)]
            new += [[r[0] for r in rows], [r[1] for r in rows]]
        outs = new
    return outs


def certify_positive(arr, depth):
    """every leaf (bisecting both axes, stopping early) has all coefficients > 0 within `depth`; returns (ok, depth used)"""
    stack, used = [(arr, 0)], 0
    while stack:
        a, d = stack.pop()
        if all(x > 0 for row in a for x in row):
            used = max(used, d)
            continue
        if d >= depth:
            return False, d
        stack += [(ch, d + 1) for ch in split2(a)]
    return True, used


# ===================================================================== interval arithmetic at scale 10^12 (sc:interval)
QS = 10 ** 12


class Invalid(Exception):
    pass


def _cdiv(a, b):
    return -((-a) // b)


def _csqrt(n):
    s = isqrt(n)
    return s if s * s == n else s + 1


def _pm(al, ah, bl, bh):
    """endpoints of the product of [al,ah] and [bl,bh] (scaled by QS), rounded outward to the grid"""
    if al >= 0:
        if bl >= 0:
            lo, hi = al * bl, ah * bh
        elif bh <= 0:
            lo, hi = ah * bl, al * bh
        else:
            lo, hi = ah * bl, ah * bh
    elif ah <= 0:
        if bl >= 0:
            lo, hi = al * bh, ah * bl
        elif bh <= 0:
            lo, hi = ah * bh, al * bl
        else:
            lo, hi = al * bh, al * bl
    else:
        if bl >= 0:
            lo, hi = al * bh, ah * bh
        elif bh <= 0:
            lo, hi = ah * bl, al * bl
        else:
            p, q = al * bh, ah * bl
            lo = p if p < q else q
            p, q = al * bl, ah * bh
            hi = p if p > q else q
    return lo // QS, -((-hi) // QS)


class I:
    """[lo/QS, hi/QS] with integer endpoints; every operation rounds outward to the grid"""
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi):
        self.lo, self.hi = lo, hi

    def __add__(a, b):
        if b.__class__ is not I:
            if b.__class__ is Dl:
                return NotImplemented
            b = K(b)
        return I(a.lo + b.lo, a.hi + b.hi)

    __radd__ = __add__

    def __sub__(a, b):
        if b.__class__ is not I:
            if b.__class__ is Dl:
                return NotImplemented
            b = K(b)
        return I(a.lo - b.hi, a.hi - b.lo)

    def __rsub__(a, b):
        return K(b) - a

    def __neg__(a):
        return I(-a.hi, -a.lo)

    def __mul__(a, b):
        if b.__class__ is not I:
            if b.__class__ is Dl:
                return NotImplemented
            b = K(b)
        return I(*_pm(a.lo, a.hi, b.lo, b.hi))

    __rmul__ = __mul__

    def inv(a):
        if a.lo > 0:
            return I(QS * QS // a.hi, _cdiv(QS * QS, a.lo))
        if a.hi < 0:
            return -((-a).inv())
        raise Invalid('reciprocal of an interval containing 0')

    def __truediv__(a, b):
        if b.__class__ is not I:
            if b.__class__ is Dl:
                return NotImplemented
            b = K(b)
        return a * b.inv()

    def __rtruediv__(a, b):
        return K(b) * a.inv()

    def sqrt(a):
        if a.lo < 0:
            raise Invalid('sqrt of a negative interval')
        return I(isqrt(a.lo * QS), _csqrt(a.hi * QS))

    def nroot(a):
        """value-only clipping: a negative lower endpoint becomes 0 (scalar.tex:313-316)"""
        if a.hi < 0:
            raise Invalid('nroot')
        return I(isqrt(max(a.lo, 0) * QS), _csqrt(a.hi * QS))


_KC = {}


def K(c):
    if c.__class__ is I:
        return c
    r = _KC.get(c)
    if r is None:
        f = Fraction(c)
        r = I((f.numerator * QS) // f.denominator, _cdiv(f.numerator * QS, f.denominator))
        _KC[c] = r
    return r


ZERO = I(0, 0)


def fl(f):
    return (f.numerator * QS) // f.denominator


def ce(f):
    return _cdiv(f.numerator * QS, f.denominator)


class Dl:
    """an interval with its three first derivatives (scalar.tex:298-306); a structurally zero derivative is None"""
    __slots__ = ('v', 'd')

    def __init__(self, v, d):
        self.v, self.d = v, d

    def __add__(a, b):
        if b.__class__ is not Dl:
            return Dl(a.v + K(b), a.d)
        return Dl(a.v + b.v, [x if y is None else (y if x is None else x + y) for x, y in zip(a.d, b.d)])

    __radd__ = __add__

    def __neg__(a):
        return Dl(-a.v, [None if x is None else -x for x in a.d])

    def __sub__(a, b):
        if b.__class__ is not Dl:
            return Dl(a.v - K(b), a.d)
        return Dl(a.v - b.v, [x if y is None else (-y if x is None else x - y) for x, y in zip(a.d, b.d)])

    def __rsub__(a, b):
        return Dl(K(b) - a.v, [None if x is None else -x for x in a.d])

    def __mul__(a, b):
        """product rule; each product is rounded outward separately and the two are added exactly on the grid,
        which is the same interval as separate multiplications followed by an addition"""
        if b.__class__ is not Dl:
            b = K(b)
            bl, bh = b.lo, b.hi
            return Dl(I(*_pm(a.v.lo, a.v.hi, bl, bh)), [None if x is None else I(*_pm(x.lo, x.hi, bl, bh)) for x in a.d])
        av, bv = a.v, b.v
        avl, avh, bvl, bvh = av.lo, av.hi, bv.lo, bv.hi
        out = []
        for x, y in zip(a.d, b.d):
            if x is None:
                out.append(None if y is None else I(*_pm(avl, avh, y.lo, y.hi)))
            elif y is None:
                out.append(I(*_pm(x.lo, x.hi, bvl, bvh)))
            else:
                l1, h1 = _pm(avl, avh, y.lo, y.hi)
                l2, h2 = _pm(x.lo, x.hi, bvl, bvh)
                out.append(I(l1 + l2, h1 + h2))
        return Dl(I(*_pm(avl, avh, bvl, bvh)), out)

    __rmul__ = __mul__

    def inv(a):
        v = a.v.inv()
        w = -(v * v)
        return Dl(v, [None if x is None else w * x for x in a.d])

    def __truediv__(a, b):
        if b.__class__ is not Dl:
            return a * K(b).inv()
        return a * b.inv()

    def __rtruediv__(a, b):
        return K(b) * a.inv()

    def sqrt(a):
        v = a.v.sqrt()
        if v.lo <= 0:
            raise Invalid('root derivative at a possible singularity')
        t = (2 * v).inv()
        return Dl(v, [None if x is None else x * t for x in a.d])

    nroot = sqrt


HALF_I = I(0, QS // 2)
C8 = I(QS // 8, QS // 8)


def Efn(a, b):
    """E(a,b) = a^2/(a+b): h = a/(a+b) enclosed by [0,1/2] (intersected with direct division when a+b > 0), value a*h,
    differential h(2-h) da - h^2 db (sc:E-derivative)"""
    dual = a.__class__ is Dl or b.__class__ is Dl
    av = a.v if a.__class__ is Dl else a
    bv = b.v if b.__class__ is Dl else b
    h = HALF_I
    sv = av + bv
    if sv.lo > 0:
        q = av / sv
        h = I(max(h.lo, q.lo), min(h.hi, q.hi))
        if h.lo > h.hi:
            raise Invalid('E')
    val = av * h
    if not dual:
        return val
    da = a.d if a.__class__ is Dl else [None] * 3
    db = b.d if b.__class__ is Dl else [None] * 3
    c1, c2 = h * (2 - h), h * h
    out = []
    for x, y in zip(da, db):
        if x is None:
            out.append(None if y is None else -(c2 * y))
        else:
            out.append(c1 * x if y is None else c1 * x - c2 * y)
    return Dl(val, out)


# ---- three-node divided-difference tuples: entries 0,1,2,01,02,12,012
def tadd(a, b):
    if b.__class__ is list:
        return [x + y for x, y in zip(a, b)]
    return [a[0] + b, a[1] + b, a[2] + b, a[3], a[4], a[5], a[6]]


def trsub(c, a):
    return [c - a[0], c - a[1], c - a[2], -a[3], -a[4], -a[5], -a[6]]


def tscale(a, c):
    return [x * c for x in a]


def tmul(a, b):
    """(sc:tuple-product)"""
    return [a[0] * b[0], a[1] * b[1], a[2] * b[2],
            a[0] * b[3] + a[3] * b[1], a[0] * b[4] + a[4] * b[2], a[1] * b[5] + a[5] * b[2],
            a[0] * b[6] + a[3] * b[5] + a[6] * b[2]]


def tinv(c):
    """(sc:tuple-reciprocal)"""
    a0, a1, a2 = c[0].inv(), c[1].inv(), c[2].inv()
    a12 = -(c[5] * a1 * a2)
    return [a0, a1, a2, -(c[3] * a0 * a1), -(c[4] * a0 * a2), a12, -(a0 * (c[6] * a2 + c[3] * a12))]


def tsqrt(c):
    """(sc:tuple-root)"""
    a0, a1, a2 = c[0].sqrt(), c[1].sqrt(), c[2].sqrt()
    a01 = c[3] / (a0 + a1)
    a12 = c[5] / (a1 + a2)
    return [a0, a1, a2, a01, c[4] / (a0 + a2), a12, (c[6] - a01 * a12) / (a0 + a2)]


def Xt(a, b, c, g):
    z = ZERO if a.__class__ is I else Dl(ZERO, [None] * 3)
    return [a, b, c, g, g, g, z]


class Params:
    """one parameter row; every constant the recipes use, as an outward interval (exact here: all lie on the 10^-12 grid)"""
    def __init__(self, row):
        L, U, V, al, La, mu = [F(row[k], 1000) for k in ('L', 'U', 'V', 'alpha', 'Lambda', 'mu')]
        self.exact = dict(L=L, U=U, V=V, al=al, La=La, mu=mu)
        c = dict(L=L, U=U, V=V, al=al, La=La, mu=mu, c_2L2m1=2 * L * L - 1, c_2U=2 * U, c_2LU=2 * L * U, c_2V=2 * V,
                 c_2LV=2 * L * V, c_4L=4 * L, c_16L2=(4 * L) ** 2, c_4La=4 * La, half=La / 2, al_m_half=al - La / 2,
                 one_m_al=1 - al, one_m_al_m_half=1 - al - La / 2, al_half=al / 2)
        for k, v in c.items():
            setattr(self, k, K(v))


def table(x, k, p):
    """the straight-line recipe of scalar.tex:342-351: k = 1, 2, 3 give M, R, N"""
    q2 = trsub(1, tmul(x, x))
    q = tsqrt(q2)
    h = tscale(tmul(q, x), 2)
    a = tadd(tmul(h, tadd(tscale(h, p.V), p.U)), p.L)
    e = tinv(tadd(tmul(h, a), 1))
    if k == 1:
        inner2 = tadd(trsub(p.c_2LU, tscale(q2, p.c_2V)), tscale(h, p.c_2LV))
        inner = tadd(trsub(p.c_2L2m1, tscale(q2, p.c_2U)), tmul(h, inner2))
        return tmul(tscale(tadd(tscale(x, p.L), tmul(q, inner)), 4), e)
    if k == 2:
        return tmul(tscale(tmul(q2, tadd(q, tmul(x, a))), 4), e)
    return tmul(tscale(tmul(q, tadd(x, tmul(q, a))), 4), e)


def term(m, u, i):
    e = Efn(u, i)
    o = (1 + u).inv()
    return ((1 - o * e) * m[2] + (i + e) * m[5] + e * u * (m[6] - o * m[4])) / (1 + i)


def expr12(u, v, j, k, p):
    """expr(u,v,j,k) of scalar.tex:360-384"""
    d = j * (2 * u + (1 - u) * j)
    w = u + (1 - u) * j
    t = (1 - (1 - u) * d).sqrt()
    m = table(Xt(v * u, v * w, v, v), k, p)
    n = table(Xt(v * u, v * t, v, v), k, p)
    if k == 1:
        Fv = (1 + u * u / (1 + u)) * m[2] + u * u * u * m[4] / (1 + u)
        Z = C8 * (term(m, u, w) + term(n, u, t))
        H0 = p.al * (p.c_4L - v * m[2]) + p.one_m_al * u * u * (p.c_4L - v * u * m[0])
        di = d * (1 - u)
        wi = 1 - w * w
        return [Z * H0 + p.c_4La * di * wi * v * (Z * Z) - p.mu * v * (Fv * Fv) / p.c_16L2]
    Fv = (m[2] + u * m[4]) / (1 + u)
    Z = C8 * ((Fv - m[5] - u * m[6]) / (1 + w) + (u + w) / (u + t) * (Fv - n[5] - u * n[6]) / (1 + t))
    H0 = p.al_m_half * u * m[0] + p.one_m_al_m_half * m[2] + p.half * (w * m[1] + t * n[1])
    G = v + Fv / p.c_4L
    return [Z * H0 - p.mu * (u + w) * (G * G)]


def expr3(l, u, r, p):
    """expr3(l,u,r) of scalar.tex:388-405"""
    z = 1 - l * l - u * u
    b = r * r * z
    lp = (l * l + b).nroot()
    up = (u * u + b).nroot()
    one = K(1) if l.__class__ is I else Dl(K(1), [None] * 3)
    n = table(Xt(l, l, lp, one), 3, p)
    a = table(Xt(u, u, up, one), 2, p)
    P = n[2] + Efn(l, lp) * n[4]
    Q = a[2] + u * a[4]
    Z = (Q + (u + up) * P) / (8 * (1 - r * r) * z)
    W = 1 - (u * a[0] - l * l * n[0]) / (p.c_4L * z)
    W2 = W * W
    Y0 = Z * (p.al_m_half * u * a[0] + p.half * up * a[2] + p.one_m_al * l * l * n[0] + p.half * b * P) - p.mu * (u + up) * W2
    rest = p.half * (up - u) * P
    Y1 = Z * (p.al_half * a[0] + rest) - p.mu * W2
    Y2 = Z * (p.half * Q + rest) - p.mu * W2
    return [Y0, Y1, Y2]


def _evaluate(case, args, p):
    return expr3(*args, p) if case == 3 else expr12(*args, case, p)


def _good(case, pos):
    return (pos[0] or (pos[1] and pos[2])) if case == 3 else pos[0]


def box_certified(case, box, p):
    """the box test of scalar.tex:410-428: a component is certified by a positive lower endpoint of its interval value
    on the whole box, or by the centre value + derivative test (sc:center-test); Case 3 needs Y0, or Y1 and Y2.
    The derivative-augmented evaluation carries, in its value part, exactly the interval value of the plain evaluation
    (the same operations on the same intervals; if it is valid, no value-only root clipping occurred), so it is
    evaluated first and the plain evaluation is repeated only when the augmented one is invalid. An invalid operation
    never certifies."""
    ncomp = 3 if case == 3 else 1
    pos = [False] * ncomp
    dvals = None
    dv = []
    for i, (a, b) in enumerate(box):
        d = [None, None, None]
        d[i] = I(fl((b - a) / 2), ce((b - a) / 2))
        dv.append(Dl(I(fl(a), ce(b)), d))
    try:
        dvals = _evaluate(case, dv, p)
        pos = [x.v.lo > 0 for x in dvals]
    except Invalid:
        try:
            pos = [v.lo > 0 for v in _evaluate(case, [I(fl(a), ce(b)) for a, b in box], p)]
        except Invalid:
            pass
    if _good(case, pos) or dvals is None:
        return _good(case, pos)
    try:
        cv = _evaluate(case, [I(fl((a + b) / 2), ce((a + b) / 2)) for a, b in box], p)
        for k in range(ncomp):
            if not pos[k] and cv[k].lo > sum(max(abs(J.lo), abs(J.hi)) for J in dvals[k].d if J is not None):
                pos[k] = True
    except Invalid:
        pass
    return _good(case, pos)


def box_certified_reference(case, box, p):
    """the same test in the paper's order (plain value first); used to confirm the reordering changes nothing"""
    ncomp = 3 if case == 3 else 1
    pos = [False] * ncomp
    try:
        pos = [v.lo > 0 for v in _evaluate(case, [I(fl(a), ce(b)) for a, b in box], p)]
    except Invalid:
        pass
    if _good(case, pos):
        return True
    try:
        cv = _evaluate(case, [I(fl((a + b) / 2), ce((a + b) / 2)) for a, b in box], p)
        dv = []
        for i, (a, b) in enumerate(box):
            d = [None, None, None]
            d[i] = I(fl((b - a) / 2), ce((b - a) / 2))
            dv.append(Dl(I(fl(a), ce(b)), d))
        dvals = _evaluate(case, dv, p)
        for k in range(ncomp):
            if not pos[k] and cv[k].lo > sum(max(abs(J.lo), abs(J.hi)) for J in dvals[k].d if J is not None):
                pos[k] = True
    except Invalid:
        pass
    return _good(case, pos)


def _delta(u, j):
    return j * (2 * u + (1 - u) * j) / (1 + u)


def verify_box(task):
    """verify(box, d) of scalar.tex:430-441, iteratively; returns (ok, boxes visited, deepest level, depth histogram)"""
    case, row, box, level, maxdepth = task
    p = Params(row)
    r0s, r1s = F(row['r0'], 1000) ** 2, F(row['r1'], 1000) ** 2
    stack = [(box, level)]
    n, deepest = 0, level
    while stack:
        bx, dep = stack.pop()
        n += 1
        deepest = max(deepest, dep)
        if case in (1, 2):
            (u0, u1), _, (j0, j1) = bx
            if _delta(u1, j1) < r0s or _delta(u0, j0) > r1s:
                continue
        if box_certified(case, bx, p):
            continue
        if dep >= maxdepth:
            return False, n, deepest
        halves = [[(a, (a + b) / 2), ((a + b) / 2, b)] for a, b in bx]
        stack += [([x, y, z], dep + 1) for x in halves[0] for y in halves[1] for z in halves[2]]
    return True, n, deepest


def initial_box(case, row):
    if case in (1, 2):
        return [(F(0), F(1)), (F(0), X('.8')), (F(0), F(row['r1'], 1000))]
    return [(F(0), X('.6')), (F(0), X('.6')), (F(row['r0'], 1000), F(row['r1'], 1000))]


def expand(case, row, maxdepth, split):
    """children of the initial box down to level `split`, keeping the delta exclusion and the parent tests, so that the
    work can be distributed without changing the procedure"""
    p = Params(row)
    r0s, r1s = F(row['r0'], 1000) ** 2, F(row['r1'], 1000) ** 2
    frontier, tasks, visited = [(initial_box(case, row), 0)], [], 0
    while frontier:
        bx, dep = frontier.pop()
        if dep == split:
            tasks.append((case, row, bx, dep, maxdepth))
            continue
        visited += 1
        if case in (1, 2):
            (u0, u1), _, (j0, j1) = bx
            if _delta(u1, j1) < r0s or _delta(u0, j0) > r1s:
                continue
        if box_certified(case, bx, p):
            continue
        halves = [[(a, (a + b) / 2), ((a + b) / 2, b)] for a, b in bx]
        frontier += [([x, y, z], dep + 1) for x in halves[0] for y in halves[1] for z in halves[2]]
    return tasks, visited


def pair_certificate(rows, depths, workers=2, split=2, cases=(1, 2, 3)):
    """returns {(case, group): (ok, boxes, deepest)}"""
    jobs = {}
    alltasks = []
    for case in cases:
        for g, row in enumerate(rows):
            tasks, visited = expand(case, row, depths[case][g], split)
            jobs[(case, g)] = [visited, 0, 0, True]
            alltasks += [((case, g), t) for t in tasks]
    if workers > 1:
        import multiprocessing as mp
        with mp.get_context('fork').Pool(workers) as pool:
            results = pool.map(verify_box, [t for _, t in alltasks], chunksize=1)
    else:
        results = [verify_box(t) for _, t in alltasks]
    for (key, _), (ok, n, deep) in zip(alltasks, results):
        rec = jobs[key]
        rec[0] += n
        rec[1] = max(rec[1], deep)
        rec[3] = rec[3] and ok
    return {k: (v[3], v[0], v[1]) for k, v in jobs.items()}


# ===================================================================== parsing
def parse(src):
    ind, scal, data = src.text(IND), src.text(SCAL), src.text(DATA)
    seg = ind[ind.index(r'\midrule'):ind.index(r'\label{ind:tab:parameters}')]
    rows = []
    for m in re.finditer(r'^(\d) & (\d+)\s*& (\d+)\s*& (\d+)\s*& (\d+)\s*& (\d+) & \$(-\d+)\$ & (\d+) & (\d+) & (\d+) & (\d+)\\\\', seg, re.M):
        v = [int(x) for x in m.groups()]
        rows.append(dict(i=v[0], s_lo=v[1], s_hi=v[2], r0=v[3], r1=v[4], L=v[5], U=v[6], V=v[7], alpha=v[8], Lambda=v[9], mu=v[10]))
    seg = scal[scal.index(r'\subsection{Profile data'):scal.index(r'We now verify the five sign conditions')]
    profiles = []
    for m in re.finditer(r'\\textbf\{(\d+):\}\s*([-\d,\s]+?)\.\\par', seg):
        profiles.append((int(m.group(1)), [int(x) for x in re.findall(r'-?\d+', m.group(2))]))
    seg = scal[scal.index(r'\begin{tabular}{rrrrrrr}'):scal.index(r'\label{sc:tab:profile-depths}')]
    depths = {}
    for m in re.finditer(r'^(\d+)&(\d)&(\d)&(\d)&(\d)&(\d)&(\d+)\\\\', seg, re.M):
        v = [int(x) for x in m.groups()]
        depths[v[0]] = v[1:]
    seg = scal[scal.index(r'\begin{tabular}{lrrrrrrr}'):scal.index(r'\label{sc:tab:interval-depths}')]
    idepth = {}
    for m in re.finditer(r'^Case (\d) &([\d&]+)\\\\', seg, re.M):
        idepth[int(m.group(1))] = [int(x) for x in m.group(2).split('&')]
    blocks = data.split('```')
    dprof = [(int(l.split()[0]), [int(x) for x in l.split()[1:]]) for l in blocks[1].strip().split('\n')]
    ddep = {int(l.split()[0]): [int(x) for x in l.split()[1:]] for l in blocks[3].strip().split('\n')[1:]}
    return dict(rows=rows, profiles=profiles, depths=depths, idepth=idepth, dprof=dprof, ddep=ddep, ind=ind, scal=scal)


# ===================================================================== B. profiles
def cheb(n):
    T = [[F(1)], [F(0), F(1)]]
    for j in range(1, n):
        nxt = [F(0)] + [2 * x for x in T[j]]
        for i, x in enumerate(T[j - 1]):
            nxt[i] -= x
        T.append(nxt)
    return T


def profile_B(cs):
    """(sc:profile-def): P = 1 + 1e-8 sum c_j (T_j - T_j(0)), B = (1 - m^2) P"""
    n = len(cs)
    T = cheb(max(n, 1))
    P = [F(0)] * (n + 1)
    P[0] = F(1)
    for j, c in enumerate(cs, start=1):
        for i, x in enumerate(T[j]):
            P[i] += F(c, 10 ** 8) * x
        P[0] -= F(c, 10 ** 8) * T[j][0]
    B = [F(0)] * (n + 3)
    for i, x in enumerate(P):
        B[i] += x
        B[i + 2] -= x
    while len(B) > 1 and B[-1] == 0:
        B.pop()
    return P, B


def quotients(B):
    """the coefficient recipes after (sc:quotients): C(m,x), A(m,x), E_B(m)"""
    C, A = {}, {}
    for k, bk in enumerate(B):
        for j in range(1, k + 1):
            if j % 2:
                C[(k - j, j - 1)] = C.get((k - j, j - 1), 0) + comb(k, j) * bk
            elif j >= 2:
                A[(k - j, j - 2)] = A.get((k - j, j - 2), 0) - comb(k, j) * bk
    EB = [B[k] if k % 2 == 0 else F(0) for k in range(2, len(B))]
    while len(EB) > 1 and EB[-1] == 0:
        EB.pop()
    return {k: v for k, v in C.items() if v}, {k: v for k, v in A.items() if v}, EB


def JV(B, C, A, S, p):
    """J_S = 1 - (S/2L) C and V_S = mu J_S^2 - A [B + (2 alpha - 1) x C + (Lambda - 1) x^2 A] (sc:quotients), exact"""
    L, al, La, mu = p.exact['L'], p.exact['al'], p.exact['La'], p.exact['mu']
    J = padd(cst(1), psc(C, -S / (2 * L)))
    br = padd(uni(B), psc({(i, j + 1): v for (i, j), v in C.items()}, 2 * al - 1),
              psc({(i, j + 2): v for (i, j), v in A.items()}, La - 1))
    return J, padd(psc(pmul(J, J), mu), psc(pmul(A, br), -1))


KNOTS = [(F(a, 16), F(c, 16)) for a, c in ((-16, 0), (-14, 2), (-6, 6), (6, 6), (14, 2), (16, 0))]


def b_of_m(m):
    return min(F(3, 8), F(9, 16) - abs(m) / 2, 1 - abs(m))


def trapezoid_check(S, depth):
    """S > 0 on {-1 <= m <= 1, 0 <= x <= b(m)}: m = a + h u, x = v (c + d u) on each knot piece (sc:knots)"""
    used = 0
    Nt = max(i + j for (i, j) in S)
    Kx = max(j for (i, j) in S)
    for (a, c), (a2, c2) in zip(KNOTS, KNOTS[1:]):
        h, d = a2 - a, c2 - c
        R = {}
        for (i, j), coef in S.items():
            pa = [comb(i, k) * a ** (i - k) * h ** k for k in range(i + 1)]
            pc = [comb(j, k) * c ** (j - k) * d ** k for k in range(j + 1)]
            for k1, x1 in enumerate(pa):
                if x1:
                    for k2, x2 in enumerate(pc):
                        if x2:
                            R[(k1 + k2, j)] = R.get((k1 + k2, j), 0) + coef * x1 * x2
        R = {k: v for k, v in R.items() if v}
        ok, dp = certify_positive(bern_int(to_int_array(R, Nt, Kx), Nt, Kx), depth)
        if not ok:
            return False, dp
        used = max(used, dp)
    return True, used


def min_bern_uni(P, lo, hi):
    N = len(P) - 1
    R = [F(0)] * (N + 1)
    for i, coef in enumerate(P):
        for k in range(i + 1):
            R[k] += coef * comb(i, k) * lo ** (i - k) * (hi - lo) ** k
    return min(sum(R[k] * F(comb(n, k), comb(N, k)) for k in range(n + 1)) for n in range(N + 1))


def E_check(EB, s1, depth):
    """(sc:E-test) on dyadic intervals of [0,1] with the least Bernstein coefficient, stopping early"""
    stack, used = [(F(0), F(1), 0)], 0
    while stack:
        lo, hi, d = stack.pop()
        e = min_bern_uni(EB, lo, hi)
        if e >= 0 or (1 + s1 * e > 0 and (1 + s1 * e) ** 2 > (s1 * e) ** 2 * (1 - lo * lo)):
            used = max(used, d)
            continue
        if d >= depth:
            return False, d
        mid = (lo + hi) / 2
        stack += [(lo, mid, d + 1), (mid, hi, d + 1)]
    return True, used


def P_check(P, depth):
    N = len(P) - 1
    R = {}
    for i, coef in enumerate(P):
        for k in range(i + 1):
            R[(k, 0)] = R.get((k, 0), 0) + coef * comb(i, k) * (-1) ** (i - k) * 2 ** k
    R = {k: v for k, v in R.items() if v}
    return certify_positive(bern_int(to_int_array(R, N, 0), N, 0), depth)


# ===================================================================== C. base case
SETS = [{7}, {7, 6}, {7, 6, 5}]


def base_lower(s_lo, s_hi, p, Bc):
    """min over the three sets and both signs of the interval lower bound of (sc:base-normalized) on [s_lo, s_hi]"""
    s = I(fl(s_lo), ce(s_hi))
    s2 = s * s
    dl = s2 / (2 * (1 + (1 - s2).sqrt()))
    omd = 1 - dl
    pw = {1: omd, 2: dl, 3: dl * dl * omd.inv()}
    out = []
    for D in SETS:
        mD = F(len(D), 4) - 1
        hs, qs = [], []
        for i in range(8):
            ini = i in D
            Ii = None
            for j in range(8):
                if (j in D) != ini:
                    tm = pw[bin(i ^ j).count('1')]
                    Ii = tm if Ii is None else Ii + tm
            Ii = ZERO if Ii is None else Ii * F(1, 4)
            e = s2 * Ii
            h = 2 * (Ii * (1 - e)).sqrt()
            sh = s * h
            q = (1 - 2 * e) / (1 + sh * (p.L + sh * (p.U + sh * p.V)))
            hs.append(h)
            qs.append(q if ini else -q)
        for eta in (1, -1):
            tot = None
            for h, q in zip(hs, qs):
                t = h * (1 + eta * q)
                tot = t if tot is None else tot + t
            out.append(F((tot * F(1, 8)).lo, QS) - peval(Bc, eta * mD))
    return min(out)


# ===================================================================== E/F. the central and intermediate polynomials
def central_polys():
    u, y = V0_, V1_
    a, c = padd(cst(1), psc(u, -1)), padd(cst(1), psc(y, -1))
    Am = padd(cst(1), c, psc(pmul(c, c), F(1, 2)))
    Ap = padd(cst(1), c, psc(pmul(c, c), F(3, 4)))
    Bq = padd(cst(1), psc(padd(a, c), F(1, 2)), psc(padd(pmul(a, a), pmul(a, c), pmul(c, c)), F(1, 4)))
    J = padd(cst(1), psc(padd(a, c), F(3, 4)))
    C0 = X('.034')
    upy = padd(u, y)
    S = padd(psc(Am, 2), pmul(y, padd(ppow(u, 4), psc(pmul(Bq, Bq), -16 * C0), psc(pmul(upy, upy), X('-.20')))))
    omy4 = padd(cst(1), psc(ppow(y, 4), -1))
    P1 = padd(pmul(padd(y, psc(u, -1)), S), psc(pmul(pmul(pmul(Ap, J), pmul(omy4, omy4)), y), -1))
    AJ = pmul(Ap, J)
    P2 = padd(psc(S, X('.88')), psc(pmul(pmul(pmul(AJ, AJ), padd(cst(1), psc(ppow(u, 4), -1))), y), -1))
    return P1, P2


def mid_polys():
    T, x = V0_, V1_
    D = padd(cst(1), pmul(x, x))
    N = padd(cst(1), psc(pmul(x, x), -1), psc(pmul(T, x), -2))
    z = psc(x, 2)
    k = padd(psc(x, 2), pmul(T, padd(cst(1), psc(pmul(x, x), -1))))
    N2, N4, k2, D2 = pmul(N, N), ppow(N, 4), pmul(k, k), pmul(D, D)
    P = padd(pmul(D2, padd(N4, psc(pmul(k2, N2), F(1, 2)))),
             pmul(pmul(z, z), padd(psc(N4, F(173, 360)), psc(pmul(k2, N2), F(11, 24)), psc(pmul(k2, k2), F(7, 32)))))
    NmD = padd(N, psc(D, -1))

    def Re(e):
        return padd(D2, psc(pmul(NmD, D), F(1, 2)), psc(pmul(NmD, NmD), -F(e)))
    D4N4 = pmul(pmul(D2, D2), N4)
    Tx2 = pmul(padd(T, x), padd(T, x))
    Sm = padd(pmul(Re(F(19, 100)), P), psc(pmul(D4N4, padd(cst(1), psc(pmul(T, T), F(-33, 10)), psc(Tx2, F(7, 4)))), -1))

    def Le(eps):
        inner = padd(pmul(Re(F(17, 100)), P), psc(pmul(D4N4, Tx2), F(-42, 25)))
        return padd(pmul(pmul(z, z), inner), psc(pmul(D2, D4N4), F(eps)))
    return Sm, Le


def mid_minima():
    Sm, Le = mid_polys()
    struct = all((i + j) % 2 == 0 and i + j >= 2 for (i, j) in Sm)
    res = {}
    for sg in (-1, 1):
        U1, U2 = {}, {}
        for (i, j), cf in Sm.items():
            v = cf * F(21, 100) ** i * F(sg, 2) ** j
            ka = (i + j) // 2 - 1
            U1[(ka, j)] = U1.get((ka, j), 0) + v
            U2[(ka, i)] = U2.get((ka, i), 0) + v
        for name, U, orders in (('U1', U1, (8, 18)), ('U2', U2, (8, 6))):
            U = {kk: vv for kk, vv in U.items() if vv}
            b = bern2(U, *orders)
            res[(name, sg)] = (floor(1000 * min(min(r_) for r_ in b)), degs(U))
    for T0, eps in ((F(9, 10), F(1, 100)), (F(111, 100), F(1, 50))):
        L = Le(eps)
        mins, dg = [], (0, 0)
        for j in range(4):
            for k in range(4):
                R = affine(L, T0 / 4 * j, T0 / 4, F(-7, 10) + F(7, 25) * k, F(7, 25))
                dg = max(dg, degs(R))
                mins.append(min(min(r_) for r_ in bern2(R, 6, 20)))
        res[('L', eps)] = (floor(10000 * min(mins)), dg)
    return struct, res


# ===================================================================== G. the large-bias table
def SN(x, N):
    t, s = F(1), F(1)
    for j in range(1, N + 1):
        t = t * x / j
        s += t
    return s


def Eenv(z):
    return 1 / SN(F(51, 25) * z, 40)


def ceil9(x):
    return -((-x.numerator * 10 ** 9) // x.denominator)


def large_table():
    c = [F(1, 2)]
    for k in range(1, 10):
        c.append(c[-1] * (k - F(1, 2)) / (k + 1))
    rest = 1 - sum(c)
    L0 = F(2041, 1000)
    rows = []
    for sm, sp in ((X('.84'), X('.88')), (X('.88'), X('.92')), (X('.92'), X('.96')), (X('.96'), F(1))):
        ell, R = 1 - sp ** 2, 1 - sm ** 2
        Bv = L0 * X('.361') * (1 + sm) / (1 + sm ** 2) * (1 + Eenv(ell / (2 * (2 - ell)))) / 2
        Bk = []
        for k in range(1, 11):
            q = k + F(1, 2)
            a, b1 = q / (1 + R * (q - 1)), q / (1 + ell * (q - 1))
            cands = [L0 * (1 - 1 / q) * a ** 2 * Eenv(a), L0 * (q - 1) / 2 * (a * Eenv(a) + b1 * Eenv(q))]
            if ell > 0:
                cands.append(Eenv(a) / ell)
            Bk.append(min(cands))
        a11 = F(23, 2) / (1 + R * F(21, 2))
        Bp = min([L0 * a11 ** 2 * Eenv(a11)] + ([Eenv(a11) / ell] if ell > 0 else []))
        S = sum(ck * b for ck, b in zip(c, Bk))
        T = rest * Bp
        Bb, Sb, Tb = ceil9(Bv), ceil9(S), ceil9(T)
        rows.append(dict(sm=sm, sp=sp, ell=ell, R=R, B=Bb, S=Sb, T=Tb, C=Bv + 2 * (1 + sp) * (S + T),
                         total=F(Bb + 2 * (1 + sp) * (Sb + Tb), 10 ** 9)))
    return c, rest, rows


# ===================================================================== rigorous pi (for pi < 22/7 and sqrt 2)
def arctan_inv(n, terms):
    s, lo, hi = F(0), None, None
    for i in range(terms):
        s += F((-1) ** i, (2 * i + 1) * n ** (2 * i + 1))
        if i % 2:
            lo = s
        else:
            hi = s
    return lo, hi


def pi_bounds(terms=20):
    a, b = arctan_inv(5, terms), arctan_inv(239, terms)
    return 16 * a[0] - 4 * b[1], 16 * a[1] - 4 * b[0]


# ===================================================================== the decision
PARTS = ('params', 'profiles', 'base', 'pair', 'central', 'mid', 'large')


def decide(src=None, workers=2, parts=PARTS, profiles_override=None, central_override=None, mid_override=None,
           large_override=None, base_override=None, param_override=None, idepth_override=None, pair_cases=(1, 2, 3)):
    t0 = time.time()
    src = src or Sources()
    checks = []
    T = parse(src)
    rows = param_override or T['rows']
    profiles = profiles_override or T['profiles']
    scal, ind = squash(T['scal']), squash(T['ind'])
    cen_t, mid_t, lb_t, main_t = squash(src.text(CEN)), squash(src.text(MID)), squash(src.text(LARGE)), squash(src.text(MAIN))
    cont_t = squash(src.text(CONT))
    value = {}

    def cited(text, snippet):
        return squash(snippet) in text

    check(checks, 'the theorem as stated: H(m) - E H(T_rho f) <= 1 - H(rho) (main.tex Theorem thm:main)',
          cited(main_t, r'H(m)-\E H(T_\rho f)\le1-H(\rho).'), 'main.tex:54-61')
    # ---------------- A. parameters
    if 'params' in parts:
        check(checks, 'Table ind:tab:parameters parsed: 7 rows, consecutive s-intervals covering [0, .84]',
              len(rows) == 7 and rows[0]['s_lo'] == 0 and rows[-1]['s_hi'] == 840 and all(rows[i]['s_hi'] == rows[i + 1]['s_lo'] for i in range(6)))
        okr, okLU, margins = True, True, []
        for rw in rows:
            r0, r1, slo, shi = F(rw['r0'], 1000), F(rw['r1'], 1000), F(rw['s_lo'], 1000), F(rw['s_hi'], 1000)
            okr = okr and 4 * r0 ** 2 * (1 - r0 ** 2) <= slo ** 2 and 4 * r1 ** 2 * (1 - r1 ** 2) >= shi ** 2 and r1 ** 2 < F(1, 2)
            L, U, V, al, La, mu = [F(rw[k], 1000) for k in ('L', 'U', 'V', 'alpha', 'Lambda', 'mu')]
            okLU = okLU and U < 0 < V and L + U >= X('.488')
            a = 1 - max(al, 1 - al) / La
            margins.append((a > 0, a ** 2 - (shi / (2 * L)) ** 2 * mu / La))
        check(checks, 'r_0^2 <= delta <= r_1^2: 4r_0^2(1-r_0^2) <= s_lo^2, 4r_1^2(1-r_1^2) >= s_hi^2, r_1^2 < 1/2 on every row', okr)
        check(checks, 'U < 0 < V and L + U >= .488 on every row (min L + U = .488)',
              okLU and min(F(rw['L'] + rw['U'], 1000) for rw in rows) == X('.488'))
        mmin = min(m for _, m in margins)
        check(checks, 'root-derivative sign (ind:eq:root-derivative): a > 0 and a^2 - (s_hi/2L)^2 mu/Lambda >= 12133/44180000 on every row',
              all(p_ for p_, _ in margins) and mmin >= F(12133, 44180000) and cited(ind, r'\ge\frac{12133}{44180000}>0'),
              'minimum %s (= the printed bound: %s)' % (mmin, mmin == F(12133, 44180000)))
        Z = {F(1): F(1, 16), F(1, 2): F(4, 16), F(0): F(6, 16), F(-1, 2): F(4, 16), F(-1): F(1, 16)}

        def topfrac(q):
            acc, val = F(0), F(0)
            for z in sorted(Z, reverse=True):
                take = min(Z[z], q - acc)
                if take <= 0:
                    break
                val += take * z
                acc += take
            return 2 * val
        grid = [F(k, 64) for k in range(-64, 65)]
        check(checks, 'b(m) = twice the top-(1-|m|)/2 integral of the law of Z (induction.tex:94-117), on a 1/64 grid of [-1,1]',
              all(topfrac((1 - abs(m)) / 2) == b_of_m(m) for m in grid))
        knots_ok = all(b_of_m(a) == c for a, c in KNOTS) and all(
            b_of_m(a + (a2 - a) * F(t, 8)) == c + (c2 - c) * F(t, 8) for (a, c), (a2, c2) in zip(KNOTS, KNOTS[1:]) for t in range(9))
        check(checks, 'the knots (sc:knots) trace b(m) exactly (piecewise affine between them); b(m) <= 1 - |m|',
              knots_ok and all(b_of_m(m) <= 1 - abs(m) for m in grid))
    # ---------------- B. profiles
    if 'profiles' in parts:
        check(checks, 'the 17 profiles printed in scalar.tex equal the 17 lines of data/profile_tables.txt',
              T['profiles'] == T['dprof'] and len(profiles) == 17)
        check(checks, 'the depth/base table printed in scalar.tex equals the second block of data/profile_tables.txt',
              T['depths'] == T['ddep'] and len(T['depths']) == 17)
        prof_bad, prof_info, depth_diff, s0 = [], [], [], 0
        groups_ok = True
        for s1, cs in profiles:
            g = next(rw for rw in rows if rw['s_hi'] >= s1)
            groups_ok = groups_ok and g['s_lo'] <= s0
            p = Params(g)
            P, B = profile_B(cs)
            C, A, EB = quotients(B)
            S0, S1 = F(s0, 1000), F(s1, 1000)
            dP, dE, dJ, dV0, dV1 = T['depths'][s1][:5]
            got = []
            okB = B[0] == 1 and sum(B) == 0 and sum(b * (-1) ** i for i, b in enumerate(B)) == 0
            okP = P_check(P, dP)
            okE = E_check(EB, S1, dE)
            J1, V1 = JV(B, C, A, S1, p)
            _, V0 = JV(B, C, A, S0, p)
            okJ = trapezoid_check(J1, dJ)
            okV0 = trapezoid_check(V0, dV0)
            okV1 = trapezoid_check(V1, dV1)
            for name, (ok, used), dd in (('P', okP, dP), ('E_B', okE, dE), ('J', okJ, dJ), ('V_s0', okV0, dV0), ('V_s1', okV1, dV1)):
                got.append(used)
                if not ok:
                    prof_bad.append('%d %s fails within depth %d' % (s1, name, dd))
                elif used != dd:
                    depth_diff.append('%d %s: used %d, printed %d' % (s1, name, used, dd))
            if not okB:
                prof_bad.append('%d: B(0) != 1 or B(+-1) != 0' % s1)
            prof_info.append('%d:%s' % (s1, ''.join(str(x) for x in got)))
            s0 = s1
        check(checks, 'every profile interval lies in one parameter group (no straddling)', groups_ok)
        check(checks, '17 profiles x 5 sign checks (P, E_B, J_s1, V_s0, V_s1) certified by exact Bernstein coefficients within the printed depths; B(0) = 1, B(+-1) = 0',
              not prof_bad, '; '.join(prof_bad) if prof_bad else 'depths used (P,E,J,V0,V1) ' + ' '.join(prof_info) +
              ('; all 85 equal the printed depths' if not depth_diff else '; below the printed depth: ' + '; '.join(depth_diff)))
    # ---------------- C. base case
    if 'base' in parts:
        base_bad, base_vals, s0 = [], [], 0
        for s1, cs in profiles:
            g = next(rw for rw in rows if rw['s_hi'] >= s1)
            p = Params(g)
            _, B = profile_B(cs)
            S0, S1 = F(s0, 1000), F(s1, 1000)
            lowest = min(base_lower(S0 + (S1 - S0) * k / 128, S0 + (S1 - S0) * (k + 1) / 128, p, B) for k in range(128))
            got = floor(10 ** 4 * lowest)
            printed = (base_override or {}).get(s1, T['depths'][s1][5])
            base_vals.append('%d:%d/%d' % (s1, got, printed))
            if not (lowest > 0 and got >= printed):
                base_bad.append('%d: recomputed %d < printed %d' % (s1, got, printed))
            s0 = s1
        check(checks, 'base column of Table sc:tab:profile-depths: 17 rows x 128 subintervals x 3 sets x 2 signs, interval lower bound - B(eta m_D) > 0 and floor(10^4 .) >= the printed entry',
              not base_bad, '; '.join(base_bad) if base_bad else 'recomputed/printed ' + ' '.join(base_vals))
        # majority and s = 0 limits
        u = V0_
        okmaj = same_poly(padd(cst(8), psc(u, -5), pmul(u, u)), padd(pmul(padd(cst(2), psc(padd(cst(1), psc(u, -1)), F(3, 4))),
                                                                            padd(cst(2), psc(padd(cst(1), psc(u, -1)), F(3, 4)))),
                                                                       psc(pmul(padd(cst(1), psc(u, -1)), padd(cst(1), psc(u, -1))), F(7, 16))))
        # H((3rho - rho^3)/2)^2 = s^4 (3 + s^2)/4 and H((rho + rho^3)/2)^2 = s^2 (8 - 5s^2 + s^4)/4 with rho^2 = 1 - s^2 (polynomials in s^2)
        rho2 = padd(cst(1), psc(u, -1))
        h1 = padd(cst(1), psc(pmul(rho2, pmul(padd(cst(3), psc(rho2, -1)), padd(cst(3), psc(rho2, -1)))), F(-1, 4)))
        h2 = padd(cst(1), psc(pmul(rho2, pmul(padd(cst(1), rho2), padd(cst(1), rho2))), F(-1, 4)))
        okH = same_poly(h1, psc(pmul(pmul(u, u), padd(cst(3), u)), F(1, 4))) and same_poly(h2, psc(pmul(u, padd(cst(8), psc(u, -5), pmul(u, u))), F(1, 4)))
        check(checks, 'majority: E H(T_rho f)/s = (s sqrt(3+s^2) + 3 sqrt(8-5s^2+s^4))/8 (both H^2 identities), (8-5u+u^2) - (2 + 3(1-u)/4)^2 = 7(1-u)^2/16, 2s^2 + 3(2 + 3(1-s^2)/4) = 33/4 - s^2/4 >= 8',
              okmaj and okH and F(33, 4) - F(1, 4) >= 8)
        # s = 0: h_i = sqrt(#opposite neighbours), q_i = sigma_i; compare exactly as numbers of the form a + b sqrt2 + c sqrt3
        lims = []
        for D in SETS:
            res = []
            for eta in (1, -1):
                acc = {}
                for i in range(8):
                    nb = sum(1 for j in range(8) if (j in D) != (i in D) and bin(i ^ j).count('1') == 1)
                    sig = 1 if i in D else -1
                    w = F(1 + eta * sig, 8)
                    if nb and w:
                        acc[nb] = acc.get(nb, 0) + w
                res.append(acc)
            lims.append(res)
        # expected (sqrt3/4, 3/4), (sqrt2/2, 1), ((1+2sqrt2)/4, (3+sqrt2)/4) as {radicand: coefficient}
        expect = [({3: F(1, 4)}, {1: F(3, 4)}), ({2: F(1, 2)}, {1: F(1)}), ({1: F(1, 4), 2: F(1, 2)}, {1: F(3, 4), 2: F(1, 4)})]
        norm = [[{k: v for k, v in r.items()} for r in pair_] for pair_ in lims]
        # sqrt(4) = 2 folds into the rational part
        for pr in norm:
            for r in pr:
                if 4 in r:
                    r[1] = r.get(1, 0) + 2 * r.pop(4)
        check(checks, 's = 0 limits of E G/s for {7}, {7,6}, {7,6,5}: (sqrt3/4, 3/4), (sqrt2/2, 1), ((1+2sqrt2)/4, (3+sqrt2)/4)',
              [tuple(pr) for pr in norm] == [tuple(e) for e in expect], str(norm))
    # ---------------- D. the pair certificate
    if 'pair' in parts:
        idepth = idepth_override or T['idepth']
        res = pair_certificate(rows, idepth, workers=workers, cases=pair_cases)
        bad = ['Case %d group %d' % k for k, v in sorted(res.items()) if not v[0]]
        value['pair'] = {'%d/%d' % k: {'certified': v[0], 'boxes': v[1], 'deepest': v[2], 'printed_depth': idepth[k[0]][k[1]]}
                         for k, v in sorted(res.items())}
        check(checks, 'pair certificate (sc:interval): all %d initial boxes certified within the depths of Table sc:tab:interval-depths' % len(res),
              not bad and len(res) == 7 * len(pair_cases),
              ('; '.join(bad) + ' not certified within the printed depth') if bad else
              '%d boxes visited; deepest level per case/group %s' % (sum(v[1] for v in res.values()),
                                                                    ' '.join('%d/%d:%d' % (k[0], k[1], v[2]) for k, v in sorted(res.items()))))
        agree, sampled = True, 0
        for case in pair_cases:
            for g in (0, 3):
                row = rows[g]
                bx = initial_box(case, row)
                for lev in range(5):
                    k = (3 * lev + case + g) % 8
                    halves = [[(a, (a + b) / 2), ((a + b) / 2, b)] for a, b in bx]
                    bx = [halves[0][k >> 2], halves[1][(k >> 1) & 1], halves[2][k & 1]]
                halves = [[(a, (a + b) / 2), ((a + b) / 2, b)] for a, b in bx]
                for b6 in [bx] + [[x, y, z] for x in halves[0] for y in halves[1] for z in halves[2]]:
                    pp = Params(row)
                    agree = agree and box_certified(case, b6, pp) == box_certified_reference(case, b6, pp)
                    sampled += 1
        check(checks, 'the box test as evaluated here (augmented evaluation first) agrees with the paper\'s order (plain value first) on %d sampled level-5/6 boxes' % sampled,
              agree)
    # ---------------- E. central band
    if 'central' in parts:
        R0 = X('.2944')
        check(checks, 'continuation: s >= .84 gives 0 < r = 1 - s^2 <= .2944 = 184/625', 1 - X('.84') ** 2 == R0 == F(184, 625) and cited(cont_t, r'0<r\le .2944'))
        check(checks, 'central domain: (.999)^2 < 1 - R_0^4/4; .999 - 1 + .84 = .839; (.91595)^2 < .839; s - b = m^2/(1+h) <= R_0^4/(4*1.999) < .001',
              X('.999') ** 2 < 1 - R0 ** 4 / 4 and X('.999') - 1 + X('.84') == X('.839') and X('.91595') ** 2 < X('.839') and R0 ** 4 / 4 / (1 + X('.999')) < X('.001'))
        b0 = X('.839')
        x2 = 1 - b0 ** 2
        poch = [F(1)]
        for j in range(1, 6):
            poch.append(poch[-1] * (F(3, 4) + j - 1))
        a0s = sum(poch[j] * x2 ** j / (factorial(j) * (2 * j + 1)) for j in range(6))
        a0, y0 = X('1.08834'), X('.91595')
        c1 = 1 / (b0 * a0 ** 2) - 1
        P0 = (1 + b0 ** 2) / (2 * a0 * b0 * y0) - 1
        c3 = P0 / ((1 - b0 ** 2) * a0 ** 2)
        c4 = R0 ** 3 / (4 * X('1.999')) * (1 + 1 / (b0 * X('.84')))
        ov = central_override or {}
        check(checks, 'calibration (cen:constants): alpha_0 series (6 terms) > 1.08834; 1/(b_0 a_0^2) - 1 < .006257 < .0063; P_0 < .018641 < .019; P_0/((1-b_0^2)a_0^2) < .053154 < .0532; R_0^3/(4*1.999)(1 + 1/(.839*.84)) < .007720 < .008',
              a0s > a0 and c1 < ov.get('c1', X('.006257')) < X('.0063') and P0 < X('.018641') < X('.019') and c3 < X('.053154') < X('.0532')
              and c4 < X('.007720') < X('.008'), '%.7f %.7f %.7f %.7f %.7f' % (float(a0s), float(c1), float(P0), float(c3), float(c4)))
        P1, P2 = central_polys()
        m1 = [floor(1000 * min(rw_)) for rw_ in bern2(affine(P1, F(0), X('.8'), X('.915'), 1 - X('.915')), 5, 12)]
        m2 = [floor(1000 * min(rw_)) for rw_ in bern2(affine(P2, X('.8'), X('.2'), X('.915'), 1 - X('.915')), 6, 7)]
        pr1 = ov.get('P1', [134, 353, 365, 278, 214, 46])
        pr2 = ov.get('P2', [179, 364, 559, 765, 983, 1214, 1457])
        check(checks, 'central-band Bernstein row minima floor(1000 min_j beta_ij): P_1 order (5,12) and P_2 order (6,7) equal the printed rows, all > 0',
              m1 == pr1 and m2 == pr2 and cited(cen_t, r'$P_1$ & $(5,12)$ & $134,353,365,278,214,46$') and
              cited(cen_t, r'$P_2$ & $(6,7)$ & $179,364,559,765,983,1214,1457$') and degs(P1) == (5, 12) and degs(P2) == (6, 7),
              'P_1 %s, P_2 %s' % (m1, m2))
        t_ = V0_
        one_t = padd(cst(1), psc(t_, -1))
        sq1t = pmul(one_t, one_t)

        def Pc(c):
            return padd(cst(2), psc(t_, -1), psc(sq1t, c))

        def deriv(P):
            return {(i - 1, 0): i * v for (i, _), v in P.items() if i}

        def Ec(c):
            return padd(psc(pmul(padd(cst(1), psc(ppow(t_, 4), -1)), deriv(Pc(c))), -1), psc(padd(cst(1), psc(pmul(ppow(t_, 3), Pc(c)), -1)), -2))
        t1 = pmul(t_, padd(psc(pmul(t_, t_), 2), psc(t_, -2), cst(-1)))
        t2 = psc(pmul(padd(psc(t_, 2), cst(1)), padd(psc(pmul(t_, t_), 3), psc(t_, -3), cst(1))), F(1, 2))
        n1 = padd(psc(padd(cst(1), psc(pmul(ppow(t_, 3), Pc(F(3, 4))), -1)), 2), psc(padd(cst(1), psc(ppow(t_, 4), -1)), -1))
        n2 = padd(psc(padd(cst(1), psc(ppow(t_, 4), -1)), 2), psc(padd(cst(1), psc(pmul(ppow(t_, 3), Pc(F(1, 2))), -1)), -2))
        n3 = padd(pmul(psc(padd(cst(5), psc(t_, -3)), F(1, 2)), padd(cst(1), psc(ppow(t_, 4), -1))), psc(padd(cst(1), psc(pmul(ppow(t_, 3), Pc(F(1, 2))), -1)), -2))
        cub1 = uni([2, 4, 6, -3])
        cub3 = uni([1, -1, -3, 5])
        ids = (same_poly(Ec(F(1, 2)), pmul(sq1t, t1)) and same_poly(Ec(F(3, 4)), pmul(sq1t, t2)) and same_poly(n1, psc(pmul(sq1t, cub1), F(1, 2)))
               and same_poly(n2, pmul(ppow(t_, 3), pmul(padd(t_, cst(-5)), padd(t_, cst(-1))))) and same_poly(n3, psc(pmul(sq1t, cub3), F(1, 2)))
               and same_poly(padd(uni([F(16, 100), 0, -3, 5])), psc(pmul(uni([1, 5]), pmul(uni([-2, 5]), uni([-2, 5]))), F(1, 25)))
               and same_poly(cub3, padd(pmul(pmul(t_, t_), uni([-3, 5])), uni([1, -1]))))
        # signs on [0,1]: -3t^3+6t^2+4t+2 by Bernstein; 2t^2-2t-1 = 2t(t-1) - 1 <= -1; 3t^2-3t+1 = 3(t-1/2)^2 + 1/4
        signs = (min(min(r_) for r_ in bern2(cub1, 3, 0)) > 0
                 and same_poly(uni([-1, -2, 2]), padd(psc(pmul(t_, padd(t_, cst(-1))), 2), cst(-1)))
                 and same_poly(uni([1, -3, 3]), padd(psc(pmul(padd(t_, cst(F(-1, 2))), padd(t_, cst(F(-1, 2)))), 3), cst(F(1, 4)))))
        check(checks, 'Lemma cen:k-bounds: E_1/2 = (1-t)^2 t(2t^2-2t-1), E_3/4 = (1-t)^2 (2t+1)(3t^2-3t+1)/2, the three derivative numerators, (5t+1)(5t-2)^2/25 = 5t^3-3t^2+.16, t^2(5t-3)+(1-t) = 5t^3-3t^2-t+1; -3t^3+6t^2+4t+2 > 0 on [0,1] (Bernstein)',
              ids and signs)
        check(checks, '(cen:T-ratio) (1 - R_0)(2/R_0 - R_0) > 4.5', (1 - R0) * (2 / R0 - R0) > X('4.5'))
        cc = X('.085')
        cpoly = uni([0, 1])
        check(checks, 'alpha < 1.1 (1 + c + .75c^2 at c = 1 - .915 = .085); (1-c)(1+c+3c^2/4) = 1 - c^2/4 - 3c^3/4; 1.21*.001/.84 < .004; .20*4.5 - .88 - .004 = .016',
              1 + cc + X('.75') * cc ** 2 < X('1.1') and 1 - X('.915') == cc and
              same_poly(pmul(padd(cst(1), psc(cpoly, -1)), padd(cst(1), cpoly, psc(pmul(cpoly, cpoly), F(3, 4)))), uni([1, 0, F(-1, 4), F(-3, 4)]))
              and X('1.21') * X('.001') / X('.84') < X('.004') and X('.20') * X('4.5') - X('.88') - X('.004') == X('.016'))
        check(checks, '(cen:resources) 1 - .0063 - .008 = .9857 > .985; (cen:mean-bound) (R_0(.543)/2 + .431/2)/.9924 < .298 < .31 with .543^2 > R_0, .431^2 > .0063/.034, .9924^2 < .985',
              1 - X('.0063') - X('.008') == X('.9857') > X('.985') and (R0 * X('.543') / 2 + X('.431') / 2) / X('.9924') < X('.298') < X('.31')
              and X('.543') ** 2 > R0 and X('.431') ** 2 > X('.0063') / X('.034') and X('.9924') ** 2 < X('.985'))
        c0u = 2 * X('1.73206') + X('.62')
        absorb = X('.0532') / (X('.985') * X('.034')) + X('.019') * X('4.32') ** 2 / X('.981')
        check(checks, 'sqrt 3 < 1.73206; 4.32 > c_0 = 2 sqrt3 + .62 and 4.32^2 > 1 + 4.32 c_0; (cen:absorption-constant) = 444890776/228150625 < 39/20 < 2',
              X('1.73206') ** 2 > 3 and X('4.32') > c0u and X('4.32') ** 2 > 1 + X('4.32') * c0u and absorb == F(444890776, 228150625) < F(39, 20) < 2
              and cited(cen_t, r'$444890776/228150625$'), str(absorb))
    # ---------------- F. intermediate band
    if 'mid' in parts:
        pl, ph = pi_bounds()
        ok_r = (F(184, 625)) ** 2 < F(87, 1000)
        mm = V0_
        hid = same_poly(padd(cst(1), psc(pmul(mm, mm), -1), psc(pmul(padd(cst(1), psc(pmul(mm, mm), F(-51, 100))), padd(cst(1), psc(pmul(mm, mm), F(-51, 100)))), -1)),
                        pmul(pmul(mm, mm), padd(cst(F(1, 50)), psc(pmul(mm, mm), F(-2601, 10000)))))

        def Lm(m):
            return F(913, 1000) / (1 + m) - F(51, 100) * m
        s_, v_ = F(21, 25), F(4, 25)
        Rb1 = 4 / (s_ * (1 + s_) ** 3) + 4 * v_ * F(3, 50) / (1 + s_)
        Rb2 = 2 * v_ ** 2 / (s_ * (1 + s_) * F(3, 50)) + 4 * v_ * F(1, 5) / (1 + s_)
        check(checks, 'intermediate small range: (184/625)^2 < 87/1000; (1-m^2) - (1 - 51m^2/100)^2 = m^2(1/50 - 2601m^2/10000), positive at m = 1/5; L(3/50) = 220141/265000 > 4/5 > 10032241/12775350; L(1/5) = 3953/6000 > 16/25 > 4504/7245',
              ok_r and hid and F(1, 50) - F(2601, 10000) / 25 > 0 and Lm(F(3, 50)) == F(220141, 265000) > F(4, 5) > Rb1 == F(10032241, 12775350)
              and Lm(F(1, 5)) == F(3953, 6000) > F(16, 25) > Rb2 == F(4504, 7245), '%s %s' % (Rb1, Rb2))
        def Qstar_ok(s):
            return (1 - 2 * (2 * s - 1) / (s * (1 + s))) * s * (1 + s) == (1 - s) * (2 - s) and 2 * (2 * s - 1) / (s * (1 + s)) == 6 / (1 + s) - 2 / s \
                and 3 * (1 - s) - (1 - s) * (1 + s) * (6 / (1 + s) - 2 / s) / 2 == (1 - s) * (1 + s) / s \
                and (2 * (1 + s) ** 2 - 6 * s ** 2) == 2 + 4 * s * (1 - s)
        Q0 = lambda m, a0_: ((1 + a0_ * m) / (1 + m)) ** 2 / (1 - m ** 2)   # Q_0^2
        a0_ = F(87, 1000)
        check(checks, 'Q_* identities (1 - Q_* = v(2-s)/(s(1+s)), 6/(1+s) - 2/s, 3v - rQ_*/2 = r/s, Q_*\' numerator) at 7 rational s; Q_*(21/25) = 425/483 > .879',
              all(Qstar_ok(F(k, 100)) for k in (84, 85, 90, 93, 97, 99, 50)) and 2 * (2 * s_ - 1) / (s_ * (1 + s_)) == F(425, 483) > X('.879'))
        check(checks, 'Q_0(1/5)^2 = (5087/2400)^2/6 and Q_0(2/3)^2 = (4761/2500)^2/5 at a_0 = 87/1000; 25435^2 < 6*10392^2; 4761^2 < 5*2130^2; 2(m^2-m+1) >= 3/2',
              Q0(F(1, 5), a0_) == F(5087, 2400) ** 2 / 6 and Q0(F(2, 3), a0_) == F(4761, 2500) ** 2 / 5 and 25435 ** 2 < 6 * 10392 ** 2
              and 4761 ** 2 < 5 * 2130 ** 2 and 2 * (F(1, 4) - F(1, 2) + 1) == F(3, 2))
        m23 = F(2, 3)
        check(checks, 'R_0: (1+m)^2 > 3(1-m) at m = 2/3; (87/1000)(37/50)(27/8) < 1/4; 1 - (37/50)^2 > 4/9; 3 > (5/3)^2; (87/50)^5 < 36; 3(913/1000)(5/3)/(2*6) = 4565/12000 > 1/3; R_0(2/3, 87/1000)^2 = (4761/2500)^2/5 (terms 9/(5 sqrt5), 3/sqrt5)',
              (1 + m23) ** 2 > 3 * (1 - m23) and F(87, 1000) * F(37, 50) * F(27, 8) < F(1, 4) and 1 - F(37, 50) ** 2 > F(4, 9) and 3 > F(5, 3) ** 2
              and F(87, 50) ** 5 < 36 and 3 * F(913, 1000) * F(5, 3) / 12 == F(4565, 12000) > F(1, 3)
              and 3 / (1 + m23) ** 3 == F(9, 5) ** 2 / 5 and 1 / (1 - m23 ** 2) == F(9, 5)
              and (F(913, 1000) * F(9, 5) + F(87, 1000) * 3) == F(4761, 2500))
        check(checks, 'margins: (1+s)/2 >= 23/25; .92(.879 - .866) - .01 = 49/25000 > 0; .92(.879 - .852) - .02 = 121/25000 > 0',
              (1 + s_) / 2 == F(23, 25) and X('.92') * (X('.879') - X('.866')) - X('.01') == F(49, 25000) and
              X('.92') * (X('.879') - X('.852')) - X('.02') == F(121, 25000))

        def sin_low(u_):
            return u_ - u_ ** 3 / 6

        def tan_up(u_):
            return (u_ - u_ ** 3 / 6 + u_ ** 5 / 120) / (1 - u_ ** 2 / 2)
        check(checks, 'angles: pi < 22/7 (Machin enclosure); sin(21/100) >= .21 - .21^3/6 > 1/5; sin(21/25) >= .84 - .84^3/6 > 37/50; sqrt2 - 1 < 21/50; (11/7 + 21/100)/4 < 9/20; (11/7 + 21/25)/4 < 603/1000; tan(9/20) < 1/2, tan(603/1000) < 7/10',
              ph < F(22, 7) and sin_low(F(21, 100)) > F(1, 5) and sin_low(F(21, 25)) > F(37, 50) and F(71, 50) ** 2 > 2
              and (F(11, 7) + F(21, 100)) / 4 < F(9, 20) and (F(11, 7) + F(21, 25)) / 4 < F(603, 1000)
              and tan_up(F(9, 20)) < F(1, 2) and tan_up(F(603, 1000)) < F(7, 10) and 1 - F(603, 1000) ** 2 / 2 > 0)
        check(checks, 'T bounds: 1/24 < (21/100)^2, 4/5 < (9/10)^2, 37^2/1131 < (111/100)^2; small-rectangle q >= (27/50)/(5/4) = 54/125 > (13/20)^2; 1/sqrt(2(1+37/50)) = 5/sqrt87, 25/87 > (53/100)^2, 53/100 > (18/25)^2',
              F(1, 24) < F(21, 100) ** 2 and F(4, 5) < F(9, 10) ** 2 and F(37 ** 2, 1131) < F(111, 100) ** 2
              and (1 - F(1, 4) - 2 * F(21, 100) * F(1, 2)) / (1 + F(1, 4)) == F(54, 125) > F(13, 20) ** 2
              and 2 * (1 + F(37, 50)) == F(87, 25) and F(25, 87) > F(53, 100) ** 2 and F(53, 100) > F(18, 25) ** 2)
        r1_, r2_ = F(13, 20), F(18, 25)
        check(checks, 'root coefficients: 1/(2(1+13/20)^2) = 200/1089 < 19/100, 1 + 2/(1+13/20)^2 = 1889/1089 < 7/4, 1/(2(1+18/25)^2) = 625/3698 < 17/100, 1 + 2/(1+18/25)^2 = 3099/1849 < 42/25',
              1 / (2 * (1 + r1_) ** 2) == F(200, 1089) < F(19, 100) and 1 + 2 / (1 + r1_) ** 2 == F(1889, 1089) < F(7, 4)
              and 1 / (2 * (1 + r2_) ** 2) == F(625, 3698) < F(17, 100) and 1 + 2 / (1 + r2_) ** 2 == F(3099, 1849) < F(42, 25))
        sq = V0_   # sq stands for sqrt(q); (sqrt q - 1)^2 (q + 2 sqrt q + 3) = (q - 1)^2 (1 + 2/(1 + sqrt q)^2)
        ident1 = same_poly(padd(psc(sq, 4), psc(ppow(sq, 4), -1), cst(-3)),
                           psc(pmul(pmul(padd(cst(1), psc(sq, -1)), padd(cst(1), psc(sq, -1))), padd(pmul(sq, sq), psc(sq, 2), cst(3))), -1))
        root_id = all(1 + (s2 - 1) / 2 - (s2 - 1) ** 2 / (2 * (1 + sv) ** 2) == sv for sv in (F(1, 3), F(2, 3), F(7, 5)) for s2 in (sv * sv,))
        yq = V0_
        poly_y = padd(pmul(pmul(padd(cst(1), psc(yq, F(-33, 10))), padd(cst(1), psc(yq, F(-33, 10)))), padd(cst(1), yq)),
                      psc(pmul(padd(cst(1), psc(yq, -3)), padd(cst(1), psc(yq, -3))), -1))
        check(checks, '4 sqrt q - q^2 - 3 = -(sqrt q - 1)^2 (q + 2 sqrt q + 3) (i.e. -(q-1)^2 (1 + 2/(1+sqrt q)^2)); the root identity (mid:root-identity); (1 - 33y/10)^2(1+y) - (1-3y)^2 = y(2/5 - 471y/100 + 1089y^2/100), 2/5 - (471/100)(441/10000) > 0',
              ident1 and root_id and same_poly(poly_y, pmul(yq, uni([F(2, 5), F(-471, 100), F(1089, 100)]))) and F(2, 5) - F(471, 100) * F(441, 10000) > 0)
        # positive-series coefficients
        def binser(alpha, n):
            out, c_ = [], F(1)
            for k in range(n):
                out.append(c_)
                c_ = c_ * (alpha + k) / (k + 1)
            return out
        s14, s54 = binser(F(1, 4), 3), binser(F(5, 4), 2)
        co = {('y', 0, 0): s14[0], ('y', 1, 0): s14[1], ('y', 2, 0): s14[2],
              ('y', 1, 2): F(comb(4, 2), 16) * s54[0], ('y', 2, 2): F(comb(4, 2), 16) * s54[1], ('y', 2, 4): F(comb(8, 4), 256)}
        integrand = co[('y', 1, 0)] == F(1, 4) and co[('y', 1, 2)] == F(3, 8) and co[('y', 2, 0)] == F(5, 32) and co[('y', 2, 2)] == F(15, 32) and co[('y', 2, 4)] == F(35, 128)
        av = {(1, 0): co[('y', 1, 0)] / 3, (1, 2): co[('y', 1, 2)] / 3, (2, 0): co[('y', 2, 0)] / 5, (2, 2): co[('y', 2, 2)] / 5, (2, 4): co[('y', 2, 4)] / 5}
        avg_ok = av == {(1, 0): F(1, 12), (1, 2): F(1, 8), (2, 0): F(1, 32), (2, 2): F(3, 32), (2, 4): F(7, 128)}
        asin = [F(comb(2 * n, n), 4 ** n * (2 * n + 1)) for n in range(3)]
        # (1 + aY + bY^2)(1 + Y/6 + 3Y^2/40), 4(A-1)/Y through degree one in Y; coefficients are polynomials in G^2
        a1 = {0: av[(1, 0)], 2: av[(1, 2)]}
        a2 = {0: av[(2, 0)], 2: av[(2, 2)], 4: av[(2, 4)]}
        lin = {g: 4 * (a1.get(g, 0) + (asin[1] if g == 0 else 0)) for g in (0, 2)}
        quad = {g: 4 * (a2.get(g, 0) + asin[1] * a1.get(g, 0) + (asin[2] if g == 0 else 0)) for g in (0, 2, 4)}
        check(checks, 'positive series: (1-y)^(-1/4), C(4j,2j)/16^j (1-y)^(-j-1/4) through y^2, averages u^2 -> 1/3, u^4 -> 1/5, t/sin t = 1 + Y/6 + 3Y^2/40 + ..., giving P_0 = 1 + G^2/2 + Y(173/360 + 11G^2/24 + 7G^4/32)',
              integrand and avg_ok and asin == [1, F(1, 6), F(3, 40)] and lin == {0: 1, 2: F(1, 2)} and quad == {0: F(173, 360), 2: F(11, 24), 4: F(7, 32)})
        struct, mins = mid_minima()
        printed = mid_override or {('U1', -1): 90, ('U1', 1): 27, ('U2', -1): 293, ('U2', 1): 120, ('L', F(1, 100)): 53, ('L', F(1, 50)): 26}
        orders = {('U1', -1): (8, 18), ('U1', 1): (8, 18), ('U2', -1): (8, 6), ('U2', 1): (8, 6), ('L', F(1, 100)): (6, 20), ('L', F(1, 50)): (6, 20)}
        tab_ok = all(cited(mid_t, s_) for s_ in (r'\eqref{mid:chart-one}, \(\sigma=-1\) & \((8,18)\) & \(1000\) & 90',
                                                  r'\eqref{mid:chart-one}, \(\sigma=1\) & \((8,18)\) & \(1000\) & 27',
                                                  r'\eqref{mid:chart-two}, \(\sigma=-1\) & \((8,6)\) & \(1000\) & 293',
                                                  r'\eqref{mid:chart-two}, \(\sigma=1\) & \((8,6)\) & \(1000\) & 120',
                                                  r'\eqref{mid:large-map}, \(T_0=9/10\) & \((6,20)\) & \(10000\) & 53',
                                                  r'\eqref{mid:large-map}, \(T_0=111/100\) & \((6,20)\) & \(10000\) & 26'))
        check(checks, 'Table mid:certificate-table: the six minima floor(C min B_ij) recomputed equal the printed 90, 27, 293, 120, 53, 26 (degrees within the printed orders); every nonzero term of S has i+j even >= 2',
              struct and tab_ok and all(mins[k][0] == printed[k] and mins[k][1][0] <= orders[k][0] and mins[k][1][1] <= orders[k][1] for k in printed),
              ' '.join('%s%s:%d' % (k[0], k[1], v[0]) for k, v in mins.items()))
    # ---------------- G. large bias
    if 'large' in parts:
        ck, rest, lrows = large_table()
        check(checks, 'c_1..c_10 = 1/2, 1/8, 1/16, 5/128, 7/256, 21/1024, 33/2048, 429/32768, 715/65536, 2431/262144 (recurrence and C(2k,k)/((2k-1)4^k)); remaining mass 46189/262144',
              ck == [F(1, 2), F(1, 8), F(1, 16), F(5, 128), F(7, 256), F(21, 1024), F(33, 2048), F(429, 32768), F(715, 65536), F(2431, 262144)]
              and all(ck[k - 1] == F(comb(2 * k, k), (2 * k - 1) * 4 ** k) for k in range(1, 11)) and rest == F(46189, 262144))
        x51 = F(51, 25)
        up = SN(x51, 15) + x51 ** 16 / (factorial(16) * (1 - x51 / 17))
        check(checks, 'log brackets: S_15(51/25) + (51/25)^16/(16!(1 - (51/25)/17)) < 7691/1000 < 100/13 < 7698/1000 < S_15(2041/1000); .361^2 > .13; (3/2)/(1 + (184/625)/2) = 625/478 > 1.3; 1 - 2s - s^2 < 0 at s = .84',
              up < F(7691, 1000) < F(100, 13) < F(7698, 1000) < SN(F(2041, 1000), 15) and X('.361') ** 2 > X('.13')
              and F(3, 2) / (1 + F(184, 625) / 2) == F(625, 478) > X('1.3') and 1 - 2 * X('.84') - X('.84') ** 2 < 0)
        lp = large_override or [(F(141, 625), F(184, 625), 746521967, 60049597, 2525240, F(24545083853, 25000000000), X('.982')),
                                (F(96, 625), F(141, 625), 748896408, 56019174, 1084482, F(3025545147, 3125000000), X('.969')),
                                (F(49, 625), F(96, 625), 750555827, 51401364, 283275, F(23828990297, 25000000000), X('.954')),
                                (F(0), F(49, 625), 751524751, 46967364, 36923, F(939541899, 1000000000), X('.940'))]
        lb_bad = []
        for rw, (ell, R, Bb, Sb, Tb, tot, bound) in zip(lrows, lp):
            if (rw['ell'], rw['R'], rw['B'], rw['S'], rw['T'], rw['total']) != (ell, R, Bb, Sb, Tb, tot) or not (rw['C'] <= tot < bound < 1):
                lb_bad.append('[%s,%s]: recomputed %s %s %s %s' % (rw['sm'], rw['sp'], rw['B'], rw['S'], rw['T'], rw['total']))
        check(checks, 'Table lb:arithmetic-table: ell, R, Bbar, Sbar, Tbar recomputed equal the printed integers on all four intervals; C <= the rounded total = the printed fraction < .982, .969, .954, .940 < 1',
              not lb_bad and cited(lb_t, r'$746521967$ & $60049597$ & $2525240$') and cited(lb_t, r'\frac{939541899}{1000000000}<\frac{940}{1000}'),
              '; '.join(lb_bad) if lb_bad else ' '.join('%s/%s/%s' % (rw['B'], rw['S'], rw['T']) for rw in lrows))

    allpass = all(c_['pass'] for c_ in checks)
    verdict = 'CERTIFIED' if allpass else 'REFUSED'
    if not allpass:
        hard = [c_['check'] for c_ in checks if not c_['pass']]
        if any(h.startswith(('17 profiles', 'base column', 'pair certificate', 'central-band Bernstein', 'Table mid', 'Table lb',
                             'root-derivative', 'calibration')) for h in hard):
            verdict = 'REFUTED'
    value['runtime_s'] = round(time.time() - t0, 1)
    scope = ('a finite component: the scalar certificates of the proof — the induction parameters, the 17 profiles\' five '
             'Bernstein sign checks, the three-coordinate base table, %s, and every finite comparison and Bernstein/table '
             'entry of the central, intermediate and large-bias bands; NOT the theorem, whose induction, continuation and '
             'norm-inequality arguments are analytic' % ('the 21-box pair interval certificate' if 'pair' in parts else 'NOT the pair interval certificate (skipped in this call)'))
    if tuple(parts) != PARTS:
        scope = 'PART of the finite component (this call ran only: %s)' % ', '.join(parts)
    return {'verdict': verdict, 'value': value, 'checks': checks, 'sources': src.read, 'decides': scope}


def forge():
    """each must NOT certify; each forged run decides only the part its forgery touches, to stay fast"""
    out = []
    src = Sources()
    T = parse(src)
    pf = [list(x) for x in T['profiles']]
    pf[0] = (pf[0][0], [c + (500000 if i == 16 else 0) for i, c in enumerate(pf[0][1])])
    out.append(('profile 5: c_17 = -28650 -> 471350 (a sign check fails within its depth)',
                decide(parts=('profiles',), profiles_override=[tuple(x) for x in pf])['verdict']))
    out.append(('base column: row 220 printed 79 instead of 78', decide(parts=('base',), base_override={220: 79})['verdict']))
    out.append(('central band: P_1 row minimum 46 printed as 47', decide(parts=('central',), central_override={'P1': [134, 353, 365, 278, 214, 47]})['verdict']))
    lp = [(F(141, 625), F(184, 625), 746521968, 60049597, 2525240, F(24545083853, 25000000000), X('.982')),
          (F(96, 625), F(141, 625), 748896408, 56019174, 1084482, F(3025545147, 3125000000), X('.969')),
          (F(49, 625), F(96, 625), 750555827, 51401364, 283275, F(23828990297, 25000000000), X('.954')),
          (F(0), F(49, 625), 751524751, 46967364, 36923, F(939541899, 1000000000), X('.940'))]
    out.append(('large bias: Bbar of [.84,.88] printed one larger', decide(parts=('large',), large_override=lp)['verdict']))
    out.append(('intermediate table: U_{1,+} minimum printed 28 instead of 27',
                decide(parts=('mid',), mid_override={('U1', -1): 90, ('U1', 1): 28, ('U2', -1): 293, ('U2', 1): 120,
                                                 ('L', F(1, 100)): 53, ('L', F(1, 50)): 26})['verdict']))
    rows = [dict(r_) for r_ in T['rows']]
    rows[3]['mu'] = 2 * rows[3]['mu']
    out.append(('pair certificate alone, Case 1 of parameter row 3 with mu doubled (1.024 -> 2.048), printed depth 7',
                _forge_pair(rows[3], 1, T['idepth'][1][3])))
    out.append(('pair certificate alone, Case 1 of parameter row 0 with its printed depth 8 replaced by 3',
                _forge_pair(T['rows'][0], 1, 3)))
    return out


def _forge_pair(row, case, depth):
    """the pair certificate alone on one forged (case, row, depth); a failing leaf ends the search early"""
    ok, n, deep = verify_box((case, row, initial_box(case, row), 0, depth))
    return 'CERTIFIED' if ok else 'REFUTED'


if __name__ == '__main__':
    import json
    t = time.time()
    parts = PARTS
    if '--parts' in sys.argv:
        parts = tuple(sys.argv[sys.argv.index('--parts') + 1].split(','))
    cases = (1, 2, 3)
    if '--pair-cases' in sys.argv:
        cases = tuple(int(x) for x in sys.argv[sys.argv.index('--pair-cases') + 1].split(','))
    res = decide(parts=parts, pair_cases=cases)
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c_ in res['checks']:
        print(('PASS ' if c_['pass'] else 'FAIL ') + c_['check'], '|', c_['detail'])
    print('%.1fs' % (time.time() - t))
    if '--no-forge' not in sys.argv:
        print('forges:', forge())
