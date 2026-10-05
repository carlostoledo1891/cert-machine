"""inner.py — the INNER certificate: E(sigma) >= L(y) >= 0 for every sigma with  ∫ sigma <= rin.
Identity (exact, rational):  L0(y) = y' P y + sum_ij lam_ij y_i(1-y_j) + sum_j nu_j y_j (rin - m)
                                    + kap m (rin - m) + sum_{i<=j} N_ij y_i y_j + sum_i c_i y_i,
m = sum w_i y_i, P PSD, all multipliers >= 0; L0 uses the cut bounds that vanish at 0
(s_i s_j=+1: 0;  s_i s_j=-1: -w_i w_j y_i y_j).  Every form vanishes at y = 0, so the bound is
exactly 0 there: phi* is a local minimiser with an explicit radius, fractional perturbations included.
Float SDP maximises the margin tau (P >= tau diag(w^2)); then rationals + exact LDL^T."""
import sys, json, time, numpy as np, cvxpy as cp
from fractions import Fraction as Fr
from grid import make_grid, cells, pairs
def qdata(C, full, cut):
    """exact quadratic part Q_L (symmetric, Fractions) and linear part a of L0."""
    n = len(C); Qm = [[Fr(0)] * n for _ in range(n)]
    def add(i, j, v):
        if i == j: Qm[i][i] += v
        else: Qm[i][j] += v / 2; Qm[j][i] += v / 2
    for i, c in enumerate(C): add(i, i, c['b'])
    for i, j in full: add(i, j, C[i]['s'] * C[j]['s'] * C[i]['w'] * C[j]['w'])
    for i, j, ain, aout in cut:
        if C[i]['s'] * C[j]['s'] < 0: add(i, j, -C[i]['w'] * C[j]['w'])
    return Qm, [c['a'] for c in C]
def solve(C, full, cut, rin):
    n = len(C); Qm, a = qdata(C, full, cut)
    Qf = np.array([[float(v) for v in r] for r in Qm]); af = np.array([float(v) for v in a])
    w = np.array([float(c['w']) for c in C])
    lam = cp.Variable((n, n), nonneg=True); nu = cp.Variable(n, nonneg=True); kap = cp.Variable(nonneg=True)
    Nm = cp.Variable((n, n), symmetric=True); tau = cp.Variable()
    P = Qf + (lam + lam.T) / 2 + (cp.reshape(nu, (n, 1), order='F') @ w.reshape(1, n) + w.reshape(n, 1) @ cp.reshape(nu, (1, n), order='F')) / 2 \
        + kap * np.outer(w, w) - Nm
    D = np.diag(w * w) * n
    cons = [P - tau * D >> 0, Nm >= 0, cp.sum(lam, axis=1) + rin * nu + rin * kap * w <= af, tau <= 1]
    prob = cp.Problem(cp.Maximize(tau), cons)
    t0 = time.time(); prob.solve(solver=cp.CLARABEL)
    print(f"inner rin={rin}: margin tau = {tau.value:.4e}  ({time.time()-t0:.0f}s)", flush=True)
    return dict(lam=lam.value, nu=nu.value, kap=kap.value, N=Nm.value, tau=tau.value, Qm=Qm, a=a)
def rat(x, den):
    return Fr(int(round(x * den)), den)
def ldl_psd(M):
    """exact PSD test of a symmetric Fraction matrix by LDL^T with pivoting on zero rows."""
    n = len(M); A = [row[:] for row in M]
    for k in range(n):
        p = A[k][k]
        if p < 0: return False, k
        if p == 0:
            if any(A[k][j] != 0 for j in range(k + 1, n)): return False, k
            continue
        rowk = A[k]
        for i in range(k + 1, n):
            f = A[i][k] / p
            if f == 0: continue
            Ai = A[i]
            for j in range(k + 1, n):
                if rowk[j] != 0: Ai[j] -= f * rowk[j]
    return True, None
