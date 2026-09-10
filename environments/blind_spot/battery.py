#!/usr/bin/env python3
"""environments/blind_spot/battery.py — the blind-spot environment, gated on every build.

    python3 environments/blind_spot/battery.py

WHAT THIS RE-DERIVES AND WHAT IT TRUSTS. The expensive half of this environment is
the SAT labelling: 400 mutants of `core_euclid_strict`, each either proved
equivalent against a hand-written miter or given a counterexample, ~8 minutes of
`yosys sat`. That runs ONCE, on the port, and `pool/pool.json` is its record.
Everything else is re-derived here, every build, from the pinned design:

  · the twenty-seven lifted files are re-hashed against PROVENANCE.json,
  · the control design is rebuilt from `design.il` if the simulator is absent,
  · EVERY ONE of the recorded witnesses is re-run through the actual netlist and
    must flip a pin — so a corrupted label cannot survive a build even though the
    proof that produced it is not re-run,
  · a sample of the proved-equivalent mutants is attacked with all four testbench
    families and must survive,
  · the eleven planted controls run, three of which MUST score.

THE CONTROL THAT WENT QUIET. frontier's session 16 ended on "check the identity
mutation before believing a coverage number", and both of its MCY collectors were
written to do it. Neither ever did: MCY numbers `-mode none` as mutation **1**,
not 0, both collectors asked for `mutation_id = 0`, got an empty row set, and one
printed "not in the sample" while the other's `if m0:` skipped the check without a
word. The numbers were right and the sentence was false for a whole session. It is
planted here as a standing red control: the battery asserts BOTH that id 0 finds
nothing (so the old query was vacuous) and that `-mode none` finds exactly one
(so the new one is not). A control that can be skipped is not a control.

Exit 0 iff every check passes and every red control fires.
"""
import hashlib
import json
import os
import random
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

OUT = os.path.join(ROOT, "corpus", "blindspot", "record.json")

fails, reds, dead = [], 0, 0
lines = []


def report(ok, name, extra=""):
    line = ("PASS " if ok else "FAIL ") + name + (("  " + extra) if extra else "")
    print(line, flush=True)
    lines.append(line)
    if not ok:
        fails.append(name)


def red(ok, name, extra=""):
    """A red control: it must FIRE, i.e. the deliberately wrong thing must be caught."""
    global reds, dead
    if ok:
        reds += 1
    else:
        dead += 1
    report(ok, "RED CONTROL: " + name, extra)


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


t0 = time.time()

# ---------------------------------------------------------------- 1 · the pins
prov = json.load(open(os.path.join(HERE, "PROVENANCE.json")))
moved = [r["file"] for r in prov["files"] if sha(os.path.join(ROOT, r["file"])) != r["sha256"]]
report(not moved, f"the {len(prov['files'])} lifted files re-hash to their pins",
       "moved: " + ", ".join(moved) if moved else "1 declared patch (design.py's repoint)")
if moved:
    print("# refusing: the design under mutation moved")
    sys.exit(1)

from blind_spot import design, families, pool as _pool, sim          # noqa: E402
from blind_spot.forgeries import run as run_controls                 # noqa: E402

missing = design.tools_missing()
report(not missing, "yosys, iverilog and vvp are on PATH", "missing: " + ", ".join(missing) if missing else "")
if missing:
    sys.exit(1)

# ------------------------------------------------------- 2 · the pool's record
P = _pool.load()
mutants, summ = P["mutants"], P["summary"]
ident = [m for m in mutants if "-mode none" in m["mutation"]]
killable = [m for m in mutants if m["witness"]]
equiv = [m for m in mutants if m["equivalent"] and m["klass"] != "IDENTITY"]

report(len(mutants) == 400, "MCY's 400 mutations are all in the pool", f"{len(mutants)}")
report(len(ident) == 1 and ident[0]["id"] == 1,
       "the identity is found by `-mode none`, and it is MCY's mutation 1 (not 0)",
       f"id = {ident[0]['id'] if ident else 'ABSENT'}")
