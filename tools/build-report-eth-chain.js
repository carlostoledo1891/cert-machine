#!/usr/bin/env node
/* build-report-eth-chain.js — reports/eth-chain.html: both AI labs' ETH proofs carried to a standard Turing machine in one
   Lean each, the focused page of the ETH model-gap lane (the operator, 2026-11-05: "One focused report"; the same evening,
   "ONE report page for both chains", the Anthropic-only page eth-anthropic-chain.html redirected here). Gaps first, then
   the chain figure, then every link with the record that decides it. Read from the records alone
   (certs/eth-chain.json, eth-openai-chain.json, eth-c2.json, eth-c1.json, eth-cslib-d1.json, eth-comparator.json,
   eth-hawkley-heavy.json, eth-hawkley-bridge.json, eth-kernel.json) and the figure apps/eth/build.js writes beside them
   (corpus/eth-refutation/figures/standard-chain.json): a figure whose records moved since it was drawn, a record whose
   word is not the one this page states, or a planted variant not refused, refuses the page.

   usage: node tools/build-report-eth-chain.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OUTREACH = require(path.join(ROOT, 'design', 'outreach.js'));   /* the complexitylib pull requests, read from the record */
const die = (m) => { console.error('ETH CHAIN REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const J = (rel) => { if (!fs.existsSync(path.join(ROOT, rel))) die('a record the page reads is gone: ' + rel); return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); };
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const esc = C.esc;
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + esc(rel) + '</span></a>';
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'open');

const R = { chain: 'certs/eth-chain.json', och: 'certs/eth-openai-chain.json', c2: 'certs/eth-c2.json', c1: 'certs/eth-c1.json', d1: 'certs/eth-cslib-d1.json', cmp: 'certs/eth-comparator.json',
  hkh: 'certs/eth-hawkley-heavy.json', hk: 'certs/eth-hawkley-bridge.json', kernel: 'certs/eth-kernel.json' };
const ch = J(R.chain), och = J(R.och), c2 = J(R.c2), c1 = J(R.c1), d1 = J(R.d1), cmp = J(R.cmp), hkh = J(R.hkh), hk = J(R.hk), kn = J(R.kernel);
for (const [k, r] of Object.entries({ chain: ch, 'the OpenAI chain': och, c2, c1, d1, comparator: cmp })) if (r.verdict !== 'CERTIFIED') die(k + ' is ' + r.verdict + ', and this page states it CERTIFIED');
if (hkh.word !== 'CERTIFIED' || hk.word !== 'CERTIFIED') die('Hawkley\'s chain is not CERTIFIED in its records');
for (const [k, r] of Object.entries({ chain: ch, 'the OpenAI chain': och, c2, c1 })) if (!Object.values(r.planted).every((p) => p.refused)) die(k + ': a planted variant was not refused');
if (!ch.judge.claim.okay || ch.judge.claim.accepted.length !== 6) die('the chain was not accepted by all six checkers');
/* the OpenAI chain's judge (the amendment of 2026-11-05 12:55 UTC in notes/eth-openai-chain-preregistration-2026-11-05.md): the
   named checkers accept, the planted statement is rejected, the shipped --paranoid run is in the record with its four stops */
const NAMED = ['Lean default', 'paranoid', 'nanoda-pinned', 'lean4lean-fuel'];
const oj = och.judge && och.judge.named;
if (!oj || !oj.chain || !oj.chain.okay || !NAMED.every((k) => oj.chain.accepted.includes(k))) die('the OpenAI chain was not accepted by the judge with its four named checkers');
if (!oj.planted || !oj.planted.mismatch) die('the OpenAI chain\'s planted statement was not rejected by the judge');
if (!och.judge.shipped || !och.judge.shipped.claim || Object.keys(och.judge.shipped.claim.stops || {}).length !== 4) die('the OpenAI chain record no longer carries the judge\'s four bundled stops');
if (!och.p3 || !och.p3.accepted) die('OpenAI\'s own challenge did not accept the ported proof, and this page says it did');
const ojReading = och.reading.find((x) => /did not finish on this export/.test(x));
if (!ojReading) die('the OpenAI chain record no longer says how its judge was re-run');
/* after the record: the con-leche story, told once in design/eth-masters.js (also read by /eth/), outside the decision */
const EM = require(path.join(ROOT, 'design', 'eth-masters.js'));
const omSentence = [EM.summary(och), EM.stops(och)].filter(Boolean).map((x) => ' ' + x).join('');
const omRerun = EM.rerun(och);
const FIG = J('corpus/eth-refutation/figures/standard-chain.json');
for (const [rel, sha] of Object.entries(FIG.stamp)) {
  const now = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
  if (now !== sha) die('the figure was drawn from another ' + rel + ': run node apps/eth/build.js first');
}
if (!FIG.stamp[R.chain] || !FIG.stamp[R.och]) die('the figure does not draw both chains');
const N = (x) => Number(x).toLocaleString('en-US');
const DEF = J('corpus/eth-refutation/definition-reading.json');
if (DEF.source.commit.slice(0, 8) !== ch.claim.builtOn.split(' ')[1].slice(0, 8)) die('the definition was read at another complexitylib commit than the chain builds on');
for (const k of ['ComplexityAbstracts.SubexponentialSATAbstract.not_seth', 'ComplexityAbstracts.SubexponentialSATAbstract.satExponent_eq_zero'])
  if (!(d1.axioms[k] || []).every((x) => ['propext', 'Classical.choice', 'Quot.sound'].includes(x)) || !(d1.axioms[k] || []).length) die('D1 does not carry ' + k + ' on the standard axioms, and the page says it does');
if (!(ch.judge.claim.okay && ch.judge.planted.mismatch)) die('the judge did not check the chain\'s type against the challenge');

const ant = kn.rows.find((r) => r.theorems.includes('MainResults.ethIsFalse'));
if (!ant || ant.word !== 'CERTIFIED') die('the kernel record does not hold Anthropic\'s ethIsFalse CERTIFIED');
const oai = kn.rows.find((r) => r.theorems.some((t) => /exact_count_and_sat$/.test(t)));
if (!oai || oai.word !== 'CERTIFIED') die('the kernel record does not hold OpenAI\'s exact_count_and_sat CERTIFIED');
const PLANTED = Object.keys(ch.planted).length + Object.keys(och.planted).length + Object.keys(c2.planted).length + Object.keys(c1.planted).length;

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the ETH model gap',
  title: 'Two AI labs’ ETH proofs, carried to a standard Turing machine in one Lean',
  deck: 'Two AI labs say a 1999 conjecture about how fast computers can solve hard problems is false. Their proofs check. The objection was that each proof runs on a computer of its own lab’s design. For both proofs, that objection now has a Lean answer: each reaches the textbook machine, every step checked in one place. The bridges and the ports are claimbox’s claims; cert-machine decided them and claims nothing of its own.'
}));
B.push(C.stats([
  { k: 'checkers that accept each chain', v: ch.judge.claim.accepted.length + ' · ' + oj.chain.accepted.length, n: 'Anthropic’s: all six of lake comparator --paranoid; OpenAI’s: the four its record names; nanoda and leanchecker --fresh besides' },
  { k: 'declarations under the chains', v: N(ch.nanoda.claim.declarations) + ' · ' + N(och.nanoda.claim.declarations), n: 'accepted by nanoda, a kernel written apart from Lean’s' },
  { k: 'files unchanged after the ports', v: ch.claim.port.byteIdentical + '/' + ch.claim.port.files + ' · ' + N(och.claim.port.byteIdentical) + '/' + N(och.claim.port.files), n: 'byte-identical; the other ' + ch.claim.port.modified + ' and ' + och.claim.port.modified + ' edited, each listed' },
  { k: 'planted wrong variants', v: '0 accepted', n: 'of ' + PLANTED + ' across the two chains, C2 and C1' },
]));

