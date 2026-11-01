#!/usr/bin/env python3
"""filter.py: THE VERIFIER IN THE LOOP (the pre-registration's deviation 7), and the verified-answers dataset.

    python3 environments/verify_gym/filter.py           write certs/verify-gym-filter.json and the dataset
    python3 environments/verify_gym/filter.py --check   the same, and refuse unless both equal the stored files

Nothing is sampled here. Every model row in certs/verify-gym-scorecard.json already holds 8 stored replies per
held-out task; this reads each row's log (it must hash to the sha256 the scorecard names), grades every reply with
the environment's decider (a reply cut off at the caller's limit is no answer, as in the scorecard), and turns the
8 replies of each task into ONE answer three ways:

    first     sample 0
    majority  the bracket stated most often (lo, hi read as exact rationals; a text that is not a rational is
              compared as text), ties to the bracket whose first occurrence is earliest; none stated: no answer
    verify    only the samples both deciders call CERTIFIED; the most progress, then the narrower bracket (exact
              hi - lo), then the earlier sample; none certified: no answer (an abstention states nothing false)

Every chosen answer, and every CERTIFIED sample (the filter's candidates), is decided again by check.js and compared
field by field; one difference writes nothing. The false brackets each strategy lets through are COUNTED, never
assumed: `verify` lets through 0 by construction, and the record shows the count.

THE DATASET, corpus/verify-gym/verified-v0.jsonl.gz: every non-cut-off held-out sample of every row that both
deciders call CERTIFIED, one JSON object per line (schema: corpus/verify-gym/verified-v0.README.md). Before it is
written, every row is re-decided by check.js, and the rows paid a reward above 0 go through recheck.py as a rollout
log, which must AGREE. The gzip is written with mtime 0, so the same rows give the same bytes; the record names the
sha256 of the text and of the archive. These are HELD-OUT tasks: a model trained on this file can never be
evaluated on heldout-v0.                                                                                    MIT"""
import gzip
import hashlib
import io
import json
import os
import sys
from collections import Counter
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from verify_gym import api, exact, rollouts  # noqa: E402
from verify_gym.task import grade  # noqa: E402
import crosscheck  # noqa: E402
import recheck  # noqa: E402
import scorecard  # noqa: E402

OUT = os.path.join(ROOT, "certs", "verify-gym-filter.json")
DATA = os.path.join(ROOT, "corpus", "verify-gym", "verified-v0.jsonl.gz")
STRATEGIES = ("first", "majority", "verify")
VERDICTS = (exact.CERTIFIED, exact.REFUTED, exact.REFUSED, exact.MALFORMED)


def die(m):
    sys.exit("VERIFY-GYM FILTER REFUSED: " + m)


def frac_text(f):
    return "%d/%d" % (f.numerator, f.denominator)


def value_key(text):
    v, _ = exact.read_rational(text)
    return ("q", v.numerator, v.denominator) if v is not None else ("text", text)


def choose(graded):
    """graded: the 8 samples of one task, each {sample, truncated, g}. Returns {strategy: sample index or None}."""
    out = {"first": 0}
    stated = [s for s in graded if not s["truncated"] and s["g"]["lo"] is not None]
    if stated:
        count, first_at = Counter(), {}
        for s in stated:
            k = (value_key(s["g"]["lo"]), value_key(s["g"]["hi"]))
            count[k] += 1
            first_at.setdefault(k, s["sample"])
        best = max(count, key=lambda k: (count[k], -first_at[k]))
        out["majority"] = first_at[best]
    else:
        out["majority"] = None
    cert = [s for s in graded if not s["truncated"] and s["g"]["verdict"] == exact.CERTIFIED]
    if cert:
        def width(s):
            return exact.read_rational(s["g"]["hi"])[0] - exact.read_rational(s["g"]["lo"])[0]
        out["verify"] = min(cert, key=lambda s: (-s["g"]["progress"], width(s), s["sample"]))["sample"]
    else:
        out["verify"] = None
    return out


def tally(picks, rows):
    """picks: per task (row, the chosen sample's record or None). The counts and the exact mean reward."""
    c = Counter()
    total = Fraction(0)
    for r, s in picks:
        if s is None:
            c["none"] += 1
            continue
        if s["truncated"]:
            c["none"] += 1                      # sample 0 cut off: no answer, as in the scorecard
            continue
        c[s["g"]["verdict"]] += 1
        if s["g"]["verdict"] == exact.CERTIFIED:
            total += Fraction(s["g"]["progress"], r["cap"])
    n = len(picks)
    mean = total / n
    return {"tasks": n, "certified": c[exact.CERTIFIED], "false_brackets_let_through": c[exact.REFUTED],
            "refused": c[exact.REFUSED], "malformed": c[exact.MALFORMED], "no_answer": c["none"],
            "mean_reward": frac_text(mean), "mean_reward_float": round(float(mean), 6)}


