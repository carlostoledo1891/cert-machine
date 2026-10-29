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
const { skipDir } = require(path.join(ROOT, 'design', 'zones.js'));   /* site/machinidae/ and any other foreign zone: never measured */
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
    if (e.isDirectory()) { if (!skipDir(SITE, p)) walk(p, out); }
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

/* THE MARKS CENSUS (ruled 2026-10-29, the roundtable): three more facts about the built pages, each ratcheted in the
   baseline's `ratchet` block (a count may only shrink; --bless records reality).
     unstanding     a dashed, non-guide SVG mark that carries no standing (neither a w-* class nor data-w): the dash
                    then says nothing a reader can decode (finding F2: 99 on 24 pages, from design/charts.js's
                    `dashed: true`)
     dashedBorders  a `dashed` border in a page's CSS: a dash is a standing, and a chip is not a line (finding F5)
     chipClash      a verdict word wearing more than one chip kind across the site, or a kind other than the one
                    design/components.js VERDICT_KIND gives it: word → shape is a function
     unpointed      a w-val span with no data-rec (D10, 2026-10-29): a printed number no gate can follow back to
                    its record; tools/check-marks.js re-reads the pointed ones */
function marksCensus() {
  const { VERDICT_KIND } = require(path.join(ROOT, 'design', 'components.js'));
  const guide = norm(G.GUIDE);
  const unstanding = [], borders = [], chips = new Map(), unpointed = [];
  for (const file of walk(SITE)) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(SITE, file);
    const re = /<(?:line|path|polyline|polygon|rect|circle|ellipse)\b[^>]*stroke-dasharray="([^"]+)"[^>]*>/g;
    let m;
    while ((m = re.exec(src))) {
      const p = norm(m[1]);
      if (p === guide || p.includes('${') || p.includes('var(')) continue;
      if (!/\bclass="[^"]*\bw-/.test(m[0]) && !/\bdata-w="/.test(m[0])) unstanding.push(rel);
    }
    const rv = /<span\b[^>]*\bclass="[^"]*\bw-val\b[^"]*"[^>]*>/g;
    while ((m = rv.exec(src))) if (!/\bdata-rec="/.test(m[0])) unpointed.push(rel);
    const rb = /border(?:-[a-z]+)?\s*:[^;{}]*\bdashed\b/g;
    while ((m = rb.exec(src))) borders.push(rel);
    const rc = /class="tag ([a-z]+)">([^<]+)</g;
    while ((m = rc.exec(src))) {
      const word = m[2].trim();   /* the register's words, as written in caps; a lowercase 'certified' in a story page is a word, not a verdict chip */
      if (!VERDICT_KIND[word]) continue;
      if (!chips.has(word)) chips.set(word, new Map());
      const k = chips.get(word); k.set(m[1], (k.get(m[1]) || 0) + 1);
    }
  }
  const clash = [];
  for (const [word, kinds] of chips) for (const [k, n] of kinds) if (k !== VERDICT_KIND[word]) clash.push(word + ' as ' + k + ' ×' + n);
  const count = (arr) => { const per = {}; for (const r of arr) per[r] = (per[r] || 0) + 1; return per; };
  return { unstanding: unstanding.length, dashedBorders: borders.length, chipClash: clash.length, unpointed: unpointed.length,
    where: { unstanding: count(unstanding), dashedBorders: count(borders), chipClash: clash, unpointed: count(unpointed) } };
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
    const mc = marksCensus();
    const out = { exempt: base.exempt || {}, drift, ratchet: { unstanding: mc.unstanding, dashedBorders: mc.dashedBorders, chipClash: mc.chipClash, unpointed: mc.unpointed } };
    fs.writeFileSync(BASELINE, JSON.stringify(out, null, 2) + '\n');
    console.log(`blessed: ${Object.keys(drift).length} drifting pattern(s) recorded; marks ratchet ${JSON.stringify(out.ratchet)}`);
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
    const mc = marksCensus();
    console.log('-- MARKS: dashed without a standing / dashed borders / verdict-chip clashes');
    for (const [k, per] of Object.entries(mc.where)) {
      const rows2 = Array.isArray(per) ? per : Object.entries(per).sort((a, b) => b[1] - a[1]).map(([f, n]) => f + ' ' + n);
      console.log(`  ${k}: ${Array.isArray(per) ? per.length : mc[k]}${rows2.length ? '  ' + rows2.slice(0, 6).join(', ') + (rows2.length > 6 ? ' +' + (rows2.length - 6) : '') : ''}`);
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
  /* the marks ratchet: each count may only shrink */
  const mc = marksCensus(), rat = base.ratchet || {};
  let marksBad = 0;
  for (const k of ['unstanding', 'dashedBorders', 'chipClash', 'unpointed']) {
    const allowed = rat[k] === undefined ? 0 : rat[k];
    if (mc[k] > allowed) {
      marksBad++;
      const per = mc.where[k];
      console.log(`  FAIL  ${k}: ${mc[k]}, baseline allows ${allowed}  ${Array.isArray(per) ? per.slice(0, 4).join('; ') : Object.entries(per).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f, n]) => f + ' ' + n).join(', ')}`);
    }
  }
  const bad = news.length + grown.length + marksBad;
  const recorded = Object.keys(base.drift || {}).length;
  if (bad === 0) {
    console.log(`marks: ${mc.unstanding} dashed without a standing · ${mc.dashedBorders} dashed border(s) · ${mc.chipClash} chip clash(es) · ${mc.unpointed} value(s) without a record pointer (baseline ${JSON.stringify(rat)})`);
    console.log(`grammar gate: ${rows.length} pattern(s) · ${okCount} conforming · ${driftCount} declared drift across ${recorded} pattern(s) — the ratchet holds`);
    return 0;
  }
  console.log(`grammar gate: ${bad} violation(s). The permitted set is design/grammar.js; widen it there deliberately or fix the call site.`);
  return 1;
}

/* THE CENSUS'S TWO PIECES ARE EXPORTED (2026-10-29) so design/print/check-svg.js reads a print figure with the same
   normalisation and the same three patterns this gate reads the site with, instead of a copy of them. Required, this
   file runs nothing; run, it is the gate it always was. */
if (require.main === module) process.exit(main());
module.exports = { norm, RE };
