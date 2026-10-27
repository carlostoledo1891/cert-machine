#!/usr/bin/env python3
# graphon_k4_aut.py — a PROPOSER of automorphisms of a step graphon's block matrix (written 2026-10-27 by an AI agent for
# the C_89 (K4) replay). It is never an authority: instruments/optq/graphon-k4-second.js re-verifies every proposed
# permutation exactly (R[s(i)][s(j)] == R[i][j] for all i, j) before the second implementation uses it, and the first
# implementation (graphon_k4.c) uses no symmetry at all. Standard library + numpy.
"""Propose generators of the automorphism group of a symmetric integer matrix R (blocks i, j; value R_ij).

Method: colour refinement on the complete graph with edge colours R_ij (a vertex's new colour is its old colour and
the sorted multiset of (colour of j, R_ij)) gives an equitable partition; for each cell, the first vertex is
individualized against each other vertex of the cell not yet in its orbit and both sides are refined (and
individualized again, first branch only) to a discrete partition, which defines a candidate permutation; a candidate
is kept only if it preserves R exactly. Generators are then pruned greedily while the orbits they generate on blocks
do not change (the orbits on blocks are what the second implementation uses; it also takes orbits on ordered pairs
from the same generators).

usage: graphon_k4_aut.py construction.json.gz out.json
"""
import gzip, hashlib, json, sys, time
import numpy as np


def main():
    raw = open(sys.argv[1], 'rb').read()
    d = json.loads(gzip.decompress(raw) if sys.argv[1].endswith('.gz') else raw)
    R = np.array(d['red_probability_numerators'], dtype=np.int64)
    m = R.shape[0]
    assert np.array_equal(R, R.T)
    _, Rv = np.unique(R, return_inverse=True)
    Rv = Rv.reshape(m, m).astype(np.int64); nv = int(Rv.max()) + 1

    def refine(col):
        ncol = len(np.unique(col))
        while True:
            key = col[None, :] * nv + Rv
            key.sort(axis=1)
            sig = np.concatenate([col[:, None], key], axis=1)
            _, inv = np.unique(sig, axis=0, return_inverse=True)
            inv = inv.ravel()
            if inv.max() + 1 == ncol:
                return inv
            col, ncol = inv, inv.max() + 1

    def individualize(col, v):
        c = col.copy() * 2; c[v] += 1
        return refine(c)

    def candidate(a, b):
        while True:
            cs = np.bincount(a)
            if cs.max() == 1:
                p = np.empty(m, dtype=np.int64); p[np.argsort(a)] = np.argsort(b); return p
            cell = int(np.argmax(cs > 1))
            na = individualize(a, int(np.nonzero(a == cell)[0][0])); nb = individualize(b, int(np.nonzero(b == cell)[0][0]))
            if not np.array_equal(np.bincount(na), np.bincount(nb)):
                return None
            a, b = na, nb

    def orbits(gens):
        parent = list(range(m))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]; x = parent[x]
            return x
        for g in gens:
            for x in range(m):
                rx, ry = find(x), find(int(g[x]))
                if rx != ry: parent[rx] = ry
        return sorted(sorted(o) for o in _groups([find(x) for x in range(m)]))

    t0 = time.time()
    c0 = refine(np.zeros(m, dtype=np.int64))
    gens = []
    for cell in range(int(c0.max()) + 1):
        mem = np.nonzero(c0 == cell)[0]
        orb = orbits(gens); where = {v: k for k, o in enumerate(orb) for v in o}
        for w in mem[1:]:
            if where[int(w)] == where[int(mem[0])]:
                continue
            p = candidate(individualize(c0, int(mem[0])), individualize(c0, int(w)))
            if p is not None and np.array_equal(R[np.ix_(p, p)], R):
                gens.append(p); orb = orbits(gens); where = {v: k for k, o in enumerate(orb) for v in o}
    full = orbits(gens)
    k = 0
    while k < len(gens):                    # greedy pruning: drop a generator when the block orbits stay the same
        trial = gens[:k] + gens[k + 1:]
        if orbits(trial) == full: gens = trial
        else: k += 1
    cells = int(c0.max()) + 1
    print(f'm={m} equitable cells={cells} orbits={len(full)} generators={len(gens)} ({time.time() - t0:.0f}s)')
    json.dump({'what': 'automorphisms of the block matrix proposed by instruments/optq/graphon_k4_aut.py (colour refinement + individualization); '
               'a proposal only: graphon-k4-second.js re-verifies each permutation exactly before use',
               'source_sha256': hashlib.sha256(raw).hexdigest(), 'm': m, 'equitable_cells': cells, 'block_orbits': len(full),
               'generators': [[int(v) for v in g] for g in gens]}, open(sys.argv[2], 'w'), separators=(',', ':'))


def _groups(roots):
    out = {}
    for x, r in enumerate(roots): out.setdefault(r, []).append(x)
    return list(out.values())


if __name__ == '__main__':
    main()
