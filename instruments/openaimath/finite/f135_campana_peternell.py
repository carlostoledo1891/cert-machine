"""F-135 — "The Campana-Peternell conjecture in dimension six" (openai/math family 067).

THE HEADLINE (build/sections/01-introduction.tex:23-26, Theorem thm:main): every smooth connected complex projective
Fano variety of dimension six with nef tangent bundle is rational homogeneous.

THE FINITE CLAIM (build/sections/05-arithmetic.tex:10-22, Lemma lem:finite-ratio): let A, C_1 and N be the rational
matrices and index set defined in Section 4 (04-characteristic-classes.tex:176-388). If xi in Q^11 and eta in Q^18
satisfy xi_0 = eta_0 = 1 and N (xi_i eta_j)_{(i,(j)) in C_1} = 0, then 32 - 20 eta_1 + 3 eta_1^2 = 0.
Its printed certificate (05-arithmetic.tex:29-204): A is 1785 x 581 (nonzero rows), K is 581 x 65 with AK = 0,
P is 129 x 65, N is 69 x 129, with ranks mod 10007 equal to 516, 65, 60, 69; |C_n| = 129, 1140, 6820;
dim K_n(F_10007) = 60, 163, 6; the double-slice matrix is 8280 x 6820 with modular rank 6814; six explicit rational
columns lie in K_3 with a 6 x 6 minor -16/5 (blocks -8/15 and 6), and the target functional vanishes on them.

WHAT IS DECIDED HERE, with code written for this audit from the paper's definitions (no release code read or run
before it ran):
  1. The ring R = Q[h,x2..x6,l,r,s,t] (weights 1,2,3,4,5,6,1,1,2,3), the monomial lists in the paper's recursive
     order, Newton's power sums p_i, q_i, D_i (eq:D-polynomials), Delta (eq:Delta-recursion, c = 2h - l),
     theta_i (eq:todd-recursion), psi_i (eq:todd-dual), with exact Fraction coefficients; D_1 = 5; the printed
     beta_j are re-derived from Bernoulli numbers (beta_j = -B_j / j!); the theta recursion is checked against the
     product of the Todd factors at a rational test point; every row polynomial is weight-homogeneous of weight 9.
  2. A from the six row families: 581 columns and 1785 nonzero rows. Its rank is computed EXACTLY over Q (516), a
     kernel basis K (canonical, from the exact RREF) is verified AK = 0 over Q, so K is a rational basis of ker A.
  3. P (129 x 65) from the selected monomials G_j M_i / h^(w_j - 3); exact rank 60. N is computed exactly: the RREF
     of a basis of the left kernel of P (determined by the ordered coordinates, independent of the choice of K);
     NP = 0 over Q, 69 rows. The printed ranks mod 10007 are recomputed for A, K, P and N, and every denominator in
     A, K, P, N is checked to be prime to 10007.
  4. THE UPPER BOUND dim_Q K_3 <= 6, by a certified modular route. K_1(F_p) = ker(N mod p); K_2(F_p) and K_3(F_p)
     are computed by our own slice-by-slice merging over F_p (p = 10007) with packed-integer elimination. K_3(F_p)
     is exactly the kernel of the reduction mod p of the rational 8280 x 6820 double-slice matrix M (every double
     slice of v must lie in ker N mod p), so dim K_3(F_p) = 6 means rank_{F_p}(M mod p) = 6814. M is p-integral
     (N's denominators are units mod p), and a rank mod p is a LOWER bound for the rank over Q (a nonzero minor mod
     p is a nonzero rational minor), so rank_Q M >= 6814 and dim_Q K_3 <= 6. The same computation is repeated
     mod 1000003 as a corroboration. A second route to the same rank, OFF by default because of its cost
     (`python3 f135_campana_peternell.py --direct`): sparse elimination of the literal 8280 x 6820 matrix mod
     10007, sharing nothing with the merging but N; run once on 2026-10-10, rank 6814 in 924 s.
  5. THE LOWER BOUND AND THE CONCLUSION, exactly over Q: the six printed columns (three product columns from
     B(0), B(1), B' with H^a, H^b, three sparse columns s1, s2, s3) are built on C_3, and N annihilates every one
     of the 120 double slices of every column (exact integer arithmetic after clearing denominators). The 6 x 6
     minor on the printed rows is -16/5, its upper-right block is zero, the blocks are -8/15 and 6. So the six
     columns are a rational basis of K_3, the functional 32 v_{0,(0,0,0)} - 20 v_{0,(0,0,1)} + 3 v_{0,(0,1,1)}
     vanishes on each, and on the product vector v_{i,z} = xi_i prod eta_z (which lies in K_3 because each double
     slice is eta_a eta_b (xi_i eta_j)) it reads 32 - 20 eta_1 + 3 eta_1^2. That is the lemma.

WHAT IS NOT DECIDED: the geometry that turns a Fano sixfold with nef tangent bundle into these equations — the
universal family and its tangent sequences, the descent lemmas (lem:p1-involution, lem:shifted-descent), the
Riemann-Roch vanishings (lem:constant-hodge, eq:grr-vanishings), the projection formula giving
N(xi_i eta_j) = 0 with eta_1 = u, the pseudoindex cases of Sections 2-3, and Section 6's identification of the
variety of minimal rational tangents from u in {4, 8/3}. This row decides a finite component (the whole of Lemma
lem:finite-ratio as a statement about the defined matrices), not the headline.
"""
import array
import os
import sys
import time
from fractions import Fraction
from itertools import combinations_with_replacement
from math import comb, gcd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check, det  # noqa: E402
from _poly import add, const, evaluate, mul, pw, scale, sub, total, var  # noqa: E402

