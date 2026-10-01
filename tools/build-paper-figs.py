#!/usr/bin/env python3
"""build-paper-figs.py — the figures of the three Elsevier manuscripts, drawn from the
records (never from the pages): paper/tex/fig/p1-*.pdf, p2-*.pdf, p3-*.pdf.
Reads certs/hseva-atlas.json, certs/hseva-ledger.json, certs/design-table-audit.json,
corpus/ww3-grid/meta.json, corpus/basemap/ne_50m_land.geojson (Natural Earth, public
domain), apps/contraprova/data/gate-ledger.json, apps/decidivel/data/decidivel-ledger.json.
Needs matplotlib (instruments/hseva/.venv has it).
usage: instruments/hseva/.venv/bin/python tools/build-paper-figs.py                    MIT"""
import json
import math
import os
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle
from matplotlib.collections import PatchCollection
from matplotlib.lines import Line2D

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'paper', 'tex', 'fig')
os.makedirs(OUT, exist_ok=True)


def J(rel):
    with open(os.path.join(ROOT, rel), 'r', encoding='utf-8') as f:
        return json.load(f)


# the categorical slots of the validated palette (dataviz skill, light surface): the first four
# clear every all-pairs check; a fifth category folds into grey, and "refused" is a hollow mark
C = {'expweibull': '#2a78d6', 'gengamma': '#eb6834', 'lognormal': '#1baf7a', 'gumbel': '#4a3aa7', 'other': '#9a9a96', 'refused': '#000000',
     'blue': '#2a78d6', 'orange': '#eb6834', 'aqua': '#1baf7a', 'violet': '#4a3aa7', 'red': '#e34948', 'grey': '#9a9a96', 'light': '#d9d9d6', 'ink': '#0b0b0b', 'ink2': '#52514e',
     'seq': ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b']}
FAMN = {'expweibull': 'exp. Weibull', 'gengamma': 'gen. gamma', 'lognormal': 'lognormal', 'gumbel': 'Gumbel', 'other': 'Weibull or normal', 'refused': 'refused'}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b', 'pdf.fonttype': 42})


def land_patches(ax):
    g = J('corpus/basemap/ne_50m_land.geojson')
    pats = []
    # thinned as the atlas page thins it: islands under 0.25 degrees across dropped, one vertex in three kept
    # (a cell here is 1 to 4 degrees; the full 1:50m coastline would make each map figure a megabyte)
    for f in g['features']:
        geom = f['geometry']
        polys = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
        for p in polys:
            ring = p[0]
            if len(ring) < 4:
                continue
            xs = [q[0] for q in ring]
            ys = [q[1] for q in ring]
            if max(xs) - min(xs) < 0.25 and max(ys) - min(ys) < 0.25:
                continue
            thin = ring[::3] if len(ring) > 30 else ring
            pats.append(Polygon([(round(q[0], 2), round(q[1], 2)) for q in thin], closed=True))
    ax.add_collection(PatchCollection(pats, facecolor='#ecebe7', edgecolor='#c8c7c2', linewidth=0.2, zorder=1))


def setup_map(ax, lat0=-78, lat1=82):
    ax.set_xlim(-180, 180)
    ax.set_ylim(lat0, lat1)
    ax.set_aspect('equal')
    ax.set_xticks([-180, -120, -60, 0, 60, 120, 180])
    ax.set_yticks([-60, -30, 0, 30, 60])
    ax.set_xticklabels(['180°W', '120°W', '60°W', '0°', '60°E', '120°E', '180°E'])
    ax.set_yticklabels(['60°S', '30°S', '0°', '30°N', '60°N'])
    ax.tick_params(length=2, pad=1)
    ax.grid(True, color='#e5e4e0', linewidth=0.3)
    land_patches(ax)


def cell_square(ax, c, color, size, hollow=False, z=3):
    # a cell drawn as a square centred on its node: 4° cells on the global lattice, 1° on the Brazilian margin
    half = size / 2
    ax.add_patch(Rectangle((c['lon'] - half, c['lat'] - half), size, size, facecolor='none' if hollow else color, edgecolor=color if hollow else 'none', linewidth=0.5 if hollow else 0, zorder=z))


def load_atlas():
    A = J('certs/hseva-atlas.json')
    M = J('corpus/ww3-grid/meta.json')
    rec = {c['id']: c for c in A['cells']}
    cells = []
    for m in M['cells']:
        if m['status'] != 'sea':
            continue
        r = rec[m['id']]
        c = dict(m)
        c['blocks'] = r['blocks']
        c['stat'] = (A.get('stat') or {}).get('cells', {}).get(m['id'])
        cells.append(c)
    return A, M, cells


def fam_color(f):
    return C[f] if f in ('expweibull', 'gengamma', 'lognormal', 'gumbel') else C['other']


def p1_map_choice(cells):
    fig, axes = plt.subplots(2, 1, figsize=(7.0, 6.4))
    for ax, blk in zip(axes, ['daily', 'monthly']):
        setup_map(ax)
        for c in cells:
            f = c['blocks'][blk]['rank']['ad']
            size = 1.0 if 'brazil1' in c['sets'] and 'global4' not in c['sets'] else 3.6
            if f == 'R':
                cell_square(ax, c, C['refused'], size, hollow=True, z=4)
            else:
                cell_square(ax, c, fam_color(f), size)
        ax.set_title('(%s) %s maxima' % ('a' if blk == 'daily' else 'b', blk), loc='left', fontsize=9)
    handles = [Line2D([0], [0], marker='s', color='none', markerfacecolor=C[k], markersize=7, label=FAMN[k]) for k in ['expweibull', 'gengamma', 'lognormal', 'gumbel', 'other']]
    handles.append(Line2D([0], [0], marker='s', color='none', markerfacecolor='none', markeredgecolor=C['refused'], markersize=7, label='choice refused'))
    axes[1].legend(handles=handles, loc='lower left', ncol=3, fontsize=7, frameon=False, bbox_to_anchor=(0, -0.42))
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'p1-map-choice.pdf'))
    plt.close(fig)


