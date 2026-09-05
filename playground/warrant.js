/* warrant.js — what a mark is standing on, and how it is drawn.

   THE ONE SENTENCE. Charts and graders both assert things, and neither
   distinguishes what the data forces from what the renderer or the tolerance
   chose. This file is the first half of the fix: four standings, an order on
   them, and one stroke per standing. It is deliberately tiny, because a grammar
   that needs a library is not a grammar.

   THE FOUR STANDINGS, weakest first:

     REFUSED   the instrument ran and declined — undecided at the budget, out of
               domain, missing. There is NO MARK, and the void is drawn. Never
               interpolated across, never averaged, never a zero.
     CHOSEN    one member of a set the data admits, picked by something that is
               not the data: a prior, a regulariser, a tie-break, a default, a
               seed. Where it is affordable the family is drawn behind it.
     COMPUTED  arithmetic that was not verified — float, a solver stopped at a
               tolerance, a fit. It may well be right. Nothing decided it.
     DECIDED   an exact decision backs it: an interval enclosure, an exact
               rational comparison, a proof.

   THE COMPOSITION RULE, and it is the whole mechanism:

       a mark's standing is the WEAKEST standing on its path to the pixel.

   Combination is the lattice minimum, and three consequences follow that nobody
   gets to argue with:

     1. THE ARITHMETIC DEMOTES, NEVER THE AUTHOR. An operation keeps DECIDED only
        if the operation itself is certified. A float step takes DECIDED to
        COMPUTED automatically.
     2. REFUSED IS ABSORBING. Anything downstream of a refused input is refused.
     3. SELECTION DEMOTES TO CHOSEN. An argmin or argmax over a set whose optimum
        is NOT unique yields CHOSEN — and so does every tie-break, default
        parameter and seed. Every regularised inverse problem is this shape, and
        this is the rule that dots the published calibration curve on
        /instruments/curveset.

   STANDING IS NOT A VERDICT, AND THE SITE CARRIES BOTH. A VERDICT is what an
   instrument CONCLUDED about a claim — CERTIFIED, REFUTED, REFUSED, NEEDS DATA
   — and it is the thing the report pages publish. A STANDING is what a mark is
   RESTING ON. They are orthogonal, and the clearest proof is that a REFUTED
   verdict has DECIDED standing: a refutation here is proved, so the mark
   carrying it is solid. A CERTIFIED verdict also has DECIDED standing. A
   verdict reached by a float screen would have COMPUTED standing whatever it
   concluded. So the two axes never share a channel: verdicts wear the chip
   grammar (filled / outlined / dashed, weight and shape), standings wear the
   stroke grammar, and a reader can always ask both questions separately.

   WHAT THIS IS NOT. It is not a confidence encoding and must not be read as one.
   A value can be known to fourteen decimals and still be undecided; a value can
   be certified and have a wide bracket. Width is drawn separately, as an extent,
   so the two axes never collapse into one channel. And standing is never colour
   alone — stroke pattern carries it, so it survives greyscale and a colour-blind
   reader, and colour stays free for what it already carries.

   Prior art this is narrowed against — read corpus/targets.json before claiming
   anything: uncertainty visualization (Padilla, Kay & Hullman), provenance
   visualization (Ragan et al.), imputed-value encoding (Song & Szafir),
   verifiable visualization (Kirby & Silva), and the lineup protocol (Buja et
   al. 2009). None of them separates verification standing from confidence.
*/
'use strict';

/* THE DASH PATTERNS ARE NOT OURS TO INVENT, 2026-09-05. This file used to
   derive them from the stroke width — `${3.2 * width} ${2.2 * width}` — so
   every width minted a new pattern and the site accumulated TWENTY-FIVE of
   them, one carrying a float artifact ("1.04 5.460000000000001") into
   published HTML. Two marks of the SAME standing at two weights were being
   given two different patterns, which is the exact confusion this grammar
   exists to prevent. The permitted set is now a closed list in
   design/grammar.js, ported from frontier-apps, and gated by
   tools/check-grammar.js. Size is handled by one alternate pattern, chosen
   from the width THERE, never by scaling. */
const G = require('../design/grammar.js');

