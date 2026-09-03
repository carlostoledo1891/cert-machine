#!/usr/bin/env node
/* run-kissing-ledger.js — decide every pinned kissing-record configuration
   and write certs/kissing-ledger.json.

   Rows come only from corpus/kissing/*.json (fetched bytes, upstream sha256
   recorded at fetch time) or from generators in the instrument (calibration
   witnesses). A claimant with no public bytes gets a NEEDS DATA row that
   states exactly what is missing and what would decide it. */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const K = require(path.join(ROOT, 'instruments', 'kissing', 'kissing.js'));
const die = (m) => { console.error('KISSING LEDGER REFUSED: ' + m); process.exit(1); };

const corpus = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'kissing', f), 'utf8'));
const rows = [];
const push = (id, claimant, claim, src, res, extra) => {
  rows.push(Object.assign({ id, claimant, claim, source: src }, res, extra || {}));
  const v = res.verdict + (res.contacts !== undefined ? ` (${res.contacts} contacts)` : '');
  console.log(`  ${id.padEnd(18)} ${v}`);
};

/* ---- calibrations: generated witnesses for exactly known kissing numbers ---- */
console.log('calibrations:');
{
  const r = K.certify(K.d4());
  if (r.verdict !== 'CERTIFIED') die('D4 calibration failed');
  push('cal-d4-24', 'classical (generated here)', 'K(4) >= 24 — exact value, Musin 2003', 'D4 root directions', r);
  const r8 = K.certify(K.e8());
  if (r8.verdict !== 'CERTIFIED') die('E8 calibration failed');
  push('cal-e8-240', 'classical (generated here)', 'K(8) = 240 — exact value, Levenshtein / Odlyzko–Sloane 1979', 'E8 root directions', r8);
}

/* ---- the dimension-11 record ladder ---- */
console.log('dimension 11:');
{
  const ae = corpus('alphaevolve-d11-593.json');
  const r = K.certify(K.fromIntegers(ae.vectors));
  if (r.n !== 593 || r.dim !== 11) die('alphaevolve row shape');
  push('alphaevolve-593', 'AlphaEvolve (Novikov et al., DeepMind)', 'K(11) >= 593 — the May 2025 record', ae.source, r,
    { upstream_sha256: ae.upstream_sha256, form: 'integer vectors, entries up to ~8.7e12' });
}
{
  const ea = corpus('ea-d11-594-winner.json');
  const r = K.certify(K.fromDecimals(ea.vectors));
  if (r.n !== 594 || r.dim !== 11) die('ea-594 row shape');
  push('ea-594-winner', 'EinsteinArena agents (Bianchi et al. platform)', 'K(11) >= 594 — the solved n=594 rung, score-0 winner (solution #' + ea.solution_id + ')', ea.source, r,
    { upstream_sha256: ea.upstream_sha256, form: 'decimal literals read as exact rationals' });
}
{
  const st = corpus('station-d11-604.json');
  for (let c = 0; c < 3; c++) {
    const r = K.certify(K.fromSqrt2Pairs(st.configs[c]), { uniformNorm: [144, 0] });
    if (r.n !== 604 || r.dim !== 11) die('station config shape');
    push('station-604-' + (c + 1), 'The Station agents (dualverse-ai)', 'K(11) >= 604 — configuration ' + (c + 1) + ' of three', st.source, r,
      { upstream_sha256: st.upstream_sha256, form: '(a + b*sqrt2)/6 entries, shell norm exactly 4' });
  }
  const shell = K.certify(K.fromIntegers(st.shell_582));
  push('station-shell-582', 'classical (Best 1977 class; bytes from the Station bundle)', 'K(11) >= 582 — the pre-2022 record shell, integer norm-4 maximum (Lean-proved maximal by the Station)', st.source, shell,
    { upstream_sha256: st.upstream_sha256, form: 'integer vectors' });
  const lift = K.certify(K.fromIntegers(st.d12_lift_3));
  if (lift.dim !== 12) die('lift dim');
  push('station-d12-lift', 'The Station agents (dualverse-ai)', 'construction device: 604 integer D12 vectors whose oblique shadow is configuration 3 (also a valid 604-point direction set in R^12)', st.source, lift,
    { upstream_sha256: st.upstream_sha256, form: 'integer vectors in R^12' });
}

/* ---- claims with no public bytes: measured, not assumed ---- */
rows.push({
  id: 'ea-604', claimant: 'EinsteinArena (Bianchi, Kwon, Pappu, Zou — arXiv:2606.10402)',
  claim: 'K(11) >= 604 — the paper\'s headline result, credited by Cohn\'s reference table (2026-06-22)',
  source: 'https://einsteinarena.com/api (queried 2026-09-03)',
  verdict: 'NEEDS DATA',
  detail: 'The public API exposes the solved n=594 rung (bytes certified above) and the open n=605 rung; '
    + 'no rung or endpoint serves the 604-point configuration itself. Platform threads (#241) describe the '
    + 'frozen 604 as a Q(sqrt2) norm-4 object — the same family as the Station configurations certified above. '
    + 'The threshold: publish the 604 vectors in any exact or decimal form and this row decides in minutes.',
});
console.log('  ea-604             NEEDS DATA');
rows.push({
  id: 'ganzhinov-592', claimant: 'M. Ganzhinov (arXiv:2207.08266, Highly symmetric lines)',
  claim: 'K(11) >= 592 — the 2022 record the AI ladder started from',
  source: 'not yet pulled',
  verdict: 'QUEUED',
  detail: 'Construction paper predating the AI ladder; bytes not yet hunted. Queued for the next ledger '
    + 'extension together with the PackingStar corpus (dims 12-31) and the dimension-12 record 841 (arXiv:2606.18984).',
});
console.log('  ganzhinov-592      QUEUED');

/* ---- write the record ---- */
const decided = rows.filter((r) => r.verdict === 'CERTIFIED' || r.verdict === 'REFUTED');
if (decided.some((r) => r.verdict === 'REFUTED')) die('a record row REFUTED — that is a finding, write it up before shipping');
const out = {
  what: 'The kissing ledger: every public record configuration for the kissing number, re-decided in exact '
    + 'arithmetic over Z[sqrt2] on BigInt — shared-nothing with every producer\'s own verifier. '
    + 'A direction set with pairwise angles >= 60 degrees IS a kissing configuration; the decision is '
    + '<x,y> <= 0 or 4<x,y>^2 <= <x,x><y,y>, exact, per pair.',
  scope: 'Lower-bound witnesses only. No upper-bound (SDP) claims are touched, and no search for new records is performed.',
  provenance: {
    'corpus/kissing/alphaevolve-d11-593.json': corpus('alphaevolve-d11-593.json').upstream_sha256,
    'corpus/kissing/ea-d11-594-winner.json': corpus('ea-d11-594-winner.json').upstream_sha256,
    'corpus/kissing/station-d11-604.json': corpus('station-d11-604.json').upstream_sha256,
  },
  generated: new Date().toISOString(),
  git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })(),
  rows,
};
fs.writeFileSync(path.join(ROOT, 'certs', 'kissing-ledger.json'), JSON.stringify(out, null, 1) + '\n');
console.log('wrote certs/kissing-ledger.json — ' + rows.length + ' rows, '
  + rows.filter((r) => r.verdict === 'CERTIFIED').length + ' certified, '
  + rows.filter((r) => r.verdict === 'NEEDS DATA').length + ' needs-data, '
  + rows.filter((r) => r.verdict === 'QUEUED').length + ' queued');
