/* build.js — Contraprova's gated build: the gate's battery green, the nine
   receipts re-decided and compared with the committed ledger (a deviation
   restores the record and refuses, so drift refuses EVERY run), then the page
   (site/contraprova/index.html) and the deck (site/contraprova/
   contraprova-apresentacao.pdf, re-printed only when its HTML changes).

   usage: node apps/contraprova/build.js [--accept]
     --accept   write a changed ledger instead of refusing (a deliberate change
                to the gate or the scenarios; say why in the commit)
   apps/contraprova · cert-machine                                        MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const APP = __dirname;
const ROOT = path.join(APP, '..', '..');
const SITE = path.join(ROOT, 'site', 'contraprova');
const LEDGER = path.join(APP, 'data', 'gate-ledger.json');
const DECKSHA = path.join(APP, 'data', 'deck.sha256');
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const die = (m) => { console.error('contraprova build REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const ACCEPT = process.argv.includes('--accept');

/* gate 1 — the battery */
let out = '';
try { out = cp.execFileSync('node', [path.join(APP, 'gate', 'battery.js')], { encoding: 'utf8' }); } catch (e) { die('the gate battery is not green:\n' + (e.stdout || '') + (e.stderr || '')); }
const bm = /contraprova gate battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired; reference agreement at (\d+) inputs/.exec(out);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole: ' + out);
console.log('gate: ' + out.trim());

/* gate 2 — the receipts, re-decided and compared with the record */
const MODS = ['instruments/interval/interval.js', 'instruments/interval/rational.js', 'instruments/interval/transcendental.js',
  'apps/contraprova/gate/flowline.js', 'apps/contraprova/receipt.js'];
const F = require('./gate/flowline.js');
const scenarios = JSON.parse(fs.readFileSync(path.join(APP, 'gate', 'scenarios.json'), 'utf8'));
const ledger = {
  what: 'The Contraprova gate\'s nine demonstrator receipts, each decided by apps/contraprova/gate/flowline.js over the declared box of apps/contraprova/gate/scenarios.json. Illustrative, typical values: not Petrobras data.',
  modules: Object.fromEntries(MODS.map((m) => [m, sha(fs.readFileSync(path.join(ROOT, m), 'utf8'))])),
  scenariosSha256: sha(fs.readFileSync(path.join(APP, 'gate', 'scenarios.json'), 'utf8')),
  battery: { checks: +bm[1], fired: +bm[2], reds: +bm[3], refPoints: +bm[4] },
  receipts: scenarios.cases.map((c) => ({ id: c.id, expect: c.expect, receipt: F.decide(c.proposal, scenarios.box, scenarios.rules) }))
};
for (const r of ledger.receipts) if (r.receipt.verdict !== r.expect) die(r.id + ' decided ' + r.receipt.verdict + ', its scenario states ' + r.expect);
const fresh = JSON.stringify(ledger, null, 1) + '\n';
if (fs.existsSync(LEDGER) && fs.readFileSync(LEDGER, 'utf8') !== fresh) {
  if (!ACCEPT) die('the receipts or the gate\'s code deviate from ' + path.relative(ROOT, LEDGER) + ' (the record is untouched; --accept writes the new one)');
  console.log('gate: ledger changed, written (--accept)');
}
fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
fs.writeFileSync(LEDGER, fresh);

/* the bundle the reader's tab re-decides with: the same bytes the ledger pins */
function bundle() {
  const parts = [];
  for (const rel of MODS) {
    const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (/<\/script/i.test(t)) die('bundle: ' + rel + ' holds a closing script tag');
    parts.push('  ' + JSON.stringify(path.basename(rel)) + ': function (module, exports, require) {\n' + t + '\n  }');
  }
  return '(function (root) {\n"use strict";\nvar SRC = {\n' + parts.join(',\n') + '\n};\nvar cache = {};\n'
    + 'function req(name) { var base = String(name).split("/").pop(); if (cache[base]) return cache[base].exports;'
    + ' if (!SRC[base]) throw new Error("bundle: no module " + name); var m = { exports: {} }; cache[base] = m; SRC[base](m, m.exports, req); return m.exports; }\n'
    + 'root.CONTRAPROVA = { F: req("flowline.js"), RC: req("receipt.js"), S: ' + JSON.stringify(scenarios).replace(/</g, '\\u003c') + ' };\n'
    + '})(typeof self !== "undefined" ? self : this);';
}

/* the page and the deck, from ONE numbers object */
const NUM = require('./numbers.js');
const N = NUM.load(Object.assign({}, ledger, { scenarios }));
const html = require('./page.js').build(N, bundle(), git);
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'index.html'), html);
console.log('site/contraprova/index.html written (' + Math.round(html.length / 1024) + ' KB) @ git ' + git);

const DECK = require('./deck.js');
const deckHtml = DECK.build(N);
const pdf = path.join(SITE, 'contraprova-apresentacao.pdf');
const want = sha(deckHtml);
if (!fs.existsSync(pdf) || !fs.existsSync(DECKSHA) || fs.readFileSync(DECKSHA, 'utf8').trim() !== want) {
  DECK.print(deckHtml, pdf).then(() => { fs.writeFileSync(DECKSHA, want + '\n'); console.log('site/contraprova/contraprova-apresentacao.pdf printed'); })
    .catch((e) => die('the deck did not print: ' + e.message));
} else console.log('deck unchanged (' + want.slice(0, 12) + ')');
