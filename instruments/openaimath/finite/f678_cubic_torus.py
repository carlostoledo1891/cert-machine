"""F-678 — "The Isoperimetric Conjecture for the Cubic Flat Three-Torus" (openai/math family 354).

THE CLAIM (paper.tex:28-33 abstract, Theorem intro:main): the isoperimetric profile of R^3/Z^3 is
min{(36 pi)^(1/3) v^(2/3), 2 sqrt(pi v), 2} and every minimiser is a ball, a circular tube, a slab or a complement.
The finite object (numerics.tex:10-16, Proposition num:scalar-positive): the strict scalar inequalities
    B(h) > 0          for h in [.64, 1.02] u [1.62, 2.25],
    B(h) + S(h) > 0   for h in [1.02, 1.62],
with (nesting.tex) lambda = .98, ell = .28, D = sqrt(48)/7, g(X) = (1 - lambda X^2)/sqrt(1 - X^2), G(X) = g(min{X, D}),
p_*(v) = min{sqrt(pi v), 1, sqrt(pi(1-v))}, a_0 = 1/pi, b_0 = 1 - 1/pi, t = t(h) the root in (0,1) of h^2 t^2 = pi(1-t),
    B(h) = lambda h/pi + int_0^t G(h v / p_*(v)) dv - 1                                  (nest:baseline, :121-124)
    S(h) = inf_{y >= 0} { ell y^2 + C_0(h) min{d_m, (P - Q y)_+}^3 }                     (nest:gain-definition, :510-514)
    u = min{b_0, .96/h}, P = u - 1 + 2ht/pi, Q = (2/pi) sqrt(pi + 2h^2 t), d_m = .21, C_0 = min{.134 h^3, .36}.
The paper's certificate: 24 knot lower bounds b_h, s_h (Table num:knot-table, :433-456) with stated slack (:460-467),
explicit values at h = 1.46 (:471-475), and 23 interpolation margins (Table num:gap-table, :518-541) from the chord rule
(num:chord) with second-derivative constants K from Lemmas num:layer-cake and num:s-second. No code or data is released
(paper.tex:157 says "The reproducible exact calculations are included with the source"; the release has only the TeX
and the PDF).

WHAT IS DECIDED HERE, exactly (integers and rationals only; transcendental numbers enclosed by proved bounds):
  A. THE PROPOSITION ITSELF, independently of the paper's derivative lemmas, Taylor surrogate and table. For each h,
     B(h) = lambda h/pi - 1 + T1 + T2 + T3, derived here from the definition by splitting [0, t] at a_0 and b_0:
       T1 = (2 pi/h^2) int_0^{h/pi} X g(X) dX = (2 pi/h^2)[(1-lambda)(1-s) + lambda(1-s^3)/3], s = sqrt(1-(h/pi)^2)
            (substitution X = h sqrt(v/pi); h/pi < D on the range);
       T2 = (1/h) int_{h/pi}^{h min(b_0,t)} G = (1/h)[AG(h min(b_0,t)) - AG(h/pi)], AG(X) = Gam(min(X,D)) + ell (X-D)_+,
            Gam(X) = (1 - lambda/2) arcsin X + (lambda/2) X sqrt(1-X^2) (Gam' = g);
       T3 = int_{b_0}^{t} G(X(v)) dv, X(v) = hv/sqrt(pi(1-v)), present only when t > b_0. With v = rho(X/h), rho the
            inverse of r -> r/sqrt(pi(1-r)) (explicitly rho(k) = sqrt(pi) k sqrt(1 + pi k^2/4) - pi k^2/2), X(b_0) = h b_0,
            X(t) = 1, integration by parts gives T3 = ell t - b_0 G(h b_0) + R, R = int_{min(hb_0,D)}^{D} rho(X/h) W(X) dX,
            W = -g' = X(.96 - .98X^2)/(1-X^2)^(3/2) >= 0 on [0, D].
     R is not elementary. It is enclosed with the chord rule: rho is concave (rho'' = sqrt(pi) phi - pi with
     phi = sigma k (3 + 2 sigma k^2)/(1 + sigma k^2)^(3/2) increasing to 2 sqrt(sigma) = sqrt(pi), so -pi <= rho'' < 0),
     so on a rational node grid (step 1/1000) the piecewise-linear interpolant of rho(X/h) lies below it and within
     pi Delta^2/(8 h^2) above; the interpolant integrates against W exactly through the moments int W = g(a) - g(b) and
     int X W = [Gam - X g]. W >= 0 makes the lower bound one-sided and rigorous.
     ON AN INTERVAL [h1, h2]: G is non-increasing and h v/p_* increases with h, t(h) decreases and G >= 0, so
       B(h) >= lambda h1/pi - 1 + I(h2),   I(h) = T1 + T2 + T3 at h;
     Phi(C, P, Q) = inf_y {...} is non-decreasing in C and P and non-increasing in Q, C_0 increases, ht and h^2 t
     increase, u decreases, so S(h) >= Phi(C_0(h1), min{b_0,.96/h2} - 1 + 2 h1 t(h1)/pi, Q(h2)). Phi is bounded below
     exactly: with w = P - Qy, Phi = min over [0, min(P, d_m)] of the convex F(w) = ell (P-w)^2/Q^2 + C_0 w^3 (and
     C_0 d_m^3 when P >= d_m; 0 when P <= 0), and a convex function lies above its tangent at any rational w_0.
     An adaptive bisection of [.64, 2.25] (cut at 1.02 and 1.62) certifies every piece positive.
  B. THE PAPER'S CERTIFICATE, as published: the 24 knot bounds and the stated slack 1.10 < 10^5 Bt - b_h < 1.95 and
     1.00 < 10^5 S - s_h < 1.66, where Bt is the paper's Taylor surrogate (rho replaced on [b_0, D/h] by its cubic Taylor
     polynomial about k_* = (b_0 + D/h)/2) — Bt is evaluated exactly through moments int_y^D X^j W (derived here by
     parts from int X^n/sqrt(1-X^2)), and S two-sided (tangent below, a feasible point above); the h = 1.46 values;
     the gap-table margins recomputed from (num:gap-formula) by rational arithmetic, the smallest margin 9/100000.
  C. Printed arithmetic in the supporting lemmas (pi enclosure by Machin, j_D, Lemma num:s-second, Lemma
     num:taylor-error, Lemma nest:s-formula, and the constants of Lemmas nest:shape-gain, nest:derivative-bound,
     nest:coefficient-bound that fix C_0), each recomputed exactly; and consistency of the paper's layer-cake and
     moment formulas with the direct integration here (enclosures overlap at all knots; a consistency check, not a proof).
  Transcendentals: pi = 16 arctan(1/5) - 4 arctan(1/239) with alternating-series brackets; arcsin z = 8 arctan(x_2)
  after one half-angle step to arctan and two arctan halvings (x_2 < .2, checked), summed to 32 terms with the alternating
  tail bound. Interval endpoints are rationals with denominator 2^128, every operation rounded outward.

WHAT IS NOT DECIDED: everything that turns these scalar inequalities into the theorem — the reduction to the two
transition volumes, the stability/monotone-position and slicing arguments, Lemma nest:integrated-flux, the planar
bounds, Proposition nest:area-bound (A - 1 >= B + S), the C_0 coefficient lemma beyond its printed arithmetic, the
four-vertex scalar inequality of Appendix num:elementary-estimates, and the paper's derivative lemmas num:layer-cake
and num:s-second (part A does not use them; part B's gap table is checked only as arithmetic on their constants).

READ AFTER THIS DECIDER RAN. The preprint directory has no code or data; the "exact calculations" of paper.tex:157 are
not beside the TeX. The release's Lean tree has the Comparator challenge lean/ComparatorChallenges/CubicTorus.lean
(unit_cubic_isoperimetric, solution OAI.Geometry.CubicTorus.Main) and, under lean/OAI/Geometry/CubicTorus/Profiles/,
straight-line enclosure files (ValueEnclosures72To288 ... 3143To3335: e_n := e_i op e_j with an Encl lemma closed by
norm_num) and GainBounds.lean (concaveOn_gain_corrected); that is a formal re-derivation of the scalar arithmetic in
Lean, lane K's object, not inspected step by step or run here. This decider shares no code or arithmetic with it.
"""
import math
import os
import re
import sys
from fractions import Fraction as Fr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/The-Isoperimetric-Conjecture-for-the-Cubic-Flat-Three-Torus-September-24-2026/'
NUM = DIR + 'build/sections/numerics.tex'
NEST = DIR + 'build/sections/nesting.tex'
PAPER = DIR + 'build/paper.tex'

