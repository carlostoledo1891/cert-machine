#!/usr/bin/env python3
"""satpath.py — a second decision of "no independent k-set" in a circulant graph, sharing no code with the clique search.

Written for JeetuSK0808's R(3,33) graph (Zenodo 10.5281/zenodo.23552014), where the first path is orbital.c. This path
imports nothing from instruments/ramsey (no graph.py, clique.py, orbital.py, orbital.c): it reads the deposit's own edge
list (certificates/R3_33_n240_Z240.json, "blue_edges", inside the pinned zip) where the first path builds the graph
from the generators printed in the text, re-derives the symmetry itself, writes one CNF per cube, solves each with an
off-the-shelf SAT solver that writes a DRAT proof, and checks every UNSAT with drat-trim. Each step it relies on:

  GRAPH. n = 240 and the edge list E. Checked: no loops, no repeated edge, and E is circulant: with S = N(0), x ~ y
  exactly when (y - x) mod n ∈ S, for all n^2 pairs (so the translation x -> x + 1 is an automorphism and the group it
  generates is transitive). S = -S is then automatic for an undirected E.

  SYMMETRY. Every unit a mod n with a·S = S, found by trying all units (x -> a·x then preserves adjacency and fixes 0).
  The non-neighbours of 0 (other than 0) split into the orbits of these multipliers, numbered by smallest element;
  r_i = min O_i.

  CUBES (the lemma of orbital.py, restated, with the same proof: transitivity moves any independent k-set onto one
  through 0, and the multiplier that carries the first orbit it meets onto that orbit's representative keeps it there
  and keeps it off the earlier orbits). Cube i assumes x_0, x_(r_i), and ¬x_y for every y in O_1 ∪ ... ∪ O_(i-1). Every
  independent k-set is carried onto one satisfying some cube, so the formula is UNSAT for all cubes only if there is
  no independent k-set.

  CNF. x_v true = v in the set. For each edge uv: (¬x_u ∨ ¬x_v). "At least k of x_0 .. x_(n-1)": a sequential counter,
  s(i, j) = "at least j of the first i variables are true", with ¬s(i,j) ∨ s(i-1,j) ∨ x_i, ¬s(i,j) ∨ s(i-1,j) ∨
  s(i-1,j-1), s(0, j) false for j >= 1, and the unit s(n, k). (A satisfying assignment has at least k true x's by
  induction on i; an independent k-set gives one by setting s to the true counts.) The cube's literals as unit clauses.

  SOLVE AND CHECK. kissat (pinned by version and binary sha256) on each cube's CNF with a proof file; an UNSAT answer
  counts only when drat-trim (pinned by commit and source sha256) answers "s VERIFIED" on that CNF and that proof.
  A cube the solver does not finish, or whose proof is not checked, stays open; the path decides only when all close.

usage
  python3 instruments/ramsey/satpath.py --zip corpus/ramsey/jeetusk0808/r3_33_ramsey_certificate.zip --k 33 \\
      --out corpus/ramsey/runs/R_3_33_ge_241.sat --kissat PATH --drat-trim PATH [--cubes 0-30] [--limit S] [--jobs N]
  Each cube's outcome is written to OUT/cube-<i>.json as it finishes (a re-run skips the closed ones); OUT/summary.json
  is rewritten at the end.
"""
import sys, os, json, zipfile, hashlib, subprocess, time, tempfile, shutil
from math import gcd
from concurrent.futures import ThreadPoolExecutor

CERT = 'r3_33_bundle/certificates/R3_33_n240_Z240.json'


def die(m):
    sys.exit('satpath REFUSES: ' + m)


def sha_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def load_graph(zpath):
    c = json.loads(zipfile.ZipFile(zpath).read(CERT))
    n = int(c['n'])
    E = set()
    for a, b in c['blue_edges']:
        a, b = int(a), int(b)
        if not (0 <= a < n and 0 <= b < n) or a == b:
            die('an edge is out of range or a loop')
        e = (min(a, b), max(a, b))
        if e in E:
            die('a repeated edge')
        E.add(e)
    nb = [set() for _ in range(n)]
    for a, b in E:
        nb[a].add(b); nb[b].add(a)
    S = {(y - 0) % n for y in nb[0]}
    for x in range(n):
        for y in range(n):
            if (y in nb[x]) != (x != y and (y - x) % n in S):
                die('the edge list is not circulant at (%d, %d)' % (x, y))
    return n, E, nb, S


def symmetry(n, S, nb):
    mult = [a for a in range(1, n) if gcd(a, n) == 1 and {(a * s) % n for s in S} == S]
    non = [v for v in range(1, n) if v not in nb[0]]
    seen, orbits = set(), []
    for v in non:
        if v in seen:
            continue
        o = sorted({(a * v) % n for a in mult})
        if any(x in nb[0] or x == 0 for x in o):
            die('a multiplier orbit leaves the non-neighbours of 0')
        seen |= set(o)
        orbits.append(o)
    return mult, orbits


def cnf(n, E, k, units):
    """DIMACS text: x_v is variable v + 1; the counter's variables follow."""
    X = lambda v: v + 1
    nxt = [n]
    s = {}

    def sv(i, j):
        if (i, j) not in s:
            nxt[0] += 1
            s[(i, j)] = nxt[0]
        return s[(i, j)]
    cl = [[-X(a), -X(b)] for a, b in sorted(E)]
    for i in range(1, n + 1):
        for j in range(1, min(i, k) + 1):
            prev_j = [sv(i - 1, j)] if j <= i - 1 else []        # s(i-1, j) exists only for j <= i-1
            cl.append([-sv(i, j)] + prev_j + [X(i - 1)])
            if j >= 2:
                cl.append([-sv(i, j)] + prev_j + [sv(i - 1, j - 1)])
    cl.append([sv(n, k)])
    cl += [[u] for u in units]
    return 'p cnf %d %d\n' % (nxt[0], len(cl)) + ''.join(' '.join(map(str, c)) + ' 0\n' for c in cl)


