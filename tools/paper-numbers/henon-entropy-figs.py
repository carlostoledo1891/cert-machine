#!/usr/bin/env python3
"""henon-entropy-figs.py — the two figures of paper/tex/henon-entropy.tex, drawn from the record
(never from the page): paper/tex/fig/henon-entropy-hsets.pdf and henon-entropy-relations.pdf.
Reads certs/entropy-henon.json (the h-sets and the covering relations) and
paper/tex/fig/henon-entropy-figdata.json, written by tools/paper-numbers/henon-entropy.js
(the core of B_K at the recorded K, the two relations to draw, the calibration h-sets as the
battery defines them) — so no rule is defined twice. Everything drawn here is float and for
the eye only: the certificate is the interval check, and the orbit sample is the proposer's
input, not evidence. Needs matplotlib (instruments/hseva/.venv has it).
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/henon-entropy-figs.py       MIT"""
import json
import os
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle
from matplotlib.collections import PatchCollection
from matplotlib.lines import Line2D

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'paper', 'tex', 'fig')


def J(rel):
    with open(os.path.join(ROOT, rel), 'r', encoding='utf-8') as f:
        return json.load(f)


def die(m):
    print('FIGURES REFUSED: ' + m, file=sys.stderr)
    sys.exit(1)


cert = J('certs/entropy-henon.json')
fd = J('paper/tex/fig/henon-entropy-figdata.json')
if fd['K'] != cert['composedTo']:
    die('the sidecar is for another K than the record')
boxes, edges = cert['boxes'], cert['edges']
core = set(fd['core'])
if not core or max(core) >= len(boxes):
    die('the sidecar core does not index the record')

# the categorical slots of the validated palette (dataviz skill, light surface), as the other
# paper figures use them: blue, orange, violet and grey clear every all-pairs check
C = {'blue': '#2a78d6', 'orange': '#eb6834', 'violet': '#4a3aa7', 'aqua': '#1baf7a', 'grey': '#9a9a96', 'light': '#d9d9d6',
     'ink': '#0b0b0b', 'ink2': '#52514e', 'paper': '#f2f1ee'}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b', 'pdf.fonttype': 42})

a, b = cert['a'], cert['b']


def henon(x, y, a=a, b=b):
    return 1 - a * x * x + b * y, x


def corners(B):
    c, A = B['c'], B['A']
    pts = []
    for tu, ts in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
        pts.append((c[0] + A[0][0] * tu + A[0][1] * ts, c[1] + A[1][0] * tu + A[1][1] * ts))
    return pts


def orbit(n, transient=1000):
    x, y = 0.1, 0.1
    for _ in range(transient):
        x, y = henon(x, y)
    pts = []
    for _ in range(n):
        x, y = henon(x, y)
        pts.append((x, y))
    return pts


