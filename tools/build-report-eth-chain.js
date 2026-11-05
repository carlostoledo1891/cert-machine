#!/usr/bin/env node
/* build-report-eth-chain.js — reports/eth-anthropic-chain.html: Anthropic's ETH proof carried to a standard Turing machine
   in one Lean, the focused page of the ETH model-gap lane (the operator, 2026-11-05: "One focused report"). Gaps first,
   then the chain figure, then every link with the record that decides it. Read from the records alone
   (certs/eth-chain.json, eth-c2.json, eth-c1.json, eth-cslib-d1.json, eth-comparator.json, eth-hawkley-heavy.json,
   eth-hawkley-bridge.json, eth-kernel.json) and the figure apps/eth/build.js writes beside them
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
const die = (m) => { console.error('ETH CHAIN REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const J = (rel) => { if (!fs.existsSync(path.join(ROOT, rel))) die('a record the page reads is gone: ' + rel); return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); };
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const esc = C.esc;
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + esc(rel) + '</span></a>';
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'open');

const R = { chain: 'certs/eth-chain.json', c2: 'certs/eth-c2.json', c1: 'certs/eth-c1.json', d1: 'certs/eth-cslib-d1.json', cmp: 'certs/eth-comparator.json',
  hkh: 'certs/eth-hawkley-heavy.json', hk: 'certs/eth-hawkley-bridge.json', kernel: 'certs/eth-kernel.json' };
const ch = J(R.chain), c2 = J(R.c2), c1 = J(R.c1), d1 = J(R.d1), cmp = J(R.cmp), hkh = J(R.hkh), hk = J(R.hk), kn = J(R.kernel);
for (const [k, r] of Object.entries({ chain: ch, c2, c1, d1, comparator: cmp })) if (r.verdict !== 'CERTIFIED') die(k + ' is ' + r.verdict + ', and this page states it CERTIFIED');
if (hkh.word !== 'CERTIFIED' || hk.word !== 'CERTIFIED') die('Hawkley\'s chain is not CERTIFIED in its records');
for (const [k, r] of Object.entries({ chain: ch, c2, c1 })) if (!Object.values(r.planted).every((p) => p.refused)) die(k + ': a planted variant was not refused');
if (!ch.judge.claim.okay || ch.judge.claim.accepted.length !== 6) die('the chain was not accepted by all six checkers');
const FIG = J('corpus/eth-refutation/figures/standard-chain.json');
for (const [rel, sha] of Object.entries(FIG.stamp)) {
  const now = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
  if (now !== sha) die('the figure was drawn from another ' + rel + ': run node apps/eth/build.js first');
}
if (!FIG.stamp[R.chain]) die('the figure does not draw the chain');
const N = (x) => Number(x).toLocaleString('en-US');
const ant = kn.rows.find((r) => r.theorems.includes('MainResults.ethIsFalse'));
if (!ant || ant.word !== 'CERTIFIED') die('the kernel record does not hold Anthropic\'s ethIsFalse CERTIFIED');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the ETH model gap',
  title: 'Anthropic’s ETH proof, carried to a standard Turing machine in one Lean',
  deck: 'Two AI labs say a 1999 conjecture about how fast computers can solve hard problems is false. Their proofs check. The objection was that each proof runs on a computer of its own lab’s design. For Anthropic’s proof, that objection now has a Lean answer: it reaches the textbook machine.'
}));
B.push(C.stats([
  { k: 'checkers that accept the chain', v: String(ch.judge.claim.accepted.length), n: 'Lean’s judge, lake comparator --paranoid; nanoda and leanchecker --fresh besides' },
  { k: 'declarations under the chain', v: N(ch.nanoda.claim.declarations), n: 'accepted by nanoda, a kernel written apart from Lean’s' },
  { k: 'files of Anthropic’s proof', v: ch.claim.port.byteIdentical + ' of ' + ch.claim.port.files, n: 'byte-identical after the port; the other ' + ch.claim.port.modified + ' edited, each listed' },
  { k: 'planted wrong variants', v: '0 accepted', n: 'of ' + (Object.keys(ch.planted).length + Object.keys(c2.planted).length + Object.keys(c1.planted).length) + ' across the chain, C2 and C1' },
]));

/* §0 the story, for a reader who arrives from a post: one minute, plain words, every number from the records */
B.push(C.section({
  lab: 'the story in one minute', title: 'What happened, and what I did', id: 'story',
  bodyRaw: C.pRaw('<b>The claim.</b> The Exponential Time Hypothesis, proposed by Impagliazzo and Paturi in 1999, says that some problems, like 3-SAT, cannot be solved much faster than trying every possibility: the time has to grow exponentially. Hundreds of results in computer science are built on it. In October 2026, OpenAI and Anthropic each published an AI-written proof that it is false, each checked by Lean, a program that verifies mathematical proofs line by line.')
    + C.pRaw('<b>The catch.</b> A proof checker only checks the statement it is given. Each lab stated its result about a computer of its own design, reading the input in its own format. Whether that is the computer of the textbooks, the multitape Turing machine every course teaches, was argued in a paragraph, not proved.')
    + C.pRaw('<b>What I did.</b> With AI agents, I wrote a Lean proof that Anthropic’s statement implies the hypothesis fails on a standard multitape Turing machine reading ordinary binary input, for every formula. Then I moved Anthropic’s own proof into the same Lean, ' + ch.claim.port.byteIdentical + ' of its ' + ch.claim.port.files + ' files unchanged, so every step from their proof to the textbook machine is checked in one place. Six proof checkers accepted it, four of them written apart from Lean’s own kernel, and every one of ' + (Object.keys(ch.planted).length + Object.keys(c2.planted).length + Object.keys(c1.planted).length) + ' deliberately wrong versions I planted was refused.')
    + C.pRaw('<b>What it means.</b> When an AI lab says “machine-checked”, the question is always what was checked. For Anthropic’s claim, the distance between the headline and the checked statement is now one definition wide: that the textbook’s ETH is this formal one. That last step is a reading of a definition, and always will be. The claim, the algorithm and the paper remain Anthropic’s; this page checks the link, not the mathematics behind it.')
    + C.pRaw('The limits come next, then the picture, then every step with its record. The full argument is in the <a href="../paper/eth-chain.pdf">technical note (PDF)</a>.')
}));

