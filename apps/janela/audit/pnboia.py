"""pnboia.py — a moored buoy as the referee's referee: the Brazilian Navy's PNBOIA record against the hindcast
CAMPANHA counts on.

apps/janela/audit · cert-machine

    python pnboia.py fetch       every PNBOIA fixed buoy's wave record (GOOS-Brasil OPeNDAP, ASCII), pinned
    python pnboia.py hindcast    the Ifremer WW3 hindcast at each open-sea buoy's nearest sea node, the months it spans
                                 (instruments/hseva/.venv: h5py over HTTP ranges, the reader of tools/fetch-ww3-points.py)
    python pnboia.py check       buoy vs hindcast -> certs/janela-pnboia-check.json
    python pnboia.py --check     the standard-library half (the QC rule, the window count) on synthetic series

WHY. Janela's CAMPANHA counts windows over a 32-year model hindcast and calls the counts exact — exact over the
model, and only that. No free wave-forecast archive overlaps a Brazilian buoy (ECMWF open data starts 2023, GFS-Wave
on AWS 2021, the GEFSv12 reforecast carries no waves), but the hindcast does: PNBOIA's fixed buoys reported waves
from 2011 to 2020 (22 deployments; the public archive at goosbrasil.org, data from the Navy's CHM). So the question
this file answers is the one CAMPANHA rests on: at a buoy, would the hindcast have counted the same windows?

THE QC RULE (pnboia-qc-v1, written before any buoy was compared with the hindcast; the raw Argos values carry
spikes to 19.9 m): a sample counts when 0.1 <= Hs <= 12 m, its position is within 0.1 degree of the deployment's
median position (a buoy adrift is not the site), and it is not a spike — more than 2 m from BOTH neighbours within
3 h. Nothing else is smoothed or corrected.

THE TIME AXIS. The archive stores time as float32 days since 0001-01-01: at ~736,000 days its quantum is 1/16 day,
90 minutes (the DAP ASCII view even prints it to whole days, so the axis is read from the binary view, .dods, and
kept exactly). A stored time is within 45 min of the sample's own, and two samples can share one.

THE COMPARISON (pnboia-compare-v1): the hindcast is 3-hourly; its pair is the buoy sample stored within 45 min of a
hindcast time (half the quantum) and nearest it — the median of the nearest ones when several share the time. A start time is DETERMINED for a window of TR hours when all TR/3 + 1 samples of BOTH series
are present; the window holds when every one is <= the limit (workability.js's definition, both ends included).
Counts are integers: both hold, buoy only, hindcast only, neither. Bias and RMS are descriptive. The buoys report
every few hours (Argos), so few starts are determined; a POINTWISE table (each pair at or under each limit, on both
series) was added after that was seen, and is labelled so.

Data: PNBOIA / GOOS-Brasil (Marinha do Brasil, Centro de Hidrografia da Marinha), freely available at
www.goosbrasil.org; Ifremer WAVEWATCH III GLOBMULTI_ERA5_GLOBCUR_01, CC BY-SA 4.0.
MIT licensed. Part of cert-machine.
"""
import gzip
import hashlib
import json
import math
import os
import sys
import unicodedata
import urllib.request
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'corpus', 'janela', 'pnboia')
DAP = 'http://goosbrasil.org:8080/pnboia/'
VARS = ['wave_hs', 'wave_period', 'wave_dir', 'latitude', 'longitude', 'time']
# the 22 fixed deployments of the public archive (goosbrasil.org/pnboia/dados, read 2026-10-07): name, WMO id
BUOYS = [('Santos', '31374'), ('Santos2', '31374'), ('Santos3', '31374'), ('Santos4', '31374'),
         ('Santa Catarina', ''), ('Santa Catarina2', '3100231'), ('Rio Grande', '31053'), ('Rio Grande2', ''),
         ('Rio Grande3', '31053'), ('Cabo Frio', '31262'), ('Cabo Frio2', '3101000'), ('Cabo Frio3', ''),
         ('Cabo Frio4', '31000'), ('Vitória', '31380'), ('Porto Seguro', '31260'), ('Recife', '31052'),
         ('Fortaleza', ''), ('Fortaleza2', '31229'), ('Guanabara', '31262'), ('Guanabara2', '31262'),
         ('Niterói', '31262'), ('Itaguaí', '')]
