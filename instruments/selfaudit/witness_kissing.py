#!/usr/bin/env python3
"""witness_kissing.py — the self-audit's WITNESS for the kissing family: Python standard library, exact in Z[√2],
no code from this repository (it shares nothing with instruments/kissing/kissing.js). Written from the claim as the
ledger states it: n nonzero direction vectors in R^d with every pairwise angle at least 60°, i.e. for every pair

        <x,y> <= 0   or   4 <x,y>^2 <= <x,x> <y,y>,

coordinates p + q√2 with integers p, q; the sign of a + b√2 by the classical two-case test (a^2 = 2b^2 with (a,b) ≠ 0
is impossible and raises). A violation is a zero row (not a direction) or a pair at less than 60°; the first one is
printed with the exact inner product and the two norms. Rows of unequal length are malformed.

usage: python3 -I witness_kissing.py items.json     items: [{"id", "rows": [[[p, q], …], …]}, …]  (p, q decimal strings)
prints a JSON list: {"id", "malformed", "reason"?, "violated", "violation": {…} | null}"""
import json
import sys


def sign(a, b):
    if a == 0 and b == 0:
        return 0
    if a >= 0 and b >= 0:
        return 1
    if a <= 0 and b <= 0:
        return -1
    t = a * a - 2 * b * b
    if t == 0:
        raise ArithmeticError('a^2 = 2b^2 with (a, b) != 0')
    return 1 if (a > 0) == (t > 0) else -1


def mul(u, v):
    return (u[0] * v[0] + 2 * u[1] * v[1], u[0] * v[1] + u[1] * v[0])


def dot(x, y):
    a = 0
    b = 0
    for (p1, q1), (p2, q2) in zip(x, y):
        a += p1 * p2 + 2 * q1 * q2
        b += p1 * q2 + q1 * p2
    return (a, b)


def check(rows):
    if not rows:
        return {'malformed': True, 'reason': 'empty configuration'}
    d = len(rows[0])
    for i, r in enumerate(rows):
        if len(r) != d:
            return {'malformed': True, 'reason': 'row %d has %d coordinates, row 0 has %d' % (i, len(r), d)}
    norms = [dot(r, r) for r in rows]
    for i, N in enumerate(norms):
        if sign(*N) <= 0:
            return {'malformed': False, 'violated': True, 'violation': {'kind': 'zero row', 'row': i}}
    n = len(rows)
    for i in range(n):
        xi = rows[i]
        Ni = norms[i]
        for j in range(i + 1, n):
            s = dot(xi, rows[j])
            if sign(*s) <= 0:
                continue
            s2 = mul(s, s)
            NN = mul(Ni, norms[j])
            slack = (NN[0] - 4 * s2[0], NN[1] - 4 * s2[1])
            if sign(*slack) < 0:
                return {'malformed': False, 'violated': True, 'violation': {'kind': 'pair at less than 60 degrees', 'i': i, 'j': j, 'dot': [str(s[0]), str(s[1])], 'normI': [str(Ni[0]), str(Ni[1])], 'normJ': [str(norms[j][0]), str(norms[j][1])], 'slack': [str(slack[0]), str(slack[1])]}}
    return {'malformed': False, 'violated': False, 'violation': None}


def main():
    items = json.load(open(sys.argv[1]))
    out = []
    for it in items:
        try:
            rows = [[(int(p), int(q)) for p, q in r] for r in it['rows']]
        except (KeyError, TypeError, ValueError) as e:
            out.append({'id': it.get('id'), 'malformed': True, 'reason': 'unreadable: %s' % e, 'violated': None, 'violation': None})
            continue
        res = check(rows)
        res['id'] = it['id']
        if res['malformed']:
            res.setdefault('violated', None)
            res.setdefault('violation', None)
        out.append(res)
    print(json.dumps(out))


if __name__ == '__main__':
    main()
