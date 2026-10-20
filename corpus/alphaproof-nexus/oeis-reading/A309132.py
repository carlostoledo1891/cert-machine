#!/usr/bin/env python3
# Lean: A309132_conjecture_carmichael.lean -- a 0 = 0; a n = den(B(n-1).num/n + B(n-1).den/n^2), Mathlib bernoulli (B1 = -1/2)
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

NMAX = 420
B = [Fraction(1)]
for m in range(1, NMAX):
    if m >= 3 and m % 2 == 1:
        B.append(Fraction(0))
        continue
    s = sum(comb(m + 1, k) * B[k] for k in range(m))
    B.append(-s / (m + 1))
assert B[1] == Fraction(-1, 2)

def lean_a(n):
    if n == 0:
        return 0
    Bn = B[n - 1]
    F = Fraction(Bn.numerator) / n + Fraction(Bn.denominator) / (n * n)
    return F.denominator

checked, first = compare('A309132', lean_a, range(1, NMAX + 1))

# statement sanity on the b-file range: (composite and squarefree(a n)) <-> Carmichael
def is_prime(n):
    if n < 2: return False
    i = 2
    while i * i <= n:
        if n % i == 0: return False
        i += 1
    return True
def factor(n):
    f, p = {}, 2
    while p * p <= n:
        while n % p == 0:
            f[p] = f.get(p, 0) + 1; n //= p
        p += 1
    if n > 1: f[n] = f.get(n, 0) + 1
    return f
def carmichael(n):  # Korselt: composite, squarefree, p-1 | n-1
    if n < 3 or is_prime(n): return False
    f = factor(n)
    return all(e == 1 for e in f.values()) and all((n - 1) % (p - 1) == 0 for p in f)
bb = bfile('A309132')
viol = []
for n in sorted(bb):
    lhs = (n > 1 and not is_prime(n)) and all(e == 1 for e in factor(bb[n]).values())
    if lhs != carmichael(n):
        viol.append(n)
report(anumber='A309132', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'range': '1..%d (b-file values)' % max(bb), 'iff_violations': viol[:10],
                        'carmichael_in_range': [n for n in sorted(bb) if carmichael(n)]})
