# VISUAL REVIEW — 2026-09-05

Every row below was found by **opening the page and looking at it**, not by
measuring it. Screenshots are in the session scratchpad:

```
/private/tmp/claude-501/-Users-carlostoledo-Documents-cert-machine/
  7091f256-dc3a-4bd2-9b9c-6148904ba772/scratchpad/shots/
```

Method: headless Chrome, device-metrics emulation, real 3.5 s settle, the page
scrolled and captured in 1200px slices so nothing sits below a capture fold.
1440 at dsf 1, 390 at dsf 2. `site/apps/skyaudit` was ALSO shot over a local
HTTP server, because it cannot be judged from `file://` (see D-2).

**Original status: nothing changed, for the operator to rule on.**

---

## FIXED LATER THE SAME DAY — the three the ported contract diagnosed

| row | what it turned out to be | verified |
|---|---|---|
| **A-1** | The legend block carried `class="wrap"` and sat between two `<a class="card">` **inside `<div class="cards">`**, so it became a grid ITEM in one card column, with `.wrap`'s own gutter on top of the grid's. It spans the grid now (`grid-column:1/-1`) and carries no second container. | by eye at 1440 and 390 |
| **A-2** | `legendHtml()` emitted a bare `class="w-void"` rect and trusted the page to have a `.w-void` rule behind it. The void is a hatch, a hatch is a `<pattern>`, and the pattern id lives in a figure — which `/instruments` does not have. The class resolved to nothing and the rect fell to **SVG's default fill, which is black**. The swatch now carries its own `<defs>`; pages that *do* define `.w-void` are unchanged, because a CSS rule beats a presentation attribute. | by eye at 1440 and 390 — the hatch is visible in both |
| **G-1** | **Not a CSS gotcha — two stale selectors.** `app.js` asked for `.panel` and `panel-hidden`; `page.css` calls them `.ov-panel` and `ov-panel-hidden`, and `.panel` appears **nowhere** in the built page. `querySelector` returned null, `panelW()` returned 0, the sky was laid out across the full viewport, and the u−v inset — drawn at the sky's bottom-right — landed under the 330px rail. | by eye at 1440 |

### And one the screenshots could not have found

`$('panelToggle').onclick` toggled `panel-hidden` while the stylesheet listens
for `ov-panel-hidden`, so **the panel toggle button did nothing at all**. A
screenshot of the initial state cannot find this. It is the argument
`design/CONTRACT.md` makes for the `#hash` dev hook, and it was found only by
reading the code the u−v defect pointed at.

Gates after the three fixes: **63/63 green.** `check-measure` flagged
`/instruments` going from 9 left edges to 13 — accepted with `--accept-worse`,
because 13 is the site's norm (neural-geometry 13, plates 13, eight report pages
13) and the page measured 9 *because* its legend was crushed into one column.
The ratchet was recording a defect as a virtue.

### Then the rest of it, later the same day

| row | what it turned out to be |
|---|---|
| **A-3 / A-4** | One missing declaration. The shared `.lb` rule had **no font-size**, so card art on the gathering page — which inlines no page stylesheet — fell back to the browser default 16px *in viewBox units*. That caused both the clipping and the mismatched label sizes. Plus a clamp that held the anchor rather than the text, and no collision pass. `label()` was copy-pasted **three** times; all three share `playground/design/marklabel.js` now. |
| **A-5** | The plates thumbnail's 9px internal labels render near 4.8px in a desktop card and 3.2px at 390 — illegible at both, never mobile-only. Hidden in the card context; the plates page still draws all 58 at full size. |
| **A-6** | Not three different pills — **one pill with one missing constraint**. `.uv-scale` is absolutely positioned bottom-right with no left bound, so long captions grew until they touched the opposite edge. Bounded symmetrically. |
| **C-1** | Plate I's caption was drawn at `H - 22`, inside the viewBox the threading fills. A reserved caption band under the drawing, per the contract's rule. |
| **C-2** | `svg()` painted a full-bleed rect of the *page* ground inside a figure already painting `--bg-raised` — two grounds nested, one value apart. The SVG is transparent now, which also puts plates on the same ground as every other figure (part of B-1). |
| **D-1** | Not a stray element: maplibre's `NavigationControl`, wearing the vendored stylesheet's hard-coded white `ctrl-group`. Third-party CSS assuming a light page. |
| **E-1** | **The blur was not the bug — it was the only thing the bar had.** `design/nav.js` is shared by both shells and written in house token names, but `/instruments` links a `tokens.css` that emitted only the *frontier* spellings. Five of the nav's ten tokens (`--paper`, `--rule`, `--rule-soft`, `--rule-strong`, `--f-mono`) resolved to **nothing** across the whole section, so the bar had no background, no bottom border and no mono face. tokens.js emits both spellings now, and the glass is retired for an opaque bar under the dark lock. |
| **F-1** | `check-render` check 2 split in two: dead marks (no paint, or a paint server not on the page) hard-fail; faint marks ratchet. Two red controls plant a dangling paint server in a real browser. |

**Still open:** B-1 in its remaining half — `/instruments` cards are transparent with a 16px radius, `.figbox` elsewhere is filled with 10px, which is a deliberate documented choice for a card versus an in-prose exhibit rather than a defect. And a newly measured one: **1,200+ literal `border-radius` values ship** against two radius tokens — seven distinct values for "a box with rounded corners". That is real drift and wants a census like the dash one.

---

## A · /instruments — `site/instruments/index.html` (the main complaint)

