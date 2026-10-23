#!/usr/bin/env python3
"""The Ramsey ledger: every lower-bound graph Google released with AlphaEvolve, decided here.

A file "R(s, t) >= m" (corpus/ramsey/alphaevolve/graphs/R_s_t_ge_m.txt, pinned in PINS.json) claims a graph on m − 1
vertices with no clique of size s and no independent set of size t; that graph proves R(s, t) ≥ m. Each claim has two
sides: K (cliques of size s in the graph) and I (cliques of size t in its complement). A side is decided by the
exhaustive search of instruments/ramsey (clique.c, held root by root to the reference clique.py). The words:

  CERTIFIED   both sides searched to the end, nothing found: the file proves the bound
  REFUTED     a clique or an independent set of the forbidden size was found; it is printed, and re-checked here edge
              by edge without the search — the file does not prove the bound (the bound itself may still hold)
  REFUSED     a side has not been searched to the end within the time spent; rootsDone says how far

Where both implementations finish (n ≤ REF_MAX), the Python reference runs too and its per-root node counts must equal
the C kernel's, or the row refuses. Long searches keep their progress in corpus/ramsey/runs/<file>.<side>.progress
("rank nodes", one line per finished root), so a stopped run resumes and the finished roots are on record.

usage
  python3 tools/run-ramsey-ledger.py [--budget SECONDS] [--threads N] [--only R_8_12_ge_511,...]
        decide every claim, spending at most SECONDS per unfinished side (default 300; progress resumes), write
        certs/ramsey-ledger.json
  python3 tools/run-ramsey-ledger.py --check
        the battery: the pins, every graph's format, the reference and the kernel re-run where both are quick, and the
        recorded long searches re-read from their progress files; refuses unless the ledger is what they give now
"""
import sys, os, json, hashlib, subprocess, shutil, tempfile, time, platform, random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'instruments', 'ramsey')
sys.path.insert(0, SRC)
import graph, clique  # noqa: E402

CORPUS = os.path.join(ROOT, 'corpus', 'ramsey', 'alphaevolve')
RUNS = os.path.join(ROOT, 'corpus', 'ramsey', 'runs')
OUT = os.path.join(ROOT, 'certs', 'ramsey-ledger.json')
REF_MAX = 250           # the build runs the Python reference beside the kernel on every graph up to this many vertices
CHECK_C_MAX = 300       # --check re-runs the C kernel on graphs up to this many vertices (seconds each), and the
                        # reference on their K sides up to REF_CHECK_MAX
REF_CHECK_MAX = 175


def die(m):
    sys.exit('ramsey-ledger REFUSES: ' + m)


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def pins():
    P = json.load(open(os.path.join(CORPUS, 'PINS.json')))
    for rel, f in P['files'].items():
        p = os.path.join(CORPUS, rel)
        if not os.path.exists(p):
            die(rel + ' is missing')
        if sha(p) != f['sha256']:
            die(rel + ' is not the pinned bytes')
    return P


def compile_kernel(tmp):
    cc = shutil.which('cc') or shutil.which('clang') or shutil.which('gcc') or die('no C compiler')
    exe = os.path.join(tmp, 'clique')
    subprocess.run([cc, '-O2', '-o', exe, os.path.join(SRC, 'clique.c'), '-lpthread'], check=True, capture_output=True)
    ver = subprocess.run([cc, '--version'], capture_output=True, text=True).stdout.split('\n')[0]
    return exe, ver


def matrix(A, n, k):
    return '%d %d\n%s\n' % (n, k, '\n'.join(''.join('1' if A[i] >> j & 1 else '0' for j in range(n)) for i in range(n)))


def run_c(exe, A, n, k, threads, seconds=0, progress=None, rootfile=None):
    args = [exe, '-t', str(threads)]
    if seconds:
        args += ['-s', str(seconds)]
    if progress:
        args += ['-d', progress]
    if rootfile:
        args += ['-r', rootfile]
    r = subprocess.run(args, input=matrix(A, n, k), capture_output=True, text=True)
    if r.returncode != 0:
        die('the kernel refused its input: ' + r.stderr.strip())
    return json.loads(r.stdout)


def read_progress(p, n):
    if not os.path.exists(p):
        return {}
    done = {}
    for line in open(p):
        i, c = line.split()
        done[int(i)] = int(c)
    if any(i < 0 or i >= n for i in done):
        die(p + ' names a root out of range')
    return done


def side_rows(name, n, adj, s, t):
    return (('K', s, adj), ('I', t, clique.complement(adj, n)))


