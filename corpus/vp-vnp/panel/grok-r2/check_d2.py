#!/usr/bin/env python3
"""
Exact linear-algebra check of Theorem D.2 Steps 3-7.
Unknowns d(x,y) for x != y, symmetric, d(x,x)=0.
Equations from transversal pairs: (D.1) and (D.2).
Compute dimension of solution space over Q for mu=2 and mu=3,
and whether for mu=3 it is spanned by rk(x-y).
"""
import itertools
from sympy import Matrix, QQ, Integer, zeros, eye

def all_matrices(mu):
    """All mu x mu matrices over F2, as tuples of tuples of 0/1."""
    n = mu * mu
    mats = []
    for bits in itertools.product([0, 1], repeat=n):
        mat = tuple(tuple(bits[i*mu:(i+1)*mu]) for i in range(mu))
        mats.append(mat)
    return mats

def mat_add(A, B):
    mu = len(A)
    return tuple(tuple((A[i][j] + B[i][j]) % 2 for j in range(mu)) for i in range(mu))

def mat_rank_f2(A):
    """Rank of matrix over F2."""
    mu = len(A)
    # Gaussian elimination
    rows = [list(r) for r in A]
    rank = 0
    col = 0
    for r in range(mu):
        # find pivot
        pivot = None
        for i in range(r, mu):
            if rows[i][col] == 1:
                pivot = i
                break
            # try next cols? better standard
        # simpler: full elimination
    # redo properly
    A = [list(row) for row in A]
    rank = 0
    used = [False]*mu
    for c in range(mu):
        # find pivot row
        piv = None
        for r in range(mu):
            if not used[r] and A[r][c] == 1:
                piv = r
                break
        if piv is None:
            continue
        used[piv] = True
        rank += 1
        # eliminate
        for r in range(mu):
            if r != piv and A[r][c] == 1:
                for k in range(mu):
                    A[r][k] = (A[r][k] + A[piv][k]) % 2
    return rank

def col_space(A):
    """Column space as a frozenset of basis vectors (tuples), or the span dimension via rank of columns.
    For independence we need the actual space. Represent as the set of linear combinations? 
    Better: return the row-reduced basis of the column space as a frozenset of tuples."""
    mu = len(A)
    # columns
    cols = [[A[r][c] for r in range(mu)] for c in range(mu)]
    # row reduce the matrix whose rows are the columns (i.e. transpose)
    return mat_rank_f2(tuple(tuple(cols[c]) for c in range(mu)))  # just rank for now

def spaces_independent(A, B):
    """Column spaces independent and row spaces independent, both nonzero.
    Column spaces independent means rank([A|B]) = rank(A)+rank(B).
    Same for rows (i.e. for A^T, B^T)."""
    mu = len(A)
    rA = mat_rank_f2(A)
    rB = mat_rank_f2(B)
    if rA == 0 or rB == 0:
        return False
    # concatenated columns
    concat_cols = tuple(tuple(A[r][c] for c in range(mu)) + tuple(B[r][c] for c in range(mu)) for r in range(mu))
    # better matrix with columns of A then B
    M = []
    for r in range(mu):
        row = list(A[r]) + list(B[r])
        M.append(tuple(row))
    # rank of this (mu x 2mu) matrix
    # implement rank for rectangular
    def rank_rect(mat):
        rows = [list(r) for r in mat]
        nr = len(rows)
        nc = len(rows[0])
        rank = 0
        used_row = [False]*nr
        for c in range(nc):
            piv = None
            for r in range(nr):
                if not used_row[r] and rows[r][c] == 1:
                    piv = r
                    break
            if piv is None:
                continue
            used_row[piv] = True
            rank += 1
            for r in range(nr):
                if r != piv and rows[r][c] == 1:
                    for k in range(nc):
                        rows[r][k] = (rows[r][k] + rows[piv][k]) % 2
        return rank
    rAB = rank_rect(M)
    if rAB != rA + rB:
        return False
    # rows: transpose
    AT = tuple(tuple(A[c][r] for c in range(mu)) for r in range(mu))
    BT = tuple(tuple(B[c][r] for c in range(mu)) for r in range(mu))
    MT = []
    for r in range(mu):
        row = list(AT[r]) + list(BT[r])
        MT.append(tuple(row))
    rATr = rank_rect(MT)
    return rATr == rA + rB

