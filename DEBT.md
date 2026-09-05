# DEBT

What this repository owes itself. One row per item: what it is, why it is not
done, and what closing it costs. Written 2026-09-04 at the close of the
one-seed design pass, because four phases of that pass produced a list that was
living in a chat window.

**The rule for this file.** An item goes here when it is a real defect or a real
gap AND it is not being fixed in the same session. "We might improve this" is
not debt; it is a wish, and wishes belong in the HANDOFF menu. Debt is
something that is *wrong now*. A row leaves this file only by being fixed or by
being shown not to be a defect — never by going quiet.

---

## PAID — 2026-09-05 (second pass: what a page SHOWS)

| what | how it was closed |
|---|---|
| **1,337 stray commas** on five live pages | an array interpolated into a template literal stringifies with COMMAS between its elements. `${ch}` where `ch` is an array of `<line>` put 892 of them inside one figure and 66 on the gathering page. Three missing `.join('')` calls |
| **12 kinds of invisible SVG element** | the gathering page embeds each instrument's card art but not the stylesheet that colours it, and SVG's default stroke is `none` — so 63 chords on the affect card and 60 on answer-shape painted nothing. Those two plates measured **1.47% and 1.22% ink** and read as black boxes. The figure primitives are shared components now; affect measures **6.97%** |
| two cells reading `null` in a published table | `String(null)` is the four-character word. An absent count is an em dash |
| literal backticks in a `/machine` table cell | a markdown habit inside a JS description string |
| the nav was dead in a `file://` preview | every link was absolute. The site is reviewed from disk before it is pushed, so a nav that only works after deploy is a nav nobody can check |

## PAID — 2026-09-05 (first pass)

| what | how it was closed |
|---|---|
| the site had TWO navigations, and /instruments carried the smaller one | `design/nav.js` — links, markup and CSS in one module, emitted by both shells. A reader landing on an instrument page could not reach the reports, the machine or the about page without going home first, and that section holds the most hireable material on the site |
| the nav order was Reports · Machine · Instruments · About | Reports · **Instruments** · Machine · About — the audits, then the things you can turn, then the engine, then the person. It also marks the current section with `aria-current` now, which it never did |
| two of the nine cards on /instruments painted `#0a0a0c` inside a `#101014` plate | measured, not guessed: `affect` and `answer-shape` painted the PAGE ground over the plate ground, so two cards were visibly darker than the other seven. No art paints its own ground now |
| card arts filled between 52% and 131% of their plate | the plate takes the art's OWN aspect ratio, read off its viewBox at build time. SEVEN of the nine arts are square and every plate was 4/3, so each was letterboxed into 75% of the width — a drawing floating in a dark box. Now 69–102% wide, 67–99% tall, and `affect`'s 131% overflow (it was being clipped) is gone |
| every card carried seven text blocks and 1,200–1,750 characters | title, description and the art. The eyebrow, the "what decides it" strip, the figcaption and the four fact cells are gone: 3 blocks, 408–642 characters |

## PAID — 2026-09-04

| what | how it was closed |
|---|---|
| `CITATION.cff` named v2026.09.1 and carried v2026.09's DOI | pointed at `10.5281/zenodo.22285003`; the deposits are recorded in `corpus/zenodo.json` and check-wiring gates the citation against it |
| `.zenodo.json` declared a sibling archive version as `isSupplementTo` | `isNewVersionOf` — the lambda(4) deposit is archive version 1 of this concept, not a separate work |
| two outreach notes described the superseded deposit as current | both updated; `10.5281/zenodo.22257596` is marked superseded wherever it still appears |
| the skyaudit app shipped a LIGHT palette on a DARK ground | one theme, matching `design/tokens.js`. Measured before the fix: `--v-cert` rendered `#2C6142` at **2.73:1** against `#0a0a0c` on any light-OS machine, under the 3:1 floor the design battery enforces everywhere else, and the `*-soft` washes came out near-white where the dark theme expects near-black. Nothing in the repository has ever set `data-theme`, so the light half was serving a switch that does not exist |
| Plate IV's `p(r) = 0` label sat on the zero line, among the crossings and the dots | moved to the empty quadrant below-left. Verified numerically rather than by eye: zero curve points and zero dots inside the label's box |
| `certs/erdos1038-inf.json` re-hashed on every build | `tools/stable-json.js` — the record is rewritten only when its content changes, so `builtAt` now means *when this content was first produced*. Verified by a full re-run of all four #1038 theorems: the sha held |

---

## THE STANDING DEBT OF THIS WHOLE PASS (2026-09-05)

**Nothing in the 2026-09-05 sessions was confirmed by looking at a page.** The
gates are green; that is not the same claim. Every row marked PAID below was
verified by measurement only, and the operator found defects after two of those
rows were written. Treat the PAID list as *changed*, not as *right*, until
someone opens the pages. That re-review is the first item of work, ahead of
everything else in this file.

## OPEN

