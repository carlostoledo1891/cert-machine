"""The graph is the submission.

Everywhere else in this package a model answers with a verdict. Here it answers
with a WIRING: which instruments, in what order, and what may reach the port
that decides. The environment then builds the graph, and building it is the
grading -- there is no separate rubric, because the two rules that matter are
already conditions on a wire:

    a value that came from floating point may not enter a deciding port
    a deciding port with nothing wired to it cannot produce a verdict

A submission that violates either does not score badly, it does not BUILD, and
the message it gets back is the one the engine raises. Nothing about correctness
is expressed twice.

This mirrors experiments/cert-unit/graph.mjs. The rules are small enough to
state in both places and `test_wiring.py` checks that the same wirings are
refused here for the same reasons.
"""

__all__ = ["CATALOGUE", "SINK", "WiringRefused", "build", "grade_wiring", "catalogue_text"]

FLOAT, EXACT = "float", "exact"


class WiringRefused(ValueError):
    pass


# A deliberately small vocabulary. A larger one measures reading comprehension;
# this one measures whether a model knows which instrument may decide.
CATALOGUE = {
    "basis":        {"in": [], "out": ["q"], "emits": EXACT, "deciding": [],
                     "what": "the challenge basis, with det = q proved entry by entry"},
    "norm":         {"in": [], "out": ["value"], "emits": EXACT, "deciding": [],
                     "what": "the claimed squared norm, an exact integer"},
    "pi_bracket":   {"in": [], "out": ["bracket"], "emits": EXACT, "deciding": [],
                     "what": "a certified rational bracket on pi"},
    "float_screen": {"in": ["q"], "out": ["shortlist"], "emits": FLOAT, "deciding": [],
                     "what": "a fast floating-point screen; may prune, may not decide"},
    "gh_tolerance": {"in": ["q", "norm"], "out": ["verdict"], "emits": FLOAT, "deciding": [],
                     "what": "the tolerance grader; converts the determinant to a double"},
    "gh_exact":     {"in": ["q", "norm", "pi"], "out": ["certified", "refuted", "refused"],
                     "emits": EXACT, "deciding": ["q", "norm", "pi"],
                     "what": "the exact predicate; every input decides"},
    "report":       {"in": ["verdict"], "out": [], "emits": EXACT, "deciding": ["verdict"],
                     "what": "the sink; its input decides"},
}
SINK = "report"


def catalogue_text():
    rows = []
    for name, s in CATALOGUE.items():
        ins = ", ".join(s["in"]) or "-"
        outs = ", ".join(s["out"]) or "-"
        dec = ", ".join(s["deciding"]) or "-"
        rows.append(f"  {name:14s} inputs: {ins:20s} outputs: {outs:34s} "
                    f"emits: {s['emits']:5s} deciding inputs: {dec:16s} {s['what']}")
    return ("\n".join(rows)
            + "\n  Port names are exactly as listed. A deciding input is one that nothing"
              "\n  carrying floating point may reach.")


def build(sub):
    """Build the submitted graph, or refuse it in the engine's terms.

    Returns (nodes, wires). Raises WiringRefused with the reason.
    """
    if not isinstance(sub, dict):
        raise WiringRefused("submission is not an object")
    nodes = sub.get("nodes")
    wires = sub.get("wires")
    if not isinstance(nodes, list) or not isinstance(wires, list):
        raise WiringRefused("submission needs a list of nodes and a list of wires")
    for n in nodes:
        if n not in CATALOGUE:
            raise WiringRefused(f"no such instrument: {n!r}")
    if len(set(nodes)) != len(nodes):
        raise WiringRefused("an instrument is listed twice")
    seen = set(nodes)
    fed = {}
    for w in wires:
        if not (isinstance(w, (list, tuple)) and len(w) == 4):
            raise WiringRefused(f"a wire must be [from, out_port, to, in_port], got {w!r}")
        fn, fp, tn, tp = w
        for side in (fn, tn):
            if side not in seen:
                raise WiringRefused(f"{side!r} is wired but was not listed among the nodes")
        if fp not in CATALOGUE[fn]["out"]:
            raise WiringRefused(f"{fn} has no output {fp!r}")
        if tp not in CATALOGUE[tn]["in"]:
            raise WiringRefused(f"{tn} has no input {tp!r}")
        # THE FLOAT FIREBREAK, in the same words the other engine uses
        if CATALOGUE[fn]["emits"] == FLOAT and tp in CATALOGUE[tn]["deciding"]:
            raise WiringRefused(
                f"THE FLOAT FIREBREAK: {fn}.{fp} carries floats and {tn}.{tp} decides. "
                f"A fast screen may prune. It may never reach a verdict.")
        fed.setdefault(tn, set()).add(tp)
    return nodes, fed


