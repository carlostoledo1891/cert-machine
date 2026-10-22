"""Edit the registry clone for the C_31 replay PR (T-PR6): the two asterisked upper-bound rows of constants/31a.md, the README's
table cell and its Recent-progress line. Every number is read from certs/lueker-replay.json; the script refuses unless both rows
are CERTIFIED there and the calibration reproduces Lueker's table.
usage: python3 registry-pr6-edit-2026-10-22.py <clone> <lueker-replay.json> <commit-sha> <date as '23 Oct 2026'> <label as T2026e>
Every replacement must match exactly once; the script refuses otherwise (the upstream text moved since the pin)."""
import json
import sys

clone, rec_path, sha, when, label = sys.argv[1:6]
R = json.load(open(rec_path))
rows = {r['h']: r for r in R['rows']}
assert set(rows) == {9, 10}, sorted(rows)
assert all(r['verdict'] == 'CERTIFIED' and r['statesAgree'] and r['claimantLambdaAboveOurLowerBound'] and r['sample']['mismatches'] == 0 for r in rows.values())
assert all(c['reproduced'] for c in R['calibration']) and len(R['calibration']) == 7
assert all(c['fired'] for c in R['redControls'])
short = sha[:7]


# Every digit string below is read from the record's own outward-rounded fields (tools/run-lueker.py, dec_up / dec_down):
# an upper bound rounded UP at its last place, a lower bound rounded DOWN. A truncated upper bound would sit below the value.
lam = {h: rows[h]['lambdaCertUp'] for h in (9, 10)}      # λ_cert at 15 places, rounded up
rho = {h: rows[h]['rhoLowerDown'] for h in (9, 10)}      # the certified lower bound on ρ at 15 places, rounded down
bnd = {h: rows[h]['boundUp'] for h in (9, 10)}           # the bound's upper end at 10 places, rounded up
REF = ('- [%s] Toledo, Carlos. Independent replay of the [J2026] bounds: Lueker\'s automaton $M_h$ rebuilt from [L2009] alone (Figure 7 and eq. (36)), '
       'in two implementations that share no code with each other or with [J2026]; calibrated on Table II of [L2009] for $h \\le 8$ (every state count, '
       'every $\\lambda$ to nine digits, every bound to six); run at $h = 9$ and $h = 10$ with witness vectors of its own, the certificate $A_z v \\le \\lambda v$ '
       'decided with the rounding mode set upward and the bound evaluated outward: $\\lambda(0.3298) \\le %s$ at $h = 9$ ($\\gamma_2 \\le %s$), '
       '$\\lambda(0.3376) \\le %s$ at $h = 10$ ($\\gamma_2 \\le %s$), the same state counts as [J2026], and a certified lower bound on the spectral radius '
       '($%s$ and $%s$) below which no certificate can lie. [Report](https://carlostoledo.co/reports/chvatal-sankoff.html); code and record at commit '
       '[`%s`](https://github.com/carlostoledo1891/cert-machine/tree/%s) (2026).'
       % (label, lam[9], bnd[9], lam[10], bnd[10], rho[9], rho[10], short, sha))
AI = 'The [%s] replay was prepared with AI assistance (Claude); its numbers are read from the record at the commit cited.' % label


def edit(path, subs):
    s = open(clone + '/' + path, encoding='utf-8').read()
    for a, b in subs:
        assert s.count(a) == 1, (path, a[:80], s.count(a))
        s = s.replace(a, b)
    open(clone + '/' + path, 'w', encoding='utf-8').write(s)


edit('constants/31a.md', [
    ('| $0.825101$* | [J2026] |', '| $0.825101$ | [J2026] |'),
    ('The same code reproduces Table II of [L2009] for $h\\le 8$. |',
     'The same code reproduces Table II of [L2009] for $h\\le 8$. Independently replayed [%s]: an automaton built from [L2009] alone gives %s states and '
     '$\\lambda(z) \\le %s$, hence $\\gamma_2 \\le %s$. |' % (label, format(rows[9]['states'], ','), lam[9], bnd[9])),
    ('| $0.824120$* | [J2026] |', '| $0.824120$ | [J2026] |'),
    ('certified $\\lambda(z)\\le 0.385532705434511$. |',
     'certified $\\lambda(z)\\le 0.385532705434511$. Independently replayed [%s]: %s states and $\\lambda(z) \\le %s$, hence $\\gamma_2 \\le %s$. |'
     % (label, format(rows[10]['states'], ','), lam[10], bnd[10])),
    ('- [J2026] Jack, Leandre.', REF + '\n- [J2026] Jack, Leandre.'),
])
s = open(clone + '/constants/31a.md', encoding='utf-8').read().rstrip('\n') + '\n\n' + AI + '\n'
open(clone + '/constants/31a.md', 'w', encoding='utf-8').write(s)

s = open(clone + '/README.md', encoding='utf-8').read()
for a, b in [
    ('| Chvátal–Sankoff constant for a binary alphabet | 0.792665992 (0.79970*) | 0.826280 (0.824120*) |',
     '| Chvátal–Sankoff constant for a binary alphabet | 0.792665992 (0.79970*) | 0.824120 |'),
    ('**improved upper bound (unverified):** $C_{31} \\leq 0.824120*$ by [L. Jack]', '**improved upper bound:** $C_{31} \\leq 0.824120$ by [L. Jack]'),
]:
    assert s.count(a) == 1, ('README', a[:60], s.count(a))
    s = s.replace(a, b)
line = ('- [31](https://teorth.github.io/optimizationproblems/constants/31a.html) **independently replayed:** the $h = 9$ and $h = 10$ bounds of [L. Jack] '
        're-derived with an automaton built from Lueker\'s paper alone, calibrated on his Table II, certified with witness vectors of its own under '
        'directed rounding, by [C. Toledo](https://carlostoledo.co/reports/chvatal-sankoff.html), %s; asterisks removed.' % when)
lines = s.split('\n')
own = [i for i, l in enumerate(lines) if l.startswith('- [') and 'constants/31a.html) **improved upper bound' in l]
assert len(own) == 1, ('the Recent-progress line for this constant is not unique', len(own))
lines.insert(own[0] + 1, line)
open(clone + '/README.md', 'w', encoding='utf-8').write('\n'.join(lines))
print('edited constants/31a.md and README.md')
