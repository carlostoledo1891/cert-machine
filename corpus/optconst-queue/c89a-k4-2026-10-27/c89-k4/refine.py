"""Orbit-structured gradient refinement of a step graphon for the K4 Ramsey multiplicity (float64 search).

Blocks are grouped into classes by (sorted row, diagonal entry) -- for the [VSJ2026] graphon these behave as
orbits of its symmetry group -- and every off-diagonal pair (i, j) gets the key (class i, class j, R_ij).
All pairs with one key move together, so the perturbed graphon keeps the symmetry and the density and its
gradient can be computed from one representative block per class. Search only: candidates are rounded to
multiples of 1/D and certified by exact_eval.py, which sums over every block.

usage: refine.py in.json.gz out.json.gz steps
"""
import gzip, json, sys, time
import numpy as np

d = json.load(gzip.open(sys.argv[1]))
D = d['edge_probability_denominator']; R0 = np.array(d['red_probability_numerators'], dtype=np.int64)
m = R0.shape[0]
rows = [tuple(sorted(r)) for r in R0.tolist()]
cid, cls = {}, np.zeros(m, dtype=np.int64)
for i in range(m):
    cls[i] = cid.setdefault((rows[i], int(R0[i, i])), len(cid))
nc = len(cid); reps = np.array([np.nonzero(cls == a)[0][0] for a in range(nc)]); size = np.bincount(cls)
# pair keys
keyid = {}
K = np.zeros((m, m), dtype=np.int64)
for i in range(m):
    for j in range(m):
        if i == j: K[i, j] = -1; continue
        a, b = sorted((cls[i], cls[j]))
        K[i, j] = keyid.setdefault((a, b, int(R0[i, j])), len(keyid))
nk = len(keyid); npairs = np.bincount(K[K >= 0], minlength=nk) / 2.0  # unordered pairs per key
print(f"m={m} classes={nc} keys={nk}", flush=True)


def terms(W):
    """per-rep [t_red + t_blue] and per-rep gradient rows (d/dW_ij of c4 * m^4 / 12)."""
    tot = 0.0; grow = np.zeros((nc, m))
    for col, sgn in ((W, 1.0), (1.0 - W, -1.0)):
        for a in range(nc):
            i = reps[a]
            A = col * col[i][None, :]          # A = W D_i
            Q = A @ col                        # W D_i W
            S = np.sum(Q * A, axis=1)          # S_ij = (W D_i W D_i W)_jj
            tot += size[a] * np.dot(col[i], S)  # tr((D_i W)^3) = sum_j W_ij S_ij
            grow[a] += sgn * S
    return tot / m ** 4, grow


def keygrad(grow):
    g = np.zeros(nk)
    for a in range(nc):
        i = reps[a]; k = K[i]; ok = k >= 0
        np.add.at(g, k[ok], size[a] * grow[a][ok])
    return g / 2.0  # each unordered pair counted from both endpoints


W = R0 / D
c, grow = terms(W); best = c
print(f"start c4={c:.13f}", flush=True)
steps = int(sys.argv[3]); eta = 1e-2
for it in range(steps):
    t0 = time.time()
    g = keygrad(grow) * 12.0 / m ** 4
    dirk = -g / npairs                         # per-pair change for each key
    Kc = np.where(K >= 0, K, 0)
    while True:
        Wn = np.clip(W + eta * np.where(K >= 0, dirk[Kc], 0.0) / max(1e-30, np.abs(dirk).max()), 0.0, 1.0)
        cn, gn = terms(Wn)
        if cn < c: break
        eta /= 4
        if eta < 1e-9: break
    if cn >= c:
        print("no descent; stop", flush=True); break
    W, c, grow = Wn, cn, gn; eta *= 1.5
    print(f"it={it} c4={c:.13f} gain={best - c:.3e} eta={eta:.2e} ({time.time()-t0:.0f}s)", flush=True)
    DO = 1 << 24  # save at a finer denominator than the input's, so rounding does not eat the gain
    Rr = np.rint(W * DO).astype(np.int64); Rr = np.minimum(Rr, Rr.T)
    out = dict(d); out['edge_probability_denominator'] = DO; out['red_probability_numerators'] = Rr.tolist()
    json.dump(out, gzip.open(sys.argv[2], 'wt'))
