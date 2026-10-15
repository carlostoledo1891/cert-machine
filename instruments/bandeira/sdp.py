#!/usr/bin/env python3
"""instruments/bandeira/sdp.py — Lai--Lim's SDP (Conjecture 1C, ICML 2020) built here from its definition and solved in
floating point, under each transpose convention. A FLOAT SCREEN, never a verdict: it exists to measure which SDP the
claimant's exact certificate belongs to, and whether the optimum lambda_2 of the sum-of-squares SDP proper lies above
n!/(n-m)! as the disproof needs.

The SDP (sign = -1 is lambda_2; sign = +1 is lambda_1):
    minimize lambda  subject to  lambda - sign * sum_{distinct j_1..j_m} X_{j_1}...X_{j_m}
                                 = sum_{i=1}^{n+1} sum_{a,b} (Y_i)_{ab} * T(beta_a) * X_i * beta_b,   Y_i PSD,
    X_{n+1} := n - X_1 - ... - X_n, beta the monomials of degree <= floor(m/2), the equation read coefficient by
    coefficient on every monomial of degree <= 2 floor(m/2) + 1.
The three conventions differ in T: 'leftT' reverses beta_a (Helton's sum of squares f^T l f with f = sum u_a beta_a:
f^T l f = sum u_a u_b beta_a^T l beta_b), 'rightT' reverses beta_b instead, and 'none' reverses nothing (the
convention the claimant's export states). Lai--Lim's Table 1 is the calibration: for m <= 3 the conjecture is a theorem,
so lambda_1, lambda_2 <= n!/(n-m)! must come out.

    python3 instruments/bandeira/sdp.py --m 2 --n 2 [--convention leftT|rightT|none] [--sign -1|+1] [--json out.json]
"""
import argparse, json, math, sys, time
from itertools import product, permutations

import numpy as np
import cvxpy as cp


def words(n, dmax):
    out = []
    for d in range(dmax + 1):
        out.extend(product(range(n), repeat=d))
    return out


def build(n, m, convention):
    d = m // 2
    beta = words(n, d)
    q = len(beta)
    ell = [{(i,): 1.0} for i in range(n)] + [{(): float(n), **{(i,): -1.0 for i in range(n)}}]
    monos = words(n, 2 * d + 1)
    idx = {w: t for t, w in enumerate(monos)}
    # A[i][t] is the q x q coefficient matrix of monomial t in block i: sum_{ab} Y_ab * coef_t(T(beta_a) X_i beta_b)
    A = [[np.zeros((q, q)) for _ in monos] for _ in range(n + 1)]
    for i in range(n + 1):
        for a in range(q):
            for b in range(q):
                ba = tuple(reversed(beta[a])) if convention == 'leftT' else beta[a]
                bb = tuple(reversed(beta[b])) if convention == 'rightT' else beta[b]
                for mid, c in ell[i].items():
                    w = ba + mid + bb
                    A[i][idx[w]][a, b] += c
    distinct = {tuple(p) for p in permutations(range(n), m)}
    return beta, monos, A, distinct


def solve(n, m, convention, sign, verbose=False):
    beta, monos, A, distinct = build(n, m, convention)
    q = len(beta)
    lam = cp.Variable()
    Y = [cp.Variable((q, q), symmetric=True) for _ in range(n + 1)]
    cons = [Yi >> 0 for Yi in Y]
    for t, w in enumerate(monos):
        lhs = (lam if w == () else 0) - sign * (1.0 if w in distinct else 0.0)
        rhs = sum(cp.sum(cp.multiply(A[i][t], Y[i])) for i in range(n + 1) if np.any(A[i][t]))
        cons.append(lhs == rhs)
    prob = cp.Problem(cp.Minimize(lam), cons)
    t0 = time.time()
    prob.solve(solver='SCS', eps=1e-8, max_iters=200000, verbose=verbose)
    return {'n': n, 'm': m, 'convention': convention, 'sign': sign, 'status': prob.status, 'lambda': float(prob.value) if prob.value is not None else None,
            'bound': math.factorial(n) // math.factorial(n - m), 'basis': q, 'constraints': len(monos), 'seconds': round(time.time() - t0, 1)}


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--m', type=int, required=True); ap.add_argument('--n', type=int, required=True)
    ap.add_argument('--convention', default='leftT', choices=['leftT', 'rightT', 'none'])
    ap.add_argument('--sign', type=int, default=-1); ap.add_argument('--json'); ap.add_argument('--verbose', action='store_true')
    a = ap.parse_args()
    r = solve(a.n, a.m, a.convention, a.sign, a.verbose)
    print(json.dumps(r))
    if a.json:
        json.dump(r, open(a.json, 'w'), indent=1)
