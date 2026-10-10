"""F-178 — "Universal optimality of the triangular lattice" (openai/math family 090).

THE CLAIM (build/main.tex abstract; sections/01-uniform-gaussian-theorem.tex:31-41, Theorem thm:universal): the
unit-covolume triangular lattice A minimises the lower energy E_g among locally finite planar configurations of
centred disk density one, for every nonnegative completely monotone g (plus renormalised / jellium corollaries).
The proof's finite input is Proposition prop:finite-certificate (sections/03-quadrature-finite-data.tex:507-532):
"The exact arrays defined in this section satisfy ||D^64|| < .004, ||V+|| + ||V-|| < 36, column norms < 2.3 / 5.6,
every Bernstein lower evaluation > .001 and every tail expression > .0021", proved (l.534-641) by the stronger
Tables table:power-bounds, table:column-bounds, table:sign-bounds — "37310 separate real lower comparisons, and the
tail column consists of ten" — on the EXACT quadrature arrays (Arb balls in the authors' route), plus the scalar
budgets of Appendix sec:arithmetic (08-arithmetic-verification.tex:26-339). Appendix app:floor-certificate
(09-conditional-floor-verification.tex) specifies a second, floor-rounded rational procedure (eps = 1e-80) and
proves that if it passes the same stronger tables, the looser proposition bounds hold; the paper says (08:20-24,
09:8-10) and verification/README.md says that "the complete floor-rounded matrix procedure is not executed by the
supplied programs".

WHAT IS DECIDED HERE — the whole finite certificate, twice, by two arithmetics written for this audit:
  ROUTE A (the paper's selected route: enclosures of the exact quadrature arrays). Every array is rebuilt from the
  formulas (03:22-476): the first Fejer rule (N = 384) with weights o_v from its cosine series, the 2311 mass rows of W
  (2304 quadrature points + 7 atoms), the jet projection giving D (168 x 168) and S_Fe, the nine doubling steps for
  U = D^(2^r) and V+-, Y, E(k), g1, g2, X_1, X_2, the 91 half-gap rows l_{i,r} (r <= 40) and their degree-40
  Bernstein rows L_{i,d}, the containing-box lower evaluation [l]_{K,J}, the target supports a*_r, and the ten tail
  expressions. Arithmetic: dyadic fixed-point balls (centre k/2^192, radius an integer number of ulps; every product
  and shift rounded so the ball keeps containing the exact real), i.e. intervals with rational endpoints; pi by
  Machin with the alternating bracket; sqrt(3) by integer square root; cos, sin, exp by Taylor with a bounded tail
  (cos/sin at the midpoint after 2 pi reduction, widened by the radius). Matrix products are exact integer dot
  products (Kronecker-packed rows) followed by one floor, with radius propagation |A||dB| + |dA||B| + |dA||dB|.
  Every comparison of the three tables is made on the enclosure: an upper bound must lie wholly below its cutoff, a
  lower bound wholly above. 9x3 power entries, 6 column entries, 37,310 Bernstein comparisons, 10 tail comparisons.
  ROUTE B (Appendix app:floor-certificate, which the shipped checkers do not run): the floor-rounded listing
  (09:325-502) executed EXACTLY in integers — e_* (degree-60 Taylor, 12 squarings, floors at 1e-80), p_*, b_* parsed
  from 08:33-34, every R(.) where the listing puts one and exact rational arithmetic everywhere else — and every
  recorded value compared with the same three tables. The domain claim of Lemma lem:rational-roundoff (every e_*
  argument has |w| < 1700 and Re w < 7) is checked on every call. The two routes are cross-checked against each
  other: the lemma's conclusions (initial operator errors < 1e-44, column errors < 1e-29, Bernstein entries
  < 1e-16) are measured on the actual run, using route A's enclosures.
  EXACT LAYER: the Fourier coefficients P_l (eq. periodic-coefficients), the node constants Q_a, D_a (eq.
  node-constants) two ways in Q(sqrt3)(i) (from P_l and from the sine product / cotangent sums), P(n) = P'(n) = 0 at
  the residues, and the per-residue sums A_j(n), B_j(n) used by the masses.
  SCALAR BUDGETS: Lemma lem:rational-pi-b (p_* < pi < p_* + 1e-80, b_* < sqrt3/2 < b_* + 1e-80), the table
  eq:scalar-error-budgets, the four half-gap remainders R(m, Y, nu), the two target-support tails, the tail
  second-derivative bound, 12 - 8 sqrt2 > .6862, the interpolation arithmetic of Section 4, the kernel constants of
  Lemma lem:kernel-bounds, the quadrature-lemma comparisons, and the roundoff-lemma majorants of Appendix C.

RESULTS (this run, 8 forked workers, ~6 min: route A ~1.5 min, route B ~4 min). Every comparison passes on both
routes. Tightest margins: the K = 2.36 Bernstein group 7 <= m <= 88 has minimum .0012061 against .00116; the K = 2.36
tail for list 2 is .002268 against .0022; ||U|| at step 8 is 7.399e-13 against 1e-12. Floor route vs exact arrays:
S# within 1.3e-52 per entry (lemma: 1e-44 in norm), X# column error 5.2e-45 (lemma: 1e-29), L# entries 3.8e-37
(lemma: 1e-16). Two roundoff-lemma majorants are thin and hold only with a true enclosure of the exponential, not with
the e < 2719/1000 the paper uses elsewhere: (4e-78 + 24 eps) 3^12 e^7 = 2.4710e-69 < 2.472e-69 and
41*4*230*3 e^15 1e-29 = 3.6992e-18 < 3.700e-18 (with e < 2719/1000 they would be 2.4756e-69 and 3.7139e-18); the
paper does not say which bound it uses there, so this is a note, not a discrepancy.

WHAT IS NOT DECIDED HERE: everything analytic that turns these finite facts into the theorem — the cardinal-measure
and Fourier-pair lemmas (Section 2), the quadrature error lemma (its numeric comparisons are checked, not the Cauchy
estimate), the exact interpolation on the infinite summable space (Section 4), the Taylor-remainder / containing-box /
Bernstein-range / sine-product-barrier arguments that give the signs on every radius and every k >= 2.36
(Section 5), the Gaussian-energy transfer (the Cohn-Kumar / Cohn-Elkies linear-programming framework, Cohn-de
Courcy-Ireland density argument, Poisson summation), the completely-monotone mixtures, and the renormalised / jellium
corollaries. So the verdict is about the finite certificate (a component), not the universal-optimality theorem.
"""
import hashlib
import json
import math
import multiprocessing
import os
import re
import sys
import time
from fractions import Fraction as Fr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

ROOT = 'preprints/Universal-optimality-of-the-triangular-lattice-September-23-2026/'
MAIN = ROOT + 'build/main.tex'
S02 = ROOT + 'build/sections/02-cardinal-fourier.tex'
S03 = ROOT + 'build/sections/03-quadrature-finite-data.tex'
S04 = ROOT + 'build/sections/04-exact-interpolation.tex'
S05 = ROOT + 'build/sections/05-global-signs.tex'
S08 = ROOT + 'build/sections/08-arithmetic-verification.tex'
S09 = ROOT + 'build/sections/09-conditional-floor-verification.tex'
VREADME = ROOT + 'verification/README.md'
MANIFEST = ROOT + 'verification/CERTIFICATE-INPUTS.json'

# ============================================================== outward-rounded intervals (route A scalars)
P = 192
ONE = 1 << P
ONE2 = ONE * ONE


