"""F-533 — "Exact Fourier certificates for complex Hadamard matrices of order six" (openai/math family 266).

THE CLAIM (build/paper.tex:11-19, Theorems thm:fourier and thm:main, paper.tex:65-71 and 142-153):
  (1) every complex Hadamard matrix H of order six not equivalent to Tao's cubic matrix T = (omega^t_ij) has
      g_H(pi alpha) = 0 for every coordinate permutation pi, alpha = (1,1,1,-1,-1,-1) (the Matolcsi-Ruzsa-Weiner
      Fourier-vanishing conjecture);
  (2) there are no seven mutually unbiased bases in C^6, hence (Weiner's completion theorem) N(6) <= 5.
  "Both certificates use only integer and rational arithmetic" (paper.tex:17-18). Lean statement:
  lean/ComparatorChallenges/MUBSix.lean, OAI.MUB6.fourier_and_family_bound (statement read; the proof tree was not).

THE FINITE CORE, AND WHAT IS DECIDED HERE — every identity re-derived from the paper's DEFINITIONS, written for this
audit, exact (int / fractions.Fraction; Z[omega] as pairs x + y*omega with omega^2 = -1 - omega):

  A. The single-matrix certificate, Prop. prop:pair-certificate (02-pair-moments.tex:225-236):
     3<|L_H|^2>_H + <|g(alpha) g(q)|^2>_H = 0 for q in {q_cross, q_same}, identically in the injective moments of
     ANY 6x6 Hadamard matrix. Rebuilt from the text alone: injective moments m_H(A) named by a canonical form under
     row/column permutation, negation, transposition and zero-axis deletion (my own canonical form: min over the
     orbit); the contraction recursion U_0 of Lemma lem:contraction; the seven-row table enumerated exactly as
     05-verification.tex:139-175 specifies (k = 7..11, q = 2..min(4, k/2), sorted row/column orders, rows of equal
     order in lex order, one array per canonical class, row 0 contracted); the set-partition expansion of Lemma
     lem:partitions. DECIDED: the certificate expression E_q lies in the Q-row-space of the table (exact echelon
     over Q of the rows that are independent mod 1e9+7, then exact reduction of E_q to 0). The proof is the exact
     identity E_q = sum y_i W_i with true equations W_i (no lemma about P or W_J needed; a nonzero mod-p pivot set
     is only used to choose rows). Printed table numbers 8871 / 909 / 897 recomputed; the exact rank over Q of all
     8871 equations is computed too (= 897).
     Consistency instances (necessary conditions only, not the proof): the identity evaluated directly, exactly in
     Q(zeta12), over all 720 row orders and both orientations, on T, on the Fourier matrix F6, and on a member of
     the affine Fourier family, F6 with phases z, z^4 (z = exp(2 pi i/12)), whose Hadamard property is checked
     exactly. On T and F6 every term vanishes pointwise, so they cannot tell a forged L from the printed one; on the
     family member they can: with c_1 = 3 the left side is 17/864 there (the forge below fails on a real matrix).

  B. The cubic-pair obstruction, Prop. prop:cubic-exclusion (03-complete-family.tex:112-406), its finite parts:
     T and T^{o2} Hadamard; the Lean taoExponent equals t_ij mod 3; Table tab:cubic-counts (both columns, all 11
     rows) by the printed loops AND by the defining formulas (cubic-R) with O built from all 720 permutations;
     |O| = 180; R(b) = lambda_j G(b) checked for EVERY balanced b of order <= 3 (not only representatives, so the
     covariance does not rest on Lemma lem:cubic-symmetry) and R's support has order <= 3; the 11 representatives
     cover every balanced charge of order <= 3; orbit sizes 360,120,20,90 and coefficients 180,360,180,360;
     G = 0 on all of orbits 1,4,5,9 and |G|^2 = 1/4 on all of orbits 6,8; G(3d) = 1 on D and the signed orbit of
     3(e5-e0) is {3d}; the w5+D / w8+D orbit counts; the linear solve S3 = S7 = 1/10, S0 = -4/5, 6 + 30 S0 = -18.

  C. The mixed-moment certificate, Prop. prop:mixed-certificate (04-mixed.tex:277-331, 05-verification.tex:210-401):
     the certificate DATA (six records (lambda, ws, e, a)) is the literal list `data` that the paper says is printed
     in its Appendix A and supplied in verify.py; it is taken out of verification/verify.py by ast.parse +
     ast.literal_eval of the single assignment named `data` — no other node of that file was read, printed or
     executed before this decider ran (rule 1). From the text: Z_lambda from the lower triangles (eq. Z-encoding);
     positive definiteness by exact Schur pivots, last coordinate first as 05-verification.tex:329-342 writes it,
     each pivot > 40000 (98 pivots); Y_lambda from the Young row/column groups (eq. Young-functions, (P_pP_q v)_i =
     v_q(p(i))); Gram entries by Lemma lem:gram (weights 5, or 1 and 4 for two F_1 factors);
     Q = 5 sum 10^(15-e) E(Y^* Z Y) expanded in canonical mixed keys; the reductions of Lemma lem:mixed-reductions
     (zero rule, single-label pair expansion through the pair substitutions, singleton order-two rule) and the
     table of 05-verification.tex:250-307 (triples(11), the shifted-sum equations (mixed-same)/(mixed-different),
     the single-label zero equations). Printed table numbers 46041 / 3429 / 2767 recomputed. DECIDED: with MY
     coordinate priority (constant lowest, then pair moments, then mixed moments, each by total order; pivot at
     the highest), Q reduces exactly to c0 + sum c_K mu_K with c0 + sum|c_K| < 0. Since every retained mu_K is an
     actual moment (|mu_K| <= 1) and Q >= 0, this is the contradiction the proposition needs.
     NOT REPRODUCED (not a failed check): the paper's printed c0 = -613302797399911/6480 and
     sum|c_K| = 179721388988719/6480. The text says (05-verification.tex:31-34) they depend on the program's
     priority lists `I`, which the text does not give; my substitution gives a different negative bound (in value).
     The printed arithmetic (-613302797399911 + 179721388988719)/6480 = -2007321335237/30 is checked.

WHAT IS NOT DECIDED HERE (theory, read and not re-proved):
  - Lemma lem:contraction, Lemma lem:partitions and the symmetries of m_H (the meaning of the pair identities);
  - the dichotomy deduction (nonnegative summands => g(alpha)g(q) = 0 => H^{o2} Hadamard) and Prop.
    prop:cubic-classification (Newton identities, the support argument, the five-cycle) => Theorem thm:fourier;
  - Lemma lem:basic (the 2-design projector identity — completeness enters here), the derivation of (cubic-cross),
    (cubic-positivity), the reduction of the weighted cross identity to orbit averages S_j;
  - Lemma lem:mixed-reductions, Lemma lem:gram and the sampling model; Y^*ZY >= 0 for real PD Z;
  - Weiner's completion theorem (N(6) <= 5 from "no seven"); the identification of T with S_6 of Tadej-Zyczkowski.
  A CERTIFIED here is the finite core of both theorems, not a proof of either headline.

Runtime: 269 s and 530 s measured (an M2 under other load): pair table ~25 s, exact rank of the full pair table
2-2.5 min, mixed table ~45 s, Gram expansion ~25 s, mixed elimination ~35 s; the five forges reuse the tables.

OBSERVED AFTER THIS DECIDER RAN (verify.py read only then): the program's coordinate priority lists are hand-picked
index lists (12 entries for the pair table, ~600 for the mixed table) inside pairtable() and mixtable(); its final
assertion pins the two printed residual rationals to that order. It does not compute anything for the cubic-pair
obstruction (Table tab:cubic-counts, the orbit counts, the S_j solve, -18): those are decided only here.
"""
import ast
import hashlib
import itertools
import os
import re
import sys
import time
from fractions import Fraction
from math import gcd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/Exact-Fourier-certificates-for-complex-Hadamard-matrices-of-order-six-September-24-2026/'
PAPER = DIR + 'build/paper.tex'
SEC2 = DIR + 'build/sections/02-pair-moments.tex'
SEC3C = DIR + 'build/sections/03-complete-family.tex'
SEC4 = DIR + 'build/sections/04-mixed.tex'
SEC5 = DIR + 'build/sections/05-verification.tex'
VERIFY = DIR + 'verification/verify.py'
LEAN = 'lean/ComparatorChallenges/MUBSix.lean'
P1 = 1000000007


