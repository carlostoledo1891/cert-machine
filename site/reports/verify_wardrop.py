#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""verify_wardrop.py — a SELF-CONTAINED, STANDARD-LIBRARY-ONLY, independent verifier for
the multi-population Wardrop-equilibrium reproduction (Bakaryan, Aoun, de Lima Ribeiro, Hovakimyan,
Gomes, "Distributed Hessian-Riemannian flow for multi-population Wardrop equilibrium",
AIMS Mathematics 11(5):15143-15162, 2026; arXiv:2504.16028).

    Network:  Fig 1a / Table 1 edge order -- 10 nodes, 15 directed edges (a DAG), exits
              {8,10}. Entrances: node 1 (pop 1, cars) and node 9 (pop 2, trucks).
    S1  linear cost c_k = j1_k + j2_k          (validation; the total is a strictly convex QP)
    S2  c^r_k = 0.5(j1 + 2 j2) + 0.5 j^r        (cars + trucks, strictly monotone -> unique)
    S3  emission / speed-flow cost              (smooth nonlinear, "in the style of" the paper)

WHAT THIS SCRIPT IS.  A skeptical referee downloads THIS ONE FILE and runs

    python3 verify_wardrop.py

with nothing but a Python 3.9+ standard library.  It does not merely re-run the solver at a
tighter tolerance -- a converged iterate can only ever report a SMALL residual.  Instead it
closes three certificates that a floating-point iterate cannot:

  * S1  HONEST REFUSAL.  The equilibrium TOTAL is certified UNIQUE and exact (a min-norm QP
        solved over `fractions.Fraction`; Kirchhoff residual EXACTLY 0; every total > 0, so
        the positivity constraints are inactive and the point is THE optimum).  Its (4,7)
        total is 1940/37 = 52.43..., which rounds to 52 -- Table 1 prints 54 (the paper's one
        self-inconsistent row).  The per-population SPLIT, by contrast, is NON-unique: the
        split-conservation operator has a nontrivial EXACT null space (dimension reported,
        witness verified over Fraction), so the split direction lies in null(J) and we REFUSE
        to certify a unique split -- exactly as the JS interval battery's Krawczyk refuses.
  * S2  EXACT.  The support-KKT system is affine with dyadic-rational data, so it is solved
        EXACTLY over Fraction.  The Wardrop gap is EXACTLY 0, Kirchhoff is EXACTLY satisfied,
        support flows are > 0 and off-support slacks >= 0 -- including the degenerate tie
        (pop 2, edge (4,5)) whose slack is EXACTLY 0 (weak, not strict, complementarity; a tie
        interval arithmetic can never decide and exact arithmetic does).  The car/truck totals
        reproduce the published Figure 2 exactly.
  * S3  KRAWCZYK ENCLOSURE.  For the smooth nonlinear emission cost, a stdlib outward-rounded
        interval Krawczyk operator proves a locally unique KKT zero inside an explicit box of
        radius ~7.3e-13, with support flows > 0 and off-support slacks > 0 (STRICT
        complementarity) verified over the whole box.

The numerical CANDIDATES the verifier CONSUMES (the S2 support, the S3 support and float
Krawczyk center x0) are embedded below as CERTIFICATE DATA, produced by dump_wardrop.js from
the validated JS kernel.  This verifier does NOT trust them: it re-solves S2 exactly from the
support and RIGOROUSLY re-derives the S3 enclosure; a wrong support yields a negative flow or a
negative slack (S2) or a failure to contract (S3), i.e. a REFUSAL, never a false pass.  The
interval type and the Krawczyk operator are faithful, line-by-line ports of the JS source of
truth (eqcert/src/interval.js and the O7 battery test-wardrop-interval.js);
correctness is everything, so the port is cross-checked bit-for-bit against the JS radius by
test-crosslang-wardrop.py, and SIX falsifiers (X1..X6) must each turn their own target RED.

LICENCE
-------
SPDX-License-Identifier: MIT
Copyright (c) 2026 Carlos Toledo

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

Portions of this file (interval arithmetic and the Krawczyk operator) are ported from eqcert — MIT,
Copyright (c) 2026 Carlos Toledo — https://github.com/carlostoledo1891/mfg-lab/tree/main/eqcert

This FILE is MIT. The paper page that carries it is a separate work under CC-BY 4.0:
https://github.com/carlostoledo1891/mfg-lab/blob/main/enclosure/LICENSE.md
The SOLVER that produced the candidate this file verifies is not published and is not
licensed here. Logic hand-written, certificate data embedded (dump_wardrop.js).

