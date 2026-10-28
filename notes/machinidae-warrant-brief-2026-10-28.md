# Machinidae onto WARRANT: the brief (2026-10-28)

Saved verbatim on the operator's word: "save this for when changing Machinidae to Warrant. Proceed when possible, this
is low risk since it's experiment. But we must be perfect here as well. Do not add more colors without explaining me
the reason and my approval."

**Standing conditions for this migration**
- It is done in Machinidae's own repository (`~/Projects/machinidae/web/`), never in `site/machinidae/`, which is a
  foreign zone. Publishing goes only through `node tools/publish-zone.js machinidae`.
- Coordinate with the Machinidae session before editing.
- No colour enters the grammar without the reason and the operator's approval. Machinidae's ochre, blue, rose, its
  arm series and its outcome ramp are therefore a proposal to put before the operator, not a migration step.

The brief below was written by the Machinidae session.

---

**Machinidae's visual grammar as it's built today, for the migration**

The code is in `~/Projects/machinidae` (branch `m0-m2`), in five places:
- `web/grammar.css`: the tokens and every component; its header states the rules.
- `web/plates.js`: the canvas figures, exposed as `window.CladeDraw`.
- `web/engine.py`: HTML charts (dot lanes, diverging bars, 100% outcome bars, step chart, scatter, tables, legends).
- `web/pages/<name>.{html,py}`: markup with `{{slots}}`, plus the code that fills each slot from the record.
- `web/README.md`.

The pages are index, era-0 to era-3, museum (a full-screen app) and lab.

**1. The stroke grammar: the declared rule versus what's actually used.** The declared rule is solid = certified,
dashed = not yet tested, dotted = chosen by a human. In practice dashed is overloaded, and some uses contradict the rule:
- **REFUTED and REFUSED verdict chips are dashed,** rose and muted respectively (`.sp-verdicts span.R/.F`,
  `.chip.rose`). A packing that isn't certified gets a dashed `[4,3]` box (`plates.js:102`). That breaks our own rule,
  since R is decided by both deciders, and yours, where a refutation is proved and drawn solid. It should become solid
  rose.
- **Dashed also means many other things:** a gene the founder lost (a ghost module or bond in a form), a run not yet in
  (`.lane.wait`), a reference line (`.lane .ref`, ochre), "next" milestones, the draft tag, ghost buttons and the pilot
  card.
- **Arm identity is partly carried by border style:** `.arm.rules` is dotted and `.arm.aleator` is dashed. That
  conflicts with "identity = weight + opacity, never dash".
- **The one faithful dotted use:** PM-0, the founder written by hand, is drawn dotted.
- **Dash arrays outside your permitted set:** the canvas uses `[4,3] [2,5] [3,3] [2,2] [2,4] [3,5]`, and only `[2,3]`
  is in your set. The SVG logo uses `2 2`, and CSS `dashed` / `dotted` render as the browser's own patterns.

**2. Colour.** One dark theme. The grounds and greys are your tokens: `--paper #0a0a0c`, `--plate`, `--ink`,
`--ink-2`, `--muted`, `--rule`. Three accents, one meaning each:
- `--ochre`: a change, a mutation, a live figure.
- `--blue`: a lineage, or a gene the founder doesn't have.
- `--rose`: refuted or stillborn.

The experiment's arms have series tokens checked with the dataviz validator on dark, each with a shape:
- `--s-lineage`: circle.
- `--s-aleator`: diamond (also used for "the AI alone").
- `--s-rules`: square.
- The controls, in greys: `--s-l7` ring and `--s-tree` triangle.

How far a birth got uses a one-hue ramp: `--o-lived`, `--o-died`, `--o-stillborn`. Colour is never used alone: always a
shape, a legend and a `data-tip`.

**3. Type.** Inter for display (heavy and tight), with Inter italic for captions and Latin names. JetBrains Mono for
hashes, counts, labels and eyebrows. Only Google Fonts may load; the build refuses any other host.

**4. Layout: a naturalist's monograph.**
- The page opens with the mast and navigation, a left rail of section links, and a hero (eyebrow, headline, lede, fact
  counters).
- Then plates: an eyebrow "Plate N", a two-column head (title | text), a figure on `--plate`, an italic caption starting
  "Plate N.", and usually a table with the same numbers.
- The page is complete at rest. Figures animate from a drawn state, and nothing moves under reduced motion.

**5. Machinidae's own figures, which is where the complexity is:**
- **Form, the genotype:** modules on 3 rings × 6 sectors (sense, act, forecast, tools, talk, others), with bonds for
  function calls. It is coloured against the founder: ink kept, ochre changed, blue new, a dashed ghost for lost. The
  layout rules are in `record.FORM_RULES`, and the web battery checks they reproduce PM-0's hand placement.
- **Packing, the phenotype:** the circles on one problem instance, with that instance's verdict (C/R/F).
- **The zoom:** powers of ten down to one contact, deep enough to show an overlap of 10⁻¹⁸.
- **Record and charts:** the Museum's fossil record (every birth by generation and arm, its fate and descent), the
  "bush" (a lineage tree), step-chart trajectories with a crosshair, dot lanes, diverging bars, outcome bars and the
  lab's scatter plots.
- **Standings the grammar doesn't carry yet:**
  - evolved (in the record) / synthetic (the Laboratory: built by hand or by rule, never evidence) / trial (outside the
    record);
  - pilot / confirmatory run;
  - chosen on the panel / reported on the check set;
  - a run not yet in.

  Today these are said only in prose. In your WARRANT terms, the lab's synthetics are probably CHOSEN.

**6. Rules a migration must keep.** The web battery enforces them, and `make test` (25 batteries, web about 7 minutes)
must stay green:
- **Numbers:** every number comes from the record through `slots()`, never typed into a template. `fill()` refuses a
  missing or an unused slot.
- **Pages:** each page is self-contained, with CSS and JS inlined.
- **Banned words:** a page fails if its prose uses any word on the kept-off list (`understands`, `thinks`, `knows`,
  `AGI`, `PhD-level`, `evolves into`, …).
- **Corrections** are shown on the page, never made silently.
- **Size:** the zone stays under 10 MB, half your 20 MB cap.
- **Free to change:** nothing in `web/` is part of Machinidae's pinned physics, so the grammar can change freely.
- **Never edited:** `strata/`, the evidence files in `lab/`, the judges and `world/`.

**7. Publishing doesn't change:** `make web` → commit → `make publish` (dry run) → `publish-zone.js machinidae --push`,
only on the operator's word. Since 2026-10-28 every page is indexable (noindex lifted). The zone isn't in
`site/sitemap.xml`; that file is yours.

**Suggested order:**
1. Put the tokens and dash set under `design/grammar.js`.
2. Fix the verdict strokes, so REFUTED is solid rose.
3. Move arm identity off dash, onto weight, opacity and shape.
4. Give one shared mark to synthetic, trial, pilot and not-yet-in.
5. Then the canvas figures. Keep the `CladeDraw` API (`fit`, `packing`, `form`, `C`, `onTheme`), because `museum.js`
   and `lab.js` draw with it.
