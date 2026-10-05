"""scert.py — exact certificate for one REGION of the sigma-model:
      L(y) >= B   for all y in [0,1]^n with  lo <= m := sum_i w_i y_i <= hi,
via the identity (all forms quadratic in v = (1, y), compared coefficient by coefficient)
      L_theta(y) - B = v' S v + sum_f mu_f f(y),     mu >= 0, theta in [0,1], S + eps I PSD,
where L_theta <= L picks, per cut pair, theta*(bound 1) + (1-theta)*(bound 2), and each form f is
one of: yy, y1, yd, 11, y, 1 (box), mlo/mhi and their products with y_j, 1-y_j, mm (slab), tri.
Then L >= B - eps (1 + n) on the region.  Multipliers come from a float primal solve (duals);
nothing from it is trusted: S is recomputed exactly and PSD is proved exactly (psd_fast)."""
import sys, json, time, numpy as np, cvxpy as cp
from fractions import Fraction as Fr
from grid import make_grid, cells, pairs
from srelax import bases, separate
from flint import fmpq_mat, fmpq

def primal(C, full, cut, lo, hi, tri):
    n = len(C); h = n // 2
    w = np.array([float(c['w']) for c in C]); a = np.array([float(c['a']) for c in C])
    b = np.array([float(c['b']) for c in C]); s = np.array([c['s'] for c in C], float)
    S_, A_ = bases(n)
    u = cp.Variable(h); Ys = cp.Variable((h, h), symmetric=True); Ya = cp.Variable((h, h), symmetric=True)
    y = S_ @ u; Y = S_ @ Ys @ S_.T + A_ @ Ya @ A_.T
    M1 = cp.bmat([[np.ones((1, 1)), cp.reshape(u, (1, h), order='F')], [cp.reshape(u, (h, 1), order='F'), Ys]])
    I, J = np.triu_indices(n, 1); Yu = Y[I, J]; dY = cp.diag(Y); m = w @ y; WY = Y @ w
    H = {}
    H['yy'] = Yu >= 0
    H['11'] = Yu - y[I] - y[J] + 1 >= 0
    H['y1_ij'] = y[I] - Yu >= 0          # y_i (1 - y_j)
    H['y1_ji'] = y[J] - Yu >= 0          # y_j (1 - y_i)
    H['yd'] = y - dY >= 0                # y_i - y_i^2
    H['11d'] = dY - 2 * y + 1 >= 0       # (1 - y_i)^2
    H['y'] = y >= 0
    H['1'] = 1 - y >= 0
    H['mlo'] = m - lo >= 0
    H['mhi'] = hi - m >= 0
    H['mlo_y'] = WY - lo * y >= 0                    # (m - lo) y_j
    H['mlo_1'] = (m - WY) - lo * (1 - y) >= 0        # (m - lo)(1 - y_j)
    H['mhi_y'] = hi * y - WY >= 0                    # (hi - m) y_j
    H['mhi_1'] = hi * (1 - y) - (m - WY) >= 0        # (hi - m)(1 - y_j)
    H['mm'] = -(w @ WY) + (lo + hi) * m - lo * hi >= 0
    Fi = np.array([p[0] for p in full]); Fj = np.array([p[1] for p in full])
    fco = np.array([s[i] * s[j] * w[i] * w[j] for i, j in full])
    z = cp.Variable(len(cut))
    Ci = np.array([c[0] for c in cut]); Cj = np.array([c[1] for c in cut])
    Ain = np.array([float(c[2]) for c in cut]); Aout = np.array([float(c[3]) for c in cut])
    ss = np.array([s[i] * s[j] for i, j, _, _ in cut]); ww = np.array([w[i] * w[j] for i, j, _, _ in cut])
    Ycut = Y[Ci, Cj]
    b1 = np.where(ss > 0, 0.0, -Ain)                      # bound 1 (constant)
    # bound 2: ss>0: ww Y - Aout ; ss<0: -ww Y
    H['cut1'] = z - b1 >= 0
    H['cut2'] = z - (cp.multiply(np.where(ss > 0, ww, -ww), Ycut) - np.where(ss > 0, Aout, 0.0)) >= 0
    cons = [M1 >> 0, Ya >> 0] + list(H.values())
    if tri:
        T = np.array([(i, j, k) for (i, j, k, sg) in tri]); Sg = np.array([sg for (i, j, k, sg) in tri], float)
        def Zx(p, q): return 1 - 2 * y[p] - 2 * y[q] + 4 * Y[p, q]
        H['tri'] = cp.multiply(Sg[:, 0], Zx(T[:, 0], T[:, 1])) + cp.multiply(Sg[:, 1], Zx(T[:, 1], T[:, 2])) \
                   + cp.multiply(Sg[:, 2], Zx(T[:, 0], T[:, 2])) + 1 >= 0
        cons.append(H['tri'])
    obj = a @ y + b @ dY + fco @ Y[Fi, Fj] + cp.sum(z)
    prob = cp.Problem(cp.Minimize(obj), cons)
    return prob, H, y, Y

