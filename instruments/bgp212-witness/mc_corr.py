"""
45-dim Monte Carlo of the CAP CORRECTIONS for a real witness, from the pointwise Lean
definitions (physical scale), by importance sampling on the configurations where they live:
  dI = I0 - I = int_{t >= 0, sum t < A1+eps, t not in T} F~(4t)^2 dt
  dJ = J0 - J = int_{q >= 0, sum q <= A1-eps} (h0(q)^2 - h(q)^2) dq
       h0(q) = int_0^{A1+eps-sum q} F~(4q,4x) dx,  h(q) = int_{x: (q,x) in T} F~(4q,4x) dx
h(q) uses only the pointwise test mc_check.inT at the midpoints of the pieces cut by the
candidate breakpoints {0, delta, B(m+1)-U, rho} (+ optional uniform grid), and Gauss-Legendre
with 12 nodes (exact for degree <= 23) on each piece.
usage: python3 mc_corr.py WITNESS.json N_per_m seed
"""
import sys, json, time
import numpy as np
from math import lgamma, log, exp, comb
from mc_check import inT, simplex_uniform, mono_all, delta, eps, A0, A1, Bcap, Ldil
from core import load_witness

R = A1 + eps
TAU = A1 - eps
B = lambda m: Bcap[min(m, 10)]
GLx, GLw = np.polynomial.legendre.leggauss(12)
ALPHA = 0.5


def sample_is(rng, n, k, Rr):
    """points in {x >= 0, sum x <= Rr} (k dims) with log importance weights 1/p(x):
    total r ~ U[0,Rr], shape ~ Dirichlet(ALPHA); returns (x, logw) so that
    int f dx over the simplex = E[f(x) exp(logw)]."""
    if k == 0:
        return np.zeros((n, 0)), np.zeros(n)
    r = rng.random(n) * Rr
    D = np.clip(rng.dirichlet(np.full(k, ALPHA), size=n), 1e-300, None)
    lp = lgamma(k * ALPHA) - k * lgamma(ALPHA) + (ALPHA - 1) * np.log(D).sum(axis=1)
    if k == 1:
        lp = np.zeros(n)
    return r[:, None] * D, log(Rr) + (k - 1) * np.log(r) - lp


def F_from_vals(vals, s_dil, terms):
    out = np.zeros(s_dil.shape[0])
    for a, lam, c in terms:
        out += float(c) * (Ldil - s_dil) ** a * vals[lam]
    return out


def add_var(base, xvar, maxsize):
    """one more DP step of mono_all with the extra variable xvar (dilated)."""
    parts = sorted(base.keys(), key=lambda p: -sum(p))
    val = {p: v.copy() for p, v in base.items()}
    x2 = xvar ** 2
    pw = [np.ones_like(xvar)]
    for k in range(1, maxsize + 1):
        pw.append(pw[-1] * x2)
    for p in parts:
        v = base[p]
        for k in range(1, maxsize - sum(p) + 1):
            q = tuple(sorted(p + (k,), reverse=True))
            val[q] += pw[k] * v
    return val


def dI_m(m, n, rng, terms, maxsize):
    K = 45
    lo = max(B(m), m * delta)
    Rs = R - lo
    if Rs <= 0 or R - m * delta <= 0:
        return 0.0, 0.0
    u, lu = sample_is(rng, n, m, R - m * delta)
    sm, ls = sample_is(rng, n, K - m, Rs)
    t = np.column_stack([delta + u, sm])
    ok = (sm <= delta).all(axis=1) & (t.sum(axis=1) < R) & (~inT(t))
    logv = lu + ls + log(comb(K, m))
    f = np.zeros(n)
    if ok.any():
        td = 4 * t[ok]
        vals = mono_all(td, maxsize)
        f[ok] = F_from_vals(vals, td.sum(axis=1), terms) ** 2 * np.exp(logv[ok])
    return f.mean(), f.std() / np.sqrt(n)


