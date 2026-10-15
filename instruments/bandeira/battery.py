#!/usr/bin/env python3
"""instruments/bandeira/battery.py — the Farkas decider's calibrations and red controls (standard library; seconds).

Calibrations: the claimant's certificate (corpus/bandeira/certificate-v2.json) must be CERTIFIED under the convention its
export states ('none') and must NOT be under the sum-of-squares form ('leftT'), with the scalar and m00 equal under
every convention; our own certificate (corpus/bandeira/certificate-cm.json) must be CERTIFIED under 'leftT'. Red
controls: one multiplier's sign flipped loses a block; y0 moved to 0 loses m00 < 0; the multipliers in reverse order
lose the scalar; a certificate with the wrong number of multipliers is REFUSED, never decided.
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import verify as V

passed = failed = reds = fired = 0


def ok(c, name):
    global passed, failed
    if c: passed += 1
    else: failed += 1; print('FAIL ' + name)


def red(c, name):
    global reds, fired, passed, failed
    reds += 1
    if c: fired += 1; passed += 1
    else: failed += 1; print('RED DID NOT FIRE ' + name)


J = lambda rel: json.load(open(os.path.join(ROOT, rel)))
theirs = J('corpus/bandeira/certificate-v2.json')
ours = J('corpus/bandeira/certificate-cm.json')

rn = V.decide(theirs, 'none'); rl = V.decide(theirs, 'leftT'); rr = V.decide(theirs, 'rightT')
ok(rn['verdict'] == 'CERTIFIED', "the claimant's certificate holds for the SDP without the transpose (their convention)")
ok(rl['verdict'] != 'CERTIFIED' and rr['verdict'] != 'CERTIFIED', "the claimant's certificate does not hold for the sum-of-squares form (either transpose)")
ok(rn['scalar'] == rl['scalar'] == rr['scalar'] == '1417280/1417281' and rn['m00'] == rl['m00'] == '-1060/20438937', 'the scalar and m00 do not depend on the convention and equal the published values')
ok(rn['monomials'] == 3906 and rn['basis'] == 31 and rn['distinctWords'] == 120, '3906 monomials, 31 basis monomials, 120 distinct words')
ro = V.decide(ours, 'leftT')
ok(ro['verdict'] == 'CERTIFIED', 'our own certificate holds for the sum-of-squares form')
ok(all(b['symmetricBeforeAveraging'] for b in ro['blocks']), "our certificate's blocks are symmetric before averaging (phi is reversal-invariant)")

# red controls
import copy
c = copy.deepcopy(ours); c['y_num'][1] = -c['y_num'][1]
red(V.decide(c, 'leftT')['verdict'] != 'CERTIFIED', 'one multiplier with its sign flipped is caught')
c = copy.deepcopy(ours); c['y0'] = [0, 1]
r = V.decide(c, 'leftT'); red(r['verdict'] != 'CERTIFIED' and not r['m00Negative'], 'y0 = 0 loses m00 < 0')
c = copy.deepcopy(ours); c['y_num'] = c['y_num'][::-1]; c['y_den'] = c['y_den'][::-1]
red(V.decide(c, 'leftT')['verdict'] != 'CERTIFIED', 'the multipliers in reverse order are caught')
c = copy.deepcopy(ours); c['y_num'] = c['y_num'][:-1]; c['y_den'] = c['y_den'][:-1]
red(V.decide(c, 'leftT')['verdict'] == 'REFUSED', 'the wrong number of multipliers is refused')
c = copy.deepcopy(theirs); c['y_num'] = [-v for v in c['y_num']]; c['y0'] = [-c['y0'][0], c['y0'][1]]
r = V.decide(c, 'none'); red(r['verdict'] != 'CERTIFIED' and not r['scalarPositive'], 'the negated certificate (the other orientation) is not accepted as written')

print('bandeira battery: %d pass, %d fail, %d/%d red controls fired' % (passed, failed, fired, reds))
sys.exit(1 if failed else 0)
