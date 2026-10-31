"""The forgery gate: planted answers that must score 0, and green controls that must score above 0, before any
number is reported.

Each planted answer names the verdict it must receive. A forgery that scores above 0 LEAKED; one that scores 0
under the wrong verdict is MISFILED (a refutation reported as a parse failure hides what the grader saw). The green
controls exist because a grader that rejects everything passes every red control: the gate must see the true
bracket certified, too.
"""
from __future__ import annotations

import json
import math
import time
from fractions import Fraction

from . import exact
from .families import REGISTRY, frac_text
from .policies import cf

_J = lambda lo, hi: json.dumps({"lo": lo, "hi": hi})


def _dec(v, k):
    """the integer v / 10^k as a decimal string, exactly"""
    sign, v = ("-" if v < 0 else ""), abs(v)
    s = str(v).rjust(k + 1, "0")
    return sign + (s[:-k] + "." + s[-k:] if k else s)


def _floor_dec(x, k):
    return _dec((x.numerator * 10 ** k) // x.denominator, k)


def _ceil_dec(x, k):
    return _dec(-((-x.numerator * 10 ** k) // x.denominator), k)


def _mutant(numerator, row):
    """A tight bracket's side moved one unit of its denominator crosses the root (x - p/q < 1/q for the
    Farey/convergent brackets cf gives), so it is REFUTED, unless the moved numerator reaches the size limit,
    where it is MALFORMED before any arithmetic. Worth 0 either way; the expected verdict says which."""
    return exact.REFUTED if abs(numerator) < 10 ** row["limit_digits"] else exact.MALFORMED


def plant(row):
    """[(name, reply, expected verdict)] for one row, every one worth 0. Built from the row and the true bracket."""
    F = REGISTRY[row["family"]]
    good = json.loads(cf(row["prompt"]))
    lo_g, hi_g = Fraction(good["lo"]), Fraction(good["hi"])
    lo0, hi0 = Fraction(row["lo0"]), Fraction(row["hi0"])
    x = F.hp_estimate(row["instance"], 60)
    xf = float(x)
    T = frac_text
    # the most decimals the size limit admits for this root (deviation 1 of the pre-registration: a fixed 25 put
    # the forgery over the limit for kroot roots near 10^6, where it scored MALFORMED, not REFUTED; 0 either way)
    k = min(25, row["limit_digits"] - 1 - len(str(abs(int(x)))))
    out = [
        ("the stated bracket, copied", _J(row["lo0"], row["hi0"]), exact.CERTIFIED),
        ("the sides swapped (lo > hi)", _J(T(hi_g), T(lo_g)), exact.MALFORMED),
        ("a point (lo = hi)", _J(T(lo_g), T(lo_g)), exact.MALFORMED),
        ("lo above the root", _J(T(hi_g), T(hi0 + 1)), exact.REFUTED),
        ("hi below the root", _J(T(lo0), T(lo_g)), exact.REFUTED),
        ("lo one unit of its denominator the wrong way",
         _J(T(Fraction(lo_g.numerator + 1, lo_g.denominator)), T(hi0 + 1)), _mutant(lo_g.numerator + 1, row)),
        ("hi one unit of its denominator the wrong way",
         _J(T(lo0), T(Fraction(hi_g.numerator - 1, hi_g.denominator))), _mutant(hi_g.numerator - 1, row)),
        ("an endpoint of 90 digits", _J("1" + "0" * 89, T(hi0 + 1)), exact.MALFORMED),
        ("a fraction over the size limit, tight and true",
         _J(_floor_dec(x, 40), _ceil_dec(x, 40)) if row["family"] != "xx" else
         _J(_floor_dec(x, 9), _ceil_dec(x, 9)), exact.MALFORMED),
        ("hi a truncated decimal (looks tight, below the root)", _J(T(lo0), _floor_dec(x, k)), exact.REFUTED),
        ("lo a rounded-up decimal (looks tight, above the root)", _J(_ceil_dec(x, k), T(hi0 + 1)), exact.REFUTED),
        ("the root printed as a float, no interval", "x = %r" % xf, exact.MALFORMED),
        ("the float as both endpoints", _J(repr(xf), repr(xf)), exact.MALFORMED),
        ("an exponent", '{"lo": %se0, "hi": %se0}' % (repr(math.floor(xf)), repr(math.ceil(xf) + 1)), exact.MALFORMED),
        ("NaN and Infinity", '{"lo": NaN, "hi": Infinity}', exact.MALFORMED),
        ("a zero denominator", _J("1/0", T(hi0)), exact.MALFORMED),
        ("prose", "x is between %s and %s" % (T(lo_g), T(hi_g)), exact.MALFORMED),
        ("a hedge: the true bracket, then a wrong one last",
         _J(T(lo_g), T(hi_g)) + "\n" + _J(T(hi_g), T(hi0 + 1)), exact.REFUTED),
    ]
    if row["family"] == "xx":
        out.append(("a true side outside the reduction (lo = 1/2)", _J("1/2", T(hi_g)), exact.REFUSED))
    if row["family"] == "kroot":
        out.append(("a true side outside the reduction (lo = 0)", _J("0", T(hi_g)), exact.REFUSED))
    return out


def green(row):
    """Answers that must score above 0: the true bracket, and the same bracket with prose around it."""
    good = cf(row["prompt"])
    return [("the true bracket", good), ("the true bracket after reasoning", "Working...\nSo:\n" + good + "\n")]


def gate_rows(n):
    from .api import family_train_row
    return [family_train_row(f, i) for f in REGISTRY for i in range(n)]


def gate(n=6, rows=None, grade_fn=None):
    """Plant every forgery and every green control on `rows` (default: the first n training rows of each family)."""
    from .task import grade
    grade_fn = grade_fn or grade
    rows = gate_rows(n) if rows is None else rows
    planted = leaked = misfiled = green_failed = 0
    failures = []
    slowest = 0.0
    for r in rows:
        for name, reply, want in plant(r):
            planted += 1
            t = time.time()
            g = grade_fn(r, reply)
            slowest = max(slowest, time.time() - t)
            if g["reward"] > 0:
                leaked += 1
                failures.append("LEAKED %s: %s (%s)" % (r["id"], name, g["verdict"]))
            elif g["verdict"] != want:
                misfiled += 1
                failures.append("MISFILED %s: %s -> %s, not %s" % (r["id"], name, g["verdict"], want))
        for name, reply in green(r):
            g = grade_fn(r, reply)
            if not (g["verdict"] == exact.CERTIFIED and g["reward"] > 0):
                green_failed += 1
                failures.append("GREEN FAILED %s: %s -> %s" % (r["id"], name, g["verdict"]))
    return {"rows": len(rows), "planted": planted, "leaked": leaked, "misfiled": misfiled,
            "green": 2 * len(rows), "green_failed": green_failed, "slowest_s": round(slowest, 3),
            "ok": leaked == 0 and misfiled == 0 and green_failed == 0, "failures": failures}
