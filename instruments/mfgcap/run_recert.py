#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""run_recert.py — re-certify a terra congestion-MFG enclosure inside cert-machine.

    python3 instruments/mfgcap/run_recert.py t1     -> certs/terra-recert-t1.json
    python3 instruments/mfgcap/run_recert.py t6     -> certs/terra-recert-t6.json

What this does, and what it takes on trust: NOTHING but the candidate.  The input
record (instruments/mfgcap/records/, candidate coefficients copied from
frontier-apps/experiments/terra — a lab with NO version control, so the copy is
pinned here by sha256 and the coefficients are additionally embedded in the output
certificate) supplies only the approximate solution (uCoef, mCoef) and the instance
parameters.  Everything with proof force is recomputed here from scratch:

  · w = m^{-1/2} rebuilt by reciprocal-sqrt Newton (float — it is candidate data;
    the reciprocal constraint m w^2 = 1 is then CERTIFIED inside the ball),
  · the approximate inverses A (even and odd blocks) by stdlib Gauss-Jordan,
  · Y0 / Z1(even+odd) / Z2 in outward-rounded interval arithmetic, the radii
    polynomial, positivity of m and of the branch selector w over the WHOLE ball
    (via verify_ext.py, whose validate_g is battery-pinned bit-for-bit to the
    frozen published verifier on its embedded instance),
  · the independent pointwise PDE witness with the extended potential,
  · the falsifier suite X1..X9 — including X8 (the A2/A3 data term ZEROED must
    explode Y0: the only lines this port adds are the first lines its own
    falsifier attacks) and X9 (the data term applied at the WRONG mode must
    explode Y0).

The terra record's own stored bounds are carried alongside ours as a
cross-implementation check (their JS kernel vs this Python, two independently
computed approximate inverses); agreement gates are stated in the certificate.

Coefficient honesty (TERRA-PORT.md condition): the certified statement is about
the EXACT binary64 values of sigma, gamma, A1, A2, A3 — printed in hex in the
certificate — not about the decimal strings that name them.

