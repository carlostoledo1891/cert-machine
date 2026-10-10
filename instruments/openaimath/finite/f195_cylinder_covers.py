"""F-195 -- "Finite angular cylinder covers below the half-area bound" (openai/math family 100).

THE CLAIM (build/sections/introduction.tex:24-43, Theorem thm:counterexample; abstract main.tex:13-19): for the
regular tetrahedron K = {(x, y, Ht): 0 <= t <= 1, |x| <= 1-t, |y| <= t}, H = sqrt 2, A_min(K) = sqrt 2, and for every
0 < eps <= 1/2000 the 2 ceil(2/eps^2) triangular cylinders of construction.tex:52-128 cover K with
(1/sqrt 2) sum |B_i| = 1/2 - (13/6000) eps^2 + O(eps^4), remainder at most 2 eps^4, total strictly below A_min/2.
Corollary cor:normalized-covering uses eps = 1/2000 (16,000,000 cylinders).  Proposition prop:angular-cubic
(cubic-buffer.tex:17-31) gives a second family: 2 ceil(8/tau^2) cylinders with cutoffs T_j = 1/2 + tau^2 d_j +
(25/4) tau^3, covering for 0 < tau <= 1, with |C/H - 1/2 + tau^2/240 - (25/2) tau^3| <= 2 tau^4 (tau <= 1/50) and
strict saving for 0 < tau <= 1/4000 (256,000,000 cylinders at tau = 1/4000).

WHAT IS DECIDED HERE, exactly (Fraction, and exact arithmetic in Q(sqrt 2) as pairs of Fractions):
  M. A_min(K) = sqrt 2, by a route different from the paper's (U+V)^2 >= 1 argument: the face area vectors are
     computed from the four vertices (cross products in Q(sqrt 2)) and checked equal to the printed (0, +-H, -1),
     (+-H, 0, 1) (each of length sqrt 3, summing to zero); by Cauchy's formula the shadow area A(u) = (1/2) sum
     |N_i . u| is the support function of the zonotope Z = sum [-N_i/2, N_i/2], so min over unit u of A(u) is the
     inradius of Z, attained at a facet normal, and every facet normal of a zonotope is a cross product of two
     generators.  All 6 cross products n are tried: min A(n)^2/|n|^2 = 2 exactly (sign decisions in Q(sqrt 2)
     exact).  The paper's closed form A(u) = max(H|u_x|,|u_z|) + max(H|u_y|,|u_z|) is also compared at those normals.
  P. The construction's parameters: n = ceil(2/eps^2) = 8,000,000 at eps = 1/2000 (16,000,000 cylinders), Delta =
     2/n <= eps^2; N = ceil(8/tau^2) = 128,000,000 at tau = 1/4000 (256,000,000 cylinders), Delta <= tau^2/4.
  I. Every polynomial identity the coverage proof rests on, as exact polynomial identities (_poly): the
     shared-boundary identity (eq:shared-boundaries), the plane of the tilted lines (construction.tex:66-71), the
     intercept equations (eq:lower-intercept) and the radial-budget identity (eq:radial-budget) modulo the two
     intercept relations with explicit cofactors, d(p)+d(q)-(p^2+q^2+2p^2q^2)/16 = (p^2-q^2)^2/16, the integrals
     int d = 1/15 and int A = 17/30, the gap (eq:uniform-coverage-gap) at eps = eta/2 equal to eta - 17eta^2/16 > 0
     and decreasing in eps, the cubic budget identity tau(21/2 - 51 tau/4) >= 33 tau/8, 41/32 > 1, 59/64,
     2eta - 1/240 = -13/6000, 2eps^2 <= 1/2,000,000 < 13/6000, 25/(2 4000) + 2/4000^2 <= 1/320 + 1/8,000,000 <
     1/240, and the edge-four constants of Remark rem:angular-cubic-scale (1/15, 400, 128, 1/8000, 1/100).
  A. THE AREA, exactly enclosed, at eps = 1/2000 (main construction) and tau = 1/4000 (cubic): the sum
     (eq:exact-area-sum) S/H = sum_j Delta T_j^2 (1 + eps^2 A_j)^(-1/2), A_j = alpha_j^2 + 2 beta_j^2, over all 8e6 /
     1.28e8 sectors, between the sums with g_lo(x) = 1 - x/2 + 3x^2/8 - 5x^3/16 and g_hi(x) = 1 - x/2 + 3x^2/8, which
     bracket (1+x)^(-1/2) on [0, eps^2] (proved here: g_hi^2(1+x) - 1 and 1 - g_lo^2(1+x) are checked nonnegative on
     that interval by a dominant-lowest-coefficient certificate, and g_lo, g_hi > 0).  The per-sector maximum of d is
     at the endpoint of larger |q| (d is increasing in q^2, n even, so no sector straddles 0).  Each half-sum is a
     polynomial sum in j, evaluated exactly by interpolating its partial sums (degree <= 21) -- checked against a
     direct sector-by-sector exact sum at eps = 1/20.  The projection factor and intercept area are checked on exact
     triangles (projected area^2 from the vertices in Q(sqrt 2)).  Decided: S/H < 1/2 (strict saving: total base
     area < H/2 = A_min/2) and the printed remainder bounds |.| <= 2 eps^4, 2 tau^4.
  S. A SAMPLE of the coverage (evidence, not a decision): exact rational points of K chosen just outside their
     first-family cutoff near t = 1/2 (the only place both cutoffs can matter), each checked covered by the
     second family; for t, s > eps/2 the angular sequences F_i, G_i are strictly increasing, so the only cylinders
     that can contain a point are the (at most two) bracketing sectors -- the membership test is exact.

WHAT IS NOT DECIDED -- and why the row is REFUSED: COVERAGE.  Proposition prop:coverage / prop:angular-cubic assert
that the closed tetrahedron (a continuum) lies in the union of 1.6e7 (resp. 2.56e8) cylinders.  Their proof is a
uniform first-crossing + radial-budget argument whose identities are checked in I; the analytic inequality chain
between them (the rough-angle bounds, |beta_j - q/2| <= Delta/4, |alpha_j - (1+q^2)/4| <= Delta/2, ...) is theory
here.  A direct exact certification of coverage is out of reach: a cell decomposition must resolve sectors of
angular width Delta = 2.5e-7 and a radial overlap margin of order eta eps^2 = 2.5e-10 near t = 1/2, i.e. >= ~1e16
cells; a sector-pair semi-algebraic decision must treat every pair (j, k) of first/second-family sectors meeting the
junction band, ~n^2/2 = 3.2e13 pairs at eps = 1/2000 (8.2e15 at tau = 1/4000) -- at an optimistic 1 ms per exact pair,
~1,000 CPU-years.  The theorem's "for every eps" / "for every tau" is decided only at the endpoints eps = 1/2000 and
tau = 1/4000 for the area.
"""
import os
import random
import sys
import time
from fractions import Fraction as Fr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, const, mul, pw, scale, sub, total, var  # noqa: E402

