#!/usr/bin/env python3
"""Exact monochromatic-K4 density of a rational step graphon with uniform block weights.

Input (schema rational-step-graphon-v1): m blocks of equal weight, red probability R_ij / D between
blocks i and j (R symmetric, 0 <= R_ij <= D, R_ii is the density inside block i). The limit density is
    c4 = ( sum_i tr((diag(R_i) R)^3) + sum_i tr((diag(B_i) B)^3) ) / (m^4 D^6),   B = D - R,
since tr((diag(R_i) R)^3) = sum_{j,k,l} R_ij R_ik R_il R_jk R_jl R_kl.
The integer numerator is computed modulo primes p < 1.5e6 with float64 matrix products, which are exact
because every dot product is below m p^2 < 2^53; the primes are combined by CRT. Every block i is
summed (no symmetry is assumed). A final consistency check uses one extra prime.

usage: exact_eval.py construction.json.gz [threads]   (prints the exact fraction and a decimal enclosure)
"""
import gzip, json, os, sys, time
from fractions import Fraction
from math import prod

import numpy as np

def _primes_below(n, k):
    out, q = [], n - 1
    while len(out) < k:
        if is_prime(q): out.append(q)
        q -= 1
    return out


def is_prime(n):
    if n < 2: return False
    i = 2
    while i * i <= n:
        if n % i == 0: return False
        i += 1
    return True


def numerator_mod(R, p):
    m = R.shape[0]
    assert m * (p - 1) ** 2 < 2 ** 53
    Rp = (R % p).astype(np.float64)
    tot = 0
    for i in range(m):
        X = Rp * Rp[i][:, None]                 # X_jk = R_ij R_jk  (mod p after reduction)
        X = np.fmod(X, p)
        Y = np.fmod(X @ X, p)                    # exact: entries < m p^2 < 2^53
        t = np.fmod(np.sum(np.fmod(Y * X.T, p)), p)  # tr(X^3) = sum_jk Y_jk X_kj
        tot = (tot + int(t)) % p
    return tot


def crt(residues, primes):
    M = prod(primes); x = 0
    for r, p in zip(residues, primes):
        Mi = M // p; x = (x + r * Mi * pow(Mi, -1, p)) % M
    return x, M


def main():
    d = json.load(gzip.open(sys.argv[1]) if sys.argv[1].endswith('.gz') else open(sys.argv[1]))
    assert d['schema'] == 'rational-step-graphon-v1'
    D = int(d['edge_probability_denominator'])
    R = np.array(d['red_probability_numerators'], dtype=np.int64)
    w = d['block_weights']
    m = R.shape[0]
    assert R.shape == (m, m) and np.array_equal(R, R.T) and R.min() >= 0 and R.max() <= D
    assert len(set(Fraction(x) for x in w)) == 1, "uniform weights only"
    B = D - R
    # size of the exact numerator: at most 2 m^4 D^6
    bound = 2 * m ** 4 * D ** 6
    need = []
    PRIMES = _primes_below(1500000, 16)
    for p in PRIMES:
        need.append(p)
        if prod(need) > 2 * bound: break
    extra = [p for p in PRIMES if p not in need][0]
    res = []
    for p in need + [extra]:
        t0 = time.time()
        r = (numerator_mod(R, p) + numerator_mod(B, p)) % p
        res.append(r)
        print(f"  p={p}: residue {r}  ({time.time() - t0:.0f}s)", flush=True)
    N, M = crt(res[:-1], need)
    assert 0 <= N <= bound
    assert N % extra == res[-1], "extra-prime check failed"
    c4 = Fraction(N, m ** 4 * D ** 6)
    print(f"m={m} D={D} primes={len(need)}+1 check")
    print(f"c4 = {c4.numerator}/{c4.denominator}")
    print(f"c4 = {float(c4):.15f}  (exact value lies in [{float(c4)-1e-17:.17f}, {float(c4)+1e-17:.17f}])")


if __name__ == '__main__':
    main()
