#!/usr/bin/env python3
"""lambda5-figs.py — the one figure of the lambda(5) pre-paper, drawn from the records
(never from a page): paper/tex/fig/lambda5-landscape.pdf — the certified lambda landscape,
n = 2..17. Proved values at n = 2..5 are read from certs/lambda4-campaign.json (lambda(2)
exact, lambda(3)) and certs/lambda56-campaign.json (lambda(4), lambda(5)); the upper
bounds at n = 6..17 from certs/lambda-table.json, deepest box per n. A proved value is a
filled mark, an upper bound a hollow one, so the two are never told apart by colour alone.
Needs matplotlib (instruments/hseva/.venv has it).
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/lambda5-figs.py          MIT"""
import json
import os
from fractions import Fraction

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'paper', 'tex', 'fig')
os.makedirs(OUT, exist_ok=True)


def J(rel):
    with open(os.path.join(ROOT, rel), 'r', encoding='utf-8') as f:
        return json.load(f)


def refuse(msg):
    raise SystemExit('LAMBDA5 FIGURE REFUSED: ' + msg)


# the validated palette the other papers' figures use (dataviz skill, light surface):
# blue and orange clear every all-pairs check; grey is context only, never a series
C = {'blue': '#2a78d6', 'orange': '#eb6834', 'grey': '#9a9a96', 'light': '#d9d9d6', 'ink': '#0b0b0b', 'ink2': '#52514e'}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b', 'pdf.fonttype': 42})

R4 = J('certs/lambda4-campaign.json')
R56 = J('certs/lambda56-campaign.json')
LT = J('certs/lambda-table.json')

# lambda = -L; a proved value is drawn at the lower end of its enclosure (the two ends agree to 1e-15)
def lam(enc):
    return -float(Fraction(enc['hi']))

if R4['targets'].get('L2exact') != '-9/8':
    refuse('lambda(2) = 9/8 is no longer exact in the lambda(4) record')
proved = [(2, 9 / 8), (3, lam(R4['targets']['L3'])), (4, lam(R56['stages']['targets']['L4'])), (5, lam(R56['stages']['targets']['L5']))]
if not all(s['ok'] for s in R56['stages'].values()):
    refuse('a campaign stage is not ok')

best = {}
for k, r in LT['rows'].items():
    if r['n'] not in best or r['M'] > best[r['n']]['M']:
        best[r['n']] = r
bounds = [(n, best[n]['optimiser']['lambda'][1], best[n]['M']) for n in sorted(best) if n >= 6]
if [b[0] for b in bounds] != list(range(6, 18)):
    refuse('the lambda table no longer runs n = 6..17')
if best[6]['optimiser']['A'] != [1, 2, 4, 6, 7, 8]:
    refuse('the n = 6 box optimiser is no longer the witness set')
# the descent must be visible in the data the figure draws
if not bounds[0][1] < proved[-1][1]:
    refuse('the n = 6 bound no longer lies below lambda(5)')

fig, ax = plt.subplots(figsize=(5.6, 2.7))
ax.plot([p[0] for p in proved], [p[1] for p in proved], color=C['blue'], lw=1.0, zorder=2)
ax.scatter([p[0] for p in proved], [p[1] for p in proved], s=28, facecolor=C['blue'], edgecolor=C['blue'], lw=1.0, zorder=3)
ax.scatter([b[0] for b in bounds], [b[1] for b in bounds], s=30, marker='s', facecolor='white', edgecolor=C['orange'], lw=1.2, zorder=3)
for n, v, M in bounds:
    ax.annotate('M=%d' % M, (n, v), xytext=(0, 7), textcoords='offset points', ha='center', fontsize=5.5, color=C['ink2'])
ax.annotate(r'$\lambda(5)$ proved', (5, proved[-1][1]), xytext=(-6, 9), textcoords='offset points', ha='right', fontsize=7, color=C['ink'])
ax.annotate(r'$\lambda(6)\leq$ witness', (6, bounds[0][1]), xytext=(4, -12), textcoords='offset points', ha='left', fontsize=7, color=C['ink'])
ax.set_xlim(1.4, 17.6)
ax.set_xticks(range(2, 18))
ax.set_ylim(1.0, 2.75)
ax.set_xlabel(r'$n$ (number of terms)')
ax.set_ylabel(r'$\lambda(n)$')
ax.grid(axis='y', color=C['light'], lw=0.4)
ax.set_axisbelow(True)
for s in ('top', 'right'):
    ax.spines[s].set_visible(False)
ax.legend(handles=[Line2D([], [], marker='o', color=C['blue'], lw=1.0, markersize=5, label='proved value (exact enclosure, width below $10^{-15}$)'),
                   Line2D([], [], marker='s', color='none', markeredgecolor=C['orange'], markerfacecolor='white', markersize=5.5, markeredgewidth=1.2,
                          label='upper bound: box sweep, every $n$-subset of $\\{1,\\dots,M\\}$ decided')],
          loc='lower right', frameon=False, fontsize=6.5, handlelength=1.4)
fig.tight_layout(pad=0.4)
fig.savefig(os.path.join(OUT, 'lambda5-landscape.pdf'))
print('wrote paper/tex/fig/lambda5-landscape.pdf')