NOTE FOR MAINTAINERS: unlike verify_congest.py, this file has NO `_verify_logic.py`
template and no `_gen_verifier.py` — it IS the source. Edit it here, then re-embed the
base64 in ../paper.html. Do not go looking for a generator; there isn't one.
"""
import sys
import math
from fractions import Fraction as Q

# ============================================================================================
# 0.  THE NETWORK (transcribed at source from docs/PAPER_FACTS.md sec 2 -- Fig 1a / Table 1)
# ============================================================================================
EDGES = [(1, 2), (2, 3), (9, 3), (2, 4), (3, 4), (3, 5), (4, 5), (4, 6),
         (5, 6), (3, 7), (4, 7), (5, 7), (6, 7), (7, 8), (7, 10)]
EXITS = (8, 10)
NE = len(EDGES)
# entrances: (node, inflow) per population, per scenario.  S1 is 100/100; S2,S3 are 100/50.
ENTR_S1 = ((1, 100), (9, 100))
ENTR_HET = ((1, 100), (9, 50))
# Table 1 published TOTAL flows (rounded integers), and Figure 2 published S2 flows.
TABLE1 = [100, 38, 100, 62, 24, 37, 12, 22, 10, 76, 54, 40, 31, 100, 100]
FIG2_CAR = [100, 43, 0, 57, 0, 12, 11, 14, 3, 32, 31, 20, 17, 50, 50]
FIG2_TRUCK = [0, 0, 50, 0, 13, 13, 0, 3, 3, 23, 10, 10, 7, 25, 25]
# S3 emission table (Table 4; a,b,w per species -- KEEP the negative b for HC/NOx).
EM = [[1.56e3, 3.54e1, 1.0321], [1.08e1, -7.11e-3, 12.91], [2.0, -4.49e-2, 14.54],
      [8.08e1, 1.16, 0.37], [4.78e3, 1.11e2, 0.02]]
# S3 ILLUSTRATIVE edge lengths (the shipped-kernel S3 lengths; Fig 3a's are disclosed as
# undetermined in PAPER_FACTS sec 5 -- S3 here reproduces the JS/O7 certificate, not a
# published-coordinate S3).  Embedded from the kernel.
SLEN = [1.6999999999999997, 3.2449961479175906, 3.848376280978772, 2.220360331117452, 4.0,
        1.9313207915827957, 3.758989225842501, 1.7999999999999994, 3.3000000000000007,
        4.1182520563948, 4.1182520563948, 2.2203603311174525, 2.690724809414742,
        2.280350850198275, 2.408318915758459]

# ============================================================================================
# 1.  CERTIFICATE DATA the verifier CONSUMES (embedded; produced by dump_wardrop.js).
#     S2/S3 supports = which edges carry flow per population (global edge indices).
#     S3_X0 = a float Krawczyk center (consumed, never trusted).
#     The *_REF values are the JS numbers the cross-language gate compares against.
# ============================================================================================
S2_SUPPORT = [[0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], [2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14]]
S3_SUPPORT = [[0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], [2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14]]

# S3 float Krawczyk center: theta on support edges, phi on incident nodes, keyed "pop:index".
S3_X0_THETA = {
    '0:0': 100.0, '0:1': 48.43570826523204, '0:3': 51.56429173476796, '0:4': 2.6205127448181478,
    '0:5': 13.218902047679626, '0:6': 10.180837638311466, '0:7': 13.721198638997882,
    '0:8': 3.1451903777517827, '0:9': 32.59629347273422, '0:10': 30.2827682022768,
    '0:11': 20.25454930823931, '0:12': 16.866389016749665, '0:13': 50.03707725859144,
    '0:14': 49.96292274140854, '1:2': 50.0, '1:4': 13.516900705105058, '1:5': 14.10945215554441,
    '1:7': 3.739191847777934, '1:8': 3.2137835221843596, '1:9': 22.37364713935051,
    '1:10': 9.777708857327122, '1:11': 10.895668633360053, '1:12': 6.952975369962295,
    '1:13': 25.111231775774293, '1:14': 24.8887682242256,
}
S3_X0_PHI = {
    '0:1': 118.80223072275322, '0:2': 67.44241219443822, '0:3': 42.819562148602515,
    '0:4': 41.343457909703204, '0:5': 36.10619434489453, '0:6': 34.40669074527773,
    '0:7': 25.842850507399056, '1:3': 28.251069806381565, '1:4': 20.995075854358394,
    '1:5': 20.88459338900472, '1:6': 18.89697639568982, '1:7': 15.028551522197162,
    '1:9': 54.79194333619927,
}

# S2 exact reference (from the JS BigInt solve) -- Python re-solves independently over Fraction
# and CROSS-CHECKS this; it is not required for the S2 certificate to close.
S2_THETA_REF = {
    '0:0': (100, 1), '0:1': (1600, 37), '0:3': (2100, 37), '0:4': (20, 111), '0:5': (1280, 111),
    '0:6': (420, 37), '0:7': (1580, 111), '0:8': (320, 111), '0:9': (3500, 111), '0:10': (1160, 37),
    '0:11': (20, 1), '0:12': (1900, 111), '0:13': (50, 1), '0:14': (50, 1), '1:2': (50, 1),
    '1:4': (40, 3), '1:5': (40, 3), '1:7': (10, 3), '1:8': (10, 3), '1:9': (70, 3), '1:10': (10, 1),
    '1:11': (10, 1), '1:12': (20, 3), '1:13': (25, 1), '1:14': (25, 1),
}
S2_PHI_REF = {
    '0:1': (10105, 37), '0:2': (6405, 37), '0:3': (4805, 37), '0:4': (4305, 37), '0:5': (105, 1),
    '0:6': (3655, 37), '0:7': (75, 1), '1:3': (25145, 222), '1:4': (6895, 74), '1:5': (175, 2),
    '1:6': (17995, 222), '1:7': (125, 2), '1:9': (41795, 222),
}

S2_KRAWCZYK_REF_RAD = 2.6432189770275727e-12
S3_KRAWCZYK_REF_RAD = 7.318590178329032e-13
S3_MINTH_REF = 2.6205127448180896
S3_MINSLACK_REF = 0.330051771604796
S1_SPLIT_MOVE_REF = 5.848273780272948

E47 = EDGES.index((4, 7))  # = 10
NODES_NONEXIT = sorted(set(n for e in EDGES for n in e) - set(EXITS))  # 1..7, 9
TOPO = [1, 9, 2, 3, 4, 5, 6, 7, 8, 10]

# ============================================================================================
# 2.  exact-rational linear algebra over fractions.Fraction  (DECIDES; resolves ties)
# ============================================================================================
def gauss_solve(A, b, n):
    """Exact Gaussian elimination over Fraction; returns x with A x = b (A n-by-n)."""
    M = [A[i][:] + [b[i]] for i in range(n)]
    for c in range(n):
        piv = next((r for r in range(c, n) if M[r][c] != 0), None)
        if piv is None:
            return None
        M[c], M[piv] = M[piv], M[c]
        pv = M[c][c]
        M[c] = [x / pv for x in M[c]]
        for r in range(n):
            if r != c and M[r][c] != 0:
                f = M[r][c]
                M[r] = [a - f * bb for a, bb in zip(M[r], M[c])]
    return [M[i][n] for i in range(n)]


def rref_nullspace(rows, ncols):
    """Exact RREF null space; returns basis (list of Fraction vectors, length ncols)."""
    M = [row[:] for row in rows]
    nr = len(M)
    pivots = []
    r = 0
    for c in range(ncols):
        piv = next((rr for rr in range(r, nr) if M[rr][c] != 0), None)
        if piv is None:
            continue
        M[r], M[piv] = M[piv], M[r]
        pv = M[r][c]
        M[r] = [x / pv for x in M[r]]
        for rr in range(nr):
            if rr != r and M[rr][c] != 0:
                f = M[rr][c]
                M[rr] = [a - f * b for a, b in zip(M[rr], M[r])]
        pivots.append(c)
        r += 1
        if r == nr:
            break
    free = [c for c in range(ncols) if c not in pivots]
    basis = []
    for fc in free:
        v = [Q(0)] * ncols
        v[fc] = Q(1)
        for pr, pc in enumerate(pivots):
            v[pc] = -M[pr][fc]
        basis.append(v)
    return basis


# ============================================================================================
# 3.  outward-rounded interval arithmetic  (port of eqcert/src/interval.js)
#     Each IEEE-754 +,-,*,/ is correctly rounded, so widening the computed bounds outward by
#     one ulp (nextDown low, nextUp high) rigorously encloses the exact real result.
# ============================================================================================
INF = math.inf
MIN_VALUE = 5e-324


def nextUp(x):
    if math.isnan(x) or x == INF:
        return x
    if x == 0.0:
        return MIN_VALUE
    return math.nextafter(x, INF)


def nextDown(x):
    return -nextUp(-x)


def iv(lo, hi=None):
    return (lo, lo if hi is None else hi)


IZERO = (0.0, 0.0)
IONE = (1.0, 1.0)


def iadd(a, b):
    return (nextDown(a[0] + b[0]), nextUp(a[1] + b[1]))


def isub(a, b):
    return (nextDown(a[0] - b[1]), nextUp(a[1] - b[0]))


def imul(a, b):
    p = (a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1])
    return (nextDown(min(p)), nextUp(max(p)))


def idiv(a, b):
    if b[0] <= 0 <= b[1]:
        raise ZeroDivisionError('interval division by an interval containing 0')
    q = (a[0] / b[0], a[0] / b[1], a[1] / b[0], a[1] / b[1])
    return (nextDown(min(q)), nextUp(max(q)))


def ineg(a):
    return (-a[1], -a[0])


def isqr(a):
    if a[0] >= 0:
        return (nextDown(a[0] * a[0]), nextUp(a[1] * a[1]))
    if a[1] <= 0:
        return (nextDown(a[1] * a[1]), nextUp(a[0] * a[0]))
    return (0.0, nextUp(max(a[0] * a[0], a[1] * a[1])))


def icube(a):
    return (nextDown(a[0] * a[0] * a[0]), nextUp(a[1] * a[1] * a[1]))


def imag(a):
    return max(abs(a[0]), abs(a[1]))


def iinterior(a, b):
    return b[0] < a[0] and a[1] < b[1]


# ============================================================================================
# 4.  graph / layout helpers (network only -- no solver)
# ============================================================================================
_OUT = {}
for _k, (_u, _v) in enumerate(EDGES):
    _OUT.setdefault(_u, []).append(_k)


def reach_edges(src):
    """DAG edge set reachable from an entrance (matches the kernel's reachEdges)."""
    seen, act, stack = {src}, set(), [src]
    while stack:
        u = stack.pop()
        for k in _OUT.get(u, []):
            if k not in act:
                act.add(k)
                v = EDGES[k][1]
                if v not in seen:
                    seen.add(v)
                    stack.append(v)
    return sorted(act)


def incid(nd, k):
    """+1 if edge k leaves nd, -1 if it enters nd, 0 otherwise."""
    return 1 if EDGES[k][0] == nd else -1 if EDGES[k][1] == nd else 0


def support_nodes(edges):
    """non-exit endpoints touched by a set of (support) edges, sorted."""
    nn = set()
    for k in edges:
        u, v = EDGES[k]
        if u not in EXITS:
            nn.add(u)
        if v not in EXITS:
            nn.add(v)
    return sorted(nn)


def build_layout(support, entr):
    """Support-KKT layout: per population a theta-block (support edges) and a phi-block
       (incident non-exit nodes).  Returns dict blocks + total size nx (identical ordering
       to the JS makeLayout, but derived here purely from the support + network)."""
    L = []
    nx = 0
    for pi in range(2):
        U = list(support[pi])
        nodes = support_nodes(U)
        L.append({'pi': pi, 'r': pi + 1, 'U': U, 'nodes': nodes,
                  'offTh': nx, 'offPhi': nx + len(U),
                  'entr': entr[pi][0], 'inflow': entr[pi][1]})
        nx += len(U) + len(nodes)
    return {'L': L, 'nx': nx}


# ============================================================================================
# 5.  S1 -- honest refusal: certify the TOTAL, refuse the SPLIT (all exact over Fraction)
# ============================================================================================
def bellman_exact(cost):
    """min cost-to-exit potentials over the DAG, exact (cost: dict edge->Fraction)."""
    phi = {e: Q(0) for e in EXITS}
    for u in reversed(TOPO):
        if u in EXITS:
            continue
        outs = [k for k in _OUT.get(u, []) if EDGES[k][1] in phi]
        if not outs:
            continue
        phi[u] = min(cost[k] + phi[EDGES[k][1]] for k in outs)
    return phi


def verify_S1():
    m = len(NODES_NONEXIT)
    K = [[incid(nd, e) for e in range(NE)] for nd in NODES_NONEXIT]
    B0 = [Q(100) if nd in (1, 9) else Q(0) for nd in NODES_NONEXIT]
    # min-norm QP for c = total:  T = K^T (K K^T)^{-1} B0  (the strictly convex potential)
    KKt = [[sum(Q(K[i][e]) * Q(K[j][e]) for e in range(NE)) for j in range(m)] for i in range(m)]
    y = gauss_solve(KKt, B0, m)
    T = [sum(Q(K[i][e]) * y[i] for i in range(m)) for e in range(NE)]
    kir = max(abs(sum(Q(K[i][e]) * T[e] for e in range(NE)) - B0[i]) for i in range(m))
    all_pos = all(t > 0 for t in T)                       # interior => positivity inactive => THE optimum
    e47 = T[E47]
    e47_round = round(float(e47))
    maxdev = max(abs(T[e] - TABLE1[e]) for e in range(NE))
    # equilibrium check: c = T; used edges (all T>0) must be tight -> Wardrop gap EXACTLY 0
    cost = {k: T[k] for k in range(NE)}
    phi = bellman_exact(cost)
    slacks = [T[k] + phi[EDGES[k][1]] - phi[EDGES[k][0]] for k in range(NE)]
    gap_num = sum(T[k] * slacks[k] for k in range(NE))
    used_tight = all(slacks[k] == 0 for k in range(NE))   # every edge carries flow => every edge tight

    # SPLIT non-uniqueness: exact null space of {K0 d0=0, K1 d1=0, d0[e]+d1[e]=0}.
    A0, A1 = reach_edges(1), reach_edges(9)
    vidx, col = {}, 0
    for e in A0:
        vidx[(0, e)] = col; col += 1
    for e in A1:
        vidx[(1, e)] = col; col += 1
    ncols = col
    rows = []
    for pi, A in ((0, A0), (1, A1)):
        for nd in support_nodes(A):
            row = [Q(0)] * ncols
            for e in A:
                s = incid(nd, e)
                if s:
                    row[vidx[(pi, e)]] = Q(s)
            rows.append(row)
    for e in range(NE):
        row = [Q(0)] * ncols
        has = False
        for pi in (0, 1):
            if (pi, e) in vidx:
                row[vidx[(pi, e)]] = Q(1); has = True
        if has:
            rows.append(row)
    basis = rref_nullspace(rows, ncols)
    split_nulldim = len(basis)
    witness_ok = False
    witness_edges = []
    if basis:
        d = basis[0]
        d0 = {e: d[vidx[(0, e)]] for e in A0}
        d1 = {e: d[vidx[(1, e)]] for e in A1}
        k0 = max((abs(sum(incid(nd, e) * d0[e] for e in A0)) for nd in support_nodes(A0)), default=Q(0))
        k1 = max((abs(sum(incid(nd, e) * d1[e] for e in A1)) for nd in support_nodes(A1)), default=Q(0))
        tot = max(abs(d0.get(e, Q(0)) + d1.get(e, Q(0))) for e in range(NE))
        nonzero = any(v != 0 for v in d)
        witness_ok = (k0 == 0 and k1 == 0 and tot == 0 and nonzero)
        witness_edges = [EDGES[e] for e in range(NE)
                         if d0.get(e, Q(0)) != 0 or d1.get(e, Q(0)) != 0]

    total_ok = (kir == 0 and all_pos and used_tight and gap_num == 0
                and e47 == Q(1940, 37) and e47_round == 52 and maxdev <= 2)
    split_refused = (split_nulldim >= 1 and witness_ok)
    return {
        'ok': total_ok and split_refused,
        'T': T, 'kir': kir, 'all_pos': all_pos, 'e47': e47, 'e47_round': e47_round,
        'table1_47': TABLE1[E47], 'maxdev': maxdev, 'gap_num': gap_num, 'used_tight': used_tight,
        'split_nulldim': split_nulldim, 'witness_ok': witness_ok, 'witness_edges': witness_edges,
        'total_ok': total_ok, 'split_refused': split_refused, 'K': K, 'B0': B0,
    }


# ============================================================================================
# 6.  S2 -- EXACT rational certificate (affine cost, dyadic data)
#     Cost written from the PAPER formula c^r = 0.5(j1 + 2 j2) + 0.5 j^r, i.e.
#       DC[r-1] = [d c^r / d j1 , d c^r / d j2] = [[1,1],[1/2,3/2]]     (r=1 cars, r=2 trucks).
#     NOT copied from the JS code -- the two independent exact solves must agree.
# ============================================================================================
DC = [[Q(1), Q(1)], [Q(1, 2), Q(3, 2)]]


def build_support_kkt(lay):
    """Exact affine support-KKT system A x = b over Fraction, plus column index maps."""
    L, nx = lay['L'], lay['nx']
    colTh = {}
    colPhi = {}
    for Lp in L:
        for a, gk in enumerate(Lp['U']):
            colTh[(Lp['pi'], gk)] = Lp['offTh'] + a
        for a, nd in enumerate(Lp['nodes']):
            colPhi[(Lp['pi'], nd)] = Lp['offPhi'] + a
    A = [[Q(0)] * nx for _ in range(nx)]
    b = [Q(0)] * nx
    e = 0
    for Lp in L:
        r = Lp['r']
        for gk in Lp['U']:
            u, v = EDGES[gk]
            # slack: DC[r-1][0]*J1[gk] + DC[r-1][1]*J2[gk] + phi_v - phi_u = 0
            for pj in (0, 1):
                if (pj, gk) in colTh:
                    A[e][colTh[(pj, gk)]] += DC[r - 1][pj]
            if v not in EXITS:
                A[e][colPhi[(Lp['pi'], v)]] += Q(1)
            if u not in EXITS:
                A[e][colPhi[(Lp['pi'], u)]] += Q(-1)
            e += 1
        for nd in Lp['nodes']:
            for a, gk in enumerate(Lp['U']):
                s = incid(nd, gk)
                if s:
                    A[e][Lp['offTh'] + a] += Q(s)
            b[e] = Q(Lp['inflow']) if nd == Lp['entr'] else Q(0)
            e += 1
    return A, b, colTh, colPhi


def verify_S2():
    lay = build_layout(S2_SUPPORT, ENTR_HET)
    L, nx = lay['L'], lay['nx']
    A, b, colTh, colPhi = build_support_kkt(lay)
    x = gauss_solve(A, b, nx)
    if x is None:
        return {'ok': False, 'why': 'singular exact system'}
    # (a) residual EXACTLY zero
    res_ok = all(sum(A[i][j] * x[j] for j in range(nx)) == b[i] for i in range(nx))
    # (b) support flows > 0 exactly
    theta = {(pi, gk): x[colTh[(pi, gk)]] for (pi, gk) in colTh}
    pos_ok = all(v > 0 for v in theta.values())
    # (c) full-network Kirchhoff per population, exact (independent of the solve's row order)
    B = {0: {1: Q(100)}, 1: {9: Q(50)}}
    kir_ok = True
    for pi in (0, 1):
        for nd in NODES_NONEXIT:
            s = sum(incid(nd, gk) * theta[(pi, gk)] for (p2, gk) in theta if p2 == pi and incid(nd, gk))
            if s != B[pi].get(nd, Q(0)):
                kir_ok = False
    # J totals on every edge (both populations)
    J = [[Q(0)] * NE, [Q(0)] * NE]
    for (pi, gk), v in theta.items():
        J[pi][gk] = v
    phi = {(pi, nd): x[colPhi[(pi, nd)]] for (pi, nd) in colPhi}

    def cR(r, gk):
        return DC[r - 1][0] * J[0][gk] + DC[r - 1][1] * J[1][gk]

    # (d) support slacks EXACTLY 0  =>  Wardrop gap numerator EXACTLY 0
    support_slack_ok = True
    gap_num = Q(0)
    for Lp in L:
        for gk in Lp['U']:
            u, v = EDGES[gk]
            pv = Q(0) if v in EXITS else phi[(Lp['pi'], v)]
            pu = Q(0) if u in EXITS else phi[(Lp['pi'], u)]
            slack = cR(Lp['r'], gk) + pv - pu
            gap_num += theta[(Lp['pi'], gk)] * slack
            if slack != 0:
                support_slack_ok = False
    # (e) off-support slacks >= 0 exactly (the tie pop2 (4,5) = 0 decided here)
    reach = [reach_edges(1), reach_edges(9)]
    off_ok = True
    tie_val = None
    min_off = None
    for Lp in L:
        for gk in reach[Lp['pi']]:
            if gk in Lp['U']:
                continue
            u, v = EDGES[gk]
            has_u = (u in EXITS) or ((Lp['pi'], u) in phi)
            has_v = (v in EXITS) or ((Lp['pi'], v) in phi)
            if not (has_u and has_v):
                continue                      # untouched endpoint: no potential constraint
            pv = Q(0) if v in EXITS else phi[(Lp['pi'], v)]
            pu = Q(0) if u in EXITS else phi[(Lp['pi'], u)]
            slack = cR(Lp['r'], gk) + pv - pu
            min_off = slack if min_off is None else min(min_off, slack)
            if Lp['pi'] == 1 and EDGES[gk] == (4, 5):
                tie_val = slack
            if slack < 0:
                off_ok = False
    # (f) car/truck totals reproduce Figure 2 exactly (rounded)
    car = [round(float(J[0][k])) for k in range(NE)]
    truck = [round(float(J[1][k])) for k in range(NE)]
    fig2_ok = (car == FIG2_CAR and truck == FIG2_TRUCK)
    # (g) cross-check the independent exact solve against the JS BigInt reference
    ref_ok = True
    for key, (n, d) in S2_THETA_REF.items():
        pi, gk = key.split(':')
        if theta.get((int(pi), int(gk))) != Q(n, d):
            ref_ok = False
    for key, (n, d) in S2_PHI_REF.items():
        pi, nd = key.split(':')
        if phi.get((int(pi), int(nd))) != Q(n, d):
            ref_ok = False

    ok = (res_ok and pos_ok and kir_ok and support_slack_ok and gap_num == 0
          and off_ok and fig2_ok and ref_ok and tie_val == 0)
    return {
        'ok': ok, 'res_ok': res_ok, 'pos_ok': pos_ok, 'kir_ok': kir_ok,
        'support_slack_ok': support_slack_ok, 'gap_num': gap_num, 'off_ok': off_ok,
        'tie_val': tie_val, 'min_off': min_off, 'fig2_ok': fig2_ok, 'ref_ok': ref_ok,
        'car': car, 'truck': truck, 'nx': nx, 'theta': theta, 'phi': phi,
        'lay': lay, 'colTh': colTh, 'colPhi': colPhi, 'A': A, 'b': b,
    }


# ============================================================================================
# 7.  S3 -- Krawczyk enclosure (smooth nonlinear emission cost), stdlib intervals
#     Interval cost/derivative ported from makeICost(scen=3) in test-wardrop-interval.js;
#     algebraically identical to the kernel cost  base = IA + IS50*(1 + 5 (jeff/50)^3),
#     M = SLEN*mult/2,  c^r = M*base + 0.5 j^r.
# ============================================================================================
def make_icost():
    IH = iv(0.5)
    IE3 = iv(1e-3)
    IA, IS = IZERO, IZERO
    for a, b, w in EM:
        wf = imul(iv(w), IE3)
        IA = iadd(IA, imul(wf, iv(b)))
        IS = iadd(IS, imul(wf, iv(a)))
    IS50 = idiv(IS, iv(50))

    def cost(k, IJ1, IJ2, r):
        jeff = iadd(IJ1, IJ2)
        g = idiv(jeff, iv(50))
        base = iadd(IA, imul(IS50, iadd(IONE, imul(iv(5), icube(g)))))
        M = idiv(imul(iv(SLEN[k]), iv(1.0 if r == 1 else 3.0)), iv(2))
        own = IJ1 if r == 1 else IJ2
        return iadd(imul(M, base), imul(IH, own))

    def dcost(k, IJ1, IJ2, r):
        jeff = iadd(IJ1, IJ2)
        g = idiv(jeff, iv(50))
        db = idiv(imul(imul(IS50, iv(15)), isqr(g)), iv(50))
        M = idiv(imul(iv(SLEN[k]), iv(1.0 if r == 1 else 3.0)), iv(2))
        d1 = iadd(imul(M, db), IH if r == 1 else IZERO)
        d2 = iadd(imul(M, db), IH if r == 2 else IZERO)
        return [d1, d2]
    return cost, dcost


def gsolve_float(M, b, n):
    """partial-pivot Gaussian elimination in float (port of the kernel gsolve)."""
    M = [row[:] for row in M]
    b = b[:]
    for k in range(n):
        p, mx = k, abs(M[k][k])
        for r in range(k + 1, n):
            if abs(M[r][k]) > mx:
                mx, p = abs(M[r][k]), r
        if p != k:
            M[k], M[p] = M[p], M[k]
            b[k], b[p] = b[p], b[k]
        piv = M[k][k] or 1e-300
        for r in range(k + 1, n):
            f = M[r][k] / piv
            for c in range(k, n):
                M[r][c] -= f * M[k][c]
            b[r] -= f * b[k]
    x = [0.0] * n
    for k in range(n - 1, -1, -1):
        s = b[k]
        for c in range(k + 1, n):
            s -= M[k][c] * x[c]
        x[k] = s / (M[k][k] or 1e-300)
    return x


def finv(Jm, n):
    Y = [[0.0] * n for _ in range(n)]
    for c in range(n):
        col = [0.0] * n
        col[c] = 1.0
        x = gsolve_float(Jm, col, n)
        for r in range(n):
            Y[r][c] = x[r]
    return Y


def evalFJ(cost, dcost, lay, X, wantJ):
    L, nx = lay['L'], lay['nx']
    IJ = [[IZERO] * NE, [IZERO] * NE]
    for Lp in L:
        for a, gk in enumerate(Lp['U']):
            IJ[Lp['pi']][gk] = X[Lp['offTh'] + a]
    F = [IZERO] * nx
    J = [[IZERO] * nx for _ in range(nx)] if wantJ else None
    e = 0
    for Lp in L:
        phiIdx = {nd: Lp['offPhi'] + a for a, nd in enumerate(Lp['nodes'])}

        def phiOf(nd):
            return IZERO if nd in EXITS else X[phiIdx[nd]]
        for gk in Lp['U']:
            u, v = EDGES[gk]
            F[e] = iadd(cost(gk, IJ[0][gk], IJ[1][gk], Lp['r']), isub(phiOf(v), phiOf(u)))
            if wantJ:
                d1, d2 = dcost(gk, IJ[0][gk], IJ[1][gk], Lp['r'])
                for Mq in L:
                    if gk in Mq['U']:
                        bcol = Mq['U'].index(gk)
                        J[e][Mq['offTh'] + bcol] = d1 if Mq['pi'] == 0 else d2
                if v not in EXITS:
                    J[e][phiIdx[v]] = IONE
                if u not in EXITS:
                    J[e][phiIdx[u]] = iv(-1.0)
            e += 1
        for nd in Lp['nodes']:
            s = iv(-(float(Lp['inflow']) if nd == Lp['entr'] else 0.0))
            for a, gk in enumerate(Lp['U']):
                kk = incid(nd, gk)
                if kk:
                    s = iadd(s, imul(iv(float(kk)), X[Lp['offTh'] + a]))
                    if wantJ:
                        J[e][Lp['offTh'] + a] = iv(float(kk))
            F[e] = s
            e += 1
    return F, J


def krawczyk(cost, dcost, lay, x0, maxRadCap=None):
    n = lay['nx']
    Xp = [iv(v) for v in x0]
    F0, _ = evalFJ(cost, dcost, lay, Xp, False)
    _, Jp = evalFJ(cost, dcost, lay, Xp, True)
    Jmid = [[(Jp[i][j][0] + Jp[i][j][1]) / 2 for j in range(n)] for i in range(n)]
    Y = finv(Jmid, n)
    if not all(math.isfinite(Y[i][j]) for i in range(n) for j in range(n)):
        return {'ok': False, 'why': 'singular midpoint Jacobian'}
    d = [IZERO] * n
    for i in range(n):
        s = IZERO
        for j in range(n):
            s = iadd(s, imul(iv(Y[i][j]), F0[j]))
        d[i] = s
    rad = [2 * imag(d[i]) + 1e-13 * max(1.0, abs(x0[i])) for i in range(n)]
    for rnd in range(12):
        X = [iv(nextDown(x0[i] - rad[i]), nextUp(x0[i] + rad[i])) for i in range(n)]
        _, JX = evalFJ(cost, dcost, lay, X, True)
        Kw = [None] * n
        ok = True
        maxRad = 0.0
        for i in range(n):
            acc = isub(iv(x0[i]), d[i])
            for j in range(n):
                s = IZERO
                for k2 in range(n):
                    if JX[k2][j][0] == 0 and JX[k2][j][1] == 0:
                        continue
                    s = iadd(s, imul(iv(Y[i][k2]), JX[k2][j]))
                mij = ineg(s)
                if i == j:
                    mij = iadd(IONE, mij)
                if mij[0] == 0 and mij[1] == 0:
                    continue
                acc = iadd(acc, imul(mij, isub(X[j], iv(x0[j]))))
            Kw[i] = acc
            if not iinterior(acc, X[i]):
                ok = False
            maxRad = max(maxRad, (acc[1] - acc[0]) / 2)
        if ok:
            return {'ok': True, 'box': X, 'Kbox': Kw, 'maxRad': maxRad, 'rounds': rnd + 1}
        for i in range(n):
            need = max(abs(Kw[i][0] - x0[i]), abs(Kw[i][1] - x0[i]))
            rad[i] = max(rad[i] * 2, need * 1.1 + 1e-15)
        if maxRadCap and max(rad) > maxRadCap:
            break
    return {'ok': False, 'why': 'no contraction'}


def s3_center(lay):
    x0 = [0.0] * lay['nx']
    for Lp in lay['L']:
        for a, gk in enumerate(Lp['U']):
            x0[Lp['offTh'] + a] = S3_X0_THETA['%d:%d' % (Lp['pi'], gk)]
        for a, nd in enumerate(Lp['nodes']):
            x0[Lp['offPhi'] + a] = S3_X0_PHI['%d:%d' % (Lp['pi'], nd)]
    return x0


def s3_verify_equilibrium(cost, lay, box):
    """support flows > 0 and off-support slacks > 0 over the Krawczyk box (strict compl.)."""
    L = lay['L']
    minTh = INF
    IJ = [[IZERO] * NE, [IZERO] * NE]
    for Lp in L:
        for a, gk in enumerate(Lp['U']):
            IJ[Lp['pi']][gk] = box[Lp['offTh'] + a]
            minTh = min(minTh, box[Lp['offTh'] + a][0])
    reach = [reach_edges(1), reach_edges(9)]
    minSlack = INF
    nOff = 0
    for Lp in L:
        phiIdx = {nd: Lp['offPhi'] + a for a, nd in enumerate(Lp['nodes'])}
        for gk in reach[Lp['pi']]:
            if gk in Lp['U']:
                continue
            u, v = EDGES[gk]
            pu = IZERO if u in EXITS else (box[phiIdx[u]] if u in phiIdx else None)
            pv = IZERO if v in EXITS else (box[phiIdx[v]] if v in phiIdx else None)
            if pu is None or pv is None:
                continue
            nOff += 1
            slack = iadd(cost(gk, IJ[0][gk], IJ[1][gk], Lp['r']), isub(pv, pu))
            minSlack = min(minSlack, slack[0])
    return minTh, minSlack, nOff


def verify_S3():
    lay = build_layout(S3_SUPPORT, ENTR_HET)
    cost, dcost = make_icost()
    x0 = s3_center(lay)
    res = krawczyk(cost, dcost, lay, x0)
    if not res['ok']:
        return {'ok': False, 'why': res.get('why'), 'nx': lay['nx']}
    minTh, minSlack, nOff = s3_verify_equilibrium(cost, lay, res['Kbox'])
    ok = (res['maxRad'] < 1e-9 and minTh > 0 and minSlack > 0)
    return {'ok': ok, 'maxRad': res['maxRad'], 'rounds': res['rounds'], 'nx': lay['nx'],
            'minTh': minTh, 'minSlack': minSlack, 'nOff': nOff}


# ============================================================================================
# 8.  FALSIFIERS (X1..X6) -- each MUST turn its own target RED (refuse); a verifier that
#     cannot go red is a fake certificate.
# ============================================================================================
def falsifier_X1():
    """outward rounding is load-bearing: a thin (no-widening) mul fails to enclose the exact
       product; the ported eqcert mul encloses all 4000/4000.  Reference = Fraction."""
    def selfTest(mulfn):
        seed = [20260723]

        def rng():
            seed[0] = (seed[0] * 1103515245 + 12345) & 0x7fffffff
            return seed[0] / 0x7fffffff
        for t in range(4000):
            a = (rng() - 0.5) * (1e6 if t % 3 else 1e-6)
            b = (rng() - 0.5) * (1e3 if t % 2 else 1e-3)
            if b == 0:
                b = 0.5
            r = mulfn((a, a), (b, b))
            ex = Q(a) * Q(b)
            if Q(r[0]) > ex or ex > Q(r[1]):
                return t
        return -1

    def thinMul(a, b):
        p = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]]
        return (min(p), max(p))
    good = selfTest(imul)
    bad = selfTest(thinMul)
    return good < 0 and bad >= 0, (good, bad)


