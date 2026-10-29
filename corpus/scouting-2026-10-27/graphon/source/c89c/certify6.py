#!/usr/bin/env python3
"""Exact K6 multiplicity of the weight-class step graphon on Z_2^10 with red probabilities n_w / D (w = 0..10).

Runs a modular evaluator (c6 exact, or the independent check6) for enough 61-bit primes to exceed the numerator
bound 2 * 1024^5 * D^15, plus one extra prime as a check, and combines them by CRT.
c6 = N / (1024^5 D^15).   usage: certify6.py {c6|check6} D n0 .. n10
"""
import subprocess, sys
from fractions import Fraction
from math import prod


def is_prime(n):
    if n < 2: return False
    for q in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        if n % q == 0: return n == q
    d, s = n - 1, 0
    while d % 2 == 0: d //= 2; s += 1
    for a in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        x = pow(a, d, n)
        if x in (1, n - 1): continue
        for _ in range(s - 1):
            x = x * x % n
            if x == n - 1: break
        else: return False
    return True


prog, D, ns = sys.argv[1], int(sys.argv[2]), [int(x) for x in sys.argv[3:14]]
bound = 2 * 1024 ** 5 * D ** 15
primes, q = [], (1 << 61) - 1
while prod(primes) <= 2 * bound or len(primes) < 2:
    if is_prime(q): primes.append(q)
    q -= 2
q2 = primes[-1] - 2
while not is_prime(q2): q2 -= 2
res = []
for p in primes + [q2]:
    cmd = ['./c6', 'exact', str(D)] + [str(x) for x in ns] + [str(p)] if prog == 'c6' else ['./check6', str(D)] + [str(x) for x in ns] + [str(p)]
    res.append(int(subprocess.run(cmd, capture_output=True, text=True).stdout))
M = prod(primes); N = 0
for r, p in zip(res[:-1], primes):
    Mi = M // p; N = (N + r * Mi * pow(Mi, -1, p)) % M
assert N <= bound and N % q2 == res[-1], "CRT / check-prime mismatch"
c6 = Fraction(N, 1024 ** 5 * D ** 15)
print(f"{prog}: primes={len(primes)}+1  N={N}")
print(f"c6 = {c6.numerator}/{c6.denominator}")
print(f"c6 = {float(c6):.18e}   c6*2^14 = {float(c6 * 2**14):.15f}")
