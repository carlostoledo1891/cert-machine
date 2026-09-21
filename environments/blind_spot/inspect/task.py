"""blind-spot as an `inspect_ai` Task. The scorer IS the existing verifier.

    inspect eval environments/blind_spot/inspect/task.py@blind_spot_located \\
        --model anthropic/claude-sonnet-5 --effort low --max-tokens 12000 \\
        --log-format json --log-dir environments/blind_spot/inspect/logs

THE ONE FACT THIS FILE IS BUILT ON. `blind_spot.adapters_v0._decide` is the
function every reward in the verifiers rubric calls (reward, solved,
well_formed, false_claim, out_of_box_kill are five one-line readers of its
dict). It rebuilds the task from (seed, index), reads the assistant text out of
whatever message shape it is handed, and grades by SIMULATING the actual
netlist under the actual mutation (a KILL) or against the SAT proof on the
hand-written miter (EQUIVALENT). The Inspect scorer below calls THAT function
on Inspect's own assistant messages. Nothing is re-implemented, so the two
frameworks cannot drift: `battery.py` proves agreement on every pooled mutant
and the red control shows a spoiled witness stops killing under both.

`adapters_v0` imports `verifiers` only inside `load_environment`, so this file
runs with the framework absent — the venv has inspect_ai and not verifiers,
and the framework-free claim of the package holds here too.

THE THREE RUNGS ARE THREE VARIANTS OF ONE TASKSET, not three tasksets. The
verifiers environment cycles the rung with the index (located, profile, blind,
located, ...), so a rung variant is the indices congruent to its offset mod 3
over the SAME seed. (seed, index) stays the whole of a task's identity, the
sample id is `f"{seed}-{index}"` exactly as `Task.id` names it in taskset.py,
and a human baseline attempt on `2027-4` and a model rollout on `2027-4` are
the same task by construction.

No answer key: `Sample.target` is the empty string, as `answer` is in the
verifiers dataset. Nothing in `metadata` is shown to the model; the prompt is
`Task.prompt()` and `tests/test_environment.py` holds it to hiding the label.
"""
from __future__ import annotations

import os
import sys
from typing import Any, Dict, List, Optional

HERE = os.path.dirname(os.path.abspath(__file__))
ENV = os.path.dirname(HERE)
if ENV not in sys.path:
    sys.path.insert(0, ENV)                      # the package beside this directory, not a copy

from inspect_ai import Task, task                                   # noqa: E402
from inspect_ai.dataset import MemoryDataset, Sample                # noqa: E402
from inspect_ai.model import ChatMessageAssistant                   # noqa: E402
from inspect_ai.scorer import Score, Scorer, Target, mean, scorer, stderr   # noqa: E402
from inspect_ai.solver import TaskState, generate                   # noqa: E402

from blind_spot.adapters_v0 import _decide                          # noqa: E402  THE grader
from blind_spot.api import ENV_ID, preflight, task_row              # noqa: E402
from blind_spot.taskset import RUNGS                                # noqa: E402

DEFAULT_SEED = 2027          # the verifiers adapter's EVAL taskset for seed 2026 (seed + 1)
DEFAULT_PER_RUNG = 12        # the recorded verifiers runs were 12 per rung


def indices(rung: Optional[str], num_tasks: int, start: int) -> List[int]:
    """Which indices of the taskset a variant draws. Mixed: a contiguous block,
    which cycles the rungs the way the verifiers dataset does. One rung: the
    indices congruent to that rung's offset mod 3, so the task at (seed, i) is
    the same task the verifiers environment would have served at (seed, i)."""
    if rung is None:
        return list(range(start, start + num_tasks))
    if rung not in RUNGS:
        raise ValueError(f"rung must be one of {RUNGS}, not {rung!r}")
    k = RUNGS.index(rung)
    return [3 * j + k for j in range(start, start + num_tasks)]


def info_of(seed: int, index: int) -> Dict[str, Any]:
    """The sample's metadata: the verifiers `info` column, field for field
    (`adapters_v0._dataset_rows`): the row minus the prompt, plus env_id."""
    row = task_row(seed, index)
    info = dict(row)
    info.pop("prompt")
    info["env_id"] = ENV_ID
    return info


def samples(rung: Optional[str], num_tasks: int, seed: int, start: int) -> List[Sample]:
    out = []
    for i in indices(rung, num_tasks, start):
        row = task_row(seed, i)
        info = dict(row)
        prompt = info.pop("prompt")
        info["env_id"] = ENV_ID
        out.append(Sample(id=row["task_id"], input=prompt, target="", metadata=info))
    return out


