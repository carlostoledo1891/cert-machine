#!/usr/bin/env python3
# Lean: A382590_conjecture_kth_prime_factor_is_eventually_periodic.lean -- pair recursion; kth_prime_factor k n = (Nat.primeFactorsList |n|)[k-1] (WITH multiplicity, ascending), 1 if too short
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

def pairs(N):
    P = [(1, 1), (2, 1)]
    while len(P) < N:
        a1, b1 = P[-1]
        a0, b0 = P[-2]
        P.append((a1 * b0 + a0 * b1, a1 * b0 - a0 * b1))
    return P

N = 31
P = pairs(N)
A = [p[0] for p in P]
Bq = [p[1] for p in P]
checked, first = compare('A382590', lambda i: A[i], range(N))

def v2(x):
    x = abs(x)
    if x == 0: return None
    c = 0
    while x % 2 == 0:
        x //= 2; c += 1
    return c

# Will Jagy's identity (MathOverflow 490330): a(k+3) = 2 a(k) b(k) (a(k+1) b(k-1) - a(k-1) b(k+1)), k >= 1
jagy = all(A[k + 3] == 2 * A[k] * Bq[k] * (A[k + 1] * Bq[k - 1] - A[k - 1] * Bq[k + 1]) for k in range(1, N - 3))

SMALL_PRIMES = [p for p in range(2, 20000) if all(p % q for q in range(2, int(p ** 0.5) + 1))]

def first_k_factors_with_mult(x, k):
    """First k prime factors of |x| with multiplicity, ascending (= Nat.primeFactorsList prefix).
    Exact trial division by primes < 20000; returns None if not determined."""
    x = abs(x); out = []
    if x <= 1:
        return []
    for p in SMALL_PRIMES:
        while x % p == 0 and len(out) < k:
            out.append(p); x //= p
        if len(out) == k or x == 1:
            return out
    # remaining cofactor has no prime factor < 20000
    if x < 20000 ** 2:
        out.append(x); return out          # cofactor is prime
    return None

def kth_lean(k, x):         # Lean: with multiplicity; 1 if fewer than k factors
    f = first_k_factors_with_mult(x, k)
    if f is None: return '?'
    return f[k - 1] if len(f) >= k else 1

def kth_distinct(k, x):     # MathOverflow reading: k-th smallest DISTINCT prime factor
    x = abs(x); out = []
    for p in SMALL_PRIMES:
        if x % p == 0:
            out.append(p)
            if len(out) == k: return p
    return '?'

rows = []
for n in range(2, N):
    rows.append({'n': n, 'v2': v2(A[n]), 'lean_k2': kth_lean(2, A[n]), 'lean_k3': kth_lean(3, A[n]),
                 'distinct_k2': kth_distinct(2, A[n]), 'distinct_k3': kth_distinct(3, A[n])})
report(anumber='A382590', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       jagyIdentity_holds_for_k_1_to_N_minus_4=jagy, table=rows)
