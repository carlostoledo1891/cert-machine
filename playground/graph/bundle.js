/* bundle.js — the four cert-unit modules as ONE classic script.
   playground/graph/ · cert-machine · 2026-09-05

   WHY NOT <script type="module">. The site is reviewed from disk before it is
   pushed (design/CONTRACT.md, and the session that forgot it), and Chrome
   refuses ESM imports over file:// — so a page whose editor only works after
   deploy is a page nobody can check. These four files have NO name collisions
   between them (verified: port, graph, render and editor share not one
   top-level identifier), so concatenating them in dependency order inside one
   IIFE is a correct bundle rather than a hopeful one.

   nodes.mjs is deliberately NOT here: it require()s the interval library and
   belongs to Node. The browser half is about WIRING, and wiring needs no
   bodies — which is exactly the claim the page makes. */
'use strict';
const fs = require('fs');
const path = require('path');
const CU = path.join(__dirname, '..', '..', 'instruments', 'cert-unit');

const ORDER = ['port.mjs', 'graph.mjs', 'render.mjs', 'editor.mjs'];

function strip(src, file) {
  const out = src
    .replace(/^import\s[^;]*;\s*$/gm, '')           /* the deps are in scope already */
    .replace(/^export\s+(const|function|class|let|var)\s/gm, '$1 ')
    .replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  if (/^\s*export\s/m.test(out)) throw new Error('bundle: an export survived in ' + file);
  if (/^\s*import\s/m.test(out)) throw new Error('bundle: an import survived in ' + file);
  return out;
}

function bundle() {
  const parts = ORDER.map((f) => '/* ---- ' + f + ' ---- */\n'
    + strip(fs.readFileSync(path.join(CU, f), 'utf8'), f));
  return '(function(){\n"use strict";\n' + parts.join('\n')
    + '\nwindow.CERTUNIT = { node: node, graph: graph, mount: mount, tryWire: tryWire,'
    + ' FLOAT: FLOAT, INTERVAL: INTERVAL, RATIONAL: RATIONAL, GEOM: GEOM, WiringRefused: WiringRefused, CSS: CSS };\n})();';
}

module.exports = { bundle, ORDER };
