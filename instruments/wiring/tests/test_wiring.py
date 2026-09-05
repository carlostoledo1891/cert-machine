"""The graph is the submission, so building it is the grading."""
import pytest

from lattice_claims.wiring import (CATALOGUE, SINK, WiringRefused, build,
                                   grade_wiring, WiringTaskset)

GOOD = {"nodes": ["basis", "norm", "pi_bracket", "gh_exact", "report"],
        "wires": [["basis", "q", "gh_exact", "q"], ["norm", "value", "gh_exact", "norm"],
                  ["pi_bracket", "bracket", "gh_exact", "pi"],
                  ["gh_exact", "refuted", "report", "verdict"]]}


def wires_but(swap):
    w = [x[:] for x in GOOD["wires"]]
    return {"nodes": list(GOOD["nodes"]), "wires": w[:-1] + [swap]}


def test_the_right_wiring_scores():
    r = grade_wiring("REFUSED", GOOD)
    assert r == {"certified": 1.0, "well_formed": 1.0, "not_hacked": 1.0, "why": ""}


def test_the_wrong_port_is_not_the_right_answer():
    r = grade_wiring("REFUSED", wires_but(["gh_exact", "certified", "report", "verdict"]))
    assert r["certified"] == 0.0 and r["well_formed"] == 1.0


def test_a_float_may_not_reach_the_verdict_port():
    sub = {"nodes": ["basis", "norm", "gh_tolerance", "report"],
           "wires": [["basis", "q", "gh_tolerance", "q"], ["norm", "value", "gh_tolerance", "norm"],
                     ["gh_tolerance", "verdict", "report", "verdict"]]}
    r = grade_wiring("REFUSED", sub)
    assert r["certified"] == 0.0 and r["well_formed"] == 0.0
    assert "FLOAT FIREBREAK" in r["why"] and "may never reach a verdict" in r["why"]


def test_a_dangling_deciding_port_decides_nothing():
    sub = {"nodes": ["basis", "norm", "gh_exact", "report"],
           "wires": [["basis", "q", "gh_exact", "q"], ["norm", "value", "gh_exact", "norm"],
                     ["gh_exact", "refuted", "report", "verdict"]]}
    r = grade_wiring("REFUSED", sub)
    assert r["certified"] == 0.0
    assert "nothing wired to it" in r["why"] and "pi" in r["why"]


def test_two_things_may_not_decide_at_once():
    sub = {"nodes": GOOD["nodes"] + ["gh_tolerance"],
           "wires": GOOD["wires"] + [["gh_exact", "certified", "report", "verdict"]]}
    r = grade_wiring("REFUSED", sub)
    assert r["certified"] == 0.0 and "exactly one may decide" in r["why"]


def test_unknown_instruments_and_ports_are_refused():
    assert "no such instrument" in grade_wiring("REFUSED", {"nodes": ["oracle"], "wires": []})["why"]
    bad = {"nodes": ["gh_exact", "report"], "wires": [["gh_exact", "maybe", "report", "verdict"]]}
    assert "no output" in grade_wiring("REFUSED", bad)["why"]


def test_a_float_screen_may_still_prune():
    """The firebreak forbids deciding, not existing."""
    sub = {"nodes": GOOD["nodes"] + ["float_screen"],
           "wires": GOOD["wires"] + [["basis", "q", "float_screen", "q"]]}
    assert grade_wiring("REFUSED", sub)["certified"] == 1.0


def test_tasks_are_deterministic_and_carry_a_truth():
    a = WiringTaskset(seed=1).sample(0)
    b = WiringTaskset(seed=1).sample(0)
    assert a.q == b.q and a.norm_squared == b.norm_squared
    assert a.truth in ("ADMISSIBLE", "REFUSED")
    assert "report.verdict" in a.prompt() and "FIREBREAK" not in a.prompt()