def falsifier_X2(s2):
    """perturb one S2 support flow (+1) -> exact Kirchhoff residual != 0 (conservation broken)."""
    theta = dict(s2['theta'])
    key = (0, 1)                                   # pop1 (cars) on edge (2,3)
    theta[key] = theta[key] + Q(1)
    # node-2 balance for pop1: sum incid * theta  vs  B (=0, node 2 is not the entrance)
    nd = 2
    s = sum(incid(nd, gk) * theta[(pi, gk)] for (pi, gk) in theta if pi == 0 and incid(nd, gk))
    return s != 0, s


def falsifier_X3(s2):
    """corrupt one S2 potential -> a USED-edge complementarity slack != 0 (gap gains teeth)."""
    phi = dict(s2['phi'])
    key = (0, 3)                                   # pop1 potential at node 3
    phi[key] = phi[key] + Q(1)
    J = [[Q(0)] * NE, [Q(0)] * NE]
    for (pi, gk), v in s2['theta'].items():
        J[pi][gk] = v
    # recompute support slacks with the corrupted phi; at least one used edge must be nonzero
    worst = Q(0)
    for Lp in s2['lay']['L']:
        for gk in Lp['U']:
            u, v = EDGES[gk]
            pv = Q(0) if v in EXITS else phi.get((Lp['pi'], v), Q(0))
            pu = Q(0) if u in EXITS else phi.get((Lp['pi'], u), Q(0))
            slack = DC[Lp['r'] - 1][0] * J[0][gk] + DC[Lp['r'] - 1][1] * J[1][gk] + pv - pu
            if abs(slack) > abs(worst):
                worst = slack
    return worst != 0, worst


