"""archive.py — the back-archive Janela measures its forecasts against.

apps/janela/audit · cert-machine

    python archive.py ecmwf [FROM [TO]] [--workers N]   ECMWF open-data forecasts at every site
    python archive.py alt   [FROM [TO]] [--workers N]   NOAA altimeter passes near every site
    python archive.py metar [FROM [TO]]                 hourly METAR of the P-25 platform (SBLB)
    python archive.py noaa  [FROM [TO]] [--workers N]   NOAA GFS-Wave (WAVEWATCH III) forecasts at every site
    python archive.py pack                              day files -> monthly .json.gz + manifest
    python archive.py pack-noaa                         NOAA's day files -> corpus/janela/noaa/ + its own manifest

Why a back-archive: a forecast's error can only be measured against what
happened, and the ledger (instruments/forecast) only grows forward. ECMWF
keeps every open-data forecast it published since 2023 on public mirrors,
each file timestamped by the publisher, and NOAA keeps every altimeter
pass since 2020: together they give three years of (forecast, observation)
pairs at any offshore point, today, with nobody's hindsight in them.

Every byte read is hashed as read. Day files land in corpus/janela/cache/
(git-ignored, resumable); `pack` writes the committed monthly records.

Sources and licences:
  ECMWF open data — CC BY 4.0 (commercial use allowed); attribution
    "Copyright ECMWF, CC BY 4.0", no endorsement implied.
  NOAA/NESDIS RADS-built along-track altimetry (coastwatch.noaa.gov) — US
    government work, public domain; RADS editing as applied by NOAA.
  METAR via the Iowa Environmental Mesonet archive — public.
  NOAA GFS-Wave on AWS (noaa-gfs-bdp-pds) — US government work, public domain.
    Read from 2023-07-12, the ECMWF archive's first day, so both providers are
    calibrated against the same three years of passes.

MIT licensed. Part of cert-machine.
"""
import csv
import gzip
import hashlib
import io
import json
import math
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta, timezone

import ecmwf as E

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
SITES = json.load(open(os.path.join(HERE, '..', 'scenario', 'sites.json')))['sites']
# JANELA_SITES=a,b reads only those sites (a new region's back-archive, fetched without touching the others' records)
if os.environ.get('JANELA_SITES'):
    _want = set(os.environ['JANELA_SITES'].split(','))
    SITES = [s for s in SITES if s['id'] in _want]
    if not SITES:
        raise SystemExit('REFUSED: JANELA_SITES names no site in sites.json')
CACHE = os.path.join(ROOT, 'corpus', 'janela', 'cache')
OUT = os.path.join(ROOT, 'corpus', 'janela')
# JANELA_REGION=<name>: the region's own cache, pack and sites (regions.json), nothing else touched
import region as _region
REGION = _region.current()
if REGION:
    CACHE, OUT = REGION['cache'], REGION['pack']
    SITES = [s for s in SITES if s['id'] in set(REGION['sites'])]

# what is read from each forecast run (00 UTC): Hs every 6 h to 96 h, then every
# 12 h to 168 h; peak period and mean direction once a day; 10 m wind every 12 h
# to 96 h, then daily. Leads past 96 h are for the week view; the alpha audit
# lives under 96 h (DNV's weather-restricted operations: TR < 96 h, TPOP < 72 h).
WAVE_STEPS = list(range(0, 97, 6)) + [108, 120, 132, 144, 156, 168]
DAILY = {0, 24, 48, 72, 96, 120, 144, 168}
OPER_STEPS = list(range(0, 97, 12)) + [120, 144, 168]
RUN = 0

ALT_BASE = 'https://coastwatch.noaa.gov/data/pub0010/lsa/johnk/coastwatch'
ALT_MISSIONS = {'j3': 'Jason-3', '6a': 'Sentinel-6A', '6b': 'Sentinel-6B', '3a': 'Sentinel-3A',
                '3b': 'Sentinel-3B', 'c2': 'CryoSat-2', 'sa': 'SARAL', 'sw': 'SWOT (nadir)'}
