#!/usr/bin/env python3
# Lean: oeis_103311_conjecture_0.lean -- def a : N -> Z, a0..a3 = 0,1,1,0, a(n+4) = 3a(n+3) - 4a(n+2) + 2a(n+1) - a(n)
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

def lean_a(N):
    a = [0, 1, 1, 0]
    while len(a) < N:
        n = len(a) - 4
        a.append(3 * a[n + 3] - 4 * a[n + 2] + 2 * a[n + 1] - a[n])
    return a[:N]

A = lean_a(5000)
checked, first = compare('A103311', lambda i: A[i], range(5000))
# sanity on the statement: |a(n)| is a Fibonacci number for every computed n
fib = [0, 1]
while fib[-1] < 10 ** 1100:
    fib.append(fib[-1] + fib[-2])
fs = set(fib)
bad = [n for n in range(len(A)) if abs(A[n]) not in fs and abs(A[n]) < 10 ** 1100]
report(anumber='A103311', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'n_range': '0..4999', 'abs_not_fibonacci': bad[:5]})