def grade_wiring(truth_verdict, sub):
    """One scored reward and two diagnostics, as everywhere else here."""
    out = {"certified": 0.0, "well_formed": 0.0, "not_hacked": 0.0, "why": ""}
    try:
        nodes, fed = build(sub)
    except WiringRefused as e:
        out["why"] = str(e)
        return out
    out["well_formed"] = 1.0

    if SINK not in nodes:
        out["why"] = "nothing is wired to a verdict; the graph decides nothing"
        return out
    # every deciding port of every listed instrument must actually be fed
    for n in nodes:
        need = set(CATALOGUE[n]["deciding"])
        got = fed.get(n, set())
        missing = need - got
        if missing:
            out["why"] = (f"{n} has a deciding port with nothing wired to it: "
                          f"{', '.join(sorted(missing))}")
            return out
    # what actually reaches the sink
    src = [w for w in sub["wires"] if w[2] == SINK and w[3] == "verdict"]
    if len(src) != 1:
        out["why"] = f"{len(src)} things are wired to {SINK}.verdict; exactly one may decide"
        return out
    fn, fp = src[0][0], src[0][1]
    out["not_hacked"] = 1.0 if fn == "gh_exact" else 0.0
    if fn != "gh_exact":
        out["why"] = f"{fn} reached the verdict port without deciding anything"
        return out
    # the graph is legal and the exact predicate decides: its verdict is the truth
    want = {"ADMISSIBLE": "certified", "REFUSED": "refuted"}.get(truth_verdict, "refused")
    out["certified"] = 1.0 if fp == want else 0.0
    if fp != want:
        out["why"] = f"routed {fp} to the sink; the predicate fires {want}"
    return out


# ------------------------------------------------------------------ tasks ---
import hashlib
import random

from .generate import mint


class WiringTask:
    def __init__(self, tid, n, q, norm_squared, truth):
        self.id, self.n, self.q = tid, n, q
        self.norm_squared, self.truth = norm_squared, truth

    def prompt(self):
        return (
            "Wire a graph that decides the claim below. You are not asked for the verdict;\n"
            "you are asked which instruments decide it, and what may reach the port that does.\n\n"
            f"  dimension n = {self.n}\n"
            f"  determinant q = {str(self.q)[:24]}... ({len(str(self.q))} digits)\n"
            f"  claimed squared norm = {self.norm_squared}\n"
            f"  the claim: ||v|| <= (21/20) * GH\n\n"
            "Available instruments:\n" + catalogue_text() + "\n\n"
            "Answer with JSON:\n"
            '  {"nodes": ["..."], "wires": [["from","out_port","to","in_port"], ...]}\n\n'
            "List only the instruments you use. Every deciding port of every instrument you\n"
            "list must have something wired to it, and exactly one thing may reach\n"
            "report.verdict. Choose which of the exact predicate's three output ports you\n"
            "route there."
        )


class WiringTaskset:
    name = "lattice-claims/wiring"
    infinite = True

    def __init__(self, seed=0, dims=(8, 12, 16), bits_per_dim=10):
        self.seed, self.dims, self.bpd = seed, dims, bits_per_dim

    def sample(self, i):
        rng = random.Random(hashlib.sha256(f"w{self.seed}:{i}".encode()).digest())
        n = rng.choice(self.dims)
        near = rng.random() < 0.5
        aim = rng.uniform(1.0480, 1.0520) if near else rng.uniform(0.80, 1.25)
        ins = mint(n, self.bpd * n, aim, 3e-3, rng)
        return WiringTask(f"w{self.seed}-{i}", ins.n, ins.q, ins.norm_squared, ins.verdict)
