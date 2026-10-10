"""F-605 -- "The Kervaire invariant problem at the prime three" (openai/math family 309).

THE CLAIM (build/sections/introduction.tex:1-2 and 24-30, Theorem thm:classification): at the prime three
K = K_3 = {0, 2, 3}: the standard Kervaire classes b_j survive exactly at j = 0, 2, 3, each surviving coset contains
an element of additive order three, in particular there is an order-three Kervaire element in stem 322.  Its finite
input is Lemma finite:main (sections/finite.tex:206-222), proved from F_3 cochain computations specified by the
recurrence of Appendix app:recurrence (sections/recurrence.tex) and printed only as tables: finite:low-ranks
(finite.tex:218-229), finite:affine-ranks (324-336), finite:enclosures (398-414), the span dimensions (418-424),
finite:cancellation-data (601-611), finite:injection-data, finite:product-ranks, and the checkpoints of Proposition
alg:table-verification and Remark (recurrence.tex:752-879).  No code or data is published.

WHAT IS DECIDED HERE (exact: Fraction for the integral recursion, residues mod 3 and mod 9 after it -- every rational
coefficient is checked to have denominator prime to 3 before reduction; ranks over F_3 by elimination):
  S. The Hazewinkel structure constants from the paper's recursion (alg:logarithms, alg:right-unit, alg:coproduct),
     computed in Q[v_1..v_3, t_1..t_3, s_1..s_3] for n <= 3 (w_3 = 13 <= 27 < 40 = w_4): the printed
     eta_R(v_1), eta_R(v_2) modulo 3 and modulo 9 (recurrence.tex:55-60, finite.tex:107-110), and the integrality at 3
     of R_1..R_3, D_1..D_3.
  C. The ordinary normalized cobar complex of (B, BP_*BP/3), B = F_3[v_1, v_2, ...], written by this decider:
     cochains a [t^T_1 | ... | t^T_s] with every T_i != 0, coefficients leftmost; d = sum_i (-1)^i d^i with d^0 the
     right unit, d^i the coproduct in slot i, d^{s+1} = x (x) 1, every coefficient that lands inside a tensor moved
     to the far left by iterated right units (this is where eta_R(v_2), eta_R(v_3) enter).  Checked: every image is
     normalized, and d o d = 0 on all of C^0, C^1 at weight 27, C^2 at weight 14 and C^5 at weight 10 -- an internal
     test of the structure constants and of the convention.
  K. The checkpoints the paper prints for that complex (Remark, recurrence.tex:863-879) and the rows of Table
     finite:low-ranks they confirm: in weight 27 the dimensions 12 and 470 in filtrations 0 and 1, incoming and
     outgoing ranks 11 and 456, so D_{1,27} has dimension 3, spanned by v^26 a, y, t_7' (appending them raises the
     incoming rank 11 -> 14), whose t_1^27 coefficients are 0, 1, 0; at (6,10) the middle dimension 253, ranks 162 and
     90, so D_{6,10} = F_3, spanned by v b^3 (appending raises the rank by one).  The named one-cocycles h, r, s', y,
     t_4', t_7' (finite.tex:122-139) are computed as delta_m(q) after reduction, checked divisible, checked cocycles,
     with the printed bidegrees; the identity delta_9(v_2^9) = y + t_7' and (v_2+v_1w)^9 - v_2^9 = v_1^9 w^9 mod 3;
     the Bocksteins b = B(h), c' = B(r), P = a B(t_4') from mod-9 lifts (alg:bockstein), b equal to the printed
     t_1^2|t_1 + t_1|t_1^2 - v t_1|t_1 (alg:b-sign-check), all cocycles with bidegrees (2,3), (2,9), (3,16).
  R. The cochain dimensions of the paper's smaller resolution, which are pure combinatorics of its generators
     (alg:generators, alg:cochain-basis): (12,49,94) at (1,27), (3,2,1) at (6,10), (9301,11419,12864) at (6,81) -- by
     direct enumeration and, a second way, from the printed generating function (alg:dimension-series); and Table
     finite:low-ranks's internal arithmetic (n - r_- - r = 3, 1 equal to the cohomology found in K; r_C - r_- = |C|).
  G. The grid sizes (|G_60| = 1213, |G_92| = 2269 slots), the cancellation degree table (u, p, z, z + R = m,
     |P| + R = 6|b|), the deficits of the additive page's generators (7/2, 3/2, 1/2 at weights 1, 3, 4; b at 6;
     all others <= 0; the elementary bound's 1/2), and every rational inequality of the high-filtration argument
     (94 < I_1(24) = 98, 89 < I_6(35) = 235/2, 88 < S_6(30) = 199/2, the four conditions 17f > 464, 396, 328, 396
     derived from S_6, I_6 at the four slots, true for f >= 30).

WHAT IS NOT DECIDED -- and why the row is REFUSED: every table that carries the stem-322 argument.  The affine
systems of Table finite:affine-ranks (weight 60: 2,779 unknowns, 15,852 equations, ranks 2667 / 2668 for the nine
(k, e); weight 92: 23,384 unknowns, 137,471 equations, rank 23,119, square refinements 38, 1, 0, final dimension 226),
the sixteen enclosure rows, the span, cancellation and injection tests, the five product ranks, and B(y)^3 = 0 in
D_{6,81}.  They live on the paper's perturbed resolution through weight 93 and filtration 33 (2,269 slots, matrices up
to 12,864 x 11,419), which needs the completed operator algebra U (alg:operator-product) with t_4 and the
antidifferential recursion -- an independent implementation of a multi-thousand-line computation; the ordinary cobar
complex, the route used here, is far too large there (its filtration-6 cochains at weight 81 are counted below:
1,397,584,924,909, i.e. 1.4e12).  Estimated: days of implementation and, in pure-Python exact arithmetic, well beyond the 15-minute budget
(the 137,471 x 23,384 sparse F_3 elimination alone).  The topological deductions (Sections detector-ascent, cube,
the classical differentials, Toda, Amelotte, Selick) are theory throughout.
"""
import itertools
import os
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

