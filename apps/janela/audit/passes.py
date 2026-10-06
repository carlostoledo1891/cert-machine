"""passes.py — what a satellite saw near a site: passes, and their exact means.

apps/janela/audit · cert-machine

ONE definition of an observation, used by the back-archive matchups and by
the daily scoring of the forward ledger (a definition written twice WILL
diverge):

  point    a NOAA RADS near-real-time 1 Hz along-track value within RADIUS_KM
           of the site, Hs present (RADS editing as applied by NOAA);
  pass     the points of one mission whose times are within GAP_S of the
           previous point (one overflight);
  value    the exact mean of the pass's Hs integers (mm): sum / (1000 n) m,
           kept only when n >= MIN_POINTS;
  time     the pass mid-time, (first + last) / 2.

MIT licensed. Part of cert-machine.
"""
from datetime import datetime, timedelta, timezone
from fractions import Fraction

RADIUS_KM = 100.0
GAP_S = 120.0
MIN_POINTS = 5
EPOCH85 = datetime(1985, 1, 1, tzinfo=timezone.utc)


def passes(day_files, site_id, radius_km=RADIUS_KM):
    """day_files: parsed alt day JSONs (archive.py format). Returns passes sorted by time."""
    pts = []
    for f in day_files:
        if f.get('absent'):
            continue
        for row in f.get('points', {}).get(site_id, []):
            t, lat, lon, swh, wind, dist = row
            if swh is None or dist > radius_km:
                continue
            pts.append((float(t), f['mission'], swh, wind, dist, lat, lon, f.get('sha256')))
    pts.sort(key=lambda p: (p[1], p[0]))
    out, cur = [], []

    def flush():
        if len(cur) >= MIN_POINTS:
            t0, t1 = cur[0][0], cur[-1][0]
            n = len(cur)
            s = sum(p[2] for p in cur)
            winds = [p[3] for p in cur if p[3] is not None]
            out.append({
                'mission': cur[0][1], 'n': n,
                'tMid': EPOCH85 + timedelta(seconds=(t0 + t1) / 2),
                'hs': Fraction(s, 1000 * n),
                'wind': Fraction(sum(winds), 100 * len(winds)) if winds else None,
                'distMeanKm': round(sum(p[4] for p in cur) / n, 1),
                'durS': round(t1 - t0, 1),
                'files': sorted({p[7] for p in cur if p[7]}),
            })

    for p in pts:
        if cur and (p[1] != cur[-1][1] or p[0] - cur[-1][0] > GAP_S):
            flush()
            cur = []
        cur.append(p)
    flush()
    out.sort(key=lambda q: q['tMid'])
    return out
