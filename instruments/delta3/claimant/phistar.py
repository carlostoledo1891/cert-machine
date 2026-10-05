"""phistar.py — exact data of the 12-block colouring phi* (blocks/548, signs +,-,+,...).
h(a) = -phi*(a) g*(a) >= 0, g* = K phi*, K the symmetrised kernel of R = {a/2 <= b <= (1+a)/2}.
Q(phi* + psi) = Q(phi*) + 2<g*,psi> + Q(psi);  with psi = -phi* rho (rho in [0,2]) the excess is
  Q(phi) - Q(phi*) = 2 ∫ h rho + Q(phi* rho)   (exact, global).
h is linear on every [k/1096, (k+1)/1096]."""
from fractions import Fraction as Fr
TWELVE = [28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28]
B = [Fr(0)]
for s in TWELVE: B.append(B[-1] + Fr(s, 548))
S = [1 if i % 2 == 0 else -1 for i in range(12)]
BP = B[1:-1]                      # 11 interior breakpoints
def Phi(t):
    t = min(max(t, Fr(0)), Fr(1)); tot = Fr(0)
    for k in range(12):
        lo, hi = B[k], B[k + 1]
        if t <= lo: break
        tot += S[k] * (min(t, hi) - lo)
    return tot
def phi_r(a):                     # right-continuous value
    for k in range(12):
        if B[k] <= a < B[k + 1]: return S[k]
    return S[-1]
def phi_l(a):                     # left-continuous value
    for k in range(12):
        if B[k] < a <= B[k + 1]: return S[k]
    return S[0]
def g(a):
    first = Phi((1 + a) / 2) - Phi(a / 2)
    second = Phi(min(Fr(1), 2 * a)) - Phi(max(Fr(0), 2 * a - 1))
    return (first + second) / 2
N = 1096
GRID = [Fr(k, N) for k in range(N + 1)]
def h_cell(k):
    """h on [k/N,(k+1)/N] is linear: returns (h(left), h(right)) using phi* of that cell."""
    a0, a1 = GRID[k], GRID[k + 1]; s = phi_r(a0)
    return -s * g(a0), -s * g(a1)
def kern(a, b):
    """symmetrised kernel value at a generic point."""
    r1 = 1 if (a / 2 <= b <= (1 + a) / 2) else 0
    r2 = 1 if (b / 2 <= a <= (1 + b) / 2) else 0
    return Fr(r1 + r2, 2)
