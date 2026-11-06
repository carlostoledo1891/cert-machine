#!/usr/bin/env node
/* build.js — site/z-in-q/index.html: the claim that ℤ is Diophantine in ℚ (Elliot Glazer with AI agents, 2026-11-05),
   told once for a reader who arrives from a post: what was claimed, what this machine decided about it (Track A, four
   lanes and the H2 attempt), what it does not settle, and Track B (the Lean gap) as decided here. The shape of
   reports/eth-chain.html: the story in one minute, the gaps FIRST among the substantive sections, then each lane with
   its record, then how to check it. Built unlisted (2026-11-06 ~03:30 UTC), listed the same day after the report to the
   claimant was filed.

   EVERY NUMBER AND EVERY VERDICT WORD IS READ HERE from the five Track A records — certs/zq-recount.json (lane 1),
   zq-tower.json (lane 2), zq-h2.json (the H2 attempt), zq-finite.json (lane 3), zq-lean-replay.json (lane 4) — and the
   page refuses to build when a record's word is not the one it states, when the records no longer chain (each later
   record carries the content sha256 of the one it builds on), when a record pins another commit of the claimant's
   repository than the others, when one no longer says first that the theorem is undecided, or when the code a record
   names has changed since it was written. The records themselves are re-derived by their own --check (make test, the
   control build); those need the claimant's clone, which a page build must not, so this file reads the records only.

   TRACK B is read from cert-machine's decision, certs/zq-trackb.json (claimbox's proposal decided on a pod by
   tools/runpod-zq-trackb.sh): every verdict, hypothesis name and number of that section comes from the record; the
   one-line reading of each hypothesis is this page's own words, checked against the record's list of names. Nothing is
   read from claimbox itself (CLAUDE.md, the claimbox relationship).

   The claimant's repository has no licence: nothing of his is copied here; the page quotes the statement only.

   usage: node apps/z-in-q/build.js           (make site runs it; make page R=apps/z-in-q for the edit loop)       MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));
const OUT = path.join(ROOT, 'site', 'z-in-q');
const die = (m) => { console.error('Z-IN-Q PAGE REFUSED: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const J = (rel) => { if (!fs.existsSync(path.join(ROOT, rel))) die('a record the page reads is gone: ' + rel); return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); };
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const esc = C.esc;
const m = (s) => '<span class="m">' + esc(s) + '</span>';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + esc(rel) + '</span></a>';
const recDir = (rel) => '<a href="' + C.escAttr(GH.replace('/blob/', '/tree/') + rel) + '"><span class="m">' + esc(rel) + '/</span></a>';
const tag = (v) => C.tag(v);
const said = (v) => '<b>' + esc(v) + '</b>';   /* a verdict word in a sentence: the record's word, bold; the chip is for the tables */
const N = (x) => BigInt(String(x)).toLocaleString('en-US');

/* ---- the records ------------------------------------------------------------------------------------------------- */
const R = { recount: 'certs/zq-recount.json', tower: 'certs/zq-tower.json', h2: 'certs/zq-h2.json', finite: 'certs/zq-finite.json', lean: 'certs/zq-lean-replay.json' };
const PREREG = 'notes/zq-preregistration-2026-11-06.md', GAPMAP = 'corpus/zq/gap-map.json';
const RB = 'certs/zq-trackb.json', PREREG_B = 'notes/zq-trackb-preregistration-2026-11-06.md';
const L1 = J(R.recount), L2 = J(R.tower), H2 = J(R.h2), L3 = J(R.finite), L4 = J(R.lean);
const ALL = { 'lane 1': L1, 'lane 2': L2, 'the H2 attempt': H2, 'lane 3': L3, 'lane 4': L4 };
const FILE = { 'lane 1': R.recount, 'lane 2': R.tower, 'the H2 attempt': R.h2, 'lane 3': R.finite, 'lane 4': R.lean };
if (!fs.existsSync(path.join(ROOT, PREREG))) die('the pre-registration is gone: ' + PREREG);
const GM = J(GAPMAP);
function PIN_EARLY() { return L1.pins.commit; }
const TB = J(RB);
/* Version 3 (2026-11-06): the repository moved on; the comparison of the decided files at the pin and at the head */
const V3 = J('corpus/zq/version3-tree-check.json');
if (V3.pin !== PIN_EARLY()) die('the Version 3 comparison starts from another pin than the records');
if (V3.removed.length || V3.unchanged + V3.changed.length !== V3.files || V3.changed.some((f) => !/README\.md$/.test(f))) die('the Version 3 comparison found a changed or removed file beyond a README: the page must say what no longer applies');
if (V3.frozenTarget.blobPin !== V3.frozenTarget.blobHead) die('the frozen Lean target changed at the head');
if (!fs.existsSync(path.join(ROOT, PREREG_B))) die('the Track B pre-registration is gone: ' + PREREG_B);

/* the words this page states, each read back from its record */
const SAYS = { 'lane 1': 'CERTIFIED', 'lane 2': 'CERTIFIED', 'the H2 attempt': 'REFUSED', 'lane 3': 'MIXED', 'lane 4': 'CERTIFIED' };
for (const [k, r] of Object.entries(ALL)) if (r.verdict !== SAYS[k]) die(k + ' is ' + r.verdict + ' in ' + FILE[k] + ', and this page states it ' + SAYS[k]);

