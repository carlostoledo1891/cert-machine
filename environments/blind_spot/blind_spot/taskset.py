"""The taskset: one mutant, three rungs of one dial -- how much of the defect is stated.

    located   the mutation is named: which cell, which port, which bit, how it
              is bent, and the netlist statement it sits in.  The model has
              everything a verification engineer has.
    profile   the location is withheld; what is given is which of the four
              testbench families killed the mutant and which did not.  This is
              the move that closed the core's 31 survivors -- the class names
              the family -- posed as a task.
    blind     nothing but the design.  The only sound moves are to know where
              mutants hide, or to abstain.

The answer is the same shape on every rung: one to eight input pairs on which
the mutant's output pins differ from the original's, or the claim EQUIVALENT,
or UNDECIDED.  A kill is verified by simulating the actual netlist under the
actual mutation; EQUIVALENT is checked against a SAT proof.  There is no answer
key, no judge and no tolerance anywhere.

The identity mutation -- the unmutated design -- is in the pool as a class of
its own.  A testbench that fails everything reports perfect coverage, and a
model that claims a kill on every task is doing the same thing; the identity is
where that costs.
"""
import hashlib
import json
import random

from . import pool as _pool
from . import sim
from .design import (CMAX, D, DESCRIPTION, FAMILIES, MAX_PAIRS, OUT_OF_BOX, W, in_box)

RUNGS = ("located", "profile", "blind")
KILL, EQUIVALENT, UNDECIDED = "KILL", "EQUIVALENT", "UNDECIDED"
VERDICTS = (KILL, EQUIVALENT, UNDECIDED)

# How often each class is drawn.  The rare classes are the interesting region
# and would vanish under uniform sampling: three ALIGNED_ONLY mutants in four
# hundred is under one per hundred tasks.
CLASS_WEIGHTS = {"COVERED": 0.34, "MINT_ONLY": 0.14, "OUTBOX_ONLY": 0.16, "ALIGNED_ONLY": 0.10,
                 "NOCHANGE": 0.16, "IDENTITY": 0.10}

FAMILY_TEXT = {
    "corpus": "certified corpus   4000 pairs from the 14.95M-pair certified corpus; every vector has u.u = v.v = 4 and u.v is in -4..4",
    "mint": "near-boundary mint 4000 pairs with D = 4(u.v)^2 - (u.u)(v.v) in {-2,-1,0,1,2}; the norms differ",
    "outbox": "out-of-box         4000 pairs with one to three coordinates equal to -4, the excluded code point",
    "aligned": "aligned            4000 pairs with |u.v| at least 60 of its maximum 99 (near-parallel or near-antiparallel)",
}

CELL_GLOSS = {"add": "adder", "sub": "subtractor", "mul": "multiplier",
              "le": "less-or-equal comparator", "lt": "less-than comparator",
              "ge": "greater-or-equal comparator", "gt": "greater-than comparator",
              "eq": "equality comparator", "ne": "inequality comparator",
              "and": "AND gate", "or": "OR gate", "xor": "XOR gate", "not": "NOT gate",
              "reduce_and": "AND-reduce over all bits", "reduce_or": "OR-reduce over all bits",
              "reduce_bool": "OR-reduce over all bits", "logic_not": "logical NOT", "logic_and": "logical AND",
              "logic_or": "logical OR", "ternary": "mux", "mux": "mux", "pmux": "mux", "neg": "negation",
              "shl": "shift left", "shr": "shift right", "sshr": "arithmetic shift right"}
PORT_GLOSS = {"A": "input A", "B": "input B", "Y": "output Y", "S": "select S"}


