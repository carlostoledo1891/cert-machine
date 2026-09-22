#!/usr/bin/env python3
"""run-horizon-ledger.py — METR's Time Horizon 1.1 re-decided as certificates.
Writes certs/horizon-ledger.json.

    python3 tools/run-horizon-ledger.py            (a few minutes; the fits run in parallel)
    python3 tools/run-horizon-ledger.py --check    re-derive and compare with the shipped ledger, write nothing

For every agent, in each of METR's two published forms of the evidence — the
raw runs of the analysis repository (March 2026) and the per-task file behind
the live chart (May 2026) — the penalised logistic fit is CERTIFIED: the
Krawczyk operator proves a box around the float candidate holds exactly one
zero of the score, and the 50 % and 80 % horizons are enclosures over that box
(instruments/horizon/fit.py). The printed numbers — the post's table, the live
file's coefficients to three decimals and horizons to six — are then read
against the enclosures. Then the doubling time: an exact least-squares line
through log2 of the certified horizons against release date over the models
the site flags as state of the art, as an interval.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import time
from datetime import date
from fractions import Fraction
from multiprocessing import Pool

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "instruments"))
from horizon import data as D, fit as F, interval as I, own as OWN  # noqa: E402

CORPUS = os.path.join(ROOT, "corpus", "metr-horizon")
OUT = os.path.join(ROOT, "certs", "horizon-ledger.json")
CHECK = "--check" in sys.argv
LAMBDA = Fraction(1, 100000)          # figs.yaml: regularization 0.00001
QUANTILES = (0.5, 0.8)


def die(m):
    print("HORIZON LEDGER REFUSED: " + m, file=sys.stderr)
    sys.exit(1)


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def fit_agent(job):
    """One certified fit; runs in a worker."""
    name, tasks, weight_key = job
    out = F.fit([t["minutes"] for t in tasks], [t["y"] for t in tasks], [t[weight_key] for t in tasks], LAMBDA, QUANTILES)
    out["alias"] = name
    return out


def serialise(fit):
    r = {"n_tasks": fit["n"], "candidate": fit["candidate"], "certified": fit["certified"], "rounds": fit["rounds"]}
    if fit["certified"]:
        r["box"] = fit["box"]
        r["horizons"] = fit["horizons"]
    else:
        r["why"] = fit.get("why")
    return r


def rounds_to(x_iv, places):
    """The printed rounding of an enclosure, if both ends round the same way."""
    lo, hi = (round(x_iv[0], places), round(x_iv[1], places))
    return lo if lo == hi else None


def main():
    t0 = time.time()
    meta = json.load(open(os.path.join(CORPUS, "meta.json")))
    claims = json.load(open(os.path.join(CORPUS, "claims.json")))
    pins = {}
    for group in ("repository", "site"):
        for f, m in meta[group]["files"].items():
            p = os.path.join(CORPUS, f)
            if not os.path.exists(p):
                die(f"corpus/metr-horizon/{f} is absent")
            if sha(p) != m["sha256"]:
                die(f"corpus/metr-horizon/{f} does not hash to its pin")
            pins["corpus/metr-horizon/" + f] = m["sha256"]

    # ---- the evidence, read ----
    runs = D.load_runs(os.path.join(CORPUS, "runs-1-1.jsonl"))
    if sum(a["runs"] for a in runs.values()) != meta["repository"]["files"]["runs-1-1.jsonl"]["rows"]:
        die("the runs file is not the pinned row count")
    # the file's own per-run weights, summed per task, against the re-derived ones
    wdiff = {"equal": 0.0, "invsqrt": 0.0}
    for a in runs.values():
        for t in a["tasks"]:
            wdiff["equal"] = max(wdiff["equal"], abs(float(t["file_equal"] - t["equal"])))
            wdiff["invsqrt"] = max(wdiff["invsqrt"], abs(float(t["file_invsqrt"] - t["invsqrt"])))
    if wdiff["equal"] > 1e-8 or wdiff["invsqrt"] > 1e-8:
        die(f"the re-derived weights are not the file's: {wdiff}")
    live = D.parse_task_results(os.path.join(CORPUS, "task_results_1_1.yaml"))
    bench = D.parse_benchmark_results(os.path.join(CORPUS, "benchmark_results_1_1.yaml"))
    rel = D.parse_release_dates(os.path.join(CORPUS, "release_dates.yaml"))
    keymap = claims["site"]["aliasToKey"]

    # ---- the fits, in parallel ----
    jobs = [("runs::" + a, runs[a]["tasks"], "invsqrt") for a in sorted(runs)] + \
           [("live::" + a, live["agents"][a]["tasks"], "invsqrt") for a in sorted(live["agents"])]
    with Pool(min(8, os.cpu_count() or 2)) as pool:
        fits = {f["alias"]: f for f in pool.map(fit_agent, jobs)}

    # ---- the comparisons ----
    agents = {}
    for alias in sorted(set(runs) | set(live["agents"])):
        row = {"alias": alias, "key": keymap.get(alias, D.key_of(alias)), "release_date": rel.get(alias)}
        if alias in runs:
            row["runsFile"] = serialise(fits["runs::" + alias])
            row["runsFile"]["runs"] = runs[alias]["runs"]
        if alias in live["agents"]:
            L = live["agents"][alias]
            fr = fits["live::" + alias]
            row["live"] = serialise(fr)
            row["live"]["runs"] = L["runs"]
            row["live"]["printed"] = {"coefficient": float(L["printed"]["coefficient"]), "intercept": float(L["printed"]["intercept"])}
            if fr["certified"]:
                W, B = fr["box"]["slope"], fr["box"]["intercept"]
                rc, ri = rounds_to(W, 3), rounds_to(B, 3)
                row["live"]["coefficientsVerdict"] = ("REPRODUCED" if rc is not None and ri is not None and Fraction(str(rc)) == L["printed"]["coefficient"] and Fraction(str(ri)) == L["printed"]["intercept"]
                                                      else "AT_THE_ROUNDING" if rc is None or ri is None else "DIFFERS")
                row["live"]["coefficientsCertifiedRounded"] = {"coefficient": rc, "intercept": ri}
            b = bench["results"].get(row["key"])
            if b:
                dec = lambda q: float(q)                       # the file's decimals, read back as printed
                row["site"] = {"is_sota": b["is_sota"], "release_date": b["release_date"],
                               "p50": {"estimate": dec(b["p50"]["estimate"]), "ci": [dec(x) for x in b["p50"]["ci"]]},
                               "p80": {"estimate": dec(b["p80"]["estimate"]), "ci": [dec(x) for x in b["p80"]["ci"]]}}
                if fr["certified"]:
                    for q, k in (("0.5", "p50"), ("0.8", "p80")):
                        h = fr["horizons"][q]
                        if h["verdict"] == "ENCLOSED":
                            est = float(b[k]["estimate"])
                            lo, hi = h["minutes"]
                            relgap = max(abs(est - lo), abs(est - hi)) / max(lo, 1e-300)
                            row["site"][k]["certified"] = [lo, hi]
                            row["site"][k]["inside"] = lo <= est <= hi
                            row["site"][k]["relativeGap"] = relgap
                            row["site"][k]["insideBootstrapCI"] = float(b[k]["ci"][0]) <= lo and hi <= float(b[k]["ci"][1])
        # the post's table
        for tr in claims["post"]["table1"]["rows"]:
            if tr.get("alias") == alias and tr.get("th11") and "live" in row and row["live"]["certified"]:
                lo, hi = row["live"]["horizons"]["0.5"]["minutes"]
                printed = tr["th11"][0]
                places = 1 if printed < 10 else 0
                r_ = rounds_to((lo, hi), places)
                row["post"] = {"th11": tr["th11"], "certifiedRounded": r_, "verdict": ("REPRODUCED" if r_ == printed else "DIFFERS"),
                               "relativeGap": abs(printed - (lo + hi) / 2) / ((lo + hi) / 2)}
        agents[alias] = row

    # ---- the doubling time, from the certified live horizons ----
    def trend(after: str, exclude_over_minutes=960):
        pts = []
        for alias, row in agents.items():
            s = row.get("site")
            if not s or not s["is_sota"] or "live" not in row or not row["live"]["certified"]:
                continue
            if row["live"]["horizons"]["0.5"]["verdict"] != "ENCLOSED":
                continue
            lo, hi = row["live"]["horizons"]["0.5"]["minutes"]
            if s["release_date"] < after or (lo + hi) / 2 > exclude_over_minutes:
                continue
            d0 = date.fromisoformat(s["release_date"]) - date(2023, 1, 1)
            pts.append((alias, float(d0.days), I.log2((lo, hi))))
        n = len(pts)
        if n < 3:
            return {"agents": [p[0] for p in pts], "verdict": "REFUSED", "why": "fewer than three points"}
        xs = [p[1] for p in pts]
        xbar = Fraction(sum(Fraction(x) for x in xs), n)
        sxx = sum((Fraction(x) - xbar) ** 2 for x in xs)
        # slope = Σ (x_i − x̄) y_i / Sxx — linear in the y enclosures
        num = (0.0, 0.0)
        for (_, x, y) in pts:
            c = float((Fraction(x) - xbar) / sxx)
            num = I.add(num, I.mul((c, c), y))
        slope = num                                   # bits per day
        if slope[0] <= 0:
            return {"agents": [p[0] for p in pts], "verdict": "REFUSED", "why": "the slope enclosure touches zero"}
        dbl = I.div((1.0, 1.0), slope)                # days per doubling
        return {"agents": [p[0] for p in pts], "n": n, "verdict": "ENCLOSED",
                "slopeBitsPerDay": list(slope), "doublingDays": list(dbl), "since": after,
                "excludedOverMinutes": exclude_over_minutes}
    trends = {"from_2023_on": trend("2023-01-01"), "from_2024_on": trend("2024-01-01")}
    printed_dbl = {k: {kk: float(vv) for kk, vv in v.items()} for k, v in bench["doubling"].items()}

    # ---- this machine's own runs and baselines, through the same fit ----
    own_rows = OWN.collect(ROOT)
    own_fits = OWN.fit_all(own_rows)
    own = {"missing": own_rows["missing"], "tasksListed": len(own_rows["tasks"]),
           "tasksWithHumanTime": sum(1 for t in own_rows["tasks"].values() if t["humanMinutes"] is not None),
           "models": own_fits,
           "verdict": ("NO DATA" if not own_fits else "ENCLOSED" if all(v["verdict"] == "ENCLOSED" for v in own_fits.values()) else "PARTIAL"),
           "rule": "a task's human time is the median wall-clock minutes over the baseline attempts that SOLVED it; a model's outcome is successes/runs over its non-control Inspect logs; equal task weights; λ = 1e-5; the same certified fit as above"}

    ledger = {
        "what": "METR's Time Horizon 1.1 re-decided as certificates: for every agent, in the raw runs of the analysis "
                "repository and in the per-task file behind the live chart, the penalised logistic fit proved to hold "
                "exactly one zero of its score in a box (Krawczyk, outward-rounded interval arithmetic, certified exp), "
                "the 50 % and 80 % horizons as enclosures over the box, the printed coefficients and horizons read "
                "against them, and the doubling time as an exact least-squares line through the certified horizons.",
        "generated": time.strftime("%Y-%m-%d"),
        "pins": pins,
        "estimator": {"weighting": "invsqrt_task_weight (re-derived per agent from the task families, normalised to 1)",
                      "regularization": str(LAMBDA), "x": "log2(human minutes), the literal read as the rational it denotes and enclosed",
                      "y": "successes / runs per task, exact — the same score as METR's per-run form",
                      "aggregation": "per task, exact: Σ_runs (w/n)(y_r − p) = w(ȳ − p)",
                      "weightsNote": "1/√k for a family of k tasks is the correctly rounded double, taken as a rational; the file's own weights agree to " + f"{max(wdiff.values()):.1e}"},
        "agents": agents,
        "trend": {"certified": trends, "printed": printed_dbl, "post": claims["post"]["doublingTimeDays"]},
        "own": own,
        "counts": {"runsFileAgents": len(runs), "liveAgents": len(live["agents"]), "siteResults": len(bench["results"]),
                   "certified": sum(1 for f in fits.values() if f["certified"]), "fits": len(fits)},
        "seconds": round(time.time() - t0, 1),
    }
    if CHECK:
        old = json.load(open(OUT)) if os.path.exists(OUT) else {}
        strip = lambda d: json.dumps({k: v for k, v in d.items() if k not in ("generated", "seconds")}, sort_keys=True)
        if strip(old) != strip(ledger):
            print("DRIFT: the ledger would change; run without --check")
            return 1
        print("horizon ledger unchanged")
        return 0
    json.dump(ledger, open(OUT, "w"), indent=1, ensure_ascii=False)
    print(f"wrote certs/horizon-ledger.json: {ledger['counts']} in {ledger['seconds']} s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
