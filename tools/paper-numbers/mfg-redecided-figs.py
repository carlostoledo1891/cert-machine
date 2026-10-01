#!/usr/bin/env python3
"""mfg-redecided-figs.py — the figures of paper/tex/mfg-redecided.tex, drawn from the records
(never from the pages): paper/tex/fig/mfg-redecided-{agtable,hbar,regatlas}.pdf.
Reads certs/agtable-redecided.json, certs/hbar-band.json, certs/regatlas.json. Palette and rc of tools/build-paper-figs.py.
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/mfg-redecided-figs.py       MIT"""
import json
import math
import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from matplotlib.lines import Line2D

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'paper', 'tex', 'fig')
os.makedirs(OUT, exist_ok=True)


def J(rel):
    with open(os.path.join(ROOT, rel), 'r', encoding='utf-8') as f:
        return json.load(f)


# the palette of tools/build-paper-figs.py (validated categorical slots on a light surface)
C = {'blue': '#2a78d6', 'orange': '#eb6834', 'aqua': '#1baf7a', 'violet': '#4a3aa7', 'red': '#e34948', 'grey': '#9a9a96', 'light': '#d9d9d6', 'ink': '#0b0b0b', 'ink2': '#52514e',
     'seq': ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b']}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b', 'pdf.fonttype': 42})


def mid(iv):
    return 0.5 * (iv[0] + iv[1])


def save(fig, name):
    p = os.path.join(OUT, 'mfg-redecided-' + name + '.pdf')
    fig.savefig(p, bbox_inches='tight', pad_inches=0.02)
    plt.close(fig)
    print('wrote', os.path.relpath(p, ROOT))


# ---- 1. Ashrafyan–Gomes: the errors against the mesh, printed and re-derived ----------------
def fig_agtable():
    R = J('certs/agtable-redecided.json')
    cols = [('w', 'price $\\varpi$'), ('u', '$u(\\cdot,0)$'), ('m', '$m(\\cdot,T)$')]
    fig, axs = plt.subplots(1, 3, figsize=(6.6, 1.85))
    col = {1: C['blue'], 2: C['orange']}
    for ax, (c, title) in zip(axs, cols):
        for t in (1, 2):
            runs = R['runs'][str(t)]
            rho = [r['rho'] for r in runs]
            ax.plot(rho, [mid(r['theirs'][c]['rel']) for r in runs], '-', color=col[t], lw=1.0, marker='o', ms=3, zorder=3)
            ax.plot(rho, [mid(r['tight'][c]['rel']) for r in runs], '--', color=col[t], lw=0.8, zorder=2)
            ax.plot(rho, [r['printed'][c] for r in runs], 'o', mfc='none', mec=C['ink'], ms=6, mew=0.8, zorder=4)
        ax.set_xscale('log')
        ax.set_yscale('log')
        ax.set_xticks([0.0025, 0.005, 0.01, 0.02])
        ax.set_xticklabels(['0.0025', '0.005', '0.01', '0.02'])
        ax.minorticks_off()
        ax.set_xlabel('$\\rho$  ($h = 2\\rho$)')
        ax.set_title(title, fontsize=8)
        ax.grid(True, color='#e5e4e0', linewidth=0.3)
    axs[0].set_ylabel('relative error, $\\ell^\\infty$')
    handles = [Line2D([], [], color=C['blue'], marker='o', ms=3, lw=1.0, label="test 1, this port at the paper's $\\varepsilon$"),
               Line2D([], [], color=C['orange'], marker='o', ms=3, lw=1.0, label="test 2, this port at the paper's $\\varepsilon$"),
               Line2D([], [], color=C['ink2'], ls='--', lw=0.8, label='the same at $\\varepsilon = 10^{-8}$'),
               Line2D([], [], color=C['ink'], marker='o', mfc='none', ms=6, lw=0, label='printed in Tables 1 and 2')]
    fig.legend(handles=handles, loc='lower center', ncol=4, frameon=False, fontsize=7, bbox_to_anchor=(0.5, -0.1))
    fig.tight_layout()
    save(fig, 'agtable')


