"""feed.py — Swell's day: the forecast at Florianópolis, read exactly, written once.

apps/swell/audit · cert-machine

    apps/janela/.venv/bin/python apps/swell/audit/feed.py [YYYYMMDD] [--out PATH] [--force]

    default run: the newest 00 UTC run that is complete (ECMWF wave + oper and NOAA GFS-Wave all publish +168 h)
    default out: corpus/swell/feed/YYYYMMDD.json.gz — refused if it exists, unless --force

Swell is Janela's sibling for one coast, so it reads Janela's sources with Janela's code (apps/janela/audit:
ecmwf.py, feed.py, noaa.py, currents.py are imported, never copied) at Swell's denser steps — every 3 h to
+144 h, then every 6 h to +168 h (ECMWF's open-data wave stream has no 147 h) — and adds what a beach needs
that an offshore window does not: the wind over the whole island box, the air temperature, the rain, the
tide and the sea temperature.

  ecmwf  IFS HRES at the floripa sea node (the Janela site, feed.sea_index over its box at +0 h): stream
         wave swh, mwd, pp1d, mwp; stream oper 10u, 10v and the 10 m gust. Each step has the shape of a
         Janela feed step, so apps/janela/audit/today.js compute() reads {run, madeAt, sites: day.ecmwf}.
  noaa   GFS-Wave (WAVEWATCH III, 0.25 deg, deterministic) at its own floripa sea node: noaa.read_gfs and
         noaa.det_row, the Janela NOAA step shape without the GEFS members.
  wind   ECMWF oper 10u, 10v, the gust, 2t, tp at the 16 grid nodes over the island (land or sea).
  ocean  Copernicus Marine (GLO12, 1/12 deg) hourly total sea level, tide and sea temperature at one sea
         node — display only; null (with a WARNING) when the service cannot be read.

EXACT. Every GRIB number is the exact rational (R + X * 2^E) / 10^D of its packed integer (ecmwf.decode),
written n/d; every group of messages read is pinned by sha256 as Janela pins it. A step missing at either
provider refuses the whole day: nothing is written.

A QUIRK OF THE OPEN DATA (found 2026-10-08): the oper stream names the 10 m gust 10fg at 0-90 h and
150-168 h but 10fg3 at 93-144 h, and the windows differ: 10fg is the maximum over the LAST HOUR to 90 h
(step range 89-90) and over the last 6 h from 150 h (144-150); 10fg3 over the last 3 h (90-93 ... 141-144).
Swell reads whichever the step has (exactly one, or the day is refused) and records each step's parameter
and decoded window in day.gust. (Janela's feed asks for 10fg only, so its gust is null at 96-144 h.)

MIT licensed. Part of cert-machine.
"""
import argparse
import gzip
import hashlib
import json
import math
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
JANELA = os.path.join(ROOT, 'apps', 'janela', 'audit')
# Janela's modules import each other by bare name (noaa.py: `from feed import ...`), and this file is
# also called feed.py: Janela's directory goes FIRST on the path, and the module found is checked.
sys.path.insert(0, JANELA)
import currents as C   # noqa: E402  (stdlib at import; copernicusmarine only inside its read())
import ecmwf as E      # noqa: E402  (honours JANELA_IPV4=1 at import, process-wide)
import feed as JF      # noqa: E402  Janela's feed.py
import noaa as N       # noqa: E402

for _m, _f in ((JF, 'feed.py'), (E, 'ecmwf.py'), (N, 'noaa.py'), (C, 'currents.py')):
    if not os.path.samefile(_m.__file__, os.path.join(JANELA, _f)):
        raise SystemExit(f'REFUSED: imported {_m.__file__} where Janela\'s {_f} was expected')

