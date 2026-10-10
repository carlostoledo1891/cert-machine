"""F-433 — "The Reconstruction Threshold for the Ferromagnetic Four-State Potts Model" (openai/math family 229).

THE CLAIM (build/main.tex abstract; sections/01-introduction.tex:40-51, Theorem thm:main): for the channel
P(j|i) = lambda 1{i=j} + (1-lambda)/4 on [4], if d lambda^2 <= 1 then a_n(d, lambda) -> 0 on every d-ary tree (d >= 2)
and every Poisson(d) Galton-Watson tree, including equality. "The proof uses reproducible exact-arithmetic
verification of polynomial inequalities": Proposition prop:polynomial-inequalities (sections/03-cone.tex:47-63) —
for all p, q in the simplex Delta_4, F(p) >= 0, G(p) >= 0, H(p) >= -1/2, H(tx) >= t^3 H(x), and the two product
inequalities (A-product) [zA(P)](p,q) <= A(p)+A(q)-H(p)F(q)-F(p)H(q)-D0(p,q) and (H-product)
[zH(P)](p,q) >= H(p)G(q)+G(p)H(q), with H, F, G given by the coefficient table eq:polynomial-table (03-cone.tex:19-26).
Section 5 rewrites the products as R = K + sum_pi N_pi / z_pi^k >= 0 on S x S (eq:rational-K, eq:rational-rows,
eq:rational-target at 05-polynomial-certificates.tex:166-191), S the ordered simplex conv(S0..S3).

WHAT IS DECIDED HERE, exactly (integers and Fractions; floats nowhere), with code written for this audit (no release
code imported or run; the decider certified row a before certificate.cpp / small_polynomials.py were opened — later
edits only added the row-b region options):
  1. The table eq:polynomial-table is parsed from the LaTeX; the printed values H(e_i) = 13/100, H(u) = 0,
     H(1/2,1/2,0,0) = -3/25 are recomputed; the 24 coordinate permutations act on x = Lp as signed permutations with
     sign product +1 (so A, B, C, H, F, G are S4-invariant, which reduces everything to S and S x S).
  2. The single-posterior certificate (Lemma lem:scalar-checks, Table tab:scalar-coefficients at 05-...:126-141): the
     homogeneous forms of H+1/2 (degree 6), F (5), G (14), (3-E)H (6) on S are rebuilt from eq:scalar-homogenization;
     their coefficient counts and exact minimum coefficients are compared with the printed 84/56/680/84 and
     19/50, 0, 87/1000, 0. Nonnegative coefficients prove H >= -1/2, F >= 0, G >= 0 and (3-E)H >= 0 on S.
  3. Each product row (a: k=1, m=3; b: k=5, m=1/2) is re-derived from the definitions — K, U^pi, z_pi, N_pi — and
     decided on S x S by an INDEPENDENT exact subdivision (not the paper's Type T / Type P tree):
       * a global polynomial lower bound T_glob = K + sum_pi [(N_pi + m z^{k+1}) t_5(z_pi) - m z_pi] (degree-5 Taylor
         polynomial of z^{-k} at 1, a lower bound for every z > 0 since the degree-6 remainder is >= 0), built ONCE in
         Bernstein form on S x S through the S4 symmetry (sum_pi of a symmetric polynomial in U^pi is a sum of
         m_lambda(p) (x) m_lambda(q) terms) and cross-checked exactly against the direct formula at rational points;
         carried down the tree by exact integer de Casteljau midpoint splits; a cell is accepted if every Bernstein
         coefficient is >= 0;
       * otherwise, on cells with no vertex at the uniform point u, a per-cell bound computed from scratch: for each
         pi with z_pi in [zlo, zhi] on the cell (z_pi is bilinear, so zlo/zhi are its 16 vertex values) and zhi <= RHO
         zlo, the cubic Taylor polynomial of z^{-k} at a dyadic centre c (coefficients rounded DOWN, valid because
         A_pi z^j >= 0), giving A_pi t_c(z_pi) - m z_pi; for the other pi, row a uses Jensen — -|LU|^2/sum U is
         concave in U and U^pi(p,q) = sum_ij X_i Y_j U^pi(a_i, b_j), so the summand is >= the bilinear interpolation
         of its 16 vertex values (rounded down) — and row b uses the bound N_pi/z^5 >= -z_pi/2 (from H >= -1/2). The
         resulting polynomial is tested by nonnegativity of all its ordinary monomial coefficients in (X, Y);
       * otherwise the cell is bisected at the midpoint of its longest edge (edges at u weighted by 16, ties to the
         p side and the lowest indices), up to a depth cap. Coverage is the midpoint-subdivision lemma.
     Before subdividing, R is evaluated exactly at the 16 vertex pairs of S x S (a negative value would refute).

WHAT IS NOT DECIDED HERE:
  - The probabilistic reduction (Sections 2-4: posterior experiments, the preserved cone, the tree recursion and the
    moment saving), the S4-averaging argument behind the reduction to S x S (re-read; the invariance of A, B, C is
    computed), and the continuity of the summands at z_pi = 0 (re-read; used for cell boundaries).
  - The scaling inequality H(tx) >= t^3 H(x) beyond its finite input (3-E)H >= 0 on S (the ODE argument is re-read).
  - ROW b ON MOST OF S x S. Row a is decided on all of S x S. Row b is decided only on stated corner regions (the
    rows argument; by default the neighbourhood C x S u S x C of the singular set, C = u + (S - u)/8, which contains
    the whole singular set {p = u} u {q = u} where R_b vanishes and the degenerate corner (u, u) — 1379 cells, ~66
    CPU-minutes — and the corner C' x C', C' = S2 + (S - S2)/8, around (S2, S2), where float sampling found the
    smallest values of R_b away from the singular set (R_b(S2, S2) = 548203/41006250 exactly). These regions are about
    0.4% of S x S by volume. The rest of S x S is NOT decided: in pure Python the row-b per-cell bound (bidegree
    (9, 9)) costs ~5 s per cell, a float-guided exploration of the whole of S x S passed 15,200 cells without
    finishing (> 20 CPU-hours projected), and the larger corner S2 + (S - S2)/2 alone did not finish in 58 CPU-minutes.
"""
import itertools
import os
import re
import sys
import time
from fractions import Fraction
from math import comb, factorial, lcm

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, const, mul, pw, scale  # noqa: E402

