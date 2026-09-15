# One template, one stylesheet, no inline CSS — the plan (2026-09-15)

Operator: "review the html pages and make sure the template is the same and all
pages are perfectly aligned with tokens and no inline css." This is the plan,
built from measurement of the 90 built pages under site/ on the tree as left by
the fourteenth session (uncommitted, 45 files). Every number below was read off
the pages or computed in Chrome; nothing is an opinion.

Gates at the start: wiring 11/11, ruler 7/7 (924 spines @1440, 5 clipped, 0
overflow), render 5/5 — ALL GREEN. Not one of the defects below is caught by a
gate today. That is the first thing to fix.

## What the review found

1. THE REPORT SIDE HAS SHIPPED SQUARE CORNERS FOR TEN DAYS. Commit 02e5768
   (2026-09-05) rewrote every container radius as var(--radius-m/-s/-pill), and
   design/tokens.js rootCss() never emitted those names — only instrumentsCss()
   did. Computed in Chrome: .figbox, .tag, .stats, .tw, .note and a.card are
   0px on every report, the landing, /machine, /about, /oracle and both app
   pages; .panel is 16px and .tw 10px on /instruments. 219 unresolved
   references on 71 pages. check-wiring check 7 passed the whole time because it
   reads the SOURCE token name, not whether it resolves.
2. THREE INSTRUMENTS REFERENCE TOKENS THAT DO NOT EXIST. contours, stereo-reach
   and census use var(--mono), var(--line), var(--line-strong); regatlas uses
   var(--mono). Computed: the contour panel meant to be mono renders in Inter,
   and its border is --ink-2 (currentColor) instead of a hairline. The landing
   uses five frontier spellings (--dur-slow, --ease-out, --chart-grid,
   --bg-raised, --border-strong) the report :root does not carry. Total: 222
   var() references on 74 pages resolve to nothing; 30 more on 6 pages carry a
   literal fallback (the dead second copy).
3. 685 INLINE STYLE ATTRIBUTES on 47 pages, from 30 source files. By shape:
   140 `--f:N` (bar fills), 135 `margin-top:var(--s-N)`, 96 `width:N%`/
   `left:N%` (marks), ~70 `max-width:Nch`, ~80 typography/colour, 25
   `grid-template-columns`, 14 widget buttons/textarea (oracle-widget,
   mfg-observatory), 10 footer bylines in 9 report builders + build-control,
   34 `opacity` (charts.js cm-cross ×2 sources + copies in aag/afg/maxval),
   the rest one-offs. Heaviest: blind-spot 111, affect 99, answer-shape 95,
   skyaudit 68 (+22 more in runtime templates in src/app.js), lattice-claims 54.
4. THE VENDORED FONT SUBSET LACKS GREEK AND MATH. CSS.getPlatformFontsForNode on
   39 glyphs the site uses (η χ λ ∈ ≤ ≥ √ ₁ …): vendored 'Inter var' draws 11
   itself, 19 fall to Times, 9 to Apple Symbols; Google's Inter on a report page
   draws 26. So Greek renders in Times on every /instruments page today, and the
   reports must NOT move onto that subset.
5. THREE SHELLS, THREE HEADS. design/template.js (reports, landing, /machine,
   /about, /oracle): no <head>/<body> tags, favicon, canonical+og:url, og:image,
   twitter, JSON-LD, theme-color, Google Fonts, vercel insights. playground/
   design/shell.js (20 instruments): <head>/<body>, no favicon, no canonical,
   no og:image, no twitter, no JSON-LD, no analytics, robots "index, follow",
   vendored fonts via a linked tokens.css. design/app-shell.js (2 app pages):
   a third head, no favicon, no robots. 25 distinct footer markups across 90
   pages (footer.col ×~55 shapes on the report side, footer.foot ×5 shapes on
   /instruments, 7 instruments write their own, navier-stokes has none).
