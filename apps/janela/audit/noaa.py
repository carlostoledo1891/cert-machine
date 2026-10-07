"""noaa.py — NOAA's WAVEWATCH III at every Janela site, read exactly, written once.

apps/janela/audit · cert-machine

    python noaa.py [YYYY-MM-DD] [OUT]     default: today's 00 UTC run -> corpus/janela/feed-noaa/YYYYMMDD.json.gz
    python noaa.py --check                the battery (standard library only; no network)
    python noaa.py --verify FILE          re-read a written day from NOAA and compare every value and pin
    python noaa.py --units [YYYY-MM-DD] [OUT]   GFS-Wave Hs and 10 m wind at every production unit
                                          -> corpus/janela/field/platforms-noaa-latest.json (beside field.py's)

Janela's SECOND forecast provider, beside ECMWF (feed.py): the PLACAR becomes a
scoreboard of providers, both graded on the same satellites. Read from NOAA's
public buckets on AWS (the NOAA Open Data Dissemination program; US government
work, public domain), no account:

  GEFS-Wave  noaa-gefs-pds     gefs.YYYYMMDD/00/wave/gridded/gefs.wave.t00z.{c00,p01..p30}.global.0p25.fFFF.grib2
             the 31-member WAVEWATCH III ensemble (control + 30 perturbed): HTSGW only
  GFS-Wave   noaa-gfs-bdp-pds  gfs.YYYYMMDD/00/wave/gridded/gfswave.t00z.global.0p25.fFFF.grib2
             the deterministic WAVEWATCH III: HTSGW, PERPW, DIRPW, the forcing wind UGRD/VGRD,
             the wind sea WVHGT/WVPER/WVDIR and three swells SWELL/SWPER/SWDIR (1-3 in sequence)

at steps 0, 6, ..., 168 h of the 00 UTC run — the ECMWF feed's steps (feed.STEPS), so the two
providers forecast the same target times and meet the same satellite passes. Each field is
fetched by the byte range its .idx gives (wgrib2's inventory: offsets only, so a message's
length is the next offset; the deterministic set runs from UGRD to the end of the file and is
fetched as one open-ended range, split by the inventory and every message's own length).

EXACT. Every NOAA field here is GRIB2 JPEG 2000 packing of integers: value = (R + X·2^E)/10^D
(for Hs R = 0, E = 0, D = 2: centimetres). ecmwf.decode recovers X from the decoded double and
refuses a value no integer reproduces; checked 2026-10-07 on one GEFS field against an
independent decode of its JPEG 2000 code stream (OpenJPEG) and its own bitmap: all 565,283 sea
points equal. Every message's date, run hour and step are checked against the request (the
.idx line and the decoded message both): a file from the wrong run is refused, never used.

THE BAND (the proposer janela/hs-altimeter/noaa-gefs-c25of31, defined in
certs/janela-ledger/DEFINITIONS.json): order statistics 4 and 28 of the 31 sorted members at
the site's node — the central 25. If the truth and the members are exchangeable (the
ensemble's own premise), a closed band between the k-th and (m+1-k)-th of m members covers with
probability at least (m+1-2k)/(m+1) = 24/32 = 3/4: the claim. A step at which any of the 31
members is missing at the node has no band; a day with a member file missing is refused whole.

THE NODE: the box node nearest the site that GEFS's control calls sea at +0 h (feed.sea_index,
the one definition the ECMWF feed uses); the deterministic grid must be the same grid, so the
node is the same water in both NOAA products. NCEP's PERPW/DIRPW are kept under NCEP's names:
they are not ECMWF's pp1d/mwd.

MIT licensed. Part of cert-machine.
"""
import gzip
import hashlib
import json
import os
import struct
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from fractions import Fraction

