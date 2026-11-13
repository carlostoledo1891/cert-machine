#!/usr/bin/env python3
"""Step 5 (PREREGISTRATION.md, amendment A1) — OUR comparison of a run's 262 fresh values with the Lean literals.

Reads (i) a coverage record written by the package's finish/coverage step (a list `bounds` of
{side, field, value, ...}), and (ii) formal/TrialData182.lean and formal/SourceData182.lean from a checkout of
romyar1/prime-gaps-lean at b77bf175. It never reads the record's own `target` or `pass_` fields.

A row passes when, as exact fractions: a lower bound is >= the Lean literal, an upper bound is <= it, and it is >= 0.
The record's row for a source bound carries (side, index, group, kind, bin, field); the script re-derives
(group, kind, bin) from the Lean row at that index and requires them equal, so a value compared with the wrong row
is a failure, not a pass. Every one of the 5 + 120 + 137 Lean bounds must be met exactly once.

Standard library only. Exit 0 = PASS on all 262; exit 1 = a failure, each named.

  compare182.py --coverage fresh/coverage.json --lean /root/s/src/prime-gaps-lean/formal [--published published/coverage.json]
  compare182.py ... --tighten outer:17:rootUpper     red control: that Lean literal is replaced by value/2 (must FAIL)
  compare182.py ... --drop 200                       red control: that row of the record is removed (must FAIL)
"""
import argparse, hashlib, json, re, subprocess, sys
from fractions import Fraction as Q
from pathlib import Path

BLOBS = {  # git blob ids at b77bf175 (the pre-registration's pins)
    'TrialData182.lean': '9caf00df6ae7267602395ab8659a1a566f385443',
    'SourceData182.lean': '45d4b55d8a5781a300d07d0a4d198aef68eb651d',
}
CAPS = [('trialDenominatorLower', 'lower'), ('trialDenominatorUpper', 'upper'), ('trialJ0Lower', 'lower'),
        ('trialJPlusLower', 'lower'), ('trialTailUpper', 'upper')]
RAT = r'(\(-?\d+ / \d+\)|-?\d+)'


def blob_id(data):
    return hashlib.sha1(b'blob %d\0' % len(data) + data).hexdigest()


def rat(text):
    return Q(text.strip('()').replace(' ', ''))


def field(row, name):
    m = re.search(r'\b' + name + r'\s*:=\s*' + RAT, row)
    if not m:
        raise SystemExit('Lean row has no rational field ' + name)
    return rat(m.group(1))