/* §1 the gaps first */
B.push(C.section({
  lab: 'what stays open', title: 'What this does not settle', id: 'open',
  bodyRaw: C.plainList([
    { b: 'It does not say ETH is false.', text: 'The claim is Anthropic’s, and so are its algorithm and its paper; neither the paper’s arguments outside Lean nor the algorithm’s novelty were checked here. What is decided is that a Lean statement on a standard machine follows from Anthropic’s proof.' },
    { b: 'The textbook match is a reading.', text: 'That cslib’s multitape ETH, with complexitylib’s binary encoding encCNF and time c · 2^(δn) · (L+1)^e + c, is the ETH of Impagliazzo and Paturi is a reading of a definition. It is now a reading of a standard machine, and it always will be one.' },
    { b: 'The proof is a ported copy.', text: ch.reading[0] },
    { b: 'OpenAI’s side still crosses a seam.', text: ch.reading[1] + ' A port of OpenAI’s proof into the same Lean would close it; it is large and not done.' },
    { b: 'The judge ran without its sandbox.', text: ch.reading[2] },
    { b: 'One author on both sides.', text: 'The statements were written by hand and pinned before any proof was decided; the proofs and the port were written by Claude agents in claimbox; cert-machine decided them. claimbox and cert-machine have one author, so this separates the roles of author and checker. It is not a second party, and an outside replay of the records below would be the next step up.' },
  ])
}));

/* §2 the figure, with the grammar's legend (check-wiring: a page that draws the grammar prints its legend) */
B.push(C.section({
  lab: 'the picture', title: 'From each lab’s statement to a standard machine', id: 'chain', wide: true,
  bodyRaw: '<div class="col">' + W.legendHtml({ compact: true }) + '</div>' + C.figure({ svgRaw: FIG.svg, record: Object.keys(FIG.stamp),
    stop: 'a record it was drawn from has moved since apps/eth/build.js drew it, or any link’s word is not CERTIFIED',
    captionRaw: '<b>The chain toward a standard machine</b>, as on <a href="../eth/#standard">/eth/</a>. Solid edges are Lean implications decided here, ticked by the checks their records say accepted (C Lean’s judge with six checkers, K Lean’s kernel, N nanoda, L leanchecker --fresh); a dashed box is a copy read across a version seam; the dashed links to the textbook statement are readings.' })
}));

