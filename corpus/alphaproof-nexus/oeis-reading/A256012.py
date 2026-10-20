#!/usr/bin/env python3
# Lean: oeis_256012_conjecture_0.lean -- A256012 n = #{P subset {1..n} : sum P = n and every k in P is not squarefree}
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
from itertools import combinations

def squarefree(k):
    return k != 0 and all(k % (q * q) for q in range(2, isqrt(k) + 1))

def lean_literal(n):
    parts = list(range(1, n + 1))
    cnt = 0
    for mask in range(1 << n):
        P = [parts[i] for i in range(n) if mask >> i & 1]
        if sum(P) == n and all(not squarefree(k) for k in P):
            cnt += 1
    return cnt

def lean_restricted(n):
    # identical count: a subset containing a squarefree element fails the filter
    parts = [k for k in range(1, n + 1) if not squarefree(k)]
    cnt = 0
    for r in range(len(parts) + 1):
        for P in combinations(parts, r):
            if sum(P) == n:
                cnt += 1
    return cnt

def dp_counts(N):
    c = [1] + [0] * N
    for k in range(1, N + 1):
        if not squarefree(k):
            for s in range(N, k - 1, -1):
                c[s] += c[s - k]
    return c

lit_ok = all(lean_literal(n) == lean_restricted(n) for n in range(0, 17))
DP = dp_counts(3000)
dp_ok = all(DP[n] == lean_restricted(n) for n in range(0, 50))
checked, first = compare('A256012', lambda n: DP[n], range(0, 3001))
bb = bfile('A256012')
zeros_after_23 = [n for n in sorted(bb) if n > 23 and bb[n] == 0]
report(anumber='A256012', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       literalEqualsRestricted_n_le_16=lit_ok, dpEqualsRestricted_n_le_49=dp_ok,
       statementSanity={'bfile_zeros_after_23': zeros_after_23[:5], 'last_zero': max(n for n in bb if bb[n] == 0)})