def lean_targets(lean_dir):
    out, hashes = {}, {}
    for name in BLOBS:
        data = (Path(lean_dir) / name).read_bytes()
        hashes[name] = blob_id(data)
        if hashes[name] != BLOBS[name]:
            raise SystemExit('%s is not the pinned file: blob %s, wanted %s' % (name, hashes[name], BLOBS[name]))
    trial = (Path(lean_dir) / 'TrialData182.lean').read_text()
    for name, direction in CAPS:
        lines = [x for x in trial.splitlines() if x.startswith('def ' + name + ' ')]
        if len(lines) != 1:
            raise SystemExit('cap literal %s: %d definitions' % (name, len(lines)))
        m = re.search(r':\s*ℚ\s*:=\s*' + RAT + r'\s*$', lines[0])
        if not m:
            raise SystemExit('cap literal %s: not a rational literal' % name)
        out[('cap', name)] = dict(limit=rat(m.group(1)), direction=direction)
    source = (Path(lean_dir) / 'SourceData182.lean').read_text()
    head, rest = source.split('def trialOuterCertificates', 1)
    outer, inner = rest.split('def trialInnerCertificates', 1)
    for side, part, want, fields in (('outer', outer, 60, ('rootUpper', 'faceUpper')), ('inner', inner, 137, ('faceUpper',))):
        rows = [x for x in part.splitlines() if '{ cover :=' in x]
        if len(rows) != want:
            raise SystemExit('%s: %d Lean rows, wanted %d' % (side, len(rows), want))
        for j, row in enumerate(rows):
            family = int(field(row, 'family'))
            kind = re.search(r'kind := \.(\w+)', row).group(1)
            key = dict(group='C' if family == 6 else 'G%d' % (family + 1), kind={'rankTwo': 'rank_two'}.get(kind, kind),
                       bin=int(field(row, 'binIndex')))
            for f in fields:
                out[(side, j, f)] = dict(limit=field(row, f), direction='upper', key=key)
    return out, hashes


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--coverage', required=True)
    p.add_argument('--lean', required=True)
    p.add_argument('--published')
    p.add_argument('--tighten')
    p.add_argument('--drop', type=int)
    p.add_argument('--output')
    a = p.parse_args()
    targets, hashes = lean_targets(a.lean)
    assert len(targets) == 262, len(targets)
    record = json.loads(Path(a.coverage).read_text())
    bounds = list(record['bounds'])
    if a.drop is not None:
        del bounds[a.drop]
    fresh = {}
    failures = []
    for i, b in enumerate(bounds):
        k = ('cap', b['field']) if b['side'] == 'cap' else (b['side'], b['index'], b['field'])
        if k in fresh:
            failures.append('row %d: %s met twice' % (i, k))
        fresh[k] = b
    if a.tighten:
        side, j, f = a.tighten.split(':')
        k = ('cap', f) if side == 'cap' else (side, int(j), f)
        t = targets[k]
        v = Q(fresh[k]['value'])
        t['limit'] = v * 2 if t['direction'] == 'lower' else v / 2
    rows = []
    for k, t in targets.items():
        b = fresh.get(k)
        if b is None:
            failures.append('%s: no fresh value' % (k,))
            continue
        v = Q(b['value'])
        ok = v >= 0 and (v >= t['limit'] if t['direction'] == 'lower' else v <= t['limit'])
        if 'key' in t:
            got = dict(group=b.get('group'), kind=b.get('kind'), bin=b.get('bin'))
            if got != t['key']:
                ok = False
                failures.append('%s: the record says %s, the Lean row says %s' % (k, got, t['key']))
        if not ok:
            failures.append('%s: fresh %s is not on the right side of the Lean literal %s (%s)' % (k, v, t['limit'], t['direction']))
        slack = (v - t['limit']) if t['direction'] == 'lower' else (t['limit'] - v)
        rows.append(dict(key=list(k), direction=t['direction'], equal=(v == t['limit']), ok=ok,
                         relative_slack=float(slack / t['limit']) if t['limit'] else None))
    extra = [k for k in fresh if k not in targets]
    for k in extra:
        failures.append('%s: a fresh row with no Lean bound' % (k,))
    if len(bounds) != 262:
        failures.append('the record has %d rows, not 262' % len(bounds))
    result = dict(verdict='PASS' if not failures else 'FAIL', lean_bounds=len(targets), fresh_rows=len(bounds),
                  passed=sum(r['ok'] for r in rows), equal_to_lean_literal=sum(r['equal'] for r in rows),
                  lean_blobs=hashes, coverage_sha256=hashlib.sha256(Path(a.coverage).read_bytes()).hexdigest(),
                  failures=failures)
    slacks = [r['relative_slack'] for r in rows if r['relative_slack'] is not None and not r['equal']]
    result['strict_rows'] = len(slacks)
    result['smallest_relative_slack_of_strict_rows'] = min(slacks) if slacks else None
    if a.published:
        pub = {}
        for b in json.loads(Path(a.published).read_text())['bounds']:
            pub[('cap', b['field']) if b['side'] == 'cap' else (b['side'], b['index'], b['field'])] = Q(b['value'])
        same = sum(1 for k, b in fresh.items() if k in pub and Q(b['value']) == pub[k])
        result['equal_to_published_value'] = same
        result['published_rows'] = len(pub)
    print(json.dumps(result, indent=1))
    if a.output:
        Path(a.output).write_text(json.dumps(dict(result, rows=rows), indent=1) + '\n')
    sys.exit(0 if not failures else 1)


if __name__ == '__main__':
    main()
