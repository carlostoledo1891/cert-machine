"""Claim 4, part 1: independent 8-sets of C35(1,7,11,16), its affine automorphisms, the orbits of the 8-sets,
and the unions of complete orbits. Writes orbits.json. (C35 review check, control room, 2026-11-23.)"""
import sys, os, json, itertools, math, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from g6util import circulant, to_g6
N = 35
D = {1, 7, 11, 16, 34, 28, 24, 19}
A = circulant()
assert all(sum(r) == 8 for r in A)
nb = [sum(1 << v for v in range(N) if A[u][v]) for u in range(N)]
sets = {k: [] for k in range(10)}
def rec(cand, cur, sz):
    sets[sz].append(cur)
    if sz == 9: return
    while cand:
        b = cand & -cand; v = b.bit_length() - 1; cand ^= b
        rec(cand & ~nb[v], cur | b, sz + 1)
rec((1 << N) - 1, 0, 0)
counts = [len(sets[k]) for k in range(10)]
print('independent sets by size 0..9:', counts, 'total', sum(counts))
eights = sorted(sets[8])
# affine maps x -> a x + b that are automorphisms
mult = [a for a in range(N) if math.gcd(a, N) == 1 and {(a * d) % N for d in D} == D]
print('multipliers a with gcd(a,35)=1 and a.D = D:', mult)
maps = [(a, b) for a in mult for b in range(N)]
for a, b in maps:   # each is an automorphism (edges to edges)
    assert all(A[(a*u+b) % N][(a*v+b) % N] == A[u][v] for u in range(N) for v in range(N))
# any affine map that is an automorphism has a in mult (a check over all units)
aff_aut = [(a, b) for a in range(N) if math.gcd(a, N) == 1 for b in range(N)
           if all(A[(a*u+b) % N][(a*v+b) % N] == A[u][v] for u in range(N) for v in range(u+1, N))]
print('affine automorphisms (searched over all 24 units x 35 translations):', len(aff_aut))
p = subprocess.run(['/opt/homebrew/bin/countg', '-q', '--a'], input=to_g6(A) + '\n', capture_output=True, text=True)
print('nauty countg on the circulant:', p.stdout.strip().splitlines()[0])
def img(mask, a, b):
    r = 0
    for v in range(N):
        if mask >> v & 1: r |= 1 << ((a * v + b) % N)
    return r
index = {m: i for i, m in enumerate(eights)}
orbit_of = [-1] * len(eights); orbits = []
for i, m in enumerate(eights):
    if orbit_of[i] >= 0: continue
    orb = sorted({img(m, a, b) for a, b in maps})
    for x in orb:
        assert x in index; orbit_of[index[x]] = len(orbits)
    orbits.append(orb)
sizes = [len(o) for o in orbits]
print('orbits of independent 8-sets:', len(orbits), 'sizes', sizes, 'sum', sum(sizes))
# stabiliser check: orbit size * stabiliser = 210
for o in orbits:
    stab = sum(1 for a, b in maps if img(o[0], a, b) == o[0])
    assert stab * len(o) == len(maps)
# unions of complete orbits by total size
k = len(orbits); small = 0; at385 = []
from collections import Counter
bysize = Counter()
for r in range(k + 1):
    for U in itertools.combinations(range(k), r):
        s = sum(sizes[i] for i in U)
        bysize[s] += 1
        if s < 385: small += 1
        if s == 385: at385.append(U)
print('unions of complete orbits (incl. empty):', 2 ** k, '; with fewer than 385 sets:', small,
      '; nonempty with fewer than 385:', small - 1, '; with exactly 385:', len(at385))
json.dump({'n': N, 'D': sorted(D), 'counts': counts, 'multipliers': mult, 'orbits': orbits, 'sizes': sizes,
           'nb': nb}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'orbits.json'), 'w'))