# inside a bay the 0.5° hindcast has no node of the same sea: these are fetched, never compared
BAY = {'Guanabara', 'Guanabara2', 'Niterói', 'Itaguaí'}
EPOCH = datetime(1, 1, 1, tzinfo=timezone.utc)
UA = {'User-Agent': 'cert-machine janela (github.com/carlostoledo1891/cert-machine)'}

QC = {'rule': 'pnboia-qc-v1', 'hsMin': 0.1, 'hsMax': 12.0, 'posDeg': 0.1, 'spikeM': 2.0, 'spikeH': 3.0}
LIMITS = ['1.5', '2.0', '2.5', '3.0']
WINDOWS = [24, 48, 72]


def file_of(name):
    s = unicodedata.normalize('NFD', name.lower().replace(' ', '_'))
    return 'B' + ''.join(c for c in s if unicodedata.category(c) != 'Mn')


def when(days_since_0001):
    """GOOS-Brasil's axis is 'days since 0001-01-01' in the CF standard calendar, Julian before 1582-10-15: its
    0001-01-01 is the proleptic Gregorian 0000-12-30, so the count runs two days longer than Python's."""
    return EPOCH + timedelta(days=float(days_since_0001) - 2)


# ── fetch ─────────────────────────────────────────────────────────────────

def parse_ascii(text):
    """DAP ASCII: blocks 'name.name' or 'name' then '[k] value' lines."""
    body = text.split('---------------------------------------------', 1)[1]
    blocks, cur = {}, None
    for line in body.splitlines():
        line = line.strip()
        if not line:
            continue
        if not line.startswith('['):
            cur = line.split(',')[0]
            blocks.setdefault(cur, [])
            continue
        k, v = line.split('] ', 1)
        blocks[cur].append(v.strip())
    pick = lambda n: blocks.get(n + '.' + n) or blocks.get(n) or []   # noqa: E731
    return {n: pick(n) for n in VARS}


def fetch():
    os.makedirs(OUT, exist_ok=True)
    for name, wmo in BUOYS:
        f = file_of(name)
        dest = os.path.join(OUT, f + '.json.gz')
        if os.path.exists(dest):
            print(name, 'kept')
            continue
        url = DAP + f + '.nc.ascii?' + ','.join(VARS)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=900) as r:
                b = r.read()
        except Exception as e:  # noqa: BLE001 — a deployment the server does not hold is recorded as absent
            print(name, 'ABSENT', repr(e)[:120])
            continue
        cols = parse_ascii(b.decode('utf-8', 'replace'))
        n = len(cols['time'])
        if not n or any(len(cols[v]) != n for v in VARS):
            raise SystemExit(f'REFUSED: {name}: columns of unequal length ' + str({v: len(cols[v]) for v in VARS}))
        tx = time_exact(f)
        if len(tx['time']) != n:
            raise SystemExit(f'REFUSED: {name}: the binary time axis has {len(tx["time"])} values, the ASCII view {n}')
        rec = {'buoy': name, 'wmo': wmo, 'file': f, 'url': url, 'fetched': datetime.now(timezone.utc).isoformat(timespec='seconds'),
               'timeExact': tx,
               'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'columns': VARS,
               'note': 'values as the server prints them (float32 renderings); time = days since 0001-01-01; -99999 is missing',
               'rows': [[cols[v][k] for v in VARS] for k in range(n)]}
        with open(dest, 'wb') as fh:
            fh.write(gzip.compress(json.dumps(rec, separators=(',', ':')).encode(), mtime=0))
        print(name, n, 'samples', len(b), 'bytes')


def time_exact(f):
    """the time axis from the DAP2 binary view: after 'Data:', an array of n float32 is preceded by n twice (XDR)"""
    import struct
    url = DAP + f + '.nc.dods?time'
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=900) as r:
        b = r.read()
    i = b.find(b'\nData:\n')
    if i < 0:
        raise SystemExit(f'REFUSED: {url}: no DAP2 data section')
    d = b[i + 7:]
    n = struct.unpack('>I', d[:4])[0]
    if struct.unpack('>I', d[4:8])[0] != n or len(d) < 8 + 4 * n:
        raise SystemExit(f'REFUSED: {url}: the array length does not agree with the bytes')
    vals = struct.unpack('>' + 'f' * n, d[8:8 + 4 * n])
    return {'url': url, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'time': [repr(v) for v in vals]}


