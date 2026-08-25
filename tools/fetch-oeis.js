#!/usr/bin/env node
/* fetch-oeis.js — pull decimal-expansion constants from OEIS into a local corpus.

   Polite by construction: a declared User-Agent with a contact address, one
   request at a time, a fixed delay between them, and everything cached to disk
   so a re-run costs nothing. OEIS is a volunteer-run public good; a scraper that
   hammers it is a scraper that gets the whole method blocked.

   usage: node tools/fetch-oeis.js [pages]     (10 entries per page) */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'corpus', 'oeis-constants.json');
const UA = 'cert-machine/0.1 (validated-numerics research; contact carlos@carlostoledo.co)';
const PAGES = Number(process.argv[2] || 12);
const QUERIES = process.argv.slice(3);
const DELAY_MS = 1100;

function get(url) {
  const r = cp.spawnSync('curl', ['-sS', '-A', UA, '--max-time', '30', url], { maxBuffer: 32e6 });
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout.toString()); } catch (e) { return null; }
}
const sleep = (ms) => cp.spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},' + ms + ')']);

const have = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { entries: [] };
const seen = new Set(have.entries.map(e => e.id));

/* keyword:cons is OEIS's own tag for "decimal expansion of a constant". Extra
   queries narrow toward entries where a closed form is CONJECTURAL or absent —
   which is where an audit has yield, as opposed to re-deriving pi. */
const DEFAULT_Q = ['keyword:cons'];
const qs = QUERIES.length ? QUERIES : DEFAULT_Q;
let added = 0;
for (const Q of qs) for (let p = 0; p < PAGES; p++) {
  const url = 'https://oeis.org/search?q=' + encodeURIComponent(Q) + '&fmt=json&start=' + (p * 10);
  const j = get(url);
  if (!j) { console.log('  [' + Q + '] page ' + p + ': no response'); break; }
  const results = Array.isArray(j) ? j : (j.results || []);
  if (!results.length) break;
  for (const r of results) {
    const id = 'A' + String(r.number).padStart(6, '0');
    if (seen.has(id)) continue;
    seen.add(id);
    have.entries.push({
      id,
      name: r.name || '',
      digits: (r.data || '').split(',').map(s => s.trim()).filter(s => /^-?\d+$/.test(s)),
      offset: Number(String(r.offset || '0').split(',')[0]) || 0,
      keywords: r.keyword || '', query: Q
    });
    added++;
  }
  process.stdout.write('\r  fetched ' + have.entries.length + ' entries');
  sleep(DELAY_MS);
}
fs.writeFileSync(OUT, JSON.stringify(have, null, 1) + '\n');
console.log('\n  corpus/oeis-constants.json: ' + have.entries.length + ' constants (' + added + ' new)');
