#!/usr/bin/env python3
# Lean: oeis_248802_conjecture_0.lean and oeis_248802_conjecture_4.lean -- a n = Nat.minFac (2^(2^n+2) + 3); conj 1: a(10n+2)=67; conj 4: a(58n+26)=1399 when not covered by C1-C3
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

BOUND = 33_000_000
sieve = bytearray([1]) * (BOUND + 1)
sieve[0] = sieve[1] = 0
for i in range(2, isqrt(BOUND) + 1):
    if sieve[i]:
        sieve[i * i::i] = bytearray(len(range(i * i, BOUND + 1, i)))
primes = [i for i in range(3, BOUND + 1) if sieve[i]]   # X is odd, so 2 never divides

def divides(p, n):
    """p | 2^(2^n+2) + 3, exact; exponent reduced mod p-1 (Fermat, p odd prime)"""
    e = (pow(2, n, p - 1) + 2) % (p - 1)
    return (pow(2, e, p) + 3) % p == 0

def lean_a(n, bound=BOUND):
    """Nat.minFac of X = 2^(2^n+2)+3; exact when a prime factor <= bound exists or X <= bound^2"""
    for p in primes:
        if p > bound:
            break
        if divides(p, n):
            return p
    X_small = 2 ** n + 2 < 60 and (2 ** (2 ** n + 2) + 3) <= bound * bound
    if X_small:
        return 2 ** (2 ** n + 2) + 3   # no factor <= sqrt(X): X is prime
    return None

b = bfile('A248802')
checked, first, skipped = 0, None, []
for n in sorted(b):
    v = lean_a(n)
    if v is None:
        skipped.append(n); continue
    checked += 1
    if v != b[n]:
        first = {'index': n, 'lean': v, 'oeis': b[n]}; break

small = [p for p in primes if p < 1400]
def min_small(n):
    for p in small:
        if divides(p, n):
            return p
    return None
c1_viol = [n for n in range(0, 3000) if min_small(10 * n + 2) != 67]
def cov1(k): return (k - 2) % 10 == 0 and k >= 2
def cov2(k): return k >= 16 and (k - 16) % 36 == 0 and ((k - 16) // 36) % 5 != 1
def cov3(k): return k >= 22 and (k - 22) % 84 == 0 and ((k - 22) // 84) % 5 != 0
c4_cases = [n for n in range(0, 3000) if not (cov1(58 * n + 26) or cov2(58 * n + 26) or cov3(58 * n + 26))]
c4_viol = [n for n in c4_cases if min_small(58 * n + 26) != 1399]
report(anumber='A248802', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       skipped_indices_factor_above_bound=skipped,
       statementSanity={'conj1_n_0_to_2999_violations': c1_viol[:5],
                        'conj4_n_0_to_2999_uncovered_cases': len(c4_cases), 'conj4_violations': c4_viol[:5]})
