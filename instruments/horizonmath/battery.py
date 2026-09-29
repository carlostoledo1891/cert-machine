#!/usr/bin/env python3
"""instruments/horizonmath/battery.py — the HorizonMath deciders, gated. Standard library only.

GREEN controls are pairs known to lie in R (the Erdos–Szekeres points (x, 1 - x), Observation 10(1), and the
points GNNW's Lemma 16(1) uses): the region decider must never place one outside R, nor say the problem's own bound
fails to place it. RED controls must fire: a pair the problem's rule accepts and R cannot contain; the certificate's
own pair at l = 1; a float proposer that lies, which the interval check must overrule; a forged printed area; a
construction whose area is not below the baseline.

Prints: "horizonmath battery: N pass, 0 fail, R/R red controls fired". """
import hashlib
import json
import math
import os
import subprocess
import sys
from decimal import Decimal
from fractions import Fraction as Fr

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
CORPUS = os.path.join(ROOT, 'corpus', 'horizonmath')
sys.path.insert(0, HERE)
import ramsey_region as RR  # noqa: E402
import kakeya_area as KA  # noqa: E402

passed = failed = reds = fired = 0


def ok(cond, name):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print('FAIL ' + name, file=sys.stderr)


def red(cond, name):
    global reds, fired, passed, failed
    reds += 1
    if cond:
        fired += 1
        passed += 1
    else:
        failed += 1
        print('RED DID NOT FIRE ' + name, file=sys.stderr)


# ---- the corpus is the pinned bytes, and the certificate is what the printed recipe gives
meta = json.load(open(os.path.join(CORPUS, 'meta.json')))
for f, h in meta['files'].items():
    ok(hashlib.sha256(open(os.path.join(CORPUS, f), 'rb').read()).hexdigest() == h, 'pin: ' + f)
p = subprocess.run([sys.executable, os.path.join(CORPUS, 'rebuild_ramsey_a3.py'), '--check'], capture_output=True, text=True)
ok(p.returncode == 0, 'the certificate is the one the printed recipe rebuilds (' + p.stdout.strip() + ')')

# ---- the arithmetic
half_ln2 = Fr(346573590279972654708616060729, 10 ** 30)          # ln 2 / 2 = 0.34657359027997265470861606072908...
lo = RR.erdos_rate(1, Fr(1, 2))
ok(half_ln2 - Fr(1, 10 ** 29) < Fr(lo) <= half_ln2 + Fr(1, 10 ** 29), 'Erdos at e = 1, p = 1/2 is R(k,k) >= 2^(k/2): the rate encloses ln2/2 (' + str(lo)[:20] + ')')
eU1 = (-RR.U_at(Fr(1))).exp()
ok(abs(float(eU1.lo) - 0.26292278641656774) < 1e-15, 'e^-U(1) is the problem\'s printed c_hyp 0.26292278641656774')
u = [float(RR.U_at(Fr(i, 50)).lo) for i in range(1, 51)]
ok(all(a < b for a, b in zip(u, u[1:])), 'U increases on (0, 1] (sampled; proved in the module: U\' >= ln 2 - 1/4)')

# ---- GREEN: points in R are never placed outside it, and the problem's own bound places them
es_bad = []
for j in range(1, 100):
    x = Fr(j, 100)
    nlx = -(RR.Iv.q(x).ln())
    if RR.decide_outside(nlx, 1 - x) or RR.decide_not_placed(nlx, 1 - x):
        es_bad.append(j)
ok(not es_bad, 'GREEN: the 99 Erdos–Szekeres pairs (j/100, 1 - j/100) are neither excluded from R nor left unplaced by U (' + str(es_bad[:5]) + ')')
gn_bad = []
G08 = [Fr(-1, 4), Fr(8, 100), Fr(8, 100)]            # GNNW Lemma 16(1): F_0.08, M0 = l e^-l, Y0 = 1 - X0
for i in range(1, 41):
    lam = Fr(i, 40)
    M0 = Fr(Decimal(math.exp(-i / 40)) * Decimal(i) / 40)   # a rational stand-in for l e^-l: any M in (0,1) gives a pair (X, 1 - X) on the ES curve
    nlx = RR.neg_ln_X(lam, M0, G08)
    X = (-nlx).exp()
    y = 1 - Fr(X.hi)                                   # at or below 1 - X: inside R by Observation 10(1)-(2)
    if RR.decide_outside(nlx, y):
        gn_bad.append(i)