# ---- 2. Gomes–Yang: the band and the width of its brackets ----------------------------------
def fig_hbar():
    R = J('certs/hbar-band.json')
    band = R['band']
    dec = [b for b in band if b['regime'] != 'UNDECIDED']
    rot = [b for b in band if b['regime'] == 'ROTATING']
    und = [b for b in band if b['regime'] == 'UNDECIDED'][0]
    p0 = R['p0']['sin']['value']
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(6.6, 1.9), gridspec_kw={'width_ratios': [1.35, 1]})
    a1.axvspan(p0[0], p0[1], color=C['grey'], alpha=0.6, lw=0)
    a1.axvline(4 / math.pi, color=C['grey'], lw=0.6, ls='--')
    a1.plot([b['P'] for b in dec], [mid(b['value']) for b in dec], '-', color=C['blue'], lw=1.0, zorder=2)
    flat = [b for b in dec if b['regime'] == 'FLAT']
    a1.plot([b['P'] for b in flat], [mid(b['value']) for b in flat], 'o', color=C['blue'], ms=3, zorder=3)
    a1.plot([b['P'] for b in rot], [mid(b['value']) for b in rot], 's', color=C['orange'], ms=3, zorder=3)
    a1.plot([und['P']], [1.0], 'o', mfc='none', mec=C['ink'], ms=7, mew=0.9, zorder=4)
    a1.annotate('undecided at $P = 4/\\pi$', xy=(und['P'], 1.0), xytext=(und['P'] + 0.12, 1.55), fontsize=7, arrowprops={'arrowstyle': '-', 'lw': 0.5, 'color': C['ink2']})
    a1.set_xlabel('$P$')
    a1.set_ylabel('$\\bar H(P)$, $V = \\sin 2\\pi x$')
    a1.set_xlim(-0.05, 3.1)
    a1.set_ylim(0.85, 4.8)
    a1.grid(True, color='#e5e4e0', linewidth=0.3)
    a1.legend(handles=[Line2D([], [], color=C['blue'], marker='o', ms=3, lw=0, label='flat: $\\bar H = 1$ exactly (decided)'),
                       Line2D([], [], color=C['orange'], marker='s', ms=3, lw=0, label='rotating: a bracket narrower than the mark (decided)')],
              loc='upper left', frameon=False, fontsize=7)
    a2.semilogy([b['P'] for b in rot], [b['width'] for b in rot], 's-', color=C['orange'], ms=3, lw=0.8)
    a2.axvline(4 / math.pi, color=C['grey'], lw=0.6, ls='--')
    a2.set_xlabel('$P$')
    a2.set_ylabel('width of the bracket on $\\bar H(P)$')
    a2.set_xlim(1.2, 3.1)
    a2.set_ylim(5e-7, 5e-6)
    a2.grid(True, color='#e5e4e0', linewidth=0.3, which='both')
    fig.tight_layout()
    save(fig, 'hbar')


# ---- 3. Ferreira–Gomes–Üçer: the atlas, proved cells shaded by their contraction factor -------
def fig_regatlas():
    R = J('certs/regatlas.json')
    amps, eps = R['amps'], R['eps']
    find = {(c['A'], c['eps']): c for c in R['cells']}
    fig, ax = plt.subplots(figsize=(6.6, 1.9))
    for j, e in enumerate(eps):
        for i, A in enumerate(amps):
            c = find[(A, e)]
            if c['ok']:
                k = c['kappa']
                shade = C['seq'][min(12, int(k * 12))]
                ax.add_patch(Rectangle((i, j), 1, 1, facecolor=shade, edgecolor='white', lw=1.0))
                ax.text(i + 0.5, j + 0.5, '$\\kappa$ %.2f' % k, ha='center', va='center', fontsize=6.5, color='white' if k > 0.45 else C['ink'])
            else:
                ax.add_patch(Rectangle((i, j), 1, 1, facecolor='white', edgecolor=C['grey'], lw=0.6, hatch='////'))
                ax.text(i + 0.5, j + 0.5, '$Z_1$ %.2f' % c['Z1'], ha='center', va='center', fontsize=6.5, color=C['ink2'])
    ax.set_xlim(0, len(amps))
    ax.set_ylim(0, len(eps))
    ax.set_xticks([i + 0.5 for i in range(len(amps))])
    ax.set_xticklabels(['%g' % A for A in amps])
    ax.set_yticks([j + 0.5 for j in range(len(eps))])
    ax.set_yticklabels(['%g' % e for e in eps])
    ax.set_xlabel('$A$, the amplitude of $V = A\\cos 2\\pi x$')
    ax.set_ylabel('$\\varepsilon$')
    ax.tick_params(length=0)
    for s in ax.spines.values():
        s.set_visible(False)
    fig.tight_layout()
    save(fig, 'regatlas')


if __name__ == '__main__':
    fig_agtable()
    fig_hbar()
    fig_regatlas()
