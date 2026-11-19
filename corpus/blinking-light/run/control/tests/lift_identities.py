"""Control-room test of the identities LIFT and DUALITY rest on (claude/lifting.md section 1), written from that text.
Floats, random networks (complete-ish graphs and rings, 3 to 12 states, random lamp). With p the stationary law,
Q_ij = p_i k_ij, w = Kf, v = K*f (K = (I - L)^-1, r = 1), it checks
  F1  sum_j Q_ij (w_j - w_i) = p_i (w_i - f_i)          F2  sum_i Q_ij (v_i - v_j) = p_j (v_j - f_j)
  F3  C1 = sum p f w = sum p f v,  C2 = sum p v w,  |w|, |v| <= 1     (C1, C2 also computed from K and K^2 directly)
and the step of Theorem D's proof: for any psi, beta, gamma, sum_{i!=j} Q_ij tau(z_i, z_j) equals
sum_i p_i beta_i (w_i - f_i) + sum_j p_j gamma_j (v_j - f_j) (random psi, beta, gamma as functions of the state).
It does not test the converse half of Theorem L or the convexity corollary. Exits 1 on a residual above 1e-9."""
import numpy as np, sys
rng = np.random.default_rng(7)
worst = 0.0; n = 0
for trial in range(3000):
    N = int(rng.integers(3, 13)); f = rng.choice([-1.0, 1.0], N)
    if abs(f.sum()) == N: f[0] = -f[0]
    if trial % 2:
        R = np.zeros((N, N))
        for i in range(N): R[i, (i + 1) % N] = np.exp(rng.normal(1, 1)); R[(i + 1) % N, i] = np.exp(rng.normal(0, 1))
    else:
        M = rng.random((N, N)) < 0.6; R = np.where(M | M.T, np.exp(rng.normal(0, 2, (N, N))), 0.0)
    np.fill_diagonal(R, 0); L = R.copy(); np.fill_diagonal(L, -R.sum(1))
    A = np.vstack([L.T, np.ones(N)]); b = np.zeros(N + 1); b[-1] = 1
    p = np.linalg.lstsq(A, b, rcond=None)[0]
    if np.min(p) <= 0: continue
    Q = p[:, None] * R; K = np.linalg.inv(np.eye(N) - L); Ks = (K.T * p[None, :]) / p[:, None]
    w, v = K @ f, Ks @ f
    F1 = (Q * (w[None, :] - w[:, None])).sum(1) - p * (w - f)
    F2 = (Q * (v[:, None] - v[None, :])).sum(0) - p * (v - f)
    C1, C2 = p @ (f * (K @ f)), p @ (f * (K @ K @ f))
    F3 = [C1 - p @ (f * w), C1 - p @ (f * v), C2 - p @ (v * w), max(0, np.max(np.abs(w)) - 1), max(0, np.max(np.abs(v)) - 1)]
    psi, beta, gamma = rng.normal(size=N), rng.normal(size=N), rng.normal(size=N)
    tau = psi[:, None] - psi[None, :] + beta[:, None] * (w[None, :] - w[:, None]) + gamma[None, :] * (v[:, None] - v[None, :])
    lhs = (Q * tau).sum() - (np.diag(Q) * np.diag(tau)).sum()
    rhs = p @ (beta * (w - f)) + p @ (gamma * (v - f))
    worst = max(worst, np.max(np.abs(F1)), np.max(np.abs(F2)), max(abs(x) for x in F3), abs(lhs - rhs) / (1 + abs(rhs))); n += 1
print('%d random networks; largest residual of F1, F2, F3 and the duality sum: %.3e' % (n, worst))
print('RESULT:', 'an identity FAILS' if worst > 1e-9 else 'identities hold to rounding'); sys.exit(1 if worst > 1e-9 else 0)