V = 'swell-feed-1'
STEPS = list(range(0, 145, 3)) + list(range(150, 169, 6))       # 49 + 4 = 53
SITE = next(s for s in json.load(open(os.path.join(JANELA, '..', 'scenario', 'sites.json')))['sites'] if s['id'] == 'floripa')
WIND_LATS = [-27.25, -27.5, -27.75, -28.0]
WIND_LONS = [-48.75, -48.5, -48.25, -48.0]
WIND_NODES = [[la, lo] for la in WIND_LATS for lo in WIND_LONS]   # north to south, west to east
WIND_PLACES = [{'id': f'w{k:02d}', 'lat': la, 'lon': lo, 'box': 0} for k, (la, lo) in enumerate(WIND_NODES)]
PLACES = [SITE] + WIND_PLACES
WAVE = ['swh', 'mwd', 'pp1d', 'mwp']
GUSTS = ('10fg', '10fg3')                                          # one of them per step (see the docstring)
OPER = ['10u', '10v', *GUSTS, '2t', 'tp']
OCEAN_TARGET = (-27.60, -48.30)
SL = 'cmems_mod_glo_phy_anfc_merged-sl_PT1H-i'
TH = 'cmems_mod_glo_phy_anfc_0.083deg_PT1H-m'
OCEAN_HOURS = 168
GRIDKEYS = ('Ni', 'Nj', 'lat0', 'lon0', 'dlat', 'dlon')
LICENCE = ('ECMWF open data, Copyright ECMWF, CC BY 4.0 (https://www.ecmwf.int/en/forecasts/datasets/open-data); '
           'NOAA/NWS/NCEP GFS-Wave, a work of the US government: public domain (https://registry.opendata.aws/noaa-gfs-bdp-pds/); '
           + C.CREDIT + ' (GLOBAL_ANALYSISFORECAST_PHY_001_024)')
WHAT = (
    "Swell's day: the 00 UTC run at Florianópolis, read by apps/swell/audit/feed.py with Janela's readers "
    '(apps/janela/audit). steps: the leads in hours, every 3 h to 144 h then every 6 h to 168 h. '
    "ecmwf.floripa: ECMWF IFS HRES open data at the sea node of the Janela site 'floripa' (apps/janela/scenario/sites.json; "
    'feed.sea_index over its box at +0 h): hs.det = swh, mwd = mean wave direction (FROM, nautical), tp = pp1d (PEAK wave '
    'period), mwp = mean wave period, wind = 10u, 10v (m/s, the direction the wind blows TO as vector components), the speed '
    'sqrt(u^2+v^2) as an enclosure [speedLo, speedHi] of width <= 1e-6 m/s, and gust = the maximum 10 m gust over the window '
    "that ends at the step (gust.param and gust.window name each step's: the LAST HOUR to 90 h (10fg), 3 h from 93 to 144 h "
    "(10fg3), 6 h from 150 h (10fg); 0 at step 0) — so gusts are not comparable across those three ranges; the same "
    "values and step shape as Janela's feed at its 6-hourly steps. noaa.floripa: NOAA GFS-Wave (WAVEWATCH III, global "
    "0.25 deg, deterministic) at its own sea node (HTSGW at +0 h, the same rule): hs.det = HTSGW; perpw, dirpw = NCEP's "
    "primary (peak) wave period and direction, kept under NCEP's names; wind = the forcing 10 m wind; sea = the wind-sea "
    'partition and swell = the three swell partitions {hs, per, dir} (null where WAVEWATCH III finds none). wind: ECMWF '
    'oper at the 16 0.25-deg nodes of wind.nodes (land or sea: the wind is atmospheric) — u, v, gust (m/s), t2m = 2t (K), '
    'tp = total precipitation ACCUMULATED since the run start (m of water), kept as published: the rain between two steps '
    'is the difference. Every GRIB value is an exact rational n/d traced to a GRIB packed integer, value = (R + X*2^E)/10^D. '
    'ocean: Copernicus Marine GLO12 (1/12 deg), hourly from the run start to +168 h, at one sea node: level = '
    'total_sea_level (m; tide + inverse barometer + dynamic height + global-mean terms), tide = ocean_tide (FES2014, m), '
    'sst = thetao at the shallowest level (deg C, the hourly mean) — decimal strings rounded to nearest from the stored '
    'float32, 3 decimals for metres (the product\'s least_significant_digit) and 2 for deg C; as served at madeAt '
    '(Copernicus rewrites its forecast daily, so pins.ocean hashes the values), display only, never decided on; null when '
    'the service could not be read. pins: the sha256 of every group of GRIB messages as read (ecmwf: Janela feed.read '
    'records; noaa: Janela noaa.read_gfs records).'
)


