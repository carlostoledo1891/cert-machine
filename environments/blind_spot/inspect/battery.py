#!/usr/bin/env python3
"""environments/blind_spot/inspect/battery.py — the Inspect binding of blind-spot, gated on every build.

    python3 environments/blind_spot/inspect/battery.py

Runs under environments/blind_spot/.venv (inspect_ai + the Anthropic SDK; created on
first run from python3.12 if absent: `make blind-spot-venv`). No model is ever called
here; the recorded runs in inspect/logs/ are what `inspect eval` produced, and this
file RE-SCORES them.

WHAT IS PROVED, every build:

  · THE TWO SCORERS AGREE ON EVERY POOLED MUTANT. For each of MCY's 400 mutations a
    (seed, index) that draws it is found in the taskset, the truthful answer (the SAT
    witness, or EQUIVALENT) and UNDECIDED are scored THREE ways — the Inspect scorer on
    an Inspect TaskState, `api.score(seed, index, text)` (what the verifiers rubric's
    `_decide` calls) and `taskset.grade` on the task itself — and the three must agree
    field for field. The false claim is scored the same three ways on every
    proved-equivalent mutant and on a sample of the killable ones.
  · THE RED CONTROL: a witness with ONE coordinate changed stops killing under BOTH
    scorers — MISSED, reward 0, never SOLVED — on the first killable mutant and on
    twenty-four more drawn at random. The witness names a pair, not a region.
  · A verdict buried in a reasoning block under a final UNDECIDED grades UNDECIDED:
    the scorer reads text parts only. Fed the raw rendering (`<think>…</think>` and
    the text), the same grader would have read the buried KILL — which is why the
    filter is load-bearing and is planted here as a red control.
  · Every recorded eval log re-scored offline: the assistant text of every sample
    through `api.score`, compared with the score Inspect wrote; 0 disagreements.
  · The ledger's pins: task.py, baselines.json and every log re-hashed against
    certs/blind-spot-inspect-ledger.json; the ledger's per-rung counts re-derived from
    the logs; the README's quoted numbers found in the ledger.

Exit 0 iff every check passes and every red control fires.
"""
import asyncio
import glob
import hashlib
import json
import os
import random
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ENV = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(ENV, "..", ".."))
VENV_PY = os.path.join(ENV, ".venv", "bin", "python")
LEDGER = os.path.join(ROOT, "certs", "blind-spot-inspect-ledger.json")
OUT = os.path.join(ROOT, "corpus", "blindspot", "inspect-record.json")

# ---- run under the venv that has inspect_ai --------------------------------------------
try:
    import inspect_ai  # noqa: F401
except ImportError:
    if os.path.exists(VENV_PY) and os.path.abspath(sys.executable) != os.path.abspath(VENV_PY):
        os.execv(VENV_PY, [VENV_PY] + sys.argv)
    py312 = next((p for p in ("/opt/homebrew/bin/python3.12", "/usr/local/bin/python3.12", "python3.12")
                  if os.path.exists(p) or (p == "python3.12" and subprocess.run(["which", p], capture_output=True).returncode == 0)), None)
    if py312 is None:
        print("blind-spot inspect battery: inspect_ai is not importable and no python3.12 is available to build the venv")
        sys.exit(2)
    print("blind-spot inspect battery: creating environments/blind_spot/.venv with inspect_ai (one-time)", flush=True)
    r = subprocess.run([py312, "-m", "venv", os.path.join(ENV, ".venv")])
    r2 = subprocess.run([VENV_PY, "-m", "pip", "install", "-q", "inspect_ai", "anthropic", "pytest"])
    if r.returncode or r2.returncode or not os.path.exists(VENV_PY):
        print("blind-spot inspect battery: could not build the venv")
        sys.exit(2)
    os.execv(VENV_PY, [VENV_PY] + sys.argv)

sys.path.insert(0, ENV)
sys.path.insert(0, HERE)

fails, reds, dead, lines = [], 0, 0, []


def report(ok, name, extra=""):
    line = ("PASS " if ok else "FAIL ") + name + (("  " + extra) if extra else "")
    print(line, flush=True)
    lines.append(line)
    if not ok:
        fails.append(name)


