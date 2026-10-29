"""Cayley-graph search for (3,k)-Ramsey graphs by CEGAR with an incremental SAT solver.
Blue graph Cay(G,S) (S = S^-1, e not in S) must be triangle-free; red = complement must have no K_k.
Variables: one per inverse-class {s, s^-1}. Triangle-freeness: for s1*s2 = s3 (all in S) forbidden -> clauses.
Counterexamples: a red k-clique C containing e (blue-independent k-set) -> clause OR_{x!=y in C} [x^-1 y in S].
Usage: cayley_sat.py <group> <k> <outdir> [time_limit_s]
group: Z<n> | Z<a>xZ<b>[xZ<c>] | M<m>_<n>_<r> (Z_m semidirect Z_n, b acts by a -> r*a) | D<m> (= M<m>_2_<m-1>)"""
import sys, os, re, time, json, subprocess, itertools
import numpy as np
from pysat.solvers import Solver

def make_group(spec):
    if spec.startswith('D'):
        m = int(spec[1:]); spec = f'M{m}_2_{m-1}'
    if spec.startswith('M'):
        m, n, r = map(int, spec[1:].split('_'))
        assert pow(r, n, m) == 1 % m, 'r^n must be 1 mod m'
        els = [(a, b) for b in range(n) for a in range(m)]
        idx = {g: i for i, g in enumerate(els)}
        rp = [pow(r, b, m) for b in range(n)]
        mul = np.array([[idx[((a + rp[b] * c) % m, (b + d) % n)] for (c, d) in els] for (a, b) in els], dtype=np.int32)
        return mul, []
    mods = [int(x) for x in re.findall(r'Z(\d+)', spec)]
    els = list(itertools.product(*[range(q) for q in mods]))
    idx = {g: i for i, g in enumerate(els)}
    mul = np.array([[idx[tuple((x + y) % q for x, y, q in zip(g, h, mods))] for h in els] for g in els], dtype=np.int32)
    from math import gcd
    units = [[u for u in range(1, q) if gcd(u, q) == 1] or [0] for q in mods]
    auts = []
    for us in itertools.product(*units):
        if all(u == 1 or (q == 1) for u, q in zip(us, mods)): continue
        auts.append(np.array([idx[tuple((u * x) % q for u, x, q in zip(us, g, mods))] for g in els], dtype=np.int64))
    return mul, auts

def main():
    spec, k, outdir = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    tlim = float(sys.argv[4]) if len(sys.argv) > 4 else 36000
    os.makedirs(outdir, exist_ok=True)
    CLQ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bin', 'clq2')
    mul, auts = make_group(spec); n = len(mul)
    e = int(np.where((mul == np.arange(n)[None, :]).all(axis=1))[0][0])
    inv = np.array([int(np.where(mul[g] == e)[0][0]) for g in range(n)])
    # inverse classes -> SAT variables 1..V
    cls = -np.ones(n, dtype=int); V = 0
    for g in range(n):
        if g != e and cls[g] < 0:
            V += 1; cls[g] = V; cls[inv[g]] = V
    s = Solver(name='cadical153')
    seen = set()
    for a in range(n):
        if a == e: continue
        for b in range(n):
            if b == e: continue
            c = mul[a, b]
            if c == e: continue
            cl = tuple(sorted({int(cls[a]), int(cls[b]), int(cls[c])}))
            if cl not in seen:
                seen.add(cl); s.add_clause([-int(v) for v in cl])
    log = open(os.path.join(outdir, 'log.txt'), 'a')
    def say(*x):
        t = ' '.join(map(str, x)); print(t, flush=True); log.write(t + '\n'); log.flush()
    say(f'group {spec} order {n} auts {len(auts)} vars {V} tri-clauses {len(seen)} k={k}')
    gfile = os.path.join(outdir, 'red.clq')
    # left-mult: x^-1 y
    t0 = time.time(); it = 0
    while time.time() - t0 < tlim:
        it += 1
        if not s.solve():
            say(f'UNSAT after {it} iters ({time.time()-t0:.0f}s): no Cayley (3,{k})-graph on {spec}'); return
        model = s.get_model()
        inS = np.zeros(V + 1, dtype=bool)
        for lit in model[:V]:
            if lit > 0: inS[lit] = True
        Sarr = np.array([g for g in range(n) if g != e and inS[cls[g]]], dtype=np.int64)
        tgt = mul[:, Sarr]
        src = np.repeat(np.arange(n), len(Sarr))
        dst = tgt.ravel()
        keep = src < dst
        with open(gfile, 'w') as f:
            f.write(f'p edge {n} {int(keep.sum())}\n')
            f.write(''.join(f'e {u+1} {v+1}\n' for u, v in zip(src[keep].tolist(), dst[keep].tolist())))
        r = subprocess.run([CLQ, gfile, str(k), '-', str(e + 1), 'c'], capture_output=True, text=True)
        out = r.stdout.split()
        if out[0] == 'NONE':
            S = [g for g in range(n) if g != e and inS[cls[g]]]
            say(f'FOUND iter {it} ({time.time()-t0:.0f}s): |S|={len(S)} {r.stderr.strip()}')
            json.dump({'group': spec, 'k': k, 'order': n, 'S': S, 'mul_spec': spec}, open(os.path.join(outdir, 'found.json'), 'w'))
            os.replace(gfile, os.path.join(outdir, f'found_blue_{spec}_k{k}.clq'))
            return
        C = [int(v) - 1 for v in out[1:]]
        D = np.array(sorted({int(mul[inv[x], y]) for x in C for y in C if x != y}), dtype=np.int64)
        s.add_clause(sorted({int(c) for c in cls[D]}))
        for a in auts:
            s.add_clause(sorted({int(c) for c in cls[a[D]]}))
        if it % 200 == 0: say(f'it {it} t={time.time()-t0:.0f}s |S|~{int(inS.sum())}')
    say(f'TIMEOUT after {it} iters')

if __name__ == '__main__':
    main()
