"""A runner that needs nothing but the standard library.

`python -m certificate_band_gym.cli tasks 5` prints tasks and their prompts;
`... gate` runs the forgery battery; `... eval --base-url ... --model ...`
evaluates any OpenAI-compatible endpoint. The point of the last one is that the
environment can be checked end to end before anybody installs a training stack.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from collections import Counter

from .forgeries import gate
from .task import grade, make_task, parse, render_prompt


def cmd_tasks(args):
    for s in range(args.n):
        t = make_task(args.seed + s)
        print(f"--- seed {t.seed} · {t.grader.kind} · rung {t.rung} · "
              f"band {t.band:.3e} · {'BREAKABLE' if t.attackable else 'no attack exists'}")
        if args.prompts:
            print(render_prompt(t))


def cmd_gate(args):
    g = gate(range(args.n))
    print(f"{g['planted']} forgeries planted, {g['leaked']} leaked -> "
          f"{'GATE GREEN' if g['ok'] else 'GATE FAILED'}")
    for f in g["failures"][:5]:
        print("  leaked:", f)
    sys.exit(0 if g["ok"] else 1)


def _complete(base_url, api_key, model, prompt, max_tokens):
    body = json.dumps({"model": model, "max_tokens": max_tokens,
                       "messages": [{"role": "user", "content": prompt}]}).encode()
    req = urllib.request.Request(
        base_url.rstrip("/") + "/chat/completions", data=body,
        headers={"content-type": "application/json",
                 **({"authorization": "Bearer " + api_key} if api_key else {})})
    with urllib.request.urlopen(req, timeout=300) as r:
        j = json.loads(r.read())
    return j["choices"][0]["message"]["content"]


def cmd_eval(args):
    g = gate(range(32))
    if not g["ok"]:
        print("forgery gate failed — refusing to evaluate anything"); sys.exit(1)
    print(f"gate green ({g['planted']} planted, 0 leaked)\n")
    tally = Counter()
    score = 0.0
    for s in range(args.n):
        t = make_task(args.seed + s)
        try:
            text = _complete(args.base_url, args.api_key, args.model, render_prompt(t), args.max_tokens)
        except Exception as e:
            tally["ERROR"] += 1
            continue
        sub, why = parse(text)
        if sub is None:
            tally["REFUSED_PARSE"] += 1
            continue
        r = grade(t, sub)
        tally[r["verdict"]] += 1
        score += r["score"]
    print(f"{args.model}: {args.n} tasks, mean score {score / max(1, args.n):+.3f}")
    for k, v in tally.most_common():
        print(f"   {k:<16} {v}")


def main(argv=None):
    p = argparse.ArgumentParser(prog="certificate-band-gym")
    sub = p.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("tasks"); t.add_argument("n", type=int, nargs="?", default=5)
    t.add_argument("--seed", type=int, default=0); t.add_argument("--prompts", action="store_true")
    t.set_defaults(func=cmd_tasks)
    g = sub.add_parser("gate"); g.add_argument("n", type=int, nargs="?", default=128)
    g.set_defaults(func=cmd_gate)
    e = sub.add_parser("eval")
    e.add_argument("--base-url", required=True); e.add_argument("--model", required=True)
    e.add_argument("--api-key", default=None); e.add_argument("--n", type=int, default=32)
    e.add_argument("--seed", type=int, default=0); e.add_argument("--max-tokens", type=int, default=3000)
    e.set_defaults(func=cmd_eval)
    args = p.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
