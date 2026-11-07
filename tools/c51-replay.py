#!/usr/bin/env python3
"""c51-replay.py -- the Python half of the C51 replay (teorth/optimizationproblems PR #184, row [R2026b]).

The claim: C51 >= 0.5850788196744, from beta(f_{K,eps}) = 1/max_theta |P(theta)| (He-Tang, arXiv:2602.12217,
Theorem 2.8 with Lemma 3.1, READ, not decided here), with

    P(theta) = 2 sum_{n>=0} K^{-T_n} e^{i alpha T_n} cos((2n+1) theta),   T_n = n(n+1)/2,

K = 3.5681854310698435 and alpha = 3.9615431126097391 exact. Decided: max|P| <= 1/0.5850788196744 on the whole circle,
infinite tail included. Pre-registered in notes/c51-replay-preregistration-2026-11-07.md before this file existed.

Written from the paper and the PR's prose only. The certificate repository's scripts and arhancanli's replay code were
never read or run. Shares no code with tools/c51-replay.js (the JavaScript half, which writes the record).

Method (pre-registered): an adaptive interval branch-and-bound on theta in [0, U], U = 1609/1024 >= pi/2 (proved
from a rigorous pi), using |P(-t)| = |P(t)| and P(pi - t) = -P(t). Binary fixed-point intervals at 2^-PREC with
outward rounding; truncation at N = 14 with the exact rational tail tau_N = 2K^{-T_{N+1}}/(1 - K^{-(N+2)}). On a cell
[a, b] with midpoint m and radius r the bound on F = |P_N|^2 is the mean-value form F(m) + r max|F'(cell)|, with F'
enclosed over the cell by its natural interval extension (cos((2n+1)t), sin((2n+1)t) on the cell = the midpoint value
+- (2n+1) r), and the monotonicity test (F'(cell) excludes 0: the maximum is at an endpoint, evaluated there).
cos, sin by Taylor series with a Lagrange remainder at the point; e^{i alpha T_n} as products of powers of e^{i alpha};
e^{i(2n+1)t} as powers of e^{it}: nothing is reduced modulo 2 pi. pi from Euler's arctan(1/2) + arctan(1/3).

usage: python3 -I tools/c51-replay.py    every row, control and self-test; one JSON object on stdout (~1 min)
MIT
"""
import sys
import json
import time
import math
import heapq
import random
from fractions import Fraction as Fr

PREC = 320
N_MAIN = 14
U_MAIN = Fr(1609, 1024)
MAX_DEPTH = 64
BUDGET = 400000
TOL_F = Fr(1, 10 ** 32)

# The parameter sets, as the PR (and, for R2026b, the pinned data file) print them. Exact rationals.
PARAMS = {
    'R2026b': ('3.5681854310698435', '3.9615431126097391'),
    'S2026': ('3.568182317714', '3.961543335688'),
    'HT2026': ('7137/2000', '198074929/50000000'),
}
CLAIM = '0.5850788196744'
PRINTED_MAX = '1.709171425067816128872617735945'
NOTE_BETA_OLD_UPPER = '0.585078819653352950854632621542'
HT_MESH_PRINTED = '1.709176397414741464507875'
HT_MESH_J, HT_MESH_M, HT_MESH_N = 1794536, 2000000, 5


class Refusal(Exception):
    pass


def T(n):
    return n * (n + 1) // 2


def tail(K, N):
    """2 sum_{n>N} K^{-T_n} <= 2 K^{-T_{N+1}} / (1 - K^{-(N+2)}), exact."""
    return 2 / K ** T(N + 1) / (1 - 1 / K ** (N + 2))


def pi_euler(terms=220):
    """pi = 4 (arctan(1/2) + arctan(1/3)); alternating partial sums, the remainder below the next term."""
    lo = hi = Fr(0)
    for q in (2, 3):
        s = Fr(0)
        for k in range(terms):
            s += Fr((-1) ** k, (2 * k + 1) * q ** (2 * k + 1))
        nxt = Fr(1, (2 * terms + 1) * q ** (2 * terms + 1))
        lo += s - nxt
        hi += s + nxt
    return 4 * lo, 4 * hi


