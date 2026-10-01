#!/usr/bin/env python3
"""erdos290-fig.py — the one figure of paper/tex/erdos290.tex, drawn from the data file
tools/paper-numbers/erdos290.js writes (paper/tex/fig/erdos290-squeeze.json): the certified
bracket for 1/(1+c) against the knowledge horizon l, every point re-assembled in exact
rationals by machine/erdos290/tail.js and rounded outward to twelve decimals there.
Nothing is computed here; this file only draws. Output: paper/tex/fig/erdos290-liminf.pdf.
Needs matplotlib (instruments/hseva/.venv has it).
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/erdos290-fig.py             MIT"""
import json
import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIG = os.path.join(ROOT, 'paper', 'tex', 'fig')
with open(os.path.join(FIG, 'erdos290-squeeze.json'), 'r', encoding='utf-8') as f:
    D = json.load(f)

# the house figure palette (the validated reference instance the Elsevier figures use)
C = {'blue': '#2a78d6', 'orange': '#eb6834', 'violet': '#4a3aa7', 'grey': '#9a9a96', 'light': '#d9d9d6', 'ink': '#0b0b0b', 'ink2': '#52514e'}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b', 'pdf.fonttype': 42})

P = D['points']
L = [p['L'] for p in P]
lo = [p['invLo'] for p in P]
hi = [p['invHi'] for p in P]
citedL, thirdL, Lmax = D['citedL'], D['thirdDigitL'], D['Lmax']
cond = D['conditional']

fig, ax = plt.subplots(figsize=(5.6, 3.0))
# the certified interval: a filled band between the two outward-rounded endpoints (one series; no legend box)
ax.fill_between(L, lo, hi, color=C['blue'], alpha=0.18, linewidth=0, label='certified interval')
ax.plot(L, lo, color=C['blue'], linewidth=1.6)
ax.plot(L, hi, color=C['blue'], linewidth=1.6)
# the decimal cells the third digit is decided against
for y in (0.545, 0.546, 0.547):
    ax.axhline(y, color=C['light'], linewidth=0.8, zorder=0)
# the conditional value, drawn as a dotted hairline so decided and assumed never share a style
ax.axhline(cond, color=C['violet'], linewidth=0.8, linestyle=(0, (1, 2)))
# the two horizons
for x, txt in ((citedL, 'source-lab horizon\n$l=%d$' % citedL), (thirdL, 'third digit closes\n$l=%d$' % thirdL)):
    ax.axvline(x, color=C['grey'], linewidth=0.7, linestyle=(0, (3, 2)))
    ax.text(x + 2, 0.5476, txt, color=C['ink2'], fontsize=6.5, va='top', ha='left')
# direct labels in text ink, never in the series color
ax.text(Lmax - 2, hi[-1] + 0.00008, 'upper end', color=C['ink2'], fontsize=6.5, ha='right', va='bottom')
ax.text(Lmax - 2, lo[-1] - 0.00008, 'lower end', color=C['ink2'], fontsize=6.5, ha='right', va='top')
ax.text(citedL + 8, cond + 0.00004, 'conditional value: assumes the groups past the horizon', color=C['ink2'], fontsize=6.5, ha='left', va='bottom')
ax.text(L[0] + 1, 0.54602, '0.546', color=C['ink2'], fontsize=6.5, va='bottom')
ax.text(L[0] + 1, 0.54702, '0.547', color=C['ink2'], fontsize=6.5, va='bottom')
ax.set_xlim(L[0], Lmax)
ax.set_ylim(0.5446, 0.5478)
ax.set_xlabel('knowledge horizon $l$ (every even degree $d=2l$ up to here has an exact density)')
ax.set_ylabel('certified interval for $1/(1+c)$')
ax.yaxis.set_major_formatter(matplotlib.ticker.FormatStrFormatter('%.4f'))
for s in ('top', 'right'):
    ax.spines[s].set_visible(False)
ax.grid(False)
fig.tight_layout()
out = os.path.join(FIG, 'erdos290-liminf.pdf')
fig.savefig(out)
print('wrote', os.path.relpath(out, ROOT))