ALT_RADIUS_KM = 150.0
EPOCH85 = datetime(1985, 1, 1, tzinfo=timezone.utc)


def days(a, b):
    d = a
    while d <= b:
        yield d
        d += timedelta(days=1)


def parse_args(argv, default_from):
    pos = [a for a in argv if not a.startswith('--')]
    workers = 8
    for a in argv:
        if a.startswith('--workers='):
            workers = int(a.split('=')[1])
    a = date.fromisoformat(pos[0]) if len(pos) > 0 else default_from
    b = date.fromisoformat(pos[1]) if len(pos) > 1 else datetime.now(timezone.utc).date() - timedelta(days=1)
    return a, b, workers


def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(obj, f, separators=(',', ':'))
    os.replace(tmp, path)


# ── ECMWF ─────────────────────────────────────────────────────────────────

def ecmwf_day(d):
    path = os.path.join(CACHE, 'ecmwf', d.strftime('%Y%m'), d.strftime('%Y%m%d') + '.json')
    if os.path.exists(path):
        return 'cached'
    base = E.MIRRORS['gcs'] if d >= E.GCS_FIRST else E.MIRRORS['aws']
    fields, nodes, missing = [], {}, []
    plan = [('wave', s, ['swh', 'mwd', 'pp1d'] if s in DAILY else ['swh']) for s in WAVE_STEPS]
    plan += [('oper', s, ['10u', '10v']) for s in OPER_STEPS]
    for stream, step, params in plan:
        idx = E.index(base, d, RUN, stream, step)
        if idx is None:
            missing.append(f'{stream}@{step}')
            continue
        rows = E.pick(idx, params)
        if len(rows) != len(params):
            missing.append(f'{stream}@{step}:{"+".join(params)}')
            continue
        url = f'{base}/{E.stem(d, RUN, stream, step)}.grib2'
        for off, n, rs in E.runs_of(rows):
            blob = E.get(url, (off, n))
            if blob is None:
                missing.append(f'{stream}@{step}:404')
                continue
            for r in rs:
                msg = blob[r['_offset'] - off: r['_offset'] - off + r['_length']]
                meta, xs = E.decode(msg, SITES)
                if meta['param'] != r['param'] or int(str(meta['step']).split('-')[-1]) != step:
                    raise ValueError(f'index/message mismatch at {d} {stream} {step} {r["param"]}')
                g = E.grid_of(d)
                if g not in nodes:
                    nodes[g] = {s['id']: E.box_nodes(meta, s) for s in SITES}
                fields.append({'stream': stream, 'step': step, 'param': meta['param'],
                               'url': url, 'offset': r['_offset'], 'length': r['_length'],
                               'sha256': E.sha256(msg), 'R': meta['R'], 'E': meta['E'], 'D': meta['D'],
                               'bits': meta['bits'], 'X': xs})
    write_json(path, {'date': d.isoformat(), 'run': RUN, 'grid': E.grid_of(d), 'mirror': base,
                      'nodes': nodes, 'fields': fields, 'missing': missing,
                      'read': datetime.now(timezone.utc).isoformat(timespec='seconds')})
    return f'{len(fields)} fields' + (f', missing {len(missing)}' if missing else '')


# ── NOAA GFS-Wave: the second provider's back-archive (the calibrated NOAA band) ──
# The same steps as ECMWF's (WAVE_STEPS for Hs, OPER_STEPS for the 10 m wind), the same field record, the
# ECMWF parameter names (swh, 10u, 10v) so matchups.py reads either archive with one code path; the grid
# is named 'gfswave-0p25' so a node is never looked up in the other provider's grid. noaa.py is the ONE
# reader of NOAA's inventories and messages (the run, step and parameter checks are its).
NOAA_FIRST = date(2023, 7, 12)
NOAA_GRID = 'gfswave-0p25'
NOAA_FIELDS = {'swh': ('HTSGW', 'surface', 'wave', 'swh'), '10u': ('UGRD', 'surface', 'oper', 'u'), '10v': ('VGRD', 'surface', 'oper', 'v')}


