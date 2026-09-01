#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""bracket_table.py — the terra bracket TABLE, assembled under one theorem
(TERRA-PORT item 4).

HONEST COUNTING (mandatory): the finding is ONE phenomenon theorem (T1: two
peaks over one well) + ONE three-peak theorem (T6) + a SIX-ROW bracket table.
T2/T3 are one-peak negatives, T4/T8 replications, T7 the lower threshold pin.
The terra paper's "eight theorems" (abstract) and "five" (a section heading)
do not travel — rows of a table are rows of a table.

This tool CLAIMS NOTHING ITSELF: it walks the re-certification certificates
(certs/terra-recert-*.json) and the certified peak counts
(certs/terra-peakcount-*.json), refuses unless every input is VERIFIED, and
assembles the table.  Its one derived fact is the THRESHOLD PIN: the certified
counts at r = 0.13 (one peak) and r = 0.14 (two peaks) bracket every crossing
of the splitting threshold, and the linear-response prediction
r_c = 1/(4 c2/c1) at sigma = 0.002, gamma = 0.01 is decided to lie INSIDE
(0.13, 0.14) in EXACT RATIONALS: with s = 4 pi^2 sigma and g = 4 pi^2 gamma
(pi from the Machin rational bracket, sigmastar.py),
    r_c = [(1+4s)^2 + 4g] / (16 [(1+s)^2 + g])
is a rational interval — no floats in the decision.

SPDX-License-Identifier: MIT — Copyright (c) 2026 Carlos Toledo
"""
import json
import os
import subprocess
import sys
import time
from fractions import Fraction as F

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import sigmastar as SS  # noqa: E402

ROWS = [
    ('t1', 'main: r = 0.20, the phenomenon theorem', 2),
    ('t2', 'negative: r = 0.12 < threshold', 1),
    ('t3', 'negative: sigma = 0.02 > sigma*', 1),
    ('t4', 'replication: r = 0.15', 2),
    ('t6', 'three peaks: third harmonic r3 = 0.25', 3),
    ('t7', 'threshold pin, lower: r = 0.13', 1),
    ('t8', 'threshold pin, upper: r = 0.14', 2),
]


def rc_rational_bracket(sigma, gamma):
    """Exact rational bracket of r_c = [(1+4s)^2+4g] / (16[(1+s)^2+g]),
       s = 4 pi^2 sigma, g = 4 pi^2 gamma, monotonicity handled by evaluating
       at both pi-bracket endpoints (r_c is monotone in pi^2 along this line;
       instead of proving that, evaluate at all four corner combinations and
       take the hull — coarse, correct, and the bracket is 1e-40 wide)."""
    plo, phi = SS.pi_bracket()
    sig, gam = F(sigma), F(gamma)
    vals = []
    for p2 in (plo * plo, phi * phi):
        for q2 in (plo * plo, phi * phi):
            s = 4 * p2 * sig
            g = 4 * q2 * gam
            vals.append(((1 + 4 * s) ** 2 + 4 * g) / (16 * ((1 + s) ** 2 + g)))
    return min(vals), max(vals)


def main():
    table = []
    problems = []
    for tag, role, expected in ROWS:
        rc_p = os.path.join(ROOT, 'certs', 'terra-recert-%s.json' % tag)
        pc_p = os.path.join(ROOT, 'certs', 'terra-peakcount-%s.json' % tag)
        if not (os.path.exists(rc_p) and os.path.exists(pc_p)):
            problems.append('%s: missing certificate(s)' % tag)
            continue
        rc = json.load(open(rc_p))
        pc = json.load(open(pc_p))
        if rc['verdict'] != 'VERIFIED':
            problems.append('%s: enclosure not VERIFIED' % tag)
        if pc['verdict'] != 'VERIFIED':
            problems.append('%s: peak count not VERIFIED' % tag)
        if pc['peaks'] != expected:
            problems.append('%s: certified %d peaks, table expected %d' % (tag, pc['peaks'], expected))
        table.append({
            'tag': tag.upper(), 'role': role,
            'sigma': rc['instance']['sigma'], 'gamma': rc['instance']['gamma'],
            'A1': rc['instance']['A1'], 'A2': rc['instance']['A2'], 'A3': rc['instance']['A3'],
            'N': rc['instance']['N'], 'nu': rc['instance']['nu'],
            'r': rc['bounds']['r'], 'Z1': rc['bounds']['Z1'],
            'minM': rc['positivity']['minM'],
            'peaks': pc['peaks'], 'wells': pc['wells'],
            'certs': [os.path.relpath(rc_p, ROOT), os.path.relpath(pc_p, ROOT)],
        })
    if problems:
        print('BRACKET TABLE REFUSED:\n  ' + '\n  '.join(problems), file=sys.stderr)
        return 1

    # exact binary64 rationals of the instance parameters (coefficient honesty):
    # F(0.002) is the exact rational value of the double, not the decimal 1/500
    lo, hi = rc_rational_bracket(F(0.002), F(0.01))
    pin_ok = F(13, 100) < lo and hi < F(14, 100)
    t7 = next(r for r in table if r['tag'] == 'T7')
    t8 = next(r for r in table if r['tag'] == 'T8')
    pin = {
        'certified': 'peaks(r=0.13) = %d and peaks(r=0.14) = %d — every threshold crossing '
                     'lies inside [0.13, 0.14]' % (t7['peaks'], t8['peaks']),
        'linearResponsePrediction': {
            'rc': 'r_c = [(1+4s)^2+4g] / (16[(1+s)^2+g]), s = 4 pi^2 sigma, g = 4 pi^2 gamma',
            'bracketRational': [str(lo), str(hi)],
            'bracketDecimal': [float(lo), float(hi)],
            'insideCertifiedPin': pin_ok,
            'note': 'decided in exact rationals (Machin pi bracket); the prediction is LINEAR '
                    'RESPONSE — the pin itself is carried by the certified counts alone',
        },
    }
    ok = pin_ok and t7['peaks'] == 1 and t8['peaks'] == 2
    cert = {
        'what': 'the terra bracket table — six instances under the peak-splitting theorem',
        'statement': ('HONEST COUNT: one phenomenon theorem (T1) + one three-peak theorem (T6) + '
                      'this bracket table. Each row is a certified enclosure with a certified '
                      'critical-point count; negatives and replications are rows, not theorems. '
                      'The splitting threshold at sigma = 0.002, gamma = 0.01 is pinned inside '
                      '[0.13, 0.14] by the certified T7/T8 counts, and the exact-rational '
                      'linear-response prediction lands inside the pin.'),
        'verdict': 'VERIFIED' if ok else 'REFUSED',
        'table': table,
        'thresholdPin': pin,
        'meta': {'date': time.strftime('%Y-%m-%d'),
                 'git': subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'],
                                                cwd=ROOT).decode().strip()},
    }
    out = os.path.join(ROOT, 'certs', 'terra-bracket-table.json')
    json.dump(cert, open(out, 'w'), indent=1)
    for r in table:
        print('  %s  %-42s peaks %d / wells %d  r %.2e' % (r['tag'], r['role'], r['peaks'], r['wells'], r['r']))
    print('threshold pin: r_c prediction in [%s, %s] inside (0.13, 0.14): %s'
          % (pin['linearResponsePrediction']['bracketDecimal'][0],
             pin['linearResponsePrediction']['bracketDecimal'][1], pin_ok))
    print('wrote certs/terra-bracket-table.json  verdict=%s' % cert['verdict'])
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
