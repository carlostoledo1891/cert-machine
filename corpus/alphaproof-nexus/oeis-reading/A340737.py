#!/usr/bin/env python3
# Lean: oeis_340737_conjecture_0.lean -- A340737 / A340738: N-valued, a0=0, a1,a2 = 3,5 (1,2); even n: toNat(((n+2)/2) a(n-1) - a(n-2) - ((n-2)/2) a(n-3)); odd n: 2a(n-1) + n a(n-2)
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

def lean_seq(a1, a2, N):
    a = [0, a1, a2]
    truncations = []
    for n in range(3, N):
        if n % 2 == 0:
            c1, c2 = (n + 2) // 2, (n - 2) // 2
            v = c1 * a[n - 1] - a[n - 2] - c2 * a[n - 3]
            if v < 0:
                truncations.append(n)
            a.append(max(v, 0))      # Int.toNat
        else:
            a.append(2 * a[n - 1] + n * a[n - 2])
    return a, truncations

N = 740
A, trA = lean_seq(3, 5, N)
Bq, trB = lean_seq(1, 2, N)
cA, fA = compare('A340737', lambda i: A[i], range(1, N))
cB, fB = compare('A340738', lambda i: Bq[i], range(1, N))
# sanity: |A/B - e| with e bracketed by exact rationals
K = 400
e_lo = sum(Fraction(1, factorial(k)) for k in range(K))
e_hi = e_lo + Fraction(2, factorial(K))
def err_bound(n):
    q = Fraction(A[n], Bq[n])
    return max(abs(q - e_lo), abs(q - e_hi))
def log10_upper(x):
    return len(str(x.denominator)) - len(str(x.numerator))
errs = {n: '<=1e-%d' % (log10_upper(err_bound(n)) - 1) for n in (10, 50, 100, 300, 600)}
report(anumber='A340737', termsChecked=cA, termsAgree=fA is None, firstDisagreement=fA,
       A340738_termsChecked=cB, A340738_termsAgree=fB is None, A340738_firstDisagreement=fB,
       toNat_truncations=trA + trB, statementSanity={'abs(A/B - e)': errs})