class Task:
    def __init__(self, tid, rung, mutant):
        self.id, self.rung, self.mutant = tid, rung, mutant

    @property
    def truth(self):
        return EQUIVALENT if self.mutant["equivalent"] else KILL

    @property
    def klass(self):
        return self.mutant["klass"]

    def public(self):
        """What the prompt says about the mutant.  Never the label."""
        m = self.mutant
        if self.rung == "located":
            st = m.get("statement", "")
            return {"mutation": describe(m), "statement": st, "widths": widths_in(st),
                    "drivers": drivers_of(st), "bent_wire": bent_wire(m)}
        if self.rung == "profile":
            return {"profile": {f: ("KILLED" if m["profile"][f] else "SURVIVED") for f in FAMILIES}}
        return {}

    def prompt(self):
        p = [DESCRIPTION, "",
             "THE TASK.  One mutation may have been applied to this netlist -- a single bit of a",
             "single cell's port bent -- or none at all.  Name one to eight input pairs (u, v) on",
             "which the mutant's three output pins differ from the original's, or answer",
             "EQUIVALENT if no input pair with valid = 1 can tell them apart, or UNDECIDED.", ""]
        pub = self.public()
        if self.rung == "located":
            p += ["THE MUTATION.  " + pub["mutation"], ""]
            if pub["statement"]:
                p += [f"  netlist statement it sits in:   {pub['statement']}"]
            if pub["bent_wire"]:
                p += [f"  the wire actually bent:         {pub['bent_wire']}"]
            if pub["drivers"]:
                p += ["  what drives its inputs:         " + pub["drivers"][0]]
                p += ["                                  " + d for d in pub["drivers"][1:]]
            if pub["widths"]:
                p += ["  wire widths:                    " + "   ".join(f"{k} is {v}" for k, v in pub["widths"].items())]
            if pub["statement"]:
                p += ["  (in the netlist, $N are internal wires; $signed(x) reads x as two's complement;",
                      "   in a concatenation { a, b, ..., z } the LEFTMOST element is the highest bit;",
                      "   the `cmp` submodule's ports la, lb, ra, rb are the comparator operands)"]
            p += [""]
        elif self.rung == "profile":
            p += ["THE PROFILE.  The mutation's location is not given.  Four testbenches were run",
                  "against this mutant; each is 4000 pairs:", ""]
            for f in FAMILIES:
                p.append(f"  {FAMILY_TEXT[f]:<118} -> {pub['profile'][f]}")
            p.append("")
        else:
            p += ["Nothing about the mutation is given: not the cell, not the bit, not which",
                  "testbenches saw it.", ""]
        p += ["ANSWER with JSON, and nothing after it:",
              '  {"verdict": "KILL", "pairs": [{"u": [11 integers], "v": [11 integers]}, ...], "where": "one line on what you targeted"}',
              '  {"verdict": "EQUIVALENT", "where": "why no pair can tell them apart"}',
              '  {"verdict": "UNDECIDED"}',
              f"Coordinates must be integers in -4..3 (the pins are 3-bit).  At most {MAX_PAIRS} pairs.",
              "A KILL scores only if at least one pair actually flips a pin in simulation.  Claiming",
              "KILL on a design that is provably unchanged, or EQUIVALENT on one that a pair can",
              "distinguish, scores below saying nothing."]
        return "\n".join(p)


def describe(m):
    """The mutation in words, from yosys's own option list."""
    if m.get("mode") == "none" or m.get("klass") == "IDENTITY":
        # the record IS the information at this rung: `mutate -mode none` names
        # no cell, no port and no bit.  (The first live run showed this as
        # "In a cell cell in the top module, port None is mutated in mode none";
        # same content, worse sentence.  4 of 108 calls saw that wording.)
        return "The mutation record reads `mutate -mode none`: it names no cell, no port and no bit."
    ct = CELL_GLOSS.get(m.get("celltype"), m.get("celltype") or "cell")
    art = "an" if ct[:1].lower() in "aeiou" else "a"
    where = f"{art} {ct} cell" + (f" inside the `cmp` submodule" if m.get("submodule") else " in the top module")
    port = PORT_GLOSS.get(m.get("port"), f"port {m.get('port')}")
    bit = f"bit {m['portbit']} of {port}" if m.get("portbit") is not None else port
    mode = m.get("mode")
    if mode == "inv":
        how = "is INVERTED"
    elif mode == "const0":
        how = "is forced to constant 0"
    elif mode == "const1":
        how = "is forced to constant 1"
    elif mode in ("cnot0", "cnot1"):
        how = f"is inverted whenever bit {m.get('ctrlbit')} of the same port is {mode[-1]}"
    else:
        how = f"is mutated in mode {mode}"
    line = f" (netlist line {m['vline']})" if m.get("vline") else ""
    return f"In {where}{line}, {bit} {how}."


def drivers_of(statement):
    """One level up: the statements that drive the $-wires on the right-hand
    side.  `assign $74 = $72 & $73;` says nothing until you know that $72 and
    $73 are u2's two range checks -- and the first live run showed a model
    locating the right cell and then spoiling the wrong coordinate for exactly
    that reason.  A verification engineer has the whole netlist; this is the
    part of it the statement depends on."""
    import re
    if "=" not in statement:
        return []
    rhs = statement.split("=", 1)[1]
    out = []
    for name in dict.fromkeys(re.findall(r"\$\d+", rhs)):
        d = _pool.defining_line(name)
        if d:
            out.append(d)
        if len(out) >= 6:
            break
    return out


def bent_wire(m):
    """yosys names the wire whose bit is bent as well as the cell port, and the
    two are not always the same numbering: after optimisation the bits of an
    AND-reduce's port need not sit in the order the source concatenation lists
    them.  The wire is the ground truth."""
    w = m.get("wire")
    if not w:
        return ""
    name = w.replace("\\", "")
    d = _pool.defining_line(name)
    bit = f" bit {m['wirebit']}" if m.get("wirebit") is not None else ""
    out = f"{name}{bit}" + (f"   ({d})" if d else "")
    # and one level below it, so `$80 = $78 & $79` arrives with what $78 and $79 are
    below = [x for x in drivers_of(d) if x != d] if d else []
    if below:
        out += "   where " + "  ".join(below[:4])
    return out


