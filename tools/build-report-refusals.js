#!/usr/bin/env node
/* build-report-refusals.js — generate reports/refusals.html: every refusal
   this lab has on record, BY KIND, with its own denominator.

   WHY THIS PAGE EXISTS. The site says "REFUSED is a real verdict here and it
   gets used", and the machine schematic showed a single number beside that
   sentence — 1 — because that counter sums the engine loop's own refusals and
   nothing else. It was never wrong; it was narrow, and it read as a slogan.
   The refusals that carry the claim live in six other records and were
   counted nowhere. This page counts them.

   THE ONE RULE HERE: KINDS ARE NEVER MERGED. REFUSED (our instrument declined
   to decide) is not NEEDS DATA (the claimant published no bytes to decide on)
   is not OPEN (a budget ran out and the attempt is recorded) is not UNDECIDED
   (a cell of a sweep whose box did not close) is not a scope limit (an audit
   that reached a fragment and says which). A single "total refusals" number
   would be a bigger number and a smaller fact, so this page has no total, and
   the build refuses any row that cannot name its own denominator.

   NOTHING HERE IS TYPED. Every count is read from its record at build.

   usage: node tools/build-report-refusals.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));

const die = (m) => { console.error('REFUSALS REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const num = (n) => n.toLocaleString('en-US');
const pct = (a, b) => (100 * a / b).toFixed(1) + '%';
const J = (p) => { const f = path.join(ROOT, p); if (!fs.existsSync(f)) die('the record ' + p + ' is missing'); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const JL = (p) => { const f = path.join(ROOT, p); if (!fs.existsSync(f)) die('the record ' + p + ' is missing'); return fs.readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l)); };

/* ---- the records ---------------------------------------------------------- */

/* 1 · the engine loop */
const ledger = J('ledger.json');
const loop = (ledger.families || []).reduce((a, f) => {
  const c = f.counts || {};
  return { refused: a.refused + (c.refused || 0), decided: a.decided + (c.certified || 0), families: a.families + 1 };
}, { refused: 0, decided: 0, families: 0 });
const loopWhere = (ledger.families || []).filter((f) => (f.counts || {}).refused).map((f) => f.name);
if (!loop.decided) die('the ledger reports no decisions — the loop denominator would be empty');

/* 2 · intake: the eval board. Three DIFFERENT things hide in one column and
   the page separates them: a claim we could not parse is OUR refusal; a model
   that declines to answer is ITS refusal, not ours; a reply cut off by our own
   output cap is a harness artifact and belongs in neither rate. */
const evalRows = JL('certs/matmul-eval-ledger.jsonl').filter((r) => r.model !== 'fake');
const nOut = (o) => evalRows.filter((r) => r.outcome === o).length;
const ev = {
  rows: evalRows.length, certified: nOut('certified'), rejected: nOut('rejected'),
  malformed: nOut('malformed'), declined: nOut('declined'), budget: nOut('budget-exhausted')
};
ev.decided = ev.certified + ev.rejected;
ev.claims = ev.decided + ev.malformed;            /* replies that actually carried a proposal */
if (ev.decided + ev.malformed + ev.declined + ev.budget !== ev.rows)
  die('the eval ledger holds an outcome this page does not classify');
if (!ev.claims) die('the eval board has no submitted claims — the intake denominator would be empty');

/* 3 · NEEDS DATA — the kissing ledger */
const kiss = J('certs/kissing-ledger.json');
const kRows = kiss.rows || kiss.ledger || kiss.entries || [];
const kTally = {};
for (const r of kRows) { const v = r.verdict || r.status; kTally[v] = (kTally[v] || 0) + 1; }
const kNeeds = kTally['NEEDS DATA'] || 0;
if (!kRows.length) die('the kissing ledger is empty');

