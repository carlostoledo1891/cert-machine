"""Example 2: a return-level curve with the premises it rests on. Buoy A, monthly maxima.

The four certified levels (10, 50, 100 and 1000 years) of each family are DECIDED knots. The straight segments joining
them are one curve of the many the four knots admit: CHOSEN, dotted (WARRANT: a knot computed exactly is solid, the line
interpolated between two such knots is dotted). The delta method's intervals at 100 and 1000 years are COMPUTED. The
100-year design return period is a guide: it says nothing. The panel names what a level rests on.

    python examples/ex2_return_curve.py         writes examples/out/ex2_return_curve.svg (and -grey.svg)
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

FAMILY = {'expweibull': 'exp. Weibull', 'lognormal': 'lognormal'}


def build(mode='colour'):
    wm.use(mode)
    with open(os.path.join(HERE, 'data', 'buoy-a.json'), encoding='utf-8') as fh:
        D = json.load(fh)
    M = next(b for b in D['blocks'] if b['block'] == 'monthly')
    fig = plt.figure(figsize=(6.6, 3.0))
    ax = fig.add_axes([0.09, 0.15, 0.46, 0.78])
    side = fig.add_axes([0.60, 0.08, 0.39, 0.84])
    ax.set_xscale('log')
    ax.set_xlim(7, 1500)
    ax.set_ylim(6, 26)
    ax.grid(axis='y')
    wm.guide(ax, x=100)
    T = [int(t) for t in D['returnPeriods']]
    for idx, f in enumerate(('lognormal', 'expweibull')):
        F = M['families'][f]
        ys = [float(F['levels'][str(t)][1]) for t in T]
        wm.line(ax, T, ys, wm.CHOSEN, series=idx)
        for t, y in zip(T, ys):
            wm.knot(ax, t, y, series=idx, hollow=M['pick'] != f)
        if F['delta']:
            for t in (100, 1000):
                lo, hi = (float(v) for v in F['delta'][str(t)])
                wm.whisker(ax, t * (1.08 if idx else 0.93), lo, hi, wm.COMPUTED, series=idx)
    ax.set_xticks(T)
    ax.set_xticklabels([str(t) for t in T])
    ax.set_xlabel('return period, years (buoy A, monthly maxima)')
    ax.set_ylabel('return level Hs, m')
    split = D['split'] or {}
    ax.set_title('monthly pick: lognormal, given A²' if split.get('winners', {}).get('ad') == 'lognormal' else 'monthly maxima', fontsize=7.5, style='italic', loc='left')
    wm.legend(ax, standings=(wm.COMPUTED, wm.CHOSEN), glosses=False, series=[('lognormal (A² pick)', 0), ('exp. Weibull', 1, True)],
              extra=[(plt.Line2D([], [], color=wm.colour('guide'), linewidth=0.8, linestyle=(0, wm._pattern('GUIDE'))), 'guide: 100 years')],
              loc='upper left', fontsize=6)
    wm.premises(side, [
        (wm.ASSUMED, 'The record', 'NDBC hourly Hs, %s hours, pinned by sha256' % format(D['hours'], ',')),
        (wm.ASSUMED, 'Independence', 'monthly maxima as independent draws from one law'),
        (wm.ASSUMED, 'The estimator', 'maximum likelihood, no added location: a choice'),
        (wm.ASSUMED, 'The family', 'picked by A² on the same sample; tail untested'),
        (wm.ASSUMED, 'The return period', 'the record’s climate held for T years'),
    ])
    return fig


if __name__ == '__main__':
    out = os.path.join(HERE, 'out')
    os.makedirs(out, exist_ok=True)
    for mode, suffix in (('colour', ''), ('grey', '-grey')):
        build(mode).savefig(os.path.join(out, 'ex2_return_curve%s.svg' % suffix))
        plt.close('all')
