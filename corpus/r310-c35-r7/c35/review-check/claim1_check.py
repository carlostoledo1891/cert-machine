"""Claim 1: (i) the two finite facts the mechanism uses, by brute force over all graphs on 4 and 5 labelled vertices;
(ii) the bridge's facts on Exoo's graph (identified class, exoo-candidate.g6): with the core = G - W (W the unique
4-set found by exoo_square.py), each outside vertex's core neighbourhood is independent, the four are pairwise disjoint,
for each NON-adjacent outside pair {u, x} the union S_u u S_x meets every independent 8-set of the core, and each outside
vertex has exactly one outside non-neighbour."""
import sys, os, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from g6util import from_g6
def facts(m):
    pairs = list(itertools.combinations(range(m), 2)); ok = []
    for bits in range(1 << len(pairs)):
        E = {p for i, p in enumerate(pairs) if bits >> i & 1}
        adj = lambda a, b: (min(a, b), max(a, b)) in E
        tri = any(adj(a, b) and adj(b, c) and adj(a, c) for a, b, c in itertools.combinations(range(m), 3))
        rule = all(sum(1 for y in range(m) if y != x and not adj(x, y)) <= 1 for x in range(m))
        if rule and not tri: ok.append(sorted(E))
    return ok
f4, f5 = facts(4), facts(5)
c4 = lambda E: len(E) == 4 and all(sum(1 for e in E if v in e) == 2 for v in range(4))
print('4 vertices: triangle-free graphs where every vertex misses at most one other:', len(f4),
      '; all of them 4-cycles:', all(c4(E) for E in f4), '; labelled 4-cycles on 4 vertices = 3:', len(f4) == 3)
print('5 vertices: triangle-free graphs where every vertex misses at most one other:', len(f5))
G = from_g6(open(sys.argv[1]).read()); n = 39
W = [0, 1, 2, 38]   # from exoo_square.py
core = [v for v in range(n) if v not in W]
nb = {v: {u for u in range(n) if G[v][u]} for v in range(n)}
S = {w: nb[w] & set(core) for w in W}
indep = lambda X: not any(G[a][b] for a, b in itertools.combinations(X, 2))
print('core neighbourhood sizes', {w: len(S[w]) for w in W}, '; each independent:', all(indep(S[w]) for w in W),
      '; pairwise disjoint:', all(not (S[a] & S[b]) for a, b in itertools.combinations(W, 2)))
cm = {v: sum(1 << i for i, u in enumerate(core) if G[v][u]) for v in core}
idx = {v: i for i, v in enumerate(core)}
eights = []
def rec(cand, cur, sz):
    if sz == 8: eights.append(cur); return
    while cand:
        b = cand & -cand; i = b.bit_length() - 1; cand ^= b
        rec(cand & ~cm[core[i]], cur | b, sz + 1)
rec((1 << 35) - 1, 0, 0)
print('independent 8-sets of the core:', len(eights))
for a, b in itertools.combinations(W, 2):
    if not G[a][b]:
        U = sum(1 << idx[v] for v in S[a] | S[b])
        print(f'  non-adjacent outside pair {a},{b}: S_a u S_b meets every independent 8-set:', all(E & U for E in eights))
print('outside non-neighbours per outside vertex:', {w: [x for x in W if x != w and not G[w][x]] for w in W})