def noaa_day(d):
    import noaa as N
    path = os.path.join(CACHE, 'noaa', d.strftime('%Y%m'), d.strftime('%Y%m%d') + '.json')
    if os.path.exists(path):
        return 'cached'
    fields, nodes, missing = [], {}, []
    for step in sorted(set(WAVE_STEPS) | set(OPER_STEPS)):
        url = N.gfs_url(d, step)
        b = E.get(url + '.idx')
        if b is None:
            missing.append(f'gfswave@{step}')
            continue
        inv = N.inventory(b.decode(), d, step)
        params = (['swh'] if step in WAVE_STEPS else []) + (['10u', '10v'] if step in OPER_STEPS else [])
        for param in params:
            name, level, stream, short = NOAA_FIELDS[param]
            r = N.find(inv, name, level)
            if r['length'] is None:
                raise ValueError(f'{d} step {step}: {name} is the last message (no length)')
            blob = E.get(url, (r['offset'], r['length']))
            if blob is None:
                missing.append(f'gfswave@{step}:{name}:404')
                continue
            msg = N.split(blob, r['offset'], [r])[0]
            meta, xs = E.decode(msg, SITES)
            N.check_meta(meta, d, step, short)
            if NOAA_GRID not in nodes:
                nodes[NOAA_GRID] = {s['id']: E.box_nodes(meta, s) for s in SITES}
            fields.append({'stream': stream, 'step': step, 'param': param, 'ncep': f'{name}:{level}',
                           'url': url, 'offset': r['offset'], 'length': r['length'],
                           'sha256': E.sha256(msg), 'R': meta['R'], 'E': meta['E'], 'D': meta['D'],
                           'bits': meta['bits'], 'X': xs})
    write_json(path, {'date': d.isoformat(), 'run': RUN, 'grid': NOAA_GRID, 'source': 'NOAA GFS-Wave (noaa-gfs-bdp-pds)',
                      'nodes': nodes, 'fields': fields, 'missing': missing,
                      'read': datetime.now(timezone.utc).isoformat(timespec='seconds')})
    return f'{len(fields)} fields' + (f', missing {len(missing)}' if missing else '')


# ── altimetry ─────────────────────────────────────────────────────────────

def km(lat1, lon1, lat2, lon2):
    p = math.pi / 180
    a = (math.sin((lat2 - lat1) * p / 2) ** 2 +
         math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2)
    return 12742.0 * math.asin(math.sqrt(a))


