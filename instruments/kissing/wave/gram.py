"""instruments/kissing/wave/gram.py — a kissing configuration decided in GRAM FORM, exactly.

A claimant who builds a configuration inside a lattice can publish it the way the construction states it: integer
coefficient rows z in a lattice basis and the exact Gram matrix G of that basis, so that the inner product of two
points is z G z'^T — no Cartesian export, no irrational normalisation. A projection or a section written over a
common denominator s comes as integer rows z = s p; the inner products are then z G z'^T / s^2.

The contract (what a claimant publishes, everything pinned by sha256):
    rows    n integer rows of m coefficients
    gram    the m x m Gram matrix as integers over one positive denominator: G = num / den, symmetric
    scale   s >= 1 (the rows are s times the rational coefficient rows)
    claim   n, the dimension d of the span, and the squared norm q (a rational in G's units)

What is decided, from those bytes alone:
    - G is symmetric and positive definite: an exact rational LDL^T, every pivot > 0. So the rows are points of a
      Euclidean space, distinct rows are distinct points, and the span of the points has the dimension of the span of
      the coefficient rows;
    - every row has z num z^T = q den s^2 =: N (an integer, or the claim is refused); every row distinct;
    - the span: a seeded sample has rank d over Q (exact rational elimination) and every row is orthogonal, in
      coefficient space, to the integer vectors spanning the sample's null space — the rows span exactly d dimensions;
    - EVERY PAIR: 2 z num z'^T <= N (angle >= 60 degrees). W = Z num is formed once in int64 under a checked bound,
      and the pairs are W_A Z_B^T tiles in BLAS: float32 when every partial sum is bounded below 2^24
      (max_i ||W_i||_1 * max |z| < 2^24), float64 when below 2^53, refused otherwise. Every value is then an integer
      held exactly; contacts (2P = N) and the largest non-contact are counted exactly;
    - a second implementation: a seeded sample's pairs in plain Python integers, which must give the bulk path's
      counts on the same rows.
This module decides; tools/run-kissing-gram.py feeds it (a claimant's data, or a calibration from data already decided
in Cartesian form) and writes the record. The battery is gram_battery.py, the JavaScript second language gramcheck.js.
"""
import hashlib, json, os, random, time
from fractions import Fraction
import multiprocessing as mp
import numpy as np

F24, F53, I62 = 1 << 24, 1 << 53, 1 << 62


class Refused(Exception):
    """the data cannot be decided as given (not a malformed claim's verdict, a refusal to decide)"""


def gram_facts(num, den=1):
    """symmetry and positive definiteness of G = num / den, exactly: LDL^T over Q, every pivot > 0"""
    m = len(num)
    if den <= 0 or any(len(r) != m for r in num):
        raise Refused('the Gram matrix is not square with a positive denominator')
    sym = all(num[i][j] == num[j][i] for i in range(m) for j in range(i))
    A = [[Fraction(int(v)) for v in r] for r in num]
    pivots = []
    for k in range(m):
        p = A[k][k]
        pivots.append(p)
        if p <= 0:
            break
        for i in range(k + 1, m):
            if A[i][k] != 0:
                f = A[i][k] / p
                Ai, Ak = A[i], A[k]
                for j in range(k + 1, m):
                    Ai[j] -= f * Ak[j]
    pd = sym and len(pivots) == m and all(p > 0 for p in pivots)
    det = Fraction(1)
    for p in pivots:
        det *= p
    return {'m': m, 'symmetric': sym, 'positiveDefinite': pd, 'det': str(det / Fraction(den) ** m) if pd else None}


def rank_and_nullspace(rows):
    """exact rank over Q of integer rows, and an integer basis of the orthogonal complement of their span"""
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
    basis = []
    for f in (c for c in range(ncol) if c not in piv):
        v = [Fraction(0)] * ncol; v[f] = Fraction(1)
        for i, c in enumerate(piv):
            v[c] = -M[i][f]
        den = 1
        for x in v:
            den = den * x.denominator // int(np.gcd(den, x.denominator))
        basis.append([int(x * den) for x in v])
    return r, basis


_W = _Z = None   # the bulk arrays, shared with forked workers
_N = 0


def _tile(task):
    a, b, tile = task
    n = _Z.shape[0]
    P = _W[a * tile:min(n, (a + 1) * tile)] @ _Z[b * tile:min(n, (b + 1) * tile)].T
    vals = P[np.triu_indices(P.shape[0], 1)] if a == b else P.ravel()
    v2 = 2 * vals                          # exact: integers below 2^24 (float32) or 2^53 (float64), doubled exactly
    below = vals[v2 < _N]
    return (vals.size, int(np.count_nonzero(v2 > _N)), int(np.count_nonzero(v2 == _N)),
            float(vals.max()) if vals.size else -1e300, float(below.max()) if below.size else -1e300)


