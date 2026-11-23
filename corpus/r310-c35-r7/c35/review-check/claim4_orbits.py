"""Claim 4: unions of complete affine orbits of independent 8-sets that force Lemma P (admit no forbidden triple)."""
import sys, os, json, time, itertools
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lpcheck_lib import *
k = len(ORB)
print('orbits', k, 'sizes', SIZES, 'size census', sorted(Counter(SIZES).items()))
def fam(U): return [m for i in U for m in ORB[i]]
def batch(unions, label):
    t = time.time(); res = run([(0, fam(U)) for U in unions])
    bad = 0; infeas = []; maxnodes = 0
    for U, r in zip(unions, res):
        maxnodes = max(maxnodes, r[-1])
        if r[0] == 'FEAS':
            if not check_triple(r[1], r[2], r[3], fam(U)): bad += 1
        else: infeas.append((U, r[-1]))
    print(f'{label}: {len(unions)} unions, FEAS {len(unions)-len(infeas)} (witness failures {bad}), '
          f'INFEAS {len(infeas)}, max nodes {maxnodes}, {time.time()-t:.1f}s')
    return infeas, res

# (a) five-orbit unions with sizes 105+70+70+105+35
target = sorted([105, 70, 70, 105, 35])
five = [U for U in itertools.combinations(range(k), 5) if sorted(SIZES[i] for i in U) == target]
inf5, _ = batch(five, '(a) 5-orbit unions with sizes {105,105,70,70,35}')
for U, nodes in inf5:
    F = fam(U)
    print('   INFEAS union', U, 'sizes', [SIZES[i] for i in U], 'sets', len(F), 'nodes', nodes,
          'representatives', [verts(ORB[i][0]) for i in U])
# (b) every union with fewer than 385 sets
small = [U for r in range(k + 1) for U in itertools.combinations(range(k), r) if sum(SIZES[i] for i in U) < 385]
infs, ress = batch(small, '(b) unions with fewer than 385 sets (empty union included)')
print('   largest union size among them', max(sum(SIZES[i] for i in U) for U in small),
      '; by number of orbits', sorted(Counter(len(U) for U in small).items()))
# (c) every union with exactly 385 sets
eq = [U for r in range(k + 1) for U in itertools.combinations(range(k), r) if sum(SIZES[i] for i in U) == 385]
infe, _ = batch(eq, '(c) unions with exactly 385 sets')
for U, nodes in infe:
    print('   INFEAS union', U, 'sizes', [SIZES[i] for i in U], 'nodes', nodes)
json.dump({'five_infeasible': [list(U) for U, _ in inf5], 'exact385_infeasible': [list(U) for U, _ in infe],
           'small_infeasible': [list(U) for U, _ in infs]},
          open(os.path.join(HERE, 'claim4-orbits-result.json'), 'w'))
# (d) irredundancy of each infeasible 385-union: drop one set (one per orbit suffices: the union is invariant)
for U, _ in infe:
    F = fam(U)
    probs = [(0, [m for m in F if m != ORB[i][0]]) for i in U]
    res = run(probs)
    print('   drop one set of orbit', list(U), '->', [r[0] for r in res],
          'witnesses verified', [check_triple(r[1], r[2], r[3], p[1]) for r, p in zip(res, probs) if r[0] == 'FEAS'])
