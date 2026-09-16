#!/usr/bin/env python
"""hnf_pari.py b s — compute the upper-triangular Hermite basis H of col-lattice(J·A) with PARI's
modular algorithm (mathnfmod, using the exact determinant), and cache it as H-b{b}-s{s}.json in the
layout build.py expects (rows of an upper-triangular integer matrix in the row-reversed coordinates)."""
import sys, os, json, time, subprocess, tempfile
sys.set_int_max_str_digits(0)
from flint import fmpz_mat
from fractions import Fraction as Fr
from lattice import lambda_s_basis, B_matrix
from build import asuffix, cache_path, save_cache
from lattice import delta_formula

def hermite_pari(b, s, gp='gp', alpha=Fr(1, 2)):
    T0 = time.time(); alpha = Fr(alpha)
    basis, _ = lambda_s_basis(b, s, alpha); d = b ** s; r = d - 1; D = alpha.denominator ** s
    B = B_matrix(basis)
    A = [[int(B[i][j] * D) for j in range(r)] for i in range(r)]
    if os.environ.get('ERDOS1_DET') == 'flint':
        detA = abs(int(fmpz_mat(A).det()))
    else:
        # cert-machine: |det A| = D^r Δ_s from the closed form (lattice.py). It is only the modulus handed to
        # mathnfmod; the diagonal product of the returned H is asserted equal to it below, and verify.py V1c
        # recomputes det A with FLINT independently. At r = 3374 the FLINT determinant costs the better part of
        # an hour; the formula is exact and instant.
        detA = delta_formula(b, s, alpha) * D ** r
        assert detA.denominator == 1, "the closed-form determinant is not an integer"
        detA = abs(int(detA))
    JA = A[::-1]                                   # reverse the first r coordinates (rows)
    print(f"[{time.time()-T0:.1f}s] b={b} s={s} r={r}: |det A| {detA.bit_length()} bits; writing gp script", flush=True)
    work = tempfile.mkdtemp(prefix=f"hnf-b{b}-s{s}-")
    Afile = os.path.join(work, "A.gp"); Hfile = os.path.join(work, "H.txt"); script = os.path.join(work, "run.gp")
    with open(Afile, 'w') as f:
        f.write("A=[" + ";".join(",".join(str(x) for x in row) for row in JA) + "];\n")
    with open(script, 'w') as f:
        f.write(f'default(parisizemax, 16000000000);\nread("{Afile}");\nDD={detA};\n'
                f'H=mathnfmod(A, DD);\n'
                f'for(i=1,{r}, for(j=1,{r}, write1("{Hfile}", H[i,j], " ")); write("{Hfile}", ""));\nquit;\n')
    t1 = time.time()
    out = subprocess.run([gp, '-q', '-f', script], capture_output=True, text=True)
    if out.returncode != 0 or not os.path.exists(Hfile):
        raise RuntimeError(out.stderr[-2000:] + out.stdout[-2000:])
    print(f"[{time.time()-T0:.1f}s] mathnfmod done in {time.time()-t1:.1f}s", flush=True)
    H = [[int(x) for x in line.split()] for line in open(Hfile) if line.strip()]
    assert len(H) == r and all(len(row) == r for row in H)
    for i in range(r):
        assert H[i][i] > 0 and all(H[i][j] == 0 for j in range(i)), "not upper triangular / positive diagonal"
    prod = 1
    for i in range(r): prod *= H[i][i]
    assert prod == detA, "diagonal product != |det A|"
    save_cache(H, cache_path(b, s, alpha))
    print(f"[{time.time()-T0:.1f}s] cached {cache_path(b, s, alpha)} (max |entry| {max(abs(x) for row in H for x in row)}, nonzeros {sum(1 for row in H for x in row if x)})", flush=True)

if __name__ == "__main__":
    args = sys.argv[1:]; alpha = Fr(1, 2)
    if "--alpha" in args:
        i = args.index("--alpha"); alpha = Fr(args[i + 1]); del args[i:i + 2]
    hermite_pari(int(args[0]), int(args[1]), alpha=alpha)
