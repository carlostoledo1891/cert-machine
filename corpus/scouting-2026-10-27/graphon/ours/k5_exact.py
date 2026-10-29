#!/usr/bin/env python3
"""Exact monochromatic-K5 density of a step graphon with m equal blocks.  Standard library only; no code shared
with the claimant (written from the registry definition in constants/89b.md and the data file's schema).

Definition (89b.md): C_89b is the minimum over 2-edge-coloured graphons of the density of monochromatic K5,
i.e. t(K5, W) + t(K5, 1 - W).  For a step graphon with m blocks of equal measure 1/m, red value W_ij = R_ij / D on
block pair (i, j) (diagonal included: two points in the same block see W_ii),

    t(K5, W) = (1/m^5) * sum over ORDERED 5-tuples (i1..i5) of blocks of prod_{a<b} W[i_a][i_b].

So the certificate value is  (N(R) + N(D - R)) / (m^5 * D^10)  with N(X) = sum over ordered 5-tuples of the product
of the ten X-entries.  The value is a valid upper bound on C_89b: colour K_n by assigning vertices to blocks
uniformly and edges red independently with probability W_ij; the expected monochromatic-K5 density tends to this
number, so some colouring is at most it (+o(1)), and the limit in 89b.md is a minimum.

Reduction used (NO symmetry of R assumed; an exact algebraic identity):
    N(X) = sum_{i,j} X_ij * T_X(i,j),
    T_X(i,j) = sum_{k,l,m} u_k u_l u_m X_kl X_lm X_mk,    u_k = X_ik X_jk,
because the ten pairs of (i,j,k,l,m) are ij | ik,jk | il,jl | im,jm | kl,lm,mk.
T_X(i,j) = tr((diag(u) X)^3) and only k,l,m with u_k,u_l,u_m != 0 contribute, so each trace is taken on the common
support S(i,j) = {k : X_ik X_jk != 0}.  T_X(i,j) = T_X(j,i) trivially (u is symmetric in i,j), and X is symmetric,
so N(X) = sum_i X_ii T(i,i) + 2 sum_{i<j} X_ij T(i,j).  Two independent implementations of the trace are provided:
  method A: plain nested loops over adjacency lists on S;
  method B: rows of diag(u)X packed into Python big integers (base 2^BITS), M^2 and M^3 rows by scalar*bigint sums.
Both are validated against a naive 5-nested-loop brute force on small random matrices (--selftest).
"""
import json, sys, time, random, gzip
from fractions import Fraction
from decimal import Decimal, getcontext


def load(path):
    f = gzip.open(path, 'rt') if path.endswith('.gz') else open(path)
    d = json.load(f)
    assert d['schema'] == 'rational-step-graphon-v1'
    D = int(d['edge_probability_denominator'])
    R = [[int(x) for x in row] for row in d['red_probability_numerators']]
    m = len(R)
    assert all(len(row) == m for row in R)
    assert all(R[i][j] == R[j][i] for i in range(m) for j in range(m)), 'R not symmetric'
    assert all(0 <= R[i][j] <= D for i in range(m) for j in range(m)), 'R entry outside [0, D]'
    w = [Fraction(x) for x in d['block_weights']]
    assert len(w) == m
    return D, R, w


# ---------------------------------------------------------------- method A: plain loops
def trace_cube_A(X, u_items):
    """u_items: list of (k, u_k) with u_k != 0.  Returns sum_{k,l,m} u_k u_l u_m X_kl X_lm X_mk."""
    S = [k for k, _ in u_items]
    u = dict(u_items)
    # a_k[l] = u_l * X_kl restricted to S (nonzero entries only)
    adj = {}
    for k in S:
        Xk = X[k]
        adj[k] = [(l, u[l] * Xk[l]) for l in S if Xk[l]]
    tot = 0
    for k in S:
        ak = adj[k]
        # quadratic form a_k^T X a_k over S  =  sum_{l,m} a_k[l] X_lm a_k[m]
        q = 0
        for l, al in ak:
            Xl = X[l]
            inner = 0
            for mm, am in ak:
                xm = Xl[mm]
                if xm:
                    inner += am * xm
            q += al * inner
        tot += u[k] * q
    return tot


# ---------------------------------------------------------------- method B: packed big integers
def trace_cube_B(X, u_items, BITS):
    S = [k for k, _ in u_items]
    pos = {k: p for p, k in enumerate(S)}
    mask = (1 << BITS) - 1
    Mrows = []
    P = []
    for k, uk in u_items:
        Xk = X[k]
        row = [(pos[l], uk * Xk[l]) for l in S if Xk[l]]
        Mrows.append(row)
        P.append(sum(v << (BITS * p) for p, v in row))
    Q = [sum(v * P[p] for p, v in row) for row in Mrows]        # packed rows of M^2
    tr = 0
    for pl, row in enumerate(Mrows):
        Wl = sum(v * Q[p] for p, v in row)                        # packed row l of M^3
        tr += (Wl >> (BITS * pl)) & mask
    return tr


