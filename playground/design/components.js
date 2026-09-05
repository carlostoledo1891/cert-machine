/* components.js — the /instruments component layer, declared ONCE.
   playground/design/ · cert-machine · 2026-09-04 (phase 3 of the one-seed pass)

   WHY THIS FILE EXISTS, in numbers. An audit of the eleven stylesheets that
   ship to /instruments found 32 class names declared in more than one place,
   and — as CLAUDE.md predicts every time — the copies had already drifted:

     .eyebrow   7 declarations
     .hero      5 declarations, TWO different bottom paddings, so the hero was
                a different height on curveset than on its two siblings and
                nobody chose that
     .foot      5 declarations, THREE distinct rule bodies; one of them carried
                a margin-top the other two did not
     .panel     3 declarations, two of them the same component and one of them
                a fixed overlay that happened to want the same word

   None of that was visible. All five pages still looked like pages.

   WHAT IS HERE is the furniture every document-shaped page in /instruments
   uses, plus THE GRAMMAR'S OWN LEGEND. What is NOT here is anything one page
   uses once — a page keeps its own sheet for its own components, which is the
   arrangement /instruments has always had and the reason it can move fast.

   THE LEGEND IS THE POINT OF THE FILE. `.legend` was one name over THREE
   DIFFERENT COMPONENTS: the warrant standing legend (curveset, plates), a flat
   category swatch row (neural-geometry) and a model identity row
   (answer-shape). They shared a name, a stylesheet slot, and nothing else. The
   standing legend is `.w-legend` now, it is rendered by warrant.js rather than
   copied into two builders, and its column count comes from design/grid.js
   keyed on data-n — so four standings lay out as four, three as three, and no
   page declares a number.

   Generated rather than static because it needs balancedGrid; inlined by
   playground/build.js after shell.css.                                       */
'use strict';

const path = require('path');
const { balancedGrid } = require(path.resolve(__dirname, '..', '..', 'design', 'grid.js'));

function sharedCss() {
  return `
/* ---- the eyebrow: seven declarations before this, and the weight was the
   thing they disagreed about. The report engine sets 500, bench.css set none
   at all, and interferometer set 500 on its own — so /instruments ran its
   eyebrows a weight lighter than the reports on every page but one. 500, once,
   on both sides of the site. ---- */
.eyebrow { font-family: var(--font-mono); font-size: var(--text-eyebrow); font-weight: 500;
  letter-spacing: var(--track-eyebrow); text-transform: uppercase; color: var(--ink-4); }

/* ---- the hero. The bottom padding is the LARGER of the two that were in
   service; curveset's tighter one was not a decision, it was a copy that had
   drifted. A page wanting a different hero (the gathering page does, and says
   so) overrides these two properties and nothing else. ---- */
.hero { padding: clamp(2.5rem, 8vh, 6rem) 0 clamp(2rem, 5vh, 4rem); }
.hero h1 { font-size: clamp(2.1rem, 1rem + 4vw, 3.9rem); max-width: var(--title);
  margin-top: var(--s-4); text-wrap: balance; }
.hero .lede { margin-top: var(--s-6); max-width: var(--read); font-size: var(--text-3);
  color: var(--ink-3); line-height: 1.55; }
.hero .lede b { color: var(--ink-2); font-weight: var(--weight-medium); }

/* ---- the footer, with the margin-top the crossed pages had and the written
   ones did not ---- */
.foot { border-top: 1px solid var(--border); padding: var(--s-6) 0 var(--s-8); margin-top: var(--s-7); }
.foot .line { display: flex; flex-wrap: wrap; gap: var(--s-3) var(--s-6);
  font-family: var(--font-mono); font-size: var(--text-eyebrow); letter-spacing: 0.1em; color: var(--ink-5); }
.foot a { color: var(--ink-4); text-decoration: none; }
.foot a:hover { color: var(--ink-2); }

/* ---- the panel: a raised box with a hairline. Spacing between consecutive
   panels is a sibling rule, so a page never adds a margin-top of its own and
   the two versions cannot disagree about which edge carries the gap. ---- */
.panel { background: var(--bg-raised); border: 1px solid var(--border);
  border-radius: var(--radius-l); padding: var(--s-5); }
.panel + .panel { margin-top: clamp(1.25rem, 3vw, 2.5rem); }

/* ---- THE GRAMMAR. Stroke pattern carries standing; see ../warrant.js for the
   rule about when the channel is free. A REFUSED mark has no stroke at all —
   the void is a hatched field, never a line. ---- */
.w-decided { stroke: var(--ink); }
.w-computed { stroke: var(--ink-3); }
.w-chosen { stroke: var(--ink-2); }
/* THE SAME CLASSES IN HTML. In an <svg> these set a stroke; on a word they set
   a voice, and the voice uses THE SAME DASH PATTERN as the line — a computed
   value is underlined dashed exactly as a computed curve is dashed, a chosen
   value dotted. Decided carries no mark: it is the voice the rest of the site
   is written in, and marking it would make the exception the rule.

   The underline does the work and brightness only supports it, because
   dimness alone reads as low confidence and standing is not confidence — the
   page that defines the grammar says so in as many words. */
.w-val { text-underline-offset: 0.24em; text-decoration-thickness: from-font; }
.w-decided { color: var(--ink); }
.w-computed { color: var(--ink-2); text-decoration: underline dashed var(--ink-4); }
.w-chosen { color: var(--ink-2); text-decoration: underline dotted var(--ink-4); }
.w-refused { color: var(--ink-4); font-style: normal; }
/* a REFUSED value is not printed dim — it is NOT PRINTED. What the page shows
   instead is the reason, and this is the voice it says it in. */
span.w-refused::before { content: "\\2205\\00a0"; color: var(--ink-5); }

/* .w-void is deliberately NOT here: the void is a hatch, a hatch is an SVG
   <pattern>, and a pattern is addressed by an id that lives in the figure that
   defines it. A shared rule would point every page at one page's id. */

/* ---- the standing legend. Rendered by warrant.js, laid out by
   design/grid.js: the column count is derived from data-n, not declared. ---- */
/* align-items:start on the ROW, so every label sits on one line even when a
   gloss wraps to two — the swatches were floating to the middle of whichever
   item happened to be tallest. */
.w-legend { display: grid; gap: var(--s-3) var(--s-6); margin-top: var(--s-5);
  grid-template-columns: minmax(0, 1fr); align-items: start; }
.w-legend .item { display: grid; grid-template-columns: 46px minmax(0, 1fr);
  gap: var(--s-3); align-items: center; }
.w-legend svg { display: block; width: 46px; height: 14px; overflow: visible; }
.w-legend .k { font-family: var(--font-mono); font-size: var(--text-eyebrow);
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink); }
.w-legend .g { font-size: var(--text-small); color: var(--ink-4); line-height: 1.4; margin-top: 2px; }
@media (min-width: 700px) {
${balancedGrid('.w-legend', '.item')}
}
`;
}

module.exports = { sharedCss };
