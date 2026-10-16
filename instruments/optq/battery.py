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
# #226 16a and 70a (decided 2026-10-16): closed forms as calibrations, the claim grammar as red controls
import bgw16a, rbm70a, ivdec
from decimal import Decimal
down, up, even = ivdec.contexts(60); pi_lo, pi_hi = ivdec.pi_iv(60)
q35 = Decimal(1).scaleb(-35)  # π truncated at 35 places; both ends of the interval truncate to the same digits and the width is below 10^-60
ok(down.quantize(pi_lo, q35) == Decimal('3.14159265358979323846264338327950288') == down.quantize(pi_hi, q35) and pi_lo < pi_hi and up.subtract(pi_hi, pi_lo) < Decimal('1e-60'), 'the Machin interval encloses π: 35 digits agree, width below 1e-60')
b1 = bgw16a.decide(1, F(41, 5), '1.27')  # the four lattice points |k| = 1: δ = 1 exactly and L >= 4/π exactly
fp_lo, fp_hi = down.divide(4, pi_hi), up.divide(4, pi_lo)
ok(not (Decimal(b1['enclosure'][1]) < fp_lo or Decimal(b1['enclosure'][0]) > fp_hi) and (fp_hi - fp_lo) < Decimal('1e-50'), '16a at K = 1 encloses the closed form 4/π')
red(b1['verdict'] == 'REFUSED' and not b1['deltaAtLeast1'], 'K = 1 sits on δ = 1: the enclosure does not establish δ >= 1, so it is REFUSED although the number exceeds the claim')
b2 = bgw16a.decide(2, F(41, 5), '1.0'); ok(b2['verdict'] == 'CERTIFIED' and b2['deltaAtLeast1'], '16a at K = 2 (δ > 1) certifies a claim below its enclosure')
red(bgw16a.decide(2, F(41, 5), str(Decimal(b2['enclosure'][1]) + Decimal('0.001')))['verdict'] == 'REFUTED', 'a 16a claim above the enclosure is REFUTED')
for t in (F(13, 1000), F(7, 4)):
    lo, hi, _, _ = rbm70a.bound(2, t); c_lo, c_hi = rbm70a.closed_form_n2(t)
    ok(not (hi < c_lo or lo > c_hi) and (hi - lo) < Decimal('1e-45'), '70a at n = 2, t = %s agrees with √(t² + 4t + π)/(t + √π)' % t)
r2 = rbm70a.decide(2, F(7, 4), '1.0315'); ok(r2['verdict'] == 'CERTIFIED', '70a at n = 2, t = 7/4 certifies 1.0315')
red(rbm70a.decide(2, F(7, 4), '1.0316')['verdict'] == 'REFUTED', 'a 70a claim above the enclosure (1.0316 at n = 2, t = 7/4) is REFUTED')
r10 = rbm70a.decide(10, F(13, 1000), '1.0'); r100 = rbm70a.decide(100, F(13, 1000), '1.0')
ok(Decimal(r2['enclosure'][0]) > 1 and Decimal(r10['enclosure'][0]) > 1 and Decimal(r100['enclosure'][0]) > Decimal(r10['enclosure'][1]), '70a bounds exceed the trivial 1 and grow from n = 10 to n = 100 at a/r = 13/1000')
print('optq battery: %d pass, %d fail, %d/%d red controls fired' % (passed, failed, fired, reds))
sys.exit(1 if failed else 0)
