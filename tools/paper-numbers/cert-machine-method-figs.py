#!/usr/bin/env python3
"""cert-machine-method-figs.py — the three benchmark figures of paper/tex/cert-machine-method.tex, drawn from the
records (never from the pages or the prose):
  paper/tex/fig/cert-machine-method-kissing.pdf   pairs decided and wall time per dimension (certs/kissing-wave.json)
  paper/tex/fig/cert-machine-method-ns.pdf        the Navier-Stokes timeline: the claimant's dates (corpus/navier-stokes/audit.json
                                                  processDates) above the line, the audit's (MANIFEST, build, upstream) below
  paper/tex/fig/cert-machine-method-graders.pdf   four graders' false-accept and false-reject rates (certs/envs-record.json)
Each figure REFUSES when the record does not say what the paper says beside it (19 WITNESSED rows; an exact enclosure
grader; a clean build at the pin). Palette and rcParams are those of tools/build-paper-figs.py.
usage: instruments/hseva/.venv/bin/python tools/paper-numbers/cert-machine-method-figs.py                      MIT"""
import datetime as dt
import json
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

# ------------------------------------------------------------------ figure 1: the kissing configurations
W = J('certs/kissing-wave.json')
rows = sorted([r for r in W['rows'] if r['claimant'] == 'qiushi'], key=lambda r: r['dim'])
if len(rows) != 19 or any(r['verdict'] != 'WITNESSED' or r['engine']['violations'] != 0 for r in rows):
    die('the wave record does not hold 19 WITNESSED Qiushi rows with no violation')


def path_of(r):
    p = r['engine']['families'][0]['path']
    if 'Triton' in p or 'CUDA' in p:
        return 'gpu'
    if r['dim'] == 38:
        return 'mixed'
    return 'desk'


col = {'desk': C['blue'], 'mixed': C['violet'], 'gpu': C['orange']}
lab = {'desk': 'float32 BLAS, laptop', 'mixed': 'float32 BLAS + exact int64 + integers, laptop', 'gpu': 'fused kernel, one GPU'}
x = list(range(len(rows)))
fig, (ax, bx) = plt.subplots(1, 2, figsize=(6.6, 2.4), gridspec_kw={'wspace': 0.3})
seen = set()
for i, r in enumerate(rows):
    k = path_of(r)
    ax.bar(i, r['engine']['pairs'], color=col[k], width=0.7, label=lab[k] if k not in seen else None)
    bx.bar(i, r['engine']['seconds'], color=col[k], width=0.7)
    seen.add(k)
for a, ylab, title in ((ax, 'pairs decided', '(a) every pair of each configuration'), (bx, 'wall-clock seconds', '(b) the time it took')):
    a.set_yscale('log')
    a.set_xticks(x)
    a.set_xticklabels([str(r['dim']) for r in rows], fontsize=6, rotation=90)
    a.set_xlabel('dimension')
    a.set_ylabel(ylab)
    a.grid(True, axis='y', color='#e5e4e0', linewidth=0.3)
    a.set_title(title, fontsize=8, loc='left')
ax.legend(frameon=False, fontsize=6.5, loc='upper left')
bx.annotate('includes a pause', xy=(rows.index(next(r for r in rows if r['dim'] == 45)), next(r for r in rows if r['dim'] == 45)['engine']['seconds']),
            xytext=(0, 6), textcoords='offset points', fontsize=6, ha='center', color=C['ink2'])
fig.savefig(os.path.join(OUT, 'cert-machine-method-kissing.pdf'), bbox_inches='tight')
plt.close(fig)

# ------------------------------------------------------------------ figure 2: the Navier-Stokes timeline
A = J('corpus/navier-stokes/audit.json')
M = J('corpus/navier-stokes/MANIFEST.json')
B = J('corpus/navier-stokes/build.json')
U = J('corpus/navier-stokes/upstream-f9e8bc5b.json')
if B.get('exitCode') != 0 or not (U['decided']['atPin']['formal'] is False and U['decided']['atHead']['formal'] is True):
    die('the Navier-Stokes records no longer say: built clean at the pin, the clause formal only at the head')


def day(s):
    return dt.date.fromisoformat(str(s)[:10])


