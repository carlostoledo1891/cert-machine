#!/usr/bin/env python3
"""run-kissing-configs.py — the Qiushi Engine's remaining kissing configurations, decided pair by pair.

On 2026-10-12, after our checks of 25, 27, 43 and 45 (their issue #1), the Qiushi Engine (Oxelra-AI, arXiv:2609.35051)
published every point of its configurations in dimensions 32-37, 39 (release configuration-vectors-2026-10-12) and 49-55
(release lifting-vectors-2026-10-12): signed int8 Cartesian rows whose squared norms DIFFER between layers (32 and 39 in
dimension 39; 144, 192 and 48 in 49-55), so every row is normalised by its own length. Their verification checks
membership, norms, distinctness and counts and records that the pairs were not checked exhaustively. This tool checks
the pairs. (Dimension 38 — 52 int64 columns, 1,932 rows near 10^17 — is tools/run-kissing-config38.py.)

What is decided, exactly, from the pinned bytes (the gz digest GitHub reports and the raw sha256 their JSON records):
  - the row count; every squared norm; the rows grouped into blocks of equal norm (the counts must equal theirs);
  - the span dimension, of ALL rows: the rank over Q of the integer Gram matrix X^T X (summed exactly in int64 chunks),
    which equals the rank of X;
  - EVERY PAIR: for rows of squared norms A, B and product p, the angle is >= 60 degrees iff p <= 0 or 4 p^2 <= A B,
    i.e. p <= t(A, B) = floor(isqrt(A B) / 2); a contact (exactly 60 degrees) is 4 p^2 = A B. Identical or parallel rows
    have p^2 = A B and fail, so distinctness of the directions is part of the pair test. Products are formed in tiles
    (numpy float32 BLAS on the desk, CUDA fp16 tensor cores on a GPU pod) and are exact: every partial sum of products
    is bounded by |x| |y| <= max A (Cauchy-Schwarz) — 39 or 192 — far below 2^11, where fp16 stops holding integers;
  - a SECOND IMPLEMENTATION: a seeded sample (and every row of the blocks of at most 200 rows) decided in plain Python
    integers with the p <= 0 or 4 p^2 <= A B test written out, against the bulk path on the same rows; the sample is
    written out for instruments/kissing/wave/mixedcheck.js (BigInt, a third reading, run on the desk).

    python3 tools/run-kissing-configs.py 32 [33 ...] [--procs 8] [--tile 4096]     decide on the desk (numpy)
    python3 tools/run-kissing-configs.py 49 --backend torch --out DIR               on a GPU pod: writes DIR/<d>.json
    python3 tools/run-kissing-configs.py --import DIR                               record pod results in certs/kissing-wave.json
    python3 tools/run-kissing-configs.py --js 49                                    the BigInt reading of a recorded sample
"""
import gzip, hashlib, json, math, os, platform, random, sys, time
for _v in ("VECLIB_MAXIMUM_THREADS", "OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS"):
    os.environ.setdefault(_v, "1")
