"""inner.py — Anand's inner limiting function R(x) = -Gamma(x) - N(x) of (64)-(69), integrated against
x^-3 over [3, 20] EXACTLY, from the definitions alone (not from Tables 2-4).

R is written over pwaff.Aff in the variable x. The z-integral in (66) is done region by region: for x
in a cell, the counts l(x, z) and l(alpha x, z) jump in z in (0, 1/2) only at d({x}) and d({alpha x})
(d(u) = min(u, 1-u)), so once floor(x), floor(alpha x), the sides of 1/2 of {x}, {alpha x} and the order
of the two jump points are certified constant on the cell, each region's integrand is a constant and its
z-length is affine in x. Every branch is certified by pwaff (a cell where one is not constant is cut at
the exact point), so R is PROVED affine on every reported cell and the integral is an exact rational.
cert-machine's own code, standard library only.
"""
from fractions import Fraction as Q
from pwaff import Aff, amin, integrate
import math

ALPHA = Q(3, 40)
LAM = Q(37, 40)
H = 1 + 3 * ALPHA                 # (64): H = 1 + 3 alpha = 49/40


def _frac_aff(x, why):
    """{x} as an affine form on the cell (floor certified constant)."""
    return x - x.floor_const(why)


def _ell(xv, z):
    """l(x, z) = floor(x - z) + floor(x + z) + 1 at a point (exact)."""
    return math.floor(xv - z) + math.floor(xv + z) + 1


def R_of(x):
    cell = x.cell
    ax = ALPHA * x
    f = _frac_aff(x, 'floor x')
    g = _frac_aff(ax, 'floor alpha x')
    df = f if (Q(1, 2) - f).sign('{x} vs 1/2') >= 0 else 1 - f
    dg = g if (Q(1, 2) - g).sign('{alpha x} vs 1/2') >= 0 else 1 - g
    lo_pt, hi_pt = (df, dg) if (dg - df).sign('d(f) vs d(g)') >= 0 else (dg, df)
    zero, half = Aff(0, 0, cell), Aff(Q(1, 2), 0, cell)
    T = (2 * H * x).floor_const('T = floor(2Hx)')                    # (65)
    xm = cell.mid
    zs = [zero, lo_pt, hi_pt, half]
    integral = Aff(0, 0, cell)
    for a, b in zip(zs, zs[1:]):
        za, zb = a.at(xm), b.at(xm)
        if zb == za:
            continue                                                  # a region of zero length here
        zr = (za + zb) / 2                                            # representative z at the cell midpoint
        ell = _ell(xm, zr)
        bb = 4 * _ell(ALPHA * xm, zr)                                 # (64): b(x, z) = 4 l(alpha x, z)
        integral = integral + (b - a) * ((T - bb) * (T + bb - ell - 7))
    s = H * x - Q(T, 2)                                               # (65)
    q = (2 * x).floor_const('q = floor(2x)')
    nplus = (2 * x - q) * Q(1, 2)
    Gamma = integral + s * (2 * T - q - 7) + (s - nplus).pos('(s - n+)_+')     # (66)
    fx = x.floor_const('floor x')
    fax = ax.floor_const('floor alpha x')
    lx = LAM * x
    m = (2 * lx).floor_const('m = floor(2 lambda x)')
    J = m * lx - Q(m * (m + 1), 4)                                    # (67)
    Nx = 2 * LAM * fx * x - 16 * LAM * fax * x - 2 * J                # (68)
    return -Gamma - Nx                                                # (69)


def inner_integral(lo=3, hi=20):
    """Exact int_lo^hi R(x)/x^3 dx and the certified affine pieces of R."""
    _, pieces = integrate(R_of, lo, hi)
    tot = Q(0)
    for a, b, c0, c1 in pieces:
        tot += c0 * (1 / a ** 2 - 1 / b ** 2) / 2 + c1 * (1 / a - 1 / b)
    return tot, pieces


if __name__ == '__main__':
    import time
    t = time.time()
    v, pcs = inner_integral()
    print(v, float(v), len(pcs), round(time.time() - t, 2), 's')
