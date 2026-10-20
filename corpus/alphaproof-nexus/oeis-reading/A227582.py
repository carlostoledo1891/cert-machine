#!/usr/bin/env python3
# Lean: oeis_227582_conjecture_0.lean -- LinearRecurrence.mkSol, coeffs ![1,-2,1,0,0,-1,2], init ![2,7,14,23,35,50,67]; a n = (base (n-1)).toNat for n>0
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

coeffs = [1, -2, 1, 0, 0, -1, 2]
init = [2, 7, 14, 23, 35, 50, 67]
order = 7

def base_list(N):
    # Mathlib: mkSol init n = if n < order then init n else sum_i coeffs i * mkSol (n - order + i)
    u = list(init)
    while len(u) < N:
        n = len(u)
        u.append(sum(coeffs[i] * u[n - order + i] for i in range(order)))
    return u

U = base_list(1100)
def lean_a(n):
    return max(U[n - 1], 0) if n > 0 else 0
checked, first = compare('A227582', lean_a, range(1, 1100))

# statement sanity, exact: floor(1/(2H(n) - H(n^2+n-1) - g)) with g bracketed by rationals
g_lo = Fraction(5772156649015328606065120900824024310421, 10 ** 40)
g_hi = g_lo + Fraction(1, 10 ** 40)
H = [Fraction(0)]
for i in range(1, 30 * 30 + 30):
    H.append(H[-1] + Fraction(1, i))
res = {}
for n in range(1, 30):
    x_hi = 2 * H[n] - H[n * n + n - 1] - g_lo
    x_lo = 2 * H[n] - H[n * n + n - 1] - g_hi
    if x_lo > 0:
        f1 = (1 / x_hi).numerator // (1 / x_hi).denominator
        f2 = (1 / x_lo).numerator // (1 / x_lo).denominator
        res[n] = 'ok' if f1 == f2 == lean_a(n) else ('undecided' if f1 != f2 else 'MISMATCH')
    else:
        res[n] = 'x<=0?'
report(anumber='A227582', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'n_1_to_29': sorted(set(res.values()))})
