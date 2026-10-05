"""dmodel.py — the discretised lower bound L(y) <= E(sigma) on a grid (float), and a local search for
its minimum over {y in [0,1]^n, sum w y <= 1/2}: if L can go negative the GRID cheats (no relaxation
on this grid can then reach 0); otherwise any gap is the relaxation's."""
import numpy as np, sys
from srelax import setup
def build(data):
    pts, C, full, cut = data; n = len(C)
    w = np.array([float(c['w']) for c in C]); a = np.array([float(c['a']) for c in C])
    b = np.array([float(c['b']) for c in C]); s = np.array([c['s'] for c in C], float)
    F = np.zeros((n, n))
    for i, j in full: F[i, j] += s[i] * s[j] * w[i] * w[j]
    F = (F + F.T) / 2
    ci = np.array([c[0] for c in cut]); cj = np.array([c[1] for c in cut])
    ain = np.array([float(c[2]) for c in cut]); aout = np.array([float(c[3]) for c in cut])
    ss = s[ci] * s[cj]; ww = w[ci] * w[cj]
    return dict(n=n, w=w, a=a, b=b, F=F, ci=ci, cj=cj, ain=ain, aout=aout, ss=ss, ww=ww)
def L(M, y):
    v = M['a'] @ y + M['b'] @ (y * y) + y @ M['F'] @ y
    p = M['ww'] * y[M['ci']] * y[M['cj']]
    cutv = np.where(M['ss'] > 0, np.maximum(0, p - M['aout']), -np.minimum(M['ain'], p))
    return v + cutv.sum()
def grad(M, y):
    g = M['a'] + 2 * M['b'] * y + 2 * M['F'] @ y
    p = M['ww'] * y[M['ci']] * y[M['cj']]
    dp = np.where(M['ss'] > 0, (p - M['aout'] > 0) * 1.0, -1.0 * (p < M['ain'])) * M['ww']
    np.add.at(g, M['ci'], dp * y[M['cj']]); np.add.at(g, M['cj'], dp * y[M['ci']])
    return g
def project(y, w, cap=0.5):
    y = np.clip(y, 0, 1)
    if w @ y <= cap: return y
    lo, hi = 0, 10
    for _ in range(60):
        t = (lo + hi) / 2
        if w @ np.clip(y - t * w / w.max(), 0, 1) > cap: lo = t
        else: hi = t
    return np.clip(y - hi * w / w.max(), 0, 1)
def search(M, starts=300, iters=3000, seed=0):
    rng = np.random.default_rng(seed); best = []
    for t in range(starts):
        y = rng.random(M['n']) * rng.random()
        if t % 3 == 0: y = (rng.random(M['n']) < rng.random() * 0.6) * 1.0
        y = project(y, M['w']); step = 2.0 / (np.abs(M['F']).sum(1).max() + 1e-9)
        for k in range(iters):
            y = project(y - step * grad(M, y), M['w'])
        best.append((L(M, y), M['w'] @ y, y))
    best.sort(key=lambda u: u[0])
    return best
if __name__ == "__main__":
    args = dict(a.split('=') for a in sys.argv[1:])
    data = setup(int(args.get('fine', 4)), int(args.get('coarse', 24)), int(args.get('D', 8)))
    M = build(data)
    res = search(M, int(args.get('starts', 200)))
    print("lowest values of L found (value, mass):")
    for v, m, y in res[:12]: print(f"  {v:+.3e}  mass {m:.4f}  frac cells {int(np.sum((y>1e-6)&(y<1-1e-6)))}")
