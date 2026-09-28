#!/usr/bin/env python3
"""fetch-ww3-grid.py — daily maxima of significant wave height on a lattice of
nodes of the Ifremer WAVEWATCH III hindcast GLOBMULTI_ERA5_GLOBCUR_01
(GLOB-30M), the dataset of Reis, Guimarães, Farina, Paul, de Paula and Ribeiro
(Ocean Engineering 2026), for the return-level atlas.

The same read as tools/fetch-ww3-points.py (imported, not copied): every hs
chunk of every monthly file 1993-2024 by byte range, hashed as read, inflated
and un-shuffled — one global field per 3-hourly step. Instead of a handful of
points it keeps, for every node of the lattice, the largest value of each UTC
day (the daily block of blockrule.js, exactly: a day is the date part of the
timestamp) and how many of the month's steps were the fill value (land, sea
ice). A day whose eight steps are all fill is stored as the fill value.

THE LATTICE: every node of a 2° global lattice (latitudes -76 .. 80, longitudes
-180 .. 178), every 0.5° node of the Brazilian margin (6° N .. 36° S,
56° W .. 26° W), and the thirteen nodes of corpus/ww3-points: a superset, so
the atlas can choose its cells without a second 18 GB read.

WHAT IS PINNED, per month (cache/months/YYYYMM.json beside YYYYMM.i16): the
URL, Content-Length, Last-Modified, the sha256 of the hs chunks' compressed
bytes in time order, the step count, the days, and the per-node fill counts.
The int16 file is the daily maxima, days × nodes, little-endian, raw units
(Hs = raw / 500 m). cache/ is not committed; tools/build-ww3-atlas-corpus.js
transposes the sea cells the atlas certifies into corpus/ww3-grid/cells/.

THE ICE PASS (--ice): the same files' `ice` variable (sea ice area fraction,
one global field per step, ~45 KB compressed) read the same way — every chunk
by byte range, hashed as read — keeping per lattice node how many steps carry
any sea ice (a value above zero that is not the fill value) and the largest
fraction. cache/ice/YYYYMM.json. Under ice the model damps the waves to a few
millimetres rather than writing the fill value, so the atlas decides "open sea"
from this field, not from Hs.

usage (instruments/hseva/.venv, `make hseva-venv`):
  python3 tools/fetch-ww3-grid.py                every month 1993-01 .. 2024-12, resumable
  python3 tools/fetch-ww3-grid.py 200001         named months
  python3 tools/fetch-ww3-grid.py --ice [months] the sea-ice pass
"""
import concurrent.futures as cf
import hashlib
import importlib.util
import json
import os
import sys
import time
import zlib

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('ww3points', os.path.join(HERE, 'fetch-ww3-points.py'))
P = importlib.util.module_from_spec(spec)
spec.loader.exec_module(P)

ROOT = os.path.join(HERE, '..')
CACHE = os.path.join(ROOT, 'corpus', 'ww3-grid', 'cache', 'months')
ICE_CACHE = os.path.join(ROOT, 'corpus', 'ww3-grid', 'cache', 'ice')
NODES_FILE = os.path.join(ROOT, 'corpus', 'ww3-grid', 'nodes.json')


def lattice():
    js, is_ = [], []
    seen = set()

    def add(lat, lon):
        j, i = (lat - P.LAT0) / P.STEP, (lon - P.LON0) / P.STEP
        assert j == int(j) and i == int(i), (lat, lon)
        j, i = int(j), int(i)
        if 0 <= j < P.NLAT and 0 <= i < P.NLON and (j, i) not in seen:
            seen.add((j, i)); js.append(j); is_.append(i)
    for lat in range(-76, 81, 2):
        for lon in range(-180, 179, 2):
            add(float(lat), float(lon))
    for k in range(0, 85):
        for m in range(0, 61):
            add(6.0 - 0.5 * k, -56.0 + 0.5 * m)
    for p in json.load(open(os.path.join(ROOT, 'corpus', 'ww3-points', 'points.json')))['points']:
        add(float(p['lat']), float(p['lon']))                     # the report's thirteen nodes, so map and report meet
    return np.array(js, dtype=np.int32), np.array(is_, dtype=np.int32)


