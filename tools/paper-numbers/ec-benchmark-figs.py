#!/usr/bin/env python3
"""tools/paper-numbers/ec-benchmark-figs.py — the figures of the ec-benchmark manuscript, drawn
from the records (never from the pages):
    paper/tex/fig/ec-benchmark-contours.pdf   dataset A, the eleven 20-year contours as the polygons
                                              their files denote, one of them with its outside hours,
                                              the self-crossing direct-sampling loop, the HD closing edge
    paper/tex/fig/ec-benchmark-counts.pdf     the 176 printed numbers against the exact counts
    paper/tex/fig/ec-benchmark-maxima.pdf     the highest Hs along each contour against the observed maximum
Reads certs/ecbench-ledger.json, corpus/ec-benchmark/claims.json, the pinned contour files and the
pinned datasets. Palette, marks and legends as tools/build-paper-figs.py. The drawing is float;
every count stated is the ledger's, and the script REFUSES when matplotlib's own point-in-path
count of a drawn contour, or the float crossing count of the drawn loop, does not reproduce the
decided one. The float cross-check it makes is written to paper/tex/fig/ec-benchmark-floatcheck.json
for the numbers builder to read.
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/ec-benchmark-figs.py         MIT"""
import json
import os
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.path import Path
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'paper', 'tex', 'fig')
CORPUS = os.path.join(ROOT, 'corpus', 'ec-benchmark')
os.makedirs(OUT, exist_ok=True)


def die(m):
    print('EC-BENCHMARK FIGURES REFUSED: ' + m, file=sys.stderr)
    sys.exit(1)


def J(rel):
    with open(os.path.join(ROOT, rel), 'r', encoding='utf-8') as f:
        return json.load(f)


# the categorical slots of the validated palette (dataviz skill, light surface), as tools/build-paper-figs.py
C = {'blue': '#2a78d6', 'orange': '#eb6834', 'aqua': '#1baf7a', 'violet': '#4a3aa7', 'red': '#e34948', 'grey': '#9a9a96', 'light': '#d9d9d6', 'ink': '#0b0b0b', 'ink2': '#52514e'}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b', 'pdf.fonttype': 42})

L = J('certs/ecbench-ledger.json')
CL = J('corpus/ec-benchmark/claims.json')
ORDER = [c['key'] for c in CL['contributions']]
CLASS = {c['key']: c['class'] for c in CL['contributions']}


def row(k, ds, T):
    for r in L['rows']:
        if r['contribution'] == k and r['dataset'] == ds and r['returnPeriod'] == T:
            return r
    die('no row for %s %s %d' % (k, ds, T))


def is_hs(h):
    import re
    return bool(re.search(r'wave\s*heig|^\s*hs\s*$|h_?s\b', h, re.I)) and not re.search(r'period|wind', h, re.I)


def read_contour(rel):
    """vertices in the canonical frame (u, h): u the second variable, h significant wave height — as the ledger reads them"""
    with open(os.path.join(CORPUS, rel), 'r', encoding='utf-8') as f:
        lines = [l.rstrip('\r\n') for l in f if l.strip()]
    head = [x.strip() for x in lines[0].split(';')]
    if is_hs(head[0]) and not is_hs(head[1]):
        hs_col = 0
    elif is_hs(head[1]) and not is_hs(head[0]):
        hs_col = 1
    else:
        die(rel + ': cannot tell which column is Hs')
    pts = []
    for l in lines[1:]:
        c = [x.strip() for x in l.split(';') if x.strip()]
        a, b = float(c[0]), float(c[1])
        pts.append((b, a) if hs_col == 0 else (a, b))
    return np.array(pts)


def read_dataset(rel):
    """(u, h) per hour, as the ledger reads them: A–C are (Hs, Tz) files, D–F are (wind, Hs) files"""
    with open(os.path.join(CORPUS, rel), 'r', encoding='utf-8') as f:
        lines = [l.rstrip('\r\n') for l in f if l.strip()]
    head = [x.strip() for x in lines[0].split(';')]
    hs_second = is_hs(head[1])
    u, h = [], []
    for l in lines[1:]:
        c = [x.strip() for x in l.split(';')]
        a, b = float(c[1]), float(c[2])
        if hs_second:
            h.append(a); u.append(b)
        else:
            u.append(a); h.append(b)
    return np.array(u), np.array(h)


