#!/usr/bin/env python3
"""holes.py — the deepest empty cap of a kissing configuration, PROPOSED in floating point.

A kissing configuration C (unit directions, pairwise angle >= 60 degrees) can take one
more sphere exactly when some unit u makes an angle >= 60 degrees with every c in C,
i.e. when

        min over unit u of  h(u) = max_c <u, c>   <=   1/2.

h is the support function of K = conv(C), so the minimum over the sphere is the distance
from the origin to the boundary of K: the deepest empty cap is centred on the normal of
K's nearest facet, and its angular radius is arccos(that distance). This file only
PROPOSES: it searches for the nearest facet in floating point and reports the candidate
(its normal, its eleven supporting codewords, the angle). Nothing here decides anything;
a hole is certified exactly elsewhere, and "no hole is deeper" needs a covering proof.

    python3 holes.py [--samples N] [--keep K] [--seed S] [--out FILE]

Configurations read (all from corpus/kissing, pinned there): the Station's three 604s in
Q(sqrt2), EinsteinArena's 604 in Z[sqrt2], AlphaEvolve's 593 and EinsteinArena's 594.
"""
import argparse, json, math, os, sys, time
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
K = os.path.join(ROOT, 'corpus', 'kissing')
S2 = math.sqrt(2.0)


def load_configs():
    out = {}
    st = json.load(open(os.path.join(K, 'station-d11-604.json')))
    for i, cfg in enumerate(st['configs']):
        out[f'station-604-{i + 1}'] = np.array([[a + b * S2 for a, b in row] for row in cfg], float)
    ea = json.load(open(os.path.join(K, 'ea-d11-604.json')))
    out['einsteinarena-604'] = np.array([[v[2 * k] + v[2 * k + 1] * S2 for k in range(11)] for v in ea['vectors']], float)
    ae = json.load(open(os.path.join(K, 'alphaevolve-d11-593.json')))
    out['alphaevolve-593'] = np.array(ae['vectors'], float)
    w = json.load(open(os.path.join(K, 'ea-d11-594-winner.json')))
    out['einsteinarena-594'] = np.array([[float(x) for x in v] for v in w['vectors']], float)
    return out


def unit(X):
    return X / np.linalg.norm(X, axis=-1, keepdims=True)


def h(C, U):
    """max_c <u, c> for each row u of U."""
    return (U @ C.T).max(axis=1)


def polish(C, u, iters=200, radius=0.35):
    """Local minimum of h(u) = max_c <u, c> on the sphere by sequential linear programming:
    in the tangent plane at u, minimise t subject to <c, u + d> <= t over the codewords near
    u, |d_i| <= step, <u, d> = 0; renormalise; shrink the step when it stops paying. A
    converged hole has (generically) eleven or more supporting codewords; fewer means the
    walk did not converge and the angle is only a lower bound on that hole's depth."""
    from scipy.optimize import linprog
    d_ = C.shape[1]
    best_u, best_h = u / np.linalg.norm(u), float((C @ u).max())
    step = 0.05
    for _ in range(iters):
        s = C @ best_u
        near = np.where(s >= best_h - radius)[0]
        A = np.hstack([C[near], -np.ones((len(near), 1))])          # <c, d> - t <= -<c, u>
        b = -s[near]
        Aeq = np.hstack([best_u[None, :], np.zeros((1, 1))])
        bounds = [(-step, step)] * d_ + [(None, None)]
        res = linprog(np.r_[np.zeros(d_), 1.0], A_ub=A, b_ub=b, A_eq=Aeq, b_eq=[0.0],
                      bounds=bounds, method='highs')
        if res.status != 0:
            step *= 0.5
            if step < 1e-12:
                break
            continue
        cand = best_u + res.x[:d_]
        cand /= np.linalg.norm(cand)
        hc = float((C @ cand).max())
        if hc < best_h - 1e-14:
            best_u, best_h = cand, hc
        else:
            step *= 0.5
            if step < 1e-12:
                break
    s = C @ best_u
    support = np.where(s >= best_h - 1e-8)[0]
    return best_u, best_h, support