# ------------------------------------------------------------- figure 1: the h-sets
def fig_hsets():
    fig, ax = plt.subplots(figsize=(6.4, 5.5))
    pts = orbit(60000)
    ax.scatter([p[0] for p in pts], [p[1] for p in pts], s=0.3, color='#c8c7c2', linewidths=0, rasterized=True, zorder=1)
    in_core = [Polygon(corners(B), closed=True) for i, B in enumerate(boxes) if i in core]
    out_core = [Polygon(corners(B), closed=True) for i, B in enumerate(boxes) if i not in core]
    ax.add_collection(PatchCollection(out_core, facecolor='none', edgecolor=C['grey'], linewidth=0.5, zorder=3))
    ax.add_collection(PatchCollection(in_core, facecolor=C['blue'], edgecolor=C['blue'], linewidth=0.5, zorder=4))
    ax.set_xlim(-1.45, 1.45)
    ax.set_ylim(-1.45, 1.45)
    ax.set_aspect('equal')
    ax.set_xlabel('x')
    ax.set_ylabel('y  (the previous x)')
    ax.tick_params(length=2, pad=1)
    for s in ('top', 'right'):
        ax.spines[s].set_visible(False)
    # the inset: the 0.2-wide window holding the most core h-sets, scanned on a coarse grid of the record
    w = 0.2
    best = None
    for gx in range(-14, 14):
        for gy in range(-14, 14):
            wx, wy = gx * 0.1, gy * 0.1
            cnt = sum(1 for i, B in enumerate(boxes) if i in core and wx <= B['c'][0] <= wx + w and wy <= B['c'][1] <= wy + w)
            if best is None or cnt > best[0]:
                best = (cnt, wx, wy)
    x0, y0 = best[1], best[2]
    axi = ax.inset_axes([0.03, 0.33, 0.36, 0.36])
    axi.scatter([p[0] for p in pts], [p[1] for p in pts], s=1.0, color='#c8c7c2', linewidths=0, rasterized=True, zorder=1)
    axi.add_collection(PatchCollection([Polygon(corners(B), closed=True) for i, B in enumerate(boxes) if i not in core], facecolor='none', edgecolor=C['grey'], linewidth=0.6, zorder=3))
    axi.add_collection(PatchCollection([Polygon(corners(B), closed=True) for i, B in enumerate(boxes) if i in core], facecolor=C['blue'], edgecolor=C['blue'], linewidth=0.6, alpha=0.9, zorder=4))
    axi.set_xlim(x0, x0 + w)
    axi.set_ylim(y0, y0 + w)
    axi.set_aspect('equal')
    axi.set_xticks([x0, x0 + w])
    axi.set_yticks([y0, y0 + w])
    axi.tick_params(length=2, pad=1, labelsize=6)
    for s in axi.spines.values():
        s.set_color(C['ink2'])
    ax.add_patch(Rectangle((x0, y0), w, w, facecolor='none', edgecolor=C['ink2'], linewidth=0.5, linestyle='--', zorder=5))
    handles = [Line2D([0], [0], marker='s', color='none', markerfacecolor=C['blue'], markersize=7, label='h-set in the core of $B_{%d}$ (%d)' % (fd['K'], len(core))),
               Line2D([0], [0], marker='s', color='none', markerfacecolor='none', markeredgecolor=C['grey'], markersize=7, label='h-set outside the core (%d)' % (len(boxes) - len(core))),
               Line2D([0], [0], marker='o', color='none', markerfacecolor=C['light'], markersize=5, label='a float orbit sample (the proposer\'s input)')]
    ax.legend(handles=handles, loc='upper right', frameon=False, fontsize=7, handletextpad=0.4)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'henon-entropy-hsets.pdf'))
    plt.close(fig)


# ------------------------------------------------- figure 2: relations, in target coordinates
def target_coords(N1, N2, k, henon_fn, samples=400):
    """the images of the four edges of N1 under F^k, in N2's coordinates (float, for the eye)"""
    A = N2['A']
    det = A[0][0] * A[1][1] - A[0][1] * A[1][0]
    inv = [[A[1][1] / det, -A[0][1] / det], [-A[1][0] / det, A[0][0] / det]]
    out = {}
    for name, (fix, val) in {'u-': ('u', -1), 'u+': ('u', 1), 's-': ('s', -1), 's+': ('s', 1)}.items():
        curve = []
        for q in range(samples + 1):
            t = -1 + 2 * q / samples
            tu, ts = (val, t) if fix == 'u' else (t, val)
            x = N1['c'][0] + N1['A'][0][0] * tu + N1['A'][0][1] * ts
            y = N1['c'][1] + N1['A'][1][0] * tu + N1['A'][1][1] * ts
            for _ in range(k):
                x, y = henon_fn(x, y)
            dx, dy = x - N2['c'][0], y - N2['c'][1]
            curve.append((inv[0][0] * dx + inv[0][1] * dy, inv[1][0] * dx + inv[1][1] * dy))
        out[name] = curve
    return out


