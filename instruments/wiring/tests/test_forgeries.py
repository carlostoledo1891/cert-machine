"""The abort gate. If a forgery is accepted, nothing else about a run matters."""

import random
from fractions import Fraction

import pytest

from lattice_claims.certify.exact import (ADMISSIBLE, REFUSED, IngestError,
                                          decide, in_lattice, norm_sq,
                                          pi_bracket, ratio_bracket)
from lattice_claims.forgeries import run
from lattice_claims.generate import mint, wall_norm
from lattice_claims.taskset import NEEDS_DATA, STRADDLES, Taskset, grade

PI60 = ("3141592653589793238462643383279502884197169399375105820974944592307816"
        "40628620899862803482534211706798214808651328230664709")


def test_no_forgery_is_accepted():
    rows, accepted = run()
    assert rows, "no forgeries were built"
    assert accepted == [], f"forgeries accepted: {accepted}"


def test_pi_bracket_actually_brackets():
    for d in (10, 30, 60, 100):
        lo, hi, S = pi_bracket(d)
        truth = int(PI60[:d + 1]) if d < len(PI60) else None
        assert lo < hi
        if truth is not None:
            assert lo <= truth <= hi, f"{d} digits: {lo} .. {truth} .. {hi}"
        assert hi - lo <= 6


def test_floats_are_refused_at_ingest():
    with pytest.raises(IngestError):
        decide(24, 101, 4.0)
    with pytest.raises(IngestError):
        decide(24, 101, 4, factor=1.05)
    with pytest.raises(IngestError):
        norm_sq([1, 2.0, 3])


def test_zero_vector_is_never_a_solution():
    ts = Taskset(seed=1)
    t = ts.sample(0, rung="declared")
    t.data.claim["vector"] = ["0"] * t.data.lattice["n"]
    r = grade(t, {"verdict": ADMISSIBLE, "reference": {"norm_squared": 0, "factor": "21/20"}})
    assert r["certified"] == 0.0


def test_membership_is_exact_not_approximate():
    rng = random.Random(4)
    ins = mint(24, 240, 1.0, 3e-3, rng)
    assert in_lattice(ins.q, ins.xs, ins.v)
    off = list(ins.v)
    off[0] += 1
    assert not in_lattice(ins.q, ins.xs, off)


def test_the_wall_is_where_the_verdict_flips():
    rng = random.Random(5)
    ins = mint(24, 240, 1.0, 5e-2, rng)
    N = wall_norm(ins.n, ins.q)
    assert decide(ins.n, ins.q, N * N) == ADMISSIBLE
    assert decide(ins.n, ins.q, (N + 1) ** 2) == REFUSED


def test_ratio_bracket_contains_and_is_tight():
    rng = random.Random(6)
    ins = mint(24, 240, 0.9, 5e-2, rng)
    lo, hi = ratio_bracket(ins.n, ins.q, ins.norm_squared)
    assert lo <= hi and float(hi - lo) < 1e-9


def test_a_straddling_claim_is_reported_as_straddling():
    ts = Taskset(seed=2)
    found = False
    for i in range(60):
        t = ts.sample(i, rung="printed")
        if t._truth == STRADDLES:
            found = True
            assert grade(t, {"verdict": ADMISSIBLE,
                             "reference": {"norm_squared": None, "factor": "21/20"}})["certified"] == 0.0
            assert grade(t, {"verdict": STRADDLES,
                             "reference": {"norm_squared": None, "factor": "21/20"}})["certified"] == 1.0
            break
    assert found, "no straddling instance was minted in 60 draws"


def test_right_verdict_from_the_wrong_reference_is_not_well_formed():
    ts = Taskset(seed=3)
    t = ts.sample(0, rung="declared")
    v = [int(c) for c in t.data.claim["vector"]]
    ns = norm_sq(v)
    good = grade(t, {"verdict": t._truth, "reference": {"norm_squared": ns, "factor": "21/20"}})
    slipped = grade(t, {"verdict": t._truth,
                        "reference": {"norm_squared": round(ns ** 0.5) ** 2, "factor": "21/20"}})
    assert good["well_formed"] == 1.0
    assert slipped["certified"] == 1.0 and slipped["well_formed"] == 0.0


def test_the_missing_field_is_read_where_models_put_it_and_only_there():
    """Shapes taken from the stored run: one model nests `missing` inside
    `reference`, another writes the name with a parenthetical explanation.
    Both name the gap.  A wrong gap with the right word elsewhere does not."""
    ts = Taskset(seed=8)
    t = next(ts.sample(i, rung="underspecified") for i in range(60)
             if ts.sample(i, rung="underspecified").data.missing == "lattice.q")
    nested = {"verdict": NEEDS_DATA, "reference": {"norm_squared": 5, "factor": "21/20",
              "missing": "q (the lattice determinant/modulus for the Gaussian heuristic)"}}
    prose = {"verdict": NEEDS_DATA, "missing": "q - the lattice volume or fundamental quality measure"}
    wrong = {"verdict": NEEDS_DATA, "missing": "factor (q is given, GH needs the modulus q)"}
    assert grade(t, nested)["certified"] == 1.0
    assert grade(t, prose)["certified"] == 1.0
    assert grade(t, wrong)["certified"] == 0.0
