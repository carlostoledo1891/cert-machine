"""local1.py — exact first- and second-order data at phi*: zeros of h, one-sided slopes at the
breakpoints, and the breakpoint-shift quadratic form (2^11 sign orthants)."""
from fractions import Fraction as Fr
import itertools, numpy as np
from phistar import *
cells = [h_cell(k) for k in range(N)]
# 1. h >= 0 everywhere, zero only at breakpoints
zeros = []
for k, (l, r) in enumerate(cells):
    assert l >= 0 and r >= 0, (k, l, r)
    if l == 0: zeros.append(GRID[k])
    if r == 0: zeros.append(GRID[k + 1])
zeros = sorted(set(zeros))
print("zeros of h (x1096):", [int(z * N) for z in zeros])
print("breakpoints (x1096):", [int(t * N) for t in BP])
# min of h away from breakpoints, as a function of distance
def hmin_outside(rho):
    m = None
    for k, (l, r) in enumerate(cells):
        a0, a1 = GRID[k], GRID[k + 1]
        # sample the linear piece clipped to the complement of the rho-neighbourhoods
        pts = [a0, a1] + [t + d for t in BP for d in (-rho, rho) if a0 < t + d < a1]
        for p in pts:
            if all(abs(p - t) >= rho for t in BP) and all(not (a0 < t < a1) or abs(p - t) >= rho for t in BP):
                v = l + (r - l) * (p - a0) * N
                m = v if m is None or v < m else m
    return m
for rr in (1, 2, 3, 4, 6, 8, 12, 16):
    rho = Fr(rr, N); print(f"rho={rr}/1096: min h outside = {float(hmin_outside(rho)):.6f}")
# 2. one-sided slopes of h at each breakpoint
slopes = []
for t in BP:
    k = int(t * N)
    lL, rL = cells[k - 1]; lR, rR = cells[k]
    sL = (lL - rL) * N; sR = (rR - lR) * N   # slope moving away from t on each side
    slopes.append((sL, sR))
    print(f"t={int(t*548)}/548  slope_left={float(sL):.4f} ({sL})  slope_right={float(sR):.4f} ({sR})")
# 3. breakpoint-shift form: excess/4 = sum_k slope^{side}/2 d_k^2 + d^T Sr C Sr d,  mu_k = s_k^R d_k
sR_sign = [phi_r(t) for t in BP]
C = np.array([[float(kern(a, b)) if a != b else 1.0 for b in BP] for a in BP])
print("kernel matrix at breakpoints:\n", (C * 2).astype(int))
M0 = np.diag(sR_sign) @ C @ np.diag(sR_sign)
worst = None
for signs in itertools.product((0, 1), repeat=11):
    D = np.diag([float(slopes[k][1] if signs[k] else slopes[k][0]) / 2 for k in range(11)])
    ev = np.linalg.eigvalsh(D + M0).min()
    if worst is None or ev < worst[0]: worst = (ev, signs)
print("min eigenvalue over the 2^11 orthant matrices:", worst)