/* one claim, one pin, the theorem undecided first */
const PIN = L1.pins.commit, REPO = L1.pins.repository;
if (!/^[0-9a-f]{40}$/.test(PIN) || REPO !== 'github.com/elliotglazer/diophantine-z-q') die('lane 1 does not pin the claimant\'s repository at a commit');
for (const [k, r] of Object.entries(ALL)) {
  if (r.pins.commit !== PIN || r.pins.repository !== REPO) die(k + ' pins ' + r.pins.repository + ' at ' + r.pins.commit + ', not the commit the others pin');
  if (!/^The theorem \(Z is Diophantine in Q\) is undecided here/.test(r.undecided)) die(k + ' no longer says first that the theorem is undecided here');
  if (r.preregistration.indexOf(PREREG) !== 0) die(k + ' names another pre-registration: ' + r.preregistration);
  for (const [rel, want] of Object.entries(r.code)) {
    if (!fs.existsSync(path.join(ROOT, rel))) die(k + ': the code it names is gone: ' + rel);
    if (sha(fs.readFileSync(path.join(ROOT, rel))) !== want) die(k + ': ' + rel + ' has changed since the record was written (re-run its --check)');
  }
}
if (GM.pins.commit !== PIN) die('the gap map was read at another commit than the records pin');
if (!/^The theorem \(Z is Diophantine in Q\) is undecided here/.test(GM.undecided)) die('the gap map no longer says first that the theorem is undecided here');
/* the chain: each later record carries the sha256 of the record it builds on, its date nulled */
const strip = (x) => sha(JSON.stringify(Object.assign({}, x, { generated: null })));
if (L2.lane1.contentSha256 !== strip(L1) || L2.lane1.verdict !== L1.verdict) die('lane 2 was computed from another lane 1 record');
if (H2.lane2.contentSha256 !== strip(L2) || H2.lane2.verdict !== L2.verdict) die('the H2 attempt was computed from another lane 2 record');
if (L3.lane1.contentSha256 !== strip(L1) || L3.lane1.verdict !== L1.verdict) die('lane 3 was computed from another lane 1 record');

/* lane 1: the count, two ways; the height; the bounds file; the red controls */
const n1 = L1.numbers;
if (n1.ambientVariables !== L1.claim.ambientVariables || n1.ambientViaMultiplicities !== n1.ambientVariables) die('lane 1: the two derivations or the claim disagree on the ambient count');
if (BigInt(n1.ambientVariables) !== BigInt(n1.witnesses) + 1n) die('lane 1: the ambient count is not one more than the witnesses');
if (!(n1.rootHeight <= L1.claim.rootHeightBound)) die('lane 1: the root height exceeds the claimed bound');
if (L1.structuralProblems.length || !L1.declaredVersusDerived.agree || !L1.boundsFile.agree || !L1.boundsFile.rows.every((r) => r.agree)) die('lane 1: a structural problem or a disagreement with the bounds file');
if (!L1.redControls.length || !L1.redControls.every((c) => c.passed && !c.blindSpot)) die('lane 1: a red control did not come out as predicted');
const AMB = N(n1.ambientVariables), WIT = N(n1.witnesses);

