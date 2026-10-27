#!/usr/bin/env python3
"""battery-orbital.py — the orbital kernel (orbital.c) held to its reference (orbital.py), and both to clique.py and
brute force, with red controls. Prints one line and exits 0, or names the first disagreement and exits 1.

  · orbital.py against brute force on 720 small multiplier-invariant circulants (its selftest);
  · Paley graphs P(q), q = 13 .. 113: the clique number found by clique.py on the whole graph (plain, no symmetry) is
    found again through the lemma by both orbital implementations, and one more is absent in all three, with equal
    per-piece, per-root node counts between orbital.c and orbital.py;
  · random multiplier-invariant circulants of 40 - 140 vertices (one, two and three 64-bit words), each graph and its
    complement, k around the clique number: orbital.c (whole roots, and split into branches) and orbital.py agree on
    existence and, when there is none, count the same nodes root by root;
  · plain mode (no maps) on random graphs of 65 - 140 vertices: orbital.c = orbital.py root by root, and = clique.py on
    whether a clique exists;
  · the R(3,33) circulant of JeetuSK0808's deposit (Cay(Z_240, ±D)): both implementations reduce it to the same 31
    orbits, representatives and piece sizes;
  · units handed out last first (-R), whole or split, give the counts of the forward order; a run stopped and resumed
    from its progress file gives the totals of an unbroken run; a progress line naming a unit the input does not have
    is refused.
RED CONTROLS (each must fire): a planted independent 12-set in a circulant on Z_60 is found through the lemma; a
planted independent set that breaks the symmetry makes the translation fail its automorphism check (refused) and is
found by the plain search; the multiplier 7 on Z_240 (a unit that does not preserve ±D) is refused, as are a stabilizer
map that moves 0, a map that is not a permutation (x -> 2x) and a non-transitive T (x -> x + 2); and the check is
load-bearing: with the automorphism check switched off, a map that fixes 0 and keeps N(0) but is not an automorphism
merges N(0) into one orbit and the reduction answers "none" on a graph that has the clique (the check refuses that map).
"""
import sys, os, json, random, subprocess, tempfile, shutil
from math import gcd

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import clique, orbital  # noqa: E402

D333 = [14, 34, 38, 40, 43, 50, 58, 60, 63, 67, 69, 70, 79, 87, 89, 99]


def die(m):
    print('battery-orbital FAIL: ' + m)
    sys.exit(1)


def compile_kernel(tmp):
    cc = shutil.which('cc') or shutil.which('clang') or shutil.which('gcc') or die('no C compiler')
    exe = os.path.join(tmp, 'orbital')
    subprocess.run([cc, '-O2', '-o', exe, os.path.join(HERE, 'orbital.c'), '-lpthread'], check=True, capture_output=True)
    return exe


def kernel_input(A, n, k, T, H):
    out = ['%d %d' % (n, k)]
    out += [''.join('1' if A[i] >> j & 1 else '0' for j in range(n)) for i in range(n)]
    out.append('T %d' % len(T)); out += [' '.join(map(str, p)) for p in T]
    out.append('H %d' % len(H)); out += [' '.join(map(str, p)) for p in H]
    return '\n'.join(out) + '\n'


def run_c(exe, A, n, k, T, H, threads=2, extra=(), tmp=None):
    rootfile = os.path.join(tmp, 'roots') if tmp else None
    args = [exe, '-t', str(threads)] + list(extra) + (['-r', rootfile] if rootfile else [])
    r = subprocess.run(args, input=kernel_input(A, n, k, T, H), capture_output=True, text=True)
    if r.returncode == 3:
        return {'refused': json.loads(r.stdout)['refused']}
    if r.returncode != 0:
        die('the kernel failed: ' + r.stderr.strip())
    d = json.loads(r.stdout)
    if rootfile and os.path.exists(rootfile):
        d['_roots'] = {}
        for line in open(rootfile):
            p, rk, c = map(int, line.split())
            d['_roots'].setdefault(p, []).append(c)
        os.remove(rootfile)
    return d


def py_refuses(A, n, T, H):
    try:
        orbital.reduction(A, n, T, H)
        return None
    except ValueError as e:
        return str(e)


