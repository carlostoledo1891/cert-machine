#!/usr/bin/env python3
# Lean: oeis_a300997_finite_difference_is_one_or_two.lean -- ca_step: keep ceil(m/2), pass floor(m/2) right, trim trailing zeros; a n = sInf {k : S k = replicate n 1} (a 0 = 0)
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

def ca_step(config):
    base = [(m + 1) // 2 for m in config] + [0]
    recv = [0] + [m // 2 for m in config]
    nxt = [x + y for x, y in zip(base, recv)]
    while nxt and nxt[-1] == 0:
        nxt.pop()
    return nxt

def lean_a(n, cap_factor=20):
    if n == 0:
        return 0
    target = [1] * n
    S = [n]
    for t in range(cap_factor * n + 10):
        if S == target:
            return t
        S = ca_step(S)
    raise RuntimeError('not stable within cap for n=%d (Lean sInf of empty set would be 0)' % n)

A = {n: lean_a(n) for n in range(0, 301)}
checked, first = compare('A300997', lambda n: A[n], range(1, 301))
viol = [n for n in range(1, 300) if A[n + 1] - A[n] not in (1, 2)]
report(anumber='A300997', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'n': '1..299', 'diff_not_1_or_2': viol[:5]})