def p1_map_threshold(cells):
    # where a threshold rule (the generalized gamma past alpha = 500 called "the limit", the exponentiated
    # Weibull past 10^4, a boundary stop taken as the limit) names a different family or none, by block
    fig, ax = plt.subplots(1, 1, figsize=(7.0, 3.4))
    setup_map(ax)
    counts = {0: 0, 1: 0, 2: 0, 3: 0}
    shade = {1: C['seq'][3], 2: C['seq'][7], 3: C['seq'][11]}
    for c in cells:
        n = sum(1 for blk in ['daily', 'weekly', 'monthly'] if c['blocks'][blk]['naive'] != c['blocks'][blk]['rank']['ad'])
        counts[n] += 1
        size = 1.0 if 'brazil1' in c['sets'] and 'global4' not in c['sets'] else 3.6
        if n == 0:
            cell_square(ax, c, '#f2f1ee', size, z=2)
        else:
            cell_square(ax, c, shade[n], size)
    handles = [Line2D([0], [0], marker='s', color='none', markerfacecolor='#f2f1ee', markeredgecolor='#c8c7c2', markersize=7, label='same choice at every block (%d cells)' % counts[0])]
    for n in (1, 2, 3):
        handles.append(Line2D([0], [0], marker='s', color='none', markerfacecolor=shade[n], markersize=7, label='differs at %d block%s (%d)' % (n, '' if n == 1 else 's', counts[n])))
    ax.legend(handles=handles, loc='lower left', ncol=2, fontsize=7, frameon=False, bbox_to_anchor=(0, -0.5))
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'p1-map-threshold.pdf'))
    plt.close(fig)
    return counts


