#!/usr/bin/env python3
"""run-kissing-sections.py — the Qiushi Engine's dimension-43 and dimension-45 kissing configurations, decided pair by pair.

Qiushi Engine (Oxelra-AI, arXiv:2609.35051) claims K(43) >= 2,553,792 and K(45) >= 7,380,090 from spherical-design
moment identities over lattice sections. On 2026-10-11, answering our request (their issue #1), they published every
point: release section-vectors-2026-10-11, 48 integer Cartesian coordinates per row (squared norm 576 / 4,416, the
contact inner product 288 / 2,208). Their own verification checks norms, the subspace, lattice membership and
distinctness, and records "pairwise_inner_products_checked": false. This tool checks the pairs.

What is decided, exactly, from the pinned bytes (sha256 in PINS, equal to their files.json):
  - the row count, every squared norm, distinctness of the rows;
  - the dimension: the rows span exactly a d-dimensional subspace of Q^48 — a random sample has rank d over Q (exact
    rational elimination), and every row is orthogonal to the 48 - d integer vectors spanning the sample's null space;
  - EVERY PAIR: <x, y> <= N/2 for all x != y (angle >= 60 degrees). The products are computed in float32 BLAS tiles,
    exact because every partial sum of products is bounded by sum|x_i y_i| <= |x||y| = N < 2^24 (Cauchy-Schwarz,
    checked); contacts (= N/2) and the largest non-contact are counted exactly;
  - a SECOND IMPLEMENTATION: a seeded sample of 600 rows has all its pairs decided in plain Python integers, and its
    contacts and violations must match the bulk path's counts on the same sample.
WITNESSED if all of it holds; otherwise UNWITNESSED with what failed. The row replaces the NEEDS DATA row of
certs/kissing-wave.json (run-kissing-wave.py keeps decided rows).

    python3 tools/run-kissing-sections.py 43 [--procs 8] [--tile 2048]
"""
import gzip, hashlib, json, os, sys, time, random, platform
for _v in ("VECLIB_MAXIMUM_THREADS", "OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS"):
    os.environ.setdefault(_v, "1")   # one BLAS thread per worker; the parallelism is the pool
from fractions import Fraction
import multiprocessing as mp
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CACHE = os.path.join(ROOT, 'corpus', 'kissing', 'wave', '.cache', 'qiushi-sections')
OUT = os.path.join(ROOT, 'certs', 'kissing-wave.json')
REL = 'https://github.com/Oxelra-AI/Qiushi-Engine-Kissing-Number-Research/releases/tag/section-vectors-2026-10-11'
PINS = {
    43: {'file': 'section43.i8.gz', 'sha256': '482660ef7fe595bd069d55d609c736bd54acaa786a6a5cab16581639260b7cbd',
         'raw_sha256': '101491f3864debc2c778ebbe370fe80b033cc9039802de59c54575ea3d4bf4bd', 'n': 2553792, 'N': 576,
         'csv': ('section43.csv.gz', '5ce70aae76603bdd825c558c3a848989073c505ce14c5528c22535d28b760337')},
    45: {'file': 'section45.i8.gz', 'sha256': '68a8f5bafe44ee15c13ccda2d3489dbbe03bd3d5c5904fe4944c9cafca04a5e4',
         'raw_sha256': '4675bf0522e866c0090e856bce9fd7f903191cf0bb017103ad238227c96ae80c', 'n': 7380090, 'N': 4416,
         'csv': ('section45.csv.gz', '2d6c7c701c137da310d0c9b5b93d43fdc8a331c4ef1f3dd80af656edc072a6e4')},
}
X = None   # the rows, shared with the workers by fork