def h_pair(q, terms, maxsize, grid=0):
    """h0(q), h(q) for a batch q (physical, n x 44), pointwise membership."""
    n = q.shape[0]
    qd = 4 * q
    base = mono_all(qd, maxsize)
    sq = q.sum(axis=1)
    rho = R - sq
    large = q > delta
    mq = large.sum(axis=1)
    U = np.where(large, q, 0).sum(axis=1)
    capx = np.array([B(int(k) + 1) for k in mq]) - U
    cands = [np.zeros(n), np.full(n, delta), capx, rho]
    for j in range(1, grid + 1):
        cands.append(rho * j / (grid + 1))
    P = np.sort(np.column_stack([np.clip(c, 0, rho) for c in cands]), axis=1)

    def integ(a, b):
        tot = np.zeros(n)
        for xg, wg in zip(GLx, GLw):
            x = (a + b) / 2 + (b - a) / 2 * xg
            vals = add_var(base, 4 * x, maxsize)
            tot += wg * (b - a) / 2 * F_from_vals(vals, 4 * (sq + x), terms)
        return tot
    h0 = integ(np.zeros(n), rho)
    h = np.zeros(n)
    for j in range(P.shape[1] - 1):
        a, b = P[:, j], P[:, j + 1]
        mid = (a + b) / 2
        mem = (b > a) & inT(np.column_stack([q, mid])) & (sq + mid >= A0 + eps) & (sq + mid <= A1 + eps) & (sq <= TAU)
        if mem.any():
            h = h + np.where(mem, integ(a, b), 0.0)
    return h0, h


def dJ_m(m, n, rng, terms, maxsize):
    K = 44
    if TAU - m * delta <= 0:
        return 0.0, 0.0
    Rs = max(TAU - max(B(m), m * delta), R - B(m + 1), 0.0)
    if Rs <= 0:
        return 0.0, 0.0
    u, lu = sample_is(rng, n, m, TAU - m * delta)
    sm, ls = sample_is(rng, n, K - m, Rs)
    q = np.column_stack([delta + u, sm])
    ok = (sm <= delta).all(axis=1) & (q.sum(axis=1) <= TAU)
    logv = lu + ls + log(comb(K, m))
    f = np.zeros(n)
    if ok.any():
        h0, h = h_pair(q[ok], terms, maxsize)
        f[ok] = (h0 ** 2 - h ** 2) * np.exp(logv[ok])
    return f.mean(), f.std() / np.sqrt(n)


if __name__ == '__main__':
    wf, N, seed = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    hdr, terms = load_witness(wf)
    maxsize = max(sum(l) for a, l, c in terms)
    rng = np.random.default_rng(seed)
    t0 = time.time()
    # (0) the region claim: q drawn uniformly from {sum q <= tau} OUTSIDE the proposal support of
    #     every m must have h == h0 (fine grid of extra breakpoints).
    q = simplex_uniform(rng, 3000, 44, TAU)
    h0, h = h_pair(q, terms, maxsize, grid=16)
    large = q > delta
    mq = large.sum(axis=1); U = np.where(large, q, 0).sum(axis=1); V = q.sum(axis=1) - U
    inside = np.array([(U[i] > B(int(mq[i]))) or (V[i] < R - B(int(mq[i]) + 1)) for i in range(len(q))])
    rel = np.abs(h0 - h)[~inside] / (np.abs(h0[~inside]) + 1e-300)
    print(json.dumps(dict(check='h==h0 outside the correction support', n_outside=int((~inside).sum()),
                          n_inside=int(inside.sum()), max_rel_diff=float(rel.max()) if rel.size else None)), flush=True)
    resI, resJ = [], []
    for m in range(1, 17):
        v, s = dI_m(m, N, rng, terms, maxsize)
        resI.append((m, v, s))
    for m in range(0, 16):
        v, s = dJ_m(m, N, rng, terms, maxsize)
        resJ.append((m, v, s))
    dI = sum(v for _, v, _ in resI); sI = sum(s * s for _, _, s in resI) ** 0.5
    dJ = sum(v for _, v, _ in resJ); sJ = sum(s * s for _, _, s in resJ) ** 0.5
    out = dict(witness=wf, N_per_m=N, seed=seed, dI_mc=dI, dI_se=sI, dJ_mc=dJ, dJ_se=sJ,
               per_m_I=resI, per_m_J=resJ, seconds=time.time() - t0)
    print(json.dumps(out), flush=True)
