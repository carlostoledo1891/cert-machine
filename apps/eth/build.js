#!/usr/bin/env node
/* build.js — site/eth/index.html: the two claimed refutations of the Exponential Time Hypothesis (OpenAI, openai/math
   family 378; Anthropic, anthropics/formal-math eth/), as far as this repository has checked them: DECIDED (both
   proofs, by two kernels, against each claim's own statement), READ (what each statement says, by two readers who did
   not see each other's work), COMPARED (side by side) and OPEN. Unlisted (noindex, in no index or sitemap) from 2026-10-28 until the
   operator had read it; LISTED on the operator's word 2026-10-29 (the sitemap, the landing, /reports/).

   EVERY NUMBER IS READ HERE from a record: certs/eth-kernel.json (tools/record-eth-kernel.js), the two readings in
   corpus/eth-refutation/readings/, and certs/eth-bridge.json once the Lean bridge has run. Every sentence that reports
   a reading is checked against the reading's bytes: a quoted phrase that is not in the file refuses the build. The
   one computed check on the page, the eight-square identity (Anthropic's eq. (12)), is re-run here in exact integer
   arithmetic, written from the printed formula; a count other than 0 (printed) and 256 (the control) refuses.

   usage: node apps/eth/build.js                                                                                   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OUT = path.join(ROOT, 'site', 'eth');

const fail = (why) => { console.error('apps/eth/build.js: REFUSED — ' + why); process.exit(1); };
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const git = cp.execSync('git rev-parse --short=8 HEAD', { cwd: ROOT }).toString().trim();
const fmt = (n) => Number(n).toLocaleString('en-US');
const REPO = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
/* a long unbroken token (an environment string, a path) gets break opportunities, or it widens a phone's page */
const brk = (raw) => raw.replace(/\S{24,}/g, (t) => t.replace(/([:=\/,_.])/g, '$1<wbr>'));
const ln = (rel, text) => '<a href="' + REPO + rel + '">' + (text || C.esc(rel)) + '</a>';

/* ---- the records ---- */
const K = J('certs/eth-kernel.json');
const row = (claim) => K.rows.find((r) => r.claim === claim) || fail('certs/eth-kernel.json has no row for ' + claim);
const OAI = row('openai'), ANT = row('anthropic');
const STD = ['propext', 'Classical.choice', 'Quot.sound'];
for (const r of [OAI, ANT]) {
  if (r.word !== 'CERTIFIED') fail('the page says both proofs check; ' + r.claim + ' is ' + r.word);
  if (r.kernels.length !== 2) fail('the page says two kernels accept ' + r.claim + '; the record names ' + r.kernels.length);
  for (const a of r.axiomsPrinted) if (a.axioms.some((x) => !STD.includes(x))) fail(a.theorem + ' uses an axiom outside the three standard ones');
}
const BRIDGE_REL = 'certs/eth-bridge.json';
const BR = fs.existsSync(path.join(ROOT, BRIDGE_REL)) ? J(BRIDGE_REL) : null;
/* the bridge counts as done only when the run was green and both bridge theorems are PROVED on the standard axioms */
const bridgeDone = !!BR && BR.run.conclusion === 'success'
  && ['openai', 'anthropic'].every((k) => BR.bridges[k].theorem.word === 'PROVED' && BR.bridges[k].theorem.axioms.every((a) => STD.includes(a)));
if (BR && !bridgeDone) fail(BRIDGE_REL + ' is present but its run is not green or a bridge theorem is not PROVED on the standard axioms');
/* a third party's join of the two models (TSavo/eth-bridge), replayed here; its gaps lead, as every audit here does */
/* leanchecker --fresh per claim (the third replay): REPLAYED or NOT RUN, read from certs/eth-kernel.json */
const FRESH = Object.fromEntries([OAI, ANT].map((r) => [r.claim, r.leanchecker && r.leanchecker.word === 'REPLAYED' ? r.leanchecker : null]));
const freshDone = Object.keys(FRESH).filter((k) => FRESH[k]), freshOpen = Object.keys(FRESH).filter((k) => !FRESH[k]);
const LAB = { openai: 'OpenAI’s', anthropic: 'Anthropic’s' };
const freshWords = () => freshDone.length
  ? freshDone.map((k) => LAB[k] + ' proof replayed by ' + C.m('leanchecker --fresh') + ' into an empty environment (exit 0, ' + fmt(FRESH[k].seconds) + ' s)').join('; ')
    + (freshOpen.length ? '; ' + freshOpen.map((k) => LAB[k]).join(' and ') + ' not yet, waiting for a large enough rented machine' : '')
  : C.m('leanchecker --fresh') + ' not run on either claim';
const SEAM_REL = 'certs/eth-seam.json';
const SEAM = fs.existsSync(path.join(ROOT, SEAM_REL)) ? J(SEAM_REL) : null;
const SEAMH = SEAM ? SEAM.headline : null;
if (SEAM && !(SEAMH.statementTerm && typeof SEAMH.statementTerm.kernelEqual === 'boolean' && SEAMH.vocabulary && Array.isArray(SEAMH.vocabulary.namedDiffering))) fail('certs/eth-seam.json lacks the fields the page reads');
const TS_REL = 'certs/eth-tsavo-bridge.json';
/* a second third-party join, the other way round (thinkthoughts/math, Daniel Hawkley), replayed 2026-11-03; its gaps lead */
const HK_REL = 'certs/eth-hawkley-bridge.json', HKH_REL = 'certs/eth-hawkley-heavy.json';
const HK = fs.existsSync(path.join(ROOT, HK_REL)) ? J(HK_REL) : null;
const HKH = fs.existsSync(path.join(ROOT, HKH_REL)) ? J(HKH_REL) : null;
if (HK && HK.word === 'CERTIFIED' && !HK.axiomsPrinted.every((a) => a.axioms.every((x) => STD.includes(x)))) fail(HK_REL + ' is CERTIFIED with an axiom outside the three standard ones');
const TS = fs.existsSync(path.join(ROOT, TS_REL)) ? J(TS_REL) : null;
if (TS && TS.word === 'CERTIFIED' && !TS.axiomsPrinted.every((a) => a.axioms.every((x) => STD.includes(x)))) fail(TS_REL + ' is CERTIFIED with an axiom outside the three standard ones');
const thm = (proj, short) => BR.projects[proj].theorems.find((t) => t.name.endsWith('.' + short)) || fail('the bridge record has no theorem ' + short);
const bridgeThms = bridgeDone ? new Set(['openai', 'anthropic'].flatMap((k) => BR.projects[k].theorems.map((t) => t.name))).size : 0;
/* the bridge's kernels, per theorem (2026-10-29: lake build, Lean's kernel in Comparator, nanoda); the page says "three checks"
   only when every theorem carries all three */
