#!/usr/bin/env python3
"""cert-machine's own decider for one R(7) configuration (2026-11-22). Written from the statement; the tracks' search
and CNF code (r7complete.c, r7cnf.c, Chen's r7_glue.py) were not read. Only the DATA layout of configs.bin is used:
record idx = five uint16 (core, a1, a2, b1, b2), the sides as indices into the independent 6-sets of the core in
lexicographic DFS order (checked: our order reproduces the masks printed in the track's k10.tsv.sol).

The question for a configuration (core X, side rows A1, A2, B1, B2) and a bound K: are there seven C rows such that
the 40-vertex graph  X + u + w + C(7) + A(2) + B(2)  with edges X, u-C, u-A, w-C, w-B, A-B complete, rows = the
X-neighbourhoods, is 9-regular, triangle-free and has no independent set larger than K?

CNF: y[j][x] = [x in C row j].
  rows independent in X; each x in exactly r'(x) = 9 - deg_X(x) - (side rows containing x) rows;
  for every independent I of X and each side Q: (C rows disjoint from I) <= K - |I| - (Q rows disjoint from I),
  written as: every (t+1)-subset of the rows has a row meeting I. The conditions without C rows
  (|I| + 1 + Q rows disjoint from I <= K, |I| + 2 <= K) are checked directly.
  Symmetry: the rows are interchangeable, so the vertex with the largest r' is put in the first r' rows.
A SAT model is decoded to the 40-vertex graph and checked directly (degrees, triangles, exact alpha).
An UNSAT answer comes with an LRAT proof checked by Heule's lrat-check.

Usage: r7own.py CORES.g6 CONFIGS.bin K LIMIT_S OUT.tsv idx [idx ...]
"""
import itertools, os, struct, subprocess, sys, tempfile, time

LRATCHECK = os.environ.get("LRATCHECK", "/private/tmp/claude-501/-Users-carlostoledo-Projects-cert-machine/c023a269-07c9-4e3b-86a9-7a5bd283b137/scratchpad/bundle/lrat-check")
NX = 27


def dec(s):
    d = [ord(c) - 63 for c in s.strip()]; n = d[0]; bits = []
    for x in d[1:]:
        bits += [(x >> (5 - i)) & 1 for i in range(6)]
    adj = [0] * n; k = 0
    for j in range(1, n):
        for i in range(j):
            if bits[k]:
                adj[i] |= 1 << j; adj[j] |= 1 << i
            k += 1
    return n, adj


def indep_sets(n, adj):
    out = []
    def rec(start, mask, cand):
        out.append(mask)
        c = cand >> start; v = start
        while c:
            if c & 1:
                rec(v + 1, mask | (1 << v), cand & ~adj[v] & ~((2 << v) - 1))
            c >>= 1; v += 1
    rec(0, 0, (1 << n) - 1)
    return out


def alpha(n, adj):
    best = 0
    def rec(cand, size):
        nonlocal best
        if not cand:
            best = max(best, size); return
        if size + bin(cand).count("1") <= best:
            return
        v = (cand & -cand).bit_length() - 1
        rec(cand & ~adj[v] & ~(1 << v), size + 1)
        rec(cand & ~(1 << v), size)
    rec((1 << n) - 1, 0)
    return best


def build_graph(xadj, crow, arow, brow):
    """Vertices: X 0..26, u 27, w 28, C 29..35, A 36,37, B 38,39."""
    n = 40; adj = [0] * n
    def edge(a, b):
        adj[a] |= 1 << b; adj[b] |= 1 << a
    for x in range(NX):
        for y in range(x + 1, NX):
            if (xadj[x] >> y) & 1:
                edge(x, y)
    for j in range(7):
        edge(27, 29 + j); edge(28, 29 + j)
    for i in range(2):
        edge(27, 36 + i); edge(28, 38 + i)
        for k in range(2):
            edge(36 + i, 38 + k)
    for j, r in enumerate(crow):
        for x in range(NX):
            if (r >> x) & 1:
                edge(29 + j, x)
    for i, r in enumerate(arow):
        for x in range(NX):
            if (r >> x) & 1:
                edge(36 + i, x)
    for i, r in enumerate(brow):
        for x in range(NX):
            if (r >> x) & 1:
                edge(38 + i, x)
    return n, adj


def direct_check(n, adj):
    degs = sorted({bin(a).count("1") for a in adj})
    tri = sum(1 for u in range(n) for v in range(u + 1, n) if (adj[u] >> v) & 1 and adj[u] & adj[v])
    return degs, tri, alpha(n, adj)


