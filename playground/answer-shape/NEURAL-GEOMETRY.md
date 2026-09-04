# The shape of an answer — three models, 1,980 isolated questions

`probe.js --live` → `decide.js` → `tools/build-neural-geometry.js` → `site/neural-geometry/`

Reference: cert-machine's `playground/neural-geometry`, which asks one model for
pairwise dissimilarities and decides what shape the answers have. This is that
method run on **three models at once**, with different subjects, and with the
comparison between models as the object of study rather than a footnote.

## Method

Seven worlds. Every ordered pair asked separately — both directions, in calls
that never see one another — for a single integer on 0–99. 660 calls per model,
1,980 total, $1.65 (Opus 5 $1.36, Sonnet 5 $0.23, Haiku 4.5 $0.06).

The two directions are **added**, not averaged: the sum is an integer where the
mean is a half, doubling a distance table changes no triangle inequality and no
signature, and integers keep the gate and the symmetric congruence in exact
arithmetic.

**The scale is part of the experiment.** 0–99, not 0–100, because a cycle of six
or twelve contains the ratios 1:2:3 and 100 is not divisible by 3. On 0–100 a
model can be right to the nearest integer and still hand back a table that fails
the triangle inequality by one unit — the failure this bench already hit once in
`exact-geometry` and did not want to hit again.

## Results

**Same numerals, two frames.** The clock and the digits are nearly the same
symbols with opposite geometries, and nothing in either prompt names the frame.

| | clock, cycle residual | digits, line residual |
|---|---|---|
| Opus 5 | **1%** | **0%** |
| Sonnet 5 | 13% | 1% |
| Haiku 4.5 | 29% | 35% |

**Every one of Opus 5's 90 digit answers is exactly 11·|i−j|** — `0 11 22 33 44
55 66 77 88 99` from zero — with not one exception across 90 calls that never saw
each other. 11·9 = 99, so it did not merely order the digits, it spread them
across the whole scale in exact proportion. It is the only structured world any
model turns into a metric space, and its effective rank is 1. Haiku's answers
from zero read `0 11 2 33 4 28 20 78 8 99` — it has 11, 33 and 99 in the right
places and nothing else: not monotone in the digit.

**The triangle inequality fails where a model knows something.** 4 of 21
(subject × model) cells pass the metric gate: digits/Opus, and nonsense for all
three. The nonsense control passes *because its distances all sit within a factor
of 1.1–1.3* — any table whose values lie within a factor of two is a metric for
free, since two of them can never fall short of the third. Passing the gate is
therefore not a compliment; it is the signature of a model with nothing to say.
The failures are not rounding: the worst chromatic triple misses by 64% of the
whole scale.

So the gate is **reported, not enforced**. Classical scaling is defined on any
symmetric hollow table and the negative mass already says how far from Euclidean
it is; refusing to draw would have discarded the more interesting fact. This is a
deliberate departure from `exact-geometry`, where the gate does refuse.

**The octave is the cycle nobody closes.** Hues come back a circle for Opus (7%),
the clock at 1% — but the chromatic scale is 26–30% for all three, the worst
ordered set on the page. B→C is a semitone and B and C sit at opposite ends of
both the alphabet and the scale as written; every model splits the difference.

**Model ordering is consistent and not subtle.** Agreement between Opus and
Sonnet runs r = 0.87–1.00 on the five ordered worlds; either against Haiku,
0.66–0.92. The carnivores are the exception — 0.58–0.66 for every pair, nobody
close to anybody, which is what a set with no canonical order looks like. On
nonsense all three collapse to r = 0.21–0.45, the floor working.

## Gotchas paid for

- `output_config: {effort}` is **rejected by Haiku 4.5** — "This model does not
  support the effort parameter", and it failed all 42 calls of the first live
  test silently as retries. Capability is per model, not per family.
- 1,980 sequential calls is an hour. The pool at concurrency 12 is ~6 minutes.
- The set writes a curly apostrophe (`1 o’clock`); a `/o'clock/` regex matches
  nothing. Label shortening lives in the builder, never in `sets.js` — the
  question that was actually asked is not editable after the fact.
