#!/usr/bin/env python3
"""tools/paper-numbers/ramsey-chain-figs.py — the figures of the pre-paper paper/tex/ramsey-chain.tex, drawn from
the records (never from the pages): paper/tex/fig/ramsey-chain-slack.pdf (the slack of Theorem 14's inequality
over lambda, round 1, from certs/gnnw-certificate.json), ramsey-chain-region.pdf (the HorizonMath certificate's
pairs against the region, from certs/horizonmath-ledger.json; the Lemma 15 edge of the problem's U is drawn in
floats and labelled so), ramsey-chain-rounds.pdf (the certified bases of the six rounds beside the float proposer's
sequences, from certs/gnnw-chain-certificate.json and instruments/gnnw/propose/chain_deg{6,9}.json).
Needs matplotlib (instruments/hseva/.venv has it).
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/ramsey-chain-figs.py                       MIT"""
import json
import math
import os

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


# the categorical slots of the validated palette (dataviz skill, light surface), as tools/build-paper-figs.py uses them
C = {'blue': '#2a78d6', 'orange': '#eb6834', 'aqua': '#1baf7a', 'violet': '#4a3aa7', 'grey': '#9a9a96', 'light': '#d9d9d6', 'ink': '#0b0b0b', 'ink2': '#52514e'}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b', 'pdf.fonttype': 42})


def recessive(ax):
    ax.grid(True, color='#e5e4e0', linewidth=0.3)
    ax.set_axisbelow(True)
    for s in ('top', 'right'):
        ax.spines[s].set_visible(False)
    ax.tick_params(length=2, pad=2)


# ---------------------------------------------------------------- figure 1: the slack of round 1 over lambda
Z = J('certs/gnnw-certificate.json')
pts = Z['curve']['points']
N = Z['m']['N']
xs = [p[0] for p in pts]
ys = [p[1] for p in pts]
assert all(y > 0 for y in ys)
fig, ax = plt.subplots(figsize=(5.4, 2.3))
ax.set_xscale('log')
ax.set_yscale('log')
ax.plot(xs, ys, color=C['blue'], linewidth=1.2, solid_capstyle='round')
ax.axvline(1.0 / N, color=C['grey'], linewidth=0.5, linestyle=(0, (3, 2)))
ax.text(1.0 / N * 0.8, 0.072, 'tail form', ha='right', va='top', color=C['ink2'])
ax.text(1.0 / N * 1.25, 0.072, 'mean-value form', ha='left', va='top', color=C['ink2'])
lim = pts[0]
mn = min(pts, key=lambda p: p[1])
mx = max(pts, key=lambda p: p[1])
ax.annotate('%.2e as $\\lambda\\to0$' % lim[1], xy=(lim[0] * 3, lim[1]), xytext=(lim[0] * 3, lim[1] * 2.6), ha='left', color=C['ink'], arrowprops=dict(arrowstyle='-', color=C['ink2'], linewidth=0.5))
ax.annotate('%.2e near $\\lambda=%.2f$' % (mn[1], mn[0]), xy=(mn[0], mn[1]), xytext=(1.2e-4, 3.6e-5), ha='left', va='center', color=C['ink'], arrowprops=dict(arrowstyle='-', color=C['ink2'], linewidth=0.5))
ax.annotate('%.4f near $\\lambda=%.2f$' % (mx[1], mx[0]), xy=(mx[0], mx[1]), xytext=(1.5e-4, 0.012), ha='left', va='center', color=C['ink'], arrowprops=dict(arrowstyle='-', color=C['ink2'], linewidth=0.5))
ax.set_xlim(1e-8, 1)
ax.set_ylim(2.8e-5, 0.09)
ax.set_xlabel('$\\lambda=\\ell/k$ (log scale)')
ax.set_ylabel('slack$(\\lambda)/\\lambda$ (log scale)')
recessive(ax)
fig.tight_layout(pad=0.4)
fig.savefig(os.path.join(OUT, 'ramsey-chain-slack.pdf'))
plt.close(fig)

# ---------------------------------------------------------------- figure 2: the certificate's pairs against the region
L = J('certs/horizonmath-ledger.json')
R = next(r for r in L['rows'] if r['id'] == 'ramsey-asymptotic')
PR = J('corpus/horizonmath/ramsey-a3-printed.json')
cub = [float(c) for c in PR['coeffs'][:3]]
eU1 = R['decided']['eMinusU1'][0]


def U(t):
    return (1 + t) * math.log(1 + t) - t * math.log(t) + (cub[0] * t + cub[1] * t * t + cub[2] * t ** 3) * math.exp(-t)


def Up(t):
    return math.log((1 + t) / t) + math.exp(-t) * ((cub[0] + 2 * cub[1] * t + 3 * cub[2] * t * t) - (cub[0] * t + cub[1] * t * t + cub[2] * t ** 3))


def A(t):
    return math.exp(-Up(t))


def B(t):
    return math.exp(t * Up(t) - U(t))


# the edge of what U places in R by Lemma 15 (GNNW): (A(t), B(t)), the hyperbola xy = e^-U(1) between a and b, (B(t), A(t)) — floats, a drawing
edge = []
for i in range(1, 401):
    t = (i / 400.0) ** 2
    edge.append((A(t), B(t)))
a1, b1 = A(1), B(1)
for i in range(0, 41):
    x = a1 + (b1 - a1) * i / 40.0
    edge.append((x, math.exp(-U(1)) / x))
for i in range(400, 0, -1):
    t = (i / 400.0) ** 2
    edge.append((B(t), A(t)))
