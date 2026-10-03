#!/usr/bin/env python3
"""environments/certified_mathbench/battery.py — the gate on the certified-mathbench environment. Stdlib only;
runs on the system interpreter with no framework present.

    python3 environments/certified_mathbench/battery.py          the gate
    python3 environments/certified_mathbench/battery.py --pin    record the pins (after a deliberate change)

WHAT IT HOLDS. (1) THE GRADER IS THE REPOSITORY'S: the package reads instruments/mathbench/families.py and
tools/llm_harness_base.py — the same files the v0 battery, the eval harness and the report read — and this
battery pins both, plus every file of the package, by sha256 in PROVENANCE.json; a wheel built from a tree that
drifted from its pins would carry a grader the record does not describe. (2) THE FORGERY GATE: 28 green controls
certify, 20 red controls refute, through the package's own `preflight`. (3) THE LADDER: 46 rungs, 5 beyond the
record, in the families' order. (4) THE OUTCOMES: prose is malformed, a forged ruler is refuted, the right object
at a higher rung is rejected, the optimal ruler is certified. (5) THE BINDING, when the framework venv exists:
tests/ under environments/blind_spot/.venv (verifiers 0.3.1); skipped with a line when it does not — a gate
measures, it never refuses a direction. RED CONTROLS: a tampered families.py is caught by its pin; a forged reply
is refuted; a certified object submitted one rung up is not certified.

Prints: "certified-mathbench battery: N pass, 0 fail, R/R red controls fired"."""
import hashlib
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from certified_mathbench import api  # noqa: E402

PIN = os.path.join(HERE, "PROVENANCE.json")
PINNED = ["instruments/mathbench/families.py", "tools/llm_harness_base.py", "tools/verify_sumdiff.py",
          "corpus/optimization-constants/mi2026/c3b_pr92/certificate_3b_13pt.json",
          "environments/certified_mathbench/certified_mathbench/__init__.py",
          "environments/certified_mathbench/certified_mathbench/api.py",
          "environments/certified_mathbench/certified_mathbench/adapters_v0.py",
          "environments/certified_mathbench/certified_mathbench/cli.py",
          "environments/certified_mathbench/pyproject.toml"]
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


def sha(p):
    return hashlib.sha256(open(os.path.join(ROOT, p), "rb").read()).hexdigest()


if "--pin" in sys.argv:
    json.dump({"what": "The pins of the certified-mathbench environment: the two repository files the wheel carries byte-identical (the seven families and the Family/Verdict types) and the package's own files. Re-hashed by battery.py at every build; --pin records a deliberate change.",
               "pins": {p: sha(p) for p in PINNED}}, open(PIN, "w"), indent=1)
    print("pinned", len(PINNED), "files")
    sys.exit(0)

# 1 · the pins
pins = json.load(open(PIN))["pins"] if os.path.exists(PIN) else None
ok(pins is not None, "PROVENANCE.json exists (run --pin once)")
if pins:
    for p in PINNED:
        ok(pins.get(p) == sha(p), "pin holds: " + p)
    ok(os.path.relpath(api.families_source(), ROOT) == "instruments/mathbench/families.py", "the package reads the repository's families.py")
    red(hashlib.sha256((open(os.path.join(ROOT, PINNED[0]), "rb").read() + b"\n# tampered\n")).hexdigest() != pins[PINNED[0]], "a tampered families.py is caught by its pin")

# 2 · the forgery gate
g = api.preflight()
ok(g["green"] == 28 and g["red"] == 20 and not g["failed"], f"preflight: {g['green']} green certified, {g['red']} red refuted")

# 3 · the ladder
R = api.rungs()
ok(len(R) == 46 and sum(r["beyond"] for r in R) == 5, "46 rungs, 5 beyond the record")
ok([r["family"] for r in R] == [n for n, f in api._bench().items() for _ in f.LADDER], "the ladder is in the families' order")

# 4 · the outcomes
gol = api._bench()["golomb"]
i13 = next(r["rung_index"] for r in (api.task_row(i) for i in range(46)) if r["label"] == "golomb (13, 106)")
good, bad = gol.green_controls((13, 106))[0], gol.red_controls((13, 106))[0]
ok(api.score(i13, json.dumps(list(good)))["outcome"] == "certified", "the optimal 13-mark ruler is certified")
red(api.score(i13, json.dumps(list(bad)))["outcome"] == "refuted", "a ruler with one repeated difference is refuted")
ok(api.score(i13, "around 106, I think")["outcome"] == "malformed", "prose is malformed, not refuted")
d4 = api._bench()["kissing"].green_controls((4, 24))[0]
red(api.grade_object("kissing", (4, 25), d4)["outcome"] == "rejected", "D4's 24 roots asked for 25 are rejected, never certified")
base = api.baseline_table()
ok(0 < sum(r["outcome"] == "certified" for r in base) < len(base) and not any(r["beyond"] and r["outcome"] == "certified" for r in base),
   "the baseline certifies some rungs and no rung beyond the record")

# 5 · the binding, when the framework is here
venv = os.path.join(ROOT, "environments", "blind_spot", ".venv", "bin", "python")
if os.path.exists(venv):
    r = subprocess.run([venv, "-m", "pytest", "-q", os.path.join(HERE, "tests")], capture_output=True, text=True, cwd=HERE)
    ok(r.returncode == 0, "tests/ under the framework venv: " + (r.stdout.strip().splitlines() or ["?"])[-1])
else:
    print("note: environments/blind_spot/.venv absent — the verifiers binding was not exercised in this run", file=sys.stderr)

print(f"certified-mathbench battery: {passed} pass, {failed} fail, {fired}/{reds} red controls fired")
sys.exit(1 if failed or fired != reds else 0)