/* §0 the story, for a reader who arrives from a post: one minute, plain words, every number from the records */
B.push(C.section({
  lab: 'the story in one minute', title: 'What happened, and what I did', id: 'story',
  bodyRaw: C.pRaw('<b>The claim.</b> The Exponential Time Hypothesis, proposed by Impagliazzo and Paturi in 1999, says that some problems, like 3-SAT, cannot be solved much faster than trying every possibility: the time has to grow exponentially. Hundreds of results in computer science are built on it. In October 2026, OpenAI and Anthropic each published an AI-written proof that it is false, each checked by Lean, a program that verifies mathematical proofs line by line.')
    + C.pRaw('<b>The catch.</b> A proof checker only checks the statement it is given. Each lab stated its result about a computer of its own design, reading the input in its own format. Whether that is the computer of the textbooks, the multitape Turing machine every course teaches, was argued in a paragraph, not proved.')
    + C.pRaw('<b>Who claims, who decides.</b> Two repositories, one author, two roles. <a href="../claimbox/">claimbox</a> is the claimant: its Claude agents wrote every bridge and every port below, and it proposes them with their planted wrong variants. cert-machine is the judge: it pins the statements, decides each proposal from the bytes, refuses what fails, and claims nothing of its own. The separation is of roles, not of people, and the page says so wherever it matters.')
    + C.pRaw('<b>What I did.</b> With AI agents in claimbox, I wrote a Lean proof that Anthropic’s statement implies the hypothesis fails on a standard multitape Turing machine reading ordinary binary input, for every formula. Then I moved Anthropic’s own proof into the same Lean, ' + ch.claim.port.byteIdentical + ' of its ' + ch.claim.port.files + ' files unchanged, so every step from their proof to the textbook machine is checked in one place. Six proof checkers accepted it, four of them written apart from Lean’s own kernel.')
    + C.pRaw('<b>Then OpenAI’s side.</b> OpenAI’s proof ends at a statement of its own; Daniel Hawkley, a third party, had already proved in Lean that it implies Anthropic’s. I moved OpenAI’s proof and his two links into the same Lean as well, ' + N(och.claim.port.byteIdentical) + ' of ' + N(och.claim.port.files) + ' files unchanged, so OpenAI’s statement reaches the textbook machine through the same step. Lean’s judge accepted it, and so did OpenAI’s own challenge file, unchanged, against the ported proof. On this side the judge’s own list of checkers is shorter, for a reason written out below. Every one of ' + PLANTED + ' deliberately wrong versions I planted across the two chains was refused.')
    + C.pRaw('<b>What it means.</b> When an AI lab says “machine-checked”, the question is always what was checked. For both claims, the distance between the headline and the checked statement is now one definition wide: that the textbook’s ETH is this formal one. That last step is a reading of a definition, and always will be. The claims, the algorithms and the papers remain the labs’; this page checks the links, not the mathematics behind them.')
    + C.pRaw('The limits come next, then the picture, then every step with its record. The full argument is in the <a href="../paper/eth-chain.pdf">technical note (PDF)</a>.')
}));