PAPER = 'preprints/The-Reconstruction-Threshold-for-the-Ferromagnetic-Four-State-Potts-Model-October-5-2026/build/sections/'
F_EXP = PAPER + '02-experiments.tex'
F_CONE = PAPER + '03-cone.tex'
F_CERT = PAPER + '05-polynomial-certificates.tex'
F_FIN = PAPER + '06-finite-verification.tex'

LM = [[1, 1, -1, -1], [1, -1, 1, -1], [1, -1, -1, 1]]
S_VERTS = [[Fraction(1), Fraction(0), Fraction(0), Fraction(0)], [Fraction(1, 2), Fraction(1, 2), Fraction(0), Fraction(0)],
           [Fraction(1, 3)] * 3 + [Fraction(0)], [Fraction(1, 4)] * 4]
UNIF = [Fraction(1, 4)] * 4
DEG = [0, 2, 3, 4, 4, 5, 6, 6, 6]           # degrees of 1, A, B, A^2, C, AB, A^3, AC, B^2
PERMS = list(itertools.permutations(range(4)))
GBITS = 64                                  # dyadic precision of rounded-down weights
RHO = {'a': Fraction(10), 'b': Fraction(3, 2)}
DEPTH_CAP = 46


# ----------------------------------------------------------------------------------------------------------------------
# parsing
# ----------------------------------------------------------------------------------------------------------------------
def parse_poly_table(tex):
    """eq:polynomial-table: rows H, F, G; columns 1, A, B, A^2, C, AB, A^3, AC, B^2; entries divided by 1000"""
    i = tex.index('\\label{eq:polynomial-table}')
    block = tex[i:tex.index('\\end{array}', i)]
    rows = {}
    for name in ('H', 'F', 'G'):
        m = re.search(r'^\s*' + name + r'((?:&\s*-?\d+\s*)+)', block, re.M)
        rows[name] = [int(x) for x in re.findall(r'-?\d+', m.group(1))]
    return rows


def parse_scalar_table(tex):
    i = tex.index('\\begin{tabular}{lrrr}')
    block = tex[i:tex.index('\\end{tabular}', i)]
    out = []
    for line in block.split('\\\\'):
        m = re.search(r'\$([^$]*)\$\s*&\s*(\d+)\s*&\s*(\d+)\s*&\s*\$([^$]*)\$', line)
        if m:
            mn = m.group(4).strip()
            fr = Fraction(*map(int, mn.split('/'))) if '/' in mn else Fraction(int(mn))
            out.append((m.group(1).strip(), int(m.group(2)), int(m.group(3)), fr))
    return out


def parse_counts(tex):
    i = tex.index('\\label{tab:verification-counts}')
    j = tex.rindex('\\begin{tabular}', 0, i)
    rows = re.findall(r'\((a|b)\)&(\d+)&(\d+)&(\d+)&(\d+)&(\d+)', tex[j:i])
    return {r[0]: tuple(int(x) for x in r[1:]) for r in rows}


# ----------------------------------------------------------------------------------------------------------------------
# polynomials: x = Lp invariants as polynomials in given linear forms
# ----------------------------------------------------------------------------------------------------------------------
def invariants(forms, n):
    """forms: 4 linear forms (dict polys in n vars) standing for p_1..p_4; returns Phi_0..Phi_8 of x = Lp"""
    x = []
    for j in range(3):
        f = {}
        for v in range(4):
            f = add(f, scale(forms[v], LM[j][v]))
        x.append(f)
    A = add(add(mul(x[0], x[0]), mul(x[1], x[1])), mul(x[2], x[2]))
    B = mul(mul(x[0], x[1]), x[2])
    x2 = [mul(t, t) for t in x]
    C = add(add(mul(x2[0], x2[1]), mul(x2[0], x2[2])), mul(x2[1], x2[2]))
    return [const(1, n), A, B, mul(A, A), C, mul(A, B), mul(mul(A, A), A), mul(A, C), mul(B, B)]


def comb_poly(coefs, Phi):
    f = {}
    for c, ph in zip(coefs, Phi):
        if c:
            f = add(f, scale(ph, Fraction(c, 1000)))
    return f


def evalf(f, pt):
    s = Fraction(0)
    for m, c in f.items():
        t = Fraction(c)
        for x, e in zip(pt, m):
            if e:
                t *= x ** e
        s += t
    return s


def homog(f, r, n=4):
    W = {tuple(int(i == j) for j in range(n)): 1 for i in range(n)}
    by = {}
    for m, c in f.items():
        by.setdefault(sum(m), {})[m] = c
    out = {}
    for d, g in by.items():
        if d > r:
            raise ValueError('degree')
        out = add(out, mul(g, pw(W, r - d, n)))
    return out


# ----------------------------------------------------------------------------------------------------------------------
# Bernstein / monomial index sets on the 4-variable simplex
# ----------------------------------------------------------------------------------------------------------------------
IDX = {r: [I for I in itertools.product(range(r, -1, -1), repeat=4) if sum(I) == r] for r in range(0, 16)}
POS = {r: {I: n for n, I in enumerate(IDX[r])} for r in IDX}
SH = {(r, t): [POS[r + 1][tuple(I[s] + (s == t) for s in range(4))] for I in IDX[r]] for r in range(15) for t in range(4)}


def multinom(I):
    out = factorial(sum(I))
    for i in I:
        out //= factorial(i)
    return out


def bern_vec(f, r):
    """Bernstein coefficients (Fractions) of a homogeneous degree-r polynomial in X"""
    v = [Fraction(0)] * len(IDX[r])
    for m, c in f.items():
        v[POS[r][m]] = Fraction(c) / multinom(m)
    return v


def mul_lin(vec, r, lin):
    out = [0] * len(IDX[r + 1])
    for t in range(4):
        c = lin[t]
        if c:
            sh = SH[(r, t)]
            for k, x in enumerate(vec):
                if x:
                    out[sh[k]] += c * x
    return out


