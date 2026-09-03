#!/usr/bin/env node
/* verify-family-cover.js — audit the COVERING of the eps-family certificate.

   The family claim is "for every eps in (0, 0.1]", and a per-eps claim proved
   chunk by chunk stands or falls on whether the chunks actually cover the
   range. Until this checker existed the record carried only a chunk COUNT, so
   the covering rested on the shape of the producing loop and no reader could
   verify it — the same weakness the ember band auditor was written to remove.

   The rung ladder makes it checkable in 114 entries rather than 624k: rungs
   must tile [EPS_MIN, EPS_MAX] with shared endpoints and each must be flagged
   covered, since run() returns true only when a rung certifies as one chunk or
   both of its recursive halves do. This shares no code with family.js.

   usage: node instruments/lemniscate/verify-family-cover.js [--json]
          FAMILY_REC=<path> to audit a copy (the battery's red controls) */
'use strict';
const fs = require('fs');
const path = require('path');
const COV = require(path.join(__dirname, '..', 'covering', 'covering.js'));
const REC = process.env.FAMILY_REC || path.join(__dirname, 'cert-eps-family.json');

const problems = [];
const bad = (m) => problems.push(m);
if (!fs.existsSync(REC)) { console.error('no family record at ' + REC); process.exit(2); }
const R = JSON.parse(fs.readFileSync(REC, 'utf8'));

const REL = 1e-9;                     /* endpoints are geometric: compare relatively */
const close = (a, b) => Math.abs(a - b) <= REL * Math.max(Math.abs(a), Math.abs(b), 1e-300);

const cov = R.covering;
const checks = [];
const ck = (n, c, d) => { checks.push({ name: n, pass: !!c, detail: d }); if (!c) bad(n + (d ? ' — ' + d : '')); };

if (!cov || !Array.isArray(cov.rungs) || !cov.rungs.length) {
  bad('the record carries no rung ladder, so its covering cannot be audited');
} else {
  /* descending ladder: rung[i].eLo == rung[i+1].eHi */
  const rungs = cov.rungs.slice().sort((a, b) => b.eHi - a.eHi);
  ck('the ladder starts at EPS_MAX', close(rungs[0].eHi, R.EPS_MAX),
    'top rung eHi = ' + rungs[0].eHi + ', EPS_MAX = ' + R.EPS_MAX);
  ck('the ladder ends at EPS_MIN', close(rungs[rungs.length - 1].eLo, R.EPS_MIN),
    'bottom rung eLo = ' + rungs[rungs.length - 1].eLo + ', EPS_MIN = ' + R.EPS_MIN);
  /* the rung ladder, via the shared covering module — relative comparison,
     since the ladder spans eleven decades */
  const rc = COV.tileGaps(rungs.map((r) => [r.eLo, r.eHi]), R.EPS_MIN, R.EPS_MAX, { rel: true, eps: REL });
  ck('consecutive rungs share endpoints, so the ladder has no gap', rc.ok, COV.describe(rc));
  ck('every rung is flagged fully covered', rungs.every((r) => r.ok === true),
    rungs.filter((r) => r.ok !== true).length + ' rung(s) not covered');
  ck('every rung is a non-empty interval', rungs.every((r) => r.eHi > r.eLo));
  ck('the per-rung chunk counts sum to the reported total',
    rungs.reduce((s, r) => s + (r.chunks || 0), 0) === R.chunks,
    rungs.reduce((s, r) => s + (r.chunks || 0), 0) + ' vs ' + R.chunks);
  ck('no rung certified zero chunks while claiming to be covered',
    rungs.every((r) => !r.ok || r.chunks > 0));
}
ck('the record reports zero failed chunks', R.fails === 0, 'fails = ' + R.fails);
ck('no failed-chunk details are carried', Array.isArray(R.failed) ? R.failed.length === 0 : R.failed === undefined,
  Array.isArray(R.failed) ? R.failed.length + ' failure record(s)' : 'none');
ck('the audited range is the published one', R.EPS_MIN === 1e-12 && R.EPS_MAX === 0.1,
  '[' + R.EPS_MIN + ', ' + R.EPS_MAX + ']');

const out = { verdict: problems.length ? 'REFUSED' : 'VERIFIED',
  rungs: cov && cov.rungs ? cov.rungs.length : 0, chunks: R.chunks, checks, problems };
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
else {
  for (const c of checks) console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name + (c.detail ? ' — ' + c.detail : ''));
  console.log(problems.length
    ? '\nFAMILY COVERING REFUSED — ' + problems.length + ' problem(s)'
    : '\nFAMILY COVERING VERIFIED: ' + out.rungs + ' rungs tile [' + R.EPS_MIN + ', ' + R.EPS_MAX + '] with no gap, '
      + R.chunks.toLocaleString('en-US') + ' chunks, 0 failures');
}
process.exit(problems.length ? 1 : 0);
