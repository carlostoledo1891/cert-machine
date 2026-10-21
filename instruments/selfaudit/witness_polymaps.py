#!/usr/bin/env python3
"""witness_polymaps.py — the self-audit's WITNESS for the polymaps family: Python standard library, exact Fractions, no
code from instruments/polymaps (its own sparse polynomials, partial derivatives, evaluation and Gaussian elimination).
Written from the claims as the papers state them:

  keller   a map F of Q^n is a Keller counterexample when det JF is identically a nonzero constant and F is not
           injective. A violation witnessed here: det JF at the rational point p₀ = (1/2, 1/3, 1/5, …) differs from the
           printed constant (then det JF is not that constant identically); or the printed witness points are not
           distinct or do not share one image (then they witness nothing)
  field    a field X on R^n with (JX + I)^n = 0 identically and at least two zeros. A violation: (JX(p₀) + I)^n ≠ 0 at
           p₀ (the identity fails there); or a printed zero is not a zero of X, or the zeros are not distinct
  phi      as keller, with three points sharing one image
  keller-partial  (F7) the collision only: the determinant is the paper's lemma, not decided

A term whose exponent tuple does not have n entries is malformed.

usage: python3 -I witness_polymaps.py items.json     items: [{"id", "kind", "n", "comps", "det", "degs", "points"}, …]
prints a JSON list: {"id", "malformed", "reason"?, "violated", "violation": {…} | null}"""
import json
import sys
from fractions import Fraction as F

PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71]


def parse(comps, n):
    polys = []
    for comp in comps:
        t = {}
        for e, c in comp:
            if not isinstance(e, list) or len(e) != n or any((not isinstance(k, int)) or k < 0 for k in e):
                raise ValueError('a term whose exponent tuple does not have %d non-negative entries' % n)
            t[tuple(e)] = t.get(tuple(e), F(0)) + F(c)
        polys.append(t)
    return polys


def ev(p, x):
    s = F(0)
    for e, c in p.items():
        m = c
        for xi, k in zip(x, e):
            if k:
                m *= xi ** k
        s += m
    return s


def dev(p, j, x):
    """∂p/∂x_j at x"""
    s = F(0)
    for e, c in p.items():
        if e[j]:
            m = c * e[j]
            for i, (xi, k) in enumerate(zip(x, e)):
                kk = k - 1 if i == j else k
                if kk:
                    m *= xi ** kk
            s += m
    return s


def det(M):
    n = len(M)
    A = [row[:] for row in M]
    d = F(1)
    for i in range(n):
        piv = next((r for r in range(i, n) if A[r][i] != 0), None)
        if piv is None:
            return F(0)
        if piv != i:
            A[i], A[piv] = A[piv], A[i]
            d = -d
        d *= A[i][i]
        for r in range(i + 1, n):
            if A[r][i]:
                f = A[r][i] / A[i][i]
                for c in range(i, n):
                    A[r][c] -= f * A[i][c]
    return d


def matmul(A, B):
    n = len(A)
    return [[sum(A[i][k] * B[k][j] for k in range(n)) for j in range(n)] for i in range(n)]


def point(n):
    return [F(1, PRIMES[i % len(PRIMES)]) for i in range(n)]


def check(it):
    n = it['n']
    polys = parse(it['comps'], n)
    pts = [[F(x) for x in p] for p in it['points']]
    if any(len(p) != n for p in pts):
        raise ValueError('a witness point without %d coordinates' % n)
    p0 = point(n)
    kind = it['kind']
    if kind == 'field':
        if len(polys) != n:
            raise ValueError('a field with %d components on R^%d' % (len(polys), n))
        J = [[dev(polys[i], j, p0) + (1 if i == j else 0) for j in range(n)] for i in range(n)]
        Pk = J
        for _ in range(n - 1):
            Pk = matmul(Pk, J)
        if any(x != 0 for row in Pk for x in row):
            return {'kind': '(JX + I)^n is not zero at p0', 'p0': [str(x) for x in p0]}
        for z in pts:
            v = [ev(p, z) for p in polys]
            if any(x != 0 for x in v):
                return {'kind': 'a printed zero is not a zero of X', 'point': [str(x) for x in z], 'X': [str(x) for x in v]}
        if len(set(tuple(z) for z in pts)) != len(pts):
            return {'kind': 'the printed zeros are not distinct'}
        return None
    if len(polys) != n:
        raise ValueError('a map with %d components on Q^%d' % (len(polys), n))
    if kind != 'keller-partial':
        J = [[dev(polys[i], j, p0) for j in range(n)] for i in range(n)]
        d = det(J)
        if d != F(it['det']):
            return {'kind': 'det JF at p0 is not the printed constant', 'p0': [str(x) for x in p0], 'detAtP0': str(d), 'printed': it['det']}
    imgs = [[ev(p, x) for p in polys] for x in pts]
    if len(set(tuple(x) for x in pts)) != len(pts):
        return {'kind': 'the printed witness points are not distinct'}
    if any(im != imgs[0] for im in imgs[1:]):
        return {'kind': 'the printed witness points do not share one image', 'images': [[str(v) for v in im] for im in imgs]}
    return None


def main():
    items = json.load(open(sys.argv[1]))
    out = []
    for it in items:
        try:
            v = check(it)
            out.append({'id': it['id'], 'malformed': False, 'violated': v is not None, 'violation': v})
        except (ValueError, TypeError, KeyError, ZeroDivisionError, IndexError) as e:
            out.append({'id': it.get('id'), 'malformed': True, 'reason': str(e)[:160], 'violated': None, 'violation': None})
    print(json.dumps(out))


if __name__ == '__main__':
    main()
