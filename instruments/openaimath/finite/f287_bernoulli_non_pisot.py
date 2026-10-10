"""F-287 -- "Arithmetic classification and non-Pisot singularity for Bernoulli convolutions" (openai/math family 153).

THE CLAIM (nonpisot.tex:25-29, Theorem np:main): "The polynomial p [= t^31 - 2t^30 + sum_{j=0}^{9}(t^{3j+1} - t^{3j}),
nonpisot.tex:15] has a unique real root beta in (1.8392, 1.8393). This root is not a Pisot number, and nu_{1/beta} is
singular with respect to Lebesgue measure."  Its finite inputs are Proposition np:roots (nonpisot.tex:34-48: all roots
simple; the roots outside the unit circle are beta, alpha, conj(alpha); 1.0002089 < |alpha|^2 < 1.0002094;
|alpha|^-1 < .9999; fourteen nonreal pairs of modulus < .994) and Proposition np:moments (nonpisot.tex:215-235: weights
w_ks in 1e-9 Z with .001 + .0055 + sum|w| = 198442946/1e9 < .199, E L_i > .000210, E|G_i|^2 < .000145,
|E Z^2 G^2| < .000007), both proved by the rational certificate of Appendix cert:section (certificate.tex:1-675).

WHAT IS DECIDED HERE, exactly (integers, Fractions, Gaussian integers; no float decides anything):
  A. The polynomial: the printed forms agree (nonpisot.tex:15, certificate.tex:21) and
     (t^2+t+1)p = t^33-t^32-t^31-t^30-1 (nonpisot.tex:20).  Irreducibility is NOT claimed (Lemma np:lattice:
     "No irreducibility assumption is needed"); it is decided here anyway, as a second route to non-Pisot: p mod 67
     passes Rabin's test (x^(67^31) = x mod p, gcd(x^67 - x, p) = 1, 31 prime), so the monic p is irreducible over Q,
     its roots are the conjugates of beta, and alpha (|alpha| > 1) is one of them.
  B. The root disks (certificate.tex:16-97), by this audit's own Rouche test, not the paper's: for each of the 31 disks
     D(z, 1e-35) (16 table centres and the 15 conjugates) the exact Taylor coefficients c_k of p(z+h) are computed in
     Gaussian integers (a Taylor shift of E^31 p(X/E), E = 1e40), and |c_0| + sum_{k>=2} |c_k| d^k < |c_1| d is
     checked with integer square-root upper bounds and an exact squared comparison; Rouche then puts exactly one root
     in each disk. The disks are pairwise disjoint (exact squared distances) and there are 31 = deg p of them, so they
     hold all the roots and all are simple; the real-centred disk holds a real root (conjugation), the other 30 miss
     the axis.  The paper's own printed inequalities (cert:residual, the Taylor constant 1e17, |z - z'| > .01,
     cert:center-bounds) are separate rows.  From the disks: every bound of Prop. np:roots, and the inputs of the
     paper's non-Pisot argument (nonpisot.tex:59-65): p monic in Z[t], |p(0)| = 1, simple roots, outside set
     {beta, alpha, conj alpha}, |alpha|^2 < 1.0002094, the rest < .994, and 1.0002094 * .994 < 1.
  C. The same root facts a SECOND way, without the disks: an exact Sturm sequence (one real root; it lies in
     (1.8392, 1.8393]; the endpoints are not roots since p has no rational root) and an exact Schur-Cohn count on the
     Graeffe square Q(s) = prod (s - r^2) at rational radii: 28 roots with |r|^2 < .994^2, 28 with
     |r|^2 < 1.0002089, 30 with |r|^2 < 1.0002094, 30 with |r|^2 < 1.8392^2 and 31 with |r|^2 < 1.8393^2.
  D. The rational algorithm of cert:algorithm (certificate.tex:98-243), re-implemented from its text alone: the
     coefficient arrays c_0, c_1, the rounded cosine/sine tables, the geometric-tail exponential and the 4,758 rounded
     finite products, the weights (cert:weights); then every printed integer of cert:exact-output (|R| = 753, the two
     weight sums, W S c~, W^2 S v~, W^2 S T~), the printed small-row table (certificate.tex:558-562), the array bounds
     (cert:array-bounds) and the three upper-rounded products of cert:B-output, each compared exactly; and each
     printed decimal consequence (certificate.tex:492-505, 521-523, 591-592, 665-673; nonpisot.tex:219-221).
  E. The arithmetic of the printed error budget (cert:error, certificate.tex:245-425) and of the B-product factors:
     every rational inequality it states, each exactly.
  F. A posteriori, with this audit's own rigorous ball arithmetic (Gaussian-integer centres at scale 1e50, integer
     radii, every rounding outward; pi enclosed by Machin's formula with bounded alternating tails): the TRUE C_0(m),
     C_1(m) from the root disks on the whole computed range, so the printed coefficient-error bounds
     (cert:coefficient-errors: 7e-20, 2.1e-19) are checked, not assumed; the stored-pair errors (2/S, 1e-21); the
     constants |u_A| <= .00871, |a| > .99, |u'_A - u_A| < 5e-21, sum_{r in I}|1/p'(r)| <= 32, the beta base < .545 and
     coefficients <= 4, max_{n >= -20}|C_0(n)| < .018 (the tangent bound); and every rounded cosine/sine the products
     use against a rigorous enclosure of cos/sin of the TRUE angle: error < 1e-16 per table entry (the paper's claim,
     certificate.tex:308-309) and < 1e-15 for every input of the B products (the margin added at certificate.tex:571).

WHAT IS NOT DECIDED (theory, not the finite object):
  - singularity of nu_{1/beta} itself: Lemma np:lattice, the characters, the damping lemma and its automaton
    (nonpisot.tex:247-369, whose own rational constants are outside this row), the counting argument and the proof of
    Theorem np:main (nonpisot.tex:370-675);
  - the analytic error analysis of cert:error as an argument (that Delta = 5e-6 bounds |P~ - P|): the telescoping, the
    rounding analysis of pen (1e-9) and of the exponential (4e-9) inside each of the 4,758 tails, the log-cos remainder
    over the infinite tail; only its arithmetic (E) and its coefficient/trigonometric inputs (F) are decided;
  - the passage from the finite numbers to Proposition np:moments (the stationary-model moment identities,
    certificate.tex:427-523) and the Walsh-expansion/anisotropy argument (certificate.tex:594-675);
  - the quartic Salem theorem and the arithmetic classification (salem.tex, classification.tex).
"""
import math
import os
import re
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/Arithmetic-classification-and-non-Pisot-singularity-for-Bernoulli-convolutions-October-3-2026/build/'
CERT = DIR + 'certificate.tex'
NP = DIR + 'nonpisot.tex'

E = 10 ** 40                      # centre denominator (certificate.tex:23)
DELTA = Fraction(1, 10 ** 35)     # disk radius (certificate.tex:26)
S = 10 ** 30                      # rounding scale (certificate.tex:114)
R, H, K, W = 3000, 100, 2000, 10 ** 9
PI_NUM = 3141592653589793238462643383279   # pi' = PI_NUM / S (certificate.tex:127)
DEG = 31
Q = 10 ** 50                      # this audit's ball-arithmetic scale


def dec(s):
    """a printed terminating decimal as the exact rational it denotes (certificate.tex:13-14)"""
    return Fraction(s)


# ---------------------------------------------------------------- polynomial and exact helpers

def p_coeffs():
    """p(t) = t^31 - 2t^30 + sum_{j=0}^{9} (t^{3j+1} - t^{3j}), low -> high"""
    c = [0] * (DEG + 1)
    c[31] += 1
    c[30] -= 2
    for j in range(10):
        c[3 * j + 1] += 1
        c[3 * j] -= 1
    return c


def pmul(a, b):
    r = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                r[i + j] += x * y
    return r


def trim(a):
    while a and a[-1] == 0:
        a.pop()
    return a


def rnd(num, den):
    """the paper's [x] numerator for x = num/den (den > 0): floor(S x + 1/2)"""
    return (2 * S * num + den) // (2 * den)


