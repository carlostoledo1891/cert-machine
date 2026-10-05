"""grid.py — mirror-symmetric partitions of [0,1] in units of 1/1096 (fine near the breakpoints of
phi*), the exact excess data per cell, and the exact cell-pair areas.

Excess (exact, global):  E(sigma) = (Q(phi) - Q(phi*))/4 = ∫ h sigma + Q(phi* sigma),
  sigma = (1 - phi phi*)/2 in [0,1],  h = -phi* g* >= 0.
Per cell I_i (phi* = s_i on it), y_i = average of sigma on I_i:
  ∫_{I_i} h sigma >= B_i(y_i) >= a_i y_i + b_i y_i^2      (bathtub, exact minorant checked)
  pair (i,j) fully in R  : s_i s_j w_i w_j y_i y_j               (exact)
  pair cut by ∂R (A_in + A_out = w_i w_j):
     s_i s_j = +1 : >= max(0, w_i w_j y_i y_j - A_out)
     s_i s_j = -1 : >= -min(A_in, w_i w_j y_i y_j)."""
from fractions import Fraction as Fr
import sys
sys.path.insert(0, '..')
from model import area_rect
from phistar import N, BP, phi_r, g, GRID
BPU = [int(t * N) for t in BP]           # breakpoints in units
HV = None
def hvals():
    global HV
    if HV is None:
        # h is continuous piecewise linear with nodes at integer units
        HV = []
        for k in range(N + 1):
            a = GRID[k]
            s = phi_r(a) if k < N else phi_r(a - Fr(1, 10**9))
            HV.append(-s * g(a))
        for t in BPU: assert HV[t] == 0
        assert min(HV) >= 0
    return HV
def make_grid(fine=4, coarse=24, D=8, extra=()):
    pts = set(range(0, N + 1, coarse)) | {0, N} | set(BPU)
    for t in BPU:
        for u in range(t - D, t + D + 1):
            if 0 <= u <= N and (u - t) % fine == 0: pts.add(u)
    for u in extra: pts.add(u)
    pts |= {N - p for p in pts}
    pts = sorted(pts)
    return pts
def bathtub(p, q):
    """bathtub minorant of h on [p,q] (units): returns (w, a, b, hmin) with
    a y + b y^2 <= B(y) := min{ ∫_{I} h sigma : 0 <= sigma <= 1, avg sigma = y }  for y in [0,1].
    B(0)=0, B'(0) = w hmin = a, B''(y) = w^2 / m'(level) where m(v) = |{h < v}| on the cell; so
    b = (w^2/2) / max_v m'(v) gives B'' >= 2b and the minorant follows by Taylor's formula.
    m'(v) = sum over unit pieces whose range contains v of 1/(N |Δ_piece|); a flat piece gives b = 0."""
    H = hvals(); w = Fr(q - p, N)
    pieces = [(min(H[k], H[k + 1]), max(H[k], H[k + 1])) for k in range(p, q)]
    hmin = min(lo for lo, hi in pieces); a = w * hmin
    if any(lo == hi for lo, hi in pieces):
        return w, a, Fr(0), hmin
    levels = sorted(set([lo for lo, hi in pieces] + [hi for lo, hi in pieces]))
    mmax = Fr(0)
    for v0, v1 in zip(levels, levels[1:]):
        d = sum(Fr(1, N) / (hi - lo) for lo, hi in pieces if lo <= v0 and hi >= v1)
        mmax = max(mmax, d)
    b = w * w / 2 / mmax
    return w, a, b, hmin
def cells(pts):
    out = []
    for p, q in zip(pts, pts[1:]):
        w, a, b, hmin = bathtub(p, q)
        out.append(dict(p=p, q=q, w=w, a=a, b=b, hmin=hmin, s=phi_r(Fr(p, N))))
    return out
def pairs(C):
    """classify ordered cell pairs (i,j): a in I_i, b in I_j."""
    n = len(C); full = []; cut = []
    for i in range(n):
        a0, a1 = Fr(C[i]['p'], N), Fr(C[i]['q'], N)
        for j in range(n):
            b0, b1 = Fr(C[j]['p'], N), Fr(C[j]['q'], N)
            # quick reject
            if b1 <= a0 / 2 or b0 >= (1 + a1) / 2: continue
            ar = area_rect(a0, a1, b0, b1); tot = (a1 - a0) * (b1 - b0)
            if ar == 0: continue
            if ar == tot: full.append((i, j))
            else: cut.append((i, j, ar, tot - ar))
    return full, cut
if __name__ == "__main__":
    pts = make_grid()
    C = cells(pts)
    print(len(C), "cells")
    for c in C[:20]: print(c['p'], c['q'], float(c['a']), float(c['b']), float(c['hmin']), c['s'])
    full, cut = pairs(C)
    print(len(full), "full pairs,", len(cut), "cut pairs")
