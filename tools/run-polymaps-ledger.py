#!/usr/bin/env python3
"""run-polymaps-ledger.py — Gao's Jacobian counterexamples (arXiv 2608.00222) and the weak Markus–Yamabe fields
(arXiv 2608.05392), decided by instruments/polymaps/decide.py from the TeX the papers print (corpus/polymaps, CC BY 4.0).
Writes certs/polymaps-ledger.json; `--check` re-derives it (about ninety seconds) and refuses on any difference.

usage: python3 tools/run-polymaps-ledger.py [--check]"""
import hashlib
import json
import os
import sys
import time

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = os.path.join(ROOT, 'certs', 'polymaps-ledger.json')
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'polymaps'))
import decide as D  # noqa: E402


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def build():
    meta = json.load(open(os.path.join(ROOT, 'corpus', 'polymaps', 'meta.json')))
    for f, h in meta['files'].items():
        if sha(os.path.join(ROOT, 'corpus', 'polymaps', f)) != h:
            sys.exit('polymaps-ledger: ' + f + ' is not the pinned bytes')
    t0 = time.time()
    rows = D.decide(full=True)
    for r in rows:
        for c in r['checks']:
            c.pop('seconds', None)
        r.pop('seconds', None)
    by = {}
    for r in rows:
        by[r['verdict']] = by.get(r['verdict'], 0) + 1
    return {'what': 'Polynomial maps two 2026 papers print, decided in exact rational arithmetic: Gao\'s counterexamples to the Jacobian conjecture (constant Jacobian determinant expanded symbolically, non-injectivity by two rational points with one image) and the weak Markus–Yamabe fields ((JX + I)^N = 0 as a polynomial identity, distinct zeros by evaluation).',
            'generated': time.strftime('%Y-%m-%d'), 'seconds': round(time.time() - t0, 1),
            'sources': meta['sources'], 'code': {f: sha(os.path.join(ROOT, 'instruments', 'polymaps', f)) for f in ('decide.py', 'poly.py')},
            'byVerdict': by, 'rows': rows}


def strip(x):
    y = json.loads(json.dumps(x))
    y['generated'] = y['seconds'] = None
    return y


if __name__ == '__main__':
    L = build()
    if '--check' in sys.argv:
        if strip(json.load(open(OUT))) != strip(L):
            sys.exit('polymaps-ledger: the ledger is not what the corpus and the decider give now')
        print('polymaps-ledger: re-derived, identical (%d rows)' % len(L['rows']))
    else:
        json.dump(L, open(OUT, 'w'), indent=1, ensure_ascii=False)
        open(OUT, 'a').write('\n')
        print('polymaps-ledger: ' + ', '.join('%d %s' % (v, k) for k, v in sorted(L['byVerdict'].items())) + ' (%.0f s)' % L['seconds'])
