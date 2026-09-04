"""The environment's soundness, as tests — so the Hub's CI re-runs them.

These are not unit tests of convenience. Each one is a way this environment
could report a number that is not true, demonstrated failing.
"""
import math
from fractions import Fraction

from certificate_band_gym.band import band_measure, key_at, mint_attack, verify_attack
from certificate_band_gym.facts import FACTS, EXACT_INTEGER, NONDEGENERATE
from certificate_band_gym.forgeries import gate
from certificate_band_gym.task import grade, make_task

SEEDS = range(256)


def test_corpus_is_certified_and_pinned():
    assert len(FACTS) >= 50
    for f in FACTS:
        assert f.lo <= f.hi
        if f.record is not None:
            assert f.sha256, f"{f.id} names a record with no sha pin"


def test_every_generated_witness_verifies():
    """The generator's own attack must survive the grader it was minted against."""
    for s in SEEDS:
        t = make_task(s)
        if t.attackable:
            assert t.witness is not None
            ok, why = verify_attack(t.fact, t.grader.accepts, t.witness)
            assert ok, f"seed {s}: minted witness does not verify — {why}"
            assert grade(t, {"attack": t.witness})["score"] == 1.0


def test_impossible_rungs_accept_no_attack_and_nothing_else():
    """A rung with no witness must reward NO_ATTACK and must not be breakable."""
    for s in SEEDS:
        t = make_task(s)
        if t.attackable:
            continue
        assert grade(t, {"verdict": "NO_ATTACK"})["score"] == 1.0
        if t.grader.acceptance:
            assert mint_attack(t.fact, *t.grader.acceptance) is None


def test_both_standing_answers_lose_somewhere():
    """Always-attack and never-attack must each fail part of the ladder, or the
    environment rewards a reflex instead of a decision."""
    always = sum(grade(make_task(s), {"attack": float(make_task(s).fact.hi) + 1e-30})["score"] >= 1
                 for s in SEEDS)
    never = sum(grade(make_task(s), {"verdict": "NO_ATTACK"})["score"] >= 1 for s in SEEDS)
    assert always < len(SEEDS), "always-attack solves everything"
    assert never < len(SEEDS), "never-attack solves everything"
    assert never > 0, "no rung is unbreakable — the ladder has no floor"


def test_the_band_is_exact_not_floating_point():
    """A band computed in floats would call this rung non-empty; it is empty."""
    f = EXACT_INTEGER[0]
    key = key_at(f, Fraction(1, 2))
    tol = Fraction(1, 10 ** 15)
    assert band_measure(f, key - tol, key + tol) > 0, "the real band is non-empty"
    assert mint_attack(f, key - tol, key + tol) is None, (
        "no double lies strictly inside a band narrower than one ulp")


def test_forgery_gate_is_green():
    g = gate(SEEDS)
    assert g["planted"] > 500
    assert g["ok"], f"{g['leaked']} forgeries scored: {g['failures'][:3]}"


def test_a_wrong_claim_costs_more_than_a_refusal():
    """Claiming a break that does not verify must be scored worse than saying
    there is none — otherwise the environment teaches bravado."""
    for s in SEEDS:
        t = make_task(s)
        if not t.attackable:
            false_claim = grade(t, {"attack": float(t.fact.midpoint)})["score"]
            honest = grade(t, {"verdict": "NO_ATTACK"})["score"]
            assert false_claim < honest
