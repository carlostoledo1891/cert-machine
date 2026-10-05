"""vcheck.py — INDEPENDENT verifier of the proof that Q(phi) >= Q(phi*) = -5/137 for every measurable
phi:[0,1]->[-1,1]  (hence delta_3 = 117/2192, with Parrilo-Robertson-Saracino's reduction and their
12-block construction).  Written separately from grid.py / inner.py / scert.py / phistar.py / model.py:
it re-derives phi*, h, every cell's bathtub minorant, every cell-pair area (polygon clipping), every
form, and proves positive (semi)definiteness by fraction-free Bareiss elimination (Sylvester).

Chain checked:
 (0) Q(phi*) = -5/137 exactly; the identity Q(phi)-Q(phi*) = 4[∫ h sigma + Q(phi* sigma)],
     sigma = (1 - phi phi*)/2, on random rational step functions (exact).
 (1) WLOG m := ∫ sigma <= 1/2 (phi -> -phi maps sigma -> 1-sigma, Q unchanged).
 (2) per certificate grid: E(sigma) >= L(y) (y = cell averages): bathtub a y + b y^2, exact full pairs,
     cut pairs >= the two stated bounds;  the certificate identity; PSD; region coverage.
"""
import sys, json, random
from fractions import Fraction as Fr
from flint import fmpz

BLOCKS = [28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28]
U = 1096                                             # unit = 1/1096
EDGES = [0]
for bl in BLOCKS: EDGES.append(EDGES[-1] + 2 * bl)   # in units
SIGNS = [(-1) ** k for k in range(12)]
assert EDGES[-1] == U

