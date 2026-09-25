#!/usr/bin/env python3
"""Write certs/blind-spot-inspect-ledger.json from the recorded Inspect logs and the
human-baselines file. THE ONE PLACE a number about the Inspect runs comes from.

    python3 environments/blind_spot/inspect/ledger.py                 write the ledger
    python3 environments/blind_spot/inspect/ledger.py --check         refuse if it would change
    python3 environments/blind_spot/inspect/ledger.py --grade-baselines
                                                                      grade every attempt in
                                                                      baselines.json with the
                                                                      exact verifier, then write

Every log in inspect/logs/*.json is an `inspect eval --log-format json` record.
For each sample the assistant text is re-scored with `api.score(seed, index, text)`
— the decision the verifiers rubric makes — and compared with the score Inspect
wrote; the per-rung and total counts are derived from the RE-SCORE, not from
Inspect's metrics, so the ledger is this package's reading of the log. A
disagreement is recorded, not hidden, and the battery refuses on it.

Pins: task.py, baselines.json and every log, by sha256. Editing baselines.json
(a new attempt) without re-running this file turns the battery red — that is the
"restore-the-record-on-refuse" pattern: nothing is stated from a file the ledger
has not read.

Runs under environments/blind_spot/.venv (it reads Inspect logs with inspect_ai).
"""
from __future__ import annotations

import hashlib
import json
import os
import statistics
import subprocess
import sys
import time
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ENV = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(ENV, "..", ".."))
VENV_PY = os.path.join(ENV, ".venv", "bin", "python")
LEDGER = os.path.join(ROOT, "certs", "blind-spot-inspect-ledger.json")
BASELINES = os.path.join(ENV, "baselines.json")
LOGS = os.path.join(HERE, "logs")

try:
    import inspect_ai  # noqa: F401
except ImportError:
    if os.path.exists(VENV_PY) and os.path.abspath(sys.executable) != os.path.abspath(VENV_PY):
        os.execv(VENV_PY, [VENV_PY] + sys.argv)
    raise SystemExit("environments/blind_spot/.venv is missing: `make blind-spot-venv`")

sys.path.insert(0, ENV)
sys.path.insert(0, HERE)
from inspect_ai.log import read_eval_log          # noqa: E402
from blind_spot import api                        # noqa: E402
from blind_spot.taskset import RUNGS              # noqa: E402

BASELINE_TASKS_PER_RUNG = 6
# per-MTok, Anthropic first-party rates (the same table eval/run_verifiers.py carries, 2026-06-24)
PRICES = {"claude-opus-5": (5.00, 25.00), "claude-sonnet-5": (2.00, 10.00), "claude-haiku-4-5": (1.00, 5.00)}


def price_of(model: str):
    m = model.split("/", 1)[-1]
    for k, v in PRICES.items():
        if m.startswith(k):
            return v
    return None


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def _text(sample):
    return "".join(m.text if not isinstance(m.content, str) else m.content
                   for m in sample.messages if m.role == "assistant")