def assistant_completion(state: TaskState) -> List[ChatMessageAssistant]:
    """The assistant messages, TEXT PARTS ONLY. Inspect renders a reasoning part's
    `.text` as `<think>…</think>`, and `_reply_text` would read it — so a verdict
    the model considered while thinking could be graded instead of the one it
    gave. The verifiers client hands the rubric the reply text; this hands the
    same. `battery.py` plants a reasoning block carrying a killing verdict under
    a final UNDECIDED and requires UNDECIDED."""
    out = []
    for m in state.messages:
        if m.role != "assistant":
            continue
        if isinstance(m.content, str):
            out.append(m)
        else:
            out.append(ChatMessageAssistant(content=m.text))
    return out


@scorer(metrics={
    "reward": [mean(), stderr()],
    "solved": [mean(), stderr()],
    "well_formed": [mean()],
    "false_claim": [mean()],
    "out_of_box_kill": [mean()],
})
def exact_verifier() -> Scorer:
    """The five numbers of the verifiers rubric, from the one decision it makes.

    reward          +1 a pair flips a pin in simulation, or EQUIVALENT on a proved-
                       equivalent mutant; 0 a miss, UNDECIDED or an unreadable reply;
                       -1 a false claim either way. What trains, there; the headline, here.
    solved          the same decision in {0, 1}.
    well_formed     0 when no verdict could be read — a refusal is not a wrong answer.
    false_claim     1 for a kill claimed on a proved-unchanged design or a gap declared
                       closed on a killable one.
    out_of_box_kill 1 when the killing pair needed a coordinate the declared box
                       excludes — the environment's thesis as a diagnostic.
    """
    async def score(state: TaskState, target: Target) -> Score:
        g = _decide(assistant_completion(state), state.metadata)
        return Score(
            value={
                "reward": float(g["reward"]),
                "solved": 1.0 if g["reward"] >= 1.0 else 0.0,
                "well_formed": float(g["well_formed"]),
                "false_claim": float(g["false_claim"]),
                "out_of_box_kill": 1.0 if g.get("in_box_kill") is False else 0.0,
            },
            answer=g["outcome"],
            explanation=g.get("why") or g["outcome"],
            metadata={"outcome": g["outcome"], "in_box_kill": g.get("in_box_kill"),
                      "killer": g.get("killer"), "truth": state.metadata.get("truth"),
                      "klass": state.metadata.get("klass"), "mutant": state.metadata.get("mutant")},
        )
    return score


def _task(rung: Optional[str], num_tasks: int, seed: int, start: int, name: str) -> Task:
    preflight()          # the eleven planted controls, three positive, before a model is called
    return Task(
        name=name,
        dataset=MemoryDataset(samples(rung, num_tasks, seed, start), name=name),
        solver=[generate()],
        scorer=exact_verifier(),
        metadata={"env_id": ENV_ID, "rung": rung or "mixed", "seed": seed, "start": start,
                  "scorer": "blind_spot.adapters_v0._decide — the verifiers rubric's decision; "
                            "a KILL is simulated on the netlist, EQUIVALENT is checked against the SAT proof",
                  "answer_key": None},
    )


@task
def blind_spot(num_tasks: int = 3 * DEFAULT_PER_RUNG, seed: int = DEFAULT_SEED, start: int = 0) -> Task:
    """All three rungs, cycling with the index as the verifiers dataset does."""
    return _task(None, num_tasks, seed, start, "blind_spot")


@task
def blind_spot_located(num_tasks: int = DEFAULT_PER_RUNG, seed: int = DEFAULT_SEED, start: int = 0) -> Task:
    """The mutation named: cell, port, bit, how it is bent, the statement, the wire."""
    return _task("located", num_tasks, seed, start, "blind_spot_located")


@task
def blind_spot_profile(num_tasks: int = DEFAULT_PER_RUNG, seed: int = DEFAULT_SEED, start: int = 0) -> Task:
    """The location withheld; which of the four testbench families killed it."""
    return _task("profile", num_tasks, seed, start, "blind_spot_profile")


@task
def blind_spot_blind(num_tasks: int = DEFAULT_PER_RUNG, seed: int = DEFAULT_SEED, start: int = 0) -> Task:
    """Nothing but the design."""
    return _task("blind", num_tasks, seed, start, "blind_spot_blind")
