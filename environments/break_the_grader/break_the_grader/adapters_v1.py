"""The verifiers v1 adapter — `Taskset` / `Task` / `@reward`.

VERIFIED against a live install, like its v0 sibling; the version is in
TESTED_AGAINST and `tests/test_verifiers_binding.py` re-checks it wherever
`verifiers` is present.

Both adapters exist on purpose. v0 (`load_environment`) is what the Hub's own
install instructions print and what `vf-eval` resolves, so it is the one a
stranger will actually run; v1 is where the framework is going. Neither owns any
mathematics — each is a few dozen lines of translation over the same stdlib core,
so if the spec moves again these two files are the whole casualty.
"""
from __future__ import annotations

from typing import List

import verifiers.v1 as vf

from .api import preflight, score
from .task import make_task, render_prompt

TESTED_AGAINST = ("verifiers 0.2.0", "verifiers 0.3.1")
"""0.2.0 is what `prime` 0.6.31 pins; 0.3.1 is what the Hub's own install
command resolves. The two disagree about the v1 surface — `Taskset.load()`
returns a list in one and takes an iterable in the other — so both were run,
and a list satisfies both."""


class BreakTheGraderData(vf.TaskData):
    """One task's wire data. NOTE what is absent: an answer field.

    Everything here describes the PROBLEM — which certified quantity, which
    grader, how wide the tolerance is against the certificate. The seed is
    load-bearing: `make_task` is a pure function of it, so the grader is rebuilt
    at scoring time rather than carried, and a reply cannot be scored against a
    task it was not generated from.
    """
    seed: int = 0
    fact_id: str = ""
    record: str | None = None
    sha256: str | None = None
    grader: str = ""
    rung: str = ""
    band: float = 0.0
    attackable: bool = False


class BreakTheGraderTask(vf.Task[BreakTheGraderData]):
    def _decide(self, trace) -> dict:
        """One line, so this layer owns no scoring of its own: `api.score`
        rebuilds the task from its seed and decides the reply exactly."""
        return score(self.data.seed, trace.last_reply or "")

    @vf.reward(weight=1.0)
    async def certificate_band(self, trace: vf.Trace) -> float:
        """+1 a verified break or a correct refusal; -1 a false claim either way;
        0 a reply that could not be read. The three outcomes are genuinely
        different and the scale says so: refusing to answer costs nothing, and
        asserting something the certificate refutes costs more than either."""
        decision = self._decide(trace)
        trace.info["verdict"] = decision["verdict"]
        trace.info["note"] = decision["note"]
        trace.info["rung"] = self.data.rung
        trace.info["attackable"] = self.data.attackable
        return float(decision["reward"])

    @vf.metric
    async def solved(self, trace: vf.Trace) -> float:
        """The same decision in [0, 1], for a table that wants a rate."""
        return 1.0 if self._decide(trace)["reward"] >= 1.0 else 0.0

    @vf.metric
    async def well_formed(self, trace: vf.Trace) -> float:
        """0 when the reply could not be parsed. Kept apart from the reward so a
        refusal to answer is never confused with a wrong answer."""
        return 0.0 if self._decide(trace)["verdict"] == "REFUSED_PARSE" else 1.0

    @vf.metric
    async def false_claim(self, trace: vf.Trace) -> float:
        """1 when the model asserted something the certificate refutes — the
        failure this environment exists to punish, counted on its own."""
        return 1.0 if self._decide(trace)["verdict"] == "WRONG" else 0.0


class BreakTheGraderConfig(vf.TasksetConfig):
    num_tasks: int = 200
    """How many tasks to draw. The generator is endless and the parameter space
    is continuous, so this bounds the SAMPLE, not the set: a larger number is a
    longer draw from the same distribution, never a different problem list."""
    start_seed: int = 0
    """Where to start drawing. Row n is a function of n alone, so a resumed run
    regenerates exactly the same tasks and two runs at different offsets share
    none."""


class BreakTheGraderTaskset(vf.Taskset[BreakTheGraderTask, BreakTheGraderConfig]):
    def load(self) -> List[BreakTheGraderTask]:
        """A list, not a generator.

        verifiers 0.2.0 declares `load() -> list[TaskT]` and its Taskset is not
        iterable; 0.3.1 widened it to `Iterable` with a `__iter__` on top. A list
        satisfies both, and it makes the battery below run at load time in every
        version rather than on first iteration in some of them.
        """
        preflight()      # the battery, before anything a model could be scored against
        out: List[BreakTheGraderTask] = []
        start = self.config.start_seed
        for seed in range(start, start + self.config.num_tasks):
            t = make_task(seed)
            out.append(BreakTheGraderTask(
                BreakTheGraderData(
                    idx=seed - start,
                    name=f"seed-{seed}-{t.grader.kind}-{t.rung}",
                    prompt=render_prompt(t),
                    seed=seed,
                    fact_id=t.fact.id,
                    record=t.fact.record,
                    sha256=t.fact.sha256,
                    grader=t.grader.kind,
                    rung=t.rung,
                    band=t.band,
                    attackable=t.attackable,
                ),
                getattr(self.config, "task", None),
            ))
        return out


__all__ = [
    "BreakTheGraderData",
    "BreakTheGraderTask",
    "BreakTheGraderConfig",
    "BreakTheGraderTaskset",
]
