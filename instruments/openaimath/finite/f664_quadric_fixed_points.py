"""F-664 — "Three fixed points on the symplectic quadric threefold" (openai/math family 347).

THE CLAIM (main.tex abstract; 00-introduction.tex:56-64, Theorem thm:counterexample): there is a smooth Hamiltonian
diffeomorphism phi of the quadric Q^3 = {z_0^2+...+z_4^2 = 0} in CP^4 with #Fix(phi) = 3 < 4 = Crit(Q^3) =
cuplength(Q^3; Q), at least one fixed point degenerate. The finite object (04-three-points.tex:14-24,
Proposition prop:three-points): with p = (0,0,1), e = (1,0,0),
    f : S^2 x S^2 -> R,   f(x, y) = e.x + (x - p).y,
"has exactly three critical points"; the proof (lines 26-86) prints them, q_0 = (p, -e) with f(q_0) = 0 and
q_s = ((s sqrt3/2, 0, -1/2), (1/2, 0, -s sqrt3/2)) with lambda = mu = s sqrt3 and f(q_s) = s 3 sqrt3/2; Remark
rem:degenerate-critical-point (lines 88-103) says q_0 is degenerate, f = va + O(3) in its chart, Hessian eigenvalues
1, -1, 0, 0, rank two.

WHAT IS DECIDED HERE, exactly, without the paper's case analysis:
  1. The critical set of f on S^2 x S^2 is the real zero set of the Lagrange system in Q[x1..x3, y1..y3, l, m]
         grad_x f - l x = 0,  grad_y f - m y = 0,  |x|^2 = 1,  |y|^2 = 1
     (the gradients are taken by exact differentiation of f; the multipliers are unique at a point because x, y are
     unit vectors, so critical points and real solutions are in bijection). A reduced Groebner basis (grevlex, Fraction
     coefficients, Buchberger written for this audit) shows the ideal is zero-dimensional and gives the standard
     monomials of A = Q[vars]/I. HERMITE'S THEOREM (Pedersen-Roy-Szpirglas 1993; Becker-Woermann): the quadratic form
     a -> Tr(M_{a^2}) on A has rank = the number of distinct complex solutions and signature = the number of distinct
     REAL solutions. Its matrix Tr(M_{b_i b_j}) is computed exactly and diagonalised by congruence over Q (Sylvester).
  2. Second way: the characteristic polynomial of M_ell for a linear form ell (Faddeev-LeVerrier over Q), its
     square-free part, and an exact Sturm count of its real roots. When deg(squarefree) equals the number of distinct
     complex solutions, ell separates them; a separating ell with rational coefficients takes a real value only at a
     real point (a non-real point and its conjugate would share the value), so the Sturm count is the real count.
  3. The printed points: q_0 and q_{+1}, q_{-1} satisfy the system exactly in Q(sqrt3) with the printed multipliers,
     are pairwise distinct, and f takes the printed values. With the count of 1-2 they ARE the critical set.
     (Found on the way: dim_Q A = 6 with only three distinct complex solutions — q_0 has multiplicity 4, q_{+-} are
     simple; the paper's case x != p has no non-real solutions either, since the branch lambda = -mu forces
     lambda mu = 1, which that case excludes.)
  4. Degeneracy of q_0, two ways: the Hessian of the Lagrangian f - l|x|^2/2 - m|y|^2/2 at q_0 (l = m = 0) on the
     tangent space p-perp x e-perp has characteristic polynomial t^4 - t^2 (eigenvalues 1, -1, 0, 0; rank two); and
     the paper's chart x = (u, v, sqrt(1-u^2-v^2)), y = (-sqrt(1-a^2-b^2), a, b) with each square root replaced by its
     2-jet 1 - r^2/2 (the error is O(r^4), multiplied by a coordinate, so the 2-jet of f is unchanged) has 2-jet va.
  5. The printed factorisation (1 - t^2/2)^2 (1 + t^2) - 1 = t^4 (t^2 - 3)/4 (eq:critical-factorization).
  6. Auxiliary finite facts of the placement (02-quadric.tex): the 2x2 matrix [[z1+iz2, z3+iz4], [-z3+iz4, z1-iz2]]
     has determinant z1^2+z2^2+z3^2+z4^2 (computed in Z[i][z]); the involution's +1 eigenline [1:0:0:0:0] is off Q^3;
     and (03-critical-bound.tex, the upper bound Crit(Q^3) <= 4) T = diag(0, J, 2J) has the five distinct eigenvalues
     0, -i, +i, -2i, +2i with the printed eigenlines, exactly four of which lie on Q^3.

WHAT IS NOT DECIDED (theory, not a finite object): that Q^2 = Q^3 n {z_0 = 0} is diffeomorphic to S^2 x S^2 and that
f transported there is smooth; the finite-order reduction (Proposition prop:reduction: an A-invariant extension K whose
short-time flow composed with A has Fix = Crit(f)); the Lusternik-Schnirelmann lower bound Crit(Q^3) >= cuplength = 4
(h^3 = 2[pt]); the passage from a degenerate critical point to a degenerate fixed point. This decides ONE finite
component of the headline: the three-critical-point function and the degeneracy of q_0.

READ AFTER THIS DECIDER RAN. The preprint ships no checking code. The release's Lean tree states the full theorem as
the Comparator challenge lean/ComparatorChallenges/ArnoldCounterexample.lean (theorem main: a Hamiltonian
phi : Q3 = Q3 with (fixedSet phi).encard = 3, 4 <= criticalNumber, a degenerate fixed point) and proves the same count
for the same f in lean/OAI/Geometry/Arnold/ThreePoints.lean (multiplierCritical_encard, tangentCritical_encard = 3)
by the paper's case analysis; that is lane K's object, not re-run here. This decider shares nothing with it.
"""
import itertools
import os
import sys
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, const, diff, divide, evaluate, mul, scale, sub, total, var  # noqa: E402

