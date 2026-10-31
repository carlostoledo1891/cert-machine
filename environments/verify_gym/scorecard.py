#!/usr/bin/env python3
"""scorecard.py: certs/verify-gym-scorecard.json, the reference policies graded on the frozen held-out set.

    python3 environments/verify_gym/scorecard.py           gate, grade, cross-check, write the scorecard
    python3 environments/verify_gym/scorecard.py --check   the same, and refuse unless it equals the file

Order, every run: (1) the held-out file is read only if it hashes to the curriculum's sha256 (the
pre-registration's); (2) the forgery gate runs on EVERY held-out row (each planted answer must score 0 under its
expected verdict, each green control above 0), and a failure writes nothing; (3) each policy answers each prompt;
(4) every answer and every planted forgery is decided again by check.js and compared field by field, and one
difference writes nothing; (5) the record.

    python3 environments/verify_gym/scorecard.py --add RUN_DIR   add (or replace) the model row RUN_DIR's answers make

A MODEL ROW is built from a stored run (modelrow.py: RUN_DIR/run.json and RUN_DIR/rollouts.jsonl, the 120 held-out
prompts x 8 samples, every reply with its sha256): the log must hash to the sha256 run.json names, every reply is
graded by verify_gym/exact.py and again by check.js (one difference writes nothing), a reply the caller truncated
is paid 0 and counted in its own column, and the row carries the sampling, the spend and the per-task mean
progress. `--check` re-derives every model row from its stored log too, so a row cannot drift from its replies.
Each model row is its own run on the operator's word.                                                       MIT"""
import hashlib
import json
import os
import sys
from collections import Counter
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from verify_gym import api, exact, rollouts  # noqa: E402
from verify_gym.forgeries import gate, green, plant  # noqa: E402
from verify_gym.policies import DESCRIBE, POLICIES  # noqa: E402
from verify_gym.task import grade, parse  # noqa: E402
import crosscheck  # noqa: E402

OUT = os.path.join(ROOT, "certs", "verify-gym-scorecard.json")
VERDICTS = (exact.CERTIFIED, exact.REFUTED, exact.REFUSED, exact.MALFORMED)


def die(m):
    sys.exit("VERIFY-GYM SCORECARD REFUSED: " + m)


def summarise(grades):
    c = Counter(g["verdict"] for g in grades)
    n = len(grades)
    return {"n": n, "mean_reward": round(sum(g["reward"] for g in grades) / n, 6),
            "mean_progress": round(sum(g["progress"] for g in grades) / n, 6),
            "verdicts": {v: c.get(v, 0) for v in VERDICTS}}


def build():
    entry = next(h for h in api.curriculum()["heldout"] if h["version"] == "v0")
    rows = api.heldout("v0")                              # refuses a file that moved
    g = gate(rows=rows)
    if not g["ok"]:
        die("the forgery gate failed on the held-out set: %s" % g["failures"][:3])

    items, py, unsent = [], {}, 0

    def send(iid, row, reply, graded):
        nonlocal unsent
        lo, hi, _ = parse(reply)
        if lo is None:
            unsent += 1                                   # no endpoint texts: a format-layer MALFORMED
            return
        py[iid] = graded
        items.append(crosscheck.item(iid, row, lo, hi))

    policies = []
    per_task = {}
    for name, pol in POLICIES.items():
        grades = []
        for r in rows:
            reply = pol(r["prompt"])
            gr = grade(r, reply)
            grades.append(gr)
            send("%s|%s" % (r["id"], name), r, reply, gr)
        fam = {}
        for f in api.curriculum()["heldout"][0]["families"]:
            fam[f] = summarise([gr for r, gr in zip(rows, grades) if r["family"] == f])
        policies.append(dict(id=name, does=DESCRIBE[name], **summarise(grades), by_family=fam))
        per_task[name] = [gr["progress"] for gr in grades]
    for r in rows:
        for fname, reply, _ in plant(r):
            send("%s|forgery|%s" % (r["id"], fname), r, reply, grade(r, reply))
        for fname, reply in green(r):
            send("%s|green|%s" % (r["id"], fname), r, reply, grade(r, reply))
    compared, bad = crosscheck.compare(py, items)
    if bad:
        die("the two deciders disagree on %d answers, first: %s" % (len(bad), json.dumps(bad[0])))

    order = [r["id"] for r in rows]
    return {
        "what": "verify-gym v0 scorecard: the reference policies on the frozen held-out set, every answer decided "
                "exactly twice (verify_gym/exact.py and check.js, no shared code). Policies only; a model row is "
                "added by its own run on the operator's word. Re-derived by environments/verify_gym/scorecard.py "
                "--check.",
        "preregistration": "notes/verify-gym-preregistration-2026-10-31.md",
        "heldout": {"file": "environments/verify_gym/verify_gym/" + entry["file"], "sha256": entry["sha256"],
                    "n": entry["n"], "per_family": entry["per_family"]},
        "reward": "progress / cap, progress = min(cap, max(0, d - d0)), d = max(0, floor(-log10(hi - lo))) when both "
                  "sides are CERTIFIED; 0 for a REFUTED or REFUSED side, lo >= hi, an unreadable endpoint, or one over "
                  "the size limit",
        "families": [{"id": f["id"], "cap": f["cap"], "limit": "10^%d" % f["limit_digits"]}
                     for f in api.curriculum()["families"]],
        "gate": {k: g[k] for k in ("rows", "planted", "leaked", "misfiled", "green", "green_failed")},
        "crosscheck": {"decider2": "environments/verify_gym/check.js (node, BigInt; Sturm for the isolation)",
                       "answers_compared": compared, "disagreements": 0,
                       "format_malformed_not_sent": unsent,
                       "fields": list(crosscheck.FIELDS)},
        "policies": policies,
        "per_task": {"order": order, "order_sha256": hashlib.sha256("\n".join(order).encode()).hexdigest(),
                     "progress": per_task},
        "models": [],
    }