def write_nodes(J, I):
    rec = {'what': 'The nodes whose daily maxima tools/fetch-ww3-grid.py keeps, in storage order: a 2° global lattice (latitudes -76 .. 80, longitudes -180 .. 178) and every 0.5° node of the Brazilian margin (6° N .. 36° S, 56° W .. 26° W), each once. lat = -78 + 0.5 j, lon = -180 + 0.5 i on the hindcast\'s 0.5° grid.',
           'count': int(len(J)), 'j': J.tolist(), 'i': I.tolist()}
    os.makedirs(os.path.dirname(NODES_FILE), exist_ok=True)
    tmp = NODES_FILE + '.tmp'
    json.dump(rec, open(tmp, 'w'), separators=(',', ':'))
    os.replace(tmp, NODES_FILE)


def month_grid(month, J, I):
    url = P.url_of(month)
    head = P.retry(lambda: P._session.head(url, timeout=60), f'HEAD {month}')
    if head.status_code != 200:
        raise RuntimeError(f'HEAD {month}: {head.status_code}')
    clen, lmod = int(head.headers['Content-Length']), head.headers.get('Last-Modified')
    # the same metadata read and the same assertions as the points fetcher
    import fsspec, h5py, datetime as dt

    def meta():
        fs = fsspec.filesystem('http')
        f = fs.open(url, 'rb', block_size=2 ** 16, cache_type='readahead')
        h = h5py.File(f, 'r')
        hs = h['hs']
        a = hs.attrs
        info = dict(shape=hs.shape, chunks=hs.chunks, shuffle=hs.shuffle, gzip=hs.compression,
                    scale=float(a['scale_factor'][0]), offset=float(a['add_offset'][0]), fill=int(a['_FillValue'][0]),
                    dtype=str(hs.dtype), lat=h['latitude'][:], lon=h['longitude'][:], t=h['time'][:],
                    chunks_info=[hs.id.get_chunk_info(k) for k in range(hs.id.get_num_chunks())])
        h.close()
        return info
    m = P.retry(meta, f'metadata {month}')
    n = m['shape'][0]
    assert m['shape'][1:] == (P.NLAT, P.NLON) and m['chunks'] == (1, P.NLAT, P.NLON), (month, m['shape'], m['chunks'])
    assert m['shuffle'] and m['gzip'] == 'gzip' and m['dtype'] == 'int16', month
    assert abs(m['scale'] - 0.002) < 1e-9 and m['offset'] == 0.0 and m['fill'] == P.FILL, month
    assert np.array_equal(m['lat'], (P.LAT0 + P.STEP * np.arange(P.NLAT)).astype(m['lat'].dtype)), month
    assert np.array_equal(m['lon'], (P.LON0 + P.STEP * np.arange(P.NLON)).astype(m['lon'].dtype)), month
    ci = sorted(m['chunks_info'], key=lambda c: c.chunk_offset[0])
    assert [c.chunk_offset[0] for c in ci] == list(range(n)) and all(c.filter_mask == 0 for c in ci), month
    days = []
    dayOf = []
    for d in m['t']:
        hh = float(d) * 24.0
        if abs(hh - round(hh)) > 1e-6:
            raise RuntimeError(f'{month}: a time that is not on the hour ({d})')
        day = (P.EPOCH + dt.timedelta(hours=int(round(hh)))).strftime('%Y-%m-%d')
        if not days or days[-1] != day:
            if day in days:
                raise RuntimeError(f'{month}: the days are not in order at {day}')
            days.append(day)
        dayOf.append(len(days) - 1)
    with cf.ThreadPoolExecutor(P.CONCURRENCY) as ex:
        blobs = list(ex.map(lambda c: P.fetch_chunk(url, c.byte_offset, c.size), ci))
    sha = hashlib.sha256()
    dmax = np.full((len(days), len(J)), P.FILL, dtype=np.int16)
    fills = np.zeros(len(J), dtype=np.int32)
    for k, (c, b) in enumerate(zip(ci, blobs)):
        sha.update(b)
        raw = zlib.decompress(b)
        if len(raw) != P.NLAT * P.NLON * 2:
            raise RuntimeError(f'{month}: chunk {c.chunk_offset[0]} inflates to {len(raw)} bytes')
        field = np.frombuffer(raw, dtype=np.uint8).reshape(2, -1).T.copy().view('<i2').reshape(P.NLAT, P.NLON)
        v = field[J, I]
        isfill = v == P.FILL
        fills += isfill
        row = dmax[dayOf[k]]
        np.maximum(row, np.where(isfill, P.FILL, v), out=row)      # FILL (-32767) loses to any value
    return {
        'month': month, 'url': url, 'contentLength': clen, 'lastModified': lmod,
        'steps': n, 'hsChunkBytes': sum(c.size for c in ci), 'hsChunksSha256': sha.hexdigest(),
        'days': days, 'nodes': int(len(J)),
        'fillSteps': {str(q): int(fills[q]) for q in np.nonzero(fills)[0] if fills[q] < n},   # sea nodes with some fill; land is all-fill
        'landNodes': int(np.sum(fills == n)),
    }, dmax


