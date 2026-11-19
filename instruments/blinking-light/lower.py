#!/usr/bin/env python3
"""lower.py -- decide the finite conditions of a lower-bound certificate for g(C1, C2), in exact rational arithmetic,
over the WHOLE diamond |h| + |d| <= 1, with no symmetry assumed.

Written for the blinking-light record (notes/blinking-light-preregistration-2026-11-19.md) from the text of
Theorem D (claude/lifting.md, section 3) and Theorem C (claude/locality.md) and the certificate-format paragraph of
the pre-registration; it shares no code with, and its author did not open, any program of either track
(verify_local.py, review_local_certificate.py, ...) or the run's checker.

THE CONDITIONS (re-derived from Theorems D and C; beta = p + q, gamma = p - q, w = h + d, v = h - d):
  (D1)  beta (w - f) + gamma (v - f) - l1 f (w + v)/2 - l2 w v - mu
          = 2 p (h - f) + 2 q d - l1 f h - l2 (h^2 - d^2) - mu  >= 0     on the diamond, for f = +1 and f = -1;
  (LOC) on every strip between consecutive knot lines h = +-h_k, at every interior point,
          [[8 p_h - x1^2, 4 (p_d + q_h) - x1 x2], [same, 8 q_d - x2^2]]  is positive semidefinite,
          x1 = 2 q - psi_h,  x2 = 2 p - psi_d  (derivatives within the strip);
        checked as  a >= 0, c >= 0, a c - b^2 >= 0  (all principal minors of a symmetric 2x2 matrix);
  continuity: p, q, psi continuous (the odd functions vanish at h = 0);
  arithmetic: l1 C1 + l2 C2 + mu equals the stated bound exactly.

THE FORMAT, as read (evidence in CHECKERS.md): `functions` is a list of na + nk + npsi lists, in the order
A_0..A_{na-1}, K_0..K_{nk-1}, P_0..P_{npsi-1}; list i gives that function's values at the knots 0 = h_0 < ... < h_K = 1,
linear between knots in |h|; A and P are odd in h (A(h) = sign(h) A(|h|)), K is even (K(h) = K(|h|)).
  p = sum_k A_k(h) d^(2k),  q = sum_k K_k(h) d^(2k+1),  psi = sum_k P_k(h) d^(2k+1).

METHOD. On each of the 2K strips (K on each side of h = 0) every condition is a polynomial in (h, d) with rational
coefficients. The substitution h = h_lo + (h_hi - h_lo) t, d = (1 - |h|)(2u - 1) maps the box [0,1]^2 onto the closed
cell (strip intersected with the diamond), so the condition is >= 0 on the cell iff the composed polynomial is >= 0
on [0,1]^2. That polynomial is put in tensor Bernstein form (exact), scaled to integers by a positive factor, and:
  * all Bernstein coefficients >= 0  =>  the polynomial is >= 0 on the box (a non-negative combination of
    non-negative basis functions) -- PROVED for that box;
  * a corner coefficient < 0  =>  the polynomial is negative at that corner (corner coefficients are values);
    a rational interior point near it is then found and the condition is evaluated there DIRECTLY from the knot
    data (a separate evaluator, chain rule on the piecewise-linear functions), which is the witness;
  * otherwise the box is halved (exact integer de Casteljau at 1/2, along the direction with the larger
    coefficient variation) until a sign is found or the level limit is reached (then REFUSED: not proved).
Before the search, three exact IDENTITY checks per strip tie the integer array to the definitions (a mismatch is an
internal error, REFUSED): (i) each expansion equals the direct evaluator as a polynomial in (h, d) (agreement on a
tensor grid larger than the degree bound); (ii) the composition with the box map equals the expansion (agreement on
a tensor grid in (t, u) of the composition's degree bound); (iii) the Bernstein array converts back to the power
array exactly, and the integer array is a positive multiple of it.

Output: JSON on stdout {verdict: PROVED | REFUTED | REFUSED, objective, bound_matches, boxes, seconds, witness,
reading_of_format, ...}; exit 0 only on PROVED.
Usage:  python3 lower.py CERT.json [--c1 3/10] [--c2 2/25] [--jobs N] [--max-level L] [--budget B]
Import: from lower import check;  check(cert_dict, c1, c2) -> dict
Python 3.9 standard library only.
"""

import json
import os
import sys
import time
from fractions import Fraction as Fr
from math import comb

