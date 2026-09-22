"""METR's evidence as this instrument reads it: the raw runs aggregated per task
exactly, the site's per-task file parsed without a YAML library, the weights
re-derived by METR's own rule, every literal read as the rational it denotes.

THE AGGREGATION IS EXACT AND CHANGES NOTHING. METR fits per run with weight
w_task / n_runs on each run; the score contribution of a task's runs is
Σ_r (w_task / n) (y_r − p) = w_task (ȳ − p), so fitting per task with the mean
outcome ȳ = successes / n as a fractional y is the same estimator to the last
bit — and 228 rows instead of a thousand.
"""
from __future__ import annotations

import json
import math
import re
from collections import Counter, OrderedDict
from fractions import Fraction
from typing import Dict, List, Tuple


def family_of(task_id: str) -> str:
    return task_id.split("/", 1)[0]


def weights_for(tasks: List[dict]) -> Tuple[Dict[str, Fraction], Dict[str, Fraction]]:
    """METR's two weightings over ONE agent's tasks, exact:
    equal_task_weight = 1 / n_tasks (each task's runs share 1/n_runs each);
    invsqrt_task_weight ∝ 1 / sqrt(n_tasks_in_family), normalised to sum 1.
    sqrt is irrational for most family sizes, so the invsqrt weight is a
    rational only after normalisation... it is not: 1/√k is kept as a float
    in METR's pipeline. Here each 1/√k is enclosed by an exact rational
    bracket of width 1e-15 and the fit is made at the bracket's midpoint, the
    enclosure recorded; the battery shows the horizon moves by less than its
    printed precision across the bracket."""
    fam = Counter(family_of(t["task_id"]) for t in tasks)
    n = len(tasks)
    equal = {t["task_id"]: Fraction(1, n) for t in tasks}
    raw = {}
    for t in tasks:
        k = fam[family_of(t["task_id"])]
        raw[t["task_id"]] = _inv_sqrt(k)
    tot = sum(raw.values())
    inv = {k: v / tot for k, v in raw.items()}
    return equal, inv


def _inv_sqrt(k: int) -> Fraction:
    """1/√k as the rational midpoint of a 1e-15 bracket (Fraction of the
    correctly rounded double is within 1 ulp; the bracket is stated in the
    ledger so the choice is visible)."""
    return Fraction(1.0 / math.sqrt(k))


def load_runs(path: str) -> Dict[str, dict]:
    """runs.jsonl → per alias: tasks with minutes, n, successes, the file's
    own per-run weights summed per task (to check against the re-derived ones)."""
    per: Dict[str, OrderedDict] = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            r = json.loads(line)
            a = per.setdefault(r["alias"], OrderedDict())
            t = a.setdefault(r["task_id"], {"task_id": r["task_id"], "family": r["task_family"],
                                           "minutes": Fraction(str(r["human_minutes"])), "n": 0, "successes": Fraction(0),
                                           "file_equal": Fraction(0), "file_invsqrt": Fraction(0), "source": r["task_source"]})
            if t["family"] != r["task_family"] or t["minutes"] != Fraction(str(r["human_minutes"])):
                raise ValueError(f"task {r['task_id']} has two families or two human times in the file")
            t["n"] += 1
            t["successes"] += Fraction(str(r["score_binarized"]))
            t["file_equal"] += Fraction(str(r["equal_task_weight"]))
            t["file_invsqrt"] += Fraction(str(r["invsqrt_task_weight"]))
    out = {}
    for alias, tasks in per.items():
        ts = list(tasks.values())
        equal, inv = weights_for(ts)
        for t in ts:
            t["equal"], t["invsqrt"] = equal[t["task_id"]], inv[t["task_id"]]
            t["y"] = t["successes"] / t["n"]
        out[alias] = {"alias": alias, "tasks": ts, "runs": sum(t["n"] for t in ts)}
    return out


