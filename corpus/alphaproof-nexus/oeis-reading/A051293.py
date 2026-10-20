#!/usr/bin/env python3
# Lean: oeis_51293_conjecture_0.lean -- A051293 n = #{S subset Icc 1 n : S nonempty and card S | sum S}
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

def lean_literal(n):
    cnt = 0
    for mask in range(1, 1 << n):
        S = [i + 1 for i in range(n) if mask >> i & 1]
        if sum(S) % len(S) == 0:
            cnt += 1
    return cnt

def lean_dp(n):
    """same count: for each size s, number of s-subsets of [1,n] with sum = 0 mod s"""
    total = 0
    for s in range(1, n + 1):
        dp = [[0] * s for _ in range(s + 1)]   # dp[c][r]
        dp[0][0] = 1
        for x in range(1, n + 1):
            xr = x % s
            for c in range(min(s, x), 0, -1):
                row, prev = dp[c], dp[c - 1]
                for r in range(s):
                    if prev[r]:
                        row[(r + xr) % s] += prev[r]
        total += dp[s][0]
    return total

lit_ok = all(lean_literal(n) == lean_dp(n) for n in range(0, 16))
checked, first = compare('A051293', lean_dp, range(1, 61))
report(anumber='A051293', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       literalEqualsDP_n_le_15=lit_ok, lean_A051293_0=lean_literal(0))
