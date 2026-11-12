#!/usr/bin/env node
/* claims.build.js — site/instruments/textbook-machine/claims/: real claims, decided in the visitor's tab.
   playground/textbook-machine/ · cert-machine · 2026-11-12

   THE SECOND PAGE of the textbook machine. Page one runs toy machines; this one hands the tab the claim checker itself
   (instruments/claimbox/check.js, wrapped byte for byte by checker-web.build.js) and a few published claims, and the tab
   decides them: no server, nothing fetched but the page's own script. The product face first (the claim as a
   sentence, one word, one plain reason), the rigor one click down (the checker's own line, the word of each part, the
   claim object as decided, the files it read with their pins).

   ONE VERDICT PER CLAIM is claim-verdict.js, inlined here byte for byte: the same text the battery runs.
   NOTHING IS BAKED: the page carries each claim's sentence and its declared changes; every word shown is decided in the
   tab when the page opens and again on every change. The words it can show are read from instruments/verdict.js.

   THE BUNDLE THE PAGE SERVES is its own set (claims.set.js, the objects not HELD), written by checker-web.build.js to
   out/claims-checker.js with its manifest, and copied beside the page. This file refuses to build the page when the
   bundle on disk is not what the builder gives today, or when a declared change does not turn the word the set says.

     node playground/textbook-machine/claims.build.js            say whether out/claims-checker.js is current (exit 1 if not)
     node playground/textbook-machine/claims.build.js --write    write out/claims-checker.js and its manifest
   The page itself is written by playground/build.js (build(OUT) below). MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const B = require(path.join(HERE, 'checker-web.build.js'));
const SET = require(path.join(HERE, 'claims.set.js'));
const CV = require(path.join(HERE, 'claim-verdict.js'));
const V = require(path.join(ROOT, 'instruments', 'verdict.js'));
const W = { CERTIFIED: V.CERTIFIED, REFUTED: V.REFUTED, REFUSED: V.REFUSED };
const BUNDLE_REL = 'playground/textbook-machine/out/claims-checker.js';
const SERVED_AS = 'claim-checker.js';
const die = (m) => { throw new Error('textbook machine, claims: ' + m); };
const esc = SET.esc;
const fmt = (x) => Number(x).toLocaleString('en-US');

/* the page's bundle, derived: the served claims and nothing else */
function derive() {
  return B.build(SET.served().map((c) => ({ path: c.path, shape: c.shape })), { out: BUNDLE_REL });
}

/* Node, the authority: one object text through the command line and the module, then the ONE rule.
   -> { verdict, why, kind, line (the seconds masked), exit } */
