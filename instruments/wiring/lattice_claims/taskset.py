"""The taskset: three rungs of one dial -- how much of the reference is stated.

The dial is not exact-versus-float. We measured that and it is the weaker axis:
a careful float grader agrees with the exact one on all 37 published records we
checked, because the tightest margin in that table is 1.4e-4 against a double's
1e-16. Precision is not where this domain breaks.

Specification is. A grader can be bit-exact and still wrong because it compared
against a quantity the claim was not about -- an error we made ourselves, on
real data, and caught only because the discrepancies were all the size of half
a unit of norm. So the rungs run:

    declared        every quantity exact and stated. One right answer.
    printed         the norm is given as a whole number, as published tables
                    give it. The claim may be genuinely undecidable, and
                    STRADDLES is then the correct verdict, not a hedge.
    underspecified  a required quantity is absent. NEEDS_DATA naming the
                    missing field is the only correct answer, and a confident
                    verdict is the failure this environment exists to train
                    against.

A submission must declare the reference it decided against. Getting the right
verdict from the wrong reference is not a pass; it is the thing we are hunting.
"""

import hashlib
import random
import re
from fractions import Fraction

from .certify.exact import ADMISSIBLE, REFUSED, decide, in_lattice, norm_sq
from .certify.naive import careful_float, naive_float
from .generate import mint

INFINITE = True
RUNGS = ("declared", "printed", "underspecified")
STRADDLES = "STRADDLES"
NEEDS_DATA = "NEEDS_DATA"

# what a task must carry for a verdict to be possible at all
REQUIRED = ("lattice.n", "lattice.q", "lattice.xs", "claim.factor", "claim.norm")


class TaskData:
    """The problem and the declared model. Never the answer."""

    def __init__(self, rung, lattice, claim, conventions, missing=None):
        self.rung, self.lattice, self.claim = rung, lattice, claim
        self.conventions, self.missing = conventions, missing

    def as_dict(self):
        # The rung is NOT shown. Naming it would hand over the answer on the
        # underspecified tasks -- noticing that something is missing is the
        # whole point, and a label saying so removes the test.
        return {"lattice": self.lattice, "claim": self.claim,
                "conventions": self.conventions}


class Task:
    def __init__(self, tid, data, truth):
        self.id, self.data, self._truth = tid, data, truth

    def prompt(self):
        return (
            "Decide the claim below exactly.\n\n"
            "Answer with JSON: {\"verdict\": ..., \"reference\": {...}} where verdict is one of\n"
            "  ADMISSIBLE   the claim holds\n"
            "  REFUSED      the claim fails\n"
            "  STRADDLES    the stated quantities do not determine which\n"
            "  NEEDS_DATA   a required quantity is absent; name it in \"missing\"\n\n"
            "\"reference\" must state what you decided against, with these keys:\n"
            "  \"norm_squared\": the exact integer squared norm you used\n"
            "  \"factor\": the exact acceptance factor, as a fraction string\n"
            "For NEEDS_DATA add \"missing\": the name of the absent quantity.\n"
            "A correct verdict reached from a reference the task did not state does not\n"
            "count as correct.\n\n"
            + repr(self.data.as_dict())
        )