def tstr(run, h):
    return (run + timedelta(hours=h)).strftime('%Y-%m-%dT%H')


def run_of(d):
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


def check_meta(meta, d, step):
    """an ECMWF message is the requested run (00 UTC of d) and its step range ends at the step"""
    end = str(meta['step']).split('-')[-1]
    if meta['date'] != int(d.strftime('%Y%m%d')) or meta['time'] != 0 or int(end) != step:
        raise ValueError(f"REFUSED: {meta['param']} is run {meta['date']} {meta['time']:04d} step {meta['step']}, wanted {d:%Y%m%d} 0000 step {step}")


# ---------------------------------------------------------------- the readers (Janela's, at Swell's places)

def read_ecmwf(d, stream, step):
    """Janela's feed.read (index, byte ranges, decode, one sha256 per group) at Swell's places. feed.read
    decodes at its module-level SITES; Swell rebinds that name to PLACES in this process (no file edited)."""
    out, group = JF.read(d, stream, step, WAVE if stream == 'wave' else OPER)
    want = len(WAVE) if stream == 'wave' else len(OPER) - 1
    got = [m['param'] for _, m, _ in out]
    if len(out) != want or (stream == 'oper' and sum(p in GUSTS for p in got) != 1):
        raise ValueError(f'REFUSED: ECMWF {stream} step {step} holds {got}, wanted {want} of {group["params"]}')
    for _, meta, _ in out:
        check_meta(meta, d, step)
    return out, group


def read_noaa(d, step):
    return N.read_gfs(d, step, [SITE])


def is_complete(d):
    """the run of date d has published its last step at both providers"""
    for stream in ('wave', 'oper'):
        if E.index(JF.BASE, d, 0, stream, STEPS[-1]) is None:
            return False, f'ECMWF {stream} +{STEPS[-1]} h not published'
    if E.get(N.gfs_url(d, STEPS[-1]) + '.idx') is None:
        return False, f'NOAA GFS-Wave +{STEPS[-1]} h not published'
    return True, ''


def newest_complete(today):
    for back in range(4):
        d = today - timedelta(days=back)
        ok, why = is_complete(d)
        if ok:
            return d
        print(f'run {d:%Y%m%d}00 not complete: {why}', flush=True)
    raise SystemExit('REFUSED: no complete 00 UTC run in the last 4 days')