/* §3 every link */
B.push(C.section({
  lab: 'the details', title: 'Each step, and the record that decides it', id: 'links', wide: true,
  bodyRaw: C.table({ cols: [{ h: 'step' }, { h: 'what it proves' }, { h: 'proof by' }, { h: 'decided here' }],
    rows: [
      ['Anthropic’s proof', 'MainResults.ethIsFalse, in Anthropic’s own Lean (v4.33.1)', 'Anthropic', { raw: tag(ant.word) + '<br><span class="small">' + rec(R.kernel) + '</span>' }],
      ['the chain', 'the same proof, ported, proves the same ETHIsFalse in complexitylib’s Lean (v4.36.0-rc2), and with C2 gives ¬ETH there', 'Claude agents in claimbox (the port); Anthropic (the proof)', { raw: tag(ch.verdict) + '<br><span class="small">nanoda ' + N(ch.nanoda.claim.declarations) + ' · six checkers · ' + rec(R.chain) + '</span>' }],
      ['C2', 'Anthropic’s ETHIsFalse implies ETH is false on cslib’s multitape machine with encCNF, for every formula', 'Claude agents in claimbox', { raw: tag(c2.verdict) + '<br><span class="small">nanoda ' + N(c2.nanoda.claim.declarations) + ' · six checkers (' + rec(R.cmp) + ') · ' + rec(R.c2) + '</span>' }],
      ['Hawkley’s chain', 'OpenAI’s exact_count_and_sat implies ETHIsFalse, inside OpenAI’s Lean (v4.34.1); the copy is then read across a seam', 'Daniel Hawkley', { raw: tag(hkh.word) + '<br><span class="small">' + rec(R.hkh) + ' · ' + rec(R.hk) + '</span>' }],
      ['D1', 'complexitylib’s native ¬ETH on cslib’s multitape machine (a re-proof, not a bridge)', 'complexitylib’s AI agents', { raw: tag(d1.verdict) + '<br><span class="small">' + rec(R.d1) + '</span>' }],
      ['C1', 'ETH is false on the word RAM at logarithmic word size, from complexitylib’s proof', 'Claude agents in claimbox', { raw: tag(c1.verdict) + '<br><span class="small">six checkers · ' + rec(R.c1) + '</span>' }],
    ] })
}));

/* §4 how to re-run */
B.push(C.section({
  lab: 'check it yourself', title: 'How to check this yourself', id: 'rerun',
  bodyRaw: C.plainList([
    { b: 'Build.', raw: 'Clone <a href="https://github.com/carlostoledo1891/claimbox/tree/' + C.escAttr(ch.claim.commit) + '/lean/eth-bridge">claimbox at ' + esc(ch.claim.commit.slice(0, 7)) + '</a>, enter <span class="m">lean/eth-bridge</span>, run <span class="m">lake exe cache get</span> and <span class="m">lake build EthBridge.AnthropicChain</span> (about ten minutes over Mathlib’s cache on a laptop).' },
    { b: 'Check the statement.', raw: 'The trusted statement is pinned in ' + rec('corpus/eth-refutation/chain/statement.lean') + '; <span class="m">EthBridge/Anthropic/MainResults.lean</span> must hash to Anthropic’s published sha256 47f78a95…' },
    { b: 'Judge it.', raw: 'Our pod script ' + rec('tools/runpod-eth-chain.sh') + ' runs every step on a plain Ubuntu machine: our own axioms file, nanoda through lean4export, leanchecker --fresh, and lake comparator --paranoid. The facts of our run are in ' + rec(ch.run.facts) + '.' },
    { b: 'Read the note.', raw: 'The same result as a short technical note, every number read from the records: <a href="../paper/eth-chain.pdf">A formal bridge from Anthropic’s refutation of the Exponential Time Hypothesis to a standard multitape Turing machine</a> (PDF, not peer-reviewed).' },
    { b: 'Read the port.', raw: 'Every file of Anthropic’s proof that changed is listed with both hashes in <a href="https://github.com/carlostoledo1891/claimbox/blob/' + C.escAttr(ch.claim.commit) + '/lean/eth-bridge/AnthropicEth/PORT.md">PORT.md</a>.' },
  ])
}));

const foot = '<p>' + esc('Generated by tools/build-report-eth-chain.js from ' + Object.values(R).join(', ') + ' and the figure apps/eth/build.js wrote @ git ' + git + '. Statements by hand; proofs by Claude agents in claimbox; decided by cert-machine. Built with Claude (Anthropic).') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'eth-anthropic-chain.html'), TPL.render({
  title: 'Anthropic’s ETH proof, carried to a standard Turing machine in one Lean · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'Anthropic’s Lean proof that the Exponential Time Hypothesis is false, ported to one Lean and carried to a standard multitape Turing machine with a binary encoding: every step checked there by six checkers, nanoda and leanchecker --fresh; what stays open first.',
  path: '/reports/eth-anthropic-chain.html', og: { image: '/og-eth-chain.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('eth-chain') }
}));
console.log('reports/eth-anthropic-chain.html written: chain ' + ch.verdict + ', six checkers, nanoda ' + ch.nanoda.claim.declarations + ' @ git ' + git);
