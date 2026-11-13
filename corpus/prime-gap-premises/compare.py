#!/usr/bin/env python3
"""compare.py — Phase 2, step 2: the agreement of deciders A and B on every instance, and red control (i): for every
prime p <= 31, an independent third computation (the direct triple sum, as exact exponent counts evaluated with mpmath at
60 digits) lies inside both deciders' enclosures. Reads out/decider-a-values.jsonl and out/decider-b-values.jsonl.
Every comparison is made in exact Fractions (B's endpoints are doubles, exact as Fractions)."""
import json, sys
from fractions import Fraction as Fr
from mpmath import mp, mpf, cos, sin, pi

mp.dps = 60
A = {}
for line in open('out/decider-a-values.jsonl'):
    d = json.loads(line)
    A[d['p']] = (d['E'], {c: (r, F) for c, r, F in d['values']})
B = {}
for line in open('out/decider-b-values.jsonl'):
    d = json.loads(line)
    B[d['p']] = {v[0]: v[1:] for v in d['values']}

common = sorted(set(A) & set(B))
disjoint, compared = [], 0
for p in common:
    E, av = A[p]
    for c, (re_lo, re_hi, im_lo, im_hi) in B[p].items():
        r, F = av[c]
        alo, ahi = Fr(r - E, 2 ** F), Fr(r + E, 2 ** F)
        compared += 1
        if ahi < Fr(re_lo) or alo > Fr(re_hi) or Fr(im_lo) > 0 or Fr(im_hi) < 0:      # A's value is real (exactly)
            disjoint.append((p, c))

brute, outside = 0, []
for p in [q for q in common if q <= 31]:
    E, av = A[p]
    for c in range(1, p):
        cnt = [0] * p
        for u in range(1, p):
            for v in range(1, p):
                for w in range(1, p):
                    cnt[(u + v + w + c * pow(u * v * w % p, p - 2, p)) % p] += 1
        re = sum(n * cos(2 * pi * k / p) for k, n in enumerate(cnt))
        im = sum(n * sin(2 * pi * k / p) for k, n in enumerate(cnt))
        r, F = av[c]
        re_lo, re_hi, im_lo, im_hi = B[p][c]
        brute += 1
        okA = mpf(r - E) / 2 ** F <= re <= mpf(r + E) / 2 ** F and abs(im) < mpf(10) ** -40
        okB = mpf(re_lo) <= re <= mpf(re_hi) and mpf(im_lo) <= im <= mpf(im_hi)
        if not (okA and okB):
            outside.append((p, c, okA, okB))

print(json.dumps({'primes_compared': len(common), 'instances_compared': compared, 'disjoint': len(disjoint),
                  'first_disjoint': disjoint[:5], 'brute_instances': brute, 'brute_outside': len(outside),
                  'first_outside': outside[:5]}))
