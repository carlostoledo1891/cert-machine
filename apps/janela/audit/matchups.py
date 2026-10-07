"""matchups.py — every (forecast, satellite) pair the back-archive holds.

apps/janela/audit · cert-machine

    python matchups.py        reads corpus/janela/cache/{ecmwf,alt}/, writes corpus/janela/matchups.json.gz
    JANELA_PROVIDER=noaa python matchups.py
                              the second provider: corpus/janela/cache/{noaa,alt}/ -> corpus/janela/matchups-noaa.json.gz
                              (NOAA GFS-Wave runs, archive.py noaa), the same passes, sites and rule

A matchup is a satellite pass near a site (passes.py: the ONE definition of
an observation) and an ECMWF 00 UTC run issued before it: the run's
significant wave height at the site's sea node, linearly interpolated in time
between the two forecast steps that bracket the pass mid-time — exact
rational arithmetic on exact rational values; the interpolation is the one
modelling choice and it is stated. Every run from 0 to 7 days before the pass
gives one pair, so one pass carries up to eight leads.

The site's sea node: in each grid (0.4° before 2024-02-29, 0.25° from it),
the box node nearest the site that the model calls sea in the step-0 wave
field. Terminal sites (inside bays) are skipped: a satellite footprint there
is land-contaminated and the node is the approach, not the berth.

MIT licensed. Part of cert-machine.
"""
import gzip
import json
import math
import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone, date
from fractions import Fraction

import ecmwf as E
from passes import passes

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
CACHE = os.path.join(ROOT, 'corpus', 'janela', 'cache')
SITES = [s for s in json.load(open(os.path.join(HERE, '..', 'scenario', 'sites.json')))['sites'] if s['kind'] != 'terminal']
DEST = os.path.join(ROOT, 'corpus', 'janela', 'matchups.json.gz')
# JANELA_REGION=<name>: the region's cache, sites and matchups file (regions.json)
import region as _region
REGION = _region.current()
if REGION:
    CACHE, DEST = REGION['cache'], REGION['matchups']
    SITES = [s for s in SITES if s['id'] in set(REGION['sites'])]
else:
    # the eight sites of 2026-10-06: a site added later is measured in its own region, never folded in here
    _regional = {sid for r in json.load(open(os.path.join(HERE, '..', 'scenario', 'regions.json')))['regions'].values() for sid in r['sites']}
    SITES = [s for s in SITES if s['id'] not in _regional]
MAX_LEAD_H = 168
# JANELA_PROVIDER=noaa: the forecasts are NOAA's GFS-Wave runs (archive.py noaa: same steps, same field record,
# ECMWF's parameter names), paired with the same passes at the same sites by the same rule
PROVIDER = os.environ.get('JANELA_PROVIDER', 'ecmwf')
if PROVIDER not in ('ecmwf', 'noaa'):
    raise SystemExit(f'REFUSED: JANELA_PROVIDER={PROVIDER!r} (ecmwf or noaa)')
if PROVIDER == 'noaa':
    if REGION:
        raise SystemExit('REFUSED: NOAA is calibrated at the eight open-sea sites of 2026-10-06 only (no region yet)')
    DEST = os.path.join(ROOT, 'corpus', 'janela', 'matchups-noaa.json.gz')
SOURCE = {'ecmwf': 'ECMWF open-data 00 UTC runs', 'noaa': 'NOAA GFS-Wave (WAVEWATCH III) 00 UTC runs'}[PROVIDER]


def load_ecmwf():
    runs = {}
    root = os.path.join(CACHE, PROVIDER)
    for ym in sorted(os.listdir(root)):
        for f in sorted(os.listdir(os.path.join(root, ym))):
            if f.endswith('.json'):
                d = json.load(open(os.path.join(root, ym, f)))
                runs[d['date']] = d
    return runs


def load_alt():
    by_day = defaultdict(list)
    root = os.path.join(CACHE, 'alt')
    for ym in sorted(os.listdir(root)):
        for f in sorted(os.listdir(os.path.join(root, ym))):
            if f.endswith('.json'):
                d = json.load(open(os.path.join(root, ym, f)))
                by_day[d['date']].append(d)
    return by_day


def sea_node(run, site_id):
    """index of the sea node nearest the box centre, from the step-0 swh field."""
    f0 = next((f for f in run['fields'] if f['stream'] == 'wave' and f['param'] == 'swh' and f['step'] == 0), None)
    if f0 is None:
        return None
    xs = f0['X'][site_id]
    k = int(round(math.sqrt(len(xs))))
    c = k // 2
    best = None
    for idx, X in enumerate(xs):
        if X is None:
            continue
        j, i = divmod(idx, k)
        dd = (j - c) ** 2 + (i - c) ** 2
        if best is None or dd < best[0]:
            best = (dd, idx)
    return None if best is None else best[1]