def read_ocean(d):
    """Copernicus Marine at the nearest node to OCEAN_TARGET that holds finite level, tide and sst at the
    run start (feed.sea_index over a 7 x 7 box: currents.py's rule), hourly to +168 h."""
    import copernicusmarine as CM
    import numpy as np
    run = run_of(d)
    want = [run + timedelta(hours=h) for h in range(OCEAN_HOURS + 1)]
    iso = lambda t: t.strftime('%Y-%m-%dT%H:%M:%S')   # noqa: E731
    la, lo = OCEAN_TARGET
    box = dict(minimum_longitude=lo - 0.35, maximum_longitude=lo + 0.35, minimum_latitude=la - 0.35, maximum_latitude=la + 0.35)
    sl = CM.open_dataset(dataset_id=SL, variables=['total_sea_level', 'ocean_tide'], start_datetime=iso(want[0]),
                         end_datetime=iso(want[-1]), service='arco-time-series', **box)
    th = CM.open_dataset(dataset_id=TH, variables=['thetao'], start_datetime=iso(want[0]), end_datetime=iso(want[-1]),
                         service='arco-time-series', **box)
    depths = [float(x) for x in th['depth'].values]
    if depths[0] != min(depths):
        raise ValueError('REFUSED: the sst depth axis does not start at the shallowest level')
    lats = [float(x) for x in sl['latitude'].values]
    lons = [float(x) for x in sl['longitude'].values]
    tlats = [float(x) for x in th['latitude'].values]
    tlons = [float(x) for x in th['longitude'].values]
    f0 = [sl['total_sea_level'].isel(time=0, depth=0).values, sl['ocean_tide'].isel(time=0, depth=0).values]
    t0 = th['thetao'].isel(time=0, depth=0).values
    j0, i0, B = C.nearest(lats, la), C.nearest(lons, lo), C.BOX
    xs, where = [], []
    for j in range(j0 + B, j0 - B - 1, -1):              # north to south, as the GRIB boxes
        for i in range(i0 - B, i0 + B + 1):
            ok = 0 <= j < len(lats) and 0 <= i < len(lons)
            if ok:
                tj, ti = C.nearest(tlats, lats[j]), C.nearest(tlons, lons[i])
                ok = (abs(tlats[tj] - lats[j]) < 1e-3 and abs(tlons[ti] - lons[i]) < 1e-3
                      and all(np.isfinite(f[j, i]) for f in f0) and np.isfinite(t0[tj, ti]))
            xs.append(1 if ok else None)
            where.append((j, i))
    k = JF.sea_index(xs)
    if k is None:
        raise ValueError('REFUSED: no node with finite level, tide and sst within 3 nodes of the target')
    j, i = where[k]
    tj, ti = C.nearest(tlats, lats[j]), C.nearest(tlons, lons[i])
    for ds in (sl, th):
        axis = [datetime.fromtimestamp(int(t) / 1e9, tz=timezone.utc) for t in ds['time'].values.astype('datetime64[ns]').astype('int64')]
        C.check_axis(axis, want)
    ix = lambda ds: [  # noqa: E731
        [datetime.fromtimestamp(int(t) / 1e9, tz=timezone.utc) for t in ds['time'].values.astype('datetime64[ns]').astype('int64')].index(w)
        for w in want]
    level = sl['total_sea_level'].isel(time=ix(sl), depth=0, latitude=j, longitude=i).values
    tide = sl['ocean_tide'].isel(time=ix(sl), depth=0, latitude=j, longitude=i).values
    sst = th['thetao'].isel(time=ix(th), depth=0, latitude=tj, longitude=ti).values
    dec = lambda x, p: ('%.*f' % (p, float(x))).replace('-0.' + '0' * p, '0.' + '0' * p)   # noqa: E731  no '-0.000'
    for name, arr in (('level', level), ('tide', tide), ('sst', sst)):
        if not all(np.isfinite(x) for x in arr):
            raise ValueError(f'REFUSED: {name} is not finite at every hour at the node')
    node = [round(lats[j], 4), round(lons[i], 4)]
    block = {
        'source': {'product': C.PRODUCT, 'doi': C.DOI,
                   'level': {'dataset': SL, 'variables': {'level': 'total_sea_level', 'tide': 'ocean_tide'}, 'units': 'm',
                             'title': sl.attrs.get('title'), 'source': sl.attrs.get('source')},
                   'sst': {'dataset': TH, 'variable': 'thetao', 'depthM': round(depths[0], 6), 'units': 'degrees_C',
                           'title': th.attrs.get('title'), 'source': th.attrs.get('source'), 'node': [round(tlats[tj], 4), round(tlons[ti], 4)]},
                   'target': list(OCEAN_TARGET),
                   'rule': 'the node nearest the target (1/12 deg) with finite level, tide and sst at the run start, within 3 nodes (feed.sea_index)'},
        'node': node,
        'times': [w.strftime('%Y-%m-%dT%H') for w in want],
        'level': [dec(x, 3) for x in level],
        'tide': [dec(x, 3) for x in tide],
        'sst': [dec(x, 2) for x in sst],
    }
    return block


# ---------------------------------------------------------------- the day