report(len(killable) == 348, "348 mutants carry a verified witness", f"{len(killable)}")
report(len(equiv) == 51, "51 are proved equivalent, the identity NOT counted among them", f"{len(equiv)}")
disagree = [m["id"] for m in mutants if "mcy_equivalent" in m and m["equivalent"] != m["mcy_equivalent"]]
report(not disagree, "the SAT labels agree with MCY on all 400", f"disagreements: {disagree}")
report(len(killable) + len(equiv) + 1 == 400, "every mutation is killable, equivalent, or the identity")

# -------------------------------------- 3 · every witness, through the netlist
if not os.path.exists(os.path.join(design.POOL_DIR, "simpool")):
    print("     the pool simulator is absent; rebuilding it from the pinned design.il ...", flush=True)
    muts = {m["id"]: m["mutation"] for m in mutants}
    sim.build_pool_design(muts, design.POOL_DIR)

recs = [(m["id"], tuple(m["witness"]["u"]), tuple(m["witness"]["v"])) for m in killable]
got = sim.simulate(recs)
bad = [m["id"] for m, (o, mu) in zip(killable, got) if o == mu]
report(not bad, f"all {len(killable)} recorded witnesses re-run through the netlist and every one flips a pin",
       f"did not kill: {bad}" if bad else f"{len(recs)} simulations")
wrong_pins = [m["id"] for m, (o, mu) in zip(killable, got)
              if o != m["witness"]["original"] or mu != m["witness"]["mutant"]]
report(not wrong_pins, "and each lands on the exact pin pair the record names",
       f"differed: {wrong_pins}" if wrong_pins else "")

# --------------------------------- 4 · the proved-equivalent survive the families
rng = random.Random(2026)
sample = rng.sample(equiv, min(8, len(equiv)))
survived = []
for m in sample:
    hit = None
    for fam in design.FAMILIES:
        k = sim.kills(m["id"], list(families.load(fam)))
        if k:
            hit = (m["id"], fam, k[0][:2])
            break
    survived.append(hit)
alive = [h for h in survived if h]
report(not alive, f"{len(sample)} proved-equivalent mutants attacked with all four families ("
       f"{sum(len(families.load(f)) for f in design.FAMILIES):,} pairs each) and none is killed",
       f"killed: {alive}" if alive else "")

# ------------------------------------------------- 5 · the eleven planted controls
rows, failed = run_controls()
positives = [r for r in rows if r[1].get("outcome") == "SOLVED"]
report(not failed, f"{len(rows)} planted controls, {len(failed)} failed",
       "failed: " + ", ".join(failed) if failed else "")
report(len(positives) == 3 and all(r[2] for r in positives),
       "three of them are POSITIVE controls that must SCORE — a suite that fails everything "
       "reports perfect coverage, which is the mistake this environment is named for",
       f"{len(positives)} positive")

# ------------------------------------------------------------- 6 · the test suite
r = subprocess.run([sys.executable, "-m", "pytest", "tests/", "-q"], cwd=HERE,
                   capture_output=True, text=True, timeout=1800)
tail = r.stdout.strip().splitlines()[-1] if r.stdout.strip() else ""
npass = int(re.search(r"(\d+) passed", tail).group(1)) if re.search(r"(\d+) passed", tail) else 0
report(r.returncode == 0 and npass >= 9,
       "the environment's own tests, including the framework-free import and the binding "
       "(which SKIPS rather than guesses when verifiers is absent)", tail)

# --------------------------------- 6b · the recorded rollouts, re-graded
# The parser moved into the package on the port so the adapter and the eval could
# not read a reply by two rules. This is what makes that safe: every stored raw
# re-parsed and re-graded with the package's copy, and no row may move. The 16
# rows Opus declined on a content policy are the runner's label, not the grader's,
# and are counted apart rather than quietly dropped.
from blind_spot import api                                            # noqa: E402
rollouts = json.load(open(os.path.join(HERE, "eval", "results.json")))
declined = [x for x in rollouts if x.get("outcome") == "REFUSED_BY_POLICY"]
graded = [x for x in rollouts if x.get("outcome") != "REFUSED_BY_POLICY"]
movedrows = []
for x in graded:
    g = api.score_task(api.task_for(x["mutant"], x["rung"]), x["raw"])
    if g["outcome"] != x["outcome"] or float(g["reward"]) != float(x["reward"]):
        movedrows.append((x["model"], x["rung"], x["mutant"], x["outcome"], g["outcome"]))
