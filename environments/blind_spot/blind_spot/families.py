"""The four testbench families, read from the hex MCY ran.

    corpus    4000 pairs from the 14.95M-pair certified corpus (norm-4 shell)
    mint      4000 pairs with D = 4(u.v)^2 - (u.u)(v.v) in {-2..2}, DIFFERENT norms
    outbox    4000 pairs with one to three coordinates at -4, the excluded code point
    aligned   4000 pairs with |u.v| near its maximum, where the wide operands live

Same files, same order, same pairs MCY used to compute the published coverage.
Each record is 68 bits: u0..u10 then v0..v10, 3 bits each, then 2 verdict bits.
"""
import os
from functools import lru_cache

from .design import D, FAMILIES, MUT, W, to_signed

RECORD_BITS = 2 * D * W + 2


def decode(rec):
    """68-bit record -> ((u...), (v...), expected 0/1/2)."""
    exp = rec & 3
    bits = rec >> 2
    coords = []
    for k in range(2 * D):
        shift = (2 * D - 1 - k) * W
        coords.append(to_signed((bits >> shift) & ((1 << W) - 1)))
    return tuple(coords[:D]), tuple(coords[D:]), exp


@lru_cache(maxsize=None)
def load(name):
    """All pairs of one family, as a tuple of (u, v) with u, v tuples of ints."""
    if name not in FAMILIES:
        raise KeyError(name)
    path = os.path.join(MUT, name + ".hex")
    out = []
    for line in open(path):
        line = line.strip()
        if line:
            u, v, _ = decode(int(line, 16))
            out.append((u, v))
    return tuple(out)
