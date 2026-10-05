"""engine.py — every pair of a large kissing configuration, decided exactly.

A configuration is a list of FAMILIES. A family is n vectors in R^dim whose coordinates are integer
combinations of {1, sqrt2, sqrt3, sqrt6}, stored as a (4, n, dim) integer array (component-major),
optionally with a positive integer denominator per vector. Every vector of the configuration has
the SAME real norm N (an element of Q(sqrt2, sqrt3), in practice rational), checked exactly per
vector before anything else runs. Then two vectors are compatible iff 2<x, y> <= N, i.e.

    slack(x, y) = N den_x den_y - 2 <X, Y>  >= 0          (X, Y the integer numerators)

and a pair TOUCHES iff the slack is exactly 0. A repeated vector has slack -N < 0 and refutes; a
zero vector cannot have norm N. A family may instead be FREE-NORM (each vector its own exact norm;
used for points normalised by an irrational factor, e.g. 2k/sqrt(1007176)): those pairs use the
scale-invariant form  <x,y> <= 0  or  4<x,y>^2 <= |x|^2 |y|^2,  in Python integers.

Two paths, one verdict:
  GEMM    int64 families: each component product X_b Y_b'^T is an integer matrix product done in
          float32 or float64 BLAS, which is exact when dim * max|X| * max|Y| stays below 2^24
          (resp. 2^53) — every partial sum, in any summation order, is bounded by that. The bound
          is computed from the data and a family pair that fails it is refused, never rounded.
          Results are cast to int64 (exact below 2^53) and combined under a 2^62 guard; signs are
          decided by qfield.sign_arrays.
  OBJECT  families holding big integers (dtype=object): numpy object matmul, i.e. Python
          integers, unbounded; signs by qfield.sign, one element at a time.

A SPOT CHECK re-decides sampled pairs of every family pair with plain Python integers (no numpy,
no BLAS) and must agree with the bulk path pair for pair — a second implementation inside the run.
Floats appear only in display fields (cosines, timings) and in choosing which exact candidates to
compare when reporting the largest inner product; no verdict, contact or count depends on them.
"""
import time, random
import numpy as np
import qfield as QF

F32_LIM = 1 << 24
F64_LIM = 1 << 53
ROUND = 1.0e-9   # display tolerance for picking exact candidates of a maximum (never a verdict)


class Family:
    def __init__(self, name, C, den=None, free_norm=False, note=''):
        C = np.asarray(C)
        if C.ndim != 3 or C.shape[0] != 4:
            raise ValueError('family %s: coefficients must be (4, n, dim)' % name)
        self.name, self.note, self.free_norm = name, note, free_norm
        self.big = C.dtype == object or (den is not None)
        self.C = C if self.big else C.astype(np.int64)
        if self.big:
            self.C = np.array([[[int(x) for x in row] for row in comp] for comp in C], dtype=object)
        self.n, self.dim = C.shape[1], C.shape[2]
        self.den = None if den is None else [int(x) for x in den]
        if self.den is not None and (len(self.den) != self.n or min(self.den) <= 0):
            raise ValueError('family %s: denominators must be positive, one per vector' % name)
        self.active = [b for b in range(4) if np.any(self.C[b] != 0)]
        # per component, the coordinates where some vector of the family is non-zero: a component product
        # X_i Y_j^T is structurally zero unless the two supports meet
        self.supp = [np.any(self.C[b] != 0, axis=0) for b in range(4)]

    def maxabs(self):
        if self.big:
            return max((abs(int(x)) for x in self.C.reshape(-1)), default=0)
        return int(np.abs(self.C).max()) if self.C.size else 0

    def row(self, i):
        """the i-th vector as python ints: list of dim tuples (a, b, c, d), and its denominator"""
        return [tuple(int(self.C[b, i, k]) for b in range(4)) for k in range(self.dim)], (1 if self.den is None else self.den[i])


def meets(F, G_, i, j):
    """does component i of F meet component j of G_ on some coordinate"""
    return bool(np.any(F.supp[i] & G_.supp[j]))


def pair_comps(F, G_):
    return {t for (t, _, i, j) in TABLE if meets(F, G_, i, j)}


def dot_py(x, y):
    acc = (0, 0, 0, 0)
    for u, v in zip(x, y):
        acc = QF.add(acc, QF.mul(u, v))
    return acc