def summarize_log(path):
    """One run: the counts re-derived by re-scoring every sample."""
    log = read_eval_log(path)
    rows, dis = [], 0
    for s in log.samples or []:
        sc = s.scores.get("exact_verifier")
        text = _text(s)
        mine = api.score(int(s.metadata["seed"]), int(s.metadata["index"]), text)
        logged = float(sc.value["reward"]) if sc else None
        if sc is None or abs(logged - float(mine["reward"])) > 1e-9 or sc.metadata.get("outcome") != mine["outcome"]:
            dis += 1
        usage = {}
        for mu in (s.model_usage or {}).values():
            usage["input"] = usage.get("input", 0) + int(mu.input_tokens or 0)
            usage["output"] = usage.get("output", 0) + int(mu.output_tokens or 0)
        rows.append({
            "id": s.id, "rung": s.metadata["rung"], "klass": s.metadata["klass"], "truth": s.metadata["truth"],
            "mutant": s.metadata["mutant"], "outcome": mine["outcome"], "reward": mine["reward"],
            "well_formed": mine["well_formed"], "false_claim": mine["false_claim"],
            "in_box_kill": mine.get("in_box_kill"), "logged_reward": logged,
            "error": (str(s.error.message)[:200] if s.error else None),
            "in_tokens": usage.get("input", 0), "out_tokens": usage.get("output", 0),
            "seconds": (round(s.total_time, 1) if getattr(s, "total_time", None) else None),
        })

    def tally(rs):
        c = Counter(r["outcome"] for r in rs)
        answered = [r for r in rs if r["well_formed"] == 1.0]
        return {
            "n": len(rs), "solved": c.get("SOLVED", 0), "wrong": c.get("WRONG", 0), "missed": c.get("MISSED", 0),
            "undecided": c.get("UNDECIDED", 0), "refused_parse": c.get("REFUSED_PARSE", 0),
            "false_claims": sum(int(r["false_claim"]) for r in rs),
            "out_of_box_kills": sum(1 for r in rs if r["in_box_kill"] is False),
            "mean_reward": (round(sum(r["reward"] for r in rs) / len(rs), 4) if rs else None),
            "mean_reward_answered": (round(sum(r["reward"] for r in answered) / len(answered), 4) if answered else None),
            "errors": sum(1 for r in rs if r["error"]),
        }

    cfg = log.plan.config if log.plan else None
    meta = dict(log.eval.metadata or {})
    return {
        "log": os.path.relpath(path, ROOT), "sha256": sha(path),
        "task": log.eval.task, "task_args": dict(log.eval.task_args or {}), "model": log.eval.model,
        # a mockllm run driven by a reference policy is a CONTROL of the pipeline, never a model result
        "control": bool(meta.get("control")) or str(log.eval.model).startswith("mockllm/"),
        "policy": meta.get("policy"),
        "inspect_ai": log.eval.packages.get("inspect_ai") if log.eval.packages else None,
        "status": log.status, "ran": str(log.eval.created),
        "config": {"effort": getattr(cfg, "effort", None), "max_tokens": getattr(cfg, "max_tokens", None),
                   "reasoning_effort": getattr(cfg, "reasoning_effort", None)} if cfg else {},
        "concord": {"rollouts": len(rows), "disagreements": dis},
        "by_rung": {r: tally([x for x in rows if x["rung"] == r]) for r in RUNGS if any(x["rung"] == r for x in rows)},
        "by_class": {k: {"n": sum(1 for x in rows if x["klass"] == k),
                         "solved": sum(1 for x in rows if x["klass"] == k and x["outcome"] == "SOLVED")}
                     for k in sorted({x["klass"] for x in rows})},
        "totals": tally(rows),
        "usage": {"input": sum(r["in_tokens"] for r in rows), "output": sum(r["out_tokens"] for r in rows)},
        "costUsd": (round(sum(r["in_tokens"] for r in rows) / 1e6 * price_of(log.eval.model)[0]
                          + sum(r["out_tokens"] for r in rows) / 1e6 * price_of(log.eval.model)[1], 4)
                    if price_of(log.eval.model) else None),
        "costNote": "errored rollouts report no usage, so this is a floor, not the bill",
        "rows": rows,
    }


def baseline_tasks():
    """The fixed task list the baseliners attempt: the first six of each variant."""
    import task as T
    out = []
    for r in RUNGS:
        for i in T.indices(r, BASELINE_TASKS_PER_RUNG, 0):
            row = api.task_row(T.DEFAULT_SEED, i)
            out.append({"task_id": row["task_id"], "rung": r, "index": i, "seed": T.DEFAULT_SEED})
    return out


def grade_baselines(B):
    """Fill outcome and reward on every attempt from the exact verifier; refuse to
    overwrite a stored outcome that disagrees."""
    moved = []
    for at in B["attempts"]:
        if at.get("reply") is None:
            continue
        s_, i_ = at["task_id"].split("-")
        reply = json.dumps(at["reply"]) if isinstance(at["reply"], dict) else str(at["reply"])
        g = api.score(int(s_), int(i_), reply)
        if "outcome" in at and (at["outcome"] != g["outcome"] or float(at.get("reward", -9)) != float(g["reward"])):
            moved.append((at["task_id"], at["outcome"], g["outcome"]))
        at["outcome"], at["reward"] = g["outcome"], g["reward"]
    if moved:
        raise SystemExit(f"REFUSING: stored outcomes disagree with the verifier: {moved}")
    return B


def baseline_summary(B):
    ats = [a for a in B["attempts"] if a.get("outcome")]
    by = {}
    for r in RUNGS:
        rs = [a for a in ats if a["rung"] == r]
        by[r] = {"attempts": len(rs), "solved": sum(1 for a in rs if a["outcome"] == "SOLVED"),
                 "baseliners": len({a["baseliner"] for a in rs}),
                 "median_seconds": (statistics.median(a["seconds"] for a in rs) if rs else None),
                 "median_seconds_solved": (statistics.median(a["seconds"] for a in rs if a["outcome"] == "SOLVED")
                                           if any(a["outcome"] == "SOLVED" for a in rs) else None)}
    return {"path": "environments/blind_spot/baselines.json", "attempts": len(ats),
            "baseliners": len({a["baseliner"] for a in ats}),
            "status": ("NO DATA" if not ats else f"{len(ats)} attempts by {len({a['baseliner'] for a in ats})} baseliners"),
            "by_rung": by, "tasks": len(B["tasks"])}


