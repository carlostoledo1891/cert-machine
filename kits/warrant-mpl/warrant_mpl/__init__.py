"""warrant_mpl: WARRANT's print register for matplotlib (a proposal, 2026-10-29).

Ink on white paper. A mark's STANDING is carried by its stroke and nothing else:

    DECIDED    solid            an exact decision backs it (an enclosure, an exact comparison, a proof)
    COMPUTED   dashed 5 4       float, a solver's tolerance, a fit, a number someone printed
    CHOSEN     dotted 1 5       one member of a set the data admit, picked by something that is not the data
               (round caps)
    REFUSED    no mark          the instrument declined or the input is missing: a hatched void and the sign
                                for the empty set in words, never a zero, never a gap

The guide pattern 2 3 is for rulers and leaders and says nothing. The witness red goes only on a cross beside words,
for a counterexample that is shown. At most three series are compared in one figure, each with its own colour and
marker, so a greyscale copy loses nothing. The order ramp is for fields. The premise ladder says what a number rests on.

Every value here is read from register.json, which cert-machine's design/print/kit.js GENERATES from the register
(design/print/tokens.js), the dash patterns (design/grammar.js) and the legend's words (playground/warrant.js).
Nothing is typed by hand, and the dash patterns are never scaled by line width.

MIT licensed. Part of cert-machine (github.com/carlostoledo1891/cert-machine).
"""
import json
import os

import matplotlib as mpl
from matplotlib.lines import Line2D
from matplotlib.patches import Patch, PathPatch, Rectangle
from matplotlib.path import Path

__all__ = ['DECIDED', 'COMPUTED', 'CHOSEN', 'REFUSED', 'ASSUMED', 'VERIFIED', 'COMPARED', 'VALIDATED', 'REGISTER',
           'use', 'colour', 'dashes', 'line', 'knot', 'whisker', 'guide', 'void', 'witness', 'field', 'legend',
           'premises', 'series_colour']

_HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(_HERE, 'register.json'), encoding='utf-8') as _fh:
    REGISTER = json.load(_fh)

DECIDED, COMPUTED, CHOSEN, REFUSED = 'DECIDED', 'COMPUTED', 'CHOSEN', 'REFUSED'
ASSUMED, VERIFIED, COMPARED, VALIDATED = 0, 1, 2, 3
_P = REGISTER['patterns']
_ST = {s['standing']: s for s in REGISTER['standings']}
_LG = {g['standing']: g for g in REGISTER['legend']}
LINE_PT = REGISTER['line_pt']
_state = {'mode': 'colour', 'identity_hue': True}
_STROKE_KW = ('linestyle', 'ls', 'dashes', 'color', 'c', 'alpha', 'dash_capstyle')


def use(mode='colour', identity_hue=True):
    """Apply the register's rcParams. mode 'colour', or 'grey' (each colour its greyscale value, as a mono laser
    prints it). identity_hue=False draws the second series in ink-2 instead of the proposed print blue."""
    if mode not in ('colour', 'grey'):
        raise ValueError("mode is 'colour' or 'grey'")
    mpl.style.use(os.path.join(_HERE, 'warrant-print.mplstyle' if mode == 'colour' else 'warrant-grey.mplstyle'))
    # the faces the style names that are installed here, as one fallback chain ending in DejaVu Sans (always shipped
    # with matplotlib, and it has the empty-set sign and the cross), so a missing face is skipped without a warning
    from matplotlib import font_manager
    have = {f.name for f in font_manager.fontManager.ttflist}
    chain = [f for f in mpl.rcParams['font.sans-serif'] if f in have and f != 'DejaVu Sans'] + ['DejaVu Sans']
    mpl.rcParams['font.family'] = chain
    _state['mode'] = mode
    _state['identity_hue'] = bool(identity_hue)


def colour(token):
    """A register colour by name ('ink', 'ink-3', 'witness', 'o-3', ...), in the current mode."""
    t = REGISTER['tokens'][token.lstrip('-')]
    return '#' + (t['grey'] if _state['mode'] == 'grey' else t['hex']).lstrip('#')


