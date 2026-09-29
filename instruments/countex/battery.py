#!/usr/bin/env python3
"""instruments/countex/battery.py — the AI counterexample library's deciders, gated.

Every mirrored file re-hashes to its pin; certs/countex-ledger.json re-derives unchanged from the corpus and the
deciders; and every decider, run as a script on its published case, prints its verdict and then decides its own
FORGE — the certificate changed by the smallest amount that breaks the counterexample — which must not certify
(each script asserts it and exits non-zero otherwise). Standard library only.

Prints: "countex battery: N pass, 0 fail, R/R red controls fired". """
import hashlib
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
CORPUS = os.path.join(ROOT, 'corpus', 'countex')
passed = failed = reds = fired = 0


def ok(cond, name):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print('FAIL ' + name, file=sys.stderr)


meta = json.load(open(os.path.join(CORPUS, 'meta.json')))
ok(all(hashlib.sha256(open(os.path.join(CORPUS, f), 'rb').read()).hexdigest() == h for f, h in meta['files'].items()), 'every mirrored file re-hashes to its pin (%d files)' % len(meta['files']))
p = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'run-countex-ledger.py'), '--check'], capture_output=True, text=True)
ok(p.returncode == 0 and 'identical' in p.stdout, 'certs/countex-ledger.json re-derived from the corpus and the deciders: identical')
L = json.load(open(os.path.join(ROOT, 'certs', 'countex-ledger.json')))
ok(len(L['rows']) == 14 and all(r['verdict'] in ('CERTIFIED', 'PARTIAL') for r in L['rows']), 'fourteen cases, each CERTIFIED or PARTIAL with its scope named')
ok(all(r['verdict'] == 'CERTIFIED' or r['scope'] for r in L['rows']) and all(not r['checksFailed'] or r['verdict'] == 'PARTIAL' for r in L['rows']),
   'no certified case carries a failed check')
for case in sorted(os.listdir(os.path.join(CORPUS, 'counterexamples'))):
    f = os.path.join(HERE, 'cases', case.replace('-', '_') + '.py')
    q = subprocess.run([sys.executable, f], capture_output=True, text=True, cwd=os.path.join(HERE, 'cases'))
    reds += 1
    good = q.returncode == 0 and ('forge' in q.stdout.lower())
    fired += good
    ok(good, case + ': the forged certificate is not certified (%s)' % (q.stdout.strip().split('\n')[-1][:120] if q.stdout.strip() else q.stderr.strip()[-120:]))
print('countex battery: %d pass, %d fail, %d/%d red controls fired' % (passed, failed, fired, reds))
sys.exit(1 if failed else 0)
