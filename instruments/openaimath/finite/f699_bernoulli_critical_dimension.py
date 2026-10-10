"""F-699 — "The critical dimension for one-phase Bernoulli minimizers" (openai/math family 367).

THE CLAIM (build/paper.tex, Theorem thm:main, lines 73-79): every nonzero one-homogeneous global minimizer of the
one-phase Bernoulli energy in R^d, 1 <= d <= 6, is flat; there is a nonflat one-homogeneous global minimizer in R^7;
so d_* = 7.

THE FINITE OBJECT (build/sections/certificate.tex, Proposition cert:universal, lines 33-71, constants line 11-15):
rational, orthogonally equivariant tensor polynomials f, U_jk, K_lijk, M_l, P_l in (A, p, g, delta) over R^5, given
by Table I (build/appendices/tables.tex, lines 58-295; 231 rows over Q = 250000), with
    a = 29/50, eps_* = 438907/12000000, delta_* = 6984137359/31250000000,
such that (cert:interior) I >= eps_*(z^2 + |l|^2) whenever chi = 1 - |p|^2 - g^2 >= 0, and (cert:boundary)
S >= delta_* at every boundary configuration (g = 0, |p| = 1, Ap = lambda p, lambda < 0). The proof
(build/sections/certificate-proof.tex) writes E = Gamma + sum_i d_i y_i^2 - I with Gamma a sum of nonnegative
"Gram" forms from Table II (tables.tex lines 297-919; 21 blocks, 557 rows), expands E over scalar tensor graphs
("keys"), bounds each key by a rational L_t, and prints the result: the ten entries of
2 10^5 Q^2 D_0 with their key counts (1714 keys; lines 507-521), the dominating matrix Dbar (529-537), the weight
nu and the four slacks (541-546); for the boundary, E_b = Lambda + 1/4 - S expanded in symmetric monomials with
exactly eleven nonzero coefficients (644-654), their absolute sum 1656725282 and delta_* (663-670).

WHAT IS DECIDED HERE, AND HOW (exact rational arithmetic, standard library, written for this audit from the LaTeX):
  A. The tables are parsed from tables.tex; the printed row counts, the structural claims of Table I (every free slot
     once, no X/l/w/z factors, every P row has a positive g power, U and K rows have an even number of p endpoints:
     the parity claims of the proposition) and of Table II (19 interior blocks / 529 rows of degree one in (w,z,l,X),
     two boundary blocks of 14 rows) are checked.
  B. The four projection operators (anti r=2, sym r=2, sym r=3, hook r=3; certificate-proof.tex lines 112-139) are
     built as exact integer matrices on (R^5)^{(x)r} and shown to be symmetric with Pi^2 = c Pi, c = 2, 10, 42, 48;
     hence c times an orthogonal projection, hence positive semidefinite (Lemma cert:positive-projections, decided).
  C. A tensor-graph algebra written here from the paper's DEFINITIONS (the D_l of (cert:D) by the product rule;
     contraction with tr A = 0, tr A^2 = |A|^2 = 1, tr delta = 5 and trace-free X; keys = isomorphism classes of the
     labelled graphs) expands I (cert:interior), Gamma (cert:gram-block) and E, and recomputes every printed interior
     number: the 1714 keys and their split over the ten (i,j) types, each 2 10^5 Q^2 (D_0)_ij from the stated L_t and
     the stated root rounding, the entrywise comparison D_0 <= Dbar, and the four slacks d_i - (Dbar nu)_i / nu_i.
     The expansion is ALSO checked against a second, independent evaluation of I and Gamma written straight from the
     formulas (explicit 5x5 matrices and 5x5x5 tensors, D_l by dual numbers in the direction (cert:D), the Gram blocks
     by explicit tensors and explicit projections) at random points of the constraint variety, modulo the prime
     2^61-1. This is the "correspondence between formulas and code" the release's own README says its checks do not
     certify; a mod-p agreement at random points is strong evidence of the identity, not a proof of it.
  D. The boundary: f, U, K, M, P evaluated as exact polynomials in x1..x4 at A = diag(x1..x4, lambda),
     lambda = -(x1+..+x4), p = e5, g = 0 (P vanishes there); S computed by summing (cert:boundary) over all indices
     (and compared with the paper's component formula (cert:boundary-components)); Lambda from the two rank -1
     blocks; E_b homogenized by R^floor((5-j)/2) and collected over symmetric monomials; the eleven printed
     coefficients, their absolute sum and delta_* = 1/4 - sum recomputed exactly.
  E. The printed constants and the U = A sanity example (interior 5z^2 + |X|^2 + (2a-2)|q|^2, boundary
     2 lambda - tr A^3) are recomputed by the same algebra.

WHAT IS NOT DECIDED (theory, read but not checked here):
  - Lemma cert:tensor-bounds (the eigenvalue bounds theta = 4/5, 9/20, 5/7, the mixed g/p bound) and Lemma
    cert:graph-bound (that every scalar graph obeys |M(t)| <= L_t y_i y_j). The decider applies the stated L_t rules
    exactly; that they are valid bounds is the paper's analysis.
  - The reduction of the boundary inequality to the diagonal frame (orthogonal equivariance) and the step from the
    eleven coefficients to S >= delta_* (|m_beta| <= 1 on R = 1, Lambda >= 0) are short arguments, re-read, not
    machine-checked beyond the arithmetic.
  - Everything outside Proposition cert:universal: the reductions to a spherical domain (reductions.tex), the
    geometric identities and stability inequality (geometry.tex, flux.tex), the cutoff arguments (cutoffs.tex), the
    regularity consequences (consequences.tex). The certificate is one finite input to the flatness half (d <= 6).
  - The dimension-7 half is NOT the paper's construction: it is cited, De Silva-Jerison 2009, Theorem 1.1
    (history.tex lines 35-37, reductions.tex lines 224-227, consequences.tex lines 22-23). Nothing here touches it.
"""
import itertools
import os
import random
import re
import sys
import time
from fractions import Fraction
from math import isqrt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

BASE = 'preprints/The-critical-dimension-for-one-phase-Bernoulli-minimizers-September-24-2026/build/'
MAIN = BASE + 'paper.tex'
CERT = BASE + 'sections/certificate.tex'
PROOF = BASE + 'sections/certificate-proof.tex'
TABLES = BASE + 'appendices/tables.tex'
HISTORY = BASE + 'sections/history.tex'
CONSEQ = BASE + 'sections/consequences.tex'

# endpoint labels: free slots are 0..r-1; p, l, the first and the second copy of X
P_, L_, X1, X2 = -1, -2, -3, -4
LABEL = {'5': P_, '6': L_, '7': X1, '8': X2}
RANK = {'f': 0, 'U': 2, 'K': 4, 'M': 1, 'P': 1}
THETA = Fraction(4, 5)


# ---------------------------------------------------------------------------------------------------------------
# parsing
# ---------------------------------------------------------------------------------------------------------------

def parse_tables(tex):
    i1 = tex.index('\\subsection{Table I:')
    i2 = tex.index('\\subsection{Table II:')
    i3 = tex.index('\\subsection{Reproduction')
    t1 = []
    for line in tex[i1:i2].split('\n'):
        m = re.match(r'^([fUKMP]) (\d+) (-?\d+)\s*$', line)
        if m:
            t1.append((m.group(1), m.group(2), int(m.group(3))))
    blocks = []
    for line in tex[i2:i3].split('\n'):
        line = line.strip()
        m = re.match(r'^@ (-?\d+) (\w+) (\w)$', line)
        if m:
            blocks.append({'rank': int(m.group(1)), 'kind': m.group(2), 'mode': m.group(3), 'rows': []})
            continue
        m = re.match(r'^(\d+)((?: -?\d+)+)$', line)
        if m:
            blocks[-1]['rows'].append((m.group(1), [int(x) for x in m.group(2).split()]))
    return t1, blocks


