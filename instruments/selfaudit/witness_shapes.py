#!/usr/bin/env python3
"""witness_shapes.py — the self-audit's WITNESS for the shapes family: Python standard library, exact in Fractions, no
code from this repository (nothing shared with instruments/easota, instruments/kissing or tools/run-mc100-einstein.js).
Written from each problem as the platform states it:

  circles    n circles (x, y, r): no two overlap ((xi−xj)² + (yi−yj)² ≥ (ri+rj)²), the bounding box has w + h ≤ 2;
             the score is Σr
  heilbronn  n distinct points: the score is the least triangle area over the convex hull's area (hull by monotone
             chain, collinear points dropped)
  mindist    n distinct points: the score is (max distance / min distance)² = max d² / min d²
  overlap    a step function h of n values, 0 ≤ h ≤ 1 and Σh = n/2; the bound is 2·max_lag Σ_i h[i+lag](1−h[i]) / n
  edges      rows of 20 weights, each row normalised to sum 1; ρ = 1 − Σw², τ = 1 − 3Σw² + 2Σw³; the points sorted by
             ρ, closed with (0,0) and (1,1), deduplicated on ρ; the area under the slope-3 envelope summed segment by
             segment; the score is −(area + 10·max gap in ρ)
  autocorr   f ≥ 0 as n values: C₁ = 2n·max_k Σ_i f_i f_{k−i} / (Σf)²
  flat       70 coefficients ±1: C⁺ = max_{|z|=1} |g(z)| / √71 — bounded BELOW at an exact rational point of the circle
             (z = ((1−t²) + 2ti)/(1+t²)), so only a bar that is too LOW can be witnessed
  hexagons   the printed side is the file's outer side literal (the convention is exact); the separation and containment
             constraints are not witnessed here (they need certified trigonometry)
  kissing    n vectors in R^d; the penalty Σ max(0, 2 − |c_i − c_j|) with c_i = 2x_i/|x_i|, enclosed in directed-rounding
             Decimal at 60 digits (|c_i − c_j|² = 8 − 8cosθ); a zero vector has no direction

The long convolutions (autocorr, overlap) go through Kronecker substitution: the integer sequence packed into one big
integer, squared or multiplied once, the coefficients read back from its bytes — exact. A bar agrees under its
convention: rounding (|exact − p| ≤ ½·10⁻ᵈ), ceiling (p − 10⁻ᵈ < exact ≤ p), exact (equality), platform
(|exact − S| ≤ tol, tol = the problem's minImprovement when nonzero, else 10⁻¹²·max(1, |S|); an enclosure agrees when
its distance to S is at most tol). A claim is VIOLATED when a constraint fails or the bar does not agree.

usage: python3 -I witness_shapes.py items.json      items: [{"id", "kind", "source", "bar": {"printed", "convention", "minImprovement"?}, "data": {...}}, …]
prints a JSON list: {"id", "malformed", "reason"?, "violated", "violation": {…} | null, "exact": "…"}"""
import json
import math
import sys
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING
from fractions import Fraction

F = Fraction


def frac(s):
    if s is None or not isinstance(s, str):
        raise ValueError('a value is missing or not a literal')
    return F(s)


def num(x):
    if isinstance(x, Fraction):
        return x
    return F(x)


# ---- bars ------------------------------------------------------------------------------------------------------------
def unit_of(printed):
    d = len(printed.split('.')[1]) if '.' in printed else 0
    return F(1, 10 ** d)


