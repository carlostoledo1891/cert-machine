"""Split one orbital subproblem (cliques of size k in red graph through 0 and r, avoiding excluded vertices)
by the lowest-index third vertex v. Usage: split_check.py <blue.clq> <k> <excl_file_of_subproblem> <r_0based> <outdir> <par>"""
import sys, os, subprocess, json
from concurrent.futures import ThreadPoolExecutor
f, k, ef, r, outdir, par = sys.argv[1], int(sys.argv[2]), sys.argv[3], int(sys.argv[4]), sys.argv[5], int(sys.argv[6])
os.makedirs(outdir, exist_ok=True)
lines = [l.split() for l in open(f)]; n = int(lines[0][2])
blue = [set() for _ in range(n)]
for l in lines:
    if l[0] == 'e': u, v = int(l[1]) - 1, int(l[2]) - 1; blue[u].add(v); blue[v].add(u)
excl = {int(x) - 1 for x in open(ef).read().split()}
common = [x for x in range(n) if x not in excl and x not in (0, r) and x not in blue[0] and x not in blue[r]]
print('common', len(common), flush=True)
CLQ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bin', os.environ.get('CLQBIN', 'clq2'))
def job(j):
    v = common[j]
    allowed = {u for u in common[j + 1:] if u not in blue[v]}
    if len(allowed) < k - 3: return (j, v, 'SKIP', '')
    xf = os.path.join(outdir, f'x_{j}.txt')
    open(xf, 'w').write(' '.join(str(x + 1) for x in range(n) if x not in allowed))
    p = subprocess.run([CLQ, f, str(k - 3), xf, '-1', 'c'], capture_output=True, text=True)
    os.remove(xf)
    res = (j, v, p.stdout.strip()[:60], p.stderr.strip())
    open(os.path.join(outdir, 'res.txt'), 'a').write(json.dumps(res) + '\n')
    return res
with ThreadPoolExecutor(par) as ex:
    res = list(ex.map(job, range(len(common))))
bad = [x for x in res if x[2].startswith('FOUND')]
print('RESULT', 'FOUND' if bad else 'NONE', bad[:1], flush=True)
