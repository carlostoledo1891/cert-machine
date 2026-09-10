"""blind-spot — fourteen million certified verdicts could not see this mutant.

One mutant of a Euclidean-norm comparator, or the unmutated design. Name 1-8
input pairs on which the mutant's pins differ, or answer EQUIVALENT, or answer
UNDECIDED. There is no answer key, no judge and no tolerance: a kill is verified
by SIMULATING the actual netlist under the actual mutation, and EQUIVALENT is
checked against a SAT proof on a hand-written miter.

The dial is how much of the defect is stated — `located`, `profile`, `blind` —
because knowing the family is not the pair. The out-of-box family kills 96.8% of
these mutants; eight random members of it kill 3 of 20 OUTBOX_ONLY, and every
eight-pair shotgun kills 0 of 8 ALIGNED_ONLY.
"""
from .api import (ENV_ID, INFINITE, parse_reply, preflight, sample, score,
                  score_task, task_for, task_row)
from .taskset import RUNGS, Task, Taskset, grade, parse_pairs

# ONE version. `prime env push --auto-bump` rewrites pyproject.toml and nothing
# else, so a literal here goes stale on the first bump and the package starts
# reporting a version it is not — a number defined twice diverges, always.
try:                                            # installed: read the metadata
    from importlib.metadata import PackageNotFoundError, version as _version
    __version__ = _version("blind-spot")
except Exception:                               # a source tree with no install
    __version__ = "0+unknown"

__all__ = [
    "ENV_ID", "INFINITE", "RUNGS", "Task", "Taskset", "grade", "parse_pairs",
    "parse_reply", "preflight", "sample", "score", "score_task", "task_for", "task_row",
    "load_environment",
]

# --- the framework adapter, resolved lazily --------------------------------
# `verifiers` is imported only when `load_environment` is touched, so
# `import blind_spot` stays a stdlib-only import and the zero-dependency claim
# is a fact tests/test_framework_free.py can check rather than a promise.
_ADAPTERS = {
    "load_environment": "blind_spot.adapters_v0",   # the Hub entry point
    "TESTED_AGAINST": "blind_spot.adapters_v0",
}


def __getattr__(name):
    if name in _ADAPTERS:
        from importlib import import_module
        return getattr(import_module(_ADAPTERS[name]), name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def __dir__():
    return sorted(set(__all__) | set(_ADAPTERS))
