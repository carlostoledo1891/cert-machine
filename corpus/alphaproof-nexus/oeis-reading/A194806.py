#!/usr/bin/env python3
# Lean: oeis_194806_conjecture_0.lean -- a 0 = 0; a n = min |S| over S subset [1,n] with [1,n] subset S*S (S*S includes squares)
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

def covers(S, n):
    prods = {x * y for x in S for y in S}
    return all(t in prods for t in range(1, n + 1))

def lean_a_literal(n):
    """literal: smallest size of a subset of [1,n] whose product set contains [1,n]"""
    if n == 0:
        return 0
    T = list(range(1, n + 1))
    for s in range(1, n + 1):
        for S in combinations(T, s):
            if covers(S, n):
                return s

def lean_a_fast(n):
    """same minimum, searching only supersets of {1} u primes<=n: every valid S contains them
    (1 = x*y forces 1 in S; a prime p = x*y forces p or 1... p in S since x,y <= n are 1 and p)"""
    if n == 0:
        return 0
    primes = [p for p in range(2, n + 1) if all(p % q for q in range(2, isqrt(p) + 1))]
    base = [1] + primes
    rest = [x for x in range(2, n + 1) if x not in primes]
    for extra in range(0, len(rest) + 1):
        for E in combinations(rest, extra):
            if covers(base + list(E), n):
                return len(base) + extra

lit = {n: lean_a_literal(n) for n in range(0, 15)}
fast_ok = all(lean_a_fast(n) == lit[n] for n in lit)
checked, first = compare('A194806', lambda n: lit[n] if n in lit else lean_a_fast(n), range(1, 41))
report(anumber='A194806', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       note='n<=14 by literal exhaustive search; n=15..40 by search over supersets of {1}+primes (validated equal on n<=14)',
       fastEqualsLiteral=fast_ok)
