#!/usr/bin/env node
/* run-claims-ledger.js — derive certs/claims-ledger.json from the records.
   tools/ · cert-machine

   THE LEDGER IS DERIVED, NEVER TYPED. Every row is read out of a record that already decides the
   claim; a claim with no record does not get a row. That is the difference between a ledger and a
   list of things we remember doing.

   ORIGIN is tracked because it is the honest part: everything here so far is SELF-INITIATED — we
   chose the claim. The submitted column is what an intake queue fills, and it is empty until
   someone sends something. Publishing a decided-claims page while pretending the queue is busy
   would be the exact failure this lab exists to catch.

   usage: node tools/run-claims-ledger.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const die = (m) => { console.error('CLAIMS LEDGER REFUSED: ' + m); process.exit(1); };
const J = (p) => { const f = path.join(ROOT, p); if (!fs.existsSync(f)) die('missing record ' + p); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const rows = [];

/* 1 · the six-claim AI audit */
{
  const a = J('certs/ai-claims-summary.json');
  if (!a.verdicts || a.verdicts.length !== a.lanes) die('the ai-claims summary disagrees with itself');
  for (const v of a.verdicts) rows.push({
    id: 'ai-' + v.id, claim: v.short, claimant: 'a manuscript produced with frontier-model help',
    source: 'published manuscript', origin: 'self-initiated',
    verdict: v.verdict === 'CONFIRMED' ? 'CERTIFIED' : (v.verdict === 'PARTIAL' ? 'PARTIAL' : v.verdict),
    scope: v.scope, checks: v.namedChecks,
    decidedFrom: 'certs/ai-claims-summary.json', page: '/reports/ai-claims-audit.html'
  });
}

/* 2 · Erdos #852 — a published constant, refuted */
{
  const c = J('certs/erdos852-certificate.json');
  const pub = c.cstar.published;
  if (pub.verdict !== 'REFUTED') die('the #852 record no longer refutes the published value');
  rows.push({
    id: 'erdos852-cstar', claim: 'C* for Erdos #852, published as ' + pub.value + ' with no error bound',
    claimant: 'a problem thread post produced with frontier-model help',
    source: 'erdosproblems.com problem thread', origin: 'self-initiated',
    verdict: 'REFUTED', scope: 'the constant itself, to its printed digits',
    mechanism: 'outside a certified enclosure; the corrected value is certified and public in the thread',
    decidedFrom: 'certs/erdos852-certificate.json', page: '/reports/erdos852.html'
  });
}

/* 3 · the kissing ladder — other people's configurations, decided from their own bytes */
{
  const k = J('certs/kissing-ledger.json');
  const kr = k.rows || k.ledger || k.entries || [];
  if (!kr.length) die('the kissing ledger is empty');
  for (const r of kr) rows.push({
    id: 'kiss-' + r.id, claim: r.claim, claimant: r.claimant, source: r.source,
    origin: 'self-initiated', verdict: r.verdict,
    scope: r.verdict === 'NEEDS DATA' ? 'undecidable here: no public coordinates' : 'the configuration as published, in exact arithmetic',
    decidedFrom: 'certs/kissing-ledger.json', page: '/reports/kissing.html'
  });
}

/* 4 · the Ramanujan Machine registry, as one aggregate row (honest counting: it is one audit) */
{
  const l = J('ledger.json');
  const f = (l.families || []).find(x => x.name === 'ramanujan-audit');
  if (!f) die('the ledger holds no ramanujan-audit family');
  const c = f.counts;
  rows.push({
    id: 'rm-registry', claim: 'the published Ramanujan Machine result sheets, ' + c.certified + ' printed rows',
    claimant: 'the Ramanujan Machine project', source: 'published result sheets',
    origin: 'self-initiated', verdict: c.rejects ? 'MIXED' : 'CERTIFIED',
    scope: c.hits + ' rows survive their certified enclosure, ' + c.rejects + ' refuted exactly',
    decidedFrom: 'ledger.json (family ramanujan-audit)', page: '/reports/rm-audit.html'
  });
}

const byVerdict = {};
for (const r of rows) byVerdict[r.verdict] = (byVerdict[r.verdict] || 0) + 1;
const byOrigin = {};
for (const r of rows) byOrigin[r.origin] = (byOrigin[r.origin] || 0) + 1;
if (byOrigin.submitted) die('a submitted row appeared but the intake queue has no record to derive it from');

const out = {
  what: 'Externally published mathematical claims this machine has decided, one row per claim, each '
    + 'derived from the record that decided it. The verdicts are the instrument\'s, not a summary: '
    + 'CERTIFIED and REFUTED are theorems, PARTIAL names the fragment that was reached, NEEDS DATA '
    + 'measures the claimant rather than the claim, and MIXED means the row is an aggregate whose '
    + 'record holds both.',
  honestCounting: 'Every row is DERIVED from a record; a claim with no record gets no row. ORIGIN is '
    + 'tracked separately: everything here is self-initiated — we chose the claim. Nothing has been '
    + 'submitted yet, and the submitted count stays zero until it is not.',
  scope: 'What can be decided here: claims that come down to finitely many exact arithmetic facts — '
    + 'exhibit a witness, verify an identity, bound a quantity, decide a constant. Everything else is '
    + 'REFUSED as out of scope rather than guessed at.',
  rows, count: rows.length,
  /* A QUEUED row is NOT a decided claim. Counting it as one would inflate the
     headline by exactly the amount this lab exists to catch, so it is split
     out here and the pages quote `decided`. */
  decided: rows.filter(r => r.verdict !== 'QUEUED').length,
  pending: rows.filter(r => r.verdict === 'QUEUED').length,
  byVerdict, byOrigin,
  submitted: 0,
  meta: { date: new Date().toISOString().slice(0, 10), git }
};
fs.writeFileSync(path.join(ROOT, 'certs', 'claims-ledger.json'), JSON.stringify(out, null, 1) + '\n');
console.log('certs/claims-ledger.json written · ' + out.decided + ' decided (+' + out.pending + ' queued) · '
  + Object.entries(byVerdict).map(([k, v]) => k + ' ' + v).join(', ') + ' · submitted ' + out.submitted + ' @ git ' + git);
