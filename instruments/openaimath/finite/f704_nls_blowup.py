"""F-704 -- "Stable self-similar blowup for a supercritical defocusing Schrodinger equation on the torus"
(openai/math family 371).

THE CLAIM (main.tex:67-82, Theorem thm:blowup): for some odd p >= 3 and finite k > 8 there is a nonempty open set of
H^k(T^12) data whose solutions of i u_t + Lap u = |u|^(p-1) u blow up in finite time, self-similarly.  Its finite
input is Proposition free:main (free.tex:52-91: on the disk D = {(b, Z) : (b - b_*)^2 + (Z - Z_*)^2 <= delta^2},
b_* = .33477606871236, Z_* = 2.70506819293654, delta = 1e-8: |j| < 3e-9 and deg(j, D, 0) = -1; Re j < .043 for z >= Z
and Im j > 0 for z >= 3; the matching determinants have 2, 1, 0 zeros in Re lambda >= -1/32 for l = 0, 1, >= 2),
whose "finite arithmetic ingredients" are Appendix cert:arithmetic (certificates.tex:1-429): "The verifier checks
the finite comparisons below. Their connection to the profile degree and spectral count is established by the
analytic arguments of Section sec:free" (certificates.tex:17-19).

WHAT IS DECIDED HERE, re-implemented from the appendix's text alone (integers, Gaussian integers, Fractions):
  1. cert:integer-box (certificates.tex:38-47): |H_0 b_* - B| + H_0 delta < 2 and |H_0 Z_* - S| + H_0 delta < 2.
  2. cert:boundary (certificates.tex:53-123): for l = 0..3 the forward recurrence with coefficient enclosures
     (errors 2 on the constant coefficients of t_n, d_n, s; the product rule cert:product-rule), the boundary form
     S = H + H^#, its determinant AD - C conj(C), the 16 even real coefficient enclosures D_j, and the three Moebius
     substitutions (cert:transformed-polynomial); the twelve printed minima of floor(Re X_j / (1 + e_j))
     (cert:boundary-table) compared exactly, and every one >= 1, i.e. every coefficient strictly positive.
  3. cert:winding (certificates.tex:125-190): the exact polynomial P_l (degree 15, p_15 = -8 S H_0^15, p_16 = 0), the
     axis polynomials R_l, I_l, the printed sign table at every listed separator (the quadrant cycle and its
     starting signs, and the two negative arguments for l = 0, 1), the four printed margins (cert:separator-margins)
     compared exactly, and the bracket counts 5,6,7,7 / 6,6,7,7 (+2,1 / +1,1 negative), seven each, against the degree
     bound.  A SECOND WAY to the counts 2, 1, 0, 0, without the sign table or the winding argument: an exact
     Routh-Hurwitz array for P_l(X), X = lambda + 1/32, counts its zeros with Re X > 0 and certifies none on the
     imaginary axis (regular array, every first-column entry nonzero).
  4. cert:high-angular (certificates.tex:192-243): the rational path constants (sin 2t0 < .4, cos 2t0 > .92,
     cos t0 > .98, N <= -2.444, L' > 10.7, 143/800, 1.13 < L(eta_0) < 1.19 on the disk, 587/1000, the slopes,
     M/2 - Z > 0), the polynomial P(t) of free:high-polynomial expanded exactly, the seven printed coefficients of
     P - Q compared exactly and positive, and the two printed discriminants.
  5. cert:profile (certificates.tex:245-346): the K = 34 product with its b- and Z-derivatives and the majorant E,
     in exact complex rationals at (b_*, Z_*); every comparison of free:profile-enclosures and cert:profile-extra,
     the rationals chi, v_1, v_2, gamma, e_jet, e_tail and cert:degree-comparisons, the determinant bound
     cert:profile-determinant, negative determinant and minimum stretch of the linear map, the .283 delta bound.
  6. cert:exterior (certificates.tex:348-429): the K = 5 forward recurrence in v (z = z_1 + v) with enclosures, the
     three tests of cert:exterior-table at their truncation degrees, the three printed minima compared exactly and
     positive, 0 < b < .335 on the disk, and the product bound cert:exterior-determinant.
  SECOND WAYS where one exists: the zero counts by Routh-Hurwitz (3); the profile product as an exact bivariate
     polynomial in (b, Z) over the box (5), which reproduces U_0, X_0, Y_0 term by term and bounds the Taylor
     remainder directly (about 99 |m_0| delta^2 against the claimed 50000 |m_0| delta^2), independent of the
     paper's majorant recurrence E.
  R. After this decider ran, the release's recorded verifier output verification/certificates/RESULTS.json was read
     as data: its minima, margins, sign rows, brackets, P(t), P - Q, gamma, e_jet + e_tail and determinant bound
     agree with the values computed here.
  Also the sanity identities the paper names: at the central point (exact b, Z, no errors) the computed boundary
     determinant has zero odd coefficients, zero imaginary parts and zero coefficients above degree 30 (the
     "consistency check" of certificates.tex:91-92), and the exterior d, Im c vanish above degrees 10, 8.

WHAT IS NOT DECIDED (theory, not the finite object):
  - the blowup theorem and everything outside Section sec:free (profiles, spectrum, linear and nonlinear stability);
  - the analytic lemmas that turn these comparisons into Proposition free:main: the slow solution and its
    expansion (Lemma free:slow), the Laguerre recurrence and cone identities (free:laguerre, free:cone), the column
    identity (free:columns), the multiplier identity and the claim that V_c L_0 d_0 q_0^2 >= P(t) on the ray
    (free:high-angular), the STRUCTURAL degree bounds that justify discarding the coefficients above degree 30 / 10 /
    9 / 8 (Lemma free:boundary, certificates.tex:348-396), the homotopy and argument-principle steps
    (free:boundary, free:winding: the counts decided here are for P_l at the moved point (B/H_0, S/H_0) and zero
    tail ratio), and the propagation from the profile enclosures to j (free:profile-degree), whose individual
    rational comparisons ARE decided.
"""
import math
import os
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/Stable-Self-Similar-Blowup-for-a-Supercritical-Defocusing-Schrodinger-Equation-on-the-Torus-September-24-2026/build/'
CERT = DIR + 'sections/certificates.tex'
FREE = DIR + 'sections/free.tex'
RESULTS = DIR.replace('build/', '') + 'verification/certificates/RESULTS.json'   # the release's recorded verifier output (data)

H0, BB, SS = 10 ** 8, 33477607, 270506819


def dec(s):
    """a terminating decimal of the paper, as the exact rational it denotes (free.tex:39)"""
    return Fraction(s)