const KALL = ['lean-build', 'lean-comparator', 'nanoda'];
const bridgeAll3 = bridgeDone && ['openai', 'anthropic'].every((k) => BR.projects[k].theorems.every((t) => Array.isArray(t.kernels) && KALL.every((x) => t.kernels.includes(x))));
const SH = bridgeDone && BR.sharpBridges ? BR.sharpBridges : null;
if (SH) for (const k of ['openai', 'anthropic']) { const t = SH[k] && SH[k].theorem; if (!t || t.word !== 'PROVED' || t.axioms.some((x) => !STD.includes(x))) fail('the #ETH bridge for ' + k + ' is not PROVED on the three standard axioms'); }
const sharpLimit = SH ? (BR.notProved.find((n) => /^Anthropic’s #ETH|^Anthropic's #ETH/.test(n)) || fail('the record no longer states the limit of Anthropic’s #ETH')) : null;

/* a reading is quoted only from its own bytes: whitespace is collapsed on both sides, nothing else is forgiven */
const READ = { first: 'corpus/eth-refutation/readings/first.md', second: 'corpus/eth-refutation/readings/second.md' };
const flat = (s) => s.replace(/\s+/g, ' ');
const RTEXT = Object.fromEntries(Object.entries(READ).map(([k, rel]) => [k, flat(fs.readFileSync(path.join(ROOT, rel), 'utf8'))]));
const said = (which, phrase) => { if (!RTEXT[which].includes(flat(phrase))) fail('the ' + which + ' reading does not say: ' + phrase); return phrase; };

/* ---- the one computed check: Anthropic's eq. (12), the eight-square identity, at all 8⁴ settings ----
   2[x = v][y = u] = [x⊕y⊕u⊕v = 0]·(σ(x,y)σ(v,u) + σ(x,u)σ(v,y)), σ(p,q) = (−1)^φ(p,q),
   φ = Σ_{i≤j} p_i q_j + q₁p₂p₃ + p₁q₂p₃ + p₁p₂q₃ (ANT-P p. 9). The control uses i < j and must fail. */
function eightSquare(rel) {
  const bits = (i) => [i & 1, (i >> 1) & 1, (i >> 2) & 1];
  const sig = (p, q) => {
    let s = q[0] * p[1] * p[2] + p[0] * q[1] * p[2] + p[0] * p[1] * q[2];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (rel(a, b)) s += p[a] * q[b];
    return s % 2 ? -1 : 1;
  };
  let bad = 0, n = 0;
  for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) {
    const [X, Y, U, V] = [x, y, u, v].map(bits);
    const lhs = 2 * (x === v) * (y === u), par = (x ^ y ^ u ^ v) === 0 ? 1 : 0;
    if (lhs !== par * (sig(X, Y) * sig(V, U) + sig(X, U) * sig(V, Y))) bad++;
    n++;
  }
  return { bad, n };
}
const E12 = eightSquare((a, b) => a <= b), E12c = eightSquare((a, b) => a < b);
if (E12.n !== 4096 || E12.bad !== 0 || E12c.bad !== 256) fail('the eight-square check gave ' + E12.bad + ' and ' + E12c.bad + ' of ' + E12.n);
said('first', 'found that (12) holds at all 4,096 settings with φ as printed');
said('first', 'The control with k < k′ fails at 256 of them');

/* ---- the page ---- */
const B = [];
/* D10 (2026-10-29): a printed number read through its address (playground/warrant.js W.val) and re-read from the built page */
const KPATH = 'certs/eth-kernel.json';
const secs = (r) => W.val({ rec: { path: KPATH, ptr: '/rows[claim=' + r.claim + ']/steps/comparator/seconds' }, standing: W.COMPUTED, fmt: 'int', why: 'a wall-clock time on the rented machine: measured, not decided' }) + ' s';
B.push(C.header({
  eyebrow: 'Carlos Toledo · cert-machine · audit',
  title: 'Two claimed refutations of the Exponential Time Hypothesis: what was decided, and what was only read',
  deck: 'OpenAI and Anthropic each published a Lean proof meant to show that ETH is false. Here both proofs were '
    + 'replayed from their pinned bytes, and two kernels accepted each one against its own statement. A kernel cannot '
    + 'say what a statement means. Whether each statement says “ETH is false” was read by two independent readers, '
    + 'and the page keeps the two kinds of check apart.'
}));
/* THE PAGE IN FIVE PLAIN LINES (2026-10-29, on an outside reading: "I had to read §5 to understand the summary"): what was
   replayed, by what, what the bridge proves, what stays prose, and what one more day closes; then the disclosure, which
   sat in §6. Every line is read from the records below it. */
const C2DONE = (() => { const f = path.join(ROOT, 'certs', 'eth-c2.json'); if (!fs.existsSync(f)) return false;
  const r = JSON.parse(fs.readFileSync(f, 'utf8')); return r.verdict === 'CERTIFIED' && r.fails.length === 0 && Object.values(r.planted).every((x) => x.refused); })();
const FIVE = [
  { b: 'Replayed.', raw: 'Both labs’ Lean proofs, from their pinned bytes: OpenAI’s ' + C.m('SubexponentialSAT') + ' challenge at ' + C.m(OAI.commit.slice(0, 8)) + ' and Anthropic’s ' + C.m('eth/') + ' at ' + C.m(ANT.commit.slice(0, 8))
    + (TS && TS.word === 'CERTIFIED' ? ', and a third party’s Lean join of the two' + (SEAM ? ', whose copy of OpenAI’s statement is the same Lean term as OpenAI’s own' + (SEAMH.statementTerm.kernelEqual ? '' : ' (it is not)') + ' but rests on real-number arithmetic that differs between the two Mathlib versions it spans (§5)' : '') + '.' : '.') },
  { b: 'Checked by.', raw: 'Comparator, the Lean FRO’s judge, with Lean’s own kernel, and nanoda, a kernel written independently of Lean’s. Both accept both proofs, using only ' + STD.map(C.m).join(', ') + '.' },
  { b: 'The bridge proves.', raw: bridgeDone ? 'One textbook ETH, written once in Lean, and a Lean proof that each lab’s statement refutes it in that lab’s own machine model. Both statements count the satisfying assignments, so the counting hypothesis #ETH falls with it in each model' + (SH ? ', also proved in Lean (Anthropic’s on the formulas its theorem speaks of)' : ' (read here; its Lean proof is running)') + '.' + (bridgeAll3 ? ' Every bridge theorem passes three checks: Lean’s kernel at build, Lean’s kernel again in Comparator, and nanoda.' : '') : 'Being built.' },
  C2DONE ? { b: 'Still read.', raw: 'The step from each lab’s machine to a standard one is now in Lean (§5b): Anthropic’s statement implies ETH is false on cslib’s multitape Turing machine with a binary encoding, and OpenAI’s implies Anthropic’s. Two things no kernel can check stay: that the Lean version seams the chain crosses change nothing, and that the multitape statement is the textbook ETH, which is a reading and always will be.' }
    : { b: 'Still prose.', raw: 'Two things no kernel can check: that each lab’s machine and input encoding match the textbook’s (a constant cost per step and a polynomial-time encoding, harmless in front of 2^{o(n)}), and that our Lean ETH is the textbook ETH, which is a reading and always will be.' },
  { b: freshOpen.length ? 'One more day.' : 'Also replayed.', raw: (freshOpen.length ? 'A third replay from a fresh environment: ' : 'A third replay from a fresh environment, for both: ') + freshWords() + '.' },
];
B.push('<section class="col eth-five">' + C.plainList(FIVE) + C.pRaw('<b>Disclosure.</b> This repository’s tools are written with Claude, Anthropic’s model, and one of the two claims is Anthropic’s. Here independence means who decides, not who typed: nothing on this page was decided by Claude or by either lab’s code. The deciders are Comparator, Lean’s kernel and nanoda; the readings are ours, and say so.') + '</section>');
B.push(C.stats([
  { k: '“ETH is false”', v: 'not decided here', n: 'read against the textbook ETH (§2), bridged in each lab’s own machine model (§5)' + (C2DONE ? '; the step to a standard machine decided in Lean (§5b), across version seams that are read' : '; the step between models is prose (§6)') },
  { k: 'proofs decided', vRaw: W.val({ rec: { path: KPATH, ptr: '/counts/decided' }, standing: W.DECIDED, fmt: 'int', why: 'the record\'s count of decided claims' }) + ' of ' + W.val({ rec: { path: KPATH, ptr: '/counts/of' }, standing: W.DECIDED, fmt: 'int', why: 'the record\'s count of claims' }), n: 'CERTIFIED, each against its own statement' },
  { k: 'kernels that accept each', v: String(OAI.kernels.length), n: 'Lean’s, inside Comparator, and nanoda' },
  { k: 'Comparator, OpenAI', vRaw: secs(OAI), n: 'peak ' + Math.round(OAI.steps.comparator.containerPeakKB / 1048576) + ' GiB in the container' },
  { k: 'Comparator, Anthropic', vRaw: secs(ANT), n: 'peak ' + Math.round(ANT.steps.comparator.containerPeakKB / 1048576) + ' GiB in the container' }
].concat(bridgeDone ? [{ k: 'bridge theorems, ours', v: String(bridgeThms), n: 'proved in Lean' + (bridgeAll3 ? '; each passes Lean’s kernel twice and nanoda' : ', one kernel') + '; §5' }] : [])));
/* the legend once, under the tiles that first draw the grammar (it used to print only in §5's not-yet-run branch, so the
   page drew decided and computed marks with no legend once the bridge landed; check-wiring found it 2026-10-29) */
B.push('<div class="col">' + W.legendHtml({ compact: true }) + '</div>');

/* §1 decided */
const claimRow = (r) => [
  { raw: '<a href="' + r.repository + '/tree/' + r.commit + '">' + C.esc(r.repository.replace('https://github.com/', '')) + '</a> @ ' + C.m(r.commit.slice(0, 8)) },
  r.toolchain.replace('leanprover/lean4:', 'Lean '),
  { raw: r.theorems.map((t) => C.m(t.split('.').slice(-1)[0])).join('<br>') },
  { raw: '<b>' + C.esc(r.word) + '</b>' },
  r.axiomsPrinted.every((a) => a.axioms.length === 3) ? 'the three standard' : 'see the record',
  r.config.enable_nanoda ? 'on, as shipped' : 'off as shipped; switched on here'
];
B.push(C.section({
  lab: '§1 · decided', title: 'Both proofs check against their own statements', wide: true, id: 'decided',
  bodyRaw: C.table({
    cols: [{ h: 'claim' }, { h: 'toolchain' }, { h: 'theorems' }, { h: 'verdict' }, { h: 'axioms' }, { h: 'nanoda' }],
    rows: [claimRow(OAI), claimRow(ANT)]
  }) + '<div class="col">'
    + C.pRaw('<b>What CERTIFIED means here.</b> ' + C.esc(K.words.CERTIFIED) + '. It does not mean that a Lean statement is its paper’s theorem, nor that ETH is false. No machine checks that, and both claimants say so.')
    + C.pRaw('<b>What was changed, and declared before the run.</b>')
    + C.plainList(K.declaredChanges.map((d) => ({ b: '', raw: brk(C.esc(d)) })))
    + C.pRaw('<b>The third replay.</b> ' + freshWords() + '. leanchecker re-checks every constant the solution module imports or declares, starting from an empty environment, with the claim’s own Lean (' + ln('certs/eth-kernel.json') + ', ' + ln('corpus/eth-refutation/POD.txt') + ').')
    + '</div>'
}));

/* §2 the premise chain from "the proofs check" to "ETH is false" */
const premises = [
  bridgeDone ? { grade: W.ASSUMED, label: 'Our Lean ETH says what Impagliazzo and Paturi say',
    worry: 'this is the one that carries content',
    evidence: 'read: s_k is the infimum of the δ for which k-SAT has an O(2^{δn}) algorithm, and ETH is s_k > 0 for every k ≥ 3, transcribed from CCC 1999, p. 1. A model fixes the machine, the formulas and the input word; the four definitions then read the same in every model (' + C.m('ETHBridge/Generic.lean') + ', byte-identical in both projects).' } : null,
  bridgeDone ? null : { grade: W.ASSUMED, label: 'OpenAI’s theorem implies that ETH is false',
    evidence: 'read, not run. OpenAI’s Lean file defines no ETH; both readers carried its bound to s₃ = 0 by hand ('
      + C.esc(said('first', 'Confidence ≈ 0.95')) + ' in the first reading, ' + C.esc(said('second', 'Confidence: high (≈0.9)')) + ' in the second). The Lean bridge, §5, is written to decide this step.' },
  bridgeDone ? null : { grade: W.ASSUMED, label: 'Anthropic’s ETHIsFalse is the textbook ETH’s negation',
    evidence: 'read. It is literally s₃ = 0, the infimum taken over Mathlib’s FinTM2 machines on its own input words; both readers found no loophole ('
      + C.esc(said('first', 'Confidence ≈ 0.95, on B1′ and B2′')) + '; ' + C.esc(said('second', 'Confidence: high (≈0.95)')) + ').' },
  { grade: W.ASSUMED, label: 'A machine step costs O(1) in the textbook’s model', worry: 'low',
    evidence: C2DONE ? 'no longer needed as a premise for Anthropic’s statement, and through Hawkley’s chain for OpenAI’s: C2 (§5b) proves in Lean that a FinTM2 decider within ⌊c·2^(δn)⌋ steps gives a cslib multitape decider within c·2^(δn)·(L+1)^e + c steps, the simulation’s overhead included. What stays read is that Lean version seams between the steps change nothing.' : 'textbook, in neither lab’s Lean: a PrimitiveMachine or FinTM2 step is a bounded number of tape or stack operations, so a word RAM or a multitape machine simulates it at constant cost per step. Both papers state it in prose.' },
  { grade: W.ASSUMED, label: 'A textbook 3-CNF becomes each input word in polynomial time', worry: 'low',
    evidence: C2DONE ? 'proved in Lean for Anthropic’s word by C2 (§5b): relabel the variables densely, remove duplicate clauses and write encClauses 3, in polynomial time, preserving satisfiability, from the binary encCNF of any formula.' : 'textbook, in neither lab’s Lean: deduplicate, sort, pad and write the word. A polynomial factor keeps 2^{o(n)} at 2^{o(n)}.' },
  { grade: W.ASSUMED, label: 'What the decision itself trusts', worry: 'low; a fault would have to fool two independent kernels the same way',
    evidence: brk(C.esc(K.trustBase)) + '. The sandbox ran best-effort: Landlock was unreadable inside the container.' }
].filter(Boolean);
B.push(C.section({
  lab: '§2 · what it rests on', title: 'From “the proofs check” to “ETH is false”', id: 'premises',
  bodyRaw: C.pRaw(bridgeDone
      ? 'The proofs are decided by two kernels, and the step from each statement to “ETH is false in that lab’s own model” is proved in Lean here (§5). What still stands between them and the sentence “ETH is false” is a premise, listed in the order the claim travels through it, each with where its checking stopped:'
      : 'The proofs are decided. Everything between them and the sentence “ETH is false” is a premise, listed in the order the claim travels through it, each with where its checking stopped:')
    + W.premisesHtml(premises.map((p) => Object.assign({}, p, { label: C.esc(p.label) + (p.worry ? ' <span class="eth-w">How much it should worry you: ' + C.esc(p.worry) + '.</span>' : '') })), {
      meetLine: bridgeDone
        ? 'Every premise is graded <b>assumed</b>, the grammar’s word for “no machine here checked it”, but they are not the same kind of risk. Only the first carries content: a formal definition of a definition is always a reading, and no proof can close it. The model and encoding steps put a polynomial factor in front of 2^{o(n)}, which changes nothing; the trust base was checked by two kernels. So this page decides that both proofs check, proves that each statement refutes ETH in its own lab’s model, and reads, without deciding, that ETH is false in the textbook’s model-free sense.'
        : 'The weakest premise is <b>assumed</b>. That the statements mean “ETH is false” was read, by two readers who found no loophole, and the model and encoding steps are textbook and in neither lab’s Lean. So this page decides that both proofs check, and reads, without deciding, that ETH is false.' })
}));

/* §3 read */
B.push(C.section({
  lab: '§3 · read', title: 'What each Lean statement says, in plain mathematics', id: 'read',
  bodyRaw: C.pRaw('<b>OpenAI</b> (' + C.m('exact_count_and_sat') + '). For every k ≥ 2 there is one machine of the file’s own design (a standard multitape Turing machine with a three-letter alphabet) and constants C, A, d, such that on every set F of clauses of width at most k over n variables, written in the file’s canonical unary encoding of length L, it halts after T ≤ C·(L+1)^d·2^{A·n(ln ln(n+16))²/√ln(n+16)} steps with the exact number of satisfying assignments on one tape and the answer “satisfiable” as its halting state, in polynomial space. Because clauses are sets, L is polynomial in n, so for k = 3 the time is 2^{o(n)}. ' + C.esc(said('first', 'It does not appear: OAI-C defines no ETH, no s₃ and no reduction.')) + (bridgeDone ? ' Our bridge supplies it (§5).' : '') + ' The exponent is the paper’s Proposition 6.4, weaker by a factor log log n than its headline Theorem 1.1, as OpenAI’s scope note says.')
    + C.pRaw('<b>Anthropic</b> (' + C.m('ETHIsFalse') + ', ' + C.m('MainTheorem') + '). ' + C.m('ETH') + ' is 0 < s₃, where s₃ is the infimum of the δ for which some finite machine of Mathlib’s FinTM2 kind and some c ∈ ℕ decide every duplicate-free 3-CNF list within ⌊c·2^{δn}⌋ steps, for every n and any number of clauses. ' + C.m('ETHIsFalse') + ' is its negation. The Main Theorem gives one machine and one constant C counting the satisfying assignments within ⌊2^{C·min(km/√lg m, k²n lg lg n/√lg n)}⌋ steps, for k ≥ 1, m ≥ 2, n ≥ 4 with every variable occurring.')
    + C.pRaw('<b>Both readers, separately:</b> each statement, if proved, implies the textbook ETH (Impagliazzo–Paturi) is false, under the two textbook steps of §2 and nothing else. Neither found a loophole: no padding (the input length is polynomial in n in both), no hidden power in either machine (finite control, finite alphabets, one bounded step at a time), exact halting times, and promises that only restrict where a bound is claimed.')
}));

/* §4 compared */
const cmp = [
  ['Lean bound', 'C(L+1)^d·2^{A·n(ln ln(n+16))²/√ln(n+16)}, constants per k', '⌊2^{C·min(km/√lg m, k²n lg lg n/√lg n)}⌋, one absolute C'],
  ['Lean bound against the paper’s', 'weaker: Proposition 6.4, not Theorem 1.1', 'the same, with ranges'],
  ['ETH in Lean', bridgeDone ? 'absent from OpenAI’s files (ours: §5)' : 'absent', 'defined, and its negation proved'],
  ['Machine in Lean', 'its own multitape machine on Mathlib’s tapes', 'Mathlib’s FinTM2 (multi-stack)'],
  ['Input in Lean', 'a set of sets of literals, canonical sorted unary word', 'a duplicate-free list, fixed-width binary slots'],
  ['Uniform in k', 'no: for each k a machine', 'yes: one machine for every k'],
  ['Space', 'proved polynomial', 'not stated'],
  ['nanoda in the shipped config', 'off', 'on']
];
/* each row is the first reading's Part III table, said in words; the cells that carry a verdict are checked against it */
said('first', 'Lean = paper\'s headline? | no: Lean is Prop. 6.4 (p. 43), weaker by log log n');
said('first', 'ETH in Lean | absent |');
said('first', 'Uniform in k | no (∀k ∃M) | yes (∃M ∀k)');
said('first', 'Space | proved polynomial (OAI-C:212–217) | not stated');
said('first', 'Comparator 2nd kernel | off (OAI-J:13) | on (ANT-J:14)');
B.push(C.section({
  lab: '§4 · compared', title: 'The two statements side by side', wide: true, id: 'compared',
  bodyRaw: C.table({ cols: [{ h: '' }, { h: 'OpenAI' }, { h: 'Anthropic' }], rows: cmp })
    + '<div class="col">' + C.pRaw('Both papers reach the same shapes, n log log n/√log n for any formula and n/√log n for linearly many clauses, and both get their sharpest bound by recursively contracting Boolean tensor networks (OpenAI’s Appendix D, Anthropic’s §2). The two Lean developments formalize different routes: OpenAI’s the interpolation route of its §6.4, Anthropic’s the eight-square recursion.')
    + C.pRaw('<b>One computed check.</b> Anthropic’s key identity, eq. (12), the eight-square identity of Degen (1818) and Graves (1843), re-run at this build from the printed formula in exact integer arithmetic: it holds at all ' + fmt(E12.n) + ' settings (' + E12.bad + ' failures). The control, the same formula with i < j in place of i ≤ j, fails at ' + fmt(E12c.bad) + ', so the check can fail. This decides one printed line of the paper. It decides nothing about the proof.')
    + '</div>'
}));

/* ---- THE TWO FIGURES OF §5 (2026-11-03): the map of the proofs, and the seam as a grid. Laid out by hand in SVG, every
   stroke and fill a token (design/battery.js F1); a decided edge is solid and a read link dashed (W.attrs), a statement
   carried into the other lab's environment is a hollow box; every word and count is read from its record at build
   time; each figure has a red control below it (a planted wrong word or count makes figMap / figSeam throw, and the
   build refuses). The seam's constants are named in words once, for the prose and the figure alike. */
const SEAM_WORD = { 'Monoid.toNPow': 'natural power', 'Real.instAdd': '+', 'Real.instMul': '×', 'Real.instLE': '≤', 'Real.instLT': '<', 'Real.instZero': '0', 'Real.instOne': '1', 'Real.instDivInvMonoid': 'inverse' };
const svgT = (x, y, s, cls, anchor) => '<text x="' + x + '" y="' + y + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + ' class="' + cls + '">' + C.esc(s) + '</text>';
const svgOpen = (w, h, alt) => '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + C.escAttr(alt) + '" class="eth-fig">';
const leanV = (tc) => tc.replace('leanprover/lean4:', 'Lean ');
const short = (s) => s.split('.').slice(-1)[0];
const CHECKS = [['C', 'Comparator'], ['K', 'Lean’s kernel'], ['N', 'nanoda'], ['L', 'leanchecker --fresh']];
const KACC = 'Lean default kernel accepts the solution', NACC = 'nanoda kernel accepts the solution';
const DECIDED_WORDS = ['CERTIFIED', 'PROVED'];
const ranWords = (ran) => CHECKS.filter(([k]) => ran[k]).map(([, w]) => w).join(', ');
/* the ticks of an edge: for each check the record says ran and accepted, one solid tick with its letter; nothing otherwise */
function ticks(x, y, ran, anchor) {
  const on = CHECKS.filter(([k]) => ran[k]);
  const x0 = anchor === 'end' ? x - 13 * on.length + 6 : anchor === 'middle' ? x - 6.5 * (on.length - 1) : x + 6;
  return on.map(([k], i) => '<line x1="' + (x0 + 13 * i) + '" y1="' + y + '" x2="' + (x0 + 13 * i) + '" y2="' + (y + 7) + '" class="w-decided" stroke-width="2"/>'
    + svgT(x0 + 13 * i, y + 19, k, 't-tk', 'middle')).join('');
}
const edgeLabel = (x, y, anchor, e) => svgT(x, y, e.word, 't-key', anchor) + ticks(x, y + 6, e.ran, anchor);
function node({ x, y, w, h = 40, lab, sub, read }) {
  const box = read ? W.attrs(W.COMPUTED, { width: 1.5 }) : 'class="w-decided" fill="var(--surface)" stroke-width="1.5"';
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" ' + box + '/>'
    + svgT(x + w / 2, y + 17, lab, 't-lab', 'middle') + (sub ? svgT(x + w / 2, y + 32, sub, 't-note', 'middle') : '');
}
const line = (x1, y1, x2, y2, read, arrow = true) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" '
  + W.attrs(read ? W.COMPUTED : W.DECIDED, { width: 2 }) + (arrow ? ' marker-end="url(#eth-' + (read ? 'arr-read' : 'arr') + ')"' : '') + '/>';

/* Figure A: the statements as nodes, every bridge as an edge, the two labs' environments either side of the seam */
function figMap(R) {
  const { oai, ant, br, sh, ts, hk, hkh, seam } = R;
  const bad = (why) => { throw new Error('the map of the proofs: ' + why); };
  const repo = (r) => r.repository.replace('https://github.com/', '').replace(/^anthropics\//, '') + ' @ ' + r.commit.slice(0, 8);
  const kernelEdge = (r) => ({ word: r.word, ran: { C: r.steps.comparator.exit === 0, K: r.kernels.includes(KACC), N: r.kernels.includes(NACC), L: !!(r.leanchecker && r.leanchecker.word === 'REPLAYED') } });
  const bridgeEdge = (t) => ({ word: t.word, ran: { C: t.kernels.includes('lean-comparator'), K: t.kernels.includes('lean-build') || t.kernels.includes('lean-comparator'), N: t.kernels.includes('nanoda'), L: false } });
  const cmpEdge = (rec, cmp) => ({ word: rec.word, ran: { C: !!cmp.okay, K: (cmp.kernels || []).includes(KACC), N: (cmp.kernels || []).includes(NACC), L: !!(rec.leanchecker && rec.leanchecker.word === 'REPLAYED') } });
  const heavyEdge = (h) => ({ word: h.word, ran: { C: false, K: !!h.facts.buildOk, N: !!h.facts.nanodaAccepts, L: h.facts.leanchecker === 'REPLAYED' } });
  /* a solid edge needs a decided word, and the word's own definition names the checks its ticks must carry */
  const need = (e, req, who) => {
    if (!DECIDED_WORDS.includes(e.word)) bad(who + ' is ' + e.word + ', and a solid edge needs a decided word');
    for (const k of req) if (!e.ran[k]) bad(who + ' is ' + e.word + ' but its record does not say ' + CHECKS.find(([c]) => c === k)[1] + ' accepted');
    return e;
  };
  const E = {
    oaiProof: need(kernelEdge(oai), ['C', 'K', 'N'], 'OpenAI’s proof'), antProof: need(kernelEdge(ant), ['C', 'K', 'N'], 'Anthropic’s proof'),
    oaiEth: need(bridgeEdge(br.bridges.openai.theorem), ['K'], 'the ETH bridge, OpenAI'), antEth: need(bridgeEdge(br.bridges.anthropic.theorem), ['K'], 'the ETH bridge, Anthropic'),
    oaiSharp: sh ? need(bridgeEdge(sh.openai.theorem), ['K'], 'the #ETH bridge, OpenAI') : null, antSharp: sh ? need(bridgeEdge(sh.anthropic.theorem), ['K'], 'the #ETH bridge, Anthropic') : null,
    tsavo: ts ? need(cmpEdge(ts, ts.comparator[ts.comparator.deciding]), ['C', 'K', 'N'], 'TSavo’s join') : null,
    hkLight: hk ? need(cmpEdge(hk, hk.comparator), ['C', 'K', 'N'], 'Hawkley’s light link') : null,
    hkHeavy: hkh ? need(heavyEdge(hkh), ['K', 'N'], 'Hawkley’s heavy link') : null
  };
  /* the sides: a join is drawn in the environment its record builds on; the seam is the two claims' own toolchains */
  if (oai.toolchain === ant.toolchain && oai.mathlib === ant.mathlib) bad('the two claims share a Lean and a Mathlib; there is no seam to draw');
  if (hk && hk.project.toolchain !== oai.toolchain) bad('Hawkley’s join is drawn on OpenAI’s side, but its record builds on ' + hk.project.toolchain);
  if (ts && ts.project.toolchain !== ant.toolchain) bad('TSavo’s join is drawn on Anthropic’s side, but its record builds on ' + ts.project.toolchain);
  if (seam && (seam.sides.openai.toolchain !== oai.toolchain || seam.sides.anthropic.toolchain !== ant.toolchain)) bad('the seam record’s two environments are not the two claims’');
  if (hk && !/\.not_positiveRateETH_implies_ethIsFalse$/.test(hk.claim.theorem)) bad('Hawkley’s light link is not ¬PositiveRateETH → ETHIsFalse: ' + hk.claim.theorem);
  if (hkh && hkh.claim.theorem !== 'OAI.Bridges.ETH.not_positiveRateETH') bad('Hawkley’s heavy link is not ¬PositiveRateETH: ' + hkh.claim.theorem);
  if (ts && !ts.claim.theorems.includes('Bridge.ethIsFalse_of_claim')) bad('TSavo’s join is not Claim → ETHIsFalse');
  /* a copied statement is drawn hollow only when its bytes are the pinned original's */
  if (ts && ts.statementChecks.openaiStatement.rebuilt !== ts.statementChecks.openaiStatement.pinned) bad('TSavo’s Claim does not rebuild to OpenAI’s pinned statement');
  if (hk && !Object.values(hk.statementChecks.mainResults.copies).every((s) => s === hk.statementChecks.mainResults.pinned)) bad('Hawkley’s vendored MainResults.lean is not Anthropic’s pinned bytes');
  const SO = short(oai.theorems[0]), SA = 'ETHIsFalse';
  const o = [];
  o.push('<defs><marker id="eth-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/></marker>'
    + '<marker id="eth-arr-read" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink-2)"/></marker></defs>');
  /* the environments and the seam (a guide: a boundary says nothing by itself; the words beside it do) */
  o.push(svgT(20, 24, 'OpenAI’s environment', 't-key'), svgT(20, 38, leanV(oai.toolchain) + ' · Mathlib ' + oai.mathlib.slice(0, 8), 't-note'));
  o.push(svgT(880, 24, 'Anthropic’s environment', 't-key', 'end'), svgT(880, 38, leanV(ant.toolchain) + ' · Mathlib ' + ant.mathlib.slice(0, 8), 't-note', 'end'));
  o.push('<line x1="450" y1="34" x2="450" y2="500" fill="none" stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="2 3"/>');
  o.push(svgT(450, 522, 'the version seam' + (seam ? ', measured ' + seam.verdict : '') + ' — a statement read across it is read, not decided', 't-note', 'middle'));
  o.push(svgT(20, 546, CHECKS.map(([k, w]) => k + ' ' + w).join(' · ') + ' — a tick only where the record says it accepted', 't-note'));
  /* the proofs and the statements */
  o.push(node({ x: 20, y: 44, w: 160, lab: 'OpenAI’s proof', sub: repo(oai) }), node({ x: 20, y: 150, w: 160, lab: SO, sub: 'OpenAI’s statement' }));
  o.push(line(100, 84, 100, 150), edgeLabel(108, 112, 'start', E.oaiProof));
  o.push(node({ x: 720, y: 44, w: 160, lab: 'Anthropic’s proof', sub: repo(ant) }), node({ x: 720, y: 150, w: 160, lab: SA, sub: 'Anthropic’s statement' }));
  o.push(line(800, 84, 800, 150), edgeLabel(808, 112, 'start', E.antProof));
  /* our bridge: the textbook ETH, and #ETH, each refuted in the lab's own model */
  o.push(node({ x: 15, y: 440, w: 120, lab: '¬ ETH', sub: 'OpenAI’s model' }), line(60, 190, 75, 440), edgeLabel(58, 300, 'end', E.oaiEth));
  o.push(node({ x: 605, y: 440, w: 125, lab: '¬ ETH', sub: 'Anthropic’s model' }), line(760, 190, 667, 440), edgeLabel(705, 300, 'end', E.antEth));
  if (sh) {
    o.push(node({ x: 150, y: 440, w: 120, lab: '¬ #ETH', sub: 'OpenAI’s model' }), line(140, 190, 210, 440), edgeLabel(183, 300, 'start', E.oaiSharp));
    o.push(node({ x: 755, y: 440, w: 125, lab: '¬ #ETH', sub: 'Anthropic’s model' }), line(840, 190, 817, 440), edgeLabel(838, 300, 'start', E.antSharp));
  }
  /* Hawkley, on OpenAI's side: the heavy link to ParityLifts' predicate, the light link to a vendored ETHIsFalse */
  if (hk) {
    o.push(node({ x: 275, y: 270, w: 170, lab: '¬PositiveRateETH', sub: 'ParityLifts, negated' }));
    if (hkh) o.push(line(165, 190, 320, 270), edgeLabel(262, 250, 'end', E.hkHeavy));
    o.push(node({ x: 275, y: 370, w: 170, lab: SA, sub: 'vendored byte for byte', read: true }), line(360, 310, 360, 370), edgeLabel(368, 334, 'start', E.hkLight));
    o.push(line(445, 390, 720, 186, true), svgT(458, 426, 'the same bytes', 't-note'), svgT(458, 440, 'read, not decided', 't-note'));
  }
  /* TSavo, on Anthropic's side: OpenAI's statement re-read there, then the join */
  if (ts) {
    o.push(node({ x: 465, y: 150, w: 160, lab: 'Claim', sub: 'OpenAI’s text, re-read', read: true }));
    o.push(line(180, 170, 465, 170, true), svgT(322, 160, 'the same bytes · read, not decided', 't-note', 'middle'));
    o.push(line(625, 170, 720, 170), svgT(672, 160, E.tsavo.word, 't-key', 'middle'), ticks(672, 176, E.tsavo.ran, 'middle'));
  }
  const alt = 'A map of the proofs across the version seam. On OpenAI’s side (' + leanV(oai.toolchain) + ', Mathlib ' + oai.mathlib.slice(0, 8) + '): OpenAI’s proof is ' + E.oaiProof.word + ' against ' + SO + ' by ' + ranWords(E.oaiProof.ran)
    + '; our bridge proves ¬ETH' + (sh ? ' and ¬#ETH' : '') + ' from it in OpenAI’s model (' + E.oaiEth.word + ', ' + ranWords(E.oaiEth.ran) + ')'
    + (hk ? '; Hawkley’s ' + (hkh ? 'heavy link from ' + SO + ' to ¬PositiveRateETH is ' + E.hkHeavy.word + ' (' + ranWords(E.hkHeavy.ran) + ') and his ' : '') + 'light link from ¬PositiveRateETH to a vendored copy of ETHIsFalse is ' + E.hkLight.word + ' (' + ranWords(E.hkLight.ran) + ')' : '')
    + '. On Anthropic’s side (' + leanV(ant.toolchain) + ', Mathlib ' + ant.mathlib.slice(0, 8) + '): Anthropic’s proof is ' + E.antProof.word + ' against ETHIsFalse by ' + ranWords(E.antProof.ran)
    + '; our bridge proves ¬ETH' + (sh ? ' and ¬#ETH' : '') + ' from it in Anthropic’s model (' + E.antEth.word + ', ' + ranWords(E.antEth.ran) + ')'
    + (ts ? '; TSavo’s join from a re-read copy of OpenAI’s statement to ETHIsFalse is ' + E.tsavo.word + ' (' + ranWords(E.tsavo.ran) + ')' : '')
    + '. The two copies are the same bytes as the originals, read across the seam, not decided by one kernel.';
  return { svg: svgOpen(900, 556, alt) + o.join('') + '</svg>', E, alt };
}

/* Figure B: the seam as a grid — the two closures as proportional blocks, then the statement's own vocabulary */
function figSeam(S) {
  const H = S.headline, cl = H.closure, V = H.vocabulary, nd = V.namedDiffering;
  const bad = (why) => { throw new Error('the seam as a grid: ' + why); };
  const onlyO = cl.presentOnly.openai, onlyA = cl.presentOnly.anthropic;
  for (const n of [cl.constants.common, cl.kernelDiffer, onlyO, onlyA, V.named]) if (!Number.isInteger(n) || n < 0) bad('a count is not a whole number: ' + n);
  const same = cl.constants.common - cl.kernelDiffer;
  if (same < 0) bad('more common constants differ (' + cl.kernelDiffer + ') than there are (' + cl.constants.common + ')');
  if (cl.constants.openai.full !== cl.constants.common + onlyO || cl.constants.anthropic.full !== cl.constants.common + onlyA) bad('common plus one side only is not that side’s closure');
  if (nd.length > V.named) bad(nd.length + ' named constants differ, of ' + V.named + ' named');
  const total = cl.constants.common + onlyO + onlyA, vSame = V.named - nd.length;
  const names = nd.map((x) => (SEAM_WORD[x.name] || x.name) + ' (' + x.name + ')');
  const o = [];
  const block = (x, w, y, h, kind) => '<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) + '" height="' + h + '" class="w-decided" stroke-width="1" fill="'
    + (kind === 'same' ? 'var(--ink-5)' : kind === 'differ' ? 'var(--ink)' : 'none') + '"/>';
  /* strip 1: the closures, 820 units for every constant in either */
  const X0 = 40, WID = 820, u = WID / total;
  o.push(svgT(X0, 22, 'The two definitional closures, constant by constant', 't-key'), svgT(860, 22, fmt(total) + ' constants in either closure', 't-note', 'end'));
  let x = X0;
  const parts = [['same', same], ['differ', cl.kernelDiffer], ['onlyO', onlyO], ['onlyA', onlyA]];
  const at = {};
  for (const [k, n] of parts) { at[k] = { x, w: n * u }; o.push(block(x, n * u, 36, 30, k)); x += n * u; }
  if (Math.abs(x - X0 - WID) > 1e-6) bad('the blocks do not add up to the strip');
  o.push(svgT(at.same.x + at.same.w / 2, 88, fmt(same) + ' the same kernel term on both sides', 't-lab', 'middle'));
  o.push(svgT(at.differ.x + at.differ.w / 2, 88, fmt(cl.kernelDiffer) + ' differ', 't-lab', 'middle'));
  const lead = (k, yEnd) => '<line x1="' + (at[k].x + at[k].w / 2).toFixed(1) + '" y1="70" x2="' + (at[k].x + at[k].w / 2).toFixed(1) + '" y2="' + yEnd + '" fill="none" stroke="var(--ink-4)" stroke-width="1"/>';
  o.push(lead('onlyO', 100), svgT(at.onlyO.x + at.onlyO.w / 2 - 6, 108, fmt(onlyO) + ' only in OpenAI’s (hollow)', 't-note', 'end'));
  o.push(lead('onlyA', 118), svgT(at.onlyA.x + at.onlyA.w / 2 - 6, 126, fmt(onlyA) + ' only in Anthropic’s (hollow)', 't-note', 'end'));
  /* strip 2: the constants the statement names directly, with the differing ones named beside */
  const W2 = 400, u2 = W2 / V.named, wS = vSame * u2;
  o.push(svgT(X0, 164, 'The ' + fmt(V.named) + ' constants the statement names directly', 't-key'));
  o.push(block(X0, wS, 174, 30, 'same'), block(X0 + wS, nd.length * u2, 174, 30, 'differ'));
  o.push(svgT(X0 + wS / 2, 226, fmt(vSame) + ' the same', 't-lab', 'middle'), svgT(X0 + W2, 226, fmt(nd.length) + ' differ', 't-lab', 'end'));
  o.push(svgT(470, 178, 'the ' + fmt(nd.length) + ' that differ, listed:', 't-note'));
  for (let i = 0; i < names.length; i += 2) o.push(svgT(470, 194 + 8 * i, names.slice(i, i + 2).join(' · '), 't-ax'));
  const alt = 'Two strips. The closures: ' + fmt(total) + ' constants in either environment, drawn in proportion: ' + fmt(same) + ' the same kernel term on both sides, ' + fmt(cl.kernelDiffer) + ' differ, '
    + fmt(onlyO) + ' only in OpenAI’s, ' + fmt(onlyA) + ' only in Anthropic’s. The vocabulary: of the ' + fmt(V.named) + ' constants the statement names directly, ' + fmt(vSame) + ' are the same and ' + fmt(nd.length) + ' differ: ' + names.join(', ') + '.';
  return { svg: svgOpen(900, 196 + 8 * Math.max(names.length, 4) + 24, alt) + o.join('') + '</svg>', same, total, vSame, names, alt };
}
const MAPR = { oai: OAI, ant: ANT, br: BR, sh: SH, ts: TS, hk: HK, hkh: HKH, seam: SEAM };
const FIG_MAP = bridgeDone ? figMap(MAPR) : null;
const FIG_SEAM = SEAM ? figSeam(SEAM) : null;
/* the red controls: a planted word or count the records do not carry must make the figure refuse */
const refuses = (fn) => { try { fn(); } catch (e) { return true; } return false; };
const planted = (mutate) => { const R = JSON.parse(JSON.stringify(MAPR)); mutate(R); return refuses(() => figMap(R)); };
if (FIG_MAP) {
  if (!planted((R) => { R.oai.word = 'REFUSED'; })) fail('the map of the proofs drew a planted REFUSED proof as a solid edge');
  if (!planted((R) => { R.ant.kernels = R.ant.kernels.filter((k) => k !== NACC); })) fail('the map of the proofs kept CERTIFIED on a planted record where nanoda did not accept');
  if (HK && !planted((R) => { R.hk.project.toolchain = R.ant.toolchain; })) fail('the map of the proofs drew Hawkley’s join on OpenAI’s side for a planted record that builds on Anthropic’s Lean');
}
if (FIG_SEAM) {
  const seamPlanted = (mutate) => { const S = JSON.parse(JSON.stringify(SEAM)); mutate(S); return refuses(() => figSeam(S)); };
  if (!seamPlanted((S) => { S.headline.closure.kernelDiffer = S.headline.closure.constants.common + 1; })) fail('the seam grid drew a planted count of differing constants larger than the common closure');
  if (!seamPlanted((S) => { S.headline.vocabulary.named = S.headline.vocabulary.namedDiffering.length - 1; })) fail('the seam grid drew more differing named constants than the planted count of named ones');
}
const SEAM_PTR = (p) => W.val({ rec: { path: SEAM_REL, ptr: p }, standing: W.DECIDED, fmt: 'int', why: 'counted by comparing the exported kernel terms of the two closures (certs/eth-seam.json)' });

/* §5 the bridge */
const leanM = (t) => '<span class="m">' + brk(C.esc(t.replace(/\s+/g, ' '))) + '</span>';
function bridgeBody() {
  const BO = BR.bridges.openai.theorem, BA = BR.bridges.anthropic.theorem;
  const L1 = thm('openai', 'bitLength_succ_le'), L2 = thm('openai', 'count_pos_iff'), L3 = thm('openai', 'bound_le');
  const LS = thm('anthropic', 's_eq');
  const bridgeItem = (who, model, t, proj) => ({ b: who + '.', raw: C.esc(model) + ': ' + leanM(t.statement)
    + ' — ' + (t.axioms.length === 3 ? 'the three standard axioms' : C.esc(t.axioms.join(', '))) + '; '
    + C.esc(BR.projects[proj].toolchain.replace('leanprover/lean4:', 'Lean ')) + ', built in ' + BR.projects[proj].buildSeconds + ' s.' });
  const mapFig = C.figure({ svgRaw: FIG_MAP.svg, record: [KPATH, BRIDGE_REL].concat(TS ? [TS_REL] : [], HK ? [HK_REL] : [], HKH ? [HKH_REL] : [], SEAM ? [SEAM_REL] : []),
    stop: 'an edge’s word is not CERTIFIED or PROVED in its record, a tick is drawn for a check its record does not say accepted, a third party’s join is drawn in an environment other than the one its record builds on, or a copied statement’s bytes are not the pinned original’s',
    captionRaw: '<b>The map of the proofs.</b> Boxes are statements and proofs; every solid edge is a Lean implication decided by the checks ticked under its word, read from that edge’s record: '
      + CHECKS.map(([k, w]) => k + ' ' + C.esc(w)).join(', ') + '. Our bridge (' + ln(BRIDGE_REL) + ') refutes the textbook ETH' + (SH ? ' and #ETH' : '') + ' from each statement in that lab’s own model; '
      + (HK ? 'Hawkley’s two links (' + ln(HK_REL) + (HKH ? ', ' + ln(HKH_REL) : '') + ') live in OpenAI’s Lean, the heavy one proved from ' + C.m(short(HKH ? HKH.claim.upstream : 'original_sat_main')) + ', OpenAI’s own theorem rebuilt on the same run, the light one ending at Anthropic’s statement file vendored byte for byte; ' : '')
      + (TS ? 'TSavo’s join (' + ln(TS_REL) + ') lives in Anthropic’s Lean and starts from OpenAI’s statement text re-read there. ' : '')
      + 'A hollow box is such a copy, and the dashed link to its original is a reading: the bytes are the same, but no single kernel has checked both ends across the version seam' + (SEAM ? ' (' + ln(SEAM_REL) + ', measured ' + C.esc(SEAM.verdict) + ')' : '') + '.' });
  return mapFig + '<div class="col">'
    + C.pRaw('The textbook definition is written once, in ' + ln('corpus/eth-refutation/bridge/openai/ETHBridge/Generic.lean', 'Generic.lean') + ' (sha256 ' + C.esc(BR.generic.sha256.slice(0, 12)) + '…, byte-identical in both projects). A model fixes four things: what a machine is, which formulas are k-SAT instances, the input word a formula is written as, and what “halts within t steps with answer b” means. Then s_k, the infimum of the δ for which k-SAT is decided within ⌊c·2^{δn}⌋ steps for every n, and ETH, s_k > 0 for every k ≥ 3, read the same in every model. Each lab’s statement is then proved to refute ETH in that lab’s own model:')
    + C.plainList([bridgeItem('OpenAI', 'its PrimitiveMachine, sets of clauses of width ≤ k, encodeCNF', BO, 'openai'),
      bridgeItem('Anthropic', 'Mathlib’s FinTM2, duplicate-free clause lists, encClauses', BA, 'anthropic')])
    + C.pRaw('<b>OpenAI.</b> ' + C.esc(BR.bridges.openai.reads) + ' The three steps both readers did by hand are Lean lemmas now: the input word is polynomial in n, ' + leanM(L1.statement.replace(/^theorem\s+/, '')) + '; the halting answer decides satisfiability, ' + leanM(L2.statement.replace(/^theorem\s+/, '')) + '; and the running-time bound is at most c·2^{δn} for every n, ' + leanM(L3.statement.replace(/^theorem\s+/, '')) + '.')
    + C.pRaw('<b>Anthropic.</b> ' + C.esc(BR.bridges.anthropic.reads) + ' In Lean: ' + leanM(LS.statement.replace(/^theorem\s+/, '')) + '.')
    + C.pRaw('<b>How the statements were copied.</b> OpenAI’s challenge file is carried with one declared change: its open theorem ' + C.m('exact_count_and_sat') + ' becomes the proposition ' + C.m('OpenAIClaim') + ', and undoing that change gives back the pinned sha256 ' + C.esc(BR.copies.openai.rebuiltSha256.slice(0, 12)) + '…. Anthropic’s ' + C.m('MainResults.lean') + ' is carried unchanged (' + C.esc(BR.copies.anthropic.rebuiltSha256.slice(0, 12)) + '…). §1 decided that OpenAI’s proof proves exactly that statement, so the two together give ¬ETH in OpenAI’s model. The join is the identity of the statement’s bytes, not one Lean term: the bridge does not import OpenAI’s proof.')
    + (SH ? C.pRaw('<b>#ETH, the counting hypothesis, too.</b> Both statements count the satisfying assignments, not only decide them, so the counting form of ETH (Dell, Husfeldt, Marx, Taslaman, Wahlén) falls as well. It is written once in the same file, ' + leanM('def SharpETH : Prop := ∀ k : ℕ, 3 ≤ k → 0 < sharpS Co k') + ', with s#_k the infimum of the δ for which some admissible machine writes the number of satisfying assignments of every k-CNF within ⌊c·2^{δn}⌋ steps, and proved false in each lab’s own counting model:')
        + C.plainList([{ b: 'OpenAI.', raw: leanM(SH.openai.theorem.statement) + ' — the count on the count tape, binary, lowest digit first, as ' + C.m('exact_count_and_sat') + ' writes it.' },
          { b: 'Anthropic.', raw: leanM(SH.anthropic.theorem.statement) + ' — the count in ' + C.m('binary n') + ', n + 1 bits, lowest first. ' + C.esc(sharpLimit) }])
        + C.pRaw('ETH and #ETH are proved separately here; neither refutation is derived from the other.') : '')
    + C.pRaw('<b>Checked ' + (bridgeAll3 ? 'three times' : 'by one kernel') + '.</b> ' + (bridgeAll3
        ? 'Every one of the ' + bridgeThms + ' bridge theorems passes Lean’s kernel inside ' + C.m('lake build') + ', Lean’s kernel again inside Comparator on a fresh runner that never built the bridge, and nanoda, a kernel written independently of Lean’s (<a href="' + C.escAttr(BR.run.url) + '">run ' + BR.run.id + '</a>). Comparator’s statement check here compares our own text against itself; the labs’ statements enter through their pinned copies.'
        : 'Lean’s, inside ' + C.m('lake build') + ' on GitHub’s runners (<a href="' + C.escAttr(BR.run.url) + '">run ' + BR.run.id + '</a>). No second kernel has replayed the bridge.')
      + ' No ' + C.m('sorry') + ', no axiom declared, no ' + C.m('native_decide') + ' (' + ln(BRIDGE_REL) + ', ' + ln('corpus/eth-refutation/bridge/README.md', 'the README') + ').')
    + C.pRaw('<b>Not proved, and said so:</b>')
    + C.plainList(BR.notProved.map((t) => ({ b: '', text: t })))
    + '</div>'
    + (TS ? tsavoBody() : '')
    + (HK ? '<div class="col">' + hawkleyBody() + '</div>' : '');
}
function tsavoBody() {
  const short = TS.claim.repository.replace('https://github.com/', '') + ' @ ' + TS.claim.commit.slice(0, 8);
  return '<div class="col">' + C.pRaw('<b>The step between the two models, joined by someone else, and replayed here: ' + C.esc(TS.word) + '.</b> '
      + '<a href="' + C.escAttr(TS.claim.repository + '/tree/' + TS.claim.commit) + '" target="_blank" rel="noopener">' + C.esc(short) + '</a> '
      + '(TSavo; written with Claude, per its README) proves ' + leanM('Bridge.ethIsFalse_of_claim : OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim → MainResults.ETHIsFalse') + ': '
      + 'OpenAI’s machine compiled into Anthropic’s, and OpenAI’s input word produced from Anthropic’s, so OpenAI’s statement refutes ETH in Anthropic’s FinTM2 model too. '
      + 'Replayed on GitHub’s runners (<a href="' + C.escAttr(TS.run.url) + '">run ' + TS.run.id + '</a>): ' + C.esc(TS.why).replace(/`([^`]+)`/g, '<span class="m">$1</span>') + ' (' + ln(TS_REL) + ').')
    + C.pRaw('<b>Its gaps, first:</b>')
    + C.plainList(TS.gaps.map((g) => ({ b: '', raw: brk(C.esc(g)).replace(/`([^`]+)`/g, '<span class="m">$1</span>') })))
    + '</div>' + (SEAM ? seamBody() : '');
}
function hawkleyBody() {
  const short = HK.claim.repository.replace('https://github.com/', '') + ' @ ' + HK.claim.commit.slice(0, 8);
  const heavy = HKH ? ' The link from OpenAI’s checked theorem to that predicate — his <span class="m">OAI.Bridges.ETH.not_positiveRateETH</span>, proved from <span class="m">original_sat_main</span> on top of OpenAI’s whole family-378 proof — was replayed on a rented machine (' + ln(HKH_REL) + '): ' + C.esc(HKH.word) + ', ' + C.esc(HKH.why) + '.'
    : ' The link from OpenAI’s checked theorem to that predicate (his <span class="m">OAI.Bridges.ETH.not_positiveRateETH</span>, on top of OpenAI’s whole family-378 proof) is being replayed on a rented machine; until its record exists the join stands on the predicate.';
  return C.pRaw('<b>A second join, the other way round, and replayed here: ' + C.esc(HK.word) + '.</b> '
      + '<a href="' + C.escAttr(HK.claim.repository + '/tree/' + HK.claim.commit) + '" target="_blank" rel="noopener">' + C.esc(short) + '</a> '
      + '(Daniel Hawkley, formalize.now; a fork of OpenAI’s release) proves ' + leanM('OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse : ¬ OAI.ParityWL.Complexity.PositiveRateETH → MainResults.ETHIsFalse') + ': '
      + 'OpenAI’s ParityLifts machines simulated on Anthropic’s FinTM2 and Anthropic’s input word converted to OpenAI’s, inside OpenAI’s own Lean and Mathlib, with Anthropic’s statement file vendored byte for byte. '
      + 'Replayed on GitHub’s runners (<a href="' + C.escAttr(HK.run.url) + '">run ' + HK.run.id + '</a>): ' + C.esc(HK.why).replace(/`([^`]+)`/g, '<span class="m">$1</span>') + ' (' + ln(HK_REL) + ').' + heavy)
    + C.pRaw('<b>Its gaps, first:</b>')
    + C.plainList(HK.gaps.map((g) => ({ b: '', raw: brk(C.esc(g)).replace(/`([^`]+)`/g, '<span class="m">$1</span>') })));
}
/* THE VERSION SEAM, measured (certs/eth-seam.json, 2026-10-29): TSavo's join re-elaborates OpenAI's statement on Anthropic's
   Lean and Mathlib; each side's statement and its whole definitional closure exported as kernel terms and compared */