/* §1 the gaps first */
B.push(C.section({
  lab: 'what stays open', title: 'What this does not settle', id: 'open',
  bodyRaw: C.plainList([
    { b: 'It does not say ETH is false.', text: 'The claims are the labs’, and so are their algorithms and their papers; neither paper’s arguments outside Lean nor the algorithms’ novelty were checked here. What is decided is that a Lean statement on a standard machine follows from each lab’s proof.' },
    { b: 'The textbook match is a reading.', text: 'That cslib’s multitape ETH, with complexitylib’s binary encoding encCNF and time c · 2^(δn) · (L+1)^e + c, is the ETH of Impagliazzo and Paturi is a reading of a definition. It is now a reading of a standard machine, and it always will be one.' },
    { b: 'The proofs are ported copies.', text: ch.reading[0] + ' OpenAI’s likewise: ' + och.reading[0].replace(/^The proof that checks here is a modified copy of OpenAI’s and Hawkley’s: /, '') },
    { b: 'On OpenAI’s side the judge’s list is shorter.', text: ojReading + omSentence + ' On Anthropic’s side all six accepted.' },
    { b: 'The judge ran without its sandbox.', text: ch.reading[2] },
    { b: 'One author on both sides.', text: 'The statements were written by hand and pinned before any proof was decided; the proofs and the port were written by Claude agents in claimbox; cert-machine decided them. claimbox and cert-machine have one author, so this separates the roles of author and checker. It is not a second party, and an outside replay of the records below would be the next step up.' },
    ...(omRerun ? [{ b: 'Check it yourself.', text: omRerun.text }] : [])
  ])
}));

