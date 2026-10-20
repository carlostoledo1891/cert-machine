#!/usr/bin/env python3
# Lean: oeis_307865_conjecture_0.lean -- a n = #{b in [1,2n] : (b : ZMod (2n+1))^n = -1}; IsAbsoluteEulerPseudoprime m: m>1, not prime, forall b coprime, b^((m-1)/2) = +-1
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
    m = 2 * n + 1
    if m == 1:
        return 0            # Ico 1 1 is empty
    return sum(1 for b in range(1, m) if pow(b, n, m) == m - 1)

checked, first = compare('A307865', lean_a, range(0, 1601))

def is_prime(n):
    return n >= 2 and all(n % q for q in range(2, isqrt(n) + 1))
def abs_euler_psp(m):
    if m <= 1 or is_prime(m):
        return False
    e = (m - 1) // 2
    return all(pow(b, e, m) in (1, m - 1) for b in range(1, m) if gcd(b, m) == 1)
cases = [m for m in range(3, 3203, 2) if abs_euler_psp(m)]
viol = [m for m in cases if lean_a((m - 1) // 2) != 0]
report(anumber='A307865', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'abs_euler_psp_le_3201': cases, 'violations': viol})
