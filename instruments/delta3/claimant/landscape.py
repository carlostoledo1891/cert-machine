"""landscape.py — local minima of Q on the uniform grid of 1096 cells (float), by single-flip descent
from many random / structured starts. Prints distinct minima: excess E=(Q-Q*)/4 (delta units),
number of blocks, L1 distance to +-phi*."""
import numpy as np, sys
sys.path.insert(0, '..')
from model import area_rect
from fractions import Fraction as Fr
L = int(sys.argv[1]) if len(sys.argv) > 1 else 548
# exact cell-pair areas (symmetrised) as float, via the separable structure: cache by (i,j)
K = np.zeros((L, L))
for i in range(L):
    a0, a1 = i / L, (i + 1) / L
    jlo = max(0, int(np.floor(a0 / 2 * L)) - 1); jhi = min(L - 1, int(np.ceil((1 + a1) / 2 * L)) + 1)
    for j in range(jlo, jhi + 1):
        b0, b1 = j / L, (j + 1) / L
        if b1 <= a0 / 2 or b0 >= (1 + a1) / 2: continue
        if b0 >= a1 / 2 and b1 <= (1 + a0) / 2: K[i, j] = 1 / L**2
        else: K[i, j] = float(area_rect(Fr(i, L), Fr(i + 1, L), Fr(j, L), Fr(j + 1, L)))
K = (K + K.T) / 2
Qstar = -5 / 137
TW = [28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28]
ps = np.zeros(L); edges = np.cumsum([0] + TW) / 548
for k in range(12):
    lo, hi = int(round(edges[k] * L)), int(round(edges[k + 1] * L)); ps[lo:hi] = 1 if k % 2 == 0 else -1
print("Q(phi*) on grid:", ps @ K @ ps, "exact", Qstar)
rng = np.random.default_rng(int(sys.argv[2]) if len(sys.argv) > 2 else 0)
def descend(x):
    g = K @ x
    while True:
        # flipping i changes Q by -4 x_i g_i + 4 K_ii
        d = -4 * x * g + 4 * np.diag(K)
        i = np.argmin(d)
        if d[i] >= -1e-15: return x
        g -= 2 * x[i] * K[:, i]; x[i] = -x[i]
found = {}
starts = int(sys.argv[3]) if len(sys.argv) > 3 else 400
for t in range(starts):
    kind = t % 4
    if kind == 0: x = rng.choice([-1.0, 1.0], L)
    elif kind == 1:   # random block colouring with 4..30 blocks
        m = rng.integers(4, 31); cuts = np.sort(rng.choice(np.arange(1, L), m - 1, replace=False))
        x = np.ones(L); sgn = 1
        for c in cuts: x[c:] *= -1
    elif kind == 2:   # perturb phi*: shift breakpoints randomly
        x = ps.copy(); idx = rng.choice(L, rng.integers(1, 60), replace=False); x[idx] *= -1
    else:             # smooth random function sign
        f = sum(rng.normal() * np.cos(np.pi * k * (np.arange(L) + .5) / L) / (1 + k) for k in range(1, 40)); x = np.sign(f + 1e-12)
    x = descend(x.copy())
    if x[0] < 0: x = -x
    q = x @ K @ x; blocks = 1 + int(np.sum(x[1:] != x[:-1]))
    d1 = min(np.mean(np.abs(x - ps)), np.mean(np.abs(x + ps)))
    key = (round(q, 9),)
    found.setdefault(key, [0, q, blocks, d1, x]); found[key][0] += 1
res = sorted(found.values(), key=lambda v: v[1])
print(f"{len(res)} distinct local minima from {starts} starts")
for cnt, q, bl, d1, x in res[:25]:
    print(f"E={(q-Qstar)/4:+.3e}  Q={q:.7f}  blocks={bl:3d}  L1dist={d1:.4f}  hits={cnt}")
np.save(f'landscape-L{L}.npy', np.array([v[4] for v in res[:25]]))
