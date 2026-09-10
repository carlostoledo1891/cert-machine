"""lattice-claims — decide a claim about a short lattice vector exactly, or refuse
it and name the quantity it left out.

Built out of a grader bug. Auditing 37 published SVP-challenge records, an exact
grader reported 32 of them as disagreeing with their published figure. The grader
was bit-exact and the finding was entirely false: the published ratios were
computed from the TRUE norm and printed rounded, and the exact ratio was computed
FROM THE ROUNDED NORM. Two exact numbers, different references, and the
comparison meant nothing.

Exactness did not save us. Naming what the claim was about would have. So a
submission here must declare the reference it decided against, and a right
verdict reached from the wrong reference does not score as right.
"""
from .api import (ENV_ID, INFINITE, RUNGS, parse_reply, preflight, sample,
                  score, score_task, task_row)
from .taskset import Task, TaskData, Taskset, grade

# ONE version. `prime env push --auto-bump` rewrites pyproject.toml and nothing
# else, so a literal here goes stale on the first bump and the package starts
# reporting a version it is not — a number defined twice diverges, always.
try:                                            # installed: read the metadata
    from importlib.metadata import PackageNotFoundError, version as _version
    __version__ = _version("lattice-claims")
except Exception:                               # a source tree with no install
    __version__ = "0+unknown"

__all__ = [
    "ENV_ID", "INFINITE", "RUNGS", "Task", "TaskData", "Taskset", "grade",
    "parse_reply", "preflight", "sample", "score", "score_task", "task_row",
    "load_environment",
]

# --- the framework adapter, resolved lazily --------------------------------
# `verifiers` is imported only when `load_environment` is touched, so
# `import lattice_claims` stays a stdlib-only import and the zero-dependency
# claim is a fact tests/test_framework_free.py can check rather than a promise.
_ADAPTERS = {
    "load_environment": "lattice_claims.adapters_v0",   # the Hub entry point
    "TESTED_AGAINST": "lattice_claims.adapters_v0",
}


def __getattr__(name):
    if name in _ADAPTERS:
        from importlib import import_module
        return getattr(import_module(_ADAPTERS[name]), name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def __dir__():
    return sorted(set(__all__) | set(_ADAPTERS))