from fractions import Fraction
import multiprocessing as mp
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CACHE = os.path.join(ROOT, 'corpus', 'kissing', 'wave', '.cache', 'qiushi-configs')
OUT = os.path.join(ROOT, 'certs', 'kissing-wave.json')
REPO = 'https://github.com/Oxelra-AI/Qiushi-Engine-Kissing-Number-Research'
# dimension: (release tag, file, gz sha256 = GitHub's digest, raw sha256 = their JSON, rows, columns, {norm: rows})
PINS = {
    32: ('configuration-vectors-2026-10-12', 'configuration32.i8.gz', 'f30dfb6fbab85188e294c3350880f37827e08b31f086de45eb3b71f5bd4616f7', '76103625c490916aa29f3f9f479b7bc5499a5effa52a23a7a20bb952af1b1782', 347584, 32, {32: 347584}),
    33: ('configuration-vectors-2026-10-12', 'configuration33.i8.gz', '40a6ce91a87fcb1bbc709fe6818fb42350dd5b944d8bb44b46093af75ef27dc0', '1d128d943434c96b965f795fbc169a97f8b73149caded21102258f383a0b949f', 363968, 33, {32: 363968}),
    34: ('configuration-vectors-2026-10-12', 'configuration34.i8.gz', 'e3e8500d8f420bd95738ba3b30fc5c187edd4b29a66c66dce7a6533b63be8ecd', 'eed9400cdf4a74a262ee95221607fd1321c6a8dd097dac71287218422250284c', 384196, 34, {32: 384196}),
    35: ('configuration-vectors-2026-10-12', 'configuration35.i8.gz', '8dc1a68c61ab6ff39cd11a567b7df2f4388e9fff0ddee44b605f12170936dc12', '6c3669733ec4de732f3469dcd9440783733b63155ffa46224ef358c8c874a5ac', 409676, 35, {32: 409676}),
    36: ('configuration-vectors-2026-10-12', 'configuration36.i8.gz', '7f15909a028fcf1b05d1af4d494c8625cc4da5e589f5525b9bf60ea68e18065d', '591313b09ca6c4f4f437337807f3054f0d9ca5bd7a5880141a04ca16143e20be', 484760, 36, {32: 484760}),
    37: ('configuration-vectors-2026-10-12', 'configuration37.i8.gz', '97cd948a35314c4aa014b5ba689803f9a6587248331758dafaa2c480bca93d25', '9e1fe7c2c6b06dbe9f22c0d0327d925f6f0e6954feac790c195ab362c1f58671', 498024, 37, {32: 498024}),
    39: ('configuration-vectors-2026-10-12', 'configuration39.i8.gz', '02591a7a0082e5463898b5c5497dd39818c1ab7f9b8f42597aa2660dcd26b60e', '0a0f0d6fb50324d6a1f562ce52478c1c48cecb5a6451e97f5a8b0d83e3baabf1', 763668, 39, {32: 435988, 39: 327680}),
    49: ('lifting-vectors-2026-10-12', 'configuration49.i8.gz', '2df566e092bf06747f858cda1478528b6a2436de005b137b7ee877abed7c0894', '3aede955c2c8b6fb54dcff471b4850cb7990d252aad8bdc1970a3cf6bcbccaa4', 52430156, 51, {144: 52401846, 192: 28308, 48: 2}),
    50: ('lifting-vectors-2026-10-12', 'configuration50.i8.gz', '313a179b4698f310007271cb6be7d18c217fdbab9eabfa19e23e715566b89512', '21a351c558f7be5b3d0822a43c62165d953421436d71a628ffd08b4fbd2d8b80', 52458468, 57, {144: 52373538, 192: 84924, 48: 6}),
    51: ('lifting-vectors-2026-10-12', 'configuration51.i8.gz', '276f9f4884ee137404552d17e80f7a28d8da5ea970a2f53ba7b6a5a314e84126', '33ff8880a23386904b00b7273cc4e234731d3a5fafe82c39638371ab641ff413', 52500930, 57, {144: 52331082, 192: 169836, 48: 12}),
    52: ('lifting-vectors-2026-10-12', 'configuration52.i8.gz', 'aaac1d74e2622c0f6b1e066d1b960378490aee817034c24e7500d73a0c1470eb', '4058041900101185ea443fdf5aa3764359ef5ba2c4f9fe3156745dfd1390749e', 52585772, 60, {144: 52246252, 192: 339496, 48: 24}),
    53: ('lifting-vectors-2026-10-12', 'configuration53.i8.gz', 'a90af9452e5f9a207ce82575895ef307bcd908a08c90621e0a74f1da6a6d4429', 'bd2e44bb11638fe8537c94e235ffa761a8b1f4e33ea99d52e257a6ee1e8a537a', 52698696, 63, {144: 52133344, 192: 565312, 48: 40}),
    54: ('lifting-vectors-2026-10-12', 'configuration54.i8.gz', '9f677d79ff0166702757bdd9aac24b548d806dd0086ee01cfa307d9131307786', '45e065493879502ef09be584f9c95be2bea387a8a3844814edd36eaf28c73751', 52923774, 72, {144: 51908298, 192: 1015404, 48: 72}),
    55: ('lifting-vectors-2026-10-12', 'configuration55.i8.gz', '59927928b54ffc1e398e5d9884960a132ee27edee6884892bb8ec89a508ce73e', '8a466a374f9b5835263c16fbf736b5c1573b5925b89b42218d84be006008e00a', 53301140, 72, {144: 51530986, 192: 1770028, 48: 126}),
}
PREVIOUS = {32: 346944, 33: 362048, 34: 381124, 35: 409548, 36: 484568, 37: 496232, 38: 591612, 39: 756116,
            49: 52430140, 50: 52458418, 51: 52500816, 52: 52585516, 53: 52698222, 54: 52922906, 55: 53299730}


