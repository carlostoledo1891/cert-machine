#!/usr/bin/env python
"""
build.py — an EXPLICIT dissociated set below Bohman's constant (Erdős problem 1).

Pipeline (effective version of the GPT-6 Astra / Bloom construction):
  1. Λ_s ⊂ V_d (d = b^s) cube-admissible lattice, exact rationals (lattice.py).
  2. B = first r=d-1 coordinates of a basis (columns); A = D·B integral, D = 2^s.
  3. Column Hermite form: an upper-triangular integer H with col-lattice(H) = col-lattice(A)
     after reversing the first r coordinates (harmless for cube admissibility).
  4. Chain perturbation: C = top(t·H) − chainShift has a unimodular r×r minor, hence the
     column lattice of M = S·C = t·lift(H) − E (S = [[I,0],[−1ᵀ,1]], E = S·chainShift) is
     SATURATED in Z^{r+1}; its primitive normal a is explicit (prefix recurrence).
  5. Buffer K = D·‖E H⁻¹‖_{∞→∞}: for every real z, ‖E z‖_∞ ≤ K ‖lift(H/D) z‖_∞.
  6. With t = ⌈(2^k + K)/D⌉ the weights a are 2^k-relation-free:
     c·a = 0, |c_i| < 2^k  ⇒  c = M z (saturation) ⇒ ‖c‖_∞ ≥ (Dt − K)‖lift(F)z‖_∞ ≥ 2^k.
  7. A = {a_i · 2^j : 0 ≤ i ≤ r, 0 ≤ j < k} is dissociated, |A| = (r+1)k, max A = 2^{k−1} max a.
"""
import sys, os, json, time, math
sys.set_int_max_str_digits(0)
from fractions import Fraction as Fr
from flint import fmpz_mat, fmpq_mat, fmpq
from lattice import lambda_s_basis, B_matrix, delta_formula

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')

def cache_path(b, s, alpha):
    """cert-machine: the Hermite caches live gzipped beside the instrument, not in the working directory."""
    return os.path.join(CACHE_DIR, f"H-b{b}-s{s}{asuffix(alpha)}.json.gz")

def load_cache(p):
    import gzip
    with gzip.open(p, 'rt', encoding='utf-8') as f: return json.load(f)

def save_cache(H, p):
    import gzip
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with gzip.open(p, 'wt', encoding='utf-8', compresslevel=6) as f: json.dump(H, f)

def fq(x):  # flint fmpq -> Fraction
    return Fr(int(x.p), int(x.q))

