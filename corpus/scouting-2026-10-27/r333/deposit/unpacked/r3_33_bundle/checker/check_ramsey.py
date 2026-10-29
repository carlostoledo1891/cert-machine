"""Independent checker for a (3,k)-Ramsey graph certificate (no code shared with the search).
Certificate JSON: {"k": k, "n": n, "blue_edges": [[u,v],...] (0-based),
                   optional "group_table": n x n multiplication table (0-based) for vertex-transitivity}.
Proves: (1) blue graph is triangle-free; (2) blue graph has no independent set of size k
(= red complement has no K_k). Then K_n is 2-coloured with no blue K_3 and no red K_k, so R(3,k) >= n+1.
If group_table is given, it is verified to be a group whose left multiplications are automorphisms of the
blue graph (so the graph is vertex-transitive) and the clique search is rooted at vertex 0; --full skips that.
Usage: python3 check_ramsey.py cert.json [--full]"""
import sys, json, subprocess, os, itertools, time
cert = json.load(open(sys.argv[1])); full = '--full' in sys.argv
k, n = cert['k'], cert['n']
adj = [[False] * n for _ in range(n)]
for u, v in cert['blue_edges']:
    assert 0 <= u < n and 0 <= v < n and u != v, 'bad edge'
    adj[u][v] = adj[v][u] = True
# (1) triangle-free
for u in range(n):
    Nu = [v for v in range(n) if adj[u][v]]
    for a, b in itertools.combinations(Nu, 2):
        assert not adj[a][b], f'blue triangle {u},{a},{b}'
print(f'[ok] blue graph on {n} vertices, {sum(map(sum, adj))//2} edges, triangle-free', flush=True)
root = -1
if 'group_table' in cert and not full:
    T = cert['group_table']; assert len(T) == n and all(sorted(r) == list(range(n)) for r in T), 'not a Latin square'
    e = next(i for i in range(n) if T[i] == list(range(n)))
    for a in range(n):
        for b in range(n):
            Tab = T[a][b]
            for c in range(n):
                if T[Tab][c] != T[a][T[b][c]]: raise SystemExit('not associative')
    for g in range(n):
        for u in range(n):
            for v in range(u + 1, n):
                if adj[u][v] != adj[T[g][u]][T[g][v]]: raise SystemExit(f'left mult by {g} is not an automorphism')
    print(f'[ok] group table verified (identity {e}); all {n} left multiplications are graph automorphisms -> vertex-transitive')
    root = 0
# (2a) optional orbital branching with a verified stabilizer of vertex 0
if root == 0 and 'stabilizer_generators' in cert and '--no-orbital' not in sys.argv:
    gens = cert['stabilizer_generators']
    for p in gens:
        assert sorted(p) == list(range(n)) and p[0] == 0, 'generator must be a permutation fixing 0'
        for u in range(n):
            for v in range(u + 1, n):
                if adj[u][v] != adj[p[u]][p[v]]: raise SystemExit('stabilizer generator is not an automorphism')
    print(f'[ok] {len(gens)} stabilizer generators verified (automorphisms fixing vertex 0)')
    non = [v for v in range(1, n) if not adj[0][v]]
    orb_of = {}; orbits = []
    for v in non:
        if v in orb_of: continue
        comp = [v]; orb_of[v] = len(orbits); stack = [v]
        while stack:
            x = stack.pop()
            for p in gens:
                y = p[x]
                if y not in orb_of: orb_of[y] = len(orbits); comp.append(y); stack.append(y)
        orbits.append(sorted(comp))
    print(f'[..] {len(orbits)} orbits of the stabilizer on the {len(non)} non-neighbours of 0; one subproblem each')
    exe = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bin', 'mcq')
    from concurrent.futures import ThreadPoolExecutor
    # Subproblem i: red K_k containing 0 and r_i, avoiding orbits < i.  Split further by the clique's
    # lowest-indexed vertex v (in sorted order of the allowed set): clique = {0, r_i, v} + (k-3) vertices after v.
    jobs = []
    for i, o in enumerate(orbits):
        r = o[0]; earlier = {x for oo in orbits[:i] for x in oo}
        allowed = sorted(x for x in non if x != r and not adj[r][x] and x not in earlier)
        for j, v in enumerate(allowed):
            cand = [u for u in allowed[j + 1:] if not adj[v][u]]
            if len(cand) >= k - 3: jobs.append((i, v, cand))
    jobs.sort(key=lambda t: -len(t[2]))
    print(f'[..] {len(jobs)} clique jobs (MCQ, target {k-3} each), largest first', flush=True)
    def sub(job):
        i, v, cand = job; m = len(cand)
        mat = '\n'.join(''.join('1' if (a != b and not adj[cand[a]][cand[b]]) else '0' for b in range(m)) for a in range(m))
        out = subprocess.run([exe], input=f'{m}\n{mat}\n{k-3}\n', capture_output=True, text=True).stdout.strip()
        if out != 'NOCLIQUE': print(f'     FOUND in orbit {i}, v={v}: {out[:80]}', flush=True)
        return out
    t0 = time.time()
    with ThreadPoolExecutor(int(os.environ.get('PAR', '4'))) as ex:
        outs = list(ex.map(sub, jobs))
    print(f'[..] all jobs finished in {time.time()-t0:.0f}s', flush=True)
    ok = all(o == 'NOCLIQUE' for o in outs)
    print(f'[{"ok" if ok else "FAIL"}] no red K_{k} through vertex 0 (orbital branching, {len(orbits)} subproblems)')
    if not ok: sys.exit(1)
    print(f'VERIFIED: 2-colouring of K_{n} with no blue K_3 and no red K_{k}  =>  R(3,{k}) >= {n+1}')
    sys.exit(0)
# (2) no independent k-set: search red (complement) graph for K_k
red = '\n'.join(''.join('1' if (i != j and not adj[i][j]) else '0' for j in range(n)) for i in range(n))
exe = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bin', 'rd_clique')
t0 = time.time()
r = subprocess.run([exe], input=f'{n}\n{red}\n{k} {root}\n', capture_output=True, text=True)
out = r.stdout.strip()
print(f'[{"ok" if out == "NOCLIQUE" else "FAIL"}] red K_{k} search ({"rooted at vertex 0" if root == 0 else "full"}): {out} ({time.time()-t0:.1f}s)')
if out == 'NOCLIQUE':
    print(f'VERIFIED: 2-colouring of K_{n} with no blue K_3 and no red K_{k}  =>  R(3,{k}) >= {n+1}')
else:
    sys.exit(1)
