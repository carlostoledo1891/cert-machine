#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""facelaw.py — the face-dimension theorem for two-population network games,
decided in exact rationals.  instruments/facelaw · cert-machine

THE OBJECT.  Two populations enter a directed network at entrances a and b and
drain at exit nodes.  When the cost is class-independent, the equilibrium is a
FACE — a positive-dimensional set of flow splits the equilibrium conditions
cannot distinguish — and its exact tangent dimension is

    k = |shared| - rank(M),

where `shared` is the set of edges reachable by BOTH populations and M stacks
both populations' conservation (Kirchhoff) rows restricted to those edges.

THE THEOREM (TERRA-PORT item 7; origin conjecture in sin-mfg/research/geometry/
face_general.py, settled on the frontier bench, EVIDENCE REBUILT HERE — the
origin wrote no record).  The distinct nonzero rows of M are exactly the
incidence rows of the shared subgraph at its non-exit nodes; directed-incidence
rank per weakly connected component c is |T_c| - 1 when c contains no exit and
|T_c| - e_c... collapsing to the closed form

    k = |shared| - cons + z,

cons = #(non-exit nodes touched by shared edges), z = #(components of the
shared subgraph containing NO exit node).  COROLLARY: the combinatorial
shortcut k ?= |shared| - cons is correct iff z = 0, and UNDERCOUNTS by exactly
z otherwise.

This module is authored fresh (both prior implementations read, no bytes
copied): the exact null-space computation over stdlib Fractions is the
authority; the theorem's combinatorial formula is the claim measured against
it.  SCOPE, so nothing downstream overclaims: this is combinatorics on the
constraint matrices — exact over Q, NOT an enclosure; it locates the dimension
of the set the equilibrium lives in, never the equilibrium.

SPDX-License-Identifier: MIT — Copyright (c) 2026 Carlos Toledo
"""
from fractions import Fraction as F


def reach(edges, entrance):
    """Indices of edges reachable (directed) from the entrance."""
    out = {}
    for i, (u, v) in enumerate(edges):
        out.setdefault(u, []).append(i)
    act, seen, stack = [], set(), [entrance]
    nodes = {entrance}
    while stack:
        u = stack.pop()
        for i in out.get(u, []):
            if i in seen:
                continue
            seen.add(i)
            act.append(i)
            v = edges[i][1]
            if v not in nodes:
                nodes.add(v)
                stack.append(v)
    return sorted(act)


def kirchhoff(edges, act, exits):
    """Conservation rows (one per non-exit touched node) over the active edges."""
    nodes = set()
    for i in act:
        nodes.update(edges[i])
    rows = sorted(n for n in nodes if n not in exits)
    ri = {n: r for r, n in enumerate(rows)}
    K = [[F(0)] * len(act) for _ in rows]
    for c, i in enumerate(act):
        u, v = edges[i]
        if u in ri:
            K[ri[u]][c] = F(1)
        if v in ri:
            K[ri[v]][c] = F(-1)
    return K


def rank_and_nullity(M, ncols):
    """Exact rank over Q by fraction-free-enough Gauss (stdlib Fractions)."""
    A = [row[:] for row in M]
    r = 0
    for c in range(ncols):
        p = next((i for i in range(r, len(A)) if A[i][c] != 0), None)
        if p is None:
            continue
        A[r], A[p] = A[p], A[r]
        inv = F(1) / A[r][c]
        A[r] = [x * inv for x in A[r]]
        for i in range(len(A)):
            if i != r and A[i][c] != 0:
                f = A[i][c]
                A[i] = [a - f * b for a, b in zip(A[i], A[r])]
        r += 1
        if r == len(A):
            break
    return r, ncols - r


def face(edges, exits, ea, eb):
    """The exact face dimension (null space over Q) + the shortcut's prediction."""
    a1, a2 = reach(edges, ea), reach(edges, eb)
    shared = sorted(set(a1) & set(a2))
    if not shared:
        return {'k': 0, 'shared': 0, 'rank': 0, 'shortcut': 0, 'agree': True}
    K1 = kirchhoff(edges, a1, exits)
    K2 = kirchhoff(edges, a2, exits)
    i1 = {e: c for c, e in enumerate(a1)}
    i2 = {e: c for c, e in enumerate(a2)}
    M = [[row[i1[e]] for e in shared] for row in K1] \
        + [[row[i2[e]] for e in shared] for row in K2]
    rk, k = rank_and_nullity(M, len(shared))
    nodes = set()
    for e in (edges[i] for i in shared):
        nodes.update(e)
    cons = len([n for n in nodes if n not in exits])
    shortcut = len(shared) - cons
    return {'k': k, 'shared': len(shared), 'rank': rk,
            'cons': cons, 'shortcut': shortcut, 'agree': k == shortcut}


