"""srelax.py — the relaxation in sigma-coordinates (centred at phi*), mirror-reduced.
min  sum a_i y_i + b_i Y_ii + sum_full s_i s_j w_i w_j Y_ij + sum_cut z
s.t. [[1,y'],[y,Y]] PSD, RLT on [0,1]^n, half-space sum w y <= 1/2 (WLOG by phi -> -phi) and its
RLT products, optional annulus sum w y >= r with products, triangle cuts (cutting planes) on z=1-2y.
The minimum is 0 iff the relaxation proves phi* optimal (for this grid)."""
import sys, time, json, itertools, numpy as np, cvxpy as cp
from fractions import Fraction as Fr
from grid import make_grid, cells, pairs
def setup(fine=4, coarse=24, D=8):
    pts = make_grid(fine, coarse, D); C = cells(pts); full, cut = pairs(C)
    return pts, C, full, cut
def bases(n):
    h = n // 2; r = 1 / np.sqrt(2)
    S = np.zeros((n, h)); A = np.zeros((n, h))
    for i in range(h):
        S[i, i] = r; S[n - 1 - i, i] = r; A[i, i] = r; A[n - 1 - i, i] = -r
    return S, A
def separate(Zv, per_round, tol=1e-7):
    n = Zv.shape[0]; cand = []
    pats = ((1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1))
    for i in range(n):
        for j in range(i + 1, n):
            ks = np.arange(j + 1, n)
            if len(ks) == 0: continue
            a = Zv[i, j]; b = Zv[j, ks]; c = Zv[i, ks]
            for s in pats:
                v = s[0] * a + s[1] * b + s[2] * c + 1
                for t in np.nonzero(v < -tol)[0]:
                    cand.append((v[t], (i, j, int(ks[t]), s)))
    cand.sort(key=lambda u: u[0])
    return [t for _, t in cand[:per_round]]
