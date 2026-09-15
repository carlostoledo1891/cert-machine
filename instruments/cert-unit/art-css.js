/* art-css.js — the two figure vocabularies the cert-unit renderers draw in,
   as ONE source both an ESM renderer and the CommonJS component layer can read.
   instruments/cert-unit · cert-machine · 2026-09-15

   WHY IT EXISTS. `render.mjs` (the unit graph) and `contact.mjs` (the contact
   sheet) each carried their vocabulary as an exported template literal and
   emitted it as a <style> INSIDE the SVG, which is right for a standalone
   .svg file and wrong for a page: four pages inlined that art and got a
   second, third, fourth stylesheet — the drift `design/DESIGN.md` names, and
   the same shape as the 2026-09-05 defect where the gathering page embedded
   art WITHOUT its vocabulary and twelve kinds of element painted nothing.

   So the rules live here, once. `playground/design/components.js` folds them
   into the shared layer every /instruments page already inlines; the
   renderers import them for the standalone files; and
   `components.embedArt()` strips the style block when a page inlines the art,
   because the page already has the rules.

   This file is CommonJS on purpose: an .mjs can `import` it (Node hands the
   module.exports object to the default import) and a .js can `require` it.
   One file, both worlds, no copy. */
'use strict';

/* the unit graph: nodes, ports, wires. Drawn by render.mjs. */
const GRAPH_CSS = `
.ug .nd { fill:var(--bg-raised); stroke:var(--ink); stroke-opacity:.22; }
.ug .nd.inst { stroke-opacity:.45; }
.ug .sep { stroke:var(--ink); stroke-opacity:.14; }
.ug .nt { fill:var(--ink-2); font-family:var(--f-mono); font-size:8px; }
.ug .pl { fill:var(--ink-3); font-family:var(--f-mono); font-size:6.5px; }
.ug .pl.fired { fill:var(--ink); }
.ug .cap { fill:var(--ink-4); font-family:var(--f-mono); font-size:7px; letter-spacing:.12em; }
.ug .pt { fill:var(--paper); stroke:var(--ink); stroke-opacity:.6; stroke-width:1.2; }
.ug .pt.dec { fill:var(--ink); fill-opacity:.75; stroke:none; }
.ug .pt.idle { stroke-opacity:.28; }
.ug .pt.fired { fill:var(--ink); stroke:var(--ink); }
.ug .w { fill:none; stroke:var(--ink); stroke-width:1.2; }
.ug .w.solid { stroke-opacity:.75; }
.ug .w.dashed { stroke-opacity:.42; stroke-dasharray:5 4; }   /* grammar.js CLAIM */`;

/* the contact sheet: one cell per rollout. Drawn by contact.mjs. */
const CONTACT_CSS = `
.cg .cs { fill:var(--ink); fill-opacity:.05; stroke:none; }
.cg .cs.fired { fill-opacity:.92; }
/* fill inside a ring is right; a fill with no ring is a wrong answer; a ring
   with no fill is the answer it missed. */
.cg .ck { fill:none; stroke:var(--ink); stroke-opacity:.5; stroke-width:1; }
.cg .cl { fill:var(--ink-3); font-family:var(--f-mono); font-size:9px; }
.cg .cp { fill:var(--ink-4); font-family:var(--f-mono); font-size:6.5px; }
.cg .ct { fill:var(--ink); font-family:var(--f-mono); font-size:10px; letter-spacing:.1em; }
.cg .cn { fill:var(--ink-4); font-family:var(--f-mono); font-size:8px; }
.cg .cr { stroke:var(--ink); stroke-width:1.6; }
.cg .cr.solid { stroke-opacity:.55; }
.cg .cr.dashed { stroke-opacity:.28; stroke-dasharray:1.5 2; }`;

module.exports = { GRAPH_CSS, CONTACT_CSS };
