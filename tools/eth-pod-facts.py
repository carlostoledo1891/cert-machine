#!/usr/bin/env python3
"""eth-pod-facts.py — the pod-side helper of tools/runpod-eth.sh (the kernel lane of the ETH-refutation check).

Two jobs, and NO verdict in either: the decider is tools/record-eth-kernel.js on the desk, so the rule lives in one
module.

  verify <claim> <clone-root>   every file corpus/eth-refutation/pins.json pins for the claim, under the folders the
                                pod checked out, has its pinned sha256, and no unpinned file sits beside them; prints
                                the facts as JSON and exits 1 on any difference
  facts <out-dir> <claim>       the facts of one claim's run as JSON on stdout: per step the exit code, wall seconds,
                                peak RSS of the largest process (GNU time) and of the whole container (the sampler's
                                cgroup readings inside the step's window), the kernels' lines, the axioms printed, the
                                log tails

usage: python3 -I eth-pod-facts.py verify <claim> <clone-root> <pins.json> <prefix>...
       python3 -I eth-pod-facts.py facts <out-dir> <claim> [<mem.tsv>]
"""
import hashlib
import json
import os
import re
import sys

STEPS = ['prepare', 'comparator', 'build', 'axioms', 'leanchecker']
TIME_V = ('Command being timed', 'User time', 'System time', 'Percent of CPU', 'Elapsed', 'Average', 'Maximum resident',
          'Major', 'Minor', 'Voluntary', 'Involuntary', 'Swaps', 'File system', 'Socket', 'Signals', 'Page size', 'Exit status')


def verify(claim, root, pins_path, prefixes):
    pins = json.load(open(pins_path))['claims'][claim]
    want = {p: s for p, s in pins['files'].items() if any(p == x or p.startswith(x.rstrip('/') + '/') for x in prefixes)}
    bad, extra = [], []
    for p, s in sorted(want.items()):
        f = os.path.join(root, p)
        if not os.path.isfile(f):
            bad.append(p + ': missing')
            continue
        h = hashlib.sha256(open(f, 'rb').read()).hexdigest()
        if h != s:
            bad.append(p + ': ' + h)
    # an unpinned file inside a pinned FOLDER (single pinned files are compared one by one above)
    for folder in pins['folders']:
        if not any(folder == x or folder.startswith(x.rstrip('/') + '/') for x in prefixes):
            continue
        for d, _, names in os.walk(os.path.join(root, folder)):
            for n in names:
                rel = os.path.relpath(os.path.join(d, n), root)
                if rel not in pins['files']:
                    extra.append(rel)
    out = {'claim': claim, 'commit': pins['commit'], 'checked': len(want), 'mismatches': bad[:20], 'unpinned': sorted(extra)[:20],
           'ok': not bad and not extra}
    print(json.dumps(out, indent=1))
    sys.exit(0 if out['ok'] else 1)


def read(out, name):
    p = os.path.join(out, name)
    if not os.path.exists(p):
        return None
    with open(p, encoding='utf-8', errors='replace') as f:
        return f.read()


def num(s):
    s = (s or '').strip()
    return int(s) if s.lstrip('-').isdigit() else None


def mem_peak(samples, t0, t1):
    """the largest container reading (kB) taken while the step ran"""
    if t0 is None:
        return None
    t1 = t1 if t1 is not None else float('inf')
    vals = [kb for (t, kb) in samples if t0 <= t <= t1]
    return max(vals) if vals else None


def step(out, name, samples):
    log, err = read(out, name + '.log'), read(out, name + '.err')
    t0, t1 = num(read(out, name + '.start')), num(read(out, name + '.end'))
    ex = num(read(out, name + '.exit'))
    if t0 is None and ex is None:
        return None
    rss = re.search(r'Maximum resident set size \(kbytes\): (\d+)', err or '')
    return {
        'exit': ex,
        'timedOut': ex == 124,
        'seconds': (t1 - t0) if (t0 is not None and t1 is not None) else None,
        'running': t1 is None,
        'maxRssKB': int(rss.group(1)) if rss else None,
        'containerPeakKB': mem_peak(samples, t0, t1),
        'logTail': [l for l in (log or '').splitlines() if l.strip()][-30:],
        'errTail': [l for l in (err or '').splitlines() if l.strip() and not l.lstrip().startswith(TIME_V)][-30:],
    }


def facts(out, claim, mem_path):
    samples = []
    if mem_path and os.path.exists(mem_path):
        for line in open(mem_path):
            parts = line.split()
            if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
                samples.append((int(parts[0]), int(parts[1])))
    f = {'claim': claim, 'env': (read(out, 'env.txt') or '').strip().splitlines()}
    v = read(out, 'verify.json')
    f['verify'] = json.loads(v) if v and v.strip().startswith('{') else None
    f['steps'] = {s: step(out, s, samples) for s in STEPS}
    c = f['steps'].get('comparator') or {}
    clog = (read(out, 'comparator.log') or '') + '\n' + (read(out, 'comparator.err') or '')
    f['comparator'] = {
        'okay': 'Your solution is okay!' in clog,
        'kernels': sorted(set(re.findall(r'^(.*kernel (?:accepts|rejects|rejected).*|Quotient post-check rejects.*|Error while interacting with .*)$', clog, re.M))),
        'stages': re.findall(r'^(Building \S+|Exporting .*? from \S+|Running .*kernel.*)$', clog, re.M)[:20],
        'exit': c.get('exit'),
    }
    alog = (read(out, 'axioms.log') or '') + '\n' + (read(out, 'axioms.err') or '')
    printed = []
    for m in re.finditer(r"^'([^']+)' depends on axioms: \[([^\]]*)\]", alog, re.M):
        printed.append({'theorem': m.group(1), 'axioms': [a.strip() for a in m.group(2).split(',') if a.strip()]})
    for m in re.finditer(r"^'([^']+)' does not depend on any axioms", alog, re.M):
        printed.append({'theorem': m.group(1), 'axioms': []})
    f['axioms'] = {'printed': printed, 'file': read(out, 'AuditAxioms.lean')}
    llog = (read(out, 'leanchecker.log') or '') + '\n' + (read(out, 'leanchecker.err') or '')
    f['leanchecker'] = {
        'command': (read(out, 'leanchecker.cmd') or '').strip() or None,
        'errorLines': [l for l in llog.splitlines() if re.search(r'error|uncaught|kernel|exception|PANIC', l, re.I)][-15:],
    }
    f['phaseOrder'] = (read(out, 'order.txt') or '').split()
    print(json.dumps(f, indent=1))


if __name__ == '__main__':
    if len(sys.argv) >= 5 and sys.argv[1] == 'verify':
        verify(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5:] or [''])
    elif len(sys.argv) >= 4 and sys.argv[1] == 'facts':
        facts(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
    else:
        sys.exit(__doc__)