def arg(name, default):
    return type(default)(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default


def fetch(d, cache):
    tag, name, gz_sha, raw_sha = PINS[d][:4]
    path = os.path.join(cache, name)
    if not os.path.exists(path):
        import urllib.request
        os.makedirs(cache, exist_ok=True)
        url = REPO + '/releases/download/' + tag + '/' + name
        print('fetching %s' % url, flush=True)
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'cert-machine-kissing-ledger'})) as r, open(path + '.part', 'wb') as f:
            while True:
                b = r.read(1 << 22)
                if not b:
                    break
                f.write(b)
        os.replace(path + '.part', path)
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 24), b''):
            h.update(b)
    if h.hexdigest() != gz_sha:
        sys.exit('CONFIGS REFUSED: %s does not match its pin' % name)
    raw = gzip.decompress(open(path, 'rb').read())
    if hashlib.sha256(raw).hexdigest() != raw_sha:
        sys.exit('CONFIGS REFUSED: the decompressed rows of %s differ from the bytes their verification hashed' % name)
    cols = PINS[d][5]
    if len(raw) % cols:
        sys.exit('CONFIGS REFUSED: %d bytes are not rows of %d columns' % (len(raw), cols))
    return np.frombuffer(raw, dtype=np.int8).reshape(-1, cols)


def rank_of_gram(Gi):
    """exact rank over Q of an integer symmetric matrix"""
    M = [[Fraction(int(v)) for v in r] for r in Gi]
    n = len(M); r = 0
    for c in range(n):
        p = next((i for i in range(r, n) if M[i][c] != 0), None)
        if p is None:
            continue
        M[r], M[p] = M[p], M[r]
        for i in range(r + 1, n):
            if M[i][c] != 0:
                f = M[i][c] / M[r][c]
                M[i] = [a - f * b for a, b in zip(M[i], M[r])]
        r += 1
    return r


def thresholds(A, B):
    """p <= t is the 60-degree test for squared norms A, B; c is the contact value (None if 4 p^2 = A B has no root)"""
    s = math.isqrt(A * B)
    t = s // 2
    c = t if 4 * t * t == A * B else None
    return t, c


def python_pairs(rows, norms):
    """the second implementation: every pair in plain Python integers, the test written out"""
    viol = cont = 0
    R = [[int(v) for v in r] for r in rows]
    N = [int(v) for v in norms]
    for i in range(len(R)):
        x = R[i]
        for j in range(i + 1, len(R)):
            p = sum(a * b for a, b in zip(x, R[j]))
            if p > 0 and 4 * p * p > N[i] * N[j]:
                viol += 1
            elif p > 0 and 4 * p * p == N[i] * N[j]:
                cont += 1
    return viol, cont


_X = None


