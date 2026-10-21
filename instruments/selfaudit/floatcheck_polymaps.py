#!/usr/bin/env python3
"""floatcheck_polymaps.py — the self-audit's CONVENTIONAL CHECK (M5) for the polymaps family: double precision, no exact
arithmetic, a tolerance τ. The coefficients and the points become floats; det JF (or (JX + I)^n) is evaluated at one point
by float partial derivatives and float Gaussian elimination; the claim is ACCEPTED at τ when |det JF(p₀) − printed| ≤ τ
(a field: every entry of (JX(p₀) + I)^n within τ of 0), the witness points are distinct past τ and their images agree
within τ (a field: X vanishes within τ at every printed zero). Python standard library only; shares nothing with the
deciders. It measures a tolerance, not a named grader.

usage: python3 -I floatcheck_polymaps.py items.json
prints a JSON list: {"id", "score", "accept": {"1e-6": bool, "1e-9": bool, "1e-12": bool}} — or {"id", "error"}"""
import json
import sys
from fractions import Fraction

TAUS = [('1e-6', 1e-6), ('1e-9', 1e-9), ('1e-12', 1e-12)]
PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71]


def fl(s):
    return float(Fraction(str(s)))


def parse(comps, n):
    polys = []
    for comp in comps:
        t = {}
        for e, c in comp:
            if len(e) != n:
                raise ValueError('a term whose exponent tuple does not have n entries')
            t[tuple(e)] = t.get(tuple(e), 0.0) + fl(c)
        polys.append(t)
    return polys


def ev(p, x):
    s = 0.0
    for e, c in p.items():
        m = c
        for xi, k in zip(x, e):
            if k:
                m *= xi ** k
        s += m
    return s


def dev(p, j, x):
    s = 0.0
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
    d = 1.0
    for i in range(n):
        piv = max(range(i, n), key=lambda r: abs(A[r][i]))
        if A[piv][i] == 0.0:
            return 0.0
        if piv != i:
            A[i], A[piv] = A[piv], A[i]
            d = -d
        d *= A[i][i]
        for r in range(i + 1, n):
            f = A[r][i] / A[i][i]
            for c in range(i, n):
                A[r][c] -= f * A[i][c]
    return d


def matmul(A, B):
    n = len(A)
    return [[sum(A[i][k] * B[k][j] for k in range(n)) for j in range(n)] for i in range(n)]


def check(it, tau):
    n = it['n']
    polys = parse(it['comps'], n)
    pts = [[fl(x) for x in p] for p in it['points']]
    p0 = [1.0 / PRIMES[i % len(PRIMES)] for i in range(n)]
    if it['kind'] == 'field':
        J = [[dev(polys[i], j, p0) + (1.0 if i == j else 0.0) for j in range(n)] for i in range(n)]
        Pk = J
        for _ in range(n - 1):
            Pk = matmul(Pk, J)
        worst = max(abs(x) for row in Pk for x in row)
        zeros_ok = all(max(abs(ev(p, z)) for p in polys) <= tau for z in pts)
        distinct = all(max(abs(a - b) for a, b in zip(pts[i], pts[j])) > tau for i in range(len(pts)) for j in range(i + 1, len(pts)))
        return worst, worst <= tau and zeros_ok and distinct
    score = None
    ok = True
    if it['kind'] != 'keller-partial':
        d = det([[dev(polys[i], j, p0) for j in range(n)] for i in range(n)])
        score = d
        ok = abs(d - fl(it['det'])) <= tau
    imgs = [[ev(p, x) for p in polys] for x in pts]
    agree = all(max(abs(a - b) for a, b in zip(imgs[0], im)) <= tau for im in imgs[1:])
    distinct = all(max(abs(a - b) for a, b in zip(pts[i], pts[j])) > tau for i in range(len(pts)) for j in range(i + 1, len(pts)))
    return score, ok and agree and distinct


def main():
    items = json.load(open(sys.argv[1]))
    out = []
    for it in items:
        try:
            accept = {}
            score = None
            for name, tau in TAUS:
                s, ok = check(it, tau)
                score = s
                accept[name] = bool(ok)
            out.append({'id': it['id'], 'score': repr(score), 'accept': accept})
        except Exception as e:  # noqa: BLE001
            out.append({'id': it.get('id'), 'error': str(e)[:200], 'accept': {name: False for name, _ in TAUS}})
    print(json.dumps(out))


if __name__ == '__main__':
    main()
