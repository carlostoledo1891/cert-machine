#!/usr/bin/env python3
"""
Exact character decomposition of the D.2 system for mu=3.
d(x, y) = chi(x) * g(y + x)  (char 2), g(D)=0 unless chi(D)=+1.
Under this ansatz the equations (D.1)(D.2) become independent of a
and involve only the differences W, W'.
"""
import itertools
from collections import Counter

def all_matrices(mu):
    nbits = mu * mu
    return [tuple(tuple(bits[i*mu:(i+1)*mu]) for i in range(mu))
            for bits in itertools.product([0, 1], repeat=nbits)]

def mat_to_vec(A):
    return tuple(x for row in A for x in row)

def vec_to_mat(v, mu):
    return tuple(tuple(v[i*mu + j] for j in range(mu)) for i in range(mu))

def mat_add(A, B):
    mu = len(A)
    return tuple(tuple((A[i][j] + B[i][j]) % 2 for j in range(mu)) for i in range(mu))

def rank_rect(mat):
    rows = [list(r) for r in mat]
    nr, nc = len(rows), len(rows[0])
    rank = 0
    used = [False] * nr
    for c in range(nc):
        piv = next((r for r in range(nr) if not used[r] and rows[r][c] == 1), None)
        if piv is None:
            continue
        used[piv] = True
        rank += 1
        for r in range(nr):
            if r != piv and rows[r][c] == 1:
                for k in range(nc):
                    rows[r][k] ^= rows[piv][k]
    return rank

def mat_rank_f2(A):
    return rank_rect(A)

def spaces_independent(A, B):
    mu = len(A)
    rA = mat_rank_f2(A)
    rB = mat_rank_f2(B)
    if rA == 0 or rB == 0:
        return False
    M = [list(A[r]) + list(B[r]) for r in range(mu)]
    if rank_rect(M) != rA + rB:
        return False
    AT = [[A[c][r] for c in range(mu)] for r in range(mu)]
    BT = [[B[c][r] for c in range(mu)] for r in range(mu)]
    MT = [AT[r] + BT[r] for r in range(mu)]
    return rank_rect(MT) == rA + rB

def dot_f2(u, v):
    return sum(a & b for a, b in zip(u, v)) & 1

def chi_val(b_vec, x_vec):
    return 1 if dot_f2(b_vec, x_vec) == 0 else -1

def sparse_rank_mod(equations, p):
    pivots = {}
    rank = 0
    for eq in equations:
        e = {c: (v % p) for c, v in eq.items() if (v % p) != 0}
        if not e:
            continue
        while True:
            found = next((c for c in e if c in pivots), None)
            if found is None:
                break
            piv = pivots[found]
            inv = pow(piv[found], p - 2, p)
            factor = e[found] * inv % p
            for pc, pv in list(piv.items()):
                nv = (e.get(pc, 0) - factor * pv) % p
                if nv == 0:
                    e.pop(pc, None)
                else:
                    e[pc] = nv
            if not e:
                break
        if not e:
            continue
        pc = min(e.keys())
        inv = pow(e[pc], p - 2, p)
        pivots[pc] = {c: (v * inv) % p for c, v in e.items()}
        rank += 1
    return rank

def process_character(b_vec, mats, mat_idx, trans):
    # variables: nonzero D with chi(D)=+1
    D_to_var = {}
    for D_idx, D in enumerate(mats):
        if D_idx == 0:
            continue
        if chi_val(b_vec, mat_to_vec(D)) == 1:
            D_to_var[D_idx] = len(D_to_var)
    nvars = len(D_to_var)
    if nvars == 0:
        return 0, 0, 0
    equations = []
    def add_term(eq, D_idx, coeff):
        if D_idx == 0 or D_idx not in D_to_var:
            return
        v = D_to_var[D_idx]
        eq[v] = eq.get(v, 0) + coeff
    for wi, wj in trans:
        W = mats[wi]
        Wp = mats[wj]
        Wsum = mat_add(W, Wp)
        iW, iWp, iSum = wi, wj, mat_idx[Wsum]
        cW = chi_val(b_vec, mat_to_vec(W))
        cWp = chi_val(b_vec, mat_to_vec(Wp))
        # From (D.1) simplified: (chi(W') - 1) g(W) = 0
        # i.e. if chi(Wp)==-1 then g(W)=0 (when W is a variable)
        if cWp == -1 and iW in D_to_var:
            eq = {D_to_var[iW]: 1}
            equations.append(eq)
        if cW == -1 and iWp in D_to_var:
            eq = {D_to_var[iWp]: 1}
            equations.append(eq)
        # From (D.2) simplified:
        # (chi(W) + 1) g(W+W') - 2 g(W) - 2 g(W') = 0
        eq = {}
        add_term(eq, iSum, cW + 1)
        add_term(eq, iW, -2)
        add_term(eq, iWp, -2)
        if any(eq.values()):
            equations.append(eq)
    # Also the symmetric (D.1) already covered by swapping W,W'
    # Rank over two primes
    r1 = sparse_rank_mod(equations, 1000000007)
    r2 = sparse_rank_mod(equations, 1000000009)
    if r1 != r2:
        raise RuntimeError(f"rank mismatch {r1} vs {r2} for character")
    return nvars, r1, nvars - r1

def main(mu=3):
    print(f"===== mu = {mu} =====", flush=True)
    mats = all_matrices(mu)
    n = len(mats)
    mat_idx = {m: i for i, m in enumerate(mats)}
    ranks_m = [mat_rank_f2(m) for m in mats]
    print("finding transversal...", flush=True)
    trans = [(i, j) for i in range(n) if ranks_m[i] > 0
             for j in range(n) if ranks_m[j] > 0 and spaces_independent(mats[i], mats[j])]
    print(f"transversal: {len(trans)}", flush=True)
    nullity_by_brank = Counter()
    null_dist = Counter()
    total_nullity = 0
    count = 0
    for b_bits in itertools.product([0, 1], repeat=mu*mu):
        b_vec = b_bits
        b_mat = vec_to_mat(b_vec, mu)
        br = mat_rank_f2(b_mat)
        nvars, rank, nullity = process_character(b_vec, mats, mat_idx, trans)
        nullity_by_brank[br] += nullity
        null_dist[nullity] += 1
        total_nullity += nullity
        count += 1
        if count % 64 == 0:
            print(f"  {count}/{n} total_nullity={total_nullity}", flush=True)
    print("\nBy rank of the character label b:")
    for r in sorted(nullity_by_brank):
        nchar = sum(1 for bits in itertools.product([0,1], repeat=mu*mu)
                    if mat_rank_f2(vec_to_mat(bits, mu)) == r)
        print(f"  rank(b)={r}: {nchar} characters, summed nullity = {nullity_by_brank[r]}")
    print(f"\nTotal dimension (sum of nullities) = {total_nullity}")
    print("Nullity per character distribution:")
    for k in sorted(null_dist):
        print(f"  nullity {k}: {null_dist[k]} characters")
    # trivial
    zero = tuple(0 for _ in range(mu*mu))
    nv, rk, nu = process_character(zero, mats, mat_idx, trans)
    print(f"\nTrivial character: nvars={nv}, rank={rk}, nullity={nu}")

if __name__ == '__main__':
    main(3)
