"""Planted controls, run before any model is called.

Two kinds, and both are needed.  A forgery is a submission that must NOT score:
if one does, the grader is broken and the run refuses to report.  A positive
control is a submission that MUST score: if one does not, the simulator is not
live, and a suite that fails everything would otherwise read as perfect
coverage -- the lesson this environment is named for.

    identity_declared_killed       KILL, eight corpus pairs, on the unmutated design    -> WRONG
    equivalent_declared_killed     KILL on a mutant the miter proved equivalent        -> WRONG
    killable_declared_equivalent   EQUIVALENT on a mutant with a verified witness      -> WRONG
    miss_is_not_a_kill             eight corpus pairs on a mutant only the mint sees   -> MISSED, reward 0
    nine_pairs                     one pair over the budget                            -> REFUSED_PARSE
    coordinate_out_of_range        a coordinate of 4, which no 3-bit pin can carry     -> REFUSED_PARSE, never masked
    wrong_dimension                ten coordinates                                     -> REFUSED_PARSE
    flat_pair                      u and v run together in one list                    -> REFUSED_PARSE

    sat_witness_kills              the SAT counterexample on a killable mutant         -> SOLVED   (positive)
    identity_declared_equivalent   EQUIVALENT on the unmutated design                  -> SOLVED   (positive)
    outbox_kill_uses_validity      the out-of-box pair that kills an OUTBOX_ONLY mutant -> SOLVED, in_box_kill False (positive)
"""
import random

from . import families
from . import pool as _pool
from .taskset import EQUIVALENT, KILL, Task, grade

__all__ = ["build", "run"]


def _first(klass, rng):
    xs = [e for e in _pool.load()["mutants"] if e["klass"] == klass]
    if not xs:
        raise RuntimeError(f"the pool has no {klass} mutant; the control cannot be built")
    return rng.choice(xs)


def _pairs(fam, n, rng):
    return [{"u": list(u), "v": list(v)} for u, v in rng.sample(families.load(fam), n)]


def _killer_from(fam, m):
    """The first member of a family that kills m -- what the profile rung's
    label promises exists.  Eight RANDOM members of a 4000-pair family are not
    that: a mutant on the box check of one coordinate is killed only by pairs
    that spoil that coordinate, about one in ten of the out-of-box family, so a
    draw of eight misses it half the time.  That is a fact about the task, not
    about the grader, and the control is built so it tests the grader."""
    from . import sim
    hits = sim.kills(m["id"], list(families.load(fam)))
    if not hits:
        raise RuntimeError(f"mutant {m['id']} is tagged {m['klass']} but no {fam} pair kills it")
    u, v, _, _ = hits[0]
    return [{"u": list(u), "v": list(v)}]


def build(seed=7):
    """(name, task, submission, expect: {field: value}, note).  `expect` names
    the grade fields that must come out exactly so."""
    rng = random.Random(seed)
    ident = _first("IDENTITY", rng)
    eqv = _first("NOCHANGE", rng)
    cov = _first("COVERED", rng)
    mint_only = _first("MINT_ONLY", rng)
    outbox_only = _first("OUTBOX_ONLY", rng)
    T = lambda m, rung="located": Task("forgery", rung, m)
    out = [
        ("identity_declared_killed", T(ident, "blind"),
         {"verdict": KILL, "pairs": _pairs("corpus", 8, rng)},
         {"outcome": "WRONG", "reward": -1.0, "false_claim": 1.0},
         "eight certified pairs against the unmutated design: nothing can flip, and claiming it costs"),
        ("equivalent_declared_killed", T(eqv),
         {"verdict": KILL, "pairs": _pairs("mint", 8, rng)},
         {"outcome": "WRONG", "reward": -1.0},
         "the miter proved this mutant changes nothing"),
        ("killable_declared_equivalent", T(cov),
         {"verdict": EQUIVALENT},
         {"outcome": "WRONG", "reward": -1.0, "false_claim": 1.0},
         "a witness exists and the grader names it"),
        ("miss_is_not_a_kill", T(mint_only),
         {"verdict": KILL, "pairs": _pairs("corpus", 8, rng)},
         {"outcome": "MISSED", "reward": 0.0},
         "the corpus cannot see this mutant; a miss scores zero, not one and not minus one"),
        ("nine_pairs", T(cov),
         {"verdict": KILL, "pairs": _pairs("mint", 9, rng)},
         {"outcome": "REFUSED_PARSE", "reward": 0.0, "well_formed": 0.0},
         "the budget is eight"),
        ("coordinate_out_of_range", T(cov),
         {"verdict": KILL, "pairs": [{"u": [4] + [0] * 10, "v": [1] * 11}]},
         {"outcome": "REFUSED_PARSE", "well_formed": 0.0},
         "4 is not a 3-bit value; masking it to -4 would test a pair the model did not name"),
        ("wrong_dimension", T(cov),
         {"verdict": KILL, "pairs": [{"u": [1] * 10, "v": [1] * 10}]},
         {"outcome": "REFUSED_PARSE"},
         "the design has eleven coordinates"),
        ("flat_pair", T(cov),
         {"verdict": KILL, "pairs": [[1] * 22]},
         {"outcome": "REFUSED_PARSE"},
         "a pair is {u, v}, not one list"),
        # ---- positive controls: these MUST score, or the simulator is not live
        ("sat_witness_kills", T(cov),
         {"verdict": KILL, "pairs": [{"u": cov["witness"]["u"], "v": cov["witness"]["v"]}]},
         {"outcome": "SOLVED", "reward": 1.0},
         "the SAT counterexample, re-run through the netlist"),
        ("identity_declared_equivalent", T(ident, "blind"),
         {"verdict": EQUIVALENT},
         {"outcome": "SOLVED", "reward": 1.0},
         "the unmutated design is equivalent to itself"),
        ("outbox_kill_uses_validity", T(outbox_only, "profile"),
         {"verdict": KILL, "pairs": _killer_from("outbox", outbox_only)},
         {"outcome": "SOLVED", "reward": 1.0, "in_box_kill": False},
         "a mutant only the out-of-box family sees, killed by an invalid input, and the grader says so"),
    ]
    return out


def run(seed=7):
    rows, failed = [], []
    for name, task, sub, expect, note in build(seed):
        g = grade(task, sub)
        ok = all(g.get(k) == v for k, v in expect.items())
        rows.append((name, expect, ok, note, g))
        if not ok:
            failed.append(name)
    return rows, failed