def p1_map_gev(cells):
    fig, axes = plt.subplots(2, 1, figsize=(7.0, 6.4))
    ax = axes[0]
    setup_map(ax)
    for c in cells:
        g = c['blocks']['daily'].get('gev')
        size = 1.0 if 'brazil1' in c['sets'] and 'global4' not in c['sets'] else 3.6
        if not g or g.get('c') != 1:
            cell_square(ax, c, C['refused'], size, hollow=True, z=4)
        elif g['x'][1] < 0:
            cell_square(ax, c, C['blue'], size)
        elif g['x'][0] > 0:
            cell_square(ax, c, C['red'], size)
        else:
            cell_square(ax, c, '#f0efec', size)
    ax.set_title('(a) the sign of the GEV shape ξ, daily maxima (certified; every box excludes zero)', loc='left', fontsize=9)
    ax.legend(handles=[Line2D([0], [0], marker='s', color='none', markerfacecolor=C['blue'], markersize=7, label='ξ < 0: a finite upper end'),
                       Line2D([0], [0], marker='s', color='none', markerfacecolor=C['red'], markersize=7, label='ξ > 0: a Fréchet-type tail'),
                       Line2D([0], [0], marker='s', color='none', markerfacecolor='none', markeredgecolor=C['refused'], markersize=7, label='GEV refused (ξ at −0.5)')],
              loc='lower left', ncol=3, fontsize=7, frameon=False, bbox_to_anchor=(0, -0.36))
    ax = axes[1]
    setup_map(ax)
    for c in cells:
        b = c['blocks']['daily']
        size = 1.0 if 'brazil1' in c['sets'] and 'global4' not in c['sets'] else 3.6
        if b['seven'] == 'gev':
            cell_square(ax, c, C['violet'], size)
        elif b['seven'] == 'R':
            cell_square(ax, c, C['refused'], size, hollow=True, z=4)
        else:
            cell_square(ax, c, '#f2f1ee', size, z=2)
    ax.set_title('(b) where Anderson–Darling among seven names the GEV, daily maxima', loc='left', fontsize=9)
    ax.legend(handles=[Line2D([0], [0], marker='s', color='none', markerfacecolor=C['violet'], markersize=7, label='the GEV decided'),
                       Line2D([0], [0], marker='s', color='none', markerfacecolor='#f2f1ee', markeredgecolor='#c8c7c2', markersize=7, label='one of the six decided'),
                       Line2D([0], [0], marker='s', color='none', markerfacecolor='none', markeredgecolor=C['refused'], markersize=7, label='refused')],
              loc='lower left', ncol=3, fontsize=7, frameon=False, bbox_to_anchor=(0, -0.36))
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'p1-map-gev.pdf'))
    plt.close(fig)


def p1_ratio(cells):
    # the decided family's 100-year level over the largest daily maximum of 32 years, every decided cell-block
    rs = []
    for c in cells:
        for blk in ['daily', 'weekly', 'monthly']:
            b = c['blocks'][blk]
            f = b['rank']['ad']
            if f != 'R' and b['fits'][f].get('l100'):
                rs.append(b['fits'][f]['l100'][1] / b['max'])
    fig, ax = plt.subplots(figsize=(7.0, 2.4))
    edges = [0.8 * (1.06 ** k) for k in range(0, 60)]
    ax.hist(rs, bins=edges, color=C['blue'], edgecolor='white', linewidth=0.3)
    ax.set_xscale('log')
    ax.set_xlim(0.8, 25)
    ax.set_xticks([0.8, 1, 1.5, 2, 3, 5, 10, 20])
    ax.set_xticklabels(['0.8', '1', '1.5', '2', '3', '5', '10', '20'])
    ax.axvline(1, color=C['ink2'], linewidth=0.6, linestyle='--')
    ax.set_xlabel('100-year level of the decided family ÷ the largest daily maximum on record (log scale)')
    ax.set_ylabel('cell-blocks')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.text(18.7, ax.get_ylim()[1] * 0.6, 'Arabian Sea\nmonsoon cells', ha='right', va='top', fontsize=7, color=C['ink2'])
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'p1-ratio.pdf'))
    plt.close(fig)


