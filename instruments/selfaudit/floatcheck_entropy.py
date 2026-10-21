#!/usr/bin/env python3
"""floatcheck_entropy.py — the self-audit's CONVENTIONAL CHECK (M5) for the entropy family: double precision, no exact
arithmetic, a tolerance τ. The weights become floats, the entropies are Σ −p ln p with math.log, the ratio is a float, and
the claim C ≥ bar is ACCEPTED at τ when ratio ≥ bar − τ. For the truth table the Walsh–Hadamard transform is taken in
integers (it is exact there) and H = Σ w log2(1/w) in floats; the claim is accepted when H/(I − 1) > bar − τ. A law whose
weights do not sum to 1 within τ is rejected. Python standard library only; shares nothing with the deciders.

usage: python3 -I floatcheck_entropy.py items.json
prints a JSON list: {"id", "score", "accept": {"1e-6": bool, "1e-9": bool, "1e-12": bool}} — or {"id", "error"}"""
import json
import math
import re
import sys
from fractions import Fraction

TAUS = [('1e-6', 1e-6), ('1e-9', 1e-9), ('1e-12', 1e-12)]
FORMS = {'3b': [(1, 0), (0, 1), (1, 1)], '3c': [(1, 0), (0, 1), (1, 1), (1, 2)]}


def law_of(cert):
    prob = re.sub(r'^c_?', '', str(cert.get('problem', '')).lower())
    fl = lambda n, q: float(Fraction(int(n), int(q)))   # the nearest double to the exact weight, whatever its size
    if 'weights' in cert:
        rows = [(w['x'], w['y'], fl(w['num'], w['den'])) for w in cert['weights']]
    elif 'distribution_x_y_numden' in cert:
        rows = [(x, y, fl(n, q)) for x, y, (n, q) in cert['distribution_x_y_numden']]
    else:
        k = int(str(cert['denominator']).split('^')[1])
        rows = [(x, y, fl(n, 10 ** k)) for x, y, n in cert['distribution_x_y_num']]
    return prob, rows


def entropy(rows, form):
    a, b = form
    g = {}
    for x, y, w in rows:
        g[a * x + b * y] = g.get(a * x + b * y, 0.0) + w
    return -sum(p * math.log(p) for p in g.values() if p > 0)


def sumdiff(it, tau):
    prob, rows = law_of(it['cert'])
    s = sum(w for _, _, w in rows)
    ok = abs(s - 1.0) <= tau and all(w > 0 for _, _, w in rows)
    ratio = entropy(rows, (1, -1)) / max(entropy(rows, f) for f in FORMS[prob])
    return ratio, ok


def wht(t):
    a = list(t)
    h = 1
    n = len(a)
    while h < n:
        for i in range(0, n, 2 * h):
            for j in range(i, i + h):
                x, y = a[j], a[j + h]
                a[j], a[j + h] = x + y, x - y
        h *= 2
    return a


def fei(it, tau):
    art = it['art']
    n = int(art['n'])
    full = int(str(art['true_hex']), 16)
    N = 1 << n
    if full >> N:
        raise ValueError('a bit beyond 2^n')
    t = [-1 if (full >> x) & 1 else 1 for x in range(N)]
    a = wht(t)
    N4 = float(4 ** n)
    I = sum(v * v * bin(S).count('1') for S, v in enumerate(a)) / N4
    H = 0.0
    for v in a:
        if v:
            w = v * v / N4
            H += w * math.log2(1.0 / w)
    ok = abs(a[0]) <= tau * N and I > 1
    return H / (I - 1), ok


def main():
    items = json.load(open(sys.argv[1]))
    out = []
    for it in items:
        try:
            accept = {}
            score = None
            for name, tau in TAUS:
                s, ok = sumdiff(it, tau) if it['kind'] == 'sumdiff' else fei(it, tau)
                score = s
                accept[name] = bool(ok and s >= float(it['claim']) - tau)
            out.append({'id': it['id'], 'score': repr(score), 'accept': accept})
        except Exception as e:  # noqa: BLE001
            out.append({'id': it.get('id'), 'error': str(e)[:200], 'accept': {name: False for name, _ in TAUS}})
    print(json.dumps(out))


if __name__ == '__main__':
    main()