function seamBody() {
  const H = SEAMH, nd = H.vocabulary.namedDiffering, cl = H.closure, WORD = SEAM_WORD;
  const seamFig = C.figure({ svgRaw: FIG_SEAM.svg, record: SEAM_REL,
    stop: 'a count in the seam record is not a whole number, more common constants differ than there are, a side’s closure is not the common part plus what is only on that side, or more named constants differ than the statement names',
    captionRaw: '<b>The seam as a grid.</b> Every constant either statement reaches, exported from both environments as a kernel term and compared: of '
      + SEAM_PTR('/headline/closure/constants/common') + ' in both closures, ' + W.value(fmt(FIG_SEAM.same), W.DECIDED, { derived: [SEAM_REL + '#/headline/closure/constants/common', SEAM_REL + '#/headline/closure/kernelDiffer'], title: 'the common constants minus the ones whose kernel terms differ' })
      + ' are the same term and ' + SEAM_PTR('/headline/closure/kernelDiffer') + ' differ; ' + SEAM_PTR('/headline/closure/presentOnly/openai') + ' exist only in OpenAI’s and ' + SEAM_PTR('/headline/closure/presentOnly/anthropic') + ' only in Anthropic’s (hollow). '
      + 'Of the ' + SEAM_PTR('/headline/vocabulary/named') + ' constants the statement names directly, ' + W.value(fmt(FIG_SEAM.names.length), W.DECIDED, { derived: [SEAM_REL + '#/headline/vocabulary/namedDiffering'], title: 'the length of the record’s list of named constants whose terms differ' }) + ' differ, listed beside the strip: the real numbers’ instances and the monoid power. Width is count; every block is decided.' });
  return seamFig + '<div class="col">' + C.pRaw('<b>The version seam, measured' + (SEAM.verdict ? ': ' + C.esc(SEAM.verdict) : '') + '.</b> The join reads OpenAI’s statement on Anthropic’s Lean and Mathlib, while OpenAI’s proof lives on its own. '
      + 'Both statements, and every definition they reach, were exported from both environments as kernel terms and compared (<a href="' + C.escAttr(SEAM.run.url) + '">run ' + SEAM.run.id + '</a>, ' + ln(SEAM_REL) + '). '
      + (H.statementTerm.kernelEqual ? 'The statement itself is the same kernel term on both sides, apart from one binder’s name, and all ' + H.vocabulary.oaiDefinitions + ' of OpenAI’s own definitions are identical. ' : 'The statement itself is a different kernel term on the two sides. ')
      + 'Underneath, the two Mathlibs build the real numbers differently: of ' + fmt(cl.constants.common) + ' constants in both closures, ' + fmt(cl.kernelDiffer) + ' differ and ' + fmt(cl.presentOnly.anthropic + cl.presentOnly.openai) + ' exist on one side only, mostly from a reworked monoid hierarchy and from files that moved. '
      + 'Of the ' + H.vocabulary.named + ' constants the statement names directly, ' + nd.length + ' differ: ' + C.esc(nd.map((x) => WORD[x.name] || x.name).join(', ')) + ' on ℝ. '
      + 'Lean’s kernel cannot match those terms across the two environments, so no single kernel has checked that the two statements are one proposition. It is almost certainly the same mathematics; the record says only that the terms differ, and where.') + '</div>';
}
B.push(C.section({
  lab: '§5 · the bridge', title: 'One textbook ETH in Lean, and each statement against it', id: 'bridge',
  bodyRaw: bridgeDone
    ? bridgeBody()
    : C.pRaw(W.value('not yet run', W.REFUSED) + '. The gap both readers found is OpenAI’s: its Lean has no ETH. The bridge is the textbook definition (s_k as an infimum, ETH as s_k > 0 for k ≥ 3), written once in Lean and instantiated in each lab’s own machine and encoding, with a proof that OpenAI’s theorem implies its negation there, and that Anthropic’s ETHIsFalse does. It is being built on GitHub’s runners. The steps between machine models and encodings, §2’s third and fourth premises, stay prose for both labs.')
}));

