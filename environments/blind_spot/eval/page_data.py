"""Emit everything the report page needs: the pool, the controls, the reference
table and the model run.  No page logic here, no data there."""
import json, os, sys
sys.path.insert(0, __file__.rsplit("/", 2)[0])
from blind_spot import pool
from blind_spot.forgeries import run as run_controls
from blind_spot.taskset import RUNGS

HERE = os.path.dirname(os.path.abspath(__file__))
P = pool.load()
out = {"rungs": list(RUNGS), "pool": P["summary"]}

# where in the netlist a mutation sits, by the line its cell was elaborated from.
# The regions are read off mut/core_euclid_strict.v (the file MCY mutated):
#   253-273 the dot product p = u.v   274-294 s = u.u   295-315 t = v.v
#   316 the trivial branch p <= 0     317-383 the box check   384-394 the verdict
#   cmp 458-464 the width guard       465-466 lp, rp          467-473 le, gt
REGIONS = ["p = u.v", "s = u.u", "t = v.v", "trivial branch", "box check", "verdict logic",
           "cmp width guard", "cmp multipliers", "cmp compare"]


def region(e):
    if e["klass"] == "IDENTITY":
        return None                     # nothing was mutated; it sits in no region
    v = e.get("vline") or 0
    if e.get("submodule") == "cmp":
        return "cmp width guard" if v <= 464 else "cmp multipliers" if v <= 466 else "cmp compare"
    if v <= 273: return "p = u.v"
    if v <= 294: return "s = u.u"
    if v <= 315: return "t = v.v"
    if v == 316: return "trivial branch"
    if v <= 383: return "box check"
    return "verdict logic"


out["regions"] = REGIONS
# the pool, one row per mutant, WITH what the located rung shows and the SAT
# witness: the page lets a reader open any mark and see the record, the bent
# wire and the pair that flips a pin.  Nothing here is a label a task exposes;
# the page is a report, not a prompt.
from blind_spot.taskset import Task, describe, bent_wire, drivers_of
out["mutants"] = []
for e in P["mutants"]:
    st = e.get("statement", "")
    out["mutants"].append({
        "id": e["id"], "klass": e["klass"], "celltype": e.get("celltype"), "region": region(e),
        "submodule": e.get("submodule"), "mode": e.get("mode"), "port": e.get("port"),
        "portbit": e.get("portbit"), "vline": e.get("vline"), "equivalent": e["equivalent"],
        "profile": e["profile"], "sat_secs": e.get("sat_secs"),
        "described": describe(e), "statement": st, "bent": bent_wire(e) if e["klass"] != "IDENTITY" else "",
        "drivers": drivers_of(st)[:4] if st else [], "witness": e.get("witness"),
    })
# six real pairs from each family, so the reader can load one and see what it is
from blind_spot import families as _fam
import random as _rnd
_r = _rnd.Random(11)
out["family_examples"] = {f: [{"u": list(u), "v": list(v)} for u, v in _r.sample(_fam.load(f), 6)]
                          for f in ("corpus", "mint", "outbox", "aligned")}

rows, failed = run_controls()
out["controls"] = [{"name": n, "expect": e, "ok": ok, "note": note, "outcome": g["outcome"],
                    "reward": g["reward"]} for n, e, ok, note, g in rows]
out["controls_failed"] = failed

base_p = os.path.join(HERE, "baseline.json")
out["baseline"] = json.load(open(base_p)) if os.path.exists(base_p) else None
res_p = os.path.join(HERE, "results.json")
if os.path.exists(res_p):
    res = json.load(open(res_p))
    for r in res:
        r.pop("raw", None)
    out["results"] = res
else:
    out["results"] = None
json.dump(out, open(os.path.join(HERE, "page.json"), "w"))
print("wrote eval/page.json:", {k: (len(v) if isinstance(v, list) else "ok" if v else "none") for k, v in out.items()})
