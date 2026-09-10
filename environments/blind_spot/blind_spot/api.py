"""The framework-free programmatic API: rows in, decisions out.

This is the module every consumer shares — the eval runner, the framework
adapter and the battery. A row shape or a scoring rule defined twice will
diverge, so it is defined once, here, and imported. `parse_reply` in particular
used to live in `eval/run_models.py`, where the adapter could not reach it; it
moved here on the port and the eval script imports it, so THE PARSER THAT READS
A MODEL'S REPLY DURING TRAINING IS THE ONE THAT GRADED THE 108 RECORDED
ROLLOUTS. The battery re-parses and re-grades all 108 from their stored raws
every build and no row may move.

Nothing in this file imports anything outside the standard library. `verifiers`
is touched only by `adapters_v0`, which is imported lazily, so
`import blind_spot` stays a stdlib import and `tests/test_framework_free.py`
can prove it by blocking every third-party import.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from . import pool as _pool
from .design import require_tools, tools_missing
from .taskset import RUNGS, Task, Taskset, grade

ENV_ID = "blind-spot"
INFINITE = False        # the pool is MCY's 400; `pool.build` from a new seed extends it


def parse_reply(txt: str) -> Optional[Dict[str, Any]]:
    """The last JSON object in the reply that carries a verdict. Pairs nest, so
    the braces are matched rather than searched for.

    Moved here from eval/run_models.py unchanged. A model answers in prose with
    a JSON object somewhere in it; taking the LAST one lets a model think aloud,
    show a candidate and then correct it, which is the behaviour the recorded
    runs actually show."""
    best, depth, start = None, 0, None
    for i, c in enumerate(txt):
        if c == "{":
            if depth == 0:
                start = i
            depth += 1
        elif c == "}" and depth:
            depth -= 1
            if depth == 0:
                try:
                    d = json.loads(txt[start:i + 1])
                except Exception:
                    continue
                if isinstance(d, dict) and "verdict" in d:
                    best = d
    return best


def task_row(seed: int, index: int) -> Dict[str, Any]:
    """One task as serialisable data. NOTE what is absent from `prompt`: the
    label. `Task.public()` decides what the rung is allowed to state, and
    `tests/test_environment.py::test_tasks_are_deterministic_and_hide_the_label`
    is what holds it to that.

    `seed` and `index` are the whole of the state: `Taskset(seed).sample(index)`
    is a pure function of the pair, so a submission is scored against the task it
    was generated from and never against a task rebuilt from a description of it.
    """
    t = Taskset(seed=seed).sample(index)
    return {
        "seed": seed,
        "index": index,
        "task_id": t.id,
        "prompt": t.prompt(),
        "rung": t.rung,
        "mutant": t.mutant["id"],
        "klass": t.klass,
        "truth": t.truth,
        "equivalent": bool(t.mutant["equivalent"]),
    }


def sample(num_tasks: int, seed: int = 0, start: int = 0) -> List[Dict[str, Any]]:
    """A finite draw. The rung cycles with the index, so any contiguous block of
    three covers all three rungs."""
    return [task_row(seed, i) for i in range(start, start + num_tasks)]


def score(seed: int, index: int, reply: str) -> Dict[str, Any]:
    """The whole reward, from a seed, an index and a reply.

    Four numbers come back and they are kept apart on purpose: `reward` is what
    trains, `well_formed` separates a reply that could not be read from a wrong
    answer, `false_claim` counts the failure this environment exists to punish (a
    kill claimed on a design proved unchanged, or a gap declared closed on a
    killable one), and `in_box_kill` records whether the kill needed an input the
    declared box excludes — the thesis as a diagnostic rather than as a score.
    """
    t = Taskset(seed=seed).sample(index)
    return score_task(t, reply)


def score_task(t: Task, reply: str) -> Dict[str, Any]:
    sub = parse_reply(reply) if isinstance(reply, str) else reply
    if sub is None:
        return {"reward": 0.0, "outcome": "REFUSED_PARSE", "well_formed": 0.0,
                "false_claim": 0.0, "in_box_kill": None, "killer": None,
                "why": "no JSON object carrying a verdict"}
    return grade(t, sub)


def task_for(mutant_id: int, rung: str, tid: str = "regrade") -> Task:
    """The task a RECORDED rollout was generated from, rebuilt from the pool by
    mutant id. Used by the regrade: grading depends on the mutant and nothing
    else, so this is the same object the runner graded."""
    m = next((e for e in _pool.load()["mutants"] if e["id"] == mutant_id), None)
    if m is None:
        raise KeyError(f"mutant {mutant_id} is not in the pool")
    return Task(tid, rung, m)


def preflight(strict: bool = True) -> Dict[str, Any]:
    """The tools, the pool and the planted controls, before anything a model
    could be scored against.

    An environment whose simulator is not live would score every submission as a
    miss and report perfect refusal discipline, and an environment whose grader
    accepts a forgery has no business producing a number. THREE of the eleven
    controls are POSITIVE — they must SCORE — because a suite that fails
    everything reports perfect coverage, which is the mistake this environment is
    named for."""
    missing = tools_missing()
    if missing and strict:
        raise RuntimeError("blind-spot needs " + ", ".join(missing)
                           + " on PATH (brew install yosys icarus-verilog)")
    require_tools()
    _pool.ensure_sim()      # an installed copy has the labels but not the binary
    from .forgeries import run as run_controls
    rows, failed = run_controls()
    positives = [r for r in rows if r[1].get("outcome") == "SOLVED"]
    if failed:
        raise RuntimeError(f"blind-spot: {len(failed)} of {len(rows)} planted controls "
                           f"misbehaved — refusing to run. {failed}")
    if len(positives) != 3 or not all(r[2] for r in positives):
        raise RuntimeError("blind-spot: the positive controls did not score — the simulator "
                           "is not live, and a suite that fails everything reads as perfect coverage")
    return {"controls": len(rows), "failed": len(failed), "positive": len(positives),
            "mutants": len(_pool.load()["mutants"])}
