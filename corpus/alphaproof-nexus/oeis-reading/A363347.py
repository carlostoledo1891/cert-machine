#!/usr/bin/env python3
# Lean: oeis_363347_conjecture_2.lean -- R_{n-1} = (n-1) + n/4, R_k = k - (k+1)/R_{k+1} (Lean x/0 = 0), a n = |num R_2| for n >= 3 else 0
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

def qdiv(x, y):
    return Fraction(0) if y == 0 else x / y     # Lean/Mathlib: x / 0 = 0

def lean_a(n):
    if n <= 2:
        return 0, False
    R = Fraction(n - 1) + Fraction(n, 4)        # k = n-1
    zero_hit = False
    for k in range(n - 2, 1, -1):
        if R == 0:
            zero_hit = True
        R = Fraction(k) - qdiv(Fraction(k + 1), R)
    if R == 0:
        zero_hit = True
    return abs(R.numerator), zero_hit

NMAX = 500
vals = {n: lean_a(n) for n in range(0, NMAX + 1)}
checked, first = compare('A363347', lambda n: vals[n][0], range(3, NMAX + 1))
zero_hits = [n for n in vals if vals[n][1]]

# OEIS formula a(n) = (n^2+2n-4)/gcd(n^2+2n-4, 4*A051403(n-3) + n*A051403(n-4)), A051403 offset -1
def A051403(m):
    if m == -1: return 0
    return (m + 2) * sum(factorial(k) for k in range(m + 1)) // 2
form_bad = [n for n in range(3, NMAX + 1)
            if (n * n + 2 * n - 4) // gcd(n * n + 2 * n - 4, 4 * A051403(n - 3) + n * A051403(n - 4)) != vals[n][0]]
def is_prime(p):
    return p >= 2 and all(p % q for q in range(2, isqrt(p) + 1))
hit = {v[0] for v in vals.values()}
missing = [p for p in range(2, 400) if is_prime(p) and p % 10 in (1, 9) and p not in hit]
report(anumber='A363347', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       zero_denominator_encountered_at=zero_hits[:10], formula_disagrees_at=form_bad[:5],
       statementSanity={'primes_1_or_9_mod_10_below_400_missing_from_a(3..%d)' % NMAX: missing})