def falsifier_X4():
    """the wrong Table-1 value (4,7)=54 breaks node-4 Kirchhoff on the paper's own totals.
       (node-4 balance forces (4,7)=52; the printed 54 leaves residual +2)  [mirror ERRATA]."""
    idx = {e: EDGES.index(e) for e in [(2, 4), (3, 4), (4, 5), (4, 6), (4, 7)]}
    inflow = TABLE1[idx[(2, 4)]] + TABLE1[idx[(3, 4)]]           # 62 + 24 = 86
    otherOut = TABLE1[idx[(4, 5)]] + TABLE1[idx[(4, 6)]]         # 12 + 22 = 34
    forced = inflow - otherOut                                   # => 52
    residual_if_54 = 54 - forced                                 # +2 (nonzero) at the printed 54
    residual_if_52 = 52 - forced                                 # 0 at the certified 52
    return (forced == 52 and residual_if_54 != 0 and residual_if_52 == 0), residual_if_54


def falsifier_X5():
    """S3 with a WRONG active set (drop one support edge) -> Krawczyk refuses."""
    bad_support = [S3_SUPPORT[0][1:], list(S3_SUPPORT[1])]       # drop pop1 edge (2,3)
    lay = build_layout(bad_support, ENTR_HET)
    cost, dcost = make_icost()
    x0 = [0.0] * lay['nx']
    for Lp in lay['L']:
        for a, gk in enumerate(Lp['U']):
            x0[Lp['offTh'] + a] = S3_X0_THETA.get('%d:%d' % (Lp['pi'], gk), 1.0)
        for a, nd in enumerate(Lp['nodes']):
            x0[Lp['offPhi'] + a] = S3_X0_PHI.get('%d:%d' % (Lp['pi'], nd), 0.0)
    res = krawczyk(cost, dcost, lay, x0, maxRadCap=1.0)
    return (not res['ok']), res.get('why')


