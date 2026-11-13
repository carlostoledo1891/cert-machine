#!/usr/bin/env python3
"""decider_a.py — Phase 2, step 2, decider A (PREREGISTRATION.md, sealed 6f1e6d11…): the 182's IncidenceRankFourBound
on every prime p < 2000 and every c in (Z/p)^x, in integers.

  K4(c) = sum_{u,v,w units} psi(u + v + w + c/(uvw)),  psi(j) = exp(2 pi i j / p)       (romyar1/prime-gaps-lean b77bf175)
  premise: |K4(c)| <= 4 p sqrt(p) for c != 0

The sum is reduced to an EXACT exponent-count vector N(c)[k] (K4(c) = sum_k N(c)[k] zeta^k) by the multiplicative
convolution K4(c) = sum_u psi(u) K3(c/u), K3(a) = sum_v psi(v) K2(a/v), K2(b) = sum_w psi(w + b/w), done on count vectors
indexed by the discrete logarithm. Checked: every row sums to (p-1)^3; every row is symmetric (N[k] = N[p-k]), so K4(c)
is real, exactly. The reals enter only through integer tables C_k, |C_k - 2^F cos(2 pi k/p)| <= 1, proved with exact
rationals by the 186 audit's decider A (trig_tables; ours, imported by path). Then with r = sum N C and E = sum N:
  HOLDS  when (|r| + E)^2 <= 2^(2F) * 16 p^3        FAILS when |r| > E and (|r| - E)^2 > 2^(2F) * 16 p^3
F = 24 in int64 (a no-overflow bound asserted), then F = 64 in Python integers for what is left; else UNDECIDED.
The planted bounds 3 and 2 (red controls ii, iii) are decided the same way.  Usage: decider_a.py [P] [--out file]
"""
import sys, json, time, hashlib, importlib.util
import numpy as np

import os
spec = importlib.util.spec_from_file_location('pg186a', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pg186a_decide.py'))
A186 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(A186)


def primes_below(n):
    return [p for p in range(2, n) if all(p % d for d in range(2, int(p ** 0.5) + 1))]


def prim_root(p):
    if p == 2:
        return 1
    fac = [q for q in range(2, p) if (p - 1) % q == 0 and all(q % r for r in range(2, int(q ** 0.5) + 1))]
    return next(g for g in range(2, p) if all(pow(g, (p - 1) // q, p) != 1 for q in fac))


def counts(p):
    """N[i][k] for c = g^i: the exponent counts of K4(c)."""
    g, n = prim_root(p), p - 1
    pw = [pow(g, i, p) for i in range(n)]
    assert len(set(pw)) == n
    M = np.zeros((n, p), dtype=np.int64)                      # K2(g^i): #{w : w + g^i / w = k}
    for i in range(n):
        for w in range(1, p):
            M[i][(w + pw[i] * pow(w, p - 2, p)) % p] += 1
    for _ in range(2):                                        # K3, then K4: out[i][k] = sum_m M[i - m][k - g^m]
        out = np.zeros_like(M)
        for m in range(n):
            out += np.roll(np.roll(M, m, axis=0), pw[m], axis=1)
        M = out
    return pw, M


def decide(p):
    pw, N = counts(p)
    n = p - 1
    assert (N.sum(axis=1) == n ** 3).all(), 'a row does not sum to (p-1)^3'
    assert (N == N[:, (-np.arange(p)) % p]).all(), 'a row is not symmetric: the sum would not be real'
    trig = A186.trig_tables(p, [24, 64])
    C24 = np.array(trig[24][0], dtype=np.int64)
    assert int(N.max()) * int(np.abs(C24).max()) * p < 2 ** 62, 'int64 could overflow'
    R = N @ C24
    E = n ** 3
    res = {'p': p, 'instances': n, 'holds': 0, 'fails': 0, 'undecided': 0, 'fails3': 0, 'fails2': 0,
           'max_ratio': 0.0, 'argmax_c': None, 'witness3': None, 'witness2': None, 'raised': 0}
    for i in range(n):
        r, F = int(R[i]), 24
        def verdict(bound_coef, r, F):
            B = (1 << (2 * F)) * bound_coef ** 2 * p ** 3
            if (abs(r) + E) ** 2 <= B:
                return 'holds'
            if abs(r) > E and (abs(r) - E) ** 2 > B:
                return 'fails'
            return None
        v = verdict(4, r, F)
        if v is None:                                         # raise the precision for this instance
            F = 64
            r = sum(int(N[i][k]) * trig[64][0][k] for k in range(p))
            res['raised'] += 1
            v = verdict(4, r, F)
        res[v or 'undecided'] += 1
        for coef, key, wk in ((3, 'fails3', 'witness3'), (2, 'fails2', 'witness2')):
            vv = verdict(coef, r, F)
            if vv is None and F == 24:
                r64 = sum(int(N[i][k]) * trig[64][0][k] for k in range(p))
                vv = verdict(coef, r64, 64)
            if vv == 'fails':
                res[key] += 1
                res[wk] = res[wk] or {'c': pw[i], 'K4_approx': r / 2 ** F}
        res.setdefault('values', []).append([pw[i], r, F])         # per instance: c, r, F (A's value is r / 2^F within E / 2^F)
        ratio = abs(r) / 2 ** F / p ** 1.5
        if ratio > res['max_ratio']:
            res['max_ratio'], res['argmax_c'] = ratio, pw[i]
    return res


if __name__ == '__main__':
    P = int(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else 2000
    out = open(sys.argv[sys.argv.index('--out') + 1], 'w') if '--out' in sys.argv else sys.stdout
    VAL = open(sys.argv[sys.argv.index('--values') + 1], 'w') if '--values' in sys.argv else None
    t0 = time.time()
    tot = {'primes': 0, 'instances': 0, 'holds': 0, 'fails': 0, 'undecided': 0, 'fails3': 0, 'fails2': 0, 'max_ratio': 0.0}
    for p in primes_below(P):
        r = decide(p)
        vals = r.pop('values')
        if VAL: VAL.write(json.dumps({'p': p, 'E': (p - 1) ** 3, 'values': vals}) + '\n')
        out.write(json.dumps(r) + '\n'); out.flush()
        tot['primes'] += 1
        for k in ('instances', 'holds', 'fails', 'undecided', 'fails3', 'fails2'):
            tot[k] += r[k]
        if r['max_ratio'] > tot['max_ratio']:
            tot['max_ratio'], tot['at'] = r['max_ratio'], (p, r['argmax_c'])
    tot['seconds'] = round(time.time() - t0, 1)
    tot['decider_a_sha256'] = hashlib.sha256(open(__file__, 'rb').read()).hexdigest()
    out.write(json.dumps({'summary': tot}) + '\n')