SPDX-License-Identifier: MIT — Copyright (c) 2026 Carlos Toledo
"""
import hashlib
import json
import math
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import verify_ext as X  # noqa: E402

def _bracket(tag, role):
    return {
        'record': 'records/terra-%s-enclosure.json' % tag,
        'name': '%s — bracket instance (%s)' % (tag.upper(), role),
        'statement': ('Bracket-table instance %s (%s) under the peak-splitting theorem: an exact '
                      'equilibrium of the discounted congestion MFG (a = 1/2) enclosed at the '
                      'certified radius, locally unique in the full l1_nu ball, m > 0 and w > 0 '
                      'over the whole ball. Bracket instances are TABLE ROWS under one theorem, '
                      'not separate theorems (honest counting, TERRA-PORT.md). The peak count is '
                      'a separate certificate (instruments/critcount).' % (tag.upper(), role)),
    }


TAGS = {
    't2': _bracket('t2', 'one-peak negative: r = 0.12 below the predicted threshold 0.1327'),
    't3': _bracket('t3', 'one-peak negative: sigma = 0.02 above sigma*, gain ratio kills the split'),
    't4': _bracket('t4', 'replication: r = 0.15 above threshold, two peaks expected'),
    't5': _bracket('t5', 'replication at low viscosity: sigma = 0.001, r = 0.15, N = 176'),
    't7': _bracket('t7', 'threshold pin, lower side: r = 0.13, one peak expected'),
    't8': _bracket('t8', 'threshold pin, upper side: r = 0.14, two peaks expected'),
    't1': {
        'record': 'records/terra-t1-enclosure.json',
        'name': 'T1 — two-peak equilibrium over a one-well potential (2nd harmonic re-weighted)',
        'statement': ('At the exact binary64 instance below (V = A1 cos 2pi x + A2 cos 4pi x, '
                      'A1 > 4 A2: exactly ONE well), an exact equilibrium of the discounted '
                      'congestion MFG (a = 1/2) lies within the certified radius of the candidate, '
                      'locally unique in the full l1_nu ball (even AND odd blocks), with m > 0 and '
                      'the physical branch w = +m^{-1/2} certified over the whole ball. '
                      'HONEST FRAMING: the potential already contains the second harmonic; the '
                      'crowd RE-WEIGHTS it across the 1/4 critical-point threshold — gain-weighted '
                      'well-counting beats flat well-counting. The peak COUNT itself is a separate '
                      'certificate (instruments/critcount).'),
    },
    't6': {
        'record': 'records/terra-t6-enclosure.json',
        'name': 'T6 — three-peak equilibrium over a one-well potential (3rd harmonic re-weighted)',
        'statement': ('At the exact binary64 instance below (V = A1 cos 2pi x + A3 cos 6pi x, '
                      'one well), an exact equilibrium of the discounted congestion MFG (a = 1/2) '
                      'lies within the certified radius of the candidate, locally unique in the '
                      'full l1_nu ball (even AND odd blocks), with m > 0 and w > 0 certified over '
                      'the whole ball. The three-peak count is a separate certificate '
                      '(instruments/critcount).'),
    },
}


def sha256_file(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def gitrev():
    try:
        return subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'],
                                       cwd=ROOT).decode().strip()
    except Exception:
        return 'unknown'


def main():
    tag = sys.argv[1] if len(sys.argv) > 1 else 't1'
    if tag not in TAGS:
        print('usage: run_recert.py ' + '|'.join(sorted(TAGS)), file=sys.stderr)
        return 2
    spec = TAGS[tag]
    rec_path = os.path.join(HERE, spec['record'])
    rec = json.load(open(rec_path))
    inst = rec['instance']
    N = inst['N']
    P = {'sigma': inst['sigma'], 'gamma': inst['gamma'], 'N': N,
         'A1': inst.get('A1', 0.0), 'A2': inst.get('A2', 0.0), 'A3': inst.get('A3', 0.0)}
    nu = inst['nu']
    G = inst.get('G', 4096)
    a_coef = rec['uCoef'][:N + 1]
    m_coef = rec['mCoef'][:N + 1]
    t_all = time.time()
    log = lambda *a: (print('[recert:%s +%5.1fs]' % (tag, time.time() - t_all), *a), sys.stdout.flush())

    log('instance sigma=%r gamma=%r A1=%r A2=%r A3=%r N=%d nu=%r'
        % (P['sigma'], P['gamma'], P['A1'], P['A2'], P['A3'], N, nu))

    # ---- rebuild the reciprocal branch w = m^{-1/2} (candidate data, certified later) ----
    w_coef = X.reciprocalW_py(m_coef, N)
    s = X.make_seqs_g(X.ODD, a_coef, m_coef, w_coef, N)
    log('w rebuilt by reciprocal Newton')

    # ---- approximate inverses by stdlib Gauss-Jordan ----
    t0 = time.time()
    AN, AN_ODD = X.build_inverses(s, P, N)
    a_sha = hashlib.sha256((','.join(repr(v) for v in AN)).encode()).hexdigest()
    ao_sha = hashlib.sha256((','.join(repr(v) for v in AN_ODD)).encode()).hexdigest()
    log('approximate inverses built (%.1fs) even %dx%d odd %dx%d'
        % (time.time() - t0, 3 * N + 3, 3 * N + 3, 3 * N, 3 * N))

    # ---- the certification ----
    t0 = time.time()
    r = X.validate_g(a_coef, m_coef, w_coef, AN, AN_ODD, P, {'nu': nu})
    log('validate_g done (%.1fs): ok=%s r=%s Z1=%s (even %s / odd %s)'
        % (time.time() - t0, r.get('ok'), r.get('r'), r.get('Z1'), r.get('Z1even'), r.get('Z1odd')))
    if not r.get('ok'):
        log('REFUSED:', r.get('why'))
    mpos = X.certify_pos(m_coef, N, r['r'], G) if r.get('ok') else None
    if mpos:
        log('density positivity: min m over ball >= %s' % mpos['minBall'])
    wit = X.eval_pde_ext(a_coef, m_coef, w_coef, P, 4096)
    log('pointwise witness: |HJB| %.3e  FP %.3e  |sqrt(m)w-1| %.3e'
        % (wit['hjbMax'], wit['fpResMax'], wit['reciprocalMaw']))

    # ---- falsifiers (X1 global; X2..X9 at THIS instance) ----
    fx = {}
    fx['X1'] = bool(X.vc.falsifier_X1()[0])  # outward rounding load-bearing (instance-free)
    y0_good = r['Y0']
    z1g, z2g = r['Z1'], r['Z2']

    def mut_refuses(y0mut):
        rp = X.radiiPolynomial(y0mut, z1g, z2g)
        return (y0mut > 1e6 * y0_good) and (not rp['ok'])

    bad_a = list(a_coef)
    bad_a[0] += 1e-2
    fx['X2'] = mut_refuses(X.y0_only(bad_a, m_coef, w_coef, AN, P, nu))
    e = X.eval_pde_ext(bad_a, m_coef, w_coef, P, 512)
    fx['X3'] = e['hjbMax'] > 1e-4 and e['hjbMax'] / r['r'] > 1e6
    w_drop = X.reciprocalW_py(m_coef, N, drop=True)
    fx['X4'] = mut_refuses(X.y0_only(a_coef, m_coef, w_drop, AN, P, nu))
    sE = X.make_seqs_g(X.EVEN, a_coef, m_coef, w_coef, N)
    pg = X.buildPhi_ext(s, P, 3 * N)
    pb = X.buildPhi_ext(sE, P, 3 * N)
    ng = max(max(X.mag(v) for v in pg[t]) for t in ('H', 'F', 'R'))
    nb = max(max(X.mag(v) for v in pb[t]) for t in ('H', 'F', 'R'))
    # relative form: the frozen file's absolute 1e-3 bar was tuned to its O(0.3)-amplitude
    # instance; what the falsifier MEANS is "the forged Phi dwarfs the true residual".
    fx['X5'] = nb > 1e6 * ng and nb > 1e3 * y0_good
    fx['X6'] = not X.certify_pos(m_coef, N, 10, G)['positive']
    wp = X.certify_pos(w_coef, N, 10, G)
    rw = X.validate_g(a_coef, m_coef, w_coef, AN, AN_ODD, P, {'nu': nu, 'wPosR': 10, 'wG': G}) \
        if not wp['positive'] else {'ok': True}
    fx['X7'] = (not wp['positive']) and (not rw['ok']) \
        and ('w-series not certified positive' in (rw.get('why') or ''))
    # X8: the ONLY lines this port adds are the first lines its own falsifier attacks —
    # zero the instance's own harmonic data term; the residual at that mode must explode.
    P0 = dict(P)
    if P['A2'] != 0:
        P0['A2'] = 0.0
    elif P['A3'] != 0:
        P0['A3'] = 0.0
    else:
        P0['A1'] = 0.0
    fx['X8'] = mut_refuses(X._y0_from_seqs(s, AN, P0, nu))
    # X9: the data term applied at the WRONG mode (A2<->A3 swapped)
    P9 = dict(P)
    P9['A2'], P9['A3'] = P['A3'], P['A2']
    fx['X9'] = mut_refuses(X._y0_from_seqs(s, AN, P9, nu))
    log('falsifiers:', ' '.join('%s=%s' % (k, 'RED-ok' if v else 'FAIL') for k, v in sorted(fx.items())))

    # ---- cross-implementation agreement vs the terra record's stored bounds ----
    tr = rec.get('radii', {})
    agree = {
        'r_ratio': (r['r'] / tr['r']) if (r.get('ok') and tr.get('r')) else None,
        'Z1_diff': abs(r['Z1'] - tr['Z1']) if tr.get('Z1') is not None else None,
        'minM_diff': (abs(mpos['minBall'] - rec['positivity']['minM'])
                      if (mpos and rec.get('positivity')) else None),
        'minW_diff': (abs(r.get('minW', 0) - rec['branch']['minW'])
                      if (r.get('minW') is not None and rec.get('branch')) else None),
    }
    # minM gate is 1e-3, not 1e-6: our certify_pos subtracts the L/(2G) modulus-of-
    # continuity slack from the grid minimum (the conservative direction); terra's
    # recorded minM does not carry that slack.  Both are sound lower bounds.
    agree_ok = (agree['r_ratio'] is not None and 0.5 < agree['r_ratio'] < 2.0
                and agree['Z1_diff'] < 0.05 and agree['minM_diff'] < 1e-3
                and agree['minW_diff'] < 1e-6)
    log('terra cross-check: r_ratio=%s Z1_diff=%s minM_diff=%s minW_diff=%s -> %s'
        % (agree['r_ratio'], agree['Z1_diff'], agree['minM_diff'], agree['minW_diff'],
           'AGREE' if agree_ok else 'DISAGREE'))

    verified = bool(r.get('ok') and mpos and mpos['positive'] and all(fx.values())
                    and wit['hjbMax'] < 1e-8 and wit['reciprocalMaw'] < 1e-10 and agree_ok)

    cert = {
        'what': spec['name'],
        'statement': spec['statement'],
        'verdict': 'VERIFIED' if verified else 'REFUSED',
        'instance': {
            'sigma': P['sigma'], 'gamma': P['gamma'],
            'A1': P['A1'], 'A2': P['A2'], 'A3': P['A3'], 'N': N, 'nu': nu, 'G': G, 'a': 0.5,
            'exactBinary64Hex': {'sigma': P['sigma'].hex(), 'gamma': P['gamma'].hex(),
                                 'A1': float(P['A1']).hex(), 'A2': float(P['A2']).hex(),
                                 'A3': float(P['A3']).hex()},
            'note': ('the theorem is about these exact binary64 values, not the decimal strings '
                     'that name them (TERRA-PORT.md coefficient condition)'),
        },
        'bounds': {k: r.get(k) for k in ('Y0', 'Z1', 'Z1even', 'Z1odd', 'Z2', 'r', 'rMin', 'rMax',
                                         'disc', 'closureMargin', 'worstCol', 'worstColEven',
                                         'worstColOdd', 'Aopnorm', 's0', 'minWbar', 'minW')},
        'positivity': ({'minMbar': mpos['minBar'], 'minM': mpos['minBall'], 'G': mpos['G']}
                       if mpos else None),
        'witnesses': wit,
        'falsifiers': fx,
        'approxInverse': {
            'construction': 'stdlib Gauss-Jordan (partial pivoting) on the midpoint finite '
                            'Galerkin Jacobian at the candidate; recomputed deterministically by '
                            'this runner — soundness never depends on A, a bad A fails Z1 < 1',
            'evenShaRepr': a_sha, 'oddShaRepr': ao_sha,
        },
        'terraCrossCheck': {
            'recordedBounds': tr,
            'recordedMinM': rec.get('positivity', {}).get('minM'),
            'recordedMinW': rec.get('branch', {}).get('minW'),
            'agreement': agree, 'agree': agree_ok,
            'note': 'two implementations (terra JS kernel / this stdlib Python), two '
                    'independently computed approximate inverses',
        },
        'candidate': {'uCoef': a_coef, 'mCoef': m_coef, 'wCoefRebuilt': w_coef},
        'provenance': {
            'source': '/Users/carlostoledo/Documents/frontier-apps/experiments/terra/',
            'sourceNote': 'frontier-apps has NO git and is NOT a lift source; only CANDIDATE '
                          'data (coefficients + parameters) crossed — every proof-bearing '
                          'quantity is recomputed here',
            'recordFile': os.path.relpath(rec_path, ROOT),
            'recordSha256': sha256_file(rec_path),
            'frozenVerifierSha256': sha256_file(os.path.join(ROOT, 'reports', 'verify_congest.py')),
        },
        'meta': {'date': time.strftime('%Y-%m-%d'), 'git': gitrev(),
                 'ms': int((time.time() - t_all) * 1000)},
    }
    out = os.path.join(ROOT, 'certs', 'terra-recert-%s.json' % tag)
    json.dump(cert, open(out, 'w'), indent=1)
    log('wrote %s  verdict=%s' % (os.path.relpath(out, ROOT), cert['verdict']))
    return 0 if verified else 1


if __name__ == '__main__':
    sys.exit(main())
