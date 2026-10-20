#!/usr/bin/env python3
# Lean: oeis_2897_conjecture_0.lean -- a n = C(2n,n)^3; statement (a n : Z) = coeff x^n y^n z^n of (1+X+Y+Z)^(2n)(1+X+Y-Z)^n(1+X-Y+Z)^n
# Exact arithmetic only (int / fractions.Fraction); no floats in the translation.
# Run: python3 -I <this file>   (reads OEIS b-files from ../oeis-data)
import os, sys, json
from fractions import Fraction
from math import comb, factorial, gcd, isqrt
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'oeis-data')

def bfile(anum):
    terms = {}
    with open(os.path.join(DATA, 'b' + anum[1:] + '.txt')) as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith('#'):
                continue
            p = s.split()
            if len(p) >= 2:
                try:
                    terms[int(p[0])] = int(p[1])
                except ValueError:
                    pass
    return terms

def compare(anum, fn, indices):
    """Compare fn(i) with the OEIS b-file value at index i (same index convention).
    Returns (number_checked, first_disagreement_or_None)."""
    b = bfile(anum)
    checked, first = 0, None
    for i in indices:
        if i not in b:
            continue
        v = fn(i)
        checked += 1
        if v != b[i]:
            first = {'index': i, 'lean': str(v)[:80], 'oeis': str(b[i])[:80]}
            break
    return checked, first

def report(**kw):
    print(json.dumps(kw))

def mul_trunc(P, Q, n):
    R = {}
    for (a, b, c), u in P.items():
        for (d, e, f), v in Q.items():
            x, y, z = a + d, b + e, c + f
            if x <= n and y <= n and z <= n:
                R[(x, y, z)] = R.get((x, y, z), 0) + u * v
    return R

def pow_trunc(P, e, n):
    R = {(0, 0, 0): 1}
    for _ in range(e):
        R = mul_trunc(R, P, n)
    return R

def coeff_Pn(n):
    p1 = {(0, 0, 0): 1, (1, 0, 0): 1, (0, 1, 0): 1, (0, 0, 1): 1}
    p2 = {(0, 0, 0): 1, (1, 0, 0): 1, (0, 1, 0): 1, (0, 0, 1): -1}
    p3 = {(0, 0, 0): 1, (1, 0, 0): 1, (0, 1, 0): -1, (0, 0, 1): 1}
    R = mul_trunc(mul_trunc(pow_trunc(p1, 2 * n, n), pow_trunc(p2, n, n), n), pow_trunc(p3, n, n), n)
    return R.get((n, n, n), 0)

def lean_a(n):
    return comb(2 * n, n) ** 3

checked, first = compare('A002897', lean_a, range(0, 100))
coef = {n: coeff_Pn(n) for n in range(0, 9)}

# Bala's first (diagonal) form: [x^n y^n z^n t^n] 1/(1 - (x+y)(1-4zt) - z - t), n <= 4
def diag(n):
    Q = {(1, 0, 0, 0): 1, (0, 1, 0, 0): 1, (0, 0, 1, 0): 1, (0, 0, 0, 1): 1, (1, 0, 1, 1): -4, (0, 1, 1, 1): -4}
    tot = 0
    R = {(0, 0, 0, 0): 1}
    for m in range(0, 4 * n + 1):
        tot += R.get((n, n, n, n), 0)
        S = {}
        for k1, u in R.items():
            for k2, v in Q.items():
                k = tuple(i + j for i, j in zip(k1, k2))
                if max(k) <= n:
                    S[k] = S.get(k, 0) + u * v
        R = S
    return tot
dg = {n: diag(n) for n in range(0, 5)}
report(anumber='A002897', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'coefficient_form_n_0_to_8_equals_a': all(coef[n] == lean_a(n) for n in coef),
                        'diagonal_form_n_0_to_4_equals_a': all(dg[n] == lean_a(n) for n in dg), 'diag': dg})