D = 'preprints/The-Kervaire-Invariant-Problem-at-the-Prime-Three-September-24-2026/build/sections/'
FIN, REC, INTRO = D + 'finite.tex', D + 'recurrence.tex', D + 'introduction.tex'
NI = 3                                   # indices 1..3: w = 1, 4, 13
W = [(3 ** i - 1) // 2 for i in range(1, NI + 1)]


# ---------------------------------------------------------------- rational polynomials (dict: exponent tuple -> Fraction)
def padd(a, b, s=1):
    r = dict(a)
    for m, c in b.items():
        v = r.get(m, 0) + s * c
        if v:
            r[m] = v
        else:
            r.pop(m, None)
    return r


def pmul(a, b):
    r = {}
    for m1, c1 in a.items():
        for m2, c2 in b.items():
            m = tuple(x + y for x, y in zip(m1, m2))
            v = r.get(m, 0) + c1 * c2
            if v:
                r[m] = v
            else:
                r.pop(m, None)
    return r


def ppow(a, k, nv):
    r = {(0,) * nv: Fraction(1)}
    for _ in range(k):
        r = pmul(r, a)
    return r


def pscale(a, c):
    return {m: v * c for m, v in a.items() if v * c}


# variables: v1..v3 (0..2), t1..t3 (3..5), s1..s3 (6..8)
NV = 9


def V(kind, i):
    e = [0] * NV
    e[{'v': 0, 't': 3, 's': 6}[kind] + i - 1] = 1
    return {tuple(e): Fraction(1)}


ONE = {(0,) * NV: Fraction(1)}


def structure(n_max=NI):
    """l_n, R_n = eta_R(v_n), D_n = Delta(t_n) from (alg:logarithms), (alg:right-unit), (alg:coproduct)"""
    l = [ONE]
    for n in range(1, n_max + 1):
        acc = {}
        for j in range(n):
            acc = padd(acc, pmul(l[j], ppow(V('v', n - j), 3 ** j, NV)))
        l.append(pscale(acc, Fraction(1, 3)))
    t = lambda k: ONE if k == 0 else V('t', k)  # noqa: E731
    s = lambda k: ONE if k == 0 else V('s', k)  # noqa: E731
    rho = [ONE]
    for n in range(1, n_max + 1):
        acc = {}
        for j in range(n + 1):
            acc = padd(acc, pmul(l[j], ppow(t(n - j), 3 ** j, NV)))
        rho.append(acc)
    R = [ONE]
    for n in range(1, n_max + 1):
        acc = pscale(rho[n], 3)
        for j in range(1, n):
            acc = padd(acc, pmul(rho[j], ppow(R[n - j], 3 ** j, NV)), -1)
        R.append(acc)
    Dl = [ONE]
    for n in range(1, n_max + 1):
        acc = {}
        for j in range(n + 1):
            for k in range(n + 1 - j):
                h = n - j - k
                acc = padd(acc, pmul(pmul(l[j], ppow(t(k), 3 ** j, NV)), ppow(s(h), 3 ** (j + k), NV)))
        for j in range(1, n + 1):
            acc = padd(acc, pmul(l[j], ppow(Dl[n - j], 3 ** j, NV)), -1)
        Dl.append(acc)
    return l, R, Dl


def reduce_mod(p, mod):
    out = {}
    for m, c in p.items():
        c = Fraction(c)
        if c.denominator % 3 == 0:
            raise ValueError('not 3-integral')
        r = c.numerator * pow(c.denominator, -1, mod) % mod
        if r:
            out[m] = r
    return out


def integral(p):
    return all(Fraction(c).denominator % 3 for c in p.values())


# ---------------------------------------------------------------- the cobar complex mod p (p = 3, or 9 for Bocksteins)
def wt(T):
    return sum(e * w for e, w in zip(T, W))


Z3 = (0,) * NI


class Cobar:
    """cochains: dict {(Q, T_1, ..., T_s): c mod MOD}, Q, T_i exponent tuples over indices 1..3"""

    def __init__(self, R, Dl, mod=3):
        self.mod = mod
        # eta_R(v_i) as {(Q, T): c}; Delta(t_m) as {(Q, Ta, Tb): c}
        self.eta = []
        for i in range(1, NI + 1):
            e = {}
            for m, c in reduce_mod(R[i], mod).items():
                assert m[6:] == (0,) * 3
                e[(m[0:3], m[3:6])] = c
            self.eta.append(e)
        self.dl = []
        for i in range(1, NI + 1):
            e = {}
            for m, c in reduce_mod(Dl[i], mod).items():
                e[(m[0:3], m[3:6], m[6:9])] = c
            self.dl.append(e)
        self._etaQ, self._tr, self._dT = {}, {}, {}

    @staticmethod
    def _add(r, key, c, mod):
        v = (r.get(key, 0) + c) % mod
        if v:
            r[key] = v
        else:
            r.pop(key, None)

    def _mul_parts(self, A, B):
        """product of two dicts whose keys are tuples of exponent tuples of equal shape"""
        r = {}
        for k1, c1 in A.items():
            for k2, c2 in B.items():
                key = tuple(tuple(x + y for x, y in zip(a, b)) for a, b in zip(k1, k2))
                self._add(r, key, c1 * c2, self.mod)
        return r

    def etaQ(self, Q):
        """eta_R(v^Q) = {(Q', T'): c}"""
        if Q in self._etaQ:
            return self._etaQ[Q]
        r = {(Z3, Z3): 1}
        for i, e in enumerate(Q):
            for _ in range(e):
                r = self._mul_parts(r, self.eta[i])
        self._etaQ[Q] = r
        return r

    def transport(self, Q, k):
        """v^Q standing just before slot k, moved to the far left: {(Q', S_1, ..., S_{k-1}): c}"""
        if k == 1:
            return {(Q,): 1}
        key = (Q, k)
        if key in self._tr:
            return self._tr[key]
        r = {}
        for (Q1, T1), c1 in self.etaQ(Q).items():
            for kk, c2 in self.transport(Q1, k - 1).items():
                self._add(r, kk + (T1,), c1 * c2, self.mod)
        self._tr[key] = r
        return r

    def deltaT(self, T):
        """Delta(t^T) = {(Q, Ta, Tb): c}, coefficient standing before the first of the two slots"""
        if T in self._dT:
            return self._dT[T]
        r = {(Z3, Z3, Z3): 1}
        for i, e in enumerate(T):
            for _ in range(e):
                r = self._mul_parts(r, self.dl[i])
        self._dT[T] = r
        return r

    def d(self, x, check_normal=True):
        mod = self.mod
        r = {}
        for key, c in x.items():
            Q, Ts = key[0], key[1:]
            s = len(Ts)
            # d^0
            for (Q1, S1), c1 in self.transport(Q, 2).items():
                self._add(r, (Q1, S1) + Ts, c * c1, mod)
            # d^i
            for i in range(1, s + 1):
                sign = -1 if i % 2 else 1
                for (Qd, Ta, Tb), cd in self.deltaT(Ts[i - 1]).items():
                    for tk, ct in self.transport(Qd, i).items():
                        Qn = tuple(a + b for a, b in zip(Q, tk[0]))
                        pre = tuple(tuple(a + b for a, b in zip(Ts[j], tk[1 + j])) for j in range(i - 1))
                        self._add(r, (Qn,) + pre + (Ta, Tb) + Ts[i:], sign * c * cd * ct, mod)
            # d^{s+1}
            self._add(r, (Q,) + Ts + (Z3,), (-1) ** (s + 1) * c, mod)
        if check_normal:
            assert all(all(T != Z3 for T in k[1:]) for k in r), 'a non-normalized term survived'
        return r

    def cup(self, x, y):
        r = {}
        for kx, cx in x.items():
            p = len(kx) - 1
            for ky, cy in y.items():
                for tk, ct in self.transport(ky[0], p + 1).items():
                    Qn = tuple(a + b for a, b in zip(kx[0], tk[0]))
                    pre = tuple(tuple(a + b for a, b in zip(kx[1 + j], tk[1 + j])) for j in range(p))
                    self._add(r, (Qn,) + pre + ky[1:], cx * cy * ct, self.mod)
        return r


def monos(w):
    """exponent tuples over indices 1..3 of weight w"""
    out = []
    for e3 in range(w // 13 + 1):
        for e2 in range((w - 13 * e3) // 4 + 1):
            out.append((w - 13 * e3 - 4 * e2, e2, e3))
    return out


def basis(s, w):
    out = []

    def rec(slots, rem, acc):
        if slots == 0:
            for Q in monos(rem):
                out.append((Q,) + acc)
            return
        for b in range(1, rem - (slots - 1) + 1):
            for T in monos(b):
                rec(slots - 1, rem - b, acc + (T,))
    rec(s, w, ())
    return out


def rank_mod3(vectors, pivots=None):
    """Gaussian elimination over F_3 on dict vectors; pivots: dict lead-key -> normalized row (extended in place)"""
    pivots = {} if pivots is None else pivots
    added = 0
    for v in vectors:
        v = {k: c % 3 for k, c in v.items() if c % 3}
        while v:
            lead = max(v)
            if lead in pivots:
                c = v[lead]
                for k, pc in pivots[lead].items():
                    nv = (v.get(k, 0) - c * pc) % 3
                    if nv:
                        v[k] = nv
                    else:
                        v.pop(k, None)
            else:
                inv = v[lead]                 # 1 or 2, self-inverse mod 3
                pivots[lead] = {k: c * inv % 3 for k, c in v.items()}
                added += 1
                break
    return added, pivots


# ---------------------------------------------------------------- named cochains
def one_cochain_of(poly_vt):
    """a polynomial {(Q, T): c} in A[t] (one slot) as a 1-cochain, T != 0 enforced"""
    return {(Q, T): c for (Q, T), c in poly_vt.items() if T != Z3}


def delta_m(cb, q, m):
    """delta_m(q) = (eta_R(q) - q)/v_1^m after reduction mod 3; q = {Q: c}"""
    r = {}
    for Q, c in q.items():
        for (Q1, T1), c1 in cb.etaQ(Q).items():
            cb._add(r, (Q1, T1), c * c1, 3)
        cb._add(r, (Q, Z3), -c, 3)
    out = {}
    for (Q, T), c in r.items():
        if Q[0] < m:
            return None                       # not divisible
        out[((Q[0] - m,) + Q[1:], T)] = c
    return out


def bockstein(cb9, x):
    """B(x) = (Delta x~ - x~ (x) 1 - 1 (x) x~)/3 mod 3, x~ the lift with coefficients in {-1, 0, 1}; cb9 works mod 9"""
    lift = {k: (c if c == 1 else -1) for k, c in x.items()}
    num = {}
    for (Q, T), c in lift.items():
        for (Qd, Ta, Tb), cd in cb9.deltaT(T).items():          # Delta is left-linear; Delta(t^T) coefficients already left
            cb9._add(num, (tuple(a + b for a, b in zip(Q, Qd)), Ta, Tb), c * cd, 9)
        cb9._add(num, (Q, T, Z3), -c, 9)
        for (Q1, S1), c1 in cb9.transport(Q, 2).items():
            cb9._add(num, (Q1, S1, T), -c * c1, 9)
    if any(c % 3 for c in num.values()):
        return None
    return {k: (c // 3) % 3 for k, c in num.items() if (c // 3) % 3}


def weight_of(x):
    ws = set(sum(wt(T) for T in k) for k in x)
    return ws.pop() if len(ws) == 1 else None


# ---------------------------------------------------------------- the paper's resolution: generator combinatorics
def digits(N):
    out = []
    for i in range(1, 6):
        wi = (3 ** i - 1) // 2
        j = 0
        while 3 ** j * wi <= N:
            out.append(3 ** j * wi)
            j += 1
    return out


def coeff_counts(N):
    """number of coefficient monomials v^Q of each weight <= N (all v_i with w_i <= N)"""
    c = [0] * (N + 1)
    c[0] = 1
    i = 1
    while (3 ** i - 1) // 2 <= N:
        wi = (3 ** i - 1) // 2
        for k in range(wi, N + 1):
            c[k] += c[k - wi]
        i += 1
    return c


def resolution_dims_enum(f, d):
    """#C_{f,d} = #{(Q, g): s(g) = f, |Q| + w(g) = d}, by explicit recursion over the digits"""
    dg = digits(d)
    cc = coeff_counts(d)
    total = 0

    def rec(i, s, w):
        nonlocal total
        if s > f or w > d:
            return
        if i == len(dg):
            if s == f:
                total += cc[d - w]
            return
        e = 0
        while True:
            we = (3 * (e // 2) + e % 2) * dg[i]
            if s + e > f or w + we > d:
                break
            rec(i + 1, s + e, w + we)
            e += 1
    rec(0, 0, 0)
    return total


def resolution_dims_series(f, d):
    """the same count from the printed series prod 1/(1-t^{w_i}) prod (1 + z t^m)/(1 - z^2 t^{3m})"""
    # series as dict (s, w) -> count, truncated at s <= f, w <= d
    ser = {(0, 0): 1}

    def mul(a, b):
        r = {}
        for (s1, w1), c1 in a.items():
            for (s2, w2), c2 in b.items():
                if s1 + s2 <= f and w1 + w2 <= d:
                    r[(s1 + s2, w1 + w2)] = r.get((s1 + s2, w1 + w2), 0) + c1 * c2
        return r
    i = 1
    while (3 ** i - 1) // 2 <= d:
        wi = (3 ** i - 1) // 2
        ser = mul(ser, {(0, k * wi): 1 for k in range(d // wi + 1)})
        i += 1
    for m in digits(d):
        num = {(0, 0): 1, (1, m): 1}
        geo = {(2 * k, 3 * m * k): 1 for k in range(f // 2 + 1) if 3 * m * k <= d}
        ser = mul(ser, mul(num, geo))
    return ser.get((f, d), 0)


def ordinary_cobar_dim(f, d, imax=5):
    """dim of the ordinary normalized cobar cochains in filtration f, weight d: [t^d] P(t) (P(t) - 1)^f"""
    P = coeff_counts(d)
    Pm = list(P)
    Pm[0] -= 1
    ser = list(P)
    for _ in range(f):
        new = [0] * (d + 1)
        for a, ca in enumerate(ser):
            if ca:
                for b, cb in enumerate(Pm[:d + 1 - a]):
                    if cb:
                        new[a + b] += ca * cb
        ser = new
    return ser[d]


# ---------------------------------------------------------------- the decider
def decide(src=None, b_printed=None, dims_printed=((12, 49, 94), (3, 2, 1), (9301, 11419, 12864)), remark=(12, 470, 11, 456, 253, 162, 90)):
    src = src or Sources()
    checks = []
    t0 = time.time()
    fin, rec, intro = src.text(FIN), src.text(REC), src.text(INTRO)
    flat = lambda s: s.replace(' ', '').replace('\n', '')  # noqa: E731
    check(checks, 'the theorem and the finite lemma as printed',
          'K=K_3=\\{0,2,3\\}' in flat(intro) and 'lemma}[FiniteAdams--Novikovlemma]' in flat(fin) and
          '(12,49,94),\\qquad(3,2,1),\\qquad(9301,11419,12864)' in flat(rec) and 'middledimensionis$253$' in flat(rec),
          'introduction.tex:24-30, finite.tex:206-222, recurrence.tex:765-769, 863-879')
    value = {}
    # S. structure constants
    l, R, Dl = structure()
    check(checks, 'S. R_1..R_3 and D_1..D_3 from the recursion are 3-integral (denominators prime to 3)',
          all(integral(R[i]) and integral(Dl[i]) for i in range(1, NI + 1)),
          'terms: R %s, D %s' % ([len(R[i]) for i in range(1, 4)], [len(Dl[i]) for i in range(1, 4)]))
    def mono(**e):
        x = [0] * NV
        for k, val in e.items():
            x[{'v1': 0, 'v2': 1, 'v3': 2, 't1': 3, 't2': 4, 't3': 5}[k]] = val
        return tuple(x)
    r1_3, r1_9 = reduce_mod(R[1], 3), reduce_mod(R[1], 9)
    r2_3, r2_9 = reduce_mod(R[2], 3), reduce_mod(R[2], 9)
    check(checks, 'S. eta_R(v_1) = v_1 (mod 3) and v_1 + 3t_1 (mod 9), as printed', r1_3 == {mono(v1=1): 1} and r1_9 == {mono(v1=1): 1, mono(t1=1): 3})
    check(checks, 'S. eta_R(v_2) = v_2 + v_1 t_1^3 - v_1^3 t_1 (mod 3) and v_2 + 3t_2 + 5v_1^3 t_1 + v_1 t_1^3 (mod 9), as printed',
          r2_3 == {mono(v2=1): 1, mono(v1=1, t1=3): 1, mono(v1=3, t1=1): 2} and
          r2_9 == {mono(v2=1): 1, mono(t2=1): 3, mono(v1=3, t1=1): 5, mono(v1=1, t1=3): 1}, str(r2_9))
    # C. the cobar complex
    cb = Cobar(R, Dl, 3)
    cb9 = Cobar(R, Dl, 9)
    ok_dd = True
    sizes = {}
    for (s, w) in ((0, 27), (1, 27), (2, 14), (5, 10)):
        B = basis(s, w)
        sizes[(s, w)] = len(B)
        for key in B:
            if cb.d(cb.d({key: 1})):
                ok_dd = False
                break
    check(checks, 'C. d o d = 0 on every basis cochain of C^0, C^1 (weight 27), C^2 (weight 14), C^5 (weight 10); every '
          'image normalized', ok_dd, 'basis sizes %s' % {'%d,%d' % k: v for k, v in sizes.items()})
    # K. weight 27, filtration 1
    B0, B1 = basis(0, 27), basis(1, 27)
    inc, piv = rank_mod3([cb.d({k: 1}) for k in B0])
    out, _ = rank_mod3([cb.d({k: 1}) for k in B1])
    H1 = len(B1) - inc - out
    check(checks, 'K. weight 27: ordinary cobar dimensions %d, %d in filtrations 0, 1 and ranks %d, %d (printed 12, 470; 11, 456)'
          % (len(B0), len(B1), inc, out), (len(B0), len(B1), inc, out) == remark[:4])
    # named cocycles
    v = (1, 0, 0)
    a = {(Z3, (1, 0, 0)): 1}
    h = delta_m(cb, {(0, 1, 0): 1}, 1)
    r = delta_m(cb, {(0, 3, 0): 1}, 3)
    sp = delta_m(cb, {(0, 2, 0): 1}, 1)
    y = delta_m(cb, {(0, 9, 0): 1, (8, 7, 0): 2}, 9)
    t4 = delta_m(cb, {(0, 4, 0): 1}, 1)
    t7 = delta_m(cb, {(0, 7, 0): 1}, 1)
    d9 = delta_m(cb, {(0, 9, 0): 1}, 9)
    named = {'h': (h, 3), "r": (r, 9), "s'": (sp, 7), 'y': (y, 27), "t_4'": (t4, 15), "t_7'": (t7, 27)}
    ok_named = all(x is not None and Z3 not in [k[1] for k in x] and weight_of(x) == w and not cb.d(x) for x, w in named.values())
    check(checks, "K. h, r, s', y, t_4', t_7' are divisible as stated, normalized one-cocycles of weights 3, 9, 7, 27, 15, 27 "
          "(bidegrees (1,3), (1,9), (1,7), (1,27), (1,4i-1))", ok_named)
    ysum = dict(y)
    for k, c in t7.items():
        cb._add(ysum, k, c, 3)
    check(checks, "K. delta_9(v_2^9) = y + t_7' (finite:corrected-y) and (v_2 + v_1 w)^9 - v_2^9 = v_1^9 w^9 mod 3",
          d9 == ysum and d9 == {((0, 0, 0), (27, 0, 0)): 1, ((18, 0, 0), (9, 0, 0)): 2})
    reps = [{((26, 0, 0), (1, 0, 0)): 1}, y, t7]
    piv2 = {k: dict(vv) for k, vv in piv.items()}
    added, _ = rank_mod3(reps, piv2)
    check(checks, "K. D_{1,27} = <v^26 a, y, t_7'>: dimension %d = 470 - 11 - 456, and appending the three raises the "
          "incoming rank 11 -> %d" % (H1, inc + added), H1 == 3 and added == 3 and all(not cb.d(x) for x in reps))
    coef = [x.get(((0, 0, 0), (27, 0, 0)), 0) for x in reps]
    check(checks, "K. their t_1^27 coefficients are 0, 1, 0", coef == [0, 1, 0], str(coef))
    # Bocksteins
    b = bockstein(cb9, h)
    printed_b = b_printed or {(Z3, (2, 0, 0), (1, 0, 0)): 1, (Z3, (1, 0, 0), (2, 0, 0)): 1, ((1, 0, 0), (1, 0, 0), (1, 0, 0)): 2}
    check(checks, 'K. b = B(h) = t_1^2|t_1 + t_1|t_1^2 - v t_1|t_1 (alg:b-sign-check), a cocycle of bidegree (2,3)',
          b == printed_b and not cb.d(b) and weight_of(b) == 3, str(b))
    cp = bockstein(cb9, r)
    Bt4 = bockstein(cb9, t4)
    P = cb.cup(a, Bt4) if Bt4 is not None else None
    check(checks, "K. c' = B(r) and P = a B(t_4') are cocycles of bidegrees (2,9) and (3,16)",
          cp is not None and P is not None and not cb.d(cp) and not cb.d(P) and weight_of(cp) == 9 and weight_of(P) == 16
          and all(len(k) == 3 for k in cp) and all(len(k) == 4 for k in P))
    # (6,10)
    B5, B6 = basis(5, 10), basis(6, 10)
    inc6, piv6 = rank_mod3([cb.d({k: 1}) for k in B5])
    out6, _ = rank_mod3([cb.d({k: 1}) for k in B6])
    vb3 = cb.cup({((1, 0, 0),): 1}, cb.cup(b, cb.cup(b, b)))
    add6, _ = rank_mod3([vb3], piv6)
    H6 = len(B6) - inc6 - out6
    check(checks, 'K. (6,10): middle dimension %d, ranks %d and %d (printed 253; 162, 90)' % (len(B6), inc6, out6),
          (len(B6), inc6, out6) == remark[4:])
    check(checks, 'K. D_{6,10} = <v b^3> = F_3: dimension %d, v b^3 a cocycle raising the incoming rank by %d' % (H6, add6),
          H6 == 1 and add6 == 1 and not cb.d(vb3))
    value['ordinary cobar'] = {'C^0,27': len(B0), 'C^1,27': len(B1), 'ranks (1,27)': (inc, out), 'C^5,10': len(B5),
                               'C^6,10': len(B6), 'ranks (6,10)': (inc6, out6)}
    # R. the paper's resolution: cochain dimensions
    slots = ((1, 27), (6, 10), (6, 81))
    enum = [tuple(resolution_dims_enum(f + k, d) for k in (-1, 0, 1)) for f, d in slots]
    series = [tuple(resolution_dims_series(f + k, d) for k in (-1, 0, 1)) for f, d in slots]
    check(checks, 'R. cochain dimensions of the smaller resolution (n_-, n, n_+) at (1,27), (6,10), (6,81), by '
          'enumeration of (Q, g) and by the generating function (alg:dimension-series), equal the printed %s' % (dims_printed,),
          enum == series == list(dims_printed), 'enumerated %s, series %s' % (enum, series))
    low = [(1, 27, 12, 49, 94, 11, 35, 14, 3), (6, 10, 3, 2, 1, 1, 0, 2, 1), (6, 81, 9301, 11419, 12864, 5256, 6156, 5256, 1)]
    check(checks, 'R. Table finite:low-ranks: n - r_- - r equals the cohomology found in K (3 at (1,27), 1 at (6,10)) and '
          'r_C - r_- = |C| (3, 1, and 0 for the boundary B(y)^3)',
          low[0][3] - low[0][5] - low[0][6] == H1 and low[1][3] - low[1][5] - low[1][6] == H6 and
          low[0][7] - low[0][5] == 3 and low[1][7] - low[1][5] == 1 and low[2][7] - low[2][5] == 0,
          'the (6,81) row gives dim D_{6,81} = %d (not re-derived)' % (low[2][3] - low[2][5] - low[2][6]))
    # G. grids, degrees, deficits, inequalities
    def grid(Nc):
        return sum(1 for d in range(Nc + 1) for f in range(33) if 2 * d - 3 * f >= 0)
    check(checks, 'G. |G_60| = 1213 and |G_92| = 2269 slots (alg:finite-grid; recurrence.tex:778, 788)', grid(60) == 1213 and grid(92) == 2269,
          '%d, %d' % (grid(60), grid(92)))
    bb, PP, Rr = (2, 3), (3, 16), (9, 2)
    sub = lambda x, y, k=1: (x[0] - k * y[0], x[1] - k * y[1])  # noqa: E731
    addt = lambda x, y: (x[0] + y[0], x[1] + y[1])  # noqa: E731
    deg_ok = True
    for m, h0, u_, p_, z_ in (((14, 84), 5, (4, 69), (7, 85), (5, 82)), ((18, 85), 3, (12, 76), (15, 92), (9, 83))):
        ell = 6 - h0
        u = sub(m, bb, h0)
        p = addt(u, PP)
        z = sub(p, bb, ell)
        deg_ok &= (u, p, z) == (u_, p_, z_) and addt(z, Rr) == m
    deg_ok &= addt(PP, Rr) == (6 * bb[0], 6 * bb[1]) and all((322 + f) % 4 == 0 and (322 + f) // 4 == d for f, d in ((14, 84), (18, 85), (22, 86), (26, 87)))
    check(checks, 'G. the cancellation degree table (u, p, z), z + R = m, |P| + R = 6|b|, and m = (f, (322+f)/4) at f = 14, 18, 22, 26', deg_ok)
    # deficits on the additive page: e_{i,j} (1, w), c_{i,j} (2, 3w), v_i (0, w_i)
    gens = []
    for i in range(1, 6):
        wi = (3 ** i - 1) // 2
        gens.append(('v', 0, wi))
        j = 0
        while 3 ** j * wi <= 93:
            gens.append(('e', 1, 3 ** j * wi))
            gens.append(('c', 2, 3 * 3 ** j * wi))
            j += 1
    defi = lambda g: Fraction(9, 2) * g[1] - g[2]  # noqa: E731
    pos_ext = sorted((g[2], defi(g)) for g in gens if g[0] == 'e' and defi(g) > 0)
    pos_other = [(g, defi(g)) for g in gens if g[0] != 'e' and defi(g) > 0]
    elem = [(g, Fraction(3, 2) * g[1] - g[2]) for g in gens if Fraction(3, 2) * g[1] - g[2] > 0]
    check(checks, 'G. deficits 9f/2 - d on the additive page: exterior positives exactly (1, 7/2), (3, 3/2), (4, 1/2), '
          'sum 11/2; the only positive polynomial generator is c_{1,0} = b with 6; the elementary deficit 3f/2 - d is '
          'positive only for e_{1,0} (1/2)',
          pos_ext == [(1, Fraction(7, 2)), (3, Fraction(3, 2)), (4, Fraction(1, 2))] and sum(x for _, x in pos_ext) == Fraction(11, 2)
          and pos_other == [(('c', 2, 3), 6)] and elem == [(('e', 1, 1), Fraction(1, 2))], '%s %s %s' % (pos_ext, pos_other, elem))
    S_ = lambda k, f: Fraction(9, 2) * f + Fraction(1, 2) - 6 * k  # noqa: E731
    I_ = lambda k, f: Fraction(9, 2) * f - 4 - 6 * k  # noqa: E731
    ineq = (I_(1, 24) == 98 and 94 < I_(1, 24) and I_(6, 35) == Fraction(235, 2) and 89 < I_(6, 35) and
            S_(6, 30) == Fraction(199, 2) and 88 < S_(6, 30) and all(I_(k, f) == S_(k, f - 1) for k in range(1, 8) for f in range(40)))
    # the four conditions at m = (f, (322+f)/4): derived thresholds 17f > 464, 396, 328, 396, equivalent for every f
    def conds(f):
        d = Fraction(322 + f, 4)
        return (d < S_(6, f), d + 1 < I_(6, f + 5), d + 2 < I_(6, f + 9), d + 1 < S_(6, f + 4))
    equiv = all(conds(f) == (17 * f > 464, 17 * f > 396, 17 * f > 328, 17 * f > 396) for f in range(0, 200))
    hold = all(all(conds(f)) for f in range(30, 400, 4))
    check(checks, 'G. 94 < I_1(24) = 98, 89 < I_6(35) = 235/2, 88 < S_6(30) = 199/2, I_k(f) = S_k(f-1); the four b^6 '
          'conditions at m = (f, (322+f)/4), m+J, m+R, m+R-J are exactly 17f > 464, 396, 328, 396 and hold for f >= 30',
          ineq and equiv and hold)
    # the measured size of the route not taken
    big = ordinary_cobar_dim(6, 81)
    value['ordinary cobar filtration-6 cochains at weight 81'] = big
    check(checks, 'THE TABLES CARRYING STEM 322 (finite:affine-ranks, finite:enclosures, the span / cancellation / '
          'injection / product ranks, B(y)^3 = 0 in D_{6,81}): NOT RE-DERIVED (REFUSED: the paper\'s perturbed '
          'resolution through weight 93 and filtration 33 is not re-implemented; the ordinary cobar route has %s '
          'cochains at (6,81))' % format(big, ','), False, 'the decisive finite part of the headline')
    decided = checks[:-1]
    ok = all(c['pass'] for c in decided)
    value['runtime_s'] = round(time.time() - t0, 1)
    return {'verdict': 'REFUSED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: the structure constants, the low-degree Ext groups D_{1,27} = <v^26 a, y, '
                       't_7\'> and D_{6,10} = <v b^3> by an independent ordinary-cobar computation (matching the '
                       'paper\'s printed checkpoints), the named cocycles and Bocksteins, the resolution\'s cochain '
                       'dimensions and every rational inequality of Section finite; the weight-60/92 tables that carry '
                       'the stem-322 argument are REFUSED, so the row is REFUSED'}


def forge():
    out = []
    r = decide(b_printed={(Z3, (2, 0, 0), (1, 0, 0)): 1, (Z3, (1, 0, 0), (2, 0, 0)): 1, ((1, 0, 0), (1, 0, 0), (1, 0, 0)): 1})
    out.append(('b printed with + v t_1|t_1 instead of - v t_1|t_1', r['verdict']))
    r = decide(dims_printed=((12, 49, 94), (3, 2, 1), (9301, 11418, 12864)))
    out.append(('cochain dimension 11419 at (6,81) printed as 11418', r['verdict']))
    r = decide(remark=(12, 470, 11, 456, 253, 161, 90))
    out.append(('the (6,10) incoming rank printed as 161', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1, default=str))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    print(forge())
