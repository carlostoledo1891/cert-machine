"""Float64 evaluation of the monochromatic K4 density of a step graphon with uniform block weights.
t(K4,W) = (1/m^4) sum_i tr((diag(W_i) W)^3); c4 = t(K4,W) + t(K4,1-W).
usage: float_eval.py construction.json.gz [all|reps]"""
import gzip, json, sys, time
import numpy as np
d = json.load(gzip.open(sys.argv[1]))
R = np.array(d['red_probability_numerators'], dtype=np.float64); den = d['edge_probability_denominator']
m = R.shape[0]; W = R / den; Bw = 1.0 - W
def term(i, A):
    s = np.sqrt(A[i]); B = A * s[:, None] * s[None, :]
    return float(np.sum((B @ B) * B))
mode = sys.argv[2] if len(sys.argv) > 2 else 'reps'
if mode == 'reps':
    rows = [tuple(sorted(r)) for r in d['red_probability_numerators']]
    cls = {}
    for i, r in enumerate(rows): cls.setdefault((r, d['red_probability_numerators'][i][i]), []).append(i)
    tot = 0.0; t0 = time.time(); worst = 0.0
    for k, (key, mem) in enumerate(cls.items()):
        a = term(mem[0], W) + term(mem[0], Bw)
        if k < 6:  # spot-check that another member gives the same term
            b = term(mem[-1], W) + term(mem[-1], Bw); worst = max(worst, abs(a - b) / a)
        tot += a * len(mem)
    print(f"classes={len(cls)} c4~{tot / m**4:.13f} spotcheck_rel_diff={worst:.2e} time={time.time()-t0:.0f}s")
else:
    tot = sum(term(i, W) + term(i, Bw) for i in range(m)); print(f"c4~{tot / m**4:.13f}")
