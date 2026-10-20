#!/usr/bin/env python3
# Lean: oeis_62567_conjecture_0.lean -- reverse_nat k = ofDigits 10 (digits 10 k).reverse; a 0 = 0; a n = (least k>0 with n | reverse(k n)) * n, or 0 if none
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

def reverse_nat(k):
    return int(str(k)[::-1]) if k > 0 else 0

def lean_a(n, kmax=30_000_000):
    if n == 0:
        return 0
    if n % 10 == 0:
        # n | reverse(kn) would need reverse(kn) = 0 mod 10, but reverse(kn) ends in the leading
        # digit of kn, which is nonzero: no k exists, so Lean returns 0
        return 0
    m = n
    for k in range(1, kmax + 1):
        if reverse_nat(m) % n == 0:
            return m
        m += n
    raise RuntimeError('no k <= kmax for n=%d' % n)

checked, first = compare('A062567', lean_a, range(1, 60))
inst = {}
for e in (2, 3, 4, 5):
    v = lean_a(3 ** e)
    inst[e] = {'a(3^n)': v, 'equals_10^(3^(n-2))-1': v == 10 ** (3 ** (e - 2)) - 1}
report(anumber='A062567', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'instances': inst})
