# The components, and what each one is standing on

Written 2026-09-04, when four pages were crossed from the bench and their parts
became available to everything here. This is the catalogue the grammar
(`../warrant.js`) will be specified against: what each component is for, and
which standing its marks carry.

**Read the conflict first.** It is the most useful thing on this page.

---

## The conflict the port found

`warrant.js` reserves **stroke pattern** for standing: solid decided, dashed
computed, dotted chosen. The comparison plates crossed from the bench use
**stroke pattern for model identity** — solid Opus, dashed Sonnet, dotted Haiku,
with a direct legend saying so. Both are defensible and they cannot both hold in
the same figure.

Resolving it by fiat in favour of the grammar would be the wrong call. The
comparison plate is not confused: every mark in it has the *same* standing — all
three curves are model answers, computed, nothing decided about any of them — so
the stroke channel is genuinely free, and identity is the only thing left worth
putting in it. The rule that survives both cases:

> **Stroke pattern carries standing whenever a figure holds marks of more than
> one standing. In a figure whose marks all share a standing, the channel is
> free, and the figure must say what it is carrying instead.**

That is a real rule, it was found by building rather than by reasoning, and it
belongs in the spec. It also has a consequence worth stating: a comparison plate
that later gains a decided reference line has to give the stroke channel back.

The second thing the port settled: **Plate V already drew the grammar**, months
before anything here was called one. Its caption reads *solid: a bound on every
sky. dashed: a sky that exists.* Nobody was applying a convention; somebody was
trying not to lie on an axis and reached for the only channel that would carry
the difference. That is the best evidence available that the distinction is real.

---

## Where a component lives (added 2026-09-04, phase 3)

Until this pass the catalogue said what each component was FOR and left where
it was declared to whoever needed it. An audit of the eleven stylesheets that
ship to /instruments found **32 class names declared in more than one place**,
and the copies had drifted: `.hero` had two bottom paddings, so it was a
different height on curveset than on its siblings; `.foot` had three distinct
rule bodies; `.eyebrow` was one weight lighter on /instruments than on the
reports, on every page but one. None of it was visible. All the pages still
looked like pages.

So the rule is now:

> **Furniture every document page uses is declared in `components.js`, once.
> A page's own components stay in the page's own sheet.** The base layer is
> emitted by `shell.js`'s `page()`, so a builder cannot forget it — ten of
> them used to paste it in by hand, and one had already forgotten and linked a
> different stylesheet instead.

`.legend` WAS ONE NAME OVER THREE COMPONENTS: the warrant standing legend
(curveset, plates), a category swatch row (neural-geometry) and a model
identity row (answer-shape). They shared a name, a stylesheet slot and nothing
else. The standing legend is `.w-legend`, rendered by `warrant.js`; the other
two are `.swatches` and `.mchips`. Watch for this: `.item` is still a child
class shared by `.hero-meta` and `.w-legend`, which is exactly what made the
first audit of this miscount a legend's size.

**Column counts are derived, never declared.** `design/grid.js` takes n and
lays it out in rows as equal as possible; the container carries `data-n` and
the CSS reads it. It was written for the reports' `.stats` strip and could not
be reached from here, which is why four pages declared a legend width by hand.
Phase 2 tried `auto-fit` instead and the layout ruler refused the change —
auto-fit picks a count from the available width, which is not the same question.

## The catalogue

### `plate` — art, then what it is, then the rule that produced it
`plates/plates.js`. A figure with a two-column caption: prose on the left saying
what you are looking at, a monospace block on the right giving the rule and its
parameters. Nothing is clickable and nothing moves.

The right-hand block is the load-bearing half. A plate that states its rule can
be re-derived; a plate that does not is an illustration. **Standing:** whatever
the figure holds — Plate V mixes decided and exhibited and says so, Plate I is a
definition drawn and carries no verification claim at all.

### The raster plate — a figure with more cells than SVG should hold
`framed(dataURI(...))` in `plates/plates.js`. Some objects are hundreds of
thousands of cells and belong in a pixel buffer, not in a document with 40,000
rects in it. Plates VI, VII and VIII are PNGs generated at build time and framed
with the same stamp and footer as the vector plates, so the reader cannot tell
which is which and does not need to.

**Watch the shading direction.** Plate VII shades *inverted* on purpose: the
first pass made comfortable boxes bright, which put all the ink on the easy part
and left the ground and the tightest boxes the same black. The interesting object
is where the argument nearly ran out, so that is what glows.

### The enclosure band — solid over the set, dashed for one member
Plate V, and `curveset/plot.js`. Two curves and a fill: an upper bound that holds
over everything the data admit, and a lower one that was exhibited and checked.
**Standing:** the bound is decided, the member is a member. The band between them
is not error and not statistical uncertainty — it is the set of answers that
survive, and its width is a fact about the instrument.

### The comparison frame — three models, one axis
`answer-shape/`. A table of distances fixes nothing about rotation, reflection or
overall size, so putting three of them on one axis means removing exactly those
freedoms and nothing else. What is left is disagreement about shape. Ships with a
direct legend and a metrics table underneath.
**Standing:** all marks computed; stroke is carrying identity (see the conflict).

### The metrics strip — `nums`
`exact-geometry/page.js`. Four to five cells, monospace, tabular numerals, one
hairline grid: effective rank, negative mass, exact signature, δ/diameter. Small
enough to sit beside a plate and be read in one pass.

### `predicted / decided / agreed` — the block that makes a control a control
`exact-geometry/page.js`. Three lines: the shape the construction guarantees, the
shape the instrument decided, and whether they matched. **The prediction is
written first and never edited**, which is the only thing that makes the third
line mean anything. Any page that claims to have a control should carry this
block or explain why not.

### The heat table — the distances themselves, as a texture
`answer-shape/`. The integer table rendered as a small greyscale square, one per
model, plus one for the spread across them. Four squares side by side answer
"where do they disagree" faster than any table of numbers, and the disagreement
square is the one that carries the finding.

### The paired residual bars, with a floor tick
`affect/`, `answer-shape/`. One bar per model per hypothesis, on a shared scale,
with a **tick marking that model's own noise floor**. A bar that does not clear
its own tick is not showing you anything, and putting the floor on the bar rather
than in a footnote means the reader cannot miss it.

### The cell matrix with a worst case underneath
`answer-shape/`, "where the triangle inequality fails". Each cell is one model on
one subject: the headline share, and under it the worst single violation with its
size against the largest distance that model was willing to name. A percentage
alone invites "is that a lot?"; the worst case answers it in the same cell.

### The arrow field — before and after, as displacement
`affect/`. Each item drawn where it was and where it moved to under a
perturbation, as an arrow. A grid of these across conditions and models shows at
a glance which model is stable and which is not — and it is where the control's
failure is most obvious.

### The dial and its readout
`curveset/`. A slider over named assumptions, with the answer, the published
answer, and the ratio between them updating together. The page is complete
without the script: the server renders the widest true answer and the whole
table, and the dial only moves between states that all exist on disk.

### The void
`curveset/plot.js`, `warrant.js`. Where a reading is over range and no admissible
curve bounds it, there is **no mark**, and the void is drawn as a hatched field
with a word in it. Never interpolated across, never a zero, never a gap the eye
fills in.

---

## What is not here

No component in this catalogue encodes **confidence**. Width is drawn as extent,
standing is drawn as stroke, and the two never share a channel — which is the one
thing the grammar is actually claiming, and the reason it is worth writing down
separately from the ninety years of uncertainty visualization it sits beside.
The `vis-*` rows in `corpus/targets.json` say who got there first on everything
else.
