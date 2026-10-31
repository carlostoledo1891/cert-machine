#!/usr/bin/env python3
"""recheck.py: the RE-CHECK of a training run's rewarded samples (the pre-registration's hack table, last row, and
ship criterion 5). Every sample in a rollout log that was paid a reward above 0 is decided again by check.js, the
JavaScript decider that shares no code with the one the trainer used, and the run's result is REFUSED if a single
paid reward is not the reward check.js gives.

    python3 environments/verify_gym/recheck.py RUN/rollouts.jsonl              print the verdict; exit 1 on refusal
    python3 environments/verify_gym/recheck.py RUN/rollouts.jsonl --json OUT   also write the summary record

The log format is verify_gym/rollouts.py's (one header line, then one line per sample: task_id, reply, reward).
For each rewarded sample: the row is rebuilt from task_id alone (api.row; an unknown id refuses); the Python
layer extracts the two endpoint texts from the reply (the format is the environment's, the arithmetic is not);
check.js reads the texts, reduces, applies the size limit, decides both sides and counts the decimals; the
reward it implies is progress / cap if both sides are CERTIFIED and 0 otherwise, and the logged reward must stand
for exactly that progress. A paid reply that has no answer, a paid reply the caller truncated (finish_reason
"length"), and a paid reward check.js does not reproduce are each a disagreement. The Python decider grades the
same samples too, and a difference between the two deciders is reported apart: that one is a decider bug, the
other is the run's.

Samples paid 0 are counted, not re-decided: a reward forged DOWN buys nothing. The forgery gate runs first, as in
every consumer.                                                                                             MIT"""
import argparse
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from verify_gym import api, rollouts  # noqa: E402
from verify_gym.task import grade, parse  # noqa: E402
import crosscheck  # noqa: E402


def recheck_text(text, name="<log>"):
    """The summary record of one log. `verdict` is AGREES or REFUSED; `why` says what refused."""
    sha = hashlib.sha256(text.encode("utf-8")).hexdigest()
    out = {"log": name, "sha256": sha, "format": rollouts.FORMAT, "decider": "environments/verify_gym/check.js"}
    try:
        head, samples = rollouts.loads(text)
    except ValueError as e:
        return dict(out, verdict="REFUSED", why="the log is not the format: %s" % e)
    out["split"] = head["split"]
    rows, bad, items, py = {}, [], [], {}
    for s in samples:
        try:
            rows[s["task_id"]] = rows.get(s["task_id"]) or api.row(s["task_id"])
        except (KeyError, ValueError):
            return dict(out, verdict="REFUSED", why="line %d: no task %r in the environment" % (s["_line"], s["task_id"]))
    paid = [s for s in samples if s["reward"] > 0]
    for s in paid:
        r = rows[s["task_id"]]
        logged = rollouts.progress_of(s["reward"], r["cap"])
        if logged is None:
            bad.append({"line": s["_line"], "task_id": s["task_id"], "logged": s["reward"],
                        "why": "no reward of this environment equals it (cap %d)" % r["cap"]})
            continue
        if s.get("finish_reason") == "length":
            bad.append({"line": s["_line"], "task_id": s["task_id"], "logged": s["reward"],
                        "why": "the caller truncated this reply, and a truncated reply is paid 0"})
            continue
        lo, hi, why = parse(s["reply"])
        if lo is None:
            bad.append({"line": s["_line"], "task_id": s["task_id"], "logged": s["reward"], "why": "paid, but " + why})
            continue
        iid = json.dumps([s["task_id"], lo, hi])          # a repeated answer is one decision: sent once
        s["_logged"], s["_iid"] = logged, iid
        if iid not in py:
            py[iid] = grade(r, s["reply"])
            items.append(crosscheck.item(iid, r, lo, hi))
    res, _ = crosscheck.js(items) if items else ({}, None)
    split_deciders = []
    for s in paid:
        if "_iid" not in s:
            continue
        j = res.get(s["_iid"])
        if j is None:
            bad.append({"line": s["_line"], "task_id": s["task_id"], "why": "check.js returned nothing"})
            continue
        want = j["progress"] if j["verdict"] == "CERTIFIED" else 0
        if s["_logged"] != want:
            bad.append({"line": s["_line"], "task_id": s["task_id"], "logged": s["reward"],
                        "check_js": {"verdict": j["verdict"], "sides": j["sides"], "progress": j["progress"],
                                     "reward": want / rows[s["task_id"]]["cap"]},
                        "why": "the paid reward is not check.js's"})
        p = py[s["_iid"]]
        if any(p[f] != j[f] for f in crosscheck.FIELDS):
            split_deciders.append({"line": s["_line"], "task_id": s["task_id"],
                                   "python": {f: p[f] for f in crosscheck.FIELDS}, "js": j})
    out.update(samples=len(samples), paid=len(paid), rechecked=sum(1 for s in paid if "_iid" in s),
               distinct_answers=len(items), disagreements=len(bad),
               decider_disagreements=len(split_deciders), first=(bad + split_deciders)[:5])
    if bad or split_deciders:
        out["verdict"] = "REFUSED"
        out["why"] = ("%d of %d paid rewards disagree with check.js" % (len(bad), len(paid)) if bad else
                      "the two deciders disagree on %d paid samples" % len(split_deciders))
    else:
        out["verdict"] = "AGREES"
    return out


def line(rec):
    if rec["verdict"] == "AGREES":
        return ("verify-gym recheck: %s (%s split): %d samples, %d paid, %d re-decided by check.js, 0 disagreements "
                "-> AGREES" % (rec["log"], rec["split"], rec["samples"], rec["paid"], rec["rechecked"]))
    return "VERIFY-GYM RECHECK REFUSED: %s: %s%s" % (
        rec["log"], rec["why"], ("; first: " + json.dumps(rec["first"][0])) if rec.get("first") else "")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="recheck.py")
    ap.add_argument("log")
    ap.add_argument("--json", default=None)
    a = ap.parse_args(argv)
    api.preflight()
    rec = recheck_text(open(a.log, encoding="utf-8").read(), os.path.basename(a.log))
    if a.json:
        with open(a.json, "w") as f:
            f.write(json.dumps(rec, indent=1, ensure_ascii=False) + "\n")
    print(line(rec), file=sys.stdout if rec["verdict"] == "AGREES" else sys.stderr)
    return 0 if rec["verdict"] == "AGREES" else 1


if __name__ == "__main__":
    sys.exit(main())
