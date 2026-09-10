"""The design under mutation, its pins, and the one paragraph that describes it.

In frontier-apps this pointed into `experiments/certifier-core/mut` and nothing
was copied, so a task could not drift from the published measurement.  That tree
is not in this repository, so on the port (2026-09-09) the SEVEN files the
package actually reads were lifted into `corpus/blindspot/mut/` and every one is
sha256-pinned in `environments/blind_spot/PROVENANCE.json`.  The guarantee is the
same one by a different route: the battery re-hashes all seven every run and
REFUSES if a byte moved, so a task still cannot drift from the measurement --
the drift is caught instead of being impossible.

The files: the elaborated design MCY mutated (`mut/database/design.il`), the
netlist it was elaborated from (`mut/core_euclid_strict.v`), MCY's own database
and mutation list, and the four testbench families packed as hex.
"""
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
def _first_existing(*cands):
    for c in cands:
        if c and os.path.isdir(c):
            return c
    return cands[-1]                    # so the error names a path rather than None


# WHERE THE DESIGN LIVES, decided once and in one order. An INSTALLED copy has it
# beside the package (the wheel force-includes corpus/blindspot/mut as
# blind_spot/mut); a source checkout of cert-machine has it in the corpus, pinned
# and gated. The environment variable is the escape hatch for pointing at a
# freshly mutated tree without reinstalling. Without this the wheel installs
# cleanly and then cannot find a single file, which is the shape of defect a
# publishing step is supposed to catch and usually does not.
MUT = _first_existing(os.environ.get("BLIND_SPOT_MUT"),
                      os.path.join(HERE, "mut"),
                      os.path.join(ROOT, "corpus", "blindspot", "mut"))
DESIGN_IL = os.path.join(MUT, "database", "design.il")
NETLIST_V = os.path.join(MUT, "core_euclid_strict.v")
MCY_DB = os.path.join(MUT, "database", "db.sqlite3")
MUTATIONS_TXT = os.path.join(MUT, "database", "mutations.txt")
# THE RECORD AND THE WORKSHOP ARE TWO DIFFERENT PLACES. pool.json is 400 SAT
# labels and ships with the wheel; the simulator is a compiled binary that does
# not and must be built locally. An installed package may sit in a read-only
# site-packages, so the record is READ from wherever it is and the simulator is
# BUILT in the first writable of: that same directory, or a cache directory.
_POOL_HOME = _first_existing(os.environ.get("BLIND_SPOT_POOL"),
                             os.path.join(HERE, "pool"),
                             os.path.join(HERE, "..", "pool"))
POOL_RECORD = os.path.join(_POOL_HOME, "pool.json")


def _workdir():
    if os.access(_POOL_HOME, os.W_OK):
        return _POOL_HOME
    d = os.path.join(os.environ.get("XDG_CACHE_HOME") or os.path.expanduser("~/.cache"),
                     "blind-spot", "pool")
    os.makedirs(d, exist_ok=True)
    return d


POOL_DIR = _workdir()

TOP = "core_euclid_strict"
D, W = 11, 3                       # eleven coordinates of three bits
CMAX = (1 << (W - 1)) - 1          # the declared box is |x| <= 3
OUT_OF_BOX = -(1 << (W - 1))       # the one excluded code point, -4
CTRL_BITS = 16                     # width of the mutation-select input
FAMILIES = ("corpus", "mint", "outbox", "aligned")
PINS = ("certified", "refuted", "refused")
MAX_PAIRS = 8                      # a submission names at most this many pairs


def tools_missing():
    """The external tools this environment is built on.  Named, not assumed."""
    return [t for t in ("yosys", "iverilog", "vvp") if shutil.which(t) is None]


def require_tools():
    m = tools_missing()
    if m:
        raise RuntimeError("blind-spot needs " + ", ".join(m) + " on PATH (brew install yosys icarus-verilog)")


def to_signed(x, w=W):
    x &= (1 << w) - 1
    return x - (1 << w) if x >> (w - 1) else x


def to_unsigned(x, w=W):
    if not -(1 << (w - 1)) <= x < (1 << (w - 1)):
        raise ValueError(f"{x} is not representable in {w} bits")
    return x & ((1 << w) - 1)


def in_box(u, v):
    return all(-CMAX <= x <= CMAX for x in list(u) + list(v))


def spec(u, v):
    """The predicate the ORIGINAL design computes, in words a program can run.

    This is not the grader.  The grader is a simulation of the netlist against
    itself under a mutation; this exists so a policy can reason about where a
    verdict would flip and so the page can label a pair.  It follows ref.py in
    experiments/certifier-core exactly, at mw = 8 where the strict datapath is
    complete over the box.
    """
    if not in_box(u, v):
        return "refused"
    p = sum(a * b for a, b in zip(u, v))
    if p <= 0:
        return "certified"
    s = sum(a * a for a in u)
    t = sum(b * b for b in v)
    return "certified" if 4 * p * p <= s * t else "refuted"


DESCRIPTION = """\
THE DESIGN.  `core_euclid_strict` is a combinational circuit with 22 input pins
u0..u10 and v0..v10, each a 3-bit two's-complement integer (so every coordinate
is in -4..3), one `valid` input, and three output pins: certified, refuted,
refused.  With valid = 1 exactly one output is high.  It decides whether two
integer vectors in Z^11 meet at an angle of at least 60 degrees:

    p = u.v   s = u.u   t = v.v            (three dot-product adder trees)
    in_box    = every coordinate satisfies -3 <= x <= 3   (the code point -4 is
                outside the declared box, and an out-of-box pair is REFUSED)
    certified = in_box and ( p <= 0  or  4*p^2 <= s*t )
    refuted   = in_box and   p > 0  and  4*p^2 >  s*t
    refused   = not in_box   (the datapath itself is complete: with 8-bit
                operands no in-box pair is ever refused for width)

Inside: each of the 22 products x*y is a 3x3-bit signed multiplier; the three
sums run through chains of adders (p is 10 bits signed, s and t are 9 bits
unsigned).  If p <= 0 the trivial branch certifies without the comparator.
Otherwise la = lb = 2p (8-bit unsigned, so 4p^2 = la*lb) and ra = s, rb = t go
to a comparator submodule `cmp` that forms lp = la*lb and rp = ra*rb (16 bits
each) and fires le = (lp <= rp) or gt = (lp > rp).  A `wide` flag fires if any
comparator operand is >= 256; no in-box pair reaches it.

Fourteen million certified pair verdicts from finished mathematics were run
against this netlist and could not see some of its mutants: every vector in
that corpus has u.u = v.v = 4, so any defect that only shows when the norms
differ, or when a coordinate is out of the box, or when |u.v| is near its
maximum of 99, is invisible to it."""