PREC = 128
ONE = 1 << PREC


# ---------------------------------------------------------------- outward-rounded intervals, rational endpoints n/2^128
def _fl(n, d):
    return n // d


def _ce(n, d):
    return -((-n) // d)


class Iv:
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi):
        if lo > hi:
            raise ValueError('empty interval')
        self.lo, self.hi = lo, hi

    @staticmethod
    def of(r):
        if isinstance(r, Iv):
            return r
        r = Fr(r)
        return Iv(_fl(r.numerator * ONE, r.denominator), _ce(r.numerator * ONE, r.denominator))

    def __add__(self, o):
        o = Iv.of(o)
        return Iv(self.lo + o.lo, self.hi + o.hi)
    __radd__ = __add__

    def __neg__(self):
        return Iv(-self.hi, -self.lo)

    def __sub__(self, o):
        o = Iv.of(o)
        return Iv(self.lo - o.hi, self.hi - o.lo)

    def __rsub__(self, o):
        return Iv.of(o) - self

    def __mul__(self, o):
        o = Iv.of(o)
        a, b, c, d = self.lo * o.lo, self.lo * o.hi, self.hi * o.lo, self.hi * o.hi
        return Iv(_fl(min(a, b, c, d), ONE), _ce(max(a, b, c, d), ONE))
    __rmul__ = __mul__

    def recip(self):
        if self.lo > 0:
            return Iv(_fl(ONE * ONE, self.hi), _ce(ONE * ONE, self.lo))
        if self.hi < 0:
            return -((-self).recip())
        raise ZeroDivisionError('interval contains 0')

    def __truediv__(self, o):
        return self * Iv.of(o).recip()

    def __rtruediv__(self, o):
        return Iv.of(o) * self.recip()

    def sqrt(self):
        if self.lo < 0:
            raise ValueError('sqrt of a possibly negative interval')
        lo = math.isqrt(self.lo * ONE)
        n = self.hi * ONE
        hi = math.isqrt(n)
        if hi * hi < n:
            hi += 1
        return Iv(lo, hi)

    def flo(self):
        return Fr(self.lo, ONE)

    def fhi(self):
        return Fr(self.hi, ONE)

    def __repr__(self):
        return '[%.15g, %.15g]' % (self.lo / ONE, self.hi / ONE)      # printing only


def imin(a, b):
    return Iv(min(a.lo, b.lo), min(a.hi, b.hi))


def ipow(x, n):
    r = Iv(ONE, ONE)
    for _ in range(n):
        r = r * x
    return r


# ---------------------------------------------------------------- pi and arcsin, with proved brackets
def _arctan_exact(x, N):
    """for 0 < x <= 1 and N odd: A_N(x) < arctan x < A_N(x) + x^(2N+3)/(2N+3) (alternating, decreasing terms)"""
    s = sum(Fr((-1) ** k) * x ** (2 * k + 1) / (2 * k + 1) for k in range(N + 1))
    return s, s + x ** (2 * N + 3) / (2 * N + 3)


def _pi():
    a_lo, a_hi = _arctan_exact(Fr(1, 5), 41)
    b_lo, b_hi = _arctan_exact(Fr(1, 239), 13)
    lo, hi = 16 * a_lo - 4 * b_hi, 16 * a_hi - 4 * b_lo
    return Iv(_fl(lo.numerator * ONE, lo.denominator), _ce(hi.numerator * ONE, hi.denominator))


PI = _pi()
SQRTPI = PI.sqrt()
SIG = PI / 4
LAM = Fr(49, 50)
ELL = Fr(7, 25)
DM = Fr(21, 100)
D2 = Fr(48, 49)
D = Iv.of(D2).sqrt()
B0 = 1 - 1 / PI
W_SUP = 343            # on [0, D]: W <= .96 X/(1-X^2)^(3/2) <= .96 * 49^(3/2) < 343; and 0 <= rho < 1
GRIDN = 1000


def arcsin(z):
    """enclosure of arcsin over the interval z, 0 <= z < 1: arcsin z = 2 arctan(z/(1+sqrt(1-z^2))) and
    arctan x = 2 arctan(x/(1+sqrt(1+x^2))) twice, then the alternating series with its tail"""
    x = z / (1 + (1 - z * z).sqrt())
    for _ in range(2):
        x = x / (1 + (1 + x * x).sqrt())
    if x.lo < 0 or x.hi * 5 > ONE:
        raise ValueError('arcsin argument outside the reduced range')
    N = 31
    x2 = x * x
    term = x
    s = Iv(0, 0)
    for k in range(N + 1):
        s = s + term / (2 * k + 1) if k % 2 == 0 else s - term / (2 * k + 1)
        term = term * x2
    tail = term / (2 * N + 3)
    return 8 * Iv(s.lo, (s + tail).hi)


def g(X):
    return (1 - LAM * X * X) / (1 - X * X).sqrt()


