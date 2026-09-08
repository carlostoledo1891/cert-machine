#!/usr/bin/env node
/* run-kissing-ledger.js — decide every pinned kissing-record configuration
   and write certs/kissing-ledger.json.

   Rows come only from corpus/kissing/*.json (fetched bytes, upstream sha256
   recorded at fetch time) or from generators in the instrument (calibration
   witnesses). A claimant with no public bytes gets a NEEDS DATA row that
   states exactly what is missing and what would decide it — and when the
   bytes arrive the row decides (the EinsteinArena 604 did, 2026-09-07). */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const K = require(path.join(ROOT, 'instruments', 'kissing', 'kissing.js'));
const CG = require(path.join(ROOT, 'instruments', 'kissing', 'congruence.js'));
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
    { upstream_sha256: ae.upstream_sha256, form: 'integer vectors, entries up to ~8.7e12', date: '2025-05-14', dateSource: 'AlphaEvolve white paper and results notebook, May 2025' });
}
{
  const ea = corpus('ea-d11-594-winner.json');
  const r = K.certify(K.fromDecimals(ea.vectors));
  if (r.n !== 594 || r.dim !== 11) die('ea-594 row shape');
  push('ea-594-winner', 'EinsteinArena agents (Bianchi et al. platform)', 'K(11) >= 594 — the solved n=594 rung, score-0 winner (solution #' + ea.solution_id + ')', ea.source, r,
    { upstream_sha256: ea.upstream_sha256, form: 'decimal literals read as exact rationals', date: '2026-04-10', dateSource: 'createdAt of solution #1492 on the platform API (2026-04-10T23:13:59Z)' });
}
{
  const st = corpus('station-d11-604.json');
  for (let c = 0; c < 3; c++) {
    const r = K.certify(K.fromSqrt2Pairs(st.configs[c]), { uniformNorm: [144, 0] });
    if (r.n !== 604 || r.dim !== 11) die('station config shape');
    push('station-604-' + (c + 1), 'The Station agents (dualverse-ai)', 'K(11) >= 604 — configuration ' + (c + 1) + ' of three', st.source, r,
      { upstream_sha256: st.upstream_sha256, form: '(a + b*sqrt2)/6 entries, shell norm exactly 4', date: '2026-08-24', dateSource: 'dualverse-ai/station_data_v2 initial public release 606e325f and arXiv:2608.23691 v1, both 2026-08-24' });
  }
  const shell = K.certify(K.fromIntegers(st.shell_582));
  push('station-shell-582', 'classical (Best 1977 class; bytes from the Station bundle)', 'K(11) >= 582 — the pre-2022 record shell, integer norm-4 maximum (Lean-proved maximal by the Station)', st.source, shell,
    { upstream_sha256: st.upstream_sha256, form: 'integer vectors', date: '1980-01-01', dateSource: 'M. R. Best, IEEE Trans. Inform. Theory 26 (1980) — the norm-4 shell class; the year, not a day' });
  const lift = K.certify(K.fromIntegers(st.d12_lift_3));
  if (lift.dim !== 12) die('lift dim');
  push('station-d12-lift', 'The Station agents (dualverse-ai)', 'construction device: 604 integer D12 vectors whose oblique shadow is configuration 3 (also a valid 604-point direction set in R^12)', st.source, lift,
    { upstream_sha256: st.upstream_sha256, form: 'integer vectors in R^12' });
}

