# Plain search (floats, NOT a certificate): least entropy production over random hidden networks
# reproducing C1 = 3/10, C2 = 2/25 at Poisson sampling rate r = 2. Variant A: lamp mean free.
# Variant B: lamp mean fixed at 0 (P(on) = 1/2, as in the ring).
import numpy as np, sys, json, itertools
from scipy.optimize import minimize
from multiprocessing import Pool
r, C1T, C2T = 2.0, 0.3, 0.08

def model(theta, N, edges):
    L = np.zeros((N, N))
    for (i, j), t in zip(edges, theta): L[i, j] = np.exp(t)
    np.fill_diagonal(L, -L.sum(1))
    # stationary distribution
    A = np.vstack([L.T, np.ones(N)]); b = np.zeros(N + 1); b[-1] = 1
    pi = np.linalg.lstsq(A, b, rcond=None)[0]
    return L, pi

def stats(theta, N, edges, f):
    L, pi = model(theta, N, edges)
    K = r * np.linalg.inv(r * np.eye(N) - L)
    Kf = K @ f
    c1 = pi @ (f * Kf); c2 = pi @ (f * (K @ Kf)); m = pi @ f
    sig = 0.0
    for i in range(N):
        for j in range(i + 1, N):
            a, b_ = pi[i] * L[i, j], pi[j] * L[j, i]
            if a > 0 or b_ > 0: sig += (a - b_) * np.log(a / b_)
    return c1, c2, m, sig

def one(job):
    N, k, topo, variant, seed = job
    rng = np.random.default_rng(seed)
    f = np.array([1.0] * k + [-1.0] * (N - k))
    if topo == 'ring': edges = [(i, (i + 1) % N) for i in range(N)] + [((i + 1) % N, i) for i in range(N)]
    else: edges = [(i, j) for i in range(N) for j in range(N) if i != j]
    best = None
    for s in range(12):
        th0 = rng.normal(0.5, 1.5, len(edges))
        cons = [{'type': 'eq', 'fun': lambda t: stats(t, N, edges, f)[0] - C1T},
                {'type': 'eq', 'fun': lambda t: stats(t, N, edges, f)[1] - C2T}]
        if variant == 'B': cons.append({'type': 'eq', 'fun': lambda t: stats(t, N, edges, f)[2]})
        try:
            res = minimize(lambda t: stats(t, N, edges, f)[3], th0, method='SLSQP', constraints=cons,
                           bounds=[(-10, 10)] * len(edges), options={'maxiter': 400, 'ftol': 1e-12})
        except Exception: continue
        c1, c2, m, sig = stats(res.x, N, edges, f)
        if abs(c1 - C1T) < 1e-7 and abs(c2 - C2T) < 1e-7 and (variant == 'A' or abs(m) < 1e-7):
            if best is None or sig < best[0]: best = (sig, res.x.tolist(), m)
    return (N, k, topo, variant, seed, best)

if __name__ == '__main__':
    jobs = []
    for variant in ['A', 'B']:
        for N in range(3, 9):
            for k in range(1, N // 2 + 1):
                for topo in (['ring', 'full'] if N <= 7 else ['ring', 'full']):
                    for seed in range(3): jobs.append((N, k, topo, variant, 1000 * N + 100 * k + seed + (7 if topo == 'full' else 0) + (50000 if variant == 'B' else 0)))
    out = []
    with Pool(6) as P:
        for res in P.imap_unordered(one, jobs):
            out.append(res)
            N, k, topo, variant, seed, best = res
            print(variant, N, k, topo, seed, 'none' if best is None else '%.5f' % (best[0] / r), flush=True)
    json.dump(out, open('plain-results.json', 'w'))
