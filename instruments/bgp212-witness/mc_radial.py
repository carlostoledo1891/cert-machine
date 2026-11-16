"""45-dim MC of I and J for a witness with importance sampling over the TOTAL mass (the uniform
measure on the simplex concentrates near the outer face, where the witness has little mass).
Pointwise Lean definitions (physical scale) only.
  I = int_0^R s^(K-1)/(K-1)! E_Dir[F^2(s D)] ds       (s ~ Uniform[0,R])
  J = int_0^tau s^(K-2)/(K-2)! E_Dir[ int int F(sD,x) F(sD,y) dx dy ] ds, x,y ~ U[0, R - s]
"""
import sys, json, time
import numpy as np
from math import lgamma, exp, log
from mc_check import inT, Ftilde, A0, A1, eps
from core import load_witness
R = A1 + eps; TAU = A1 - eps

ALPHA = 1.0
def dirichlet(rng, n, k):
    """Dirichlet(ALPHA) sample and log of (uniform-slice density / proposal density)."""
    D = rng.dirichlet(np.full(k, ALPHA), size=n)
    D = np.clip(D, 1e-300, None)
    # uniform Dirichlet(1) density = (k-1)!; Dirichlet(alpha) density = G(k a)/G(a)^k prod D^(a-1)
    lp = lgamma(k * ALPHA) - k * lgamma(ALPHA) + (ALPHA - 1) * np.log(D).sum(axis=1)
    return D, lgamma(k) - lp

def F_phys(t, terms):
    return np.where(inT(t), Ftilde(4 * t, terms), 0.0)

def run(terms, K, N, rng, batch=50000):
    wI, wJ = [], []
    done = 0
    while done < N:
        n = min(batch, N - done)
        s = rng.random(n) * R
        D, lr = dirichlet(rng, n, K)
        t = s[:, None] * D
        lw = (K - 1) * np.log(s) - lgamma(K) + log(R) + lr
        wI.append(np.exp(lw) * F_phys(t, terms) ** 2)
        sq = rng.random(n) * TAU
        Dq, lrq = dirichlet(rng, n, K - 1)
        q = sq[:, None] * Dq
        rho = R - sq
        x = rng.random(n) * rho; y = rng.random(n) * rho
        lwq = (K - 2) * np.log(sq) - lgamma(K - 1) + log(TAU) + 2 * np.log(rho) + lrq
        Fx = F_phys(np.column_stack([q, x]), terms); Fy = F_phys(np.column_stack([q, y]), terms)
        wJ.append(np.exp(lwq) * Fx * Fy)
        done += n
    a = np.concatenate(wI); b = np.concatenate(wJ)
    return a.mean(), a.std() / np.sqrt(len(a)), b.mean(), b.std() / np.sqrt(len(b))

if __name__ == '__main__':
    wf, N, seed = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    ALPHA = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
    hdr, terms = load_witness(wf)
    rng = np.random.default_rng(seed)
    t0 = time.time()
    mi, si, mj, sj = run(terms, 45, N, rng)
    print(json.dumps(dict(witness=wf, N=N, alpha=ALPHA, I_mc=mi, I_se=si, J_mc=mj, J_se=sj, seconds=time.time() - t0)), flush=True)
