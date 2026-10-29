#!/usr/bin/env node
/* build.js — site/eth/index.html: the two claimed refutations of the Exponential Time Hypothesis (OpenAI, openai/math
   family 378; Anthropic, anthropics/formal-math eth/), as far as this repository has checked them: DECIDED (both
   proofs, by two kernels, against each claim's own statement), READ (what each statement says, by two readers who did
   not see each other's work), COMPARED (side by side) and OPEN. Unlisted (noindex, in no index or sitemap) until the
   operator has read it (2026-10-28).

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
const TS_REL = 'certs/eth-tsavo-bridge.json';
const TS = fs.existsSync(path.join(ROOT, TS_REL)) ? J(TS_REL) : null;
if (TS && TS.word === 'CERTIFIED' && !TS.axiomsPrinted.every((a) => a.axioms.every((x) => STD.includes(x)))) fail(TS_REL + ' is CERTIFIED with an axiom outside the three standard ones');
const thm = (proj, short) => BR.projects[proj].theorems.find((t) => t.name.endsWith('.' + short)) || fail('the bridge record has no theorem ' + short);
const bridgeThms = bridgeDone ? new Set(['openai', 'anthropic'].flatMap((k) => BR.projects[k].theorems.map((t) => t.name))).size : 0;

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
const secs = (r) => fmt(r.steps.comparator.seconds) + ' s';
B.push(C.header({
  eyebrow: 'Carlos Toledo · cert-machine · unlisted draft',
  title: 'Two claimed refutations of the Exponential Time Hypothesis: what was decided, and what was only read',
  deck: 'OpenAI and Anthropic each published a Lean proof meant to show that ETH is false. Here both proofs were '
    + 'replayed from their pinned bytes, and two kernels accepted each one against its own statement. A kernel cannot '
    + 'say what a statement means. Whether each statement says “ETH is false” was read by two independent readers, '
    + 'and the page keeps the two kinds of check apart.'
}));
B.push(C.tldr({
  findingRaw: 'Both proofs check: Comparator accepts each against its own challenge statement, Lean’s kernel and nanoda '
    + 'both accept, and only ' + STD.map(C.m).join(', ') + ' are used. Anthropic’s statement is ETH’s negation itself, '
    + 's₃ = 0 for Mathlib’s Turing machines. OpenAI’s statement is a running-time bound, the paper’s weaker Proposition 6.4: '
    + 'it defines no ETH, and the step from it to “ETH is false” is prose.'
    + (bridgeDone ? ' Our Lean bridge closes that gap: the textbook ETH written once, and a proof that each lab’s statement refutes it in that lab’s own machine model.' : '')
    + (TS && TS.word === 'CERTIFIED' ? ' A third party’s Lean join of the two models (OpenAI’s statement implies Anthropic’s ETHIsFalse), replayed here by both kernels, checks too.' : ''),
  mechanismRaw: 'Every file pinned by sha256 before any run (' + fmt(OAI.pinnedFiles) + ' and ' + fmt(ANT.pinnedFiles) + '); '
    + 'Comparator, the Lean FRO’s judge, on one rented CPU machine; nanoda, a second kernel written independently of Lean’s, '
    + 'switched on for both. Two readings of the statements against the papers, each written without the other.',
  checkRaw: ln('certs/eth-kernel.json') + ' (the decision), ' + ln(READ.first, 'the first reading') + ', '
    + ln(READ.second, 'the second reading') + ', and the pod script ' + C.m('tools/runpod-eth.sh') + ' to run it again.'
}));
B.push(C.stats([
  { k: 'proofs decided', v: K.counts.decided + ' of ' + K.counts.of, n: 'CERTIFIED, each against its own statement' },
  { k: 'kernels that accept each', v: String(OAI.kernels.length), n: 'Lean’s, inside Comparator, and nanoda' },
  { k: 'Comparator, OpenAI', v: secs(OAI), n: 'peak ' + Math.round(OAI.steps.comparator.containerPeakKB / 1048576) + ' GiB in the container' },
  { k: 'Comparator, Anthropic', v: secs(ANT), n: 'peak ' + Math.round(ANT.steps.comparator.containerPeakKB / 1048576) + ' GiB in the container' }
].concat(bridgeDone ? [{ k: 'bridge theorems, ours', v: String(bridgeThms), n: 'proved in Lean, one kernel; §5' }] : [])));

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
    + C.pRaw('<b>Not run:</b> ' + C.m('leanchecker --fresh') + ', an optional third replay, on either claim. The machine was deleted after the two kernels had decided, because it was billing unattended (' + ln('corpus/eth-refutation/POD.txt') + ').')
    + '</div>'
}));

/* §2 the premise chain from "the proofs check" to "ETH is false" */
const premises = [
  bridgeDone ? { grade: W.ASSUMED, label: 'Our Lean ETH says what Impagliazzo and Paturi say',
    evidence: 'read: s_k is the infimum of the δ for which k-SAT has an O(2^{δn}) algorithm, and ETH is s_k > 0 for every k ≥ 3, transcribed from CCC 1999, p. 1. A model fixes the machine, the formulas and the input word; the four definitions then read the same in every model (' + C.m('ETHBridge/Generic.lean') + ', byte-identical in both projects).' } : null,
  bridgeDone ? null : { grade: W.ASSUMED, label: 'OpenAI’s theorem implies that ETH is false',
    evidence: 'read, not run. OpenAI’s Lean file defines no ETH; both readers carried its bound to s₃ = 0 by hand ('
      + C.esc(said('first', 'Confidence ≈ 0.95')) + ' in the first reading, ' + C.esc(said('second', 'Confidence: high (≈0.9)')) + ' in the second). The Lean bridge, §5, is written to decide this step.' },
  bridgeDone ? null : { grade: W.ASSUMED, label: 'Anthropic’s ETHIsFalse is the textbook ETH’s negation',
    evidence: 'read. It is literally s₃ = 0, the infimum taken over Mathlib’s FinTM2 machines on its own input words; both readers found no loophole ('
      + C.esc(said('first', 'Confidence ≈ 0.95, on B1′ and B2′')) + '; ' + C.esc(said('second', 'Confidence: high (≈0.95)')) + ').' },
  { grade: W.ASSUMED, label: 'A machine step costs O(1) in the textbook’s model',
    evidence: 'textbook, in neither lab’s Lean: a PrimitiveMachine or FinTM2 step is a bounded number of tape or stack operations, so a word RAM or a multitape machine simulates it at constant cost per step. Both papers state it in prose.' },
  { grade: W.ASSUMED, label: 'A textbook 3-CNF becomes each input word in polynomial time',
    evidence: 'textbook, in neither lab’s Lean: deduplicate, sort, pad and write the word. A polynomial factor keeps 2^{o(n)} at 2^{o(n)}.' },
  { grade: W.ASSUMED, label: 'What the decision itself trusts',
    evidence: brk(C.esc(K.trustBase)) + '. The sandbox ran best-effort: Landlock was unreadable inside the container.' }
].filter(Boolean);
B.push(C.section({
  lab: '§2 · what it rests on', title: 'From “the proofs check” to “ETH is false”', id: 'premises',
  bodyRaw: C.pRaw(bridgeDone
      ? 'The proofs are decided by two kernels, and the step from each statement to “ETH is false in that lab’s own model” is proved in Lean here (§5, one kernel). What still stands between them and the sentence “ETH is false” is a premise, listed in the order the claim travels through it, each with where its checking stopped:'
      : 'The proofs are decided. Everything between them and the sentence “ETH is false” is a premise, listed in the order the claim travels through it, each with where its checking stopped:')
    + W.premisesHtml(premises.map((p) => Object.assign({}, p, { label: C.esc(p.label) })), {
      meetLine: bridgeDone
        ? 'The weakest premise is <b>assumed</b>. Our Lean ETH is a transcription of the textbook’s, read, and the model and encoding steps are textbook and in no one’s Lean. So this page decides that both proofs check, proves that each statement refutes ETH in its own lab’s model, and reads, without deciding, that ETH is false in the textbook’s model-free sense.'
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

/* §5 the bridge */
const leanM = (t) => '<span class="m">' + brk(C.esc(t.replace(/\s+/g, ' '))) + '</span>';
function bridgeBody() {
  const BO = BR.bridges.openai.theorem, BA = BR.bridges.anthropic.theorem;
  const L1 = thm('openai', 'bitLength_succ_le'), L2 = thm('openai', 'count_pos_iff'), L3 = thm('openai', 'bound_le');
  const LS = thm('anthropic', 's_eq');
  const bridgeItem = (who, model, t, proj) => ({ b: who + '.', raw: C.esc(model) + ': ' + leanM(t.statement)
    + ' — ' + (t.axioms.length === 3 ? 'the three standard axioms' : C.esc(t.axioms.join(', '))) + '; '
    + C.esc(BR.projects[proj].toolchain.replace('leanprover/lean4:', 'Lean ')) + ', built in ' + BR.projects[proj].buildSeconds + ' s.' });
  return '<div class="col">'
    + C.pRaw('The textbook definition is written once, in ' + ln('corpus/eth-refutation/bridge/openai/ETHBridge/Generic.lean', 'Generic.lean') + ' (sha256 ' + C.esc(BR.generic.sha256.slice(0, 12)) + '…, byte-identical in both projects). A model fixes four things: what a machine is, which formulas are k-SAT instances, the input word a formula is written as, and what “halts within t steps with answer b” means. Then s_k, the infimum of the δ for which k-SAT is decided within ⌊c·2^{δn}⌋ steps for every n, and ETH, s_k > 0 for every k ≥ 3, read the same in every model. Each lab’s statement is then proved to refute ETH in that lab’s own model:')
    + C.plainList([bridgeItem('OpenAI', 'its PrimitiveMachine, sets of clauses of width ≤ k, encodeCNF', BO, 'openai'),
      bridgeItem('Anthropic', 'Mathlib’s FinTM2, duplicate-free clause lists, encClauses', BA, 'anthropic')])
    + C.pRaw('<b>OpenAI.</b> ' + C.esc(BR.bridges.openai.reads) + ' The three steps both readers did by hand are Lean lemmas now: the input word is polynomial in n, ' + leanM(L1.statement.replace(/^theorem\s+/, '')) + '; the halting answer decides satisfiability, ' + leanM(L2.statement.replace(/^theorem\s+/, '')) + '; and the running-time bound is at most c·2^{δn} for every n, ' + leanM(L3.statement.replace(/^theorem\s+/, '')) + '.')
    + C.pRaw('<b>Anthropic.</b> ' + C.esc(BR.bridges.anthropic.reads) + ' In Lean: ' + leanM(LS.statement.replace(/^theorem\s+/, '')) + '.')
    + C.pRaw('<b>How the statements were copied.</b> OpenAI’s challenge file is carried with one declared change: its open theorem ' + C.m('exact_count_and_sat') + ' becomes the proposition ' + C.m('OpenAIClaim') + ', and undoing that change gives back the pinned sha256 ' + C.esc(BR.copies.openai.rebuiltSha256.slice(0, 12)) + '…. Anthropic’s ' + C.m('MainResults.lean') + ' is carried unchanged (' + C.esc(BR.copies.anthropic.rebuiltSha256.slice(0, 12)) + '…). §1 decided that OpenAI’s proof proves exactly that statement, so the two together give ¬ETH in OpenAI’s model. The join is the identity of the statement’s bytes, not one Lean term: the bridge does not import OpenAI’s proof.')
    + C.pRaw('<b>Checked by one kernel.</b> Lean’s, inside ' + C.m('lake build') + ' on GitHub’s runners (<a href="' + C.escAttr(BR.run.url) + '">run ' + BR.run.id + '</a>); no ' + C.m('sorry') + ', no axiom declared, no ' + C.m('native_decide') + ' (' + ln(BRIDGE_REL) + ', ' + ln('corpus/eth-refutation/bridge/README.md', 'the README') + '). No second kernel has replayed the bridge.')
    + C.pRaw('<b>Not proved, and said so:</b>')
    + C.plainList(BR.notProved.map((t) => ({ b: '', text: t })))
    + (TS ? tsavoBody() : '')
    + '</div>';
}
function tsavoBody() {
  const short = TS.claim.repository.replace('https://github.com/', '') + ' @ ' + TS.claim.commit.slice(0, 8);
  return C.pRaw('<b>The step between the two models, joined by someone else, and replayed here: ' + C.esc(TS.word) + '.</b> '
      + '<a href="' + C.escAttr(TS.claim.repository + '/tree/' + TS.claim.commit) + '" target="_blank" rel="noopener">' + C.esc(short) + '</a> '
      + '(TSavo; written with Claude, per its README) proves ' + leanM('Bridge.ethIsFalse_of_claim : OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim → MainResults.ETHIsFalse') + ': '
      + 'OpenAI’s machine compiled into Anthropic’s, and OpenAI’s input word produced from Anthropic’s, so OpenAI’s statement refutes ETH in Anthropic’s FinTM2 model too. '
      + 'Replayed on GitHub’s runners (<a href="' + C.escAttr(TS.run.url) + '">run ' + TS.run.id + '</a>): ' + C.esc(TS.why).replace(/`([^`]+)`/g, '<span class="m">$1</span>') + ' (' + ln(TS_REL) + ').')
    + C.pRaw('<b>Its gaps, first:</b>')
    + C.plainList(TS.gaps.map((g) => ({ b: '', raw: brk(C.esc(g)).replace(/`([^`]+)`/g, '<span class="m">$1</span>') })));
}
B.push(C.section({
  lab: '§5 · the bridge', title: 'One textbook ETH in Lean, and each statement against it', id: 'bridge',
  bodyRaw: bridgeDone
    ? bridgeBody()
    : C.pRaw(W.value('not yet run', W.REFUSED) + '. The gap both readers found is OpenAI’s: its Lean has no ETH. The bridge is the textbook definition (s_k as an infimum, ETH as s_k > 0 for k ≥ 3), written once in Lean and instantiated in each lab’s own machine and encoding, with a proof that OpenAI’s theorem implies its negation there, and that Anthropic’s ETHIsFalse does. It is being built on GitHub’s runners. The steps between machine models and encodings, §2’s third and fourth premises, stay prose for both labs.')
      + W.legendHtml({ compact: true, exclude: [W.COMPUTED, W.CHOSEN] })
}));

/* §6 open, and who wrote this */
B.push(C.section({
  lab: '§6 · open', title: 'What this page does not say',
  bodyRaw: C.plainList([
    { b: 'It does not certify that ETH is false.', text: bridgeDone
      ? 'It decides that two proofs check against their own statements, proves in Lean that each statement refutes the textbook ETH in its own lab’s machine model, and reads the model and encoding steps that remain.'
      : 'It decides that two proofs check against their own statements, and it reports two readings of what those statements mean.' },
    { b: 'The papers are not checked.', text: 'OpenAI’s Lean statement is its paper’s weaker Proposition 6.4, not the headline Theorem 1.1, and neither paper’s arguments outside Lean were read here for correctness.' },
    { b: 'A third replay is outstanding.', text: 'leanchecker --fresh was not run on either claim.' },
    { b: 'Who wrote this.', text: 'This repository’s tools are built with Claude, Anthropic’s model, and one of the two claims is Anthropic’s. Nothing here was shared with, run by or reviewed by either lab, and neither lab’s code decided anything on this page: the deciders are Comparator (the Lean FRO) and nanoda, and the readings are our own.' }
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
let html = TPL.render({ title: 'Two claimed refutations of ETH, checked · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'OpenAI’s and Anthropic’s Lean proofs that the Exponential Time Hypothesis is false, replayed by two kernels against their own statements, and the statements read against the textbook ETH.',
  path: '/eth/' });
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('site/eth/index.html written (unlisted): openai ' + OAI.word + ', anthropic ' + ANT.word + ', bridge ' + (BR ? 'recorded' : 'not yet run')
  + ', eq. (12) ' + E12.bad + '/' + E12.n + ' (control ' + E12c.bad + ') @ git ' + git);
