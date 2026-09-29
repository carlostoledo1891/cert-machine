#!/usr/bin/env python3
"""run-horizonmath-ledger.py — the discoveries HorizonMath credits to frontier models (arXiv 2603.15617v2), decided from
what its Appendix A prints. Writes certs/horizonmath-ledger.json; `--check` re-derives it and refuses on any difference.

The corpus is corpus/horizonmath (transcriptions of the printed constructions, pinned by sha256 in its meta.json;
the papers and the benchmark's code pinned there, not copied). The deciders are instruments/horizonmath/*.py, standard
library only, written from the problem statements and GNNW's paper, never from the benchmark's validators — which
were run once, for the record, and whose output meta.json keeps as an observation.

usage: python3 tools/run-horizonmath-ledger.py [--check]"""
import hashlib
import json
import os
import sys
import time

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CORPUS = os.path.join(ROOT, 'corpus', 'horizonmath')
OUT = os.path.join(ROOT, 'certs', 'horizonmath-ledger.json')
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'horizonmath'))
import ramsey_region as RR  # noqa: E402
import kakeya_area as KA  # noqa: E402


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def build():
    meta = json.load(open(os.path.join(CORPUS, 'meta.json')))
    for f, h in meta['files'].items():
        if sha(os.path.join(CORPUS, f)) != h:
            sys.exit('horizonmath-ledger: ' + f + ' is not the pinned bytes')
    r = RR.decide(CORPUS)
    k = KA.decide(CORPUS)
    last = r['rows'][-1]
    w = last['outsideR']
    rows = [
        {'id': 'ramsey-asymptotic', 'problem': 'Asymptotic Upper Bound Constant for Diagonal Ramsey Numbers (solvability 1)',
         'claim': 'R(k,k) <= 3.6960839126^(k+o(k)), improving 3.7992 (Gupta–Ndiaye–Norin–Wei), by a certificate that satisfies their Theorem 14',
         'claimant': 'GPT-5.4 Pro, reproduced by GPT-5.6 Sol Max (HorizonMath, arXiv 2603.15617v2, Appendix A.3)',
         'verdict': r['verdict'], 'kind': 'checker-wider-than-definition',
         'scope': ('the certificate is refuted, not the inequality: its pair (X(1), Y(1)) = (%.5f, %.4f), at the point that sets c, lies outside R — '
                   'Erdos\'s 1947 bound at e = %s, p = %s exceeds the pair\'s rate by %.5f — and %d of its %d decided points are outside R, %d more not placed in R by the bound the problem names. '
                   'The problem\'s own rule accepts every pair with x <= e^-U(1) = %.5f, whatever y is: it asks one of the two inequalities membership needs')
                  % (last['X'][0], last['Y'], w['e'], w['p'], w['gap'], r['outsideR'], r['points'], r['notPlacedByU'], r['eMinusU1'][0]),
         'decided': {k2: v for k2, v in r.items() if k2 != 'rows'}, 'points': r['rows'],
         'theirChecker': meta['observed']['ramseyValidator']['output'], 'theirCheckerWithAnd': meta['observed']['ramseyValidatorWithAnd']},
        {'id': 'keich-thin-triangles-128', 'problem': 'Thin-Triangle Kakeya (128 slopes): minimize union area (solvability 1)',
         'claim': k['claim'], 'claimant': 'GPT-5.4 Pro, reproduced by GPT-5.6 Sol Max (HorizonMath, arXiv 2603.15617v2, Appendix A.2)',
         'verdict': k['verdict'], 'kind': 'none',
         'scope': 'the union of the 128 printed triangles has area exactly %s/%s = %s…, %s below the printed AlphaEvolve baseline; the printed 0.1091479892 is %s'
                  % (k['area']['num'], k['area']['den'], k['area']['decimal'][:16], k['improvement'][:10], k['printedIs']),
         'decided': k, 'theirChecker': meta['observed']['kakeyaValidator']['output']},
        {'id': 'gpt56-closed-forms', 'problem': 'Fifth Airy moment a5; equal-power TE+TM and non-resonant TM/TE spherical-mode quality factors (solvability 2)',
         'claim': 'three closed forms that "pass the compliance check and match the high-precision reference"', 'claimant': 'GPT-5.6 Sol Max (HorizonMath, arXiv 2603.15617v2)',
         'verdict': 'NEEDS DATA', 'kind': 'data-not-public',
         'scope': 'the expressions are not published: the paper says all six discoveries "are detailed in Appendix A", which details three (A.1–A.3), none of these; agreement with a reference to 20 digits would not decide equality in any case'},
    ]
    notDecided = [{'id': 'spinor-norm-integral-i0', 'why': 'the closed form Gamma(1/4)^2/(8 sqrt(pi)) + Gamma(3/4)^2/sqrt(pi) comes with a printed derivation (Landen, then a Beltrami transform, to 2E(1/2) - K(1/2)/2); '
                   'an enclosure of the integral to hundreds of digits, or a check of each step, is not built here yet'}]
    by = {}
    for x in rows:
        by[x['verdict']] = by.get(x['verdict'], 0) + 1
    code = {os.path.relpath(p, ROOT): sha(p) for p in (RR.__file__, KA.__file__)}
    return {'what': 'The discoveries HorizonMath (arXiv 2603.15617v2) credits to frontier models, decided from what its Appendix A prints, by standard-library deciders that share no code with its validators.',
            'generated': time.strftime('%Y-%m-%d'), 'source': {'paper': 'arXiv:2603.15617v2', 'repo': meta['sources']['benchmark']['repo'], 'commit': meta['sources']['benchmark']['commit'],
                                                             'metaSha256': sha(os.path.join(CORPUS, 'meta.json'))},
            'code': code, 'byVerdict': by, 'rows': rows, 'notDecided': notDecided}


def strip(x):
    y = json.loads(json.dumps(x))
    y['generated'] = None
    return y


if __name__ == '__main__':
    L = build()
    if '--check' in sys.argv:
        if strip(json.load(open(OUT))) != strip(L):
            sys.exit('horizonmath-ledger: the ledger is not what the corpus and the deciders give now')
        print('horizonmath-ledger: re-derived, identical (%d rows)' % len(L['rows']))
    else:
        json.dump(L, open(OUT, 'w'), indent=1, ensure_ascii=False)
        open(OUT, 'a').write('\n')
        print('horizonmath-ledger: ' + ', '.join('%d %s' % (v, k) for k, v in sorted(L['byVerdict'].items())))
