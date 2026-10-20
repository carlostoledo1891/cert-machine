#!/usr/bin/env python3
"""instruments/claimbox/yield.py — the yield measurement (version 2 of the box, 2026-10-20): can the register's claims be
written as declared claims (B, φ) in the version-1 format? Standard library only.

THE RULE, written before the count. Every row of certs/claims-ledger.json is classified by the FORM of the claim it
decided (the row's claim and scope, and the deciding record), into one of five forms:
  F1  bar        a quantity of pinned bytes REL a printed bar (a bound, a constant to its digits, a score): the format as is
  F2  holds      an exhibited object satisfies finitely many exact conditions (a decomposition, a configuration, a
                 counterexample's identities, a polynomial map's determinant): a "holds" predicate over pinned bytes
  F3  box        a statement for every point of a continuous box, decided by a cover: a box domain with finite sides
  F4  aggregate  one row standing for many items with counts (a table of printed numbers, thousands of answer keys): a
                 collection of F1/F2 objects, one per item — a feature the format does not have yet
  F5  formal     a formal proof: the kernel's acceptance is a "holds"; whether the statement is the theorem claimed is a
                 reading, which no predicate states
and by whether version 1 ADMITS it today:
  yes       an object can be written and admitted now (the decided claim, in the row's scope — never the claimant's wider headline)
  feature   one named feature is missing: a collection object (F4), a QUEUED row with no verdict to attach, or bytes the
            claimant never published (a pin that does not resolve is NEEDS DATA, a composition word, not a malformed object)
  no        the claim rests on a reading, which the grammar does not state
and by the KIND of predicate it would carry:
  named     a function defined on disk by the record's decider (every row today)
  primitive an expression in the 17 scalar heads alone — none: every claim here ranges over an indexed family (a sum over
            index triples, a minimum over pairs, a maximum over a grid), and the vocabulary has no finite quantifier
  reading   a part no predicate states

The classification is a table, instruments/claimbox/yield-table.json, one row per register row with its reason; this program
refuses when the table and the register disagree on the set of rows, counts, checks two mechanical facts per row (the
deciding record is on disk; it pins its inputs by sha256), and writes certs/claimclaimbox-yield.json. A row's class is a reading of
the row by the author of this file, not a verdict; the table is the record of it.

usage: python3 instruments/claimbox/yield.py --write     classify, count, write certs/claimclaimbox-yield.json
       python3 instruments/claimbox/yield.py --check     re-derive and compare with the record (the battery)
MIT"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
LEDGER = os.path.join(ROOT, 'certs', 'claims-ledger.json')
TABLE = os.path.join(HERE, 'yield-table.json')
OUT = os.path.join(ROOT, 'certs', 'claimbox-yield.json')
FORMS = ('F1', 'F2', 'F3', 'F4', 'F5')
V1 = ('yes', 'feature', 'no')
PRED = ('named', 'primitive', 'reading', 'named+reading')
SHA = re.compile(r'\b[0-9a-f]{64}\b')


def die(m):
    sys.stderr.write('CLAIMBOX YIELD REFUSED: ' + m + '\n')
    sys.exit(1)


def record_path(decided_from):
    """'ledger.json (family ramanujan-audit)' -> ledger.json; otherwise the path as written"""
    return decided_from.split(' (')[0]


def derive():
    with open(LEDGER, encoding='utf-8') as f:
        ledger = json.load(f)
    with open(TABLE, encoding='utf-8') as f:
        table = json.load(f)
    rows = {r['id']: r for r in ledger['rows']}
    trows = table['rows']
    if set(rows) != set(trows):
        die('the table and the register disagree on the rows: table-only ' + str(sorted(set(trows) - set(rows))[:5]) + ', register-only ' + str(sorted(set(rows) - set(trows))[:5]))
    out_rows = []
    counts = {'form': {}, 'v1': {}, 'predicate': {}, 'verdict': {}, 'feature': {}, 'recordOnDisk': 0, 'pinned': 0}
    for rid in sorted(rows):
        r, t = rows[rid], trows[rid]
        for k in ('form', 'v1', 'predicate', 'why'):
            if k not in t:
                die(rid + ': the table row lacks ' + k)
        if t['form'] not in FORMS or t['v1'] not in V1 or t['predicate'] not in PRED:
            die(rid + ': a class outside the rule')
        if t['v1'] == 'feature' and not t.get('feature'):
            die(rid + ': "feature" names no feature')
        if t['v1'] == 'yes' and t.get('feature'):
            die(rid + ': "yes" with a feature named')
        rp = os.path.join(ROOT, record_path(r['decidedFrom']))
        on_disk = os.path.isfile(rp)
        pinned = False
        if on_disk:
            with open(rp, encoding='utf-8', errors='replace') as f:
                pinned = SHA.search(f.read()) is not None
        row = {'id': rid, 'verdict': r['verdict'], 'record': record_path(r['decidedFrom']), 'recordOnDisk': on_disk, 'pinned': pinned,
               'form': t['form'], 'v1': t['v1'], 'feature': t.get('feature'), 'predicate': t['predicate'], 'why': t['why']}
        out_rows.append(row)
        for k in ('form', 'v1', 'predicate', 'verdict'):
            counts[k][row[k]] = counts[k].get(row[k], 0) + 1
        if row['feature']:
            counts['feature'][row['feature']] = counts['feature'].get(row['feature'], 0) + 1
        counts['recordOnDisk'] += on_disk
        counts['pinned'] += pinned
    n = len(out_rows)
    yes = counts['v1'].get('yes', 0)
    return {
        'what': 'The yield measurement of the box (instruments/claimbox, version 2): every row of the register classified by the form of the claim it decided, whether the version-1 format admits it today, and the kind of predicate it would carry. The rule is in instruments/claimbox/yield.py; the classification is instruments/claimbox/yield-table.json, a reading of each row by this repository, not a verdict.',
        'register': {'path': 'certs/claims-ledger.json', 'rows': n, 'count': ledger.get('count'), 'decided': ledger.get('decided')},
        'rule': {'forms': FORMS, 'v1': V1, 'predicate': PRED, 'killSwitch': 'under half of the rows admitted as is (v1 = yes) -> publish the null and stop'},
        'counts': counts,
        'yieldAsIs': {'yes': yes, 'of': n, 'fraction': round(yes / n, 4) if n else None},
        'expressibleInForm': {'yesOrFeature': yes + counts['v1'].get('feature', 0), 'of': n},
        'primitiveExpressible': counts['predicate'].get('primitive', 0),
        'rows': out_rows,
    }


def main(argv):
    rec = derive()
    if '--check' in argv:
        if not os.path.exists(OUT):
            die('no record at ' + os.path.relpath(OUT, ROOT))
        with open(OUT, encoding='utf-8') as f:
            old = json.load(f)
        for k in ('counts', 'yieldAsIs', 'expressibleInForm', 'primitiveExpressible', 'rows', 'register'):
            if old.get(k) != rec.get(k):
                die('the record differs from the re-derivation at ' + k)
        print('claimbox yield --check: ' + str(rec['yieldAsIs']['yes']) + '/' + str(rec['yieldAsIs']['of']) + ' admitted as is, ' + str(rec['expressibleInForm']['yesOrFeature']) + ' expressible in form, ' + str(rec['primitiveExpressible']) + ' primitive — identical to the record')
        return 0
    if '--write' in argv:
        with open(OUT, 'w', encoding='utf-8') as f:
            json.dump(rec, f, indent=1, ensure_ascii=False)
            f.write('\n')
        print('certs/claimclaimbox-yield.json written: ' + json.dumps({'yieldAsIs': rec['yieldAsIs'], 'v1': rec['counts']['v1'], 'form': rec['counts']['form'], 'predicate': rec['counts']['predicate'], 'feature': rec['counts']['feature'], 'recordOnDisk': rec['counts']['recordOnDisk'], 'pinned': rec['counts']['pinned']}, ensure_ascii=False))
        return 0
    print(__doc__)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
