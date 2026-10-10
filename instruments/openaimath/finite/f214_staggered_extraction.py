"""F-214 — "Staggered extraction for exact matrix multiplication over every field" (openai/math family 107).

THE CLAIM (main.tex:43-45, abstract; introduction.tex:57-63, Theorem thm:main): "Over every fixed field F, the arithmetic
exponent of square matrix multiplication satisfies omega_F < 2.371054886006746 < 2.371054887." The proof
(parameters.tex:323-329) is: S_* > 0, Proposition prop:numerical-certificate (parameters.tex:177-196) and the rank
constraint (leaf-volumes.tex:294-296, H_0 + C_* + (w/3) S_* <= 8 log 7) give
omega <= w <= 3(8 log 7 - H_0 - C_*)/S_* < 2.371054886006746.

THE PUBLISHED FINITE OBJECT: five integer arrays (parameter-tables.tex:6-66: a, 17 entries; P, 118; p, 54; d, 75; z, 36;
the same arrays are in verification/data/parameters.json) decoded by the rules of parameters.tex:12-81 into rational laws
(weight F(n) = (sum_{j<=16} (n/640000)^j/j!)^64), and the finite contractions that turn those laws into the numbers
H_0, L_A, L_B, B_*, T, C_*, S_0, S_1, S_2, S_* (staggering.tex:16-221, leaf-volumes.tex:9-37, joint-extraction.tex:95-165,
parameters.tex:108-140).

WHAT IS DECIDED HERE, and HOW (clean room: written from the TeX and the data arrays before any of the authors' code was
opened):
  1. The arrays: the TeX appendix and parameters.json agree entry for entry; the decoding as written consumes each array
     exactly (17/118/54/75/36); the authors' published decoding table (parameter-assignments.tsv) agrees row for row with
     the decoding re-implemented here; the printed counts (30 sorted, 21 positive sorted, 21 positive ordered size-8,
     24 size-8 with a zero), the 223 distinct F-arguments in [-120770, 45052], 2^-23 < F(n) < 2^23 for each of them
     (exact integer comparison), the d range [0, 0.110106] and the two printed d examples.
  2. The structure, exactly (integers and Fractions): the statistic coding (r_i, D_i, kappa) re-derived by enumerating the
     49 length-2 index words of CW_5; kappa an involution with D_kappa(i) = D_i and r_kappa(i) = 4 - r_i; q_s(b) = q_s(s-b)
     for every split law (equal integer weights); every zero-coordinate child (Stage A children t and Stage B children u)
     has the laws on its two other sides matched by complementation, including two-zero shapes.
  3. The numbers. Every probability is an exact rational: the denominator 640000^16 16! of F cancels inside each
     normalisation, so each law is (integer weight)/(integer total), with integers of up to ~70,000 bits; each is rounded
     ONCE, outward, to a fixed-point interval with 2^-224 resolution. Everything after that is interval arithmetic on
     integer endpoints (exact integers scaled by 2^-224, floor for lower and ceil for upper endpoints), and every
     logarithm is enclosed by ln x = e ln 2 + ln(1 + m/32) + 2 atanh(z), z < 1/65, with the atanh series truncated and its
     tail bounded by the next power (sum_{j>=n} z^(2j+1)/(2j+1) <= z^(2n+1)/((2n+1)(1-z^2)) <= z^(2n+1)); ln 2 and
     ln(1 + m/32) are the same series at z = 1/3 and z = m/(64+m) <= 31/95 with tail <= 2 z^(2n+1). No float decides.
     From these: the 30 partial capacities of Table tab:capacities (each within the printed 4.795e-10), the six scalars
     of Table tab:scalars (each within 3e-8), the four 18-digit enclosures of the Proposition (yield, volume, ratio,
     gap at Omega = 2.371056), T log 2 - B_*, the nine printed L_C / b / lambda lower bounds (+1e-15), beta in
     (0.533798153, 0.533798155) and < 1, positivity of every L_A, L_B, L_C entry and of the balance fractions, S_* > 0,
     the rounded-table argument (margin > 4.1011e-6 from the printed centres; (12 + Omega) 4e-8 = 5.7484224e-7), the
     printed error constants (tau < 3.120348e-32, 2048 tau < 6.391e-29, (68/3 + 9 Omega + 8) eps < 3.324e-27) and the
     headline inequality 3(8 log 7 - H_0 - C_*)/S_* < 2.371054886006746.

WHAT IS NOT DECIDED (it rests on theory, not on the finite object): that the rank constraint
H_0 + C_* + (w/3) S_* <= 8 log 7 holds, i.e. the heterogeneous joint extraction (Theorem thm:joint-step), the
compatibility count, hole repair and orbit-mask recovery, the staggered schedule and its boundary accounting, the leaf
volume proposition, the CW_5 rank bound and the passage from w to omega. Also not decided: that the capacity, J_W, leaf
rate R_{t,u} and balance formulas are the right quantities — they are evaluated here exactly as the paper writes them.
A CERTIFIED here certifies the parameter certificate (the finite component), not omega < 2.371054886006746.

RESULT (2026-10-10): every check passes in about one second; the decisive enclosures have width ~4e-64, and the ratio
is 2.37105488600674568486111187..., 3.2e-16 below the claimed 2.371054886006746. OBSERVATION: seven size-8 parents have
amount zero (0,8,0), (6,0,2), (6,1,1), (6,2,0), (7,0,1), (7,1,0), (8,0,0) — t_0 <= g_0 <= 5 for sorted positive g — and
each is either last in its traversal or reads no entry, so the paper's warning that skipping one "would change the meaning
of the arrays" (parameters.tex:85-88) is true of consumption only: no computed number moves (a forge below shows it), and
their entries (e.g. p[53] = -122, the last p entry, for (6,1,1)) are inert in the certificate.

READ AFTER THIS DECIDER RAN (verification/scripts/verify_parameters.py, never executed). The authors' verifier hashes
parameters.json, re-runs the same decoding with exact Fractions for F and the structural identities, then evaluates the
contractions in mpmath 1.3.0 interval arithmetic (mpmath.iv; a fixed 31-term series with a uniform tail in its
--rational-log mode, native interval logs otherwise) and asserts the same printed bounds — all 36 table errors below
4.795e-10, stricter than the 3e-8 the scalar table prints. Its rigour therefore rests on mpmath's outward rounding. It
does not read the TeX appendix (it pins the JSON by sha256; that the two agree is checked here) nor the supplementary
TSV (its row-for-row agreement with the decoding rules is checked here). Like this decider, it checks the finite
certificate only; the extraction theory is the paper's.
"""
import itertools
import json
import math
import os
import re
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/Staggered-extraction-for-exact-matrix-multiplication-over-every-field-September-24-2026/'
MAIN = DIR + 'build/main.tex'
INTRO = DIR + 'build/sections/introduction.tex'
PARAMS = DIR + 'build/sections/parameters.tex'
TABLES = DIR + 'build/sections/parameter-tables.tex'
STAGGER = DIR + 'build/sections/staggering.tex'
LEAF = DIR + 'build/sections/leaf-volumes.tex'
JOINT = DIR + 'build/sections/joint-extraction.tex'
JSON = DIR + 'verification/data/parameters.json'
TSV = DIR + 'verification/data/parameter-assignments.tsv'