# ---------------------------------------------------------------- linear expressions and exact elimination

def addto(d, e, c):
    for k, v in e.items():
        nv = d.get(k, 0) + c * v
        if nv:
            d[k] = nv
        else:
            d.pop(k, None)


def int_row(e):
    """clear denominators of a dict of Fractions; primitive integer row"""
    den = 1
    for v in e.values():
        v = Fraction(v)
        den = den * v.denominator // gcd(den, v.denominator)
    r = {k: int(Fraction(v) * den) for k, v in e.items()}
    g = 0
    for v in r.values():
        g = gcd(g, v)
    return {k: v // g for k, v in r.items()}


def modp_kept(rows, p=P1):
    """indices of rows that give a new pivot mod p (pivot = largest coordinate index). Independent mod p implies
    independent over Q, so the count is a LOWER bound for the rational rank; the rows are used only as a choice."""
    piv = {}
    kept = []
    for n, r in enumerate(rows):
        r = {k: v % p for k, v in r.items() if v % p}
        while r:
            c = max(r)
            if c in piv:
                f = r[c]
                for k, v in piv[c].items():
                    nv = (r.get(k, 0) - f * v) % p
                    if nv:
                        r[k] = nv
                    else:
                        r.pop(k, None)
            else:
                inv = pow(r[c], p - 2, p)
                piv[c] = {k: v * inv % p for k, v in r.items()}
                kept.append(n)
                break
    return kept


def exact_echelon(rows):
    """exact row echelon over Q, pivot at the largest index, pivot coefficient 1"""
    piv = {}
    for r in rows:
        r = {k: Fraction(v) for k, v in r.items() if v}
        while r:
            c = max(r)
            if c in piv:
                f = r[c]
                for k, v in piv[c].items():
                    nv = r.get(k, 0) - f * v
                    if nv:
                        r[k] = nv
                    else:
                        r.pop(k, None)
            else:
                lc = r[c]
                piv[c] = {k: v / lc for k, v in r.items()}
                break
    return piv


def reduce_exact(e, piv):
    """the unique representative of e modulo the row space with no pivot coordinate (= e P of Lemma
    lem:exact-elimination for this pivot set)"""
    r = {k: Fraction(v) for k, v in e.items() if v}
    out = {}
    while r:
        c = max(r)
        f = r.pop(c)
        if c in piv:
            for k, v in piv[c].items():
                if k != c:
                    nv = r.get(k, 0) - f * v
                    if nv:
                        r[k] = nv
                    else:
                        r.pop(k, None)
        else:
            out[c] = f
    return out


def back_substitute(piv):
    """rules: pivot coordinate -> expression in non-pivot coordinates (ascending pivots)"""
    rules = {}
    for c in sorted(piv):
        rule = {}
        for k, v in piv[c].items():
            if k == c:
                continue
            addto(rule, rules[k] if k in rules else {k: Fraction(1)}, -v)
        rules[c] = rule
    return rules


# ---------------------------------------------------------------- injective pair moments (Section 2)

def order(v):
    return sum(x for x in v if x > 0)


def transpose(A):
    return tuple(zip(*A)) if A else ()


def strip(A):
    rows = [r for r in A if any(r)]
    if not rows:
        return ()
    keep = [j for j in range(len(rows[0])) if any(r[j] for r in rows)]
    return tuple(tuple(r[j] for j in keep) for r in rows)


_canon = {}


def canon(A):
    """canonical name of m_H(A): minimum, over the symmetry orbit (row and column permutations, negation,
    transposition; zero rows/columns deleted; orientation with rows >= columns), of the row-sorted array.
    Columns are first arranged by a permutation-invariant key and only tied columns are permuted, which keeps the
    minimum over an orbit-invariant candidate set."""
    A = tuple(map(tuple, A))
    r = _canon.get(A)
    if r is not None:
        return r
    S = strip(A)
    if not S:
        _canon[A] = ()
        return ()
    best = None
    for M in (S, tuple(tuple(-x for x in row) for row in S)):
        for N in (M, transpose(M)):
            p, q = len(N), len(N[0])
            if p < q:
                continue
            cols = transpose(N)
            keys = [tuple(sorted(c)) for c in cols]
            groups = []
            for j in sorted(range(q), key=lambda j: keys[j]):
                if groups and keys[groups[-1][0]] == keys[j]:
                    groups[-1].append(j)
                else:
                    groups.append([j])
            for choice in itertools.product(*[itertools.permutations(g) for g in groups]):
                perm = [j for g in choice for j in g]
                B = tuple(sorted(tuple(row[j] for j in perm) for row in N))
                if best is None or B < best:
                    best = B
    _canon[A] = best
    return best


def contract(M, i, l):
    rows = [list(r) for r in M]
    rows[l] = [x + y for x, y in zip(rows[l], rows[i])]
    del rows[i]
    return tuple(map(tuple, rows))


_U0 = {}


def U0(A):
    """Lemma lem:contraction applied recursively (eq. recursive-pair-reduction): m(A) as a combination of the
    empty moment and moments with every row and column order >= 2. A is canonical."""
    r = _U0.get(A)
    if r is not None:
        return r
    if A == ():
        res = {(): Fraction(1)}
    else:
        assert len(A) <= 6 and len(A[0]) <= 6, A
        res = None
        for M in (A, transpose(A)):
            for i, row in enumerate(M):
                if order(row) == 1:
                    pp = len(M)
                    res = {}
                    for l in range(pp):
                        if l != i:
                            addto(res, U0(canon(contract(M, i, l))), Fraction(-1, 7 - pp))
                    break
            if res is not None:
                break
        if res is None:
            res = {A: Fraction(1)}
    _U0[A] = res
    return res


def nondecr(n, total, lo, hi):
    def rec(n, total, lo):
        if n == 0:
            if total == 0:
                yield ()
            return
        for x in range(lo, hi + 1):
            if x * n > total:
                break
            for rest in rec(n - 1, total - x, x):
                yield (x,) + rest
    return list(rec(n, total, lo))


def comps(total, caps):
    def rec(j, total):
        if j == len(caps):
            if total == 0:
                yield ()
            return
        for x in range(min(total, caps[j]) + 1):
            for rest in rec(j + 1, total - x):
                yield (x,) + rest
    return list(rec(0, total))


def seven_row_arrays(rord, cord):
    """7 x q arrays, zero row/column sums, row i of order rord[i], column j of order cord[j] (positive and negative
    capacities), each row the difference of disjointly supported compositions; equal-order rows in lex order"""
    q = len(cord)
    res = []

    def rec(i, pcap, ncap, acc):
        if i == len(rord):
            if not any(pcap) and not any(ncap):
                res.append(tuple(acc))
            return
        rem = sum(rord[i:])
        if sum(pcap) != rem or sum(ncap) != rem:
            return
        for pos in comps(rord[i], pcap):
            for negc in comps(rord[i], [0 if pos[j] else ncap[j] for j in range(q)]):
                row = tuple(pos[j] - negc[j] for j in range(q))
                if i > 0 and rord[i] == rord[i - 1] and row < acc[-1]:
                    continue
                rec(i + 1, tuple(pcap[j] - pos[j] for j in range(q)), tuple(ncap[j] - negc[j] for j in range(q)), acc + [row])
    rec(0, tuple(cord), tuple(cord), [])
    return res


def pair_table():
    """05-verification.tex:139-175: one equation sum_{l=1..6} U0(A_{0->l}) = 0 per canonical class of formal
    seven-row arrays"""
    eqs = []
    seen = set()
    for k in range(7, 12):
        h = k // 2
        for q in range(2, min(4, h) + 1):
            for rord in nondecr(7, k, 1, h):
                for cord in nondecr(q, k, 2, h):
                    for A in seven_row_arrays(rord, cord):
                        cA = canon(A)
                        if cA in seen:
                            continue
                        seen.add(cA)
                        assert order(A[0]) == 1 and len(A) == 7
                        e = {}
                        for l in range(1, 7):
                            addto(e, U0(canon(contract(A, 0, l))), 1)
                        eqs.append(e)
    return eqs


def set_partitions(n):
    def rec(i, acc, m):
        if i == n:
            yield tuple(acc)
            return
        for b in range(m + 1):
            yield from rec(i + 1, acc + [b], max(m, b + 1))
    return list(rec(0, [], 0))


def falling6(k):
    r = 1
    for i in range(k):
        r *= 6 - i
    return r


def partition_expand(charges, U):
    """Lemma lem:partitions: <Re prod g(a_j)> = sum_S (6)_|S| / 6^n m(A_S)"""
    charges = [c for c in charges if any(c)]
    n = len(charges)
    out = {}
    if n == 0:
        return dict(U(()))
    for rg in set_partitions(n):
        k = max(rg) + 1
        if k > 6:
            continue
        cols = [[0] * 6 for _ in range(k)]
        for j, b in enumerate(rg):
            for i in range(6):
                cols[b][i] += charges[j][i]
        addto(out, U(canon(tuple(tuple(cols[b][i] for b in range(k)) for i in range(6)))), Fraction(falling6(k), 6 ** n))
    return out


def vneg(v):
    return tuple(-x for x in v)


def vsub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def vadd(a, b):
    return tuple(x + y for x, y in zip(a, b))


def pair_certificate_expr(P, q, U):
    """3<|L|^2> + <|g(alpha)g(q)|^2>, L = -g(w) + sum c_j g(a_j) g(w - a_j)"""
    mons = [(-1, [P['w']])] + [(c, [a, vsub(P['w'], a)]) for c, a in zip(P['c'], P['a'])]
    out = {}
    for c1, ch1 in mons:
        for c2, ch2 in mons:
            addto(out, partition_expand(ch1 + [vneg(x) for x in ch2], U), P['three'] * c1 * c2)
    addto(out, partition_expand([P['alpha'], q, vneg(P['alpha']), vneg(q)], U), 1)
    return out


def pair_key(A):
    if A == ():
        return (-1,)
    return (sum(order(r) for r in A), len(A), len(A[0]), A)


# ---------------------------------------------------------------- Q(omega), exact

def zadd(a, b):
    return (a[0] + b[0], a[1] + b[1])


def zmul(a, b):
    return (a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0] - a[1] * b[1])