def bar_agrees(exact_lo, exact_hi, bar):
    """exact in [exact_lo, exact_hi] (equal for an exact score; exact_hi None = a lower bound only)."""
    p = F(bar['printed'])
    conv = bar['convention']
    if conv == 'platform':
        mi = bar.get('minImprovement') or 0
        tol = F(str(mi)) if mi and F(str(mi)) > 0 else F(1, 10 ** 12) * max(F(1), abs(p))
        lo, hi = p - tol, p + tol
    elif conv == 'rounding':
        u = unit_of(bar['printed'])
        lo, hi = p - u / 2, p + u / 2
    elif conv == 'ceiling':
        u = unit_of(bar['printed'])
        lo, hi = p - u, p  # open at the bottom
    elif conv == 'exact':
        lo, hi = p, p
    else:
        raise ValueError('unknown convention %r' % conv)
    if exact_hi is None:  # a lower bound only: the bar is refuted only when it lies entirely below the bound
        return not (exact_lo > hi), {'window': [str(lo), str(hi)], 'lowerBound': str(exact_lo)}
    if conv == 'ceiling':
        ok = exact_hi <= hi and exact_lo > lo
    else:
        ok = exact_lo >= lo and exact_hi <= hi
    return ok, {'window': [str(lo), str(hi)], 'exact': [str(exact_lo), str(exact_hi)] if exact_lo != exact_hi else str(exact_lo)}


# ---- Kronecker convolution --------------------------------------------------------------------------------------------
def conv_int(A, B):
    """the full convolution of two lists of non-negative integers, exact, via one big-integer product."""
    n, m = len(A), len(B)
    if not n or not m:
        return []
    ma, mb = max(A), max(B)
    bits = ma.bit_length() + mb.bit_length() + (min(n, m)).bit_length() + 1
    K = (bits + 7) // 8
    X = int.from_bytes(b''.join(a.to_bytes(K, 'little') for a in A), 'little')
    Y = int.from_bytes(b''.join(b.to_bytes(K, 'little') for b in B), 'little')
    P = X * Y
    raw = P.to_bytes(K * (n + m - 1) + K, 'little')
    return [int.from_bytes(raw[i * K:(i + 1) * K], 'little') for i in range(n + m - 1)]


def common_den(vals):
    D = 1
    for v in vals:
        D = D * v.denominator // math.gcd(D, v.denominator)
    return D


# ---- the problems ---------------------------------------------------------------------------------------------------
def circles(d, bar):
    C = d['circles']
    for i, c in enumerate(C):
        if not isinstance(c, list) or len(c) != 3:
            return {'malformed': True, 'reason': 'circle %d has %d numbers' % (i, len(c) if isinstance(c, list) else -1)}
    C = [[frac(x) for x in c] for c in C]
    sumR = sum(c[2] for c in C)
    w = max(c[0] + c[2] for c in C) - min(c[0] - c[2] for c in C)
    h = max(c[1] + c[2] for c in C) - min(c[1] - c[2] for c in C)
    box_slack = 2 - (w + h)
    worst = None
    overlaps = 0
    for i in range(len(C)):
        for j in range(i + 1, len(C)):
            s = (C[i][0] - C[j][0]) ** 2 + (C[i][1] - C[j][1]) ** 2 - (C[i][2] + C[j][2]) ** 2
            if s < 0:
                overlaps += 1
            if worst is None or s < worst[2]:
                worst = (i, j, s)
    constraint = None
    if overlaps:
        constraint = {'kind': 'overlapping circles', 'pairs': overlaps, 'worst': [worst[0], worst[1]], 'slackSquared': str(worst[2])}
    elif box_slack < 0:
        constraint = {'kind': 'the box exceeds w + h = 2', 'by': str(-box_slack)}
    agrees, info = bar_agrees(sumR, sumR, bar) if bar['printed'] is not None else (True, None)
    return result(constraint, agrees, info, str(sumR))


def heilbronn(d, bar):
    P = d['points']
    for i, p in enumerate(P):
        if not isinstance(p, list) or len(p) != 2:
            return {'malformed': True, 'reason': 'point %d has %d coordinates' % (i, len(p) if isinstance(p, list) else -1)}
    P = [(frac(p[0]), frac(p[1])) for p in P]
    if len(set(P)) != len(P):
        return result({'kind': 'two points coincide'}, True, None, None)
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
    a2 = sum(hull[i][0] * hull[(i + 1) % len(hull)][1] - hull[(i + 1) % len(hull)][0] * hull[i][1] for i in range(len(hull)))
    hull_area = abs(a2) / 2
    n = len(P)
    best = None
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                t = abs(cross(P[i], P[j], P[k])) / 2
                if best is None or t < best:
                    best = t
    if best == 0:
        return result({'kind': 'three points collinear'}, True, None, None)
    score = best / hull_area
    agrees, info = bar_agrees(score, score, bar) if bar['printed'] is not None else (True, None)
    return result(None, agrees, info, str(score))


