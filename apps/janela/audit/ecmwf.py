"""ecmwf.py — ECMWF open data, read at Janela's sites, exactly and hashed as read.

apps/janela/audit · cert-machine

The source: ECMWF's open data (CC BY 4.0, commercial use allowed), the IFS
deterministic forecast — stream `wave` (the WAM wave model: swh, mwd, pp1d)
and stream `oper` (10u, 10v) — and the wave ensemble `waef`. Every file
has a JSON-lines `.index` that gives each field's byte offset and length,
so only the fields we read are fetched (one global field ≈ 0.8 MB).

The archive: Google Cloud from 2023-07-12, AWS from 2023-01-18. The layout
changed on 2024-02-29: before it, `0p4-beta` (0.4°); from it, `ifs/0p25`.

What is kept, and why it is exact: every field is GRIB2 simple packing
(CCSDS-compressed integers; NOAA's WAVEWATCH III, read by noaa.py through this
same decoder, packs them as JPEG 2000), so a value IS (R + X * 2^E) / 10^D with R the
float32 reference value, E and D the binary and decimal scale factors and
X a non-negative integer. We store R, E, D per field and X per node, so a
number on any page can be traced to an integer in a field whose bytes
hash to the sha256 recorded when they were read. Nothing is interpolated
here; the nodes are the model's own.

MIT licensed. Part of cert-machine.
"""
import hashlib
import json
import os
import socket
import time
import urllib.error
import urllib.request
from datetime import date
from fractions import Fraction

MIRRORS = {
    'gcs': 'https://storage.googleapis.com/ecmwf-open-data',
    'aws': 'https://ecmwf-forecasts.s3.eu-central-1.amazonaws.com',
}
SWITCH = date(2024, 2, 29)   # first day of the ifs/0p25 layout (probed 2026-10-06)
GCS_FIRST = date(2023, 7, 12)
UA = {'User-Agent': 'cert-machine janela (github.com/carlostoledo1891/cert-machine)'}

if os.environ.get('JANELA_IPV4'):
    # some networks route IPv6 to the mirrors into a black hole (connections hang in SYN_SENT
    # while curl falls back to IPv4); JANELA_IPV4=1 resolves names to IPv4 only
    _getaddrinfo = socket.getaddrinfo
    socket.getaddrinfo = lambda host, port, family=0, *a, **k: _getaddrinfo(host, port, socket.AF_INET, *a, **k)


def grid_of(d):
    return '0p25' if d >= SWITCH else '0p4'


def stem(d, run, stream, step):
    ds = d.strftime('%Y%m%d')
    res = 'ifs/0p25' if d >= SWITCH else '0p4-beta'
    kind = 'ef' if stream in ('waef', 'enfo') else 'fc'
    return f'{ds}/{run:02d}z/{res}/{stream}/{ds}{run:02d}0000-{step}h-{stream}-{kind}'


def get(url, rng=None, tries=7):
    """GET with retries; rng = (offset, length), or (offset, None) for offset to the end. None on 404."""
    headers = dict(UA)
    if rng:
        headers['Range'] = f'bytes={rng[0]}-' if rng[1] is None else f'bytes={rng[0]}-{rng[0] + rng[1] - 1}'
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as r:
                b = r.read()
            if rng and rng[1] is not None and len(b) != rng[1]:
                raise IOError(f'short read {len(b)} of {rng[1]}')
            if b[:5] == b'<?xml':
                raise IOError('error body: ' + b[:200].decode(errors='replace'))
            return b
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            last = e
        except Exception as e:  # noqa: BLE001 — network: retry, then fail loudly
            last = e
        time.sleep(min(60, 2 ** k))
    raise IOError(f'failed after {tries} tries: {url} ({last})')


def index(base, d, run, stream, step):
    b = get(f'{base}/{stem(d, run, stream, step)}.index')
    if b is None:
        return None
    return [json.loads(line) for line in b.decode().splitlines() if line.strip()]


def pick(idx, params, levtype='sfc', extra=None):
    """The index rows for `params`, in file order; extra filters e.g. {'number': '3'}."""
    out = []
    for r in idx:
        if r.get('param') in params and r.get('levtype', levtype) == levtype:
            if extra and any(str(r.get(k)) != str(v) for k, v in extra.items()):
                continue
            out.append(r)
    return sorted(out, key=lambda r: r['_offset'])


def runs_of(rows):
    """Merge rows whose byte ranges touch into single fetches: [(offset, length, [rows])]."""
    out = []
    for r in rows:
        o, n = r['_offset'], r['_length']
        if out and out[-1][0] + out[-1][1] == o:
            out[-1] = (out[-1][0], out[-1][1] + n, out[-1][2] + [r])
        else:
            out.append((o, n, [r]))
    return out


