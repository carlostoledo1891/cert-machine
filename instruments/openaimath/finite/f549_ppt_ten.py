"""F-549 — "Entanglement with zero distillable secret key in local dimension ten" (openai/math family 272).

THE CLAIM. sections/introduction.tex:80-89 (Theorem thm:main-pair): "There are explicitly specified PPT maps
Phi_1, Phi_2 : M_10 -> M_10 for which Z = J(Phi_2 o Phi_1) is nonzero and its range contains no nonzero product vector in
C^10 (x) C^10. In particular, the composition Phi_2 o Phi_1 is not entanglement breaking." introduction.tex:101-105
(Theorem thm:main-channel): "There is an explicitly specified trace-preserving PPT channel Theta : M_21 -> M_21 whose
square Theta o Theta is not entanglement breaking." introduction.tex:45-60 (Theorem thm:main-state): rho = Z / tr Z is
entangled, its range has no product vector, and K_D(rho) = 0 with a 1/5 trace-norm gap. In full: there are explicit PPT maps Phi_1, Phi_2 : M_10 -> M_10
(sections/geometry.tex:104-106, eq:phi-pair, built from the integer 6x4 matrices M_0..M_3 of sections/certificate.tex:14-30,
eq:explicit-matrices, through L(E_ij) = M_i^T M_j, eq:L line 35) such that Z = J(Phi_2 o Phi_1) is nonzero and its range
contains no nonzero product vector — so Phi_2 o Phi_1 is not entanglement breaking and the unrestricted two-map
PPT-composition conjecture fails; rho = Z / tr Z is entangled with K_D(rho) = 0; and the trace-preserving PPT channel
Theta on M_21 of sections/applications.tex:78-81 (eq:channel) has a square that is not entanglement breaking.

WHAT IS DECIDED HERE, exactly (Fractions; Q(sqrt2) as pairs of Fractions with an exact sign test; residues mod p only
where a nonzero residue proves an integer or a polynomial factorisation fact):
  A. The pencil. M_0..M_3 are parsed from the LaTeX. M_i^T M_j = M_j^T M_i for all i, j (eq:block-symmetry); the Choi
     matrix J(L) and its partial transpose are PSD (so L is PPT, decided on the Choi matrix, not through the paper's
     Kraus argument); L = sum_r Q_r . Q_r^* with the paper's Q_r; L(P_e0) = 36 I_4.
  B. The twenty rank-loss directions. The 15 maximal minors of M(1,t) are expanded; D, H (eq:DH) in the paper's monomial
     order; det H is computed over Z and its residues mod 41, 131, 139 compared with the table; C = -H^-1 D, N (eq:N)
     and f = det(zI - N) are computed over Q (Hessenberg reduction, cross-checked by Faddeev-LeVerrier — not the
     paper's Newton-identities-mod-p route); f is checked p-integral at 41, 131, 139, its reductions compared
     coefficient by coefficient with verification/certificate-output.txt, every d_p(k) = deg gcd(fbar, z^(p^k) - z),
     k = 1..20, recomputed and compared, and the factor degrees found by an independent distinct-degree factorisation
     after a squarefree test (41: [20]; 131: [1,2,17]; 139: [1,19]).
     Exactly twenty directions, by a route that does not use the paper's Lemma lem:six-bilinear (Krull) nor its
     irreducibility argument for ker(pi) = 0: (i) det H != 0 gives w = Cv in A = Q[t]/I, so the 20 low monomials span
     A (dim A <= 20) and no singular direction has x_0 = 0; (ii) t2, t3 are written as h2(t1), h3(t1) (solved from N)
     and every minor p_rho(z, h2(z), h3(z)) is checked to be 0 mod f in Q[z]/(f) — a surjective algebra map
     A -> Q[z]/(f), so dim A = 20 and A = Q[z]/(f); (iii) gcd(f, f') = 1 over Q, so the 20 roots lambda_j of f give
     20 distinct common zeros (1, lambda_j, h2(lambda_j), h3(lambda_j)), and there are no others (dim A = 20).
  C. The pair. U, V, K, E, S, R, R^dagger, Phi_1, Phi_2 are built literally from geometry.tex eq:UV, eq:complement,
     eq:SR, eq:phi-pair over Q(sqrt2) (all entries are real, so * = transpose); the HS adjoint is taken from its
     definition [F^dagger(E_kl)]_ij = conj [F(E_ij)]_kl. Decided: K equals the printed signed permutation and
     K = K^T = K^-1; J(Phi_1), J(Phi_2) and their partial transposes are PSD (both maps PPT); Phi_2 o Phi_1 =
     R^dagger o S o T_10 (Choi matrices equal); Z is symmetric, PSD and PPT; S(P_e00) = R(P_e00) = 36^2 I_6 and
     (e00 x e00)^* Z (e00 x e00) = 6 * 36^4 = 10,077,696 as printed; the transfer identity Z = (Phi_1^# x Phi_2)
     (Omega Omega^*) of Lemma lem:choi-transfer and the four CP conditions that put rho = Z / tr Z in the class C of
     Definition def:represented-class. THE KERNEL VECTORS (eq:kernel-vectors) are decided directly, not through the
     exterior-algebra argument: Z (xhat x xhat) is computed with x = (1, t1, t2, t3) in Q(sqrt2) (x) A, every entry
     reduced to the basis of A (degree-4 monomials through C), and found to be exactly 0 — so for each of the twenty
     points (each is an algebra map A -> C) xhat_j x xhat_j is in ker Z.
  D. The channel. A_i = Phi_i^dagger(I), c_i, F_i (eq:channel-effects), Theta (eq:channel) on M_21 built literally;
     F_i - c_i I is PSD; J(Theta) and its partial transpose are PSD (sparse exact elimination on 441 x 441); tr Theta(E_ab)
     = delta_ab for all 441 (a, b) (trace preserving); Theta(P_*) = P_*; and the corner identity eq:choi-corner
     (W0^* x W0^*) J(Theta o Theta) (W0 x W0) = c_1 c_2 Z, entry by entry.

WHAT IS NOT DECIDED HERE (theory, not the finite object):
  - The secret-key statement K_D(rho) = 0 and the 1/5 gap (Theorem thm:zero-key, sections coherence / transcripts /
    secret-key): analytic, about all admitted protocols. Only the finite input it needs — rho in the class C — is
    decided (C above).
  - "Every nonzero quadratic vanishes on at most nine of the twenty points" (Prop. prop:twenty-directions, last
    sentence). Decided here: its finite inputs — f irreducible mod 41, squarefree reductions with factor degrees
    (1,2,17) at 131 and (1,19) at 139, f p-integral at those primes, h2, h3 rational, and rank 10 of the 20 x 10
    evaluation matrix (the ten monomials of degree <= 2 are part of the basis of A, dim A = 20). Taken as theorems,
    re-read but not computed: Lemma lem:monic-local-reduction (irreducible reduction => irreducible over Q), Lemma
    lem:local-frobenius (Dedekind: a squarefree reduction gives a Galois element of that cycle type), and the
    permutation lemma (transitive + a (1,19) element + a (1,2,17) element => S_20, hence transitive on 10-subsets,
    which transports one nonzero 10 x 10 evaluation determinant to all C(20,10) = 184,756). No exhaustive check of
    the 184,756 determinants is made.
  - The step from (kernel vectors + every-ten-span) to "no product vector in ran Z" (ran Z = (ker Z)^perp, a product
    u x v in it would give two nonzero quadratics covering twenty points, 9 + 9 < 20), Lemma lem:product-range
    (product-free range => nonseparable), the Choi-matrix characterisation of entanglement breaking (HSR2003), and
    that local compression preserves separability (for Theta^2). These are short elementary arguments, re-read.
  - That this pair answers Conjecture IV.1 of CMHW2019 and Problem G of BIRS2012 as those sources state them.
  - The separate projection / combinatorial construction (sections projection.tex, combinatorial.tex) — not this row.
"""
import itertools
import os
import re
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check, det, inverse  # noqa: E402
from _poly import add as padd, const as pconst, mul as pmul, var as pvar  # noqa: E402