def mindist(d, bar):
    P = d['points']
    for i, p in enumerate(P):
        if not isinstance(p, list) or len(p) != 2:
            return {'malformed': True, 'reason': 'point %d has %d coordinates' % (i, len(p) if isinstance(p, list) else -1)}
    P = [(frac(p[0]), frac(p[1])) for p in P]
    lo = hi = None
    for i in range(len(P)):
        for j in range(i + 1, len(P)):
            d2 = (P[i][0] - P[j][0]) ** 2 + (P[i][1] - P[j][1]) ** 2
            lo = d2 if lo is None or d2 < lo else lo
            hi = d2 if hi is None or d2 > hi else hi
    if lo == 0:
        return result({'kind': 'two points coincide'}, True, None, None)
    score = hi / lo
    agrees, info = bar_agrees(score, score, bar) if bar['printed'] is not None else (True, None)
    return result(None, agrees, info, str(score))


def overlap(d, bar):
    vals = d['values']
    if any(v is None or not isinstance(v, str) for v in vals):
        return {'malformed': True, 'reason': 'a value is missing'}
    h = [frac(v) for v in vals]
    n = len(h)
    constraint = None
    if any(v < 0 or v > 1 for v in h):
        constraint = {'kind': 'a value outside [0, 1]'}
    elif sum(h) != F(n, 2):
        constraint = {'kind': 'Σh is not n/2', 'sumMinusHalfN': str(sum(h) - F(n, 2))}
    D = common_den(h)
    A = [int(v * D) for v in h]
    B = [D - a for a in A]
    c = conv_int(A, B[::-1])  # c[lag + n - 1] = Σ_i A[i+lag] B[i]
    best = max(c)
    bound = F(2 * best, n * D * D)
    agrees, info = bar_agrees(bound, bound, bar) if bar['printed'] is not None else (True, None)
    return result(constraint, agrees, info, str(bound))


def edges(d, bar):
    W = d['weights']
    for i, row in enumerate(W):
        if not isinstance(row, list) or len(row) != 20:
            return {'malformed': True, 'reason': 'row %d has %d weights' % (i, len(row) if isinstance(row, list) else -1)}
    pts = []
    for i, row in enumerate(W):
        r = [frac(x) for x in row]
        s = sum(r)
        if s <= 0:
            return result({'kind': 'row %d sums to %s' % (i, s)}, True, None, None)
        r = [x / s for x in r]
        S2 = sum(x * x for x in r)
        S3 = sum(x * x * x for x in r)
        pts.append((1 - S2, 1 - 3 * S2 + 2 * S3))
    pts.sort(key=lambda p: p[0])
    full = [(F(0), F(0))] + pts + [(F(1), F(1))]
    uniq = []
    for p in full:
        if not uniq or p[0] != uniq[-1][0]:
            uniq.append(p)
    area = F(0)
    max_gap = F(0)
    for i in range(len(uniq) - 1):
        (xi, yi), (xn, yn) = uniq[i], uniq[i + 1]
        w = xn - xi
        if w <= 0:
            continue
        if yi > yn:
            seg = yi * w
        else:
            yc = yi + 3 * w
            if yc <= yn:
                seg = (yi + yc) * w / 2
            else:
                w1 = (yn - yi) / 3
                w1 = max(F(0), min(w1, w))
                seg = (yi + yn) * w1 / 2 + yn * (w - w1)
        area += seg
        if xi < 1 and w > max_gap:
            max_gap = w
    score = -(area + 10 * max_gap)
    agrees, info = bar_agrees(score, score, bar) if bar['printed'] is not None else (True, None)
    return result(None, agrees, info, str(score))