import ecmwf as E
from feed import SITES, STEPS, fr, sea_index, sqrt_enclosure

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
GEFS = 'https://noaa-gefs-pds.s3.amazonaws.com'
GFS = 'https://noaa-gfs-bdp-pds.s3.amazonaws.com'
MEMBERS = ['c00'] + [f'p{k:02d}' for k in range(1, 31)]
LO_RANK, HI_RANK = 4, 28           # 1-based order statistics of 31 sorted members: the central 25
CLAIM = Fraction(len(MEMBERS) + 1 - 2 * LO_RANK, len(MEMBERS) + 1)   # 24/32 = 3/4
# the deterministic fields: (wgrib2 name, level) -> (key, eccodes shortName); UGRD..SWDIR 3 are contiguous to the end of the file
DET = {
    ('UGRD', 'surface'): ('u', 'u'), ('VGRD', 'surface'): ('v', 'v'),
    ('HTSGW', 'surface'): ('hs', 'swh'), ('PERPW', 'surface'): ('perpw', 'perpw'), ('DIRPW', 'surface'): ('dirpw', 'dirpw'),
    ('WVHGT', 'surface'): ('seaHs', 'shww'), ('WVPER', 'surface'): ('seaPer', 'mpww'), ('WVDIR', 'surface'): ('seaDir', 'wvdir'),
    **{(n, f'{k} in sequence'): (f'{key}{k}', sn) for k in (1, 2, 3)
       for n, key, sn in (('SWELL', 'swellHs', 'shts'), ('SWPER', 'swellPer', 'mpts'), ('SWDIR', 'swellDir', 'swdir'))},
}


def gefs_url(d, member, step):
    ds = d.strftime('%Y%m%d')
    return f'{GEFS}/gefs.{ds}/00/wave/gridded/gefs.wave.t00z.{member}.global.0p25.f{step:03d}.grib2'


def gfs_url(d, step):
    ds = d.strftime('%Y%m%d')
    return f'{GFS}/gfs.{ds}/00/wave/gridded/gfswave.t00z.global.0p25.f{step:03d}.grib2'


def fcst(step):
    """the forecast-time word of a wgrib2 inventory line"""
    return 'anl' if step == 0 else f'{step} hour fcst'


def inventory(text, d, step):
    """parse a wgrib2 .idx: [{n, offset, length (None for the last), name, level}]; refuses any
    line from another run or another step (a file from the wrong run is never used)."""
    rows = []
    for line in text.splitlines():
        if not line.strip():
            continue
        p = line.split(':')
        if len(p) < 6:
            raise ValueError(f'REFUSED: not an inventory line: {line!r}')
        if p[2] != 'd=' + d.strftime('%Y%m%d') + '00':
            raise ValueError(f'REFUSED: inventory line from another run ({p[2]}, wanted {d:%Y%m%d}00): {line!r}')
        if p[5] != fcst(step):
            raise ValueError(f'REFUSED: inventory line for another step ({p[5]!r}, wanted {fcst(step)!r}): {line!r}')
        rows.append({'n': int(p[0]), 'offset': int(p[1]), 'name': p[3], 'level': p[4]})
    for a, b in zip(rows, rows[1:]):
        if b['offset'] <= a['offset']:
            raise ValueError('REFUSED: inventory offsets do not increase')
        a['length'] = b['offset'] - a['offset']
    if rows:
        rows[-1]['length'] = None
    return rows


def find(rows, name, level):
    hit = [r for r in rows if r['name'] == name and r['level'] == level]
    if len(hit) != 1:
        raise ValueError(f'REFUSED: {len(hit)} inventory lines for {name}:{level}, expected 1')
    return hit[0]


