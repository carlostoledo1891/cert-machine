#!/usr/bin/env python3
"""cm_encode.py — cert-machine's own CNF for Theorem C35, written from the statement alone (not from core_cnf.py).

Statement: a graph on the 35 core vertices plus m outside vertices, the core inducing C35(1,7,11,16), triangle-free,
with no independent 10-set. Unknowns: the m(m-1)/2 outside-outside edges and the 35m core-outside edges. The core's own
edges are fixed (induced copy). UNSAT for m = 5 is Theorem C35's order bound; m = 4 must be SAT (Exoo's graph).

usage: python3 -I cm_encode.py M OUT.cnf
"""
import itertools, sys

N, STEPS = 35, (1, 7, 11, 16)
adj = [[((v - u) % N) in {s % N for s in STEPS} | {(-s) % N for s in STEPS} for v in range(N)] for u in range(N)]
assert all(sum(r) == 8 for r in adj) and all(not adj[u][u] for u in range(N))

def core_independent_sets(k):
    """every independent k-subset of the core, by a plain recursion (no symmetry)"""
    out = []
    def rec(start, chosen):
        if len(chosen) == k:
            out.append(tuple(chosen)); return
        for v in range(start, N):
            if all(not adj[v][c] for c in chosen):
                chosen.append(v); rec(v + 1, chosen); chosen.pop()
    rec(0, [])
    return out

def main():
    m, path = int(sys.argv[1]), sys.argv[2]
    var = {}
    def x(key):
        if key not in var: var[key] = len(var) + 1
        return var[key]
    oo = lambda i, j: x(('oo', min(i, j), max(i, j)))      # outside i ~ outside j
    oc = lambda i, u: x(('oc', i, u))                       # outside i ~ core u
    for i, j in itertools.combinations(range(m), 2): oo(i, j)
    for i in range(m):
        for u in range(N): oc(i, u)
    cls = []
    # triangle-free: every triangle has to use an outside vertex (the core is triangle-free)
    assert not any(adj[a][b] and adj[b][c] and adj[a][c] for a, b, c in itertools.combinations(range(N), 3))
    for i in range(m):                                       # one outside vertex, a core edge
        for u, v in itertools.combinations(range(N), 2):
            if adj[u][v]: cls.append([-oc(i, u), -oc(i, v)])
    for i, j in itertools.combinations(range(m), 2):         # two outside vertices, one core vertex
        for u in range(N): cls.append([-oo(i, j), -oc(i, u), -oc(j, u)])
    for i, j, k in itertools.combinations(range(m), 3):      # three outside vertices
        cls.append([-oo(i, j), -oo(i, k), -oo(j, k)])
    # no independent 10-set: T outside vertices plus a core-independent set C, |T| + |C| = 10; some edge must be present
    ind = {k: core_independent_sets(k) for k in range(0, 11)}
    assert len(ind[9]) == 0 and len(ind[10]) == 0, 'the core has independent 9-sets?'
    counts = {k: len(ind[k]) for k in range(11)}
    n_ind = 0
    for t in range(0, m + 1):
        k = 10 - t
        if k < 0 or k > 10: continue
        for T in itertools.combinations(range(m), t):
            inner = [oo(i, j) for i, j in itertools.combinations(T, 2)]
            for C in ind[k]:
                cls.append(inner + [oc(i, u) for i in T for u in C]); n_ind += 1
    with open(path, 'w') as f:
        f.write('c cert-machine cm_encode.py m=%d core C35(1,7,11,16); core independent sets by size %s\n' % (m, [counts[k] for k in range(11)]))
        f.write('p cnf %d %d\n' % (len(var), len(cls)))
        for c in cls: f.write(' '.join(map(str, c)) + ' 0\n')
    sys.stderr.write('m=%d variables=%d clauses=%d independent-10 clauses=%d core independent sets by size %s\n'
                     % (m, len(var), len(cls), n_ind, [counts[k] for k in range(11)]))

if __name__ == '__main__':
    main()