const mask = (line) => (line === null ? null : line.replace(/  \d+(?:\.\d+)? s(?=  note: |$)/, '  # s'));
let NODE = null;
function nodeDecide(text, file, dir) {
  if (!NODE) { NODE = require(path.join(ROOT, B.CHECK_REL)); NODE.setWords(NODE.loadVocab()); }
  const f = path.join(dir, file);
  fs.writeFileSync(f, text);
  const r = cp.spawnSync(process.execPath, [path.join(ROOT, B.CHECK_REL), f], { cwd: ROOT, encoding: 'utf8' });
  const res = r.status === 2 ? null : NODE.check(f);
  const got = { line: r.stdout === '' ? null : r.stdout.replace(/\n$/, ''), exit: r.status, kind: res ? res.kind : null, result: res };
  const cv = CV.claimVerdict(got, W);
  return { verdict: cv.verdict, why: cv.why, kind: cv.kind, repair: cv.repair, parts: cv.parts.map((p) => p.word), line: mask(got.line), exit: r.status, cv };
}
/* every claim and every declared change, decided by Node: [{ id, variants: [{ label, verdict, ... }] }] */
function nodeTable(claims) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-claims-'));
  try { return claims.map((c) => ({ id: c.id, path: c.path, variants: c.variants.map((v) => Object.assign({ label: v.label, expect: v.expect }, nodeDecide(SET.applyEdits(c.text, v.edits), c.file, dir))) })); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

function body(claims, M) {
  const CHIP = {}; CHIP[W.CERTIFIED] = 'held'; CHIP[W.REFUTED] = 'dep'; CHIP[W.REFUSED] = 'open';
  const chip = (w) => `<span class="tag ${CHIP[w]}">${w}</span>`;
  const shapes = SET.SHAPES.filter((s) => claims.some((c) => c.shape === s.id));
  const card = (c) => `<li class="tc-claim" data-claim="${esc(c.id)}">
      <p class="tc-who">${esc(c.who)}</p>
      <p class="tc-say" id="tc-say-${esc(c.id)}">${c.variants[0].say}</p>
      <div class="tc-edit" role="group" aria-label="Change this claim">
        <span class="eyebrow">change it</span>
        ${c.variants.map((v, i) => `<button type="button" class="tc-btn" data-v="${i}" aria-pressed="${i === 0}">${esc(v.label)}</button>`).join('')}
        <button type="button" class="tc-reset" data-reset disabled>Reset</button>
      </div>
      <div class="tc-out">
        <span class="tc-word" id="tc-word-${esc(c.id)}" aria-live="polite"><span class="tc-none">not decided yet</span></span>
        <p class="tc-why" id="tc-why-${esc(c.id)}"></p>
        <button type="button" class="tc-trust" data-trust="${esc(c.id)}">why you can trust this</button>
      </div>
    </li>`;
  const sections = shapes.map((s) => `
<section class="wrap tc-sec" id="${s.id.replace(/ /g, '-')}">
  <h2>${esc(s.title)}</h2>
  <p class="prose">${esc(s.say)}</p>
  <ul class="tc-claims">${claims.filter((c) => c.shape === s.id).map(card).join('\n')}</ul>
</section>`).join('\n');
  const n = claims.length;
  return `
<header class="hero tc-hero"><div class="wrap">
  <div class="eyebrow">Carlos Toledo &middot; instruments &middot; <a href="../">the textbook machine</a> &middot; claims</div>
  <h1><span>Real claims.</span> <span>Decided in your tab.</span></h1>
  <p class="lede">Someone printed each claim below. Your browser checks it against the files it cites, in exact arithmetic, and answers in one word. There is no server: the checker is in this page.</p>
</div></header>

<section class="wrap tc-sec tc-first" id="words">
  <ul class="tc-key">
    <li>${chip(W.CERTIFIED)}<span>Every part of the claim was decided, and every part holds.</span></li>
    <li>${chip(W.REFUTED)}<span>Some part is false, and the checker can show which.</span></li>
    <li>${chip(W.REFUSED)}<span>The checker would not decide it, and says why. Not false: not decided.</span></li>
  </ul>
  <p class="prose">Each claim has small changes you can make. Make one and the claim is decided again, here, as you watch: the word can turn, and it turns back when you reset. The strictest word wins, so one false part refutes a claim however many parts hold.</p>
  <p class="tc-status" id="tc-status" aria-live="polite">The checker is loading.</p>
  <noscript><p class="tc-status">This page decides its claims with JavaScript. Without it, nothing here is decided.</p></noscript>
</section>
${sections}

<section class="wrap tc-sec" id="how">
  <h2>What runs in your tab.</h2>
  <p class="prose">The checker is the same program I run on my own machine, carried into this page unchanged, with the ${M.totals.files} files these ${n} claims make it read: ${fmt(M.totals.embeddedBytes)} bytes in all. It hashes every file before it trusts one, it does its arithmetic in exact whole numbers and fractions, and it refuses a number it would have to round.</p>
  <p class="prose">A browser cannot rebuild the long computations behind the bounds, so for those it replays my published record of each one and holds the claim, the record and its own answer to each other. Where they disagree it refuses. <a href="../">The textbook machine</a> shows why checking stays cheap while finding does not.</p>
</section>

<dialog class="tc-dlg" id="tc-dlg" aria-labelledby="tc-dlg-title">
  <div class="tc-dlg-in">
    <div class="tc-dlg-head"><h2 id="tc-dlg-title">Why you can trust this</h2><button type="button" class="tc-btn" data-close>Close</button></div>
    <div class="tc-dlg-body" id="tc-dlg-body" tabindex="0"></div>
  </div>
</dialog>`;
}

const CREDIT = {
  'corpus/optconst-queue/c82-2026-10-19/upstream/': 'the registry pages are teorth/optimizationproblems (Apache-2.0)',
  'corpus/optconst-queue/next-2026-10-18/upstream/': 'the registry pages are teorth/optimizationproblems (Apache-2.0)',
  'corpus/optconst-queue/next-2026-10-18/pr-224/': 'the step function is the body of that registry\u2019s pull request 224',
  'corpus/optconst-queue/c82-2026-10-19/rpinho/': 'the C<sub>82</sub> certificate is R. Pinho\u2019s (MIT)',
  'corpus/optconst-queue/c82-2026-10-19/epi/': 'the C<sub>82</sub> construction is \u00c9pi\u2019s (BakeLab/Epi-results)',
  'corpus/optconst-queue/next-2026-10-18/rozetyp/': 'the C<sub>1c</sub> certificate and its README are rozetyp\u2019s (MIT)',
  'corpus/einstein-arena/': 'the packing is EinsteinArena\u2019s record of it'
};
function foot(M) {
  const credits = [];
  for (const f of M.files) {
    if (!f.path.startsWith('corpus/')) continue;
    const k = Object.keys(CREDIT).find((p) => f.path.startsWith(p));
    if (!k) die('the bundle carries ' + f.path + ', a corpus file with no credit line in claims.build.js');
    if (!credits.includes(CREDIT[k])) credits.push(CREDIT[k]);
  }
  return '<p>Every word on this page is decided in your tab by the claim checker, the same file the command line runs. The files it reads stay under their sources\u2019 licences: '
    + credits.join('; ') + '. The rest is this repository\u2019s own, MIT.</p>';
}

function build(OUT) {
  const { page } = require(path.join(PG, 'design', 'shell.js'));
  const D = derive();
  const bp = path.join(ROOT, BUNDLE_REL), mp = path.join(ROOT, B.manifestPathOf(BUNDLE_REL));
  if (!fs.existsSync(bp) || fs.readFileSync(bp, 'utf8') !== D.bundle || !fs.existsSync(mp) || fs.readFileSync(mp, 'utf8') !== D.manifestText)
    die(BUNDLE_REL + ' is not what the builder gives today: node playground/textbook-machine/claims.build.js --write after a reviewed change');
  const claims = SET.served();
  for (const row of nodeTable(claims)) for (const v of row.variants)
    if (v.verdict !== v.expect) die(row.id + ' "' + v.label + '" is decided ' + v.verdict + ' by Node, and the set says ' + v.expect);
  const held = Object.keys(SET.HELD);
  for (const f of D.manifest.files) if (held.includes(f.path)) die('the served bundle carries a held object: ' + f.path);

  const PAGE1 = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
  const chips = PAGE1.match(/^\.tag[^{\n]*\{[^}]*\}/gm) || [];       /* the verdict chips: page one's rules, read, not written again */
  if (chips.length !== 4) die('page.css no longer holds the four verdict-chip rules this page reads (' + chips.length + ')');
  const CSS = fs.readFileSync(path.join(HERE, 'claims.css'), 'utf8') + '\n' + chips.join('\n') + '\n';
  const SPEC = { words: W, bundle: SERVED_AS,
    claims: claims.map((c) => ({ id: c.id, path: c.path, file: c.file, shape: c.shape, variants: c.variants.map((v) => ({ label: v.label, say: v.say, edits: v.edits })) })) };
  const dir = path.join(OUT, 'textbook-machine', 'claims');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, SERVED_AS), D.bundle);
  const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));
  const ogAlt = (() => { try { return OG.alt('textbook-machine-claims'); } catch (e) { return null; } })();
  const html = page({
    title: 'Real claims, decided in your tab',
    desc: 'Published claims decided in your browser by the claim checker itself, with no server: number facts, interval bounds and replays of my public record, each answered CERTIFIED, REFUTED or REFUSED, each one you can change and decide again.',
    path: '/instruments/textbook-machine/claims/', body: body(claims, D.manifest), css: CSS, foot: foot(D.manifest),
    og: ogAlt ? { image: '/og-textbook-machine-claims.png', alt: ogAlt } : { image: '/og-textbook-machine.png', alt: OG.alt('textbook-machine') },
    script: `<script id="tc-spec" type="application/json">${JSON.stringify(SPEC).replace(/</g, '\\u003c')}</script>\n<script src="${SERVED_AS}"></script>\n<script>${fs.readFileSync(path.join(HERE, 'claim-verdict.js'), 'utf8')}</script>\n<script>${fs.readFileSync(path.join(HERE, 'claims.app.js'), 'utf8')}</script>`
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, bundleBytes: Buffer.byteLength(D.bundle), claims: claims.length, held: held.length, files: D.manifest.totals.files,
    shapes: SET.SHAPES.filter((s) => claims.some((c) => c.shape === s.id)).length };
}