PAPER = 'preprints/Entanglement-with-zero-distillable-secret-key-in-local-dimension-ten-September-27-2026/'
CERT = PAPER + 'build/source/sections/certificate.tex'
GEOM = PAPER + 'build/source/sections/geometry.tex'
APPL = PAPER + 'build/source/sections/applications.tex'
INTRO = PAPER + 'build/source/sections/introduction.tex'
OUTPUT = PAPER + 'verification/certificate-output.txt'
PRIMES = (41, 131, 139)


# ---------------------------------------------------------------- Q(sqrt 2), exactly
class Q2:
    """a + b sqrt2 with a, b rational; every element used here is real, so conjugation is the identity"""
    __slots__ = ('a', 'b')

    def __init__(self, a=0, b=0):
        self.a = a
        self.b = b

    def __add__(self, o):
        return Q2(self.a + o.a, self.b + o.b)

    def __sub__(self, o):
        return Q2(self.a - o.a, self.b - o.b)

    def __neg__(self):
        return Q2(-self.a, -self.b)

    def __mul__(self, o):
        if isinstance(o, Q2):
            return Q2(self.a * o.a + 2 * self.b * o.b, self.a * o.b + self.b * o.a)
        return Q2(self.a * o, self.b * o)

    __rmul__ = __mul__

    def inv(self):
        d = self.a * self.a - 2 * self.b * self.b          # != 0 for a nonzero element: sqrt2 is irrational
        return Q2(Fraction(self.a) / d, Fraction(-self.b) / d)

    def __eq__(self, o):
        if not isinstance(o, Q2):
            o = Q2(o)
        return self.a == o.a and self.b == o.b

    __hash__ = None

    def __bool__(self):
        return self.a != 0 or self.b != 0

    def sign(self):
        a, b = self.a, self.b
        if b == 0:
            return (a > 0) - (a < 0)
        if a == 0:
            return (b > 0) - (b < 0)
        if a > 0 and b > 0:
            return 1
        if a < 0 and b < 0:
            return -1
        s = a * a - 2 * b * b                               # a, b of opposite signs: compare |a| with sqrt2 |b|
        return ((s > 0) - (s < 0)) * (1 if a > 0 else -1)

    def __repr__(self):
        return str(self.a) if self.b == 0 else '%s%+s*sqrt2' % (self.a, self.b)


ZERO = Q2()
ONE = Q2(1)
RSQ2 = Q2(0, Fraction(1, 2))       # 1/sqrt2


def zeros(n, m=None):
    return [[ZERO] * (n if m is None else m) for _ in range(n)]


def eye(n):
    return [[ONE if i == j else ZERO for j in range(n)] for i in range(n)]


def unit(n, i, j):
    A = zeros(n)
    A[i] = list(A[i])
    A[i][j] = ONE
    return A


def lift(A):
    return [[x if isinstance(x, Q2) else Q2(x) for x in row] for row in A]


def mm(A, B):
    m = len(B[0])
    out = []
    for row in A:
        acc = [ZERO] * m
        for k, a in enumerate(row):
            if a:
                Bk = B[k]
                for j in range(m):
                    if Bk[j]:
                        acc[j] = acc[j] + a * Bk[j]
        out.append(acc)
    return out


def tp(A):
    return [list(r) for r in zip(*A)]


def kron(A, B):
    nb, mb = len(B), len(B[0])
    out = [[ZERO] * (len(A[0]) * mb) for _ in range(len(A) * nb)]
    for i, ra in enumerate(A):
        for j, a in enumerate(ra):
            if a:
                for k in range(nb):
                    rk = out[i * nb + k]
                    for l2 in range(mb):
                        if B[k][l2]:
                            rk[j * mb + l2] = a * B[k][l2]
    return out


def madd(A, B, s=None):
    return [[x + (y if s is None else s * y) for x, y in zip(ra, rb)] for ra, rb in zip(A, B)]


def trace(A):
    t = ZERO
    for i in range(len(A)):
        t = t + A[i][i]
    return t


def meq(A, B):
    return all(x == y for ra, rb in zip(A, B) for x, y in zip(ra, rb))


# ---------------------------------------------------------------- maps as tables of images of matrix units
def table_of(fn, n):
    return {(i, j): fn(unit(n, i, j)) for i in range(n) for j in range(n)}


def apply(tab, X):
    out = None
    for i, row in enumerate(X):
        for j, x in enumerate(row):
            if x:
                img = tab[(i, j)]
                out = [[x * y for y in r] for r in img] if out is None else madd(out, img, x)
    if out is None:
        m = len(next(iter(tab.values())))
        out = zeros(m)
    return out


def choi(tab, n):
    """J(F) = sum_ij E_ij (x) F(E_ij): the input reference first (eq:choi-definition)"""
    m = len(tab[(0, 0)])
    J = [[ZERO] * (n * m) for _ in range(n * m)]
    for (i, j), img in tab.items():
        for k in range(m):
            for l2 in range(m):
                if img[k][l2]:
                    J[i * m + k][j * m + l2] = img[k][l2]
    return J


