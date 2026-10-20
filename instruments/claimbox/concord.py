#!/usr/bin/env python3
"""instruments/claimbox/concord.py — two readers, one claim: the concord of declared claims (claimbox version 3, 2026-10-20).

THE EXPERIMENT. The ten registry-queue claims were written as claimbox objects twice: by this repository's first reader
(instruments/claimbox/claims/) and, blind, by a second reader — an AI agent given SCHEMA.md, check.py, the ten claim
sentences and the corpus, forbidden the first reader's objects, every earlier report, HANDOFF and git
(instruments/claimbox/second/claims/, the objects exactly as it wrote them). This program compares the two objects of
each claim field by field and records where they agree and where they differ. Agreement is CONSISTENCY of two readings,
never truth; a difference is a finding about the reading, to be settled by a person and recorded on the object.

THE FIELDS COMPARED, in two classes:
  decision-bearing  the domain pin's sha256; each predicate's rel, printed and exact bar c (compared as rationals);
                    the record's path, row, value path and verdict; the repair's printed and c; the reading
  declared          the source page and quote; the domain count and decoder; the predicates' kinds (holds / an
                    inequality) and the named function's definition path; hypotheses and falsifier (counted only)
Two objects AGREE on a claim when every decision-bearing field is equal. The checker's outcome on each object (both must
come out the same word and, when admitted, the same decisions) is read from check.py, never re-typed.

usage: python3 instruments/claimbox/concord.py --write     compare, write certs/claimbox-concord.json
       python3 instruments/claimbox/concord.py --check     re-derive and compare with the record (the battery)
MIT"""
import hashlib
import importlib.util
import json
import os
import sys
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
FIRST = os.path.join(HERE, 'claims')
SECOND = os.path.join(HERE, 'second', 'claims')
OUT = os.path.join(ROOT, 'certs', 'claimbox-concord.json')

spec = importlib.util.spec_from_file_location('claimboxcheck', os.path.join(HERE, 'check.py'))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)


def die(m):
    sys.stderr.write('CLAIMBOX CONCORD REFUSED: ' + m + '\n')
    sys.exit(1)


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def load(d, name):
    with open(os.path.join(d, name + '.json'), encoding='utf-8') as f:
        return json.load(f)


def rat(s):
    """a rational string compared as a value; anything else as is"""
    if isinstance(s, str) and B.RAT.match(s):
        return str(Fraction(s))
    if isinstance(s, list):
        return [rat(x) for x in s]
    return s


def bearing(o):
    preds = []
    for p in o.get('predicate', []):
        preds.append({'rel': p.get('rel'), 'printed': p.get('printed'), 'c': rat(p.get('c'))})
    r = o.get('record') or {}
    rep = o.get('repair') or {}
    return {'pin': (o.get('domain') or {}).get('pin', {}).get('sha256'), 'reading': o.get('reading'), 'predicates': preds,
            'record': {'path': r.get('path'), 'row': r.get('row'), 'value': r.get('value'), 'verdict': r.get('verdict')},
            'repair': {'printed': rep.get('printed'), 'c': rat(rep.get('c'))}}


def declared(o):
    d = o.get('domain') or {}
    where = []
    for p in o.get('predicate', []):
        g = p.get('g')
        where.append(g.get('where') if isinstance(g, dict) else 'primitive')
    return {'sourcePath': (o.get('source') or {}).get('path'), 'quote': (o.get('source') or {}).get('quote'), 'count': d.get('count'),
            'decoder': d.get('decoder'), 'kinds': [('holds' if p.get('rel') == 'holds' else 'inequality') for p in o.get('predicate', [])], 'where': where,
            'hypotheses': len(o.get('hypotheses') or []), 'falsifier': len(o.get('falsifier') or [])}


