"""Reference policies: what the environment scores before any model is called.

Each reads only what a model would be shown -- the task's public data -- and is
graded by the same `grade`.  They exist so the rung table has a floor and a
ceiling that cost nothing: a reader can see what always-ADMISSIBLE buys, what a
careful float grader buys, and what checking exactly buys, and then read a
model's row against those.

    exact      decide with the exact predicate; STRADDLES on a printed norm
               when the two ends of the half-unit window disagree; NEEDS_DATA
               when a required quantity is absent.  The ceiling, and published
               on purpose: this is a measurement of whether an answer checks,
               not a puzzle that is hard for a program.
    careful    the log-domain float grader.  Right on every real record we
               have checked, and it has no way to say STRADDLES or NEEDS_DATA,
               so its printed and underspecified rows are the cost of a grader
               that cannot abstain.
    admissible always ADMISSIBLE.  The base rate.
    refused    always REFUSED.
"""
from fractions import Fraction

from .certify.exact import decide, norm_sq
from .certify.naive import careful_float
from .taskset import NEEDS_DATA, STRADDLES

__all__ = ["POLICIES", "run_policy"]


# What a verdict needs, as the taskset removes them: the modulus, the factor,
# the acceptance relation, and a norm in either of the two forms it is stated.
NEEDED = ("lattice.q", "claim.factor", "conventions.relation", "claim.norm")


def _present(d, path):
    a, b = path.split(".")
    scope = d.as_dict().get(a, {})
    if path == "claim.norm":
        return "vector" in scope or "norm_printed" in scope
    return b in scope


def _norm_sq(data):
    if "vector" in data.claim:
        return norm_sq([int(c) for c in data.claim["vector"]])
    return None


def exact(task):
    d = task.data
    missing = [p for p in NEEDED if not _present(d, p)]
    if missing:
        return {"verdict": NEEDS_DATA, "missing": missing[0].split(".")[1]}
    n, q = d.lattice["n"], int(d.lattice["q"])
    f = Fraction(d.claim["factor"])
    ns = _norm_sq(d)
    if ns is not None:
        return {"verdict": decide(n, q, ns, f), "reference": {"norm_squared": ns, "factor": str(f)}}
    N = d.claim["norm_printed"]
    lo = decide(n, q, Fraction((2 * N - 1) ** 2, 4), f)
    hi = decide(n, q, Fraction((2 * N + 1) ** 2, 4), f)
    return {"verdict": lo if lo == hi else STRADDLES,
            "reference": {"norm_squared": None, "factor": str(f)}}


def careful(task):
    d = task.data
    if "q" not in d.lattice:
        return {"verdict": "ADMISSIBLE", "reference": {"norm_squared": _norm_sq(d), "factor": "21/20"}}
    n, q = d.lattice["n"], int(d.lattice["q"])
    ns = _norm_sq(d)
    nrm = (ns if ns is not None else d.claim["norm_printed"] ** 2) ** 0.5
    v = careful_float(n, q, nrm, float(Fraction(d.claim.get("factor", "21/20"))))
    return {"verdict": v, "reference": {"norm_squared": ns if ns is not None else d.claim["norm_printed"] ** 2,
                                        "factor": d.claim.get("factor", "21/20")}}


def admissible(task):
    return {"verdict": "ADMISSIBLE", "reference": {"norm_squared": _norm_sq(task.data), "factor": "21/20"}}


def refused(task):
    return {"verdict": "REFUSED", "reference": {"norm_squared": _norm_sq(task.data), "factor": "21/20"}}


POLICIES = {"exact": exact, "careful": careful, "admissible": admissible, "refused": refused}


def run_policy(name, tasks):
    from .taskset import grade
    pol = POLICIES[name]
    return [grade(t, pol(t)) for t in tasks]