/* §2 the figure, with the grammar's legend (check-wiring: a page that draws the grammar prints its legend) */
B.push(C.section({
  lab: 'the picture', title: 'From each lab’s statement to a standard machine', id: 'chain', wide: true,
  bodyRaw: '<div class="col">' + W.legendHtml({ compact: true }) + '</div>' + C.figure({ svgRaw: FIG.svg, record: Object.keys(FIG.stamp),
    stop: 'a record it was drawn from has moved since apps/eth/build.js drew it, or any link’s word is not CERTIFIED',
    captionRaw: '<b>The two chains toward a standard machine</b>, as on <a href="../eth/#standard">/eth/</a>. Solid edges are Lean implications decided here, ticked by the checks their records say accepted (C Lean’s judge: six checkers on Anthropic’s chain, the four named in its record on OpenAI’s; K Lean’s kernel; N nanoda; L leanchecker --fresh); a dashed box is a copy read across a version seam, kept for Hawkley’s chain inside OpenAI’s own Lean; the dashed links to the textbook statement are readings.' })
}));

/* the definition the chain ends at, read clause by clause (a reading, marked as one) */
B.push(C.section({
  lab: 'the definition', title: 'Where the chain ends, read against the textbook', id: 'definition', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('<b>The port cannot change what the theorem says.</b> The final statement, ¬ETH, mentions only complexitylib’s and cslib’s definitions: the library’s own audit (<span class="m">#check_abstract</span>, run at every build) admits nothing beyond its encoding module into them, and Lean’s judge checked that the theorem’s type is the pinned challenge’s, which imports nothing from the port. None of the ' + ch.claim.port.modified + ' edited files can change what <span class="m">not_eth</span> means.')
    + C.pRaw('That definition, clause by clause, against Impagliazzo and Paturi (2001). This column is a reading, not a decision; only the time bound needs the judgment of the people who wrote the definition.') + '</div>'
    + C.table({ cols: [{ h: 'clause' }, { h: 'the standard ETH' }, { h: 'complexitylib’s ETH' }, { h: 'our reading' }],
      rows: DEF.rows.map((r) => [{ raw: '<b>' + esc(r.clause) + '</b>' }, r.standard, r.lean, r.reading === 'same' ? 'same' : { raw: '<b>' + esc(r.reading.split(':')[0]) + '</b>' + (r.reading.includes(':') ? esc(':' + r.reading.split(':').slice(1).join(':')) : '') }]) })
    + '<div class="col">' + C.plainList([
      { b: 'ETH only, not SETH.', text: 'The same file also states ¬SETH and that the SAT exponent is 0 for every clause width; complexitylib’s own proof (D1) proves those. The chain from Anthropic’s statement decides ¬ETH only.' },
      { b: 'Who wrote the target.', text: 'The definition was written by ' + DEF.source.authors.split(' (')[0] + ', in a library built largely by AI agents and audited by #check_abstract. It is a neutral, checked library, but a reader judging independence should know that the target was co-written by OpenAI.' },
      { b: 'Two complexitylib commits.', text: 'D1 decided complexitylib at ' + d1.claim.commit.slice(0, 8) + '; the bridge builds on ' + DEF.source.commit.slice(0, 8) + ', a later commit. The first is an ancestor of the second, both pin the same Lean, cslib and Mathlib, and the files that define the statement are byte-identical between them.' },
      { b: 'Offered upstream.', raw: OUTREACH.complexitylibPRs() },
    ]) + '</div>'
}));

