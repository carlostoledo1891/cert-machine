#!/usr/bin/env python3
"""fetch-ww3-points.py — significant wave height at chosen grid points of the
Ifremer WAVEWATCH III hindcast GLOBMULTI_ERA5_GLOBCUR_01 (GLOB-30M), the
dataset of Reis, Guimarães, Farina, Paul, de Paula and Ribeiro (Ocean
Engineering 2026). Public, CC BY-SA 4.0, doi:10.12770/857a3337-f59a-481a-bf98-5561e8b61e7b.

WHY IT READS CHUNKS. Each monthly file is ~2.5 GB of every variable. `hs` is
stored one global field per time step, shuffled and gzipped (~190 kB), so a
point's series costs every chunk of the variable and nothing else: the HDF5
chunk index is read through h5py over HTTP ranges, then each chunk is fetched
by one byte-range request, hashed, inflated, un-shuffled and sampled at the
points. About 18 GB crosses the wire for 1993-2024; nothing else is kept.

WHAT IS PINNED. Per month: the URL, the server's Content-Length and
Last-Modified, the sha256 of the hs chunks' compressed bytes concatenated in
time order (the bytes this read, exactly), the time axis, and the raw int16
values at every point. Hs = raw / 500 m (the file's scale_factor is the float32
nearest 0.002; the decimal it stands for is what is read). _FillValue -32767
(land, ice) is kept raw and dropped by the reader, counted.

usage (instruments/hseva/.venv, `make hseva-venv`):
  python3 tools/fetch-ww3-points.py                 every month 1993-01 .. 2024-12, resumable
  python3 tools/fetch-ww3-points.py 200001 200002   named months
  python3 tools/fetch-ww3-points.py --finalize      write meta.json once all 384 months are on disk
"""
import concurrent.futures as cf
import datetime as dt
import hashlib
import json
import os
import sys
import threading
import time
import zlib

import fsspec
import h5py
import numpy as np
import requests

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CORPUS = os.path.join(ROOT, 'corpus', 'ww3-points')
MONTHS_DIR = os.path.join(CORPUS, 'months')
BASE = 'https://data-dataref.ifremer.fr/ww3/GLOBMULTI_ERA5_GLOBCUR_01/GLOB-30M'
NLAT, NLON = 323, 720
LAT0, LON0, STEP = -78.0, -180.0, 0.5
FILL = -32767
EPOCH = dt.datetime(1990, 1, 1, tzinfo=dt.timezone.utc)
CONCURRENCY = 24
MONTHS_IN_FLIGHT = 3

_sem = threading.Semaphore(CONCURRENCY)
_session = requests.Session()
_session.mount('https://', requests.adapters.HTTPAdapter(pool_connections=CONCURRENCY + 4, pool_maxsize=CONCURRENCY + 4))


def url_of(month):
    return f'{BASE}/{month[:4]}/FIELD_NC/LOPS_WW3-GLOB-30M_{month}.nc'


def all_months():
    return [f'{y}{m:02d}' for y in range(1993, 2025) for m in range(1, 13)]


def load_points():
    P = json.load(open(os.path.join(CORPUS, 'points.json')))['points']
    for p in P:
        j = (p['lat'] - LAT0) / STEP
        i = (p['lon'] - LON0) / STEP
        if j != int(j) or i != int(i):
            raise SystemExit(f'{p["name"]}: not a node of the 0.5° grid')
        p['j'], p['i'] = int(j), int(i)
    return P


def retry(fn, what, tries=6):
    for k in range(tries):
        try:
            return fn()
        except Exception as e:  # network: back off and try again
            if k == tries - 1:
                raise RuntimeError(f'{what}: {e}')
            time.sleep(2 ** k)


def fetch_chunk(url, off, size):
    def go():
        with _sem:
            r = _session.get(url, headers={'Range': f'bytes={off}-{off + size - 1}'}, timeout=180)
        if r.status_code != 206 or len(r.content) != size:
            raise IOError(f'range {off}+{size}: status {r.status_code}, {len(r.content)} bytes')
        return r.content
    return retry(go, f'chunk at {off}')


