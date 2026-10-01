#!/usr/bin/env python3
"""breaking-waves-figs.py — the figures of the breaking-waves manuscript, drawn from the
records (never from a page): paper/tex/fig/breaking-waves-{laws,strata,duncan}.pdf.
Reads corpus/blacksea-breaking/blacksea_data.csv (the pinned table; every literal is the
double the record holds) and certs/breaking-ledger.json (the exact slopes, thresholds,
per-record coefficients and rank correlations). The lines drawn are the record's; the
points are the table's, placed in float because a figure is a drawing.
Palette and marks as tools/build-paper-figs.py.
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/breaking-waves-figs.py      MIT"""
import csv
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

C = {'blue': '#2a78d6', 'orange': '#eb6834', 'aqua': '#1baf7a', 'violet': '#4a3aa7', 'red': '#e34948', 'grey': '#9a9a96', 'light': '#d9d9d6', 'ink': '#0b0b0b', 'ink2': '#52514e'}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b', 'pdf.fonttype': 42})

with open(os.path.join(ROOT, 'certs', 'breaking-ledger.json'), 'r', encoding='utf-8') as f:
    L = json.load(f)
P = L['paper']
items = {it['id']: it for it in P['items']}
G = float(L['conventions']['g'])

rows = []
with open(os.path.join(ROOT, 'corpus', 'blacksea-breaking', 'blacksea_data.csv'), 'r', encoding='utf-8') as f:
    for r in csv.DictReader(f):
        rows.append(r)
assert len(rows) == L['n'], 'the CSV does not hold the ledger\'s n'
cb = [float(r['cm']) for r in rows]
x = [c * c / G for c in cb]                       # c_b^2 / g, m
Lb = [float(r['Pb_max']) / 2 for r in rows]       # L_b = P_b,max / 2, as the scripts define it
LD = [float(r['LD81']) for r in rows]
Dz = [float(r['Dz_max']) for r in rows]
Ab = [float(r['Ab_max']) for r in rows]
th = [float(r['theta']) for r in rows]
asp = [a / (l * l) for a, l in zip(Ab, LD)]

# ---- figure 1: the three laws against the data, with the self-similar tail ----
aLb, aLD, aDz = float(items['fitLb']['exact']), float(items['fitLD81']['exact']), float(items['fitDz']['exact'])
tTail = float(P['tails']['a']['threshold'][1])    # the upper end of the enclosed threshold: certainly at or above
aTail = float(items['fitLbTail']['exact'])
tail = [xi / li >= tTail for xi, li in zip(x, Lb)]
nTail = sum(tail)
print('tail events drawn:', nTail, '(ledger:', P['tails']['a']['above'], ')')

fig, axs = plt.subplots(1, 3, figsize=(6.7, 2.35))
for ax, ys, a, lab, panel in [(axs[0], Lb, aLb, r'$L_b$ (m)', 'a'), (axs[1], LD, aLD, r'$L_{D81}$ (m)', 'b'), (axs[2], Dz, aDz, r'$\Delta z_b$ (m)', 'c')]:
    xs_rest = [xi for xi, t in zip(x, tail) if not t] if panel == 'a' else x
    ys_rest = [yi for yi, t in zip(ys, tail) if not t] if panel == 'a' else ys
    ax.scatter(xs_rest, ys_rest, s=1.2, c=C['grey'], alpha=0.35, linewidths=0, rasterized=True, zorder=2)
    if panel == 'a':
        ax.scatter([xi for xi, t in zip(x, tail) if t], [yi for yi, t in zip(ys, tail) if t], s=2.5, c=C['orange'], alpha=0.8, linewidths=0, rasterized=True, zorder=3)
    xl = (min(x) * 0.9, max(x) * 1.1)
    ax.plot(xl, [a * v for v in xl], color=C['blue'], lw=1.1, zorder=4)
    if panel == 'a':
        ax.plot(xl, [aTail * v for v in xl], color=C['orange'], lw=1.1, zorder=4)
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_xlim(*xl)
    ax.set_ylim(min(ys) * 0.8, max(ys) * 1.25)
    ax.set_xlabel(r'$c_b^2/g$ (m)')
    ax.set_ylabel(lab)
    ax.tick_params(length=2, pad=1)
    ax.grid(True, which='major', color='#e5e4e0', linewidth=0.3)
    ax.text(0.03, 0.95, '(' + panel + ')', transform=ax.transAxes, va='top', ha='left', fontsize=8, color=C['ink'])
    ax.text(0.97, 0.05, r'$a$ = %.4f' % a, transform=ax.transAxes, va='bottom', ha='right', fontsize=7, color=C['blue'])
    if panel == 'a':
        ax.text(0.97, 0.14, r'tail: $a$ = %.4f' % aTail, transform=ax.transAxes, va='bottom', ha='right', fontsize=7, color=C['orange'])