/* §3 every link */
B.push(C.section({
  lab: 'the details', title: 'Each step, and the record that decides it', id: 'links', wide: true,
  bodyRaw: C.table({ cols: [{ h: 'step' }, { h: 'what it proves' }, { h: 'proof by' }, { h: 'decided here' }],
    rows: [
      ['Anthropic’s proof', 'MainResults.ethIsFalse, in Anthropic’s own Lean (v4.33.1)', 'Anthropic', { raw: tag(ant.word) + '<br><span class="small">' + rec(R.kernel) + '</span>' }],
      ['the Anthropic chain', 'the same proof, ported, proves the same ETHIsFalse in complexitylib’s Lean (v4.36.0-rc2), and with C2 gives ¬ETH there', 'Claude agents in claimbox (the port); Anthropic (the proof)', { raw: tag(ch.verdict) + '<br><span class="small">nanoda ' + N(ch.nanoda.claim.declarations) + ' · six checkers · ' + rec(R.chain) + '</span>' }],
      ['OpenAI’s proof', 'exact_count_and_sat, in OpenAI’s own Lean (v4.34.1)', 'OpenAI', { raw: tag(oai.word) + '<br><span class="small">' + rec(R.kernel) + '</span>' }],
      ['the OpenAI chain', 'OpenAI’s proof and Hawkley’s two links, ported, prove the same ETHIsFalse in complexitylib’s Lean, and with C2 give ¬ETH there; OpenAI’s own challenge file, unchanged, accepts the ported proof', 'Claude agents in claimbox (the port); OpenAI and Daniel Hawkley (the proofs)', { raw: tag(och.verdict) + '<br><span class="small">nanoda ' + N(och.nanoda.claim.declarations) + ' · four named checkers (six as shipped: two accept, four stop) · ' + rec(R.och) + '</span>' }],
      ['C2', 'Anthropic’s ETHIsFalse implies ETH is false on cslib’s multitape machine with encCNF, for every formula', 'Claude agents in claimbox', { raw: tag(c2.verdict) + '<br><span class="small">nanoda ' + N(c2.nanoda.claim.declarations) + ' · six checkers (' + rec(R.cmp) + ') · ' + rec(R.c2) + '</span>' }],
      ['Hawkley’s chain', 'OpenAI’s exact_count_and_sat implies ETHIsFalse, inside OpenAI’s Lean (v4.34.1); replayed there first, then ported inside the OpenAI chain', 'Daniel Hawkley', { raw: tag(hkh.word) + '<br><span class="small">' + rec(R.hkh) + ' · ' + rec(R.hk) + '</span>' }],
      ['D1', 'complexitylib’s native ¬ETH on cslib’s multitape machine (a re-proof, not a bridge)', 'complexitylib’s AI agents', { raw: tag(d1.verdict) + '<br><span class="small">' + rec(R.d1) + '</span>' }],
      ['C1', 'ETH is false on the word RAM at logarithmic word size, from complexitylib’s proof', 'Claude agents in claimbox', { raw: tag(c1.verdict) + '<br><span class="small">six checkers · ' + rec(R.c1) + '</span>' }],
    ] })
}));

