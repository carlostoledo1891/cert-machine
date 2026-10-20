#!/usr/bin/env python3
# Lean: A224515_conjecture_existence.lean -- A224515 n = sInf {k | Nat.xor (k^2) ((k+1)^2) = (2n+1)^2}; statement: forall n, exists k, xor(k^2,(k+1)^2) = (2n+1)^2
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

K = 3_000_000           # scan k = 0..K-1; sInf = first k found in increasing order
best = {}
for k in range(K):
    v = (k * k) ^ ((k + 1) * (k + 1))
    r = isqrt(v)
    if r * r == v:      # v is odd, so r is odd: r = 2n+1
        n = (r - 1) // 2
        if n not in best:
            best[n] = k

b = bfile('A224515')
checked, first, unresolved = 0, None, []
for n in sorted(b):
    if n in best:
        checked += 1
        if best[n] != b[n]:
            first = {'index': n, 'lean': best[n], 'oeis': b[n]}
            break
    elif b[n] < K:      # OEIS witness below the scan bound but scan found none -> disagreement
        first = {'index': n, 'lean': 'none below %d' % K, 'oeis': b[n]}
        break
    else:
        unresolved.append(n)
report(anumber='A224515', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       unresolved_beyond_scan=unresolved[:10], scanBound=K,
       note='b-file n range %d..%d; min OEIS value %d (no -1 entries)' % (min(b), max(b), min(b.values())))