B_STAR, Z_STAR, DELTA = dec('.33477606871236'), dec('2.70506819293654'), dec('1e-8')

PRINTED = {
    'boundary': {0: (63, 60, 94), 1: (21, 178, 199), 2: (4, 13, 323), 3: (1115, 173, 298)},
    'margins': (583, 432, 80, 68),
    'qlists': {0: [45, 90, 145, 220, 315, 450, 635, 920, 1780, 3100],
               1: [30, 68, 116, 173, 250, 350, 485, 680, 1005, 1880, 3210],
               2: [51, 78, 94, 121, 165, 218, 278, 369, 490, 720, 1080, 1930, 3340],
               3: [57, 95, 122, 157, 205, 265, 333, 431, 559, 784, 1148, 2020, 3521]},
    'start': {0: (-1, 1), 1: (1, 1), 2: (-1, -1), 3: (-1, -1)},
    'brackets_R': (5, 6, 7, 7), 'brackets_I': (6, 6, 7, 7),
    'high_diff': (Fraction(142518401, 500000000), Fraction(325932989, 1000000000), Fraction(15777215591, 200000000000),
                  Fraction(8728703679, 200000000000), Fraction(34209914771, 800000000000), Fraction(16113799, 3125000000),
                  Fraction(60018849, 40000000000)),
    'exterior': (288247, 17080, 31628),
    'exterior_degrees': (10, 10, 8),
    'counts': (2, 1, 0, 0),
    'neg_signs': [(1, 1), (-1, -1)],
    'free_root_table': {0: (5, 6, 2, 1), 1: (6, 6, 1, 1), 2: (7, 7, 0, 0), 3: (7, 7, 0, 0)},
}


def nows(s):
    return ''.join(s.split())


def parse_printed(cert, free):
    """the printed numbers this decider compares, read from the published LaTeX (whitespace removed)"""
    import re
    nc, nf = nows(cert), nows(free)
    out = {}
    m = re.search(r'\\label\{cert:boundary-table\}\\begin\{array\}\{c\|rrr\}.*?\\hline(.*?)\\end\{array\}', nc)
    out['boundary'] = {}
    for row in m.group(1).split('\\\\'):
        if row:
            v = [int(x) for x in row.split('&')]
            out['boundary'][v[0]] = tuple(v[1:])
    m = re.search(r'\\label\{cert:separator-margins\}(\d+),\\qquad(\d+),\\qquad(\d+),\\qquad(\d+)\.', nc)
    out['margins'] = tuple(int(m.group(i)) for i in range(1, 5))
    m = re.search(r'\\ell&q\\\\\\hline(.*?)\\end\{array\}', nc)
    out['qlists'] = {}
    for row in m.group(1).split('\\\\'):
        if row:
            l, qs = row.split('&')
            out['qlists'][int(l)] = [int(x) for x in qs.split(',')]
    sm = {'++': (1, 1), '-+': (-1, 1), '--': (-1, -1), '+-': (1, -1)}
    m = re.search(r'startingat\$([-+]{2})\$inrowzero,\$([-+]{2})\$inrowone,and\$([-+]{2})\$inrowstwoandthree', nc)
    out['start'] = {0: sm[m.group(1)], 1: sm[m.group(2)], 2: sm[m.group(3)], 3: sm[m.group(3)]}
    m = re.search(r'rowszeroandonehavesigns\$([-+]{2}),([-+]{2})\$', nc)
    out['neg_signs'] = [sm[m.group(1)], sm[m.group(2)]]
    m = re.search(r'Thesignchangesgive\$(\d),(\d),(\d),(\d)\$positiverootbracketsfor\$\\mathcalR_\\ell\$and\$(\d),(\d),(\d),(\d)\$for', nc)
    out['brackets_R'] = tuple(int(m.group(i)) for i in range(1, 5))
    out['brackets_I'] = tuple(int(m.group(i)) for i in range(5, 9))
    m = re.search(r'\\label\{cert:high-difference\}\\begin\{split\}(.*?)\\end\{split\}', nc)
    out['high_diff'] = tuple(Fraction(int(a), int(b)) for a, b in re.findall(r'\\frac\{(\d+)\}\{(\d+)\}', m.group(1)))
    m = re.search(r'\\label\{cert:exterior-table\}.*?\\hline(.*?)\\end\{array\}', nc)
    rows = [r for r in m.group(1).split('\\\\') if r]
    out['exterior'] = tuple(int(r.split('&')[-1]) for r in rows)
    out['exterior_degrees'] = tuple(int(r.split('&')[-2]) for r in rows)
    m = re.search(r'convertingthisfinitesigntableintothematchingcounts\$(\d),(\d),(\d),(\d)\$', nc)
    out['counts'] = tuple(int(m.group(i)) for i in range(1, 5))
    m = re.search(r'\\hline0&(\d)&(\d)&(\d)&(\d)\\\\1&(\d)&(\d)&(\d)&(\d)\\\\2,3&(\d)&(\d)&(\d)&(\d)\\end\{array\}', nf)
    g = [int(m.group(i)) for i in range(1, 13)]
    out['free_root_table'] = {0: tuple(g[0:4]), 1: tuple(g[4:8]), 2: tuple(g[8:12]), 3: tuple(g[8:12])}
    return out


# ---------------------------------------------------------------- enclosure polynomials (certificates.tex:23-36)
# a polynomial is a list of [re, im, e]: the actual j-th coefficient lies within l1-distance e of re + i im

def P(*coeffs):
    """exact polynomial from (re, im) pairs or ints"""
    out = []
    for c in coeffs:
        if isinstance(c, tuple):
            out.append([c[0], c[1], 0])
        else:
            out.append([c, 0, 0])
    return out


def l1(X):
    return [abs(r) + abs(i) for r, i, _ in X]


def conv(a, b):
    out = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                if y:
                    out[i + j] += x * y
    return out


def emul(X, Y):
    """[X;e][Y;f] = [XY; e(|Y|_1 + f) + |X|_1 f]  (cert:product-rule)"""
    n = len(X) + len(Y) - 1
    re_ = [0] * n
    im = [0] * n
    for i, (a, b, _) in enumerate(X):
        if a or b:
            for j, (c, d, _) in enumerate(Y):
                if c or d:
                    re_[i + j] += a * c - b * d
                    im[i + j] += a * d + b * c
    e, f = [x[2] for x in X], [y[2] for y in Y]
    err = [p + q for p, q in zip(conv(e, [u + v for u, v in zip(l1(Y), f)]), conv(l1(X), f))]
    return [[re_[k], im[k], err[k]] for k in range(n)]


