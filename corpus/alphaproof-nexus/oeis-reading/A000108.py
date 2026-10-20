#!/usr/bin/env python3
# Lean: oeis_108_conjecture_2.lean -- a n = choose(2n,n)/(n+1) (Nat division); index cond 1<=k, min 2 k <= j <= k; frac parts distinct
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

def lean_a(n):
    return comb(2 * n, n) // (n + 1)

inexact = [n for n in range(1001) if comb(2 * n, n) % (n + 1) != 0]
checked, first = compare('A000108', lean_a, range(1001))

def cond(j, k):
    return 1 <= k and min(2, k) <= j and j <= k

K = 45
fr = {}
for k in range(0, K + 1):
    for j in range(0, k + 1):
        if cond(j, k):
            s = sum(Fraction(1, lean_a(i)) for i in range(j, k + 1))
            fr[(j, k)] = s - (s.numerator // s.denominator)
vals = list(fr.values())
report(anumber='A000108', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       natDivisionInexactAt=inexact,
       statementSanity={'pairs_k_le': K, 'pairs': len(vals), 'distinct_fractional_parts': len(set(vals)) == len(vals)})
