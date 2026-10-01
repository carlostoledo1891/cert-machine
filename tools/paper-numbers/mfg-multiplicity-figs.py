#!/usr/bin/env python3
"""tools/paper-numbers/mfg-multiplicity-figs.py — the figures of paper/tex/mfg-multiplicity.tex,
drawn from the records (never from the pages): paper/tex/fig/mfg-multiplicity-*.pdf.
Reads certs/mfg-regime-map.json, certs/mfg2p-regime-map.json, certs/frontier-measurement.json,
certs/monoflow-spectrum.json. Palette and style as tools/build-paper-figs.py (the validated
categorical slots; undecided cells are neutral grey or hatched, never a hue).
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/mfg-multiplicity-figs.py          MIT"""
import json
import math
import os
import sys

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Patch
from matplotlib.collections import PatchCollection
from matplotlib.colors import ListedColormap
from matplotlib.lines import Line2D

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'paper', 'tex', 'fig')
os.makedirs(OUT, exist_ok=True)


def J(rel):
    with open(os.path.join(ROOT, rel), 'r', encoding='utf-8') as f:
        return json.load(f)


def die(m):
    print('PAPER FIGS REFUSED (mfg-multiplicity): ' + m, file=sys.stderr)
    sys.exit(1)


C = {'blue': '#2a78d6', 'orange': '#eb6834', 'aqua': '#1baf7a', 'violet': '#4a3aa7', 'red': '#e34948', 'grey': '#9a9a96',
     'light': '#d9d9d6', 'ink': '#0b0b0b', 'ink2': '#52514e', 'surface': '#ffffff'}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b',
                     'pdf.fonttype': 42, 'hatch.linewidth': 0.5, 'legend.fontsize': 7, 'legend.frameon': False})

# verdict classes: 1 MULTIPLE, 2 UNIQUE, 3 UNDECIDED with an enclosure, 4 UNDECIDED with nothing enclosed (hatched)
CMAP = ListedColormap(['#ff00ff', C['blue'], C['aqua'], C['light'], C['surface']])
LEGEND = [Patch(facecolor=C['blue'], edgecolor='none', label='MULTIPLE: two equilibria for every parameter in the cell'),
          Patch(facecolor=C['aqua'], edgecolor='none', label='UNIQUE: monotone over the cell (cited), enclosure decided'),
          Patch(facecolor=C['light'], edgecolor='none', label='UNDECIDED, one equilibrium enclosed'),
          Patch(facecolor=C['surface'], edgecolor=C['grey'], hatch='//////', linewidth=0.3, label='UNDECIDED, nothing enclosed')]


def regime_map(cells, box, code_of, lines, xlabel, ylabel, out, figsize):
    """cells: list of (x0, x1, y0, y1, code); box: (x0, x1, y0, y1). Rasterised at the finest cell, exactly."""
    x0, x1, y0, y1 = box
    dx = min(c[1] - c[0] for c in cells)
    dy = min(c[3] - c[2] for c in cells)
    NX = int(round((x1 - x0) / dx))
    NY = int(round((y1 - y0) / dy))
    grid = np.zeros((NY, NX), dtype=np.uint8)
    for (cx0, cx1, cy0, cy1, code) in cells:
        i0, i1 = int(round((cx0 - x0) / dx)), int(round((cx1 - x0) / dx))
        j0, j1 = int(round((cy0 - y0) / dy)), int(round((cy1 - y0) / dy))
        if grid[j0:j1, i0:i1].any():
            die('two cells overlap on the raster')
        grid[j0:j1, i0:i1] = code
    if (grid == 0).any():
        die('the partition has a hole on the raster')
    fig, ax = plt.subplots(figsize=figsize)
    ax.imshow(grid, origin='lower', extent=[x0, x1, y0, y1], aspect='auto', cmap=CMAP, vmin=0, vmax=4, interpolation='nearest', zorder=1)
    # the hatched class: raster rows run-length encoded, so the hatch is continuous across cells
    pats = []
    for j in range(NY):
        i = 0
        while i < NX:
            if grid[j, i] == 4:
                k = i
                while k < NX and grid[j, k] == 4:
                    k += 1
                pats.append(Rectangle((x0 + i * dx, y0 + j * dy), (k - i) * dx, dy))
                i = k
            else:
                i += 1
    ax.add_collection(PatchCollection(pats, facecolor='none', edgecolor=C['grey'], hatch='//////', linewidth=0, zorder=2))
    for (xv, style, text, side, frac) in lines:
        ax.axvline(xv, color=C['ink'], linewidth=0.8, linestyle=style, zorder=3)
        ax.text(xv + (0.012 if side == 'right' else -0.012) * (x1 - x0), y0 + frac * (y1 - y0), text, fontsize=7, color=C['ink'],
                ha='left' if side == 'right' else 'right', va='top', zorder=4)
    ax.set_xlim(x0, x1)
    ax.set_ylim(y0, y1)
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.tick_params(length=2, pad=1)
    ax.legend(handles=LEGEND, loc='upper center', bbox_to_anchor=(0.5, -0.2), ncol=2, handlelength=1.6, columnspacing=1.2)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, out))
    plt.close(fig)
    return NX, NY


