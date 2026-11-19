"""Control-room test of CERT211 (c11), written from verify_local.py's docstring and the certificate's format (the
verifier's code is not imported). Floats. It evaluates p = A0 + A1 d^2, q = K0 d, psi = P0 d from the knots of
claude/cert211.json (A, P odd in h, K even; piecewise linear in |h|) and checks
  D1   2p(h - f) + 2qd - l1 f h - l2 (h^2 - d^2) - mu >= 0 at 400,000 random points of the diamond, f = +1 and -1
  LOC  [[8 p_h - x1^2, 4(p_d + q_h) - x1 x2], [., 8 q_d - x2^2]] PSD (x1 = 2q - psi_h, x2 = 2p - psi_d)
       at 400,000 random interior points (away from the knots, where the derivatives jump)
  AFF  sigma/r >= l1 C1 + l2 C2 + mu on 20,000 random networks and under an optimiser over rings and
       telegraph + ring mixtures
and runs the author's own exact verifier once, reporting its last line (a reproduction, not an independent check).
Exits 1 on any violation beyond 1e-9."""
import json, subprocess, sys, numpy as np
from fractions import Fraction as Q
from scipy.optimize import minimize
rng = np.random.default_rng(211)
CERT = sys.argv[1] if len(sys.argv) > 1 else 'claude/cert211.json'
C = json.load(open(CERT))
kn = np.array([float(Q(x)) for x in C['knots']])
F = [np.array([float(Q(x)) for x in fn]) for fn in C['functions']]
na, nk, npsi = C['na'], C['nk'], C['npsi']
assert len(F) == na + nk + npsi
l1, l2, mu = (float(Q(C[k])) for k in ('l1', 'l2', 'mu'))
def pl(vals, h, parity):                        # value and slope of a piecewise-linear function of |h|, extended by parity
    a = np.abs(h); v = np.interp(a, kn, vals)
    idx = np.clip(np.searchsorted(kn, a, side='right') - 1, 0, len(kn) - 2)
    s = (vals[idx + 1] - vals[idx]) / (kn[idx + 1] - kn[idx])
    sg = np.sign(h)
    if parity == 'odd': return sg * v, s            # f(-h) = -f(h): value odd, slope even
    return v, sg * s                                # even: value even, slope odd
def fields(h, d):
    A = [pl(F[k], h, 'odd') for k in range(na)]; K = [pl(F[na + k], h, 'even') for k in range(nk)]; P = [pl(F[na + nk + k], h, 'odd') for k in range(npsi)]
    p = sum(A[k][0] * d ** (2 * k) for k in range(na)); ph = sum(A[k][1] * d ** (2 * k) for k in range(na)); pd = sum(2 * k * A[k][0] * d ** (2 * k - 1) for k in range(1, na))
    q = sum(K[k][0] * d ** (2 * k + 1) for k in range(nk)); qh = sum(K[k][1] * d ** (2 * k + 1) for k in range(nk)); qd = sum((2 * k + 1) * K[k][0] * d ** (2 * k) for k in range(nk))
    ps = sum(P[k][0] * d ** (2 * k + 1) for k in range(npsi)); psh = sum(P[k][1] * d ** (2 * k + 1) for k in range(npsi)); psd = sum((2 * k + 1) * P[k][0] * d ** (2 * k) for k in range(npsi))
    return p, ph, pd, q, qh, qd, ps, psh, psd
n = 400000
h = rng.uniform(-1, 1, n); d = (1 - np.abs(h)) * rng.uniform(-1, 1, n)
p, ph, pd, q, qh, qd, ps, psh, psd = fields(h, d)
d1 = min(np.min(2 * p * (h - f) + 2 * q * d - l1 * f * h - l2 * (h * h - d * d) - mu) for f in (1.0, -1.0))
x1, x2 = 2 * q - psh, 2 * p - psd
a11, a12, a22 = 8 * ph - x1 * x1, 4 * (pd + qh) - x1 * x2, 8 * qd - x2 * x2
far = np.min(np.abs(np.abs(h)[:, None] - kn[None, :]), axis=1) > 1e-6
lam_min = ((a11 + a22) - np.sqrt((a11 - a22) ** 2 + 4 * a12 ** 2)) / 2
loc = np.min(lam_min[far])
print('D1: least value over %d points and both lamp values: %.3e' % (n, d1))
print('LOC: least eigenvalue of the local matrix over %d interior points: %.3e' % (far.sum(), loc))
def net(R, f):
    N = len(f); L = R.copy(); np.fill_diagonal(L, 0); np.fill_diagonal(L, -L.sum(1))
    A_ = np.vstack([L.T, np.ones(N)]); b = np.zeros(N + 1); b[-1] = 1; pi = np.linalg.lstsq(A_, b, rcond=None)[0]
    K_ = np.linalg.inv(np.eye(N) - L); c1, c2 = pi @ (f * (K_ @ f)), pi @ (f * (K_ @ K_ @ f)); s = 0.0
    for i in range(N):
        for j in range(i + 1, N):
            x, y = pi[i] * L[i, j], pi[j] * L[j, i]
            if x > 0 and y > 0: s += (x - y) * np.log(x / y)
            elif x > 0 or y > 0: s = np.inf
    return c1, c2, s
aff = np.inf
for t in range(20000):
    N = int(rng.integers(3, 13)); k = int(rng.integers(1, N)); f = np.array([1.0] * k + [-1.0] * (N - k)); R = np.zeros((N, N))
    if t % 2:
        for i in range(N): R[i, (i + 1) % N] = np.exp(rng.normal(1, 1)); R[(i + 1) % N, i] = np.exp(rng.normal(0, 1))
    else:
        M = rng.random((N, N)) < 0.6; R = np.where(M | M.T, np.exp(rng.normal(0, 2, (N, N))), 0.0); np.fill_diagonal(R, 0)
    try: c1, c2, s = net(R, f)
    except Exception: continue
    if np.isfinite(s): aff = min(aff, s - (l1 * c1 + l2 * c2 + mu))
best = np.inf
for N in range(4, 13, 2):
    f = np.array([1.0] * (N // 2) + [-1.0] * (N - N // 2) + [1.0, -1.0])     # a ring plus a two-state telegraph, bridged
    M = N + 2; edges = [(i, (i + 1) % N) for i in range(N)] + [((i + 1) % N, i) for i in range(N)] + [(N, N + 1), (N + 1, N), (0, N), (N, 0)]
    for s_ in range(4):
        def obj(th):
            R = np.zeros((M, M))
            for (i, j), v in zip(edges, th): R[i, j] = np.exp(v)
            c1, c2, s = net(R, f); return s - (l1 * c1 + l2 * c2 + mu) if np.isfinite(s) else 1e6
        th0 = rng.normal(0.5, 1, len(edges)); th0[-2:] = -8
        try: best = min(best, minimize(obj, th0, method='Nelder-Mead', options={'maxiter': 6000}).fun)
        except Exception: pass
print('AFF: least sigma - bound over 20,000 random networks %.6f; optimiser over rings + telegraph (6 to 14 states) %.6f' % (aff, best))
out = subprocess.run([sys.executable, 'claude/verify_local.py', CERT], capture_output=True, text=True, timeout=300)
print("the author's verifier, run here:", (out.stdout.strip().splitlines() or ['(no output)'])[-1])
bad = d1 < -1e-9 or loc < -1e-9 or aff < -1e-9 or best < -1e-9 or 'PROVED' not in out.stdout
print('RESULT:', 'a violation was found' if bad else 'no violation found'); sys.exit(1 if bad else 0)
