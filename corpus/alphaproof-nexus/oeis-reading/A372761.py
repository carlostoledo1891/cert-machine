#!/usr/bin/env python3
# Lean: oeis_372761_conjecture_2.lean -- tail(n,n-1) = (n-1) - n/(n+4); tail(n,k) = 0 if tail(n,k+1)=0 else k-(k+1)/tail(n,k+1) (3<=k<n-1); val = 1/(2-3/tail(n,3)) (n>=4), 7/11 (n=3); a n = den val
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
    return Fraction(0) if y == 0 else x / y

def lean_val(n):
    zero = False
    if n <= 2:
        return Fraction(0), zero
    if n == 3:
        v = Fraction(2) - Fraction(3, 7)
        return (Fraction(0) if v == 0 else 1 / v), zero
    t = Fraction(n - 1) - Fraction(n, n + 4)      # k = n-1
    for k in range(n - 2, 2, -1):                  # k = n-2 .. 3
        if t == 0:
            zero = True
            t = Fraction(0)                         # Lean: if tail = 0 then 0
        else:
            t = Fraction(k) - Fraction(k + 1) / t
    A3 = t
    if A3 == 0:
        zero = True
    v = Fraction(2) - qdiv(Fraction(3), A3)
    if v == 0:
        zero = True
        return Fraction(0), zero
    return 1 / v, zero

def lean_a(n):
    return 0 if n < 3 else lean_val(n)[0].denominator

NMAX = 500
vals = {n: lean_a(n) for n in range(0, NMAX + 1)}
zero_hits = [n for n in range(3, NMAX + 1) if lean_val(n)[1]]
checked, first = compare('A372761', lambda n: vals[n], range(3, NMAX + 1))
def A051403(m):
    if m == -1: return 0
    return (m + 2) * sum(factorial(k) for k in range(m + 1)) // 2
form_bad = [n for n in range(3, NMAX + 1)
            if (5 * n - 4) // gcd(5 * n - 4, A051403(n - 2) + 4 * A051403(n - 3)) != vals[n]]
def is_prime(p):
    return p >= 2 and all(p % q for q in range(2, isqrt(p) + 1))
mult = {}
for n in range(3, NMAX + 1):
    mult.setdefault(vals[n], []).append(n)
odd_primes = [p for p in range(7, 300) if is_prime(p)]
not_once = {p: mult.get(p, []) for p in odd_primes if len(mult.get(p, [])) != 1}
report(anumber='A372761', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       zero_tail_encountered_at=zero_hits[:10], formula_disagrees_at=form_bad[:5],
       statementSanity={'odd_primes_7_to_299_not_exactly_once_in_a(3..%d)' % NMAX: not_once,
                        'occurrences_of_3_and_5': {3: mult.get(3, []), 5: mult.get(5, [])}})
