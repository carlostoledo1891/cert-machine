"""hankel2.py — general Prevost-type moment functionals, exact Hankel determinants.

A functional mu_X on rational functions of t with simple poles at t = -a^2, a in a node
set S of positive half-integers. Two weights (k >= 2):

  'Z'  w(y) ∝ (-1)^{k-1} y^k f^{(k-1)}(y),  f = 1/(e^{2 pi y}-1)          (Prevost/Fauzan)
       int_0^inf w/(y^2+a^2) dy = a^{k-1} zeta(k,a) - 1/(2a) - 1/(k-1)
       moments  m_e = (-1)^e B_{2e+2} (2e+k)! / ((k-1)! (2e+2)!)
  'E'  w(y) ∝ (-1)^{k-1} y^k g^{(k-1)}(y),  g = 1/sinh(pi y)              (alternating)
       int_0^inf w/(y^2+a^2) dy = a^{k-1} (eta(k,a) - a^{-k}/2)          [scale: see moments]
       moments  m_e = (-1)^e B_{2e+2} (2^{2e+2}-1) (2e+k)! / ((k-1)! (2e+2)!)
  where zeta(k,a) = sum_{n>=0} (n+a)^{-k}, eta(k,a) = sum_{n>=0} (-1)^n (n+a)^{-k}.

The constant X is
  Z, integer or half-integer a :  X = zeta(k)
  E, integer a                  :  X = zeta(k)
  E, half-integer a             :  X = beta(k)  (Dirichlet beta; beta(2) = Catalan's G)
Every node value is affine in X with rational coefficients (phi_a(X) = alpha_a X + beta_a).
The moment and node formulas are checked against quadrature in test2.py.
"""
import math, json, time
from functools import lru_cache
from flint import fmpq, fmpz, fmpq_poly, fmpq_mat, fmpz_mat, arb, ctx
from hankel import content, log_fmpq, log_fmpz

@lru_cache(maxsize=None)
def fact(n):
    return math.factorial(n)

def mu_mono(e, k, kind):
    B = fmpq.bernoulli(2 * e + 2)
    v = B * fmpq(fact(2 * e + k), fact(k - 1) * fact(2 * e + 2))
    if kind == 'E':
        v *= (2 ** (2 * e + 2) - 1)
    return -v if e % 2 else v

