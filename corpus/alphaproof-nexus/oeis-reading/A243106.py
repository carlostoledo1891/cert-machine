#!/usr/bin/env python3
# Lean: oeis_243106_conjecture_0.lean -- a n = sum_{k=1}^n (if prime k then -1 else 1) 10^k; statement: all b>=5, all sign maps sigma, digits of |sum sigma_k b^k| in {0,1,b-2,b-1}
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
from itertools import product

def is_prime(n):
    return n >= 2 and all(n % q for q in range(2, isqrt(n) + 1))
def lean_a(n):
    return sum((-1 if is_prime(k) else 1) * 10 ** k for k in range(1, n + 1))
checked, first = compare('A243106', lean_a, range(1, 101))

def digits(b, x):
    out = []
    while x:
        out.append(x % b); x //= b
    return out
viol = []
for b in range(5, 13):
    for n in range(0, 11):
        for sig in product((1, -1), repeat=n):
            x = sum(s * b ** (k + 1) for k, s in enumerate(sig))
            if any(d not in (0, 1, b - 2, b - 1) for d in digits(b, abs(x))):
                viol.append((b, sig))
report(anumber='A243106', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'bases': '5..12', 'n': '0..10 (all sign patterns)', 'violations': viol[:3]},
       note='the theorem statement does not use the defined a at all')
