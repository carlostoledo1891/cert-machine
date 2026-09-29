#!/usr/bin/env python3
"""instruments/fei/battery.py — the C71 decision, gated. Standard library only.

GREEN: the published n = 18 artifact certifies; Maj3 (C >= H/I = 4... the anchor I = 3/2, H = 2) is computed exactly. RED:
a truth table with one bit flipped (the sha256 binding fails, and it is no longer balanced); a threshold one unit above the
enclosure's lower end at the 40th digit (not certified); a claimed I moved by 1/128; a table whose influence is 1 (the
amplification rule does not apply, refused).

Prints: "fei battery: N pass, 0 fail, R/R red controls fired". """
import json
import os
import sys
from decimal import Decimal
from fractions import Fraction as Fr

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import fei  # noqa: E402

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


art = json.load(open(os.path.join(ROOT, 'corpus', 'optimization-constants', 'num2026', 'fei_c71_n18_artifact.json')))
r = fei.decide(art, '6.521845710923046575', art['record_dec'])
ok(r['verdict'] == 'CERTIFIED' and r['I'] == '261/128' and r['nonzero'] == 2770 and r['distinctWeights'] == 10, 'GREEN: the n = 18 artifact certifies (I = 261/128, 2,770 nonzero weights, 10 distinct)')
led = json.load(open(os.path.join(ROOT, 'certs', 'fei-ledger.json')))
ok(led['rows'][0]['ratio'] == r['ratio'], 'the ledger\'s enclosure is the one recomputed')
# Maj3 on {-1,1}^3: weights 1/4 on each singleton and on the full set; I = 3/2, H = 2
t = [1 if bin(x).count('1') < 2 else -1 for x in range(8)]
a = fei.wht(t)
I = Fr(sum(v * v * bin(S).count('1') for S, v in enumerate(a)), 64)
ok(I == Fr(3, 2) and sorted(abs(v) for v in a if v) == [4, 4, 4, 4], 'anchor: majority of three has I = 3/2 and four weights of 1/4 (H = 2)')
flip = dict(art)
m = int(art['true_hex'], 16) ^ 1
flip['true_hex'] = format(m, 'x')
rf = fei.decide(flip, '6.521845710923046575')
red(rf['verdict'] != 'CERTIFIED', 'RED: one bit of the truth table flipped is not certified (binding and balance fail)')
lo = Decimal(r['ratio'][0])
above = str(lo + Decimal('1e-40'))
red(fei.decide(art, above)['verdict'] != 'CERTIFIED', 'RED: a threshold 1e-40 above the enclosure\'s lower end is not certified')
wrong = dict(art)
wrong['I'] = str(Fr(261, 128) + Fr(1, 128))
red(fei.decide(wrong, '6.521845710923046575')['verdict'] != 'CERTIFIED', 'RED: a claimed influence moved by 1/128 is not certified')
dict1 = {'n': '2', 'true_hex': format(sum(1 << x for x in range(4) if x & 1), 'x'), 'sha256_table': '', 'I': '1', 'ratio_lo_dec': '0', 'ratio_hi_dec': '0'}
try:
    fei.decide(dict1, '1')
    refused = False
except ArithmeticError:
    refused = True
red(refused, 'RED: a dictator (I = 1) is refused: the amplification rule needs I > 1')
print(f'fei battery: {passed} pass, {failed} fail, {fired}/{reds} red controls fired')
sys.exit(1 if failed else 0)