def series(run, site_id, node, param='swh', stream='wave'):
    """{step: exact value} at the node."""
    out = {}
    for f in run['fields']:
        if f['stream'] == stream and f['param'] == param:
            X = f['X'][site_id][node]
            if X is not None:
                out[f['step']] = E.value(f, X)
    return out


def at(sw, lead):
    """linear in time between the bracketing steps, exact; None outside the steps."""
    steps = sorted(sw)
    lo = max((st for st in steps if st <= lead), default=None)
    hi = min((st for st in steps if st >= lead), default=None)
    if lo is None or hi is None:
        return None, None
    if hi == lo:
        return sw[lo], 0
    w = (lead - lo) / (hi - lo)
    return sw[lo] + (sw[hi] - sw[lo]) * w, hi - lo


def fr(x):
    return f'{x.numerator}/{x.denominator}' if x.denominator != 1 else str(x.numerator)


def main():
    runs = load_ecmwf()
    alt = load_alt()
    nodes = {}
    rows = []
    for s in SITES:
        sid = s['id']
        days = sorted(alt)
        for day in days:
            for p in passes(alt[day], sid):
                tau = p['tMid']
                for back in range(0, 8):
                    rd = (tau - timedelta(days=back)).date()
                    run = runs.get(rd.isoformat())
                    if run is None:
                        continue
                    key = (run['grid'], sid)
                    if key not in nodes:
                        nodes[key] = sea_node(run, sid)
                    node = nodes[key]
                    if node is None:
                        continue
                    base = datetime(rd.year, rd.month, rd.day, tzinfo=timezone.utc)
                    lead_s = Fraction(round((tau - base).total_seconds() * 1000), 1000)
                    lead = lead_s / 3600
                    if lead < 0 or lead > MAX_LEAD_H:
                        continue
                    f, width = at(series(run, sid, node), lead)
                    if f is None:
                        continue
                    # 10 m wind: u and v each linear in time, then u^2 + v^2 (exact; the speed itself is irrational)
                    u, uw = at(series(run, sid, node, '10u', 'oper'), lead)
                    v, vw = at(series(run, sid, node, '10v', 'oper'), lead)
                    w2 = None if u is None or v is None else u * u + v * v
                    rows.append([sid, p['mission'], tau.isoformat(timespec='seconds'), p['n'], fr(p['hs']), p['distMeanKm'],
                                 rd.isoformat(), float(round(lead, 3)), fr(f), run['grid'], width,
                                 None if p['wind'] is None else fr(p['wind']), None if w2 is None else fr(w2), uw])
        print(sid, sum(1 for r in rows if r[0] == sid), 'pairs', flush=True)
    node_ll = {}
    for (grid, sid), k in nodes.items():
        run = next(r for r in runs.values() if grid in r['nodes'])
        node_ll.setdefault(grid, {})[sid] = None if k is None else run['nodes'][grid][sid][k]
    out = {
        'what': 'Forecast-vs-satellite pairs at the Janela open-sea sites: ' + SOURCE + ' (swh at the site sea node, linear in time between bracketing steps) against NOAA RADS NRT altimeter passes (passes.py). Built by apps/janela/audit/matchups.py from the back-archive.',
        **({'provider': PROVIDER} if PROVIDER != 'ecmwf' else {}),
        'columns': ['site', 'mission', 'pass mid-time (UTC)', 'points', 'observed Hs (m, exact mean)', 'mean distance (km)',
                    'run date (00 UTC)', 'lead (h)', 'forecast Hs (m, exact)', 'grid', 'bracket width (h)', 'altimeter wind (m/s, exact mean)',
                    'forecast u^2+v^2 at 10 m (m2/s2, exact; u and v linear in time)', 'wind bracket width (h)'],
        'nodes': node_ll,
        'definition': {'radiusKm': 100, 'gapS': 120, 'minPoints': 5, 'interpolation': 'linear in time between bracketing steps'},
        'rows': rows,
    }
    blob = json.dumps(out, separators=(',', ':')).encode()
    dest = DEST
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'wb') as fh:
        fh.write(gzip.compress(blob, mtime=0))
    print('wrote', len(rows), 'pairs,', os.path.getsize(dest), 'bytes gzipped')


if __name__ == '__main__':
    main()
