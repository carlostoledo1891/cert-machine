#!/usr/bin/env node
/* build-report-claims.js — generate reports/claims.html: the claims desk and its ledger.

   EVERY ROW IS DERIVED. The page is built from certs/claims-ledger.json, which is itself derived
   from the records that decided each claim — a claim with no record gets no row. The build
   REFUSES if the ledger's submitted count disagrees with the rows, because a decided-claims page
   that implies a busy queue while none exists would be the exact failure this lab exists to catch.

   usage: node tools/build-report-claims.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));

const die = (m) => { console.error('CLAIMS REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const RP = path.join(ROOT, 'certs', 'claims-ledger.json');
if (!fs.existsSync(RP)) die('certs/claims-ledger.json is missing — run node tools/run-claims-ledger.js');
const R = JSON.parse(fs.readFileSync(RP, 'utf8'));
if (R.rows.length !== R.count) die('the ledger disagrees with its own count');
if (R.decided + R.pending !== R.count) die('decided + pending does not equal the row count');
if (R.rows.filter(r => r.verdict === 'QUEUED').length !== R.pending) die('the pending count does not match the QUEUED rows');
const submittedRows = R.rows.filter(r => r.origin === 'submitted').length;
if (submittedRows !== R.submitted) die('the submitted count does not match the rows carrying that origin');
for (const r of R.rows) if (!r.decidedFrom) die('a row names no record: ' + r.id);

const GH = 'https://github.com/carlostoledo1891/cert-machine';
const NEW = GH + '/issues/new?template=claim.yml';
const tagOf = (v) => v === 'CERTIFIED' ? 'held' : (v === 'REFUTED' ? 'cert' : (v === 'NEEDS DATA' || v === 'QUEUED' ? 'open' : 'dep'));

const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · the claims desk',
  title: 'Send us a claim',
  deck: 'A mathematical claim that comes down to finitely many exact arithmetic facts can be decided '
    + 'here — certified with a certificate that re-runs without this engine, refuted with the '
    + 'falsifying witness printed, or honestly refused. The verdict is published whichever way it '
    + 'falls, and we never run the claimant\'s code.'
}));

B.push(C.scope('The queue is open and EMPTY: ' + R.submitted + ' claims have been submitted so far. Every '
  + 'row in the ledger below was self-initiated — we chose the claim — and the page says so rather than '
  + 'implying a busy desk. That distinction is the first thing this desk would want measured about itself.'));

B.push(C.tldr({
  findingRaw: '<b>' + R.decided + ' published claims decided</b> so far, all self-initiated: '
    + Object.entries(R.byVerdict).filter(([k]) => k !== 'QUEUED').map(([k, v]) => v + ' ' + k).join(', ')
    + (R.pending ? ', with ' + R.pending + ' queued and not yet decided — queued is not decided, so it is counted separately' : '')
    + '. Each row is derived from the record that decided it — a claim with no record gets no row.',
  mechanismRaw: 'The instrument returns THREE verdicts and no fourth: CERTIFIED and REFUTED are theorems, '
    + 'REFUSED is what a claim gets when this instrument cannot decide it — a real outcome, published like any '
    + 'other, and not evidence either way. The other labels in the ledger are COMPOSITIONS of those three, not '
    + 'extra verdicts: PARTIAL is a certified fragment beside a refused core, and names which is which; '
    + 'NEEDS DATA is a refusal whose reason belongs to the claimant (the bytes were never published); MIXED is '
    + 'an aggregate row whose record holds both a certification and a refutation.',
  checkRaw: 'Submit through <a href="' + NEW + '">the claim form</a>. Everything decided is on this page, '
    + 'and every verdict links to the record it came from.'
}));

B.push(C.stats([
  { k: 'claims decided', v: String(R.decided), n: 'Each derived from the record that decided it: '
    + Object.entries(R.byVerdict).filter(([k]) => k !== 'QUEUED').map(([k, v]) => v + ' ' + k).join(' · ')
    + (R.pending ? '. A further ' + R.pending + ' is queued and deliberately not counted as decided.' : '.') },
  { k: 'submitted by others', v: String(R.submitted), n: 'The queue is open. Until this number moves, everything on this page is work we chose ourselves, and saying so is the point.' },
  { k: 'claimant code run', v: '0', n: 'Independence is from the CLAIMANT: their code is never in the trust path. Every decision is re-derived from the published statement and bytes.' },
  { k: 'verdicts available', v: '3', n: 'CERTIFIED · REFUTED · REFUSED. A claim outside the boundary is refused rather than guessed at, and the refusal is published.' }
]));

B.push(C.section({
  lab: '§1 · the boundary', title: 'What can be decided here, and what cannot',
  bodyRaw: [
    C.pRaw('<strong>In scope.</strong> ' + C.esc(R.scope.replace(/^What can be decided here:\s*/, ''))),
    C.plainList([
      { b: 'A constant, to stated digits.', text: 'Exhibit the value; the instrument brackets the true '
        + 'quantity in exact arithmetic and compares. This is how a published constant was refuted at its '
        + 'twelfth significant digit.' },
      { b: 'An exhibited object.', text: 'A configuration, a decomposition, a construction — anything whose '
        + 'correctness is finitely many exact checks on the bytes you publish.' },
      { b: 'An identity or inequality over a finite set.', text: 'Every case decided exactly; no sampling, '
        + 'no tolerance, no "checked at 10,000 random points".' },
      { b: 'The computational part of a published proof.', text: 'Named as such: the fragment is decided and '
        + 'the analytic core is left alone, with the page saying exactly which is which.' },
      { b: 'OUT of scope, and refused rather than guessed at.', text: 'Asymptotics, statements over infinite '
        + 'families with no finite reduction, and proofs whose content is prose. A refusal here is a statement '
        + 'about this instrument\'s reach, not about your claim.' }
    ])
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · how', title: 'What to send, and what comes back',
  bodyRaw: [
    C.pRaw('Open <a href="' + NEW + '">a claim issue</a> with the statement, where it is published, and — if '
      + 'you have one — the witness or the exact bytes. Unpublished claims are welcome; say so and they are '
      + 'labelled that way.'),
    C.pRaw('What comes back is one of the three verdicts with its evidence attached: a certificate that '
      + 're-runs on stock Python with no engine present, a printed falsifying witness, or a stated reason for '
      + 'refusing. It is published on this site, added to the ledger below, and linked to the record that '
      + 'produced it. If the claim is yours and the verdict goes against it, that is still what gets published '
      + '— and if you can refute one of OUR results, the same applies in the other direction.'),
    C.note({ lab: 'the one thing this desk will not do', bodyRaw: C.pRaw('Run your code. Independence here '
      + 'means independence from the claimant: the decision is re-derived from the published statement and the '
      + 'published bytes, and the claimant\'s program is never in the trust path. That is the whole reason a '
      + 'verdict from this desk is worth more than a re-run of your own pipeline.') })
  ].join('\n')
}));