/* lane 2: two conditional conclusions, the unconditional REFUSED, the premises named */
const PREM = ['H1', 'H2', 'M', 'L1'];
if (Object.keys(L2.premises).join() !== PREM.join()) die('lane 2 names other premises than H1, H2, M, L1');
const [cDeg, cCoef, cBare] = L2.conclusions;
for (const c of [cDeg, cCoef]) if (c.verdict !== 'CERTIFIED' || c.conditionalOn.join() !== PREM.join()) die('lane 2: "' + c.claim + '" is not CERTIFIED conditional on H1, H2, M, L1');
if (!/2↑↑7/.test(cDeg.claim) || !/2↑↑8/.test(cCoef.claim)) die('lane 2: the conclusions are not the two tower bounds');
if (cBare.verdict !== 'REFUSED' || cBare.conditionalOn.length) die('lane 2: the unconditional bounds are not REFUSED');
if (!L2.rows.every((r) => r.verdict === 'CERTIFIED')) die('lane 2: a step of the chain is not CERTIFIED');
if (!L2.redControls.every((c) => c.passed)) die('lane 2: a red control did not come out as predicted');
if (L2.premises.L1.indexOf('root height ' + n1.rootHeight + ', CERTIFIED by certs/zq-recount.json') !== 0) die('lane 2\'s premise L1 is not lane 1\'s certified height');
const mg = /^Under the premises, log2 log2 log2 of the degree bound is at most (\d+) \(the claim needs < (\d+);/.exec(L2.margin);
if (!mg || !(Number(mg[1]) < Number(mg[2]))) die('lane 2: the margin is not stated as it was');
const E6 = L2.rows.find((r) => r.id === 'E6');
if (!E6 || !E6.numbers.phiWBits) die('lane 2: row E6 (φ(W)) is gone');

/* the H2 attempt: H2 REFUSED as not a computation, its ingredients all CERTIFIED, lane 2 left conditional */
if (H2.h2.verdict !== 'REFUSED' || !/no computation decides it/.test(H2.h2.reason)) die('H2 is not REFUSED as not a computation');
if (H2.h2.reason.indexOf('22·φ(W) primes with φ(W) a ' + E6.numbers.phiWBits + '-bit number') < 0) die('the H2 record no longer sizes the catalogue as lane 2\'s row E6 does');
if (!H2.ingredients.length || !H2.ingredients.every((f) => f.verdict === 'CERTIFIED')) die('an ingredient of H2 is not CERTIFIED');
const F5 = H2.ingredients.find((f) => f.id === 'F5');
const f5 = F5 && /^at all (\d+) places above the (\d+) odd primes p ≤ (\d+):/.exec(F5.statement);
if (!f5 || Number(f5[1]) !== F5.numbers.places) die('H2\'s F5 no longer counts its places as it did');
if (H2.lane2Reading.asItStands.indexOf('unchanged: CERTIFIED conditional on H1, H2, M, L1') !== 0) die('the H2 record no longer leaves lane 2 conditional on H2');
const HC = H2.redControls, blind = HC.filter((c) => c.blindSpot), after = HC.filter((c) => c.addedAfterRun);
if (blind.length !== 1 || after.length !== 1 || !after[0].passed) die('the H2 red controls are not one blind spot and one sharper control added after the run');

/* lane 3: the statements CERTIFIED on our cases; the replay of theirs CERTIFIED for six contact and REFUSED for three */
const S = L3.summary;
const REPLAY = { 'integer compiler': 'REFUSED', 'division polynomials': 'REFUSED', 'finite polynomial expressions': 'REFUSED', 'six contact': 'CERTIFIED' };
if (S.length !== 4 || S.some((s) => REPLAY[s.suite] !== s.replay)) die('lane 3: a suite\'s replay word is not the one this page states');
if (S.some((s) => s.statements !== 'CERTIFIED')) die('lane 3: a suite\'s statements are not CERTIFIED');
for (const s of S) {
  const full = L3.suites.find((x) => x.suite === s.suite);
  if (!full || full.replay.verdict !== s.replay || full.statements.verdict !== s.statements || full.redControls.length !== s.redControls || !full.redControls.every((c) => c.passed)) die('lane 3: the suite ' + s.suite + ' does not agree with its summary');
}
const CASES = S.reduce((a, s) => a + s.casesOurs, 0), RC3 = S.reduce((a, s) => a + s.redControls, 0);
if (L3.verdictScope.indexOf(N(CASES) + ' cases') < 0) die('lane 3: the case count in its scope is not the sum of its suites');

/* lane 4: the build, the audit, the replays, the census, the frozen target, the plants */
const row = (id) => { const r = L4.rows.find((x) => x.id === id) || L4.recorded.find((x) => x.id === id); if (!r) die('lane 4 has no row ' + id); return r; };
for (const id of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13']) if (row(id).verdict !== 'CERTIFIED') die('lane 4: row ' + id + ' is not CERTIFIED');
if (row('R14').verdict !== 'REFUSED') die('lane 4: the nanoda row is not REFUSED as a tool row');
const MODS = row('R5').numbers.modules, DECL = row('R6').numbers.declarations, THEIRS = row('R7').numbers.theirs, EXTRA = row('R7').numbers.extra;
if (MODS !== row('R2').numbers.modules || DECL !== THEIRS + EXTRA || row('R7').numbers.theirsNotOurs.length) die('lane 4: the module or declaration counts do not reconcile');
if (row('R6').numbers.axiomsInClosure.slice().sort().join() !== 'Classical.choice,Quot.sound,propext') die('lane 4: the axioms are not the three standard ones');
const NAN = row('R18').numbers.byOutcome;
if (NAN.accepted + row('R18').numbers.notAccepted.length !== MODS) die('lane 4: nanoda\'s per-module outcomes do not cover the modules');
if (row('R9').numbers.sorryWarnings !== 1) die('lane 4: the frozen target does not elaborate with exactly one sorry');
const vc = L4.validationComparison.find((x) => x.field === 'main_theorem_proved');
if (!vc || vc.theirs !== false || vc.ours !== false) die('lane 4: the main theorem is recorded as proved');
if (!L4.redControls.length || !L4.redControls.every((c) => c.passed)) die('lane 4: a planted variant was not caught');
const ONE = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (k) => ONE[k] || String(k);
const Word = (k) => { const w = word(k); return w.charAt(0).toUpperCase() + w.slice(1); };
/* Track B: the decision's words, its pins, its hypotheses, its kernels and controls */
const SAYS_B = { T8: 'CERTIFIED', T9: 'CERTIFIED', G: 'CERTIFIED', Gmeaning: 'CERTIFIED' };
const claimB = (id) => { const c = TB.claims.find((x) => x.id === id); if (!c) die('Track B has no claim ' + id); if (c.verdict !== SAYS_B[id]) die('Track B: ' + id + ' is ' + c.verdict + ' in ' + RB + ', and this page states it ' + SAYS_B[id]); return c; };
const T8B = claimB('T8'), T9B = claimB('T9'), GB = claimB('G'), GMB = claimB('Gmeaning');
if (!/^The theorem \(Z is Diophantine in Q\) is undecided here/.test(TB.undecided)) die('Track B no longer says first that the theorem is undecided here');
if (TB.pins.glazer.commit !== PIN || TB.pins.glazer.repository !== REPO) die('Track B pins another commit of the claimant\'s repository');
if (TB.preregistration.indexOf(PREREG_B) !== 0) die('Track B names another pre-registration: ' + TB.preregistration);
for (const [rel, want] of Object.entries(TB.code)) {
  if (!fs.existsSync(path.join(ROOT, rel))) die('Track B: the code it names is gone: ' + rel);
  if (sha(fs.readFileSync(path.join(ROOT, rel))) !== want) die('Track B: ' + rel + ' has changed since the record was written (re-run its --check)');
}
const rowB = (id) => { const r = TB.rows.find((x) => x.id === id); if (!r) die('Track B has no row ' + id); return r; };
for (const id of ['B1', 'B2', 'B3', 'B3m', 'B4', 'B5', 'B6a8', 'B6a9', 'B6aG', 'B6b', 'B6c', 'B6d', 'B7a', 'B7b', 'B7c']) if (rowB(id).verdict !== 'CERTIFIED') die('Track B: row ' + id + ' is not CERTIFIED');
/* the eight, in the order T8 binds them; the page's own one-line reading of each, keyed by name */
const HYP = {
  'CondZQ.HypM': ['M', 'a polynomial of bounded size whose rational zeros are exactly the code triples of multiplication, (ι(a), ι(b), ι(ab))', 'premise M, the multiplication section'],
  'CondZQ.HypH': ['H', 'the height bound h(u) ≤ H₆·M(u)²⁴ for every rational u outside the six contact points', 'the height theorem (thm:height)'],
  'CondZQ.HypPC': ['PC', 'every rational B of the stated local shape is a value at which his pole polynomial has a rational zero', 'the pole hypothesis (hyp:PC)'],
  'CondZQ.HypC': ['C', 'a polynomial of bounded size that defines the precision machine’s closeness relation exactly', 'premise C, the compiler section'],
  'CondZQ.HypLT': ['LT', 'a polynomial of bounded size carrying the six local tests, sound and complete', 'lem:test and lem:test-complete'],
  'CondZQ.HypCC': ['CC', 'for every n outside the contact points and every κ ≠ 0, the precision machine accepts some run', 'eq:close-complete'],
  'CondZQ.HypH1': ['H1', 'the explicit bound on primes in arithmetic progressions, as the cutoff proof applies it', 'proof of prop:cutoff (Bennett–Martin–O’Bryant–Rechnitzer)'],
  'CondZQ.HypH2': ['H2', 'a formal multiple of P₀ of index at most N_s^10 with the required divisibility, the same H2 as lane 2’s', 'proof of prop:cutoff (Silverman)'],
};
const DOM8 = rowB('B6a8').numbers.domains;
if (JSON.stringify(DOM8) !== JSON.stringify(Object.keys(HYP))) die('Track B: T8 binds other hypotheses, or in another order, than this page reads: ' + JSON.stringify(DOM8));
const SCREENED = Object.keys(rowB('B6c').numbers.hypotheses).sort();
if (JSON.stringify(SCREENED) !== JSON.stringify(['CondZQ.HypG', ...Object.keys(HYP)].sort())) die('Track B: the screened hypotheses are not G and the eight');
if (rowB('B6a9').numbers.domains[0] !== 'CondZQ.HypG') die('Track B: T9 does not bind G first');
if (TB.redControls.map((c) => c.id).join() !== 'C1,C2,C3,Q1,Q2,Q3,Q4' || !TB.redControls.every((c) => c.passed)) die('Track B: the seven controls the page names are not all there and caught');
const DECLB = rowB('B4').numbers.declarations, FRESHMIN = Math.round(rowB('B7c').numbers.wallSeconds / 60);
const MAN = Object.fromEntries(Object.entries(rowB('B6d').numbers.manuscript).map(([k, v]) => [k, v.replace(/-/g, '−').replace(/\+/g, ' + ').replace(/(\d)−/g, '$1 − ')]));
if (!rowB('B6d').numbers.rationals.every((x) => x.equal)) die('Track B: a rational of the point or the curve differs from the manuscript');
const SECOND = TB.rows.filter((r) => /^B8/.test(r.id));
const SECOND_OK = SECOND.filter((r) => r.verdict === 'CERTIFIED');
if (!SECOND.every((r) => r.verdict === 'CERTIFIED' || (r.verdict === 'REFUSED' && r.numbers.toolStop))) die('Track B: a second kernel stopped with something other than a resource limit');
if (TB.notes.some((n) => /^B8/.test(n))) die('Track B: a second kernel\'s stop is still to be read');

/* a formula as the records write it (M_0 ≤ N_s^10, P_*): escaped, then its subscripts and exponents set as sub/sup */
const math = (t) => esc(t).replace(/_([0-9a-z*])/g, '<sub>$1</sub>').replace(/\^([0-9]+)/g, '<sup>$1</sup>');
if (math(H2.h2.statement) !== 'M<sub>0</sub> ≤ N<sub>s</sub><sup>10</sup>') die('H2 is no longer the statement M_0 ≤ N_s^10');

/* ---- the page ---------------------------------------------------------------------------------------------------- */
/* the H1 in words: ℤ and ℚ are not in the house faces, and a fallback glyph at display size reads as a mistake; the
   eyebrow and the prose keep the claim's own notation */
const TITLE = 'Defining the integers in the rationals: the finite parts decided, the theorem not';
const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the claim that ℤ is Diophantine in ℚ',
  title: TITLE,
  deck: 'On 5 November 2026 Elliot Glazer, working with AI agents, claimed one polynomial with integer coefficients, in ' + AMB + ' variables, whose rational zeros pick out exactly the integers. '
    + 'If it is right, a conjecture of Mazur is false and Hilbert’s tenth problem over ℚ has a negative answer. Everything in the claim a machine can decide today was decided again here, '
    + 'with exact arithmetic and code that shares nothing with his. The theorem itself is undecided.'
}));