def load(name):
    return json.load(gzip.open(os.path.join(OUT, file_of(name) + '.json.gz')))


# ── the QC rule (pnboia-qc-v1) ────────────────────────────────────────────

def median(xs):
    s = sorted(xs)
    n = len(s)
    return None if not n else (s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2)


def qc(rows):
    """rows: [(datetime, hs, lat, lon)] -> (kept [(datetime, hs)], counts)."""
    cnt = {'samples': len(rows), 'range': 0, 'position': 0, 'spike': 0}
    good = [r for r in rows if r[1] is not None and QC['hsMin'] <= r[1] <= QC['hsMax']]
    cnt['range'] = len(rows) - len(good)
    la = median([r[2] for r in good if r[2] is not None and abs(r[2]) <= 90])
    lo = median([r[3] for r in good if r[3] is not None and abs(r[3]) <= 180])
    pos = [r for r in good if la is not None and r[2] is not None and r[3] is not None
           and abs(r[2] - la) <= QC['posDeg'] and abs(r[3] - lo) <= QC['posDeg']]
    cnt['position'] = len(good) - len(pos)
    pos.sort(key=lambda r: r[0])
    kept = []
    for k, r in enumerate(pos):
        nb = [pos[j] for j in (k - 1, k + 1) if 0 <= j < len(pos) and abs((pos[j][0] - r[0]).total_seconds()) <= QC['spikeH'] * 3600]
        if len(nb) == 2 and all(abs(r[1] - q[1]) > QC['spikeM'] for q in nb):
            cnt['spike'] += 1
            continue
        kept.append((r[0], r[1]))
    cnt['kept'] = len(kept)
    return kept, cnt, (la, lo)


def rows_of(rec):
    out = []
    tx = rec['timeExact']['time']
    for k, (t, hs, tp, dr, la, lo) in enumerate((r[5], r[0], r[1], r[2], r[3], r[4]) for r in rec['rows']):
        t = tx[k]
        try:
            tt = when(t)
        except (ValueError, OverflowError):
            continue
        f = lambda x: None if x in ('-99999', '-99999.0', 'NaN', 'nan') else float(x)   # noqa: E731
        out.append((tt, f(hs), f(la), f(lo)))
    return out


# ── the hindcast at each buoy ─────────────────────────────────────────────

def node_of(la, lo):
    j = round((la - (-78.0)) / 0.5)
    i = round((lo - (-180.0)) / 0.5)
    return j, i, -78.0 + 0.5 * j, -180.0 + 0.5 * i


def plan():
    """the open-sea deployments with kept samples: their node and the months they span."""
    out = []
    for name, _ in BUOYS:
        if name in BAY or not os.path.exists(os.path.join(OUT, file_of(name) + '.json.gz')):
            continue
        kept, cnt, (la, lo) = qc(rows_of(load(name)))
        if len(kept) < 500:
            continue
        j, i, nla, nlo = node_of(la, lo)
        months = sorted({t.strftime('%Y%m') for t, _ in kept})
        out.append({'buoy': name, 'lat': la, 'lon': lo, 'node': [nla, nlo], 'j': j, 'i': i, 'months': months, 'qc': cnt})
    return out


def hindcast():
    import importlib.util
    spec = importlib.util.spec_from_file_location('ww3pts', os.path.join(ROOT, 'tools', 'fetch-ww3-points.py'))
    W = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(W)
    P = plan()
    # each node once; a node the hindcast calls land at every step moves one cell seaward (east) at a time, said so
    points, months = {}, set()
    for p in P:
        key = f"n{p['j']}_{p['i']}"
        points[key] = {'name': key, 'j': p['j'], 'i': p['i']}
        months.update(p['months'])
    hd = os.path.join(OUT, 'ww3')
    os.makedirs(hd, exist_ok=True)
    pts = list(points.values())
    import concurrent.futures as cf

    def one(m):
        dest = os.path.join(hd, m + '.json')
        if os.path.exists(dest):
            return m, 'kept'
        rec = W.month_record(m, pts)
        with open(dest + '.tmp', 'w') as fh:
            json.dump(rec, fh, separators=(',', ':'))
        os.replace(dest + '.tmp', dest)
        return m, f"{rec['hsChunkBytes'] / 1e6:.0f} MB"
    with cf.ThreadPoolExecutor(3) as ex:
        for m, msg in ex.map(one, sorted(months)):
            print(m, msg, flush=True)
    json.dump({'plan': P, 'points': pts}, open(os.path.join(hd, 'PLAN.json'), 'w'), indent=1)