def split(blob, off, rows):
    """cut a fetched range (starting at byte `off` of the file) into the inventory's messages; each
    must start with GRIB, end with 7777 and be exactly as long as its own section 0 says."""
    out = []
    for r in rows:
        a = r['offset'] - off
        if a < 0 or a + 16 > len(blob):
            raise ValueError(f'REFUSED: message {r["name"]}:{r["level"]} lies outside the fetched range')
        if blob[a:a + 4] != b'GRIB' or blob[a + 7] != 2:
            raise ValueError(f'REFUSED: no GRIB2 message at {r["name"]}:{r["level"]}')
        total = struct.unpack('>Q', blob[a + 8:a + 16])[0]
        if (r['length'] is not None and total != r['length']) or a + total > len(blob) or blob[a + total - 4:a + total] != b'7777':
            raise ValueError(f'REFUSED: message {r["name"]}:{r["level"]} is not whole ({total} bytes)')
        out.append(blob[a:a + total])
    return out


def check_meta(meta, d, step, want=None):
    """the decoded message is the requested run, hour and step (and parameter)"""
    if meta['date'] != int(d.strftime('%Y%m%d')) or meta['time'] != 0 or str(meta['step']) != str(step):
        raise ValueError(f"REFUSED: message is run {meta['date']} {meta['time']:04d} step {meta['step']}, wanted {d:%Y%m%d} 0000 step {step}")
    if want and meta['param'] != want:
        raise ValueError(f"REFUSED: message is {meta['param']}, wanted {want}")