def N_ordered(X, method, D=None, progress=None):
    m = len(X)
    nz = [[k for k in range(m) if X[i][k]] for i in range(m)]
    nzset = [set(r) for r in nz]
    if method == 'B':
        # digit bound: (M^3)_{ll'} <= s^2 * (max entry of M)^3, M_kl = u_k X_kl <= D^3  ->  s^2 D^9
        Dm = D if D is not None else max(max(r) for r in X)
        BITS = (m * m * Dm ** 9).bit_length() + 2
    total = 0
    t0 = time.time()
    for i in range(m):
        Xi = X[i]
        for j in range(i, m):
            xij = Xi[j]
            if xij == 0:
                continue
            Xj = X[j]
            u_items = [(k, Xi[k] * Xj[k]) for k in nz[i] if k in nzset[j]]
            if not u_items:
                continue
            T = trace_cube_A(X, u_items) if method == 'A' else trace_cube_B(X, u_items, BITS)
            total += xij * T if i == j else 2 * xij * T
        if progress and (i % progress == 0):
            print(f'    [{method}] row {i}/{m}  {time.time()-t0:.0f}s', file=sys.stderr, flush=True)
    return total


def N_naive(X):
    m = len(X)
    tot = 0
    rng = range(m)
    for a in rng:
        for b in rng:
            xab = X[a][b]
            if not xab: continue
            for c in rng:
                xac = xab * X[a][c] * X[b][c]
                if not xac: continue
                for d in rng:
                    xad = xac * X[a][d] * X[b][d] * X[c][d]
                    if not xad: continue
                    for e in rng:
                        tot += xad * X[a][e] * X[b][e] * X[c][e] * X[d][e]
    return tot


def density(D, R, method, progress=None):
    m = len(R)
    B = [[D - x for x in row] for row in R]
    NR = N_ordered(R, method, D, progress)
    NB = N_ordered(B, method, D, progress)
    return NR, NB, Fraction(NR + NB, m ** 5 * D ** 10)


def selftest():
    rng = random.Random(20261026)
    for trial in range(6):
        m = rng.choice([4, 5, 6, 7])
        D = rng.choice([8, 16, 1 << 20])
        R = [[0] * m for _ in range(m)]
        for i in range(m):
            for j in range(i, m):
                v = rng.choice([0, D, rng.randrange(D + 1), rng.randrange(D + 1)])
                R[i][j] = R[j][i] = v
        B = [[D - x for x in row] for row in R]
        for X in (R, B):
            nn = N_naive(X)
            na = N_ordered(X, 'A', D)
            nb = N_ordered(X, 'B', D)
            assert nn == na == nb, (trial, nn, na, nb)
        print(f'  selftest trial {trial}: m={m} D={D} naive == A == B  ok')
    print('selftest passed')


def main():
    if sys.argv[1] == '--selftest':
        selftest(); return
    path = sys.argv[1]
    method = sys.argv[2] if len(sys.argv) > 2 else 'B'
    claimed_dec = sys.argv[3] if len(sys.argv) > 3 else None
    claimed_frac = sys.argv[4] if len(sys.argv) > 4 else None
    D, R, w = load(path)
    m = len(R)
    tot_w = sum(w)
    print(f'm={m} D={D}  block weights: distinct={sorted(set(w))}  sum={tot_w}  normalised measures sum to {sum(x/tot_w for x in w)}')
    assert len(set(w)) == 1, 'this evaluator is for equal block measures (the schema in use); unequal weights not handled'
    t0 = time.process_time(); t0w = time.time()
    NR, NB, val = density(D, R, method, progress=16)
    cpu = time.process_time() - t0; wall = time.time() - t0w
    getcontext().prec = 60
    dec = Decimal(val.numerator) / Decimal(val.denominator)
    print(f'method {method}: N(R)={NR}')
    print(f'method {method}: N(D-R)={NB}')
    print(f'value = {val.numerator}/{val.denominator}')
    print(f'value = {dec:.40f}')
    print(f'cpu {cpu:.1f}s  wall {wall:.1f}s')
    if claimed_frac:
        cf = Fraction(claimed_frac)
        print(f'claimed fraction equals ours: {cf == val}')
    if claimed_dec:
        cb = Fraction(Decimal(claimed_dec))
        print(f'claimed decimal bound {claimed_dec}: value <= bound ? {val <= cb}   (bound - value = {Decimal(cb.numerator)/Decimal(cb.denominator) - dec:.3e})')
        k = len(claimed_dec.split('.')[1])
        q = Fraction(10) ** k
        import math
        up = Fraction(math.ceil(val * q), q); near = Fraction(round(val * q), q); trunc = Fraction(math.floor(val * q), q)
        how = [name for name, x in (('rounded UP', up), ('rounded to NEAREST', near), ('TRUNCATED', trunc)) if x == cb]
        print(f'claimed decimal at {k} places is: {", ".join(how) if how else "NONE of up/nearest/truncated"}')
    return val


if __name__ == '__main__':
    main()