fig, ax = plt.subplots(figsize=(5.4, 3.5))
ax.plot([0, 1], [1, 0], color=C['grey'], linewidth=0.7, linestyle=(0, (4, 2)))
ax.plot([p[0] for p in edge], [p[1] for p in edge], color=C['ink2'], linewidth=0.9)
ax.axvline(eU1, color=C['ink2'], linewidth=0.6, linestyle=(0, (1.5, 1.5)))
ax.text(eU1 + 0.012, 0.03, '$x=e^{-U(1)}$: the problem\'s rule accepts\nevery $y$ to the left of this line', ha='left', va='bottom', color=C['ink2'], fontsize=7)
ax.text(0.62, 0.58, 'edge of what $U$ places in $R$\n(Lemma 15; drawn in floats)', ha='left', va='bottom', color=C['ink2'], fontsize=7)
ax.text(0.80, 0.10, '$y=1-x$ (inside $R$)', ha='left', va='bottom', color=C['ink2'], fontsize=7)
groups = {'out': ([], []), 'np': ([], []), 'ok': ([], [])}
for p in R['points']:
    k = 'out' if p['outsideR'] else 'np' if p['notPlacedByU'] else 'ok'
    groups[k][0].append((p['X'][0] + p['X'][1]) / 2)
    groups[k][1].append(p['Y'])
ax.scatter(groups['out'][0], groups['out'][1], s=18, marker='o', facecolor=C['blue'], edgecolor='white', linewidth=0.3, zorder=4)
ax.scatter(groups['np'][0], groups['np'][1], s=20, marker='^', facecolor=C['orange'], edgecolor='white', linewidth=0.3, zorder=4)
ax.scatter(groups['ok'][0], groups['ok'][1], s=18, marker='s', facecolor=C['aqua'], edgecolor='white', linewidth=0.3, zorder=4)
last = R['points'][-1]
assert last['lambda'] == 1 and last['outsideR']
ax.scatter([last['X'][0]], [last['Y']], s=90, marker='D', facecolor='none', edgecolor=C['ink'], linewidth=0.9, zorder=5)
ax.annotate('$\\lambda=1$: $(%.5f,\\ %.4f)$, outside $R$' % (last['X'][0], last['Y']), xy=(last['X'][0], last['Y']), xytext=(0.02, 1.09), ha='left', va='center', color=C['ink'], fontsize=7,
            arrowprops=dict(arrowstyle='-', color=C['ink2'], linewidth=0.5))
n = R['decided']
handles = [Line2D([], [], marker='o', color='none', markerfacecolor=C['blue'], markeredgecolor='white', markersize=5, label='outside $R$, decided (%d)' % n['outsideR']),
           Line2D([], [], marker='^', color='none', markerfacecolor=C['orange'], markeredgecolor='white', markersize=5.5, label='not placed in $R$ by $U$, decided (%d)' % n['notPlacedByU']),
           Line2D([], [], marker='s', color='none', markerfacecolor=C['aqua'], markeredgecolor='white', markersize=5, label='not refuted here (%d)' % n['notRefutedHere'])]
ax.legend(handles=handles, loc='upper right', frameon=False, fontsize=7, handletextpad=0.3)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1.14)
ax.set_xlabel('$X(\\lambda)$')
ax.set_ylabel('$Y(\\lambda)$')
recessive(ax)
fig.tight_layout(pad=0.4)
fig.savefig(os.path.join(OUT, 'ramsey-chain-region.pdf'))
plt.close(fig)

# ---------------------------------------------------------------- figure 3: the certified rounds beside the float sequences
K = J('certs/gnnw-chain-certificate.json')
F6 = J('instruments/gnnw/propose/chain_deg6.json')
F9 = J('instruments/gnnw/propose/chain_deg9.json')
cert = [float(b) for b in K['decided']['bases']]
sec = [float(s['c'][0]) for s in K['second']['result']['steps']]
fig, ax = plt.subplots(figsize=(5.4, 2.6))
ax.plot(range(len(F6['base'])), F6['base'], color=C['orange'], linewidth=0.9, linestyle=(0, (4, 2)), marker='o', markerfacecolor='white', markeredgecolor=C['orange'], markersize=4, label='float proposer, degree 6 (not decided)')
ax.plot(range(len(F9['base'])), F9['base'], color=C['blue'], linewidth=0.9, linestyle=(0, (4, 2)), marker='o', markerfacecolor='white', markeredgecolor=C['blue'], markersize=4, label='float proposer, degree 9 (not decided)')
ax.plot(range(len(cert)), cert, color=C['ink'], linewidth=0, marker='D', markersize=5, label='certified rounds, both programs')
for i, b in enumerate(cert):
    ax.annotate('%.6f' % b, xy=(i, b), xytext=(5, 4 if i else -9), textcoords='offset points', fontsize=6.5, color=C['ink'])
ax.set_xlabel('round (0 = the remark\'s $G_{\\mathrm{AI}}$; each round is decided in the region of the one before)')
ax.set_ylabel('base $e^{F(1)}$')
ax.set_xticks(range(len(F9['base'])))
ax.set_ylim(3.7715, 3.7835)
ax.legend(loc='upper right', frameon=False, fontsize=7)
recessive(ax)
fig.tight_layout(pad=0.4)
fig.savefig(os.path.join(OUT, 'ramsey-chain-rounds.pdf'))
plt.close(fig)
print('wrote paper/tex/fig/ramsey-chain-{slack,region,rounds}.pdf')