def build():
    sc = json.load(open(scorecard.OUT))
    rows = api.heldout("v0")
    by_id = {r["id"]: r for r in rows}
    fams = api.curriculum()["heldout"][0]["families"]
    out_rows, dataset, py, items = [], [], {}, []

    def send(tid, g):
        iid = json.dumps([tid, g["lo"], g["hi"]])
        if iid not in py:
            py[iid] = g
            items.append(crosscheck.item(iid, by_id[tid], g["lo"], g["hi"]))

    for m in sc["models"]:
        path = os.path.join(ROOT, m["log"]["file"])
        text = rollouts.read(path)
        if hashlib.sha256(text.encode("utf-8")).hexdigest() != m["log"]["sha256"]:
            die("%s: the log does not hash to the sha256 the scorecard names" % m["log"]["file"])
        head, samples = rollouts.loads(text)
        per = {}
        for x in samples:
            g = grade(by_id[x["task_id"]], x["reply"])
            per.setdefault(x["task_id"], []).append(
                {"sample": x["sample"], "truncated": x.get("finish_reason") == "length", "g": g, "x": x})
        picks = {s: [] for s in STRATEGIES}
        chosen = {s: [] for s in STRATEGIES}
        for r in rows:
            graded = sorted(per[r["id"]], key=lambda s: s["sample"])
            if [s["sample"] for s in graded] != list(range(8)):
                die("%s: %s is not samples 0..7" % (m["id"], r["id"]))
            ch = choose(graded)
            for st in STRATEGIES:
                s = graded[ch[st]] if ch[st] is not None else None
                picks[st].append((r, s))
                chosen[st].append(ch[st])
                if s is not None and s["g"]["lo"] is not None and not s["truncated"]:
                    send(r["id"], s["g"])
            for s in graded:
                if s["truncated"] or s["g"]["verdict"] != exact.CERTIFIED:
                    continue
                send(r["id"], s["g"])
                x, g = s["x"], s["g"]
                lo, hi = exact.read_rational(g["lo"])[0], exact.read_rational(g["hi"])[0]
                rw = Fraction(g["progress"], r["cap"])
                dataset.append({
                    "id": "%s|%s|%d" % (m["id"], r["id"], s["sample"]),
                    "task_id": r["id"], "family": r["family"], "instance": r["instance"],
                    "stated": {"lo": r["lo0"], "hi": r["hi0"], "d0": r["d0"]}, "cap": r["cap"],
                    "prompt_sha256": hashlib.sha256(r["prompt"].encode("utf-8")).hexdigest(),
                    "model": m["model"], "provider": m["provider"], "thinking": m["sampling"]["thinking"],
                    "date": m["date"], "row": m["id"], "sample": s["sample"],
                    "reply": x["reply"], "reply_sha256": x["reply_sha256"],
                    "answer": {"lo": g["lo"], "hi": g["hi"], "lo_exact": frac_text(lo), "hi_exact": frac_text(hi)},
                    "certificate": {"verdict": g["verdict"], "sides": g["sides"], "decimals": g["decimals"],
                                    "progress": g["progress"],
                                    "deciders": ["environments/verify_gym/verify_gym/exact.py",
                                                 "environments/verify_gym/check.js"]},
                    "reward": float(rw), "reward_exact": frac_text(rw),
                })
        res = {}
        for st in STRATEGIES:
            res[st] = tally(picks[st], rows)
            res[st]["by_family"] = {f: tally([p for p in picks[st] if p[0]["family"] == f], rows) for f in fams}
        out_rows.append({"id": m["id"], "model": m["model"], "thinking": m["sampling"]["thinking"],
                         "row_mean_reward_per_reply": m["mean_reward"], "strategies": res,
                         "chosen_sample": chosen,
                         "log": m["log"]})

    compared, bad = crosscheck.compare(py, items) if items else (0, [])
    if bad:
        die("the two deciders disagree on %d answers, first: %s" % (len(bad), json.dumps(bad[0])))
    for d in dataset:                                      # every dataset row CERTIFIED by check.js too
        j = py[json.dumps([d["task_id"], d["answer"]["lo"], d["answer"]["hi"]])]
        if j["verdict"] != exact.CERTIFIED:
            die("%s: not CERTIFIED" % d["id"])
    paid = [d for d in dataset if d["reward"] > 0]
    rc = recheck.recheck_text(rollouts.dumps(rollouts.header("heldout", what="verified-v0, the paid rows"),
                                             [rollouts.sample(d["task_id"], d["reply"], d["reward"])
                                              for d in paid]), "verified-v0 (paid rows)")
    if rc["verdict"] != "AGREES" or rc["rechecked"] != len(paid):
        die("recheck.py does not agree with the dataset's paid rows: %s" % rc.get("why"))

    dtext = "".join(json.dumps(d, ensure_ascii=False, sort_keys=True) + "\n" for d in dataset)
    buf = io.BytesIO()
    with gzip.GzipFile(filename="", mode="wb", fileobj=buf, mtime=0, compresslevel=9) as f:
        f.write(dtext.encode("utf-8"))
    gz = buf.getvalue()

    ranked = sorted(out_rows, key=lambda r: (r["row_mean_reward_per_reply"], r["id"]))
    doc = {
        "what": "verify-gym, the verifier in the loop (notes/verify-gym-preregistration-2026-10-31.md, deviation 7): "
                "for every model row in certs/verify-gym-scorecard.json, the 8 stored replies per held-out task "
                "turned into one answer three ways (first, majority, CERTIFIED-only and tightest), nothing new "
                "sampled; every chosen answer and every CERTIFIED sample decided by both deciders. Re-derived by "
                "environments/verify_gym/filter.py --check.",
        "preregistration": "notes/verify-gym-preregistration-2026-10-31.md (deviation 7)",
        "scorecard": "certs/verify-gym-scorecard.json",
        "strategies": {
            "first": "sample 0",
            "majority": "the bracket stated most often among the replies that state one (exact rationals), ties to "
                        "the earliest first occurrence; no verifier, no answer key",
            "verify": "only samples both deciders call CERTIFIED; the most progress, then the narrower bracket, "
                      "then the earlier sample; none certified: no answer",
        },
        "note": "the reward is the verifier's own number, so verify is the best of the 8 under this reward by "
                "definition; what it shows is that the best is reached with no answer key, and that first and "
                "majority state false brackets a reader cannot tell from true ones",
        "rule": "a reply cut off at the caller's max_tokens is no answer under every strategy, as in the scorecard",
        "headline": {"weakest": ranked[0]["id"], "strongest": ranked[-1]["id"],
                     "chosen_by": "the lowest and the highest mean reward per reply in the scorecard"},
        "crosscheck": {"decider2": "environments/verify_gym/check.js", "distinct_answers_compared": compared,
                       "disagreements": 0},
        "rows": out_rows,
        "dataset": {"file": os.path.relpath(DATA, ROOT), "rows": len(dataset), "paid_rows": len(paid),
                    "text_sha256": hashlib.sha256(dtext.encode("utf-8")).hexdigest(),
                    "gzip_sha256": hashlib.sha256(gz).hexdigest(), "gzip_bytes": len(gz),
                    "text_bytes": len(dtext.encode("utf-8")),
                    "by_model": dict(sorted(Counter(d["model"] for d in dataset).items())),
                    "by_family": dict(sorted(Counter(d["family"] for d in dataset).items())),
                    "recheck": {k: rc[k] for k in ("verdict", "samples", "paid", "rechecked", "disagreements")},
                    "schema": "corpus/verify-gym/verified-v0.README.md",
                    "split": "heldout: never train a model that is evaluated on heldout-v0 on this file",
                    "published": False},
    }
    return doc, gz


