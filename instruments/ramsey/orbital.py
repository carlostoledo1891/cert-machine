#!/usr/bin/env python3
"""Orbital branching: the clique search of clique.py run once per orbit of a checked symmetry group, not once per vertex.

This is the REFERENCE for orbital.c, as clique.py is for clique.c. Every symmetry it uses is given to it as a list of
permutations and CHECKED here, entry by entry, before it is used; nothing is taken from the claimant. The searched graph A
is the one whose k-cliques are sought (callers pass the complement to look for an independent set, as with clique.py).

LEMMA (one root, then one branch per orbit). Let A be a simple graph on V = {0, ..., n-1} and k >= 2. Let T and H be sets
of automorphisms of A such that the group <T> is transitive on V and every h in H fixes 0. Let C = N(0); the group <H>
maps C onto itself, so C is a union of <H>-orbits O_1, ..., O_m, numbered by their smallest elements, and r_i = min O_i.
Put C_i = (C ∩ N(r_i)) \\ (O_1 ∪ ... ∪ O_(i-1)). Then A has a k-clique if and only if, for some i, the subgraph of A
induced on C_i has a (k - 2)-clique.

PROOF. (<=) Let Q be a (k-2)-clique inside C_i. Every vertex of Q is adjacent to 0 (Q ⊆ C) and to r_i (Q ⊆ N(r_i)); 0 is
adjacent to r_i (r_i ∈ O_i ⊆ C); and 0, r_i ∉ Q (0 ∉ N(0) and r_i ∉ N(r_i): A has no loops). So {0, r_i} ∪ Q is a
k-clique. (=>) Let K be a k-clique. <T> is transitive, so some g in <T> maps a vertex of K to 0, and g(K) is a k-clique
(g is an automorphism) containing 0. Its other k - 1 >= 1 vertices are neighbours of 0, so they lie in C = O_1 ∪ ... ∪
O_m. Let i be the least index with g(K) ∩ O_i ≠ ∅ and x a vertex there. x and r_i lie in one <H>-orbit, so h(x) = r_i
for some h in <H>. K' = h(g(K)) is a k-clique (h is an automorphism); it contains h(0) = 0 and h(x) = r_i; and for j < i
it misses O_j, because h(O_j) = O_j and g(K) misses O_j. So K' \\ {0, r_i} is a (k-2)-clique of A inside
C ∩ N(r_i) \\ (O_1 ∪ ... ∪ O_(i-1)) = C_i. QED.

THE CHECKS the lemma needs, each made here on the bytes (reduction() refuses with the reason when one fails):
  · every given map is a permutation of V (n distinct values in range);
  · every given map is an automorphism of A: u ~ v exactly when p(u) ~ p(v), all n^2 entries compared;
  · every map in H fixes 0;
  · <T> is transitive: the orbit of 0 under the generators T (closure by breadth-first search; a permutation of a finite
    set has its inverse among its powers, so the orbit under <T> is what repeated application of T reaches) is all of V.
  The <H>-orbits are the connected classes of "x joined to h(x)", by union-find over the generators.

THE SEARCH of each piece is clique.py's search, unchanged, on the subgraph induced on C_i RELABELLED: take the piece's
vertices in increasing order, compute clique.py's smallest-last order of the induced subgraph, and give label 0 to the
vertex removed last, label 1 to the one before it, and so on (the reverse of the removal sequence, the "core first"
labelling of bitset clique solvers). A relabelling is an isomorphism, so it cannot change whether a clique exists; it
changes only how well clique.py's colouring (lowest label first) bounds the search — on the R(3,33) pieces it cut the
nodes 3.5 to 4 times against increasing labels. A piece's per-root node counts are clique.py's on that relabelled
subgraph; orbital.c is held to them piece by piece and root by root. A "found" answer carries the k vertices in the
original labels, which the caller re-checks as a clique edge by edge, independently of the search.

PLAIN MODE (T empty, H empty): no symmetry is claimed and the lemma is not used; there is one piece, the whole graph
(relabelled as above) searched for a k-clique by clique.py.

Usage:  python3 orbital.py selftest [SEED]      the reduction against brute force and clique.py on small circulants
"""
import sys, random, itertools, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import clique  # noqa: E402


def check_perm(p, n):
    if len(p) != n or sorted(p) != list(range(n)):
        raise ValueError('a given map is not a permutation of the %d vertices' % n)


def is_automorphism(adj, n, p):
    for v in range(n):
        img = 0
        a = adj[v]
        while a:
            u = (a & -a).bit_length() - 1
            a &= a - 1
            img |= 1 << p[u]
        if img != adj[p[v]]:
            return False
    return True


def orbits(n, gens):
    """The orbits of <gens> on {0..n-1}, each a sorted list, numbered by smallest element."""
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for g in gens:
        for x in range(n):
            a, b = find(x), find(g[x])
            if a != b:
                parent[max(a, b)] = min(a, b)
    out = {}
    for x in range(n):
        out.setdefault(find(x), []).append(x)
    return sorted(out.values(), key=lambda o: o[0])


def orbit_of(n, gens, x):
    seen = {x}
    stack = [x]
    while stack:
        y = stack.pop()
        for g in gens:
            z = g[y]
            if z not in seen:
                seen.add(z)
                stack.append(z)
    return seen


