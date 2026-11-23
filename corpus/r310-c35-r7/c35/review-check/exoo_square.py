"""Claim 2: for every 4-subset W of the 39 vertices of Exoo's graph, is G - W isomorphic to C35(1,7,11,16)?
Filter 1 (cheap, necessary): G - W is 8-regular. Survivors are tested twice: nauty labelg canonical form vs the
circulant's, and an explicit induced embedding found by our own backtracking (edges AND non-edges checked).
Also counts the 4-sets with alpha(G - W) <= 8 (another necessary condition) as a cross-check of the filter."""
import sys, subprocess, itertools
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from g6util import from_g6, to_g6, circulant

G = from_g6(open(sys.argv[1]).read())
n = len(G); assert n == 39
deg = [sum(r) for r in G]
C = circulant()
LABELG = '/opt/homebrew/bin/labelg'
def canon(lines):
    p = subprocess.run([LABELG, '-q'], input='\n'.join(lines) + '\n', capture_output=True, text=True, check=True)
    return p.stdout.split()
c35_canon = canon([to_g6(C)])[0]

def induced(keep):
    return [[G[i][j] for j in keep] for i in keep]

def embed(core, target):
    """induced embedding core -> target (same size here, so an isomorphism); None if none."""
    m = len(core); mapped = {}; used = set()
    order = list(range(m))
    def search():
        if len(mapped) == m: return True
        # most-constrained core vertex
        best = None
        for v in range(m):
            if v in mapped: continue
            opts = [w for w in range(len(target)) if w not in used and
                    all(core[v][u] == target[w][z] for u, z in mapped.items())]
            if best is None or len(opts) < len(best[1]): best = (v, opts)
            if not opts: return False
        v, opts = best
        for w in opts:
            mapped[v] = w; used.add(w)
            if search(): return True
            del mapped[v]; used.discard(w)
        return False
    return dict(mapped) if search() else None

total = reg = 0; survivors = []
for W in itertools.combinations(range(n), 4):
    total += 1
    Ws = set(W)
    if all(deg[v] - sum(G[v][w] for w in W) == 8 for v in range(n) if v not in Ws):
        reg += 1; survivors.append(W)
print('4-subsets', total, '; G - W 8-regular:', reg, survivors)

# alpha(G - W) <= 8 cross-check: W must meet every independent 9-set of G
nb = [sum(1 << j for j in range(n) if G[i][j]) for i in range(n)]
nines = []
def rec(cand, cur, sz):
    if sz == 9: nines.append(cur); return
    while cand:
        b = cand & -cand; v = b.bit_length() - 1; cand ^= b
        rec(cand & ~nb[v], cur | b, sz + 1)
rec((1 << n) - 1, 0, 0)
print('independent 9-sets of G:', len(nines))
hitters = [W for W in itertools.combinations(range(n), 4)
           if all(s & sum(1 << w for w in W) for s in nines)]
print('4-subsets meeting every independent 9-set (alpha(G-W) <= 8):', len(hitters))

iso = []
for W in survivors:
    keep = [v for v in range(n) if v not in W]
    H = induced(keep)
    a = canon([to_g6(H)])[0] == c35_canon
    m = embed(C, H)
    ok_m = m is not None and all(C[u][v] == H[m[u]][m[v]] for u in range(35) for v in range(35))
    print('W', W, 'labelg-isomorphic', a, '; explicit isomorphism found and re-checked', ok_m)
    if a: iso.append(W)
for W in hitters:
    if W not in survivors:
        keep = [v for v in range(n) if v not in W]
        assert canon([to_g6(induced(keep))])[0] != c35_canon
print('4-subsets W with G - W isomorphic to C35(1,7,11,16):', len(iso), iso)
for W in iso:
    E = [(a, b) for a, b in itertools.combinations(W, 2) if G[a][b]]
    print('W =', W, 'induced edges', E, 'degrees in W', [sum(G[w][x] for x in W) for w in W],
          'degrees in G', [deg[w] for w in W], 'neighbours in the core', [deg[w] - sum(G[w][x] for x in W) for w in W])