READING = ("functions = [A_0..A_{na-1}, K_0..K_{nk-1}, P_0..P_{npsi-1}], each the values at the knots "
           "0 = h_0 < ... < h_K = 1, linear in |h| between knots; A and P odd in h (A(h) = sign(h) A(|h|)), "
           "K even (K(h) = K(|h|)); p = sum A_k d^(2k), q = sum K_k d^(2k+1), psi = sum P_k d^(2k+1); "
           "w = h + d, v = h - d, beta = p + q, gamma = p - q")

CONDS = ("D1(f=+1)", "D1(f=-1)", "LOC a=8p_h-x1^2", "LOC c=8q_d-x2^2", "LOC det=ac-b^2")


class Malformed(Exception):
    pass


# ============================================================ certificate parsing (shared by both evaluators)

def parse(cert):
    try:
        knots = [Fr(str(x)) for x in cert["knots"]]
        na, nk, npsi = cert["na"], cert["nk"], cert["npsi"]
        funcs = [[Fr(str(x)) for x in col] for col in cert["functions"]]
        l1, l2, mu = Fr(str(cert["l1"])), Fr(str(cert["l2"])), Fr(str(cert["mu"]))
        bound = Fr(str(cert["bound"]))
    except (KeyError, TypeError, ValueError, ZeroDivisionError) as e:
        raise Malformed("cannot read the certificate: %r" % (e,))
    for name, v in (("na", na), ("nk", nk), ("npsi", npsi)):
        if not isinstance(v, int) or isinstance(v, bool) or v < 0:
            raise Malformed("%s must be a non-negative integer" % name)
    if len(knots) < 2 or knots[0] != 0 or knots[-1] != 1:
        raise Malformed("knots must run from 0 to 1")
    if any(a >= b for a, b in zip(knots, knots[1:])):
        raise Malformed("knots must be strictly increasing")
    if len(funcs) != na + nk + npsi:
        raise Malformed("functions has %d lists, na + nk + npsi = %d" % (len(funcs), na + nk + npsi))
    if any(len(col) != len(knots) for col in funcs):
        raise Malformed("every function list must have one value per knot")
    return {"knots": knots, "A": funcs[:na], "K": funcs[na:na + nk], "P": funcs[na + nk:],
            "l1": l1, "l2": l2, "mu": mu, "bound": bound}


# ============================================================ evaluator 1: DIRECT from the definitions

def _locate(knots, x):
    """index k with knots[k] <= x <= knots[k+1] (0 <= x <= 1)."""
    lo, hi = 0, len(knots) - 2
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if knots[mid] <= x:
            lo = mid
        else:
            hi = mid - 1
    return lo


def direct(C, h, d, strip=None):
    """All conditions at the point (h, d), from the knot data by interpolation and the chain rule.
    strip = (k, side) selects the strip whose derivatives are used when h lies on a knot line."""
    knots = C["knots"]
    ah = abs(h)
    if strip is None:
        sg = 1 if h >= 0 else -1
        k = _locate(knots, ah)
    else:
        k, sg = strip
    x0, x1 = knots[k], knots[k + 1]

    def val_slope(col):
        s = (col[k + 1] - col[k]) / (x1 - x0)
        return col[k] + s * (ah - x0), s

    p = ph = pd = Fr(0)
    for i, col in enumerate(C["A"]):          # A odd: A(h) = sg F(|h|), A'(h) = F'(|h|)
        F, s = val_slope(col)
        Ai, Ai_h = sg * F, s
        p += Ai * d ** (2 * i)
        ph += Ai_h * d ** (2 * i)
        if i > 0:
            pd += 2 * i * Ai * d ** (2 * i - 1)
    q = qh = qd = Fr(0)
    for i, col in enumerate(C["K"]):          # K even: K(h) = F(|h|), K'(h) = sg F'(|h|)
        F, s = val_slope(col)
        Ki, Ki_h = F, sg * s
        q += Ki * d ** (2 * i + 1)
        qh += Ki_h * d ** (2 * i + 1)
        qd += (2 * i + 1) * Ki * d ** (2 * i)
    psi = psih = psid = Fr(0)
    for i, col in enumerate(C["P"]):          # P odd
        F, s = val_slope(col)
        Pi, Pi_h = sg * F, s
        psi += Pi * d ** (2 * i + 1)
        psih += Pi_h * d ** (2 * i + 1)
        psid += (2 * i + 1) * Pi * d ** (2 * i)
    l1, l2, mu = C["l1"], C["l2"], C["mu"]
    # (D1) in the original variables, from Theorem D: beta (w - f) + gamma (v - f) - l1 f (w+v)/2 - l2 w v - mu
    w, v = h + d, h - d
    beta, gamma = p + q, p - q
    D1 = {f: beta * (w - f) + gamma * (v - f) - l1 * f * (w + v) / 2 - l2 * w * v - mu for f in (1, -1)}
    x1_ = 2 * q - psih
    x2_ = 2 * p - psid
    a = 8 * ph - x1_ ** 2
    b = 4 * (pd + qh) - x1_ * x2_
    c = 8 * qd - x2_ ** 2
    return {CONDS[0]: D1[1], CONDS[1]: D1[-1], CONDS[2]: a, CONDS[3]: c, CONDS[4]: a * c - b * b,
            "_matrix": (a, b, c)}


