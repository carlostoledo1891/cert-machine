"""observe.py — what the satellites saw near the Janela sites, day by day, kept.

apps/janela/audit · cert-machine

    python observe.py               observe every UTC day from the ledger's first target day
                                    up to three days ago that is not yet in corpus/janela/observed/

NOAA rewrites EVERY near-real-time file of the archive once a day, at about 11:12 UTC
(measured 2026-10-06: Last-Modified 11:12–11:15 on every mission file back to 2026-10-01),
and the file for day D is still incomplete in its D+1 version (Jason-3 for 2026-10-05:
495,993 bytes against 569,709–586,350 for the four days before; SWOT 521,824 against
~566,000). So a day is observed THREE days after it ends — the D+2 version or later,
whichever hour the Action runs — and written to corpus/janela/observed/YYYYMMDD.json:
every pass within 100 km of every site (passes.py — the same definition the back-archive
uses), its exact mean Hs and wind, and THE POINTS IT WAS MADE FROM. Because NOAA rewrites
the bytes daily (the `history` attribute carries the rewrite time), the sha256 kept for
each mission file pins the bytes as read, not a file anyone can download again; the
points are what a re-check reads. The ledger is scored from these files (score.js),
never from a fresh download.

Days are written strictly in order: a day that cannot be written stops the run, so the
ledger's rows for a target day are all scored together (placar.js forms one trial per
target day and must never see a day grow). A mission file that answers 404 holds the day
back for a retry the next run, until the day is RETRY_DAYS old; then the day is written
with that mission marked absent, for good.

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
LAG_DAYS = 3                     # a day is observed three days after it ends (the D+2 file or later)
RETRY_DAYS = 6                   # a missing mission file holds a day back until it is this old


def fr(x):
    return f'{x.numerator}/{x.denominator}' if x.denominator != 1 else str(x.numerator)


def observe(d):
    recs = [A.alt_extract(m, d) for m in A.ALT_MISSIONS]
    out = {'date': d.isoformat(), 'read': datetime.now(timezone.utc).isoformat(timespec='seconds'),
           'definition': 'apps/janela/audit/passes.py (radius 100 km, gap 120 s, >= 5 points; exact means)',
           'files': {r['mission']: ({'url': r['url'], 'sha256': r['sha256'], 'bytes': r['bytes']} if not r.get('absent') else {'url': r['url'], 'absent': True}) for r in recs},
           'filesNote': 'sha256 = the bytes as read; NOAA rewrites every file daily, so a fresh download differs in bytes — re-check from the points',
           'columns': ['t (s since 1985-01-01 UTC)', 'lat (1e-6 deg)', 'lon (1e-6 deg)', 'swh (mm)', 'wind_speed_alt (cm/s)', 'km from site'],
           'passes': {}}
    for s in A.SITES:
        ps = passes(recs, s['id'])
        if ps:
            out['passes'][s['id']] = [{'mission': p['mission'], 'tMid': p['tMid'].isoformat(timespec='seconds'), 'n': p['n'],
                                       'hs': fr(p['hs']), 'wind': None if p['wind'] is None else fr(p['wind']),
                                       'distMeanKm': p['distMeanKm'], 'durS': p['durS'], 'points': p['points']} for p in ps]
    absent = sorted(r['mission'] for r in recs if r.get('absent'))
    return out, absent


def main():
    os.makedirs(OUT, exist_ok=True)
    today = datetime.now(timezone.utc).date()
    last = today - timedelta(days=LAG_DAYS)
    d, done = FIRST, 0
    while d <= last:
        dest = os.path.join(OUT, d.strftime('%Y%m%d') + '.json')
        if not os.path.exists(dest):
            rec, absent = observe(d)
            if absent and (today - d).days < RETRY_DAYS:
                # a 404 may be NOAA's late file, not a missing mission: hold the day (and every later one) for the next run
                print('observe: holding', d, 'for a retry — no file yet for', ', '.join(absent), flush=True)
                break
            tmp = dest + '.part'                     # a killed run never leaves half a day behind
            with open(tmp, 'w') as f:
                json.dump(rec, f, separators=(',', ':'))
            os.replace(tmp, dest)
            done += 1
            print('observed', d, sum(len(v) for v in rec['passes'].values()), 'passes' + (' (absent for good: ' + ', '.join(absent) + ')' if absent else ''), flush=True)
        d += timedelta(days=1)
    print('observe:', done, 'new day(s); up to', last)


if __name__ == '__main__':
    main()