def adjoint(tab, n):
    """Hilbert-Schmidt adjoint from its definition: [F^dagger(E_kl)]_ij = conj [F(E_ij)]_kl (entries real here)"""
    m = len(tab[(0, 0)])
    return {(k, l2): [[tab[(i, j)][k][l2] for j in range(n)] for i in range(n)] for k in range(m) for l2 in range(m)}


def ptrans_out(J, n, m):
    """(id (x) T) J: transpose the output factor"""
    return [[J[i * m + l2][j * m + k] for j in range(n) for l2 in range(m)] for i in range(n) for k in range(m)]


def ptrans_in(J, n, m):
    """(T (x) id) J: transpose the input factor"""
    return [[J[j * m + k][i * m + l2] for j in range(n) for l2 in range(m)] for i in range(n) for k in range(m)]


def psd(M):
    """exact: is the real symmetric matrix M positive semidefinite? Returns (symmetric, psd, rank, reason).
    Schur-complement elimination on positive diagonal pivots: a_kk > 0 => (M PSD <=> Schur complement PSD);
    a_kk < 0 => not PSD; a_kk = 0 => M PSD only if row k vanishes, and then M PSD <=> M without k PSD."""
    n = len(M)
    rows = [{j: M[i][j] for j in range(n) if M[i][j]} for i in range(n)]
    for i in range(n):
        for j, v in rows[i].items():
            if not (rows[j].get(i, ZERO) == v):
                return False, False, 0, 'not symmetric at (%d,%d)' % (i, j)
    alive = set(range(n))
    rank = 0
    while alive:
        piv, best = None, None
        for k in sorted(alive):
            d = rows[k].get(k)
            if d is None:
                if any(j in alive for j in rows[k]):
                    return True, False, rank, 'zero diagonal with a nonzero off-diagonal entry in row %d' % k
                alive.discard(k)
                continue
            s = d.sign()
            if s < 0:
                return True, False, rank, 'negative pivot at %d' % k
            if best is None or len(rows[k]) < best:
                piv, best = k, len(rows[k])
        if piv is None:
            break
        prow = rows[piv]
        dinv = prow[piv].inv()
        cols = [j for j in prow if j != piv and j in alive]
        for i in cols:
            ri = rows[i]
            f = ri[piv] * dinv
            for j in cols:
                nv = ri.get(j, ZERO) - f * prow[j]
                if nv:
                    ri[j] = nv
                else:
                    ri.pop(j, None)
            ri.pop(piv, None)
        alive.discard(piv)
        rank += 1
    return True, True, rank, ''


# ---------------------------------------------------------------- polynomials over F_p (lists, low degree first)
def ptrim(a):
    while a and a[-1] == 0:
        a.pop()
    return a


def pdivmod_p(a, b, p):
    a = ptrim([x % p for x in a])
    b = ptrim([x % p for x in b])
    q = [0] * max(len(a) - len(b) + 1, 1)
    inv = pow(b[-1], p - 2, p)
    while len(a) >= len(b) and a:
        c = a[-1] * inv % p
        s = len(a) - len(b)
        q[s] = c
        for i, y in enumerate(b):
            a[s + i] = (a[s + i] - c * y) % p
        ptrim(a)
    return ptrim(q), a


def pgcd_p(a, b, p):
    a = ptrim([x % p for x in a])
    b = ptrim([x % p for x in b])
    while b:
        a, b = b, pdivmod_p(a, b, p)[1]
    inv = pow(a[-1], p - 2, p)
    return [x * inv % p for x in a]


def pmulmod_p(a, b, f, p):
    r = [0] * (len(a) + len(b) - 1) if a and b else []
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                r[i + j] += x * y
    return pdivmod_p(r, f, p)[1]


def ppowmod_p(a, e, f, p):
    r, base = [1], pdivmod_p(a, f, p)[1]
    while e:
        if e & 1:
            r = pmulmod_p(r, base, f, p)
        e >>= 1
        if e:
            base = pmulmod_p(base, base, f, p)
    return r


def gcd_degrees(fbar, p, kmax=20):
    out, r = [], [0, 1]
    for _ in range(kmax):
        r = ppowmod_p(r, p, fbar, p)                      # z^(p^k) mod fbar
        diff = list(r) + [0] * (2 - len(r))
        diff[1] -= 1
        out.append(len(pgcd_p(fbar, diff, p)) - 1)
    return out