def band(members):
    """[lo, p50, hi] of the 31 member values (Fractions), or None when any is missing"""
    if len(members) != len(MEMBERS) or any(x is None for x in members):
        return None
    s = sorted(members)
    return s[LO_RANK - 1], s[len(s) // 2], s[HI_RANK - 1]


def read_member(d, member, step):
    """one member's HTSGW at one step: (meta, xs, [offset, length], sha256 of the message)"""
    url = gefs_url(d, member, step)
    b = E.get(url + '.idx')
    if b is None:
        raise SystemExit(f'REFUSED: GEFS-Wave {member} step {step} of {d} is not published')
    r = find(inventory(b.decode(), d, step), 'HTSGW', 'surface')
    if r['length'] is None:
        raise SystemExit(f'REFUSED: GEFS-Wave {member} step {step}: HTSGW is the last message (no length)')
    msg = split(E.get(url, (r['offset'], r['length'])), r['offset'], [r])[0]
    meta, xs = E.decode(msg, SITES)
    check_meta(meta, d, step, 'swh')
    return meta, xs, [r['offset'], r['length']], hashlib.sha256(msg).digest()


def read_gfs(d, step, places=None):
    """the deterministic fields at one step, decoded at `places` (default: the sites): {key: (meta, xs)}, and the
    step's group record"""
    places = SITES if places is None else places
    url = gfs_url(d, step)
    b = E.get(url + '.idx')
    if b is None:
        raise SystemExit(f'REFUSED: GFS-Wave step {step} of {d} is not published')
    inv = inventory(b.decode(), d, step)
    rows = sorted((find(inv, n, lv) for n, lv in DET), key=lambda r: r['offset'])
    want = [r for r in inv if r['offset'] >= rows[0]['offset']]
    if [r['n'] for r in want] != [r['n'] for r in rows]:
        raise SystemExit(f'REFUSED: GFS-Wave step {step}: the fields read are not contiguous to the end of the file')
    blob = E.get(url, (rows[0]['offset'], None))
    msgs = split(blob, rows[0]['offset'], rows)
    if sum(len(m) for m in msgs) != len(blob):
        raise SystemExit(f'REFUSED: GFS-Wave step {step}: the range holds more than the inventory lists')
    out = {}
    for r, msg in zip(rows, msgs):
        key, sn = DET[(r['name'], r['level'])]
        meta, xs = E.decode(msg, places)
        check_meta(meta, d, step, sn)
        out[key] = (meta, xs)
    group = {'source': 'GFS-Wave', 'step': step, 'fields': [f"{r['name']}:{r['level']}" for r in rows], 'url': url,
             'offset': rows[0]['offset'], 'bytes': len(blob), 'sha256': hashlib.sha256(blob).hexdigest()}
    return out, group


GRID = ('Ni', 'Nj', 'lat0', 'lon0', 'dlat', 'dlon')


def det_row(val):
    """the deterministic fields of one place and step as written: NCEP's primary-wave period and direction, the 10 m
    wind (u, v and the speed enclosure), the wind sea and the three swells — one shape for the sites and the units"""
    row = {}
    for key in ('perpw', 'dirpw'):
        if val[key] is not None:
            row[key] = fr(val[key])
    if val['u'] is not None and val['v'] is not None:
        lo, hi = sqrt_enclosure(val['u'] ** 2 + val['v'] ** 2)
        row['wind'] = {'u': fr(val['u']), 'v': fr(val['v']), 'speedLo': fr(lo), 'speedHi': fr(hi)}

    def part(h, p, r):
        if val[h] is None:
            return None
        return {'hs': fr(val[h]), 'per': None if val[p] is None else fr(val[p]), 'dir': None if val[r] is None else fr(val[r])}
    row['sea'] = part('seaHs', 'seaPer', 'seaDir')
    row['swell'] = [part(f'swellHs{j}', f'swellPer{j}', f'swellDir{j}') for j in (1, 2, 3)]
    return row


def build(d):
    """the day's record of the 00 UTC run of date d, read from NOAA's buckets"""
    run = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    made = datetime.now(timezone.utc).isoformat(timespec='seconds')
    # one pool over every (step, member) and every deterministic step: ~900 small range requests, latency-bound
    jobs = [(step, m) for step in STEPS for m in MEMBERS]
    with ThreadPoolExecutor(max_workers=24) as ex:
        dets = ex.map(lambda step: read_gfs(d, step), STEPS)
        mem = dict(zip(jobs, ex.map(lambda j: read_member(d, j[1], j[0]), jobs)))
        dets = dict(zip(STEPS, dets))
    print(f'read {len(mem)} GEFS-Wave fields and {len(dets)} GFS-Wave steps', flush=True)
    got = {}
    for step in STEPS:
        ens = [(m,) + mem[(step, m)][:2] for m in MEMBERS]
        ge = {'source': 'GEFS-Wave', 'step': step, 'field': 'HTSGW:surface', 'members': MEMBERS, 'url': gefs_url(d, '{member}', step),
              'ranges': [mem[(step, m)][2] for m in MEMBERS], 'bytes': sum(mem[(step, m)][2][1] for m in MEMBERS),
              'sha256': hashlib.sha256(b''.join(mem[(step, m)][3] for m in MEMBERS)).hexdigest(),
              'sha256Of': "the 31 messages' own sha256 digests (32 bytes each), concatenated in member order"}
        got[step] = ((ens, ge), dets[step])
    ens0 = got[STEPS[0]][0][0]
    grid = {k: ens0[0][1][k] for k in GRID}
    sites, groups, node_of = {}, [], {}
    for s in SITES:
        k = sea_index(ens0[0][2][s['id']])                # the control at +0 h
        node_of[s['id']] = k
        sites[s['id']] = {'name': s['name'], 'en': s['en'], 'kind': s['kind'],
                          'node': None if k is None else E.box_nodes(ens0[0][1], s)[k], 'steps': []}
    for step in STEPS:
        (ens, ge), (det, gd) = got[step]
        groups.extend([ge, gd])
        for _, meta, _ in ens:
            if any(meta[k] != grid[k] for k in GRID):
                raise SystemExit(f'REFUSED: a GEFS-Wave member at step {step} is on another grid')
        for key, (meta, _) in det.items():
            if any(meta[k] != grid[k] for k in GRID):
                raise SystemExit(f'REFUSED: GFS-Wave {key} at step {step} is not on the GEFS-Wave grid')
        t = (run + timedelta(hours=step)).strftime('%Y-%m-%dT%H')
        for s in SITES:
            sid, k = s['id'], node_of[s['id']]
            if k is None:
                continue
            members = [E.value(meta, xs[sid][k]) for _, meta, xs in ens]
            val = {key: E.value(meta, xs[sid][k]) for key, (meta, xs) in det.items()}
            row = {'t': t, 'lead': step}
            b = band(members)
            hs = {}
            if val['hs'] is not None:
                hs['det'] = fr(val['hs'])
            if b:
                hs.update(lo=fr(b[0]), p50=fr(b[1]), hi=fr(b[2]))
            hs['m'] = [None if x is None else fr(x) for x in members]
            row['hs'] = hs
            row.update(det_row(val))
            sites[sid]['steps'].append(row)
    out = {
        'what': 'NOAA WAVEWATCH III, the 00 UTC run, at the Janela sites (apps/janela/scenario/sites.json), read by apps/janela/audit/noaa.py: '
                'the GEFS-Wave ensemble (31 members, Hs) and the deterministic GFS-Wave. Values are exact rationals (n/d) traced to GRIB packed '
                'integers; m, degrees (direction FROM, nautical), s, m/s. hs.m lists the members in the order of ensemble.members.',
        'licence': 'NOAA/NWS/NCEP data, a work of the US government: public domain — https://registry.opendata.aws/noaa-gefs/ and https://registry.opendata.aws/noaa-gfs-bdp-pds/',
        'run': run.strftime('%Y-%m-%dT%H'), 'madeAt': made, 'grid': grid,
        'ensemble': {'source': 'GEFS-Wave', 'members': MEMBERS, 'band': f'order statistics {LO_RANK} and {HI_RANK} of {len(MEMBERS)} sorted members (the central 25)',
                     'claim': f'{CLAIM.numerator}/{CLAIM.denominator}',
                     'note': "the proposer's claim, graded against satellites in certs/janela-ledger/; not a decision"},
        'deterministic': {'source': 'GFS-Wave', 'fields': {f'{n}:{lv}': key for (n, lv), (key, _) in DET.items()},
                          'note': "u, v: the 10 m wind that forces the wave model; perpw, dirpw: NCEP's primary-wave period and direction, kept apart from ECMWF's pp1d and mwd"},
        'sites': sites,
        'groups': groups,
    }
    return out


def main():
    d = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1] else datetime.now(timezone.utc).date()
    dest = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'corpus', 'janela', 'feed-noaa', d.strftime('%Y%m%d') + '.json.gz')
    if os.path.exists(dest):
        # a day's feed is written once: the ledger rows name its hash
        print('already read:', os.path.relpath(dest, ROOT))
        return
    out = build(d)
    groups = out['groups']
    blob = json.dumps(out, separators=(',', ':')).encode()
    os.makedirs(os.path.dirname(os.path.abspath(dest)), exist_ok=True)
    with open(dest, 'wb') as f:
        f.write(gzip.compress(blob, mtime=0))
    print('wrote', os.path.relpath(dest, ROOT), len(groups), 'groups,', len(blob), 'bytes,', os.path.getsize(dest), 'gzipped')


