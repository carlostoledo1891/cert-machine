#!/usr/bin/env node
/* pu-feed.js — PU Verificado's daily feed: fetch Tesouro Direto's price history, admit it only if it GREW, re-pin it.
   tools/ · cert-machine · 2026-10-16

   The publisher rewrites one CSV every business day (newest rows first). This script downloads it and compares it
   with the pinned copy line by line: every old row must still be present, byte for byte, and every new row must be
   a date after the old file's last date — the history only grows. Then the new file replaces the pinned one and
   PINS.json records the new sha256, with the old one kept in a dated history, so the chain of pins is itself a
   record. Anything else — an old row missing or changed (a restatement), a header change, a smaller file — is
   REFUSED: nothing is written except a line in corpus/pu/feed-log.json saying what was seen, and the day stays on
   the previous pin. The ledger run that follows (tools/run-pu-ledger.js) re-hashes the pin before deciding anything.

   exit 0 — a new day admitted and pinned   ·   exit 2 — nothing new   ·   exit 1 — REFUSED (and why, in the log)
   usage: node tools/pu-feed.js [--file <local csv>]  (the file option replays a saved download; the battery uses it) */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'corpus', 'pu', 'sources', 'precotaxatesourodireto.csv');
const PINS_P = path.join(ROOT, 'corpus', 'pu', 'PINS.json');
const LOG_P = path.join(ROOT, 'corpus', 'pu', 'feed-log.json');
const URL = 'https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const today = new Date().toISOString().slice(0, 10);

const log = (entry) => { const L = fs.existsSync(LOG_P) ? JSON.parse(fs.readFileSync(LOG_P, 'utf8')) : { what: 'PU Verificado feed log: one line per run of tools/pu-feed.js — admitted, nothing new, or refused and why', runs: [] }; L.runs.push(Object.assign({ at: new Date().toISOString() }, entry)); fs.writeFileSync(LOG_P, JSON.stringify(L, null, 1) + '\n'); };
const refuse = (why, extra) => { log(Object.assign({ status: 'REFUSED', why }, extra || {})); console.error('PU FEED REFUSED: ' + why); process.exit(1); };

/* ---- the rule, as a function: does the new text GROW the old one? ---------------------------------------- */
function compare(oldText, newText) {
  const oldLines = oldText.split(/\r?\n/).filter(Boolean), newLines = newText.split(/\r?\n/).filter(Boolean);
  if (oldLines[0] !== newLines[0]) return { ok: false, why: 'the header changed', oldHeader: oldLines[0], newHeader: newLines[0] };
  const newSet = new Set(newLines);
  const missing = oldLines.filter((l) => !newSet.has(l));
  if (missing.length) return { ok: false, why: 'the publisher restated history: ' + missing.length + ' pinned row(s) are missing or changed in the new file', missingSample: missing.slice(0, 10) };
  const oldSet = new Set(oldLines);
  const added = newLines.filter((l) => !oldSet.has(l));
  const toIso = (dmy) => { const [d, m, y] = dmy.split('/'); return `${y}-${m}-${d}`; };
  const oldMax = oldLines.slice(1).reduce((a, l) => { const d = toIso(l.split(';')[2]); return d > a ? d : a; }, '0');
  const addedDates = [...new Set(added.map((l) => toIso(l.split(';')[2])))].sort();
  const backfill = addedDates.filter((d) => d <= oldMax);
  if (backfill.length) return { ok: false, why: 'new rows carry dates on or before the pinned last day (' + oldMax + '): ' + backfill.join(', ') + ' — not an append', added: added.length };
  if (!added.length) return { ok: false, why: 'the file changed but no row was added or removed — bytes differ outside the rows' };
  return { ok: true, added, addedDates, rows: newLines.length - 1 };
}
module.exports = { compare };
if (require.main === module) main();

function main() {
/* ---- fetch ---------------------------------------------------------------------------------------- */
const fileArg = process.argv.indexOf('--file');
let buf, lastModified = null;
if (fileArg > 0) { buf = fs.readFileSync(process.argv[fileArg + 1]); }
else {
  const tmp = path.join(ROOT, 'corpus', 'pu', 'sources', '.download.csv');
  const r = cp.spawnSync('curl', ['-sS', '-L', '--max-time', '300', '-D', '-', '-o', tmp, URL], { encoding: 'utf8' });
  if (r.status !== 0) refuse('download failed: ' + (r.stderr || '').trim().slice(0, 300));
  const m = /^last-modified:\s*(.+)$/im.exec(r.stdout || ''); lastModified = m ? m[1].trim() : null;
  buf = fs.readFileSync(tmp); fs.unlinkSync(tmp);
}
const PINS = JSON.parse(fs.readFileSync(PINS_P, 'utf8'));
const pin = PINS.files['precotaxatesourodireto.csv'];
const newSha = sha(buf);
if (newSha === pin.sha256) { log({ status: 'NOTHING NEW', sha256: newSha, lastModified }); console.log('pu-feed: the published file is the pinned one (' + newSha.slice(0, 12) + '); nothing new'); process.exit(2); }

/* ---- the history only grows --------------------------------------------------------------------- */
const oldText = fs.readFileSync(SRC, 'latin1'), newText = buf.toString('latin1');
const cmp = compare(oldText, newText);
if (!cmp.ok) { const extra = Object.assign({ sha256: newSha, lastModified }, cmp); delete extra.ok; delete extra.why; refuse(cmp.why, extra); }
const added = cmp.added, addedDates = cmp.addedDates, newLines = newText.split(/\r?\n/).filter(Boolean);

/* ---- admit: write, re-pin, remember the old pin ---------------------------------------------------- */
fs.writeFileSync(SRC, buf);
pin.history = pin.history || [];
pin.history.push({ until: today, sha256: pin.sha256, lastModified: pin.lastModified, rows: pin.rows });
pin.sha256 = newSha; pin.lastModified = lastModified || pin.lastModified; pin.rows = newLines.length - 1; pin.fetched = today;
PINS.fetched = today;
fs.writeFileSync(PINS_P, JSON.stringify(PINS, null, 1) + '\n');
log({ status: 'ADMITTED', sha256: newSha, lastModified, rowsAdded: added.length, dates: addedDates, previousSha256: pin.history[pin.history.length - 1].sha256 });
console.log('pu-feed: admitted ' + added.length + ' new rows (' + addedDates.join(', ') + '); pin ' + pin.history[pin.history.length - 1].sha256.slice(0, 12) + ' → ' + newSha.slice(0, 12));
}