def gam(X):
    return (1 - LAM / 2) * arcsin(X) + (LAM / 2) * X * (1 - X * X).sqrt()


GAM_D = gam(D)


def G(X):
    """G(X) = g(min(X, D)): non-increasing with ell <= G <= 1, so G(X) lies between G(X.hi) and G(X.lo)"""
    lo = Iv.of(ELL).lo if X.hi > D.lo else g(Iv(X.hi, X.hi)).lo
    x0 = min(X.lo, D.lo)
    return Iv(lo, g(Iv(x0, x0)).hi)


def _AG_pt(r):
    """int_0^r G for a grid rational r (an integer numerator over 2^128)"""
    if r <= D.lo:
        return gam(Iv(r, r))
    if r >= D.hi:
        return GAM_D + ELL * (Iv(r, r) - D)
    return Iv(gam(Iv(D.lo, D.lo)).lo, (GAM_D + ELL * Iv(0, D.hi - D.lo)).hi)


def AG(X):
    return Iv(_AG_pt(X.lo).lo, _AG_pt(X.hi).hi)


def rho(k):
    return SQRTPI * k * (1 + SIG * k * k).sqrt() - (PI / 2) * k * k


def t_of(h):
    hI = Iv.of(h)
    return 2 / (1 + (1 + 4 * hI * hI / PI).sqrt())


# grid moments: g(X_j) and Lambda(X_j) = Gam(X_j) - X_j g(X_j), so that int_a^b W = g(a) - g(b), int_a^b X W = Lambda(b) - Lambda(a)
_GRID = {}


def _node(xnum):
    """xnum: an exact rational node (Fraction); returns (Iv node, g, Lambda)"""
    if xnum not in _GRID:
        X = Iv.of(xnum)
        gx = g(X)
        _GRID[xnum] = (X, gx, gam(X) - X * gx)
    return _GRID[xnum]


def R_bounds(h, y, upper=True, gridn=GRIDN):
    """enclosure of R = int_y^D rho(X/h) W(X) dX for the interval y (= h b_0), chord rule on the nodes j/gridn"""
    if y.lo >= D.hi:
        return Iv(0, 0)
    if y.hi > D.lo:
        return Iv(0, (D.hi - y.lo) * W_SUP)
    a = Fr(y.hi, ONE)
    bnd = Fr(D.lo, ONE)
    j0 = math.floor(a * gridn) + 1
    j1 = math.ceil(bnd * gridn) - 1
    nodes = [a] + [Fr(j, gridn) for j in range(j0, j1 + 1)] + [bnd]
    hinv = 1 / Iv.of(h)
    lo_sum = Iv(0, 0)
    err = Iv(0, 0)
    prev = _node(nodes[0])
    prev_x = nodes[0]
    rho_prev = rho(prev[0] * hinv)
    for xn in nodes[1:]:
        cur = _node(xn)
        rho_cur = rho(cur[0] * hinv)
        delta = Iv.of(xn - prev_x)
        m0 = prev[1] - cur[1]
        m1 = cur[2] - prev[2]
        A = (cur[0] * m0 - m1) / delta
        C = (m1 - prev[0] * m0) / delta
        lo_sum = lo_sum + rho_prev * A + rho_cur * C
        if upper:
            err = err + delta * delta * m0
        prev, prev_x, rho_prev = cur, xn, rho_cur
    lo = lo_sum.lo
    if not upper:
        return Iv(lo, lo)
    slivers = (Iv.of(a) - y + D - Iv.of(bnd)) * W_SUP
    hi = (lo_sum + err * PI * hinv * hinv / 8 + slivers).hi
    return Iv(lo, hi)


def B_terms(h, upper=True, gridn=GRIDN):
    """the pieces of B(h) at a rational h; returns dict of intervals"""
    hI = Iv.of(h)
    t = t_of(h)
    z1 = hI / PI
    s = (1 - z1 * z1).sqrt()
    T0 = LAM * hI / PI - 1
    T1 = (2 * PI / (hI * hI)) * ((1 - LAM) * (1 - s) + LAM * (1 - s * s * s) / 3)
    m = imin(B0, t)
    T2 = (AG(hI * m) - AG(z1)) / hI
    y = hI * B0
    if t.hi <= B0.lo:
        T3, R, core, case = Iv(0, 0), Iv(0, 0), Iv(0, 0), 't<b0'
    elif t.lo >= B0.hi:
        R = R_bounds(h, y, upper, gridn)
        core = ELL * t - B0 * G(y)
        T3 = core + R
        case = 'hb0>=D' if y.lo >= D.hi else ('hb0<D' if y.hi <= D.lo else 'hb0~D')
    else:
        T3, R, case = Iv(0, max(0, (t - B0).hi)), Iv(0, 0), 't~b0'
        core = T3
    return {'h': hI, 't': t, 'T0': T0, 'T1': T1, 'T2': T2, 'T3': T3, 'R': R, 'core': core, 'y': y, 'z1': z1, 'case': case,
            'B': T0 + T1 + T2 + T3, 'I': T1 + T2 + T3}


# ---------------------------------------------------------------- the paper's Taylor surrogate Bt (exact moments)
def L_moments(z, nmax):
    """L_n(z) = int_0^z X^n / sqrt(1-X^2), n = 0..nmax"""
    beta = (1 - z * z).sqrt()
    L = [arcsin(z), 1 - beta]
    for n in range(2, nmax + 1):
        L.append(((n - 1) * L[n - 2] - ipow(z, n - 1) * beta) / n)
    return L


def J_moments(z):
    """J_j(z) = int_0^z X^j W, j = 0..3, derived here: J_0 = g(0) - g(z), J_j = -z^j g(z) + j K_{j-1}(z),
    K_n = int_0^z X^n g = L_n - lambda L_{n+2}"""
    L = L_moments(z, 4)
    K = [L[n] - LAM * L[n + 2] for n in range(3)]
    gz = g(z)
    return [1 - gz] + [-ipow(z, j) * gz + j * K[j - 1] for j in range(1, 4)]


def J_paper(z):
    """the paper's (num:moments-j), for a consistency comparison only"""
    L = L_moments(z, 4)
    beta = (1 - z * z).sqrt()
    out = []
    for j in range(4):
        inner = ipow(z, j) / beta - (1 if j == 0 else 0) - (j * L[j - 1] if j else 0)
        out.append(LAM * L[j + 1] - (1 - LAM) * inner)
    return out


