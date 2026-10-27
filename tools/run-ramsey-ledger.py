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

THE ORBITAL KERNEL (added 2026-10-27). Two sides are decided by instruments/ramsey/orbital.c (held piece by piece and
root by root to its reference orbital.py by instruments/ramsey/battery-orbital.py) instead of clique.c:
  · the independence side of OUTSIDE claims — graphs others than Google published, pinned in their own folders. The
    first is JeetuSK0808's R(3,33) >= 241 (corpus/ramsey/jeetusk0808, Zenodo 10.5281/zenodo.23552014): the circulant
    Cay(Z_240, ±D) built from the D its README prints, equal edge for edge to its certificate's list. The translation
    x -> x + 1 and every multiplier a with a·S = S are handed to the kernel, which checks each as an automorphism before
    using it; orbital.py's LEMMA then reduces "no independent 33-set" to one piece per orbit of the multipliers on the
    non-neighbours of 0. A second path that shares no code, instruments/ramsey/satpath.py (CNF per cube, kissat, every
    UNSAT checked by drat-trim), is recorded beside it as secondPath. Outside rows go under "outside", never into
    Google's 18 "rows" or their counts.
  · the independence side of R(8,18) >= 1052, in plain mode (no symmetry: colour refinement separates all 1051
    vertices in one round, so the only automorphism is the identity — recorded as "automorphisms"), split into the
    top-level branches of each root and handed out last first, so a run measures its cost root by root along the order.
An orbital side keeps its progress in corpus/ramsey/runs/<name>.<side>.orbital.progress ("piece rank branch nodes") and
every run that added to it, here or on a rented machine (tools/import-runpod-ramsey.py), in <...>.orbital.runs.json.

usage
  python3 tools/run-ramsey-ledger.py [--budget SECONDS] [--threads N] [--only R_8_12_ge_511,...]
        decide every claim, spending at most SECONDS per unfinished side (default 300; progress resumes), write
        certs/ramsey-ledger.json
  python3 tools/run-ramsey-ledger.py --only R_8_12_ge_511 --fresh --budget 0
        re-run one file from nothing (its recorded sides and progress forgotten; --budget 0 = no time limit)
  python3 tools/run-ramsey-ledger.py --only R_8_18_ge_1052 --reread
        re-read the orbital progress (after an import from a rented machine) without searching
  python3 tools/run-ramsey-ledger.py --emit R_8_18_ge_1052 I
        print the orbital kernel's input for one side (what a rented machine searches)
  python3 tools/run-ramsey-ledger.py --check
        the battery: the pins, every graph's format, the reference and the kernel re-run where both are quick, and the
        recorded long searches re-read from their progress files; refuses unless the ledger is what they give now
