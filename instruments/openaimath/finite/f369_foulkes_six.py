"""F-369 — "Foulkes' conjecture for the sixth symmetric power" (openai/math family 210).

THE CLAIM. Theorem thm:main (build/sections/introduction.tex:19-26): for every b >= 6, h_b[h_6] - h_6[h_b] is
Schur-positive. Write F(lambda) = [s_lambda] h_6[h_b] (source) and Q(lambda) = [s_lambda] h_b[h_6] (target),
lambda |- 6b; F vanishes off partitions of length <= 6 (reduction.tex:62-65), so the theorem at b is
Q(lambda) >= F(lambda) for every lambda |- 6b with at most six parts. The proof (verification.tex:229-245) is:
b >= 30 by Corollary cor:quadratic-range (the companion paper; THEORY); 6 <= b <= 25 by Verification
ver:certificates — Table tab:base (certificates.tex:36-54): per b, the partitions failing Q >= U (U the upper
bound of Proposition prop:upper) are compared exactly, "145435 exact fallback comparisons, 9272 equalities, and no
negative difference"; 26 <= b <= 29 by rectangular shifts, certificates (flags) and the band check of Section
sec:band — Table tab:band, row 26-29 (verification.tex:174): 29814 flags, 467068 band coefficients, 2114 zero
differences, none negative (verification.tex:162-164).

WHAT IS DECIDED HERE — a finite component, from first principles, without the release's programs:
  (A) THE BASE INTERVAL, EXACTLY, FOR 6 <= b <= base_max (default 12; also run with --base-max 15: 1419 s, every
      check passed, Table tab:base rows 6..15 reproduced). Every lambda |- 6b with <= 6 parts:
      Q(lambda) by a route that is not the paper's — the weight multiplicities of h_b[h_6] in six variables by
      Newton's identity over the 462 degree-6 monomials (b K_b(mu) = sum_i sum_|alpha|=6 K_{b-i}(mu - i alpha),
      dominant weights, exact division checked), then the Weyl alternant Q(lambda) = sum_{w in S6} sgn(w)
      K_b(lambda + delta - w delta); F(lambda) by the cycle formula h_6[h_b] = (1/720) sum_{pi in S6}
      prod_{cycles} h_b(X^|c|), each product expanded in the Schur basis by multiplying alternants
      ([s_gamma] h_b(X^r) s_mu = det[ l_j >= m_k, l_j = m_k mod r ], l = gamma + delta, m = mu + delta; the
      block-unitriangular structure gives one signed term per interlacing choice, checked against the
      determinant itself on small cases), 720 | sum checked. Checked: Q >= F everywhere (the theorem at that b,
      completely); Q = F on two-row lambda (Hermite reciprocity) and everywhere at b = 6; the dimension
      identities sum Q dim = C(461+b, b), sum F dim = C(C(b+5,5)+5, 6), their five-variable versions, and the
      per-cycle-type dimensions C(b+5,5)^#cycles; F <= U everywhere (Proposition prop:upper, on this range);
      the Table tab:base row of each such b recomputed: #{Q < U} and #{Q < U, Q = F}.
  (B) THE BAND ROWS FOR 26 <= b <= 29, EXACTLY: all 467068 band coefficients
      720(Q - F)(6b - B - |eta|, B, eta), |eta| <= 27, eta_1 <= B <= (6b - |eta|)/2, by a re-implementation of
      Section sec:band from its formulas: (Q - F)(lambda) = [q^B y^eta] C A (Q_b - F_b)(1, q, y) (band.tex:33-37),
      Q_b by the Gaussian-polynomial expansion with L_j = prod (1 - y^tau q^(u-j))^-1 (eq:targetband; L_j by its
      Euler recurrence, eq:euler), F_b by the cycle formula with the binary truncation (eq:binarysource), the
      seven numerators G_j of eq:G, the cross factor C, the S4 alternation (eq:row) and division by
      D(q) = prod (1 - q^h). Laurent polynomials are packed in big integers (q -> 2^160) with exact arithmetic;
      every packed value decoded is bounded first (an l1 bound computed alongside, below 2^159).
      The band formula is validated against (A): for every b <= base_max and every lambda with |eta| <= b + 1
      (where the truncation is exact) the band value equals 720(Q - F) from the independent route.
      Checked: no negative coefficient, every one divisible by 720, the zero count, the 1908 tails; and the
      counting formula for every row of Table tab:band and the total 57065668 (band.tex:238-244).
      With --full-band, every band coefficient for 26 <= b <= 149 (57065668) and the zero count of every row
      (run: 197 s, all 21 rows equal Table tab:band, 177134 zeros, none negative).
  Printed rows: Table tab:base and Table tab:band agree with appendix-a/b.stdout and expected-results.json.

WHAT IS NOT DECIDED HERE.
  - b >= 30: Corollary cor:quadratic-range rests on the companion paper's theorem (THEORY); the lane-S reading
    found the Lean covers only b >= 30, so everything decided here (b <= base_max, and 26..29) lies in the part
    the Lean does NOT cover.
  - The base interval for base_max < b <= 25. COST, measured on this machine (Python 3.9, one core, shared):
    --base-max 15 took 1419 s (Newton table 603 s; alternant + cycle formula + U 1.8-2.5 ms per partition at
    b = 12..15). The 5.7 million partitions with 16 <= b <= 25 would need roughly 8-12 CPU-hours more and a
    few GB for the tables; the paper's C++ does this range with OpenMP.
  - For 26 <= b <= 29, the partitions OUTSIDE the band: the reduction d6 >= 6 -> b - 6 (Lemma lem:rectangles,
    THEORY) and the certificate pipeline (the J/M/E lower-bound arrays, the chart Corollary cor:first-row, the
    sumset Lemma lem:sumset and Proposition prop:power) that clears every pair outside the band; the flag
    counts 29814 and "largest t2 = 25" are therefore not recomputed. The band check covers every band
    partition independently of which ones the first program flagged.
  - The reduction of the theorem to six variables / six-part partitions is elementary and is the basis of (A).

READ AFTER THIS DECIDER RAN (verification/verify_computations.py, programs/appendix-a.cpp, never executed).
verify_computations.py --check (its default) runs no mathematics: it checks the sha256 of the two C++ sources and
the four reference streams, parses the stored stdout, compares it with expected-results.json and with the two
manuscript tables, and checks the printed arithmetic-bound inequalities. --run recompiles and reruns the same two
programs and requires byte-identical output — a rerun of the claimant's code, not an independent computation.
appendix-a.cpp's run(b) computes Q by the signed-lookup Newton recurrence, keeps the partitions with Q < U and
computes F there only (the source recurrence), counting failures and equalities: Q and F are never computed by a
second method, and F is never computed where Q >= U (that rests on Proposition prop:upper, checked here for
b <= base_max).
"""
import itertools
import json
import os
import re
import sys
import time
from math import comb

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check, det  # noqa: E402