def alt_extract(m, d):
    """one mission-day of NOAA RADS NRT altimetry, the points within ALT_RADIUS_KM of each site (exact integers)."""
    import h5py
    import numpy as np
    url = f'{ALT_BASE}/{m}/{m}_{d.strftime("%Y%m%d")}.nc'
    b = E.get(url)
    if b is None:
        return {'mission': m, 'date': d.isoformat(), 'url': url, 'absent': True}
    f = h5py.File(io.BytesIO(b), 'r')
    t = f['time'][:]
    raw = {k: f[k][:] for k in ('lat', 'lon', 'swh', 'wind_speed_alt')}
    fill = {k: int(f[k].attrs['_FillValue'][0]) for k in raw}
    scale = {k: float(f[k].attrs['scale_factor'][0]) for k in raw}
    f.close()
    lat = raw['lat'] * 1e-6
    lon = (raw['lon'] * 1e-6 + 180.0) % 360.0 - 180.0
    pts = {}
    for s in SITES:
        # cheap box first, then the great-circle radius
        dl = ALT_RADIUS_KM / 111.0
        dlo = dl / max(0.2, math.cos(math.radians(s['lat'])))
        sel = np.where((np.abs(lat - s['lat']) <= dl) & (np.abs(((lon - s['lon'] + 180) % 360) - 180) <= dlo)
                       & (raw['lat'] != fill['lat']))[0]
        rows = []
        for k in sel:
            dist = km(s['lat'], s['lon'], float(lat[k]), float(lon[k]))
            if dist > ALT_RADIUS_KM:
                continue
            rows.append([repr(float(t[k])), int(raw['lat'][k]), int(raw['lon'][k]),
                         None if raw['swh'][k] == fill['swh'] else int(raw['swh'][k]),
                         None if raw['wind_speed_alt'][k] == fill['wind_speed_alt'] else int(raw['wind_speed_alt'][k]),
                         round(dist, 2)])
        if rows:
            pts[s['id']] = rows
    return {'mission': m, 'date': d.isoformat(), 'url': url, 'bytes': len(b),
            'sha256': hashlib.sha256(b).hexdigest(),
            'columns': ['t (s since 1985-01-01 UTC)', 'lat (1e-6 deg)', 'lon (1e-6 deg)',
                        'swh (mm)', 'wind_speed_alt (cm/s)', 'km from site'],
            'scale': {'swh': scale['swh'], 'wind_speed_alt': scale['wind_speed_alt']},
            'points': pts}


def alt_file(m, d):
    path = os.path.join(CACHE, 'alt', d.strftime('%Y%m'), f'{m}_{d.strftime("%Y%m%d")}.json')
    if os.path.exists(path):
        return 'cached'
    rec = alt_extract(m, d)
    write_json(path, rec)
    return 'absent' if rec.get('absent') else f'{sum(len(v) for v in rec["points"].values())} points'


# ── METAR (platform P-25, SBLB) ───────────────────────────────────────────

def metar(a, b):
    stations = sorted({s['metar'] for s in SITES if s.get('metar')})
    for st in stations:
        y = a.year
        while y <= b.year:
            y0 = max(a, date(y, 1, 1))
            y1 = min(b, date(y, 12, 31))
            path = os.path.join(CACHE, 'metar', f'{st}-{y}.json')
            url = ('https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py?station=' + st +
                   '&data=sknt&data=drct&data=gust&data=metar' +
                   f'&year1={y0.year}&month1={y0.month}&day1={y0.day}' +
                   f'&year2={y1.year}&month2={y1.month}&day2={y1.day}' +
                   '&tz=Etc/UTC&format=onlycomma&latlon=yes&missing=M&trace=T&direct=no' +
                   '&report_type=1&report_type=3&report_type=4')
            body = E.get(url)
            rows = list(csv.reader(io.StringIO(body.decode())))
            write_json(path, {'station': st, 'from': y0.isoformat(), 'to': y1.isoformat(), 'url': url,
                              'sha256': hashlib.sha256(body).hexdigest(), 'header': rows[0], 'rows': rows[1:]})
            print(st, y, len(rows) - 1, 'reports', flush=True)
            y += 1
            time.sleep(2)


# ── pack: day files -> committed monthly records ──────────────────────────