| # | what is wrong | shot |
|---|---|---|
| A-1 | **The grammar legend is inside the card grid.** `<div class="wrap">` holding "what the marks below mean" is a direct child of `<div class="cards">`, so it becomes a **grid item in one column** instead of spanning the page. `.wrap` then adds its own gutter, so its left edge lands at **x≈216 while the entire rest of the site sits at x=168**. The three legend items are crushed to ~150px each and "float; nothing decided it" wraps to three lines. | `instr-1440-01.png` — compare `curveset-1440-00.png`, where the identical legend renders full-width and correct |
| A-2 | **The REFUSED swatch renders as a solid black rectangle.** `.w-void` is given no CSS paint anywhere — the stylesheet comment says so on purpose ("the void is a hatch, a hatch is an SVG `<pattern>`, and a pattern is addressed by an id that lives in the figure that defines it"). /instruments has no such figure, so `<rect class="w-void">` falls through to SVG's default **black** fill. This is the operator's "SVG rendering black". | `instr-1440-01.png` vs `curveset-1440-00.png` (hatched there) |
| A-3 | **The affect card art is clipped and overprinting.** "astonished" and "excited" overprint into one illegible word; "delighted" is cut off at the plate's right edge; "miserable" is cut to "serable" at the left. A stray rule also pokes out past the plate below the caption pill. | `instr-1440-02.png` |
| A-4 | **Adjacent cards use wildly different label type sizes.** Each art is stretched to a common plate width from a different viewBox, so answer-shape's numerals 1–12 render roughly three times the size of neural-geometry's "chartreuse / yellow / red" next to it. Two cards side by side look like they came from different sites. | `instr-1440-03.png` |
| A-5 | **At 390 the plates card art is illegible** — its internal labels ("PLATE I", "mod 100", "n = 0 … 99 threaded across…") come out at 4–5px. | `instr-390-04.png` |
| A-6 | **At 390 the caption pills are inconsistent** — shape-hunt's wraps to two lines and sits over the plate's bottom-left corner; interferometer's overlaps a drawn stroke; plates' runs to the plate edge. | `instr-390-01/02/04.png` |

## B · Card backgrounds are inconsistent across the site

| # | what is wrong | shot |
|---|---|---|
| B-1 | Three different card grounds are in use at once: /instruments cards have **no fill** (border only, page ground showing through); figure cards on report and instrument pages have a **filled panel**; the plates page nests a **filled inner panel inside a filled outer card**, producing a visible double frame. | `instr-1440-02.png`, `exgeo-1440-01.png`, `glide-1440-02.png`, `plates-1440-01.png` |

## C · `site/instruments/plates/index.html`

| # | what is wrong | shot |
|---|---|---|
| C-1 | **Plate I's drawing overprints its own caption** — the threading lines run straight through "n = 0 … 99 threaded across mod 2, 5, 10, 100. the heavy thread is 17". | `plates-1440-01.png` |
| C-2 | **Double frame** — an outer rounded card (x≈168–1272) with an inner square panel (x≈185–1255) at a different value, on every plate. | `plates-1440-01.png` |

## D · `site/apps/skyaudit/index.html`

| # | what is wrong | shot |
|---|---|---|
| D-1 | **A small white rounded box with a dark triangle sits at the top-left, over the map.** It is the only white element on an all-dark app, and it survives HTTP — so it is not a loading artifact. | `skyaudit-http.png`, `skyaudit-1440-00.png` |
| D-2 | **Not a page defect, but a review blocker.** The app loads `style.json` and its replay bundle from **absolute** `/apps/skyaudit/...` paths, so under `file://` the entire map area is blank black. Last session made the nav relative so the site could be reviewed from disk; the app was not included. Any visual check of skyaudit must go through a server, or it will read as a catastrophic failure that isn't one. | `skyaudit-1440-00.png` (file://, blank) vs `skyaudit-http.png` (correct) |

## E · The fixed nav — needs an operator call

| # | what is wrong | shot |
|---|---|---|
| E-1 | Content scrolls under the fixed header leaving a **heavy blur smear** at every scroll position, at both widths. On mobile the first line of body copy is half-covered by it. This may be the intended backdrop-blur; it reads as dirty rather than as glass. | every slice from `-01` onward, both widths |

## F · A hole in the gate that was supposed to catch this

| # | what is wrong |
|---|---|
| F-1 | `check-render`'s "every classed mark inside a figure paints something" check **passes A-2**, because black *is* a paint. On a `#0a0a0c` ground a black rect is invisible and the gate calls it fine. The test needs to be contrast-against-ground, not paints-something. |

---

## What I opened and found CLEAN

Stated so the next session does not re-review them:

- `site/index.html` at 1440 — clean.
- `site/reports/kissing.html` — table, verdict pills (CERTIFIED / QUEUED / NEEDS DATA), stat row all correct.
- `site/reports/glide-band.html` — the hatched annulus figure renders **fully**. check-render reporting figures on this page as blank/unmeasured is the measurement lying, not the page.
- `site/instruments/shape-hunt/index.html` — clean.
- `site/instruments/curveset/index.html` — clean, and it is the **reference** for how the grammar legend is supposed to look.
- `site/instruments/exact-geometry/index.html` — clean. Its 0.41% ink (thinnest on the site, flagged by check-render) is a genuinely sparse four-point drawing, not a blank.
- `site/instruments/interferometer/index.html` — the main image and the control rail render correctly; see below for the one real problem.
- SkyAudit's palette **over HTTP** — the verdict tiles (E-FLYABLE / BEYOND RANGE / NEEDS DATA) read correctly on the dark ground. The light-palette deletion did not break it.

## One more, on interferometer

| # | what is wrong | shot |
|---|---|---|
| G-1 | The **"u−v coverage" inset is cut in half by the right-hand control rail** — its label truncates to "u−v cov" and the box is clipped. The "20 µas" scale bar runs under the rail and is cut too, and the CONTROLS button sits half-tucked against the rail edge. | `interf-1440-00.png` |
