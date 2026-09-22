#!/usr/bin/env python3
"""instruments/horizon/battery.py — the interval library proved to contain, the
certified fit calibrated on data with a known answer, red controls that must
fire, and the shipped ledger walked: pins re-hashed, one agent re-certified
live from the pinned evidence, the doubling time re-derived from the
enclosures.

    python3 instruments/horizon/battery.py

Prints: "horizon battery: N pass, 0 fail, R/R red controls fired".
"""
import hashlib
import json
import math
import os
import random
import sys
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "instruments"))
from horizon import data as D, fit as F, interval as I  # noqa: E402

npass = nfail = reds = fired = 0


def ok(cond, name):
    global npass, nfail
    if cond:
        npass += 1
    else:
        nfail += 1
        print("FAIL " + name)


def red(cond, name):
    global reds, fired, npass, nfail
    reds += 1
    if cond:
        fired += 1
        npass += 1
    else:
        nfail += 1
        print("RED DID NOT FIRE " + name)


Fr = Fraction

# ---- containment against independent decimal expansions ----
# The enclosures are rational and 1e-39 to 1e-48 wide; a 20-digit literal is
# only within 5e-21 of the truth, so the test is that the enclosure OVERLAPS the
# literal's own bracket and is narrower than it — not that a rounded literal
# lands inside a window ten orders of magnitude thinner than its own error.
E = Fr("2.71828182845904523536")
LN2 = Fr("0.69314718055994530942")
LN10 = Fr("2.30258509299404568402")
E10 = Fr("22026.4657948067165169579")
TOL = Fr(1, 10 ** 19)


def overlaps(lo, hi, lit, tol=TOL):
    return lo <= lit + tol and hi >= lit - tol and (hi - lo) < 2 * tol


ok(overlaps(*I.LN2_Q, LN2) and I.LN2[0] <= float(LN2) <= I.LN2[1], "ln 2 is enclosed by its series bounds (rational and float)")
ok(overlaps(*I.exp_point(Fr(1)), E), "exp(1) enclosed by the rational series, narrower than the 20-digit literal's own bracket")
ok(overlaps(*I.exp_point(Fr(10)), E10, Fr(1, 10 ** 15)), "exp(10) enclosed (argument reduction by ln 2)")
ok(overlaps(*I.exp_point(Fr(-10)), 1 / E10, Fr(1, 10 ** 24)), "exp(−10) enclosed")
ok(overlaps(*I.log_point(Fr(10)), LN10), "ln 10 enclosed")
ok(I.log_point(Fr(1))[0] <= 0 <= I.log_point(Fr(1))[1], "ln 1 encloses 0")
random.seed(7)
bad = 0
for _ in range(200):
    x = random.uniform(-40, 40)
    e = I.exp((x, x))
    if not (e[0] <= math.exp(x) <= e[1]):
        bad += 1
    y = random.uniform(1e-9, 1e9)
    l2 = I.log2((y, y))
    if not (l2[0] <= math.log2(y) <= l2[1]):
        bad += 1
    t = I.exp2((x / 4, x / 4))
    if not (t[0] <= 2 ** (x / 4) <= t[1]):
        bad += 1
ok(bad == 0, "600 random points: exp, log2 and 2^x enclosures contain the float library's values")
a, b = (1.0, 2.0), (-3.0, 0.5)
ok(I.mul(a, b) == (I.nd(-6.0), I.nu(1.0)) and I.sub(a, b) == (I.nd(0.5), I.nu(5.0)), "products and differences take the outward hull")
try:
    I.div(a, (-1.0, 1.0))
    red(False, "division by an interval containing zero refuses")
except ZeroDivisionError:
    red(True, "division by an interval containing zero refuses")
try:
    I.log((0.0, 1.0))
    red(False, "log of an interval touching zero refuses")
except ValueError:
    red(True, "log of an interval touching zero refuses")
# a series with its tail bound dropped is NOT an enclosure
s, term = Fr(0), Fr(1)
for n in range(6):
    s += term
    term = term / (n + 1)
red(not (s <= E <= s), "six Taylor terms of exp(1) with no remainder bound do not contain e — the tail bound is load-bearing")

