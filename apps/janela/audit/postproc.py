"""postproc.py — a correction learned from the satellites, judged on months it never saw.

apps/janela/audit · cert-machine

    python postproc.py            measure and write certs/janela-postproc-eval.json
    python postproc.py --check    re-measure and compare with the committed record

The rule was dated in certs/janela-ledger/DEFINITIONS.json ('postproc-eval-v1') before any corrected band was
judged. Site-specific post-processing learned from buoys narrows swell forecasts (Filoche et al., JGR ML&C 2026);
the Brazilian margin has no live buoy, so the correction here is learned from the altimeter passes the bands are
already calibrated on. Per site and 12 h lead bin, least squares on providers.py's calibration pairs (before
2025-07-01):

    S-lin   obs ~ a + b*fe + c*fn
    S-log   log obs ~ a + b*log fe + c*log fn      (back-transformed; no bias term added)

then providers.py's conformal ratio band on obs/prediction (the same rule, miss 1/10), judged with E and U(E,N)
on the 15 held-out months. A floating-point evaluation; the fitted correction is a model and the conformal band
around it is the claim. MIT licensed. Part of cert-machine.
"""
import json
import math
import os
import sys
from collections import defaultdict

import providers as P

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
DEST = os.path.join(ROOT, 'certs', 'janela-postproc-eval.json')
MISS = (1, 10)


def solve3(A, y):
    """least squares for 3 parameters by the normal equations (Gaussian elimination with partial pivoting)"""
    M = [[sum(a[i] * a[j] for a in A) for j in range(3)] + [sum(a[i] * v for a, v in zip(A, y))] for i in range(3)]
    for c in range(3):
        p = max(range(c, 3), key=lambda r: abs(M[r][c]))
        if abs(M[p][c]) < 1e-12:
            return None
        M[c], M[p] = M[p], M[c]
        for r in range(3):
            if r != c:
                f = M[r][c] / M[c][c]
                M[r] = [x - f * z for x, z in zip(M[r], M[c])]
    return [M[i][3] / M[i][i] for i in range(3)]


def fit(rows, kind):
    g = defaultdict(list)
    for x in rows:
        if x['fe'] > 0 and x['fn'] > 0 and x['obs'] > 0:
            g[(x['site'], P.binof(x['lead']))].append(x)
    co = {}
    for k, xs in g.items():
        if len(xs) < 30:
            continue
        if kind == 'lin':
            co[k] = solve3([(1.0, x['fe'], x['fn']) for x in xs], [x['obs'] for x in xs])
        else:
            co[k] = solve3([(1.0, math.log(x['fe']), math.log(x['fn'])) for x in xs], [math.log(x['obs']) for x in xs])
    return co


def predictor(co, kind):
    def f(x):
        c = co.get((x['site'], P.binof(x['lead'])))
        if not c or x['fe'] <= 0 or x['fn'] <= 0:
            return 0.0
        return c[0] + c[1] * x['fe'] + c[2] * x['fn'] if kind == 'lin' else math.exp(c[0] + c[1] * math.log(x['fe']) + c[2] * math.log(x['fn']))
    return f


def season(x):
    return {12: 'DJF', 1: 'DJF', 2: 'DJF', 3: 'MAM', 4: 'MAM', 5: 'MAM', 6: 'JJA', 7: 'JJA', 8: 'JJA'}.get(int(x['t'][5:7]), 'SON')


def measure():
    J, ne, nn = P.load()
    cal = [x for x in J if x['t'] < P.SPLIT]
    test = [x for x in J if x['t'] >= P.SPLIT]
    FE, FN = (lambda x: x['fe']), (lambda x: x['fn'])
    G = {'E': P.getter(P.build(cal, FE, MISS), FE)}
    GN = P.getter(P.build(cal, FN, MISS), FN)
    G['U(E,N)'] = lambda x: (lambda a, b: None if not a or not b else (min(a[0], b[0]), max(a[1], b[1])))(G['E'](x), GN(x))
    fits = {}
    for kind in ('lin', 'log'):
        co = fit(cal, kind)
        fits[kind] = len(co)
        f = predictor(co, kind)
        G['S-' + kind] = P.getter(P.build(cal, f, MISS), f)
    common = [x for x in test if all(g(x) for g in G.values())]
    results = []
    for k, g in G.items():
        r = dict(P.judge(common, g), option=k)
        acc = defaultdict(lambda: [0, 0])
        for x in common:
            b = g(x)
            a = acc[season(x)]
            a[0] += 1
            a[1] += b[0] <= x['obs'] <= b[1]
        r['bySeason'] = {s: round(c / n, 4) for s, (n, c) in sorted(acc.items())}
        results.append(r)
    R = {x['option']: x for x in results}
    u = R['U(E,N)']['limits']['2.0']
    share = lambda c: c['brokeLiberada'] / max(1, c['liberada'])    # noqa: E731
    passing = [k for k in ('S-lin', 'S-log')
               if share(R[k]['limits']['2.0']) <= share(u) and R[k]['limits']['2.0']['liberada'] >= 1.05 * u['liberada']
               and R[k]['coverage'] >= 0.90 and min(R[k]['bySeason'].values()) >= 0.90]
    return {
        'what': 'A correction learned from the satellites (no buoy), judged on 15 held-out months: per site and lead bin, IFS and NOAA combined by least squares on the calibration passes, then the same conformal band (apps/janela/audit/postproc.py; rule postproc-eval-v1; a floating-point evaluation).',
        'pairs': {'joined': len(J), 'calibration': len(cal), 'test': len(test), 'testCommon': len(common), 'split': P.SPLIT},
        'cellsFitted': fits, 'miss': '1/10', 'results': results,
        'decision': {'rule': 'postproc-eval-v1 (DEFINITIONS.json)', 'passing': passing,
                     'verdict': ('enters the ledger as a graded proposer: ' + ', '.join(passing)) if passing else 'no correction meets the rule: recorded as measured, not used'}
    }


def main():
    rec = measure()
    if '--check' in sys.argv:
        same = json.dumps(json.load(open(DEST)), sort_keys=True) == json.dumps(rec, sort_keys=True)
        print(f"janela post-processing: re-measured {'equal to' if same else 'DIFFERENT from'} {os.path.relpath(DEST, ROOT)} — {rec['decision']['verdict']} — {'PASS' if same else 'FAIL'}")
        sys.exit(0 if same else 1)
    with open(DEST, 'w') as fh:
        json.dump(rec, fh, indent=1)
        fh.write('\n')
    print('wrote', os.path.relpath(DEST, ROOT), json.dumps(rec['pairs']), rec['cellsFitted'])
    for x in rec['results']:
        l = {k: x['limits'][k] for k in ('1.5', '2.0', '2.5')}
        print(f"  {x['option']:7s} cov {x['coverage']:.3f} width {x['meanWidthM']:.3f} m · " + ' · '.join(f"Hs<={k}: L {v['liberada']} broken {v['brokeLiberada']}" for k, v in l.items()) + f" · seasons {x['bySeason']}")
    print(' ', rec['decision']['verdict'])


if __name__ == '__main__':
    main()
