"""Example 1: a design-wave figure. Buoy A's certified 100-year significant wave height by block.

Every level is an enclosure from cert-machine's certs/hseva-ledger.json (data/buoy-a.json, extracted with its sha256):
DECIDED, drawn as a knot. The delta method's 95% interval is float and asymptotic: COMPUTED, a dashed whisker. On the
annual maxima the choice of family is REFUSED (no certified fit for one of them): the void, and words.

    python examples/ex1_design_wave.py          writes examples/out/ex1_design_wave.svg (and -grey.svg)
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

NAMES = {'native': 'hourly', 'daily': 'daily', 'weekly': 'weekly', 'monthly': 'monthly', 'annual': 'annual'}
FAMILY = {'expweibull': 'exp. Weibull', 'lognormal': 'lognormal'}


def build(mode='colour'):
    wm.use(mode)
    with open(os.path.join(HERE, 'data', 'buoy-a.json'), encoding='utf-8') as fh:
        D = json.load(fh)
    series = {'expweibull': 0, 'lognormal': 1}
    offset = {'expweibull': -0.12, 'lognormal': 0.12}
    fig, ax = plt.subplots(figsize=(6.6, 3.0))
    ax.set_ylim(8, 22)
    ax.set_xlim(-0.6, len(D['blocks']) - 0.4)
    ax.grid(axis='y')
    for i, b in enumerate(D['blocks']):
        if b['verdict'] == 'REFUSED':
            wm.void(ax, i - 0.42, i + 0.42, 8, 22, words='choice refused:\nno certified exp. Weibull')
        for f, F in b['families'].items():
            if not F['certified']:
                continue
            lo, hi = (float(v) for v in F['levels']['100'])
            picked = b['pick'] == f
            x = i + offset[f]
            if picked and F['delta']:
                d0, d1 = (float(v) for v in F['delta']['100'])
                wm.whisker(ax, x, d0, d1, wm.COMPUTED, series=series[f])
            wm.knot(ax, x, hi, series=series[f], hollow=not picked, size=5.5 if picked else 4.5)
            if picked:
                ax.annotate('%.2f' % hi, (x, hi), xytext=(-6 if f == 'expweibull' else 6, 0), textcoords='offset points',
                            ha='right' if f == 'expweibull' else 'left', va='center', fontsize=6.5, color=wm.series_colour(series[f]))
    big = float(D['largestHour'])
    wm.line(ax, [-0.6, 3.5], [big, big], wm.DECIDED, width=0.8)
    ax.annotate('largest hour on record %.2f m' % big, (-0.55, big), xytext=(0, -8), textcoords='offset points', fontsize=6.5, color=wm.colour('ink-3'))
    ax.set_xticks(range(len(D['blocks'])))
    ax.set_xticklabels([NAMES[b['block']] for b in D['blocks']])
    ax.set_xlabel('the block the maxima are taken over (buoy A, %d years)' % D['years'])
    ax.set_ylabel('100-year Hs, m')
    wm.legend(ax, standings=(wm.COMPUTED, wm.REFUSED), glosses=False,
              series=[('exp. Weibull, A² pick (decided)', 0), ('lognormal, A² pick (decided)', 1), ('hollow: where A² picks the other', 0, True)],
              loc='upper left', bbox_to_anchor=(1.01, 1.0))
    fig.tight_layout()
    return fig


if __name__ == '__main__':
    out = os.path.join(HERE, 'out')
    os.makedirs(out, exist_ok=True)
    for mode, suffix in (('colour', ''), ('grey', '-grey')):
        build(mode).savefig(os.path.join(out, 'ex1_design_wave%s.svg' % suffix))
        plt.close('all')