# ---- figure 1: the one-population map ---------------------------------------------------
R1 = J('certs/mfg-regime-map.json')
cfg = R1['config']
cells = []
for c in R1['cells']:
    code = 1 if c['verdict'] == 'MULTIPLE' else 2 if c['verdict'] == 'UNIQUE' else (3 if c.get('enclosures', 0) >= 1 else 4)
    cells.append((c['c0'], c['c1'], c['a0'], c['a1'], code))
cstar = R1['cStar']
if abs(cstar + cfg['sigma'] ** 2 * (2 * math.pi) ** 2) > 1e-12:
    die('cStar is not -sigma^2 (2 pi)^2')
nx, ny = regime_map(cells, (cfg['cRange'][0], cfg['cRange'][1], cfg['aRange'][0], cfg['aRange'][1]), None,
                    [(cstar, (0, (4, 3)), 'c* = −σ²(2π)² = ' + ('%.4f' % cstar).replace('-', '−'), 'right', 0.94), (0.0, (0, (1, 2)), 'c = 0', 'left', 0.94)],
                    'coupling c   (c < 0 herding, c ≥ 0 crowd-averse)', 'potential depth A', 'mfg-multiplicity-map1.pdf', (6.3, 2.15))
print('map1 raster %d x %d' % (nx, ny))

# ---- figure 2: the two-population map ---------------------------------------------------
R2 = J('certs/mfg2p-regime-map.json')
cfg2 = R2['config']
cells = []
smin = None
for c in R2['cells']:
    code = 1 if c['verdict'] == 'MULTIPLE' else 2 if c['verdict'] == 'UNIQUE' else (3 if c.get('enclosed', 0) >= 1 else 4)
    cells.append((c['s'][0], c['s'][1], c['d'][0], c['d'][1], code))
    if code == 1:
        smin = c['s'][0] if smin is None else min(smin, c['s'][0])
if smin is None:
    die('no MULTIPLE cell in the two-population map')
nx, ny = regime_map(cells, (cfg2['sRange'][0], cfg2['sRange'][1], cfg2['dRange'][0], cfg2['dRange'][1]), None,
                    [(cfg2['cs'], (0, (4, 3)), 's = %g: Lasry–Lions monotone for |s| ≤ c_s' % cfg2['cs'], 'right', 0.94),
                     (smin, (0, (1, 2)), 'first cell with two equilibria, s = %g' % smin, 'left', 0.40)],
                    's   (symmetric part of the cross-coupling)', 'd   (attack–defense asymmetry)', 'mfg-multiplicity-map2.pdf', (6.3, 2.1))
print('map2 raster %d x %d, first MULTIPLE at s = %g' % (nx, ny, smin))

