#!/usr/bin/env python3
"""floatcheck_kissing.py — the self-audit's CONVENTIONAL CHECK (M5) for the kissing family: double precision, no exact
arithmetic, a tolerance τ. Every coordinate p + q√2 becomes a float; for every pair the cosine <x,y>/(|x||y|) is
computed in floats and the configuration is ACCEPTED at τ when every cosine is at most 1/2 + τ. A zero norm makes the
cosine undefined and the check rejects (a NaN is not at most anything). Python standard library only; shares nothing
with the deciders. It measures a tolerance, not a named grader.

usage: python3 -I floatcheck_kissing.py items.json   items: [{"id", "rows": [[[p, q], …], …]}, …]
prints a JSON list: {"id", "maxCosine", "accept": {"1e-6": bool, "1e-9": bool, "1e-12": bool}} — or {"id", "error"}"""
import json
import math
import sys

TAUS = [('1e-6', 1e-6), ('1e-9', 1e-9), ('1e-12', 1e-12)]
SQRT2 = math.sqrt(2.0)


def main():
    items = json.load(open(sys.argv[1]))
    out = []
    for it in items:
        try:
            rows = [[float(int(p)) + float(int(q)) * SQRT2 for p, q in r] for r in it['rows']]
            d = len(rows[0])
            if any(len(r) != d for r in rows):
                raise ValueError('rows of different length')
            norms = [math.sqrt(sum(x * x for x in r)) for r in rows]
            worst = -1.0
            bad = False
            n = len(rows)
            for i in range(n):
                if norms[i] == 0.0:
                    bad = True
                    break
                ri = rows[i]
                for j in range(i + 1, n):
                    if norms[j] == 0.0:
                        bad = True
                        break
                    c = sum(a * b for a, b in zip(ri, rows[j])) / (norms[i] * norms[j])
                    if c > worst:
                        worst = c
                if bad:
                    break
            if bad:
                out.append({'id': it['id'], 'maxCosine': 'undefined (a zero norm)', 'accept': {name: False for name, _ in TAUS}})
            else:
                out.append({'id': it['id'], 'maxCosine': worst, 'accept': {name: bool(worst <= 0.5 + tau) for name, tau in TAUS}})
        except Exception as e:
            out.append({'id': it.get('id'), 'error': str(e)[:200], 'accept': {name: False for name, _ in TAUS}})
    print(json.dumps(out))


if __name__ == '__main__':
    main()