def red(ok, name, extra=""):
    global reds, dead
    if ok:
        reds += 1
    else:
        dead += 1
    report(ok, "RED CONTROL: " + name, extra)


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


t0 = time.time()

# ------------------------------------------------------------ 1 · the binding imports
import inspect_ai                                                       # noqa: E402
from inspect_ai.model import ChatMessageAssistant, ChatMessageUser      # noqa: E402
from inspect_ai._util.content import ContentReasoning, ContentText      # noqa: E402
from inspect_ai.scorer import Target                                    # noqa: E402
from inspect_ai.solver import TaskState                                 # noqa: E402

import task as T                                                        # noqa: E402  the Inspect task
from blind_spot import api, pool as _pool, sim                          # noqa: E402
from blind_spot.adapters_v0 import _decide, _reply_text                 # noqa: E402
from blind_spot.design import tools_missing                             # noqa: E402
from blind_spot.taskset import RUNGS, Taskset, grade                    # noqa: E402

report(True, f"inspect_ai {inspect_ai.__version__} under {sys.executable}")
missing = tools_missing()
report(not missing, "yosys, iverilog and vvp are on PATH", "missing: " + ", ".join(missing) if missing else "")
if missing:
    sys.exit(1)
_pool.ensure_sim()

# --------------------------------------------------- 2 · the four tasks and their variants
tasks = {n: fn(num_tasks=3) for n, fn in (("blind_spot", T.blind_spot), ("blind_spot_located", T.blind_spot_located),
                                           ("blind_spot_profile", T.blind_spot_profile), ("blind_spot_blind", T.blind_spot_blind))}
rung_ok = all(all(s.metadata["rung"] == r for s in tasks[f"blind_spot_{r}"].dataset) for r in RUNGS)
mixed_ok = [s.metadata["rung"] for s in tasks["blind_spot"].dataset] == list(RUNGS)
report(rung_ok and mixed_ok, "three rung variants serve one rung each; the mixed task cycles located/profile/blind")
ids_ok = all(s.id == Taskset(seed=s.metadata["seed"]).sample(s.metadata["index"]).id
             and s.metadata["rung"] == RUNGS[s.metadata["index"] % 3] for t in tasks.values() for s in t.dataset)
report(ids_ok, "every sample id is the taskset's own Task.id for (seed, index), and the rung is the index's")
hidden = all(s.target == "" and "prompt" not in s.metadata and s.metadata["klass"] not in s.input
             and 'equivalent":' not in s.input and "witness" not in s.input.lower()
             for t in tasks.values() for s in t.dataset)
report(hidden, "no answer key: target is empty, the prompt names neither the class nor the label")
same_prompt = all(s.input == api.task_row(s.metadata["seed"], s.metadata["index"])["prompt"] for t in tasks.values() for s in t.dataset)
report(same_prompt, "the Inspect prompt is byte-identical to the verifiers `question` for the same (seed, index)")

scorer = tasks["blind_spot"].scorer[0]


def inspect_score(seed, index, reply_parts):
    """The Inspect scorer on a TaskState the way `inspect eval` would build it."""
    info = T.info_of(seed, index)
    st = TaskState(model="battery", sample_id=f"{seed}-{index}", epoch=1, input="",
                   messages=[ChatMessageUser(content="…"), ChatMessageAssistant(content=reply_parts)],
                   metadata=info)
    return asyncio.run(scorer(st, Target("")))


FIELDS = ("reward", "outcome", "well_formed", "false_claim", "in_box_kill")


def three_ways(seed, index, reply):
    """(inspect, api.score, grade) — the three must agree on the five fields."""
    s = inspect_score(seed, index, reply)
    a = api.score(seed, index, reply)
    t = Taskset(seed=seed).sample(index)
    g = grade(t, api.parse_reply(reply))
    i = {"reward": s.value["reward"], "outcome": s.metadata["outcome"], "well_formed": s.value["well_formed"],
         "false_claim": s.value["false_claim"], "in_box_kill": s.metadata["in_box_kill"]}
    return i, {k: a[k] for k in FIELDS}, {k: g[k] for k in FIELDS}, t