def _pattern(name):
    return tuple(float(v) for v in _P[name].split())


def dashes(standing, width=None):
    """The dash sequence a standing takes at a stroke width, in points: design/grammar.js's patterns and its rule
    (below SMALL_BELOW the short variant), never a scaled pattern. None for a solid stroke."""
    w = LINE_PT if width is None else width
    small = w < _P['SMALL_BELOW']
    if standing == DECIDED:
        return None
    if standing == COMPUTED:
        return _pattern('CLAIM_SM' if small else 'CLAIM')
    if standing == CHOSEN:
        return _pattern('PICK_SM' if small else 'PICK')
    if standing == REFUSED:
        raise ValueError('a REFUSED mark has no stroke: draw void() and say what was refused in words')
    raise ValueError('unknown standing %r' % (standing,))


def _identity(series):
    ids = REGISTER['identity']
    if not 0 <= series < len(ids):
        raise ValueError('at most %d series are compared in one figure (WARRANT v2.2 rule 4)' % len(ids))
    return ids[series]


def series_colour(series):
    """The colour of the n-th series compared in a figure (0, 1, 2)."""
    i = _identity(series)
    tok = i['fallback'] if (i.get('fallback') and not _state['identity_hue']) else i['token']
    return colour(tok)


def _refuse_stroke_kwargs(kw):
    bad = [k for k in _STROKE_KW if k in kw]
    if bad:
        raise TypeError('the stroke is read from the standing and the series, never chosen by the caller: drop %s' % ', '.join(bad))


def line(ax, x, y, standing=DECIDED, series=None, width=None, on_field=False, label=None, zorder=3, **kw):
    """A line whose stroke says its standing. series (0, 1, 2) takes that series' colour; without one, the standing's
    own tone (decided ink, computed ink-3, chosen ink-2). on_field draws a paper casing under it, for a line over a
    ramp field."""
    _refuse_stroke_kwargs(kw)
    w = LINE_PT if width is None else width
    d = dashes(standing, w)
    c = series_colour(series) if series is not None else colour(_ST[standing]['token'])
    if on_field:
        ax.plot(x, y, color=colour('paper'), linewidth=w + 2, solid_capstyle='round', solid_joinstyle='round', zorder=zorder - 0.05)
    (ln,) = ax.plot(x, y, color=c, linewidth=w, linestyle='-' if d is None else (0, d),
                    dash_capstyle=_ST[standing]['cap'], solid_capstyle='butt', solid_joinstyle='round', label=label, zorder=zorder, **kw)
    return ln


def whisker(ax, x, lo, hi, standing=COMPUTED, series=None, width=None, zorder=3):
    """An interval drawn as a vertical line from lo to hi, in its standing's stroke."""
    return line(ax, [x, x], [lo, hi], standing, series=series, width=width, zorder=zorder)


def knot(ax, x, y, series=0, hollow=False, size=5, on_field=False, label=None, zorder=4):
    """A decided value at a point: its series' colour and marker. hollow is a figure's own second meaning (say it in
    the legend). A value that is not decided is drawn as a line or whisker in its standing, not as a knot."""
    i = _identity(series)
    c = series_colour(series)
    if on_field:
        ax.plot([x], [y], linestyle='none', marker=i['marker'], markersize=size + 2.5, markerfacecolor=colour('paper'),
                markeredgecolor=colour('paper'), markeredgewidth=0.8, zorder=zorder - 0.05)
    (m,) = ax.plot([x], [y], linestyle='none', marker=i['marker'], markersize=size, markerfacecolor=colour('paper') if hollow else c,
                   markeredgecolor=c, markeredgewidth=0.8 if not hollow else 1.0, label=label, zorder=zorder)
    return m


def guide(ax, x=None, y=None, width=0.8, zorder=1):
    """A ruler at x (vertical) or y (horizontal) in the guide pattern 2 3: it says nothing."""
    if (x is None) == (y is None):
        raise ValueError('a guide is at an x or at a y')
    kw = dict(color=colour('guide'), linewidth=width, linestyle=(0, _pattern('GUIDE')), zorder=zorder)
    return ax.axvline(x, **kw) if x is not None else ax.axhline(y, **kw)


