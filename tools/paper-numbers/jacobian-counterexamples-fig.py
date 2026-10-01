#!/usr/bin/env python3
"""paper-numbers/jacobian-counterexamples-fig.py — the one figure of the pre-paper, drawn from the records:
   paper/tex/fig/jacobian-counterexamples-load.pdf
     (a) the number of monomials in the symbolic Jacobian that each of the eleven keller certificates cancels
         to a constant, counted by tools/verify_keller.py over certs/keller-certificate.json, grouped by lane;
     (b) the number of terms in each map of certs/polymaps-ledger.json (Gao's five maps and the three
         Markus–Yamabe objects, the latter from corpus/polymaps/maps.json), on a log axis, the PARTIAL row hatched.
   usage: instruments/hseva/.venv/bin/python tools/paper-numbers/jacobian-counterexamples-fig.py"""
import json
import os
import re
import subprocess
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import Patch  # noqa: E402

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'paper', 'tex', 'fig', 'jacobian-counterexamples-load.pdf')


def die(m):
    sys.exit('PAPER FIGURE REFUSED: ' + m)


C = json.load(open(os.path.join(ROOT, 'certs', 'keller-certificate.json')))
L = json.load(open(os.path.join(ROOT, 'certs', 'polymaps-ledger.json')))
MAPS = json.load(open(os.path.join(ROOT, 'corpus', 'polymaps', 'maps.json')))
v = subprocess.run(['python3', os.path.join(ROOT, 'tools', 'verify_keller.py'), os.path.join(ROOT, 'certs', 'keller-certificate.json')],
                   cwd=ROOT, capture_output=True, text=True)
if v.returncode != 0:
    die('the independent verifier did not pass')
monos = {m.group(1): int(m.group(2)) for m in re.finditer(r'^PASS  (keller-\d+)\s+n=\d+\s+det J == \S+ identically \(\d+x\d+ symbolic det, (\d+) monomials', v.stdout, re.M)}
if len(monos) != len(C['entries']):
    die('the verifier decided %d entries, the certificate holds %d' % (len(monos), len(C['entries'])))


def lane(e):
    if e.get('transcription') and e.get('sweep'):
        return 'reconstructed'
    if e.get('transcription'):
        return 'transcribed'
    if e.get('sweep'):
        return 'generated'
    die(e['id'] + ' belongs to no lane')


def name(e):
    if e.get('hessian'):
        return 'Meng–Yang, Hessian, $n=5$'
    if e.get('padded'):
        return 'announced map, $n=8$ (padded)'
    if lane(e) == 'transcribed':
        return 'announced map, $n=3$'
    if lane(e) == 'generated':
        return 'generated, curve degree %d' % e['sweep']['d']
    return 'Gallagher, fiber degree %d' % e['sweep']['geometricDegree']


# the three categorical slots of the validated reference palette (all-pairs safe), plus a hatch for print
COL = {'transcribed': '#2a78d6', 'reconstructed': '#eb6834', 'generated': '#1baf7a'}
HATCH = {'transcribed': '', 'reconstructed': '///', 'generated': '...'}
ORDER = ['transcribed', 'reconstructed', 'generated']
ents = sorted(C['entries'], key=lambda e: (ORDER.index(lane(e)), monos[e['id']]))

plt.rcParams.update({'font.size': 8, 'font.family': 'serif', 'axes.spines.top': False, 'axes.spines.right': False,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#0b0b0b', 'hatch.linewidth': 0.5})
fig, (a, b) = plt.subplots(1, 2, figsize=(6.6, 3.1), gridspec_kw={'width_ratios': [1.15, 1]})

ys = range(len(ents))
a.barh(list(ys), [monos[e['id']] for e in ents], color=[COL[lane(e)] for e in ents], hatch=[HATCH[lane(e)] for e in ents],
       edgecolor='white', linewidth=0.6, height=0.72)
a.set_yticks(list(ys))
a.set_yticklabels([name(e) for e in ents])
a.invert_yaxis()
a.set_xlabel('Jacobian monomials cancelled to a constant')
a.set_title('(a) the eleven certificates', loc='left', fontsize=8.5)
a.grid(axis='x', color='#e5e4e0', linewidth=0.5)
a.set_axisbelow(True)
a.legend(handles=[Patch(facecolor=COL[k], hatch=HATCH[k], edgecolor='white', label=k) for k in ORDER], frameon=False, loc='upper right', bbox_to_anchor=(1.0, 0.70), fontsize=7)

# (b) Gao's maps and the fields: total terms, log axis
rowsb = []
for r in L['rows']:
    if r['id'].startswith('gao-'):
        rowsb.append((r['id'].replace('gao-', '').upper().replace('F', '$F_').rstrip() + ('$' if 'F' in r['id'].upper() and r['id'] != 'gao-g' else ''), sum(r['terms']), r['verdict']))
fix = {'$F_4$': '$F_4$'}
rowsb = [('$G$' if n == 'G' else n, t, vd) for n, t, vd in rowsb]
for key, lab in (('X14', '$X$, $\\mathbb{R}^{14}$'), ('Phi', '$\\Phi$, $\\mathbb{C}^{11}$'), ('Xhat18', '$\\widehat X$, $\\mathbb{R}^{18}$')):
    rid = {'X14': 'chv-x14', 'Phi': 'chv-phi', 'Xhat18': 'chv-xhat18'}[key]
    vd = next(r['verdict'] for r in L['rows'] if r['id'] == rid)
    rowsb.append((lab, sum(len(c) for c in MAPS[key]['comps']), vd))
if not any(vd == 'PARTIAL' for _, _, vd in rowsb):
    die('no PARTIAL row to hatch')
yb = range(len(rowsb))
b.barh(list(yb), [t for _, t, _ in rowsb], color=['#2a78d6' if vd == 'CERTIFIED' else '#fcfcfb' for _, _, vd in rowsb],
       edgecolor=['white' if vd == 'CERTIFIED' else '#2a78d6' for _, _, vd in rowsb], hatch=['' if vd == 'CERTIFIED' else '////' for _, _, vd in rowsb],
       linewidth=0.8, height=0.72)
b.set_yticks(list(yb))
b.set_yticklabels([n for n, _, _ in rowsb])
b.invert_yaxis()
b.set_xscale('log')
b.set_xlabel('terms in the map, log scale')
b.set_title('(b) the polynomial-maps ledger', loc='left', fontsize=8.5)
b.grid(axis='x', color='#e5e4e0', linewidth=0.5)
b.set_axisbelow(True)
for y, (n, t, vd) in zip(yb, rowsb):
    b.text(t * 1.3, y, '{:,}'.format(t), va='center', fontsize=6.5, color='#52514e')
b.set_xlim(1, max(t for _, t, _ in rowsb) * 60)
b.legend(handles=[Patch(facecolor='#2a78d6', edgecolor='white', label='certified'), Patch(facecolor='#fcfcfb', edgecolor='#2a78d6', hatch='////', label='partial')],
         frameon=False, loc='lower right', fontsize=7)
fig.tight_layout(w_pad=2.5)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
fig.savefig(OUT)
print('wrote ' + os.path.relpath(OUT, ROOT))
