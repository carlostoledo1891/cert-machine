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

from functools import lru_cache
from typing import Any, Dict, List, Optional

from .api import ENV_ID, GRADERS, preflight, sample, score

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
    """The framework layer owns no scoring of its own: `api.score`
    rebuilds the task from (seed, index, dims, mix) and decides the reply exactly.
    A row without dims or mix is a 0.1.0 row and means the 0.1.0 defaults."""
    dims, mix = info.get("dims"), info.get("mix")
    return dict(_decide_cached(int(info["seed"]), int(info["index"]),
                               tuple(dims) if dims else None, tuple(mix) if mix else None,
                               _reply_text(completion)))


@lru_cache(maxsize=4096)
def _decide_cached(seed, index, dims, mix, text) -> Dict[str, Any]:
    """The rubric asks for several numbers about the SAME reply, and each would
    otherwise re-mint the task (~0.1 s at the default dimensions). `score` is a
    pure function of these five arguments, so remembering it changes nothing but
    the time. Callers get a copy, so nothing they do can reach the cache."""
    return score(seed, index, text, dims, mix)


def _dataset_rows(num_tasks: int, seed: int, start: int, dims=None, mix=None) -> List[Dict[str, Any]]:
    """`api.sample` rows in the column shape the framework wants.

    `answer` is the empty string because the framework asks for the column, not
    because there is one: this environment DECIDES submissions in exact rational
    arithmetic rather than matching them, so there is no reference string and
    nothing to leak. See defect 2 for the missing `task` column.
    """
    out = []
    for row in sample(num_tasks, seed, start, dims, mix):
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
    grader: str = "exact",
    dims: Optional[List[int]] = None,
    mix: Optional[List[int]] = None,
    **kwargs,
):
    """A `SingleTurnEnv` over the procedural generator.

    The taskset is ENDLESS: instances are minted from a seed, so `num_tasks`
    bounds the sample and never the set. Train and eval are disjoint by TASKSET
    SEED rather than by index, because the index chooses the rung — it cycles
    declared / printed / underspecified — and splitting on index would hand the
    two halves different rung mixtures.

    `grader` chooses what TRAINS: "exact" (the default), "answer_key" (0.2.0: the
    binary key of the complete instance, under which an abstention never scores) or
    "ternary" (0.3.0: +1 decided-correct, 0 an abstention that is not due, -1 a
    refuted definite verdict or no readable verdict). Every other number is computed under both, at weight 0, so two runs
    that differ only in `grader` are read on the same columns. `dims` sets the
    lattice dimensions (default 24, 40, 60, 90; (8, 12, 16) keeps a prompt near
    1,500 characters) and `mix` weights the rungs as a deterministic cycle
    (default 1, 1, 1). Both ride in every row, so scoring rebuilds the same task.
    """
    import verifiers as vf
    from datasets import Dataset

    if grader not in GRADERS:
        raise ValueError(f"grader must be one of {GRADERS}, not {grader!r}")
    preflight()          # the forgery gate, before anything a model could be scored against

    eval_num_tasks = num_tasks if eval_num_tasks is None else eval_num_tasks
    eval_seed = seed + 1 if eval_seed is None else eval_seed
    eval_start = start if eval_start is None else eval_start
    trains_on = {"exact": "certified", "answer_key": "key_match", "ternary": "ternary"}[grader]

    def reward(completion, info, **_) -> float:
        """What trains: `certified` under the exact grader, `key_match` under the
        answer key. Deliberately NOT the only thing measured."""
        return float(_decide(completion, info)[trains_on])

    def certified(completion, info, **_) -> float:
        """The exact grader's verdict on the reply, whichever grader trains."""
        return float(_decide(completion, info)["certified"])

    def key_match(completion, info, **_) -> float:
        """The answer key's verdict on the reply, whichever grader trains."""
        return float(_decide(completion, info)["key_match"])

    def ternary(completion, info, **_) -> float:
        """+1 decided-correct, 0 an abstention that is not due, -1 a refuted definite verdict
        or no readable verdict -- whichever grader trains."""
        return float(_decide(completion, info)["ternary"])

    def due(completion, info, **_) -> float:
        """1 when the task's decided answer is an abstention (a property of the task)."""
        return float(_decide(completion, info)["due"])

    def abstained_due(completion, info, **_) -> float:
        """1 when the reply abstained on a task where abstaining is the decided answer."""
        return float(_decide(completion, info)["abstained_due"])

    def abstained_not_due(completion, info, **_) -> float:
        """1 when the reply abstained on a task whose answer is definite."""
        return float(_decide(completion, info)["abstained_not_due"])

    def abstained(completion, info, **_) -> float:
        """1 when the reply said STRADDLES or NEEDS_DATA."""
        return float(_decide(completion, info)["abstained"])

    def confident_wrong(completion, info, **_) -> float:
        """1 when the reply gave a definite verdict the exact grader refutes."""
        return float(_decide(completion, info)["confident_wrong"])

    def well_formed(completion, info, **_) -> float:
        """1 only when the reply declared the reference it decided against AND
        that reference is what the task stated. A RIGHT VERDICT REACHED FROM THE
        WRONG REFERENCE IS NOT RIGHT — the environment exists because a bit-exact
        grader once reported 32 of 37 published records as wrong by comparing
        against a quantity the claims were not about."""
        return float(_decide(completion, info)["well_formed"])

    def not_hacked(completion, info, **_) -> float:
        """0 when a float grader would have disagreed with the exact decision."""
        return float(_decide(completion, info)["not_hacked"])

    def refused_parse(completion, info, **_) -> float:
        """1 when no readable verdict came back. Kept apart from `reward` so a
        reply that could not be read is never confused with a wrong answer."""
        return 1.0 if _decide(completion, info)["verdict"] is None else 0.0

    funcs = [reward, certified, key_match, ternary, abstained, confident_wrong,
             due, abstained_due, abstained_not_due, well_formed, not_hacked, refused_parse]
    rubric = vf.Rubric(funcs=funcs, weights=[1.0] + [0.0] * (len(funcs) - 1))
    return vf.SingleTurnEnv(
        dataset=Dataset.from_list(_dataset_rows(num_tasks, seed, start, dims, mix)),
        eval_dataset=Dataset.from_list(_dataset_rows(eval_num_tasks, eval_seed, eval_start, dims, mix)),
        rubric=rubric,
        **kwargs,
    )