def node_value(a, k, kind):
    """phi_a(X) = alpha X + beta for node a (fmpq, a in (1/2)Z_{>0})."""
    twice = a * 2
    assert twice.q == 1
    A = a ** (k - 1)
    if kind == 'Z':
        if a.q == 1:
            j = int(a.p)
            Hs = sum((fmpq(1, v ** k) for v in range(1, j)), fmpq(0))
            # zeta(k, j) = zeta(k) - sum_{v<j} v^-k
            return A, -A * Hs - 1 / (2 * a) - fmpq(1, k - 1)
        else:
            j = int((twice.p - 1) // 2)            # a = j + 1/2
            S = sum((fmpq(1, (2 * u + 1) ** k) for u in range(j)), fmpq(0))
            # zeta(k, j+1/2) = 2^k [(1 - 2^-k) zeta(k) - S] = (2^k - 1) zeta(k) - 2^k S
            return A * (2 ** k - 1), -A * 2 ** k * S - 1 / (2 * a) - fmpq(1, k - 1)
    else:
        if a.q == 1:
            j = int(a.p)
            # eta(k, j) = (-1)^j [ -(1 - 2^{1-k}) zeta(k) - sum_{1<=m<j} (-1)^m m^-k ]
            sg = -1 if j % 2 else 1
            S = sum((fmpq((-1) ** m, m ** k) for m in range(1, j)), fmpq(0))
            al = -sg * (1 - fmpq(2) ** (1 - k))
            be = -sg * S
        else:
            j = int((twice.p - 1) // 2)
            sg = -1 if j % 2 else 1
            S = sum((fmpq((-1) ** u, (2 * u + 1) ** k) for u in range(j)), fmpq(0))
            # eta(k, j+1/2) = 2^k (-1)^j [ beta(k) - S ]
            al = fmpq(2 ** k * sg)
            be = -fmpq(2 ** k * sg) * S
        return A * al, A * (be - a ** (-k) / 2)

def build(k, kind, den_nodes, num_nodes, h):
    """den_nodes: list of fmpq a (poles at -a^2, simple); num_nodes: list of (b, mult)."""
    num0 = fmpq_poly([1])
    for b, mlt in num_nodes:
        num0 *= fmpq_poly([b * b, 1]) ** mlt
    tail = fmpq_poly([1])
    for a in den_nodes:
        tail *= fmpq_poly([a * a, 1])
    dtail = tail.derivative()
    base = {}
    phis = {}
    for a in den_nodes:
        s = -a * a
        base[a] = num0(s) / dtail(s)
        phis[a] = node_value(a, k, kind)
    mono = {}
    def mu_poly(q):
        s = fmpq(0)
        for e, c in enumerate(q.coeffs()):
            if c != 0:
                if e not in mono:
                    mono[e] = mu_mono(e, k, kind)
                s += c * mono[e]
        return s
    t = fmpq_poly([0, 1])
    num = num0
    av, bv = [], []
    pw = {a: fmpq(1) for a in den_nodes}
    for m in range(2 * h - 1):
        q, rem = divmod(num, tail)
        am = mu_poly(q) if q.degree() >= 0 else fmpq(0)
        bm = fmpq(0)
        for a in den_nodes:
            c = base[a] * pw[a]
            al, be = phis[a]
            am += c * be
            bm += c * al
            pw[a] *= -a * a
        av.append(am); bv.append(bm)
        num = num * t
    A = fmpq_mat(h, h, [av[i + l] for i in range(h) for l in range(h)])
    B = fmpq_mat(h, h, [bv[i + l] for i in range(h) for l in range(h)])
    return A, B

def delta_poly(A, B):
    h = A.nrows()
    if B.rank() < h:
        # fall back: interpolate det(A + xB) at h+1 integer points
        xs = list(range(h + 1))
        ys = [(A + B * fmpq(x)).det() for x in xs]
        return fmpq_poly.interpolate(xs, ys) if hasattr(fmpq_poly, 'interpolate') else lagrange(xs, ys)
    detB = B.det()
    Mx = -(B.solve(A))
    d = fmpz(1)
    for x in Mx.entries():
        d = d.lcm(x.q)
    Mz = fmpz_mat(h, h, [int((x * d).p) for x in Mx.entries()])
    cz = Mz.charpoly().coeffs()
    dd = int(d)
    cp = fmpq_poly([fmpq(int(c) * dd ** i, dd ** h) for i, c in enumerate(cz)])
    return cp * detB

def lagrange(xs, ys):
    P = fmpq_poly([0])
    for i, xi in enumerate(xs):
        L = fmpq_poly([1]); den = fmpq(1)
        for j, xj in enumerate(xs):
            if j != i:
                L *= fmpq_poly([-xj, 1]); den *= (xi - xj)
        P += L * (ys[i] / den)
    return P

def const_ball(k, kind, half):
    """X as an arb ball at the current precision."""
    if kind == 'E' and half:
        # beta(k) = 4^{-k} (zeta(k,1/4) - zeta(k,3/4))
        return (arb(k).zeta(arb(1) / 4) - arb(k).zeta(arb(3) / 4)) / arb(4) ** k
    return arb(k).zeta()

def eval_log_P(P, k, kind, half):
    coeffs = [int(c.p) for c in P.coeffs()]
    hb = max(abs(c).bit_length() for c in coeffs)
    prec = hb + 256
    while True:
        old = ctx.prec; ctx.prec = prec
        try:
            z = const_ball(k, kind, half)
            v = arb(0)
            for c in reversed(coeffs):
                v = v * z + c
            if v < 0:
                raise RuntimeError("P(X) < 0: positivity violated")
            if v > 0 and v.rad() < v.mid() * arb(2) ** -30:
                return float(v.log().mid()), prec
        finally:
            ctx.prec = old
        prec *= 2

def run(k, kind, den_nodes, num_nodes, h=None, tag=None):
    if h is None:
        h = len(den_nodes)
    half = den_nodes[0].q != 1
    t0 = time.time()
    A, B = build(k, kind, den_nodes, num_nodes, h)
    Dl = delta_poly(A, B)
    c = content(Dl)
    P = Dl / c
    lv, prec = eval_log_P(P, k, kind, half)
    return dict(k=k, kind=kind, tag=tag, h=h, deg=P.degree(), log_content=log_fmpq(c),
                logP_at_X=lv, log_delta_at_X=lv + log_fmpq(c),
                log_height=max(log_fmpz(x.p) for x in P.coeffs() if x != 0),
                secs=round(time.time() - t0, 2)), P, Dl
