#!/usr/bin/env python3
"""Run the environment THROUGH verifiers against a live model, and check that the
framework's reward is the one this package would have given.

    python eval/run_verifiers.py --n 12 --model claude-opus-5 [--out eval/verifiers-run.json]

THE REWARD HERE IS `certified` (0 or 1), and `well_formed` is the one that carries
the thesis: a right verdict reached from a reference the task did not state is NOT
well formed, and this run reports the two apart.

WHY THIS EXISTS. Everything else about the binding is verified with completions I
wrote myself — I built the reply from the SAT witness and handed it to the reward
function. That tests my model of the framework, not the framework. The defect
that cost the sibling environment a whole eval (scoring handed pydantic message
objects, so every reply read as unparseable and the run printed 0.000 with no
error) only appears when the FRAMEWORK produces the completion.

So this runs the real path — dataset → prompt → live model → completion → rubric
— and then re-scores the same completions offline with `api.score`. The two must
agree on every rollout. If they ever disagree, the framework layer is doing
scoring of its own, which it must not.

It spends money. It is never called by a battery; `corpus/blindspot/` holds what
it produced, the way eval/results.json holds what run_models.py produced.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

# per-MTok, Anthropic first-party rates (claude-api skill, cached 2026-06-24)
PRICES = {
    "claude-opus-5": (5.00, 25.00),
    "claude-sonnet-5": (2.00, 10.00),
    "claude-haiku-4-5": (1.00, 5.00),
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=12)
    ap.add_argument("--model", default="claude-opus-5")
    ap.add_argument("--seed", type=int, default=4242)
    ap.add_argument("--max-tokens", type=int, default=12000)
    ap.add_argument("--effort", default="low",
                    help="output_config.effort: low|medium|high|xhigh|max, or 'none' to omit it. "
                         "Haiku 4.5 REJECTS the parameter outright (400), so it needs --effort none.")
    ap.add_argument("--concurrent", type=int, default=4)
    ap.add_argument("--retries", type=int, default=2)
    ap.add_argument("--out", default=os.path.join(HERE, "verifiers-run.json"))
    a = ap.parse_args()

    from anthropic import AsyncAnthropic
    from verifiers import AnthropicMessagesClient

    import lattice_claims as bs
    from lattice_claims import api

    env = bs.load_environment(num_tasks=a.n, seed=a.seed)
    # A live AsyncAnthropic rather than a ClientConfig: the zero-argument
    # constructor resolves the `ant auth login` profile, and no key is in play.
    client = AnthropicMessagesClient(AsyncAnthropic())

    t0 = time.time()
    # `Environment.evaluate` is a COROUTINE. Calling it without awaiting returns a
    # coroutine object, makes no request at all, and this script happily reported
    # "0 rollouts · 0 disagreements · $0.0000" — a clean pass that had run nothing.
    res = asyncio.run(env.evaluate(
        client=client,
        model=a.model,
        num_examples=a.n,
        max_concurrent=a.concurrent,
        max_retries=a.retries,
        # EFFORT, EXPLICITLY. Claude Opus 5 runs adaptive thinking when `thinking`
        # is omitted, and verifiers 0.3.1's ANTHROPIC_ADAPTIVE_THINKING_MODELS list
        # is {opus-4-7, opus-4-6, sonnet-4-6} — it predates Opus 5, so it sends no
        # thinking config at all. At max_tokens=6000 the model then spent the whole
        # budget thinking on some tasks and returned ONLY an empty thinking block,
        # which the client reports as "Model returned no content": three of three
        # rollouts errored, scored 0.0, and the eval read as a clean 0.000. Depth is
        # set here instead, the way the recorded run set it.
        sampling_args=({"max_tokens": a.max_tokens} if a.effort == "none" else
                       {"max_tokens": a.max_tokens, "output_config": {"effort": a.effort}}),
    ))
    secs = round(time.time() - t0, 1)

    # THE REAL SHAPE, read off the live object: GenerateOutputs has `.outputs`
    # (a list of RolloutOutput) and `.metadata`. My first pass assumed a
    # column-oriented dict, found nothing, and cheerfully reported "0 rollouts"
    # after a run that had actually spent money — so this now refuses an empty
    # result instead of calling it a pass.
    # GenerateOutputs and RolloutOutput are TypedDicts, not classes: `res.outputs`
    # is an AttributeError-free None and `res["outputs"]` is the list. `g` reads
    # either shape so this cannot silently see nothing again.
    outs = list(g(res, "outputs") or [])
    meta = g(res, "metadata")
    if not outs:
        print("REFUSING: evaluate returned no rollouts")
        return 2

    rows, disagreements, errors = [], [], []
    tin = tout = 0
    for o in outs:
        info = dict(g(o, "info") or {})
        text = _text(g(o, "completion"))
        err = g(o, "error")
        tu = g(o, "token_usage")
        tin += int((g(tu, "input_tokens") or g(tu, "prompt_tokens") or 0) if tu else 0)
        tout += int((g(tu, "output_tokens") or g(tu, "completion_tokens") or 0) if tu else 0)
        if err is not None:
            errors.append({"index": info.get("index"), "rung": info.get("rung"),
                           "error": str(g(err, "message") or err)[:200]})
        mine = api.score(int(info["seed"]), int(info["index"]), text) if info.get("seed") is not None else None
        theirs = float(g(o, "reward") or 0.0)
        row = {
            # THE SEED PER ROW. `evaluate` runs the EVAL dataset, whose taskset seed is
            # `seed + 1` by this adapter's split — so the run's --seed is NOT the seed
            # these rollouts came from. A record that does not carry the seed it was
            # scored with cannot be re-scored, and the battery got 75 false
            # disagreements out of 108 the first time it tried.
            "seed": info.get("seed"),
            "index": info.get("index"), "rung": info.get("rung"), "mutant": info.get("mutant"),
            "klass": info.get("klass"), "truth": info.get("truth"),
            "framework_reward": theirs,
            "offline_reward": mine["certified"] if mine else None,
            "outcome": (mine["verdict"] or "REFUSED_PARSE") if mine else "NO_INFO",
            "well_formed": mine["well_formed"] if mine else 0.0,
            "not_hacked": mine["not_hacked"] if mine else 0.0,
            "why": (mine.get("why") or "") if mine else "",
            "completed": bool(g(o, "is_completed")),
            "truncated": bool(g(o, "is_truncated")),
            "stop_condition": g(o, "stop_condition"),
            "error": errors[-1]["error"] if (err is not None) else None,
            "in_tokens": int((g(tu, "input_tokens") or g(tu, "prompt_tokens") or 0) if tu else 0),
            "out_tokens": int((g(tu, "output_tokens") or g(tu, "completion_tokens") or 0) if tu else 0),
            "chars": len(text), "raw": text,
        }
        rows.append(row)
        if mine is not None and abs(theirs - mine["certified"]) > 1e-9:
            disagreements.append(row)

    # THE SUM IS AUTHORITATIVE, NOT THE METADATA. `metadata.usage` is a PER-ROLLOUT
    # MEAN: it read 1,263 in / 761 out for a 36-rollout run, and taking it as the
    # total under-reported the spend by 36x. Under-reporting money is the worst
    # direction to be wrong in, so the per-rollout figures are summed here and the
    # mean is recorded beside them as a cross-check.
    mu = g(meta, "usage") if meta else None
    mean_usage = ({"input": float(g(mu, "input_tokens") or g(mu, "prompt_tokens") or 0),
                   "output": float(g(mu, "output_tokens") or g(mu, "completion_tokens") or 0)}
                  if mu is not None else None)
    if (tin == 0 and tout == 0) and mean_usage:      # per-rollout usage absent: fall back
        tin, tout = int(mean_usage["input"] * len(outs)), int(mean_usage["output"] * len(outs))
    usage = {"input": tin, "output": tout, "meanPerRollout": mean_usage, "rollouts": len(outs)}
    pin, pout = PRICES.get(a.model, (0.0, 0.0))
    cost = usage["input"] / 1e6 * pin + usage["output"] / 1e6 * pout
    metrics = dict((g(meta, "avg_metrics") or {}) if meta else {})

    rec = {
        "what": "The lattice-claims environment run THROUGH verifiers against a live model, and the "
                "framework's reward compared with this package's own scoring of the same completions.",
        "model": a.model, "n": a.n, "seed": a.seed,
        "eval_seed": (dict(g(outs[0], "info") or {}).get("seed") if outs else None),
        "effort": a.effort, "max_tokens": a.max_tokens, "seconds": secs,
        "verifiers": _vf_version(),
        "usage": usage, "cost_usd": round(cost, 4),
        "costNote": "Errored rollouts report no token_usage, so this UNDERCOUNTS: their tokens were "
                    "spent and are not in the total. The figure is a floor, not the bill.",
        "agreement": {"rollouts": len(rows), "disagreements": len(disagreements)},
        "outcomes": _tally(rows, "outcome"),
        "by_rung": _by_rung(rows),
        "unparseable": sum(1 for r in rows if r["outcome"] == "REFUSED_PARSE"),
        "wellFormed": sum(1 for r in rows if r["well_formed"] == 1.0),
        "avg_metrics": metrics,
        "framework_avg_reward": (g(meta, "avg_reward") if meta else None),
        "errors": errors,
        "rows": rows,
        "ranOn": time.strftime("%Y-%m-%d %H:%M:%S %z"),
    }
    # PRINT BEFORE WRITING. A serialisation failure after a paid run loses the run:
    # the first trial spent real calls and then died on `UserMessage is not JSON
    # serializable`, reporting nothing at all.
    print(f"{len(rows)} rollouts · {len(disagreements)} disagreements · "
          f"{usage['input']:,} in / {usage['output']:,} out · ${cost:.4f} · {secs}s")
    for k, v in rec["outcomes"].items():
        print(f"    {k:<16} {v}")
    if errors:
        print(f"    {len(errors)} rollout(s) errored: {errors[0]['error'][:110]}")
    if disagreements:
        print("DISAGREEMENTS (the framework scored differently from this package):")
        for r in disagreements[:5]:
            print(f"    idx {r['index']} rung {r['rung']}: framework {r['framework_reward']} vs offline {r['offline_reward']}")
    json.dump(rec, open(a.out, "w"), indent=1, ensure_ascii=False, default=str)
    print("wrote", a.out)
    return 1 if disagreements else 0


def g(o, name):
    """A field from a TypedDict or an object. verifiers' result types are
    TypedDicts, so attribute access returns nothing and reports no error."""
    if o is None:
        return None
    if isinstance(o, dict):
        return o.get(name)
    return getattr(o, name, None)


def _text(comp) -> str:
    """The assistant text out of whatever shape the framework returns."""
    if isinstance(comp, str):
        return comp
    if isinstance(comp, list):
        out = []
        for m in comp:
            role = g(m, "role")
            if role != "assistant":
                continue
            c = g(m, "content")
            if isinstance(c, str):
                out.append(c)
            elif isinstance(c, list):
                for part in c:
                    t = g(part, "text")
                    if t:
                        out.append(t)
        return "".join(out)
    return ""


def _usage(states):
    tin = tout = 0
    for s in states or []:
        u = (s or {}).get("usage") if isinstance(s, dict) else getattr(s, "usage", None)
        if not u:
            continue
        g = (lambda k: u.get(k) if isinstance(u, dict) else getattr(u, k, None))
        tin += int(g("input_tokens") or g("prompt_tokens") or 0)
        tout += int(g("output_tokens") or g("completion_tokens") or 0)
    return {"input": tin, "output": tout}


def _tally(rows, key):
    out = {}
    for r in rows:
        out[r[key]] = out.get(r[key], 0) + 1
    return dict(sorted(out.items()))


def _by_rung(rows):
    out = {}
    for r in rows:
        b = out.setdefault(r["rung"], {"n": 0, "reward": 0.0, "solved": 0, "wrong": 0,
                                       "unparseable": 0, "well_formed": 0})
        b["n"] += 1
        b["reward"] += r["offline_reward"]
        b["solved"] += int(r["offline_reward"] >= 1)
        b["wrong"] += int(r["offline_reward"] < 0)
        b["unparseable"] += int(r["outcome"] == "REFUSED_PARSE")
        b["well_formed"] += int(r["well_formed"] == 1.0)
    for b in out.values():
        b["mean"] = round(b["reward"] / b["n"], 3) if b["n"] else 0.0
    return out


def _vf_version():
    try:
        import verifiers
        return getattr(verifiers, "__version__", "?")
    except Exception:
        return "?"


if __name__ == "__main__":
    sys.exit(main())