def full_dataset(ds):
    up, hp = read_dataset('datasets/%s.txt' % ds)
    ur, hr = read_dataset('datasets-retained/%sr.txt' % ds)
    return np.concatenate([up, ur]), np.concatenate([hp, hr])


def polygon_closed(P):
    """the polygon the file denotes: closed from the last vertex to the first (a repeated first vertex is the same polygon)"""
    Q = P.copy()
    if len(Q) > 1 and Q[0][0] == Q[-1][0] and Q[0][1] == Q[-1][1]:
        Q = Q[:-1]
    return Q


def float_outside(P, u, h):
    """the organizers' test: matplotlib's point-in-path on the implicitly closed polygon"""
    inside = Path(P).contains_points(np.column_stack((u, h)))
    return int((~inside).sum())


def float_crossings(Q):
    """proper crossings between non-adjacent edges, in float, for the drawing only"""
    n = len(Q)
    X = []
    for i in range(n):
        a, b = Q[i], Q[(i + 1) % n]
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            c, d = Q[j], Q[(j + 1) % n]
            den = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0])
            if abs(den) < 1e-18:
                continue
            t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / den
            v = -((a[0] - b[0]) * (a[1] - c[1]) - (a[1] - b[1]) * (a[0] - c[0])) / den
            if 0 < t < 1 and 0 < v < 1:
                X.append((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))
    return X


def style(ax, title):
    ax.set_title(title, loc='left', fontsize=8)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.tick_params(length=2, pad=1)
    ax.grid(True, color='#eeede9', linewidth=0.4)


floatcheck = {'matplotlib': matplotlib.__version__, 'contours': []}