6. TWO STYLESHEETS THAT DISAGREE. `body`, `.eyebrow`, `.tw`, `*` are declared
   by both sides with different bodies (.tw: the instruments' has the scroll
   affordance, the reports' never got it). Six page sheets re-declare p/a
   (bench.css, curveset, neural-geometry, shape-hunt, simplex, index.css); three
   re-declare the grammar classes .w-decided/.w-chosen/.w-computed (census,
   contours, stereo-reach); neural-geometry re-declares the shared figure
   primitives .ch .ord .mst .pt .lb; shape-hunt re-declares .tw/table/th/td.
   Four instruments pages carry a literal `ui-monospace,Menlo,monospace` stack
   (35 uses) that check-wiring check 4 cannot see: it walks 69 pages, not the
   90 the palette check walks. lattice-claims / the gathering page / graph /
   rewire carry 2–6 extra <style> blocks inside SVG card art, with
   var(--paper,#0a0a0c) fallbacks, and one art paints its own ground with a
   literal (.cg .cbg{fill:#0a0a0c}, stored in playground/out/manifest.json).
7. THE REPORT STYLESHEET IS NOT ON THE SCALE. Per report page, outside :root:
   ~200 px literals, 46 font-size, 24 font-weight, 21 durations, 3
   cubic-bezier. SPACE/SHAPE/MOTION/RHYTHM exist in tokens.js and are emitted
   on the instruments side only; the report side has no names for them.

## Decisions taken (change them if you disagree, before phase 1)

- D1 ZERO style attributes, not "custom properties only". A per-element datum
  (a bar fill, a marker position) is a MARK and is drawn as SVG with geometry
  attributes — the route charts.js already takes — so no inline channel is
  needed and the gate is absolute: `style=` appears on no built page.
- D2 ONE font path: the Google Fonts link in the one head, on all 90 pages;
  the vendored subset is deleted (finding 4). Vendoring FULL-coverage subsets
  (Latin + Greek + math + super/subscripts, sha-pinned) is the better end state
  and is a follow-up, not this pass.
- D3 ONE shell: design/template.js. playground/design/shell.js is deleted and
  the 20 instrument builders call render(). app-shell.js keeps its product body
  (.as-top, the dock) and takes head, footer and stylesheet assembly from the
  one shell — DEBT row 4 paid for everything but the body.
- D4 ONE <style> per page, in <head>: root tokens in BOTH spellings + the
  whole scale, reset, body, nav, the two tracks, typography, the report
  components, the instruments shared layer, then the page's own sheet. The
  linked tokens.css and instrumentsCss() are retired. Collisions resolved once:
  .tw takes the version with the scroll affordance (reports gain it, accepted
  with reason); .eyebrow/body/* are one rule under one spelling.
- D5 THE SCALE IS ON BOTH SIDES: rootCss() emits --s-N, --radius-*, --dur-*,
  --ease-out, --text-*, --leading-*, --track-*, --weight-*; RHYTHM.weight
  gains the two weights the site actually uses (mono 500, strong 600).
  template.css(), nav.js, the shared layer and the page sheets reference them.
- D6 ONE footer component (design/footer.js: markup + CSS), builders pass data.

## The phases, in order, each closed by the full battery

Sequencing rule (HANDOFF, 2026-09-04): a restyle MUST NOT MOVE A NUMBER. Run
`make test` (86 rows) between phases; any moved digit is a defect in the
restyle. The ruler and the render gate are the judges of layout: unchanged, or
accepted with the reason written into the baseline.

P0 · THE GATE, AND THE TWO LIVE DEFECTS (first, because they are live)
   tools/check-style.js, registered in `make test` and build-control (check 3
   demands it). Facts per built page, each with a red control:
     a. no `style=` attribute anywhere (absolute once P3 lands; --report
        prints the census until then)
     b. every var(--x) resolves on the page; no literal fallbacks (absolute)
     c. exactly one <style>, inside <head> (absolute after P2)
     d. literal spacing / font-size / font-weight / duration / easing inside
        the stylesheet where a token exists: RATCHET against
        design/style-baseline.json, only ever down
   check-wiring check 4 widened to the 90 pages (the 21 instruments were
   outside its walk). HOTFIX in the same commit: rootCss() emits the radii and
   the scale (finding 1), the four undeclared instrument tokens renamed to the
   ones that exist (finding 2). Ruler + render re-run: the radii will move
   nothing the ruler measures; the render ink may move and is accepted with
   "corners restored" as the reason.

P1 · ONE SHELL, ONE HEAD, ONE FOOTER (D2, D3, D6)
   design/template.js render() grows `cssRaw`, `scriptRaw`, `here`; emits an
   explicit <html><head>…</head><body>…</body></html>; one head for all 90
   pages (description, author, theme-color, robots, canonical+og:url, og:*,
   twitter:*, JSON-LD by path, favicon, fonts, insights). playground/build.js
   and the 20 builders pass `path` so /instruments gets canonical URLs.
   design/footer.js replaces 25 footer shapes; the 9 builders' inline byline
   and build-control's go with it. shell.js deleted; site/instruments/assets/
   fonts deleted; build-site's meta gate already covers descriptions.

P2 · ONE STYLESHEET (D4, D5)
   One css() assembly in template.js; sharedCss() folded in; the four
   colliding selectors resolved; the six page sheets lose their p/a copies,
   the three lose their grammar-class copies, neural-geometry its primitive
   copies, shape-hunt its table copies; the card-art <style> blocks move into
   the shared layer (the graph vocabulary is a shared component, same as the
   .ch/.ord primitives were on 2026-09-05) and the .cbg ground fill is deleted
   at its generator. Literal values in template.css()/nav.js/bench.css/
   overlay.css/index.css → tokens; the ratchet (P0-d) records the descent.

P3 · NO INLINE CSS (D1) — the long one, 30 source files
   · rhythm & measure (margin-top:var(--s-N), max-width:Nch ×~205): structural
     rules in the shared layer (.sec, .sec-head, .lede, .prose p+p, .note),
     one-offs as a named class in the page's own sheet with a reason
   · typography & colour (×~80): the existing classes (.eyebrow, .fine, .lab,
     .muted) or new ones in the shared layer
   · marks (--f, width:N%, left:N% ×236): SVG bars/markers with geometry
     attributes; grid-template-columns ×25: named grid classes (5 shapes)
   · cm-cross opacity → a rule (charts.js + the three copies); display:none →
     the `hidden` attribute; the oracle/observatory widget → .cm-* classes;
     build-site's landing .col → a class
   Every touched page: rebuilt, ruler + render, and PIXEL-DIFFED at 1440 and
   390 against its P2 capture (the 2026-09-05 method); the diff mask must show
   only the intended change.

P4 · THE APP
   build.js (27) and src/app.js templates (22) → classes in appCss; runtime
   `.style` writes that carry data (bar width, arc dashoffset) become
   `style.setProperty('--f', …)` or SVG attributes; head/footer from P1.

P5 · LOOKING
   Screenshots of all 90 pages at 1440 and 390 before (this tree) and after;
   a VISUAL-REVIEW-2026-09-15.md with one row per page whose diff shows more
   than the intended change. The 16 open rows of VISUAL-REVIEW-2026-09-05.md
   are re-read; only template-level ones are taken.

P6 · THE RECORDS
   DESIGN.md (one shell, one stylesheet, the style rule, the var rule),
   CONTRACT.md §3, COMPONENTS.md, DEBT.md (row 4 mostly paid; a follow-up row
   for the full-coverage vendored fonts), HANDOFF menu + session log,
   batteries.json via `make control`. One commit per phase.

## Effort (sessions, honest)

P0 half a day · P1 half a day · P2 half a day · P3 a day and a half · P4 a
quarter day · P5 a quarter day · P6 an hour. About three working days.

## Open to the operator before P1

1. Commit the fourteenth session's 45 pending files first (the UFSC line), so
   this pass has clean boundaries? Recommended.
2. D2 (Google Fonts everywhere, vendored subset deleted) vs vendoring full
   subsets now. Recommended: D2 now, vendoring as a follow-up row.