def psd_exact(P, tau, w):
    """P = R'R + E with R dyadic (float Cholesky of P - (tau/2) D, D = n diag(w^2)) and E diagonally
    dominant with nonnegative diagonal  =>  P PSD (exact, FLINT)."""
    import numpy as np
    from flint import fmpq_mat, fmpq
    n = len(P)
    Pf = np.array([[float(v) for v in r] for r in P])
    Dg = np.diag([float(x) ** 2 for x in w]) * n
    try: Rf = np.linalg.cholesky(Pf - float(tau) / 2 * Dg).T
    except np.linalg.LinAlgError: return False
    sc = 2.0 ** 60
    R = fmpq_mat(n, n, [fmpq(int(round(v * sc)), int(sc)) for v in Rf.ravel()])
    M = fmpq_mat(n, n, [fmpq(v.numerator, v.denominator) for r in P for v in r])
    E = M - R.transpose() * R
    for i in range(n):
        off = sum(abs(E[i, j]) for j in range(n) if j != i)
        if E[i, i] < off: return False
    return True
def certify(C, full, cut, rin, sol, den=2**40):
    n = len(C); w = [c['w'] for c in C]; Qm, a = sol['Qm'], sol['a']; rin = Fr(rin)
    lam = [[rat(max(v, 0), den) for v in row] for row in sol['lam']]
    nu = [rat(max(v, 0), den) for v in sol['nu']]; kap = rat(max(sol['kap'], 0), den)
    N = [[rat(max(sol['N'][i][j] + sol['N'][j][i], 0) / 2, den) for j in range(n)] for i in range(n)]
    # linear budget: c_i = a_i - sum_j lam_ij - rin nu_i - rin kap w_i must be >= 0; scale row i down if not
    for i in range(n):
        spent = sum(lam[i]) + rin * nu[i] + rin * kap * w[i]
        if spent > a[i]:
            if spent == 0: continue
            f = a[i] / spent if a[i] > 0 else Fr(0)
            lam[i] = [v * f for v in lam[i]]; nu[i] *= f
            assert rin * kap * w[i] * f <= a[i]
            # kap is shared; keep it only if every row affords it
    c = [a[i] - sum(lam[i]) - rin * nu[i] - rin * kap * w[i] for i in range(n)]
    if min(c) < 0:
        kap = Fr(0); c = [a[i] - sum(lam[i]) - rin * nu[i] for i in range(n)]
    assert min(c) >= 0
    P = [[Qm[i][j] + (lam[i][j] + lam[j][i]) / 2 + (nu[i] * w[j] + nu[j] * w[i]) / 2 + kap * w[i] * w[j] - N[i][j]
          for j in range(n)] for i in range(n)]
    t0 = time.time(); ok = psd_exact(P, Fr(float(sol['tau'])).limit_denominator(10**12) * Fr(1, 4) if sol['tau'] > 0 else Fr(0), w)
    print(f"exact PSD proof of P ({n}x{n}): {'PSD' if ok else 'FAILED'}  ({time.time()-t0:.0f}s)")
    return ok, dict(rin=str(rin), lam=lam, nu=nu, kap=kap, N=N, c=c)
if __name__ == "__main__":
    args = dict(a.split('=') for a in sys.argv[1:])
    fine = int(args.get('fine', 4)); coarse = int(args.get('coarse', 24)); D = int(args.get('D', 8))
    rin = Fr(args.get('rin', '1/10'))
    pts = make_grid(fine, coarse, D); C = cells(pts); full, cut = pairs(C)
    import os, pickle
    pk = f"inner-sol-{args.get('tag','x')}.pkl"
    if os.path.exists(pk): sol = pickle.load(open(pk, 'rb'))
    else:
        sol = solve(C, full, cut, float(rin))
        pickle.dump(sol, open(pk, 'wb'))
    if sol['tau'] > 0:
        ok, cert = certify(C, full, cut, rin, sol)
        if ok:
            json.dump(dict(grid=pts, rin=str(rin),
                           lam={f"{i},{j}": str(v) for i, r in enumerate(cert['lam']) for j, v in enumerate(r) if v},
                           nu=[str(v) for v in cert['nu']], kap=str(cert['kap']),
                           N={f"{i},{j}": str(cert['N'][i][j]) for i in range(len(C)) for j in range(i, len(C)) if cert['N'][i][j]},
                           c=[str(v) for v in cert['c']]), open(f"inner-{args.get('tag','x')}.json", 'w'))