class Ar:
    """Binary fixed-point intervals: (lo, hi) integers meaning [lo 2^-p, hi 2^-p]; every result rounded outward."""

    def __init__(self, p):
        self.p = p
        self.one = 1 << p

    def fr(self, f):
        f = Fr(f)
        n, d = f.numerator, f.denominator
        return ((n << self.p) // d, -(((-n) << self.p) // d))

    def lo_fr(self, f):
        f = Fr(f)
        return (f.numerator << self.p) // f.denominator

    def hi_fr(self, f):
        f = Fr(f)
        return -(((-f.numerator) << self.p) // f.denominator)

    def to_fr(self, x):
        return Fr(x, self.one)

    @staticmethod
    def add(a, b):
        return (a[0] + b[0], a[1] + b[1])

    @staticmethod
    def sub(a, b):
        return (a[0] - b[1], a[1] - b[0])

    @staticmethod
    def neg(a):
        return (-a[1], -a[0])

    def mul(self, a, b):
        x0, x1, x2, x3 = a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]
        p = self.p
        return (min(x0, x1, x2, x3) >> p, -((-max(x0, x1, x2, x3)) >> p))

    def sqr(self, a):
        p = self.p
        l, h = a
        if l >= 0:
            return ((l * l) >> p, -((-(h * h)) >> p))
        if h <= 0:
            return ((h * h) >> p, -((-(l * l)) >> p))
        return (0, -((-max(l * l, h * h)) >> p))

    @staticmethod
    def muli(a, k):
        return (a[0] * k, a[1] * k) if k >= 0 else (a[1] * k, a[0] * k)

    def clamp1(self, a):
        o = self.one
        lo, hi = max(a[0], -o), min(a[1], o)
        if lo > hi:
            raise AssertionError('an enclosure of a cosine left [-1, 1]')
        return (lo, hi)

    def cmul(self, x, y):
        return (self.sub(self.mul(x[0], y[0]), self.mul(x[1], y[1])),
                self.add(self.mul(x[0], y[1]), self.mul(x[1], y[0])))

    def cossin(self, x):
        """Enclosures of (cos x, sin x) for every x in the interval x: the Taylor polynomials evaluated in interval
        arithmetic, plus the Lagrange remainder |x|^{2k}/(2k)! (cos) and |x|^{2k+1}/(2k+1)! (sin)."""
        p, one = self.p, self.one
        X = max(abs(x[0]), abs(x[1]))
        x2 = self.sqr(x)
        X2 = -((-(X * X)) >> p)
        c, s, tc, ts = (one, one), x, (one, one), x
        uc, us = one, X
        k = 0
        while True:
            k += 1
            uc = -((-(uc * X2)) // (((2 * k - 1) * (2 * k)) << p))
            us = -((-(us * X2)) // (((2 * k) * (2 * k + 1)) << p))
            if uc <= 1 and us <= 1:
                break
            if k > 4000:
                raise Refusal('the Taylor series did not converge within 4000 terms')
            d1, d2 = (2 * k - 1) * (2 * k), (2 * k) * (2 * k + 1)
            m = self.mul(tc, x2)
            tc = self.neg((m[0] // d1, -((-m[1]) // d1)))
            m = self.mul(ts, x2)
            ts = self.neg((m[0] // d2, -((-m[1]) // d2)))
            c = self.add(c, tc)
            s = self.add(s, ts)
        c = (c[0] - uc, c[1] + uc)
        s = (s[0] - us, s[1] + us)
        return (self.clamp1(c), self.clamp1(s))


class Fn:
    """P_N for one parameter set: the coefficients c_n = K^{-T_n} e^{i alpha T_n}, n = 0..N, as complex intervals."""

    def __init__(self, ar, K, alpha, N):
        self.ar, self.K, self.alpha, self.N = ar, Fr(K), Fr(alpha), N
        self.tau = tail(self.K, N)
        w = ar.cossin(ar.fr(self.alpha))
        one = ar.one
        E = ((one, one), (0, 0))
        W = ((one, one), (0, 0))
        self.c = []
        for n in range(N + 1):
            if n >= 1:
                W = ar.cmul(W, w)
                E = ar.cmul(E, W)
            kap = ar.fr(1 / self.K ** T(n))
            self.c.append((ar.mul(kap, E[0]), ar.mul(kap, E[1])))
        self.cache = {}

    def point(self, th):
        """At the interval th: F = |P_N|^2, F' = d/dt F, and the enclosures of cos((2n+1)t), sin((2n+1)t)."""
        ar = self.ar
        z = ar.cossin(th)
        z2 = ar.cmul(z, z)
        Z = z
        PR = PI = DR = DI = (0, 0)
        Cs, Ss = [], []
        for n, (cr, ci) in enumerate(self.c):
            C, S = ar.clamp1(Z[0]), ar.clamp1(Z[1])
            Cs.append(C)
            Ss.append(S)
            PR = ar.add(PR, ar.mul(cr, C))
            PI = ar.add(PI, ar.mul(ci, C))
            DR = ar.sub(DR, ar.muli(ar.mul(cr, S), 2 * n + 1))
            DI = ar.sub(DI, ar.muli(ar.mul(ci, S), 2 * n + 1))
            Z = ar.cmul(Z, z2)
        PR, PI, DR, DI = ar.muli(PR, 2), ar.muli(PI, 2), ar.muli(DR, 2), ar.muli(DI, 2)
        F = ar.add(ar.sqr(PR), ar.sqr(PI))
        Fd = ar.muli(ar.add(ar.mul(DR, PR), ar.mul(DI, PI)), 2)
        return F, Fd, Cs, Ss

    def F_at(self, t):
        """F at the exact fixed-point theta t (an integer), cached."""
        v = self.cache.get(t)
        if v is None:
            v = self.point((t, t))[0]
            if len(self.cache) < 200000:
                self.cache[t] = v
        return v

    def cell(self, a, b):
        """Upper bound on F_N over [a, b] (exact fixed-point endpoints), the midpoint and F there."""
        ar = self.ar
        if (a + b) & 1:
            raise Refusal('working precision exhausted: a cell midpoint is not representable')
        m, r = (a + b) >> 1, (b - a) >> 1
        F, Fd, Cs, Ss = self.point((m, m))
        PR = PI = DR = DI = (0, 0)
        for n, (cr, ci) in enumerate(self.c):
            w = (2 * n + 1) * r
            C = ar.clamp1((Cs[n][0] - w, Cs[n][1] + w))
            S = ar.clamp1((Ss[n][0] - w, Ss[n][1] + w))
            PR = ar.add(PR, ar.mul(cr, C))
            PI = ar.add(PI, ar.mul(ci, C))
            DR = ar.sub(DR, ar.muli(ar.mul(cr, S), 2 * n + 1))
            DI = ar.sub(DI, ar.muli(ar.mul(ci, S), 2 * n + 1))
        PR, PI, DR, DI = ar.muli(PR, 2), ar.muli(PI, 2), ar.muli(DR, 2), ar.muli(DI, 2)
        Fdc = ar.muli(ar.add(ar.mul(DR, PR), ar.mul(DI, PI)), 2)
        g = max(-Fdc[0], Fdc[1], 0)
        ub = F[1] + (-((-(g * r)) >> ar.p))
        how = 'mean-value'
        if Fdc[0] > 0:
            e = self.F_at(b)[1]
            if e < ub:
                ub, how = e, 'monotone'
        elif Fdc[1] < 0:
            e = self.F_at(a)[1]
            if e < ub:
                ub, how = e, 'monotone'
        return ub, m, F, how


def pi_check(U, pi):
    return 2 * U >= pi[1]


def coverage(leaves, U_int):
    """The accepted cells, sorted, are contiguous from 0 to U."""
    if not leaves:
        return False, 'no cells'
    s = sorted(leaves)
    if s[0][0] != 0:
        return False, 'the cover does not start at 0'
    for (a0, b0), (a1, b1) in zip(s, s[1:]):
        if a1 != b0:
            return False, 'a gap or overlap at a cell edge'
    if s[-1][1] != U_int:
        return False, 'the cover does not end at U'
    return True, 'contiguous'


def decide(fn, a_claim, U, pi, max_depth=MAX_DEPTH, budget=BUDGET, drop_leaf=False):
    """A <= a_claim? CERTIFIED / REFUTED (witness) / REFUSED, with the counts."""
    ar = fn.ar
    a_claim = Fr(a_claim)
    U_int = ar.lo_fr(U)
    if ar.to_fr(U_int) != U:
        return {'verdict': 'REFUSED', 'why': 'U is not representable at this precision'}
    if a_claim <= fn.tau:
        return {'verdict': 'REFUSED', 'why': 'the tail bound exceeds the claim'}
    tcert = ar.lo_fr((a_claim - fn.tau) ** 2)
    tref = ar.hi_fr((a_claim + fn.tau) ** 2)
    stack = [(0, U_int, 0)]
    leaves = []
    nodes, deepest, monotone = 0, 0, 0
    try:
        while stack:
            a, b, d = stack.pop()
            nodes += 1
            deepest = max(deepest, d)
            if nodes > budget:
                return {'verdict': 'REFUSED', 'why': 'cell budget exhausted', 'cells': nodes, 'depth': deepest}
            ub, m, F, how = fn.cell(a, b)
            if ub <= tcert:
                leaves.append((a, b))
                monotone += how == 'monotone'
                continue
            if F[0] > tref:
                th = ar.to_fr(m)
                return {'verdict': 'REFUTED', 'why': 'a witness theta with |P_N| - tau above the claim',
                        'witnessTheta': dec(th, 30, 'floor'), 'cells': nodes, 'depth': deepest,
                        'excessF': dec(ar.to_fr(F[0]) - Fr((a_claim + fn.tau) ** 2), 6, 'floor', sci=True)}
            if d >= max_depth:
                return {'verdict': 'REFUSED', 'why': 'depth budget exhausted', 'cells': nodes, 'depth': deepest}
            stack.append((m, b, d + 1))
            stack.append((a, m, d + 1))
    except Refusal as e:
        return {'verdict': 'REFUSED', 'why': str(e), 'cells': nodes, 'depth': deepest}
    if drop_leaf:
        leaves.pop(len(leaves) // 2)
    ok, why = coverage(leaves, U_int)
    if not ok:
        return {'verdict': 'REFUSED', 'why': 'coverage check: ' + why, 'cells': nodes, 'leaves': len(leaves)}
    if not pi_check(U, pi):
        return {'verdict': 'REFUSED', 'why': 'coverage check: 2U < upper end of pi, [0, U] may miss [0, pi/2]',
                'cells': nodes, 'leaves': len(leaves), 'U': str(U)}
    return {'verdict': 'CERTIFIED', 'cells': nodes, 'leaves': len(leaves), 'depth': deepest,
            'monotoneLeaves': monotone}


def sqrt_lo(ar, x):
    return math.isqrt(max(x, 0) << ar.p)


def sqrt_hi(ar, x):
    v = max(x, 0) << ar.p
    s = math.isqrt(v)
    return s if s * s == v else s + 1


def enclose(fn, U, budget=BUDGET, tol=TOL_F):
    """Best-first: max F_N in [L, top]; then A in [sqrt(L) - tau, sqrt(top) + tau] and where the maximum lies."""
    ar = fn.ar
    U_int = ar.lo_fr(U)
    tol_i = ar.hi_fr(tol)
    ub, m, F, _ = fn.cell(0, U_int)
    L, Larg = F[0], m
    heap = [(-ub, 0, U_int, 0)]
    nodes, deepest = 1, 0
    while True:
        nub, a, b, d = heapq.heappop(heap)
        top = -nub
        if top - L <= tol_i:
            heapq.heappush(heap, (nub, a, b, d))
            break
        if nodes > budget:
            raise Refusal('enclosure budget exhausted')
        mid = (a + b) >> 1
        for (x, y) in ((a, mid), (mid, b)):
            u, mm, FF, _ = fn.cell(x, y)
            nodes += 1
            deepest = max(deepest, d + 1)
            if FF[0] > L:
                L, Larg = FF[0], mm
            if u >= L:
                heapq.heappush(heap, (-u, x, y, d + 1))
    top = -heap[0][0]
    surv = sorted((a, b) for (nu, a, b, d) in heap if -nu >= L)
    near = ar.hi_fr(Fr(1, 10 ** 9))
    clusters = []
    for a, b in surv:
        if clusters and a - clusters[-1][1] <= near:
            clusters[-1][1] = max(clusters[-1][1], b)
            clusters[-1][2] += 1
        else:
            clusters.append([a, b, 1])
    tau = fn.tau
    A_lo = Fr(sqrt_lo(ar, L), ar.one) - tau
    A_hi = Fr(sqrt_hi(ar, top), ar.one) + tau
    return {'A_lo': A_lo, 'A_hi': A_hi, 'cells': nodes, 'depth': deepest, 'theta': ar.to_fr(Larg),
            'clusters': [(ar.to_fr(a), ar.to_fr(b), k) for a, b, k in clusters], 'Ltop': (L, top),
            'x': ar.sqr(ar.cossin((Larg, Larg))[0])}


def dec(x, digits, mode, sci=False):
    """A Fraction as a decimal string rounded in the stated direction (never a truncated upper end)."""
    x = Fr(x)
    if sci:
        if x == 0:
            return '0'
        e = math.floor(math.log10(abs(float(x)))) if abs(float(x)) > 0 else -400
        while abs(x) >= Fr(10) ** (e + 1):
            e += 1
        while abs(x) < Fr(10) ** e:
            e -= 1
        mant = x / Fr(10) ** e
        return dec(mant, digits, mode) + 'e' + str(e)
    s = x * 10 ** digits
    n = math.floor(s) if mode == 'floor' else math.ceil(s)
    sign = '-' if n < 0 else ''
    n = abs(n)
    ip, fp = divmod(n, 10 ** digits)
    return sign + str(ip) + ('.' + str(fp).rjust(digits, '0') if digits else '')


def summary(e, digits=30):
    A_lo, A_hi = e['A_lo'], e['A_hi']
    return {
        'A': [dec(A_lo, digits, 'floor'), dec(A_hi, digits, 'ceil')],
        'beta': [dec(1 / A_hi, digits, 'floor'), dec(1 / A_lo, digits, 'ceil')],
        'width': dec(A_hi - A_lo, 3, 'ceil', sci=True),
        'argmaxTheta': dec(e['theta'], 12, 'floor'),
        'maximizerIn': [{'theta': [dec(a, 12, 'floor'), dec(b, 12, 'ceil')], 'cells': k} for a, b, k in e['clusters']],
        'cos2AtArgmax': dec(Fr(e['x'][0], 1 << PREC), 10, 'floor'),
        'cells': e['cells'], 'depth': e['depth'],
    }


def selftests(ar, pi, fn):
    out = {}
    PI50 = Fr('3.14159265358979323846264338327950288419716939937510')
    out['piEulerContainsPublished50'] = pi[0] <= PI50 + Fr(1, 10 ** 50) and PI50 - Fr(1, 10 ** 50) <= pi[1]
    out['piWidth'] = dec(pi[1] - pi[0], 2, 'ceil', sci=True)
    piI = (ar.lo_fr(pi[0]), ar.hi_fr(pi[1]))
    half = ar.fr(Fr(1, 2))
    c3, s3 = ar.cossin((piI[0] // 3, -((-piI[1]) // 3)))
    c6, s6 = ar.cossin((piI[0] // 6, -((-piI[1]) // 6)))
    out['cosPiOver3ContainsHalf'] = c3[0] <= half[0] and half[1] <= c3[1]
    out['sinPiOver6ContainsHalf'] = s6[0] <= half[0] and half[1] <= s6[1]
    rng = random.Random(51)
    ok_py, ok_dbl, ok_sym, ok_cell, ok_fd = True, True, True, True, True
    one = ar.one
    for _ in range(60):
        x = rng.randrange(-4 * one, 4 * one)
        c, s = ar.cossin((x, x))
        n2 = ar.add(ar.sqr(c), ar.sqr(s))
        ok_py &= n2[0] <= one <= n2[1]
        c2, s2 = ar.cossin((2 * x, 2 * x))
        dbl = ar.sub(ar.muli(ar.sqr(c), 2), (one, one))
        ok_dbl &= max(c2[0], dbl[0]) <= min(c2[1], dbl[1])
        t = abs(x) % (piI[0] >> 1)
        Ft = fn.point((t, t))[0]
        Fm = fn.point((-t, -t))[0]
        pt = ar.sub(piI, (t, t))
        Fp = fn.point(pt)[0]
        ok_sym &= max(Ft[0], Fm[0], Fp[0]) <= min(Ft[1], Fm[1], Fp[1])
    U_int = ar.lo_fr(U_MAIN)
    for _ in range(40):
        a = rng.randrange(0, U_int - (U_int >> 6))
        a -= a & 1
        w = rng.choice([U_int >> 8, U_int >> 14, U_int >> 22])
        b = a + w
        ub, m, F, how = fn.cell(a, b)
        for _ in range(9):
            t = rng.randrange(a, b + 1)
            ok_cell &= fn.point((t, t))[0][0] <= ub
    for _ in range(10):
        m = rng.randrange(1, U_int)
        h = one >> 30
        Fd = fn.point((m, m))[1]
        cd = Fr(fn.point((m + h, m + h))[0][0] - fn.point((m - h, m - h))[0][1], 2 * h)
        ok_fd &= abs(cd - ar.to_fr(Fd[0])) < Fr(1, 10 ** 15)
    out['cos2PlusSin2Contains1'] = ok_py
    out['doubleAngle'] = ok_dbl
    out['symmetries'] = ok_sym
    out['cellBoundAboveSamples'] = ok_cell
    out['derivativeVsCentralDifference'] = ok_fd
    K = fn.K
    nxt = 2 * sum(1 / K ** T(n) for n in range(fn.N + 1, fn.N + 41))
    out['tailAboveNext40Terms'] = fn.tau >= nxt
    return out


def main():
    t0 = time.time()
    ar = Ar(PREC)
    pi = pi_euler()
    b0 = Fr(CLAIM)
    res = {'impl': 'python', 'python': sys.version.split()[0], 'prec': PREC, 'N': N_MAIN, 'U': str(U_MAIN),
           'params': PARAMS, 'claim': CLAIM, 'pi': [dec(pi[0], 40, 'floor'), dec(pi[1], 40, 'ceil')]}
    fn = {k: Fn(ar, Fr(v[0]), Fr(v[1]), N_MAIN) for k, v in PARAMS.items()}
    res['tau'] = dec(fn['R2026b'].tau, 3, 'ceil', sci=True)
    rows = {}
    rows['R1'] = decide(fn['R2026b'], 1 / b0, U_MAIN, pi)
    rows['R2'] = decide(fn['R2026b'], Fr(PRINTED_MAX), U_MAIN, pi)
    # the enclosure, the localization, |P(0)|
    E = enclose(fn['R2026b'], U_MAIN)
    S = summary(E)
    F0 = fn['R2026b'].F_at(0)
    tau = fn['R2026b'].tau
    P0 = (Fr(sqrt_lo(ar, F0[0]), ar.one) - tau, Fr(sqrt_hi(ar, F0[1]), ar.one) + tau)
    gap_lo = E['A_lo'] - P0[1]
    gap_hi = E['A_hi'] - P0[0]
    S['absP0'] = [dec(P0[0], 30, 'floor'), dec(P0[1], 30, 'ceil')]
    S['maxMinusAbsP0'] = [dec(gap_lo, 4, 'floor', sci=True), dec(gap_hi, 4, 'ceil', sci=True)]
    S['interiorMaximumProved'] = gap_lo > 0
    rows['R1']['marginBeta'] = dec(1 / E['A_hi'] - b0, 4, 'floor', sci=True)
    rows['R1']['marginA'] = dec(1 / b0 - E['A_hi'], 4, 'floor', sci=True)
    res['enclosure'] = S
    ctl = {}
    beta_lo, beta_hi = 1 / E['A_hi'], 1 / E['A_lo']
    b_up = Fr(math.ceil(beta_hi * 10 ** 13), 10 ** 13)
    b_dn = Fr(math.floor(beta_lo * 10 ** 13), 10 ** 13)
    ctl['C1a'] = dict(decide(fn['R2026b'], 1 / b_up, U_MAIN, pi), claim=dec(b_up, 13, 'floor'))
    ctl['C1b'] = dict(decide(fn['R2026b'], 1 / b_dn, U_MAIN, pi), claim=dec(b_dn, 13, 'floor'))
    fa = Fn(ar, Fr(PARAMS['R2026b'][0]), Fr(PARAMS['R2026b'][1]) + Fr(1, 10 ** 6), N_MAIN)
    ctl['C2'] = decide(fa, 1 / b0, U_MAIN, pi)
    ctl['C2']['enclosure'] = summary(enclose(fa, U_MAIN, tol=Fr(1, 10 ** 24)), 20)
    ctl['C3a'] = decide(fn['S2026'], 1 / b0, U_MAIN, pi)
    ctl['C3b'] = dict(decide(fn['S2026'], 1 / Fr('0.585078819653'), U_MAIN, pi), claim='0.585078819653')
    Eo = enclose(fn['S2026'], U_MAIN)
    So = summary(Eo)
    So['belowNoteUpper'] = 1 / Eo['A_hi'] <= Fr(NOTE_BETA_OLD_UPPER)
    So['betaLoBelowNoteUpper'] = 1 / Eo['A_hi'] <= Fr(NOTE_BETA_OLD_UPPER)
    So['betaHiBelowNoteUpper'] = 1 / Eo['A_lo'] <= Fr(NOTE_BETA_OLD_UPPER)
    ctl['C3c'] = So
    ctl['C4a'] = dict(decide(fn['HT2026'], 1 / Fr('0.58507'), U_MAIN, pi), claim='0.58507')
    ctl['C4b'] = dict(decide(fn['HT2026'], 1 / Fr('0.5850724'), U_MAIN, pi), claim='0.5850724')
    ctl['C4b']['enclosure'] = summary(enclose(fn['HT2026'], U_MAIN, tol=Fr(1, 10 ** 24)), 20)
    ht5 = Fn(ar, Fr(PARAMS['HT2026'][0]), Fr(PARAMS['HT2026'][1]), HT_MESH_N)
    q = Fr(2 * HT_MESH_J, HT_MESH_M)
    th = (ar.lo_fr(pi[0] * q), ar.hi_fr(pi[1] * q))
    Fm = ht5.point(th)[0]
    v = (Fr(sqrt_lo(ar, Fm[0]), ar.one), Fr(sqrt_hi(ar, Fm[1]), ar.one))
    printed = Fr(HT_MESH_PRINTED)
    ctl['C4c'] = {'absP5': [dec(v[0], 30, 'floor'), dec(v[1], 30, 'ceil')], 'printed': HT_MESH_PRINTED,
                  'agreesToPrintedDigits': printed - Fr(1, 10 ** 24) <= v[0] and v[1] <= printed + Fr(1, 10 ** 24),
                  'sameFirst25Digits': dec(v[0], 24, 'floor') == HT_MESH_PRINTED == dec(v[1], 24, 'floor')}
    ctl['C5a'] = decide(fn['R2026b'], 1 / b0, Fr(3, 2), pi)
    ctl['C5b'] = decide(fn['R2026b'], 1 / b0, U_MAIN, pi, drop_leaf=True)
    f2 = Fn(ar, Fr(PARAMS['R2026b'][0]), Fr(PARAMS['R2026b'][1]), 2)
    ctl['C6'] = dict(decide(f2, 1 / b0, U_MAIN, pi), tau=dec(f2.tau, 4, 'ceil', sci=True))
    ar32 = Ar(32)
    f32 = Fn(ar32, Fr(PARAMS['R2026b'][0]), Fr(PARAMS['R2026b'][1]), N_MAIN)
    ctl['C7'] = decide(f32, 1 / b0, U_MAIN, pi)
    ctl['C8a'] = decide(fn['R2026b'], E['A_lo'] - Fr(1, 10 ** 25), U_MAIN, pi)
    ctl['C8b'] = decide(fn['R2026b'], E['A_hi'] + Fr(1, 10 ** 25), U_MAIN, pi)
    res['rows'] = rows
    res['controls'] = ctl
    res['selftests'] = selftests(ar, pi, fn['R2026b'])
    res['seconds'] = round(time.time() - t0, 1)
    json.dump(res, sys.stdout, indent=1)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
