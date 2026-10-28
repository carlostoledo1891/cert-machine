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
const vm = require('vm');
const CU = path.join(__dirname, '..', '..', 'instruments', 'cert-unit');

const ORDER = ['port.mjs', 'graph.mjs', 'render.mjs', 'editor.mjs'];

/* THE ONE IMPORT THAT IS NOT IN SCOPE (found 2026-10-28, applying WARRANT v2 to /instruments/rewire). Since
   a2424347 (2026-09-15) render.mjs takes its vocabulary as `import ART from './art-css.js'` — a DEFAULT import of
   a CommonJS file, not a sibling .mjs already concatenated here — and strip() below deleted the line like every
   other import. The bundle then threw `ART is not defined` at load, window.CERTUNIT was never set, and for six
   weeks /instruments/rewire drew NO GRAPH (an empty stage, every readout "—") and the editor on /instruments/graph
   mounted nothing; every gate was green, because none of them runs the page's script. So a default import of a .js
   file is now inlined as the value it exports (plain data: art-css.js exports two strings), and bundle() loads the
   finished script once in a bare context and refuses to return one that does not set window.CERTUNIT. */
const DEFAULT_IMPORT = /^import\s+(\w+)\s+from\s+'\.\/([\w-]+\.js)';\s*$/gm;

function strip(src, file) {
  const out = src
    .replace(DEFAULT_IMPORT, (_, name, dep) => `const ${name} = ${JSON.stringify(require(path.join(CU, dep)))};`)
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
  const js = '(function(){\n"use strict";\n' + parts.join('\n')
    + '\nwindow.CERTUNIT = { node: node, graph: graph, mount: mount, tryWire: tryWire,'
    + ' FLOAT: FLOAT, INTERVAL: INTERVAL, RATIONAL: RATIONAL, GEOM: GEOM, WiringRefused: WiringRefused, CSS: CSS };\n})();';
  const box = { window: {} };
  try { vm.runInNewContext(js, box, { filename: 'cert-unit-bundle.js' }); }
  catch (e) { throw new Error('bundle: the cert-unit bundle throws at load (' + e.message + ') — the page would mount nothing'); }
  if (!box.window.CERTUNIT || typeof box.window.CERTUNIT.mount !== 'function') throw new Error('bundle: the cert-unit bundle loads but sets no window.CERTUNIT');
  return js;
}

module.exports = { bundle, ORDER };
