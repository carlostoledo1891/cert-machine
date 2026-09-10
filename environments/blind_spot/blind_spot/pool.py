"""The pool: every mutation with a certified label and, where it exists, a witness.

A label here is not a testbench result.  For each mutation the pool runs a SAT
miter of the mutated netlist against the unmutated one over EVERY input with
valid = 1 -- MiniSAT through `yosys sat`, complete for a combinational design,
a quarter of a second each -- and records one of two things:

    equivalent   the miter is unsatisfiable: no input pair can tell them apart
    witness      a pair the solver found, then RE-RUN through the simulator
                 to confirm it kills.  A label the simulator disagrees with
                 raises; it never ships.

So "killable" means "here is the pair", and "equivalent" means "proved".  The
profile -- which of the four testbench families killed the mutant -- is read
from MCY's own results table for the imported pool, so every class in this
environment is a class from the published coverage run.

    python -m blind_spot pool            import MCY's 400, label, build the simulator
"""
import json
import os
import re
import sqlite3
import subprocess
import tempfile

from . import sim
from . import design
from .design import (CTRL_BITS, D, MCY_DB, MUTATIONS_TXT, NETLIST_V, POOL_DIR, TOP,
                     FAMILIES, require_tools, to_signed)

POOL_JSON = design.POOL_RECORD          # read from where it ships; built into POOL_DIR


def ensure_sim(verbose=False):
    """Build the control design and simulator if they are absent, FROM THE LABELS
    ALREADY ON DISK.

    `build()` re-proves four hundred SAT problems and takes about six minutes;
    this only elaborates and compiles, which takes about forty seconds, because
    the labels are a record and do not need re-proving to be simulated against.
    An installed copy of this environment hits exactly this path on first use."""
    from . import sim as _sim
    if os.path.exists(os.path.join(design.POOL_DIR, "simpool")):
        return design.POOL_DIR
    require_tools()
    muts = {m["id"]: m["mutation"] for m in load()["mutants"]}
    if verbose:
        print(f"  building the control design for {len(muts)} mutations ...", flush=True)
    _sim.build_pool_design(muts, design.POOL_DIR)
    return design.POOL_DIR
IDENTITY = "IDENTITY"
CLASSES = ("COVERED", "MINT_ONLY", "OUTBOX_ONLY", "ALIGNED_ONLY", "CORPUS_ONLY",
           "SURVIVED_ALL", "NOCHANGE", IDENTITY)

_OPT = re.compile(r"-(\w+) (\S+)")


def parse_mutation(line):
    """'mutate -mode inv -module X -cell $add$f.v:284$32 -port B -portbit 1 ...' -> dict."""
    opts = {}
    for k, v in _OPT.findall(line):
        opts.setdefault(k, v)                 # the first -src is the netlist line
    cell = opts.get("cell", "")
    m = re.search(r"\$(\w+)\$[^:]*:(\d+)\$", cell)
    return {
        "mode": opts.get("mode"),
        "cell": cell,
        "celltype": m.group(1) if m else ("" if not cell else cell.split("$")[1] if "$" in cell else cell),
        "vline": int(m.group(2)) if m else None,
        "submodule": "cmp" if "cmp." in cell else "",
        "port": opts.get("port"), "portbit": _int(opts.get("portbit")),
        "ctrlbit": _int(opts.get("ctrlbit")),
        "wire": opts.get("wire"), "wirebit": _int(opts.get("wirebit")),
    }


def _int(x):
    return None if x is None else int(x)


# ----------------------------------------------------------- the netlist text

_netlist = None


def netlist_line(n):
    """Line n of the mutated netlist with the source attributes stripped."""
    global _netlist
    if _netlist is None:
        _netlist = open(NETLIST_V).read().splitlines()
    if n is None or not 1 <= n <= len(_netlist):
        return ""
    s = re.sub(r'\(\* src = "[^"]*" \*\) ?', "", _netlist[n - 1]).strip()
    return s.replace("\\$", "$").replace(" ;", ";")