# ---- figure 3: the frontier measurement --------------------------------------------------
F = J('certs/frontier-measurement.json')
fig, (ax, bx) = plt.subplots(1, 2, figsize=(6.3, 2.3), gridspec_kw={'width_ratios': [1.45, 1]})
lad = F['ladders']
for i, l in enumerate(lad):
    for p in l['ladder']:
        x = math.log10(p['A'])
        if p['status'] == 'CERTIFIED':
            ax.plot(x, i, marker='o', ms=4, color=C['blue'], mec=C['surface'], mew=0.5, linestyle='none', zorder=3)
        elif p['mode'] == 'Z1_GE_1':
            ax.plot(x, i, marker='o', ms=4, mfc='none', mec=C['grey'], mew=0.8, linestyle='none', zorder=3)
        elif p['mode'] == 'SBAR0_NONPOSITIVE':
            ax.plot(x, i, marker='x', ms=4, color=C['grey'], mew=0.8, linestyle='none', zorder=3)
        else:
            ax.plot(x, i, marker='+', ms=4.5, color=C['grey'], mew=0.8, linestyle='none', zorder=3)
    xb = math.log10(0.5 * (l['bisected'][0] + l['bisected'][1]))
    ax.plot([xb, xb], [i - 0.3, i + 0.3], color=C['orange'], linewidth=1.6, solid_capstyle='butt', zorder=4)
ax.set_yticks(range(len(lad)))
ax.set_yticklabels(['σ = %g' % l['sigma'] for l in lad])
ticks = [0.05, 0.3, 1, 3, 10, 30]
ax.set_xticks([math.log10(t) for t in ticks])
ax.set_xticklabels([str(t) for t in ticks])
ax.set_xlim(math.log10(0.035), math.log10(45))
ax.set_ylim(-0.7, len(lad) - 0.3)
ax.set_xlabel('potential amplitude A (log scale), N = 14')
ax.grid(True, axis='x', color='#e5e4e0', linewidth=0.3)
ax.tick_params(length=2, pad=1)
fig.legend(handles=[Line2D([], [], marker='o', ms=4, color=C['blue'], linestyle='none', label='certified'),
                    Line2D([], [], marker='o', ms=4, mfc='none', mec=C['grey'], linestyle='none', label='refused: Z₁ ≥ 1'),
                    Line2D([], [], marker='x', ms=4, color=C['grey'], linestyle='none', label='refused: mean of √m ≤ 0'),
                    Line2D([], [], marker='+', ms=4.5, color=C['grey'], linestyle='none', label='refused: candidate not finite'),
                    Line2D([], [], color=C['orange'], linewidth=1.6, label='A⋆ bracket (bisected to 0.1 %)')],
           loc='lower center', bbox_to_anchor=(0.5, 0.0), ncol=3, handlelength=1.2, columnspacing=1.6)
# (b) the ratio A*(N)/A_rec against N, three viscosities in fixed categorical order
cols = [C['blue'], C['orange'], C['aqua']]
ends = []
for k, c in enumerate(F['ceiling']):
    Ns = [x['N'] for x in c['ratios']]
    rs = [x['ratio'] for x in c['ratios']]
    bx.plot(Ns, rs, color=cols[k], linewidth=1.5, marker='o', ms=4, mec=C['surface'], mew=0.5, zorder=3)
    ends.append([rs[-1], 'σ = %g' % c['sigma']])
# direct labels at the right end, pushed apart when two curves end within a label height of each other
ends.sort(key=lambda e: e[0])
for k in range(1, len(ends)):
    if ends[k][0] - ends[k - 1][0] < 0.012:
        ends[k][0] = ends[k - 1][0] + 0.012
for (y, t) in ends:
    bx.text(40.8, y, t, fontsize=7, color=C['ink2'], va='center')
