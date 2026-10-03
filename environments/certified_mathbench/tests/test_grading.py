"""The grader, exercised on the record: every green control certifies, every red control refutes, prose is
malformed and not refuted, a right object at a higher rung is rejected and not refuted."""
import json

from certified_mathbench import api


def _f(name):
    return api._bench()[name]


def test_every_green_control_certifies_and_every_red_control_refutes():
    gate = api.preflight()
    assert (gate["green"], gate["red"]) == (28, 20)


def test_the_ladder_is_the_dataset_and_five_rungs_are_beyond_the_record():
    R = api.rungs()
    assert len(R) == 46
    assert sum(r["beyond"] for r in R) == 5
    assert [r["family"] for r in R[:6]] == ["golomb"] * 6


def test_a_reply_with_the_optimal_ruler_is_certified_and_a_forged_one_refuted():
    g = _f("golomb")
    t = (13, 106)
    idx = next(r["rung_index"] for r in (api.task_row(i) for i in range(46)) if r["family"] == "golomb" and json.loads(r["target"]) == list(t))
    good = g.green_controls(t)[0]
    bad = g.red_controls(t)[0]
    assert api.score(idx, "Here it is: " + json.dumps(list(good)))["outcome"] == "certified"
    assert api.score(idx, json.dumps(list(bad)))["outcome"] == "refuted"
    assert api.score(idx, "I believe the answer is around 106.")["outcome"] == "malformed"


def test_a_right_object_at_a_higher_rung_is_rejected_not_refuted():
    k = _f("kissing")
    d4 = k.green_controls((4, 24))[0]
    assert api.grade_object("kissing", (4, 24), d4)["outcome"] == "certified"
    assert api.grade_object("kissing", (4, 25), d4)["outcome"] == "rejected"


def test_the_baseline_certifies_only_the_easy_rungs():
    rows = api.baseline_table()
    c = [r["label"] for r in rows if r["outcome"] == "certified"]
    assert 0 < len(c) < len(rows)
    assert not any(r["beyond"] and r["outcome"] == "certified" for r in rows)


def test_sample_permutes_the_ladder_and_cycles_it():
    s = api.sample(46, seed=2026)
    assert sorted(r["rung_index"] for r in s) == list(range(46))
    assert api.sample(50, seed=2026)[46]["rung_index"] == s[0]["rung_index"]
