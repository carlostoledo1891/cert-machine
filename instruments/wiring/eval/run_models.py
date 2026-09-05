"""Run models against the environment and report by model and rung.

    python3 eval/run_models.py --n 15 --live

Small dimensions on purpose: the point is whether a model decides the right
thing and declares what it decided against, not whether it can multiply
250-digit integers in its head. Every task is still a real lattice with a real
exact answer; only the scale is chosen so the eval is affordable.
"""

import argparse, json, re, subprocess, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, __file__.rsplit("/", 2)[0])
from lattice_claims.taskset import RUNGS, Taskset, grade
from lattice_claims.wiring import WiringTaskset, grade_wiring

MODELS = [
    {"id": "claude-opus-5", "label": "Opus 5", "effort": True},
    {"id": "claude-sonnet-5", "label": "Sonnet 5", "effort": True},
    {"id": "claude-haiku-4-5", "label": "Haiku 4.5", "effort": False},
]


def token():
    return subprocess.check_output(
        ["ant", "auth", "print-credentials", "--access-token"], text=True).strip()


def ask(model, prompt, tok):
    body = {"model": model["id"], "max_tokens": 4000,
            "messages": [{"role": "user", "content": prompt}]}
    if model["effort"]:
        body["output_config"] = {"effort": "low"}
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode(),
        headers={"content-type": "application/json",
                 "anthropic-version": "2023-06-01",
                 "anthropic-beta": "oauth-2025-04-20",
                 "authorization": f"Bearer {tok}"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                j = json.loads(r.read())
            txt = "".join(b.get("text", "") for b in j.get("content", []) if b.get("type") == "text")
            return txt, j.get("usage", {}), j.get("stop_reason")
        except Exception as e:
            if attempt == 3:
                return f"__ERROR__ {e}", {}, "error"
    return "__ERROR__", {}, "error"


def parse_graph(txt):
    """Last JSON object carrying a node list. Graphs nest, so brace-matching."""
    best, depth, start = None, 0, None
    for i, c in enumerate(txt):
        if c == "{":
            if depth == 0:
                start = i
            depth += 1
        elif c == "}" and depth:
            depth -= 1
            if depth == 0:
                try:
                    d = json.loads(txt[start:i + 1])
                except Exception:
                    continue
                if isinstance(d, dict) and "nodes" in d and "wires" in d:
                    best = d
    return best


def parse(txt):
    """Last JSON object in the reply. Models wrap answers in prose and fences."""
    best = None
    for m in re.finditer(r"\{(?:[^{}]|\{[^{}]*\})*\}", txt, re.S):
        try:
            d = json.loads(m.group(0))
        except Exception:
            continue
        if isinstance(d, dict) and "verdict" in d:
            best = d
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=15, help="tasks per rung")
    ap.add_argument("--live", action="store_true")
    ap.add_argument("--dims", type=int, nargs="+", default=[8, 12, 16])
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--wiring", action="store_true", help="the graph is the submission")
    a = ap.parse_args()

    if a.wiring:
        wts = WiringTaskset(seed=a.seed, dims=tuple(a.dims))
        tasks = [("wiring", wts.sample(i)) for i in range(a.n * 3)]
    else:
        ts = Taskset(seed=a.seed, dims=tuple(a.dims))
        tasks = []
        for r in RUNGS:
            for i in range(a.n):
                tasks.append((r, ts.sample(i * 3 + RUNGS.index(r), rung=r)))
    truth = (lambda t: t.truth) if a.wiring else (lambda t: t._truth)
    print(f"{len(tasks)} tasks, dims {a.dims}, truths: "
          + ", ".join(f"{v}={sum(1 for _, t in tasks if truth(t) == v)}"
                      for v in sorted({truth(t) for _, t in tasks})))
    if not a.live:
        print("\nDRY RUN. Re-run with --live.\n")
        print(tasks[0][1].prompt()[:900])
        return

    tok = token()
    rows = []

    def one(job):
        model, rung, task = job
        txt, usage, stop = ask(model, task.prompt(), tok)
        if a.wiring:
            if stop == "refusal":
                # the model declined the task; that is not an attempt at it
                return {"model": model["label"], "rung": "wiring", "truth": task.truth, "raw": "",
                        "verdict": None, "cert": 0.0, "wf": 0.0, "hack": 0.0, "why": "REFUSED BY POLICY",
                        "declined": True, "in": usage.get("input_tokens", 0), "out": usage.get("output_tokens", 0)}
            sub = parse_graph(txt)
            g = grade_wiring(task.truth, sub) if sub else {"certified": 0.0, "well_formed": 0.0, "not_hacked": 0.0, "why": "unparseable"}
            return {"model": model["label"], "rung": "wiring", "truth": task.truth, "raw": txt[-1200:],
                    "verdict": (sub or {}).get("nodes"), "cert": g["certified"], "wf": g["well_formed"],
                    "hack": g.get("not_hacked", 0.0), "why": g.get("why", ""),
                    "in": usage.get("input_tokens", 0), "out": usage.get("output_tokens", 0)}
        sub = parse(txt)
        g = grade(task, sub) if sub else {"certified": 0.0, "well_formed": 0.0, "why": "unparseable"}
        return {"model": model["label"], "rung": rung, "truth": task._truth, "raw": txt[-1200:],
                "verdict": (sub or {}).get("verdict"), "cert": g["certified"],
                "wf": g["well_formed"], "why": g.get("why", ""),
                "in": usage.get("input_tokens", 0), "out": usage.get("output_tokens", 0)}

    jobs = [(m, r, t) for m in MODELS for r, t in tasks]
    with ThreadPoolExecutor(max_workers=12) as ex:
        for k, res in enumerate(ex.map(one, jobs)):
            rows.append(res)
            if (k + 1) % 20 == 0:
                print(f"  {k + 1}/{len(jobs)}")

    json.dump(rows, open("eval/results-wiring.json" if a.wiring else "eval/results.json", "w"), indent=1)
    if a.wiring:
        print("\n  the graph as the submission")
        print("  " + "model".ljust(11) + "attempted".ljust(12) + "wired legally".ljust(16)
              + "used the exact one".ljust(20) + "right verdict")
        for m in MODELS:
            mine = [x for x in rows if x["model"] == m["label"]]
            att = [x for x in mine if not x.get("declined")]
            n = len(att) or 1
            print("  " + m["label"].ljust(11)
                  + f"{len(att)}/{len(mine)}".ljust(12)
                  + f"{sum(x['wf'] for x in att):.0f}/{n}".ljust(16)
                  + f"{sum(x['hack'] for x in att):.0f}/{n}".ljust(20)
                  + f"{sum(x['cert'] for x in att):.0f}/{n}")
        from collections import Counter
        print("\n  why they failed")
        for m in MODELS:
            c = Counter(x["why"].split(";")[0].split(":")[0][:52] for x in rows
                        if x["model"] == m["label"] and x["cert"] == 0 and not x.get("declined"))
            print("  " + m["label"].ljust(11) + "; ".join(f"{v}x {k}" for k, v in c.most_common(3)))
        ti = sum(x["in"] for x in rows); to = sum(x["out"] for x in rows)
        print(f"\n  {len(rows)} calls, {ti} in / {to} out tokens")
        return

    print("\n  certified (the scored reward), by model and rung")
    print("  " + "model".ljust(11) + "".join(r.ljust(17) for r in RUNGS) + "overall")
    for m in MODELS:
        mine = [x for x in rows if x["model"] == m["label"]]
        cells = []
        for r in RUNGS:
            sub = [x for x in mine if x["rung"] == r]
            cells.append(f"{sum(x['cert'] for x in sub):.0f}/{len(sub)}".ljust(17))
        print("  " + m["label"].ljust(11) + "".join(cells)
              + f"{sum(x['cert'] for x in mine):.0f}/{len(mine)}")

    print("\n  well_formed (declared a reference, and the right one) — diagnostic")
    for m in MODELS:
        mine = [x for x in rows if x["model"] == m["label"] and x["rung"] != "underspecified"]
        print(f"  {m['label'].ljust(11)}{sum(x['wf'] for x in mine):.0f}/{len(mine)}")

    print("\n  where the verdicts went")
    for m in MODELS:
        mine = [x for x in rows if x["model"] == m["label"]]
        seen = {}
        for x in mine:
            seen[(x["truth"], x["verdict"])] = seen.get((x["truth"], x["verdict"]), 0) + 1
        worst = sorted(((v, str(k[0]), str(k[1])) for k, v in seen.items() if k[0] != k[1]),
                       reverse=True)[:3]
        print(f"  {m['label'].ljust(11)}" + "; ".join(f"{c}x said {g} when it was {t}" for c, t, g in worst))

    ti = sum(x["in"] for x in rows); to = sum(x["out"] for x in rows)
    print(f"\n  {len(rows)} calls, {ti} in / {to} out tokens")


if __name__ == "__main__":
    main()
