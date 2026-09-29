#!/usr/bin/env python3
"""instruments/turan/battery.py — the C42 decision, gated. Standard library only.

Anchors: sin and cos at 1/2 against sin^2 + cos^2 = 1; I_1(1/2) = ln 2 (the series sum x^(1+r)/(1+r) = -ln(1-x)).
RED: C lowered to 0.6906536 (below |Y|/D: the limiting inequality fails); alpha moved so |1 - alpha| exceeds C; tau = 1/3
(the construction needs tau > 1/3); a forged enclosure for K the computation does not meet.

Prints: "turan battery: N pass, 0 fail, R/R red controls fired". """
import json
import os
import sys
from fractions import Fraction as Fr

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import c42  # noqa: E402

passed = failed = reds = fired = 0


def ok(c, name):
    global passed, failed
    passed, failed = (passed + 1, failed) if c else (passed, failed + 1)
    if not c:
        print('FAIL ' + name, file=sys.stderr)


def red(c, name):
    global reds, fired, passed, failed
    reds += 1
    if c:
        fired += 1
        passed += 1
    else:
        failed += 1
        print('RED DID NOT FIRE ' + name, file=sys.stderr)


s, c = c42.sincos(c42.Iv.q(Fr(1, 2)))
one = s * s + c * c
ok(one.lo <= 1 <= one.hi, 'anchor: sin^2 + cos^2 = 1 at 1/2')
I1 = c42.I_series(c42.Cx(c42.Iv.q(1), c42.Iv.q(0)), Fr(1, 2), 200)
ln2 = c42.Iv.q(2).ln()
ok(I1.re.lo <= ln2.hi and ln2.lo <= I1.re.hi, 'anchor: I_1(1/2) = ln 2')
P = json.load(open(os.path.join(ROOT, 'corpus', 'optimization-constants', 'c42', 'params.json')))
r = c42.decide(P)
ok(r['verdict'] == 'PARTIAL' and all(ch['ok'] for ch in r['checks']), 'GREEN: the certificate\'s four facts hold (PARTIAL: the asymptotic reduction is prose)')
L = json.load(open(os.path.join(ROOT, 'certs', 'turan-ledger.json')))
ok(L['rows'][0]['ratioUpper'] == r['ratioUpper'], 'the ledger\'s |Y|/D is the one recomputed')


def forged(mut):
    q = json.loads(json.dumps(P))
    mut(q)
    return c42.decide(q)['verdict'] == 'REFUTED'


red(forged(lambda q: q.update(bound='3453268/5000000')), 'RED: C = 0.6906536 is below |Y|/D: the limiting inequality fails')
def movealpha(q):
    q['alpha']['re'] = '50000000/100000000'
    q['s']['re'] = '50000000/100000000'
    q['w']['re'] = str(Fr(q['eta']['re']) - Fr(1, 2))
red(forged(movealpha), 'RED: Re alpha = 1/2 makes |1 - alpha| exceed C')
red(forged(lambda q: q.update(tau='1/3')), 'RED: tau = 1/3 is refused (the construction needs tau > 1/3)')
def forgeK(q):
    q['enclosures']['K']['re'] = ['1/4', '1/4']
red(forged(forgeK), 'RED: a forged enclosure for Re K (exactly 1/4) is not met')
Q = json.load(open(os.path.join(ROOT, 'corpus', 'optimization-constants', 'c42', 'pr184.json')))
g = c42.decide_profile(P['bound'], (P['alpha']['re'], P['alpha']['im']), [P['tau'], str(1 - Fr(P['tau']))], [(P['eta']['re'], P['eta']['im'])])
ok(g['ratioUpper'] == r['ratioUpper'], 'the step-profile form, one block, reproduces the two-block |Y|/D to every printed digit')
q = c42.decide_profile(Q['C'], Q['alpha'], Q['breaks'], Q['eta'])
ok(q['verdict'] == 'PARTIAL' and q['ratioUpper'].startswith('0.68898209850'), 'GREEN: PR #184\'s eight-block certificate holds in its limiting inequality (' + q['ratioUpper'][:14] + ')')
red(c42.decide_profile('0.688982', Q['alpha'], Q['breaks'], Q['eta'])['verdict'] == 'REFUTED', 'RED: PR #184 with C = 0.688982, below its |Y|/D, is refuted')
print(f'turan battery: {passed} pass, {failed} fail, {fired}/{reds} red controls fired')
sys.exit(1 if failed else 0)
