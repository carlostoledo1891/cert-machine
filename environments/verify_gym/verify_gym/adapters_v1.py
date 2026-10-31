"""The verifiers v1 adapter: `Taskset` / `Task` / `@reward`, in break-the-grader's shape.

Neither adapter owns any arithmetic: each is translation over the same stdlib core, so if the framework's spec moves
again these two files are the whole casualty. tests/test_verifiers_binding.py runs both against whatever
`verifiers` is installed and is skipped, never guessed at, when it is absent.
"""
from __future__ import annotations

from typing import List

import verifiers.v1 as vf

from .api import family_pool_row, heldout, preflight, score, train_sample

TESTED_AGAINST = ("verifiers 0.2.0", "verifiers 0.3.1")


class VerifyGymData(vf.TaskData):
    """One task's wire data. NOTE what is absent: an answer field. The id is load-bearing: the row is rebuilt from
    it at scoring time, so a reply is scored against the task it was given and nothing else."""
    task_id: str = ""
    family: str = ""
    tier: str = ""
    d0: int = 0
    cap: int = 1


class VerifyGymTask(vf.Task[VerifyGymData]):
    def _decide(self, trace) -> dict:
        return score(self.data.task_id, trace.last_reply or "")

    @vf.reward(weight=1.0)
    async def certified_progress(self, trace: vf.Trace) -> float:
        """progress / cap: certified decimals beyond the stated bracket, capped; 0 unless both sides are CERTIFIED."""
        d = self._decide(trace)
        trace.info["verdict"] = d["verdict"]
        trace.info["note"] = d["note"]
        trace.info["family"] = self.data.family
        return float(d["reward"])

    @vf.metric
    async def certified_decimals(self, trace: vf.Trace) -> float:
        return float(self._decide(trace)["decimals"])

    @vf.metric
    async def refuted(self, trace: vf.Trace) -> float:
        return 1.0 if self._decide(trace)["verdict"] == "REFUTED" else 0.0

    @vf.metric
    async def malformed(self, trace: vf.Trace) -> float:
        return 1.0 if self._decide(trace)["verdict"] == "MALFORMED" else 0.0


class VerifyGymConfig(vf.TasksetConfig):
    split: str = "train"
    """train (the stage's rotation), val (checkpoint selection), or heldout (the frozen 120)."""
    num_tasks: int = 300
    """Bounds the SAMPLE for train and val; the streams are endless. Ignored past 120 for heldout."""
    start: int = 0
    stage: str = "v0"


class VerifyGymTaskset(vf.Taskset[VerifyGymTask, VerifyGymConfig]):
    def load(self) -> List[VerifyGymTask]:
        """A list: 0.2.0 declares `load() -> list`, 0.3.1 takes an iterable; a list satisfies both, and the gate
        runs at load time in every version."""
        preflight()
        c = self.config
        if c.split == "heldout":
            rows = heldout("v0")[c.start:c.start + c.num_tasks]
        elif c.split == "val":
            from .api import curriculum
            fams = [f["id"] for f in curriculum()["families"]]
            rows = [family_pool_row(fams[n % len(fams)], "val", n // len(fams))
                    for n in range(c.start, c.start + c.num_tasks)]
        else:
            rows = train_sample(c.num_tasks, c.start, c.stage)
        return [VerifyGymTask(VerifyGymData(idx=i, name=r["id"], prompt=r["prompt"], task_id=r["id"],
                                            family=r["family"], tier=r["tier"], d0=r["d0"], cap=r["cap"]),
                              getattr(c, "task", None))
                for i, r in enumerate(rows)]


__all__ = ["VerifyGymData", "VerifyGymTask", "VerifyGymConfig", "VerifyGymTaskset"]
