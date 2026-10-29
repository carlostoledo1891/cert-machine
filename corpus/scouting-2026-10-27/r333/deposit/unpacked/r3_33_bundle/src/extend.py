"""One-vertex extension search for circulant (3,k)-Ramsey graphs (CEGAR).
Red graph R (no K_k) is the stored .clq graph; blue graph G = complement (triangle-free).
Add a new vertex w, blue-adjacent exactly to a set I. Valid iff
  (a) I is blue-independent (= red clique)  -> blue stays triangle-free;
  (b) R - I has no red clique of size k-1   -> red stays K_k-free.
Loop: CP-SAT proposes I hitting every known red (k-1)-clique (plus all rotations/reflections),
clq checks (b); a found clique is added as a counterexample.
Usage: extend.py <cert.clq> <k> <outdir> [time_limit_s]"""
import sys, os, subprocess, time, json
from ortools.sat.python import cp_model

cert, k, outdir = sys.argv[1], int(sys.argv[2]), sys.argv[3]
tlim = float(sys.argv[4]) if len(sys.argv) > 4 else 36000
os.makedirs(outdir, exist_ok=True)
CLQ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bin', 'clq')
red = set(); n = 0
for line in open(cert):
    if line.startswith('p'): n = int(line.split()[2])
    elif line.startswith('e'):
        u, v = map(int, line.split()[1:3]); red.add((min(u, v) - 1, max(u, v) - 1))
blue_edges = [(u, v) for u in range(n) for v in range(u + 1, n) if (u, v) not in red]
log = open(os.path.join(outdir, 'log.txt'), 'a')
def say(*a):
    s = ' '.join(map(str, a)); print(s, flush=True); log.write(s + '\n'); log.flush()

def orbit(S):
    out = set()
    for r in range(n):
        out.add(tuple(sorted((v + r) % n for v in S)))
        out.add(tuple(sorted((-v + r) % n for v in S)))
    return out

F = set()
t0 = time.time(); it = 0
excl = os.path.join(outdir, 'excl.txt')
while time.time() - t0 < tlim:
    it += 1
    m = cp_model.CpModel()
    x = [m.NewBoolVar(f'x{v}') for v in range(n)]
    for u, v in blue_edges: m.Add(x[u] + x[v] <= 1)
    m.Add(x[0] == 1)  # vertex-transitivity: WLOG 0 in I
    for S in F: m.AddBoolOr([x[v] for v in S])
    m.Maximize(sum(x))
    s = cp_model.CpSolver(); s.parameters.max_time_in_seconds = 20; s.parameters.num_workers = 2
    st = s.Solve(m)
    if st == cp_model.INFEASIBLE:
        say(f'INFEASIBLE after {it} iters, |F|={len(F)}: no one-vertex extension of this graph exists'); break
    if st not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        say('cp-sat status', s.StatusName(st)); continue
    I = [v for v in range(n) if s.Value(x[v])]
    with open(excl, 'w') as f: f.write(' '.join(str(v + 1) for v in I))
    r = subprocess.run([CLQ, cert, str(k - 1), excl], capture_output=True, text=True)
    out = r.stdout.split()
    if out[0] == 'NONE':
        say(f'SUCCESS iter {it}: I size {len(I)} = {[v+1 for v in I]}  ({r.stderr.strip()})')
        json.dump({'cert': cert, 'k': k, 'n': n, 'I_1based': [v + 1 for v in I]}, open(os.path.join(outdir, 'success.json'), 'w'))
        break
    S = [int(v) - 1 for v in out[1:]]
    F |= orbit(S)
    if it % 10 == 1: say(f'it {it} |I|={len(I)} |F|={len(F)} t={time.time()-t0:.0f}s {r.stderr.strip()}')