DIR = 'preprints/Foulkes-Conjecture-for-the-Sixth-Symmetric-Power-September-25-2026/'
INTRO = DIR + 'build/sections/introduction.tex'
CERT = DIR + 'build/sections/certificates.tex'
BAND = DIR + 'build/sections/band.tex'
VERIF = DIR + 'build/sections/verification.tex'
UPPER = DIR + 'build/sections/upper.tex'
OUT_A = DIR + 'verification/support/expected/appendix-a.stdout'
OUT_B = DIR + 'verification/support/expected/appendix-b.stdout'
EXPECTED = DIR + 'verification/support/expected-results.json'

D6 = (5, 4, 3, 2, 1, 0)
CYCLE_TYPES = [((6,), 120), ((5, 1), 144), ((4, 2), 90), ((4, 1, 1), 90), ((3, 3), 40), ((3, 2, 1), 120),
               ((3, 1, 1, 1), 40), ((2, 2, 2), 15), ((2, 2, 1, 1), 45), ((2, 1, 1, 1, 1), 15), ((1,) * 6, 1)]
DEFAULT_BASE_MAX = 12
_CACHE = {}


# ================================================================ (A) exact Q and F in six variables

def parts6(N):
    """partitions of N into at most 6 parts, as zero-padded 6-tuples"""
    out = []

    def rec(rem, maxp, k, acc):
        if k == 6:
            if rem == 0:
                out.append(tuple(acc))
            return
        lo = -(-rem // (6 - k))
        for v in range(min(rem, maxp), lo - 1, -1):
            acc.append(v)
            rec(rem - v, v, k + 1, acc)
            acc.pop()
    rec(N, N, 0, [])
    return out


def KQ_tables(bmax):
    """K[b][mu] = [x^mu] h_b[h_6](x1..x6) on dominant mu, by Newton's identity for h_b of the 462 monomials of
    degree 6: b K_b(mu) = sum_{i=1}^{b} sum_{|alpha|=6} K_{b-i}(mu - i alpha) (K symmetric: looked up sorted)"""
    K = [{(0,) * 6: 1}]
    for b in range(1, bmax + 1):
        cur = {}
        for mu in parts6(6 * b):
            m0, m1, m2, m3, m4, m5 = mu
            tot = 0
            for i in range(1, b + 1):
                g = K[b - i].get
                for a0 in range(min(6, m0 // i), -1, -1):
                    r0 = 6 - a0
                    v0 = m0 - i * a0
                    for a1 in range(min(r0, m1 // i), -1, -1):
                        r1 = r0 - a1
                        v1 = m1 - i * a1
                        for a2 in range(min(r1, m2 // i), -1, -1):
                            r2 = r1 - a2
                            v2 = m2 - i * a2
                            for a3 in range(min(r2, m3 // i), -1, -1):
                                r3 = r2 - a3
                                v3 = m3 - i * a3
                                for a4 in range(min(r3, m4 // i), -1, -1):
                                    a5 = r3 - a4
                                    if a5 * i > m5:
                                        continue
                                    v = [v0, v1, v2, v3, m4 - i * a4, m5 - i * a5]
                                    v.sort(reverse=True)
                                    tot += g(tuple(v), 0)
            if tot % b:
                raise ArithmeticError('Newton division not exact at b=%d mu=%s' % (b, mu))
            cur[mu] = tot // b
        K.append(cur)
    return K


PERMS6 = []
for _w in itertools.permutations(range(6)):
    _inv = sum(1 for _i in range(6) for _j in range(_i + 1, 6) if _w[_i] > _w[_j])
    PERMS6.append((tuple(D6[_j] - D6[_w[_j]] for _j in range(6)), -1 if _inv & 1 else 1))


def alternate(K, lam):
    """[s_lambda] f = sum_w sgn(w) [x^(lambda + delta - w delta)] f  (Schur alternant), f symmetric"""
    tot = 0
    g = K.get
    l0, l1, l2, l3, l4, l5 = lam
    for sh, sg in PERMS6:
        v = [l0 + sh[0], l1 + sh[1], l2 + sh[2], l3 + sh[3], l4 + sh[4], l5 + sh[5]]
        if v[5] < 0 or v[4] < 0 or v[3] < 0 or v[2] < 0 or v[1] < 0:
            continue
        v.sort(reverse=True)
        c = g(tuple(v))
        if c:
            tot += sg * c
    return tot


def strip_up(mu, r, b):
    """Schur expansion of h_b(X^r) s_mu in 6 variables, as [(gamma, sign)]. With m = mu + delta grouped by residue
    mod r (each class decreasing a_1 > a_2 > ...), the nonzero terms are l_i = a_i + r x_i with
    a_i + r x_i < a_(i-1) (interlacing inside the class), sum x = b; sign = parity of the assignment."""
    m = [mu[j] + D6[j] for j in range(6)]
    classes = {}
    for k, a in enumerate(m):
        classes.setdefault(a % r, []).append(k)
    slots = []
    for cl in classes.values():
        for t, k in enumerate(cl):
            slots.append((k, b if t == 0 else (m[cl[t - 1]] - m[k]) // r - 1))
    out = []
    ns = len(slots)
    xs = [0] * ns

    def rec(t, rem):
        k, bd = slots[t]
        if t == ns - 1:
            if rem <= bd:
                xs[t] = rem
                pairs = sorted(((m[slots[u][0]] + r * xs[u], slots[u][0]) for u in range(ns)), reverse=True)
                seq = [kk for _, kk in pairs]
                inv = sum(1 for i in range(6) for j in range(i + 1, 6) if seq[i] > seq[j])
                out.append((tuple(pairs[j][0] - D6[j] for j in range(6)), -1 if inv & 1 else 1))
            return
        for x in range(min(bd, rem) + 1):
            xs[t] = x
            rec(t + 1, rem - x)
    rec(0, b)
    return out


def strip_det(gamma, mu, r):
    """[s_gamma] h_b(X^r) s_mu straight from the alternant: det[ l_j >= m_k and l_j = m_k mod r ]"""
    l = [gamma[j] + D6[j] for j in range(6)]
    m = [mu[j] + D6[j] for j in range(6)]
    return det([[1 if (l[j] >= m[k] and (l[j] - m[k]) % r == 0) else 0 for k in range(6)] for j in range(6)])


def pieri(vec, b):
    """h_b * (Schur vector on <= 5 rows) in 6 variables: horizontal strips"""
    out = {}
    get = out.get
    for mu, c in vec.items():
        m0, m1, m2, m3, m4, m5 = mu
        for x1 in range(min(b, m0 - m1) + 1):
            r1 = b - x1
            for x2 in range(min(r1, m1 - m2) + 1):
                r2 = r1 - x2
                for x3 in range(min(r2, m2 - m3) + 1):
                    r3 = r2 - x3
                    for x4 in range(min(r3, m3 - m4) + 1):
                        r4 = r3 - x4
                        for x5 in range(min(r4, m4 - m5) + 1):
                            g = (m0 + r4 - x5, m1 + x1, m2 + x2, m3 + x3, m4 + x4, m5 + x5)
                            out[g] = get(g, 0) + c
    return out


def mult(vec, r, b):
    if r == 1:
        return pieri(vec, b)
    out = {}
    for mu, c in vec.items():
        for g, sg in strip_up(mu, r, b):
            out[g] = out.get(g, 0) + sg * c
    return {g: c for g, c in out.items() if c}


def dim_n(l, n):
    """Weyl dimension of S_l(C^n) (0 if l has more than n parts)"""
    if any(l[j] for j in range(n, 6)):
        return 0
    num = den = 1
    for i in range(n):
        for j in range(i + 1, n):
            num *= l[i] - l[j] + j - i
            den *= j - i
    return num // den


def F_table(b):
    """F[gamma] = [s_gamma] h_6[h_b] (6 variables), cycle formula; returns (F, per-cycle-type dimension checks ok)"""
    P = [{(0,) * 6: 1}]
    for _ in range(6):
        P.append(mult(P[-1], 1, b))
    tot = {}
    dims_ok = True
    N6, N5 = comb(b + 5, 5), comb(b + 4, 4)
    for I, nI in CYCLE_TYPES:
        vec = P[I.count(1)]
        for r in I:
            if r != 1:
                vec = mult(vec, r, b)
        v = len(I)
        if sum(c * dim_n(g, 6) for g, c in vec.items()) != N6 ** v or sum(c * dim_n(g, 5) for g, c in vec.items()) != N5 ** v:
            dims_ok = False
        for g, c in vec.items():
            tot[g] = tot.get(g, 0) + nI * c
    F = {}
    for g, c in tot.items():
        if c % 720:
            raise ArithmeticError('720 does not divide the cycle sum at %s' % (g,))
        if c:
            F[g] = c // 720
    return F, dims_ok


# for each cycle type, every removal order I ~ pi as its list of remaining sizes s = 6 - i_1 - ... - i_u
ORDERS = []
for _I, _nI in CYCLE_TYPES:
    _rems = set()
    for _order in set(itertools.permutations(_I)):
        _r, _acc = 6, []
        for _i in _order:
            _r -= _i
            _acc.append(_r)
        _rems.add(tuple(_acc))
    ORDERS.append((_nI, sorted(_rems)))


def U_bound(lam):
    """U(d) of Proposition prop:upper (upper.tex:93-106), at the partition lambda:
    h_sj = 1 + lambda_j - lambda_{j+6-s}, N_s = prod_j h_sj / max_j h_sj (2 <= s <= 5), N_0 = N_1 = 1,
    B_I = prod_u N_{6 - i_1 - ... - i_u}, U = floor( sum_pi min_{I ~ pi} B_I / 720 )"""
    l = list(lam) + [0]
    N = [1, 1, 0, 0, 0, 0]
    for s in range(2, 6):
        h = [1 + l[j] - l[j + 6 - s] for j in range(s)]
        p = 1
        for x in h:
            p *= x
        N[s] = p // max(h)
    tot = 0
    for nI, rems in ORDERS:
        best = None
        for rr in rems:
            B = 1
            for s in rr:
                B *= N[s]
            if best is None or B < best:
                best = B
        tot += nI * best
    return tot // 720


def base_data(base_max):
    key = ('base', base_max)
    if key not in _CACHE:
        t0 = time.time()
        K = KQ_tables(base_max)
        tk = time.time() - t0
        rows = {}
        for b in range(6, base_max + 1):
            t1 = time.time()
            lams = parts6(6 * b)
            Q = {l: alternate(K[b], l) for l in lams}
            F, fdims = F_table(b)
            U = {l: U_bound(l) for l in lams}
            rows[b] = {'lams': lams, 'Q': Q, 'F': F, 'U': U, 'fdims': fdims, 'seconds': round(time.time() - t1, 1)}
        _CACHE[key] = (rows, round(tk, 1))
    return _CACHE[key]


# ================================================================ (B) the band: packed Laurent polynomials

W = 160
MASKW = (1 << W) - 1
HALF = 1 << (W - 1)


def L_enc(d):
    if not d:
        return (0, 0)
    e0 = min(d)
    v = 0
    for e, c in d.items():
        v += c << (W * (e - e0))
    return (v, e0)


def L_dec(p):
    v, e = p
    out = {}
    while v:
        d = v & MASKW
        v >>= W
        if d >= HALF:
            d -= 1 << W
            v += 1
        if d:
            out[e] = d
        e += 1
    return out


def L_add(p1, p2, s2=1):
    v1, e1 = p1
    v2, e2 = p2
    if v2 == 0:
        return p1
    if v1 == 0:
        return (s2 * v2, e2)
    if e1 <= e2:
        return (v1 + s2 * (v2 << (W * (e2 - e1))), e1)
    return ((v1 << (W * (e1 - e2))) + s2 * v2, e2)


def L_mul(p1, p2):
    return (p1[0] * p2[0], p1[1] + p2[1])


def polymul(d1, d2):
    out = {}
    for e1, c1 in d1.items():
        for e2, c2 in d2.items():
            out[e1 + e2] = out.get(e1 + e2, 0) + c1 * c2
    return {e: c for e, c in out.items() if c}


def comps(t, k):
    if k == 1:
        yield (t,)
        return
    for a in range(t, -1, -1):
        for r in comps(t - a, k - 1):
            yield (a,) + r


def srt4(a):
    return tuple(sorted(a, reverse=True))


def series_coeffs(parts, M):
    a = [1] + [0] * M
    for p in parts:
        for m in range(p, M + 1):
            a[m] += a[m - p]
    return a


def band_data(T=27, top=87, forge_cross=False):
    """rows[(j, eta)] = (lo, arr): the power series R_{j,eta}(q)/D(q) from exponent lo through `top`"""
    key = ('band', T, top, forge_cross)
    if key in _CACHE:
        return _CACHE[key]
    base_key = ('band-num', T)
    if base_key not in _CACHE:
        t0 = time.time()
        TA = [a for t in range(T + 1) for a in comps(t, 4) if a[0] >= a[1] >= a[2] >= a[3]]
        TAU = [tau for t in range(1, 7) for tau in comps(t, 4)]
        # e_j(q, ..., q^6)
        poly = {0: {0: 1}}
        for h in range(1, 7):
            new = {}
            for j, d in poly.items():
                for e, c in d.items():
                    new.setdefault(j, {})[e] = new.setdefault(j, {}).get(e, 0) + c
                    new.setdefault(j + 1, {})[e + h] = new.setdefault(j + 1, {}).get(e + h, 0) + c
            poly = new
        EJ = [poly[j] for j in range(7)]
        # L_j by the Euler recurrence |a| L_a = sum_{tau,u} sum_{i: i tau <= a} |tau| q^{i(u-j)} L_{a - i tau}.
        # A product of k tail monomials y^tau q^(u-j) (|tau| >= 1, k <= |a|) has q-exponent >= -jk >= -j|a|, so
        # L_{j,a} is stored as V_a = sum_e c_e 2^(W(e + j|a|)); the term for (tau, i, u) is then
        # V_{a - i tau} << W i (j(|tau| - 1) + u), a nonnegative shift. The lookups (sorted a - i tau, grouped by
        # |tau| and i) do not depend on j and are listed once.
        TAU_BY_T = {t: [tau for tau in TAU if sum(tau) == t] for t in range(1, 7)}
        NB = {}
        for a in TA[1:]:
            lst = []
            for t in range(1, 7):
                for i in range(1, a[0] + 1):
                    keys = [srt4((a[0] - i * tau[0], a[1] - i * tau[1], a[2] - i * tau[2], a[3] - i * tau[3]))
                            for tau in TAU_BY_T[t]
                            if i * tau[0] <= a[0] and i * tau[1] <= a[1] and i * tau[2] <= a[2] and i * tau[3] <= a[3]]
                    if not keys:
                        break
                    lst.append((t, i, keys))
            NB[a] = lst
        L = []
        for j in range(7):
            Lv = {(0, 0, 0, 0): 1}
            for a in TA[1:]:
                acc = 0
                for t, i, keys in NB[a]:
                    part = 0
                    for k in keys:
                        part += Lv[k]
                    s0 = i * j * (t - 1)
                    sh = 0
                    for u in range(7 - t):
                        sh += part << (W * (s0 + i * u))
                    acc += t * sh
                n = sum(a)
                if acc % n:
                    raise ArithmeticError('Euler division not exact')
                Lv[a] = acc // n
            L.append({a: (v, -j * sum(a)) for a, v in Lv.items()})
        # scalar l1 bound of L (q = 1, nonnegative coefficients): the same recurrence
        L1 = {(0, 0, 0, 0): 1}
        for a in TA[1:]:
            acc = 0
            for t, i, keys in NB[a]:
                acc += t * (7 - t) * sum(L1[k] for k in keys)
            if acc % sum(a):
                raise ArithmeticError('Euler division not exact (q = 1)')
            L1[a] = acc // sum(a)
        t_L = time.time() - t0
        # the source part S_j,a = sum_I n_I sum_{J: sum J = j} (-1)^|J| q^j E_I(q) prod_l phi_{I,J}(a_l)
        D = {0: 1}
        for h in range(1, 7):
            D = polymul(D, {0: 1, h: -1})
        S = [dict() for _ in range(7)]
        S1 = [dict() for _ in range(7)]      # l1 bounds
        EI_deg_ok = True
        for I, nI in CYCLE_TYPES:
            den = {0: 1}
            for i in I:
                den = polymul(den, {0: 1, i: -1})
            num = dict(D)
            quo = {}
            dd = max(den)
            for e in range(max(num), dd - 1, -1):
                c = num.get(e, 0)
                if c:
                    qq = c // den[dd]
                    if qq * den[dd] != c:
                        raise ArithmeticError('E_I not integral')
                    quo[e - dd] = qq
                    for e2, c2 in den.items():
                        num[e - dd + e2] = num.get(e - dd + e2, 0) - qq * c2
            if any(num.values()):
                raise ArithmeticError('D not divisible by the cycle denominator')
            EI_deg_ok &= (max(quo) == 15 and min(quo) == 0)
            EI1 = sum(abs(c) for c in quo.values())
            AI = series_coeffs(I, T)
            v = len(I)
            for Jmask in range(1 << v):
                J = [I[h] for h in range(v) if Jmask >> h & 1]
                Jb = [I[h] for h in range(v) if not Jmask >> h & 1]
                j = sum(J)
                AJ = series_coeffs(J, T)
                AJb = series_coeffs(Jb, T)
                phi = [L_enc({-p: AJ[p] * AJb[m - p] for p in range(m + 1) if AJ[p] * AJb[m - p]}) for m in range(T + 1)]
                pre = L_enc({e + j: c * nI * (-1) ** len(J) for e, c in quo.items()})
                Sj, S1j = S[j], S1[j]
                for a in TA:
                    prod = L_mul(L_mul(L_mul(L_mul(pre, phi[a[0]]), phi[a[1]]), phi[a[2]]), phi[a[3]])
                    Sj[a] = L_add(Sj.get(a, (0, 0)), prod)
                    S1j[a] = S1j.get(a, 0) + nI * EI1 * AI[a[0]] * AI[a[1]] * AI[a[2]] * AI[a[3]]
        G, G1 = [], []
        for j in range(7):
            ejp = L_enc({e: 720 * (-1) ** j * c for e, c in EJ[j].items()})
            G.append({a: L_add(L_mul(ejp, L[j][a]), S[j].get(a, (0, 0)), -1) for a in TA})
            G1.append({a: 720 * comb(6, j) * L1[a] + S1[j].get(a, 0) for a in TA})
        _CACHE[base_key] = (TA, G, G1, EI_deg_ok, round(t_L, 1), round(time.time() - t0 - t_L, 1))
    TA, G, G1, EI_deg_ok, t_L, t_S = _CACHE[base_key]
    t0 = time.time()
    # cross factor C = (1-q) prod_l (1 - y_l)(1 - y_l/q): coefficient at shift v in {0,1,2}^4
    cv = []
    for v in itertools.product((0, 1, 2), repeat=4):
        n1, n2 = v.count(1), v.count(2)
        d = {0: 1}
        for _ in range(n1):
            d = polymul(d, {0: -1, -1: -1} if not forge_cross else {0: -1, 1: -1})
        cv.append((v, L_enc({(e - n2 if not forge_cross else e + n2): c for e, c in d.items()}), 2 ** n1))
    omq = L_enc({0: 1, 1: -1})
    M, M1 = [], []
    for j in range(7):
        Mj, M1j = {}, {}
        for a in TA:
            acc = (0, 0)
            bnd = 0
            for v, cc, c1 in cv:
                b_ = (a[0] - v[0], a[1] - v[1], a[2] - v[2], a[3] - v[3])
                if b_[0] < 0 or b_[1] < 0 or b_[2] < 0 or b_[3] < 0:
                    continue
                s = srt4(b_)
                acc = L_add(acc, L_mul(cc, G[j][s]))
                bnd += c1 * G1[j][s]
            Mj[a] = L_mul(omq, acc)
            M1j[a] = 2 * bnd
        M.append(Mj)
        M1.append(M1j)
    rho = (3, 2, 1, 0)
    perms = []
    for w in itertools.permutations(range(4)):
        inv = sum(1 for x in range(4) for y in range(x + 1, 4) if w[x] > w[y])
        perms.append((tuple(rho[l] - rho[w[l]] for l in range(4)), -1 if inv & 1 else 1))
    rows = {}
    maxbound = 0
    for eta in TA:
        for j in range(7):
            acc = (0, 0)
            bnd = 0
            for sh, sg in perms:
                a = (eta[0] + sh[0], eta[1] + sh[1], eta[2] + sh[2], eta[3] + sh[3])
                if a[0] < 0 or a[1] < 0 or a[2] < 0 or a[3] < 0:
                    continue
                s = srt4(a)
                acc = L_add(acc, M[j][s], sg)
                bnd += M1[j][s]
            maxbound = max(maxbound, bnd)
            if bnd >= HALF:
                raise ArithmeticError('l1 bound %d too large for the packing width' % bnd)
            d = L_dec(acc)
            if not d or min(d) > top:
                rows[(j, eta)] = None
                continue
            lo = min(d)
            arr = [0] * (top - lo + 1)
            for e, c in d.items():
                if e <= top:
                    arr[e - lo] = c
            for h in range(1, 7):                    # divide by (1 - q^h): a_n += a_{n-h}
                for x in range(h, len(arr)):
                    arr[x] += arr[x - h]
            rows[(j, eta)] = (lo, arr)
    out = (TA, rows, {'tails': len(TA), 'E_I_degree15': EI_deg_ok, 'l1_bound_bits': maxbound.bit_length(),
                      'L_seconds': t_L, 'S_seconds': t_S, 'MR_seconds': round(time.time() - t0, 1)})
    _CACHE[key] = out
    return out


def band_value(rows, eta, b, B):
    """sum_j [q^(B - jb)] R_{j,eta}/D = 720 (Q - F)(6b - B - |eta|, B, eta)   (band.tex eq:finalinteger)"""
    tot = 0
    for j in range(7):
        r = rows[(j, eta)]
        if r is None:
            continue
        lo, arr = r
        e = B - j * b
        if lo <= e < lo + len(arr):
            tot += arr[e - lo]
    return tot


def band_scan(TA, rows, b0, b1):
    cnt = zero = neg = nondiv = 0
    for b in range(b0, b1 + 1):
        for eta in TA:
            n = sum(eta)
            for B in range(eta[0], (6 * b - n) // 2 + 1):
                v = band_value(rows, eta, b, B)
                cnt += 1
                if v == 0:
                    zero += 1
                elif v < 0:
                    neg += 1
                if v % 720:
                    nondiv += 1
    return cnt, zero, neg, nondiv


def band_count(TA, b0, b1):
    return sum(3 * b - (-(-sum(eta) // 2)) - eta[0] + 1 for b in range(b0, b1 + 1) for eta in TA)


# ================================================================ reading the release

def read_tables(src):
    cert = src.text(CERT)
    verif = src.text(VERIF)
    base = {}
    for m in re.finditer(r'^(\d+)&(\d+)&(\d+)&(\d+)&(\d+)&(\d+)\s*(?:\\\\)?\s*$', cert, re.M):
        a = [int(x) for x in m.groups()]
        base[a[0]] = (a[1], a[2])
        base[a[3]] = (a[4], a[5])
    band = {}
    for m in re.finditer(r'^(\d+)--(\d+)&(\d+)&(\d+)&(\d+)&(\d+)', verif, re.M):
        a = [int(x) for x in m.groups()]
        band[(a[0], a[1])] = (a[2], a[3], a[4], a[5])
    return cert, verif, base, band


def decide(src=None, base_max=DEFAULT_BASE_MAX, full_band=False, _forge=None):
    src = src or Sources()
    _forge = _forge or {}
    checks = []
    intro = ' '.join(src.text(INTRO).split())
    cert, verif, base_tab, band_tab = read_tables(src)
    band_tex = ' '.join(src.text(BAND).split())
    upper = ' '.join(src.text(UPPER).split())
    outa = src.text(OUT_A)
    outb = src.text(OUT_B)
    expd = json.loads(src.text(EXPECTED))
    for k, v in _forge.get('base_tab', {}).items():
        base_tab[k] = v
    for k, v in _forge.get('band_tab', {}).items():
        band_tab[k] = v
    check(checks, 'the theorem as printed (introduction.tex:19-26)',
          'Equivalently, \\(h_b[h_6]-h_6[h_b]\\) is Schur-positive for every \\(b\\ge6\\).' in intro)
    check(checks, 'the definition of U as printed (upper.tex:93-106)',
          'h_{sj}=1+\\lambda(d)_j-\\lambda(d)_{j+6-s}' in upper and 'U(d)=\\left\\lfloor\\frac1{720}' in upper)
    a_rows = {int(m.group(1)): (int(m.group(2)), int(m.group(4))) for m in re.finditer(r'^(\d+) total\(exact\) (\d+) failed (\d+) equality (\d+)$', outa, re.M)}
    a_fail = [int(m.group(1)) for m in re.finditer(r'^\d+ total\(exact\) \d+ failed (\d+) ', outa, re.M)]
    b_rows = {int(m.group(1)): (int(m.group(2)), int(m.group(3))) for m in re.finditer(r'^(\d+) (\d+) (\d+)$', outb, re.M)}
    f_rows = {int(m.group(1)): (int(m.group(2)), int(m.group(3))) for m in re.finditer(r'^(\d+) flags (\d+) max (\d+)$', outa, re.M)}
    tab_ok = (len(base_tab) == 20 and all(base_tab[b] == a_rows.get(b) for b in range(6, 26)) and set(a_fail) == {0}
              and [list((b,) + base_tab[b]) for b in range(6, 26)] == expd['tables']['base'])
    check(checks, 'Table tab:base (certificates.tex:39-50) = appendix-a.stdout = expected-results.json; printed totals 145435 / 9272',
          tab_ok and sum(v[0] for v in base_tab.values()) == 145435 and sum(v[1] for v in base_tab.values()) == 9272
          and '\\(145435\\) exact fallback comparisons, \\(9272\\) equalities' in ' '.join(cert.split()))
    rng = sorted(band_tab)
    bt_ok = (len(rng) == 21 and rng[0] == (26, 29) and rng[-1] == (144, 149)
             and all(b_rows.get(6 * (lo // 6)) == (band_tab[(lo, hi)][2], band_tab[(lo, hi)][3]) for lo, hi in rng)
             and all(f_rows.get(6 * (lo // 6)) == (band_tab[(lo, hi)][0], band_tab[(lo, hi)][1]) for lo, hi in rng))
    check(checks, 'Table tab:band (verification.tex:172-195) = appendix-a/b.stdout (row labels 24, 30, ..., 144)', bt_ok)

    # ---------------- (A)
    rows, t_kq = base_data(base_max)
    decided_b = []
    for b in range(6, base_max + 1):
        R = rows[b]
        lams, Q, F, U = R['lams'], R['Q'], dict(R['F']), R['U']
        if 'F_plus' in _forge and _forge['F_plus'][0] == b:
            lam0 = _forge['F_plus'][1]
            F[lam0] = F.get(lam0, 0) + 1
        neg = [l for l in lams if Q[l] < F.get(l, 0)]
        qneg = [l for l in lams if Q[l] < 0]
        dims = (sum(Q[l] * dim_n(l, 6) for l in lams) == comb(461 + b, b) and sum(Q[l] * dim_n(l, 5) for l in lams) == comb(209 + b, b)
                and sum(F.get(l, 0) * dim_n(l, 6) for l in lams) == comb(comb(b + 5, 5) + 5, 6)
                and sum(F.get(l, 0) * dim_n(l, 5) for l in lams) == comb(comb(b + 4, 4) + 5, 6) and R['fdims'])
        herm = all(Q[l] == F.get(l, 0) for l in lams if l[2] == 0)
        b6 = b != 6 or all(Q[l] == F.get(l, 0) for l in lams)
        ub = [l for l in lams if F.get(l, 0) > U[l]]
        ncmp = sum(1 for l in lams if Q[l] < U[l])
        neq = sum(1 for l in lams if Q[l] < U[l] and Q[l] == F.get(l, 0))
        check(checks, '(A) b=%d: Q >= F for all %d partitions of %d with <= 6 parts (the theorem at b=%d, decided exactly)' % (b, len(lams), 6 * b, b),
              not neg and not qneg, 'first failure %s' % (neg[:1],) if neg else 'min(Q-F) = %d' % min(Q[l] - F.get(l, 0) for l in lams))
        check(checks, '(A) b=%d: dimension identities for Q, F and each cycle-type product; Hermite (two rows)%s' % (b, '; Q = F identically' if b == 6 else ''),
              dims and herm and b6)
        check(checks, '(A) b=%d: F <= U everywhere (Proposition prop:upper on this degree)' % b, not ub, str(ub[:2]))
        check(checks, '(A) b=%d: Table tab:base row recomputed: %d comparisons (Q < U), %d equalities; printed %s' % (b, ncmp, neq, base_tab.get(b)),
              base_tab.get(b) == (ncmp, neq))
        decided_b.append(b)
    # the strip rule against the determinant, small cases
    bad = 0
    tested = 0
    for bb in (1, 2):
        for r in (1, 2, 3, 4):
            for msz in range(0, 7):
                for mu in parts6(msz):
                    up = {}
                    for g, sg in strip_up(mu, r, bb):
                        up[g] = up.get(g, 0) + sg
                    for g in parts6(msz + r * bb):
                        tested += 1
                        if strip_det(g, mu, r) != up.get(g, 0):
                            bad += 1
    check(checks, '(A) the interlacing enumeration of h_b(X^r) s_mu equals the alternant determinant on %d small cases' % tested, bad == 0)

    # ---------------- (B)
    top = 3 * (149 if full_band else max(29, base_max))
    TA, brows, binfo = band_data(27, top, forge_cross=_forge.get('cross', False))
    check(checks, '(B) 1908 decreasing four-coordinate tails with |eta| <= 27 (band.tex:190); E_I integer of degree 15; packed decoding bounded (l1 < 2^%d)' % (W - 1),
          binfo['tails'] == 1908 and '\\(1908\\) decreasing four-coordinate tails' in band_tex and binfo['E_I_degree15'], 'l1 bound %d bits' % binfo['l1_bound_bits'])
    xbad = xn = 0
    for b in decided_b:
        R = rows[b]
        for l in R['lams']:
            eta = l[2:]
            if sum(eta) > b + 1:
                continue
            xn += 1
            if band_value(brows, tuple(eta), b, l[1]) != 720 * (R['Q'][l] - R['F'].get(l, 0)):
                xbad += 1
    check(checks, '(B)=(A) the band formula equals 720(Q-F) from the independent route at every lambda with |eta| <= b+1, b = 6..%d (%d partitions)' % (base_max, xn),
          xn > 0 and xbad == 0, '%d mismatches' % xbad)
    cnt, zero, neg, nondiv = band_scan(TA, brows, 26, 29)
    pr = band_tab.get((26, 29), (None,) * 4)
    check(checks, '(B) b=26..29: %d band coefficients, %d zero, %d negative, %d not divisible by 720; printed %s coefficients, %s zero (verification.tex:174)'
          % (cnt, zero, neg, nondiv, pr[2], pr[3]), neg == 0 and nondiv == 0 and cnt == pr[2] and zero == pr[3] and '\\(467068\\) band coefficients' in ' '.join(verif.split())
          and 'with \\(2114\\) equalities' in ' '.join(verif.split()))
    cnt_ok = all(band_count(TA, lo, hi) == band_tab[(lo, hi)][2] for lo, hi in rng) and band_count(TA, 26, 149) == 57065668
    check(checks, '(B) the counting formula 3b - ceil(|eta|/2) - eta_1 + 1 reproduces every band-coefficient count of Table tab:band and the total 57065668',
          cnt_ok and '\\(57065668\\) distinct partitions' in band_tex)
    full = None
    if full_band:
        full = {}
        allz = 0
        ok_full = True
        for lo, hi in rng:
            c, z, ng, nd = band_scan(TA, brows, lo, hi)
            full['%d-%d' % (lo, hi)] = (c, z, ng, nd)
            allz += z
            ok_full &= (ng == 0 and nd == 0 and c == band_tab[(lo, hi)][2] and z == band_tab[(lo, hi)][3])
        check(checks, '(B, --full-band) every band coefficient 26 <= b <= 149: none negative, all divisible by 720, zero counts per row and total 177134',
              ok_full and allz == 177134, json.dumps(full))

    ok = all(c['pass'] for c in checks)
    data_fail = not all(c['pass'] for c in checks[:2])
    verdict = 'CERTIFIED' if ok else ('REFUSED' if data_fail else 'REFUTED')
    return {'verdict': verdict, 'checks': checks, 'sources': src.read,
            'decides': ('a finite component: (A) the theorem at b = 6..%d completely (Q >= F at every partition, exact, '
                        'by a route independent of the paper\'s programs) with those Table tab:base rows recomputed; '
                        '(B) every band coefficient of Section sec:band for b = 26..29 (467068, the band part of the '
                        'b = 26..29 step)%s. NOT decided: b = %d..25 of the base interval (cost), the certificate '
                        'pipeline and flags clearing non-band partitions at b = 26..29, the rectangle reduction, and '
                        'b >= 30 (companion theory; the part the Lean covers)'
                        % (base_max, '; and with --full-band every band coefficient for b <= 149' if full_band else '', base_max + 1)),
            'value': {'base_rows': {b: base_tab.get(b) for b in decided_b}, 'base_seconds': {b: rows[b]['seconds'] for b in decided_b},
                      'KQ_seconds': t_kq, 'band': binfo, 'band_26_29': {'coefficients': cnt, 'zero': zero, 'negative': neg},
                      'full_band': full}}


def forge(base_max=DEFAULT_BASE_MAX):
    """each must NOT certify; they reuse the cached exact data"""
    out = []
    r = decide(base_max=base_max, _forge={'base_tab': {8: (6820, 256)}})
    out.append(('Table tab:base row b=8 printed with 256 equalities (255 recomputed)', r['verdict']))
    r = decide(base_max=base_max, _forge={'band_tab': {(26, 29): (29814, 25, 467068, 2115)}})
    out.append(('Table tab:band row 26-29 printed with 2115 zero differences (2114 recomputed)', r['verdict']))
    rows, _ = base_data(base_max)
    eq7 = next(l for l in rows[7]['lams'] if l[2] > 0 and rows[7]['Q'][l] == rows[7]['F'].get(l, 0) and rows[7]['Q'][l] > 0)
    r = decide(base_max=base_max, _forge={'F_plus': (7, eq7)})
    out.append(('source multiplicity F raised by one at an equality partition %s of b=7' % (eq7,), r['verdict']))
    r = decide(base_max=base_max, _forge={'cross': True})
    out.append(('band cross factor (1 - y/q) replaced by (1 - y q)', r['verdict']))
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    bm = int(args[args.index('--base-max') + 1]) if '--base-max' in args else DEFAULT_BASE_MAX
    t = time.time()
    res = decide(base_max=bm, full_band='--full-band' in args)
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1, default=str))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'][:300])
    print('%.1fs' % (time.time() - t))
    if '--no-forge' not in args:
        t1 = time.time()
        for desc, v in forge(bm):
            print('FORGE', v, '-', desc)
        print('forges %.1fs' % (time.time() - t1))
