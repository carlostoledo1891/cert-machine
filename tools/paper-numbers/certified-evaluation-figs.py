#!/usr/bin/env python3
"""certified-evaluation-figs.py — the two figures of paper/tex/certified-evaluation.tex, drawn
from the records (never from the pages): paper/tex/fig/certified-evaluation-band.pdf and
paper/tex/fig/certified-evaluation-horizon.pdf.
Reads certs/envs-record.json (the false-accept curve), certs/gym-record.json (the band dial) and
certs/horizon-ledger.json (the certified horizons and the trend). The trend line is re-fitted here
from the fourteen certified midpoints and REFUSED if its slope leaves the ledger's enclosure, so
the drawing cannot disagree with the record it illustrates. Palette and rcParams are those of
tools/build-paper-figs.py. Needs matplotlib (instruments/hseva/.venv has it).
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/certified-evaluation-figs.py     MIT"""
import datetime as dt
import json
import math
import os
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'paper', 'tex', 'fig')
os.makedirs(OUT, exist_ok=True)


def J(rel):
    with open(os.path.join(ROOT, rel), 'r', encoding='utf-8') as f:
        return json.load(f)


def die(m):
    sys.stderr.write('PAPER FIGS REFUSED: ' + m + '\n')
    sys.exit(1)


C = {'blue': '#2a78d6', 'orange': '#eb6834', 'aqua': '#1baf7a', 'violet': '#4a3aa7', 'red': '#e34948', 'grey': '#9a9a96', 'light': '#d9d9d6', 'ink': '#0b0b0b', 'ink2': '#52514e'}
plt.rcParams.update({'font.size': 8, 'font.family': 'sans-serif', 'axes.linewidth': 0.5, 'xtick.major.width': 0.5, 'ytick.major.width': 0.5,
                     'axes.edgecolor': '#52514e', 'xtick.color': '#52514e', 'ytick.color': '#52514e', 'axes.labelcolor': '#0b0b0b', 'pdf.fonttype': 42})

# ------------------------------------------------------------------ figure 1: the band
R = J('certs/envs-record.json')
G = J('certs/gym-record.json')
tols = sorted(R['tolerancesProbed'], reverse=True)
graders = [(r'absolute tolerance', 'absolute', C['orange'], 'o'), (r'relative tolerance', 'relative', C['violet'], 's'),
           (r'exact match', 'exact', C['grey'], '^'), (r'certificate', 'enclosure', C['blue'], 'D')]
fig, (ax, bx) = plt.subplots(1, 2, figsize=(6.6, 2.5), gridspec_kw={'wspace': 0.32})
for label, key, col, mk in graders:
    g = next(x for x in R['graders'] if key in x['name'])
    byval = {float(k): v for k, v in g['falseAcceptByTolerance'].items()}   # the keys are JavaScript number strings
    ys = [100 * byval[t] for t in tols]
    ax.plot(tols, ys, color=col, marker=mk, markersize=3.2, linewidth=1.0, label=label)
ax.set_xscale('log')
ax.invert_xaxis()
ax.set_xlabel('tolerance (tighter to the right)')
ax.set_ylabel('false-accept rate, %')
ax.set_ylim(-3, 103)
ax.grid(True, color='#e5e4e0', linewidth=0.3)
ax.legend(frameon=False, fontsize=7, loc='center left')
ax.set_title('(a) false-accept rate against tolerance', fontsize=8, loc='left')

dial = G['dial']
reach = [d for d in dial if d['reachable'] and d['bandWidths'] > 0]
unreach = [d for d in dial if not d['reachable'] and d['bandWidths'] > 0]
bx.plot([d['tau'] for d in reach], [d['bandWidths'] for d in reach], color=C['blue'], marker='o', markersize=3.5, linewidth=1.0, label='breakable (a double fits)')
bx.plot([d['tau'] for d in unreach], [d['bandWidths'] for d in unreach], color=C['red'], marker='o', markerfacecolor='white', markersize=4, linewidth=0, label='no attack exists')
taus = [t / 1000.0 for t in range(501, 20000)] + [float(10 ** k) for k in range(2, 8)]
bx.plot(taus, [2 * t - 1 for t in taus], color=C['ink2'], linewidth=0.5, linestyle='--', label=r'$2\tau-1$')
bx.axvline(0.5, color=C['grey'], linewidth=0.5, linestyle=':')
bx.set_xscale('log')
bx.set_yscale('log')
bx.set_xlabel(r'$\tau=$ tolerance / certificate width')
bx.set_ylabel('band, in certificate widths')
bx.grid(True, color='#e5e4e0', linewidth=0.3)
bx.legend(frameon=False, fontsize=7, loc='upper left')
bx.set_title('(b) the band dial on %s' % G['dialFact']['id'], fontsize=8, loc='left')
fig.savefig(os.path.join(OUT, 'certified-evaluation-band.pdf'), bbox_inches='tight')
plt.close(fig)

