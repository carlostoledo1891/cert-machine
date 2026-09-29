#!/usr/bin/env python3
"""run-fei-ledger.py — the registry's asterisked C71 >= 6.521845710923046575 (Fourier entropy–influence), decided from the
published n = 18 truth table by instruments/fei/fei.py. Writes certs/fei-ledger.json; `--check` re-derives it.

usage: python3 tools/run-fei-ledger.py [--check]"""
import hashlib
import json
import os
import sys
import time

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = os.path.join(ROOT, 'certs', 'fei-ledger.json')
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'fei'))
import fei  # noqa: E402

THRESHOLD = '6.521845710923046575'


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def build():
    meta = json.load(open(os.path.join(ROOT, 'corpus', 'optimization-constants', 'num2026', 'meta.json')))
    for f, h in meta['files'].items():
        if sha(os.path.join(ROOT, 'corpus', 'optimization-constants', 'num2026', f)) != h:
            sys.exit('fei-ledger: ' + f + ' is not the pinned bytes')
    art = json.load(open(os.path.join(ROOT, 'corpus', 'optimization-constants', 'num2026', 'fei_c71_n18_artifact.json')))
    r = fei.decide(art, THRESHOLD, art.get('record_dec'))
    return {'what': 'The optimization-constants registry\'s asterisked C71 lower bound, decided from the cited truth table: balanced, exact spectrum, exact influence, entropy in outward-rounded Decimal intervals, and the amplification rule C71 >= H/(I-1) (O\'Donnell–Tan 2013; Hod 2017, Prop 1.2 — cited, not re-proved).',
            'generated': time.strftime('%Y-%m-%d'), 'registry': {'commit': meta['registryCommit'], 'row': 'C71 > ' + THRESHOLD + '*'},
            'source': {k: meta[k] for k in ('source', 'by', 'published', 'license', 'checker')},
            'code': {'instruments/fei/fei.py': sha(os.path.join(ROOT, 'instruments', 'fei', 'fei.py'))},
            'rows': [dict(id='71', claim='C71 > ' + THRESHOLD, claimant=meta['by'] + ', Zenodo 10.5281/zenodo.21497769', **r)]}


def strip(x):
    y = json.loads(json.dumps(x))
    y['generated'] = None
    return y


if __name__ == '__main__':
    L = build()
    if '--check' in sys.argv:
        if strip(json.load(open(OUT))) != strip(L):
            sys.exit('fei-ledger: the ledger is not what the artifact and the decider give now')
        print('fei-ledger: re-derived, identical (%s)' % L['rows'][0]['verdict'])
    else:
        json.dump(L, open(OUT, 'w'), indent=1, ensure_ascii=False)
        open(OUT, 'a').write('\n')
        print('fei-ledger: C71 %s, ratio %s…' % (L['rows'][0]['verdict'], L['rows'][0]['ratio'][0][:30]))
