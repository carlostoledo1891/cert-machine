"""The reference table: every policy on the same tasks, one simulation per task.

All policies' pairs for one task go through the simulator in a single batch,
so a table of ten policies over a hundred and twenty tasks costs a hundred and
twenty runs of the simulator, about a minute.
"""
from . import sim
from .policies import POLICIES
from .taskset import RUNGS, Taskset, grade, parse_pairs, KILL


def run_baseline(n=40, seed=2026, policies=None):
    policies = policies or list(POLICIES)
    ts = Taskset(seed=seed)
    tasks = [(r, ts.sample(i * len(RUNGS) + RUNGS.index(r), rung=r)) for r in RUNGS for i in range(n)]
    rows = []
    for rung, t in tasks:
        subs = {p: POLICIES[p](t) for p in policies}
        # one batch per task: every KILL policy's pairs, simulated together
        batch, owners = [], []
        for p, s in subs.items():
            if s.get("verdict") == KILL:
                try:
                    prs = parse_pairs(s)
                except ValueError:
                    continue
                for u, v in prs:
                    batch.append((t.mutant["id"], u, v)); owners.append((p, u, v))
        res = sim.simulate(batch) if batch else []
        hit = {}
        for (p, u, v), (o, m) in zip(owners, res):
            if o != m and p not in hit:
                hit[p] = (u, v, o, m)
        for p, s in subs.items():
            g = _grade_with(t, s, hit.get(p))
            rows.append({"policy": p, "rung": rung, "klass": t.klass, "mutant": t.mutant["id"],
                         "truth": t.truth, "reward": g["reward"], "outcome": g["outcome"],
                         "false_claim": g["false_claim"], "in_box_kill": g["in_box_kill"]})
    return {"n_per_rung": n, "seed": seed, "rungs": list(RUNGS), "policies": policies, "rows": rows}


def _grade_with(task, sub, hit):
    """grade() without re-simulating: the batch already answered the question."""
    from .taskset import EQUIVALENT, UNDECIDED, in_box
    if sub.get("verdict") != KILL:
        return grade(task, sub)
    try:
        parse_pairs(sub)
    except ValueError as e:
        return {"reward": 0.0, "outcome": "REFUSED_PARSE", "false_claim": 0.0, "in_box_kill": None, "why": str(e)}
    if hit:
        u, v, o, m = hit
        return {"reward": 1.0, "outcome": "SOLVED", "false_claim": 0.0, "in_box_kill": in_box(u, v)}
    if task.mutant["equivalent"]:
        return {"reward": -1.0, "outcome": "WRONG", "false_claim": 1.0, "in_box_kill": None}
    return {"reward": 0.0, "outcome": "MISSED", "false_claim": 0.0, "in_box_kill": None}


def render(res):
    rows, rungs, pols = res["rows"], res["rungs"], res["policies"]
    classes = sorted({r["klass"] for r in rows}, key=lambda c: ["COVERED", "MINT_ONLY", "OUTBOX_ONLY", "ALIGNED_ONLY", "CORPUS_ONLY", "SURVIVED_ALL", "NOCHANGE", "IDENTITY"].index(c) if c in ["COVERED", "MINT_ONLY", "OUTBOX_ONLY", "ALIGNED_ONLY", "CORPUS_ONLY", "SURVIVED_ALL", "NOCHANGE", "IDENTITY"] else 99)
    out = [f"{res['n_per_rung']} tasks per rung, seed {res['seed']}", "",
           "mean reward by rung                              solved   false claims",
           f"  {'policy':<10}" + "".join(f"{r:>10}" for r in rungs) + f"{'all':>10}{'':>6}"]
    for p in pols:
        mine = [r for r in rows if r["policy"] == p]
        cells = []
        for rg in rungs:
            x = [r["reward"] for r in mine if r["rung"] == rg]
            cells.append(f"{sum(x) / len(x):>+10.3f}" if x else f"{'-':>10}")
        allr = [r["reward"] for r in mine]
        solved = sum(1 for r in mine if r["outcome"] == "SOLVED")
        fc = sum(r["false_claim"] for r in mine)
        out.append(f"  {p:<10}" + "".join(cells) + f"{sum(allr) / len(allr):>+10.3f}      {solved:>3}/{len(mine):<4} {int(fc):>4}")
    out += ["", "solved by class (all rungs)",
            f"  {'policy':<10}" + "".join(f"{c[:11]:>13}" for c in classes)]
    for p in pols:
        mine = [r for r in rows if r["policy"] == p]
        cells = []
        for c in classes:
            x = [r for r in mine if r["klass"] == c]
            s = sum(1 for r in x if r["outcome"] == "SOLVED")
            cells.append(f"{s:>7}/{len(x):<5}" if x else f"{'-':>13}")
        out.append(f"  {p:<10}" + "".join(cells))
    return "\n".join(out)
