"""Emit everything the report page needs. No page logic here, no data there."""
import json, random, sys
from fractions import Fraction
sys.path.insert(0, __file__.rsplit("/", 2)[0])
from lattice_claims.certify.exact import decide, norm_sq, ratio_bracket
from lattice_claims.certify.naive import careful_float, naive_float
from lattice_claims.forgeries import run as run_forgeries
from lattice_claims.generate import mint, wall_norm
from lattice_claims.taskset import RUNGS, STRADDLES, Taskset, grade

out = {"rungs": list(RUNGS)}
out["results"] = json.load(open("eval/results.json"))
for r in out["results"]:
    r.pop("raw", None)

# the forgery table, run fresh so the page cannot drift from the suite
rows, accepted = run_forgeries()
out["forgeries"] = [{"name": n, "must": m, "caught": c, "note": note} for n, m, c, note, _ in rows]
out["forgeries_accepted"] = accepted

# real instances: one that straddles the wall on a printed norm, one that does not
def example(target, want_straddle, seed):
    rng = random.Random(seed)
    for k in range(40):
        n = rng.choice([24, 40, 60])
        ins = mint(n, 10 * n, target, 3e-4, rng)   # challenge-like scaling, as elsewhere
        N = round(ins.norm_squared ** 0.5)
        lo_ns, hi_ns = Fraction((2 * N - 1) ** 2, 4), Fraction((2 * N + 1) ** 2, 4)
        vlo, vhi = decide(ins.n, ins.q, lo_ns), decide(ins.n, ins.q, hi_ns)
        rlo, _ = ratio_bracket(ins.n, ins.q, lo_ns)
        rhi, _ = ratio_bracket(ins.n, ins.q, hi_ns)
        rex, _ = ratio_bracket(ins.n, ins.q, ins.norm_squared)
        straddles = (vlo == "ADMISSIBLE") != (vhi == "ADMISSIBLE")
        if straddles == want_straddle:
            return {"n": ins.n, "q_digits": len(str(ins.q)), "printed": N,
                    "wall": wall_norm(ins.n, ins.q), "exact_norm_sq": str(ins.norm_squared),
                    "ratio_lo": float(rlo), "ratio_hi": float(rhi), "ratio_exact": float(rex),
                    "verdict_lo": vlo, "verdict_hi": vhi, "straddles": straddles}
    return None

out["straddle"] = example(1.04990, True, 21)
out["decidable"] = example(1.0480, False, 22)   # near the wall too, so the two compare

# the canary, measured rather than asserted
canary = []
for dims, label in [((24, 40, 60, 90), "below the cliff"), ((104, 120, 140), "above it")]:
    ts = Taskset(seed=5, dims=dims)
    nv = cf = tot = 0
    for i in range(0, 36, 3):
        t = ts.sample(i, rung="declared")
        v = [int(c) for c in t.data.claim["vector"]]
        g = grade(t, {"verdict": t._truth,
                      "reference": {"norm_squared": norm_sq(v), "factor": "21/20"}})
        tot += 1
        nv += g.get("float_naive") != t._truth
        cf += g.get("float_careful") != t._truth
    canary.append({"label": label, "dims": list(dims), "n": tot, "naive": nv, "careful": cf})
out["canary"] = canary

# the reference policies on the SAME tasks the models saw: floor and ceiling, no API key
from lattice_claims.policies import POLICIES, run_policy
ts_eval = Taskset(seed=2026, dims=(8, 12, 16))
PER = sum(1 for r in out["results"] if r["model"] == out["results"][0]["model"] and r["rung"] == "declared")
base = []
for name in POLICIES:
    row = {"policy": name}
    for r in RUNGS:
        g = run_policy(name, [ts_eval.sample(i * 3 + RUNGS.index(r), rung=r) for i in range(PER)])
        row[r] = [int(sum(x["certified"] for x in g)), len(g)]
    base.append(row)
out["baseline"] = base

# the first run, before the grader was fixed -- kept because it is the finding
out["first_run"] = {"note": "measured the grader, not the models",
                    "certified": {"Opus 5": 24, "Sonnet 5": 14, "Haiku 4.5": 13},
                    "well_formed": {"Opus 5": 0, "Sonnet 5": 0, "Haiku 4.5": 0},
                    "of_certified": 45, "of_well_formed": 30}
json.dump(out, open("eval/page.json", "w"))
print("wrote eval/page.json:", {k: (len(v) if isinstance(v, list) else "ok") for k, v in out.items()})