DIR = 'preprints/The-Campana-Peternell-conjecture-in-dimension-six-September-25-2026/build/'
S01 = DIR + 'sections/01-introduction.tex'
S02 = DIR + 'sections/02-p1-cohomology.tex'
S04 = DIR + 'sections/04-characteristic-classes.tex'
S05 = DIR + 'sections/05-arithmetic.tex'
S08 = DIR + 'sections/08-certificate.tex'

NV = 10
WT = (1, 2, 3, 4, 5, 6, 1, 1, 2, 3)
H, X2, X3, X4, X5, X6, L, R, S, T = range(10)
BASE = [H, X2, X3, X4, X5, X6]
INV = [L, R, S, T]
ALL = list(range(NV))
J = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15, 16, 17]
BETA = {1: Fraction(1, 2), 2: Fraction(-1, 12), 4: Fraction(1, 720), 6: Fraction(-1, 30240), 8: Fraction(1, 1209600)}
P_MOD = 10007
P_ALT = 1000003

# ---------------------------------------------------------------- the ring and the polynomials of Section 4


def mons(gens, k):
    """weight-k monomials in gens, in the paper's recursive order (04:279-282): for the last generator g of
    weight a, list g^j times the weight-(k - aj) monomials in the preceding generators, j increasing"""
    if k < 0:
        return []
    if not gens:
        return [(0,) * NV] if k == 0 else []
    g = gens[-1]
    a = WT[g]
    out = []
    for j in range(k // a + 1):
        for m in mons(gens[:-1], k - a * j):
            mm = list(m)
            mm[g] += j
            out.append(tuple(mm))
    return out


def weight(m):
    return sum(a * b for a, b in zip(m, WT))


def mono(m):
    return {m: Fraction(1)}


def bernoulli(n):
    """B_0..B_n with B_1 = -1/2, from sum_{k=0}^{m} C(m+1,k) B_k = 0"""
    B = [Fraction(1)]
    for m in range(1, n + 1):
        B.append(-sum(comb(m + 1, k) * B[k] for k in range(m)) / (m + 1))
    return B


def ring(beta=None):
    beta = BETA if beta is None else beta
    V = [var(i, NV) for i in range(NV)]
    one = const(Fraction(1), NV)
    h, l = V[H], V[L]
    c = sub(scale(h, 2), l)
    e = [None, V[R], V[S], V[T]]
    p = [scale(one, 3)]
    for i in range(1, 11):                                   # eq:newton-recursion
        acc = {}
        for j in range(1, min(3, i) + 1):
            acc = add(acc, scale(e[j], i) if j == i else mul(e[j], p[i - j]), (-1) ** (j + 1))
        p.append(acc)
    mh = scale(h, -1)
    q = [total(*[scale(mul(p[j], pw(mh, i - j, NV)), comb(i, j)) for j in range(i + 1)]) for i in range(11)]
    lmh = sub(l, h)

    def geo(a):
        return total(*[mul(pw(h, k, NV), pw(lmh, a - 1 - k, NV)) for k in range(a)])
    Dp = [None]
    for i in range(1, 11):                                   # eq:D-polynomials
        first = scale(pw(c, i - 1, NV), 1 - (-1) ** i)
        second = total(*[scale(mul(p[j], geo(i - j)), comb(i, j) * (-1) ** (i - j)) for j in range(i)])
        Dp.append(sub(first, second))
    cache = {}

    def Delta(m):                                            # eq:Delta-recursion
        if m not in cache:
            if sum(m) == 0:
                r = {}
            else:
                g = next(v for v in BASE if m[v])
                n = list(m)
                n[g] -= 1
                n = tuple(n)
                dg = one if g == H else Dp[WT[g]]
                r = add(mul(dg, mono(n)), mul(sub(V[g], mul(c, dg)), Delta(n)))
            cache[m] = r
        return cache[m]
    theta = [one]
    for i in range(1, 10):                                   # eq:todd-recursion
        acc = {}
        for j in range(1, i + 1):
            if beta.get(j):
                acc = add(acc, scale(mul(q[j], theta[i - j]), beta[j]))
        theta.append(scale(acc, Fraction(1, i)))
    fact = [1]
    for i in range(1, 12):
        fact.append(fact[-1] * i)
    psi = [total(*[scale(mul(q[j], theta[i - j]), Fraction((-1) ** j, fact[j])) for j in range(i + 1)]) for i in range(10)]
    return dict(h=h, c=c, p=p, q=q, D=Dp, Delta=Delta, theta=theta, psi=psi, one=one)


def matrix_A(Rg):
    h, Delta, Dp, theta, psi = Rg['h'], Rg['Delta'], Rg['D'], Rg['theta'], Rg['psi']
    rows = []
    for i in range(0, 7):                                    # eq:matrix-rows-a
        for m in mons(BASE, i):
            for w in mons(INV, 9 - i):
                rows.append(('a', mul(mono(w), sub(mono(m), mul(h, Delta(m))))))
    for i in range(0, 7):                                    # eq:matrix-rows-b
        for m in mons(BASE, i):
            for w in mons(INV, 10 - i):
                rows.append(('b', mul(mono(w), Delta(m))))
    for i in range(7, 11):                                   # eq:matrix-rows-c
        for m in mons(BASE, i):
            for w in mons(ALL, 9 - i):
                rows.append(('c', mul(mono(w), mono(m))))
    for i in range(7, 11):                                   # eq:matrix-rows-d
        for m in mons(BASE, i):
            for w in mons(ALL, 10 - i):
                rows.append(('d', mul(mono(w), Delta(m))))
    for i in range(7, 11):                                   # eq:matrix-rows-e
        for w in mons(ALL, 10 - i):
            rows.append(('e', mul(mono(w), Dp[i])))
    for i in range(4, 10):                                   # eq:matrix-rows-f
        for w in mons(BASE, 9 - i):
            rows.append(('f', mul(mono(w), theta[i])))
            rows.append(('f', mul(mono(w), psi[i])))
    T9 = mons(ALL, 9)
    col = {m: k for k, m in enumerate(T9)}
    homog = all(weight(m) == 9 for _, r in rows for m in r)
    A = [{col[m]: v for m, v in r.items()} for _, r in rows if r]
    return A, T9, col, homog, len(rows)

# ---------------------------------------------------------------- exact linear algebra over Q (sparse rows)


def _axpy(r, f, pr):
    for cc, vv in pr.items():
        x = r.get(cc, 0) - f * vv
        if x:
            r[cc] = x
        else:
            r.pop(cc, None)


def rref_Q(vecs):
    """exact reduced row echelon form: {pivot column: row with 1 there and 0 in every other pivot column}"""
    piv = {}
    for vec in sorted(vecs, key=len):
        r = dict(vec)
        while r:
            c = min(r)
            pr = piv.get(c)
            if pr is None:
                inv = 1 / r[c]
                piv[c] = {cc: vv * inv for cc, vv in r.items()}
                break
            _axpy(r, r[c], pr)
    cols = sorted(piv)
    for c in reversed(cols):
        pr = piv[c]
        for c2 in cols:
            if c2 < c and piv[c2].get(c):
                _axpy(piv[c2], piv[c2][c], pr)
    return piv


def kernel_Q(vecs, n):
    piv = rref_Q(vecs)
    out = []
    for f in range(n):
        if f not in piv:
            v = {f: Fraction(1)}
            for c, r in piv.items():
                if r.get(f):
                    v[c] = -r[f]
            out.append(v)
    return piv, out

# ---------------------------------------------------------------- arithmetic mod p


def rank_mod_sparse(vecs, p):
    piv = {}
    for vec in vecs:
        r = {}
        for c, v in vec.items():
            x = v.numerator * pow(v.denominator, p - 2, p) % p if isinstance(v, Fraction) else v % p
            if x:
                r[c] = x
        while r:
            c = min(r)
            pr = piv.get(c)
            if pr is None:
                inv = pow(r[c], p - 2, p)
                piv[c] = {cc: vv * inv % p for cc, vv in r.items()}
                break
            f = r[c]
            for cc, vv in pr.items():
                x = (r.get(cc, 0) - f * vv) % p
                if x:
                    r[cc] = x
                else:
                    r.pop(cc, None)
    return len(piv)


def red(x, p):
    if x.denominator % p == 0:
        raise ZeroDivisionError('denominator divisible by %d' % p)
    return x.numerator * pow(x.denominator, p - 2, p) % p


# Packed rows: a vector over F_p is one Python integer with 64-bit slots (little-endian), so a row operation is one
# big-integer multiply-add. Slots are reduced lazily: in a Gauss-Jordan pass over at most n columns each slot grows
# by less than p^2 per step, and n p^2 < 2^64 for the primes and sizes used here (asserted).
_W = 64
_MASK = (1 << _W) - 1


def pack(lst):
    a = array.array('Q', lst)
    if sys.byteorder != 'little':
        a.byteswap()
    return int.from_bytes(a.tobytes(), 'little')


def unpack(x, n):
    a = array.array('Q')
    a.frombytes(x.to_bytes(8 * n, 'little'))
    if sys.byteorder != 'little':
        a.byteswap()
    return a.tolist()


def rref_mod(rows, ncols, p):
    """Gauss-Jordan over F_p on packed rows; returns [(pivot column, reduced row as a list)]"""
    assert (ncols + 2) * p * p < 1 << _W
    Rw = [pack([x % p for x in r]) for r in rows]
    used = [False] * len(Rw)
    piv = []
    for c in range(ncols):
        sh = _W * c
        sel = -1
        for k in range(len(Rw)):
            if not used[k] and ((Rw[k] >> sh) & _MASK) % p:
                sel = k
                break
        if sel < 0:
            continue
        lst = unpack(Rw[sel], ncols)
        inv = pow(lst[c] % p, p - 2, p)
        prow = pack([x * inv % p for x in lst])
        Rw[sel] = prow
        used[sel] = True
        for k in range(len(Rw)):
            if k != sel:
                e = ((Rw[k] >> sh) & _MASK) % p
                if e:
                    Rw[k] += (p - e) * prow
        piv.append((c, sel))
    return [(c, [x % p for x in unpack(Rw[k], ncols)]) for c, k in piv]


def kernel_mod(rows, ncols, p):
    piv = rref_mod(rows, ncols, p) if rows else []
    pc = {c for c, _ in piv}
    out = []
    for f in range(ncols):
        if f not in pc:
            v = [0] * ncols
            v[f] = 1
            for c, r in piv:
                v[c] = (-r[f]) % p
            out.append(v)
    return out


def Cn(n, M_has_h, Jw3):
    return [(i, z) for i in range(11) for z in combinations_with_replacement(J, n) if M_has_h[i] or any(j in Jw3 for j in z)]


def next_space(prev, n, p, M_has_h, Jw3, keep_all):
    """K_n(F_p) from a basis of K_{n-1}(F_p) (dict coordinate -> parameter vector), merging the slices
    j in J one at a time (05-arithmetic.tex:52-62 defines K_n; the merge solves Z_O a = B_O b on the overlap O).
    Returns (dict coordinate -> vector over the final parameters, dimension, coordinates covered)."""
    dprev = len(next(iter(prev.values())))
    Z, d, covered = None, 0, set()
    for idx, j in enumerate(J):
        Tj = {(i, tuple(sorted(z + (j,)))): vec for (i, z), vec in prev.items()}
        covered.update(Tj)
        if Z is None:
            Z, d = dict(Tj), dprev
        else:
            O = [x for x in Tj if x in Z]
            rows = [Z[x] + [(-y) % p for y in Tj[x]] for x in O]
            ker = kernel_mod(rows, d + dprev, p)
            k = len(ker)
            V1 = [pack([ker[t][m] for t in range(k)]) for m in range(d)]
            V2 = [pack([ker[t][d + m] for t in range(k)]) for m in range(dprev)]
            newZ = {}
            for x, vec in Z.items():
                acc = 0
                for m, a in enumerate(vec):
                    if a:
                        acc += a * V1[m]
                newZ[x] = [y % p for y in unpack(acc, k)] if k else []
            for x, vec in Tj.items():
                if x not in Z:
                    acc = 0
                    for m, a in enumerate(vec):
                        if a:
                            acc += a * V2[m]
                    newZ[x] = [y % p for y in unpack(acc, k)] if k else []
            Z, d = newZ, k
        if not keep_all:
            later = set(J[idx + 1:])
            Z = {(i, z): v for (i, z), v in Z.items()
                 if any(jj in later and (M_has_h[i] or any(t in Jw3 for t in _minus(z, jj))) for jj in set(z))}
    return Z, d, covered


def _minus(z, j):
    z = list(z)
    z.remove(j)
    return z


def spaces_mod(N, C1, p, M_has_h, Jw3):
    """dim K_1, K_2, K_3 over F_p from N mod p"""
    n1 = len(C1)
    Np = [[red(r.get(k, Fraction(0)), p) for k in range(n1)] for r in N]
    K1 = kernel_mod(Np, n1, p)
    prev = {C1[k]: [v[k] for v in K1] for k in range(n1)}
    prev = {(i, (j,)): vec for (i, j), vec in prev.items()}
    K2, d2, cov2 = next_space(prev, 2, p, M_has_h, Jw3, keep_all=True)
    _, d3, cov3 = next_space(K2, 3, p, M_has_h, Jw3, keep_all=False)
    return len(K1), d2, d3, len(K2), len(cov3)

def direct_rank(N, C1, p, M_has_h, Jw3):
    """rank over F_p of the literal double-slice matrix (05:134-137): one row per (row of N, unordered pair a <= b in
    J), 8280 x 6820, by sparse incremental elimination with C_3 in lexicographic order. A second route to the same
    number as the slice merging, sharing nothing with it but N; slow (about 15 minutes), so off by default."""
    C3 = Cn(3, M_has_h, Jw3)
    idx = {x: k for k, x in enumerate(sorted(C3))}
    piv = {}
    nrows = 0
    for a, b in combinations_with_replacement(J, 2):
        for row in N:
            nrows += 1
            r = {idx[(C1[k][0], tuple(sorted((C1[k][1], a, b))))]: red(x, p) for k, x in row.items()}
            while r:
                c = min(r)
                pr = piv.get(c)
                if pr is None:
                    inv = pow(r[c], p - 2, p)
                    piv[c] = {cc: vv * inv % p for cc, vv in r.items()}
                    break
                f = r[c]
                for cc, vv in pr.items():
                    x = (r.get(cc, 0) - f * vv) % p
                    if x:
                        r[cc] = x
                    else:
                        r.pop(cc, None)
    return len(piv), nrows, len(C3)


# ---------------------------------------------------------------- the six columns (05-arithmetic.tex:153-196)


def Bv(v):
    v = Fraction(v)
    return [Fraction(1), 7 - 2 * v / 5, 45 - 4 * v, 275 - 30 * v, Fraction(11), 65 - 2 * v, Fraction(85), Fraction(17), 95 - 2 * v,
            Fraction(25), Fraction(35)]


B_PRIME = [Fraction(x) for x in (1, Fraction(11, 5), 5, 11, -1, -1, 10, -3, -1, 0, 14)]
H_A = [Fraction(x) for x in (1, 4, 16, 64, 6, 24, 4, 3, 12, 48, 192, 768, 17, 68, 272, 96, 9, 36)]
H_B = [Fraction(x, 3) for x in (3, 8, 21, 54, 9, 24, 6, 14, 37, 97, 252, 648, 37, 97, 252, 96, 16, 42)]
SPARSE = [{(5, (15, 15, 15)): 3, (7, (15, 15, 15)): 1, (9, (15, 15, 15)): -5},
          {(7, (10, 10, 15)): 2, (7, (10, 10, 10)): 4, (9, (10, 10, 10)): 25},
          {(7, (10, 10, 10)): 1}]
MINOR_ROWS = [(0, (0, 0, 0)), (0, (0, 0, 1)), (1, (0, 0, 0)), (5, (15, 15, 15)), (7, (10, 10, 15)), (7, (10, 10, 10))]
FUNCTIONAL = {(0, (0, 0, 0)): 32, (0, (0, 0, 1)): -20, (0, (0, 1, 1)): 3}


def six_columns(C3, sparse=None):
    sparse = SPARSE if sparse is None else sparse
    cols = []
    for Bc, Hc in ((Bv(0), H_A), (Bv(1), H_A), (B_PRIME, H_B)):
        v = {}
        for (i, z) in C3:
            x = Bc[i]
            for j in z:
                x *= Hc[j]
            if x:
                v[(i, z)] = x
        cols.append(v)
    for s in sparse:
        cols.append({k: Fraction(x) for k, x in s.items()})
    return cols


def lcm(a, b):
    return a * b // gcd(a, b)


def in_K3(col, Nint, C1):
    """N annihilates every one of the 120 double slices of the column (exact integers after scaling)"""
    den = 1
    for x in col.values():
        den = lcm(den, x.denominator)
    vi = {k: int(x * den) for k, x in col.items()}
    pairs = list(combinations_with_replacement(J, 2))
    for a, b in pairs:
        sl = [vi.get((i, tuple(sorted((j, a, b)))), 0) for (i, j) in C1]
        if not any(sl):
            continue
        for row in Nint:
            if sum(c * sl[k] for k, c in row):
                return False, len(pairs)
    return True, len(pairs)

# ---------------------------------------------------------------- the decision


_HEAVY = {}


def heavy(beta_key=None, mods=(P_MOD, P_ALT)):
    key = (beta_key, mods)
    if key in _HEAVY:
        return _HEAVY[key]
    out = {}
    t = time.time()
    beta = dict(BETA)
    if beta_key:
        beta[beta_key[0]] = beta_key[1]
    Rg = ring(beta)
    out['ring'] = Rg
    A, T9, col, homog, nrows_all = matrix_A(Rg)
    out.update(A=A, T9=T9, col=col, homog=homog, nrows_all=nrows_all)
    pivA, K = kernel_Q(A, len(T9))
    out.update(rankA=len(pivA), K=K)
    out['AK0'] = all(sum(v * vec.get(k, 0) for k, v in r.items()) == 0 for vec in K for r in A)
    M6 = mons(BASE, 6)
    G = mons(INV, 3) + mons(INV, 4)
    M_has_h = [m[H] > 0 for m in M6]
    Jw3 = {j for j in J if weight(G[j]) == 3}
    C1 = [(i, j) for i in range(11) for j in J if weight(G[j]) == 3 or M_has_h[i]]
    sel = []
    for (i, j) in C1:
        m = list(M6[i])
        m[H] -= weight(G[j]) - 3
        sel.append(col[tuple(a + b for a, b in zip(m, G[j]))])
    P = [[vec.get(s, Fraction(0)) for vec in K] for s in sel]
    PT = [{i: P[i][k] for i in range(len(C1)) if P[i][k]} for k in range(len(K))]
    pivPT, left = kernel_Q(PT, len(C1))
    pivN = rref_Q(left)
    N = [pivN[c] for c in sorted(pivN)]
    out.update(M6=M6, G=G, M_has_h=M_has_h, Jw3=Jw3, C1=C1, sel=sel, P=P, rankP=len(pivPT), N=N)
    out['NP0'] = all(sum(r[i] * P[i][k] for i in r) == 0 for r in N for k in range(len(K)))
    out['t_exact'] = time.time() - t
    mod = {}
    for p in mods:
        t = time.time()
        try:
            mod[p] = spaces_mod(N, C1, p, M_has_h, Jw3)
        except ZeroDivisionError as e:
            mod[p] = str(e)
        mod[p] = (mod[p], time.time() - t)
    out['mod'] = mod
    _HEAVY[key] = out
    return out


def decide(src=None, beta_key=None, sparse=None, functional=None, mods=(P_MOD, P_ALT), direct=False):
    src = src or Sources()
    functional = FUNCTIONAL if functional is None else functional
    checks = []
    s01, s02, s04, s05, s08 = (src.text(f) for f in (S01, S02, S04, S05, S08))
    f05 = ' '.join(s05.split())
    check(checks, 'the theorem, the lemma and the certificate as printed (01:23-26, 05:10-22, 05:81-196, 08:23-29)',
          'Every smooth connected complex projective Fano variety of dimension six' in ' '.join(s01.split())
          and '32-20\\eta_1+3\\eta_1^2=0' in f05 and '$|C_1|=129$, $|C_2|=1140$ and $|C_3|=6820$' in f05
          and '$A$ & $1785\\times581$ & $516$' in f05 and '$N$ & $69\\times129$ & $69$' in f05
          and '\\dim\\mathcal K_2(\\mathbb F_{10007})=163' in f05 and 'Its modular rank is $6814$' in f05
          and 'The full minor is $-16/5$' in f05 and '6820\\cdot10006^2=682818645520<2^{63}-1' in s08
          and '\\delta(c^a)=(1-(-1)^a)c^{a-1}' in s02 and '\\Delta(gn)=(\\Delta g)n+(g-c\\Delta g)\\Delta n' in s04)
    Hv = heavy(beta_key, mods)
    Rg = Hv['ring']

    # 1. the ring
    check(checks, '1. D_1 = 5 (04:234)', Rg['D'][1] == {(0,) * NV: 5})
    Bn = bernoulli(8)
    fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320]
    check(checks, '1. the printed beta_j equal -B_j / j! (Bernoulli numbers re-derived; beta_3 = beta_5 = beta_7 = 0)',
          all(BETA.get(j, Fraction(0)) == -Bn[j] / fact[j] for j in range(1, 9)))
    y = [Fraction(2), Fraction(-3, 7), Fraction(5, 3)]
    hval = Fraction(1, 2)                          # evaluate at h = 1/2 with r,s,t the elementary symmetric of y+h
    ys = [a + hval for a in y]
    point = [hval, 0, 0, 0, 0, 0, Fraction(0), sum(ys), ys[0] * ys[1] + ys[0] * ys[2] + ys[1] * ys[2], ys[0] * ys[1] * ys[2]]
    Q = [(-1) ** n * Bn[n] / fact[n] for n in range(9)]     # x / (1 - e^{-x}) = sum (-1)^n B_n x^n / n!
    prod = [Fraction(1)] + [Fraction(0)] * 8
    for a in y:
        fa = [Q[n] * a ** n for n in range(9)]
        prod = [sum(prod[k] * fa[n - k] for k in range(n + 1)) for n in range(9)]
    check(checks, '1. theta_i (eq:todd-recursion) equals the degree-i part of prod Q(y_k), Q(x) = x/(1-e^-x), at a rational test point, i <= 8',
          all(evaluate(Rg['theta'][i], point) == prod[i] for i in range(9)) and all(evaluate(Rg['q'][i], point) == sum(a ** i for a in y) for i in range(10)))
    check(checks, '1. every row polynomial is weight-homogeneous of weight 9', Hv['homog'])

    # 2. A and its kernel, exactly
    A, K = Hv['A'], Hv['K']
    check(checks, '2. A: %d columns (T_9) and %d nonzero rows' % (581, 1785), len(Hv['T9']) == 581 and len(A) == 1785,
          '%d x %d (%d rows before dropping zero rows)' % (len(A), len(Hv['T9']), Hv['nrows_all']))
    check(checks, '2. rank_Q A = 516 exactly (exact rational RREF)', Hv['rankA'] == 516, str(Hv['rankA']))
    check(checks, '2. K (581 x 65, canonical from the RREF) satisfies AK = 0 over Q: a rational basis of ker A',
          Hv['AK0'] and len(K) == 65, '%d columns' % len(K))
    check(checks, '2. M = B_6 and G = (I_3, I_4) in the recursive order equal the printed lists (04:335-339)',
          [tuple(m[:6]) for m in Hv['M6']] == [(6, 0, 0, 0, 0, 0), (4, 1, 0, 0, 0, 0), (2, 2, 0, 0, 0, 0), (0, 3, 0, 0, 0, 0), (3, 0, 1, 0, 0, 0), (1, 1, 1, 0, 0, 0),
                                              (0, 0, 2, 0, 0, 0), (2, 0, 0, 1, 0, 0), (0, 1, 0, 1, 0, 0), (1, 0, 0, 0, 1, 0), (0, 0, 0, 0, 0, 1)]
          and [tuple(g[6:]) for g in Hv['G']] == [(3, 0, 0, 0), (2, 1, 0, 0), (1, 2, 0, 0), (0, 3, 0, 0), (1, 0, 1, 0), (0, 1, 1, 0), (0, 0, 0, 1),
                                                 (4, 0, 0, 0), (3, 1, 0, 0), (2, 2, 0, 0), (1, 3, 0, 0), (0, 4, 0, 0), (2, 0, 1, 0), (1, 1, 1, 0),
                                                 (0, 2, 1, 0), (0, 0, 2, 0), (1, 0, 0, 1), (0, 1, 0, 1)])

    # 3. P and N
    C1, P, N = Hv['C1'], Hv['P'], Hv['N']
    check(checks, '3. seven M_i contain h, six indices of J have weight three, |C_1| = 129, the 129 selected monomials distinct',
          sum(Hv['M_has_h']) == 7 and len(Hv['Jw3']) == 6 and len(C1) == 129 and len(set(Hv['sel'])) == 129)
    check(checks, '3. P is 129 x 65 with exact rank 60', len(P) == 129 and len(P[0]) == 65 and Hv['rankP'] == 60, str(Hv['rankP']))
    check(checks, '3. N (RREF of the left kernel of P) is 69 x 129 and NP = 0 over Q', len(N) == 69 and Hv['NP0'])
    p = P_MOD
    ranks = (rank_mod_sparse(A, p), rank_mod_sparse(K, p),
             rank_mod_sparse([{k: x for k, x in enumerate(row) if x} for row in P], p), rank_mod_sparse(N, p))
    check(checks, '3. ranks mod 10007 of A, K, P, N = 516, 65, 60, 69 (printed table, 05:93-97)', ranks == (516, 65, 60, 69), str(ranks))
    dens = [x.denominator for r in A for x in r.values()] + [x.denominator for r in K for x in r.values()] + \
           [x.denominator for row in P for x in row] + [x.denominator for r in N for x in r.values()]
    check(checks, '3. every denominator in A, K, P, N is prime to 10007', all(dd % p for dd in dens),
          'largest denominator in N has %d digits' % max(len(str(x.denominator)) for r in N for x in r.values()))

    # 4. the modular upper bound
    M_has_h, Jw3 = Hv['M_has_h'], Hv['Jw3']
    sizes = [len(Cn(n, M_has_h, Jw3)) for n in (1, 2, 3)]
    formula = [7 * comb(14 + n, n) + 4 * (comb(14 + n, n) - comb(8 + n, n)) for n in (1, 2, 3)]
    check(checks, '4. |C_n| = 129, 1140, 6820 by enumeration and by the printed formula', sizes == formula == [129, 1140, 6820], str(sizes))
    check(checks, '4. the double-slice matrix is 69 x 120 = 8280 rows by 6820 columns', len(N) * len(list(combinations_with_replacement(J, 2))) == 8280)
    check(checks, '4. 6820 * 10006^2 = 682818645520 < 2^63 - 1 (08:29)', 6820 * 10006 ** 2 == 682818645520 < 2 ** 63 - 1)
    res, tm = Hv['mod'][P_MOD]
    ok_mod = isinstance(res, tuple)
    check(checks, '4. dim K_1, K_2, K_3 over F_10007 = 60, 163, 6 (our own slice merging), K_2 covers all of C_2 and the 15 slices cover all of C_3',
          ok_mod and res == (60, 163, 6, 1140, 6820), '%s in %.0fs' % (res, tm))
    check(checks, '4. hence rank_F10007 (M mod 10007) = 6820 - 6 = 6814 and dim_Q K_3 <= 6 (modular rank is a lower bound on the rational rank)',
          ok_mod and 6820 - res[2] == 6814)
    if P_ALT in Hv['mod']:
        res2, tm2 = Hv['mod'][P_ALT]
        check(checks, '4. corroboration mod 1000003: dims 60, 163, 6', isinstance(res2, tuple) and res2[:3] == (60, 163, 6), '%s in %.0fs' % (res2, tm2))

    if direct:
        t = time.time()
        rk, nr, nc = direct_rank(Hv['N'], Hv['C1'], P_MOD, M_has_h, Jw3)
        check(checks, '4. second route (--direct): the literal %d x %d double-slice matrix has rank 6814 over F_10007 (sparse elimination)' % (nr, nc),
              rk == 6814 and (nr, nc) == (8280, 6820), 'rank %d in %.0fs' % (rk, time.time() - t))

    # 5. the six columns, exactly
    C3 = Cn(3, M_has_h, Jw3)
    cols = six_columns(C3, sparse)
    in3 = set(C3)
    check(checks, '5. every printed coordinate of the sparse columns, the minor rows and the functional lies in C_3',
          all(k in in3 for s in (sparse or SPARSE) for k in s) and all(k in in3 for k in MINOR_ROWS) and all(k in in3 for k in functional))
    Nint = []
    for r in N:
        dd = 1
        for x in r.values():
            dd = lcm(dd, x.denominator)
        Nint.append([(k, int(x * dd)) for k, x in sorted(r.items())])
    Hpair = ((Bv(0), H_A), (Bv(1), H_A), (B_PRIME, H_B))
    check(checks, '5. N (B_i H_j)_{C_1} = 0 exactly for (B(0),H^a), (B(1),H^a), (B\',H^b)',
          all(sum(x * Bc[C1[k][0]] * Hc[C1[k][1]] for k, x in r.items()) == 0 for Bc, Hc in Hpair for r in N))
    memb = [in_K3(cl, Nint, C1) for cl in cols]
    check(checks, '5. N annihilates all 120 double slices of each of the six columns (exact integers)', all(m for m, _ in memb),
          str([m for m, _ in memb]))
    Mx = [[cl.get(rw, Fraction(0)) for cl in cols] for rw in MINOR_ROWS]
    full = det(Mx)
    ul = det([row[:3] for row in Mx[:3]])
    lr = det([row[3:] for row in Mx[3:]])
    ur0 = all(Mx[a][b] == 0 for a in range(3) for b in range(3, 6))
    check(checks, '5. the 6 x 6 minor on the printed rows: upper-right block 0, blocks -8/15 and 6, full minor -16/5',
          ur0 and ul == Fraction(-8, 15) and lr == 6 and full == Fraction(-16, 5), 'blocks %s, %s; minor %s' % (ul, lr, full))
    fvals = [sum(c * cl.get(k, 0) for k, c in functional.items()) for cl in cols]
    check(checks, '5. the target functional vanishes on all six columns', all(v == 0 for v in fvals), str([str(v) for v in fvals]))
    check(checks, '5. on the product columns it reads 32 - 20 H_1 + 3 H_1^2 with H_1 = 4, 4, 8/3',
          [H_A[1], H_B[1]] == [4, Fraction(8, 3)] and all(32 - 20 * x + 3 * x * x == 0 for x in (H_A[1], H_B[1])))
    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: Lemma lem:finite-ratio (from the matrices A, C_1, N defined in Section 4, '
                       'N(xi_i eta_j) = 0 with xi_0 = eta_0 = 1 forces 32 - 20 eta_1 + 3 eta_1^2 = 0); dim_Q K_3 <= 6 by a '
                       'rank mod 10007 (a certified lower bound on the rational rank), everything else exact over Q; not '
                       'the geometry producing these equations, nor the classification',
            'value': {'A': '%d x %d, rank_Q %d' % (len(A), len(Hv['T9']), Hv['rankA']), 'N': '%d x %d' % (len(N), len(C1)),
                      'dims_mod_10007': res[:3] if ok_mod else res, 'minor': str(full), 't_exact_s': round(Hv['t_exact'], 1),
                      't_mod_s': {str(k): round(v[1], 1) for k, v in Hv['mod'].items()}}}


def forge():
    """each must NOT certify: a changed sparse-column entry; a wrong target functional; a perturbed Todd coefficient
    (which changes A, hence N, hence the solution space)"""
    out = []
    bad = [dict(s) for s in SPARSE]
    bad[1][(9, (10, 10, 10))] = 24
    out.append(('s2 entry at (9,(10,10,10)) changed 25 -> 24', decide(sparse=bad)['verdict']))
    out.append(('target functional 32 - 21 eta_1 + 3 eta_1^2', decide(functional={(0, (0, 0, 0)): 32, (0, (0, 0, 1)): -21, (0, (0, 1, 1)): 3})['verdict']))
    out.append(('beta_4 = 1/721 instead of 1/720 (A, N, K_3 recomputed; mod 10007 only)', decide(beta_key=(4, Fraction(1, 721)), mods=(P_MOD,))['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide(direct='--direct' in sys.argv)
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t))
