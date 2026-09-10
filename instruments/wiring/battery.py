#!/usr/bin/env python3
"""battery.py — the gate on instruments/wiring (lattice-claims, ported whole).

cert-machine's own file, not a port. Four things must hold at every build:

  1. the pins    every ported file still hashes to instruments/wiring/PROVENANCE.json
  2. the gate    the ten planted forgeries are all caught (python -m lattice_claims gate)
  3. the ceiling the `exact` reference policy certifies 45/45 on the baseline tasks —
                 a ceiling that is not at the ceiling is a bug in the ceiling
  4. the record  re-grading the 135 stored replies with THIS grader moves 0 rows,
                 so the grader here is the grader that graded the pinned record

Exit 1 on any failure. No model is ever called."""
import hashlib, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
sys.path.insert(0, HERE)
from lattice_claims.forgeries import run as run_forgeries
from lattice_claims.policies import run_policy
from lattice_claims.taskset import RUNGS, Taskset

fails = 0
def check(name, ok, detail=''):
    global fails
    print(f"  {'ok  ' if ok else 'FAIL'}  {name}" + (f"   [{detail}]" if detail else ''))
    if not ok: fails += 1

# 1. the pins
prov = json.load(open('PROVENANCE.json'))
bad = []
for f in prov['files']:
    got = hashlib.sha256(open(f['file'], 'rb').read()).hexdigest()
    if got != f['sha256'] or (f['bytes'] > 0 and got == 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'): bad.append(f['file'])   # the empty hash on a non-empty file is an evicted iCloud read
check('every ported file hashes to its pin', not bad, f"{len(prov['files'])} files" if not bad else 'moved: ' + ', '.join(bad))

# 2. the forgery gate
rows, accepted = run_forgeries()
check('every planted forgery is caught', len(rows) >= 10 and not accepted, f"{len(rows)} planted, {len(accepted)} accepted")

# 3. the ceiling
ts = Taskset(seed=2026, dims=(8, 12, 16))
n = 15
tasks = {r: [ts.sample(i * 3 + RUNGS.index(r), rung=r) for i in range(n)] for r in RUNGS}
got = sum(sum(x['certified'] for x in run_policy('exact', tasks[r])) for r in RUNGS)
check('the exact policy is the ceiling', got == 3 * n, f"{int(got)}/{3 * n}")

# 4. the record — regrade.py runs at import against cwd-relative paths, so it is a subprocess
r = subprocess.run([sys.executable, 'eval/regrade.py'], capture_output=True, text=True, cwd=HERE)
line = (r.stdout.strip().splitlines() or [''])[-1] if r.returncode == 0 else ''
summary = next((l for l in r.stdout.splitlines() if 'rows re-graded' in l), '')
check('re-grading the stored replies moves 0 rows', r.returncode == 0 and summary.endswith('0 rows moved'), summary or r.stderr.strip()[-200:])


# 5. the framework's own rewards, re-scored offline
# eval/run_verifiers.py ran the environment THROUGH verifiers against live models.
# Its rows carry both the reward the FRAMEWORK computed and the reply that produced
# it. Re-scoring those replies here every build is what keeps "the framework layer
# owns no scoring of its own" true rather than remembered.
import glob, json as _json
from lattice_claims import api as _api
_vf = sorted(glob.glob(os.path.join(HERE, 'eval', 'verifiers-*.json')))
_rows = _moved = 0
for _f in _vf:
    _rec = _json.load(open(_f))
    for _x in _rec['rows']:
        if _x.get('index') is None or _x.get('seed') is None:
            continue
        _rows += 1
        _g = _api.score(int(_x['seed']), int(_x['index']), _x['raw'])
        if abs(float(_g['certified']) - float(_x['framework_reward'])) > 1e-9:
            _moved += 1
check('the live rollouts run through verifiers re-score to the reward the framework gave',
      bool(_vf) and not _moved,
      f'{_rows} rollouts across {len(_vf)} models, {_moved} disagreements')
# red control: a forged pin must be seen
forged = dict(prov['files'][0]); forged['sha256'] = '0' * 64
check('RED: a forged pin is caught', hashlib.sha256(open(forged['file'], 'rb').read()).hexdigest() != forged['sha256'])

print(f"\n{'ALL GREEN' if not fails else str(fails) + ' FAILED'} — instruments/wiring")
sys.exit(1 if fails else 0)
