#!/usr/bin/env python3
"""rebuild_ramsey_a3.py — the certificate HorizonMath's Appendix A.3 prints as code, rebuilt from ramsey-a3-printed.json.

The printed proposed_solution() computes its breakpoints and its Y values in Python floats; this restates those
steps (the recipe is in the JSON, in the paper's words) and writes ramsey-a3-certificate.json, every number as the
shortest decimal string of its double — what HorizonMath's validator reads (it parses each with mpf(str(x))).
math.exp and math.log come from the platform's libm: another machine may move a Y value in its last digit.
usage: python3 corpus/horizonmath/rebuild_ramsey_a3.py [--check]"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def rebuild():
    d = json.load(open(os.path.join(HERE, 'ramsey-a3-printed.json')))
    coeffs = [float(x) for x in d['coeffs']]
    lambda0, shrink, c_hyp = float(d['lambda0']), float(d['shrink']), float(d['c_hyp'])
    M = [float(x) for x in d['M_values']]
    pts1 = [lambda0 * (50.0 ** (i / 90.0)) for i in range(91)]
    pts2 = [0.05 + 0.95 * j / 110.0 for j in range(111)]
    edges = pts1[:-1] + pts2
    bps = edges[1:-1]

    def p(l):
        s, pw = 0.0, l
        for a in coeffs:
            s += a * pw
            pw *= l
        return s

    def pd(l):
        s, pw = 0.0, 1.0
        for i, a in enumerate(coeffs, start=1):
            s += i * a * pw
            pw *= l
        return s

    def X(l, m):
        fp = math.log((1.0 + l) / l) + math.exp(-l) * (pd(l) - p(l))
        return (1.0 - math.exp(-fp)) ** (1.0 / (1.0 - m)) * (1.0 - m)

    Y = []
    for left, m in zip(edges[:-1], M):
        y_cap = min(1.0, c_hyp / X(left, m))
        Y.append((1.0 - shrink) * y_cap if y_cap < 1.0 else 1.0 - shrink)
    r = lambda v: [repr(x) for x in v]
    return {'polynomial_coeffs': r(coeffs), 'M': {'breakpoints': r(bps), 'values': r(M)}, 'Y': {'breakpoints': r(bps), 'values': r(Y)}}


if __name__ == '__main__':
    c = rebuild()
    out = os.path.join(HERE, 'ramsey-a3-certificate.json')
    if '--check' in sys.argv:
        same = json.load(open(out)) == c
        print('ramsey-a3: rebuilt certificate ' + ('identical' if same else 'DIFFERS from the file'))
        sys.exit(0 if same else 1)
    json.dump(c, open(out, 'w'), indent=1)
    open(out, 'a').write('\n')
    print('ramsey-a3: %d intervals written' % len(c['M']['values']))