/* ---- the EinsteinArena headline 604: NEEDS DATA 2026-09-03 → bytes published on request 2026-09-07 ---- */
{
  const meta = corpus('ea-d11-604.meta.json');
  const raw = fs.readFileSync(path.join(ROOT, 'corpus', 'kissing', meta.file));
  const sha = crypto.createHash('sha256').update(raw).digest('hex');
  if (sha !== meta.upstream_sha256) die('corpus/kissing/' + meta.file + ' does not hash to its pinned upstream sha256');
  const ea6 = JSON.parse(raw.toString('utf8'));
  const vecs = K.fromSqrt2Flat(ea6.vectors);
  const r = K.certify(vecs, { uniformNorm: [36, 0] });
  if (r.n !== 604 || r.dim !== 11) die('ea-604 row shape');
  /* exact isometry invariants against the three Station configurations:
     equal Gram profiles are NECESSARY for congruence, never sufficient */
  const st = corpus('station-d11-604.json');
  const stVecs = st.configs.map((c) => K.fromSqrt2Pairs(c));
  const gram = K.gramProfile(vecs);
  if (!gram) die('ea-604: the Gram profile refused (norms not uniform)');
  const sameProfile = [], shared = {}, congruence = {};
  const certs = {};
  stVecs.forEach((sv, i) => {
    const g = K.gramProfile(sv);
    const id = 'station-604-' + (i + 1);
    rows.find((x) => x.id === id).gram = { distinct: g.distinct, sha256: g.sha256, vertexSha256: g.vertexSha256, multiset: g.multiset };
    if (g.sha256 === gram.sha256 && g.vertexSha256 === gram.vertexSha256) sameProfile.push(id);
    shared[id] = K.sharedDirections(vecs, sv);
    /* congruence DECIDED: individualisation-refinement, a certificate when found */
    const c = CG.congruent(vecs, sv);
    if (!c) die('congruence refused between ea-604 and ' + id);
    congruence[id] = { verdict: c.verdict, isometry: c.isometry, reason: c.reason, nodes: c.nodes, refines: c.refines, edgeColours: c.edgeColours, ms: c.ms };
    if (c.certificate) certs[id] = c.certificate;
    console.log('    congruence ea-604 ~ ' + id + ': ' + c.verdict + (c.isometry ? ' (' + c.isometry + ')' : '') + ' · ' + c.nodes + ' nodes · ' + c.ms + ' ms');
  });
  if (sameProfile.join() !== Object.keys(congruence).filter((k) => congruence[k].verdict === 'CONGRUENT').join()) die('Gram-profile equality and congruence disagree — one of the two is wrong');
  /* the certificate, written beside the ledger so anyone can re-verify without the search */
  fs.writeFileSync(path.join(ROOT, 'certs', 'kissing-congruence.json'), JSON.stringify({
    what: 'Congruence certificates between the EinsteinArena 604 (corpus/kissing/ea-d11-604.json) and the Station configurations (corpus/kissing/station-d11-604.json): pi a bijection of the 604 vectors, T an orthogonal matrix over Q(sqrt2) as [p, q, den] triples meaning (p + q*sqrt2)/den, scale s likewise, with T·s·a_i = b_pi(i) for every i. Re-verify with instruments/kissing/congruence.js verifyCertificate; the battery does at every run.',
    a: 'ea-604', a_sha256: meta.upstream_sha256, b_sha256: st.upstream_sha256, certificates: certs,
  }, null, 0) + '\n');
  /* lineage: what the 604 keeps of the platform's own 594, and of the classical shell */
  const w594 = K.fromDecimals(corpus('ea-d11-594-winner.json').vectors);
  shared['ea-594-winner'] = K.sharedDirections(vecs, w594);
  shared['station-shell-582'] = K.sharedDirections(vecs, K.fromIntegers(st.shell_582));
  const integerVectors = vecs.filter((v) => v.Q.every((q) => q === 0n)).length;
  const w594row = rows.find((x) => x.id === 'ea-594-winner');
  w594row.sharedDirectionsWith = { 'ea-604': shared['ea-594-winner'], 'station-shell-582': K.sharedDirections(w594, K.fromIntegers(st.shell_582)) };
  w594row.nonIntegerVectors = corpus('ea-d11-594-winner.json').vectors.filter((r) => r.some((x) => String(x).includes('.'))).length;
  const slack = K.nearestNonContact(gram);
  push('ea-604', 'EinsteinArena (Bianchi, Kwon, Pappu, Zou — arXiv:2606.10402)',
    'K(11) >= 604 — the paper\'s headline result, credited by Cohn\'s reference table (2026-06-22)', meta.source, r, {
      upstream_sha256: meta.upstream_sha256, upstream_commit: meta.upstream_commit,
      form: 'p + q*sqrt2 integer pairs (22 integers per vector), shell norm exactly 36',
      gram: { distinct: gram.distinct, sha256: gram.sha256, vertexSha256: gram.vertexSha256, multiset: gram.multiset },
      sameGramProfileAs: sameProfile, sharedDirectionsWith: shared, congruence, integerVectors, nearestNonContact: slack,
      needsDataFrom: meta.needs_data_from, bytesPublished: meta.published,
      date: meta.upstream_commit_date, dateSource: 'first commit of the file in togethercomputer/EinsteinArena-new-SOTA (d97e89d1, "add n=604", 2026-04-12); arXiv:2606.10402 v1 submitted 2026-06-09',
      history: 'NEEDS DATA from ' + meta.needs_data_from + ' (the public API served the solved 594 rung and the open 605 rung, never the 604 itself; the row named the bytes that would decide it) until '
        + meta.published + ', when the platform maintainer answered vinid/einstein-arena#64 with the repository holding the file. Decided the same day.',
    });
}