def dump(doc):
    return json.dumps(doc, indent=1, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    doc, gz = build()
    text = dump(doc)
    if "--check" in sys.argv:
        if not (os.path.exists(OUT) and os.path.exists(DATA)):
            die("no record or no dataset")
        if open(OUT).read() != text:
            die("certs/verify-gym-filter.json does not re-derive")
        if open(DATA, "rb").read() != gz:
            die("corpus/verify-gym/verified-v0.jsonl.gz does not re-derive")
        print("verify-gym filter re-derived: %d rows x 3 strategies, %d distinct answers decided twice, 0 "
              "disagreements; dataset %d rows (%d paid, recheck AGREES)" % (
                  len(doc["rows"]), doc["crosscheck"]["distinct_answers_compared"], doc["dataset"]["rows"],
                  doc["dataset"]["paid_rows"]))
    else:
        open(OUT, "w").write(text)
        open(DATA, "wb").write(gz)
        print("wrote certs/verify-gym-filter.json and %s (%d rows, %d bytes gzipped)" % (
            os.path.relpath(DATA, ROOT), doc["dataset"]["rows"], doc["dataset"]["gzip_bytes"]))
        for r in doc["rows"]:
            print("  %-22s" % r["id"] + "  ".join(
                "%s: cert %3d false %3d reward %.3f" % (st, r["strategies"][st]["certified"],
                                                        r["strategies"][st]["false_brackets_let_through"],
                                                        r["strategies"][st]["mean_reward_float"])
                for st in STRATEGIES))