def deepest(C, samples, keep, seed, rounds=(20., 60., 200., 600., 2000.), polish_top=300):
    rng = np.random.default_rng(seed)
    C = unit(C)
    # pairwise sanity: a kissing configuration has every cosine <= 1/2
    G = C @ C.T
    np.fill_diagonal(G, -1)
    maxcos = float(G.max())
    # 1. sample
    best = []
    chunk = 50000
    for start in range(0, samples, chunk):
        U = unit(rng.standard_normal((min(chunk, samples - start), C.shape[1])))
        hv = h(C, U)
        order = np.argsort(hv)[:keep]
        best.append((hv[order], U[order]))
    hv = np.concatenate([b[0] for b in best]); U = np.concatenate([b[1] for b in best])
    order = np.argsort(hv)[:keep]
    U = U[order]
    # 2. descend a smoothed h (log-sum-exp, annealed) on the sphere, all candidates at once
    for beta in rounds:
        for _ in range(200):
            S = U @ C.T
            m = S.max(axis=1, keepdims=True)
            P = np.exp(beta * (S - m))
            P /= P.sum(axis=1, keepdims=True)
            g = P @ C                                   # gradient of the smoothed max
            g -= (g * U).sum(axis=1, keepdims=True) * U  # tangent part
            U = unit(U - (0.5 / beta) * g)
    # 3. polish each to a facet normal, keep the distinct holes
    holes = []
    hv = h(C, U)
    for u in U[np.argsort(hv)[:polish_top]]:
        pu, ph, sup = polish(C, u)
        holes.append((ph, pu, sup))
    holes.sort(key=lambda t: t[0])
    distinct = []
    for ph, pu, sup in holes:
        if all(float(pu @ q) < 1 - 1e-9 for _, q, _ in distinct):
            distinct.append((ph, pu, sup))
    return maxcos, distinct


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--samples', type=int, default=400000)
    ap.add_argument('--keep', type=int, default=2000)
    ap.add_argument('--seed', type=int, default=2026)
    ap.add_argument('--only', default='')
    ap.add_argument('--out', default=os.path.join(HERE, 'proposals.json'))
    a = ap.parse_args()
    configs = load_configs()
    rec = {'what': 'PROPOSED deepest empty caps (floating point; nothing here is certified)',
           'samples': a.samples, 'keep': a.keep, 'seed': a.seed, 'configs': {}}
    for name, C in configs.items():
        if a.only and a.only not in name:
            continue
        t0 = time.time()
        maxcos, distinct = deepest(C, a.samples, a.keep, a.seed)
        hmin = distinct[0][0]
        rec['configs'][name] = {
            'n': int(C.shape[0]),
            'max_pairwise_cos_float': maxcos,
            'deepest_h_float': hmin,
            'deepest_angle_deg_float': math.degrees(math.acos(min(1, hmin))),
            'gap_to_60_deg_float': math.degrees(math.acos(min(1, hmin))) - 60.0,
            'distinct_local_holes': len(distinct),
            'top_holes': [{'h': ph, 'angle_deg': math.degrees(math.acos(min(1, ph))),
                           'support': [int(i) for i in sup], 'u': [float(x) for x in pu]}
                          for ph, pu, sup in distinct[:20]],
            'seconds': round(time.time() - t0, 1),
        }
        r = rec['configs'][name]
        print(f"{name:20s} n={r['n']} maxcos={maxcos:.6f}  deepest hole {r['deepest_angle_deg_float']:.4f} deg "
              f"(h={hmin:.6f}, {len(distinct[0][2])} supporting)  distinct local holes {len(distinct)}  {r['seconds']} s",
              flush=True)
    json.dump(rec, open(a.out, 'w'), indent=1)
    print('wrote', a.out)


if __name__ == '__main__':
    main()