def hold(exe, tmp, A, n, k, T, H, what):
    """orbital.c (unsplit and split) and orbital.py on one instance; returns whether a clique was found."""
    r = orbital.has_clique(A, n, k, T, H)
    c = run_c(exe, A, n, k, T, H, tmp=tmp)
    b = run_c(exe, A, n, k, T, H, extra=['-b'], tmp=tmp)
    for x, name in ((c, 'unsplit'), (b, 'split')):
        if 'refused' in x:
            die('%s: the kernel (%s) refused: %s' % (what, name, x['refused']))
        if (x['found'] is None) != (r['found'] is None):
            die('%s k=%d: orbital.c (%s) and orbital.py disagree on existence' % (what, k, name))
        if x['found'] is not None and not (len(x['found']) == k and clique.is_clique(A, x['found'])):
            die('%s k=%d: orbital.c (%s) returned vertices that are not a %d-clique' % (what, k, name, k))
        if not x['complete']:
            die('%s k=%d: orbital.c (%s) did not finish' % (what, k, name))
    if r['found'] is not None and not (len(r['found']) == k and clique.is_clique(A, r['found'])):
        die('%s k=%d: orbital.py returned vertices that are not a %d-clique' % (what, k, k))
    if r['found'] is None:
        py = {i: p['rootNodes'] for i, p in enumerate(r['pieces'])}
        for x, name in ((c, 'unsplit'), (b, 'split')):
            got = {p: v for p, v in x.get('_roots', {}).items() if v}
            if got != {p: v for p, v in py.items() if v} or x['nodes'] != r['nodes']:
                die('%s k=%d: orbital.c (%s) counts other nodes than orbital.py (%d vs %d)' % (what, k, name, x['nodes'], r['nodes']))
    return r['found'] is not None


def paley(q):
    sq = {(x * x) % q for x in range(1, q)}
    return orbital.circulant(q, sorted(sq)), sq


def primitive_root(q):
    for g in range(2, q):
        if len({pow(g, e, q) for e in range(1, q)}) == q - 1:
            return g


