#!/usr/bin/env python3
"""instruments/aerp/p61.py — Problem 61 of the AlphaEvolve repository ("ring loading"), decided exactly.

The definition, from the pinned notebook (experiments/ring_loading_problem, commit 8f44745): for m pairs (u_i, v_i) of
non-negative reals with u_i + v_i <= 1, alpha(u, v) is the smallest alpha for which some choice z_i in {v_i, -u_i} has
|sum_{i<=k} z_i - sum_{i>k} z_i| <= alpha for every k in the range; the notebook's compute_alpha_exact takes k = 1..m-1
and its prompt says the same; the thread's second claim (#12) takes k = 1..m, where the k = m term is |sum z_i|. The
two conventions coincide for an instance padded with a (0, 0) pair at each end, so a bound under k = 1..m is a bound
under the notebook's convention at m + 2. C is the supremum of alpha over all m and all admissible (u, v); a claim
"C >= a" is decided by an explicit instance with alpha(u, v) = a exactly.

Exact rationals (fractions.Fraction); every one of the 2^m sign patterns is enumerated; both conventions reported.

usage: python3 -I instruments/aerp/p61.py '[[un,ud,vn,vd], ...]'      or a JSON file with {"u": [[n,d]...], "v": [[n,d]...]}
"""
import itertools, json, math, sys
from fractions import Fraction as F


def alpha(u, v, krange):
    """krange: 'notebook' (k = 1..m-1) or 'full' (k = 1..m). Returns (alpha, number of patterns attaining it).
    The rationals are scaled by the lcm of their denominators so the 2^m enumeration runs on Python integers; the
    result is divided back. Exact throughout."""
    m = len(u)
    assert len(v) == m
    D = 1
    for x in list(u) + list(v): D = D * x.denominator // math.gcd(D, x.denominator)
    U = [int(x * D) for x in u]; V = [int(x * D) for x in v]
    ks = list(range(1, m)) if krange == 'notebook' else list(range(1, m + 1))
    best = None; count = 0
    for bits in range(1 << m):
        z = [V[i] if (bits >> i) & 1 else -U[i] for i in range(m)]
        tot = sum(z); pre = 0; worst = 0
        for k in ks:
            pre += z[k - 1]
            d = abs(2 * pre - tot)
            if d > worst: worst = d
        if best is None or worst < best: best, count = worst, 1
        elif worst == best: count += 1
    return F(best, D), count


def admissible(u, v):
    return all(a >= 0 and b >= 0 and a + b <= 1 for a, b in zip(u, v))


def decide(u, v, claimed=None):
    u = [F(a) for a in u]; v = [F(b) for b in v]
    out = {'m': len(u), 'admissible': admissible(u, v)}
    if not out['admissible']:
        out['verdict'] = 'REFUTED'; out['why'] = 'u_i, v_i >= 0 and u_i + v_i <= 1 fails'; return out
    an, cn = alpha(u, v, 'notebook'); af, cf = alpha(u, v, 'full')
    out['alphaNotebook'] = str(an); out['alphaNotebookAttained'] = cn
    out['alphaFull'] = str(af); out['alphaFullAttained'] = cf
    up = [F(0)] + u + [F(0)]; vp = [F(0)] + v + [F(0)]
    ap, cp = alpha(up, vp, 'notebook')
    out['alphaPaddedNotebook'] = str(ap); out['paddedM'] = len(up)
    if claimed is not None:
        c = F(claimed)
        out['claimed'] = str(c)
        out['holdsFull'] = af == c; out['holdsNotebook'] = an == c; out['holdsPaddedNotebook'] = ap == c
    return out


if __name__ == '__main__':
    arg = sys.argv[1]
    if arg.endswith('.json'):
        j = json.load(open(arg)); u = [F(a, b) for a, b in j['u']]; v = [F(a, b) for a, b in j['v']]; claimed = j.get('claimed')
    else:
        rows = json.loads(arg); u = [F(r[0], r[1]) for r in rows]; v = [F(r[2], r[3]) for r in rows]; claimed = sys.argv[2] if len(sys.argv) > 2 else None
    print(json.dumps(decide(u, v, claimed)))