def eadd(X, Y, sy=1):
    n = max(len(X), len(Y))
    X = X + [[0, 0, 0]] * (n - len(X))
    Y = Y + [[0, 0, 0]] * (n - len(Y))
    return [[a[0] + sy * b[0], a[1] + sy * b[1], a[2] + b[2]] for a, b in zip(X, Y)]


def econj(X):
    return [[r, -i, e] for r, i, e in X]


def esharp(X):
    """f#(v) = conj(f(-v)), coefficientwise; absolute error bounds preserved"""
    return [[r * (-1) ** j, -i * (-1) ** j, e] for j, (r, i, e) in enumerate(X)]


def h_form(M, s, a, b_, c, d):
    """h(a, b', c, d) = M conj(a) c + s (conj(a) d - conj(b') c)"""
    ac = emul(econj(a), c)
    first = emul(M, ac)
    inner = eadd(emul(econj(a), d), emul(econj(b_), c), -1)
    return eadd(first, emul(s, inner))


def forward(tn, dn, s, K):
    """K steps of x_new = t_n x + s y, y_new = d_n y - x_new from x = (1,0), y = (0,1) (cert:forward-recipe)"""
    x = [P(1), P(0)]
    y = [P(0), P(1)]
    for n in range(K):
        xn = [eadd(emul(tn(n), x[k]), emul(s, y[k])) for k in range(2)]
        yn = [eadd(emul(dn(n), y[k]), xn[k], -1) for k in range(2)]
        x, y = xn, yn
    return x, y