def diff(a, b, prefix=''):
    out = []
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            out += diff(a.get(k), b.get(k), prefix + '.' + k if prefix else k)
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            out.append({'field': prefix + '.length', 'first': len(a), 'second': len(b)})
        for i, (x, y) in enumerate(zip(a, b)):
            out += diff(x, y, prefix + '[' + str(i) + ']')
    elif a != b:
        out.append({'field': prefix, 'first': a, 'second': b})
    return out


def derive():
    B.WORDS = B.load_vocab()
    if not os.path.isdir(SECOND):
        die('no second reading at ' + os.path.relpath(SECOND, ROOT))
    ids = sorted(os.path.splitext(f)[0] for f in os.listdir(FIRST) if f.endswith('.json'))
    ids2 = sorted(os.path.splitext(f)[0] for f in os.listdir(SECOND) if f.endswith('.json'))
    if ids != ids2:
        die('the two readers did not write the same ids: first ' + str(ids) + ' second ' + str(ids2))
    rows = []
    for i in ids:
        o1, o2 = load(FIRST, i), load(SECOND, i)
        r1, r2 = B.check(os.path.join(FIRST, i + '.json')), B.check(os.path.join(SECOND, i + '.json'))
        bd = diff(bearing(o1), bearing(o2))
        dd = diff(declared(o1), declared(o2))
        rows.append({'id': i, 'firstSha256': sha(os.path.join(FIRST, i + '.json')), 'secondSha256': sha(os.path.join(SECOND, i + '.json')),
                     'outcome': {'first': [r1['word'], r1['kind'], r1['decided']], 'second': [r2['word'], r2['kind'], r2['decided']],
                                 'same': (r1['word'], r1['kind'], r1['decided']) == (r2['word'], r2['kind'], r2['decided'])},
                     'bearingAgrees': not bd, 'bearingDiffs': bd, 'declaredDiffs': dd})
    return {
        'what': 'The concord of two readers on the ten registry-queue claims (instruments/claimbox/claims vs instruments/claimbox/second/claims): decision-bearing fields compared exactly, declared fields listed; agreement is consistency of two readings, not truth.',
        'secondReader': 'an AI agent (Claude), blind to the first reader\'s objects, every earlier report, HANDOFF and git; the brief is in HANDOFF (2026-10-20); the objects are kept exactly as it wrote them',
        'claims': len(ids), 'bearingAgree': sum(1 for r in rows if r['bearingAgrees']), 'sameOutcome': sum(1 for r in rows if r['outcome']['same']),
        'declaredDiffFields': sorted(set(d['field'].split('[')[0] for r in rows for d in r['declaredDiffs'])),
        'rows': rows,
    }


def main(argv):
    rec = derive()
    if '--check' in argv:
        if not os.path.exists(OUT):
            die('no record')
        with open(OUT, encoding='utf-8') as f:
            old = json.load(f)
        for k in ('claims', 'bearingAgree', 'sameOutcome', 'declaredDiffFields', 'rows'):
            if old.get(k) != rec.get(k):
                die('the record differs from the re-derivation at ' + k)
        print('claimbox concord --check: ' + str(rec['bearingAgree']) + '/' + str(rec['claims']) + ' agree on every decision-bearing field, ' + str(rec['sameOutcome']) + ' same outcome — identical to the record')
        return 0
    if '--write' in argv:
        with open(OUT, 'w', encoding='utf-8') as f:
            json.dump(rec, f, indent=1, ensure_ascii=False)
            f.write('\n')
        print('certs/claimbox-concord.json written: ' + str(rec['bearingAgree']) + '/' + str(rec['claims']) + ' agree on the decision-bearing fields; same outcome ' + str(rec['sameOutcome']) + '; declared fields that differ somewhere: ' + ', '.join(rec['declaredDiffFields']))
        for r in rec['rows']:
            if r['bearingDiffs']:
                print('  ' + r['id'] + ': ' + '; '.join(d['field'] + ' first=' + json.dumps(d['first'], ensure_ascii=False)[:60] + ' second=' + json.dumps(d['second'], ensure_ascii=False)[:60] for d in r['bearingDiffs']))
        return 0
    print(__doc__)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
