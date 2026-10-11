#!/usr/bin/env python3
"""battery.py — the red controls of corpus/lonely-runner/preregistration.json for the fast decider lr.c.

  python3 -I battery.py <path-to-compiled-lr> [--quick]

1. lr against ref.py (the definitions, by brute force) for k = 2..6 over many primes: minimal-cover orbits by size,
   the orbits that survive level 32 with their terminal counts, the verdict and J(k,p) — every field must agree.
2. A mutated distance threshold (--k1 k) must change the record of a gate.
3. The shift lemma switched off must give back every class it handled.
Exit status 0 only if every check passes and every red control fires.
"""
import importlib.util
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('ref', os.path.join(HERE, 'ref.py'))
ref = importlib.util.module_from_spec(spec); spec.loader.exec_module(ref)

LR = sys.argv[1]
QUICK = '--quick' in sys.argv
fails = []


def lr(k, p, *extra):
    out = subprocess.run([LR, str(k), str(p), *extra], capture_output=True, text=True, timeout=3600)
    if out.returncode:
        raise RuntimeError(out.stderr)
    return json.loads(out.stdout)


def primes(a, b):
    return [q for q in range(max(a, 5), b) if all(q % d for d in range(2, int(q ** 0.5) + 1))]


def compare(k, p):
    R = ref.gate(k, p)
    D = lr(k, p)
    problems = []
    if R['minimalCovers'] != D['stage1']['minimalCoverOrbitsBySize']:
        problems.append('minimal covers %s vs %s' % (R['minimalCovers'], D['stage1']['minimalCoverOrbitsBySize']))
    rs = {tuple(r['row']): (r['terminal']['witnessFree'], r['terminal']['improperAfterGcd'], r['terminal']['improperAfterNearGcd'])
          for r in R['perRow'] if 'terminal' in r}
    ds = {tuple(o['row']): (o['witnessFree'], o['improperAfterGcd'], o['improperAfterNearGcd']) for o in D['terminal']['orbits']}
    if D['terminal']['orbitCount'] <= D['terminal']['orbitsListedMax'] and rs != ds:
        problems.append('terminal orbits differ: ref %s / lr %s' % (sorted(rs.items())[:4], sorted(ds.items())[:4]))
    if D['terminal']['orbitCount'] != len(rs):
        problems.append('surviving orbits %d vs %d' % (len(rs), D['terminal']['orbitCount']))
    if R['verdict'] != D['verdict'] or R['jEmpty'] != D['jEmpty']:
        problems.append('verdict %s/%s vs %s/%s' % (R['verdict'], R['jEmpty'], D['verdict'], D['jEmpty']))
    return R, D, problems


cases = []
LIMIT = {2: 60, 3: 50, 4: 40, 5: 34, 6: 30} if not QUICK else {2: 30, 3: 24, 4: 20, 5: 18, 6: 16}
for k in range(2, 7):
    for p in primes(k + 3, LIMIT[k]):
        cases.append((k, p))
seen = {'OPEN': 0, 'CLOSED': 0, 'nearGcdUsed': 0, 'survivors': 0}
t0 = time.time()
for k, p in cases:
    R, D, problems = compare(k, p)
    seen[D['verdict']] += 1
    seen['survivors'] += D['terminal']['orbitCount']
    if D['terminal']['improperAfterGcd'] > D['terminal']['improperAfterNearGcd']:
        seen['nearGcdUsed'] += 1
    status = 'ok' if not problems else 'FAIL'
    print('%-4s k=%d p=%-3d %-6s J=%-5s minimal=%s survivors=%d' % (status, k, p, D['verdict'], D['jEmpty'], D['stage1']['minimalCoverOrbitsBySize'], D['terminal']['orbitCount']))
    for pr in problems:
        print('      ', pr)
        fails.append((k, p, pr))
print('agreement: %d cases in %.0f s; verdicts %s' % (len(cases), time.time() - t0, seen))
if seen['OPEN'] == 0 or seen['CLOSED'] == 0 or seen['nearGcdUsed'] == 0 or seen['survivors'] == 0:  # every path exercised
    fails.append(('coverage', 'the cases did not exercise OPEN, CLOSED, the shift lemma and survivors all at once', seen))

# red control: a different distance threshold must change the record
k, p = 5, 31
a, b = lr(k, p), lr(k, p, '--k1', str(k))
fired = (a['stage1'] != b['stage1']) or (a['stage2']['survivingOrbits'] != b['stage2']['survivingOrbits']) or (a['verdict'] != b['verdict'])
print('RED %s  the threshold 1/%d replaced by 1/%d changes the record at k=%d p=%d' % ('ok' if fired else 'FAILED', k + 1, k, k, p))
if not fired:
    fails.append(('red', 'k1 mutation'))

# red control: the shift lemma switched off must give back every class it handled. (A gate it closes outright exists
# only at k = 14 — p = 233 in the paper — and is the calibration run's own red control.)
hit = None
for k, p in cases:
    D = lr(k, p)
    if D['terminal']['improperAfterGcd'] > D['terminal']['improperAfterNearGcd']:
        hit = (k, p, D); break
if hit is None:
    print('RED FAILED  no case where the shift lemma handles a class')
    fails.append(('red', 'no near-gcd case'))
else:
    k, p, D = hit
    E = lr(k, p, '--no-neargcd')
    fired = E['terminal']['improperAfterNearGcd'] == E['terminal']['improperAfterGcd'] == D['terminal']['improperAfterGcd'] > D['terminal']['improperAfterNearGcd']
    print('RED %s  k=%d p=%d: the shift lemma handles %d of %d classes; switched off, all %d stay open' %
          ('ok' if fired else 'FAILED', k, p, D['terminal']['improperAfterGcd'] - D['terminal']['improperAfterNearGcd'],
           D['terminal']['improperAfterGcd'], E['terminal']['improperAfterNearGcd']))
    if not fired:
        fails.append(('red', 'near-gcd off'))

print('BATTERY', 'PASS' if not fails else 'FAIL (%d)' % len(fails))
sys.exit(1 if fails else 0)
