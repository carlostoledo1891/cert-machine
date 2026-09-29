#!/usr/bin/env python3
"""run-sumproduct-ledger.py — the registry's asterisked C84b <= 1.999281 (the real sum–product exponent), decided from the
note its row cites (instruments/sumproduct/c84b.py). Writes certs/sumproduct-ledger.json; `--check` re-derives it.

usage: python3 tools/run-sumproduct-ledger.py [--check]"""
import hashlib
import json
import os
import sys
import time

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = os.path.join(ROOT, 'certs', 'sumproduct-ledger.json')
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'sumproduct'))
import c84b  # noqa: E402


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def build():
    meta = json.load(open(os.path.join(ROOT, 'corpus', 'optimization-constants', 'c84b', 'meta.json')))
    for f, h in meta['files'].items():
        if sha(os.path.join(ROOT, 'corpus', 'optimization-constants', 'c84b', f)) != h:
            sys.exit('sumproduct-ledger: ' + f + ' is not the pinned bytes')
    r = c84b.decide()
    return {'what': 'The registry\'s asterisked upper bound C84b <= 1.999281, decided from the chain of the note it cites: the note\'s own constant 0.0007 holds (C84b <= 1.9993, given BSSZ2026 §5, the note\'s lattice-doubling lemma and the regulator bound), and no choice of the chain\'s parameters reaches the 0.000719 the registry quotes.',
            'generated': time.strftime('%Y-%m-%d'), 'registry': {'commit': meta['registryCommit'], 'row': meta['row']}, 'note': meta['note'],
            'code': {'instruments/sumproduct/c84b.py': sha(os.path.join(ROOT, 'instruments', 'sumproduct', 'c84b.py'))},
            'rows': [{'id': '84b', 'claim': 'C84b <= 1.999281 (c >= 0.000719)', 'claimant': 'I. Althoefer with ChatGPT 5.5 (the note, 28 May 2026), as the registry quotes it',
                      'verdict': r['verdict'], 'repairedTo': 'C84b <= 1.9993 (c >= 0.0007, the note\'s own theorem)', 'ceiling': r['ceiling'], 'cAtNoteChoice': r['cAtNoteChoice'],
                      'checks': r['checks']}]}


def strip(x):
    y = json.loads(json.dumps(x))
    y['generated'] = None
    return y


if __name__ == '__main__':
    L = build()
    if '--check' in sys.argv:
        if strip(json.load(open(OUT))) != strip(L):
            sys.exit('sumproduct-ledger: the ledger is not what the note and the decider give now')
        print('sumproduct-ledger: re-derived, identical (%s)' % L['rows'][0]['verdict'])
    else:
        json.dump(L, open(OUT, 'w'), indent=1, ensure_ascii=False)
        open(OUT, 'a').write('\n')
        print('sumproduct-ledger: C84b %s, ceiling on c %s' % (L['rows'][0]['verdict'], L['rows'][0]['ceiling']))