/* the lattice, weakest first. The numbers ARE the order. */
const REFUSED = 0, CHOSEN = 1, COMPUTED = 2, DECIDED = 3;
const NAME = ['REFUSED', 'CHOSEN', 'COMPUTED', 'DECIDED'];

/* combination is the minimum — the weakest standing on the path wins */
const meet = (...s) => s.reduce((a, b) => (b < a ? b : a), DECIDED);

/* the demotions, named so a call site reads as the rule it is applying */
const throughFloat = (s) => meet(s, COMPUTED);
const throughChoice = (s) => meet(s, CHOSEN);
const refuse = () => REFUSED;

/* THE CHANNEL RULE — AND THE LICENCE IT USED TO GRANT IS WITHDRAWN, 2026-09-05.
   This note used to say that in a figure whose marks all share a standing the
   stroke channel is free, so identity may borrow it; /instruments/answer-shape
   drew its three models as three dash patterns under exactly that licence.

   The ported contract (design/CONTRACT.md, from frontier-apps) refuses it, and
   is right: DASH IS RESERVED FOR STANDING SITE-WIDE, not per figure. A licence
   that depends on what else is in the same figure cannot be read off the mark,
   so the same pattern meant epistemics on one page and a category two clicks
   away — and a reader who has learnt "dashed means assumed" is simply misled by
   the second page. Frontier had made this exact mistake, on `6 4` and
   `1.6 3.4`, and both patterns were found live here.

   IDENTITY USES WEIGHT AND OPACITY — design/grammar.js's IDENTITY ladder. It
   does not overload, and it costs nothing: answer-shape was already carrying
   the ladder underneath the dashes, value for value. Stroke pattern now carries
   STANDING and nothing else, in every figure, without exception. */

/* one stroke per standing. Dash patterns are ours; any consistent set obeying
   the redundancy rule conforms. A REFUSED mark has no stroke at all — asking
   for one is a bug at the call site, so it returns null rather than a style. */
function stroke(standing, { width = 2 } = {}) {
  switch (standing) {
    case DECIDED: return { class: 'w-decided', dash: null, width };
    case COMPUTED: return { class: 'w-computed', dash: G.claim(width), width };
    case CHOSEN: return { class: 'w-chosen', dash: G.pick(width), width, cap: 'round' };
    default: return null;
  }
}
/* the SVG attribute string, so no call site hand-writes a dasharray */
function attrs(standing, opts) {
  const s = stroke(standing, opts);
  if (!s) return 'class="w-void" fill="none"';
  return `class="${s.class}" fill="none" stroke-width="${s.width}"`
    + (s.dash ? ` stroke-dasharray="${s.dash}"` : '')
    + (s.cap ? ` stroke-linecap="${s.cap}"` : '');
}

/* ------------------------------------------------- LINES AND EXTENTS ------
   FOUND BY BUILDING, 2026-09-04, the moment the grammar was first applied to a
   page that had been lying about itself. Demoting curveset's envelope from
   decided to computed also demoted the horizontal BARS in its ladder figure —
   and a 7px bar with a width-proportional dash is not a computed bar, it is a
   row of dashes. The pattern is defined for a LINE. A bar is not a line.

     A LINE carries standing in its stroke pattern.
     AN EXTENT — a bar, a bracket, a band — carries a QUANTITY in its length,
     so its body stays solid and standing is carried by SHAPE: a body means a
     value, a hatched void means refused. A figure of extents must say in
     words what standing its bodies have, because the pattern channel is not
     available to it.

   That is not a loophole, it is the same rule the channel note already makes:
   the stroke channel carries standing when a figure holds more than one
   standing IN THAT CHANNEL. In a ladder of computed bars and refused voids the
   voids are drawn as a different SHAPE, so the pattern channel holds exactly
   one standing and is free — and the figure has to say what it is doing
   instead, which is what the caption is for. */
function extentAttrs(standing, opts) {
  const s = stroke(standing, opts);
  if (!s) return 'class="w-void" fill="none"';
  return `class="${s.class}" fill="none" stroke-width="${s.width}"`;   /* no dasharray: an extent is not a line */
}