def pair_index(i, j, n):
    """Index of unordered pair {i,j} with i < j, in 0..binom(n,2)-1."""
    if i > j:
        i, j = j, i
    # number of pairs with smaller min
    # pairs (a,b) a<b, index = a*(2n-a-1)/2 + (b-a-1) or standard
    return i*(2*n - i - 1)//2 + (j - i - 1)

def check_mu(mu):
    print(f"\n===== mu = {mu} =====")
    mats = all_matrices(mu)
    n = len(mats)
    print(f"Number of matrices: {n}")
    mat_idx = {m: i for i, m in enumerate(mats)}
    nvars = n * (n - 1) // 2
    print(f"Number of unknowns d(x,y) for x<y: {nvars}")
    # Generate equations
    # We will collect rows of the constraint matrix
    equations = []
    # Precompute all ranks and which pairs are transversal
    ranks = [mat_rank_f2(m) for m in mats]
    # Find all transversal pairs (W, W') with both nonzero, and rank(W)+rank(W') <= mu for the sum to have additive rank, but paper says transversal if column spaces independent and row spaces independent
    transversal = []
    for i, W in enumerate(mats):
        if ranks[i] == 0:
            continue
        for j, Wp in enumerate(mats):
            if ranks[j] == 0:
                continue
            if spaces_independent(W, Wp):
                transversal.append((i, j))
    print(f"Number of ordered transversal pairs (W, W'): {len(transversal)}")
    # For each a, each transversal (W, W'):
    # (D.1) d(a+W', a+W'+W) = d(a, a+W)
    # and d(a+W, a+W+W') = d(a, a+W')
    # (D.2) d(a+W, a+W') = 2 d(a, a+W) + 2 d(a, a+W') - d(a, a+W+W')
    def add_eq(coeffs):
        # coeffs: dict var_index -> coefficient
        equations.append(coeffs)
    for a_idx, a in enumerate(mats):
        for wi, wj in transversal:
            W = mats[wi]
            Wp = mats[wj]
            aW = mat_add(a, W)
            aWp = mat_add(a, Wp)
            aWWp = mat_add(aW, Wp)
            iaW = mat_idx[aW]
            iaWp = mat_idx[aWp]
            iaWWp = mat_idx[aWWp]
            # (D.1) first: d(aWp, aWWp) - d(a, aW) = 0
            eq1 = {}
            # d(aWp, aWWp)
            if iaWp != iaWWp:
                v = pair_index(iaWp, iaWWp, n)
                eq1[v] = eq1.get(v, 0) + 1
            # - d(a, aW)
            if a_idx != iaW:
                v = pair_index(a_idx, iaW, n)
                eq1[v] = eq1.get(v, 0) - 1
            if eq1:
                equations.append(eq1)
            # (D.1) second: d(aW, aWWp) - d(a, aWp) = 0
            eq2 = {}
            if iaW != iaWWp:
                v = pair_index(iaW, iaWWp, n)
                eq2[v] = eq2.get(v, 0) + 1
            if a_idx != iaWp:
                v = pair_index(a_idx, iaWp, n)
                eq2[v] = eq2.get(v, 0) - 1
            if eq2:
                equations.append(eq2)
            # (D.2): d(aW, aWp) - 2 d(a, aW) - 2 d(a, aWp) + d(a, aWWp) = 0
            eq3 = {}
            if iaW != iaWp:
                v = pair_index(iaW, iaWp, n)
                eq3[v] = eq3.get(v, 0) + 1
            if a_idx != iaW:
                v = pair_index(a_idx, iaW, n)
                eq3[v] = eq3.get(v, 0) - 2
            if a_idx != iaWp:
                v = pair_index(a_idx, iaWp, n)
                eq3[v] = eq3.get(v, 0) - 2
            if a_idx != iaWWp:
                v = pair_index(a_idx, iaWWp, n)
                eq3[v] = eq3.get(v, 0) + 1
            if eq3:
                equations.append(eq3)
    print(f"Number of equations collected: {len(equations)}")
    # Build matrix and compute rank over QQ
    # For large cases, use modular rank over several primes and Chinese remainder, or just over a large prime
    # Since we want exact dimension, and claim is dim=1 spanned by rank, we can:
    # 1. Check that rk is a solution
    # 2. Compute the rank of the constraint matrix over a large prime; if it equals nvars-1, and rk is a solution, then dim=1 over Q (since the corank is at least 1)
    # For mu=2 nvars=120, mu=3 nvars=130816 -- the latter is too big for dense sympy.
    # Use sparse Gaussian elimination over a prime field.
    return equations, nvars, mats, mat_idx, ranks

