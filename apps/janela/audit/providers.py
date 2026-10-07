"""providers.py — which band should decide when there are two forecast providers? Measured, not argued.

apps/janela/audit · cert-machine

    python providers.py            re-measure and write certs/janela-providers-eval.json
    python providers.py --check    re-measure and compare with the committed record (standard library only)
    python providers.py --region sergipe [--check]     (or JANELA_REGION=sergipe)
                                   the same for a measured region, from its own two chains (regions.json)
                                   -> certs/janela-providers-eval-<region>.json

THE QUESTION (2026-10-07, the operator: "you decide the best and reliable — ask what Petrobras
needs"). Petrobras acts on a LIBERADA: a window the sea then breaks costs a shuttle tanker, a lift
vessel or a PSV, and sometimes more. So the order is: a LIBERADA must hold; then as many decisive
windows as possible (waiting costs day rates and tank capacity); then a claim a marine warranty
surveyor can re-check.

THE MEASUREMENT. Both providers' forecast-vs-altimeter pairs (corpus/janela/matchups.json.gz,
matchups-noaa.json.gz) joined on the same pass, site and run: 45,987 pairs. A TIME SPLIT: bands are
calibrated on the passes before 2025-07-01 and judged on the 15 months after, which they never saw.
Each option is the conformal ratio band of bands.js (per site and 12 h lead bin, symmetric order
statistics, the same rule) built on a different forecast:
    E        ECMWF's deterministic Hs (calibrated-v1's construction)
    N        NOAA GFS-Wave's (calibrated-noaa-v1's)
    M50      the two providers' mean — the weight fixed BEFORE the test, on an inner split of the
             calibration years (validation width is flat at 0.5-0.6; the plain mean was taken)
    U(E,N)   the union of E and N (providers-v1)
at miss 1/10, 1/20 and 1/40. Judged at every held-out pair: coverage, mean width, and, for the
presets' Hs limits (1.5, 2.0, 2.5, 3.5 m), the steps the band calls LIBERADA (upper edge within the
limit) and how many of those the satellite saw above the limit.

Floating point is used to MEASURE here (a statistical evaluation, printed as such); the bands that
decide are exact (bands.js, conformal.js). Point-level (one step): a window LIBERADA needs every
step, so window rates are higher, in the same order.

MIT licensed. Part of cert-machine.
"""
import gzip
import json
import os
import sys
from collections import defaultdict
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
REGION = sys.argv[sys.argv.index('--region') + 1] if '--region' in sys.argv else os.environ.get('JANELA_REGION')
if REGION:
    _r = json.load(open(os.path.join(HERE, '..', 'scenario', 'regions.json')))['regions'].get(REGION)
    if not _r or not _r.get('noaa'):
        raise SystemExit(f'REFUSED: region {REGION!r} has no two chains in regions.json')
    PATHS = (_r['matchups'], _r['noaa']['matchups'])
    DEST = os.path.join(ROOT, 'certs', f'janela-providers-eval-{REGION}.json')
else:
    PATHS = ('corpus/janela/matchups.json.gz', 'corpus/janela/matchups-noaa.json.gz')
    DEST = os.path.join(ROOT, 'certs', 'janela-providers-eval.json')
SPLIT, INNER = '2025-07-01', '2024-10-01'
LIMITS = [1.5, 2.0, 2.5, 3.5]
MISSES = [(1, 10), (1, 20), (1, 40)]
BIN_H, MAX_H = 12, 168


def load():
    rd = lambda p: json.loads(gzip.open(os.path.join(ROOT, p)).read())   # noqa: E731
    E, N = rd(PATHS[0]), rd(PATHS[1])
    key = lambda r: (r[0], r[1], r[2], r[6])                             # noqa: E731
    ne = {key(r): r for r in N['rows']}
    f = lambda s: float(Fraction(s))                                     # noqa: E731
    out = []
    for r in E['rows']:
        q = ne.get(key(r))
        if q is None:
            continue
        if abs(r[7] - q[7]) > 1e-6:
            raise SystemExit('REFUSED: the two providers disagree on the lead of one pass')
        out.append({'site': r[0], 't': r[2], 'lead': r[7], 'obs': f(r[4]), 'fe': f(r[8]), 'fn': f(q[8])})
    return out, len(E['rows']), len(N['rows'])


