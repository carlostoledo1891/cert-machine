"""Edit the registry clone for the C_82 replay PR (T-PR5).
usage: python3 registry-pr5-edit-2026-10-19.py <clone> <c82-replay.json> <commit-sha> <date as '19 Oct 2026'> <label as T2026d>
Every replacement must match exactly once; the script refuses otherwise (the upstream text moved since the pin)."""
import json
import sys

clone, rec_path, sha, when, label = sys.argv[1:6]
R = json.load(open(rec_path))
rows = {r['id']: r for r in R['rows']}
assert all(rows[k]['verdict'] == 'CERTIFIED' and rows[k]['agree'] for k in ('pin26', 'epi26'))
assert all(c['agree'] and c['jsAsExpected'] and c['pyAsExpected'] for c in R['cases'])
short = sha[:7]
pinB, epiB = rows['pin26']['B']['js'], rows['epi26']['B']['js']
REF = ('- [%s] Toledo, Carlos. Independent replay of the [Pin26] certificate and the [Epi26] construction: Doche\'s bound $B$ decided from the '
       'pinned bytes — the exact hypotheses (integer factors, monic denominators, $\\deg A < \\deg Q$, coprimality), every root of every composed '
       'factor certified by Gershgorin\'s theorem, the integral bounded on dyadic panels — by two implementations that share no code with each other '
       'or with the claimants\' checkers; Doche\'s theorem is read and not re-derived. [Report](https://carlostoledo.co/reports/optconst-queue.html#c82) '
       '(§9); code and record at commit [`%s`](https://github.com/carlostoledo1891/cert-machine/tree/%s) (2026).' % (label, short, sha))
AI = 'The [%s] replay was prepared with AI assistance (Claude); its numbers are read from the record at the commit cited.' % label


def edit(path, subs):
    s = open(clone + '/' + path, encoding='utf-8').read()
    for a, b in subs:
        assert s.count(a) == 1, (path, a[:80], s.count(a))
        s = s.replace(a, b)
    open(clone + '/' + path, 'w', encoding='utf-8').write(s)


edit('constants/82a.md', [
    ('| 0.2535744749068227\\* | [Epi26] |', '| 0.2535744749068227 | [Epi26] |'),
    ('Asterisked: a self-archived computer-assisted result. |',
     'Independently replayed [%s]: the construction gives $B \\in [%.12f, %.12f]$, below the printed bound. |' % (label, epiB[0], epiB[1])),
    ('| 0.2534449\\* | [Pin26] |', '| 0.2534449 | [Pin26] |'),
    ('Asterisked: a self-archived computer-assisted certificate, not yet independently replayed. |',
     'Independently replayed [%s]: $B \\in [%.12f, %.12f]$, decided from the certificate\'s bytes by two implementations sharing no code with its checkers. |' % (label, pinB[0], pinB[1])),
    ('- [Pin26] Ricardo Pinho.', REF + '\n- [Pin26] Ricardo Pinho.'),
])
s = open(clone + '/constants/82a.md', encoding='utf-8').read().rstrip('\n') + '\n\n' + AI + '\n'
open(clone + '/constants/82a.md', 'w', encoding='utf-8').write(s)

s = open(clone + '/README.md', encoding='utf-8').read()
for a, b in [
    ('| Essential minimum of the Zhang-Zagier height | 0.24874 | 0.2536331090204145 (0.2534449*) |', '| Essential minimum of the Zhang-Zagier height | 0.24874 | 0.2534449 |'),
    ('**improved upper bound (unverified):** $C_{82} < 0.2534449*$ by [R. Pinho]', '**improved upper bound:** $C_{82} < 0.2534449$ by [R. Pinho]'),
]:
    assert s.count(a) == 1, ('README', a[:60], s.count(a))
    s = s.replace(a, b)
line = ('- [82](https://teorth.github.io/optimizationproblems/constants/82a.html) **independently replayed:** the certificate behind $C\\_{82} < 0.2534449$ '
        'and the Épi construction behind 0.2535744749068227 re-decided with certified roots and interval arithmetic, with no code shared with the claimants, '
        'by [C. Toledo](https://carlostoledo.co/reports/optconst-queue.html#c82), %s; asterisks removed.' % when)
lines = s.split('\n')
last = max(i for i, l in enumerate(lines) if l.startswith('- [') and '**' in l and 'teorth.github.io/optimizationproblems/constants' in l)
lines.insert(last + 1, line)
open(clone + '/README.md', 'w', encoding='utf-8').write('\n'.join(lines))
print('edited constants/82a.md and README.md')
