#!/usr/bin/env python3
"""instruments/wowii/decide.py — five Written-on-the-Wall-II (Graffiti.pc) conjectures and the explicit graphs offered
against them, decided exactly in integers and rationals (standard library).

The graphs are built from the witness definitions of the claimant's Lean proofs (corpus/wowii/sources/fork/*.lean:
a parent table for the trees, block + bridge tables for the clique graphs), read as text here, and checked against the
prose constructions of the issues (vertex and edge counts, degrees). The conjectures are read from the WOWII archive
(corpus/wowii/sources/archive/open-20161009123457.html, definitions wowIIdefs) and from the Lean statements of the
PRs; where the two differ it is said.

Invariants, all exact:
  total domination number gamma_t      tree DP (exact) AND a sandwich of certificates: an explicit total dominating
                                       set (upper) and vertices with pairwise disjoint open neighbourhoods (lower)
  2-domination number gamma_2          exhaustive over subsets up to 20 vertices; above that a private-vertex lower
                                       bound (two vertices of a clique with no outside neighbour force two of the
                                       clique into every 2-dominating set) and an explicit set, meeting
  components of induced subgraphs, degrees, modes, eccentricities, centre, periphery, average distances (Fraction)
"""
import itertools, re
from collections import deque
from fractions import Fraction as F


class Graph:
    def __init__(self, n, edges):
        self.n = n; self.adj = [set() for _ in range(n)]
        for u, v in edges:
            if u == v or not (0 <= u < n and 0 <= v < n): raise ValueError('bad edge %r' % ((u, v),))
            self.adj[u].add(v); self.adj[v].add(u)
        self.m = sum(len(a) for a in self.adj) // 2

    def degree(self, v): return len(self.adj[v])
    def degrees(self): return [len(a) for a in self.adj]

    def connected(self):
        return len(self.bfs(0)) == self.n if self.n else True

    def bfs(self, s):
        d = {s: 0}; q = deque([s])
        while q:
            u = q.popleft()
            for w in self.adj[u]:
                if w not in d: d[w] = d[u] + 1; q.append(w)
        return d

    def is_tree(self): return self.connected() and self.m == self.n - 1

    def dist_matrix(self):
        return [self.bfs(s) for s in range(self.n)]

    def induced_components(self, S):
        S = set(S); seen = set(); comps = []
        for s in S:
            if s in seen: continue
            comp = {s}; q = deque([s]); seen.add(s)
            while q:
                u = q.popleft()
                for w in self.adj[u]:
                    if w in S and w not in seen: seen.add(w); comp.add(w); q.append(w)
            comps.append(comp)
        return comps


# ---- the witnesses, from the Lean tables ------------------------------------------------------------------------------
def tree_from_parent(parent):
    n = len(parent); return Graph(n, [(v, parent[v]) for v in range(n) if v != 0])


def parse_parent_table(lean_text, n):
    """`def parent : Fin n → Fin n := ![a, b, ...]`"""
    m = re.search(r'def parent\s*:\s*Fin %d → Fin %d\s*:=\s*!\[([^\]]*)\]' % (n, n), lean_text)
    if not m: raise ValueError('no parent table')
    vals = [int(t) for t in re.findall(r'\d+', m.group(1))]
    if len(vals) != n: raise ValueError('parent table has %d entries, not %d' % (len(vals), n))
    return vals


def witness_353(lean):
    return tree_from_parent(parse_parent_table(lean, 25))


def witness_360(lean):
    # def parent (v : Fin 41) := if v < 10 then v-1 else if v = 10 then 3 else if v = 11 then 6 else 1
    if not re.search(r'if v\.val < 10 then ⟨v\.val-1.*?else if v\.val = 10 then 3 else if v\.val = 11 then 6 else 1', lean, re.S): raise ValueError('360 parent rule not as read')
    parent = [0] + [v - 1 for v in range(1, 10)] + [3, 6] + [1] * 29
    return tree_from_parent(parent)


def witness_373(lean):
    if not re.search(r'if v\.val < 22 then ⟨v\.val-1.*?else if v\.val < 32 then 0 else if v\.val = 32 then 21 else 20', lean, re.S): raise ValueError('373 parent rule not as read')
    parent = [0] + [v - 1 for v in range(1, 22)] + [0] * 10 + [21] + [20] * (150 - 33)
    return tree_from_parent(parent)


def clique_graph(n, block, bridges):
    edges = [(u, v) for u in range(n) for v in range(u + 1, n) if block(u) == block(v)] + list(bridges)
    return Graph(n, edges)


def parse_bridges(lean, n):
    m = re.search(r'def bridges\s*:\s*Finset \(Fin %d × Fin %d\)\s*:=\s*\{([^}]*)\}' % (n, n), lean)
    return [tuple(int(t) for t in re.findall(r'\d+', p)) for p in re.findall(r'\(\s*\d+\s*,\s*\d+\s*\)', m.group(1))]


