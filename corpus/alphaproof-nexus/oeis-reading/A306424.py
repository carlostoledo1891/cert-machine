#!/usr/bin/env python3
# Lean: oeis_306424_conjecture_0.lean -- cond k: forall b, 3<=b<k -> card(toFinset(Nat.digits b k)) <= 2; a n = Nat.nth cond n (0-indexed; cond 0 holds vacuously)
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

def digits(b, k):
    out = []
    while k:
        out.append(k % b); k //= b
    return out

def cond(k):
    for b in range(3, k):
        if len(set(digits(b, k))) > 2:
            return False
    return True

KMAX = 200000
sat = [k for k in range(0, KMAX + 1) if cond(k)]
def lean_a(n):
    return sat[n] if n < len(sat) else 0
checked, first = compare('A306424', lean_a, range(1, 24))
report(anumber='A306424', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       lean_nth_0=sat[0], satisfying_k_le_KMAX=sat, KMAX=KMAX,
       note='Lean nth is 0-indexed but cond(0) holds vacuously, so Lean a(n) = OEIS a(n) for n>=1 (offset 1)')
