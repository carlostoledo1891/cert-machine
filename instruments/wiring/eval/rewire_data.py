"""Instances spanning the overflow cliff, with what each grader says about them.

A double holds about 1e308, and a challenge-scaled determinant passes that at
dimension ~102. Below the cliff every grader agrees; above it `float(q)` is
`inf`, the Gaussian heuristic is `inf`, and a float grader admits everything.
This mints instances on both sides so the difference is something a reader can
watch rather than a claim in a table.
"""
import json, random, sys, time
sys.path.insert(0, __file__.rsplit("/", 2)[0])
from lattice_claims.certify.exact import decide, norm_sq
from lattice_claims.certify.naive import careful_float, naive_float
from lattice_claims.generate import mint

DIMS = [60, 90, 104, 120]
PER = 6
rng = random.Random(4242)
out, t0 = [], time.time()
for n in DIMS:
    for k in range(PER):
        aim = rng.uniform(0.94, 1.16)
        ins = mint(n, 10 * n, aim, 6e-3, rng)
        q, ns = ins.q, ins.norm_squared
        nrm = ns ** 0.5
        try:
            nv = naive_float(n, q, nrm)
        except (OverflowError, ValueError):
            nv = "OVERFLOW"
        out.append({
            "n": n, "qDigits": len(str(q)), "ratio": round(float(ins.ratio_lo), 5),
            "exact": decide(n, q, ns), "naive": nv, "careful": careful_float(n, q, nrm),
            # Python RAISES here where JavaScript silently returns Infinity.
            # Same naive grader, blind in one language and crashing in the
            # other, and only one of those gets noticed.
            "overflows": nv == "OVERFLOW",
            # The same naive grader in JavaScript: Number(q) is Infinity, so GH
            # is Infinity and every claim clears it. Python refuses everything
            # above the cliff; JavaScript admits everything. Both are wrong and
            # only the crash gets noticed.
            "naiveJS": "ADMISSIBLE" if nv == "OVERFLOW" else nv,
        })
    print(f"  dim {n}: {PER} minted, {time.time() - t0:.0f}s", flush=True)

agree = sum(1 for r in out if r["naive"] == r["exact"])
json.dump({"instances": out, "dims": DIMS,
           "exactAdmits": sum(1 for r in out if r["exact"] == "ADMISSIBLE"),
           "naiveAdmits": sum(1 for r in out if r["naive"] == "ADMISSIBLE"),
           "carefulAdmits": sum(1 for r in out if r["careful"] == "ADMISSIBLE"),
           "naiveJSAdmits": sum(1 for r in out if r["naiveJS"] == "ADMISSIBLE"),
           "naiveAgrees": agree, "cliff": 102},
          open("eval/rewire.json", "w"))
print(f"{len(out)} instances  exact admits {sum(1 for r in out if r['exact']=='ADMISSIBLE')}"
      f"  naive admits {sum(1 for r in out if r['naive']=='ADMISSIBLE')}"
      f"  naive agrees {agree}/{len(out)}")