def write_month(month, J, I):
    out = os.path.join(CACHE, month + '.json')
    binp = os.path.join(CACHE, month + '.i16')
    if os.path.exists(out) and os.path.exists(binp):
        try:
            r = json.load(open(out))
            if r.get('month') == month and r.get('nodes') == len(J) and os.path.getsize(binp) == 2 * len(r['days']) * len(J):
                return month, 'kept'
        except Exception:
            pass
    t0 = time.time()
    rec, dmax = month_grid(month, J, I)
    rec['i16Sha256'] = hashlib.sha256(dmax.astype('<i2').tobytes()).hexdigest()
    tmpb = binp + '.tmp'
    with open(tmpb, 'wb') as f:
        f.write(dmax.astype('<i2').tobytes())
    os.replace(tmpb, binp)
    tmp = out + '.tmp'
    json.dump(rec, open(tmp, 'w'), separators=(',', ':'))
    os.replace(tmp, out)
    return month, f'{rec["steps"]} steps, {len(rec["days"])} days, {rec["hsChunkBytes"] / 1e6:.1f} MB in {time.time() - t0:.0f} s'


def month_ice(month, J, I):
    """the month's sea-ice area fraction at the lattice nodes: steps with ice, and the largest fraction"""
    url = P.url_of(month)
    head = P.retry(lambda: P._session.head(url, timeout=60), f'HEAD {month}')
    if head.status_code != 200:
        raise RuntimeError(f'HEAD {month}: {head.status_code}')
    clen, lmod = int(head.headers['Content-Length']), head.headers.get('Last-Modified')
    import fsspec, h5py

    def meta():
        fs = fsspec.filesystem('http')
        f = fs.open(url, 'rb', block_size=2 ** 16, cache_type='readahead')
        h = h5py.File(f, 'r')
        v = h['ice']
        a = v.attrs
        info = dict(shape=v.shape, chunks=v.chunks, shuffle=v.shuffle, gzip=v.compression, dtype=str(v.dtype),
                    scale=float(a['scale_factor'][0]) if 'scale_factor' in a else 1.0, offset=float(a['add_offset'][0]) if 'add_offset' in a else 0.0,
                    fill=int(a['_FillValue'][0]), name=a['standard_name'].decode() if isinstance(a['standard_name'], bytes) else str(a['standard_name']),
                    lat=h['latitude'][:], lon=h['longitude'][:],
                    chunks_info=[v.id.get_chunk_info(k) for k in range(v.id.get_num_chunks())])
        h.close()
        return info
    m = P.retry(meta, f'ice metadata {month}')
    n = m['shape'][0]
    assert m['name'] == 'sea_ice_area_fraction', (month, m['name'])
    assert m['shape'][1:] == (P.NLAT, P.NLON) and m['chunks'] == (1, P.NLAT, P.NLON), (month, m['shape'], m['chunks'])
    assert m['shuffle'] and m['gzip'] == 'gzip' and m['dtype'] == 'int16' and m['offset'] == 0.0 and m['scale'] > 0, (month, m['scale'], m['offset'])
    assert np.array_equal(m['lat'], (P.LAT0 + P.STEP * np.arange(P.NLAT)).astype(m['lat'].dtype)), month
    assert np.array_equal(m['lon'], (P.LON0 + P.STEP * np.arange(P.NLON)).astype(m['lon'].dtype)), month
    ci = sorted(m['chunks_info'], key=lambda c: c.chunk_offset[0])
    assert [c.chunk_offset[0] for c in ci] == list(range(n)) and all(c.filter_mask == 0 for c in ci), month
    with cf.ThreadPoolExecutor(P.CONCURRENCY) as ex:
        blobs = list(ex.map(lambda c: P.fetch_chunk(url, c.byte_offset, c.size), ci))
    sha = hashlib.sha256()
    steps = np.zeros(len(J), dtype=np.int32)
    top = np.zeros(len(J), dtype=np.int32)
    for c, b in zip(ci, blobs):
        sha.update(b)
        raw = zlib.decompress(b)
        if len(raw) != P.NLAT * P.NLON * 2:
            raise RuntimeError(f'{month}: ice chunk {c.chunk_offset[0]} inflates to {len(raw)} bytes')
        field = np.frombuffer(raw, dtype=np.uint8).reshape(2, -1).T.copy().view('<i2').reshape(P.NLAT, P.NLON)
        v = field[J, I].astype(np.int32)
        has = (v != m['fill']) & (v > 0)
        steps += has
        np.maximum(top, np.where(v == m['fill'], 0, v), out=top)
    nz = np.nonzero(steps)[0]
    return {
        'month': month, 'url': url, 'contentLength': clen, 'lastModified': lmod, 'variable': 'ice', 'scale': m['scale'], 'fill': m['fill'],
        'steps': n, 'iceChunkBytes': sum(c.size for c in ci), 'iceChunksSha256': sha.hexdigest(), 'nodes': int(len(J)),
        'iceSteps': {str(q): int(steps[q]) for q in nz},             # nodes with any sea ice this month: steps with ice
        'iceMax': {str(q): int(top[q]) for q in nz},                 # and the largest fraction, raw (× scale)
    }


