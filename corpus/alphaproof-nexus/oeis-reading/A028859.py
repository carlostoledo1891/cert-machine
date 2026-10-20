#!/usr/bin/env python3
# Lean: oeis_A028859_conjecture_1.lean -- a0=1, a1=3, a(n+2)=2a(n+1)+2a(n); statement: card of S (length n+1 normal sequences, non-adjacent parts weakly decreasing) = a n
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
    a = [1, 3]
    while len(a) < N:
        a.append(2 * a[-1] + 2 * a[-2])
    return a

A = lean_a(1001)
checked, first = compare('A028859', lambda i: A[i], range(1001))

def count_S(n):
    """Literal count of the Lean set S for this n: sigma : Fin (n+1) -> N, all > 0,
    every k in [1, max] attained, and for i < j with j != i+1, sigma i >= sigma j.
    Values above L cannot occur (covering [1,max] needs max <= L)."""
    L = n + 1
    cnt = 0
    seq = []
    def dfs():
        nonlocal cnt
        j = len(seq)
        if j == L:
            mx = max(seq)
            if set(seq) >= set(range(1, mx + 1)):
                cnt += 1
            return
        for v in range(1, L + 1):
            if all(seq[i] >= v for i in range(0, j - 1)):
                seq.append(v)
                dfs()
                seq.pop()
    dfs()
    return cnt

brute = {n: count_S(n) for n in range(0, 9)}
report(anumber='A028859', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'card_S_n_0_to_8': brute, 'equals_a_n': all(brute[n] == A[n] for n in brute)})
