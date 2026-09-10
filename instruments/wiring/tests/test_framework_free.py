"""`import lattice_claims` must not need the framework.

The package decides claims in exact rational arithmetic; `verifiers` is a
delivery mechanism for that decision and nothing more. Keeping the two apart is
what lets the battery, the eval runner and the Hub share ONE grader — and it is
the only way the claim "stdlib only" can be a fact rather than a promise.
"""
import builtins
import importlib
import sys

import pytest

THIRD_PARTY = ("verifiers", "datasets", "torch", "transformers", "openai",
               "pydantic", "numpy", "pandas", "requests", "httpx")


@pytest.fixture
def no_third_party(monkeypatch):
    real = builtins.__import__

    def guard(name, *a, **kw):
        if name.split(".")[0] in THIRD_PARTY:
            raise AssertionError(f"lattice_claims reached for {name!r}; the package is stdlib only")
        return real(name, *a, **kw)

    monkeypatch.setattr(builtins, "__import__", guard)
    for mod in [m for m in sys.modules if m.split(".")[0] == "lattice_claims"]:
        sys.modules.pop(mod, None)
    yield


def test_the_package_imports_and_grades_with_no_framework(no_third_party):
    lc = importlib.import_module("lattice_claims")
    api = importlib.import_module("lattice_claims.api")

    row = api.task_row(seed=2026, index=0)
    assert row["prompt"] and row["rung"] in lc.RUNGS
    # the RUNG is the label here: naming it would hand over the answer on the
    # underspecified tasks, where noticing the gap is the whole test
    assert row["rung"] not in row["prompt"], "the prompt must not name the rung"
    assert str(row["truth"]) not in row["prompt"] or row["truth"] in ("ADMISSIBLE", "REFUSED")

    g = api.score(2026, 0, "no json here")
    assert g["certified"] == 0.0 and g["well_formed"] == 0.0 and g["verdict"] is None

    # the forgery gate runs without the framework, and must
    assert api.preflight() == {"planted": 10, "accepted": 0}


def test_importing_the_package_does_not_pull_the_framework_in():
    """Importing must not touch `verifiers`; resolving `load_environment` must.

    Checked through `sys.modules` rather than by trapping the import: the lazy
    resolver goes through `importlib.import_module`, which does NOT route via
    `builtins.__import__`, so the fixture above cannot see it."""
    for mod in [m for m in sys.modules if m.split(".")[0] in ("lattice_claims", "verifiers")]:
        sys.modules.pop(mod, None)
    lc = importlib.import_module("lattice_claims")
    assert "verifiers" not in sys.modules, "importing lattice_claims reached for the framework"
    assert "load_environment" in dir(lc)
    assert callable(lc.load_environment)
