#!/usr/bin/env python3
"""paper-numbers/erdos1038-sup-fig.py — the one figure of the pre-paper, drawn from the certified
   curve points that tools/paper-numbers/erdos1038-sup.js writes (paper/tex/fig/erdos1038-sup-curves.json):
   the sublevel measure of the cubic family (x^2-1)(x-r) and of the quintic family (x^2-1)^2(x-r) against
   the free root r, with the 2*sqrt(2) rule and the two recorded champions, at each of which the sublevel
   set splits into two intervals. Output: paper/tex/fig/erdos1038-sup-curves.pdf.
   usage: instruments/hseva/.venv/bin/python tools/paper-numbers/erdos1038-sup-fig.py"""
import json
import os
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
FIG = os.path.join(ROOT, 'paper', 'tex', 'fig')
SRC = os.path.join(FIG, 'erdos1038-sup-curves.json')
OUT = os.path.join(FIG, 'erdos1038-sup-curves.pdf')


def die(m):
    sys.exit('PAPER FIGURE REFUSED: ' + m)


if not os.path.exists(SRC):
    die('no curve points at ' + SRC + ' — run tools/paper-numbers/erdos1038-sup.js first')
D = json.load(open(SRC))
cubic = sorted(D['cubic'], key=lambda p: p['r'])
quintic = sorted(D['quintic'], key=lambda p: p['r'])
S2 = D['twoSqrtTwo']
if not (max(p['hi'] for p in cubic) < S2 and max(p['hi'] for p in quintic) < S2):
    die('a family point reached 2*sqrt(2)')
lo_y = min(min(p['hi'] for p in cubic), min(p['hi'] for p in quintic))

# the first two categorical slots of the validated palette (dataviz skill, light surface);
# text in the ink tokens, never in a series colour
BLUE, ORANGE, INK, INK2, GRID = '#2a78d6', '#eb6834', '#0b0b0b', '#52514e', '#e6e5e2'
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5,
                     'ytick.major.width': 0.5, 'axes.edgecolor': INK2, 'xtick.color': INK2, 'ytick.color': INK2,
                     'axes.labelcolor': INK, 'pdf.fonttype': 42})

fig, ax = plt.subplots(figsize=(5.6, 3.2))
ax.axhline(S2, color=INK2, lw=0.6, ls=(0, (4, 3)), zorder=1)
ax.text(0.503, S2 - 0.005, r'$2\sqrt{2}$, the supremum (Tao, Theorem 2.1)', color=INK2, va='top', ha='left', fontsize=7)
ax.plot([p['r'] for p in cubic], [p['hi'] for p in cubic], color=BLUE, lw=1.5, solid_joinstyle='round', solid_capstyle='round', zorder=3,
        label='cubic family $(x^2-1)(x-r)$')
ax.plot([p['r'] for p in quintic], [p['hi'] for p in quintic], color=ORANGE, lw=1.5, solid_joinstyle='round', solid_capstyle='round', zorder=3,
        label='quintic family $(x^2-1)^2(x-r)$')
# the two recorded champions: >= 8 px markers with a surface ring
cc, qp = D['cubicChampion'], D['quinticPeak']
for c, col in ((cc, BLUE), (qp, ORANGE)):
    ax.plot([c['r']], [c['hi']], marker='o', ms=5.5, mfc=col, mec='white', mew=1.2, ls='none', zorder=5)
ax.annotate('cubic champion, $r=201/256$: %.6f' % cc['hi'], xy=(cc['r'], cc['hi']), xytext=(0.56, 2.60), color=INK, fontsize=7,
            arrowprops=dict(arrowstyle='-', color=INK2, lw=0.5, shrinkB=4), ha='left', va='center')
ax.annotate('quintic peak, $r=905/1024$: %.6f\n(past it the sublevel set is two intervals)' % qp['hi'], xy=(qp['r'], qp['hi']),
            xytext=(0.515, 2.848), color=INK, fontsize=7, arrowprops=dict(arrowstyle='-', color=INK2, lw=0.5, shrinkB=4), ha='left', va='bottom')
ax.legend(loc='lower left', frameon=False, fontsize=7, labelcolor=INK)
ax.set_xlim(0.5, 1.0)
ax.set_ylim(lo_y - 0.04, 2.92)
ax.set_xlabel('the free root $r$ (the other roots pinned at $\\pm1$; the quintic family pins them double)')
ax.set_ylabel('certified measure of $\\{|q|<1\\}$ (upper end)')
ax.set_yticks([2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8])
ax.set_xticks([0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
ax.grid(axis='y', color=GRID, lw=0.5)
for s in ('top', 'right'):
    ax.spines[s].set_visible(False)
fig.tight_layout(pad=0.4)
fig.savefig(OUT)
print('wrote paper/tex/fig/erdos1038-sup-curves.pdf (%d + %d certified points)' % (len(cubic), len(quintic)))