def falsifier_X6():
    """S3 with a MISMATCHED cost model (pre-fix: wT inside the speed AND no 1e-3 emission
       factor) is emission-dominated -> its equilibrium is elsewhere -> Krawczyk refuses."""
    IwT, IH = iv(2.0), iv(0.5)
    IA, IS = IZERO, IZERO
    for a, b, w in EM:                                           # NOTE: no 1e-3 factor
        IA = iadd(IA, imul(iv(w), iv(b)))
        IS = iadd(IS, imul(iv(w), iv(a)))
    IS50 = idiv(IS, iv(50))

    def cost(k, IJ1, IJ2, r):
        jeff = iadd(IJ1, imul(IwT, IJ2))                        # pre-fix: wT inside the speed
        g = idiv(jeff, iv(50))
        base = iadd(IA, imul(IS50, iadd(IONE, imul(iv(5), icube(g)))))
        M = idiv(imul(iv(SLEN[k]), iv(1.0 if r == 1 else 3.0)), iv(2))
        own = IJ1 if r == 1 else IJ2
        return iadd(imul(M, base), imul(IH, own))

    def dcost(k, IJ1, IJ2, r):
        jeff = iadd(IJ1, imul(IwT, IJ2))
        g = idiv(jeff, iv(50))
        db = idiv(imul(imul(IS50, iv(15)), isqr(g)), iv(50))
        M = idiv(imul(iv(SLEN[k]), iv(1.0 if r == 1 else 3.0)), iv(2))
        d1 = iadd(imul(M, db), IH if r == 1 else IZERO)
        d2 = iadd(imul(imul(M, db), IwT), IH if r == 2 else IZERO)
        return [d1, d2]
    lay = build_layout(S3_SUPPORT, ENTR_HET)
    x0 = s3_center(lay)
    res = krawczyk(cost, dcost, lay, x0, maxRadCap=50.0)
    return (not res['ok']), res.get('why')


