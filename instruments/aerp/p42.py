#!/usr/bin/env python3
"""instruments/aerp/p42.py — Problem 42 of the AlphaEvolve repository ("sums and differences": Ruzsa's exponent), the
finite claims decided exactly.

The definition, from the pinned notebook (experiments/sums_differences_problems, commit 8f44745): for a finite set A of
distinct integers the score is g(A) = log(|A+A|/|A|) / log(|A-A|/|A|), to be maximised; the constant C = sup_A g(A) is
the least exponent with |A+A|/|A| <= (|A-A|/|A|)^C. A claim "C >= c" by an explicit finite A is decided by counting
A+A and A-A exactly and comparing: g(A) > c  iff  (|A+A|/|A|) > (|A-A|/|A|)^c, which for rational c = p/q is the
integer inequality |A+A|^q |A|^(p-q) > |A-A|^p — decided in Python integers, no logarithm.

Counting: A as a bitset (a Python integer); A+A = OR over a in A of (bits << a), A-A likewise with the reversed
bitset; popcounts are exact. Sets of 10^5 elements spanning 10^6 take seconds.

The far-block set of the claimant's certificate script is REBUILT here from its stated rule (the rule is the
definition of the set; the script itself is never run): L = 100000, h = 7/5, K = hL, q = floor(sqrt(K // 2)),
C = {0..q-1} u {K-q+1..K} u {multiples of q in [0, K]} u {K}, x = L - 3K, A = [0, L] u {c in C : c > L} u (x + C)
u {L-K, x-K+L, 2K, 2K+L, 4K-L}.
"""
import json, math, re, sys
from fractions import Fraction as F


def sumset_sizes(A):
    A = sorted(set(A)); lo = A[0]; n = len(A)
    bits = 0
    for a in A: bits |= 1 << (a - lo)
    width = A[-1] - lo + 1
    plus = 0; minus = 0
    rev = int(bin(bits)[2:].zfill(width)[::-1], 2)          # reversed bitset: bit (width-1-(a-lo)) set
    for a in A:
        plus |= bits << (a - lo)
        minus |= rev << (a - lo)
    return n, bin(plus).count('1'), bin(minus).count('1'), A[-1] - A[0]


def exceeds(sigma, delta, n, c):
    """g(A) > c exactly, for rational c = p/q > 0: (sigma/n)^q > (delta/n)^p  <=>  sigma^q n^(p-q) > delta^p."""
    c = F(c); p, q = c.numerator, c.denominator
    return sigma ** q * n ** (p - q) > delta ** p if p >= q else sigma ** q > delta ** p * n ** (q - p)


def g_float(sigma, delta, n):
    return math.log(sigma / n) / math.log(delta / n)


def far_block(L=100000, h=F(7, 5)):
    K = int(h * L); assert h * L == K
    q = max(2, math.isqrt(K // 2))
    C = set(range(0, min(q, K + 1))) | set(range(max(0, K - q + 1), K + 1)) | set(range(0, K + 1, q)) | {K}
    x = L - 3 * K
    A = set(range(0, L + 1)) | {c for c in C if c > L} | {x + c for c in C} | {L - K, x - K + L, 2 * K, 2 * K + L, 4 * K - L}
    return sorted(A), {'L': L, 'K': K, 'q': q, 'x': x, 'basisSize': len(C)}


def decide_set(A, claimed=None):
    n, s, d, diam = sumset_sizes(A)
    out = {'size': n, 'sumset': s, 'differenceSet': d, 'diameter': diam, 'g': g_float(s, d, n)}
    if claimed is not None:
        out['claimed'] = str(F(claimed)); out['exceedsClaimed'] = exceeds(s, d, n, claimed)
    return out


def parse_int_list(text):
    return [int(t) for t in re.findall(r'-?\d+', text)]


if __name__ == '__main__':
    if sys.argv[1] == 'far-block':
        A, meta = far_block(); r = decide_set(A, sys.argv[2] if len(sys.argv) > 2 else None); r.update(meta); print(json.dumps(r))
    else:
        txt = open(sys.argv[1]).read()
        body = '\n'.join(l for l in txt.splitlines() if not l.startswith('#'))
        A = parse_int_list(body); print(json.dumps(decide_set(A, sys.argv[2] if len(sys.argv) > 2 else None)))
