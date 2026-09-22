"""This machine's own time horizon: the pipeline from its Inspect logs and its
human-baseline file to the certified fit — built before the data exists, so
that it REFUSES with a count of what is missing rather than waiting to be
written the day the runs land.

    rows = own.collect(ROOT)          → {"models": {...}, "tasks": {...}, "missing": {...}}
    own.fit_all(rows)                 → per model, the certified horizon or NO DATA

The rule for a task's human time: the median of the wall-clock minutes over
the baseline attempts that SOLVED it (METR uses successful human runs as the
task's length; an unsolved attempt says how long someone tried, not how long
the task takes). A task no baseliner solved has no length and is counted
under `missing`. A model's outcome on a task is successes / runs over the
non-control Inspect logs whose sample id is that task. Weights: equal per
task (there is one family per environment so far; the inverse-root-family
rule reduces to it).
"""
from __future__ import annotations

import glob
import json
import os
import statistics
from fractions import Fraction
from typing import Dict

from . import fit as F

LAMBDA = Fraction(1, 100000)


def _logs(root: str):
    out = []
    for f in sorted(glob.glob(os.path.join(root, "environments", "*", "inspect", "logs", "*.json"))):
        try:
            L = json.load(open(f, encoding="utf-8"))
        except Exception:
            continue
        meta = (L.get("eval") or {}).get("metadata") or {}
        model = (L.get("eval") or {}).get("model", "")
        if meta.get("control") or str(model).startswith("mockllm/") or L.get("status") != "success":
            continue
        out.append((f, L))
    return out


def collect(root: str) -> Dict:
    tasks: Dict[str, Dict] = {}
    models: Dict[str, Dict[str, Dict]] = {}
    missing = {"baselineFiles": 0, "baselineAttempts": 0, "attemptsSolved": 0, "tasksWithoutHumanTime": 0,
               "frontierLogs": 0, "frontierRollouts": 0, "rolloutsOnTasksWithoutHumanTime": 0}
    for bf in sorted(glob.glob(os.path.join(root, "environments", "*", "baselines.json"))):
        B = json.load(open(bf, encoding="utf-8"))
        missing["baselineFiles"] += 1
        env = os.path.basename(os.path.dirname(bf))
        per: Dict[str, list] = {}
        for at in B.get("attempts", []):
            missing["baselineAttempts"] += 1
            if at.get("outcome") == "SOLVED" and isinstance(at.get("seconds"), (int, float)):
                missing["attemptsSolved"] += 1
                per.setdefault(env + "::" + at["task_id"], []).append(at["seconds"] / 60.0)
        for t in B.get("tasks", []):
            key = env + "::" + t["task_id"]
            secs = per.get(key)
            tasks[key] = {"env": env, "task_id": t["task_id"], "rung": t.get("rung"),
                          "humanMinutes": (Fraction(str(round(statistics.median(secs), 6))) if secs else None),
                          "solvedAttempts": len(secs) if secs else 0}
            if not secs:
                missing["tasksWithoutHumanTime"] += 1
    for f, L in _logs(root):
        missing["frontierLogs"] += 1
        env = f.split(os.sep + "environments" + os.sep, 1)[1].split(os.sep, 1)[0]
        model = L["eval"]["model"]
        for s in L.get("samples") or []:
            missing["frontierRollouts"] += 1
            key = env + "::" + str(s.get("id"))
            sc = (s.get("scores") or {}).get("exact_verifier")
            if sc is None:
                continue
            solved = 1 if float(sc["value"]["reward"]) >= 1.0 else 0
            t = tasks.get(key)
            if not t or t["humanMinutes"] is None:
                missing["rolloutsOnTasksWithoutHumanTime"] += 1
                continue
            m = models.setdefault(model, {})
            row = m.setdefault(key, {"minutes": t["humanMinutes"], "runs": 0, "successes": 0})
            row["runs"] += 1
            row["successes"] += solved
    return {"tasks": tasks, "models": models, "missing": missing}


def fit_all(rows: Dict) -> Dict:
    out = {}
    for model, per in rows["models"].items():
        ts = list(per.values())
        n = len(ts)
        if n < 3:
            out[model] = {"verdict": "NO DATA", "tasks": n, "why": "fewer than three tasks with a human time and a rollout"}
            continue
        w = [Fraction(1, n)] * n
        r = F.fit([t["minutes"] for t in ts], [Fraction(t["successes"], t["runs"]) for t in ts], w, LAMBDA, (0.5, 0.8))
        out[model] = {"verdict": ("ENCLOSED" if r["certified"] and r["horizons"]["0.5"]["verdict"] == "ENCLOSED" else "REFUSED"),
                      "tasks": n, "rollouts": sum(t["runs"] for t in ts), "fit": {k: v for k, v in r.items() if k != "n"}}
    return out
