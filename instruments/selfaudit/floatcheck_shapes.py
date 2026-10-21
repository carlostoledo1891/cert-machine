#!/usr/bin/env python3
"""floatcheck_shapes.py — the self-audit's CONVENTIONAL CHECK (M5) for the shapes family: double precision, no exact
arithmetic, a tolerance τ used for every constraint and for the bar — what a numpy-style verifier does. Per kind:
circles (overlaps allowed up to τ, the box up to 2 + τ, |Σr − bar| ≤ τ); heilbronn and mindist (the score in floats,
distinct points past τ); overlap (0 − τ ≤ h ≤ 1 + τ, |Σh − n/2| ≤ τ, the bound by a float convolution — FFT past 2048
values); edges (the envelope score in floats); autocorr (f ≥ −τ, C₁ by a float convolution); flat (|c ∓ 1| ≤ τ, the
maximum of |g| over the platform's 1,000,000-point grid); hexagons (vertices by cos and sin, separating axes with τ,
containment with τ, the side against the bar); kissing (cosines in floats, the penalty in floats against the bar).
Accept at τ iff every constraint holds within τ and |score − bar| ≤ τ. Python standard library only; shares nothing
with the deciders. It measures a tolerance, not a named grader.

usage: python3 -I floatcheck_shapes.py items.json
prints a JSON list: {"id", "score", "accept": {"1e-6": bool, "1e-9": bool, "1e-12": bool}} — or {"id", "error"}"""
import cmath
import json
import math
import sys

TAUS = [('1e-6', 1e-6), ('1e-9', 1e-9), ('1e-12', 1e-12)]


def fl(x):
    if x is None or not isinstance(x, str):
        raise ValueError('a value is missing')
    return float(x)


def fft(a):
    n = len(a)
    if n == 1:
        return a
    j = 0
    a = list(a)
    for i in range(1, n):
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j |= bit
        if i < j:
            a[i], a[j] = a[j], a[i]
    length = 2
    while length <= n:
        ang = -2 * math.pi / length
        wl = complex(math.cos(ang), math.sin(ang))
        half = length >> 1
        for i in range(0, n, length):
            w = 1 + 0j
            for k in range(half):
                u = a[i + k]
                v = a[i + k + half] * w
                a[i + k] = u + v
                a[i + k + half] = u - v
                w *= wl
        length <<= 1
    return a


def conv_float(A, B):
    n, m = len(A), len(B)
    if max(n, m) <= 2048:
        out = [0.0] * (n + m - 1)
        for i, x in enumerate(A):
            if x == 0.0:
                continue
            for j, y in enumerate(B):
                out[i + j] += x * y
        return out
    size = 1
    while size < n + m - 1:
        size <<= 1
    fa = fft([complex(x) for x in A] + [0j] * (size - n))
    fb = fft([complex(x) for x in B] + [0j] * (size - m))
    prod = [x * y for x, y in zip(fa, fb)]
    inv = fft([p.conjugate() for p in prod])
    return [(z.conjugate() / size).real for z in inv][:n + m - 1]


def bar_value(bar):
    return None if bar['printed'] is None else float(bar['printed'])


def circles(d, bar, tau):
    C = [[fl(x) for x in c] for c in d['circles']]
    if any(len(c) != 3 for c in C):
        raise ValueError('a circle without three numbers')
    s = sum(c[2] for c in C)
    w = max(c[0] + c[2] for c in C) - min(c[0] - c[2] for c in C)
    h = max(c[1] + c[2] for c in C) - min(c[1] - c[2] for c in C)
    ok = w + h <= 2 + tau
    for i in range(len(C)):
        for j in range(i + 1, len(C)):
            if math.hypot(C[i][0] - C[j][0], C[i][1] - C[j][1]) < C[i][2] + C[j][2] - tau:
                ok = False
    return s, ok


def heilbronn(d, bar, tau):
    P = [[fl(x) for x in p] for p in d['points']]
    if any(len(p) != 2 for p in P):
        raise ValueError('a point without two coordinates')
    cross = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    pts = sorted(P)
    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    hull = lower[:-1] + upper[:-1]
    area = abs(sum(hull[i][0] * hull[(i + 1) % len(hull)][1] - hull[(i + 1) % len(hull)][0] * hull[i][1] for i in range(len(hull)))) / 2
    n = len(P)
    best = min(abs(cross(P[i], P[j], P[k])) / 2 for i in range(n) for j in range(i + 1, n) for k in range(j + 1, n))
    ok = all(math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]) > tau for i in range(n) for j in range(i + 1, n))
    return (best / area if area else float('nan')), ok


def mindist(d, bar, tau):
    P = [[fl(x) for x in p] for p in d['points']]
    if any(len(p) != 2 for p in P):
        raise ValueError('a point without two coordinates')
    n = len(P)
    d2 = [(P[i][0] - P[j][0]) ** 2 + (P[i][1] - P[j][1]) ** 2 for i in range(n) for j in range(i + 1, n)]
    lo, hi = min(d2), max(d2)
    return (hi / lo if lo else float('nan')), math.sqrt(lo) > tau


def overlap(d, bar, tau):
    h = [fl(v) for v in d['values']]
    n = len(h)
    ok = all(-tau <= v <= 1 + tau for v in h) and abs(sum(h) - n / 2) <= tau
    c = conv_float(h, [1 - v for v in h][::-1])
    return 2 * max(c) / n, ok