def build(d):
    run = run_of(d)
    made = datetime.now(timezone.utc).isoformat(timespec='seconds')
    JF.SITES = PLACES          # feed.read decodes at feed.SITES (see read_ecmwf)
    jobs = [('ecmwf', 'wave', s) for s in STEPS] + [('ecmwf', 'oper', s) for s in STEPS] + [('noaa', None, s) for s in STEPS]

    def one(job):
        src, stream, step = job
        try:
            return 'ok', (read_ecmwf(d, stream, step) if src == 'ecmwf' else read_noaa(d, step))
        except (SystemExit, Exception) as e:   # noqa: BLE001 — every refusal is collected, then the day is refused whole
            return 'refused', f'{src} {stream or "gfs-wave"} +{step} h: {e}'

    def ocean():
        try:
            return read_ocean(d), None
        except Exception as e:   # noqa: BLE001 — the ocean block is display-only
            return None, f'{type(e).__name__}: {e}'
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=24) as ex:
        oc = ex.submit(ocean)
        res = dict(zip(jobs, ex.map(one, jobs)))
        ocean_block, ocean_err = oc.result()
    print(f'read {len(jobs)} groups in {time.time() - t0:.0f} s', flush=True)
    refused = [r for st, r in res.values() if st == 'refused']
    if refused:
        raise SystemExit('REFUSED: the day is incomplete, nothing written:\n  ' + '\n  '.join(refused))
    if ocean_err:
        print(f'WARNING: the ocean block could not be read ({ocean_err}); writing "ocean": null', flush=True)

    # ECMWF: the floripa sea node from swh at +0 h, the grids constant, the wind nodes exact
    sid = SITE['id']
    w0 = res[('ecmwf', 'wave', 0)][1][0]
    swh0 = next(x for x in w0 if x[1]['param'] == 'swh')
    k = JF.sea_index(swh0[2][sid])
    if k is None:
        raise SystemExit('REFUSED: ECMWF calls every node of the floripa box land')
    enode = list(E.box_nodes(swh0[1], SITE)[k])
    grid = {s: {kk: res[('ecmwf', s, 0)][1][0][0][1][kk] for kk in GRIDKEYS} for s in ('wave', 'oper')}
    o0 = res[('ecmwf', 'oper', 0)][1][0]
    if list(E.box_nodes(o0[0][1], SITE)[k]) != enode:     # the wave node's index must be the same water on the oper grid
        raise SystemExit('REFUSED: the oper grid does not put the floripa sea node where the wave grid does')
    for p in WIND_PLACES:
        if list(E.box_nodes(o0[0][1], p)[0]) != [p['lat'], p['lon']]:
            raise SystemExit(f'REFUSED: wind node {p["lat"]}, {p["lon"]} is not a node of the oper grid')
    esteps, wsteps, gust = [], [], {'param': [], 'window': []}
    pins = {'ecmwf': [], 'noaa': [], 'ocean': None}
    for step in STEPS:
        t = tstr(run, step)
        (wave, gw), (oper, go) = res[('ecmwf', 'wave', step)][1], res[('ecmwf', 'oper', step)][1]
        pins['ecmwf'].extend([gw, go])
        for s, msgs in (('wave', wave), ('oper', oper)):
            for _, meta, _ in msgs:
                if any(meta[kk] != grid[s][kk] for kk in GRIDKEYS):
                    raise SystemExit(f'REFUSED: ECMWF {s} {meta["param"]} at +{step} h is on another grid')
        val = {meta['param']: E.value(meta, xs[sid][k]) for _, meta, xs in wave + oper}
        g = next(meta for _, meta, _ in oper if meta['param'] in GUSTS)
        gust['param'].append(g['param'])
        gust['window'].append(str(g['step']))
        val['gust'] = val[g['param']]
        miss = [p for p in ('swh', 'mwd', 'pp1d', 'mwp', '10u', '10v', 'gust') if val.get(p) is None]
        if miss:
            raise SystemExit(f'REFUSED: ECMWF has no {miss} at the floripa node {enode} at +{step} h')
        lo, hi = JF.sqrt_enclosure(val['10u'] ** 2 + val['10v'] ** 2)
        esteps.append({'t': t, 'lead': step, 'hs': {'det': JF.fr(val['swh'])}, 'mwd': JF.fr(val['mwd']), 'tp': JF.fr(val['pp1d']),
                       'mwp': JF.fr(val['mwp']),
                       'wind': {'u': JF.fr(val['10u']), 'v': JF.fr(val['10v']), 'speedLo': JF.fr(lo), 'speedHi': JF.fr(hi),
                                'gust': JF.fr(val['gust'])}})
        by = {('gust' if meta['param'] in GUSTS else meta['param']): (meta, xs) for _, meta, xs in oper}
        row = {'t': t, 'lead': step}
        for key, p in (('u', '10u'), ('v', '10v'), ('gust', 'gust'), ('t2m', '2t'), ('tp', 'tp')):
            meta, xs = by[p]
            vs = [E.value(meta, xs[q['id']][0]) for q in WIND_PLACES]
            if any(v is None for v in vs):
                raise SystemExit(f'REFUSED: ECMWF oper {p} is missing at a wind node at +{step} h')
            row[key] = [JF.fr(v) for v in vs]
        wsteps.append(row)

    # NOAA: its own sea node from HTSGW at +0 h, the grid constant
    n0, _ = res[('noaa', None, 0)][1]
    hs0m, hs0x = n0['hs']
    kn = JF.sea_index(hs0x[sid])
    if kn is None:
        raise SystemExit('REFUSED: GFS-Wave calls every node of the floripa box land')
    nnode = list(E.box_nodes(hs0m, SITE)[kn])
    ngrid = {kk: hs0m[kk] for kk in N.GRID}
    nsteps = []
    for step in STEPS:
        det, gd = res[('noaa', None, step)][1]
        pins['noaa'].append(gd)
        for key, (meta, _) in det.items():
            if any(meta[kk] != ngrid[kk] for kk in N.GRID):
                raise SystemExit(f'REFUSED: GFS-Wave {key} at +{step} h is on another grid')
        val = {key: E.value(meta, xs[sid][kn]) for key, (meta, xs) in det.items()}
        if val['hs'] is None:
            raise SystemExit(f'REFUSED: GFS-Wave has no Hs at the floripa node {nnode} at +{step} h')
        row = {'t': tstr(run, step), 'lead': step, 'hs': {'det': JF.fr(val['hs'])}}
        row.update(N.det_row(val))
        nsteps.append(row)

    if ocean_block is not None:
        pins['ocean'] = {'sha256': ocean_sha(ocean_block),
                         'of': "the ocean block's node, times, level, tide and sst as compact JSON with sorted keys"}
    return {
        'what': WHAT,
        'licence': LICENCE,
        'v': V,
        'run': run.strftime('%Y%m%d%H'),
        'madeAt': made,
        'steps': STEPS,
        'ecmwf': {sid: {'node': enode, 'steps': esteps}},
        'noaa': {sid: {'node': nnode, 'steps': nsteps}},
        'gust': dict(gust, note='ECMWF oper: the 10 m gust parameter read at each step (10fg or 10fg3) and its window, start-end hours'),
        'wind': {'nodes': WIND_NODES, 'steps': wsteps},
        'ocean': ocean_block,
        'pins': pins,
    }