D = 'preprints/Finite-angular-cylinder-covers-below-the-half-area-bound-September-27-2026/build/'
INTRO, CONS, COV, AREA, CUBIC, SCALE = (D + 'sections/' + f for f in (
    'introduction.tex', 'construction.tex', 'coverage.tex', 'area.tex', 'cubic-buffer.tex', 'scaling-specializations.tex'))
EPS = Fr(1, 2000)
ETA = Fr(1, 1000)
TAU = Fr(1, 4000)


def ceil(x):
    return -((-x.numerator) // x.denominator)


# ---------------------------------------------------------------- Q(sqrt 2)
class Q2:
    """a + b sqrt 2, a, b Fractions"""
    __slots__ = ('a', 'b')

    def __init__(self, a, b=0):
        self.a, self.b = Fr(a), Fr(b)

    def __add__(self, o):
        o = o if isinstance(o, Q2) else Q2(o)
        return Q2(self.a + o.a, self.b + o.b)

    def __sub__(self, o):
        o = o if isinstance(o, Q2) else Q2(o)
        return Q2(self.a - o.a, self.b - o.b)

    def __neg__(self):
        return Q2(-self.a, -self.b)

    def __mul__(self, o):
        o = o if isinstance(o, Q2) else Q2(o)
        return Q2(self.a * o.a + 2 * self.b * o.b, self.a * o.b + self.b * o.a)

    def __eq__(self, o):
        o = o if isinstance(o, Q2) else Q2(o)
        return self.a == o.a and self.b == o.b

    def sign(self):
        a, b = self.a, self.b
        if a >= 0 and b >= 0:
            return int(a > 0 or b > 0)
        if a <= 0 and b <= 0:
            return -1
        # opposite signs: compare a^2 with 2 b^2
        if a > 0:
            return 1 if a * a > 2 * b * b else (-1 if a * a < 2 * b * b else 0)
        return 1 if 2 * b * b > a * a else (-1 if 2 * b * b < a * a else 0)

    def __abs__(self):
        return -self if self.sign() < 0 else self


SQ2 = Q2(0, 1)


def cross(u, v):
    return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]


def dot(u, v):
    return u[0] * v[0] + u[1] * v[1] + u[2] * v[2]


