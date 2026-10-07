"""currents.py — the sea's surface current at every Janela site and production unit, from Copernicus Marine.

apps/janela/audit · cert-machine

    python currents.py [YYYY-MM-DD]     the run's steps -> corpus/janela/currents/YYYYMMDD.json.gz (the sites, kept)
                                        and corpus/janela/field/currents-units-latest.json (the units, the app's day)
    python currents.py --check          the battery (standard library only; no network)

WHY. Petrobras offloads by tandem DP shuttle tankers, whose approach and heading follow the current, and
drills at the Equatorial Margin under the North Brazil Current; Janela forecast waves and wind but no
current. Source: the Copernicus Marine global analysis and forecast at 1/12 degree (Mercator Ocean,
GLOBAL_ANALYSISFORECAST_PHY_001_024, doi:10.48670/moi-00016), dataset
cmems_mod_glo_phy_anfc_merged-uv_PT1H-i: the hourly merged SURFACE current — the ocean model (GLO12)
plus the waves' Stokes drift (MFWAM) plus the tide (FES2014) — kept as the total (utotal, vtotal), its
tidal part (utide, vtide), the ocean circulation alone (uo, vo) and the Stokes drift (vsdx, vsdy), m/s,
the direction the water goes TO (all four from 2026-10-08; the 10-07 record kept the first two). The
circulation is what currents_observe.py grades against the satellite-based GlobCurrent. Read with the Copernicus Marine
toolbox and the account's login (a local credentials file; in the Action the repository secrets
COPERNICUSMARINE_SERVICE_USERNAME / _PASSWORD).

LICENCE (checked 2026-10-07, marine.copernicus.eu/user-corner/service-commitments-and-licence): free,
any purpose including commercial, redistribution and derived products allowed; credit "Generated using
E.U. Copernicus Marine Service Information" with the product DOI, on the page giving access; no warranty.

EXACT. The store keeps float32 values (bit-rounded to binary fractions: -0.3828125 = -49/128); each is
written as the exact fraction of the stored float32. Copernicus rewrites the forecast daily and replaces
it with the analysis, so a value cannot be fetched again: the record keeps the values and pins them by
sha256, as observe.py does for the altimeter.

THE NODE: the nearest node the model calls sea within 3 nodes (feed.sea_index over a 7 x 7 box at the
first step), at 1/12 degree; the steps are the ECMWF run's (0, 6, ..., 168 h). SHOWN, NEVER DECIDED:
a model current is a forecast; it decides nothing until it is measured against observed currents (the
next step: the drifting buoys). A berth or channel current (the terminals' rules) is not the open-sea
model's: those rules stay SEM DADOS.

MIT licensed. Part of cert-machine.
"""
import gzip
import hashlib
import json
import math
import os
import sys
from datetime import date, datetime, timedelta, timezone
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
DATASET = 'cmems_mod_glo_phy_anfc_merged-uv_PT1H-i'
PRODUCT = 'GLOBAL_ANALYSISFORECAST_PHY_001_024'
DOI = 'https://doi.org/10.48670/moi-00016'
CREDIT = 'Generated using E.U. Copernicus Marine Service Information; ' + DOI
VARS = ('utotal', 'vtotal', 'utide', 'vtide', 'uo', 'vo', 'vsdx', 'vsdy')
KEYS = ('u', 'v', 'ut', 'vt', 'uo', 'vo', 'us', 'vs')   # total, tide, ocean circulation (Eulerian), Stokes drift
STEPS = list(range(0, 169, 6))                 # the ECMWF feed's steps (feed.STEPS)
BOX = 3                                        # nodes either side when looking for the nearest sea node
BBOX = (-56.0, -27.0, -36.0, 7.0)              # lon0, lon1, lat0, lat1: the Brazilian margin (field.py's)


def fr(x):
    """the exact fraction of a stored float32 (float32 -> float64 is exact)"""
    q = Fraction(float(x))
    return f'{q.numerator}/{q.denominator}' if q.denominator != 1 else str(q.numerator)


def sea_index(xs):
    """feed.sea_index, the one rule: the box node nearest the centre that is sea (not None)"""
    k = int(round(math.sqrt(len(xs))))
    c = k // 2
    best = None
    for idx, X in enumerate(xs):
        if X is None:
            continue
        j, i = divmod(idx, k)
        d = (j - c) ** 2 + (i - c) ** 2
        if best is None or d < best[0]:
            best = (d, idx)
    return None if best is None else best[1]