def decide(cores, cache, rec, K, limit, workdir):
    core, a1, a2, b1, b2 = rec
    n, xadj = cores[core]
    if core not in cache:
        ind = indep_sets(n, xadj)
        s6 = [m for m in ind if bin(m).count("1") == 6]   # DFS order is kept by the filter
        cache[core] = (ind, s6)
    ind, s6 = cache[core]
    A = [s6[a1], s6[a2]]; B = [s6[b1], s6[b2]]
    # the configuration's own conditions
    assert not ((A[0] | A[1]) & (B[0] | B[1])), "side unions meet (a triangle)"
    rp = []
    for x in range(NX):
        cnt = sum((r >> x) & 1 for r in A + B)
        rp.append(9 - bin(xadj[x]).count("1") - cnt)
    assert min(rp) >= 0 and sum(rp) == 49
    var = lambda j, x: 1 + NX * j + x
    clauses = []
    fixed_fail = None
    for x in range(NX):
        if rp[x] == 0:
            clauses += [[-var(j, x)] for j in range(7)]
    for j in range(7):
        for x in range(NX):
            for y in range(x + 1, NX):
                if (xadj[x] >> y) & 1:
                    clauses.append([-var(j, x), -var(j, y)])
    rows7 = range(7)
    for x in range(NX):
        if rp[x] == 0:
            continue
        for sub in itertools.combinations(rows7, rp[x] + 1):
            clauses.append([-var(j, x) for j in sub])
        for sub in itertools.combinations(rows7, 7 - rp[x] + 1):
            clauses.append([var(j, x) for j in sub])
    subsets = {t: list(itertools.combinations(rows7, t + 1)) for t in range(7)}
    for I in ind:
        size = bin(I).count("1")
        if size + 2 > K:
            fixed_fail = "|I|+2"
        xs = [x for x in range(NX) if (I >> x) & 1 and rp[x] > 0]
        for Q, other in ((A, B), (B, A)):
            miss = sum(1 for r in Q if not (r & I))
            if size + 1 + sum(1 for r in other if not (r & I)) > K:
                fixed_fail = "root+side"
            t = K - size - miss
            if t >= 7:
                continue
            if t < 0:
                fixed_fail = "side alone"; continue
            for sub in subsets[t]:
                clauses.append([var(j, x) for j in sub for x in xs])
    x0 = max(range(NX), key=lambda x: (rp[x], -x))
    for j in range(7):
        clauses.append([var(j, x0) if j < rp[x0] else -var(j, x0)])
    if fixed_fail:
        return {"verdict": "UNSAT-fixed-part", "why": fixed_fail}
    cnf = os.path.join(workdir, "c.cnf"); lrat = os.path.join(workdir, "c.lrat")
    with open(cnf, "w") as f:
        f.write(f"p cnf {7 * NX} {len(clauses)}\n")
        f.write("".join(" ".join(map(str, c)) + " 0\n" for c in clauses))
    t0 = time.time()
    r = subprocess.run(["cadical", "-q", "-t", str(limit), "--lrat", "--binary=false", cnf, lrat], capture_output=True, text=True)
    out = {"clauses": len(clauses), "solve_s": round(time.time() - t0, 2)}
    if r.returncode == 10:
        model = set()
        for line in r.stdout.splitlines():
            if line.startswith("v "):
                model.update(int(t) for t in line.split()[1:])
        crow = [sum(1 << x for x in range(NX) if var(j, x) in model) for j in range(7)]
        n40, adj40 = build_graph(xadj, crow, A, B)
        degs, tri, al = direct_check(n40, adj40)
        out.update(verdict="SAT", degrees=degs, triangles=tri, alpha=al,
                   direct_ok=(degs == [9] and tri == 0 and al <= K), rows=",".join("%07x" % m for m in crow))
    elif r.returncode == 20:
        ck = subprocess.run([LRATCHECK, cnf, lrat], capture_output=True, text=True)
        out.update(verdict="UNSAT", lrat_bytes=os.path.getsize(lrat), lratcheck="VERIFIED" if "c VERIFIED" in ck.stdout.splitlines() else "NOT VERIFIED")
    else:
        out.update(verdict="UNKNOWN")
    for f in (cnf, lrat):
        if os.path.exists(f):
            os.remove(f)
    return out


def main():
    cores_path, cfg_path, K, limit, out_path = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
    cores = [dec(l) for l in open(cores_path) if l.strip()]
    cache = {}
    workdir = tempfile.mkdtemp(prefix="r7own-")
    with open(cfg_path, "rb") as f, open(out_path, "a") as out:
        for idx in map(int, sys.argv[6:]):
            f.seek(idx * 10)
            rec = struct.unpack("<5H", f.read(10))
            res = decide(cores, cache, rec, K, limit, workdir)
            line = "\t".join([str(idx), str(K), str(rec[0])] + [f"{k}={v}" for k, v in res.items()])
            out.write(line + "\n"); out.flush()
            print(line, flush=True)
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
