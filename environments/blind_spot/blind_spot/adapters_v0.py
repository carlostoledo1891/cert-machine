"""The verifiers adapter — `load_environment`, the entry point the Hub calls.

VERIFIED against a live `verifiers` install, not written from a doc. The version
it was exercised on is in TESTED_AGAINST below and re-checked by
`tests/test_verifiers_binding.py`, which SKIPS rather than guesses when
`verifiers` is absent.

Writing this file from documentation is how the sibling environment
(break-the-grader) acquired three defects, two of them silent:

  1. `load_environment` was never exported from `__init__`, so the Hub's own
     command would have raised on arrival. Here `__init__.__getattr__` resolves
     it lazily and `tests/test_verifiers_binding.py` imports it by that path.
  2. A plain-string `task` column aborts every rollout ("Plain string task routes
     are no longer supported"). There is no `task` column here; routing rides in
     `info["env_id"]`.
  3. Scoring is handed a list of PYDANTIC MESSAGE OBJECTS, not dicts, so a
     `.get("content")` misses on every one and a whole eval prints 0.000 with no
     error raised. `_field` below reads either shape, and it is four lines that
     only a live install can tell you to write.

Two rules hold this file to the framework's edge:

  · nothing in `blind_spot` imports `verifiers` except this module, which is why
    `tests/test_framework_free.py` can block every third-party import and still
    import the package;
  · `api.preflight()` runs the eleven planted controls before `load_environment`
    hands back anything a model could be scored against — including the three
    POSITIVE controls, because a simulator that is not live would score every
    submission as a miss and report perfect refusal discipline.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from .api import ENV_ID, preflight, sample, score

TESTED_AGAINST = "0.3.1"


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
    """A message field from either a mapping or a model object. See defect 3."""
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
    rebuilds the task from (seed, index) and decides the reply exactly."""
    return score(int(info["seed"]), int(info["index"]), _reply_text(completion))


def _dataset_rows(num_tasks: int, seed: int, start: int) -> List[Dict[str, Any]]:
    """`api.sample` rows in the column shape the framework wants.

    `answer` is the empty string because the framework asks for the column, not
    because there is one: a kill is VERIFIED by simulating the actual netlist
    under the actual mutation, so there is no reference string to match against
    and no answer key to leak. See defect 2 for the missing `task` column.
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
    """A `SingleTurnEnv` over the mutation pool.

    UNLIKE its sibling, this taskset is NOT endless: the pool is MCY's 400
    mutations of one design, so `num_tasks` above a few hundred is drawing the
    same mutants again under different rungs rather than reaching new ones.
    `blind_spot.pool.build` from a fresh `mutate -list 400 -seed S` extends it;
    `api.INFINITE` is False and says so.

    Train and eval are disjoint by TASKSET SEED, not by index: the index chooses
    the rung (it cycles located/profile/blind), so splitting on index would hand
    the two halves different rung mixtures. There is no answer key to leak, but a
    shared seed would still let a model memorise which mutants are equivalent.
    """
    import verifiers as vf
    from datasets import Dataset

    preflight()          # the controls, before anything a model could be scored against

    eval_num_tasks = num_tasks if eval_num_tasks is None else eval_num_tasks
    eval_seed = seed + 1 if eval_seed is None else eval_seed
    eval_start = start if eval_start is None else eval_start

    def reward(completion, info, **_) -> float:
        """+1 a pair that flips a pin, or EQUIVALENT on a proved-equivalent design.
        0 a miss, an UNDECIDED, or a reply that could not be read.
        -1 a false claim either way. This is what trains."""
        return float(_decide(completion, info)["reward"])

    def solved(completion, info, **_) -> float:
        """The same decision in [0, 1], for a leaderboard that wants a rate."""
        return 1.0 if _decide(completion, info)["reward"] >= 1.0 else 0.0

    def well_formed(completion, info, **_) -> float:
        """0 when the reply carried no readable verdict. Kept apart from `reward`
        so a refusal to answer is never confused with a wrong answer — Opus
        declined all twelve `profile` tasks in the recorded run on a content
        policy, and that is a fact to carry, not a prompt to tune."""
        return float(_decide(completion, info)["well_formed"])

    def false_claim(completion, info, **_) -> float:
        """1 when the model claimed a kill on a design proved unchanged, or
        declared a killable mutant equivalent. A false alarm and a gap declared
        closed are the two ways a verifier lies, and this counts them."""
        return float(_decide(completion, info)["false_claim"])

    def out_of_box_kill(completion, info, **_) -> float:
        """1 when the kill needed an input the declared box excludes. Not scored:
        half of every model's kills in the recorded run used a -4 coordinate, and
        that is the thesis showing up as a measurement."""
        return 1.0 if _decide(completion, info).get("in_box_kill") is False else 0.0

    rubric = vf.Rubric(
        funcs=[reward, solved, well_formed, false_claim, out_of_box_kill],
        weights=[1.0, 0.0, 0.0, 0.0, 0.0],
    )
    return vf.SingleTurnEnv(
        dataset=Dataset.from_list(_dataset_rows(num_tasks, seed, start)),
        eval_dataset=Dataset.from_list(_dataset_rows(eval_num_tasks, eval_seed, eval_start)),
        rubric=rubric,
        **kwargs,
    )