def draw_relation(ax, N1, N2, k, henon_fn, title):
    cur = target_coords(N1, N2, k, henon_fn)
    us = [p[0] for c in cur.values() for p in c]
    ss = [p[1] for c in cur.values() for p in c]
    umin, umax = min(us + [-1.5]), max(us + [1.5])
    smin, smax = min(ss + [-1.6]), max(ss + [1.6])
    pad = 0.08 * (umax - umin)
    ax.set_xlim(umin - pad, umax + pad)
    ax.set_ylim(min(smin, -1.6) - 0.1, max(smax, 1.6) + 0.1)
    # the forbidden slabs {|u| <= 1, |s| >= 1} and the target square
    ax.add_patch(Rectangle((-1, 1), 2, 100, facecolor=C['paper'], edgecolor='none', hatch='////', zorder=1))
    ax.add_patch(Rectangle((-1, -101), 2, 100, facecolor=C['paper'], edgecolor='none', hatch='////', zorder=1))
    ax.add_patch(Rectangle((-1, -1), 2, 2, facecolor='white', edgecolor=C['ink'], linewidth=0.8, zorder=2))
    ax.axvline(-1, color=C['ink2'], linewidth=0.4, linestyle=':', zorder=2)
    ax.axvline(1, color=C['ink2'], linewidth=0.4, linestyle=':', zorder=2)
    ax.plot([p[0] for p in cur['s-']], [p[1] for p in cur['s-']], color=C['blue'], linewidth=1.0, zorder=4)
    ax.plot([p[0] for p in cur['s+']], [p[1] for p in cur['s+']], color=C['blue'], linewidth=1.0, zorder=4)
    for key, col in (('u-', C['orange']), ('u+', C['violet'])):
        ax.plot([p[0] for p in cur[key]], [p[1] for p in cur[key]], color=col, linewidth=2.4, zorder=5, solid_capstyle='round')
        mid = cur[key][len(cur[key]) // 2]
        ax.plot([mid[0]], [mid[1]], marker='o', markersize=5, color=col, zorder=6)
    ax.set_title(title, fontsize=8, loc='left')
    ax.set_xlabel('u (target coordinates)')
    ax.set_ylabel('s')
    ax.tick_params(length=2, pad=1)
    for s in ('top', 'right'):
        ax.spines[s].set_visible(False)


def fig_relations():
    fig, axes = plt.subplots(1, 3, figsize=(7.0, 2.6))
    cal = fd['calibration']
    H, w, x0, kap = cal['H'], cal['w'], cal['x0'], cal['kappa']
    Np = {'c': [x0, 0], 'A': [[w, kap], [0, H]]}
    Nm = {'c': [-x0, 0], 'A': [[w, -kap], [0, H]]}

    def h6(x, y):
        return henon(x, y, cal['a'], cal['b'])
    # (a) the calibration horseshoe: the two h-sets and the image of each under F, in the plane
    ax = axes[0]
    for N, col in ((Np, C['blue']), (Nm, C['aqua'])):
        ax.add_patch(Polygon(corners(N), closed=True, facecolor='none', edgecolor=col, linewidth=1.0, zorder=3))
        for name, (fix, val) in {'u-': ('u', -1), 'u+': ('u', 1), 's-': ('s', -1), 's+': ('s', 1)}.items():
            xs, ys = [], []
            for q in range(401):
                t = -1 + 2 * q / 400
                tu, ts = (val, t) if fix == 'u' else (t, val)
                x = N['c'][0] + N['A'][0][0] * tu + N['A'][0][1] * ts
                y = N['c'][1] + N['A'][1][0] * tu + N['A'][1][1] * ts
                x, y = h6(x, y)
                xs.append(x)
                ys.append(y)
            ax.plot(xs, ys, color=col, linewidth=0.7 if fix == 's' else 1.4, linestyle='-' if fix == 's' else '--', zorder=4)
    ax.set_xlim(-1.35, 1.35)
    ax.set_ylim(-0.8, 0.8)
    ax.set_aspect('equal')
    ax.set_title('(a) a = %g: the h-sets and F of each' % cal['a'], fontsize=8, loc='left')
    ax.set_xlabel('x')
    ax.set_ylabel('y')
    ax.tick_params(length=2, pad=1)
    for s in ('top', 'right'):
        ax.spines[s].set_visible(False)
    # (b), (c): two recorded relations in the target's coordinates
    e1, e6 = fd['edgeOne'], fd['edgeSix']
    draw_relation(axes[1], boxes[e1[0]], boxes[e1[1]], e1[2], henon, '(b) relation %d$\\to$%d, duration %d' % (e1[0], e1[1], e1[2]))
    draw_relation(axes[2], boxes[e6[0]], boxes[e6[1]], e6[2], henon, '(c) relation %d$\\to$%d, duration %d' % (e6[0], e6[1], e6[2]))
    handles = [Line2D([0], [0], color=C['orange'], linewidth=2.4, marker='o', markersize=5, label='image of the u-edge at u = $-$1'),
               Line2D([0], [0], color=C['violet'], linewidth=2.4, marker='o', markersize=5, label='image of the u-edge at u = +1'),
               Line2D([0], [0], color=C['blue'], linewidth=1.0, label='images of the two s-edges'),
               Line2D([0], [0], marker='s', color='none', markerfacecolor=C['paper'], markeredgecolor=C['light'], markersize=7, label='forbidden slabs $|u|\\leq1$, $|s|\\geq1$')]
    fig.legend(handles=handles, loc='lower center', ncol=4, frameon=False, fontsize=6.5, handletextpad=0.5, columnspacing=1.2, bbox_to_anchor=(0.5, -0.02))
    fig.tight_layout(rect=(0, 0.07, 1, 1))
    fig.savefig(os.path.join(OUT, 'henon-entropy-relations.pdf'))
    plt.close(fig)


fig_hsets()
fig_relations()
print('wrote paper/tex/fig/henon-entropy-hsets.pdf and henon-entropy-relations.pdf')
