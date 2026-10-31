#!/usr/bin/env python3
"""scorecard.py: certs/verify-gym-scorecard.json, the reference policies graded on the frozen held-out set.

    python3 environments/verify_gym/scorecard.py           gate, grade, cross-check, write the scorecard
    python3 environments/verify_gym/scorecard.py --check   the same, and refuse unless it equals the file

Order, every run: (1) the held-out file is read only if it hashes to the curriculum's sha256 (the
pre-registration's); (2) the forgery gate runs on EVERY held-out row (each planted answer must score 0 under its
expected verdict, each green control above 0), and a failure writes nothing; (3) each policy answers each prompt;
(4) every answer and every planted forgery is decided again by check.js and compared field by field, and one
difference writes nothing; (5) the record. v0 holds policies only; model rows are appended later by their own
runs, each on the operator's word.                                                                          MIT"""
import hashlib
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from verify_gym import api, exact  # noqa: E402
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


def dump(doc):
    return json.dumps(doc, indent=1, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    doc = build()
    text = dump(doc)
    if "--check" in sys.argv:
        if not os.path.exists(OUT):
            die("no scorecard at certs/verify-gym-scorecard.json")
        old = json.load(open(OUT))
        if old.get("models"):                              # model rows are their runs' own records: kept, not re-derived here
            doc["models"] = old["models"]
            text = dump(doc)
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
