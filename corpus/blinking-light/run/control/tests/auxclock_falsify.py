"""Control-room test of AUXCLOCK (g7), written from the text of gpt/auxiliary-clock.md (no track code read).
Floats; a falsification attempt, not a proof. With r = 1, lambda = 1 + t, P = (I - L/lambda)^-1, S = (P + P*)/2,
A = (P - P*)/2, B = (I + t(I - S))^-1, T = BA (adjoints in L2(pi)), K = (I - L)^-1, h, d from Kf and K*f, it checks
  O1  ||T|| <= 1/(2 sqrt(lambda))          (operator norm in L2(pi))
  O2  ||Tf|| <= sqrt(g)/(2 lambda)
  ID  d = T(f + t h)                        (an identity; residual printed)
  C   c = C1 >= 0
  END g >= delta(1+t)[4(1+t) - t^2]/[1 + 2ct + qt^2] for t in a grid with t^2 < 4(1+t)
on random networks (complete-ish graphs and oscillating rings) and under an optimiser pushing g/bound down.
Exits 1 on a violation beyond 1e-9 relative."""
import numpy as np, sys
from scipy.optimize import minimize
rng = np.random.default_rng(1911)

def ops(R, f):
    N = len(f); L = R.copy(); np.fill_diagonal(L, 0); np.fill_diagonal(L, -L.sum(1))
    A_ = np.vstack([L.T, np.ones(N)]); b = np.zeros(N + 1); b[-1] = 1
    pi = np.linalg.lstsq(A_, b, rcond=None)[0]
    D = np.diag(np.sqrt(pi)); Di = np.diag(1 / np.sqrt(pi))
    adj = lambda M: (M.T * pi[None, :]) / pi[:, None]
    g = 0.0
    for i in range(N):
        for j in range(i + 1, N):
            x, y = pi[i] * L[i, j], pi[j] * L[j, i]
            if x > 0 or y > 0: g += (x - y) * np.log(x / y)
    K = np.linalg.inv(np.eye(N) - L); u, v = K @ f, adj(K) @ f
    c, q = pi @ (f * u), pi @ (u * v); h, d = (u + v) / 2, (u - v) / 2
    return N, L, pi, D, Di, adj, g, c, q, h, d

def checks(R, f, ts):
    N, L, pi, D, Di, adj, g, c, q, h, d = ops(R, f)
    nrm = lambda x: np.sqrt(pi @ (x * x))
    out = dict(c=c, g=g, delta=c * c - q, worst=np.inf, o1=np.inf, o2=np.inf, idres=0.0)
    for t in ts:
        lam = 1 + t; P = np.linalg.inv(np.eye(N) - L / lam); Ps = adj(P)
        S, A = (P + Ps) / 2, (P - Ps) / 2; B = np.linalg.inv(np.eye(N) + t * (np.eye(N) - S)); T = B @ A
        opnorm = np.linalg.norm(D @ T @ Di, 2)                      # operator norm in L2(pi)
        out['o1'] = min(out['o1'], 1 / (2 * np.sqrt(lam)) - opnorm)
        out['o2'] = min(out['o2'], np.sqrt(max(g, 0)) / (2 * lam) - nrm(T @ f))
        out['idres'] = max(out['idres'], np.max(np.abs(d - T @ (f + t * h))))
        dl = out['delta']
        if dl > 1e-9 and t * t < 4 * (1 + t):
            bound = dl * (1 + t) * (4 * (1 + t) - t * t) / (1 + 2 * c * t + q * t * t)
            out['worst'] = min(out['worst'], g / bound)
    return out

ts = [0.0, 0.5, 1.0, 1.5, 1.9, 2.5, 3.0, 4.0, 4.8]
W = dict(o1=np.inf, o2=np.inf, idres=0.0, c=np.inf, end=np.inf); n = pos = 0
for trial in range(6000):
    if trial % 2:
        N = int(rng.integers(3, 13)); k = int(rng.integers(1, N)); f = np.array([1.0] * k + [-1.0] * (N - k)); R = np.zeros((N, N))
        for i in range(N): R[i, (i + 1) % N] = np.exp(rng.normal(1, 1)); R[(i + 1) % N, i] = np.exp(rng.normal(0, 1))
    else:
        N = int(rng.integers(3, 9)); f = rng.choice([-1.0, 1.0], N); f[0] = -f[-1] if abs(f.sum()) == N else f[0]
        M = np.exp(rng.normal(0, 2, (N, N))) * (rng.random((N, N)) < 0.7); R = np.where((M > 0) | (M.T > 0), np.exp(rng.normal(0, 2, (N, N))), 0.0); np.fill_diagonal(R, 0)
    try: x = checks(R, f, ts)
    except Exception: continue
    n += 1
    W['o1'] = min(W['o1'], x['o1']); W['o2'] = min(W['o2'], x['o2']); W['idres'] = max(W['idres'], x['idres']); W['c'] = min(W['c'], x['c'])
    if x['delta'] > 1e-9: pos += 1; W['end'] = min(W['end'], x['worst'])
print('random networks: %d checked, %d with C2 - C1^2 < -1e-9' % (n, pos))
print('  O1 margin (1/(2 sqrt(lambda)) - ||T||) least %.3e;  O2 margin least %.3e;  identity residual most %.3e;  least C1 %.3e' % (W['o1'], W['o2'], W['idres'], W['c']))
print('  least g / bound over the t grid: %.6f' % W['end'])
best = np.inf
for N in range(3, 9):
    for k in range(1, N // 2 + 1):
        f = np.array([1.0] * k + [-1.0] * (N - k)); edges = [(i, j) for i in range(N) for j in range(N) if i != j]
        for s in range(3):
            def obj(th):
                R = np.zeros((N, N))
                for (i, j), v in zip(edges, th): R[i, j] = np.exp(v)
                x = checks(R, f, [1.9])
                return x['worst'] if x['delta'] > 1e-6 else 1e6
            t0 = np.array([rng.normal(1.5, .5) if j == (i + 1) % N else rng.normal(0, .5) if i == (j + 1) % N else rng.normal(-4, 1) for (i, j) in edges])
            try: best = min(best, minimize(obj, t0, method='Nelder-Mead', options={'maxiter': 3000}).fun)
            except Exception: pass
print('  optimiser pushing g / bound(t = 19/10) down (complete graphs, 3 to 8 states): least ratio %.6f' % best)
bad = W['o1'] < -1e-9 or W['o2'] < -1e-9 or W['idres'] > 1e-8 or W['c'] < -1e-9 or W['end'] < 1 - 1e-9 or best < 1 - 1e-9
print('RESULT:', 'a step or the bound FAILS' if bad else 'no violation found'); sys.exit(1 if bad else 0)