"""
import sys, os, json, hashlib, subprocess, shutil, tempfile, time, platform, random, re, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'instruments', 'ramsey')
sys.path.insert(0, SRC)
import graph, clique, orbital  # noqa: E402

CORPUS = os.path.join(ROOT, 'corpus', 'ramsey', 'alphaevolve')
OUTSIDE = os.path.join(ROOT, 'corpus', 'ramsey', 'jeetusk0808')
RUNS = os.path.join(ROOT, 'corpus', 'ramsey', 'runs')
OUT = os.path.join(ROOT, 'certs', 'ramsey-ledger.json')
ORB = 'instruments/ramsey/orbital.c'
ORBITAL_PLAIN = {('R_8_18_ge_1052', 'I'): {'split': True, 'reverse': True}}    # sides searched by orbital.c, plain
SAT_DIR = 'corpus/ramsey/runs/R_3_33_ge_241.sat'
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
    return {os.path.relpath(p, ROOT): sha(p) for p in [os.path.join(SRC, f) for f in ('clique.c', 'clique.py', 'graph.py', 'orbital.c', 'orbital.py', 'satpath.py')] + [os.path.abspath(__file__)]}


# ---- the orbital kernel -------------------------------------------------------------------------------------------

def compile_orbital(tmp):
    cc = shutil.which('cc') or shutil.which('clang') or shutil.which('gcc') or die('no C compiler')
    exe = os.path.join(tmp, 'orbital')
    subprocess.run([cc, '-O2', '-o', exe, os.path.join(SRC, 'orbital.c'), '-lpthread'], check=True, capture_output=True)
    return exe


def orbital_input(A, n, k, T, H):
    out = [matrix(A, n, k).rstrip('\n'), 'T %d' % len(T)] + [' '.join(map(str, p)) for p in T]
    out += ['H %d' % len(H)] + [' '.join(map(str, p)) for p in H]
    return '\n'.join(out) + '\n'


def run_orbital(exe, A, n, k, T, H, threads=1, seconds=0, progress=None, split=False, reverse=False, flags=()):
    args = [exe, '-t', str(threads)] + (['-s', str(seconds)] if seconds else []) + (['-d', progress] if progress else [])
    args += (['-b'] if split else []) + (['-R'] if reverse else []) + list(flags)
    r = subprocess.run(args, input=orbital_input(A, n, k, T, H), capture_output=True, text=True)
    if r.returncode == 3:
        die('the orbital kernel REFUSED a map: ' + json.loads(r.stdout)['refused'])
    if r.returncode != 0:
        die('the orbital kernel refused its input: ' + r.stderr.strip())
    return json.loads(r.stdout)


def colour_refinement(adj, n):
    """Classes of the stable colouring (degree, then the multiset of neighbours' colours, until nothing splits). Every
    automorphism keeps each class; when every class is one vertex, the identity is the only automorphism."""
    nb = [[u for u in range(n) if adj[v] >> u & 1] for v in range(n)]
    col = [len(x) for x in nb]
    rounds = 0
    while True:
        sig = [(col[v], tuple(sorted(col[u] for u in nb[v]))) for v in range(n)]
        ids = {s: i for i, s in enumerate(sorted(set(sig)))}
        new = [ids[s] for s in sig]
        rounds += 1
        if len(set(new)) == len(set(col)):
            break
        col = new
    k = len(set(col))
    return {'method': 'colour refinement (1-dimensional Weisfeiler-Leman), started from the degrees', 'vertices': n, 'classes': k,
            'roundsToStable': rounds, 'automorphismGroup': 'trivial (every class is a single vertex)' if k == n else 'not decided by refinement'}


def orbit_runs(name, side):
    p = os.path.join(RUNS, '%s.%s.orbital.runs.json' % (name, side))
    return (json.load(open(p)) if os.path.exists(p) else []), p


def orbital_record(d, k, A, n, name, side, split, reverse, T, H, reduction_py=None):
    rec = {'kernel': ORB, 'k': k, 'mode': d['mode'], 'split': split, 'reverse': reverse,
           'complete': d['complete'], 'found': d['found'], 'nodes': d['nodes'], 'units': d['units'], 'unitsDone': d['unitsDone'],
           'pieces': d['pieces'], 'pieceSizes': d['pieceSizes'], 'pieceNodes': d['pieceNodes']}
    if d['mode'] == 'orbital':
        rec['reduction'] = {'lemma': 'instruments/ramsey/orbital.py (LEMMA and PROOF in its docstring)', 'tMaps': len(T), 'hMaps': len(H),
                            'orbitOf0': d['orbitOf0'], 'orbits': d['pieces'], 'orbitSizes': d['orbitSizes'], 'reps': d['reps']}
        red = reduction_py or orbital.reduction(A, n, T, H)
        if (red['reps'], red['orbits'], [bin(p['mask']).count('1') for p in red['pieces']]) != (d['reps'], d['orbitSizes'], d['pieceSizes']):
            die('%s %s: orbital.c and orbital.py reduce differently' % (name, side))
        rec['reduction']['referenceEqual'] = True
    if d['found'] is not None:
        if not (len(d['found']) == k and clique.is_clique(A, d['found'])):
            die('%s %s: the orbital kernel returned vertices that are not a %d-clique' % (name, side, k))
        rec['witnessChecked'] = True
    runs, _ = orbit_runs(name, side)
    rec['runs'] = runs
    rec['seconds'] = round(sum(r['seconds'] for r in runs), 1)
    rec['threadHours'] = round(sum(r['seconds'] * r['threads'] for r in runs) / 3600, 2)
    return rec


def decide_orbital_side(exe, name, side, k, A, n, T, H, threads, budget, split, reverse, reread=False):
    os.makedirs(RUNS, exist_ok=True)
    prog = os.path.join(RUNS, '%s.%s.orbital.progress' % (name, side))
    before = run_orbital(exe, A, n, k, T, H, progress=prog, split=split, flags=['-z'])
    if not reread and not before['complete']:
        t0 = time.time()
        d = run_orbital(exe, A, n, k, T, H, threads=threads, seconds=budget, progress=prog, split=split, reverse=reverse)
        runs, rp = orbit_runs(name, side)
        runs.append({'where': 'desk: ' + platform.platform(), 'threads': threads, 'seconds': round(time.time() - t0, 1),
                     'date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'unitsBefore': before['unitsDone'], 'unitsAfter': d['unitsDone'],
                     'nodesAfter': d['nodes']})
        json.dump(runs, open(rp, 'w'), indent=1)
        open(rp, 'a').write('\n')
    else:
        d = before
    return orbital_record(d, k, A, n, name, side, split, reverse, T, H)


# ---- outside claims (not Google's) ---------------------------------------------------------------------------------

def outside_claims():
    """JeetuSK0808's R(3,33) >= 241: pins, the record's own md5, D read from the text, the circulant it defines equal to the
    certificate's edge list (read as data). Returns [claim] with the graph and the symmetry handed to the kernel."""
    P = json.load(open(os.path.join(OUTSIDE, 'PINS.json')))
    for rel, f in P['files'].items():
        p = os.path.join(OUTSIDE, rel)
        if not os.path.exists(p) or sha(p) != f['sha256']:
            die('outside: ' + rel + ' is missing or not the pinned bytes')
    zp = os.path.join(OUTSIDE, P['zip'])
    rec = json.load(open(os.path.join(OUTSIDE, 'record.json')))
    md5 = [f['checksum'] for f in rec['files'] if f['key'] == P['zip']]
    if md5 != ['md5:' + hashlib.md5(open(zp, 'rb').read()).hexdigest()]:
        die('outside: the zip is not the bytes the Zenodo record names')
    Z = zipfile.ZipFile(zp)
    m = re.search(r'D = \{([\d, ]+)\}', Z.read(P['text']).decode())
    if not m:
        die('outside: the connection set is not where the text was read')
    D = [int(x) for x in m.group(1).split(',')]
    c = P['claim']
    n = c['n']
    S = sorted({d % n for d in D} | {(-d) % n for d in D})
    if 0 in S:
        die('outside: 0 is in the connection set (a loop)')
    adj = orbital.circulant(n, S)
    cert = json.loads(Z.read(P['certificate']))
    theirs = {(min(int(a), int(b)), max(int(a), int(b))) for a, b in cert['blue_edges']}
    ours = {(u, v) for u in range(n) for v in range(u + 1, n) if adj[u] >> v & 1}
    if ours != theirs or len(theirs) != len(cert['blue_edges']):
        die('outside: the graph the text defines is not the certificate\'s edge list')
    M = orbital.multipliers_preserving(n, S)
    name = 'R_%d_%d_ge_%d' % (c['s'], c['t'], c['m'])
    return [{'name': name, 'file': os.path.relpath(zp, ROOT), 'sha256': P['files'][P['zip']]['sha256'], 'claimant': P['claimant'],
             'source': 'https://doi.org/' + P['doi'], 's': c['s'], 't': c['t'], 'm': c['m'], 'n': n, 'adj': adj, 'D': D,
             'edges': len(ours), 'multipliers': M,
             'T': [orbital.translation(n)], 'H': [orbital.multiplier(n, a) for a in M if a != 1]}]


def sat_second_path():
    """The SAT path's summary, re-read from its per-cube records (written by instruments/ramsey/satpath.py)."""
    d = os.path.join(ROOT, SAT_DIR)
    sp = os.path.join(d, 'summary.json')
    if not os.path.exists(sp):
        return None
    S = json.load(open(sp))
    cubes = []
    for i in range(len(S['reps'])):
        p = os.path.join(d, 'cube-%d.json' % i)
        cubes.append(json.load(open(p)) if os.path.exists(p) else {'cube': i, 'verdict': 'NOT RUN'})
    closed = sum(1 for c in cubes if c['verdict'] == 'UNSAT-CHECKED')
    if closed != S['closed']:
        die('the SAT path\'s summary does not match its cube records')
    return {'tool': 'instruments/ramsey/satpath.py', 'records': SAT_DIR, 'graphFrom': 'the certificate\'s edge list (blue_edges), not the text',
            'solver': S['solver'], 'checker': S['checker'], 'k': S['k'], 'cubes': len(cubes), 'closedWithCheckedProof': closed,
            'open': [c['cube'] for c in cubes if c['verdict'] not in ('UNSAT-CHECKED',)], 'decided': S['decided'],
            'solveSeconds': round(sum(c.get('solveSeconds') or 0 for c in cubes), 1),
            'checkSeconds': round(sum(c.get('checkSeconds') or 0 for c in cubes), 1),
            'proofBytes': sum(c.get('proofBytes') or 0 for c in cubes)}


def build(args):
    P = pins()
    budget = int(args[args.index('--budget') + 1]) if '--budget' in args else 300
    threads = int(args[args.index('--threads') + 1]) if '--threads' in args else (os.cpu_count() or 1)
    only = set(args[args.index('--only') + 1].split(',')) if '--only' in args else None
    fresh = '--fresh' in args          # with --only: forget the named files' recorded sides and progress, search from nothing
    if fresh and only is None:
        die('--fresh needs --only')
    reread = '--reread' in args        # orbital sides: re-read the progress (an import from a rented machine), search nothing
    prev = json.load(open(OUT)) if os.path.exists(OUT) else None
    prevrows = {r['file']: r for r in prev['rows']} if prev else {}
    prevout = {r['file']: r for r in prev.get('outside', [])} if prev else {}
    tmp = tempfile.mkdtemp(prefix='ramsey-')
    exe, ccver = compile_kernel(tmp)
    orb = compile_orbital(tmp)
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
        extra = {}
        for side, k, A in side_rows(name, n, adj, s, t):
            pr = None if fresh else prevrows.get(rel, {}).get(side)
            prog = os.path.join(RUNS, '%s.%s.progress' % (name, side))
            if fresh and os.path.exists(prog):
                os.remove(prog)
            if (name, side) in ORBITAL_PLAIN:              # searched by orbital.c in plain mode (no symmetry to use)
                o = ORBITAL_PLAIN[(name, side)]
                if fresh:
                    for suffix in ('orbital.progress', 'orbital.runs.json'):
                        p = os.path.join(RUNS, '%s.%s.%s' % (name, side, suffix))
                        if os.path.exists(p):
                            os.remove(p)
                extra['automorphisms'] = colour_refinement(adj, n)
                rec = decide_orbital_side(orb, name, side, k, A, n, [], [], threads, budget, o['split'], o['reverse'], reread)
                if pr and pr.get('kernel') != ORB:         # the clique.c attempt this side had before, kept on record
                    rec['previous'] = {'kernel': 'instruments/ramsey/clique.c', 'roots': pr['roots'], 'rootsDone': pr['rootsDone'], 'nodes': pr['nodes'], 'seconds': pr.get('seconds')}
                elif pr and 'previous' in pr:
                    rec['previous'] = pr['previous']
                sides[side] = rec
                print('  %-16s %s%-2d %s  units %d/%d  nodes %d  (orbital.c, plain)' % (name, side, k, 'complete' if rec['complete'] else 'partial',
                      rec['unitsDone'], rec['units'], rec['nodes']), flush=True)
                continue
            if pr and pr['complete']:                      # decided earlier and recorded: not re-searched here
                sides[side] = pr; continue
            t0 = time.time()
            sides[side] = decide_side(exe, tmp, name, side, k, A, n, threads, budget, n <= REF_MAX)
            sides[side]['seconds'] = round(time.time() - t0, 1) + (pr or {}).get('seconds', 0)
            print('  %-16s %s%-2d %s  roots %d/%d  nodes %d  %.0fs' % (name, side, k, 'complete' if sides[side]['complete'] else 'partial',
                  sides[side]['rootsDone'], sides[side]['roots'], sides[side]['nodes'], time.time() - t0), flush=True)
        row = {'file': rel, 'source': P['files'][rel]['source'], 'sha256': P['files'][rel]['sha256'], 's': s, 't': t, 'claim': 'R(%d, %d) >= %d' % (s, t, m),
               'n': n, 'K': sides['K'], 'I': sides['I'], 'verdict': verdict(sides['K'], sides['I'])}
        row.update(extra)
        rows.append(row)
    # outside claims: the K side by clique.c (with the reference), the I side by orbital.c with the checked symmetry
    outside = []
    for c in outside_claims():
        name, n, adj = c['name'], c['n'], c['adj']
        if only is not None and name not in only and c['file'] in prevout:
            outside.append(prevout[c['file']]); continue
        sides = {}
        for side, k, A in side_rows(name, n, adj, c['s'], c['t']):
            pr = None if fresh else prevout.get(c['file'], {}).get(side)
            if side == 'K':
                if pr and pr['complete']:
                    sides[side] = pr; continue
                t0 = time.time()
                sides[side] = decide_side(exe, tmp, name, side, k, A, n, threads, budget, n <= REF_MAX)
                sides[side]['seconds'] = round(time.time() - t0, 1)
            else:
                if fresh:
                    for suffix in ('orbital.progress', 'orbital.runs.json'):
                        p = os.path.join(RUNS, '%s.%s.%s' % (name, side, suffix))
                        if os.path.exists(p):
                            os.remove(p)
                sides[side] = decide_orbital_side(orb, name, side, k, A, n, c['T'], c['H'], threads, budget, False, False, reread)
            r = sides[side]
            print('  %-16s %s%-2d %s  nodes %d' % (name, side, k, 'complete' if r['complete'] else 'partial', r['nodes']), flush=True)
        row = {'file': c['file'], 'claimant': c['claimant'], 'source': c['source'], 'sha256': c['sha256'], 's': c['s'], 't': c['t'],
               'claim': 'R(%d, %d) >= %d' % (c['s'], c['t'], c['m']), 'n': n,
               'graph': {'from': 'the connection set D printed in the deposit\'s README, x ~ y iff (y - x) mod n in ±D', 'D': c['D'],
                         'edges': c['edges'], 'certificateEdgesEqual': True},
               'symmetry': {'transitive': 'the translation x -> x + 1 (checked as an automorphism by the kernel; its orbit of 0 is all of Z_n)',
                            'stabilizer': 'every unit a mod n with a·(±D) = ±D, found by trying all units; each checked as an automorphism by the kernel',
                            'multipliers': c['multipliers']},
               'K': sides['K'], 'I': sides['I'], 'verdict': verdict(sides['K'], sides['I'])}
        sp = sat_second_path()
        if sp:
            row['secondPath'] = sp
        outside.append(row)
    shutil.rmtree(tmp, ignore_errors=True)
    counts = {}
    for r in rows:
        counts[r['verdict']] = counts.get(r['verdict'], 0) + 1
    ocounts = {}
    for r in outside:
        ocounts[r['verdict']] = ocounts.get(r['verdict'], 0) + 1
    L = {
        'what': 'Google\'s 18 Ramsey lower-bound graphs for AlphaEvolve (arXiv 2603.09172), each decided by an exhaustive clique search written here from the definition: a file R(s, t) >= m is CERTIFIED when its graph on m - 1 vertices has no s-clique and no independent t-set, both searched to the end. Written by tools/run-ramsey-ledger.py.',
        'source': {'repository': P['repository'], 'commit': P['commit'], 'directory': P['directory'], 'pins': 'corpus/ramsey/alphaevolve/PINS.json'},
        'method': {'kernel': 'instruments/ramsey/clique.c', 'reference': 'instruments/ramsey/clique.py', 'refMax': REF_MAX,
                   'order': 'smallest-last (ties by smallest label); roots in rank order with their later neighbours',
                   'bounds': 'greedy colouring of the candidates (lowest label first), walked backwards; size + colour < k closes the branch',
                   'orbital': {'kernel': ORB, 'reference': 'instruments/ramsey/orbital.py', 'battery': 'instruments/ramsey/battery-orbital.py',
                               'what': 'one root (vertex 0) when a transitive group of checked automorphisms is given, one piece per orbit of a checked stabilizer of 0 on its neighbours; every piece relabelled core first (the reverse of its smallest-last order) and searched by clique.py\'s algorithm; with no maps (plain) the whole graph is the one piece',
                               'sides': ['R_8_18_ge_1052 I (plain)'] + ['%s I (orbital)' % r['claim'] for r in outside]}},
        'code': code_hashes(),
        'machine': {'platform': platform.platform(), 'compiler': ccver, 'threads': threads},
        'counts': counts,
        'rows': rows,
        'outsideWhat': 'Ramsey lower-bound graphs published by others than Google, decided by the same instruments; kept apart from Google\'s 18 and their counts.',
        'outsideCounts': ocounts,
        'outside': outside,
    }
    json.dump(L, open(OUT, 'w'), indent=1, ensure_ascii=False)
    open(OUT, 'a').write('\n')
    print('ramsey-ledger: %d claims — %s; outside %d — %s (%.0fs) → %s' % (len(rows), ', '.join('%d %s' % (v, k) for k, v in sorted(counts.items())),
          len(outside), ', '.join('%d %s' % (v, k) for k, v in sorted(ocounts.items())), time.time() - t_all, os.path.relpath(OUT, ROOT)))


def emit(args):
    """The orbital kernel's input for one side, on stdout (what a rented machine searches)."""
    name, side = args[0], args[1]
    if (name, side) in ORBITAL_PLAIN:
        s, t, m = graph.claim(name + '.txt')
        n, adj = graph.read(open(os.path.join(CORPUS, 'graphs', name + '.txt')).read())
        k, A = dict((x, (y, z)) for x, y, z in side_rows(name, n, adj, s, t))[side]
        sys.stdout.write(orbital_input(A, n, k, [], []))
        return
    for c in outside_claims():
        if c['name'] == name:
            k, A = dict((x, (y, z)) for x, y, z in side_rows(name, c['n'], c['adj'], c['s'], c['t']))[side]
            sys.stdout.write(orbital_input(A, c['n'], k, c['T'] if side == 'I' else [], c['H'] if side == 'I' else []))
            return
    die('no orbital side named ' + name + ' ' + side)


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
    orb = compile_orbital(tmp)
    rerun = 0
    reread = 0

    def check_orbital(name, side, rec, A, n, k, T, H):
        prog = os.path.join(RUNS, '%s.%s.orbital.progress' % (name, side))
        d = run_orbital(orb, A, n, k, T, H, progress=prog, split=rec['split'], flags=['-z'])
        if (d['nodes'], d['unitsDone'], d['complete'], d['pieceNodes']) != (rec['nodes'], rec['unitsDone'], rec['complete'], rec['pieceNodes']):
            die('%s %s: the orbital progress re-read gives %d units / %d nodes, the ledger %d / %d' % (name, side, d['unitsDone'], d['nodes'], rec['unitsDone'], rec['nodes']))
        again = orbital_record(d, k, A, n, name, side, rec['split'], rec['reverse'], T, H)
        for key in ('reduction', 'runs', 'seconds', 'threadHours', 'units', 'pieceSizes'):
            if again.get(key) != rec.get(key):
                die('%s %s: the recorded %s is not what the kernel and the run log give now' % (name, side, key))

    for row in L['rows']:
        if row['sha256'] != P['files'][row['file']]['sha256']:
            die(row['file'] + ': the ledger names other bytes than the pin')
        n, adj = graph.read(open(os.path.join(CORPUS, row['file'])).read())
        name = os.path.basename(row['file'])[:-4]
        if 'automorphisms' in row and row['automorphisms'] != colour_refinement(adj, n):
            die(name + ': the colour refinement is not what the ledger records')
        for side, k, A in side_rows(name, n, adj, row['s'], row['t']):
            rec = row[side]
            prog = os.path.join(RUNS, '%s.%s.progress' % (name, side))
            if rec.get('kernel') == ORB:
                check_orbital(name, side, rec, A, n, k, [], [])
                reread += 1
            elif n <= CHECK_C_MAX and rec['complete']:
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
    # outside claims: pins, md5, text = certificate, the K side re-searched, the I side re-read, the SAT path re-read
    claims = {c['file']: c for c in outside_claims()}
    if sorted(claims) != sorted(r['file'] for r in L.get('outside', [])):
        die('the outside claims on disk are not the ones the ledger records')
    for row in L.get('outside', []):
        c = claims[row['file']]
        if row['sha256'] != c['sha256'] or row['graph']['D'] != c['D'] or row['symmetry']['multipliers'] != c['multipliers']:
            die(row['file'] + ': the ledger names another deposit, connection set or symmetry than the pins give')
        n, adj, name = c['n'], c['adj'], c['name']
        for side, k, A in side_rows(name, n, adj, row['s'], row['t']):
            rec = row[side]
            if side == 'K':
                cc = run_c(exe, A, n, k, os.cpu_count() or 1)
                if cc['nodes'] != rec['nodes'] or (cc['found'] is None) != (rec['found'] is None) or not rec['complete']:
                    die('%s K: re-run gives %d nodes, the ledger %d' % (name, cc['nodes'], rec['nodes']))
                rerun += 1
            else:
                check_orbital(name, side, rec, A, n, k, c['T'], c['H'])
                reread += 1
        if row.get('secondPath') != sat_second_path():
            die(name + ': the SAT path\'s records are not what the ledger records')
        if row['verdict'] != verdict(row['K'], row['I']):
            die(row['file'] + ': the verdict does not follow from its sides')
    shutil.rmtree(tmp, ignore_errors=True)
    print('ramsey-ledger: %d claims held to the pins; %d sides re-searched identically; red controls fired; %s; %d orbital sides re-read from their progress; outside %d — %s' % (
        len(L['rows']), rerun, ', '.join('%d %s' % (v, k) for k, v in sorted(L['counts'].items())), reread,
        len(L.get('outside', [])), ', '.join('%d %s' % (v, k) for k, v in sorted(L.get('outsideCounts', {}).items()))))


if __name__ == '__main__':
    if '--check' in sys.argv:
        check()
    elif '--emit' in sys.argv:
        emit(sys.argv[sys.argv.index('--emit') + 1:])
    else:
        build(sys.argv[1:])
