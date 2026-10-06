"""feed.py — today's forecast at every Janela site, read exactly, written once.

apps/janela/audit · cert-machine

    python feed.py [YYYY-MM-DD]      (default: today's 00 UTC run, UTC date)

Reads the ECMWF open-data 00 UTC run (CC BY 4.0): the deterministic wave
model (swh, mwd, pp1d) and 10 m wind (10u, 10v, 10fg) every 6 h to +168 h,
and the 50-member wave ensemble (swh) at the same steps. Writes
corpus/janela/feed/YYYYMMDD.json.gz — every value as an exact rational traced
to a GRIB packed integer, every field's bytes hashed as read. The page's
build (apps/janela/build.js) reads it from there, behind the battery.

The ensemble band is a PROPOSAL, not a decision: lo and hi are the 6th and
45th of the 50 sorted members (the central 40 of 50 = 4/5 of members, the
proposer's own claim), graded later against satellites in the ledger.

Wind speed is sqrt(u^2 + v^2), which is not rational: it is carried as an
ENCLOSURE [lo, hi] of width <= 1e-6 m/s computed with integer square roots,
so a limit can still be compared exactly.

MIT licensed. Part of cert-machine.
"""
import gzip
import hashlib
import json
import math
import os
import shutil
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from fractions import Fraction

import ecmwf as E

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
SITES = json.load(open(os.path.join(HERE, '..', 'scenario', 'sites.json')))['sites']
STEPS = list(range(0, 169, 6))
BASE = E.MIRRORS['gcs']
LO_RANK, HI_RANK = 6, 45          # 1-based order statistics of 50 members: the central 40


def fr(fr_):
    return f'{fr_.numerator}/{fr_.denominator}' if fr_.denominator != 1 else str(fr_.numerator)


def sqrt_enclosure(x, scale=10 ** 6):
    """[lo, hi] with lo <= sqrt(x) <= hi, hi - lo <= 1/scale; x a non-negative Fraction."""
    p, q = x.numerator, x.denominator
    n = p * q * scale * scale                      # sqrt(p/q) = sqrt(p*q)/q
    r = math.isqrt(n)
    lo = Fraction(r, q * scale)
    hi = lo if r * r == n else Fraction(r + 1, q * scale)
    return lo, hi


def sea_index(xs):
    """the box node nearest the centre that the model calls sea (None if none)."""
    k = int(round(math.sqrt(len(xs))))
    c = k // 2
    best = None
    for idx, X in enumerate(xs):
        if X is None:
            continue
        j, i = divmod(idx, k)
        d = (j - c) ** 2 + (i - c) ** 2
        if best is None or d < best[0]:
            best = (d, idx)
    return None if best is None else best[1]


def read(d, stream, step, params, extra=None):
    """the fields `params` of one file, decoded at every site; one group record whose
    sha256 covers the selected messages concatenated in file order (re-fetch the
    index, select the same params, concatenate, hash: the record verifies)."""
    idx = E.index(BASE, d, 0, stream, step)
    if idx is None:
        raise SystemExit(f'REFUSED: {stream} step {step} of {d} is not published yet')
    rows = E.pick(idx, params, extra=extra)
    url = f'{BASE}/{E.stem(d, 0, stream, step)}.grib2'
    out, h = [], hashlib.sha256()
    for off, n, rs in E.runs_of(rows):
        blob = E.get(url, (off, n))
        for r in rs:
            msg = blob[r['_offset'] - off: r['_offset'] - off + r['_length']]
            h.update(msg)
            meta, xs = E.decode(msg, SITES)
            out.append((r, meta, xs))
    group = {'stream': stream, 'step': step, 'params': params, 'n': len(rows), 'bytes': sum(r['_length'] for r in rows),
             'url': url, 'sha256': h.hexdigest()}
    return out, group