def void(ax, x0, x1, y0=None, y1=None, words=None, fontsize=6.5, zorder=1):
    """REFUSED: no mark. A hatched void over [x0, x1] x [y0, y1] (the full height by default), and the words that say
    what was refused, after the sign for the empty set. Never a zero, never a gap."""
    if not words or not str(words).strip():
        raise ValueError('the void is drawn with words: say what was refused')
    if y0 is None or y1 is None:
        y0, y1 = ax.get_ylim()
    v = _ST[REFUSED]['void']
    r = Rectangle((x0, y0), x1 - x0, y1 - y0, facecolor=colour('paper'), edgecolor=colour(v['edge']), hatch='////', linewidth=0.6, zorder=zorder)
    ax.add_patch(r)
    ax.text((x0 + x1) / 2, y1 - 0.04 * (y1 - y0), v['glyph'] + ' ' + str(words), ha='center', va='top', fontsize=fontsize,
            color=colour('ink'), zorder=zorder + 0.5, bbox=dict(facecolor=colour('paper'), edgecolor='none', pad=1.5), wrap=True)
    return r


def witness(ax, x, y, words, dx=6, fontsize=7, zorder=6):
    """The witness: the one red, on a cross at (x, y), beside the words that say what it shows (WARRANT rule 5). Only
    for a counterexample that is SHOWN, to a claim someone made about that object's own record; never a region, a
    verdict word, a scalar comparison or a refutation reached by deduction."""
    if not words or not str(words).strip():
        raise ValueError('the witness is a cross beside words (WARRANT rule 5): say what it shows')
    ax.text(x, y, '×', color=colour('witness'), fontweight='bold', fontsize=fontsize + 4, ha='center', va='center', zorder=zorder)
    return ax.annotate(str(words), (x, y), xytext=(dx, 0), textcoords='offset points', va='center', fontsize=fontsize,
                       color=colour('ink'), zorder=zorder)


def field(ax, x, y, counts, classes, zorder=0.5):
    """An order-ramp field. x = (x0, x1, nx), y = (y0, y1, ny): the cells; counts: ny rows of nx (or a flat list,
    row by row from y0); classes: up to five (lo, hi) bounds, hi None for no upper end. Each class is one path in its
    ramp step, darker with magnitude. Empty cells stay paper. Returns the legend handles, one per class."""
    x0, x1, nx = x
    y0, y1, ny = y
    flat = [v for row in counts for v in row] if counts and isinstance(counts[0], (list, tuple)) else list(counts)
    if len(flat) != nx * ny:
        raise ValueError('counts has %d cells, the grid %d' % (len(flat), nx * ny))
    ramp = REGISTER['ramp']
    if not 1 <= len(classes) <= len(ramp):
        raise ValueError('a field has 1 to %d classes' % len(ramp))
    step = ramp[len(ramp) - len(classes):] if len(classes) < len(ramp) else ramp
    cw, ch = (x1 - x0) / nx, (y1 - y0) / ny

    def cls(n):
        for k, (lo, hi) in enumerate(classes):
            if n >= lo and (hi is None or n <= hi):
                return k
        return None
    handles = []
    for k in range(len(classes)):
        verts, codes = [], []
        for iy in range(ny):
            ix = 0
            while ix < nx:
                n = flat[iy * nx + ix]
                if not n or cls(n) != k:
                    ix += 1
                    continue
                jx = ix
                while jx + 1 < nx and flat[iy * nx + jx + 1] and cls(flat[iy * nx + jx + 1]) == k:
                    jx += 1
                a, b, c, d = x0 + ix * cw, x0 + (jx + 1) * cw, y0 + iy * ch, y0 + (iy + 1) * ch
                verts += [(a, c), (b, c), (b, d), (a, d), (a, c)]
                codes += [Path.MOVETO, Path.LINETO, Path.LINETO, Path.LINETO, Path.CLOSEPOLY]
                ix = jx + 1
        if verts:
            ax.add_patch(PathPatch(Path(verts, codes), facecolor=colour(step[k]), edgecolor='none', linewidth=0, zorder=zorder))
        lo, hi = classes[k]
        handles.append((Patch(facecolor=colour(step[k]), edgecolor='none'), ('%s+' % format(lo, ',')) if hi is None else '%s–%s' % (format(lo, ','), format(hi, ','))))
    return handles


