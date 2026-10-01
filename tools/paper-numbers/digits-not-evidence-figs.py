#!/usr/bin/env python3
"""paper-numbers/digits-not-evidence-figs.py — the two figures of the pre-paper, drawn from the
records as tools/paper-numbers/digits-not-evidence.js re-derives them (it feeds this script the data
on stdin with --figs; nothing here is typed):
   paper/tex/fig/digits-not-evidence-depth.pdf    the five impostor constants, agreement depth of the
                                                  deepest false spelling against the reach of a double
                                                  and of the 17-digit screen
   paper/tex/fig/digits-not-evidence-widths.pdf   the 51 printed Ramanujan Machine rows by sheet, the
                                                  width of each certified enclosure on a log axis, the
                                                  one refuted row marked and named
usage: node tools/paper-numbers/digits-not-evidence.js --figs"""
import json
import math
import os
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.lines import Line2D  # noqa: E402

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'paper', 'tex', 'fig')
os.makedirs(OUT, exist_ok=True)


def die(m):
    sys.exit('PAPER FIGURE REFUSED: ' + m)


D = json.load(sys.stdin)
# the validated light-surface palette the repository's paper figures share (tools/build-paper-figs.py):
# one hue for the one series, the status mark for the refuted row carries a label as well as its colour
C = {'blue': '#2a78d6', 'orange': '#eb6834', 'grey': '#9a9a96', 'light': '#d9d9d6', 'ink': '#0b0b0b', 'ink2': '#52514e'}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b', 'pdf.fonttype': 42})

# ---- figure 1: agreement depth -----------------------------------------------------------------
dep = D['depth']
if len(dep) != 5:
    die('expected five impostor constants, got %d' % len(dep))
dep = sorted(dep, key=lambda e: e['depth'])
fig, ax = plt.subplots(figsize=(6.0, 2.0))
ys = list(range(len(dep)))
ax.barh(ys, [e['depth'] for e in dep], height=0.55, color=C['blue'], edgecolor='none', zorder=3)
for y, e in zip(ys, dep):
    ax.text(e['depth'] + 0.8, y, '%d of %d digits' % (e['depth'], e['published']), va='center', ha='left', fontsize=7, color=C['ink2'], zorder=4)
ax.set_yticks(ys)
ax.set_yticklabels(['%s  (impersonates %s)' % (e['id'], e['value']) for e in dep], fontsize=7.5)
xmax = max(e['depth'] for e in dep) * 1.3
ax.set_xlim(0, xmax)
ax.set_ylim(-0.6, len(dep) + 0.35)
ax.axvline(D['double'], color=C['ink'], linewidth=0.8, linestyle=(0, (3, 2)), zorder=2)
ax.axvline(D['screen'], color=C['grey'], linewidth=0.8, zorder=2)
ax.text(D['double'] - 0.5, len(dep) - 0.2, 'a double, %.2f digits' % D['double'], ha='right', va='center', fontsize=7, color=C['ink'])
ax.text(D['screen'] + 0.5, len(dep) - 0.2, 'the screen, %d digits' % D['screen'], ha='left', va='center', fontsize=7, color=C['ink2'])
ax.set_xlabel('significant digits of agreement with the false form (exact, relative sense)')
ax.grid(axis='x', color=C['light'], linewidth=0.5, zorder=0)
for s in ('top', 'right'):
    ax.spines[s].set_visible(False)
ax.tick_params(axis='y', length=0)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'digits-not-evidence-depth.pdf'))
plt.close(fig)

# ---- figure 2: the registry's widths -----------------------------------------------------------
W = D['widths']
if len(W) != 51:
    die('expected 51 printed rows, got %d' % len(W))
order = ['e', 'pi', 'zeta3', 'catalan', 'zeta2', 'ln2', 'orders']
labels = D['sheetLabels']
fig, ax = plt.subplots(figsize=(5.6, 2.3))
lanes = {s: i for i, s in enumerate(order)}
# deterministic vertical spread inside a lane so coincident widths stay visible: rows of a sheet
# are spaced evenly, in the order the registry lists them
for s in order:
    rows_s = [r for r in W if r['sheet'] == s]
    n = len(rows_s)
    for j, r in enumerate(rows_s):
        off = 0 if n == 1 else (j - (n - 1) / 2) * min(0.5 / max(n - 1, 1), 0.06)
        y = lanes[s] + off
        if r['verdict'] == 'refuted':
            ax.plot(r['width'], y, marker='o', markersize=6.5, markerfacecolor='white', markeredgecolor=C['orange'], markeredgewidth=1.4, linestyle='none', zorder=5)
            ax.annotate('%s: refuted as printed;\nthe sign-corrected form survives on the same enclosure' % r['id'],
                        xy=(r['width'], y), xytext=(r['width'] * 12, y), fontsize=6.5, color=C['ink2'],
                        arrowprops=dict(arrowstyle='-', color=C['grey'], linewidth=0.6), va='center', ha='left')
        else:
            ax.plot(r['width'], y, marker='o', markersize=4, color=C['blue'], alpha=0.85, linestyle='none', zorder=4)
ax.set_xscale('log')
ws = [r['width'] for r in W]
ax.set_xlim(min(ws) / 3, max(ws) * 12)
ax.set_yticks(list(lanes.values()))
ax.set_yticklabels([labels[s] for s in order], fontsize=7.5)
ax.set_ylim(len(order) - 0.4, -0.6)
ax.set_xlabel('width of the certified enclosure of the continued fraction (log axis)')
ax.grid(axis='x', color=C['light'], linewidth=0.5, zorder=0)
for s in ('top', 'right'):
    ax.spines[s].set_visible(False)
ax.tick_params(axis='y', length=0)
wid = max(W, key=lambda r: r['width'])
ax.annotate('widest survivor: %s, %.1e' % (wid['id'], wid['width']), xy=(wid['width'], lanes[wid['sheet']]), xytext=(wid['width'] * 0.25, lanes[wid['sheet']] + 0.75),
            fontsize=6.5, color=C['ink2'], arrowprops=dict(arrowstyle='-', color=C['grey'], linewidth=0.6), va='center', ha='left')
handles = [Line2D([0], [0], marker='o', color=C['blue'], linestyle='none', markersize=4, label='survives (%d rows)' % sum(1 for r in W if r['verdict'] == 'survives')),
           Line2D([0], [0], marker='o', markerfacecolor='white', markeredgecolor=C['orange'], markeredgewidth=1.4, linestyle='none', markersize=6, label='refuted as printed (1 row)')]
ax.legend(handles=handles, loc='upper right', fontsize=6.5, frameon=False)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'digits-not-evidence-widths.pdf'))
plt.close(fig)
print('wrote paper/tex/fig/digits-not-evidence-depth.pdf and digits-not-evidence-widths.pdf')
