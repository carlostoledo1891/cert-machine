/* build.js — the Registro de Abatimento's gated build: the kernel's battery green,
   every scenario version re-decided and compared with the committed ledger (a
   deviation restores the record and refuses, so drift refuses EVERY run), then the
   page (site/abatimento/index.html), the deck, the Registro de cálculo and the
   Proposta Técnica (PDFs re-printed only when their HTML changes).

   usage: node apps/abatimento/build.js [--accept] [--pdf]
     --accept   write a changed ledger instead of refusing (a deliberate change to the
                kernel or the scenarios; say why in the commit)
     --pdf      force the PDFs to print
   apps/abatimento · cert-machine                                                MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const APP = __dirname;
const ROOT = path.join(APP, '..', '..');
const SITE = path.join(ROOT, 'site', 'abatimento');
const LEDGER = path.join(APP, 'data', 'registro-ledger.json');
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const die = (m) => { console.error('abatimento build REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const ACCEPT = process.argv.includes('--accept'), FORCE = process.argv.includes('--pdf');

/* gate 1 — the battery */
let out = '';
try { out = cp.execFileSync('node', [path.join(APP, 'engine', 'battery.js')], { encoding: 'utf8' }); } catch (e) { die('the kernel battery is not green:\n' + (e.stdout || '') + (e.stderr || '')); }
const bm = /abatimento battery: (\d+) pass, (\d+) fail, (\d+)\/(\d+) red controls fired; reference agreement at (\d+) versions; (\d+) interior points inside/.exec(out);
if (!bm || bm[2] !== '0' || bm[3] !== bm[4]) die('the battery did not pass whole: ' + out);
console.log('kernel: ' + out.trim());

/* gate 2 — every version re-decided and compared with the record */
const MODS = ['instruments/interval/rational.js', 'apps/abatimento/engine/abatimento.js', 'apps/abatimento/registro.js'];
const A = require('./engine/abatimento.js');
const D = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'cenarios.json'), 'utf8'));
const byRef = (ref) => { const [id, v] = String(ref).split('@'); return v ? D.cenarios.find((c) => c.id === id && String(c.versao) === v) : D.cenarios.filter((c) => c.id === id).sort((a, b) => b.versao - a.versao)[0]; };
const E = (ref) => { const c = byRef(ref); const { P, T } = A.readScenario(c); const e = A.enclose(P, T); return { id: c.id, fonte: c.fonte_emissora, exclusivo_com: c.exclusivo_com, E: { lo: e.lo, hi: e.hi } }; };
const fontes = Object.fromEntries(Object.entries(D.fontes_emissoras).map(([k, v]) => [k, v.emissao]));
const ledger = {
  what: 'The Registro de Abatimento demonstrator: every scenario version of apps/abatimento/data/cenarios.json decided by apps/abatimento/engine/abatimento.js over its declared envelope; the aggregations with their double-counting audit; the version diffs; the float midpoint a point pipeline would print. Physical factors from pinned public tables; activity data ILLUSTRATIVE and marked so — not Petrobras data.',
  modules: Object.fromEntries(MODS.map((m) => [m, sha(fs.readFileSync(path.join(ROOT, m), 'utf8'))])),
  cenariosSha256: sha(fs.readFileSync(path.join(APP, 'data', 'cenarios.json'), 'utf8')),
  battery: { checks: +bm[1], fail: +bm[2], fired: +bm[3], reds: +bm[4], refVersions: +bm[5], interior: +bm[6] },
  receipts: D.cenarios.map((c) => ({ id: c.id, versao: c.versao, expect: c.espera, receipt: A.decide(c, D.classes) })),
  aggregations: D.agregacoes.map((g) => ({ id: g.id, titulo: g.titulo, cenarios: g.cenarios, expect: g.espera, result: A.aggregate(g.cenarios.map(E), fontes) })),
  diffs: [A.diff(byRef('tbg-ecomp@1'), byRef('tbg-ecomp@2'), D.classes)],
  pointPipeline: Object.fromEntries(D.cenarios.map((c) => [c.id + '@' + c.versao, A.pointPipeline(c)]))
};
for (const r of ledger.receipts) if (r.expect && r.receipt.verdict !== r.expect.verdict) die(r.id + '@' + r.versao + ' decided ' + r.receipt.verdict + ', its record states ' + r.expect.verdict);
for (const g of ledger.aggregations) if (g.result.verdict !== g.expect) die('aggregation ' + g.id + ' decided ' + g.result.verdict + ', expected ' + g.expect);
const fresh = JSON.stringify(ledger, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 1) + '\n';
if (fs.existsSync(LEDGER) && fs.readFileSync(LEDGER, 'utf8') !== fresh) {
  if (!ACCEPT) die('the receipts or the kernel deviate from ' + path.relative(ROOT, LEDGER) + ' (the record is untouched; --accept writes the new one)');
  console.log('ledger changed, written (--accept)');
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
    + 'root.ABATIMENTO = { A: req("abatimento.js"), RC: req("registro.js"), D: ' + JSON.stringify(D).replace(/</g, '\\u003c') + ' };\n'
    + '})(typeof self !== "undefined" ? self : this);';
}

/* the page, the deck, the Registro de cálculo and the Proposta, from ONE numbers object */
const N = require('./numbers.js').load(ledger, D);
const html = require('./page.js').build(N, bundle(), git);
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'index.html'), html);
console.log('site/abatimento/index.html written (' + Math.round(html.length / 1024) + ' KB) @ git ' + git);

const DECK = require('./deck.js'), NOTA = require('./nota.js'), PROP = require('./proposta.js');
const jobs = [
  { html: DECK.build(N), pdf: path.join(SITE, 'abatimento-apresentacao.pdf'), pin: path.join(APP, 'data', 'deck.sha256'), name: 'abatimento-apresentacao.pdf', print: DECK.print },
  { html: NOTA.build(N, git), pdf: path.join(SITE, 'registro-de-calculo-exemplo.pdf'), pin: path.join(APP, 'data', 'nota.sha256'), name: 'registro-de-calculo-exemplo.pdf', print: DECK.print },
  { html: PROP.build(N, git), pdf: path.join(SITE, 'proposta-tecnica.pdf'), pin: path.join(APP, 'data', 'proposta.sha256'), name: 'proposta-tecnica.pdf', print: PROP.print }
];
(async () => {
  for (const j of jobs) {
    const want = sha(j.html);
    if (!FORCE && fs.existsSync(j.pdf) && fs.existsSync(j.pin) && fs.readFileSync(j.pin, 'utf8').trim() === want) { console.log(j.name + ' unchanged (' + want.slice(0, 12) + ')'); continue; }
    await j.print(j.html, j.pdf).catch((e) => die(j.name + ' did not print: ' + e.message));
    fs.writeFileSync(j.pin, want + '\n'); console.log('site/abatimento/' + j.name + ' printed');
  }
})();