def hom_vec(vec, r, R):
    for rr in range(r, R):
        vec = mul_lin(vec, rr, (1, 1, 1, 1))
    return vec


def hom_mat(M, r, R):
    """multiply a bihomogeneous (r,r) coefficient matrix by (sum X)^(R-r) (sum Y)^(R-r)"""
    M = [hom_vec(row, r, R) for row in M]
    for rr in range(r, R):
        out = [[0] * len(M[0]) for _ in IDX[rr + 1]]
        for t in range(4):
            sh = SH[(rr, t)]
            for k, row in enumerate(M):
                o = out[sh[k]]
                out[sh[k]] = [a + b for a, b in zip(o, row)]
        M = out
    return M


# ----------------------------------------------------------------------------------------------------------------------
# the two rows: U-polynomials (variables U1..U4, W) and side polynomials
# ----------------------------------------------------------------------------------------------------------------------
class Row:
    def __init__(self, kind, table):
        self.kind = kind
        self.table = table
        self.k, self.m = (1, Fraction(3)) if kind == 'a' else (5, Fraction(1, 2))
        n = 5
        U = [{tuple(int(i == j) for j in range(n)): 1} for i in range(4)]
        z = {}
        for u in U:
            z = add(z, u)
        LU = []
        for j in range(3):
            f = {}
            for v in range(4):
                f = add(f, scale(U[v], LM[j][v]))
            LU.append(f)
        if kind == 'a':
            N = {}
            for f in LU:
                N = add(N, scale(mul(f, f), -1))
        else:
            Phi = invariants(U, n)
            N = {}
            for c, ph, e in zip(table['H'], Phi, DEG):
                if c:
                    N = add(N, scale(mul(ph, pw(z, 6 - e, n)), Fraction(c, 1000)))
        self.N, self.z = N, z
        self.Apoly = add(N, scale(pw(z, self.k + 1, n), self.m))     # A_pi = N + m z^(k+1) >= 0
        # per-cell Taylor: A z^j for j = 0..3, as coefficients over U-monomials (with 4^|alpha|)
        self.Rc = max(6, self.k + 4)
        self.tay = {}
        f = self.Apoly
        for j in range(4):
            for mo, c in f.items():
                self.tay[mo[:4]] = (j, Fraction(c) * 4 ** sum(mo[:4]))
            f = mul(f, z)
        self.tay_den = 1
        for _, c in self.tay.values():
            self.tay_den = lcm(self.tay_den, c.denominator)
        # side polynomials in p (4 variables)
        pvars = [{tuple(int(i == j) for j in range(4)): 1} for i in range(4)]
        Phi = invariants(pvars, 4)
        self.side = {'one': const(1, 4), 'A': Phi[1], 'H': comb_poly(table['H'], Phi), 'F': comb_poly(table['F'], Phi),
                     'G': comb_poly(table['G'], Phi)}
        self.side['A2'] = mul(Phi[1], Phi[1])
        if kind == 'a':   # K = 24(A(p)+A(q)-H(p)F(q)-F(p)H(q)-A(p)A(q)(A(p)+A(q))/1000)
            self.Kterms = [(24, 'A', 'one'), (24, 'one', 'A'), (-24, 'H', 'F'), (-24, 'F', 'H'),
                           (Fraction(-24, 1000), 'A2', 'A'), (Fraction(-24, 1000), 'A', 'A2')]
        else:             # K = -24(H(p)G(q)+G(p)H(q))
            self.Kterms = [(-24, 'H', 'G'), (-24, 'G', 'H')]
        self.side_den = {}
        for name, f in self.side.items():
            d = 1
            for c in f.values():
                d = lcm(d, Fraction(c).denominator)
            self.side_den[name] = d

    # direct evaluation of R and of the summands at rational points ------------------------------------------------
    def side_val(self, name, p):
        return evalf(self.side[name], p)

    def K_val(self, p, q):
        return sum(Fraction(c) * self.side_val(f, p) * self.side_val(g, q) for c, f, g in self.Kterms)

    def summand(self, p, q, pi):
        U = [4 * p[v] * q[pi[v]] for v in range(4)]
        z = sum(U)
        if z == 0:
            return Fraction(0)
        return evalf(self.N, U + [Fraction(1)]) / z ** self.k

    def R_val(self, p, q):
        return self.K_val(p, q) + sum(self.summand(p, q, pi) for pi in PERMS)


# ----------------------------------------------------------------------------------------------------------------------
# the global Taylor polynomial in Bernstein form on S x S
# ----------------------------------------------------------------------------------------------------------------------
def taylor_upoly(row, d):
    """Psi(U, W) = (N + m z^{k+1}) * sum_{i<=d} binom(-k,i) (z - W)^i W^(d-i) - m z W^(k+d)"""
    n = 5
    W = {(0, 0, 0, 0, 1): 1}
    zW = add(row.z, scale(W, -1))
    t = {}
    for i in range(d + 1):
        t = add(t, scale(mul(pw(zW, i, n), pw(W, d - i, n)), comb(row.k + i - 1, i) * (-1) ** i))
    return add(mul(row.Apoly, t), scale(mul(row.z, pw(W, row.k + d, n)), -row.m))


def r_symmetric(row):
    """R(p,q) = R(q,p): N and z are symmetric polynomials in U1..U4 (then s_pi(q,p) = s_{pi^-1}(p,q)) and K is a
    symmetric combination of side polynomials"""
    nsym = all(row.N.get(tuple(mo[pi[v]] for v in range(4)) + (mo[4],), 0) == c for mo, c in row.N.items() for pi in PERMS)
    kd = {}
    for c, f, g in row.Kterms:
        kd[(f, g)] = kd.get((f, g), 0) + Fraction(c)
    ksym = all(kd.get((g, f), 0) == c for (f, g), c in kd.items())
    return nsym and ksym


def stab(a):
    out = 1
    for c in set(a):
        out *= factorial(a.count(c))
    return out


