#!/usr/bin/env node
/* check-copy.js — THE COPY CENSUS. Internal vocabulary on the public hubs, counted and ratcheted.
   tools/ · cert-machine · 2026-10-16

   WHY. The homepage measured on 2026-10-16 carried ledger ×8, battery ×7, shelf ×5, gate ×5, drift ×4 — words a
   reader has no way to learn, because the method paper never uses them and no page defines them. design/COPY.md
   names the words that stay (the paper's: certificate, enclosure, verdict, witness, red control, battery, register,
   pinned bytes, refusal) and the words that leave the hubs. This file counts the second list on every hub and in
   the first 120 words of every report, and compares with design/copy-baseline.json, which only turns down — the
   dash-census pattern. It measures a fact; it refuses DRIFT, never a direction (CLAUDE.md).

   usage: node tools/check-copy.js            count, compare, exit 1 on a rise
          node tools/check-copy.js --accept   record the current counts as the baseline (after a human looked)   */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const BASE = path.join(ROOT, 'design', 'copy-baseline.json');

/* the words that leave the hubs (design/COPY.md). `battery` and `register` stay: they are the paper's. `gate`
   and `family` are NOT counted: both have mathematical readings on these pages (a circuit gate by gate, a family
   of closures) that a census cannot tell from the build jargon, and a count that needs a human to read it is noise. */
const WORDS = ['shelf', 'drift', 'lift', 'lifted', 'funnel', 'rung', 'rungs', 'operator', 'handoff', 'make test',
  'control page', 'faces', 'power system', 'the desk', 'the board', 'provenance', 'refuse a deploy', 'refuse to ship',
  'refuses to ship', 'a build that drifts'];
const HUBS = ['index.html', 'reports/index.html', 'about/index.html', 'instruments/index.html', 'papers/index.html', 'machine/index.html'];

const text = (html) => html.replace(/<(script|style|svg)[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').toLowerCase();
const bodyOf = (html) => { const i = html.indexOf('<div class="page">'); const j = html.indexOf('<footer'); return html.slice(i < 0 ? 0 : i, j < 0 ? undefined : j); };
const count = (t, w) => (t.match(new RegExp('(?<![a-z-])' + w.replace(/ /g, '\\s+') + '(?![a-z-])', 'g')) || []).length;

function census() {
  const out = {};
  for (const h of HUBS) {
    const f = path.join(SITE, h);
    if (!fs.existsSync(f)) continue;
    const t = text(bodyOf(fs.readFileSync(f, 'utf8')));
    out[h] = WORDS.reduce((a, w) => a + count(t, w), 0);
  }
  /* report leads: the first 120 words after the H1 */
  for (const f of fs.readdirSync(path.join(SITE, 'reports')).filter((x) => x.endsWith('.html') && x !== 'index.html').sort()) {
    const html = fs.readFileSync(path.join(SITE, 'reports', f), 'utf8');
    const i = html.indexOf('</h1>');
    const lead = text(html.slice(i < 0 ? 0 : i)).split(' ').slice(0, 120).join(' ');
    out['reports/' + f + '#lead'] = WORDS.reduce((a, w) => a + count(lead, w), 0);
  }
  return out;
}

/* red controls: a planted hub with a banned word must count; a rise must refuse */
function red() {
  const t = text('<div class="page"><p>the ledger sits on the shelf and the operator reads the control page</p></div><footer></footer>');
  if (WORDS.reduce((a, w) => a + count(t, w), 0) !== 3) throw new Error('RED CONTROL FAILED: the planted hub did not count shelf + operator + control page');
  if (WORDS.reduce((a, w) => a + count('a battery of tests against the register', w), 0) !== 0) throw new Error('RED CONTROL FAILED: a word that stays must not be counted');
  const prev = { 'x.html': 1 }, now = { 'x.html': 2 };
  if (!rises(prev, now).length) throw new Error('RED CONTROL FAILED: a rise did not register');
}
const rises = (prev, now) => Object.keys(now).filter((k) => (prev[k] === undefined ? now[k] > 0 : now[k] > prev[k])).map((k) => k + ' ' + (prev[k] === undefined ? 0 : prev[k]) + ' -> ' + now[k]);

red();
const now = census();
const total = Object.values(now).reduce((a, b) => a + b, 0);
if (process.argv.includes('--accept')) {
  fs.writeFileSync(BASE, JSON.stringify({ what: 'copy census: counts of the words design/COPY.md keeps off the hubs and report leads; only turns down', recorded: new Date().toISOString().slice(0, 10), words: WORDS, counts: now }, null, 1) + '\n');
  console.log('copy baseline recorded: ' + Object.keys(now).length + ' pages, ' + total + ' occurrences');
  process.exit(0);
}
if (!fs.existsSync(BASE)) { console.error('no design/copy-baseline.json — run with --accept once, after reading the counts'); process.exit(1); }
const prev = JSON.parse(fs.readFileSync(BASE, 'utf8')).counts;
const up = rises(prev, now);
const down = Object.keys(now).filter((k) => prev[k] !== undefined && now[k] < prev[k]).map((k) => k + ' ' + prev[k] + ' -> ' + now[k]);
console.log('copy census: ' + Object.keys(now).length + ' pages · ' + total + ' occurrences of ' + WORDS.length + ' words · hubs: '
  + HUBS.filter((h) => now[h] !== undefined).map((h) => h + ' ' + now[h]).join(', '));
if (down.length) console.log('  ' + down.length + ' page(s) IMPROVED — `--accept` to lock them in:\n    ' + down.join('\n    '));
if (up.length) { console.error('  FAIL — internal vocabulary rose on ' + up.length + ' page(s):\n    ' + up.join('\n    ')); process.exit(1); }
console.log('  ok — no page got more internal');