/* Version 3, dated: what moved and what still applies */
B.push(C.section({
  lab: 'since these checks', title: 'Version 3 appeared the same day', id: 'version-3',
  bodyRaw: C.pRaw('<b>What changed.</b> On 6 November the repository moved to Version 3, a new manuscript naming six people as its collaboration and a new, far smaller explicit polynomial (a quartic), with its own package of checks. Version 3 is not checked here yet.')
    + C.pRaw('<b>What still applies.</b> Everything below was decided on the 5 November release. Two parts of it are the same bytes in the current repository: the original large construction and the whole Lean formalization, ' + N(V3.unchanged) + ' of ' + N(V3.files) + ' files compared one by one, the one difference a README. So the Lean replay and Track B apply to the repository as it stands, and so does the bookkeeping of the original construction (' + rec('corpus/zq/version3-tree-check.json') + ').')
}));

/* the story in one minute: first person for the author, the AI help said in the same sentence */
B.push(C.section({
  lab: 'the story in one minute', title: 'What was claimed, and what I checked', id: 'story',
  bodyRaw: C.pRaw('<b>The claim.</b> Hilbert’s tenth problem asks for an algorithm that decides whether a polynomial equation with integer coefficients has a solution. Over the integers there is none (Matiyasevich, 1970); over the rationals the question is open. '
      + 'Glazer’s manuscript and repository, ' + m(REPO) + ', claim the step that would close it: a fixed polynomial whose rational solutions, read in their first coordinate, are exactly the integers. Then no algorithm can decide rational solvability either.')
    + C.pRaw('<b>What is in the repository.</b> The polynomial is not written out as a list of terms. It is saved as a recipe of templates that call one another, from which its size can be counted. '
      + 'The proof is a manuscript of arithmetic geometry resting on published theorems. In Lean, a program that checks proofs line by line, ' + MODS + ' helper modules are accepted, and the main statement is there, frozen, with its proof left as ' + m('sorry') + ': unproved.')
    + C.pRaw('<b>What I did.</b> With Claude agents, I wrote down, before any of my code ran on his data, what each check would decide and what would make it fail. Then I decided again, in four lanes and with code of my own, every part of the claim that is finite: '
      + 'the number of variables and the height of the expression; the tower bounds on the degree and the coefficients; his four finite test suites; and his ' + MODS + ' Lean modules, replayed in Lean’s kernel on a rented machine.')
    + C.pRaw('<b>What came out.</b> The bookkeeping holds. The polynomial has exactly ' + AMB + ' variables, counted two ways, and its expression height is ' + n1.rootHeight + ', as stated. '
      + 'The bounds on degree and coefficients follow by exact arithmetic, but only from four named premises; an attempt to remove one of them by computation was refused, because it is not a computation. '
      + 'The statements his suites test hold on ' + N(CASES) + ' cases of mine, and his Lean helpers check in the kernel with only the three standard axioms. '
      + 'Then the Lean gap: a proof of his frozen main statement from ' + word(DOM8.length) + ' named hypotheses, written with Claude agents in claimbox, checks in the kernel here, and one of his premises, that the point P₀ has infinite order, is now proved outright.')
    + C.pRaw('<b>What it means.</b> None of this decides the theorem. It decides what a machine can decide about the claim today and names what it cannot: the deep results the proof rests on, now ' + word(DOM8.length) + ' named Lean hypotheses instead of a ' + m('sorry') + '. '
      + 'The limits come first below, then each lane with its record.')
}));