def build():
    B = json.load(open(BASELINES))
    if not B["tasks"]:
        B["tasks"] = baseline_tasks()
    if "--grade-baselines" in sys.argv:
        B = grade_baselines(B)
    json.dump(B, open(BASELINES, "w"), indent=1, ensure_ascii=False)
    open(BASELINES, "a").write("\n")

    runs = [summarize_log(os.path.join(LOGS, f)) for f in sorted(os.listdir(LOGS)) if f.endswith(".json")] if os.path.isdir(LOGS) else []
    # attempts that reached the API and were refused before any generation: kept, not hidden
    blocked = []
    bdir = os.path.join(LOGS, "blocked")
    for f in sorted(os.listdir(bdir)) if os.path.isdir(bdir) else []:
        if not f.endswith(".json"):
            continue
        log = read_eval_log(os.path.join(bdir, f))
        msg = str(log.error.message) if log.error else ""
        i = msg.find("Error code:")
        blocked.append({"log": os.path.relpath(os.path.join(bdir, f), ROOT), "sha256": sha(os.path.join(bdir, f)),
                        "model": log.eval.model, "task": log.eval.task, "status": log.status, "ran": str(log.eval.created),
                        "samples_completed": len(log.samples or []),
                        "error": (msg[i:i + 220] if i >= 0 else msg[:220])})
    pins = {"environments/blind_spot/inspect/task.py": sha(os.path.join(HERE, "task.py")),
            "environments/blind_spot/baselines.json": sha(BASELINES)}
    for r in runs:
        pins[r["log"]] = r["sha256"]
    for b in blocked:
        pins[b["log"]] = b["sha256"]
    P = json.load(open(os.path.join(ENV, "pool", "pool.json")))["summary"]
    must = []
    for r in runs:
        must.append(r["model"].split("/", 1)[-1] if not r["control"] else f"`{r['policy']}`")
        for rung, t in r["by_rung"].items():
            must.append(f"{t['solved']}/{t['n']}" if not r["control"] else f"{t['mean_reward']:+.3f}")
    models = sorted({r["model"] for r in runs if not r["control"]})
    ladder = {}
    for r in runs:
        if r["control"]:
            continue
        key = r["model"].split("/", 1)[-1] + "@" + str(r["config"].get("effort") or "default")
        row = ladder.setdefault(key, {"model": r["model"], "effort": r["config"].get("effort") or "default", "rungs": {}, "costUsd": 0.0})
        for rung, t in r["by_rung"].items():
            row["rungs"][rung] = {"solved": t["solved"], "n": t["n"], "wrong": t["wrong"], "unreadable": t["refused_parse"], "mean_reward": t["mean_reward"]}
        row["costUsd"] = round(row["costUsd"] + (r["costUsd"] or 0), 4)
    git = subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True, cwd=ROOT).stdout.strip()
    return {
        "what": "The Inspect binding of blind-spot: every recorded `inspect eval` run re-scored by this package, the "
                "human-baselines file pinned and graded by the same verifier. Every number a page or README states "
                "about the Inspect runs is read from here.",
        "scorer": "blind_spot.adapters_v0._decide — the function the verifiers rubric calls; a KILL is verified by "
                  "simulating the netlist under the mutation, EQUIVALENT against the SAT proof; no answer key, no "
                  "judge, no tolerance",
        "ladder": {"mutations": P["mutations"], "killable": P["killable"], "equivalent": P["equivalent"],
                   "identity": P["identity"], "by_class": P["by_class"],
                   "rungs": {"located": "the mutation named: cell, port, bit, how it is bent, the statement, the wire",
                             "profile": "the location withheld; which of the four testbench families killed it",
                             "blind": "nothing but the design"}},
        "taskset": {"seed": 2027, "rule": "index i serves rung RUNGS[i % 3]; a rung variant is the indices congruent "
                    "to its offset mod 3; the sample id is `seed-index` = taskset.Task.id"},
        "ladder": ladder,
        "frontier": {"models_run": models,
                     "status": ("NO FRONTIER RUN YET: every attempt was refused before generation — see `blocked`"
                                if not models else f"{len(models)} model(s) run end to end")},
        "runs": [{k: v for k, v in r.items() if k != "rows"} | {"rows": r["rows"]} for r in runs],
        "blocked": blocked,
        "baselines": baseline_summary(B),
        "pins": pins,
        "readme_must_quote": must,
        "git": git, "builtOn": time.strftime("%Y-%m-%d %H:%M:%S %z"),
    }


README = os.path.join(HERE, "README.md")
BEGIN, END = "<!-- results:begin -->", "<!-- results:end -->"


