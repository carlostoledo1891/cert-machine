/* grammar.js — the only place a dash pattern is written down.
   design/ · cert-machine

   PORTED from frontier-apps/site/design/grammar.js (2026-09-05), which states
   the rule this repository had been breaking:

       Ink is READ, never CHOSEN. Renderers derive it from the data's own type
       and take NO STYLE ARGUMENT, so an author cannot draw a float as though
       it were proved.

   WHY THIS FILE EXISTS HERE, measured rather than argued. The audit in
   CONTRACT.md, run against site/ on 2026-09-05, returned TWENTY-FIVE distinct
   dash patterns. The cause was not carelessness at the call sites; it was two
   lines in playground/warrant.js, which derived the dash from the STROKE WIDTH:

       dash: `${3.2 * width} ${2.2 * width}`     width 2.4 -> "7.68 5.28"
                                                 width 2   -> "6.4 4.4"
       dash: `${0.4 * width} ${2.1 * width}`     width 2.6 -> "1.04 5.460000000000001"

   So every stroke width minted a new pattern, one of them carrying a float
   artifact into published HTML. A pattern that varies with width is not a
   grammar — two marks of the same STANDING drawn at two weights were being
   given two different patterns, which is precisely the confusion the standing
   grammar exists to prevent.

   THE PATTERNS ARE CONSTANTS. Size is handled by ONE alternate pattern per
   standing, selected from the width by this file, never by scaling. Frontier's
   two are kept verbatim; cert-machine needs two more because its lattice has
   four standings where frontier's has two (see playground/warrant.js), and
   those two are declared here so the permitted set stays closed and countable.

   DASH IS RESERVED FOR STANDING. It must never carry identity — "the second of
   three models" — because the same mark would then mean epistemics on one page
   and a category two clicks away. frontier's CONTRACT.md records that exact
   violation (`6 4` and `1.6 3.4` on a neural-geometry overlay), and the audit
   found BOTH of those patterns live in this repository, on
   site/instruments/answer-shape/index.html. Identity uses weight and opacity,
   which do not overload. IDENTITY below is that ladder. */
'use strict';

/* ---------------------------------------------------------- the patterns --
   The complete permitted set. tools/check-grammar.js gates it; anything not on
   this list appearing in a built page is drift. */

const CLAIM     = '5 4';     /* asserted, not decided — a float, a fit, a heuristic */
const CLAIM_SM  = '1.5 2';   /* the same statement under ~10px, where 5 4 is mush */
const PICK      = '1 5';     /* one member of a set the data admits. Round-capped. */
const PICK_SM   = '1 3';     /* the same, small */
const GUIDE     = '2 3';     /* an axis, a ruler, a ghost. Says nothing. */
const SOLID     = null;      /* decided. Not a pattern: the absence of one. */

/* Every pattern this repository is allowed to emit, for the gate to read. */
const PERMITTED = [CLAIM, CLAIM_SM, PICK, PICK_SM, GUIDE];

/* Below this stroke width the long patterns read as mush, so the small variant
   is used. It is chosen HERE, from the width the renderer already has — not
   passed in, and not scaled. */
const SMALL_BELOW = 1.5;

const claim = (width = 2) => (width < SMALL_BELOW ? CLAIM_SM : CLAIM);
const pick  = (width = 2) => (width < SMALL_BELOW ? PICK_SM : PICK);

/* --------------------------------------------------------------- identity --
   The channel to reach for when a figure needs to separate SERIES rather than
   standings. Never dash. Weight and opacity do not overload, so a decided line
   and an assumed line stay distinguishable inside any one series. */
const IDENTITY = [
  { weight: 1.7, opacity: 0.95 },
  { weight: 1.3, opacity: 0.62 },
  { weight: 1.1, opacity: 0.42 },
];

/* ------------------------------------------------------------------- css --
   For pages that want the grammar as classes rather than attributes. The
   class names match playground/warrant.js's textClass() so one vocabulary
   covers SVG strokes and HTML underlines. */
const css = (sel = '') => `
${sel} .ink-decided  { stroke-dasharray: none; }
${sel} .ink-assumed  { stroke-dasharray: ${CLAIM}; }
${sel} .ink-assumed-sm { stroke-dasharray: ${CLAIM_SM}; }
${sel} .ink-chosen   { stroke-dasharray: ${PICK}; stroke-linecap: round; }
${sel} .ink-chosen-sm { stroke-dasharray: ${PICK_SM}; stroke-linecap: round; }
${sel} .ink-guide    { stroke-dasharray: ${GUIDE}; }`;

/* canvas: setLineDash takes an array, and takes it from here too */
const dash = {
  claim: [5, 4], claimSm: [1.5, 2],
  pick: [1, 5], pickSm: [1, 3],
  guide: [2, 3], none: [],
};

module.exports = {
  CLAIM, CLAIM_SM, PICK, PICK_SM, GUIDE, SOLID,
  PERMITTED, SMALL_BELOW, claim, pick, IDENTITY, css, dash,
};
