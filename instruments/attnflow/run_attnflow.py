#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""run_attnflow.py — write certs/attnflow-theorems.json: the decidable attention
flow's exact-Q theorems, decided, plus the phantom-bifurcation taxonomy with
honest sourcing (one artifact re-demonstrated live, the budget-heavy ones
carried as origin-measured with provenance flags).

usage: python3 instruments/attnflow/run_attnflow.py

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
import attnflow as A  # noqa: E402


def locator_transient_demo():
    """Artifact 1, LIVE: near the double zero the float flow is so slow that a
       finite-budget locator 'finds an equilibrium' where there is none — and
       the exact decision refutes it at the very same point."""
    beta = 2.5
    cstar = -1 / beta
    c = cstar + 1e-4
    cdot = lambda x: 2 * (1 + beta * x) ** 2 * (1 - x * x) / ((1 + beta) ** 2 + (1 + beta * x) ** 2)
    steps = 0
    x = c
    dt = 1e-3
    while steps < 200000 and abs(cdot(x)) < 1e-6:
        x += dt * cdot(x)
        steps += 1
    phantom = steps >= 200000                      # the locator's budget expires "at equilibrium"
    # the exact refutation AT THE PHANTOM POINT: cdot(x) > 0 in exact rationals
    bx = F(5, 2)
    xr = F(x).limit_denominator(10 ** 12)
    num = 2 * (1 + bx * xr) ** 2 * (1 - xr * xr)
    den = (1 + bx) ** 2 + (1 + bx * xr) ** 2
    refuted_exactly = (num > 0) and (den > 0)
    return {'live': True, 'beta': beta, 'start': c, 'budgetSteps': 200000,
            'phantomEquilibriumDeclared': phantom,
            'exactRefutation': refuted_exactly,
            'note': 'the float budget expires with |cdot| < 1e-6 and a locator would file an '
                    'equilibrium; the exact decision at the same point: cdot > 0, strictly — '
                    'a REFUTED here is proved'}


def main():
    t0 = time.time()
    d1 = A.decide_reduced_flow()
    d2 = A.decide_cross_weights()
    d3 = A.decide_consensus_spectrum()
    demo = locator_transient_demo()
    ok = (d1['multiplicityExactly2'] and d1['denominatorSOS'] and d1['signStructure']
          and d2['crossWeightIdenticallyZero'] and d2['firstOrderVanishes_p2to12']
          and d2['p1DerivativeIsOne']
          and all(r['slopeFree'] and r['jacobianIsMeanMinusId'] for r in d3)
          and demo['phantomEquilibriumDeclared'] and demo['exactRefutation'])
    cert = {
        'what': 'the decidable attention flow — exact-Q theorems decided, phantom taxonomy carried',
        'statement': ('For token dynamics on the sphere under the rational kernel '
                      '(1 + beta<x_i,x_j>)^p (NEVER a Transformer/softmax claim — that theory is '
                      'Geshkovski-Letrouit-Polyanskiy-Rigollet, arXiv:2312.10794): the reduced '
                      'equal-cluster flow has a DOUBLE zero at c* = -1/beta and is strictly '
                      'positive elsewhere on (-1,1) for every beta > 1 — one-sided semi-stability, '
                      'no linear crossing at any beta, every pitchfork claim about it REFUTED '
                      'exactly; the <u,v> = -1/beta two-cluster family\'s cross-weights vanish '
                      'IDENTICALLY, to first order for every p >= 2 (and NOT at p = 1 — the '
                      'model\'s own honest candidate for a true bifurcation); the consensus '
                      'linearization is (Jv)_i = vbar - v_i with the kernel slope cancelling '
                      'IDENTICALLY (beta- and p-free, spectrum {0, -1}), decided mechanically at '
                      'n = 3..6 as the check on the paper\'s all-n paragraph proof.'),
        'verdict': 'VERIFIED' if ok else 'REFUSED',
        'D1_reducedFlow': d1,
        'D2_crossWeights': d2,
        'D3_consensusSpectrum': {'decidedAt': d3,
                                 'scope': 'decided at the stated sizes; the all-n proof is the '
                                          'paper\'s (tangent perturbations are orthogonal to the '
                                          'consensus point) — the machine decision checks it, '
                                          'never replaces it'},
        'phantomCatalogue': {
            'what': 'a taxonomy of how finite float budgets manufacture bifurcations',
            'artifacts': [
                {'name': 'locator transient', 'status': 'RE-DEMONSTRATED LIVE on this bench', 'demo': demo},
                {'name': 'Newton metastability', 'status': 'ORIGIN-MEASURED (slow-manifold points '
                 'polished into "equilibria"); not re-run here', 'provenance': 'frontier-apps PHASE3E (no git)'},
                {'name': 'the demoted omega-limit', 'status': 'ORIGIN-MEASURED; not re-run here',
                 'provenance': 'frontier-apps PHASE3E (no git)'},
                {'name': 'cutoff slicing', 'status': 'ORIGIN-MEASURED (beta = 2.5 "stable" at 80k '
                 'steps, collapses ~84.5k; the claimed "crossing in (2.5, 2.7)" was the budget\'s '
                 'level set on a smooth collapse-time curve); re-running needs the origin\'s '
                 'hour-scale float budget — carried as sourced, not proved here',
                 'provenance': 'frontier-apps PHASE3E (no git)'},
            ],
            'transfer': 'a warning taxonomy for softmax studies where metastability IS the phenomenon',
        },
        'refusalHonored': ('the cheap edge-of-chaos certificate stays UNBUILT: the origin\'s own '
                           'literature gate refused it as "certifying the wrong object very '
                           'precisely" (the mean-field approximation, not any finite network); '
                           'this port honors that refusal'),
        'provenance': {'origin': 'sin-mfg/research/probes/attention-* (read-only)',
                       'settledAt': 'frontier-apps/experiments/terra-attn (no git; fourth paper)',
                       'implementation': 'instruments/attnflow/attnflow.py, authored fresh'},
        'meta': {'date': time.strftime('%Y-%m-%d'),
                 'git': subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'],
                                                cwd=ROOT).decode().strip(),
                 'ms': int((time.time() - t0) * 1000)},
    }
    out = os.path.join(ROOT, 'certs', 'attnflow-theorems.json')
    json.dump(cert, open(out, 'w'), indent=1)
    print('D1 reduced flow: double zero + SOS + sign — %s' % d1['signStructure'])
    print('D2 cross-weights: identical zero, p>=2 first-order, p=1 boundary — %s' % d2['firstOrderVanishes_p2to12'])
    print('D3 consensus: slope-free at n=3..6 — %s' % all(r['slopeFree'] for r in d3))
    print('phantom demo: declared=%s, refuted exactly=%s' % (demo['phantomEquilibriumDeclared'], demo['exactRefutation']))
    print('wrote certs/attnflow-theorems.json  verdict=%s' % cert['verdict'])
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