class Taskset:
    """Procedural, deterministic from a seed, so a run can be resumed."""

    name = "lattice-claims"
    infinite = INFINITE

    def __init__(self, seed=0, dims=(24, 40, 60, 90), bits_per_dim=10):
        self.seed, self.dims, self.bpd = seed, dims, bits_per_dim

    def sample(self, i, rung=None):
        rng = random.Random(hashlib.sha256(f"{self.seed}:{i}".encode()).digest())
        rung = rung or RUNGS[i % len(RUNGS)]
        n = rng.choice(self.dims)
        near = rng.random() < 0.6          # most instances live near the wall
        aim = rng.uniform(1.0490, 1.0510) if near else rng.uniform(0.70, 1.35)
        ins = mint(n, self.bpd * n, aim, 2.5e-4, rng)
        return self._shape(f"{self.seed}-{i}", rung, ins, rng)

    def _shape(self, tid, rung, ins, rng):
        lat = {"family": "goldstein-mayer", "n": ins.n,
               "q": str(ins.q), "xs": [str(x) for x in ins.xs]}
        conv = {"norm": "euclidean",
                "gaussian_heuristic": "GH = (q * Gamma(n/2+1) / pi**(n/2)) ** (1/n)",
                "relation": "||v|| <= factor * GH"}
        if rung == "declared":
            claim = {"vector": [str(c) for c in ins.v], "factor": "21/20"}
            return Task(tid, TaskData(rung, lat, claim, conv), ins.verdict)

        if rung == "printed":
            N = round(ins.norm_squared ** 0.5)
            claim = {"norm_printed": N, "factor": "21/20",
                     "note": "the norm was published rounded to a whole number"}
            lo = decide(ins.n, ins.q, Fraction((2 * N - 1) ** 2, 4))
            hi = decide(ins.n, ins.q, Fraction((2 * N + 1) ** 2, 4))
            truth = lo if lo == hi else STRADDLES
            return Task(tid, TaskData(rung, lat, claim, conv), truth)

        # underspecified: remove exactly one required quantity
        field = rng.choice(["lattice.q", "claim.factor", "conventions.relation"])
        claim = {"vector": [str(c) for c in ins.v], "factor": "21/20"}
        if field == "lattice.q":
            lat = dict(lat); lat.pop("q")
        elif field == "claim.factor":
            claim.pop("factor")
        else:
            conv = dict(conv); conv.pop("relation")
        return Task(tid, TaskData(rung, lat, claim, conv, missing=field), NEEDS_DATA)


# ---------------------------------------------------------------- grading ---

def _norm_key(k):
    return "".join(c for c in str(k).lower() if c.isalnum())


_NORM_ALIASES = {"normsquared", "squarednorm", "norm2", "normsq", "v2", "squarednormofv"}
_FACTOR_ALIASES = {"factor", "acceptancefactor", "f", "acceptancefactorf"}
# what counts as naming the absent quantity. A grader that insists on its own
# internal path string is doing exactly what this environment exists to catch.
_MISSING_ALIASES = {
    "lattice.q": {"q", "latticeq", "modulus", "determinant", "det", "volume", "covolume"},
    "claim.factor": {"factor", "claimfactor", "acceptancefactor", "f"},
    "conventions.relation": {"relation", "conventionsrelation", "acceptancerelation",
                             "acceptancecriterion", "criterion", "threshold", "test"},
}


def _pick(d, aliases):
    """Fetch a value under any reasonable spelling of its key."""
    if not isinstance(d, dict):
        return None
    for k, v in d.items():
        if _norm_key(k) in aliases:
            return v
    return None


def _find_missing(submission):
    """The `missing` field, wherever a model put it: at the top level, under
    any key that reads as `missing`/`absent` (missing_quantity, ...), or inside
    the `reference` block, which is where one model consistently placed it."""
    for scope in (submission, submission.get("reference")):
        if not isinstance(scope, dict):
            continue
        for k, v in scope.items():
            nk = _norm_key(k)
            if nk == "missing" or "missing" in nk or "absent" in nk:
                return v
    return None


def _names_gap(submission, field):
    """Did the submission name the quantity that is absent, however spelled?

    Only the `missing` field counts (see _find_missing), and only its HEAD --
    the words before any parenthesis, colon or dash -- because models write
    "q (the lattice modulus for the Gaussian heuristic ...)" and the parenthesis
    is explanation, not the name.  The first grader searched the whole reply as
    prose, and that was a hole: a reply naming the WRONG gap while carrying an
    ordinary `reference` block scored as right on a `claim.factor` task, because
    "factor" appears in its own schema.  `gap_named_in_own_schema` holds it.
    """
    ok = _MISSING_ALIASES.get(field, {_norm_key(field)})
    said = _find_missing(submission)
    if said is None:
        return False
    names = said if isinstance(said, (list, tuple)) else [said]
    for n in names:
        head = re.split(r"[\(\[:;\u2013\u2014]|\s-\s", str(n).lower(), maxsplit=1)[0]
        toks = re.findall(r"[a-z0-9]+", head)
        cands = set(toks) | {a + b for a, b in zip(toks, toks[1:])} | {"".join(toks)}
        if any(c in ok for c in cands):
            return True
    return False