# ── the comparison (pnboia-compare-v1) ────────────────────────────────────

def windows(a, b, times, limit, tr):
    """exact counts over start times (3-hourly): a, b dicts time->Hs; determined when every sample of both exists."""
    k = tr // 3 + 1
    c = {'both': 0, 'buoyOnly': 0, 'hindcastOnly': 0, 'neither': 0}
    for s in range(len(times) - k + 1):
        span = times[s:s + k]
        if span[-1] - span[0] != timedelta(hours=tr):
            continue
        if not all(t in a and t in b for t in span):
            continue
        ya = all(a[t] <= limit for t in span)
        yb = all(b[t] <= limit for t in span)
        c['both' if ya and yb else 'buoyOnly' if ya else 'hindcastOnly' if yb else 'neither'] += 1
    return c


def check():
    hd = os.path.join(OUT, 'ww3')
    PL = json.load(open(os.path.join(hd, 'PLAN.json')))
    res = []
    for p in PL['plan']:
        kept, cnt, _ = qc(rows_of(load(p['buoy'])))
        key = f"n{p['j']}_{p['i']}"
        hind = {}
        for m in p['months']:
            r = json.load(open(os.path.join(hd, m + '.json')))
            for t, v in zip(r['times'], r['points'][key]):
                if v != -32767:
                    hind[datetime.strptime(t, '%Y-%m-%dT%H').replace(tzinfo=timezone.utc)] = v / 500
        if not hind:
            res.append({'buoy': p['buoy'], 'node': p['node'], 'refused': 'the hindcast calls the node land'})
            continue
        # the buoy sample stored within 45 min of each hindcast time, the nearest (the median of the nearest when tied)
        buoy = {}
        ks = sorted(kept)
        j = 0
        for t in sorted(hind):
            while j < len(ks) and ks[j][0] < t - timedelta(minutes=45):
                j += 1
            near = []
            for q in ks[j:]:
                if q[0] > t + timedelta(minutes=45):
                    break
                near.append((abs((q[0] - t).total_seconds()), q[1]))
            if near:
                m = min(x[0] for x in near)
                buoy[t] = median([x[1] for x in near if x[0] == m])
        pairs = [(buoy[t], hind[t]) for t in sorted(buoy)]
        n = len(pairs)
        if n < 100:
            res.append({'buoy': p['buoy'], 'node': p['node'], 'pairs': n, 'refused': 'fewer than 100 pairs'})
            continue
        bias = sum(h - b for b, h in pairs) / n
        rms = math.sqrt(sum((h - b) ** 2 for b, h in pairs) / n)
        mb = sum(b for b, _ in pairs) / n
        times = sorted(set(buoy) & set(hind))
        # POINTWISE (added 2026-10-07 after the window counts came back nearly all undetermined — the buoys report every
        # few hours through Argos, so a run of TR/3+1 consecutive 3-hourly pairs is rare): descriptive, per limit, over
        # every pair — both at or under it, the buoy only, the hindcast only, neither
        PW = {}
        for lim in LIMITS:
            L = float(lim)
            c = {'both': 0, 'buoyOnly': 0, 'hindcastOnly': 0, 'neither': 0}
            for b_, h_ in pairs:
                c['both' if b_ <= L and h_ <= L else 'buoyOnly' if b_ <= L else 'hindcastOnly' if h_ <= L else 'neither'] += 1
            PW[lim + 'm'] = c
        W = {}
        for lim in LIMITS:
            for tr in WINDOWS:
                W[f'{lim}m/{tr}h'] = windows(buoy, hind, times, float(lim), tr)
        km = 6371.0088 * 2 * math.asin(math.sqrt(math.sin(math.radians(p['node'][0] - p['lat']) / 2) ** 2
                                                + math.cos(math.radians(p['lat'])) * math.cos(math.radians(p['node'][0]))
                                                * math.sin(math.radians(p['node'][1] - p['lon']) / 2) ** 2))
        res.append({'buoy': p['buoy'], 'position': [round(p['lat'], 3), round(p['lon'], 3)], 'node': p['node'], 'nodeKm': round(km, 1),
                    'from': times[0].strftime('%Y-%m-%d'), 'to': times[-1].strftime('%Y-%m-%d'), 'qc': cnt, 'pairs': n,
                    'buoyMeanHs': round(mb, 3), 'biasHindcastMinusBuoy': round(bias, 3), 'rms': round(rms, 3),
                    'scatterIndex': round(math.sqrt(max(0, rms ** 2 - bias ** 2)) / mb, 3), 'pointwise': PW, 'windows': W})
        print(p['buoy'], n, 'pairs, bias', round(bias, 3), 'rms', round(rms, 3), flush=True)
    out = {'what': 'The Brazilian Navy\'s PNBOIA moored buoys (GOOS-Brasil public archive, 2012-2019) against the Ifremer WAVEWATCH III hindcast '
                   'CAMPANHA counts on, at each buoy\'s nearest 0.5° node: pairs, bias, RMS and the exact window counts on both series '
                   '(apps/janela/audit/pnboia.py).',
           'qc': QC, 'compare': 'pnboia-compare-v1: the buoy sample stored within 45 min of a 3-hourly hindcast time and nearest it (the median of the nearest when tied; the archive\'s float32 time has a 90 min quantum); a start determined when all '
                                'TR/3+1 samples of both series exist; holds when all are <= the limit',
           'sources': {'buoys': 'PNBOIA / GOOS-Brasil (Marinha do Brasil, CHM), www.goosbrasil.org', 'hindcast': 'Ifremer GLOBMULTI_ERA5_GLOBCUR_01, CC BY-SA 4.0, doi:10.12770/857a3337-f59a-481a-bf98-5561e8b61e7b'},
           'buoys': res}
    json.dump(out, open(os.path.join(ROOT, 'certs', 'janela-pnboia-check.json'), 'w'), indent=1)
    print('wrote certs/janela-pnboia-check.json')


