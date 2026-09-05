"""Re-grade the stored replies with the current grader. No API call is made.

Every row in eval/results.json keeps the model's raw reply, so a change to the
grader can be measured against the run that already happened instead of paying
for a new one. Prints every row whose scored reward moved, and the totals.
"""
import json, sys
sys.path.insert(0, __file__.rsplit("/", 2)[0])
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from lattice_claims.taskset import RUNGS, Taskset, grade
from run_models import parse

rows = json.load(open("eval/results.json"))
PER = sum(1 for r in rows if r["model"] == rows[0]["model"] and r["rung"] == "declared")
ts = Taskset(seed=2026, dims=(8, 12, 16))
tasks = {(r, i): ts.sample(i * 3 + RUNGS.index(r), rung=r) for r in RUNGS for i in range(PER)}
seen, moved, tot_old, tot_new = {}, [], 0, 0
for row in rows:
    k = (row["model"], row["rung"])
    seen[k] = seen.get(k, -1) + 1
    t = tasks[(row["rung"], seen[k])]
    assert t._truth == row["truth"], (row, t._truth)
    sub = parse(row["raw"])
    g = grade(t, sub) if sub else {"certified": 0.0, "well_formed": 0.0, "why": "nothing parseable"}
    tot_old += row["cert"]; tot_new += g["certified"]
    if g["certified"] != row["cert"] or g["well_formed"] != row["wf"]:
        moved.append((row["model"], row["rung"], row["cert"], g["certified"], row["wf"], g["well_formed"], g["why"][:90]))
print(f"{len(rows)} rows re-graded; certified {tot_old:.0f} -> {tot_new:.0f}; {len(moved)} rows moved")
for m in moved:
    print("  %-9s %-14s cert %.0f->%.0f  wf %.0f->%.0f  %s" % m)
if "--write" in sys.argv:
    seen = {}
    for row in rows:
        k = (row["model"], row["rung"]); seen[k] = seen.get(k, -1) + 1
        t = tasks[(row["rung"], seen[k])]
        sub = parse(row["raw"])
        g = grade(t, sub) if sub else {"certified": 0.0, "well_formed": 0.0, "why": "nothing parseable"}
        row["cert"], row["wf"], row["why"] = g["certified"], g["well_formed"], g["why"]
    json.dump(rows, open("eval/results.json", "w"))
    print("eval/results.json rewritten")
