#!/usr/bin/env python3
"""environments/verify_gym/battery.py: the gate on the verify-gym environment. Stdlib only (and node for the
second decider); runs on the system interpreter with no framework present.

    python3 environments/verify_gym/battery.py          the gate (~30 s on Python 3.9)
    python3 environments/verify_gym/battery.py --pin    record the pins after a deliberate change

WHAT IT HOLDS. (1) THE TWO DECIDERS AND THE CURRICULUM ARE PINNED: exact.py and check.js by sha256, and every
curriculum family, stage and held-out entry by the sha256 of its canonical JSON. A listed entry that changes, or
one that disappears, refuses; a new entry may only APPEND. (2) THE CODE AGREES WITH THE CURRICULUM: cap, limit
and version per family, the registry's order, and check.js decides every registered family (one decider is not
enough to add a family). (3) THE HELD-OUT SET IS THE PRE-REGISTERED ONE: its sha256, every row regenerated from
its stream and its prompt rendered unchanged, the training and validation pools disjoint from it by key.
(4) THE SCORECARD RE-DERIVES: certs/verify-gym-scorecard.json equals a fresh run (the gate on all 120 held-out rows,
five policies, every answer and forgery decided twice with 0 disagreements). (5) THE TESTS, under this
interpreter, and the framework binding under a venv with `verifiers` when one exists.

RED CONTROLS. The gate must FAIL under a grader that accepts everything, one that rejects everything, and one with
the xx comparison flipped; the cross-check must catch a forged Python result; a tampered curriculum entry and a
tampered decider must each be caught by their pins.

Prints: "verify-gym battery: N pass, 0 fail, R/R red controls fired"."""
import hashlib
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from verify_gym import api, exact  # noqa: E402
from verify_gym.families import REGISTRY  # noqa: E402
from verify_gym.forgeries import gate  # noqa: E402
from verify_gym.task import make_row, render_prompt  # noqa: E402
import crosscheck  # noqa: E402
import scorecard  # noqa: E402

PIN = os.path.join(HERE, "PROVENANCE.json")
FILES = ["environments/verify_gym/verify_gym/exact.py", "environments/verify_gym/check.js"]
passed = failed = reds = fired = 0


def ok(cond, name):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print("FAIL " + name, file=sys.stderr)


def red(cond, name):
    global reds, fired
    reds += 1
    if cond:
        fired += 1
    else:
        print("RED CONTROL DID NOT FIRE: " + name, file=sys.stderr)


def sha_file(p):
    return hashlib.sha256(open(os.path.join(ROOT, p), "rb").read()).hexdigest()