/* 4 · scope limits — the six-claim audit */
const ai = J('certs/ai-claims-summary.json');
if (!ai.verdicts || !ai.verdicts.length) die('the ai-claims summary carries no lanes');
const aiPartial = ai.verdicts.filter((v) => v.verdict === 'PARTIAL').length;
const aiScoped = ai.verdicts.filter((v) => v.scope).length;

/* 5 · OPEN, recorded — the sublevel campaign's attempted degree */
const sub = J('certs/sublevel-tao179.json');
const subFailed = Object.entries(sub.theorems || {}).filter(([, t]) => t.failed);
if (!Object.keys(sub.theorems || {}).length) die('the sublevel record carries no theorems');

/* 6 · OPEN, running — the lambda(6) campaign */
const lam = J('certs/lambda56-campaign.json');
const l6work = ((lam.stages || {})['lambda6-generic'] || {}).worklist || [];
const l6closed = Object.keys(lam.stages || {}).filter((n) => n.startsWith('lambda6-family:') && lam.stages[n].status === 'CLOSED').length;
if (!l6work.length) die('the lambda(6) worklist is empty');

/* 7 · UNDECIDED cells — the two regime maps */
const mapOf = (p) => {
  const m = J(p), cells = m.cells || [];
  const t = {};
  for (const c of cells) { const v = c.verdict || c.v || c.regime; t[v] = (t[v] || 0) + 1; }
  return { cells: cells.length, undecided: t.UNDECIDED || 0, tally: t };
};
const map2p = mapOf('certs/mfg2p-regime-map.json');
const map1 = mapOf('certs/mfg-regime-map.json');
if (!map2p.cells || !map1.cells) die('a regime map carries no cells');

/* ---- the rows, each with its own denominator ------------------------------- */
const ROWS = [
  { kind: 'REFUSED', what: 'The instrument examined the object and declined to decide it — a containment that would not close, a singular preconditioner, a budget spent inside the certifier.',
    where: 'the engine loop (' + loopWhere.join(', ') + ')', count: loop.refused, denom: loop.decided,
    denomWhat: 'objects certified this build', record: 'ledger.json' },
  { kind: 'REFUSED', what: 'A submitted claim carried no parseable proposal, so there was nothing to decide. The grader returns a reason, never a guess.',
    where: 'the matmul eval board', count: ev.malformed, denom: ev.claims,
    denomWhat: 'claims submitted', record: 'certs/matmul-eval-ledger.jsonl' },
  { kind: 'NEEDS DATA', what: 'The claim is decidable and the claimant has published no bytes to decide it on. This measures the claim-maker, not the instrument.',
    where: 'the kissing ledger, dimension 11', count: kNeeds, denom: kRows.length,
    denomWhat: 'ledger rows', record: 'certs/kissing-ledger.json' },
  { kind: 'OPEN', what: 'Attempted, budget exhausted, and RECORDED as attempted rather than dropped — the degree that did not close in the branch-and-bound.',
    where: 'the Erdős #1038 supremum campaign', count: subFailed.length, denom: Object.keys(sub.theorems).length,
    denomWhat: 'degrees attempted', record: 'certs/sublevel-tao179.json' },
  { kind: 'OPEN', what: 'A campaign that is not finished, published as unfinished: nine of ten exception families closed, the tenth still computing.',
    where: 'the λ(6) campaign', count: l6work.length - l6closed, denom: l6work.length,
    denomWhat: 'families in the worklist', record: 'certs/lambda56-campaign.json' },
  { kind: 'UNDECIDED', what: 'A cell of an exhaustive sweep whose box did not close either way at the budget. The sweep publishes the map with the holes drawn in.',
    where: 'the two-population regime map', count: map2p.undecided, denom: map2p.cells,
    denomWhat: 'cells swept', record: 'certs/mfg2p-regime-map.json' },
  { kind: 'UNDECIDED', what: 'The same, on the one-population map.',
    where: 'the MFG regime map', count: map1.undecided, denom: map1.cells,
    denomWhat: 'cells swept', record: 'certs/mfg-regime-map.json' },
  { kind: 'SCOPE', what: 'An audit that reached part of a claim and says exactly which part — the computational fragment, one parameter value, the supporting identities. Every lane carries one.',
    where: 'the six-claim AI audit', count: aiScoped, denom: ai.verdicts.length,
    denomWhat: 'lanes audited', record: 'certs/ai-claims-summary.json' }
];
for (const r of ROWS) {
  if (!r.denom) die('row "' + r.where + '" has no denominator — a refusal count without one is a slogan');
  if (r.count > r.denom) die('row "' + r.where + '" counts more refusals than its denominator');
}
const KINDS = [...new Set(ROWS.map((r) => r.kind))];