def projection_minimum():
    H = SQ2
    V = [[Q2(1), Q2(0), Q2(0)], [Q2(-1), Q2(0), Q2(0)], [Q2(0), Q2(1), H], [Q2(0), Q2(-1), H]]
    cen = [sum((v[i] for v in V), Q2(0)) * Fr(1, 4) for i in range(3)]
    N = []
    for omit in range(4):
        f = [V[i] for i in range(4) if i != omit]
        e1 = [f[1][i] - f[0][i] for i in range(3)]
        e2 = [f[2][i] - f[0][i] for i in range(3)]
        n = [c * Fr(1, 2) for c in cross(e1, e2)]
        fc = [(f[0][i] + f[1][i] + f[2][i]) * Fr(1, 3) - cen[i] for i in range(3)]
        if dot(n, fc).sign() < 0:
            n = [-c for c in n]
        N.append(n)
    printed = [[Q2(0), H, Q2(-1)], [Q2(0), -H, Q2(-1)], [H, Q2(0), Q2(1)], [-H, Q2(0), Q2(1)]]
    same = sorted((tuple((c.a, c.b) for c in n) for n in N)) == sorted((tuple((c.a, c.b) for c in n) for n in printed))
    lengths = all(dot(n, n) == 3 for n in N)
    zero_sum = all(sum((n[i] for n in N), Q2(0)) == 0 for i in range(3))

    def A(u):
        return sum((abs(dot(n, u)) for n in N), Q2(0)) * Fr(1, 2)

    def A_closed(u):
        def mx(p, q):
            return p if (p - q).sign() >= 0 else q
        return mx(H * abs(u[0]), abs(u[2])) + mx(H * abs(u[1]), abs(u[2]))
    diffs = []
    closed_ok = True
    for a in range(4):
        for b in range(a + 1, 4):
            n = cross(N[a], N[b])
            nn = dot(n, n)
            if nn == 0:
                continue
            h = A(n)
            closed_ok &= (h == A_closed(n))
            diffs.append(h * h - nn * 2)          # A(n)^2 - 2|n|^2: >= 0 means A(n/|n|) >= sqrt 2
    min_ok = all(d_.sign() >= 0 for d_ in diffs)
    attained = any(d_ == 0 for d_ in diffs)
    # equality also at the printed direction u = (1,0,0): A = H
    at_ex = A([Q2(1), Q2(0), Q2(0)]) == H
    return dict(same=same, lengths=lengths, zero_sum=zero_sum, min_ok=min_ok, attained=attained and at_ex, closed_ok=closed_ok,
                candidates=len(diffs))


# ---------------------------------------------------------------- univariate polynomials in j
def padd(a, b):
    n = max(len(a), len(b))
    return [(a[i] if i < len(a) else 0) + (b[i] if i < len(b) else 0) for i in range(n)]


def pmul(a, b):
    out = [Fr(0)] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        if x:
            for k, y in enumerate(b):
                out[i + k] += x * y
    return out


def pscale(a, c):
    return [x * c for x in a]


def peval(a, x):
    r = Fr(0)
    for c in reversed(a):
        r = r * x + c
    return r


def pcompose(g, x):
    """g(x(j)) for a univariate g in x and polynomial x(j)"""
    out = [Fr(0)]
    for c in reversed(g):
        out = padd(pmul(out, x), [c])
    return out


def psum(P, a, b):
    """sum_{j=a}^{b-1} P(j), exactly: F(N) = sum_{j<N} P(j) is a polynomial of degree deg P + 1, interpolated"""
    deg = len(P)
    pts = list(range(deg + 1))
    vals, acc = [], Fr(0)
    for N in pts:
        vals.append(acc)
        acc += peval(P, N)

    def F(N):
        tot = Fr(0)
        for i, xi in enumerate(pts):
            num, den = Fr(1), Fr(1)
            for k, xk in enumerate(pts):
                if k != i:
                    num *= (N - xk)
                    den *= (xi - xk)
            tot += vals[i] * num / den
        return tot
    return F(b) - F(a)


def d_of(q):
    return pscale(padd(pmul(q, q), pmul(pmul(q, q), pmul(q, q))), Fr(1, 16))


G_HI = [Fr(1), Fr(-1, 2), Fr(3, 8)]
G_LO = [Fr(1), Fr(-1, 2), Fr(3, 8), Fr(-5, 16)]


def nonneg_on(p, X):
    """p(x) >= 0 on [0, X]: p = x^m r(x) with r(0) > 0 and sum_{k>=1} |r_k| X^k < r(0) (or p == 0)"""
    i = 0
    while i < len(p) and p[i] == 0:
        i += 1
    if i == len(p):
        return True
    r = p[i:]
    return r[0] > 0 and sum(abs(c) * X ** k for k, c in enumerate(r) if k) < r[0]


def bracket_ok(X):
    one_x = [Fr(1), Fr(1)]
    hi = padd(pmul(pmul(G_HI, G_HI), one_x), [Fr(-1)])
    lo = padd([Fr(1)], pscale(pmul(pmul(G_LO, G_LO), one_x), -1))
    pos = nonneg_on(G_LO, X) and nonneg_on(G_HI, X)
    return nonneg_on(hi, X) and nonneg_on(lo, X) and pos, hi, lo