def run_cube(i, rep, earlier, n, E, k, out, kissat, drat, limit):
    rec_path = os.path.join(out, 'cube-%d.json' % i)
    if os.path.exists(rec_path):
        r = json.load(open(rec_path))
        if r.get('verdict') == 'UNSAT-CHECKED':
            return r
    tmp = tempfile.mkdtemp(prefix='satcube-')
    f = os.path.join(tmp, 'c.cnf')
    pr = os.path.join(tmp, 'c.drat')
    units = [1, rep + 1] + [-(y + 1) for y in earlier]
    open(f, 'w').write(cnf(n, E, k, units))
    rec = {'cube': i, 'rep': rep, 'excluded': len(earlier), 'cnfSha256': sha_file(f)}
    t0 = time.time()
    args = [kissat, '-q', f, pr] + (['--time=%d' % limit] if limit else [])
    r = subprocess.run(args, capture_output=True, text=True)
    rec['solveSeconds'] = round(time.time() - t0, 1)
    rec['solverExit'] = r.returncode            # kissat: 10 SAT, 20 UNSAT, 0 unknown
    if r.returncode == 10:
        rec['verdict'] = 'SAT'
        rec['model'] = [int(t) for line in r.stdout.splitlines() if line.startswith('v') for t in line.split()[1:] if int(t) > 0 and int(t) <= n]
    elif r.returncode == 20:
        rec['proofBytes'] = os.path.getsize(pr)
        t1 = time.time()
        d = subprocess.run([drat, f, pr, '-t', '200000'], capture_output=True, text=True)
        rec['checkSeconds'] = round(time.time() - t1, 1)
        rec['checker'] = [l for l in d.stdout.splitlines() if l.startswith('s ')]
        rec['verdict'] = 'UNSAT-CHECKED' if 's VERIFIED' in rec['checker'] else 'UNSAT-UNCHECKED'
    else:
        rec['verdict'] = 'OPEN'
    shutil.rmtree(tmp, ignore_errors=True)
    json.dump(rec, open(rec_path, 'w'), indent=1)
    print('  cube %2d rep %3d: %s  solve %.0fs%s' % (i, rep, rec['verdict'], rec['solveSeconds'],
          ('  check %.0fs  proof %.1f MB' % (rec['checkSeconds'], rec['proofBytes'] / 1e6)) if 'checkSeconds' in rec else ''), flush=True)
    return rec


def main(argv):
    g = lambda flag, d=None: argv[argv.index(flag) + 1] if flag in argv else d
    zpath, k, out = g('--zip'), int(g('--k', 33)), g('--out')
    kissat, drat = g('--kissat'), g('--drat-trim')
    limit = int(g('--limit', 0))
    jobs = int(g('--jobs', 1))
    if not (zpath and out and kissat and drat):
        die('usage: see the docstring')
    os.makedirs(out, exist_ok=True)
    n, E, nb, S = load_graph(zpath)
    mult, orbits = symmetry(n, S, nb)
    sel = g('--cubes')
    idx = list(range(len(orbits)))
    if sel:
        a, b = (sel.split('-') + [sel])[:2]
        idx = [i for i in idx if int(a) <= i <= int(b)]
    earlier = []
    plan = []
    for i, o in enumerate(orbits):
        plan.append((i, o[0], list(earlier)))
        earlier += o
    kv = subprocess.run([kissat, '--version'], capture_output=True, text=True).stdout.strip()
    print('satpath: n=%d |E|=%d |S|=%d multipliers %s, %d orbits; k=%d; kissat %s' % (n, len(E), len(S), mult, len(orbits), k, kv), flush=True)
    with ThreadPoolExecutor(max_workers=jobs) as ex:
        recs = list(ex.map(lambda p: run_cube(p[0], p[1], p[2], n, E, k, out, kissat, drat, limit), [plan[i] for i in idx]))
    allrecs = []
    for i in range(len(orbits)):
        p = os.path.join(out, 'cube-%d.json' % i)
        allrecs.append(json.load(open(p)) if os.path.exists(p) else {'cube': i, 'verdict': 'NOT RUN'})
    summ = {'n': n, 'edges': len(E), 'k': k, 'multipliers': mult, 'orbits': [len(o) for o in orbits], 'reps': [o[0] for o in orbits],
            'solver': {'name': 'kissat', 'version': kv, 'sha256': sha_file(os.path.realpath(kissat))},
            'checker': {'name': 'drat-trim', 'sha256': sha_file(os.path.realpath(drat))},
            'cubes': [{x: r.get(x) for x in ('cube', 'rep', 'verdict', 'solveSeconds', 'checkSeconds', 'proofBytes')} for r in allrecs],
            'closed': sum(1 for r in allrecs if r['verdict'] == 'UNSAT-CHECKED'),
            'sat': [r['cube'] for r in allrecs if r['verdict'] == 'SAT']}
    summ['decided'] = 'NONE' if summ['closed'] == len(orbits) else ('FOUND' if summ['sat'] else 'OPEN')
    json.dump(summ, open(os.path.join(out, 'summary.json'), 'w'), indent=1)
    print('satpath: %d of %d cubes UNSAT with checked proofs; %s' % (summ['closed'], len(orbits), summ['decided']))


if __name__ == '__main__':
    main(sys.argv[1:])