def legend(ax, standings=(DECIDED, COMPUTED, CHOSEN, REFUSED), series=(), extra=(), glosses=True, **kw):
    """The standing legend (WARRANT rule 9: a legend wherever a standing is drawn), in the grammar's own words, then
    the series (label, index[, hollow]) and any extra (handle, label) pairs."""
    handles, labels = [], []
    for s in standings:
        g = _LG[s]
        if s == REFUSED:
            v = _ST[REFUSED]['void']
            h = Patch(facecolor=colour('paper'), edgecolor=colour(v['edge']), hatch='////', linewidth=0.6)
        else:
            d = dashes(s)
            h = Line2D([], [], color=colour(_ST[s]['token']), linewidth=LINE_PT, linestyle='-' if d is None else (0, d), dash_capstyle=_ST[s]['cap'])
        handles.append(h)
        labels.append(g['label'] + (' — ' + g['gloss'] if glosses else ''))
    for item in series:
        lab, idx = item[0], item[1]
        hollow = len(item) > 2 and item[2]
        i, c = _identity(idx), series_colour(idx)
        handles.append(Line2D([], [], linestyle='none', marker=i['marker'], markersize=5, markerfacecolor=colour('paper') if hollow else c,
                              markeredgecolor=c, markeredgewidth=1.0 if hollow else 0.8))
        labels.append(lab)
    for h, lab in extra:
        handles.append(h)
        labels.append(lab)
    kw.setdefault('frameon', False)
    kw.setdefault('handlelength', 3.2)
    kw.setdefault('fontsize', 6.5)
    return ax.legend(handles, labels, **kw)


def premises(ax, items, fontsize=6.5, meet=None):
    """The premise ladder (WARRANT v2.1): items in the order the number travelled through them, each
    (grade, label, evidence), grade one of ASSUMED, VERIFIED, COMPARED, VALIDATED. Drawn as a three-step glyph filled to
    the rung reached and the grade's word, in ink, never in colour. The last line names the weakest premise. Returns
    the weakest grade."""
    if not items:
        raise ValueError('a chain of premises has at least one premise')
    ax.set_axis_off()
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    n = len(items) + 1
    words = [g['word'] for g in REGISTER['grades']]
    for k, (g, lab, ev) in enumerate(items):
        if g not in (ASSUMED, VERIFIED, COMPARED, VALIDATED):
            raise ValueError('a grade is ASSUMED, VERIFIED, COMPARED or VALIDATED')
        yc = 1 - (k + 0.6) / n
        tone = colour('ink-3') if g == ASSUMED else colour('ink')
        for b in range(3):
            on = b < g
            h = 0.018 * (b + 1)
            ax.add_patch(Rectangle((0.004 + b * 0.016, yc - 0.012), 0.010, h, transform=ax.transAxes, facecolor=tone if on else colour('paper'),
                                   edgecolor=tone, linewidth=0.5))
        ax.text(0.06, yc, words[g].upper(), fontsize=fontsize - 1, color=tone, va='bottom', family='monospace')
        ax.text(0.22, yc, lab, fontsize=fontsize, color=colour('ink'), va='bottom', fontweight='bold')
        ax.text(0.22, yc - 0.012, ev, fontsize=fontsize - 1, color=colour('ink-3'), va='top')
    weakest = min(g for g, _, _ in items)
    ax.text(0.0, 1 - (n - 0.4) / n, meet or ('The weakest premise is %s; so is the conclusion.' % words[weakest]), fontsize=fontsize, color=colour('ink-2'), va='center')
    return weakest