/* the gaps first */
B.push(C.section({
  lab: 'what stays open', title: 'What this does not settle', id: 'open',
  bodyRaw: C.plainList([
    { b: 'The theorem is undecided here.', raw: 'The main Lean statement, ' + m('lean/Frozen/BoundedIntegerPolynomial.lean') + ', is unproved: its proof is ' + m('sorry') + ', and lane 4 found it elaborates with exactly ' + word(row('R9').numbers.sorryWarnings) + ' such ' + m('sorry') + '. '
      + 'Nothing on this page decides whether ℤ is Diophantine in ℚ, nor any consequence claimed for it (Mazur’s conjecture, Hilbert’s tenth problem over ℚ).' },
    { b: 'The tower bounds rest on four premises.', raw: 'Lane 2 decides the exact arithmetic from them to deg ' + math('P_*') + ' < 2↑↑7 and |c| < 2↑↑8, and nothing more. '
      + '<b>H1</b>, an explicit bound on primes in arithmetic progressions (Bennett, Martin, O’Bryant and Rechnitzer), as his proof applies it; <b>H2</b>, the inequality ' + math(H2.h2.statement) + ', from his reduction-order and formal-group argument (Silverman); '
      + '<b>M</b>, the degree and log-norm majorant at each expression height, a lemma of the manuscript, read and not decided; <b>L1</b>, the height ' + n1.rootHeight + ', certified by lane 1. '
      + 'Without H1 and H2 the arithmetic gives no upper bound at all, so the bounds with no premise are ' + said(cBare.verdict) + '.' },
    { b: 'H2 is not a computation.', raw: 'It is one inequality about fixed integers, so it is finite in principle, but deciding it directly needs every prime of his catalogue: 22·φ(W) of them, with φ(W) a ' + E6.numbers.phiWBits + '-bit number. '
      + 'His proof of it instead applies three theorems at all of those places at once. Its ' + word(H2.ingredients.length) + ' finite ingredients are certified; the theorems are not, so H2 is ' + said(H2.h2.verdict) + ' and lane 2 stays conditional on it.' },
    { b: 'Lane 3 could replay his cases for one suite of four.', raw: 'His suites come with counts, but their cases are not in his prose: no ranges for the integer compiler’s digit, bit and packed cases (and its “backend” cases are not defined), '
      + 'no evaluation points for the division-polynomial graphs, which his code generates, and only sha256 hashes for the expression suite, with no stated serialization. '
      + 'Recovering them would mean reading his checker code, which a clean-room lane does not do, so those three replays are ' + said(S.find((x) => x.suite === 'integer compiler').replay) + '. '
      + 'The statements each suite tests were decided on cases of mine instead; a count of mine that equals his is never presented as a reproduction of his set. The six-contact suite’s reported values were replayed, exactly.' },
    { b: 'The Lean helpers check; what they mean is not checked here.', raw: 'The ' + MODS + ' modules check in the kernel, but whether their statements are the ones the manuscript needs is not decided. '
      + 'One second kernel, nanoda, could not finish the full export (a big-integer overflow, a limit of the tool), so the replay rests on ' + m('leanchecker --fresh') + '; nanoda accepted ' + NAN.accepted + ' of the ' + MODS + ' modules one by one.' },
    { b: 'The Lean statement now rests on ' + word(DOM8.length) + ' hypotheses.', raw: 'Track B decides that his frozen statement follows in Lean from ' + word(DOM8.length) + ' named hypotheses (below). None of them is proved here. If any is false, the Lean theorem says nothing. '
      + 'Whether each Lean hypothesis says what the manuscript’s premise says is my reading, not a decision; a screen only checked that none of them contains his statement itself. Their joint consistency is not decided either.' },
    { b: 'Some rules came after a first look.', text: 'Every lane was pre-registered before any of my code ran on his data, and every later rule is dated in the pre-registration: lane 4’s rule for four constructors’ axiom sets was written after a first pass and before the recorded one, '
      + 'its per-module nanoda run during the recorded pass, and its recorder’s census fix after it. One red control of the H2 tool was blind for a structural reason, so a sharper one was added after the run. Lane 2’s red controls came after the pre-registration: a check of the tool, not a pre-registered test. '
      + 'In Track B, the rule for comparing the generator statement with mine (equal up to the names Lean gives its hidden helper proofs) was written after a first pass and before the recorded one.' },
    { b: 'One author on both sides.', text: 'The checks of Track A, the proof of Track B and its decision were all written by me with Claude agents. claimbox proposes and cert-machine decides; the two have one author, so this separates the roles, not the people. '
      + 'No one else has replayed these records yet; an outside replay would be the next step up.' }
  ])
}));

