#!/usr/bin/env python3
"""Does a graph have a clique of size k? An exact, exhaustive decision, in the standard library.

Written for the Ramsey lower-bound graphs Google released with AlphaEvolve (arXiv 2603.09172;
google-research/google-research at 0d94f8c4, ramsey_number_bounds/improved_bounds). A file
"R(s, t) >= m" holds a graph on m − 1 vertices; it proves R(s, t) ≥ m exactly when the graph has
no clique of size s and its complement none of size t (no independent set of size t). Nothing
here was read from anyone's code: not Google's notebook (igraph's clique enumeration), not the
checker maximusrufus published beside the same files.

This is the REFERENCE. clique.c is held to it: the same vertex order, the same colouring, the
same branch order, so the two count the same search nodes root by root on every graph both can
finish. The algorithm, written out so a third implementation can be held to it too:

  ORDER. Smallest-last: repeatedly remove a vertex of least degree in what remains (ties: the
  smallest label). rank[v] is its position in that removal sequence. A k-clique, read in rank
  order, starts at its lowest-ranked vertex r and lies inside r's later neighbours
  P(r) = {u ∈ N(r) : rank[u] > rank[r]}; roots are taken in rank order.

  SEARCH(size, P). One node per call. If size = k, the clique is found. If |P| < k − size, no
  clique. Otherwise colour P greedily: colour 1 takes the lowest label of P, then each next
  lowest label not adjacent to anything already in colour 1, and so on until P is covered; the
  vertices are listed in the order they were coloured. Then walk that list BACKWARDS: at a vertex
  of colour c, if size + c < k, stop — every vertex still in P has colour ≤ c and the c colour
  classes are independent sets, so no clique of P is larger than c; else SEARCH(size + 1,
  P ∩ N(v)) and on return remove v from P.

The search is exhaustive: it answers "none" only when every branch was closed by one of the two
bounds, each a theorem. A "found" answer carries the vertices, which callers re-check as a
clique edge by edge, independently of the search.

Usage (a self-check on random graphs against brute force; the battery calls the functions):
  python3 clique.py selftest [SEED]
"""
import sys, random, itertools

def popcount(x):
    return bin(x).count('1')


def smallest_last(adj, n):
    """The removal sequence: least remaining degree first, ties by smallest label."""
    alive = (1 << n) - 1
    deg = [popcount(adj[v]) for v in range(n)]
    order = []
    for _ in range(n):
        best = -1
        m = alive
        while m:
            v = (m & -m).bit_length() - 1
            m &= m - 1
            if best < 0 or deg[v] < deg[best]:
                best = v
        order.append(best)
        alive &= ~(1 << best)
        nb = adj[best] & alive
        while nb:
            u = (nb & -nb).bit_length() - 1
            nb &= nb - 1
            deg[u] -= 1
    return order


def colour(adj, P):
    """Greedy colouring of P: [(v, c), ...] in the order coloured."""
    out = []
    U = P
    c = 0
    while U:
        c += 1
        Q = U
        while Q:
            v = (Q & -Q).bit_length() - 1
            out.append((v, c))
            U &= ~(1 << v)
            Q &= ~(1 << v) & ~adj[v]
    return out


def has_clique(adj, n, k, node_limit=None):
    """{'found': [vertices] or None, 'nodes': total, 'rootNodes': [per root, rank order], 'complete': bool}.
    node_limit stops the search (complete=False) once that many nodes were visited."""
    order = smallest_last(adj, n)
    rank = [0] * n
    for i, v in enumerate(order):
        rank[v] = i
    later_mask = [0] * n
    acc = 0
    for v in reversed(order):      # later_mask[v] = vertices of higher rank
        later_mask[v] = acc
        acc |= 1 << v
    nodes = [0]
    found = [None]

    def search(R, P):
        nodes[0] += 1
        if len(R) == k:
            found[0] = list(R)
            return True
        if popcount(P) < k - len(R):
            return False
        if node_limit is not None and nodes[0] >= node_limit:
            raise StopIteration
        for v, c in reversed(colour(adj, P)):
            if len(R) + c < k:
                return False
            R.append(v)
            if search(R, P & adj[v]):
                return True
            R.pop()
            P &= ~(1 << v)
        return False

    root_nodes = []
    complete = True
    try:
        for r in order:
            before = nodes[0]
            hit = search([r], adj[r] & later_mask[r])
            root_nodes.append(nodes[0] - before)
            if hit:
                break
    except StopIteration:
        complete = False
    return {'found': found[0], 'nodes': nodes[0], 'rootNodes': root_nodes, 'complete': complete and True}


def complement(adj, n):
    full = (1 << n) - 1
    return [full & ~adj[v] & ~(1 << v) for v in range(n)]


def is_clique(adj, vs):
    return len(set(vs)) == len(vs) and all(adj[a] >> b & 1 for a, b in itertools.combinations(vs, 2))


def brute(adj, n, k):
    return any(is_clique(adj, c) for c in itertools.combinations(range(n), k))


def selftest(seed=1):
    rnd = random.Random(seed)
    trials = 0
    for _ in range(400):
        n = rnd.randint(1, 13)
        p = rnd.random()
        adj = [0] * n
        for a in range(n):
            for b in range(a + 1, n):
                if rnd.random() < p:
                    adj[a] |= 1 << b
                    adj[b] |= 1 << a
        for k in range(1, n + 2):
            r = has_clique(adj, n, k)
            want = brute(adj, n, k)
            if (r['found'] is not None) != want:
                raise SystemExit('selftest FAIL: n=%d k=%d search=%s brute=%s' % (n, k, r['found'], want))
            if r['found'] is not None and not (len(r['found']) == k and is_clique(adj, r['found'])):
                raise SystemExit('selftest FAIL: a returned witness is not a %d-clique' % k)
            trials += 1
    return trials


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'selftest':
        print('clique.py selftest: %d (graph, k) pairs agree with brute force' % selftest(int(sys.argv[2]) if len(sys.argv) > 2 else 1))
    else:
        print(__doc__)