# ============================================================ evaluator 2: polynomial expansion on a strip

def padd(P, Q, s=1):
    R = dict(P)
    for key, v in Q.items():
        nv = R.get(key, 0) + s * v
        if nv:
            R[key] = nv
        else:
            R.pop(key, None)
    return R


def pmul(P, Q):
    R = {}
    for (i, j), u in P.items():
        for (k, l), v in Q.items():
            key = (i + k, j + l)
            nv = R.get(key, 0) + u * v
            if nv:
                R[key] = nv
            else:
                R.pop(key, None)
    return R


def pscale(P, c):
    return {key: c * v for key, v in P.items()} if c else {}


def pdh(P):
    return {(i - 1, j): i * v for (i, j), v in P.items() if i > 0}


def pdd(P):
    return {(i, j - 1): j * v for (i, j), v in P.items() if j > 0}


def strip_conditions(C, k, side):
    """The five conditions as polynomials {(i, j): coeff} in h^i d^j on strip k of the given side
    (side +1: h in [h_k, h_{k+1}];  side -1: h in [-h_{k+1}, -h_k])."""
    knots = C["knots"]
    x0, x1 = knots[k], knots[k + 1]

    def lin(col, odd):
        c1 = (col[k + 1] - col[k]) / (x1 - x0)
        c0 = col[k] - c1 * x0                 # F(x) = c0 + c1 x for x = |h| in [x0, x1]
        if side > 0:
            return c0, c1
        # h < 0, |h| = -h:  F(|h|) = c0 - c1 h
        return (-c0, c1) if odd else (c0, -c1)

    def term(c0c1, dpow):
        c0, c1 = c0c1
        P = {}
        if c0:
            P[(0, dpow)] = c0
        if c1:
            P[(1, dpow)] = c1
        return P

    p, q, psi = {}, {}, {}
    for i, col in enumerate(C["A"]):
        p = padd(p, term(lin(col, True), 2 * i))
    for i, col in enumerate(C["K"]):
        q = padd(q, term(lin(col, False), 2 * i + 1))
    for i, col in enumerate(C["P"]):
        psi = padd(psi, term(lin(col, True), 2 * i + 1))
    H = {(1, 0): Fr(1)}
    D = {(0, 1): Fr(1)}
    l1, l2, mu = C["l1"], C["l2"], C["mu"]
    out = {}
    for f, name in ((1, CONDS[0]), (-1, CONDS[1])):
        e = pmul(pscale(p, 2), padd(H, {(0, 0): Fr(f)}, -1))            # 2 p (h - f)
        e = padd(e, pscale(pmul(q, D), 2))                               # + 2 q d
        e = padd(e, {(1, 0): -l1 * f})                                   # - l1 f h
        e = padd(e, {(2, 0): -l2, (0, 2): l2})                           # - l2 (h^2 - d^2)
        e = padd(e, {(0, 0): -mu})                                       # - mu
        out[name] = e
    X1 = padd(pscale(q, 2), pdh(psi), -1)
    X2 = padd(pscale(p, 2), pdd(psi), -1)
    a = padd(pscale(pdh(p), 8), pmul(X1, X1), -1)
    b = padd(pscale(padd(pdd(p), pdh(q)), 4), pmul(X1, X2), -1)
    c = padd(pscale(pdd(q), 8), pmul(X2, X2), -1)
    out[CONDS[2]] = a
    out[CONDS[3]] = c
    out[CONDS[4]] = padd(pmul(a, c), pmul(b, b), -1)
    return out


