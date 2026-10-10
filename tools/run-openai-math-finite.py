#!/usr/bin/env python3
"""run-openai-math-finite.py — lane F of the openai/math audit: the finite cores, decided clean-room.
Writes certs/openai-math-finite.json; `--check` re-derives it and refuses on any difference.

MEMBERSHIP is corpus/openai-math/f-lane.json, fixed before any row was decided (pre-registration amendment 2).
THE DECIDERS are instruments/openaimath/finite/f<NNN>_*.py — one per row, standard library only, written from the
paper's statement before the authors' checking code was read, reading the release's own bytes from a clone at the
pin (each file's sha256 recorded). Each decider has a forge(): the published object changed by the smallest amount
that should break it, which must NOT certify; a decider whose forge certifies is not trusted and its row is REFUSED.

THE WORDS are the pre-registration's (lanes.F.words). A tier-C row (the finite object is asserted, not published in
checkable form) is NEEDS DATA from the census, with the census's pointer. A row with no decider yet is NOT YET
DECIDED — a state, never a verdict, and counted apart.

usage: python3 tools/run-openai-math-finite.py [--check] [--only F-174,F-106]"""
import glob
import importlib.util
import json
import os
import sys
import time

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
DEC = os.path.join(ROOT, 'instruments', 'openaimath', 'finite')
OUT = os.path.join(ROOT, 'certs', 'openai-math-finite.json')
sys.path.insert(0, DEC)
import _common  # noqa: E402

WORDS = ('CERTIFIED', 'REFUTED', 'REFUSED', 'NEEDS DATA')


def decider_for(row_id):
    stem = 'f' + row_id.split('-')[1].lower()
    hits = sorted(glob.glob(os.path.join(DEC, stem + '_*.py')))
    return hits[0] if len(hits) == 1 else (None if not hits else 'AMBIGUOUS')


def load(path):
    spec = importlib.util.spec_from_file_location(os.path.basename(path)[:-3], path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run_row(row):
    base = {'id': row['id'], 'index': row['index'], 'family': row['family'], 'title': row['title'], 'tier': row['tier'],
            'dir': row['dir'], 'leanChallenges': row.get('leanChallenges') or []}
    if row['tier'] == 'C':
        return dict(base, word='NEEDS DATA', why=row['published'], decider=None)
    path = decider_for(row['id'])
    if path is None:
        return dict(base, word='NOT YET DECIDED', why='no decider written yet', decider=None)
    if path == 'AMBIGUOUS':
        return dict(base, word='REFUSED', why='two decider files claim this row', decider=None)
    mod = load(path)
    t = time.time()
    res = mod.decide()
    secs = time.time() - t
    forges = mod.forge()
    bad = [d for d, v in forges if v == 'CERTIFIED']
    word = res['verdict']
    why = res.get('decides', '')
    if word not in WORDS:
        word, why = 'REFUSED', 'the decider returned an unknown word %r' % res['verdict']
    if bad:
        word, why = 'REFUSED', 'a forge certified, so the decider is not trusted: ' + '; '.join(bad)
    if len(forges) < 2:
        word, why = 'REFUSED', 'fewer than two forges'
    return dict(base, word=word, why=why, decider=os.path.relpath(path, ROOT), decides=res.get('decides'), value=res.get('value'),
                checks=res['checks'], sources=res['sources'], forges=[{'forge': d, 'verdict': v} for d, v in forges],
                seconds=round(secs, 1))


def main():
    check_mode = '--check' in sys.argv
    only = None
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    _common.check_clone()
    lane = json.load(open(os.path.join(ROOT, 'corpus', 'openai-math', 'f-lane.json')))
    prev = json.load(open(OUT)) if os.path.exists(OUT) else None
    prev_rows = {r['id']: r for r in (prev or {}).get('rows', [])}
    rows = []
    for row in lane['rows']:
        if only and row['id'] not in only:
            if row['id'] in prev_rows:
                rows.append(prev_rows[row['id']])
                continue
        r = run_row(row)
        rows.append(r)
        print('%-8s %-16s %s' % (r['id'], r['word'], r['title'][:70] + ('' if r['word'] in ('NEEDS DATA', 'NOT YET DECIDED') else '  (%ss)' % r.get('seconds'))))
    tally = {}
    for r in rows:
        tally[r['word']] = tally.get(r['word'], 0) + 1
    rec = {
        'what': 'Lane F of the openai/math audit: every finite core named by the census (corpus/openai-math/f-lane.json, fixed before any decision), decided by a clean-room exact decider written here from the paper\'s statement, reading the release\'s own bytes at the pin. CERTIFIED means the published object has the claimed property, decided by our code; each row\'s `decides` says whether that is the whole headline or a finite component of an argument whose analytic parts are not decided here.',
        'release': _common.PIN,
        'membership': {'rows': len(lane['rows']), 'manuscripts': lane['counts']['manuscripts'], 'tiers': lane['counts']['tiers']},
        'counts': tally,
        'rows': rows,
    }
    if check_mode:
        if not prev:
            raise SystemExit('LANE F CHECK REFUSED: no ledger to check')
        a = {r['id']: (r['word'], json.dumps(r.get('sources'), sort_keys=True), json.dumps([c['pass'] for c in r.get('checks', [])])) for r in prev['rows']}
        b = {r['id']: (r['word'], json.dumps(r.get('sources'), sort_keys=True), json.dumps([c['pass'] for c in r.get('checks', [])])) for r in rows}
        diff = [k for k in set(a) | set(b) if a.get(k) != b.get(k)]
        if diff:
            raise SystemExit('LANE F CHECK REFUSED: rows differ on re-derivation: ' + ', '.join(sorted(diff)))
        print('lane F re-derived: %d rows, identical' % len(rows))
        return
    sys.path.insert(0, os.path.join(ROOT, 'tools'))
    with open(OUT, 'w') as f:
        json.dump(rec, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print('certs/openai-math-finite.json: %s' % json.dumps(tally))


if __name__ == '__main__':
    main()
