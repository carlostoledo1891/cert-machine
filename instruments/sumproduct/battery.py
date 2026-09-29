#!/usr/bin/env python3
"""instruments/sumproduct/battery.py — the C84b decision, gated. Standard library only.

Anchors: zeta(2) = pi^2/6 and Gamma(1/2) = sqrt(pi) inside the enclosures; f(1.371966384) = 101.9560758... as printed.
RED: a regulator of 101 is not available at the note's s (f(s0) > 101); at Y = 1300 the product factor 515/Y exceeds
0.364, so the note's constant would not follow there; a claimed ceiling of 0.000714, below the decided one, is refused;
inf f >= 102 is refused (f(1.372) is below it).

Prints: "sumproduct battery: N pass, 0 fail, R/R red controls fired". """
import json
import os
import sys
from decimal import Decimal
from fractions import Fraction as Fr

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import c84b  # noqa: E402

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


pi = c84b.PI
z2 = c84b.zeta(Fr(2))
ok((pi * pi / 6).lo <= z2.hi and z2.lo <= (pi * pi / 6).hi, 'anchor: zeta(2) encloses pi^2/6')
g = c84b.lngamma(Fr(1, 2)).exp()
ok(pi.sqrt().lo <= g.hi and g.lo <= pi.sqrt().hi, 'anchor: Gamma(1/2) encloses sqrt(pi)')
f0 = c84b.f_at(Fr(1371966384, 10 ** 9))
ok(str(f0.lo).startswith('101.956075'), 'f(1.371966384) = 101.956075..., as the note prints (' + str(f0.lo)[:12] + ')')
L = json.load(open(os.path.join(ROOT, 'certs', 'sumproduct-ledger.json')))
ok(L['rows'][0]['verdict'] == 'REPAIRED' and Decimal(L['rows'][0]['ceiling']) < Decimal('0.000719'), 'the ledger: REPAIRED, ceiling ' + L['rows'][0]['ceiling'])
red(not f0.hi <= 101, 'RED: R = 101 is not available at the note\'s s (f(s0) > 101)')
red(not Fr(515, 1300) < Fr(364, 1000), 'RED: at Y = 1300 the product factor 515/Y is above 0.364: the note\'s constant would not follow')
red(not Decimal(L['rows'][0]['ceiling']) < Decimal('0.000714'), 'RED: a claimed ceiling of 0.000714 is below the decided one (the chain can exceed it)')
lb_near_min = c84b.f_at(Fr(1372, 1000))
red(not lb_near_min.lo >= 102, 'RED: inf f >= 102 is refused: f(1.372) is below 102')
print(f'sumproduct battery: {passed} pass, {failed} fail, {fired}/{reds} red controls fired')
sys.exit(1 if failed else 0)
