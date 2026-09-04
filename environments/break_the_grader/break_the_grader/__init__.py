"""break-the-grader — break a grader, or prove it cannot be broken.

The model is shown a certified interval and a grader, and must produce a value
the grader ACCEPTS and the certificate REFUTES — or answer NO_ATTACK when no
such value exists. Both standing answers lose somewhere, so only checking wins.

Nothing here is an answer key. The negatives carry proofs.
"""
from .band import band_measure, mint_attack, verify_attack, key_at, tau_for_band
from .facts import FACTS, BY_ID
from .forgeries import gate
from .task import Task, grade, make_task, parse, render_prompt

# ONE version. `prime env push --auto-bump` rewrites pyproject.toml and nothing
# else, so a literal here goes stale on the first bump and the package starts
# reporting a version it is not — a number defined twice diverges, always.
try:                                            # installed: read the metadata
    from importlib.metadata import PackageNotFoundError, version as _version
    __version__ = _version("break-the-grader")
except Exception:                               # a source tree with no install
    __version__ = "0+unknown"
__all__ = [
    "FACTS", "BY_ID", "Task", "make_task", "render_prompt", "parse", "grade",
    "band_measure", "mint_attack", "verify_attack", "key_at", "tau_for_band", "gate",
    "load_environment", "BreakTheGraderTaskset",
]

# --- the framework adapters, resolved lazily -------------------------------
# `verifiers` is imported only when one of these names is touched, so
# `import break_the_grader` stays a stdlib-only import and the zero-
# dependency claim is a fact the test suite can check rather than a promise.
_ADAPTERS = {
    "load_environment": "break_the_grader.adapters_v0",   # verifiers v0 / the Hub entry point
    "BreakTheGraderTaskset": "break_the_grader.adapters_v1",
    "BreakTheGraderTask": "break_the_grader.adapters_v1",
    "BreakTheGraderData": "break_the_grader.adapters_v1",
}


def __getattr__(name):
    if name in _ADAPTERS:
        from importlib import import_module
        return getattr(import_module(_ADAPTERS[name]), name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def __dir__():
    return sorted(set(__all__) | set(_ADAPTERS))