def check():
    """the battery: every refusal fires on a forged input, every pure step on hand-made data."""
    ok, bad = [], []

    def test(name, fn, red=False):
        try:
            fn()
            (bad if red else ok).append(name)
        except (ValueError, SystemExit, AssertionError) as e:
            (ok if red else bad).append(name + ('' if red else f' ({e})'))
    d = date(2026, 10, 6)
    idx24 = ('1:0:d=2026100600:WIND:surface:24 hour fcst:\n2:656464:d=2026100600:WDIR:surface:24 hour fcst:\n'
             '6:3065016:d=2026100600:HTSGW:surface:24 hour fcst:\n7:3454290:d=2026100600:IMWF:surface:24 hour fcst:\n')

    def t_inventory():
        r = find(inventory(idx24, d, 24), 'HTSGW', 'surface')
        assert (r['offset'], r['length']) == (3065016, 389274), r      # the field measured on 2026-10-07: 389,274 bytes
        assert inventory(idx24, d, 24)[-1]['length'] is None
    test('inventory: offsets, lengths from the next offset, the last open', t_inventory)
    test('RED inventory from another run (2026-10-05) is refused', lambda: inventory(idx24.replace('d=20261006', 'd=20261005'), d, 24), red=True)
    test('RED inventory for another step (+30 h asked, +24 h served) is refused', lambda: inventory(idx24, d, 30), red=True)
    test('RED a field absent from the inventory is refused', lambda: find(inventory(idx24, d, 24), 'PERPW', 'surface'), red=True)
    test('step 0 is "anl"', lambda: inventory(idx24.replace('24 hour fcst', 'anl'), d, 0))

    def t_packed():
        assert E.packed(1.37, Fraction(0), 0, 2) == 137 and E.packed(137 * 0.01, Fraction(0), 0, 2) == 137
        assert E.packed(-29.82 + 0.05, Fraction(-2982), 0, 2) == 5           # u: R = -2982 in centimetres
        assert E.value({'R': 0.0, 'E': 0, 'D': 2}, 137) == Fraction(137, 100)
    test('packed integers: X recovered from the double, the value exact', t_packed)
    test('RED a forged GRIB value (1.234 m at D = 2: no integer reproduces it) is refused', lambda: E.packed(1.234, Fraction(0), 0, 2), red=True)
    test('RED a negative packed integer is refused', lambda: E.packed(-0.01, Fraction(0), 0, 2), red=True)

    def t_band():
        ms = [Fraction(100 + k, 100) for k in range(31)]
        assert band(ms[::-1]) == (Fraction(103, 100), Fraction(115, 100), Fraction(127, 100))
        assert CLAIM == Fraction(3, 4)
        ties = [Fraction(1)] * 31
        assert band(ties) == (1, 1, 1)
    test('the band: order statistics 4 and 28 of 31, the median the 16th, the claim 3/4 exactly', t_band)

    def banded(ms):
        if band(ms) is None:
            raise ValueError('no band')
    test('RED a member missing at the node gives no band', lambda: banded([Fraction(1)] * 30 + [None]), red=True)
    test('RED 30 members give no band', lambda: banded([Fraction(1)] * 30), red=True)

    meta = {'date': 20261006, 'time': 0, 'step': '24', 'param': 'swh'}
    test('the message is the requested run, step and parameter', lambda: check_meta(meta, d, 24, 'swh'))
    test('RED a message from another day is refused', lambda: check_meta(dict(meta, date=20261005), d, 24, 'swh'), red=True)
    test('RED a message from the 06 UTC run is refused', lambda: check_meta(dict(meta, time=600), d, 24, 'swh'), red=True)
    test('RED a message for another step is refused', lambda: check_meta(dict(meta, step='30'), d, 24, 'swh'), red=True)
    test('RED a message of another parameter is refused', lambda: check_meta(dict(meta, param='perpw'), d, 24, 'swh'), red=True)

    def msg(body):
        n = 16 + len(body) + 4
        return b'GRIB\x00\x00\x0a\x02' + struct.pack('>Q', n) + body + b'7777'
    m1, m2 = msg(b'a' * 10), msg(b'b' * 7)
    inv = [{'name': 'A', 'level': 'surface', 'offset': 100, 'length': len(m1)}, {'name': 'B', 'level': 'surface', 'offset': 100 + len(m1), 'length': None}]

    def t_split():
        assert split(m1 + m2, 100, inv) == [m1, m2]
    test('split: two messages cut by the inventory, the last by its own length', t_split)
    test('RED a truncated message is refused', lambda: split(m1 + m2[:-2], 100, inv), red=True)
    test('RED a message whose length disagrees with the inventory is refused', lambda: split(m1 + m2, 100, [dict(inv[0], length=len(m1) + 1), inv[1]]), red=True)
    test('RED bytes that are not GRIB2 are refused', lambda: split(b'X' + m1[1:] + m2, 100, inv), red=True)
    for n in ok:
        print('  ok  ', n)
    for n in bad:
        print('  FAIL', n)
    reds = sum(1 for n in ok if n.startswith('RED'))
    print(f'janela noaa battery: {len(ok) - reds} pass, {len(bad)} fail, {reds} red controls fired')
    return not bad


