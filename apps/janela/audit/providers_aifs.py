"""providers_aifs.py — does ECMWF's data-driven AIFS wave forecast earn a place beside IFS and NOAA? Measured.

apps/janela/audit · cert-machine

    python providers_aifs.py            measure and write certs/janela-providers-eval-aifs.json
    python providers_aifs.py --check    re-measure and compare with the committed record

The rule, the split and the decision were dated in certs/janela-ledger/DEFINITIONS.json
('providers-eval-aifs-v1') before any AIFS pair was judged. In short: the three providers' pairs joined on
the same pass, site and run; every band calibrated on the passes before 2026-08-01 (E and N on their own
history from 2023-07-12, A on its own from 2026-05-13, and E also on A's short window — E-short — so the
model is separated from the calibration length); judged on the passes from 2026-08-01; miss 1/10; compared
on the pairs where every option has a band. providers.py's band, judge and union, reused — one definition.

A floating-point evaluation (the deciding bands are exact). MIT licensed. Part of cert-machine.
"""
import gzip
import json
import math
import os
import sys
from collections import defaultdict
from fractions import Fraction

import providers as P

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
DEST = os.path.join(ROOT, 'certs', 'janela-providers-eval-aifs.json')
PATHS = {'E': 'corpus/janela/matchups.json.gz', 'N': 'corpus/janela/matchups-noaa.json.gz', 'A': 'corpus/janela/matchups-aifs.json.gz'}
SPLIT, A_FIRST = '2026-08-01', '2026-05-13'
MISS = (1, 10)


def load():
    rd = lambda p: json.loads(gzip.open(os.path.join(ROOT, p)).read())   # noqa: E731
    R = {k: rd(p) for k, p in PATHS.items()}
    key = lambda r: (r[0], r[1], r[2], r[6])                             # noqa: E731
    f = lambda s: float(Fraction(s))                                     # noqa: E731
    idx = {k: {key(r): r for r in R[k]['rows']} for k in ('N', 'A')}
    hist, joint = [], []
    for r in R['E']['rows']:
        q = idx['N'].get(key(r))
        if q is None:
            continue
        x = {'site': r[0], 't': r[2], 'run': r[6], 'lead': r[7], 'obs': f(r[4]), 'fe': f(r[8]), 'fn': f(q[8])}
        hist.append(x)
        a = idx['A'].get(key(r))
        if a is not None:
            if abs(a[7] - r[7]) > 1e-6:
                raise SystemExit('REFUSED: AIFS and IFS disagree on the lead of one pass')
            joint.append(dict(x, fa=f(a[8])))
    return hist, joint, {k: len(R[k]['rows']) for k in R}


def union(*gs):
    def g(x):
        bs = [h(x) for h in gs]
        if any(b is None for b in bs):
            return None
        return min(b[0] for b in bs), max(b[1] for b in bs)
    return g


