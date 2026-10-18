#!/usr/bin/env python3
"""instruments/optq/autocorr.py — the registry's C_1c and C_1d step-function constants, decided exactly by direct sums
(standard library: Fraction and int; no product trick, every lag summed term by term).

1c (registry 1c, Barnard–Steinerberger): the smallest C with min_{0<=t<=1} ∫ f(x) f(x+t) dx <= C (∫f)^2 for every
non-negative f. A step function f = Σ w_i 1[i/K, (i+1)/K) with w_i >= 0 has an autocorrelation that is linear between
consecutive multiples of 1/K, so its minimum over [0, 1] is a value at t = k/K, k = 0..K, where it equals
(1/K) Σ_i w_i w_{i+k}; with ∫f = Σ w_i / K the function shows C_1c >= K · min_{0<=k<=K} Σ_i w_i w_{i+k} / (Σ w_i)^2.
A LOWER bound: the claim holds iff the value is >= the bound.

1d (registry 1d, the signed third autocorrelation): the largest C with max_t |(f*f)(t)| >= C (∫f)^2 for every real f
supported on [-1/4, 1/4]. A step function with n cells of width h = 1/(2n) and signed values v_i has f*f piecewise
linear with knots at multiples of h, where it equals h Σ_{i+j=m} v_i v_j, so the function shows
C_1d <= 2n · max_m |Σ_{i+j=m} v_i v_j| / (Σ v_i)^2. An UPPER bound: the claim holds iff the value is <= the bound.

Heights given as JSON numbers are read as the doubles they denote (Fraction(float) is exact); "p/q" strings as fractions.

usage: python3 -I instruments/optq/autocorr.py 1c|1d construction.json claimed ['{"index": i, "value": "p/q"}']
       (1c: {"K": K, "weights_int": [...]}; 1d: {"values": [...]})
"""
import json
import sys
from fractions import Fraction as F


def heights(raw):
    return [F(x) if isinstance(x, str) else F(x) for x in raw]


def decimal(x, k=30):
    sgn = '-' if x < 0 else ''
    x = abs(x)
    ip = x.numerator // x.denominator
    frac = (x - ip) * 10 ** k
    return '%s%d.%0*d' % (sgn, ip, k, frac.numerator // frac.denominator)


def decide_1c(K, w, claim):
    if any(x < 0 for x in w):
        return {'verdict': 'REFUSED', 'why': 'a negative weight'}
    S = sum(w)
    if S == 0:
        return {'verdict': 'REFUSED', 'why': 'the integral is zero'}
    n = len(w)
    best, at = None, None
    for k in range(K + 1):
        c = sum(w[i] * w[i + k] for i in range(n - k)) if k < n else 0
        if best is None or c < best:
            best, at = c, k
    value = F(K, 1) * best / (S * S)
    return {'verdict': 'CERTIFIED' if value >= claim else 'REFUTED', 'value': value, 'at': at}


def decide_1d(v, claim):
    n = len(v)
    S = sum(v)
    if S == 0:
        return {'verdict': 'REFUSED', 'why': 'the integral is zero'}
    conv = [F(0)] * (2 * n - 1)
    for i in range(n):
        if v[i]:
            for j in range(n):
                conv[i + j] += v[i] * v[j]
    m = max(range(len(conv)), key=lambda k: abs(conv[k]))
    value = 2 * n * abs(conv[m]) / (S * S)
    return {'verdict': 'CERTIFIED' if value <= claim else 'REFUTED', 'value': value, 'at': m}


if __name__ == '__main__':
    kind, path, claim = sys.argv[1], sys.argv[2], F(sys.argv[3])
    mutate = json.loads(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] != 'null' else None
    obj = json.load(open(path))
    vals = heights(obj['weights_int'] if kind == '1c' else obj['values'])
    if mutate:
        i = mutate['index']
        vals[i] = F(mutate['value']) if 'value' in mutate else vals[i] * mutate['scale']
    r = decide_1c(int(obj['K']), vals, claim) if kind == '1c' else decide_1d(vals, claim)
    if 'value' in r:
        r['valueDecimal'] = decimal(r['value'])
        r['value'] = '%d/%d' % (r['value'].numerator, r['value'].denominator)
    print(json.dumps(r))
