#!/usr/bin/env python3
"""import-runpod-ramsey.py — bring an orbital-kernel search a RunPod pod ran (tools/runpod-ramsey.sh) into
corpus/ramsey/runs/: the progress lines merged into <job>.<side>.orbital.progress (a unit already on record must carry the
same count, or nothing is imported), the run appended to <job>.<side>.orbital.runs.json (pod, cpu, threads, seconds,
units before and after, the pod's build line), and the pod's own result, per-root counts and build line kept under
corpus/ramsey/runs/runpod-<pod>/. Then: python3 tools/run-ramsey-ledger.py --only <job> --reread.

usage: python3 tools/import-runpod-ramsey.py <pod-id>
"""
import sys, os, json, re, urllib.request, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUNS = os.path.join(ROOT, 'corpus', 'ramsey', 'runs')


def get(base, rel):
    for i in range(4):
        try:
            # the pod proxy refuses Python's default user agent (403 on 2026-10-27); curl's is accepted
            with urllib.request.urlopen(urllib.request.Request(base + rel, headers={'User-Agent': 'curl/8.7.1'}), timeout=120) as r:
                return r.read().decode()
        except Exception:
            time.sleep(3 * (i + 1))
    return None


def main(pod):
    if not re.fullmatch(r'[a-z0-9]+', pod or ''):
        sys.exit('usage: import-runpod-ramsey.py <pod-id>')
    base = 'https://%s-8000.proxy.runpod.net/' % pod
    st = json.loads(get(base, '_status.json') or 'null') or sys.exit('no _status.json at ' + base)
    print('pod %s: %s (audit %s, %s cpus, %s)' % (pod, st['phase'], st['audit'], st['cpus'], st['updated']))
    if st['phase'] != 'complete':
        sys.exit(3 if not st['phase'].startswith('FAILED') else 1)
    job = st['job']                                   # "<name>.<side>"
    res = json.loads(get(base, job + '.orbital.json') or 'null') or sys.exit('no kernel result served')
    lines = (get(base, job + '.orbital.progress') or '').splitlines()
    build = get(base, '_build.txt') or ''
    roots = get(base, job + '.orbital.roots') or ''
    prog = os.path.join(RUNS, job + '.orbital.progress')
    have = {}
    if os.path.exists(prog):
        for l in open(prog):
            p, r, b, c = l.split()
            have[(p, r, b)] = c
    before = len(have)
    new = []
    for l in lines:
        p, r, b, c = l.split()
        if (p, r, b) in have:
            if have[(p, r, b)] != c:
                sys.exit('unit %s %s %s: the pod counts %s nodes, the record %s — nothing imported' % (p, r, b, c, have[(p, r, b)]))
            continue
        have[(p, r, b)] = c
        new.append(l)
    with open(prog, 'a') as f:
        for l in new:
            f.write(l + '\n')
    keep = os.path.join(RUNS, 'runpod-' + pod)
    os.makedirs(keep, exist_ok=True)
    open(os.path.join(keep, 'status.json'), 'w').write(json.dumps(st, indent=1) + '\n')
    open(os.path.join(keep, 'result.json'), 'w').write(json.dumps(res, indent=1) + '\n')
    open(os.path.join(keep, 'build.txt'), 'w').write(build)
    open(os.path.join(keep, 'roots.txt'), 'w').write(roots)
    cpu = next((l.split(':', 1)[1].strip() for l in build.splitlines() if l.startswith('model name')), 'unknown cpu')
    rp = os.path.join(RUNS, job + '.orbital.runs.json')
    runs = json.load(open(rp)) if os.path.exists(rp) else []
    runs.append({'where': 'runpod pod %s (%s)' % (pod, cpu), 'threads': int(st.get('threads') or st['cpus']), 'seconds': res['seconds'],
                 'date': st['updated'], 'audit': st['audit'], 'unitsBefore': before, 'unitsAfter': len(have), 'nodesAfter': None,
                 'kernelReport': {k: res[k] for k in ('units', 'unitsDone', 'nodes', 'complete', 'timedOut', 'seconds')}})
    json.dump(runs, open(rp, 'w'), indent=1)
    open(rp, 'a').write('\n')
    print('%s: %d new units (%d on record now); run appended to %s; keep %s' % (job, len(new), len(have), os.path.relpath(rp, ROOT), os.path.relpath(keep, ROOT)))
    print('next: python3 tools/run-ramsey-ledger.py --only %s --reread' % job.split('.')[0])


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