def taylor_coeffs(kstar):
    q = 1 + SIG * kstar * kstar
    sq = q.sqrt()
    r0 = SQRTPI * kstar * sq - PI * kstar * kstar / 2
    r1 = SQRTPI * (1 + 2 * SIG * kstar * kstar) / sq - PI * kstar
    r2 = (SQRTPI * SIG * kstar * (3 + 2 * SIG * kstar * kstar) / (q * sq) - PI) / 2
    r3 = SQRTPI * SIG / (2 * q * q * sq)
    k = kstar
    return [r0 - k * r1 + k * k * r2 - k * k * k * r3, r1 - 2 * k * r2 + 3 * k * k * r3, r2 - 3 * k * r3, r3]


def Btilde(h, terms):
    """Bt(h) = B(h) with R replaced by int_y^D T(X/h) W, T the cubic Taylor polynomial of rho about (b_0 + D/h)/2"""
    hI = terms['h']
    y = terms['y']
    if terms['case'] in ('t<b0', 'hb0>=D'):
        return terms['B'], None
    if terms['case'] != 'hb0<D':
        raise ValueError('ambiguous branch at a knot')
    kstar = (B0 + D / hI) / 2
    c = taylor_coeffs(kstar)
    JD, Jy = J_moments(D), J_moments(y)
    Rt = Iv(0, 0)
    for j in range(4):
        Rt = Rt + c[j] / ipow(hI, j) * (JD[j] - Jy[j])
    return terms['T0'] + terms['T1'] + terms['T2'] + terms['core'] + Rt, (JD, Jy)


# ---------------------------------------------------------------- S: exact bounds on Phi(C, P, Q^2)
def _argmin(C, P, Q2, m):
    """a rational point near the minimiser of F on [0, m] (bisection on F'; accuracy matters only for tightness)"""
    def dF(w):
        return -2 * ELL * (P - w) / Q2 + 3 * C * w * w
    if dF(m) <= 0:
        return m
    a, b = Fr(0), m
    for _ in range(70):
        mid = (a + b) / 2
        if dF(mid) <= 0:
            a = mid
        else:
            b = mid
        a, b = Fr(math.floor(a * 2 ** 90), 2 ** 90), Fr(math.ceil(b * 2 ** 90), 2 ** 90)
    return a


def phi_lower(C, P, Q2):
    if P <= 0:
        return Fr(0)
    m = min(P, DM)
    w0 = _argmin(C, P, Q2, m)
    F0 = ELL * (P - w0) ** 2 / Q2 + C * w0 ** 3
    d0 = -2 * ELL * (P - w0) / Q2 + 3 * C * w0 ** 2
    cands = [F0 + min(d0 * (0 - w0), d0 * (m - w0))]       # convex F above its tangent at w0
    if P >= DM:
        cands.append(C * DM ** 3)
    return min(cands)


def phi_upper(C, P, Q2):
    if P <= 0:
        return Fr(0)
    m = min(P, DM)
    w0 = _argmin(C, P, Q2, m)
    return min(ELL * (P - w0) ** 2 / Q2 + C * w0 ** 3, C * min(DM, P) ** 3)


def C0(h):
    return min(Fr(134, 1000) * h ** 3, Fr(36, 100))


def PQ(h_for_u, h_for_R, t_R, h_for_Q, t_Q):
    u = imin(B0, Fr(96, 100) / Iv.of(h_for_u))
    P = u - 1 + 2 * Iv.of(h_for_R) * t_R / PI
    hq = Iv.of(h_for_Q)
    Q2 = 4 * (PI + 2 * hq * hq * t_Q) / (PI * PI)
    return P, Q2


def S_bounds(h):
    t = t_of(h)
    P, Q2 = PQ(h, h, t, h, t)
    return Fr(phi_lower(C0(h), P.flo(), Q2.fhi())), Fr(phi_upper(C0(h), P.fhi(), Q2.flo())), P, Q2


# ---------------------------------------------------------------- part A: the proposition by adaptive bisection
_ICACHE = {}


def certify_range(lo, hi, interior, step, cache, min_width=Fr(1, 10 ** 5)):
    """returns (status, number of pieces, smallest certified lower bound, detail); status 'certified', or
    'counterexample' (a point where the rigorous UPPER bound is negative), or 'stuck'"""
    pieces = []
    a = lo
    while a < hi:
        b = min(a + step, hi)
        pieces.append((a, b))
        a = b
    done, worst = 0, None
    while pieces:
        a, b = pieces.pop()
        if b not in cache:
            cache[b] = B_terms(b, upper=False)['I'].lo
        bound = (LAM * Iv.of(a) / PI - 1).lo + cache[b]
        if interior:
            ta, tb = t_of(a), t_of(b)
            P, Q2 = PQ(b, a, ta, b, tb)
            bound_f = Fr(bound, ONE) + phi_lower(C0(a), P.flo(), Q2.fhi())
        else:
            bound_f = Fr(bound, ONE)
        if bound_f > 0:
            done += 1
            worst = bound_f if worst is None else min(worst, bound_f)
            continue
        for h in (a, b):                                 # a failed piece: look for a rigorous counterexample first
            up = B_terms(h, upper=True)['B'].fhi() + (S_bounds(h)[1] if interior else 0)
            if up < 0:
                return 'counterexample', done, worst, 'at h = %s the upper bound of %s is %.6e < 0' % (h, 'B + S' if interior else 'B', float(up))
        if b - a < min_width:
            return 'stuck', done, worst, (a, b, float(bound_f))
        mid = (a + b) / 2
        pieces += [(a, mid), (mid, b)]
    return 'certified', done, worst, None


# ---------------------------------------------------------------- reading the paper
def parse_tables(src):
    lines = src.text(NUM).split('\n')
    knots = {}
    for ln in lines[441:453]:                                  # numerics.tex:442-453
        cells = [c.strip() for c in ln.replace('\\\\', '').split('&')]
        for k in (0, 3):
            h, b, s = cells[k:k + 3]
            knots[Fr(h)] = (int(b), None if s == '--' else int(s))
    gaps = []
    for ln in lines[526:538]:                                  # numerics.tex:527-538
        for a, b, v in re.findall(r'\$\[([\d.]+),([\d.]+)\]\$&(\d+)', ln):
            gaps.append((Fr(a), Fr(b), int(v)))
    return knots, gaps


RANGES = ((Fr('.64'), Fr('1.02'), False, Fr(1, 50)), (Fr('1.02'), Fr('1.62'), True, Fr(1, 100)), (Fr('1.62'), Fr('2.25'), False, Fr(3, 100)))