def parse_printed(cert, proof):
    """the numbers the paper prints about the certificate, read from the LaTeX"""
    out = {}
    m = re.search(r'a=\\frac\{(\d+)\}\{(\d+)\},\\qquad Q=(\d+),\\qquad\s*\\epsilon_\* =\\frac\{(\d+)\}\{(\d+)\},\\qquad\s*'
                  r'\\delta_\* =\\frac\{(\d+)\}\{(\d+)\}', cert)
    out['a'] = Fraction(int(m.group(1)), int(m.group(2)))
    out['Q'] = int(m.group(3))
    out['eps'] = Fraction(int(m.group(4)), int(m.group(5)))
    out['delta'] = Fraction(int(m.group(6)), int(m.group(7)))
    m = re.search(r'd=\\left\(\\frac2\{25\},\\frac2\{25\},\\frac14,1\\right\)', proof)
    out['d'] = [Fraction(2, 25), Fraction(2, 25), Fraction(1, 4), Fraction(1)] if m else None
    i = proof.index('\\label{cert:exact-interior-sums}')
    j = proof.index('\\end{array}', i)
    sums = {}
    for a, b, n, s in re.findall(r'\((\d),(\d)\)&(\d+)&(\d+)', proof[i:j]):
        sums[(int(a), int(b))] = (int(n), int(s))
    out['sums'] = sums
    m = re.search(r'there are \$(\d+)\$ nonzero keys', proof)
    out['nkeys'] = int(m.group(1))
    i = proof.index('\\label{cert:upper-matrix}')
    j = proof.index('\\end{pmatrix}', i)
    rows = re.findall(r'(\d+)&(\d+)&(\d+)&(\d+)', proof[i:j])
    out['Dbar'] = [[Fraction(int(x), 10 ** 5) for x in r] for r in rows]
    m = re.search(r'\\nu=\((\d+),(\d+),(\d+),(\d+)\)\^T', proof)
    out['nu'] = [int(x) for x in m.groups()]
    i = proof.index('\\label{cert:slacks}')
    j = proof.index('\\end{equation}', i)
    out['slacks'] = [Fraction(int(n), int(d)) for n, d in re.findall(r'\\frac\{(\d+)\}\{(\d+)\}', proof[i:j])]
    i = proof.index('\\label{cert:eleven-coefficients}')
    j = proof.index('\\end{array}', i)
    eleven = {}
    for b, v in re.findall(r'\((\d,\d,\d,\d)\)&(-?\d+)', proof[i:j]):
        eleven[tuple(int(x) for x in b.split(','))] = int(v)
    out['eleven'] = eleven
    m = re.search(r'Q\^2\\sum_\\beta\|e\^\{\(b\)\}_\\beta\|=(\d+)', proof)
    out['abs_sum'] = int(m.group(1))
    m = re.search(r'\\frac14-\\frac\{(\d+)\}\{(\d+)\}\s*=\\frac\{(\d+)\}\{(\d+)\}=\\delta_\*', proof)
    out['delta_line'] = (int(m.group(1)), int(m.group(2)), Fraction(int(m.group(3)), int(m.group(4))))
    return out


# ---------------------------------------------------------------------------------------------------------------
# the tensor-graph algebra.  A key is (r, g, w, z, traces, edges): rank, powers of g, w, z, the sorted multiset of
# trace factors tr A^k (k >= 3; k = 0, 1, 2 are reduced to 5, 0, 1), and the sorted multiset of edges (u, v, k)
# meaning (A^k)_{uv}, u <= v, with endpoints free slots 0..r-1 or the labels P_, L_ (each occurrence a separate
# copy of p or l), X1, X2 (each of the two cubic vertices takes exactly three incidences).  The edge multiset with
# these labels is a complete invariant of the labelled graph up to exchanging the two copies of X, so the key takes
# the larger of the two orderings.
# ---------------------------------------------------------------------------------------------------------------

def canon(r, g, w, z, traces, edges):
    es = sorted((min(u, v), max(u, v), k) for u, v, k in edges)
    if any(u == X2 or v == X2 for u, v, _ in es):
        sw = {X1: X2, X2: X1}
        alt = sorted((min(sw.get(u, u), sw.get(v, v)), max(sw.get(u, u), sw.get(v, v)), k) for u, v, k in es)
        es = max(es, alt)
    return (r, g, w, z, tuple(sorted(traces)), tuple(es))


def decode(word, r):
    """Table I / II word -> key (or None if the word is zero), with the validity checks of the decoding"""
    assert len(word) % 3 == 0, word
    tr = [word[i:i + 3] for i in range(0, len(word), 3)]
    h, b, j = int(tr[0][0]), int(tr[0][1]), int(tr[0][2])
    assert j in (0, 1, 2), word
    edges = []
    for t in tr[1:]:
        ends = []
        for ch in t[:2]:
            d = int(ch)
            if d < r:
                ends.append(d)
            else:
                assert ch in LABEL, (word, ch)
                ends.append(LABEL[ch])
        edges.append((ends[0], ends[1], int(t[2])))
    inc = {}
    for u, v, _ in edges:
        inc[u] = inc.get(u, 0) + 1
        inc[v] = inc.get(v, 0) + 1
    assert all(inc.get(s, 0) == 1 for s in range(r)), word
    assert inc.get(X1, 0) in (0, 3) and inc.get(X2, 0) in (0, 3) and (inc.get(X2, 0) == 0 or inc.get(X1, 0) == 3), word
    if any(u == v and u in (X1, X2) and k == 0 for u, v, k in edges):
        return None
    return canon(r, h, int(j == 1), int(j == 2), [3] * b, edges)


def nX(key):
    labs = {e for u, v, _ in key[5] for e in (u, v)}
    return (X1 in labs) + (X2 in labs)


def product(k1, k2):
    r1, g1, w1, z1, t1, e1 = k1
    r2, g2, w2, z2, t2, e2 = k2
    n1, n2 = nX(k1), nX(k2)
    assert n1 + n2 <= 2
    xmap = {X1: [X1, X2][n1], X2: X2} if n2 else {}

    def m(x):
        if x >= 0:
            return x + r1
        return xmap.get(x, x)
    return canon(r1 + r2, g1 + g2, w1 + w2, z1 + z2, t1 + t2, list(e1) + [(m(u), m(v), k) for u, v, k in e2])


_ccache = {}


def contract(key, pairs):
    """contract free-slot pairs; returns (factor, key) or None if the graph is zero"""
    ck = (key, pairs)
    if ck in _ccache:
        return _ccache[ck]
    r, g, w, z, tr, es = key
    edges = [list(e) for e in es]
    traces = list(tr)
    factor = 1
    res = None
    for a, b in pairs:
        ia = next(i for i, e in enumerate(edges) if e[0] == a or e[1] == a)
        ib = next(i for i, e in enumerate(edges) if e[0] == b or e[1] == b)
        if ia == ib:
            k = edges.pop(ia)[2]
            if k == 0:
                factor *= 5
            elif k == 1:
                break
            elif k == 2:
                pass
            else:
                traces.append(k)
        else:
            ea, eb = edges[ia], edges[ib]
            oa = ea[1] if ea[0] == a else ea[0]
            ob = eb[1] if eb[0] == b else eb[0]
            k = ea[2] + eb[2]
            if oa == ob and oa in (X1, X2) and k == 0:
                break
            for i in sorted((ia, ib), reverse=True):
                edges.pop(i)
            edges.append([oa, ob, k])
    else:
        rest = sorted({x for e in edges for x in e[:2] if x >= 0})
        assert len(rest) == r - 2 * len(pairs)
        ren = {s: i for i, s in enumerate(rest)}
        res = (factor, canon(len(rest), g, w, z, traces, [(ren.get(u, u) if u >= 0 else u, ren.get(v, v) if v >= 0 else v, k)
                                                           for u, v, k in edges]))
    _ccache[ck] = res
    return res


def permute(key, perm):
    r, g, w, z, tr, es = key
    return canon(r, g, w, z, tr, [(perm[u] if u >= 0 else u, perm[v] if v >= 0 else v, k) for u, v, k in es])