bx.axhline(1.0, color=C['grey'], linewidth=0.8, linestyle=(0, (4, 3)))
bx.text(14, 1.004, 'the N-free ceiling A_rec', fontsize=7, color=C['ink2'], va='bottom')
bx.set_xticks([14, 20, 28, 40])
bx.set_xlim(12, 47)
lo = min(x['ratio'] for c in F['ceiling'] for x in c['ratios'])
bx.set_ylim(lo - 0.02, 1.03)
bx.set_xlabel('truncation order N')
bx.set_ylabel('A⋆(N) / A_rec')
bx.grid(True, color='#e5e4e0', linewidth=0.3)
bx.tick_params(length=2, pad=1)
fig.tight_layout(rect=(0, 0.17, 1, 1))
fig.savefig(os.path.join(OUT, 'mfg-multiplicity-frontier.pdf'))
plt.close(fig)
print('frontier figure written')

# ---- figure 4: the monotone flow's spectrum ----------------------------------------------
S = J('certs/monoflow-spectrum.json')
by = {i['id']: i for i in S['instances']}
fig, ax = plt.subplots(figsize=(6.3, 2.2))
ax.axhline(0, color=C['grey'], linewidth=0.6, linestyle=(0, (1, 2)))
# closed-form modes of the constant solutions (c = 1 and c = -12), k = 1..3
for iid in ['C1', 'H0']:
    for m in by[iid]['modes'][:3]:
        pts = [(m['re'], m['im'])] if m['complex'] else [(m['mu1'], 0.0), (m['mu2'], 0.0)]
        for (x, y) in pts:
            if -42 <= x <= 8:
                ax.plot(x, y, marker='o', ms=7, mfc='none', mec=C['orange'], mew=1.2, linestyle='none', zorder=3)
# real eigenvalues reached on the undecided instances
for i in S['instances']:
    if i['verdict'] == 'NOT DECIDED':
        for t in i['tried']:
            mu = t['mu'] if isinstance(t, dict) else t
            if -42 <= mu[0] <= 8:
                ax.plot([mu[0], mu[0]], [-0.6, 0.6], color=C['grey'], linewidth=1.5, zorder=2)
# certified pairs
placed = []
for i in S['instances']:
    if i['verdict'] != 'NOT A GRADIENT FLOW':
        continue
    mu = i['certified'][0]['mu']
    x, y = 0.5 * (mu[0][0] + mu[0][1]), 0.5 * (mu[1][0] + mu[1][1])
    ax.plot(x, y, marker='o', ms=6, color=C['blue'], mec=C['surface'], mew=0.8, linestyle='none', zorder=4)
    g = next((p for p in placed if abs(p[0] - x) < 1.5 and abs(p[1] - y) < 1.5), None)
    if g:
        g[2].append(i['id'])
    else:
        placed.append([x, y, [i['id']]])
for (x, y, ids) in placed:
    left_neighbour = any(0 < x - q[0] < 4 and abs(y - q[1]) < 2 for q in placed)
    if left_neighbour:
        ax.text(x + 0.8, y, ' · '.join(ids), fontsize=7, color=C['ink2'], ha='left', va='center')
    else:
        ax.text(x - 0.8, y, ' · '.join(ids), fontsize=7, color=C['ink2'], ha='right', va='center')
ax.set_xlim(-42, 8)
ax.set_ylim(-1.5, 20)
ax.set_xlabel('Re μ   (eigenvalue of the Jacobian of the monotone flow)')
ax.set_ylabel('Im μ')
ax.grid(True, color='#e5e4e0', linewidth=0.3)
ax.tick_params(length=2, pad=1)
ax.legend(handles=[Line2D([], [], marker='o', ms=6, color=C['blue'], linestyle='none', label='certified pair (enclosure too thin to draw)'),
                   Line2D([], [], marker='o', ms=7, mfc='none', mec=C['orange'], linestyle='none', label='closed-form modes of the constant solution, k = 1..3'),
                   Line2D([], [], color=C['grey'], linewidth=1.5, label='real eigenvalues reached on R1 and H0 (floats, undecided)')],
          loc='center right', bbox_to_anchor=(1.0, 0.5), handlelength=1.2)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'mfg-multiplicity-monoflow.pdf'))
plt.close(fig)
print('monoflow figure written')
