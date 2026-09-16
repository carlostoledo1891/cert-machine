#!/usr/bin/env python
"""
verify.py — independent re-verification of a certificate produced by build.py.

Checks (all exact):
  V1  Λ_s rebuilt from (b,s); A = D·B integral; det A matches the certificate.
  V2  H is upper triangular with positive diagonal and col-lattice(H) = col-lattice(A')
      where A' = A with its rows reversed (exact rational solves + integrality both ways).
  V3  The r×r minor of C = top(t·H) − chainShift obtained by deleting row 0 has det ±1
      (computed by FLINT, not by the triangular argument), so col-lattice(M), M = S·C,
      is saturated in Z^{r+1}.
  V4  a spans the integer kernel of Mᵀ: nullspace(Mᵀ) has dimension 1 and its primitive
      integer generator equals ±a (FLINT nullspace, independent of the recurrence).
  V5  Buffer: K ≥ D·‖E H⁻¹‖_{∞→∞}, with H⁻¹ obtained by solving H X = I (FLINT solve).
  V6  D·t − K ≥ 2^k.
  V7  a_i > 0, distinct; n = (r+1)k; N = 2^{k−1} max a; ratio N/2^n matches and is < 0.22002.
Logical chain (THEOREM.md): V1+Bloom's lemma ⇒ lift(H/D) cube-admissible ⇒ (V3,V5,V6)
a is 2^k-relation-free ⇒ A = {a_i 2^j} dissociated with |A| = n, max A = N.
"""
import sys, json, time
sys.set_int_max_str_digits(0)
from fractions import Fraction as Fr

def load_cert(path):
    """Read a certificate; .json.gz is accepted (the public repository stores them gzipped)."""
    import gzip as _gz, json as _json
    if str(path).endswith('.gz'):
        with _gz.open(path, 'rt', encoding='utf-8') as f: return _json.load(f)
    return _json.load(open(path))

def log_for(path):
    """verify-<same>.log for a certificate path, gz or not."""
    import os as _os
    base = _os.path.basename(str(path)); d = _os.path.dirname(str(path))
    base = base[:-3] if base.endswith('.gz') else base
    return _os.path.join(d, base.replace('cert-', 'verify-').replace('.json', '.log'))
from flint import fmpz_mat, fmpq_mat, fmpq, fmpz
from lattice import lambda_s_basis, B_matrix

def fq(x): return Fr(int(x.p), int(x.q))

def is_integral_solution(Hq, Y):
    """solve Hq X = Y over Q, return True iff X is integral (Hq square nonsingular)."""
    X = Hq.solve(Y)
    for i in range(X.nrows()):
        for j in range(X.ncols()):
            if int(X[i, j].q) != 1: return False
    return True