def _np_tile(task):
    i0, i1, j0, j1, diag, t, c = task
    P = _X[i0:i1] @ _X[j0:j1].T
    if diag:
        P = np.triu(P, 1)
    mx = float(P.max())
    cnt = int(np.count_nonzero(P == c)) if c is not None else 0
    viol = int(np.count_nonzero(P > t)) if mx > t else 0
    below = P[P < (c if c is not None else t + 1)]
    return viol, cnt, mx, float(below.max()) if below.size else -1e9


def tasks_for(blocks, tile):
    """(i0, i1, j0, j1, diag, t, c) over every block pair, upper triangle within a block"""
    out = []
    for a, (A, a0, a1) in enumerate(blocks):
        for b, (B, b0, b1) in enumerate(blocks):
            if b < a:
                continue
            t, c = thresholds(A, B)
            for i0 in range(a0, a1, tile):
                for j0 in range(b0 if b > a else i0, b1, tile):
                    out.append((i0, min(a1, i0 + tile), j0, min(b1, j0 + tile), b == a and j0 == i0, t, c))
    return out


def bulk_numpy(Xs, blocks, tile, procs, log):
    global _X
    _X = Xs.astype(np.float32)
    tasks = tasks_for(blocks, tile)
    random.Random(2026).shuffle(tasks)
    viol = cont = 0; mx = nb = -1e9; done = 0; t0 = time.time()
    pool = mp.get_context('fork').Pool(procs) if procs > 1 else None
    with (pool or open(os.devnull)):
        for v, c_, m_, b_ in (pool.imap_unordered(_np_tile, tasks, chunksize=16) if pool else map(_np_tile, tasks)):
            viol += v; cont += c_; mx = max(mx, m_); nb = max(nb, b_); done += 1
            if done % 5000 == 0:
                log('  %d / %d tiles, %.0f s' % (done, len(tasks), time.time() - t0))
    return {'violations': viol, 'contacts': cont, 'tiles': len(tasks), 'seconds': round(time.time() - t0, 1), 'path': 'numpy float32 BLAS'}


def bulk_torch(Xs, blocks, tile, log):
    import torch
    torch.backends.cuda.matmul.allow_tf32 = False
    dev = 'cuda'
    cols = Xs.shape[1]; pad = (-cols) % 8
    Xg = torch.zeros((Xs.shape[0], cols + pad), dtype=torch.float16, device=dev)
    for c0 in range(0, Xs.shape[0], 1 << 22):
        Xg[c0:c0 + (1 << 22), :cols] = torch.from_numpy(np.ascontiguousarray(Xs[c0:c0 + (1 << 22)])).to(dev).to(torch.float16)
    tasks = tasks_for(blocks, tile)
    viol = torch.zeros((), dtype=torch.int64, device=dev); cont = torch.zeros((), dtype=torch.int64, device=dev)
    mx = torch.full((), -1e4, dtype=torch.float32, device=dev)
    t0 = time.time(); last = t0
    for k, (i0, i1, j0, j1, diag, t, c) in enumerate(tasks):
        P = Xg[i0:i1] @ Xg[j0:j1].T                     # fp16 in, fp16 out: every value an integer of magnitude <= 192
        if diag:
            P = torch.triu(P, 1)
        m = P.max()
        mx = torch.maximum(mx, m.float())
        if c is not None:
            cont += (P == c).sum()
        if m.item() > t:                                 # exact: m is an integer held exactly; only a crossing tile is counted
            viol += (P > t).sum()
        if time.time() - last > 300:
            torch.cuda.synchronize(); last = time.time()
            log('  %d / %d tiles, %.0f s, %d violations so far' % (k + 1, len(tasks), last - t0, int(viol)))
    torch.cuda.synchronize()
    return {'violations': int(viol), 'contacts': int(cont), 'tiles': len(tasks), 'seconds': round(time.time() - t0, 1),
            'path': 'CUDA fp16 tensor cores (%s)' % torch.cuda.get_device_name(0), 'maxDot': float(mx)}


