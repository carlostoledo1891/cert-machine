"""
Core combinatorics for the independent decider (written from scratch).

Conventions
-----------
* A "halved partition" lam = (l1 >= l2 >= ...) stands for the exponent vector with
  real exponents 2*l_i (the witness only has even parts).  Structure constants of
  monomial symmetric functions are unchanged by halving all exponents.
* m_lam(x) = sum over DISTINCT monomials x^u, u a rearrangement of (2*lam, 0, ...).
* M(lam, n) = number of distinct monomials of m_lam in n variables.
"""
from fractions import Fraction
from math import comb, factorial
from functools import lru_cache
import json


def partitions_upto(nmax, maxlen=None):
    """All partitions of 0..nmax (as descending tuples)."""
    out = []

    def gen(n, maxpart, prefix):
        if n == 0:
            out.append(tuple(prefix))
            return
        if maxlen is not None and len(prefix) >= maxlen:
            return
        for p in range(min(n, maxpart), 0, -1):
            prefix.append(p)
            gen(n - p, p, prefix)
            prefix.pop()

    for n in range(nmax + 1):
        gen(n, n, [])
    return out


def mults(lam):
    d = {}
    for p in lam:
        d[p] = d.get(p, 0) + 1
    return d


def nmono(lam, n):
    """Number of distinct monomials of m_lam in n variables."""
    l = len(lam)
    if l > n:
        return 0
    r = factorial(n) // factorial(n - l)
    for c in mults(lam).values():
        r //= factorial(c)
    return r


def _ms_add(ms, v, d):
    ms = dict(ms)
    ms[v] = ms.get(v, 0) + d
    if ms[v] == 0:
        del ms[v]
    return ms


def coef_in_product(gam, lam, mu):
    """Coefficient of m_gam in m_lam * m_mu: number of distinct vectors u that are
    rearrangements of lam (padded with 0) on the positions of the fixed vector gam,
    such that gam - u is a rearrangement of mu (padded with 0)."""
    gm = sorted(mults(gam).items())
    lm = mults(lam)
    mm = mults(mu)

    def rec(i, lrem, mrem):
        if i == len(gm):
            return 1 if (not lrem and not mrem) else 0
        v, cnt = gm[i]
        # choose for the cnt positions of value v how many get u = t, t in {0} U parts(lam)
        opts = [0] + [t for t in lrem if t <= v]
        total = 0

        def dist(j, left, lr, mr, mult):
            nonlocal total
            if j == len(opts):
                if left == 0:
                    total += mult * rec(i + 1, lr, mr)
                return
            t = opts[j]
            # maximum count for this option
            mx = left
            if t > 0:
                mx = min(mx, lr.get(t, 0))
            s = v - t
            if s > 0:
                mx = min(mx, mr.get(s, 0))
            for nt in range(mx + 1):
                lr2, mr2 = lr, mr
                if nt:
                    if t > 0:
                        lr2 = _ms_add(lr2, t, -nt)
                    if s > 0:
                        mr2 = _ms_add(mr2, s, -nt)
                dist(j + 1, left - nt, lr2, mr2, mult * comb(left, nt))

        dist(0, cnt, lrem, mrem, 1)
        return total

    return rec(0, lm, mm)


def product_support(lam, mu):
    """All gam that can occur in m_lam * m_mu."""
    res = set()
    lam = list(lam)

    def rec(i, mrem, merged, unl):
        if i == len(lam):
            rest = []
            for v, c in mrem.items():
                rest += [v] * c
            res.add(tuple(sorted(merged + unl + rest, reverse=True)))
            return
        rec(i + 1, mrem, merged, unl + [lam[i]])
        for v in list(mrem.keys()):
            rec(i + 1, _ms_add(mrem, v, -1), merged + [lam[i] + v], unl)

    rec(0, mults(mu), [], [])
    return res


@lru_cache(maxsize=None)
def mprod(lam, mu):
    """m_lam * m_mu = sum N[gam] m_gam (independent of the number of variables)."""
    out = {}
    for gam in product_support(lam, mu):
        c = coef_in_product(gam, lam, mu)
        if c:
            out[gam] = c
    return out


def submultisets(gam):
    """All (g1, g2) with g1 U g2 = gam as multisets (g1, g2 descending tuples)."""
    items = sorted(mults(gam).items(), reverse=True)
    out = []

    def rec(i, a, b):
        if i == len(items):
            out.append((tuple(sorted(a, reverse=True)), tuple(sorted(b, reverse=True))))
            return
        v, c = items[i]
        for t in range(c + 1):
            rec(i + 1, a + [v] * t, b + [v] * (c - t))

    rec(0, [], [])
    return out


def load_witness(path):
    d = json.load(open(path))
    terms = []
    for a, alpha, c in d['terms']:
        assert all(p % 2 == 0 for p in alpha)
        lam = tuple(sorted((p // 2 for p in alpha), reverse=True))
        terms.append((int(a), lam, int(c)))
    hdr = {k: d[k] for k in ('K', 'L', 'tau', 'g', 'caps_C', 'degree')}
    return hdr, terms
