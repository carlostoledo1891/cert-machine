#!/usr/bin/env python3
"""verify_local.py -- exact check of a lower-bound certificate in the local form.  Standard library, fractions only.

THEOREM USED (lifting.md Theorem D + locality.md Theorem C).  Let p, q, psi be continuous functions on the diamond
|h| + |d| <= 1, polynomial on each strip between consecutive lines h = const of a finite list, and l1, l2, mu numbers.
If  (D1)  2 p (h - f) + 2 q d - l1 f h - l2 (h^2 - d^2) - mu >= 0   on the diamond, for f = +1 and f = -1, and
    (LOC) the matrix [[8 p_h - x1^2, 4 (p_d + q_h) - x1 x2], [., 8 q_d - x2^2]], x1 = 2q - psi_h, x2 = 2p - psi_d,
          is positive semidefinite at every interior point of every strip,
then every finite stationary network with a +-1 lamp read at Poisson rate r has  sigma/r >= l1 C1 + l2 C2 + mu.
(beta = p + q, gamma = p - q, h = (w+v)/2, d = (w-v)/2 in the notation of the two notes.)

THE FILE gives rational knots 0 = h_0 < ... < h_K = 1 and, at the knots, the values of
    A_0..A_{na-1},  K_0..K_{nk-1},  P_0..P_{npsi-1}     (piecewise linear in |h|; A, P odd in h; K even in h)
    p = sum_k A_k(h) d^(2k),     q = sum_k K_k(h) d^(2k+1),     psi = sum_k P_k(h) d^(2k+1).
Odd functions must vanish at h = 0 (continuity).  By the symmetries (h,d) -> (h,-d) and (h,d,f) -> (-h,-d,-f) of this
family, (D1) for both f and (LOC) need only be checked on 0 <= h <= 1, 0 <= d <= 1 - h.

THE CHECK.  On each strip [h_j, h_j+1], with d = (1 - h) s, 0 <= s <= 1, every quantity is a polynomial in (h, s) with
rational coefficients.  P >= 0 on a box is proved by nonnegative Bernstein coefficients; otherwise the box is
bisected; a negative value at a corner is a refutation.   Usage: python3 verify_local.py CERT.json [C1 C2]"""
import json, sys
from fractions import Fraction as Q
from math import comb

class Poly(dict):
    """polynomial in two variables: {(i, j): coefficient of x^i y^j}"""
    def __add__(self, o):
        r = Poly(self)
        for k, v in o.items():
            r[k] = r.get(k, 0) + v
        return r
    def __sub__(self, o): return self + o.scale(-1)
    def scale(self, c): return Poly({k: v * c for k, v in self.items()})
    def __mul__(self, o):
        r = {}
        for (i, j), a in self.items():
            if a == 0: continue
            for (k, l), b in o.items():
                if b == 0: continue
                key = (i + k, j + l); r[key] = r.get(key, 0) + a * b
        return Poly(r)
def const(c): return Poly({(0, 0): Q(c)})
X = Poly({(1, 0): Q(1)}); Y = Poly({(0, 1): Q(1)})
def power(P, n):
    r = const(1)
    for _ in range(n): r = r * P
    return r
def substitute_y(P, Yexpr):
    """P(x, y) with y replaced by a polynomial Yexpr(x, y)"""
    r = Poly(); cache = {0: const(1)}
    for (i, j), a in P.items():
        if a == 0: continue
        if j not in cache: cache[j] = power(Yexpr, j)
        r = r + (Poly({(i, 0): a}) * cache[j])
    return r
def on_box(P, x0, x1, y0, y1):
    """Bernstein coefficients of P on [x0,x1] x [y0,y1], as a (n+1) x (m+1) table"""
    n = max((i for (i, j), a in P.items() if a != 0), default=0); m = max((j for (i, j), a in P.items() if a != 0), default=0)
    c = [[Q(0)] * (m + 1) for _ in range(n + 1)]
    for (i, j), a in P.items():
        if a != 0: c[i][j] += a
    # x = x0 + (x1-x0) u, then y = y0 + (y1-y0) t : power coefficients in (u, t), one variable at a time
    px = [[comb(i, k) * x0 ** (i - k) * (x1 - x0) ** k for k in range(i + 1)] for i in range(n + 1)]
    py = [[comb(j, l) * y0 ** (j - l) * (y1 - y0) ** l for l in range(j + 1)] for j in range(m + 1)]
    for j in range(m + 1):
        col = [c[i][j] for i in range(n + 1)]
        for k in range(n + 1): c[k][j] = sum(col[i] * px[i][k] for i in range(k, n + 1) if col[i] != 0)
    for i in range(n + 1):
        row = c[i][:]
        for l in range(m + 1): c[i][l] = sum(row[j] * py[j][l] for j in range(l, m + 1) if row[j] != 0)
    # power -> Bernstein, one variable at a time
    for l in range(m + 1):
        col = [c[k][l] for k in range(n + 1)]
        for i in range(n + 1): c[i][l] = sum(Q(comb(i, k), comb(n, k)) * col[k] for k in range(i + 1))
    for i in range(n + 1):
        row = c[i][:]
        for j in range(m + 1): c[i][j] = sum(Q(comb(j, l), comb(m, l)) * row[l] for l in range(j + 1))
    return c
