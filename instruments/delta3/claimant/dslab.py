"""dslab.py — local search for the minimum of the discretised L(y) inside a slab lo <= m <= hi
(penalty + projected gradient, many starts incl. sign patterns of the landscape minima)."""
import numpy as np, sys
from srelax import setup
from dmodel import build, L, grad
args = dict(a.split('=') for a in sys.argv[1:])
lo, hi = float(args.get('lo', 0.4)), float(args.get('hi', 0.5))
data = setup(int(args.get('fine', 4)), int(args.get('coarse', 24)), int(args.get('D', 8)))
M = build(data); w = M['w']; n = M['n']
def proj(y):
    y = np.clip(y, 0, 1)
    for _ in range(50):
        m = w @ y
        if lo - 1e-12 <= m <= hi + 1e-12: break
        t = (m - hi) if m > hi else (m - lo)
        y = np.clip(y - t * w / (w @ w), 0, 1)
    return y
rng = np.random.default_rng(1); res = []
step = 1.0 / (np.abs(M['F']).sum(1).max() * 2 + 1e-12)
for t in range(int(args.get('starts', 200))):
    if t % 2: y = (rng.random(n) < (lo + hi) / 2 / w.sum() * (0.5 + rng.random())) * 1.0
    else: y = rng.random(n)
    y = proj(y)
    for k in range(4000):
        y = proj(y - step * grad(M, y))
    res.append((L(M, y), w @ y, y))
res.sort(key=lambda u: u[0])
for v, m, y in res[:8]:
    print(f"L={v:+.4e}  m={m:.4f}  fractional={int(np.sum((y>1e-3)&(y<1-1e-3)))}")
np.save('dslab-best.npy', res[0][2])
