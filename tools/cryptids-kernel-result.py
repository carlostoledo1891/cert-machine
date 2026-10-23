#!/usr/bin/env python3
"""cryptids-kernel-result.py — the facts of one cryptids kernel job, as JSON on stdout.

Runs inside .github/workflows/cryptids-kernel.yml after Comparator. It reports what the run printed and nothing more:
the exit code, the times, the peak memory, which kernels said what, the axioms Comparator printed, and the last lines of
the logs. It writes NO verdict word — tools/record-cryptids-kernel.js decides CERTIFIED / REFUSED from these facts when it
writes certs/cryptids-kernel.json, so the rule lives in one module.

usage: cryptids-kernel-result.py <out-dir> <config>                                                               MIT"""
import json
import os
import re
import sys

out, cfg = sys.argv[1], sys.argv[2]


def read(name):
    p = os.path.join(out, name)
    if not os.path.exists(p):
        return None
    with open(p, encoding='utf-8', errors='replace') as f:
        return f.read()


log, err = read('comparator.log'), read('comparator.err')
exit_txt, sec_txt = read('exit.txt'), read('seconds.txt')
both = (log or '') + '\n' + (err or '')
kernels = sorted(set(re.findall(r'^(.*kernel (?:accepts|rejects).*)$', both, re.M)))
axioms = sorted(set(re.findall(r'^(.*(?:axiom|Axiom)s?.*)$', both, re.M)))[:40]
rss = re.search(r'Maximum resident set size \(kbytes\): (\d+)', err or '')
config = None
try:
    config = json.loads(read('audit-config.json') or 'null')
except Exception:
    config = None
fact = {
    'config': cfg,
    'theorems': len(config['theorem_names']) if config else None,
    'permitted_axioms': config.get('permitted_axioms') if config else None,
    'nanoda': bool(config.get('nanoda')) if config else None,
    'ran': exit_txt is not None,
    'exit': int(exit_txt) if exit_txt and exit_txt.strip().lstrip('-').isdigit() else None,
    'seconds': int(sec_txt) if sec_txt and sec_txt.strip().isdigit() else None,
    'cacheSeconds': int(os.environ['CACHE_SECONDS']) if os.environ.get('CACHE_SECONDS', '').isdigit() else None,
    'buildSeconds': int(os.environ['BUILD_SECONDS']) if os.environ.get('BUILD_SECONDS', '').isdigit() else None,
    'okay': 'Your solution is okay!' in both,
    'kernels': kernels,
    'axiomLines': axioms,
    'rssKb': int(rss.group(1)) if rss else None,
    'env': read('env.txt'),
    'sha256': read('sha256.txt'),
    'logTail': (log or '')[-3000:],
    'errTail': (err or '')[-3000:],
}
print(json.dumps(fact, indent=1))