def units(d, out):
    """the deterministic GFS-Wave at every offshore production unit (scenario/platforms.json): Hs, the 10 m wind,
    NCEP's primary-wave period and direction, the wind sea and the three swells, at the unit's nearest node the
    model calls sea within 3 nodes (feed.sea_index over a box of 3 at +0 h — field.py's rule for ECMWF), every
    value exact. The calibrated NOAA band at a unit is its Hs times the ratio interval its measured site lends;
    the swells are forecast ink on the card. Rides the app's day (janela-field), never main."""
    plat = json.load(open(os.path.join(HERE, '..', 'scenario', 'platforms.json')))['units']
    U3 = [{'id': u['id'], 'lat': u['lat'], 'lon': u['lon'], 'box': 3} for u in plat]
    det0, _ = read_gfs(d, STEPS[0], U3)
    m0, x0 = det0['hs']
    node = {}
    for u in U3:
        k = sea_index(x0[u['id']])
        if k is not None:
            node[u['id']] = E.box_nodes(m0, u)[k]
    UN = [{'id': uid, 'lat': ll[0], 'lon': ll[1], 'box': 0} for uid, ll in node.items()]    # each unit at its node alone
    with ThreadPoolExecutor(max_workers=12) as ex:
        res = dict(zip(STEPS, ex.map(lambda step: read_gfs(d, step, UN), STEPS)))
    out_units = {}
    for u in UN:
        steps = []
        for step in STEPS:
            det = res[step][0]
            val = {key: E.value(meta, xs[u['id']][0]) for key, (meta, xs) in det.items()}
            row = {'lead': step}
            for key in ('hs', 'u', 'v'):
                if val[key] is not None:
                    row[key] = fr(val[key])
            row.update({k: v for k, v in det_row(val).items() if k != 'wind'})
            steps.append(row)
        out_units[u['id']] = {'node': list(node[u['id']]), 'steps': steps}
    rec = {'run': d.strftime('%Y-%m-%dT00'), 'source': 'NOAA GFS-Wave (WAVEWATCH III), the 00 UTC run, public domain; nearest sea node within 3 nodes '
           'at 0.25 deg; values exact (GRIB packed integers); perpw/dirpw are NCEP\'s primary-wave period and direction; sea = wind sea, '
           'swell = the three swell partitions', 'groups': [res[st][1] for st in STEPS], 'units': out_units}
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, 'w') as fh:
        json.dump(rec, fh, separators=(',', ':'))
    print('noaa units:', len(out_units), 'units ->', os.path.relpath(out, ROOT), os.path.getsize(out), 'bytes')


def verify(path):
    """re-read a written day from NOAA's buckets and compare it with the record, every value and every pin
    (all but madeAt): the re-run line of the second provider, for as long as AWS serves the run"""
    rec = json.loads(gzip.open(path).read())
    again = json.loads(json.dumps(build(date.fromisoformat(rec['run'][:10]))))   # as written: tuples become lists
    diff = [k for k in rec if k != 'madeAt' and rec[k] != again.get(k)]
    print(f"{path}: {'re-read from NOAA, equal in every value and pin' if not diff else 'DIFFERS in ' + ', '.join(diff)}")
    return not diff


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        sys.exit(0 if check() else 1)
    if len(sys.argv) > 2 and sys.argv[1] == '--verify':
        sys.exit(0 if verify(sys.argv[2]) else 1)
    if len(sys.argv) > 1 and sys.argv[1] == '--units':
        ud = date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2] else datetime.now(timezone.utc).date()
        units(ud, sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, 'corpus', 'janela', 'field', 'platforms-noaa-latest.json'))
        sys.exit(0)
    main()
