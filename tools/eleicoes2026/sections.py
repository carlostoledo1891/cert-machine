#!/usr/bin/env python3
"""tools/eleicoes2026/sections.py — two summaries of round 1's per-section table (decider A's r1-sections.tsv, from the
pinned BUs), committed so the page and the ledger never need the 4.8 GB of raw bytes:

  derived/r1-municipios.json   per municipality, keyed by its IBGE code (the TSE's results config maps TSE → IBGE,
                               corpus/eleicoes2026/geo/tse-mun-6257.json): Lula, Flávio, valid votes, turnout, registered
  derived/r1-capacity.json     the sections' registered voters (QT_APTOS, the urn's capacity: nobody else can vote in it),
                               sorted largest first, as the cumulative curve at every power-of-two count and the counts
                               at which it first reaches given thresholds; the voter rolls are the same in both rounds
                               (158,745,079 registered in the sections that functioned, in both signed results)

usage: python3 tools/eleicoes2026/sections.py [threshold …]"""
import collections
import hashlib
import json
import os
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
E = os.path.join(ROOT, 'corpus', 'eleicoes2026')
TSV = os.path.join(E, 'raw', 'derived', 'r1-sections.tsv')


def main():
    cfg = json.load(open(os.path.join(E, 'geo', 'tse-mun-6257.json')))
    ibge = {(a['cd'].upper(), m['cd']): (m['cdi'], m['nm']) for a in cfg['abr'] for m in a['mu']}
    mun = collections.defaultdict(lambda: {'lula': 0, 'flavio': 0, 'valid': 0, 'turnout': 0, 'registered': 0, 'sections': 0})
    caps, unmapped = [], set()
    for l in open(TSV):
        f = l.rstrip('\n').split('\t')
        uf, cd, aptos, comp = f[0], f[1].zfill(5), int(f[4]), int(f[5])
        caps.append(aptos)
        votes = dict(x.split('=') for x in f[9:] if '=' in x)
        valid = sum(int(v) for k, v in votes.items() if k.isdigit() and k != '28')
        key = ibge.get((uf, cd))
        if key is None:
            unmapped.add((uf, cd))
            continue
        m = mun[key[0]]
        m['uf'], m['name'] = uf, key[1]
        m['lula'] += int(votes.get('13', 0))
        m['flavio'] += int(votes.get('22', 0))
        m['valid'] += valid
        m['turnout'] += comp
        m['registered'] += aptos
        m['sections'] += 1
    src = hashlib.sha256(open(TSV, 'rb').read()).hexdigest()
    json.dump({'what': 'round 1 per municipality (IBGE code), summed from the per-section BU table', 'table_sha256': src,
               'abroad_and_unmapped': sorted('-'.join(k) for k in unmapped), 'municipios': dict(sorted(mun.items()))},
              open(os.path.join(E, 'derived', 'r1-municipios.json'), 'w'), indent=0, sort_keys=True)
    caps.sort(reverse=True)
    cum, curve, total = 0, {}, sum(caps)
    for i, c in enumerate(caps, 1):
        cum += c
        if i & (i - 1) == 0 or i == len(caps):
            curve[str(i)] = cum
    th = [int(x) for x in sys.argv[1:]] or [2215096, 4430191]
    first = {}
    cum = 0
    for i, c in enumerate(caps, 1):
        cum += c
        for t in th:
            if str(t) not in first and cum >= t:
                first[str(t)] = {'sections': i, 'registered_in_them': cum}
    json.dump({'what': 'section capacities (registered voters) sorted largest first', 'table_sha256': src, 'sections': len(caps),
               'registered_total': total, 'largest': caps[:5], 'median': caps[len(caps) // 2], 'curve': curve, 'first_reaching': first},
              open(os.path.join(E, 'derived', 'r1-capacity.json'), 'w'), indent=1, sort_keys=True)
    print(f'{len(mun)} municipalities ({len(unmapped)} keys abroad or unmapped); {len(caps):,} sections, registered {total:,}; '
          + '; '.join(f'{t}: {v["sections"]:,} sections' for t, v in first.items()))


if __name__ == '__main__':
    main()