def decide(src=None, knot_override=None, gap_override=None, slack_override=None, ranges=RANGES):
    src = src or Sources()
    checks = []
    num = src.text(NUM)
    nest = src.text(NEST)
    paper = src.text(PAPER)
    flat = num.replace('\n', ' ')
    check(checks, 'the proposition as stated (numerics.tex:10-16)', 'B(h)&>0 &&\\text{for }h\\in[.64,1.02]\\cup[1.62,2.25]' in flat
          and 'B(h)+S(h)&>0 &&\\text{for }h\\in[1.02,1.62]' in flat)
    check(checks, 'the definitions read (nest:weight, nest:baseline, nest:gain-parameters, nest:gain-coefficient, nest:gain-definition)',
          all(k in nest for k in ('Fix $\\lambda=0.98$', 'D=\\frac{\\sqrt{48}}7,\\qquad \\ell=0.28', 'a_0=1/\\pi$, $b_0=1-1/\\pi',
                                 'u=\\min\\{b_0,0.96/h\\}', 'd_m=0.21', 'C_0(h)=\\min\\{0.134h^3,0.36\\}', 'Q=\\frac2\\pi\\sqrt{\\pi+2h^2t}')))
    knots, gaps = parse_tables(src)
    if knot_override:
        knots = dict(knots)
        knots.update(knot_override)
    if gap_override:
        gaps = [(a, b, gap_override.get((a, b), v)) for a, b, v in gaps]
    check(checks, 'Table num:knot-table read: 24 knots from .64 to 2.25 with 16 s-entries; Table num:gap-table: 23 intervals',
          len(knots) == 24 and min(knots) == Fr('.64') and max(knots) == Fr('2.25') and sum(v[1] is not None for v in knots.values()) == 16
          and len(gaps) == 23, '%d knots, %d gaps' % (len(knots), len(gaps)))

    # ---- constants and the pi enclosure
    pim, pip = Fr('3.14159265358979'), Fr('3.14159265358980')
    check(checks, 'pi enclosure (Machin, alternating brackets, here): the printed pi_- < pi < pi_+ holds', pim < PI.flo() and PI.fhi() < pip,
          'pi in %r' % PI)
    a31, e31 = _arctan_exact(Fr(1, 5), 31)
    a9, e9 = _arctan_exact(Fr(1, 239), 9)
    check(checks, 'the paper\'s rational comparisons for pi (A_31(1/5), A_9(1/239), e_N) hold exactly (:370-373)',
          pim < 16 * a31 - 4 * e9 and 16 * e31 - 4 * a9 < pip)
    check(checks, 'g(D) = 7/25 = ell and int_0^D W = 1 - ell = .72 (sqrt(1 - 48/49) = 1/7 exactly)',
          (1 - LAM * D2) * 7 == ELL and 1 - ELL == Fr('.72'))
    # W = -g' as a polynomial identity in the numerator: -[-2 lam X (1-X^2) + X (1 - lam X^2)] = X(.96 - .98 X^2)
    ok_w = all(-(-2 * LAM * X * (1 - X * X) + X * (1 - LAM * X * X)) == X * (Fr('.96') - Fr('.98') * X * X) for X in (Fr(k, 7) for k in range(7)))
    check(checks, 'W = -g\' = X(.96 - .98X^2)/(1-X^2)^(3/2) (numerator identity, a cubic checked at 7 points)', ok_w)

    # ---- part A: the proposition, independently
    cache = _ICACHE
    A = []
    for lo, hi, interior, step in ranges:
        st, n, w, det_ = certify_range(lo, hi, interior, step, cache)
        A.append((lo, hi, interior, st, n, w, det_))
        check(checks, 'A. %s > 0 on [%s, %s], decided here by monotone bounds on an adaptive partition' % ('B + S' if interior else 'B', _d(lo), _d(hi)),
              st == 'certified', ('%d pieces, smallest certified lower bound %.3e' % (n, w or 0)) if st == 'certified' else '%s: %s' % (st, det_))

    # ---- part B: the knot table
    rows = {}
    for h in sorted(knots):
        T = B_terms(h)
        Bt, _ = Btilde(h, T)
        rows[h] = {'T': T, 'Bt': Bt, 'B': T['B'], 'S': S_bounds(h) if knots[h][1] is not None else None}
    branch_ok = all(r['T']['case'] in ('t<b0', 'hb0>=D', 'hb0<D') for r in rows.values())
    check(checks, 'B. no knot is a branch tie (t = b_0 or h b_0 = D): every branch decided by disjoint enclosures (:428-429)', branch_ok,
          ', '.join('%s:%s' % (_d(h), rows[h]['T']['case']) for h in sorted(rows) if rows[h]['T']['case'] != 'hb0<D'))
    sl = slack_override or (Fr('1.10'), Fr('1.95'), Fr('1.00'), Fr('1.66'))
    bad_b, bad_bs, bad_s, bad_ss = [], [], [], []
    lo_b = hi_b = lo_s = hi_s = None
    for h in sorted(rows):
        b_h, s_h = knots[h]
        r = rows[h]
        v_lo, v_hi = 10 ** 5 * r['Bt'].flo() - b_h, 10 ** 5 * r['Bt'].fhi() - b_h
        lo_b = v_lo if lo_b is None else min(lo_b, v_lo)
        hi_b = v_hi if hi_b is None else max(hi_b, v_hi)
        if not v_lo > 0:
            bad_b.append(str(h))
        if not (v_lo > sl[0] and v_hi < sl[1]):
            bad_bs.append('%s (%.4f)' % (h, float(v_lo)))
        if s_h is not None:
            s_lo, s_hi = 10 ** 5 * r['S'][0] - s_h, 10 ** 5 * r['S'][1] - s_h
            lo_s = s_lo if lo_s is None else min(lo_s, s_lo)
            hi_s = s_hi if hi_s is None else max(hi_s, s_hi)
            if not s_lo > 0:
                bad_s.append(str(h))
            if not (s_lo > sl[2] and s_hi < sl[3]):
                bad_ss.append('%s (%.4f)' % (h, float(s_lo)))
    check(checks, 'B. 10^5 Bt(h) > b_h at all 24 knots (Table num:knot-table)', not bad_b, ', '.join(bad_b))
    check(checks, 'B. stated slack 1.10 < 10^5 Bt(h) - b_h < 1.95 at all 24 knots (num:table-slack)', not bad_bs,
          'range of 10^5 Bt - b_h: [%.4f, %.4f]%s' % (float(lo_b), float(hi_b), (' violations: ' + ', '.join(bad_bs)) if bad_bs else ''))
    check(checks, 'B. 10^5 S(h) > s_h at all 16 interior knots', not bad_s, ', '.join(bad_s))
    check(checks, 'B. stated slack 1.00 < 10^5 S(h) - s_h < 1.66 at all 16 knots (num:table-slack)', not bad_ss,
          'range of 10^5 S - s_h: [%.4f, %.4f]%s' % (float(lo_s), float(hi_s), (' violations: ' + ', '.join(bad_ss)) if bad_ss else ''))
    h146 = Fr('1.46')
    r = rows[h146]
    check(checks, 'B. -273.170 < 10^5 Bt(1.46) < -273.169 (:473), and Bt(1.46) = B(1.46) (h b_0 > D: no Taylor term)',
          Fr('-273.170') < 10 ** 5 * r['Bt'].flo() and 10 ** 5 * r['Bt'].fhi() < Fr('-273.169') and r['T']['case'] == 'hb0>=D',
          '10^5 Bt in [%.6f, %.6f]' % (float(10 ** 5 * r['Bt'].flo()), float(10 ** 5 * r['Bt'].fhi())))
    s_lo, s_hi, P146, Q146 = r['S']
    cap = C0(h146) * DM ** 3
    check(checks, 'B. 10^5 S(1.46) = 333.396 exactly, by the cap term (P >= d_m and the uncapped minimum exceeds C_0 d_m^3) (:474-477)',
          10 ** 5 * cap == Fr('333.396') and P146.flo() >= DM and s_lo == cap and s_hi == cap, '10^5 C_0 d_m^3 = %s' % (10 ** 5 * cap))
    # the knot values themselves against the proposition (implied by A; recorded per knot)
    ok_kn = all((rows[h]['B'].flo() + (rows[h]['S'][0] if Fr('1.02') < h < Fr('1.62') else 0)) > 0 for h in rows)
    check(checks, 'B. at every knot the rigorous B (and B + S inside) is positive', ok_kn)
    # Lemma num:taylor-error at the knots: B >= Bt - .008 (D/h - b_0)_+^4, with the rigorous B here
    ok_te, worst_te, refined = True, None, []
    for h in rows:
        if rows[h]['T']['case'] in ('t<b0', 'hb0>=D'):
            continue                                     # L = 0: Bt is B by definition, the lemma is an identity
        Lp = max(Fr(0), (D / Iv.of(h) - B0).fhi())
        Bh, gridn = rows[h]['B'], GRIDN
        diff_ = Bh.flo() - (rows[h]['Bt'].fhi() - Fr(8, 1000) * Lp ** 4)
        while diff_ < 0 and rows[h]['T']['case'] == 'hb0<D' and (D.fhi() - rows[h]['T']['y'].flo()) * gridn * 8 < 40000:
            gridn *= 8                                   # the chord enclosure is too coarse for this E(h): refine
            Bh = B_terms(h, upper=False, gridn=gridn)['B']
            diff_ = Bh.flo() - (rows[h]['Bt'].fhi() - Fr(8, 1000) * Lp ** 4)
            refined.append('%s: step 1/%d' % (_d(h), gridn))
        ok_te &= diff_ >= 0
        worst_te = diff_ if worst_te is None else min(worst_te, diff_)
    check(checks, 'B. Lemma num:taylor-error holds at the 24 knots: B >= Bt - .008 (D/h - b_0)_+^4 (B enclosed independently)', ok_te,
          'smallest slack %.3e; grids refined at %s' % (float(worst_te), ', '.join(refined) or 'none'))

    # ---- part B: the gap table, as arithmetic on the paper's constants
    Dp = Fr('.989743318611')
    bm = 1 - 1 / pim
    check(checks, 'B. 49 D_+^2 > 48, so D < D_+ (:498)', 49 * Dp * Dp > 48)
    check(checks, 'B. 2/(1.02)^2 + .4 < 2.4 (:490)', 2 / Fr('1.02') ** 2 + Fr('.4') < Fr('2.4'))

    def E(h):
        return Fr(8, 1000) * max(Dp / h - bm, 0) ** 4
    ks = sorted(knots)
    pairs = list(zip(ks, ks[1:]))
    gapmap = {(a, b): v for a, b, v in gaps}
    bad_gap, Ms = [], {}
    for a, b in pairs:
        chi = 1 if Fr('1.02') <= a and b <= Fr('1.62') else 0

        def val(h):
            b_h, s_h = knots[h]
            return Fr(b_h + (chi * s_h if chi else 0), 10 ** 5) - E(h)
        K = Fr('2.4') if chi else 2 / a ** 2
        M = min(val(a), val(b)) - K * (b - a) ** 2 / 8
        Ms[(a, b)] = M
        if (a, b) not in gapmap or not 10 ** 6 * M >= gapmap[(a, b)] or not M > 0:
            bad_gap.append('[%s,%s]: 10^6 M = %.3f vs %s' % (a, b, float(10 ** 6 * M), gapmap.get((a, b))))
    check(checks, 'B. Table num:gap-table: the 23 intervals are the consecutive knots, and every printed integer <= 10^6 M_{a,b} from (num:gap-formula)',
          not bad_gap and len(pairs) == 23, '; '.join(bad_gap))
    mmin = min(Ms.values())
    argmins = sorted(k for k, v in Ms.items() if v == mmin)
    check(checks, 'B. the smallest margin is exactly 9/100000, on [1.42,1.46] and [1.46,1.50]; at 1.46 the corrected bound is .00057 and the loss .00048 (:547-550)',
          mmin == Fr(9, 100000) and argmins == [(Fr('1.42'), Fr('1.46')), (Fr('1.46'), Fr('1.50'))]
          and Fr(knots[h146][0] + knots[h146][1], 10 ** 5) - E(h146) == Fr('.00057') and Fr('2.4') * Fr('.04') ** 2 / 8 == Fr('.00048'),
          'min %s on %s' % (mmin, ', '.join('[%s,%s]' % (_d(a), _d(b)) for a, b in argmins)))

    # ---- part C: printed arithmetic in the lemmas, recomputed
    t102, t162 = t_of(Fr('1.02')), t_of(Fr('1.62'))
    C = []
    C.append(('num:s-second: .64 < t < .8 on [1.02,1.62] and t(1.62) < .65 (t decreasing)', t162.flo() > Fr('.64') and t102.fhi() < Fr('.8') and t162.fhi() < Fr('.65')))
    C.append(('num:s-second: 1792/9350 = 2(.64)^2/((22/7)(2-.64)), 160/471 = 2(.8)^2/(3.14(2-.8)), .19 < 1792/9350 < 160/471 < .34',
              Fr(1792, 9350) == 2 * Fr('.64') ** 2 / (Fr(22, 7) * (2 - Fr('.64'))) and Fr(160, 471) == 2 * Fr('.8') ** 2 / (Fr('3.14') * (2 - Fr('.8')))
              and Fr('.19') < Fr(1792, 9350) < Fr(160, 471) < Fr('.34')))
    C.append(('num:s-second: 1053/1570 = 2(1.62)(.65)/3.14 < .671 and b_0 - 1 + 1053/1570 < .36 (b_0 < 15/22)',
              Fr(1053, 1570) == 2 * Fr('1.62') * Fr('.65') / Fr('3.14') and Fr(1053, 1570) < Fr('.671') and B0.fhi() < Fr(15, 22) and Fr(15, 22) - 1 + Fr(1053, 1570) < Fr('.36')))
    C.append(('num:s-second: h_c = .96/b_0 > 1.4; w\' > .19 - .36/(2.04) > 0; w\'\' <= .36/(4(1.02)^2) < .8; -.96/1.4^2 + .19 - .36/2.8 > -.50; 1.92/1.4^3 + .36/(4(1.4)^2) < .8',
              (Fr('.96') / B0).flo() > Fr('1.4') and Fr('.19') - Fr('.36') / Fr('2.04') > 0 and Fr('.36') / (4 * Fr('1.02') ** 2) < Fr('.8')
              and -Fr('.96') / Fr('1.4') ** 2 + Fr('.19') - Fr('.36') / Fr('2.8') > Fr('-.50') and Fr('1.92') / Fr('1.4') ** 3 + Fr('.36') / (4 * Fr('1.4') ** 2) < Fr('.8')))
    C.append(('num:s-second: C_0 <= .36, C_0\' = .402h^2 <= 1.08, C_0\'\' = .804h <= 2.16 for h <= 1.62',
              Fr('.402') * Fr('1.62') ** 2 <= Fr('1.08') and Fr('.804') * Fr('1.62') <= Fr('2.16')))
    prod = Fr('2.16') * DM ** 3 + 6 * Fr('1.08') * DM ** 2 * Fr('.34') + 6 * Fr('.36') * DM * Fr('.50') ** 2 + 3 * Fr('.36') * DM ** 2 * Fr('.8')
    C.append(('num:s-second: the product-rule bound equals .26866728 < .4, and 2.16 d_m^3 < .4', prod == Fr('.26866728') and prod < Fr('.4') and Fr('2.16') * DM ** 3 < Fr('.4')))
    C.append(('num:taylor-error: .68 < b_0 < .69, and 15 sqrt(22/7)(11/14)^2(.69)/(1+(3.14/4)(.68)^2)^(7/2) < 4 (squared: rational)',
              B0.flo() > Fr('.68') and B0.fhi() < Fr('.69')
              and 225 * Fr(22, 7) * Fr(11, 14) ** 4 * Fr('.69') ** 2 < 16 * (1 + Fr('3.14') / 4 * Fr('.68') ** 2) ** 7))
    C.append(('num:taylor-error: 6 sigma b_0^2 >= 1 (|rho\'\'\'\'| decreasing beyond b_0) and .72 * 4 (L/2)^4/24 = .0075 L^4 <= .008 L^4',
              (6 * SIG * B0 * B0).flo() >= 1 and Fr('.72') * 4 * Fr(1, 16) / 24 == Fr('.0075')))
    C.append(('num:arithmetic: j_D^2 = (1 - 2/sqrt7)/2 (m(D)^2 = 3/7 exactly) and (1 - 2/sqrt7)/2 < 1/8 < .36^2 (64 > 63)',
              D2 * Fr(7, 16) == Fr(3, 7) and 8 ** 2 > 9 * 7 and Fr(1, 8) < Fr('.36') ** 2))
    C.append(('num:layer-cake: rho\'(b_0) = 2/(pi+1) (enclosures overlap) and rho(b_0) = b_0',
              _overlap(SQRTPI * (1 + 2 * SIG * B0 * B0) / (1 + SIG * B0 * B0).sqrt() - PI * B0, 2 / (PI + 1)) and _overlap(rho(B0), B0)))
    C.append(('nest:s-formula: 16/27 - 1 + 21/44 = 83/1188 > 0, and 9/16 - pi/4 < 0', Fr(16, 27) - 1 + Fr(21, 44) == Fr(83, 1188) and Fr(9, 16) - PI.flo() / 4 < 0))
    th_lo, th_hi = Fr(32, 37), Fr(13, 15)
    cdm = Fr('2.7') * DM
    C.append(('nest:coefficient-bound: c d_m = .567; .567(32/37)^2 - 3.14(5/37) = -73/342250; .567(13/15)^2 - (22/7)(2/15) = 3587/525000',
              cdm == Fr('.567') and cdm * th_lo ** 2 - Fr('3.14') * (1 - th_lo) == Fr(-73, 342250) and cdm * th_hi ** 2 - Fr(22, 7) * (1 - th_hi) == Fr(3587, 525000)))
    Mth = th_lo ** 2 * (3 - th_lo) / 6
    qm = (2 + 2 * th_lo - th_lo ** 2) / (2 * (3 - th_lo))
    p2 = 1 + Fr('2.7') * DM ** 2 * th_hi ** 2
    C.append(('nest:coefficient-bound: M(32/37) = 40448/151959 > .2659, q_m(32/37) = 2041/2923 > .697, p_2(13/15) = 2723587/2500000 < 1.09',
              Mth == Fr(40448, 151959) > Fr('.2659') and qm == Fr(2041, 2923) > Fr('.697') and p2 == Fr(2723587, 2500000) < Fr('1.09')))
    C.append(('nest:coefficient-bound: (.91*2.7*.2659)^2 - .574^2 1.09^3 = 14121304169/10^14; .574(.617)^3 = .134824054862; .96 - 1.62*.06363 = .8569194; .574(.856)^3 = .360025437184; 1 - 1/3.14 - .06363 > .617',
              (Fr('.91') * Fr('2.7') * Fr('.2659')) ** 2 - Fr('.574') ** 2 * Fr('1.09') ** 3 == Fr(14121304169, 10 ** 14)
              and Fr('.574') * Fr('.617') ** 3 == Fr('.134824054862') and Fr('.96') - Fr('1.62') * Fr('.06363') == Fr('.8569194')
              and Fr('.574') * Fr('.856') ** 3 == Fr('.360025437184') and 1 - 1 / Fr('3.14') - Fr('.06363') > Fr('.617') and Fr('.303') * DM == Fr('.06363')))
    dtab = [(Fr('.84'), Fr('.456'), Fr('.50'), None), (Fr('.89'), Fr('.44'), Fr('.46'), Fr('.84')), (Fr('.94'), Fr('.40'), Fr('.41'), Fr('.89')), (Fr('.96'), Fr('.36'), Fr('.33'), Fr('.94'))]
    v1 = [(Fr('.49') - n) * (1 - b * b) - Fr('.01') for b, n, d, a in dtab]
    v2 = [a * a * (1 - a * a) for b, n, d, a in dtab if a is not None]
    v3 = [n - Fr('.91') * d for b, n, d, a in dtab]
    C.append(('nest:derivative-bound: (.49-n)(1-b^2) - .01 = .0000096, .000395, .000476, .000192; D_1(a)^2 = .20772864, .16467759, .10285104 < .46^2, .41^2, .33^2; n - .91 d = .001, .0214, .0269, .0597',
              v1 == [Fr('.0000096'), Fr('.000395'), Fr('.000476'), Fr('.000192')] and v2 == [Fr('.20772864'), Fr('.16467759'), Fr('.10285104')]
              and all(x < y ** 2 for x, y in zip(v2, (Fr('.46'), Fr('.41'), Fr('.33')))) and v3 == [Fr('.001'), Fr('.0214'), Fr('.0269'), Fr('.0597')]))
    C.append(('nest:shape-gain: 16/27 - .21 = 1033/2700 > .38 > 1/3 > a_0; c d_m^2 = .11907 < .14; 35/24 - 25(.21)^2/16 = 26677/19200 >= 1.35; .525^2 bound -3/20 + w/5 + w^2/25 < 0',
              Fr(16, 27) - DM == Fr(1033, 2700) and Fr(1033, 2700) > Fr('.38') > Fr(1, 3) > (1 / PI).fhi() and Fr('2.7') * DM ** 2 == Fr('.11907') < Fr('.14')
              and Fr(35, 24) - 25 * DM ** 2 / 16 == Fr(26677, 19200) >= Fr('1.35') and Fr(-3, 20) + Fr('.525') ** 2 / 5 + Fr('.525') ** 4 / 25 < 0))
    for name, ok in C:
        check(checks, 'C. ' + name, ok)

    # ---- consistency of the paper's formulas with the derivation here (overlap of enclosures; not a proof)
    ok_lc, ok_J, ok_Q = True, True, True
    for h, r in rows.items():
        T = r['T']
        hI, t = T['h'], T['t']
        x = T['z1']
        y = imin(D, T['y'])
        Jx, Jy_ = J_moments(x), J_moments(y)
        lc = ELL * t + (PI / (hI * hI)) * Jx[2] + (Jy_[1] - Jx[1]) / hI
        mine = T['T1'] + T['T2'] + T['core']
        ok_lc &= _overlap(lc, mine)
        for z in (x, y):
            ok_J &= all(_overlap(a, b) for a, b in zip(J_moments(z), J_paper(z)))
        Qn = 2 / SQRTPI * (1 + 4 * hI * hI / PI).sqrt().sqrt()
        ok_Q &= _overlap(Qn * Qn, 4 * (PI + 2 * hI * hI * t) / (PI * PI))
    check(checks, 'consistency: the layer-cake formula (num:layer-cake-formula) equals the direct integration here at all 24 knots (overlap)', ok_lc)
    check(checks, 'consistency: the paper\'s moments (num:moments-j) equal the moments derived here at x, y for all knots (overlap)', ok_J)
    check(checks, 'consistency: numerics.tex Q = (2/sqrt pi)(1+4h^2/pi)^(1/4) equals nesting.tex Q = (2/pi) sqrt(pi + 2h^2 t) at all knots (overlap)', ok_Q)
    check(checks, 'the paper says its exact calculations are included with the source (paper.tex:157); the release has no code or data file for them',
          'The reproducible exact calculations are included with the source.' in paper, 'recorded as an observation; the tables are the checkable certificate')

    ok = all(c['pass'] for c in checks)
    # a failed part-A check means the bisection could not finish (REFUSED); any other failure, with the statement,
    # definitions and tables read, is a printed claim that the published object does not satisfy (REFUTED)
    failed = [c['check'] for c in checks if not c['pass']]
    readable = checks[0]['pass'] and checks[1]['pass'] and checks[2]['pass']
    counter = any(x[3] == 'counterexample' for x in A)
    stuck = any(x[3] == 'stuck' for x in A)
    verdict = 'CERTIFIED' if ok else ('REFUTED' if readable and (counter or not stuck) else 'REFUSED')
    return {'verdict': verdict, 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: Proposition num:scalar-positive (B > 0 on [.64,1.02] u [1.62,2.25], B + S > 0 on [1.02,1.62]), '
                       'decided independently, and the paper\'s knot and gap tables; NOT the geometric reduction to these inequalities',
            'value': {'pieces': [x[4] for x in A], 'smallest_lower_bound': [float(x[5] or 0) for x in A],
                      'B_1.46': repr(rows[h146]['B']), 'S_1.46': str(rows[h146]['S'][0]),
                      'Bt_minus_b_range': [float(lo_b), float(hi_b)], 'S_minus_s_range': [float(lo_s), float(hi_s)],
                      'gap_min': str(mmin),
                      'knots': {_d(h): {'b_h': knots[h][0], '1e5_Bt': '%.4f' % float(10 ** 5 * rows[h]['Bt'].flo()),
                                        's_h': knots[h][1], '1e5_S': None if rows[h]['S'] is None else '%.4f' % float(10 ** 5 * rows[h]['S'][0])}
                                for h in sorted(rows)}}}


