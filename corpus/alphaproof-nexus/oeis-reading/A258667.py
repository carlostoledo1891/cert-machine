#!/usr/bin/env python3
# Lean: oeis_A258667_conjecture_0.lean -- A258667 n = 0 (n<=5) else |sum_{k<n} (-1)^k (n-1-k)! sum_{j=max(0,k+5-n)}^{min(k,4)} C(8-j,j) C(2n+j-(k+10), k-j)| ; statement IsEquivalent A258667 (e^-2 n!/(n-2) (1 + sum_{k=1}^{n-1} (-1)^k/(k!(n-1)_k)))
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
from itertools import permutations
from decimal import Decimal, getcontext

def nsub(a, b):
    return a - b if a >= b else 0

def inner(n, k):
    L = nsub(k + 5, n)
    U = min(k, 4)
    return sum(comb(8 - j, j) * comb(nsub(2 * n + j, k + 10), k - j) for j in range(L, U + 1))

def lean_a(n):
    if n <= 5:
        return 0
    return abs(sum((1 if k % 2 == 0 else -1) * factorial(n - 1 - k) * inner(n, k) for k in range(n)))

checked, first = compare('A258667', lean_a, range(1, 30))

def brute(n):
    """the entry's definition: wives at even chairs 0..2n-2 (wife i at 2i), men at odd chairs;
    M (man 0) sits 9 seats clockwise from his wife (chair 9 mod 2n); count seatings of men 1..n-1
    with no man next to his wife."""
    C = 2 * n
    mchair = 9 % C
    if mchair in ((0 - 1) % C, 1):
        return 0
    chairs = [c for c in range(1, C, 2) if c != mchair]
    cnt = 0
    for perm in permutations(range(1, n)):
        if all(ch not in ((2 * m - 1) % C, (2 * m + 1) % C) for m, ch in zip(perm, chairs)):
            cnt += 1
    return cnt
brute_ok = {n: brute(n) == lean_a(n) for n in range(5, 11)}

# How much does the Lean IsEquivalent see?  delta(n) = a(n)/T(n) - 1
getcontext().prec = 120
E2 = Decimal(2).exp()
def sigma(n):
    s = Fraction(0)
    for k in range(1, n):
        ff = 1
        for i in range(k):
            ff *= (n - 1 - i)
        s += Fraction((-1) ** k, factorial(k) * ff)
    return s
def dec(fr):
    return Decimal(fr.numerator) / Decimal(fr.denominator)
def delta_A258667(n):
    T_over_e = Fraction(factorial(n), n - 2) * (1 + sigma(n))      # T(n) * e^2
    return Decimal(lean_a(n)) * E2 / dec(T_over_e) - 1
def menage(n):    # A000179, U_n
    return sum((-1) ** k * Fraction(2 * n, 2 * n - k) * comb(2 * n - k, k) * factorial(n - k) for k in range(n + 1))
def delta_menage(n):
    return dec(menage(n)) * E2 / dec(Fraction(factorial(n)) * (1 + sigma(n))) - 1
rows = []
for n in (20, 50, 100, 200, 400):
    d = delta_A258667(n)
    rows.append({'n': n, 'delta_A258667': '%.6e' % d, 'n*delta': '%.6f' % (d * n),
                 'n^4*delta': '%.4f' % (d * n ** 4),
                 'delta_menage_Riordan': '%.3e' % delta_menage(n)})
report(anumber='A258667', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       brute_force_definition_matches_formula_n_5_to_10=brute_ok, asymptotics=rows)
