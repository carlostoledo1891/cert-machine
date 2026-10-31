"""The verifiers v0 adapter: `load_environment`, the entry point `vf.load_environment("verify-gym")` resolves.

Two rules hold this file to the framework's edge, as in break-the-grader:
  1. Nothing else in verify_gym imports `verifiers`; the decider, the families and the curriculum are stdlib
     (tests/test_framework_free.py blocks the import and runs the gate anyway).
  2. The forgery gate runs at load time: an environment that cannot refuse a planted answer has no business
     producing a number.

The rows carry only the task id in `info`; scoring rebuilds the row from the id (generated for train and val, read
from the hashed file for the held-out set), so a reply can never be scored against a task it was not given, nor
against anything a caller put in `info` besides the id.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from .api import ENV_ID, heldout, preflight, score, train_sample


def _content_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(part.get("text") or "" if isinstance(part, dict) else getattr(part, "text", "") or ""
                       for part in content)
    return ""


def _field(message, name):
    """A field from a mapping OR a message object: the framework hands scoring pydantic messages, and a `.get()`
    that silently misses would read every reply as unparseable (break-the-grader's silent defect)."""
    if isinstance(message, dict):
        return message.get(name)
    return getattr(message, name, None)


def _reply_text(completion) -> str:
    if isinstance(completion, str):
        return completion
    if isinstance(completion, list):
        msgs = [m for m in completion if _field(m, "role") == "assistant"]
        return _content_text(_field(msgs[-1], "content")) if msgs else ""
    return ""


def _decide(completion, info) -> Dict[str, Any]:
    return score(str(info["task_id"]), _reply_text(completion))


def _rows(rows) -> List[Dict[str, Any]]:
    """No `task` column of type str (verifiers 0.2.0 refuses it); `answer` is empty because there is none."""
    return [{"question": r["prompt"], "answer": "",
             "info": {"task_id": r["id"], "env_id": ENV_ID, "family": r["family"], "tier": r["tier"]}}
            for r in rows]


def load_environment(num_tasks: int = 300, start: int = 0, stage: str = "v0",
                     eval_split: str = "heldout", eval_num_tasks: Optional[int] = None, **kwargs):
    """A `SingleTurnEnv`: the training stage's rows, and the frozen held-out set (or the val stream) for eval.

    `num_tasks` bounds the SAMPLE: each family's stream is endless, so a larger number is a longer draw from the
    same distribution. The held-out set is 120 frozen tasks; `eval_split="val"` gives the validation stream, the
    one a checkpoint is chosen on."""
    import verifiers as vf
    from datasets import Dataset

    preflight()

    if eval_split == "heldout":
        ev = heldout("v0")
        if eval_num_tasks is not None:
            ev = ev[:eval_num_tasks]
    else:
        from .api import family_pool_row, curriculum
        n = eval_num_tasks or 60
        fams = [f["id"] for f in curriculum()["families"]]
        ev = [family_pool_row(f, "val", i) for i in range(n) for f in fams]

    def reward(completion, info, **_) -> float:
        """progress / cap: certified decimals beyond the stated bracket, capped; 0 unless both sides are CERTIFIED."""
        return float(_decide(completion, info)["reward"])

    def certified_decimals(completion, info, **_) -> float:
        return float(_decide(completion, info)["decimals"])

    def certified(completion, info, **_) -> float:
        return 1.0 if _decide(completion, info)["verdict"] == "CERTIFIED" else 0.0

    def refuted(completion, info, **_) -> float:
        """A false bracket: the failure the ship criterion bounds, counted on its own."""
        return 1.0 if _decide(completion, info)["verdict"] == "REFUTED" else 0.0

    def malformed(completion, info, **_) -> float:
        return 1.0 if _decide(completion, info)["verdict"] == "MALFORMED" else 0.0

    rubric = vf.Rubric(funcs=[reward, certified_decimals, certified, refuted, malformed],
                       weights=[1.0, 0.0, 0.0, 0.0, 0.0])
    return vf.SingleTurnEnv(dataset=Dataset.from_list(_rows(train_sample(num_tasks, start, stage))),
                            eval_dataset=Dataset.from_list(_rows(ev)), rubric=rubric, **kwargs)