def global_T(row, d):
    """integer Bernstein matrix (and its positive denominator) of K + sum_pi Psi(U^pi, W) on S x S"""
    psi = taylor_upoly(row, d)
    R = max(6, row.k + 1 + d)
    forms = [{tuple(int(i == j) for j in range(4)): S_VERTS[i][v] for i in range(4) if S_VERTS[i][v]} for v in range(4)]
    groups = {}
    for mono, c in psi.items():
        al = mono[:4]
        lam = tuple(sorted(al, reverse=True))
        groups.setdefault(lam, {})
        groups[lam][al] = groups[lam].get(al, 0) + c
    symmetric = True
    terms = []
    for lam, g in groups.items():
        vals = set(g.values())
        if len(vals) != 1 or len(g) != len(set(itertools.permutations(lam))):
            symmetric = False
            continue
        c = vals.pop()
        if c == 0:
            continue
        mlam = {}
        for a in set(itertools.permutations(lam)):
            tt = const(1, 4)
            for v in range(4):
                if a[v]:
                    tt = mul(tt, pw(forms[v], a[v], 4))
            mlam = add(mlam, tt)
        vec = bern_vec(homog(mlam, R), R)
        terms.append((Fraction(c) * 4 ** sum(lam) * stab(list(lam)), vec, vec))
    side_vec = {name: bern_vec(homog(compose_side(row.side[name], forms), R), R) for name in row.side}
    for c, f, g in row.Kterms:
        terms.append((Fraction(c), side_vec[f], side_vec[g]))
    n = len(IDX[R])
    M = [[Fraction(0)] * n for _ in range(n)]
    for c, u, v in terms:
        for i, ui in enumerate(u):
            if ui:
                cu = c * ui
                Mi = M[i]
                for j, vj in enumerate(v):
                    if vj:
                        Mi[j] += cu * vj
    den = 1
    for r_ in M:
        for x in r_:
            den = lcm(den, x.denominator)
    return [[int(x * den) for x in r_] for r_ in M], den, R, symmetric


def compose_side(f, forms):
    out = {}
    for m, c in f.items():
        t = const(c, 4)
        for v, e in enumerate(m):
            if e:
                t = mul(t, pw(forms[v], e, 4))
        out = add(out, t)
    return out


def bern_eval(M, R, X, Y):
    bx = [multinom(I) * prod_pow(X, I) for I in IDX[R]]
    by = [multinom(J) * prod_pow(Y, J) for J in IDX[R]]
    return sum(bx[i] * sum(M[i][j] * by[j] for j in range(len(by))) for i in range(len(bx)))


def prod_pow(X, I):
    t = Fraction(1)
    for x, e in zip(X, I):
        if e:
            t *= x ** e
    return t


def taylor_direct(row, d, p, q):
    tot = row.K_val(p, q)
    for pi in PERMS:
        U = [4 * p[v] * q[pi[v]] for v in range(4)]
        z = sum(U)
        A = evalf(row.Apoly, U + [Fraction(1)])
        t = sum(comb(row.k + i - 1, i) * (-1) ** i * (z - 1) ** i for i in range(d + 1))
        tot += A * t - row.m * z
    return tot


# ----------------------------------------------------------------------------------------------------------------------
# exact de Casteljau midpoint split of a Bernstein matrix (rows = X index)
# ----------------------------------------------------------------------------------------------------------------------
_LINES = {}


def _lines(r, i, j):
    key = (r, i, j)
    if key not in _LINES:
        out = []
        others = [t for t in range(4) if t not in (i, j)]
        for n in range(r + 1):
            for a in range(r - n + 1):
                b = r - n - a
                idxs = []
                for t in range(n + 1):
                    I = [0] * 4
                    I[i], I[j], I[others[0]], I[others[1]] = n - t, t, a, b
                    idxs.append(POS[r][tuple(I)])
                out.append((n, idxs))
        _LINES[key] = out
    return _LINES[key]


def split_rows(M, r, i, j):
    """children (vertex j -> midpoint, vertex i -> midpoint), each = exact Bernstein matrix times 2^r"""
    A = [None] * len(M)
    B = [None] * len(M)
    for n, idxs in _lines(r, i, j):
        cur = [M[x] for x in idxs]
        A[idxs[0]] = [x << r for x in cur[0]]
        B[idxs[n]] = [x << r for x in cur[n]]
        for mm in range(1, n + 1):
            cur = [[x + y for x, y in zip(cur[t], cur[t + 1])] for t in range(len(cur) - 1)]
            sh = r - mm
            A[idxs[mm]] = [x << sh for x in cur[0]]
            B[idxs[n - mm]] = [x << sh for x in cur[-1]]
    return A, B


def transpose(M):
    return [list(c) for c in zip(*M)]


def mat_nonneg(M):
    return all(min(r_) >= 0 for r_ in M)


# ----------------------------------------------------------------------------------------------------------------------
# the per-cell bound (computed from the cell's vertices)
# ----------------------------------------------------------------------------------------------------------------------
def side_data(verts, maxdeg):
    D = 1
    for v in verts:
        for x in v:
            D = lcm(D, x.denominator)
    ab = [[int(x * D) for x in v] for v in verts]
    lin = [[ab[i][v] for i in range(4)] for v in range(4)]
    P = {(0, 0, 0, 0): [1]}
    for deg in range(1, maxdeg + 1):
        for al in IDX[deg]:
            v = next(t for t in range(4) if al[t] > 0)
            prev = list(al)
            prev[v] -= 1
            P[al] = mul_lin(P[tuple(prev)], deg - 1, lin[v])
    return D, P


def side_vec(row, name, D, P, Rc):
    """(integer vector, scale) with vector = scale * D^Rc * f(p(X)) (sum X)^(Rc - deg)"""
    f = row.side[name]
    L = row.side_den[name]
    out = [0] * len(IDX[Rc])
    for al, c in f.items():
        dd = sum(al)
        v = hom_vec([x * int(Fraction(c) * L) * D ** (Rc - dd) for x in P[al]], dd, Rc)
        out = [a + b for a, b in zip(out, v)]
    return out, L


