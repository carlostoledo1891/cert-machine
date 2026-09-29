#!/usr/bin/env python3
"""run-turan-ledger.py — the registry's asterisked C42 <= 0.6906538 (Turán's pure power-sum constant), decided from the
certificate its row cites (instruments/turan/c42.py). Writes certs/turan-ledger.json; `--check` re-derives it.

usage: python3 tools/run-turan-ledger.py [--check]"""
import hashlib
import json
import os
import sys
import time

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = os.path.join(ROOT, 'certs', 'turan-ledger.json')
CORPUS = os.path.join(ROOT, 'corpus', 'optimization-constants', 'c42')
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'turan'))
import c42  # noqa: E402


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def build():
    meta = json.load(open(os.path.join(CORPUS, 'meta.json')))
    for f, h in meta['files'].items():
        if sha(os.path.join(CORPUS, f)) != h:
            sys.exit('turan-ledger: ' + f + ' is not the pinned bytes')
    P = json.load(open(os.path.join(CORPUS, 'params.json')))
    r = c42.decide(P)
    g = c42.decide_profile(P['bound'], (P['alpha']['re'], P['alpha']['im']), [P['tau'], str(1 - __import__('fractions').Fraction(P['tau']))], [(P['eta']['re'], P['eta']['im'])])
    if g['ratioUpper'] != r['ratioUpper']:
        sys.exit('turan-ledger: the step-profile form does not reproduce the two-block computation')
    Q = json.load(open(os.path.join(CORPUS, 'pr184.json')))
    q = c42.decide_profile(Q['C'], Q['alpha'], Q['breaks'], Q['eta'])
    return {'what': 'The registry\'s asterisked C42 <= 0.6906538, decided from the certificate it cites: the four exact facts the note\'s asymptotic argument needs, the limiting inequality |Y| < C D among them, in Decimal intervals; the argument itself is the note\'s.',
            'generated': time.strftime('%Y-%m-%d'), 'registry': {'commit': meta['registryCommit'], 'row': 'C42 <= 0.6906538*'}, 'source': P['source'],
            'code': {'instruments/turan/c42.py': sha(os.path.join(ROOT, 'instruments', 'turan', 'c42.py'))},
            'rows': [dict(id='42a', claim='C42 <= 0.6906538', claimant='S. Griego (github.com/sebastian-griego/turan-c42-certificate v1.0.0)',
                          scope='the limiting certificate decided (|Y|/D <= ' + r['ratioUpper'][:14] + '… < 0.6906538, |1-alpha| < C, |eta| < C, tau > 1/3); the asymptotic reduction to it, with no finite threshold, is the note\'s prose', **r),
                     dict(id='42a-pr184', claim='C42 <= 0.688983 (an open pull request to the registry)', claimant='A. Röhrig with Codex (teorth/optimizationproblems PR #184, 9 Sep 2026)',
                          scope='the eight-block limiting certificate decided (|Y|/D <= ' + q['ratioUpper'][:14] + '… < 0.688983, every block inside C, gap ' + q['checks'][2]['detail'].split(' ')[-1] + '); the asymptotic reduction is the note\'s prose', **q)],
            'pr184': {k: Q[k] for k in ('source', 'construction')}}


def strip(x):
    y = json.loads(json.dumps(x))
    y['generated'] = None
    return y


if __name__ == '__main__':
    L = build()
    if '--check' in sys.argv:
        if strip(json.load(open(OUT))) != strip(L):
            sys.exit('turan-ledger: the ledger is not what the certificate and the decider give now')
        print('turan-ledger: re-derived, identical (%s)' % L['rows'][0]['verdict'])
    else:
        json.dump(L, open(OUT, 'w'), indent=1, ensure_ascii=False)
        open(OUT, 'a').write('\n')
        print('turan-ledger: ' + '; '.join('%s %s, |Y|/D <= %s' % (x['id'], x['verdict'], x['ratioUpper']) for x in L['rows']))
