"""The verifiers adapter — `load_environment`, the entry point the Hub calls.

VERIFIED against a live `verifiers` install and then run against live models, not
written from a doc. The version it was exercised on is in TESTED_AGAINST below
and re-checked by `tests/test_verifiers_binding.py`, which SKIPS rather than
guesses when `verifiers` is absent.

The three defects a doc-written binding produced in the first environment of this
family, two of them silent, are each designed out here and each has a test:

  1. `load_environment` was never exported from `__init__`, so the Hub's own
     command would have raised on arrival. Here `__init__.__getattr__` resolves
     it lazily and the binding test imports it by that path.
  2. A plain-string `task` column aborts every rollout. There is no `task` column;
     routing rides in `info["env_id"]`.
  3. Scoring is handed a list of PYDANTIC MESSAGE OBJECTS, not dicts, so a
     `.get("content")` misses on every one and a whole eval prints 0.000 with no
     error raised. `_field` reads either shape.

And one the sibling environment found only by installing its wheel: nothing in
this package may depend on where it is installed. This one is stdlib-only with no
external tools and no data files outside the package, so it has no such surface —
but the rule is why `tests/test_framework_free.py` exists.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from .api import ENV_ID, preflight, sample, score

TESTED_AGAINST = "0.3.1"


def _content_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            part.get("text") or "" if isinstance(part, dict) else getattr(part, "text", "") or ""
            for part in content
        )
    return ""


def _field(message, name):
    """A message field from either a mapping or a model object. See defect 3."""
    if isinstance(message, dict):
        return message.get(name)
    return getattr(message, name, None)


def _reply_text(completion) -> str:
    if isinstance(completion, str):
        return completion
    if isinstance(completion, list):
        return "".join(
            _content_text(_field(m, "content"))
            for m in completion
            if _field(m, "role") == "assistant"
        )
    return ""


def _decide(completion, info) -> Dict[str, Any]:
    """One line, so the framework layer owns no scoring of its own: `api.score`
    rebuilds the task from (seed, index) and decides the reply exactly."""
    return score(int(info["seed"]), int(info["index"]), _reply_text(completion))


def _dataset_rows(num_tasks: int, seed: int, start: int) -> List[Dict[str, Any]]:
    """`api.sample` rows in the column shape the framework wants.

    `answer` is the empty string because the framework asks for the column, not
    because there is one: this environment DECIDES submissions in exact rational
    arithmetic rather than matching them, so there is no reference string and
    nothing to leak. See defect 2 for the missing `task` column.
    """
    out = []
    for row in sample(num_tasks, seed, start):
        info = dict(row)
        info["env_id"] = ENV_ID
        out.append({"question": info.pop("prompt"), "answer": "", "info": info})
    return out


def load_environment(
    num_tasks: int = 120,
    seed: int = 2026,
    start: int = 0,
    eval_num_tasks: Optional[int] = None,
    eval_seed: Optional[int] = None,
    eval_start: Optional[int] = None,
    **kwargs,
):
    """A `SingleTurnEnv` over the procedural generator.

    The taskset is ENDLESS: instances are minted from a seed, so `num_tasks`
    bounds the sample and never the set. Train and eval are disjoint by TASKSET
    SEED rather than by index, because the index chooses the rung — it cycles
    declared / printed / underspecified — and splitting on index would hand the
    two halves different rung mixtures.
    """
    import verifiers as vf
    from datasets import Dataset

    preflight()          # the forgery gate, before anything a model could be scored against

    eval_num_tasks = num_tasks if eval_num_tasks is None else eval_num_tasks
    eval_seed = seed + 1 if eval_seed is None else eval_seed
    eval_start = start if eval_start is None else eval_start

    def reward(completion, info, **_) -> float:
        """1 when the verdict matches what the exact grader decided. This is what
        trains, and it is deliberately NOT the only thing measured."""
        return float(_decide(completion, info)["certified"])

    def well_formed(completion, info, **_) -> float:
        """1 only when the reply declared the reference it decided against AND
        that reference is what the task stated. A RIGHT VERDICT REACHED FROM THE
        WRONG REFERENCE IS NOT RIGHT — the environment exists because a bit-exact
        grader once reported 32 of 37 published records as wrong by comparing
        against a quantity the claims were not about."""
        return float(_decide(completion, info)["well_formed"])

    def not_hacked(completion, info, **_) -> float:
        """0 when the submission smuggled the answer in rather than deciding it."""
        return float(_decide(completion, info)["not_hacked"])

    def refused_parse(completion, info, **_) -> float:
        """1 when no readable verdict came back. Kept apart from `reward` so a
        reply that could not be read is never confused with a wrong answer."""
        return 1.0 if _decide(completion, info)["verdict"] is None else 0.0

    rubric = vf.Rubric(
        funcs=[reward, well_formed, not_hacked, refused_parse],
        weights=[1.0, 0.0, 0.0, 0.0],
    )
    return vf.SingleTurnEnv(
        dataset=Dataset.from_list(_dataset_rows(num_tasks, seed, start)),
        eval_dataset=Dataset.from_list(_dataset_rows(eval_num_tasks, eval_seed, eval_start)),
        rubric=rubric,
        **kwargs,
    )
