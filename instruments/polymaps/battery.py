#!/usr/bin/env python3
"""instruments/polymaps/battery.py — the polynomial-map decisions, gated. Standard library only.

The quick claims (G, F4, F5, the 14- and 18-dimensional fields, the cubic Phi) are re-decided; F6 and F7 (a minute and a
half) are left to the ledger. RED controls: one coefficient of G moved by 1e-6 (the determinant stops being constant);
a term of X14 moved from one component to the next (the nilpotency fails); a coefficient of X14 moved by 1e-6; a
collision witness moved by 1/1000 (the images part); a printed zero moved (it stops being a zero); Phi with one
coefficient moved (det J Phi stops being constant); THE DOOR: a term whose exponent tuple is short by one entry, a
polynomial holding such a term when it is only evaluated (the partial path), a witness point short by one coordinate,
a map with a component missing and a coefficient given as a float are each REFUSED.

Prints: "polymaps battery: N pass, 0 fail, R/R red controls fired". """
import hashlib
import json
import os
import subprocess
import sys
from fractions import Fraction as Fr

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import decide as D  # noqa: E402
from poly import P, det, jac, from_object, points_from  # noqa: E402

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


corpus = os.path.join(ROOT, 'corpus', 'polymaps')
meta = json.load(open(os.path.join(corpus, 'meta.json')))
for f, h in meta['files'].items():
    ok(hashlib.sha256(open(os.path.join(corpus, f), 'rb').read()).hexdigest() == h, 'pin: corpus/polymaps/' + f)
p = subprocess.run([sys.executable, os.path.join(corpus, 'extract.py'), '--check'], capture_output=True, text=True)
ok(p.returncode == 0, 'maps.json is what the pinned TeX gives (' + p.stdout.strip() + ')')

rows = {r['id']: r for r in D.decide(full=False)}
for k in ('gao-g', 'gao-f4', 'gao-f5', 'chv-x14', 'chv-phi', 'chv-xhat18'):
    ok(rows[k]['verdict'] == 'CERTIFIED', 'GREEN: %s re-decides CERTIFIED' % k)
ok(rows['chv-x14']['nilpotencyIndex'] == 14 and rows['chv-xhat18']['nilpotencyIndex'] == 17,
   'the nilpotency indices are 14 and 17 (M^13 and M^16 are not zero): the identities are not vacuous')

maps, _ = D.load_maps()
W = json.load(open(os.path.join(corpus, 'witnesses.json')))
G = maps['G']
g3 = P(3, dict(G[2].t))
k0 = next(iter(g3.t))
g3.t[k0] += Fr(1, 10 ** 6)
red(det(jac([G[0], G[1], g3], 3)).const_value() is None, 'RED: G with one coefficient of g3 moved by 1e-6: det J is no longer constant')
X = maps['X14']
V = [P.var(i, 14) for i in range(14)]
mono = 3 * V[0] ** 2 * V[1] ** 4
bad = list(X)
bad[12] = X[12] + mono
bad[13] = X[13] - mono
red(D.nilpotent(bad, 14) is None, 'RED: X14 with 3x^2y^4 moved from X13 to X14: JX + I is not nilpotent')
bad2 = list(X)
bad2[1] = X[1] + V[0] * V[2] * Fr(1, 10 ** 6)
red(D.nilpotent(bad2, 14) is None, 'RED: X14 with one coefficient moved by 1e-6: not nilpotent')
c = [list(map(Fr, q)) for q in W['collisions']['F4']]
c[1][0] += Fr(1, 1000)
F4 = maps['F4']
red(D.ev(F4, tuple(c[0])) != D.ev(F4, tuple(c[1])), 'RED: an F4 collision witness moved by 1/1000: the images part')
z = [Fr(x) for x in W['zeros']['X14'][1]]
z[5] += Fr(1, 1000)
red(any(v != 0 for v in D.ev(X, tuple(z))), 'RED: a printed zero of X14 moved by 1/1000 is not a zero')
Phi = maps['Phi']
q = P(11, dict(Phi[4].t))
k1 = next(iter(q.t))
q.t[k1] += 1
red(det(jac(Phi[:4] + [q] + Phi[5:], 11)).const_value() != -2, 'RED: Phi with one coefficient moved by 1: det J Phi is no longer -2')



# ---- THE DOOR (2026-11-11): a malformed object is refused before anything reads it, on the path that only evaluates too
def refused(f):
    try:
        f()
    except ValueError as e:
        return str(e).startswith('REFUSED')
    return False


raw = json.load(open(os.path.join(corpus, 'maps.json')))['F4']['comps']
ok([f.t for f in from_object(4, raw)] == [f.t for f in F4], 'GREEN: the door builds F4 as the ledger reads it')
short = json.loads(json.dumps(raw))
short[0][0][0] = short[0][0][0][:-1]
red(refused(lambda: from_object(4, short)), 'RED: a term whose exponent tuple is short by one entry is REFUSED at the door')
held = P(4, dict(F4[0].t))
k2 = next(iter(held.t))
held.t[k2[:-1]] = held.t.pop(k2)
p0 = tuple(Fr(x) for x in W['collisions']['F4'][0])
red(refused(lambda: held.ev(p0)), 'RED: a polynomial holding a short exponent tuple is REFUSED when it is only evaluated (zip read the missing exponent as 0: the partial path)')
red(refused(lambda: F4[0].ev(p0[:-1])) and refused(lambda: points_from(4, [W['collisions']['F4'][0][:-1]])), 'RED: a witness point short by one coordinate is REFUSED')
red(refused(lambda: from_object(4, raw[:-1])), 'RED: a map with a component missing is REFUSED (its Jacobian would not be square)')
asfloat = json.loads(json.dumps(raw))
asfloat[0][0][1] = 0.5
red(refused(lambda: from_object(4, asfloat)), 'RED: a coefficient given as a float is REFUSED (not an exact rational)')

print(f'polymaps battery: {passed} pass, {failed} fail, {fired}/{reds} red controls fired')
sys.exit(1 if failed else 0)