def run_rounds(C, full, cut, lo, hi, rounds, per_round=None, tri=None, tol=1e-7, target=None):
    n = len(C); per_round = per_round or 10 * n; tri = list(tri or []); hist = []
    for rnd in range(rounds):
        prob, H, y, Y = primal(C, full, cut, lo, hi, tri)
        t0 = time.time(); prob.solve(solver=cp.CLARABEL); hist.append(prob.value)
        print(f"  [{lo},{hi}] round {rnd}: {prob.value:.4e}  #tri {len(tri)}  ({time.time()-t0:.0f}s)", flush=True)
        if rnd == rounds - 1 or (len(hist) > 1 and hist[-1] - hist[-2] < tol): break
        if target is not None and prob.value >= target: break
        yv, Yv = y.value, Y.value
        Zv = 1 - 2 * yv[:, None] - 2 * yv[None, :] + 4 * Yv; np.fill_diagonal(Zv, 1)
        new = separate(Zv, per_round)
        if not new: break
        if tri:   # drop slack triangles
            dv = np.array(H['tri'].dual_value).ravel(); tri = [t for t, d in zip(tri, dv) if d > 1e-9]
        have = set(tri)
        for (i, j, k, sg) in new:
            mt = (n - 1 - k, n - 1 - j, n - 1 - i, (sg[1], sg[0], sg[2]))
            for t in ((i, j, k, sg), mt):
                if t not in have: have.add(t); tri.append(t)
    return prob, H, tri

# ---- exact side -------------------------------------------------------------------------------
def form_coeffs(kind, idx, C, lo, hi):
    """coefficients of a form as {(p,q): c} on v=(1,y) with p<=q (value = sum c v_p v_q)."""
    n = len(C); w = [c['w'] for c in C]
    e = {}
    def add(p, q, c):
        if p > q: p, q = q, p
        e[(p, q)] = e.get((p, q), 0) + c
    if kind == 'yy': i, j = idx; add(i + 1, j + 1, 1)
    elif kind == '11': i, j = idx; add(0, 0, 1); add(0, i + 1, -1); add(0, j + 1, -1); add(i + 1, j + 1, 1)
    elif kind == 'y1': i, j = idx; add(0, i + 1, 1); add(i + 1, j + 1, -1)          # y_i (1 - y_j)
    elif kind == 'yd': i = idx; add(0, i + 1, 1); add(i + 1, i + 1, -1)
    elif kind == '11d': i = idx; add(0, 0, 1); add(0, i + 1, -2); add(i + 1, i + 1, 1)
    elif kind == 'y': add(0, idx + 1, 1)
    elif kind == '1': add(0, 0, 1); add(0, idx + 1, -1)
    elif kind in ('mlo', 'mhi', 'mlo_y', 'mlo_1', 'mhi_y', 'mhi_1', 'mm'):
        # linear l(y) = c0 + sum c_i y_i
        mlo = (-lo, {i: w[i] for i in range(n)}); mhi = (hi, {i: -w[i] for i in range(n)})
        def lin(l):
            add(0, 0, l[0])
            for i, c in l[1].items(): add(0, i + 1, c)
        def prod(l1, l2):
            c0, d1 = l1; e0, d2 = l2
            add(0, 0, c0 * e0)
            for i, c in d1.items(): add(0, i + 1, c * e0)
            for i, c in d2.items(): add(0, i + 1, c * c0)
            for i, c in d1.items():
                for j, d in d2.items(): add(i + 1, j + 1, c * d)
        yj = lambda j: (0, {j: 1}); oj = lambda j: (1, {j: -1})
        if kind == 'mlo': lin(mlo)
        elif kind == 'mhi': lin(mhi)
        elif kind == 'mlo_y': prod(mlo, yj(idx))
        elif kind == 'mlo_1': prod(mlo, oj(idx))
        elif kind == 'mhi_y': prod(mhi, yj(idx))
        elif kind == 'mhi_1': prod(mhi, oj(idx))
        elif kind == 'mm': prod(mlo, mhi)
    elif kind == 'tri':
        i, j, k, sg = idx
        # 1 + s1 z_i z_j + s2 z_j z_k + s3 z_i z_k, z = 1 - 2y : z_p z_q = 1 - 2y_p - 2y_q + 4 y_p y_q
        add(0, 0, 1)
        for (p, q), sv in (((i, j), sg[0]), ((j, k), sg[1]), ((i, k), sg[2])):
            add(0, 0, sv); add(0, p + 1, -2 * sv); add(0, q + 1, -2 * sv); add(p + 1, q + 1, 4 * sv)
    else: raise ValueError(kind)
    return e

