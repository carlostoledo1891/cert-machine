#!/usr/bin/env python3
"""readiness.py: the READINESS GATE on a base model, run before any paid training step (the pre-registration's
"Before any paid training step"). 100 tasks of the validation stream, 8 samples each, at the training sampling
settings; GO only if at least 30% of the groups of 8 have rewards that are not all equal AND the mean reward is
between 0.02 and 0.80. Otherwise GRPO has nothing to reinforce (or nothing left to learn), and that is the finding.

    python3 environments/verify_gym/readiness.py --dry-run mix [--out DIR]
        no model, no network: a reference policy answers. `mix` gives each sample of a group a different one of the
        five reference policies; any single policy name (never, echo, float, bisect, cf) answers all eight alike.
    python3 environments/verify_gym/readiness.py --endpoint http://HOST:PORT/v1 --model ID --max-tokens N --out DIR
        any OpenAI-compatible chat-completions server (vLLM, a hosted API). THIS COSTS MONEY OR GPU TIME and runs only
        on the operator's word. The key, if any, is read from the environment variable named by --api-key-env
        (default VERIFY_GYM_API_KEY), never from the command line, and is never written. --extra-body adds JSON
        fields to every request (e.g. '{"chat_template_kwargs": {"enable_thinking": false}}').

The tasks are the first 100 of the validation rotation (xx/val/0, kroot/val/0, poly/val/0, xx/val/1, ...), the same
order `cli tasks --split val` and the v0 adapter's eval_split="val" use. Every sample is graded by the
environment's decider and again by check.js, and one difference refuses the run. A reply the caller cut off
(finish_reason "length") is paid 0 and counted in its own column. The GO rule is decided in exact rationals
(each reward is progress / cap), the bounds inclusive. A run with any other task count or group size is
reported as NOT THE PROTOCOL and gives no GO and no NO-GO.

DIR gets rollouts.jsonl (verify_gym/rollouts.py's format, split "val": every reply stored, with its sha256) and
readiness.json (the summary, naming the log's sha256). A live run appends each sample to rollouts.partial.jsonl as
it arrives and resumes from it when re-run with the same settings; a failed call (after 3 tries) stops the run
and writes no verdict.                                                                                      MIT"""
import argparse
import hashlib
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from verify_gym import api, rollouts  # noqa: E402
from verify_gym.policies import POLICIES  # noqa: E402
from verify_gym.task import grade, parse  # noqa: E402
import crosscheck  # noqa: E402

N_TASKS, SAMPLES = 100, 8
MIN_SPREAD = Fraction(30, 100)                         # share of groups whose 8 rewards are not all equal
MEAN_LO, MEAN_HI = Fraction(2, 100), Fraction(80, 100)
ORDER = list(POLICIES)                                 # never, echo, float, bisect, cf


def die(m):
    sys.exit("VERIFY-GYM READINESS REFUSED: " + m)


