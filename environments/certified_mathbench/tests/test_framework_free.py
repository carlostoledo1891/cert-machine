"""`import certified_mathbench` must not need the framework.

The grader decides objects in exact arithmetic; `verifiers` delivers that decision and nothing more. Keeping the two
apart is what lets cert-machine's battery, its eval harness and the Hub share ONE grader.
"""
import builtins
import importlib
import sys

import pytest

THIRD_PARTY = ("verifiers", "datasets", "torch", "transformers", "openai", "pydantic", "numpy", "pandas", "requests", "httpx")


@pytest.fixture
def no_third_party(monkeypatch):
    real = builtins.__import__

    def guard(name, *a, **kw):
        if name.split(".")[0] in THIRD_PARTY:
            raise AssertionError(f"certified_mathbench reached for {name!r}; the package is stdlib only")
        return real(name, *a, **kw)

    monkeypatch.setattr(builtins, "__import__", guard)
    for mod in [m for m in sys.modules if m.split(".")[0] in ("certified_mathbench", "families", "llm_harness_base")]:
        sys.modules.pop(mod, None)
    yield


def test_the_package_imports_grades_and_gates_with_no_framework(no_third_party):
    cm = importlib.import_module("certified_mathbench")
    api = importlib.import_module("certified_mathbench.api")
    assert len(api.rungs()) == 46
    row = api.task_row(0)
    assert row["prompt"] and row["family"] == "golomb"
    g = api.score(0, "no json here")
    assert g["outcome"] == "malformed" and g["certified"] == 0.0
    gate = api.preflight()
    assert gate["green"] == 28 and gate["red"] == 20 and gate["failed"] == []
    assert cm.ENV_ID == "certified-mathbench"


def test_importing_the_package_does_not_pull_the_framework_in():
    for mod in [m for m in sys.modules if m.split(".")[0] in ("certified_mathbench", "verifiers")]:
        sys.modules.pop(mod, None)
    importlib.import_module("certified_mathbench")
    assert "verifiers" not in sys.modules, "importing certified_mathbench reached for the framework"
