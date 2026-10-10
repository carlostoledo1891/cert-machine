"""F-542 — "A Fock-space inequality and the Laughlin spectral gap" (openai/math family 269).

THE CLAIM (build/sections/01-introduction.tex:41-71): with
  gamma_* = 4616733319001/10^14 > 1/25                                                     (01-introduction.tex:41)
"For every 0 < gamma < gamma_*, there is an integer Q_gamma such that for every integer Q >= Q_gamma,
 H_Q^2 >= gamma H_Q on F_Q" (Theorem thm:fock, :45-52), and hence (Corollary thm:main, :60-71)
"H_{N,Q} >= (1/25)(I - P_{L,N})" for N >= N_0, Q = 3(N-1). The finite input is two certificates:
  eq:3certificate  e_z < (3/2)(3z-1)(-1/2)^z,  z in {2,4,5,...,15}                         (04-comparison.tex:85-88)
  eq:4certificate  G_D (2 chi - E_D + eps I) G_D >= 0,  1 <= D <= 23,  eps = 3/10^6       (04-comparison.tex:164-171)
built from seven integer rows (verification/rows.txt, printed by lstinputlisting at 08-arithmetic.tex:21), and the
final arithmetic 1 - eta - 61/4096 - 1222 eps = gamma_* (06-gap.tex:52-58).

WHAT IS DECIDED HERE, exactly (int / Fraction / an exact multiquadratic field; no float in any decision):
  0. rows.txt parsed by the paper's rule (08-arithmetic.tex:13): t, l = P lambda, entries pj:a; every entry in
     S_rho (0<=p<=7, 0<=j<=8, 0<=p+j-t<=8), t in {0..7}, no duplicates; the two printed forms of eq:alphadata agree.
  1. THREE-BODY, two derivations that share no formula:
     (a) FROM THE DEFINITIONS: s^(u)_{z,T,p} is computed as the coefficient of the normalized monomial
         X^p Y^(T-p)/sqrt(p!(T-p)!) in (uX - vY)^z (vX + uY)^(T-z)/sqrt(z!(T-z)!) (eq:coupling, 03-spin.tex:91-93)
         with u = 1/sqrt3, v = sqrt(2/3); alpha_pj from eq:alphadata; e_z from eq:ez (04-comparison.tex:76-81) — all
         in the field Q(sqrt2, sqrt3, sqrt5, ...) represented exactly as {squarefree m: Fraction}. The result is
         checked to have NO irrational component (the paper's "radicals cancel" is decided, not assumed).
     (b) FROM THE PAPER'S RATIONAL FORMULA eq:erational with eq:U (08-arithmetic.tex:28-45), in Fraction.
     (a) == (b) for every z in 0..15; the 13 margins m_z = (3/2)(3z-1)(-1/2)^z - e_z are > 0; floor(10^6 m_z)
     equals the printed table (08-arithmetic.tex:48-55), entry by entry.
  2. FOUR-BODY, for each D = 1..23, again two derivations:
     (a) FROM THE DEFINITIONS: S_r = sqrt2 s^(1/sqrt2)_{r,j+k,j} s^(1/sqrt2)_{D-r,T-r,p} (eq:S), E_D from eq:E,
         v*_p(i,j) from eq:pairstar, w*_Dr = sum S_r(D,D;p,j,k) v*_p ^ e_j ^ e_k with the exterior sign computed by
         sorting, G_D = Gram matrix of the w*_Dr (eq:wstar) — in the field; then Y = E_D/sqrt(u_r u_s) and
         Z = G_D/sqrt(u_r u_s) are checked to be rational.
     (b) FROM THE PAPER'S RATIONAL FORMULAS eq:Yrational, eq:Lrational, eq:Zrational (08-arithmetic.tex:60-103).
     (a) == (b) entrywise; Y symmetric; M = Z B Z, B = diag((2[r=1]+eps)u_r) - D_u Y D_u (eq:M); the certificate
     matrix N = G_D (2chi - E_D + eps I) G_D is computed in the field and checked to equal D_sqrt(u) M D_sqrt(u)
     entrywise (so N >= 0 iff M >= 0: congruence by a positive diagonal).
     M >= 0 DECIDED BY EXACT SYMMETRIC (LDL^T) ELIMINATION over Fraction: a negative pivot -> not PSD; a zero pivot
     -> its whole remaining row must be zero (else a 2x2 principal minor [[0,b],[b,c]] has det -b^2 < 0), and it is
     skipped; a positive pivot -> Schur complement. M is PSD iff the elimination finishes. Second, independent
     method: det(xI + M) is obtained by exact interpolation of d+1 Fraction determinants at x = 0..d (NOT by the
     paper's Leverrier-Faddeev recurrence); its coefficients are the elementary symmetric functions of the
     eigenvalues, all >= 0 iff M >= 0. The coefficient sign string is compared with the printed table
     (08-arithmetic.tex:128-141), and the number of '+' with the LDL^T rank.
  3. Printed numbers: P^2 eta = sum l^2 = 93527408868499 (08-arithmetic.tex:24); 1222 = sum_{D<=23} n_D, with n_D
     counted by enumerating triples and = floor((D+1)^2/4) = the printed sum of squares (05-transfer.tex:216-228);
     the series value 61/4096 (06-gap.tex:16-41): (3z-1)(z+1) = 900+208m+12m^2 at z = 17+2m, the three printed
     series sums 4/3, 4/9, 20/27 (closed forms, and an exact partial sum with a proved geometric tail bound
     enclosing each), and (3/2)2^-17(900*4/3 + 208*4/9 + 12*20/27) = 61/4096; 1 - eta - 61/4096 - 1222*3/10^6 =
     4616733319001/10^14 exactly (06-gap.tex:55-58) and > 1/25; T <= 15 for three-body levels, T <= 23 for four-body
     levels, modes 0..8 only (04-comparison.tex:48,71,118-121).

WHAT IS NOT DECIDED HERE: everything between these finite certificates and the spectral statement. Namely the
normal-ordered square (Lemma lem:square), the pair coefficients and their limits (lem:pair), the three-body Gram
spectrum q_z(Q) and its limit (lem:q), the fixed-deficit coupling limit (lem:coupling) — whose limiting formulas
are TAKEN AS THE DEFINITIONS above —, Schur averaging, the compression lemma, the uniform finite-flux transfer
(lem:transfer) and the Bessel bound giving 1222 eps, the three-body tail delta_Q -> 61/4096 (only the value of the
series is checked, not the domination argument), the kernel lemma, and the passage to Q_gamma and N_0 (which are
existential). A CERTIFIED here is a component check: the finite certificate holds exactly as published and every
printed number about it is right; it is not a proof of the gap.

OBSERVATIONS, recorded after the clean-room run (the authors' material was read only then): the paper directory ships
no checking script, only rows.txt; its stated check is the Leverrier-Faddeev sign table. The release's Lean
development (lean/OAI/Analysis/Laughlin) restates the rows as literals in Operators/Certificate.lean and
FourBody/RowCompute.lean (both equal to rows.txt — recorded in value), evaluates Gram entries by `decide +kernel`
(FiniteFlux/, 931 files) and proves PSD through an explicit rational L diag(d) L^T with d >= 0 (RationalPSD.lean),
not through the sign table. Operators/Certificate.lean also keeps an older budget (allowance 10946, final margin
1699533319001/10^14 > 1/100) beside the sharp one (Fock/SharpGap.lean: 1222, gammaStar). The Lean was not built here.
"""
import math
import os
import re
import sys
import time
from fractions import Fraction
from functools import lru_cache

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check, det  # noqa: E402

