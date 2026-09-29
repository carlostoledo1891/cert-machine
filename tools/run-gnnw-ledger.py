#!/usr/bin/env python3
"""run-gnnw-ledger.py — Gupta, Ndiaye, Norin and Wei's "preliminary, unverified" iteration (arXiv 2407.19026v2), decided.
Writes certs/gnnw-certificate.json — the claim's polynomial as the paper prints it, the witness M this program chose,
and the decision of tools/verify_gnnw_gai.py on them — and `--check` re-derives it and refuses on any difference.

The corpus is corpus/gnnw: meta.json (the paper pinned by sha256, the remark transcribed, the results of the paper
this decision uses) and m-nodes.json (the witness). The verifier is one standard-library file that anyone can run on
the certificate: python3 verify/verify_gnnw_gai.py certs/gnnw-certificate.json.

usage: python3 tools/run-gnnw-ledger.py [--check]"""
import hashlib
import importlib.util
import json
import os
import sys
import time

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CORPUS = os.path.join(ROOT, 'corpus', 'gnnw')
OUT = os.path.join(ROOT, 'certs', 'gnnw-certificate.json')
VERIFIER = os.path.join(ROOT, 'tools', 'verify_gnnw_gai.py')


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def verifier():
    spec = importlib.util.spec_from_file_location('verify_gnnw_gai', VERIFIER)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def build():
    meta = json.load(open(os.path.join(CORPUS, 'meta.json')))
    for f, h in meta['files'].items():
        if sha(os.path.join(CORPUS, f)) != h:
            sys.exit('gnnw-ledger: ' + f + ' is not the pinned bytes')
    mn = json.load(open(os.path.join(CORPUS, 'm-nodes.json')))
    cert = {'q': meta['remark']['q'], 'm': {'N': mn['N'], 'm0': mn['m0'], 'values': mn['values']}}
    V = verifier()
    t0 = time.time()
    r = V.certify(cert)
    secs = time.time() - t0
    # the figure's curve: slack/l at 160 points, each an interval lower end (the tail form below 1/N)
    from fractions import Fraction as Fr
    N, vals = V.load_m(cert['m'])
    mf = V.Mfun(N, vals)
    curve = []
    for i in range(40):
        lam = Fr(10) ** (-8 + Fr(i, 7)) if i < 42 else None
        if lam >= Fr(1, N):
            break
        curve.append([float(lam), float(V.S_tail(lam, lam, mf)[0].lo)])
    for i in range(1, 121):
        lam = Fr(1, N) + (1 - Fr(1, N)) * Fr(i, 120)
        j = min(int(lam * N), N - 1)
        curve.append([float(lam), float((V.slack_point(lam, mf, j)[0] / V.Iv.q(lam)).lo)])
    printed = meta['remark']['printedBase']
    c_lo = r['c'][0]
    from decimal import Decimal, ROUND_HALF_EVEN, ROUND_DOWN
    q = Decimal(printed)
    printed_is = ('its truncation' if Decimal(c_lo).quantize(q, rounding=ROUND_DOWN) == q else
                  'its rounding' if Decimal(c_lo).quantize(q, rounding=ROUND_HALF_EVEN) == q else 'neither')
    return {
        'what': 'The iteration GNNW v2 prints as "preliminary, unverified" (G_AI, proposed by ChatGPT 5.6 Sol), decided: Theorem 14 of the same paper checked on all of (0, 1] '
                'for F = h + G_AI, with a continuous M chosen here and Y = Y_f(X) from Lemma 15 for the proved bound f = F_0.03 of Theorem 1. The conclusion is the paper\'s: '
                'R(k, l) <= e^{F(l/k)k + o(k)} for k >= l, so R(k, k) <= c^(k+o(k)), c = e^F(1). Re-run: python3 verify/verify_gnnw_gai.py certs/gnnw-certificate.json',
        'generated': time.strftime('%Y-%m-%d'),
        'source': {'paper': 'arXiv:2407.19026v2', 'sha256': meta['source']['sha256'], 'remark': meta['remark']['text'], 'uses': meta['usedFromThePaper']},
        'q': cert['q'], 'm': cert['m'],
        'mWhat': mn['what'],
        'verifier': {'file': 'tools/verify_gnnw_gai.py', 'sha256': sha(VERIFIER)},
        'curve': {'what': 'slack(l)/l at sample points, the lower end of an interval enclosure each (for the page\'s figure; the decision is the intervals, not these points)', 'points': curve},
        'decided': {'verdict': r['verdict'], 'claim': r['claim'], 'c': r['c'], 'printedBase': printed,
                    'printedDigitsHold': printed_is != 'neither', 'printedIs': printed_is, 'stats': r['stats'], 'seconds': round(secs, 1)},
    }


def strip(x):
    y = json.loads(json.dumps(x))
    y['generated'] = None
    y['decided']['seconds'] = None
    return y


if __name__ == '__main__':
    L = build()
    if L['decided']['verdict'] != 'CERTIFIED' or not L['decided']['printedDigitsHold']:
        sys.exit('gnnw-ledger: the decision is not the certified one the record describes: ' + json.dumps(L['decided'])[:300])
    if '--check' in sys.argv:
        if strip(json.load(open(OUT))) != strip(L):
            sys.exit('gnnw-ledger: the certificate is not what the corpus and the verifier give now')
        print('gnnw-ledger: re-derived, identical (CERTIFIED, c = %s…)' % L['decided']['c'][0][:14])
    else:
        json.dump(L, open(OUT, 'w'), indent=1, ensure_ascii=False)
        open(OUT, 'a').write('\n')
        print('gnnw-ledger: CERTIFIED, c in [%s, %s] (%d + %d intervals, %.1f s)' % (L['decided']['c'][0][:20], L['decided']['c'][1][:20],
              L['decided']['stats']['tailIntervals'], L['decided']['stats']['mainIntervals'], L['decided']['seconds']))
