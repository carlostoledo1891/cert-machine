# CONTRACT — what every generated page here obeys

Ported from `frontier-apps/site/design/CONTRACT.md` on 2026-09-05, merged with
what cert-machine already had. Not a framework. The value is in the contracts,
not in abstraction — measured on the origin repo, only ~80 lines of CSS were
genuinely duplicated across 15 builders, and of one session's ten bugs a
framework would have prevented two.

**What was already here before the port, and stays:** `design/tokens.js` (the
frontier palette under house names, sha-pinned against `design/frontier-ref/`,
ported 2026-09-01 — verified still matching on 2026-09-05), `design/template.js`
and `design/nav.js` (cert-machine's shell wins over frontier's 72-line one; it
carries the nav, SEO, OG and the gates, and frontier's has none of that), and
`playground/warrant.js` (a four-standing lattice where frontier has two — richer,
and kept).

**What the port brought that this repository did not have:** the ink grammar as
a closed set of constants, and a gate that reads it.

---

## 1. The pipeline computes; the builder only reads

    experiments/<front>/  →  out/*.json  →  tools/build-<front>.js  →  site/<front>/

A builder never recomputes a scientific quantity. It reads what the pipeline
emitted and arranges it. That is why a figure cannot drift from the test suite —
it is regenerated from the same files the graders ran on, not transcribed.

If a builder needs a number that is not in the JSON, **the fix goes in the
pipeline.**

## 2. Ink is read, never chosen

See `design/grammar.js`. **Solid means decided, dashed means assumed**, and dash
is reserved for that and nothing else. Renderers derive the pattern from the
data's own type and take no style argument, so an author cannot draw a float as
though it were proved.

`playground/warrant.js` is this repository's version of the rule and is finer
than frontier's: four standings (REFUSED / CHOSEN / COMPUTED / DECIDED), a
lattice whose meet is "the weakest standing on the path to the pixel", and one
stroke per standing. It reads its patterns from `grammar.js` and writes none of
its own.

### The permitted set, and there are no others

    5 4      a claim: assumed, fitted, asserted, heuristic       (COMPUTED)
    1.5 2    the same, under ~10px, where 5 4 is mush
    1 5      one member of a set the data admits, round-capped   (CHOSEN)
    1 3      the same, small
    2 3      a guide: an axis, a ruler, a ghost, a reference circle

`DECIDED` is solid — the absence of a pattern, not a pattern. `REFUSED` has no
stroke at all; the void is drawn as a **shape**, because asking for the stroke of
a mark that does not exist is a bug at the call site.

Audit it with:

    node tools/check-grammar.js --report

or, the way frontier states it, directly:

    grep -rho 'stroke-dasharray:[^;}]*\|setLineDash(\[[0-9. ,]*\])' site/**/*.html | sort -u

### What the audit found the first time it was run here (2026-09-05)

**Twenty-five distinct patterns.** The cause was two lines in `warrant.js` that
derived the dash from the *stroke width* —

    dash: `${3.2 * width} ${2.2 * width}`     width 2.4 -> "7.68 5.28"
    dash: `${0.4 * width} ${2.1 * width}`     width 2.6 -> "1.04 5.460000000000001"

— so every width minted a new pattern, one of them carrying a float artifact
into published HTML, and two marks of the *same standing* at two weights were
given two different patterns. Fixing those two lines removed six patterns.

It also found **`6 4` and `1.6 3.4` live on `/instruments/answer-shape`**: the
exact pair frontier's own contract records as the one time dash was used for
identity ("the second and third model"). The violation had travelled with the
CSS. Those two declarations are deleted; the page was already carrying
`grammar.js`'s IDENTITY ladder underneath them, value for value.

### Identity is weight and opacity, never dash

    { weight: 1.7, opacity: 0.95 }
    { weight: 1.3, opacity: 0.62 }
    { weight: 1.1, opacity: 0.42 }

`warrant.js` used to license identity-by-dash in figures whose marks all shared
a standing. **That licence is withdrawn.** A rule that depends on what else is in
the same figure cannot be read off the mark, and a reader who has learnt "dashed
means assumed" is simply misled by the second page.

## 3. Style comes from named files, and each says what it owns

    design/tokens.js        colour, type, spacing, radii. The only place a value is named.
    design/components.js    prose, cards, tables, sections, the figure primitives
    design/nav.js           ONE navigation, no per-page variants
    design/template.js      the page shell; every page is born from it
    design/grammar.js       the ink rule and the only dash
    playground/design/shell.css   full-viewport instruments: #stage, .panel, .ov, .rd, .pt

A page that links sideways does it inside its content, where the link can say
why — not by growing a nav variant.

### `#stage` claims its own width, and that has cost an afternoon twice

`#stage` carries `width:100%`. **A page that insets the canvas with a `right:`
rule must also set `width:auto`**, because a percentage width beats an inset —
the canvas otherwise runs underneath the panel and the last thing in it is
invisible.

cert-machine's `playground/design/shell.css` carries this rule byte-identical to
frontier's `instrument.css`, and borrowed it *without the comment that explains
it*. The visual review of 2026-09-05 then found the u−v coverage inset on
`/instruments/interferometer` cut in half by the control rail, its label
truncated to "u−v cov". Same bug, second repository. It is written down here now.

## Gotchas carried over, each one paid for

- **`#stage{width:100%}` beats a `right:` inset.** Use `width:auto`.
- **Text drawn inside an SVG viewBox sized for the boxes is SILENTLY CLIPPED.**
  Widen the viewBox for captions, and give a set of subgraphs a `minWidth` floor
  or they render at different scales in equal cells. The affect card failed
  exactly this and is fixed: the clamp held the ANCHOR rather than the text, the
  shared `.lb` rule had no font-size so card art fell back to 16px in viewBox
  units, and nothing kept two labels off each other. All three live in
  `playground/design/marklabel.js` now, which is one module because `label()`
  had been copy-pasted three times.
- **A status callback firing on `pointerdown` must not trigger a re-mount** — it
  replaces the element the pointer is captured on and every drag dies on its
  first move.
- **`location.hash` keeps URL encoding** (`>` arrives as `%3E`).
- **Every instrument page should carry a `#hash` dev hook** that drives the REAL
  interaction path. **Screenshotting the initial state finds no interaction bug**
  — and this repository supplied the proof: `/instruments/interferometer`'s panel
  toggle was dead for an unknown length of time because it flipped a class no
  stylesheet listened for, and a full visual review at two widths across eleven
  pages could not see it. The hook is live on that page:

      #set=panel:hidden,mode:field,ring:0

  Any key on the page's own state object, plus `panel`. It drives the same state
  and the same redraw the controls use, so a hook that renders proves the control
  would too. Unknown keys are ignored rather than thrown — a dev hook that breaks
  the page it inspects is worse than none. The other instruments do not carry one
  yet; that is the next thing this practice needs.

## The two port decisions, made rather than left open

**ECharts and `frontier-theme.js` are NOT ported, and that is the finished
state.** cert-machine has zero ECharts pages: it draws with hand-written SVG
through `design/charts.js`, which is exactly the engine the operator's own
correction describes — "write the mark, derive its ink, emit a string". Only 4 of
14 frontier pages load ECharts at all, all of them older. Porting a theme for a
library this repository does not use would be dead weight. What was worth having
from that strand is the DOCTRINE, and it landed: charts.js now reads every dash
from `grammar.js`, its categorical greys are fixed in order, and its legend
refuses a swatch without a word beside it.

**`/instruments` cards and report figures keep different grounds, deliberately.**
`.plate` is transparent with `--radius-l`; `.figbox` is `--bg-raised` with
`--radius-m`. That is not the drift the review suspected: both grounds and both
radii come from tokens, and a card tile is a different component from an exhibit
sitting in running prose — a larger surface takes the larger radius. The
transparent plate was arrived at by measurement (a filled box made a square
drawing float in a rectangle, and arts painting their own ground made a second
rectangle beside it); unifying them would undo that finding.

## What is deliberately NOT shared

**The marks.** The circumplex plate, the envelope ruler, the contact-sheet
glyph, the deformation field, the ensemble renderer — each is designed for its
own data, and generalising them early makes them worse. The best figures came
from breaking the previous page's pattern, not from reusing it. Port the grammar
and the shell; write new marks.

## The gate

`tools/check-grammar.js`, in `make test`. It measures a fact and **ratchets** —
CLAUDE.md forbids a gate that refuses a direction — so drift that exists today is
recorded in `design/grammar-baseline.json` as a census that may only shrink. A
pattern that is neither permitted, nor declared exempt with a reason, nor within
its recorded count fails the run.

**Exemptions are declared, never inferred.** `stroke-dasharray` has a second use
that has nothing to do with the grammar: drawing a partial arc or an animated
flow by dash length. Those are listed in the baseline `exempt` block with one
line of reason each.
