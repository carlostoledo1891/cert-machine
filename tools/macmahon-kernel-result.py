#!/usr/bin/env python3
"""macmahon-kernel-result.py — the facts of the MacMahon kernel job, as JSON on stdout. Runs inside
.github/workflows/macmahon-kernel.yml after Comparator and the axioms step; reports what the run printed and nothing
more (exit codes, times, peak memory, which kernels said what, the axiom lines, the log tails). NO verdict word here:
tools/record-macmahon-kernel.js decides when it writes certs/macmahon-kernel.json.
usage: macmahon-kernel-result.py <out-dir>                                                                        MIT"""
import json
import os
import re
import sys

out = sys.argv[1]


def read(name):
    p = os.path.join(out, name)
    if not os.path.exists(p):
        return None
    with open(p, encoding='utf-8', errors='replace') as f:
        return f.read()


log, err = read('comparator.log'), read('comparator.err')
both = (log or '') + '\n' + (err or '')
kernels = sorted(set(re.findall(r'^(.*kernel (?:accepts|rejects).*)$', both, re.M)))
rss = re.search(r'Maximum resident set size \(kbytes\): (\d+)', err or '')
config = None
try:
    config = json.loads(read('audit-config.json') or 'null')
except Exception:
    config = None
ax = read('axioms.log') or ''
axioms = {m.group(1): sorted(a.strip() for a in m.group(2).split(',') if a.strip()) for m in re.finditer(r"^'([^']+)' depends on axioms: \[([^\]]*)\]", ax, re.M)}
for m in re.finditer(r"^'([^']+)' does not depend on any axioms", ax, re.M):
    axioms[m.group(1)] = []
ex, sec, axexit = read('exit.txt'), read('seconds.txt'), read('axioms.exit')
num = lambda s: int(s) if s and s.strip().lstrip('-').isdigit() else None
print(json.dumps({
    'theorems': config['theorem_names'] if config else None,
    'permitted_axioms': config.get('permitted_axioms') if config else None,
    'nanodaRequested': bool(config.get('enable_nanoda')) if config else None,
    'nanodaAnswered': any('nanoda' in k.lower() for k in kernels),
    'ran': ex is not None, 'exit': num(ex), 'seconds': num(sec),
    'cacheSeconds': num(os.environ.get('CACHE_SECONDS')), 'buildSeconds': num(os.environ.get('BUILD_SECONDS')),
    'okay': 'Your solution is okay!' in both,
    'kernels': kernels, 'rssKb': int(rss.group(1)) if rss else None,
    'axiomsExit': num(axexit), 'axioms': axioms,
    'env': read('env.txt'), 'sha256': read('sha256.txt'),
    'logTail': (log or '')[-3000:], 'errTail': (err or '')[-3000:], 'axiomsTail': ax[-2000:],
}, indent=1))
