"""The framework-free surface of certified-mathbench: the ladder, the prompts, the exact grader, the forgery gate.

Everything a consumer needs is here and imports only the standard library. `verifiers` is a delivery mechanism
for the decision (adapters_v0.py) and nothing more; the eval harness in cert-machine (tools/run-mathbench.py) and
the Hub share THIS grader, so a reward here and a row in certs/mathbench-ledger.jsonl are the same decision.

THE GRADER IS THE SEVEN FAMILIES of cert-machine's instruments/mathbench/families.py, unchanged: the wheel carries
a byte-identical copy (force-included at build), a source tree resolves the repository's file, and the battery
pins both by sha256. No float decides a reward, there is no answer key and no judge: an object is CERTIFIED when
its defining property holds in integer or exact rational arithmetic (or a rigorous decimal interval for the
entropy family), and every rung's forgeries must refute before a prompt is served (`preflight`).
"""
from __future__ import annotations

import json
import os
import random
import sys
from typing import Any, Dict, List, Optional

ENV_ID = "certified-mathbench"

_BENCH: Optional[Dict[str, Any]] = None


def _bench() -> Dict[str, Any]:
    """The seven families, instantiated once. A wheel carries `families.py`, `llm_harness_base.py` and `verify_sumdiff.py` beside this
    file; a source tree reads them from the repository (instruments/mathbench, tools). ONE copy is ever read."""
    global _BENCH
    if _BENCH is not None:
        return _BENCH
    pkg = os.path.dirname(os.path.abspath(__file__))
    if os.path.exists(os.path.join(pkg, "families.py")):
        paths = [pkg]
    else:
        root = os.path.abspath(os.path.join(pkg, "..", "..", ".."))
        paths = [os.path.join(root, "instruments", "mathbench"), os.path.join(root, "tools")]
    for p in reversed(paths):
        if p not in sys.path:
            sys.path.insert(0, p)
    import families as _fam  # noqa: E402  (cert-machine's instruments/mathbench/families.py, byte-identical)
    _BENCH = {name: cls() for name, cls in _fam.BENCH.items()}
    return _BENCH


def families_source() -> str:
    """The path of the families file actually read — the pin the battery hashes."""
    _bench()
    import families as _fam  # noqa: E402
    return os.path.abspath(_fam.__file__)


# --- the ladder --------------------------------------------------------------------------------------------------
# One rung per (family, target), in the families' own order: the dataset of this environment. There is nothing
# procedural to mint and nothing to hold out — the ladder IS the set — and nothing to leak, because the reward is a
# proof about the object the model returns, not a match against a stored answer.
# `beyond`: the rung past the published record, where a certified object would be a NEW RESULT. The README says
# what happens then (a second implementation re-decides it before anything is announced).
BEYOND = {("capset", (7, 237)), ("code", (10, 3, 73)), ("ramsey", (4, 6, 36)), ("sumdiff3b", "1.7789889"), ("kissing", (5, 41))}


def _tjson(t: Any) -> str:
    return json.dumps(t if isinstance(t, str) else list(t))


def _tload(s: str) -> Any:
    t = json.loads(s)
    return t if isinstance(t, str) else tuple(t)


def rungs() -> List[Dict[str, Any]]:
    out = []
    for name, f in _bench().items():
        for t in f.LADDER:
            out.append({"family": name, "target": _tjson(t), "label": f"{name} {t}", "beyond": (name, t) in BEYOND})
    return out


def task_row(rung_index: int) -> Dict[str, Any]:
    """One rung as a task: the prompt the model is shown and the info that re-identifies the rung at scoring."""
    R = rungs()
    r = dict(R[rung_index % len(R)])
    f = _bench()[r["family"]]
    r["rung_index"] = rung_index % len(R)
    r["prompt"] = f.prompt(_tload(r["target"]))
    return r


def sample(n: int, seed: int, start: int = 0) -> List[Dict[str, Any]]:
    """`n` tasks: the ladder in a seed-permuted order, cycled. The seed permutes ORDER only — there is one ladder."""
    R = len(rungs())
    order = list(range(R))
    random.Random(seed).shuffle(order)
    return [task_row(order[(start + i) % R]) for i in range(n)]


# --- the grader -----------------------------------------------------------------------------------------------------
OUTCOMES = ("certified", "refuted", "rejected", "malformed")


def grade_object(family: str, target: Any, obj: Any) -> Dict[str, Any]:
    """Decide a parsed object at a rung. `rejected`: the object is not of the rung's shape (too few vectors, the
    wrong length) and was never submitted to the certifier; `refuted`: it was, and the certificate fails."""
    f = _bench()[family]
    t = _tload(target) if isinstance(target, str) and target[:1] in "[\"" else target
    if not f.interesting(obj, t):
        return {"outcome": "rejected", "certified": 0.0, "witness": None, "statement": f.statement(obj, t), "certificate": None}
    v = f.certify(obj, t)
    if v is None:
        return {"outcome": "refuted", "certified": 0.0, "witness": "undecided", "statement": f.statement(obj, t), "certificate": None}
    return {"outcome": "certified" if v.holds else "refuted", "certified": 1.0 if v.holds else 0.0,
            "witness": v.witness, "statement": f.statement(obj, t), "certificate": v.certificate}


def grade(family: str, target: str, reply: str) -> Dict[str, Any]:
    """Decide a model's reply at a rung. A reply with no object the family's parser accepts is `malformed`,
    kept apart from a wrong object so an unreadable answer is never counted as a refuted one."""
    f = _bench()[family]
    obj = f.parse(reply or "")
    if obj is None:
        return {"outcome": "malformed", "certified": 0.0, "witness": None, "statement": None, "certificate": None}
    return grade_object(family, target, obj)


def score(rung_index: int, reply: str) -> Dict[str, Any]:
    r = task_row(rung_index)
    g = grade(r["family"], r["target"], reply)
    g.update({"rung_index": r["rung_index"], "family": r["family"], "target": r["target"], "beyond": r["beyond"]})
    return g


# --- the gate -------------------------------------------------------------------------------------------------------
def preflight() -> Dict[str, Any]:
    """Every rung's GREEN controls (a witness on record) must certify and every RED control (a near-miss forged
    from a witness) must refute, before any prompt is served. Raises on the first family that fails: a family
    whose forgeries do not all refute is not admitted."""
    green = red = 0
    failed = []
    for name, f in _bench().items():
        for t in f.LADDER:
            for g in f.green_controls(t):
                green += 1
                if grade_object(name, t, g)["outcome"] != "certified":
                    failed.append(f"green {name} {t}")
            for r in f.red_controls(t):
                red += 1
                if grade_object(name, t, r)["outcome"] == "certified":
                    failed.append(f"red {name} {t}")
    if failed:
        raise RuntimeError("certified-mathbench preflight FAILED: " + ", ".join(failed))
    return {"green": green, "red": red, "failed": failed}


# --- the reference policy -------------------------------------------------------------------------------------------------
def baseline_table() -> List[Dict[str, Any]]:
    """The dumb baseline of each family (the textbook first try), decided rung by rung with no model and no key.
    A rung the baseline certifies measures nothing about a model."""
    out = []
    for r in rungs():
        f = _bench()[r["family"]]
        t = _tload(r["target"])
        g = grade_object(r["family"], t, f.baseline(t))
        out.append({"label": r["label"], "beyond": r["beyond"], "outcome": g["outcome"], "witness": g["witness"]})
    return out
