#!/usr/bin/env python3
# Lean: oeis_267581_conjecture_0.lean -- Rule 167 on Z from a single ON cell (infinite background); a n = sum_{k<=n} C(k,0) 2^(n-k); statement a n = 2a(n-1)+1-[n | 2^(n+1)] for n>=2
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

def rule167(l, c, r):
    return (167 >> (4 * l + 2 * c + r)) & 1

T = 1100
W = T + 3
cells = [0] * (2 * W + 1)   # positions -W..W, outside = background
cells[W] = 1
bg = 0
mid = [cells[W]]
for t in range(T):
    new = []
    for i in range(2 * W + 1):
        l = cells[i - 1] if i > 0 else bg
        r = cells[i + 1] if i < 2 * W else bg
        new.append(rule167(l, cells[i], r))
    bg = rule167(bg, bg, bg)
    cells = new
    mid.append(cells[W])

def lean_a(n):
    return sum(mid[k] * 2 ** (n - k) for k in range(n + 1))
A = [lean_a(n) for n in range(T)]
checked, first = compare('A267581', lambda n: A[n], range(T))
def floor_term(n):
    return 0 if n == 0 else (1 if pow(2, n + 1, n) == 0 else 0)
viol = [n for n in range(2, T) if A[n] != 2 * A[n - 1] + 1 - floor_term(n)]
report(anumber='A267581', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       background_after_t1=bg,
       statementSanity={'n_range': '2..%d' % (T - 1), 'violations': viol[:5]})