def ddf_degrees(fbar, p):
    """squarefree test, then distinct-degree factorisation: the multiset of irreducible factor degrees"""
    deriv = [(i * c) % p for i, c in enumerate(fbar)][1:]
    sqfree = len(pgcd_p(fbar, deriv, p)) == 1
    g, d, r, degs = list(fbar), 0, [0, 1], []
    while len(g) > 1:
        d += 1
        r = ppowmod_p(r, p, fbar, p)
        diff = list(r) + [0] * (2 - len(r))
        diff[1] -= 1
        h = pgcd_p(g, diff, p)
        if len(h) > 1:
            degs += [d] * ((len(h) - 1) // d)
            g = pdivmod_p(g, h, p)[0]
        if d > len(fbar):
            break
    return sqfree, sorted(degs)


# ---------------------------------------------------------------- polynomials over Q (lists of Fractions, low first)
def qtrim(a):
    while a and a[-1] == 0:
        a.pop()
    return a


def qdivmod(a, b):
    a = qtrim([Fraction(x) for x in a])
    b = qtrim([Fraction(x) for x in b])
    q = [Fraction(0)] * max(len(a) - len(b) + 1, 1)
    while len(a) >= len(b) and a:
        c = a[-1] / b[-1]
        s = len(a) - len(b)
        q[s] = c
        for i, y in enumerate(b):
            a[s + i] -= c * y
        qtrim(a)
    return qtrim(q), a


def qgcd(a, b):
    a, b = qtrim([Fraction(x) for x in a]), qtrim([Fraction(x) for x in b])
    while b:
        a, b = b, qdivmod(a, b)[1]
    return [x / a[-1] for x in a]


def qmulmod(a, b, f):
    """product in Q[z]/(f), f monic of degree n, elements as length-n lists"""
    n = len(f) - 1
    r = [Fraction(0)] * (2 * n - 1)
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                if y:
                    r[i + j] += x * y
    for k in range(2 * n - 2, n - 1, -1):
        c = r[k]
        if c:
            for i in range(n):
                r[k - n + i] -= c * f[i]
    return r[:n]


def charpoly_hessenberg(A):
    """det(zI - A) over Q by similarity reduction to upper Hessenberg form; coefficients low degree first"""
    n = len(A)
    H = [[Fraction(x) for x in r] for r in A]
    for m in range(1, n - 1):
        piv = next((i for i in range(m, n) if H[i][m - 1] != 0), None)
        if piv is None:
            continue
        if piv != m:
            H[piv], H[m] = H[m], H[piv]
            for r in H:
                r[piv], r[m] = r[m], r[piv]
        for i in range(m + 1, n):
            if H[i][m - 1] != 0:
                u = H[i][m - 1] / H[m][m - 1]
                Hi, Hm = H[i], H[m]
                for j in range(n):
                    Hi[j] -= u * Hm[j]
                for r in H:
                    r[m] += u * r[i]
    p = [[Fraction(1)]]
    for k in range(1, n + 1):
        prev = p[k - 1]
        nk = [Fraction(0)] + prev                              # z p_{k-1}
        for i in range(len(prev)):
            nk[i] -= H[k - 1][k - 1] * prev[i]
        prod = Fraction(1)
        for i in range(k - 1, 0, -1):                        # 1-based i = k-1 .. 1
            prod *= H[i][i - 1]
            c = H[i - 1][k - 1] * prod
            if c:
                for t, y in enumerate(p[i - 1]):
                    nk[t] -= c * y
        p.append(nk)
    return p[n]


def charpoly_leverrier(A):
    n = len(A)
    A = [[Fraction(x) for x in r] for r in A]
    c = [Fraction(0)] * (n + 1)
    c[n] = Fraction(1)
    Mk = [[Fraction(0)] * n for _ in range(n)]
    for k in range(1, n + 1):
        AM = [[sum(A[i][t] * Mk[t][j] for t in range(n) if A[i][t]) for j in range(n)] for i in range(n)]
        Mk = [[AM[i][j] + (c[n - k + 1] if i == j else 0) for j in range(n)] for i in range(n)]
        AMk = [[sum(A[i][t] * Mk[t][j] for t in range(n) if A[i][t]) for j in range(n)] for i in range(n)]
        c[n - k] = -sum(AMk[i][i] for i in range(n)) / k
    return c


def qrank(rows):
    a = [[Fraction(x) for x in r] for r in rows]
    rank, col, m = 0, 0, len(a[0]) if a else 0
    while rank < len(a) and col < m:
        piv = next((i for i in range(rank, len(a)) if a[i][col] != 0), None)
        if piv is None:
            col += 1
            continue
        a[rank], a[piv] = a[piv], a[rank]
        for i in range(rank + 1, len(a)):
            if a[i][col]:
                f_ = a[i][col] / a[rank][col]
                a[i] = [x - f_ * y for x, y in zip(a[i], a[rank])]
        rank += 1
        col += 1
    return rank


def reduce_mod(fr, p):
    return fr.numerator * pow(fr.denominator, p - 2, p) % p


# ---------------------------------------------------------------- reading the published object
def parse_matrices(src):
    lines = src.lines(CERT, 14, 30)
    block = '\n'.join(lines)
    mats = {}
    for name, body in re.findall(r'M_(\d)&=\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}', block, re.S):
        rows = [r.strip() for r in body.replace('\n', ' ').split('\\\\') if r.strip()]
        mats[int(name)] = [[int(x) for x in r.split('&')] for r in rows]
    return [mats[i] for i in range(4)], lines


def parse_output(src):
    txt = [l2.strip() for l2 in src.text(OUTPUT).strip().split('\n')]
    out = {}
    for k in range(0, len(txt), 3):
        p, dh = (int(x) for x in txt[k].split())
        coeffs = [int(x) for x in txt[k + 1].strip('[]').split(',')]
        degs = [int(x) for x in txt[k + 2].strip('[]').split(',')]
        out[p] = {'detH': dh, 'coeffs': coeffs, 'gcd': degs}
    return out


def parse_table(src):
    rows = src.lines(CERT, 246, 248)
    table = {}
    for r in rows:
        m = re.match(r'\s*(\d+) & (\d+) & \$(.*)\$ & \$(.*)\$', r)
        p = int(m.group(1))
        d = {int(k): int(v) for q, k, v in re.findall(r'd_\{(\d+)\}\((\d+)\)=(\d+)', m.group(3)) if int(q) == p}
        if '(1\\leq k<20)' in m.group(3):
            d.update({k: 0 for k in range(1, 20)})
        table[p] = {'detH': int(m.group(2)), 'd': d, 'factors': sorted(int(x) for x in m.group(4).split(','))}
    return table


# ---------------------------------------------------------------- the construction
PAIRS10 = [(i, j) for i in range(4) for j in range(i, 4)]
PAIRS6 = [(i, j) for i in range(4) for j in range(i + 1, 4)]


def perm_sign(seq):
    s, seq = 1, list(seq)
    for i in range(len(seq)):
        for j in range(i + 1, len(seq)):
            if seq[i] > seq[j]:
                s = -s
    return s


def build_UVK(kflip=False):
    U = zeros(16, 10)
    U = [list(r) for r in U]
    for c, (i, j) in enumerate(PAIRS10):
        if i == j:
            U[4 * i + i][c] = ONE
        else:
            U[4 * i + j][c] = RSQ2
            U[4 * j + i][c] = RSQ2
    V = [list(r) for r in zeros(16, 6)]
    for c, (i, j) in enumerate(PAIRS6):
        V[4 * i + j][c] = RSQ2
        V[4 * j + i][c] = -RSQ2
    K = [list(r) for r in zeros(6)]
    for c, (i, j) in enumerate(PAIRS6):
        k, l2 = [t for t in range(4) if t not in (i, j)]
        K[PAIRS6.index((k, l2))][c] = Q2(perm_sign((i, j, k, l2)))      # K e_ij = eps_ijkl e_kl
    if kflip:                                                            # forge: one sign of K flipped
        K[PAIRS6.index((1, 3))][PAIRS6.index((0, 2))] = -K[PAIRS6.index((1, 3))][PAIRS6.index((0, 2))]
    return U, V, K


def build_pair(Ms, kflip=False):
    """L, S, R, R^dagger, Phi_1, Phi_2 as tables (geometry.tex eq:UV, eq:complement, eq:SR, eq:phi-pair)"""
    Lt = {(i, j): lift(matmul_int(transpose_int(Ms[i]), Ms[j])) for i in range(4) for j in range(4)}
    U, V, K = build_UVK(kflip)
    Ut, Vt, Kt = tp(U), tp(V), tp(K)

    def LL(X):                                           # (L (x) L) on M_4 (x) M_4 = M_16, by matrix units
        out = None
        for p_, row in enumerate(X):
            for q, x in enumerate(row):
                if x:
                    i, j = divmod(p_, 4)
                    k, l2 = divmod(q, 4)
                    img = kron(Lt[(i, k)], Lt[(j, l2)])
                    out = [[x * y for y in r] for r in img] if out is None else madd(out, img, x)
        return out if out is not None else zeros(16)

    def S(A):
        return mm(mm(Vt, LL(mm(mm(U, A), Ut))), V)
    St = table_of(S, 10)

    def R(A):
        return mm(mm(K, tp(apply(St, A))), Kt)
    Rt = table_of(R, 10)
    Rdag = adjoint(Rt, 10)                                     # M_6 -> M_10
    E = [[ONE if (i == j) else ZERO for j in range(6)] for i in range(10)]
    Et = tp(E)
    Phi1 = table_of(lambda A: mm(mm(E, apply(St, tp(A))), Et), 10)
    Phi2 = table_of(lambda B: apply(Rdag, mm(mm(Et, B), E)), 10)
    return dict(Lt=Lt, U=U, V=V, K=K, E=E, St=St, Rt=Rt, Rdag=Rdag, Phi1=Phi1, Phi2=Phi2)


def matmul_int(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]


def transpose_int(A):
    return [list(r) for r in zip(*A)]


def compose(tabG, tabF):
    return {k: apply(tabG, v) for k, v in tabF.items()}


def build_theta(Phi1, Phi2, c_override=None):
    """applications.tex eq:channel-effects and eq:channel, with Psi_i = Phi_i, m = 10, C^21 = C^10_0 + C^10_1 + C e_*"""
    m = 10
    A1 = apply(adjoint(Phi1, m), eye(m))
    A2 = apply(adjoint(Phi2, m), eye(m))
    c1 = Q2(1) * (Q2(1) + trace(A1)).inv()
    c2 = Q2(1) * (Q2(1) + trace(A2)).inv()
    if c_override is not None:
        c1 = c_override
    F1 = madd(eye(m), A1, -c1)
    F2 = madd(eye(m), A2, -c2)
    W0 = [[ONE if i == j else ZERO for j in range(m)] for i in range(2 * m + 1)]
    W1 = [[ONE if i == j + m else ZERO for j in range(m)] for i in range(2 * m + 1)]
    es = [[ONE if i == 2 * m else ZERO] for i in range(2 * m + 1)]
    W0t, W1t, est = tp(W0), tp(W1), tp(es)
    Pstar = mm(es, est)

    def Theta(X):
        X00 = mm(mm(W0t, X), W0)
        X11 = mm(mm(W1t, X), W1)
        xs = mm(mm(est, X), es)[0][0]
        part0 = mm(mm(W0, apply(Phi2, X11)), W0t)
        part1 = mm(mm(W1, apply(Phi1, X00)), W1t)
        flag = trace(mm(F1, X00)) + trace(mm(F2, X11)) + xs
        return [[c2 * a + c1 * b + flag * s for a, b, s in zip(r0, r1, rs)] for r0, r1, rs in zip(part0, part1, Pstar)]
    return dict(Theta=Theta, A1=A1, A2=A2, c1=c1, c2=c2, F1=F1, F2=F2, W0=W0, Pstar=Pstar)


# ---------------------------------------------------------------- the decider
def decide(src=None, Ms=None, kflip=False, claims=None, c_override=None, stop_after=None):
    t0 = time.time()
    src = src or Sources()
    checks = []
    value = {}
    timing = {}
    claims = dict(claims or {})

    # -------- the paper's statements, as printed
    intro = src.text(INTRO)
    cert = src.text(CERT)
    geom = src.text(GEOM)
    appl = src.text(APPL)
    flat = lambda s: re.sub(r'\s+', ' ', s)  # noqa: E731
    check(checks, 'the claims as printed (thm:main-pair, thm:main-channel, eq:L, eq:phi-pair, eq:channel)',
          'Z=J(\\Phi_2\\circ\\Phi_1)' in flat(intro) and 'trace-preserving PPT channel $\\Theta:\\Mat{21}\\to\\Mat{21}$' in flat(intro)
          and 'L(E_{ij})=M_i^{\\T}M_j' in cert and '\\Phi_1(A)=E\\,S(A^{\\T})E^*,\\qquad \\Phi_2(B)=R^\\dagger(E^*BE).' in flat(geom)
          and '\\Theta(X)={}&c_2W_0\\Psi_2(X_{11})W_0^*' in appl,
          'introduction.tex:80-105, certificate.tex:35, geometry.tex:104-106, applications.tex:78-81')
    printed_Ms, _ = parse_matrices(src)
    Ms = Ms or printed_Ms
    out_rec = parse_output(src)
    table = parse_table(src)
    if 'detH41' in claims:
        table[41]['detH'] = claims['detH41']
    if 'gcd131' in claims:
        out_rec[131]['gcd'] = claims['gcd131']
    printed_corner = 10077696 if '6\\cdot36^4=10{,}077{,}696' in cert else None
    if 'corner' in claims:
        printed_corner = claims['corner']
    check(checks, 'parsed: four 6x4 integer matrices; the table rows for 41, 131, 139; the recorded output for 41, 131, 139',
          len(Ms) == 4 and all(len(M) == 6 and all(len(r) == 4 for r in M) for M in Ms) and sorted(table) == list(PRIMES)
          and sorted(out_rec) == list(PRIMES), 'certificate.tex:14-30, :246-248; verification/certificate-output.txt')

    # -------- A. the pencil and L
    T = transpose_int
    sym = all(matmul_int(T(Ms[i]), Ms[j]) == matmul_int(T(Ms[j]), Ms[i]) for i in range(4) for j in range(4))
    check(checks, 'A1. M_i^T M_j = M_j^T M_i for all 16 (i, j) (eq:block-symmetry)', sym)
    Lt = {(i, j): matmul_int(T(Ms[i]), Ms[j]) for i in range(4) for j in range(4)}
    JL = [[Q2(Lt[(i, j)][k][l2]) for j in range(4) for l2 in range(4)] for i in range(4) for k in range(4)]
    s1, p1, r1, why1 = psd(JL)
    s2, p2, r2, why2 = psd(ptrans_out(JL, 4, 4))
    check(checks, 'A2. J(L) is symmetric and PSD (L is CP)', s1 and p1, 'rank %d %s' % (r1, why1))
    check(checks, 'A2. (id x T) J(L) is PSD (T o L is CP: L is PPT)', s2 and p2, 'rank %d %s' % (r2, why2))
    Qr = [[[Ms[i][r][a] for i in range(4)] for a in range(4)] for r in range(6)]     # column i of Q_r = row r of M_i
    kraus_ok = all(
        [[sum(Qr[r][a][i] * Qr[r][b][j] for r in range(6)) for b in range(4)] for a in range(4)] == Lt[(i, j)]
        for i in range(4) for j in range(4))
    check(checks, 'A3. L(E_ij) = sum_r Q_r E_ij Q_r^T with Q_r the paper\'s (column i = row r of M_i)', kraus_ok)
    check(checks, 'A4. L(P_e0) = M_0^T M_0 = 36 I_4 (as printed)', Lt[(0, 0)] == [[36 * int(a == b) for b in range(4)] for a in range(4)]
          and 'L(P_{e_0})=36I_4' in cert)
    timing['A'] = time.time() - t0

    # -------- B. the maximal minors, D, H, N, f
    t1 = time.time()
    n3 = 3
    one = pconst(1, n3)
    tv = [one] + [pvar(i, n3) for i in range(3)]               # x = (1, t1, t2, t3)
    Mx = [[padd(padd(padd(pconst(Ms[0][r][c], n3), pmul(tv[1], pconst(Ms[1][r][c], n3))), pmul(tv[2], pconst(Ms[2][r][c], n3))),
                pmul(tv[3], pconst(Ms[3][r][c], n3))) for c in range(4)] for r in range(6)]
    minors = []
    for rho in itertools.combinations(range(6), 4):
        d_ = {}
        for perm in itertools.permutations(range(4)):
            term = pconst(perm_sign(perm), n3)
            for c in range(4):
                term = pmul(term, Mx[rho[c]][perm[c]])
            d_ = padd(d_, term)
        minors.append(d_)

    def monos(d):
        return [(a, b, d - a - b) for a in range(d + 1) for b in range(d - a + 1)]
    low = monos(0) + monos(1) + monos(2) + monos(3)
    high = monos(4)
    lidx = {m: i for i, m in enumerate(low)}
    hidx = {m: i for i, m in enumerate(high)}
    Dm = [[p.get(m, 0) for m in low] for p in minors]
    Hm = [[p.get(m, 0) for m in high] for p in minors]
    deg_ok = all(sum(m) <= 4 for p in minors for m in p)
    detH = det(Hm)
    check(checks, 'B1. 15 maximal minors of M(1,t), each of degree <= 4, give D (15 x 20) and H (15 x 15) in the order eq:monomial-order',
          len(minors) == 15 and deg_ok and len(low) == 20 and len(high) == 15)
    check(checks, 'B2. det H is a nonzero integer', detH != 0 and detH.denominator == 1, 'det H = %s' % detH)
    for p in PRIMES:
        r = int(detH) % p if detH.denominator == 1 else None
        check(checks, 'B2. det H mod %d = %s (table) = %s (recorded output)' % (p, table[p]['detH'], out_rec[p]['detH']),
              r == table[p]['detH'] == out_rec[p]['detH'], 'computed %s' % r)
    value['detH'] = str(detH)
    if detH == 0:
        return finish(checks, value, src, t0, timing)
    Hinv = inverse(Hm)
    Cm = [[-sum(Hinv[a][k] * Dm[k][b] for k in range(15)) for b in range(20)] for a in range(15)]
    N = [[Fraction(0)] * 20 for _ in range(20)]
    for ai, al in enumerate(low):
        nxt = (al[0] + 1, al[1], al[2])
        if sum(al) <= 2:
            N[lidx[nxt]][ai] = Fraction(1)
        else:
            for bi in range(20):
                N[bi][ai] = Cm[hidx[nxt]][bi]
    f = charpoly_hessenberg(N)
    f2 = charpoly_leverrier(N)
    check(checks, 'B3. f = det(zI - N) over Q: Hessenberg reduction = Faddeev-LeVerrier, monic of degree 20', f == f2 and len(f) == 21 and f[20] == 1)
    timing['B-minors-charpoly'] = time.time() - t1
    fbar = {}
    for p in PRIMES:
        integral = all(c.denominator % p for c in f)
        fb = [reduce_mod(c, p) for c in f] if integral else None
        fbar[p] = fb
        check(checks, 'B4. f is %d-integral and its reduction equals the 21 recorded coefficients' % p,
              integral and fb is not None and list(reversed(fb)) == out_rec[p]['coeffs'],
              'computed (leading first) %s' % (list(reversed(fb)) if fb else None))
    for p in PRIMES:
        if fbar[p] is None:
            continue
        gd = gcd_degrees(fbar[p], p)
        tab_ok = all(gd[k - 1] == v for k, v in table[p]['d'].items())
        check(checks, 'B5. d_%d(k), k = 1..20, equals the recorded list and the table entries' % p,
              gd == out_rec[p]['gcd'] and tab_ok, 'computed %s' % gd)
        sq, degs = ddf_degrees(fbar[p], p)
        check(checks, 'B6. f mod %d is squarefree with irreducible factor degrees %s (table: %s)' % (p, degs, table[p]['factors']),
              sq and degs == table[p]['factors'] and sum(degs) == 20)
    prime_ok = all(all(p % q for q in range(2, 12)) and p < 144 for p in PRIMES)
    check(checks, 'B7. 41, 131, 139 are prime (trial division by 2..11 suffices below 144) and exceed 20', prime_ok and min(PRIMES) > 20)
    # exactly twenty directions: h2, h3 and a surjective algebra map A -> Q[z]/(f)
    e0 = [Fraction(int(i == lidx[(0, 0, 0)])) for i in range(20)]
    cols, v = [], e0
    for _ in range(20):
        cols.append(v)
        v = [sum(N[i][j] * v[j] for j in range(20)) for i in range(20)]
    P = [[cols[k][i] for k in range(20)] for i in range(20)]
    detP = det(P)
    check(checks, 'B8. 1, t1, ..., t1^19 are a basis of the span of the low monomials (t1 generates A)', detP != 0)
    if detP == 0:
        return finish(checks, value, src, t0, timing)
    Pinv = inverse(P)
    h2 = [Pinv[k][lidx[(0, 1, 0)]] for k in range(20)]
    h3 = [Pinv[k][lidx[(0, 0, 1)]] for k in range(20)]
    zpows = [[Fraction(int(i == a)) for i in range(20)] for a in range(5)]
    h2p, h3p = [zpows[0]], [zpows[0]]
    for _ in range(4):
        h2p.append(qmulmod(h2p[-1], h2, f))
        h3p.append(qmulmod(h3p[-1], h3, f))
    mono_val = {}
    for d in range(5):
        for (a, b, c) in monos(d):
            mono_val[(a, b, c)] = qmulmod(qmulmod(zpows[a], h2p[b], f), h3p[c], f)
    vanish = True
    for pr in minors:
        acc = [Fraction(0)] * 20
        for m, c in pr.items():
            mv = mono_val[m]
            for i in range(20):
                acc[i] += c * mv[i]
        if any(acc):
            vanish = False
    check(checks, 'B9. every maximal minor p_rho(z, h2(z), h3(z)) = 0 in Q[z]/(f): a surjective algebra map A -> Q[z]/(f), so dim A = 20',
          vanish, 'h2, h3 heights: %d, %d digits' % (max(len(str(x)) for x in h2), max(len(str(x)) for x in h3)))
    g = qgcd(f, [i * c for i, c in enumerate(f)][1:])
    check(checks, 'B10. gcd(f, f\') = 1 over Q: f has 20 distinct complex roots, hence exactly 20 distinct singular directions (1, l, h2(l), h3(l))',
          len(g) == 1)
    check(checks, 'B11. no singular direction has x_0 = 0 (det H != 0 forces t = 0), and the paper says exactly twenty',
          detH != 0 and 'consist of exactly twenty distinct points' in flat(cert))
    value['f_height_digits'] = max(len(str(c)) for c in f)
    timing['B'] = time.time() - t1
    if stop_after == 'B':
        return finish(checks, value, src, t0, timing)

    # -------- C. the pair Phi_1, Phi_2 and Z
    t2 = time.time()
    B_ = build_pair(Ms, kflip)
    K = B_['K']
    printed_K = re.search(r'\(Ke_\{01\},Ke_\{02\},Ke_\{03\},Ke_\{12\},Ke_\{13\},Ke_\{23\}\)=\(([^)]*)\)', flat(geom).replace(' ', ''))
    pk = [(-1 if s else 1, int(a), int(b)) for s, a, b in re.findall(r'(-?)e_\{(\d)(\d)\}', printed_K.group(1) if printed_K else '')]
    Kp = [list(r) for r in zeros(6)]
    for c, (s, a, b) in enumerate(pk):
        Kp[PAIRS6.index((a, b))][c] = Q2(s)
    check(checks, 'C1. K from the sign rule eps_ijkl equals the printed list (Ke_01..Ke_23) = (e23, -e13, e12, e03, -e02, e01); K = K^T = K^-1',
          printed_K is not None and len(pk) == 6 and meq(K, Kp) and meq(K, tp(K)) and meq(mm(K, K), eye(6)))
    Phi1, Phi2 = B_['Phi1'], B_['Phi2']
    J1, J2 = choi(Phi1, 10), choi(Phi2, 10)
    for name, J in (('J(Phi_1)', J1), ('(id x T) J(Phi_1)', ptrans_out(J1, 10, 10)), ('J(Phi_2)', J2), ('(id x T) J(Phi_2)', ptrans_out(J2, 10, 10))):
        s_, p_, r_, w_ = psd(J)
        check(checks, 'C2. %s is symmetric and PSD' % name, s_ and p_, 'rank %d %s' % (r_, w_))
        value['rank ' + name] = r_
    comp = compose(Phi2, Phi1)
    Z = choi(comp, 10)
    alt = choi({(a, b): apply(B_['Rdag'], B_['St'][(b, a)]) for a in range(10) for b in range(10)}, 10)
    check(checks, 'C3. E^T E = I_6 and J(Phi_2 o Phi_1) = J(R^dagger o S o T_10)', meq(mm(tp(B_['E']), B_['E']), eye(6)) and meq(Z, alt))
    sZ, pZ, rZ, wZ = psd(Z)
    sZG, pZG, rZG, wZG = psd(ptrans_out(Z, 10, 10))
    check(checks, 'C4. Z is symmetric and PSD', sZ and pZ, 'rank %d %s' % (rZ, wZ))
    check(checks, 'C4. Z has positive partial transpose', sZG and pZG, 'rank %d %s' % (rZG, wZG))
    value['rank Z'] = rZ
    trZ = trace(Z)
    value['tr Z'] = repr(trZ)
    P00 = unit(10, 0, 0)
    SP = apply(B_['St'], P00)
    RP = apply(B_['Rt'], P00)
    i00 = 0
    check(checks, 'C5. S(P_e00) = R(P_e00) = 36^2 I_6 (as printed)', meq(SP, [[Q2(1296 if a == b else 0) for b in range(6)] for a in range(6)]) and meq(RP, SP)
          and 'S(P_{e_{00}})=R(P_{e_{00}})=36^2I_6' in flat(cert).replace(' ', ''))
    corner = Z[i00 * 10 + i00][i00 * 10 + i00]
    check(checks, 'C5. (e00 x e00)^* Z (e00 x e00) = tr[R(P_e00) S(P_e00)] = 6 * 36^4 = %s (as printed)' % printed_corner,
          corner == Q2(6 * 36 ** 4) and trace(mm(RP, SP)) == corner and printed_corner == 6 * 36 ** 4, 'computed %s' % corner)
    # class C (Lemma lem:choi-transfer, Definition def:represented-class)
    P1dag = adjoint(Phi1, 10)
    sharp = {(i, j): tp(apply(P1dag, tp(unit(10, i, j)))) for i in range(10) for j in range(10)}     # T o Phi1^dagger o T
    transfer = None
    for i in range(10):
        for j in range(10):
            term = kron(sharp[(i, j)], Phi2[(i, j)])
            transfer = term if transfer is None else madd(transfer, term)
    check(checks, 'C6. Z = (Phi_1^# x Phi_2)(Omega Omega^*) (eq:choi-transfer), entry by entry', meq(Z, transfer))
    Jsh = choi(sharp, 10)
    cls_ok = []
    for name, J in (('Phi_1^#', Jsh), ('Phi_1^# o T', ptrans_in(Jsh, 10, 10)), ('Phi_2', J2), ('Phi_2 o T', ptrans_in(J2, 10, 10))):
        s_, p_, r_, w_ = psd(J)
        cls_ok.append(s_ and p_)
    check(checks, 'C6. Phi_1^#, Phi_1^# o T, Phi_2, Phi_2 o T are CP (Choi matrices PSD), tr Z > 0: rho = Z / tr Z is in the class C', all(cls_ok) and trZ.sign() > 0,
          str(cls_ok))
    timing['C-maps-psd'] = time.time() - t2
    # kernel vectors, in Q(sqrt2) (x) A with the basis of low monomials
    t3 = time.time()
    xe = [(0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1)]

    def cls(m):
        """the class of t^m in A, in the basis of the 20 low monomials (degree 4 through C = -H^-1 D)"""
        if sum(m) <= 3:
            return [Fraction(int(i == lidx[m])) for i in range(20)]
        return list(Cm[hidx[m]])
    vec = []                         # (x^ (x) x^)[(p, q)] = coefficient (Q2) x class vector
    for (i, j) in PAIRS10:
        for (k, l2) in PAIRS10:
            co = (ONE if i == j else Q2(0, 1)) * (ONE if k == l2 else Q2(0, 1))
            m = tuple(xe[i][s] + xe[j][s] + xe[k][s] + xe[l2][s] for s in range(3))
            vec.append((co, cls(m)))
    kernel_zero = True
    worst = 0
    for r in range(100):
        accA = [Fraction(0)] * 20
        accB = [Fraction(0)] * 20
        for c in range(100):
            z = Z[r][c]
            if z:
                co, cv = vec[c]
                w_ = z * co
                if w_.a:
                    for t in range(20):
                        if cv[t]:
                            accA[t] += w_.a * cv[t]
                if w_.b:
                    for t in range(20):
                        if cv[t]:
                            accB[t] += w_.b * cv[t]
        nz = sum(1 for x in accA + accB if x)
        worst = max(worst, nz)
        if nz:
            kernel_zero = False
    check(checks, 'C7. Z (xhat x xhat) = 0 in Q(sqrt2) (x) A for x = (1, t1, t2, t3): every one of the twenty xhat_j x xhat_j is in ker Z (eq:kernel-vectors)',
          kernel_zero, 'largest number of nonzero basis coordinates in a row: %d' % worst)
    # not a claim of the paper, recorded: the 100 coordinates of xhat x xhat span A (rank 20), so the twenty kernel
    # vectors are independent; with rank Z = 80 this makes ker Z exactly their span
    value['kernel vectors independent (rank of the 100 coordinate classes in A)'] = qrank([cv for _, cv in vec])
    timing['C-kernel'] = time.time() - t3
    if stop_after == 'C':
        return finish(checks, value, src, t0, timing)

    # -------- D. the channel Theta on M_21
    t4 = time.time()
    th = build_theta(Phi1, Phi2, c_override)
    value['c1'], value['c2'] = repr(th['c1']), repr(th['c2'])
    check(checks, 'D1. c_1, c_2 > 0 are rational, and F_i - c_i I is PSD (F_i >= c_i I)',
          th['c1'].sign() > 0 and th['c2'].sign() > 0 and th['c1'].b == 0 and th['c2'].b == 0
          and all(psd(madd(F, eye(10), -c))[1] for F, c in ((th['F1'], th['c1']), (th['F2'], th['c2']))))
    Theta = th['Theta']
    Tt = table_of(Theta, 21)
    JT = choi(Tt, 21)
    s_, p_, r_, w_ = psd(JT)
    check(checks, 'D2. J(Theta) (441 x 441) is symmetric and PSD (Theta is CP)', s_ and p_, 'rank %d %s' % (r_, w_))
    s_, p_, r_, w_ = psd(ptrans_out(JT, 21, 21))
    check(checks, 'D2. (id x T) J(Theta) is PSD (Theta is PPT)', s_ and p_, 'rank %d %s' % (r_, w_))
    tp_ok = all(trace(Tt[(a, b)]) == Q2(int(a == b)) for a in range(21) for b in range(21))
    check(checks, 'D3. tr Theta(E_ab) = delta_ab for all 441 (a, b): Theta is trace preserving', tp_ok)
    check(checks, 'D4. Theta(P_*) = P_* (the flag is absorbing)', meq(Tt[(20, 20)], th['Pstar']))
    corner_ok = True
    cc = th['c1'] * th['c2']
    for a in range(10):
        for b in range(10):
            sq = apply(Tt, Tt[(a, b)])
            for k in range(10):
                for l2 in range(10):
                    if not (sq[k][l2] == cc * Z[a * 10 + k][b * 10 + l2]):
                        corner_ok = False
    check(checks, 'D5. (W0^* x W0^*) J(Theta o Theta) (W0 x W0) = c_1 c_2 Z, entry by entry (eq:choi-corner)', corner_ok)
    timing['D'] = time.time() - t4
    return finish(checks, value, src, t0, timing)


def finish(checks, value, src, t0, timing):
    ok = all(c['pass'] for c in checks)
    names = [c['check'] for c in checks if not c['pass']]
    if ok:
        verdict = 'CERTIFIED'
    elif any(n.startswith(('parsed', 'the claims')) for n in names):
        verdict = 'REFUSED'      # the published object or statement could not be read as expected
    else:
        verdict = 'REFUTED'      # a property claimed, or a value printed, that the object as given does not have
    value['runtime_s'] = round(time.time() - t0, 1)
    value['timing_s'] = {k: round(v, 1) for k, v in timing.items()}
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: the integer pencil and L (PPT), the twenty singular directions with every '
                       'modular datum the paper prints, Phi_1 and Phi_2 PPT, Z PSD/PPT and nonzero with all twenty '
                       'xhat x xhat in ker Z, rho = Z/tr Z in the class C, and Theta on M_21 CP, PPT, trace preserving '
                       'with the corner c1 c2 Z of J(Theta^2). NOT the Galois/Dedekind step to "every ten span" '
                       '(its finite inputs only), and NOT the secret-key bound K_D(rho) = 0 (analytic).'}


