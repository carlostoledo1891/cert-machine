"""The reference implementation, verbatim from the task statement.

This file is the ground truth for the Lean definitions. gen.py and compare.py
import it; nothing here is edited.
"""
from itertools import accumulate, combinations

WIDTHS = (28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28)


def signature(m):
    ends = [0, *accumulate(w*m for w in WIDTHS)]
    n = ends[-1]
    blocks = [(a, b, (-1)**i) for i, (a, b) in enumerate(zip(ends, ends[1:]))]
    sites = [(b+e, sign*(-1)**e) for _, b, sign in blocks[:-1] for e in (0, 1)]
    def prefix(t):
        return sum(s * min(b-a, max(0, t-a)) for a, b, s in blocks)
    linear = []
    for p, s in sites:
        parity_sum = sum(v * ((b + p%2)//2 - (a + p%2)//2) for a,b,v in blocks)
        middle = prefix(2*p-1) - prefix(2*p-n-1)
        endpoint = prefix((n+p)//2) - prefix(p//2)
        twice = -s * (parity_sum + middle + endpoint - 3*s)
        assert twice % 2 == 0
        linear.append(twice//2)
    quadratic = []
    for (p,s), (q,t) in combinations(sites, 2):
        weight = int((p-q)%2 == 0) + int(1 <= 2*p-q <= n) + int(1 <= 2*q-p <= n)
        quadratic.append(s*t*weight)
    return (tuple(linear), tuple(quadratic))
