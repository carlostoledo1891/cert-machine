#!/usr/bin/env node
/* run-gym-record.js — measure the shipped environment and write certs/gym-record.json.
   Everything the gym page says is read from here, and this is produced by RUNNING
   the package (in Python, as a buyer would), never by describing it.
   usage: node tools/run-gym-record.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const PKG = path.join(ROOT, 'environments/break_the_grader');
const die = (m) => { console.error('GYM RECORD REFUSED: ' + m); process.exit(1); };

const PY = `
import json, sys
sys.path.insert(0, ${JSON.stringify(PKG)})
from collections import Counter
from fractions import Fraction as F
from break_the_grader.facts import FACTS, NAMED, EXACT_INTEGER, BY_ID
from break_the_grader.band import key_at, mint_attack, band_measure, tau_for_band
from break_the_grader.forgeries import gate
from break_the_grader.task import make_task, grade, render_prompt, RUNG_MIX
from break_the_grader.api import score
from break_the_grader.policies import POLICIES
from break_the_grader import __version__

N = 2000
mix = Counter(); rungMix = Counter(); attackable = 0; bands = []
for s in range(N):
    t = make_task(s)
    mix[t.grader.kind + "/" + t.rung] += 1
    rungMix[t.rung] += 1
    if t.attackable:
        attackable += 1
        assert grade(t, {"attack": t.witness})["score"] == 1
        bands.append(t.band)
    else:
        assert grade(t, {"verdict": "NO_ATTACK"})["score"] == 1

# THE BASELINE, from the SHIPPED policies — not from a definition written here.
# The page and the CLI's own baseline command must print the same
# numbers, which they can only do if there is one definition of each policy.
BN = 400
baseline = []
for name, policy in POLICIES.items():
    tally = Counter(); solved = Counter(); total = 0.0; false = 0
    for s in range(BN):
        t = make_task(s)
        r = score(s, policy(render_prompt(t)))
        total += r["reward"]; false += int(r["false_claim"])
        tally[t.rung] += 1; solved[t.rung] += 1 if r["reward"] >= 1 else 0
    baseline.append({"policy": name, "n": BN, "mean": total / BN,
                     "solved": sum(solved.values()) / BN, "falseClaims": false,
                     "byRung": {k: [solved[k], tally[k]] for k in tally}})
always = int(round(next(b["solved"] for b in baseline if b["policy"] == "always") * N))
never = int(round(next(b["solved"] for b in baseline if b["policy"] == "never") * N))

f = BY_ID["erdos1038.upper"]; w = f.width; k = key_at(f, F(1, 2))
dial = []
for target in ["20000000", "20000", "19", "1", "1/5", "1/50", "1/5000", "0"]:
    tgt = F(target); tau = tau_for_band(tgt); tol = tau * w
    a = mint_attack(f, k - tol, k + tol)
    dial.append({"tau": float(tau), "bandWidths": float(tgt),
                 "band": float(band_measure(f, k - tol, k + tol)),
                 "attack": a, "reachable": a is not None})

g = gate(range(256))
print(json.dumps({
    "version": __version__,
    "facts": len(FACTS), "named": len(NAMED), "exactIntegers": len(EXACT_INTEGER),
    "pinned": sum(1 for x in FACTS if x.sha256),
    "tasksSampled": N, "attackable": attackable,
    "mix": dict(mix), "rungMix": dict(rungMix), "dial": dial,
    "rungTargets": {name: edge for edge, name in RUNG_MIX},
    "baseline": baseline,
    "dialFact": {"id": f.id, "width": float(w)},
    "alwaysAttackSolves": always, "neverAttackSolves": never,
    "forgeries": {"planted": g["planted"], "leaked": g["leaked"]},
    "medianBand": sorted(bands)[len(bands)//2] if bands else None,
}))
`;
let out;
try { out = cp.execSync('python3 -', { input: PY, encoding: 'utf8', maxBuffer: 8e6 }); }
catch (e) { die('the package did not run: ' + String(e.stderr || e.message).slice(0, 400)); }
const R = JSON.parse(out);
if (R.forgeries.leaked !== 0) die('a forgery leaked — nothing may be published');
if (!(R.alwaysAttackSolves < R.tasksSampled) || !(R.neverAttackSolves < R.tasksSampled) || !(R.neverAttackSolves > 0))
  die('both standing answers no longer lose somewhere — the environment rewards a reflex');
R.meta = {
  date: new Date().toISOString().slice(0, 10),
  git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })()
};
fs.writeFileSync(path.join(ROOT, 'certs', 'gym-record.json'), JSON.stringify(R, null, 1) + '\n');
console.log('certs/gym-record.json written · ' + R.facts + ' facts · ' + R.tasksSampled + ' tasks sampled, '
  + R.attackable + ' attackable · always-attack ' + R.alwaysAttackSolves + ', never-attack ' + R.neverAttackSolves
  + ' · ' + R.forgeries.planted + ' forgeries, ' + R.forgeries.leaked + ' leaked');
