#!/usr/bin/env python3
"""build-ww3-atlas-corpus.py — the return-level atlas's cells, out of the lattice
cache that tools/fetch-ww3-grid.py fills (corpus/ww3-grid/cache/, not committed).

THE CELLS: every node of a 4° global lattice (latitudes -76 .. 80, longitudes
-180 .. 176), every 1° node of the Brazilian margin (6° N .. 36° S, 56° W ..
26° W), and the thirteen nodes of corpus/ww3-points. Each is a node of the
hindcast's 0.5° grid: a cell of the atlas is that node's series, not an area
average.

WHAT A CELL IS, decided from the whole 1993-2024 record:
  land   every step of every month is the fill value;
  ice    the hindcast's own sea-ice field (`ice`, the sea-ice area fraction,
         read by tools/fetch-ww3-grid.py --ice) is above zero at the node on
         some 3-hourly step, or some step is the fill value, or some day's
         largest Hs is zero. Under ice the model damps the waves — to a few
         millimetres, not to the fill value, so Hs alone cannot find the ice
         (a first cut that looked only for zeros certified the Ross Sea as open
         sea). The series is partly the ice's, so the cell is recorded with its
         counts and not certified;
  sea    none of that: 11,688 complete days of open water. Its daily maxima are
         written to cells/<lat>_<lon>.i16 (int16 little-endian, raw units,
         Hs = raw / 500 m, one per UTC day from 1993-01-01), pinned by sha256.

CHECKED ON THE WAY: every cache month against its own sha256; the days of each
month complete and in order, the whole run contiguous; every month's hs chunk
hash equal to the one corpus/ww3-points pinned for the same file — the same
bytes were read twice, weeks apart; and every month's ice pass read from the
same file (URL, length, Last-Modified and step count equal).

usage: instruments/hseva/.venv/bin/python3 tools/build-ww3-atlas-corpus.py
"""
import datetime as dt
import hashlib
import json
import os
import sys

import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
GRID = os.path.join(ROOT, 'corpus', 'ww3-grid')
CACHE = os.path.join(GRID, 'cache', 'months')
ICE = os.path.join(GRID, 'cache', 'ice')
CELLS = os.path.join(GRID, 'cells')
FILL = -32767
LAT0, LON0, STEP = -78.0, -180.0, 0.5


def months():
    return [f'{y}{m:02d}' for y in range(1993, 2025) for m in range(1, 13)]


def cell_id(lat, lon):
    f = lambda v: ('%g' % v)
    return f(lat) + '_' + f(lon)