class R:
    """the real interval [lo, hi] / 2^P, every operation rounded outward"""
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
        return R(min(p) >> P, -((-max(p)) >> P))
    __rmul__ = __mul__

    def recip(self):
        if self.lo <= 0 <= self.hi:
            raise ZeroDivisionError('interval contains 0')
        return R(ONE2 // self.hi, -((-ONE2) // self.lo))

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
        return (self.lo + self.hi) / 2 / ONE


def q(x):
    x = Fr(x)
    n = x.numerator << P
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


def rmax(*xs):
    xs = [cv(x) for x in xs]
    return R(max(x.lo for x in xs), max(x.hi for x in xs))


def rpow(x, n):
    out = q(1)
    for _ in range(n):
        out = out * x
    return out


def sqrt(x):
    if x.lo < 0:
        raise ArithmeticError('sqrt of a possibly negative interval')
    lo = math.isqrt(x.lo * ONE)
    t = x.hi * ONE
    hi = math.isqrt(t)
    if hi * hi < t:
        hi += 1
    return R(lo, hi)


def lt(a, b):
    return cv(a).hi < cv(b).lo


def machin(terms5, terms239):
    """rational lower and upper bounds for pi: 16 atan(1/5) - 4 atan(1/239), alternating-series brackets"""
    def br(x, n):
        s = Fr(0)
        lo = hi = None
        for k in range(n):
            s += Fr((-1) ** k, 2 * k + 1) * x ** (2 * k + 1)
            if k % 2 == 0:
                hi = s
            else:
                lo = s
        return lo, hi
    a_lo, a_hi = br(Fr(1, 5), terms5)
    b_lo, b_hi = br(Fr(1, 239), terms239)
    return 16 * a_lo - 4 * b_hi, 16 * a_hi - 4 * b_lo


_PL, _PH = machin(120, 40)
PI = R(q(_PL).lo, q(_PH).hi)


def _exp_pt(x):
    s = 0
    while max(abs(x.lo), abs(x.hi)) > (ONE >> 4) << s:
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
    t = term.mag() + 2
    tot = R(tot.lo - t, tot.hi + t)
    for _ in range(s):
        tot = tot * tot
    return tot


def exp(x):
    x = cv(x)
    return R(_exp_pt(R(x.lo, x.lo)).lo, _exp_pt(R(x.hi, x.hi)).hi)


def cos_sin(x):
    x = cv(x)
    m = x.mid()
    rad = max(x.hi - m, m - x.lo)
    twopi = PI * 2
    tm = twopi.mid()
    k = (2 * m + tm) // (2 * tm)
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


# ============================================================== balls: (mid, rad) and complex (re, im, rad), ints / 2^P
def ball(x):
    m = (x.lo + x.hi) >> 1
    return m, max(x.hi - m, m - x.lo)


def cball(re, im):
    a, ra = ball(re)
    b, rb = ball(im)
    return a, b, max(ra, rb)


def cmul(x, y):
    a, b, rx = x
    c, d, ry = y
    rad = (((abs(a) + abs(b)) * ry + (abs(c) + abs(d)) * rx + 2 * rx * ry) >> P) + 2
    return (a * c - b * d) >> P, (a * d + b * c) >> P, rad


def cmul_disc(x, y):
    """product of complex balls whose radius bounds the MODULUS of the error (no sqrt2 loss per product); the output
    radius bounds the modulus error, hence also each component's error, so it may feed cmul as well"""
    a, b, rx = x
    c, d, ry = y
    mx = math.isqrt(a * a + b * b) + 1
    my = math.isqrt(c * c + d * d) + 1
    return (a * c - b * d) >> P, (a * d + b * c) >> P, ((mx * ry + my * rx + rx * ry) >> P) + 2


def rcmul(x, y):
    c, rc = x
    a, b, r = y
    return (c * a) >> P, (c * b) >> P, ((abs(c) * r + rc * max(abs(a), abs(b)) + rc * r) >> P) + 2


def cdivint(x, k):
    return x[0] // k, x[1] // k, -((-x[2]) // k) + 1


def pack(vals, w):
    x = 0
    for v in reversed(vals):
        x = (x << w) + v
    return x


def unpack(x, n, w):
    out = []
    half = 1 << (w - 1)
    full = 1 << w
    mask = full - 1
    for _ in range(n):
        f = x & mask
        if f >= half:
            f -= full
        out.append(f)
        x = (x - f) >> w
    if x not in (0,):
        raise ArithmeticError('packed field overflow')
    return out


# ============================================================== parallel map over forked workers
_G = {}


def pmap(fn, items, workers):
    items = list(items)
    if workers <= 1 or len(items) <= 1:
        return [fn(x) for x in items]
    ctx = multiprocessing.get_context('fork')
    with ctx.Pool(min(workers, len(items))) as pool:
        return pool.map(fn, items, chunksize=max(1, len(items) // (4 * workers)))


def _mm_rows(chunk):
    B, w, m, shift = _G['mm_B'], _G['mm_w'], _G['mm_m'], _G['mm_shift']
    out = []
    for row in chunk:
        acc = 0
        for a, pb in zip(row, B):
            if a:
                acc += a * pb
        f = unpack(acc, m, w)
        out.append([shift(v) for v in f])
    return out


def mat_exact(A, B, shift, workers):
    """C[i][j] = shift(sum_k A[i][k] B[k][j]) with exact integer dot products (Kronecker-packed rows of B)"""
    k = len(B)
    m = len(B[0])
    maxA = max(abs(x) for row in A for x in row) or 1
    maxB = max(abs(x) for row in B for x in row) or 1
    w = (k * maxA * maxB).bit_length() + 3
    _G['mm_B'] = [pack(row, w) for row in B]
    _G['mm_w'], _G['mm_m'], _G['mm_shift'] = w, m, shift
    n = len(A)
    step = max(1, n // (2 * max(1, workers)))
    chunks = [A[i:i + step] for i in range(0, n, step)]
    res = pmap(_mm_rows, chunks, workers)
    return [row for part in res for row in part]


def _shiftP(v):
    return v >> P


def mm(A, rA, B, rB, workers):
    """ball matrix product with a uniform entrywise radius"""
    C = mat_exact(A, B, _shiftP, workers)
    k = len(B)
    rowA = max(sum(abs(x) for x in row) for row in A)
    colB = max(sum(abs(B[i][j]) for i in range(k)) for j in range(len(B[0])))
    rad = ((rB * rowA + rA * colB + k * rA * rB) >> P) + 2
    return C, rad


def colnorm_hi(A, r):
    return max(sum(abs(A[i][j]) for i in range(len(A))) for j in range(len(A[0]))) + len(A) * r


def below(x_hi_ulps, cut):
    """x_hi / 2^P < cut (exact)"""
    cut = Fr(cut)
    return x_hi_ulps * cut.denominator < cut.numerator * ONE


def above(x_lo_ulps, cut):
    cut = Fr(cut)
    return x_lo_ulps * cut.denominator > cut.numerator * ONE


# ============================================================== Q(sqrt3) and its complex extension, exactly
class Q3:
    """a + b sqrt3, a, b rational"""
    __slots__ = ('a', 'b')

    def __init__(self, a=0, b=0):
        self.a, self.b = Fr(a), Fr(b)

    def __add__(self, o):
        return Q3(self.a + o.a, self.b + o.b)

    def __sub__(self, o):
        return Q3(self.a - o.a, self.b - o.b)

    def __mul__(self, o):
        if not isinstance(o, Q3):
            return Q3(self.a * o, self.b * o)
        return Q3(self.a * o.a + 3 * self.b * o.b, self.a * o.b + self.b * o.a)

    def __neg__(self):
        return Q3(-self.a, -self.b)

    def __eq__(self, o):
        return self.a == o.a and self.b == o.b

    def inv(self):
        d = self.a * self.a - 3 * self.b * self.b
        return Q3(self.a / d, -self.b / d)

    def num(self, s3):
        return q(self.a) + s3 * self.b


class C3:
    __slots__ = ('re', 'im')

    def __init__(self, re, im=None):
        self.re = re if isinstance(re, Q3) else Q3(re)
        self.im = im if isinstance(im, Q3) else Q3(0 if im is None else im)

    def __add__(self, o):
        return C3(self.re + o.re, self.im + o.im)

    def __sub__(self, o):
        return C3(self.re - o.re, self.im - o.im)

    def __mul__(self, o):
        if not isinstance(o, C3):
            o = C3(o if isinstance(o, Q3) else Q3(o))
        return C3(self.re * o.re - self.im * o.im, self.re * o.im + self.im * o.re)

    def __eq__(self, o):
        return self.re == o.re and self.im == o.im

    def conj(self):
        return C3(self.re, -self.im)

    def cball(self, s3):
        return cball(self.re.num(s3), self.im.num(s3))


H = Q3(0, Fr(1, 2))                                       # sqrt3 / 2
COS6 = [Q3(1), H, Q3(Fr(1, 2)), Q3(0), Q3(Fr(-1, 2)), -H, Q3(-1), -H, Q3(Fr(-1, 2)), Q3(0), Q3(Fr(1, 2)), H]
SIN6 = [Q3(0), Q3(Fr(1, 2)), H, Q3(1), H, Q3(Fr(1, 2)), Q3(0), Q3(Fr(-1, 2)), -H, Q3(-1), -H, Q3(Fr(-1, 2))]
COT12 = {1: Q3(2, 1), 2: Q3(0, 1), 3: Q3(1), 4: Q3(0, Fr(1, 3)), 5: Q3(2, -1), 6: Q3(0)}


def zeta(k):
    k %= 12
    return C3(COS6[k], SIN6[k])


def cot12(k):
    k %= 12
    if k == 0:
        raise ZeroDivisionError
    return COT12[k] if k <= 6 else -COT12[12 - k]


LRES = (0, 1, 3, 4, 7, 9)
F_NODES = [n for n in range(1, 169) if n % 12 in LRES]
IDX = {n: i for i, n in enumerate(F_NODES)}
NODES0 = [0] + F_NODES
LOW = [n for n in NODES0 if n <= 88]


def exact_layer():
    """P_l from the product, the node constants two ways, A_j(r), B_j(r) — all in Q(sqrt3)(i)"""
    poly = [C3(1)]
    for a in LRES:
        for _ in range(2):
            z = zeta(a)
            new = [C3(0)] * (len(poly) + 1)
            for i, c in enumerate(poly):
                new[i + 1] = new[i + 1] + c
                new[i] = new[i] - c * z
            poly = new
    Pl = {l: poly[l + 6] for l in range(-6, 7)}
    out = {'P': Pl}
    printed = [C3(5), C3(-1, Q3(0, 1)), C3(1, Q3(0, 1)), C3(-2), C3(Fr(-1, 2), H), C3(-1, Q3(0, -1)), C3(1)]
    out['printed_P'] = all(Pl[l] == printed[l] for l in range(7))
    out['conj_P'] = all(Pl[-l] == Pl[l].conj() for l in range(7))

    def S(n, wt):
        acc = C3(0)
        for l in range(-6, 7):
            acc = acc + Pl[l] * zeta(l * n) * Q3(Fr(wt(l)))
        return acc
    out['zeros'] = all(S(n, lambda l: 1) == C3(0) and S(n, lambda l: l) == C3(0) for n in LRES)
    Qtab = {0: Q3(Fr(1, 3)), 1: Q3(Fr(4, 3), Fr(-2, 3)), 3: Q3(Fr(4, 3), Fr(-2, 3)), 4: Q3(Fr(1, 3)),
            7: Q3(Fr(4, 3), Fr(2, 3)), 9: Q3(Fr(4, 3), Fr(2, 3))}             # Q_a / pi^2 as printed
    Dtab = {0: Q3(0, Fr(-7, 18)), 1: Q3(Fr(3, 18), Fr(1, 18)), 3: Q3(Fr(-3, 18), Fr(-1, 18)), 4: Q3(0, Fr(7, 18)),
            7: Q3(Fr(-3, 18), Fr(1, 18)), 9: Q3(Fr(3, 18), Fr(-1, 18))}       # D_a / pi as printed
    okQ = okD = okF = True
    for a in LRES:
        prod = Q3(Fr(1, 36))
        cs = Q3(0)
        for d in LRES:
            if d != a:
                prod = prod * (Q3(2) - COS6[(a - d) % 12] * 2)
                cs = cs + cot12(a - d)
        cs = cs * Fr(1, 6)
        okQ &= prod == Qtab[a]
        okD &= cs == Dtab[a]
        qf = S(a, lambda l: l * l) * Fr(-1, 72)                                # P''(a)/2 / pi^2
        df = S(a, lambda l: l ** 3) * C3(0, Q3(Fr(-1, 216)))                  # P'''(a) / pi^3
        okF &= qf.im == Q3(0) and qf.re == Qtab[a] and df.im == Q3(0) and df.re == Dtab[a] * Qtab[a] * 6
    out['Q_table'], out['D_table'], out['fourier_QD'] = okQ, okD, okF
    out['Q'], out['D'] = Qtab, Dtab
    A, Bj = {}, {}
    for j in range(1, 7):
        for r in LRES:
            a_ = C3(0)
            b_ = C3(0)
            for l in range(j, 7):
                t = Pl[l] * zeta(l * r)
                a_ = a_ + t * Fr(l, 6)
                b_ = b_ + t
            A[j, r], Bj[j, r] = a_, b_
    out['A'], out['B'] = A, Bj
    return out


# ============================================================== reading the paper
def read_paper(src):
    t = {k: src.text(v) for k, v in (('main', MAIN), ('s02', S02), ('s03', S03), ('s04', S04), ('s05', S05),
                                       ('s08', S08), ('s09', S09), ('readme', VREADME), ('manifest', MANIFEST))}
    s03 = t['s03']

    def table(label):
        m = re.search(r'\\label\{' + label + r'\}.*?\\midrule(.*?)\\bottomrule', s03, re.S)
        rows = []
        for line in m.group(1).strip().split('\n'):
            line = line.strip().rstrip('\\').strip()
            if line:
                rows.append([c.strip() for c in line.split('&')])
        return rows
    power = [(int(r[0]), Fr(r[1]), Fr(r[2]), Fr(r[3])) for r in table('table:power-bounds')]
    col = table('table:column-bounds')
    columns = {'X1': (Fr(col[0][1]), Fr(col[0][2])), 'X2': (Fr(col[1][1]), Fr(col[1][2])),
               'X12': (Fr(col[2][1]), Fr(col[2][2]))}
    sign = [[Fr(c) for c in r] for r in table('table:sign-bounds')]
    m = re.search(r'E\(k\)=\s*\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}\s*\+\\frac1k\s*\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}',
                  s03, re.S)
    e0 = [Fr(x.strip()) for x in m.group(1).split('\\\\')]
    e1 = [Fr(x.strip()) for x in m.group(2).split('\\\\')]
    s08 = t['s08']
    pst = re.search(r'p_\*=\{\}&([0-9.]+),', s08).group(1)
    bst = re.search(r'b_\*=\{\}&([0-9.]+)\.', s08).group(1)
    return t, dict(power=power, columns=columns, sign=sign, E0=e0, E1=e1, pstar=pst, bstar=bst)


ENDPOINTS = [Fr('2.36'), Fr('2.65'), Fr('3.2'), Fr(4), Fr(6), None]   # None = infinity
NODES5 = (1, 3, 4, 7, 9)


def halfgaps():
    out = []
    for m in LOW:
        i = NODES0.index(m)
        succ = NODES0[i + 1]
        out.append((m, Fr(succ - m, 2)))
        if m > 0:
            out.append((m, Fr(NODES0[i - 1] - m, 2)))
    return out


def group(m):
    return 0 if m == 0 else 1 if m == 1 else 2 if m in (3, 4) else 3


def target_support(m, y, K, J):
    """eq. target-support: (a*_r) as exact rationals times the exponentials, returned as a list of R"""
    if m == 0:
        eK = exp(q(K))
        return [eK / q(K) * (Fr((-K * y) ** r) / math.factorial(r)) for r in range(41)]
    if m == 1:
        return [q(K * (-K * y) ** r / math.factorial(r + 2)) for r in range(41)]
    if m == 3 and J is not None:
        return [exp(q(Fr(-13) * J / 6)) * (J / 2)] + [q(0)] * 40
    return [q(0)] * 41


def bern_weights():
    lcm = 1
    for r in range(41):
        lcm = lcm * math.comb(40, r) // math.gcd(lcm, math.comb(40, r))
    return lcm, [[math.comb(d, r) * (lcm // math.comb(40, r)) for r in range(d + 1)] for d in range(41)]


LCM40, BW = bern_weights()


# ============================================================== route A: enclosures of the exact quadrature arrays
def _a_dstage(n):
    g = _G
    acc_a = acc_b = 0
    sg0 = sg1 = 0
    rg0 = rg1 = 0
    PRW, PIW, lam, gp, ipz = g['PRW'], g['PIW'], g['lam'], g['Gp'], g['ipz']
    for t in range(len(PRW)):
        g0 = cmul(lam[t], gp[t][n])
        g1 = cmul(g0, ipz[t])
        acc_a += g0[0] * PRW[t] - g0[1] * PIW[t]
        acc_b += g1[0] * PRW[t] - g1[1] * PIW[t]
        sg0 += abs(g0[0]) + abs(g0[1])
        sg1 += abs(g1[0]) + abs(g1[1])
        rg0 = max(rg0, g0[2])
        rg1 = max(rg1, g1[2])
    w = g['SD']
    a = [v >> P for v in unpack(acc_a, 171, w)]
    b = [v >> P for v in unpack(acc_b, 171, w)]
    return a, b, sg0, sg1, rg0, rg1


def _a_moments(m):
    g = _G
    PRm, PIm, pa, ua, e1p, gp = g['PRm'], g['PIm'], g['pa'], g['ua'], g['E1p'], g['Gp']
    na = 43
    SF = [0] * na
    SG = [0] * na
    fmax = gmax = 0
    rf = rg = 0
    for t in range(len(PRm)):
        pr, pi_ = PRm[t], PIm[t]
        er, ei, re_ = e1p[t][m]
        fr, fi = er, -ei                         # e^{i pi t m} = conj(e^{-i pi t m})
        nr = fr * pr - fi * pi_
        ni = fr * pi_ + fi * pr
        pat = pa[t]
        for a in range(na):
            x = pat[a]
            SF[a] += x[0] * nr - x[1] * ni
        gr, gi, rgg = gp[t][m]
        mr = gr * pr - gi * pi_
        mi = gr * pi_ + gi * pr
        uat = ua[t]
        for a in range(na):
            x = uat[a]
            SG[a] += x[0] * mr - x[1] * mi
        fmax = max(fmax, abs(fr) + abs(fi))
        gmax = max(gmax, abs(gr) + abs(gi))
        rf = max(rf, re_)
        rg = max(rg, rgg)
    w = g['SM']
    sf = [[v >> (2 * P) for v in unpack(x, 20, w)] for x in SF]
    sg = [[v >> (2 * P) for v in unpack(x, 20, w)] for x in SG]
    return sf, sg, fmax, rf, gmax, rg


def _route_a_core(par, workers, log):
    t0 = time.time()
    ex = par['exact']
    out = {}
    s3 = sqrt(q(3))
    b = s3 / 2
    h = Fr(2, 5)
    B = Fr(4, 3)
    Qr = {a: ex['Q'][a].num(s3) * PI * PI for a in LRES}
    Dr = {a: ex['D'][a].num(s3) * PI for a in LRES}
    out['Qr'], out['Dr'] = Qr, Dr
    # quadrature: cos(pi k / 768)
    base = {}
    for k in range(385):
        base[k] = cos_sin(PI * Fr(k, 768))[0]

    def CT(k):
        k %= 1536
        if k > 768:
            k = 1536 - k
        return base[k] if k <= 384 else -base[768 - k]
    ov = []
    for v in range(384):
        s = q(0)
        for a in range(1, 192):
            s = s + CT(2 * a * (2 * v + 1)) / (4 * a * a - 1)
        ov.append((q(1) - s * 2) / 384)
    out['o_min'] = min(o.lo for o in ov)
    tot = sum(ov, q(0))
    out['o_sum'] = tot
    tau = [[(q(2 * j - 1) + CT(2 * v + 1)) / 12 for v in range(384)] for j in range(1, 7)]
    pts = [tau[j][v] for j in range(6) for v in range(384)] + [q(Fr(l, 6)) for l in range(7)]
    T = len(pts)
    log('A: quadrature rule built (%.1fs)' % (time.time() - t0))
    # per-point transcendental data
    E1b, lamb, Gzb, ipzb, pab, uab = [], [], [], [], [], []
    hh = q(h * h)
    for t in pts:
        c, s = cos_sin(PI * t)
        E1b.append(cball(c, -s))
        inv = (t * t + hh).recip()
        zr = -(t * inv) * B
        zi = inv * (B * h) - h
        lamb.append(cball(inv * h / b, t * inv / b))
        cz, sz = cos_sin(PI * zr)
        ez = exp(-(PI * zi))
        Gzb.append(cball(ez * cz, ez * sz))
        ip = cball(-(PI * zi), PI * zr)
        ipzb.append(ip)
        it = cball(q(0), PI * t)
        pa = [(ONE, 0, 0)]
        for a in range(1, 43):
            pa.append(cdivint(cmul(pa[-1], it), a))
        pab.append(pa)
        ua = [lamb[-1]]
        for a in range(1, 43):
            ua.append(cdivint(cmul(ua[-1], ip), a))
        uab.append(ua)
    # powers, kept at the nodes 0, F
    keep = set(NODES0)
    E1p, Gp = [], []
    for t in range(T):
        e, g = (ONE, 0, 0), (ONE, 0, 0)
        de, dg = {0: e}, {0: g}
        e1 = (E1b[t][0], E1b[t][1], 2 * E1b[t][2])       # componentwise radius r -> modulus radius <= 2r
        gz = (Gzb[t][0], Gzb[t][1], 2 * Gzb[t][2])
        for n in range(1, 169):
            e = cmul_disc(e, e1)
            g = cmul_disc(g, gz)
            if n in keep:
                de[n] = e
                dg[n] = g
        E1p.append(de)
        Gp.append(dg)
    log('A: per-point data and powers (%.1fs)' % (time.time() - t0))
    # masses W (2311 x 171 complex)
    Ab = {k: v.cball(s3) for k, v in ex['A'].items()}
    Bb = {k: v.cball(s3) for k, v in ex['B'].items()}
    WR, WI = [], []
    rW = 0
    pisq3 = PI * PI / 3
    for p in range(T):
        rowr = [0] * 171
        rowi = [0] * 171
        if p < 2304:
            j = p // 384 + 1
            v = p % 384
            t = pts[p]
            c1 = ball(-(pisq3 * ov[v]))
            c2 = ball(PI / 3 * ov[v])
            tb = ball(t)
            AB = {r: (lambda x, y: (x[0] - y[0], x[1] - y[1], x[2] + y[2]))(Ab[j, r], rcmul(tb, Bb[j, r])) for r in LRES}
            for n in NODES0:
                e = E1p[p][n]
                wc = rcmul(c1, cmul(e, AB[n % 12]))
                wd = rcmul(c2, cmul(e, Bb[j, n % 12]))
                ci, di = (IDX[n], 84 + IDX[n]) if n else (168, 169)
                rowr[ci], rowi[ci] = wc[0], wc[1]
                rowr[di], rowi[di] = -wd[1], wd[0]                  # times i
                rW = max(rW, wc[2], wd[2])
        else:
            l = p - 2304
            x = (ex['P'][l] * (1 if l == 0 else 2)).cball(s3)
            rowr[170], rowi[170] = x[0], x[1]
            rW = max(rW, x[2])
        WR.append(rowr)
        WI.append(rowi)
    out['W'] = (WR, WI, rW)
    log('A: mass matrix W (%.1fs), radius %d ulps' % (time.time() - t0, rW))
    # jet projection: D = S~_FF, S~_Fe
    maxW = max(max(abs(x) for x in WR[t]) + max(abs(x) for x in WI[t]) for t in range(T))
    maxG = 64 * ONE
    SD = (T * maxG * maxW * 4).bit_length() + 3
    _G.update(PRW=[pack(WR[t], SD) for t in range(T)], PIW=[pack(WI[t], SD) for t in range(T)], lam=lamb, Gp=Gp,
              ipz=ipzb, SD=SD)
    res = pmap(_a_dstage, F_NODES, workers)
    Wcol = max(sum(abs(WR[t][c]) + abs(WI[t][c]) for t in range(T)) for c in range(171))
    rows_c, rows_d = [], []
    rS = 0
    for n, (a, bb, sg0, sg1, rg0, rg1) in zip(F_NODES, res):
        ra = ((rW * sg0 + rg0 * Wcol + 2 * T * rg0 * rW) >> P) + 2
        rb = ((rW * sg1 + rg1 * Wcol + 2 * T * rg1 * rW) >> P) + 2
        r_ = n % 12
        qneg = ball(-(Qr[r_].recip()))
        qinv = ball(Qr[r_].recip())
        dball = ball(Dr[r_])
        amax = max(abs(x) for x in a)
        rowc = [(x * qneg[0]) >> P for x in a]
        rc = ((amax * qneg[1] + ra * abs(qneg[0]) + ra * qneg[1]) >> P) + 2
        da = [(x * dball[0]) >> P for x in a]
        rda = ((amax * dball[1] + ra * abs(dball[0]) + ra * dball[1]) >> P) + 2
        diff = [x - y for x, y in zip(da, bb)]
        rdiff = rda + rb
        dmax = max(abs(x) for x in diff)
        rowd = [(x * qinv[0]) >> P for x in diff]
        rd = ((dmax * qinv[1] + rdiff * abs(qinv[0]) + rdiff * qinv[1]) >> P) + 2
        rows_c.append(rowc)
        rows_d.append(rowd)
        rS = max(rS, rc, rd)
    Sfull = rows_c + rows_d
    D = [row[:168] for row in Sfull]
    SFe = [row[168:] for row in Sfull]
    out['S'] = (Sfull, rS)
    log('A: D and S_Fe (%.1fs), radius %d ulps' % (time.time() - t0, rS))
    # nine doubling steps
    U, rU = D, rS
    I168 = [[ONE if i == j else 0 for j in range(168)] for i in range(168)]
    Vp, rVp = [r[:] for r in I168], 0
    Vm, rVm = [r[:] for r in I168], 0
    power = []
    for r in range(9):
        nU = colnorm_hi(U, rU)
        VU, rVU = mm(Vp, rVp, U, rU, workers)
        Vp = [[x + y for x, y in zip(a, b_)] for a, b_ in zip(Vp, VU)]
        rVp += rVU
        WU, rWU = mm(Vm, rVm, U, rU, workers)
        sgn = -1 if r == 0 else 1
        Vm = [[x + sgn * y for x, y in zip(a, b_)] for a, b_ in zip(Vm, WU)]
        rVm += rWU
        power.append((nU, colnorm_hi(Vp, rVp), colnorm_hi(Vm, rVm)))
        if r < 8:
            U, rU = mm(U, rU, U, rU, workers)
    out['power'] = power
    out['V'] = (Vp, rVp, Vm, rVm)
    log('A: power table (%.1fs), radii V+ %d, V- %d ulps' % (time.time() - t0, rVp, rVm))
    return dict(out=out, Qr=Qr, Dr=Dr, T=T, Gp=Gp, E1p=E1p, pab=pab, uab=uab, WR=WR, WI=WI, rW=rW, maxW=maxW,
                SFe=SFe, rS=rS, Vp=Vp, rVp=rVp, Vm=Vm, rVm=rVm)


_CORE = {}


def route_a(par, workers, log):
    if 'A' not in _CORE:
        _CORE['A'] = _route_a_core(par, workers, log)
    c = _CORE['A']
    t0 = time.time()
    out = dict(c['out'])
    Qr, Dr, T, Gp, E1p, pab, uab = c['Qr'], c['Dr'], c['T'], c['Gp'], c['E1p'], c['pab'], c['uab']
    WR, WI, rW, maxW, SFe, rS = c['WR'], c['WI'], c['rW'], c['maxW'], c['SFe'], c['rS']
    Vp, rVp, Vm, rVm = c['Vp'], c['rVp'], c['Vm'], c['rVm']
    # Y, g1, g2, X
    E0, E1v = par['E0'], par['E1']
    E1m = [[Fr(0)] * 10 for _ in range(3)]
    E2m = [[Fr(0)] * 10 for _ in range(3)]
    for k in range(3):
        E1m[k][0], E1m[k][5] = E0[k], E1v[k]
        E2m[k][0], E2m[k][5] = E0[3 + k], E1v[3 + k]
    Y = [[0] * 10 for _ in range(168)]
    rY = 0
    for jj, n in enumerate(NODES5):
        qi = ball(Qr[n % 12].recip())
        qn = ball(-(Qr[n % 12].recip()))
        dq = ball(-(Dr[n % 12] / Qr[n % 12]))
        Y[84 + IDX[n]][jj] = qn[0]
        Y[IDX[n]][jj + 5] = qi[0]
        Y[84 + IDX[n]][jj + 5] = dq[0]
        rY = max(rY, qi[1], qn[1], dq[1])

    def smul(Sm, rs, Em):
        res_, rr = [], 0
        for row in Sm:
            nr = []
            for c in range(10):
                acc = Fr(0)
                for k in range(3):
                    if Em[k][c]:
                        acc += row[k] * Em[k][c]
                nr.append(math.floor(acc))
            res_.append(nr)
        cs = max(sum(abs(Em[k][c]) for k in range(3)) for c in range(10))
        return res_, math.ceil(rs * cs) + 1
    SE2, rSE2 = smul(SFe, rS, E2m)
    SE1, rSE1 = smul(SFe, rS, E1m)
    g1 = [[a + b_ for a, b_ in zip(x, y)] for x, y in zip(Y, SE2)]
    rg1 = rY + rSE2
    Gp_ = [[a + b_ for a, b_ in zip(x, y)] for x, y in zip(g1, SE1)]
    Gm_ = [[a - b_ for a, b_ in zip(x, y)] for x, y in zip(g1, SE1)]
    rG = rg1 + rSE1
    VpG, rVpG = mm(Vp, rVp, Gp_, rG, workers)
    VmG, rVmG = mm(Vm, rVm, Gm_, rG, workers)
    rXF = (rVpG + rVmG + 1) // 2 + 1
    X1F = [[(a + b_) >> 1 for a, b_ in zip(x, y)] for x, y in zip(VpG, VmG)]
    X2F = [[(a - b_) >> 1 for a, b_ in zip(x, y)] for x, y in zip(VpG, VmG)]
    Eb1 = [[q(Em).lo for Em in row] for row in E1m]
    Eb2 = [[q(Em).lo for Em in row] for row in E2m]
    X1 = X1F + Eb1
    X2 = X2F + Eb2
    rX = rXF + 1
    out['X'] = (X1, X2, rX)
    cn = {}
    for key, Xm in (('X1', X1), ('X2', X2)):
        cn[key] = [sum(abs(Xm[i][c]) for i in range(171)) + 171 * rX for c in range(10)]
    cn['X12'] = [cn['X1'][c] + cn['X2'][c] for c in range(10)]
    out['colnorms'] = cn
    log('A: X_1, X_2 (%.1fs), radius %d ulps' % (time.time() - t0, rX))
    # mu = W X_i (both lists, 20 real columns), complex
    SXw = (171 * max(abs(x) for row in X1 + X2 for x in row) * maxW * 4).bit_length() + 3
    PX = [pack(X1[c] + X2[c], SXw) for c in range(171)]
    muR, muI = [], []
    for t in range(T):
        ar = ai = 0
        wr, wi = WR[t], WI[t]
        for c in range(171):
            if wr[c]:
                ar += wr[c] * PX[c]
            if wi[c]:
                ai += wi[c] * PX[c]
        muR.append([v >> P for v in unpack(ar, 20, SXw)])
        muI.append([v >> P for v in unpack(ai, 20, SXw)])
    xcol = max(sum(abs(Xm[i][c]) for i in range(171)) for Xm in (X1, X2) for c in range(10))
    wrow = max(max(sum(abs(x) for x in WR[t]), sum(abs(x) for x in WI[t])) for t in range(T))
    rmu = ((rX * wrow + rW * xcol + 171 * rX * rW) >> P) + 2
    log('A: mu = W X (%.1fs), radius %d ulps' % (time.time() - t0, rmu))
    # moments at the 46 centres
    mumax = max(abs(muR[t][c]) + abs(muI[t][c]) for t in range(T) for c in range(20))
    SM = (T * mumax * (ONE * 4) * (ONE << 16) * 8).bit_length() + 3
    _G.update(PRm=[pack(muR[t], SM) for t in range(T)], PIm=[pack(muI[t], SM) for t in range(T)], pa=pab, ua=uab,
              E1p=E1p, SM=SM)
    centres = LOW
    mres = dict(zip(centres, pmap(_a_moments, centres, workers)))
    log('A: moments at %d centres (%.1fs)' % (len(centres), time.time() - t0))
    pamax = [max(abs(pab[t][a][0]) + abs(pab[t][a][1]) for t in range(T)) for a in range(43)]
    parad = [max(pab[t][a][2] for t in range(T)) for a in range(43)]
    uamax = [max(abs(uab[t][a][0]) + abs(uab[t][a][1]) for t in range(T)) for a in range(43)]
    uarad = [max(uab[t][a][2] for t in range(T)) for a in range(43)]

    def mrad(xmax, xr, fmax, rf):
        big = (xmax + 2 * xr) * (fmax + 2 * rf) * (mumax + 2 * rmu) - xmax * fmax * mumax
        return ((T * big) >> (2 * P)) + 2
    # Bernstein rows, boxes, comparisons
    EK = {}
    for K in ENDPOINTS[:-1]:
        EK[K] = [exp(q(-K * (n - 1))) for n in NODES5]
    hg = halfgaps()
    out['n_halfgaps'] = len(hg)
    lows = []                 # (m, y, i, J_i, d, rigorous lower bound in ulps); compared with the table in decide()
    Lstore = {}
    for (m, y) in hg:
        sf, sg, fmax, rf, gmax, rgm = mres[m]
        nu = 0 if m == 0 else 2
        yn, yd = y.numerator, y.denominator
        for i in (1, 2):
            sig = -1 if i == 1 else 1
            lrows, lrad = [], []
            for r in range(41):
                a = r + nu
                blkF = sf[a][(i - 1) * 10:(i - 1) * 10 + 10]
                blkG = sg[a][(2 - i) * 10:(2 - i) * 10 + 10]
                rad = mrad(pamax[a], parad[a], fmax, rf) + mrad(uamax[a], uarad[a], gmax, rgm)
                yr_n, yr_d = yn ** r, yd ** r
                lrows.append([(sig * (x + z) * yr_n) // yr_d for x, z in zip(blkF, blkG)])
                lrad.append(-((-rad * abs(yr_n)) // yr_d) + 1)
            Lrows = []
            for d in range(41):
                wts = BW[d]
                num = [sum(wts[r] * lrows[r][c] for r in range(d + 1)) for c in range(10)]
                rad = -((-sum(wts[r] * lrad[r] for r in range(d + 1))) // LCM40) + 1
                Lstore[m, y, i, d] = ([x // LCM40 for x in num], rad)
                Lrows.append([R(x // LCM40 - rad, x // LCM40 + rad) for x in num])
            for J_i, K in enumerate(ENDPOINTS[:-1]):
                J = ENDPOINTS[J_i + 1]
                ts = target_support(m, y, K, J) if i == 1 else None
                xs = [Fr(1) / K, (Fr(1) / J) if J is not None else Fr(0)]
                for d in range(41):
                    wts = BW[d]
                    row = Lrows[d]
                    lo = None
                    for x in xs:
                        tot = (row[0] + row[5] * x).lo
                        for jj in range(1, 5):
                            v = row[jj] + row[jj + 5] * x
                            c1 = (v * EK[K][jj]).lo
                            c2 = (v * EK[J][jj]).lo if J is not None else 0
                            tot += min(c1, c2)
                        lo = tot if lo is None else min(lo, tot)
                    if ts is not None:
                        tsum = sum((ts[r] * Fr(wts[r], LCM40) for r in range(d + 1)), q(0))
                        lo += tsum.lo
                    lows.append((m, y, i, J_i, d, lo))
    out['lows'] = lows
    out['L'] = Lstore
    log('A: %d Bernstein lower bounds (%.1fs)' % (len(lows), time.time() - t0))
    # tail
    s0 = Fr(179, 2)
    tails = {}
    for i, Xm in ((1, X1), (2, X2)):
        sig = -1 if i == 1 else 1

        def rowR(idx):
            return [R(sig * x - rX, sig * x + rX) for x in Xm[idx]]

        def low(row, K, J):
            xs = [Fr(1) / K, (Fr(1) / J) if J is not None else Fr(0)]
            best = None
            for x in xs:
                tot = (row[0] + row[5] * x).lo
                for jj in range(1, 5):
                    v = row[jj] + row[jj + 5] * x
                    c1 = (v * EK[K][jj]).lo
                    c2 = (v * EK[J][jj]).lo if J is not None else 0
                    tot += min(c1, c2)
                best = tot if best is None else min(best, tot)
            return best
        cidx = {n: (IDX[n] if n else 168) for n in LOW}
        didx = {n: (84 + IDX[n] if n else 169) for n in LOW}
        for J_i, K in enumerate(ENDPOINTS[:-1]):
            J = ENDPOINTS[J_i + 1]
            c_lo = low(rowR(170), K, J)
            val = R(c_lo, c_lo)
            dsum = [R(0, 0)] * 10
            for n in LOW:
                dsum = [a + b_ for a, b_ in zip(dsum, rowR(didx[n]))]
            dl = min(0, low(dsum, K, J))
            val = val + R(dl, dl) * (1 / s0)
            for n in LOW:
                u = min(0, low(rowR(cidx[n]), K, J))
                dd = min(0, low(rowR(didx[n]), K, J))
                val = val + R(u, u) * (1 / (s0 - n) ** 2) + R(dd, dd) * (n / (s0 * (s0 - n)))
            tails[i, J_i] = val.lo
    out['tail'] = tails
    log('A: tail (%.1fs)' % (time.time() - t0))
    out['seconds'] = time.time() - t0
    return out


# ============================================================== route B: the floor-rounded listing, exactly
EPS_S = 10 ** 80
SJ = [EPS_S * j for j in range(1, 61)]
DOM = {'max_abs2': Fr(0), 'max_re': None, 'calls': 0, 'bad': 0}


def e_star(Nr, Ni, Den):
    """e_* of eq. rational-exponential for w = (Nr + i Ni) / Den, returned as integers times 1e-80"""
    S = EPS_S
    d4 = Den * 4096
    ur = (S * Nr) // d4
    ui = (S * Ni) // d4
    dr, di = S, 0
    xr, xi = S, 0
    if ur == 0:
        for Sj in SJ:
            dr, di = (-di * ui) // Sj, (dr * ui) // Sj
            xr += dr
            xi += di
    elif ui == 0:
        for Sj in SJ:
            dr, di = (dr * ur) // Sj, (di * ur) // Sj
            xr += dr
            xi += di
    else:
        for Sj in SJ:
            dr, di = (dr * ur - di * ui) // Sj, (dr * ui + di * ur) // Sj
            xr += dr
            xi += di
    for _ in range(12):
        xr, xi = (xr * xr - xi * xi) // S, (2 * xr * xi) // S
    return xr, xi


def dom_ok(Nr, Ni, Den):
    """|w| < 1700 and Re w < 7 for w = (Nr + i Ni)/Den, Den > 0"""
    return Nr * Nr + Ni * Ni < 1700 * 1700 * Den * Den and Nr < 7 * Den


def _b_weights(v):
    g = _G
    S, PST, LCMW = EPS_S, g['PST'], g['LCMW']
    ok = True
    acc = 0
    for d in range(1, 192):
        Ni, Den = 2 * d * PST * (2 * v + 1), 768 * S
        ok &= dom_ok(0, Ni, Den)
        c = e_star(0, Ni, Den)[0]
        acc += c * (LCMW // (4 * d * d - 1))
    o = (S * LCMW - 2 * acc) // (384 * LCMW)
    Ni, Den = PST * (2 * v + 1), 768 * S
    ok &= dom_ok(0, Ni, Den)
    c = e_star(0, Ni, Den)[0]
    taus = [(S * (2 * j - 1) + c) // 12 for j in range(1, 7)]
    return o, taus, ok


def _b_wrow(p):
    g = _G
    S, PST = EPS_S, g['PST']
    j = p // 384 + 1
    v = p % 384
    O = g['o'][v]
    T = g['tau'][j - 1][v]
    El, Pl2 = g['El'], g['Pl2']
    rowr = [0] * 171
    rowi = [0] * 171
    ok = True
    Kc = O * PST
    S4 = 6 * S ** 4
    S6 = 36 * S ** 6
    for n in NODES0:
        Ni, Den = -PST * T * n, S * S
        ok &= dom_ok(0, Ni, Den)
        er, ei = e_star(0, Ni, Den)
        sr = si = 0       # sum_l (l S - 6T) N_l
        ar = ai = 0       # sum_l N_l
        for l in range(j, 7):
            pr, pi_ = Pl2[l]
            lr, li = El[l, n]
            # N_l = Kc * E * P_l * El
            xr = er * pr - ei * pi_
            xi = er * pi_ + ei * pr
            yr = xr * lr - xi * li
            yi = xr * li + xi * lr
            Nr_, Ni_ = Kc * yr, Kc * yi
            f = l * S - 6 * T
            sr += f * Nr_
            si += f * Ni_
            ar += Nr_
            ai += Ni_
        ci, di = (IDX[n], 84 + IDX[n]) if n else (168, 169)
        rowr[ci] = (-PST * sr) // S6
        rowi[ci] = (-PST * si) // S6
        rowr[di] = (-ai) // S4
        rowi[di] = ar // S4
    return rowr, rowi, ok


def _b_f0g0(m):
    g = _G
    S, PST = EPS_S, g['PST']
    F0, G0 = [], []
    ok = True
    for k in range(len(g['tn'])):
        tn, td = g['tn'][k], g['td'][k]
        Ni, Den = PST * tn * m, S * td
        ok &= dom_ok(0, Ni, Den)
        F0.append(e_star(0, Ni, Den))
        Zr, Zi = g['Z'][k]
        Nr, Ni2, Den2 = -PST * Zi * m, PST * Zr * m, S * S
        ok &= dom_ok(Nr, Ni2, Den2)
        er, ei = e_star(Nr, Ni2, Den2)
        Lr, Li = g['Lam'][k]
        G0.append(((Lr * er - Li * ei) // S, (Lr * ei + Li * er) // S))
    return m, F0, G0, ok


def _b_srow(n):
    g = _G
    S, PST = EPS_S, g['PST']
    F0, G0 = g['F0'][n], g['G0'][n]
    PR, PI_, w = g['PRW'], g['PIW'], g['SW']
    acc_a = acc_d = 0
    S2 = S * S
    for k in range(len(PR)):
        gr, gi = G0[k]
        Zr, Zi = g['Z'][k]
        pr = -gr * Zi - gi * Zr
        pi_ = gr * Zr - gi * Zi
        g1r, g1i = (pr * PST) // S2, (pi_ * PST) // S2        # G[1] = R(G[0] i p* z y / 1), y = 1
        acc_a += gr * PR[k] - gi * PI_[k]
        acc_d += g1r * PR[k] - g1i * PI_[k]
    return unpack(acc_a, 171, w), unpack(acc_d, 171, w)


def _b_halfgap(idx):
    g = _G
    S, PST = EPS_S, g['PST']
    m, y = g['HG'][idx]
    nu = 0 if m == 0 else 2
    deg = 40 + nu
    F0, G0 = g['F0'][m], g['G0'][m]
    PR, PI_, w = g['PRX'], g['PIX'], g['SX']
    yn, yd = y.numerator, y.denominator
    SF = [0] * (deg + 1)
    SG = [0] * (deg + 1)
    Kg = PST * yn
    Dg = S * S * yd
    Dga = [Dg * a for a in range(deg + 1)]
    for k in range(len(PR)):
        prk, pik = PR[k], PI_[k]
        fr, fi = F0[k]
        Kt = PST * g['tn'][k] * yn
        Dt = S * g['td'][k] * yd
        SF[0] += fr * prk - fi * pik
        for a in range(1, deg + 1):
            da = Dt * a
            fr, fi = (-fi * Kt) // da, (fr * Kt) // da
            SF[a] += fr * prk - fi * pik
        gr, gi = G0[k]
        Zr, Zi = g['Z'][k]
        SG[0] += gr * prk - gi * pik
        for a in range(1, deg + 1):
            pr = -gr * Zi - gi * Zr
            pi_ = gr * Zr - gi * Zi
            gr, gi = (pr * Kg) // Dga[a], (pi_ * Kg) // Dga[a]
            SG[a] += gr * prk - gi * pik
    return [unpack(x, 20, w) for x in SF], [unpack(x, 20, w) for x in SG]


def route_b(par, workers, log):
    t0 = time.time()
    S = EPS_S
    PST = int(par['pstar'].replace('.', ''))
    BST = int(par['bstar'].replace('.', ''))
    assert len(par['pstar'].split('.')[1]) == 80 and len(par['bstar'].split('.')[1]) == 80
    out = {'dom_ok': True}
    LCMW = 1
    for d in range(1, 192):
        LCMW = LCMW * (4 * d * d - 1) // math.gcd(LCMW, 4 * d * d - 1)
    _G.update(PST=PST, LCMW=LCMW)
    wres = pmap(_b_weights, range(384), workers)
    o = [x[0] for x in wres]
    tau = [[wres[v][1][j] for v in range(384)] for j in range(6)]
    out['dom_ok'] &= all(x[2] for x in wres)
    out['o'], out['tau'] = o, tau
    log('B: weights and points (%.1fs)' % (time.time() - t0))
    # P_l after b -> b*, scaled by 2S;   e_star(i p* t_l n) for every l, n
    Pre = [5, -1, 1, -2, Fr(-1, 2), -1, 1]
    Pim = [0, 2, 2, 0, 1, -2, 0]                                # multiples of b*
    Pl2 = {l: (int(Pre[l] * 2 * S), 2 * Pim[l] * BST) for l in range(7)}
    El = {}
    for l in range(7):
        for n in NODES0:
            Ni, Den = PST * l * n, 6 * S
            out['dom_ok'] &= dom_ok(0, Ni, Den)
            El[l, n] = e_star(0, Ni, Den)
    _G.update(o=o, tau=tau, El=El, Pl2=Pl2)
    rows = pmap(_b_wrow, range(2304), workers)
    WR = [r[0] for r in rows]
    WI = [r[1] for r in rows]
    out['dom_ok'] &= all(r[2] for r in rows)
    for l in range(7):
        e = 1 if l == 0 else 2
        rr = [0] * 171
        ri = [0] * 171
        rr[170] = (e * Pl2[l][0]) // 2
        ri[170] = (e * Pl2[l][1]) // 2
        WR.append(rr)
        WI.append(ri)
    out['W'] = (WR, WI)
    log('B: W# (%.1fs)' % (time.time() - t0))
    # points, z, lambda
    tn = [tau[j][v] for j in range(6) for v in range(384)] + list(range(7))
    td = [S] * 2304 + [6] * 7
    h, B = Fr(2, 5), Fr(4, 3)
    Zs, Lams = [], []
    for k in range(len(tn)):
        t = Fr(tn[k], td[k])
        den = t * t + h * h
        zr = -B * t / den
        zi = B * h / den - h
        Zs.append((math.floor(zr * S), math.floor(zi * S)))
        lr = h * S * S / (BST * den)
        li = t * S * S / (BST * den)
        Lams.append((math.floor(lr), math.floor(li)))
    _G.update(tn=tn, td=td, Z=Zs, Lam=Lams)
    f0g0 = pmap(_b_f0g0, NODES0, workers)
    F0 = {x[0]: x[1] for x in f0g0}
    G0 = {x[0]: x[2] for x in f0g0}
    out['dom_ok'] &= all(x[3] for x in f0g0)
    log('B: F0, G0 at %d nodes (%.1fs)' % (len(NODES0), time.time() - t0))
    # S#: rows c(m), d(m)
    pst, b2 = Fr(PST, S), Fr(2 * BST, S)                      # p*, sqrt3 -> 2 b*
    Qs = {0: pst * pst / 3, 4: pst * pst / 3, 1: 2 * pst * pst / 3 * (2 - b2), 3: 2 * pst * pst / 3 * (2 - b2),
          7: 2 * pst * pst / 3 * (2 + b2), 9: 2 * pst * pst / 3 * (2 + b2)}
    Ds = {0: -7 * pst * b2 / 18, 4: 7 * pst * b2 / 18, 1: pst * (3 + b2) / 18, 3: -pst * (3 + b2) / 18,
          7: -pst * (3 - b2) / 18, 9: pst * (3 - b2) / 18}
    T = len(tn)
    maxW = max(max(abs(x) for x in WR[k]) + max(abs(x) for x in WI[k]) for k in range(T))
    SW = (T * 8 * S * maxW * 64).bit_length() + 3
    _G.update(F0=F0, G0=G0, PRW=[pack(WR[k], SW) for k in range(T)], PIW=[pack(WI[k], SW) for k in range(T)], SW=SW)
    sres = pmap(_b_srow, F_NODES, workers)
    Sc, Sd = [], []
    for n, (a, d) in zip(F_NODES, sres):
        Qm, Dm = Qs[n % 12], Ds[n % 12]
        # R(-a/Q):  a = a_int / S^2
        Sc.append([math.floor(Fr(-x, S) / Qm) for x in a])
        Sd.append([math.floor((Dm * x - y) / (S * Qm)) for x, y in zip(a, d)])
    Ssh = Sc + Sd
    out['S'] = Ssh
    log('B: S# (%.1fs)' % (time.time() - t0))
    Ysh = [[0] * 10 for _ in range(168)]
    for jj, n in enumerate(NODES5):
        Qm, Dm = Qs[n % 12], Ds[n % 12]
        Ysh[84 + IDX[n]][jj] = math.floor(-S / Qm)
        Ysh[IDX[n]][jj + 5] = math.floor(S / Qm)
        Ysh[84 + IDX[n]][jj + 5] = math.floor(-Dm * S / Qm)
    U = [row[:168] for row in Ssh]
    Se = [row[168:] for row in Ssh]
    vp = [[S if i == j else 0 for j in range(168)] for i in range(168)]
    vm = [r[:] for r in vp]

    def fl(v):
        return v // S

    def nfl(v):
        return (-v) // S
    power = []
    for r in range(9):
        vp = [[x + y for x, y in zip(a, b_)] for a, b_ in zip(vp, mat_exact(vp, U, fl, workers))]
        vm = [[x + y for x, y in zip(a, b_)] for a, b_ in zip(vm, mat_exact(vm, U, nfl if r == 0 else fl, workers))]
        cn = [max(sum(abs(Mx[i][j]) for i in range(168)) for j in range(168)) for Mx in (U, vp, vm)]
        power.append(tuple(Fr(x, S) for x in cn))
        if r < 8:
            U = mat_exact(U, U, fl, workers)
    out['power'] = power
    log('B: power table (%.1fs)' % (time.time() - t0))
    E0, E1v = par['E0'], par['E1']
    E1i = [[0] * 10 for _ in range(3)]
    E2i = [[0] * 10 for _ in range(3)]
    for k in range(3):
        E1i[k][0], E1i[k][5] = int(E0[k] * 10 ** 4), int(E1v[k] * 10 ** 4)
        E2i[k][0], E2i[k][5] = int(E0[3 + k] * 10 ** 4), int(E1v[3 + k] * 10 ** 4)
        assert Fr(E1i[k][0], 10 ** 4) == E0[k] and Fr(E2i[k][5], 10 ** 4) == E1v[3 + k]
    g1 = [[Ysh[i][c] * 10 ** 4 + sum(Se[i][k] * E2i[k][c] for k in range(3)) for c in range(10)] for i in range(168)]
    g2 = [[sum(Se[i][k] * E1i[k][c] for k in range(3)) for c in range(10)] for i in range(168)]
    gp = [[a + b_ for a, b_ in zip(x, y)] for x, y in zip(g1, g2)]
    gm = [[a - b_ for a, b_ in zip(x, y)] for x, y in zip(g1, g2)]
    A1 = mat_exact(vp, gp, lambda v: v, workers)
    A2 = mat_exact(vm, gm, lambda v: v, workers)
    den = 2 * S * 10 ** 4
    X1 = [[(a + b_) // den for a, b_ in zip(x, y)] for x, y in zip(A1, A2)]
    X2 = [[(a - b_) // den for a, b_ in zip(x, y)] for x, y in zip(A1, A2)]
    X1 += [[x * S // 10 ** 4 for x in row] for row in E1i]
    X2 += [[x * S // 10 ** 4 for x in row] for row in E2i]
    out['X'] = (X1, X2)
    cn = {}
    for key, Xm in (('X1', X1), ('X2', X2)):
        cn[key] = [Fr(sum(abs(Xm[i][c]) for i in range(171)), S) for c in range(10)]
    cn['X12'] = [cn['X1'][c] + cn['X2'][c] for c in range(10)]
    out['colnorms'] = cn
    log('B: X# (%.1fs)' % (time.time() - t0))
    # W X[fn], exactly (scale S^2), packed per point: [Re WX1, Re WX2], [Im WX1, Im WX2]
    WXr, WXi = [], []
    Xcat = [X1[c] + X2[c] for c in range(171)]
    maxX = max(abs(x) for row in Xcat for x in row)
    SXw = (171 * maxW * maxX * 4).bit_length() + 3
    PXc = [pack(Xcat[c], SXw) for c in range(171)]
    for k in range(T):
        ar = ai = 0
        for c in range(171):
            if WR[k][c]:
                ar += WR[k][c] * PXc[c]
            if WI[k][c]:
                ai += WI[k][c] * PXc[c]
        WXr.append(unpack(ar, 20, SXw))
        WXi.append(unpack(ai, 20, SXw))
    maxWX = max(abs(x) for row in WXr + WXi for x in row)
    SX = (T * (S << 26) * maxWX * 8).bit_length() + 3
    HG = halfgaps()
    _G.update(PRX=[pack(WXr[k], SX) for k in range(T)], PIX=[pack(WXi[k], SX) for k in range(T)], SX=SX, HG=HG)
    hres = pmap(_b_halfgap, range(len(HG)), workers)
    log('B: %d half-gap moment sums (%.1fs)' % (len(HG), time.time() - t0))
    # e_* at the box endpoints
    EKs = {}
    for K in ENDPOINTS[:-1]:
        lst = []
        for n in NODES5:
            Nr, Den = -K.numerator * (n - 1), K.denominator
            out['dom_ok'] &= dom_ok(Nr, 0, Den)
            lst.append(e_star(Nr, 0, Den)[0])
        EKs[K] = lst
    lows = []
    Lb = {}
    S3 = S ** 3
    for idx, (m, y) in enumerate(HG):
        sf, sg = hres[idx]
        nu = 0 if m == 0 else 2
        yn, yd = y.numerator, y.denominator
        for fn in (1, 2):
            sig = -1 if fn == 1 else 1
            lint = []
            for r in range(41):
                a = r + nu
                blkF = sf[a][(fn - 1) * 10:(fn - 1) * 10 + 10]
                blkG = sg[a][(2 - fn) * 10:(2 - fn) * 10 + 10]
                lint.append([x + z for x, z in zip(blkF, blkG)])
            # l[r] = sig * (yd/yn)^nu * lint[r] / S^3 ; lsum_d = sum_r w_dr l[r]
            Dd = S3 * LCM40 * yn ** nu
            numfac = sig * yd ** nu
            NLs = []
            for d in range(41):
                wts = BW[d]
                NL = [numfac * sum(wts[r] * lint[r][c] for r in range(d + 1)) for c in range(10)]
                Lb[m, y, fn, d] = [Fr(x, Dd) for x in NL]
                NLs.append(NL)
            for J_i, K in enumerate(ENDPOINTS[:-1]):
                J = ENDPOINTS[J_i + 1]
                tc = [Fr(0)] * 41
                if fn == 1:
                    if m == 0:
                        Nr = K.numerator
                        out['dom_ok'] &= dom_ok(Nr, 0, K.denominator)
                        eK = Fr(e_star(Nr, 0, K.denominator)[0], S)
                        tc = [eK / K * (-K * y) ** r / math.factorial(r) for r in range(41)]
                    elif m == 1:
                        tc = [K * (-K * y) ** r / math.factorial(r + 2) for r in range(41)]
                    elif m == 3 and J is not None:
                        Nr = -13 * J.numerator
                        out['dom_ok'] &= dom_ok(Nr, 0, 6 * J.denominator)
                        tc[0] = J / 2 * Fr(e_star(Nr, 0, 6 * J.denominator)[0], S)
                xs = [Fr(1) / K, (Fr(1) / J) if J is not None else Fr(0)]
                EJ = EKs[J] if J is not None else None
                for d in range(41):
                    wts = BW[d]
                    NL = NLs[d]
                    best = None
                    for x in xs:
                        xn, xd = x.numerator, x.denominator
                        V = [NL[a] * xd + xn * NL[a + 5] for a in range(5)]
                        tot = V[0] * S
                        for a in range(1, 5):
                            c1 = V[a] * EKs[K][a]
                            c2 = V[a] * EJ[a] if EJ is not None else 0
                            tot += min(c1, c2)
                        val = Fr(tot, Dd * xd * S)
                        best = val if best is None else min(best, val)
                    if fn == 1:
                        best += sum(Fr(wts[r], LCM40) * tc[r] for r in range(d + 1))
                    lows.append((m, y, fn, J_i, d, best))
    out['lows'] = lows
    out['L'] = Lb
    log('B: %d Bernstein values (%.1fs)' % (len(lows), time.time() - t0))
    s0 = Fr(179, 2)
    tails = {}
    for fn, Xm in ((1, X1), (2, X2)):
        sig = -1 if fn == 1 else 1

        def row(idx):
            return [Fr(sig * x, S) for x in Xm[idx]]

        def low(rw, K, J):
            EJ = EKs[J] if J is not None else None
            best = None
            for x in [Fr(1) / K, (Fr(1) / J) if J is not None else Fr(0)]:
                v = [rw[a] + x * rw[a + 5] for a in range(5)]
                tot = v[0]
                for a in range(1, 5):
                    c1 = v[a] * Fr(EKs[K][a], S)
                    c2 = v[a] * Fr(EJ[a], S) if EJ is not None else 0
                    tot += min(c1, c2)
                best = tot if best is None else min(best, tot)
            return best
        for J_i, K in enumerate(ENDPOINTS[:-1]):
            J = ENDPOINTS[J_i + 1]
            val = low(row(170), K, J)
            dsum = [sum(row(84 + IDX[n] if n else 169)[c] for n in LOW) for c in range(10)]
            val += min(0, low(dsum, K, J)) / s0
            for n in LOW:
                val += min(0, low(row(IDX[n] if n else 168), K, J)) / (s0 - n) ** 2
                val += n * min(0, low(row(84 + IDX[n] if n else 169), K, J)) / (s0 * (s0 - n))
            tails[fn, J_i] = val
    out['tail'] = tails
    out['seconds'] = time.time() - t0
    log('B: tail (%.1fs)' % (time.time() - t0))
    return out


# ============================================================== scalar budgets (Appendix A and the analytic constants)
def scalar_checks(par, checks):
    s3 = sqrt(q(3))
    b = s3 / 2
    h, B = Fr(2, 5), Fr(4, 3)
    pst, bst = Fr(par['pstar']), Fr(par['bstar'])
    eps = Fr(1, 10 ** 80)
    plo, phi = machin(70, 25)
    check(checks, 'Lemma rational-pi-b: p_* < pi < p_* + 1e-80 (Machin brackets, exact rationals)', pst < plo and phi < pst + eps)
    check(checks, 'Lemma rational-pi-b: b_*^2 < 3/4 < (b_* + 1e-80)^2 (exact)', bst * bst < Fr(3, 4) < (bst + eps) ** 2)
    a5 = Fr(1, 5) - Fr(1, 3 * 125)
    check(checks, 'pi > 16(1/5 - 1/(3 5^3)) - 4/239 = 281476/89625 > 157/50; sqrt3 < 1733/1000; pi(2/sqrt3 - 2/5) > 2.36 chain',
          16 * a5 - Fr(4, 239) == Fr(281476, 89625) and Fr(281476, 89625) > Fr(157, 50) and Fr(1733, 1000) ** 2 > 3
          and Fr(157, 50) * (Fr(2000, 1733) - Fr(2, 5)) == Fr(1025838, 433250) and Fr(1025838, 433250) > Fr(59, 25)
          and plo > Fr(281476, 89625))
    e_up = sum(Fr(1, math.factorial(j)) for j in range(7)) + Fr(1, math.factorial(7)) / (1 - Fr(1, 8))
    check(checks, 'quadrature lemma: e < 95901/35280 < 2719/1000; 220(2.719)^182 < 1e83; 1100(2.719)^160 < 1e83; 4e114 < 2^384',
          e_up == Fr(95901, 35280) and e_up < Fr(2719, 1000) and 220 * Fr(2719, 1000) ** 182 < 10 ** 83
          and 1100 * Fr(2719, 1000) ** 160 < 10 ** 83 and 4 * 10 ** 114 < 2 ** 384)
    pu = Fr(22, 7)
    check(checks, 'quadrature lemma: pi M/3 + 1.65 pi < 182 and pi M/6 + .081 pi M + 9.3 pi < 160 (pi < 22/7, M = 168); '
                  '|z| <= B/(h-1/6) + h = 214/35; Im z >= -1402/17505 at u = 11/12; 37 pi^2/3 < 220',
          pu * (Fr(168, 3) + Fr('1.65')) < 182 and pu * (28 + Fr('0.081') * 168 + Fr('9.3')) < 160
          and B / (h - Fr(1, 6)) + h == Fr(214, 35) and Fr(214, 35) < Fr('6.2')
          and B * (h - Fr(1, 6)) / (Fr(11, 12) ** 2 + h * h - Fr(1, 36)) - h == Fr(-1402, 17505) and Fr(-1402, 17505) > Fr('-0.081')
          and 37 * pu * pu / 3 < 220 and lt((b * (h - Fr(1, 6))).recip(), 5))
    # kernel bounds
    l0 = (b * h).recip()
    z0sq = h * h + (B * B - 2 * B * h * h) / (h * h)
    z56 = h * h + (B * B - 2 * B * h * h) / (Fr(25, 36) + h * h)
    q1 = h * (B / (1 + h * h) - 1)
    q56 = h * (B / (Fr(25, 36) + h * h) - 1)
    dq = 2 * h * B * 1 / (1 + h * h) ** 2
    pl = Fr(157, 50)
    check(checks, 'Lemma kernel-bounds: |lambda(0)| = 5/sqrt3 < 3, |z(0)| = 44/15, q(1) = 26pi/435 > .187, q(5/6) = 862pi/3845 > .70, '
                  '|lambda(5/6)| = 60/sqrt2307 < 5/4, |z(5/6)|^2 = 33476/19225 < (33/25)^2, -q\'(1) = 2000pi/2523 > 2.48',
          lt(l0, 3) and z0sq == Fr(44, 15) ** 2 and q1 == Fr(26, 435) and pl * q1 > Fr('0.187') and q56 == Fr(862, 3845)
          and pl * q56 > Fr('0.70') and Fr(3600, 2307) < Fr(25, 16) and z56 == Fr(33476, 19225) and z56 < Fr(33, 25) ** 2
          and dq == Fr(2000, 2523) * 1 and pl * dq > Fr('2.48') and B > 2 * h * h)
    check(checks, 'Lemma kernel-bounds: 65pi^2/18 < 36, 32pi/3 < 36, 3(1+2.12+3pi)/1.75 < 22, 1.25(1+2.12+1.32pi)/1.75 < 5.3, '
                  '22*36/(e^.187 - 1) < 4000 via e^.187 - 1 > .198, 22*36 <= 800, 2pi/2.48 < 2.54',
          65 * pu * pu / 18 < 36 and 32 * pu / 3 < 36 and 3 * (1 + Fr('2.12') + 3 * pu) / Fr('1.75') < 22
          and Fr('1.25') * (1 + Fr('2.12') + Fr('1.32') * pu) / Fr('1.75') < Fr('5.3')
          and Fr('0.187') + Fr('0.187') ** 2 / 2 > Fr('0.198') and 22 * 36 / Fr('0.198') == 4000
          and 22 * 36 / (Fr('0.187') + Fr('0.187') ** 2 / 2) < 4000 and 22 * 36 <= 800
          and 2 * pu / Fr('2.48') < Fr('2.54'))
    check(checks, 'node-constant bounds (2:151-157): Q_n > 7/4 via (2/3)(157/50)^2(267/1000) > 7/4 and 2 - sqrt3 > .267; '
                  '|D_n| < 53/25 via (22/18)(1733/1000) < 53/25',
          Fr(2, 3) * pl * pl * Fr(267, 1000) > Fr(7, 4) and (2 - Fr(267, 1000)) ** 2 > 3 and Fr(22, 18) * Fr(1733, 1000) < Fr(53, 25))

    def U(r, w, c):
        return (exp(q(Fr('-0.70') * r)) * (800 * (w + c)) / (q(1) - exp(q(Fr('-0.70'))))
                + exp(q(Fr('-0.187') * r)) * (Fr('5.3') * (Fr('2.54') * w / r + 2 * c)) / (q(1) - exp(q(Fr('-0.187')))))
    cj = (1 + (1 + Fr('2.12')) / Fr('2.36')) / Fr('1.75')
    rows = [(U(168, Fr(1), Fr(0)), Fr('1.0670e-14'), Fr('1.1e-14')),
            (U(168, Fr(5), Fr('0.02')), Fr('8.1575e-14'), Fr('8.3e-14') - Fr(1, 10 ** 170)),
            (U(91, Fr(5), Fr('0.02')), Fr('2.2711e-7'), Fr('2.4e-7')),
            (exp(q(Fr('-2.36') * 11)) * cj / (q(1) - exp(q(Fr('-2.36')))), Fr('7.7915e-12'), Fr('8e-12')),
            (sum((exp(q(Fr('-2.36') * (n - 1))) for n in NODES5), q(0)) * (Fr('2.3') + Fr('5.6') / Fr('2.36')), Fr('4.7185'), Fr('4.8')),
            (PI * PI * (Fr(36, 2) * Fr(2, 10 ** 8) * 3 * 9), Fr('9.5933e-5'), Fr('0.00011'))]
    check(checks, 'eq. scalar-error-budgets: all six quantities lie below their printed outward bounds, which lie below the allowances',
          all(lt(v, ub) and ub < al for v, ub, al in rows), ', '.join('%.6g' % v.f() for v, _, _ in rows))
    check(checks, 'Section 4 constants: c_* = 548/413 < 4/3; 1.1e-14 + margin 1.425e-15 > 1e-170',
          cj == Fr(548, 413) and cj < Fr(4, 3) and Fr('8.3e-14') - Fr('8.1575e-14') == Fr('1.425e-15'))

    def Rem(m, Y, nu):
        l = 41 + nu
        acc = rpow(PI * Y, l)
        for j in range(1, 7):
            tj, tj1 = Fr(j, 6), Fr(j - 1, 6)
            imz = B * h / (tj * tj + h * h) - h
            absz = sqrt(q(h * h + B * (B - 2 * h * h) / (tj1 * tj1 + h * h)))
            acc = acc + exp(-(PI * imz * m)) * rpow(PI * absz * Y, l) * 3
        return acc * (Fr(36 * 5) / Fr(Y) ** nu / math.factorial(l)) / (q(1) - PI * 3 * Y / (l + 1))
    rr = [(Rem(0, Fr(1, 2), 0), Fr('1.8e-19')), (Rem(1, Fr(1), 2), Fr('1.0e-11')), (Rem(3, Fr(1), 2), Fr('3.0e-16')),
          (Rem(4, Fr(3, 2), 2), Fr('2.0e-11'))]
    check(checks, 'half-gap remainders R(m,Y,nu) for (0,1/2,0), (1,1,2), (3,1,2), (4,3/2,2) below 1.8e-19, 1e-11, 3e-16, 2e-11; '
                  'plus 41*4*5*1e-31 = 8.2e-29, each sum < 1e-8',
          all(lt(v, ub) and ub + Fr('8.2e-29') < Fr(1, 10 ** 8) for v, ub in rr) and 41 * 4 * 5 * Fr(1, 10 ** 31) == Fr('8.2e-29'),
          ', '.join('%.4g' % v.f() for v, _ in rr))
    t1 = exp(q(6)) / 6 * (Fr(3 ** 41, math.factorial(41)) / (1 - Fr(3, 42)))
    t2 = Fr(6 * 6 ** 41, math.factorial(43)) / (1 - Fr(6, 44))
    check(checks, 'target-support tails: (e^6/6) 3^41/41!/(1-3/42) < 8e-29 and 6 6^41/43!/(1-6/44) < 1e-20',
          lt(t1, Fr('8e-29')) and t2 < Fr('1e-20'), '%.4g, %.4g' % (t1.f(), float(t2)))
    s0 = Fr(179, 2)
    sd = (PI * PI * (36 * Fr('2.4e-7')) + exp(q(Fr('-0.70') * s0)) * (PI * PI * 27 * 36 * 5)
          + exp(q(Fr('-0.187') * s0)) * (rpow(PI * Fr('1.32'), 2) * (Fr('1.25') * (Fr('2.54') * 5 / s0 + Fr('0.04'))))
          + exp(q(Fr('-2.36') * (s0 - 1))) * Fr('2.36'))
    check(checks, 'tail second-derivative majorant at s0 = 89.5 < 8.5485e-5 < .0002; s0 - 1 > 1/2.36',
          lt(sd, Fr('8.5485e-5')) and Fr('8.5485e-5') < Fr('0.0002') and s0 - 1 > 1 / Fr('2.36'), '%.6g' % sd.f())
    check(checks, '12 - 8 sqrt2 > .6862 > .68 (exact: 8 sqrt2 < 11.3138); final margins .000888 > 0, .0021 - 2e-8 > .002, .68*.002 > .0001',
          Fr(128) < Fr('11.3138') ** 2 and Fr('0.001') - Fr('0.00011') - 2 * Fr('0.000001') == Fr('0.000888')
          and Fr('0.0021') - Fr(2, 10 ** 8) > Fr('0.002') and Fr('0.68') * Fr('0.002') > Fr('0.0001'))
    # sine product at the midpoints (Lemma sine-product-barrier)
    def Pm(s):
        acc = q(1)
        for a in LRES:
            _, sn = cos_sin(PI * (Fr(s) - a) / 12)
            acc = acc * sqr(sn * 2)
        return acc
    s2 = sqrt(q(2))
    s6 = sqrt(q(6))
    mids = [(Fr(1, 2), Fr(1, 2), q(12) - s2 * 8), (Fr(2), Fr(1), q(1)), (Fr(7, 2), Fr(1, 2), q(12) - s2 * 8),
            (Fr(11, 2), Fr(3, 2), (q(3) + s2 + s3 + s6) * Fr(8, 9)), (Fr(8), Fr(1), q(9)),
            (Fr(21, 2), Fr(3, 2), (q(3) + s2 + s3 + s6) * Fr(8, 9))]
    okm = True
    for s, half, val in mids:
        v = Pm(s) / q(half * half)
        okm &= v.lo <= val.hi and val.lo <= v.hi and lt(Fr('0.68'), v)
    check(checks, 'Lemma sine-product-barrier: the six midpoint values of P(s)/(s-m)^2 match 12-8sqrt2, 1, (8/9)(3+sqrt2+sqrt3+sqrt6), 9 '
                  'and exceed .68 (from the sine product)', okm)
    beta = Fr('1.1e-14')
    uT = (Fr('8.3e-14') + 40 * beta * Fr(1, 10 ** 11)) / (1 - beta * (1 + 40 * 4000))
    uF = 40 * (Fr(1, 10 ** 11) + 4000 * uT)
    check(checks, 'Section 4 arithmetic: 36/(1-.004^8) < 37, 37/(1-74e-27) < 40, 1.1e-14(1+160000) = 1.760011e-9, '
                  '20000(.004)^8 = 1.31072e-15, 8e-12+1e-24+1.4e-15 < 1e-11, u_F + u_T < 1.3681e-8 < 2e-8, 4.8 + 2e-8 < 5',
          36 / (1 - Fr('0.004') ** 8) < 37 and 37 / (1 - 37 * Fr(2, 10 ** 27)) < 40 and beta * (1 + 40 * 4000) == Fr('1.760011e-9')
          and 20000 * Fr('0.004') ** 8 == Fr('1.31072e-15') and Fr('8e-12') + Fr('1e-24') + Fr('1.4e-15') < Fr('1e-11')
          and uF + uT < Fr('1.3681e-8') and Fr('4.8') + Fr(2, 10 ** 8) < 5)
    terms = [1, Fr('2.36'), Fr('2.78'), Fr('2.19'), Fr('1.29'), Fr('0.61'), Fr('0.239'), Fr('0.08')]
    x = Fr(59, 25)
    check(checks, 'local target tails: P_7(59/25) > 10.549 > 21/2 termwise; (548/413)(21/19) < 3/2; (21/20)^10 > 3/2; 3^16 > 150 2^16; '
                  'first-five jets (548/413)(1+(2/21)^2+...) < 1.35; 1.35 + (4000 + 2e-27)4.8 < 20000',
          all(x ** j / math.factorial(j) >= terms[j] for j in range(8)) and sum(terms) == Fr('10.549') and Fr('10.549') > Fr(21, 2)
          and Fr(548, 413) * Fr(21, 19) < Fr(3, 2) and Fr(21, 20) ** 10 > Fr(3, 2) and 3 ** 16 > 150 * 2 ** 16
          and Fr(548, 413) * (1 + Fr(2, 21) ** 2 + Fr(2, 21) ** 3 + Fr(2, 21) ** 6 + Fr(2, 21) ** 8) < Fr('1.35')
          and Fr('1.35') + (4000 + Fr(2, 10 ** 27)) * Fr('4.8') < 20000)
    # roundoff-lemma majorants (Appendix C)
    eu = Fr(2719, 1000)
    dl = [Fr(0)]
    for j in range(1, 61):
        dl.append(Fr('0.416') / j * dl[-1] + 2 * eps * Fr('0.416') ** (j - 1) / math.factorial(j) + 2 * eps)
    tot = sum(dl) + eu * Fr('0.416') ** 61 / math.factorial(61)
    er, vr = [Fr(1, 10 ** 44)], [Fr(0)]
    for r in range(9):
        er.append(7 * er[-1] + Fr(1, 10 ** 77))
        vr.append(5 * vr[-1] + 34 * er[-2] + Fr(1, 10 ** 77))
    e7 = Fr(exp(q(7)).hi, ONE)               # rigorous upper bounds, kept as rationals (the products are far below 2^-192)
    e15 = Fr(exp(q(15)).hi, ONE)
    check(checks, 'roundoff lemma majorants: e_* Taylor error < 1.263e-78 (with e^.416 < 2719/1000); (4e-78 + 24 eps)3^12 e^7 '
                  '< 2.472e-69 and 41*4*230*3e^15*1e-29 < 3.700e-18 (e^7, e^15 enclosed; both FAIL with e < 2719/1000); matrix recurrence '
                  'max e_r < 5.765e-38, v_9 < 6.529e-36; 40000 v_9 + 72e-43 + 336 eps < 2.612e-31; '
                  'E column max 3.3505, 2 + (4000+2e-27)3.3505 < 13405',
          tot < Fr('1.263e-78')
          and e7 * (Fr('4e-78') + 24 * eps) * 3 ** 12 < Fr('2.472e-69')
          and max(er[:9]) < Fr('5.765e-38') and vr[9] < Fr('6.529e-36')
          and 40000 * vr[9] + 72 * Fr(1, 10 ** 43) + 336 * eps < Fr('2.612e-31')
          and e15 * 41 * 4 * 230 * 3 * Fr(1, 10 ** 29) < Fr('3.700e-18')
          and max(sum(abs(x) for x in par['E0']), sum(abs(x) for x in par['E1'])) == Fr('3.3505') and 2 + (4000 + Fr(2, 10 ** 27)) * Fr('3.3505') < 13405,
          'Taylor %.6g, e^7 term %.6g, e^15 term %.6g, v_9 %.6g' % (
              float(tot), float(e7 * (Fr('4e-78') + 24 * eps) * 3 ** 12), float(e15 * 41 * 4 * 230 * 3 * Fr(1, 10 ** 29)), float(vr[9])))


# ============================================================== decide
_CACHE = {}


def decide(src=None, routes=('A', 'B'), workers=None, verbose=False, tables=None, E=None):
    t0 = time.time()
    workers = workers or os.cpu_count() or 1
    src = src or Sources()

    def log(msg):
        if verbose:
            print('  [%6.1fs] %s' % (time.time() - t0, msg), flush=True)
    checks = []
    texts, par = read_paper(src)
    if tables:
        par.update(tables)
    if E:
        par['E0'], par['E1'] = E
    man = json.loads(texts['manifest'])
    import _common
    okman = True
    for ent in man['formula_sources']:
        p = os.path.join(_common.CLONE, ROOT, ent['path'])
        okman &= hashlib.sha256(open(p, 'rb').read()).hexdigest() == ent['sha256']
    check(checks, 'CERTIFICATE-INPUTS.json: the 13 manuscript sources hash to the recorded sha256 (the arrays are defined there)',
          okman and len(man['formula_sources']) == 13 and man['expected_counts'] == {'bernstein': 37310, 'tail': 10})
    check(checks, 'the paper and README state the floor-rounded matrix construction is not executed by the supplied programs',
          'not executed by the supplied programs' in texts['s09'].replace('\n', ' ') and
          'do not execute the separate floor-rounded matrix construction' in texts['readme'].replace('\n', ' '))
    s03 = texts['s03'].replace('\n', ' ')
    check(checks, 'the paper prints the counts: 84 nodes, 171 coordinates, 2311 mass points, 46 centres, 91 half-gaps, 37310 comparisons',
          'There are $84$ nodes' in s03 and '$171$ coordinates' in s03 and 'all $2311$ mass points' in s03
          and '91\\cdot2\\cdot5\\cdot41=37310' in s03)
    hg = halfgaps()
    check(checks, 'the counts recomputed: |F| = 84, |N_0 cap [0,88]| = 46, half-gaps 91, 91*2*5*41 = 37310; the half-gaps cover [0, 89.5]',
          len(F_NODES) == 84 and len(LOW) == 46 and len(hg) == 91 and 91 * 2 * 5 * 41 == 37310
          and all(abs(y) in (Fr(1, 2), 1, Fr(3, 2)) for _, y in hg) and max(m + y for m, y in hg) == Fr(179, 2))
    ex = exact_layer()
    par['exact'] = ex
    check(checks, 'exact: P_l from prod_{a in L} (w - zeta^a)^2 equals the printed (5, -1+2ib, 1+2ib, -2, -1/2+ib, -1-2ib, 1), P_-l = conj P_l',
          ex['printed_P'] and ex['conj_P'])
    check(checks, 'exact: P(n) = P\'(n) = 0 at the six residues (in Q(sqrt3)(i))', ex['zeros'])
    check(checks, 'exact: Q_a = (pi/6)^2 prod (2 sin(pi(a-d)/12))^2 and D_a = (pi/6) sum cot(pi(a-d)/12) equal the printed table',
          ex['Q_table'] and ex['D_table'])
    check(checks, 'exact: the same Q_a, D_a from the Fourier coefficients, P\'\'(a) = 2Q_a and P\'\'\'(a) = 6 Q_a D_a', ex['fourier_QD'])
    scalar_checks(par, checks)
    log('exact layer and scalar budgets done')
    power_t, cols_t, sign_t = par['power'], par['columns'], par['sign']
    results = {}
    key = (tuple(par['E0']), tuple(par['E1']))
    for route in routes:
        ck = (route, key)
        if ck not in _CACHE:
            _CACHE[ck] = route_a(par, workers, log) if route == 'A' else route_b(par, workers, log)
        results[route] = _CACHE[ck]
    value = {}
    for route in routes:
        res = results[route]
        lab = 'route %s (%s)' % (route, 'exact-array enclosures' if route == 'A' else 'floor-rounded listing, exact')
        if route == 'A':
            okp = all(below(nU, row[1]) and below(nVp, row[2]) and below(nVm, row[3])
                      for (nU, nVp, nVm), row in zip(res['power'], power_t))
            pv = ['%d: %.6g %.6g %.6g' % (r, a / ONE, b_ / ONE, c / ONE) for r, (a, b_, c) in enumerate(res['power'])]
        else:
            okp = all(nU < row[1] and nVp < row[2] and nVm < row[3] for (nU, nVp, nVm), row in zip(res['power'], power_t))
            pv = ['%d: %.6g %.6g %.6g' % (r, a, b_, c) for r, (a, b_, c) in enumerate(res['power'])]
        check(checks, lab + ': Table power-bounds, all 27 strict upper comparisons (||U|| before, ||V+||, ||V-|| after each step)',
              okp and len(res['power']) == 9 and len(power_t) == 9, '; '.join(pv))
        cn = res['colnorms']
        conv = (lambda x: x / ONE) if route == 'A' else float
        okc = True
        for keyc in ('X1', 'X2', 'X12'):
            for c in range(10):
                cut = cols_t[keyc][0 if c < 5 else 1]
                okc &= below(cn[keyc][c], cut) if route == 'A' else cn[keyc][c] < cut
        check(checks, lab + ': Table column-bounds, every column of X_1, X_2 and every same-column sum (30 strict comparisons)', okc,
              'max cols 1-5 / 6-10: X1 %.5f / %.5f, X2 %.5f / %.5f, sum %.5f / %.5f' % tuple(
                  conv(max(cn[k][c] for c in rng)) for k in ('X1', 'X2', 'X12') for rng in (range(5), range(5, 10))))
        mins = {}
        fails = []
        for (m, y, i, J_i, d, lo) in res['lows']:
            key = (group(m), J_i)
            if key not in mins or lo < mins[key]:
                mins[key] = lo
            cut = sign_t[J_i][1 + group(m)]
            if not (above(lo, cut) if route == 'A' else lo > cut):
                fails.append((m, str(y), i, J_i, d, conv(lo)))
        bern = dict(count=len(res['lows']), nfail=len(fails), fails=fails[:10])
        mv = '; '.join('K=%s: ' % ENDPOINTS[J] + ' '.join('%.6f' % (conv(mins[g, J])) for g in range(4)) for J in range(5))
        check(checks, lab + ': Table sign-bounds, all 37310 half-gap Bernstein lower comparisons strictly above their cutoffs',
              bern['count'] == 37310 and bern['nfail'] == 0, 'minima per (K; m=0, m=1, m=3,4, 7<=m<=88): ' + mv +
              ('' if not bern['nfail'] else ' FAILURES %d: %s' % (bern['nfail'], bern['fails'])))
        tl = res['tail']
        okt = all((above(tl[i, J], sign_t[J][5]) if route == 'A' else tl[i, J] > sign_t[J][5]) for i in (1, 2) for J in range(5))
        check(checks, lab + ': Table sign-bounds, the 10 tail comparisons strictly above .0022, .0029, .0036, .0043, .0052', okt,
              ' '.join('%.6f' % conv(tl[i, J]) for J in range(5) for i in (1, 2)))
        if route == 'A':
            check(checks, 'route A: the Fejer weights are positive (o_v >= 1/(N(N-1))) and their enclosed sum contains 1',
                  above(res['o_min'], Fr(1, 384 * 383)) and res['o_sum'].lo <= ONE <= res['o_sum'].hi)
            value['A_seconds'] = round(res['seconds'], 1)
            value['A_bernstein_min_by_group'] = {str((g, str(ENDPOINTS[J]))): round(mins[g, J] / ONE, 7) for g in range(4) for J in range(5)}
        else:
            check(checks, 'route B: every e_* argument satisfies |w| < 1700 and Re w < 7 (Lemma rational-roundoff, item 1)', res['dom_ok'])
            value['B_seconds'] = round(res['seconds'], 1)
    check(checks, 'Proposition finite-certificate follows from the tables: .0031 < .004, 32.12 + 1.85 < 36, 2.20 < 2.3, 5.40 < 5.6, '
                  '.00116 > .001, .0022 > .0021, and (floor route) .00116 - 1e-6 > .001, .0022 - 1e-6 > .0021',
          power_t[6][1] < Fr('0.004') and power_t[8][2] + power_t[8][3] < 36 and cols_t['X12'][0] < Fr('2.3')
          and cols_t['X12'][1] < Fr('5.6') and min(r[4] for r in sign_t) > Fr('0.001') and min(r[5] for r in sign_t) > Fr('0.0021')
          and min(r[4] for r in sign_t) - Fr(1, 10 ** 6) > Fr('0.001') and min(r[5] for r in sign_t) - Fr(1, 10 ** 6) > Fr('0.0021'))
    if 'A' in results and 'B' in results:
        A_, B_ = results['A'], results['B']
        Sfull, rS = A_['S']
        Ssh = B_['S']
        dev = 0
        for i in range(168):
            for c in range(171):
                dv = abs(Fr(Ssh[i][c], EPS_S) - Fr(Sfull[i][c], ONE)) + Fr(rS, ONE)
                dev = max(dev, dv)
        check(checks, 'cross-check: every entry of S# lies within 1e-44/168 of the exact S~ (roundoff lemma item 2: operator error < 1e-44)',
              dev * 168 < Fr(1, 10 ** 44), 'max entry deviation %.3g' % float(dev))
        X1a, X2a, rX = A_['X']
        X1b, X2b = B_['X']
        cdev = 0
        for c in range(10):
            tot = Fr(0)
            for Xa, Xb in ((X1a, X1b), (X2a, X2b)):
                for i in range(171):
                    tot += abs(Fr(Xb[i][c], EPS_S) - Fr(Xa[i][c], ONE)) + Fr(rX, ONE)
            cdev = max(cdev, tot)
        check(checks, 'cross-check: combined column error |X#_1 - X_1| + |X#_2 - X_2| < 1e-29 in every column (roundoff lemma item 3)',
              cdev < Fr(1, 10 ** 29), 'max %.3g' % float(cdev))
        LA, LB = A_['L'], B_['L']
        ldev = 0
        for k_, (mids, rad) in LA.items():
            m, y, i, d = k_
            lb = LB[m, y, i, d]
            for c in range(10):
                ldev = max(ldev, abs(lb[c] - Fr(mids[c], ONE)) + Fr(rad, ONE))
        check(checks, 'cross-check: every Bernstein row entry L#_{i,d} lies within 1e-16 of L_{i,d} (roundoff lemma item 3), all 7462 rows',
              ldev < Fr(1, 10 ** 16) and len(LA) == 91 * 2 * 41, 'max %.3g' % float(ldev))
    ok = all(c['pass'] for c in checks)
    value['seconds'] = round(time.time() - t0, 1)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: Proposition prop:finite-certificate through its three stronger tables (27 power, 30 column, '
                       '37310 Bernstein and 10 tail comparisons) on enclosures of the exact quadrature arrays, the same tables on an '
                       'exact execution of the floor-rounded procedure of Appendix C, the exact node constants, and the scalar budgets; '
                       'not the analytic interpolation, sign-propagation, energy-transfer or mixture arguments, hence not the theorem'}


def forge():
    """each must NOT certify (route A only, cached arrays)"""
    out = []
    src = Sources()
    _, par = read_paper(src)
    sign = [row[:] for row in par['sign']]
    sign[0][4] = Fr('0.00121')
    r = decide(src=src, routes=('A',), tables={'sign': sign})
    out.append(('Table sign-bounds, K = 2.36, 7 <= m <= 88: printed .00116 raised to .00121 (the enclosed minimum is .0012061)',
                r['verdict']))
    power = list(par['power'])
    power[8] = (8, power[8][1], Fr('32.0'), power[8][3])
    r = decide(src=src, routes=('A',), tables={'power': power})
    out.append(('Table power-bounds, step 8: ||V+|| < 32.12 tightened to 32.0', r['verdict']))
    E0 = list(par['E0'])
    E0[2] = -E0[2]
    r = decide(src=src, routes=('A',), E=(E0, par['E1']))
    out.append(('extra data E(k): the constant coordinate C_1 = -.0074 + .0115/k flipped to +.0074 + .0115/k', r['verdict']))
    return out


if __name__ == '__main__':
    t = time.time()
    res = decide(verbose=True)
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    print(forge())
