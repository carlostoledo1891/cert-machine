"""aifs.py — ECMWF's data-driven forecast (AIFS) at every Janela site, read exactly, written once.

apps/janela/audit · cert-machine

    python aifs.py [YYYY-MM-DD]      (default: today's 00 UTC run, UTC date)

Reads the 00 UTC run of ECMWF's Artificial Intelligence Forecasting System in open data (CC BY 4.0;
waves operational from 2026-05-12, in open data from the 2026-05-13 run): AIFS Single — significant wave
height, mean direction and mean period, the 10 m wind — and AIFS ENS's 50 perturbed members of significant
wave height, every 6 h to +168 h, the ECMWF feed's own steps. Writes corpus/janela/feed-aifs/YYYYMMDD.json.gz
in the ECMWF feed's shape (feed.py: every value an exact rational traced to a GRIB packed integer, every
field's bytes hashed as read), so the ledger commits it with the same target and margin.

WHAT IT IS FOR. A third provider, graded, not deciding (providers-eval-aifs-v1 in
certs/janela-ledger/DEFINITIONS.json, measured 2026-10-07: on 2.2 held-out months the union of IFS and AIFS
matched today's union of IFS and NOAA, with one broken LIBERADA each — not a measured gain, and two models
of one centre are not two independent providers). Two proposers: AIFS ENS's central 40 of 50 (claim 4/5,
like ECMWF's ensemble) and Janela's band calibrated on AIFS's own pairs (calibrated-aifs-v1, pinned in
commit.js). The site's node is AIFS's own sea node (its land mask is its own), read from step 0.

MIT licensed. Part of cert-machine.
"""
import gzip
import hashlib
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone

import ecmwf as E
from feed import fr, sea_index, sqrt_enclosure, LO_RANK, HI_RANK

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
SITES = json.load(open(os.path.join(HERE, '..', 'scenario', 'sites.json')))['sites']
STEPS = list(range(0, 169, 6))
BASE = E.MIRRORS['gcs']
MEMBERS = 50


def read(d, model, stream, step, params):
    """one file's `params`, decoded at every site; one group record whose sha256 covers the selected messages
    concatenated in file order (feed.py's record, with the model named)."""
    idx = E.index(BASE, d, 0, stream, step, model)
    if idx is None:
        raise SystemExit(f'REFUSED: {model} {stream} step {step} of {d} is not published yet')
    rows = E.pick(idx, params)
    url = f'{BASE}/{E.stem(d, 0, stream, step, model)}.grib2'
    out, h = [], hashlib.sha256()
    for off, n, rs in E.runs_of(rows):
        blob = E.get(url, (off, n))
        for r in rs:
            msg = blob[r['_offset'] - off: r['_offset'] - off + r['_length']]
            h.update(msg)
            meta, xs = E.decode(msg, SITES)
            if meta['param'] != r['param'] or int(str(meta['step']).split('-')[-1]) != step:
                raise SystemExit(f'REFUSED: {model} {stream} step {step}: the message is {meta["param"]} at {meta["step"]}')
            if str(meta['date']) != d.strftime('%Y%m%d') or int(meta['time']) != 0:
                raise SystemExit(f'REFUSED: {model} {stream} step {step}: a message of another run ({meta["date"]} {meta["time"]})')
            out.append((r, meta, xs))
    group = {'model': model, 'stream': stream, 'step': step, 'params': params, 'n': len(rows),
             'bytes': sum(r['_length'] for r in rows), 'url': url, 'sha256': h.hexdigest()}
    return out, group


def main():
    d = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else datetime.now(timezone.utc).date()
    if d < E.AIFS_FIRST:
        raise SystemExit(f'REFUSED: AIFS waves are in open data from {E.AIFS_FIRST}')
    dest = os.path.join(ROOT, 'corpus', 'janela', 'feed-aifs', d.strftime('%Y%m%d') + '.json.gz')
    if os.path.exists(dest):
        print('already read:', os.path.relpath(dest, ROOT))
        return
    run = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    made = datetime.now(timezone.utc).isoformat(timespec='seconds')

    def fetch(step):
        w, gw = read(d, 'aifs-single', 'wave', step, ['swh', 'mwd', 'mwp'])
        o, go = read(d, 'aifs-single', 'oper', step, ['10u', '10v'])
        e, ge = read(d, 'aifs-ens', 'waef', step, ['swh'])
        return w + o, e, [gw, go, ge]
    with ThreadPoolExecutor(max_workers=8) as ex:
        got = dict(zip(STEPS, ex.map(fetch, STEPS)))
    fields, sites, node_of = [], {s['id']: {'name': s['name'], 'en': s['en'], 'kind': s['kind'], 'steps': []} for s in SITES}, {}
    for step in STEPS:
        t = (run + timedelta(hours=step)).strftime('%Y-%m-%dT%H')
        det, ens, groups = got[step]
        fields.extend(groups)
        if len(ens) != MEMBERS or sorted(int(m.get('number', 0)) for _, m, _ in ens) != list(range(1, MEMBERS + 1)):
            raise SystemExit(f'REFUSED: step {step} has {len(ens)} AIFS ENS members, not members 1..{MEMBERS}')
        swh = next(x for x in det if x[1]['param'] == 'swh')
        for s in SITES:
            sid = s['id']
            if sid not in node_of:
                node_of[sid] = sea_index(swh[2][sid])
                k = node_of[sid]
                sites[sid]['node'] = None if k is None else E.box_nodes(swh[1], s)[k]
            k = node_of[sid]
            if k is None:
                continue
            val = {meta['param']: E.value(meta, xs[sid][k]) for _, meta, xs in det if xs[sid][k] is not None}
            members = sorted(E.value(meta, xs[sid][k]) for _, meta, xs in ens if xs[sid][k] is not None)
            row = {'t': t, 'lead': step}
            if val.get('swh') is not None:
                row['hs'] = {'det': fr(val['swh'])}
                if len(members) == MEMBERS:
                    row['hs'].update(lo=fr(members[LO_RANK - 1]), p50=fr((members[24] + members[25]) / 2), hi=fr(members[HI_RANK - 1]))
            if val.get('mwd') is not None:
                row['mwd'] = fr(val['mwd'])
            if val.get('mwp') is not None:
                row['tm'] = fr(val['mwp'])
            if val.get('10u') is not None and val.get('10v') is not None:
                lo, hi = sqrt_enclosure(val['10u'] ** 2 + val['10v'] ** 2)
                row['wind'] = {'u': fr(val['10u']), 'v': fr(val['10v']), 'speedLo': fr(lo), 'speedHi': fr(hi)}
            sites[sid]['steps'].append(row)
    out = {
        'what': 'ECMWF AIFS (data-driven) open-data 00 UTC forecast at the Janela sites (apps/janela/scenario/sites.json), read by apps/janela/audit/aifs.py: AIFS Single waves and 10 m wind, AIFS ENS 50 members of Hs. Values are exact rationals (n/d) traced to GRIB packed integers; m, degrees, s, m/s. The node is AIFS\'s own sea node.',
        'licence': 'ECMWF open data, Copyright ECMWF, CC BY 4.0 — https://www.ecmwf.int/en/forecasts/datasets/open-data',
        'model': 'aifs', 'run': run.strftime('%Y-%m-%dT%H'), 'madeAt': made,
        'ensemble': {'source': 'AIFS ENS', 'members': MEMBERS, 'band': f'order statistics {LO_RANK} and {HI_RANK} of {MEMBERS} sorted members (the central 40)', 'claim': '4/5',
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