def main():
    nodes = json.load(open(os.path.join(GRID, 'nodes.json')))
    J, I = np.array(nodes['j']), np.array(nodes['i'])
    lat, lon = LAT0 + STEP * J, LON0 + STEP * I
    points_meta = json.load(open(os.path.join(ROOT, 'corpus', 'ww3-points', 'meta.json')))['files']
    report = json.load(open(os.path.join(ROOT, 'corpus', 'ww3-points', 'points.json')))['points']

    pins, blocks, fillsteps = [], [], np.zeros(len(J), dtype=np.int64)
    icesteps, icemonths, icemax = np.zeros(len(J), dtype=np.int64), np.zeros(len(J), dtype=np.int64), np.zeros(len(J), dtype=np.int64)
    scales = set()
    all_days = []
    for m in months():
        rec = json.load(open(os.path.join(CACHE, m + '.json')))
        b = open(os.path.join(CACHE, m + '.i16'), 'rb').read()
        if hashlib.sha256(b).hexdigest() != rec['i16Sha256']:
            sys.exit(f'{m}: the cached daily maxima do not match their sha256')
        if rec['nodes'] != len(J):
            sys.exit(f'{m}: {rec["nodes"]} nodes, the lattice has {len(J)}')
        pm = points_meta.get(f'months/{m}.json')
        if not pm or pm['source']['hsChunksSha256'] != rec['hsChunksSha256']:
            sys.exit(f'{m}: the hs chunks read here are not the bytes corpus/ww3-points pinned')
        d = np.frombuffer(b, dtype='<i2').reshape(len(rec['days']), len(J))
        blocks.append(d)
        all_days += rec['days']
        for q, c in rec['fillSteps'].items():
            fillsteps[int(q)] += c
        ice = json.load(open(os.path.join(ICE, m + '.json')))
        if (ice['month'], ice['url'], ice['contentLength'], ice['lastModified'], ice['steps'], ice['nodes']) != (m, rec['url'], rec['contentLength'], rec['lastModified'], rec['steps'], rec['nodes']):
            sys.exit(f'{m}: the ice pass did not read the file the hs pass read')
        scales.add(ice['scale'])
        for q, c in ice['iceSteps'].items():
            icesteps[int(q)] += c
            icemonths[int(q)] += 1
            icemax[int(q)] = max(icemax[int(q)], ice['iceMax'][q])
        pins.append({'month': m, 'url': rec['url'], 'contentLength': rec['contentLength'], 'lastModified': rec['lastModified'],
                     'steps': rec['steps'], 'days': len(rec['days']), 'hsChunksSha256': rec['hsChunksSha256'], 'hsChunkBytes': rec['hsChunkBytes'],
                     'dailyMaximaSha256': rec['i16Sha256'], 'iceChunksSha256': ice['iceChunksSha256'], 'iceChunkBytes': ice['iceChunkBytes']})
    if len(scales) != 1:
        sys.exit(f'the ice field\'s scale is not one value across the months: {sorted(scales)}')
    ice_scale = scales.pop()
    day0 = dt.date(1993, 1, 1)
    expect = [(day0 + dt.timedelta(days=k)).isoformat() for k in range(len(all_days))]
    if all_days != expect or all_days[-1] != '2024-12-31':
        sys.exit('the days are not the contiguous run 1993-01-01 .. 2024-12-31')
    D = np.concatenate(blocks, axis=0)                     # days x nodes
    fillDays = np.sum(D == FILL, axis=0)
    zeroDays = np.sum(D == 0, axis=0)                      # the ice mask: a whole day at Hs = 0

    def sets_of(k):
        s = []
        la, lo = lat[k], lon[k]
        if la % 4 == 0 and lo % 4 == 0 and -76 <= la <= 80:
            s.append('global4')
        if la == int(la) and lo == int(lo) and -36 <= la <= 6 and -56 <= lo <= -26:
            s.append('brazil1')
        for p in report:
            if abs(p['lat'] - la) < 1e-9 and abs(p['lon'] - lo) < 1e-9:
                s.append('report:' + p['name'])
        return s

    os.makedirs(CELLS, exist_ok=True)
    cells, written = [], 0
    for k in range(len(J)):
        s = sets_of(k)
        if not s:
            continue
        cid = cell_id(float(lat[k]), float(lon[k]))
        n_days = int(D.shape[0])
        if fillDays[k] == n_days:
            status = 'land'
        elif icesteps[k] > 0 or fillDays[k] > 0 or fillsteps[k] > 0 or zeroDays[k] > 0:
            status = 'ice'
        else:
            status = 'sea'
        c = {'id': cid, 'lat': float(lat[k]), 'lon': float(lon[k]), 'sets': s, 'status': status}
        if status == 'ice':
            c['iceSteps'] = int(icesteps[k])             # 3-hourly steps with a sea-ice fraction above zero
            c['iceMonths'] = int(icemonths[k])           # months with any
            c['iceMax'] = round(int(icemax[k]) * ice_scale, 3)   # the largest fraction
            c['fillDays'] = int(fillDays[k]) + int(zeroDays[k])
            c['fillSteps'] = int(fillsteps[k])
            c['zeroDays'] = int(zeroDays[k])
        if status == 'sea':
            col = np.ascontiguousarray(D[:, k]).astype('<i2').tobytes()
            path = os.path.join(CELLS, cid + '.i16')
            if not (os.path.exists(path) and open(path, 'rb').read() == col):
                open(path, 'wb').write(col)
                written += 1
            c['file'] = 'cells/' + cid + '.i16'
            c['sha256'] = hashlib.sha256(col).hexdigest()
            c['max'] = int(D[:, k].max())
        if status != 'land':
            cells.append(c)
    keep = {c['file'].split('/')[1] for c in cells if 'file' in c}
    stale = [f for f in os.listdir(CELLS) if f.endswith('.i16') and f not in keep]
    for f in stale:
        os.remove(os.path.join(CELLS, f))
    meta = {
        'what': 'The cells of the return-level atlas: the daily maxima of significant wave height at each open-sea node of a 4° global lattice, a 1° lattice of the Brazilian margin and the thirteen nodes of corpus/ww3-points, from the Ifremer WAVEWATCH III hindcast GLOBMULTI_ERA5_GLOBCUR_01 (GLOB-30M, 0.5°, 3-hourly, 1993-01 to 2024-12) — the dataset of Reis, Guimarães et al., Ocean Engineering 2026. Read by tools/fetch-ww3-grid.py (every hs chunk of every monthly file, hashed as read; the chunk hashes equal those corpus/ww3-points pinned for the same files), cut by tools/build-ww3-atlas-corpus.py.',
        'dataset': {'name': 'GLOBMULTI_ERA5_GLOBCUR_01', 'doi': '10.12770/857a3337-f59a-481a-bf98-5561e8b61e7b',
                    'license': 'CC BY-SA 4.0 (the Sextant record); the cut series in cells/ carry the same licence — see LICENSE-DATA.md'},
        'value': 'cells/<lat>_<lon>.i16: int16 little-endian, one per UTC day 1993-01-01 .. 2024-12-31 (11,688), the largest 3-hourly value of the day, raw units: Hs = raw / 500 m',
        'status': 'sea: in 1993-2024 no step with sea ice (the hindcast\'s sea_ice_area_fraction above zero), no fill value and no day at Hs = 0 — certified; ice: the hindcast\'s sea ice touches the record (iceSteps 3-hourly steps with ice in iceMonths months, the largest fraction iceMax; or fill values, or whole days at Hs = 0) — recorded and not certified; land cells are not listed',
        'days': len(all_days), 'first': all_days[0], 'last': all_days[-1],
        'lattices': {'global4': '4° global: latitudes -76 .. 80, longitudes -180 .. 176', 'brazil1': '1° Brazilian margin: 6° N .. 36° S, 56° W .. 26° W', 'report': 'the thirteen nodes of corpus/ww3-points'},
        'months': pins,
        'cells': cells,
    }
    json.dump(meta, open(os.path.join(GRID, 'meta.json'), 'w'), separators=(',', ':'))
    lic = os.path.join(GRID, 'LICENSE-DATA.md')
    if not os.path.exists(lic):
        open(lic, 'w').write(open(os.path.join(ROOT, 'corpus', 'ww3-points', 'LICENSE-DATA.md')).read().replace('corpus/ww3-points', 'corpus/ww3-grid'))
    n = {s: sum(1 for c in cells if c['status'] == s) for s in ('sea', 'ice')}
    print(f'corpus/ww3-grid: {len(cells)} cells ({n["sea"]} sea, {n["ice"]} ice), {written} files written, {len(stale)} removed; '
          f'{sum(os.path.getsize(os.path.join(CELLS, f)) for f in os.listdir(CELLS)) / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
