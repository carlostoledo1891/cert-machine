"""field.py — the sea of the hour over the whole Brazilian margin, for the map (forecast ink),
and the forecast at every offshore production unit (apps/janela/scenario/platforms.json).

apps/janela/audit · cert-machine

    python field.py [YYYY-MM-DD] [OUT]     default: today's 00 UTC run -> corpus/janela/field/latest.bin

The app draws the forecast as a FIELD — crest lines along the mean wave direction, streaks
along the wind — so a reader sees the sea the decisions are about. This file is a PICTURE of
ECMWF's forecast, never a decision: nothing on the map is decided from it (the decisions
use the site bands, apps/janela/audit/today.js). So it is quantized for drawing:

  grid    every other node of ECMWF's 0.25° grid over LAT0..LAT1, LON0..LON1 (0.5°),
          north to south, west to east; the nodes are the model's own, nothing interpolated;
  steps   0, 6, ..., 168 h from the run;
  bytes   per step and node, 4 bytes: Hs in 0.05 m (uint8; 255 = land), mean wave direction
          (from) in 360/256° (uint8), wind u and v at 10 m in 0.5 m/s (int8, clipped at ±63.5).

Layout (little-endian): the ASCII magic "JNF1", uint16 rows, uint16 cols, uint16 steps,
int16 lat0*100, int16 lon0*100, uint16 step deg*1000, uint32 run (YYYYMMDDHH), then
steps x rows x cols x 4 bytes. Licence: ECMWF open data, CC BY 4.0.

The same fields, read at FULL resolution (0.25°), give every production unit its forecast:
the nearest node the model calls sea (within 3 nodes), every value the decoded GRIB double
carried exactly as a fraction "n/d" (Hs, mean direction, peak period, 10 m u, v, gust) —
written to corpus/janela/field/platforms-latest.json beside the field. The app's builder turns
them into bands (forecast x the borrowed measured ratio interval, rounded OUTWARD).

MIT licensed. Part of cert-machine.
"""
import os
import json
import struct
import sys
from fractions import Fraction
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone

import eccodes
import numpy as np

import ecmwf as E

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
LAT0, LAT1 = 7.0, -36.0          # north edge, south edge
LON0, LON1 = -56.0, -27.0        # west edge, east edge
STEP_DEG = 0.5
STEPS = list(range(0, 169, 6))
BASE = E.MIRRORS['gcs']


def fields(d, stream, step, params):
    idx = E.index(BASE, d, 0, stream, step)
    if idx is None:
        raise SystemExit(f'REFUSED: {stream} step {step} of {d} is not published yet')
    rows = E.pick(idx, params)
    url = f'{BASE}/{E.stem(d, 0, stream, step)}.grib2'
    out = {}
    for off, n, rs in E.runs_of(rows):
        blob = E.get(url, (off, n))
        for r in rs:
            msg = blob[r['_offset'] - off: r['_offset'] - off + r['_length']]
            h = eccodes.codes_new_from_message(msg)
            try:
                Ni, Nj = eccodes.codes_get(h, 'Ni'), eccodes.codes_get(h, 'Nj')
                lat0 = eccodes.codes_get(h, 'latitudeOfFirstGridPointInDegrees')
                lon0 = eccodes.codes_get(h, 'longitudeOfFirstGridPointInDegrees')
                dd = eccodes.codes_get(h, 'iDirectionIncrementInDegrees')
                miss = eccodes.codes_get(h, 'missingValue')
                v = eccodes.codes_get_values(h).reshape(Nj, Ni)
            finally:
                eccodes.codes_release(h)
            out[r['param']] = (v, lat0, lon0, dd, miss)
    return out


def subgrid(v, lat0, lon0, dd, miss):
    lats = np.arange(LAT0, LAT1 - 1e-9, -STEP_DEG)
    lons = np.arange(LON0, LON1 + 1e-9, STEP_DEG)
    j = np.rint((lat0 - lats) / dd).astype(int)
    i = np.rint(((lons - lon0) % 360) / dd).astype(int) % v.shape[1]
    g = v[np.ix_(j, i)]
    return np.where(g == miss, np.nan, g), len(lats), len(lons)