DIR = 'preprints/A-degenerate-counterexample-to-the-critical-number-Arnold-bound-September-23-2026/'
SEC4 = DIR + 'build/sections/04-three-points.tex'
SEC0 = DIR + 'build/sections/00-introduction.tex'
SEC2 = DIR + 'build/sections/02-quadric.tex'
SEC3 = DIR + 'build/sections/03-critical-bound.tex'
P_PT = (0, 0, 1)
E_PT = (1, 0, 0)
NV = 8          # x1 x2 x3 y1 y2 y3 l m
NAMES = ('x1', 'x2', 'x3', 'y1', 'y2', 'y3', 'l', 'm')


# ---------------------------------------------------------------- Groebner bases over Q (grevlex)
def gkey(m):
    return (sum(m), tuple(-e for e in reversed(m)))


def lm(f):
    return max(f, key=gkey)


def monic(f):
    c = f[lm(f)]
    return {m: Fraction(v) / c for m, v in f.items()}


def divides(a, b):
    return all(x <= y for x, y in zip(a, b))


def nf(f, G):
    """full reduction of f by the list G (each monic), remainder in grevlex"""
    f = {m: Fraction(c) for m, c in f.items()}
    r = {}
    lms = [(lm(g), g) for g in G]
    while f:
        m = lm(f)
        c = f[m]
        for gm, g in lms:
            if divides(gm, m):
                q = tuple(x - y for x, y in zip(m, gm))
                for mm, cc in g.items():
                    t = tuple(x + y for x, y in zip(mm, q))
                    v = f.get(t, 0) - c * cc
                    if v:
                        f[t] = v
                    else:
                        f.pop(t, None)
                break
        else:
            r[m] = c
            del f[m]
    return r


def spoly(f, g):
    a, b = lm(f), lm(g)
    l_ = tuple(max(x, y) for x, y in zip(a, b))
    qa = tuple(x - y for x, y in zip(l_, a))
    qb = tuple(x - y for x, y in zip(l_, b))
    s = {}
    for m, c in f.items():
        s[tuple(x + y for x, y in zip(m, qa))] = c
    for m, c in g.items():
        t = tuple(x + y for x, y in zip(m, qb))
        v = s.get(t, 0) - c
        if v:
            s[t] = v
        else:
            s.pop(t, None)
    return s


