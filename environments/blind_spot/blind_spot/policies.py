"""Reference policies.  Each reads only what the prompt shows; each is graded
by the same simulation a model is.  They are the floor and the ceiling of the
table, and they cost nothing.

    abstain    UNDECIDED always.                                      0
    never      EQUIVALENT always -- "nothing to see".  Right on the equivalent
               class, -1 everywhere else.
    random8    eight uniform in-box pairs.  What a random testbench sees.
    corpus8    eight pairs from the 14.95M-pair certified corpus.  The
               published blindness, as a policy.
    mint8 / outbox8 / aligned8   eight from one constructed family each.
    union8     two from each of the four families.
    profile    reads the profile rung: EQUIVALENT if no family killed it,
               else eight pairs from the first family that did.  Elsewhere it
               is union8.  This is the method that took the core's 31
               survivors to zero, run as a policy.
    sat        the SAT witness, or EQUIVALENT by proof.  The ceiling, and
               published on purpose.
"""
import random

from . import families
from .design import CMAX, D, FAMILIES
from .taskset import EQUIVALENT, KILL, UNDECIDED

__all__ = ["POLICIES", "submit"]


def _rng(task, name):
    return random.Random(f"{task.id}:{name}")


def _pairs(fam, n, rng):
    pool = families.load(fam)
    return [{"u": list(u), "v": list(v)} for u, v in rng.sample(pool, n)]


def abstain(task):
    return {"verdict": UNDECIDED}


def never(task):
    return {"verdict": EQUIVALENT}


def random8(task):
    rng = _rng(task, "random8")
    return {"verdict": KILL, "pairs": [{"u": [rng.randint(-CMAX, CMAX) for _ in range(D)],
                                        "v": [rng.randint(-CMAX, CMAX) for _ in range(D)]} for _ in range(8)]}


def _family8(fam):
    def pol(task):
        return {"verdict": KILL, "pairs": _pairs(fam, 8, _rng(task, fam))}
    pol.__name__ = fam + "8"
    return pol


def union8(task):
    rng = _rng(task, "union8")
    ps = []
    for f in FAMILIES:
        ps += _pairs(f, 2, rng)
    return {"verdict": KILL, "pairs": ps}


def profile(task):
    if task.rung != "profile":
        return union8(task)
    pr = task.mutant["profile"]
    seen = [f for f in FAMILIES if pr[f]]
    if not seen:
        return {"verdict": EQUIVALENT, "where": "no family sees it"}
    return {"verdict": KILL, "pairs": _pairs(seen[0], 8, _rng(task, "profile")), "where": seen[0]}


def sat(task):
    w = task.mutant["witness"]
    if w is None:
        return {"verdict": EQUIVALENT, "where": "the miter is unsatisfiable"}
    return {"verdict": KILL, "pairs": [{"u": w["u"], "v": w["v"]}], "where": "SAT counterexample"}


POLICIES = {"abstain": abstain, "never": never, "random8": random8,
            "corpus8": _family8("corpus"), "mint8": _family8("mint"),
            "outbox8": _family8("outbox"), "aligned8": _family8("aligned"),
            "union8": union8, "profile": profile, "sat": sat}


def submit(name, task):
    return POLICIES[name](task)
