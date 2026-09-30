"""reference.py — the gate's second implementation, sharing no code with flowline.js.

Python's decimal module at 50 digits, Colebrook solved by bisection on its own
bracket, every constant written out again. It is NOT an enclosure: it is an
accurate point value, and the battery asks the JavaScript gate's thin-box
interval to contain it at every sampled input. A gate whose enclosure missed it
would be wrong somewhere in its arithmetic; a gate that returned the float model
at the box centre (what a point pipeline does) is caught by it at the corners.

usage: python3 reference.py  < points.json  > values.json
  points: [{"L","D","eps","rho","mu","dz","Q","Pd"}, ...]  decimals as strings
  values: ["P_wh in bar", ...]                                          MIT
"""
import json
import sys
from decimal import Decimal, getcontext

getcontext().prec = 50
PI = Decimal('3.14159265358979323846264338327950288419716939937510')
G = Decimal('9.80665')
LN10 = Decimal(10).ln()


def colebrook_x(a, b):
    """x = 1/sqrt(f): the root of x + (2/ln 10) ln(a + b x), increasing in x."""
    def h(x):
        return x + 2 / LN10 * (a + b * x).ln()
    lo, hi = Decimal('0.5'), Decimal('100')
    assert h(lo) < 0 < h(hi)
    for _ in range(200):
        m = (lo + hi) / 2
        if h(m) < 0:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


def wellhead(p):
    L, D, eps, rho, mu, dz, Q, Pd = (Decimal(p[k]) for k in ('L', 'D', 'eps', 'rho', 'mu', 'dz', 'Q', 'Pd'))
    q = Q / 86400
    area = PI * D * D / 4
    v = q / area
    re = rho * v * D / mu
    x = colebrook_x(eps / (Decimal('3.7') * D), Decimal('2.51') / re)
    f = 1 / (x * x)
    return Pd + (rho * G * dz - f * (L / D) * rho * v * v / 2) / Decimal(100000)


if __name__ == '__main__':
    pts = json.load(sys.stdin)
    json.dump([str(wellhead(p)) for p in pts], sys.stdout)