if (require.main === module) {
  try {
    const write = process.argv.includes('--write');
    const D = derive();
    const bp = path.join(ROOT, BUNDLE_REL), mp = path.join(ROOT, B.manifestPathOf(BUNDLE_REL));
    for (const x of D.manifest.objects) console.log('  ' + (x.shape || 'object').padEnd(23) + x.path + '  ' + x.node.word + (x.node.kind ? ' ' + x.node.kind : '') + '  needs ' + x.needs.length + ' files');
    for (const p of Object.keys(SET.HELD)) console.log('  HELD                   ' + p + '\n                           ' + SET.HELD[p]);
    console.log('  ' + D.manifest.totals.files + ' files, ' + D.manifest.totals.embeddedBytes + ' bytes; bundle ' + D.manifest.bundle.bytes + ' bytes, sha256 ' + D.manifest.bundle.sha256.slice(0, 16) + '…');
    if (write) { fs.writeFileSync(bp, D.bundle); fs.writeFileSync(mp, D.manifestText); console.log('wrote ' + BUNDLE_REL + ' and ' + B.manifestPathOf(BUNDLE_REL)); }
    else {
      const cur = fs.existsSync(bp) && fs.readFileSync(bp, 'utf8') === D.bundle && fs.existsSync(mp) && fs.readFileSync(mp, 'utf8') === D.manifestText;
      console.log(cur ? BUNDLE_REL + ' is current' : BUNDLE_REL + ' is NOT what this build gives: node playground/textbook-machine/claims.build.js --write');
      process.exit(cur ? 0 : 1);
    }
  } catch (e) { console.error(e.message); process.exit(2); }
}
module.exports = { build, derive, nodeDecide, nodeTable, mask, W, BUNDLE_REL, SERVED_AS };