/* ---- the page ------------------------------------------------------------- */
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · the third verdict',
  title: 'What the machine would not decide',
  deck: 'A verifier that only ever passes or fails is a scorer. The third verdict — this instrument cannot decide, '
    + 'and here is why — is the one a motivated party would never build, so it is the one worth counting. Here is '
    + 'every refusal on record, by kind, each with the denominator it belongs to.'
}));

B.push(C.scope('KINDS ARE NEVER MERGED on this page. REFUSED (our instrument declined) is not NEEDS DATA (the '
  + 'claimant published nothing to decide on) is not OPEN (a budget ran out, and the attempt is recorded) is not '
  + 'UNDECIDED (a swept cell that did not close) is not a scope limit (an audit that reached a fragment and says '
  + 'which). There is deliberately no total: one big number would be a bigger number and a smaller fact. Every '
  + 'count below is read from its record at this page\'s own build.'));

B.push(C.tldr({
  findingRaw: 'On submitted claims, the grader\'s refusal rate is <b>' + pct(ev.malformed, ev.claims) + '</b> ('
    + num(ev.malformed) + ' of ' + num(ev.claims) + ' claims carried nothing parseable to decide). Inside the '
    + 'generation loop it is <b>' + num(loop.refused) + ' of ' + num(loop.decided) + '</b> — a different rate for '
    + 'a different thing, and the two are never added. The largest refusal population in the lab is neither: it is '
    + '<b>' + num(map2p.undecided + map1.undecided) + ' swept cells</b> that did not close.',
  mechanismRaw: 'Every instrument here returns one of three things and never converts between them. A refusal is '
    + 'terminal: it is not retried at lower rigour, not downgraded to a probability, and not quietly dropped from '
    + 'the record. Absence of proof is never evidence of absence — the sentence that costs the most and is worth '
    + 'the most.',
  checkRaw: C.m('node tools/build-report-refusals.js') + ' rebuilds this page from the records; every number is '
    + 'read from the file named in its row, and the build refuses a row that cannot name its own denominator.'
}));

B.push(C.stats([
  { k: 'refusal rate, submitted claims', v: pct(ev.malformed, ev.claims), n: num(ev.malformed) + ' of ' + num(ev.claims) + ' claims on the matmul eval board carried no parseable proposal. ' + num(ev.decided) + ' were decided: ' + num(ev.certified) + ' certified, ' + num(ev.rejected) + ' refuted.' },
  { k: 'refusals in the loop', v: num(loop.refused) + ' / ' + num(loop.decided), n: 'The generation loop\'s own rate, across ' + loop.families + ' families. Narrow by construction — the loop only meets objects it enumerated itself.' },
  { k: 'undecided cells', v: num(map2p.undecided + map1.undecided), n: 'Of ' + num(map2p.cells + map1.cells) + ' cells across the two regime maps. Published as holes in the map rather than filled in by interpolation.' },
  { k: 'kinds, never merged', v: String(KINDS.length), n: KINDS.join(' · ') + '. Each carries its own denominator; the page has no total on purpose.' }
]));

