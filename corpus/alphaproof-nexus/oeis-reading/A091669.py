#!/usr/bin/env python3
# Lean: a091669_conjecture_primitive_root.lean -- a 0 = 0; a n = (2^(n-1) * prod_{k=1}^{n-1}(2^k-1)) / n! (Nat division)
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
    if n == 0:
        return 0
    num = 2 ** (n - 1)
    for k in range(1, n):
        num *= (2 ** k - 1)
    return num // factorial(n), num % factorial(n)

inexact = [n for n in range(1, 400) if lean_a(n)[1] != 0]
checked, first = compare('A091669', lambda i: lean_a(i)[0], range(1, 400))

def is_prime(n):
    if n < 2: return False
    i = 2
    while i * i <= n:
        if n % i == 0: return False
        i += 1
    return True
def two_is_primitive_root(p):
    x, o = 2 % p, 1
    while x != 1:
        x = x * 2 % p; o += 1
    return o == p - 1
viol = []
hyp_true = []
for n in range(3, 400):
    if (lean_a(n - 1)[0] + 2 ** (n - 2)) % n == 0:
        hyp_true.append(n)
        if not (is_prime(n) and two_is_primitive_root(n)):
            viol.append(n)
report(anumber='A091669', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       natDivisionInexactAt=inexact,
       statementSanity={'n_range': '3..399', 'violations': viol, 'hypothesis_holds_count': len(hyp_true)})