def components(edge_list):
    """Weakly connected components of a set of edges, as node sets."""
    adj = {}
    for u, v in edge_list:
        adj.setdefault(u, set()).add(v)
        adj.setdefault(v, set()).add(u)
    seen, comps = set(), []
    for s in adj:
        if s in seen:
            continue
        comp, stack = set(), [s]
        while stack:
            n = stack.pop()
            if n in comp:
                continue
            comp.add(n)
            seen.add(n)
            stack.extend(adj[n] - comp)
        comps.append(comp)
    return comps


def theorem_k(edges, exits, ea, eb):
    """k by the THEOREM (pure combinatorics): shared - cons + z."""
    shared = sorted(set(reach(edges, ea)) & set(reach(edges, eb)))
    if not shared:
        return {'k': 0, 'shared': 0, 'cons': 0, 'z': 0}
    sh_edges = [edges[i] for i in shared]
    nodes = set()
    for e in sh_edges:
        nodes.update(e)
    cons = len([n for n in nodes if n not in exits])
    z = sum(1 for comp in components(sh_edges) if not (comp & set(exits)))
    return {'k': len(shared) - cons + z, 'shared': len(shared), 'cons': cons, 'z': z}


# ---------------------------------------------------------------------------------
# ensembles.  The ORIGIN ensemble replays the frontier bench's seeded generator
# call-for-call (seed 20260901) so its published failure count is a REPLICATION,
# not a quotation; the FRESH ensemble uses this port's own seed so the theorem is
# also tested on networks nobody chose after seeing results.
# ---------------------------------------------------------------------------------
def random_instance(rng):
    n = rng.randint(4, 11)
    m = rng.randint(n - 1, min(2 * n + 4, n * (n - 1)))
    edges = []
    seen = set()
    for _ in range(m):
        u, v = rng.randint(1, n), rng.randint(1, n)
        if u == v or (u, v) in seen:
            continue
        seen.add((u, v))
        edges.append((u, v))
    if len(edges) < 2:
        return None
    nodes = sorted({x for e in edges for x in e})
    exits = set(rng.sample(nodes, k=min(len(nodes), rng.randint(1, 2))))
    non_exit = [x for x in nodes if x not in exits]
    if len(non_exit) < 2:
        return None
    ea, eb = rng.sample(non_exit, 2)
    return edges, exits, ea, eb


def run_ensemble(seed, count):
    import random
    rng = random.Random(seed)
    stats = {'tested': 0, 'formulaAgrees': True, 'corollaryBothWays': True,
             'shortcutWrong': 0, 'zPositive': 0}
    failures = []
    for t in range(count):
        inst = random_instance(rng)
        if inst is None:
            continue
        edges, exits, ea, eb = inst
        stats['tested'] += 1
        r = face(edges, exits, ea, eb)
        th = theorem_k(edges, exits, ea, eb)
        if r['k'] != th['k']:
            stats['formulaAgrees'] = False
        if (r['k'] != r['shortcut']) != (th['z'] > 0):
            stats['corollaryBothWays'] = False
        if not r['agree']:
            stats['shortcutWrong'] += 1
            failures.append({'edges': [list(e) for e in edges], 'exits': sorted(exits),
                             'ea': ea, 'eb': eb, 'k': r['k'], 'shortcut': r['shortcut'],
                             'z': th['z'], 'deficit': r['k'] - r['shortcut']})
        if th['z'] > 0:
            stats['zPositive'] += 1
    return stats, failures


def cycle_family(Lmax=8):
    """The constructed counterexample family: an exit-free shared L-cycle forces
       z >= 1 and the shortcut undercounts by exactly z."""
    rows = []
    for L in range(3, Lmax + 1):
        cyc = [(100 + i, 100 + (i + 1) % L) for i in range(L)]
        edges = [(1, 100), (2, 100), (1, 3), (2, 3), (3, 4)] + cyc
        r = face(edges, {4}, 1, 2)
        th = theorem_k(edges, {4}, 1, 2)
        rows.append({'L': L, 'k': r['k'], 'shortcut': r['shortcut'], 'z': th['z'],
                     'formulaExact': r['k'] == th['k'],
                     'deficitIsZ': r['k'] - r['shortcut'] == th['z']})
    return rows


ORIGIN_EDGES = [(1, 2), (2, 3), (9, 3), (2, 4), (3, 4), (3, 5), (4, 5), (4, 6), (5, 6),
                (3, 7), (4, 7), (5, 7), (6, 7), (7, 8), (7, 10)]
ORIGIN = {'edges': ORIGIN_EDGES, 'exits': {8, 10}, 'ea': 1, 'eb': 9}