count = 0
def nonneg(P, x0, x1, y0, y1, depth=0):
    """True iff P >= 0 on the box is PROVED; raises on a negative corner value"""
    global count
    count += 1
    b = on_box(P, x0, x1, y0, y1)
    if min(min(r) for r in b) >= 0: return True
    corners = [b[0][0], b[0][-1], b[-1][0], b[-1][-1]]
    if min(corners) < 0: raise ValueError('negative value %s at a corner of [%s,%s] x [%s,%s]' % (float(min(corners)), x0, x1, y0, y1))
    if depth > 40: raise ValueError('not resolved at depth 40 on [%s,%s] x [%s,%s]' % (x0, x1, y0, y1))
    if depth % 2 == 0:
        xm = (x0 + x1) / 2
        return nonneg(P, x0, xm, y0, y1, depth + 1) and nonneg(P, xm, x1, y0, y1, depth + 1)
    ym = (y0 + y1) / 2
    return nonneg(P, x0, x1, y0, ym, depth + 1) and nonneg(P, x0, x1, ym, y1, depth + 1)

def verify(cert, C1=Q(3, 10), C2=Q(2, 25), verbose=True):
    kn = [Q(k) for k in cert['knots']]; na, nk, npsi = cert['na'], cert['nk'], cert['npsi']
    fun = [[Q(v) for v in f] for f in cert['functions']]; l1, l2, mu = Q(cert['l1']), Q(cert['l2']), Q(cert['mu'])
    K = len(kn); assert kn[0] == 0 and kn[-1] == 1 and all(a < b for a, b in zip(kn, kn[1:])), 'knots'
    assert len(fun) == na + nk + npsi and all(len(f) == K for f in fun), 'shape'
    for fi in list(range(na)) + list(range(na + nk, na + nk + npsi)): assert fun[fi][0] == 0, 'an odd function does not vanish at h = 0'
    D = (const(1) - X) * Y                                    # d = (1 - h) s
    for j in range(K - 1):
        h0, h1 = kn[j], kn[j + 1]
        lin = lambda f: const(f[j]) + (X - const(h0)).scale((f[j + 1] - f[j]) / (h1 - h0))    # the function on this strip
        slope = lambda f: const((f[j + 1] - f[j]) / (h1 - h0))
        A = fun[:na]; Kf = fun[na:na + nk]; P_ = fun[na + nk:]
        dpow = {}
        def dp(n):
            if n not in dpow: dpow[n] = power(D, n)
            return dpow[n]
        zero = Poly()
        p = zero; ph = zero; pd = zero; q = zero; qh = zero; qd = zero; sh = zero; sd = zero
        for k in range(na):
            p = p + lin(A[k]) * dp(2 * k); ph = ph + slope(A[k]) * dp(2 * k)
            if k: pd = pd + (lin(A[k]) * dp(2 * k - 1)).scale(2 * k)
        for k in range(nk):
            q = q + lin(Kf[k]) * dp(2 * k + 1); qh = qh + slope(Kf[k]) * dp(2 * k + 1); qd = qd + (lin(Kf[k]) * dp(2 * k)).scale(2 * k + 1)
        for k in range(npsi):
            sh = sh + slope(P_[k]) * dp(2 * k + 1); sd = sd + (lin(P_[k]) * dp(2 * k)).scale(2 * k + 1)
        x1 = q.scale(2) - sh; x2 = p.scale(2) - sd
        a11 = ph.scale(8) - x1 * x1; a12 = (pd + qh).scale(4) - x1 * x2; a22 = qd.scale(8) - x2 * x2
        det = a11 * a22 - a12 * a12
        tests = [('a11', a11), ('a22', a22), ('det', det)]
        for f in (1, -1):
            N = (p * (X - const(f))).scale(2) + (q * D).scale(2) - X.scale(l1 * f) - (X * X - D * D).scale(l2) - const(mu)
            tests.append(('D1 f=%+d' % f, N))
        before = count
        for name, T in tests:
            try: nonneg(T, h0, h1, Q(0), Q(1))
            except ValueError as e:
                print('REFUTED or unresolved on strip [%s, %s], test %s: %s' % (h0, h1, name, e)); return None
        if verbose: print('strip [%s, %s]: 5 inequalities proved, %d boxes' % (h0, h1, count - before), flush=True)
    return l1 * C1 + l2 * C2 + mu
if __name__ == '__main__':
    cert = json.load(open(sys.argv[1]))
    C1, C2 = (Q(sys.argv[2]), Q(sys.argv[3])) if len(sys.argv) > 3 else (Q(3, 10), Q(2, 25))
    bound = verify(cert, C1, C2)
    if bound is None: print('VERDICT: NOT PROVED'); sys.exit(1)
    print('VERDICT: PROVED.  %d boxes in all.  sigma/r >= l1 C1 + l2 C2 + mu = %s = %.9f at (C1, C2) = (%s, %s)' % (count, bound, float(bound), C1, C2))