def decide_side(exe, tmp, name, side, k, A, n, threads, budget, ref):
    """One side: the kernel (resuming any progress), the reference beside it when ref. Returns the side's record."""
    os.makedirs(RUNS, exist_ok=True)
    prog = os.path.join(RUNS, '%s.%s.progress' % (name, side))
    rootfile = os.path.join(tmp, '%s.%s.roots' % (name, side))
    c = run_c(exe, A, n, k, threads, seconds=budget, progress=prog, rootfile=rootfile)
    rec = {'k': k, 'complete': c['complete'], 'found': c['found'], 'nodes': c['nodes'], 'roots': c['roots'], 'rootsDone': c['rootsDone']}
    if c['found'] is not None:
        if not (len(c['found']) == k and clique.is_clique(A, c['found'])):
            die('%s %s: the kernel returned vertices that are not a %d-clique' % (name, side, k))
        rec['witnessChecked'] = True
    if c['complete'] and c['found'] is None and n <= CHECK_C_MAX and os.path.exists(prog):
        os.remove(prog)   # a quick side is re-searched by --check; a long one keeps its per-root counts as the record
    if ref:
        r = clique.has_clique(A, n, k)
        croots = [int(l.split()[1]) for l in open(rootfile)]
        if (r['found'] is None) != (c['found'] is None):
            die('%s %s: the reference and the kernel disagree on whether a clique exists' % (name, side))
        if r['found'] is None and (r['rootNodes'] != croots or r['nodes'] != c['nodes']):
            die('%s %s: the reference and the kernel count different nodes (%d vs %d)' % (name, side, r['nodes'], c['nodes']))
        rec['reference'] = {'nodes': r['nodes'], 'rootsEqual': r['found'] is None}
    return rec


def verdict(K, I):
    if K['found'] is not None or I['found'] is not None:
        return 'REFUTED'
    if K['complete'] and I['complete']:
        return 'CERTIFIED'
    return 'REFUSED'


def code_hashes():
    return {os.path.relpath(p, ROOT): sha(p) for p in [os.path.join(SRC, f) for f in ('clique.c', 'clique.py', 'graph.py')] + [os.path.abspath(__file__)]}


def build(args):
    P = pins()
    budget = int(args[args.index('--budget') + 1]) if '--budget' in args else 300
    threads = int(args[args.index('--threads') + 1]) if '--threads' in args else (os.cpu_count() or 1)
    only = set(args[args.index('--only') + 1].split(',')) if '--only' in args else None
    prev = json.load(open(OUT)) if os.path.exists(OUT) else None
    prevrows = {r['file']: r for r in prev['rows']} if prev else {}
    tmp = tempfile.mkdtemp(prefix='ramsey-')
    exe, ccver = compile_kernel(tmp)
    rows = []
    t_all = time.time()
    for rel in sorted((f for f in P['files'] if f.startswith('graphs/')), key=lambda f: graph.claim(f)[2]):
        s, t, m = graph.claim(rel)
        name = os.path.basename(rel)[:-4]
        if only is not None and name not in only and rel in prevrows:
            rows.append(prevrows[rel]); continue
        n, adj = graph.read(open(os.path.join(CORPUS, rel)).read())
        if n != m - 1:
            die('%s: %d vertices, the name claims %d' % (rel, n, m - 1))
        sides = {}
        for side, k, A in side_rows(name, n, adj, s, t):
            pr = prevrows.get(rel, {}).get(side)
            if pr and pr['complete']:                      # decided earlier and recorded: not re-searched here
                sides[side] = pr; continue
            t0 = time.time()
            sides[side] = decide_side(exe, tmp, name, side, k, A, n, threads, budget, n <= REF_MAX)
            sides[side]['seconds'] = round(time.time() - t0, 1) + (pr or {}).get('seconds', 0)
            print('  %-16s %s%-2d %s  roots %d/%d  nodes %d  %.0fs' % (name, side, k, 'complete' if sides[side]['complete'] else 'partial',
                  sides[side]['rootsDone'], sides[side]['roots'], sides[side]['nodes'], time.time() - t0), flush=True)
        rows.append({'file': rel, 'source': P['files'][rel]['source'], 'sha256': P['files'][rel]['sha256'], 's': s, 't': t, 'claim': 'R(%d, %d) >= %d' % (s, t, m),
                     'n': n, 'K': sides['K'], 'I': sides['I'], 'verdict': verdict(sides['K'], sides['I'])})
    shutil.rmtree(tmp, ignore_errors=True)
    counts = {}
    for r in rows:
        counts[r['verdict']] = counts.get(r['verdict'], 0) + 1
    L = {
        'what': 'Google\'s 18 Ramsey lower-bound graphs for AlphaEvolve (arXiv 2603.09172), each decided by an exhaustive clique search written here from the definition: a file R(s, t) >= m is CERTIFIED when its graph on m - 1 vertices has no s-clique and no independent t-set, both searched to the end. Written by tools/run-ramsey-ledger.py.',
        'source': {'repository': P['repository'], 'commit': P['commit'], 'directory': P['directory'], 'pins': 'corpus/ramsey/alphaevolve/PINS.json'},
        'method': {'kernel': 'instruments/ramsey/clique.c', 'reference': 'instruments/ramsey/clique.py', 'refMax': REF_MAX,
                   'order': 'smallest-last (ties by smallest label); roots in rank order with their later neighbours',
                   'bounds': 'greedy colouring of the candidates (lowest label first), walked backwards; size + colour < k closes the branch'},
        'code': code_hashes(),
        'machine': {'platform': platform.platform(), 'compiler': ccver, 'threads': threads},
        'counts': counts,
        'rows': rows,
    }
    json.dump(L, open(OUT, 'w'), indent=1, ensure_ascii=False)
    open(OUT, 'a').write('\n')
    print('ramsey-ledger: %d claims — %s (%.0fs) → %s' % (len(rows), ', '.join('%d %s' % (v, k) for k, v in sorted(counts.items())), time.time() - t_all, os.path.relpath(OUT, ROOT)))


