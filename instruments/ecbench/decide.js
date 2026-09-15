/* instruments/ecbench/decide.js — the node face of the exact plane geometry.

   The geometry itself lives in geometry.js, which has no require() so the
   instrument page can inline the same bytes; this module re-exports it and
   checks that the literal reader here and the one in lib.js agree on a
   witness, so the two copies cannot drift apart silently. */
'use strict';
const L = require('./lib.js');
const G = require('./geometry.js');
for (const s of ['0.2845', '-1.5e-3', '4.283446918632201', '2.00000000000000000001']) {
  if (L.scaled(s, 24) !== G.scaledLit(s, 24) || L.lit(s).v !== G.lit(s).v) throw new Error('decide.js: geometry.js and lib.js read the literal ' + s + ' differently');
}
module.exports = G;