DIR = 'preprints/A-Fock-space-inequality-and-the-Laughlin-spectral-gap-September-24-2026'
ROWS = DIR + '/verification/rows.txt'
TEX = {
    'intro': DIR + '/build/sections/01-introduction.tex',
    'spin': DIR + '/build/sections/03-spin.tex',
    'comparison': DIR + '/build/sections/04-comparison.tex',
    'transfer': DIR + '/build/sections/05-transfer.tex',
    'gap': DIR + '/build/sections/06-gap.tex',
    'arith': DIR + '/build/sections/08-arithmetic.tex',
}
P = 10 ** 7
EPS = Fraction(3, 10 ** 6)
Z3 = [2] + list(range(4, 16))           # z in {2,4,5,...,15}: 13 values
fact = math.factorial
comb = math.comb


class Refuse(Exception):
    pass


# ---------------------------------------------------------------- exact multiquadratic field Q(sqrt p : p prime)
# an element is a dict {m: Fraction} meaning sum_m c_m sqrt(m), m squarefree >= 1, no zero coefficients.
PRIMES = [p for p in range(2, 200) if all(p % d for d in range(2, int(p ** 0.5) + 1))]


def f_add(a, b, k=1):
    r = dict(a)
    for m, c in b.items():
        v = r.get(m, 0) + k * c
        if v:
            r[m] = v
        else:
            r.pop(m, None)
    return r


def f_scale(a, q):
    return {m: c * q for m, c in a.items()} if q else {}


