"""_poly.py — sparse multivariate polynomials with exact coefficients (int or Fraction), standard library only.

A polynomial is a dict {exponent tuple: coefficient} with no zero coefficients. Enough for the lane-F deciders that
check polynomial identities exactly: +, -, *, powers, composition, evaluation, partial derivatives, and division by
a single polynomial (a single polynomial is a Groebner basis of its ideal, so a zero remainder decides membership).
"""
from fractions import Fraction


def const(c, n):
    return {(0,) * n: c} if c else {}


def var(i, n):
    return {tuple(int(j == i) for j in range(n)): 1}


def add(a, b, s=1):
    r = dict(a)
    for m, c in b.items():
        v = r.get(m, 0) + s * c
        if v:
            r[m] = v
        else:
            r.pop(m, None)
    return r


def sub(a, b):
    return add(a, b, -1)


def scale(a, k):
    return {m: c * k for m, c in a.items()} if k else {}


def mul(a, b):
    if len(a) > len(b):
        a, b = b, a
    r = {}
    get = r.get
    for ma, ca in a.items():
        for mb, cb in b.items():
            m = tuple(x + y for x, y in zip(ma, mb))
            v = get(m, 0) + ca * cb
            if v:
                r[m] = v
            else:
                r.pop(m, None)
    return r


def pw(a, k, n):
    r = const(1, n)
    base = a
    while k:
        if k & 1:
            r = mul(r, base)
        k >>= 1
        if k:
            base = mul(base, base)
    return r


def total(*ps):
    r = {}
    for p in ps:
        r = add(r, p)
    return r


def compose(a, subs, n_out):
    """a(subs[0], subs[1], ...) with each subs[i] a polynomial in n_out variables; powers cached per variable"""
    cache = [dict() for _ in subs]

    def power(i, e):
        if e not in cache[i]:
            cache[i][e] = const(1, n_out) if e == 0 else mul(power(i, e - 1), subs[i])
        return cache[i][e]
    r = {}
    for m, c in a.items():
        t = const(c, n_out)
        for i, e in enumerate(m):
            if e:
                t = mul(t, power(i, e))
        r = add(r, t)
    return r


def evaluate(a, point):
    s = Fraction(0)
    for m, c in a.items():
        t = Fraction(c)
        for x, e in zip(point, m):
            if e:
                t *= Fraction(x) ** e
        s += t
    return s


def diff(a, i):
    r = {}
    for m, c in a.items():
        if m[i]:
            mm = list(m)
            mm[i] -= 1
            r[tuple(mm)] = c * m[i]
    return r


def degree(a):
    return max((sum(m) for m in a), default=-1)


def _grlex(m):
    return (sum(m), m)


def divide(a, f):
    """(quotient, remainder) of a by f in graded-lex order; remainder {} iff f divides a"""
    lm = max(f, key=_grlex)
    lc = f[lm]
    q, r, p = {}, {}, dict(a)
    while p:
        m = max(p, key=_grlex)
        c = p[m]
        if all(x >= y for x, y in zip(m, lm)):
            k = Fraction(c, lc) if not isinstance(c, Fraction) and c % lc else (c // lc if not isinstance(c, Fraction) else c / lc)
            t = {tuple(x - y for x, y in zip(m, lm)): k}
            q = add(q, t)
            p = sub(p, mul(t, f))
        else:
            r[m] = c
            del p[m]
    return q, r