def model_row(run_dir):
    """The scorecard row of one stored model run, graded here from its replies (never from the run's own grades)."""
    run = json.load(open(os.path.join(run_dir, "run.json")))
    text = open(os.path.join(run_dir, run["log"]["file"]), encoding="utf-8").read()
    if hashlib.sha256(text.encode("utf-8")).hexdigest() != run["log"]["sha256"]:
        die("%s: the log does not hash to the sha256 run.json names" % run_dir)
    head, samples = rollouts.loads(text)
    st = run["settings"]
    if head.get("split") != "heldout" or st.get("pilot") or head.get("samples") != 8:
        die("%s: not a held-out run of 8 samples per task (a pilot is never a row)" % run_dir)
    rows = api.heldout("v0")
    by_id = {r["id"]: r for r in rows}
    order = [r["id"] for r in rows]
    if sorted((x["task_id"], x["sample"]) for x in samples) != sorted((t, k) for t in order for k in range(8)):
        die("%s: the log is not every held-out task x samples 0..7, each once" % run_dir)
    grades, py, items = [], {}, []
    for x in samples:
        r = by_id[x["task_id"]]
        g = dict(grade(r, x["reply"]))
        g["truncated"] = x.get("finish_reason") == "length"
        if g["truncated"]:
            g["reward"], g["progress"] = 0, 0
        g["task_id"] = x["task_id"]
        grades.append(g)
        lo, hi, _ = parse(x["reply"])
        if lo is not None:
            iid = json.dumps([x["task_id"], lo, hi])
            if iid not in py:
                py[iid] = grade(r, x["reply"])
                items.append(crosscheck.item(iid, r, lo, hi))
    compared, bad = crosscheck.compare(py, items) if items else (0, [])
    if bad:
        die("%s: the two deciders disagree on %d answers, first: %s" % (run_dir, len(bad), json.dumps(bad[0])))
    untrunc = [g for g in grades if not g["truncated"]]

    def summ(gs):
        out = summarise(gs) if gs else {"n": 0}
        c = Counter(g["verdict"] for g in gs if not g["truncated"])
        out["verdicts"] = {v: c.get(v, 0) for v in VERDICTS}
        out["truncated"] = sum(1 for g in gs if g["truncated"])
        return out
    fams = api.curriculum()["heldout"][0]["families"]
    per_task = [sum(Fraction(g["progress"], by_id[t]["cap"]) for g in grades if g["task_id"] == t) / 8 for t in order]
    rid = os.path.basename(os.path.normpath(run_dir))
    return dict(
        id=rid, model=st["model"], provider=st["provider"], endpoint=st["endpoint"],
        date=run["started"][:10], started=run["started"], finished=run["finished"],
        sampling={k: st.get(k) for k in ("temperature", "top_p", "max_tokens", "thinking", "tools", "extra_body")},
        samples_per_task=8, **summ(grades),
        by_family={f: summ([g for g in grades if by_id[g["task_id"]]["family"] == f]) for f in fams},
        refuted_share=round(sum(1 for g in untrunc if g["verdict"] == exact.REFUTED) / len(grades), 6),
        crosscheck={"distinct_answers_compared": compared, "disagreements": 0},
        spend={"usage": run["usage"], "prices_usd_per_1m": run["prices_usd_per_1m"],
               "cost_usd_at_listed_prices": run["cost_usd_at_listed_prices"]},
        log={"file": os.path.relpath(os.path.join(run_dir, run["log"]["file"]), ROOT), "sha256": run["log"]["sha256"]},
        per_task_mean_reward=[round(float(v), 6) for v in per_task],
    )


def dump(doc):
    return json.dumps(doc, indent=1, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    doc = build()
    old = json.load(open(OUT)) if os.path.exists(OUT) else {"models": []}
    doc["models"] = [model_row(os.path.join(ROOT, os.path.dirname(m["log"]["file"]))) for m in old.get("models", [])]
    if "--add" in sys.argv:
        new = model_row(os.path.abspath(sys.argv[sys.argv.index("--add") + 1]))
        doc["models"] = [m for m in doc["models"] if m["id"] != new["id"]] + [new]
    text = dump(doc)
    if "--check" in sys.argv:
        if not os.path.exists(OUT):
            die("no scorecard at certs/verify-gym-scorecard.json")
        if open(OUT).read() != text:
            die("certs/verify-gym-scorecard.json does not re-derive")
        print("verify-gym scorecard re-derived: %d policies x %d held-out tasks, gate %d planted / 0 leaked, "
              "%d answers decided twice, 0 disagreements" % (len(doc["policies"]), doc["heldout"]["n"],
                                                             doc["gate"]["planted"], doc["crosscheck"]["answers_compared"]))
    else:
        open(OUT, "w").write(text)
        print("wrote certs/verify-gym-scorecard.json")
        for p in doc["policies"]:
            print("  %-7s reward %.3f  progress %.2f  %s" % (p["id"], p["mean_reward"], p["mean_progress"], p["verdicts"]))
        for m in doc["models"]:
            print("  %s reward %.3f  %s  truncated %d  US$%s" % (m["id"], m["mean_reward"], m["verdicts"],
                                                               m["truncated"], m["spend"]["cost_usd_at_listed_prices"]))