def groebner(F):
    G = [monic(f) for f in F if f]
    pairs = [(i, j) for j in range(len(G)) for i in range(j)]
    while pairs:
        pairs.sort(key=lambda ij: gkey(tuple(max(x, y) for x, y in zip(lm(G[ij[0]]), lm(G[ij[1]])))))
        i, j = pairs.pop(0)
        a, b = lm(G[i]), lm(G[j])
        if all(x == 0 or y == 0 for x, y in zip(a, b)):
            continue                                # Buchberger's product criterion
        r = nf(spoly(G[i], G[j]), G)
        if r:
            G.append(monic(r))
            k = len(G) - 1
            pairs.extend((t, k) for t in range(k))
    # minimal, then reduced
    G = [g for i, g in enumerate(G) if not any(divides(lm(h), lm(g)) and (lm(h) != lm(g) or k < i) for k, h in enumerate(G) if k != i)]
    out = []
    for i, g in enumerate(G):
        rest = G[:i] + G[i + 1:]
        m = lm(g)
        out.append(monic({m: Fraction(1), **nf({k: v for k, v in g.items() if k != m}, rest)}))
    return sorted(out, key=lambda g: gkey(lm(g)))


def standard_monomials(G, n):
    lms = [lm(g) for g in G]
    bound = []
    for i in range(n):
        pure = [m[i] for m in lms if all(m[j] == 0 for j in range(n) if j != i)]
        if not pure:
            return None                             # not zero-dimensional
        bound.append(min(pure))
    B = [m for m in itertools.product(*[range(b) for b in bound]) if not any(divides(L, m) for L in lms)]
    return sorted(B, key=gkey)


# ---------------------------------------------------------------- exact linear algebra
def inertia(H):
    """(positive, negative, zero) of a rational symmetric matrix, by congruence (Sylvester's law of inertia)"""
    a = [[Fraction(x) for x in row] for row in H]
    n = len(a)
    pos = neg = 0
    active = list(range(n))
    while active:
        piv = next((i for i in active if a[i][i] != 0), None)
        if piv is None:
            pr = next(((i, j) for i in active for j in active if i != j and a[i][j] != 0), None)
            if pr is None:
                break                               # the rest is the zero form
            i, j = pr                               # row/col i += row/col j, a congruence: a_ii becomes 2 a_ij != 0
            for k in range(n):
                a[i][k] += a[j][k]
            for k in range(n):
                a[k][i] += a[k][j]
            piv = i
        d = a[piv][piv]
        pos += d > 0
        neg += d < 0
        active.remove(piv)
        f = {r: a[r][piv] / d for r in active}
        for r in active:                            # Schur complement, symmetric by construction
            if f[r]:
                for c in active:
                    a[r][c] -= f[r] * a[piv][c]
        for r in range(n):
            a[r][piv] = a[piv][r] = Fraction(0)
    return pos, neg, n - pos - neg


def charpoly(M):
    """Faddeev-LeVerrier over Q; coefficients of t^n + c_{n-1} t^{n-1} + ... + c_0, highest first"""
    n = len(M)
    A = [[Fraction(x) for x in r] for r in M]
    Mk = [[Fraction(0)] * n for _ in range(n)]
    coeffs = [Fraction(1)]
    c = Fraction(1)
    for k in range(1, n + 1):
        Mk = [[sum(A[i][l] * Mk[l][j] for l in range(n)) + (c if i == j else 0) for j in range(n)] for i in range(n)]
        AM = [[sum(A[i][l] * Mk[l][j] for l in range(n)) for j in range(n)] for i in range(n)]
        c = -sum(AM[i][i] for i in range(n)) / k
        coeffs.append(c)
    return coeffs


# ---------------------------------------------------------------- univariate polynomials (lists, highest first)
def ptrim(p):
    p = list(p)
    while p and p[0] == 0:
        p.pop(0)
    return p


def pmod(a, b):
    a = ptrim(a)
    b = ptrim(b)
    while len(a) >= len(b) and a:
        f = Fraction(a[0]) / b[0]
        for i in range(len(b)):
            a[i] -= f * b[i]
        a = ptrim(a[1:] if a[0] == 0 else a)
    return a


def pdivexact(a, b):
    a = [Fraction(x) for x in ptrim(a)]
    b = ptrim(b)
    q = []
    while len(a) >= len(b):
        f = a[0] / b[0]
        q.append(f)
        for i in range(len(b)):
            a[i] -= f * b[i]
        a = a[1:]
    assert not ptrim(a)
    return q


def pgcd(a, b):
    a, b = ptrim(a), ptrim(b)
    while b:
        a, b = b, pmod(a, b)
    return [Fraction(x) / a[0] for x in a]


def pderiv(a):
    n = len(a) - 1
    return [c * (n - i) for i, c in enumerate(a[:-1])]


