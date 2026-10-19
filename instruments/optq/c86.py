#!/usr/bin/env python3
"""instruments/optq/c86.py — the registry's C_86 certificate (the Schur–Siegel–Smyth trace constant) decided in the
standard library: exact rationals for everything algebraic, sound float intervals for the two conditions that need a
logarithm. No code is shared with the claimant's checker (kept as text, never run) or with the JavaScript decider
(tools/replay-c86.js).

The certificate (rpinho/c86-trace-certificate, cert_n1200_A11.json) is a step measure μ = Σ d_i 1_[e_i, e_{i+1}] dx on
the cells of width 1/200 in [0, 6] and eleven integer polynomials Q with weights b_Q. What is DECIDED here, exactly or
by a sound enclosure, are the six finite conditions the claimant states, which are the hypotheses of Smith's
sufficiency criterion and the arithmetic of the bound:

  E1  d_i >= 0, edges increasing, the support inside [1/20, 1037/200]                                    exact
  E2  each Q is primitive, irreducible over Z and has only real roots; the Q are pairwise distinct        exact
      (irreducible: no integer root and no monic integer quadratic factor, the Mignotte bound limiting
      the search — enough for degree <= 5; real roots: a Sturm count equal to the degree)
  E3  Σ b_Q deg Q < m, m the mass of μ                                                                   exact
  E4  ∫ log|Q| dμ > 0 for each Q: Σ_k (d_{k-1} - d_k) G_Q(e_k), G_Q(x) = Σ_roots g(x - r) + x log|lc|,
      g(u) = u ln|u| - u, the roots enclosed to 2^-80 by Sturm bisection; the lower end of the enclosure > 0
  E5  f(x) = U_μ(x) - Σ b_Q log|Q(x)| >= 0 on every cell with d_i > 0, U_μ(x) = Σ_k (d_k - d_{k-1}) g(x - e_k):
      adaptive bisection; a box is proved when the lower end of f's enclosure is > 0, refuted when the upper end
      is < 0, and the run is REFUSED (undecided) when a box narrower than W_MIN is neither
  E6  ∫ x dμ / m equals the certificate's `bound` exactly and is <= the registry's printed bound           exact

The step from E1–E6 to C_86 <= bound is the published chain (the minimum principle; Smith's criterion and theorem),
read and not re-derived here: the record says so.

Sound logarithm: ln x = ln m + e ln 2 with x = m 2^e, m in [1, 2), ln m = 2 Σ v^(2k+1)/(2k+1), v = (m-1)/(m+1) in
[0, 1/3), every operation rounded outward with math.nextafter and the series tail bounded by the geometric remainder.
g on an interval uses its monotone pieces (decreasing on (-1, 1) through g(0) = 0, increasing beyond ±1).

usage: python3 -I instruments/optq/c86.py cert.json [--printed 1.8117251] [--json out.json] [--wmin 1e-9]
       python3 -I instruments/optq/c86.py cert.json --red densities98|weights13|mass005|bound|reducible|complex
"""
import json
import math
import sys
import time
from fractions import Fraction as F

INF = float('inf')
nd = lambda x: math.nextafter(x, -INF)
nu = lambda x: math.nextafter(x, INF)
W_MIN = 1e-9
MAX_DEPTH = 40


# ---- sound float intervals ------------------------------------------------------------------------------------------
def iadd(a, b):
    return (nd(a[0] + b[0]), nu(a[1] + b[1]))


def isub(a, b):
    return (nd(a[0] - b[1]), nu(a[1] - b[0]))


def imul(a, b):
    ps = (a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1])
    return (nd(min(ps)), nu(max(ps)))


def iscale(a, c):
    """c a float; outward"""
    lo, hi = (a[0] * c, a[1] * c) if c >= 0 else (a[1] * c, a[0] * c)
    return (nd(lo), nu(hi))