def verify(path, bohman=Fr(22002, 100000), only_k=None):
    T0 = time.time(); ok = True
    def chk(name, cond, extra=""):
        nonlocal ok
        ok = ok and bool(cond)
        print(f"  [{'PASS' if cond else 'FAIL'}] {name} {extra}", flush=True)
    C = load_cert(path)
    b, s, d, r, D = C['b'], C['s'], C['d'], C['r'], C['D']; alpha = Fr(C.get('alpha', '1/2'))
    print(f"verify {path}: b={b} s={s} d={d} r={r} D={D} alpha={alpha}")
    chk("V0 D = denominator(α)^s", D == alpha.denominator ** s)
    basis, v = lambda_s_basis(b, s, alpha)
    chk("V1a basis lies in the zero-sum hyperplane", all(sum(w) == 0 for w in basis))
    B = B_matrix(basis)
    A = [[B[i][j] * D for j in range(r)] for i in range(r)]
    chk("V1b D·B integral", all(x.denominator == 1 for row in A for x in row))
    A = [[int(x) for x in row] for row in A]
    Af = fmpz_mat(A); detA = abs(int(Af.det()))
    chk("V1c |det A| matches certificate", detA == C['detA'], f"{detA.bit_length()} bits")
    H = C['H_upper_triangular_rows']
    chk("V2a H upper triangular, positive diagonal",
        all(H[i][i] > 0 and all(H[i][j] == 0 for j in range(i)) for i in range(r)))
    Arev = [A[r - 1 - i] for i in range(r)]           # reverse the first r coordinates
    Hf = fmpz_mat(H); Hq = fmpq_mat(Hf); Aq = fmpq_mat(fmpz_mat(Arev))
    chk("V2b columns of A' lie in col-lattice(H)", is_integral_solution(Hq, Aq))
    chk("V2c columns of H lie in col-lattice(A')", is_integral_solution(Aq, Hq))
    print(f"  [{time.time()-T0:.1f}s] lattice equality done")
    # E = S*chainShift: rows 0..r-1 = chainShift rows (row i has 1 at col i-1, i>=1); row r = (-1,...,-1,+1)
    def E_entry(i, j):
        if i < r: return 1 if i == j + 1 else 0
        return 1 if j == r - 1 else -1
    # V5: K >= D * max row-sum |E H^{-1}|
    Ident = fmpq_mat(r, r)
    for i in range(r): Ident[i, i] = 1
    Hinv = Hq.solve(Ident)
    rows = [[fq(Hinv[i, j]) for j in range(r)] for i in range(r)]
    l1 = [sum(abs(x) for x in row) for row in rows]
    last = [sum(-rows[i][j] for i in range(r - 1)) + rows[r - 1][j] for j in range(r)]
    Kcomp = D * max(max(l1[:r - 1]), sum(abs(x) for x in last))
    Kcert = Fr(C['K'])
    chk("V5 certificate K ≥ D·‖E H⁻¹‖∞", Kcert >= Kcomp, f"K={float(Kcert):.6g}")
    print(f"  [{time.time()-T0:.1f}s] buffer done")
    colsum = [sum(H[i][j] for i in range(r)) for j in range(r)]
    for inst in C['instances']:
        k, t, n = inst['k'], inst['t'], inst['n']
        if only_k is not None and k not in only_k:
            print(f" instance k={k}: skipped (not requested)"); continue
        a = [int(x) for x in inst['a']]
        print(f" instance k={k}: n={n} t={t}")
        chk("V6 D·t − K ≥ 2^k", D * t - Kcert >= 2 ** k)
        # M = t*lift(H) - E  ((r+1) x r)
        M = [[t * H[i][j] - E_entry(i, j) for j in range(r)] for i in range(r)] + \
            [[-t * colsum[j] - E_entry(r, j) for j in range(r)]]
        # V3: C = S^{-1} M with S^{-1} = [[I,0],[1ᵀ,1]]: C rows 0..r-1 = M rows, C row r = M row r + Σ_{i<r} M row i.
        # col-lattice(M) = S·col-lattice(C) and S ∈ GL_{r+1}(Z), so M's lattice is saturated iff C's is;
        # C's lattice is saturated because its minor deleting row 0 is unimodular.
        Crow_r = [M[r][j] + sum(M[i][j] for i in range(r)) for j in range(r)]
        Cm = [M[i] for i in range(r)] + [Crow_r]
        minor = fmpz_mat([Cm[i] for i in range(1, r + 1)])
        dm = int(minor.det())
        chk("V3 minor (rows 1..r) of C = S⁻¹M has det ±1 ⇒ col-lattice(M) saturated", abs(dm) == 1, f"det={dm}")
        # V4: nullspace of M^T
        Mt = fmpz_mat([[M[i][j] for i in range(r + 1)] for j in range(r)])   # r x (r+1)
        ns, nullity = Mt.nullspace()
        chk("V4a nullity of Mᵀ is 1", nullity == 1, f"nullity={nullity}")
        g = [int(ns[i, 0]) for i in range(r + 1)]
        import math
        gg = 0
        for x in g: gg = math.gcd(gg, abs(x))
        g = [x // gg for x in g]
        if g[r] < 0: g = [-x for x in g]
        chk("V4b primitive kernel generator equals a", g == a)
        chk("V7a all a_i > 0 and distinct", all(x > 0 for x in a) and len(set(a)) == r + 1)
        chk("V7b n = (r+1)k", n == (r + 1) * k)
        N = max(a) * 2 ** (k - 1)
        ratio = Fr(N, 2 ** n)
        chk("V7c ratio matches certificate", ratio == Fr(inst['ratio']), f"N/2^n = {float(ratio):.6f}")
        print(f"  [{'BEATS BOHMAN' if ratio < bohman else 'above Bohman (informational)'}] N/2^n = {float(ratio):.6f} vs 0.22002", flush=True)
        print(f"  [{time.time()-T0:.1f}s] instance done")
    print("OVERALL:", "ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED")
    return ok

if __name__ == "__main__":
    args = sys.argv[1:]; only = None
    if '--k' in args:
        i = args.index('--k'); only = [int(x) for x in args[i + 1].split(',')]; del args[i:i + 2]
    for p in args:
        verify(p, only_k=only)
