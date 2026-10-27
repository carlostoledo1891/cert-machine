#!/usr/bin/env python3
"""Exact monochromatic-K5 density of a rational step graphon with equal block weights (independent checker).

Input: schema rational-step-graphon-v1 (m blocks, red probability R_ij / D, R symmetric, R_ii inside block i).
    c5 = ( N(R) + N(D - R) ) / (m^5 D^10),
    N(R) = sum_{i,j} R_ij tr((diag(R_i * R_j) R)^3) = sum over ordered 5-tuples of the product of the 10 pair values.
N is computed modulo primes p with m (p-1)^2 < 2^53 (float64 matrix products are then exact) and recovered by CRT;
one extra prime checks the result. Every pair (i, j) is summed; no symmetry is assumed.

usage: exact5.py construction.json[.gz]
"""
import gzip, json, sys, time
from fractions import Fraction
from math import prod, isqrt

import numpy as np


def is_prime(n):
    if n < 2: return False
    for q in range(2, isqrt(n) + 1):
        if n % q == 0: return False
    return True


def primes_below(n, k):
    out, q = [], n - 1
    while len(out) < k:
        if is_prime(q): out.append(q)
        q -= 1
    return out


def N_mod(R, p):
    m = R.shape[0]; assert m * (p - 1) ** 2 < 2 ** 53
    Rp = (R % p).astype(np.float64); tot = 0
    for i in range(m):
        U = np.fmod(Rp * Rp[i][None, :], p)              # row j: R_i * R_j  (mod p)
        for j in range(m):
            if Rp[i, j] == 0: continue
            X = np.fmod(Rp * U[j][None, :], p)           # X = R diag(u)  (mod p)
            Y = np.fmod(X @ X, p)                        # exact: entries < m p^2 < 2^53, then reduced
            t = np.fmod(np.sum(np.fmod(Y * X.T, p)), p)  # tr(X^3) mod p (products < p^2, sum < m^2 p)
            tot = (tot + int(Rp[i, j]) * int(t)) % p
    return tot


def main():
    path = sys.argv[1]
    d = json.load(gzip.open(path) if path.endswith('.gz') else open(path))
    assert d['schema'] == 'rational-step-graphon-v1'
    D = int(d['edge_probability_denominator']); R = np.array(d['red_probability_numerators'], dtype=np.int64)
    m = R.shape[0]
    assert R.shape == (m, m) and np.array_equal(R, R.T) and R.min() >= 0 and R.max() <= D
    assert len(set(Fraction(x) for x in d['block_weights'])) == 1, "equal weights only"
    B = D - R
    bound = 2 * m ** 5 * D ** 10
    P = primes_below(isqrt(2 ** 53 // m), 40); need = []
    for p in P:
        need.append(p)
        if prod(need) > 2 * bound: break
    extra = P[len(need)]
    res = []
    for p in need + [extra]:
        t0 = time.time(); r = (N_mod(R, p) + N_mod(B, p)) % p; res.append(r)
        print(f"  p={p}: {r} ({time.time()-t0:.0f}s)", flush=True)
    M = prod(need); N = 0
    for r, p in zip(res[:-1], need):
        Mi = M // p; N = (N + r * Mi * pow(Mi, -1, p)) % M
    assert 0 <= N <= bound and N % extra == res[-1], "CRT / extra-prime check failed"
    c5 = Fraction(N, m ** 5 * D ** 10)
    print(f"m={m} D={D} primes={len(need)}+1")
    print(f"c5 = {c5.numerator}/{c5.denominator}")
    print(f"c5 = {float(c5):.16f}")


if __name__ == '__main__':
    main()