def from_fraction(q):
    f = float(q)
    lo = hi = f
    while F(lo) > q:
        lo = nd(lo)
    while F(hi) < q:
        hi = nu(hi)
    return (lo, hi)


def _atanh_series(vlo, vhi, K=26):
    """Σ_{k<K} v^(2k+1)/(2k+1) as a sound interval for v in [vlo, vhi] ⊂ [0, 1/3]; plus the tail bound on the upper end"""
    lo = 0.0
    hi = 0.0
    plo = vlo
    phi = vhi
    v2lo = nd(vlo * vlo)
    v2hi = nu(vhi * vhi)
    for k in range(K):
        d = 2 * k + 1
        lo = nd(lo + nd(plo / d))
        hi = nu(hi + nu(phi / d))
        plo = nd(plo * v2lo)
        phi = nu(phi * v2hi)
    # tail: Σ_{k>=K} v^(2k+1)/(2k+1) <= v^(2K+1) / ((2K+1)(1 - v^2))
    tail = nu(nu(phi / (2 * K + 1)) / nd(1.0 - v2hi))
    return (lo, nu(hi + tail))


_S3 = _atanh_series(nd(1 / 3), nu(1 / 3))
LN2 = (nd(2 * _S3[0]), nu(2 * _S3[1]))          # ln 2 = 2 atanh(1/3)


def ln_pt(x):
    """sound enclosure of ln x for a positive float x"""
    if not (x > 0) or x == INF:
        raise ValueError('ln of a non-positive or infinite float')
    m, e = math.frexp(x)                       # x = m 2^e, m in [0.5, 1)
    m2 = 2.0 * m                               # exact; in [1, 2)
    e2 = e - 1
    num = m2 - 1.0                             # exact (Sterbenz)
    vlo = nd(num / nu(m2 + 1.0))
    vhi = nu(num / nd(m2 + 1.0))
    s = _atanh_series(vlo, vhi)
    lm = (nd(2 * s[0]), nu(2 * s[1]))
    if e2 == 0:
        return lm
    t = iscale(LN2, float(e2))
    return iadd(lm, t)


def ln_iv(a):
    """ln on a positive interval (monotone)"""
    if a[0] <= 0:
        raise ValueError('ln of an interval touching zero')
    return (ln_pt(a[0])[0], ln_pt(a[1])[1])


def g_pt(u):
    """g(u) = u ln|u| - u for a float u, sound"""
    if u == 0.0:
        return (0.0, 0.0)
    l = ln_pt(abs(u))
    ul = iscale(l, u)
    return isub(ul, (u, u))


def g_iv(a):
    """range of g over [a0, a1]: g is odd, decreasing on (-1, 1) through 0, increasing on |u| > 1"""
    pts = [a[0], a[1]]
    for c in (-1.0, 1.0):
        if a[0] < c < a[1]:
            pts.append(c)
    vals = [g_pt(p) for p in pts]
    return (min(v[0] for v in vals), max(v[1] for v in vals))


# ---- exact polynomials over Fraction / int (coefficients constant term first) -----------------------------------------
def pdeg(p):
    return len(p) - 1


def peval(p, x):
    r = F(0)
    for c in reversed(p):
        r = r * x + c
    return r


def pderiv(p):
    return [i * p[i] for i in range(1, len(p))] if len(p) > 1 else [F(0)]


def ptrim(p):
    while len(p) > 1 and p[-1] == 0:
        p = p[:-1]
    return p


def pdivmod(a, b):
    a = [F(x) for x in a]
    b = ptrim([F(x) for x in b])
    q = [F(0)] * max(1, len(a) - len(b) + 1)
    r = a[:]
    while len(r) >= len(b) and any(r):
        r = ptrim(r)
        if len(r) < len(b):
            break
        c = r[-1] / b[-1]
        k = len(r) - len(b)
        q[k] = c
        for i in range(len(b)):
            r[k + i] -= c * b[i]
        r = r[:-1]
    return ptrim(q), ptrim(r) if r else [F(0)]