def zconj(a):
    return (a[0] - a[1], -a[1])


def znorm(a):
    return a[0] * a[0] - a[0] * a[1] + a[1] * a[1]


def zscale(a, c):
    return (a[0] * c, a[1] * c)


def root_powers(n):
    """zeta_n^m in Z[omega] for n = 3 (omega)"""
    z = (0, 1)
    out = [(1, 0)]
    for _ in range(n - 1):
        out.append(zmul(out[-1], z))
    assert zmul(out[-1], z) == (1, 0)
    return out


# Q(zeta12) as 4-vectors over Q in the basis 1, z, z^2, z^3 with z^4 = z^2 - 1 (Phi_12 = x^4 - x^2 + 1); it holds
# omega = z^4 and zeta6 = z^2, so T, F6 and the Fourier-family member below are all exact here.

def c12_reduce(c):
    c = list(c)
    for d in range(len(c) - 1, 3, -1):
        x = c[d]
        if x:
            c[d] = 0
            c[d - 2] += x
            c[d - 4] -= x
    return tuple(c[:4])


def c12_mul(a, b):
    c = [0] * 7
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                if y:
                    c[i + j] += x * y
    return c12_reduce(c)


def c12_add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def c12_scale(a, s):
    return tuple(x * s for x in a)


Z12 = [(1, 0, 0, 0)]
for _m in range(11):
    Z12.append(c12_mul(Z12[-1], (0, 1, 0, 0)))
assert c12_mul(Z12[11], (0, 1, 0, 0)) == (1, 0, 0, 0)


def c12_conj(a):
    out = (0, 0, 0, 0)
    for k, x in enumerate(a):
        if x:
            out = c12_add(out, c12_scale(Z12[(-k) % 12], x))
    return out


def hadamard12(E):
    """(z^E_ik) has rows with inner products exactly 6 delta_ij"""
    for i in range(6):
        for j in range(6):
            s = (0, 0, 0, 0)
            for k in range(6):
                s = c12_add(s, Z12[(E[i][k] - E[j][k]) % 12])
            if s != ((6, 0, 0, 0) if i == j else (0, 0, 0, 0)):
                return False
    return True


def g12(E, a):
    s = (0, 0, 0, 0)
    for k in range(6):
        s = c12_add(s, Z12[sum(a[i] * E[i][k] for i in range(6)) % 12])
    return c12_scale(s, Fraction(1, 6))


def pair_identity_direct(E, P, q):
    """the left side of eq. pair-certificate for the matrix (z^E_ik), z = exp(2 pi i/12), exactly in Q(zeta12):
    average over both orientations and all 720 row orders of 3|L|^2 + |g(alpha)g(q)|^2"""
    tot = (0, 0, 0, 0)
    ET = [list(r) for r in zip(*E)]
    for K in (E, ET):
        for pi in itertools.permutations(range(6)):
            Kp = [K[pi[i]] for i in range(6)]
            L = c12_scale(g12(Kp, P['w']), -1)
            for c, a in zip(P['c'], P['a']):
                L = c12_add(L, c12_scale(c12_mul(g12(Kp, a), g12(Kp, vsub(P['w'], a))), c))
            gg = c12_mul(g12(Kp, P['alpha']), g12(Kp, q))
            tot = c12_add(tot, c12_add(c12_scale(c12_mul(L, c12_conj(L)), P['three']), c12_mul(gg, c12_conj(gg))))
    return c12_scale(tot, Fraction(1, 1440))