def floor_min(X, top):
    """min over 0 <= j <= top of floor(Re X_j / (1 + e_j))"""
    return min((X[j][0] // (1 + X[j][2]) if j < len(X) else 0) for j in range(top + 1))


# ---------------------------------------------------------------- 2. the boundary forms

def boundary_D(l, exact_center=False):
    """the even real coefficient enclosures D_0..D_15 of det S for degree l; with exact_center, the exact
    computation at (b, Z) = (B/H0, S/H0) with no errors (the paper's consistency check)"""
    err = 0 if exact_center else 2
    base = H0 * l // 2 + H0 * 0 - H0 // 32                      # H0(l/2 - 1/32); integers since H0/32 = 3125000
    M = [[H0 * (l + 5), 0, 0]]
    s = [[0, SS, err]]
    tn = lambda n: [[base + H0 * n, -BB, err], [0, H0, 0]]        # noqa: E731  H0(l/2+n-1/32) + i(H0 v - B)
    dn = lambda n: [[base + H0 * n - H0 * (l + 5), -BB, err], [0, H0, 0]]  # noqa: E731
    x, y = forward(tn, dn, s, 8)
    A = h_form(M, s, x[0], y[0], x[0], y[0])
    D = h_form(M, s, x[1], y[1], x[1], y[1])
    C = h_form(M, s, x[0], y[0], x[1], y[1])
    A, D, C = (eadd(F, esharp(F)) for F in (A, D, C))
    det = eadd(emul(A, D), emul(C, econj(C)), -1)
    return det


def transformed(Dj, U, V, J):
    """sum_j D_j (U + V w)^j (1 + J w)^(15-j) by the multiplication-only recipe (certificates.tex:103-105)"""
    Q = [[0, 0, 0]]
    E = P(1)
    for j in range(15, -1, -1):
        Q = eadd(emul(Q, P(U, V)), emul(E, [Dj[j]]))
        E = emul(E, P(1, J))
    return Q


# ---------------------------------------------------------------- 3. winding

def winding_poly(l):
    """p_0..p_16 of P_l (certificates.tex:127-142), exact Gaussian-integer arithmetic"""
    def mul(a, b):
        out = [(0, 0)] * (len(a) + len(b) - 1)
        for i, (ar, ai) in enumerate(a):
            for j, (br, bi) in enumerate(b):
                o = out[i + j]
                out[i + j] = (o[0] + ar * br - ai * bi, o[1] + ar * bi + ai * br)
        return out

    def add(a, b, sb=1):
        n = max(len(a), len(b))
        a = a + [(0, 0)] * (n - len(a))
        b = b + [(0, 0)] * (n - len(b))
        return [(p[0] + sb * q[0], p[1] + sb * q[1]) for p, q in zip(a, b)]
    x, y = [(0, 0)], [(1, 0)]
    for n in range(7, -1, -1):
        t = [(H0 * l // 2 + H0 * n - H0 // 32, -BB), (H0, 0)]       # H0(X - 1/32 + l/2 + n) - iB
        tm = add(t, [(H0 * (l + 5), SS)], -1)                        # t - H0(l+5) - iS
        x, y = add(mul(tm, x), mul([(0, SS)], y), -1), mul(t, add(x, y))
    pj = []
    for j in range(17):
        acc = 0
        for k in range(j + 1):
            if k < len(x) and j - k < len(y):
                xr, xi = x[k]
                yr, yi = y[j - k]
                acc += xi * yr - xr * yi                              # Im(x_k conj(y_{j-k}))
        pj.append(acc)
    return pj


def axis_sign(pj, c, eps, q):
    d = [pj[2 * j + c] * 100 ** (14 - 2 * j) * (-eps * q * q) ** j for j in range(8)]
    sm, ab = sum(d), sum(abs(x) for x in d)
    return (sm > 0) - (sm < 0), sm, ab


def routh_rhp(coeffs):
    """zeros with Re X > 0 of the real polynomial (low -> high) by the Routh array; with every first-column entry
    nonzero, their number is the count of sign changes down the first column and none lie on the imaginary axis.
    None in the singular case (a vanishing first-column entry): not decided this way."""
    a = [Fraction(x) for x in reversed(coeffs)]
    n = len(a) - 1
    m = n // 2 + 1
    rows = [a[0::2] + [Fraction(0)] * (m - len(a[0::2])), a[1::2] + [Fraction(0)] * (m - len(a[1::2]))]
    for _ in range(2, n + 1):
        top, bot = rows[-2], rows[-1]
        if bot[0] == 0:
            return None
        rows.append([(bot[0] * top[i + 1] - top[0] * bot[i + 1]) / bot[0] for i in range(m - 1)] + [Fraction(0)])
    first = [r[0] for r in rows]
    if any(x == 0 for x in first):
        return None
    return sum(1 for i in range(n) if (first[i] > 0) != (first[i + 1] > 0))


# ---------------------------------------------------------------- 4. the high angular polynomial

def fpoly_mul(a, b):
    return conv(a, b)


def fpoly_add(*ps):
    n = max(len(p) for p in ps)
    return [sum(p[i] if i < len(p) else 0 for p in ps) for i in range(n)]


def high_P():
    u0 = [dec('.099'), dec('.98')]
    L0 = [dec('1.13'), dec('.98')]
    d0 = fpoly_add(fpoly_mul([dec('.100'), dec('.981')], [dec('.100'), dec('.981')]),
                   fpoly_mul([dec('2.72'), dec('.20')], [dec('2.72'), dec('.20')]))
    q0 = [Fraction(1), dec('1.5')]
    q02 = fpoly_mul(q0, q0)
    L0d0q02 = fpoly_mul(fpoly_mul(L0, d0), q02)
    t1 = fpoly_mul([Fraction(-3) - Fraction(1, 32) + u0[0] / 4, u0[1] / 4], L0d0q02)
    t2 = [Fraction(81, 4) * c for c in fpoly_mul(fpoly_mul(u0, L0), q02)]
    t3 = [5 * c for c in fpoly_mul(L0, d0)]
    sq = fpoly_mul([dec('-1.5'), dec('2.75')], [dec('-1.5'), dec('2.75')])
    t4 = [-c for c in fpoly_mul(sq, d0)]
    return fpoly_add(t1, t2, t3, t4)


def high_Q():
    return [Fraction(2), Fraction(33), dec('-72.2'), dec('44.8'), dec('17.9'), dec('-4.61'), dec('.54')]


# ---------------------------------------------------------------- 5. the profile product

def cmul(a, b):
    return (a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0])


def cadd(*xs):
    return (sum(x[0] for x in xs), sum(x[1] for x in xs))


def mmul(A, B):
    return [[cadd(cmul(A[i][0], B[0][j]), cmul(A[i][1], B[1][j])) for j in range(2)] for i in range(2)]


def madd(A, B):
    return [[cadd(A[i][j], B[i][j]) for j in range(2)] for i in range(2)]


def rmul(A, B):
    return [[A[i][0] * B[0][j] + A[i][1] * B[1][j] for j in range(2)] for i in range(2)]


def ml1(A):
    return [[abs(A[i][j][0]) + abs(A[i][j][1]) for j in range(2)] for i in range(2)]


def profile(b=B_STAR, Z=Z_STAR, delta=DELTA, K=34):
    zero, one = (Fraction(0), Fraction(0)), (Fraction(1), Fraction(0))
    U = [[one, zero], [zero, one]]
    X = [[zero, zero], [zero, zero]]
    Y = [[zero, zero], [zero, zero]]
    E = [[Fraction(0)] * 2 for _ in range(2)]
    mi = (Fraction(0), Fraction(-1))
    G = [[mi, zero], [mi, mi]]
    H1 = [[mi, mi], [zero, zero]]
    N = [[2, 1], [1, 1]]                    # |G|_1 + |H_1|_1
    for n in range(K - 1, -1, -1):
        t = (Fraction(n), -b)
        F = [[(t[0] - 5, t[1] - Z), (Fraction(0), -Z)], [t, t]]
        Fl = ml1(F)
        k = Fraction(1, n + 1)
        U2 = mmul(F, U)
        X2 = madd(mmul(G, U), mmul(F, X))
        Y2 = madd(mmul(H1, U), mmul(F, Y))
        A = [[Fl[i][j] + delta * N[i][j] for j in range(2)] for i in range(2)]
        XY = [[a + c for a, c in zip(r1, r2)] for r1, r2 in zip(ml1(X), ml1(Y))]
        E2 = [[a + c for a, c in zip(r1, r2)] for r1, r2 in zip(rmul(A, E), rmul(N, XY))]
        sc = lambda Mx: [[(z[0] * k, z[1] * k) for z in row] for row in Mx]  # noqa: E731
        U, X, Y = sc(U2), sc(X2), sc(Y2)
        E = [[v * k for v in row] for row in E2]
    return U, X, Y, E


def profile_bivariate(b=B_STAR, Z=Z_STAR, delta=DELTA, K=34):
    """the exact product F_0 ... F_{K-1} as a bivariate polynomial in (e, f), b = b_* + delta e, Z = Z_* + delta f,
    each factor scaled by 10^14 to Gaussian integers; returns (matrix of {(i, j): (re, im)}, scale) with
    L = product / scale, scale = 10^(14K) K!.  Independent of the paper's majorant recurrence."""
    sc = 10 ** 14
    Bs, Zs, ds = b * sc, Z * sc, delta * sc
    assert Bs.denominator == Zs.denominator == ds.denominator == 1
    Bs, Zs, ds = int(Bs), int(Zs), int(ds)

    def pmul_aff(aff, poly):
        out = {}
        for (ka, (ar, ai)) in aff.items():
            for (kp, (pr, pi)) in poly.items():
                k = (ka[0] + kp[0], ka[1] + kp[1])
                o = out.get(k, (0, 0))
                out[k] = (o[0] + ar * pr - ai * pi, o[1] + ar * pi + ai * pr)
        return out

    def padd(x, y):
        out = dict(x)
        for k, (r, i) in y.items():
            o = out.get(k, (0, 0))
            out[k] = (o[0] + r, o[1] + i)
        return out
    Mx = [[{(0, 0): (1, 0)}, {}], [{}, {(0, 0): (1, 0)}]]
    for n in range(K - 1, -1, -1):
        f00 = {(0, 0): (sc * (n - 5), -(Bs + Zs)), (1, 0): (0, -ds), (0, 1): (0, -ds)}
        f01 = {(0, 0): (0, -Zs), (0, 1): (0, -ds)}
        f10 = {(0, 0): (sc * n, -Bs), (1, 0): (0, -ds)}
        F = [[f00, f01], [f10, f10]]
        Mx = [[padd(pmul_aff(F[i][0], Mx[0][j]), pmul_aff(F[i][1], Mx[1][j])) for j in range(2)] for i in range(2)]
    return Mx, sc ** K * math.factorial(K)


def cdiv(a, b):
    n = b[0] * b[0] + b[1] * b[1]
    return ((a[0] * b[0] + a[1] * b[1]) / n, (a[1] * b[0] - a[0] * b[1]) / n)


def cabs2(a):
    return a[0] * a[0] + a[1] * a[1]


# ---------------------------------------------------------------- 6. the exterior forms

def exterior(z1, exact_b=False):
    err = 0 if exact_b else 2
    M = [[5 * H0, 0, 0]]
    s = [[0, int(H0 * z1), 0], [0, H0, 0]]                       # i H0 (z_1 + v), exact
    assert H0 * z1 == int(H0 * z1)
    tn = lambda n: [[H0 * n, -BB, err]]                          # noqa: E731
    dn = lambda n: [[H0 * n - 5 * H0, -BB, err]]                 # noqa: E731
    x, y = forward(tn, dn, s, 5)
    d = h_form(M, s, x[1], y[1], x[1], y[1])
    c = h_form(M, s, x[1], y[1], x[0], y[0])
    return d, c


def re_part(X):
    return [[r, 0, e] for r, i, e in X]


def im_part(X):
    return [[i, 0, e] for r, i, e in X]


# ---------------------------------------------------------------- the decision

def decide(src=None, printed=None, b_star=B_STAR, z_star=Z_STAR):
    src = src or Sources()
    checks = []
    claim_fail = []

    def c(name, ok, detail='', kind='claim'):
        check(checks, name, ok, detail)
        if not ok and kind == 'claim':
            claim_fail.append(name)

    cert, free = src.text(CERT), src.text(FREE)
    nc, nf = nows(cert), nows(free)
    parsed = parse_printed(cert, free)
    c('the numbers read from the LaTeX agree with this decider\'s transcription of them (a parse check)',
      all(parsed[k] == PRINTED[k] for k in PRINTED), str([k for k in PRINTED if parsed[k] != PRINTED[k]]))
    printed = printed or parsed
    value = {}
    c('the disk as printed (free.tex:42-44) and the integer box (certificates.tex:40-41)',
      'b_*=.33477606871236,\\qquadZ_*=2.70506819293654,\\qquad\\delta=10^{-8}' in nf
      and 'H_0=10^8,\\qquadB=33477607,\\qquadS=270506819' in nc)

    # 1. integer box
    c('1. |H0 b_* - B| + H0 delta < 2 and |H0 Z_* - S| + H0 delta < 2 (certificates.tex:44-46)',
      abs(H0 * b_star - BB) + H0 * DELTA < 2 and abs(H0 * z_star - SS) + H0 * DELTA < 2,
      '%s, %s' % (abs(H0 * b_star - BB) + H0 * DELTA, abs(H0 * z_star - SS) + H0 * DELTA))

    # 2. boundary forms
    subs = [(0, 1, 1), (1, 10, 1), (10, 1, 0)]
    table, allpos, central = {}, True, True
    for l in range(4):
        det = boundary_D(l)
        Dj = [[det[2 * j][0], 0, det[2 * j][2]] for j in range(16)]
        row = []
        for U, V, J in subs:
            X = transformed(Dj, U, V, J)
            assert all(x[1] == 0 for x in X)
            row.append(floor_min(X, 15))
            allpos &= all(X[j][0] - X[j][2] > 0 for j in range(16))
        table[l] = tuple(row)
        ex = boundary_D(l, exact_center=True)
        central &= all(ex[k][1] == 0 for k in range(len(ex))) and all(ex[k][0] == 0 for k in range(1, len(ex), 2)) \
            and all(ex[k][0] == 0 for k in range(31, len(ex)))
    value['boundary_minima'] = table
    for l in range(4):
        c('2. cert:boundary-table, l = %d: minima of floor(Re X_j/(1+e_j)) over (0,1,1), (1,10,1), (10,1,0)' % l,
          table[l] == tuple(printed['boundary'][l]), 'computed %s, printed %s' % (table[l], printed['boundary'][l]))
    c('2. every transformed coefficient enclosure is strictly positive (Re X_j > e_j), all l and substitutions',
      allpos and all(m >= 1 for r in table.values() for m in r))
    c('2. consistency check: at (B/H0, S/H0) without errors, det S is real, even and of degree <= 30 (certificates.tex:91-92)',
      central)
    c('2. the three maps (U + V w)/(1 + J w), w >= 0, cover [0,1), [1,10), [10, inf): w/(1+w), (1+10w)/(1+w), 10+w',
      [(Fraction(U), Fraction(V, J) if J else None) for U, V, J in subs] == [(0, 1), (1, 10), (10, None)])

    # 3. winding
    margins, br_R, br_I, rh = [], [], [], []
    signs_ok = True
    cyc = [(1, 1), (-1, 1), (-1, -1), (1, -1)]
    for l in range(4):
        pj = winding_poly(l)
        c('3. l = %d: deg P_l = 15 with p_15 = -8 S H0^15 and p_16 = 0' % l, pj[15] == -8 * SS * H0 ** 15 and pj[16] == 0)
        qs = [0] + printed['qlists'][l] + [7500]
        seq, mrg = [], []
        for q in qs:
            pair = []
            for cc in (0, 1):
                sg, sm, ab = axis_sign(pj, cc, 1, q)
                pair.append(sg)
                mrg.append((sg, sm, ab))
            seq.append(tuple(pair))
        start = cyc.index(tuple(printed['start'][l]))
        want = [cyc[(start + i) % 4] for i in range(len(qs))]
        signs_ok &= seq == want
        negs = []
        if l in (0, 1):
            for q in (50, 200):
                pair = []
                for cc in (0, 1):
                    sg, sm, ab = axis_sign(pj, cc, -1, q)
                    pair.append(sg)
                    mrg.append((sg, sm, ab))
                negs.append(tuple(pair))
            signs_ok &= negs == list(printed['neg_signs'])
        margins.append(min((10 ** 4 * sg * sm) // ab for sg, sm, ab in mrg if sg != 0) if all(sg != 0 for sg, _, _ in mrg) else -1)
        nR = sum(1 for i in range(len(seq) - 1) if seq[i][0] != seq[i + 1][0])
        nI = sum(1 for i in range(len(seq) - 1) if seq[i][1] != seq[i + 1][1])
        negR = negI = 0
        if l in (0, 1):
            chain = [negs[1], negs[0], seq[0]]                       # w = -4, -1/4, 0
            negR = sum(1 for i in range(2) if chain[i][0] != chain[i + 1][0])
            negI = sum(1 for i in range(2) if chain[i][1] != chain[i + 1][1])
        br_R.append((nR, negR))
        br_I.append((nI, negI))
        Rl = [(-1) ** j * pj[2 * j] for j in range(8)]
        Il = [(-1) ** j * pj[2 * j + 1] for j in range(8)]
        c('3. l = %d: R_l and I_l are nonzero of degree <= 7 with %d + %d and %d + %d sign-change brackets = 7 each'
          % (l, nR, negR, nI, negI), any(Rl) and any(Il) and nR + negR == 7 and nI + negI == 7)
        rh.append(routh_rhp(pj[:16]))
    value['separator_margins'] = margins
    value['routh_right_half_plane'] = rh
    c('3. the printed sign table: the cycle ++, -+, --, +- from the printed starting signs at every listed q '
      '(endpoints 0, 7500), and ++, -- at w = -(1/2)^2, -(2)^2 for l = 0, 1', signs_ok)
    c('3. cert:separator-margins: the row minima of floor(1e4 e sum d_j / sum |d_j|) equal 583, 432, 80, 68',
      tuple(margins) == tuple(printed['margins']), 'computed %s' % (margins,))
    c('3. positive brackets of R_l: 5,6,7,7; of I_l: 6,6,7,7 (certificates.tex:184-185)',
      tuple(x[0] for x in br_R) == tuple(printed['brackets_R']) and tuple(x[0] for x in br_I) == tuple(printed['brackets_I']))
    c('3. the root-count table of Lemma free:winding (free.tex:563-566): (pos R, pos I, neg R, neg I) per l',
      all((br_R[l][0], br_I[l][0], br_R[l][1], br_I[l][1]) == tuple(printed['free_root_table'][l]) for l in range(4)),
      str([(br_R[l][0], br_I[l][0], br_R[l][1], br_I[l][1]) for l in range(4)]))
    c('3. the winding conversion N_right = (15 - (2n+1))/2 with n = 5, 6, 7, 7 gives 2, 1, 0, 0',
      tuple((15 - (2 * x[0] + 1)) // 2 for x in br_R) == tuple(printed['counts']))
    c('3. SECOND WAY: Routh-Hurwitz on P_l(X), X = lambda + 1/32: zeros with Re X > 0 are 2, 1, 0, 0 and none lie on '
      'the imaginary axis (regular array)', tuple(rh) == tuple(printed['counts']), str(rh))

    # 4. high angular
    ct0, st0 = Fraction(99, 101), Fraction(20, 101)
    s2, c2 = 2 * st0 * ct0, ct0 * ct0 - st0 * st0
    c('4. cos^2 + sin^2 = 1 at theta_0; sin 2t0 < .4, cos 2t0 > .92, cos t0 > .98 (certificates.tex:199-200)',
      ct0 ** 2 + st0 ** 2 == 1 and s2 < dec('.4') and c2 > dec('.92') and ct0 > dec('.98'))
    Nb = dec('.04') - dec('2.70') * dec('.92')
    c('4. N <= .1(.4) - 2.70(.92) = -2.444; L\' > .98 - 4(-2.444) > 10.7; -3 - 1/32 + .3(10.7) = 143/800 > 0',
      Nb == dec('-2.444') and dec('.98') - 4 * Nb > dec('10.7') and -3 - Fraction(1, 32) + dec('.3') * dec('10.7') == Fraction(143, 800))
    Lj = [Fraction(10, 101) * c2 + (Z + Fraction(1, 101)) * s2 for Z in (z_star - DELTA, z_star + DELTA)]
    c('4. at the join (u = 10/101, v = Z + 1/101): 1.13 < L < 1.19 on the disk; -1.5 - .3(1.19) + 2.444 = 587/1000',
      all(dec('1.13') < x < dec('1.19') for x in Lj) and dec('-1.5') - dec('.3') * dec('1.19') + dec('2.444') == Fraction(587, 1000)
      and Fraction(10, 101) == st0 / 2 and (1 - ct0) / 2 == Fraction(1, 101))
    c('4. on the arc (free.tex:394-397): u <= sin(t0)/2 = 10/101 <= .1, 2.70 < Z <= v <= Z + 1/101 < 2.72 on the disk, '
      'and 3 - .3^2 > 0', st0 / 2 <= dec('.1') and z_star - DELTA > dec('2.70') and z_star + DELTA + Fraction(1, 101) < dec('2.72')
      and 3 - dec('.3') ** 2 > 0)
    c('4. on the ray (free.tex:410-411): .099 < u(eta_0) = 10/101 < .100, so u_0 = .099 + .98t <= u <= .100 + .981t',
      dec('.099') < st0 / 2 < dec('.100'))
    c('4. ray slopes 99/101 in (.98, .981), 20/101 < .20; M/2 - Z >= 9/2 - Z_* - delta > 0',
      dec('.98') < ct0 < dec('.981') and st0 < dec('.20') and Fraction(9, 2) - z_star - DELTA > 0)
    Pp, Qp = high_P(), high_Q()
    diff = [a - b for a, b in zip(Pp + [0] * (7 - len(Pp)), Qp)]
    c('4. P(t) of free:high-polynomial has degree 6 and P - Q has the seven printed coefficients (cert:high-difference)',
      len(Pp) == 7 and tuple(diff) == tuple(printed['high_diff']), str(diff))
    c('4. the seven coefficients of P - Q are strictly positive', all(x > 0 for x in diff))
    d1 = dec('72.2') ** 2 - 4 * 33 * dec('44.8')
    d2 = dec('4.61') ** 2 - 4 * dec('17.9') * dec('.54')
    c('4. discriminants (72.2)^2 - 4(33)(44.8) = -17519/25 and (4.61)^2 - 4(17.9)(.54) = -174119/10000, leading coefficients > 0',
      d1 == Fraction(-17519, 25) and d2 == Fraction(-174119, 10000) and dec('44.8') > 0 and dec('.54') > 0)

    # 5. profile
    U, X, Y, E = profile(b_star, z_star)
    m0 = U[0][1]
    am2 = cabs2(m0)
    u = cdiv(U[0][0], m0)
    x = cdiv(X[1][1], m0)
    y = cdiv(Y[1][1], m0)
    c('5. 9 < |m_0| < 10', 81 < am2 < 100, '|m0|^2 = %.6f' % float(am2))
    c('5. U_00/m_0 in (2.835, 2.837) + i(1.426, 1.428)', dec('2.835') < u[0] < dec('2.837') and dec('1.426') < u[1] < dec('1.428'),
      '%.6f %+.6fi' % (float(u[0]), float(u[1])))
    c('5. |U_11/m_0| < 1e-12', cabs2(U[1][1]) < dec('1e-24') * am2)
    c('5. X_11/m_0 in (-.0811, -.0810) + i(.1361, .1363)', dec('-.0811') < x[0] < dec('-.0810') and dec('.1361') < x[1] < dec('.1363'),
      '%.6f %+.6fi' % (float(x[0]), float(x[1])))
    c('5. Y_11/m_0 in (-.0001, .0001) + i(.1237, .1240)', dec('-.0001') < y[0] < dec('.0001') and dec('.1237') < y[1] < dec('.1240'),
      '%.6f %+.6fi' % (float(y[0]), float(y[1])))
    c('5. max |X_ij/m_0|, max |Y_ij/m_0| < 20', all(cabs2(Mx[i][j]) < 400 * am2 for Mx in (X, Y) for i in range(2) for j in range(2)))
    c('5. delta^2 E < 50000 |m_0| delta^2 entrywise (the second-order remainder)', all(E[i][j] ** 2 < 50000 ** 2 * am2 for i in range(2) for j in range(2)),
      'max E = %.4g' % float(max(max(r) for r in E)))
    # second way: the exact bivariate product, independent of the majorant recurrence
    Mx, scale = profile_bivariate(b_star, z_star)
    lin_ok = all(Fraction(Mx[i][j].get((0, 0), (0, 0))[0], scale) == U[i][j][0]
                 and Fraction(Mx[i][j].get((0, 0), (0, 0))[1], scale) == U[i][j][1]
                 and tuple(Fraction(v, scale) / DELTA for v in Mx[i][j].get((1, 0), (0, 0))) == X[i][j]
                 and tuple(Fraction(v, scale) / DELTA for v in Mx[i][j].get((0, 1), (0, 0))) == Y[i][j]
                 for i in range(2) for j in range(2))
    c('5. SECOND WAY: the exact bivariate product reproduces U_0, X_0, Y_0 term by term', lin_ok)
    m0c = Mx[0][1][(0, 0)]
    remmax = max(sum(abs(r) + abs(im) for k, (r, im) in Mx[i][j].items() if k[0] + k[1] >= 2) for i in range(2) for j in range(2))
    # remainder <= remmax / scale for |e|, |f| <= 1 (a box containing the disk); compare with 50000 |m_0| delta^2
    c('5. SECOND WAY: the exact Taylor remainder of L over the box |b - b_*|, |Z - Z_*| <= delta is < 50000 |m_0| delta^2',
      Fraction(remmax) ** 2 < (50000 * DELTA ** 2) ** 2 * (m0c[0] ** 2 + m0c[1] ** 2),
      'remainder / (|m_0| delta^2) <= %.4g (the majorant E gives %.4g)'
      % (math.sqrt(float(Fraction(remmax) ** 2 / (DELTA ** 4 * (m0c[0] ** 2 + m0c[1] ** 2)))),
         float(max(max(r) for r in E)) / math.sqrt(float(am2))))
    bd = b_star + DELTA
    num = Fraction(1)
    for n in range(34):
        num *= (n * n + bd * bd) * ((n - 5) ** 2 + bd * bd)
    c('5. cert:profile-determinant: |det L|^2 <= prod (n^2 + (b_*+d)^2)((n-5)^2 + (b_*+d)^2)/(34!)^4 < (6.2e-12)^2 |m_0|^4',
      num / Fraction(math.factorial(34)) ** 4 < dec('6.2e-12') ** 2 * am2 ** 2)
    kap = dec('.048') ** 2
    ax2, ay2 = cabs2(x), cabs2(y)
    rexy = x[0] * y[0] + x[1] * y[1]
    c('5. Sylvester: |x|^2 > .048^2 and (|x|^2 - k)(|y|^2 - k) > (Re conj(x) y)^2: minimum stretch > .048',
      ax2 > kap and (ax2 - kap) * (ay2 - kap) > rexy ** 2)
    c('5. |1 - i Z_* u/5| > 2.34, |u| < 3.18, |x| < .159, |y| < .124 (cert:profile-extra)',
      cabs2((1 + z_star * u[1] / 5, -z_star * u[0] / 5)) > dec('2.34') ** 2 and cabs2(u) < dec('3.18') ** 2
      and ax2 < dec('.159') ** 2 and ay2 < dec('.124') ** 2)
    c('5. negative determinant of the linear map: Re x Im y - Im x Re y < 0 (also from the rectangles alone)',
      x[0] * y[1] - x[1] * y[0] < 0 and dec('-.0810') * dec('.1237') + dec('.1363') * dec('.0001') < 0)
    c('5. |L(eta, zeta)| <= delta (|x| + |y|) < (.159 + .124) delta = .283 delta (triangle inequality; also .159^2 + .124^2 < .283^2)',
      dec('.159') + dec('.124') == dec('.283') and dec('.159') ** 2 + dec('.124') ** 2 < dec('.283') ** 2)
    chi = 40 * DELTA + 50000 * DELTA ** 2
    v1 = (1 + (z_star + DELTA) / 5) * chi + dec('3.18') * DELTA / 5
    v2 = (z_star + DELTA) * chi / 5 + dec('3.18') * DELTA / 5
    gam = dec('2.34') - dec('3.18') * z_star / 5 - v1 - v2
    c('5. gamma > .6 and chi < 5e-7 (free:denominator-gap)', gam > dec('.6') and chi < dec('5e-7'), 'gamma = %s' % gam)
    ejet = (dec('1e-12') + 50000 * DELTA ** 2 + dec('.283') * DELTA * chi) / (1 - chi)
    etail = (2 * (z_star + DELTA) / 5) * dec('6.2e-12') / (dec('.6') * (1 - chi))
    c('5. cert:degree-comparisons: e_jet + e_tail < 2.5e-11, .283 delta + 2.5e-11 < 3e-9, .048 delta > 2.5e-11',
      ejet + etail < dec('2.5e-11') and dec('.283') * DELTA + dec('2.5e-11') < dec('3e-9') and dec('.048') * DELTA > dec('2.5e-11'),
      'e_jet + e_tail = %.6g' % float(ejet + etail))
    c('5. boundary margin 4.8e-10 - 2.5e-11 = 4.55e-10 (.048 delta = 4.8e-10)',
      dec('.048') * DELTA == dec('4.8e-10') and dec('4.8e-10') - dec('2.5e-11') == dec('4.55e-10'))
    value['gamma'] = str(gam)
    value['e_jet+e_tail'] = str(ejet + etail)

    # 6. exterior
    d27, c27 = exterior(dec('2.704'))
    d3, c3 = exterior(Fraction(3))
    lin = lambda z1, k: [[k * int(H0 ** 11 * z1), 0, 0], [k * H0 ** 11, 0, 0]]  # noqa: E731
    t1 = re_part(d27)
    t2 = eadd([[43 * r, 43 * i, 43 * e] for r, i, e in re_part(d27)],
              [[1000 * r, 1000 * i, 1000 * e] for r, i, e in eadd(re_part(c27), lin(dec('2.704'), 1130), -1)])
    t3 = eadd([[-r, -i, e] for r, i, e in im_part(c3)], lin(Fraction(3), 1130), -1)
    dg = printed['exterior_degrees']
    ext = (floor_min(t1, dg[0]), floor_min(t2, dg[1]), floor_min(t3, dg[2]))
    value['exterior_minima'] = ext
    c('6. cert:exterior-table: minima 288247, 17080, 31628 at truncation degrees 10, 10, 8', ext == tuple(printed['exterior']),
      'computed %s' % (ext,))
    c('6. the three truncated polynomials have every coefficient strictly positive', all(m >= 1 for m in ext)
      and all(T[j][0] - T[j][2] > 0 for T, top in ((t1, 10), (t2, 10), (t3, 8)) for j in range(top + 1)))
    de, ce = exterior(dec('2.704'), exact_b=True)
    c('6. consistency: at b = B/H0 without errors, deg d <= 10, Im d = 0, deg c <= 9 and deg Im c <= 8 (cert:exterior-degrees)',
      all(de[k][0] == 0 and de[k][1] == 0 for k in range(11, len(de))) and all(x[1] == 0 for x in de)
      and all(ce[k][0] == 0 and ce[k][1] == 0 for k in range(10, len(ce))) and all(ce[k][1] == 0 for k in range(9, len(ce))))
    prod = Fraction(1)
    for n in range(5):
        prod *= (n * n + dec('.335') ** 2) * ((n - 5) ** 2 + dec('.335') ** 2)
    c('6. 0 < b < .335 on the disk and prod_{n<5} (n^2 + .335^2)((n-5)^2 + .335^2) < 1130^2 (cert:exterior-determinant)',
      b_star - DELTA > 0 and b_star + DELTA < dec('.335') and prod < 1130 ** 2, '%.1f' % float(prod))
    c('6. all Z in the disk exceed 2.704 (free.tex:708)', z_star - DELTA > dec('2.704'))

    # the release's recorded output (RESULTS.json, read as data after this decider ran): its numbers against ours
    import json
    rj = json.loads(src.text(RESULTS))
    fr = lambda o: Fraction(o['numerator'], o['denominator'])  # noqa: E731
    seps = rj['separators']['rows']
    sym = {(1, 1): '++', (-1, 1): '-+', (-1, -1): '--', (1, -1): '+-'}
    ok_rows = all(seps[l]['minimum_signed_margin'] == margins[l]
                  and seps[l]['q_over_100'] == [0] + printed['qlists'][l] + [7500]
                  and seps[l]['positive_root_brackets_R_I'] == [br_R[l][0], br_I[l][0]]
                  and seps[l]['negative_root_brackets_R_I'] == [br_R[l][1], br_I[l][1]] for l in range(4))
    start_ok = all(seps[l]['positive_argument_signs'][0] == sym[tuple(printed['start'][l])] for l in range(4))
    c('R. RESULTS.json agrees: boundary minima, exterior minima, separator margins, q lists, brackets, starting signs',
      [tuple(r) for r in rj['k8_boundary']['interval_ratio_minima']] == [table[l] for l in range(4)]
      and tuple(rj['k5_exterior']['interval_ratio_minima']) == ext and ok_rows and start_ok, kind='bound')
    ha = rj['high_angular']
    c('R. RESULTS.json agrees: P(t) coefficients, P - Q, Q, discriminants, 143/800, 587/1000, M/2 - Z lower bound',
      [fr(o) for o in ha['lower_bound_coefficients']] == Pp and [fr(o) for o in ha['difference_coefficients_all_strictly_positive']] == diff
      and [fr(o) for o in ha['comparison_coefficients']] == Qp and [fr(o) for o in ha['quadratic_discriminants_both_strictly_negative']] == [d1, d2]
      and fr(ha['arc_potential_lower_bound']) == Fraction(143, 800) and fr(ha['join_jump_lower_bound']) == Fraction(587, 1000)
      and fr(ha['boundary_coefficient_lower_bound']) == Fraction(9, 2) - z_star - DELTA, kind='bound')
    kp = rj['k34_profile']
    c('R. RESULTS.json agrees: gamma, e_jet + e_tail, 2.5e-11, 4.55e-10; the exterior determinant bound and 1130^2',
      fr(kp['uniform_denominator_gap_lower_bound']) == gam and fr(kp['conservative_j_linearization_error']) == ejet + etail
      and fr(kp['j_linearization_error_comparison']) == dec('2.5e-11') and fr(kp['boundary_degree_margin_lower_bound']) == dec('4.55e-10')
      and fr(rj['k5_exterior']['determinant_squared_upper_bound']) == prod and rj['k5_exterior']['determinant_squared_comparison'] == 1130 ** 2,
      kind='bound')

    ok = all(x_['pass'] for x_ in checks)
    verdict = 'CERTIFIED' if ok else ('REFUTED' if claim_fail else 'REFUSED')
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: every finite comparison of Appendix cert:arithmetic (integer box, '
                       'boundary-form positivity, winding sign table and margins, high-angular polynomial, profile '
                       'enclosures and degree comparisons, exterior positivity), and the low-angular counts 2,1,0,0 '
                       'for P_l by Routh-Hurwitz; NOT Proposition free:main itself nor the blowup theorem, which rest '
                       'on the analytic lemmas of Section sec:free'}


def forge():
    out = []
    pr = dict(PRINTED)
    pr['boundary'] = dict(PRINTED['boundary'])
    pr['boundary'][2] = (5, 13, 323)
    out.append(('the l = 2, (0,1,1) boundary minimum printed as 5', decide(printed=pr)['verdict']))
    pr = dict(PRINTED)
    hd = list(PRINTED['high_diff'])
    hd[2] = hd[2] + Fraction(1, 200000000000)
    pr['high_diff'] = tuple(hd)
    out.append(('the third P - Q coefficient changed in its last digit', decide(printed=pr)['verdict']))
    out.append(('the disk centre b_* moved by 1e-6 (outside the integer box)', decide(b_star=B_STAR + dec('1e-6'))['verdict']))
    pr = dict(PRINTED)
    pr['start'] = dict(PRINTED['start'])
    pr['start'][0] = (1, 1)
    out.append(('the l = 0 sign table printed as starting at ++', decide(printed=pr)['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1, default=str))
    for c_ in res['checks']:
        print(('PASS ' if c_['pass'] else 'FAIL ') + c_['check'], c_['detail'])
    print('sources', json.dumps(res['sources'], indent=1))
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t))