short = {
    '2026-05-15': "Formal Conjectures writes the Lean statement of Clay's four alternatives",
    '2026-07-27': 'last change to that statement (the revision OpenAI pinned)',
    '2026-08-15': 'Alpöge–Buckmaster: smooth-forcing blowup for Boussinesq and Euler',
    '2026-08-22': "Alpöge–Buckmaster's Lean verification",
    '2026-08-28': 'OpenAI begins training the model used',
    '2026-09-01': 'OpenAI launches the agent effort',
    '2026-09-03': "Tao's post; Buckmaster writes to OpenAI",
    '2026-09-05': "the agents 'arrive at their resolution' (88 hours in)",
    '2026-09-06': 'Lean formalisation complete (17 hours later)',
    '2026-09-08': 'the repository, its one commit, the announcement',
}
events = []
seen = set()
for e in A['processDates']:
    d = day(e['date'])
    if d in seen:
        continue
    seen.add(d)
    events.append((d, short.get(d.isoformat(), e['event'][:60]), 'claimant'))
events.append((day(M['fetched']), 'the corpus pinned and built here; the reading: one clause absent — PARTIAL', 'audit'))
events.append((day(U['checkedOn']), 'the next upstream commit decided: the clause proved — CERTIFIED', 'audit'))
events.sort()
fig, ax = plt.subplots(figsize=(6.6, 3.0))
n = len(events)
for k, (d, text, who) in enumerate(events):
    y = n - 1 - k
    c = C['blue'] if who == 'audit' else C['ink2']
    ax.plot(0, y, 's' if who == 'audit' else 'o', color=c, markersize=3.5)
    ax.text(-0.04, y, d.strftime('%Y-%m-%d'), ha='right', va='center', fontsize=6.8, color=c, family='monospace')
    ax.text(0.04, y, text, ha='left', va='center', fontsize=6.8, color=c)
ax.plot([0, 0], [-0.5, n - 0.5], color=C['light'], linewidth=0.8, zorder=0)
ax.set_xlim(-0.6, 3.2)
ax.set_ylim(-0.7, n - 0.3)
ax.axis('off')
ax.text(-0.6, n - 0.1, 'the claimant and the field, as the audit recorded their statements', fontsize=6.5, color=C['ink2'], va='bottom')
ax.text(3.2, n - 0.1, 'this audit', fontsize=6.5, color=C['blue'], va='bottom', ha='right')
ax.text(-0.6, -0.65, 'rows evenly spaced, not to scale', fontsize=6, color=C['grey'], va='top')
fig.savefig(os.path.join(OUT, 'cert-machine-method-ns.pdf'), bbox_inches='tight')
plt.close(fig)

# ------------------------------------------------------------------ figure 3: the graders
E = J('certs/envs-record.json')
G = E['graders']
enc = next(g for g in G if g['name'].startswith('enclosure'))
if enc['falseAccept'] != 0 or enc['falseReject'] != 0:
    die('the enclosure grader is no longer exact on every submission')
names = [g['name'].split(' (')[0].replace('-', ' ') for g in G]
fa = [100 * g['falseAccept'] for g in G]
fr = [100 * g['falseReject'] for g in G]
fig, ax = plt.subplots(figsize=(4.2, 2.2))
xs = list(range(len(G)))
ax.bar([i - 0.19 for i in xs], fa, width=0.36, color=C['orange'], label='accepts, of %s provably wrong' % format(E['provablyWrong'], ','))
ax.bar([i + 0.19 for i in xs], fr, width=0.36, color=C['blue'], label='rejects, of %s provably right' % format(E['provablyRight'], ','))
for i in xs:
    ax.text(i - 0.19, fa[i] + 1.5, '%.1f%%' % fa[i], ha='center', fontsize=6, color=C['ink2'])
    ax.text(i + 0.19, fr[i] + 1.5, '%.1f%%' % fr[i], ha='center', fontsize=6, color=C['ink2'])
ax.set_xticks(xs)
ax.set_xticklabels(names, fontsize=6.5)
ax.set_ylabel('%')
ax.set_ylim(0, 105)
ax.grid(True, axis='y', color='#e5e4e0', linewidth=0.3)
ax.legend(frameon=False, fontsize=6.5, loc='upper right')
fig.savefig(os.path.join(OUT, 'cert-machine-method-graders.pdf'), bbox_inches='tight')
plt.close(fig)
print('wrote 3 figures to paper/tex/fig/')
