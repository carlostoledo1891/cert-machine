"""
Erdős problem 1, made explicit — the cube-admissible lattice Λ_s (Bloom's exposition
of the GPT-6 Astra disproof, erdosproblems.com/1, 2026-09-03), in exact rationals.

Λ_1 = T(Z^b ∩ V_b) with (Tz)_i = z_i + z_{i+1}/2 (cyclic), b odd ≥ 3.
v_1 = T(e_0) = (1,0,...,0,1/2), height h_1 = 3/2.
Λ_{s+1} = {(λ_0 + β_0 v_s, ..., λ_{b-1} + β_{b-1} v_s) : λ_j ∈ Λ_s, β ∈ Λ_1}
v_{s+1} = (v_s, 0, ..., 0, v_s/2).
Δ_s := |det B_s| where B_s = first (d-1) coordinates of a basis of Λ_s (columns), d = b^s.
Bloom: Δ_s = (1+2^{-b})^{(b^s-1)/(b-1)} / (3/2)^s and f(n) ≤ Δ_s for suitable n.
"""
from fractions import Fraction as Fr

def lambda1_basis(b, alpha=Fr(1, 2)):
    """Basis of Λ_1 ⊂ V_b (list of length-b rational vectors), and v_1, for the gadget T = I + αP."""
    assert b % 2 == 1 and b >= 3
    alpha = Fr(alpha)
    def T(z):
        return [z[i] + alpha * z[(i + 1) % b] for i in range(b)]
    basis = []
    for i in range(b - 1):
        z = [Fr(0)] * b
        z[i] = Fr(1); z[i + 1] = Fr(-1)
        basis.append(T(z))
    e0 = [Fr(0)] * b; e0[0] = Fr(1)
    return basis, T(e0)

def lambda_s_basis(b, s, alpha=Fr(1, 2)):
    """Basis of Λ_s ⊂ V_{b^s} and the vector v_s (both exact), gadget T = I + αP."""
    L1, v1 = lambda1_basis(b, alpha)
    basis, v = L1, v1
    d = b
    for _ in range(s - 1):
        newb = []
        # block-embedded copies of the current basis
        for j in range(b):
            for lam in basis:
                w = [Fr(0)] * (b * d)
                w[j * d:(j + 1) * d] = lam
                newb.append(w)
        # β ⊗ v for β in basis of Λ_1
        for beta in L1:
            w = []
            for j in range(b):
                w.extend([beta[j] * x for x in v])
            newb.append(w)
        newv = [Fr(0)] * (b * d)
        newv[0:d] = v
        newv[(b - 1) * d:b * d] = [Fr(alpha) * x for x in v]
        basis, v, d = newb, newv, b * d
    return basis, v

def det_fraction(M):
    """Exact determinant by fraction-free-ish Gaussian elimination (small sizes)."""
    n = len(M); A = [row[:] for row in M]; det = Fr(1)
    for c in range(n):
        p = next((r for r in range(c, n) if A[r][c] != 0), None)
        if p is None: return Fr(0)
        if p != c: A[c], A[p] = A[p], A[c]; det = -det
        det *= A[c][c]
        inv = 1 / A[c][c]
        for r in range(c + 1, n):
            if A[r][c] != 0:
                f = A[r][c] * inv
                A[r] = [a - f * bb for a, bb in zip(A[r], A[c])]
    return det

def B_matrix(basis):
    """B = first d-1 coordinates, columns = basis vectors  ->  (d-1)x(d-1) rows/cols."""
    d = len(basis[0]); r = d - 1
    assert len(basis) == r
    return [[basis[j][i] for j in range(r)] for i in range(r)]

def delta_formula(b, s, alpha=Fr(1, 2)):
    alpha = Fr(alpha); e = (b ** s - 1) // (b - 1)
    return (1 + alpha ** b) ** e / (1 + alpha) ** s


def inverse_fraction(B):
    n = len(B)
    Aug = [B[i][:] + [Fr(1) if j == i else Fr(0) for j in range(n)] for i in range(n)]
    for c in range(n):
        p = next(rr for rr in range(c, n) if Aug[rr][c] != 0)
        Aug[c], Aug[p] = Aug[p], Aug[c]
        inv = 1 / Aug[c][c]; Aug[c] = [a * inv for a in Aug[c]]
        for rr in range(n):
            if rr != c and Aug[rr][c] != 0:
                f = Aug[rr][c]; Aug[rr] = [a - f * bb for a, bb in zip(Aug[rr], Aug[c])]
    return [row[n:] for row in Aug]

def cube_violations(B, zb, limit=3):
    """DFS over z in Z^r, |z_j|<=zb, pruning with interval bounds on each row of lift(B)z.
    Returns list of nonzero z with lift(Bz) in (-1,1)^{r+1}."""
    r = len(B)
    rows = B + [[-sum(B[i][j] for i in range(r)) for j in range(r)]]  # lift: last row = -colsums
    # for pruning: remaining slack per row = sum_{l>j} |row[l]| * zb
    suffix = [[Fr(0)] * (r + 1) for _ in range(r + 1)]
    for i in range(r + 1):
        acc = Fr(0)
        for l in range(r - 1, -1, -1):
            acc += abs(rows[i][l]) * zb
            suffix[i][l] = acc
    found = []
    partial = [Fr(0)] * (r + 1)
    z = [0] * r
    def rec(j, nonzero):
        if len(found) >= limit: return
        if j == r:
            if nonzero and all(abs(partial[i]) < 1 for i in range(r + 1)):
                found.append(z[:])
            return
        for val in range(-zb, zb + 1):
            z[j] = val
            ok = True
            for i in range(r + 1):
                partial[i] += rows[i][j] * val
                # can the remaining coordinates bring |partial| below 1?
                if abs(partial[i]) - (suffix[i][j + 1] if j + 1 < r else 0) >= 1:
                    ok = False
            if ok:
                rec(j + 1, nonzero or val != 0)
            for i in range(r + 1):
                partial[i] -= rows[i][j] * val
        z[j] = 0
    rec(0, False)
    return found

if __name__ == "__main__":
    import sys, time
    for b, s in [(3, 1), (3, 2), (5, 1), (5, 2), (3, 3), (7, 1), (9, 1), (7, 2), (9, 2)]:
        basis, v = lambda_s_basis(b, s)
        d = b ** s
        assert all(sum(w) == 0 for w in basis), "not in V_d"
        h = sum(v)
        B = B_matrix(basis)
        det = abs(det_fraction(B))
        print(f"b={b} s={s} d={d}: |det B|={float(det):.6f}  formula={float(delta_formula(b,s)):.6f}  h_s={h}  match={det==delta_formula(b,s)}", flush=True)
    for b, s in [(3, 1), (5, 1), (7, 1), (3, 2), (9, 1), (5, 2), (3, 3)]:
        basis, v = lambda_s_basis(b, s); d = b ** s; r = d - 1
        B = B_matrix(basis)
        Binv = inverse_fraction(B)
        bound = max(sum(abs(x) for x in row) for row in Binv)
        zb = int(bound)
        t0 = time.time()
        viol = cube_violations(B, zb)
        print(f"cube-admissibility DFS b={b} s={s} d={d}: |z|_inf<={zb}, violations={len(viol)} {viol[:2]}  ({time.time()-t0:.1f}s)", flush=True)
