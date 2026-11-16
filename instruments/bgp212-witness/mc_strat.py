"""
45-dim MC of I and J of a witness, stratified by the number m of large coordinates, from the
pointwise Lean definitions (physical scale).  Within a stratum: large coordinates delta + u with
u by radial-uniform total and Dirichlet(ALPHA_L) shape; small coordinates by radial-uniform total
and Dirichlet(1) shape (rejected if any exceeds delta).  Membership by mc_check.inT; h(q) by
Gauss-Legendre on the pieces cut by {0, delta, B(m+1)-U, rho}, each piece kept or dropped by the
pointwise test at its midpoint (mc_corr.h_pair).
usage: python3 mc_strat.py WITNESS.json N_per_m seed
"""
import sys, json, time
import numpy as np
from math import comb, log, lgamma
import mc_corr as MC
from mc_check import inT, mono_all, delta
from core import load_witness

R, TAU = MC.R, MC.TAU


def sample(rng, n, k, Rr, alpha):
    MC.ALPHA = alpha
    return MC.sample_is(rng, n, k, Rr)


def I_m(m, n, rng, terms, maxsize, aL):
    K = 45
    if R - m * delta <= 0:
        return 0.0, 0.0
    u, lu = sample(rng, n, m, R - m * delta, aL)
    sm, ls = sample(rng, n, K - m, R, 1.0)
    t = np.column_stack([delta + u, sm])
    ok = (sm <= delta).all(axis=1) & inT(t)
    f = np.zeros(n)
    if ok.any():
        td = 4 * t[ok]
        f[ok] = MC.F_from_vals(mono_all(td, maxsize), td.sum(axis=1), terms) ** 2 * np.exp(lu[ok] + ls[ok] + log(comb(K, m)))
    return f.mean(), f.std() / np.sqrt(n)


def J_m(m, n, rng, terms, maxsize, aL):
    K = 44
    if TAU - m * delta <= 0:
        return 0.0, 0.0
    u, lu = sample(rng, n, m, TAU - m * delta, aL)
    sm, ls = sample(rng, n, K - m, TAU, 1.0)
    q = np.column_stack([delta + u, sm])
    ok = (sm <= delta).all(axis=1) & (q.sum(axis=1) <= TAU)
    f = np.zeros(n)
    if ok.any():
        h0, h = MC.h_pair(q[ok], terms, maxsize)
        f[ok] = h ** 2 * np.exp(lu[ok] + ls[ok] + log(comb(K, m)))
    return f.mean(), f.std() / np.sqrt(n)


if __name__ == '__main__':
    wf, N, seed = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    aL = float(sys.argv[4]) if len(sys.argv) > 4 else 0.7
    hdr, terms = load_witness(wf)
    maxsize = max(sum(l) for a, l, c in terms)
    rng = np.random.default_rng(seed)
    t0 = time.time()
    rI = [(m,) + I_m(m, N, rng, terms, maxsize, aL) for m in range(0, 17)]
    rJ = [(m,) + J_m(m, N, rng, terms, maxsize, aL) for m in range(0, 16)]
    I = sum(r[1] for r in rI); sI = sum(r[2] ** 2 for r in rI) ** 0.5
    J = sum(r[1] for r in rJ); sJ = sum(r[2] ** 2 for r in rJ) ** 0.5
    print(json.dumps(dict(witness=wf, N_per_m=N, seed=seed, alpha_large=aL, I_mc=I, I_se=sI, J_mc=J, J_se=sJ,
                          per_m_I=rI, per_m_J=rJ, seconds=time.time() - t0)), flush=True)
