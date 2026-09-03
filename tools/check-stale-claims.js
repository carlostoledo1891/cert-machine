#!/usr/bin/env node
/* check-stale-claims.js — the gate that would have caught the #290 drift.

   tools/sweep-claims.js watches for NEW external claims. It structurally
   cannot see the opposite failure: one of OUR pages still telling a story that
   our own target memory has already recorded as dead. That is exactly what
   happened to reports/erdos290.html — targets marked the upper-constant result
   SUPERSEDED on 2026-09-02 and the page went on presenting it as a live
   sharpening for a day.

   The rule: if a targets row is marked SUPERSEDED / DEAD / REFUTED and names a
   report page, that page must acknowledge it — by citing the superseding
   source, or by using an explicit word like "superseded". Silence is the bug.

   usage: node tools/check-stale-claims.js   (exit 1 if any page is stale) */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const targets = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'targets.json'), 'utf8')).targets;
const DEADISH = /\b(SUPERSEDED|DEAD|REFUTED)\b/;
const ACK = /superseded|no longer|now a theorem|overtaken|withdrawn|历史/i;

const REPORTS = fs.readdirSync(path.join(ROOT, 'reports')).filter((f) => f.endsWith('.html'));
const unmapped = [];
let weak = 0;
let stale = 0, examined = 0;
for (const t of targets) {
  const verdict = String(t.verdict || '');
  if (!DEADISH.test(verdict)) continue;
  const blob = JSON.stringify(t);
  /* Which of our report pages does this row bear on? Rows rarely name a path,
     so match by PROBLEM TOKEN: the leading segments of the row id, against the
     report filenames that actually exist. "erdos290-upper-constant" -> token
     "erdos290" -> reports/erdos290.html. A row we cannot map is reported as
     unmapped rather than silently skipped — a gate that examines nothing and
     prints "0 stale" is worse than no gate. */
  let pages = [...new Set((blob.match(/reports\/[a-z0-9-]+\.html/g) || []))];
  if (!pages.length) {
    const id = String(t.id || '');
    const parts = id.split('-');
    for (const n of [1, 2]) {
      const tok = parts.slice(0, n).join('-');
      if (!tok) continue;
      const hit = REPORTS.filter((f) => f === tok + '.html' || f.startsWith(tok + '-'));
      if (hit.length) { pages = hit.map((f) => 'reports/' + f); break; }
    }
  }
  if (!pages.length) { unmapped.push(t.id || t.name); continue; }
  /* an arXiv id in the row is the superseding source the page ought to cite */
  const ids = [...new Set((blob.match(/\b\d{4}\.\d{4,5}\b/g) || []))];
  for (const rel of pages) {
    const f = path.join(ROOT, rel);
    if (!fs.existsSync(f)) continue;
    examined++;
    const html = fs.readFileSync(f, 'utf8');
    /* When the row names the source that superseded the claim, the page must
       CITE THAT SOURCE. That is specific and cannot be satisfied by accident.
       Only when no source is recorded do we fall back to looking for an
       acknowledging phrase, which is a weaker test and is labelled as such. */
    if (ids.length) {
      if (ids.some((id) => html.includes(id))) continue;
    } else if (ACK.test(html)) {
      weak++;
      continue;
    }
    stale++;
    console.error('STALE: ' + rel + ' carries a claim its targets row marks "' + verdict.slice(0, 60) + '"');
    console.error('       row: ' + (t.id || t.name));
    if (ids.length) console.error('       the page cites none of the superseding sources: ' + ids.join(', '));
    console.error('       fix: state the supersession on the page, or cite the source that caused it.');
  }
}
console.log('stale-claim gate: ' + examined + ' page/row pairs examined, ' + stale + ' stale'
  + (weak ? ' · ' + weak + ' pair(s) passed only on an acknowledging phrase (no source recorded to demand)' : '')
  + (unmapped.length ? ' · ' + unmapped.length + ' dead-ish row(s) map to no report page (nothing to check): ' + unmapped.join(', ') : ''));
if (!examined && !unmapped.length) { console.error('the gate examined nothing at all — its mapping is broken'); process.exit(2); }
process.exit(stale ? 1 : 0);
