"""
Exact precomputation (Python big integers / Fractions) and input-file writer for the
modular kernel (kernel.c).  Usage as a module: build(terms, dat, path) -> meta dict.

All datum values must be integers (use y = 1250 x for the real datum).
"""
from fractions import Fraction
from math import comb, factorial, gcd
import json, time, sys
from core import mprod, submultisets, nmono
from decomp import expand_square, h_polys, I0_value, J0_value


def lcm(a, b):
    return a * b // gcd(a, b)


def den_lcm(polys):
    d = 1
    for P in polys.values():
        for v in P.values():
            d = lcm(d, Fraction(v).denominator)
    return d


def scale_int(polys, s):
    out = {}
    for k, P in polys.items():
        q = {}
        for key, v in P.items():
            w = Fraction(v) * s
            assert w.denominator == 1
            if w:
                q[key] = int(w)
        out[k] = q
    return out


def square_int(H):
    """integer version of decomp.square_h for univariate dict polys."""
    betas = sorted(H)
    out = {}
    for i, b1 in enumerate(betas):
        for b2 in betas[i:]:
            f = 1 if b1 == b2 else 2
            prod = {}
            for k1, v1 in H[b1].items():
                for k2, v2 in H[b2].items():
                    prod[k1 + k2] = prod.get(k1 + k2, 0) + v1 * v2
            for gam, N in mprod(b1, b2).items():
                d = out.setdefault(gam, {})
                for k, v in prod.items():
                    d[k] = d.get(k, 0) + f * N * v
    return out


def window_specs(Kv, dat, mrange, windows, Smax):
    g = dat['g']
    out = []
    for m in mrange:
        ws = []
        for sign, d in windows(m):
            if m * g + d < Smax:
                ws.append((sign, d))
        if ws:
            out.append((m, ws))
    return out