def pack():
    manifest = {}
    for kind in ('ecmwf', 'alt'):
        root = os.path.join(CACHE, kind)
        if not os.path.isdir(root):
            continue
        for ym in sorted(os.listdir(root)):
            files = sorted(f for f in os.listdir(os.path.join(root, ym)) if f.endswith('.json'))
            month = [json.load(open(os.path.join(root, ym, f))) for f in files]
            blob = json.dumps({'kind': kind, 'month': ym, 'files': month}, separators=(',', ':')).encode()
            gz = gzip.compress(blob, mtime=0)
            dest = os.path.join(OUT, kind, ym + '.json.gz')
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, 'wb') as f:
                f.write(gz)
            manifest[f'{kind}/{ym}.json.gz'] = {'sha256': hashlib.sha256(gz).hexdigest(), 'bytes': len(gz),
                                                'jsonSha256': hashlib.sha256(blob).hexdigest(), 'days': len(month)}
    root = os.path.join(CACHE, 'metar')
    if os.path.isdir(root):
        for f in sorted(os.listdir(root)):
            blob = open(os.path.join(root, f), 'rb').read()
            gz = gzip.compress(blob, mtime=0)
            dest = os.path.join(OUT, 'metar', f + '.gz')
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, 'wb') as fh:
                fh.write(gz)
            manifest[f'metar/{f}.gz'] = {'sha256': hashlib.sha256(gz).hexdigest(), 'bytes': len(gz),
                                         'jsonSha256': hashlib.sha256(blob).hexdigest()}
    write_json(os.path.join(OUT, 'MANIFEST.json'), {'what': 'The packed back-archive (archive.py pack).', 'files': manifest})
    print(len(manifest), 'packed files')


def pack_noaa():
    """NOAA's day files -> corpus/janela/noaa/YYYYMM.json.gz and corpus/janela/noaa/MANIFEST.json: its own
    chain, so packing it never rewrites a byte of the ECMWF/altimeter records or their manifest."""
    manifest, root, out = {}, os.path.join(CACHE, 'noaa'), os.path.join(OUT, 'noaa')
    for ym in sorted(os.listdir(root)):
        files = sorted(f for f in os.listdir(os.path.join(root, ym)) if f.endswith('.json'))
        month = [json.load(open(os.path.join(root, ym, f))) for f in files]
        blob = json.dumps({'kind': 'noaa', 'month': ym, 'files': month}, separators=(',', ':')).encode()
        gz = gzip.compress(blob, mtime=0)
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, ym + '.json.gz'), 'wb') as f:
            f.write(gz)
        manifest[f'{ym}.json.gz'] = {'sha256': hashlib.sha256(gz).hexdigest(), 'bytes': len(gz),
                                     'jsonSha256': hashlib.sha256(blob).hexdigest(), 'days': len(month)}
    write_json(os.path.join(out, 'MANIFEST.json'), {'what': 'NOAA GFS-Wave back-archive at the Janela sites (archive.py noaa, pack-noaa).', 'files': manifest})
    print(len(manifest), 'packed NOAA months')


def run_pool(tasks, fn, workers, label):
    t0, done, n = time.time(), 0, len(tasks)
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(fn, *t): t for t in tasks}
        for fu in as_completed(futs):
            done += 1
            t = futs[fu]
            try:
                msg = fu.result()
            except Exception as e:  # noqa: BLE001 — report and keep going; a rerun resumes
                msg = 'ERROR ' + repr(e)[:300]
            if done % 20 == 0 or msg.startswith('ERROR') or done == n:
                el = time.time() - t0
                print(f'[{label}] {done}/{n} {t} {msg} | {el / 60:.1f} min, eta {el / done * (n - done) / 60:.1f} min', flush=True)


if __name__ == '__main__':
    cmd, rest = sys.argv[1], sys.argv[2:]
    if cmd == 'ecmwf':
        a, b, w = parse_args(rest, E.GCS_FIRST)
        run_pool([(d,) for d in days(a, b)], ecmwf_day, w, 'ecmwf')
    elif cmd == 'alt':
        a, b, w = parse_args(rest, E.GCS_FIRST)
        run_pool([(m, d) for d in days(a, b) for m in ALT_MISSIONS], alt_file, w, 'alt')
    elif cmd == 'metar':
        a, b, _ = parse_args(rest, E.GCS_FIRST)
        metar(a, b)
    elif cmd == 'noaa':
        a, b, w = parse_args(rest, NOAA_FIRST)
        run_pool([(d,) for d in days(a, b)], noaa_day, w, 'noaa')
    elif cmd == 'pack':
        pack()
    elif cmd == 'pack-noaa':
        pack_noaa()
    else:
        raise SystemExit(__doc__)