/* ------------------------------------------------------- the HTML half ----
   ONE CLASS SET, TWO MEDIA. Until 2026-09-04 the grammar reached exactly one
   channel: stroke pattern inside an <svg>. Everywhere else — a number in a
   table, a value in a readout, a figure caption — a decided quantity and a
   float looked identical, and pages that cared had rolled their own dimming by
   hand. The lattice was general and was being spent on dashes.

   So the same class carries the standing in both media. In SVG it is a stroke;
   in HTML it is a voice: brightness plus THE SAME DASH PATTERN, drawn as the
   underline. A computed value is underlined dashed exactly as a computed line
   is dashed; a chosen value is underlined dotted; a decided value carries no
   mark at all, because decided is the voice the rest of the site is written in
   and marking it would make the exception the rule.

   BRIGHTNESS ALONE WOULD BE WRONG and the page that defines the grammar says
   why: "a dotted line here is not less precise — it is often far more precise".
   Dimness reads as low confidence, so the underline does the work and the
   brightness only supports it. Never colour alone, never brightness alone. */
function textClass(standing) {
  switch (standing) {
    case DECIDED: return 'w-decided';
    case COMPUTED: return 'w-computed';
    case CHOSEN: return 'w-chosen';
    default: return 'w-refused';
  }
}

/* a value with its standing on it. The title is not decoration — it is the
   only affordance a reader has on a phone, where nothing hovers. */
function value(text, standing, { title } = {}) {
  const t = title || GLOSS[standing];
  return `<span class="w-val ${textClass(standing)}" title="${String(t).replace(/"/g, '&quot;')}">${text}</span>`;
}

/* the legend, in the page's own words rather than the spec's. Every page that
   uses the grammar prints this, because a grammar nobody is told about is a
   decoration. */
const LEGEND = [
  { s: DECIDED, label: 'decided', gloss: 'exact arithmetic backs it' },
  { s: COMPUTED, label: 'computed', gloss: 'float; nothing decided it' },
  { s: CHOSEN, label: 'chosen', gloss: 'one member of a set the data admits' },
  { s: REFUSED, label: 'refused', gloss: 'no mark — the void is drawn' },
];


/* ---------------------------------------------------------- the renderer --
   THE LEGEND IS DRAWN HERE, not on the page. It was written out twice — in
   curveset/build.js and plates/build.js, the same swatch, the same two-line
   caption, the same loop, once including REFUSED and once filtering it out —
   and the CSS behind it was declared four times under a name two OTHER
   components were also using. A grammar whose legend disagrees with itself
   between two pages is not a grammar.

   `data-n` is the item count, and the balanced grid in design/grid.js reads it:
   four standings lay out as one row of four, three as one row of three, and
   nothing declares a column count by hand any more.

   A page that does not use REFUSED passes `exclude: [REFUSED]` rather than
   drawing a void it has no marks for — plates does exactly that, and saying so
   in the call is better than a filter copied into the page.                 */
function legendHtml({ exclude = [], width = 2.4 } = {}) {
  const items = LEGEND.filter((L) => !exclude.includes(L.s));
  const swatch = (s) => (s === REFUSED
    ? `<rect x="0" y="1" width="46" height="12" class="w-void"/>`
    : `<line x1="1" y1="7" x2="45" y2="7" ${attrs(s, { width })}/>`);
  return `<div class="w-legend" data-n="${items.length}">`
    + items.map((L) => `<div class="item">`
      + `<svg viewBox="0 0 46 14" aria-hidden="true">${swatch(L.s)}</svg>`
      + `<div><div class="k">${L.label}</div><div class="g">${L.gloss}</div></div>`
      + `</div>`).join('')
    + `</div>`;
}

/* one gloss per standing, derived from LEGEND so the tooltip and the legend
   cannot say different things */
const GLOSS = LEGEND.reduce((o, L) => { o[L.s] = L.label + ' — ' + L.gloss; return o; }, {});

module.exports = { REFUSED, CHOSEN, COMPUTED, DECIDED, NAME, meet, throughFloat, throughChoice,
  refuse, stroke, attrs, extentAttrs, LEGEND, legendHtml, textClass, value, GLOSS };
