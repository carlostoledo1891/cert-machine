"""The two graders of 0.2.0, and the promise that 0.2.0 moved no task.

Standard library only: these run with or without `verifiers` installed.

The generator pins below were taken from 0.1.0 BEFORE the change. Every stored
rollout is addressed by (seed, index) alone, so a generator that drifted would
silently re-point the record at different tasks; the regrade in battery.py would
see it as moved rows, and these see it first, by name.
"""
import hashlib

import pytest

from lattice_claims import api
from lattice_claims.policies import run_policy
from lattice_claims.taskset import (ABSTAIN, DEFINITE, NEEDS_DATA, RUNGS,
                                    STRADDLES, Taskset, grade, grade_key)


def _digest(ts, indices):
    m = hashlib.sha256()
    for i in indices:
        t = ts.sample(i)
        m.update(t.prompt().encode())
        m.update(str(t._truth).encode())
        m.update(t.id.encode())
    return m.hexdigest()


def test_the_generator_is_byte_identical_to_010_at_the_default_dims():
    assert _digest(Taskset(seed=2026), range(12)) == \
        "ad9a2e200416bdeea16e274eba235b54e8a84bc34dc3b05f5b0d91e00ea24e2c"


def test_the_generator_is_byte_identical_to_010_at_the_training_dims():
    assert _digest(Taskset(seed=2026, dims=(8, 12, 16)), range(45)) == \
        "f1a4493a277baf48424577118166a099d3a402c4041262844e5f76f4ef6927e4"


def test_the_default_mix_is_the_010_cycle_and_a_weighted_mix_cycles_as_declared():
    assert [Taskset(seed=1, dims=(8,)).sample(i).data.rung for i in range(6)] == list(RUNGS) * 2
    ts = Taskset(seed=1, dims=(8,), mix=(2, 1, 1))
    assert [ts.sample(i).data.rung for i in range(8)] == \
        ["declared", "declared", "printed", "underspecified"] * 2
    assert {Taskset(seed=1, dims=(8,), mix=(1, 0, 1)).sample(i).data.rung for i in range(6)} == \
        {"declared", "underspecified"}


@pytest.mark.parametrize("mix", [(0, 0, 0), (1, 1), (1, -1, 1)])
def test_a_mix_that_names_no_rung_or_the_wrong_number_is_refused(mix):
    with pytest.raises(ValueError):
        Taskset(seed=1, mix=mix)


def test_the_key_is_binary_and_is_the_complete_instance_verdict():
    """Where the exact grader decides a definite verdict, the key agrees with it;
    where the exact answer is an abstention, the key still holds a side."""
    ts = Taskset(seed=7, dims=(8, 12, 16))
    seen = set()
    for i in range(90):
        t = ts.sample(i)
        assert t.key in DEFINITE
        if t._truth in DEFINITE:
            assert t.key == t._truth
        seen.add(t._truth)
    assert {STRADDLES, NEEDS_DATA} <= seen, "the sample must exercise both abstentions"


def test_the_answer_key_never_pays_an_abstention():
    ts = Taskset(seed=7, dims=(8, 12, 16))
    for i in range(30):
        t = ts.sample(i)
        for v in ABSTAIN:
            sub = {"verdict": v, "missing": t.data.missing or "q"}
            assert grade_key(t, sub) == 0.0
        assert grade_key(t, {"verdict": t.key}) == 1.0


def test_the_two_graders_pay_for_opposite_things():
    """THE INCENTIVE, measured with no model: under the answer key the guesser
    (`careful` fills a missing factor and picks a side on a straddle) beats the
    honest `exact` policy; under the exact grader the order reverses."""
    ts = Taskset(seed=2026, dims=(8, 12, 16))
    n = 15
    tasks = [ts.sample(i * 3 + RUNGS.index(r), rung=r) for r in RUNGS for i in range(n)]
    tot = {p: {f: sum(g[f] for g in run_policy(p, tasks)) for f in ("certified", "key_match")}
           for p in ("exact", "careful")}
    assert tot["exact"]["certified"] == 3 * n
    assert tot["careful"]["key_match"] > tot["exact"]["key_match"]
    assert tot["exact"]["certified"] > tot["careful"]["certified"]


def test_api_carries_dims_and_mix_and_scores_under_both_graders():
    row = api.task_row(2026, 3, dims=[8, 12, 16], mix=[1, 0, 1])
    assert row["dims"] == [8, 12, 16] and row["mix"] == [1, 0, 1]
    t = api.make_taskset(2026, [8, 12, 16], [1, 0, 1]).sample(3)
    assert t.prompt() == row["prompt"]
    assert row["rung"] == "underspecified"      # mix (1, 0, 1) cycles declared, underspecified

    honest = '{"verdict": "NEEDS_DATA", "missing": "%s"}' % row["missing"].split(".")[1]
    g = api.score(2026, 3, honest, dims=[8, 12, 16], mix=[1, 0, 1])
    assert (g["certified"], g["key_match"], g["abstained"], g["confident_wrong"]) == (1.0, 0.0, 1.0, 0.0)

    guess = '{"verdict": "%s"}' % t.key
    g = api.score(2026, 3, guess, dims=[8, 12, 16], mix=[1, 0, 1])
    assert (g["certified"], g["key_match"], g["abstained"], g["confident_wrong"]) == (0.0, 1.0, 0.0, 1.0)


def test_a_row_scored_without_dims_means_the_010_defaults():
    """The stored records carry (seed, index) only, and must keep meaning what
    they meant: the default task, not the training task."""
    row = api.task_row(2026, 0)
    assert row["dims"] == [24, 40, 60, 90] and row["mix"] == [1, 1, 1]
    reply = '{"verdict": "%s"}' % row["truth"]
    assert api.score(2026, 0, reply)["certified"] == api.score(2026, 0, reply, [24, 40, 60, 90], [1, 1, 1])["certified"]


def test_an_unreadable_reply_is_neither_an_abstention_nor_a_confident_error():
    g = api.score(2026, 0, "probably fine")
    assert g["verdict"] is None
    assert (g["certified"], g["key_match"], g["abstained"], g["confident_wrong"]) == (0.0, 0.0, 0.0, 0.0)


def test_the_exact_grader_is_untouched_by_the_key():
    """`grade` must not read `key`: a task whose key is wrong grades the same."""
    t = Taskset(seed=3, dims=(8,)).sample(0)
    sub = {"verdict": t._truth, "reference": {"norm_squared": 1, "factor": "21/20"}}
    before = grade(t, sub)
    t.key = "REFUSED" if t.key == "ADMISSIBLE" else "ADMISSIBLE"
    assert grade(t, sub) == before
