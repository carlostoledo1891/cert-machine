#!/usr/bin/env python3
"""instruments/fei/battery.py — the C71 decision, gated. Standard library only.

GREEN: the published n = 18 artifact certifies with every check CERTIFIED (I = 261/128, 2,770 nonzero weights, 10
distinct); the ledger's enclosure is the one recomputed; the printed enclosure CONTAINS the value (its lower end below
and its upper end above H/(I-1) evaluated here at 110 digits from the same spectrum — the print is outward, not a
truncation); a bar 10^-50 below the value certifies; majority of three (H = 2, I = 3/2, log2 of a power of two exact,
so H/(I-1) = 4 exactly) certifies against 4 - 10^-30.

RED — each must come out with the stated word FOR the stated reason (asserted on 'why'):
  one bit of the truth table flipped              REFUSED, the sha256 binding fails;
  a bar 1e-40 above the enclosure's lower end     REFUTED, the bar is above r_hi;
  a bar within 1e-80 of the value                 REFUSED, the enclosure straddles it (the third word);
  a claimed influence moved by 1/128              REFUSED, the artifact's stated I is not its table's;
  a dictator (balanced, I = 1, H = 0)             REFUSED because I <= 1 — returned, not raised, and the I > 1 test
                                                  is reached (log2 4 is exact, so no 'weight above 1');
  majority of three against 4 itself              REFUTED: the strict bound fails at equality, decided exactly;
  ln_iv at k = 0 and k = -3                       refused (ValueError), outside the positive integers.

Prints: "fei battery: N pass, 0 fail, R/R red controls fired". """
import hashlib
import json
import os
import sys
from decimal import Decimal, Context, ROUND_HALF_EVEN
from fractions import Fraction as Fr

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import fei  # noqa: E402

passed = failed = reds = fired = 0
THR = '6.521845710923046575'


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


def came(r, word, why_has):
    return r['verdict'] == word and why_has in (r['why'] or '')


art = json.load(open(os.path.join(ROOT, 'corpus', 'optimization-constants', 'num2026', 'fei_c71_n18_artifact.json')))
r = fei.decide(art, THR, art['record_dec'])
ok(r['verdict'] == 'CERTIFIED' and r['why'] is None and all(c['verdict'] == 'CERTIFIED' for c in r['checks']) and r['I'] == '261/128'
   and r['nonzero'] == 2770 and r['distinctWeights'] == 10, 'GREEN: the n = 18 artifact certifies, every check CERTIFIED (I = 261/128, 2,770 nonzero weights, 10 distinct)')
led = json.load(open(os.path.join(ROOT, 'certs', 'fei-ledger.json')))
ok(led['rows'][0]['ratio'] == r['ratio'] and led['rows'][0]['H'] == r['H'], 'the ledger\'s enclosure is the one recomputed')

# the value at 110 digits, here, from the same spectrum: a reference to place bars against, not a decision
X = Context(prec=110, rounding=ROUND_HALF_EVEN)
n = 18
a = fei.wht(fei.table(n, art['true_hex']))
counts = {}
for v in a:
    if v:
        counts[abs(v)] = counts.get(abs(v), 0) + 1
l2 = X.ln(Decimal(2))
H = Decimal(0)
for k, c in counts.items():                       # every operation in the 110-digit context (sum() would use the default 28)
    H = X.add(H, X.multiply(X.divide(Decimal(c * k * k), Decimal(4 ** n)), X.subtract(Decimal(2 * n), X.multiply(Decimal(2), X.divide(X.ln(Decimal(k)), l2)))))
den = Fr(r['I']) - 1
R = X.divide(X.multiply(H, Decimal(den.denominator)), Decimal(den.numerator))
ok(Decimal(r['ratio'][0]) < R < Decimal(r['ratio'][1]) and Decimal(r['H'][0]) < H < Decimal(r['H'][1]),
   'the printed enclosures contain the value (ratio and H, against a 110-digit evaluation): the print is outward')
