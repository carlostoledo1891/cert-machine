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
interpreter, and the framework binding under a venv with `verifiers` when one exists. (6) THE RE-CHECK AND THE
READINESS GATE: recheck.py agrees with an honest training log; readiness.py's dry run on the 100 val tasks x 8
says GO for `mix`; the live path runs end to end against a local OpenAI-compatible stand-in (no spend): settings
in every request, the key never written, truncated replies paid 0, a failed call stops with no verdict and the
re-run resumes, and the stored log re-checks.

RED CONTROLS. The gate must FAIL under a grader that accepts everything, one that rejects everything, and one with
the xx comparison flipped; the cross-check must catch a forged Python result; a tampered curriculum entry and a
tampered decider must each be caught by their pins. recheck.py must refuse a REFUTED answer paid 1, a certified one
paid a step too much, a reward no answer earns, a paid reply with no answer, a paid truncated reply, a held-out
task in a training log, and a split between the deciders; readiness.py must say NO-GO to `cf` and `never` and
refuse when the deciders split.

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
    doc["models"] = [scorecard.model_row(os.path.join(ROOT, os.path.dirname(m["log"]["file"])))
                     for m in old.get("models", [])]           # every model row re-graded from its stored replies
    ok(scorecard.dump(doc) == open(scorecard.OUT).read(),
       "certs/verify-gym-scorecard.json re-derives (gate %d planted / 0 leaked, %d answers decided twice, %d model "
       "rows re-graded from their stored replies)"
       % (doc["gate"]["planted"], doc["crosscheck"]["answers_compared"], len(doc["models"])))
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

# 6 · the two protocol steps built after v0: the re-check of a run's paid samples, and the readiness gate
import readiness  # noqa: E402
import recheck  # noqa: E402
import tempfile  # noqa: E402
import threading  # noqa: E402
from http.server import BaseHTTPRequestHandler, HTTPServer  # noqa: E402
from verify_gym import rollouts  # noqa: E402
from verify_gym.forgeries import plant  # noqa: E402
from verify_gym.policies import POLICIES  # noqa: E402

train = api.train_sample(9)                              # a training log: 9 stage rows x the five policies
log = [rollouts.sample(r["id"], POLICIES[n](r["prompt"]), api.score(r["id"], POLICIES[n](r["prompt"]))["reward"],
                       sample=k) for r in train for k, n in enumerate(POLICIES)]
head = rollouts.header("train", run="battery")
rc = recheck.recheck_text(rollouts.dumps(head, log))
ok(rc["verdict"] == "AGREES" and rc["paid"] > 0 and rc["rechecked"] == rc["paid"],
   "recheck: an honest training log AGREES (%s paid, all re-decided by check.js)" % rc.get("paid"))


def forged(edit):
    rows_ = [dict(s) for s in log]
    edit(rows_)
    return recheck.recheck_text(rollouts.dumps(head, rows_))["verdict"] == "REFUSED"


wrong = next(f for f in plant(train[0]) if f[2] == exact.REFUTED)          # a side on the wrong side of the root
red(forged(lambda L: L.append(rollouts.sample(train[0]["id"], wrong[1], 1.0, sample=9))),
    "recheck refuses a log that paid a REFUTED answer (reward forged up to 1)")
paid = next(i for i, s in enumerate(log) if 0 < s["reward"] < 1)
cap0 = api.row(log[paid]["task_id"])["cap"]
red(forged(lambda L: L[paid].update(reward=L[paid]["reward"] + 1 / cap0)),
    "recheck refuses a certified answer whose reward was forged up by one step")
red(forged(lambda L: L[paid].update(reward=round(L[paid]["reward"] + 0.01, 6))),
    "recheck refuses a reward no answer of this environment can earn")
red(forged(lambda L: L.append(rollouts.sample(train[0]["id"], POLICIES["never"](""), 0.5, sample=9))),
    "recheck refuses a paid reply with no answer in it")
red(forged(lambda L: L[paid].update(finish_reason="length")), "recheck refuses a paid reply the caller truncated")
red(forged(lambda L: L.append(rollouts.sample("xx/heldout/0", "", 0.0, sample=0))),
    "recheck refuses a held-out task in a training log")
orig_grade = recheck.grade
recheck.grade = lambda r, reply: dict(orig_grade(r, reply), progress=orig_grade(r, reply)["progress"] + 1)
try:
    red(recheck.recheck_text(rollouts.dumps(head, log))["verdict"] == "REFUSED",
        "recheck refuses when the two deciders split (a forged Python grade)")
finally:
    recheck.grade = orig_grade

dry = {n: readiness.run(lambda r, k, n=n: readiness.policy_reply(n, r, k), {"dry_run": n, "model": None})
       for n in ("mix", "cf", "never")}
m = dry["mix"][0]
ok(m["verdict"] == "GO" and m["n_tasks"] == 100 and m["samples"] == 8 and m["groups"] == 100,
   "readiness dry run (mix, 100 val tasks x 8): GO, %s groups not all equal, mean %s" % (
       m["groups_not_all_equal"], m["mean_reward"]))
ok([r["task_id"] for r in rollouts.loads(dry["mix"][1])[1]][::8] == [r["id"] for r in readiness.tasks()] and
   readiness.tasks()[:3] == [api.family_pool_row(f, "val", 0) for f in ("xx", "kroot", "poly")],
   "readiness: the 100 tasks are the first 100 of the val rotation, 8 samples each, in order")