def build(terms, dat, path, log=print):
    t0 = time.time()
    K, g, L, C, tau = dat['K'], dat['g'], dat['L'], dat['C'], dat['tau']
    for v in (g, L, tau):
        assert Fraction(v).denominator == 1
    g, L, tau = int(g), int(L), int(tau)
    assert tau >= L - g and tau < L
    Kq = K - 1
    D = expand_square(terms)
    log(f"  P^2 expanded: {len(D)} gammas ({time.time()-t0:.1f}s)")
    I0 = I0_value(K, D, dat)
    H0, Hg, Hth, H0th = h_polys(terms, g)
    s0 = den_lcm(H0)
    sg = den_lcm(Hg)
    Z0i = square_int(scale_int(H0, s0))     # = s0^2 * zeta0
    Zgi = square_int(scale_int(Hg, sg))     # = sg^2 * zetag
    log(f"  h0^2, hg^2 expanded ({time.time()-t0:.1f}s)")
    Z0 = {gam: {n: Fraction(v, s0 * s0) for n, v in P.items()} for gam, P in Z0i.items()}
    J0 = J0_value(Kq, Z0, dat)
    # zeta_d = zetag - zeta0, scaled by sd = lcm(s0^2, sg^2)
    sd = lcm(s0 * s0, sg * sg)
    Zdi = {}
    for gam in set(Z0i) | set(Zgi):
        d = {}
        for n, v in Zgi.get(gam, {}).items():
            d[n] = d.get(n, 0) + v * (sd // (sg * sg))
        for n, v in Z0i.get(gam, {}).items():
            d[n] = d.get(n, 0) - v * (sd // (s0 * s0))
        d = {n: v for n, v in d.items() if v}
        if d:
            Zdi[gam] = d
    st = lcm(den_lcm(Hth), den_lcm(H0th))
    HTi = scale_int(Hth, st)
    H0Ti = scale_int(H0th, st)
    betas = sorted(set(HTi) | set(H0Ti))
    pairs = []
    gams_pi = set()
    for i, b1 in enumerate(betas):
        for b2 in betas[i:]:
            pr = mprod(b1, b2)
            pairs.append((b1, b2, 1 if b1 == b2 else 2, pr))
            gams_pi |= set(pr)
    # degrees of Pi_gam: max over pairs of deg H_b1 + deg H_b2
    def hdeg(b):
        return max([i + j for (i, j) in HTi.get(b, {})] + [i + j for (i, j) in H0Ti.get(b, {})] + [0])
    pideg = {}
    for b1, b2, f, pr in pairs:
        dd = hdeg(b1) + hdeg(b2)
        for gam in pr:
            pideg[gam] = max(pideg.get(gam, 0), dd)
    # partitions universe
    gam_all = set(D) | set(Z0i) | set(Zdi) | gams_pi
    gam_all = {gm for gm in gam_all if len(gm) <= K}
    parts = set(gam_all) | set(betas)
    splits = {}
    for gam in gam_all:
        sp = submultisets(gam)
        splits[gam] = sp
        for a, b in sp:
            parts.add(a); parts.add(b)
    parts = sorted(parts, key=lambda p: (sum(p), len(p), p))
    idx = {p: i for i, p in enumerate(parts)}
    # piece specs
    Cmax = max(C(m) for m in range(0, K + 3))
    capsl = [int(C(m)) for m in range(0, K + 3)]
    specI1 = window_specs(K, dat, range(1, K + 1), lambda m: [(1, max(int(C(m)) - m * g, 0))], L)
    specJ1 = window_specs(Kq, dat, range(1, Kq + 1), lambda m: [(1, max(int(C(m)) - m * g, 0))], tau)

    def w3(m):
        lo = max(0, int(C(m + 1)) - g - m * g)
        hi = int(C(m)) - m * g
        return [] if hi <= lo else [(1, lo), (-1, hi)]
    specJ3 = window_specs(Kq, dat, range(1, Kq + 1), w3, L - g)
    rect = []
    for m in range(0, Kq + 1):
        Cm1 = int(C(m + 1))
        if m == 0:
            umax = -1
        else:
            umax = min(int(C(m)), Cm1 - g) - m * g
            if umax <= 0:
                continue
        Theta0 = Cm1 - m * g
        etas = []
        k = 0
        while L - Cm1 - k * g > 0:
            etas.append(L - Cm1 - k * g)
            k += 1
        if etas:
            rect.append((m, umax, Theta0, etas))
    # write
    with open(path, 'w') as f:
        f.write(f"DATUM {g} {L} {tau} {K} {Kq}\n")
        f.write(f"NPART {len(parts)}\n")
        for p in parts:
            f.write(" ".join(map(str, [len(p)] + list(p))) + "\n")
        f.write(f"SPLITS {len(gam_all)}\n")
        for gam in sorted(gam_all, key=lambda p: idx[p]):
            sp = [(a, b) for a, b in splits[gam]]
            f.write(" ".join(map(str, [idx[gam], len(sp)] + [x for a, b in sp for x in (idx[a], idx[b])])) + "\n")
        for name, Z in (("ZI", D), ("Z0", Z0i), ("ZD", Zdi)):
            rows = [(idx[gam], e, v) for gam, P in Z.items() if gam in idx and len(gam) <= K for e, v in P.items() if v]
            f.write(f"{name} {len(rows)}\n")
            for r in rows:
                f.write(f"{r[0]} {r[1]} {r[2]}\n")
        for name, H in (("HT", HTi), ("H0T", H0Ti)):
            rows = [(idx[b], i, j, v) for b, P in H.items() for (i, j), v in P.items() if v]
            f.write(f"{name} {len(rows)}\n")
            for r in rows:
                f.write(" ".join(map(str, r)) + "\n")
        f.write(f"PIDEG {len(pideg)}\n")
        for gam, dd in pideg.items():
            if gam in idx:
                f.write(f"{idx[gam]} {dd}\n")
            else:
                f.write(f"-1 {dd}\n")
        prs = []
        for b1, b2, fac, pr in pairs:
            lst = [(idx[gm], N) for gm, N in pr.items() if gm in idx]
            prs.append((idx[b1], idx[b2], fac, lst))
        f.write(f"PAIRS {len(prs)}\n")
        for b1, b2, fac, lst in prs:
            f.write(" ".join(map(str, [b1, b2, fac, len(lst)] + [x for t in lst for x in t])) + "\n")
        for name, spec, Kv, Smax in (("WIN0", specI1, K, L), ("WIN1", specJ1, Kq, tau), ("WIN2", specJ3, Kq, L - g)):
            f.write(f"{name} {Kv} {Smax} {len(spec)}\n")
            for m, ws in spec:
                f.write(" ".join(map(str, [m, len(ws)] + [x for s, d in ws for x in (s, d)])) + "\n")
        f.write(f"RECT {Kq} {len(rect)}\n")
        for m, umax, Th, etas in rect:
            f.write(" ".join(map(str, [m, umax, Th, len(etas)] + etas)) + "\n")
        f.write("END\n")
    # rigorous denominators for CRT: every term of every piece times these is an integer
    maxA = K + 2 * max(sum(p) for p in parts)   # max w-degree of any group transform
    maxZe = max([e for P in D.values() for e in P] + [e for P in Z0i.values() for e in P] + [0])
    maxPi = max(pideg.values()) if pideg else 0
    fac_tail = factorial(maxA)
    fac_om = factorial(maxZe + maxA + 1)
    fac_rect = factorial(maxPi + maxA + 1) ** 2
    meta = dict(I0=I0, J0=J0, s_Z0=s0 * s0, s_ZD=sd, s_Pi=st * st,
                fac_tail=fac_tail, fac_om=fac_om, fac_rect=fac_rect,
                maxA=maxA, maxZe=maxZe, maxPi=maxPi,
                nparts=len(parts), ngam=len(gam_all), npairs=len(pairs),
                specs=dict(I1=specI1, J1=specJ1, J3=specJ3, rect=rect))
    log(f"  input written: {path} ({time.time()-t0:.1f}s), parts={len(parts)} gammas={len(gam_all)}")
    return meta