def reduction(adj, n, T, H):
    """Make every check of the lemma; return {'plain': True} or the orbits of C and the pieces. Raises ValueError."""
    for p in list(T) + list(H):
        check_perm(p, n)
        if not is_automorphism(adj, n, p):
            raise ValueError('a given map is not an automorphism of the graph')
    for h in H:
        if h[0] != 0:
            raise ValueError('a map given for the stabilizer moves vertex 0')
    if not T and not H:
        return {'plain': True}
    if not T:
        raise ValueError('no transitive group was given (T is empty)')
    if len(orbit_of(n, T, 0)) != n:
        raise ValueError('the group generated by T is not transitive')
    C = adj[0]
    O = [o for o in orbits(n, H) if C >> o[0] & 1]
    for o in O:
        if any(not (C >> x & 1) for x in o):
            raise ValueError('an orbit of H leaves N(0)')
    pieces = []
    excluded = 0
    for o in O:
        r = o[0]
        pieces.append({'rep': r, 'orbitSize': len(o), 'mask': C & adj[r] & ~excluded})
        for x in o:
            excluded |= 1 << x
    return {'plain': False, 'orbits': [len(o) for o in O], 'reps': [p['rep'] for p in pieces], 'pieces': pieces}


def induced(adj, mask, labels=None):
    """(m, sub, labels): the subgraph induced on mask, vertex i of sub being labels[i] (default: increasing order)."""
    if labels is None:
        labels = [v for v in range(mask.bit_length()) if mask >> v & 1]
    idx = {v: i for i, v in enumerate(labels)}
    sub = []
    for v in labels:
        a = adj[v] & mask
        s = 0
        while a:
            u = (a & -a).bit_length() - 1
            a &= a - 1
            s |= 1 << idx[u]
        sub.append(s)
    return len(labels), sub, labels


def piece_graph(adj, mask):
    """The piece as searched: induced on mask, relabelled core first (the reverse of its smallest-last order)."""
    m, sub, labels = induced(adj, mask)
    order = clique.smallest_last(sub, m)
    return induced(adj, mask, [labels[v] for v in reversed(order)])


def has_clique(adj, n, k, T=(), H=()):
    """{'found', 'nodes', 'pieces': [{'rep', 'size', 'nodes', 'rootNodes'}], 'reduction', 'complete'}."""
    red = reduction(adj, n, T, H)
    if red['plain']:
        m, sub, labels = piece_graph(adj, (1 << n) - 1)
        r = clique.has_clique(sub, m, k)
        return {'found': None if r['found'] is None else [labels[i] for i in r['found']], 'nodes': r['nodes'], 'reduction': red,
                'pieces': [{'rep': None, 'size': n, 'nodes': r['nodes'], 'rootNodes': r['rootNodes']}], 'complete': True}
    if k <= 1:
        return {'found': [0][:max(k, 0)] if n else None, 'nodes': 0, 'reduction': red, 'pieces': [], 'complete': True}
    out = {'found': None, 'nodes': 0, 'reduction': red, 'pieces': [], 'complete': True}
    for p in red['pieces']:
        m, sub, labels = piece_graph(adj, p['mask'])
        if k == 2:
            out['found'] = [0, p['rep']]
            break
        r = clique.has_clique(sub, m, k - 2)
        out['pieces'].append({'rep': p['rep'], 'size': m, 'nodes': r['nodes'], 'rootNodes': r['rootNodes']})
        out['nodes'] += r['nodes']
        if r['found'] is not None:
            out['found'] = [0, p['rep']] + [labels[i] for i in r['found']]
            break
    return out


def circulant(n, S):
    adj = [0] * n
    for v in range(n):
        for s in S:
            adj[v] |= 1 << ((v + s) % n)
    return adj


def translation(n, t=1):
    return [(x + t) % n for x in range(n)]


def multiplier(n, a):
    return [(a * x) % n for x in range(n)]


def multipliers_preserving(n, S):
    from math import gcd
    S = {s % n for s in S}
    return [a for a in range(1, n) if gcd(a, n) == 1 and {(a * s) % n for s in S} == S]


def symmetric_set(n, rnd, mult, p=0.5):
    """A random connection set closed under negation and under multiplication by mult (a unit mod n): each orbit of
    <mult, -1> on 1..n-1 is taken whole with probability p."""
    S, seen = set(), set()
    for d in range(1, n):
        if d in seen:
            continue
        orb, x = set(), d
        for _ in range(n):
            orb.add(x % n); orb.add((-x) % n)
            x = (x * mult) % n
            if x == d:
                break
        seen |= orb
        if rnd.random() < p:
            S |= orb
    S.discard(0)
    return sorted(S)


def selftest(seed=1):
    rnd = random.Random(seed)
    trials = 0
    for _ in range(120):
        n = rnd.randint(5, 16)
        units = [a for a in range(2, n) if __import__('math').gcd(a, n) == 1] or [1]
        S = symmetric_set(n, rnd, rnd.choice(units))
        adj = circulant(n, S)
        M = multipliers_preserving(n, S)
        H = [multiplier(n, a) for a in M]
        T = [translation(n)]
        for k in range(1, 7):
            want = clique.brute(adj, n, k)
            r = has_clique(adj, n, k, T, H)
            if (r['found'] is not None) != want:
                raise SystemExit('selftest FAIL: n=%d S=%s k=%d orbital=%s brute=%s' % (n, S, k, r['found'], want))
            if r['found'] is not None and not (len(r['found']) == k and clique.is_clique(adj, r['found'])):
                raise SystemExit('selftest FAIL: a returned witness is not a %d-clique' % k)
            trials += 1
    return trials


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'selftest':
        print('orbital.py selftest: %d (circulant, k) pairs agree with brute force' % selftest(int(sys.argv[2]) if len(sys.argv) > 2 else 1))
    else:
        print(__doc__)