below = format(X.subtract(R, Decimal('1e-50')).quantize(Decimal('1e-80'), context=X), 'f')
ok(fei.decide(art, below)['verdict'] == 'CERTIFIED', 'GREEN: a bar 10^-50 below the value certifies')

# majority of three on {-1,1}^3: weights 1/4 on each singleton and on the full set; I = 3/2, H = 2, H/(I-1) = 4
t = [1 if bin(x).count('1') < 2 else -1 for x in range(8)]
a3 = fei.wht(t)
I3 = Fr(sum(v * v * bin(S).count('1') for S, v in enumerate(a3)), 64)
ok(I3 == Fr(3, 2) and sorted(abs(v) for v in a3 if v) == [4, 4, 4, 4], 'anchor: majority of three has I = 3/2 and four weights of 1/4 (H = 2)')
maj = {'n': 3, 'true_hex': format(sum(1 << x for x in range(8) if t[x] == -1), 'x'), 'I': '3/2', 'ratio_lo_dec': '4', 'ratio_hi_dec': '4'}
maj['sha256_table'] = hashlib.sha256(','.join(str(v) for v in t).encode()).hexdigest()
rm = fei.decide(maj, '3.999999999999999999999999999999')
ok(rm['verdict'] == 'CERTIFIED' and rm['ratio'][0] == rm['ratio'][1] == '4.' + '0' * 42 and rm['H'][0] == rm['H'][1] == '2.' + '0' * 28,
   'GREEN: majority of three certifies against 4 - 10^-30, its H = 2 and H/(I-1) = 4 exact (log2 4 = 2 exactly)')

flip = dict(art)
flip['true_hex'] = format(int(art['true_hex'], 16) ^ 1, 'x')
red(came(fei.decide(flip, THR), 'REFUSED', 'binds by sha256'), 'RED: one bit of the truth table flipped is REFUSED: the sha256 binding fails')
above = format(X.add(Decimal(r['ratio'][0]), Decimal('1e-40')), 'f')      # exactly 1e-40 above (the default 28-digit context would round it)
red(came(fei.decide(art, above), 'REFUTED', 'r_hi <='), 'RED: a bar 1e-40 above the enclosure\'s lower end is REFUTED: it is above r_hi')
straddle = format(R.quantize(Decimal('1e-80'), context=X), 'f')
red(came(fei.decide(art, straddle), 'REFUSED', 'straddles'), 'RED: a bar within 1e-80 of the value is REFUSED: the enclosure straddles it')
wrong = dict(art)
wrong['I'] = str(Fr(261, 128) + Fr(1, 128))
red(came(fei.decide(wrong, THR), 'REFUSED', 'the artifact\'s own table gives I = 261/128'), 'RED: a claimed influence moved by 1/128 is REFUSED: the stated I is not the table\'s')
dict1 = {'n': '2', 'true_hex': format(sum(1 << x for x in range(4) if x & 1), 'x'), 'I': '1', 'ratio_lo_dec': '0', 'ratio_hi_dec': '0'}
dict1['sha256_table'] = hashlib.sha256(','.join(str(v) for v in fei.table(2, dict1['true_hex'])).encode()).hexdigest()
try:
    rd = fei.decide(dict1, '1')
except ArithmeticError:
    rd = {'verdict': 'raised', 'why': None}
red(came(rd, 'REFUSED', 'I > 1') and rd['why'].endswith('the rule needs I > 1'), 'RED: a dictator (I = 1) is REFUSED because the amplification rule needs I > 1')
red(came(fei.decide(maj, '4'), 'REFUTED', 'r_hi <= 4'), 'RED: majority of three against 4 itself is REFUTED, exactly: its ratio is 4')
refused = 0
for k in (0, -3):
    try:
        fei.ln_iv(k)
    except ValueError:
        refused += 1
red(refused == 2, 'RED: ln_iv refuses k = 0 and k = -3')
print(f'fei battery: {passed} pass, {failed} fail, {fired}/{reds} red controls fired')
sys.exit(1 if failed else 0)