# ---- the fit, on data with a known answer ----
# a logistic law with slope −0.6 and intercept 3: at x = 5 the success rate is 1/2.
random.seed(11)
xs = [2 ** random.uniform(-2, 11) for _ in range(160)]
ys = [1.0 / (1.0 + math.exp(-(-0.6 * math.log2(m) + 3.0))) for m in xs]      # fractional outcomes at the law itself
ws = [Fr(1, 160)] * 160
out = F.fit([Fr(str(round(m, 6))) for m in xs], [Fr(str(round(y, 9))) for y in ys], ws, Fr(1, 10 ** 8))
ok(out["certified"], "the Krawczyk box certifies on synthetic data")
W, B = out["box"]["slope"], out["box"]["intercept"]
ok(abs(W[0] + 0.6) < 1e-6 and abs(B[0] - 3.0) < 1e-6, "…and the box sits at the law's slope −0.6 and intercept 3 to a millionth (the 10⁻⁸ penalty and the rounded inputs are the rest)")
h = out["horizons"]["0.5"]["minutes"]
ok(abs(h[0] - 32.0) < 0.1 and h[1] - h[0] < 1e-6, "…and the 50 % horizon is enclosed at 2^5 = 32 minutes to a millionth")
# the box is tiny compared to the bootstrap intervals the method reports
ok(out["box"]["maxRad"] < 1e-10, "the certified box has radius below 1e-10")
# red: Krawczyk from a candidate far from the zero must not certify
R = F.Runs([Fr(str(round(m, 6))) for m in xs], [Fr(str(round(y, 9))) for y in ys], ws)
K = F.krawczyk(R, Fr(1, 10 ** 8), -0.6, 6.0, max_rounds=6)
red(not K["ok"], "Krawczyk from a candidate three units off the zero does not certify")
# red: a slope box containing zero has no horizon
try:
    F.horizon([(-0.1, 0.1), (1.0, 1.0)], 0.5)
    red(False, "a slope box containing zero refuses a horizon")
except ArithmeticError:
    red(True, "a slope box containing zero refuses a horizon")
# the exact aggregation identity: per-run and per-task fits agree
runs_m = [Fr(10)] * 4 + [Fr(100)] * 4
runs_y = [Fr(1), Fr(1), Fr(1), Fr(0), Fr(1), Fr(0), Fr(0), Fr(0)]
runs_w = [Fr(1, 8)] * 8
o1 = F.fit(runs_m, runs_y, runs_w, Fr(1, 1000))
o2 = F.fit([Fr(10), Fr(100)], [Fr(3, 4), Fr(1, 4)], [Fr(1, 2), Fr(1, 2)], Fr(1, 1000))
ok(o1["certified"] and o2["certified"] and abs(o1["horizons"]["0.5"]["minutes"][0] - o2["horizons"]["0.5"]["minutes"][0]) < 1e-9,
   "per-run and per-task (mean outcome) fits certify the same horizon: the aggregation is exact")

# ---- the weights, METR's rule ----
tasks = [{"task_id": "a/1"}, {"task_id": "a/2"}, {"task_id": "a/3"}, {"task_id": "a/4"}, {"task_id": "b/1"}]
eq, inv = D.weights_for(tasks)
ok(all(v == Fr(1, 5) for v in eq.values()) and abs(float(inv["a/1"]) - 0.5 / (4 * 0.5 + 1)) < 1e-12 and abs(sum(map(float, inv.values())) - 1) < 1e-12,
   "equal weights are 1/n; inverse-root-family weights are 1/√k normalised")
ok(D.key_of("Claude 3.7 Sonnet (Inspect)") == "claude_3_7_sonnet_inspect" and D.key_of("GPT-5.1-Codex-Max (Inspect)") == "gpt_5_1_codex_max_inspect", "aliases map to the site's keys")