def _umul(a, b):
    r = [Fr(0)] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                r[i + j] += x * y
    return r


def _upow_list(a, n):
    res = [[Fr(1)]]
    for _ in range(n):
        res.append(_umul(res[-1], a))
    return res


def strip_map(C, k, side):
    knots = C["knots"]
    x0, x1 = knots[k], knots[k + 1]
    w = x1 - x0
    if side > 0:
        hl = x0
        Mt = [1 - x0, -w]          # 1 - |h| = 1 - (x0 + w t)
    else:
        hl = -x1
        Mt = [1 - x1, w]           # 1 - |h| = 1 + h = 1 - x1 + w t
    return hl, w, Mt


def to_box(P, C, k, side):
    """Compose with h = hl + w t, d = M(t)(2u - 1). Returns the full (n+1) x (m+1) array T[a][b] of t^a u^b."""
    if not P:
        return [[Fr(0)]]
    hl, w, Mt = strip_map(C, k, side)
    ih = max(i for i, j in P)
    jd = max(j for i, j in P)
    Hp = _upow_list([hl, w], ih)
    Mp = _upow_list(Mt, jd)
    Sp = _upow_list([Fr(-1), Fr(2)], jd)
    n = ih + jd
    m = jd
    T = [[Fr(0)] * (m + 1) for _ in range(n + 1)]
    for (i, j), cval in P.items():
        tpoly = _umul(Hp[i], Mp[j])
        for a_, x in enumerate(tpoly):
            if x:
                cx = cval * x
                for b_, y in enumerate(Sp[j]):
                    if y:
                        T[a_][b_] += cx * y
    # trim trailing zero degrees
    while len(T) > 1 and all(x == 0 for x in T[-1]):
        T.pop()
    while len(T[0]) > 1 and all(row[-1] == 0 for row in T):
        for row in T:
            row.pop()
    return T


def _bern1(c):
    n = len(c) - 1
    return [sum((Fr(comb(i, kk), comb(n, kk)) * c[kk] for kk in range(i + 1)), Fr(0)) for i in range(n + 1)]


def bernstein(T):
    n, m = len(T) - 1, len(T[0]) - 1
    cols = [_bern1([T[a_][b_] for a_ in range(n + 1)]) for b_ in range(m + 1)]
    B1 = [[cols[b_][a_] for b_ in range(m + 1)] for a_ in range(n + 1)]
    return [_bern1(row) for row in B1]


def integerize(B):
    L = 1
    for row in B:
        for x in row:
            L = L * x.denominator // _gcd(L, x.denominator)
    return [[int(x * L) for x in row] for row in B], L


def _gcd(a, b):
    while b:
        a, b = b, a % b
    return a


# ============================================================ exact integer subdivision

def _split1(c):
    """de Casteljau at 1/2 on integer Bernstein coefficients c (degree n); both halves scaled by 2^n."""
    n = len(c) - 1
    left = [0] * (n + 1)
    right = [0] * (n + 1)
    left[0] = c[0] << n
    right[n] = c[n] << n
    cur = c
    for r in range(1, n + 1):
        cur = [cur[i] + cur[i + 1] for i in range(n - r + 1)]
        left[r] = cur[0] << (n - r)
        right[n - r] = cur[n - r] << (n - r)
    return left, right


def _reduce(B):
    tz = None
    for row in B:
        for x in row:
            if x:
                z = (x & -x).bit_length() - 1
                if tz is None or z < tz:
                    tz = z
                    if tz == 0:
                        return B
    if not tz:
        return B
    return [[x >> tz for x in row] for row in B]


def split_t(B):
    n, m = len(B) - 1, len(B[0]) - 1
    L = [[0] * (m + 1) for _ in range(n + 1)]
    R = [[0] * (m + 1) for _ in range(n + 1)]
    for j in range(m + 1):
        l, r = _split1([B[i][j] for i in range(n + 1)])
        for i in range(n + 1):
            L[i][j] = l[i]
            R[i][j] = r[i]
    return _reduce(L), _reduce(R)


def split_u(B):
    L, R = [], []
    for row in B:
        l, r = _split1(row)
        L.append(l)
        R.append(r)
    return _reduce(L), _reduce(R)


