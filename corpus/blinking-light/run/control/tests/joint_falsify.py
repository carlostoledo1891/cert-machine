"""Control-room test of JOINT (g9), written from the text of gpt/joint-bound.md (no track code read).
Floats; a falsification attempt, not a proof. With r = 1, A0 = (L - L*)/2, P = (I - L/lambda)^-1, S, A its
symmetric and skew parts, B = (I + t(I - S))^-1, T = BA, it checks on random networks:
  E1  |<v, A0 w>|^2 <= g ||w||_inf^2 E(v)      for random v, w            (inequality (1))
  E2  (lambda/g)|<z, Af>|^2 <= <z, S(I - S)z> - ||Az||^2   for random z    (inequality (2))
  E3  max over unit n of ||Z||^2 + (lambda/g)<Z, f>^2 <= 1, Z = 2 sqrt(lambda) T*n   (inequality (3), as an eigenvalue)
  ID  d = T(f + t h)
  END g >= 4 delta lambda^2/[(1 + tc)^2 - 4 lambda delta] for t in a grid with t^2 <= 4 lambda, and at t = 2 + 2 sqrt 2
and under an optimiser pushing g/bound(t = 2 + 2 sqrt 2) down. Exits 1 on a violation beyond 1e-9 relative."""
import numpy as np, sys
from scipy.optimize import minimize
rng = np.random.default_rng(29)
TSTAR = 2 + 2 * np.sqrt(2)

def base(R, f):
    N = len(f); L = R.copy(); np.fill_diagonal(L, 0); np.fill_diagonal(L, -L.sum(1))
    Aa = np.vstack([L.T, np.ones(N)]); b = np.zeros(N + 1); b[-1] = 1
    pi = np.linalg.lstsq(Aa, b, rcond=None)[0]
    adj = lambda M: (M.T * pi[None, :]) / pi[:, None]
    g = 0.0
    for i in range(N):
        for j in range(i + 1, N):
            x, y = pi[i] * L[i, j], pi[j] * L[j, i]
            if x > 0 or y > 0: g += (x - y) * np.log(x / y)
    return N, L, pi, adj, g

def checks(R, f, ts, inner=True):
    N, L, pi, adj, g = base(R, f)
    ip = lambda x, y: pi @ (x * y)
    K = np.linalg.inv(np.eye(N) - L); u, v = K @ f, adj(K) @ f
    c, q = ip(f, u), ip(u, v); h, d = (u + v) / 2, (u - v) / 2; delta = c * c - q
    o = dict(e1=np.inf, e2=np.inf, e3=np.inf, idres=0.0, end=np.inf, delta=delta, g=g)
    A0 = (L - adj(L)) / 2
    if inner:
        for _ in range(20):
            vv, ww = rng.normal(size=N), rng.normal(size=N)
            E = -ip(vv, L @ vv)
            o['e1'] = min(o['e1'], (g * np.max(np.abs(ww)) ** 2 * E - ip(vv, A0 @ ww) ** 2) / (1 + abs(g * E)))
    for t in ts:
        lam = 1 + t; P = np.linalg.inv(np.eye(N) - L / lam); Ps = adj(P)
        S, A = (P + Ps) / 2, (P - Ps) / 2; B = np.linalg.inv(np.eye(N) + t * (np.eye(N) - S)); T = B @ A
        o['idres'] = max(o['idres'], np.max(np.abs(d - T @ (f + t * h))))
        if g > 1e-12:
            if inner:
                for _ in range(10):
                    z = rng.normal(size=N)
                    rhs = ip(z, S @ z) - ip(S @ z, S @ z) - ip(A @ z, A @ z)
                    o['e2'] = min(o['e2'], (rhs - lam / g * ip(z, A @ f) ** 2) / (1 + abs(rhs)))
            Tf = T @ f; Ts = adj(T)                                   # E3 as the top eigenvalue of 4 lam (T T* + (lam/g) Tf Tf*)
            D = np.diag(np.sqrt(pi)); Di = np.diag(1 / np.sqrt(pi))
            M = 4 * lam * (T @ Ts + (lam / g) * np.outer(Tf, Tf * pi))
            Ms = D @ M @ Di; top = np.max(np.linalg.eigvalsh((Ms + Ms.T) / 2))
            o['e3'] = min(o['e3'], 1 - top)
        if delta > 1e-9 and t * t <= 4 * lam + 1e-12:
            o['end'] = min(o['end'], g / (4 * delta * lam ** 2 / ((1 + t * c) ** 2 - 4 * lam * delta)))
    return o

ts = [0.0, 1.0, 2.0, 3.0, 4.0, 4.5, TSTAR]
W = dict(e1=np.inf, e2=np.inf, e3=np.inf, idres=0.0, end=np.inf); n = pos = 0
for trial in range(4000):
    if trial % 2:
        N = int(rng.integers(3, 13)); k = int(rng.integers(1, N)); f = np.array([1.0] * k + [-1.0] * (N - k)); R = np.zeros((N, N))
        for i in range(N): R[i, (i + 1) % N] = np.exp(rng.normal(1, 1)); R[(i + 1) % N, i] = np.exp(rng.normal(0, 1))
    else:
        N = int(rng.integers(3, 9)); f = rng.choice([-1.0, 1.0], N)
        if abs(f.sum()) == N: f[0] = -f[0]
        M = (rng.random((N, N)) < 0.7); R = np.where(M | M.T, np.exp(rng.normal(0, 2, (N, N))), 0.0); np.fill_diagonal(R, 0)
    try: x = checks(R, f, ts)
    except Exception: continue
    n += 1
    for k_ in ('e1', 'e2', 'e3'): W[k_] = min(W[k_], x[k_])
    W['idres'] = max(W['idres'], x['idres'])
    if x['delta'] > 1e-9: pos += 1; W['end'] = min(W['end'], x['end'])
print('random networks: %d checked, %d with C2 - C1^2 < -1e-9' % (n, pos))
print('  least margins: (1) %.3e  (2) %.3e  (3) %.3e;  identity residual most %.3e' % (W['e1'], W['e2'], W['e3'], W['idres']))
print('  least g / bound over the t grid: %.6f' % W['end'])
best = np.inf
for N in range(3, 9):
    for k in range(1, N // 2 + 1):
        f = np.array([1.0] * k + [-1.0] * (N - k)); edges = [(i, j) for i in range(N) for j in range(N) if i != j]
        for s in range(3):
            def obj(th):
                R = np.zeros((N, N))
                for (i, j), v in zip(edges, th): R[i, j] = np.exp(v)
                x = checks(R, f, [TSTAR], inner=False)
                return x['end'] if x['delta'] > 1e-6 else 1e6
            t0 = np.array([rng.normal(1.5, .5) if j == (i + 1) % N else rng.normal(0, .5) if i == (j + 1) % N else rng.normal(-4, 1) for (i, j) in edges])
            try: best = min(best, minimize(obj, t0, method='Nelder-Mead', options={'maxiter': 3000}).fun)
            except Exception: pass
print('  optimiser pushing g / bound(t = 2 + 2 sqrt 2) down (complete graphs, 3 to 8 states): least ratio %.6f' % best)
bad = min(W['e1'], W['e2'], W['e3']) < -1e-9 or W['idres'] > 1e-8 or W['end'] < 1 - 1e-9 or best < 1 - 1e-9
print('RESULT:', 'a step or the bound FAILS' if bad else 'no violation found'); sys.exit(1 if bad else 0)
