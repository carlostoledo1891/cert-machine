"""
Monte Carlo from the POINTWISE definitions of the Lean file, in the PHYSICAL scale:
  T: every t_i in [0,1], sum t in [A0+eps, A1+eps), large = {t_i > delta}, sum_large <= B(|large|)
  Jregion: sum q <= A1-eps, sum q + x and sum q + y in [A0+eps, A1+eps]
  F(t) = F~(4t) on T, 0 off T, F~(x) = sum c (L - |x|_1)^a m_alpha(x)
Estimates I(F) and J(F); no cell decomposition is used.
"""
import numpy as np
from itertools import permutations
from math import lgamma, exp, log

delta, eps = 41 / 2500, 1 / 125
A0, A1 = -1 / 125, 257 / 1000
Bcap = [0, 777, 794, 875, 917, 953, 983, 1016, 1042, 1063, 1081]
Bcap = np.array([b / 5000 for b in Bcap])
Ldil = 53 / 50


def capB(m):
    return Bcap[np.minimum(m, 10)]


def inT(t):
    s = t.sum(axis=1)
    ok = np.all((t >= 0) & (t <= 1), axis=1) & (s >= A0 + eps) & (s < A1 + eps)
    large = t > delta
    m = large.sum(axis=1)
    sl = np.where(large, t, 0).sum(axis=1)
    return ok & (sl <= capB(m))


def mono_sym(x, lam):
    """m_lam(x) for even-exponent partition lam (halved), by explicit distinct permutations
    (small K) or closed forms via power sums for len(lam) <= 2 (any K)."""
    K = x.shape[1]
    if len(lam) == 0:
        return np.ones(x.shape[0])
    if K <= 6:
        vec = [2 * p for p in lam] + [0] * (K - len(lam))
        out = np.zeros(x.shape[0])
        for u in set(permutations(vec)):
            out += np.prod(x ** np.array(u), axis=1)
        return out
    if len(lam) == 1:
        return (x ** (2 * lam[0])).sum(axis=1)
    if len(lam) == 2:
        a, b = 2 * lam[0], 2 * lam[1]
        pa, pb, pab = (x ** a).sum(1), (x ** b).sum(1), (x ** (a + b)).sum(1)
        return (pa * pb - pab) / 2 if a == b else pa * pb - pab
    raise ValueError("unsupported")


def mono_all(x, maxsize):
    """all m_lam(x), |lam| <= maxsize (halved), by a DP over variables: each variable takes
    at most one part; processing larger partitions first keeps each step's input old."""
    from core import partitions_upto
    parts = partitions_upto(maxsize)
    parts.sort(key=lambda p: -sum(p))
    val = {p: np.zeros(x.shape[0]) for p in parts}
    val[()] = np.ones(x.shape[0])
    ext = {p: [(k, tuple(sorted(p + (k,), reverse=True))) for k in range(1, maxsize - sum(p) + 1)] for p in parts}
    for i in range(x.shape[1]):
        xi2 = x[:, i] ** 2
        pw = [np.ones(x.shape[0])]
        for k in range(1, maxsize + 1):
            pw.append(pw[-1] * xi2)
        for p in parts:
            v = val[p]
            if not v.any():
                continue
            for k, q in ext[p]:
                val[q] += pw[k] * v
    return val


def Ftilde(xd, terms):
    s = xd.sum(axis=1)
    out = np.zeros(xd.shape[0])
    big = [lam for a, lam, c in terms if len(lam) > 2 and xd.shape[1] > 6]
    allm = mono_all(xd, max(sum(l) for a, l, c in terms)) if big else None
    for a, lam, c in terms:
        mv = allm[lam] if allm is not None else mono_sym(xd, lam)
        out += c * (Ldil - s) ** a * mv
    return out


def F_phys(t, terms):
    return np.where(inT(t), Ftilde(4 * t, terms), 0.0)


def simplex_uniform(rng, n, k, R):
    # uniform in the k-simplex {t>=0, sum<=R}: Dirichlet(1,...,1) on k+1 parts, drop the slack
    e = rng.exponential(size=(n, k + 1))
    return R * e[:, :k] / e.sum(axis=1, keepdims=True)


def logvol_simplex(k, R):
    return k * log(R) - lgamma(k + 1)


def mc_I(terms, K, N, rng, batch=200000):
    R = A1 + eps
    vals = []
    done = 0
    while done < N:
        n = min(batch, N - done)
        t = simplex_uniform(rng, n, K, R)
        vals.append(F_phys(t, terms) ** 2)
        done += n
    v = np.concatenate(vals)
    V = exp(logvol_simplex(K, R))
    return V * v.mean(), V * v.std() / np.sqrt(len(v))


def mc_J(terms, K, N, rng, batch=200000):
    Rq = A1 - eps
    R = A1 + eps
    vals = []
    done = 0
    while done < N:
        n = min(batch, N - done)
        q = simplex_uniform(rng, n, K - 1, Rq)
        x = rng.random(n) * R
        y = rng.random(n) * R
        sq = q.sum(axis=1)
        reg = (sq <= A1 - eps) & (sq + x >= A0 + eps) & (sq + x <= A1 + eps) & (sq + y >= A0 + eps) & (sq + y <= A1 + eps)
        Fx = F_phys(np.column_stack([q, x]), terms)
        Fy = F_phys(np.column_stack([q, y]), terms)
        vals.append(np.where(reg, Fx * Fy, 0.0))
        done += n
    v = np.concatenate(vals)
    V = exp(logvol_simplex(K - 1, Rq)) * R * R
    return V * v.mean(), V * v.std() / np.sqrt(len(v))