ok(not gn_bad, 'GREEN: GNNW Lemma 16(1)\'s points (X0, 1 - X0) at 40 values of l are never excluded (' + str(gn_bad[:5]) + ')')

# ---- RED: what R cannot contain is excluded
strip = Fr(eU1.lo) - Fr(1, 10 ** 6)
nls = -(RR.Iv.q(strip).ln())
red(RR.decide_outside(nls, Fr(9999, 10000)) is not None, 'RED: (e^-U(1) - 1e-6, 0.9999) — accepted by the problem\'s rule — is excluded from R')
r = RR.decide(CORPUS)
red(r['verdict'] == 'REFUTED' and r['rows'][-1]['lambda'] == 1.0 and r['rows'][-1]['outsideR'] is not None,
    'RED: the certificate\'s pair at l = 1 is excluded from R, so the certificate is REFUTED')
ok(all(c['ok'] for c in r['checks']), 'the certificate\'s three checks: c is the printed constant, the problem\'s rule accepts, R excludes (' + str([c['ok'] for c in r['checks']]) + ')')
ok(r['points'] == 201 and r['outsideR'] + r['notPlacedByU'] + r['notRefutedHere'] == 201, 'the 200 intervals and l = 1 are all classified (%d outside R, %d not placed by U, %d not refuted)' % (r['outsideR'], r['notPlacedByU'], r['notRefutedHere']))

# a proposer that lies is overruled: claim a huge gap for an Erdos–Szekeres pair
real = RR.propose_outside
RR.propose_outside = lambda a, b: (1.0, 0.5, 0.3, 'k=em')
lie = RR.decide_outside(-(RR.Iv.q(Fr(1, 2)).ln()), Fr(1, 2))
RR.propose_outside = real
red(lie is None, 'RED: a float proposer that claims (1/2, 1/2) is outside R is overruled by the interval check')
real = RR.propose_not_placed
RR.propose_not_placed = lambda a, b: (1.0, 0.5, '-ln x - s ln y')
lie = RR.decide_not_placed(-(RR.Iv.q(Fr(1, 2)).ln()), Fr(1, 2))
RR.propose_not_placed = real
red(lie is None, 'RED: a float proposer that claims U fails at (1/2, 1/2) is overruled')

# ---- Kakeya: the exact area, and its forges
k = KA.decide(CORPUS)
ok(k['verdict'] == 'CERTIFIED' and k['area']['decimal'].startswith('0.10914798918224516369'), 'the union area is exactly ' + k['area']['decimal'] + '..., CERTIFIED below the baseline')
q, d = KA.load(CORPUS)
A, _ = KA.area(q)
ok(Fr(int(k['area']['num']), int(k['area']['den'])) == A, 'the ledger\'s rational is the area recomputed')
riemann = 0.0
for j in range(4000):
    x = Fr(2 * j + 1, 8000)
    riemann += float(KA.union_length(q, x))
ok(abs(riemann / 4000 - float(A)) < 1e-7, 'a 4000-point midpoint sum agrees to 1e-7 (a consistency check, not the authority)')
tmp = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'horizon-battery-%d' % os.getpid())
os.makedirs(tmp, exist_ok=True)
for name, mut in (('printed area moved one unit in its last digit', lambda d: d.update(printedArea='0.1091479893')),
                  ('every intercept 0: the fan of triangles, far above the baseline', lambda d: d.update(intercepts=['0.0'] * 128))):
    dd = json.loads(json.dumps(d))
    mut(dd)
    json.dump(dd, open(os.path.join(tmp, 'kakeya-a2-intercepts.json'), 'w'))
    red(KA.decide(tmp)['verdict'] != 'CERTIFIED', 'RED: ' + name + ' is not certified')
dd = json.loads(json.dumps(d))
dd['intercepts'][5] = '0.0000001'
json.dump(dd, open(os.path.join(tmp, 'kakeya-a2-intercepts.json'), 'w'))
try:
    KA.decide(tmp)
    red(False, 'RED: an intercept off the 1/1024 grid is refused')
except ValueError:
    red(True, 'RED: an intercept off the 1/1024 grid is refused')

import shutil  # noqa: E402
shutil.rmtree(tmp, ignore_errors=True)
print(f'horizonmath battery: {passed} pass, {failed} fail, {fired}/{reds} red controls fired')
sys.exit(1 if failed else 0)