def sturm_real_roots(p):
    """number of distinct real roots of a square-free p, by Sturm's theorem at -inf and +inf"""
    seq = [ptrim(p), ptrim(pderiv(p))]
    while True:
        r = pmod(seq[-2], seq[-1])
        if not r:
            break
        seq.append([-x for x in r])

    def changes(signs):
        s = [x for x in signs if x != 0]
        return sum(1 for u, v in zip(s, s[1:]) if (u > 0) != (v > 0))
    at_pinf = [q[0] for q in seq]
    at_minf = [q[0] * (-1) ** (len(q) - 1) for q in seq]
    return changes(at_minf) - changes(at_pinf)


# ---------------------------------------------------------------- Q(sqrt3)
class Q3:
    __slots__ = ('a', 'b')

    def __init__(self, a, b=0):
        self.a, self.b = Fraction(a), Fraction(b)

    def __add__(self, o):
        o = o if isinstance(o, Q3) else Q3(o)
        return Q3(self.a + o.a, self.b + o.b)
    __radd__ = __add__

    def __sub__(self, o):
        o = o if isinstance(o, Q3) else Q3(o)
        return Q3(self.a - o.a, self.b - o.b)

    def __rsub__(self, o):
        return Q3(o) - self

    def __mul__(self, o):
        o = o if isinstance(o, Q3) else Q3(o)
        return Q3(self.a * o.a + 3 * self.b * o.b, self.a * o.b + self.b * o.a)
    __rmul__ = __mul__

    def __eq__(self, o):
        o = o if isinstance(o, Q3) else Q3(o)
        return self.a == o.a and self.b == o.b

    def __hash__(self):
        return hash((self.a, self.b))

    def __repr__(self):
        return '%s + (%s)*sqrt3' % (self.a, self.b)


def eval_q3(f, pt):
    s = Q3(0)
    for m, c in f.items():
        t = Q3(c)
        for x, e in zip(pt, m):
            for _ in range(e):
                t = t * x
        s = s + t
    return s


# ---------------------------------------------------------------- the problem
def build(e=E_PT, p=P_PT):
    X = [var(i, NV) for i in range(3)]
    Y = [var(3 + i, NV) for i in range(3)]
    L, M = var(6, NV), var(7, NV)
    one = const(1, NV)
    f = total(*[scale(X[i], e[i]) for i in range(3)], *[mul(sub(X[i], const(p[i], NV)), Y[i]) for i in range(3)])
    eqs = [sub(diff(f, i), mul(L, X[i])) for i in range(3)] + [sub(diff(f, 3 + i), mul(M, Y[i])) for i in range(3)]
    eqs.append(sub(total(*[mul(x, x) for x in X]), one))
    eqs.append(sub(total(*[mul(y, y) for y in Y]), one))
    lag = total(f, scale(mul(L, total(*[mul(x, x) for x in X])), Fraction(-1, 2)), scale(mul(M, total(*[mul(y, y) for y in Y])), Fraction(-1, 2)))
    return f, eqs, lag


def count_solutions(eqs, ell=(1, 2, 3, 5, 7, 11, 13, 17)):
    G = groebner(eqs)
    B = standard_monomials(G, NV)
    if B is None:
        return {'zero_dim': False, 'G': G}
    idx = {b: i for i, b in enumerate(B)}
    D = len(B)
    cache = {}

    def NF(m):
        if m not in cache:
            cache[m] = nf({m: Fraction(1)}, G)
        return cache[m]

    def mono_mul(a, b):
        return tuple(x + y for x, y in zip(a, b))

    # trace of multiplication by a monomial: sum_k [b_k] NF(m * b_k)
    def trace_mono(m):
        return sum(NF(mono_mul(m, b)).get(b, 0) for b in B)
    tr = {}
    H = [[Fraction(0)] * D for _ in range(D)]
    for i in range(D):
        for j in range(i, D):
            m = mono_mul(B[i], B[j])
            if m not in tr:
                tr[m] = trace_mono(m)
            H[i][j] = H[j][i] = tr[m]
    pos, neg, zero = inertia(H)
    # second way: multiplication matrix of a linear form, charpoly, square-free part, Sturm
    Ml = [[Fraction(0)] * D for _ in range(D)]
    for j, b in enumerate(B):
        for v in range(NV):
            if ell[v]:
                unit = tuple(int(k == v) for k in range(NV))
                for m, c in NF(mono_mul(b, unit)).items():
                    Ml[idx[m]][j] += ell[v] * c
    cp = charpoly(Ml)
    sqf = pdivexact(cp, pgcd(cp, pderiv(cp)))
    # Buchberger's criterion re-checked on the output, independently of how it was produced
    gb_ok = all(not nf(spoly(G[i], G[j]), G) for j in range(len(G)) for i in range(j)) and all(not nf(g, G) for g in eqs)
    return {'zero_dim': True, 'G': G, 'B': B, 'dim': D, 'gb_ok': gb_ok, 'ell': ell, 'rank': pos + neg, 'signature': pos - neg,
            'charpoly': cp, 'sqfree_deg': len(sqf) - 1, 'sturm_real': sturm_real_roots(sqf)}