def check_norms(fams, N):
    """every vector's exact norm equals N den^2 (free-norm families: positive); returns the norms of
    free-norm vectors"""
    free = {}
    for F in fams:
        if F.big or F.free_norm:
            for i in range(F.n):
                x, den = F.row(i)
                nx = dot_py(x, x)
                if F.free_norm:
                    if QF.sign(*nx) <= 0:
                        raise AssertionError('family %s row %d: zero vector' % (F.name, i))
                    free[(F.name, i)] = nx
                elif tuple(nx) != tuple(QF.scale(N, den * den)):
                    raise AssertionError('family %s row %d: norm %s, not N den^2' % (F.name, i, QF.show(nx)))
        else:
            G = gram_components(F.C, F.C, diag_only=True)
            for b in range(4):
                if not np.all(G[b] == N[b]):
                    bad = int(np.nonzero(G[b] != N[b])[0][0])
                    raise AssertionError('family %s row %d: norm component %d is %d, not %d' % (F.name, bad, b, int(G[b][bad]), N[b]))
    return free


# component products: (target component, factor, i, j) for X_i Y_j^T
TABLE = [(0, 1, 0, 0), (0, 2, 1, 1), (0, 3, 2, 2), (0, 6, 3, 3),
         (1, 1, 0, 1), (1, 1, 1, 0), (1, 3, 2, 3), (1, 3, 3, 2),
         (2, 1, 0, 2), (2, 1, 2, 0), (2, 2, 1, 3), (2, 2, 3, 1),
         (3, 1, 0, 3), (3, 1, 3, 0), (3, 1, 1, 2), (3, 1, 2, 1)]


def gram_components(X, Y, diag_only=False):
    """exact (4, nx, ny) int64 Gram components of integer families X, Y ((4, n, dim) int64), via
    BLAS under the exactness guard; diag_only returns the (4, n) diagonal of X X^T"""
    dim = X.shape[2]
    mx = [int(np.abs(X[b]).max()) if X[b].size else 0 for b in range(4)]
    my = [int(np.abs(Y[b]).max()) if Y[b].size else 0 for b in range(4)]
    if diag_only:
        out = np.zeros((4, X.shape[1]), dtype=np.int64)
        for (t, f, i, j) in TABLE:
            if mx[i] and mx[j]:
                if dim * mx[i] * mx[j] * 12 >= (1 << 62):
                    raise OverflowError('diagonal norm would overflow int64')
                out[t] += f * np.einsum('nk,nk->n', X[i], X[j])
        return out
    out = np.zeros((4, X.shape[1], Y.shape[1]), dtype=np.int64)
    for (t, f, i, j) in TABLE:
        if not (mx[i] and my[j]):
            continue
        worst = dim * mx[i] * my[j]
        if worst < F32_LIM:
            P = X[i].astype(np.float32) @ Y[j].astype(np.float32).T
        elif worst < F64_LIM:
            P = X[i].astype(np.float64) @ Y[j].astype(np.float64).T
        else:
            raise OverflowError('GEMM refused: dim*max|X|*max|Y| = %d is not below 2^53' % worst)
        if 12 * worst >= (1 << 62):
            raise OverflowError('component sum would leave int64')
        out[t] += f * P.astype(np.int64)
    return out


class Tally:
    def __init__(self, a, b):
        self.a, self.b = a, b
        self.pairs = 0
        self.contacts = 0
        self.violations = 0
        self.witness = None
        self.max_s = None          # exact (a,b,c,d) of the largest numerator inner product (uniform den only)
        self.max_cos = None        # display
        self.near_s = None         # largest inner product among NON-touching pairs, exact
        self.near_cos = None
        self.gemm = None

    def offer(self, field, s_exact, cosv):
        cur = getattr(self, field)
        if cur is None or QF.sign(*QF.sub(s_exact, cur)) > 0:
            setattr(self, field, tuple(int(x) for x in s_exact))
            setattr(self, field.replace('_s', '_cos'), cosv)

    def as_dict(self, N):
        d = {'a': self.a, 'b': self.b, 'pairs': self.pairs, 'contacts': self.contacts, 'violations': self.violations}
        if self.witness:
            d['witness'] = self.witness
        if self.max_s is not None:
            d['maxDot'] = list(self.max_s); d['maxDotShow'] = QF.show(self.max_s); d['maxCos'] = self.max_cos
        elif self.max_cos is not None:
            d['maxCos'] = self.max_cos          # display only (object / digit paths): the verdict never reads it
        if self.near_s is not None:
            d['nearestNonContactDot'] = list(self.near_s); d['nearestNonContactShow'] = QF.show(self.near_s); d['nearestNonContactCos'] = self.near_cos
        elif self.near_cos is not None:
            d['nearestNonContactCos'] = self.near_cos
        if self.gemm:
            d['gemm'] = self.gemm
        return d