def p1_scipy():
    L = J('certs/hseva-ledger.json')
    S = L['scipy']['buoys']
    pts = {'floc0': [], 'default': []}
    ann = None
    for b, blocks in S.items():
        for blk, fams in blocks.items():
            for f, modes in fams.items():
                cert = L['buoys'][b]['blocks'][blk]['fits'][f]
                if not cert.get('certified'):
                    continue
                x = float(cert['returnLevel']['100']['hi'])
                for mode in ('floc0', 'default'):
                    e = modes.get(mode)
                    if not e or e.get('level100') is None:
                        continue
                    y = float(e['level100'])
                    pts[mode].append((x, y, e['verdict']))
                    if b == 'A' and blk == 'native' and f == 'expweibull':
                        if mode == 'default':
                            ann = (x, y)
    fig, ax = plt.subplots(figsize=(3.6, 3.6))
    ax.plot([3, 50], [3, 50], color=C['ink2'], linewidth=0.6, linestyle='--', zorder=1)
    for x, y, v in pts['floc0']:
        ax.plot(x, y, marker='o', markersize=4, color=C['blue'], markeredgecolor='white', markeredgewidth=0.4, linestyle='none', zorder=3)
    for x, y, v in pts['default']:
        ax.plot(x, y, marker='o', markersize=4, markerfacecolor='none', markeredgecolor=C['orange'], markeredgewidth=0.8, linestyle='none', zorder=4)
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_xlim(4, 50)
    ax.set_ylim(4, 50)
    ticks = [5, 10, 20, 40]
    ax.set_xticks(ticks)
    ax.set_yticks(ticks)
    ax.set_xticklabels([str(t) for t in ticks])
    ax.set_yticklabels([str(t) for t in ticks])
    ax.set_xlabel('certified 100-year $H_s$, location fixed at zero (m)')
    ax.set_ylabel('the same call printed by scipy (m)')
    ax.set_aspect('equal')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    if ann:
        ax.annotate('buoy A, hourly,\nexp. Weibull, location free', xy=ann, xytext=(5.2, 25), fontsize=6.5, color=C['ink2'], arrowprops=dict(arrowstyle='-', color=C['ink2'], linewidth=0.5))
    ax.legend(handles=[Line2D([0], [0], marker='o', color='none', markerfacecolor=C['blue'], markersize=5, label='location fixed at zero'),
                       Line2D([0], [0], marker='o', color='none', markerfacecolor='none', markeredgecolor=C['orange'], markersize=5, label='location free (the default call)')],
              loc='upper left', fontsize=6.5, frameon=False)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'p1-scipy.pdf'))
    plt.close(fig)


def p1_table():
    T = J('certs/design-table-audit.json')
    METH = {'gumbelLS': 'Gumbel LS', 'gumbelML': 'Gumbel ML', 'gumbelMOM': 'Gumbel MOM', 'gevML': 'GEV ML'}
    rows = []
    for q in T['rows']:
        c = q['cells'][0]
        for m in ['gumbelLS', 'gumbelML', 'gumbelMOM', 'gevML']:
            fam = 'gev' if m.startswith('gev') else 'gumbel'
            lev = next(x for x in T['summary']['levels'] if x['la'] == q['la'] and x['method'] == m)
            rows.append((q['name'] + ' · ' + METH[m], lev['printed'], lev['certified'], c[fam]['s100']))
    fig, ax = plt.subplots(figsize=(7.0, 4.6))
    ys = list(range(len(rows)))[::-1]
    for y, (name, printed, cert, s100) in zip(ys, rows):
        ax.plot([s100[0], s100[1]], [y, y], color='#c8c7c2', linewidth=3, solid_capstyle='butt', zorder=1)
        ax.plot([cert, printed], [y, y], color='#e5e4e0', linewidth=0.8, zorder=2)
        ax.plot(cert, y, marker='o', markersize=5, color=C['blue'], markeredgecolor='white', markeredgewidth=0.4, linestyle='none', zorder=3)
        ax.plot(printed, y, marker='D', markersize=4, color=C['orange'], markeredgecolor='white', markeredgewidth=0.4, linestyle='none', zorder=4)
    ax.set_yticks(ys)
    ax.set_yticklabels([r[0] for r in rows], fontsize=6.5)
    ax.set_xlabel('100-year significant wave height (m)')
    ax.set_xlim(2, 14)
    ax.grid(True, axis='x', color='#eeede9', linewidth=0.4)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(handles=[Line2D([0], [0], marker='o', color='none', markerfacecolor=C['blue'], markersize=5, label='certified maximum at the nearest public cell'),
                       Line2D([0], [0], marker='D', color='none', markerfacecolor=C['orange'], markersize=4, label='printed in the design table'),
                       Line2D([0], [0], color='#c8c7c2', linewidth=3, label='95% delta-method interval (statistical, not certified)')],
              loc='lower right', fontsize=6.5, frameon=False)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'p1-table.pdf'))
    plt.close(fig)