def render_results(rec):
    """The README's results section, from the ledger and nothing else."""
    L = []
    frontier = [r for r in rec["runs"] if not r["control"]]
    controls = [r for r in rec["runs"] if r["control"]]
    if frontier:
        L.append("**Frontier models, through `inspect eval`** (every rollout re-scored offline by the package; "
                 "the reward is this package's reading, and it equals Inspect's on every row):")
        L.append("")
        L.append("| model | effort | rung | n | solved | wrong | missed | undecided | unreadable | errors | mean reward | out-of-box kills | cost floor |")
        L.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
        rank = {"low": 0, "medium": 1, "high": 2}
        for r in sorted(frontier, key=lambda r: (r["model"], rank.get(str(r["config"].get("effort")), 9), r["ran"])):
            for rung, t in r["by_rung"].items():
                L.append(f"| {r['model'].split('/', 1)[-1]} | {r['config'].get('effort') or 'default'} | {rung} | {t['n']} | {t['solved']}/{t['n']} | {t['wrong']} | {t['missed']} | {t['undecided']} | {t['refused_parse']} | {t['errors']} | {t['mean_reward']:+.3f} | {t['out_of_box_kills']} | ${r['costUsd']:.2f} |" if r.get('costUsd') is not None else
                         f"| {r['model'].split('/', 1)[-1]} | {r['config'].get('effort') or 'default'} | {rung} | {t['n']} | {t['solved']}/{t['n']} | {t['wrong']} | {t['missed']} | {t['undecided']} | {t['refused_parse']} | {t['errors']} | {t['mean_reward']:+.3f} | {t['out_of_box_kills']} | — |")
        L.append("")
        L.append("The cost column is a floor: errored rollouts report no usage. Each run is one `inspect eval` "
                 "of one rung variant; the seed is 2027 and the tasks are the same ids across models and efforts.")
        L.append("")
    else:
        L.append("**No frontier model has been run yet.** " + rec["frontier"]["status"] + ".")
        L.append("")
    if controls:
        L.append("**The pipeline controls** — the three reference policies as Inspect solvers on the mixed task "
                 "(controls of the pipeline, never model results; the ledger marks them `control: true`):")
        L.append("")
        L.append("| policy | " + " | ".join(f"`{rung}`" for rung in RUNGS) + " | all | note |")
        L.append("|---|" + "---|" * len(RUNGS) + "---|---|")
        notes = {"sat": "the witness, or the proof", "abstain": "UNDECIDED always", "never": "EQUIVALENT always"}
        for r in sorted(controls, key=lambda r: ["sat", "abstain", "never"].index(r["policy"]) if r["policy"] in ("sat", "abstain", "never") else 9):
            cells = " | ".join(f"{r['by_rung'][rung]['mean_reward']:+.3f}" if rung in r["by_rung"] else "—" for rung in RUNGS)
            L.append(f"| `{r['policy']}` — {notes.get(r['policy'], '')} | {cells} | {r['totals']['mean_reward']:+.3f} | "
                     f"{r['totals']['solved']}/{r['totals']['n']} solved, {r['totals']['false_claims']} false claims |")
        L.append("")
    if rec["blocked"]:
        b = rec["blocked"][-1]
        L.append(f"Refused attempts are kept, not hidden: {len(rec['blocked'])} under `logs/blocked/` (the last: {b['model']} on "
                 f"{b['ran'][:10]}, {b['status']}, `{b['error'][:80]}…`).")
        L.append("")
    return "\n".join(L)


def splice_readme(rec):
    if not os.path.exists(README):
        return
    txt = open(README, encoding="utf-8").read()
    if BEGIN not in txt or END not in txt:
        return
    i, j = txt.index(BEGIN) + len(BEGIN), txt.index(END)
    new = txt[:i] + "\n" + render_results(rec) + txt[j:]
    if new != txt:
        open(README, "w", encoding="utf-8").write(new)


def main():
    rec = build()
    splice_readme(rec)
    if "--check" in sys.argv:
        old = json.load(open(LEDGER)) if os.path.exists(LEDGER) else {}
        strip = lambda d: json.dumps({k: v for k, v in d.items() if k not in ("builtOn", "git")}, sort_keys=True)
        if strip(old) != strip(rec):
            print("DRIFT: the ledger would change; run without --check")
            return 1
        print("ledger unchanged")
        return 0
    json.dump(rec, open(LEDGER, "w"), indent=1, ensure_ascii=False)
    print(f"wrote {os.path.relpath(LEDGER, ROOT)}: {len(rec['runs'])} run(s), "
          f"{sum(r['totals']['n'] for r in rec['runs'])} rollouts, baselines {rec['baselines']['status']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
