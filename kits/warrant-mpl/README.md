# warrant-mpl

WARRANT's print register for matplotlib: figures for reports read on white paper and printed on mono laser printers,
in which every mark says what it rests on. **A proposal (2026-10-29), not yet approved.** The register and the
validator's numbers are in cert-machine's `design/print/` (`PROPOSAL.md`, `REPORT.md`).

## The grammar, on paper

| standing | what it rests on | stroke | tone when a line is not a series |
|---|---|---|---|
| decided | an exact decision: an enclosure, an exact comparison, a proof | solid | ink `#000000` |
| computed | float, a solver's tolerance, a fit, a number someone printed | dashed `5 4` | ink-3 `#4d4d4d` |
| chosen | one member of a set the data admit, picked by something that is not the data | dotted `1 5`, round caps | ink-2 `#262626` |
| refused | the instrument declined, or the input is missing | **no mark**: a hatched void and ∅ in words | guide `#8a8a8a` hatch |

- Under 1.5 pt the dashes take their short forms (`1.5 2`, `1 3`), by design/grammar.js's rule. A dash is never
  scaled by the line width: the style sets `lines.scale_dashes: False`, because a scaled pattern is a new pattern.
- `2 3` is the guide: a ruler, a reference ghost, a leader. It says nothing.
- At most three series are compared in one figure: ● ink, ■ the print blue `#3368c1` (proposed), ▲ ink-3. Each has its
  own marker, so a greyscale copy loses nothing. `use(identity_hue=False)` draws the second series in ink-2.
- The witness red `#e0574e` goes only on a × beside words, for a counterexample that is shown.
- The order ramp (five neutral greys, darker with magnitude) is for fields. Ink stays readable on every step; a
  coloured line over a field is drawn on a paper casing (`on_field=True`).
- Standing is not a verdict, and colour never carries standing. Words carry verdicts; the stroke carries standing.

## Install

The kit is one folder and needs only matplotlib (tested on 3.9.4 and 3.11.2). Copy `warrant_mpl/` next to your
scripts, or add `kits/warrant-mpl` to `PYTHONPATH`. Inside cert-machine, `make warrant-mpl-venv` builds a pinned venv.

```python
import warrant_mpl as wm
wm.use()          # or wm.use('grey'): every colour its greyscale value, as a mono laser prints it
```

| call | draws |
|---|---|
| `wm.line(ax, x, y, standing, series=None, width=None, on_field=False)` | a line in its standing's stroke; `series` (0, 1, 2) takes that series' colour |
| `wm.knot(ax, x, y, series=0, hollow=False)` | a decided value: the series' marker |
| `wm.whisker(ax, x, lo, hi, standing=wm.COMPUTED, series=None)` | an interval as a vertical line in its standing |
| `wm.void(ax, x0, x1, y0, y1, words=...)` | a refused region: hatch, ∅ and the words (required) |
| `wm.witness(ax, x, y, words)` | the × in the witness red, beside the words (required) |
| `wm.guide(ax, x=... or y=...)` | a ruler in the guide pattern |
| `wm.field(ax, (x0, x1, nx), (y0, y1, ny), counts, classes)` | an order-ramp field; returns legend handles |
| `wm.legend(ax, standings=..., series=[(label, i[, hollow])], extra=[(handle, label)])` | the standing legend in the grammar's own words |
| `wm.premises(ax, [(grade, label, evidence), ...])` | the premise ladder: a three-step glyph and the grade's word, then the weakest |

The helpers refuse what the grammar forbids: a stroke for `REFUSED`, a witness or a void without words, a fourth
series, and a caller's own `linestyle`, `color` or `alpha` on a standing line (the stroke is read from the standing and
the series, never chosen).

## Three worked examples

Each reads numbers extracted from cert-machine's public records (`examples/data/`, each with its source's sha256) and
writes `examples/out/<name>.svg` and `<name>-grey.svg`.

### 1. A design wave: `examples/ex1_design_wave.py`

Buoy A's certified 100-year significant wave height by the block the maxima are taken over. The picked family's
level is a decided knot, the other family's a hollow one; the delta method's 95% interval is float, so it is a
computed whisker; on the annual maxima the choice is refused, so there is a void and words, not a point.

```python
for i, b in enumerate(D['blocks']):
    if b['verdict'] == 'REFUSED':
        wm.void(ax, i - 0.42, i + 0.42, 8, 22, words='choice refused:\nno certified exp. Weibull')
    for f, F in b['families'].items():
        lo, hi = (float(v) for v in F['levels']['100'])
        if b['pick'] == f:
            wm.whisker(ax, i, *map(float, F['delta']['100']), wm.COMPUTED, series=series[f])
        wm.knot(ax, i, hi, series=series[f], hollow=b['pick'] != f)
wm.line(ax, [-0.6, 3.5], [big, big], wm.DECIDED, width=0.8)        # the largest hour on record: a datum
wm.legend(ax, standings=(wm.COMPUTED, wm.REFUSED), glosses=False, series=[...])
```

### 2. A return-level curve and what it rests on: `examples/ex2_return_curve.py`

The four certified levels (10 to 1000 years) are decided knots. The straight segments between them are one curve of
the many those knots admit, so they are chosen and dotted. The 100-year design return period is a guide. The panel
beside it is the premise ladder; its last line names the weakest premise.

```python
wm.guide(ax, x=100)
wm.line(ax, T, levels, wm.CHOSEN, series=0)                        # the joins: chosen
for t, y in zip(T, levels):
    wm.knot(ax, t, y, series=0)                                    # the knots: decided
wm.whisker(ax, 100, lo, hi, wm.COMPUTED, series=0)                 # the delta interval: computed
wm.premises(side, [(wm.ASSUMED, 'The record', 'NDBC hourly Hs, pinned by sha256'),
                   (wm.ASSUMED, 'Independence', 'monthly maxima as independent draws'), ...])
```

### 3. Environmental contours over the hours, and the witness: `examples/ex3_contours.py`

Dataset A's hours counted exactly into chosen cells, drawn as the order ramp; three submitted 20-year contours drawn as
their files list them (decided), on a paper casing because they cross the field; the edge the benchmark's test adds to
close a file that never closes is chosen, dotted. Nothing in that figure is a counterexample, so it has no ×. The
witness is shown in a second panel on one that is: a step the GSM8K answer key prints, 364 / 4 = 273, beside its exact
value, 91.

```python
shades = wm.field(ax, (0, 20, 80), (0, 12, 60), counts, [(1, 9), (10, 99), (100, 499), (500, 1999), (2000, None)])
wm.line(ax, tz, hs, wm.DECIDED, series=i, on_field=True)           # the file's own edges
wm.line(ax, [tz[-1], tz[0]], [hs[-1], hs[0]], wm.CHOSEN, series=i) # the edge the test adds
wm.witness(w, 273, 0, 'printed')                                   # the one red, beside its word
```

## Checking a figure

Inside cert-machine, `node design/print/check-svg.js figure.svg` (`--mono` for a greyscale figure) refuses any dash
outside design/grammar.js (read with tools/check-grammar.js's own census) and any colour outside the register,
including a register colour made translucent. The test runs it on all six example figures and on five planted
failures:

```
kits/warrant-mpl/.venv/bin/python kits/warrant-mpl/tests/test_kit.py      # or: python -m pytest kits/warrant-mpl/tests
```

Outside the repository the figures still render; the checks that need cert-machine say SKIP.

## Licence

MIT (`LICENSE`). The examples' data are not: see `examples/data/README.md`. `register.json` and the two `.mplstyle`
files are generated by cert-machine's `design/print/kit.js`; do not edit them.