def ceil_frac(x):
    return -((-x.numerator) // x.denominator)

def build(b, s, ks, out=None, verbose=True, alpha=Fr(1, 2)):
    T0 = time.time(); alpha = Fr(alpha)
    log = (lambda *a: print(*a, flush=True)) if verbose else (lambda *a: None)
    basis, v = lambda_s_basis(b, s, alpha)
    d = b ** s; r = d - 1; D = alpha.denominator ** s
    assert all(sum(w) == 0 for w in basis)
    B = B_matrix(basis)
    A = [[B[i][j] * D for j in range(r)] for i in range(r)]
    assert all(x.denominator == 1 for row in A for x in row), "D is not a common denominator"
    A = [[int(x) for x in row] for row in A]
    log(f"[{time.time()-T0:6.1f}s] b={b} s={s} d={d} r={r} D={D}; Λ_s basis built, α = {alpha}, Δ_s = {float(delta_formula(b,s,alpha)):.6f}")
    Af = fmpz_mat(A)
    detA = int(Af.det())
    log(f"[{time.time()-T0:6.1f}s] |det A| has {abs(detA).bit_length()} bits; |det A|/D^r = {float(Fr(abs(detA), D**r)):.6f}")
    # column HNF via row HNF of the transpose, then coordinate reversal -> upper triangular (cached: it is the expensive step)
    hcache = cache_path(b, s, alpha)
    if os.path.exists(hcache):
        H = load_cache(hcache); log(f"[{time.time()-T0:6.1f}s] Hermite form loaded from {hcache}")
    else:
        H1 = Af.transpose().hnf()
        H = [[int(H1[r - 1 - j, r - 1 - i]) for j in range(r)] for i in range(r)]
        save_cache(H, hcache); log(f"[{time.time()-T0:6.1f}s] Hermite form computed and cached in {hcache}")
    for i in range(r):
        assert H[i][i] > 0 and all(H[i][j] == 0 for j in range(i)), "H not upper triangular with positive diagonal"
    detH = 1
    for i in range(r): detH *= H[i][i]
    assert detH == abs(detA), "det mismatch"
    maxH = max(abs(x) for row in H for x in row)
    log(f"[{time.time()-T0:6.1f}s] Hermite form H: upper triangular, diag product = |det A|, max |entry| = {maxH}, nonzeros = {sum(1 for row in H for x in row if x)}")
    # K = D * max row-sum of |E H^{-1}| ; E rows: 0, e_0,...,e_{r-2}, and (-1,...,-1,+1)
    Hinv = fmpq_mat(fmpz_mat(H)).inv()
    rows = [[fq(Hinv[i, j]) for j in range(r)] for i in range(r)]
    l1 = [sum(abs(x) for x in row) for row in rows]
    last = [sum(-rows[i][j] for i in range(r - 1)) + rows[r - 1][j] for j in range(r)]
    l1_last = sum(abs(x) for x in last)
    K = D * max(max(l1[:r - 1]), l1_last)
    log(f"[{time.time()-T0:6.1f}s] buffer K = {float(K):.6g} (exact {K.numerator}/{K.denominator}); max row l1 of H^-1 = {float(max(l1)):.6g}")
    results = []
    for k in ks:
        Q = 2 ** k
        t = ceil_frac((Q + K) / D)
        assert D * t - K >= Q
        # chain weights w_0..w_r ; w_{j+1} = t * sum_{i<=j} w_i H[i][j]
        w = [1]
        for j in range(r):
            acc = 0
            for i in range(j + 1):
                if H[i][j]:
                    acc += w[i] * H[i][j]
            w.append(t * acc)
        a = [w[i] + w[r] for i in range(r)] + [w[r]]
        # verify a^T M = 0 with M = t*lift(H) - E
        colsum = [sum(H[i][j] for i in range(r)) for j in range(r)]
        for j in range(r):
            tot = 0
            for i in range(r):
                tot += a[i] * (t * H[i][j] - (1 if i == j + 1 else 0))
            tot += a[r] * (-t * colsum[j] - (1 if j == r - 1 else -1))
            assert tot == 0, f"a^T M != 0 at column {j}"
        assert all(x > 0 for x in a), "weights not all positive"
        assert len(set(a)) == r + 1, "weights not distinct"
        n = (r + 1) * k
        amax = max(a)
        N = amax * 2 ** (k - 1)
        ratio = Fr(N, 2 ** n)
        results.append(dict(k=k, n=n, t=t, ratio=ratio, N_bits=N.bit_length(), amin=min(a), amax=amax, a=a))
        log(f"[{time.time()-T0:6.1f}s] k={k}: n={n}, t={t}, N has {N.bit_length()} bits, N/2^n = {float(ratio):.6f}  (Bohman 0.22002; Bloom-normalized f = {float(2*ratio):.6f})")
    if out:
        best = min(results, key=lambda R: R['ratio'])
        cert = dict(gadget=f"T = I + ({alpha}) P", problem="Erdős #1 explicit dissociated set", b=b, s=s, d=d, r=r, D=D,
                    delta_formula=str(delta_formula(b, s, alpha)), alpha=str(alpha), detA=abs(detA),
                    H_upper_triangular_rows=H, K=str(K),
                    instances=[dict(k=R['k'], n=R['n'], t=R['t'], ratio=str(R['ratio']), ratio_float=float(R['ratio']),
                                    N_bits=R['N_bits'], a=[str(x) for x in R['a']]) for R in results],
                    set_definition="A = { a_i * 2^j : 0<=i<=r, 0<=j<k }, |A| = (r+1)k, max A = 2^(k-1) max a_i",
                    claims="A is dissociated (all 2^|A| subset sums distinct); N/2^n = ratio < 0.22002 (Bohman 1998).")
        json.dump(cert, open(out, 'w'))
        log(f"wrote {out}")
    return results

def asuffix(alpha):
    alpha = Fr(alpha); return "" if alpha == Fr(1, 2) else f"-a{alpha.numerator}_{alpha.denominator}"

if __name__ == "__main__":
    args = sys.argv[1:]; alpha = Fr(1, 2)
    if "--alpha" in args:
        i = args.index("--alpha"); alpha = Fr(args[i + 1]); del args[i:i + 2]
    out = None
    if "--out" in args:                      # cert-machine: write the certificate where the records live
        i = args.index("--out"); out = args[i + 1]; del args[i:i + 2]
    b, s = int(args[0]), int(args[1])
    ks = [int(x) for x in args[2:]] or [20]
    out = out or f"cert-b{b}-s{s}{asuffix(alpha)}.json"
    build(b, s, ks, out=out, alpha=alpha)
