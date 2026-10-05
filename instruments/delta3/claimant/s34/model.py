"""model.py — the continuum reduction of Erdős #1186 (delta_3, Graham's $100 problem).

Parrilo–Robertson–Saracino (2008): for a 2-colouring of [1,n] with colour densities u,
  2V = #{a+b=2c} - |N+| - |T|,   |T| <= n^2/8,
  |N+|/n^2 -> F(phi) = (1/2)(1/2 - Q(phi)),   Q(phi) = ∫∫_R phi(a) phi(b) da db,
  R = {(a,b) in [0,1]^2 : a/2 <= b <= (1+a)/2},   phi = 2u - 1 in [-1, 1].
Hence  delta_3 >= 1/16 + Q*/4,  Q* = inf_phi Q(phi),  and the 12-block colouring has
Q = -5/137 (=> 117/2192). delta_3 = 117/2192 iff Q* = -5/137.

Discretisation (a valid LOWER bound): cells I_i = [i/L,(i+1)/L), x_i = L ∫_{I_i} phi in [-1,1].
  Q(phi) >= x^T K x / L^2 - beta_L,
  K_ij = 1 if I_i x I_j ⊂ R (inside, both orders symmetrised), beta_L = total area of cell
  pairs that are cut by the boundary of R (their contribution is >= -area).
"""
from fractions import Fraction as Fr
import numpy as np

def inside_rect(i, j, L):
    """area of (I_i x I_j) ∩ R as an exact Fraction (a in I_i, b in I_j)."""
    a0, a1 = Fr(i, L), Fr(i + 1, L)
    b0, b1 = Fr(j, L), Fr(j + 1, L)
    # for a in [a0,a1], b-range inside R is [max(b0, a/2), min(b1, (1+a)/2)]
    # integrate piecewise-linear length; breakpoints where a/2 = b0, a/2 = b1, (1+a)/2 = b0, (1+a)/2 = b1
    pts = {a0, a1}
    for c in (2 * b0, 2 * b1, 2 * b0 - 1, 2 * b1 - 1):
        if a0 < c < a1:
            pts.add(c)
    pts = sorted(pts)
    def length(a):
        lo = max(b0, a / 2); hi = min(b1, (1 + a) / 2)
        return max(Fr(0), hi - lo)
    area = Fr(0)
    for p, q in zip(pts, pts[1:]):
        # length is linear on [p,q] (no breakpoint inside), and max(0, .) too as long as sign fixed;
        # split at the zero crossing if any
        lp, lq = length(p), length(q)
        mid = (p + q) / 2
        lm = length(mid)
        if lm * 2 == lp + lq:
            area += (lp + lq) / 2 * (q - p)
        else:   # kink from max(0,.) inside: refine by bisection exactly (piecewise linear, one kink)
            # find zero of the linear part hi-lo on [p,q]
            def raw(a):
                return min(b1, (1 + a) / 2) - max(b0, a / 2)
            rp, rq = raw(p), raw(q)
            z = p + (q - p) * rp / (rp - rq)
            for s, t in ((p, z), (z, q)):
                area += (length(s) + length(t)) / 2 * (t - s)
    return area

def build(L):
    cell = Fr(1, L * L)
    K = np.zeros((L, L))
    beta = Fr(0)
    inside = 0
    for i in range(L):
        for j in range(L):
            ar = inside_rect(i, j, L)
            if ar == cell:
                K[i, j] += 0.5; K[j, i] += 0.5; inside += 1
            elif ar > 0:
                beta += ar
    return K, beta

def Q_blocks(breaks, signs):
    """exact Q for a step function: breaks 0=t0<...<tm=1 (Fractions), signs ±1 per block."""
    tot = Fr(0)
    m = len(signs)
    for p in range(m):
        for q in range(m):
            tot += signs[p] * signs[q] * area_rect(breaks[p], breaks[p + 1], breaks[q], breaks[q + 1])
    return tot

def area_rect(a0, a1, b0, b1):
    pts = {a0, a1}
    for c in (2 * b0, 2 * b1, 2 * b0 - 1, 2 * b1 - 1):
        if a0 < c < a1:
            pts.add(c)
    pts = sorted(pts)
    def raw(a):
        return min(b1, (1 + a) / 2) - max(b0, a / 2)
    area = Fr(0)
    for p, q in zip(pts, pts[1:]):
        rp, rq = raw(p), raw(q)
        if rp >= 0 and rq >= 0:
            area += (rp + rq) / 2 * (q - p)
        elif rp > 0 > rq or rq > 0 > rp:
            z = p + (q - p) * rp / (rp - rq)
            if rp > 0:
                area += rp / 2 * (z - p)
            else:
                area += rq / 2 * (q - z)
    return area

TWELVE = [28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28]

def twelve_block():
    b = [Fr(0)]
    for s in TWELVE:
        b.append(b[-1] + Fr(s, 548))
    signs = [1 if i % 2 == 0 else -1 for i in range(12)]
    return b, signs

if __name__ == "__main__":
    b, s = twelve_block()
    q = Q_blocks(b, s)
    print("Q(12-block) =", q, float(q), " delta =", Fr(1, 16) + q / 4)
