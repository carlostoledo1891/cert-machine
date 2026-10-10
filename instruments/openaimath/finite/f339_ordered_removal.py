"""F-339 -- "Polynomial removal fails for ordered binary matrices" (openai/math family 190).

THE CLAIM (build/sections/01-introduction.tex:33-47, Theorem thm:main): there is a fixed binary 66 x 66 matrix H such
that for every h >= 1, with n_h = (386h+2)2^h and eps_h = (386h+2)^-2, a binary n_h x n_h matrix A_h has
dist_H(A_h) >= eps_h and N_H(A_h)/n_h^132 <= eps_h 2^-h; hence no polynomial removal bound c eps^C n^(2k) exists
for this H.  N_H counts ORDERED copies (rows r_1<..<r_k, columns c_1<..<c_k, A(r_i,c_j) = H(i,j) for all i,j, zeros
included); dist_H is the least number of changed cells, over n^2, that makes A H-free (01-introduction.tex:4-22).
H and A_h are given entry by entry in build/sections/02-construction.tex:9-202 (eq:pattern-definition, the tree
orders eq:tree-orders, the modes eq:body-modes, the entry rules and eq:variable-entries).

WHAT IS DECIDED HERE, exactly (integers and bitmasks only; nothing from the release is run):
  C. THE CONSTRUCTION, built from the LaTeX: S, H, and A_h position by position for h = 1, 2 (776 x 776 and
     3,096 x 3,096); the entry table checked free of conflicting assignments; the printed orders n_1 = 776,
     n_2 = 3,096 and n = d_h m, d_h = 6hs + 2h + 2 = 386h + 2; the four order equivalences (eq:tree-orders)
     checked on the built axis orders for h = 1..5; the leaf-diagonal entry 1[p <= q].
  L. THE FINITE LEMMAS of 03-pinning.tex: Lemma lem:anchor-properties (distinct rows and columns, at most one zero
     in the first 32 rows / columns, >= 58 ones per row, >= 48 per column, the 32 five-bit words); Lemma
     lem:mode-incidences (each variable position in at most four modes' designated sets, at most four ones against
     the anchor groups) for h = 1..6; Lemma lem:nonanchor-traces (non-anchor rows realize at most 27 < 32 words on
     any five non-anchor columns) for h = 1..3, by exhausting every 5-set of column blocks.
  N. THE COUNT N_H(A_h), EXACTLY, for h = 1 and h = 2, by this decider's own search, not by the paper's lemmas.
     Reduction (proved here, used as a lemma): if two consecutive positions of A have identical rows, an ordered
     copy of a pattern with pairwise distinct rows uses at most one of them (two copy rows in one run would force
     two equal pattern rows), and the runs are intervals, so ordered copies of H in A are exactly ordered copies of
     H in the quotient Q (one representative per maximal run of identical consecutive rows / columns) times the
     product of the run lengths used.  H's rows and columns are checked pairwise distinct.  Q is 389 x 389 at h = 1
     and 779 x 779 at h = 2.  In Q every ordered copy is found by a row-by-row depth-first search that keeps, for
     each pattern column, the bitmask of Q columns still consistent with the rows placed, and prunes when no
     increasing column chain exists (greedy earliest chain = exact existence test); at a full row placement the
     columns are counted by a weighted chain DP.  Also every ordered copy of the anchor S alone is enumerated the
     same way, which decides Lemma lem:anchor-rigidity at h = 1, 2 (each copy of S uses one mode's 64 groups).
     Proposition prop:copy-count is decided at h = 1, 2: every copy maps pattern entry (65,65) into the leaf
     diagonal L_h (the trimmed chain set of pattern column 65 is checked to be the partner leaf column of the
     placed leaf row).  The exact count is N_H(A_h) = 2 m^130 (2^131 at h = 1, 2^261 at h = 2), and the theorem's
     inequality N_H(A_h)/n^132 <= eps_h 2^-h is compared exactly.  Remark rem:hitting-not-repair is decided at
     h = 1: zeroing the m cells of L_1 leaves a matrix that still contains H (the search finds the new copies).
  D. THE DISTANCE dist_H(A_h) >= eps_h, for h = 1..6, through the paper's sampling argument with every finite step
     checked mechanically: for each leaf z the selected classes (all anchor and dummy groups, the blocks of the
     ancestors of z, the shared leaf), the protected cells (an anchor or dummy position, or both root-level), and,
     per mode, every ordered body of selected positions; the 66 x 66 submatrix of every such body is checked equal
     to H off the four body cells using A's protected entries; the body constraints "not P" over the free cells are
     checked UNSATISFIABLE by an exact DPLL (and by full enumeration at h = 1, 5 free cells).  For every pair of
     row/column blocks with a protected cell, Pr(both positions selected) is computed exactly (Fraction) and
     checked <= 1/m^2.  Union bound: fewer than m^2 changed cells miss some selection's protected cells, whose
     forced bodies then give a copy of H; so every H-free matrix differs from A_h in at least m^2 cells and
     dist_H(A_h) >= m^2/n^2 = d_h^-2 = eps_h.

WHAT IS NOT DECIDED: the theorem for every h (the headline "no polynomial bound" needs the whole infinite family; it
rests on the paper's uniform proofs of Sections 3-4, which are checked here only at h = 1, 2 for the count and
h <= 6 for the distance); Corollary cor:canonical-testing (sampling lower bound); the literature claims.
"""
import itertools
import os
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

