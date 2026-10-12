#!/usr/bin/env python3
"""run-kissing-config38.py — the Qiushi Engine's dimension-38 configuration (K(38) >= 591,900), decided pair by pair.

Published 2026-10-12 at our request (release configuration-vectors-2026-10-12): 591,900 little-endian int64 rows of 52
columns spanning a 38-dimensional subspace. Three layers: 589,680 cap rows and 288 added-equator rows of squared norm 48
(coordinates at most 5 in size), and 1,932 rotated-axis rows of squared norm 394674026743945636732262714818942096 with
coordinates near 3.7e17 — too large for float32/float64 to multiply exactly, and their squares overflow int64.

Decided exactly, in three parts:
  - small x small (the 589,968 rows of norm 48): float32 BLAS tiles of tools/run-kissing-configs.py, exact because every
    partial sum is bounded by |x||y| = 48;
  - small x axis (about 1.14e9 pairs): int64 products, exact because every partial sum is bounded by |x||y| =
    sqrt(48 N) < 4.4e18 < 2^63 (Cauchy-Schwarz); the 60-degree test p <= 0 or 4p^2 <= 48 N is p <= t with
    t = floor(isqrt(48 N) / 2), an int64;
  - axis x axis (1,865,346 pairs): Python integers.
The norms of every row (Python integers for the axes), the rank of the exact Gram matrix (38), the plain-integer sample
and the BigInt reading (mixedcheck.js, rows as strings) as in run-kissing-configs.py.

    python3 tools/run-kissing-config38.py [--procs 8]
"""
import gzip, hashlib, importlib.util, json, math, os, platform, random, sys, time
for _v in ("VECLIB_MAXIMUM_THREADS", "OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS"):
    os.environ.setdefault(_v, "1")
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
spec = importlib.util.spec_from_file_location('run_kissing_configs', os.path.join(ROOT, 'tools', 'run-kissing-configs.py'))
K = importlib.util.module_from_spec(spec); sys.modules['run_kissing_configs'] = K; spec.loader.exec_module(K)

TAG, NAME = 'configuration-vectors-2026-10-12', 'configuration38.i64.gz'
GZ_SHA = '0117193cfe67b4ef369aa4c9b8f9f1b42ec38602af7f96de0df8300632063eca'                 # GitHub's digest of the asset
RAW_SHA = 'e7277970c50525ce00d2138a508c72d420919d883c11ab54f3cc4c8d257f6a16'                # their configuration38-independent-review.json
ROWS, COLS, AX0, AX1 = 591900, 52, 589680, 591612
NBIG = 394674026743945636732262714818942096


def load():
    path = os.path.join(K.CACHE, NAME)
    if not os.path.exists(path):
        import urllib.request
        os.makedirs(K.CACHE, exist_ok=True)
        with urllib.request.urlopen(urllib.request.Request(K.REPO + '/releases/download/' + TAG + '/' + NAME, headers={'User-Agent': 'cert-machine-kissing-ledger'})) as r:
            open(path, 'wb').write(r.read())
    blob = open(path, 'rb').read()
    if hashlib.sha256(blob).hexdigest() != GZ_SHA:
        sys.exit('CONFIG38 REFUSED: the file does not match its pin')
    raw = gzip.decompress(blob)
    if hashlib.sha256(raw).hexdigest() != RAW_SHA:
        sys.exit('CONFIG38 REFUSED: the decompressed rows differ from the bytes their review hashed')
    return np.frombuffer(raw, dtype='<i8').reshape(-1, COLS)


