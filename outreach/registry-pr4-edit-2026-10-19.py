"""Edit the registry clone for the C_86 replay PR (T-PR4).
usage: python3 registry-pr4-edit-2026-10-19.py <clone> <c86-replay.json> <commit-sha> <date as '19 Oct 2026'>
Every replacement must match exactly once; the script refuses otherwise (the upstream text moved since the pin)."""
import json
import sys

clone, rec_path, sha, when = sys.argv[1:5]
R = json.load(open(rec_path))
assert R['verdict'] == 'CERTIFIED' and R['agree'] and R['js']['verdict'] == 'CERTIFIED' and R['py']['verdict'] == 'CERTIFIED'
assert all(r['fired'] for r in R['redControls']) and R['bound']['lePrinted']
bound = R['claim'].split('<= ')[1]
dec = R['bound']['decimal'][:20]
short = sha[:7]
REF = ('- [T2026c] Toledo, Carlos. Independent replay of the [Pin26] certificate: the six finite conditions (support, irreducibility and '
       'total reality of the eleven polynomials, $\\sum b\\_Q \\deg Q < m$, $\\int \\log\\lvert Q\\rvert\\,d\\mu > 0$, $U\\_\\mu - \\sum b\\_Q \\log\\lvert Q\\rvert \\ge 0$ '
       'on the support, the bound\'s arithmetic) decided in exact rational arithmetic and outward-rounded intervals by two implementations that share no code '
       'with each other or with the certificate\'s checker; the step from the conditions to the bound is [Smi24], read and not re-derived. '
       '[Report](https://carlostoledo.co/reports/optconst-queue.html#c86) (§8); code and record at commit '
       '[`%s`](https://github.com/carlostoledo1891/cert-machine/tree/%s) (2026).' % (short, sha))
AI = 'The [T2026c] replay was prepared with AI assistance (Claude); its numbers are read from the record at the commit cited.'


def edit(path, subs):
    s = open(clone + '/' + path, encoding='utf-8').read()
    for a, b in subs:
        assert s.count(a) == 1, (path, a[:80], s.count(a))
        s = s.replace(a, b)
    open(clone + '/' + path, 'w', encoding='utf-8').write(s)


edit('constants/86a.md', [
    ('The upper bound $1.8117251$ is a computer-assisted certificate that is currently asterisked (see the table below); the best upper bound without the asterisk is $1.8216$ [SO24].',
     'The upper bound $1.8117251$ is a computer-assisted certificate [Pin26], independently replayed [T2026c] (see the table below).'),
    ('| $1.8117251$\\* | [Pin26] |', '| $1.8117251$ | [Pin26] |'),
    ('Asterisked: a self-archived computer-assisted certificate, not yet independently replayed. |',
     'Independently replayed [T2026c]: the six conditions re-decided from the certificate\'s bytes by two implementations sharing no code with its checker; '
     'the bound is $%s\\ldots$ exactly, the smallest certified margin of the support inequality $2.3 \\times 10^{-8}$. The asterisk was removed on that replay; '
     'the argument from the conditions to the bound remains [Smi24]. |' % dec),
    ('- [Pin26] Pinho, R.', REF + '\n- [Pin26] Pinho, R.'),
])
s = open(clone + '/constants/86a.md', encoding='utf-8').read().rstrip('\n') + '\n\n' + AI + '\n'
open(clone + '/constants/86a.md', 'w', encoding='utf-8').write(s)

s = open(clone + '/README.md', encoding='utf-8').read()
for a, b in [
    ('| Schur–Siegel–Smyth trace constant | 1.80203 | 1.8216 (1.8117251*) |', '| Schur–Siegel–Smyth trace constant | 1.80203 | 1.8117251 |'),
    ('**improved upper bound (unverified):** $C_{86} \\leq 1.8117251*$ by [R. Pinho]', '**improved upper bound:** $C_{86} \\leq 1.8117251$ by [R. Pinho]'),
]:
    assert s.count(a) == 1, ('README', a[:60], s.count(a))
    s = s.replace(a, b)
line = ('- [86](https://teorth.github.io/optimizationproblems/constants/86a.html) **independently replayed:** the certificate behind $C\\_{86} \\leq %s$ '
        '(a 629-cell step measure and eleven polynomials) re-decided in exact rational and interval arithmetic, with no code shared with the claimant, '
        'by [C. Toledo](https://carlostoledo.co/reports/optconst-queue.html#c86), %s; asterisk removed.' % (bound, when))
lines = s.split('\n')
last = max(i for i, l in enumerate(lines) if l.startswith('- [') and '**' in l and 'teorth.github.io/optimizationproblems/constants' in l)
lines.insert(last + 1, line)
open(clone + '/README.md', 'w', encoding='utf-8').write('\n'.join(lines))
print('edited constants/86a.md and README.md')