def derivative(key):
    """D_l of a Table I graph by the product rule of (cert:D); the derivative index l is the new last free slot"""
    r, g, w, z, tr, es = key
    assert w == 0 and z == 0 and nX(key) == 0 and all(u != L_ and v != L_ for u, v, _ in es)
    n = r
    X = X1
    out = []
    es = list(es)
    for idx, (u, v, k) in enumerate(es):
        rest = es[:idx] + es[idx + 1:]
        # D_l (A^k)_{uv} = sum_h (A^h X_l A^{k-1-h})_{uv} - k q_l (A^k)_{uv}; the q terms are collected below
        for h in range(k):
            out.append((1, canon(r + 1, g, w, z, tr, rest + [(u, X, h), (X, v, k - 1 - h), (X, n, 0)])))
        # D_l p_i = w A_{li} - g z delta_{li}, once for each p endpoint (twice on a p-p edge)
        for end in (0, 1):
            if (u, v)[end] == P_:
                other = (u, v)[1 - end]
                out.append((1, canon(r + 1, g, w + 1, z, tr, rest + [(other, n, k + 1)])))
                out.append((-1, canon(r + 1, g + 1, w, z + 1, tr, rest + [(other, n, k)])))
    for idx, k in enumerate(tr):
        rest = list(tr[:idx]) + list(tr[idx + 1:])
        # D_l tr A^k = k tr(A^{k-1} X_l) - k q_l tr A^k   (k >= 3 here, so the self-edge has power >= 2)
        out.append((k, canon(r + 1, g, w, z, rest, es + [(X, X, k - 1), (X, n, 0)])))
    N = sum(k for _, _, k in es) + sum(tr)
    if N:
        out.append((-N, canon(r + 1, g, w, z, tr, es + [(X, X, 1), (X, n, 0)])))
    if g:
        # D_l g^h = h g^{h-1} z p_l
        out.append((g, canon(r + 1, g - 1, w, z + 1, tr, es + [(P_, n, 0)])))
    return out


# polynomials over keys: dict key -> Fraction

def padd(acc, poly, c=1):
    for k, v in poly.items():
        x = acc.get(k, 0) + c * v
        if x:
            acc[k] = x
        else:
            acc.pop(k, None)
    return acc


def pprod(p1, p2):
    out = {}
    for k1, c1 in p1.items():
        for k2, c2 in p2.items():
            k = product(k1, k2)
            x = out.get(k, 0) + c1 * c2
            if x:
                out[k] = x
            else:
                out.pop(k, None)
    return out


def pcontract(poly, pairs):
    out = {}
    for k, c in poly.items():
        res = contract(k, tuple(pairs))
        if res:
            f, kk = res
            x = out.get(kk, 0) + c * f
            if x:
                out[kk] = x
            else:
                out.pop(kk, None)
    return out


def pperm(poly, perm):
    out = {}
    for k, c in poly.items():
        kk = permute(k, perm)
        out[kk] = out.get(kk, 0) + c
    return {k: c for k, c in out.items() if c}


def pderiv(poly):
    out = {}
    for k, c in poly.items():
        for f, kk in derivative(k):
            x = out.get(kk, 0) + c * f
            if x:
                out[kk] = x
            else:
                out.pop(kk, None)
    return out


def inner(p1, p2, r):
    return pcontract(pprod(p1, p2), [(i, r + i) for i in range(r)])


def mono(key):
    return {key: 1}


ONE = (0, 0, 0, 0, (), ())
W1 = (0, 0, 1, 0, (), ())
Z1 = (0, 0, 0, 1, (), ())
G2 = (0, 2, 0, 0, (), ())
A2 = canon(2, 0, 0, 0, (), [(0, 1, 1)])
DEL2 = canon(2, 0, 0, 0, (), [(0, 1, 0)])
XT = canon(3, 0, 0, 0, (), [(X1, 0, 0), (X1, 1, 0), (X1, 2, 0)])
LV = canon(1, 0, 0, 0, (), [(L_, 0, 0)])
QV = canon(1, 0, 0, 0, (), [(X1, X1, 1), (X1, 0, 0)])
LL = canon(0, 0, 0, 0, (), [(L_, L_, 0)])
PP = canon(0, 0, 0, 0, (), [(P_, P_, 0)])
XX = canon(0, 0, 0, 0, (), [(X1, X2, 0)] * 3)
QQ = canon(0, 0, 0, 0, (), [(X1, X1, 1), (X1, X2, 0), (X2, X2, 1)])
CHI = {ONE: 1, PP: -1, G2: -1}


def Pi_graph(poly, r, kind):
    """the projection operators of certificate-proof.tex lines 112-139 on graph polynomials"""
    if kind == 'none':
        return dict(poly)
    perms = list(itertools.permutations(range(r)))
    if kind == 'anti':
        out = {}
        for p in perms:
            padd(out, pperm(poly, p), sign(p))
        return out
    full = {}
    for p in perms:
        padd(full, pperm(poly, p))
    if kind == 'sym':
        Fp = full
    elif kind == 'hook':
        assert r == 3
        Fp = {}
        padd(Fp, poly, 3)
        padd(Fp, pperm(poly, (1, 0, 2)), 3)
        padd(Fp, full, -1)
    v = pcontract(Fp, [(0, 1)])
    out = {}
    if r == 2 and kind == 'sym':
        padd(out, Fp, 5)
        padd(out, pprod(mono(DEL2), v), -1)
        return out
    assert r == 3
    dv = pprod(mono(DEL2), v)               # delta_{ab} v_c in slots (a, b, c) = (0, 1, 2)
    ij_k = dv
    ik_j = pperm(dv, (0, 2, 1))             # slots a->0, b->2, c->1: delta_{ik} v_j
    jk_i = pperm(dv, (1, 2, 0))             # a->1, b->2, c->0: delta_{jk} v_i
    if kind == 'sym':
        padd(out, Fp, 7)
        padd(out, ij_k, -1)
        padd(out, ik_j, -1)
        padd(out, jk_i, -1)
    else:
        padd(out, Fp, 8)
        padd(out, ij_k, -2)
        padd(out, ik_j, 1)
        padd(out, jk_i, 1)
    return out


def sign(p):
    s, seen = 1, set()
    for i in range(len(p)):
        if i in seen:
            continue
        j, n = i, 0
        while j not in seen:
            seen.add(j)
            j = p[j]
            n += 1
        if n % 2 == 0:
            s = -s
    return s


# ---------------------------------------------------------------------------------------------------------------
# the interior expansion
# ---------------------------------------------------------------------------------------------------------------

def table_polys(t1, Q):
    polys = {F: {} for F in RANK}
    for F, word, c in t1:
        key = decode(word, RANK[F])
        assert key is not None
        padd(polys[F], mono(key), Fraction(c, Q))
    return polys


def interior_I(polys, a):
    """I of (cert:interior) as a graph polynomial, term by term from certificate.tex lines 45-51"""
    f, U, K, M, P = (polys[F] for F in 'fUKMP')
    C = {}
    padd(C, K)
    padd(C, pperm(K, (1, 0, 2, 3)), -1)                     # C_lijk = K_lijk - K_iljk
    G = pprod(mono(DEL2), U)                               # delta_li U_jk, slots (l,i,j,k) = (0,1,2,3)
    padd(G, C)
    I = {}
    # z^2 [5 U_jk A_jk + C_lijk (delta_lj A_ik + delta_lk A_ij) - 4 f]
    T1 = mono(canon(4, 0, 0, 0, (), [(0, 2, 0), (1, 3, 1)]))
    T2 = mono(canon(4, 0, 0, 0, (), [(0, 3, 0), (1, 2, 1)]))
    bracket = {}
    padd(bracket, inner(U, mono(A2), 2), 5)
    padd(bracket, inner(C, T1, 4))
    padd(bracket, inner(C, T2, 4))
    padd(bracket, f, -4)
    padd(I, pprod(mono(product(Z1, Z1)), bracket))
    # [D_l G_lijk + (2a-1) q_l G_lijk] X_ijk
    DG = pcontract(pderiv(G), [(4, 0)])                     # derivative index (slot 4) against l (slot 0)
    qG = pcontract(pprod(mono(QV), G), [(0, 1)])
    t2 = {}
    padd(t2, DG)
    padd(t2, qG, 2 * a - 1)
    padd(I, inner(t2, mono(XT), 3))
    # w [D_l M_l + (2a+1) q_l M_l]
    t3 = pcontract(pderiv(M), [(0, 1)])
    padd(t3, pcontract(pprod(mono(QV), M), [(0, 1)]), 2 * a + 1)
    padd(I, pprod(mono(W1), t3))
    # z [D_l P_l + 2a q_l P_l]
    t4 = pcontract(pderiv(P), [(0, 1)])
    padd(t4, pcontract(pprod(mono(QV), P), [(0, 1)]), 2 * a)
    padd(I, pprod(mono(Z1), t4))
    # f |l|^2 - (D_l f + 2a q_l f) l_l
    padd(I, pprod(f, mono(LL)))
    t5 = pderiv(f)
    padd(t5, pprod(mono(QV), f), 2 * a)
    padd(I, inner(t5, mono(LV), 1), -1)
    return I


