#!/usr/bin/env python3
# Lean: oeis_341254_conjecture_0.lean -- r = (2+sqrt5)/2; a n = toNat(floor(r * floor(r n))); statement 1/4 < n r^2 - a n < 3 for n >= 1
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

def floor_r_times(m):
    # floor((2m + sqrt(5 m^2))/2), exact: sqrt(5m^2) irrational for m >= 1
    if m == 0:
        return 0
    t = isqrt(5 * m * m)
    return (2 * m + t) // 2

def lean_a(n):
    return floor_r_times(floor_r_times(n))

checked, first = compare('A341254', lean_a, range(1, 10001))
viol = []
for n in range(1, 10001):
    a = lean_a(n)
    # n r^2 = n (9 + 4 sqrt5)/4
    rhs1 = 4 * a + 1 - 9 * n          # lower: 4 n sqrt5 > rhs1
    low_ok = rhs1 < 0 or 80 * n * n > rhs1 * rhs1
    rhs2 = 4 * a + 12 - 9 * n         # upper: 4 n sqrt5 < rhs2
    up_ok = rhs2 > 0 and 80 * n * n < rhs2 * rhs2
    if not (low_ok and up_ok):
        viol.append(n)
report(anumber='A341254', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'n': '1..10000', 'violations': viol[:5]})