def _float_value(G):
    return G[0].astype(np.float64) + G[1] * 2 ** 0.5 + G[2] * 3 ** 0.5 + G[3] * 6 ** 0.5


def _exact_max(G, mask, Nf, tally, field):
    """among entries selected by mask, find the exact maximum inner product: floats only choose the
    candidates within ROUND*N of the float maximum; the candidates' distinct exact values are compared
    exactly"""
    if not mask.any():
        return
    v = _float_value(G)
    v = np.where(mask, v, -np.inf)
    top = v.max()
    cand = np.nonzero(v >= top - ROUND * abs(Nf) - 1e-9)
    tuples = set(zip(*(G[b][cand].tolist() for b in range(4))))
    for s in tuples:
        tally.offer(field, s, QF.approx(s) / Nf)


def _block(F, G_, N, i0, i1, j0, j1, tri, fast, two=None):
    """decide rows i0:i1 of F against columns j0:j1 of G_; tri: the block is on the diagonal of a
    family against itself, keep only j > i. Returns a partial tally as a dict."""
    out = {'pairs': 0, 'contacts': 0, 'violations': 0, 'witness': None, 'max': set(), 'near': set()}
    X = F.C[:, i0:i1, :]
    Y = G_.C[:, j0:j1, :]
    nr, nc = i1 - i0, j1 - j0
    keep = None
    if tri:
        keep = np.arange(nc)[None, :] > np.arange(nr)[:, None]
        out['pairs'] = int(keep.sum())
    else:
        out['pairs'] = nr * nc
    if out['pairs'] == 0:
        return out
    if fast:
        # rational fast path: the Gram is purely rational, a = X1 Y1' + 2 X2 Y2' + 3 X3 Y3' + 6 X6 Y6' over the
        # component pairs whose supports meet; exact integers held in float32/float64 under the guard
        terms = [(f, i, j) for (t, f, i, j) in TABLE if t == 0 and meets(F, G_, i, j)]
        worst = sum(f * F.dim * int(np.abs(X[i]).max()) * int(np.abs(Y[j]).max()) for (f, i, j) in terms)
        dt = np.float32 if (worst < F32_LIM and abs(N[0]) < F32_LIM) else np.float64
        if worst >= F64_LIM or abs(N[0]) >= F64_LIM:
            raise OverflowError('GEMM refused: %d is not below 2^53' % worst)
        P = np.zeros((nr, nc), dtype=dt)
        for (f, i, j) in terms:
            P += dt(f) * (X[i].astype(dt) @ Y[j].astype(dt).T)
        if keep is not None:
            P = np.where(keep, P, dt(-1.0e30))
        N0 = N[0]
        # compatible iff 2P <= N0; exact on integer-valued floats (|2P| < 2^25 resp. 2^54 is still exact:
        # doubling is exact in binary floating point)
        twoP = P + P
        nb = int(np.count_nonzero(twoP > N0))
        if nb:
            out['violations'] = nb
            r_, c_ = np.argwhere(twoP > N0)[0]
            s = (int(P[r_, c_]), 0, 0, 0)
            out['witness'] = {'i': int(i0 + r_), 'j': int(j0 + c_), 'dot': list(s), 'dotShow': QF.show(s), 'cosApprox': s[0] / N0}
        out['contacts'] = int(np.count_nonzero(twoP == N0))
        mxv = P.max()
        out['max'].add((int(mxv), 0, 0, 0))
        below = np.where(twoP < N0, P, P.dtype.type(-1.0e30))
        nv = below.max()
        if nv > -1.0e29:
            out['near'].add((int(nv), 0, 0, 0))
        return out
    if two is not None:
        return _block_two(X, Y, N, two, keep, out, i0, j0, nr, nc, F.dim)
    S = gram_components(X, Y)
    if keep is None:
        keep = np.ones((nr, nc), dtype=bool)
    slack = QF.sign_arrays(N[0] - 2 * S[0], N[1] - 2 * S[1], N[2] - 2 * S[2], N[3] - 2 * S[3])
    bad = (slack < 0) & keep
    if bad.any():
        out['violations'] = int(bad.sum())
        r_, c_ = np.argwhere(bad)[0]
        s = tuple(int(S[b][r_, c_]) for b in range(4))
        out['witness'] = {'i': int(i0 + r_), 'j': int(j0 + c_), 'dot': list(s), 'dotShow': QF.show(s), 'cosApprox': QF.approx(s) / QF.approx(N)}
    out['contacts'] = int(((slack == 0) & keep).sum())
    Nf = QF.approx(N)
    for field, mask in (('max', keep), ('near', keep & (slack > 0))):
        if not mask.any():
            continue
        v = np.where(mask, _float_value(S), -np.inf)
        top = v.max()
        cand = np.nonzero(v >= top - ROUND * abs(Nf) - 1e-9)
        out[field] |= set(zip(*(S[b][cand].tolist() for b in range(4))))
    return out


