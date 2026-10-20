#!/usr/bin/env python3
# Lean: oeis_a368692_conjecture_integrality.lean -- a n = ((12n+6)! (6n+9)!) / (108 (4n+2)! (2n+3)! ((6n+5)!)^2) (Nat division); statement is the divisibility itself
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

def parts(n):
    num = factorial(12 * n + 6) * factorial(6 * n + 9)
    den = 108 * factorial(4 * n + 2) * factorial(2 * n + 3) * factorial(6 * n + 5) ** 2
    return num, den

def lean_a(n):
    num, den = parts(n)
    return num // den

checked, first = compare('A368692', lean_a, range(0, 40))
viol = [n for n in range(0, 300) if parts(n)[0] % parts(n)[1] != 0]
report(anumber='A368692', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'n': '0..299', 'divisibility_fails_at': viol[:5]})