# ============================================================================================
# 9.  driver / report
# ============================================================================================
def run():
    s1 = verify_S1()
    s2 = verify_S2()
    s3 = verify_S3()
    fx = {}
    fx['X1'], _ = falsifier_X1()
    fx['X2'], x2 = falsifier_X2(s2) if s2.get('ok') is not None and 'theta' in s2 else (False, None)
    fx['X3'], x3 = falsifier_X3(s2) if 'phi' in s2 else (False, None)
    fx['X4'], _ = falsifier_X4()
    fx['X5'], _ = falsifier_X5()
    fx['X6'], _ = falsifier_X6()
    fals_ok = all(fx.values())
    verified = bool(s1['ok'] and s2['ok'] and s3['ok'] and fals_ok)
    return {'s1': s1, 's2': s2, 's3': s3, 'fx': fx, 'fals_ok': fals_ok, 'verified': verified}


def _report(R):
    s1, s2, s3, fx = R['s1'], R['s2'], R['s3'], R['fx']
    L = []
    p = L.append
    p("=" * 88)
    p("  INDEPENDENT PYTHON VERIFIER  -  multi-population Wardrop equilibrium (Bakaryan-Gomes 2026)")
    p("  network: 10 nodes, 15 edges (DAG), exits {8,10}; pop1 @node1, pop2 @node9   (stdlib only)")
    p("=" * 88)
    p("")
    p("  S1  linear cost c = j1+j2  -->  CERTIFY the total, REFUSE the split (all exact over Fraction)")
    p("    equilibrium total is the min-norm QP optimum:  Kirchhoff residual = %s,  all totals > 0 : %s"
      % (str(s1['kir']), s1['all_pos']))
    p("    used edges all tight  => Wardrop gap numerator = %s  (EXACTLY 0)" % str(s1['gap_num']))
    p("    edge (4,7) total = %s = %.5f  -> rounds to %d   (Table 1 prints %d; the self-inconsistent row)"
      % (str(s1['e47']), float(s1['e47']), s1['e47_round'], s1['table1_47']))
    p("    max deviation vs published Table 1 = %s = %.4f   (<= 2 : its integer rounding)"
      % (str(s1['maxdev']), float(s1['maxdev'])))
    p("    SPLIT: exact null space of the split-conservation operator has DIMENSION %d (>= 1)"
      % s1['split_nulldim'])
    p("           witness verified (K0 d0=0, K1 d1=0, d0+d1=0, d!=0): %s  on edges %s"
      % (s1['witness_ok'], ', '.join('(%d,%d)' % e for e in s1['witness_edges'])))
    p("       ==> the split direction lies in null(J): REFUSE to certify a unique split")
    p("           (JS reseeds move the split by ~%.2f while the total is fixed -- corroborates)" % S1_SPLIT_MOVE_REF)
    p("    S1 verdict: %s" % ('total CERTIFIED + split REFUSED' if s1['ok'] else 'FAILED'))
    p("")
    p("  S2  cars+trucks c^r = 0.5(j1+2j2)+0.5 j^r  -->  EXACT rational certificate (n=%d unknowns)" % s2['nx'])
    p("    support-KKT solved over Fraction:  residual == 0 : %s     support flows > 0 : %s"
      % (s2['res_ok'], s2['pos_ok']))
    p("    Kirchhoff EXACT (both populations, whole network) : %s" % s2['kir_ok'])
    p("    support slacks == 0  =>  Wardrop gap = %s  (EXACTLY 0, not a small residual)" % str(s2['gap_num']))
    p("    off-support slacks >= 0 : %s     degenerate tie pop2 (4,5) slack = %s  (EXACT weak complementarity)"
      % (s2['off_ok'], str(s2['tie_val'])))
    p("    car/truck totals reproduce published Figure 2 EXACTLY : %s" % s2['fig2_ok'])
    p("    independent exact solve == JS BigInt reference : %s" % s2['ref_ok'])
    p("    S2 verdict: %s" % ('CERTIFIED EXACTLY' if s2['ok'] else 'FAILED'))
    p("")
    p("  S3  emission / speed-flow cost (smooth NONLINEAR)  -->  KRAWCZYK enclosure (n=%d)" % s3.get('nx', 0))
    if s3['ok']:
        p("    interval Krawczyk contraction: unique KKT zero in a box of max radius %.3e (%d round)"
          % (s3['maxRad'], s3['rounds']))
        p("    support flows > 0 over the box : min inf theta = %.4f" % s3['minTh'])
        p("    off-support slacks > 0 (STRICT complementarity) : min inf slack = %.4f over %d edge(s)"
          % (s3['minSlack'], s3['nOff']))
        p("    S3 verdict: CERTIFIED (existence + local uniqueness, smooth-nonlinear multi-population)")
    else:
        p("    S3 did NOT certify: %s" % s3.get('why'))
    p("")
    p("  falsifiers (each MUST refuse - a certificate that cannot go RED is fake):")
    names = {
        'X1': 'outward rounding load-bearing: thin mul fails to enclose vs exact rational',
        'X2': 'perturbed S2 flow: exact Kirchhoff residual != 0 (conservation has teeth)',
        'X3': 'corrupted S2 potential: a used-edge slack != 0 (the gap has teeth)',
        'X4': 'wrong Table-1 (4,7)=54: node-4 Kirchhoff residual = +2 != 0',
        'X5': 'S3 wrong active set (drop a support edge): Krawczyk refuses',
        'X6': 'S3 mismatched cost model (pre-fix emission-dominated): Krawczyk refuses',
    }
    for key in ['X1', 'X2', 'X3', 'X4', 'X5', 'X6']:
        p("    %s  %s  %s" % ('RED ok ' if fx[key] else 'FAIL   ', key, names[key]))
    p("")
    p("-" * 88)
    if R['verified']:
        p("  S1 total certified + split refused (exact); S2 gap EXACTLY 0 (exact rational);")
        p("  S3 enclosed by a rigorous interval Krawczyk contraction; every falsifier refused.")
        p("  No tolerance was tuned to close.")
        p("")
        p("  WARDROP REPRODUCTION: VERIFIED")
    else:
        reasons = []
        if not s1['ok']:
            reasons.append('S1 (total/split)')
        if not s2['ok']:
            reasons.append('S2 (exact certificate)')
        if not s3['ok']:
            reasons.append('S3 (Krawczyk)')
        if not R['fals_ok']:
            reasons.append('a falsifier failed to refuse')
        p("  WARDROP REPRODUCTION: REFUSED  -  " + '; '.join(reasons))
    p("-" * 88)
    return "\n".join(L)