red(dry["cf"][0]["verdict"] == "NO-GO" and dry["cf"][0]["conditions"] == {"spread": False, "mean": False},
    "readiness says NO-GO to a policy whose groups are uniform and whose mean is above 0.80 (cf)")
red(dry["never"][0]["verdict"] == "NO-GO" and dry["never"][0]["conditions"] == {"spread": False, "mean": False},
    "readiness says NO-GO to a policy that never answers")
ok(recheck.recheck_text(dry["mix"][1])["verdict"] == "AGREES", "recheck AGREES with the readiness dry run's own log")
ok(readiness.run(lambda r, k: readiness.policy_reply("mix", r, k), {"dry_run": "mix", "model": None},
                 n_tasks=3)[0]["verdict"] == "NOT THE PROTOCOL", "readiness on 3 tasks is NOT THE PROTOCOL")
orig_rgrade = readiness.grade
readiness.grade = lambda r, reply: (lambda g: dict(g, progress=g["progress"] + 1)
                                    if g["verdict"] == exact.CERTIFIED else g)(orig_rgrade(r, reply))
try:
    readiness.run(lambda r, k: readiness.policy_reply("mix", r, k), {"dry_run": "mix", "model": None}, n_tasks=3)
    red(False, "readiness refuses when the two deciders split")
except SystemExit:
    red(True, "readiness refuses when the two deciders split")
finally:
    readiness.grade = orig_rgrade

# the live path, end to end, against a local OpenAI-compatible stand-in (no spend): every fourth seed comes back
# truncated with a valid answer in it, which must be paid 0; the key travels in the header, never in the record
seen = []


class Stub(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["content-length"])))
        seen.append((self.path, self.headers.get("authorization"), body))
        prompt = body["messages"][0]["content"]
        reply = POLICIES["cf" if body["seed"] % 2 else "float"](prompt)
        out = json.dumps({"choices": [{"message": {"role": "assistant", "content": "thinking...\n" + reply},
                                       "finish_reason": "length" if body["seed"] % 4 == 0 else "stop"}]}).encode()
        self.send_response(200)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)

    def log_message(self, *a):
        pass


srv = HTTPServer(("127.0.0.1", 0), Stub)
threading.Thread(target=srv.serve_forever, daemon=True).start()
os.environ["VERIFY_GYM_BATTERY_KEY"] = "battery-key"
cfg = {"endpoint": "http://127.0.0.1:%d/v1" % srv.server_port, "model": "stub", "max_tokens": 64,
       "temperature": 1.0, "top_p": 1.0, "extra_body": {"chat_template_kwargs": {"enable_thinking": False}},
       "api_key_env": "VERIFY_GYM_BATTERY_KEY", "timeout": 30}
settings = {"dry_run": None, "model": "stub", "endpoint": cfg["endpoint"]}
with tempfile.TemporaryDirectory() as tmp:
    asked = [0]

    def flaky(r, k):                                    # the endpoint dies after 7 samples: the run stops, keeps them
        asked[0] += 1
        if asked[0] > 7:
            raise RuntimeError("the stand-in went away")
        return readiness.endpoint_reply(cfg, r, k)
    try:
        readiness.run(flaky, settings, n_tasks=4, samples=4, out=tmp)
        stopped = False
    except RuntimeError:
        stopped = True
    kept = len(rollouts.loads(open(os.path.join(tmp, "rollouts.partial.jsonl")).read())[1])
    ok(stopped and kept == 7 and not os.path.exists(os.path.join(tmp, "readiness.json")),
       "readiness (live path): a failed call stops the run with no verdict and keeps the 7 samples it had")
    before = len(seen)
    s, text = readiness.run(lambda r, k: readiness.endpoint_reply(cfg, r, k), settings, n_tasks=4, samples=4,
                            out=tmp, workers=3)
    samples = rollouts.loads(text)[1]
    trunc = [x for x in samples if x["finish_reason"] == "length"]
    ok(len(seen) - before == 16 - 7, "readiness (live path): the re-run resumes, asking only the 9 missing samples")
    ok(s["verdict"] == "NOT THE PROTOCOL" and len(samples) == 16 and s["truncated"] == len(trunc) > 0 and
       all(x["reward"] == 0 and parse(x["reply"])[0] is not None for x in trunc),
       "readiness (live path): %d truncated replies with an answer in them are paid 0 and counted" % len(trunc))
    ok(all(p == "/v1/chat/completions" and a == "Bearer battery-key" and b["temperature"] == 1.0 and
           b["top_p"] == 1.0 and b["max_tokens"] == 64 and b["chat_template_kwargs"] == {"enable_thinking": False}
           for p, a, b in seen) and "battery-key" not in open(os.path.join(tmp, "rollouts.jsonl")).read() +
       open(os.path.join(tmp, "readiness.json")).read(),
       "readiness (live path): the settings reach every request; the key is sent and never written")
    ok(s["log"]["sha256"] == hashlib.sha256(open(os.path.join(tmp, "rollouts.jsonl"), "rb").read()).hexdigest() and
       not os.path.exists(os.path.join(tmp, "rollouts.partial.jsonl")),
       "readiness (live path): readiness.json names the stored log's sha256")
    ok(recheck.main([os.path.join(tmp, "rollouts.jsonl")]) == 0, "recheck AGREES with the live path's log")
srv.shutdown()

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
