#!/usr/bin/env python3
# Lean: oeis_113254_conjecture_0.lean -- a0..a3 = -1,4,176,3136; a(n'+4) = -4a(n'+3) + 256a(n'+1) + 4096a(n')
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

def lean_a(N):
    a = [-1, 4, 176, 3136]
    while len(a) < N:
        n = len(a) - 4
        a.append(-4 * a[n + 3] + 256 * a[n + 1] + 4096 * a[n])
    return a

A = lean_a(1001)
checked, first = compare('A113254', lambda i: A[i], range(1001))
nonsq = [n for n in range(500) if not (A[2 * n + 1] >= 0 and isqrt(A[2 * n + 1]) ** 2 == A[2 * n + 1])]
# the family conjecture is over all m; check a few other m (m = 2..12) as context
def fam(m, N):
    a = [-1, 4, -13 + 6 * (m - 1) + 3 * (m - 1) ** 2, (-8 + m * m) ** 2]
    while len(a) < N:
        n = len(a) - 4
        a.append(m ** 4 * a[n] + (2 * m) ** 2 * a[n + 1] - 4 * a[n + 3])
    return a
fam_nonsq = {}
for m in range(1, 13):
    a = fam(m, 81)
    fam_nonsq[m] = [n for n in range(40) if not (a[2 * n + 1] >= 0 and isqrt(a[2 * n + 1]) ** 2 == a[2 * n + 1])][:3]
report(anumber='A113254', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'odd_index_nonsquares_n_lt_500': nonsq, 'family_m_1_to_12_first_nonsquare_n': fam_nonsq})
