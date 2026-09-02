#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""run_facelaw.py — build the EVIDENCE the face-dimension theorem never had.

The frontier bench settled the theorem but wrote NO record (the audit's
finding: "the 4,000-network / 572-failure claim has no artifact").  This
runner emits certs/facelaw-theorem.json:

  · the ORIGIN ensemble — the frontier generator replayed call-for-call at
    its seed (20260901, 4000 draws), so the published failure count is a
    REPLICATION this machine derives, not a number it quotes;
  · a FRESH ensemble at this port's own seed — the theorem also holds on
    networks nobody chose after seeing results;
  · EVERY shortcut failure ENUMERATED — edges, exits, entrances, k,
    shortcut, z — so any reader can re-run any failing instance;
  · the constructed exit-free-cycle family (every deficit realized) and
    the origin 15-edge instance (z = 0 — why the shortcut looked like a law).

usage: python3 instruments/facelaw/run_facelaw.py

SPDX-License-Identifier: MIT — Copyright (c) 2026 Carlos Toledo
"""
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import facelaw as FL  # noqa: E402


def main():
    t0 = time.time()
    o_stats, o_fail = FL.run_ensemble(20260901, 4000)
    f_stats, f_fail = FL.run_ensemble(53_2026_0901, 4000)
    cyc = FL.cycle_family()
    org = FL.face(FL.ORIGIN['edges'], FL.ORIGIN['exits'], FL.ORIGIN['ea'], FL.ORIGIN['eb'])
    org_th = FL.theorem_k(FL.ORIGIN['edges'], FL.ORIGIN['exits'], FL.ORIGIN['ea'], FL.ORIGIN['eb'])

    ok = (o_stats['formulaAgrees'] and o_stats['corollaryBothWays']
          and f_stats['formulaAgrees'] and f_stats['corollaryBothWays']
          and o_stats['shortcutWrong'] == o_stats['zPositive']
          and f_stats['shortcutWrong'] == f_stats['zPositive']
          and all(r['formulaExact'] and r['deficitIsZ'] and r['z'] >= 1 for r in cyc)
          and org['k'] == 6 and org_th['k'] == 6 and org_th['z'] == 0 and org['agree']
          and all(f['deficit'] == f['z'] for f in o_fail + f_fail))

    cert = {
        'what': 'the face-dimension theorem k = |shared| - cons + z, with its evidence',
        'statement': ('For the two-population network equilibrium face, the exact tangent '
                      'dimension (null space of the stacked restricted conservation rows, '
                      'computed over Q) equals |shared| - cons + z, where z counts exit-free '
                      'components of the shared subgraph. COROLLARY, verified both ways on '
                      'every instance below: the combinatorial shortcut |shared| - cons is '
                      'correct iff z = 0 and undercounts by exactly z otherwise. SCOPE: '
                      'combinatorics on the constraint matrices, exact over Q, not an '
                      'enclosure; the dimension of the set, never the point.'),
        'verdict': 'VERIFIED' if ok else 'REFUSED',
        'originEnsemble': {
            'seed': 20260901, 'draws': 4000, 'tested': o_stats['tested'],
            'shortcutFailures': o_stats['shortcutWrong'], 'zPositive': o_stats['zPositive'],
            'note': 'the frontier bench generator replayed call-for-call — its published '
                    'count is re-derived here, not quoted',
        },
        'freshEnsemble': {
            'seed': 5320260901, 'draws': 4000, 'tested': f_stats['tested'],
            'shortcutFailures': f_stats['shortcutWrong'], 'zPositive': f_stats['zPositive'],
        },
        'failingInstances': {
            'note': 'every instance where the shortcut errs, fully specified; deficit == z on all',
            'origin': o_fail,
            'fresh': f_fail,
        },
        'cycleFamily': cyc,
        'originInstance': {'k': org['k'], 'z': org_th['z'], 'shortcutAgrees': org['agree'],
                           'note': 'the 15-edge instance whose z = 0 made the shortcut look like a law'},
        'provenance': {
            'conjecture': 'sin-mfg/research/geometry/face_general.py (read-only origin)',
            'settledAt': 'frontier-apps/experiments/terra-faces (no git, no record — evidence rebuilt here)',
            'implementation': 'instruments/facelaw/facelaw.py, authored fresh',
        },
        'meta': {'date': time.strftime('%Y-%m-%d'),
                 'git': subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'],
                                                cwd=ROOT).decode().strip(),
                 'ms': int((time.time() - t0) * 1000)},
    }
    out = os.path.join(ROOT, 'certs', 'facelaw-theorem.json')
    json.dump(cert, open(out, 'w'), indent=1)
    print('origin ensemble: %d tested, %d shortcut failures (z>0: %d)'
          % (o_stats['tested'], o_stats['shortcutWrong'], o_stats['zPositive']))
    print('fresh ensemble : %d tested, %d shortcut failures (z>0: %d)'
          % (f_stats['tested'], f_stats['shortcutWrong'], f_stats['zPositive']))
    print('wrote certs/facelaw-theorem.json  verdict=%s' % cert['verdict'])
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