def fourier_family_member(ap=1, bp=4):
    """F6 with the phases z^ap on columns 1,4 and z^bp on columns 2,5 of rows 1,3,5 (a member of the two-parameter
    affine Fourier family; its Hadamard property is checked exactly, not assumed)"""
    E = [[(2 * i * k) % 12 for k in range(6)] for i in range(6)]
    for i in (1, 3, 5):
        for k in (1, 4):
            E[i][k] = (E[i][k] + ap) % 12
        for k in (2, 5):
            E[i][k] = (E[i][k] + bp) % 12
    return E


# ---------------------------------------------------------------- the cubic matrix (Section 4.2-4.5)

def tao_exponents():
    t = [[0] * 6 for _ in range(6)]
    for i in range(1, 6):
        for j in range(1, 6):
            if i != j:
                t[i][j] = 1 if (i - j) % 5 in (1, 4) else -1
    return t


DSET = [tuple((k == i) - (k == j) for k in range(6)) for i in range(6) for j in range(6) if i != j]


def cubic_checks(checks, src, forged_table=None):
    t = tao_exponents()
    pw = root_powers(3)

    def inner(i, j, m):
        s = (0, 0)
        for k in range(6):
            s = zadd(s, pw[(m * (t[i][k] - t[j][k])) % 3])
        return s
    for m, nm in ((1, 'T'), (2, 'T^{o2} (entrywise square)')):
        check(checks, 'B. %s is Hadamard: row inner products exactly 6 delta_ij in Z[omega]' % nm,
              all(inner(i, j, m) == ((6, 0) if i == j else (0, 0)) for i in range(6) for j in range(6)))
    lean = src.text(LEAN)
    m = re.search(r'def taoExponent[^!]*!!\[(.*?)\]', lean, re.S)
    lrows = [[int(x) for x in row.split(',')] for row in m.group(1).replace('\n', ' ').split(';')]
    check(checks, 'B. Lean MUBSix.taoExponent equals the paper\'s t_ij mod 3 (eq. cubic-matrix)',
          lrows == [[x % 3 for x in r] for r in t])

    def v(b, k):
        return sum(b[i] * t[i][k] for i in range(6)) % 3

    def G(b):
        N = [0, 0, 0]
        for k in range(6):
            N[v(b, k)] += 1
        return (Fraction(N[0] - N[2], 6), Fraction(N[1] - N[2], 6)), tuple(N)

    a0, c0 = (-1, -1, 0, 0, 1, 1), (0, 0, 0, 0, -1, 1)
    O = sorted({(tuple(a0[p[i]] for i in range(6)), tuple(c0[p[i]] for i in range(6))) for p in itertools.permutations(range(6))})
    Oloop = []
    for p in range(6):
        for q in range(6):
            if p == q:
                continue
            for h in range(6):
                for i in range(h + 1, 6):
                    if {h, i} & {p, q}:
                        continue
                    Oloop.append((tuple((k == p) + (k == q) - (k == h) - (k == i) for k in range(6)), tuple((k == q) - (k == p) for k in range(6))))
    check(checks, 'B. |O| = 180 and the loop parametrization (A = e_p+e_q-e_h-e_i, C = e_q-e_p) is exactly O',
          len(O) == 180 and sorted(Oloop) == O, '|O| = %d' % len(O))
    Dset = set(DSET)

    def R(b):
        tot = (Fraction(0), Fraction(0))
        for A, C in O:
            for eps in (1, -1):
                eb = b if eps == 1 else vneg(b)
                if vsub(eb, A) in Dset:
                    x = zmul(G(vsub(A, C))[0], G(vadd(vsub(eb, A), C))[0])
                    tot = zadd(tot, x if eps == 1 else zconj(x))
        return zscale(tot, Fraction(1, 2))

    def U_loop(b):
        U = [0, 0, 0]
        for (A, C) in Oloop:
            u = vsub(A, C)
            for s in (-1, 1):
                sb = tuple(s * x for x in b)
                if vsub(sb, A) in Dset:
                    for k in range(6):
                        for l in range(6):
                            U[(s * (v(u, k) + v(vsub(sb, u), l))) % 3] += 1
        return tuple(U)

    # the printed table, parsed from the tex
    tex = src.text(SEC3C)
    rows = re.findall(r'^(\d+)&\$\(([-\d,]+)\)\$&\$\((\d+),(\d+),(\d+)\)\$&\$\((\d+),(\d+),(\d+)\)\$\\\\', tex, re.M)
    table = [(int(r[0]), tuple(int(x) for x in r[1].split(',')), tuple(int(x) for x in r[2:5]), tuple(int(x) for x in r[5:8])) for r in rows]
    if forged_table:
        table = forged_table(table)
    check(checks, 'B. Table tab:cubic-counts parsed: 11 rows j = 0..10', [r[0] for r in table] == list(range(11)))
    bad = []
    for j, wj, N, U in table:
        gN = G(wj)[1]
        uL = U_loop(wj)
        rD = R(wj)
        uz = (Fraction(U[0] - U[2], 72), Fraction(U[1] - U[2], 72))
        if gN != N or uL != U or rD != uz:
            bad.append((j, gN, uL))
    check(checks, 'B. every (N0,N1,N2) and (U0,U1,U2) of the table, by the printed loops and by the definitions (cubic-R)',
          not bad, 'mismatches %s' % bad)

    def rep(b):
        return min(tuple(sorted(b)), tuple(sorted(-x for x in b)))
    reps = {wj: j for j, wj, _, _ in table}
    allb = sorted(balanced_upto(3))
    cls = {}
    for b in allb:
        cls.setdefault(rep(b), []).append(b)
    check(checks, 'B. the 11 representatives are exactly the signed-permutation classes of balanced charges of order <= 3',
          set(cls) == set(reps), '%d classes, %d charges' % (len(cls), len(allb)))
    size = {reps[r]: len(bs) for r, bs in cls.items() if r in reps}
    lam = {3: Fraction(1, 2), 6: Fraction(3), 7: Fraction(9), 8: Fraction(4)}
    badR = [b for b in allb if R(b) != zscale(G(b)[0], lam.get(reps.get(rep(b)), Fraction(0)))]
    check(checks, 'B. R(b) = lambda_j G(b) for EVERY balanced b of order <= 3 (lambda_3,6,7,8 = 1/2,3,9,4; 0 elsewhere)',
          not badR, '%d charges checked, %d fail' % (len(allb), len(badR)))
    supp = {vadd(A, d) for A, C in O for d in DSET}
    check(checks, 'B. the support of R has order <= 3 (eps b = A + d with ord A = 2, d in D)',
          all(order(b) <= 3 for b in supp))
    check(checks, 'B. orbit sizes of w3, w6, w7, w8 are 360, 120, 20, 90 (printed 03-complete-family.tex:357)',
          [size[3], size[6], size[7], size[8]] == [360, 120, 20, 90] and '$360,120,20,90$' in tex, str([size[j] for j in (3, 6, 7, 8)]))
    coef = [lam[j] * size[j] for j in (3, 6, 7, 8)]
    check(checks, 'B. coefficients lambda_j |O_j| = 180, 360, 180, 360 (printed :359)', coef == [180, 360, 180, 360] and '$180,360,180,360$' in tex, str(coef))
    zero_cls = all(G(b)[0] == (0, 0) for j in (1, 4, 5, 9) for b in cls[table[j][1]])
    check(checks, 'B. G = 0 on every charge of orbits 1, 4, 5, 9 (so S1 = S4 = S5 = S9 = 0)', zero_cls)
    quarter = all(znorm(G(b)[0]) == Fraction(1, 4) for j in (6, 8) for b in cls[table[j][1]])
    check(checks, 'B. |G|^2 = 1/4 on every charge of orbits 6 and 8 (so S6 = S8 = -1/20 via f = -G/5)', quarter)
    threeD = {tuple(3 * x for x in d) for d in DSET}
    orb = {tuple(s * (3 * ((k == p[5]) - (k == p[0]))) for k in range(6)) for p in itertools.permutations(range(6)) for s in (1, -1)}
    check(checks, 'B. G(3d) = 1 for all d in D, and the signed orbit of 3(e5 - e0) is exactly {3d : d in D}',
          all(G(b)[0] == (1, 0) for b in threeD) and orb == threeD and len(threeD) == 30)
    counts = {}
    for name, wj in (('w5', table[5][1]), ('w8', table[8][1])):
        cnt = {}
        for d in DSET:
            j = reps[rep(vadd(wj, d))]
            cnt[j] = cnt.get(j, 0) + 1
        counts[name] = cnt
    m = re.search(r'w_5\+D&([\d&]+)\\\\\s*w_8\+D&([\d&]+)\.', tex)
    head = [0, 1, 3, 4, 6, 7, 8, 9]
    pr5 = dict(zip(head, map(int, m.group(1).split('&'))))
    pr8 = dict(zip(head, map(int, m.group(2).split('&'))))
    norm = lambda c: {k: v for k, v in c.items() if v}
    check(checks, 'B. orbit counts of w5 + D and w8 + D equal the printed array (03-complete-family.tex:379-383)',
          norm(counts['w5']) == norm(pr5) and norm(counts['w8']) == norm(pr8), 'w5: %s; w8: %s' % (counts['w5'], counts['w8']))
    # the linear solve: unknowns S0, S3, S7
    S = {1: 0, 4: 0, 5: 0, 9: 0, 6: Fraction(-1, 20), 8: Fraction(-1, 20)}
    eqs = []
    rel1 = dict(zip((3, 6, 7, 8), coef))
    for rel in (rel1, counts['w5'], counts['w8']):
        row = [Fraction(rel.get(j, 0)) for j in (0, 3, 7)]
        rhs = -sum(Fraction(c) * S[j] for j, c in rel.items() if j in S)
        bad_unknown = [j for j in rel if j not in S and j not in (0, 3, 7)]
        assert not bad_unknown, bad_unknown
        eqs.append(row + [rhs])
    M = [r[:] for r in eqs]
    for c in range(3):
        p = next(r for r in range(c, 3) if M[r][c] != 0)
        M[c], M[p] = M[p], M[c]
        M[c] = [x / M[c][c] for x in M[c]]
        for r in range(3):
            if r != c and M[r][c]:
                M[r] = [x - M[r][c] * y for x, y in zip(M[r], M[c])]
    S0, S3, S7 = M[0][3], M[1][3], M[2][3]
    check(checks, 'B. the three relations solve to S3 = S7 = 1/10, S0 = -4/5 (printed :397)',
          (S0, S3, S7) == (Fraction(-4, 5), Fraction(1, 10), Fraction(1, 10)), 'S0=%s S3=%s S7=%s' % (S0, S3, S7))
    check(checks, 'B. E|sum z_i^3|^2 = 6 + 30 S0 = -18 < 0 (printed :403)', 6 + 30 * S0 == -18, str(6 + 30 * S0))
    return {'S0': str(S0), 'S3': str(S3), 'S7': str(S7)}