def witness_396(lean):
    if 'if v.val < 4 then 0 else if v.val < 9 then 1 else if v.val < 15 then 2' not in lean or 'else if v.val < 22 then 3 else if v.val < 30 then 4 else 5' not in lean: raise ValueError('396 block rule not as read')
    block = lambda v: 0 if v < 4 else 1 if v < 9 else 2 if v < 15 else 3 if v < 22 else 4 if v < 30 else 5
    return clique_graph(39, block, parse_bridges(lean, 39)), block


def witness_395b(lean):
    if 'if v.val < 4 then 0 else if v.val < 9 then 1 else 2' not in lean: raise ValueError('395b block rule not as read')
    block = lambda v: 0 if v < 4 else 1 if v < 9 else 2
    return clique_graph(15, block, parse_bridges(lean, 15)), block


# ---- invariants ------------------------------------------------------------------------------------------------------------
def is_total_dominating(G, D):
    D = set(D); return all(any(w in D for w in G.adj[v]) for v in range(G.n))


def is_two_dominating(G, D):
    D = set(D); return all(v in D or sum(1 for w in G.adj[v] if w in D) >= 2 for v in range(G.n))


def disjoint_open_neighbourhoods(G, S):
    """gamma_t >= |S| when the open neighbourhoods of S are nonempty and pairwise disjoint (each needs its own
    dominator)."""
    N = [G.adj[v] for v in S]
    return all(N) and all(not (N[i] & N[j]) for i in range(len(S)) for j in range(i + 1, len(S)))


def total_domination_number_tree(G, root=0):
    """Exact gamma_t of a tree by dynamic programming. States at v for the subtree of v, with v's parent outside:
       a: v in D, v already dominated by a child in D;      b: v in D, v not yet dominated (needs the parent in D)
       c: v not in D, v dominated by a child in D;          d: v not in D, not dominated (needs the parent in D)
       In every state every vertex of the subtree other than v is dominated. Values are minimum |D ∩ subtree|."""
    INF = 10 ** 9
    order = []; parent = {root: None}; q = deque([root])
    while q:
        u = q.popleft(); order.append(u)
        for w in G.adj[u]:
            if w not in parent: parent[w] = u; q.append(w)
    if len(order) != G.n: raise ValueError('not connected')
    st = {}
    for v in reversed(order):
        ch = [w for w in G.adj[v] if parent.get(w) == v and w != parent[v]]
        # v in D: children may be in any state; a child in state b or d is then dominated by v. v is dominated iff
        # some child is in D (state a or b).
        in_cost_any = 0; best_gain = INF   # cheapest way to have at least one child in D
        for w in ch:
            a, b, c, d = st[w]
            cheapest = min(a, b, c, d); in_cost_any += cheapest
            best_gain = min(best_gain, min(a, b) - cheapest)
        A = 1 + in_cost_any + best_gain if ch else INF          # v in D, dominated by a child
        Bv = 1 + in_cost_any                                     # v in D, not necessarily dominated (parent must)
        # v not in D: children cannot rely on v, so each child must be in state a or c (dominated within its subtree)
        out_cost = 0; gain = INF
        for w in ch:
            a, b, c, d = st[w]
            cheapest = min(a, c); out_cost += cheapest
            gain = min(gain, a - cheapest)
        Cv = out_cost + gain if ch else INF                      # v not in D, dominated by a child in D
        Dv = out_cost if ch else 0                               # v not in D, not dominated
        st[v] = (A, Bv, Cv, Dv)
    a, b, c, d = st[root]
    return min(a, c)


def total_domination_number_bruteforce(G):
    for k in range(1, G.n + 1):
        for D in itertools.combinations(range(G.n), k):
            if is_total_dominating(G, D): return k
    return None


def two_domination_number_exhaustive(G):
    for k in range(0, G.n + 1):
        for D in itertools.combinations(range(G.n), k):
            if is_two_dominating(G, D): return k, D
    return None, None


def eccentricities(G):
    dm = G.dist_matrix(); return [max(d.values()) for d in dm], dm


def positive_average(G, S, dm):
    """Definition 95 / 38: the average of all dist(s, v) > 0 with s in S, v in V: denominator |S| (n - 1)."""
    tot = sum(dm[s][v] for s in S for v in range(G.n) if v != s)
    return F(tot, len(S) * (G.n - 1))


def degree_modes(G):
    deg = G.degrees(); freq = {}
    for d in deg: freq[d] = freq.get(d, 0) + 1
    mx = max(freq.values()); modes = sorted(d for d, f in freq.items() if f == mx)
    return freq, mx, modes