def collect(H, C, cut, lo, hi, tri, den):
    """rational multipliers (symmetrised under the mirror) from the duals."""
    n = len(C); I, J = np.triu_indices(n, 1)
    q = lambda v: Fr(int(round(max(float(v), 0.0) * den)), den)
    mir = lambda i: n - 1 - i
    F = {}
    def put(key, val):
        if val > 0: F[key] = F.get(key, 0) + val
    dv = lambda k: np.atleast_1d(np.array(H[k].dual_value, dtype=float)).ravel()
    for k in ('yy', '11'):
        for (i, j), v in zip(zip(I, J), dv(k)): put((k, (int(i), int(j))), v)
    for (i, j), v in zip(zip(I, J), dv('y1_ij')): put(('y1', (int(i), int(j))), v)
    for (i, j), v in zip(zip(I, J), dv('y1_ji')): put(('y1', (int(j), int(i))), v)
    for k in ('yd', '11d', 'y', '1', 'mlo_y', 'mlo_1', 'mhi_y', 'mhi_1'):
        for i, v in enumerate(dv(k)): put((k, i), v)
    for k in ('mlo', 'mhi', 'mm'):
        put((k, None), float(dv(k)[0]))
    if 'tri' in H:
        for t, v in zip(tri, dv('tri')): put(('tri', t), v)
    # mirror-symmetrise, then rationalise
    def mkey(key):
        k, idx = key
        if idx is None: return key
        if k in ('yy', '11'): i, j = idx; a, b_ = sorted((mir(i), mir(j))); return (k, (a, b_))
        if k == 'y1': i, j = idx; return (k, (mir(i), mir(j)))
        if k == 'tri':
            i, j, kk, sg = idx; return (k, (mir(kk), mir(j), mir(i), (sg[1], sg[0], sg[2])))
        return (k, mir(idx))
    G = {}
    for key, v in F.items():
        for kk in (key, mkey(key)): G[kk] = G.get(kk, 0) + v / 2
    mult = {key: q(v) for key, v in G.items() if q(v) > 0}
    th = [min(max(Fr(int(round(float(v) * den)), den), Fr(0)), Fr(1)) for v in dv('cut1')]
    # symmetrise theta over mirror cut pairs
    idx = {(i, j): t for t, (i, j, _, _) in enumerate(cut)}
    th2 = []
    for t, (i, j, _, _) in enumerate(cut):
        tm = idx.get((mir(i), mir(j)))
        th2.append((th[t] + th[tm]) / 2 if tm is not None else th[t])
    return mult, th2