def arg(name, default):
    return type(default)(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default


def rank_and_nullspace(rows):
    """exact rank over Q of a list of integer rows, and an integer basis of the orthogonal complement of their span"""
    M = [[Fraction(int(v)) for v in r] for r in rows]
    ncol = len(M[0]); piv = []; r = 0
    for c in range(ncol):
        p = next((i for i in range(r, len(M)) if M[i][c] != 0), None)
        if p is None:
            continue
        M[r], M[p] = M[p], M[r]
        inv = 1 / M[r][c]
        M[r] = [x * inv for x in M[r]]
        for i in range(len(M)):
            if i != r and M[i][c] != 0:
                f = M[i][c]
                M[i] = [a - f * b for a, b in zip(M[i], M[r])]
        piv.append(c); r += 1
        if r == len(M):
            break
    free = [c for c in range(ncol) if c not in piv]
    basis = []
    for f in free:
        v = [Fraction(0)] * ncol; v[f] = Fraction(1)
        for i, c in enumerate(piv):
            v[c] = -M[i][f]
        den = 1
        for x in v:
            den = den * x.denominator // np.gcd(den, x.denominator)
        basis.append([int(x * den) for x in v])
    return r, basis


def tile_job(task):
    """every pair (i, j) with i in block a and j in block b >= a; counts exact by the 2^24 bound"""
    a, b, T, tile = task
    n = X.shape[0]
    A = X[a * tile:min(n, (a + 1) * tile)]
    Bm = X[b * tile:min(n, (b + 1) * tile)]
    G = A @ Bm.T                                     # float32, exact: every partial sum is bounded by N < 2^24
    if a == b:
        iu = np.triu_indices(G.shape[0], 1)
        vals = G[iu]
        pairs = vals.size
    else:
        vals = G.ravel()
        pairs = vals.size
    viol = int(np.count_nonzero(vals > T))
    cont = int(np.count_nonzero(vals == T))
    below = vals[vals < T]
    return pairs, viol, cont, float(vals.max()) if vals.size else -1e9, float(below.max()) if below.size else -1e9


def run(d):
    global X
    pin = PINS[d]
    N, T = pin['N'], pin['N'] // 2
    path = os.path.join(CACHE, pin['file'])
    blob = open(path, 'rb').read()
    if hashlib.sha256(blob).hexdigest() != pin['sha256']:
        sys.exit('SECTIONS REFUSED: %s does not match its pin' % pin['file'])
    raw = gzip.decompress(blob)
    if hashlib.sha256(raw).hexdigest() != pin['raw_sha256']:
        sys.exit('SECTIONS REFUSED: the decompressed rows differ from the bytes their verification hashed')
    Xi = np.frombuffer(raw, dtype=np.int8).reshape(-1, 48).astype(np.int32)
    t0 = time.time()
    facts = {'rows': int(Xi.shape[0]), 'rowsClaimed': pin['n']}
    norms = (Xi * Xi).sum(axis=1)
    facts['allNormsEqual'] = bool(np.all(norms == N)); facts['norm'] = N
    facts['maxAbsCoordinate'] = int(np.abs(Xi).max())
    u = np.unique(np.ascontiguousarray(Xi).view(np.dtype((np.void, 48 * 4))))
    facts['distinctRows'] = int(u.size)
    rng = random.Random(2026)
    sample = sorted(rng.sample(range(Xi.shape[0]), 400))
    r, basis = rank_and_nullspace([Xi[i].tolist() for i in sample])
    W = np.array(basis, dtype=np.int64).T if basis else np.zeros((48, 0), dtype=np.int64)
    ortho = bool(np.all((Xi.astype(np.int64) @ W) == 0)) if basis else True
    facts['sampleRankOverQ'] = r; facts['complementVectors'] = len(basis); facts['allRowsInTheSpan'] = ortho
    facts['spanDimension'] = r if ortho else None
    print('d=%d: %d rows, norms %s, distinct %d, span dimension %s, max |coordinate| %d (%.0f s)' % (
        d, facts['rows'], facts['allNormsEqual'], facts['distinctRows'], facts['spanDimension'], facts['maxAbsCoordinate'], time.time() - t0), flush=True)
    if N >= 1 << 24:
        sys.exit('SECTIONS REFUSED: the 2^24 bound does not hold')
    X = Xi.astype(np.float32)
    tile = arg('--tile', 2048)
    nb = (X.shape[0] + tile - 1) // tile
    tasks = [(a, b, T, tile) for a in range(nb) for b in range(a, nb)]
    rng.shuffle(tasks)
    pairs = viol = cont = 0; mx = nbm = -1e9
    t1 = time.time(); done = 0
    with mp.get_context('fork').Pool(arg('--procs', os.cpu_count() or 1)) as pool:   # fork: the workers share X
        for p_, v_, c_, m_, b_ in pool.imap_unordered(tile_job, tasks, chunksize=64):
            pairs += p_; viol += v_; cont += c_; mx = max(mx, m_); nbm = max(nbm, b_); done += 1
            if done % 20000 == 0:
                print('  %d / %d tiles, %.0f s, %d violations so far' % (done, len(tasks), time.time() - t1, viol), flush=True)
    bulk = {'pairs': pairs, 'violations': viol, 'contacts': cont, 'maxDot': int(mx), 'nearestNonContactDot': int(nbm),
            'nearestNonContactCos': nbm / N, 'tiles': len(tasks), 'tile': tile, 'seconds': round(time.time() - t1, 1),
            'exactness': 'float32 BLAS; every partial sum of products is bounded by sum|x_i y_i| <= |x||y| = %d < 2^24' % N}
    # the second implementation: all pairs of a seeded 600-row sample in Python integers, against the bulk path on it
    sm = sorted(random.Random(7).sample(range(Xi.shape[0]), 600))
    rows = [Xi[i].tolist() for i in sm]
    pv = pc = 0
    for i in range(len(rows)):
        xi = rows[i]
        for j in range(i + 1, len(rows)):
            s = sum(a * b for a, b in zip(xi, rows[j]))
            if s > T: pv += 1
            elif s == T: pc += 1
    Gs = X[sm] @ X[sm].T
    iu = np.triu_indices(len(sm), 1)
    bv, bc = int(np.count_nonzero(Gs[iu] > T)), int(np.count_nonzero(Gs[iu] == T))
    second = {'rows': 600, 'pairs': len(iu[0]), 'pythonViolations': pv, 'pythonContacts': pc, 'bulkViolations': bv, 'bulkContacts': bc,
              'agree': pv == bv and pc == bc, 'how': 'plain Python integers, no numpy, no BLAS'}
    ok = (facts['rows'] == pin['n'] and facts['allNormsEqual'] and facts['distinctRows'] == pin['n'] and facts['spanDimension'] == d
          and viol == 0 and second['agree'])
    row = {'id': 'qiushi-%d' % d, 'claimant': 'qiushi', 'claimantName': 'Qiushi Engine (Oxelra-AI) — arXiv:2609.35051', 'dim': d,
           'claimed': pin['n'], 'previous': {43: 2545056, 45: 7379838}[d], 'verdict': 'WITNESSED' if ok else 'UNWITNESSED',
           'detail': ('every point published on 2026-10-11 at our request (%s); the rows span exactly a %d-dimensional subspace of Q^48, '
                      'all %d squared norms are %d, all rows distinct, and all %d pairs have inner product <= %d: %d contacts at exactly '
                      '60 degrees, none closer; the largest non-contact inner product is %d (cos %.6f). Their own verification checked norms, '
                      'subspace, membership and distinctness and recorded "pairwise_inner_products_checked": false — this is the pairwise check.'
                      % (REL, d, facts['rows'], N, pairs, T, cont, nbm, nbm / N)) if ok else ('the check failed: %s' % json.dumps({**facts, **bulk, 'second': second})),
           'facts': facts, 'bulk': bulk, 'second': second,
           'bytes': {pin['file']: pin['sha256'], pin['file'] + ' (decompressed, = their verification input)': pin['raw_sha256'], pin['csv'][0]: pin['csv'][1]},
           'source': REL, 'machine': {'platform': platform.platform(), 'cpus': os.cpu_count()},
           'decidedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
    rec = json.load(open(OUT))
    rec['rows'] = [r_ for r_ in rec['rows'] if r_['id'] != row['id']] + [row]
    rec['rows'].sort(key=lambda r_: (r_['dim'], r_['claimant']))
    tmp = OUT + '.tmp'
    json.dump(rec, open(tmp, 'w'), indent=1); os.replace(tmp, OUT)
    print('qiushi-%d %s: %d pairs, %d violations, %d contacts, max %d, nearest non-contact %d; second implementation %s (%.0f s)' % (
        d, row['verdict'], pairs, viol, cont, int(mx), int(nbm), 'agrees' if second['agree'] else 'DISAGREES', time.time() - t0), flush=True)


if __name__ == '__main__':
    run(int(sys.argv[1]))
