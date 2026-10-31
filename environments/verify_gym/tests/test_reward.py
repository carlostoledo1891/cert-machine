"""The reward cannot be bought: every planted forgery scores 0, the true bracket scores above 0, and on random
brackets the reward is positive exactly when the bracket is true. Training rows only; the held-out set is the
scorecard's."""
import json
import time
from fractions import Fraction

import pytest

from verify_gym import api, exact
from verify_gym.families import REGISTRY, Stream, frac_text
from verify_gym.forgeries import gate, green, plant
from verify_gym.task import grade, parse

ROWS = [api.family_train_row(f, i) for f in REGISTRY for i in range(4)]


@pytest.mark.parametrize("row", ROWS, ids=[r["id"] for r in ROWS])
def test_every_forgery_scores_zero_under_its_expected_verdict(row):
    for name, reply, want in plant(row):
        g = grade(row, reply)
        assert g["reward"] == 0, (name, g)
        assert g["verdict"] == want, (name, g["verdict"], want, g["note"])
    for name, reply in green(row):
        g = grade(row, reply)
        assert g["verdict"] == exact.CERTIFIED and g["reward"] > 0, (name, g)


def test_the_gate_fires_on_a_grader_that_accepts_everything_or_rejects_everything():
    rows = [api.family_train_row(f, 0) for f in REGISTRY]
    accept = lambda r, reply: {"verdict": exact.CERTIFIED, "reward": 1.0}
    reject = lambda r, reply: {"verdict": exact.MALFORMED, "reward": 0.0}
    assert gate(rows=rows)["ok"]
    assert not gate(rows=rows, grade_fn=accept)["ok"]
    assert not gate(rows=rows, grade_fn=reject)["ok"]


def _truth(row):
    F = REGISTRY[row["family"]]
    return F.hp_estimate(row["instance"], 60)          # within 10^-60 of x


@pytest.mark.parametrize("family", list(REGISTRY))
def test_on_random_brackets_the_reward_is_positive_exactly_when_the_bracket_is_true(family):
    """300 brackets per family: random widths from 10^-1 to 10^-14 around a random centre near x."""
    s = Stream(family, "test", 0)
    hits = 0
    for i in range(300):
        row = api.family_train_row(family, i % 10)
        x = _truth(row)
        F = REGISTRY[family]
        w = Fraction(1, 10 ** s.between(1, 14 if family != "xx" else 5))
        c = x + w * Fraction(s.between(-1500, 1500), 1000)
        lo, hi = c - w / 2, c + w / 2
        lim = F.limit // (10 * (abs(int(x)) + 2))          # numerator and denominator both under the limit
        lo, hi = lo.limit_denominator(lim), hi.limit_denominator(lim)
        if lo >= hi or abs(lo - x) < Fraction(1, 10 ** 50) or abs(hi - x) < Fraction(1, 10 ** 50):
            continue
        if lo < Fraction(row["lo0"]) or hi > Fraction(row["hi0"]):
            continue
        g = grade(row, json.dumps({"lo": frac_text(lo), "hi": frac_text(hi)}))
        true = lo < x < hi
        assert (g["verdict"] == exact.CERTIFIED) == true, (row["id"], lo, hi, g)
        assert (g["reward"] > 0) == (true and exact.decimals(hi - lo) > row["d0"]), (row["id"], g)
        hits += true
    assert hits > 20


def test_decimals_is_the_exact_floor():
    assert exact.decimals(Fraction(1, 10)) == 1
    assert exact.decimals(Fraction(1, 11)) == 1
    assert exact.decimals(Fraction(1, 9)) == 0
    assert exact.decimals(Fraction(1, 10 ** 12)) == 12
    assert exact.decimals(Fraction(10 ** 12 + 1, 10 ** 24)) == 11
    assert exact.decimals(Fraction(7, 2)) == 0


def test_progress_is_beyond_the_stated_bracket_and_capped():
    row = api.family_train_row("kroot", 2)            # sqrt(58), stated (7, 8), d0 0
    lo, hi = Fraction(76157731058639, 10 ** 13), Fraction(76157731058640, 10 ** 13)
    g = grade(row, json.dumps({"lo": frac_text(lo), "hi": frac_text(hi)}))
    assert g["verdict"] == "CERTIFIED" and g["decimals"] == 13 and g["progress"] == 13
    assert g["reward"] == 13 / 20
    g = grade(row, json.dumps({"lo": "7", "hi": "8"}))
    assert g["verdict"] == "CERTIFIED" and g["reward"] == 0


def test_json_numbers_are_read_as_text_never_as_floats():
    lo, hi, why = parse('{"lo": 7.6157731058639, "hi": 7.6157731058640}')
    assert (lo, hi) == ("7.6157731058639", "7.6157731058640")
    assert exact.read_rational(lo)[0] == Fraction(76157731058639, 10 ** 13)


def test_only_the_last_answer_is_graded():
    row = api.family_train_row("kroot", 2)
    good, bad = '{"lo": "7.6", "hi": "7.7"}', '{"lo": "7.7", "hi": "7.8"}'
    assert grade(row, good + "\n" + bad)["verdict"] == "REFUTED"
    assert grade(row, bad + "\n" + good)["verdict"] == "CERTIFIED"


def test_a_huge_answer_is_refused_before_any_arithmetic():
    row = api.family_train_row("xx", 0)
    for reply in ('{"lo": "%s", "hi": "%s"}' % ("9" * 10 ** 6, "9" * 10 ** 6 + "9"),
                  '{"lo": "%s/1", "hi": "%s/1"}' % ("7" * 80, "8" * 80),
                  '{"lo": "7/1", "hi": "99999999/12345678"}'):
        t = time.time()
        g = grade(row, reply)
        assert g["verdict"] == "MALFORMED" and time.time() - t < 0.5, (g["note"], time.time() - t)


def test_a_true_side_outside_the_reduction_pays_nothing():
    row = api.family_train_row("xx", 1)               # x^x = 28, x ~ 3.0173
    assert grade(row, '{"lo": "1/2", "hi": "4"}')["verdict"] == "REFUSED"
    assert grade(row, '{"lo": "1", "hi": "4"}')["verdict"] == "CERTIFIED"    # 1 is the whole-number case: 1^1 < 28


def test_the_root_itself_is_refuted_on_both_strict_sides():
    # (bx - a)^2 (x + c) - e has no rational root; use a polynomial with one, built here, to exercise P(a) = 0
    inst = {"coeffs": [1, 0, -2], "lo0": "1", "hi0": "2"}                # x^2 - 2: sqrt 2
    assert exact.side("poly", inst, "gt", Fraction(7, 5))[0] == "CERTIFIED"
    inst2 = {"coeffs": [2, -3], "lo0": "1", "hi0": "2"}                  # 2x - 3: the root 3/2
    assert exact.side("poly", inst2, "gt", Fraction(3, 2))[0] == "REFUTED"
    assert exact.side("poly", inst2, "lt", Fraction(3, 2))[0] == "REFUTED"
    assert exact.side("xx", {"N": 27}, "gt", Fraction(3))[0] == "REFUTED"   # 3^3 = 27: x = 3 exactly
    assert exact.side("xx", {"N": 27}, "lt", Fraction(3))[0] == "REFUTED"


def test_an_isolation_that_does_not_verify_is_refused_wholesale():
    inst = {"coeffs": [1, 0, -2], "lo0": "-2", "hi0": "2"}               # two roots inside
    assert exact.side("poly", inst, "gt", Fraction(0))[0] == "REFUSED"
