#!/usr/bin/env python3
"""instruments/gnnw/battery.py — the G_AI decision (tools/verify_gnnw_gai.py), gated. Standard library only.

It checks what the decision takes from the paper (Lemma 15's hypotheses for f = F_0.03), checks the verifier's
calculus against central differences and its tail form against the direct slack, re-runs the certificate, and
requires every forgery to be refused: a linear coefficient moved past the edge, a witness M whose slope at 0 is
wrong, a sixth coefficient that lowers F(1) below the slack, an M that reaches 1, and a proposer that lies about
a branch parameter. A green control: GNNW's own proved F_0.03 passes in its own region.

Prints: "gnnw battery: N pass, 0 fail, R/R red controls fired". """
import hashlib
import importlib.util
import json
import math
import os
import sys
from fractions import Fraction as Fr

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
spec = importlib.util.spec_from_file_location('verify_gnnw_gai', os.path.join(ROOT, 'tools', 'verify_gnnw_gai.py'))
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)
Iv = V.Iv

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


def refused(cert):
    try:
        V.certify(cert)
        return False
    except (ArithmeticError, ValueError):
        return True


# ---- the pins
meta = json.load(open(os.path.join(ROOT, 'corpus', 'gnnw', 'meta.json')))
for f, h in meta['files'].items():
    ok(hashlib.sha256(open(os.path.join(ROOT, 'corpus', 'gnnw', f), 'rb').read()).hexdigest() == h, 'pin: corpus/gnnw/' + f)
C = json.load(open(os.path.join(ROOT, 'certs', 'gnnw-certificate.json')))
ok(C['verifier']['sha256'] == hashlib.sha256(open(os.path.join(ROOT, 'tools', 'verify_gnnw_gai.py'), 'rb').read()).hexdigest(),
   'the certificate names the verifier that is on disk')
ok(C['q'] == meta['remark']['q'], 'the certificate\'s q is the remark\'s polynomial as transcribed')

# ---- what the decision takes from the paper: Lemma 15's hypotheses for f = F_0.03
neg = all(V.Fpp_of(V.P03, Iv.span(Fr(k, 1000), Fr(k + 1, 1000))).hi < 0 for k in range(1, 1000))
neg0 = V.Fpp_of(V.P03, Iv.span(Fr(1, 10 ** 9), Fr(1, 1000))).hi < 0
ok(neg and neg0, 'f = F_0.03 is strictly concave on [1e-9, 1]: f\'\' < 0 on 1000 intervals (below 1e-9, -1/(t(1+t)) < -5e8 dominates a bounded e^-t(p\'\' - 2p\' + p))')
pos = all(V.Fp_of(V.P03, Iv.span(Fr(k, 1000), Fr(k + 1, 1000))).lo > 0 for k in range(0 + 1, 1000))
ok(pos, 'f\' > 0 on [0.001, 1] (below, f\' >= ln(1000) - 1)')
ok((2 * V.fprime(V.ONE) - V.F_of(V.P03, V.ONE)).lo > 0, 'log(B(1)/A(1)) = 2f\'(1) - f(1) > 0: with (1+t)f\'\' < 0, A < B on (0, 1]')
ok(V.LN_a.hi < V.LN_b.lo, 'a = A(1) < b = B(1): ' + '%.6f < %.6f' % (math.exp(float(V.LN_a.lo)), math.exp(float(V.LN_b.lo))))

# ---- the verifier's calculus against independent arithmetic
V.Q_AI = [Fr(x) for x in map(lambda s: __import__('decimal').Decimal(s), C['q'])]
N, vals = V.load_m(C['m'])
mf = V.Mfun(N, vals)
worst = 0.0
for x in (0.0137, 0.1, 0.2567, 0.3594, 0.45, 0.6875, 0.93, 0.999):
    j, X, h = int(x * N), Fr(x), Fr(1, 10 ** 7)
    fd = (float(V.slack_point(X + h, mf, j)[0].lo) - float(V.slack_point(X - h, mf, j)[0].lo)) / (2 * float(h))
    d = V.dslack(X, X + Fr(1, 10 ** 12), mf, j)[0]
    worst = max(worst, abs(fd - float(d.lo)))