def forge():
    """each must NOT certify; the description names the checks that fail. The first three stop after the stage that
    the forgery touches (B, C, B); the fourth runs every stage."""
    def failing(r):
        ids = []
        for c in r['checks']:
            if not c['pass'] and c['check'].split(' ')[0] not in ids:
                ids.append(c['check'].split(' ')[0])
        return ' [fails: %s]' % ' '.join(ids)
    out = []
    src = Sources()
    Ms, _ = parse_matrices(src)
    bad = [[list(r) for r in M] for M in Ms]
    bad[3][0][2] = -3                                  # M_3[0][2]: -4 -> -3
    r = decide(Ms=bad, stop_after='B')
    out.append(('M_3[0][2] changed from -4 to -3' + failing(r), r['verdict']))
    r = decide(kflip=True, stop_after='C')
    out.append(('one sign of K flipped (K e_02 = +e_13): Phi_1, Phi_2 stay PPT, Z stays PSD, the kernel vectors are lost' + failing(r), r['verdict']))
    r = decide(claims={'gcd131': [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 18, 3]}, stop_after='B')
    out.append(('recorded d_131 list with the 18 moved from k = 17 to k = 19' + failing(r), r['verdict']))
    r = decide(c_override=Q2(1))
    out.append(('Theta built with c_1 = 1 (no rescaling of Phi_1)' + failing(r), r['verdict']))
    return out


if __name__ == '__main__':
    import json
    from _common import check_clone
    check_clone()
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('sources:', json.dumps(res['sources'], indent=1))
    print('%.1fs' % (time.time() - t))
    if '--no-forge' not in sys.argv:
        for row in forge():
            print('FORGE', row)
