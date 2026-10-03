"""The verifiers adapter — `load_environment`, the entry point the Hub calls.

Written against a live `verifiers` install (TESTED_AGAINST) and exercised by tests/test_verifiers_binding.py, which
SKIPS rather than guesses when the framework is absent. The three defects the first environment of this family
produced from a doc-written binding are designed out here, as in its siblings: `load_environment` is exported
(lazily, from `__init__`); there is no plain-string `task` column (routing rides in `info`); scoring reads pydantic
message objects as well as dicts (`_field`), because a `.get("content")` on a model object misses silently and a
whole eval prints 0.000 with no error raised.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from .api import ENV_ID, preflight, rungs, sample, score

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
    if isinstance(message, dict):
        return message.get(name)
    return getattr(message, name, None)


def _reply_text(completion) -> str:
    if isinstance(completion, str):
        return completion
    if isinstance(completion, list):
        return "".join(_content_text(_field(m, "content")) for m in completion if _field(m, "role") == "assistant")
    return ""


def _decide(completion, info) -> Dict[str, Any]:
    """One line, so the framework layer owns no scoring of its own."""
    return score(int(info["rung_index"]), _reply_text(completion))


def _rows(num_tasks: int, seed: int, start: int) -> List[Dict[str, Any]]:
    out = []
    for r in sample(num_tasks, seed, start):
        info = {"env_id": ENV_ID, "rung_index": r["rung_index"], "family": r["family"], "target": r["target"],
                "label": r["label"], "beyond": r["beyond"]}
        out.append({"question": r["prompt"], "answer": "", "info": info})
    return out


def load_environment(
    num_tasks: Optional[int] = None,
    seed: int = 2026,
    start: int = 0,
    eval_num_tasks: Optional[int] = None,
    eval_seed: Optional[int] = None,
    **kwargs,
):
    """A `SingleTurnEnv` over the ladder. The ladder is finite (46 rungs) and IS the dataset: `num_tasks` defaults
    to its length, a larger value cycles it, and the eval split is the same ladder in another order — there is
    nothing to hold out, because there is nothing to leak: the reward is a proof about the returned object."""
    import verifiers as vf
    from datasets import Dataset

    preflight()          # the forgery gate, before anything a model could be scored against
    R = len(rungs())
    num_tasks = R if num_tasks is None else num_tasks
    eval_num_tasks = num_tasks if eval_num_tasks is None else eval_num_tasks
    eval_seed = seed + 1 if eval_seed is None else eval_seed

    def reward(completion, info, **_) -> float:
        """1 exactly when the returned object is CERTIFIED at its rung. This is what trains."""
        return float(_decide(completion, info)["certified"])

    def refuted(completion, info, **_) -> float:
        """An object of the right shape whose certificate fails: a wrong answer, as distinct from no answer."""
        return 1.0 if _decide(completion, info)["outcome"] == "refuted" else 0.0

    def rejected(completion, info, **_) -> float:
        """An object parsed but not of the rung's shape (too few vectors, the wrong length); never certified."""
        return 1.0 if _decide(completion, info)["outcome"] == "rejected" else 0.0

    def malformed(completion, info, **_) -> float:
        """No object the family's parser accepts. Kept apart so an unreadable reply is never a wrong one."""
        return 1.0 if _decide(completion, info)["outcome"] == "malformed" else 0.0

    rubric = vf.Rubric(funcs=[reward, refuted, rejected, malformed], weights=[1.0, 0.0, 0.0, 0.0])
    return vf.SingleTurnEnv(
        dataset=Dataset.from_list(_rows(num_tasks, seed, start)),
        eval_dataset=Dataset.from_list(_rows(eval_num_tasks, eval_seed, start)),
        rubric=rubric,
        **kwargs,
    )
