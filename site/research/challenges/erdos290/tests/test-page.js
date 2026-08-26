#!/usr/bin/env node
/* test-page.js — the erdos290 interactive page battery (test-sin extraction pattern +
 * test-artifact byte-gate pattern). Subject: ../erdos290.html — the RENDERED file, so a stale
 * splice cannot validate (the sha of what was read is printed, test-sin discipline).
 *
 * Layers:
 *   A — the splice: embedded kernel bytes === source bytes (per file, via build-page.js's own
 *       markers/wrappers — one authorship of the wrapper); rebuild is byte-idempotent.
 *   B — behavior FROM PAGE BYTES: the spliced module table is evaluated headless and its
 *       verdicts must equal the tree modules' verdicts; falsifiers must break (red direction).
 *   C — the figure literals: this battery TAKES OVER the page cross-checks narrowing.js has
 *       been silently skipping (it looks for a 'paper.html' that never existed here — measured
 *       2026-08-12): COND/D/LBL literals against narrowing.json, the generated record.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HERE = __dirname;
const UNITDIR = path.join(HERE, '..');
const PAGE = path.join(UNITDIR, '..', 'erdos290.html');
const sha16 = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

const fails = [];
function check(name, cond, detail) {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '   [' + detail + ']' : ''));
  if (!cond) fails.push(name);
}

if (!fs.existsSync(PAGE)) {
  console.log('FAIL E0 subject missing: ' + PAGE);
  console.log('erdos290 page battery FAILED — subject missing, so NO check in this battery ran.');
  process.exit(1);
}
const html = fs.readFileSync(PAGE, 'utf8');
console.log('subject: ' + PAGE + '  sha256 ' + sha16(html) + '  ' + html.length + ' bytes\n');

const builder = require(path.join(UNITDIR, 'build-page.js'));

console.log('--- Layer A · the splice is byte-true ---');
for (const n of builder.SOURCES) {
  const b = builder.B(n), e = builder.E(n);
  const i = html.indexOf(b), j = html.indexOf(e);
  const present = i >= 0 && j > i;
  check('A1 ' + n + ' marker pair present', present);
  if (!present) continue;
  const span = html.slice(i + b.length, j);
  const head = builder.WRAP_HEAD(n);
  const wrapped = span.startsWith(head) && span.endsWith(builder.WRAP_TAIL);
  check('A1 ' + n + ' wrapper intact', wrapped);
  if (!wrapped) continue;
  const emb = span.slice(head.length, span.length - builder.WRAP_TAIL.length);
  const src = fs.readFileSync(path.join(UNITDIR, n), 'utf8');
  check('A1 ' + n + ' embedded === source', emb === src,
    emb === src ? 'sha256 ' + sha16(src) : 'DRIFT: ' + sha16(emb) + ' vs ' + sha16(src));
}
for (const n of builder.DATA) {
  const b = builder.B(n), e = builder.E(n);
  const i = html.indexOf(b), j = html.indexOf(e);
  const present = i >= 0 && j > i;
  check('A1 ' + n + ' (data) marker pair present', present);
  if (!present) continue;
  const span = html.slice(i + b.length, j);
  const head = builder.DATA_HEAD(n);
  const wrapped = span.startsWith(head) && span.endsWith(builder.DATA_TAIL);
  check('A1 ' + n + ' (data) wrapper intact', wrapped);
  if (!wrapped) continue;
  const literal = span.slice(head.length, span.length - builder.DATA_TAIL.length);
  const emb = JSON.parse(literal);
  const src = fs.readFileSync(path.join(UNITDIR, n), 'utf8');
  check('A1 ' + n + ' (data) embedded === source', emb === src,
    emb === src ? 'sha256 ' + sha16(src) : 'DRIFT: ' + sha16(emb) + ' vs ' + sha16(src));
}
check('A2 rebuild reproduces committed bytes (splice fresh)', builder.build(html) === html);
check('A2b anchors appear exactly once each',
  html.split(builder.A_BEGIN).length === 2 && html.split(builder.A_END).length === 2);
/* the pin record check-narration derives its NOTE-not-FAIL ruling from: must exist and match
   a fresh computation, else it is a stale measurement wearing a pin's authority */
{
  let committed = null;
  try { committed = JSON.parse(fs.readFileSync(builder.PINS, 'utf8')); } catch (e) { /* absent */ }
  const fresh = builder.pinsRecord();
  check('A3 page-splice-pins.json exists and is FRESH against the sources',
    committed !== null && JSON.stringify(committed.pins) === JSON.stringify(fresh.pins),
    committed === null ? 'MISSING — run build-page.js' : undefined);
}

console.log('\n--- Layer B · behavior from PAGE bytes vs the tree ---');
/* evaluate the kernel script block exactly as a browser would (the block that defines the
   module table), then compare against direct requires of the tree modules */