def autocorr(d, bar):
    vals = d['values']
    if any(v is None or not isinstance(v, str) for v in vals):
        return {'malformed': True, 'reason': 'a value is missing'}
    f = [frac(v) for v in vals]
    n = len(f)
    if any(v < 0 for v in f):
        return result({'kind': 'a negative value', 'index': next(i for i, v in enumerate(f) if v < 0)}, True, None, None)
    D = common_den(f)
    a = [int(v * D) for v in f]
    S = sum(a)
    if S == 0:
        return result({'kind': 'the integral is zero'}, True, None, None)
    c = conv_int(a, a)
    best = max(c)
    C1 = F(2 * n * best, S * S)
    agrees, info = bar_agrees(C1, C1, bar) if bar['printed'] is not None else (True, None)
    return result(None, agrees, info, str(C1))


def flat(d, bar):
    coef = d['coefficients']
    if any(v is None or not isinstance(v, str) for v in coef):
        return {'malformed': True, 'reason': 'a coefficient is missing'}
    c = [frac(v) for v in coef]
    N = len(c)
    if any(v != 1 and v != -1 for v in c):
        return result({'kind': 'a coefficient that is not ±1', 'index': next(i for i, v in enumerate(c) if v != 1 and v != -1)}, True, None, None)
    ci = [int(v) for v in c]
    # a float scan for the argmax of |g| on the circle, then an exact rational point near it
    def mod2(theta):
        re = sum(ci[j] * math.cos(j * theta) for j in range(N))
        im = sum(ci[j] * math.sin(j * theta) for j in range(N))
        return re * re + im * im
    G = 4096
    best_k = max(range(G), key=lambda k: mod2(2 * math.pi * k / G))
    lo, hi = 2 * math.pi * (best_k - 1) / G, 2 * math.pi * (best_k + 1) / G
    for _ in range(60):  # golden-section refinement
        m1, m2 = lo + (hi - lo) * 0.381966, lo + (hi - lo) * 0.618034
        if mod2(m1) < mod2(m2):
            lo = m1
        else:
            hi = m2
    theta = (lo + hi) / 2
    t = F(repr(round(math.tan(theta / 2), 12)))
    den = 1 + t * t
    zr, zi = (1 - t * t) / den, 2 * t / den          # an exact point of the unit circle
    pr, pi_ = F(1), F(0)                               # z^j
    re = F(0)
    im = F(0)
    for j in range(N):
        re += ci[j] * pr
        im += ci[j] * pi_
        pr, pi_ = pr * zr - pi_ * zi, pr * zi + pi_ * zr
    lower_sq = re * re + im * im                       # |g(z)|² ≤ max |g|²
    # C⁺ ≥ sqrt(lower_sq / (N+1)); compare squares against the bar's window
    if bar['printed'] is None:
        return result(None, True, None, None)
    p = F(bar['printed'])
    conv = bar['convention']
    if conv == 'platform':
        mi = bar.get('minImprovement') or 0
        tol = F(str(mi)) if mi and F(str(mi)) > 0 else F(1, 10 ** 12) * max(F(1), abs(p))
        top = p + tol
    elif conv == 'rounding':
        top = p + unit_of(bar['printed']) / 2
    elif conv == 'ceiling':
        top = p
    else:
        top = p
    too_low = top < 0 or lower_sq / (N + 1) > top * top
    return result(None, not too_low, {'windowTop': str(top), 'lowerBoundOfCplusSquared': str(lower_sq / (N + 1)), 'note': 'a lower bound only: a bar above the supremum cannot be witnessed here'}, None)