def skill(rows, fc):
    """bias and RMS of a deterministic forecast against the satellite, by lead day"""
    acc = defaultdict(lambda: [0, 0.0, 0.0])
    for x in rows:
        a = acc[min(int(x['lead'] // 24), 6)]
        e = fc(x) - x['obs']
        a[0] += 1
        a[1] += e
        a[2] += e * e
    return {f'day {d}': {'n': n, 'bias': round(s / n, 3), 'rms': round(math.sqrt(q / n), 3)} for d, (n, s, q) in sorted(acc.items())}


def measure():
    hist, joint, sizes = load()
    calL = [x for x in hist if x['t'] < SPLIT]                 # E and N: their own history
    calS = [x for x in joint if x['t'] < SPLIT]                # A and E-short: A's window
    test = [x for x in joint if x['t'] >= SPLIT]
    FE, FN, FA = (lambda x: x['fe']), (lambda x: x['fn']), (lambda x: x['fa'])
    FM = lambda x: (x['fe'] + x['fa']) / 2                     # noqa: E731
    G = {'E': P.getter(P.build(calL, FE, MISS), FE), 'N': P.getter(P.build(calL, FN, MISS), FN),
         'A': P.getter(P.build(calS, FA, MISS), FA), 'E-short': P.getter(P.build(calS, FE, MISS), FE),
         'M(E,A)': P.getter(P.build(calS, FM, MISS), FM)}
    G['U(E,N)'] = union(G['E'], G['N'])
    G['U(E,N,A)'] = union(G['E'], G['N'], G['A'])
    G['U(E,A)'] = union(G['E'], G['A'])
    common = [x for x in test if all(g(x) for g in G.values())]
    results = [dict(P.judge(common, g), option=k) for k, g in G.items()]
    r = {x['option']: x for x in results}
    u, ua = r['U(E,N)']['limits']['2.0'], r['U(E,N,A)']['limits']['2.0']
    share = lambda c: c['brokeLiberada'] / max(1, c['liberada'])   # noqa: E731
    enters = share(ua) <= share(u) and ua['liberada'] >= 0.95 * u['liberada']
    replaces = [k for k in ('U(E,A)',) if share(r[k]['limits']['2.0']) < share(u) and r[k]['limits']['2.0']['liberada'] > u['liberada']]
    ue = r['U(E,A)']['limits']['2.0']
    detail = (f"U(E,A) {ue['liberada']} LIBERADA, {ue['brokeLiberada']} broken against U(E,N) {u['liberada']}, {u['brokeLiberada']} broken")
    # the rule makes both conditions NECESSARY ("only if"), never sufficient: what is adopted is written in DEFINITIONS.json
    verdict = ('A meets the condition to ENTER the deciding union (' + detail + ')' if enters else
               'A meets the necessary condition to replace NOAA in the union (' + detail + '); the adoption is decided in DEFINITIONS.json' if replaces else
               'A meets neither condition: committed and graded as a proposer (shown, scored, never deciding)')
    return {
        'what': 'Whether ECMWF\'s data-driven AIFS Single wave forecast earns a place beside IFS and NOAA GFS-Wave: every band calibrated before '
                + SPLIT + ' and judged on the satellite passes after (apps/janela/audit/providers_aifs.py; rule dated in DEFINITIONS.json as providers-eval-aifs-v1; a floating-point evaluation).',
        'pairs': {'ecmwf': sizes['E'], 'noaa': sizes['N'], 'aifs': sizes['A'], 'joinedHistory': len(hist), 'joinedThree': len(joint),
                  'calibrationLong': len(calL), 'calibrationShort': len(calS), 'test': len(test), 'testCommon': len(common), 'split': SPLIT, 'aifsFirst': A_FIRST},
        'options': {'E': 'IFS Hs x its band, calibrated on its own history from 2023-07-12', 'N': 'NOAA GFS-Wave Hs x its band, likewise',
                    'A': 'AIFS Single Hs x its band, calibrated on its own pairs from 2026-05-13', 'E-short': 'IFS on A\'s short window (the model separated from the calibration length)',
                    'M(E,A)': 'the plain mean of IFS and AIFS on A\'s window', 'U(E,N)': 'today\'s deciding rule (providers-v1)', 'U(E,N,A)': 'the three-band union', 'U(E,A)': 'IFS and AIFS'},
        'miss': '1/10',
        'results': results,
        'skillOnTest': {'E': skill(common, FE), 'N': skill(common, FN), 'A': skill(common, FA)},
        'decision': {'rule': 'providers-eval-aifs-v1 (DEFINITIONS.json)', 'enterCondition': enters, 'replaceConditionMetBy': replaces, 'verdict': verdict},
    }


def main():
    rec = measure()
    if '--check' in sys.argv:
        old = json.load(open(DEST))
        same = json.dumps(old, sort_keys=True) == json.dumps(rec, sort_keys=True)
        print(f"janela providers (AIFS): re-measured {'equal to' if same else 'DIFFERENT from'} {os.path.relpath(DEST, ROOT)} — {rec['decision']['verdict']} — {'PASS' if same else 'FAIL'}")
        sys.exit(0 if same else 1)
    with open(DEST, 'w') as fh:
        json.dump(rec, fh, indent=1)
        fh.write('\n')
    print('wrote', os.path.relpath(DEST, ROOT), json.dumps(rec['pairs']))
    for x in rec['results']:
        l2 = x['limits']['2.0']
        print(f"  {x['option']:9s} coverage {x['coverage']:.3f} width {x['meanWidthM']:.3f} m · Hs<=2.0: LIBERADA {l2['liberada']}, broken {l2['brokeLiberada']} ({100 * l2['brokeLiberada'] / max(1, l2['liberada']):.2f}%)")
    for k, s in rec['skillOnTest'].items():
        print('  skill', k, ' '.join(f"{d}: {v['bias']:+.2f}/{v['rms']:.2f}" for d, v in s.items()))
    print(' ', rec['decision']['verdict'])


if __name__ == '__main__':
    main()
