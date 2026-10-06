"""observe.py — what the satellites saw near the Janela sites, day by day, kept.

apps/janela/audit · cert-machine

    python observe.py [--days N]     observe every UTC day from the ledger's first target day
                                     up to two days ago that is not yet in corpus/janela/observed/

NOAA publishes the near-real-time altimeter files about a day late; a day is
observed once, two days after it ends, and written to
corpus/janela/observed/YYYYMMDD.json: every pass within 100 km of every site
(passes.py — the same definition the back-archive uses), its exact mean Hs and
wind, and the sha256 of each mission file it came from. The ledger is scored
from these files (score.js), never from a fresh download, so a score can always
be re-checked against the record it was made from.

MIT licensed. Part of cert-machine.
"""
import json
import os
import sys
from datetime import date, datetime, timedelta, timezone

import archive as A
from passes import passes

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'corpus', 'janela', 'observed')
FIRST = date(2026, 10, 6)        # the ledger's first target day


def fr(x):
    return f'{x.numerator}/{x.denominator}' if x.denominator != 1 else str(x.numerator)


def observe(d):
    recs = [A.alt_extract(m, d) for m in A.ALT_MISSIONS]
    out = {'date': d.isoformat(), 'read': datetime.now(timezone.utc).isoformat(timespec='seconds'),
           'definition': 'apps/janela/audit/passes.py (radius 100 km, gap 120 s, >= 5 points; exact means)',
           'files': {r['mission']: ({'url': r['url'], 'sha256': r['sha256'], 'bytes': r['bytes']} if not r.get('absent') else {'url': r['url'], 'absent': True}) for r in recs},
           'passes': {}}
    for s in A.SITES:
        ps = passes(recs, s['id'])
        if ps:
            out['passes'][s['id']] = [{'mission': p['mission'], 'tMid': p['tMid'].isoformat(timespec='seconds'), 'n': p['n'],
                                       'hs': fr(p['hs']), 'wind': None if p['wind'] is None else fr(p['wind']),
                                       'distMeanKm': p['distMeanKm'], 'durS': p['durS']} for p in ps]
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    last = datetime.now(timezone.utc).date() - timedelta(days=2)
    d, done = FIRST, 0
    while d <= last:
        dest = os.path.join(OUT, d.strftime('%Y%m%d') + '.json')
        if not os.path.exists(dest):
            rec = observe(d)
            with open(dest, 'w') as f:
                json.dump(rec, f, separators=(',', ':'))
            done += 1
            print('observed', d, sum(len(v) for v in rec['passes'].values()), 'passes', flush=True)
        d += timedelta(days=1)
    print('observe:', done, 'new day(s); up to', last)


if __name__ == '__main__':
    main()