RADICAND = {1: 2, 2: 3, 3: 6}


def _two_component(F, G_, N):
    """when the Gram of this family pair has a rational part and at most ONE irrational part (and N is
    rational), return that part's index (0 if none); else None"""
    if N[1] or N[2] or N[3]:
        return None
    comps = pair_comps(F, G_)
    irr = comps - {0}
    if len(irr) > 1:
        return None
    return irr.pop() if irr else 0


def _block_two(X, Y, N, t, keep, out, i0, j0, nr, nc, dim):
    """slack = A + B sqrt(m) with A = N - 2a, B = -2 s_t, held in float64 as exact integers: every
    product is guarded below 2^53 for this block before it is formed"""
    mx = [int(np.abs(X[b]).max()) if X[b].size else 0 for b in range(4)]
    my = [int(np.abs(Y[b]).max()) if Y[b].size else 0 for b in range(4)]
    comp = {}
    for (tt, f, i, j) in TABLE:
        if tt not in (0, t) or not (mx[i] and my[j]):
            continue
        worst = dim * mx[i] * my[j]
        if 12 * worst >= F64_LIM:
            raise OverflowError('two-component path refused: 12*dim*max*max = %d is not below 2^53' % (12 * worst))
        dt = np.float32 if worst < F32_LIM else np.float64
        P = (X[i].astype(dt) @ Y[j].astype(dt).T).astype(np.float64)
        comp[tt] = comp.get(tt, 0) + f * P
    a = comp.get(0, np.zeros((nr, nc)))
    st = comp.get(t, np.zeros((nr, nc))) if t else np.zeros((nr, nc))
    A = N[0] - 2 * a
    B = -2 * st
    m = RADICAND.get(t, 1)
    mA, mB = float(np.abs(A).max()), float(np.abs(B).max())
    if not (mA * mA < F64_LIM and m * mB * mB < F64_LIM):
        raise OverflowError('two-component squares would leave 2^53')
    zero = (A == 0) & (B == 0)
    sg = np.where((A >= 0) & (B >= 0), 1, np.where((A <= 0) & (B <= 0), -1, 0)).astype(np.int8)
    mixed = sg == 0
    sg[zero] = 0
    if mixed.any():
        T = A[mixed] * A[mixed] - m * B[mixed] * B[mixed]
        if np.any(T == 0):
            raise ArithmeticError('A^2 = m B^2 with (A, B) != 0 — impossible')
        sg[mixed] = np.where(T > 0, np.sign(A[mixed]), np.sign(B[mixed])).astype(np.int8)
    if keep is None:
        keep = np.ones((nr, nc), dtype=bool)
    bad = (sg < 0) & keep
    if bad.any():
        out['violations'] = int(bad.sum())
        r_, c_ = np.argwhere(bad)[0]
        s = [0, 0, 0, 0]; s[0] = int(a[r_, c_])
        if t:
            s[t] = int(st[r_, c_])
        out['witness'] = {'i': int(i0 + r_), 'j': int(j0 + c_), 'dot': s, 'dotShow': QF.show(s), 'cosApprox': QF.approx(s) / N[0]}
    out['contacts'] = int(((sg == 0) & keep).sum())
    v = a + st * (m ** 0.5 if t else 0.0)
    for field, mask in (('max', keep), ('near', keep & (sg > 0))):
        if not mask.any():
            continue
        vv = np.where(mask, v, -np.inf)
        top = vv.max()
        cand = np.nonzero(vv >= top - ROUND * abs(N[0]) - 1e-9)
        for pa, ps in np.unique(np.stack([a[cand], st[cand]], 1), axis=0):
            s = [int(pa), 0, 0, 0]
            if t:
                s[t] = int(ps)
            out[field].add(tuple(s))
    return out