const blocks = (html.match(/<script>([\s\S]*?)<\/script>/g) || []).map(s => s.slice(8, -9));
const kernelBlock = blocks.find(b => b.indexOf('__ERDOS_MODULES') >= 0 && b.indexOf(builder.A_BEGIN) >= 0);
check('B0 kernel script block found (one block defines the module table)', !!kernelBlock);
let pageT = null;
try {
  pageT = new Function(kernelBlock + '\nreturn __ERDOS_MODULES;')()['theorem-live.js'];
} catch (err) {
  check('B0b kernel block evaluates headless', false, String(err).slice(0, 120));
}
if (pageT) {
  check('B0b kernel block evaluates headless', true);
  const treeT = require(path.join(UNITDIR, 'theorem-live.js'));
  for (const d of [8, 10, 24, 40]) {
    const a = JSON.stringify(pageT.checkLines(d)), b = JSON.stringify(treeT.checkLines(d));
    check('B1 checkLines(' + d + ') page === tree', a === b);
  }
  check('B2 five lines all hold at d = 24 (from page bytes)',
    pageT.checkLines(24).every(l => l.ok));
  for (const w of ['F1', 'F2', 'F3']) {
    check('B3 falsifier ' + w + ' BREAKS (red direction shown, from page bytes)',
      pageT.falsify(24, w).broken === true);
  }
  const members = pageT.lawTable(168).filter(r => r.member).map(r => r.d);
  check('B4 law members ≤ 168 = {8,24,48,80,120,168}',
    JSON.stringify(members) === JSON.stringify([8, 24, 48, 80, 120, 168]));

  /* the kernel from PAGE bytes: the certified bracket, the fs-shimmed tail certificates,
     and both planted mutations (red directions) */
  const pageK = new Function(kernelBlock + '\nreturn __ERDOS_MODULES;')()['kernel.js'];
  const treeK = require(path.join(UNITDIR, 'kernel.js'));
  const dec = (K, e) => [K.decimals(e.cLo, 12, 'floor'), K.decimals(e.cHi, 12, 'ceil')];
  const pClean = dec(pageK, pageK.enclosure({}));
  const tClean = dec(treeK, treeK.enclosure({}));
  check('B5 enclosure from page bytes === tree, 12 decimals both ends',
    JSON.stringify(pClean) === JSON.stringify(tClean), pClean.join(' .. '));
  check('B5b …which requires the fs shim to have served tail-deltas.json (else the tail is [0,1] and the bracket widens)',
    pClean[1] === tClean[1]);
  const pX2 = dec(pageK, pageK.enclosure({ mutateTailIdentity: true }));
  check('B6 X2 (log 2 tail) BREAKS from page bytes: upper end blows out (red direction shown)',
    Number(pX2[1]) > 1.0, pX2[1]);
  const pX1 = dec(pageK, pageK.enclosure({ mutateDelta: true }));
  check('B7 X1 (δ ↦ 1−δ) BREAKS from page bytes: bracket moves (red direction shown)',
    JSON.stringify(pX1) !== JSON.stringify(pClean), pX1.join(' .. '));
}

console.log('\n--- Layer C · figure literals vs narrowing.json (the takeover) ---');
const nj = JSON.parse(fs.readFileSync(path.join(UNITDIR, 'narrowing.json'), 'utf8'));
const mD = html.match(/var D = (\[\[[\s\S]*?\]\]);/);
const mC = html.match(/var COND = ([0-9.]+)/);
const mL = html.match(/var LBL = (\[\[[\s\S]*?\]\]);/);
check('C0 D, COND, LBL literals present in page', !!(mD && mC && mL));
if (mD && mC && mL) {
  const D = new Function('return ' + mD[1])();
  const COND = Number(mC[1]);
  const LBL = new Function('return ' + mL[1])();
  check('C1 COND literal === narrowing.json conditional', COND === nj.conditional,
    COND + ' vs ' + nj.conditional);
  check('C2 D row count === narrowing.json points', D.length === nj.points.length,
    D.length + ' vs ' + nj.points.length);
  let rowBad = 0;
  for (let i = 0; i < Math.min(D.length, nj.points.length); i++) {
    const p = nj.points[i];
    if (D[i][0] !== p.K || D[i][1] !== p.lo || D[i][2] !== p.hi) rowBad++;
  }
  check('C3 every D row [K, lo, hi] === its narrowing.json point', rowBad === 0,
    rowBad ? rowBad + ' rows differ' : 'all ' + D.length);
  let lblBad = 0;
  for (const [idx, label] of LBL) {
    const m = /^d=(\d+)$/.exec(label);
    if (!m) continue;
    if (2 * D[idx][0] !== Number(m[1])) lblBad++;
  }
  check('C4 every LBL "d=N" sits at the row whose degree IS N (narrowing.js\'s skipped check)',
    lblBad === 0);
  if (pageT) {
    const clean = pageT.bracketChecks(D, COND);
    check('C5 clean data: monotone + containment both hold', clean.monotone.ok && clean.containment.ok);
    const mutated = pageT.bracketChecks(pageT.perturbRow(D, 5, 40), COND);
    check('C6 2^-40 widening BREAKS monotone (red direction shown)', mutated.monotone.ok === false);
    check('C6b …and containment provably cannot see it (the asymmetry the page states)',
      mutated.containment.ok === true);
  }
}

console.log('\n' + '='.repeat(64));
if (fails.length) {
  console.log(fails.length + ' FAILED:'); fails.forEach((f, i) => console.log('  ' + (i + 1) + '. ' + f));
  process.exit(1);
}
console.log('ALL PASS — the splice is byte-true, the page computes what the tree computes,');
console.log('           every falsifier breaks, and the figure literals match their record.');