def defining_line(name):
    """The netlist statement that drives wire `name` ('$80', 'ok', 'lp'), stripped."""
    global _netlist
    if _netlist is None:
        _netlist = open(NETLIST_V).read().splitlines()
    pat = re.compile(r"^\s*assign\s+\\?" + re.escape(name) + r"\s+=")
    for n, line in enumerate(_netlist, 1):
        if pat.match(line):
            return netlist_line(n)
    return ""


def wire_width(name):
    """'$32' -> '[10:0]' from the wire declaration, or '' for a single bit."""
    global _netlist
    if _netlist is None:
        _netlist = open(NETLIST_V).read().splitlines()
    pat = re.compile(r"wire\s+(signed\s+)?(\[\d+:\d+\])?\s*\\?" + re.escape(name) + r"\s*;")
    for line in _netlist:
        m = pat.search(line)
        if m:
            return m.group(2) or ""
    return ""


# ------------------------------------------------------------ the SAT label

_MITER = """module miter_{k}(input valid, {ins}, output trigger);
  wire c0,r0,f0,c1,r1,f1;
  {top} g(.mutsel({cb}'d0), .valid(valid), {conn}, .certified(c0), .refuted(r0), .refused(f0));
  {top} m(.mutsel({cb}'d{k}), .valid(valid), {conn}, .certified(c1), .refuted(r1), .refused(f1));
  assign trigger = (c0!=c1)|(r0!=r1)|(f0!=f1);
endmodule
"""
_NAMES = [f"u{i}" for i in range(D)] + [f"v{i}" for i in range(D)]


def sat_label(k, pool_dir=POOL_DIR, timeout=120):
    """(equivalent: bool, witness: (u, v) or None, seconds) for mutation k, with
    valid held at 1.  Complete: the design is combinational."""
    src = _MITER.format(k=k, top=TOP, cb=CTRL_BITS,
                        ins=", ".join(f"input signed [{D and 2}:0] {n}" for n in _NAMES),
                        conn=", ".join(f".{n}({n})" for n in _NAMES))
    with tempfile.TemporaryDirectory(dir=pool_dir) as td:
        open(os.path.join(td, "miter.v"), "w").write(src)
        ys = os.path.join(td, "eq.ys")
        open(ys, "w").write(
            f"read_rtlil {os.path.join(pool_dir, 'pool.il')}\nread_verilog {os.path.join(td, 'miter.v')}\n"
            f"hierarchy -top miter_{k}\nflatten\nopt_clean\n"
            f"sat -prove trigger 0 -show-inputs -set valid 1 miter_{k}\n")
        log = os.path.join(td, "eq.log")
        r = subprocess.run(["yosys", "-q", "-l", log, ys], capture_output=True, text=True, timeout=timeout)
        text = open(log).read() if os.path.exists(log) else r.stdout + r.stderr
    secs = _secs(text)
    if "no model found: SUCCESS" in text:
        return True, None, secs
    if "model found: FAIL" not in text:
        raise RuntimeError(f"SAT gave neither proof nor model for mutation {k}:\n{text[-1500:]}")
    vals = {}
    for m in re.finditer(r"^\s+\\?(u\d+|v\d+)\s+(\d+)\s+[0-9a-f]+\s+[01]+\s*$", text, re.M):
        vals[m.group(1)] = to_signed(int(m.group(2)))
    u = tuple(vals[f"u{i}"] for i in range(D))
    v = tuple(vals[f"v{i}"] for i in range(D))
    return False, (u, v), secs


def _secs(text):
    m = re.search(r"time: ([\d.]+)s", text)
    return float(m.group(1)) if m else None


# ------------------------------------------------------------------- import

def import_mcy():
    """MCY's mutations, results and tags, exactly as it left them."""
    con = sqlite3.connect(MCY_DB)
    muts = dict(con.execute("select mutation_id, mutation from mutations"))
    res, tags = {}, {}
    for i, t, r in con.execute("select mutation_id, test, result from results"):
        res.setdefault(i, {})[t] = r
    for i, t in con.execute("select mutation_id, tag from tags"):
        tags.setdefault(i, []).append(t)
    return muts, res, tags