def gram_interior(blocks, Q):
    """Gamma of (cert:gram-block): rho sum_c <J_c, Pi J_c>, summed over the interior blocks"""
    Gam = {}
    for blk in blocks:
        r = blk['rank']
        if r < 0:
            continue
        rows = blk['rows']
        keys = [decode(w, r) for w, _ in rows]
        assert all(k is not None for k in keys)
        PiM = [Pi_graph(mono(k), r, blk['kind']) for k in keys]
        acc = {}
        for s in range(len(rows)):
            for t in range(s, len(rows)):
                coef = sum(x * y for x, y in zip(rows[s][1], rows[t][1]))
                if not coef:
                    continue
                if s != t:
                    coef *= 2
                padd(acc, inner(mono(keys[t]), PiM[s], r), Fraction(coef, Q * Q))
        if blk['mode'] == 'B':
            acc = pprod(acc, CHI)
        else:
            assert blk['mode'] == 'I'
        padd(Gam, acc)
    return Gam


def key_types(key):
    """the degree-one types of a scalar key: 1 = w, 2 = z, 3 = l, 4 = X"""
    r, g, w, z, tr, es = key
    nl = sum((u == L_) + (v == L_) for u, v, _ in es)
    ty = [1] * w + [2] * z + [3] * nl + [4] * nX(key)
    return ty


def L2(key):
    """L_t^2 by the four rules of certificate-proof.tex lines 388-401"""
    r, g, w, z, tr, es = key
    out = Fraction(1)
    for k in tr:
        out *= Fraction(9, 20) if k == 3 else THETA ** (k - 2)
    for u, v, k in es:
        if u == v and u in (X1, X2):
            out *= Fraction(5, 7) if k == 1 else THETA ** (k - 1)
        else:
            out *= THETA ** k
    b = sum((u == P_) + (v == P_) for u, v, _ in es)
    h = g
    if h > 0 and b > 0:
        out *= Fraction(h, h + b) ** h * Fraction(b, h + b) ** b
    return out


def root_round(L2t):
    """the least nonnegative integer n with n^2 >= 10^10 L_t^2 (cert:root-rounding), by integer arithmetic"""
    s = L2t * 10 ** 10
    m = -((-s.numerator) // s.denominator)      # ceil(s); n^2 >= s iff n^2 >= ceil(s)
    if m <= 0:
        return 0
    return isqrt(m - 1) + 1


# ---------------------------------------------------------------------------------------------------------------
# B. the projection operators as exact integer matrices on (R^5)^{(x) r}
# ---------------------------------------------------------------------------------------------------------------

def Pi_numeric(F, r, kind, mod=None):
    """the operators of certificate-proof.tex lines 112-139 on an explicit tensor F: dict index tuple -> value"""
    idx = list(itertools.product(range(5), repeat=r))
    perms = list(itertools.permutations(range(r)))

    def permuted(p):
        return {i: F[tuple(i[p[s]] for s in range(r))] for i in idx}
    if kind == 'none':
        return dict(F)
    if kind == 'anti':
        out = {i: 0 for i in idx}
        for p in perms:
            G, s = permuted(p), sign(p)
            for i in idx:
                out[i] += s * G[i]
        return {i: (v % mod if mod else v) for i, v in out.items()}
    full = {i: 0 for i in idx}
    for p in perms:
        G = permuted(p)
        for i in idx:
            full[i] += G[i]
    if kind == 'sym':
        Fp = full
    else:
        sw = permuted((1, 0, 2))
        Fp = {i: 3 * (F[i] + sw[i]) - full[i] for i in idx}
    if r == 2:
        v = sum(Fp[(i, i)] for i in range(5))
        out = {(i, j): 5 * Fp[(i, j)] - (v if i == j else 0) for i, j in idx}
    else:
        v = [sum(Fp[(a, a, k)] for a in range(5)) for k in range(5)]
        if kind == 'sym':
            out = {(i, j, k): 7 * Fp[(i, j, k)] - ((i == j) * v[k] + (i == k) * v[j] + (j == k) * v[i]) for i, j, k in idx}
        else:
            out = {(i, j, k): 8 * Fp[(i, j, k)] - (2 * (i == j) * v[k] - (i == k) * v[j] - (j == k) * v[i]) for i, j, k in idx}
    return {i: (x % mod if mod else x) for i, x in out.items()}


def projection_matrix_checks(checks):
    for r, kind, c in ((2, 'anti', 2), (2, 'sym', 10), (3, 'sym', 42), (3, 'hook', 48)):
        idx = list(itertools.product(range(5), repeat=r))
        cols = []
        for e in idx:
            F = {i: int(i == e) for i in idx}
            PF = Pi_numeric(F, r, kind)
            cols.append([PF[i] for i in idx])
        n = len(idx)
        Mx = [[cols[j][i] for j in range(n)] for i in range(n)]
        symm = all(Mx[i][j] == Mx[j][i] for i in range(n) for j in range(i))
        sq_ok = True
        for i in range(n):
            row = Mx[i]
            for j in range(n):
                if sum(row[k] * Mx[k][j] for k in range(n) if row[k]) != c * Mx[i][j]:
                    sq_ok = False
                    break
            if not sq_ok:
                break
        trace = sum(Mx[i][i] for i in range(n))
        check(checks, 'B. Pi(%s, r=%d) is symmetric with Pi^2 = %d Pi on (R^5)^(x)%d, so PSD' % (kind, r, c, r), symm and sq_ok,
              'image dimension tr(Pi)/c = %s' % Fraction(trace, c))


# ---------------------------------------------------------------------------------------------------------------
# C2. an independent evaluation from the formulas, modulo the prime 2^61 - 1, at a random point of the variety
#     tr A = 0, |A| = 1, X symmetric trace-free.  Explicit matrices and tensors; D_l by dual numbers.
# ---------------------------------------------------------------------------------------------------------------

PR = (1 << 61) - 1


def inv(x):
    return pow(x % PR, PR - 2, PR)


def fr(c):
    c = Fraction(c)
    return c.numerator % PR * inv(c.denominator) % PR


def mat_mul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(5)) % PR for j in range(5)] for i in range(5)]


def mat_vec(A, v):
    return [sum(A[i][k] * v[k] for k in range(5)) % PR for i in range(5)]


