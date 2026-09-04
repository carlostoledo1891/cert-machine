"""The forgery battery: submissions that MUST NOT score, planted before any
model is called.

The rule is the one the lab runs everywhere else. A grader that has never been
shown to reject something is consistent with being correct and equally
consistent with testing nothing, so every run begins by trying to fool it on
purpose. If a single forgery scores, the run aborts before it touches real work:
a number produced after that point would be worthless, and worse, believable.

These live in the test suite as well, so the Hub's own CI re-runs them on every
push and the soundness claim is re-checked by somebody else's machine.
"""
from __future__ import annotations

import math
from fractions import Fraction
from typing import List, Tuple

from .task import Task, grade, make_task


def forgeries_for(task: Task) -> List[Tuple[dict, str]]:
    """Every entry must fail to score +1 on this task."""
    mid = float(task.fact.midpoint)
    out: List[Tuple[dict, str]] = [
        ({"attack": mid}, "the true value submitted as an attack"),
        ({"attack": mid + 1e6}, "a wildly wrong value the grader rejects"),
        ({"attack": float(task.fact.lo)}, "an endpoint of the certificate — inside, not outside"),
        ({"attack": float(task.fact.hi)}, "the other endpoint"),
    ]
    if task.attackable:
        out.append(({"verdict": "NO_ATTACK"}, "NO_ATTACK on a breakable grader"))
    if task.witness is not None:
        # The near-miss a float pipeline actually emits: a value one ulp INSIDE
        # the boundary the witness sits outside. Computed, not searched — the
        # first version walked ulp by ulp from the witness toward the midpoint,
        # which on a wide rung is ten million steps and hangs. A forgery that
        # takes longer than the thing it guards is a forgery nobody will run.
        end = task.fact.hi if Fraction(task.witness) > task.fact.hi else task.fact.lo
        inward = math.nextafter(float(end), mid)
        if task.fact.lo <= Fraction(inward) <= task.fact.hi:
            out.append(({"attack": inward}, "one ulp inside the boundary the witness cleared"))
    return out


def gate(seeds=range(64)) -> dict:
    """Run the battery. `ok` false means nothing downstream may be reported."""
    planted = leaked = 0
    failures = []
    for s in seeds:
        task = make_task(s)
        for sub, why in forgeries_for(task):
            planted += 1
            g = grade(task, sub)
            if g["score"] >= 1:
                leaked += 1
                failures.append({"seed": s, "why": why, "verdict": g["verdict"], "note": g["note"]})
    return {"planted": planted, "leaked": leaked, "ok": leaked == 0, "failures": failures}