def conf(vals, mn, md):
    """bands.js / conformal.js's symmetric order statistics, on floats (an evaluation)"""
    xs = sorted(vals)
    n = len(xs)
    if (n - 1) * md < (n + 1) * (md - mn):
        return None
    t = max(1, (n + 1) * mn // (2 * md))
    while t > 1 and (n - 2 * t) * md < (n + 1) * (md - mn):
        t -= 1
    return xs[t - 1], xs[n - t]


def binof(lead):
    return min(int(lead // BIN_H), MAX_H // BIN_H - 1)


FCS = {'E': lambda x: x['fe'], 'N': lambda x: x['fn'], 'M50': lambda x: (x['fe'] + x['fn']) / 2}


def build(rows, fc, miss):
    g = defaultdict(list)
    for x in rows:
        v = fc(x)
        if v > 0:
            g[(x['site'], binof(x['lead']))].append(x['obs'] / v)
    return {k: conf(v, *miss) for k, v in g.items()}


def getter(B, fc):
    def get(x):
        b = B.get((x['site'], binof(x['lead'])))
        if not b:
            return None
        v = fc(x)
        return v * b[0], v * b[1]
    return get


def judge(rows, get):
    n = cov = 0
    width = 0.0
    lim = {str(l): {'liberada': 0, 'brokeLiberada': 0, 'brokeBy10pc': 0, 'vetada': 0, 'wrongVetada': 0} for l in LIMITS}
    for x in rows:
        b = get(x)
        if not b:
            continue
        n += 1
        cov += b[0] <= x['obs'] <= b[1]
        width += b[1] - b[0]
        for l in LIMITS:
            c = lim[str(l)]
            if b[1] <= l:
                c['liberada'] += 1
                if x['obs'] > l:
                    c['brokeLiberada'] += 1
                    c['brokeBy10pc'] += x['obs'] > 1.1 * l
            elif b[0] > l:
                c['vetada'] += 1
                c['wrongVetada'] += x['obs'] <= l
    return {'n': n, 'coverage': round(cov / n, 4), 'meanWidthM': round(width / n, 4), 'limits': lim}


def measure():
    J, ne, nn = load()
    cal = [x for x in J if x['t'] < SPLIT]
    test = [x for x in J if x['t'] >= SPLIT]
    inner_a = [x for x in cal if x['t'] < INNER]
    inner_b = [x for x in cal if x['t'] >= INNER]
    weights = []
    for w in (0.0, 0.25, 0.4, 0.5, 0.6, 0.67, 0.75, 0.85, 1.0):
        fc = lambda x, w=w: w * x['fe'] + (1 - w) * x['fn']               # noqa: E731
        r = judge(inner_b, getter(build(inner_a, fc, (1, 10)), fc))
        weights.append({'wEcmwf': w, 'coverage': r['coverage'], 'meanWidthM': r['meanWidthM']})
    results = []
    for miss in MISSES:
        G = {k: getter(build(cal, fc, miss), fc) for k, fc in FCS.items()}
        G['U(E,N)'] = lambda x, G=G: (lambda a, b: None if not a or not b else (min(a[0], b[0]), max(a[1], b[1])))(G['E'](x), G['N'](x))
        for k, g in G.items():
            results.append(dict(judge(test, g), option=k, miss=f'{miss[0]}/{miss[1]}'))
    # CONDITIONAL reliability at 1/10: does the band hold where decisions are made (the wave regime) and in every season?
    # 'above' is the dangerous side for a LIBERADA: the sea above the band's upper edge
    def regime(x):
        f = (x['fe'] + x['fn']) / 2
        return '<1 m' if f < 1 else '1-2 m' if f < 2 else '2-3 m' if f < 3 else '>=3 m'

    def season(x):
        return {12: 'DJF', 1: 'DJF', 2: 'DJF', 3: 'MAM', 4: 'MAM', 5: 'MAM', 6: 'JJA', 7: 'JJA', 8: 'JJA'}.get(int(x['t'][5:7]), 'SON')
    G10 = {k: getter(build(cal, fc, (1, 10)), fc) for k, fc in FCS.items()}
    G10['U(E,N)'] = lambda x: (lambda a, b: None if not a or not b else (min(a[0], b[0]), max(a[1], b[1])))(G10['E'](x), G10['N'](x))
    conditional = {}
    for k in ('E', 'U(E,N)'):
        for name, keyf in (('regime', regime), ('season', season)):
            acc = defaultdict(lambda: [0, 0, 0])
            for x in test:
                b = G10[k](x)
                if not b:
                    continue
                a = acc[keyf(x)]
                a[0] += 1
                a[1] += b[0] <= x['obs'] <= b[1]
                a[2] += x['obs'] > b[1]
            conditional.setdefault(k, {})[name] = {g: {'n': n, 'coverage': round(c / n, 4), 'above': round(ab / n, 4)} for g, (n, c, ab) in sorted(acc.items())}
    return {
        'what': 'Which band should decide when Janela has two forecast providers: each option judged on 15 held-out months of satellite passes it never saw (apps/janela/audit/providers.py; a floating-point evaluation — the deciding bands are exact).',
        **({'region': REGION} if REGION else {}),
        'pairs': {'ecmwf': ne, 'noaa': nn, 'joined': len(J), 'calibration': len(cal), 'test': len(test),
                  'split': SPLIT, 'innerSplit': INNER},
        'weightSelection': {'on': 'inner split of the calibration years only (before ' + INNER + ' -> ' + INNER + '..' + SPLIT + ')', 'miss': '1/10',
                            'grid': weights, 'chosen': 0.5, 'why': 'validation width is flat at 0.5-0.6; the plain mean has no tuned parameter'},
        'options': {'E': "ECMWF's deterministic Hs x its conformal ratio band (calibrated-v1)", 'N': "NOAA GFS-Wave's (calibrated-noaa-v1)",
                    'M50': "the two providers' mean x its own conformal ratio band", 'U(E,N)': 'the union of E and N (providers-v1)'},
        'results': results,
        'conditional': {'miss': '1/10', 'by': 'the providers\' mean forecast Hs (regime) and the target\'s season; above = the sea over the upper edge', 'options': conditional},
    }


def main():
    rec = measure()
    if '--check' in sys.argv:
        old = json.load(open(DEST))
        same = json.dumps(old, sort_keys=True) == json.dumps(rec, sort_keys=True)
        r = {(x['option'], x['miss']): x for x in rec['results']}
        u, e = r[('U(E,N)', '1/10')], r[('E', '1/10')]
        ok = same and u['coverage'] > e['coverage'] and u['limits']['2.0']['brokeLiberada'] * e['limits']['2.0']['liberada'] < e['limits']['2.0']['brokeLiberada'] * u['limits']['2.0']['liberada']
        print(f"janela providers: re-measured {'equal to' if same else 'DIFFERENT from'} {os.path.relpath(DEST, ROOT)}; "
              f"union coverage {u['coverage']} vs ECMWF {e['coverage']}; LIBERADA broken at Hs<=2.0: union "
              f"{u['limits']['2.0']['brokeLiberada']}/{u['limits']['2.0']['liberada']}, ECMWF {e['limits']['2.0']['brokeLiberada']}/{e['limits']['2.0']['liberada']}"
              f" — {'PASS' if ok else 'FAIL'}")
        sys.exit(0 if ok else 1)
    with open(DEST, 'w') as fh:
        json.dump(rec, fh, indent=1)
        fh.write('\n')
    print('wrote', os.path.relpath(DEST, ROOT))
    for x in rec['results']:
        l2 = x['limits']['2.0']
        print(f"  {x['miss']:5s} {x['option']:7s} coverage {x['coverage']:.3f} width {x['meanWidthM']:.3f} m · Hs<=2.0: LIBERADA {l2['liberada']}, broken {l2['brokeLiberada']} ({100 * l2['brokeLiberada'] / max(1, l2['liberada']):.2f}%)")


if __name__ == '__main__':
    main()