def tasks(n=N_TASKS):
    fams = [f["id"] for f in api.curriculum()["families"]]
    return [api.family_pool_row(fams[k % len(fams)], "val", k // len(fams)) for k in range(n)]


# ---- the two answerers: a reference policy (dry run) and an endpoint ---------------------------------------------
_REPLY = {}


def policy_reply(name, row, k):
    if name == "mix":                                  # each of the 8 samples a different policy, offset per task
        off = hashlib.sha256(row["id"].encode()).digest()[0]
        name = ORDER[(k + off) % len(ORDER)]
    key = (name, row["id"])
    if key not in _REPLY:
        _REPLY[key] = POLICIES[name](row["prompt"])
    return _REPLY[key], "stop"


RATE_LIMIT_WAITS = 120                                 # HTTP 429s waited out per call (about 2 h at most)
USAGE = {}                                             # (task id, sample) -> the endpoint's token counts and cost


def endpoint_reply(cfg, row, k):
    """One sample from an OpenAI-compatible endpoint: (reply text, finish_reason). A sampling field set to None in cfg
    (temperature, top_p) is left out of the request, for APIs that refuse it; the endpoint's usage (tokens, and cost
    when it reports one) is kept in USAGE, never the key."""
    body = {"model": cfg["model"], "messages": [{"role": "user", "content": row["prompt"]}],
            "max_tokens": cfg["max_tokens"], "n": 1,
            "seed": int(hashlib.sha256(("%s|%d" % (row["id"], k)).encode()).hexdigest()[:8], 16),
            **{f: cfg[f] for f in ("temperature", "top_p") if cfg.get(f) is not None},
            **cfg["extra_body"]}
    key = os.environ.get(cfg["api_key_env"] or "", "")
    req = urllib.request.Request(cfg["endpoint"].rstrip("/") + "/chat/completions", data=json.dumps(body).encode(),
                                 headers={"content-type": "application/json", "user-agent": "verify-gym/0",
                                          **({"authorization": "Bearer " + key} if key else {})})
    err = None
    failures, waits = 0, 0
    while True:
        try:
            with urllib.request.urlopen(req, timeout=cfg["timeout"]) as r:
                j = json.loads(r.read())
            c = j["choices"][0]
            u = j.get("usage") or {}
            USAGE[(row["id"], k)] = {f: u[f] for f in ("prompt_tokens", "completion_tokens", "cost")
                                     if isinstance(u.get(f), (int, float)) and not isinstance(u.get(f), bool)}
            return (c.get("message") or {}).get("content") or "", c.get("finish_reason")
        except urllib.error.HTTPError as e:             # a rate limit (429) is waited out, never counted as a failure
            if e.code == 429 and waits < RATE_LIMIT_WAITS:
                waits += 1
                time.sleep(min(60, 5 * 2 ** min(waits, 4)))
                continue
            err, failures = e, failures + 1
        except Exception as e:                          # noqa: BLE001 (any failure is retried, then stops the run)
            err, failures = e, failures + 1
        if failures >= 3:
            raise RuntimeError("the call for %s sample %d failed 3 times: %s" % (row["id"], k, str(err)[:200]))
        time.sleep(2 ** failures)


# ---- the run ---------------------------------------------------------------------------------------------------
def collect(answer, rows, split, settings, samples, out=None, workers=1, **head_extra):
    """Every (task, sample) of `rows` answered once, in order: the samples, each graded by the environment's decider
    and logged as it arrives (DIR/rollouts.partial.jsonl), resumed from that log when it holds the same settings.
    A truncated reply (finish_reason "length") is paid 0. Shared by this gate and modelrow.py (the scorecard's
    model rows), so the two cannot answer, log or pay by different rules. Returns (header, ordered samples)."""
    head = rollouts.header(split, **settings, **head_extra, samples=samples)
    done = {}
    partial = os.path.join(out, "rollouts.partial.jsonl") if out else None
    if partial and os.path.exists(partial):             # resume: only a log of the same settings
        h, prev = rollouts.loads(open(partial, encoding="utf-8").read())
        if h != head:
            die("%s holds a run with other settings; move it away or use another --out" % partial)
        done = {(s["task_id"], s["sample"]): s for s in prev}
    elif partial:
        os.makedirs(out, exist_ok=True)
        open(partial, "w", encoding="utf-8").write(rollouts.dumps(head, []))
    lock = threading.Lock()

    def one(job):
        r, k = job
        if (r["id"], k) in done:
            return
        reply, finish = answer(r, k)
        g = grade(r, reply)
        trunc = finish == "length"
        s = rollouts.sample(r["id"], reply, 0.0 if trunc else g["reward"], sample=k, finish_reason=finish,
                            verdict=g["verdict"], progress=0 if trunc else g["progress"],
                            **({"usage": USAGE.pop((r["id"], k))} if (r["id"], k) in USAGE else {}))
        with lock:
            done[(r["id"], k)] = s
            if partial:
                with open(partial, "a", encoding="utf-8") as f:
                    f.write(json.dumps(s, ensure_ascii=False, sort_keys=True) + "\n")

    jobs = [(r, k) for r in rows for k in range(samples)]
    if workers > 1:
        with ThreadPoolExecutor(workers) as ex:
            list(ex.map(one, jobs))
    else:
        for j in jobs:
            one(j)
    ordered = []
    for r in rows:
        for k in range(samples):
            s = dict(done[(r["id"], k)])
            s.pop("_line", None)
            ordered.append(s)
    return head, ordered


def run(answer, settings, n_tasks=N_TASKS, samples=SAMPLES, out=None, workers=1):
    """Every (task, sample) answered, graded twice, and the GO rule. Returns (summary, log text)."""
    api.preflight()
    rows = tasks(n_tasks)
    head, ordered = collect(answer, rows, "val", settings, samples, out, workers, n_tasks=n_tasks)
    partial = os.path.join(out, "rollouts.partial.jsonl") if out else None

    # every sample decided again by check.js; one difference refuses
    items, py = [], {}
    for r, s in zip([r for r in rows for _ in range(samples)], ordered):
        g = grade(r, s["reply"])                       # a resumed sample is graded again, never trusted
        if s["progress"] != (0 if s["finish_reason"] == "length" else g["progress"]):
            die("%s sample %d: the logged progress is not the decider's" % (s["task_id"], s["sample"]))
        lo, hi, _ = parse(s["reply"])
        if lo is None:
            continue
        iid = json.dumps([s["task_id"], lo, hi])      # a repeated answer is one decision: sent once
        if iid not in py:
            py[iid] = g
            items.append(crosscheck.item(iid, r, lo, hi))
    compared, bad = crosscheck.compare(py, items) if items else (0, [])
    if bad:
        die("the two deciders disagree on %d samples, first: %s" % (len(bad), json.dumps(bad[0])))

    caps = {r["id"]: r["cap"] for r in rows}
    reward = lambda s: Fraction(s["progress"], caps[s["task_id"]])
    groups = [ordered[i:i + samples] for i in range(0, len(ordered), samples)]
    spread = sum(1 for g in groups if len({reward(s) for s in g}) > 1)
    mean = sum(reward(s) for s in ordered) / len(ordered)
    share = Fraction(spread, len(groups))
    protocol = n_tasks == N_TASKS and samples == SAMPLES
    conds = {"spread": share >= MIN_SPREAD, "mean": MEAN_LO <= mean <= MEAN_HI}
    verdict = ("GO" if all(conds.values()) else "NO-GO") if protocol else "NOT THE PROTOCOL"
    fams = [f["id"] for f in api.curriculum()["families"]]
    text = rollouts.dumps(head, ordered)
    summary = {
        "what": "verify-gym readiness gate (notes/verify-gym-preregistration-2026-10-31.md, 'Before any paid training "
                "step'): the first %d tasks of the validation rotation x %d samples, every sample graded by both "
                "deciders" % (n_tasks, samples),
        "settings": settings, "n_tasks": n_tasks, "samples": samples,
        "log": {"file": "rollouts.jsonl", "sha256": hashlib.sha256(text.encode("utf-8")).hexdigest()},
        "rule": {"spread_share_at_least": "30/100", "mean_reward_in": ["2/100", "80/100"], "bounds": "inclusive"},
        "groups": len(groups), "groups_not_all_equal": spread,
        "spread_share": "%d/%d" % (share.numerator, share.denominator), "spread_share_float": round(float(share), 6),
        "mean_reward": "%d/%d" % (mean.numerator, mean.denominator), "mean_reward_float": round(float(mean), 6),
        "by_family": {f: round(float(sum(reward(s) for s in ordered if s["task_id"].startswith(f + "/")) /
                                     max(1, sum(1 for s in ordered if s["task_id"].startswith(f + "/")))), 6)
                      for f in fams},
        "verdicts": dict(Counter(s["verdict"] for s in ordered)),
        **({"usage": usage_total(ordered)} if any("usage" in s for s in ordered) else {}),
        "truncated": sum(1 for s in ordered if s["finish_reason"] == "length"),
        "crosscheck": {"distinct_answers_compared": compared, "disagreements": 0},
        "conditions": {k: bool(v) for k, v in conds.items()},
        "verdict": verdict,
    }
    if out:
        os.makedirs(out, exist_ok=True)
        open(os.path.join(out, "rollouts.jsonl"), "w", encoding="utf-8").write(text)
        open(os.path.join(out, "readiness.json"), "w").write(json.dumps(summary, indent=1, ensure_ascii=False) + "\n")
        if partial and os.path.exists(partial):
            os.remove(partial)
    return summary, text


def usage_total(samples):
    """The endpoint's own counts summed over the samples that carry them (a resumed run's included)."""
    tot = Counter()
    for s in samples:
        for f, v in (s.get("usage") or {}).items():
            tot[f] += v
    out = {f: tot[f] for f in ("prompt_tokens", "completion_tokens") if f in tot}
    if "cost" in tot:
        out["cost_usd_reported"] = round(tot["cost"], 6)
    out["samples_with_usage"] = sum(1 for s in samples if s.get("usage"))
    return out


def line(s):
    return ("verify-gym readiness (%s): %d tasks x %d samples, %d/%d groups not all equal (%.3f, needs >= 0.30), "
            "mean reward %.4f (needs 0.02..0.80), %d truncated, %d distinct answers decided twice -> %s"
            % (s["settings"].get("model") or "dry run: " + s["settings"]["dry_run"], s["n_tasks"], s["samples"],
               s["groups_not_all_equal"], s["groups"], s["spread_share_float"], s["mean_reward_float"],
               s["truncated"], s["crosscheck"]["distinct_answers_compared"], s["verdict"]))


def main(argv=None):
    ap = argparse.ArgumentParser(prog="readiness.py")
    ap.add_argument("--dry-run", choices=["mix"] + ORDER, default=None)
    ap.add_argument("--endpoint", default=None)
    ap.add_argument("--model", default=None)
    ap.add_argument("--max-tokens", type=int, default=None)
    ap.add_argument("--temperature", type=float, default=1.0)
    ap.add_argument("--top-p", type=float, default=1.0)
    ap.add_argument("--extra-body", default="{}")
    ap.add_argument("--api-key-env", default="VERIFY_GYM_API_KEY")
    ap.add_argument("--timeout", type=float, default=600)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--n-tasks", type=int, default=N_TASKS, help="anything but 100 is NOT THE PROTOCOL")
    ap.add_argument("--samples", type=int, default=SAMPLES, help="anything but 8 is NOT THE PROTOCOL")
    ap.add_argument("--out", default=None)
    a = ap.parse_args(argv)
    if bool(a.dry_run) == bool(a.endpoint):
        ap.error("exactly one of --dry-run POLICY and --endpoint URL")
    if a.dry_run:
        settings = {"dry_run": a.dry_run, "model": None,
                    "note": "a reference policy, not a model: this exercises the gate, it measures no model"}
        summary, _ = run(lambda r, k: policy_reply(a.dry_run, r, k), settings, a.n_tasks, a.samples, a.out)
    else:
        if not (a.model and a.max_tokens and a.out):
            ap.error("a live run needs --model, --max-tokens and --out (every reply is stored)")
        cfg = {"endpoint": a.endpoint, "model": a.model, "max_tokens": a.max_tokens, "temperature": a.temperature,
               "top_p": a.top_p, "extra_body": json.loads(a.extra_body), "api_key_env": a.api_key_env,
               "timeout": a.timeout}
        settings = {"dry_run": None, "model": a.model, "endpoint": a.endpoint, "temperature": a.temperature,
                    "top_p": a.top_p, "max_tokens": a.max_tokens, "extra_body": cfg["extra_body"],
                    "started": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
        if os.path.exists(os.path.join(a.out, "rollouts.partial.jsonl")):
            settings["started"] = rollouts.loads(open(os.path.join(a.out, "rollouts.partial.jsonl"),
                                                      encoding="utf-8").read())[0].get("started")
        try:
            summary, _ = run(lambda r, k: endpoint_reply(cfg, r, k), settings, a.n_tasks, a.samples, a.out, a.workers)
        except RuntimeError as e:
            die("%s; the samples so far are kept in %s/rollouts.partial.jsonl, re-run to resume" % (e, a.out))
    print(line(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())
