/* bundle.js — the hseva modules, byte for byte, behind a twelve-line require, for
   the pages that certify in the reader's tab (return-level-check, return-level-
   atlas). One bundler, so the two pages cannot inline different code under the
   same name. Returns the bundle's text and the sha256 of every module in it. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..');
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

const CORE = [
  ['interval.js', 'instruments/interval/interval.js'], ['rational.js', 'instruments/interval/rational.js'],
  ['transcendental.js', 'instruments/interval/transcendental.js'], ['radii.js', 'instruments/interval/radii.js'],
  ['special.js', 'instruments/hseva/special.js'], ['ad2.js', 'instruments/hseva/ad2.js'], ['families.js', 'instruments/hseva/families.js'],
  ['fit.js', 'instruments/hseva/fit.js'], ['blockrule.js', 'instruments/hseva/blockrule.js'],
];

/* extra: more [name, rel] pairs; expose: { NAME: 'module.js' } put on root.HSEVA */
function bundle(extra, expose) {
  const MODS = CORE.concat(extra || []);
  const modules = {}, parts = [];
  for (const [name, rel] of MODS) {
    const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (/<\/script/i.test(t)) throw new Error('bundle: ' + rel + ' holds a closing script tag');
    modules[rel] = sha(t);
    parts.push('  ' + JSON.stringify(name) + ': function (module, exports, require, __dirname) {\n' + t + '\n  }');
  }
  const ex = Object.assign({ FT: 'fit.js', FAM: 'families.js', BR: 'blockrule.js' }, expose || {});
  const BUNDLE = '(function (root) {\n"use strict";\nvar SRC = {\n' + parts.join(',\n') + '\n};\n'
    + 'var cache = {};\n'
    + 'function req(name) {\n'
    + '  if (name === "path") return { join: function () { return Array.prototype.join.call(arguments, "/"); } };\n'
    + '  var base = String(name).split("/").pop();\n'
    + '  if (cache[base]) return cache[base].exports;\n'
    + '  if (!SRC[base]) throw new Error("bundle: no module " + name);\n'
    + '  var m = { exports: {} }; cache[base] = m; SRC[base](m, m.exports, req, ""); return m.exports;\n'
    + '}\n'
    + 'root.HSEVA = { ' + Object.entries(ex).map(([k, v]) => k + ': req(' + JSON.stringify(v) + ')').join(', ') + ' };\n'
    + '})(typeof self !== "undefined" ? self : this);\n';
  return { BUNDLE, modules };
}

module.exports = { bundle, CORE };