/* §5b toward the standard machine (the model-gap lane, notes/eth-model-gap-preregistration-2026-11-04.md): each step
   read from its record when the record exists, and said to be in progress when it does not */
const D1_REL = 'certs/eth-cslib-d1.json', C1_REL = 'certs/eth-c1.json', C2_REL = 'certs/eth-c2.json';
const ghRec = (rel) => '<a href="https://github.com/carlostoledo1891/cert-machine/blob/main/' + C.escAttr(rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const vTag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'open');
/* Figure C (2026-11-04): from Anthropic's statement across the second seam into complexitylib's environment — D1 and C1
   and C2 as solid edges read from their records (a void until a record exists), the textbook ETH a dashed reading */
function figStd(R) {
  const { d1, c1, c2, ant, oai, hk, hkh } = R;
  const bad = (why) => { throw new Error('the standard-machine map: ' + why); };
  const d1Edge = { word: d1.verdict, ran: { C: false, K: d1.fails.length === 0, N: !!(d1.nanoda.not_eth && d1.nanoda.not_eth.accepted), L: d1.steps.leancheckerExit === 0 } };
  const c1Edge = c1 ? { word: c1.verdict, ran: { C: false, K: c1.fails.length === 0, N: !!c1.nanoda.claim.accepted, L: c1.fails.length === 0 } } : null;
  /* Hawkley's two links, drawn as one edge from OpenAI's statement to the ETHIsFalse vendored in OpenAI's Lean: solid
     only when both records are decided, each tick only where both say that check accepted */
  const hkEdge = hk && hkh ? { word: hk.word === hkh.word ? hk.word : 'MIXED', ran: { C: false,
    K: !!hkh.facts.buildOk && (hk.comparator.kernels || []).includes(KACC), N: !!hkh.facts.nanodaAccepts && (hk.comparator.kernels || []).includes(NACC),
    L: hkh.facts.leanchecker === 'REPLAYED' && !!(hk.leanchecker && hk.leanchecker.word === 'REPLAYED') } } : null;
  const c2Edge = c2 ? { word: c2.verdict, ran: { C: false, K: c2.fails.length === 0, N: !!c2.nanoda.claim.accepted, L: c2.fails.length === 0 } } : null;
  const need = (e, who) => { if (!DECIDED_WORDS.includes(e.word)) bad(who + ' is ' + e.word + ', and a solid edge needs a decided word');
    for (const k of ['K', 'N', 'L']) if (!e.ran[k]) bad(who + ' is drawn solid but its record does not say ' + CHECKS.find(([c]) => c === k)[1] + ' accepted'); return e; };
  need(d1Edge, 'D1'); if (c1Edge) need(c1Edge, 'C1'); if (c2Edge) need(c2Edge, 'C2');
  if (hkEdge) { if (!DECIDED_WORDS.includes(hkEdge.word)) bad('Hawkley’s chain is ' + hkEdge.word + ', and a solid edge needs a decided word'); if (!hkEdge.ran.K || !hkEdge.ran.N) bad('Hawkley’s chain is drawn solid but its records do not both say Lean’s kernel and nanoda accepted'); }
  for (const [who, r] of [['C1', c1], ['C2', c2]]) if (r && !Object.values(r.planted).every((p) => p.refused)) bad(who + ' is drawn solid but a planted variant was not refused');
  const cxV = 'Lean v4.36.0-rc2';
  if (d1.claim.toolchain !== 'leanprover/lean4:v4.36.0-rc2') bad('D1 does not build on complexitylib’s ' + cxV);
  const o = [];
  o.push('<defs><marker id="eth-arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/></marker>'
    + '<marker id="eth-arr2-read" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink-2)"/></marker>'
    + '<pattern id="eth-void" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="var(--surface)"/><path d="M0,6 l6,-6 M-1.5,1.5 l3,-3 M4.5,7.5 l3,-3" stroke="var(--ink-5)" stroke-width="0.7" fill="none"/></pattern></defs>');
  const ln2 = (x1, y1, x2, y2, read) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" ' + W.attrs(read ? W.COMPUTED : W.DECIDED, { width: 2 }) + ' marker-end="url(#eth-arr2' + (read ? '-read' : '') + ')"/>';
  if (hkEdge) {
    /* the first seam: OpenAI's statement, Hawkley's chain inside OpenAI's Lean, the vendored ETHIsFalse read across */
    o.push(svgT(20, 24, 'OpenAI’s environment', 't-key'), svgT(20, 38, leanV(oai.toolchain) + ' · Mathlib ' + oai.mathlib.slice(0, 8), 't-note'));
    o.push(node({ x: 30, y: 48, w: 190, lab: short(oai.theorems[0]), sub: 'OpenAI’s statement' }));
    o.push(ln2(125, 88, 125, 148), svgT(135, 102, 'Hawkley', 't-note'), edgeLabel(135, 115, 'start', hkEdge));
    o.push(node({ x: 30, y: 148, w: 190, lab: 'ETHIsFalse', sub: 'vendored, same bytes', read: true }));
    o.push('<line x1="20" y1="202" x2="240" y2="202" fill="none" stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="2 3"/>', svgT(135, 214, 'seam 1: read', 't-note'));
    o.push(ln2(125, 188, 125, 220, true));
    o.push(svgT(20, 278, 'Anthropic’s environment', 't-key'), svgT(20, 292, leanV(ant.toolchain) + ' · Mathlib ' + ant.mathlib.slice(0, 8), 't-note'));
  } else o.push(svgT(20, 24, 'Anthropic’s environment', 't-key'), svgT(20, 38, leanV(ant.toolchain) + ' · Mathlib ' + ant.mathlib.slice(0, 8), 't-note'));
  o.push(svgT(880, 24, 'complexitylib’s environment', 't-key', 'end'), svgT(880, 38, cxV + ' · cslib, Mathlib through its pins', 't-note', 'end'));
  o.push('<line x1="245" y1="34" x2="245" y2="430" fill="none" stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="2 3"/>');
  o.push(svgT(245, 452, 'the second version seam — the same bytes, read, not decided', 't-note', 'middle'));
  o.push(svgT(20, 474, CHECKS.filter(([k]) => k !== 'C').map(([k, w]) => k + ' ' + w).join(' · ') + ' — a tick only where the record says it accepted', 't-note'));
  o.push(node({ x: 30, y: 220, w: 190, lab: 'ETHIsFalse', sub: 'Anthropic’s statement' }));
  o.push(node({ x: 265, y: 220, w: 165, lab: 'ETHIsFalse', sub: 'vendored, same bytes', read: true }));
  o.push(ln2(220, 240, 265, 240, true));
  o.push(node({ x: 560, y: 44, w: 200, lab: 'complexitylib’s proof', sub: 'native, @ ' + d1.claim.commit.slice(0, 8) }));
  o.push(node({ x: 504, y: 220, w: 200, lab: '¬ ETH', sub: 'cslib multitape TM, encCNF' }));
  o.push(node({ x: 714, y: 220, w: 182, lab: '¬ ETH', sub: 'word RAM, O(log L) words' }));
  o.push(ln2(620, 84, 604, 220), edgeLabel(604, 140, 'end', d1Edge), svgT(604, 128, 'D1', 't-note', 'end'));
  if (c1Edge) o.push(ln2(720, 84, 800, 220), edgeLabel(770, 140, 'start', c1Edge), svgT(770, 128, 'C1', 't-note'));
  else o.push('<rect x="735" y="100" width="40" height="100" class="w-void" fill="url(#eth-void)" stroke="var(--rule-strong)" stroke-width="1"/>', svgT(785, 150, '∅ C1, not yet decided', 't-note'));
  /* C2: solid from its record; with no record, a void the width of the gap, with its words */
  if (c2Edge) o.push(ln2(430, 240, 504, 240), edgeLabel(467, 288, 'middle', c2Edge), svgT(467, 276, 'C2', 't-note', 'middle'));
  else o.push('<rect x="434" y="230" width="66" height="20" class="w-void" fill="url(#eth-void)" stroke="var(--rule-strong)" stroke-width="1"/>',
    svgT(467, 272, '∅ C2', 't-key', 'middle'), svgT(467, 286, 'not yet decided', 't-note', 'middle'));
  o.push(node({ x: 560, y: 370, w: 200, lab: 'ETH is false', sub: 'the textbook statement', read: true }));
  o.push(ln2(604, 260, 625, 370, true), ln2(800, 260, 715, 370, true));
  o.push(svgT(660, 426, 'a reading of a definition, and always one', 't-note', 'middle'));
  const alt = (hkEdge ? 'In OpenAI’s environment (' + leanV(oai.toolchain) + '), OpenAI’s statement implies a byte-for-byte copy of Anthropic’s ETHIsFalse (Hawkley’s chain, ' + hkEdge.word + ', ' + ranWords(hkEdge.ran) + '); across the first version seam that copy is read as Anthropic’s statement, not decided. ' : '') + 'The chain beyond §5’s map. In Anthropic’s environment (' + leanV(ant.toolchain) + '), Anthropic’s statement ETHIsFalse. Across a second version seam, in complexitylib’s environment (' + cxV + '), the same file vendored byte for byte, drawn hollow: read, not decided. '
    + 'complexitylib’s native proof implies ¬ETH on cslib’s multitape Turing machine with the binary encoding encCNF (D1, ' + d1Edge.word + ', ' + ranWords(d1Edge.ran) + ')'
    + (c1Edge ? ', and ¬ETH on the word RAM with logarithmic words (C1, ' + c1Edge.word + ', ' + ranWords(c1Edge.ran) + ', every planted variant refused)' : '; C1, the word RAM, is not yet decided')
    + (c2Edge ? '. The vendored ETHIsFalse implies the multitape ¬ETH (C2, ' + c2Edge.word + ', ' + ranWords(c2Edge.ran) + ', every planted variant refused)' : '. Between the vendored ETHIsFalse and the multitape ¬ETH a void: C2, not yet decided') + '. Both ¬ETH boxes link by dashed lines to the textbook statement, a reading of a definition.';
  return { svg: svgOpen(900, 482, alt) + o.join('') + '</svg>', d1Edge, c1Edge, c2Edge, hkEdge, alt };
}
const opt = (rel) => fs.existsSync(path.join(ROOT, rel)) ? J(rel) : null;
const STDR = fs.existsSync(path.join(ROOT, D1_REL)) ? { d1: J(D1_REL), c1: opt(C1_REL), c2: opt(C2_REL), ant: ANT, oai: OAI, hk: HK, hkh: HKH } : null;
const FIG_STD = STDR ? figStd(STDR) : null;
if (FIG_STD) {
  const stdPlanted = (mutate) => { const R = JSON.parse(JSON.stringify(STDR)); mutate(R); return refuses(() => figStd(R)); };
  if (!stdPlanted((R) => { R.d1.verdict = 'REFUSED'; })) fail('the standard-machine map drew a planted REFUSED D1 as a solid edge');
  if (!stdPlanted((R) => { R.d1.nanoda.not_eth.accepted = false; })) fail('the standard-machine map kept D1 solid on a planted record where nanoda did not accept');
  if (STDR.c1 && !stdPlanted((R) => { R.c1.planted.sorry.refused = false; })) fail('the standard-machine map kept C1 solid on a planted record where a planted variant was not refused');
  if (STDR.hk && STDR.hkh && !stdPlanted((R) => { R.hkh.facts.nanodaAccepts = false; })) fail('the standard-machine map kept Hawkley’s chain solid on a planted record where nanoda did not accept');
  if (STDR.c2 && !stdPlanted((R) => { R.c2.planted.statement.refused = false; })) fail('the standard-machine map kept C2 solid on a planted record where the changed statement was not refused');
}
const lane = [];
if (fs.existsSync(path.join(ROOT, D1_REL))) {
  const d1 = J(D1_REL);
  if (d1.verdict === 'CERTIFIED' && !(d1.nanoda.not_eth && d1.nanoda.not_eth.accepted)) fail('the D1 record says CERTIFIED without nanoda accepting not_eth');
  lane.push({ b: 'A native re-proof on a standard machine.', raw: vTag(d1.verdict) + ' cslib-community/complexitylib (built by AI agents, reviewed by an AI reviewer) re-proves OpenAI’s Proposition 6.4 route from scratch, with ETH stated on cslib’s deterministic multitape Turing machine and the binary encoding encCNF, as close to the textbook model as a Lean statement has come. Decided here at ' + C.esc(d1.claim.commit.slice(0, 8)) + ': the build from source, the three standard axioms from our own file, nanoda accepting all ' + C.esc(d1.nanoda.not_eth.declarations.toLocaleString('en-US')) + ' declarations beneath not_eth, leanchecker --fresh. It is a re-proof, not a bridge from either lab’s statement. ' + ghRec(D1_REL) + '.' });
}
if (fs.existsSync(path.join(ROOT, C1_REL))) {
  const c1 = J(C1_REL);
  lane.push({ b: 'ETH on a word RAM.', raw: vTag(c1.verdict) + ' ' + C.esc(c1.scope) + ' ' + ghRec(C1_REL) + '.' });
} else {
  lane.push({ b: 'ETH on a word RAM.', raw: vTag('IN PROGRESS') + ' complexitylib’s Turing-machine-to-RAM inclusions at logarithmic word size need polynomial running time, because its simulator bounds addresses by time. A proof that bounds them by space instead, so the 2^{o(n)}-time decider runs at O(log L)-bit words, is written in claimbox (lean/eth-bridge, a proposal) and is being decided here.' });
}
if (fs.existsSync(path.join(ROOT, C2_REL))) {
  const c2 = J(C2_REL);
  lane.push({ b: 'The labs’ own statements on the standard machine.', raw: vTag(c2.verdict) + ' ' + C.esc(c2.scope) + ' ' + C.esc(c2.reading[0]) + ' ' + C.esc(c2.reading[1]) + ' ' + ghRec(C2_REL) + '.' });
} else {
  lane.push({ b: 'The labs’ own statements on the standard machine.', raw: vTag('IN PROGRESS') + ' Anthropic’s ETHIsFalse (Mathlib FinTM2 on encClauses) implying complexitylib’s ¬ETH, so that, with Hawkley’s chain, both labs’ statements reach cslib’s machine. Proved in claimbox (lean/eth-bridge, a proposal) by an AI agent; being decided here.' });
}
lane.push({ b: 'What stays a reading.', text: 'That any formal ETH, ours, cslib’s or a lab’s, is the textbook ETH is a reading of a definition. ' + (C2DONE ? 'This lane has made it a reading of a standard machine with a reasonable binary encoding: cslib’s multitape Turing machine, reached from both labs’ statements across version seams that are read, and a word RAM at logarithmic word size, reached from complexitylib’s own proof.' : 'The best outcome of this lane makes it a reading of a standard multitape machine and a word RAM with a reasonable binary encoding.') });
B.push(C.section({
  lab: '§5b · toward the standard machine', title: 'From the labs’ machines to a textbook one', id: 'standard', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('The machine and the encoding, the two steps §2 read, are the gap every reader names. Since 4 November this lane works on them: proofs written by claimbox and its AI agents, decided here from pinned bytes. claimbox and this page have the same author, so a decision here separates roles; it is not a second party.') + C.pRaw('<b>Who did what.</b> The algorithms and the two statements are the labs’. The chain from OpenAI’s statement to Anthropic’s is Daniel Hawkley’s. D1 is complexitylib’s own proof, written by its AI agents. The statements of C1 and C2 were written by hand and pinned here before any proof was decided; their proofs were written by Claude agents in <a href="../claimbox/">claimbox</a>, the claimant. Every solid edge was decided here.')
    + '</div>' + (FIG_STD ? C.figure({ svgRaw: FIG_STD.svg, record: (FIG_STD.hkEdge ? [HK_REL, HKH_REL] : []).concat([D1_REL], STDR.c1 ? [C1_REL] : [], STDR.c2 ? [C2_REL] : []),
      stop: 'an edge’s word is not CERTIFIED or PROVED in its record, a tick is drawn for a check its record does not say accepted, C1 or C2 is drawn solid while a planted variant was not refused, or D1 does not build on complexitylib’s Lean',
      captionRaw: '<b>The chain toward a standard machine.</b> Solid edges are Lean implications decided here, ticked by the checks their records say accepted; a hollow box is a copy read across a version seam; ' + (FIG_STD.hkEdge ? 'the top edge is Daniel Hawkley’s chain from OpenAI’s statement, inside OpenAI’s Lean (' + ghRec(HKH_REL) + ', ' + ghRec(HK_REL) + '); ' : '') + '' + (STDR.c2 ? '' : 'the hatched gap is C2, not yet decided; ') + 'the dashed links to the textbook statement are readings. D1 is complexitylib’s own proof (' + ghRec(D1_REL) + ')' + (STDR.c1 ? '; C1 is claimbox’s, with its three planted wrong variants refused (' + ghRec(C1_REL) + ')' : '') + (STDR.c2 ? '; C2 is claimbox’s, from Anthropic’s statement, with its three planted wrong variants refused (' + ghRec(C2_REL) + ')' : '') + '.' }) : '')
    + '<div class="col">' + C.plainList(lane) + '</div>'
}));

/* §6 open, and who wrote this */
B.push(C.section({
  lab: '§6 · open', title: 'What this page does not say',
  bodyRaw: C.plainList([
    { b: 'It does not certify that ETH is false.', text: bridgeDone
      ? (C2DONE ? 'It decides that two proofs check against their own statements, proves in Lean that each statement refutes the textbook ETH in its own lab’s machine model, and decides the step from those statements to cslib’s standard multitape machine (§5b). It reads the Lean version seams between those steps, and that the multitape statement is the textbook ETH.' : 'It decides that two proofs check against their own statements, proves in Lean that each statement refutes the textbook ETH in its own lab’s machine model, and reads the model and encoding steps that remain.')
      : 'It decides that two proofs check against their own statements, and it reports two readings of what those statements mean.' },
    { b: 'The papers are not checked.', text: 'OpenAI’s Lean statement is its paper’s weaker Proposition 6.4, not the headline Theorem 1.1, and neither paper’s arguments outside Lean were read here for correctness.' },
    { b: 'The algorithms were not run.', text: 'Neither paper’s algorithm was run here against brute force on small formulas: Lean’s kernels already decide the formalized algorithms correct, and no run on small inputs can speak to a subexponential bound, which is the part in dispute.' },
    ...(freshOpen.length ? [{ b: 'A third replay is outstanding' + (freshDone.length ? ' for one claim.' : '.'), raw: freshWords() + '.' }] : []),
    { b: 'Who wrote this.', text: 'As the disclosure at the top says: tools written with Claude, one claim Anthropic’s, the deciders Comparator, Lean’s kernel and nanoda. Nothing here was shared with, run by or reviewed by either lab.' }
  ])
}));

/* §7 prior art the readings opened */
const PRIOR = [
  ['Impagliazzo, Paturi, Complexity of k-SAT (CCC 1999)', 'https://cseweb.ucsd.edu/~paturi/myPapers/pubs/ImpagliazzoPaturi_1999_ccc.pdf', 'the textbook s_k and ETH used above'],
  ['Dell, Husfeldt, Marx, Taslaman, Wahlén, Exponential Time Complexity of the Permanent and the Tutte Polynomial', 'https://arxiv.org/abs/1206.1775', 'the counting-preserving sparsification both papers use'],
  ['Austrin, Kaski, Kubjas, Tensor network complexity of multilinear maps', 'https://arxiv.org/abs/1712.09630', 'the tensor-network model Anthropic places its algorithm outside of'],
  ['Alman, Williams, Probabilistic Rank and Matrix Rigidity', 'https://arxiv.org/abs/1611.05558', 'low-degree polynomials equal to (−1)^{|z|} on a weight interval, as OpenAI’s M₀ does'],
  ['Björklund, Kaski, Williams, Generalized Kakeya Sets for Polynomial Evaluation (IPEC 2017)', 'https://doi.org/10.4230/LIPIcs.IPEC.2017.6', 'polynomial values recovered from tabulated curves, which OpenAI names as similar'],
  ['Williams, A new algorithm for optimal constraint satisfaction (ECCC TR04-032)', 'https://eccc.weizmann.ac.il/report/2004/032', 'split-and-list, cited by both'],
  ['Baez, The Octonions, §1', 'https://arxiv.org/abs/math/0105155', 'Degen’s and Graves’s eight-square identity, Anthropic’s eq. (12)']
];
for (const [, url] of PRIOR) if (!RTEXT.first.includes(url)) fail('a prior-art link the first reading did not open: ' + url);
B.push(C.section({
  lab: '§7 · prior art', title: 'Sources the first reading opened',
  bodyRaw: C.plainList(PRIOR.map(([t, url, why]) => ({ b: '', raw: '<a href="' + url + '" target="_blank" rel="noopener">' + C.esc(t) + '</a>: ' + C.esc(why) + '.' })))
}));

const foot = '<p>' + C.esc('Generated by apps/eth/build.js from certs/eth-kernel.json (sha256 ' + sha('certs/eth-kernel.json').slice(0, 16)
  + '…) and the two readings (' + sha(READ.first).slice(0, 12) + '…, ' + sha(READ.second).slice(0, 12) + '…)' + (BR ? ' and ' + BRIDGE_REL : '') + ', at git ' + git + '. MIT.') + '</p>';
const CSS = `
/* /eth/ (apps/eth/build.js): the five lines under the header, and the worry word on each premise */
.eth-five{margin-top:var(--s-7)}
.eth-w{display:block;color:var(--ink-3);font-weight:var(--weight-body)}
/* the two figures of §5: the letter under a tick */
.eth-fig .t-tk{font-size:var(--text-eyebrow);fill:var(--ink-3);letter-spacing:var(--track-slight)}
`;
let html = TPL.render({ title: 'Two claimed refutations of ETH, checked · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot, cssRaw: CSS,
  desc: 'OpenAI’s and Anthropic’s Lean proofs that the Exponential Time Hypothesis is false, replayed by two kernels against their own statements, and the statements read against the textbook ETH.',
  path: '/eth/', og: { image: '/og-eth.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('eth') } });
if (/name="robots" content="noindex/.test(html)) fail('the page is listed (2026-10-29) and must not carry noindex');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('site/eth/index.html written (listed): openai ' + OAI.word + ', anthropic ' + ANT.word + ', bridge ' + (BR ? 'recorded' : 'not yet run')
  + ', eq. (12) ' + E12.bad + '/' + E12.n + ' (control ' + E12c.bad + ') @ git ' + git);