fig.legend(handles=[Line2D([], [], color=C['blue'], lw=1.1, label='least squares through the origin, all events (exact)'),
                    Line2D([], [], color=C['orange'], lw=1.1, label=r'the same on the $c_b^2/(gL_b) \geq$ mean + 2 sd tail'),
                    Line2D([], [], marker='o', color='none', markerfacecolor=C['orange'], markersize=3, label='a tail event'),
                    Line2D([], [], marker='o', color='none', markerfacecolor=C['grey'], markersize=3, label='any other event')],
           loc='upper center', ncol=4, frameon=False, fontsize=6.5, bbox_to_anchor=(0.5, 1.0), handletextpad=0.4, columnspacing=1.0)
fig.tight_layout(rect=(0, 0, 1, 0.92))
fig.savefig(os.path.join(OUT, 'breaking-waves-laws.pdf'), dpi=220)
plt.close(fig)

# ---- figure 2: the stratification by sea state ----
PR = P['perRecord']
SEA = P['seaState']['spearman']
pooled = float(P['seaState']['pooledSlope'])
Hs = [float(p['Hs']) for p in PR]
Tp = [float(p['Tp']) for p in PR]
U = [float(p['U10']) for p in PR]
age = [G * t / (2 * math.pi * u) for t, u in zip(Tp, U)]   # c_p / U_10 for the drawing; the ledger's rank uses 1/(f_p U_10), the same order
slope = [float(p['slopeDec']) for p in PR]
n = [p['n'] for p in PR]
rough = [h > 1.5 for h in Hs]
size = [8 + 1.6 * math.sqrt(v) for v in n]
fig, axs = plt.subplots(2, 2, figsize=(6.7, 4.6))
for ax, xs, lab, key, panel in [(axs[0][0], Hs, r'$H_s$ of the record (m)', 'Hs', 'a'), (axs[0][1], Tp, r'$T_p$ of the record (s)', 'Tp', 'b'),
                                (axs[1][0], U, r'$U_{10}$ of the record (m s$^{-1}$)', 'U10', 'c'), (axs[1][1], age, r'wave age $c_p/U_{10}$', 'waveAge', 'd')]:
    ax.axhline(pooled, color=C['blue'], lw=1.0, ls='--', zorder=2)
    ax.scatter([v for v, r in zip(xs, rough) if not r], [s for s, r in zip(slope, rough) if not r], s=[z for z, r in zip(size, rough) if not r], c=C['aqua'], alpha=0.85, linewidths=0, zorder=3)
    ax.scatter([v for v, r in zip(xs, rough) if r], [s for s, r in zip(slope, rough) if r], s=[z for z, r in zip(size, rough) if r], c=C['orange'], alpha=0.9, linewidths=0, zorder=4)
    ax.set_xlabel(lab)
    ax.set_ylabel(r'$gL_b/c_b^2$ fitted on the record')
    ax.set_ylim(0.55, 1.2)
    ax.tick_params(length=2, pad=1)
    ax.grid(True, color='#e5e4e0', linewidth=0.3)
    rho = float(SEA['slope~' + key]['rho'][0])
    ax.text(0.03, 0.95, '(' + panel + ')  Spearman $\\rho$ = %s%.3f' % ('−' if rho < 0 else '', abs(rho)), transform=ax.transAxes, va='top', ha='left', fontsize=7.5, color=C['ink'])