def p2_receipt():
    G = J('apps/contraprova/data/gate-ledger.json')
    lead = next(r for r in G['receipts'] if r['id'] == 'ia-mais-4-2')['receipt']
    fixed = next(r for r in G['receipts'] if r['id'] == 'ia-ajustada')['receipt']
    MC = G['mc']
    fig, axes = plt.subplots(2, 1, figsize=(7.0, 3.3), gridspec_kw={'height_ratios': [1.6, 1]})
    ax = axes[0]
    y1, y2 = 1.0, 0.0
    ax.axvline(MC['limit'], color=C['red'], linewidth=0.9, zorder=2)
    ax.text(MC['limit'] + 0.2, 1.62, 'the rule: 360 bar', color=C['red'], fontsize=7, va='center')
    # the proposal: proved enclosure, attained corners, the Monte Carlo range, the claim
    ax.plot([lead['enclosure'][0], lead['enclosure'][1]], [y1, y1], color=C['blue'], linewidth=6, solid_capstyle='butt', zorder=3)
    ax.plot([MC['min'], MC['max']], [y1 - 0.42, y1 - 0.42], color='#c8c7c2', linewidth=3, solid_capstyle='butt', zorder=3)
    ax.plot([MC['cornerBelow'], MC['cornerAbove']], [y1, y1], marker='|', markersize=12, color=C['ink'], linestyle='none', markeredgewidth=1.2, zorder=5)
    ax.plot(float(lead['claim']), y1, marker='D', markersize=5, color=C['orange'], markeredgecolor='white', linestyle='none', zorder=6)
    ax.text(lead['enclosure'][0] - 0.3, y1, 'proposal: $Q$ = 7,000 m³/d, $P_d$ = 206 bar\nproved enclosure [%.1f, %.1f]; corners at %.1f and %.1f' % (lead['enclosure'][0], lead['enclosure'][1], MC['cornerBelow'], MC['cornerAbove']), ha='right', va='center', fontsize=6.5)
    ax.text(MC['min'] - 0.3, y1 - 0.42, '%s uniform draws: %.1f to %.1f bar\n(%d above the rule)' % (format(MC['draws'], ','), MC['min'], MC['max'], MC['over']), ha='right', va='center', fontsize=6.5, color=C['ink2'])
    ax.plot([fixed['enclosure'][0], fixed['enclosure'][1]], [y2, y2], color=C['blue'], linewidth=6, solid_capstyle='butt', zorder=3)
    ax.plot(float(fixed['claim']), y2, marker='D', markersize=5, color=C['orange'], markeredgecolor='white', linestyle='none', zorder=6)
    ax.text(fixed['enclosure'][0] - 0.3, y2, 'the same flow at $P_d$ = 200 bar\nproved enclosure [%.1f, %.1f]' % (fixed['enclosure'][0], fixed['enclosure'][1]), ha='right', va='center', fontsize=6.5)
    ax.set_xlim(318, 366)
    ax.set_ylim(-0.6, 1.9)
    ax.set_yticks([])
    ax.set_xlabel('wellhead pressure $P_{wh}$ (bar)')
    for s in ('top', 'right', 'left'):
        ax.spines[s].set_visible(False)
    ax.legend(handles=[Line2D([0], [0], color=C['blue'], linewidth=6, label='proved enclosure over the declared box'),
                       Line2D([0], [0], marker='|', color='none', markeredgecolor=C['ink'], markersize=10, markeredgewidth=1.2, label='attained at a named input (witness)'),
                       Line2D([0], [0], marker='D', color='none', markerfacecolor=C['orange'], markersize=5, label='the proposer\'s number'),
                       Line2D([0], [0], color='#c8c7c2', linewidth=3, label='Monte Carlo range (statistical)')],
              loc='upper left', fontsize=6, frameon=False, ncol=2, bbox_to_anchor=(0, 1.08))
    # the flip thresholds: the verdict as a function of the pump discharge
    ax = axes[1]
    g, r = lead['flip']['pdGreen'], lead['flip']['pdRed']
    ax.add_patch(Rectangle((150, 0), g - 150, 1, facecolor=C['blue'], edgecolor='none'))
    ax.add_patch(Rectangle((g, 0), r - g, 1, facecolor='#d9d9d6', edgecolor='none'))
    ax.add_patch(Rectangle((r, 0), 250 - r, 1, facecolor=C['orange'], edgecolor='none'))
    ax.text((150 + g) / 2, 0.5, 'PROVED\n$P_d \\leq$ %.1f bar' % g, ha='center', va='center', fontsize=7, color='white')
    ax.text((g + r) / 2, 0.5, 'REFUSED', ha='center', va='center', fontsize=7, color=C['ink'])
    ax.text((r + 250) / 2, 0.5, 'REFUTED\n$P_d \\geq$ %.1f bar' % r, ha='center', va='center', fontsize=7, color='white')
    ax.axvline(206, color=C['ink'], linewidth=0.8, linestyle='--')
    ax.text(206.5, 1.08, 'proposal, 206 bar', fontsize=6.5, va='bottom')
    ax.axvline(200, color=C['ink'], linewidth=0.8, linestyle=':')
    ax.text(199.5, 1.08, '200 bar', fontsize=6.5, va='bottom', ha='right')
    ax.set_xlim(150, 250)
    ax.set_ylim(0, 1.5)
    ax.set_yticks([])
    ax.set_xlabel('pump discharge pressure $P_d$ (bar), the rule $P_{wh} \\leq 360$ bar, the box unchanged')
    for s in ('top', 'right', 'left'):
        ax.spines[s].set_visible(False)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'p2-receipt.pdf'))
    plt.close(fig)


