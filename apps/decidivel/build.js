/* build.js — Decidível's gated build: the battery green; the ledger's engine
   and declared ranges pinned by sha256 (a ledger written by other code or over
   other ranges refuses); the headline and 24 seeded map cells re-decided and
   compared with the ledger (the whole map is re-derived by `node
   apps/decidivel/run.js --check`, ~4 min on eight threads); then the page
   (site/decidivel/index.html), the deck (site/decidivel/decidivel-apresentacao.pdf)
   and the Nota Técnica (site/decidivel/nota-tecnica-exemplo.pdf), each re-printed
   only when its HTML changes.

   FROZEN (2026-11-16): data/decidivel-ledger.json and data/decidivel-ledger-2026-11-11.json are frozen as submitted
   and pin the interval kernel of their dates (the kernel changed on 2026-11-16); their pins are verified at the
   commit each record was made at (tools/pinned-at.js), and site/decidivel/ is not rebuilt.

   usage: node apps/decidivel/build.js                apps/decidivel · cert-machine  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const APP = __dirname, ROOT = path.join(APP, '..', '..');
const SITE = path.join(ROOT, 'site', 'decidivel');
const DECKSHA = path.join(APP, 'data', 'deck.sha256');
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const die = (m) => { console.error('decidivel build REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* gate 1 — the battery */
let out = '';
try { out = cp.execFileSync('node', [path.join(APP, 'engine', 'battery.js')], { encoding: 'utf8' }); } catch (e) { die('the battery is not green:\n' + (e.stdout || '') + (e.stderr || '')); }
const bm = /decidivel battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired; reference agreement at (\d+) inputs/.exec(out);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole: ' + out);
console.log('gate: ' + out.trim());

/* gate 2 — the ledger is this engine's, over these ranges. The submitted record is FROZEN (2026-11-16, the operator's
   ruling): it keeps pinning the engine and the interval kernel it was written by, and the page inlines those bytes. A
   pin is verified on disk or at the commit the record was made at (tools/pinned-at.js); one that holds nowhere is
   refused as before. One that holds only at that commit names the frozen record's own code, and the build refuses
   too — a rebuild would inline today's code beside a record that pins another, so it waits on the operator's word,
   with a new record. */
const R = require('./engine/rockphys.js');
const L = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'decidivel-ledger.json'), 'utf8'));
{
  const P = require(path.join(ROOT, 'tools', 'pinned-at.js')).check('apps/decidivel/data/decidivel-ledger.json', Object.assign({}, L.engine, { [L.declared.file]: L.declared.sha256 }));
  const nowhere = P.pins.filter((x) => !x.holds).map((x) => x.file), atCommit = P.pins.filter((x) => x.holds === 'commit').map((x) => x.file);
  if (nowhere.length) die(nowhere.join(', ') + ' is not the code that wrote the ledger, on disk or at the commit it was made at (run apps/decidivel/run.js)');
  if (atCommit.length) die('the ledger is the FROZEN record of the submitted page: it pins ' + atCommit.join(', ') + ' as at ' + P.commit.slice(0, 8) + ' (' + P.date + '), not the code on disk; the page stays as submitted (a rebuild is the operator\'s word, with a new record)');
}

/* gate 3 — a seeded sample re-decided */
const D = JSON.parse(fs.readFileSync(path.join(APP, 'declared.json'), 'utf8'));
const nx = L.axes.phi.length;
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const r6 = (x) => (x === null ? null : Math.round(x * 1e6) / 1e6);
for (let n = 0; n < 24; n++) {
  const k = L.scenarios[Math.floor(rnd() * L.scenarios.length)], idx = Math.floor(rnd() * L.maps[k].length);
  const box = Object.assign({}, D.box, D.scenarios[k].mod, { phi: L.axes.phi[idx % nx], dSg: L.axes.sg[Math.floor(idx / nx)] });
  const A = R.absRange(R.box(box), { budget: L.budget });
  const v = [Math.floor(A.lo * 1e6) / 1e6, A.loA === null ? null : r6(A.loA), A.hiA === null ? null : r6(A.hiA), Math.ceil(A.hi * 1e6) / 1e6, A.sign];
  if (JSON.stringify(v) !== JSON.stringify(L.maps[k][idx])) die('map cell ' + k + '/' + idx + ' re-decides to ' + JSON.stringify(v) + ', the ledger says ' + JSON.stringify(L.maps[k][idx]));
}
const hr = R.decide(L.headline.box, { theta: L.headline.theta }, { noPrice: true, budget: L.budget });
if (JSON.stringify(hr) !== JSON.stringify(L.headline.receipt)) die('the headline receipt re-decides differently');
console.log('gate: ledger pinned; headline and 24 seeded cells re-decided identical');

/* the bundle the reader's tab re-decides with */
function bundle() {
  const MODS = ['instruments/interval/interval.js', 'instruments/interval/rational.js', 'apps/decidivel/engine/rockphys.js'];
  const parts = MODS.map((rel) => {
    const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (/<\/script/i.test(t)) die('bundle: ' + rel + ' holds a closing script tag');
    return '  ' + JSON.stringify(path.basename(rel)) + ': function (module, exports, require) {\n' + t + '\n  }';
  });
  return '(function (root) {\n"use strict";\nvar SRC = {\n' + parts.join(',\n') + '\n};\nvar cache = {};\n'
    + 'function req(name) { var base = String(name).split("/").pop(); if (cache[base]) return cache[base].exports;'
    + ' if (!SRC[base]) throw new Error("bundle: no module " + name); var m = { exports: {} }; cache[base] = m; SRC[base](m, m.exports, req); return m.exports; }\n'
    + 'root.DECIDIVEL = { R: req("rockphys.js") };\n})(typeof self !== "undefined" ? self : this);';
}

const N = require('./numbers.js').load();
N.battery = bm[1] + ' verificações, ' + bm[3] + '/' + bm[3] + ' controles vermelhos, referência em Python em ' + bm[4] + ' entradas';
const html = require('./page.js').build(N, bundle(), git);
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'index.html'), html);
console.log('site/decidivel/index.html written (' + Math.round(html.length / 1024) + ' KB) @ git ' + git);

/* the deck and the Nota Técnica, each re-printed only when its HTML changes */
const DECK = require('./deck.js'), NOTA = require('./nota.js');
const jobs = [
  { html: DECK.build(N), pdf: path.join(SITE, 'decidivel-apresentacao.pdf'), pin: DECKSHA, name: 'decidivel-apresentacao.pdf' },
  { html: NOTA.build(N, git), pdf: path.join(SITE, 'nota-tecnica-exemplo.pdf'), pin: path.join(APP, 'data', 'nota.sha256'), name: 'nota-tecnica-exemplo.pdf' }
];
(async () => {
  for (const j of jobs) {
    const want = sha(j.html);
    if (fs.existsSync(j.pdf) && fs.existsSync(j.pin) && fs.readFileSync(j.pin, 'utf8').trim() === want) { console.log(j.name + ' unchanged (' + want.slice(0, 12) + ')'); continue; }
    await DECK.print(j.html, j.pdf).catch((e) => die(j.name + ' did not print: ' + e.message));
    fs.writeFileSync(j.pin, want + '\n'); console.log('site/decidivel/' + j.name + ' printed');
  }
})();
