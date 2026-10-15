#!/usr/bin/env python3
"""instruments/aerp/battery.py — the AlphaEvolve-repository deciders' calibrations and red controls (standard library;
seconds). Calibrations on the repository's own constructions and on the small claims; red controls plant one violation
of each kind. The two P60 deciders (5-subset determinants, 4-subset hyperplane keys) must agree on every set here.
"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import p59, p60, p61, p42
from fractions import Fraction as F

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


SRC = os.path.join(ROOT, 'corpus', 'aerp', 'sources')
J = lambda rel: json.load(open(os.path.join(SRC, rel)))

# P60: notebook controls n = 7, 8 (both deciders), the #4 set, planted violations
nb = json.load(open(os.path.join(SRC, 'notebooks', 'no_5_on_a_sphere.ipynb')))
code = ''.join(''.join(c['source']) for c in nb['cells'] if c['cell_type'] == 'code')
for n in (7, 8):
    m = re.search(r'construction_n_%d_%d_%d\s*=\s*(\[.*?\])\s*\n' % (n, n, n), code, re.S)
    pts = [tuple(int(t) for t in re.findall(r'-?\d+', it)) for it in re.findall(r'\(([^()]*)\)', m.group(1))]
    r = p60.decide(pts, n, want_reference=True)
    ok(r['verdict'] == 'CERTIFIED' and r['reference']['ok'] and r['keyed']['ok'], 'notebook n=%d admissible under both deciders' % n)
    ok(p60.keyed_python(pts)[0] is True, 'the pure-Python keyed decider agrees on n=%d' % n)
b4 = J('issues/issue-4.json')['body']; pts4 = p60.load_points(json.loads(re.search(r'```json\s*(\[\[.*?\]\])\s*```', b4, re.S).group(1)))
r = p60.decide(pts4, 13, want_reference=True)
ok(r['verdict'] == 'CERTIFIED' and r['reference']['minAbsDet'] == 2, '#4: 36 points at n=13, min |det| = 2 (as the claimant prints)')
red(p60.decide(pts4[:20] + [(0, 0, 0), (1, 0, 0), (2, 0, 0), (0, 1, 0), (0, 2, 0)], 13, True)['verdict'] == 'REFUTED', 'five coplanar points planted are caught (both deciders)')
red(p60.decide(pts4[:20] + [(1, 1, 1), (1, 1, 3), (1, 3, 1), (3, 1, 1), (1, 1, 1 + 0)][:24] + [(2, 2, 2), (0, 2, 2), (2, 0, 2), (2, 2, 0), (0, 0, 2)], 13, True)['verdict'] == 'REFUTED', 'five cospherical points planted are caught')
red(p60.decide(pts4 + [(13, 0, 0)], 13, False)['verdict'] == 'REFUTED', 'a point outside the grid is refused')
red(p60.decide(pts4 + [pts4[0]], 13, False)['verdict'] == 'REFUTED', 'a repeated point is refused')
# the two deciders agree on a random perturbation that creates a violation and on one that does not
import random
rng = random.Random(7)
agree = True
for trial in range(6):
    s = [tuple(rng.randrange(0, 9) for _ in range(3)) for _ in range(14)]
    s = list(dict.fromkeys(s))
    k = p60.keyed_python(s)[0]; rr = p60.reference(s)[0]
    agree = agree and (k == rr)
ok(agree, 'keyed and determinant deciders agree on six random 9^3 sets')

# P59
b10 = J('issues/issue-10.json')['body']
m = re.search(r'set_a\s*=\s*(\[.*?\])\s*\n', b10, re.S); pts = [tuple(int(t) for t in re.findall(r'-?\d+', it)) for it in re.findall(r'\(([^()]*)\)', m.group(1))]
r = p59.decide(pts, 32, check_maximal=False); ok(r['verdict'] == 'CERTIFIED' and r['size'] == 58, '#10 set_a: 58 points, no isosceles triple')
red(p59.decide(pts + [(0, 6)], 32, False)['verdict'] == 'REFUTED', 'a planted point making an isosceles triple is caught')
red(p59.decide([(0, 0), (2, 0), (4, 0)], 5, False)['verdict'] == 'REFUTED', 'the collinear midpoint case is an isosceles triple')
ok(p59.decide([(0, 0), (1, 0), (3, 0)], 5, False)['verdict'] == 'CERTIFIED', 'three collinear points with distinct distances are allowed')

# P61
u = [F(a, 16) for a in [6, 3, 12, 8, 2, 11, 4, 5, 12, 8, 2, 13, 2, 12]]; v = [F(b, 16) for b in [2, 13, 2, 8, 12, 5, 4, 11, 2, 8, 12, 3, 6, 4]]
r = p61.decide(u, v, '9/8')
ok(r['alphaFull'] == '9/8' and r['alphaNotebook'] == '3/4' and r['alphaPaddedNotebook'] == '9/8', '#12 m=14: 9/8 under k=1..m, 3/4 under the notebook, 9/8 padded')
red(not p61.decide(u, v, '47/42')['holdsFull'], 'a value the instance does not attain is not certified')
red(not p61.decide(u, [F(15, 16)] + v[1:], '9/8')['admissible'], 'u + v > 1 is refused')
ok(p61.decide([F(1, 2)] * 4, [F(1, 2)] * 4, '1')['alphaNotebook'] == '1', 'the trivial m=4 instance has alpha = 1 (the MILP optimum #11 reports)')

# P42
B = [0, 1, 3]; r = p42.decide_set(B); ok((r['sumset'], r['differenceSet']) == (6, 7), 'bitset sumsets: {0,1,3} has |A+A| = 6, |A-A| = 7')
ok(p42.exceeds(1367, 1163, 309, '1121/1000') and not p42.exceeds(1367, 1163, 309, '1122/1000'), 'g > c decided as an integer inequality brackets the notebook value 1.12194')
A, meta = p42.far_block(L=5000); r = p42.decide_set(A); ok(r['sumset'] > 0 and meta['q'] == 59, 'the far-block rule builds at L = 5000 (q = 59)')
red(p42.exceeds(r['sumset'], r['differenceSet'], r['size'], '1163/1000') is False, 'the far-block set at L = 5000 does NOT reach 1.163 (the claim needs L = 100000)')

print('aerp battery: %d pass, %d fail, %d/%d red controls fired' % (passed, failed, fired, reds))
sys.exit(1 if failed else 0)