def python_pairs(Zs, num, N):
    """the second implementation: every pair of the sample in plain Python integers"""
    rows = [[int(v) for v in r] for r in Zs]
    G = [[int(v) for v in r] for r in num]
    m = len(G)
    W = [[sum(z[l] * G[l][k] for l in range(m)) for k in range(m)] for z in rows]
    viol = cont = 0; mx = None
    for i in range(len(rows)):
        wi = W[i]
        for j in range(i + 1, len(rows)):
            s = sum(a * b for a, b in zip(wi, rows[j]))
            if 2 * s > N: viol += 1
            elif 2 * s == N: cont += 1
            mx = s if mx is None or s > mx else mx
    return {'pairs': len(rows) * (len(rows) - 1) // 2, 'violations': viol, 'contacts': cont, 'maxDot': mx}


def decide(Z, num, den=1, scale=1, norm=None, dim=None, count=None, procs=None, tile=2048, sample=600, seed=7, log=print):
    """Z: n x m integer numpy array of coefficient rows; num/den: the Gram matrix; scale: s; norm: the claimed squared
       norm q (Fraction or str); dim, count: the claimed span dimension and number of points. Returns the record
       fields {facts, bulk, second, verdict}; raises Refused when the data cannot be decided as given."""
    global _W, _Z, _N
    t0 = time.time()
    num = [[int(v) for v in r] for r in num]
    m = len(num)
    Z = np.asarray(Z)
    if Z.ndim != 2 or Z.shape[1] != m or not np.issubdtype(Z.dtype, np.integer):
        raise Refused('the rows are not an integer n x %d array' % m)
    g = gram_facts(num, den)
    if not (g['symmetric'] and g['positiveDefinite']):
        raise Refused('the Gram matrix is not symmetric positive definite: %s' % json.dumps(g))
    q = Fraction(norm)
    Nq = q * den * scale * scale
    if Nq.denominator != 1 or Nq <= 0:
        raise Refused('the claimed norm %s times den * scale^2 is not a positive integer' % q)
    N = int(Nq)
    zmax = int(np.abs(Z).max())
    gl1 = max(sum(abs(v) for v in r) for r in num)
    if zmax * gl1 >= I62:
        raise Refused('Z num would overflow int64')
    G64 = np.array(num, dtype=np.int64)
    n = Z.shape[0]
    CH = 1 << 18
    norms_ok = True; wl1 = 0
    for c0 in range(0, n, CH):                                           # pass 1: the bound and the norms, nothing stored
        Zc = Z[c0:c0 + CH].astype(np.int64)
        Wc = Zc @ G64                                                    # int64, exact under the bound above
        wl1 = max(wl1, int(np.abs(Wc).sum(axis=1).max()))
        norms_ok = norms_ok and bool(np.all((Wc * Zc).sum(axis=1) == N))
    bound = wl1 * zmax
    path = 'float32' if bound < F24 else 'float64' if bound < F53 else None
    if path is None:
        raise Refused('the partial-sum bound %d is not below 2^53' % bound)
    dt = np.float32 if path == 'float32' else np.float64
    Wf = np.empty((n, m), dtype=dt)                                      # pass 2: W in the dtype the bound allows
    for c0 in range(0, n, CH):
        Wf[c0:c0 + CH] = Z[c0:c0 + CH].astype(np.int64) @ G64            # every entry an integer below the bound: exact in dt
    facts = {'rows': int(n), 'm': m, 'gram': g, 'den': den, 'scale': scale, 'norm': str(q), 'normInteger': N,
             'allNormsEqual': norms_ok, 'maxAbsCoefficient': zmax, 'partialSumBound': bound, 'path': path}
    u = np.unique(np.ascontiguousarray(Z).view(np.dtype((np.void, Z.dtype.itemsize * m))))
    facts['distinctRows'] = int(u.size)
    rng = random.Random(2026)
    smp = sorted(rng.sample(range(n), min(400, n)))
    r, basis = rank_and_nullspace([Z[i].tolist() for i in smp])
    if basis:
        K = np.array(basis, dtype=object).T if max(abs(v) for b in basis for v in b) >= 1 << 30 else np.array(basis, dtype=np.int64).T
        inspan = True
        for c0 in range(0, n, 1 << 18):
            Zc = Z[c0:c0 + (1 << 18)]
            inspan = inspan and bool(np.all((Zc.astype(K.dtype) @ K) == 0))
    else:
        inspan = True
    facts.update({'sampleRankOverQ': r, 'complementVectors': len(basis), 'allRowsInTheSpan': inspan,
                  'spanDimension': r if inspan else None})
    log('gram form: %d rows in %d coefficients, G %s, norm %s (N = %d), distinct %d, span %s, bound %d -> %s (%.0f s)' % (
        n, m, 'symmetric positive definite', q, N, facts['distinctRows'], facts['spanDimension'], bound, path, time.time() - t0))
    _W = Wf; del Wf
    _Z = Z.astype(dt); _N = N
    nb = (n + tile - 1) // tile
    tasks = [(a, b, tile) for a in range(nb) for b in range(a, nb)]
    rng.shuffle(tasks)
    pairs = viol = cont = 0; mx = nbm = -1e300
    t1 = time.time(); done = 0
    procs = procs or os.cpu_count() or 1
    if procs == 1 or len(tasks) < 64:
        it = map(_tile, tasks); pool = None
    else:
        pool = mp.get_context('fork').Pool(procs); it = pool.imap_unordered(_tile, tasks, chunksize=64)
    try:
        for p_, v_, c_, m_, b_ in it:
            pairs += p_; viol += v_; cont += c_; mx = max(mx, m_); nbm = max(nbm, b_); done += 1
            if done % 20000 == 0:
                log('  %d / %d tiles, %.0f s, %d violations so far' % (done, len(tasks), time.time() - t1, viol))
    finally:
        if pool:
            pool.close(); pool.join()
    bulk = {'pairs': pairs, 'violations': viol, 'contacts': cont, 'maxDot': int(mx) if pairs else None,
            'nearestNonContactDot': int(nbm) if nbm > -1e300 else None,
            'nearestNonContactCos': (str(Fraction(int(nbm), N)) if nbm > -1e300 else None),
            'tiles': len(tasks), 'tile': tile, 'seconds': round(time.time() - t1, 1),
            'exactness': '%s BLAS on W = Z num (int64, exact) against Z; every partial sum is bounded by max ||W_i||_1 * max|z| = %d < 2^%d'
                         % (path, bound, 24 if path == 'float32' else 53)}
    k = min(sample, n)
    sm = sorted(random.Random(seed).sample(range(n), k))
    py = python_pairs(Z[sm], num, N)
    Ps = _W[sm] @ _Z[sm].T
    iu = np.triu_indices(k, 1)
    v2 = 2 * Ps[iu]
    second = {'rows': k, 'pairs': int(len(iu[0])), 'pythonViolations': py['violations'], 'pythonContacts': py['contacts'],
              'bulkViolations': int(np.count_nonzero(v2 > N)), 'bulkContacts': int(np.count_nonzero(v2 == N)),
              'how': 'plain Python integers, no numpy, no BLAS'}
    second['agree'] = second['pythonViolations'] == second['bulkViolations'] and second['pythonContacts'] == second['bulkContacts']
    ok = (norms_ok and facts['distinctRows'] == n and (count is None or n == count)
          and (dim is None or facts['spanDimension'] == dim) and viol == 0 and second['agree'])
    _W = _Z = None
    return {'verdict': 'WITNESSED' if ok else 'UNWITNESSED', 'facts': facts, 'bulk': bulk, 'second': second,
            'seconds': round(time.time() - t0, 1)}


def js_sample(Z, num, N, k=672, seed=11):
    """the third reading: a seeded sample decided whole by gramcheck.js in BigInt (no code shared with this module)"""
    import subprocess, tempfile
    n = Z.shape[0]
    idx = sorted(random.Random(seed).sample(range(n), min(k, n)))
    tmp = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False)
    json.dump({'gram': [[int(v) for v in r] for r in num], 'normInteger': int(N), 'rows': [[int(v) for v in Z[i]] for i in idx]}, tmp)
    tmp.close()
    try:
        out = subprocess.check_output(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gramcheck.js'), tmp.name]).decode()
    finally:
        os.unlink(tmp.name)
    js = json.loads(out.strip().splitlines()[-1])
    py = python_pairs(Z[idx], num, N)
    agree = js['pairs'] == py['pairs'] and js['contacts'] == py['contacts'] and js['violations'] == py['violations']
    return {'n': len(idx), 'pairs': js['pairs'], 'jsContacts': js['contacts'], 'jsViolations': js['violations'], 'jsVerdict': js['verdict'],
            'pythonContacts': py['contacts'], 'agree': agree, 'seed': seed, 'jsMs': js['ms'],
            'how': 'a seeded sample decided whole by gramcheck.js (BigInt) and by plain Python integers; no code shared'}


def load_manifest(path):
    """a claimant's Gram-form package: a JSON manifest naming the rows file (binary little-endian intN or CSV) by sha256,
       the Gram matrix, the scale and the claim. Every byte is refused unless it matches its pin."""
    M = json.load(open(path))
    base = os.path.dirname(os.path.abspath(path))
    r = M['rows']
    blob = open(os.path.join(base, r['file']), 'rb').read()
    if hashlib.sha256(blob).hexdigest() != r['sha256']:
        raise Refused('the rows file does not match its pin')
    if r['format'] == 'csv':
        Z = np.array([[int(v) for v in line.split(',')] for line in blob.decode().splitlines() if line.strip()], dtype=np.int64)
    else:
        Z = np.frombuffer(blob, dtype=np.dtype(r['format']).newbyteorder('<')).reshape(-1, r['columns']).astype(np.int64)
    if Z.shape[1] != r['columns']:
        raise Refused('the rows do not have %d columns' % r['columns'])
    g = M['gram']
    return {'Z': Z, 'num': g['num'], 'den': int(g.get('den', 1)), 'scale': int(M.get('scale', 1)),
            'norm': M['claim']['norm'], 'dim': int(M['claim']['dimension']), 'count': int(M['claim']['count'])}
