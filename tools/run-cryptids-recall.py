#!/usr/bin/env python3
"""run-cryptids-recall.py — metric M4 of the cryptids benchmark for ARM H: the twelve pre-registered plants
(notes/cryptids-benchmark-preregistration-2026-10-23.md), each applied to a COPY of the lifted corpus, arm H run on the
copy in quick mode, and the words compared with the unplanted record. A catch is a row whose word changed, or a new
refusal that names the planted file. Plant 12 (a trailing comment in machine.txt) must change nothing: it is the
green control. Writes certs/cryptids-recall-h.json.

     python3 tools/run-cryptids-recall.py [--out certs/cryptids-recall-h.json]                                 MIT"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CORPUS = os.path.join(ROOT, 'corpus', 'cryptids')
LANE = os.path.join(ROOT, 'tools', 'run-cryptids.py')
A = sys.argv[1:]
OUT = A[A.index('--out') + 1] if '--out' in A else os.path.join(ROOT, 'certs', 'cryptids-recall-h.json')


def lane(corpus, out):
    subprocess.run([sys.executable, LANE, '--quick', '--corpus', corpus, '--out', out], check=True, capture_output=True)
    with open(out, encoding='utf-8') as f:
        return {r['id']: r for r in json.load(f)['rows']}


def edit(root, rel, fn):
    p = os.path.join(root, rel)
    with open(p, encoding='utf-8') as f:
        s = f.read()
    s2 = fn(s)
    assert s2 != s, 'the plant did not change ' + rel
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s2)


def flip_cell(s):
    # the first non-halting cell of the first row: flip its write bit
    lines = s.split('\n')
    for i, line in enumerate(lines):
        body = line.split('#')[0].strip()
        if body:
            cells = body.split()
            c = cells[0]
            cells[0] = ('1' if c[0] == '0' else '0') + c[1:]
            lines[i] = ' '.join(cells)
            return '\n'.join(lines)
    raise AssertionError


PLANTS = [
    ('01-cell-edited', 'artifacts/zf_380/machine.txt', flip_cell, 'one cell of a candidate table edited (the write bit of the first cell)'),
    ('02-source-byte', 'baselines/sources/riemann_120_shunia.tm', lambda s: s.replace('0 0 1 R 1\n', '0 0 0 R 1\n', 1), 'one byte of an upstream source edited (the first transition writes 0 instead of 1)'),
    ('03-readme-states', 'artifacts/riemann_95/README.md', lambda s: s.replace('**95 states**', '**96 states**', 1), 'a README state count +1'),
    ('04-readme-steps', 'artifacts/riemann_95/README.md', lambda s: s.replace('3,634-step initializer', '3,635-step initializer', 1), 'a README step count +1'),
    ('05-readme-checkpoint-state', 'artifacts/riemann_95/README.md', lambda s: s.replace('reaches state 15 at head position -4', 'reaches state 16 at head position -4', 1), 'a checkpoint state changed in the README'),
    ('06-provenance-sha', 'baselines/PROVENANCE.md', lambda s: re.sub(r'3b8934a193ecb165a64dbf048332961fc7a62e7381e69095340a9a85d752380c', '3b8934a193ecb165a64dbf048332961fc7a62e7381e69095340a9a85d752380d', s, count=1), 'a sha256 in PROVENANCE.md edited (the last hex digit of the Goldbach source digest)'),
    ('07-embed-entry', 'artifacts/goldbach_21/README.md', lambda s: s.replace('`embed 8 = 9`', '`embed 8 = 10`', 1), 'one entry of the Goldbach embed map changed in the README'),
    ('08-halt-moved', 'artifacts/riemann_95/machine.txt', lambda s: move_halt(s), 'the halting cell of riemann_95 moved to another row'),
    ('09-rows-swapped', 'artifacts/riemann_104/machine.txt', lambda s: swap_rows(s, 5, 6), 'two rows of a candidate table swapped'),
    ('10-proof-file', 'Cryptids/Zf380.lean', lambda s: s + '\n-- planted\n', 'a proof file\'s bytes edited (what verify.py records but never compares)'),
    ('11-theorem-removed', 'comparator/all.json', lambda s: s.replace('    "ConjectureMachines.Riemann95.candidate_equivalent",\n', '', 1), 'a theorem name removed from comparator/all.json'),
    ('12-comment-added', 'artifacts/goldbach_21/machine.txt', lambda s: s + '# a trailing comment, which changes nothing\n', 'a trailing comment added to machine.txt — the green control: nothing may flip'),
]


def move_halt(s):
    lines = s.split('\n')
    # row 61 "<cell> ---" → row 61 gets a real cell, row 60 gets the halt
    assert lines[61].split()[1] == '---', lines[61]
    a = lines[61].split()
    b = lines[60].split()
    lines[61] = a[0] + ' ' + b[1]
    lines[60] = b[0] + ' ---'
    return '\n'.join(lines)


def swap_rows(s, i, j):
    lines = s.split('\n')
    lines[i], lines[j] = lines[j], lines[i]
    return '\n'.join(lines)


T0 = time.time()
tmp = tempfile.mkdtemp(prefix='cryptids-recall-')
base = lane(CORPUS, os.path.join(tmp, 'base.json'))
results = []
for pid, rel, fn, what in PLANTS:
    d = os.path.join(tmp, pid)
    shutil.copytree(CORPUS, d)
    edit(d, rel, fn)
    try:
        got = lane(d, os.path.join(tmp, pid + '.json'))
        changed = []
        for rid, r in got.items():
            b = base.get(rid)
            if b is None:
                changed.append({'row': rid, 'from': None, 'to': r['verdict']})
            elif b['verdict'] != r['verdict']:
                changed.append({'row': rid, 'from': b['verdict'], 'to': r['verdict'], 'witness': r.get('witness')})
        for rid in base:
            if rid not in got:
                changed.append({'row': rid, 'from': base[rid]['verdict'], 'to': None})
        crashed = None
    except subprocess.CalledProcessError as e:
        changed, crashed = [], (e.stderr or b'').decode('utf-8', 'replace').strip().split('\n')[-1][:200]
    green = pid.startswith('12-')
    caught = bool(changed) or (crashed is not None)
    results.append({'plant': pid, 'file': rel, 'what': what, 'changed': changed, 'crashed': crashed,
                    'caught': caught, 'expected': 'no change' if green else 'a change', 'ok': (not caught) if green else caught})
    print(('  ok   ' if results[-1]['ok'] else '  MISS ') + pid.ljust(28) + (str(len(changed)) + ' word(s) moved' if changed else ('crashed: ' + crashed if crashed else 'nothing moved')))
shutil.rmtree(tmp, ignore_errors=True)
rec = {'what': 'metric M4 of the cryptids benchmark for arm H: twelve pre-registered plants in copies of the lifted corpus, the quick lane run on each, the words compared with the unplanted record; plant 12 is the green control',
       'preregistration': 'notes/cryptids-benchmark-preregistration-2026-10-23.md', 'lane': 'tools/run-cryptids.py --quick',
       'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'seconds': round(time.time() - T0, 1),
       'plants': len(PLANTS), 'caught': sum(1 for r in results if r['caught'] and not r['plant'].startswith('12-')),
       'of': sum(1 for r in results if not r['plant'].startswith('12-')), 'green_control_quiet': all(not r['caught'] for r in results if r['plant'].startswith('12-')),
       'results': results}
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(rec, f, indent=1, ensure_ascii=False)
    f.write('\n')
print('arm H recall: ' + str(rec['caught']) + ' of ' + str(rec['of']) + ' plants caught; green control ' + ('quiet' if rec['green_control_quiet'] else 'TRIPPED') + ' → ' + os.path.relpath(OUT, ROOT))