def nearest(axis, x):
    """index of the axis value nearest x (an increasing axis)"""
    return min(range(len(axis)), key=lambda k: abs(axis[k] - x))


def times_of(d):
    run = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    return [run + timedelta(hours=h) for h in STEPS]


def check_axis(have, want):
    """every wanted time is on the dataset's axis, or the day is refused (no step is borrowed from another hour)"""
    have = set(have)
    missing = [t for t in want if t not in have]
    if missing:
        raise ValueError(f'REFUSED: {len(missing)} of {len(want)} steps are not on the dataset\'s time axis (first {missing[0]})')


def read(d):
    """the run's steps at every site and unit: {place: {node, steps: [{t, lead, u, v, ut, vt}]}}, and the source"""
    import copernicusmarine as CM
    import numpy as np
    sites = json.load(open(os.path.join(HERE, '..', 'scenario', 'sites.json')))['sites']
    units = json.load(open(os.path.join(HERE, '..', 'scenario', 'platforms.json')))['units']
    places = [(s['id'], s['lat'], s['lon'], 'site') for s in sites] + [(u['id'], u['lat'], u['lon'], 'unit') for u in units]
    want = times_of(d)
    lon0, lon1, lat0, lat1 = BBOX
    # the first step over the margin: which node is sea near each place
    g = CM.open_dataset(dataset_id=DATASET, variables=['utotal'], minimum_longitude=lon0, maximum_longitude=lon1,
                        minimum_latitude=lat0, maximum_latitude=lat1, start_datetime=want[0].strftime('%Y-%m-%dT%H:%M:%S'),
                        end_datetime=want[0].strftime('%Y-%m-%dT%H:%M:%S'), service='arco-geo-series')
    lats = [float(x) for x in g['latitude'].values]
    lons = [float(x) for x in g['longitude'].values]
    f0 = g['utotal'].isel(time=0, depth=0).values
    node = {}
    for pid, la, lo, kind in places:
        j0, i0 = nearest(lats, la), nearest(lons, lo)
        xs = []
        for j in range(j0 + BOX, j0 - BOX - 1, -1):        # north to south, as the GRIB boxes
            for i in range(i0 - BOX, i0 + BOX + 1):
                ok = 0 <= j < len(lats) and 0 <= i < len(lons) and np.isfinite(f0[j, i])
                xs.append(1 if ok else None)
        k = sea_index(xs)
        if k is None:
            continue
        r, c = divmod(k, 2 * BOX + 1)
        node[pid] = (j0 + BOX - r, i0 - BOX + c, kind)
    # the steps at those nodes (the time-series service: one chunk per place and variable)
    ds = CM.open_dataset(dataset_id=DATASET, variables=list(VARS), minimum_longitude=lon0, maximum_longitude=lon1,
                         minimum_latitude=lat0, maximum_latitude=lat1, start_datetime=want[0].strftime('%Y-%m-%dT%H:%M:%S'),
                         end_datetime=want[-1].strftime('%Y-%m-%dT%H:%M:%S'), service='arco-time-series')
    axis = [datetime.fromtimestamp(int(t) / 1e9, tz=timezone.utc) for t in ds['time'].values.astype('datetime64[ns]').astype('int64')]
    check_axis(axis, want)
    ti = [axis.index(t) for t in want]
    ids = list(node)
    jj = np.array([node[p][0] for p in ids])
    ii = np.array([node[p][1] for p in ids])
    import xarray as xr
    J, I = xr.DataArray(jj, dims='p'), xr.DataArray(ii, dims='p')
    vals = {v: ds[v].isel(time=ti, depth=0, latitude=J, longitude=I).values for v in VARS}   # (time, place)
    out = {}
    for n, pid in enumerate(ids):
        j, i, kind = node[pid]
        steps = []
        for k, t in enumerate(want):
            row = {'t': t.strftime('%Y-%m-%dT%H'), 'lead': STEPS[k]}
            for v, key in zip(VARS, KEYS):
                x = vals[v][k, n]
                if np.isfinite(x):
                    row[key] = fr(x)
            steps.append(row)
        out[pid] = {'kind': kind, 'node': [round(lats[j], 6), round(lons[i], 6)], 'steps': steps}
    src = {'product': PRODUCT, 'dataset': DATASET, 'doi': DOI, 'variables': list(VARS),
           'title': ds.attrs.get('title'), 'source': ds.attrs.get('source'), 'grid': '1/12 degree', 'depth': float(ds['depth'].values[0])}
    return out, src