fig.legend(handles=[Line2D([], [], marker='o', color='none', markerfacecolor=C['aqua'], markersize=5, label='one stereo record (area of the mark grows with its event count)'),
                    Line2D([], [], marker='o', color='none', markerfacecolor=C['orange'], markersize=5, label=r'the four records with $H_s > 1.5$ m'),
                    Line2D([], [], color=C['blue'], lw=1.0, ls='--', label='all %s events: %.4f' % (format(L['n'], ','), pooled))],
           loc='upper center', ncol=3, frameon=False, fontsize=6.5, bbox_to_anchor=(0.5, 1.0), handletextpad=0.4, columnspacing=1.0)
fig.tight_layout(rect=(0, 0, 1, 0.95))
fig.savefig(os.path.join(OUT, 'breaking-waves-strata.pdf'), dpi=220)
plt.close(fig)

# ---- figure 3: Duncan's band and ratio as the record treats them ----
A = L['duncan']['angle']
S = L['duncan']['aspect']
tC = float(P['tails']['c']['threshold'][0])
med = float(S['distribution']['median']['dec'])
fig, axs = plt.subplots(1, 2, figsize=(6.7, 2.3))
ax = axs[0]
edges = list(range(0, 46))
ax.hist(th, bins=edges, color=C['grey'], edgecolor='white', linewidth=0.3, zorder=2)
ax.axvspan(float(A['band'][0]), float(A['band'][1]), facecolor=C['aqua'], alpha=0.25, edgecolor='none', zorder=1)
ax.set_xlim(0, 45)
ax.set_ylim(0, None)
ax.set_xlabel(r'$\theta$, the column of the table (degrees)')
ax.set_ylabel('events per 1$^\\circ$')
ax.tick_params(length=2, pad=1)
ax.text(0.03, 0.95, '(a)', transform=ax.transAxes, va='top', ha='left', fontsize=8, color=C['ink'])
ax.text(float(A['band'][1]) + 0.6, ax.get_ylim()[1] * 0.93, 'Duncan (1981): %s$^\\circ$ to %s$^\\circ$\n%s of %s events inside' % (A['band'][0], A['band'][1], format(A['inside'], ','), format(L['n'], ',')), fontsize=6.5, color=C['ink2'], va='top', bbox=dict(facecolor='white', edgecolor='none', alpha=0.85, pad=1.2), zorder=5)
ax = axs[1]
w = 0.025
edges2 = [i * w for i in range(0, 81)]
ax.hist([min(v, 2 - 1e-9) for v in asp], bins=edges2, color=C['grey'], edgecolor='white', linewidth=0.3, zorder=2)
ax.axvline(float(S['reference']), color=C['aqua'], lw=1.3, zorder=3)
ax.axvline(med, color=C['ink2'], lw=0.9, ls='--', zorder=3)
ax.axvline(tC, color=C['orange'], lw=0.9, ls='--', zorder=3)
ax.set_xlim(0, 2)
ax.set_ylim(0, None)
ax.set_xlabel(r'$A_b/L_{D81}^2$ (events beyond 2 in the last bin)')
ax.set_ylabel('events per 0.025')
ax.tick_params(length=2, pad=1)
ax.text(0.03, 0.95, '(b)', transform=ax.transAxes, va='top', ha='left', fontsize=8, color=C['ink'])
top = ax.get_ylim()[1]
BB = dict(facecolor='white', edgecolor='none', alpha=0.85, pad=1.2)
ax.text(float(S['reference']) + 0.03, top * 0.60, 'Duncan (1981): %s' % S['reference'], fontsize=6.5, color=C['aqua'], va='top', bbox=BB, zorder=5)
ax.text(med + 0.03, top * 0.93, 'median %.3f' % med, fontsize=6.5, color=C['ink2'], va='top', bbox=BB, zorder=5)
ax.text(tC + 0.03, top * 0.67, 'mean + 2 sd: %.3f' % tC, fontsize=6.5, color=C['orange'], va='top', bbox=BB, zorder=5)
fig.tight_layout()
fig.savefig(os.path.join(OUT, 'breaking-waves-duncan.pdf'), dpi=220)
plt.close(fig)
for f in ['breaking-waves-laws.pdf', 'breaking-waves-strata.pdf', 'breaking-waves-duncan.pdf']:
    print('wrote paper/tex/fig/' + f, '(%.0f KB)' % (os.path.getsize(os.path.join(OUT, f)) / 1024))