/* ---- claims with no public bytes: measured, not assumed ---- */
rows.push({
  id: 'ganzhinov-592', claimant: 'M. Ganzhinov (arXiv:2207.08266, Highly symmetric lines)',
  claim: 'K(11) >= 592 — the 2022 record the AI ladder started from',
  source: 'not yet pulled',
  verdict: 'QUEUED', date: '2022-07-18', dateSource: 'arXiv:2207.08266 v1',
  detail: 'Construction paper predating the AI ladder; bytes not yet hunted. Queued for the next ledger '
    + 'extension together with the PackingStar corpus (dims 12-31) and the dimension-12 record 841 (arXiv:2606.18984).',
});
console.log('  ganzhinov-592      QUEUED');

/* ---- the OPEN rungs on the platform: the best attempt on each, measured — not claims, not rows ---- */
const openRungs = [];
{
  const o = corpus('ea-open-rungs.json');
  console.log('open rungs (measured, not claimed):');
  for (const r of o.rungs) {
    const V = K.fromDecimals(r.best.vectors);
    const m = K.measure(V);
    if (m.n !== r.best.n || m.dim !== r.best.dim) die('open rung shape: ' + r.slug);
    if (m.violations === 0 && m.zero === 0) die('open rung ' + r.slug + ' measured as a WITNESS — that is a record, promote it to a row');
    openRungs.push({ slug: r.slug, title: r.title, problem_id: r.problem_id, best: { id: r.best.id, agent: r.best.agent, score: r.best.score, createdAt: r.best.createdAt }, response_sha256: r.response_sha256, fetched: o.fetched, measured: m });
    console.log('  ' + r.slug.padEnd(24) + ' best #' + r.best.id + ' score ' + r.best.score + ' → ' + m.violations + ' violating pairs, worst ' + (m.worstAngleDeg === null ? '—' : m.worstAngleDeg.toFixed(2) + '°') + (m.coincident ? ', ' + m.coincident + ' coincident' : '') + ', ' + m.contacts + ' contacts');
  }
}

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
    'corpus/kissing/ea-d11-604.json': corpus('ea-d11-604.meta.json').upstream_sha256,
    'corpus/kissing/ea-open-rungs.json': Object.fromEntries(corpus('ea-open-rungs.json').rungs.map((r) => [r.slug, r.response_sha256])),
  },
  generated: new Date().toISOString(),
  git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })(),
  rows,
  openRungs,
};
fs.writeFileSync(path.join(ROOT, 'certs', 'kissing-ledger.json'), JSON.stringify(out, null, 1) + '\n');
console.log('wrote certs/kissing-ledger.json — ' + rows.length + ' rows, '
  + rows.filter((r) => r.verdict === 'CERTIFIED').length + ' certified, '
  + rows.filter((r) => r.verdict === 'NEEDS DATA').length + ' needs-data, '
  + rows.filter((r) => r.verdict === 'QUEUED').length + ' queued');