def main():
    d = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1] else datetime.now(timezone.utc).date()
    keep = os.path.join(ROOT, 'corpus', 'janela', 'currents', d.strftime('%Y%m%d') + '.json.gz')
    units_out = os.path.join(ROOT, 'corpus', 'janela', 'field', 'currents-units-latest.json')
    places, src = read(d)
    made = datetime.now(timezone.utc).isoformat(timespec='seconds')
    sites = {k: v for k, v in places.items() if v['kind'] == 'site'}
    units = {k: v for k, v in places.items() if v['kind'] == 'unit'}
    base = {'what': 'The surface current (total = ocean circulation + Stokes drift + tide, and each part) at the Janela places, read by '
                    'apps/janela/audit/currents.py; exact fractions of the stored float32 values, m/s, the direction the water goes TO. '
                    'Shown on the app, never decided on.',
            'licence': CREDIT + ' — free for any purpose, redistribution and derived products allowed with this credit; no warranty '
                       '(marine.copernicus.eu/user-corner/service-commitments-and-licence)',
            'run': d.strftime('%Y-%m-%dT00'), 'madeAt': made, 'source': src}
    rec_units = dict(base, places=units)
    rec_units['sha256'] = hashlib.sha256(json.dumps(units, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    os.makedirs(os.path.dirname(units_out), exist_ok=True)
    with open(units_out, 'w') as fh:
        json.dump(rec_units, fh, separators=(',', ':'))
    print('currents: units', len(units), '->', os.path.relpath(units_out, ROOT), os.path.getsize(units_out), 'bytes')
    if os.path.exists(keep):
        print('currents: the sites of', d, 'already kept:', os.path.relpath(keep, ROOT))
        return
    rec = dict(base, places=sites)
    rec['sha256'] = hashlib.sha256(json.dumps(sites, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    os.makedirs(os.path.dirname(keep), exist_ok=True)
    with open(keep, 'wb') as fh:
        fh.write(gzip.compress(json.dumps(rec, separators=(',', ':')).encode(), mtime=0))
    print('currents: sites', len(sites), '->', os.path.relpath(keep, ROOT), os.path.getsize(keep), 'bytes')


def check():
    ok, bad = [], []

    def test(name, fn, red=False):
        try:
            fn()
            (bad if red else ok).append(name)
        except (ValueError, AssertionError) as e:
            (ok if red else bad).append(name + ('' if red else f' ({e})'))

    def t_exact():
        assert fr(-0.3828125) == '-49/128' and fr(0.015625) == '1/64' and fr(0.0) == '0'
    test('the stored float32 written as its exact fraction (-0.3828125 = -49/128)', t_exact)

    def t_node():
        box = [None] * 49
        box[24] = None                       # the centre is land
        box[31] = 1                          # one node south of the centre is sea
        box[0] = 1                           # a corner is sea too, farther
        assert sea_index(box) == 31
        assert sea_index([None] * 49) is None
    test('the nearest sea node within 3 nodes: the centre on land -> the next sea node, never a farther one', t_node)

    def t_steps():
        ts = times_of(date(2026, 10, 7))
        assert len(ts) == 29 and ts[0].isoformat() == '2026-10-07T00:00:00+00:00' and ts[-1].isoformat() == '2026-10-14T00:00:00+00:00'
    test('the steps are the ECMWF run\'s: 0, 6, ..., 168 h (29)', t_steps)
    test('RED a dataset whose time axis stops at +162 h is refused, never padded', lambda: check_axis(times_of(date(2026, 10, 7))[:-1], times_of(date(2026, 10, 7))), red=True)
    test('RED an axis on the half hour misses every step and is refused', lambda: check_axis([t + timedelta(minutes=30) for t in times_of(date(2026, 10, 7))], times_of(date(2026, 10, 7))), red=True)

    def t_nearest():
        ax = [-36 + k / 12 for k in range(517)]
        assert abs(ax[nearest(ax, -25.5)] + 25.5) < 1e-9
    test('the nearest axis index (1/12 degree): -25.5 lands on -25.5', t_nearest)
    for n in ok:
        print('  ok  ', n)
    for n in bad:
        print('  FAIL', n)
    reds = sum(1 for n in ok if n.startswith('RED'))
    print(f'janela currents battery: {len(ok) - reds} pass, {len(bad)} fail, {reds} red controls fired')
    return not bad


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        sys.exit(0 if check() else 1)
    main()