def ocean_sha(block):
    core = {k: block[k] for k in ('node', 'times', 'level', 'tide', 'sst')}
    return hashlib.sha256(json.dumps(core, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


# ---------------------------------------------------------------- the schema (ONE definition: the writer and the battery)

FRAC = re.compile(r'^-?(0|[1-9]\d*)(/[1-9]\d*)?$')
HEX = re.compile(r'^[0-9a-f]{64}$')
DEC = {3: re.compile(r'^-?\d+\.\d{3}$'), 2: re.compile(r'^-?\d+\.\d{2}$')}
ESTEP = {'t', 'lead', 'hs', 'mwd', 'tp', 'mwp', 'wind'}
NSTEP = {'t', 'lead', 'hs', 'perpw', 'dirpw', 'wind', 'sea', 'swell'}


def is_fraction(s):
    """an exact rational as Janela writes it: 'n' or 'n/d', d > 1, in lowest terms"""
    if not isinstance(s, str) or not FRAC.match(s):
        return False
    q = Fraction(s)
    return JF.fr(q) == s


def _frac(s, where):
    if not is_fraction(s):
        raise ValueError(f'{where}: {s!r} is not an exact fraction string')
    return Fraction(s)


def _speed(w, where):
    u, v = _frac(w['u'], where + '.u'), _frac(w['v'], where + '.v')
    lo, hi = _frac(w['speedLo'], where + '.speedLo'), _frac(w['speedHi'], where + '.speedHi')
    if not (0 <= lo <= hi and lo * lo <= u * u + v * v <= hi * hi and hi - lo <= Fraction(1, 10 ** 6)):
        raise ValueError(f'{where}: [speedLo, speedHi] does not enclose sqrt(u^2+v^2) within 1e-6')


def check_day(day):
    """refuse (ValueError) a day that is not swell-feed-1: every step present and in order, every GRIB value
    an exact fraction string, every wind speed enclosure true, every pin a sha256, the ocean block whole"""
    def need(c, msg):
        if not c:
            raise ValueError(msg)
    need(day.get('v') == V, f'v is {day.get("v")!r}, not {V}')
    need(isinstance(day.get('run'), str) and re.match(r'^\d{8}00$', day['run']), f'run {day.get("run")!r} is not YYYYMMDD00')
    run = datetime.strptime(day['run'], '%Y%m%d%H').replace(tzinfo=timezone.utc)
    need(day.get('steps') == STEPS, 'steps are not 0..144 by 3, 150..168 by 6')
    for k in ('what', 'licence', 'madeAt'):
        need(isinstance(day.get(k), str) and day[k], f'{k} missing')
    sid = SITE['id']

    def series(block, name, keys):
        need(isinstance(block, dict) and sid in block, f'{name}: no {sid}')
        f = block[sid]
        need(isinstance(f.get('node'), list) and len(f['node']) == 2, f'{name}.{sid}.node missing')
        need(abs(f['node'][0] - SITE['lat']) <= 0.75 and abs(f['node'][1] - SITE['lon']) <= 0.75, f'{name}.{sid}.node far from the site')
        st = f.get('steps')
        need(isinstance(st, list) and len(st) == len(STEPS), f'{name}.{sid}: {len(st or [])} steps, not {len(STEPS)}')
        for s, lead in zip(st, STEPS):
            w = f'{name}.{sid} +{lead} h'
            need(set(s) == keys, f'{w}: keys {sorted(s)} are not {sorted(keys)}')
            need(s['lead'] == lead and s['t'] == tstr(run, lead), f'{w}: t/lead {s["t"]}/{s["lead"]}')
            need(set(s['hs']) == {'det'}, f'{w}: hs keys {sorted(s["hs"])}')
            _frac(s['hs']['det'], w + '.hs.det')
        return st
    for s in series(day.get('ecmwf'), 'ecmwf', ESTEP):
        w = f'ecmwf +{s["lead"]} h'
        for k in ('mwd', 'tp', 'mwp'):
            _frac(s[k], f'{w}.{k}')
        need(set(s['wind']) == {'u', 'v', 'speedLo', 'speedHi', 'gust'}, f'{w}: wind keys')
        _speed(s['wind'], w + '.wind')
        _frac(s['wind']['gust'], w + '.wind.gust')
    for s in series(day.get('noaa'), 'noaa', NSTEP):
        w = f'noaa +{s["lead"]} h'
        _frac(s['perpw'], w + '.perpw')
        _frac(s['dirpw'], w + '.dirpw')
        need(set(s['wind']) == {'u', 'v', 'speedLo', 'speedHi'}, f'{w}: wind keys')
        _speed(s['wind'], w + '.wind')
        need(isinstance(s['swell'], list) and len(s['swell']) == 3, f'{w}: swell is not 3 partitions')
        for j, p in enumerate([s['sea']] + s['swell']):
            if p is None:
                continue
            need(set(p) == {'hs', 'per', 'dir'}, f'{w}: partition {j} keys')
            _frac(p['hs'], f'{w}.partition{j}.hs')
            for k in ('per', 'dir'):
                if p[k] is not None:
                    _frac(p[k], f'{w}.partition{j}.{k}')
    g = day.get('gust') or {}
    need(isinstance(g.get('param'), list) and len(g['param']) == len(STEPS) and set(g['param']) <= set(GUSTS), 'gust.param')
    need(isinstance(g.get('window'), list) and len(g['window']) == len(STEPS), 'gust.window')
    wd = day.get('wind') or {}
    need(wd.get('nodes') == WIND_NODES, 'wind.nodes are not the 16 island-box nodes')
    need(isinstance(wd.get('steps'), list) and len(wd['steps']) == len(STEPS), 'wind: steps missing')
    for s, lead in zip(wd['steps'], STEPS):
        w = f'wind +{lead} h'
        need(set(s) == {'t', 'lead', 'u', 'v', 'gust', 't2m', 'tp'}, f'{w}: keys {sorted(s)}')
        need(s['lead'] == lead and s['t'] == tstr(run, lead), f'{w}: t/lead')
        for k in ('u', 'v', 'gust', 't2m', 'tp'):
            need(isinstance(s[k], list) and len(s[k]) == len(WIND_NODES), f'{w}.{k}: not 16 values')
            for x in s[k]:
                _frac(x, f'{w}.{k}')
    oc = day.get('ocean', 'absent')
    need(oc != 'absent', 'ocean: the key is absent (null is allowed, absence is not)')
    if oc is not None:
        want = [tstr(run, h) for h in range(OCEAN_HOURS + 1)]
        need(oc.get('times') == want, 'ocean.times are not hourly from the run start to +168 h')
        need(isinstance(oc.get('node'), list) and len(oc['node']) == 2, 'ocean.node')
        need(isinstance(oc.get('source'), dict), 'ocean.source')
        for k, p in (('level', 3), ('tide', 3), ('sst', 2)):
            need(isinstance(oc.get(k), list) and len(oc[k]) == len(want), f'ocean.{k}: not {len(want)} values')
            for x in oc[k]:
                need(isinstance(x, str) and DEC[p].match(x), f'ocean.{k}: {x!r} is not a decimal string with {p} places')
    pins = day.get('pins') or {}
    pe, pn = pins.get('ecmwf') or [], pins.get('noaa') or []
    need(sorted((g['stream'], g['step']) for g in pe) == sorted((s, t) for s in ('wave', 'oper') for t in STEPS), 'pins.ecmwf: not one group per stream and step')
    need(sorted(g['step'] for g in pn) == STEPS, 'pins.noaa: not one group per step')
    for pin in pe + pn:
        need(isinstance(pin.get('sha256'), str) and HEX.match(pin['sha256']) and pin.get('url', '').startswith('https://'), f'pin {pin.get("url")}: no sha256')
    if oc is None:
        need(pins.get('ocean') is None, 'pins.ocean without an ocean block')
    else:
        need((pins.get('ocean') or {}).get('sha256') == ocean_sha(oc), 'pins.ocean does not hash the ocean block')
    return True


# ---------------------------------------------------------------- main

def main(argv=None):
    ap = argparse.ArgumentParser(description="Swell's daily forecast reader (swell-feed-1)")
    ap.add_argument('run', nargs='?', help='YYYYMMDD (the 00 UTC run); default the newest complete')
    ap.add_argument('--out', help='write here instead of corpus/swell/feed/YYYYMMDD.json.gz')
    ap.add_argument('--force', action='store_true', help='overwrite an existing file')
    a = ap.parse_args(argv)
    t0 = time.time()
    if a.run:
        d = datetime.strptime(a.run.replace('-', ''), '%Y%m%d').date()
    else:
        d = newest_complete(datetime.now(timezone.utc).date())
    dest = os.path.abspath(a.out) if a.out else os.path.join(ROOT, 'corpus', 'swell', 'feed', d.strftime('%Y%m%d') + '.json.gz')
    if os.path.exists(dest) and not a.force:
        raise SystemExit(f'REFUSED: {os.path.relpath(dest, ROOT)} exists (a day is written once; --force overwrites)')
    print(f'run {d:%Y%m%d}00 -> {os.path.relpath(dest, ROOT)}', flush=True)
    day = json.loads(json.dumps(build(d)))         # as written: tuples become lists
    try:
        check_day(day)
    except ValueError as e:
        raise SystemExit(f'REFUSED: the day fails its own schema, nothing written: {e}')
    if os.path.exists(dest) and not a.force:
        raise SystemExit(f'REFUSED: {os.path.relpath(dest, ROOT)} appeared while reading; not overwritten')
    blob = json.dumps(day, separators=(',', ':')).encode()
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    tmp = dest + '.part'
    with open(tmp, 'wb') as f:
        f.write(gzip.compress(blob, mtime=0))
    os.replace(tmp, dest)
    print(f'wrote {os.path.relpath(dest, ROOT)}: {len(blob)} bytes, {os.path.getsize(dest)} gzipped, '
          f'{len(day["pins"]["ecmwf"])} ECMWF + {len(day["pins"]["noaa"])} NOAA groups, ocean '
          f'{"node " + str(day["ocean"]["node"]) if day["ocean"] else "null"}; {time.time() - t0:.0f} s')


if __name__ == '__main__':
    main()