# ---------------------------------------------------------------- mixed moments (Sections 5 and 6)

ALPHA_SORTED = (-1, -1, -1, 1, 1, 1)
CONST = ('C',)


def relabel(labels):
    m = {}
    return tuple(m.setdefault(s, len(m)) for s in labels)


_cm = {}


def cmix(labels, charges):
    """canonical mixed key: zero charges dropped; min over factor permutations and global negation of
    (labels renamed by first occurrence, sorted coordinate rows)"""
    k = (labels, charges)
    r = _cm.get(k)
    if r is not None:
        return r
    fs = [(s, c) for s, c in zip(labels, charges) if any(c)]
    best = ((), ())
    if fs:
        best = None
        for perm in itertools.permutations(range(len(fs))):
            labs = relabel(tuple(fs[i][0] for i in perm))
            for sg in (1, -1):
                cand = (labs, tuple(sorted(tuple(sg * fs[i][1][x] for i in perm) for x in range(6))))
                if best is None or cand < best:
                    best = cand
    if len(_cm) < 3000000:
        _cm[k] = best
    return best


def key_charges(key):
    labs, rows = key
    return [tuple(rows[x][j] for x in range(6)) for j in range(len(labs))]


class Mixed:
    """evmix of 05-verification.tex:225-243 (zero rule, single-label pair expansion through the pair substitutions,
    singleton order-two rule, else a retained mixed coordinate)"""

    def __init__(self, pair_rules):
        self.rules = pair_rules
        self.memo = {}
        self.rows0 = []
        self.rows0_keys = set()
        self.registered = set()
        self._U = {}

    def U(self, A):
        r = self._U.get(A)
        if r is None:
            r = {}
            for k, c in U0(A).items():
                if k == ():
                    addto(r, {CONST: 1}, c)
                elif k in self.rules:
                    for kk, cc in self.rules[k].items():
                        addto(r, {CONST if kk == () else ('P', kk): 1}, c * cc)
                else:
                    addto(r, {('P', k): 1}, c)
            self._U[A] = r
        return r

    def ev(self, labels, charges):
        return self.evkey(cmix(tuple(labels), tuple(map(tuple, charges))))

    def evkey(self, key):
        r = self.memo.get(key)
        if r is not None:
            return r
        labs, rows = key
        if not labs:
            res = {CONST: Fraction(1)}
            self.registered.add(CONST)
        else:
            ch = key_charges(key)
            nlab = len(set(labs))
            if any(order(c) == 1 or tuple(sorted(c)) == ALPHA_SORTED for c in ch):
                if nlab <= 1 and key not in self.rows0_keys:
                    self.rows0_keys.add(key)
                    e = partition_expand(ch, self.U)
                    self.registered.update(e)
                    if e:
                        self.rows0.append(e)
                res = {}
            elif nlab <= 1:
                res = partition_expand(ch, self.U)
                self.registered.update(res)
            else:
                res = None
                for j, c in enumerate(ch):
                    if order(c) == 2 and labs.count(labs[j]) == 1:
                        used = sorted(set(labs))
                        res = {}
                        for t in used:
                            if t != labs[j]:
                                nl = list(labs)
                                nl[j] = t
                                addto(res, self.ev(nl, ch), Fraction(-1, 7 - len(used)))
                        break
                if res is None:
                    res = {('M', key): Fraction(1)}
                    self.registered.add(('M', key))
        self.memo[key] = res
        return res


