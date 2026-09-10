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
from .taskset import INFINITE, RUNGS, Task, Taskset, grade

ENV_ID = "lattice-claims"

__all__ = ["ENV_ID", "INFINITE", "RUNGS", "parse_reply", "task_row", "sample",
           "score", "score_task", "preflight"]


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


def task_row(seed: int, index: int) -> Dict[str, Any]:
    """One task as serialisable data. NOTE what is absent from the prompt: the
    rung. Naming it would hand over the answer on the underspecified tasks —
    noticing that something is missing is the whole test.

    `seed` and `index` are the whole of the state: `Taskset(seed).sample(index)`
    is a pure function of the pair, so a submission is scored against the task it
    was generated from and never against one rebuilt from a description of it.
    """
    t = Taskset(seed=seed).sample(index)
    return {
        "seed": seed,
        "index": index,
        "task_id": t.id,
        "prompt": t.prompt(),
        "rung": t.data.rung,
        "truth": t._truth,
        "n": t.data.lattice.get("n"),
        "missing": t.data.missing,
    }


def sample(num_tasks: int, seed: int = 0, start: int = 0) -> List[Dict[str, Any]]:
    """A finite draw. `num_tasks` bounds the SAMPLE, never the set: the generator
    is procedural and endless (`INFINITE` is True), so a larger number is a longer
    draw from the same distribution rather than a different one."""
    return [task_row(seed, i) for i in range(start, start + num_tasks)]


def score(seed: int, index: int, reply: str) -> Dict[str, Any]:
    """The whole reward, from a seed, an index and a reply.

    Three numbers, kept apart on purpose. `certified` is what trains: 1 when the
    verdict matches what the exact grader decided. `well_formed` is 0 when the
    reply named no reference, or named one the task did not state — because A
    RIGHT VERDICT REACHED FROM THE WRONG REFERENCE IS NOT RIGHT, which is the
    whole thesis of this environment. `not_hacked` catches a submission that
    smuggles the answer in rather than deciding it.
    """
    return score_task(Taskset(seed=seed).sample(index), reply)


def score_task(t: Task, reply) -> Dict[str, Any]:
    sub = parse_reply(reply) if isinstance(reply, str) else reply
    if sub is None:
        return {"certified": 0.0, "well_formed": 0.0, "not_hacked": 0.0,
                "why": "no JSON object carrying a verdict", "verdict": None}
    g = dict(grade(t, sub))
    g["verdict"] = sub.get("verdict")
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
