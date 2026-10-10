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

# Pre-registration amendment 5: a row is CERTIFIED only when the WHOLE finite certificate its paper states is decided.
# A decider that decides part of it and leaves part undone for cost makes the row REFUSED — the decided parts stay as
# checks, the undecided part and its cost are named here. One list, so the rule cannot be applied twice two ways.
PARTIAL = {
    'F-180': 'the two-dimensional sweeps that carry 2g_d(x) >= K and the negative-part bound (the outer primitive grid, ~7.9e6 interval evaluations; the negative-part grid; L1-L4 over ~4.2e5 rectangles; ~2.45e6 Hessian cells) are not decided here — estimated 20-40 CPU-minutes in standard-library Python plus f0 and e with two derivatives on [b, l]; the coefficients, the constants and the tail signs are decided',
    'F-433': 'the product inequality (b) is decided only on C x S, S x C and C\' x C\' (about 0.4% of S x S by volume; the rest projected above 20 CPU-hours at ~5 s per cell); the scalar certificate and inequality (a) on all of S x S are decided',
    'F-435': 'the interval certificate is decided only for q <= 4/5; q > 4/5, which holds the near-uniform corner where P ~ 2e-5, is not (extending band 2 to q <= 9/10 alone took 84,610 boxes and 1,916 s); the pair certificate (all 14 polynomials) and the grid certificate (all 28 stopping iterations) are decided whole',
    'F-369': 'the base range is decided for b = 6..12 in the ledger run (b = 6..15 in a separate run of this session); b = 13..25 (estimated 8-12 CPU-hours) and the partitions outside the band at b = 26..29 (the certificate/flag pipeline, not re-implemented) are not; the band at b = 26..29 is decided whole (467,068 coefficients, none negative)',
}
ROW_ARGS = {'F-360': {'n_max': 64}}


def partial_reason(row_id, decides):
    """why a CERTIFIED row is only partly decided, or None (amendment 5)"""
    if row_id in PARTIAL:
        return PARTIAL[row_id]
    if 'NOT decided in this run' in (decides or ''):
        return 'the decider says so: ' + decides
    return None   # the full Proposition prop:finite-check: all 61 eligible degrees (about an hour)


def decider_for(row_id):
    stem = 'f' + row_id.split('-')[1].lower()
    hits = sorted(glob.glob(os.path.join(DEC, stem + '_*.py')))
    return hits[0] if len(hits) == 1 else (None if not hits else 'AMBIGUOUS')


def load(path):
    spec = importlib.util.spec_from_file_location(os.path.basename(path)[:-3], path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod            # a decider's worker pool pickles its functions by module name
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
    res = mod.decide(**ROW_ARGS.get(row['id'], {}))
    secs = time.time() - t
    forges = [(f[0], f[1]) for f in mod.forge()]   # a forge row is (description, verdict, ...detail)
    bad = [d for d, v in forges if v == 'CERTIFIED']
    word = res['verdict']
    why = res.get('decides', '')
    if word not in WORDS:
        word, why = 'REFUSED', 'the decider returned an unknown word %r' % res['verdict']
    if bad:
        word, why = 'REFUSED', 'a forge certified, so the decider is not trusted: ' + '; '.join(bad)
    if len(forges) < 2:
        word, why = 'REFUSED', 'fewer than two forges'
    if word == 'CERTIFIED' and partial_reason(row['id'], res.get('decides')):
        word, why = 'REFUSED', 'decided in part (pre-registration amendment 5): ' + partial_reason(row['id'], res.get('decides'))
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
    if '--apply-rules' in sys.argv:
        led = json.load(open(OUT))
        for r in led['rows']:
            if r.get('word') == 'CERTIFIED' and partial_reason(r['id'], r.get('decides')):
                r['word'], r['why'] = 'REFUSED', 'decided in part (pre-registration amendment 5): ' + partial_reason(r['id'], r.get('decides'))
        tally = {}
        for r in led['rows']:
            tally[r['word']] = tally.get(r['word'], 0) + 1
        led['counts'] = tally
        with open(OUT, 'w') as f:
            json.dump(led, f, indent=1, ensure_ascii=False)
            f.write('\n')
        print('rules applied: %s' % json.dumps(tally))
        return
    prev = json.load(open(OUT)) if os.path.exists(OUT) else None
    prev_rows = {r['id']: r for r in (prev or {}).get('rows', [])}
    def record(rows_now):
        tally = {}
        for r in rows_now:
            tally[r['word']] = tally.get(r['word'], 0) + 1
        return {
            'what': 'Lane F of the openai/math audit: every finite core named by the census (corpus/openai-math/f-lane.json, fixed before any decision), decided by a clean-room exact decider written here from the paper\'s statement, reading the release\'s own bytes at the pin. CERTIFIED means the published object has the claimed property, decided by our code; each row\'s `decides` says whether that is the whole headline or a finite component of an argument whose analytic parts are not decided here.',
            'release': _common.PIN,
            'membership': {'rows': len(lane['rows']), 'manuscripts': lane['counts']['manuscripts'], 'tiers': lane['counts']['tiers']},
            'counts': tally,
            'rows': rows_now,
        }

    def write(rows_now):
        tmp = OUT + '.tmp'
        with open(tmp, 'w') as f:
            json.dump(record(rows_now), f, indent=1, ensure_ascii=False)
            f.write('\n')
        os.replace(tmp, OUT)

    # rows are decided in membership order; a row not selected keeps its previous record. Outside --check the
    # ledger is written after EVERY row, so a long or stalled decider never costs the rows decided before it.
    current = {row['id']: prev_rows.get(row['id']) or dict(id=row['id'], word='NOT YET DECIDED', title=row['title']) for row in lane['rows']}
    for row in lane['rows']:
        if only and row['id'] not in only:
            continue                     # keeps its previous record, or the NOT YET DECIDED placeholder
        r = run_row(row)
        current[row['id']] = r
        print('%-8s %-16s %s' % (r['id'], r['word'], r['title'][:70] + ('' if r['word'] in ('NEEDS DATA', 'NOT YET DECIDED') else '  (%ss)' % r.get('seconds'))), flush=True)
        if not check_mode and r['word'] not in ('NEEDS DATA', 'NOT YET DECIDED'):
            write([current[x['id']] for x in lane['rows']])
    rows = [current[x['id']] for x in lane['rows']]
    rec = record(rows)
    tally = rec['counts']
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
    write(rows)
    print('certs/openai-math-finite.json: %s' % json.dumps(tally))


if __name__ == '__main__':
    main()
