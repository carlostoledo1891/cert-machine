#!/usr/bin/env python3
"""EinsteinArena solution 542 (AlphaEvolve, 26 circles in the unit square) under both readings of its own bytes.

The platform's API record (corpus/einstein-arena/best-14.json, pinned 2026-10-02) prints each centre and radius as a
decimal. Those digits can be read two ways, and the two give different packings: the decimal each literal spells,
exactly, or the IEEE double the platform's float64 verifier computed with (the exact rational that double denotes).
This decides the claim "a feasible packing — every circle inside the square, no two overlapping" under both, in exact
rational arithmetic, standard library only:

  inside     r <= x <= 1 - r and r <= y <= 1 - r, each side compared exactly
  disjoint   (r_i + r_j)^2 <= (x_i - x_j)^2 + (y_i - y_j)^2, compared exactly (no square root)

and prints every violation with its exact size. Circles are numbered from 1, in the record's order.

The doubles reading is the one instruments/claimbox/primitive/prim-ea-542-circle-packing.json declares (2026-10-21);
--check holds this record's doubles verdict to that object's decision in certs/claimbox-decisions.json. The decimals
reading was first noticed by Clade Code's judge (a sister experiment whose judge is calibrated against that object) and
is decided here independently.

usage: python3 tools/run-ea542-readings.py            write certs/ea542-readings.json
       python3 tools/run-ea542-readings.py --check    recompute and refuse unless identical (the battery)       MIT
"""
import sys, os, json, re, hashlib
from fractions import Fraction as F
from decimal import Decimal, getcontext

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = 'corpus/einstein-arena/best-14.json'
PIN = '55db2c8bfde3a9adc39828b0162982c1bf9230fcafbc1693a29076f3811898cb'
OUT = os.path.join(ROOT, 'certs', 'ea542-readings.json')
getcontext().prec = 50


def die(m):
    sys.exit('ea542-readings REFUSES: ' + m)


def sci(q):
    """a positive exact amount as a short decimal, for the eye; the exact fraction is recorded beside it"""
    return '%.3e' % float(q)


def decide(C):
    outside, overlaps = [], []
    for i, (x, y, r) in enumerate(C, 1):
        worst = max(r - x, r - y, x - (1 - r), y - (1 - r))
        if worst > 0:
            outside.append({'circle': i, 'by': str(worst), 'approx': sci(worst)})
    for i in range(len(C)):
        for j in range(i + 1, len(C)):
            (xi, yi, ri), (xj, yj, rj) = C[i], C[j]
            s = (ri + rj) ** 2 - ((xi - xj) ** 2 + (yi - yj) ** 2)
            if s > 0:
                d2 = (xi - xj) ** 2 + (yi - yj) ** 2
                depth = (Decimal((ri + rj).numerator) / Decimal((ri + rj).denominator)) - (Decimal(d2.numerator) / Decimal(d2.denominator)).sqrt()
                overlaps.append({'pair': [i + 1, j + 1], 'squaredExcess': str(s), 'depthApprox': '%.3e' % depth})
    total = sum(c[2] for c in C)
    return {'outside': outside, 'overlaps': overlaps, 'sumRadii': str(total), 'sumRadiiApprox': str(Decimal(total.numerator) / Decimal(total.denominator))[:22],
            'verdict': 'REFUTED' if outside or overlaps else 'CERTIFIED'}


