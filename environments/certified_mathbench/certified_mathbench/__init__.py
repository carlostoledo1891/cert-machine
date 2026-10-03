"""certified-mathbench — seven construction families, each decided exactly; reward 1 means a certificate exists.

Golomb rulers, cap sets, binary codes, Ramsey witnesses, sum-difference entropy laws, kissing configurations,
polynomial-multiplication algorithms over F2: 46 rungs from textbook to the published record and, in five
families, one rung past it. The model returns an OBJECT; the grader decides its defining property in integer,
exact rational or rigorous-interval arithmetic. No answer key, no judge, no tolerance, and a forgery battery that
must refute before a prompt is served.
"""
from .api import (BEYOND, ENV_ID, OUTCOMES, baseline_table, grade, grade_object, preflight, rungs, sample,
                  score, task_row)

# ONE version. `prime env push --auto-bump` rewrites pyproject.toml and nothing else, so a literal here would go
# stale on the first bump; the metadata is read instead.
try:
    from importlib.metadata import version as _version
    __version__ = _version("certified-mathbench")
except Exception:
    __version__ = "0+unknown"

__all__ = ["BEYOND", "ENV_ID", "OUTCOMES", "baseline_table", "grade", "grade_object", "preflight", "rungs",
           "sample", "score", "task_row", "load_environment"]

# --- the framework adapter, resolved lazily ------------------------------------------------------------------------
# `verifiers` is imported only when `load_environment` is touched, so `import certified_mathbench` stays a
# stdlib-only import and the zero-dependency claim is a fact tests/test_framework_free.py checks.
_ADAPTERS = {"load_environment": "certified_mathbench.adapters_v0", "TESTED_AGAINST": "certified_mathbench.adapters_v0"}


def __getattr__(name):
    if name in _ADAPTERS:
        from importlib import import_module
        return getattr(import_module(_ADAPTERS[name]), name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def __dir__():
    return sorted(set(__all__) | set(_ADAPTERS))
