"""verify-gym: bracket a constant, and be paid only for what is certified.

A task names a real constant (the root of x^x = N, a k-th root, a root of an integer polynomial) and a bracket it
is known to lie in. The model answers with a tighter interval lo < x < hi. Both sides are decided by exact integer
arithmetic, and the reward is the number of certified decimals beyond the stated bracket, capped. A wrong side,
an unreadable answer or an oversize number scores 0.

Nothing here is an answer key, and nothing here is a float.
"""
from .api import ENV_ID, curriculum, heldout, preflight, row, score, train_row, train_sample
from .exact import grade_endpoints, side
from .families import REGISTRY
from .forgeries import gate
from .task import grade, parse, render_prompt

try:                                            # installed: read the metadata (one version, never a literal here)
    from importlib.metadata import version as _version
    __version__ = _version("verify-gym")
except Exception:                               # a source tree with no install
    __version__ = "0+unknown"

__all__ = ["ENV_ID", "REGISTRY", "curriculum", "heldout", "row", "score", "train_row", "train_sample", "preflight",
           "gate", "grade", "grade_endpoints", "side", "parse", "render_prompt",
           "load_environment", "VerifyGymTaskset"]

# The framework adapters, resolved lazily: `import verify_gym` stays a standard-library import.
_ADAPTERS = {
    "load_environment": "verify_gym.adapters_v0",
    "VerifyGymTaskset": "verify_gym.adapters_v1",
    "VerifyGymTask": "verify_gym.adapters_v1",
    "VerifyGymData": "verify_gym.adapters_v1",
    "VerifyGymConfig": "verify_gym.adapters_v1",
}


def __getattr__(name):
    if name in _ADAPTERS:
        from importlib import import_module
        return getattr(import_module(_ADAPTERS[name]), name)
    raise AttributeError("module %r has no attribute %r" % (__name__, name))


def __dir__():
    return sorted(set(__all__) | set(_ADAPTERS))