def sturm_chain(p):
    p0 = [F(x) for x in p]
    p1 = pderiv(p0)
    chain = [p0, p1]
    while pdeg(chain[-1]) > 0:
        _, r = pdivmod(chain[-2], chain[-1])
        if all(x == 0 for x in r):
            break
        chain.append([-x for x in r])
    return chain


def sign_changes(chain, x):
    s = 0
    prev = 0
    for q in chain:
        v = peval(q, x)
        sg = (v > 0) - (v < 0)
        if sg == 0:
            continue
        if prev and sg != prev:
            s += 1
        prev = sg
    return s


def cauchy_bound(p):
    lc = abs(p[-1])
    return F(1) + max(abs(F(c)) / lc for c in p[:-1])


def real_roots(p, width=F(1, 2 ** 80)):
    """isolate every real root by Sturm counts, then refine by sign bisection; returns (count, [(lo, hi)])"""
    chain = sturm_chain(p)
    B = cauchy_bound(p)
    lo, hi = -B, B
    total = sign_changes(chain, lo) - sign_changes(chain, hi)
    boxes = [(lo, hi, total)]
    isolated = []
    while boxes:
        a, b, n = boxes.pop()
        if n == 0:
            continue
        if n == 1:
            isolated.append((a, b))
            continue
        m = (a + b) / 2
        if peval(p, m) == 0:                               # a rational root exactly at the midpoint
            isolated.append((m, m))
            nl = sign_changes(chain, a) - sign_changes(chain, m)   # V(a) - V(m) counts the roots in (a, m], m included
            boxes += [(a, m, nl - 1), (m, b, n - nl)]
            continue
        if n < 0:
            raise ValueError('negative Sturm count: the chain or the counts are wrong')
        nl = sign_changes(chain, a) - sign_changes(chain, m)
        boxes += [(a, m, nl), (m, b, n - nl)]
    out = []
    for a, b in isolated:
        if a == b:
            out.append((a, b))
            continue
        fa = peval(p, a)
        while b - a > width:
            m = (a + b) / 2
            fm = peval(p, m)
            if fm == 0:
                a = b = m
                break
            if (fm > 0) == (fa > 0):
                a, fa = m, fm
            else:
                b = m
        out.append((a, b))
    return total, sorted(out)


def content(p):
    g = 0
    for c in p:
        g = math.gcd(g, abs(int(c)))
    return g