def compositions(n, k=6):
    if k == 1:
        yield (n,)
        return
    for x in range(n + 1):
        for r in compositions(n - x, k - 1):
            yield (x,) + r


def balanced_upto(maxord):
    """every balanced charge in Z^6 of order <= maxord (difference of disjointly supported compositions)"""
    out = set()
    for o in range(maxord + 1):
        cs = list(compositions(o))
        for pos in cs:
            for negp in cs:
                if not any(pos[i] and negp[i] for i in range(6)):
                    out.add(tuple(pos[i] - negp[i] for i in range(6)))
    return out


def triples(maxtot=11):
    allb = sorted(balanced_upto(5))
    reps = sorted({min(tuple(sorted(a)), tuple(sorted(-x for x in a))) for a in allb if any(a)})
    out = set()
    for a in reps:
        oa = order(a)
        for b in allb:
            ob = order(b)
            if ob > oa:
                continue
            c = tuple(-x - y for x, y in zip(a, b))
            oc = order(c)
            if oc <= ob and oa + ob + oc <= maxtot:
                out.add(tuple(sorted(zip(a, b, c))))
    return sorted(out)


def unit(i):
    return tuple(int(k == i) for k in range(6))


def mixed_table(mx, maxtot=11):
    eqs = []
    tot = lambda t: sum(order(x) for x in t)
    for rows in triples(maxtot):
        a = tuple(r[0] for r in rows)
        b = tuple(r[1] for r in rows)
        c = tuple(r[2] for r in rows)
        for labs in ((0, 0, 0), (0, 0, 1), (0, 1, 0), (0, 1, 1), (0, 1, 2)):
            mx.ev(labs, (a, b, c))
        perms = sorted({p for p in itertools.permutations((a, b, c)) if p[0] <= p[1]})
        for (A, B, C) in perms:
            cz = not any(C)
            shifted = [(vadd(A, vsub(unit(i), unit(j))), vsub(B, vsub(unit(i), unit(j))), C) for i in range(6) for j in range(6) if i != j]
            if all(tot(s) <= maxtot for s in shifted):
                for labs in (((0, 1, 0),) if cz else ((0, 1, 2), (0, 1, 0), (0, 1, 1))):
                    e = {}
                    for s in shifted:
                        addto(e, mx.ev(labs, s), 1)
                    eqs.append(e)
            for us in ((0,) if cz else (0, 1)):
                rhs = mx.ev((0, us), (vneg(C), C))
                for i in range(6):
                    for sg in (1, -1):
                        sh = []
                        for j in range(6):
                            d = tuple(sg * x for x in vsub(unit(i), unit(j)))
                            sh.append((vadd(A, d), vsub(B, d), C))
                        if all(tot(s) <= maxtot for s in sh):
                            e = {}
                            for s in sh:
                                addto(e, mx.ev((0, 0, us), s), 1)
                            addto(e, rhs, -1)
                            eqs.append(e)
    return eqs


# ---------------------------------------------------------------- the six positive forms

def load_data(text):
    tree = ast.parse(text)
    found = [n for n in ast.walk(tree) if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'data' for t in n.targets)]
    assert len(found) == 1
    return ast.literal_eval(found[0].value)


def young_groups(lam):
    rows, pos = [], 1
    for L in lam:
        rows.append(list(range(pos, pos + L)))
        pos += L
    assert pos == 6
    cols = [[r[c] for r in rows if len(r) > c] for c in range(max(lam))]

    def group(blocks):
        out = []
        for choice in itertools.product(*[itertools.permutations(b) for b in blocks]):
            p = list(range(6))
            for b, im in zip(blocks, choice):
                for x, y in zip(b, im):
                    p[x] = y
            sg, seen = 1, [False] * 6
            for i in range(6):
                j, L = i, 0
                while not seen[j]:
                    seen[j] = True
                    j = p[j]
                    L += 1
                if L and L % 2 == 0:
                    sg = -sg
            out.append((tuple(p), sg))
        return out
    return group(rows), group(cols)


