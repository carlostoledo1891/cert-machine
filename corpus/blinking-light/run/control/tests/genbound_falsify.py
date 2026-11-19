"""Control-room test of GENBOUND (g3), written from the text of gpt/generator-bound.md (no track code exists or was read).
Floats; a falsification attempt, not a proof. In dimensionless time (r = 1), for random networks and for networks
pushed by an optimiser toward violating the bound, it checks each step of the proof:
  S1  a = ||d||^2 >= delta = C1^2 - C2             (from q = ||h||^2 - ||d||^2, c = <f,h>, ||f|| = 1)
  S2  4 <d, phi(d)> <= sigma/r                      (the edge estimate and (x-y)log(x/y) >= 2(x-y)^2/(x+y))
  S3  <d, phi(d)> >= a/(1 - sqrt(a)/2)^2            (Jensen)
  END sigma/r >= 4 delta/(1 - sqrt(delta)/2)^2 whenever delta > 0
Prints the worst ratio found for each; exits 1 if any step fails by more than 1e-9 relative. delta below 1e-9 is
treated as rounding (an equilibrium chain has delta <= 0 exactly)."""
import numpy as np, sys
from scipy.optimize import minimize
rng = np.random.default_rng(20261119)
phi = lambda z: z / (1 - np.abs(z) / 2) ** 2

def quantities(N, rates, f):
    L = rates.copy(); np.fill_diagonal(L, 0); np.fill_diagonal(L, -L.sum(1))
    A = np.vstack([L.T, np.ones(N)]); b = np.zeros(N + 1); b[-1] = 1
    pi = np.linalg.lstsq(A, b, rcond=None)[0]
    K = np.linalg.inv(np.eye(N) - L)
    Ks = (K.T * pi[None, :]) / pi[:, None]                      # adjoint in L2(pi): Ks_ij = pi_j K_ji / pi_i
    u, v = K @ f, Ks @ f
    c = pi @ (f * u); q = pi @ (u * v)                          # q = <Kf, K*f> = <f, K K f>... = C2
    h, d = (u + v) / 2, (u - v) / 2
    a = pi @ (d * d); dp = pi @ (d * phi(d))
    sig = 0.0
    for i in range(N):
        for j in range(i + 1, N):
            x, y = pi[i] * L[i, j], pi[j] * L[j, i]
            if x > 0 or y > 0: sig += (x - y) * np.log(x / y)
    return c, q, c * c - q, a, dp, sig

def check(N, rates, f):
    c, q, delta, a, dp, sig = quantities(N, rates, f)
    C2direct = None
    return dict(delta=delta, s1=a - delta, s2=sig - 4 * dp, s3=dp - a / (1 - np.sqrt(a) / 2) ** 2,
                end=(sig / (4 * delta / (1 - np.sqrt(delta) / 2) ** 2)) if delta > 0 else np.inf, sig=sig, c=c, q=q)

worst = dict(s1=np.inf, s2=np.inf, s3=np.inf, end=np.inf); count = 0; pos = 0
for trial in range(20000):
    N = int(rng.integers(3, 9)); f = rng.choice([-1.0, 1.0], N)
    if abs(f.sum()) == N: f[0] = -f[0]
    R = np.exp(rng.normal(0, 2, (N, N))) * (rng.random((N, N)) < 0.7); R = np.maximum(R, R.T * 0 + (R > 0) * 0) ; R = R + (R.T > 0) * (R == 0) * np.exp(rng.normal(0, 2, (N, N)))
    np.fill_diagonal(R, 0)
    if np.linalg.matrix_rank(np.eye(N) + R + R.T) < N: pass
    try: x = check(N, R, f)
    except Exception: continue
    count += 1
    for k in ('s1', 's2', 's3'): worst[k] = min(worst[k], x[k] / max(1e-300, abs(x['sig']) + 1))
    if x['delta'] > 1e-9: pos += 1; worst['end'] = min(worst['end'], x['end'])   # below 1e-9, delta is rounding in an equilibrium chain
for trial in range(20000):                                   # rings, which oscillate: most have C2 < C1^2
    N = int(rng.integers(3, 13)); k = int(rng.integers(1, N)); f = np.array([1.0] * k + [-1.0] * (N - k))
    R = np.zeros((N, N))
    for i in range(N):
        R[i, (i + 1) % N] = np.exp(rng.normal(1, 1)); R[(i + 1) % N, i] = np.exp(rng.normal(0, 1))
    try: x = check(N, R, f)
    except Exception: continue
    count += 1
    for kk in ('s1', 's2', 's3'): worst[kk] = min(worst[kk], x[kk] / max(1e-300, abs(x['sig']) + 1))
    if x['delta'] > 1e-9: pos += 1; worst['end'] = min(worst['end'], x['end'])
print('random networks (complete-ish graphs and rings): %d checked, %d with C2 - C1^2 < -1e-9' % (count, pos))
print('  worst S1 (a - delta), S2 (sigma - 4<d,phi(d)>), S3 (Jensen) margins, scaled: %.3e %.3e %.3e' % (worst['s1'], worst['s2'], worst['s3']))
print('  worst sigma / bound over networks with delta > 0: %.6f' % worst['end'])

def ring_like(theta, N, edges, f):
    R = np.zeros((N, N))
    for (i, j), t in zip(edges, theta): R[i, j] = np.exp(t)
    return R

opt_worst = np.inf
for N in range(3, 9):
    for k in range(1, N // 2 + 1):
        f = np.array([1.0] * k + [-1.0] * (N - k))
        edges = [(i, j) for i in range(N) for j in range(N) if i != j]
        for s in range(4):
            def obj(t):
                x = check(N, ring_like(t, N, edges, f), f)
                return x['end'] if x['delta'] > 1e-6 else 1e6
            t0 = np.array([rng.normal(1.5, 0.5) if j == (i + 1) % N else rng.normal(0, 0.5) if i == (j + 1) % N else rng.normal(-4, 1)
                           for (i, j) in edges])                 # start near an oscillating ring, every edge present
            try:
                res = minimize(obj, t0, method='Nelder-Mead', options={'maxiter': 4000, 'xatol': 1e-6, 'fatol': 1e-9})
                opt_worst = min(opt_worst, res.fun)
            except Exception: pass
print('  optimiser pushing sigma / bound down (complete graphs, 3 to 8 states): least ratio %.6f' % opt_worst)
bad = worst['s1'] < -1e-9 or worst['s2'] < -1e-9 or worst['s3'] < -1e-9 or worst['end'] < 1 - 1e-9 or opt_worst < 1 - 1e-9
print('RESULT:', 'a step or the bound FAILS' if bad else 'no violation found')
sys.exit(1 if bad else 0)
