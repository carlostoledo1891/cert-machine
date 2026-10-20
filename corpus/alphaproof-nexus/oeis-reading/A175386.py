#!/usr/bin/env python3
# Lean: oeis_175386_conjecture_0.lean -- a n = den( sum_{i=1}^n C(2n-(i+1), i-1)/i ) (Nat subtraction)
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

def nsub(a, b):
    return a - b if a >= b else 0

def S(n):
    return sum((Fraction(comb(nsub(2 * n, i + 1), nsub(i, 1)), i) for i in range(1, n + 1)), Fraction(0))

def lean_a(n):
    return S(n).denominator

checked, first = compare('A175386', lean_a, range(0, 400))
integral = [n for n in range(2, 400) if lean_a(n) == 1]
report(anumber='A175386', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       note='Lean a 0 = den(empty sum) = 1 (OEIS offset 1)',
       statementSanity={'n_range': '2..399', 'n_with_integral_sum': integral})
