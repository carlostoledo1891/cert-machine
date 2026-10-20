#!/usr/bin/env python3
# Lean: oeis_271591_conjecture_0.lean -- T = tribonacci (0,0,1,...); a n = 0 if T<=1 else testBit T (log2 T - 1); is_maximal_run requires a(n+L) != v (run must end)
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

N = 10001
T = [0, 0, 1]
while len(T) < N + 5:
    T.append(T[-1] + T[-2] + T[-3])

def lean_a(n):
    t = T[n]
    if t <= 1:
        return 0
    j = t.bit_length() - 1 - 1      # Nat.log2 t - 1
    return (t >> j) & 1

A = [lean_a(n) for n in range(N + 5)]
checked, first = compare('A271591', lambda n: A[n], range(4, N + 1))
# maximal runs as in the Lean predicate: start n >= 2, a(n-1) != v, ends with a(n+L) != v
runs = {0: set(), 1: set()}
n = 2
while n < N:
    v = A[n]
    if A[n - 1] != v:
        L = 0
        while n + L < N + 5 and A[n + L] == v:
            L += 1
        if n + L < N + 5:
            runs[v].add(L)
        n += max(L, 1)
    else:
        n += 1
report(anumber='A271591', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       lean_a_0_to_5=A[:6],
       statementSanity={'n_le': N, 'zero_run_lengths': sorted(runs[0]), 'one_run_lengths': sorted(runs[1])})