/* the four lanes, every number and word from its record; the verdict second, so a phone sees it before the table scrolls */
const SUITE_NAME = { 'integer compiler': 'the integer compiler', 'division polynomials': 'division polynomials over ℚ(√2)', 'finite polynomial expressions': 'finite polynomial expressions', 'six contact': 'the six-contact identities' };
const LANES = [
  ['1 · the count and the height', { raw: tag(L1.verdict) },
    { raw: 'The ambient variable count, ' + m(AMB) + ' = 1 + ' + m(WIT) + ' witnesses, derived twice from the structure of his saved definition (the largest slot used, and every object’s own slots times its invocations), the slots tiling exactly at every object. '
      + 'The root expression height ' + m(String(n1.rootHeight)) + ' ≤ ' + m(String(L1.claim.rootHeightBound)) + ' under the manuscript’s rules. His bounds file agrees on all ' + L1.boundsFile.rows.length + ' rows; ' + word(L1.redControls.length) + ' red controls, each seen.' },
    { raw: rec(R.recount) }],
  ['2 · the tower bounds', { raw: tag(cDeg.verdict) + '<br><span class="small">conditional on ' + PREM.join(', ') + '</span>' },
    { raw: 'deg ' + math('P_*') + ' < 2↑↑7 and every |coefficient| < 2↑↑8, by exact integer comparison over the constants of his saved definition with outward-rounded logarithms, from H1, H2, M and L1: '
      + L2.rows.length + ' steps of the manuscript’s chain, each certified. Under the premises, log₂ log₂ log₂ of the degree bound is at most ' + m(mg[1]) + '; the claim needs less than ' + m(N(mg[2])) + '.' },
    { raw: rec(R.tower) }],
  ['2 · with no premise', { raw: tag(cBare.verdict) },
    'The same two bounds, unconditionally: without H1 and H2 nothing bounds the catalogue or the formal multiple from above.',
    { raw: rec(R.tower) }],
  ['H2 · removing a premise', { raw: tag(H2.h2.verdict) + '<br><span class="small">its ingredients ' + tag(H2.ingredients[0].verdict) + '</span>' },
    { raw: math(H2.h2.statement) + ', refused as not a computation. Its ' + word(H2.ingredients.length) + ' finite ingredients, all certified: ' + math('P_0') + ' on the curve, the places of bad reduction, '
      + 'the exact reduction orders of ' + math('P_0') + ' at all ' + f5[1] + ' places above the ' + f5[2] + ' odd primes up to ' + f5[3] + ', the dyadic valuations and the exponent bookkeeping. Lane 2 stays conditional on H2.' },
    { raw: rec(R.h2) }],
  ['3 · the finite suites', { raw: tag(L3.verdict) },
    { raw: 'His four suites re-derived clean-room from his prose and data, his checker code not read: the statements on ' + m(N(CASES)) + ' cases of mine, with ' + RC3 + ' red controls; his own case sets replayed for one suite and refused for three (below).' },
    { raw: rec(R.finite) }],
  ['4 · the Lean replay', { raw: tag(L4.verdict) },
    { raw: 'The ' + MODS + ' accepted helper modules build and re-elaborate with kernel checking on. ' + m(N(DECL)) + ' declarations, his ' + N(THEIRS) + ' and ' + N(EXTRA) + ' private theorems, reach only propext, Quot.sound and Classical.choice, by two independent traversals. '
      + m('leanchecker') + ', ' + m('leanchecker-paranoid') + ' and ' + m('leanchecker --fresh') + ' accept; nanoda accepts ' + NAN.accepted + ' of ' + MODS + ' modules. The frozen statement elaborates with exactly ' + word(row('R9').numbers.sorryWarnings) + ' ' + m('sorry') + ', and Mathlib’s hyperoperation 4 2 k = 2↑↑k is kernel-checked. '
      + Word(L4.redControls.length) + ' planted wrong variants, each caught.' },
    { raw: rec(R.lean) }],
  ['B · the Lean gap', { raw: tag(T8B.verdict) + '<br><span class="small">conditional on ' + word(DOM8.length) + ' hypotheses</span>' },
    { raw: 'His frozen statement, his file unchanged, follows in Lean from the ' + word(DOM8.length) + ' named hypotheses ' + Object.values(HYP).map((h) => h[0]).join(', ') + ': the kernel accepts the proof three ways, and the statement is checked against his file twice. Details below.' },
    { raw: rec(RB) }],
  ['B · P₀ has infinite order', { raw: tag(GB.verdict) },
    { raw: 'The first half of his generator proposition, proved in Lean (claimbox’s 2-adic proof), with the point and the curve the manuscript’s own, number for number.' },
    { raw: rec(RB) }]
];
B.push(C.section({
  lab: 'the four lanes and track b', title: 'What was decided, lane by lane', id: 'lanes', wide: true,
  bodyRaw: C.table({ cols: [{ h: 'lane' }, { h: 'verdict' }, { h: 'what it decides' }, { h: 'record' }], rows: LANES })
    + C.table({ cols: [{ h: 'lane 3 · suite' }, { h: 'its statements, on my cases' }, { h: 'his own cases, replayed' }, { h: 'my cases' }, { h: 'red controls' }],
      rows: S.map((s) => [SUITE_NAME[s.suite], { raw: tag(s.statements) }, { raw: tag(s.replay) }, N(s.casesOurs), String(s.redControls)]) })
    + '<div class="col">' + C.pRaw('<b>CERTIFIED</b>: decided by exact arithmetic or by the kernel, as pre-registered. <b>REFUSED</b>: not decidable from these bytes, with the reason written in the record. <b>MIXED</b>: within one lane, some parts certified and some refused, each named. '
      + 'A conditional certification names its premises, and decides none of them.') + '</div>'
}));