def build(verbose=True):
    require_tools()
    os.makedirs(POOL_DIR, exist_ok=True)
    muts, res, tags = import_mcy()
    if verbose:
        print(f"  {len(muts)} mutations from MCY; building the control design ...", flush=True)
    sim.build_pool_design(muts, POOL_DIR)
    entries = []
    identity = [k for k, m in muts.items() if "-mode none" in m]
    if len(identity) != 1:
        raise RuntimeError(f"{len(identity)} identity mutations; the control needs exactly one")
    disagreements = []
    for n, k in enumerate(sorted(muts)):
        p = parse_mutation(muts[k])
        r = res.get(k, {})
        profile = {f: (r.get(f"test_{f}") == "FAIL") for f in FAMILIES}
        if k in identity:
            e = {"id": k, "mutation": muts[k], "klass": IDENTITY, "equivalent": True,
                 "witness": None, "profile": profile, "mcy_tags": tags.get(k, []), "sat_secs": None}
            e.update(p)
            entries.append(e)
            continue
        eq, wit, secs = sat_label(k)
        if wit is not None:
            got = sim.simulate([(k, wit[0], wit[1])])[0]
            if got[0] == got[1]:
                raise RuntimeError(f"mutation {k}: SAT witness {wit} does not kill in simulation ({got})")
            wit = {"u": list(wit[0]), "v": list(wit[1]), "original": got[0], "mutant": got[1]}
        mcy_eq = r.get("test_eq") == "PASS"
        if eq != mcy_eq:
            disagreements.append((k, eq, mcy_eq))
        klass = next((t for t in tags.get(k, []) if t in CLASSES), "UNTAGGED")
        e = {"id": k, "mutation": muts[k], "klass": klass, "equivalent": eq, "witness": wit,
             "profile": profile, "mcy_tags": tags.get(k, []), "sat_secs": secs,
             "mcy_equivalent": mcy_eq}
        e.update(p)
        e["statement"] = netlist_line(p["vline"])
        entries.append(e)
        if verbose and (n % 50 == 0 or n == len(muts) - 1):
            print(f"  labelled {n + 1}/{len(muts)}", flush=True)
    summary = {
        "mutations": len(entries),
        "equivalent": sum(1 for e in entries if e["equivalent"] and e["klass"] != IDENTITY),
        "killable": sum(1 for e in entries if not e["equivalent"]),
        "identity": identity[0],
        "by_class": {c: sum(1 for e in entries if e["klass"] == c) for c in CLASSES},
        "sat_seconds": round(sum(e["sat_secs"] or 0 for e in entries), 1),
        # MCY's miter let `valid` float; ours holds it at 1 because the task
        # states valid = 1.  A mutant that differs only when valid = 0 is
        # equivalent here and not there, and is listed rather than hidden.
        "valid0_only": [k for k, eq, meq in disagreements if eq and not meq],
        "label_disagreements_other": [k for k, eq, meq in disagreements if not (eq and not meq)],
    }
    json.dump({"summary": summary, "mutants": entries}, open(POOL_JSON, "w"), indent=1)
    if verbose:
        print(f"  pool: {summary['killable']} killable with a verified witness, "
              f"{summary['equivalent']} proved equivalent, identity = mutation {identity[0]}; "
              f"SAT total {summary['sat_seconds']} s; valid0-only {summary['valid0_only']}; "
              f"other disagreements {summary['label_disagreements_other']}")
    return summary


_pool = None


def load():
    global _pool
    if _pool is None:
        if not os.path.exists(POOL_JSON):
            raise RuntimeError("no pool; run `python -m blind_spot pool` first")
        _pool = json.load(open(POOL_JSON))
    return _pool


def mutant(k):
    for e in load()["mutants"]:
        if e["id"] == k:
            return e
    raise KeyError(k)
