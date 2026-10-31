"""A runner that needs nothing but the standard library.

    python -m verify_gym.cli gate                  the forgery gate on the first training rows of every family
    python -m verify_gym.cli baseline              the reference policies on the frozen held-out set
    python -m verify_gym.cli tasks 3 --prompts     tasks from a stage (or --split heldout / val)
    python -m verify_gym.cli score <task_id>       grade a reply read from stdin
    python -m verify_gym.cli eval --base-url ... --model ...   any OpenAI-compatible endpoint (costs money: not run here)
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from collections import Counter

from . import api
from .forgeries import gate
from .policies import DESCRIBE, POLICIES
from .task import grade


def _rows(args):
    if args.split == "heldout":
        return api.heldout("v0")[args.start:args.start + args.n]
    if args.split == "val":
        fams = [f["id"] for f in api.curriculum()["families"]]
        return [api.family_pool_row(fams[k % len(fams)], "val", k // len(fams))
                for k in range(args.start, args.start + args.n)]
    return api.train_sample(args.n, args.start, args.stage)


def cmd_tasks(args):
    for r in _rows(args):
        print("--- %s  tier %s  stated (%s, %s)  d0 %d  cap %d" % (r["id"], r["tier"], r["lo0"], r["hi0"], r["d0"], r["cap"]))
        if args.prompts:
            print(r["prompt"])


def cmd_gate(args):
    g = gate(args.n)
    print("%d forgeries planted on %d rows, %d leaked, %d misfiled; %d green controls, %d failed -> %s"
          % (g["planted"], g["rows"], g["leaked"], g["misfiled"], g["green"], g["green_failed"],
             "GATE GREEN" if g["ok"] else "GATE FAILED"))
    for f in g["failures"][:5]:
        print("  ", f)
    sys.exit(0 if g["ok"] else 1)


def cmd_score(args):
    print(json.dumps(api.score(args.task_id, sys.stdin.read()), indent=1))


def cmd_baseline(args):
    """Every reference policy on the frozen held-out set. No key, no network."""
    api.preflight()
    rows = api.heldout("v0")
    names = args.policies.split(",") if args.policies else list(POLICIES)
    fams = [f["id"] for f in api.curriculum()["families"]]
    print("%-7s %7s %9s  %s" % ("policy", "reward", "progress", "  ".join("%-14s" % f for f in fams) + "  verdicts"))
    for name in names:
        gs = [grade(r, POLICIES[name](r["prompt"])) for r in rows]
        by = {f: [g for r, g in zip(rows, gs) if r["family"] == f] for f in fams}
        c = Counter(g["verdict"] for g in gs)
        print("%-7s %7.3f %9.2f  %s  %s" % (
            name, sum(g["reward"] for g in gs) / len(gs), sum(g["progress"] for g in gs) / len(gs),
            "  ".join("%-14s" % ("%.3f" % (sum(g["reward"] for g in v) / len(v))) for v in by.values()),
            dict(c)))
        print("        %s" % DESCRIBE[name])


def _complete(base_url, api_key, model, prompt, max_tokens):
    body = json.dumps({"model": model, "max_tokens": max_tokens,
                       "messages": [{"role": "user", "content": prompt}]}).encode()
    req = urllib.request.Request(base_url.rstrip("/") + "/chat/completions", data=body,
                                 headers={"content-type": "application/json",
                                          **({"authorization": "Bearer " + api_key} if api_key else {})})
    with urllib.request.urlopen(req, timeout=300) as r:
        j = json.loads(r.read())
    return j["choices"][0]["message"]["content"], j["choices"][0].get("finish_reason")


def cmd_eval(args):
    g = api.preflight()
    print("gate green (%d planted, 0 leaked)" % g["planted"])
    tally, total, n = Counter(), 0.0, 0
    for r in _rows(args):
        try:
            text, finish = _complete(args.base_url, args.api_key, args.model, r["prompt"], args.max_tokens)
        except Exception as e:
            tally["CALL_FAILED"] += 1
            print("   call failed on %s: %s" % (r["id"], str(e)[:120]))
            continue
        d = grade(r, text or "")
        n += 1
        total += d["reward"]
        tally[d["verdict"]] += 1
        if finish == "length":
            tally["truncated (scored 0 if unreadable)"] += 1
    print("%s: %d replies, mean reward %.3f" % (args.model, n, total / max(1, n)))
    for k, v in tally.most_common():
        print("   %-36s %d" % (k, v))


def main(argv=None):
    p = argparse.ArgumentParser(prog="verify-gym")
    sub = p.add_subparsers(dest="cmd", required=True)

    def rowargs(s, n):
        s.add_argument("n", type=int, nargs="?", default=n)
        s.add_argument("--split", default="train", choices=["train", "val", "heldout"])
        s.add_argument("--stage", default="v0")
        s.add_argument("--start", type=int, default=0)

    t = sub.add_parser("tasks"); rowargs(t, 3); t.add_argument("--prompts", action="store_true")
    t.set_defaults(func=cmd_tasks)
    g = sub.add_parser("gate"); g.add_argument("n", type=int, nargs="?", default=6); g.set_defaults(func=cmd_gate)
    s = sub.add_parser("score"); s.add_argument("task_id"); s.set_defaults(func=cmd_score)
    b = sub.add_parser("baseline"); b.add_argument("--policies", default=None); b.set_defaults(func=cmd_baseline)
    e = sub.add_parser("eval"); rowargs(e, 30)
    e.add_argument("--base-url", required=True); e.add_argument("--model", required=True)
    e.add_argument("--api-key", default=None); e.add_argument("--max-tokens", type=int, default=4000)
    e.set_defaults(func=cmd_eval)
    args = p.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