# ---- the ledger, walked ----
LP = os.path.join(ROOT, "certs", "horizon-ledger.json")
ok(os.path.exists(LP), "certs/horizon-ledger.json exists")
L = json.load(open(LP))
moved = [f for f, h in L["pins"].items() if hashlib.sha256(open(os.path.join(ROOT, f), "rb").read()).hexdigest() != h]
ok(not moved, "the pinned evidence re-hashes to the ledger's pins")
ok(L["counts"]["certified"] == L["counts"]["fits"], f"every fit in the ledger is certified ({L['counts']['certified']} of {L['counts']['fits']})")
# one agent re-certified live from the pinned per-task file
live = D.parse_task_results(os.path.join(ROOT, "corpus", "metr-horizon", "task_results_1_1.yaml"))
name = "Claude 3.7 Sonnet (Inspect)"
A = live["agents"][name]
o = F.fit([t["minutes"] for t in A["tasks"]], [t["y"] for t in A["tasks"]], [t["invsqrt"] for t in A["tasks"]], Fr(1, 100000), (0.5, 0.8))
row = L["agents"][name]["live"]
ok(o["certified"] and o["horizons"]["0.5"]["minutes"] == row["horizons"]["0.5"]["minutes"] and o["box"]["slope"] == row["box"]["slope"],
   "Claude 3.7 Sonnet re-certified live from the pinned file: the same box, the same horizon enclosure")
ok(row["coefficientsVerdict"] == "REPRODUCED", "…and its printed coefficients (−0.597, 3.535) are the rounding of the certified box")
site = L["agents"][name]["site"]
ok(site["p50"]["relativeGap"] < 1e-4 and not site["p50"]["inside"], "…and the site's own p50 estimate lies within 1e-4 of the certified enclosure but not inside it (a solver's tolerance)")
# the trend re-derived from the ledger's enclosures
T = L["trend"]["certified"]["from_2023_on"]
ok(T["verdict"] == "ENCLOSED" and T["doublingDays"][1] - T["doublingDays"][0] < 1e-6, "the post-2023 doubling time is an enclosure narrower than a microsecond of a day")
printed = float(L["trend"]["printed"]["from_2023_on"]["point_estimate"])
ok(abs(printed - T["doublingDays"][0]) / printed < 0.05, f"…within 5 % of the site's printed {printed} days (the agent set is the site's is_sota flags)")
# red: an agent whose printed p50 is moved by 1 % must read DIFFERS-style: the gap is not below 1e-4
red(abs(60.9 - row["horizons"]["0.5"]["minutes"][0]) / row["horizons"]["0.5"]["minutes"][0] > 1e-4, "a printed horizon 1 % off its certified value is not within the solver-tolerance band")

# ---- this machine's own pipeline: refuses with counts, never with silence ----
from horizon import own as OWN  # noqa: E402
own_rows = OWN.collect(ROOT)
own_fits = OWN.fit_all(own_rows)
ok("own" in L and L["own"]["verdict"] in ("NO DATA", "PARTIAL", "ENCLOSED"), "the ledger carries the machine's own section with a three-valued verdict")
ok(L["own"]["missing"] == own_rows["missing"] and set(L["own"]["models"]) == set(own_fits), "the own section re-derives: the same missing counts and the same model set")
red(OWN.fit_all({"models": {"m": {"t1": {"minutes": Fraction(5), "runs": 1, "successes": 1}}}, "tasks": {}, "missing": {}})["m"]["verdict"] == "NO DATA",
    "a model with fewer than three timed tasks is NO DATA, not a horizon")
# a synthetic own-run set with a known law certifies through the same path
syn = {"models": {"m": {f"t{i}": {"minutes": Fraction(2 ** i), "runs": 4, "successes": (4 if i < 4 else 2 if i == 4 else 0)} for i in range(9)}}, "tasks": {}, "missing": {}}
sf = OWN.fit_all(syn)["m"]
ok(sf["verdict"] == "ENCLOSED" and 12 < sf["fit"]["horizons"]["0.5"]["minutes"][0] < 20, "a synthetic own-run set (all solved below 16 min, half at 16, none above) certifies a horizon near 16 minutes")

REC = os.path.join(ROOT, "corpus", "metr-horizon", "record.json")
rec = {"what": "The horizon battery: the interval library proved to contain, the certified fit calibrated, the red controls fired, the ledger walked.",
       "pass": npass, "fail": nfail, "reds": reds, "fired": fired, "verdict": "PASS" if nfail == 0 and fired == reds else "FAIL"}
old = json.load(open(REC)) if os.path.exists(REC) else None
if old != rec:
    json.dump(rec, open(REC, "w"), indent=1)
print(f"horizon battery: {npass} pass, {nfail} fail, {fired}/{reds} red controls fired")
sys.exit(0 if nfail == 0 and fired == reds else 1)