def write_ice(month, J, I):
    out = os.path.join(ICE_CACHE, month + '.json')
    if os.path.exists(out):
        try:
            r = json.load(open(out))
            if r.get('month') == month and r.get('nodes') == len(J):
                return month, 'kept'
        except Exception:
            pass
    t0 = time.time()
    rec = month_ice(month, J, I)
    tmp = out + '.tmp'
    json.dump(rec, open(tmp, 'w'), separators=(',', ':'))
    os.replace(tmp, out)
    return month, f'{rec["steps"]} steps, {rec["iceChunkBytes"] / 1e6:.1f} MB, {len(rec["iceSteps"])} nodes with ice, in {time.time() - t0:.0f} s'


def main():
    J, I = lattice()
    ice = '--ice' in sys.argv
    args = [a for a in sys.argv[1:] if a != '--ice']
    if ice:
        os.makedirs(ICE_CACHE, exist_ok=True)
        months, t0, done = args or P.all_months(), time.time(), 0
        with cf.ThreadPoolExecutor(P.MONTHS_IN_FLIGHT) as ex:
            futs = {ex.submit(write_ice, m, J, I): m for m in months}
            for fu in cf.as_completed(futs):
                m = futs[fu]
                try:
                    _, how = fu.result()
                except Exception as e:
                    how = f'FAILED: {e}'
                done += 1
                print(f'[ice {done}/{len(months)}] {m}: {how}  (elapsed {time.time() - t0:.0f} s)', flush=True)
        return
    write_nodes(J, I)
    os.makedirs(CACHE, exist_ok=True)
    months = args or P.all_months()
    t0 = time.time()
    done = 0
    with cf.ThreadPoolExecutor(P.MONTHS_IN_FLIGHT) as ex:
        futs = {ex.submit(write_month, m, J, I): m for m in months}
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
