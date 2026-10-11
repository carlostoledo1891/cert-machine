#!/usr/bin/env python3
"""gate.py — one prime gate decided by lr.c in parallel: the minimal-cover search split into subtrees at a fixed depth
and dealt round robin to J processes (each also runs the binary lifts on the rows of its covers and writes the
orbits that survive level 32), then the terminal stage once on the union of those orbits. Standard library only.

  python3 -I gate.py <p> [--k 14] [--jobs J] [--split D] [--lr PATH] [--out DIR] [--label NAME] [--no-neargcd]

Writes DIR/<p>.json (or DIR/<p>-no-neargcd.json): every count summed over the jobs, the terminal record, the
verdict, the sha256 of lr.c and of the binary, the machine, CPU and wall time.
"""
import hashlib
import json
import os
import platform
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


p = int(sys.argv[1])
k = int(arg('--k', '14'))
jobs = int(arg('--jobs', str(os.cpu_count() or 1)))
split = int(arg('--split', '3'))
lr = arg('--lr', os.path.join(HERE, 'lr'))
out = arg('--out', '.')
label = arg('--label', platform.node())
neargcd = '--no-neargcd' not in sys.argv
extra = [] if neargcd else ['--no-neargcd']
os.makedirs(out, exist_ok=True)
tag = '%d%s' % (p, '' if neargcd else '-no-neargcd')
sha = lambda f: hashlib.sha256(open(f, 'rb').read()).hexdigest()

t0 = time.time()
procs = []
for j in range(jobs):
    sf = os.path.join(out, '%s.s%d.txt' % (tag, j))
    procs.append((sf, subprocess.Popen([lr, str(k), str(p), '--jobs', str(jobs), '--job', str(j), '--split', str(split), '--survivors', sf] + extra,
                                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)))
parts = []
for sf, pr in procs:
    o, e = pr.communicate()
    if pr.returncode:
        sys.exit('job failed: ' + e)
    parts.append(json.loads(o))
t1 = time.time()
agg = {'nodes': 0, 'minimalCoverOrbitsBySize': {}, 'rows': 0, 'rowsWithF2': 0, 'diedAt': {}, 'survivingRows': 0, 'liftNodes': 0, 'cpuSeconds': 0.0}
for d in parts:
    agg['nodes'] += d['stage1']['nodes']
    for s, c in d['stage1']['minimalCoverOrbitsBySize'].items():
        agg['minimalCoverOrbitsBySize'][s] = agg['minimalCoverOrbitsBySize'].get(s, 0) + c
    for key in ('rows', 'rowsWithF2', 'survivingRows', 'liftNodes'):
        agg[key] += d['stage2'][key]
    for lv, c in d['stage2']['diedAt'].items():
        agg['diedAt'][lv] = agg['diedAt'].get(lv, 0) + c
    agg['cpuSeconds'] += d['cpuSeconds']
# the terminal stage, in parallel: the union of the surviving orbits (each job wrote its own, canonical, one per line)
# dealt round robin to J files, one lr --terminal-from per file, the counts summed
orbits = set()
for sf, _ in procs:
    with open(sf) as f:
        orbits.update(line.strip() for line in f if line.strip())
orbits = sorted(orbits)
chunks = [os.path.join(out, '%s.t%d.txt' % (tag, j)) for j in range(jobs)]
for j, cf in enumerate(chunks):
    with open(cf, 'w') as f:
        f.write(''.join(o + '\n' for o in orbits[j::jobs]))
tprocs = [subprocess.Popen([lr, str(k), str(p), '--terminal-from', cf] + extra, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) for cf in chunks]
parts_t = []
for pr in tprocs:
    o_, e_ = pr.communicate()
    if pr.returncode:
        sys.exit('terminal failed: ' + e_)
    parts_t.append(json.loads(o_))
T = {'terminal': {'level': parts_t[0]['terminal']['level'], 'factors': parts_t[0]['terminal']['factors'], 'orbits': [],
                  'orbitsListedMax': 50, 'orbitCount': 0, 'witnessFree': 0, 'improperAfterGcd': 0, 'improperAfterNearGcd': 0,
                  'orbitsClosedByGcdAlone': 0, 'openOrbits': 0, 'seconds': 0.0}, 'cpuSeconds': 0.0}
for d in parts_t:
    for key in ('orbitCount', 'witnessFree', 'improperAfterGcd', 'improperAfterNearGcd', 'orbitsClosedByGcdAlone', 'openOrbits'):
        T['terminal'][key] += d['terminal'][key]
    T['terminal']['seconds'] += d['terminal']['seconds']
    T['cpuSeconds'] += d['cpuSeconds']
    T['terminal']['orbits'].extend(d['terminal']['orbits'][:max(0, 50 - len(T['terminal']['orbits']))])
assert T['terminal']['orbitCount'] == len(orbits), 'the terminal jobs did not cover every surviving orbit'
T['verdict'] = 'OPEN' if T['terminal']['openOrbits'] else 'CLOSED'
T['jEmpty'] = T['terminal']['improperAfterGcd'] == 0 and T['verdict'] == 'CLOSED'
for sf, _ in procs:
    os.remove(sf)
for cf in chunks:
    os.remove(cf)
rec = {
    'gate': p, 'k': k, 'n': parts[0]['n'], 'm': parts[0]['m'], 'quota': parts[0]['quota'], 'neargcd': neargcd,
    'decider': {'lr.c': sha(os.path.join(HERE, 'lr.c')), 'binary': sha(lr), 'jobs': jobs, 'split': split},
    'machine': {'label': label, 'platform': platform.platform(), 'cpus': os.cpu_count()},
    'stages12': agg,
    'survivingOrbits': T['terminal']['orbitCount'],
    'terminal': T['terminal'],
    'verdict': T['verdict'], 'jEmpty': T['jEmpty'],
    'cpuSeconds': round(agg['cpuSeconds'] + T['cpuSeconds'], 2), 'wallSeconds': round(time.time() - t0, 1),
    'decidedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
}
with open(os.path.join(out, tag + '.json'), 'w') as f:
    json.dump(rec, f, indent=1)
    f.write('\n')
print('p=%d %s J=%s survivors=%d covers=%s cpu=%.0fs wall=%.0fs' % (p, rec['verdict'], rec['jEmpty'], rec['survivingOrbits'],
      agg['minimalCoverOrbitsBySize'], rec['cpuSeconds'], rec['wallSeconds']))