def search(B, max_level, budget):
    """B: integer Bernstein array on [0,1]^2. Returns (status, boxes, max_level_reached, info).
    status 'proved' | 'negative' (info = corner (t, u) as Fractions and the box) | 'undecided'."""
    n, m = len(B) - 1, len(B[0]) - 1
    stack = [(B, 0, 0, 0, 0)]          # (coeffs, ta, tl, ua, ul): t in [ta/2^tl, (ta+1)/2^tl], same for u
    boxes = 0
    deepest = 0
    undecided = None
    while stack:
        Bx, ta, tl, ua, ul = stack.pop()
        boxes += 1
        deepest = max(deepest, tl + ul)
        mn = min(min(row) for row in Bx)
        if mn >= 0:
            continue
        for val, ct, cu in ((Bx[0][0], 0, 0), (Bx[n][0], 1, 0), (Bx[0][m], 0, 1), (Bx[n][m], 1, 1)):
            if val < 0:
                box = (Fr(ta, 2 ** tl), Fr(ta + 1, 2 ** tl), Fr(ua, 2 ** ul), Fr(ua + 1, 2 ** ul))
                corner = (Fr(ta + ct, 2 ** tl), Fr(ua + cu, 2 ** ul))
                return "negative", boxes, deepest, {"corner": corner, "box": box}
        can_t = n > 0 and tl < max_level
        can_u = m > 0 and ul < max_level
        if not (can_t or can_u) or boxes >= budget:
            if undecided is None:
                undecided = {"box": (Fr(ta, 2 ** tl), Fr(ta + 1, 2 ** tl), Fr(ua, 2 ** ul), Fr(ua + 1, 2 ** ul)),
                             "min_coefficient_sign": -1, "budget_hit": boxes >= budget}
            if boxes >= budget:
                break
            continue
        if can_t and can_u:
            vt = n * max(abs(Bx[i + 1][j] - Bx[i][j]) for i in range(n) for j in range(m + 1))
            vu = m * max(abs(Bx[i][j + 1] - Bx[i][j]) for i in range(n + 1) for j in range(m))
            dirn = "t" if vt >= vu else "u"
        else:
            dirn = "t" if can_t else "u"
        if dirn == "t":
            L, R = split_t(Bx)
            kids = [(L, 2 * ta, tl + 1, ua, ul), (R, 2 * ta + 1, tl + 1, ua, ul)]
        else:
            L, R = split_u(Bx)
            kids = [(L, ta, tl, 2 * ua, ul + 1), (R, ta, tl, 2 * ua + 1, ul + 1)]
        # visit the child with the more negative minimum first (it is pushed last)
        kids.sort(key=lambda kd: -_minfrac(kd[0]))
        stack.extend(kids)
    if undecided is not None:
        return "undecided", boxes, deepest, undecided
    return "proved", boxes, deepest, None


def _minfrac(B):
    # comparable proxy for the minimum coefficient relative to the largest (scales differ between siblings)
    mn = min(min(row) for row in B)
    mx = max(max(abs(x) for x in row) for row in B) or 1
    return Fr(mn, mx)


# ============================================================ one strip: build, self-check, search

def _map_point(C, k, side, t, u):
    hl, w, Mt = strip_map(C, k, side)
    h = hl + w * t
    d = (Mt[0] + Mt[1] * t) * (2 * u - 1)
    return h, d


def _interior_witness(C, k, side, cond, corner, box):
    """a rational point strictly inside the box (hence inside the strip cell) where the DIRECT value is negative."""
    t0, u0 = corner
    tc = (box[0] + box[1]) / 2
    uc = (box[2] + box[3]) / 2
    for e in range(1, 400):
        t = t0 + (tc - t0) / 2 ** e
        u = u0 + (uc - u0) / 2 ** e
        h, d = _map_point(C, k, side, t, u)
        val = direct(C, h, d, strip=(k, side))[cond]
        if val < 0:
            return h, d, val
    return None


def _peval_fast(P, hp, dp):
    return sum((v * hp[i] * dp[j] for (i, j), v in P.items()), Fr(0))


def _power_from_bernstein(B):
    """inverse of bernstein(): c_k = C(n,k) sum_{i<=k} (-1)^(k-i) C(k,i) b_i, along each variable."""
    def inv1(b):
        n = len(b) - 1
        return [comb(n, kk) * sum(((-1) ** (kk - i) * comb(kk, i) * b[i] for i in range(kk + 1)), Fr(0))
                for kk in range(n + 1)]
    n, m = len(B) - 1, len(B[0]) - 1
    rows = [inv1(row) for row in B]
    cols = [inv1([rows[a_][b_] for a_ in range(n + 1)]) for b_ in range(m + 1)]
    return [[cols[b_][a_] for b_ in range(m + 1)] for a_ in range(n + 1)]