THREADS = 6


def decide_gemm(F, G_, N, chunk, tally, same):
    from concurrent.futures import ThreadPoolExecutor
    n, m = F.n, G_.n
    worst = max((F.dim * int(np.abs(F.C[i]).max()) * int(np.abs(G_.C[j]).max())
                 for (_, _, i, j) in TABLE if meets(F, G_, i, j)), default=0)
    comps = pair_comps(F, G_)
    fast = comps == {0} and N[1] == N[2] == N[3] == 0
    tally.gemm = {'worstPartialSum': worst, 'precision': 'float32' if worst < F32_LIM else 'float64',
                  'bound': '2^24' if worst < F32_LIM else '2^53', 'path': 'rational' if fast else 'Q(sqrt2,sqrt3)'}
    jobs = []
    for i0 in range(0, n, chunk):
        i1 = min(n, i0 + chunk)
        if same:
            jobs.append((i0, i1, i0, i1, True))
            for j0 in range(i1, m, 8 * chunk):
                jobs.append((i0, i1, j0, min(m, j0 + 8 * chunk), False))
        else:
            for j0 in range(0, m, 8 * chunk):
                jobs.append((i0, i1, j0, min(m, j0 + 8 * chunk), False))
    Nf = QF.approx(N)
    with ThreadPoolExecutor(max_workers=THREADS) as ex:
        two = None if fast else _two_component(F, G_, N)
        tally.gemm['path'] = 'rational' if fast else ('two-component Z[sqrt%d]' % RADICAND[two] if two else ('rational' if two == 0 else 'Q(sqrt2,sqrt3)'))
        for part in ex.map(lambda jb: _block(F, G_, N, *jb[:4], jb[4], fast, two), jobs):
            tally.pairs += part['pairs']
            tally.contacts += part['contacts']
            tally.violations += part['violations']
            if part['witness'] and tally.witness is None:
                tally.witness = part['witness']
            for s in part['max']:
                tally.offer('max_s', s, QF.approx(s) / Nf)
            for s in part['near']:
                tally.offer('near_s', s, QF.approx(s) / Nf)


DIG = 22                      # balanced base-2^22 digits


def _digits(x, k):
    """balanced base-2^DIG digits of a Python int, low first, exactly k of them; refuses a larger x"""
    out = []
    for _ in range(k):
        d = ((x + (1 << (DIG - 1))) % (1 << DIG)) - (1 << (DIG - 1))
        out.append(d)
        x = (x - d) >> DIG
    if x != 0:
        raise OverflowError('numerator beyond %d balanced digits' % k)
    return out