/* Track B, from cert-machine's decision */
const SECOND_TEXT = SECOND_OK.length
  ? 'Of the second, independent checkers, ' + SECOND_OK.map((r) => r.statement.split(' ')[0]).join(', ') + ' also accept it.'
  : 'Every second, independent checker stopped on a resource limit before reaching a verdict (nanoda on a big-integer overflow, as in lane 4; con-ron and con-leche as Lean ships them on their computation budget; both of their master branches on a stack overflow, also on a 128 GB machine), so the kernel replay rests on Lean’s own checker, as lane 4’s does. '
    + 'On the planted variants nanoda did reach a verdict, and refused each for its planted reason.';
const NDR = TB.redControls.filter((c) => ['C2', 'C3', 'Q3'].includes(c.id)).map((c) => c.outcome.nanoda && c.outcome.nanoda.reason);
if (!/sorryAx/.test(NDR[0] || '') || !/planted_zinq_axiom/.test(NDR[1] || '') || !/def_eq/.test(NDR[2] || '')) die('Track B: nanoda no longer refuses the planted variants for their planted reasons');
B.push(C.section({
  lab: 'track b', title: 'The Lean gap: his statement from ' + word(DOM8.length) + ' named hypotheses', id: 'track-b',
  bodyRaw: C.pRaw('<b>The question.</b> Lane 4 shows that his Lean helpers check and that the main statement is still ' + m('sorry') + '. Track B asks a narrower question than the theorem: can that frozen statement, his file unchanged, be proved in Lean from named hypotheses, so that what stays open is a list of stated results instead of a ' + m('sorry') + '?')
    + C.pRaw('<b>The proof.</b> <a href="../claimbox/">claimbox</a>, the claimant of this machine’s Lean proposals, proved it: from ' + word(DOM8.length) + ' hypotheses, each a deep result or a premise of the manuscript entering unproved, his frozen statement follows. Claude agents wrote it there; claimbox and this page have one author.')
    + C.pRaw('<b>What was decided here.</b> ' + said(T8B.verdict) + ', as pre-registered. Lean’s kernel accepts the proof three ways, the last replaying every constant it rests on, core and Mathlib included, into an empty environment (' + FRESHMIN + ' minutes). '
      + 'My audit finds only the three standard axioms in all ' + N(DECLB) + ' of claimbox’s declarations. The statement is his, checked twice: a Lean module of mine states it by taking the type of his frozen theorem from his file, and is proved by claimbox’s theorem; and a syntactic check finds exactly the ' + word(DOM8.length) + ' hypotheses followed by his statement. '
      + Word(TB.redControls.length) + ' planted wrong variants, a changed conclusion, an extra hypothesis, a circular one, a ' + m('sorry') + ', a new axiom, a proof that skipped the kernel and a changed byte, were each caught. ' + SECOND_TEXT)
    + C.pRaw('<b>One premise is now proved.</b> That his point P₀ = (' + esc(MAN.P0x) + ', ' + esc(MAN.P0y) + ') has infinite order on y² = x³ − d²x with d = ' + esc(MAN.d) + ', over ℚ(s) with s² = 2: the first half of his generator proposition. '
      + 'claimbox proves it at the prime 2, the way the manuscript argues elsewhere; the kernel accepts it, ' + said(GB.verdict) + ', and the point and the curve in the Lean statement are the manuscript’s, number for number (' + said(GMB.verdict) + ').')
    + C.pRaw('<b>The ' + word(DOM8.length) + ' hypotheses</b>, in the order the theorem takes them, each in my reading, with where the manuscript has it:')
    + C.plainList(DOM8.map((n) => ({ b: HYP[n][0] + '.', raw: math(HYP[n][1]) + ' (' + esc(HYP[n][2]) + ').' })))
    + C.pRaw('<b>What it does not mean.</b> It does not prove that ℤ is Diophantine in ℚ: the theorem now rests on these ' + word(DOM8.length) + ', as lane 2’s bounds rest on theirs. If any of them is false, the Lean theorem says nothing. '
      + 'The readings above are mine, not decisions; the record keeps each hypothesis as Lean prints it. The plan this answers is this repository’s gap map, ' + rec(GAPMAP) + ', which named seven of them; building the proof found two more inputs (LT and CC) and proved one (G).')
}));

