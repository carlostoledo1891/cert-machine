"""Adapters onto the verifiers spec.

STATUS, STATED PLAINLY: the two shapes below are written from the published
description of the v1 API (Taskset / Task / TaskData with @vf.reward) and the
legacy load_environment() entry point. They have NOT been run against a live
verifiers install from this machine, and the docs for the two versions disagree
about which the Hub currently accepts. Verify both before pushing — everything
that matters is in the modules beside this one, which need no framework at all
and are exercised by the test suite and the CLI.

The core is deliberately framework-free: task generation, the band geometry, the
graders, the forgery battery and the scoring are plain stdlib Python. If the
spec moves again, this file is the only casualty.
"""
from __future__ import annotations

from typing import Any, Dict, Iterator, Optional

from .forgeries import gate
from .task import GRADER_KINDS, grade, make_task, parse, render_prompt

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


def score(seed: int, reply: str) -> Dict[str, Any]:
    """The whole reward, from a seed and a reply. Three numbers come back and
    they are kept apart on purpose: `reward` is what trains, `well_formed`
    separates a refusal from a wrong answer, and `false_claim` counts the
    failure mode this environment exists to punish."""
    t = make_task(seed)
    sub, why = parse(reply)
    if sub is None:
        return {"reward": 0.0, "well_formed": 0.0, "false_claim": 0.0,
                "verdict": "REFUSED_PARSE", "note": why}
    r = grade(t, sub)
    return {"reward": r["score"], "well_formed": 1.0,
            "false_claim": 1.0 if r["verdict"] == "WRONG" else 0.0,
            "verdict": r["verdict"], "note": r["note"]}


def preflight() -> Dict[str, Any]:
    """Run the forgery battery. Any caller that reports numbers without calling
    this first is reporting numbers it has not earned."""
    g = gate(range(64))
    if not g["ok"]:
        raise RuntimeError(f"forgery gate failed: {g['leaked']} planted submissions scored")
    return g


def load_environment(**kwargs):                      # legacy entry point
    """Kept for the older Hub scaffolder. Raises unless `verifiers` is present,
    so the failure is a clear one rather than a confusing one."""
    try:
        import verifiers as vf                        # noqa: F401
    except ImportError as e:                          # pragma: no cover
        raise ImportError(
            "certificate-band-gym: the framework-free core runs without verifiers — "
            "use certificate_band_gym.cli or import make_task/grade directly. "
            "This entry point needs `verifiers` installed."
        ) from e
    raise NotImplementedError(
        "the verifiers binding is unverified against a live install; "
        "see the note at the top of taskset.py"
    )