def fig_contours():
    u, h = full_dataset('A')
    n = len(u)
    if n != L['datasets']['A']['full']:
        die('dataset A has %d hours; the ledger says %d' % (n, L['datasets']['A']['full']))
    fig, axes = plt.subplots(2, 2, figsize=(7.0, 6.2))
    (a, b), (c, d) = axes
    # (a) the eleven 20-year contours over the hours
    a.scatter(u, h, s=0.4, color=C['grey'], alpha=0.25, linewidths=0, rasterized=True, zorder=1)
    for k in ORDER:
        r = row(k, 'A', 20)
        P = read_contour(r['file'])
        Q = polygon_closed(P)
        fo = float_outside(Q, u, h)
        lo, hi = r['counts']['full']['out'], r['counts']['full']['out'] + r['counts']['full']['on']
        if not (lo <= fo <= hi):
            die('matplotlib counts %d outside %s; the ledger decided %d (+%d on)' % (fo, r['id'], lo, hi - lo))
        floatcheck['contours'].append({'id': r['id'], 'exactOut': lo, 'exactOn': hi - lo, 'floatOut': fo})
        col = C['blue'] if CLASS[k] == 'total' else C['aqua']
        a.plot(np.append(Q[:, 0], Q[0, 0]), np.append(Q[:, 1], Q[0, 1]), color=col, linewidth=0.6, zorder=3)
    a.set_xlim(0, 20); a.set_ylim(0, 13)
    a.set_xlabel('zero-up-crossing period $T_z$ (s)'); a.set_ylabel('significant wave height $H_s$ (m)')
    style(a, '(a) dataset A: the eleven 20-year contours as polygons')
    a.legend(handles=[Line2D([0], [0], color=C['blue'], linewidth=1, label='total-exceedance construction'),
                      Line2D([0], [0], color=C['aqua'], linewidth=1, label='marginal-exceedance construction'),
                      Line2D([0], [0], marker='o', color='none', markerfacecolor=C['grey'], markersize=3, label='%s hourly sea states' % format(n, ','))],
             loc='upper left', fontsize=6.5, frameon=False)
    # (b) one contour with its outside hours
    r1 = row('1', 'A', 20)
    Q1 = polygon_closed(read_contour(r1['file']))
    inside = Path(Q1).contains_points(np.column_stack((u, h)))
    nout = int((~inside).sum())
    if nout != r1['counts']['full']['out'] or r1['counts']['full']['on'] != 0:
        die('the drawn outside set of %s has %d points; the ledger decided %d' % (r1['id'], nout, r1['counts']['full']['out']))
    b.scatter(u[inside], h[inside], s=0.4, color=C['grey'], alpha=0.25, linewidths=0, rasterized=True, zorder=1)
    b.plot(np.append(Q1[:, 0], Q1[0, 0]), np.append(Q1[:, 1], Q1[0, 1]), color=C['blue'], linewidth=0.7, zorder=3)
    b.plot(u[~inside], h[~inside], marker='o', markersize=2.2, color=C['orange'], markeredgecolor='none', linestyle='none', zorder=4)
    b.set_xlim(0, 20); b.set_ylim(0, 13)
    b.set_xlabel('zero-up-crossing period $T_z$ (s)'); b.set_ylabel('significant wave height $H_s$ (m)')
    style(b, '(b) contribution 1 (ISORM), 20-year: %d hours outside' % nout)
    b.legend(handles=[Line2D([0], [0], marker='o', color='none', markerfacecolor=C['orange'], markersize=3.5, label='outside the polygon (%d)' % nout),
                      Line2D([0], [0], marker='o', color='none', markerfacecolor=C['grey'], markersize=3, label='inside (%s)' % format(int(inside.sum()), ','))],
             loc='upper left', fontsize=6.5, frameon=False)
    # (c) the direct-sampling loop with its crossings
    rd = row('9 DS', 'A', 20)
    Qd = polygon_closed(read_contour(rd['file']))
    X = float_crossings(Qd)
    if len(X) != rd['polygon']['selfCrossings']:
        die('the float drawing finds %d crossings on %s; the ledger decided %d' % (len(X), rd['id'], rd['polygon']['selfCrossings']))
    c.scatter(u, h, s=0.4, color=C['grey'], alpha=0.18, linewidths=0, rasterized=True, zorder=1)
    c.plot(np.append(Qd[:, 0], Qd[0, 0]), np.append(Qd[:, 1], Qd[0, 1]), color=C['aqua'], linewidth=0.7, zorder=3)
    c.plot([x[0] for x in X], [x[1] for x in X], marker='D', markersize=4, markerfacecolor='none', markeredgecolor=C['orange'], markeredgewidth=0.8, linestyle='none', zorder=5)
    c.set_xlim(0, 20); c.set_ylim(0, 13)
    c.set_xlabel('zero-up-crossing period $T_z$ (s)'); c.set_ylabel('significant wave height $H_s$ (m)')
    style(c, '(c) contribution 9 DS, 20-year: %d crossings' % len(X))
    c.legend(handles=[Line2D([0], [0], color=C['aqua'], linewidth=1, label='the polygon, vertex to vertex as listed'),
                      Line2D([0], [0], marker='D', color='none', markerfacecolor='none', markeredgecolor=C['orange'], markersize=4, label='a proper self-crossing (decided; drawn in float)')],
             loc='upper left', fontsize=6.5, frameon=False)
    # (d) the HD contour's closing edge
    rh = row('4', 'A', 20)
    Qh = polygon_closed(read_contour(rh['file']))
    if rh['polygon']['closed'] or not rh['polygon']['closingEdgeCrosses'] or rh['polygon']['selfCrossings'] != 1:
        die('the HD closing-edge panel no longer matches the ledger')
    nh = len(Qh)
    d.scatter(u, h, s=3, color=C['grey'], alpha=0.5, linewidths=0, zorder=1)
    d.plot(Qh[:, 0], Qh[:, 1], color=C['blue'], linewidth=0.8, zorder=3)
    d.plot([Qh[-1, 0], Qh[0, 0]], [Qh[-1, 1], Qh[0, 1]], color=C['orange'], linewidth=0.9, linestyle='--', zorder=4)
    d.plot([Qh[0, 0]], [Qh[0, 1]], marker='o', markersize=4, color=C['ink'], linestyle='none', zorder=5)
    d.plot([Qh[-1, 0]], [Qh[-1, 1]], marker='s', markersize=4, color=C['ink'], linestyle='none', zorder=5)
    d.annotate('first vertex', xy=(Qh[0, 0], Qh[0, 1]), xytext=(4, -8), textcoords='offset points', fontsize=6.5, color=C['ink2'])
    d.annotate('last vertex (%d)' % nh, xy=(Qh[-1, 0], Qh[-1, 1]), xytext=(4, 4), textcoords='offset points', fontsize=6.5, color=C['ink2'])
    d.set_xlim(Qh[0, 0] - 0.12, Qh[-1, 0] + 0.14); d.set_ylim(Qh[0, 1] - 0.1, Qh[-1, 1] + 0.1)
    d.set_xlabel('zero-up-crossing period $T_z$ (s)'); d.set_ylabel('significant wave height $H_s$ (m)')
    style(d, '(d) contribution 4 (HDCM), 20-year: the tail')
    d.legend(handles=[Line2D([0], [0], color=C['blue'], linewidth=1, label='the listed polyline (%s vertices)' % format(nh, ',')),
                      Line2D([0], [0], color=C['orange'], linewidth=1, linestyle='--', label='the implicit closing edge')],
             loc='upper left', fontsize=6.5, frameon=False)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'ec-benchmark-contours.pdf'), dpi=200)
    plt.close(fig)