def _identity_checks(C, k, side, polys):
    """Prove, per strip, that the integer-free Bernstein data used by the search is the condition of the
    definitions:  (i) every expansion equals the DIRECT evaluator as a polynomial in (h, d) -- both have
    h-degree <= 4 and d-degree <= 4 m0 (m0 = 2 max(na, nk, npsi) + 1), so agreement on a 5 x (4 m0 + 1) tensor
    grid is identity;  (ii) the composition with the box map equals the expansion on an (n+1) x (m+1) grid in
    (t, u), n, m the degree bounds of the composition;  (iii) the Bernstein array converts back to the power
    array exactly. Returns {cond: (T, Bf)}; raises RuntimeError on any mismatch."""
    knots = C["knots"]
    x0, x1 = knots[k], knots[k + 1]
    m0 = 2 * max(len(C["A"]), len(C["K"]), len(C["P"])) + 1
    for cond in CONDS:
        P = polys[cond]
        if P and (max(i for i, j in P) > 4 or max(j for i, j in P) > 4 * m0):
            raise RuntimeError("expansion of %s exceeds the degree bound" % cond)
    hs = [side * (x0 + (x1 - x0) * Fr(i + 1, 6)) for i in range(5)]
    ds = [Fr(j, 4 * m0) - Fr(1, 2) for j in range(4 * m0 + 1)]
    for hh in hs:
        hp = [hh ** i for i in range(5)]
        for dd in ds:
            dp = [dd ** j for j in range(4 * m0 + 1)]
            dv = direct(C, hh, dd, strip=(k, side))
            for cond in CONDS:
                if _peval_fast(polys[cond], hp, dp) != dv[cond]:
                    raise RuntimeError("expansion != direct for %s at strip %d side %d, (h, d) = (%s, %s)"
                                       % (cond, k, side, hh, dd))
    out = {}
    for cond in CONDS:
        P = polys[cond]
        T = to_box(P, C, k, side)
        if P:
            ih = max(i for i, j in P)
            jd = max(j for i, j in P)
            nb, mb = ih + jd, jd
            ts = [Fr(i, max(nb, 1)) for i in range(nb + 1)]
            us = [Fr(j, max(mb, 1)) for j in range(mb + 1)]
            for tt in ts:
                hh, _ = _map_point(C, k, side, tt, Fr(0))
                hp = [hh ** i for i in range(ih + 1)]
                # T at (tt, u) as a polynomial in u
                tcol = [sum((T[a_][b_] * tt ** a_ for a_ in range(len(T))), Fr(0)) for b_ in range(len(T[0]))]
                for uu in us:
                    _, dd = _map_point(C, k, side, tt, uu)
                    dp = [dd ** j for j in range(jd + 1)]
                    tv = sum((cb * uu ** b_ for b_, cb in enumerate(tcol)), Fr(0))
                    if tv != _peval_fast(P, hp, dp):
                        raise RuntimeError("box composition != expansion for %s at strip %d side %d"
                                           % (cond, k, side))
        Bf = bernstein(T)
        if _power_from_bernstein(Bf) != T:
            raise RuntimeError("Bernstein conversion does not invert for %s at strip %d side %d" % (cond, k, side))
        out[cond] = (T, Bf)
    return out


def do_strip(args):
    C, k, side, max_level, budget = args
    t_start = time.time()
    res = {"strip": [k, side], "conds": {}, "error": None}
    try:
        polys = strip_conditions(C, k, side)
        forms = _identity_checks(C, k, side, polys)
        for cond in CONDS:
            T, Bf = forms[cond]
            Bi, L = integerize(Bf)
            if not (isinstance(L, int) and L > 0) or any(Bi[i][j] != Bf[i][j] * L for i in range(len(Bi))
                                                         for j in range(len(Bi[0]))):
                raise RuntimeError("integer scaling is not a positive multiple for %s" % cond)
            status, boxes, deepest, info = search(Bi, max_level, budget)
            entry = {"status": status, "boxes": boxes, "deepest": deepest,
                     "degree": [len(Bi) - 1, len(Bi[0]) - 1]}
            if status == "negative":
                wit = _interior_witness(C, k, side, cond, info["corner"], info["box"])
                if wit is None:
                    raise RuntimeError("negative corner but no interior point found")
                h, d, val = wit
                entry["status"] = "refuted"
                entry["witness"] = {"h": str(h), "d": str(d), "value": str(val), "value_approx": float(val)}
            elif status == "undecided":
                entry["box_tu"] = [str(x) for x in info["box"]]
                entry["budget_hit"] = info["budget_hit"]
            res["conds"][cond] = entry
            if entry["status"] == "refuted":
                break
    except RuntimeError as e:
        res["error"] = str(e)
    res["seconds"] = time.time() - t_start
    return res