def printed_points(q0_y=(-1, 0, 0)):
    r3 = Q3(0, 1)
    h = Fraction(1, 2)
    pts = {'q_0': ([Q3(0), Q3(0), Q3(1)], [Q3(c) for c in q0_y], Q3(0), Q3(0))}
    for s in (1, -1):
        x = [r3 * (s * h), Q3(0), Q3(-h)]
        y = [Q3(h), Q3(0), r3 * (-s * h)]
        pts['q_%+d' % s] = (x, y, r3 * s, r3 * s)
    return pts


def decide(src=None, e=E_PT, p=P_PT, q0_y=(-1, 0, 0), printed_fq=Fraction(3, 2)):
    src = src or Sources()
    checks = []
    s4 = src.text(SEC4)
    flat = s4.replace('\n', ' ')
    check(checks, 'the paper states the function and the count', 'f(x,y)=e\\cdotx+(x-p)\\cdoty' in flat.replace(' ', '') and 'has exactly three critical points' in flat
          and 'p=(0,0,1)$ and $e=(1,0,0)' in flat and 'e+y=\\lambda x,\\qquad x-p=\\mu y' in flat, '04-three-points.tex:14-24, eq:critical-multipliers 34-38')
    f, eqs, lag = build(e, p)
    res = count_solutions(eqs)
    if not res['zero_dim']:
        check(checks, 'the Lagrange ideal is zero-dimensional', False, 'some variable has no pure power among the leading monomials')
        return {'verdict': 'REFUSED', 'checks': checks, 'sources': src.read, 'value': {}, 'decides': 'nothing: the system is not zero-dimensional'}
    check(checks, '1. the output is a Groebner basis of the ideal: every S-pair and every generator reduces to 0', res['gb_ok'])
    check(checks, '1. reduced Groebner basis (grevlex): the ideal is zero-dimensional', True,
          '%d basis elements; dim_Q Q[x,y,l,m]/I = %d (complex solutions with multiplicity)' % (len(res['G']), res['dim']))
    n_real = res['signature']
    check(checks, '1. Hermite form Tr(M_{b_i b_j}): number of distinct REAL critical points = signature = 3', n_real == 3,
          'rank %d (distinct complex solutions), signature %d' % (res['rank'], res['signature']))
    sep = res['sqfree_deg'] == res['rank']
    check(checks, '2. a separating linear form: deg squarefree(charpoly M_ell) = number of distinct complex solutions', sep,
          'deg %d vs rank %d' % (res['sqfree_deg'], res['rank']))
    check(checks, '2. Sturm count of the real roots of that squarefree polynomial = 3', sep and res['sturm_real'] == 3, str(res['sturm_real']))

    # 3. the printed points
    pts = printed_points(q0_y)
    ok_pts, vals = True, {}
    for name, (x, y, l_, m_) in pts.items():
        pt = x + y + [l_, m_]
        ok = all(eval_q3(g, pt) == 0 for g in eqs)
        ok_pts &= ok
        vals[name] = eval_q3(f, pt)
    check(checks, '3. q_0 = (p,-e) with l = m = 0 and q_s with l = m = s sqrt3 solve the system exactly in Q(sqrt3)', ok_pts)
    distinct = len({tuple(pts[k][0] + pts[k][1]) for k in pts}) == 3
    check(checks, '3. the three printed points are distinct, so they are the whole real critical set', distinct and ok_pts and n_real == 3)
    check(checks, '3. f(q_0) = 0', vals['q_0'] == 0, str(vals['q_0']))
    check(checks, '3. f(q_s) = s 3sqrt3/2 for s = +1, -1', vals['q_+1'] == Q3(0, printed_fq) and vals['q_-1'] == Q3(0, -printed_fq),
          '%s, %s' % (vals['q_+1'], vals['q_-1']))

    # 4. degeneracy of q_0
    q0 = [Fraction(c) for c in (0, 0, 1)] + [Fraction(c) for c in q0_y] + [Fraction(0), Fraction(0)]
    Hfull = [[evaluate(diff(diff(lag, i), j), q0) for j in range(6)] for i in range(6)]
    # tangent basis at (p, -e): x-directions e1, e2; y-directions e2, e3 (orthonormal; the paper's chart u, v, a, b)
    T = [[1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1]]
    HT = [[sum(T[a][i] * Hfull[i][j] * T[b][j] for i in range(6) for j in range(6)) for b in range(4)] for a in range(4)]
    cp = charpoly(HT)
    check(checks, '4. Hessian of the Lagrangian at q_0 on its tangent space: charpoly t^4 - t^2 (eigenvalues 1, -1, 0, 0)',
          cp == [1, 0, -1, 0, 0], str([str(c) for c in cp]))
    rk = 4 - inertia(HT)[2]
    check(checks, '4. that Hessian has rank two: q_0 is degenerate', rk == 2, 'rank %d' % rk)
    # the paper's chart, square roots replaced by their 2-jets
    n4 = 4
    u, v, a, b = (var(i, n4) for i in range(4))
    one = const(1, n4)
    half = Fraction(1, 2)
    xc = [u, v, sub(one, scale(add(mul(u, u), mul(v, v)), half))]
    yc = [scale(sub(one, scale(add(mul(a, a), mul(b, b)), half)), -1), a, b]
    fc = total(*[scale(xc[i], e[i]) for i in range(3)], *[mul(sub(xc[i], const(p[i], n4)), yc[i]) for i in range(3)])
    jet2 = {m: c for m, c in fc.items() if sum(m) <= 2}
    check(checks, '4. in the chart of Remark rem:degenerate-critical-point, the 2-jet of f at q_0 is exactly va', jet2 == mul(v, a), str(jet2))

    # 5. the printed factorisation
    tt = var(0, 1)
    o1 = const(1, 1)
    lhs = sub(mul(mul(sub(o1, scale(mul(tt, tt), half)), sub(o1, scale(mul(tt, tt), half))), add(o1, mul(tt, tt))), o1)
    rhs = scale(mul(mul(mul(tt, tt), mul(tt, tt)), sub(mul(tt, tt), const(3, 1))), Fraction(1, 4))
    check(checks, '5. (1 - t^2/2)^2 (1 + t^2) - 1 = t^4 (t^2 - 3)/4', sub(lhs, rhs) == {})

    # 6. auxiliary: the placement on F = Q^3 n {z_0 = 0}
    s0, s2, s3 = src.text(SEC0), src.text(SEC2), src.text(SEC3)
    check(checks, '6. the paper prints the involution A[z] = [z_0:-z_1:-z_2:-z_3:-z_4]', 'A[z_0:z_1:z_2:z_3:z_4]=[z_0:-z_1:-z_2:-z_3:-z_4]' in s0.replace(' ', '').replace('\n', ''))
    n5 = 5                                            # z1..z4 and the formal unit i
    z1, z2, z3, z4, ii = (var(k, n5) for k in range(5))
    m11, m12 = add(z1, mul(ii, z2)), add(z3, mul(ii, z4))
    m21, m22 = add(scale(z3, -1), mul(ii, z4)), sub(z1, mul(ii, z2))
    dt = sub(mul(m11, m22), mul(m12, m21))
    _, rem = divide(dt, add(mul(ii, ii), const(1, n5)))       # reduce i^2 = -1 (one polynomial is a Groebner basis)
    target = total(*[mul(z, z) for z in (z1, z2, z3, z4)])
    check(checks, '6. det [[z1+iz2, z3+iz4], [-z3+iz4, z1-iz2]] = z1^2+z2^2+z3^2+z4^2 in Z[i][z] (02-quadric.tex:102-110)', sub(rem, target) == {})
    e0 = (1, 0, 0, 0, 0)
    check(checks, '6. the +1 eigenline [1:0:0:0:0] of A is off Q^3, so Fix(A) = Q^3 n {z_0 = 0}', sum(c * c for c in e0) != 0, 'z.z = %d' % sum(c * c for c in e0))
    # T = diag(0, J, 2J) on C^5 with Gaussian-integer eigenvectors (re, im) pairs
    J = [[0, -1], [1, 0]]
    Tm = [[0] * 5 for _ in range(5)]
    for blk, sc in ((1, 1), (3, 2)):
        for r in range(2):
            for c in range(2):
                Tm[blk + r][blk + c] = sc * J[r][c]
    # the printed eigenlines as (real part, imaginary part, eigenvalue re, eigenvalue im)
    lines = [((0, 1, 0, 0, 0), (0, 0, 1, 0, 0), 0, -1), ((0, 1, 0, 0, 0), (0, 0, -1, 0, 0), 0, 1),
             ((0, 0, 0, 1, 0), (0, 0, 0, 0, 1), 0, -2), ((0, 0, 0, 1, 0), (0, 0, 0, 0, -1), 0, 2)]
    ok_eig, on_q = True, 0
    for zr, zi, lr, li in lines:
        Tz_r = [sum(Tm[r][c] * zr[c] for c in range(5)) for r in range(5)]
        Tz_i = [sum(Tm[r][c] * zi[c] for c in range(5)) for r in range(5)]
        lz_r = [lr * zr[c] - li * zi[c] for c in range(5)]
        lz_i = [lr * zi[c] + li * zr[c] for c in range(5)]
        ok_eig &= (Tz_r == lz_r and Tz_i == lz_i)
        q_r = sum(zr[c] ** 2 - zi[c] ** 2 for c in range(5))
        q_i = sum(2 * zr[c] * zi[c] for c in range(5))
        on_q += (q_r == 0 and q_i == 0)
    cpT = charpoly(Tm)
    check(checks, '6. T = diag(0,J,2J): charpoly t^5 + 5t^3 + 4t = t(t^2+1)(t^2+4), five distinct eigenvalues; the printed eigenlines '
          '[0:1:+-i:0:0], [0:0:0:1:+-i] are eigenvectors and all four lie on Q^3; [1:0:0:0:0] does not (Cor. cor:quadric-critical)',
          cpT == [1, 0, 5, 0, 4, 0] and ok_eig and on_q == 4 and '[0:1:\\pm i:0:0],\\qquad [0:0:0:1:\\pm i]' in s3, 'eigen %s, on Q^3 %d' % (ok_eig, on_q))
    ok = all(c['pass'] for c in checks)
    # with the statement read and the basis verified, any failed check is a property of the published object that fails
    verdict = 'CERTIFIED' if ok else ('REFUTED' if checks[0]['pass'] and res['gb_ok'] else 'REFUSED')
    # multiplicity of q_0 in A: the multiplicity of ell(q_0) as a root of charpoly(M_ell)
    l0 = sum(Fraction(c) * Fraction(v) for c, v in zip(res['ell'], q0))
    mult, cpq = 0, res['charpoly']
    while True:
        acc = [Fraction(cpq[0])]
        for c in cpq[1:]:
            acc.append(c + acc[-1] * l0)
        if acc[-1] != 0:
            break
        mult += 1
        cpq = acc[:-1]
    return {'verdict': verdict, 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: f(x,y) = e.x + (x-p).y on S^2 x S^2 has exactly three critical points, q_0 = (p,-e) '
                       'degenerate (Hessian rank 2); NOT the passage to Hamiltonian fixed points on Q^3 nor Crit(Q^3) = 4',
            'value': {'quotient_dim': res['dim'], 'multiplicity_q0': mult, 'distinct_complex': res['rank'], 'distinct_real': res['signature'],
                      'groebner_basis_size': len(res['G']), 'charpoly_ell_degree': len(res['charpoly']) - 1,
                      'standard_monomials': [''.join('%s^%d' % (NAMES[k], e) if e > 1 else NAMES[k] for k, e in enumerate(b) if e) or '1' for b in res['B']]}}


def forge():
    """each must NOT certify"""
    out = []
    r = decide(e=(2, 0, 0))
    out.append(('e scaled to (2,0,0) (real critical count %s)' % r['value'].get('distinct_real'), r['verdict']))
    r = decide(e=(0, 0, 0))
    out.append(('the e.x term dropped (real critical count %s)' % r['value'].get('distinct_real'), r['verdict']))
    r = decide(q0_y=(1, 0, 0))
    out.append(('the printed degenerate point moved to (p, +e)', r['verdict']))
    r = decide(printed_fq=Fraction(3, 4))
    out.append(('printed f(q_s) halved to s 3sqrt3/4', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    import time
    t0 = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], '|', c['detail'])
    print('%.1fs' % (time.time() - t0))
    t1 = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t1))