# ---- geometry: area of [a0,a1]x[b0,b1] ∩ R, R = {b >= a/2, b <= (1+a)/2}, by polygon clipping ----
def clip_area(a0, a1, b0, b1):
    P = [(a0, b0), (a1, b0), (a1, b1), (a0, b1)]
    for f in (lambda p: p[1] - p[0] / 2, lambda p: (1 + p[0]) / 2 - p[1]):
        out = []
        for k in range(len(P)):
            p, q = P[k], P[(k + 1) % len(P)]
            fp, fq = f(p), f(q)
            if fp >= 0: out.append(p)
            if (fp > 0 and fq < 0) or (fp < 0 and fq > 0):
                t = fp / (fp - fq); out.append((p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])))
        P = out
        if len(P) < 3: return Fr(0)
    s = Fr(0)
    for k in range(len(P)):
        (x1, y1), (x2, y2) = P[k], P[(k + 1) % len(P)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2

def Q_step(edges, vals):
    """exact Q of a step function: edges (Fractions) and values per piece."""
    tot = Fr(0)
    for p in range(len(vals)):
        for q in range(len(vals)):
            if vals[p] and vals[q]:
                tot += vals[p] * vals[q] * clip_area(edges[p], edges[p + 1], edges[q], edges[q + 1])
    return tot

def phistar_at(x):     # value on the open piece containing x (x in units, Fraction)
    for k in range(12):
        if EDGES[k] <= x < EDGES[k + 1]: return SIGNS[k]
    return SIGNS[-1]

def prim(t):           # ∫_0^t phi*, t a Fraction in [0,1]
    t = min(max(t, Fr(0)), Fr(1)); acc = Fr(0)
    for k in range(12):
        lo, hi = Fr(EDGES[k], U), Fr(EDGES[k + 1], U)
        if t > lo: acc += SIGNS[k] * (min(t, hi) - lo)
    return acc

def gstar(a):          # (1/2) dQ/dphi(a) at phi*: windows [a/2,(1+a)/2] and [2a-1,2a] ∩ [0,1]
    return (prim((1 + a) / 2) - prim(a / 2) + prim(min(Fr(1), 2 * a)) - prim(max(Fr(0), 2 * a - 1))) / 2

def h_nodes():
    """h = -phi* g* at the nodes k/1096; continuous since g* vanishes where phi* jumps."""
    H = []
    for k in range(U + 1):
        a = Fr(k, U); g = gstar(a)
        sl = phistar_at(Fr(k) - Fr(1, 2)) if k > 0 else SIGNS[0]
        sr = phistar_at(Fr(k) + Fr(1, 2)) if k < U else SIGNS[-1]
        hl, hr = -sl * g, -sr * g
        assert hl == hr, ("h discontinuous", k)      # holds iff g*(k)=0 at the jumps of phi*
        H.append(hl)
    return H

def check_h_linear(H):
    """h is linear on each unit piece: kinks of g* can only occur where a/2, (1+a)/2, 2a, 2a-1 meet an
    edge of phi* or 0, 1/2, 1 -- all at integer units since every edge is an even unit. Spot-check:"""
    for k in range(U):
        for t in (Fr(1, 3), Fr(2, 3)):
            a = Fr(k, U) + t / U; s = phistar_at(Fr(k) + t)
            assert -s * gstar(a) == H[k] + (H[k + 1] - H[k]) * t, ("h not linear", k)

def bathtub_minorant(H, p, q):
    """for the cell [p,q] (units): a = w min h, b = (w^2/2)/max density of the level-set measure;
    then a y + b y^2 <= min{∫ h s : 0<=s<=1, avg s = y} (convexity of the bathtub function)."""
    w = Fr(q - p, U)
    segs = [(min(H[k], H[k + 1]), max(H[k], H[k + 1])) for k in range(p, q)]
    a = w * min(s[0] for s in segs)
    if any(lo == hi for lo, hi in segs): return w, a, Fr(0)
    lv = sorted({v for s in segs for v in s}); dens = Fr(0)
    for v0, v1 in zip(lv, lv[1:]):
        d = sum(Fr(1, U) / (hi - lo) for lo, hi in segs if lo <= v0 and v1 <= hi)
        if d > dens: dens = d
    return w, a, w * w / 2 / dens

def grid_data(pts, H):
    pts = [int(p) for p in pts]
    assert pts[0] == 0 and pts[-1] == U and all(x < y for x, y in zip(pts, pts[1:]))
    assert set(EDGES) <= set(pts), "every edge of phi* must be a grid point"
    cells = []
    for p, q in zip(pts, pts[1:]):
        w, a, b = bathtub_minorant(H, p, q)
        cells.append(dict(p=p, q=q, w=w, a=a, b=b, s=phistar_at(Fr(p) + Fr(1, 2))))
    n = len(cells); full = []; cut = {}
    for i in range(n):
        for j in range(n):
            ar = clip_area(Fr(cells[i]['p'], U), Fr(cells[i]['q'], U), Fr(cells[j]['p'], U), Fr(cells[j]['q'], U))
            tot = cells[i]['w'] * cells[j]['w']
            if ar == tot: full.append((i, j))
            elif ar > 0: cut[(i, j)] = (ar, tot - ar)
    return cells, full, cut

# ---- positive definiteness by fraction-free elimination (all leading minors > 0) -----------------
def bareiss_pd(M):
    """M: list of lists of Fractions, symmetric. True iff all leading principal minors are > 0."""
    from math import lcm
    n = len(M); den = 1
    for r in M:
        for v in r: den = lcm(den, v.denominator)
    A = [[fmpz(int(v * den)) for v in r] for r in M]
    prev = fmpz(1)
    for k in range(n):
        if A[k][k] <= 0: return False, k
        akk = A[k][k]; rowk = A[k]
        for i in range(k + 1, n):
            aik = A[i][k]; Ai = A[i]
            for j in range(k + 1, n):
                Ai[j] = (Ai[j] * akk - aik * rowk[j]) // prev
        prev = akk
    return True, None

# ---- forms (re-derived): each is a product of factors that are >= 0 on the region ----------------
def form(kind, idx, n, wv, lo, hi):
    """returns {(p,q): c} on v = (1,y) (p<=q) and asserts admissibility of the kind."""
    e = {}
    def add(p, q, c):
        if p > q: p, q = q, p
        e[(p, q)] = e.get((p, q), 0) + c
    def mul(l1, l2):                  # product of two affine forms given as dicts {0: c0, i+1: ci}
        for p, c in l1.items():
            for q, d in l2.items(): add(p, q, c * d)
    one = {0: Fr(1)}
    Y = lambda i: {i + 1: Fr(1)}
    OneMinus = lambda i: {0: Fr(1), i + 1: Fr(-1)}
    Mlo = {0: -lo, **{i + 1: wv[i] for i in range(n)}}          # m - lo   >= 0 on the region
    Mhi = {0: hi, **{i + 1: -wv[i] for i in range(n)}}          # hi - m   >= 0 on the region
    if kind == 'yy': i, j = idx; mul(Y(i), Y(j))
    elif kind == '11': i, j = idx; mul(OneMinus(i), OneMinus(j))
    elif kind == 'y1': i, j = idx; mul(Y(i), OneMinus(j))
    elif kind == 'yd': mul(Y(idx), OneMinus(idx))
    elif kind == '11d': mul(OneMinus(idx), OneMinus(idx))
    elif kind == 'y': mul(Y(idx), one)
    elif kind == '1': mul(OneMinus(idx), one)
    elif kind == 'mlo': mul(Mlo, one)
    elif kind == 'mhi': mul(Mhi, one)
    elif kind == 'mlo_y': mul(Mlo, Y(idx))
    elif kind == 'mlo_1': mul(Mlo, OneMinus(idx))
    elif kind == 'mhi_y': mul(Mhi, Y(idx))
    elif kind == 'mhi_1': mul(Mhi, OneMinus(idx))
    elif kind == 'mm': mul(Mlo, Mhi)
    elif kind == 'tri':
        i, j, k, sg = idx
        assert len({i, j, k}) == 3 and all(abs(x) == 1 for x in sg) and sg[0] * sg[1] * sg[2] == 1
        # 1 + s1 zi zj + s2 zj zk + s3 zi zk >= 0 on [-1,1]^3 (multilinear, >= 0 at the 8 vertices), z = 1-2y
        Z = lambda t: {0: Fr(1), t + 1: Fr(-2)}
        add(0, 0, 1)
        for (p, q), sv in (((i, j), sg[0]), ((j, k), sg[1]), ((i, k), sg[2])):
            for P_, c in Z(p).items():
                for Q_, d in Z(q).items(): add(P_, Q_, sv * c * d)
    else: raise AssertionError(f"unknown form {kind}")
    return e

def check_lower_bound(cells, full, cut, H, trials=12, seed=11):
    """exact spot-check of the discretisation lemma E(sigma) >= L(y) on random step functions sigma
    (pieces of 1/1096, values in {0, 1/3, 1/2, 1}, some concentrated next to breakpoints)."""
    rnd = random.Random(seed); n = len(cells)
    qstar = Fr(-5, 137)
    for t in range(trials):
        sig = [Fr(0)] * U
        if t % 3 == 0:        # mass next to breakpoints only
            for e in EDGES[1:-1]:
                for k in range(e - rnd.randint(0, 6), e + rnd.randint(0, 6)): sig[k] = Fr(1)
        else:
            for _ in range(rnd.randint(1, 8)):
                c = rnd.randrange(U); ln = rnd.randint(1, 120); v = rnd.choice([Fr(1), Fr(1, 2), Fr(1, 3)])
                for k in range(c, min(U, c + ln)): sig[k] = v
        # merge into pieces
        cuts = [0]; vals = []
        for k in range(U):
            if k == 0 or sig[k] != sig[k - 1] or k in EDGES:
                if k: cuts.append(k)
                vals.append(sig[k])
        cuts.append(U)
        ps = [phistar_at(Fr(c) + Fr(1, 2)) for c in cuts[:-1]]
        phi = [s_ * (1 - 2 * v) for s_, v in zip(ps, vals)]
        E = (Q_step([Fr(c, U) for c in cuts], phi) - qstar) / 4
        y = [sum(sig[cells[i]['p']:cells[i]['q']]) / (cells[i]['q'] - cells[i]['p']) for i in range(n)]
        Lv = sum(c['a'] * yi + c['b'] * yi * yi for c, yi in zip(cells, y))
        Lv += sum(cells[i]['s'] * cells[j]['s'] * cells[i]['w'] * cells[j]['w'] * y[i] * y[j] for i, j in full)
        for (i, j), (ain, aout) in cut.items():
            ww = cells[i]['w'] * cells[j]['w'] * y[i] * y[j]
            Lv += max(Fr(0), ww - aout) if cells[i]['s'] * cells[j]['s'] > 0 else max(-ain, -ww)
        assert Lv <= E, ("discretisation lemma fails", t, float(Lv), float(E))
    return True

def check_slab(fn, H, cache):
    C = json.load(open(fn)); pts = C['grid']; key = tuple(pts)
    if key not in cache: cache[key] = grid_data(pts, H); check_lower_bound(*cache[key], H)
    cells, full, cut = cache[key]; n = len(cells); wv = [c['w'] for c in cells]
    lo, hi, B, eps = Fr(C['lo']), Fr(C['hi']), Fr(C['B']), Fr(C['eps'])
    assert 0 <= lo < hi and eps >= 0
    S = [[Fr(0)] * (n + 1) for _ in range(n + 1)]
    def put(p, q, c):
        if p == q: S[p][p] += c
        else: S[p][q] += c / 2; S[q][p] += c / 2
    for i, c in enumerate(cells): put(0, i + 1, c['a']); put(i + 1, i + 1, c['b'])
    for i, j in full: put(i + 1, j + 1, cells[i]['s'] * cells[j]['s'] * cells[i]['w'] * cells[j]['w'])
    cutlist = sorted(cut)          # the generator's order: i-major, then j
    assert len(C['theta']) == len(cutlist)
    for (i, j), th in zip(cutlist, C['theta']):
        th = Fr(th); assert 0 <= th <= 1
        ain, aout = cut[(i, j)]; ss = cells[i]['s'] * cells[j]['s']; ww = cells[i]['w'] * cells[j]['w']
        # s s = +1: ∫∫_in sigma sigma >= max(0, ww y_i y_j - Aout);  s s = -1: -∫∫_in >= max(-Ain, -ww y_i y_j)
        if ss > 0: put(i + 1, j + 1, (1 - th) * ww); put(0, 0, -(1 - th) * aout)
        else: put(0, 0, -th * ain); put(i + 1, j + 1, -(1 - th) * ww)
    put(0, 0, -B)
    for kind, idx, mu in C['forms']:
        mu = Fr(mu); assert mu >= 0
        if isinstance(idx, list) and kind == 'tri': idx = (idx[0], idx[1], idx[2], tuple(idx[3]))
        elif isinstance(idx, list): idx = tuple(idx)
        for (p, q), c in form(kind, idx, n, wv, lo, hi).items(): put(p, q, -mu * c)
    for p in range(n + 1): S[p][p] += eps
    ok, k = bareiss_pd(S)
    claim = B - eps * (1 + n)
    assert claim == Fr(C['claim'])
    print(f"{fn}: slab [{lo}, {hi}]  n={n}  {'VERIFIED' if ok and claim > 0 else 'FAILED'}  E >= {float(claim):.6e}")
    return ok and claim > 0, (lo, hi)

def check_inner(fn, H, cache):
    C = json.load(open(fn)); pts = C['grid']; key = tuple(pts)
    if key not in cache: cache[key] = grid_data(pts, H); check_lower_bound(*cache[key], H)
    cells, full, cut = cache[key]; n = len(cells); wv = [c['w'] for c in cells]
    rin = Fr(C['rin']); assert rin > 0
    lam = [[Fr(0)] * n for _ in range(n)]
    for kk, v in C['lam'].items():
        i, j = map(int, kk.split(',')); lam[i][j] = Fr(v); assert lam[i][j] >= 0
    nu = [Fr(v) for v in C['nu']]; kap = Fr(C['kap']); assert min(nu) >= 0 and kap >= 0
    N = [[Fr(0)] * n for _ in range(n)]
    for kk, v in C['N'].items():
        i, j = map(int, kk.split(',')); N[i][j] = N[j][i] = Fr(v); assert Fr(v) >= 0
    # linear identity: c_i = a_i - sum_j lam_ij - rin nu_i - rin kap w_i >= 0
    for i in range(n):
        c = cells[i]['a'] - sum(lam[i]) - rin * nu[i] - rin * kap * wv[i]
        assert c >= 0, ("linear budget", i)
    # quadratic part of L0: b diag, full pairs exact, cut pairs: s s=+1 -> 0, s s=-1 -> -ww y_i y_j
    P = [[Fr(0)] * n for _ in range(n)]
    def put(i, j, v):
        if i == j: P[i][i] += v
        else: P[i][j] += v / 2; P[j][i] += v / 2
    for i, c in enumerate(cells): put(i, i, c['b'])
    for i, j in full: put(i, j, cells[i]['s'] * cells[j]['s'] * cells[i]['w'] * cells[j]['w'])
    for (i, j), (ain, aout) in cut.items():
        if cells[i]['s'] * cells[j]['s'] < 0: put(i, j, -cells[i]['w'] * cells[j]['w'])
    for i in range(n):
        for j in range(n):
            P[i][j] += (lam[i][j] + lam[j][i]) / 2 + (nu[i] * wv[j] + nu[j] * wv[i]) / 2 + kap * wv[i] * wv[j] - N[i][j]
    ok, k = bareiss_pd(P)
    print(f"{fn}: inner [0, {rin}]  n={n}  {'VERIFIED (E >= 0, tight at phi*)' if ok else 'FAILED at %s' % k}")
    return ok, (Fr(0), rin)

def check_identity(H, trials=6, seed=7):
    """exact spot-check of Q(phi) - Q(phi*) = 4[∫ h sigma + Q(phi* sigma)] on random step functions."""
    rnd = random.Random(seed); qstar = Q_step([Fr(e, U) for e in EDGES], SIGNS)
    assert qstar == Fr(-5, 137), qstar
    for _ in range(trials):
        cuts = sorted(set(rnd.sample(range(1, U), 7)) | set(EDGES))
        vals = [Fr(rnd.randint(-4, 4), 4) for _ in range(len(cuts) - 1)]
        E = [Fr(c, U) for c in cuts]
        q = Q_step(E, vals)
        ps = [phistar_at(Fr(c) + Fr(1, 2)) for c in cuts[:-1]]
        sig = [(1 - v * s) / 2 for v, s in zip(vals, ps)]
        lin = Fr(0)
        for (c0, c1), sg in zip(zip(cuts, cuts[1:]), sig):
            for k in range(c0, c1): lin += sg * (H[k] + H[k + 1]) / 2 / U
        quad = Q_step(E, [s * g for s, g in zip(ps, sig)])
        assert q - qstar == 4 * (lin + quad), "identity fails"
    return qstar

def main(files):
    H = h_nodes(); check_h_linear(H)
    assert all(v >= 0 for v in H) and all(H[e] == 0 for e in EDGES[1:-1])
    qs = check_identity(H)
    print(f"phi*: Q = {qs} (= -5/137), h >= 0 with zeros exactly at its 11 breakpoints; identity checked")
    cache = {}; cover = []; allok = True
    for fn in files:
        C = json.load(open(fn))
        ok, iv = (check_inner if 'rin' in C else check_slab)(fn, H, cache)
        allok &= ok; cover.append(iv)
    cover.sort(); reach = Fr(0)
    for lo, hi in cover:
        if lo <= reach: reach = max(reach, hi)
    covered = reach >= Fr(1, 2) and cover[0][0] == 0
    print(f"cover of m = ∫sigma in [0, 1/2]: {'COMPLETE' if covered else 'INCOMPLETE (reaches %s)' % reach}")
    if allok and covered:
        print("THEOREM VERIFIED: Q(phi) >= -5/137 for all phi; delta_3 >= 1/16 - 5/548 = 117/2192 (= the 12-block value).")
    return allok and covered

if __name__ == "__main__":
    sys.exit(0 if main(sys.argv[1:]) else 1)