def decide(d, X, backend='numpy', procs=None, tile=None, log=print):
    t0 = time.time()
    n, cols = X.shape
    pin = PINS[d]
    norms = np.zeros(n, dtype=np.int64)
    for c0 in range(0, n, 1 << 22):
        Xc = X[c0:c0 + (1 << 22)].astype(np.int32)
        norms[c0:c0 + Xc.shape[0]] = (Xc * Xc).sum(axis=1)
    vals, counts = np.unique(norms, return_counts=True)
    normCounts = {int(v): int(k) for v, k in zip(vals, counts)}
    order = np.argsort(-norms, kind='stable')               # blocks of equal norm, largest first
    Xs = X[order]
    ns = norms[order]
    blocks = []
    for v in sorted(normCounts, reverse=True):
        a0 = int(np.searchsorted(-ns, -v, side='left')); a1 = int(np.searchsorted(-ns, -v, side='right'))
        blocks.append((v, a0, a1))
    G = np.zeros((cols, cols), dtype=np.int64)
    for c0 in range(0, n, 1 << 20):
        Xc = X[c0:c0 + (1 << 20)].astype(np.float64)
        G += np.rint(Xc.T @ Xc).astype(np.int64)            # exact: each chunk's entries are below 2^20 * 192 < 2^53
    rank = rank_of_gram(G.tolist())
    maxA = max(normCounts)
    facts = {'rows': int(n), 'rowsClaimed': pin[4], 'columns': cols, 'normCounts': {str(k): v for k, v in sorted(normCounts.items())},
             'normCountsClaimed': {str(k): v for k, v in sorted(pin[6].items())}, 'spanDimension': rank, 'maxAbsCoordinate': int(np.abs(X).max()),
             'partialSumBound': maxA}
    log('d=%d: %d rows in %d columns, norms %s, rank %d (%.0f s)' % (d, n, cols, normCounts, rank, time.time() - t0))
    if backend == 'torch':
        b = bulk_torch(Xs, blocks, tile or 16384, log)
    else:
        b = bulk_numpy(Xs, blocks, tile or 4096, procs or os.cpu_count() or 1, log)
    b['pairs'] = n * (n - 1) // 2
    b['exactness'] = ('every partial sum of products is bounded by |x||y| <= max squared norm = %d (Cauchy-Schwarz), so every value '
                      'is an integer held exactly in %s' % (maxA, 'fp16 (exact to 2^11)' if backend == 'torch' else 'float32 (exact to 2^24)'))
    # the second implementation, on a seeded sample plus every row of the small blocks
    rng = random.Random(7)
    idx = set(rng.sample(range(n), min(600, n)))
    for v, a0, a1 in blocks:
        if a1 - a0 <= 200:
            idx.update(range(a0, a1))
    idx = sorted(idx)
    S, Sn = Xs[idx], ns[idx]
    pv, pc = python_pairs(S, Sn)
    # the bulk path's tile function on the same rows (numpy, exact by the same bound)
    sorder = np.argsort(-Sn, kind='stable'); S2, Sn2 = S[sorder], Sn[sorder]
    sblocks = []
    for v in sorted(set(int(x) for x in Sn2), reverse=True):
        a0 = int(np.searchsorted(-Sn2, -v, side='left')); a1 = int(np.searchsorted(-Sn2, -v, side='right')); sblocks.append((v, a0, a1))
    if backend == 'torch':                                     # the bulk path actually used, on the same rows
        sb = bulk_torch(S2, sblocks, 1 << 14, lambda *a: None); bv, bc = sb['violations'], sb['contacts']
    else:
        global _X
        _X = S2.astype(np.float32)
        bv = bc = 0
        for task in tasks_for(sblocks, 1 << 20):
            v_, c_, _, _ = _np_tile(task); bv += v_; bc += c_
    second = {'rows': len(idx), 'pairs': len(idx) * (len(idx) - 1) // 2, 'pythonViolations': pv, 'pythonContacts': pc,
              'bulkViolations': bv, 'bulkContacts': bc, 'agree': pv == bv and pc == bc,
              'how': 'plain Python integers, the test p <= 0 or 4p^2 <= AB written out; no numpy, no BLAS'}
    sample = {'rows': S.astype(int).tolist()}
    ok = (n == pin[4] and normCounts == pin[6] and rank == d and b['violations'] == 0 and second['agree'])
    return {'d': d, 'verdict': 'WITNESSED' if ok else 'UNWITNESSED', 'facts': facts, 'bulk': b, 'second': second, 'sample': sample,
            'blocks': [{'squaredNorm': v, 'rows': a1 - a0} for v, a0, a1 in blocks],
            'contactRule': 'contact iff 4p^2 = AB (possible only between blocks whose AB is 4 times a square)',
            'machine': {'platform': platform.platform(), 'cpus': os.cpu_count()}, 'seconds': round(time.time() - t0, 1),
            'decidedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}


def row_for(res, js=None):
    d, f, b, sec = res['d'], res['facts'], res['bulk'], res['second']
    pin = PINS[d]
    normShow = ' / '.join(str(k) for k in sorted((int(x) for x in f['normCounts']), reverse=True))
    return {
        'id': 'qiushi-%d' % d, 'claimant': 'qiushi', 'claimantName': 'Qiushi Engine (Oxelra-AI) — arXiv:2609.35051', 'dim': d,
        'claimed': pin[4], 'previous': PREVIOUS[d], 'verdict': res['verdict'],
        'detail': ('every point published on 2026-10-12 at our request (%s/releases/tag/%s); %d rows of squared norm %s (each normalised by its own '
                   'length), spanning exactly %d dimensions; all %d pairs decided by the exact test p <= 0 or 4p^2 <= AB: %d contacts at exactly 60 degrees, '
                   'none closer. Their own verification checks membership, norms, distinctness and counts and records that the pairs were not checked exhaustively.'
                   % (REPO, pin[0], f['rows'], normShow, f['spanDimension'], b['pairs'], b['contacts'])) if res['verdict'] == 'WITNESSED'
                  else 'the check failed: ' + json.dumps({**f, **{k: v for k, v in b.items() if k != 'exactness'}, 'second': sec}),
        'facts': ['%d rows in %d integer columns, squared norms %s (counts as published)' % (f['rows'], f['columns'], json.dumps(f['normCounts'])),
                  'the rows span exactly %d dimensions: the rank over Q of the exact Gram matrix X^T X' % f['spanDimension'],
                  'every pair by %s, exact: each partial sum is bounded by %d' % (b['path'], f['partialSumBound']),
                  'a %d-row sample in plain Python integers: %d contacts, %d violations, equal to the bulk path' % (sec['rows'], sec['pythonContacts'], sec['pythonViolations'])],
        'engine': {'n': f['rows'], 'dim': d, 'norm': [max(int(x) for x in f['normCounts']), 0, 0, 0], 'normShow': normShow + ' (per row)',
                   'verdict': 'CERTIFIED' if res['verdict'] == 'WITNESSED' else 'REFUTED', 'pairs': b['pairs'], 'contacts': b['contacts'], 'violations': b['violations'],
                   'maxDot': [0, 0, 0, 0], 'maxDotShow': 'cos <= 1/2', 'maxCos': 0.5, 'nearestNonContactCos': None, 'seconds': b['seconds'],
                   'spotCheck': {'pairs': sec['pairs'], 'disagreements': 0 if sec['agree'] else 1, 'how': sec['how']},
                   'families': [{'name': 'blocks of equal norm', 'n': f['rows'], 'path': b['path'], 'freeNorm': True, 'maxAbsCoefficient': f['maxAbsCoordinate']}]},
        'sectionFacts': f, 'bulk': {k: v for k, v in b.items()}, 'second': sec, 'blocks': res['blocks'],
        'bytes': {pin[1]: pin[2], pin[1] + ' (decompressed, = their verification input)': pin[3]},
        'source': REPO + '/releases/tag/' + pin[0], 'machine': res['machine'], 'decidedAt': res['decidedAt'], 'seconds': b['seconds'],
        **({'jsCheck': js} if js else {}),
    }


def write_row(row):
    rec = json.load(open(OUT))
    rec['rows'] = [r_ for r_ in rec['rows'] if r_['id'] != row['id']] + [row]
    rec['rows'].sort(key=lambda r_: (r_['dim'], r_['claimant']))
    tmp = OUT + '.tmp'
    json.dump(rec, open(tmp, 'w'), indent=1); os.replace(tmp, OUT)


def js_check(sample_rows):
    """mixedcheck.js decides the sample in BigInt; it must agree with plain Python on the same rows"""
    import subprocess, tempfile
    tmp = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False); json.dump({'rows': [[str(int(v)) for v in r] for r in sample_rows]}, tmp); tmp.close()   # strings: exact past 2^53
    try:
        out = subprocess.check_output(['node', os.path.join(ROOT, 'instruments', 'kissing', 'wave', 'mixedcheck.js'), tmp.name]).decode()
    finally:
        os.unlink(tmp.name)
    js = json.loads(out.strip().splitlines()[-1])
    S = [[int(v) for v in r] for r in sample_rows]
    pv, pc = python_pairs(S, [sum(v * v for v in r) for r in S])
    return {'n': len(sample_rows), 'pairs': js['pairs'], 'jsContacts': js['contacts'], 'jsViolations': js['violations'], 'jsVerdict': js['verdict'],
            'pythonContacts': pc, 'agree': js['pairs'] == len(sample_rows) * (len(sample_rows) - 1) // 2 and js['contacts'] == pc and js['violations'] == pv,
            'jsMs': js['ms'], 'how': 'the recorded sample decided whole by mixedcheck.js (BigInt) and by plain Python integers; no code shared'}


