#!/usr/bin/env node
/* check-grammar.js — the dash census. One gate for one rule.
   tools/ · cert-machine · 2026-09-05

   THE RULE, ported from frontier-apps/site/design/CONTRACT.md: dash carries
   STANDING and nothing else, and the patterns that may appear on this site are
   a CLOSED LIST which lives in design/grammar.js. Anything else in a built page
   is drift.

   WHY IT WAS NEEDED. frontier's audit command, run here for the first time on
   2026-09-05, returned TWENTY-FIVE distinct patterns across site/. The cause
   was two lines in playground/warrant.js deriving the dash from the stroke
   WIDTH, so each width minted a pattern — including "1.04 5.460000000000001",
   a float artifact in published HTML. It also found `6 4` and `1.6 3.4` live on
   an instrument page: the exact pair frontier's contract records as the one
   time dash was used for IDENTITY ("the second and third model") instead of
   provenance. The rule was already written down. Nothing read it.

   THIS GATE MEASURES A FACT AND RATCHETS. It does not refuse a direction —
   CLAUDE.md forbids that — so the drift that exists today is recorded in
   design/grammar-baseline.json as a census that may only SHRINK. A pattern
   appearing that is neither permitted, nor exempt, nor within its recorded
   count, fails the run.

   EXEMPTIONS ARE DECLARED, NOT INFERRED. `stroke-dasharray` has a second,
   legitimate use that has nothing to do with the grammar: drawing a partial arc
   by dash length (a single value, or a huge gap). Those are listed in the
   baseline's `exempt` block WITH A REASON, one line each. An undeclared
   exemption is drift.

     node tools/check-grammar.js            gate; non-zero on new drift
     node tools/check-grammar.js --report   the full census, no exit code
     node tools/check-grammar.js --bless    rewrite the baseline from reality
*/
'use strict';

const fs = require('fs');
const path = require('path');
const G = require(path.join(__dirname, '..', 'design', 'grammar.js'));

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const BASELINE = path.join(ROOT, 'design', 'grammar-baseline.json');

/* ------------------------------------------------------------ collection --
   Both media: the SVG attribute/property and the canvas call. Normalised so
   "5 4", "5,4" and " 5  4 " are one pattern — a comma and a space are the same
   separator to SVG, and three spellings of one pattern would read as three
   drifts. */
const norm = (s) => String(s).trim().replace(/[\s,]+/g, ' ');

const RE = [
  /stroke-dasharray\s*[:=]\s*"([^"]*)"/g,
  /stroke-dasharray\s*:\s*([^;}"']+)/g,
  /setLineDash\(\s*\[([^\]]*)\]\s*\)/g,
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function census() {
  const seen = new Map();               /* pattern -> { count, files:Set } */
  for (const file of walk(SITE)) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(SITE, file);
    for (const re of RE) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src))) {
        const p = norm(m[1]);
        if (!p || p === 'none' || p === '') continue;
        /* a builder that never interpolated is check-render's business, not
           ours; counting it here would report one drift as two */
        if (p.includes('${') || p.includes('var(')) continue;
        if (!seen.has(p)) seen.set(p, { count: 0, files: new Set() });
        const e = seen.get(p);
        e.count++;
        e.files.add(rel);
      }
    }
  }
  return seen;
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE)) return { exempt: {}, drift: {} };
  return JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
}

function main() {
  const mode = process.argv[2] || '';
  const seen = census();
  const base = loadBaseline();
  const permitted = new Set(G.PERMITTED.map(norm));
  const exempt = new Set(Object.keys(base.exempt || {}).map(norm));

  const rows = [...seen.entries()].sort((a, b) => b[1].count - a[1].count);
  const news = [];       /* not permitted, not exempt, not in the baseline */
  const grown = [];      /* in the baseline but used MORE than recorded */
  let okCount = 0, driftCount = 0;

  for (const [p, e] of rows) {
    if (permitted.has(p) || exempt.has(p)) { okCount += e.count; continue; }
    driftCount += e.count;
    const allowed = (base.drift || {})[p];
    if (allowed === undefined) news.push([p, e]);
    else if (e.count > allowed) grown.push([p, e, allowed]);
  }

  if (mode === '--bless') {
    const drift = {};
    for (const [p, e] of rows) {
      if (permitted.has(p) || exempt.has(p)) continue;
      drift[p] = e.count;
    }
    const out = { exempt: base.exempt || {}, drift };
    fs.writeFileSync(BASELINE, JSON.stringify(out, null, 2) + '\n');
    console.log(`blessed: ${Object.keys(drift).length} drifting pattern(s) recorded`);
    return 0;
  }

  if (mode === '--report') {
    console.log('-- permitted (design/grammar.js)');
    for (const p of G.PERMITTED) {
      const e = seen.get(norm(p));
      console.log(`  ok  ${JSON.stringify(p).padEnd(12)} ${e ? e.count + ' use(s)' : 'unused'}`);
    }
    console.log('-- exempt (declared in the baseline, with a reason)');
    for (const [p, why] of Object.entries(base.exempt || {})) {
      const e = seen.get(norm(p));
      console.log(`  --  ${JSON.stringify(p).padEnd(12)} ${String(e ? e.count : 0).padStart(3)} use(s)  ${why}`);
    }
    console.log('-- DRIFT: not permitted, not exempt');
    for (const [p, e] of rows) {
      if (permitted.has(p) || exempt.has(p)) continue;
      const files = [...e.files].slice(0, 3).join(', ');
      console.log(`  !!  ${JSON.stringify(p).padEnd(24)} ${String(e.count).padStart(3)}  ${files}${e.files.size > 3 ? ` +${e.files.size - 3}` : ''}`);
    }
    console.log(`\n${rows.length} distinct pattern(s) · ${okCount} conforming use(s) · ${driftCount} drifting use(s)`);
    return 0;
  }

  /* gate */
  for (const [p, e] of news) {
    console.log(`  FAIL  new dash pattern ${JSON.stringify(p)} (${e.count}x) — not in design/grammar.js`);
    console.log(`        ${[...e.files].slice(0, 4).join(', ')}`);
  }
  for (const [p, e, allowed] of grown) {
    console.log(`  FAIL  ${JSON.stringify(p)} used ${e.count}x, baseline allows ${allowed}`);
  }
  const bad = news.length + grown.length;
  const recorded = Object.keys(base.drift || {}).length;
  if (bad === 0) {
    console.log(`grammar gate: ${rows.length} pattern(s) · ${okCount} conforming · ${driftCount} declared drift across ${recorded} pattern(s) — the ratchet holds`);
    return 0;
  }
  console.log(`grammar gate: ${bad} violation(s). The permitted set is design/grammar.js; widen it there deliberately or fix the call site.`);
  return 1;
}

process.exit(main());
