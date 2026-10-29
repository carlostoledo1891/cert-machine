"""Orbital-branching proof that a circulant blue graph Cay(Z_n, S) has no independent set of size k.
Uses translations (root at 0) and the multipliers a with aS = S (stabilizer of 0).
Splits into one clique subproblem per orbit representative r of non-neighbours of 0, excluding earlier orbits.
Usage: orbital_check.py <blue.clq> <k> <outdir> <parallel>"""
import sys, os, subprocess, json
from math import gcd
from concurrent.futures import ThreadPoolExecutor
f, k, outdir, par = sys.argv[1], int(sys.argv[2]), sys.argv[3], int(sys.argv[4])
os.makedirs(outdir, exist_ok=True)
lines = [l.split() for l in open(f)]
n = int(lines[0][2])
S = sorted({int(l[2]) - 1 for l in lines if l[0] == 'e' and l[1] == '1'})
Sset = set(S)
assert all(((x - y) % n in Sset) == ((y - x) % n in Sset) for x in range(n) for y in [0])
mults = [a for a in range(1, n) if gcd(a, n) == 1 and {(a * s) % n for s in S} == Sset]
print('n', n, '|S|', len(S), 'multipliers fixing S:', mults, flush=True)
non = [v for v in range(1, n) if v not in Sset]
seen = set(); orbits = []
for v in non:
    if v in seen: continue
    o = sorted({(a * v) % n for a in mults}); seen |= set(o); orbits.append(o)
print('orbits of non-neighbours:', len(orbits), flush=True)
CLQ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bin', os.environ.get('CLQBIN', 'clq2'))
def job(i):
    r = orbits[i][0]
    excl = set(Sset) | {0} | {v for o in orbits[:i] for v in o}
    ef = os.path.join(outdir, f'excl_{i}.txt')
    open(ef, 'w').write(' '.join(str(v + 1) for v in sorted(excl)))
    p = subprocess.run([CLQ, f, str(k - 1), ef, str(r + 1), 'c'], capture_output=True, text=True)
    res = (i, r, len(orbits[i]), p.stdout.strip(), p.stderr.strip())
    with open(os.path.join(outdir, 'results.txt'), 'a') as g: g.write(json.dumps(res) + '\n')
    print(res, flush=True)
    return res
with ThreadPoolExecutor(par) as ex:
    res = list(ex.map(job, range(len(orbits))))
found = [r for r in res if not r[3].startswith('NONE')]
print('RESULT', 'INDEPENDENT SET FOUND' if found else f'NO independent {k}-set: alpha < {k}', flush=True)
