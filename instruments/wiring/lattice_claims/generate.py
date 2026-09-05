"""Procedural instances. Deterministic from a seed, so --resume is stable.

THE GENERATOR'S ONE TRICK
-------------------------
Finding a short vector in a lattice is the hard problem; nobody generates
instances that way. But a lattice can be BUILT AROUND a short vector that was
chosen first.

A Goldstein-Mayer lattice is fixed by its modulus q and the row entries
xs[0..n-2], and a vector v lies in it exactly when

    v[0] - sum_i v[i] * xs[i-1]  ==  0   (mod q)

which is one linear congruence in the xs. So: choose v freely and small, choose
all but one of the xs at random, then solve the congruence for the last one.
The result is an ordinary GM lattice with determinant q -- the xs are still
uniform, nothing about it is special -- that happens to contain a vector whose
norm we picked. That gives exact control over the only dial that matters, the
distance from the acceptance wall, and it costs nothing.

Floats appear in this file and only in this file. Choosing which instance to
mint is not a decision about a claim, so a float may propose it; the exact
predicate then measures what was actually minted, and that measurement is what
the task ships. A float never decides anything here.
"""

import random
from fractions import Fraction

from .certify.exact import decide, in_lattice, norm_sq, ratio_bracket
from .certify.naive import careful_float

__all__ = ["make_lattice", "mint", "Instance"]


def _is_prime(m: int, rounds: int = 40, rng: random.Random = None) -> bool:
    if m < 2:
        return False
    for p in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        if m % p == 0:
            return m == p
    d, s = m - 1, 0
    while d % 2 == 0:
        d //= 2
        s += 1
    rng = rng or random
    for _ in range(rounds):
        a = rng.randrange(2, m - 1)
        x = pow(a, d, m)
        if x in (1, m - 1):
            continue
        for _ in range(s - 1):
            x = x * x % m
            if x == m - 1:
                break
        else:
            return False
    return True


def _prime(bits: int, rng: random.Random) -> int:
    while True:
        c = rng.getrandbits(bits) | (1 << (bits - 1)) | 1
        if _is_prime(c, rng=rng):
            return c


class Instance:
    """One lattice, one vector, and the exact truth about it."""

    def __init__(self, n, q, xs, v, ratio_lo, ratio_hi, verdict, factor):
        self.n, self.q, self.xs, self.v = n, q, xs, v
        self.ratio_lo, self.ratio_hi = ratio_lo, ratio_hi
        self.verdict, self.factor = verdict, factor
        self.norm_squared = norm_sq(v)


def make_lattice(n: int, bits: int, rng: random.Random):
    q = _prime(bits, rng)
    xs = [rng.randrange(q) for _ in range(n - 1)]
    return q, xs


def wall_norm(n: int, q: int, factor=Fraction(21, 20), digits: int = 60) -> int:
    """The largest integer norm the lattice admits, found exactly by bisection."""
    lo, hi = 1, 1
    while decide(n, q, hi * hi, factor, digits) == "ADMISSIBLE":
        hi *= 2
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if decide(n, q, mid * mid, factor, digits) == "ADMISSIBLE":
            lo = mid
        else:
            hi = mid - 1
    return lo


def mint(n: int, bits: int, target_ratio: float, band: float, rng: random.Random,
         factor=Fraction(21, 20), tries: int = 60) -> Instance:
    """A lattice containing a vector whose exact ratio lands within `band`.

    The norm is SOLVED FOR rather than sampled. All coordinates but the first
    are drawn at random; the first is then whatever makes the squared norm land
    on target, which is possible because v[0] is free -- the congruence is
    afterwards solved for the last basis entry, not for v. That turns an
    unreliable rejection loop into one square root, and it is what lets an
    instance be placed a few parts in 10^5 from the wall on demand.
    """
    from math import isqrt

    q, xs = make_lattice(n, bits, rng)
    wall = wall_norm(n, q, factor)              # = floor(factor * GH), exactly
    gh = wall / float(factor)
    target = gh * target_ratio

    # A multiplicative correction rather than rejection: the achieved ratio is
    # very nearly linear in the target, so two or three passes land inside any
    # band the norm granularity can express, and the best candidate is kept
    # rather than thrown away.
    best = None
    aim = target
    for _ in range(tries):
        share = rng.uniform(0.55, 0.9)
        s = max(1, int((aim * (share / n) ** 0.5)))
        v = [0] + [rng.randint(-s, s) for _ in range(n - 1)]
        if v[-1] == 0:
            v[-1] = 1
        partial = sum(c * c for c in v[1:])
        room = int(aim * aim) - partial
        if room <= 0:
            aim *= 1.05
            continue
        v[0] = isqrt(room)
        acc = v[0] - sum(vi * xi for vi, xi in zip(v[1:-1], xs[:-1]))
        try:
            xs[-1] = acc % q * pow(v[-1], -1, q) % q
        except ValueError:
            continue
        if not in_lattice(q, xs, v):
            continue
        ns = norm_sq(v)
        if ns == 0:
            continue
        r_lo, r_hi = ratio_bracket(n, q, ns)
        got = float(r_lo)
        cand = Instance(n, q, list(xs), v, r_lo, r_hi, decide(n, q, ns, factor), factor)
        if best is None or abs(got - target_ratio) < abs(float(best.ratio_lo) - target_ratio):
            best = cand
        if abs(got - target_ratio) <= band:
            return cand
        aim *= target_ratio / got
    if best is not None and abs(float(best.ratio_lo) - target_ratio) <= max(band * 8, 2e-3):
        return best
    raise RuntimeError(f"could not mint an instance near ratio {target_ratio}")
