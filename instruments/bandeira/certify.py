#!/usr/bin/env python3
"""instruments/bandeira/certify.py — our OWN exact Farkas certificate for the sum-of-squares SDP (the leftT form),
found by a float search and decided by instruments/bandeira/verify.py in exact rationals.

Why: the claimant's certificate holds for the SDP written without the transpose (their 'none' convention) and not,
as published, for Helton's sum-of-squares form beta_a^T X_i beta_b. The optima of the two SDPs coincide on every case
of Lai--Lim's Table 1 (instruments/bandeira/sdp.py), but a Farkas certificate belongs to one SDP. The disproof needs
the sum-of-squares SDP to be infeasible at lambda = 120. This program finds a certificate for THAT SDP:

    fix y0 = -1; maximise t subject to  Phi_i(y) - t I  PSD  (i = 1..6),  m00(y) = y0 + y_1 <= -t,
                                        120 y0 + b^T y >= 1,   |y_w| <= B,

where Phi_i(y)[a][b] = (phi(beta_a^T X_i beta_b) + phi(beta_b^T X_i beta_a)) / 2 and phi(w) = y_w. A positive t means
the blocks are positive DEFINITE with margin, so that rounding y to rationals of bounded denominator keeps them so.
The float solution is a PROPOSER: the rounded (y0, y) is written in the format of corpus/bandeira/certificate-v2.json
and decided by verify.py --convention leftT, which is the only authority.

    python3 instruments/bandeira/certify.py --out corpus/bandeira/certificate-cm.json [--den 10000] [--solver CLARABEL|SCS]
"""
import argparse, json, sys, time
from fractions import Fraction
from itertools import permutations

import numpy as np
import cvxpy as cp
import scipy.sparse as sp

sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
import verify as V   # the exact decider; shares the enumeration of words, which is a definition, not a decision


def build_leftT(n=5, m=5):
    d = m // 2
    beta = V.words(n, d); q = len(beta)
    monos = V.words(n, 2 * d + 1); idx = {w: t for t, w in enumerate(monos)}
    ell = [{(i,): 1.0} for i in range(n)] + [{(): float(n), **{(i,): -1.0 for i in range(n)}}]
    # for each block, the symmetrised coefficient map: entry (a,b) = 1/2 (phi(T beta_a X beta_b) + phi(T beta_b X beta_a))
    # as a sparse matrix S_i of shape (q*q, 3906): Phi_i.flatten() = S_i @ y
    S = []
    for i in range(n + 1):
        rows, cols, vals = [], [], []
        for a in range(q):
            for b in range(q):
                for (x, z) in ((a, b), (b, a)):
                    bx = tuple(reversed(beta[x]))
                    for mid, c in ell[i].items():
                        w = bx + mid + beta[z]
                        rows.append(a * q + b); cols.append(idx[w]); vals.append(0.5 * c)
        S.append(sp.csr_matrix((vals, (rows, cols)), shape=(q * q, len(monos))))
    distinct = [idx[tuple(p)] for p in permutations(range(n), m)]
    return beta, monos, S, distinct


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True); ap.add_argument('--den', type=int, default=10000)
    ap.add_argument('--solver', default='CLARABEL'); ap.add_argument('--bound', type=float, default=50.0)
    a = ap.parse_args()
    t0 = time.time()
    beta, monos, S, distinct = build_leftT()
    q, N = len(beta), len(monos)
    y = cp.Variable(N); t = cp.Variable()
    y0 = -1.0
    cons = [cp.abs(y) <= a.bound, t >= 0, y0 + y[0] <= -t, 120 * y0 - cp.sum(y[distinct]) >= 1]
    for i in range(6):
        Phi = cp.reshape(S[i] @ y, (q, q), order='C')
        cons.append(Phi - t * np.eye(q) >> 0)
    prob = cp.Problem(cp.Maximize(t), cons)
    prob.solve(solver=a.solver, verbose=False)
    print('float search: status %s, t = %.6g, scalar = %.6g, m00 = %.6g (%.0f s)' % (prob.status, t.value, 120 * y0 - float(np.sum(y.value[distinct])), y0 + y.value[0], time.time() - t0), flush=True)
    yv = np.asarray(y.value).ravel()
    for den in [a.den, 10 * a.den, 100 * a.den, 1000 * a.den]:
        fr = [Fraction(float(v)).limit_denominator(den) for v in yv]
        cert = {'what': 'cert-machine\'s own Farkas certificate for the sum-of-squares SDP (leftT) at lambda = 120, found by a float search (instruments/bandeira/certify.py, %s) and rounded to denominators <= %d; decided by verify.py' % (a.solver, den),
                'y0': [-1, 1], 'y_num': [f.numerator for f in fr], 'y_den': [f.denominator for f in fr], 'denominatorBound': den, 'floatMargin': float(t.value)}
        rec = V.decide(cert, 'leftT')
        print('  den <= %d: %s (scalar %s, m00 %s, blocks %s)' % (den, rec['verdict'], rec['scalar'], rec['m00'], [b['positiveDefinite'] for b in rec['blocks']]), flush=True)
        if rec['verdict'] == 'CERTIFIED':
            json.dump(cert, open(a.out, 'w'), indent=1); open(a.out, 'a').write('\n')
            print('wrote ' + a.out)
            return 0
    print('no rounding certified; raise the margin or the denominators')
    return 1


if __name__ == '__main__':
    sys.exit(main())