def selfcheck():
    """the standard-library half: the QC rule and the window count on synthetic series, with red controls."""
    t0 = datetime(2016, 1, 1, tzinfo=timezone.utc)
    rows = [(t0 + timedelta(hours=k), 1.5, -25.0, -45.0) for k in range(10)]
    rows[4] = (rows[4][0], 9.9, -25.0, -45.0)            # a spike: 8.4 m from both neighbours
    rows[6] = (rows[6][0], 19.9, -25.0, -45.0)           # out of range
    rows[8] = (rows[8][0], 1.4, -25.5, -45.0)            # adrift
    kept, cnt, _ = qc(rows)
    assert cnt == {'samples': 10, 'range': 1, 'position': 1, 'spike': 1, 'kept': 7}, cnt
    # RED: a real swell rise (2.5 m above ONE neighbour only) is not a spike
    rows2 = [(t0 + timedelta(hours=k), h, -25.0, -45.0) for k, h in enumerate([1.0, 1.0, 3.5, 3.6, 3.6])]
    assert qc(rows2)[1]['spike'] == 0
    times = [t0 + timedelta(hours=3 * k) for k in range(20)]
    a = {t: 1.0 for t in times}
    b = {t: 1.0 for t in times}
    b[times[5]] = 2.5
    c = windows(a, b, times, 2.0, 24)                    # 9 samples per window; starts 0..11 -> 12; those covering 5: 0..5
    assert c == {'both': 6, 'buoyOnly': 6, 'hindcastOnly': 0, 'neither': 0}, c
    del a[times[19]]
    assert sum(windows(a, b, times, 2.0, 24).values()) == 11            # a missing sample un-determines a start
    assert file_of('Vitória') == 'Bvitoria' and file_of('Santa Catarina2') == 'Bsanta_catarina2'
    print('janela pnboia battery: 5 pass, 0 fail, 2 red controls fired')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'fetch':
        fetch()
    elif cmd == 'hindcast':
        hindcast()
    elif cmd == 'check':
        check()
    elif cmd == '--check':
        selfcheck()
    else:
        raise SystemExit(__doc__)