def makeZ(m, a):
    if len(a) != m * (m + 1) // 2:
        return None
    Z = [[0] * m for _ in range(m)]
    for i in range(m):
        for j in range(i + 1):
            Z[i][j] = Z[j][i] = a[i * (i + 1) // 2 + j]
    return Z


def schur_pivots(Z):
    """B = [[C, u], [u^T, p]] -> C - u u^T / p, last coordinate first; returns all pivots (stops at the first <= 0)"""
    B = [[Fraction(x) for x in row] for row in Z]
    piv = []
    while B:
        n = len(B)
        p = B[n - 1][n - 1]
        piv.append(p)
        if p <= 0:
            break
        u = [B[i][n - 1] for i in range(n - 1)]
        B = [[B[i][j] - u[i] * u[j] / p for j in range(n - 1)] for i in range(n - 1)]
    return piv


def gram_expr(data):
    """Q = 5 sum_lam 10^(15-e) E(Y^* Z Y) as integer combination of canonical mixed keys (Lemma lem:gram)"""
    Q = {}
    for lam, ws, e, a in data:
        m = len(ws)
        Z = makeZ(m, a)
        Rg, Cg = young_groups(lam)
        idx, cols = {}, []
        Y = []
        for t, v in ws:
            y = {}
            for p, _ in Rg:
                for q, sq in Cg:
                    u = tuple(v[q[p[j]]] for j in range(6))
                    y[(t, u)] = y.get((t, u), 0) + sq
            for k in y:
                if k not in idx:
                    idx[k] = len(cols)
                    cols.append(k)
            Y.append(y)
        n = len(cols)
        Ym = [[0] * n for _ in range(m)]
        for i in range(m):
            for k, c in Y[i].items():
                Ym[i][idx[k]] += c
        ZY = [[sum(Z[i][k] * Ym[k][col] for k in range(m)) for col in range(n)] for i in range(m)]
        scale = 10 ** (15 - e)
        for x in range(n):
            for y_ in range(x, n):
                psi = sum(Ym[i][x] * ZY[i][y_] for i in range(m))
                if not psi:
                    continue
                mult = scale * psi * (1 if x == y_ else 2)
                (s, A), (t, V) = cols[x], cols[y_]
                b = (A, vneg(V), vsub(V, A))
                if (s, t) == (1, 1):
                    for labs, wgt in (((1, 1, 0), 1), ((1, 2, 0), 4)):
                        k = cmix(labs, b)
                        Q[k] = Q.get(k, 0) + wgt * mult
                else:
                    k = cmix((s, t, 0), b)
                    Q[k] = Q.get(k, 0) + 5 * mult
    return {k: v for k, v in Q.items() if v}


def coord_weight(c):
    if c == CONST:
        return 0
    if c[0] == 'P':
        return sum(order(r) for r in c[1])
    return sum(order(x) for x in key_charges(c[1]))


def mixed_priority(c):
    """my coordinate order: constant lowest, then pair moments, then mixed moments, each by total order;
    pivots are taken at the highest coordinate, so the constant is never eliminated"""
    if c == CONST:
        return (0,)
    return (1 if c[0] == 'P' else 2, coord_weight(c), repr(c))


# ---------------------------------------------------------------- tables, built once per process

_T = {}


def tables(full_pair_rank=True):
    if 'pair' not in _T:
        t = time.time()
        peqs = pair_table()
        coords = set()
        for e in peqs:
            coords.update(e)
        pall = sorted(coords, key=pair_key)
        pidx = {c: i for i, c in enumerate(pall)}
        prows = [int_row({pidx[k]: v for k, v in e.items()}) for e in peqs]
        kept = modp_kept(prows)
        piv = exact_echelon([prows[i] for i in kept])
        rules = {pall[c]: {pall[k]: v for k, v in r.items()} for c, r in back_substitute(piv).items()}
        _T['pair'] = dict(eqs=peqs, coords=pall, idx=pidx, rows=prows, kept=kept, piv=piv, rules=rules, time=time.time() - t)
    if full_pair_rank and 'pair_rank_Q' not in _T:
        t = time.time()
        _T['pair_rank_Q'] = len(exact_echelon(_T['pair']['rows']))
        _T['pair_rank_time'] = time.time() - t
    if 'mixed' not in _T:
        t = time.time()
        mx = Mixed(_T['pair']['rules'])
        meqs = mixed_table(mx)
        nz = [e for e in meqs if e]
        rows0 = list(mx.rows0)
        registered = set(mx.registered)
        allrows = nz + rows0
        _T['mixed'] = dict(mx=mx, eqs=meqs, nz=nz, rows0=rows0, registered=registered, allrows=allrows, time_table=time.time() - t)
    return _T


def mixed_echelon(extra_coords):
    """exact echelon of the mixed rows that are independent mod p, in my priority order (cached per coordinate set)"""
    M = _T['mixed']
    coords = set(M['registered'])
    for e in M['allrows']:
        coords.update(e)
    coords.update(extra_coords)
    keyset = frozenset(coords)
    if M.get('ech_key') != keyset:
        t = time.time()
        allc = sorted(coords, key=mixed_priority)
        idx = {c: i for i, c in enumerate(allc)}
        rows = [int_row({idx[k]: v for k, v in e.items()}) for e in M['allrows']]
        kept = modp_kept(rows)
        piv = exact_echelon([rows[i] for i in kept])
        M.update(ech_key=keyset, allc=allc, idx=idx, kept=kept, piv=piv, time_elim=time.time() - t)
    return M


# ---------------------------------------------------------------- decide

def parse_vec(s):
    return tuple(int(x) for x in s.split(','))


def decide(src=None, forge_pair=None, forge_data=None, forge_table=None, forge_printed=None, full_pair_rank=True):
    src = src or Sources()
    checks = []
    t0 = time.time()
    paper = src.text(PAPER)
    s2 = src.text(SEC2)
    s4 = src.text(SEC4)
    s5 = src.text(SEC5)
    vtext = src.text(VERIFY)
    printed = {'pair': (8871, 909, 897), 'mixed': (46041, 3429, 2767)}
    if forge_printed:
        printed = forge_printed(printed)
    check(checks, 'the theorems as stated (paper.tex:65-71 thm:fourier, 142-149 thm:main, abstract 11-19)',
          'g_H(\\pi\\alpha)=0\\qquad\\text{for every coordinate permutation }\\pi' in paper and 'There do not exist seven orthonormal bases' in paper)
    check(checks, 'the printed rank tables (paper.tex:244-245; 05-verification.tex:316-317)',
          'rank table: %d %d %d' % printed['pair'] in paper and 'rank table: %d %d %d' % printed['mixed'] in paper
          and 'Pair  & $%d$  & $%d$  & $%d$' % printed['pair'] in s5 and 'Mixed & $%d$ & $%d$ & $%d$' % printed['mixed'] in s5)
    printed_sha = re.search(r'For reference, the SHA-256 checksum.*?ttfamily\s*([0-9a-f]+)\\allowbreak\s*([0-9a-f]+)', paper, re.S)
    check(checks, 'sha256 of verification/verify.py equals the checksum printed at paper.tex:260-262',
          bool(printed_sha) and src.read[VERIFY] == printed_sha.group(1) + printed_sha.group(2), src.read[VERIFY])

    # ---- A. the pair certificate
    P = {}
    P['alpha'] = parse_vec(re.search(r'\\alpha=\(([-\d,]+)\)\$ and put', s2).group(1))
    P['w'] = parse_vec(re.search(r'w&=\(([-\d,]+)\)', s2).group(1))
    P['a'] = [parse_vec(re.search(r'a_%d&=\(([-\d,]+)\)' % j, s2).group(1)) for j in range(1, 5)]
    P['c'] = parse_vec(re.search(r'\(c_1,c_2,c_3,c_4\)=\(([-\d,]+)\)', s2).group(1))
    P['qs'] = [parse_vec(re.search(r'q_\{\\mathrm\{%s\}\}=\(([-\d,]+)\)' % nm, s2).group(1)) for nm in ('cross', 'same')]
    P['three'] = int(re.search(r'(\d+)\\bigl\\langle \|L_\{\\widetilde H\}\|\^2\\bigr\\rangle_H', s2).group(1))
    if forge_pair:
        P = forge_pair(P)
    T = tables(full_pair_rank)
    pt = T['pair']
    nz = [e for e in pt['eqs'] if e]
    check(checks, 'A. pair table: %d nonzero seven-row equations (printed %d)' % (len(nz), printed['pair'][0]), len(nz) == printed['pair'][0])
    check(checks, 'A. pair table: %d moment coordinates (printed %d)' % (len(pt['coords']), printed['pair'][1]), len(pt['coords']) == printed['pair'][1])
    check(checks, 'A. pair table: %d pivots mod 1000000007 (printed %d witness rows)' % (len(pt['kept']), printed['pair'][2]), len(pt['kept']) == printed['pair'][2])
    if full_pair_rank:
        check(checks, 'A. exact rank over Q of all %d pair equations = %d (so the modular count is the rational rank)' % (len(pt['eqs']), T['pair_rank_Q']),
              T['pair_rank_Q'] == len(pt['kept']), '%.0fs' % T['pair_rank_time'])
    Uplain = lambda A: U0(A)
    residuals = {}
    for nm, q in zip(('q_cross', 'q_same'), P['qs']):
        E = pair_certificate_expr(P, q, Uplain)
        outside = [k for k in E if k not in pt['idx']]
        if outside:
            residuals[nm] = 'coordinates outside the table: %d' % len(outside)
            check(checks, 'A. Prop. pair-certificate for %s = %s: expression lies in the table\'s row space' % (nm, q), False, residuals[nm])
            continue
        red = reduce_exact({pt['idx'][k]: v for k, v in E.items()}, pt['piv'])
        residuals[nm] = len(red)
        check(checks, 'A. Prop. pair-certificate for %s = %s: every coefficient of 3<|L|^2> + <|g(alpha)g(q)|^2> vanishes after exact substitution'
              % (nm, q), not red, '%d terms before, %d nonzero after' % (len(E), len(red)))
    t12 = [[(4 * x) % 12 for x in row] for row in tao_exponents()]
    f6 = [[(2 * i * k) % 12 for k in range(6)] for i in range(6)]
    for nm, E12 in (('Tao T', t12), ('Fourier F6', f6), ('the Fourier-family member F6(z, z^4) [z = exp(2 pi i/12)]', fourier_family_member())):
        vals = [pair_identity_direct(E12, P, q) for q in P['qs']]
        check(checks, 'A. consistency instance: %s is Hadamard (exact) and the identity evaluated directly on it, exactly in Q(zeta12), is 0 for both q' % nm,
              hadamard12(E12) and all(x == (0, 0, 0, 0) for x in vals), str([str(x[0]) if not any(x[1:]) else str(x) for x in vals]))

    # ---- B. the cubic-pair obstruction
    cubic = cubic_checks(checks, src, forge_table)

    # ---- C. the mixed certificate
    data = load_data(vtext)
    if forge_data:
        data = forge_data(data)
    sizes = re.findall(r'^\$\(([\d,]+)\)\$\s*&\s*(\d+)\s*&\s*(\d+)\\\\', s4, re.M)
    sizes = [(parse_vec(l), int(m_), int(e)) for l, m_, e in sizes]
    check(checks, 'C. the six records match the printed sizes and scales (04-mixed.tex:238-245)',
          [(tuple(lam), len(ws), e) for lam, ws, e, a in data] == sizes, str(sizes))
    pivs, okZ = [], True
    for lam, ws, e, a in data:
        Z = makeZ(len(ws), a)
        if Z is None:
            okZ = False
            continue
        pv = schur_pivots(Z)
        pivs.extend(pv)
        okZ = okZ and len(pv) == len(ws) and all(p > 0 for p in pv)
    check(checks, 'C. every Z_lambda is well formed and positive definite (exact Schur pivots, %d pivots)' % len(pivs), okZ)
    check(checks, 'C. all 98 pivots exceed 40000, last coordinate first (05-verification.tex:329-344)',
          len(pivs) == 98 and all(p > 40000 for p in pivs), 'min pivot %.1f' % float(min(pivs)) if pivs else '')
    M = T['mixed']
    check(checks, 'C. mixed table: %d nonzero equations (%d shifted-sum + %d single-label zero) (printed %d)'
          % (len(M['allrows']), len(M['nz']), len(M['rows0']), printed['mixed'][0]), len(M['allrows']) == printed['mixed'][0])
    check(checks, 'C. mixed table: %d registered coordinates (printed %d)' % (len(M['registered']), printed['mixed'][1]), len(M['registered']) == printed['mixed'][1])
    Qk = gram_expr(data)
    mx = M['mx']
    Q = {}
    for k, c in Qk.items():
        addto(Q, mx.evkey(k), c)
    E = mixed_echelon(Q.keys())
    check(checks, 'C. mixed table: %d pivots mod 1000000007 (printed %d witness rows)' % (len(E['kept']), printed['mixed'][2]), len(E['kept']) == printed['mixed'][2])
    check(checks, 'C. the %d kept rows are independent over Q (exact echelon rank %d)' % (len(E['kept']), len(E['piv'])), len(E['piv']) == len(E['kept']))
    red = reduce_exact({E['idx'][k]: v for k, v in Q.items()}, E['piv'])
    c0 = red.get(0, Fraction(0))
    assert E['allc'][0] == CONST
    s_abs = sum(abs(v) for k, v in red.items() if k != 0)
    bound = c0 + s_abs
    check(checks, 'C. Prop. mixed-certificate: after exact substitution Q = c0 + sum c_K mu_K with c0 + sum|c_K| < 0 (my substitution)',
          bound < 0 and okZ, 'c0 = %s, sum|c_K| = %s, bound = %s (%.6e)' % (c0, s_abs, bound, float(bound)))
    pc0, ps = Fraction(-613302797399911, 6480), Fraction(179721388988719, 6480)
    check(checks, 'C. printed arithmetic: (-613302797399911 + 179721388988719)/6480 = -2007321335237/30 < 0',
          pc0 + ps == Fraction(-2007321335237, 30) and '-\\frac{2007321335237}{30}<0' in s5)
    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED',
            'checks': checks, 'sources': dict(src.read),
            'decides': 'a finite component: the exact finite core of both theorems — the single-matrix certificate (Prop. pair-certificate, both q), '
                       'the finite arithmetic of the cubic-pair obstruction (Prop. cubic-exclusion), and the mixed-moment certificate '
                       '(Prop. mixed-certificate: Z_lambda positive definite and a strictly negative exact bound). Theory (the lemmas behind the '
                       'identities, the cubic classification, the 2-design identity, Weiner completion) is not decided.',
            'value': {'pair_residuals': residuals, 'cubic': cubic,
                      'mixed_c0': str(c0), 'mixed_sum_abs': str(s_abs), 'mixed_bound': str(bound), 'mixed_bound_decimal': '%.6e' % float(bound),
                      'mixed_residual_terms': len(red),
                      'not_reproduced': 'printed c0 = -613302797399911/6480 and sum|c_K| = 179721388988719/6480 depend on the program\'s coordinate '
                                        'priority lists I (05-verification.tex:31-34), which the text does not give; not decided here',
                      'runtime_s': round(time.time() - t0, 1)}}