def month_record(month, points):
    url = url_of(month)
    head = retry(lambda: _session.head(url, timeout=60), f'HEAD {month}')
    if head.status_code != 200:
        raise RuntimeError(f'HEAD {month}: {head.status_code}')
    clen, lmod = int(head.headers['Content-Length']), head.headers.get('Last-Modified')

    def meta():
        fs = fsspec.filesystem('http')
        f = fs.open(url, 'rb', block_size=2 ** 16, cache_type='readahead')
        h = h5py.File(f, 'r')
        hs = h['hs']
        lat, lon = h['latitude'][:], h['longitude'][:]
        t = h['time'][:]
        a = hs.attrs
        info = dict(shape=hs.shape, chunks=hs.chunks, shuffle=hs.shuffle, gzip=hs.compression,
                    scale=float(a['scale_factor'][0]), offset=float(a['add_offset'][0]), fill=int(a['_FillValue'][0]),
                    dtype=str(hs.dtype), lat=lat, lon=lon, t=t,
                    chunks_info=[hs.id.get_chunk_info(k) for k in range(hs.id.get_num_chunks())])
        h.close()
        return info
    m = retry(meta, f'metadata {month}')
    n = m['shape'][0]
    assert m['shape'][1:] == (NLAT, NLON) and m['chunks'] == (1, NLAT, NLON), (month, m['shape'], m['chunks'])
    assert m['shuffle'] and m['gzip'] == 'gzip' and m['dtype'] == 'int16', month
    assert abs(m['scale'] - 0.002) < 1e-9 and m['offset'] == 0.0 and m['fill'] == FILL, (month, m['scale'], m['offset'], m['fill'])
    assert np.array_equal(m['lat'], (LAT0 + STEP * np.arange(NLAT)).astype(m['lat'].dtype)), month
    assert np.array_equal(m['lon'], (LON0 + STEP * np.arange(NLON)).astype(m['lon'].dtype)), month
    ci = sorted(m['chunks_info'], key=lambda c: c.chunk_offset[0])
    assert [c.chunk_offset[0] for c in ci] == list(range(n)) and all(c.filter_mask == 0 for c in ci), month
    hours = []
    for d in m['t']:
        hh = float(d) * 24.0
        if abs(hh - round(hh)) > 1e-6:
            raise RuntimeError(f'{month}: a time that is not on the hour ({d})')
        hours.append(int(round(hh)))
    times = [(EPOCH + dt.timedelta(hours=x)).strftime('%Y-%m-%dT%H') for x in hours]

    with cf.ThreadPoolExecutor(CONCURRENCY) as ex:
        blobs = list(ex.map(lambda c: fetch_chunk(url, c.byte_offset, c.size), ci))
    sha = hashlib.sha256()
    vals = {p['name']: [] for p in points}
    for c, b in zip(ci, blobs):
        sha.update(b)
        raw = zlib.decompress(b)
        if len(raw) != NLAT * NLON * 2:
            raise RuntimeError(f'{month}: chunk {c.chunk_offset[0]} inflates to {len(raw)} bytes')
        field = np.frombuffer(raw, dtype=np.uint8).reshape(2, -1).T.copy().view('<i2').reshape(NLAT, NLON)
        for p in points:
            vals[p['name']].append(int(field[p['j'], p['i']]))
    return {
        'month': month, 'url': url, 'contentLength': clen, 'lastModified': lmod,
        'steps': n, 'hsChunkBytes': sum(c.size for c in ci), 'hsChunksSha256': sha.hexdigest(),
        'hs': {'scale': '1/500 m (the file stores the float32 nearest 0.002)', 'fill': FILL},
        'times': times, 'points': vals,
    }


def write_month(month, points):
    out = os.path.join(MONTHS_DIR, month + '.json')
    if os.path.exists(out):
        try:
            r = json.load(open(out))
            if r.get('month') == month and all(len(r['points'].get(p['name'], [])) == r['steps'] for p in points):
                return month, 'kept'
        except Exception:
            pass
    t0 = time.time()
    rec = month_record(month, points)
    tmp = out + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(rec, f, separators=(',', ':'))
    os.replace(tmp, out)
    return month, f'{rec["steps"]} steps, {rec["hsChunkBytes"] / 1e6:.1f} MB in {time.time() - t0:.0f} s'


def finalize(points):
    months = all_months()
    files = {}
    total = 0
    for m in months:
        p = os.path.join(MONTHS_DIR, m + '.json')
        if not os.path.exists(p):
            raise SystemExit(f'missing {m}: run the fetch first')
        b = open(p, 'rb').read()
        r = json.loads(b)
        total += r['hsChunkBytes']
        files[f'months/{m}.json'] = {'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b), 'steps': r['steps'],
                                     'source': {'url': r['url'], 'contentLength': r['contentLength'], 'lastModified': r['lastModified'],
                                                'hsChunksSha256': r['hsChunksSha256'], 'hsChunkBytes': r['hsChunkBytes']}}
    meta = {
        'what': 'Significant wave height at the grid points of points.json, read from the Ifremer WAVEWATCH III hindcast GLOBMULTI_ERA5_GLOBCUR_01 (GLOB-30M, 0.5°, 3-hourly, 1993-01 to 2024-12) by tools/fetch-ww3-points.py: every hs chunk of every monthly file fetched by byte range, hashed as read, inflated and sampled. The dataset of Reis, Guimarães et al., Ocean Engineering 2026.',
        'dataset': {'name': 'GLOBMULTI_ERA5_GLOBCUR_01', 'doi': '10.12770/857a3337-f59a-481a-bf98-5561e8b61e7b',
                    'citation': 'Accensi, M. GLOBMULTI_ERA5_GLOBCUR_01. IFREMER. https://doi.org/10.12770/857a3337-f59a-481a-bf98-5561e8b61e7b; model: Alday, Accensi, Ardhuin, Dodet (2021), Ocean Modelling 166, 101848',
                    'license': 'CC BY-SA 4.0 (the Sextant record); the extracted series in months/ carry the same licence — see LICENSE-DATA.md',
                    'base': BASE},
        'fetched': dt.date.today().isoformat(),
        'value': 'Hs = raw / 500 m; raw -32767 is the fill value (land, ice) and is dropped by the reader, counted',
        'months': len(months), 'hsChunkBytesRead': total,
        'files': files,
    }
    json.dump(meta, open(os.path.join(CORPUS, 'meta.json'), 'w'), indent=1)
    print(f'meta.json: {len(files)} months, {total / 1e9:.2f} GB of hs chunks read')


def main():
    points = load_points()
    os.makedirs(MONTHS_DIR, exist_ok=True)
    args = sys.argv[1:]
    if args == ['--finalize']:
        return finalize(points)
    months = args or all_months()
    t0 = time.time()
    done = 0
    with cf.ThreadPoolExecutor(MONTHS_IN_FLIGHT) as ex:
        futs = {ex.submit(write_month, m, points): m for m in months}
        for fu in cf.as_completed(futs):
            m = futs[fu]
            try:
                _, how = fu.result()
            except Exception as e:
                how = f'FAILED: {e}'
            done += 1
            print(f'[{done}/{len(months)}] {m}: {how}  (elapsed {time.time() - t0:.0f} s)', flush=True)


if __name__ == '__main__':
    main()