def random_point(seed):
    rnd = random.Random(seed)
    while True:
        B = [[0] * 5 for _ in range(5)]
        for i in range(5):
            for j in range(i, 5):
                B[i][j] = B[j][i] = rnd.randrange(PR)
        t = sum(B[i][i] for i in range(5)) * inv(5) % PR
        for i in range(5):
            B[i][i] = (B[i][i] - t) % PR
        s = sum(B[i][j] * B[i][j] for i in range(5) for j in range(5)) % PR
        if pow(s, (PR - 1) // 2, PR) == 1:
            break
    sq = pow(s, (PR + 1) // 4, PR)                           # PR = 3 mod 4
    A = [[B[i][j] * inv(sq) % PR for j in range(5)] for i in range(5)]
    S = {}
    for i in itertools.product(range(5), repeat=3):
        S[i] = rnd.randrange(PR)
    X0 = {i: sum(S[tuple(i[p] for p in perm)] for perm in itertools.permutations(range(3))) * inv(6) % PR for i in S}
    v = [sum(X0[(a, a, k)] for a in range(5)) % PR for k in range(5)]
    X = {(i, j, k): (X0[(i, j, k)] - ((i == j) * v[k] + (i == k) * v[j] + (j == k) * v[i]) * inv(7)) % PR for i, j, k in S}
    pt = {'A': A, 'X': X, 'p': [rnd.randrange(PR) for _ in range(5)], 'l': [rnd.randrange(PR) for _ in range(5)],
          'g': rnd.randrange(PR), 'w': rnd.randrange(PR), 'z': rnd.randrange(PR)}
    pt['q'] = [sum(X[(l, i, j)] * A[i][j] for i in range(5) for j in range(5)) % PR for l in range(5)]
    return pt


def point_on_variety(pt):
    A, X = pt['A'], pt['X']
    return (sum(A[i][i] for i in range(5)) % PR == 0 and sum(A[i][j] ** 2 for i in range(5) for j in range(5)) % PR == 1
            and all(A[i][j] == A[j][i] for i in range(5) for j in range(5))
            and all(sum(X[(a, a, k)] for a in range(5)) % PR == 0 for k in range(5))
            and all(X[(i, j, k)] == X[(j, i, k)] == X[(i, k, j)] for i, j, k in X))


def powers(A, kmax):
    out = [[[int(i == j) for j in range(5)] for i in range(5)]]
    for _ in range(kmax):
        out.append(mat_mul(out[-1], A))
    return out


def eval_graph(key, pt, Ak):
    """the value of a graph at a point: a dict over free-slot index tuples (or a scalar for rank 0). Handles rank r
    with at most one X, and rank 0 with two."""
    r, g, w, z, tr, es = key
    A, X, p, l = pt['A'], pt['X'], pt['p'], pt['l']
    vec = {P_: p, L_: l}
    scal = pow(pt['g'], g, PR) * pow(pt['w'], w, PR) % PR * pow(pt['z'], z, PR) % PR
    for k in tr:
        scal = scal * (sum(Ak[k][i][i] for i in range(5)) % PR) % PR
    slot_vec, slot_mat = [], []
    xlegs = {X1: [], X2: []}
    for eid, (u, v, k) in enumerate(es):
        if u in (P_, L_) and v in (P_, L_):
            scal = scal * (sum(vec[u][i] * mat_vec(Ak[k], vec[v])[i] for i in range(5)) % PR) % PR
        elif u in (P_, L_) or v in (P_, L_):
            lf, o = (u, v) if u in (P_, L_) else (v, u)
            if o >= 0:
                slot_vec.append((o, mat_vec(Ak[k], vec[lf])))
            else:
                xlegs[o].append(('vec', mat_vec(Ak[k], vec[lf])))
        elif u >= 0 and v >= 0:
            slot_mat.append((u, v, Ak[k]))
        elif u == v:
            xlegs[u].append(('self', Ak[k], eid))
            xlegs[u].append(('self', Ak[k], eid))
        elif u in (X1, X2) and v in (X1, X2):
            xlegs[X1].append(('xx', eid, Ak[k]))
            xlegs[X2].append(('xx', eid, None))
        else:
            xv, o = (u, v) if u in (X1, X2) else (v, u)
            xlegs[xv].append(('out', o, Ak[k]))

    def reduce_x(legs):
        """X contracted with its vector and self legs: dict over the remaining legs' indices (leg order kept)"""
        assert len(legs) == 3
        out = {}
        for a in itertools.product(range(5), repeat=3):
            val = X[a]
            keep = []
            done_self = set()
            for pos, lg in enumerate(legs):
                if lg[0] == 'vec':
                    val = val * lg[1][a[pos]] % PR
                elif lg[0] == 'self':
                    if lg[2] in done_self:
                        continue
                    other = next(q for q in range(3) if q != pos and legs[q][0] == 'self' and legs[q][2] == lg[2])
                    val = val * lg[1][a[pos]][a[other]] % PR
                    done_self.add(lg[2])
                else:
                    keep.append(a[pos])
            kk = tuple(keep)
            out[kk] = (out.get(kk, 0) + val) % PR
        return out
    n_x = (len(xlegs[X1]) > 0) + (len(xlegs[X2]) > 0)
    if n_x == 2:
        assert r == 0
        T1, T2 = reduce_x(xlegs[X1]), reduce_x(xlegs[X2])
        l1 = [lg for lg in xlegs[X1] if lg[0] not in ('vec', 'self')]
        l2 = [lg for lg in xlegs[X2] if lg[0] not in ('vec', 'self')]
        assert all(lg[0] == 'xx' for lg in l1 + l2)
        # X1-side legs carry the matrices; align the X2 legs to the same edge order
        order2 = [next(q for q, lg in enumerate(l2) if lg[1] == e[1]) for e in l1]
        if not l1:
            return scal * T1[()] % PR * T2[()] % PR
        m = len(l1)
        tot = 0
        for ia, va in T1.items():
            if not va:
                continue
            for ib, vb in T2.items():
                prod_ = va * vb % PR
                for s in range(m):
                    prod_ = prod_ * l1[s][2][ia[s]][ib[order2[s]]] % PR
                tot += prod_
        return scal * (tot % PR) % PR
    out_legs = []
    TX = None
    if n_x == 1:
        legs = xlegs[X1] or xlegs[X2]
        TX = reduce_x(legs)
        out_legs = [lg for lg in legs if lg[0] not in ('vec', 'self')]
        assert all(lg[0] == 'out' for lg in out_legs)
    res = {}
    for idx in itertools.product(range(5), repeat=r):
        val = scal
        for s, vv in slot_vec:
            val = val * vv[idx[s]] % PR
        for u, v, Mk in slot_mat:
            val = val * Mk[idx[u]][idx[v]] % PR
        if TX is not None:
            if out_legs:
                tot = 0
                for ia, vx in TX.items():
                    t_ = vx
                    for s, lg in enumerate(out_legs):
                        t_ = t_ * lg[2][idx[lg[1]]][ia[s]] % PR
                    tot += t_
                val = val * (tot % PR) % PR
            else:
                val = val * TX[()] % PR
        res[idx] = val
    return res[()] if r == 0 else res


def eval_poly(poly, pt, Ak):
    return sum(fr(c) * eval_graph(k, pt, Ak) for k, c in poly.items()) % PR


def table_I_direct(t1, Q, pt, Ak):
    """f, U, K, M, P and their D_l at the point: the Table I words read as explicit tensors, D_l by dual numbers
    along the direction (cert:D): dA = X_l - q_l A, dp = w A_l - g z e_l, dg = z p_l"""
    A, X, p, q = pt['A'], pt['X'], pt['p'], pt['q']
    g, w, z = pt['g'], pt['w'], pt['z']
    kmax = 12
    dirs = []
    for m in range(5):
        dA = [[(X[(m, i, j)] - q[m] * A[i][j]) % PR for j in range(5)] for i in range(5)]
        dp = [(w * A[m][i] - (g * z if i == m else 0)) % PR for i in range(5)]
        dg = z * p[m] % PR
        dAk = [[[0] * 5 for _ in range(5)]]
        for k in range(1, kmax + 1):
            a1 = mat_mul(dAk[-1], A)
            a2 = mat_mul(Ak[k - 1], dA)
            dAk.append([[(a1[i][j] + a2[i][j]) % PR for j in range(5)] for i in range(5)])
        dirs.append((dA, dp, dg, dAk))
    Akp = [mat_vec(Ak[k], p) for k in range(kmax + 1)]
    pAkp = [sum(p[i] * Akp[k][i] for i in range(5)) % PR for k in range(kmax + 1)]
    tr3 = sum(Ak[3][i][i] for i in range(5)) % PR
    out = {F: {} for F in RANK}
    dout = {F: [dict() for _ in range(5)] for F in RANK}
    for F, word, c in t1:
        key = decode(word, RANK[F])
        r, gh, _, _, trs, es = key
        cc = fr(Fraction(c, Q))
        for idx in itertools.product(range(5), repeat=r):
            # value
            facs = []
            for u, v, k in es:
                if u >= 0 and v >= 0:
                    facs.append(('m', k, idx[u], idx[v]))
                elif u >= 0 or v >= 0:
                    facs.append(('v', k, idx[max(u, v)]))
                else:
                    facs.append(('s', k))
            val = pow(g, gh, PR) * pow(tr3, len(trs), PR) % PR
            for fc in facs:
                if fc[0] == 'm':
                    val = val * Ak[fc[1]][fc[2]][fc[3]] % PR
                elif fc[0] == 'v':
                    val = val * Akp[fc[1]][fc[2]] % PR
                else:
                    val = val * pAkp[fc[1]] % PR
            out[F][idx] = (out[F].get(idx, 0) + cc * val) % PR
            for m in range(5):
                dA, dp, dg, dAk = dirs[m]
                # dual product: value part and epsilon part
                v0 = pow(g, gh, PR) * pow(tr3, len(trs), PR) % PR
                d0 = (gh * pow(g, gh - 1, PR) * dg % PR * pow(tr3, len(trs), PR) if gh else 0)
                if trs:
                    dtr3 = 3 * sum(Ak[2][i][j] * dA[j][i] for i in range(5) for j in range(5)) % PR
                    nt = len(trs)
                    d0 = (d0 + pow(g, gh, PR) * nt * pow(tr3, nt - 1, PR) % PR * dtr3) % PR
                for fc in facs:
                    k = fc[1]
                    if fc[0] == 'm':
                        a, b = Ak[k][fc[2]][fc[3]], dAk[k][fc[2]][fc[3]]
                    elif fc[0] == 'v':
                        i = fc[2]
                        a = Akp[k][i]
                        b = (sum(dAk[k][i][j] * p[j] for j in range(5)) + sum(Ak[k][i][j] * dp[j] for j in range(5))) % PR
                    else:
                        a = pAkp[k]
                        b = (sum(dp[i] * Akp[k][i] for i in range(5)) + sum(p[i] * dAk[k][i][j] * p[j] for i in range(5) for j in range(5))
                             + sum(p[i] * Ak[k][i][j] * dp[j] for i in range(5) for j in range(5))) % PR
                    v0, d0 = v0 * a % PR, (v0 * b + d0 * a) % PR
                dout[F][m][idx] = (dout[F][m].get(idx, 0) + cc * d0) % PR
    return out, dout


def I_direct(t1, Q, a, pt, Ak):
    T, DT = table_I_direct(t1, Q, pt, Ak)
    A, X, q, l = pt['A'], pt['X'], pt['q'], pt['l']
    w, z = pt['w'], pt['z']
    a = fr(a)
    R5 = range(5)
    f = T['f'][()]
    U, K, M, P = T['U'], T['K'], T['M'], T['P']
    C = {(i0, i1, i2, i3): (K[(i0, i1, i2, i3)] - K[(i1, i0, i2, i3)]) % PR for i0, i1, i2, i3 in K}
    G = {(i0, i1, i2, i3): ((U[(i2, i3)] if i0 == i1 else 0) + C[(i0, i1, i2, i3)]) % PR for i0, i1, i2, i3 in K}
    DG = [{(i0, i1, i2, i3): ((DT['U'][m][(i2, i3)] if i0 == i1 else 0) + DT['K'][m][(i0, i1, i2, i3)] - DT['K'][m][(i1, i0, i2, i3)]) % PR
           for i0, i1, i2, i3 in K} for m in R5]
    t1v = (5 * sum(U[(j, k)] * A[j][k] for j in R5 for k in R5)
           + sum(C[(l_, i, j, k)] * ((l_ == j) * A[i][k] + (l_ == k) * A[i][j]) for l_, i, j, k in C) - 4 * f) % PR
    I = z * z % PR * t1v % PR
    I += sum((DG[l_][(l_, i, j, k)] + (2 * a - 1) * q[l_] * G[(l_, i, j, k)]) * X[(i, j, k)] for l_, i, j, k in G)
    I += w * sum(DT['M'][l_][(l_,)] + (2 * a + 1) * q[l_] * M[(l_,)] for l_ in R5)
    I += z * sum(DT['P'][l_][(l_,)] + 2 * a * q[l_] * P[(l_,)] for l_ in R5)
    I += f * sum(x * x for x in l) - sum((DT['f'][l_][()] + 2 * a * q[l_] * f) * l[l_] for l_ in R5)
    return I % PR


def gram_direct(blocks, Q, pt, Ak):
    tot = 0
    for blk in blocks:
        r = blk['rank']
        if r < 0:
            continue
        vals = [eval_graph(decode(wd, r), pt, Ak) for wd, _ in blk['rows']]
        if r == 0:
            vals = [{(): v} for v in vals]
        ncol = len(blk['rows'][0][1])
        rho = 1 if blk['mode'] == 'I' else (1 - sum(x * x for x in pt['p']) - pt['g'] ** 2) % PR
        for c in range(ncol):
            J = {}
            for (wd, cs), T in zip(blk['rows'], vals):
                cc = fr(Fraction(cs[c], Q))
                for i, v in T.items():
                    J[i] = (J.get(i, 0) + cc * v) % PR
            PJ = Pi_numeric(J, r, blk['kind'], PR) if r > 0 else J
            tot += rho * sum(J[i] * PJ[i] for i in J)
    return tot % PR


# ---------------------------------------------------------------------------------------------------------------
# D. the boundary inequality: exact polynomials in x1..x4 at A = diag(x1, .., x4, lambda), lambda = -(x1+..+x4),
#    p = e5 (index 4), g = 0
# ---------------------------------------------------------------------------------------------------------------

from _poly import add as qadd, mul as qmul, scale as qscale, const as qconst, var as qvar, pw as qpw  # noqa: E402

NV = 4


def boundary_tensors(t1, Q):
    xs = [qvar(i, NV) for i in range(NV)]
    lam = qscale(qadd(qadd(xs[0], xs[1]), qadd(xs[2], xs[3])), -1)
    diag = xs + [lam]
    dpow = [[qpw(d, k, NV) for k in range(13)] for d in diag]
    tr3 = {}
    for d in diag:
        tr3 = qadd(tr3, qpw(d, 3, NV))
    T = {F: {} for F in RANK}
    p_vanish = True
    for F, word, c in t1:
        key = decode(word, RANK[F])
        r, gh, _, _, trs, es = key
        if gh:
            continue                     # g = 0 on the boundary
        if F == 'P':
            p_vanish = False
        base = qconst(Fraction(c, Q), NV)
        for _ in trs:
            base = qmul(base, tr3)
        for idx in itertools.product(range(5), repeat=r):
            val = base
            for u, v, k in es:
                if u >= 0 and v >= 0:
                    if idx[u] != idx[v]:
                        val = {}
                        break
                    val = qmul(val, dpow[idx[u]][k])
                elif u >= 0 or v >= 0:
                    if idx[max(u, v)] != 4:
                        val = {}
                        break
                    val = qmul(val, dpow[4][k])
                else:
                    val = qmul(val, dpow[4][k])
            if val:
                T[F][idx] = qadd(T[F].get(idx, {}), val)
    return T, diag, lam, p_vanish


def boundary_S(T, diag, lam):
    """S of (cert:boundary) by summing over every index, and the paper's component formula (cert:boundary-components)"""
    R5 = range(5)
    f = T['f'].get((), {})
    U, K, M = T['U'], T['K'], T['M']

    def Kc(i):
        return K.get(i, {})

    def C(l_, i, j, k):
        return qadd(Kc((l_, i, j, k)), Kc((i, l_, j, k)), -1)
    S0 = {(a, a): qadd(qmul(lam, diag[a]), qmul(diag[a], diag[a]), -1) for a in R5}
    pv = [int(i == 4) for i in R5]

    def S0e(i, j):
        return S0[(i, i)] if i == j else {}

    def V(i, j, k):
        out = {}
        if pv[i]:
            out = qadd(out, S0e(j, k))
        if pv[j]:
            out = qadd(out, S0e(k, i))
        if pv[k]:
            out = qadd(out, S0e(i, j))
        if pv[i] and pv[j] and pv[k]:
            out = qadd(out, qconst(1, NV))
        return out
    S = qscale(qmul(lam, f), -1)
    for j in R5:
        for k in R5:
            m = qadd(S0e(j, k), qconst(pv[j] * pv[k], NV))
            if m and U.get((j, k)):
                S = qadd(S, qmul(U[(j, k)], m))
    for l_ in R5:
        if not pv[l_]:
            continue
        for i, j, k in itertools.product(R5, repeat=3):
            v = V(i, j, k)
            if v:
                c = C(l_, i, j, k)
                if c:
                    S = qadd(S, qmul(c, v))
    S = qadd(S, M.get((4,), {}))
    # the component formula, certificate-proof.tex lines 579-584 (indices 1..5 there are 0..4 here)
    Sc = qadd(qadd(qscale(qmul(lam, f), -1), U.get((4, 4), {})), M.get((4,), {}))
    for al in range(4):
        b = S0[(al, al)]
        Sc = qadd(Sc, qmul(b, qadd(qadd(U.get((al, al), {}), C(4, al, 4, al)), C(4, al, al, 4))))
    return S, Sc


def boundary_Lambda(blocks, Q):
    Lam = {}
    for blk in blocks:
        if blk['rank'] != -1:
            continue
        ncol = len(blk['rows'][0][1])
        part = {}
        for c in range(ncol):
            J = {}
            for word, cs in blk['rows']:
                beta = tuple(int(ch) for ch in word)
                assert len(beta) == 4
                if cs[c]:
                    J = qadd(J, {beta: Fraction(cs[c], Q)})
            part = qadd(part, qmul(J, J))
        if blk['mode'] == 'H':
            part = qmul(part, {tuple(int(i == j) for j in range(NV)): 1 for i in range(NV)})
        else:
            assert blk['mode'] == 'I'
        av = {}
        for perm in itertools.permutations(range(NV)):
            for e, c in part.items():
                ee = tuple(e[perm[i]] for i in range(NV))
                av = qadd(av, {ee: Fraction(c, 24)})
        Lam = qadd(Lam, av)
    return Lam


def homogenize_collect(E):
    """x^alpha (degree j <= 5) -> x^alpha R^floor((5-j)/2), R = sum x_i^2 + (sum x_i)^2; then the coefficient of
    m_beta = Av(x^beta) is the sum over the orbit of beta (certificate-proof.tex lines 615-634)"""
    xs = [qvar(i, NV) for i in range(NV)]
    s1 = {}
    for x in xs:
        s1 = qadd(s1, x)
    R = qadd(qmul(s1, s1), {tuple(2 * int(i == j) for j in range(NV)): 1 for i in range(NV)})
    Rp = [qpw(R, k, NV) for k in range(3)]
    H = {}
    for e, c in E.items():
        j = sum(e)
        assert j <= 5
        H = qadd(H, qmul({e: c}, Rp[(5 - j) // 2]))
    coll = {}
    for e, c in H.items():
        b = tuple(sorted(e))
        coll[b] = coll.get(b, 0) + c
    symmetric = all(H.get(tuple(e[perm[i]] for i in range(NV)), 0) == c for e, c in H.items()
                    for perm in itertools.permutations(range(NV)))
    return {b: c for b, c in coll.items() if c}, symmetric


# ---------------------------------------------------------------------------------------------------------------
# the decision
# ---------------------------------------------------------------------------------------------------------------

def table_I_structure(t1):
    """the structural claims of certificate-proof.tex lines 55-62"""
    bad = []
    for F, word, c in t1:
        try:
            key = decode(word, RANK[F])
        except AssertionError:
            bad.append((F, word, 'decoding'))
            continue
        if key is None:
            bad.append((F, word, 'zero word'))
            continue
        r, g, w, z, tr, es = key
        if w or z or nX(key) or any(L_ in (u, v) for u, v, _ in es):
            bad.append((F, word, 'X/l/w/z factor'))
        if F == 'P' and g == 0:
            bad.append((F, word, 'P row with g power 0'))
        nb = sum((u == P_) + (v == P_) for u, v, _ in es)
        if F in 'UK' and nb % 2:
            bad.append((F, word, 'odd number of p endpoints'))
    return bad


def decide(src=None, t1_edit=None, t2_edit=None, printed_edit=None, modp_seeds=(1, 2), projections=True):
    src = src or Sources()
    checks = []
    t0 = time.time()
    main_tex = src.text(MAIN)
    cert_tex = src.text(CERT)
    proof_tex = src.text(PROOF)
    tables_tex = src.text(TABLES)
    conseq_tex = src.text(CONSEQ)
    hist_tex = src.text(HISTORY)
    flat = ' '.join(main_tex.split())
    check(checks, 'the theorem as stated (paper.tex Theorem thm:main)',
          'Every nonzero one-homogeneous global minimizer of \\eqref{eq:energy} in \\(\\R^d\\), \\(1\\leq d\\leq6\\), is flat.' in flat
          and 'There is a nonflat one-homogeneous global minimizer in \\(\\R^7\\).' in flat, 'paper.tex lines 73-79')
    check(checks, 'the dimension-7 half is cited, not constructed: De Silva-Jerison 2009, Theorem 1.1',
          'nonflat global minimizer in $\\R^7$ of\nDe Silva and Jerison \\cite[Theorem~1.1]{DeSilvaJerison2009}' in conseq_tex
          and 'De Silva and Jerison constructed a nonflat homogeneous\nglobal minimizer in dimension seven' in hist_tex,
          'consequences.tex lines 22-23; history.tex lines 35-37')
    pr = parse_printed(cert_tex, proof_tex)
    if printed_edit:
        printed_edit(pr)
    Q, a = pr['Q'], pr['a']
    check(checks, 'the printed constants (cert:constants): a = 29/50, Q = 250000, eps_* = 438907/12000000, '
          'delta_* = 6984137359/31250000000', (a, Q, pr['eps'], pr['delta']) == (Fraction(29, 50), 250000, Fraction(438907, 12000000),
                                                                          Fraction(6984137359, 31250000000)))
    t1, blocks = parse_tables(tables_tex)
    if t1_edit:
        t1 = t1_edit(t1)
    if t2_edit:
        blocks = t2_edit(blocks)

    # A. tables
    counts = [sum(1 for r in t1 if r[0] == F) for F in 'fUKMP']
    check(checks, 'A. Table I: 231 rows, (f, U, K, M, P) = (34, 57, 34, 74, 32)', len(t1) == 231 and counts == [34, 57, 34, 74, 32],
          '%d rows, %s' % (len(t1), counts))
    bad = table_I_structure(t1)
    check(checks, 'A. Table I: every free slot once, no X/l/w/z, every P row has g power > 0, U and K rows have an even '
          'number of p endpoints (the parity claims)', not bad, str(bad[:5]))
    interior = [b for b in blocks if b['rank'] >= 0]
    bnd = [b for b in blocks if b['rank'] < 0]
    check(checks, 'A. Table II: 21 blocks; 19 interior with 529 rows; 2 boundary blocks of 14 rows and 5 columns; 557 rows',
          len(blocks) == 21 and len(interior) == 19 and sum(len(b['rows']) for b in interior) == 529
          and [len(b['rows']) for b in bnd] == [14, 14] and all(len(r[1]) == 5 for b in bnd for r in b['rows'])
          and sum(len(b['rows']) for b in blocks) == 557,
          '%d blocks, %d interior rows' % (len(blocks), sum(len(b['rows']) for b in interior)))
    deg_ok = all(len(key_types(decode(wd, b['rank']))) == 1 for b in interior for wd, _ in b['rows'])
    cols_ok = all(len(set(len(r[1]) for r in b['rows'])) == 1 for b in blocks)
    check(checks, 'A. every interior Table II row has degree one in (w, z, l, X); each block has one column count', deg_ok and cols_ok)

    # B. projections
    if projections:
        projection_matrix_checks(checks)
    ext = {j: Fraction((5 - 2 * j) ** 2, 5 * j * (5 - j)) for j in range(1, 5)}
    check(checks, 'B. the arithmetic of Lemma cert:tensor-bounds: |5-2j|^2/(5j(5-j)) is 9/20 (j = 1, 4) and 1/30 (j = 2, 3); '
          '1/3 + (10/21) theta = 5/7; alpha^2 <= 4(1 - alpha^2) gives theta = 4/5',
          ext == {1: Fraction(9, 20), 2: Fraction(1, 30), 3: Fraction(1, 30), 4: Fraction(9, 20)}
          and Fraction(1, 3) + Fraction(10, 21) * THETA == Fraction(5, 7) and THETA == Fraction(4, 5))

    # C. interior
    polys = table_polys(t1, Q)
    I = interior_I(polys, a)
    ua = interior_I({'f': {}, 'U': mono(A2), 'K': {}, 'M': {}, 'P': {}}, a)
    want = {product(Z1, Z1): 5, XX: 1, QQ: 2 * a - 2}
    check(checks, 'C. the single row U = A contributes 5z^2 + |X|^2 + (2a-2)|q|^2 to I (certificate-proof.tex line 296)', ua == want,
          str(len(ua)) + ' keys')
    Gam = gram_interior(blocks, Q)
    E = {}
    padd(E, Gam)
    for c, k in zip(pr['d'], [product(W1, W1), product(Z1, Z1), LL, XX]):
        padd(E, {k: c})
    padd(E, I, -1)
    Q2 = Q * Q
    deg2 = all(len(key_types(k)) == 2 for k in E)
    integral = all((e * Q2).denominator == 1 for e in E.values())
    check(checks, 'C. every key of E has degree two in (w, z, l, X) and every Q^2 e_t is an integer (Lemma cert:closure; line 473)',
          deg2 and integral)
    S2 = {}
    cnt = {}
    rounding_ok = True
    for k, e in E.items():
        i, j = sorted(key_types(k))
        L2t = L2(k)
        n = root_round(L2t)
        rounding_ok &= n * n >= 10 ** 10 * L2t and (n == 0 or (n - 1) ** 2 < 10 ** 10 * L2t)
        S2[(i, j)] = S2.get((i, j), 0) + abs(e * Q2) * n * (2 if i == j else 1)
        cnt[(i, j)] = cnt.get((i, j), 0) + 1
    check(checks, 'C. the root rounding: n_t is the least integer with n_t^2 >= 10^10 L_t^2, for every key', rounding_ok)
    check(checks, 'C. the number of nonzero keys of E is the printed %d' % pr['nkeys'], len(E) == pr['nkeys'], str(len(E)))
    for ij in sorted(pr['sums']):
        n_p, s_p = pr['sums'][ij]
        check(checks, 'C. entry %s: %d keys and 2 10^5 Q^2 (D_0)_ij = %d as printed (cert:exact-interior-sums)' % (ij, n_p, s_p),
              cnt.get(ij) == n_p and S2.get(ij) == s_p, 'recomputed %s keys, %s' % (cnt.get(ij), S2.get(ij)))
    Dbar = pr['Dbar']
    margins = {}
    for (i, j), s in S2.items():
        margins[(i, j)] = Dbar[i - 1][j - 1] * 2 * 10 ** 5 * Q2 - s
    check(checks, 'C. D_0 <= Dbar entrywise (cert:upper-matrix), from the recomputed sums',
          len(margins) == 10 and all(m >= 0 for m in margins.values()) and all(Dbar[i][j] == Dbar[j][i] for i in range(4) for j in range(4)),
          'least margin %s at %s' % (min(margins.values()), min(margins, key=margins.get)))
    nu = pr['nu']
    d = pr['d']
    slacks = [d[i] - sum(Dbar[i][j] * nu[j] for j in range(4)) / nu[i] for i in range(4)]
    for i in range(4):
        check(checks, 'C. slack %d: d_%d - (Dbar nu)_%d / nu_%d = %s as printed (cert:slacks)' % (i + 1, i + 1, i + 1, i + 1, pr['slacks'][i]),
              slacks[i] == pr['slacks'][i], str(slacks[i]))
    check(checks, 'C. all four slacks are positive, the z^2 slack is eps_* and the |l|^2 slack is >= eps_*',
          all(s > 0 for s in slacks) and slacks[1] == pr['eps'] and slacks[2] >= pr['eps'], str([str(s) for s in slacks]))
    for seed in modp_seeds:
        pt = random_point(seed)
        Ak = powers(pt['A'], 12)
        ok_pt = point_on_variety(pt)
        Ig, Id = eval_poly(I, pt, Ak), I_direct(t1, Q, a, pt, Ak)
        Gg, Gd = eval_poly(Gam, pt, Ak), gram_direct(blocks, Q, pt, Ak)
        check(checks, 'C. evidence (mod 2^61-1, random point %d on the variety): the graph expansions of I and Gamma equal I and '
              'Gamma evaluated directly from the formulas (explicit tensors, D_l by dual numbers)' % seed,
              ok_pt and Ig == Id and Gg == Gd, 'I %d / %d, Gamma %d / %d' % (Ig, Id, Gg, Gd))

    # D. boundary
    T, diag, lam, p_vanish = boundary_tensors(t1, Q)
    S, Sc = boundary_S(T, diag, lam)
    check(checks, 'D. P = 0 at g = 0 (every P row has a positive g power)', p_vanish)
    Lam = boundary_Lambda(blocks, Q)
    Eb = qadd(qadd(Lam, {(0,) * NV: Fraction(1, 4)}), S, -1)
    check(checks, 'D. S, Lambda and E_b have degree at most five (certificate-proof.tex lines 606-613)',
          max(sum(e) for e in S) <= 5 and max(sum(e) for e in Lam) <= 5 and max(sum(e) for e in Eb) <= 5,
          'deg S %d, deg Lambda %d' % (max(sum(e) for e in S), max(sum(e) for e in Lam)))
    check(checks, 'D. S summed over all indices equals the component formula (cert:boundary-components)', qadd(S, Sc, -1) == {})
    TA = {'f': {}, 'U': {}, 'K': {}, 'M': {}, 'P': {}}
    xs = [qvar(i, NV) for i in range(NV)]
    for i in range(5):
        TA['U'][(i, i)] = diag[i]
    SA, _ = boundary_S(TA, diag, lam)
    R = {}
    tr3 = {}
    for dd in diag:
        R = qadd(R, qmul(dd, dd))
        tr3 = qadd(tr3, qpw(dd, 3, NV))
    check(checks, 'D. the single row U = A gives S = lambda R + lambda - tr A^3 = 2 lambda - tr A^3 on R = 1 (line 298)',
          qadd(SA, qadd(qadd(qmul(lam, R), lam), tr3, -1), -1) == {})
    coll, symmetric = homogenize_collect(Eb)
    check(checks, 'D. the homogenized E_b is symmetric in x1..x4 and has exactly the eleven printed monomial types',
          symmetric and set(coll) == set(pr['eleven']) and len(coll) == 11, '%d nonzero m_beta' % len(coll))
    for b in sorted(pr['eleven']):
        check(checks, 'D. Q^2 e_%s = %d as printed (cert:eleven-coefficients)' % (b, pr['eleven'][b]),
              coll.get(b, 0) * Q2 == pr['eleven'][b], str(coll.get(b, 0) * Q2))
    abs_sum = sum(abs(c) for c in coll.values()) * Q2
    check(checks, 'D. Q^2 sum |e_beta| = %d as printed' % pr['abs_sum'], abs_sum == pr['abs_sum'], str(abs_sum))
    n1, d1, dl = pr['delta_line']
    check(checks, 'D. 1/4 - Q^-2 sum|e_beta| = delta_* (printed line 669-670, Q^2 = %d)' % d1,
          d1 == Q2 and Fraction(1, 4) - abs_sum / Fraction(Q2) == dl == pr['delta'] and dl > 0, str(Fraction(1, 4) - abs_sum / Fraction(Q2)))
    ok = all(c['pass'] for c in checks)
    verdict = 'CERTIFIED' if ok else 'REFUTED'
    return {'verdict': verdict, 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: the exact arithmetic of Proposition cert:universal (the universal algebraic '
                       'certificate behind the flatness half, d <= 6), from Tables I and II: the interior expansion with its 1714 '
                       'keys and ten printed D_0 sums, D_0 <= Dbar and the slacks giving eps_*, and the boundary expansion with '
                       'its eleven coefficients giving delta_*; plus the PSD of the four projection operators. Not the graph '
                       'bounds L_t (Lemmas cert:tensor-bounds, cert:graph-bound), not the geometric reduction, cutoffs or '
                       'regularity theory, and not the dimension-7 example, which is cited (De Silva-Jerison 2009)',
            'value': {'keys': len(E), 'D0_sums': {'%d%d' % k: int(v) for k, v in sorted(S2.items())},
                      'Dbar_margins': {'%d%d' % k: int(v) for k, v in sorted(margins.items())},
                      'slacks': [str(s) for s in slacks],
                      'boundary_Q2_coefficients': {''.join(map(str, b)): int(c * Q2) for b, c in sorted(coll.items())},
                      'delta_star': str(Fraction(1, 4) - abs_sum / Fraction(Q2)),
                      'seconds': round(time.time() - t0, 1)}}


def forge():
    """each must NOT certify"""
    out = []

    def bump_f(t1):
        t1 = list(t1)
        F, w, c = t1[0]
        assert (F, w) == ('f', '000')
        t1[0] = (F, w, c + 1)
        return t1
    r = decide(t1_edit=bump_f, modp_seeds=(), projections=False)
    out.append(('Table I: the constant term of f moved by one unit of 1/Q (172575762 -> 172575763)', r['verdict']))

    def lower_dbar(pr):
        pr['Dbar'][3][3] = Fraction(8036, 10 ** 5)
    r = decide(printed_edit=lower_dbar, modp_seeds=(), projections=False)
    out.append(('Dbar_44 printed one unit lower (8037 -> 8036)', r['verdict']))

    def bump_boundary(blocks):
        blocks = [dict(b, rows=list(b['rows'])) for b in blocks]
        b = blocks[-1]
        assert b['rank'] == -1 and b['mode'] == 'H'
        wd, cs = b['rows'][0]
        b['rows'][0] = (wd, [cs[0] + 1] + cs[1:])
        return blocks
    r = decide(t2_edit=bump_boundary, modp_seeds=(), projections=False)
    out.append(('Table II: one boundary (H block) coefficient moved by one unit (2926888 -> 2926889)', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    print(forge())
