#!/usr/bin/env python3
# Lean: oeis_323557_conjecture_0.lean -- a m = sum_{n<=m} sum_{k<=n} [n(k+1)<=m, (n+1)|m-n(k+1)] (-1)^j C(n,k) C(n+j,j)
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

def lean_a(m):
    s = 0
    for n in range(m + 1):
        for k in range(n + 1):
            e = n * (k + 1)
            if e <= m:
                r = m - e
                if r % (n + 1) == 0:
                    j = r // (n + 1)
                    sign = 1 if j % 2 == 0 else -1
                    s += sign * comb(n, k) * comb(n + j, j)
            else:
                break
    return s

NMAX = 1500
checked, first = compare('A323557', lean_a, range(NMAX + 1))
bb = bfile('A323557')
pron = {k * (k + 1) for k in range(200)}
odd_off = [N for N in sorted(bb) if bb[N] % 2 != 0 and N not in pron]
report(anumber='A323557', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'bfile_range': '0..%d' % max(bb), 'odd_terms_off_n(n+1)': odd_off[:5]})
