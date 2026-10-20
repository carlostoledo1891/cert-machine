#!/usr/bin/env python3
# Lean: oeis_278070_conjecture_0.lean -- A278070 n = sum_{k<=n} C(n,k) C(pred(n+k), k) k!; statement Nat.ModEq k (A(n+k)) (A n) for all n k
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
    return sum(comb(n, k) * comb(max(n + k - 1, 0), k) * factorial(k) for k in range(n + 1))

A = [lean_a(n) for n in range(400)]
checked, first = compare('A278070', lambda n: A[n], range(400))
viol = [(n, k) for n in range(0, 120) for k in range(0, 120) if n + k < 400 and
        (A[n + k] % k if k else A[n + k]) != (A[n] % k if k else A[n])]
report(anumber='A278070', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'n_k_range': '0..119 each', 'violations': viol[:5]})