def cls(v, t):
    if t <= v[0]:
        return 'P'
    if t > v[3]:
        return 'F'
    if v[1] is not None and v[2] is not None and v[1] < t <= v[2]:
        return 'R'
    return 'U'


def p3_maps():
    L = J('apps/decidivel/data/decidivel-ledger.json')
    nx, ny = len(L['axes']['phi']), len(L['axes']['sg'])
    panels = [('K0', 1.5, '(a) physical range only, θ = 1.5%'), ('K4', 1.5, '(b) CO$_2$-lean gas, uniform, frame measured, θ = 1.5%'), ('K1', 3.0, '(c) CO$_2$-rich gas, θ = 3%'), ('K4', 3.0, '(d) CO$_2$-lean gas, uniform, frame measured, θ = 3%')]
    COL = {'P': C['blue'], 'F': C['orange'], 'R': '#d9d9d6', 'U': 'white'}
    fig, axes = plt.subplots(2, 2, figsize=(7.0, 4.6))
    for ax, (k, th, title) in zip(axes.flat, panels):
        for j in range(ny):
            for i in range(nx):
                v = L['maps'][k][j * nx + i]
                c = cls(v, th)
                ax.add_patch(Rectangle((i, j), 1, 1, facecolor=COL[c], edgecolor='white', linewidth=0.4, hatch='////' if c == 'U' else None))
        ax.set_xlim(0, nx)
        ax.set_ylim(0, ny)
        ax.set_xticks([0, 10, 20, 30])
        ax.set_xticklabels(['0', '0.10', '0.20', '0.30'])
        ax.set_yticks([0, 3, 6, 9, 12])
        ax.set_yticklabels(['0', '0.12', '0.24', '0.36', '0.48'])
        ax.set_xlabel('porosity φ')
        ax.set_ylabel('injected gas saturation $S_g$')
        ax.set_title(title, loc='left', fontsize=8)
        ax.tick_params(length=2, pad=1)
    handles = [Rectangle((0, 0), 1, 1, facecolor=COL['P'], label='PROVED: detectable for every admissible model'),
               Rectangle((0, 0), 1, 1, facecolor=COL['F'], label='REFUTED: undetectable for every admissible model'),
               Rectangle((0, 0), 1, 1, facecolor=COL['R'], label='REFUSED: witnesses on both sides'),
               Rectangle((0, 0), 1, 1, facecolor='white', edgecolor='#52514e', hatch='////', label='not decided within the budget')]
    fig.legend(handles=handles, loc='lower center', ncol=2, fontsize=6.5, frameon=False, bbox_to_anchor=(0.5, -0.01))
    fig.tight_layout(rect=(0, 0.07, 1, 1))
    fig.savefig(os.path.join(OUT, 'p3-maps.pdf'))
    plt.close(fig)


