"""llm_harness_base.py — the Family interface and the Verdict type, ONE definition for every consumer:
tools/llm-harness.py (the eval harness: egyptian, matmul) and tools/bench_families.py (Certified MathBench v0).
Moved out of llm-harness.py on 2026-09-29 so a second module could implement families without a copy."""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any, Iterable, Optional


@dataclass(frozen=True)
class Verdict:
    """An exact decision. `holds` is a proof outcome, never a float comparison."""
    holds: bool
    witness: str            # human-readable exact witness (rational, box, etc.)
    certificate: dict       # machine-checkable payload, stdlib-serialisable


class Family:
    name: str = "abstract"

    # -- generate stage: what the model is asked, and how we parse the reply --
    def prompt(self, target: Any) -> str:
        raise NotImplementedError

    def parse(self, reply: str) -> Optional[Any]:
        """Return a candidate object or None if malformed."""
        raise NotImplementedError

    # -- the six functions --
    def enumerate(self, n: int, seed: int) -> Iterable[Any]:
        """Targets to pose to the model (not candidates — the model produces those)."""
        raise NotImplementedError

    def value(self, obj: Any) -> float:
        """Float evaluation. Used ONLY by `interesting`. May be wrong."""
        raise NotImplementedError

    def interesting(self, obj: Any, target: Any) -> bool:
        """Float screen. May only prune. Must never be the reason something is admitted."""
        raise NotImplementedError

    def certify(self, obj: Any, target: Any) -> Optional[Verdict]:
        """Exact decision or None (undecided)."""
        raise NotImplementedError

    def key(self, obj: Any) -> str:
        return hashlib.sha256(repr(obj).encode()).hexdigest()[:16]

    def statement(self, obj: Any, target: Any) -> str:
        raise NotImplementedError

    # -- red controls: proposals that MUST be refuted, or the harness is not discriminating --
    def red_controls(self, target: Any) -> list[Any]:
        return []
