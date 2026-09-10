"""The controls are the test suite.  A positive control that fails means the
simulator is not live; a forgery that scores means the grader is broken."""
import random

import pytest

from blind_spot import families, pool, sim
from blind_spot.design import CMAX, D, tools_missing
from blind_spot.forgeries import run
from blind_spot.taskset import RUNGS, Task, Taskset, grade, parse_pairs

pytestmark = pytest.mark.skipif(bool(tools_missing()), reason=f"missing tools: {tools_missing()}")


def test_every_control_behaves():
    rows, failed = run()
    assert rows
    assert failed == [], f"controls failed: {failed}"


def test_the_identity_never_differs_from_itself():
    ident = pool.load()["summary"]["identity"]
    rng = random.Random(1)
    pairs = [(tuple(rng.randint(-4, 3) for _ in range(D)), tuple(rng.randint(-4, 3) for _ in range(D)))
             for _ in range(200)]
    assert sim.kills(ident, pairs) == []


def test_every_witness_kills_and_every_equivalent_survives_the_families():
    P = pool.load()["mutants"]
    killable = [e for e in P if not e["equivalent"]]
    for e in killable[:40]:
        w = e["witness"]
        assert sim.kills(e["id"], [(tuple(w["u"]), tuple(w["v"]))]), e["id"]
    # an equivalent mutant survives every family, by proof; check a sample by simulation
    eq = [e for e in P if e["equivalent"] and e["klass"] != "IDENTITY"][:5]
    fam = list(families.load("mint")[:300]) + list(families.load("outbox")[:300])
    for e in eq:
        assert sim.kills(e["id"], fam) == [], e["id"]


def test_class_labels_mean_what_they_say():
    """MINT_ONLY: the mint kills it and the corpus does not.  Read from MCY, checked here."""
    P = pool.load()["mutants"]
    m = next(e for e in P if e["klass"] == "MINT_ONLY")
    assert sim.kills(m["id"], list(families.load("mint")))
    assert not sim.kills(m["id"], list(families.load("corpus")))


def test_pairs_are_parsed_strictly():
    ok = {"pairs": [{"u": [1] * D, "v": [-4] * D}]}
    assert len(parse_pairs(ok)) == 1
    for bad in ({"pairs": []}, {"pairs": [{"u": [4] * D, "v": [0] * D}]},
                {"pairs": [{"u": [1] * (D - 1), "v": [0] * D}]}, {"pairs": [[1] * 22]},
                {"pairs": [{"u": [1.0] * D, "v": [0] * D}]}, {"pairs": [{"u": [True] * D, "v": [0] * D}]},
                {"pairs": [{"u": [1] * D, "v": [0] * D}] * 9}):
        with pytest.raises(ValueError):
            parse_pairs(bad)


def test_tasks_are_deterministic_and_hide_the_label():
    a, b = Taskset(seed=3).sample(5), Taskset(seed=3).sample(5)
    assert a.mutant["id"] == b.mutant["id"] and a.rung == b.rung
    for i in range(6):
        t = Taskset(seed=3).sample(i)
        p = t.prompt()
        assert t.klass not in p and "equivalent\":" not in p and "witness" not in p.lower()
        if t.rung == "blind":
            assert "netlist line" not in p and "KILLED" not in p
        if t.rung == "profile":
            assert "-> " in p and "netlist line" not in p


def test_undecided_is_zero_and_honest():
    t = Taskset(seed=0).sample(0)
    g = grade(t, {"verdict": "UNDECIDED"})
    assert g["reward"] == 0.0 and g["outcome"] == "UNDECIDED" and g["well_formed"] == 1.0