{
  const rows = ROWS.map((r) => [
    { raw: C.tag(r.kind, r.kind === 'REFUSED' ? 'open' : (r.kind === 'NEEDS DATA' ? 'dep' : (r.kind === 'SCOPE' ? 'held' : 'dep'))) },
    { raw: C.esc(r.where) },
    { raw: C.m(num(r.count) + ' / ' + num(r.denom)) },
    { raw: C.esc(r.denomWhat) },
    { raw: C.m(r.record) }
  ]);
  B.push(C.section({
    lab: '§1 · the ledger', title: 'Every refusal on record, by kind', wide: true,
    bodyRaw: [
      C.table({
        cols: [{ h: 'kind' }, { h: 'where' }, { h: 'count', cls: 'v' }, { h: 'out of' }, { h: 'record', cls: 'v' }],
        rows
      }),
      '<div class="col">' + C.pRaw('Reading down the kind column is the point. These are five different '
        + 'behaviours that a single "refusals" counter would flatten into one: an instrument declining, a claimant '
        + 'publishing nothing, a budget running out, a sweep cell staying open, and an audit stating its reach. '
        + 'Only the first is a statement about the instrument.') + '</div>'
    ].join('\n')
  }));
}

B.push(C.section({
  lab: '§2 · intake', title: 'The refusal rate on claims other people submitted',
  bodyRaw: [
    C.pRaw('The matmul eval board takes proposed exact rank-R decompositions from frontier models and decides each '
      + 'one in exact rational arithmetic. Of ' + num(ev.rows) + ' real-model replies on record: ' + num(ev.decided)
      + ' were decided (' + num(ev.certified) + ' CERTIFIED, ' + num(ev.rejected) + ' REFUTED with the violated '
      + 'equation printed), and ' + num(ev.malformed) + ' were REFUSED because the reply carried no parseable '
      + 'proposal. That is a refusal rate of ' + pct(ev.malformed, ev.claims) + ' on ' + num(ev.claims)
      + ' submitted claims.'),
    C.pRaw('Two other outcomes sit in the same ledger and are NOT counted in that rate, because they are not our '
      + 'refusals: ' + num(ev.declined) + ' replies in which the MODEL declined — it argued the target was '
      + 'impossible, which for the rank-6 ⟨2,2,2⟩ rung is correct and is Winograd\'s theorem — and '
      + num(ev.budget) + ' replies cut off by OUR OWN output cap, a harness artifact that says nothing about '
      + 'either party. Folding either of those into a refusal rate would inflate it with someone else\'s '
      + 'behaviour, or with our own plumbing.'),
    C.note({ lab: 'why the denominator is stated every time', bodyRaw: C.pRaw('A refusal rate with no denominator '
      + 'is unfalsifiable, and a refusal count with the wrong denominator is worse than none. Every row on this '
      + 'page names the population it is a fraction of, and the build refuses a row that cannot.') })
  ].join('\n')
}));

{
  const rows = ai.verdicts.map((v) => [
    { raw: C.esc(v.short) }, { raw: C.tag(v.verdict, v.verdict === 'PARTIAL' ? 'open' : 'held') },
    { raw: C.esc(v.scope || '—') },
    /* String(null) is the four-character word 'null', and it reached two cells
       of a published table. An absent count is an em dash. */
    { raw: v.namedChecks == null ? '—' : C.m(String(v.namedChecks)) }
  ]);
  B.push(C.section({
    lab: '§3 · scope', title: 'The audits, and exactly how far each one reached', wide: true,
    bodyRaw: [
      '<div class="col">' + C.pRaw('The sharpest refusal in the lab is not a verdict at all — it is the sentence '
        + 'that says which part of a claim was checked. All ' + ai.verdicts.length + ' lanes of the six-claim AI '
        + 'audit carry one, and ' + aiPartial + ' of them ends at PARTIAL. A reader who takes "CONFIRMED" off '
        + 'this table without its scope column has been told something the record does not say.') + '</div>',
      C.table({ cols: [{ h: 'claim' }, { h: 'verdict' }, { h: 'what was actually checked' }, { h: 'named checks', cls: 'v' }], rows })
    ].join('\n')
  }));
}