# ============================================================ the decision

def check(cert, c1=Fr(3, 10), c2=Fr(2, 25), jobs=None, max_level=40, budget=400000, progress=False):
    t0 = time.time()
    c1, c2 = Fr(str(c1)), Fr(str(c2))
    out = {"verdict": None, "objective": None, "bound": None, "bound_matches": None, "boxes": 0, "seconds": None,
           "witness": None, "reading_of_format": READING, "c1": str(c1), "c2": str(c2), "continuity": None,
           "strips": None, "conditions": list(CONDS), "max_level": max_level, "budget_per_condition": budget}
    try:
        C = parse(cert)
    except Malformed as e:
        out["verdict"] = "REFUSED"
        out["reason"] = str(e)
        out["seconds"] = round(time.time() - t0, 2)
        return out
    obj = C["l1"] * c1 + C["l2"] * c2 + C["mu"]
    out["objective"] = {"exact": str(obj), "decimal": "%.12f" % float(obj)}
    out["bound"] = str(C["bound"])
    out["bound_matches"] = (obj == C["bound"])
    # continuity: odd functions (A, P) must vanish at h = 0; K even and the piecewise-linear interpolation are
    # continuous by construction
    bad = [("A_%d" % i, col[0]) for i, col in enumerate(C["A"]) if col[0] != 0] + \
          [("P_%d" % i, col[0]) for i, col in enumerate(C["P"]) if col[0] != 0]
    out["continuity"] = "ok" if not bad else "fails: " + ", ".join("%s(0+) = %s" % (nm, v) for nm, v in bad)
    witnesses = []
    if not out["bound_matches"]:
        witnesses.append({"h": None, "d": None, "f": None, "condition": "bound = l1 C1 + l2 C2 + mu",
                          "value": str(obj - C["bound"]),
                          "note": "objective - stated bound (exact); the stated bound does not follow"})
    if bad:
        # p jumps across h = 0 by 2 sum_k A_k(0) d^(2k), psi by 2 sum_k P_k(0) d^(2k+1): a non-zero polynomial in d,
        # so one of d = 1/2, 1/3, ... gives a non-zero jump
        fam, odd_shift = ("p", 0) if any(nm[0] == "A" for nm, v in bad) else ("psi", 1)
        cols = C["A"] if fam == "p" else C["P"]
        for den in range(2, 100):
            dd = Fr(1, den)
            jump = 2 * sum(col[0] * dd ** (2 * i + odd_shift) for i, col in enumerate(cols))
            if jump != 0:
                break
        witnesses.append({"h": "0", "d": str(dd), "f": None, "condition": "continuity of %s across h = 0" % fam,
                          "value": str(jump), "note": "the jump %s(0+, d) - %s(0-, d), exact" % (fam, fam)})
    K = len(C["knots"]) - 1
    tasks = [(C, k, side, max_level, budget) for side in (1, -1) for k in range(K)]
    out["strips"] = len(tasks)
    results = []
    jobs = jobs or max(1, (os.cpu_count() or 2) - 2)
    refuted = None
    if jobs == 1:
        it = map(do_strip, tasks)
        pool = None
    else:
        from multiprocessing import get_context
        pool = get_context("spawn").Pool(jobs)
        it = pool.imap_unordered(do_strip, tasks)
    try:
        for r in it:
            results.append(r)
            if progress:
                sys.stderr.write("\rstrips done: %d/%d" % (len(results), len(tasks)))
                sys.stderr.flush()
            if any(e["status"] == "refuted" for e in r["conds"].values()):
                refuted = r
                break
    finally:
        if pool is not None:
            pool.terminate()
            pool.join()
    if progress:
        sys.stderr.write("\n")
    errors = [r for r in results if r["error"]]
    out["boxes"] = sum(e["boxes"] for r in results for e in r["conds"].values())
    per_cond = {}
    for r in results:
        for cond, e in r["conds"].items():
            pc = per_cond.setdefault(cond, {"proved": 0, "refuted": 0, "undecided": 0, "boxes": 0, "deepest": 0})
            pc[{"proved": "proved", "refuted": "refuted", "undecided": "undecided"}[e["status"]]] += 1
            pc["boxes"] += e["boxes"]
            pc["deepest"] = max(pc["deepest"], e["deepest"])
    out["per_condition"] = per_cond
    out["slowest_strip_seconds"] = round(max((r["seconds"] for r in results), default=0), 2)
    if refuted is not None:
        k, side = refuted["strip"]
        cond, e = [(c, e) for c, e in refuted["conds"].items() if e["status"] == "refuted"][0]
        h, d = Fr(e["witness"]["h"]), Fr(e["witness"]["d"])
        dv = direct(C, h, d)          # re-evaluated from the definitions, strip located from h alone
        wit = {"h": e["witness"]["h"], "d": e["witness"]["d"],
               "f": (1 if cond == CONDS[0] else -1) if cond.startswith("D1") else None,
               "condition": cond, "value": str(dv[cond]), "value_approx": float(dv[cond]),
               "strip": {"side": side, "h_range_abs": [str(C["knots"][k]), str(C["knots"][k + 1])]},
               "interior": abs(h) + abs(d) < 1 and C["knots"][k] < abs(h) < C["knots"][k + 1]
                           and (h > 0) == (side > 0)}
        if not cond.startswith("D1"):
            a, b, c = dv["_matrix"]
            wit["matrix"] = {"a": str(a), "b": str(b), "c": str(c)}
        witnesses.insert(0, wit)
    if errors:
        out["verdict"] = "REFUSED"
        out["reason"] = "internal self-check failed: " + errors[0]["error"]
    elif witnesses:
        out["verdict"] = "REFUTED"
        out["witness"] = witnesses[0]
        out["other_witnesses"] = witnesses[1:]
        if refuted is not None:
            out["reason"] = "a condition is negative at a rational point (search stopped at the first refutation)"
        else:
            out["reason"] = "; ".join(w["condition"] for w in witnesses)
    elif any(e["status"] == "undecided" for r in results for e in r["conds"].values()):
        u = [(r["strip"], c, e) for r in results for c, e in r["conds"].items() if e["status"] == "undecided"]
        out["verdict"] = "REFUSED"
        out["reason"] = "not proved: bisection reached its limit without a sign on %d (strip, condition) pairs; " \
                        "first: strip %s, %s, box (t, u) %s" % (len(u), u[0][0], u[0][1], u[0][2].get("box_tu"))
    elif len(results) != len(tasks):
        out["verdict"] = "REFUSED"
        out["reason"] = "internal: not every strip was decided"
    else:
        out["verdict"] = "PROVED"
        out["reason"] = "(D1) for f = +1 and -1, (LOC) and continuity hold on the whole diamond; the bound " \
                        "equals l1 C1 + l2 C2 + mu exactly"
    out["seconds"] = round(time.time() - t0, 2)
    return out


def main(argv):
    args = list(argv[1:])
    opts = {"--c1": "3/10", "--c2": "2/25", "--jobs": None, "--max-level": "40", "--budget": "400000"}
    for key in list(opts):
        if key in args:
            i = args.index(key)
            opts[key] = args[i + 1]
            del args[i:i + 2]
    progress = "--progress" in args
    if progress:
        args.remove("--progress")
    if len(args) != 1:
        sys.stderr.write("usage: python3 lower.py CERT.json [--c1 3/10] [--c2 2/25] [--jobs N] "
                         "[--max-level L] [--budget B] [--progress]\n")
        return 2
    try:
        with open(args[0]) as fh:
            cert = json.load(fh)
    except (OSError, ValueError) as e:
        print(json.dumps({"verdict": "REFUSED", "reason": "cannot read the file: %s" % e}, indent=1))
        return 1
    res = check(cert, Fr(opts["--c1"]), Fr(opts["--c2"]),
                jobs=int(opts["--jobs"]) if opts["--jobs"] else None,
                max_level=int(opts["--max-level"]), budget=int(opts["--budget"]), progress=progress)
    res["file"] = args[0]
    print(json.dumps(res, indent=1))
    return 0 if res["verdict"] == "PROVED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