def cmul(x, y):
    """[x y] for complex numerators at scale S"""
    re_ = x[0] * y[0] - x[1] * y[1]
    im = x[0] * y[1] + x[1] * y[0]
    return ((2 * re_ + S) // (2 * S), (2 * im + S) // (2 * S))


def floor_half(q):
    q = Fraction(q) + Fraction(1, 2)
    return q.numerator // q.denominator


def nows(s):
    return re.sub(r'\s+', '', s)


# ---------------------------------------------------------------- A. irreducibility (a second route; not claimed)

def _pmod_q(a, b, q):
    a = trim([x % q for x in a])
    inv = pow(b[-1], q - 2, q)
    while len(a) >= len(b):
        f = a[-1] * inv % q
        s = len(a) - len(b)
        for i, x in enumerate(b):
            a[s + i] = (a[s + i] - f * x) % q
        trim(a)
    return a


def _mulmod_q(a, b, f, q):
    if not a or not b:
        return []
    r = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                r[i + j] = (r[i + j] + x * y) % q
    return _pmod_q(trim(r), f, q)


def _powmod_q(base, e, f, q):
    r, b = [1], _pmod_q(base, f, q)
    while e:
        if e & 1:
            r = _mulmod_q(r, b, f, q)
        b = _mulmod_q(b, b, f, q)
        e >>= 1
    return r


def _gcd_q(a, b, q):
    a, b = trim([x % q for x in a]), trim([x % q for x in b])
    while b:
        a, b = b, _pmod_q(a, b, q)
    return a


def rabin_irreducible_mod(f, q):
    """f monic of PRIME degree n: irreducible over F_q iff x^(q^n) = x (mod f) and gcd(x^q - x, f) = 1"""
    n = len(f) - 1
    xq = _powmod_q([0, 1], q, f, q)
    h = xq
    for _ in range(n - 1):
        h = _powmod_q(h, q, f, q)      # h = x^(q^i) -> x^(q^(i+1))
    xmx = trim([(xq[i] if i < len(xq) else 0) - (1 if i == 1 else 0) for i in range(max(len(xq), 2))])
    return h == [0, 1] and len(_gcd_q(f, xmx, q)) == 1


# ---------------------------------------------------------------- B. root disks

def taylor_shift(Z):
    """Gaussian-integer D_k with p(z + h) = sum_k (D_k / E^(31-k)) h^k, z = Z/E"""
    p = p_coeffs()
    a = [(p[j] * E ** (DEG - j), 0) for j in range(DEG + 1)]   # E^31 p(X/E), X = E t, integer coefficients
    zr, zi = Z
    for i in range(DEG):
        for j in range(DEG - 1, i - 1, -1):
            xr, xi = a[j + 1]
            a[j] = (a[j][0] + zr * xr - zi * xi, a[j][1] + zr * xi + zi * xr)
    return a


def abs_upper(c):
    return math.isqrt(c[0] * c[0] + c[1] * c[1]) + 1


def rouche_one_root(D, delta=DELTA):
    """|c_0| + sum_{k>=2}|c_k| d^k < |c_1| d with c_k = D_k / E^(31-k): on |h| = d, |p(z+h) - c_1 h| < |c_1 h|"""
    lhs = Fraction(abs_upper(D[0]), E ** DEG)
    for k in range(2, DEG + 1):
        if D[k] != (0, 0):
            lhs += Fraction(abs_upper(D[k]), E ** (DEG - k)) * delta ** k
    c1sq = Fraction(D[1][0] ** 2 + D[1][1] ** 2, E ** (2 * (DEG - 1)))
    return lhs * lhs < c1sq * delta * delta


def parse_table(tex):
    rows, on = [], False
    for ln in tex.split('\n'):
        if '\\begin{tabular}{rr}' in ln:
            on = True
            continue
        if on and '\\end{tabular}' in ln:
            break
        if on and '&' in ln and 'numerator' not in ln:
            a, b = ln.replace('\\\\', '').split('&')
            rows.append((int(a.strip()), int(b.strip())))
    return rows


def all_disks(centres):
    out = []
    for a, b in centres:
        out.append((a, b))
        if b:
            out.append((a, -b))
    return out


# ---------------------------------------------------------------- C. Sturm and Schur-Cohn

def _prim(f):
    den = 1
    for x in f:
        den = den * x.denominator // math.gcd(den, x.denominator)
    g = [int(x * den) for x in f]
    c = 0
    for x in g:
        c = math.gcd(c, x)
    return [x // c for x in g] if c else g


def _rem(a, b):
    a = [Fraction(x) for x in a]
    while len(a) >= len(b) and any(a):
        f = a[-1] / b[-1]
        s = len(a) - len(b)
        for i, x in enumerate(b):
            a[s + i] -= f * x
        a.pop()
    return trim(a)


def sturm_chain(f):
    """p_0 = f, p_1 = f', p_{i+1} = -rem(p_{i-1}, p_i), each scaled by a POSITIVE rational (signs unchanged)"""
    chain = [f, [i * f[i] for i in range(1, len(f))]]
    while len(chain[-1]) > 1:
        r = _rem(chain[-2], chain[-1])
        if not r:
            break
        chain.append(_prim([-x for x in r]))
    return chain


def _sign_at(f, x):
    v = Fraction(0)
    for c in reversed(f):
        v = v * x + c
    return (v > 0) - (v < 0)


def _variations(signs):
    s = [x for x in signs if x]
    return sum(1 for i in range(len(s) - 1) if s[i] != s[i + 1])


def sturm_count(chain, a, b):
    """distinct real roots in (a, b]; None = -inf / +inf"""
    def V(x, inf):
        if x is None:
            return _variations([((c[-1] > 0) - (c[-1] < 0)) * (inf ** (len(c) - 1)) for c in chain])
        return _variations([_sign_at(c, x) for c in chain])
    return V(a, -1) - V(b, 1)


def schur_cohn_inside(f):
    """roots of the real polynomial f (formal degree len(f)-1, leading coefficient nonzero) in |s| < 1, by the
    Schur-Cohn recursion g = a_0 f - a_n f* (f* the reversal). Rouche on |s| = 1: delta = a_0^2 - a_n^2 > 0 gives
    N(g) = N(f); delta < 0 gives N(g) = N(f*) = n - N(f). A zero of f on the circle is a zero of every later g and
    cannot survive to the final nonzero constant, so nonzero deltas exclude it. None if some delta vanishes."""
    f = list(f)
    steps = []
    while len(f) > 1:
        n = len(f) - 1
        a0, an = f[0], f[n]
        d = a0 * a0 - an * an
        if d == 0:
            return None
        g = [a0 * f[k] - an * f[n - k] for k in range(n)]
        c = 0
        for x in g:
            c = math.gcd(c, x)
        if c == 0:
            return None
        f = [x // c for x in g]
        steps.append((n, d > 0))
    if f[0] == 0:
        return None
    N = 0
    for n, pos in reversed(steps):
        N = N if pos else n - N
    return N


def graeffe_any(p):
    """Q with Q(t^2) = (-1)^n p(t) p(-t), n = deg p: its roots are the squares of the roots of p"""
    n = len(p) - 1
    prod = pmul(p, [c * (-1) ** i for i, c in enumerate(p)])
    assert all(prod[i] == 0 for i in range(1, len(prod), 2))
    return [(-1) ** n * prod[2 * i] for i in range(len(p))]


def graeffe(p):
    return graeffe_any(p)


def count_sq_modulus_below(Qp, c):
    n = len(Qp) - 1
    num, den = c.numerator, c.denominator
    return schur_cohn_inside([Qp[k] * num ** k * den ** (n - k) for k in range(n + 1)])


# ---------------------------------------------------------------- D. the rational algorithm of cert:algorithm

def gh(C):
    """the paper's rounded cosine and sine of pi c, c = C/S (certificate.tex:169-177); returns numerators"""
    X = (2 * PI_NUM * C + S) // (2 * S)
    Y = (2 * X * X + S) // (2 * S)
    T, U = S, X
    G, Hh = T, U
    for j in range(1, 51):
        d1 = 2 * j * (2 * j - 1)
        d2 = 2 * j * (2 * j + 1)
        T = (-2 * T * Y + S * d1) // (2 * S * d1)
        U = (-2 * U * Y + S * d2) // (2 * S * d2)
        G += T
        Hh += U
    return G, Hh, X, Y


class Machine:
    """arrays, tables and products of cert:algorithm, built from the table of centres"""

    def __init__(self, centres):
        self.centres = centres
        self.pairs = []                    # (contracting?, a_z, v_z, multiplier)
        for (a, b) in centres:
            P1 = taylor_shift((a, b))[1]   # p'(z) = P1 / E^30, exact
            n2 = P1[0] ** 2 + P1[1] ** 2
            r = (rnd(E ** 30 * P1[0], n2), rnd(-E ** 30 * P1[1], n2))       # r_z = [1/p'(z)]
            if a * a + b * b < E * E:
                self.pairs.append((True, (rnd(a, E), rnd(b, E)), r, 2))   # ([z], r_z)
            else:
                m2 = a * a + b * b
                inv = (rnd(E * a, m2), rnd(-E * b, m2))                     # [1/z]
                pr = cmul(inv, r)
                self.pairs.append((False, inv, (-pr[0], -pr[1]), 1 if b == 0 else 2))
        self.lo0, self.hi0 = -R - K - 5, H + K + 5
        c0 = {m: 0 for m in range(self.lo0, self.hi0 + 1)}
        for contracting, az, vz, mult in self.pairs:
            v = vz
            rng = range(-1, self.lo0 - 1, -1) if contracting else range(0, self.hi0 + 1)
            for m in rng:
                c0[m] += mult * v[0]
                v = cmul(v, az)
        self.c0 = c0
        self.c1 = {m: c0[m + 3] - c0[m] + c0[m - 1] for m in range(self.lo0 + 1, self.hi0 - 2)}
        self.g, self.h, self.xy = [{}, {}], [{}, {}], []
        for A, arr in enumerate((self.c0, self.c1)):
            for m, c in arr.items():
                G, Hh, X, Y = gh(c)
                self.g[A][m], self.h[A][m] = G, Hh
                self.xy.append((X, Y))
        # the weak pair (certificate.tex:182-193): (a', u'_0) belongs to z_alpha, the sixth centre
        _, self.ap, self.u0, _ = self.pairs[5]
        self.apow = [(S, 0)]
        for _ in range(K):
            self.apow.append(cmul(self.ap, self.apow[-1]))
        m2 = self.ap[0] ** 2 + self.ap[1] ** 2
        inv_ap = (rnd(S * self.ap[0], m2), rnd(-S * self.ap[1], m2))
        self.u1 = cmul(self.u0, (self.apow[3][0] - S + inv_ap[0], self.apow[3][1] + inv_ap[1]))
        self.u = [self.u0, self.u1]
        self.b = [S]
        for _ in range(6):
            self.b.append((2 * self.b[-1] * PI_NUM + S) // (2 * S))
        self.cache = {}

    def tail(self, w):
        U = cmul(w, self.apow[H])
        q = [(S, 0)]
        for _ in range(6):
            q.append(cmul(q[-1], U))
        pen = 0
        for d, f in ((2, 2), (4, 12), (6, 45)):
            mom = 0
            for j in range(d + 1):
                num = cmul(q[j], (q[d - j][0], -q[d - j][1]))
                aa = cmul(self.apow[j], (self.apow[d - j][0], -self.apow[d - j][1]))
                den = (S - aa[0], -aa[1])
                mom += math.comb(d, j) * rnd(num[0] * den[0] + num[1] * den[1], den[0] ** 2 + den[1] ** 2)
            pen += (2 * self.b[d] * mom + S * f) // (2 * S * f)
        x = (-2 * pen + 32) // 64                      # [-pen/32]
        t = val = S
        for j in range(1, 41):
            t = (2 * t * x + S * j) // (2 * S * j)
            val += t
        for _ in range(5):
            val = (2 * val * val + S) // (2 * S)
        return val

    def single(self, A):
        key = ('single', A)
        if key not in self.cache:
            val = self.tail(self.u[A])
            g = self.g[A]
            for m in range(-R, H):
                val = (2 * val * g[m] + S) // (2 * S)
            self.cache[key] = val
        return self.cache[key]

    def pair(self, A, B, sigma, k):
        key = (A, B, sigma, k)
        if key in self.cache:
            return self.cache[key]
        sh = cmul(self.u[B], self.apow[k])
        val = self.tail((self.u[A][0] + sigma * sh[0], self.u[A][1] + sigma * sh[1]))
        gA, hA, gB, hB = self.g[A], self.h[A], self.g[B], self.h[B]
        S2 = 2 * S
        for m in range(-R - k, H):
            v = (2 * (gA[m] * gB[m + k] - sigma * hA[m] * hB[m + k]) + S) // S2
            val = (2 * val * v + S) // S2
        self.cache[key] = val
        return val

    def moments(self):
        """the weights and the three sums of cert:exact-output, as exact integers"""
        if 'sums' in self.cache:
            return self.cache['sums']
        m = {}
        for k in range(0, K + 1):
            m[(k, 0)] = self.pair(0, 0, 1, k)      # m_k0 = P~_00^+(k)
            m[(k, 1)] = self.pair(0, 0, -1, k)     # m_k1 = P~_00^-(k)
        rows = []
        for k in range(30, K + 1):
            for s in (0, 1):
                r = Fraction(m[(k, s)], S)
                n = floor_half(dec('.68') * W * max(Fraction(0), abs(r) - dec('.00026')))
                sg = (r > 0) - (r < 0)
                if sg * n:
                    rows.append((sg * n, k, s))
        XW, YW = -10 ** 6, 5500000                  # W X, W Y for X = -.001, Y = .0055
        B0, B1, Ee = self.single(0), self.single(1), self.pair(0, 1, 1, 33)

        def J(k, s):                                # J_k0 = minus entry, J_k1 = plus entry (certificate.tex:452-459)
            sig = -1 if s == 0 else 1
            return self.pair(1, 0, sig, k - 33) if k >= 33 else self.pair(0, 1, sig, 33 - k)
        WSc = XW * B0 + YW * Ee + sum(w * m[(k, s)] for w, k, s in rows)
        W2Sv = XW * XW * S + YW * YW * S + 2 * XW * YW * B1 + 2 * sum(w * (XW * B0 + YW * J(k, s)) for w, k, s in rows)
        T = 0
        for w, k, s in rows:
            for v, l, t in rows:
                x = w * v * m[(abs(k - l), 1 if s == t else 0)]
                W2Sv += x
                if k >= 50 and l >= 50:
                    T += abs(x)
        out = {'rows': rows, 'R': len(rows), 'wsum': abs(XW) + abs(YW) + sum(abs(w) for w, _, _ in rows),
               'wsum_small': abs(XW) + abs(YW) + sum(abs(w) for w, k, _ in rows if k < 50),
               'WSc': WSc, 'W2Sv': W2Sv, 'W2ST': T}
        self.cache['sums'] = out
        return out

    def small_sequences(self, rows):
        """phase sequences of the small rows (certificate.tex:507-513), as functions of m on the c arrays"""
        seqs = [('constant', lambda m: 0), ('type-1 row', lambda m: self.c1[m + 33])]
        for w, k, s in rows:
            if k < 50:
                seqs.append(('row k=%d s=%d' % (k, s), (lambda kk, ss: lambda m: (1 - 2 * ss) * self.c0[m + kk])(k, s)))
        return seqs

    def b_product(self, case, V, lo):
        """the upper-rounding recurrence of certificate.tex:568-576; returns the final numerator at scale S"""
        v = S
        for m in range(lo, 1):
            G, Hh, _, _ = gh(V(m))
            b, y = abs(G) + 10 ** 15, abs(Hh) + 10 ** 15
            if case == 0:
                F = b
            elif case == 1:
                F = 1 + floor_half(dec('1.002') * (b + dec('.06') * y))
            else:
                F = 1 + floor_half(dec('1.004') * (dec('1.0036') * b + dec('.12') * y))
            v = 1 + (2 * v * min(S, F) + S) // (2 * S)
        return v

    def b_bounds(self, rows):
        seqs = self.small_sequences(rows)
        c0 = self.c0
        B2 = self.b_product(2, lambda m: 2 * c0[m], -70)
        B1 = max(self.b_product(1, (lambda f: lambda m: 2 * c0[m] + f(m))(f), -70) for _, f in seqs)
        B0 = 0
        for i in range(len(seqs)):
            for j in range(i, len(seqs)):
                f, g = seqs[i][1], seqs[j][1]
                B0 = max(B0, self.b_product(0, (lambda f, g: lambda m: 2 * c0[m] + f(m) + g(m))(f, g), -200))
        return B2, B1, B0, seqs


# ---------------------------------------------------------------- F. rigorous balls (this audit's own)
# complex ball (re, im, rad): the value lies within rad/Q of (re + i im)/Q; real ball (c, rad).

def _ceil_div(a, b):
    return -((-a) // b)


def cb_abs_up(x):
    return math.isqrt(x[0] * x[0] + x[1] * x[1]) + 1 + x[2]


def cb_abs_lo(x):
    return math.isqrt(x[0] * x[0] + x[1] * x[1]) - x[2]


def cb_mul(x, y):
    re_ = x[0] * y[0] - x[1] * y[1]
    im = x[0] * y[1] + x[1] * y[0]
    ax = math.isqrt(x[0] * x[0] + x[1] * x[1]) + 1
    ay = math.isqrt(y[0] * y[0] + y[1] * y[1]) + 1
    rad = _ceil_div(ax * y[2] + ay * x[2] + x[2] * y[2], Q) + 1
    return ((2 * re_ + Q) // (2 * Q), (2 * im + Q) // (2 * Q), rad)


def cb_inv(x):
    n = x[0] * x[0] + x[1] * x[1]
    L = math.isqrt(n)
    assert L > x[2]
    return ((2 * Q * Q * x[0] + n) // (2 * n), (-2 * Q * Q * x[1] + n) // (2 * n),
            _ceil_div(Q * Q * x[2], L * (L - x[2])) + 1)


def cb_add(*xs):
    return (sum(x[0] for x in xs), sum(x[1] for x in xs), sum(x[2] for x in xs))


def cb_neg(x):
    return (-x[0], -x[1], x[2])


def cb_dist_up(x, re_, im):
    """upper bound (ulps) on |value - (re + i im)/Q| for any value in the ball x"""
    return math.isqrt((x[0] - re_) ** 2 + (x[1] - im) ** 2) + 1 + x[2]


def rb_mul(x, y):
    rad = _ceil_div(abs(x[0]) * y[1] + abs(y[0]) * x[1] + x[1] * y[1], Q) + 1
    return ((2 * x[0] * y[0] + Q) // (2 * Q), rad)


def rb_divint(x, d):
    return ((2 * x[0] + d) // (2 * d), _ceil_div(x[1], d) + 1)


def pi_ball():
    """pi = 16 atan(1/5) - 4 atan(1/239); alternating tails bounded by the first omitted term"""
    def atan_inv(n, terms):
        s, err = 0, 0
        for i in range(terms):
            t = Q // (n ** (2 * i + 1) * (2 * i + 1))       # floor: error < 1 ulp
            s += -t if i % 2 else t
            err += 1
        err += Q // (n ** (2 * terms + 1) * (2 * terms + 1)) + 1
        return s, err
    a5, e5 = atan_inv(5, 80)
    a239, e239 = atan_inv(239, 25)
    return (16 * a5 - 4 * a239, 16 * e5 + 4 * e239)


def _trig_tail(thmax, N):
    """ulps bounding |theta|^(2N+2)/(2N+2)! and |theta|^(2N+3)/(2N+3)! for |theta| <= thmax"""
    a = thmax ** (2 * N + 2) / math.factorial(2 * N + 2)
    b = thmax ** (2 * N + 3) / math.factorial(2 * N + 3)
    return _ceil_div((a * Q).numerator, (a * Q).denominator) + 1, _ceil_div((b * Q).numerator, (b * Q).denominator) + 1


def cos_sin_ball(th, N, tails):
    """rigorous balls for cos and sin of every value in the real ball th (|th| bounded by the tails' thmax)"""
    y = rb_mul(th, th)
    t, cs = (Q, 0), [Q, 0]
    for j in range(1, N + 1):
        t = rb_divint(rb_mul(t, y), (2 * j - 1) * (2 * j))
        t = (-t[0], t[1])
        cs[0] += t[0]
        cs[1] += t[1]
    t, sn = th, [th[0], th[1]]
    for j in range(1, N + 1):
        t = rb_divint(rb_mul(t, y), 2 * j * (2 * j + 1))
        t = (-t[0], t[1])
        sn[0] += t[0]
        sn[1] += t[1]
    return (cs[0], cs[1] + tails[0]), (sn[0], sn[1] + tails[1])


class Balls:
    """the TRUE coefficient sequences from the root disks, by ball arithmetic"""

    def __init__(self, mach):
        self.mach = mach
        rad0 = 10 ** 15                                           # delta = 1e-35 at scale 1e50
        self.reps = []
        for (a, b), (contracting, az, vz, mult) in zip(mach.centres, mach.pairs):
            D = taylor_shift((a, b))
            # p'(r) for r in the disk: p'(z) + sum_{k>=2} k c_k h^(k-1), |h| <= delta
            tail = Fraction(0)
            for k in range(2, DEG + 1):
                if D[k] != (0, 0):
                    tail += k * Fraction(abs_upper(D[k]), E ** (DEG - k)) * DELTA ** (k - 1)
            sc = 10 ** (DEG * 40 - 40 - 50)                     # D_1 / E^30 at scale Q = D_1 / 10^1150
            dp = ((2 * D[1][0] + sc) // (2 * sc), (2 * D[1][1] + sc) // (2 * sc), 1 + _ceil_div((tail * Q).numerator, (tail * Q).denominator))
            invdp = cb_inv(dp)
            root = (a * 10 ** 10, b * 10 ** 10, rad0)
            if contracting:
                base, coef = root, invdp
            else:
                base = cb_inv(root)
                coef = cb_neg(cb_mul(base, invdp))
            self.reps.append(dict(contracting=contracting, root=root, invdp=invdp, base=base, coef=coef, mult=mult,
                                  az=az, vz=vz))
        lo, hi = mach.lo0, mach.hi0
        C0 = {m: [0, 0] for m in range(lo, hi + 1)}
        for rp in self.reps:
            v = rp['coef']
            rng = range(-1, lo - 1, -1) if rp['contracting'] else range(0, hi + 1)
            for m in rng:
                C0[m][0] += rp['mult'] * v[0]
                C0[m][1] += rp['mult'] * v[2]
                v = cb_mul(v, rp['base'])
        self.C0 = C0
        self.C1 = {m: [C0[m + 3][0] - C0[m][0] + C0[m - 1][0], C0[m + 3][1] + C0[m][1] + C0[m - 1][1]] for m in mach.c1}
        al = self.reps[5]
        self.a = al['base']
        a3 = cb_mul(cb_mul(self.a, self.a), self.a)
        self.u = [al['coef'], cb_mul(al['coef'], cb_add(a3, (-Q, 0, 0), al['root']))]
        self.pi = pi_ball()


def _dec_q(x):
    """ulps of a decimal (Fraction) at scale Q, exactly (all decimals used are multiples of 1/Q)"""
    v = Fraction(x) * Q
    assert v.denominator == 1
    return v.numerator


# ---------------------------------------------------------------- the decision

_MACHINES = {}


def get_machine(centres):
    key = tuple(centres)
    if key not in _MACHINES:
        _MACHINES[key] = Machine(centres)
    return _MACHINES[key]


def parse_printed(tex):
    ns = nows(tex)
    g = lambda pat: int(re.search(pat, ns).group(1))  # noqa: E731
    out = {'R': g(r'\|\\mathcalR\|&=(\d+)'), 'wsum': g(r'\\sum_\{\\mathcalR\}\|w\|&=(\d+)/W'),
           'wsum_small': g(r'k<50\}\}\|w\|&=(\d+)/W'), 'WSc': g(r'WS\\widetildec&=(\d+)'),
           'W2Sv': g(r'W\^2S\\widetildev&=(\d+)'), 'W2ST': g(r'W\^2S\\widetildeT&=(\d+)')}
    mb = re.search(r'\\label\{cert:B-output\}\\begin\{gathered\}(\d+),\\\\(\d+),\\\\(\d+)\.', ns)
    out['B2'], out['B1'], out['B0'] = (int(mb.group(i)) for i in (1, 2, 3))
    ms = re.search(r'k&([\d&]+)\\\\s&([\d&]+)\\\\Ww_\{ks\}&([-\d&]+)\\end', ns)
    ks, ss, ws = ([int(x) for x in ms.group(i).split('&')] for i in (1, 2, 3))
    out['small_rows'] = list(zip(ks, ss, ws))
    return out


def decide(src=None, centres=None, printed=None, parts=('roots', 'products', 'balls')):
    src = src or Sources()
    checks = []
    claim_fail = []

    def c(name, ok, detail='', kind='claim'):
        check(checks, name, ok, detail)
        if not ok and kind == 'claim':
            claim_fail.append(name)

    cert = src.text(CERT)
    nptex = src.text(NP)
    ncert, nnp = nows(cert), nows(nptex)
    centres = centres or parse_table(cert)
    printed = printed or parse_printed(cert)
    p = p_coeffs()
    value = {}

    # ---------------- A. the polynomial
    c('A. the polynomial as printed in nonpisot.tex:15 and certificate.tex:21',
      'p(t)=t^{31}-2t^{30}+\\sum_{j=0}^{9}(t^{3j+1}-t^{3j})' in nnp and 'p(t)=\\sum_{j=0}^{9}(-t^{3j}+t^{3j+1})-2t^{30}+t^{31}' in ncert)
    c('A. (t^2+t+1) p(t) = t^33 - t^32 - t^31 - t^30 - 1 (nonpisot.tex:20)',
      pmul([1, 1, 1], p) == [-1] + [0] * 29 + [-1, -1, -1, 1] and '(t^2+t+1)p(t)=t^{33}-t^{32}-t^{31}-t^{30}-1' in nnp)
    c('A. p is monic in Z[t] with |p(0)| = 1', p[-1] == 1 and abs(p[0]) == 1)
    if 'roots' in parts:
        irr = rabin_irreducible_mod(p, 67)
        c('A. (not claimed; a second route to non-Pisot) p mod 67 is irreducible (Rabin), so p is irreducible over Q', irr,
          'the paper avoids irreducibility (nonpisot.tex:95)', kind='bound')

    # ---------------- B. the root disks
    if 'roots' in parts:
        disks = all_disks(centres)
        c('B. the table gives 16 centres, one real, hence 31 disks', len(centres) == 16 and len(disks) == 31
          and sum(1 for a, b in centres if b == 0) == 1 and centres[0][1] == 0, '%d centres' % len(centres))
        rou = [rouche_one_root(taylor_shift(z)) for z in disks]
        c('B. Rouche (exact Taylor coefficients): exactly one root in each of the 31 disks', all(rou),
          '%d / 31 disks pass' % sum(rou))
        d2min = min((a - a2) ** 2 + (b - b2) ** 2 for i, (a, b) in enumerate(disks) for (a2, b2) in disks[i + 1:])
        c('B. the 31 disks are pairwise disjoint (min centre distance > 2 delta)', Fraction(d2min, E * E) > 4 * DELTA ** 2,
          'min |z - z\'| = %.3e' % (math.sqrt(d2min) / E))
        c('B. printed: |z - z\'| > .01 for distinct centres, including conjugates (certificate.tex:72-73)',
          Fraction(d2min, E * E) > dec('.01') ** 2)
        c('B. the 30 nonreal disks miss the real axis (|Im z| > delta)', all(Fraction(abs(b), E) > DELTA for a, b in disks if b))
        # the paper's printed residual inequalities, cert:residual (certificate.tex:60-63), at every displayed centre
        res_ok, sum3 = True, sum(abs(x) * 3 ** j for j, x in enumerate(p))
        for (a, b) in centres:
            D = taylor_shift((a, b))
            pinf = max(abs(D[1][0]), abs(D[1][1]))           # ||p'(z)||_inf * E^30
            p1 = abs(D[0][0]) + abs(D[0][1])                 # ||p(z)||_1 * E^31
            res_ok &= (a * a + b * b < 4 * E * E) and pinf > E ** 30 and 2 * 10 ** 35 * p1 < E * pinf
        c('B. printed (cert:residual): |z| < 2, ||p\'(z)||_inf > 1, 2e35 ||p(z)||_1 < ||p\'(z)||_inf at every centre', res_ok)
        c('B. printed: sum_j |p_j| 3^j < 1e17 (certificate.tex:84)', sum3 < 10 ** 17, str(sum3))
        ab, bb = centres[0]
        aa, ba = centres[5]
        za2 = Fraction(aa * aa + ba * ba, E * E)
        c('B. printed (cert:center-bounds): 1.83928 < z_beta < 1.83929', dec('1.83928') < Fraction(ab, E) < dec('1.83929')
          and '1.83928<z_\\beta<1.83929' in ncert)
        c('B. printed (cert:center-bounds): 1.0002090 < |z_alpha|^2 < 1.0002093', dec('1.0002090') < za2 < dec('1.0002093')
          and '1.0002090<|z_\\alpha|^2<1.0002093' in ncert, '%.10f' % float(za2))
        others = [z for i, z in enumerate(centres) if i not in (0, 5)]
        c('B. printed (cert:center-bounds): |z| < .9939 at the 14 other centres',
          all(Fraction(a * a + b * b, E * E) < dec('.9939') ** 2 for a, b in others))
        # Prop. np:roots from the disks: |r| within delta of |z|; sqrt bounded by 2 where needed
        beta_lo, beta_hi = Fraction(ab, E) - DELTA, Fraction(ab, E) + DELTA
        c('B. Prop np:roots: 1.8392 < beta < 1.8393 (beta in the real disk)', dec('1.8392') < beta_lo and beta_hi < dec('1.8393')
          and '1.8392<\\beta<1.8393' in nnp)
        c('B. Prop np:roots: 1.0002089 < |alpha|^2 < 1.0002094 (|z_a|^2 - 4d > lower, |z_a|^2 + 4d + d^2 < upper)',
          za2 - 4 * DELTA > dec('1.0002089') and za2 + 4 * DELTA + DELTA ** 2 < dec('1.0002094')
          and '1.0002089<|\\alpha|^2<1.0002094' in nnp)
        c('B. Prop np:roots: |alpha|^-1 < .9999 (|alpha|^2 > 1.0002089 > 1/.9999^2)', dec('1.0002089') > 1 / dec('.9999') ** 2)
        c('B. Prop np:roots: Im alpha > 0 (z_alpha has Im > delta)', Fraction(ba, E) > DELTA)
        c('B. Prop np:roots: the other 28 roots have modulus < .994 (|z| + delta < .994)',
          all(Fraction(a * a + b * b, E * E) < (dec('.994') - DELTA) ** 2 for a, b in others))
        c('B. outside the unit circle exactly beta, alpha, conj(alpha) (|z| - delta > 1 for those three)',
          beta_lo > 1 and za2 - 4 * DELTA > 1)
        c('B. the paper\'s non-Pisot step: 1.0002094 * .994 < 1 (nonpisot.tex:65)', dec('1.0002094') * dec('.994') < 1
          and '1.0002094\\cdot0.994<1' in nnp)

        # ---------------- C. the second way: Sturm and Schur-Cohn on the Graeffe square
        tp = pmul(pmul(pmul([-1, 2], [-3, 1]), [1, 5]), [1, 0, 4])      # roots 1/2, 3, -1/5, +-i/2
        tq = graeffe_any(tp)
        c('C. self-test of both tools on (2t-1)(t-3)(5t+1)(4t^2+1): Sturm finds 3 real roots, 1 in (0, 1]; '
          'Schur-Cohn finds 4 roots with |r| < 1, 1 with |r|^2 < 1/5, 4 with |r|^2 < 1/3',
          sturm_count(sturm_chain(tp), None, None) == 3 and sturm_count(sturm_chain(tp), 0, 1) == 1
          and schur_cohn_inside(tp) == 4 and count_sq_modulus_below(tq, Fraction(1, 5)) == 1
          and count_sq_modulus_below(tq, Fraction(1, 3)) == 4, kind='bound')
        ch = sturm_chain(p)
        nreal = sturm_count(ch, None, None)
        nbr = sturm_count(ch, dec('1.8392'), dec('1.8393'))
        c('C. Sturm: p is squarefree (last chain term a nonzero constant) and has exactly one real root',
          len(ch[-1]) == 1 and nreal == 1, 'chain length %d' % len(ch))
        c('C. Sturm: that root lies in (1.8392, 1.8393]', nbr == 1)
        Qg = graeffe(p)
        counts = {}
        for name, cc, want in (('.994^2', dec('.994') ** 2, 28), ('1.0002089', dec('1.0002089'), 28),
                               ('1.0002094', dec('1.0002094'), 30), ('1.8392^2', dec('1.8392') ** 2, 30),
                               ('1.8393^2', dec('1.8393') ** 2, 31)):
            counts[name] = count_sq_modulus_below(Qg, cc)
            c('C. Schur-Cohn on the Graeffe square: #{r : |r|^2 < %s} = %d' % (name, want), counts[name] == want,
              str(counts[name]))
        value['schur_cohn_counts'] = counts

    # ---------------- D. the rational algorithm and its printed integers
    if 'products' in parts or 'balls' in parts:
        mach = get_machine(centres)
    if 'products' in parts:
        sums = mach.moments()
        for key, label in (('R', '|R| = 753'), ('wsum', '|X|+|Y|+sum|w| = 198442946/W'),
                           ('wsum_small', '|X|+|Y|+sum_{k<50}|w| = 11816095/W'), ('WSc', 'W S c~'),
                           ('W2Sv', 'W^2 S v~'), ('W2ST', 'W^2 S T~')):
            c('D. cert:exact-output: %s equals the printed integer' % label, sums[key] == printed[key],
              'computed %d, printed %d' % (sums[key], printed[key]))
        small = sorted((k, s, w) for w, k, s in sums['rows'] if k < 50)
        c('D. the printed small-row table (certificate.tex:558-562) equals the computed nonzero rows with k < 50',
          small == sorted(printed['small_rows']), str(small))
        c0, c1 = mach.c0, mach.c1
        mx = max(max(abs(v) for v in c0.values()), max(abs(v) for v in c1.values()))
        c('D. cert:array-bounds: max |c_A(m)| < .847 and .8460 < max |c_A(m)| < .8462',
          Fraction(mx, S) < dec('.847') and dec('.8460') < Fraction(mx, S) < dec('.8462'), '%.6f' % (mx / S))
        mx20 = max(abs(c0[m]) for m in range(-20, mach.hi0 + 1))
        c('D. cert:array-bounds: max_{m >= -20} |c_0(m)| < .018', Fraction(mx20, S) < dec('.018'), '%.6f' % (mx20 / S))
        um = max(u[0] ** 2 + u[1] ** 2 for u in mach.u)
        c('D. cert:array-bounds: max_A |u\'_A| < .0087 (squared moduli)', Fraction(um, S * S) < dec('.0087') ** 2,
          '%.6f' % math.sqrt(um / S / S))
        c('D. stored pairs: |a_z| < 1 and |v_z| <= 1 (certificate.tex:268-270)',
          all(az[0] ** 2 + az[1] ** 2 < S * S and vz[0] ** 2 + vz[1] ** 2 <= S * S for _, az, vz, _ in mach.pairs))
        c('D. |a\'| > .99 (certificate.tex:353)', Fraction(mach.ap[0] ** 2 + mach.ap[1] ** 2, S * S) > dec('.99') ** 2)
        c('D. rounded angles |x| <= 13, |y| <= 170 on every table entry (certificate.tex:299)',
          all(abs(X) <= 13 * S and abs(Y) <= 170 * S for X, Y in mach.xy))
        B2, B1, B0, _ = mach.b_bounds(sums['rows'])
        value['B_numerators'] = (B2, B1, B0)
        for nm, got in (('B2', B2), ('B1', B1), ('B0', B0)):
            c('D. cert:B-output: max final numerator of %s equals the printed integer' % nm, got == printed[nm],
              'computed %d, printed %d' % (got, printed[nm]))
        c('D. B-output x 1e6/S <= 10862, 14732, 3156, hence B_2 < .011, B_1 < .015, B_0 < .0032 (cert:B-bounds)',
          _ceil_div(B2 * 10 ** 6, S) <= 10862 and _ceil_div(B1 * 10 ** 6, S) <= 14732 and _ceil_div(B0 * 10 ** 6, S) <= 3156
          and Fraction(B2, S) < dec('.011') and Fraction(B1, S) < dec('.015') and Fraction(B0, S) < dec('.0032'))
        # the printed decimal consequences
        ct = Fraction(sums['WSc'], W * S)
        vt = Fraction(sums['W2Sv'], W * W * S)
        Tt = Fraction(sums['W2ST'], W * W * S)
        Dl = dec('5e-6')
        c('D. 211810 < 1e9 c~ < 211820, 143910 < 1e9 v~ < 143930, 105300 < 1e9 T~ < 105310 (certificate.tex:493-495)',
          211810 < 10 ** 9 * ct < 211820 and 143910 < 10 ** 9 * vt < 143930 and 105300 < 10 ** 9 * Tt < 105310)
        c('D. |G| <= weight sum < .199 (nonpisot.tex:219-221)', Fraction(sums['wsum'], W) < dec('.199')
          and '=\\frac{198442946}{10^9}<x_*:=0.199' in nnp)
        c('D. E Re(Z G) >= c~ - .199 Delta > .0002108205 > .000210 (certificate.tex:502)',
          ct - dec('.199') * Dl > dec('.0002108205') > dec('.000210'))
        c('D. E|G|^2 <= v~ + .199^2 Delta < .000144119 < .000145 (certificate.tex:503)',
          vt + dec('.199') ** 2 * Dl < dec('.000144119') < dec('.000145'))
        c('D. T <= T~ + .199^2 Delta < .000116 and .011^2 > .000116, so sqrt T < .011 (certificate.tex:521)',
          Tt + dec('.199') ** 2 * Dl < dec('.000116') and dec('.011') ** 2 > dec('.000116'))
        c('D. small-row absolute weight 11816095/W < .012 (certificate.tex:523)', Fraction(sums['wsum_small'], W) < dec('.012'))
        fin = dec('.000116') * dec('.011') + 2 * dec('.012') * dec('.011') * dec('.015') + dec('.012') ** 2 * dec('.0032')
        c('D. the final sum .000116(.011) + 2(.012)(.011)(.015) + .012^2(.0032) = .0000056968 < .000007 (certificate.tex:667-672)',
          fin == dec('.0000056968') and fin < dec('.000007'), str(fin))
        value['rounded_products'] = sum(1 for k in mach.cache if k not in ('sums',))
        value.update({'R': sums['R'], 'c~': '%.12g' % float(ct), 'v~': '%.12g' % float(vt), 'T~': '%.12g' % float(Tt)})

        # ---------------- E. the arithmetic of the printed error budget
        A30 = sum(Fraction((-1) ** i, (2 * i + 1) * 5 ** (2 * i + 1)) for i in range(30))
        A10 = sum(Fraction((-1) ** i, (2 * i + 1) * 239 ** (2 * i + 1)) for i in range(10))
        rem = Fraction(16, 61 * 5 ** 61) + Fraction(4, 21 * 239 ** 21)
        c('E. Machin: |pi\' - (16 A_30(1/5) - 4 A_10(1/239))| + 16/(61 5^61) + 4/(21 239^21) < 1/S (certificate.tex:129-135)',
          abs(Fraction(PI_NUM, S) - (16 * A30 - 4 * A10)) + rem < Fraction(1, S))
        pp = sum(j * (j - 1) * abs(x) * dec('2.001') ** (j - 2) for j, x in enumerate(p) if j >= 2)
        c('E. |p\'\'(z)| <= sum j(j-1)|p_j| 2.001^(j-2) < 4e13 for |z| < 2.001 (certificate.tex:263)', pp < 4 * 10 ** 13,
          '%.4e' % float(pp))
        c('E. 4e13 * 1e-35 <= 4e-22 (p\' moves less than 4e-22 within a disk, certificate.tex:265)',
          4 * 10 ** 13 * DELTA <= dec('4e-22'))
        c('E. 1 - .9999^2 > .00019 (certificate.tex:363)', 1 - dec('.9999') ** 2 > dec('.00019'))
        c('E. 3.142 * 4 * .00871 < .11 (certificate.tex:379)', dec('3.142') * 4 * dec('.00871') < dec('.11'))
        Pb = sum(dec('.11') ** d / (f * (1 - dec('.9999') ** d)) for d, f in ((2, 2), (4, 12), (6, 45)))
        c('E. P <= .11^2/(2(1-.9999^2)) + .11^4/(12(1-.9999^4)) + .11^6/(45(1-.9999^6)) < 31 (certificate.tex:384-386)',
          Pb < 31, '%.4f' % float(Pb))
        c('E. .1 (.11)^8 / (1 - .9999^8) < 3e-6 (certificate.tex:419)', dec('.1') * dec('.11') ** 8 / (1 - dec('.9999') ** 8) < dec('3e-6'))
        # the log-cos lemma's constants (certificate.tex:403-413), y = z^2 <= .0121, h <= y/2
        hmax = dec('.0121') / 2
        y = [Fraction(0), Fraction(1, 2), Fraction(-1, 24), Fraction(1, 720)]       # h_0 as a polynomial in y
        h2, h3 = pmul(y, y), pmul(pmul(y, y), y)
        ser = [Fraction(0)] * len(h3)
        for i, x in enumerate(y):
            ser[i] += x
        for i, x in enumerate(h2):
            ser[i] += x / 2
        for i, x in enumerate(h3):
            ser[i] += x / 3
        high = sum(abs(x) for x in ser[4:])
        c('E. log-cos lemma: h0 + h0^2/2 + h0^3/3 = y/2 + y^2/12 + y^3/45 + (terms of degree >= 4 with sum|coef| < .03)',
          ser[1:4] == [Fraction(1, 2), Fraction(1, 12), Fraction(1, 45)] and high < dec('.03'), str(high))
        c('E. log-cos lemma: h^4/(4(1-h)) < .016 y^4 (h <= y/2 <= .00605) and (1 + h + h^2)/40320 < .00004',
          1 / (64 * (1 - hmax)) < dec('.016') and (1 + hmax + hmax ** 2) / 40320 < dec('.00004'))
        c('E. log-cos lemma: .016 + .00004 + .03 <= .1', dec('.016') + dec('.00004') + dec('.03') <= dec('.1'))
        c('E. negative end: .994^2996 < 3e-8 (certificate.tex:331)', dec('.994') ** 2996 < dec('3e-8'))
        c('E. negative end: 3.142^2 200^2/2 * .994^5994/(1 - .994^2) < 5e-8 (certificate.tex:328-329)',
          dec('3.142') ** 2 * 200 ** 2 / 2 * dec('.994') ** 5994 / (1 - dec('.994') ** 2) < dec('5e-8'))
        c('E. negative end: two coefficients with three shifts each, 2 * 3 * 32 <= 200 (certificate.tex:321-323)', 2 * 3 * 32 <= 200)
        c('E. positive end: 3.142 * 8 * .545^100 / (1 - .545) < 1e-20 (certificate.tex:337)',
          dec('3.142') * 8 * dec('.545') ** 100 / (1 - dec('.545')) < dec('1e-20'))
        c('E. positive end: 1/beta < 1/1.8392 < .545', 1 / dec('1.8392') < dec('.545'))
        n_f, eps = 5100, dec('1e-15')
        growth = 1 / (1 - n_f * eps)                       # (1 + eps)^n <= e^(n eps) <= 1/(1 - n eps)
        c('E. finite factors: 2 * 5100 * 1e-15 * (1+1e-15)^5100 + 5100 * (1/2S) * (1+1e-15)^5100 < 3e-11 (certificate.tex:312-316)',
          (2 * n_f * eps + n_f * Fraction(1, 2 * S)) * growth < dec('3e-11'))
        c('E. the stated errors 3e-11 + 5e-8 + 1e-20 + 4e-9 + 3e-6 < 3.055e-6 < Delta = 5e-6 (certificate.tex:424-425)',
          dec('3e-11') + dec('5e-8') + dec('1e-20') + dec('4e-9') + dec('3e-6') < dec('3.055e-6') < Dl)
        c('E. a paired factor from table entries within 1e-16: 1e-16 (2 + 2(1 + 1e-16)) + 1/(2S) < 1e-15',
          dec('1e-16') * (2 + 2 * (1 + dec('1e-16'))) + Fraction(1, 2 * S) < dec('1e-15'))
        u_t = dec('3.142') * (dec('.018') + dec('7e-20'))
        c('E. tangent bound: u = 3.142(.018 + 7e-20), tan u <= u/(1 - u^2/2) <= t = .06 (certificate.tex:533-537)',
          u_t / (1 - u_t ** 2 / 2) <= dec('.06'))
        t_ = dec('.06')
        c('E. B-factor constants: (1-t^2)^(-1/2) <= 1.002, (1-t^2)^(-1) <= 1.004, 1 + t^2 = 1.0036, 2t = .12 (certificate.tex:577-578)',
          dec('1.002') ** 2 * (1 - t_ ** 2) >= 1 and dec('1.004') * (1 - t_ ** 2) >= 1 and 1 + t_ ** 2 == dec('1.0036') and 2 * t_ == dec('.12'))

    # ---------------- F. a posteriori with this audit's balls
    if 'balls' in parts:
        bl = Balls(mach)
        piQ, pir = bl.pi
        c('F. own pi enclosure: |pi\' - pi| < 1/S and pi < 3.142', abs(PI_NUM * 10 ** 20 - piQ) + pir < 10 ** 20
          and piQ + pir < _dec_q('3.142'), kind='bound')
        ok_a = ok_v = ok_c = True
        for rp in bl.reps:
            az, vz = rp['az'], rp['vz']
            ok_a &= cb_dist_up(rp['base'], az[0] * 10 ** 20, az[1] * 10 ** 20) < 2 * 10 ** 20
            ok_v &= cb_dist_up(rp['coef'], vz[0] * 10 ** 20, vz[1] * 10 ** 20) < 10 ** 29
            ok_c &= cb_abs_up(rp['coef']) < _dec_q('1.001')
        c('F. stored pairs vs the true roots: base errors < 2/S, coefficient errors < 1e-21 (certificate.tex:266-268)',
          ok_a and ok_v, kind='bound')
        c('F. the exact coefficients have modulus < 1.001 (certificate.tex:270)', ok_c, kind='bound')
        e0 = max(abs(mach.c0[m] * 10 ** 20 - v[0]) + v[1] for m, v in bl.C0.items())
        e1 = max(abs(mach.c1[m] * 10 ** 20 - v[0]) + v[1] for m, v in bl.C1.items())
        c('F. cert:coefficient-errors: |c_0(m) - C_0(m)| < 7e-20 on all %d computed entries' % len(bl.C0),
          e0 < 7 * 10 ** 30, 'max %.3e' % (e0 / Q), kind='bound')
        c('F. cert:coefficient-errors: |c_1(m) - C_1(m)| < 2.1e-19 on all %d computed entries' % len(bl.C1),
          e1 < 21 * 10 ** 30, 'max %.3e' % (e1 / Q), kind='bound')
        c('F. |a| > .99 for a = 1/alpha (certificate.tex:353)', cb_abs_lo(bl.a) > _dec_q('.99'), kind='bound')
        c('F. |u_A| <= .00871 for both types (certificate.tex:354)', all(cb_abs_up(u) <= _dec_q('.00871') for u in bl.u), kind='bound')
        c('F. |u\'_A - u_A| < 5e-21 (certificate.tex:353-354)',
          all(cb_dist_up(u, mu[0] * 10 ** 20, mu[1] * 10 ** 20) < 5 * 10 ** 29 for u, mu in zip(bl.u, mach.u)), kind='bound')
        sI = sum(2 * cb_abs_up(rp['invdp']) for rp in bl.reps if rp['contracting'])
        c('F. sum_{r in I} |1/p\'(r)| <= 32, so |C_0(m)| <= 32(.994)^(-1-m) for m < 0 (certificate.tex:319)',
          sI <= 32 * Q, '%.4f' % (sI / Q), kind='bound')
        rb = bl.reps[0]
        cf1 = cb_mul(rb['coef'], cb_add(cb_mul(cb_mul(rb['base'], rb['base']), rb['base']), (-Q, 0, 0), rb['root']))
        c('F. beta: base 1/beta < .545, type-0 and type-1 coefficients of modulus <= 4 (certificate.tex:334-335)',
          cb_abs_up(rb['base']) < _dec_q('.545') and cb_abs_up(rb['coef']) <= 4 * Q and cb_abs_up(cf1) <= 4 * Q,
          '|coef0| = %.3e' % (cb_abs_up(rb['coef']) / Q), kind='bound')
        c('F. max_{-20 <= n <= 2000} |C_0(n)| < .018 (true values; the tangent bound for big rows)',
          max(abs(bl.C0[n][0]) + bl.C0[n][1] for n in range(-20, 2001)) < _dec_q('.018'), kind='bound')
        # trig tables: |g_A(m) - cos(pi C_A(m))| < 1e-16, same for sine
        tails_small, tails_big = _trig_tail(Fraction(3), 36), _trig_tail(Fraction(12), 64)
        worst = 0
        for A, Cb in enumerate((bl.C0, bl.C1)):
            for m, (cc, cr) in Cb.items():
                th = rb_mul(bl.pi, (cc, cr))
                assert abs(th[0]) + th[1] < 3 * Q
                co, si = cos_sin_ball(th, 36, tails_small)
                worst = max(worst, abs(mach.g[A][m] * 10 ** 20 - co[0]) + co[1], abs(mach.h[A][m] * 10 ** 20 - si[0]) + si[1])
        c('F. every table entry g_A(m), h_A(m) is within 1e-16 of cos, sin(pi C_A(m)) (certificate.tex:308-309)',
          worst < 10 ** 34, 'max %.3e' % (worst / Q), kind='bound')
        # the B-product inputs: |g(V'(m)) - cos(pi V(m))| <= 1e-15 for every sequence used
        sums = mach.moments()
        seqs = mach.small_sequences(sums['rows'])
        fb = [('0', lambda m: (0, 0)), ('t1', lambda m: tuple(bl.C1[m + 33]))]
        for w, k, s in sums['rows']:
            if k < 50:
                fb.append(('r', (lambda kk, ss: lambda m: ((1 - 2 * ss) * bl.C0[m + kk][0], bl.C0[m + kk][1]))(k, s)))
        Vs = [((lambda m: 2 * mach.c0[m]), (lambda m: (2 * bl.C0[m][0], 2 * bl.C0[m][1])), -70)]
        for (_, f), (_, fbb) in zip(seqs, fb):
            Vs.append(((lambda f: lambda m: 2 * mach.c0[m] + f(m))(f),
                       (lambda fbb: lambda m: (2 * bl.C0[m][0] + fbb(m)[0], 2 * bl.C0[m][1] + fbb(m)[1]))(fbb), -70))
        for i in range(len(seqs)):
            for j in range(i, len(seqs)):
                f, g = seqs[i][1], seqs[j][1]
                fbi, fbj = fb[i][1], fb[j][1]
                Vs.append(((lambda f, g: lambda m: 2 * mach.c0[m] + f(m) + g(m))(f, g),
                           (lambda a, b: lambda m: (2 * bl.C0[m][0] + a(m)[0] + b(m)[0], 2 * bl.C0[m][1] + a(m)[1] + b(m)[1]))(fbi, fbj), -200))
        worstB, nB, mxX, mxY = 0, 0, 0, 0
        for Vc, Vt, lo in Vs:
            for m in range(lo, 1):
                G, Hh, X, Y = gh(Vc(m))
                mxX, mxY = max(mxX, abs(X)), max(mxY, abs(Y))
                th = rb_mul(bl.pi, Vt(m))
                assert abs(th[0]) + th[1] < 12 * Q          # the range the Taylor remainder below is valid on
                co, si = cos_sin_ball(th, 64, tails_big)
                worstB = max(worstB, abs(G * 10 ** 20 - co[0]) + co[1], abs(Hh * 10 ** 20 - si[0]) + si[1])
                nB += 1
        c('F. rounded angles of the B-product inputs (sums of up to four coefficients): |x| <= 13, |y| <= 170 (certificate.tex:297-299)',
          mxX <= 13 * S and mxY <= 170 * S, 'max |x| = %.3f, |y| = %.3f' % (mxX / S, mxY / S))
        c('F. every input of the B products: |g(V\'(m))| and |h(V\'(m))| within 1e-15 of |cos|, |sin|(pi V(m)) (certificate.tex:579)',
          worstB < 10 ** 35, '%d inputs, max %.3e' % (nB, worstB / Q), kind='bound')

    ok = all(x['pass'] for x in checks)
    verdict = 'CERTIFIED' if ok else ('REFUTED' if claim_fail else 'REFUSED')
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: the root location of the degree-31 polynomial (all 31 roots isolated, '
                       'beta in (1.8392, 1.8393) the only real root, alpha the only other expanding pair, beta not Pisot) '
                       'and every printed integer of the rational moment certificate with its coefficient and '
                       'trigonometric inputs; NOT the singularity of nu_{1/beta}, which rests on the analytic argument'}


def forge():
    """each must NOT certify"""
    src = Sources()
    cert = src.text(CERT)
    centres = parse_table(cert)
    printed = parse_printed(cert)
    out = []
    moved = [(centres[0][0] + 10 ** 6, 0)] + centres[1:]
    r = decide(centres=moved, parts=('roots',))
    out.append(('the real centre moved by 1e-34 (ten radii) along the axis', r['verdict']))
    moved = list(centres)
    moved[5] = (centres[5][0], centres[5][1] - 10 ** 7)
    r = decide(centres=moved, parts=('roots',))
    out.append(('the alpha centre moved by 1e-33 in its imaginary part', r['verdict']))
    pr = dict(printed)
    pr['WSc'] = printed['WSc'] + 1
    r = decide(printed=pr, parts=('products',))
    out.append(('W S c~ printed one unit larger', r['verdict']))
    pr = dict(printed)
    pr['small_rows'] = [(k, s, w + (1 if k == 40 else 0)) for k, s, w in printed['small_rows']]
    r = decide(printed=pr, parts=('products',))
    out.append(('the k = 40 small-row weight printed as 1483339', r['verdict']))
    pr = dict(printed)
    pr['B0'] = printed['B0'] - 1
    r = decide(printed=pr, parts=('products',))
    out.append(('the B_0 numerator printed one unit smaller', r['verdict']))
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