if __name__ == '__main__':
    if '--import' in sys.argv:
        D = sys.argv[sys.argv.index('--import') + 1]
        for fn in sorted(os.listdir(D)):
            if fn.endswith('.json') and fn[:-5].isdigit():
                res = json.load(open(os.path.join(D, fn)))
                js = js_check(res['sample']['rows'])
                write_row(row_for(res, js))
                print('qiushi-%d %s: %d pairs, %d contacts, %d violations; js %s' % (res['d'], res['verdict'], res['bulk']['pairs'], res['bulk']['contacts'], res['bulk']['violations'], 'agrees' if js['agree'] else 'DISAGREES'))
        sys.exit(0)
    backend = arg('--backend', 'numpy')
    out = arg('--out', '')
    for d in [int(a) for a in sys.argv[1:] if a.isdigit() and int(a) in PINS]:
        X = fetch(d, arg('--cache', CACHE))
        res = decide(d, X, backend, arg('--procs', os.cpu_count() or 1), arg('--tile', 0) or None, log=lambda s: print(s, flush=True))
        del X
        print('qiushi-%d %s: %d pairs, %d contacts, %d violations, rank %d, second %s (%s, %.0f s)' % (
            d, res['verdict'], res['bulk']['pairs'], res['bulk']['contacts'], res['bulk']['violations'], res['facts']['spanDimension'],
            'agrees' if res['second']['agree'] else 'DISAGREES', res['bulk']['path'], res['seconds']), flush=True)
        if out:
            os.makedirs(out, exist_ok=True)
            json.dump(res, open(os.path.join(out, '%d.json' % d), 'w'))
        else:
            js = js_check(res['sample']['rows'])
            write_row(row_for(res, js))
            print('  js %s (%d contacts in the sample)' % ('agrees' if js['agree'] else 'DISAGREES', js['jsContacts']), flush=True)
