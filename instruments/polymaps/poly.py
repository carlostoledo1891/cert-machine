"""Scratch prototype: sparse exact polynomials over Q (dict exps->Fraction). Scouting only."""
from fractions import Fraction as Fr
import re

class P:
    __slots__ = ('n', 't')
    def __init__(self, n, t=None):
        self.n = n; self.t = t if t is not None else {}
    @staticmethod
    def const(c, n):
        c = Fr(c); return P(n, {(0,)*n: c} if c else {})
    @staticmethod
    def var(i, n):
        e = [0]*n; e[i] = 1; return P(n, {tuple(e): Fr(1)})
    def __add__(self, o):
        if not isinstance(o, P): o = P.const(o, self.n)
        t = dict(self.t)
        for e, c in o.t.items():
            s = t.get(e, 0) + c
            if s: t[e] = s
            else: t.pop(e, None)
        return P(self.n, t)
    __radd__ = __add__
    def __neg__(self): return P(self.n, {e: -c for e, c in self.t.items()})
    def __sub__(self, o): return self + (-o if isinstance(o, P) else P.const(-Fr(o), self.n))
    def __rsub__(self, o): return (-self) + o
    def __mul__(self, o):
        if not isinstance(o, P):
            o = Fr(o)
            return P(self.n, {e: c*o for e, c in self.t.items()} if o else {})
        t = {}
        for e1, c1 in self.t.items():
            for e2, c2 in o.t.items():
                e = tuple(a+b for a, b in zip(e1, e2))
                s = t.get(e, 0) + c1*c2
                if s: t[e] = s
                else: t.pop(e, None)
        return P(self.n, t)
    __rmul__ = __mul__
    def __pow__(self, k):
        r = P.const(1, self.n)
        for _ in range(k): r = r*self
        return r
    def diff(self, i):
        t = {}
        for e, c in self.t.items():
            if e[i]:
                f = list(e); f[i] -= 1; t[tuple(f)] = c*e[i]
        return P(self.n, t)
    def deg(self): return max((sum(e) for e in self.t), default=-1)
    def is_zero(self): return not self.t
    def const_value(self):
        if not self.t: return Fr(0)
        if len(self.t) == 1 and (0,)*self.n in self.t: return self.t[(0,)*self.n]
        return None
    def ev(self, pt):
        s = Fr(0)
        for e, c in self.t.items():
            m = c
            for a, k in zip(pt, e):
                if k: m *= Fr(a)**k
            s += m
        return s
    def subs(self, polys):
        """compose: substitute polys[i] for variable i (all polys share target n)."""
        n2 = polys[0].n; out = P(n2)
        cache = [dict() for _ in polys]
        def pw(i, k):
            if k not in cache[i]:
                cache[i][k] = P.const(1, n2) if k == 0 else pw(i, k-1)*polys[i]
            return cache[i][k]
        for e, c in self.t.items():
            m = P.const(c, n2)
            for i, k in enumerate(e):
                if k: m = m*pw(i, k)
            out = out + m
        return out

def parse_tex(s, varnames):
    """parse a TeX polynomial like '\\tfrac{22}{9}x^6yz^2t^2+14x^4yz^2t-...'"""
    n = len(varnames); vi = {v: i for i, v in enumerate(varnames)}
    s = s.replace('\\\\[2pt]', '').replace('\\\\', '').replace('&', '').replace('{}', '')
    s = re.sub(r'\s+', '', s)
    s = s.replace('\\tfrac', '\\frac')
    # tokenise into signed terms
    terms = re.findall(r'([+-]?)((?:\\frac\{\d+\}\{\d+\}|\d+)?)((?:[a-z](?:_\d)?(?:\^\{?\d+\}?)?)*)', s)
    p = P(n); total = ''
    for sign, coef, mono in terms:
        if not coef and not mono: 
            continue
        total += sign + coef + mono
        c = Fr(1)
        if coef.startswith('\\frac'):
            a, b = re.findall(r'\{(\d+)\}', coef); c = Fr(int(a), int(b))
        elif coef: c = Fr(int(coef))
        if sign == '-': c = -c
        e = [0]*n
        for v, k in re.findall(r'([a-z](?:_\d)?)(?:\^\{?(\d+)\}?)?', mono):
            e[vi[v]] += int(k) if k else 1
        p = p + P(n, {tuple(e): c})
    assert total == s, (total[:200], s[:200])
    return p

def det(M):
    """exact determinant of a square matrix of P by subset-DP Laplace expansion (rows in order)."""
    k = len(M); n = M[0][0].n
    cur = {0: P.const(1, n)}
    for r in range(k):
        nxt = {}
        for mask, val in cur.items():
            sgn_base = 0
            for c in range(k):
                if mask >> c & 1: continue
                if M[r][c].is_zero(): continue
                # sign: number of used columns greater than c
                inv = bin(mask >> (c+1)).count('1')
                term = val * M[r][c]
                if inv & 1: term = -term
                nm = mask | (1 << c)
                nxt[nm] = nxt[nm] + term if nm in nxt else term
        cur = {m: v for m, v in nxt.items() if not v.is_zero()}
    return cur.get((1 << k) - 1, P(n))

def jac(F, n):
    return [[f.diff(j) for j in range(n)] for f in F]
