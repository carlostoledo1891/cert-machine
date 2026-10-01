#!/usr/bin/env python3
"""erdos852-fig.py — the one figure of the Erdős #852 pre-paper, drawn from
paper/tex/fig/erdos852-data.json, which tools/paper-numbers/erdos852.js derives
from certs/erdos852-h-records.json through instruments/erdos852h/analyse.js (the
module the report page uses, so the figure cannot disagree with the page).
Writes paper/tex/fig/erdos852-readings.pdf: (a) h(x)/log x under the two readings
of the statement, by decade; (b) the plateau bands of h/log x with c0 marked.
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/erdos852-fig.py   MIT"""
import json
import os
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIG = os.path.join(ROOT, 'paper', 'tex', 'fig')
with open(os.path.join(FIG, 'erdos852-data.json'), 'r', encoding='utf-8') as f:
    D = json.load(f)
if not D['readings'] or not D['bands']:
    sys.exit('erdos852-fig: the data file is empty — run tools/paper-numbers/erdos852.js first')

# the categorical slots of the validated palette (dataviz skill, light surface; the two-slot
# pair passes every check), a neutral for the reference line, and text in ink
BLUE, ORANGE, GREY, INK, INK2 = '#2a78d6', '#eb6834', '#9a9a96', '#0b0b0b', '#52514e'
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5,
                     'ytick.major.width': 0.5, 'axes.edgecolor': INK2, 'xtick.color': INK2, 'ytick.color': INK2,
                     'axes.labelcolor': INK, 'pdf.fonttype': 42})

c0 = D['c0']
fig, (a, b) = plt.subplots(1, 2, figsize=(6.3, 2.7), gridspec_kw={'width_ratios': [1.15, 1], 'wspace': 0.32})

# ---- (a) the two readings, by decade ------------------------------------------------
E = [r['e'] for r in D['readings']]
a.axhline(c0, color=GREY, lw=1, ls=':', zorder=1)
a.plot(E, [r['index'] for r in D['readings']], color=BLUE, lw=1.4, marker='o', ms=4, zorder=3)
a.plot(E, [r['prime'] for r in D['readings']], color=ORANGE, lw=1.4, ls='--', marker='s', ms=3.6, zorder=3)
a.set_xticks(E)
a.set_xticklabels(['$10^{%d}$' % e for e in E])
a.set_xlabel('$x$, the bound in the statement')
a.set_ylabel('$h(x)/\\log x$')
lo = min(min(r['index'], r['prime']) for r in D['readings']); hi = max(max(r['index'], r['prime']) for r in D['readings'])
a.set_ylim(min(lo, c0) - 0.08, max(hi, c0) + 0.08)
a.text(E[-1] + 0.1, c0 + 0.012, 'certified $c_0$ (a prediction)', color=INK2, fontsize=7, va='bottom', ha='right')
a.legend(handles=[Line2D([], [], color=BLUE, lw=1.4, marker='o', ms=4, label='$x$ bounds the index $n$ (the statement)'),
                  Line2D([], [], color=ORANGE, lw=1.4, ls='--', marker='s', ms=3.6, label='$x$ bounds the prime $p_n$')],
         loc='lower left', frameon=False, fontsize=7, handlelength=2.6)
a.set_title('(a) the ratio under the two readings', fontsize=8, loc='left', color=INK)
for s in ('top', 'right'):
    a.spines[s].set_visible(False)

# ---- (b) the plateau bands ---------------------------------------------------------
bands = D['bands']
ys = list(range(len(bands)))
for y, bd in zip(ys, bands):
    col = BLUE if bd['inside'] else GREY
    b.plot([bd['lo'], bd['hi']], [y, y], color=col, lw=2.2, solid_capstyle='butt', zorder=3)
    b.plot([bd['lo'], bd['hi']], [y, y], color=col, lw=0, marker='|', ms=5, mew=1.1, zorder=4)   # end ticks: a one-index plateau is a point
b.axvline(c0, color=INK, lw=0.8, ls=':', zorder=2)
b.set_yticks(ys)
b.set_yticklabels([str(bd['len']) for bd in bands], fontsize=6.5)
b.set_ylabel('plateau $h = $ run length', labelpad=2)
b.set_xlabel('$h/\\log x$ across the plateau')
b.set_ylim(-0.8, len(bands) - 0.2)
b.text(c0 + 0.006, len(bands) - 0.9, '$c_0$', color=INK, fontsize=7, va='top', ha='left')
b.legend(handles=[Line2D([], [], color=BLUE, lw=2.2, label='band contains $c_0$'),
                  Line2D([], [], color=GREY, lw=2.2, label='band misses $c_0$')],
         loc='upper right', frameon=False, fontsize=7, handlelength=1.8)
b.set_title('(b) each plateau of $h$ as a band', fontsize=8, loc='left', color=INK)
for s in ('top', 'right'):
    b.spines[s].set_visible(False)
b.tick_params(axis='y', length=0)

fig.savefig(os.path.join(FIG, 'erdos852-readings.pdf'), bbox_inches='tight', pad_inches=0.02)
print('wrote paper/tex/fig/erdos852-readings.pdf (%d decades, %d bands)' % (len(E), len(bands)))