def _json(R):
    s1, s2, s3 = R['s1'], R['s2'], R['s3']
    return {
        'verified': R['verified'],
        's1': {'ok': s1['ok'], 'e47_num': s1['e47'].numerator, 'e47_den': s1['e47'].denominator,
               'e47_round': s1['e47_round'], 'kir_zero': (s1['kir'] == 0),
               'gap_zero': (s1['gap_num'] == 0), 'split_nulldim': s1['split_nulldim'],
               'split_refused': s1['split_refused'], 'maxdev_num': s1['maxdev'].numerator,
               'maxdev_den': s1['maxdev'].denominator},
        's2': {'ok': s2['ok'], 'gap_zero': (s2['gap_num'] == 0), 'tie_zero': (s2['tie_val'] == 0),
               'fig2_ok': s2['fig2_ok'], 'ref_ok': s2['ref_ok'], 'car': s2['car'], 'truck': s2['truck']},
        's3': {'ok': s3['ok'], 'maxRad': s3.get('maxRad'), 'minTh': s3.get('minTh'),
               'minSlack': s3.get('minSlack'), 'nOff': s3.get('nOff')},
        'falsifiers': R['fx'],
    }


def main():
    R = run()
    if '--json' in sys.argv:
        import json
        print(json.dumps(_json(R)))
    else:
        print(_report(R))
    return 0 if R['verified'] else 1


if __name__ == '__main__':
    sys.exit(main())