D = 'preprints/Polynomial-removal-fails-for-ordered-binary-matrices-September-25-2026/build/sections/'
INTRO, CONS, PIN, COUNT, DIST = (D + f for f in ('01-introduction.tex', '02-construction.tex', '03-pinning.tex',
                                                  '03b-count.tex', '04-distance.tex'))
s = 64
K = 66


# ---------------------------------------------------------------- the pattern
def eta(b, a):
    return (a // 2 ** (5 - b)) % 2


def build_S(flip=None):
    S = [[0] * (s + 1) for _ in range(s + 1)]          # 1-based
    for u in range(1, s + 1):
        for v in range(1, s + 1):
            if 33 <= u <= 64 and 60 <= v <= 64:
                S[u][v] = eta(v - 59, u - 33)
            else:
                S[u][v] = int(u != v)
    if flip:
        u, v = flip
        S[u][v] ^= 1
    return S


def build_H(S):
    H = [[0] * K for _ in range(K)]                     # 0-based
    for u in range(1, s + 1):
        for v in range(1, s + 1):
            H[u - 1][v - 1] = S[u][v]
        H[u - 1][64] = int(u == 1)
        H[u - 1][65] = int(u == 2)
    for v in range(1, s + 1):
        H[64][v - 1] = int(v == 1)
        H[65][v - 1] = int(v == 2)
    H[64][64], H[64][65], H[65][64], H[65][65] = 1, 0, 1, 1
    return H


# ---------------------------------------------------------------- the host A_h, by blocks
def modes(h):
    out = []
    for i in range(1, h + 1):
        out += [('V', i, '+'), ('V', i, '-'), ('W', i, 0, '+'), ('W', i, 1, '+'), ('W', i, 0, '-'), ('W', i, 1, '-')]
    return out


def roles(t):
    """(R1, R2, C1, C2) of eq:body-modes; a class is ('*',) or (depth, sign) or (depth, sign, parity)"""
    if t[0] == 'V':
        i, sg = t[1], t[2]
        if sg == '+':
            return (i, '+'), (i - 1, '+'), ('*',), (i - 1, '+')
        return (i - 1, '-'), (i, '-'), ('*',), (i - 1, '-')
    i, d, sg = t[1], t[2], t[3]
    if sg == '+':
        return (i, '+', d), ('*',), (i - 1, '+'), (i, '+', d)
    return (i, '-', d), ('*',), (i, '-', d), (i - 1, '-')


def in_class(block, cls, h):
    """is a non-anchor block in a role class"""
    if cls == ('*',):
        return block[0] == 'dum'
    if block[0] == 'dum' or block[0] == 'anc':
        return False
    i, sg = cls[0], cls[1]
    par = cls[2] if len(cls) == 3 else None
    if block[0] == 'leaf':
        ok = i == h
        p = block[1]
    else:
        ok = block[1] == i and block[2] == sg and i < h
        p = block[3]
    return ok and (par is None or p % 2 == par)


def axis_blocks(h, axis):
    """blocks in axis order with sizes; axis 'R' (rows) or 'C' (columns)"""
    m = 2 ** h
    out = []
    for t in modes(h):
        for u in range(1, s + 1):
            out.append((('anc', t, u), m))
    var = []

    def rec(i, p):
        if i == h:
            var.append((('leaf', p), 1))
            return
        first, last = ('-', '+') if axis == 'R' else ('+', '-')
        var.append((('var', i, first, p), m // 2 ** i))
        rec(i + 1, 2 * p)
        rec(i + 1, 2 * p + 1)
        var.append((('var', i, last, p), m // 2 ** i))
    rec(0, 0)
    if axis == 'R':
        out += var + [(('dum',), m)]
    else:
        out += [(('dum',), m)] + var
    return out


def reps(block, h):
    if block[0] == 'leaf':
        return [(h, '+', block[1]), (h, '-', block[1])]
    return [(block[1], block[2], block[3])]


def entry(rb, cb, h, S, variant=None):
    """A_h on a (row block, column block) pair; asserts the table has no conflicting assignment"""
    if rb[0] == 'anc' and cb[0] == 'anc':
        return S[rb[2]][cb[2]] if rb[1] == cb[1] else 0
    if rb[0] == 'anc':
        t, u = rb[1], rb[2]
        R1, R2, C1, C2 = roles(t)
        js = [j for j, cl in ((1, C1), (2, C2)) if in_class(cb, cl, h)]
        assert len(js) <= 1, 'a column in both role sets'
        return int(bool(js) and u == js[0])
    if cb[0] == 'anc':
        t, v = cb[1], cb[2]
        R1, R2, C1, C2 = roles(t)
        js = [j for j, cl in ((1, R1), (2, R2)) if in_class(rb, cl, h)]
        assert len(js) <= 1, 'a row in both role sets'
        return int(bool(js) and v == js[0])
    if rb[0] == 'dum' or cb[0] == 'dum':
        return 1
    vals = set()
    for (i, sg, p) in reps(rb, h):
        for (i2, sg2, q) in reps(cb, h):
            if sg == sg2 == '+' and i2 == i:
                vals.add(int(p <= q))
            if sg == sg2 == '-' and i2 == i and i < h:
                vals.add(int(p <= q) if variant == 'minus-le' else int(p < q))
            if sg == sg2 == '+' and i >= 1 and i2 == i - 1:
                vals.add(int(p // 2 <= q))
            if sg == sg2 == '-' and i >= 1 and i2 == i - 1:
                vals.add(int(p // 2 < q))
    assert len(vals) <= 1, 'conflicting assignments in eq:variable-entries'
    return vals.pop() if vals else 0


def build_A(h, S, variant=None):
    """the full n x n matrix as row bitmasks (bit c = column c), plus the block of every position"""
    RB, CB = axis_blocks(h, 'R'), axis_blocks(h, 'C')
    rpos = [b for b, sz in RB for _ in range(sz)]
    cpos = [b for b, sz in CB for _ in range(sz)]
    n = len(rpos)
    assert n == len(cpos)
    cmask = {}
    off = 0
    for b, sz in CB:
        cmask[b] = ((1 << sz) - 1) << off
        off += sz
    rowval = {}
    for rb, _ in RB:
        x = 0
        for cb, _ in CB:
            if entry(rb, cb, h, S, variant):
                x |= cmask[cb]
        rowval[rb] = x
    rows = [rowval[b] for b in rpos]
    return rows, rpos, cpos, n


def transpose(rows, n):
    cols = [0] * n
    for r, x in enumerate(rows):
        bit = 1 << r
        while x:
            low = x & -x
            cols[low.bit_length() - 1] |= bit
            x ^= low
    return cols


def runs(vecs):
    """maximal runs of identical consecutive vectors: list of (start, length)"""
    out = []
    i = 0
    while i < len(vecs):
        j = i
        while j + 1 < len(vecs) and vecs[j + 1] == vecs[i]:
            j += 1
        out.append((i, j - i + 1))
        i = j + 1
    return out


def quotient(rows, n):
    cols = transpose(rows, n)
    rr, cr = runs(rows), runs(cols)
    creps = [a for a, _ in cr]
    Q = []
    for a, _ in rr:
        x = rows[a]
        y = 0
        for k, c in enumerate(creps):
            if (x >> c) & 1:
                y |= 1 << k
        Q.append(y)
    return Q, rr, cr


# ---------------------------------------------------------------- ordered-copy search in the quotient
def search(Q, nc, rmult, cmult, P, on_copy=None, budget=None):
    """every ordered copy of pattern P (list of 0/1 rows) in Q; returns (weighted count, copies in Q, nodes).
    on_copy(rho, sets) receives the row placement and, per pattern column, the bitmask of Q columns lying on at
    least one full increasing chain."""
    k = len(P)
    kc = len(P[0])
    full = (1 << nc) - 1
    zeros = [full ^ x for x in Q]
    nr = len(Q)
    ones_j = [[j for j in range(kc) if P[i][j]] for i in range(k)]
    zero_j = [[j for j in range(kc) if not P[i][j]] for i in range(k)]
    state = {'count': 0, 'copies': 0, 'nodes': 0}

    def earliest(cand):
        prev = -1
        out = []
        for j in range(kc):
            x = cand[j] >> (prev + 1)
            if not x:
                return None
            prev += (x & -x).bit_length()
            out.append(prev)
        return out

    def latest(cand):
        nxt = nc
        out = [0] * kc
        for j in range(kc - 1, -1, -1):
            x = cand[j] & ((1 << nxt) - 1)
            if not x:
                return None
            nxt = x.bit_length() - 1
            out[j] = nxt
        return out

    def finish(rho, cand):
        lo, hi = earliest(cand), latest(cand)
        sets = []
        for j in range(kc):
            a = lo[j - 1] + 1 if j else 0
            b = hi[j + 1] if j + 1 < kc else nc
            sets.append(cand[j] & ((1 << b) - 1) & ~((1 << a) - 1))
        # weighted chain count
        prev = None
        for j in range(kc):
            cur = {}
            acc = 0
            x = sets[j]
            pcols = sorted(prev) if prev is not None else None
            pi = 0
            while x:
                low = x & -x
                c = low.bit_length() - 1
                x ^= low
                if prev is None:
                    w = cmult[c]
                else:
                    while pi < len(pcols) and pcols[pi] < c:
                        acc += prev[pcols[pi]]
                        pi += 1
                    w = cmult[c] * acc
                if w:
                    cur[c] = w
            prev = cur
        ncol = sum(prev.values())
        wr = 1
        for r in rho:
            wr *= rmult[r]
        state['count'] += wr * ncol
        if ncol:
            state['copies'] += 1
            if on_copy:
                on_copy(list(rho), sets)

    def dfs(i, start, cand, rho):
        state['nodes'] += 1
        if budget and state['nodes'] > budget:
            raise RuntimeError('search budget exceeded')
        if i == k:
            finish(rho, cand)
            return
        oj, zj = ones_j[i], zero_j[i]
        for r in range(start, nr - (k - i) + 1):
            o, z = Q[r], zeros[r]
            new = list(cand)
            dead = False
            for j in oj:
                v = new[j] & o
                if not v:
                    dead = True
                    break
                new[j] = v
            if dead:
                continue
            for j in zj:
                v = new[j] & z
                if not v:
                    dead = True
                    break
                new[j] = v
            if dead or earliest(new) is None:
                continue
            rho.append(r)
            dfs(i + 1, r + 1, new, rho)
            rho.pop()

    dfs(0, 0, [full] * kc, [])
    return state['count'], state['copies'], state['nodes']


def count_H(h, S, H, variant=None, zero_leaf_diagonal=False):
    rows, rpos, cpos, n = build_A(h, S, variant)
    m = 2 ** h
    if zero_leaf_diagonal:
        rleaf = {b[1]: r for r, b in enumerate(rpos) if b[0] == 'leaf'}
        cleaf = {b[1]: c for c, b in enumerate(cpos) if b[0] == 'leaf'}
        for p in range(m):
            rows[rleaf[p]] &= ~(1 << cleaf[p])
    Q, rr, cr = quotient(rows, n)
    rmult = [ln for _, ln in rr]
    cmult = [ln for _, ln in cr]
    rblock = [rpos[a] for a, _ in rr]
    cblock = [cpos[a] for a, _ in cr]
    off_leaf = []

    def on_copy(rho, sets):
        rb = rblock[rho[64]]
        x = sets[64]
        cs = []
        while x:
            low = x & -x
            cs.append(cblock[low.bit_length() - 1])
            x ^= low
        if not (rb[0] == 'leaf' and all(c == ('leaf', rb[1]) for c in cs)):
            off_leaf.append((rb, cs))
    N, ncopies, nodes = search(Q, len(cr), rmult, cmult, H, on_copy)
    return dict(n=n, N=N, copies_in_Q=ncopies, nodes=nodes, off_leaf=off_leaf, Q=(len(rr), len(cr)),
                rows=rows, rpos=rpos, cpos=cpos, Qm=Q, rmult=rmult, cmult=cmult, rblock=rblock, cblock=cblock)


def count_S(data, S):
    """every ordered copy of the anchor S in A_h, through the same quotient; returns the modes used"""
    P = [[S[u][v] for v in range(1, s + 1)] for u in range(1, s + 1)]
    used = []
    rblock, cblock = data['rblock'], data['cblock']

    def on_copy(rho, sets):
        rmodes = set(rblock[r][1] if rblock[r][0] == 'anc' else None for r in rho)
        cm = set()
        groups_ok = all(rblock[r] == ('anc', rblock[rho[0]][1], u + 1) for u, r in enumerate(rho))
        for j in range(s):
            x = sets[j]
            while x:
                low = x & -x
                cb = cblock[low.bit_length() - 1]
                cm.add(cb[1] if cb[0] == 'anc' else None)
                groups_ok = groups_ok and cb == ('anc', rblock[rho[0]][1], j + 1)
                x ^= low
        used.append((tuple(rmodes), tuple(cm), groups_ok))
    N, ncopies, nodes = search(data['Qm'], len(data['cmult']), data['rmult'], data['cmult'], P, on_copy)
    return N, ncopies, nodes, used


# ---------------------------------------------------------------- the distance argument
def selected(h, z, axis):
    """the selected blocks for leaf z: all anchors and the dummy, the ancestors' blocks, the shared leaf"""
    sel = []
    for b, sz in axis_blocks(h, axis):
        if b[0] in ('anc', 'dum'):
            sel.append(b)
        elif b[0] == 'leaf':
            if b[1] == z:
                sel.append(b)
        elif b[3] == z >> (h - b[1]):
            sel.append(b)
    return sel


def protected(rb, cb):
    if rb[0] in ('anc', 'dum') or cb[0] in ('anc', 'dum'):
        return True
    return rb[0] == 'var' and cb[0] == 'var' and rb[1] == 0 and cb[1] == 0


def dpll(clauses):
    """clauses: list of lists of (var, forbidden value); a clause is satisfied when some var differs from its
    forbidden value.  Returns True if satisfiable."""
    def simplify(cl, var, val):
        out = []
        for c in cl:
            if any(v == var and f != val for v, f in c):
                continue
            nc_ = [(v, f) for v, f in c if v != var]
            if not nc_:
                return None
            out.append(nc_)
        return out

    def solve(cl):
        if not cl:
            return True
        for c in cl:
            if len(c) == 1:
                v, f = c[0]
                nxt = simplify(cl, v, 1 - f)
                return nxt is not None and solve(nxt)
        v, f = cl[0][0]
        for val in (1 - f, f):
            nxt = simplify(cl, v, val)
            if nxt is not None and solve(nxt):
                return True
        return False
    return solve(clauses)


def distance_core(h, S, H, variant=None, brute=False):
    """for every leaf z: the clause system over the free cells is unsatisfiable, and every clause's 66 x 66
    submatrix equals H off its body.  Returns (all_unsat, submatrices_ok, n_clauses_max, n_vars_max)."""
    m = 2 ** h
    RB, CB = axis_blocks(h, 'R'), axis_blocks(h, 'C')
    rord = {b: i for i, (b, _) in enumerate(RB)}
    cord = {b: i for i, (b, _) in enumerate(CB)}
    all_unsat, sub_ok, ncl, nv = True, True, 0, 0
    for z in range(m):
        rs, cs = selected(h, z, 'R'), selected(h, z, 'C')
        clauses = []
        const_hit = False
        for t in modes(h):
            R1, R2, C1, C2 = roles(t)
            r1s = [b for b in rs if b[0] not in ('anc',) and in_class(b, R1, h)]
            r2s = [b for b in rs if b[0] not in ('anc',) and in_class(b, R2, h)]
            c1s = [b for b in cs if b[0] not in ('anc',) and in_class(b, C1, h)]
            c2s = [b for b in cs if b[0] not in ('anc',) and in_class(b, C2, h)]
            arows = [('anc', t, u) for u in range(1, s + 1)]
            for r1, r2, c1, c2 in itertools.product(r1s, r2s, c1s, c2s):
                if not (rord[r1] < rord[r2] and cord[c1] < cord[c2]):
                    continue
                # the 66 x 66 submatrix on anchors of t + body, off the body: protected cells, equal to H
                rr = arows + [r1, r2]
                cc = arows + [c1, c2]
                assert all(rord[a] < rord[b] for a, b in zip(rr, rr[1:])) and all(cord[a] < cord[b] for a, b in zip(cc, cc[1:]))
                for i, rb in enumerate(rr):
                    for j, cb in enumerate(cc):
                        if i >= 64 and j >= 64:
                            continue
                        if not protected(rb, cb) or entry(rb, cb, h, S, variant) != H[i][j]:
                            sub_ok = False
                clause = []
                sat_const = False
                for (rb, cb), f in (((r1, c1), 1), ((r1, c2), 0), ((r2, c1), 1), ((r2, c2), 1)):
                    if protected(rb, cb):
                        if entry(rb, cb, h, S, variant) != f:
                            sat_const = True
                    else:
                        clause.append(((rb, cb), f))
                if sat_const:
                    continue
                if not clause:
                    const_hit = True          # a body of A itself on protected cells: a copy in every B
                    continue
                clauses.append(clause)
        variables = sorted(set(v for c in clauses for v, _ in c))
        ncl, nv = max(ncl, len(clauses)), max(nv, len(variables))
        if const_hit:
            continue
        if dpll(clauses):
            all_unsat = False
        if brute and len(variables) <= 16:
            idx = {v: i for i, v in enumerate(variables)}
            for bits in range(2 ** len(variables)):
                if all(any(((bits >> idx[v]) & 1) != f for v, f in c) for c in clauses):
                    all_unsat = False
    return all_unsat, sub_ok, ncl, nv


def selection_probabilities(h):
    """exact Pr(row position and column position both selected), for every block pair with a protected cell;
    returns the maximum.  All anchor groups behave alike (always selected, size m), so one anchor group per axis
    stands for all of them; every other block is enumerated."""
    m = 2 ** h
    RB, CB = axis_blocks(h, 'R'), axis_blocks(h, 'C')
    selr = [set(selected(h, z, 'R')) for z in range(m)]
    selc = [set(selected(h, z, 'C')) for z in range(m)]
    a_r = [x for x in RB if x[0][0] == 'anc'][:1]
    a_c = [x for x in CB if x[0][0] == 'anc'][:1]
    RB = a_r + [x for x in RB if x[0][0] != 'anc']
    CB = a_c + [x for x in CB if x[0][0] != 'anc']
    best = Fraction(0)
    for rb, rsz in RB:
        for cb, csz in CB:
            if not protected(rb, cb):
                continue
            pr = sum(Fraction(1, m) * (Fraction(1, rsz) if rb in selr[z] else 0) * (Fraction(1, csz) if cb in selc[z] else 0)
                     for z in range(m))
            best = max(best, pr)
    return best


# ---------------------------------------------------------------- finite lemmas
def anchor_properties(S):
    rows = [tuple(S[u][1:]) for u in range(1, s + 1)]
    cols = [tuple(S[u][v] for u in range(1, s + 1)) for v in range(1, s + 1)]
    out = {}
    out['distinct rows and columns'] = len(set(rows)) == s and len(set(cols)) == s
    out['at most one zero per column in rows 1..32, per row in columns 1..32'] = (
        all(sum(1 - S[u][v] for u in range(1, 33)) <= 1 for v in range(1, s + 1)) and
        all(sum(1 - S[u][v] for v in range(1, 33)) <= 1 for u in range(1, s + 1)))
    out['every row >= 58 ones, every column >= 48 ones'] = (min(sum(r) for r in rows) >= 58 and min(sum(c) for c in cols) >= 48)
    words = [tuple(S[u][v] for v in range(60, 65)) for u in range(33, 65)]
    out['rows 33..64 on columns 60..64 are the 32 five-bit words'] = len(set(words)) == 32
    return out, min(sum(r) for r in rows), min(sum(c) for c in cols)


def tree_orders_ok(h):
    RB, CB = axis_blocks(h, 'R'), axis_blocks(h, 'C')
    ro = {b: i for i, (b, _) in enumerate(RB)}
    co = {b: i for i, (b, _) in enumerate(CB)}

    def rblk(i, sg, p):
        return ('leaf', p) if i == h else ('var', i, sg, p)
    ok = True
    for i in range(1, h + 1):
        for p in range(2 ** i):
            for a in range(2 ** (i - 1)):
                ok &= (ro[rblk(i, '+', p)] < ro[rblk(i - 1, '+', a)]) == (p // 2 <= a)
                ok &= (ro[rblk(i - 1, '-', a)] < ro[rblk(i, '-', p)]) == (p // 2 >= a)
                ok &= (co[rblk(i - 1, '+', a)] < co[rblk(i, '+', p)]) == (p // 2 >= a)
                ok &= (co[rblk(i, '-', p)] < co[rblk(i - 1, '-', a)]) == (p // 2 <= a)
    return ok


def mode_incidences(h, S):
    worst_modes, worst_ones = 0, 0
    for axis in ('R', 'C'):
        for b, _ in axis_blocks(h, axis):
            if b[0] not in ('var', 'leaf'):
                continue
            cnt = 0
            for t in modes(h):
                R1, R2, C1, C2 = roles(t)
                sets = (R1, R2) if axis == 'R' else (C1, C2)
                cnt += any(in_class(b, cl, h) for cl in sets)
            ones = 0
            for ob, _ in axis_blocks(h, 'C' if axis == 'R' else 'R'):
                if ob[0] == 'anc':
                    ones += entry(b, ob, h, S) if axis == 'R' else entry(ob, b, h, S)
            worst_modes, worst_ones = max(worst_modes, cnt), max(worst_ones, ones)
    return worst_modes, worst_ones


def nonanchor_traces(h, S):
    rbs = [b for b, _ in axis_blocks(h, 'R') if b[0] != 'anc']
    cbs = [b for b, _ in axis_blocks(h, 'C') if b[0] != 'anc']
    col = {cb: tuple(entry(rb, cb, h, S) for rb in rbs) for cb in cbs}
    worst = 0
    for five in itertools.combinations(cbs, 5):
        words = set(tuple(col[cb][i] for cb in five) for i in range(len(rbs)))
        worst = max(worst, len(words))
    return worst, len(cbs)


# ---------------------------------------------------------------- the decider
def decide(src=None, flip=None, variant=None, printed_n1=776, printed_n2=3096, count_hs=(1, 2), dist_hs=range(1, 7)):
    src = src or Sources()
    checks = []
    t0 = time.time()
    intro, cons = src.text(INTRO), src.text(CONS)
    pin, cnt, dist = src.text(PIN), src.text(COUNT), src.text(DIST)
    check(checks, 'the theorem and the construction as printed',
          'n_h=(386h+2)2^h' in intro.replace(' ', '') and '\\epsilon_h2^{-h}' in intro.replace(' ', '') and
          'd_h=6hs+2h+2=386h+2' in cons.replace(' ', '') and '\\eta_{v-59}(u-33)' in cons and
          'N_H(A_h)\\leqmn^{2k-2}' in cnt.replace(' ', '') and 'leastm^2entries' in dist.replace(' ', '').replace('$', ''),
          '01-introduction.tex:33-47, 02-construction.tex:11-37, 159-162, 03b-count.tex:16-21, 04-distance.tex:12-17')
    S = build_S(flip)
    H = build_H(S)
    props, minr, minc = anchor_properties(S)
    for name, ok in props.items():
        check(checks, 'L. Lemma lem:anchor-properties: ' + name, ok, 'min row ones %d, min column ones %d' % (minr, minc))
    check(checks, 'N. H has pairwise distinct rows and pairwise distinct columns (needed for the run reduction)',
          len(set(map(tuple, H))) == K and len(set(zip(*H))) == K)
    # sizes
    ok_n = all(len(axis_blocks(h, 'R')) and sum(sz for _, sz in axis_blocks(h, 'R')) == (386 * h + 2) * 2 ** h ==
               sum(sz for _, sz in axis_blocks(h, 'C')) and 6 * h * s + 2 * h + 2 == 386 * h + 2 for h in range(1, 7))
    check(checks, 'C. n = d_h m with d_h = 6hs + 2h + 2 = 386h + 2, on both axes, h = 1..6', ok_n)
    check(checks, 'C. the printed orders n_1 = 776 and n_2 = 3,096',
          sum(sz for _, sz in axis_blocks(1, 'R')) == printed_n1 and sum(sz for _, sz in axis_blocks(2, 'R')) == printed_n2,
          'computed %d, %d; printed %d, %d' % (sum(sz for _, sz in axis_blocks(1, 'R')), sum(sz for _, sz in axis_blocks(2, 'R')), printed_n1, printed_n2))
    check(checks, 'C. the four order equivalences eq:tree-orders hold on the built axis orders, h = 1..5',
          all(tree_orders_ok(h) for h in range(1, 6)))
    try:
        for h in (1, 2, 3):
            RB, CB = axis_blocks(h, 'R'), axis_blocks(h, 'C')
            for rb, _ in RB:
                for cb, _ in CB:
                    entry(rb, cb, h, S, variant)
        conflict_free = True
    except AssertionError:
        conflict_free = False
    check(checks, 'C. the entry rules assign every cell once (no conflicting assignment), h = 1, 2, 3', conflict_free)
    leaf_ok = all(entry(('leaf', p), ('leaf', q), h, S, variant) == int(p <= q) for h in (1, 2, 3) for p in range(2 ** h) for q in range(2 ** h))
    check(checks, 'C. the entry between leaf blocks p, q is 1[p <= q]', leaf_ok)
    mi = [mode_incidences(h, S) for h in range(1, 7)]
    check(checks, 'L. Lemma lem:mode-incidences: every variable position lies in <= 4 modes\' designated sets and has '
          '<= 4 ones against the anchor groups, h = 1..6', all(a <= 4 and b <= 4 for a, b in mi), str(mi))
    tr = [nonanchor_traces(h, S) for h in (1, 2, 3)]
    check(checks, 'L. Lemma lem:nonanchor-traces: on every 5 non-anchor column blocks the non-anchor rows realize '
          '<= 27 < 32 words, h = 1..3', all(w <= 27 for w, _ in tr), 'max words %s (non-anchor column blocks %s)' % ([w for w, _ in tr], [c for _, c in tr]))
    value = {}
    # counts
    for h in count_hs:
        m = 2 ** h
        dh = 386 * h + 2
        t1 = time.time()
        data = count_H(h, S, H, variant)
        n = data['n']
        value['h=%d' % h] = {'n': n, 'quotient': data['Q'], 'N_H': data['N'], 'N_H = 2 m^130': data['N'] == 2 * m ** 130,
                             'copies in quotient': data['copies_in_Q'], 'search nodes': data['nodes'], 'seconds': round(time.time() - t1, 1)}
        check(checks, 'N. h = %d: every ordered copy of H in A_%d maps entry (65,65) into the leaf diagonal L_%d '
              '(Prop prop:copy-count)' % (h, h, h), data['N'] > 0 and not data['off_leaf'],
              '%d copies in the %d x %d quotient, N_H = %s, off-leaf placements %d' % (data['copies_in_Q'], data['Q'][0], data['Q'][1], data['N'], len(data['off_leaf'])))
        check(checks, 'N. h = %d: N_H(A_%d) <= m n^(2k-2) (eq:copy-bound)' % (h, h), data['N'] <= m * n ** (2 * K - 2))
        check(checks, 'N. h = %d: N_H(A_%d) / n^132 <= eps_h 2^-h, exactly (the theorem\'s count inequality)' % (h, h),
              data['N'] * dh ** 2 * 2 ** h <= n ** (2 * K), 'N_H = 2^%d' % (data['N'].bit_length() - 1) if data['N'] & (data['N'] - 1) == 0 else str(data['N']))
        if h <= 2:
            NS, nS, nodesS, used = count_S(data, S)
            one_mode = all(len(rm) == 1 and len(cm) == 1 and rm == cm and None not in rm and g for rm, cm, g in used)
            check(checks, 'N. h = %d: Lemma lem:anchor-rigidity: every ordered copy of S uses the 64 row and 64 column '
                  'groups of one mode, in order' % h, one_mode and nS == len(modes(h)) and NS == len(modes(h)) * m ** 128,
                  '%d copies of S in the quotient (%d modes), weighted count %s m^128' % (nS, len(modes(h)), Fraction(NS, m ** 128)))
        if h == 1:
            z = count_H(h, S, H, variant, zero_leaf_diagonal=True)
            check(checks, 'N. h = 1: Remark rem:hitting-not-repair: after the m cells of L_1 are set to 0 (which meets every '
                  'original copy), H still occurs, and no new copy puts (65,65) on L_1',
                  z['N'] > 0 and len(z['off_leaf']) == z['copies_in_Q'],
                  'N_H after the change = %s (= 2^%d), entry (65,65) now at %s' % (z['N'], z['N'].bit_length() - 1, sorted(set(str(c) for _, c in z['off_leaf']))))
            value['h=1']['N_H after zeroing L_1'] = z['N']
        del data
    # distance
    dres = []
    for h in dist_hs:
        m = 2 ** h
        unsat, subok, ncl, nv = distance_core(h, S, H, variant, brute=(h == 1))
        pmax = selection_probabilities(h)
        dres.append((h, unsat, subok, ncl, nv, pmax))
    check(checks, 'D. every forced body completes the selected anchors to H (66 x 66 submatrix = H off the body, on '
          'protected cells), h = %d..%d' % (dist_hs[0], dist_hs[-1]), all(r[2] for r in dres))
    check(checks, 'D. for every leaf z the "no body equals P" constraints over the free cells are UNSATISFIABLE, '
          'h = %d..%d (exact DPLL; full enumeration at h = 1)' % (dist_hs[0], dist_hs[-1]), all(r[1] for r in dres),
          'max clauses / free cells per z: %s' % [(r[0], r[3], r[4]) for r in dres])
    check(checks, 'D. every protected cell is a selected pair with probability <= 1/m^2 (exact), h = %d..%d' % (dist_hs[0], dist_hs[-1]),
          all(r[5] is None or r[5] <= Fraction(1, 4 ** r[0]) for r in dres),
          str([(r[0], str(r[5])) for r in dres if r[5] is not None]))
    check(checks, 'D. hence dist_H(A_h) >= m^2/n^2 = (386h+2)^-2 = eps_h, h = %d..%d' % (dist_hs[0], dist_hs[-1]),
          all(r[1] and r[2] and (r[5] is None or r[5] <= Fraction(1, 4 ** r[0])) for r in dres) and
          all(Fraction(4 ** h, ((386 * h + 2) * 2 ** h) ** 2) == Fraction(1, (386 * h + 2) ** 2) for h in dist_hs))
    ok = all(c['pass'] for c in checks)
    value['runtime_s'] = round(time.time() - t0, 1)
    refuting = not ok and checks[0]['pass'] and flip is None and variant is None
    verdict = 'CERTIFIED' if ok else ('REFUTED' if refuting else 'REFUSED')
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: Theorem thm:main at h = 1 and h = 2 (A_1 776 x 776, A_2 3,096 x 3,096), both '
                       'inequalities decided exactly (N_H(A_h) = 2 m^130 by an exhaustive ordered-copy search; '
                       'dist_H(A_h) >= eps_h by the sampling argument with every finite step checked, for h <= 6), and '
                       'the finite lemmas of Section 3; the theorem for every h (the headline) rests on the paper\'s '
                       'uniform proofs and is not decided here'}


def forge():
    out = []
    r = decide(flip=(40, 61), count_hs=(1,), dist_hs=range(1, 3))
    out.append(('S(40,61) flipped (two five-bit words collide)', r['verdict']))
    r = decide(variant='minus-le', count_hs=(1,), dist_hs=range(1, 3))
    out.append(('eq:variable-entries line 2 printed as 1[p <= q] instead of 1[p < q]', r['verdict']))
    r = decide(printed_n1=777, count_hs=(), dist_hs=range(1, 2))
    out.append(('the printed order n_1 = 777', r['verdict']))
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