report(not movedrows and len(graded) == 92 and len(declined) == 16,
       f"all {len(graded)} recorded rollouts re-parsed and re-graded with the package's own "
       f"parser and grader; 0 rows moved ({len(declined)} declined on a content policy, counted apart)",
       f"moved: {movedrows[:3]}" if movedrows else "")

# ------------------------------------------------------------ 7 · the red controls
# (a) THE VACUITY THAT BIT FRONTIER FOR A SESSION, planted permanently.
import sqlite3                                                        # noqa: E402
con = sqlite3.connect(design.MCY_DB)
by_id_0 = con.execute("SELECT COUNT(*) FROM mutations WHERE mutation_id = 0").fetchone()[0]
by_mode = con.execute("SELECT COUNT(*) FROM mutations WHERE mutation LIKE '%-mode none%'").fetchone()[0]
id_of_mode = con.execute("SELECT mutation_id FROM mutations WHERE mutation LIKE '%-mode none%'").fetchone()
con.close()
red(by_id_0 == 0 and by_mode == 1,
    "asking MCY for the identity by `mutation_id = 0` returns NOTHING (the query that went quiet "
    "for a whole session), while `-mode none` returns exactly one",
    f"id 0 -> {by_id_0} rows, `-mode none` -> {by_mode} row, which is mutation {id_of_mode[0] if id_of_mode else None}")

# (b) a corrupted witness must not survive the re-simulation
victim = killable[0]
spoiled = list(victim["witness"]["u"])
spoiled[0] = 0 if spoiled[0] != 0 else 1
o, mu = sim.simulate([(victim["id"], tuple(spoiled), tuple(victim["witness"]["v"]))])[0]
red(o == mu, "a witness with one coordinate changed stops killing its mutant — the witness names a "
    "specific pair, not a region", f"mutant {victim['id']}: {o} vs {mu}")

# (c) a proved-equivalent mutant relabelled killable is caught by the same simulation
eq0 = equiv[0]
o2, mu2 = sim.simulate([(eq0["id"], tuple(victim["witness"]["u"]), tuple(victim["witness"]["v"]))])[0]
red(o2 == mu2, "a mutant the miter proved equivalent cannot be killed by another mutant's witness — "
    "so a label swapped from equivalent to killable fails this check", f"mutant {eq0['id']}: {o2} vs {mu2}")

# (d) the identity must be indistinguishable from the design on every pair we throw at it
pairs = [(tuple(rng.randint(-4, 3) for _ in range(design.D)),
          tuple(rng.randint(-4, 3) for _ in range(design.D))) for _ in range(400)]
red(sim.kills(ident[0]["id"], pairs) == [],
    "400 random pairs cannot tell the identity mutation from the unmutated design — if they could, "
    "the control design is not wired the way the pool thinks", "400 pairs, 0 differences")

# ------------------------------------------------------------------- the record
rec = {
    "what": "The blind-spot environment re-derived on this machine: the lifted design re-hashed, every "
            "recorded SAT witness re-run through the actual netlist, the proved-equivalent mutants "
            "attacked, and the planted controls run. The SAT labelling itself is a pinned record "
            "(pool/pool.json), not re-proved here.",
    "mutations": len(mutants), "killable": len(killable), "equivalent": len(equiv),
    "identity": ident[0]["id"] if ident else None,
    "witnessesResimulated": len(recs),
    "controls": {"planted": len(rows), "failed": len(failed), "positive": len(positives)},
    "redControls": {"fired": reds, "dead": dead},
    "verdict": "PASS" if not fails and not dead else "FAIL",
    "seconds": round(time.time() - t0, 1),
    "output": lines,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
strip = lambda d: json.dumps({k: v for k, v in d.items() if k != "seconds"}, sort_keys=True)
if os.path.exists(OUT):
    try:
        old = json.load(open(OUT))
        if strip(old) == strip(rec):
            rec = old
    except Exception:
        pass
json.dump(rec, open(OUT, "w"), indent=1, ensure_ascii=False)

print(f"# {len(fails)} FAIL · {reds} red controls fired, {dead} dead · {rec['seconds']}s"
      + ((": " + ", ".join(fails)) if fails else ""))
sys.exit(1 if fails or dead else 0)