def _d(x):
    """an exact decimal string for a terminating rational (printing only)"""
    x = Fr(x)
    k = 0
    while (x * 10 ** k).denominator != 1 and k < 12:
        k += 1
    n = x * 10 ** k
    if n.denominator != 1:
        return str(x)
    n = int(n)
    s = str(abs(n)).rjust(k + 1, '0')
    return ('-' if n < 0 else '') + (s[:-k] + '.' + s[-k:] if k else s)


def _overlap(a, b):
    return a.lo <= b.hi and b.lo <= a.hi


def forge():
    """each must NOT certify: a knot bound raised past the true value; a gap entry raised; a slack bound tightened"""
    out = []
    r = decide(knot_override={Fr('1.46'): (-272, 332)})
    out.append(('b_h at 1.46 raised from -275 to -272 (above 10^5 Bt = -273.17)', r['verdict']))
    r = decide(gap_override={(Fr('1.42'), Fr('1.46')): 91})
    out.append(('gap entry [1.42,1.46] raised from 90 to 91', r['verdict']))
    r = decide(knot_override={Fr('1.02'): (144, 78)})
    out.append(('s_h at 1.02 raised from 76 to 78', r['verdict']))
    r = decide(ranges=((Fr('.64'), Fr('1.10'), False, Fr(1, 50)),))
    out.append(('the exterior range claimed up to 1.10 instead of 1.02 (B alone, without the gain S)', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    import time
    t0 = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides')}, indent=1))
    print(json.dumps({k: v for k, v in res['value'].items() if k != 'knots'}))
    for h, r in res['value']['knots'].items():
        print('  h=%-5s b_h=%6d  10^5 Bt=%11s   s_h=%5s  10^5 S=%9s' % (h, r['b_h'], r['1e5_Bt'], r['s_h'] if r['s_h'] is not None else '--', r['1e5_S'] or '--'))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], '|', c['detail'])
    print('%.1fs' % (time.time() - t0))
    if '--no-forge' not in sys.argv:
        t1 = time.time()
        print(forge())
        print('forges %.1fs' % (time.time() - t1))
