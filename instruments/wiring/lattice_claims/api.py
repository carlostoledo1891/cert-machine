"""The framework-free programmatic API: rows in, decisions out.

The module every consumer shares — the eval runner, the framework adapter and
the battery. A row shape or a scoring rule defined twice will diverge, so it is
defined once, here, and imported. `parse_reply` in particular lived in
`eval/run_models.py`, where the adapter could not reach it; it moved here on the
port so THE PARSER THAT READS A MODEL'S REPLY DURING TRAINING IS THE ONE THAT
GRADED THE 135 RECORDED ROLLOUTS, and the battery re-grades them from their
stored raws every build.

Nothing here imports anything outside the standard library. `verifiers` is
touched only by `adapters_v0`, imported lazily, so `import lattice_claims` stays
a stdlib import and `tests/test_framework_free.py` can prove it by blocking
every third-party import.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

from .forgeries import run as _run_forgeries
from .taskset import (ABSTAIN, DEFAULT_DIMS, DEFAULT_MIX, DEFINITE, GRADERS,
                      INFINITE, RUNGS, Task, Taskset, grade, grade_key, grade_ternary)

ENV_ID = "lattice-claims"

__all__ = ["ENV_ID", "INFINITE", "RUNGS", "GRADERS", "parse_reply", "task_row",
           "sample", "score", "score_task", "preflight", "make_taskset"]


def make_taskset(seed: int, dims=None, mix=None) -> Taskset:
    """THE ONE PLACE a task's identity is turned back into a generator.

    A task is (seed, index, dims, mix). The last two default to the 0.1.0 values,
    so every stored (seed, index) -- the 135 direct rollouts, the 72 through the
    framework -- still names the task it named when it was graded."""
    return Taskset(seed=seed,
                   dims=tuple(dims) if dims else DEFAULT_DIMS,
                   mix=tuple(mix) if mix else DEFAULT_MIX)


def parse_reply(txt: str) -> Optional[Dict[str, Any]]:
    """The last JSON object in the reply that carries a verdict.

    Moved here from eval/run_models.py unchanged. Models wrap answers in prose
    and fences; taking the LAST object lets a model show a candidate and then
    correct it, which is what the recorded runs actually do.
    """
    best = None
    for m in re.finditer(r"\{(?:[^{}]|\{[^{}]*\})*\}", txt, re.S):
        try:
            d = json.loads(m.group(0))
        except Exception:
            continue
        if isinstance(d, dict) and "verdict" in d:
            best = d
    return best


def task_row(seed: int, index: int, dims=None, mix=None) -> Dict[str, Any]:
    """One task as serialisable data. NOTE what is absent from the prompt: the
    rung. Naming it would hand over the answer on the underspecified tasks —
    noticing that something is missing is the whole test.

    `seed`, `index`, `dims` and `mix` are the whole of the state: `make_taskset(seed,
    dims, mix).sample(index)` is a pure function of them, so a submission is
    scored against the task it was generated from and never against one rebuilt
    from a description of it. The row carries all four for that reason.
    """
    ts = make_taskset(seed, dims, mix)
    t = ts.sample(index)
    return {
        "seed": seed,
        "index": index,
        "dims": list(ts.dims),
        "mix": list(ts.mix),
        "task_id": t.id,
        "prompt": t.prompt(),
        "rung": t.data.rung,
        "truth": t._truth,
        "n": t.data.lattice.get("n"),
        "missing": t.data.missing,
    }


def sample(num_tasks: int, seed: int = 0, start: int = 0, dims=None, mix=None) -> List[Dict[str, Any]]:
    """A finite draw. `num_tasks` bounds the SAMPLE, never the set: the generator
    is procedural and endless (`INFINITE` is True), so a larger number is a longer
    draw from the same distribution rather than a different one."""
    return [task_row(seed, i, dims, mix) for i in range(start, start + num_tasks)]


def score(seed: int, index: int, reply: str, dims=None, mix=None) -> Dict[str, Any]:
    """The whole reward, from a task's identity and a reply.

    The numbers are kept apart on purpose. `certified` is the exact grader: 1
    when the verdict matches what was decided. `key_match` is the answer key: 1
    when a DEFINITE verdict matches the complete instance's -- the control arm,
    under which an abstention never scores. Both are computed on every reply, so
    a run trained on either is measured by both.

    `well_formed` is 0 when the reply named no reference, or named one the task
    did not state -- because A RIGHT VERDICT REACHED FROM THE WRONG REFERENCE IS
    NOT RIGHT. `not_hacked` is the float canary. `abstained` (STRADDLES or
    NEEDS_DATA) and `confident_wrong` (a definite verdict the exact grader
    refutes) are what a guessing-versus-abstaining comparison reads.
    """
    return score_task(make_taskset(seed, dims, mix).sample(index), reply)


def score_task(t: Task, reply) -> Dict[str, Any]:
    """Every number, under every grader, for one reply. `due` is a property of the TASK (its
    decided answer is an abstention); `abstained_due` and `abstained_not_due` split the
    abstentions by it, so a batch mean of each over a batch mean of `due` is the abstention
    rate where abstaining is right and where it is not -- the split a single `abstained`
    cannot give, and that stored samples cannot either (a service may keep only samples that
    carried a gradient)."""
    due = 1.0 if t._truth in ABSTAIN else 0.0
    sub = parse_reply(reply) if isinstance(reply, str) else reply
    if sub is None:
        return {"certified": 0.0, "key_match": 0.0, "ternary": grade_ternary(t, None),
                "well_formed": 0.0, "not_hacked": 0.0,
                "abstained": 0.0, "confident_wrong": 0.0,
                "due": due, "abstained_due": 0.0, "abstained_not_due": 0.0,
                "why": "no JSON object carrying a verdict", "verdict": None}
    g = dict(grade(t, sub))
    v = sub.get("verdict")
    g["verdict"] = v
    g["key_match"] = grade_key(t, sub)
    g["ternary"] = grade_ternary(t, sub)
    g["abstained"] = 1.0 if v in ABSTAIN else 0.0
    g["confident_wrong"] = 1.0 if (v in DEFINITE and g["certified"] == 0.0) else 0.0
    g["due"] = due
    g["abstained_due"] = g["abstained"] * due
    g["abstained_not_due"] = g["abstained"] * (1.0 - due)
    return g


def preflight() -> Dict[str, Any]:
    """The ten planted forgeries, before anything a model could be scored against.

    Each one is a way a grader can be fooled — the rounded norm that does not
    determine the claim, the overflow canary, the zero vector that satisfies the
    inequality and is not a solution, the gap named in the model's own schema.
    A grader that accepts any of them has no business producing a number.
    """
    rows, accepted = _run_forgeries()
    if accepted:
        raise RuntimeError(
            f"lattice-claims: the forgery gate accepted {len(accepted)} of {len(rows)} "
            f"planted submissions — refusing to run. {accepted[:2]}")
    return {"planted": len(rows), "accepted": len(accepted)}