def dyadic_down(x, bits=GBITS):
    """largest multiple of 2^-bits that is <= x"""
    return Fraction((x.numerator << bits) // x.denominator, 1 << bits)


def dyadic_centre(lo, hi):
    mid = (lo + hi) / 2
    e = 0
    while mid * (1 << e) < (1 << 16):
        e += 1
    return Fraction(int(mid * (1 << e)), 1 << e)


def taylor_gamma(k, c):
    """t(z) = sum_{i<=3} binom(-k,i) c^(-k-i) (z-c)^i = sum_j gamma_j z^j"""
    g = [Fraction(0)] * 4
    for i in range(4):
        bi = comb(k + i - 1, i) * (-1) ** i / c ** (k + i)
        for j in range(i + 1):
            g[j] += bi * comb(i, j) * (-c) ** (i - j)
    return g


def jensen_vertex(p, q, pi):
    """row a summand -|LU|^2 / sum U at a vertex pair (0 when z = 0)"""
    U = [4 * p[v] * q[pi[v]] for v in range(4)]
    z = sum(U)
    if z == 0:
        return Fraction(0)
    s = 0
    for j in range(3):
        t = sum(LM[j][v] * U[v] for v in range(4))
        s += t * t
    return -s / z


def cell_matrix(row, a, b):
    """integer matrix whose entries are a positive multiple of the monomial coefficients of the per-cell lower bound"""
    k, m, Rc = row.k, row.m, row.Rc
    maxdeg = max(6, k + 4)
    Da, Pa = side_data(a, maxdeg)
    Db, Pb = side_data(b, maxdeg)
    DD = Da * Db
    # K part: sum c (Va (x) Vb) / (La Lb), all at scale (Da Db)^Rc
    vecs_a = {n: side_vec(row, n, Da, Pa, Rc) for n in row.side}
    vecs_b = {n: side_vec(row, n, Db, Pb, Rc) for n in row.side}
    scalars = []
    for c, f, g in row.Kterms:
        scalars.append(Fraction(c) / (vecs_a[f][1] * vecs_b[g][1]))
    # per pi
    V = [[Fraction(0)] * 4 for _ in range(4)]
    weights = {}  # alpha -> list of (pi, weight)
    for pi in PERMS:
        zv = [[4 * sum(a[i][v] * b[j][pi[v]] for v in range(4)) for j in range(4)] for i in range(4)]
        zlo = min(min(r_) for r_ in zv)
        zhi = max(max(r_) for r_ in zv)
        if zlo > 0 and zhi <= RHO[row.kind] * zlo:
            c = dyadic_centre(zlo, zhi)
            g = [dyadic_down(x) for x in taylor_gamma(k, c)]
            for al, (j, co) in row.tay.items():
                weights.setdefault(al, []).append((pi, g[j] * co))
            for i in range(4):
                for j in range(4):
                    V[i][j] -= m * zv[i][j]
        elif row.kind == 'a':
            for i in range(4):
                for j in range(4):
                    V[i][j] += dyadic_down(jensen_vertex(a[i], b[j], pi))
        else:
            for i in range(4):
                for j in range(4):
                    V[i][j] -= m * zv[i][j]
    # common integer scale
    lam = 1
    for s_ in scalars:
        lam = lcm(lam, s_.denominator)
    taylor_scale = (1 << GBITS) * row.tay_den
    lam = lcm(lam, taylor_scale)
    for i in range(4):
        for j in range(4):
            lam = lcm(lam, (V[i][j] * DD ** Rc).denominator)
    n = len(IDX[Rc])
    T = [[0] * n for _ in range(n)]
    for (c, f, g), s_ in zip(row.Kterms, scalars):
        w = int(s_ * lam)
        va, vb = vecs_a[f][0], vecs_b[g][0]
        for i, x in enumerate(va):
            if x:
                wx = w * x
                Ti = T[i]
                T[i] = [t + wx * y for t, y in zip(Ti, vb)]
    # Taylor blocks by degree
    mult = lam // taylor_scale
    for dd in range(k + 1, k + 5):
        nd = len(IDX[dd])
        blk = None
        for al in IDX[dd]:
            if al not in weights:
                continue
            Rv = [0] * nd
            for pi, w in weights[al]:
                be = tuple(al[pi.index(t)] for t in range(4))   # q-exponent: q_{pi(v)}^{al_v}
                wi = int(w * taylor_scale)
                Rv = [x + wi * y for x, y in zip(Rv, Pb[be])]
            if blk is None:
                blk = [[0] * nd for _ in range(nd)]
            for i, x in enumerate(Pa[al]):
                if x:
                    bi = blk[i]
                    blk[i] = [t + x * y for t, y in zip(bi, Rv)]
        if blk is None:
            continue
        fac = mult * DD ** (Rc - dd)
        blk = hom_mat(blk, dd, Rc)
        for i in range(n):
            T[i] = [t + fac * y for t, y in zip(T[i], blk[i])]
    # bilinear part
    E = [hom_vec([int(t == i) for t in range(4)], 1, Rc) for i in range(4)]
    for i in range(4):
        for j in range(4):
            w = int(V[i][j] * DD ** Rc * lam)
            if w:
                for r_, x in enumerate(E[i]):
                    if x:
                        T[r_] = [t + w * x * y for t, y in zip(T[r_], E[j])]
    return T


def cell_bound_direct(row, a, b, X, Y):
    """the same lower bound evaluated directly at barycentric (X, Y) — for the exact consistency check"""
    p = [sum(X[i] * a[i][v] for i in range(4)) for v in range(4)]
    q = [sum(Y[j] * b[j][v] for j in range(4)) for v in range(4)]
    tot = row.K_val(p, q)
    for pi in PERMS:
        zv = [[4 * sum(a[i][v] * b[j][pi[v]] for v in range(4)) for j in range(4)] for i in range(4)]
        zlo = min(min(r_) for r_ in zv)
        zhi = max(max(r_) for r_ in zv)
        U = [4 * p[v] * q[pi[v]] for v in range(4)]
        z = sum(U)
        if zlo > 0 and zhi <= RHO[row.kind] * zlo:
            g = [dyadic_down(x) for x in taylor_gamma(row.k, dyadic_centre(zlo, zhi))]
            A = evalf(row.Apoly, U + [Fraction(1)])
            tot += A * sum(g[j] * z ** j for j in range(4)) - row.m * z
        elif row.kind == 'a':
            tot += sum(X[i] * Y[j] * dyadic_down(jensen_vertex(a[i], b[j], pi)) for i in range(4) for j in range(4))
        else:
            tot -= row.m * z
    return tot


def mono_eval(T, Rc, X, Y):
    bx = [prod_pow(X, I) for I in IDX[Rc]]
    by = [prod_pow(Y, J) for J in IDX[Rc]]
    return sum(bx[i] * sum(T[i][j] * by[j] for j in range(len(by))) for i in range(len(bx)))


# ----------------------------------------------------------------------------------------------------------------------
# subdivision
# ----------------------------------------------------------------------------------------------------------------------
def split_choice(a, b):
    best = None
    for side, c in ((0, a), (1, b)):
        for i in range(4):
            for j in range(i + 1, 4):
                w = sum((c[i][v] - c[j][v]) ** 2 for v in range(4))
                if c[i] == UNIF or c[j] == UNIF:
                    w *= 16
                key = (w, -side, -i, -j)
                if best is None or key > best[0]:
                    best = (key, side, i, j)
    return best[1:]


def children(a, b, T, R):
    side, i, j = split_choice(a, b)
    c = a if side == 0 else b
    mid = [(c[i][v] + c[j][v]) / 2 for v in range(4)]
    c1 = [list(r_) for r_ in c]
    c1[j] = mid
    c2 = [list(r_) for r_ in c]
    c2[i] = mid
    if side == 0:
        A, B = split_rows(T, R, i, j)
        return [(c1, b, A), (c2, b, B)]
    A, B = split_rows(transpose(T), R, i, j)
    return [(a, c1, transpose(A)), (a, c2, transpose(B))]


def run_subtree(row, R, cell, depth0, depth_cap=DEPTH_CAP, budget=None):
    """DFS from one cell; returns counters and the list of unresolved cells (empty when certified)"""
    stats = {'cells': 0, 'glob': 0, 'cell': 0, 'maxdepth': depth0, 'cap': 0, 'seconds': 0.0}
    t0 = time.time()
    stack = [(cell[0], cell[1], cell[2], depth0)]
    open_cells = []
    while stack:
        a, b, T, dep = stack.pop()
        stats['cells'] += 1
        stats['maxdepth'] = max(stats['maxdepth'], dep)
        if mat_nonneg(T):
            stats['glob'] += 1
            continue
        if UNIF not in a and UNIF not in b:
            if mat_nonneg(cell_matrix(row, a, b)):
                stats['cell'] += 1
                continue
        if dep >= depth_cap or (budget is not None and time.time() - t0 > budget):
            stats['cap'] += 1
            open_cells.append((a, b, dep))
            continue
        for ch in reversed(children(a, b, T, R)):
            stack.append((ch[0], ch[1], ch[2], dep + 1))
    stats['seconds'] = round(time.time() - t0, 1)
    return stats, open_cells


_W = {}


def _worker_init(kind, table, d):
    row = Row(kind, table)
    M, den, R, _ = global_T(row, d)
    _W['row'], _W['R'] = row, R


def _worker(job):
    a, b, T, dep, cap, budget = job
    return run_subtree(_W['row'], _W['R'], (a, b, T), dep, cap, budget)


def corner_cell(M, R, vtx, steps, sides):
    """the cell C_p x C_q where C = (1 - 2^-steps) S_vtx + 2^-steps S on the listed sides (0 = p, 1 = q) and C = S on
    the others, with its Bernstein matrix (each step replaces every other vertex by its midpoint with S_vtx)"""
    cells = [[list(r_) for r_ in S_VERTS], [list(r_) for r_ in S_VERTS]]
    T = M
    for side in sides:
        c = cells[side]
        TT = T if side == 0 else transpose(T)
        for _ in range(steps):
            for i in range(4):
                if i != vtx:
                    _, TT = split_rows(TT, R, i, vtx)     # the child keeping vertex vtx
                    c[i] = [(c[i][v] + c[vtx][v]) / 2 for v in range(4)]
        T = TT if side == 0 else transpose(TT)
    return cells[0], cells[1], T


REGIONS = {
    'u': (3, (0,)),        # C x S with C at the uniform point u = S_3; S x C follows by R(p,q) = R(q,p)
    'S2': (2, (0, 1)),     # C x C at S_2 = (1/3,1/3,1/3,0), near the smallest values of R_b off the singular set
}


def certify_row(row, d=5, split_depth=6, jobs=1, depth_cap=DEPTH_CAP, budget=None, log=None, region=None):
    """certify R >= 0 on S x S (region None) or on a corner region (name, steps). Returns (certified?, stats, ...)"""
    M, den, R, symmetric = global_T(row, d)
    # exact consistency of the Bernstein construction with the direct formula at three rational points
    pts = [([Fraction(1, 2), Fraction(1, 4), Fraction(1, 8), Fraction(1, 8)], [Fraction(1, 3), Fraction(1, 3), Fraction(1, 6), Fraction(1, 6)]),
           ([Fraction(1, 5), Fraction(2, 5), Fraction(1, 5), Fraction(1, 5)], [Fraction(3, 4), Fraction(1, 8), Fraction(0), Fraction(1, 8)]),
           ([Fraction(0), Fraction(0), Fraction(1, 7), Fraction(6, 7)], [Fraction(1, 9), Fraction(2, 9), Fraction(3, 9), Fraction(3, 9)])]
    consistent = True
    for X, Y in pts:
        p = [sum(X[i] * S_VERTS[i][v] for i in range(4)) for v in range(4)]
        q = [sum(Y[i] * S_VERTS[i][v] for i in range(4)) for v in range(4)]
        consistent = consistent and bern_eval(M, R, X, Y) == den * taylor_direct(row, d, p, q)
    # breadth-first to split_depth, then independent subtrees
    if region is None:
        level = [([list(r_) for r_ in S_VERTS], [list(r_) for r_ in S_VERTS], M)]
    else:
        vtx, sides = REGIONS[region[0]]
        level = [corner_cell(M, R, vtx, region[1], sides)]
    top = {'cells': 0, 'glob': 0, 'cell': 0}
    jobs_list = []
    for dep in range(split_depth + 1):
        nxt = []
        for a, b, T in level:
            top['cells'] += 1
            if mat_nonneg(T):
                top['glob'] += 1
                continue
            if UNIF not in a and UNIF not in b and mat_nonneg(cell_matrix(row, a, b)):
                top['cell'] += 1
                continue
            if dep == split_depth:
                jobs_list.append((a, b, T, dep, depth_cap, budget))
            else:
                nxt.extend(children(a, b, T, R))
        level = nxt
    # consistency of the per-cell bound on the first subtree root (exact evaluation at a rational point)
    if jobs_list:
        a, b = jobs_list[0][0], jobs_list[0][1]
        if UNIF not in a and UNIF not in b:
            X = [Fraction(1, 2), Fraction(1, 6), Fraction(1, 5), Fraction(2, 15)]
            Y = [Fraction(1, 7), Fraction(2, 7), Fraction(3, 7), Fraction(1, 7)]
            Tm = cell_matrix(row, a, b)
            ratio = mono_eval(Tm, row.Rc, X, Y) / cell_bound_direct(row, a, b, X, Y)
            consistent = consistent and ratio > 0 and mono_eval(Tm, row.Rc, Y, X) / cell_bound_direct(row, a, b, Y, X) == ratio
    stats = {'cells': top['cells'], 'glob': top['glob'], 'cell': top['cell'], 'maxdepth': split_depth, 'cap': 0,
             'subtrees': len(jobs_list), 'cpu_seconds': 0.0}
    open_all = []
    t0 = time.time()
    if jobs > 1 and len(jobs_list) > 1:
        from concurrent.futures import ProcessPoolExecutor
        with ProcessPoolExecutor(jobs, initializer=_worker_init, initargs=(row.kind, row.table, d)) as ex:
            for st, op in ex.map(_worker, jobs_list):
                _merge(stats, st, op, open_all, log)
    else:
        for job in jobs_list:
            st, op = run_subtree(row, R, (job[0], job[1], job[2]), job[3], job[4], job[5])
            _merge(stats, st, op, open_all, log)
    stats['wall_seconds'] = round(time.time() - t0, 1)
    return not open_all, stats, symmetric, consistent, open_all


def _merge(stats, st, op, open_all, log):
    for key in ('cells', 'glob', 'cell', 'cap'):
        stats[key] += st[key]
    stats['maxdepth'] = max(stats['maxdepth'], st['maxdepth'])
    stats['cpu_seconds'] = round(stats['cpu_seconds'] + st['seconds'], 1)
    open_all.extend(op)
    if log:
        print('subtree', st, 'open', len(op), file=log, flush=True)


def region_text(region):
    name, k = region
    if name == 'u':
        return 'C x S and S x C with C = u + (S - u)/%d (the neighbourhood of the singular set p = u or q = u)' % 2 ** k
    return 'C x C with C = S2 + (S - S2)/%d (around (S2, S2), where R_b is smallest away from the singular set by float sampling)' % 2 ** k


def simplex_volume_fraction(a):
    """volume of conv(a) relative to S (determinant of barycentric coordinates in S)"""
    from _common import det
    Sinv = None
    rows = [[x for x in v] for v in a]
    # barycentric coordinates of a_i w.r.t. S: solve sum_k X_k S_k = a_i
    Smat = [[S_VERTS[k][v] for k in range(4)] for v in range(4)]
    from _common import inverse
    Sinv = inverse(Smat)
    bary = [[sum(Sinv[k][v] * rows[i][v] for v in range(4)) for k in range(4)] for i in range(4)]
    return abs(det(bary))


# ----------------------------------------------------------------------------------------------------------------------
def scalar_checks(table, checks, printed):
    Xf = [{tuple(int(i == j) for j in range(4)): S_VERTS[i][v] for i in range(4) if S_VERTS[i][v]} for v in range(4)]
    Phi = invariants(Xf, 4)
    results = {}

    def form(coefs, r, shift=0):
        f = {}
        Wx = {tuple(int(i == j) for j in range(4)): 1 for i in range(4)}
        for c, ph, e in zip(coefs, Phi, DEG):
            if c:
                f = add(f, mul(scale(ph, Fraction(c, 1000)), pw(Wx, r - e, 4)))
        if shift:
            f = add(f, scale(pw({tuple(int(i == j) for j in range(4)): 1 for i in range(4)}, r, 4), shift))
        coeffs = [Fraction(f.get(I, 0)) for I in IDX[r]]
        return min(coeffs), len(coeffs)
    H, F, G = table['H'], table['F'], table['G']
    results['H+1/2'] = form(H, 6, Fraction(1, 2))
    results['F'] = form(F, 5)
    results['G'] = form(G, 14)
    results['(3-E)H'] = form([(3 - e) * c for c, e in zip(H, DEG)], 6)
    names = {'H+1/2': 'H+1/2', 'F': 'F', 'G': 'G', '(3-\\mathcal E)H': '(3-E)H'}
    for pname, deg, cnt, mn in printed:
        key = names.get(pname)
        if key is None:
            continue
        got_min, got_cnt = results[key]
        check(checks, 'scalar form %s: degree %d, %d coefficients, minimum %s (printed %d, %s)' % (key, deg, got_cnt, got_min, cnt, mn),
              got_cnt == cnt and got_min == mn)
        check(checks, 'scalar form %s: all coefficients >= 0 (the inequality on S)' % key, got_min >= 0)
    return results


def decide(src=None, rows=('a',), d=5, jobs=1, split_depth=6, depth_cap=DEPTH_CAP, budget=None, table=None,
           printed_scalar=None, log=None):
    src = src or Sources()
    checks = []
    value = {}
    t0 = time.time()
    src.text(F_EXP)
    cone = src.text(F_CONE)
    cert = src.text(F_CERT)
    fin = src.text(F_FIN)
    table = table or parse_poly_table(cone)
    check(checks, 'coefficient table eq:polynomial-table parsed (H, F, G; 9 columns each)',
          all(len(table[n]) == 9 for n in 'HFG'), str(table))
    # printed values at special points
    pvars = [{tuple(int(i == j) for j in range(4)): 1} for i in range(4)]
    Hp = comb_poly(table['H'], invariants(pvars, 4))
    e1 = [Fraction(1), Fraction(0), Fraction(0), Fraction(0)]
    half = [Fraction(1, 2), Fraction(1, 2), Fraction(0), Fraction(0)]
    check(checks, 'H(e_i) = 13/100, H(u) = 0, H(1/2,1/2,0,0) = -3/25 (03-cone.tex:76-81)',
          all(evalf(Hp, [e1[(v - s) % 4] for v in range(4)]) == Fraction(13, 100) for s in range(4)) and evalf(Hp, UNIF) == 0
          and evalf(Hp, half) == Fraction(-3, 25), '%s, %s, %s' % (evalf(Hp, e1), evalf(Hp, UNIF), evalf(Hp, half)))
    # S4 acts on x = Lp by signed permutations with sign product +1
    ok = True
    for pi in PERMS:
        Mx = [[Fraction(sum(LM[r_][v] * LM[c][pi[v]] for v in range(4)), 4) for c in range(3)] for r_ in range(3)]
        nz = [[x for x in r_ if x] for r_ in Mx]
        ok = ok and all(len(r_) == 1 and abs(r_[0]) == 1 for r_ in nz) and nz[0][0] * nz[1][0] * nz[2][0] == 1
    check(checks, 'all 24 coordinate permutations act on x = Lp as signed permutations with sign product +1', ok)
    printed = printed_scalar or parse_scalar_table(cert)
    check(checks, 'Table tab:scalar-coefficients parsed (4 rows)', len(printed) == 4, str(printed))
    value['scalar'] = {k_: (str(v[0]), v[1]) for k_, v in scalar_checks(table, checks, printed).items()}
    value['authors_counts'] = parse_counts(fin)
    for spec in rows:
        kind, region = (spec, None) if isinstance(spec, str) else spec
        row = Row(kind, table)
        # exact values of R at the 16 vertex pairs of S x S
        vals = [row.R_val(S_VERTS[i], S_VERTS[j]) for i in range(4) for j in range(4)]
        check(checks, 'row %s: R >= 0 at the 16 vertex pairs of S x S (exact)' % kind, min(vals) >= 0,
              'min %s' % min(vals))
        key = 'row_%s' % kind + ('' if region is None else '_%s%d' % region)
        value[key + '_R_at_vertex_pairs'] = {'%d%d' % (i, j): str(vals[4 * i + j]) for i in range(4) for j in range(4)}
        if min(vals) < 0:
            continue
        tr = time.time()
        if region is not None and region[0] == 'u':
            check(checks, 'row %s: R(p,q) = R(q,p) (N symmetric in U, K symmetric) — so (S x C) covers (C x S) too' % kind, r_symmetric(row))
        okc, stats, symmetric, consistent, open_cells = certify_row(row, d, split_depth, jobs, depth_cap, budget, log, region)
        check(checks, 'row %s: the global Taylor array is a sum over S4-symmetric U-monomials (grouping valid)' % kind, symmetric)
        check(checks, 'row %s: Bernstein array = direct formula at 3 rational points; per-cell matrix = direct bound (exact)' % kind, consistent)
        vol = sum((simplex_volume_fraction(a) * simplex_volume_fraction(b) for a, b, _ in open_cells), Fraction(0))
        where = 'all of S x S' if region is None else region_text(region)
        check(checks, 'row %s: every cell of the subdivision accepted (R >= 0 on %s)' % (kind, where), okc,
              '%s; undecided volume fraction %s' % (stats, vol))
        value[key] = dict(stats, undecided_volume=str(vol), undecided_cells=len(open_cells),
                          seconds=round(time.time() - tr, 1), region=where)
    verdict = 'CERTIFIED' if all(c['pass'] for c in checks) else (
        'REFUTED' if any(not c['pass'] and ('vertex pairs' in c['check'] or 'all coefficients >= 0' in c['check']) for c in checks) else 'REFUSED')
    value['seconds'] = round(time.time() - t0, 1)
    parts = []
    for spec in rows:
        kind, region = (spec, None) if isinstance(spec, str) else spec
        parts.append('(%s) on %s' % (kind, 'all of S x S' if region is None else region_text(region)))
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: the single-posterior certificate' + (' and the product inequalit%s %s'
                       % ('ies' if len(parts) > 1 else 'y', '; '.join(parts)) if parts else '')
            + ' — not the probabilistic reduction'}


