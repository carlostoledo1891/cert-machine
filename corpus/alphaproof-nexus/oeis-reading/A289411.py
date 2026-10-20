#!/usr/bin/env python3
# Lean: oeis_289411_conjecture_0.lean -- A289411 n = (sum_{k<=n} Int.sign(ds(5k) - ds(k))).toNat  [toNat truncates negatives to 0]
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
from array import array

NMAX = 10 ** 7          # covers the symmetry ranges [0, 10^k - 2] for k <= 7
DSMAX = 5 * NMAX + 1
ds = bytearray(DSMAX)
for i in range(1, DSMAX):
    ds[i] = ds[i // 10] + i % 10

S = array('q', [0]) * (NMAX + 1)    # the untruncated integer partial sums
acc = 0
for k in range(NMAX + 1):
    d = ds[5 * k] - ds[k]
    acc += (d > 0) - (d < 0)
    S[k] = acc

def lean_a(n):
    return max(S[n], 0)              # Int.toNat

checked, first = compare('A289411', lean_a, range(0, 10001))
minS = min(S)
neg_at = next((i for i in range(NMAX + 1) if S[i] < 0), None)
sym = {}
for k in range(1, 8):
    m = 10 ** k // 2 - 1
    sym[k] = all(S[m - i] == S[m + i] for i in range(m + 1))
report(anumber='A289411', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       untruncated_min_S_n_le_1e7=minS, first_negative_S=neg_at,
       statementSanity={'symmetry_on_untruncated_S_k_1_to_7': sym})