def _limb_rational(F, G_, N, tally):
    """a BIG family F (Python-int numerators, per-vector denominators) against a large int64 family
    G_ whose Gram with F is purely rational. Every numerator is split into k balanced base-2^22
    digits; each digit matrix is multiplied in float64 (exact: 12 dim 2^21 max|G| < 2^53, checked);
    the slack D = N den - 2 s = sum_q e_q 2^(22 q) is then signed top-down in int64: R starts at the
    top digit; while |R| <= T (T chosen so that |R| > T outweighs every lower digit) the next digit is
    shifted in, R = R 2^22 + e_q, which stays below 2^42; once |R| > T the sign is sign(R). No Python
    integer per pair, no rounding anywhere."""
    n, m = F.n, G_.n
    dim = F.dim
    comp = [(i, j, f) for (t, f, i, j) in TABLE if t == 0 and meets(F, G_, i, j)]
    gmax = int(np.abs(G_.C).max())
    if 12 * dim * (1 << (DIG - 1)) * gmax >= F64_LIM:
        raise OverflowError('limb GEMM would not be exact')
    big = max([abs(int(x)) for x in F.C.reshape(-1)] + [abs(N[0] * d) for d in F.den])
    k = 1
    while (1 << (DIG * k - 1)) <= big:
        k += 1
    k += 1
    Fd = np.zeros((k, 4, n, dim))
    for b_ in range(4):
        for r in range(n):
            for c in range(dim):
                x = int(F.C[b_, r, c])
                if x:
                    for q, d in enumerate(_digits(x, k)):
                        Fd[q, b_, r, c] = d
    Sd = []
    for q in range(k):
        acc = np.zeros((n, m))
        for (i, j, f) in comp:
            acc += f * (Fd[q, i] @ G_.C[j].astype(np.float64).T)
        Sd.append(acc.astype(np.int64))           # exact: |entries| < 12 dim 2^21 gmax < 2^53
    Nd = np.array([_digits(N[0] * d, k) for d in F.den], dtype=np.int64)   # (n, k)
    e = [Nd[:, q][:, None] - 2 * Sd[q] for q in range(k)]
    emax = max(int(np.abs(x).max()) for x in e)
    if emax >= (1 << 40):
        raise OverflowError('limb reassembly refused: a digit difference reached 2^40')
    T = emax // (1 << DIG) + 2
    R = e[k - 1].copy()
    sg = np.zeros((n, m), dtype=np.int8)
    done = np.zeros((n, m), dtype=bool)
    for q in range(k - 2, -1, -1):
        dec = ~done & (np.abs(R) > T)
        sg[dec] = np.sign(R[dec]).astype(np.int8)
        done |= dec
        R = np.where(done, 0, R * (1 << DIG) + e[q])
    sg[~done] = np.sign(R[~done]).astype(np.int8)
    # the limb path checked against plain Python integers on sampled pairs, pair for pair
    import random as _r
    rng = _r.Random(7)
    for _ in range(300):
        r_, c_ = rng.randrange(n), rng.randrange(m)
        x, dx = F.row(r_)
        y, _ = G_.row(c_)
        sv = dot_py(x, y)
        if QF.sign(*QF.sub(QF.scale(N, dx), QF.scale(sv, 2))) != int(sg[r_, c_]):
            raise AssertionError('limb path disagrees with plain integers at (%d, %d)' % (r_, c_))
    tally.pairs += n * m
    bad = sg < 0
    if bad.any():
        tally.violations += int(bad.sum())
        r_, c_ = np.argwhere(bad)[0]
        tally.witness = {'i': int(r_), 'j': int(c_), 'how': 'limb path'}
    tally.contacts += int((sg == 0).sum())
    # display only: the largest cosine, s / (N den), from the digits in floating point (never a verdict)
    sf = sum(Sd[q].astype(np.float64) * float(1 << (DIG * q)) for q in range(k))
    cosv = sf / (QF.approx(N) * np.array([float(d) for d in F.den])[:, None])
    mc = float(cosv.max())
    tally.max_cos = mc if tally.max_cos is None else max(tally.max_cos, mc)
    nc = cosv[sg > 0]
    if nc.size:
        v = float(nc.max())
        tally.near_cos = v if tally.near_cos is None else max(tally.near_cos, v)
    tally.gemm = {'path': 'balanced base-2^22 digits (%d), a float64 GEMM per digit (exact), top-down int64 sign' % k, 'digits': k}