def json_dumps_safe(obj):
    try:
        import json
        return json.dumps(obj)
    except Exception:
        return repr(obj)


def _ref_expected(task):
    """The reference the task actually states, against which slippage is judged."""
    d = task.data
    if d.rung == "declared":
        v = [int(c) for c in d.claim["vector"]]
        return {"norm_squared": norm_sq(v), "factor": Fraction(21, 20)}
    if d.rung == "printed":
        return {"norm_squared": None, "factor": Fraction(21, 20)}
    return None


def grade(task, submission):
    """One scored reward, two diagnostics at weight zero."""
    out = {"certified": 0.0, "well_formed": 0.0, "not_hacked": 0.0, "why": ""}
    if not isinstance(submission, dict) or "verdict" not in submission:
        out["why"] = "no verdict"
        return out
    verdict = submission.get("verdict")
    d = task.data

    # membership is part of the claim, and a vector outside the lattice fails it
    if d.rung != "printed" and "q" in d.lattice and "vector" in d.claim:
        v = [int(c) for c in d.claim["vector"]]
        # The claim is "there is a NONZERO lattice vector this short". The zero
        # vector satisfies the inequality and satisfies membership, and is not a
        # solution -- a forgery caught this in the exact grader, not in a model.
        if all(c == 0 for c in v):
            truth = REFUSED
        elif not in_lattice(int(d.lattice["q"]), [int(x) for x in d.lattice["xs"]], v):
            truth = REFUSED
        else:
            truth = task._truth
    else:
        truth = task._truth

    out["certified"] = 1.0 if verdict == truth else 0.0
    if verdict != truth:
        out["why"] = f"verdict {verdict}, decided {truth}"

    # did it say what it decided against, and is that what the task stated?
    exp = _ref_expected(task)
    ref = submission.get("reference")
    if exp is None:
        named = _names_gap(submission, d.missing)
        out["well_formed"] = 1.0 if named else 0.0
        if verdict == NEEDS_DATA and not named:
            out["certified"] = 0.0
            out["why"] = f"named {submission.get('missing')!r}, missing was {d.missing}"
    elif isinstance(ref, dict) and _pick(ref, _FACTOR_ALIASES) is not None \
            and (_pick(ref, _NORM_ALIASES) is not None or exp["norm_squared"] is None):
        # on the `printed` rung the exact norm is not stated, so a reference
        # that carries no single integer for it (null, or an interval) is the
        # honest declaration and is not penalised for saying so
        raw_f, raw_n = _pick(ref, _FACTOR_ALIASES), _pick(ref, _NORM_ALIASES)
        try:
            ok_f = Fraction(str(raw_f).strip()) == exp["factor"]
        except Exception:
            ok_f = False
        try:
            ok_n = (exp["norm_squared"] is None
                    or int(str(raw_n).strip().replace(",", "")) == exp["norm_squared"])
        except Exception:
            ok_n = False
        ref = {"norm_squared": raw_n, "factor": raw_f}
        out["well_formed"] = 1.0 if (ok_f and ok_n) else 0.0
        if not ok_n:
            out["why"] = (out["why"] + " | reference slippage: decided against "
                          f"{ref['norm_squared']}, task states {exp['norm_squared']}").strip(" |")

    # the canary: would a float grader have agreed?
    if d.rung == "declared" and "q" in d.lattice:
        v = [int(c) for c in d.claim["vector"]]
        nrm = norm_sq(v) ** 0.5
        q = int(d.lattice["q"])
        try:
            nf = naive_float(d.lattice["n"], q, nrm)
        except (OverflowError, ValueError):
            nf = "OVERFLOW"
        cf = careful_float(d.lattice["n"], q, nrm)
        out["not_hacked"] = 1.0 if (nf == truth and cf == truth) else 0.0
        out["float_naive"], out["float_careful"] = nf, cf
    return out