### 0 · THE GATE THAT DID NOT EXIST — now it does
`tools/check-render.js`. The repository gated the registries, the type system,
the palette, the layout geometry and the grammar, and had **nothing that looked
at what a reader sees** — so a figure could render as an empty rectangle with
every gate green. Three checks: builder leaks (markers, outside script/style,
in value positions only so prose is respected), every classed mark inside a
figure resolving to a paint, and INK — each figure screenshotted and its
non-ground pixels counted, ratcheted against `design/render-baseline.json`.
Four red controls. **Its first run found every defect listed above.**

Two honest limits, both in the file: ink RATCHETS rather than setting a bar,
because only the author can say whether a sparse drawing is empty or exact; and
three figures on `reports/glide-band.html` sit far enough below the fold that
`captureBeyondViewport` returns a blank clip, so they are reported as
**unmeasured** rather than counted as blank. Fixing that capture is the next
thing this gate needs.


### 1 · The Zenodo titles — OPERATOR ACTION, and the only one here that is not mine to close
Three published records still carry the retired title. `.zenodo.json` governs a
*new* deposit; it does not rewrite a published one, and only the depositor's
account can. Metadata edits on a published record are allowed and mint no new
DOI. The clicks are in `corpus/zenodo.json` → `titleLag.howToClose`.
check-wiring reports it as a NOTE on every run rather than failing, because a
gate that fails on something the machine cannot fix is a gate nobody can keep
green. **Owed since 2026-09-03.**

### 2 · The exact envelope on curveset
`/instruments/curveset` is honest now — the envelope is drawn COMPUTED because
it is evaluated in floats — but honest about being weaker than it needs to be.
The standards are half-integers and both envelopes are a min/max of *linear*
functions, so `U` and `L` are piecewise linear with breakpoints at the standards
and the backwards read is one exact solve on one piece instead of a bisection.
Do it in `playground/rational.js` and flip `ARITHMETIC` to `'exact'` in
`envelope.js`; every mark and the legend re-promote on their own, because
nothing on that page names a standing by hand.
**Cost:** a session. **It is the only place on /instruments where DECIDED is
available and not taken.**

### 3 · The HTML standing contract is exercised on one side only
`warrant.js`'s HTML voices ship site-wide, but only /instruments draws them.
Report numbers come from certificates and are DECIDED, which renders unmarked —
correct, and therefore invisible. So the contract has never been seen carrying
a distinction on a report page.
**Not a defect yet**, but it means the voices are untested where most of the
site's numbers live. The honest test is a report that genuinely mixes standings.
`reports/rm-audit.html` is the candidate: it sets truncated-decimal collisions
against exact decisions, which is exactly the COMPUTED/DECIDED pair.

### 4 · `app-shell.js` is still a second page shell
Collapsing its palette fixed the colour defect and `design/nav.js` fixed the
navigation, but not the duplication: the app pages are still built by a
different shell, with their own layout rules. Phases 2 and 3 unified the reports
and /instruments and left `apps/` alone.
**Cost:** moderate. **Risk of leaving it:** the next layout decision has two
places to land and only one of them is gated.

### 4b · The card arts do not fill their own viewBoxes
The plate now matches each art's aspect ratio, which closed most of the gap.
What is left is per-art: measured at 1440px the arts fill **69–102%** of the
plate's width and **67–99%** of its height, because each drawing carries its own
margin inside its viewBox. Tightening nine viewBoxes to their content is nine
bespoke figure edits and each one needs eyes on the result.
**Cost:** an afternoon with a browser open. **Not urgent:** the spread is now
narrow enough that no card reads as empty.

### 5 · The remaining geometry debt
679 spines and 5 clipped blocks at 1440px, from `design/measure-baseline.json`.
Most of the 679 are legitimate grid columns and card interiors. The metric
cannot currently tell "a component's columns" from "an accidental new spine",
which is why it has twice flagged its own counting floor rather than a
regression. **Chasing the number further is not worth much without a sharper
metric**, and sharpening it is itself the work.

### 6 · Other records still churn their own bytes
`certs/ember-band.json` and `certs/kissing-ledger.json` rewrite a `generated`
timestamp every build; `certs/ai-claims-summary.json` rewrites a wall-clock
runtime. Nothing pins them, so this is diff noise rather than a broken pin —
`tools/stable-json.js` is the fix and it is one call each.
**Deliberately not done in the same session as item 6's sibling:** the first
attempt at converting four *other* writers by regex corrupted two certificate
files (they were restored from git within the minute, and the surgical
single-file fix was done instead). Code that writes certificates gets edited by
hand, one file at a time, with the sha checked before and after.

### 7 · The dead `.item` class collision
`.item` is a child class of both `.hero-meta` and `.w-legend`. It is what made
the phase 3 audit miscount a legend's size, and the miscount reached a commit
message before it was caught. Harmless today; a trap for the next audit.
Recorded in `playground/design/COMPONENTS.md`.

---

## NOT DEBT — decided, and here so it is not re-litigated

- **`instruments/` at the root is the certifiers and `/instruments` is the
  served section.** The folder and the URL differ on purpose. Documented in
  three places. Do not "fix" it.
- **The reading measure on /instruments (82ch) is wider than a classic prose
  measure.** Those pages are figure-first; the prose sits beside full-track
  components, and a narrower column reads as a leftover.
- **The legend column count is derived from `data-n`, not from available
  width.** `auto-fit` was tried in phase 2 and the layout ruler refused it.