def integer_roots(p):
    """integer roots of an integer polynomial with nonzero constant term (divisors of the constant term)"""
    a0 = abs(int(p[0]))
    if a0 == 0:
        return [0]
    roots = []
    d = 1
    while d * d <= a0:
        if a0 % d == 0:
            for r in {d, -d, a0 // d, -(a0 // d)}:
                if peval(p, F(r)) == 0:
                    roots.append(r)
        d += 1
    return sorted(set(roots))


def mignotte(p, k):
    """Mignotte: a factor of degree k of p has |coefficient i| <= C(k, i) ||p||_2 (p monic up to sign); the bound rounded up"""
    n2 = sum(int(c) ** 2 for c in p)
    norm = math.isqrt(n2) + 1
    return [math.comb(k, i) * norm for i in range(k + 1)]


def quadratic_factor(p):
    """a monic integer quadratic x^2 + a x + b dividing p (p monic up to sign, constant term ±1 → b = ±1), or None"""
    q = [int(c) for c in p]
    if abs(q[-1]) != 1 or q[0] == 0:
        raise ValueError('the search assumes a monic polynomial with nonzero constant term')
    bound = mignotte(q, 2)
    divs = [d for d in range(1, abs(q[0]) + 1) if q[0] % d == 0]
    for b in [d for d in divs] + [-d for d in divs]:
        for a in range(-bound[1], bound[1] + 1):
            _, r = pdivmod(q, [b, a, 1])
            if all(x == 0 for x in r):
                return (b, a, 1)
    return None


def irreducible_over_Z(p):
    """degree <= 5, monic up to sign: irreducible iff no integer root and no monic integer quadratic factor"""
    deg = pdeg(p)
    if deg <= 1:
        return True
    if integer_roots(p):
        return False
    if deg <= 3:
        return True
    if deg > 5:
        raise ValueError('irreducibility search written for degree <= 5')
    return quadratic_factor(p) is None


# ---- the certificate --------------------------------------------------------------------------------------------------
def load(path):
    d = json.load(open(path))
    edges = [F(x) for x in d['edges']]
    dens = [F(x) for x in d['densities']]
    A = [[int(c) for c in q] for q in d['A']]
    b = [F(x) for x in d['b']]
    return {'edges': edges, 'densities': dens, 'A': A, 'b': b, 'bound': F(d['bound']), 'raw': d}


def check_e1(c):
    e, d = c['edges'], c['densities']
    ok_d = all(x >= 0 for x in d)
    ok_e = all(e[i] < e[i + 1] for i in range(len(e) - 1)) and len(e) == len(d) + 1
    nz = [i for i, x in enumerate(d) if x > 0]
    smin, smax = (e[nz[0]], e[nz[-1] + 1]) if nz else (None, None)
    ok_s = bool(nz) and smin >= F(1, 20) and smax <= F(1037, 200)
    return {'ok': ok_d and ok_e and ok_s, 'densities_nonneg': ok_d, 'edges_increasing': ok_e, 'cells': len(d), 'nonzero_cells': len(nz),
            'support': [str(smin), str(smax)], 'support_inside_[1/20,1037/200]': ok_s}


def check_e2(c):
    rows = []
    ok = True
    seen = []
    for q in c['A']:
        deg = pdeg(q)
        prim = content(q) == 1
        monic = abs(q[-1]) == 1
        irr = irreducible_over_Z(q) if monic else False
        n_real, roots = real_roots(q)
        allreal = n_real == deg
        norm = [x * (1 if q[-1] > 0 else -1) for x in q]
        distinct = norm not in seen
        seen.append(norm)
        rows.append({'Q': q, 'deg': deg, 'primitive': prim, 'monic_up_to_sign': monic, 'irreducible': irr, 'real_roots': n_real, 'all_real': allreal, 'distinct': distinct,
                     'roots': [[str(a), str(b)] for a, b in roots]})
        ok = ok and prim and monic and irr and allreal and distinct
    return {'ok': ok, 'polynomials': rows}


def check_e3(c):
    e, d = c['edges'], c['densities']
    m = sum(d[i] * (e[i + 1] - e[i]) for i in range(len(d)))
    s = sum(bq * pdeg(q) for bq, q in zip(c['b'], c['A']))
    return {'ok': s < m and all(x >= 0 for x in c['b']), 'mass': str(m), 'sum_b_deg': str(s), 'ratio': float(s / m), 'weights_nonneg': all(x >= 0 for x in c['b'])}


def mass_and_moment(c):
    e, d = c['edges'], c['densities']
    m = sum(d[i] * (e[i + 1] - e[i]) for i in range(len(d)))
    t = sum(d[i] * (e[i + 1] ** 2 - e[i] ** 2) / 2 for i in range(len(d)))
    return m, t


def edge_jumps(c):
    """c_k = d_k - d_{k-1} at every edge e_k (d_{-1} = d_n = 0); only the nonzero ones"""
    e, d = c['edges'], c['densities']
    out = []
    for k in range(len(e)):
        prev = d[k - 1] if k - 1 >= 0 else F(0)
        cur = d[k] if k < len(d) else F(0)
        ck = cur - prev
        if ck != 0:
            out.append((k, e[k], from_fraction(e[k]), from_fraction(ck)))
    return out


def check_e4(c, e2):
    """∫ log|Q| dμ = Σ_k (d_{k-1} - d_k) G_Q(e_k) = -Σ_k c_k G_Q(e_k), G_Q(x) = Σ_r g(x - r) + x ln|lc|"""
    jumps = edge_jumps(c)
    rows = []
    ok = True
    for q, info in zip(c['A'], e2['polynomials']):
        roots = [(F(a), F(b)) for a, b in info['roots']]
        lc = abs(q[-1])
        total = (0.0, 0.0)
        for k, ek, ek_iv, ck_iv in jumps:
            G = (0.0, 0.0)
            for a, b in roots:
                u = from_fraction(ek - b)
                v = from_fraction(ek - a)
                G = iadd(G, g_iv((u[0], v[1])))
            if lc != 1:
                G = iadd(G, imul(ek_iv, ln_pt(float(lc))))
            total = isub(total, imul(ck_iv, G))
        rows.append({'Q': q, 'integral': [total[0], total[1]], 'positive': total[0] > 0})
        ok = ok and total[0] > 0
    return {'ok': ok, 'rows': rows}


def idiv(a, b):
    """a / b for intervals with b not containing 0"""
    if b[0] <= 0 <= b[1]:
        raise ZeroDivisionError('interval division by an interval containing zero')
    qs = (a[0] / b[0], a[0] / b[1], a[1] / b[0], a[1] / b[1])
    return (nd(min(qs)), nu(max(qs)))


def ipoly(q, X):
    """Q(X) by Horner, integer coefficients, outward"""
    P = (0.0, 0.0)
    for cc in reversed(q):
        P = iadd(imul(P, X), (float(cc), float(cc)))
    return P


def f_enclosure(X, jumps, A, b_f, A1=None, A2=None):
    """f over the box X = (x0, x1) inside one cell: a sound (lower, upper) pair.

    f = S + T. S holds the terms whose singularity touches the box — the two cell edges' g terms (g has an infinite
    slope at 0) and any -b_Q ln|Q| whose Q vanishes on the box — each bounded by its exact monotone range. T is smooth
    on the box and is bounded by a second-order Taylor form around the midpoint: T(x) in T(xm) ± |T'(xm)| w/2 ±
    max_X |T''| w²/8, with T'' enclosed naively on X. The point values share one logarithm per edge."""
    x0, x1 = X
    xm = (x0 + x1) / 2
    hw = max(xm - x0, x1 - xm)                                   # half width, as a float >= the true half width
    A1 = A1 or [pderiv_int(q) for q in A]
    A2 = A2 or [pderiv_int(q) for q in A1]
    S = (0.0, 0.0)
    Tm = (0.0, 0.0)                                              # T(xm)
    T1 = (0.0, 0.0)                                              # T'(xm)
    T2 = (0.0, 0.0)                                              # T''(X)
    for k, ek, ek_iv, ck_iv in jumps:
        if ek_iv[0] - x1 <= 0.0 <= ek_iv[1] - x0 or (x0 <= ek_iv[1] and ek_iv[0] <= x1):
            S = iadd(S, imul(ck_iv, g_iv(isub(X, ek_iv))))      # the edge is on or inside the box: exact range
            continue
        u = isub((xm, xm), ek_iv)                                # a thin interval around xm - e_k, never containing 0
        au = (min(abs(u[0]), abs(u[1])), max(abs(u[0]), abs(u[1])))
        l = ln_iv(au)                                            # ln|u|
        gu = isub(imul(u, l), u)                                 # g(u) = u ln|u| - u
        Tm = iadd(Tm, imul(ck_iv, gu))
        T1 = iadd(T1, imul(ck_iv, l))
        T2 = iadd(T2, idiv(ck_iv, isub(X, ek_iv)))
    for q, q1, q2, bq in zip(A, A1, A2, b_f):
        QX = ipoly(q, X)
        if QX[0] <= 0 <= QX[1]:
            mag = max(abs(QX[0]), abs(QX[1]))                   # the term's exact lower end: -b ln(max|Q|); upper +inf
            lmag = ln_pt(mag)[1]
            S = (nd(S[0] - nu(bq[1] * lmag)), INF)
            continue
        Qm = ipoly(q, (xm, xm))
        aQ = (min(abs(Qm[0]), abs(Qm[1])), max(abs(Qm[0]), abs(Qm[1])))
        Tm = isub(Tm, imul(bq, ln_iv(aQ)))
        Q1 = ipoly(q1, (xm, xm))
        T1 = isub(T1, imul(bq, idiv(Q1, Qm)))
        Q1X, Q2X = ipoly(q1, X), ipoly(q2, X)
        num = isub(imul(Q2X, QX), imul(Q1X, Q1X))
        T2 = isub(T2, imul(bq, idiv(num, imul(QX, QX))))
    m1 = max(abs(T1[0]), abs(T1[1]))
    m2 = max(abs(T2[0]), abs(T2[1]))
    slack = nu(nu(m1 * hw) + nu(nu(m2 * hw) * hw / 2))          # |T'| w/2 + |T''| w²/8 with hw = w/2
    lo = nd(nd(S[0] + Tm[0]) - slack)
    hi = INF if S[1] == INF else nu(nu(S[1] + Tm[1]) + slack)
    return lo, hi


def pderiv_int(q):
    return [i * q[i] for i in range(1, len(q))] if len(q) > 1 else [0]


def check_e5(c, wmin=W_MIN, max_depth=MAX_DEPTH):
    """every cell with d_i > 0, left to right; a box is proved (lower end > 0), a counterexample (upper end < 0: the run
    stops, REFUTED), or undecided below W_MIN (kept; the run goes on so that a counterexample elsewhere still refutes)"""
    e, d = c['edges'], c['densities']
    jumps = edge_jumps(c)
    b_f = [from_fraction(x) for x in c['b']]
    A = c['A']
    A1 = [pderiv_int(q) for q in A]
    A2 = [pderiv_int(q) for q in A1]
    cells = [i for i, x in enumerate(d) if x > 0]
    proved = 0
    min_lower = INF
    max_depth_seen = 0
    worst = None
    undecided = []
    for i in cells:
        lo_e, hi_e = from_fraction(e[i]), from_fraction(e[i + 1])
        stack = [(lo_e[0], hi_e[1], 0)]
        while stack:
            x0, x1, depth = stack.pop()
            flo, fhi = f_enclosure((x0, x1), jumps, A, b_f, A1, A2)
            if flo > 0:
                proved += 1
                if flo < min_lower:
                    min_lower = flo
                    worst = [x0, x1]
                max_depth_seen = max(max_depth_seen, depth)
                continue
            if fhi < 0:
                return {'ok': False, 'verdict': 'REFUTED', 'counterexample_box': [x0, x1], 'f_upper': fhi, 'cells': len(cells), 'proved_boxes': proved,
                        'undecided_boxes': len(undecided)}
            if (x1 - x0) < wmin or depth >= max_depth:
                undecided.append([x0, x1, flo, fhi])
                continue
            xm = (x0 + x1) / 2
            stack += [(xm, x1, depth + 1), (x0, xm, depth + 1)]
    if undecided:
        return {'ok': False, 'verdict': 'REFUSED', 'undecided_boxes': len(undecided), 'first_undecided': undecided[0], 'cells': len(cells), 'proved_boxes': proved}
    return {'ok': True, 'verdict': 'CERTIFIED', 'cells': len(cells), 'proved_boxes': proved, 'min_certified_lower_bound': min_lower, 'worst_box': worst,
            'max_depth': max_depth_seen, 'w_min': wmin, 'nonzero_edge_jumps': len(jumps)}


def check_e6(c, printed):
    m, t = mass_and_moment(c)
    bound = t / m
    dec = decimal(bound, 24)
    return {'ok': bound == c['bound'] and (printed is None or bound <= printed), 'mass': str(m), 'moment': str(t), 'bound': str(bound),
            'bound_decimal': dec, 'equals_certificate_bound': bound == c['bound'], 'printed': str(printed) if printed is not None else None,
            'le_printed': (bound <= printed) if printed is not None else None}


def decimal(x, k=24):
    neg = x < 0
    x = abs(x)
    ip = x.numerator // x.denominator
    rem = x - ip
    digits = []
    for _ in range(k):
        rem *= 10
        dgt = rem.numerator // rem.denominator
        digits.append(str(dgt))
        rem -= dgt
    return ('-' if neg else '') + str(ip) + '.' + ''.join(digits) + '…'


# ---- red controls: planted corruptions that must be caught ---------------------------------------------------------------
def corrupt(c, kind):
    c = {'edges': list(c['edges']), 'densities': list(c['densities']), 'A': [list(q) for q in c['A']], 'b': list(c['b']), 'bound': c['bound']}
    if kind == 'densities98':
        c['densities'] = [x * F(98, 100) for x in c['densities']]
    elif kind == 'weights13':
        c['b'] = [x * F(13, 10) for x in c['b']]
    elif kind == 'mass005':
        c['densities'][10] += F(1, 100)                     # extra mass in the first cell of the support
    elif kind == 'bound':
        c['bound'] = c['bound'] - F(1, 10 ** 12)
    elif kind == 'reducible':
        c['A'][2] = [2, -3, 1]                              # x^2 - 3x + 2 = (x-1)(x-2)
    elif kind == 'complex':
        c['A'][2] = [1, 0, 1]                               # x^2 + 1
    else:
        raise ValueError(kind)
    return c


def decide(c, printed=None, wmin=W_MIN, e5=True):
    t0 = time.time()
    r = {'E1': check_e1(c), 'E2': check_e2(c), 'E3': check_e3(c)}
    r['E6'] = check_e6(c, printed)
    r['E4'] = check_e4(c, r['E2']) if r['E2']['ok'] else {'ok': False, 'skipped': 'E2 failed'}
    exact_ok = all(r[k]['ok'] for k in ('E1', 'E2', 'E3', 'E4', 'E6'))
    if e5 and exact_ok:
        r['E5'] = check_e5(c, wmin)
    elif e5:
        r['E5'] = {'ok': False, 'skipped': 'an earlier condition failed: ' + ','.join(k for k in ('E1', 'E2', 'E3', 'E4', 'E6') if not r[k]['ok'])}
    conds = [k for k in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6') if k in r]
    r['failed'] = [k for k in conds if not r[k]['ok'] and 'skipped' not in r[k]]      # a skipped condition is not a failed one
    if not r['failed']:
        verdict = 'CERTIFIED'
    elif r['failed'] == ['E5'] and r['E5'].get('verdict') == 'REFUSED':
        verdict = 'REFUSED'
    else:
        verdict = 'REFUTED'
    r['verdict'] = verdict
    r['seconds'] = round(time.time() - t0, 1)
    return r


def main(argv):
    path = argv[1]
    printed = F(argv[argv.index('--printed') + 1]) if '--printed' in argv else None
    wmin = float(argv[argv.index('--wmin') + 1]) if '--wmin' in argv else W_MIN
    c = load(path)
    if '--red' in argv:
        kind = argv[argv.index('--red') + 1]
        c = corrupt(c, kind)
    r = decide(c, printed, wmin)
    if '--json' in argv:
        json.dump(r, open(argv[argv.index('--json') + 1], 'w'), indent=1)
    print(json.dumps({k: (v if k in ('verdict', 'failed', 'seconds') else v.get('ok')) for k, v in r.items()}))
    if 'E5' in r and r['E5'].get('verdict') == 'CERTIFIED':
        print('E5', {k: r['E5'][k] for k in ('cells', 'proved_boxes', 'min_certified_lower_bound', 'max_depth')})
    print('E6', r['E6']['bound'], r['E6']['bound_decimal'])
    return 0 if r['verdict'] == 'CERTIFIED' else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv))
