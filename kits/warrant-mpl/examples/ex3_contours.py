"""Example 3: environmental contours over the hours they were scored on, and the witness.

Dataset A of the environmental-contour benchmark (Haselsteiner et al. 2021): the hours counted exactly into chosen
cells, drawn as the order ramp; three submitted 20-year contours as their files list them, DECIDED, on a paper casing
because they cross the field; the edge the benchmark's test adds to close an open file, CHOSEN, dotted. Nothing in this
figure is a witness, so the witness is shown in a second panel with a counterexample that IS one: a step the GSM8K
answer key prints that does not hold (cert-machine's certs/gsm8k-ledger.json).

    python examples/ex3_contours.py             writes examples/out/ex3_contours.svg (and -grey.svg)
"""
import json
import os
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import warrant_mpl as wm  # noqa: E402

CLASSES = [(1, 9), (10, 99), (100, 499), (500, 1999), (2000, None)]


def build(mode='colour'):
    wm.use(mode)
    with open(os.path.join(HERE, 'data', 'contours-a20.json'), encoding='utf-8') as fh:
        D = json.load(fh)
    with open(os.path.join(HERE, 'data', 'gsm8k-501.json'), encoding='utf-8') as fh:
        Q = json.load(fh)
    fig = plt.figure(figsize=(6.6, 3.4))
    ax = fig.add_axes([0.08, 0.13, 0.50, 0.82])
    F = D['field']
    shades = wm.field(ax, tuple(F['tz']), tuple(F['hs']), F['counts'], CLASSES)
    handles = []
    for i, c in enumerate(D['contours']):
        tz, hs = [float(v) for v in c['tz']], [float(v) for v in c['hs']]
        wm.line(ax, tz, hs, wm.DECIDED, series=i, on_field=True)
        if not c['closed']:
            wm.line(ax, [tz[-1], tz[0]], [hs[-1], hs[0]], wm.CHOSEN, series=i)
        wm.knot(ax, float(c['tzAtMaxHs']), float(c['maxHs']), series=i, size=5)
        handles.append(('%s · %s: %s outside (exact)' % (c['contribution'], c['method'], format(c['outside'], ',')), i))
    big = D['largestHour']
    ax.plot([float(big['u'])], [float(big['hs'])], linestyle='none', marker='o', markersize=4, markerfacecolor=wm.colour('paper'), markeredgecolor=wm.colour('ink'), markeredgewidth=0.8)
    ax.annotate('largest hour %.2f m' % float(big['hs']), (float(big['u']), float(big['hs'])), xytext=(5, 0), textcoords='offset points', va='center', fontsize=6, color=wm.colour('ink-2'))
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 12)
    ax.set_xlabel('zero-up-crossing period Tz, s')
    ax.set_ylabel('significant wave height Hs, m')
    side = fig.add_axes([0.60, 0.13, 0.39, 0.82])
    side.set_axis_off()
    wm.legend(side, standings=(wm.DECIDED, wm.CHOSEN), glosses=False, series=handles, extra=shades, loc='upper left', fontsize=6,
              title='%s hours, counted exactly per chosen cell' % format(D['hours'], ','), title_fontsize=6)
    # the witness, on a counterexample that is one: a printed step, at its printed value, beside its exact value
    w = fig.add_axes([0.62, 0.13, 0.35, 0.16])
    w.set_xlim(0, 320)
    w.set_ylim(-1, 1)
    w.set_yticks([])
    w.spines['left'].set_visible(False)
    w.set_xticks([0, int(Q['exact']), int(Q['printed']['rhs'])])
    w.tick_params(labelsize=6)
    wm.knot(w, int(Q['exact']), 0, series=0, size=4)
    w.annotate('exact', (int(Q['exact']), 0), xytext=(6, 0), textcoords='offset points', va='center', fontsize=6, color=wm.colour('ink'))
    wm.witness(w, int(Q['printed']['rhs']), 0, 'printed', fontsize=6, dx=-6).set_ha('right')
    w.set_title('GSM8K item %d prints %s = %s; it is %s' % (Q['item'], Q['printed']['lhs'], Q['printed']['rhs'], Q['exact']), fontsize=6, loc='left')
    return fig


if __name__ == '__main__':
    out = os.path.join(HERE, 'out')
    os.makedirs(out, exist_ok=True)
    for mode, suffix in (('colour', ''), ('grey', '-grey')):
        build(mode).savefig(os.path.join(out, 'ex3_contours%s.svg' % suffix))
        plt.close('all')
