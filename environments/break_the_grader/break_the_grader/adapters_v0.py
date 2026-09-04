"""The verifiers v0 adapter — `load_environment`, the entry point the Hub calls.

VERIFIED: run against a live `verifiers` install, not written from a doc. The
version it was exercised on is recorded in TESTED_AGAINST below and re-checked
by `tests/test_verifiers_binding.py`, which is skipped rather than guessed at
when `verifiers` is absent.

Two rules hold this file to the framework's edge:

  1. Nothing in `break_the_grader` imports `verifiers` except this module and
     `adapters_v1`. The grader, the band geometry and the corpus are stdlib, and
     `tests/test_framework_free.py` proves it by blocking the import.
  2. The forgery battery runs at load time. An environment that cannot refuse a
     planted submission has no business producing a number, so `load_environment`
     raises before it hands back anything a model could be scored against.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from .api import ENV_ID, preflight, sample, score


def _content_text(content) -> str:
    """Text out of a message body, whatever shape it arrives in."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):                       # content parts
        return "".join(
            part.get("text") or "" if isinstance(part, dict) else getattr(part, "text", "") or ""
            for part in content
        )
    return ""


def _field(message, name):
    """A message field from either a mapping or a model object.

    Worth the four lines: the framework hands scoring a list of pydantic
    messages, not dicts, and a `.get()` that silently misses turns every reply
    into an unparseable one — a whole eval reading 0.000 with no error raised.
    That is exactly the failure a binding written from a doc cannot find.
    """
    if isinstance(message, dict):
        return message.get(name)
    return getattr(message, name, None)


def _reply_text(completion) -> str:
    """The assistant text out of any message shape the framework may hand us."""
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
    rebuilds the task from its seed and decides the reply exactly."""
    return score(int(info["seed"]), _reply_text(completion))


def _dataset_rows(num_tasks: int, start_seed: int) -> List[Dict[str, Any]]:
    """`api.sample` rows in the column shape the framework wants.

    `answer` is the empty string because the framework asks for the column, not
    because there is one: this environment decides submissions, it does not match
    them. Routing rides in `info["env_id"]` and there is no `task` column —
    verifiers 0.2.0 refuses a plain-string `task` outright ("Plain string task
    routes are no longer supported"), which is the kind of thing only a live
    install tells you.
    """
    out = []
    for row in sample(num_tasks, start_seed):
        info = dict(row)
        info["env_id"] = ENV_ID
        out.append({"question": info.pop("prompt"), "answer": "", "info": info})
    return out


def load_environment(
    num_tasks: int = 200,
    start_seed: int = 0,
    eval_num_tasks: Optional[int] = None,
    eval_start_seed: Optional[int] = None,
    **kwargs,
):
    """A `SingleTurnEnv` over the procedural generator.

    `num_tasks` only bounds the SAMPLE: the parameter space is continuous and the
    generator is endless, so a larger number is a longer draw from the same
    distribution rather than a different set. Train and eval are disjoint seed
    ranges by default, which is the only split that means anything here — there
    is no answer key to leak, but a shared seed range would still let a model
    memorise which rungs are impossible.
    """
    import verifiers as vf
    from datasets import Dataset

    preflight()          # the battery, before anything a model could be scored against

    eval_num_tasks = num_tasks if eval_num_tasks is None else eval_num_tasks
    eval_start_seed = (
        start_seed + num_tasks if eval_start_seed is None else eval_start_seed
    )

    def reward(completion, info, **_) -> float:
        """+1 a verified break or a correct refusal; -1 a false claim either way;
        0 a submission that could not be read. This is what trains."""
        return float(_decide(completion, info)["reward"])

    def solved(completion, info, **_) -> float:
        """The same decision in [0, 1], for a leaderboard that wants a rate."""
        return 1.0 if _decide(completion, info)["reward"] >= 1.0 else 0.0

    def well_formed(completion, info, **_) -> float:
        """0 when the reply could not be parsed at all. Kept apart from `reward`
        so a refusal to answer is never confused with a wrong answer."""
        return 0.0 if _decide(completion, info)["verdict"] == "REFUSED_PARSE" else 1.0

    def false_claim(completion, info, **_) -> float:
        """1 when the model asserted something the certificate refutes. This is
        the failure the environment exists to punish, counted on its own."""
        return 1.0 if _decide(completion, info)["verdict"] == "WRONG" else 0.0

    rubric = vf.Rubric(
        funcs=[reward, solved, well_formed, false_claim],
        weights=[1.0, 0.0, 0.0, 0.0],
    )
    return vf.SingleTurnEnv(
        dataset=Dataset.from_list(_dataset_rows(num_tasks, start_seed)),
        eval_dataset=Dataset.from_list(_dataset_rows(eval_num_tasks, eval_start_seed)),
        rubric=rubric,
        **kwargs,
    )
