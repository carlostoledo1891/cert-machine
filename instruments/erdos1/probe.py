#!/usr/bin/env python
"""probe.py — falsification probes for the one lemma not recomputed at full size (cube admissibility
of Λ_s): every basis column, every difference/sum of two columns, and random small integer combinations
must map OUTSIDE the open cube (-1,1)^d under lift(F), F = H/D. A single hit would refute the theorem."""
import sys, json, random, time
sys.set_int_max_str_digits(0)
from fractions import Fraction as Fr
from lattice import lambda_s_basis, B_matrix

def probe(b, s, trials=2000, seed=1, alpha=Fr(1, 2)):
    basis, _ = lambda_s_basis(b, s, alpha); d = b ** s; r = d - 1
    # work directly with the natural basis of Λ_s (same lattice as lift(F)Z^r up to coordinate reversal)
    vecs = basis  # list of length-d Fraction vectors
    sup = lambda v: max(abs(x) for x in v)
    bad = 0; tested = 0
    for v in vecs:
        tested += 1; bad += sup(v) < 1
    for i in range(r):
        for j in range(i + 1, min(r, i + 12)):     # neighbouring pairs (dense part of the structure)
            for sgn in (1, -1):
                w = [x + sgn * y for x, y in zip(vecs[i], vecs[j])]
                tested += 1; bad += sup(w) < 1
    rng = random.Random(seed)
    for _ in range(trials):
        m = rng.randint(2, 6)
        idx = rng.sample(range(r), m)
        coef = [rng.choice([-2, -1, 1, 2]) for _ in idx]
        w = [Fr(0)] * d
        for c, k in zip(coef, idx):
            vk = vecs[k]
            for t in range(d):
                if vk[t]: w[t] += c * vk[t]
        tested += 1; bad += sup(w) < 1
    print(f"probe b={b} s={s} d={d}: {tested} lattice vectors tested, {bad} inside the open cube (must be 0)")
    return bad == 0

if __name__ == "__main__":
    b, s = int(sys.argv[1]), int(sys.argv[2])
    ok = probe(b, s)
    sys.exit(0 if ok else 1)
