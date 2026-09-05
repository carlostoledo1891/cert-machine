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

## OPEN

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
Collapsing its palette fixed the colour defect, not the duplication: the app
pages are built by a different shell from every other page on the site, with
their own layout rules. Phases 2 and 3 unified the reports and /instruments and
left `apps/` alone.
**Cost:** moderate. **Risk of leaving it:** the next layout decision has two
places to land and only one of them is gated.

### 5 · The remaining geometry debt
673 spines and 5 clipped blocks at 1440px, from `design/measure-baseline.json`.
Most of the 673 are legitimate grid columns and card interiors. The metric
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