def check_boundary_rows():
    """the two contours with an observation exactly ON them: where does the float test put it?"""
    for ds in ('E', 'F'):
        r = row('2', ds, 1)
        if r['counts']['full']['on'] != 1:
            die('contribution 2 / %s / 1 no longer has one boundary point' % ds)
        u, h = full_dataset(ds)
        Q = polygon_closed(read_contour(r['file']))
        fo = float_outside(Q, u, h)
        lo, hi = r['counts']['full']['out'], r['counts']['full']['out'] + r['counts']['full']['on']
        if not (lo <= fo <= hi):
            die('matplotlib counts %d outside %s; the ledger decided %d (+1 on)' % (fo, r['id'], lo))
        floatcheck['contours'].append({'id': r['id'], 'exactOut': lo, 'exactOn': 1, 'floatOut': fo})


def fig_counts():
    cmp = L['comparisons']
    fig, ax = plt.subplots(figsize=(3.6, 3.6))
    ax.plot([-0.5, 40000], [-0.5, 40000], color=C['ink2'], linewidth=0.6, linestyle='--', zorder=1)
    for q in cmp:
        x, y = q['exact'], q['printed']
        if not q['agrees']:
            ax.plot(x, y, marker='s', markersize=5, markerfacecolor='none', markeredgecolor=C['orange'], markeredgewidth=0.9, linestyle='none', zorder=5)
        elif not q['exactlyEqual']:
            ax.plot(x, y, marker='D', markersize=5, markerfacecolor='none', markeredgecolor=C['aqua'], markeredgewidth=0.9, linestyle='none', zorder=5)
        else:
            ax.plot(x, y, marker='o', markersize=2.6, color=C['blue'], markeredgecolor='none', linestyle='none', zorder=3)
    ax.set_xscale('symlog', linthresh=1); ax.set_yscale('symlog', linthresh=1)
    ax.set_xlim(-0.5, 40000); ax.set_ylim(-0.5, 40000)
    ticks = [0, 1, 10, 100, 1000, 10000]
    ax.set_xticks(ticks); ax.set_yticks(ticks)
    ax.set_xticklabels([format(t, ',') for t in ticks]); ax.set_yticklabels([format(t, ',') for t in ticks])
    ax.set_xlabel('exact count (observations outside the polygon)')
    ax.set_ylabel('the number printed in the benchmark\'s Tables 5 and 6')
    ax.set_aspect('equal')
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    ax.tick_params(length=2, pad=1)
    dis = [q for q in cmp if not q['agrees']]
    near = [q for q in cmp if q['agrees'] and not q['exactlyEqual']]
    ax.annotate('contribution 3, 1-year,\nmean of A, B, C:\nprinted %s and %s,\nexact %s and %s' % (dis[0]['printed'], dis[1]['printed'], dis[0]['exact'], dis[1]['exact']),
                xy=(dis[0]['exact'], dis[0]['printed']), xytext=(400, 2.2), fontsize=6, color=C['ink2'], arrowprops=dict(arrowstyle='-', color=C['ink2'], linewidth=0.5))
    ax.annotate('contribution 2, 1-year, mean of D, E, F:\nprinted %s, exact %s, two hours ON' % (near[0]['printed'], near[0]['exact']),
                xy=(near[0]['exact'], near[0]['printed']), xytext=(1.3, 0.12), fontsize=6, color=C['ink2'], arrowprops=dict(arrowstyle='-', color=C['ink2'], linewidth=0.5))
    n_eq = sum(1 for q in cmp if q['exactlyEqual'])
    ax.legend(handles=[Line2D([0], [0], marker='o', color='none', markerfacecolor=C['blue'], markersize=4, label='printed = exact (%d)' % n_eq),
                       Line2D([0], [0], marker='D', color='none', markerfacecolor='none', markeredgecolor=C['aqua'], markersize=5, label='agrees within the boundary points (%d)' % len(near)),
                       Line2D([0], [0], marker='s', color='none', markerfacecolor='none', markeredgecolor=C['orange'], markersize=5, label='not the count of the file on record (%d)' % len(dis))],
              loc='upper left', fontsize=6, frameon=False)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'ec-benchmark-counts.pdf'))
    plt.close(fig)


