#!/usr/bin/env python3
"""instruments/wowii/battery.py — the WOWII deciders' calibrations and red controls (standard library; seconds)."""
import itertools, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import decide as W
from fractions import Fraction as F

passed = failed = reds = fired = 0


def ok(c, name):
    global passed, failed
    if c: passed += 1
    else: failed += 1; print('FAIL ' + name)


def red(c, name):
    global reds, fired, passed, failed
    reds += 1
    if c: fired += 1; passed += 1
    else: failed += 1; print('RED DID NOT FIRE ' + name)


lean = lambda n: open(os.path.join(ROOT, 'corpus', 'wowii', 'sources', 'fork', 'WOWII%sProof.lean' % n), encoding='utf-8').read()

# the tree DP against brute force on random trees (n <= 11)
rng = random.Random(3); agree = 0
for trial in range(25):
    n = rng.randrange(3, 12); parent = [0] + [rng.randrange(0, v) for v in range(1, n)]
    G = W.tree_from_parent(parent)
    if W.total_domination_number_tree(G) == W.total_domination_number_bruteforce(G): agree += 1
ok(agree == 25, 'the tree DP equals brute force on 25 random trees (3 <= n <= 11)')
red(W.total_domination_number_tree(W.Graph(4, [(0, 1), (1, 2), (2, 3)])) == 2 and W.total_domination_number_bruteforce(W.Graph(4, [(0, 1), (1, 2), (2, 3)])) == 2, 'P4 has gamma_t = 2 (both deciders)')
# the witnesses
G = W.witness_353(lean('353')); ok(G.is_tree() and G.n == 25 and G.m == 24, '353 witness: a 25-vertex tree')
ok(W.total_domination_number_tree(G) == 10 and W.is_total_dominating(G, [1, 3, 6, 8, 11, 13, 16, 18, 21, 23]), '353: gamma_t = 10, the claimant\'s set is total dominating')
red(not W.is_total_dominating(G, [3, 6, 8, 11, 13, 16, 18, 21, 23]), '353: the nine forced support vertices alone are NOT total dominating (vertex 3 undominated)')
G = W.witness_360(lean('360')); ok(G.is_tree() and G.n == 41, '360 witness: a 41-vertex tree')
ok(W.total_domination_number_tree(G) == 6 and W.disjoint_open_neighbourhoods(G, [0, 10, 11, 9, 1, 8]), '360: gamma_t = 6, six vertices with disjoint open neighbourhoods')
red(not W.disjoint_open_neighbourhoods(G, [0, 12, 13]), '360: leaves 12 and 13 share the neighbourhood {1} — not a lower certificate')
ecc, dm = W.eccentricities(G); C = [v for v in range(G.n) if ecc[v] == min(ecc)]
ok(str(W.positive_average(G, C, dm)) == '321/80', '360: dist_avg(C, V) = 321/80 as the claimant states')
red(F(4) + F(321, 80) > 6, '360: even without the half, the right side 641/80 exceeds gamma_t = 6')
G = W.witness_373(lean('373')); ok(G.is_tree() and G.n == 150 and G.m == 149, '373 witness: a 150-vertex tree')
ok(W.total_domination_number_tree(G) == 12, '373: gamma_t = 12')
G, block = W.witness_396(lean('396')); ok(G.connected() and G.n == 39 and G.m == 121, '396 witness: 39 vertices, 121 edges, connected')
ok(W.is_two_dominating(G, [2, 3, 7, 8, 13, 14, 20, 21, 28, 29, 37, 38]), '396: two private vertices per clique 2-dominate')
red(not W.is_two_dominating(G, [2, 7, 13, 20, 28, 37]), '396: one vertex per clique does not 2-dominate')
G, block = W.witness_395b(lean('395b')); ok(G.connected() and G.n == 15 and G.m == 38, '395b witness: 15 vertices, 38 edges, connected')
g2, D = W.two_domination_number_exhaustive(G); ok(g2 == 6, '395b: gamma_2 = 6 by exhaustion')
red(not W.Graph(15, [(u, v) for u in range(15) for v in range(u + 1, 15) if block(u) == block(v)]).connected(), '395b: without the bridges the three cliques are disconnected')
red(not W.is_two_dominating(G, list(D)[:-1]), '395b: a minimum 2-dominating set minus one vertex is not 2-dominating')
print('wowii battery: %d pass, %d fail, %d/%d red controls fired' % (passed, failed, fired, reds))
sys.exit(1 if failed else 0)