def residual(C, full, cut, lo, hi, mult, th, B):
    """exact S with  L_theta - B - sum mu f = v'Sv  (S symmetric (n+1)x(n+1), Fractions)."""
    n = len(C); S = [[Fr(0)] * (n + 1) for _ in range(n + 1)]
    def put(p, q, c):
        if p == q: S[p][p] += c
        else: S[p][q] += c / 2; S[q][p] += c / 2
    for i, c in enumerate(C): put(0, i + 1, c['a']); put(i + 1, i + 1, c['b'])
    for i, j in full: put(i + 1, j + 1, C[i]['s'] * C[j]['s'] * C[i]['w'] * C[j]['w'])
    for t, (i, j, ain, aout) in enumerate(cut):
        ss = C[i]['s'] * C[j]['s']; ww = C[i]['w'] * C[j]['w']; tt = th[t]
        if ss > 0:   # tt*0 + (1-tt)(ww y_i y_j - Aout)
            put(i + 1, j + 1, (1 - tt) * ww); put(0, 0, -(1 - tt) * aout)
        else:        # tt*(-Ain) + (1-tt)(-ww y_i y_j)
            put(0, 0, -tt * ain); put(i + 1, j + 1, -(1 - tt) * ww)
    put(0, 0, -B)
    for (k, idx), mu in mult.items():
        for (p, q), c in form_coeffs(k, idx, C, lo, hi).items(): put(p, q, -mu * c)
    return S

def psd_shift(S, eps):
    """exact proof that S + eps I is PSD: S + eps I = R'R + E, R dyadic from a float Cholesky of
    S + (eps/2) I, E diagonally dominant with nonnegative diagonal."""
    n = len(S)
    Sf = np.array([[float(v) for v in r] for r in S]) + float(eps) / 2 * np.eye(n)
    try: Rf = np.linalg.cholesky(Sf).T
    except np.linalg.LinAlgError: return False
    sc = 2.0 ** 50
    R = fmpq_mat(n, n, [fmpq(int(round(v * sc)), int(sc)) for v in Rf.ravel()])
    M = fmpq_mat(n, n, [fmpq(v.numerator, v.denominator) + (fmpq(eps.numerator, eps.denominator) if i == j else 0)
                        for i, r in enumerate(S) for j, v in enumerate(r)])
    E = M - R.transpose() * R
    for i in range(n):
        off = sum(abs(E[i, j]) for j in range(n) if j != i)
        if E[i, i] < off: return False
    return True

def certify(C, full, cut, lo, hi, H, tri, val, den=2**36, safety=1e-7):
    n = len(C)
    mult, th = collect(H, C, cut, lo, hi, tri, den)
    B = Fr(val - safety).limit_denominator(2**40) if val - safety > 0 else Fr(0)
    S = residual(C, full, cut, lo, hi, mult, th, B)
    lam = np.linalg.eigvalsh(np.array([[float(v) for v in r] for r in S])).min()
    eps = Fr(max(0.0, -lam) * 2 + 1e-14).limit_denominator(10**18)
    ok = psd_shift(S, eps)
    claim = B - eps * (1 + n)
    print(f"  [{lo},{hi}]: B={float(B):.4e}  min eig {lam:.2e}  eps={float(eps):.2e}  PSD {'OK' if ok else 'FAIL'}  "
          f"=> L >= {float(claim):.4e}", flush=True)
    return ok, claim, mult, th, B, eps

def dump(fn, pts, lo, hi, mult, th, B, eps, claim):
    def ser(idx):
        if idx is None: return None
        if isinstance(idx, tuple) and len(idx) == 4: return [idx[0], idx[1], idx[2], list(idx[3])]
        return list(idx) if isinstance(idx, tuple) else idx
    json.dump(dict(grid=pts, lo=str(Fr(lo)), hi=str(Fr(hi)), B=str(B), eps=str(eps), claim=str(claim),
                   theta=[str(t) for t in th],
                   forms=[[k, ser(idx), str(mu)] for (k, idx), mu in mult.items()]), open(fn, 'w'))

if __name__ == "__main__":
    args = dict(a.split('=') for a in sys.argv[1:])
    fine = int(args.get('fine', 4)); coarse = int(args.get('coarse', 24)); D = int(args.get('D', 8))
    lo, hi = Fr(args['lo']), Fr(args['hi'])
    pts = make_grid(fine, coarse, D); C = cells(pts); full, cut = pairs(C)
    prob, H, tri = run_rounds(C, full, cut, float(lo), float(hi), int(args.get('rounds', 3)),
                             target=float(args['target']) if 'target' in args else None)
    ok, claim, mult, th, B, eps = certify(C, full, cut, lo, hi, H, tri, prob.value)
    if ok and claim > 0:
        fn = args.get('out', f"slab-{args['lo'].replace('/','_')}-{args['hi'].replace('/','_')}-g{coarse}_{fine}_{D}.json")
        dump(fn, pts, lo, hi, mult, th, B, eps, claim); print("  wrote", fn)
