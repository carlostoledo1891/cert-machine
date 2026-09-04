"""The framework-free programmatic API: rows in, decisions out.

This is the module every consumer shares — the CLI, both framework adapters and
the test suite. A row shape or a scoring rule defined twice will diverge, so it
is defined once, here, and imported.

Nothing in this file imports anything outside the standard library.
"""
from __future__ import annotations

from typing import Any, Dict, Iterator, List

from .forgeries import gate
from .task import grade, make_task, parse, render_prompt

ENV_ID = "break-the-grader"
INFINITE = True     # the parameter space is continuous; there is no fixed set


def task_row(seed: int) -> Dict[str, Any]:
    """One task as serialisable data. NOTE what is absent: an answer field.

    The row carries the PROBLEM — which certified quantity, which grader, how
    the tolerance compares to the certificate — and never a reference answer,
    because the environment decides submissions rather than matching them.
    """
    t = make_task(seed)
    return {
        "seed": seed,
        "prompt": render_prompt(t),
        "fact_id": t.fact.id,
        "record": t.fact.record,
        "sha256": t.fact.sha256,
        "grader": t.grader.kind,
        "grader_spec": t.grader.spec,
        "tau": t.tau,
        "kappa": t.kappa,
        "rung": t.rung,
        "band": t.band,
        "attackable": t.attackable,
    }


def rows(start: int = 0) -> Iterator[Dict[str, Any]]:
    """Deterministic and endless: row n is a function of n alone, so a resumed
    run regenerates exactly the same first n tasks."""
    seed = start
    while True:
        yield task_row(seed)
        seed += 1


def sample(num_tasks: int, start: int = 0) -> List[Dict[str, Any]]:
    """A finite draw. `num_tasks` bounds the SAMPLE, never the set."""
    return [task_row(s) for s in range(start, start + num_tasks)]


def score(seed: int, reply: str) -> Dict[str, Any]:
    """The whole reward, from a seed and a reply.

    The seed is the whole of the state that is needed: `make_task` is a pure
    function of it, so the grader the model was shown is REBUILT here rather
    than carried alongside the reply, and a submission cannot be scored against
    a task it was not generated from.

    Three numbers come back and they are kept apart on purpose: `reward` is what
    trains, `well_formed` separates a refusal from a wrong answer, and
    `false_claim` counts the failure mode this environment exists to punish.
    """
    t = make_task(seed)
    sub, why = parse(reply)
    if sub is None:
        return {"reward": 0.0, "well_formed": 0.0, "false_claim": 0.0,
                "verdict": "REFUSED_PARSE", "note": why}
    r = grade(t, sub)
    return {"reward": r["score"], "well_formed": 1.0,
            "false_claim": 1.0 if r["verdict"] == "WRONG" else 0.0,
            "verdict": r["verdict"], "note": r["note"]}


def preflight(seeds=range(64)) -> Dict[str, Any]:
    """Run the forgery battery. Any caller that reports numbers without calling
    this first is reporting numbers it has not earned."""
    g = gate(seeds)
    if not g["ok"]:
        raise RuntimeError(
            f"break-the-grader: the forgery battery leaked {g['leaked']} of "
            f"{g['planted']} planted submissions — refusing to run. {g['failures'][:2]}"
        )
    return g