def widths_in(statement):
    """Declared widths of the $-wires named in a statement."""
    import re
    out = {}
    for name in dict.fromkeys(re.findall(r"\$\d+", statement)):
        w = _pool.wire_width(name)
        out[name] = w or "1 bit"
    for nm in ("lp", "rp", "la", "lb", "ra", "rb", "p", "s", "t"):
        if re.search(r"\b" + nm + r"\b", statement):
            w = _pool.wire_width(nm)
            if w:
                out[nm] = w
    return out


class Taskset:
    name = "blind-spot"
    infinite = False           # the pool is MCY's 400; `pool.build` from a new seed extends it

    def __init__(self, seed=0, weights=CLASS_WEIGHTS):
        self.seed, self.weights = seed, dict(weights)

    def _by_class(self):
        by = {}
        for e in _pool.load()["mutants"]:
            if e.get("valid0_only"):
                continue
            by.setdefault(e["klass"], []).append(e)
        return by

    def sample(self, i, rung=None):
        rng = random.Random(hashlib.sha256(f"{self.seed}:{i}".encode()).digest())
        rung = rung or RUNGS[i % len(RUNGS)]
        by = self._by_class()
        classes = [c for c in self.weights if by.get(c)]
        ws = [self.weights[c] for c in classes]
        klass = rng.choices(classes, ws)[0]
        m = rng.choice(by[klass])
        return Task(f"{self.seed}-{i}", rung, m)


# ---------------------------------------------------------------- grading ---

def parse_pairs(sub):
    """The pairs, validated the strict way.  Raises ValueError naming the fault.

    Nothing is coerced: a coordinate of 4 or -5 cannot be driven onto a 3-bit
    pin, and masking it would test a pair the model did not name."""
    pairs = sub.get("pairs")
    if not isinstance(pairs, list) or not pairs:
        raise ValueError("KILL needs a non-empty list of pairs")
    if len(pairs) > MAX_PAIRS:
        raise ValueError(f"{len(pairs)} pairs; at most {MAX_PAIRS}")
    out = []
    for k, pr in enumerate(pairs):
        if isinstance(pr, dict):
            u, v = pr.get("u"), pr.get("v")
        elif isinstance(pr, (list, tuple)) and len(pr) == 2:
            u, v = pr
        else:
            raise ValueError(f"pair {k} is not {{u, v}}")
        for nm, vec in (("u", u), ("v", v)):
            if not isinstance(vec, (list, tuple)) or len(vec) != D:
                raise ValueError(f"pair {k}: {nm} must have {D} coordinates")
            for x in vec:
                if isinstance(x, bool) or not isinstance(x, int):
                    raise ValueError(f"pair {k}: {nm} has a non-integer coordinate {x!r}")
                if not OUT_OF_BOX <= x <= CMAX:
                    raise ValueError(f"pair {k}: coordinate {x} is not representable in {W} bits (-4..3)")
        out.append((tuple(u), tuple(v)))
    return out


def grade(task, submission):
    """reward is scored; the rest is diagnostic.

        +1  SOLVED   a pair flips a pin, or EQUIVALENT on a proved-equivalent mutant
         0  MISSED   KILL claimed, no pair flips a pin, and the mutant IS killable
         0  UNDECIDED, or an unparseable / ill-formed submission (REFUSED_PARSE)
        -1  WRONG    KILL on a proved-equivalent design (a false alarm), or
                     EQUIVALENT on a killable one (a gap declared closed)
    """
    out = {"reward": 0.0, "outcome": "REFUSED_PARSE", "well_formed": 0.0, "false_claim": 0.0,
           "in_box_kill": None, "killer": None, "why": ""}
    if not isinstance(submission, dict) or submission.get("verdict") not in VERDICTS:
        out["why"] = "no verdict among KILL / EQUIVALENT / UNDECIDED"
        return out
    verdict = submission["verdict"]
    killable = not task.mutant["equivalent"]
    if verdict == UNDECIDED:
        out.update(outcome="UNDECIDED", well_formed=1.0)
        return out
    if verdict == EQUIVALENT:
        out["well_formed"] = 1.0
        if killable:
            w = task.mutant["witness"]
            out.update(reward=-1.0, outcome="WRONG", false_claim=1.0,
                       why=f"a pair distinguishes them: u={w['u']} v={w['v']} ({w['original']} -> {w['mutant']})")
        else:
            out.update(reward=1.0, outcome="SOLVED")
        return out
    try:
        pairs = parse_pairs(submission)
    except ValueError as e:
        out["why"] = str(e)
        return out
    out["well_formed"] = 1.0
    hits = sim.kills(task.mutant["id"], pairs)
    if hits:
        u, v, o, m = hits[0]
        out.update(reward=1.0, outcome="SOLVED", in_box_kill=in_box(u, v),
                   killer={"u": list(u), "v": list(v), "original": o, "mutant": m})
        return out
    if killable:
        out.update(outcome="MISSED", why="no submitted pair changes a pin; the mutant is killable")
    else:
        out.update(reward=-1.0, outcome="WRONG", false_claim=1.0,
                   why="no pair can change a pin: the design is proved equivalent to the original")
    return out
