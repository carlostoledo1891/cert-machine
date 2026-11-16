"""
Independent exact validator: I and J for SMALL K by exact integration over explicitly
enumerated convex polytopes (one per pattern of large/small coordinates), built only from
the pointwise definitions:
  x in S  <=>  x >= 0, sum x <= L, sum_{x_i > g} x_i <= C(#{x_i > g})
  J = int_{q: sum q <= tau} int int F(q,x) F(q,y)  with (q,x), (q,y) in S.
Vertices by exact linear algebra, triangulation by recursive coning over facets, monomials
over simplices by the Dirichlet formula.  Shares nothing with decomp.py except the
witness-term format.
"""
from fractions import Fraction
from itertools import combinations, permutations, product
from math import factorial
import sympy as sp


def solve(A, b):
    n = len(A)
    M = [list(A[i]) + [b[i]] for i in range(n)]
    for c in range(n):
        piv = None
        for r in range(c, n):
            if M[r][c] != 0:
                piv = r
                break
        if piv is None:
            return None
        M[c], M[piv] = M[piv], M[c]
        pv = M[c][c]
        M[c] = [v / pv for v in M[c]]
        for r in range(n):
            if r != c and M[r][c] != 0:
                f = M[r][c]
                M[r] = [a - f * bb for a, bb in zip(M[r], M[c])]
    return [M[i][n] for i in range(n)]


def rank(vecs):
    M = [list(v) for v in vecs]
    if not M:
        return 0
    rk = 0
    ncol = len(M[0])
    for c in range(ncol):
        piv = None
        for r in range(rk, len(M)):
            if M[r][c] != 0:
                piv = r
                break
        if piv is None:
            continue
        M[rk], M[piv] = M[piv], M[rk]
        for r in range(len(M)):
            if r != rk and M[r][c] != 0:
                f = M[r][c] / M[rk][c]
                M[r] = [a - f * bb for a, bb in zip(M[r], M[rk])]
        rk += 1
    return rk


def vertices(A, b, d):
    V = set()
    for S in combinations(range(len(A)), d):
        x = solve([A[i] for i in S], [b[i] for i in S])
        if x is None:
            continue
        if all(sum(A[i][j] * x[j] for j in range(d)) <= b[i] for i in range(len(A))):
            V.add(tuple(x))
    return sorted(V)


def affdim(pts):
    if len(pts) <= 1:
        return 0
    p0 = pts[0]
    return rank([[a - c for a, c in zip(p, p0)] for p in pts[1:]])


def triangulate(V, A, b, idx, k):
    if k == 0:
        return [[idx[0]]]
    v0 = idx[0]
    facets = set()
    for i in range(len(A)):
        S = [j for j in idx if sum(A[i][t] * V[j][t] for t in range(len(V[j]))) == b[i]]
        if v0 in S or len(S) < k:
            continue
        if affdim([V[j] for j in S]) == k - 1:
            facets.add(tuple(sorted(S)))
    out = []
    for F in facets:
        for s in triangulate(V, A, b, list(F), k - 1):
            out.append([v0] + s)
    return out


def integrate_poly_polytope(poly, syms, A, b):
    d = len(syms)
    V = vertices(A, b, d)
    if len(V) < d + 1 or affdim(V) < d:
        return Fraction(0)
    simp = triangulate(V, A, b, list(range(len(V))), d)
    bs = sp.symbols('b0:%d' % d)
    total = Fraction(0)
    for s in simp:
        v0 = V[s[0]]
        E = [[V[s[i + 1]][j] - v0[j] for j in range(d)] for i in range(d)]
        det = sp.Matrix(E).det()
        vol = abs(Fraction(int(sp.numer(det)), int(sp.denom(det))))
        sub = {syms[j]: sp.Rational(v0[j].numerator, v0[j].denominator) +
               sum(sp.Rational(E[i][j].numerator, E[i][j].denominator) * bs[i] for i in range(d))
               for j in range(d)}
        P = sp.Poly(sp.expand(poly.as_expr().subs(sub)), *bs, domain='QQ')
        acc = Fraction(0)
        for mon, c in P.terms():
            num = 1
            for a in mon:
                num *= factorial(a)
            acc += Fraction(int(sp.numer(c)), int(sp.denom(c))) * Fraction(num, factorial(d + sum(mon)))
        total += vol * acc
    return total


def F_expr(terms, xs, L):
    s = sum(xs)
    K = len(xs)
    out = 0
    for a, lam, c in terms:
        if len(lam) > K:
            continue
        vec = [2 * p for p in lam] + [0] * (K - len(lam))
        mono = 0
        for u in set(permutations(vec)):
            t = 1
            for xi, ui in zip(xs, u):
                t *= xi ** ui
            mono += t
        out += c * (sp.Rational(L.numerator, L.denominator) - s) ** a * mono
    return sp.expand(out)


def exact_I(terms, dat):
    K, g, L, C = dat['K'], dat['g'], dat['L'], dat['C']
    xs = sp.symbols('x0:%d' % K)
    F = F_expr(terms, xs, L)
    P2 = sp.Poly(sp.expand(F * F), *xs, domain='QQ')
    tot = Fraction(0)
    for pat in product([0, 1], repeat=K):
        A, b = [], []
        unit = lambda i, s=1: [s if j == i else 0 for j in range(K)]
        for i in range(K):
            A.append(unit(i, -1)); b.append(Fraction(0))
            if pat[i]:
                A.append(unit(i, -1)); b.append(-g)
            else:
                A.append(unit(i)); b.append(g)
        A.append([1] * K); b.append(L)
        m = sum(pat)
        A.append([1 if pat[j] else 0 for j in range(K)]); b.append(C(m))
        A = [[Fraction(v) for v in row] for row in A]
        tot += integrate_poly_polytope(P2, xs, A, b)
    return tot


def exact_J(terms, dat):
    K, g, L, C, tau = dat['K'], dat['g'], dat['L'], dat['C'], dat['tau']
    k = K - 1
    qs = sp.symbols('q0:%d' % k)
    x, y = sp.symbols('xx yy')
    allv = list(qs) + [x, y]
    d = k + 2
    Fx = F_expr(terms, list(qs) + [x], L)
    Fy = Fx.subs(x, y)
    PP = sp.Poly(sp.expand(Fx * Fy), *allv, domain='QQ')
    tot = Fraction(0)
    for pat in product([0, 1], repeat=d):
        A, b = [], []
        unit = lambda i, s=1: [s if j == i else 0 for j in range(d)]
        for i in range(d):
            A.append(unit(i, -1)); b.append(Fraction(0))
            if pat[i]:
                A.append(unit(i, -1)); b.append(-g)
            else:
                A.append(unit(i)); b.append(g)
        qrow = [1] * k + [0, 0]
        A.append(qrow); b.append(tau)
        A.append([1] * k + [1, 0]); b.append(L)
        A.append([1] * k + [0, 1]); b.append(L)
        mq = sum(pat[:k])
        capx = [1 if pat[j] else 0 for j in range(k)] + [1 if pat[k] else 0, 0]
        A.append(capx); b.append(C(mq + pat[k]))
        capy = [1 if pat[j] else 0 for j in range(k)] + [0, 1 if pat[k + 1] else 0]
        A.append(capy); b.append(C(mq + pat[k + 1]))
        A = [[Fraction(v) for v in row] for row in A]
        tot += integrate_poly_polytope(PP, allv, A, b)
    return tot
