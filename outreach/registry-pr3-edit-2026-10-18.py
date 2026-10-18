"""Edit the registry clone for the 1c/1d replay PR. usage: python3 pr-1c1d.py <clone> <autocorr-replay.json> <commit-sha> <date as '18 Oct 2026'>"""
import json, sys
clone, rec_path, sha, when = sys.argv[1:5]
R = {r['id']: r for r in json.load(open(rec_path))['rows']}
c, c0, d = R['1c-rozetyp'], R['1c-rozetyp-k3072'], R['1d-cert2026']
assert c['agree'] and c['verdict'] == 'CERTIFIED' and c0['verdict'] == 'CERTIFIED' and d['verdict'] == 'REFUTED' and d['repair']['js'] == d['repair']['py'] == 'CERTIFIED'
new1d = d['repair']['claim'].split('<= ')[1]
cdec, ddec = c['js']['decimal'][:13], d['js']['decimal'][:22]
short = sha[:7]
REF = ('- [T2026] Toledo, Carlos. Independent replay of the step-function certificates for $C\\_{1c}$ [R2026] and $C\\_{1d}$ [CERT2026]: '
       'the weights as exact rationals, every lag of the autocorrelation ($C\\_{1c}$) and of the autoconvolution ($C\\_{1d}$) summed exactly, '
       'in two implementations that share no code with each other or with the certificates\' verifiers. '
       '[Report](https://carlostoledo.co/reports/optconst-queue.html#autocorr) (§7); code and record at commit '
       '[`%s`](https://github.com/carlostoledo1891/cert-machine/tree/%s) (2026).' % (short, sha))
AI = '- The [T2026] replay was prepared with AI assistance (Claude); its numbers are read from the record at the commit cited.'

def edit(path, subs):
    s = open(clone + '/' + path, encoding='utf-8').read()
    for a, b in subs:
        assert s.count(a) == 1, (path, a[:70])
        s = s.replace(a, b)
    open(clone + '/' + path, 'w', encoding='utf-8').write(s)

edit('constants/1c.md', [
  ('| $0.4103287*$ | [R2026] |', '| $0.4103287$ | [R2026] |'),
  ('= 0.41030287175\\dots$', '= %s\\dots$' % cdec[:13]),
  ('An earlier certificate with $K = 3072$ giving $0.4103021$ is kept in the same repository. |',
   'An earlier certificate with $K = 3072$ giving $0.4103021$ is kept in the same repository. Independently replayed [T2026]: both certificates give the stated values exactly ($%s\\ldots$ and $%s\\ldots$) in two implementations. |' % (c['js']['decimal'][:22], c0['js']['decimal'][:14])),
  ('- [R2026] rozetyp (GitHub).', REF + '\n- [R2026] rozetyp (GitHub).'),
])
s = open(clone + '/constants/1c.md', encoding='utf-8').read().rstrip('\n') + '\n' + AI + '\n'
open(clone + '/constants/1c.md', 'w', encoding='utf-8').write(s)

edit('constants/1d.md', [
  ('| $1.463071582607559*$ | [CERT2026] |', '| $%s$ | [CERT2026] |' % new1d),
  ('which is $1.4630715826075593\\dots$. Self-archived artifact; see the note on the asterisk below. |',
   'which is $1.4630715826075593\\dots$. Self-archived artifact. Independently replayed [T2026]: the same fraction in two implementations; it is $%s\\ldots$, above $1.463071582607559$ (the bound first printed here), so the bound is printed rounded up. |' % ddec),
  ('- **Asterisk.**  The bound carries an asterisk under the convention in the README: the $300$ values are too many to check by hand and are available only as a self-archived artifact.',
   '- **Asterisk.**  The bound carried an asterisk under the convention in the README (the $300$ values are too many to check by hand and are available only as a self-archived artifact); it was removed on the independent replay [T2026].'),
  ('- [CERT2026] Step-function certificate', REF + '\n- [CERT2026] Step-function certificate'),
])
s = open(clone + '/constants/1d.md', encoding='utf-8').read().rstrip('\n') + '\n\n## Contribution notes\n\n' + AI + '\n'
open(clone + '/constants/1d.md', 'w', encoding='utf-8').write(s)

s = open(clone + '/README.md', encoding='utf-8').read()
for a, b in [
  ('| Barnard–Steinerberger autocorrelation constant | 0.4103287* | 0.4107675 |', '| Barnard–Steinerberger autocorrelation constant | 0.4103287 | 0.4107675 |'),
  ('| Signed third autocorrelation constant | 1 | 1.463071582607559* |', '| Signed third autocorrelation constant | 1 | %s |' % new1d),
  ('**new constant; improved lower bound (unverified):** $C\\_{1c} \\geq 0.4103287*$', '**new constant; improved lower bound:** $C\\_{1c} \\geq 0.4103287$'),
  ('**new constant, improved upper bound (unverified):** $C_{1d} \\leq 1.463071582607559*$', '**new constant, improved upper bound:** $C_{1d} \\leq %s$' % new1d),
]:
    assert s.count(a) == 1, ('README', a[:60]); s = s.replace(a, b)
line = ('- [1c](https://teorth.github.io/optimizationproblems/constants/1c.html), [1d](https://teorth.github.io/optimizationproblems/constants/1d.html) **independently replayed:** '
        'the step functions behind $C\\_{1c} \\geq 0.4103287$ and $C\\_{1d} \\leq %s$ re-derived in exact rational arithmetic, with no code shared with the claimants, '
        'by [C. Toledo](https://carlostoledo.co/reports/optconst-queue.html#autocorr), %s; asterisks removed, and the $C\\_{1d}$ bound printed rounded up '
        '(its certificate\'s exact value, $%s\\ldots$, is above the $1.463071582607559$ first printed).' % (new1d, when, ddec))
lines = s.split('\n')
last = max(i for i, l in enumerate(lines) if l.startswith('- [') and '**' in l and 'teorth.github.io/optimizationproblems/constants' in l)
lines.insert(last + 1, line)
open(clone + '/README.md', 'w', encoding='utf-8').write('\n'.join(lines))
print('edited 1c.md, 1d.md, README.md at', short, '; C_1d printed as', new1d)
