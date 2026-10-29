"""Search for linear [n,k,d]_q codes (q prime) with a prescribed cyclic automorphism group <A> <= GL(k,q).
Columns of a generator matrix = multiset of points of PG(k-1,q); weight of codeword y^T G = n - #{columns on hyperplane y^perp}.
So d >= D iff every hyperplane contains <= n-D columns. With <A> acting, choose unions of point orbits (CP-SAT).
Usage: codes_search.py q k targets.json outdir tlimit_s seed
targets.json: list of [n, d_target]."""
import sys, os, json, time, itertools
import numpy as np
from ortools.sat.python import cp_model
q, k = int(sys.argv[1]), int(sys.argv[2])
targets = json.load(open(sys.argv[3])); outdir = sys.argv[4]; tlim = float(sys.argv[5]); seed = int(sys.argv[6])
os.makedirs(outdir, exist_ok=True)
rng = np.random.default_rng(seed)
inv = [0] + [pow(a, q - 2, q) for a in range(1, q)]
# projective points: first nonzero coordinate = 1
pts = []
for v in itertools.product(range(q), repeat=k):
    nz = [x for x in v if x]
    if nz and nz[0] == 1: pts.append(v)
P = np.array(pts, dtype=np.int64); NP = len(P)
pw = q ** np.arange(k - 1, -1, -1)
def norm(V):
    V = V % q
    first = np.argmax(V != 0, axis=1)
    lead = V[np.arange(len(V)), first]
    s = np.array(inv)[lead]
    return (V * s[:, None]) % q
index = {}
codes = (P * pw).sum(1)
lookup = -np.ones(q ** k, dtype=np.int64); lookup[codes] = np.arange(NP)
def act(M, V):
    W = norm(V @ M.T)
    return lookup[(W * pw).sum(1)]
INC = ((P @ P.T) % q == 0)   # INC[h, p]: point p on hyperplane with normal h
log = open(os.path.join(outdir, 'log.txt'), 'a')
def say(*a):
    t = ' '.join(map(str, a)); print(t, flush=True); log.write(t + '\n'); log.flush()
def rand_gl():
    while True:
        A = rng.integers(0, q, (k, k))
        # rank via elimination mod q
        M = A.copy() % q; r = 0
        for c in range(k):
            piv = next((i for i in range(r, k) if M[i, c]), None)
            if piv is None: continue
            M[[r, piv]] = M[[piv, r]]; M[r] = (M[r] * inv[M[r, c]]) % q
            for i in range(k):
                if i != r and M[i, c]: M[i] = (M[i] - M[i, c] * M[r]) % q
            r += 1
        if r == k: return A
t0 = time.time(); tried = 0
remaining = {tuple(t) for t in targets}
while time.time() - t0 < tlim and remaining:
    A = rand_gl()
    perm = act(A, P)
    # order of the permutation (projective order of A)
    seen = np.zeros(NP, bool); orbits = []
    for p in range(NP):
        if not seen[p]:
            o = []; x = p
            while not seen[x]: seen[x] = True; o.append(x); x = perm[x]
            orbits.append(o)
    no = len(orbits)
    if no < 8 or no > int(os.environ.get('MAXORB', '400')): continue
    tried += 1
    sizes = np.array([len(o) for o in orbits])
    # hyperplane orbits: hyperplanes are permuted by A^{-T}; take one rep per orbit of the dual action.
    # Simpler: use all hyperplanes but dedupe identical incidence rows.
    Mx = np.zeros((NP, no), dtype=np.int64)
    for j, o in enumerate(orbits): Mx[:, j] = INC[:, o].sum(1)
    Mx = np.unique(Mx, axis=0)
    for (n, d) in sorted(remaining):
        m = cp_model.CpModel()
        mult = int(os.environ.get('MULT', '1'))
        x = [m.NewIntVar(0, mult, f'x{j}') for j in range(no)]
        m.Add(sum(int(sizes[j]) * x[j] for j in range(no)) == n)
        for row in Mx:
            m.Add(sum(int(row[j]) * x[j] for j in range(no) if row[j]) <= n - d)
        s = cp_model.CpSolver(); s.parameters.max_time_in_seconds = float(os.environ.get('SOLVE_T', '20')); s.parameters.num_workers = 1
        st = s.Solve(m)
        if st in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            cols = []
            for j in range(no):
                for _ in range(s.Value(x[j])): cols += [P[p].tolist() for p in orbits[j]]
            G = np.array(cols).T
            say(f'FOUND [{n},{k},{d}]_{q} after {tried} groups ({time.time()-t0:.0f}s), {no} orbits')
            json.dump({'q': q, 'n': n, 'k': k, 'd_claimed': d, 'G': G.tolist(), 'A': A.tolist()}, open(os.path.join(outdir, f'found_{n}_{k}_{d}_q{q}.json'), 'w'))
            remaining.discard((n, d))
    if tried % 20 == 0: say(f'tried {tried} groups, {time.time()-t0:.0f}s, remaining {len(remaining)}')
say(f'END tried {tried} remaining {sorted(remaining)}')