def sparse_rank_and_check(equations, nvars, mats, mat_idx, ranks, mu, prime=1000000007):
    """Compute rank of constraint matrix over GF(prime) using sparse GE, and check if rank function is in the kernel."""
    print(f"Working over GF({prime})...")
    # Represent equations as list of dicts, reduce mod prime
    eqs = []
    for eq in equations:
        e = {v: c % prime for v, c in eq.items() if c % prime != 0}
        if e:
            eqs.append(e)
    print(f"Nonzero equations mod p: {len(eqs)}")
    # Sparse Gaussian elimination
    # We'll use a simple implementation: pivot on columns
    # For efficiency with 130k vars, need care. For mu=2 it's fine.
    # Use dict of rows, eliminate
    rows = eqs[:]
    pivot_cols = set()
    rank = 0
    # Process in batches or just sequential
    # To save memory, eliminate as we go
    active = []
    for eq in rows:
        # eliminate using existing pivots
        # We'll maintain a dict col -> row that has pivot there
        pass
    # Better: use a list and for each new equation, reduce against pivots found so far
    pivots = {}  # col -> reduced row (dict)
    for eq in rows:
        # reduce
        e = dict(eq)
        changed = True
        while changed:
            changed = False
            for c in list(e.keys()):
                if c in pivots:
                    # subtract
                    piv = pivots[c]
                    factor = e[c] * pow(piv[c], prime-2, prime) % prime
                    for pc, pv in piv.items():
                        e[pc] = (e.get(pc, 0) - factor * pv) % prime
                        if e[pc] == 0:
                            del e[pc]
                    changed = True
                    break
        if not e:
            continue
        # new pivot: choose smallest col
        pc = min(e.keys())
        # normalize
        inv = pow(e[pc], prime-2, prime)
        e = {c: (v * inv) % prime for c, v in e.items()}
        pivots[pc] = e
        rank += 1
        if rank % 10000 == 0:
            print(f"  rank so far {rank}")
    print(f"Rank of constraint matrix mod {prime}: {rank}")
    print(f"Dimension of solution space mod {prime}: {nvars - rank}")
    # Check if d = rk(x-y) is a solution
    # Build the vector
    def is_rank_solution():
        for eq in equations:
            s = 0
            for v, c in eq.items():
                # recover i,j from v? Better precompute pair list
                pass
        # precompute
        pairs = []
        for i in range(len(mats)):
            for j in range(i+1, len(mats)):
                pairs.append((i, j))
        assert len(pairs) == nvars
        # for each equation, sum c * rk(mats[i]-mats[j])
        ok = True
        count_checked = 0
        for eq in equations:
            s = 0
            for v, c in eq.items():
                i, j = pairs[v]
                diff = mat_add(mats[i], mats[j])
                r = mat_rank_f2(diff)
                s += c * r
            if s != 0:
                ok = False
                break
            count_checked += 1
        return ok
    print("Checking if rk(x-y) satisfies all equations...")
    rk_ok = is_rank_solution()
    print(f"rk is a solution: {rk_ok}")
    return rank, nvars - rank, rk_ok

if __name__ == '__main__':
    for mu in [2, 3]:
        eqs, nvars, mats, mat_idx, ranks = check_mu(mu)
        if mu == 2 or nvars < 200000:
            sparse_rank_and_check(eqs, nvars, mats, mat_idx, ranks, mu)