{
  const rows = R.rows.map(r => [
    { raw: C.esc(r.claim) },
    { raw: C.esc(r.claimant || '—') },
    { raw: C.tag(r.verdict, tagOf(r.verdict)) },
    { raw: C.esc(r.scope || '—') },
    { raw: '<a href="' + C.escAttr(r.page) + '">' + C.esc('the record') + '</a>' }
  ]);
  B.push(C.section({
    lab: '§3 · the ledger', title: 'Every claim decided, and by what', wide: true,
    bodyRaw: [
      C.table({
        cols: [{ h: 'claim' }, { h: 'claimant' }, { h: 'verdict' }, { h: 'what was actually decided' }, { h: 'where' }],
        rows
      }),
      '<div class="col">' + C.pRaw('The scope column is the load-bearing one. "CERTIFIED" without it says '
        + 'something the record does not: several of these rows certify a computational fragment of a claim '
        + 'whose analytic core was never touched, and the row says which. One row is '
        + C.m('NEEDS DATA') + ' — a headline result whose coordinates have never been published, so it cannot '
        + 'be decided by anyone but its authors. That verdict measures the claimant, not the claim.') + '</div>'
    ].join('\n')
  }));
}

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-claims.js from certs/claims-ledger.json (' + R.meta.date + ', git ' + R.meta.git + '), which is derived from the records that decided each claim. Rebuild: node tools/run-claims-ledger.js && node tools/build-report-claims.js') + '</p>'
  + '<p>' + C.esc('git ' + git) + '</p>'
  + '<p style="margin-top:20px;color:var(--ink-2)">' + C.esc('Carlos Toledo · cert-machine') + '</p>'
  + '</footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'claims.html'),
  TPL.render({
    title: 'Send us a claim · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
    desc: 'The claims desk: a mathematical claim that reduces to finitely many exact arithmetic facts is '
      + 'decided here — certified with a detachable certificate, refuted with the witness printed, or honestly '
      + 'refused. ' + R.decided + ' published claims decided so far, every row derived from the record that '
      + 'decided it, and the claimant\'s code never in the trust path.',
    path: '/reports/claims.html'
  }));
console.log('reports/claims.html written: ' + R.count + ' claims, ' + R.submitted + ' submitted @ git ' + git);
