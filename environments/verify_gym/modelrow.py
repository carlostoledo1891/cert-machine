#!/usr/bin/env python3
"""modelrow.py: one model's answers to the frozen held-out set, collected for a scorecard row (the pre-registration's
"Model rows"): the 120 held-out prompts x 8 samples, every reply stored with its sha256, at the sampling stated.

    python3 environments/verify_gym/modelrow.py --endpoint https://HOST/v1 --model ID --max-tokens N \
        --provider WORDS --thinking WORDS --out corpus/verify-gym/runs/ROW
    python3 environments/verify_gym/scorecard.py --add corpus/verify-gym/runs/ROW      the row, graded twice

THIS COSTS MONEY and runs only on the operator's word. The key is read from the environment variable named by
--api-key-env (default VERIFY_GYM_API_KEY), never from the command line, and is never written. `--split train
--n-tasks K --samples S` is a PILOT on the training stream (to measure tokens before a paid row); it is never a row,
and the held-out set is answered only whole (120 x 8). The answering, logging, resuming and the truncation rule are
readiness.py's own (`collect`), so a row and the gate cannot read a reply by two rules.

DIR gets rollouts.jsonl (verify_gym/rollouts.py's format, every reply with its sha256 and the endpoint's usage) and
run.json (the settings, the token totals, the cost the endpoint reported, and the cost at the listed prices).
                                                                                                            MIT"""
import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from verify_gym import api, rollouts  # noqa: E402
import readiness  # noqa: E402

N_HELDOUT, SAMPLES = 120, 8


def die(m):
    sys.exit("VERIFY-GYM MODEL ROW REFUSED: " + m)


def pilot_rows(n):
    fams = [f["id"] for f in api.curriculum()["families"]]
    return [api.family_pool_row(fams[k % len(fams)], "train", k // len(fams)) for k in range(n)]


def opt_float(x):
    return None if x.lower() == "none" else float(x)


def main(argv=None):
    ap = argparse.ArgumentParser(prog="modelrow.py")
    ap.add_argument("--endpoint", required=True)
    ap.add_argument("--model", required=True)
    ap.add_argument("--max-tokens", type=int, required=True)
    ap.add_argument("--temperature", type=opt_float, default=1.0, help="a number, or none to leave it out")
    ap.add_argument("--top-p", type=opt_float, default=1.0, help="a number, or none to leave it out")
    ap.add_argument("--extra-body", default="{}")
    ap.add_argument("--provider", required=True, help="who served it, in words (e.g. 'Prime Inference')")
    ap.add_argument("--thinking", required=True, help="the thinking mode, in words (e.g. 'off', 'default')")
    ap.add_argument("--price-in", type=float, default=None, help="US$ per 1M input tokens, as listed")
    ap.add_argument("--price-out", type=float, default=None, help="US$ per 1M output tokens, as listed")
    ap.add_argument("--api-key-env", default="VERIFY_GYM_API_KEY")
    ap.add_argument("--timeout", type=float, default=600)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--split", choices=["heldout", "train"], default="heldout")
    ap.add_argument("--n-tasks", type=int, default=None)
    ap.add_argument("--samples", type=int, default=SAMPLES)
    ap.add_argument("--out", required=True)
    a = ap.parse_args(argv)
    if a.split == "heldout":
        if (a.n_tasks not in (None, N_HELDOUT)) or a.samples != SAMPLES:
            die("the held-out set is answered whole: 120 tasks x 8 samples (a pilot uses --split train)")
        api.preflight()
        rows = api.heldout("v0")
    else:
        rows = pilot_rows(a.n_tasks or 6)
    cfg = {"endpoint": a.endpoint, "model": a.model, "max_tokens": a.max_tokens, "temperature": a.temperature,
           "top_p": a.top_p, "extra_body": json.loads(a.extra_body), "api_key_env": a.api_key_env,
           "timeout": a.timeout}
    settings = {"model": a.model, "endpoint": a.endpoint, "provider": a.provider, "temperature": a.temperature,
                "top_p": a.top_p, "max_tokens": a.max_tokens, "extra_body": cfg["extra_body"], "thinking": a.thinking,
                "tools": "none", "pilot": a.split != "heldout"}
    partial = os.path.join(a.out, "rollouts.partial.jsonl")
    started = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if os.path.exists(partial):
        started = json.loads(open(os.path.join(a.out, "started.json")).read())["started"]
    else:
        os.makedirs(a.out, exist_ok=True)
        open(os.path.join(a.out, "started.json"), "w").write(json.dumps({"started": started}) + "\n")
    try:
        head, ordered = readiness.collect(lambda r, k: readiness.endpoint_reply(cfg, r, k), rows, a.split, settings,
                                          a.samples, a.out, a.workers, n_tasks=len(rows))
    except RuntimeError as e:
        die("%s; the samples so far are kept in %s, re-run to resume" % (e, partial))
    text = rollouts.dumps(head, ordered)
    usage = readiness.usage_total(ordered)
    listed = None
    if a.price_in is not None and a.price_out is not None and "prompt_tokens" in usage:
        listed = round(usage["prompt_tokens"] * a.price_in / 1e6 + usage["completion_tokens"] * a.price_out / 1e6, 4)
    run = {"what": "verify-gym model answers (%s): %d tasks x %d samples, every reply stored; graded by "
                   "scorecard.py --add" % ("PILOT on the training stream, never a row" if settings["pilot"]
                                           else "the frozen held-out set", len(rows), a.samples),
           "settings": settings, "started": started,
           "finished": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "log": {"file": "rollouts.jsonl", "sha256": hashlib.sha256(text.encode("utf-8")).hexdigest()},
           "usage": usage, "prices_usd_per_1m": {"input": a.price_in, "output": a.price_out},
           "cost_usd_at_listed_prices": listed,
           "truncated": sum(1 for s in ordered if s["finish_reason"] == "length")}
    open(os.path.join(a.out, "rollouts.jsonl"), "w", encoding="utf-8").write(text)
    open(os.path.join(a.out, "run.json"), "w").write(json.dumps(run, indent=1, ensure_ascii=False) + "\n")
    os.remove(partial)
    os.remove(os.path.join(a.out, "started.json"))
    n = len(ordered)
    print("verify-gym model answers (%s%s): %d samples, %d truncated, mean reward %.4f, tokens in %s out %s, "
          "reported cost US$%s, at listed prices US$%s" % (
              a.model, ", PILOT" if settings["pilot"] else "", n, run["truncated"],
              sum(s["reward"] for s in ordered) / n, usage.get("prompt_tokens"), usage.get("completion_tokens"),
              usage.get("cost_usd_reported"), listed))
    return 0


if __name__ == "__main__":
    sys.exit(main())