# ------------------------------------------------------------------ figure 2: the horizons
H = J('certs/horizon-ledger.json')
t23 = H['trend']['certified']['from_2023_on']
intrend = set(t23['agents'])
live = [a for a in H['agents'].values() if a.get('live') and a.get('site')]
if len(live) != 23:
    die('expected 23 live agents, found %d' % len(live))
t0 = dt.date(2023, 1, 1)


def day(a):
    d = a['site'].get('release_date') or a.get('release_date')
    return (dt.date.fromisoformat(d) - t0).days


def mid(a):
    h = a['live']['horizons']['0.5']['minutes']
    return 0.5 * (h[0] + h[1])


xs = [day(a) for a in live if a['alias'] in intrend]
ys = [math.log2(mid(a)) for a in live if a['alias'] in intrend]
n = len(xs)
if n != t23['n']:
    die('the trend set has %d agents, the ledger says %d' % (n, t23['n']))
mx, my = sum(xs) / n, sum(ys) / n
slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
if not (t23['slopeBitsPerDay'][0] - 1e-9 <= slope <= t23['slopeBitsPerDay'][1] + 1e-9):
    die('the re-fitted slope %.12g is outside the ledger enclosure %s' % (slope, t23['slopeBitsPerDay']))
icpt = my - slope * mx

fig, ax = plt.subplots(figsize=(6.6, 3.0))
for a in live:
    x, m = day(a), mid(a)
    ci = a['site']['p50']['ci']
    ax.plot([x, x], ci, color=C['light'], linewidth=1.2, zorder=1)
    if a['alias'] in intrend:
        ax.plot(x, m, marker='o', markersize=4, color=C['blue'], zorder=3)
    else:
        ax.plot(x, m, marker='o', markersize=4, markerfacecolor='white', color=C['orange'], zorder=3)
    ax.plot(x, a['site']['p50']['estimate'], marker='_', markersize=5, color=C['ink2'], zorder=4, linewidth=0)
xl = [-40, max(day(a) for a in live) + 60]
ax.plot(xl, [2 ** (icpt + slope * x) for x in xl], color=C['blue'], linewidth=0.8, zorder=2)
ax.set_yscale('log', base=2)
ticks = [1, 4, 15, 60, 240, 960, 2880]
ax.set_yticks(ticks)
ax.set_yticklabels(['1 min', '4 min', '15 min', '1 h', '4 h', '16 h', '48 h'])
ax.axhline(960, color=C['grey'], linewidth=0.5, linestyle=':')
years = [dt.date(y, 1, 1) for y in (2023, 2024, 2025, 2026)]
ax.set_xticks([(y - t0).days for y in years])
ax.set_xticklabels([str(y.year) for y in years])
ax.set_xlim(xl)
ax.set_xlabel('release date')
ax.set_ylabel('certified 50% time horizon, human minutes')
ax.grid(True, color='#e5e4e0', linewidth=0.3)
dbl = t23['doublingDays'][0]
ax.text(0.02, 0.96, 'exact least-squares line through the %d filled points: doubling every %.3f days' % (n, dbl), transform=ax.transAxes, fontsize=7, va='top', color=C['ink2'])
ax.text(0.02, 0.89, 'filled: state of the art at release, under 16 h; hollow: not in the trend; grey bar: METR bootstrap interval; tick: METR point estimate', transform=ax.transAxes, fontsize=6.5, va='top', color=C['ink2'])
fig.savefig(os.path.join(OUT, 'certified-evaluation-horizon.pdf'), bbox_inches='tight')
plt.close(fig)
print('wrote paper/tex/fig/certified-evaluation-band.pdf and certified-evaluation-horizon.pdf (slope %.12g bits/day in the ledger enclosure)' % slope)