def solve(data, r=None, rounds=8, per_round=None, tri=None, verbose=True, halfspace=True, rin=None, slab=None):
    pts, C, full, cut = data; n = len(C); h = n // 2
    per_round = per_round or 20 * n
    w = np.array([float(c['w']) for c in C]); a = np.array([float(c['a']) for c in C])
    b = np.array([float(c['b']) for c in C]); s = np.array([c['s'] for c in C], float)
    S, A = bases(n)
    u = cp.Variable(h); Ys = cp.Variable((h, h), symmetric=True); Ya = cp.Variable((h, h), symmetric=True)
    y = S @ u; Y = S @ Ys @ S.T + A @ Ya @ A.T
    M1 = cp.bmat([[np.ones((1, 1)), cp.reshape(u, (1, h), order='F')], [cp.reshape(u, (h, 1), order='F'), Ys]])
    cons = [M1 >> 0, Ya >> 0]
    iu = np.triu_indices(n, 1); I, J = iu
    Yu = Y[I, J]
    cons += [Yu >= 0, Yu >= y[I] + y[J] - 1, Yu <= y[I], Yu <= y[J], cp.diag(Y) <= y, cp.diag(Y) >= 2 * y - 1]
    if halfspace:
        cons += [w @ y <= 0.5]
        WY = Y @ w           # (Y w)_j = sum_i w_i Y_ij
        cons += [0.5 * y - WY >= 0, 0.5 * (1 - y) - (w @ y - WY) >= 0]
    if rin is not None:
        WY = Y @ w
        cons += [w @ y <= rin, rin * y - WY >= 0, rin * (1 - y) - (w @ y - WY) >= 0]
    if slab is not None:
        lo, hi = slab; WY = Y @ w; m = w @ y
        cons += [m >= lo, m <= hi, WY - lo * y >= 0, (m - WY) - lo * (1 - y) >= 0,
                 hi * y - WY >= 0, hi * (1 - y) - (m - WY) >= 0,
                 -(w @ WY) + (lo + hi) * m - lo * hi >= 0]
    if r is not None:
        WY = Y @ w
        cons += [w @ y >= r, WY - r * y >= 0, (w @ y - WY) - r * (1 - y) >= 0]
    # objective
    Fi = np.array([p[0] for p in full]); Fj = np.array([p[1] for p in full])
    fco = np.array([s[i] * s[j] * w[i] * w[j] for i, j in full])
    obj = a @ y + b @ cp.diag(Y) + fco @ Y[Fi, Fj]
    z = cp.Variable(len(cut))
    Ci = np.array([c[0] for c in cut]); Cj = np.array([c[1] for c in cut])
    Ain = np.array([float(c[2]) for c in cut]); Aout = np.array([float(c[3]) for c in cut])
    ss = np.array([s[i] * s[j] for i, j, _, _ in cut]); ww = np.array([w[i] * w[j] for i, j, _, _ in cut])
    pos = ss > 0; neg = ~pos
    Ycut = Y[Ci, Cj]
    cons += [z[pos] >= 0, z[pos] >= cp.multiply(ww[pos], Ycut[pos]) - Aout[pos],
             z[neg] >= -Ain[neg], z[neg] >= -cp.multiply(ww[neg], Ycut[neg])]
    obj = obj + cp.sum(z)
    Z = 1 - 2 * y[:, None] @ np.ones((1, n)) if False else None
    tri = list(tri or []); hist = []
    for rnd in range(rounds):
        cc = list(cons)
        if tri:
            T = np.array([(i, j, k) for (i, j, k, sg) in tri]); Sg = np.array([sg for (i, j, k, sg) in tri], float)
            def Zx(p, q): return 1 - 2 * y[p] - 2 * y[q] + 4 * Y[p, q]
            cc.append(cp.multiply(Sg[:, 0], Zx(T[:, 0], T[:, 1])) + cp.multiply(Sg[:, 1], Zx(T[:, 1], T[:, 2]))
                      + cp.multiply(Sg[:, 2], Zx(T[:, 0], T[:, 2])) >= -1)
        prob = cp.Problem(cp.Minimize(obj), cc)
        t0 = time.time(); prob.solve(solver=cp.CLARABEL)
        val = prob.value; hist.append(val)
        yv = y.value; Yv = Y.value
        if verbose:
            print(f"  n={n} r={r} round {rnd}: min {val:.3e}  mass {w @ yv:.4f}  #tri {len(tri)}  ({time.time()-t0:.1f}s)", flush=True)
        Zv = 1 - 2 * yv[:, None] - 2 * yv[None, :] + 4 * Yv
        np.fill_diagonal(Zv, 1)
        new = separate(Zv, per_round)
        if not new or (len(hist) > 1 and abs(hist[-1] - hist[-2]) < 1e-9): break
        have = set(tri)
        for (i, j, k, sg) in new:
            m = (n - 1 - k, n - 1 - j, n - 1 - i, (sg[1], sg[0], sg[2]))
            for t in ((i, j, k, sg), m):
                if t not in have: have.add(t); tri.append(t)
    return val, yv, Yv, tri
if __name__ == "__main__":
    args = dict(a.split('=') for a in sys.argv[1:])
    fine = int(args.get('fine', 4)); coarse = int(args.get('coarse', 24)); D = int(args.get('D', 8))
    r = float(args['r']) if 'r' in args else None
    rin = float(args['rin']) if 'rin' in args else None
    slab = tuple(map(float, args['slab'].split(','))) if 'slab' in args else None
    data = setup(fine, coarse, D)
    print(f"grid fine={fine} coarse={coarse} D={D}: {len(data[1])} cells, {len(data[2])} full, {len(data[3])} cut")
    val, yv, Yv, tri = solve(data, r=r, rin=rin, slab=slab, rounds=int(args.get('rounds', 8)))
    C = data[1]
    top = np.argsort(-yv)[:20]
    print("largest y:", [(C[i]['p'], C[i]['q'], round(float(yv[i]), 3)) for i in sorted(top)])
