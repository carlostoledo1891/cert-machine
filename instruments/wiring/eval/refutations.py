"""The facts behind a handful of real failures, so each can be DRAWN.

A refutation is more useful as a picture than as a sentence, but only if the
picture is of the actual rollout. The taskset is deterministic, so the tasks the
eval ran are reconstructed here from the same seed and paired with what each
model actually answered. Nothing is invented for the illustration.
"""
import json, sys
from fractions import Fraction
sys.path.insert(0, __file__.rsplit("/", 2)[0])
from lattice_claims.certify.exact import decide, norm_sq, ratio_bracket
from lattice_claims.taskset import RUNGS, Taskset

SEED, DIMS, PER = 2026, (8, 12, 16), 15
rows = json.load(open("eval/results.json"))
ts = Taskset(seed=SEED, dims=DIMS)

# rebuild exactly the tasks the eval ran
tasks = {}
for r in RUNGS:
    for i in range(PER):
        tasks[(r, i)] = ts.sample(i * 3 + RUNGS.index(r), rung=r)

# index the rollouts in the order they were generated, per model and rung
seen, order = {}, []
for row in rows:
    k = (row["model"], row["rung"])
    seen[k] = seen.get(k, -1) + 1
    order.append((row, seen[k]))

def facts(task):
    d = task.data
    f = {"rung": d.rung, "n": d.lattice.get("n"), "missing": d.missing,
         "qDigits": len(d.lattice["q"]) if "q" in d.lattice else None}
    if "vector" in d.claim:
        v = [int(c) for c in d.claim["vector"]]
        f["normSq"] = norm_sq(v)
        f["roundedNormSq"] = round(norm_sq(v) ** 0.5) ** 2
    if "norm_printed" in d.claim:
        N = d.claim["norm_printed"]
        q = int(d.lattice["q"])
        f["printed"] = N
        f["loVerdict"] = decide(f["n"], q, Fraction((2 * N - 1) ** 2, 4))
        f["hiVerdict"] = decide(f["n"], q, Fraction((2 * N + 1) ** 2, 4))
        f["loRatio"] = round(float(ratio_bracket(f["n"], q, Fraction((2 * N - 1) ** 2, 4))[0]), 6)
        f["hiRatio"] = round(float(ratio_bracket(f["n"], q, Fraction((2 * N + 1) ** 2, 4))[0]), 6)
    return f

# one real example of each failure shape
want = [
    ("wrong_verdict", lambda r: r["rung"] == "declared" and r["cert"] == 0 and r["verdict"] in ("ADMISSIBLE", "REFUSED")),
    ("straddle_called_definite", lambda r: r["rung"] == "printed" and r["truth"] == "STRADDLES" and r["cert"] == 0),
    ("confident_on_missing", lambda r: r["rung"] == "underspecified" and r["cert"] == 0 and r["verdict"] in ("ADMISSIBLE", "REFUSED")),
    ("reference_slip", lambda r: r["rung"] != "underspecified" and r["cert"] == 1 and r["wf"] == 0),
]
out = []
for name, pred in want:
    for row, idx in order:
        if not pred(row):
            continue
        t = tasks[(row["rung"], idx)]
        out.append({"kind": name, "model": row["model"], "rung": row["rung"],
                    "said": row["verdict"], "truth": row["truth"], "why": row["why"],
                    "facts": facts(t)})
        break

json.dump(out, open("eval/refutations.json", "w"), indent=1)
for o in out:
    print(f"  {o['kind']:26s} {o['model']:10s} said {str(o['said']):12s} truth {o['truth']}")
print(f"{len(out)} refutations written")
