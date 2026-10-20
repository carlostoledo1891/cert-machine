#!/usr/bin/env python3
# Lean: oeis_a237271_conjecture_2.lean -- a n = 1 + #{consecutive divisor pairs (d,d') : d' odd and d' >= 2d}; num_2_dense_sublists n = 1 + #{consecutive pairs : d' > 2d}; statement a = num_2_dense_sublists
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

def divisors(n):
    if n == 0:
        return []                    # Mathlib: Nat.divisors 0 = {}
    small, large = [], []
    i = 1
    while i * i <= n:
        if n % i == 0:
            small.append(i)
            if i != n // i:
                large.append(n // i)
        i += 1
    return small + large[::-1]

def lean_a(n):
    d = divisors(n)
    return 1 + sum(1 for x, y in zip(d, d[1:]) if y % 2 == 1 and y >= 2 * x)

def num_2_dense(n):
    d = divisors(n)
    return 1 + sum(1 for x, y in zip(d, d[1:]) if y > 2 * x)

def a379288_row_len(n):
    # odd divisors e of n, excluding e for which some divisor j has j < e < 2j
    d = divisors(n)
    return sum(1 for e in d if e % 2 == 1 and not any(j < e < 2 * j for j in d))

NMAX = 10000
checked, first = compare('A237271', lean_a, range(1, NMAX + 1))
identity_fails = [n for n in range(0, NMAX + 1) if lean_a(n) != num_2_dense(n)]
even_jumps = [n for n in range(1, NMAX + 1)
              if any(y > 2 * x and y % 2 == 0 for x, y in zip(divisors(n), divisors(n)[1:]))]
row_len_fails = [n for n in range(1, 3001) if lean_a(n) != a379288_row_len(n)]
report(anumber='A237271', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'lean_a_eq_num_2_dense_fails_n_0_to_%d' % NMAX: identity_fails[:5],
                        'n_with_an_even_jump_d_prime_gt_2d': even_jumps[:5],
                        'lean_a_vs_A379288_row_length_fails_n_le_3000': row_len_fails[:5]})
