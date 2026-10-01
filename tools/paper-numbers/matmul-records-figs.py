#!/usr/bin/env python3
"""matmul-records-figs.py — the two figures of paper/tex/matmul-records.tex,
drawn from the records with matplotlib (never a screenshot of a page):

  paper/tex/fig/matmul-records-ranks.pdf
      every verified row of certs/strassen-certificate.json as a line from the
      naive rank n·m·p of its shape to the rank certified, the ring beside it
  paper/tex/fig/matmul-records-improvements.pdf
      the eight improvements of certs/easota-ledger.json, each an exact
      difference between two published constructions, on a log axis

One hue in two shades for the before/after pair, direct labels on every mark,
text in ink rather than in the series colour, a recessive grid.
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/matmul-records-figs.py
"""
import json, os, sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FIG = os.path.join(ROOT, 'paper', 'tex', 'fig')
os.makedirs(FIG, exist_ok=True)
J = lambda rel: json.load(open(os.path.join(ROOT, rel)))

INK, INK2, GRID = '#0b0b0b', '#52514e', '#e6e5e1'
DARK, LIGHT = '#2a78d6', '#9bbde8'          # one hue, two shades: certified / naive
plt.rcParams.update({'font.family': 'serif', 'font.size': 9, 'axes.edgecolor': INK2, 'axes.labelcolor': INK,
                     'xtick.color': INK2, 'ytick.color': INK2, 'text.color': INK, 'pdf.fonttype': 42})

def die(m):
    print('MATMUL-RECORDS FIGS REFUSED: ' + m, file=sys.stderr); sys.exit(1)

# ---------------------------------------------------------------- figure 1: the ranks
S = J('certs/strassen-certificate.json')
rows = [e for e in S['entries'] if e.get('naive') and e.get('rank')]
if len(rows) != 10: die('expected the 10 verified entries, found %d' % len(rows))
rows.sort(key=lambda e: (e['naive'], e['rank']))
RING = {'Q': 'Q', 'F2': 'F2', 'Zi': 'Z[i]'}
fig, ax = plt.subplots(figsize=(6.2, 3.6))
for i, e in enumerate(rows):
    y = len(rows) - 1 - i
    ax.plot([e['rank'], e['naive']], [y, y], color=LIGHT, lw=2, zorder=1, solid_capstyle='round')
    ax.plot(e['naive'], y, marker='o', ms=7, mfc='white', mec=DARK, mew=1.4, zorder=2, ls='none')
    ax.plot(e['rank'], y, marker='o', ms=7, mfc=DARK, mec=DARK, zorder=3, ls='none')
    ax.text(e['naive'] + 3.2, y, str(e['naive']), va='center', ha='left', fontsize=8, color=INK2)
    ax.text(e['rank'] - 3.2, y, '%d  (%s)' % (e['rank'], RING[e['ring']]), va='center', ha='right', fontsize=8, color=INK)
ax.set_yticks(range(len(rows)))
ax.set_yticklabels(['<%s>  %s' % (','.join(map(str, e['dims'])), e['id'].replace('-' + 'x'.join(map(str, e['dims'])), '')) for e in reversed(rows)], fontsize=8)
ax.set_xlim(-14, max(e['naive'] for e in rows) * 1.12)
ax.set_xlabel('rank: open circle the naive $n\\,m\\,p$, filled the rank certified')
ax.grid(axis='x', color=GRID, lw=0.6); ax.set_axisbelow(True)
for s in ('top', 'right'): ax.spines[s].set_visible(False)
ax.tick_params(axis='y', length=0)
fig.tight_layout(); fig.savefig(os.path.join(FIG, 'matmul-records-ranks.pdf'), bbox_inches='tight'); plt.close(fig)

# ---------------------------------------------------------- figure 2: the improvements
L = J('certs/easota-ledger.json')
imps = sorted(L['improvements'], key=lambda i: float(i['delta']))
if len(imps) != 8 or any(i['sign'] <= 0 for i in imps): die('expected 8 positive improvements')
PROBLEM = {'circles-rectangle': 'circles in a rectangle', 'heilbronn-convex': 'Heilbronn, convex region',
           'min-distance-ratio-2d': 'min-distance ratio, 2-D', 'erdos-minimum-overlap': 'Erdős minimum overlap',
           'edges-vs-triangles': 'edges vs triangles (score)', 'first-autocorrelation': 'first autocorrelation',
           'flat-polynomials': 'flat polynomial (enclosure gap)', 'hexagon-packing': 'hexagons in a hexagon'}
fig, ax = plt.subplots(figsize=(6.2, 3.1))
for k, i in enumerate(imps):
    d = float(i['delta'])
    ax.barh(k, d, left=1e-10, height=0.55, color=DARK, zorder=2)
    ax.text(d * 1.35, k, '%.2e' % d, va='center', ha='left', fontsize=8, color=INK)
ax.set_xscale('log'); ax.set_xlim(1e-10, 1)
ax.set_yticks(range(len(imps))); ax.set_yticklabels([PROBLEM[i['problem']] + '  over ' + i['previous'] for i in imps], fontsize=8)
ax.set_xlabel('exact improvement over the previous best (log axis)')
ax.grid(axis='x', color=GRID, lw=0.6); ax.set_axisbelow(True)
for s in ('top', 'right'): ax.spines[s].set_visible(False)
ax.tick_params(axis='y', length=0)
fig.tight_layout(); fig.savefig(os.path.join(FIG, 'matmul-records-improvements.pdf'), bbox_inches='tight'); plt.close(fig)
print('wrote paper/tex/fig/matmul-records-ranks.pdf and matmul-records-improvements.pdf')