# --------------------------------------- 3 · a (seed, index) for EVERY pooled mutant
P = _pool.load()
mutants = P["mutants"]
want = {m["id"] for m in mutants}
found, seed, index = {}, T.DEFAULT_SEED, 0
while want - set(found) and index < 200_000:
    t = Taskset(seed=seed).sample(index)
    mid = t.mutant["id"]
    if mid not in found:
        found[mid] = (seed, index)
    index += 1
report(set(found) == want, f"a (seed, index) that draws each of the {len(want)} pooled mutants exists in the "
       f"seed-{seed} taskset", f"scanned {index} indices; deepest {max(i for _, i in found.values())}")


def truthful(m):
    if m["witness"]:
        w = m["witness"]
        return json.dumps({"verdict": "KILL", "pairs": [{"u": w["u"], "v": w["v"]}], "where": "the SAT witness"})
    return json.dumps({"verdict": "EQUIVALENT", "where": "the miter"})


some_witness = next(m for m in mutants if m["witness"])["witness"]


def false_claim(m):
    if m["witness"]:
        return json.dumps({"verdict": "EQUIVALENT"})
    return json.dumps({"verdict": "KILL", "pairs": [{"u": some_witness["u"], "v": some_witness["v"]}]})


# ------------------------------------------- 4 · agreement, every mutant, three ways
t1 = time.time()
disagree, wrong_truth, n_sub = [], [], 0
rng = random.Random(2026)
killable_ids = [m["id"] for m in mutants if m["witness"]]
false_on = set(m["id"] for m in mutants if not m["witness"]) | set(rng.sample(killable_ids, 40))
for m in sorted(mutants, key=lambda e: e["id"]):
    s_, i_ = found[m["id"]]
    subs = [truthful(m), '{"verdict": "UNDECIDED"}'] + ([false_claim(m)] if m["id"] in false_on else [])
    for reply in subs:
        i, a, g, t = three_ways(s_, i_, reply)
        n_sub += 1
        assert t.mutant["id"] == m["id"]
        if not (i == a == g):
            disagree.append((m["id"], reply[:40], i, a, g))
    tr = three_ways(s_, i_, truthful(m))[1]
    if tr["outcome"] != "SOLVED" or tr["reward"] != 1.0:
        wrong_truth.append(m["id"])
report(not disagree, f"the Inspect scorer, api.score and taskset.grade agree field for field on all {len(mutants)} "
       f"pooled mutants × truthful/UNDECIDED{'/false-claim' if false_on else ''} = {n_sub} submissions",
       f"disagreements: {disagree[:3]}" if disagree else f"{round(time.time() - t1, 1)} s")
report(not wrong_truth, "and the truthful answer scores SOLVED +1 on every one of them (the positive control, 400 times)",
       f"failed: {wrong_truth[:5]}" if wrong_truth else "")
fc = [m for m in mutants if m["id"] in false_on]
fc_bad = [m["id"] for m in fc if three_ways(*found[m["id"]], false_claim(m))[1]["outcome"] != "WRONG"]
report(not fc_bad, f"the false claim scores WRONG −1 on all {len(fc)} mutants it was tried on "
       f"({sum(1 for m in fc if not m['witness'])} proved-equivalent + {sum(1 for m in fc if m['witness'])} killable)",
       f"not WRONG: {fc_bad[:5]}" if fc_bad else "")

# ------------------------------------------------------------ 5 · the red controls
# (a) a witness with one coordinate changed stops killing under BOTH scorers
#     The first run of this control assumed the spoiled pair stops killing on EVERY
#     mutant and found it does not: 16 of 25 mutants are killed by the witness with
#     u[0] changed as well (a mutant on the box check of u4, say, is indifferent to
#     u0). The witness names a pair, not a region, is true of the mutant whose
#     defect the coordinate touches. What the control asserts is therefore what is
#     actually invariant: wherever the spoiled pair stops killing, BOTH scorers say
#     MISSED, reward 0, never SOLVED; wherever it still kills, both say SOLVED; and
#     the two never split. The first killable mutant (the sibling battery's victim)
#     must be among those where it stops.
victims = [next(m for m in mutants if m["witness"])] + rng.sample([m for m in mutants if m["witness"]], 24)
stopped, still, split, other = [], [], [], []
for m in victims:
    u = list(m["witness"]["u"])
    u[0] = 0 if u[0] != 0 else 1
    reply = json.dumps({"verdict": "KILL", "pairs": [{"u": u, "v": m["witness"]["v"]}]})
    i, a, g, _ = three_ways(*found[m["id"]], reply)
    if not (i == a == g):
        split.append((m["id"], i, a, g))
    elif i["outcome"] == "MISSED" and i["reward"] == 0.0:
        stopped.append(m["id"])
    elif i["outcome"] == "SOLVED" and i["reward"] == 1.0:
        still.append(m["id"])
    else:
        other.append((m["id"], i))