def sha_obj(o):
    return hashlib.sha256(json.dumps(o, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


def entries(cur):
    return {"families": [(e["id"], sha_obj(e)) for e in cur["families"]],
            "stages": [(e["id"], sha_obj(e)) for e in cur["stages"]],
            "heldout": [(e["version"], sha_obj(e)) for e in cur["heldout"]]}


def append_only(pinned, now):
    """every pinned entry still there, unchanged, in its place; anything new comes after"""
    for k in ("families", "stages", "heldout"):
        old, cur = [tuple(x) for x in pinned[k]], [tuple(x) for x in now[k]]
        if cur[:len(old)] != old:
            return False, k
    return True, None


cur = api.curriculum()
if "--pin" in sys.argv:
    json.dump({"what": "verify-gym pins: the two deciders by sha256, and every curriculum entry (family, stage, "
                       "held-out set) by the sha256 of its canonical JSON. battery.py refuses a listed entry that "
                       "changes or disappears; new entries append. --pin records a deliberate change.",
               "files": {p: sha_file(p) for p in FILES}, **entries(cur)}, open(PIN, "w"), indent=1)
    print("pinned %d files and %d curriculum entries" % (len(FILES), sum(len(v) for v in entries(cur).values())))
    sys.exit(0)

# 1 · pins and append-only
pins = json.load(open(PIN)) if os.path.exists(PIN) else None
ok(pins is not None, "PROVENANCE.json exists (run --pin once)")
if pins:
    for p in FILES:
        ok(pins["files"].get(p) == sha_file(p), "pin holds: " + p)
    good, where = append_only(pins, entries(cur))
    ok(good, "the curriculum is append-only (%s)" % (where or "families, stages, held-out"))
    tampered = json.loads(json.dumps(cur))
    tampered["families"][0]["cap"] += 1
    red(not append_only(pins, entries(tampered))[0], "a listed family whose cap changed is caught")
    dropped = json.loads(json.dumps(cur))
    dropped["heldout"] = []
    red(not append_only(pins, entries(dropped))[0], "a held-out entry that disappears is caught")
    raw = open(os.path.join(ROOT, FILES[0]), "rb").read() + b"\n# tampered\n"
    red(hashlib.sha256(raw).hexdigest() != pins["files"][FILES[0]], "a tampered exact.py is caught by its pin")

# 2 · the code and the curriculum agree
ok([e["id"] for e in cur["families"]] == list(REGISTRY), "the registry is the curriculum's families, in order")
for e in cur["families"]:
    F = REGISTRY[e["id"]]
    ok(e["cap"] == F.cap and 10 ** e["limit_digits"] == F.limit and e["version"] == F.version,
       "cap, limit and version agree for " + e["id"])
_, js_families = crosscheck.js([])
ok(set(REGISTRY) <= set(js_families), "check.js decides every registered family")

# 3 · the held-out set
h = next(x for x in cur["heldout"] if x["version"] == "v0")
ok(h["sha256"] == "789cead61a5cb4612589b511562d9a6bfb4fe7d2b7dd2dcfc80b94193e71978d",
   "the held-out sha256 is the pre-registration's")
rows = api.heldout("v0")
ok(len(rows) == 120, "120 held-out tasks")
ok(all(make_row(*r["id"].split("/")[:2], int(r["id"].split("/")[2])) == r for r in rows),
   "every held-out row regenerates from its stream")
ok(all(render_prompt(r) == r["prompt"] for r in rows), "every frozen prompt renders unchanged")
hk = api.heldout_keys()
ok(all(api.family_pool_row(f, s, i)["key"] not in hk for f in REGISTRY for s in ("train", "val") for i in range(200)),
   "the train and val pools are disjoint from the held-out set (200 per family each)")

# 4 · the gate's red controls, then the scorecard
small = [api.family_train_row(f, i) for f in REGISTRY for i in range(2)]
ok(gate(rows=small)["ok"], "the gate is green on the first training rows")
red(not gate(rows=small, grade_fn=lambda r, s: {"verdict": "CERTIFIED", "reward": 1.0})["ok"],
    "the gate fails under a grader that accepts everything")
red(not gate(rows=small, grade_fn=lambda r, s: {"verdict": "MALFORMED", "reward": 0.0})["ok"],
    "the gate fails under a grader that rejects everything")
orig = exact._xx_cmp
exact._xx_cmp = lambda N, p, q: -orig(N, p, q)
try:
    red(not gate(rows=[r for r in small if r["family"] == "xx"])["ok"], "the gate fails with the xx comparison flipped")
finally:
    exact._xx_cmp = orig

from verify_gym.policies import cf  # noqa: E402
from verify_gym.task import grade, parse  # noqa: E402
r0 = small[0]
lo, hi, _ = parse(cf(r0["prompt"]))
g0 = dict(grade(r0, cf(r0["prompt"])))
g0["progress"] += 1
n, bad = crosscheck.compare({"forged": g0}, [crosscheck.item("forged", r0, lo, hi)])
red(len(bad) == 1, "the cross-check catches a forged Python result")

try:
    doc = scorecard.build()
    old = json.load(open(scorecard.OUT))
    doc["models"] = old.get("models", [])
    ok(scorecard.dump(doc) == open(scorecard.OUT).read(),
       "certs/verify-gym-scorecard.json re-derives (gate %d planted / 0 leaked, %d answers decided twice)"
       % (doc["gate"]["planted"], doc["crosscheck"]["answers_compared"]))
except SystemExit as e:
    ok(False, str(e))
    doc = None

# the README quotes the record, never the other way round
readme = open(os.path.join(HERE, "README.md"), encoding="utf-8").read()
rec = json.load(open(scorecard.OUT))
for p in rec["policies"]:
    line = next((l for l in readme.splitlines() if l.startswith("| `%s`" % p["id"])), "")
    v, bf = p["verdicts"], p["by_family"]
    want = ["%.3f" % p["mean_reward"]] + ["%.3f" % bf[f]["mean_reward"] for f in ("xx", "kroot", "poly")] + \
           [str(v["CERTIFIED"]), str(v["REFUTED"]), str(v["MALFORMED"])]
    cells = [c.strip() for c in line.strip("|").split("|")][1:]
    ok(cells == want, "the README's row for %s is the scorecard's" % p["id"])
g = rec["gate"]
ok("%d forgeries planted on %d rows · %d leaked · %d misfiled · %d green controls" % (
    g["planted"], g["rows"], g["leaked"], g["misfiled"], g["green"]) in readme, "the README's gate line is the record's")
ok("{:,} answers".format(rec["crosscheck"]["answers_compared"]) in readme, "the README's cross-check count is the record's")

# 5 · the tests
try:
    import pytest  # noqa: F401
    t = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", os.path.join(HERE, "tests")],
                       capture_output=True, text=True, cwd=HERE)
    ok(t.returncode == 0, "tests/: " + ((t.stdout.strip().splitlines() or ["?"])[-1]))
except ImportError:
    print("note: pytest absent under %s; tests/ not run" % sys.executable, file=sys.stderr)
venv = os.environ.get("VERIFY_GYM_VENV") or os.path.join(ROOT, "environments", "blind_spot", ".venv")
vpy = os.path.join(venv, "bin", "python")
if os.path.exists(vpy):
    t = subprocess.run([vpy, "-m", "pytest", "-q", "-p", "no:cacheprovider", os.path.join(HERE, "tests")],
                       capture_output=True, text=True, cwd=HERE)
    ok(t.returncode == 0, "tests/ under the framework venv: " + ((t.stdout.strip().splitlines() or ["?"])[-1]))
else:
    print("note: no framework venv (VERIFY_GYM_VENV or environments/blind_spot/.venv); the verifiers binding was not "
          "exercised in this run", file=sys.stderr)

print("verify-gym battery: %d pass, %d fail, %d/%d red controls fired" % (passed, failed, fired, reds))
sys.exit(1 if failed or fired != reds else 0)