def build():
    p = os.path.join(ROOT, SRC)
    raw = open(p, 'rb').read()
    if hashlib.sha256(raw).hexdigest() != PIN:
        die(SRC + ' is not the pinned bytes')
    text = raw.decode('utf-8')
    d = json.loads(text)
    if d.get('id') != 542 or d.get('agentName') != 'AlphaEvolve':
        die('the record is not solution 542 by AlphaEvolve')
    m = re.search(r'"circles"\s*:\s*(\[\s*\[.*?\]\s*\])', text, re.S)
    rows = re.findall(r'\[([^\[\]]+)\]', m.group(1))
    dec = [[F(t.strip()) for t in r.split(',')] for r in rows]
    dbl = [[F(v) for v in c] for c in d['data']['circles']]
    if len(dec) != 26 or len(dbl) != 26 or any(len(c) != 3 for c in dec + dbl):
        die('expected 26 rows of [x, y, r]')
    for a, b in zip(dec, dbl):
        for u, v in zip(a, b):
            if float(u) != float(v):
                die('a printed decimal does not round to the double the JSON parser reads')
    return {
        'what': 'EinsteinArena solution 542 (AlphaEvolve, 26 circles in the unit square, score 2.6359830849176076) decided under both readings of its own bytes: the decimals as printed, and the doubles the platform verified. Written by tools/run-ea542-readings.py.',
        'source': {'path': SRC, 'sha256': PIN, 'id': d['id'], 'agent': d['agentName'], 'score': d['score'], 'createdAt': d.get('createdAt')},
        'claim': 'a feasible packing: every circle inside the unit square (r <= x <= 1 - r, r <= y <= 1 - r) and no two overlapping ((r_i + r_j)^2 <= |c_i - c_j|^2)',
        'readings': {
            'decimals': dict(decide(dec), how='each literal read as the decimal it spells, exactly'),
            'doubles': dict(decide(dbl), how='each literal read as the IEEE double the platform verified, exactly'),
        },
        'credit': 'the decimals reading was first noticed by Clade Code (a sister experiment whose judge is calibrated against cert-machine\'s object for this solution); decided here independently',
        'secondDecision': 'the doubles reading is also decided by instruments/claimbox (check.py and check.js) as prim-ea-542-circle-packing: --check holds the two to the same violation count',
    }


def check_against_claimbox(L):
    D = json.load(open(os.path.join(ROOT, 'certs', 'claimbox-decisions.json')))
    row = next((r for r in D['rows'] if r['id'] == 'prim-ea-542-circle-packing'), None)
    if not row:
        die('no claimbox decision for prim-ea-542-circle-packing')
    refuted = [f for f in row['fromObject'] if f and f.get('word') == 'REFUTED']
    if len(refuted) != 1 or refuted[0]['violations'] != len(L['readings']['doubles']['overlaps']) or L['readings']['doubles']['outside']:
        die('the doubles reading and the claimbox object disagree on the overlaps or the containment')
    w = refuted[0]['witness']['at']
    if [w['i'] + 1, w['j'] + 1] not in [o['pair'] for o in L['readings']['doubles']['overlaps']]:
        die('the claimbox witness pair is not among this record\'s overlaps')


if __name__ == '__main__':
    L = build()
    check_against_claimbox(L)
    # red controls: a circle moved fully inside must stop being an outside violation; a pair pulled apart must stop overlapping
    test = [list(c) for c in [[F(1, 2), F(1, 2), F(1, 4)], [F(1, 2), F(1, 2) + F(1, 2) - F(1, 10**18), F(1, 4)]]]
    if decide(test)['verdict'] != 'REFUTED' or decide([[F(1, 2), F(1, 2), F(1, 4)]])['verdict'] != 'CERTIFIED':
        die('a red control did not fire')
    if '--check' in sys.argv:
        old = json.load(open(OUT))
        if old != L:
            die('certs/ea542-readings.json is not what the pinned bytes give now')
        r = L['readings']
        print('ea542-readings: decimals %s (%d outside, %d overlapping pairs), doubles %s (%d outside, %d overlapping pairs); the doubles held to the claimbox object; red controls fired'
              % (r['decimals']['verdict'], len(r['decimals']['outside']), len(r['decimals']['overlaps']), r['doubles']['verdict'], len(r['doubles']['outside']), len(r['doubles']['overlaps'])))
    else:
        json.dump(L, open(OUT, 'w'), indent=1)
        open(OUT, 'a').write('\n')
        print('certs/ea542-readings.json written')
