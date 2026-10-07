"""currents_observe.py — what the satellites say the surface current WAS at the Janela sites, day by day, kept.

apps/janela/audit · cert-machine

    python currents_observe.py          observe every UTC day from FIRST up to three days ago not yet kept
    python currents_observe.py --check  the battery (standard library only; no network)

WHY. The current forecast (currents.py) decides nothing until it is graded against an observation that
the model did not make. The drifting buoys were scouted first (corpus/targets.json janela-currents-truth):
three drifters in the whole Brazilian margin in 30 days, none within 150 km of any site — no record in
months. The observation-based truth that exists every day at every site is Copernicus GlobCurrent
(MULTIOBS_GLO_PHY_MYNRT_015_003, doi:10.48670/mds-00327), near real time: the surface current from
satellite altimetry (geostrophy) plus the wind-driven Ekman part, calibrated on drifters, hourly at 1/4°.
It is built from observations, not from the forecast model (GLO12), so the model can be graded against it.

THE TARGET (current-truth-v1, certs/janela-ledger/DEFINITIONS.json): GlobCurrent's total current uo, vo
(geostrophic + Ekman) at the site's nearest 1/4° sea node at the forecast's steps (00, 06, 12, 18 UTC),
with its tidal part kept apart (utide, vtide). The forecast it is compared with is the model's ocean
circulation (currents.py uo, vo — no tide, no Stokes drift): like with like.

VERSION. Each day records the dataset version it read and its retirement date (202411 retires 2026-11-24): a
successor version is a new truth definition, dated before it is used, never mixed silently.

WHEN. GlobCurrent NRT lands about three days late; a day is observed when it is at least three days old
AND all four steps are on the dataset's axis; days in order, each written once (guard.js add-only) to
corpus/janela/currents-observed/YYYYMMDD.json with the values as exact fractions of the stored floats and
their sha256 (NRT is reprocessed: the bytes cannot be fetched again).

MIT licensed. Part of cert-machine.
"""
import hashlib
import json
import os
import sys
from datetime import date, datetime, timedelta, timezone

import currents as C

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'corpus', 'janela', 'currents-observed')
DATASET = 'cmems_obs-mob_glo_phy-cur_nrt_0.25deg_PT1H-i'
PRODUCT = 'MULTIOBS_GLO_PHY_MYNRT_015_003'
DOI = 'https://doi.org/10.48670/mds-00327'
VARS = ('uo', 'vo', 'utide', 'vtide')
KEYS = ('uo', 'vo', 'ut', 'vt')
FIRST = date(2026, 10, 8)           # the first day the forecast kept the ocean circulation (uo, vo)
LAG_DAYS = 3
HOURS = (0, 6, 12, 18)
OBSERVABLE = ('field', 'platform', 'coast')


def due(today, kept):
    """the days to observe now, in order: from FIRST to today - LAG_DAYS, not yet kept"""
    out, d = [], FIRST
    while d <= today - timedelta(days=LAG_DAYS):
        if d.strftime('%Y%m%d') not in kept:
            out.append(d)
        d += timedelta(days=1)
    return out


def observe(d):
    import copernicusmarine as CM
    import numpy as np
    sites = [s for s in json.load(open(os.path.join(HERE, '..', 'scenario', 'sites.json')))['sites'] if s['kind'] in OBSERVABLE]
    want = [datetime(d.year, d.month, d.day, h, tzinfo=timezone.utc) for h in HOURS]
    lon0, lon1, lat0, lat1 = C.BBOX
    ds = CM.open_dataset(dataset_id=DATASET, variables=list(VARS), minimum_longitude=lon0, maximum_longitude=lon1,
                         minimum_latitude=lat0, maximum_latitude=lat1, start_datetime=want[0].strftime('%Y-%m-%dT%H:%M:%S'),
                         end_datetime=want[-1].strftime('%Y-%m-%dT%H:%M:%S'), service='arco-geo-series')   # 4 hours over the margin: maps, not series
    axis = [datetime.fromtimestamp(int(t) / 1e9, tz=timezone.utc) for t in ds['time'].values.astype('datetime64[ns]').astype('int64')]
    C.check_axis(axis, want)                       # a day not yet complete is refused (held for the next run)
    ti = [axis.index(t) for t in want]
    lats = [float(x) for x in ds['latitude'].values]
    lons = [float(x) for x in ds['longitude'].values]
    # the surface level (GlobCurrent carries 0 m and 15 m; the shallowest is taken and checked)
    if 'depth' in ds.coords and float(ds['depth'].values.min()) > 1.0:
        raise ValueError(f"REFUSED: no surface level in {DATASET} (depths {ds['depth'].values})")
    arr = {v: (ds[v].isel(time=ti, depth=int(ds['depth'].values.argmin())) if 'depth' in ds[v].dims else ds[v].isel(time=ti)).values for v in VARS}
    first = arr['uo'][0]
    places = {}
    for s in sites:
        j0, i0 = C.nearest(lats, s['lat']), C.nearest(lons, s['lon'])
        xs = []
        for j in range(j0 + C.BOX, j0 - C.BOX - 1, -1):
            for i in range(i0 - C.BOX, i0 + C.BOX + 1):
                ok = 0 <= j < len(lats) and 0 <= i < len(lons) and np.isfinite(first[j, i])
                xs.append(1 if ok else None)
        k = C.sea_index(xs)
        if k is None:
            continue
        r, c = divmod(k, 2 * C.BOX + 1)
        j, i = j0 + C.BOX - r, i0 - C.BOX + c
        steps = []
        for n, t in enumerate(want):
            row = {'t': t.strftime('%Y-%m-%dT%H')}
            for v, key in zip(VARS, KEYS):
                x = arr[v][n, j, i]
                if np.isfinite(x):
                    row[key] = C.fr(x)
            steps.append(row)
        places[s['id']] = {'node': [round(lats[j], 6), round(lons[i], 6)], 'steps': steps}
    return places