B.push(C.section({
  lab: '§4 · at scale', title: 'Refusal as a map, not a footnote',
  bodyRaw: [
    C.pRaw('The two mean-field regime maps sweep ' + num(map2p.cells + map1.cells) + ' parameter cells and decide '
      + 'each one by an exhaustive box argument. ' + num(map2p.undecided + map1.undecided) + ' of them — '
      + pct(map2p.undecided + map1.undecided, map2p.cells + map1.cells) + ' — did not close at the budget, and '
      + 'they are drawn on the atlas as holes rather than filled in. A map with no holes drawn is a map that '
      + 'interpolated somewhere, and the reader cannot tell where.'),
    C.pRaw('The same discipline applies to whole campaigns. The Erdős #1038 supremum ladder closed six degrees '
      + 'and RECORDS the one it attempted and could not finish' + (subFailed.length ? ' (' + subFailed.map(([k, t]) => C.m(k) + ' — ' + C.esc(t.failed)).join(', ') + ')' : '')
      + '; the λ(6) campaign has ' + l6closed + ' of its ' + l6work.length + ' families closed and publishes the '
      + 'remainder as unfinished rather than waiting for a clean number. An attempted-and-failed row is worth more '
      + 'than a silent gap: it tells the next person where the budget actually broke.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§5 · the rule', title: 'What a refusal is not',
  bodyRaw: [
    C.plainList([
      { b: 'Not a failure.', text: 'The instrument behaved correctly. A refusal is the honest output of a decision '
        + 'procedure that met an object outside its reach, and it is recorded with the reason.' },
      { b: 'Not a soft verdict.', text: 'A refusal is never retried at lower rigour and never converted into a '
        + 'probability, a confidence, or a "likely". There is no path in this lab from REFUSED to CERTIFIED that '
        + 'does not go through a new exact argument.' },
      { b: 'Not evidence.', text: 'Absence of proof is never evidence of absence. That a claim could not be '
        + 'decided here says nothing about whether it is true.' },
      { b: 'Not deletable.', text: 'A refusal that vanishes between builds is the failure mode this page exists to '
        + 'prevent: every count above is recomputed from a named record, so a refusal can only disappear by the '
        + 'record changing.' },
      { b: 'Not a total.', text: 'The kinds are not commensurable and are never summed. If you want one number '
        + 'from this page, take the refusal rate on submitted claims — ' + pct(ev.malformed, ev.claims) + ' — and '
        + 'carry its denominator with it.' }
    ])
  ].join('\n')
}));

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-refusals.js — every count recomputed from the records named in the table. Rebuild: node tools/build-report-refusals.js') + '</p>'
  + '<p>' + C.esc('git ' + gitrev) + '</p>'
  + '<p style="margin-top:20px;color:var(--ink-2)">' + C.esc('Carlos Toledo · cert-machine') + '</p>'
  + '</footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'refusals.html'),
  TPL.render({
    title: 'What the machine would not decide · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
    desc: 'Every refusal cert-machine has on record, by kind, each with its own denominator: the grader\'s refusal '
      + 'rate on submitted claims, the generation loop\'s own refusals, NEEDS DATA where a claimant published no '
      + 'bytes, campaigns recorded as unfinished, and the undecided cells of two exhaustive sweeps. No total — the '
      + 'kinds are not commensurable.',
    path: '/reports/refusals.html'
  }));
console.log('reports/refusals.html written: ' + ROWS.length + ' rows across ' + KINDS.length + ' kinds · intake refusal rate '
  + pct(ev.malformed, ev.claims) + ' (' + ev.malformed + '/' + ev.claims + ') @ git ' + gitrev);