def node_ij(meta, lat, lon):
    """Nearest node (j, i) of a regular lat/lon grid, scanning north to south."""
    j = round((meta['lat0'] - lat) / meta['dlat'])
    i = round(((lon - meta['lon0']) % 360.0) / meta['dlon']) % meta['Ni']
    return j, i


def node_ll(meta, j, i):
    lat = meta['lat0'] - j * meta['dlat']
    lon = (meta['lon0'] + i * meta['dlon'] + 180.0) % 360.0 - 180.0
    return round(lat, 6), round(lon, 6)


PACKINGS = ('grid_ccsds', 'grid_simple', 'grid_jpeg')   # integer packings: value = (R + X * 2**E) / 10**D


def packed(v, R, E, D):
    """The packed integer X behind a decoded double v: value = (R + X * 2**E) / 10**D exactly.

    R is a Fraction (the float32 reference value, exact), E and D integers. Refuses a v that
    no integer reproduces — a forged or re-scaled value is not a GRIB integer."""
    two, ten = Fraction(2) ** E, Fraction(10) ** D
    X = round((Fraction(v) * ten - R) / two)
    exact = (R + X * two) / ten
    if X < 0 or abs(float(exact) - v) > 1e-9 * max(1.0, abs(v)):
        raise ValueError(f'packing reconstruction failed: {v} vs {float(exact)}')
    return int(X)


def decode(msg, sites):
    """Decode one GRIB2 message; return (meta, {site_id: [X or None per box node]}).

    X is the packed integer: value = (R + X * 2**E) / 10**D exactly. A node the
    model calls land (bitmap) is None."""
    import eccodes   # here, not at the top: noaa.py --check and its battery run on the standard library
    h = eccodes.codes_new_from_message(msg)
    try:
        g = lambda k: eccodes.codes_get(h, k)  # noqa: E731
        meta = {
            'param': g('shortName'), 'packing': g('packingType'), 'grid': g('gridType'),
            'Ni': g('Ni'), 'Nj': g('Nj'),
            'lat0': g('latitudeOfFirstGridPointInDegrees'), 'lon0': g('longitudeOfFirstGridPointInDegrees'),
            'dlat': g('jDirectionIncrementInDegrees'), 'dlon': g('iDirectionIncrementInDegrees'),
            'date': g('dataDate'), 'time': g('dataTime'), 'step': g('stepRange'),
            'R': g('referenceValue'), 'E': g('binaryScaleFactor'), 'D': g('decimalScaleFactor'),
            'bits': g('bitsPerValue'),
        }
        if meta['grid'] != 'regular_ll' or meta['packing'] not in PACKINGS:
            raise ValueError(f"unexpected grid/packing {meta['grid']}/{meta['packing']}")
        if g('jScansPositively') != 0 or g('iScansNegatively') != 0:
            raise ValueError('unexpected scanning: node_ij reads north to south, west to east')
        try:
            meta['number'] = g('number')
        except eccodes.KeyValueNotFoundError:
            pass
        vals = eccodes.codes_get_values(h)
        miss = g('missingValue')
        R, E, D = Fraction(meta['R']), meta['E'], meta['D']
        out = {}
        for s in sites:
            j0, i0 = node_ij(meta, s['lat'], s['lon'])
            k = s.get('box', 1)
            xs = []
            for j in range(j0 - k, j0 + k + 1):
                for i in range(i0 - k, i0 + k + 1):
                    v = float(vals[j * meta['Ni'] + (i % meta['Ni'])])
                    if v == miss:
                        xs.append(None)
                        continue
                    try:
                        xs.append(packed(v, R, E, D))
                    except ValueError as e:
                        raise ValueError(f'{e} at {s["id"]}') from None
            out[s['id']] = xs
        return meta, out
    finally:
        eccodes.codes_release(h)


def box_nodes(meta, site):
    j0, i0 = node_ij(meta, site['lat'], site['lon'])
    k = site.get('box', 1)
    return [node_ll(meta, j, i) for j in range(j0 - k, j0 + k + 1) for i in range(i0 - k, i0 + k + 1)]


def value(field, X):
    """The exact value of packed integer X in a field record {R, E, D}: a Fraction."""
    if X is None:
        return None
    return (Fraction(field['R']) + X * Fraction(2) ** field['E']) / Fraction(10) ** field['D']


def sha256(b):
    return hashlib.sha256(b).hexdigest()
