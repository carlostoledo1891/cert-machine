"""Cay(Z_240, ±D) from the deposit's TEXT (the generator list), written in the kernel's stdin format; the deposit's
certificate JSON is read as data only to compare its edge set with the graph the text defines."""
import json, sys
n = 240
D = [14, 34, 38, 40, 43, 50, 58, 60, 63, 67, 69, 70, 79, 87, 89, 99]
S = set()
for d in D:
    S.add(d % n); S.add((-d) % n)
assert 0 not in S and len(S) == 32, len(S)
adj = [0] * n
for v in range(n):
    for s in S:
        adj[v] |= 1 << ((v + s) % n)
# simple graph checks
assert all(not (adj[v] >> v) & 1 for v in range(n))
assert all(((adj[v] >> u) & 1) == ((adj[u] >> v) & 1) for v in range(n) for u in range(n))
deg = {bin(a).count('1') for a in adj}; assert deg == {32}, deg
comp = [((1 << n) - 1) & ~adj[v] & ~(1 << v) for v in range(n)]
rows = lambda A: '\n'.join(''.join('1' if A[i] >> j & 1 else '0' for j in range(n)) for i in range(n))
open('G_k3.txt', 'w').write('%d %d\n%s\n' % (n, 3, rows(adj)))        # a triangle in G?
open('Gc_k33.txt', 'w').write('%d %d\n%s\n' % (n, 33, rows(comp)))    # a 33-clique in the complement = an independent 33-set in G?
# the deposit's certificate, as data: does its edge set equal ours?
try:
    c = json.load(open('deposit/unpacked/r3_33_bundle/certificates/R3_33_n240_Z240.json'))
    print('certificate keys:', list(c.keys())[:12])
    E = c.get('edges') or c.get('edge_list') or c.get('edgelist')
    if E is not None:
        ours = {(min(u, v), max(u, v)) for v in range(n) for u in range(n) if adj[v] >> u & 1}
        theirs = {(min(int(a), int(b)), max(int(a), int(b))) for a, b in E}
        print('edges: ours %d, theirs %d, equal %s' % (len(ours), len(theirs), ours == theirs))
    cs = c.get('connection_set') or c.get('D') or c.get('generators')
    print('their connection set:', cs)
except Exception as e:
    print('certificate not compared:', e)
print('written G_k3.txt and Gc_k33.txt')