def edges(d, bar, tau):
    W = [[fl(x) for x in row] for row in d['weights']]
    if any(len(r) != 20 for r in W):
        raise ValueError('a row without 20 weights')
    pts = []
    for r in W:
        s = sum(r)
        r = [x / s for x in r]
        S2 = sum(x * x for x in r)
        S3 = sum(x ** 3 for x in r)
        pts.append((1 - S2, 1 - 3 * S2 + 2 * S3))
    pts.sort()
    full = [(0.0, 0.0)] + pts + [(1.0, 1.0)]
    uniq = []
    for p in full:
        if not uniq or abs(p[0] - uniq[-1][0]) > 1e-9:
            uniq.append(p)
    area = 0.0
    gap = 0.0
    for i in range(len(uniq) - 1):
        (xi, yi), (xn, yn) = uniq[i], uniq[i + 1]
        w = xn - xi
        if w <= 1e-9:
            continue
        if yi > yn:
            seg = yi * w
        else:
            yc = yi + 3 * w
            if yc <= yn:
                seg = (yi + yc) * w / 2
            else:
                w1 = min(max((yn - yi) / 3, 0.0), w)
                seg = (yi + yn) * w1 / 2 + yn * (w - w1)
        area += seg
        if xi < 1 and w > gap:
            gap = w
    return -(area + 10 * gap), True


def autocorr(d, bar, tau):
    f = [fl(v) for v in d['values']]
    n = len(f)
    ok = all(v >= -tau for v in f)
    S = sum(f)
    c = conv_float(f, f)
    return 2 * n * max(c) / (S * S), ok


def flat(d, bar, tau):
    c = [fl(v) for v in d['coefficients']]
    N = len(c)
    ok = all(abs(abs(v) - 1) <= tau for v in c)
    if not ok:
        return float('nan'), False
    G = 1000000
    best = 0.0
    for k in range(G):
        z = cmath.exp(2j * math.pi * k / G)
        acc = 0j
        for j in range(N - 1, -1, -1):  # Horner
            acc = acc * z + c[j]
        m = abs(acc)
        if m > best:
            best = m
    return best / math.sqrt(N + 1), True


def hexagons(d, bar, tau):
    def verts(cx, cy, s, ang):
        return [(cx + s * math.cos(math.radians(ang) + k * math.pi / 3), cy + s * math.sin(math.radians(ang) + k * math.pi / 3)) for k in range(6)]
    H = [[fl(x) for x in h] for h in d['hexagons']]
    if any(len(h) != 3 for h in H):
        raise ValueError('a hexagon without three numbers')
    O = d['outer']
    side = fl(O['side'])
    inner = [verts(h[0], h[1], 1.0, h[2]) for h in H]
    outer = verts(fl(O['center'][0]), fl(O['center'][1]), side, fl(O['angleDeg']))
    def separated(A, B):
        for poly in (A, B):
            for i in range(6):
                p, q = poly[i], poly[(i + 1) % 6]
                nx, ny = -(q[1] - p[1]), q[0] - p[0]
                ln = math.hypot(nx, ny)
                nx, ny = nx / ln, ny / ln
                pa = [v[0] * nx + v[1] * ny for v in A]
                pb = [v[0] * nx + v[1] * ny for v in B]
                if max(pa) <= min(pb) + tau or max(pb) <= min(pa) + tau:
                    return True
        return False
    def inside(pt):
        for i in range(6):
            p, q = outer[i], outer[(i + 1) % 6]
            cr = (q[0] - p[0]) * (pt[1] - p[1]) - (q[1] - p[1]) * (pt[0] - p[0])
            if cr < -tau:
                return False
        return True
    ok = all(separated(inner[i], inner[j]) for i in range(12) for j in range(i + 1, 12)) and all(inside(v) for V in inner for v in V)
    return side, ok


def kissing(d, bar, tau):
    V = [[fl(x) for x in v] for v in d['vectors']]
    dim = len(V[0])
    if any(len(v) != dim for v in V):
        raise ValueError('vectors of different dimension')
    norms = [math.sqrt(sum(x * x for x in v)) for v in V]
    if any(nv == 0.0 for nv in norms):
        return float('nan'), False
    pen = 0.0
    n = len(V)
    for i in range(n):
        vi, ni = V[i], norms[i]
        for j in range(i + 1, n):
            c = sum(a * b for a, b in zip(vi, V[j])) / (ni * norms[j])
            if c > 0.5:
                dist = math.sqrt(max(0.0, 8 - 8 * min(1.0, c)))
                pen += max(0.0, 2 - dist)
    return pen, True


KINDS = {'circles': circles, 'heilbronn': heilbronn, 'mindist': mindist, 'overlap': overlap, 'edges': edges, 'autocorr': autocorr, 'flat': flat, 'hexagons': hexagons, 'kissing': kissing}


def main():
    items = json.load(open(sys.argv[1]))
    out = []
    for it in items:
        try:
            accept = {}
            score = None
            for name, tau in TAUS:
                s, ok = KINDS[it['kind']](it['data'], it['bar'], tau)
                score = s
                b = bar_value(it['bar'])
                agree = True if b is None else (s == s and abs(s - b) <= tau)
                accept[name] = bool(ok and agree)
            out.append({'id': it['id'], 'score': repr(score), 'accept': accept})
        except Exception as e:
            out.append({'id': it.get('id'), 'error': str(e)[:200], 'accept': {name: False for name, _ in TAUS}})
    print(json.dumps(out))


if __name__ == '__main__':
    main()
