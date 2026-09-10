"""`import blind_spot` must not need the framework.

The package decides submissions by simulating a netlist; `verifiers` is a
delivery mechanism for that decision and nothing more. Keeping the two apart is
what lets the battery, the eval runner and the Hub share ONE grader — and it is
also the only way the claim "stdlib only" can be a fact rather than a promise.

The test blocks every third-party import and then imports the package and grades
a submission through it. If anything but `adapters_v0` reaches for `verifiers`,
this fails.
"""
import builtins
import importlib
import sys

import pytest

STDLIB_OK = {"blind_spot", "eval"}
THIRD_PARTY = ("verifiers", "datasets", "torch", "transformers", "openai",
               "pydantic", "numpy", "pandas", "requests", "httpx")


@pytest.fixture
def no_third_party(monkeypatch):
    real = builtins.__import__

    def guard(name, *a, **kw):
        root = name.split(".")[0]
        if root in THIRD_PARTY:
            raise AssertionError(f"blind_spot reached for {name!r}; the package is stdlib only")
        return real(name, *a, **kw)

    monkeypatch.setattr(builtins, "__import__", guard)
    for mod in [m for m in sys.modules if m.split(".")[0] in STDLIB_OK]:
        sys.modules.pop(mod, None)
    yield


def test_the_package_imports_and_grades_with_no_framework(no_third_party):
    bs = importlib.import_module("blind_spot")
    api = importlib.import_module("blind_spot.api")

    row = api.task_row(seed=2026, index=0)
    assert row["prompt"] and row["rung"] in bs.RUNGS
    # the LABEL is the class and the equivalence, not the word "KILL" — which the
    # prompt must contain, because it is the response format the model is given
    assert row["klass"] not in row["prompt"], "the prompt must not carry the class"
    assert "equivalent\":" not in row["prompt"] and "witness" not in row["prompt"].lower()

    # an unreadable reply is a zero, not a wrong answer
    g = api.score_task(api.task_for(row["mutant"], row["rung"]), "no json here")
    assert g["reward"] == 0.0 and g["outcome"] == "REFUSED_PARSE" and g["well_formed"] == 0.0

    # UNDECIDED is honest and free
    g = api.score_task(api.task_for(row["mutant"], row["rung"]), '{"verdict": "UNDECIDED"}')
    assert g["reward"] == 0.0 and g["outcome"] == "UNDECIDED" and g["well_formed"] == 1.0


def test_importing_the_package_does_not_pull_the_framework_in():
    """Importing must not touch `verifiers`; resolving `load_environment` must.

    Checked through `sys.modules` rather than by trapping the import: the lazy
    resolver goes through `importlib.import_module`, which does NOT route via
    `builtins.__import__`, so the fixture above cannot see it. Finding that out
    is the whole reason this file is run rather than reasoned about."""
    for mod in [m for m in sys.modules if m.split(".")[0] in ("blind_spot", "verifiers")]:
        sys.modules.pop(mod, None)
    bs = importlib.import_module("blind_spot")
    assert "verifiers" not in sys.modules, "importing blind_spot reached for the framework"
    # the Hub's own command is `load_environment`; break-the-grader once shipped
    # a version where this name was never exported and it would have raised on arrival
    assert "load_environment" in dir(bs)
    assert callable(bs.load_environment)