def forge():
    out = []
    src = Sources()
    cone = src.text(F_CONE)
    table = parse_poly_table(cone)
    # 1. the printed scalar minimum of G moved from 87/1000 to 88/1000
    pr = parse_scalar_table(src.text(F_CERT))
    pr = [(n, d_, c, (Fraction(88, 1000) if n == 'G' else m_)) for n, d_, c, m_ in pr]
    r = decide(rows=(), printed_scalar=pr)
    out.append(('printed minimum of G changed to 88/1000', r['verdict']))
    # 2. the cubic saving D0 claimed 100 times larger (1/10 instead of 1/1000): R < 0 at (S0, S0)
    row = Row('a', table)
    row.Kterms = [(c * 100 if f in ('A2',) or g in ('A2',) else c, f, g) for c, f, g in row.Kterms]
    v = row.R_val(S_VERTS[0], S_VERTS[0])
    out.append(('D0 with 1/10 in place of 1/1000: R(S0,S0) = %s' % v, 'CERTIFIED' if v >= 0 else 'REFUTED'))
    # 3. H's B-coefficient 1000 -> 1300 in the table: the scalar form (3-E)H acquires a negative coefficient
    t2 = {k_: list(v_) for k_, v_ in table.items()}
    t2['H'][2] = 1300
    r = decide(rows=(), table=t2)
    out.append(('H with B-coefficient 1300 in place of 1000', r['verdict']))
    return out


DEFAULT_ROWS = ('a', ('b', ('u', 3)), ('b', ('S2', 3)))

if __name__ == '__main__':
    import json
    t = time.time()
    res = decide(rows=DEFAULT_ROWS, jobs=int(os.environ.get('JOBS', '1')), log=sys.stderr)
    print(json.dumps(res, indent=1, default=str))
    print('runtime %.1f s' % (time.time() - t))
    print(forge())