def f_mul(a, b):
    r = {}
    for m1, c1 in a.items():
        for m2, c2 in b.items():
            g = math.gcd(m1, m2)
            m = (m1 // g) * (m2 // g)        # squarefree: m1/g, m2/g coprime and squarefree
            v = r.get(m, 0) + c1 * c2 * g
            if v:
                r[m] = v
            else:
                r.pop(m, None)
    return r


def f_sqrt(q):
    """exact sqrt of a nonnegative rational, as a field element: sqrt(a/b) = sqrt(ab)/b = (s/b) sqrt(m)"""
    q = Fraction(q)
    if q < 0:
        raise Refuse('square root of a negative number %s' % q)
    if q == 0:
        return {}
    n = q.numerator * q.denominator
    s, m = 1, 1
    for p in PRIMES:
        if n == 1:
            break
        e = 0
        while n % p == 0:
            n //= p
            e += 1
        s *= p ** (e // 2)
        if e % 2:
            m *= p
    if n != 1:
        raise Refuse('radicand with a prime factor > 200')
    return {m: Fraction(s, q.denominator)}


def f_rational(a):
    """the rational value of a field element, or None if it has an irrational component"""
    if any(m != 1 for m in a):
        return None
    return a.get(1, Fraction(0))


def f_pow(a, n):
    r = {1: Fraction(1)}
    for _ in range(n):
        r = f_mul(r, a)
    return r


# u, v of eq:coupling: three-body u = 1/sqrt3, v = sqrt(2/3); four-body u = v = 1/sqrt2
UV = {3: (f_sqrt(Fraction(1, 3)), f_sqrt(Fraction(2, 3))), 2: (f_sqrt(Fraction(1, 2)), f_sqrt(Fraction(1, 2)))}


@lru_cache(maxsize=None)
def _uvpow(kind, which, n):
    return f_pow(UV[kind][which], n)


@lru_cache(maxsize=None)
def _s_cached(kind, z, T, p):
    return tuple(sorted(s_def(kind, z, T, p, raw=True).items()))


def s_def(kind, z, T, p, raw=False):
    """s^(u)_{z,T,p}: coefficient of X^p Y^(T-p)/sqrt(p!(T-p)!) in (uX - vY)^z (vX + uY)^(T-z)/sqrt(z!(T-z)!),
    expanded term by term in the field (eq:coupling); zero outside 0 <= z <= T, 0 <= p <= T"""
    if not raw:
        return dict(_s_cached(kind, z, T, p))
    if not (0 <= z <= T and 0 <= p <= T):
        return {}
    acc = {}
    for h in range(0, z + 1):                 # h = power of X taken from (uX - vY)^z
        g = p - h                             # power of X taken from (vX + uY)^(T-z)
        if g < 0 or g > T - z:
            continue
        # (uX)^h (-vY)^(z-h) * (vX)^g (uY)^(T-z-g)
        term = f_mul(_uvpow(kind, 0, h + (T - z - g)), _uvpow(kind, 1, (z - h) + g))
        acc = f_add(acc, f_scale(term, comb(z, h) * comb(T - z, g) * (-1) ** (z - h)))
    return f_mul(acc, f_sqrt(Fraction(fact(p) * fact(T - p), fact(z) * fact(T - z))))


# ---------------------------------------------------------------- the rows
def parse_rows(text):
    """08-arithmetic.tex:13: first two numbers t and l = P lambda; entries pj:a with p, j single digits;
    continuation lines (leading whitespace) belong to the preceding row"""
    rows = []
    for ln, line in enumerate(text.split('\n'), 1):
        if not line.strip():
            continue
        toks = line.split()
        if not line[0].isspace():
            if not (re.fullmatch(r'\d+', toks[0]) and re.fullmatch(r'-?\d+', toks[1])):
                raise Refuse('rows.txt line %d: a row must start with t and l' % ln)
            rows.append({'t': int(toks[0]), 'l': int(toks[1]), 'a': {}})
            toks = toks[2:]
        elif not rows:
            raise Refuse('rows.txt line %d: continuation before any row' % ln)
        for tok in toks:
            mt = re.fullmatch(r'(\d)(\d):(-?\d+)', tok)
            if not mt:
                raise Refuse('rows.txt line %d: token %r is not pj:a' % (ln, tok))
            key = (int(mt.group(1)), int(mt.group(2)))
            if key in rows[-1]['a']:
                raise Refuse('rows.txt line %d: duplicate entry %s' % (ln, tok))
            rows[-1]['a'][key] = int(mt.group(3))
    return rows


def alpha_def(t, p, j, a):
    """eq:alphadata, first printed form: (a/P) sqrt(2^p C(p+j,p) / (2^t C(p+j,t)))"""
    return f_scale(f_sqrt(Fraction(2 ** p * comb(p + j, p), 2 ** t * comb(p + j, t))), Fraction(a, P))


# ---------------------------------------------------------------- three-body
def e_from_definitions(rows, z):
    """eq:ez in the field: sum_rho sum_T [2 lambda s_{z,T,t} X_T + X_T^2], X_T = sum_{p+j=T} alpha_pj s_{z,T,p}"""
    tot = {}
    for r in rows:
        t, lam = r['t'], Fraction(r['l'], P)
        levels = {}
        for (p, j), a in r['a'].items():
            levels.setdefault(p + j, []).append((p, j, a))
        for T, ents in levels.items():
            X = {}
            for p, j, a in ents:
                X = f_add(X, f_mul(alpha_def(t, p, j, a), s_def(3, z, T, p)))
            tot = f_add(tot, f_add(f_scale(f_mul(s_def(3, z, T, t), X), 2 * lam), f_mul(X, X)))
    return tot


def U(c, z, T, p):
    """eq:U"""
    if not (0 <= z <= T and 0 <= p <= T):
        return 0
    return sum((-1) ** (z - h) * comb(z, h) * comb(T - z, p - h) * c ** (p - h)
               for h in range(max(0, p + z - T), min(p, z) + 1))


def e_rational(rows, z):
    """eq:erational: P^2 e_z = sum_rho sum_{T=max(z,t)}^{15} 2^z C(T,z)/(3^T 2^t C(T,t)) X (X + 2 l U(2,z,T,t))"""
    tot = Fraction(0)
    for r in rows:
        t, ell = r['t'], r['l']
        for T in range(max(z, t), 16):
            X = sum(a * U(2, z, T, p) for (p, j), a in r['a'].items() if p + j == T)
            tot += Fraction(2 ** z * comb(T, z), 3 ** T * 2 ** t * comb(T, t)) * X * (X + 2 * ell * U(2, z, T, t))
    return tot / P ** 2


def qlim(z):
    return Fraction(3, 2) * (3 * z - 1) * Fraction(-1, 2) ** z


# ---------------------------------------------------------------- four-body
def R_D(D):
    return list(range(1, D + 1, 2))


def u_(r, D):
    return Fraction(1, fact(r) * fact(D - r))


def S_def(D, T, r, p, j, k):
    """eq:S: sqrt2 s^(1/sqrt2)_{r,j+k,j} s^(1/sqrt2)_{D-r,T-r,p}, zero if r > j+k"""
    if r > j + k or p < 0:
        return {}
    return f_mul(f_mul(s_def(2, r, j + k, j), s_def(2, D - r, T - r, p)), {2: Fraction(1)})


def E_from_definitions(rows, D):
    """eq:E: (E_D)_rs = -sum_rho sum_{(p,j),(q,l); T >= D} alpha_pj alpha_ql S_r(D,T;p,j,k) S_s(D,T;q,l,i),
    i = p+j-t, k = q+l-t, T = p+j+k. Grouped by the two entry levels, each group is an outer product."""
    R = R_D(D)
    E = [[{} for _ in R] for _ in R]
    for row in rows:
        t = row['t']
        levels = {}
        for (p, j), a in row['a'].items():
            levels.setdefault(p + j, []).append((p, j, alpha_def(t, p, j, a)))
        for T1, L1 in levels.items():
            i = T1 - t
            for T2, L2 in levels.items():
                k = T2 - t
                T = T1 + k
                if T < D:
                    continue
                left = [{} for _ in R]
                right = [{} for _ in R]
                for x, r in enumerate(R):
                    for p, j, al in L1:
                        left[x] = f_add(left[x], f_mul(al, S_def(D, T, r, p, j, k)))
                    for q, l, al in L2:
                        right[x] = f_add(right[x], f_mul(al, S_def(D, T, r, q, l, i)))
                for x in range(len(R)):
                    if not left[x]:
                        continue
                    for y in range(len(R)):
                        if right[y]:
                            E[x][y] = f_add(E[x][y], f_mul(left[x], right[y]), -1)
    return E


def perm_sign(seq):
    s, a = 1, list(seq)
    for x in range(len(a)):
        for y in range(x + 1, len(a)):
            if a[x] > a[y]:
                s = -s
    return s


def G_from_definitions(D):
    """eq:wstar: w*_Dr = sum_{p+j+k=D, j<k} S_r(D,D;p,j,k) v*_p ^ e_j ^ e_k, v*_p = sum_{x<y, x+y=p+1} v*_p(x,y) e_x^e_y
    (eq:pairstar); G_D = Gram matrix in the orthonormal increasing-wedge basis"""
    R = R_D(D)
    w = [{} for _ in R]
    for p in range(0, D + 1):
        for j in range(0, D - p + 1):
            k = D - p - j
            if not j < k:
                continue
            for x in range(0, p + 2):
                y = p + 1 - x
                if not x < y:
                    continue
                idx = (x, y, j, k)
                if len(set(idx)) < 4:
                    continue                      # repeated orbital: the wedge vanishes
                A = tuple(sorted(idx))
                vstar = f_scale(f_sqrt(Fraction(fact(p), 2 ** p * fact(x) * fact(y))), (x - y) * perm_sign(idx))
                for n, r in enumerate(R):
                    c = f_mul(S_def(D, D, r, p, j, k), vstar)
                    if c:
                        w[n][A] = f_add(w[n].get(A, {}), c)
    G = [[{} for _ in R] for _ in R]
    for x in range(len(R)):
        for y in range(len(R)):
            acc = {}
            for A, c in w[x].items():
                if A in w[y]:
                    acc = f_add(acc, f_mul(c, w[y][A]))
            G[x][y] = acc
    return G, len(set().union(*[set(v) for v in w]))


def V(D, T, r, p, j, k):
    if r > j + k:
        return 0
    return U(1, r, j + k, j) * U(1, D - r, T - r, p)


def Y_rational(rows, D):
    """eq:Yrational"""
    R = R_D(D)
    Y = [[Fraction(0)] * len(R) for _ in R]
    for row in rows:
        t = row['t']
        ents = list(row['a'].items())
        for (p, j), a in ents:
            i = p + j - t
            for (q, l), b in ents:
                k = q + l - t
                T = p + j + k
                if T < D:
                    continue
                for x, r in enumerate(R):
                    vr = V(D, T, r, p, j, k)
                    if not vr:
                        continue
                    for y, s in enumerate(R):
                        vs = V(D, T, s, q, l, i)
                        if vs:
                            e2 = 1 - 2 * T + p + q - t + (r + s) // 2
                            Y[x][y] -= a * b * vr * vs * Fraction(2) ** e2 * Fraction(fact(i) * fact(k) * fact(t), fact(T - D))
    return [[v / P ** 2 for v in rr] for rr in Y]


def Z_rational(D):
    """eq:Lrational and eq:Zrational"""
    R = R_D(D)
    Z = [[Fraction(0)] * len(R) for _ in R]
    nA = 0
    for a in range(0, D + 2):
        for b in range(a + 1, D + 2):
            for c in range(b + 1, D + 2):
                d = D + 1 - a - b - c
                if d <= c:
                    continue
                A = (a, b, c, d)
                nA += 1
                fA = fact(a) * fact(b) * fact(c) * fact(d)
                L = []
                for r in R:
                    acc = 0
                    for xi in range(4):
                        for yi in range(xi + 1, 4):
                            x, y = A[xi], A[yi]
                            j, k = [A[n] for n in range(4) if n not in (xi, yi)]
                            p = x + y - 1
                            acc += perm_sign((x, y, j, k)) * (x - y) * fact(p) * fact(j) * fact(k) * V(D, D, r, p, j, k)
                    L.append(Fraction(2) ** ((1 - 2 * D + r) // 2) * acc)
                for x in range(len(R)):
                    for y in range(len(R)):
                        Z[x][y] += L[x] * L[y] / fA
    return Z, nA


def matmul(A, B):
    return [[sum((A[i][k] * B[k][j] for k in range(len(B))), Fraction(0)) for j in range(len(B[0]))] for i in range(len(A))]


def psd_ldl(M):
    """exact symmetric elimination: returns (is_psd, rank, reason)"""
    a = [[Fraction(x) for x in row] for row in M]
    n = len(a)
    rank = 0
    for k in range(n):
        piv = a[k][k]
        if piv < 0:
            return False, rank, 'negative pivot %s at %d' % (piv, k)
        if piv == 0:
            nz = [j for j in range(k + 1, n) if a[k][j] != 0]
            if nz:
                return False, rank, 'zero pivot at %d with nonzero off-diagonal entry at %d' % (k, nz[0])
            continue
        rank += 1
        for i in range(k + 1, n):
            f = a[i][k] / piv
            if f:
                for j in range(k + 1, n):
                    a[i][j] -= f * a[k][j]
            a[i][k] = Fraction(0)
    return True, rank, ''


def charpoly_plus(M):
    """coefficients c_1..c_d of det(xI + M) = x^d + c_1 x^(d-1) + ... + c_d, by exact Lagrange interpolation of
    det(xI + M) at x = 0..d (d+1 Fraction determinants)"""
    d = len(M)
    xs = list(range(d + 1))
    vals = [det([[M[i][j] + (x if i == j else 0) for j in range(d)] for i in range(d)]) for x in xs]
    coeffs = [Fraction(0)] * (d + 1)               # coeffs[k] = coefficient of x^k
    for i, xi in enumerate(xs):
        basis = [Fraction(1)]                       # prod_{m != i} (x - x_m) / (x_i - x_m), ascending
        den = Fraction(1)
        for m, xm in enumerate(xs):
            if m == i:
                continue
            basis = [Fraction(0)] + basis
            for k in range(len(basis) - 1):
                basis[k] -= xm * basis[k + 1]
            den *= (xi - xm)
        for k in range(d + 1):
            coeffs[k] += vals[i] * basis[k] / den
    if coeffs[d] != 1:
        raise Refuse('interpolated det(xI+M) is not monic')
    return [coeffs[d - b] for b in range(1, d + 1)]


def signs(cs):
    return ''.join('+' if c > 0 else ('0' if c == 0 else '-') for c in cs)


# ---------------------------------------------------------------- printed values
def printed(src, tex):
    """every value the paper prints about the certificate, parsed from its TeX"""
    arith = src.text(tex['arith'])
    out = {}
    m = re.search(r'^floor&([0-9&]+)\\\\', arith, re.M)
    zs = re.search(r'^\$z\$&([0-9&]+)\\\\', arith, re.M)
    if not (m and zs):
        raise Refuse('floor table not found')
    out['floors'] = dict(zip([int(x) for x in zs.group(1).split('&')], [int(x) for x in m.group(1).split('&')]))
    out['signs'] = {int(d): s for d, s in re.findall(r'(\d+)&\\texttt\{([+0\-]+)\}', arith)}
    m = re.search(r'P\^2\\eta=\\sum_\\rho\\ell_\\rho\^2=(\d+)', arith)
    out['P2eta'] = int(m.group(1)) if m else None
    m = re.search(r'\\eps=3/10\^6', arith)
    out['eps'] = EPS if m else None
    return out


def printed_main(src, tex):
    out = {}
    intro = src.text(tex['intro'])
    m = re.search(r'\\gamma_\*=\\frac\{(\d+)\}\{10\^\{14\}\}>\s*\\frac1\{25\}', intro)
    out['gamma'] = Fraction(int(m.group(1)), 10 ** 14) if m else None
    gap = src.text(tex['gap'])
    m = re.search(r'1-\\frac\{(\d+)\}\{10\^\{14\}\}-\\frac\{61\}\{4096\}\s*-1222\\frac3\{10\^6\}\s*=\\gamma_\*=\\frac\{(\d+)\}\{10\^\{14\}\}>\\frac1\{25\}', gap)
    out['final'] = (int(m.group(1)), int(m.group(2))) if m else None
    m = re.search(r'\\delta_Q\\longrightarrow\\frac\{(\d+)\}\{(\d+)\}', gap)
    out['delta'] = Fraction(int(m.group(1)), int(m.group(2))) if m else None
    m = re.search(r'\(3z-1\)\(z\+1\)=(\d+)\+(\d+)m\+(\d+)m\^2', gap)
    out['poly'] = tuple(int(x) for x in m.groups()) if m else None
    m = re.search(r'are \$(\d+)/(\d+)\$,\s*\$(\d+)/(\d+)\$, and \$(\d+)/(\d+)\$', gap)
    out['sums'] = [Fraction(int(m.group(2 * n + 1)), int(m.group(2 * n + 2))) for n in range(3)] if m else None
    tr = src.text(tex['transfer'])
    m = re.search(r'=1222\\eps H', tr)
    out['1222'] = 1222 if m else None
    m = re.search(r'\\sum_\{m=1\}\^\{12\}m\^2\+\s*\\sum_\{m=1\}\^\{11\}m\(m\+1\)', tr)
    out['1222_split'] = bool(m)
    comp = src.text(tex['comparison'])
    out['eps_main'] = EPS if re.search(r'\\eps=3\\cdot10\^\{-6\}', comp) else None
    out['z_list'] = bool(re.search(r'z\\in\\\{2,4,5,\\ldots,15\\\}', comp))
    return out


# ---------------------------------------------------------------- the decision
def certify_rows(rows_text, pr, eps=EPS, checks=None, timing=None):
    """the finite certificate: decides eq:3certificate and eq:4certificate from rows_text and compares every
    recomputable printed value in pr (floors, signs, P2eta). Returns (checks, value)."""
    checks = [] if checks is None else checks
    rows = parse_rows(rows_text)
    check(checks, 'rows.txt parses into seven rows', len(rows) == 7, '%d rows, %d entries' % (len(rows), sum(len(r['a']) for r in rows)))
    ok_t = all(0 <= r['t'] <= 7 for r in rows)
    ok_S = all(0 <= p <= 7 and 0 <= j <= 8 and 0 <= p + j - r['t'] <= 8 for r in rows for (p, j) in r['a'])
    ok_nz = all(a != 0 for r in rows for a in r['a'].values())
    check(checks, 'every t_rho in {0..7}; every entry in S_rho (0<=p<=7, 0<=j<=8, 0<=p+j-t<=8); every listed entry nonzero', ok_t and ok_S and ok_nz)
    ok_forms = all(Fraction(2 ** p * comb(p + j, p), 2 ** r['t'] * comb(p + j, r['t'])) ==
                   Fraction(2 ** p, 2 ** r['t']) * Fraction(fact(r['t']) * fact(p + j - r['t']), fact(p) * fact(j))
                   for r in rows for (p, j) in r['a'])
    check(checks, 'the two printed forms of eq:alphadata agree on every entry', ok_forms)
    maxT3 = max(p + j for r in rows for (p, j) in r['a'])
    maxT4 = max(T1 + T2 - r['t'] for r in rows for T1 in {p + j for (p, j) in r['a']} for T2 in {p + j for (p, j) in r['a']})
    modes = {j for r in rows for (p, j) in r['a']} | {p + j - r['t'] for r in rows for (p, j) in r['a']}
    check(checks, 'three-body levels T = p+j <= 15; four-body levels T = p+j+k <= 23; only modes 0..8', maxT3 <= 15 and maxT4 <= 23 and max(modes) <= 8 and min(modes) >= 0,
          'max T3 = %d, max T4 = %d, modes %d..%d' % (maxT3, maxT4, min(modes), max(modes)))
    eta2 = sum(r['l'] ** 2 for r in rows)
    check(checks, 'P^2 eta = sum l^2 equals the printed %s' % pr.get('P2eta'), eta2 == pr.get('P2eta'), str(eta2))

    t0 = time.time()
    # three-body
    margins, e_vals, irr3, agree3 = {}, {}, [], True
    for z in range(0, 16):
        ef = e_from_definitions(rows, z)
        ev = f_rational(ef)
        if ev is None:
            irr3.append(z)
            continue
        e_vals[z] = ev
        if ev != e_rational(rows, z):
            agree3 = False
    check(checks, 'e_z from the definitions (eq:coupling, eq:alphadata, eq:ez) has no irrational part, z = 0..15', not irr3, 'irrational at z = %s' % irr3 if irr3 else 'radicals cancel exactly')
    check(checks, 'e_z from the definitions equals the paper\'s rational formula eq:erational, z = 0..15', agree3 and not irr3)
    for z in Z3:
        if z in e_vals:
            margins[z] = qlim(z) - e_vals[z]
    fl = {z: math.floor(10 ** 6 * margins[z]) for z in margins}
    for z in Z3:
        if z not in margins:
            check(checks, 'm_%d > 0' % z, False, 'not computed')
            continue
        check(checks, 'm_%d = (3/2)(3z-1)(-1/2)^z - e_z > 0' % z, margins[z] > 0, 'm_z ~ %.9f' % float(margins[z]))
        check(checks, 'floor(10^6 m_%d) = printed %s' % (z, pr['floors'].get(z)), fl[z] == pr['floors'].get(z), str(fl[z]))
    check(checks, 'the printed floor table lists exactly z in {2,4,5,...,15}', sorted(pr['floors']) == Z3)
    if timing is not None:
        timing['three_body_s'] = round(time.time() - t0, 2)

    # four-body
    t0 = time.time()
    ranks, sgn, minpiv = {}, {}, {}
    all_ok_def, all_ok_N, all_psd, all_signs = True, True, True, True
    detail_bad = []
    for D in range(1, 24):
        R = R_D(D)
        d = len(R)
        u = [u_(r, D) for r in R]
        Ef = E_from_definitions(rows, D)
        Gf, nAdef = G_from_definitions(D)
        Y = [[None] * d for _ in R]
        Z = [[None] * d for _ in R]
        for x in range(d):
            for y in range(d):
                Y[x][y] = f_rational(f_mul(Ef[x][y], f_sqrt(1 / (u[x] * u[y]))))
                Z[x][y] = f_rational(f_mul(Gf[x][y], f_sqrt(1 / (u[x] * u[y]))))
        rational = all(v is not None for rr in Y + Z for v in rr)
        Yr = Y_rational(rows, D)
        Zr, nA = Z_rational(D)
        same = rational and Y == Yr and Z == Zr
        sym = rational and all(Y[x][y] == Y[y][x] for x in range(d) for y in range(d))
        if not (same and sym):
            all_ok_def = False
            detail_bad.append('D=%d: rational %s, definitions==paper formulas %s, symmetric %s' % (D, rational, same, sym))
            continue
        B = [[(Fraction(2 if R[x] == 1 else 0) + eps) * u[x] if x == y else Fraction(0) for y in range(d)] for x in range(d)]
        B = [[B[x][y] - u[x] * Y[x][y] * u[y] for y in range(d)] for x in range(d)]
        M = matmul(matmul(Z, B), Z)
        # the certificate matrix itself, in the field: N = G (2chi - E + eps I) G, against D_sqrt(u) M D_sqrt(u)
        C = [[f_add({1: (Fraction(2 if R[x] == 1 else 0) + eps)} if x == y else {}, Ef[x][y], -1) for y in range(d)] for x in range(d)]
        GC = [[{} for _ in R] for _ in R]
        for x in range(d):
            for y in range(d):
                acc = {}
                for k in range(d):
                    acc = f_add(acc, f_mul(Gf[x][k], C[k][y]))
                GC[x][y] = acc
        okN = True
        for x in range(d):
            for y in range(d):
                acc = {}
                for k in range(d):
                    acc = f_add(acc, f_mul(GC[x][k], Gf[k][y]))
                if acc != f_scale(f_sqrt(u[x] * u[y]), M[x][y]):
                    okN = False
        all_ok_N &= okN
        is_psd, rk, why = psd_ldl(M)
        cs = charpoly_plus(M)
        sg = signs(cs)
        ranks[D], sgn[D] = rk, sg
        if not is_psd:
            all_psd = False
            detail_bad.append('D=%d: M not PSD (%s)' % (D, why))
        if sg != pr['signs'].get(D) or sg.count('+') != rk or '-' in sg:
            all_signs = False
            detail_bad.append('D=%d: signs %s vs printed %s, LDL rank %d' % (D, sg, pr['signs'].get(D), rk))
        if nAdef > nA:
            all_ok_def = False
            detail_bad.append('D=%d: w* supported on %d quadruples, more than the %d enumerated' % (D, nAdef, nA))
    check(checks, 'D = 1..23: Y = E_D/sqrt(u_r u_s) and Z = G_D/sqrt(u_r u_s) from the definitions (eq:S, eq:E, eq:pairstar, eq:wstar) are rational, Y symmetric, and equal eq:Yrational / eq:Zrational', all_ok_def,
          '; '.join(x for x in detail_bad if 'rational' in x) or 'all 23')
    check(checks, 'D = 1..23: G_D (2chi - E_D + eps I) G_D equals D_sqrt(u) M D_sqrt(u) entrywise in the field (eq:M)', all_ok_N and all_ok_def)
    notpsd = [x for x in detail_bad if 'not PSD' in x]
    check(checks, 'D = 1..23: M = Z B Z is positive semidefinite (exact LDL^T over Fraction)', all_psd and all_ok_def and len(ranks) == 23,
          '; '.join(notpsd) if notpsd else 'ranks ' + ' '.join('%d:%d' % (D, ranks[D]) for D in sorted(ranks)))
    for D in range(1, 24):
        check(checks, 'D = %d: det(xI+M) coefficient signs (exact interpolation) = printed %s; #+ = LDL rank' % (D, pr['signs'].get(D)),
              D in sgn and sgn[D] == pr['signs'].get(D) and sgn[D].count('+') == ranks[D], sgn.get(D, 'not computed'))
    check(checks, 'the printed sign table lists exactly D = 1..23', sorted(pr['signs']) == list(range(1, 24)))
    if timing is not None:
        timing['four_body_s'] = round(time.time() - t0, 2)
    value = {'eta': '%d/10^14' % eta2,
             'margins': {z: str(margins[z]) for z in margins},
             'floors': fl,
             'min_margin': (min(margins, key=lambda z: margins[z]), '%.3e' % float(min(margins.values()))) if margins else None,
             'e_omitted_blocks': {z: '%.6f' % float(e_vals[z]) for z in (0, 1, 3) if z in e_vals},
             'four_body_ranks': ranks, 'four_body_signs': sgn}
    return checks, value, eta2


def series_checks(checks, pr):
    """61/4096, 1222, gamma_*: printed arithmetic of the final margin"""
    poly = pr.get('poly')
    if poly is not None:
        okp = all((3 * (17 + 2 * m) - 1) * (17 + 2 * m + 1) == poly[0] + poly[1] * m + poly[2] * m * m for m in range(5))
        check(checks, '(3z-1)(z+1) = printed %d + %dm + %dm^2 at z = 17+2m (degree 2: 5 points decide it)' % poly, okp)
    x = Fraction(1, 4)
    closed = [1 / (1 - x), x / (1 - x) ** 2, x * (1 + x) / (1 - x) ** 3]
    # enclosure: partial sum to N, tail of m^k 4^-m for m > N bounded by 2 * (N+1)^k 4^-(N+1)
    # (ratio of consecutive terms ((m+1)/m)^k / 4 <= 2^2/4 = 1 ... use the sharper bound for m >= N+1 >= 3: ((m+1)/m)^2/4 <= 4/9 < 1/2)
    N = 80
    encl = []
    for k in range(3):
        part = sum(Fraction(m ** k, 4 ** m) for m in range(N + 1))
        tail = 2 * Fraction((N + 1) ** k, 4 ** (N + 1))
        encl.append((part, part + tail))
    ok_s = all(lo <= c <= hi for (lo, hi), c in zip(encl, closed))
    if pr.get('sums') is not None:
        ok_s = ok_s and pr['sums'] == closed
    check(checks, 'series sums of 4^-m, m 4^-m, m^2 4^-m = 4/3, 4/9, 20/27 (closed form, inside an exact partial sum + geometric tail enclosure)%s' %
          (', as printed' if pr.get('sums') is not None else ''), ok_s, str([str(c) for c in closed]))
    delta = Fraction(3, 2) * Fraction(1, 2 ** 17) * (900 * closed[0] + 208 * closed[1] + 12 * closed[2])
    lo = Fraction(3, 2) * sum(Fraction((3 * z - 1) * (z + 1), 2 ** z) for z in range(17, 17 + 2 * N, 2))
    zl = 17 + 2 * N
    hi = lo + Fraction(3, 2) * 2 * Fraction((3 * zl - 1) * (zl + 1), 2 ** zl)
    check(checks, 'delta = (3/2) sum_{z odd >= 17} (3z-1)(z+1) 2^-z = printed 61/4096 (exact; and enclosed directly)', delta == pr.get('delta') == Fraction(61, 4096) and lo <= delta <= hi,
          '%s in [%.12f, %.12f]' % (delta, float(lo), float(hi)))
    nD = {}
    for D in range(1, 24):
        nD[D] = sum(1 for p in range(D + 1) for j in range(D + 1) for k in range(D + 1) if p + j + k == D and j < k)
    ok1222 = all(nD[D] == (D + 1) ** 2 // 4 == sum(-(-n // 2) for n in range(1, D + 1)) for D in nD)
    s1222 = sum(nD.values())
    check(checks, 'sum_{D=1}^{23} n_D (triples p+j+k=D, j<k, counted) = floor((D+1)^2/4) summed = printed 1222 = printed sum_{m<=12} m^2 + sum_{m<=11} m(m+1)',
          ok1222 and s1222 == pr.get('1222') and bool(pr.get('1222_split')) and
          sum(m * m for m in range(1, 13)) + sum(m * (m + 1) for m in range(1, 12)) == s1222, str(s1222))
    return delta, s1222


def decide(src=None, rows_text=None, floors=None, sign_table=None, gamma=None, eps=EPS):
    src = src or Sources()
    checks = []
    timing = {}
    t0 = time.time()
    try:
        text = src.text(ROWS)
        pr = printed(src, TEX)
        pm = printed_main(src, TEX)
        src.text(TEX['spin'])
        comp = src.text(TEX['comparison'])
        intro = src.text(TEX['intro'])
        arith = src.text(TEX['arith'])
        check(checks, 'the paper prints the claim and the two certificates as decided here',
              all(k in intro for k in ('H_Q^2\\ge\\gamma H_Q', 'H_{N,Q}\\ge\\frac1{25}\\bigl(I-P_{\\mathrm L,N}\\bigr)')) and
              'e_z<\\frac32(3z-1)(-1/2)^z' in comp and 'G_D(2\\chi-E_D+\\eps I)G_D\\ge0' in comp and pm['z_list'] and
              '\\lstinputlisting{../verification/rows.txt}' in arith, 'thm:fock, thm:main, eq:3certificate, eq:4certificate, lstinputlisting')
        check(checks, 'eps = 3/10^6 in the certificate statement and in the arithmetic', pm.get('eps_main') == EPS and pr.get('eps') == EPS)
        if rows_text is not None:
            text = rows_text
        if floors is not None:
            pr['floors'] = floors
        if sign_table is not None:
            pr['signs'] = sign_table
        if gamma is not None:
            pm['gamma'] = gamma
        checks, value, eta2 = certify_rows(text, pr, eps=eps, checks=checks, timing=timing)
        delta, s1222 = series_checks(checks, pm)
        g = 1 - Fraction(eta2, 10 ** 14) - delta - s1222 * EPS
        fin = pm.get('final')
        check(checks, '1 - eta - 61/4096 - 1222 eps = gamma_* exactly, with eta from the rows and gamma_* as printed (intro and eq:finalmargin)',
              pm.get('gamma') is not None and g == pm['gamma'] and fin is not None and fin[0] == eta2 and Fraction(fin[1], 10 ** 14) == pm['gamma'],
              '%s = %d/10^14' % (g, g * 10 ** 14) if (g * 10 ** 14).denominator == 1 else str(g))
        check(checks, 'gamma_* > 1/25', pm.get('gamma') is not None and pm['gamma'] > Fraction(1, 25), 'gamma_* - 1/25 = %s' % (pm['gamma'] - Fraction(1, 25) if pm.get('gamma') else None))
        value['gamma_star'] = str(g)
        value['observation_lean_rows_equal_rows_txt'] = lean_rows_equal(src, parse_rows(src.text(ROWS)))
    except Refuse as e:
        return {'verdict': 'REFUSED', 'checks': checks + [{'check': 'refusal', 'pass': False, 'detail': str(e)}], 'sources': src.read,
                'decides': DECIDES, 'value': {'reason': str(e)}}
    value['runtime_s'] = round(time.time() - t0, 2)
    value.update(timing)
    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read, 'decides': DECIDES, 'value': value}


LEAN_ROWS = ['lean/OAI/Analysis/Laughlin/Operators/Certificate.lean', 'lean/OAI/Analysis/Laughlin/FourBody/RowCompute.lean']


def lean_rows_equal(src, rows):
    """an OBSERVATION, not a check of the claim (recorded after the clean-room run): the release's Lean development
    restates the rows as a literal list in two files; is it the same data as rows.txt? (data compared, nothing run)"""
    out = {}
    for path in LEAN_ROWS:
        s = src.text(path)
        i = s.find('def rows')
        lean = []
        for m in re.finditer(r'\((\d+), (-?\d+), \[(.*?)\]\)', s[i:s.find(')])]', i) + 4] if i >= 0 else ''):
            lean.append({'t': int(m.group(1)), 'l': int(m.group(2)),
                         'a': {(int(a), int(b)): int(c) for a, b, c in re.findall(r'\((\d+), (\d+), (-?\d+)\)', m.group(3))}})
        out[path.split('/')[-1]] = (len(lean) == 7 and lean == rows)
    return out


DECIDES = ('a finite component: the seven published rows give the 13 three-body margins of eq:3certificate (all > 0, '
           'floors as printed) and the 23 four-body certificates of eq:4certificate (M >= 0 exactly, sign table as printed), '
           'each re-derived from the definitions and from the paper\'s rational formulas; plus P^2 eta, 61/4096, 1222 and '
           'gamma_* = 4616733319001/10^14 > 1/25. NOT the analytic reduction from these certificates to H_Q^2 >= gamma H_Q '
           'or to the 1/25 gap (lemmas, limits, transfer, tail, existential Q_gamma and N_0).')


def _failing(res):
    return '; '.join(c['check'][:70] + (' [' + c['detail'][:60] + ']' if c['detail'] else '') for c in res['checks'] if not c['pass'])[:400]


def forge_rows(text):
    """two data forges, each a one-digit change to one integer of rows.txt (found by search: a single
    leading-digit change of the published entries breaks a three-body margin in 148 of 250 cases)"""
    a = text.replace(' 16:-43084 ', ' 16:-53084 ', 1)          # row 1 (t=0): breaks m_6
    b = text.replace('0 7181518 05:-849651 ', '0 7181518 05:-749651 ', 1)   # row 1 (t=0): breaks M >= 0 at D = 13 only
    assert a != text and b != text
    return [('row 1 (t=0): a_16 = -43084 -> -53084 (one digit)', a),
            ('row 1 (t=0): a_05 = -849651 -> -749651 (one digit; all 13 three-body margins stay positive)', b)]


def forge():
    """each must NOT certify; the failing checks are named"""
    src = Sources()
    text = src.text(ROWS)
    out = []
    for desc, bad in forge_rows(text):
        r = decide(rows_text=bad)
        out.append((desc + ' -> fails: ' + _failing(r), r['verdict']))
    r = decide(eps=Fraction(0))
    out.append(('the allowance removed, eps = 0 -> fails: ' + _failing(r), r['verdict']))
    pr = printed(Sources(), TEX)
    fl = dict(pr['floors'])
    fl[14] += 1
    r = decide(floors=fl)
    out.append(('printed floor at z = 14: 6470 -> 6471 -> fails: ' + _failing(r), r['verdict']))
    sg = dict(pr['signs'])
    sg[9] = '+++00'
    r = decide(sign_table=sg)
    out.append(('printed signs at D = 9: ++000 -> +++00 -> fails: ' + _failing(r), r['verdict']))
    r = decide(gamma=Fraction(4616733319002, 10 ** 14))
    out.append(('gamma_* = 4616733319002/10^14 -> fails: ' + _failing(r), r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1, default=str))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], '|', c['detail'])
    print('sources:', json.dumps(res['sources'], indent=1))
    print('%.1fs' % (time.time() - t))
    t = time.time()
    for d, v in forge():
        print('FORGE', v, '-', d)
    print('forges %.1fs' % (time.time() - t))
