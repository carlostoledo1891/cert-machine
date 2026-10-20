#!/usr/bin/env python3
# Lean: oeis_a211417_conjecture_specific.lean -- a n = ((30n)! n!) / ((15n)! (10n)! (6n)!) (Nat division); statement (30n - 1 : Z) | a n
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
    num = factorial(30 * n) * factorial(n)
    den = factorial(15 * n) * factorial(10 * n) * factorial(6 * n)
    return num // den, num % den

inexact = [n for n in range(0, 60) if lean_a(n)[1] != 0]
checked, first = compare('A211417', lambda n: lean_a(n)[0], range(0, 60))
viol = [n for n in range(0, 200) if lean_a(n)[0] % (30 * n - 1) != 0]
report(anumber='A211417', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       natDivisionInexactAt=inexact, statementSanity={'n': '0..199', 'violations': viol[:5]})