def check():
    P = pins()
    L = json.load(open(OUT))
    if L['code'] != code_hashes():
        die('the code changed since the ledger was written: re-run the build')
    tmp = tempfile.mkdtemp(prefix='ramsey-check-')
    exe, _ = compile_kernel(tmp)
    # red controls: a planted clique and a planted independent set must be found, with a valid witness, by both
    n0, adj0 = graph.read(open(os.path.join(CORPUS, 'graphs', 'R_3_12_ge_53.txt')).read())
    planted = list(adj0)
    for a in (0, 1, 2):
        for b in (0, 1, 2):
            if a != b:
                planted[a] |= 1 << b
    hollow = list(adj0)
    ring = sum(1 << v for v in range(12))
    for v in range(12):
        hollow[v] &= ~ring
    for A, k, what in ((planted, 3, 'a planted triangle'), (clique.complement(hollow, n0), 12, 'a planted independent 12-set')):
        r = clique.has_clique(A, n0, k)
        c = run_c(exe, A, n0, k, 2)
        if not (r['found'] and c['found'] and clique.is_clique(A, r['found']) and clique.is_clique(A, c['found'])):
            die('red control: ' + what + ' was not found by both')
    for bad, why in (('[[0 1]\n [0 0]]', 'asymmetric'), ('[[1 0]\n [0 0]]', 'a loop'), ('[[0 2]\n [2 0]]', 'an entry 2'), ('[[0 1 0]\n [1 0]]', 'ragged')):
        try:
            graph.read(bad)
            die('red control: a matrix with ' + why + ' was read')
        except ValueError:
            pass
    # the kernel held to the reference across word boundaries: random graphs of 65-140 vertices (two or three words)
    rnd = random.Random(2026)
    for _ in range(24):
        n1 = rnd.randint(65, 140)
        p1 = rnd.uniform(0.2, 0.8)
        A = [0] * n1
        for a in range(n1):
            for b in range(a + 1, n1):
                if rnd.random() < p1:
                    A[a] |= 1 << b
                    A[b] |= 1 << a
        k1 = rnd.randint(3, 7)
        rootfile = os.path.join(tmp, 'random.roots')
        r = clique.has_clique(A, n1, k1)
        c = run_c(exe, A, n1, k1, 2, rootfile=rootfile)
        if (r['found'] is None) != (c['found'] is None):
            die('random graph n=%d k=%d: the reference and the kernel disagree' % (n1, k1))
        if r['found'] is None and r['rootNodes'] != [int(l.split()[1]) for l in open(rootfile)]:
            die('random graph n=%d k=%d: the per-root counts differ' % (n1, k1))
    rerun = 0
    for row in L['rows']:
        if row['sha256'] != P['files'][row['file']]['sha256']:
            die(row['file'] + ': the ledger names other bytes than the pin')
        n, adj = graph.read(open(os.path.join(CORPUS, row['file'])).read())
        name = os.path.basename(row['file'])[:-4]
        for side, k, A in side_rows(name, n, adj, row['s'], row['t']):
            rec = row[side]
            prog = os.path.join(RUNS, '%s.%s.progress' % (name, side))
            if n <= CHECK_C_MAX and rec['complete']:
                c = run_c(exe, A, n, k, os.cpu_count() or 1)
                if c['nodes'] != rec['nodes'] or (c['found'] is None) != (rec['found'] is None):
                    die('%s %s: re-run gives %d nodes, the ledger %d' % (name, side, c['nodes'], rec['nodes']))
                if n <= REF_CHECK_MAX and side == 'K':
                    r = clique.has_clique(A, n, k)
                    if r['nodes'] != rec['nodes']:
                        die('%s %s: the reference gives %d nodes, the ledger %d' % (name, side, r['nodes'], rec['nodes']))
                rerun += 1
            elif rec['found'] is None:
                done = read_progress(prog, n)
                if len(done) != rec['rootsDone'] or sum(done.values()) != rec['nodes'] or (rec['complete'] and len(done) != n):
                    die('%s %s: the progress file holds %d roots / %d nodes, the ledger %d / %d' % (name, side, len(done), sum(done.values()), rec['rootsDone'], rec['nodes']))
        if row['verdict'] != verdict(row['K'], row['I']):
            die(row['file'] + ': the verdict does not follow from its sides')
    shutil.rmtree(tmp, ignore_errors=True)
    print('ramsey-ledger: %d claims held to the pins; %d sides re-searched identically; red controls fired; %s' % (len(L['rows']), rerun, ', '.join('%d %s' % (v, k) for k, v in sorted(L['counts'].items()))))


if __name__ == '__main__':
    if '--check' in sys.argv:
        check()
    else:
        build(sys.argv[1:])