def hexagons(d, bar):
    H = d['hexagons']
    for i, h in enumerate(H):
        if not isinstance(h, list) or len(h) != 3:
            return {'malformed': True, 'reason': 'hexagon %d has %d numbers' % (i, len(h) if isinstance(h, list) else -1)}
    for h in H:
        for x in h:
            frac(x)
    side = frac(d['outer']['side'])
    agrees, info = bar_agrees(side, side, bar) if bar['printed'] is not None else (True, None)
    r = result(None, agrees, info, str(side))
    r['constraintsWitnessed'] = False
    return r


def kissing(d, bar):
    V = d['vectors']
    dim = len(V[0]) if V and isinstance(V[0], list) else -1
    for i, v in enumerate(V):
        if not isinstance(v, list) or len(v) != dim:
            return {'malformed': True, 'reason': 'vector %d has %d coordinates, vector 0 has %d' % (i, len(v) if isinstance(v, list) else -1, dim)}
    rows = []
    for v in V:
        q = [frac(x) for x in v]
        D = common_den(q)
        rows.append([int(x * D) for x in q])
    norms = [sum(x * x for x in r) for r in rows]
    for i, N in enumerate(norms):
        if N == 0:
            return result({'kind': 'a zero vector', 'row': i}, True, None, None)
    down = Context(prec=60, rounding=ROUND_FLOOR)
    up = Context(prec=60, rounding=ROUND_CEILING)
    lo = Decimal(0)
    hi = Decimal(0)
    n = len(rows)
    for i in range(n):
        ri, Ni = rows[i], norms[i]
        for j in range(i + 1, n):
            s = sum(a * b for a, b in zip(ri, rows[j]))
            if s <= 0:
                continue
            P = Ni * norms[j]
            if 4 * s * s <= P:
                continue
            if s * s == P:  # the same direction: distance 0, penalty 2 exactly
                lo = down.add(lo, Decimal(2))
                hi = up.add(hi, Decimal(2))
                continue
            sqP_lo = down.sqrt(Decimal(P))
            sqP_hi = up.sqrt(Decimal(P))
            cos_lo = down.divide(Decimal(s), sqP_hi)
            cos_hi = up.divide(Decimal(s), sqP_lo)
            x_lo = down.subtract(Decimal(8), up.multiply(Decimal(8), cos_hi))
            x_hi = up.subtract(Decimal(8), down.multiply(Decimal(8), cos_lo))
            if x_lo < 0:
                x_lo = Decimal(0)
            dist_lo = down.sqrt(x_lo)
            dist_hi = up.sqrt(x_hi)
            lo = down.add(lo, down.subtract(Decimal(2), dist_hi))
            hi = up.add(hi, up.subtract(Decimal(2), dist_lo))
    lo_f, hi_f = F(lo), F(hi)
    agrees, info = bar_agrees(lo_f, hi_f, bar) if bar['printed'] is not None else (True, None)
    return result(None, agrees, info, [str(lo), str(hi)])


def result(constraint, agrees, info, exact):
    violated = constraint is not None or not agrees
    v = None
    if violated:
        v = {}
        if constraint is not None:
            v['constraint'] = constraint
        if not agrees:
            v['bar'] = info
    return {'malformed': False, 'violated': violated, 'violation': v, 'exact': exact, 'barAgrees': agrees}


KINDS = {'circles': circles, 'heilbronn': heilbronn, 'mindist': mindist, 'overlap': overlap, 'edges': edges, 'autocorr': autocorr, 'flat': flat, 'hexagons': hexagons, 'kissing': kissing}


def main():
    items = json.load(open(sys.argv[1]))
    out = []
    for it in items:
        try:
            r = KINDS[it['kind']](it['data'], it['bar'])
        except (KeyError, TypeError, ValueError, ZeroDivisionError, ArithmeticError) as e:
            r = {'malformed': True, 'reason': 'unreadable: %s' % str(e)[:160]}
        r['id'] = it.get('id')
        if r.get('malformed'):
            r.setdefault('violated', None)
            r.setdefault('violation', None)
        out.append(r)
    print(json.dumps(out))


if __name__ == '__main__':
    main()