red(not split and not other and victims[0]["id"] in stopped and len(stopped) >= 1,
    f"a witness with one coordinate changed stops killing under BOTH scorers — MISSED, reward 0, never SOLVED — on "
    f"{len(stopped)} of {len(victims)} killable mutants (the first killable among them); on the other {len(still)} the "
    "spoiled pair still kills and both say SOLVED; the two scorers never split",
    f"split: {split[:2]}; other: {other[:2]}" if (split or other) else f"stopped: {stopped}")

# (b) a verdict buried in reasoning under a final UNDECIDED grades UNDECIDED; the raw rendering would not
m0 = victims[0]
parts = [ContentReasoning(reasoning=truthful(m0)), ContentText(text='{"verdict": "UNDECIDED"}')]
s = inspect_score(*found[m0["id"]], parts)
raw_text = _reply_text([ChatMessageAssistant(content=parts)])          # `<think>…</think>` + the text
raw = api.score(*found[m0["id"]], raw_text)
red(s.metadata["outcome"] == "UNDECIDED" and s.value["reward"] == 0.0 and raw["outcome"] == "UNDECIDED"
    and "<think>" in raw_text and api.parse_reply(raw_text)["verdict"] == "UNDECIDED",
    "a killing verdict inside a reasoning block under a final UNDECIDED grades UNDECIDED (text parts only); the "
    "parser takes the LAST verdict so even the raw rendering reads UNDECIDED — the filter guards the other order",
    f"mutant {m0['id']}")
parts2 = [ContentText(text='{"verdict": "UNDECIDED"}'), ContentReasoning(reasoning=truthful(m0))]
s2 = inspect_score(*found[m0["id"]], parts2)
raw2 = api.score(*found[m0["id"]], _reply_text([ChatMessageAssistant(content=parts2)]))
red(s2.metadata["outcome"] == "UNDECIDED" and raw2["outcome"] == "SOLVED",
    "…and with the reasoning AFTER the text, the raw rendering would have scored the buried KILL as SOLVED while "
    "the Inspect scorer still reads UNDECIDED — the text-only filter is load-bearing",
    f"raw: {raw2['outcome']}, inspect: {s2.metadata['outcome']}")

# ------------------------------------------- 6 · the recorded eval logs, re-scored
from inspect_ai.log import read_eval_log                                # noqa: E402
logs = sorted(glob.glob(os.path.join(HERE, "logs", "*.json")))
n_rows = n_dis = 0
for f in logs:
    log = read_eval_log(f)
    for smp in log.samples or []:
        sc = smp.scores.get("exact_verifier")
        if sc is None:
            continue
        n_rows += 1
        text = "".join(m.text if not isinstance(m.content, str) else m.content
                       for m in smp.messages if m.role == "assistant")
        mine = api.score(int(smp.metadata["seed"]), int(smp.metadata["index"]), text)
        if abs(float(sc.value["reward"]) - float(mine["reward"])) > 1e-9 or sc.metadata.get("outcome") != mine["outcome"]:
            n_dis += 1
report(bool(logs) and n_dis == 0 and n_rows > 0,
       f"the {n_rows} recorded rollouts in {len(logs)} Inspect log(s) re-score offline to the reward and outcome "
       "Inspect wrote", f"{n_dis} disagreed" if n_dis else "0 disagreements")

