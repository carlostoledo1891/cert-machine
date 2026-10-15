#!/usr/bin/env python3
"""instruments/optq/battery.py — calibrations and red controls of the PR-queue deciders (standard library; seconds — the
big constructions are decided by the ledger, not here)."""
import json, os, subprocess, sys
from fractions import Fraction as F
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import stepfun, exact226

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


# Kronecker product against schoolbook on random integer sequences
import random
rng = random.Random(11); agree = True
for t in range(30):
    n = rng.randrange(1, 40); a = [rng.randrange(0, 10 ** 9) for _ in range(n)]; b = [rng.randrange(0, 10 ** 9) for _ in range(rng.randrange(1, 40))]
    school = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        for j, y in enumerate(b): school[i + j] += x * y
    agree = agree and stepfun.product_coefficients(a, b) == school
ok(agree, 'Kronecker products equal schoolbook on 30 random sequences')
# 1a on the constant function: f = 1 on n steps gives max (f*f)/(∫f)^2 = 2n·n/n^2 = 2
r = stepfun.decide('1a', [F(1)] * 64); ok(r['value'] == '2', 'the constant step function has autocorrelation ratio exactly 2')
red(stepfun.decide('1a', [F(1)] * 10 + [F(-1, 2)])['verdict'] == 'REFUSED', 'a negative height is refused')
# 1b on h = 1 on the left half, 0 on the right: sup ∫ h g(·+s) = 1 (at the shift aligning the halves)
h = [F(1)] * 32 + [F(0)] * 32; r = stepfun.decide('1b', h); ok(r['value'] == '1', 'the half-step h has overlap value exactly 1')
red(stepfun.decide('1b', [F(1)] * 33 + [F(0)] * 31)['verdict'] == 'REFUSED', 'Σh ≠ n/2 is refused')
red(stepfun.decide('1b', [F(3, 2)] + [F(1)] * 30 + [F(0)] * 33)['verdict'] == 'REFUSED', 'a height above 1 is refused')
# the claim direction: an upper bound exhibited; a claimed value below the function's value is REFUTED
red(stepfun.decide('1a', [F(1)] * 64, '1.9')['verdict'] == 'REFUTED', 'claiming C_1a <= 1.9 from a function at ratio 2 is refuted')
# two-law driver: the pinned certificate certifies; a mutated copy does not
cert = os.path.join(ROOT, 'corpus', 'optconst-queue', 'sources', 'zenodo-23289305', 'certificate.json')
js = lambda path, claim: json.loads(subprocess.run(['node', os.path.join(HERE, 'twolaw.js'), path, claim], capture_output=True, text=True).stdout.strip().splitlines()[-1])
ok(js(cert, '1.674894211307116')['verdict'] == 'CERTIFIED', 'the two-law certificate certifies its claim')
red(js(cert, '1.6749')['verdict'] == 'REFUTED', 'a claim above the enclosure (1.6749) is refuted')
import tempfile
c = json.load(open(cert)); c['laws'][0]['weights'][0][0] = str(int(c['laws'][0]['weights'][0][0]) + 1)
with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as f: json.dump(c, f); bad = f.name
out = subprocess.run(['node', os.path.join(HERE, 'twolaw.js'), bad, '1.6'], capture_output=True, text=True)
red('REFUSED' in (out.stdout + out.stderr), 'weights that do not sum to 1 are refused')
c = json.load(open(cert)); c['base'] = 50
with open(bad, 'w') as f: json.dump(c, f)
red(js(bad, '1.6')['verdict'] == 'REFUSED', 'base 50 (max |L| = 27 > 24) is refused: the digit map is not injective')
os.unlink(bad)
# #226
ok(exact226.decide_20a()['verdict'] == 'CERTIFIED' and exact226.decide_20c()['verdict'] == 'CERTIFIED', '20a and 20c decide')
m = exact226.central_moments_of_E_minus_1(); red(m[2] == 1 and (m[4] - m[2] ** 2) != 9, 'Var(X^2) is 8, not 9: the claimant\'s E(E-1)^4 - 1 is read as 9 - 1')
print('optq battery: %d pass, %d fail, %d/%d red controls fired' % (passed, failed, fired, reds))
sys.exit(1 if failed else 0)
