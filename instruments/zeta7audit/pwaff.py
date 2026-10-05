"""pwaff.py — certified exact integration of a piecewise-affine function of one variable.

A function is written ONCE, as ordinary code over a value type `Aff` (an affine form c0 + c1*y with
exact rational coefficients, valid on one open cell (lo, hi)). Every branch the code takes — a max,
a min, a floor, a comparison with a constant — goes through a method here that checks the branch is
the SAME on the whole open cell. If it is not, the method raises `Split(y*)` with the exact rational
point where the branch changes, and the integrator cuts the cell there and tries both halves.

So when `integrate` returns, the function is PROVED affine on every cell it reports (each branch was
certified constant on the open cell by evaluating an affine difference at both closed endpoints), and
the integral is the exact rational sum of those affine pieces. No breakpoint list is supplied or
trusted; nothing is sampled. cert-machine's own code, standard library only, 2026-10-05.
"""
from fractions import Fraction as Q
import math


class Split(Exception):
    """A branch is not constant on the current cell; cut at `y` (exact)."""
    def __init__(self, y, why=''):
        super().__init__(f'split at {y} ({why})')
        self.y = Q(y)
        self.why = why


class Cell:
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi):
        self.lo, self.hi = Q(lo), Q(hi)
        if not self.lo < self.hi:
            raise ValueError('empty cell')

    @property
    def mid(self):
        return (self.lo + self.hi) / 2


class Aff:
    """c0 + c1*y on a cell. Arithmetic is exact; branches are certified."""
    __slots__ = ('c0', 'c1', 'cell')

    def __init__(self, c0, c1, cell):
        self.c0, self.c1, self.cell = Q(c0), Q(c1), cell

    # -- construction -------------------------------------------------------------------------
    @staticmethod
    def y(cell):
        return Aff(0, 1, cell)

    def _lift(self, o):
        return o if isinstance(o, Aff) else Aff(o, 0, self.cell)

    # -- arithmetic -----------------------------------------------------------------------------
    def __add__(self, o):
        o = self._lift(o)
        return Aff(self.c0 + o.c0, self.c1 + o.c1, self.cell)
    __radd__ = __add__

    def __neg__(self):
        return Aff(-self.c0, -self.c1, self.cell)

    def __sub__(self, o):
        return self + (-self._lift(o))

    def __rsub__(self, o):
        return self._lift(o) - self

    def __mul__(self, k):
        if isinstance(k, Aff):
            if k.c1 != 0 and self.c1 != 0:
                raise TypeError('product of two non-constant affine forms is not affine')
            if k.c1 == 0:
                k = k.c0
            else:
                return k * self.c0
        k = Q(k)
        return Aff(self.c0 * k, self.c1 * k, self.cell)
    __rmul__ = __mul__

    def at(self, y):
        return self.c0 + self.c1 * Q(y)

    # -- certified branches ---------------------------------------------------------------------
    def sign(self, why=''):
        """+1 if >= 0 on the whole open cell, -1 if <= 0 there (0 only if identically zero).
        Otherwise Split at the root."""
        a, b = self.at(self.cell.lo), self.at(self.cell.hi)
        if a == 0 and b == 0:
            return 0
        if a >= 0 and b >= 0:
            return 1
        if a <= 0 and b <= 0:
            return -1
        raise Split(-self.c0 / self.c1, why or 'sign change')

    def pos(self, why=''):
        """(x)_+ = max(x, 0)."""
        return self if self.sign(why or 'positive part') >= 0 else Aff(0, 0, self.cell)

    def floor_const(self, why=''):
        """floor(x), which must be constant on the open cell (x is affine)."""
        a, b = self.at(self.cell.lo), self.at(self.cell.hi)
        lo, hi = min(a, b), max(a, b)
        m = math.floor(lo) + 1                       # the first integer strictly above lo
        if m < hi:                                   # an integer strictly inside: floor jumps there
            raise Split((m - self.c0) / self.c1, why or 'floor jump')
        return math.floor(lo)


def amin(a, b, why=''):
    a = a if isinstance(a, Aff) else b._lift(a)
    b = b if isinstance(b, Aff) else a._lift(b)
    return a if (b - a).sign(why or 'min') >= 0 else b


def amax(a, b, why=''):
    a = a if isinstance(a, Aff) else b._lift(a)
    b = b if isinstance(b, Aff) else a._lift(b)
    return a if (a - b).sign(why or 'max') >= 0 else b


def above(cell, c, why=''):
    """Is y > c on the whole open cell?  (Split at c if c is strictly inside.)"""
    c = Q(c)
    if cell.lo < c < cell.hi:
        raise Split(c, why or f'y vs {c}')
    return cell.lo >= c


def floor_inv(cell, why=''):
    """floor(1/y) for y > 0, which must be constant on the open cell."""
    if cell.lo <= 0:
        raise ValueError('floor_inv needs y > 0')
    lo, hi = 1 / cell.hi, 1 / cell.lo                # 1/y ranges over (lo, hi) on the open cell
    m = math.floor(lo) + 1
    if m < hi:
        raise Split(Q(1, m), why or 'floor(1/y) jump')
    return math.floor(lo)


def integrate(f, lo, hi, max_cells=100000):
    """Exact integral of f over [lo, hi], f written over Aff. Returns (value, pieces) where pieces are
    (lo, hi, c0, c1): f = c0 + c1*y PROVED on each open piece. Adjacent equal pieces are merged."""
    stack = [Cell(lo, hi)]
    done = []
    while stack:
        if len(done) + len(stack) > max_cells:
            raise RuntimeError('too many cells')
        c = stack.pop()
        try:
            v = f(Aff.y(c))
            v = v if isinstance(v, Aff) else Aff(v, 0, c)
        except Split as s:
            if not c.lo < s.y < c.hi:
                raise RuntimeError(f'split point {s.y} outside its cell ({c.lo}, {c.hi}): {s.why}')
            stack.append(Cell(s.y, c.hi))
            stack.append(Cell(c.lo, s.y))
            continue
        done.append((c.lo, c.hi, v.c0, v.c1))
    done.sort()
    merged = []
    for p in done:
        if merged and merged[-1][1] == p[0] and merged[-1][2:] == p[2:]:
            merged[-1] = (merged[-1][0], p[1], p[2], p[3])
        else:
            merged.append(p)
    total = sum(c0 * (b - a) + c1 * (b * b - a * a) / 2 for a, b, c0, c1 in merged)
    return total, merged


def integrate_pieces(pieces):
    """Exact integral of a printed piecewise-affine table [(lo, hi, b, c)] with value b + c*y."""
    return sum(Q(b) * (Q(r) - Q(l)) + Q(c) * (Q(r) ** 2 - Q(l) ** 2) / 2 for l, r, b, c in pieces)