# --------------------------------------------------- 7 · the ledger and its pins
L = json.load(open(LEDGER)) if os.path.exists(LEDGER) else None
report(L is not None, "certs/blind-spot-inspect-ledger.json exists (python3 environments/blind_spot/inspect/ledger.py)")
if L:
    moved = [p for p, h in L["pins"].items() if not os.path.exists(os.path.join(ROOT, p)) or sha(os.path.join(ROOT, p)) != h]
    report(not moved, f"the ledger's {len(L['pins'])} pins (task.py, baselines.json, every log) re-hash to their values",
           "moved: " + ", ".join(moved) if moved else "")
    from ledger import summarize_log                                    # noqa: E402
    off = []
    for row in L["runs"]:
        fresh = summarize_log(os.path.join(ROOT, row["log"]))
        for k in ("n", "solved", "wrong", "missed", "undecided", "refused_parse", "false_claims", "out_of_box_kills"):
            if fresh["totals"][k] != row["totals"][k]:
                off.append((row["log"], k, fresh["totals"][k], row["totals"][k]))
    report(not off, f"the ledger's counts for {len(L['runs'])} run(s) re-derive from the logs", f"off: {off[:3]}" if off else "")
    readme = open(os.path.join(HERE, "README.md")).read()
    quoted = [q for q in L.get("readme_must_quote", [])]
    absent = [q for q in quoted if q not in readme]
    report(not absent, f"the README quotes the ledger: {len(quoted)} ledger strings found",
           "absent: " + "; ".join(absent) if absent else "")
    B = json.load(open(os.path.join(ENV, "baselines.json")))
    regraded_off = []
    for at in B["attempts"]:
        if at.get("reply") is None:
            continue
        s_, i_ = at["task_id"].split("-")
        g = api.score(int(s_), int(i_), json.dumps(at["reply"]) if isinstance(at["reply"], dict) else at["reply"])
        if g["outcome"] != at.get("outcome") or float(g["reward"]) != float(at.get("reward", -9)):
            regraded_off.append(at["task_id"])
    report(not regraded_off, f"human baselines: {len(B['attempts'])} attempt(s) on file, every graded one re-grades "
           f"to its stored outcome; status: {B['status'][:8]}", f"moved: {regraded_off}" if regraded_off else "")
    red(api.score(T.DEFAULT_SEED, 0, json.dumps({"verdict": "KILL", "pairs": [{"u": [4] + [0] * 10, "v": [1] * 11}]}))["outcome"] == "REFUSED_PARSE",
        "a baseline reply with a coordinate no 3-bit pin can carry is REFUSED_PARSE, never masked to −4")

rec = {
    "what": "The Inspect binding of blind-spot re-derived on this machine: the three rung variants and the mixed task "
            "built, the Inspect scorer scored against api.score and taskset.grade on every pooled mutant, the "
            "spoiled-witness red control under both scorers, the recorded Inspect logs re-scored offline, the ledger's "
            "pins re-hashed.",
    "inspect_ai": inspect_ai.__version__,
    "mutants": len(mutants), "submissionsScoredThreeWays": n_sub, "disagreements": len(disagree),
    "falseClaimsTried": len(fc), "spoiledWitnesses": len(victims),
    "logs": [os.path.relpath(f, ROOT) for f in logs], "rolloutsRescored": n_rows, "rolloutDisagreements": n_dis,
    "mutantIndex": {str(k): v for k, v in sorted(found.items())},
    "redControls": {"fired": reds, "dead": dead},
    "verdict": "PASS" if not fails and not dead else "FAIL",
    "seconds": round(time.time() - t0, 1),
    "output": lines,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
strip = lambda d: json.dumps({k: v for k, v in d.items() if k != "seconds"}, sort_keys=True)
if os.path.exists(OUT):
    try:
        old = json.load(open(OUT))
        if strip(old) == strip(rec):
            rec = old
    except Exception:
        pass
json.dump(rec, open(OUT, "w"), indent=1, ensure_ascii=False)
print(f"# {len(fails)} FAIL · {reds} red controls fired, {dead} dead · {rec['seconds']}s"
      + ((": " + ", ".join(fails)) if fails else ""))
sys.exit(1 if fails or dead else 0)
