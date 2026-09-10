"""Run models against the environment and report by model, rung and class.

    python3 eval/run_models.py --n 12 --live

Every task is a real mutant of the real netlist and every KILL is verified by
simulating it.  Refusals and truncations are recorded as what they are, not as
wrong answers.  Nothing is reworded to get past a classifier.
"""
import argparse, json, os, subprocess, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, __file__.rsplit("/", 2)[0])
from blind_spot.taskset import RUNGS, Taskset, grade

MODELS = [
    {"id": "claude-opus-5", "label": "Opus 5", "effort": True},
    {"id": "claude-sonnet-5", "label": "Sonnet 5", "effort": True},
    {"id": "claude-haiku-4-5", "label": "Haiku 4.5", "effort": False},
]


def token():
    return subprocess.check_output(["ant", "auth", "print-credentials", "--access-token"], text=True).strip()


def ask(model, prompt, tok, max_tokens=6000):
    body = {"model": model["id"], "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}]}
    if model["effort"]:
        body["output_config"] = {"effort": "low"}
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages", data=json.dumps(body).encode(),
        headers={"content-type": "application/json", "anthropic-version": "2023-06-01",
                 "anthropic-beta": "oauth-2025-04-20", "authorization": f"Bearer {tok}"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=240) as r:
                j = json.loads(r.read())
            txt = "".join(b.get("text", "") for b in j.get("content", []) if b.get("type") == "text")
            if j.get("stop_reason") == "refusal":
                # keep whatever the API says about the refusal; nothing is reworded
                meta = {k: v for k, v in j.items() if k not in ("content", "usage")}
                return "__REFUSAL__ " + json.dumps(meta), j.get("usage", {}), "refusal"
            return txt, j.get("usage", {}), j.get("stop_reason")
        except Exception as e:
            if attempt == 3:
                return f"__ERROR__ {e}", {}, "error"
            time.sleep(2 * (attempt + 1))
    return "__ERROR__", {}, "error"


# THE PARSER MOVED INTO THE PACKAGE on the port (2026-09-09). It lived here, where
# the framework adapter could not reach it, so training would have read a model's
# reply by one rule and this record by another -- and a rule defined twice diverges.
# environments/blind_spot/battery.py re-parses and re-grades all 108 stored raws
# with the package's copy on every build; no row may move.
from blind_spot.api import parse_reply as parse


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=12, help="tasks per rung")
    ap.add_argument("--live", action="store_true")
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--models", nargs="*", default=None)
    ap.add_argument("--out", default="eval/results.json")
    ap.add_argument("--rungs", nargs="*", default=None, help="only these rungs")
    ap.add_argument("--merge", action="store_true",
                    help="replace the rows of the chosen rungs inside an existing --out file")
    a = ap.parse_args()
    models = [m for m in MODELS if not a.models or m["id"] in a.models or m["label"] in a.models]
    ts = Taskset(seed=a.seed)
    rungs = [r for r in RUNGS if not a.rungs or r in a.rungs]
    tasks = [(r, ts.sample(i * len(RUNGS) + RUNGS.index(r), rung=r)) for r in rungs for i in range(a.n)]
    from collections import Counter
    print(f"{len(tasks)} tasks; classes {dict(Counter(t.klass for _, t in tasks))}; "
          f"truths {dict(Counter(t.truth for _, t in tasks))}")
    if not a.live:
        print("\nDRY RUN. Re-run with --live.\n")
        print(tasks[0][1].prompt())
        return
    tok = token()

    def one(job):
        model, rung, task = job
        txt, usage, stop = ask(model, task.prompt(), tok)
        row = {"model": model["label"], "rung": rung, "klass": task.klass, "mutant": task.mutant["id"],
               "truth": task.truth, "raw": txt, "stop": stop,
               "in": usage.get("input_tokens", 0), "out": usage.get("output_tokens", 0)}
        if stop == "refusal":
            row.update(verdict=None, reward=0.0, outcome="REFUSED_BY_POLICY", well_formed=0.0,
                       false_claim=0.0, in_box_kill=None, why="the model declined the task", declined=True)
            return row
        if stop == "error" or txt.startswith("__ERROR__"):
            row.update(verdict=None, reward=0.0, outcome="ERROR", well_formed=0.0, false_claim=0.0,
                       in_box_kill=None, why=txt[:200], declined=False)
            return row
        sub = parse(txt)
        g = grade(task, sub) if sub else {"reward": 0.0, "outcome": "REFUSED_PARSE", "well_formed": 0.0,
                                          "false_claim": 0.0, "in_box_kill": None, "why": "nothing parseable"}
        row.update(verdict=(sub or {}).get("verdict"), where=(sub or {}).get("where"), reward=g["reward"],
                   outcome=g["outcome"], well_formed=g["well_formed"], false_claim=g["false_claim"],
                   in_box_kill=g["in_box_kill"], killer=g.get("killer"), why=g.get("why", ""),
                   declined=False, truncated=(stop == "max_tokens"))
        return row

    jobs = [(m, r, t) for m in models for r, t in tasks]
    rows = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        for k, row in enumerate(ex.map(one, jobs)):
            rows.append(row)
            if k % 9 == 8:
                print(f"  {k + 1}/{len(jobs)}", flush=True)
    if a.merge and os.path.exists(a.out):
        old_rows = [r for r in json.load(open(a.out)) if r["rung"] not in rungs
                    or r["model"] not in {m["label"] for m in models}]
        rows = old_rows + rows
        rows.sort(key=lambda r: ([m["label"] for m in MODELS].index(r["model"]), RUNGS.index(r["rung"])))
    json.dump(rows, open(a.out, "w"), indent=1)
    tin = sum(r["in"] for r in rows); tout = sum(r["out"] for r in rows)
    print(f"\n{len(rows)} calls, {tin} in / {tout} out tokens -> {a.out}\n")
    print(f"{'model':<10}" + "".join(f"{r:>12}" for r in RUNGS) + f"{'all':>10}  solved  wrong  refused/trunc")
    for m in models:
        mine = [r for r in rows if r["model"] == m["label"]]
        cells = []
        for rg in RUNGS:
            x = [r["reward"] for r in mine if r["rung"] == rg and not r.get("declined")]
            cells.append(f"{sum(x) / len(x):>+12.3f}" if x else f"{'-':>12}")
        allr = [r["reward"] for r in mine if not r.get("declined")]
        print(f"{m['label']:<10}" + "".join(cells) + f"{(sum(allr) / len(allr)) if allr else 0:>+10.3f}"
              f"  {sum(1 for r in mine if r['outcome'] == 'SOLVED'):>5}"
              f"  {sum(1 for r in mine if r['outcome'] == 'WRONG'):>5}"
              f"  {sum(1 for r in mine if r.get('declined')):>3}/{sum(1 for r in mine if r.get('truncated')):<3}")


if __name__ == "__main__":
    main()