def forge():
    """each must NOT certify"""
    out = []

    def f_c(P):
        P = dict(P)
        P['c'] = (3,) + tuple(P['c'][1:])
        return P
    r = decide(forge_pair=f_c, full_pair_rank=False)
    out.append(('pair certificate with c_1 = 3 instead of 2 (also false on the Fourier-family member)', r['verdict'], [c['check'][:70] for c in r['checks'] if not c['pass']]))

    def f_3(P):
        P = dict(P)
        P['three'] = 2
        return P
    r = decide(forge_pair=f_3, full_pair_rank=False)
    out.append(('pair certificate with weight 2 instead of 3 on <|L|^2> (a true consequence by positivity, but not a finite identity of the table)', r['verdict'], [c['check'][:70] for c in r['checks'] if not c['pass']]))

    def f_tab(tab):
        tab = list(tab)
        j, wj, N, U = tab[3]
        tab[3] = (j, wj, N, (U[0] + 1,) + U[1:])
        return tab
    r = decide(forge_table=f_tab, full_pair_rank=False)
    out.append(('cubic table: U_0 of row 3 printed 61 instead of 60', r['verdict'], [c['check'][:70] for c in r['checks'] if not c['pass']]))

    def f_Z(data):
        data = [list(rec) for rec in data]
        a = list(data[5][3])
        a[0] = -a[0]
        data[5][3] = a
        return [tuple(rec) for rec in data]
    r = decide(forge_data=f_Z, full_pair_rank=False)
    out.append(('Z_(5): first diagonal entry negated', r['verdict'], [c['check'][:70] for c in r['checks'] if not c['pass']]))

    def f_print(pr):
        pr = dict(pr)
        pr['mixed'] = (46041, 3429, 2768)
        return pr
    r = decide(forge_printed=f_print, full_pair_rank=False)
    out.append(('printed mixed witness count 2768 instead of 2767', r['verdict'], [c['check'][:70] for c in r['checks'] if not c['pass']]))
    return out


if __name__ == '__main__':
    t = time.time()
    res = decide()
    print('VERDICT', res['verdict'])
    print('DECIDES', res['decides'])
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    for k, v in res['value'].items():
        print(' ', k, v)
    for k, v in res['sources'].items():
        print('  sha256', v, k)
    print('runtime %.1fs' % (time.time() - t))
    t = time.time()
    for f in forge():
        print('FORGE', f)
    print('forges %.1fs' % (time.time() - t))
