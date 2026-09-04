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
        /playground/curveset.

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

/* the lattice, weakest first. The numbers ARE the order. */
const REFUSED = 0, CHOSEN = 1, COMPUTED = 2, DECIDED = 3;
const NAME = ['REFUSED', 'CHOSEN', 'COMPUTED', 'DECIDED'];

/* combination is the minimum — the weakest standing on the path wins */
const meet = (...s) => s.reduce((a, b) => (b < a ? b : a), DECIDED);

/* the demotions, named so a call site reads as the rule it is applying */
const throughFloat = (s) => meet(s, COMPUTED);
const throughChoice = (s) => meet(s, CHOSEN);
const refuse = () => REFUSED;

/* one stroke per standing. Dash patterns are ours; any consistent set obeying
   the redundancy rule conforms. A REFUSED mark has no stroke at all — asking
   for one is a bug at the call site, so it returns null rather than a style. */
function stroke(standing, { width = 2 } = {}) {
  switch (standing) {
    case DECIDED: return { class: 'w-decided', dash: null, width };
    case COMPUTED: return { class: 'w-computed', dash: `${3.2 * width} ${2.2 * width}`, width };
    case CHOSEN: return { class: 'w-chosen', dash: `${0.4 * width} ${2.1 * width}`, width, cap: 'round' };
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

/* the legend, in the page's own words rather than the spec's. Every page that
   uses the grammar prints this, because a grammar nobody is told about is a
   decoration. */
const LEGEND = [
  { s: DECIDED, label: 'decided', gloss: 'exact arithmetic backs it' },
  { s: COMPUTED, label: 'computed', gloss: 'float; nothing decided it' },
  { s: CHOSEN, label: 'chosen', gloss: 'one member of a set the data admits' },
  { s: REFUSED, label: 'refused', gloss: 'no mark — the void is drawn' },
];

module.exports = { REFUSED, CHOSEN, COMPUTED, DECIDED, NAME, meet, throughFloat, throughChoice, refuse, stroke, attrs, LEGEND };