def fig_maxima():
    DS = ['A', 'B', 'C', 'D', 'E', 'F']
    longT = lambda ds: 20 if ds in 'ABC' else 50
    fig, ax = plt.subplots(figsize=(7.0, 2.8))
    for i, ds in enumerate(DS):
        x = i + 1
        for k in ORDER:
            r = row(k, ds, longT(ds))
            xx = x + (ORDER.index(k) - 5) * 0.05
            y = float(r['polygon']['maxHs'])
            if CLASS[k] == 'total':
                ax.plot(xx, y, marker='o', markersize=3.6, color=C['blue'], markeredgecolor='white', markeredgewidth=0.3, linestyle='none', zorder=3)
            else:
                ax.plot(xx, y, marker='o', markersize=3.6, color=C['aqua'], markeredgecolor='white', markeredgewidth=0.3, linestyle='none', zorder=3)
        m = float(L['datasets'][ds]['maxHs']['full']['hs'])
        ax.plot([x - 0.32, x + 0.32], [m, m], color=C['orange'], linewidth=0.8, zorder=2)
        ax.plot(x + 0.36, m, marker='D', markersize=4, color=C['orange'], markeredgecolor='white', markeredgewidth=0.3, linestyle='none', zorder=4)
    ax.set_xlim(0.4, 6.7); ax.set_ylim(4, 20)
    ax.set_xticks(range(1, 7)); ax.set_xticklabels(['%s, %d-year' % (ds, longT(ds)) for ds in DS])
    ax.set_ylabel('significant wave height $H_s$ (m)')
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    ax.tick_params(length=2, pad=1)
    ax.grid(True, axis='y', color='#eeede9', linewidth=0.4)
    ax.legend(handles=[Line2D([0], [0], marker='o', color='none', markerfacecolor=C['blue'], markersize=4.5, label='highest $H_s$ along a total-exceedance contour'),
                       Line2D([0], [0], marker='o', color='none', markerfacecolor=C['aqua'], markersize=4.5, label='highest $H_s$ along a marginal-exceedance contour'),
                       Line2D([0], [0], marker='D', color=C['orange'], markerfacecolor=C['orange'], markersize=4, linewidth=0.8, label='the highest $H_s$ observed in the full dataset')],
              loc='upper left', ncol=1, fontsize=6.5, frameon=False)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'ec-benchmark-maxima.pdf'))
    plt.close(fig)


if __name__ == '__main__':
    fig_contours()
    check_boundary_rows()
    fig_counts()
    fig_maxima()
    with open(os.path.join(OUT, 'ec-benchmark-floatcheck.json'), 'w', encoding='utf-8') as f:
        json.dump(floatcheck, f, indent=1)
    print('wrote', sorted(x for x in os.listdir(OUT) if x.startswith('ec-benchmark')), 'matplotlib', matplotlib.__version__,
          'float cross-check on', len(floatcheck['contours']), 'contours')