def decide_object(F, G_, N, tally, same, free_norms):
    """Python-integer path: big numerators with per-vector denominators, or free-norm vectors"""
    Nf = QF.approx(N)
    n, m = F.n, G_.n
    if not same and not (F.free_norm or G_.free_norm) and not (N[1] or N[2] or N[3]):
        bigF, other = (F, G_) if F.big else (G_, F)
        if bigF.big and not other.big and other.n > 5000:
            comps = pair_comps(bigF, other)
            if comps == {0}:
                return _limb_rational(bigF, other, N, tally)
    # exact Gram numerators via object matmul (Python ints)
    S = [np.zeros((n, m), dtype=object) for _ in range(4)]
    XC = F.C if F.big else F.C.astype(object)
    YC = G_.C if G_.big else G_.C.astype(object)
    for (t, f, i, j) in TABLE:
        if np.any(XC[i] != 0) and np.any(YC[j] != 0):
            S[t] = S[t] + f * XC[i].dot(YC[j].T)
    dx = F.den or [1] * n
    dy = G_.den or [1] * m
    for r in range(n):
        for c in range(r + 1 if same else 0, m):
            s = (int(S[0][r, c]), int(S[1][r, c]), int(S[2][r, c]), int(S[3][r, c]))
            tally.pairs += 1
            if F.free_norm or G_.free_norm:
                nx = free_norms.get((F.name, r)) or QF.scale(N, dx[r] * dx[r])
                ny = free_norms.get((G_.name, c)) or QF.scale(N, dy[c] * dy[c])
                if QF.sign(*s) <= 0:
                    sg, cosv = 1, None
                else:
                    sg = QF.sign(*QF.sub(QF.mul(nx, ny), QF.scale(QF.mul(s, s), 4)))
                cosv = QF.approx(s) / (QF.approx(nx) * QF.approx(ny)) ** 0.5
                # report in units of N: the inner product the pair would have at norm N
                s_disp = None
            else:
                dd = dx[r] * dy[c]
                sg = QF.sign(*QF.sub(QF.scale(N, dd), QF.scale(s, 2)))
                cosv = QF.approx(s) / (Nf * dd)
                s_disp = (s, dd)
            if sg < 0:
                tally.violations += 1
                if tally.witness is None:
                    tally.witness = {'i': r, 'j': c, 'dot': list(s), 'dotShow': QF.show(s), 'cosApprox': cosv}
                continue
            if sg == 0:
                tally.contacts += 1
            # largest cosine, tracked as a display value; exact maxima are reported only on the GEMM path
            if tally.max_cos is None or cosv > tally.max_cos:
                tally.max_cos = cosv
            if sg > 0 and (tally.near_cos is None or cosv > tally.near_cos):
                tally.near_cos = cosv


def spot_check(F, G_, N, same, free_norms, rng, k=400):
    """re-decide k sampled pairs with plain Python integers; returns the sampled slack signs"""
    out = []
    for _ in range(k):
        r = rng.randrange(F.n)
        c = rng.randrange(G_.n)
        if same and r == c:
            continue
        x, dx = F.row(r)
        y, dy = G_.row(c)
        s = dot_py(x, y)
        if F.free_norm or G_.free_norm:
            nx = free_norms.get((F.name, r)) or QF.scale(N, dx * dx)
            ny = free_norms.get((G_.name, c)) or QF.scale(N, dy * dy)
            sg = 1 if QF.sign(*s) <= 0 else QF.sign(*QF.sub(QF.mul(nx, ny), QF.scale(QF.mul(s, s), 4)))
        else:
            sg = QF.sign(*QF.sub(QF.scale(N, dx * dy), QF.scale(s, 2)))
        out.append((r, c, sg, s))
    return out


def compare_spot(F, G_, N, samp, free_norms):
    """the bulk path's value for each sampled pair, against the plain-integer one: the exact inner
    product and the slack sign must both agree"""
    if not samp:
        return 0
    bad = 0
    if F.big or G_.big or F.free_norm or G_.free_norm:
        XC = F.C if F.big else F.C.astype(object)
        YC = G_.C if G_.big else G_.C.astype(object)
        for (r, c, sg, s) in samp:
            t = [0, 0, 0, 0]
            for (tt, f, i, j) in TABLE:
                t[tt] += f * int(XC[i][r].dot(YC[j][c]))
            if tuple(t) != tuple(s):
                bad += 1
        return bad
    rows = [r for (r, _, _, _) in samp]
    cols = [c for (_, c, _, _) in samp]
    S = gram_components(F.C[:, rows, :], G_.C[:, cols, :])
    k = np.arange(len(samp))
    D = [S[b][k, k] for b in range(4)]
    sg = QF.sign_arrays(N[0] - 2 * D[0], N[1] - 2 * D[1], N[2] - 2 * D[2], N[3] - 2 * D[3])
    for q, (r, c, sgp, s) in enumerate(samp):
        if tuple(int(D[b][q]) for b in range(4)) != tuple(s) or int(sg[q]) != sgp:
            bad += 1
    # and THE SAME block code the bulk run used (fast / two-component / general), on each sampled pair
    comps = pair_comps(F, G_)
    fast = comps == {0} and not (N[1] or N[2] or N[3])
    two = None if fast else _two_component(F, G_, N)
    for (r, c, sgp, s) in samp:
        part = _block(F, G_, N, r, r + 1, c, c + 1, False, fast, two)
        got = -1 if part['violations'] else (0 if part['contacts'] else 1)
        if got != sgp:
            bad += 1
    return bad