def p3_headline():
    L = J('apps/decidivel/data/decidivel-ledger.json')
    H = L['headline']
    KL = {'K0': 'physical range only', 'K1': 'CO$_2$-rich gas (PVT)', 'K2': 'CO$_2$-lean gas (PVT)', 'K3': 'CO$_2$-lean, uniform', 'K4': 'CO$_2$-lean, uniform,\nframe measured'}
    fig, ax = plt.subplots(figsize=(7.0, 2.9))
    rows = H['table']
    ys = list(range(len(rows)))[::-1]
    for y, t in zip(ys, rows):
        v = t['range']
        ax.plot([v[0], v[3]], [y, y], color=C['blue'], linewidth=6, solid_capstyle='butt', zorder=2)
        if v[1] is not None and v[2] is not None:
            ax.plot([v[1], v[2]], [y, y], marker='|', markersize=12, color=C['ink'], linestyle='none', markeredgewidth=1.2, zorder=4)
    for k, dy in (('K0', 4), ('K4', 0)):
        m = next(x for x in H['mc15'][k] if x['draws'] == 10000)
        yy = dy - 0.38
        ax.plot([m['min'], m['max']], [yy, yy], color='#c8c7c2', linewidth=3, solid_capstyle='butt', zorder=2)
        ax.plot([m['p05'], m['p95']], [yy, yy], color='#9a9a96', linewidth=3, solid_capstyle='butt', zorder=3)
        ax.plot(m['median'], yy, marker='|', markersize=8, color='white', linestyle='none', markeredgewidth=1.2, zorder=4)
        ax.text(m['max'] + 0.08, yy, '10,000 draws: %.1f%% detect' % (100 * m['pDetect']), fontsize=6.5, va='center', color=C['ink2'])
    ax.axvline(1.5, color=C['red'], linewidth=0.9, zorder=1)
    ax.text(1.52, 4.75, 'θ = 1.5%', color=C['red'], fontsize=7)
    ax.set_yticks(ys)
    ax.set_yticklabels([KL[t['k']] for t in rows], fontsize=7)
    ax.set_xlim(-0.05, 6.2)
    ax.set_ylim(-0.9, 4.9)
    ax.set_xlabel('|Δ$I_p$/$I_p$| in the coquina cell (φ 0.13–0.15, Δ$S_g$ 0.15–0.30), per cent')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(handles=[Line2D([0], [0], color=C['blue'], linewidth=6, label='proved range of the smallest and largest change'),
                       Line2D([0], [0], marker='|', color='none', markeredgecolor=C['ink'], markersize=10, markeredgewidth=1.2, label='attained by a named model (witness)'),
                       Line2D([0], [0], color='#c8c7c2', linewidth=3, label='Monte Carlo: range, 5–95%, median (statistical)')],
              loc='upper right', fontsize=6.5, frameon=False)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'p3-headline.pdf'))
    plt.close(fig)