def main():
    d = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1] else datetime.now(timezone.utc).date()
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'corpus', 'janela', 'field', 'latest.bin')

    def one(step):
        w = fields(d, 'wave', step, ['swh', 'mwd', 'pp1d'])
        o = fields(d, 'oper', step, ['10u', '10v', '10fg'])
        return step, w, o
    with ThreadPoolExecutor(max_workers=8) as ex:
        got = dict((s, (w, o)) for s, w, o in ex.map(one, STEPS))
    blocks, rows, cols = [], None, None
    for step in STEPS:
        w, o = got[step]
        hs, rows, cols = subgrid(*w['swh'])
        md, _, _ = subgrid(*w['mwd'])
        u, _, _ = subgrid(*o['10u'])
        v, _, _ = subgrid(*o['10v'])
        land = np.isnan(hs)
        b = np.zeros((rows, cols, 4), dtype=np.uint8)
        b[..., 0] = np.where(land, 255, np.clip(np.rint(np.nan_to_num(hs) / 0.05), 0, 254)).astype(np.uint8)
        b[..., 1] = np.where(land, 0, np.rint(np.nan_to_num(md) % 360 / (360 / 256)) % 256).astype(np.uint8)
        b[..., 2] = (np.clip(np.rint(u / 0.5), -127, 127).astype(np.int16) & 0xFF).astype(np.uint8)
        b[..., 3] = (np.clip(np.rint(v / 0.5), -127, 127).astype(np.int16) & 0xFF).astype(np.uint8)
        blocks.append(b.tobytes())
    # the production units, at full resolution, exactly
    plat = json.load(open(os.path.join(HERE, '..', 'scenario', 'platforms.json')))['units']
    units = {}
    w0 = got[STEPS[0]][0]['swh']
    v0, la0, lo0, dd, miss = w0
    for u in plat:
        j = int(round((la0 - u['lat']) / dd)); i = int(round(((u['lon'] - lo0) % 360) / dd))
        best = None
        for dj in range(-3, 4):
            for di in range(-3, 4):
                jj, ii = j + dj, (i + di) % v0.shape[1]
                if v0[jj, ii] != miss and (best is None or dj * dj + di * di < best[0]):
                    best = (dj * dj + di * di, jj, ii)
        if best is None:
            continue
        _, jj, ii = best
        node = [round(la0 - jj * dd, 6), round((lo0 + ii * dd + 180) % 360 - 180, 6)]
        steps = []
        for step in STEPS:
            w, o = got[step]
            val = {}
            for name, src in (('hs', w.get('swh')), ('mwd', w.get('mwd')), ('tp', w.get('pp1d')), ('u', o.get('10u')), ('v', o.get('10v')), ('gust', o.get('10fg'))):
                if src is None:      # 10 m gust is a max since the previous step: none at step 0
                    continue
                x = float(src[0][jj, ii])
                if x != src[4]:
                    q = Fraction(x)
                    val[name] = f'{q.numerator}/{q.denominator}' if q.denominator != 1 else str(q.numerator)
            steps.append({'lead': step, **val})
        units[u['id']] = {'node': node, 'steps': steps}
    pout = os.path.join(os.path.dirname(out), 'platforms-latest.json')
    with open(pout, 'w') as fh:
        json.dump({'run': d.strftime('%Y-%m-%dT00'), 'source': 'ECMWF open data (CC BY 4.0), the 00 UTC run, nearest sea node at 0.25 deg; values are the decoded GRIB doubles as exact fractions',
                   'units': units}, fh, separators=(',', ':'))
    print('platforms:', len(units), 'units ->', os.path.relpath(pout, ROOT), os.path.getsize(pout), 'bytes')
    head = b'JNF1' + struct.pack('<HHHhhHI', rows, cols, len(STEPS), int(LAT0 * 100), int(LON0 * 100), int(STEP_DEG * 1000),
                                 int(d.strftime('%Y%m%d')) * 100)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'wb') as f:
        f.write(head + b''.join(blocks))
    print('field:', rows, 'x', cols, 'x', len(STEPS), 'steps ->', os.path.relpath(out, ROOT), os.path.getsize(out), 'bytes')


if __name__ == '__main__':
    main()
