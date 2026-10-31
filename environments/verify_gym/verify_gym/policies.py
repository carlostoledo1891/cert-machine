"""Reference policies: no API key, no network. Each reads ONLY the prompt (its `Data:` line, the same text a model
is shown) and returns a reply; the reply is graded like any other.

    never    no answer at all                                          the floor: 0
    echo     the bracket the task states                               certified, and worth 0 by construction
    float    a float64 root printed to its 16 significant digits,      the float mistake: trusts the last digit
             +-1 in the last place (xx, whose limit leaves no room     and is sometimes REFUTED
             for decimals: aim at the cap, round each endpoint to
             the nearest fraction the limit allows)
    bisect   20 steps of exact bisection from the stated bracket,      always certified; about 6 decimals
             each midpoint decided by the exact decider (fewer steps
             where the size limit stops it)
    cf       the continued fraction of a 100-digit estimate: the      the ceiling within the size limit
             first consecutive convergents at least as tight as the
             cap, else the Farey neighbours the size limit allows

`bisect` calls the decider and `cf` does not: cf only proposes, and its brackets are decided like a model's.
"""
from __future__ import annotations

import json
from fractions import Fraction

from . import exact
from .families import REGISTRY, frac_text


def _data(prompt):
    for line in reversed(prompt.splitlines()):
        if line.startswith("Data: "):
            return json.loads(line[6:])
    raise ValueError("no Data line in the prompt")


def _ans(lo, hi):
    return json.dumps({"lo": lo if isinstance(lo, str) else frac_text(lo),
                       "hi": hi if isinstance(hi, str) else frac_text(hi)})


def _limit(d):
    return 10 ** int(d["limit"].split("^")[1])


def never(prompt):
    return "I cannot bracket this constant."


def echo(prompt):
    d = _data(prompt)
    return _ans(d["lo0"], d["hi0"])


def float_policy(prompt):
    d = _data(prompt)
    F = REGISTRY[d["family"]]
    x = F.float_estimate(d["instance"])
    L = _limit(d)
    if L > 10 ** 20:                    # room for decimals: the float's own 16 significant digits, +-1 in the last
        places = max(0, 15 - len(str(int(abs(x)))) + 1)
        unit = 10.0 ** (-places)
        return _ans("%.*f" % (places, x - unit), "%.*f" % (places, x + unit))
    target = d["d0"] + d["cap"]         # no room: aim at the cap and round to the nearest fraction the limit allows
    half = 0.4 * 10.0 ** (-target)
    qmax = (L - 1) // (int(x) + 2)
    return _ans(Fraction(x - half).limit_denominator(qmax), Fraction(x + half).limit_denominator(qmax))


def bisect(prompt, steps=20):
    d = _data(prompt)
    F = REGISTRY[d["family"]]
    lo, hi = Fraction(d["lo0"]), Fraction(d["hi0"])
    L = _limit(d)
    for _ in range(steps):
        m = (lo + hi) / 2
        if not exact.within(m, L):
            break
        w, _ = exact.side(d["family"], d["instance"], "gt", m)
        if w == exact.CERTIFIED:
            lo = m
        elif w == exact.REFUTED:
            hi = m
        else:
            break
    return _ans(lo, hi)


def _bracket(x, limit, target):
    """From the continued fraction of the rational x: the first pair of consecutive convergents at most `target`
    apart, or, when the size limit stops the expansion first, the tightest bracket the limit allows (the last
    convergent and the largest semiconvergent beside it: Farey neighbours of x)."""
    p0, q0, p1, q1 = 0, 1, 1, 0                         # convergents n-2 and n-1
    r = x
    best = None
    while True:
        a = r.numerator // r.denominator
        p2, q2 = a * p1 + p0, a * q1 + q0
        if not (abs(p2) < limit and q2 < limit):
            if q1 == 0:
                return None
            j = a - 1                                   # the largest semiconvergent (j p1 + p0)/(j q1 + q0) in range
            while j >= 1 and not (abs(j * p1 + p0) < limit and j * q1 + q0 < limit):
                j -= 1
            if j >= 1 or q0 > 0:
                s = Fraction(j * p1 + p0, j * q1 + q0)
                c = Fraction(p1, q1)
                best = (min(c, s), max(c, s))
            return best
        if q1 > 0:
            c1, c2 = Fraction(p1, q1), Fraction(p2, q2)
            best = (min(c1, c2), max(c1, c2))
            if best[1] - best[0] <= target:
                return best
        p0, q0, p1, q1 = p1, q1, p2, q2
        f = r - a
        if f == 0:
            return best
        r = 1 / f


def cf(prompt, digits=100):
    d = _data(prompt)
    F = REGISTRY[d["family"]]
    x = F.hp_estimate(d["instance"], digits)
    best = _bracket(x, _limit(d), Fraction(1, 10 ** (d["d0"] + d["cap"])))
    if best is None:
        return echo(prompt)
    return _ans(*best)


POLICIES = {"never": never, "echo": echo, "float": float_policy, "bisect": bisect, "cf": cf}
DESCRIBE = {
    "never": "no answer",
    "echo": "repeat the stated bracket",
    "float": "float64 root: its 16 significant digits +-1 in the last place (xx: aim at the cap, round to the nearest fraction the limit allows)",
    "bisect": "20 steps of exact bisection (each midpoint decided exactly), fewer where the size limit stops it",
    "cf": "continued fraction of a 100-digit estimate: the first convergent pair as tight as the cap, else the Farey neighbours the size limit allows",
}
