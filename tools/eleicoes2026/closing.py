#!/usr/bin/env python3
"""tools/eleicoes2026/closing.py — how long after the legal close (17:00 Brasília) each urn closed in round 1, from the
per-section table decider A writes beside the BUs (corpus/eleicoes2026/raw/derived/r1-sections.tsv: the urn's own opening
and closing times, in its local clock). The legal close in a section's clock is its municipality's modal opening hour + 9 h
(opening is 8:00 Brasília everywhere; an urn replaced during the day opens late, so the municipality's mode is used, not
its own). Abroad (ZZ) is left out: its sections vote on local time in dozens of zones.

Writes corpus/eleicoes2026/derived/r1-closing.json: minutes after the legal close, a histogram by minute up to 60 and the
count beyond, with the table's sha256.

usage: python3 tools/eleicoes2026/closing.py"""
import collections
import datetime
import hashlib
import json
import os

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
TSV = os.path.join(ROOT, 'corpus', 'eleicoes2026', 'raw', 'derived', 'r1-sections.tsv')
OUT = os.path.join(ROOT, 'corpus', 'eleicoes2026', 'derived', 'r1-closing.json')


def main():
    rows = [l.rstrip('\n').split('\t') for l in open(TSV)]
    mode = collections.defaultdict(collections.Counter)
    for r in rows:
        if r[0] != 'ZZ' and r[6]:
            mode[(r[0], r[1])][int(r[6][11:13])] += 1
    hist, beyond, before, n, by_uf = collections.Counter(), 0, 0, 0, collections.defaultdict(list)
    for r in rows:
        if r[0] == 'ZZ' or not r[7]:
            continue
        h = mode[(r[0], r[1])].most_common(1)[0][0]
        close = datetime.datetime.strptime(r[7], '%Y-%m-%d %H:%M:%S')
        legal = close.replace(hour=h + 9, minute=0, second=0)
        mins = (close - legal).total_seconds() / 60
        n += 1
        by_uf[r[0]].append(mins)
        if mins < 0:
            before += 1
        elif mins >= 60:
            beyond += 1
        else:
            hist[int(mins)] += 1
    q = sorted(m for v in by_uf.values() for m in v)
    pct = lambda p: round(q[int(p * (len(q) - 1))], 1)
    out = {'what': __doc__.splitlines()[0], 'table_sha256': hashlib.sha256(open(TSV, 'rb').read()).hexdigest(),
           'sections': n, 'closed_before_legal_close': before, 'closed_60_or_more_minutes_after': beyond,
           'minute_histogram': {str(k): hist[k] for k in range(60)},
           'percentiles_minutes': {'p50': pct(.5), 'p90': pct(.9), 'p99': pct(.99), 'max': round(q[-1], 1)},
           'within_10_minutes': sum(1 for m in q if 0 <= m < 10), 'within_30_minutes': sum(1 for m in q if 0 <= m < 30)}
    json.dump(out, open(OUT, 'w'), indent=1, sort_keys=True)
    print(f'{n:,} sections: p50 {out["percentiles_minutes"]["p50"]} min, p99 {out["percentiles_minutes"]["p99"]}, '
          f'{beyond} closed an hour or more after, {before} before the legal close')


if __name__ == '__main__':
    main()