ok(worst < 1e-7, 'slack\' as written agrees with a central difference of slack at 8 points (worst %.1e)' % worst)
inside = True
for lam in (Fr(1, 1000), Fr(5, 1000), Fr(99, 10000)):
    S = V.S_tail(lam, lam, mf)[0]
    sp = V.slack_point(lam, mf, 0)[0] / Iv.q(lam)
    inside &= S.lo <= sp.hi and sp.lo <= S.hi
ok(inside, 'the tail form (ln l cancelled by hand) meets the direct slack/l at 1e-3, 5e-3, 9.9e-3')
ly = [V.lnY_at(Iv.q(Fr(math.log(x))))[0] for x in (0.1, 0.3, 0.46, 0.5, 0.56, 0.6, 0.9, 0.99)]
ok(all(a.lo > b.hi for a, b in zip(ly, ly[1:])), 'ln Y_f decreases across the three branches (0.1 .. 0.99)')
g1 = sum(Fr(__import__('decimal').Decimal(s)) for s in C['q'])
c_direct = (Iv.q(4) * (Iv.q(g1) * (-V.ONE).exp()).exp())
ok(str(c_direct.lo)[:28] == C['decided']['c'][0][:28] and str(c_direct.hi)[:28] == C['decided']['c'][1][:28],
   'c = e^F(1) = 4 e^{G_AI(1)} computed directly agrees to 27 digits: ' + str(c_direct.lo)[:14])

# ---- GREEN: the certificate, and GNNW's own proved bound in its own region
r = V.certify({'q': C['q'], 'm': C['m']})
ok(r['verdict'] == 'CERTIFIED' and r['stats']['tailIntervals'] == C['decided']['stats']['tailIntervals']
   and r['stats']['mainIntervals'] == C['decided']['stats']['mainIntervals'], 'GREEN: the certificate re-decides CERTIFIED, interval for interval')
ok(not refused({'q': ['-0.25', '0.03', '0.08'], 'm': C['m']}), 'GREEN: F_0.03 (GNNW Theorem 1) passes Theorem 14 in its own Lemma 15 region with this M')

# ---- RED: forgeries refused
f1 = json.loads(json.dumps(C['q']))
f1[0] = '-0.3870'
red(refused({'q': f1, 'm': C['m']}), 'RED: the linear coefficient pushed from -0.3864 to -0.3870 (past the tail\'s edge) is refused')
m2 = json.loads(json.dumps(C['m']))
m2['m0'] = '1.2'
red(refused({'q': C['q'], 'm': m2}), 'RED: a witness M with slope 1.2 at 0 (the optimum is 1.5057) is refused on the tail')
f3 = json.loads(json.dumps(C['q']))
f3[5] = '0.4502'
red(refused({'q': f3, 'm': C['m']}), 'RED: the sixth coefficient lowered by 0.002 (F(1) down by 7.4e-4, past the slack at 1) is refused')
m4 = json.loads(json.dumps(C['m']))
m4['values'][-1] = '1.2'
red(refused({'q': C['q'], 'm': m4}), 'RED: an M that reaches 1.2 at l = 1 (outside (0, 1)) is refused')
real = V._fsolve
V._fsolve = lambda fun, target, inc: 0.5
try:
    V.lnY_at(Iv.q(Fr(math.log(0.9))))
    lied = False
except ArithmeticError:
    lied = True
V._fsolve = real
red(lied, 'RED: a float proposer that puts the branch parameter at 0.5 is refused by the interval bracket')

print(f'gnnw battery: {passed} pass, {failed} fail, {fired}/{reds} red controls fired')
sys.exit(1 if failed else 0)