CLAIMED = '2.371054886006746'
OMEGA = Fraction(2371056, 10 ** 6)

# ---------------------------------------------------------------- fixed-point intervals (endpoints are integers / 2^P)
P = 224
G = 32                      # guard bits inside the logarithm
Q = P + G


def iratio(n, d):
    """the exact rational n/d (d > 0), rounded outward"""
    return ((n << P) // d, -((-n << P) // d))


def ifrac(fr):
    return iratio(fr.numerator, fr.denominator)


def iint(k):
    return (k << P, k << P)


ZERO = (0, 0)


def iadd(a, b):
    return (a[0] + b[0], a[1] + b[1])


def isub(a, b):
    return (a[0] - b[1], a[1] - b[0])


def ineg(a):
    return (-a[1], -a[0])


def iscale(a, k):
    """exact multiplication by an integer"""
    return (a[0] * k, a[1] * k) if k >= 0 else (a[1] * k, a[0] * k)


def imul(a, b):
    if a[0] >= 0 and b[0] >= 0:
        return ((a[0] * b[0]) >> P, -((-(a[1] * b[1])) >> P))
    ps = (a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1])
    return (min(ps) >> P, -((-max(ps)) >> P))


def idiv(a, b):
    if b[0] <= 0:
        raise ValueError('division by an interval that is not positive')
    qs_lo = [(x << P) // y for x in a for y in b]
    qs_hi = [-((-x << P) // y) for x in a for y in b]
    return (min(qs_lo), max(qs_hi))


def imin(a, b):
    return (min(a[0], b[0]), min(a[1], b[1]))


def _atanh_lo(num, den, terms):
    """lower bound of atanh(num/den) * 2^Q, 0 <= num/den < 1 (positive series, truncated)"""
    z = (num << Q) // den
    z2 = (z * z) >> Q
    pw, s = z, 0
    for j in range(terms):
        s += pw // (2 * j + 1)
        pw = (pw * z2) >> Q
    return s


def _atanh_hi(num, den, terms, tail_factor):
    """upper bound of atanh(num/den) * 2^Q; tail <= tail_factor * z^(2 terms + 1)"""
    z = -((-num << Q) // den)
    z2 = -((-(z * z)) >> Q)
    pw, s = z, 0
    for j in range(terms):
        s += -((-pw) // (2 * j + 1))
        pw = -((-(pw * z2)) >> Q)
    return s + tail_factor * pw


def _consts():
    # ln 2 = 2 atanh(1/3): tail <= z^(2n+1)/((2n+1)(1 - 1/9)) <= 2 z^(2n+1)
    n = Q // 3 + 8
    ln2 = (2 * _atanh_lo(1, 3, n), 2 * _atanh_hi(1, 3, n, 2))
    # ln(1 + m/32) = 2 atanh(m/(64+m)), z <= 31/95: tail <= z^(2n+1)/(1 - z^2) <= 2 z^(2n+1)
    tab = [(2 * _atanh_lo(m, 64 + m, n), 2 * _atanh_hi(m, 64 + m, n, 2)) for m in range(32)]
    return ln2, tab


LN2Q, LNTAB = _consts()
NT = Q // 12 + 3            # z < 1/65: z^(2n+1) < 2^(-6.02 (2n+1)) is far below 2^-Q at this n


def _ln_bound(v, upper):
    """a lower (upper=False) or upper (upper=True) bound of ln(v / 2^P) * 2^Q, for an integer v > 0"""
    k = v.bit_length() - 1
    m = ((v << 5) >> k) - 32          # 2^k (32+m)/32 <= v < 2^k (33+m)/32
    e = k - P
    num = 32 * v - ((32 + m) << k)
    den = 32 * v + ((32 + m) << k)
    if upper:
        s = 2 * _atanh_hi(num, den, NT, 1) + LNTAB[m][1] + (e * LN2Q[1] if e >= 0 else e * LN2Q[0])
    else:
        s = 2 * _atanh_lo(num, den, NT) + LNTAB[m][0] + (e * LN2Q[0] if e >= 0 else e * LN2Q[1])
    return s


def ilog(a):
    if a[0] <= 0:
        raise ValueError('logarithm of an interval that is not positive')
    return (_ln_bound(a[0], False) >> G, -((-_ln_bound(a[1], True)) >> G))


LN2 = (LN2Q[0] >> G, -((-LN2Q[1]) >> G))


def xlogx(a):
    return imul(a, ilog(a))


def ient(vals):
    """H = -sum x log x over intervals whose true values are positive and sum to one"""
    s = ZERO
    for x in vals:
        s = iadd(s, xlogx(x))
    return ineg(s)


def iK(vals, M):
    """K(x) = M log M - sum x log x, M the (enclosed) true total"""
    s = xlogx(M)
    for x in vals:
        s = isub(s, xlogx(x))
    return s


def lt(a_hi, fr):
    """a_hi / 2^P < fr"""
    return a_hi * fr.denominator < fr.numerator << P


def gt(a_lo, fr):
    return a_lo * fr.denominator > fr.numerator << P


def inside(iv, a, b):
    return gt(iv[0], Fraction(a)) and lt(iv[1], Fraction(b))


def dec(iv, digits=22):
    """a printed (not deciding) decimal summary of an interval"""
    return '[%s, %s]' % (_dstr(iv[0], digits, False), _dstr(iv[1], digits, True))


def _dstr(v, digits, up):
    sc = 10 ** digits
    q = (v * sc) >> P if not up else -((-(v * sc)) >> P)
    sign = '-' if q < 0 else ''
    q = abs(q)
    return '%s%d.%0*d' % (sign, q // sc, digits, q % sc)


# ---------------------------------------------------------------- the CW_5 statistics, re-derived
WT = (0, 1, 1, 1, 1, 1, 2)                      # CW_q, q = 5: indices 0..6
CODE = {(0, 0): 0, (0, 1): 1, (1, 1): 2, (0, 2): 3, (1, 2): 4, (2, 2): 5}


def statistics():
    D = [0] * 6
    r = [0] * 6
    for a in range(7):
        for b in range(7):
            pair = tuple(sorted((WT[a], WT[b])))
            D[CODE[pair]] += 1
            r[CODE[pair]] = sum(pair)
    kappa = [CODE[tuple(sorted((2 - p[0], 2 - p[1])))] for p, _ in sorted(CODE.items(), key=lambda kv: kv[1])]
    return r, D, kappa


R, DM, KAPPA = statistics()


def c_ell(ell, j):
    """[x^j](1 + 5x + x^2)^ell"""
    poly = [1]
    for _ in range(ell):
        new = [0] * (len(poly) + 2)
        for i, c in enumerate(poly):
            new[i] += c
            new[i + 1] += 5 * c
            new[i + 2] += c
        poly = new
    return poly[j]


# ---------------------------------------------------------------- shapes and decoding
def sorted_shapes(n):
    return [(a, b, n - a - b) for a in range(n + 1) for b in range(a, n + 1) if n - a - b >= b]


def ordered_shapes(n):
    return [(a, b, n - a - b) for a in range(n + 1) for b in range(n + 1 - a)]


def Bset(s):
    ell = sum(s) // 2
    return [(b0, b1, ell - b0 - b1) for b0 in range(s[0] + 1) for b1 in range(s[1] + 1) if 0 <= ell - b0 - b1 <= s[2]]


def mult(g):
    c = {}
    for x in g:
        c[x] = c.get(x, 0) + 1
    m = 6
    for v in c.values():
        m //= math.factorial(v)
    return m


def B_priority(t):
    reps = [(1, 1, 6), (1, 2, 5), (1, 3, 4), (2, 2, 4), (3, 2, 3)]
    for perm in itertools.permutations((0, 1, 2)):
        if tuple(t[i] for i in perm) in reps:
            return perm
    raise ValueError(t)


class Reader:
    def __init__(self, arr, name):
        self.arr, self.name, self.i = arr, name, 0

    def next(self):
        v = self.arr[self.i]
        self.i += 1
        return v


def decode_split(reader, parents, rows, tag):
    """parameters.tex:50-63: per parent s and coordinate i, one integer for each max(0,k-l) <= j < floor(k/2)"""
    out = {}
    for s in parents:
        ell = sum(s) // 2
        ns = []
        for i in range(3):
            k = s[i]
            n = {}
            for j in range(max(0, k - ell), k // 2):
                idx = reader.i
                n[j] = reader.next()
                rows.append((tag, str(idx), str(s), str(i), str(j), str(n[j]), 'false'))
            n[k // 2] = 0
            rows.append((tag, '-', str(s), str(i), str(k // 2), '0', 'true'))
            ns.append(n)
        out[s] = ns
    return out


def decode(arr, skip=()):
    """the five arrays -> the decoded integer prescriptions, plus the decoding as a table of rows"""
    rows = []
    pos_sorted = [g for g in sorted_shapes(16) if min(g) > 0]
    pos_t = [t for t in ordered_shapes(8) if min(t) > 0]
    zero_t = [t for t in ordered_shapes(8) if min(t) == 0]
    for i, v in enumerate(arr['a']):
        rows.append(('a', str(i), '-', str(i), '-', str(v), 'false'))
    rP, rp, rd, rz = Reader(arr['P'], 'P'), Reader(arr['p'], 'p'), Reader(arr['d'], 'd'), Reader(arr['z'], 'z')
    nP = decode_split(rP, pos_sorted, rows, 'P')
    tB = [t for t in pos_t if ('p', t) not in skip]
    np_ = decode_split(rp, tB, rows, 'p')
    d = {}
    for t in pos_t:
        if ('d', t) in skip:
            continue
        for u in Bset(t):
            if max(u) == 2:
                idx = rd.i
                n = rd.next()
                d[(t, u)] = Fraction(n, 10 ** 6)
                rows.append(('d', str(idx), str(t), str(u), '-', str(n), 'false'))
    zw = {}
    for t in zero_t:
        if ('z', t) in skip:
            continue
        M = max(t)
        pairs = [(i, j) for i in range(6) for j in range(i, 6) if R[i] + R[j] == M]
        w = {}
        for k, pr in enumerate(pairs):
            if k < len(pairs) - 1:
                idx = rz.i
                w[pr] = rz.next()
                rows.append(('z', str(idx), str(t), '-', str(pr), str(w[pr]), 'false'))
            else:
                w[pr] = 0
                rows.append(('z', '-', str(t), '-', str(pr), '0', 'true'))
        zw[t] = w
    consumed = {k: (r.i, len(r.arr)) for k, r in (('P', rP), ('p', rp), ('d', rd), ('z', rz))}
    return dict(a=list(arr['a']), nP=nP, np=np_, d=d, zw=zw, rows=rows, consumed=consumed,
                pos_sorted=pos_sorted, pos_t=pos_t, zero_t=zero_t)


# ---------------------------------------------------------------- exact weights
DEN = 640000 ** 16 * math.factorial(16)


def Nnum(n):
    """sum_{j<=16} (n/640000)^j / j!  =  Nnum(n) / DEN, exactly"""
    f16 = math.factorial(16)
    return sum(n ** j * 640000 ** (16 - j) * (f16 // math.factorial(j)) for j in range(17))


class Weights:
    """E(n) = Nnum(n)^64 = F(n) DEN^64; DEN^64 cancels in every normalisation (each weight has the same number of F's)"""

    def __init__(self):
        self.cache = {}

    def E(self, n):
        if n not in self.cache:
            N = Nnum(n)
            if N == 0:
                raise ValueError('F vanishes')
            self.cache[n] = N ** 64
        return self.cache[n]


def split_law(W, s, ns):
    """exact integer weights of the product-weight law on B(s), parameters.tex:59-63"""
    w = {}
    for b in Bset(s):
        prod = 1
        for i in range(3):
            j = min(b[i], s[i] - b[i])
            prod *= W.E(ns[i][j])
        w[b] = prod
    return w


# ---------------------------------------------------------------- the finite contractions
def capacity(s, wq, Qlaw, prio):
    """(K(q_X), K(D_Y) - 2 J_Y, K(D_Z) - 2 J_Z), parameters.tex:108-134 / joint-extraction.tex:95-165.
    wq: exact integer weights of the split law on B(s); Qlaw(b, W): dict statistic -> interval (true total 1)."""
    Z = sum(wq.values())
    q = {b: iratio(v, Z) for b, v in wq.items()}
    X, Y, Zs = prio
    marg = {}
    for b, v in wq.items():
        marg[b[X]] = marg.get(b[X], 0) + v
    c0 = ient([iratio(v, Z) for v in marg.values()])
    out = [c0]
    for W in (Y, Zs):
        Dw = {}
        for b, qb in q.items():
            left = Qlaw(b, W)
            right = Qlaw(tuple(s[i] - b[i] for i in range(3)), W)
            for I, x in left.items():
                qx = imul(qb, x)
                for J, y in right.items():
                    key = (I, J)
                    t = imul(qx, y)
                    o = Dw.get(key)
                    Dw[key] = t if o is None else (o[0] + t[0], o[1] + t[1])
        HD = ient(Dw.values())
        if W == Y:
            designated = lambda b: b[Zs] == 0  # noqa: E731
        else:
            designated = lambda b: b[X] * b[Y] == 0  # noqa: E731
        J = ZERO
        resid = {}
        for b, qb in q.items():
            if designated(b):
                J = iadd(J, imul(qb, ient(Qlaw(b, W).values())))
            else:
                k = b[W]
                grp = resid.setdefault(k, [0, {}])
                grp[0] += wq[b]
                for I, x in Qlaw(b, W).items():
                    t = imul(qb, x)
                    o = grp[1].get(I)
                    grp[1][I] = t if o is None else iadd(o, t)
        for k, (mass, vec) in resid.items():
            J = iadd(J, iK(vec.values(), iratio(mass, Z)))
        out.append(isub(HD, iscale(J, 2)))
    return out


def hb(d):
    """h_b(d) = H(1-d, d) + d log 2 for an exact rational d"""
    s = ZERO
    for x in (1 - d, d):
        if x != 0:
            s = isub(s, xlogx(ifrac(x)))
    if d != 0:
        s = iadd(s, imul(ifrac(d), LN2))
    return s


def compute(arr, skip=(), z_unordered=False):
    dc = decode(arr, skip)
    W = Weights()
    a, nP, np_, d, zw = dc['a'], dc['nP'], dc['np'], dc['d'], dc['zw']
    pos_sorted, pos_t, zero_t = dc['pos_sorted'], dc['pos_t'], dc['zero_t']
    all_sorted = sorted_shapes(16)

    # initial law (parameters.tex:40-47) and H_0 = H(mu) (staggering.tex:16-25)
    wA = {g: mult(g) * W.E(a[g[0]]) * W.E(a[g[1]]) * W.E(a[g[2]]) for g in all_sorted}
    ZA = sum(wA.values())
    A = {g: iratio(v, ZA) for g, v in wA.items()}
    mu = [0] * 17
    for g, v in wA.items():
        for x in g:
            mu[x] += v
    H0 = ient([iratio(m, 3 * ZA) for m in mu if m])

    # Stage A and Stage B split laws (exact weights)
    wP = {g: split_law(W, g, nP[g]) for g in pos_sorted}
    wp = {t: split_law(W, t, np_[t]) for t in np_}
    symmetric = all(w[b] == w[tuple(s[i] - b[i] for i in range(3))] for s, w in list(wP.items()) + list(wp.items()) for b in w)

    # m_t = 2 sum_{min g > 0} A_g P_g(t)  (staggering.tex:166-168)
    m = {t: ZERO for t in ordered_shapes(8)}
    for g in pos_sorted:
        Zg = sum(wP[g].values())
        for t, v in wP[g].items():
            m[t] = iadd(m[t], iscale(imul(A[g], iratio(v, Zg)), 2))
    reachable = {t for g in pos_sorted for t in wP[g]}

    # child laws v_{t,u,W} (staggering.tex:68-73) — exact Fractions
    def v_exact(t, u, Wl):
        k = u[Wl]
        if k == 2:
            dd = d[(t, u)]
            return {s: x for s, x in ((2, 1 - dd), (3, dd)) if x != 0}
        return {{0: 0, 1: 1, 3: 4, 4: 5}[k]: Fraction(1)}

    # Stage B laws as intervals
    pB = {}
    for t, w in wp.items():
        Zt = sum(w.values())
        pB[t] = {u: iratio(x, Zt) for u, x in w.items()}

    # z_t (parameters.tex:70-80): F-weight on (i,j) and (j,i), normalised over ordered pairs
    zlaw = {}
    for t in zero_t:
        if t not in zw:
            continue
        w = {}
        for (i, j), n in zw[t].items():
            w[(i, j)] = W.E(n)
            w[(j, i)] = W.E(n)
        Zz = sum(w.values())
        if z_unordered:         # a misreading the paper warns against: each off-diagonal weight counted once
            Zz = sum(W.E(n) for n in zw[t].values())
        zlaw[t] = {k: iratio(x, Zz) for k, x in w.items()}

    # length-four laws V_{t,W} (staggering.tex:75-89)
    Vcache = {}

    def V(t, Wl):
        key = (t, Wl)
        if key in Vcache:
            return Vcache[key]
        if min(t) > 0:
            out = {}
            for u, pu in pB[t].items():
                tu = tuple(t[i] - u[i] for i in range(3))
                for i, x in v_exact(t, u, Wl).items():
                    for j, y in v_exact(t, tu, Wl).items():
                        c = imul(pu, ifrac(x * y))
                        out[(i, j)] = iadd(out.get((i, j), ZERO), c)
        else:
            Wstar = next(i for i in range(3) if t[i] == max(t))
            if t[Wl] == 0:
                out = {(0, 0): iint(1)}
            elif Wl == Wstar:
                out = dict(zlaw[t])
            else:
                out = {(KAPPA[i], KAPPA[j]): x for (i, j), x in zlaw[t].items()}
        Vcache[key] = out
        return out

    # zero-side consistency: the two other sides of every zero coordinate are matched by kappa
    zero_ok = True
    for t in ordered_shapes(8):
        if min(t) == 0 and t in zlaw:
            for X0 in range(3):
                if t[X0] != 0:
                    continue
                o1, o2 = [Wl for Wl in range(3) if Wl != X0]
                A1, A2 = V(t, o1), V(t, o2)
                push = {(KAPPA[i], KAPPA[j]): x for (i, j), x in A1.items()}
                zero_ok &= (push == A2)
    for t in pos_t:
        if t not in pB:
            continue
        for u in Bset(t):
            for X0 in range(3):
                if u[X0] != 0:
                    continue
                o1, o2 = [Wl for Wl in range(3) if Wl != X0]
                push = {KAPPA[i]: x for i, x in v_exact(t, u, o1).items()}
                zero_ok &= (push == v_exact(t, u, o2))

    # L_A rows by min g, L_B rows by sorted shape (Table tab:capacities)
    rowsA = {}
    for g in pos_sorted:
        vec = capacity(g, wP[g], V, (0, 1, 2))
        r = rowsA.setdefault(min(g), [ZERO, ZERO, ZERO])
        for i in range(3):
            r[i] = iadd(r[i], imul(A[g], vec[i]))
    rowsB = {}
    for t in pos_t:
        st = tuple(sorted(t))
        r = rowsB.setdefault(st, [ZERO, ZERO, ZERO])
        if t not in wp:
            continue
        vec = capacity(t, wp[t], lambda u, Wl, t=t: {i: ifrac(x) for i, x in v_exact(t, u, Wl).items()}, B_priority(t))
        for i in range(3):
            r[i] = iadd(r[i], imul(m[t], vec[i]))
    LA = [ZERO] * 3
    LB = [ZERO] * 3
    for r in rowsA.values():
        LA = [iadd(LA[i], r[i]) for i in range(3)]
    for r in rowsB.values():
        LB = [iadd(LB[i], r[i]) for i in range(3)]

    # T, B_*, C_* (staggering.tex:184-193), S_0, S_1, S_2 (leaf-volumes.tex:9-37)
    T = ZERO
    Bst = ZERO
    deficit = ZERO
    S2 = ZERO
    ln5 = ilog(iint(5))
    ln10 = ilog(iint(10))
    for t in pos_t:
        if t not in pB:
            continue
        for u, pu in pB[t].items():
            mtu = iscale(imul(m[t], pu), 2)
            if min(u) > 0:
                dd = d[(t, u)]
                T = iadd(T, mtu)
                h = hb(dd)
                Bst = iadd(Bst, imul(mtu, idiv(iadd(iscale(LN2, 2), h), iint(3))))
                deficit = iadd(deficit, imul(mtu, isub(LN2, h)))
                Rtu = imul(ifrac(2 - dd), ln5)
            elif max(u) == 4:
                Rtu = ZERO
            elif max(u) == 3:
                Rtu = ln10
            else:
                dd = d[(t, u)]
                Rtu = iadd(hb(dd), imul(ifrac(2 * (1 - dd)), ln5))
            S2 = iadd(S2, imul(mtu, Rtu))
    sumAB = ZERO
    for i in range(3):
        sumAB = iadd(sumAB, iadd(LA[i], LB[i]))
    Cst = iadd(Bst, idiv(sumAB, iint(3)))
    S0 = ZERO
    for g in all_sorted:
        if min(g) == 0:
            S0 = iadd(S0, imul(A[g], ilog(iint(c_ell(8, max(g))))))
    S1 = ZERO
    for t in zero_t:
        if t not in zlaw:
            continue
        z = zlaw[t]
        inner = ient(z.values())
        for (i, j), x in z.items():
            if DM[i] * DM[j] != 1:
                inner = iadd(inner, imul(x, ilog(iint(DM[i] * DM[j]))))
        S1 = iadd(S1, imul(m[t], inner))
    Sst = iadd(iadd(S0, S1), S2)
    yld = iadd(H0, Cst)
    ln7_8 = iscale(ilog(iint(7)), 8)
    ratio = idiv(iscale(isub(ln7_8, yld), 3), Sst)
    gap = isub(iadd(yld, imul(ifrac(OMEGA / 3), Sst)), ln7_8)
    Tln2 = imul(T, LN2)
    TB = isub(Tln2, Bst)
    LAB = [iadd(LA[i], LB[i]) for i in range(3)]
    LC = [isub(Cst, LAB[i]) for i in range(3)]
    bnum = [iadd(isub(Tln2, Cst), LAB[i]) for i in range(3)]
    lam = [idiv(bnum[i], iscale(TB, 3)) for i in range(3)]
    LC_direct = [isub(Tln2, imul(lam[i], deficit)) for i in range(3)]

    def vmin(v):
        return imin(imin(v[0], v[1]), v[2])
    LBC = [iadd(LB[i], LC[i]) for i in range(3)]
    beta = isub(iscale(Cst, 2), iadd(iadd(vmin(LA), vmin(LAB)), iadd(vmin(LBC), vmin(LC))))
    Fvals = sorted(W.cache)
    return dict(dc=dc, W=W, H0=H0, Bst=Bst, T=T, Cst=Cst, S0=S0, S1=S1, S2=S2, Sst=Sst, yld=yld, ratio=ratio, gap=gap,
                TB=TB, LA=LA, LB=LB, LC=LC, LC_direct=LC_direct, bnum=bnum, lam=lam, beta=beta, rowsA=rowsA,
                rowsB=rowsB, ln7_8=ln7_8, symmetric=symmetric, zero_ok=zero_ok, reachable=reachable, m=m,
                Fargs=Fvals)


# ---------------------------------------------------------------- what the paper prints
TABLE_CAP = {   # parameters.tex:148-157
    ('A', 1): ('.010739192', '.016912163', '.016213531'),
    ('A', 2): ('.081941050', '.088150511', '.082591626'),
    ('A', 3): ('.292033029', '.283922596', '.257330639'),
    ('A', 4): ('.547143900', '.527202791', '.487211274'),
    ('A', 5): ('.247999127', '.248080948', '.237330883'),
    ('B', (1, 1, 6)): ('.002770751', '.002770751', '.000443544'),
    ('B', (1, 2, 5)): ('.080908872', '.106275766', '.087117877'),
    ('B', (1, 3, 4)): ('.386356324', '.454421695', '.323639129'),
    ('B', (2, 2, 4)): ('.395346750', '.395353092', '.248930076'),
    ('B', (2, 3, 3)): ('.611253765', '.686627626', '.634289551'),
}
TABLE_SCALARS = {'H0': '1.841147374', 'Bst': '1.158066972', 'T': '2.345955063',
                 'S0': '.031704071', 'S1': '.882362236', 'S2': '11.680704014'}   # parameters.tex:168-169
ENCL = {   # parameters.tex:184-195, 282
    'yld': ('5.612983956059236756', '5.612983956059236757'),
    'Sst': ('12.594770321594676362', '12.594770321594676363'),
    'ratio': ('2.371054886006745684', '2.371054886006745685'),
    'gap': ('0.000004676829725968', '0.000004676829725969'),
    'TB': ('0.468025165562828972', '0.468025165562828973'),
}
LOWER_ROWS = {   # parameters.tex:291-293 (each a lower bound; +1e-15 an upper bound)
    'LC': ('1.115343821954349', '.962118642424118', '1.396738451843254'),
    'bnum': ('.510748315682386', '.663973495212618', '.229353685793481'),
    'lam': ('.363761291246081', '.472890166361139', '.163348542392779'),
}


def _squash(s):
    return re.sub(r'\s+', '', s)


def parse_arrays(tex):
    out = {}
    names = [('a', 'Initial shape weights'), ('P', 'Stage A split weights'), ('p', 'Stage B split weights'),
             ('d', 'Binary parameters'), ('z', 'Terminal length-four weights')]
    for key, head in names:
        i = tex.index(head)
        blk = tex[tex.index('\\begin{verbatim}', i) + len('\\begin{verbatim}'):tex.index('\\end{verbatim}', i)]
        out[key] = [int(x) for x in blk.split()]
    return out


def parse_tsv(text):
    lines = [ln for ln in text.split('\n') if ln.strip()]
    head = lines[0].split('\t')
    return head, [tuple(ln.split('\t')) for ln in lines[1:]]


def decide(src=None, arrays=None, claimed=CLAIMED, skip=(), printed_override=None, z_unordered=False):
    t0 = time.time()
    src = src or Sources()
    checks = []
    main = src.text(MAIN)
    intro = src.text(INTRO)
    params = src.text(PARAMS)
    tables = src.text(TABLES)
    stagger = src.text(STAGGER)
    leaf = src.text(LEAF)
    joint = src.text(JOINT)
    js = json.loads(src.text(JSON))
    tsv_head, tsv_rows = parse_tsv(src.text(TSV))
    sq = _squash(params)
    undecided = []

    def within(iv, lo, hi):
        """True when the enclosure lies strictly inside (lo, hi); records it when the enclosure straddles an end"""
        if inside(iv, lo, hi):
            return True
        if not (lt(iv[1], Fraction(lo)) or iv[1] * Fraction(lo).denominator == Fraction(lo).numerator << P
                or gt(iv[0], Fraction(hi)) or iv[0] * Fraction(hi).denominator == Fraction(hi).numerator << P):
            undecided.append((dec(iv, 24), str(lo), str(hi)))
        return False

    check(checks, 'the headline as printed (abstract and Theorem thm:main)',
          '$\\omega<2.371054886006746$' in main and '\\omega_\\F<2.371054886006746<2.371054887' in intro,
          'main.tex:43-45, introduction.tex:57-63')
    check(checks, 'the definitions the decider evaluates are printed where cited',
          all(_squash(k) in _squash(x) for k, x in (
              ('F(n)=\\left(\\sum_{j=0}^{16}\\frac{(n/640000)^j}{j!}\\right)^{64}', params),
              ('C_*&=B_*+\\frac13\\sum_{i=0}^2(L_A+L_B)_i', stagger),
              ('h_b(d)=H(1-d,d)+d\\log2', stagger),
              ('(2-d_{t,u})\\log5', leaf),
              ('\\mathcal I_Y=\\{u\\in\\supp p:u_Z=0\\}', joint),
              ('\\omega\\lew\\le\\frac{3(8\\log7-H_0-C_*)}{S_*}', params))),
          'parameters.tex:14, staggering.tex:122,192, leaf-volumes.tex:33, joint-extraction.tex:132, parameters.tex:327')

    tex_arrays = parse_arrays(tables)
    same = all(tex_arrays[k] == js['arrays'][k] for k in 'aPpdz')
    check(checks, 'the TeX appendix arrays equal verification/data/parameters.json', same,
          'lengths %s' % [len(tex_arrays[k]) for k in 'aPpdz'])
    arr = arrays if arrays is not None else tex_arrays
    check(checks, 'array lengths 17 / 118 / 54 / 75 / 36 as printed',
          [len(arr[k]) for k in 'aPpdz'] == [17, 118, 54, 75, 36])

    r, D, kap = statistics()
    check(checks, 'statistic coding re-derived from the 49 length-2 words of CW_5: r = (0,1,2,2,3,4), D = (1,10,25,2,10,1), kappa = (5,4,2,3,1,0)',
          r == [0, 1, 2, 2, 3, 4] and D == [1, 10, 25, 2, 10, 1] and kap == [5, 4, 2, 3, 1, 0]
          and '\\kappa=(5,4,2,3,1,0)' in stagger and 'D_i&1&10&25&2&10&1' in _squash(stagger))
    check(checks, 'kappa is an involution with D_kappa(i) = D_i and r_kappa(i) = 4 - r_i',
          all(kap[kap[i]] == i and D[kap[i]] == D[i] and r[kap[i]] == 4 - r[i] for i in range(6)))

    res = compute(arr, skip, z_unordered)
    dc = res['dc']
    check(checks, 'shape counts: 30 sorted, 21 positive sorted, 21 positive ordered size-8, 24 size-8 with a zero',
          (len(sorted_shapes(16)), len(dc['pos_sorted']), len(dc['pos_t']), len(dc['zero_t'])) == (30, 21, 21, 24)
          and 'There are 30 sorted initial shapes' in params)
    cons = dc['consumed']
    check(checks, 'the decoding rules as written consume every array exactly', all(a == b for a, b in cons.values()),
          str(cons))
    mine = [tuple(x) for x in dc['rows']]
    check(checks, "the authors' decoding table parameter-assignments.tsv agrees row for row with this decoding",
          tsv_head == ['array', 'index', 'parent', 'coordinate_or_child', 'statistic_or_left_value', 'integer', 'implicit']
          and mine == tsv_rows,
          '%d rows here, %d in the TSV, same order' % (len(mine), len(tsv_rows)))
    Fargs = res['Fargs']
    check(checks, '223 distinct F-arguments (implicit zero included), all in [-120770, 45052]',
          len(Fargs) == 223 and min(Fargs) == -120770 and max(Fargs) == 45052, '%d in [%d, %d]' % (len(Fargs), min(Fargs), max(Fargs)))
    Wt = res['W']
    D64 = DEN ** 64
    check(checks, '2^-23 < F(n) < 2^23 for every argument (exact integer comparison of Nnum^64 with DEN^64 2^23)',
          all(Wt.E(n) << 23 > D64 and Wt.E(n) < D64 << 23 for n in Fargs))
    dv = list(dc['d'].values())
    check(checks, 'd range: 0 <= d <= 0.110106, both ends attained',
          min(dv) == 0 and max(dv) == Fraction(110106, 10 ** 6) and 'The range is $0\\le d_{t,u}\\le0.110106$' in params)
    check(checks, 'printed examples d_{(1,3,4),(0,2,2)} = 92966/10^6 and d_{(1,3,4),(1,1,2)} = 1204/10^6',
          dc['d'].get(((1, 3, 4), (0, 2, 2))) == Fraction(92966, 10 ** 6) and dc['d'].get(((1, 3, 4), (1, 1, 2))) == Fraction(1204, 10 ** 6))
    check(checks, 'every split law satisfies q_s(b) = q_s(s-b) exactly (equal integer weights)', res['symmetric'])
    check(checks, 'every zero-coordinate child (Stage A t, Stage B u) has its two other sides matched by kappa, two-zero shapes included',
          res['zero_ok'])

    # the numbers
    pr = printed_override or {}
    cap_tol = Fraction(4795, 10 ** 13)
    ok_rows = True
    detail = []
    for key, vals in TABLE_CAP.items():
        row = res['rowsA'][key[1]] if key[0] == 'A' else res['rowsB'][key[1]]
        for i in range(3):
            c = Fraction(pr.get((key, i), vals[i]))
            good = within(row[i], c - cap_tol, c + cap_tol)
            ok_rows &= good
            if not good:
                detail.append('%s pos %d: %s vs printed %s' % (key, i, dec(row[i], 12), vals[i]))
    check(checks, 'Table tab:capacities: all 30 partial capacities within 4.795e-10 of the printed values',
          ok_rows and all(v in sq for vals in TABLE_CAP.values() for v in vals), '; '.join(detail[:5]))
    check(checks, 'all 30 partial capacity entries are positive',
          all(x[0] > 0 for rr in list(res['rowsA'].values()) + list(res['rowsB'].values()) for x in rr))
    sc_tol = Fraction(3, 10 ** 8)
    ok_sc = True
    det_sc = []
    for k, v in TABLE_SCALARS.items():
        c = Fraction(pr.get(k, v))
        good = within(res[k], c - sc_tol, c + sc_tol)
        ok_sc &= good
        det_sc.append('%s %s' % (k, dec(res[k], 12)))
    check(checks, 'Table tab:scalars: H_0, B_*, T, S_0, S_1, S_2 within 3e-8 of the printed values',
          ok_sc and all(v in sq for v in TABLE_SCALARS.values()), '; '.join(det_sc))
    names = {'yld': 'H_0 + C_*', 'Sst': 'S_*', 'ratio': '3(8 log 7 - H_0 - C_*)/S_*', 'gap': 'H_0 + C_* + (Omega/3) S_* - 8 log 7 at Omega = 2.371056',
             'TB': 'T log 2 - B_*'}
    for k, (a, b) in ENCL.items():
        a, b = pr.get((k, 0), a), pr.get((k, 1), b)
        check(checks, 'printed enclosure %s < %s < %s' % (a, names[k], b),
              within(res[k], a, b) and a in sq and b in sq, dec(res[k], 24))
    for k, vals in LOWER_ROWS.items():
        ok = all(within(res[k][i], Fraction(vals[i]), Fraction(vals[i]) + Fraction(1, 10 ** 15)) for i in range(3))
        check(checks, 'printed %s row: each entry in (listed, listed + 1e-15)' % {'LC': 'L_C', 'bnum': 'balance numerator b', 'lam': 'lambda'}[k],
              ok and all(v in sq for v in vals), '; '.join(dec(res[k][i], 17) for i in range(3)))
    check(checks, 'L_C by C_* - (L_A+L_B) agrees with L_C by the lambda formula (staggering.tex:213-220)',
          all(res['LC'][i][0] <= res['LC_direct'][i][1] and res['LC_direct'][i][0] <= res['LC'][i][1] for i in range(3)))
    check(checks, 'beta = 2C_* - min L_A - min(L_A+L_B) - min(L_B+L_C) - min L_C in (0.533798153, 0.533798155), < 1',
          within(res['beta'], '0.533798153', '0.533798155') and '0.533798153<2C_*' in sq, dec(res['beta'], 15))
    positive = (all(x[0] > 0 for v in (res['LA'], res['LB'], res['LC']) for x in v)
                and all(x[0] > 0 for x in res['bnum']) and all(x[0] > 0 for x in res['lam']) and res['TB'][0] > 0 and res['Sst'][0] > 0)
    check(checks, 'feasibility: L_A, L_B, L_C entrywise positive; balance numerators and fractions positive; T log 2 > B_*; S_* > 0', positive)

    # the rounded-table argument (parameters.tex:308-320)
    cent = {k: Fraction(v) for k, v in TABLE_SCALARS.items()}
    parts = sum(Fraction(v) for vals in TABLE_CAP.values() for v in vals)
    yld_c = cent['H0'] + cent['Bst'] + parts / 3
    S_c = cent['S0'] + cent['S1'] + cent['S2']
    margin_lo_num = (yld_c + OMEGA / 3 * S_c)
    # margin = yld_c + Omega/3 S_c - 8 log 7, with the outward (upper) bound of 8 log 7
    margin_lo = isub(ifrac(margin_lo_num), res['ln7_8'])
    unc = (12 + OMEGA) * Fraction(4, 10 ** 8)
    check(checks, 'rounded tables: (12 + Omega) 4e-8 = 5.7484224e-7, and the margin from the printed centres minus it exceeds 4.1011e-6',
          unc == Fraction(57484224, 10 ** 14) and gt(isub(margin_lo, ifrac(unc))[0], Fraction(41011, 10 ** 10))
          and '5.7484224\\cdot10^{-7}' in sq and '4.1011\\cdot10^{-6}' in sq,
          'centre margin %s, less the uncertainty %s' % (dec(margin_lo, 16), dec(isub(margin_lo, ifrac(unc)), 16)))
    tau = Fraction(2, 3 ** 63) / (63 * (1 - Fraction(1, 9)))
    eps = 2048 * tau
    check(checks, 'printed error constants: tau < 3.120348e-32, 2048 tau < 6.391e-29, (68/3 + 9 Omega + 8) eps < 3.324e-27',
          tau < Fraction(3120348, 10 ** 38) and eps < Fraction(6391, 10 ** 32) and (Fraction(68, 3) + 9 * OMEGA + 8) * eps < Fraction(3324, 10 ** 30))
    bound = Fraction(claimed)
    check(checks, 'THE HEADLINE INEQUALITY: 3(8 log 7 - H_0 - C_*)/S_* < %s (< 2.371054887)' % claimed,
          lt(res['ratio'][1], bound) and bound < Fraction('2.371054887'), 'ratio in %s' % dec(res['ratio'], 24))

    if not lt(res['ratio'][1], bound) and not res['ratio'][0] * bound.denominator >= bound.numerator << P:
        undecided.append(('ratio', dec(res['ratio'], 24), claimed))
    allpass = all(c['pass'] for c in checks)
    # a failed check is a decided failure unless an enclosure straddled the printed end (then the precision refused)
    verdict = 'CERTIFIED' if allpass else ('REFUSED' if undecided else 'REFUTED')
    value = {k: dec(res[k], 24) for k in ('H0', 'Bst', 'T', 'Cst', 'yld', 'S0', 'S1', 'S2', 'Sst', 'ratio', 'gap', 'TB', 'beta')}
    value['max_width'] = '%.3e' % max(float(Fraction(res[k][1] - res[k][0], 1 << P)) for k in ('yld', 'Sst', 'ratio', 'gap'))
    value['F_arguments'] = len(Fargs)
    value['seconds'] = round(time.time() - t0, 1)
    if undecided:
        value['undecided'] = undecided
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: the parameter certificate — the five integer arrays, decoded by the printed rules '
                       'and contracted by the printed finite formulas, give every printed table value and enclosure and '
                       '3(8 log 7 - H_0 - C_*)/S_* < 2.371054886006746 with every feasibility condition; NOT the extraction '
                       'theory that turns this ratio into a bound on omega'}


def forge():
    """each must NOT certify"""
    out = []
    r = decide(claimed='2.3710548860067455')
    out.append(('claimed bound lowered to 2.3710548860067455 (below the true ratio)', r['verdict']))
    src = Sources()
    arr = parse_arrays(src.text(TABLES))
    arr2 = {k: list(v) for k, v in arr.items()}
    arr2['a'][8] += 1           # a_8 = 38593 -> 38594: the ratio rises above the bound, not only the printed digits move
    r = decide(arrays=arr2)
    out.append(('one initial weight changed by one unit (a_8 = 38593 -> 38594; ratio %s)' % r['value']['ratio'], r['verdict']))
    arr3 = {k: list(v) for k, v in arr.items()}
    arr3['p'][0] += 1           # the Stage B entry of the reachable parent (1,1,6): -39594 -> -39593
    r = decide(arrays=arr3)
    out.append(('one Stage B integer of a reachable parent changed by one unit (p[0] = -39594 -> -39593)', r['verdict']))
    r = decide(z_unordered=True)
    out.append(('z_t normalised over unordered pairs (an off-diagonal weight counted once; parameters.tex:76-80 warns against it)', r['verdict']))
    r = decide(skip={('z', (6, 0, 2))})
    out.append(('the zero-amount parent (6,0,2) skipped in the z traversal (parameters.tex:86-88): caught by exact consumption only, '
                'since every zero-amount parent is at the tail of its traversal or reads no entry, so no number moves', r['verdict']))
    return out


if __name__ == '__main__':
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], '|', c['detail'])
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t))
