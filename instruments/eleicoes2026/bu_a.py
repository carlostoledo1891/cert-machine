#!/usr/bin/env python3
"""instruments/eleicoes2026/bu_a.py — decider A for the 2026 presidential boletins de urna (BU na Web, the TSE's CSV of
every section's BU): standard library only, integers only.

It reads each pinned zip as it is (zipfile, the CSV in latin-1, ';'-separated, quoted), keeps the rows of the office
Presidente (CD_CARGO_PERGUNTA = 1), accumulates them by section (UF, municipality, zone, section; the file does not keep a section's rows together)
and decides, per section:
  S1  the votes of every row of the section (nominal, blank, null) sum to the section's turnout (QT_COMPARECIMENTO);
  S2  turnout + abstentions = voters registered (QT_APTOS), turnout ≤ registered;
  S3  the section-level fields repeated on every row (registered, turnout, abstentions, urn type, opening and closing
      times) are the same on every row;
and adds, exactly, the national and per-UF totals: votes per candidate (NR_VOTAVEL), blank, null, turnout, registered,
sections. It shares no code with decider B (bu_b.js), which reads the same bytes through `unzip -p`.

usage: python3 instruments/eleicoes2026/bu_a.py 1 corpus/eleicoes2026/derived/r1-a.json [SECTIONS.tsv]"""
import collections
import csv
import io
import json
import os
import sys
import zipfile

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
RAW = os.path.join(ROOT, 'corpus', 'eleicoes2026', 'raw')
PINS = os.path.join(ROOT, 'corpus', 'eleicoes2026', 'PINS.json')
SECTION_FIELDS = ('QT_APTOS', 'QT_COMPARECIMENTO', 'QT_ABSTENCOES', 'CD_TIPO_URNA', 'DT_ABERTURA', 'DT_ENCERRAMENTO',
                  'DS_SECOES_AGREGADAS', 'QT_ELEI_BIOM_SEM_HABILITACAO')


def sections(zpath):
    """yield (key, fields, votes, mismatch) per section of the office Presidente; the CSV does not keep a section's rows
    together, so every row is accumulated by its key"""
    acc = {}
    with zipfile.ZipFile(zpath) as z:
        name = [n for n in z.namelist() if n.endswith('.csv')][0]
        with z.open(name) as raw:
            r = csv.reader(io.TextIOWrapper(raw, encoding='latin-1', newline=''), delimiter=';', quotechar='"')
            h = next(r)
            ix = {k: i for i, k in enumerate(h)}
            for row in r:
                if row[ix['CD_CARGO_PERGUNTA']] != '1':
                    continue
                key = (row[ix['SG_UF']], row[ix['CD_MUNICIPIO']], row[ix['NR_ZONA']], row[ix['NR_SECAO']])
                f = tuple(row[ix[k]] for k in SECTION_FIELDS)
                e = acc.get(key)
                if e is None:
                    e = acc[key] = [f, collections.Counter(), False]
                elif e[0] != f:
                    e[2] = True
                tipo = row[ix['CD_TIPO_VOTAVEL']]
                who = row[ix['NR_VOTAVEL']] if tipo == '1' else {'2': 'BRANCO', '3': 'NULO'}.get(tipo, 'T' + tipo)
                e[1][who] += int(row[ix['QT_VOTOS']])
    for key, (f, votes, mismatch) in acc.items():
        yield key, f, votes, mismatch


def main():
    rnd = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else None
    tsv = sys.argv[3] if len(sys.argv) > 3 else None
    pins = json.load(open(PINS))['files']
    files = sorted(n for n in pins if n.startswith(f'bweb_{rnd}t_'))
    nat = collections.Counter()
    per_uf = {}
    seen = set()
    witnesses = {'S1': [], 'S2': [], 'S3': [], 'duplicate': []}
    counts = collections.Counter()
    closing = collections.Counter()
    tsvf = open(tsv, 'w') if tsv else None
    for name in files:
        uf_tot = collections.Counter()
        for key, f, votes, mismatch in sections(os.path.join(RAW, name)):
            aptos, comp, abst = int(f[0]), int(f[1]), int(f[2])
            counts['sections'] += 1
            if key in seen:
                witnesses['duplicate'].append(list(key))
            seen.add(key)
            if sum(votes.values()) != comp:
                witnesses['S1'].append({'section': list(key), 'votes': sum(votes.values()), 'turnout': comp})
            if comp + abst != aptos or comp > aptos:
                witnesses['S2'].append({'section': list(key), 'aptos': aptos, 'turnout': comp, 'abstentions': abst})
            if mismatch:
                witnesses['S3'].append(list(key))
            if f[6] != '#NULO#':
                counts['aggregated'] += 1
            counts['urn type ' + f[3]] += 1
            closing[f[5][11:16]] += 1
            t = collections.Counter(votes)
            t['_aptos'], t['_turnout'], t['_abstentions'], t['_sections'] = aptos, comp, abst, 1
            uf_tot.update(t)
            if tsvf:
                tsvf.write('\t'.join(list(key) + [str(aptos), str(comp), f[4], f[5], f[6]] +
                                     [f'{k}={v}' for k, v in sorted(votes.items())]) + '\n')
        per_uf[name.split('_')[2]] = dict(sorted(uf_tot.items()))
        nat.update(uf_tot)
        print(f'{name}: {uf_tot["_sections"]:,} sections', file=sys.stderr, flush=True)
    res = {'decider': 'A (Python, zipfile + csv)', 'round': int(rnd), 'files': {n: pins[n]['sha512'] for n in files},
           'national': dict(sorted(nat.items())), 'per_uf': per_uf,
           'checks': {k: {'failures': len(v), 'witnesses': v[:50]} for k, v in witnesses.items()},
           'counts': dict(sorted(counts.items())), 'closing_minute': dict(sorted(closing.items()))}
    if tsvf:
        tsvf.close()
    s = json.dumps(res, indent=1, sort_keys=True, ensure_ascii=False)
    if out:
        open(out, 'w').write(s + '\n')
    else:
        print(s)


if __name__ == '__main__':
    main()