def decide(fams, N, chunk=512, spot=400, seed=2026, log=print, skip=None):
    """decide every pair of the configuration. N: the common exact norm (a, b, c, d).
    skip: optional set of (family name, family name) whose pairs were decided elsewhere and are
    only counted (e.g. a Leech shell subset already decided whole) — every skip is reported."""
    t0 = time.time()
    QF.fallbacks[0] = 0
    names = [F.name for F in fams]
    if len(set(names)) != len(names):
        raise ValueError('family names must be distinct')
    dims = {F.dim for F in fams}
    if len(dims) != 1:
        raise ValueError('families of different dimensions: %s' % dims)
    free_norms = check_norms(fams, N)
    rng = random.Random(seed)
    tallies, spot_bad, spot_n = [], 0, 0
    for a in range(len(fams)):
        for b in range(a, len(fams)):
            F, G_ = fams[a], fams[b]
            same = a == b
            if same and F.n < 2:
                continue
            T = Tally(F.name, G_.name)
            t1 = time.time()
            if skip and ((F.name, G_.name) in skip):
                T.pairs = F.n * (F.n - 1) // 2 if same else F.n * G_.n
                T.inherited = skip[(F.name, G_.name)]
            elif F.big or G_.big or F.free_norm or G_.free_norm:
                decide_object(F, G_, N, T, same, free_norms)
            else:
                decide_gemm(F, G_, N, chunk, T, same)
            # the second implementation: sampled pairs re-decided in plain Python integers and
            # compared, pair for pair, with the bulk path's own arithmetic on the same pairs
            if not (skip and (F.name, G_.name) in skip) and spot:
                samp = spot_check(F, G_, N, same, free_norms, rng, spot)
                spot_n += len(samp)
                spot_bad += compare_spot(F, G_, N, samp, free_norms)
            d = T.as_dict(N)
            if getattr(T, 'inherited', None):
                d['inherited'] = T.inherited
            d['seconds'] = round(time.time() - t1, 2)
            tallies.append(d)
            log('    %-22s x %-22s %14d pairs  %10d contacts  %d violations  %.1fs' % (F.name, G_.name, d['pairs'], d['contacts'], d['violations'], d['seconds']))
    total = sum(t['pairs'] for t in tallies)
    n = sum(F.n for F in fams)
    viol = sum(t['violations'] for t in tallies)
    res = {
        'n': n, 'dim': fams[0].dim, 'norm': list(N), 'normShow': QF.show(N),
        'families': [{'name': F.name, 'n': F.n, 'note': F.note, 'path': 'object' if (F.big or F.free_norm) else 'gemm',
                      'freeNorm': F.free_norm, 'maxAbsCoefficient': F.maxabs() if not F.big else None} for F in fams],
        'pairs': total, 'pairsExpected': n * (n - 1) // 2,
        'contacts': sum(t['contacts'] for t in tallies),
        'violations': viol,
        'verdict': 'CERTIFIED' if viol == 0 and total == n * (n - 1) // 2 else ('REFUTED' if viol else 'INCOMPLETE'),
        'blocks': tallies,
        'spotCheck': {'pairs': spot_n, 'disagreements': spot_bad, 'how': 'sampled pairs re-decided in plain Python integers (no numpy, no BLAS)'},
        'bigintFallbacks': QF.fallbacks[0],
        'seconds': round(time.time() - t0, 1),
    }
    # the global largest inner product and nearest non-contact, exact where every block has one
    ms = [t for t in tallies if 'maxDot' in t]
    if ms and len(ms) == len([t for t in tallies if not t.get('inherited')]):
        best = None
        for t in ms:
            s = tuple(t['maxDot'])
            if best is None or QF.sign(*QF.sub(s, best)) > 0:
                best = s
        res['maxDot'] = list(best); res['maxDotShow'] = QF.show(best); res['maxCos'] = QF.approx(best) / QF.approx(N)
    mcs = [t['maxCos'] for t in tallies if t.get('maxCos') is not None]
    if 'maxCos' not in res and mcs:
        res['maxCos'] = max(mcs)
    nc = [t['nearestNonContactCos'] for t in tallies if t.get('nearestNonContactCos') is not None]
    if nc:
        res['nearestNonContactCos'] = max(nc)
    if spot_bad:
        res['verdict'] = 'DISAGREEMENT'
    return res