/* §4 how to re-run */
B.push(C.section({
  lab: 'check it yourself', title: 'How to check this yourself', id: 'rerun',
  bodyRaw: C.plainList([
    { b: 'Build.', raw: 'Clone <a href="https://github.com/carlostoledo1891/claimbox/tree/' + C.escAttr(ch.claim.commit) + '/lean/eth-bridge">claimbox at ' + esc(ch.claim.commit.slice(0, 7)) + '</a>, enter <span class="m">lean/eth-bridge</span>, run <span class="m">lake exe cache get</span> and <span class="m">lake build EthBridge.AnthropicChain</span> (about ten minutes over Mathlib’s cache on a laptop).' },
    { b: 'Build the OpenAI chain.', raw: 'In the same checkout at <a href="https://github.com/carlostoledo1891/claimbox/tree/' + C.escAttr(och.claim.commit) + '/lean/eth-bridge">' + esc(och.claim.commit.slice(0, 7)) + '</a>, <span class="m">lake build EthBridge.OpenAIChain</span> (about ' + Math.round(och.steps.buildSeconds / 60) + ' minutes on 16 vCPU with 128 GB; the closure is ' + N(och.claim.port.files) + ' files).' },
    { b: 'Check the statements.', raw: 'The trusted statements are pinned in ' + rec('corpus/eth-refutation/chain/statement.lean') + ' and ' + rec('corpus/eth-refutation/openai-chain/statement.lean') + '; <span class="m">EthBridge/Anthropic/MainResults.lean</span> must hash to Anthropic’s published sha256 47f78a95…' },
    { b: 'Judge them.', raw: 'Our pod scripts ' + rec('tools/runpod-eth-chain.sh') + ' and ' + rec('tools/runpod-eth-openai-chain.sh') + ' run every step on a plain Ubuntu machine: our own axioms file, nanoda through lean4export, leanchecker --fresh, and lake comparator. The facts of our runs are in ' + rec(ch.run.facts) + ' and ' + rec(och.run.facts) + ' (the OpenAI chain’s judge with named checkers in ' + rec(och.judge.named.facts) + ', its by-hand diagnosis beside it).' },
    { b: 'Read the note.', raw: 'The same result as a short technical note, every number read from the records: <a href="../paper/eth-chain.pdf">A formal bridge from two refutations of the Exponential Time Hypothesis to a standard multitape Turing machine</a> (PDF, not peer-reviewed).' },
    { b: 'Read the ports.', raw: 'Every file of either proof that changed is listed with both hashes: <a href="https://github.com/carlostoledo1891/claimbox/blob/' + C.escAttr(ch.claim.commit) + '/lean/eth-bridge/AnthropicEth/PORT.md">AnthropicEth/PORT.md</a> and <a href="https://github.com/carlostoledo1891/claimbox/blob/' + C.escAttr(och.claim.commit) + '/lean/eth-bridge/OpenAIEth/PORT.md">OpenAIEth/PORT.md</a>.' },
  ])
}));

const foot = '<p>' + esc('Generated by tools/build-report-eth-chain.js from ' + Object.values(R).join(', ') + ' and the figure apps/eth/build.js wrote @ git ' + git + '. Statements by hand; proofs by Claude agents in claimbox; decided by cert-machine. Built with Claude (Anthropic).') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'eth-chain.html'), TPL.render({
  title: 'Two AI labs’ ETH proofs, carried to a standard Turing machine in one Lean · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'OpenAI’s and Anthropic’s Lean proofs that the Exponential Time Hypothesis is false, each ported to one Lean and carried to a standard multitape Turing machine with a binary encoding: every step checked there by Lean’s judge, nanoda and leanchecker --fresh; what stays open first.',
  path: '/reports/eth-chain.html', og: { image: '/og-eth-chain.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('eth-chain') }
}));
console.log('reports/eth-chain.html written: Anthropic chain ' + ch.verdict + ' (six checkers, nanoda ' + ch.nanoda.claim.declarations + '), OpenAI chain ' + och.verdict + ' (' + oj.chain.accepted.length + ' named checkers, nanoda ' + och.nanoda.claim.declarations + ') @ git ' + git);