# ---------------------------------------------------- the site's YAML files
def parse_task_results(path: str) -> Dict[str, dict]:
    """task_results_1_1.yaml, parsed by its fixed shape (no YAML library):
    agents: / <alias>: / coefficient, intercept, release_date, tasks: - task_id, human_minutes, n_successes, n_runs, task_weight."""
    text = open(path, encoding="utf-8").read()
    head = {}
    for key in ("benchmark_name", "long_tasks_version", "swaa_version"):
        m = re.search(r"^" + key + r": (\S+)", text, flags=re.M)
        head[key] = m.group(1) if m else None
    i = text.find("\nagents:\n")
    body = text[i + len("\nagents:\n"):]
    agents = {}
    blocks = re.split(r"^  (?=\S)", body, flags=re.M)
    for blk in blocks:
        if not blk.strip():
            continue
        name = blk.split(":\n", 1)[0].strip()
        coef = re.search(r"^    coefficient: (\S+)", blk, flags=re.M)
        icpt = re.search(r"^    intercept: (\S+)", blk, flags=re.M)
        rel = re.search(r"^    release_date: (\S+)", blk, flags=re.M)
        tasks = []
        for tm in re.finditer(r"- task_id: (\S+)\n\s+human_minutes: (\S+)\n\s+n_successes: (\S+)\n\s+n_runs: (\S+)\n\s+task_weight: (\S+)", blk):
            tid, mins, ns, nr, tw = tm.groups()
            tasks.append({"task_id": tid, "family": family_of(tid), "minutes": Fraction(mins), "n": int(nr),
                          "successes": Fraction(ns), "printed_weight": Fraction(tw)})
        if not tasks:
            continue
        equal, inv = weights_for(tasks)
        for t in tasks:
            t["equal"], t["invsqrt"] = equal[t["task_id"]], inv[t["task_id"]]
            t["y"] = t["successes"] / t["n"]
        agents[name] = {"alias": name, "printed": {"coefficient": Fraction(coef.group(1)), "intercept": Fraction(icpt.group(1))},
                        "release_date": rel.group(1), "tasks": tasks, "runs": sum(t["n"] for t in tasks)}
    return {"head": head, "agents": agents}


def parse_benchmark_results(path: str) -> dict:
    text = open(path, encoding="utf-8").read()
    out = {"doubling": {}, "results": {}}
    m = re.search(r"doubling_time_in_days:.*?\n(?=\S)", text, flags=re.S)
    if m:
        for sec in re.finditer(r"^  (\w+):\n((?:    .*\n)+)", m.group(0), flags=re.M):
            out["doubling"][sec.group(1)] = {k: Fraction(v) for k, v in re.findall(r"^    (\w+): (\S+)", sec.group(2), flags=re.M)}
    for r in re.finditer(r"^  (\S+):\n    benchmark_name: \S+\n    metrics:\n      average_score:\n        estimate: (\S+)\n      is_sota: (\S+)\n"
                         r"      p50_horizon_length:\n        ci_high: (\S+)\n        ci_low: (\S+)\n        estimate: (\S+)\n"
                         r"      p80_horizon_length:\n        ci_high: (\S+)\n        ci_low: (\S+)\n        estimate: (\S+)\n    release_date: (\S+)", text, flags=re.M):
        key, avg, sota, h50, l50, e50, h80, l80, e80, rel = r.groups()
        out["results"][key] = {"average_score": Fraction(avg), "is_sota": sota == "true", "release_date": rel,
                               "p50": {"estimate": Fraction(e50), "ci": [Fraction(l50), Fraction(h50)]},
                               "p80": {"estimate": Fraction(e80), "ci": [Fraction(l80), Fraction(h80)]}}
    return out


def parse_release_dates(path: str) -> Dict[str, str]:
    out = {}
    for m in re.finditer(r"^  (.+?): (\d{4}-\d{2}-\d{2})\s*$", open(path, encoding="utf-8").read(), flags=re.M):
        out[m.group(1).strip()] = m.group(2)
    return out


def key_of(alias: str) -> str:
    """'Claude 3.7 Sonnet (Inspect)' → 'claude_3_7_sonnet_inspect', the site's key form."""
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", alias.lower())).strip("_")
