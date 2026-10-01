#!/usr/bin/env python3
"""register-fig.py — the one figure of the register pre-paper, drawn from certs/claims-ledger.json:
(a) rows by defect kind, (b) the register as a dated diff (cumulative rows by the day a record first held them).
Nothing is typed; a register without dates or with a kind outside its own vocabulary refuses.
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/register-fig.py"""
import json, os, sys, datetime
import matplotlib
matplotlib.use('pdf')
import matplotlib.pyplot as plt

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'paper', 'tex', 'fig', 'register-kinds.pdf')
R = json.load(open(os.path.join(ROOT, 'certs', 'claims-ledger.json')))
rows = R['rows']
for r in rows:
    if r['kind'] not in R['kindsDefined']: sys.exit('REGISTER FIGURE REFUSED: a kind outside the vocabulary: ' + r['kind'])
    if len(r.get('recordedOn', '')) != 10: sys.exit('REGISTER FIGURE REFUSED: a row without a date: ' + r['id'])
decided = [r for r in rows if r['verdict'] != 'QUEUED']

INK, MUTED, GRID = '#222222', '#6b6b6b', '#d9d9d9'
HUE, HOLD = '#2f6f9f', '#b9b9b9'
plt.rcParams.update({'font.family': 'serif', 'font.size': 8.5, 'axes.edgecolor': GRID, 'axes.labelcolor': INK,
                     'xtick.color': MUTED, 'ytick.color': INK, 'xtick.labelsize': 8, 'ytick.labelsize': 8})
fig, (ax, bx) = plt.subplots(1, 2, figsize=(6.4, 2.7), gridspec_kw={'width_ratios': [1.35, 1], 'wspace': 0.55})

# (a) decided rows by kind — 'none' set apart, defects sorted by count, zero-row kinds of the vocabulary shown empty
by = {}
for r in decided: by[r['kind']] = by.get(r['kind'], 0) + 1
kinds = [k for k in R['kindsDefined'] if k != 'none']
kinds.sort(key=lambda k: (-by.get(k, 0), k))
labels = ['none (holds as printed)'] + [k.replace('-', ' ') for k in kinds]
vals = [by.get('none', 0)] + [by.get(k, 0) for k in kinds]
cols = [HOLD] + [HUE] * len(kinds)
y = list(range(len(labels)))[::-1]
ax.barh(y, vals, color=cols, height=0.62, linewidth=0)
for yi, v in zip(y, vals):
    ax.text(v + 0.8, yi, str(v) if v else 'none', va='center', ha='left', fontsize=7.5, color=INK if v else MUTED)
ax.set_yticks(y); ax.set_yticklabels(labels)
ax.set_xlim(0, max(vals) * 1.18)
ax.set_xlabel('decided rows of the register (%d)' % len(decided), color=MUTED)
for s in ('top', 'right'): ax.spines[s].set_visible(False)
ax.tick_params(axis='y', length=0)
ax.set_title('(a) what went wrong, by kind', loc='left', fontsize=9, color=INK)

# (b) the dated diff — cumulative rows by recordedOn
dates = sorted(set(r['recordedOn'] for r in rows))
cum, n = [], 0
for d in dates:
    n += sum(1 for r in rows if r['recordedOn'] == d); cum.append(n)
xs = [datetime.date.fromisoformat(d) for d in dates]
bx.step(xs, cum, where='post', color=HUE, linewidth=1.6)
bx.plot(xs, cum, 'o', color=HUE, markersize=3.2, markeredgecolor='white', markeredgewidth=0.6)
bx.set_ylim(0, max(cum) * 1.12); bx.set_ylabel('rows, cumulative', color=MUTED)
bx.set_xlim(xs[0] - datetime.timedelta(days=3), xs[-1] + datetime.timedelta(days=3))
for s in ('top', 'right'): bx.spines[s].set_visible(False)
bx.grid(axis='y', color=GRID, linewidth=0.6); bx.set_axisbelow(True)
months = sorted(R['byMonth'])
for m in months:
    first = datetime.date.fromisoformat(m + '-01')
    bx.axvline(first, color=GRID, linewidth=0.8, linestyle=(0, (3, 3)))
import matplotlib.dates as mdates
bx.xaxis.set_major_locator(mdates.DayLocator(bymonthday=(1, 15)))
bx.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
plt.setp(bx.get_xticklabels(), rotation=45, ha='right', fontsize=7.5)
big = max(dates, key=lambda d: sum(1 for r in rows if r['recordedOn'] == d))
bx.annotate('%d rows on %s' % (sum(1 for r in rows if r['recordedOn'] == big), big), xy=(datetime.date.fromisoformat(big), cum[dates.index(big)]),
            xytext=(-6, -22), textcoords='offset points', ha='right', fontsize=7.5, color=INK,
            arrowprops=dict(arrowstyle='-', color=MUTED, linewidth=0.6))
bx.set_title('(b) the dated diff', loc='left', fontsize=9, color=INK)

fig.savefig(OUT, bbox_inches='tight')
print('wrote', os.path.relpath(OUT, ROOT), '(%d rows, %d dates)' % (len(rows), len(dates)))
