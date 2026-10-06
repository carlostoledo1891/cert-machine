"""field.py — the sea of the hour over the whole Brazilian margin, for the map (forecast ink).

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

MIT licensed. Part of cert-machine.
"""
import os
import struct
import sys
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
        w = fields(d, 'wave', step, ['swh', 'mwd'])
        o = fields(d, 'oper', step, ['10u', '10v'])
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
    head = b'JNF1' + struct.pack('<HHHhhHI', rows, cols, len(STEPS), int(LAT0 * 100), int(LON0 * 100), int(STEP_DEG * 1000),
                                 int(d.strftime('%Y%m%d')) * 100)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'wb') as f:
        f.write(head + b''.join(blocks))
    print('field:', rows, 'x', cols, 'x', len(STEPS), 'steps ->', os.path.relpath(out, ROOT), os.path.getsize(out), 'bytes')


if __name__ == '__main__':
    main()
