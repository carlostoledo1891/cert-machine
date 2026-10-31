"""Tasks: one row per (family, split, index), the prompt a model is shown, and the reply parser.

A row carries the PROBLEM and never an answer: the instance, the bracket the task states, the size limit and the
cap. The reward is decided from the row and the reply by verify_gym.exact.grade_endpoints, and from nothing else.
"""
from __future__ import annotations

import json
import re

from . import exact
from .families import REGISTRY, Stream, frac_text

FORMAT = '{"lo": "p/q", "hi": "p/q"}'


def make_row(family, split, index, retry=0):
    """The task at (family, split, index), from the family's own stream. Pure: the same arguments give the same
    row on every machine, forever. `retry` redraws one index (the training pool uses it to step around a held-out
    instance) without moving any other."""
    F = REGISTRY[family]
    inst, tier = F.generate(Stream(family, split, index, retry))
    return row_of(F, inst, tier, "%s/%s/%d" % (family, split, index))


def row_of(F, inst, tier, task_id):
    lo0, hi0 = F.start(inst)
    d0 = exact.decimals(hi0 - lo0)
    row = {"id": task_id, "family": F.id, "family_version": F.version, "tier": tier, "instance": inst,
           "key": F.key(inst), "lo0": frac_text(lo0), "hi0": frac_text(hi0), "d0": d0,
           "cap": F.cap, "limit_digits": len(str(F.limit)) - 1}
    row["prompt"] = render_prompt(row)
    return row


def render_prompt(row):
    F = REGISTRY[row["family"]]
    inst = row["instance"]
    L = row["limit_digits"]
    data = {"family": row["family"], "instance": inst, "lo0": row["lo0"], "hi0": row["hi0"], "d0": row["d0"],
            "cap": row["cap"], "limit": "10^%d" % L}
    return "\n".join([
        "BRACKET A CONSTANT (verify-gym, task %s)" % row["id"],
        "",
        F.statement(inst),
        "It is known that %s < x < %s." % (row["lo0"], row["hi0"]),
        "",
        "Give the tightest interval lo < x < hi you can, with rational endpoints.",
        "",
        "How it is graded, exactly (no floating point anywhere):",
        "- " + F.rule(inst),
        "- Each endpoint is an integer, a finite decimal, or a fraction p/q. In lowest terms its numerator and "
        "denominator must each be below 10^%d; an endpoint over that limit scores 0." % L,
        "- Both sides must hold: x > lo and x < hi. One wrong side, lo >= hi, or an unreadable answer scores 0.",
        "- Score: the certified decimals d = floor(-log10(hi - lo)), minus the %d the stated bracket already has, "
        "capped at %d, divided by %d. Repeating the stated bracket scores 0." % (row["d0"], row["cap"], row["cap"]),
        "",
        "End your reply with one JSON object, on its own line: " + FORMAT,
        "Data: " + json.dumps(data, sort_keys=True),
    ])


_OBJ = re.compile(r"\{[^{}]{0,4000}\}")


def _keep(s):
    return s


def parse(reply):
    """(lo_text, hi_text, None) or (None, None, why). The LAST JSON object with both keys is the answer; an earlier
    one is never graded, so writing several answers cannot hedge. Numbers are kept as their TEXT (a JSON number is
    never turned into a float): 1.4142 is read as 14142/10000, exactly."""
    if not isinstance(reply, str) or not reply.strip():
        return None, None, "empty reply"
    found = None
    for m in _OBJ.finditer(reply):
        try:
            o = json.loads(m.group(0), parse_float=_keep, parse_int=_keep,
                           parse_constant=lambda c: None)
        except ValueError:
            continue
        if isinstance(o, dict) and "lo" in o and "hi" in o:
            found = o
    if found is None:
        return None, None, "no JSON object with lo and hi"
    lo, hi = found["lo"], found["hi"]
    if not (isinstance(lo, str) and isinstance(hi, str)):
        return None, None, "lo and hi must be numbers or strings"
    return lo, hi, None


def grade(row, reply):
    """The whole decision on a reply to a row."""
    lo, hi, why = parse(reply)
    if lo is None:
        return {"verdict": exact.MALFORMED, "sides": [None, None], "decimals": 0, "progress": 0, "reward": 0.0,
                "note": why, "lo": None, "hi": None}
    F = REGISTRY[row["family"]]
    out = exact.grade_endpoints(row["family"], row["instance"], lo, hi, F.limit, row["cap"], row["d0"])
    out["lo"], out["hi"] = lo, hi
    return out