def main():
    tmp = tempfile.mkdtemp(prefix='orbital-battery-')
    exe = compile_kernel(tmp)
    counts = {'instances': 0, 'redControls': 0}
    trials = orbital.selftest(1)

    # Paley graphs: the lemma with the translations and the multipliers by squares
    omegas = {}
    for q in (13, 17, 29, 37, 41, 53, 61, 73, 89, 97, 101, 109, 113):
        A, sq = paley(q)
        g = primitive_root(q)
        T = [orbital.translation(q)]
        H = [orbital.multiplier(q, g * g % q)]
        w = 1
        while clique.has_clique(A, q, w + 1)['found'] is not None:
            w += 1
        omegas[q] = w
        if not hold(exe, tmp, A, q, w, T, H, 'Paley(%d)' % q):
            die('Paley(%d): the orbital search misses the %d-clique clique.py finds' % (q, w))
        if hold(exe, tmp, A, q, w + 1, T, H, 'Paley(%d)' % q):
            die('Paley(%d): the orbital search finds a %d-clique clique.py does not' % (q, w + 1))
        counts['instances'] += 2

    # random multiplier-invariant circulants and their complements across word boundaries
    rnd = random.Random(2026)
    for _ in range(14):
        n = rnd.choice([rnd.randint(40, 63), rnd.randint(64, 127), rnd.randint(128, 140)])
        units = [a for a in range(2, n) if gcd(a, n) == 1]
        S = orbital.symmetric_set(n, rnd, rnd.choice(units))
        for A in (orbital.circulant(n, S), clique.complement(orbital.circulant(n, S), n)):
            Sa = [d for d in range(1, n) if A[0] >> d & 1]
            M = orbital.multipliers_preserving(n, Sa)
            T, H = [orbital.translation(n)], [orbital.multiplier(n, a) for a in M if a != 1]
            w, sure = 1, True
            while w < 12:
                r0 = clique.has_clique(A, n, w + 1, node_limit=2_000_000)
                if r0['found'] is None:
                    sure = r0['complete']
                    break
                w += 1
            if w >= 12 or not sure:           # a clique number this large (or this slow) is not what these instances test
                continue
            for k in (w, w + 1):
                want = k <= w
                if hold(exe, tmp, A, n, k, T, H, 'circulant n=%d' % n) != want:
                    die('circulant n=%d k=%d: the orbital search and clique.py disagree' % (n, k))
                counts['instances'] += 1
                counts['circulant'] = counts.get('circulant', 0) + 1
    if counts.get('circulant', 0) < 30:
        die('only %d circulant instances were held (the generator drifted)' % counts.get('circulant', 0))

    # plain mode: no maps, random graphs
    for _ in range(8):
        n = rnd.randint(65, 140)
        p = rnd.uniform(0.2, 0.7)
        A = [0] * n
        for a in range(n):
            for b in range(a + 1, n):
                if rnd.random() < p:
                    A[a] |= 1 << b; A[b] |= 1 << a
        k = rnd.randint(3, 7)
        want = clique.has_clique(A, n, k)['found'] is not None
        if hold(exe, tmp, A, n, k, [], [], 'plain n=%d' % n) != want:
            die('plain n=%d k=%d: orbital and clique.py disagree' % (n, k))
        counts['instances'] += 1

    # the R(3,33) circulant: the same reduction in both
    n = 240
    S = sorted({d % n for d in D333} | {(-d) % n for d in D333})
    G = orbital.circulant(n, S)
    A = clique.complement(G, n)
    M = orbital.multipliers_preserving(n, S)
    if M != [1, 13, 37, 71, 169, 203, 227, 239]:
        die('the multipliers preserving ±D are not ±1, ±13, ±37, ±71: %s' % M)
    T, H = [orbital.translation(n)], [orbital.multiplier(n, a) for a in M if a != 1]
    red = orbital.reduction(A, n, T, H)
    c = run_c(exe, A, n, 33, T, H, extra=['-c'])
    if (c.get('reps'), c.get('orbitSizes'), c.get('pieceSizes')) != (red['reps'], red['orbits'], [bin(p['mask']).count('1') for p in red['pieces']]) or len(red['reps']) != 31:
        die('R(3,33): the two reductions differ')

    # resume: a run stopped early and resumed equals an unbroken run; a foreign progress line is refused
    A2, _ = paley(101)
    g = primitive_root(101)
    T2, H2 = [orbital.translation(101)], [orbital.multiplier(101, g * g % 101)]
    whole = run_c(exe, A2, 101, 6, T2, H2, threads=1)
    for extra in (['-R'], ['-R', '-b']):
        other = run_c(exe, A2, 101, 6, T2, H2, threads=3, extra=extra)
        if other['nodes'] != whole['nodes'] or other['pieceNodes'] != whole['pieceNodes']:
            die('the order of the units (%s) changed the counts' % ' '.join(extra))
    prog = os.path.join(tmp, 'p.progress')
    run_c(exe, A2, 101, 6, T2, H2, threads=1, extra=['-s', '0.02', '-d', prog])
    first = sum(1 for _ in open(prog)) if os.path.exists(prog) else 0
    resumed = run_c(exe, A2, 101, 6, T2, H2, threads=3, extra=['-d', prog])
    if (resumed['nodes'], resumed['unitsDone'], resumed['complete']) != (whole['nodes'], whole['units'], True):
        die('resume: %d nodes after a stop at %d units, %d unbroken' % (resumed['nodes'], first, whole['nodes']))
    reread = run_c(exe, A2, 101, 6, T2, H2, extra=['-z', '-d', prog])
    if (reread['nodes'], reread['unitsDone'], reread['complete']) != (whole['nodes'], whole['units'], True):
        die('-z: the progress file re-read gives %d nodes, the run %d' % (reread['nodes'], whole['nodes']))
    open(prog, 'a').write('0 99999 -1 5\n')
    r = subprocess.run([exe, '-d', prog], input=kernel_input(A2, 101, 6, T2, H2), capture_output=True, text=True)
    if r.returncode == 0:
        die('resume: a progress line naming a unit the input does not have was accepted')

    # RED CONTROLS
    # 1. a planted independent 12-set ({0, 5, ..., 55}) in a circulant on Z_60, found through the lemma
    n = 60
    rr = random.Random(7)
    base = [d for d in range(1, n) if d % 5 and rr.random() < 0.5]
    S = sorted({d for d in base} | {(-d) % n for d in base})
    G = orbital.circulant(n, S)
    A = clique.complement(G, n)
    M = orbital.multipliers_preserving(n, S)
    T, H = [orbital.translation(n)], [orbital.multiplier(n, a) for a in M if a != 1]
    if not all(clique.is_clique(A, [x for x in range(0, n, 5)]) for _ in [0]):
        die('red control 1 is not set up: {0, 5, ..., 55} is not independent')
    found = run_c(exe, A, n, 12, T, H)
    if not found.get('found') or not clique.is_clique(A, found['found']) or not orbital.has_clique(A, n, 12, T, H)['found']:
        die('red control 1: the planted independent 12-set was not found through the lemma')
    counts['redControls'] += 1
    # 2. a planted independent set that breaks the symmetry: the translation is refused; the plain search finds it
    n = 240
    S = sorted({d % n for d in D333} | {(-d) % n for d in D333})
    G = list(orbital.circulant(n, S))
    I = list(range(0, 240, 7))[:34]
    for a in I:
        for b in I:
            if a != b:
                G[a] &= ~(1 << b)
    A = clique.complement(G, n)
    T = [orbital.translation(n)]
    if 'refused' not in run_c(exe, A, n, 34, T, []) or py_refuses(A, n, T, []) is None:
        die('red control 2: a translation that is no longer an automorphism was accepted')
    planted = run_c(exe, A, n, 34, [], [], threads=4)
    if not planted.get('found') or not clique.is_clique(A, planted['found']):
        die('red control 2: the plain search did not find the planted independent 34-set')
    counts['redControls'] += 2
    # 3. maps that must be refused on the R(3,33) circulant
    G = orbital.circulant(n, S)
    A = clique.complement(G, n)
    T = [orbital.translation(n)]
    for TT, HH, why in ((T, [orbital.multiplier(n, 7)], 'the multiplier 7 (a unit that does not preserve ±D)'),
                        (T, [orbital.translation(n)], 'a stabilizer map that moves 0'),
                        (T, [orbital.multiplier(n, 2)], 'a map that is not a permutation (x -> 2x)'),
                        ([orbital.translation(n, 2)], [orbital.multiplier(n, 13)], 'a T whose group is not transitive (x -> x + 2)')):
        if 'refused' not in run_c(exe, A, n, 33, TT, HH, extra=['-c']) or py_refuses(A, n, TT, HH) is None:
            die('red control 3: ' + why + ' was accepted')
        counts['redControls'] += 1
    # 4. the check is load-bearing: without it, a non-automorphism merges orbits and hides a clique
    real = orbital.is_automorphism
    hit = None
    try:
        orbital.is_automorphism = lambda adj, n, p: True
        for trial in range(400):
            n = rr.randint(11, 30)
            units = [a for a in range(2, n) if gcd(a, n) == 1]
            if not units:
                continue
            S = orbital.symmetric_set(n, rr, 1)
            A = orbital.circulant(n, S)
            if len(S) < 3:
                continue
            cyc = list(range(n))                   # fixes 0, maps N(0) onto itself, merges it into one orbit
            for i, s in enumerate(S):
                cyc[s] = S[(i + 1) % len(S)]
            if real(A, n, cyc):
                continue
            H = [cyc]
            for k in range(3, 7):
                if clique.brute(A, n, k) and orbital.has_clique(A, n, k, [orbital.translation(n)], H)['found'] is None:
                    hit = (n, S, k, H)
                    break
            if hit:
                break
    finally:
        orbital.is_automorphism = real
    if not hit:
        die('red control 4: no instance showed the automorphism check to be load-bearing')
    n, S, k, H = hit
    A = orbital.circulant(n, S)
    if py_refuses(A, n, [orbital.translation(n)], H) is None or 'refused' not in run_c(exe, A, n, k, [orbital.translation(n)], H, extra=['-c']):
        die('red control 4: the non-automorphism that hides a clique was accepted')
    counts['redControls'] += 1

    shutil.rmtree(tmp, ignore_errors=True)
    print('battery-orbital: PASS — orbital.py = brute force on %d small circulants; %d instances held (orbital.c = orbital.py '
          'root by root, split = unsplit, existence = clique.py; Paley omega %s); the R(3,33) reduction equal (31 orbits); '
          'resume = unbroken; %d red controls fired' % (trials, counts['instances'], ', '.join('%d:%d' % kv for kv in sorted(omegas.items())), counts['redControls']))


if __name__ == '__main__':
    main()
