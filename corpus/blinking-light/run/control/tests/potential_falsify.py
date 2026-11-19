"""Control-room test of POTENTIAL and AFFINE (g16, g25), written from gpt/potential-bound.md (the a, b arrays are
read from gpt/potential-refined.json, the certificate itself; no track code is used). Floats; falsification, not proof.
  P1  inequality (1): (1 - y) a(y) <= (y - m)^2 on a fine grid of [-1, 1], m = 7/25
  P2  inequality (2) on 2,000,000 random pairs of points of the diamond |h| + |d| <= 1, Gamma = 147/1000:
      [mid(b - a) Dd - mid(d) (Dh - Db)]^2 <= Gamma (Dd^2 + Dh Da)
  P3  the affine bound sigma/r >= (4000/147)[(14/25) C1 - C2 - 49/625] on random networks (any C1, C2),
      including oscillating rings, and under an optimiser pushing sigma - bound down near the target.
Exits 1 on a violation beyond 1e-12 (P1, P2, relative) or 1e-9 (P3)."""
import json, sys, numpy as np
from fractions import Fraction as Q
from scipy.optimize import minimize
rng = np.random.default_rng(16)
C = json.load(open('gpt/potential-refined.json'))
H = np.array([float(Q(x)) for x in C['h']]); A = np.array([float(Q(x)) for x in C['a']]); B = np.array([float(Q(x)) for x in C['b']])
odd = lambda xs, ys: (lambda y: np.sign(y) * np.interp(np.abs(y), xs, ys))      # odd extension; knots cover [0, 1]?
assert H[0] == 0 and abs(H[-1] - 1) < 1e-15, 'knots do not cover [0, 1]: %r' % H[-1]
a, b = odd(H, A), odd(H, B); m = 7 / 25; G = 147 / 1000
y = np.linspace(-1, 1, 2000001); p1 = np.max((1 - y) * a(y) - (y - m) ** 2)
def diamond(n):
    u = rng.random((n, 2)); s = rng.choice([-1, 1], (n, 2)); x = np.minimum(u[:, 0], 1); dd = (1 - x) * u[:, 1]
    return s[:, 0] * x, s[:, 1] * dd
h1, d1 = diamond(2000000); h2, d2 = diamond(2000000)
# also pairs close together, where the ratio is delicate
close = rng.random(2000000) < 0.5; h2 = np.where(close, np.clip(h1 + rng.normal(0, 1e-3, h1.size), -1, 1), h2)
d2 = np.where(close, np.clip(d1 + rng.normal(0, 1e-3, d1.size), -(1 - np.abs(h2)), 1 - np.abs(h2)), d2)
Dh, Dd = h1 - h2, d1 - d2; Da, Db = a(h1) - a(h2), b(h1) - b(h2)
lhs = ((b(h1) - a(h1) + b(h2) - a(h2)) / 2 * Dd - (d1 + d2) / 2 * (Dh - Db)) ** 2; rhs = G * (Dd ** 2 + Dh * Da)
p2 = np.max((lhs - rhs) / (1e-300 + np.abs(rhs) + lhs))
print('P1: largest (1-y)a(y) - (y-m)^2 on 2,000,001 grid points: %.3e' % p1)
print('P2: largest relative excess of (2) on 2,000,000 pairs (half of them close): %.3e' % p2)
def net(R, f):
    N = len(f); L = R.copy(); np.fill_diagonal(L, 0); np.fill_diagonal(L, -L.sum(1))
    Aa = np.vstack([L.T, np.ones(N)]); bb = np.zeros(N + 1); bb[-1] = 1; pi = np.linalg.lstsq(Aa, bb, rcond=None)[0]
    K = np.linalg.inv(np.eye(N) - L); c1, c2 = pi @ (f * (K @ f)), pi @ (f * (K @ K @ f))
    s = 0.0
    for i in range(N):
        for j in range(i + 1, N):
            x, yy = pi[i] * L[i, j], pi[j] * L[j, i]
            if x > 0 or yy > 0: s += (x - yy) * np.log(x / yy)
    return c1, c2, s
bound = lambda c1, c2: 4000 / 147 * (14 / 25 * c1 - c2 - 49 / 625)
p3 = np.inf; n = 0
for t in range(20000):
    N = int(rng.integers(3, 13)); k = int(rng.integers(1, N)); f = np.array([1.0] * k + [-1.0] * (N - k)); R = np.zeros((N, N))
    if t % 2:
        for i in range(N): R[i, (i + 1) % N] = np.exp(rng.normal(1, 1)); R[(i + 1) % N, i] = np.exp(rng.normal(0, 1))
    else:
        M = rng.random((N, N)) < 0.6; R = np.where(M | M.T, np.exp(rng.normal(0, 2, (N, N))), 0.0); np.fill_diagonal(R, 0)
    try: c1, c2, s = net(R, f)
    except Exception: continue
    n += 1; p3 = min(p3, s - bound(c1, c2))
best = np.inf
for N in range(4, 11):
    f = np.array([1.0] * (N // 2) + [-1.0] * (N - N // 2)); edges = [(i, (i + 1) % N) for i in range(N)] + [((i + 1) % N, i) for i in range(N)]
    for s_ in range(4):
        def obj(th):
            R = np.zeros((N, N))
            for (i, j), v in zip(edges, th): R[i, j] = np.exp(v)
            c1, c2, s = net(R, f); return s - bound(c1, c2)
        try: best = min(best, minimize(obj, rng.normal(0.5, 1, len(edges)), method='Nelder-Mead', options={'maxiter': 4000}).fun)
        except Exception: pass
print('P3: %d random networks, least sigma - affine bound %.6f; optimiser over rings of 4 to 10 states: least %.6f' % (n, p3, best))
bad = p1 > 1e-12 or p2 > 1e-12 or p3 < -1e-9 or best < -1e-9
print('RESULT:', 'a violation was found' if bad else 'no violation found'); sys.exit(1 if bad else 0)
