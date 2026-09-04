"""A runner that needs nothing but the standard library.

`python -m break_the_grader.cli tasks 5` prints tasks and their prompts;
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

from .api import preflight, score
from .policies import POLICIES
from .forgeries import gate
from .task import make_task, render_prompt


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
    g = preflight(range(32))
    print(f"gate green ({g['planted']} planted, 0 leaked)\n")
    tally = Counter()
    total = 0.0
    for s in range(args.n):
        t = make_task(args.seed + s)
        try:
            text = _complete(args.base_url, args.api_key, args.model, render_prompt(t), args.max_tokens)
        except Exception as e:
            tally["ERROR"] += 1
            print(f"   call failed on seed {t.seed}: {str(e)[:120]}")
            continue
        r = score(t.seed, text)
        tally[r["verdict"]] += 1
        total += r["reward"]
    print(f"{args.model}: {args.n} tasks, mean score {total / max(1, args.n):+.3f}")
    for k, v in tally.most_common():
        print(f"   {k:<16} {v}")


def cmd_baseline(args):
    """The reference table: every shipped policy, over the same tasks.

    No key, no network, no GPU. It exists so a model's number arrives with a
    floor under it and a ceiling over it, and so anyone can check that this
    environment separates behaviours before they spend anything on it.
    """
    preflight(range(32))
    names = args.policies.split(",") if args.policies else list(POLICIES)
    rungs = ["impossible", "razor", "narrow", "wide"]
    print(f"{'policy':<9} {'n':>4} {'mean reward':>12} {'solved':>7} {'false':>6}  "
          + "  ".join(f"{r:>10}" for r in rungs))
    for name in names:
        policy = POLICIES[name]
        tally = {r: [0, 0] for r in rungs}
        total = false = 0.0
        for s in range(args.n):
            t = make_task(args.seed + s)
            r = score(t.seed, policy(render_prompt(t)))
            total += r["reward"]; false += r["false_claim"]
            cell = tally.setdefault(t.rung, [0, 0])
            cell[1] += 1; cell[0] += 1 if r["reward"] >= 1 else 0
        solved = sum(c[0] for c in tally.values())
        print(f"{name:<9} {args.n:>4} {total / args.n:>+12.3f} {solved / args.n:>6.0%} "
              f"{int(false):>6}  " + "  ".join(
                  f"{tally[r][0]:>4}/{tally[r][1]:<5}" for r in rungs))


def main(argv=None):
    p = argparse.ArgumentParser(prog="break-the-grader")
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
    b = sub.add_parser("baseline"); b.add_argument("n", type=int, nargs="?", default=200)
    b.add_argument("--seed", type=int, default=0)
    b.add_argument("--policies", default=None, help="comma-separated subset")
    b.set_defaults(func=cmd_baseline)
    args = p.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
