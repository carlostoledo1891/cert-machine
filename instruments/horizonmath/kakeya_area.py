"""kakeya_area.py — HorizonMath's thin-triangle Kakeya construction (arXiv 2603.15617v2, Appendix A.2), its area exactly.

Standard library only; written from the problem statement, sharing no code with HorizonMath's validator.

THE OBJECT. N = 128, d = 1/128, a_i = i/128. Triangle i has vertical cross-section
    [ (a_i + d) x + b_i - d ,  a_i x + b_i ]      for x in [0, 1],
and E is the union of the 128 triangles. The printed intercepts b_i are multiples of 1/1024 (read exactly).

THE AREA, EXACTLY. The 256 endpoint lines cross at finitely many x in (0, 1). Between two consecutive crossings
the order of all 256 endpoints is fixed, so which intervals overlap is fixed and the union's length is a linear
function of x; it is also continuous on [0, 1]. The area is therefore the sum, over consecutive crossings, of the
width times the length at the midpoint — an exact rational. At a rational x = n/m every endpoint is an integer
over 1024 m, so the union at each midpoint is merged in integers.

THE CLAIM. Area(E) = 0.1091479892... < 0.1148103258186177, the AlphaEvolve baseline the problem prints.
CERTIFIED when the exact area is below the baseline and the printed digits are its truncation or its rounding."""
import json
import os
from decimal import Decimal
from fractions import Fraction as Fr

N, UNIT = 128, 1024          # b_i = q_i / 1024; slopes i/128 = 8i/1024; d = 8/1024


def load(corpus):
    d = json.load(open(os.path.join(corpus, 'kakeya-a2-intercepts.json')))
    q = [Fr(Decimal(x)) * UNIT for x in d['intercepts']]
    if len(q) != N or any(v.denominator != 1 for v in q):
        raise ValueError('REFUSED: not 128 intercepts on the 1/1024 grid')
    return [int(v) for v in q], d


def lines(q):
    """each endpoint line as (slope, intercept) in units of 1/1024: lower (8(i+1), q_i - 8), upper (8i, q_i)"""
    return [(8 * (i + 1), q[i] - 8) for i in range(N)], [(8 * i, q[i]) for i in range(N)]


def union_length(q, x):
    """|union of the cross-sections| at rational x, exactly"""
    n, m = x.numerator, x.denominator
    iv = sorted((8 * (i + 1) * n + (q[i] - 8) * m, 8 * i * n + q[i] * m) for i in range(N))
    tot, (cl, cr) = 0, iv[0]
    for l, r in iv[1:]:
        if l <= cr:
            if r > cr:
                cr = r
        else:
            tot += cr - cl
            cl, cr = l, r
    tot += cr - cl
    return Fr(tot, UNIT * m)


def area(q):
    lo, up = lines(q)
    allL = lo + up
    xs = {Fr(0), Fr(1)}
    for a in range(len(allL)):
        s1, c1 = allL[a]
        for b in range(a + 1, len(allL)):
            s2, c2 = allL[b]
            if s1 != s2:
                x = Fr(c2 - c1, s1 - s2)
                if 0 < x < 1:
                    xs.add(x)
    xs = sorted(xs)
    A = Fr(0)
    for x0, x1 in zip(xs, xs[1:]):
        A += (x1 - x0) * union_length(q, (x0 + x1) / 2)
    return A, len(xs) - 1


def decide(corpus):
    q, d = load(corpus)
    A, pieces = area(q)
    base = Fr(Decimal(d['baseline']))
    printed = d['printedArea']                      # '0.1091479892'
    digits = len(printed.split('.')[1])
    trunc = Fr(int(A * 10 ** digits), 10 ** digits)
    rnd = Fr(round(A * 10 ** digits), 10 ** digits)
    shown = Fr(Decimal(printed))
    checks = [
        {'name': 'the area is below the printed AlphaEvolve baseline 0.1148103258186177', 'ok': A < base},
        {'name': 'the printed 0.1091479892 is the exact area\'s truncation or rounding', 'ok': shown in (trunc, rnd)},
        {'name': 'the area is at least the largest single triangle (1/256): the union is not empty or degenerate', 'ok': A >= Fr(1, 256)},
    ]
    ok = all(c['ok'] for c in checks)
    dec = Decimal(A.numerator) / Decimal(A.denominator)
    return {'claim': 'Area(E) = 0.1091479892... < 0.1148103258186177 (the AlphaEvolve baseline)',
            'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'pieces': pieces,
            'printedIs': 'its truncation' if shown == trunc else 'its rounding' if shown == rnd else 'neither',
            'area': {'num': str(A.numerator), 'den': str(A.denominator), 'decimal': str(+dec)[:24]},
            'improvement': str(+(Decimal((base - A).numerator) / Decimal((base - A).denominator)))[:14]}


if __name__ == '__main__':
    import sys
    here = os.path.dirname(os.path.abspath(__file__))
    r = decide(sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', '..', 'corpus', 'horizonmath'))
    print(json.dumps({k: v for k, v in r.items() if k != 'area'} | {'area': r['area']['decimal'], 'den_digits': len(r['area']['den'])}, indent=1))