def area_enclosure(n, tilt, cutoff):
    """[lo, hi] enclosing S/H = sum_j Delta T_j^2 (1 + tilt^2 A_j)^(-1/2); cutoff(dmax_poly) -> T(j) polynomial"""
    assert n % 2 == 0
    Delta = Fr(2, n)
    qj = [Fr(-1), Fr(2, n)]
    qj1 = [Fr(-1) + Fr(2, n), Fr(2, n)]
    alpha = pscale(padd([Fr(1)], pmul(qj, qj1)), Fr(1, 4))
    beta = pscale(padd(qj, qj1), Fr(1, 4))
    A = padd(pmul(alpha, alpha), pscale(pmul(beta, beta), 2))
    x = pscale(A, tilt * tilt)
    out = []
    for g in (G_LO, G_HI):
        tot = Fr(0)
        for (a, b, qmax) in ((0, n // 2, qj), (n // 2, n, qj1)):
            T = cutoff(d_of(qmax))
            P = pscale(pmul(pmul(T, T), pcompose(g, x)), Delta)
            tot += psum(P, a, b)
        out.append(tot)
    return out[0], out[1]


def area_direct(n, tilt, cutoff_scalar, g):
    Delta = Fr(2, n)
    tot = Fr(0)
    for j in range(n):
        q0, q1 = Fr(-1) + j * Delta, Fr(-1) + (j + 1) * Delta
        dmax = max((q * q + q ** 4) / 16 for q in (q0, q1))
        T = cutoff_scalar(dmax)
        a, b = (1 + q0 * q1) / 4, (q0 + q1) / 4
        xx = tilt * tilt * (a * a + 2 * b * b)
        tot += Delta * T * T * sum(c * xx ** k for k, c in enumerate(g))
    return tot


def projected_area_check(n, eps, j, T):
    """the perpendicular base of P_j + R v_j: area^2 from the projected vertices equals (H Delta T^2/2)^2 / |v|^2"""
    H = SQ2
    Delta = Fr(2, n)
    q0, q1 = Fr(-1) + j * Delta, Fr(-1) + (j + 1) * Delta
    a, b = (1 + q0 * q1) / 4, (q0 + q1) / 4
    ok = True
    for fam in (1, 2):
        if fam == 1:
            P = [[Q2(0), Q2(0), Q2(0)], [Q2(0), Q2(q0 * T), H * T], [Q2(0), Q2(q1 * T), H * T]]
            v = [Q2(1), Q2(eps * a), H * (eps * b)]
        else:
            P = [[Q2(0), Q2(0), H], [Q2(q0 * T), Q2(0), H * (1 - T)], [Q2(q1 * T), Q2(0), H * (1 - T)]]
            v = [Q2(-eps * a), Q2(1), H * (eps * b)]
        vv = dot(v, v)
        e = [[P[k][i] - P[0][i] for i in range(3)] for k in (1, 2)]
        # project: e' = e - (e.v / v.v) v ; |e1' x e2'|^2 / 4 = area^2.  Avoid dividing by v.v (in Q(sqrt2)): scale
        # e' by v.v, so area^2 * (v.v)^2 = |f1 x f2|^2 / 4 with f = (v.v) e - (e.v) v
        f = [[ek[i] * vv - v[i] * dot(ek, v) for i in range(3)] for ek in e]
        c = cross(f[0], f[1])
        lhs = dot(c, c) * Fr(1, 4)                          # f1 x f2 = (v.v)^2 (e1' x e2'): lhs = area^2 (v.v)^4
        target = (H * (Delta * T * T / 2)) * (H * (Delta * T * T / 2))   # intercept area^2
        # claim: area^2 = target / v.v, i.e. lhs = target (v.v)^3
        ok &= (lhs == target * vv * vv * vv)
        ok &= (vv == Q2(1 + eps * eps * (a * a + 2 * b * b)))
    return ok


# ---------------------------------------------------------------- polynomial identities of the proof
def identities():
    out = {}
    # variables for the shared boundary: a = q_j, b = q_{j+1}, q
    n = 3
    a, b, q = (var(i, n) for i in range(3))
    alpha = scale(add(const(1, n), mul(a, b)), Fr(1, 4))
    beta = scale(add(a, b), Fr(1, 4))
    phi = lambda z: scale(sub(const(1, n), mul(z, z)), Fr(1, 4))  # noqa: E731
    out['eq:shared-boundaries: alpha_j - q beta_j = (1-q^2)/4 at q = q_j and q = q_{j+1}'] = (
        sub(sub(alpha, mul(a, beta)), phi(a)) == {} and sub(sub(alpha, mul(b, beta)), phi(b)) == {})
    # tilted line: point (lam, q t0 + lam eps alpha, t0 + lam eps beta) (third coordinate / H) lies on y = q t + eps x (alpha - q beta)
    n = 6
    lam, t0, eps, al, be, qq = (var(i, n) for i in range(6))
    x = lam
    y = add(mul(qq, t0), mul(mul(lam, eps), al))
    t = add(t0, mul(mul(lam, eps), be))
    rhs = add(mul(qq, t), mul(mul(eps, x), sub(al, mul(qq, be))))
    out['the line through (0, q t0, H t0) along (1, eps alpha, H eps beta) lies in y = q t + eps x (alpha - q beta)'] = sub(y, rhs) == {}
    # radial budget: variables x y t eps aj bj ak bk q p
    n = 10
    x, y, t, eps, aj, bj, ak, bk, q, p = (var(i, n) for i in range(10))
    one = const(1, n)
    half = const(Fr(1, 2), n)
    t0 = sub(t, mul(mul(eps, x), bj))
    y0 = sub(y, mul(mul(eps, x), aj))
    s0 = add(sub(one, t), mul(mul(eps, y), bk))
    x0 = add(x, mul(mul(eps, y), ak))
    A_ = sub(t0, half)
    B_ = sub(s0, half)
    lhs = add(mul(A_, sub(one, mul(mul(eps, x), q))), mul(B_, add(one, mul(mul(eps, y), p))))
    rhs = total(mul(pw(eps, 2, n), add(mul(pw(x, 2, n), aj), mul(pw(y, 2, n), ak))),
                scale(mul(mul(eps, x), sub(bj, scale(q, Fr(1, 2)))), -1),
                mul(mul(eps, y), sub(bk, scale(p, Fr(1, 2)))))
    # modulo the intercept relations q t0 = y0, p s0 = x0, with cofactors -eps x and eps y
    rel = add(scale(mul(mul(eps, x), sub(mul(q, t0), y0)), -1), mul(mul(eps, y), sub(mul(p, s0), x0)))
    out['eq:radial-budget, modulo q t0 = y0 and p s0 = x0 (cofactors -eps x, +eps y)'] = sub(sub(lhs, rhs), rel) == {}
    out['eq:radial-budget remark: a + b = -eps x beta_j + eps y beta_k'] = sub(add(A_, B_), add(scale(mul(mul(eps, x), bj), -1), mul(mul(eps, y), bk))) == {}
    # d(p) + d(q) - (p^2 + q^2 + 2 p^2 q^2)/16 = (p^2 - q^2)^2 / 16
    n = 2
    p_, q_ = var(0, n), var(1, n)

    def dd(z):
        return scale(add(pw(z, 2, n), pw(z, 4, n)), Fr(1, 16))
    lhs = sub(add(dd(p_), dd(q_)), scale(total(pw(p_, 2, n), pw(q_, 2, n), scale(mul(pw(p_, 2, n), pw(q_, 2, n)), 2)), Fr(1, 16)))
    out['d(p) + d(q) - (p^2+q^2+2p^2q^2)/16 = (p^2-q^2)^2/16'] = sub(lhs, scale(pw(sub(pw(p_, 2, n), pw(q_, 2, n)), 2, n), Fr(1, 16))) == {}
    # integrals over [-1, 1]
    def integ(coeffs):
        return sum(c * (Fr(1, k + 1) - Fr((-1) ** (k + 1), k + 1)) for k, c in enumerate(coeffs))
    d_c = [0, 0, Fr(1, 16), 0, Fr(1, 16)]
    A_c = padd(pscale(pmul([1, 0, 1], [1, 0, 1]), Fr(1, 16)), [0, 0, Fr(1, 2)])
    out['int_{-1}^1 d = 1/15 and int_{-1}^1 A = 17/30'] = integ(d_c) == Fr(1, 15) and integ(A_c) == Fr(17, 30)
    out['2 eta - 1/240 = -13/6000 (eta = 1/1000)'] = 2 * ETA - Fr(1, 240) == Fr(-13, 6000)
    out['59/64 = 1/8 + 3/8 + 27/64 (the f\'\' bound)'] = Fr(1, 8) + Fr(3, 8) + Fr(27, 64) == Fr(59, 64)
    gap = lambda e, et: 2 * et - (2 + 2 * et) * e - e * e / 4  # noqa: E731
    out['eq:uniform-coverage-gap at eps = eta/2 equals eta - 17 eta^2/16 > 0, decreasing in eps'] = (
        gap(ETA / 2, ETA) == ETA - 17 * ETA ** 2 / 16 > 0 and -(2 + 2 * ETA) - ETA / 2 / 2 < 0)
    out['2 eps^2 <= 1/2,000,000 < 13/6000 at eps = 1/2000'] = 2 * EPS ** 2 <= Fr(1, 2000000) < Fr(13, 6000)
    # cubic budget: with eta = 25 tau/4: 2 eta - (2 + 2 eta) tau - tau^2/4 = tau (21/2 - 51 tau/4) as polynomials
    n = 1
    tt = var(0, n)
    et = scale(tt, Fr(25, 4))
    lhs = total(scale(et, 2), scale(mul(add(const(2, n), scale(et, 2)), tt), -1), scale(pw(tt, 2, n), Fr(-1, 4)))
    out['cubic budget: 2eta - (2+2eta)tau - tau^2/4 = tau(21/2 - 51 tau/4) at eta = 25tau/4; >= 33tau/8 for tau <= 1/2'] = (
        sub(lhs, mul(tt, add(const(Fr(21, 2), n), scale(tt, Fr(-51, 4))))) == {} and Fr(21, 2) - Fr(51, 4) * Fr(1, 2) == Fr(33, 8))
    out['T_j >= 1/2 + (25/4)(1/2)^3 = 41/32 > 1 for tau >= 1/2'] = Fr(1, 2) + Fr(25, 4) * Fr(1, 8) == Fr(41, 32) > 1
    out['25 tau/2 + 2 tau^2 <= 1/320 + 1/8,000,000 < 1/240 at tau = 1/4000'] = (
        Fr(25, 2) * TAU == Fr(1, 320) and 2 * TAU ** 2 == Fr(1, 8000000) and Fr(1, 320) + Fr(1, 8000000) < Fr(1, 240))
    out['tau = 1/50 gives eta = 25 tau/4 = 1/8 (the variable-margin hypothesis eta <= 1/8)'] = Fr(25, 4) * Fr(1, 50) == Fr(1, 8)
    # edge-four remark: S_eps = 4 C_{2 eps}
    e = var(0, 1)
    tau2 = scale(e, 2)
    cost = total(const(Fr(1, 2), 1), scale(pw(tau2, 2, 1), Fr(-1, 240)), scale(pw(tau2, 3, 1), Fr(25, 2)))
    out['Remark rem:angular-cubic-scale: 4(1/2 - tau^2/240 + 25tau^3/2) at tau = 2eps = 2 - eps^2/15 + 400 eps^3; '
        '4 * 2 (2eps)^4 = 128 eps^4; 1/50, 1/4000, 1 <-> 1/100, 1/8000, 1/2; D_I = 8 d; delta_I = eps^2 D_I + 100 eps^3'] = (
        sub(scale(cost, 4), total(const(2, 1), scale(pw(e, 2, 1), Fr(-1, 15)), scale(pw(e, 3, 1), 400))) == {} and
        4 * 2 * 16 == 128 and Fr(1, 50) / 2 == Fr(1, 100) and TAU / 2 == Fr(1, 8000) and
        Fr(8, 16) == Fr(1, 2) and 2 * Fr(25, 4) * 8 == 100)
    return out


# ---------------------------------------------------------------- coverage sample
class Cover:
    def __init__(self, n, eps, cutoff_scalar):
        self.n, self.eps, self.cut = n, eps, cutoff_scalar
        self.Delta = Fr(2, n)

    def q(self, i):
        return Fr(-1) + i * self.Delta

    def ab(self, j):
        q0, q1 = self.q(j), self.q(j + 1)
        return (1 + q0 * q1) / 4, (q0 + q1) / 4

    def T(self, j):
        q0, q1 = self.q(j), self.q(j + 1)
        return self.cut(max((q * q + q ** 4) / 16 for q in (q0, q1)))

    def sectors(self, rad, trans, other, sign):
        """indices j with F_j <= trans <= F_{j+1}, F_i = q_i rad + sign eps other (1 - q_i^2)/4; requires rad > eps/2
        (then F is strictly increasing and at most two indices qualify)"""
        assert rad > self.eps / 2
        F = lambda i: self.q(i) * rad + sign * self.eps * other * (1 - self.q(i) ** 2) / 4  # noqa: E731
        lo, hi = 0, self.n                 # F(0) = -rad <= trans <= rad = F(n)
        while hi - lo > 1:
            mid = (lo + hi) // 2
            if F(mid) <= trans:
                lo = mid
            else:
                hi = mid
        out = [lo] if lo < self.n else []
        if F(lo) == trans and lo > 0:
            out.append(lo - 1)
        return out

    def in1(self, x, y, t, j):
        a, b = self.ab(j)
        t0, y0 = t - self.eps * x * b, y - self.eps * x * a
        return 0 <= t0 <= self.T(j) and self.q(j) * t0 <= y0 <= self.q(j + 1) * t0

    def in2(self, x, y, t, k):
        a, b = self.ab(k)
        s0, x0 = (1 - t) + self.eps * y * b, x + self.eps * y * a
        return 0 <= s0 <= self.T(k) and self.q(k) * s0 <= x0 <= self.q(k + 1) * s0

    def covered(self, x, y, t):
        c1 = any(self.in1(x, y, t, j) for j in self.sectors(t, y, x, 1))
        c2 = any(self.in2(x, y, t, k) for k in self.sectors(1 - t, x, y, -1))
        return c1, c2


def coverage_sample(cov, count=300, seed=195):
    rng = random.Random(seed)
    bad, tested = [], 0
    for _ in range(count):
        x = Fr(rng.randint(-480000, 480000), 10 ** 6)
        y = Fr(rng.randint(-480000, 480000), 10 ** 6)
        if abs(x) + abs(y) > Fr(97, 100):
            continue
        # the first-family sector at t = 1/2, then t just past its cutoff (first family fails by delta)
        t = Fr(1, 2)
        for _ in range(3):
            js = cov.sectors(t, y, x, 1)
            j = js[0]
            a, b = cov.ab(j)
            t = cov.T(j) + cov.eps * x * b + Fr(1, 10 ** 15)
        if not (abs(x) <= 1 - t and abs(y) <= t):
            continue
        c1, c2 = cov.covered(x, y, t)
        tested += 1
        if not (c1 or c2):
            bad.append((x, y, t))
    return tested, bad


# ---------------------------------------------------------------- the decider
def decide(src=None, eta=ETA, printed_coeff=Fr(13, 6000), cubic_coeff=Fr(25, 4), enlarge=True, sample=300):
    src = src or Sources()
    checks = []
    t0 = time.time()
    intro, cons, cov, area, cubic = (src.text(f) for f in (INTRO, CONS, COV, AREA, CUBIC))
    src.text(SCALE)
    flat = lambda s: s.replace(' ', '').replace('\n', '')  # noqa: E731
    check(checks, 'the theorem, the construction and the cubic proposition as printed',
          '\\frac12-\\frac{13}{6000}\\eps^2+O(\\eps^4)' in flat(intro) and 'm=2\\lceil2/\\eps^2\\rceil' in flat(intro) and
          'T_j=\\frac12+\\eps^2M_j' in flat(cons) and 'T_j=\\frac12+\\tau^2d_j+\\frac{25}{4}\\tau^3' in flat(cubic) and
          '0<\\tau\\le1/4000' in flat(cubic),
          'introduction.tex:32-43, construction.tex:52-128, cubic-buffer.tex:17-45')
    pm = projection_minimum()
    check(checks, 'M. the face area vectors from the vertices are the printed (0,+-H,-1), (+-H,0,1), each of length '
          'sqrt 3, summing to zero', pm['same'] and pm['lengths'] and pm['zero_sum'])
    check(checks, 'M. A_min(K) = sqrt 2: at every zonotope facet-normal candidate A(n)^2 >= 2|n|^2, with equality '
          'attained, and A(1,0,0) = H', pm['min_ok'] and pm['attained'])
    check(checks, 'M. the closed form A(u) = max(H|u_x|,|u_z|) + max(H|u_y|,|u_z|) agrees at those normals', pm['closed_ok'])
    n = ceil(2 / EPS ** 2)
    N3 = ceil(8 / TAU ** 2)
    check(checks, 'P. eps = 1/2000: n = ceil(2/eps^2) = 8,000,000, 2n = 16,000,000 cylinders, Delta = 2/n <= eps^2',
          n == 8000000 and 2 * n == 16000000 and Fr(2, n) <= EPS ** 2, 'Delta = %s' % Fr(2, n))
    check(checks, 'P. tau = 1/4000: N = ceil(8/tau^2) = 128,000,000, 2N = 256,000,000 cylinders, Delta <= tau^2/4',
          N3 == 128000000 and Fr(2, N3) <= TAU ** 2 / 4)
    for name, ok in identities().items():
        check(checks, 'I. ' + name, ok)
    okb, hi, lo = bracket_ok(EPS ** 2)
    check(checks, 'A. g_lo <= (1+x)^(-1/2) <= g_hi on [0, eps^2] (g_hi^2(1+x) - 1 = %s; 1 - g_lo^2(1+x) has lowest '
          'term %s x^%d)' % ('5x^3/8 - 15x^4/64 + 9x^5/64' if hi[:6] == [0, 0, 0, Fr(5, 8), Fr(-15, 64), Fr(9, 64)] else hi,
                             next(c for c in lo if c), next(i for i, c in enumerate(lo) if c)), okb)
    # second way for the summation machinery: eps = 1/20, n = 800, direct exact sector sum
    e20 = Fr(1, 20)
    n20 = ceil(2 / e20 ** 2)
    cut_main = lambda dpoly: padd([Fr(1, 2) + e20 ** 2 * eta], pscale(dpoly, e20 ** 2))  # noqa: E731
    lo20, hi20 = area_enclosure(n20, e20, cut_main)
    dlo = area_direct(n20, e20, lambda dm: Fr(1, 2) + e20 ** 2 * (eta + dm), G_LO)
    dhi = area_direct(n20, e20, lambda dm: Fr(1, 2) + e20 ** 2 * (eta + dm), G_HI)
    check(checks, 'A. the closed-form sector sums equal the direct sector-by-sector sums at eps = 1/20 (n = 800)', lo20 == dlo and hi20 == dhi)
    # main construction at eps = 1/2000
    margin = (lambda dm: eta + dm) if enlarge else (lambda dm: 0)
    cut = lambda dpoly: padd([Fr(1, 2) + EPS ** 2 * margin(0)], pscale(dpoly, EPS ** 2 if enlarge else 0))  # noqa: E731
    L, U = area_enclosure(n, EPS, cut)
    target = Fr(1, 2) - printed_coeff * EPS ** 2
    check(checks, 'A. eps = 1/2000: total base area / H < 1/2 (strictly below A_min/2), exactly enclosed', U < Fr(1, 2),
          'S/H in [%.18f, %.18f]; 1/2 - S/H >= %.6e' % (float(L), float(U), float(Fr(1, 2) - U)))
    check(checks, 'A. eps = 1/2000: |S/H - 1/2 + (13/6000) eps^2| <= 2 eps^4 (the printed remainder bound)',
          abs(L - target) <= 2 * EPS ** 4 and abs(U - target) <= 2 * EPS ** 4,
          'remainder / eps^4 in [%.6f, %.6f]' % (float((L - target) / EPS ** 4), float((U - target) / EPS ** 4)))
    check(checks, 'A. eps = 1/2000: the Taylor form (eq:taylor-bound) |S/H - 1/2 - eps^2 sum Delta(M_j - A_j/8)| <= (59/64) eps^4',
          True if not enlarge else _taylor_ok(n, EPS, eta, L, U), '')
    # the cubic family at tau = 1/4000
    cutc = lambda dpoly: padd([Fr(1, 2) + cubic_coeff * TAU ** 3], pscale(dpoly, TAU ** 2))  # noqa: E731
    Lc, Uc = area_enclosure(N3, TAU, cutc)
    tc = Fr(1, 2) - TAU ** 2 / 240 + Fr(25, 2) * TAU ** 3
    check(checks, 'A. tau = 1/4000: C/H < 1/2 (strict saving of Proposition prop:angular-cubic), exactly enclosed', Uc < Fr(1, 2),
          'C/H in [%.18f, %.18f]' % (float(Lc), float(Uc)))
    check(checks, 'A. tau = 1/4000: |C/H - 1/2 + tau^2/240 - (25/2) tau^3| <= 2 tau^4 (eq:angular-cubic-cost)',
          abs(Lc - tc) <= 2 * TAU ** 4 and abs(Uc - tc) <= 2 * TAU ** 4,
          'remainder / tau^4 in [%.6f, %.6f]' % (float((Lc - tc) / TAU ** 4), float((Uc - tc) / TAU ** 4)))
    pa = all(projected_area_check(n, EPS, j, Fr(1, 2) + EPS ** 2 * (eta + max((q * q + q ** 4) / 16 for q in (Fr(-1) + j * Fr(2, n), Fr(-1) + (j + 1) * Fr(2, n)))))
             for j in (0, 1, 1234567, n // 2 - 1, n // 2, n - 1))
    check(checks, 'A. projected base area^2 = (intercept area H Delta T_j^2/2)^2 / |v_j|^2, |v_j|^2 = 1 + eps^2(alpha^2 + 2beta^2), '
          'both families, six sectors, exact in Q(sqrt 2)', pa)
    # coverage sample
    if sample:
        cov_ = Cover(n, EPS, (lambda dm: Fr(1, 2) + EPS ** 2 * (eta + dm)) if enlarge else (lambda dm: Fr(1, 2)))
        tested, bad = coverage_sample(cov_, sample)
        check(checks, 'S. sample: %d exact points just past their first-family cutoff near t = 1/2 are covered by the '
              'second family (evidence, not a proof of coverage)' % tested, tested > 0 and not bad,
              'uncovered: %s' % [tuple(str(c) for c in p) for p in bad[:2]])
    check(checks, 'COVERAGE of the closed tetrahedron by the 1.6e7 (2.56e8) cylinders: NOT DECIDED (REFUSED: ~3.2e13 '
          'sector pairs at eps = 1/2000; see the docstring)', False, 'the decisive part of the headline')
    decided = checks[:-1]
    ok = all(c['pass'] for c in decided)
    verdict = 'REFUSED' if ok else 'REFUTED'
    return {'verdict': verdict, 'checks': checks, 'sources': src.read,
            'value': {'n': n, 'cylinders': 2 * n, 'S/H enclosure (eps=1/2000)': [str(L), str(U)],
                      'C/H enclosure (tau=1/4000)': [str(Lc), str(Uc)], 'runtime_s': round(time.time() - t0, 1)},
            'decides': 'a finite component: A_min(K) = sqrt 2, the construction\'s parameters, every polynomial identity '
                       'of the coverage proof, and the exact total base area at eps = 1/2000 and tau = 1/4000 (strictly '
                       'below A_min/2, inside the printed remainder bounds); COVERAGE -- the decisive geometric part -- is '
                       'REFUSED (a continuum covered by 1.6e7 cylinders; ~3.2e13 sector pairs), so the row is REFUSED'}


def _taylor_ok(n, eps, eta, L, U):
    """S/H - 1/2 - eps^2 sum_j Delta (M_j - A_j/8), with the sum computed exactly, within (59/64) eps^4"""
    Delta = Fr(2, n)
    qj = [Fr(-1), Fr(2, n)]
    qj1 = [Fr(-1) + Fr(2, n), Fr(2, n)]
    alpha = pscale(padd([Fr(1)], pmul(qj, qj1)), Fr(1, 4))
    beta = pscale(padd(qj, qj1), Fr(1, 4))
    A = padd(pmul(alpha, alpha), pscale(pmul(beta, beta), 2))
    tot = Fr(0)
    for (a, b, qmax) in ((0, n // 2, qj), (n // 2, n, qj1)):
        M = padd([eta], d_of(qmax))
        tot += psum(pscale(padd(M, pscale(A, Fr(-1, 8))), Delta), a, b)
    c = Fr(1, 2) + eps ** 2 * tot
    return abs(L - c) <= Fr(59, 64) * eps ** 4 and abs(U - c) <= Fr(59, 64) * eps ** 4


def forge():
    out = []
    r = decide(printed_coeff=Fr(14, 6000), sample=0)
    out.append(('printed coefficient 13/6000 changed to 14/6000', r['verdict']))
    r = decide(eta=Fr(1, 100), sample=0)
    out.append(('margin eta = 1/100 instead of 1/1000 (2 eta - 1/240 > 0: no saving)', r['verdict']))
    r = decide(enlarge=False, sample=150)
    out.append(('no radial enlargement (T_j = 1/2): the coverage sample finds uncovered points', r['verdict']))
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
