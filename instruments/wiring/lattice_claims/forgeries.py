"""Forgeries, planted before any model is called.

Each is a submission that must NOT be accepted, together with which reward has
to register the refusal. Two of them are not fabrications: `rounded_reference`
is a mistake we made ourselves on real published data and did not notice until
the discrepancies all turned out to be the size of half a unit of norm, and
`overflow_canary` is what happens to a float grader on any challenge lattice
past dimension ~102, where the determinant exceeds what a double can hold.

If any forgery is accepted the suite aborts. A grader that cannot catch these
is not a grader.
"""

import random
from fractions import Fraction

from .certify.exact import REFUSED, decide, norm_sq
from .generate import mint
from .taskset import NEEDS_DATA, STRADDLES, Taskset, grade

__all__ = ["build", "run"]


def _declared(ts, rng, aim=1.02, n=40):
    ins = mint(n, ts.bpd * n, aim, 2.5e-4, rng)
    return ts._shape("forgery", "declared", ins, rng), ins


def build(seed=99):
    """(name, task, submission, reward_that_must_be_zero, note)"""
    ts = Taskset(seed=seed)
    rng = random.Random(seed)
    out = []

    # 1. a vector that is simply not in the lattice
    task, ins = _declared(ts, rng)
    bad = list(task.data.claim["vector"])
    bad[0] = str(int(bad[0]) + 1)
    t2 = ts._shape("f1", "declared", ins, rng)
    t2.data.claim["vector"] = bad
    out.append(("not_in_lattice", t2,
                {"verdict": "ADMISSIBLE",
                 "reference": {"norm_squared": norm_sq([int(c) for c in bad]), "factor": "21/20"}},
                "certified", "membership fails, so the claim fails"))

    # 2. the zero vector, which is short and is not a solution
    t3 = ts._shape("f2", "declared", ins, rng)
    t3.data.claim["vector"] = ["0"] * ins.n
    out.append(("zero_vector", t3,
                {"verdict": "ADMISSIBLE", "reference": {"norm_squared": 0, "factor": "21/20"}},
                "certified", "the zero vector is excluded by v != 0"))

    # 3. a vector for a neighbouring lattice
    t4 = ts._shape("f3", "declared", ins, rng)
    t4.data.lattice["xs"] = [str(int(t4.data.lattice["xs"][0]) + 1)] + t4.data.lattice["xs"][1:]
    out.append(("neighbour_lattice", t4,
                {"verdict": "ADMISSIBLE",
                 "reference": {"norm_squared": ins.norm_squared, "factor": "21/20"}},
                "certified", "one basis entry moved, so the vector left the lattice"))

    # 4. THE ONE THAT CAUGHT US: right arithmetic, wrong reference
    task, ins = _declared(ts, rng, aim=1.0499)
    N = round(ins.norm_squared ** 0.5)
    out.append(("rounded_reference", task,
                {"verdict": task._truth, "reference": {"norm_squared": N * N, "factor": "21/20"}},
                "well_formed",
                "verdict happens to be right; it was decided against the rounded norm"))

    # 5. a factor swapped behind a correct-looking declaration
    task, ins = _declared(ts, rng, aim=1.03)
    out.append(("factor_swap", task,
                {"verdict": REFUSED, "reference": {"norm_squared": ins.norm_squared, "factor": "1"}},
                "well_formed", "decided at factor 1 while the task states 21/20"))

    # 6. a confident verdict where a quantity is missing
    t6 = ts.sample(2, rung="underspecified")
    out.append(("confident_on_underspecified", t6,
                {"verdict": "ADMISSIBLE", "reference": {"norm_squared": 1, "factor": "21/20"}},
                "certified", "a required quantity is absent; only NEEDS_DATA is correct"))

    # 7. naming the wrong gap
    t7 = ts.sample(5, rung="underspecified")
    wrong = "lattice.n" if t7.data.missing != "lattice.n" else "claim.factor"
    out.append(("wrong_gap_named", t7,
                {"verdict": NEEDS_DATA, "missing": wrong},
                "certified", "refusing is right, naming the wrong quantity is not"))

    # 7b. THE SECOND ONE THAT CAUGHT US: the right verdict, the wrong gap named,
    #     and the true gap's name present only as a key of the submission's own
    #     reference block.  The first grader searched the whole reply as prose
    #     and accepted this.
    for i in range(60):
        t7b = ts.sample(i, rung="underspecified")
        if t7b.data.missing == "claim.factor":
            out.append(("gap_named_in_own_schema", t7b,
                        {"verdict": NEEDS_DATA, "missing": "q",
                         "reference": {"norm_squared": 1, "factor": "21/20"}},
                        "certified", "names q as missing; 'factor' appears only as its own key"))
            break

    # 8. a straddle called definite
    for i in range(60):
        t8 = ts.sample(i, rung="printed")
        if t8._truth == STRADDLES:
            out.append(("straddle_called_definite", t8,
                        {"verdict": "ADMISSIBLE", "reference": {"norm_squared": None, "factor": "21/20"}},
                        "certified", "a rounded norm does not determine this claim"))
            break

    # 9. the float grader going blind past dimension ~102
    ins = mint(120, 10 * 120, 1.09, 3e-3, random.Random(seed + 1))
    t9 = ts._shape("f9", "declared", ins, rng)
    out.append(("overflow_canary", t9,
                {"verdict": "ADMISSIBLE",
                 "reference": {"norm_squared": ins.norm_squared, "factor": "21/20"}},
                "certified", "float(q) is inf here, so a float grader accepts anything"))
    return out


def run(seed=99):
    rows, accepted = [], []
    for name, task, sub, must, note in build(seed):
        r = grade(task, sub)
        caught = r.get(must, 0.0) == 0.0
        rows.append((name, must, caught, note, r))
        if not caught:
            accepted.append(name)
    return rows, accepted