def main():
    d = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else datetime.now(timezone.utc).date()
    dest = os.path.join(ROOT, 'corpus', 'janela', 'feed', d.strftime('%Y%m%d') + '.json.gz')
    if os.path.exists(dest):
        # a day's feed is written once: the ledger rows name its hash
        print('already read:', os.path.relpath(dest, ROOT))
        return
    run = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    made = datetime.now(timezone.utc).isoformat(timespec='seconds')
    fields, sites = [], {s['id']: {'name': s['name'], 'en': s['en'], 'kind': s['kind'], 'steps': []} for s in SITES}
    node_of = {}
    def fetch(step):
        w, gw = read(d, 'wave', step, ['swh', 'mwd', 'pp1d'])
        o, go = read(d, 'oper', step, ['10u', '10v', '10fg'])
        e, ge = read(d, 'waef', step, ['swh'])
        return w + o, e, [gw, go, ge]
    with ThreadPoolExecutor(max_workers=8) as ex:
        got = dict(zip(STEPS, ex.map(fetch, STEPS)))
    for step in STEPS:
        t = (run + timedelta(hours=step)).strftime('%Y-%m-%dT%H')
        det, ens, groups = got[step]
        fields.extend(groups)
        if len(ens) != 50:
            raise SystemExit(f'REFUSED: step {step} has {len(ens)} ensemble members, expected 50')
        for s in SITES:
            sid = s['id']
            swh = next(x for x in det if x[1]['param'] == 'swh')
            if sid not in node_of:
                node_of[sid] = sea_index(swh[2][sid])
                k = node_of[sid]
                sites[sid]['node'] = None if k is None else E.box_nodes(swh[1], s)[k]
            k = node_of[sid]
            if k is None:
                continue
            val = {}
            for _, meta, xs in det:
                v = E.value(meta, xs[sid][k])
                val[meta['param']] = v
            members = sorted(E.value(meta, xs[sid][k]) for _, meta, xs in ens if xs[sid][k] is not None)
            row = {'t': t, 'lead': step}
            if val.get('swh') is not None:
                row['hs'] = {'det': fr(val['swh'])}
                if len(members) == 50:
                    row['hs'].update(lo=fr(members[LO_RANK - 1]), p50=fr((members[24] + members[25]) / 2), hi=fr(members[HI_RANK - 1]))
            if val.get('mwd') is not None:
                row['mwd'] = fr(val['mwd'])
            if val.get('pp1d') is not None:
                row['tp'] = fr(val['pp1d'])
            if val.get('10u') is not None and val.get('10v') is not None:
                lo, hi = sqrt_enclosure(val['10u'] ** 2 + val['10v'] ** 2)
                row['wind'] = {'u': fr(val['10u']), 'v': fr(val['10v']), 'speedLo': fr(lo), 'speedHi': fr(hi),
                               'gust': fr(val['10fg']) if val.get('10fg') is not None else None}
            sites[sid]['steps'].append(row)
        print(f'step {step:3d} ok', flush=True)
    out = {
        'what': 'ECMWF open-data 00 UTC forecast at the Janela sites (apps/janela/scenario/sites.json), read by apps/janela/audit/feed.py. Values are exact rationals (n/d) traced to GRIB packed integers; m, degrees, s, m/s.',
        'licence': 'ECMWF open data, Copyright ECMWF, CC BY 4.0 — https://www.ecmwf.int/en/forecasts/datasets/open-data',
        'run': run.strftime('%Y-%m-%dT%H'), 'madeAt': made,
        'ensemble': {'members': 50, 'band': f'order statistics {LO_RANK} and {HI_RANK} of 50 sorted members (the central 40)', 'claim': '4/5',
                     'note': 'the proposer\'s claim, graded against satellites in certs/janela-ledger/; not a decision'},
        'sites': sites,
        'groups': fields,
    }
    blob = json.dumps(out, separators=(',', ':')).encode()
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'wb') as f:
        f.write(gzip.compress(blob, mtime=0))
    print('wrote', os.path.relpath(dest, ROOT), len(fields), 'groups,', len(blob), 'bytes,', os.path.getsize(dest), 'gzipped')


if __name__ == '__main__':
    main()
