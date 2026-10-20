#!/usr/bin/env python3
# Lean: oeis_282779_conjecture_0.lean -- period_of_power_mod p n = 0 if n=0 else min{T>0 : forall k, (k+T)^p % n = k^p % n}; A282779 = p=3 case
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

def period_of_power_mod(p, n):
    if n == 0:
        return 0
    # (k+T)^p mod n depends only on k mod n, so "forall k in N" = "forall k in 0..n-1"; T = n always works
    pw = [pow(k, p, n) for k in range(n)]
    for T in range(1, n + 1):
        if all(pw[(k + T) % n] == pw[k] for k in range(n)):
            return T

checked, first = compare('A282779', lambda n: period_of_power_mod(3, n), range(1, 601))
viol = []
for p in (2, 3, 5, 7, 11, 13):
    for n in range(1, 401):
        want = n // p if n % (p * p) == 0 else n
        if period_of_power_mod(p, n) != want:
            viol.append((p, n))
report(anumber='A282779', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'p': [2, 3, 5, 7, 11, 13], 'n': '1..400', 'violations': viol[:5]})
