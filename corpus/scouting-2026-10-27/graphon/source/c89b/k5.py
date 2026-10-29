"""K5 Ramsey multiplicity: float evaluation and projected-gradient refinement of a step graphon.

c5(W) = t(K5, W) + t(K5, 1 - W) for an m-block step graphon with equal block weights, where
t(K5, W) = (1/m^5) sum_{i,j} W_ij tr((diag(W_i * W_j) W)^3).
dc5/dW_ab = (10 c_ab / m^5) [T3_ab(W) - T3_ab(1-W)], c_ab = 2 (a != b) or 1, T3_ab(W) = tr((diag(W_a*W_b) W)^3).
Search only; candidates are certified by exact5.py.

usage: k5.py eval in.json[.gz]
       k5.py refine in.json[.gz] out.json.gz steps [split]
       k5.py fromg6 graph6_file out.json.gz
"""
import gzip, json, sys, time
import numpy as np


def load(p):
    d = json.load(gzip.open(p) if p.endswith('.gz') else open(p))
    R = np.array(d['red_probability_numerators'], dtype=np.float64)
    return d, R / d['edge_probability_denominator']


def g6_adj(line):
    s = line.strip(); b = [ord(c) - 63 for c in s]
    if b[0] < 63: n, b = b[0], b[1:]
    else: n, b = (b[1] << 12) | (b[2] << 6) | b[3], b[4:]
    bits = [(x >> (5 - k)) & 1 for x in b for k in range(6)]
    A = np.zeros((n, n), dtype=np.int64); t = 0
    for j in range(1, n):
        for i in range(j):
            A[i, j] = A[j, i] = bits[t]; t += 1
    return A


def T3_all(W):
    """T[a,b] = tr((diag(W_a*W_b) W)^3) for all a, b."""
    m = W.shape[0]; T = np.empty((m, m))
    for a in range(m):
        U = W * W[a][None, :]                      # row b: u = W_a * W_b
        for b in range(a, m):
            u = U[b]; X = W * u[None, :]           # X = W diag(u); tr((diag(u) W)^3) = tr(X^3)
            T[a, b] = T[b, a] = np.sum((X @ X) * X.T)
    return T


def c5_and_grad(W):
    m = W.shape[0]
    Tr, Tb = T3_all(W), T3_all(1.0 - W)
    c = (np.sum(W * Tr) + np.sum((1.0 - W) * Tb)) / m ** 5
    coef = np.where(np.eye(m, dtype=bool), 1.0, 2.0)
    g = 10.0 * coef * (Tr - Tb) / m ** 5          # derivative w.r.t. the symmetric variable W_ab (a <= b)
    return c, g


def save(W, d, path, D=1 << 20):
    R = np.rint(W * D).astype(np.int64); R = np.minimum(R, R.T)
    out = dict(schema='rational-step-graphon-v1', edge_probability_denominator=D,
               block_weights=[1] * W.shape[0], red_probability_numerators=R.tolist())
    json.dump(out, gzip.open(path, 'wt'))


def main():
    cmd = sys.argv[1]
    if cmd == 'fromg6':
        A = g6_adj(open(sys.argv[2]).readline())
        out = dict(schema='rational-step-graphon-v1', edge_probability_denominator=1,
                   block_weights=[1] * A.shape[0], red_probability_numerators=A.tolist())
        json.dump(out, gzip.open(sys.argv[3], 'wt')); print('n =', A.shape[0], 'degree', set(A.sum(1).tolist())); return
    d, W = load(sys.argv[2])
    if cmd == 'eval':
        t0 = time.time(); c, _ = c5_and_grad(W); print(f"m={W.shape[0]} c5={c:.15f} ({time.time()-t0:.0f}s)"); return
    steps = int(sys.argv[4])
    if len(sys.argv) > 5 and sys.argv[5] == 'split':     # split every block in two, tiny symmetric noise
        W = np.kron(W, np.ones((2, 2))); rng = np.random.default_rng(0)
        N = rng.normal(0, 1e-4, W.shape); W = np.clip(W + (N + N.T) / 2, 0, 1)
    c, g = c5_and_grad(W); print(f"start m={W.shape[0]} c5={c:.15f}", flush=True)
    eta = 0.05; best = c
    for it in range(steps):
        t0 = time.time()
        while True:
            Wn = np.clip(W - eta * g / np.abs(g).max(), 0.0, 1.0)
            cn, gn = c5_and_grad(Wn)
            if cn < c or eta < 1e-7: break
            eta /= 3
        if cn >= c: print('no descent; stop', flush=True); break
        W, c, g = Wn, cn, gn; eta *= 1.6
        print(f"it={it} c5={c:.15f} gain={best-c:.3e} eta={eta:.2e} ({time.time()-t0:.0f}s)", flush=True)
        save(W, d, sys.argv[3])


if __name__ == '__main__':
    main()
