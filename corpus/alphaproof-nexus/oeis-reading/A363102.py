#!/usr/bin/env python3
# Lean: oeis_a363102_conjecture_1.lean -- a n = (n^2-2) / gcd(n^2-2, 2*a051403(n-3) + n*a051403(n-4)) with Nat subtraction; a051403 m = ((m+2) * sum_{k<=m} k!)/2 -- the OEIS FORMULA, not the continued fraction
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

# exact prefix sums of factorials (computed incrementally)
FS = []
s, f = 0, 1
for k in range(0, 10010):
    if k > 0:
        f *= k
    s += f
    FS.append(s)

def a051403(m):
    return ((m + 2) * FS[m]) // 2

def nsub(a, b):
    return a - b if a >= b else 0

def lean_a(n):
    num = nsub(n ** 2, 2)
    d = 2 * a051403(nsub(n, 3)) + n * a051403(nsub(n, 4))
    g = gcd(num, d)
    return num // g if g else 0

checked, first = compare('A363102', lean_a, range(3, 10003))

# the sequence's own definition: denominator of 1/(2-3/(3-4/(...(n-1)-n/(-2))))
def cf_den(n):
    R = Fraction(n - 1) - Fraction(n, -2)
    for k in range(n - 2, 1, -1):
        if R == 0:
            return None
        R = Fraction(k) - Fraction(k + 1) / R
    if R == 0:
        return None
    return (1 / R).denominator
CFMAX = 700
cf_vs_formula = [n for n in range(3, CFMAX + 1) if cf_den(n) != lean_a(n)]
def is_prime(p):
    return p >= 2 and all(p % q for q in range(2, isqrt(p) + 1))
bb = bfile('A363102')
nonprime = [n for n in sorted(bb) if not (bb[n] == 1 or is_prime(bb[n]))]
report(anumber='A363102', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       cf_definition_vs_lean_formula_range='3..%d' % CFMAX, cf_vs_formula_disagree_at=cf_vs_formula[:5],
       nat_sub_note='n=3: Lean uses a051403(0)=1 where OEIS formula has A051403(-1)=0; a(3)=7 either way',
       statementSanity={'bfile_terms_neither_1_nor_prime': nonprime[:5]})