def version():
    """the dataset version read and the date Copernicus retires it (a successor version is a new truth: say so, never mix)"""
    try:
        import copernicusmarine as CM
        cat = CM.describe(dataset_id=DATASET)
        for p in cat.products:
            for ds in p.datasets:
                if ds.dataset_id == DATASET:
                    v = ds.versions[-1]
                    return {'label': v.label, 'retired': [pt.retired_date for pt in v.parts]}
    except Exception as e:  # noqa: BLE001 — the version is metadata; the values are what is graded
        return {'label': None, 'why': repr(e)[:200]}
    return {'label': None}


def main():
    os.makedirs(OUT, exist_ok=True)
    kept = {f[:8] for f in os.listdir(OUT) if f.endswith('.json')}
    today = datetime.now(timezone.utc).date()
    for d in due(today, kept):
        try:
            places = observe(d)
        except ValueError as e:
            print(f'currents observed: {d} held ({e})')
            break                                   # days strictly in order: a held day stops the run
        rec = {'version': version(),
               'what': 'GlobCurrent (Copernicus Marine, observation-based: satellite altimetry + Ekman, calibrated on drifters) at the '
                       'Janela sites, the forecast steps of one UTC day; exact fractions of the stored floats, m/s, the direction the water goes TO; '
                       'uo/vo the total (geostrophic + Ekman), ut/vt its tidal part. The truth currents.py\'s forecasts are graded against.',
               'licence': 'Generated using E.U. Copernicus Marine Service Information; ' + DOI,
               'product': PRODUCT, 'dataset': DATASET, 'date': d.isoformat(), 'observedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
               'places': places}
        rec['sha256'] = hashlib.sha256(json.dumps(places, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        dest = os.path.join(OUT, d.strftime('%Y%m%d') + '.json')
        with open(dest + '.part', 'w') as fh:
            json.dump(rec, fh, separators=(',', ':'))
        os.replace(dest + '.part', dest)
        print('currents observed:', d, len(places), 'sites ->', os.path.relpath(dest, ROOT))


def check():
    ok, bad = [], []

    def test(name, fn, red=False):
        try:
            fn()
            (bad if red else ok).append(name)
        except (ValueError, AssertionError) as e:
            (ok if red else bad).append(name + ('' if red else f' ({e})'))

    def t_due():
        assert due(date(2026, 10, 10), set()) == []                                   # 10-08 is not three days old yet
        assert due(date(2026, 10, 11), set()) == [date(2026, 10, 8)]
        assert due(date(2026, 10, 13), {'20261009'}) == [date(2026, 10, 8), date(2026, 10, 10)]
    test('the days due: from the first kept forecast with uo/vo, at least three days old, each once', t_due)
    test('RED a day whose 18 UTC step is not yet on the axis is held, never written short',
         lambda: C.check_axis([datetime(2026, 10, 8, h, tzinfo=timezone.utc) for h in (0, 6, 12)],
                              [datetime(2026, 10, 8, h, tzinfo=timezone.utc) for h in HOURS]), red=True)
    for n in ok:
        print('  ok  ', n)
    for n in bad:
        print('  FAIL', n)
    reds = sum(1 for n in ok if n.startswith('RED'))
    print(f'janela currents observed battery: {len(ok) - reds} pass, {len(bad)} fail, {reds} red controls fired')
    return not bad


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        sys.exit(0 if check() else 1)
    main()