def main():
    t0 = time.time()
    X = load()
    n = X.shape[0]
    small = np.concatenate([np.arange(0, AX0), np.arange(AX1, n)])
    S, A = X[small], X[AX0:AX1]
    Sn = (S * S).sum(axis=1)                                  # small rows: int64 is exact (|x| <= 5)
    An = [sum(int(v) * int(v) for v in r) for r in A.tolist()]
    normsOk = bool(np.all(Sn == 48)) and all(v == NBIG for v in An) and n == ROWS
    assert int(np.abs(S).max()) <= 5
    # the rank of all rows: the exact Gram matrix X^T X (small rows in int64, axis rows in Python integers)
    G = (S.astype(np.int64).T @ S.astype(np.int64)).astype(object)
    Ao = A.astype(object)
    G = G + Ao.T.dot(Ao)
    rank = K.rank_of_gram(G.tolist())
    print('d=38: %d rows, norms %s, rank %d (%.0f s)' % (n, normsOk, rank, time.time() - t0), flush=True)
    # small x small: the float32 tiles, one block of norm 48
    b1 = K.bulk_numpy(S.astype(np.int8), [(48, 0, S.shape[0])], 4096, int(K.arg('--procs', os.cpu_count() or 1)), lambda s: print(s, flush=True))
    # small x axis: int64, exact by Cauchy-Schwarz
    t48 = math.isqrt(48 * NBIG) // 2
    c48 = t48 if 4 * t48 * t48 == 48 * NBIG else None
    assert math.isqrt(48 * NBIG) < (1 << 63)
    v2 = c2 = 0; mx2 = None
    At = A.T.copy()
    for c0 in range(0, S.shape[0], 1 << 14):
        P = S[c0:c0 + (1 << 14)].astype(np.int64) @ At
        v2 += int(np.count_nonzero(P > t48))
        if c48 is not None:
            c2 += int(np.count_nonzero(P == c48))
        m = int(P.max()); mx2 = m if mx2 is None else max(mx2, m)
    # axis x axis: Python integers
    Al = [[int(v) for v in r] for r in A.tolist()]
    v3 = c3 = 0
    for i in range(len(Al)):
        x = Al[i]
        for j in range(i + 1, len(Al)):
            p = sum(a * b for a, b in zip(x, Al[j]))
            if p > 0 and 4 * p * p > NBIG * NBIG:
                v3 += 1
            elif p > 0 and 4 * p * p == NBIG * NBIG:
                c3 += 1
    pairs = n * (n - 1) // 2
    bulk = {'pairs': pairs, 'violations': b1['violations'] + v2 + v3, 'contacts': b1['contacts'] + c2 + c3,
            'parts': {'small x small': {'pairs': S.shape[0] * (S.shape[0] - 1) // 2, 'violations': b1['violations'], 'contacts': b1['contacts'], 'path': 'numpy float32 BLAS, bound 48'},
                      'small x axis': {'pairs': S.shape[0] * A.shape[0], 'violations': v2, 'contacts': c2, 'threshold': str(t48), 'largestProduct': str(mx2),
                                       'path': 'numpy int64, every partial sum bounded by sqrt(48 N) < 2^63'},
                      'axis x axis': {'pairs': len(Al) * (len(Al) - 1) // 2, 'violations': v3, 'contacts': c3, 'path': 'Python integers'}},
            'seconds': round(time.time() - t0, 1), 'path': 'float32 BLAS (norm-48 rows), exact int64 (against the rotated axes), Python integers (axis pairs)',
            'exactness': 'float32 partial sums bounded by 48; int64 partial sums bounded by sqrt(48 N) < 4.4e18 < 2^63; axis pairs in Python integers'}
    # the second implementation: a seeded sample of the small rows plus 200 axis rows, every pair in plain Python integers,
    # against the three bulk paths on the same rows
    rng = random.Random(7)
    si = sorted(rng.sample(range(S.shape[0]), 500)); ai = sorted(rng.sample(range(A.shape[0]), 200))
    rows = [[int(v) for v in S[i]] for i in si] + [[int(v) for v in A[i]] for i in ai]
    norms = [48] * len(si) + [NBIG] * len(ai)
    pv, pc = K.python_pairs(rows, norms)
    Ss = S[si].astype(np.float32); Pss = np.triu(Ss @ Ss.T, 1)
    bv = int(np.count_nonzero(Pss > 24)); bc = int(np.count_nonzero(Pss == 24))
    Psa = S[si].astype(np.int64) @ A[ai].T
    bv += int(np.count_nonzero(Psa > t48)); bc += int(np.count_nonzero(Psa == c48)) if c48 is not None else 0
    Aa = [[int(v) for v in A[i]] for i in ai]
    for i in range(len(Aa)):
        for j in range(i + 1, len(Aa)):
            p = sum(a * b for a, b in zip(Aa[i], Aa[j]))
            if p > 0 and 4 * p * p > NBIG * NBIG: bv += 1
            elif p > 0 and 4 * p * p == NBIG * NBIG: bc += 1
    second = {'rows': len(rows), 'pairs': len(rows) * (len(rows) - 1) // 2, 'pythonViolations': pv, 'pythonContacts': pc,
              'bulkViolations': bv, 'bulkContacts': bc, 'agree': pv == bv and pc == bc,
              'how': 'plain Python integers, the test p <= 0 or 4p^2 <= AB written out; no numpy, no BLAS'}
    ok = normsOk and rank == 38 and bulk['violations'] == 0 and second['agree']
    facts = {'rows': n, 'rowsClaimed': ROWS, 'columns': COLS, 'normCounts': {'48': int(S.shape[0]), str(NBIG): len(An)},
             'normCountsClaimed': {'48': 589968, str(NBIG): 1932}, 'spanDimension': rank, 'maxAbsCoordinate': int(np.abs(A).max()),
             'partialSumBound': 48}
    res = {'d': 38, 'verdict': 'WITNESSED' if ok else 'UNWITNESSED', 'facts': facts, 'bulk': bulk, 'second': second,
           'sample': {'rows': rows}, 'blocks': [{'squaredNorm': 48, 'rows': int(S.shape[0])}, {'squaredNorm': str(NBIG), 'rows': len(An)}],
           'machine': {'platform': platform.platform(), 'cpus': os.cpu_count()}, 'seconds': round(time.time() - t0, 1),
           'decidedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
    K.PINS[38] = (TAG, NAME, GZ_SHA, RAW_SHA, ROWS, COLS, {48: 589968, NBIG: 1932})
    js = K.js_check(rows)
    row = K.row_for(res, js)
    row['engine']['normShow'] = '48 / ' + str(NBIG) + ' (per row)'
    row['engine']['norm'] = [48, 0, 0, 0]
    row['engine']['families'][0]['maxAbsCoefficient'] = int(np.abs(S).max())
    K.write_row(row)
    print('qiushi-38 %s: %d pairs, %d contacts, %d violations; second %s; js %s (%.0f s)' % (
        res['verdict'], pairs, bulk['contacts'], bulk['violations'], 'agrees' if second['agree'] else 'DISAGREES', 'agrees' if js['agree'] else 'DISAGREES', time.time() - t0))


if __name__ == '__main__':
    main()