/* how to re-run */
B.push(C.section({
  lab: 'check it yourself', title: 'How to check this yourself', id: 'rerun',
  bodyRaw: C.plainList([
    { b: 'Get his repository at the pin.', raw: m('git clone https://' + REPO) + ', then ' + m('git -C diophantine-z-q checkout ' + PIN) + '. Point ' + m('ZQ_REPO') + ' at the clone (the default is ' + m('~/Projects/zq-scout/diophantine-z-q') + ').' },
    { b: 'Re-derive the records.', raw: 'In a clone of <a href="https://github.com/carlostoledo1891/cert-machine">cert-machine</a>, run ' + [L1, L2, H2, L3, L4].map((r) => m('node ' + Object.keys(r.code)[0] + ' --check')).join(', ')
      + '. Each checks the sha256 of every file of his it reads against the pin before reading it, derives its record again and refuses on any difference. They need Node and its standard library, and his clone at the pinned commit.' },
    { b: 'The Lean replay.', raw: 'It ran on a rented machine with ' + rec('tools/runpod-zq-lane4.sh') + '; the facts of the run are in ' + recDir(L4.run.facts) + '. The recorder’s ' + m('--check') + ' derives again from your clone what can be derived on a laptop (the census, the re-hash, the reconciliation with his ' + N(THEIRS) + ' declarations) and refuses if a script that ran on that machine has changed since.' },
    { b: 'The Lean gap.', raw: 'claimbox’s proof is public on its branch ' + m(TB.pins.claimbox.branch) + '. It was decided on a rented machine with ' + rec('tools/runpod-zq-trackb.sh') + ', the facts in ' + recDir(TB.run.facts) + '; ' + m('node tools/record-zq-trackb.js --check') + ' derives the record again from those facts and the manuscript’s numbers, and refuses if a script that ran there has changed since. Its pre-registration: ' + rec(PREREG_B) + '.' },
    { b: 'Nothing of his is copied here.', text: 'His repository has no licence (its README: licences for original project material are awaiting the maintainer’s selection), so no file of it is in this repository or on this site. Every tool reads his files from your clone; the page quotes his statement only.' },
    { b: 'Read the pre-registration.', raw: rec(PREREG) + ': what each lane would decide and what would make it fail, written before any code ran on his data, with its dated amendments.' }
  ])
}));

const foot = '<p>Generated by apps/z-in-q/build.js from the records ' + Object.values(R).concat([RB]).map(rec).join(', ') + ', the pre-registrations ' + rec(PREREG) + ' and ' + rec(PREREG_B) + ' and the gap map ' + rec(GAPMAP)
  + '. The claim and its repository are Elliot Glazer’s; Track A and the decision of Track B by Carlos Toledo with Claude agents, decided by cert-machine; Track B’s proof written with Claude agents in claimbox; built with Claude (Anthropic).</p>';
let html = TPL.render({
  title: TITLE + ' · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot, lang: 'en',
  desc: 'Elliot Glazer’s AI-assisted claim that ℤ is Diophantine in ℚ, decided where a machine can decide it: the variable count and height of his polynomial, its tower bounds under four named premises, his finite suites, his Lean helper modules, and his frozen Lean statement from eight named hypotheses. The theorem itself is undecided here.',
  path: '/z-in-q/', og: { image: '/og-z-in-q.png', alt: OG.alt('z-in-q') }
});
/* listed 2026-11-06 on the operator's word, after the report to the claimant (github.com/elliotglazer/diophantine-z-q/issues/3):
   in the sitemap and the audits hub (tools/build-site.js); the sync's prune list keeps it */
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('site/z-in-q/index.html written: ' + Object.entries(ALL).map(([k, r]) => k + ' ' + r.verdict).join(', ') + '; Track B ' + TB.claims.map((c) => c.id + ' ' + c.verdict).join(', '));