def p3_sign():
    L = J('apps/decidivel/data/decidivel-ledger.json')
    nx, ny = len(L['axes']['phi']), len(L['axes']['sg'])
    vals = [v for v in L['sign'] if v is not None]
    lo, hi = min(vals), max(vals)
    fig, ax = plt.subplots(figsize=(3.6, 2.9))
    seq = C['seq'][2:]
    for j in range(ny):
        for i in range(nx):
            v = L['sign'][j * nx + i]
            if v is None:
                ax.add_patch(Rectangle((i, j), 1, 1, facecolor='white', edgecolor='white', linewidth=0.4, hatch='////'))
            else:
                k = int((v - lo) / (hi - lo + 1e-12) * (len(seq) - 1))
                ax.add_patch(Rectangle((i, j), 1, 1, facecolor=seq[k], edgecolor='white', linewidth=0.4))
    ax.set_xlim(0, nx)
    ax.set_ylim(0, ny)
    ax.set_xticks([0, 10, 20, 30])
    ax.set_xticklabels(['0', '0.10', '0.20', '0.30'])
    ax.set_yticks([0, 3, 6, 9, 12])
    ax.set_yticklabels(['0', '0.12', '0.24', '0.36', '0.48'])
    ax.set_xlabel('porosity φ')
    ax.set_ylabel('injected gas saturation $S_g$')
    ax.tick_params(length=2, pad=1)
    sm = plt.cm.ScalarMappable(cmap=matplotlib.colors.ListedColormap(seq), norm=matplotlib.colors.Normalize(vmin=lo, vmax=hi))
    cb = fig.colorbar(sm, ax=ax, fraction=0.046, pad=0.04)
    cb.set_label('smallest gas density at which a proved\nmodel gains impedance (g/cm³)', fontsize=7)
    cb.ax.tick_params(labelsize=7)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'p3-sign.pdf'))
    plt.close(fig)


def p3_field():
    sys.path.insert(0, ROOT)
    # the benchmark's cells by verdict per gas-saturation row: the same arithmetic as apps/decidivel/numbers.js
    L = J('apps/decidivel/data/decidivel-ledger.json')
    Hst = J('corpus/unisim-iv/porosity-histogram.json')
    nx, ny = len(L['axes']['phi']), len(L['axes']['sg'])
    per = [0] * nx
    for k, counts in Hst['counts'].items():
        for i, c in enumerate(counts):
            per[min(i, nx - 1)] += c
    active = sum(per)
    COL = {'P': C['blue'], 'F': C['orange'], 'R': '#d9d9d6', 'U': 'white'}
    fig, axes = plt.subplots(1, 2, figsize=(7.0, 2.8), sharey=True)
    for ax, k, title in zip(axes, ['K0', 'K4'], ['(a) physical range only', '(b) CO$_2$-lean, uniform, frame measured']):
        for j in range(ny):
            o = {'P': 0, 'F': 0, 'R': 0, 'U': 0}
            for i in range(nx):
                o[cls(L['maps'][k][j * nx + i], 1.5)] += per[i]
            left = 0
            for c in ['P', 'R', 'F', 'U']:
                w = 100 * o[c] / active
                ax.barh(j, w, left=left, color=COL[c], edgecolor='white', linewidth=0.4, hatch='////' if c == 'U' else None, height=0.8)
                left += w
        ax.set_yticks(range(ny))
        ax.set_yticklabels(['%s–%s' % ('0' if float(s[0]) < 0.01 else s[0], s[1]) for s in L['axes']['sg']], fontsize=6.5)
        ax.set_xlim(0, 100)
        ax.set_xlabel('share of the %s active cells, θ = 1.5%%' % format(active, ','))
        ax.set_title(title, loc='left', fontsize=8)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.tick_params(length=2, pad=1)
    axes[0].set_ylabel('gas saturation of the front')
    handles = [Rectangle((0, 0), 1, 1, facecolor=COL['P'], label='PROVED'), Rectangle((0, 0), 1, 1, facecolor=COL['R'], label='REFUSED'), Rectangle((0, 0), 1, 1, facecolor=COL['F'], label='REFUTED'), Rectangle((0, 0), 1, 1, facecolor='white', edgecolor='#52514e', hatch='////', label='not decided')]
    fig.legend(handles=handles, loc='lower center', ncol=4, fontsize=6.5, frameon=False, bbox_to_anchor=(0.5, -0.02))
    fig.tight_layout(rect=(0, 0.08, 1, 1))
    fig.savefig(os.path.join(OUT, 'p3-field.pdf'))
    plt.close(fig)


if __name__ == '__main__':
    A, M, cells = load_atlas()
    p1_map_choice(cells)
    counts = p1_map_threshold(cells)
    p1_map_gev(cells)
    p1_ratio(cells)
    p1_scipy()
    p1_table()
    p2_receipt()
    p3_maps()
    p3_headline()
    p3_sign()
    p3_field()
    print('wrote', sorted(os.listdir(OUT)), 'threshold-differs cells', counts)
