#!/usr/bin/env python3
"""instruments/mathbench/battery.py — Certified MathBench v0's families, gated before any model sees them.

For every family and every rung: each green control (a witness on record) must CERTIFY; each red control (a
near-miss forged from a witness by the smallest breaking change) must come back REFUTED, never certified; the
parser must refuse prose, floats and wrong shapes rather than guess; and the whole harness must run end to end
on its offline proposer with the controls it runs before any model call. Stdlib only.

Prints: "mathbench battery: N pass, 0 fail, R/R red controls fired". """
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
sys.path.insert(0, HERE)
from families import BENCH  # noqa: E402

passed = failed = reds = fired = 0


def ok(cond, name):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print('FAIL ' + name, file=sys.stderr)


def red(cond, name):
    global reds, fired, passed, failed
    reds += 1
    if cond:
        fired += 1
        passed += 1
    else:
        failed += 1
        print('RED DID NOT FIRE ' + name, file=sys.stderr)


greens_total = 0
for name, F in BENCH.items():
    f = F()
    rungs = f.LADDER
    ok(len(rungs) >= 5, f'{name}: a ladder of at least five rungs ({len(rungs)})')
    g_here = r_here = 0
    for t in rungs:
        for g in f.green_controls(t):
            v = f.certify(g, t)
            g_here += 1
            ok(v is not None and v.holds and f.interesting(g, t), f'{name} {t}: the green control certifies ({v.witness if v else None})')
        for b in f.red_controls(t):
            v = f.certify(b, t)
            r_here += 1
            red(v is not None and not v.holds, f'{name} {t}: the forged near-miss is REFUTED, never certified ({v.witness if v else None})')
    greens_total += g_here
    ok(g_here >= 2 and r_here >= 1, f'{name}: at least two rungs with a witness on record and one forged near-miss ({g_here} green, {r_here} red)')
    # the parser refuses rather than guesses
    t0 = rungs[0]
    ok(f.parse('I believe the answer exists but I cannot write it down.') is None, f'{name}: prose parses to nothing')
    ok(f.parse('[[0.5, 1.5], [2.0, 3.0]]') is None, f'{name}: floats are refused at the parser')

# the harness, end to end, offline: controls first, then every family graded from its fake proposer
with tempfile.TemporaryDirectory() as tmp:
    for name in BENCH:
        led = os.path.join(tmp, name + '.jsonl')
        p = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'llm-harness.py'), '--dry-run', '--family', name, '--n', '8', '--ledger', led],
                           capture_output=True, text=True)
        rows = [json.loads(l) for l in open(led)] if os.path.exists(led) else []
        ok(p.returncode == 0 and len(rows) == 8 and 'red controls:' in p.stderr and all(r['outcome'] in ('certified', 'refuted', 'rejected', 'malformed', 'undecided') for r in rows),
           f'{name}: the harness runs offline, red and green controls first, 8 rows graded ({p.returncode}, {len(rows)} rows)')

print(f'mathbench battery: {passed} pass, {failed} fail, {fired}/{reds} red controls fired  ({len(BENCH)} families, {greens_total} green controls)')
sys.exit(1 if failed else 0)
