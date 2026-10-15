#!/usr/bin/env python3
"""instruments/optq/stepfun.py — the two step-function constants of the optimization-constants registry (1a, the
autocorrelation constant; 1b, Erdős's minimum overlap), decided EXACTLY for step functions with tens of thousands of
steps (standard library; the products are exact integer multiplications by Kronecker substitution).

1a (registry 1a, EinsteinArena's C1): f >= 0 a step function on [-1/4, 1/4] with n equal steps of width dx = 1/(2n)
and rational heights f_i; the autoconvolution f*f is piecewise linear with breakpoints at multiples of dx, so
sup (f*f) is attained at a grid shift: sup (f*f) / (∫f)^2 = 2n · max_k Σ_i a_i a_{k-i} / (Σ a_i)^2 with a_i = f_i D
integers over one denominator D. An upper bound for C_1a (the infimum over f).

1b (registry 1b): h a step function on [0, 2] with n equal steps, 0 <= h <= 1, ∫h = 1 (Σ h_i = n/2 exactly); g = 1 - h
on [0, 2], both zero outside; the score sup_s ∫ h(x) g(x+s) dx = (2/n) · max_lag Σ_i a_{i+lag} (D - a_i) / D^2 over
all lags, attained at a grid shift by the same piecewise-linearity. An upper bound for C_1b.

The integer products: the sequences are packed into one big integer each in base 2^K with K chosen so that every
coefficient of the product (<= n · max^2) is below 2^K; Python multiplies the two big integers exactly; the
coefficients are unpacked. No float anywhere; the maximum is taken over every lag.

usage: python3 -I instruments/optq/stepfun.py 1a construction.json [claimed]
       python3 -I instruments/optq/stepfun.py 1b construction.json [claimed]
       (construction.json: {"values": ["num/den", ...]})
"""
import json, math, sys
from fractions import Fraction as F


def read_values(obj):
    vals = obj['values'] if isinstance(obj, dict) else obj
    return [F(v) if isinstance(v, str) else F(v) for v in vals]


def common_denominator(vals):
    D = 1
    for v in vals: D = D * v.denominator // math.gcd(D, v.denominator)
    return D, [int(v * D) for v in vals]


def product_coefficients(a, b):
    """The coefficients of (Σ a_i x^i)(Σ b_j x^j), a_i, b_j >= 0 integers, by Kronecker substitution."""
    n, m = len(a), len(b)
    if not a or not b: return []
    bound = min(n, m) * max(a) * max(b) + 1
    K = max(1, bound.bit_length())
    A = 0
    for i in range(n - 1, -1, -1): A = (A << K) | a[i]
    B = 0
    for j in range(m - 1, -1, -1): B = (B << K) | b[j]
    P = A * B
    mask = (1 << K) - 1
    out = []
    for k in range(n + m - 1):
        out.append(P & mask); P >>= K
    if P != 0: raise ArithmeticError('leftover bits: the packing bound was wrong')
    return out


def autocorrelation_1a(vals):
    n = len(vals)
    if any(v < 0 for v in vals): return {'n': n, 'admissible': False, 'why': 'a negative height'}
    D, a = common_denominator(vals)
    S = sum(a)
    if S == 0: return {'n': n, 'admissible': False, 'why': 'the integral is zero'}
    conv = product_coefficients(a, a)
    best = max(conv); k = conv.index(best)
    value = F(2 * n * best, S * S)
    return {'n': n, 'admissible': True, 'value': value, 'argmaxLag': k, 'integral': F(S, 2 * n * D), 'denominatorDigits': len(str(D)) - 1}


def overlap_1b(vals):
    n = len(vals)
    if any(v < 0 or v > 1 for v in vals): return {'n': n, 'admissible': False, 'why': 'a height outside [0, 1]'}
    s = sum(vals)
    if s != F(n, 2): return {'n': n, 'admissible': False, 'why': 'Σh ≠ n/2 exactly (slack %s)' % (s - F(n, 2))}
    D, a = common_denominator(vals)
    b = [D - x for x in reversed(a)]                  # correlation with g = 1 - h via the reversed complement
    corr = product_coefficients(a, b)
    best = max(corr); k = corr.index(best)
    value = F(2 * best, n * D * D)
    return {'n': n, 'admissible': True, 'value': value, 'lagInBins': k - (n - 1), 'mass': F(2, n) * s}


def decide(kind, vals, claimed=None):
    r = autocorrelation_1a(vals) if kind == '1a' else overlap_1b(vals)
    if not r['admissible']: r['verdict'] = 'REFUSED'; return r
    r['valueDecimal'] = decimal(r['value'], 30)
    if claimed is not None:
        c = F(claimed); r['claimed'] = str(c)
        # the claim is an upper bound "C <= claimed" exhibited by this function: it holds iff value <= claimed
        r['verdict'] = 'CERTIFIED' if r['value'] <= c else 'REFUTED'
        r['slack'] = str(c - r['value'])
    r['value'] = str(r['value'])
    for k in ('integral', 'mass'):
        if k in r: r[k] = str(r[k])
    return r


def decimal(x, k):
    sgn = '-' if x < 0 else ''; x = abs(x)
    ip = x.numerator // x.denominator; rem = x - ip
    digs = ''.join(str((rem * 10 ** (i + 1)).numerator // (rem * 10 ** (i + 1)).denominator % 10) for i in range(k))
    return '%s%d.%s' % (sgn, ip, digs)


if __name__ == '__main__':
    kind, path = sys.argv[1], sys.argv[2]
    vals = read_values(json.load(open(path)))
    print(json.dumps(decide(kind, vals, sys.argv[3] if len(sys.argv) > 3 else None)))
