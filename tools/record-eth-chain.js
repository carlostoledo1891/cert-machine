#!/usr/bin/env node
/* record-eth-chain.js — certs/eth-chain.json: the Anthropic chain in one environment, claimbox's
   EthBridge.AnthropicChain.not_eth : ¬ETH := not_eth_of_ethIsFalse MainResults.ethIsFalse, where MainResults.ethIsFalse is
   anthropics/formal-math eth/ at 16a5ce41 PORTED to Lean v4.36.0-rc2 (claimbox lean/eth-bridge/AnthropicEth, every change in
   its PORT.md; a proposal until decided here), decided from the facts the pod served (tools/runpod-eth-chain.sh). The rule,
   stated once: CERTIFIED when the trusted statement is byte-equal to the pin (corpus/eth-refutation/chain/statement.lean),
   the vendored MainResults.lean hashes to Anthropic's pinned bytes (corpus/eth-refutation/tsavo/pins.json), the build exits 0, our axioms file shows the theorem and its helpers on
   propext, Classical.choice and Quot.sound only, nanoda accepts the theorem's export, leanchecker --fresh exits 0, AND
   every planted variant is refused (the changed statement by the statement check, the sorry and the axiom by the axioms
   file and by nanoda). A control that does not fire refuses the record.

   usage: node tools/record-eth-chain.js <run-dir> */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const dir = path.resolve(process.argv[2] || '');
const die = (m) => { console.error('record-eth-chain: REFUSED — ' + m); process.exit(1); };
if (!fs.existsSync(path.join(dir, '_run.json'))) die('no imported run at ' + dir);
const rd = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const ex = (s) => Number(rd(s + '.exit').trim());
const run = JSON.parse(rd('_run.json'));
const STD = ['propext', 'Classical.choice', 'Quot.sound'];
const axOf = (text, name) => {
  const m = new RegExp("'" + name.replace(/\./g, '\\.') + "' depends on axioms: \\[([^\\]]*)\\]").exec(text.replace(/\n\s+/g, ' '));
  return m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : null;
};
const HEAD = ['EthBridge.AnthropicChain.not_eth', 'MainResults.ethIsFalse', 'MainResults.mainTheorem', 'EthBridge.Anthropic.not_eth_of_ethIsFalse'];
const axioms = Object.fromEntries(HEAD.map((h) => [h, axOf(rd('L3.out'), h)]));
const stmt = JSON.parse(rd('L3s.out'));
const pinBytes = fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'chain', 'statement.lean'));
const pinSha = crypto.createHash('sha256').update(pinBytes).digest('hex');
const MAIN_PIN = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'tsavo', 'pins.json'), 'utf8')).statementPins.mainResults.sha256;
const nan = (t) => { const out = rd('L4.nanoda-' + t + '.out'), err = rd('L4.nanoda-' + t + '.err'), m = /Checked (\d+) declarations with no typechecker errors/.exec(out);
  return { exit: ex('L4.nanoda-' + t), declarations: m ? Number(m[1]) : null, accepted: !!m && ex('L4.nanoda-' + t) === 0,
    refusal: (/infer_const: [^\n]*/.exec(err) || [null])[0] }; };
const nanoda = { claim: nan('claim'), plantedSorry: nan('sorry'), plantedAxiom: nan('axiom') };
const planted = {
  statement: { refused: stmt.plantedStatement.found && stmt.plantedStatement.equalsPin === false, by: 'the statement check: the trusted block differs from the pin', sha256: stmt.plantedStatement.sha256 },
  sorry: { refused: (axOf(rd('L3p.out'), 'planted_chain_sorry') || []).includes('sorryAx') && !nanoda.plantedSorry.accepted, axioms: axOf(rd('L3p.out'), 'planted_chain_sorry'), by: 'the axioms file (sorryAx) and nanoda (' + nanoda.plantedSorry.refusal + ')' },
  axiom: { refused: (axOf(rd('L3p.out'), 'planted_chain_axiom') || []).includes('planted_chain_cheat') && !nanoda.plantedAxiom.accepted, axioms: axOf(rd('L3p.out'), 'planted_chain_axiom'), by: 'the axioms file (planted_chain_cheat) and nanoda (' + nanoda.plantedAxiom.refusal + ')' },
};
const fails = [];
if (stmt.pinSha256 !== pinSha) fails.push('the pod checked against a different pin');
if (!stmt.claim.equalsPin) fails.push('the trusted statement differs from the pin');
if (stmt.mainResultsSha256 !== MAIN_PIN) fails.push('the vendored MainResults.lean is not Anthropic\'s pinned bytes');
for (const s of ['L1', 'L2', 'L3', 'L3p', 'L3s', 'L5']) if (ex(s) !== 0) fails.push(s + ' exit ' + ex(s));
for (const [h, a] of Object.entries(axioms)) if (!a || a.some((x) => !STD.includes(x))) fails.push(h + ' axioms ' + JSON.stringify(a));
if (!nanoda.claim.accepted) fails.push('nanoda on not_eth');
const J = require('./record-eth-comparator.js');
const judge = J.judged(dir, 'P1'), plantedJudge = J.judged(dir, 'P2');
const judgeAll = judge.exit === 0 && judge.okay && J.KERNELS.every((k) => judge.accepted.includes(k));
if (!judgeAll) fails.push('lake comparator --paranoid did not accept with all six checkers (' + judge.accepted.join(', ') + ')');
if (!(plantedJudge.exit !== 0 && plantedJudge.mismatch)) fails.push('the planted statement was NOT rejected by the judge');
const challenge = JSON.parse(rd('P0.out'));
if (challenge.pin !== pinSha) fails.push('the judge\'s challenge was written from another pin');
for (const [k, p] of Object.entries(planted)) if (!p.refused) fails.push('the planted ' + k + ' was NOT refused');
const rec = {
  what: 'The Anthropic chain in one environment: Anthropic\'s eth/ proof ported to complexitylib\'s Lean (v4.36.0-rc2) proves MainResults.ethIsFalse against the vendored MainResults.lean, and with C2 gives ¬ETH on cslib\'s multitape Turing machine, decided here with our statement pin, axioms files, nanoda (two negative controls), leanchecker --fresh, three planted variants, and Lean\'s own judge (lake comparator --paranoid, six checkers).',
  generated: new Date().toISOString().slice(0, 10),
  claim: { repo: 'https://github.com/carlostoledo1891/claimbox', commit: JSON.parse(rd('_status.json'))._claimbox, folder: 'lean/eth-bridge',
    theorem: 'EthBridge.AnthropicChain.not_eth', builtOn: 'cslib-community/complexitylib 7c66eb71 (Lean v4.36.0-rc2)',
    port: { of: 'anthropics/formal-math eth/ @ 16a5ce41', files: 809, byteIdentical: 762, modified: 47, ledger: 'lean/eth-bridge/AnthropicEth/PORT.md' },
    authors: 'the statement by hand; the port and the corollary by an AI agent (Claude), in claimbox' },
  verdict: fails.length ? 'REFUSED' : 'CERTIFIED',
  scope: 'ETH (complexitylib\'s, on cslib\'s deterministic multitape Turing machine with encCNF) is false, from Anthropic\'s own proof through C2, every step elaborated and checked in one Lean (v4.36.0-rc2): no step from Anthropic\'s proof to the standard machine crosses a version seam. Decided: the statement byte-equal to the pin, MainResults.lean byte-equal to Anthropic\'s, the three standard axioms, nanoda accepting all ' + (nanoda.claim.declarations || 0).toLocaleString('en-US') + ' declarations beneath it, leanchecker --fresh, the three planted variants refused, and lake comparator --paranoid accepting with all six checkers (con-leche and con-ron: ' + (judge.declarations || 0).toLocaleString('en-US') + ' declarations).',
  fails,
  statement: { pin: 'corpus/eth-refutation/chain/statement.lean', sha256: pinSha, mainResults: { pin: 'corpus/eth-refutation/tsavo/pins.json', sha256: MAIN_PIN, served: stmt.mainResultsSha256 } },
  reading: [
    'The proof that checks here is a modified copy of Anthropic\'s: 47 of its 809 files were changed to build on the newer Lean and Mathlib (renames, imports, tactic repairs; 45 declarations changed text only by a forced rename; every change listed with both sha256s in PORT.md). Lean checks whatever proof is there against Anthropic\'s unchanged statement, so the port changes nothing that is decided; it is said here because the proof is not Anthropic\'s bytes.',
    'This closes the second version seam for Anthropic\'s chain only. OpenAI\'s statement reaches ETHIsFalse inside OpenAI\'s Lean (v4.34.1, Hawkley\'s chain); that seam is read, not decided.',
    'Lean\'s judge ran without its sandbox (bubblewrap cannot create a user namespace on RunPod\'s containers). The sandbox protects the judge from a hostile build; the build here is our own claimbox\'s.',
    'claimbox and cert-machine have the same operator: this decision separates the roles of author and checker; it is not a second party.'
  ],
  judge: { claim: judge, planted: plantedJudge, challengeSha256: challenge.challenge },
  axioms, nanoda, planted,
  steps: { buildSeconds: Number(rd('L2.end')) - Number(rd('L2.start')), leancheckerSeconds: Number(rd('L5.end')) - Number(rd('L5.start')) },
  run: { id: run.run, auditSha: run.auditSha, host: run.host, startedAt: run.startedAt, finishedAt: run.finishedAt, facts: path.relative(ROOT, dir) },
};
fs.writeFileSync(path.join(ROOT, 'certs', 'eth-chain.json'), JSON.stringify(rec, null, 1) + '\n');
console.log('certs/eth-chain.json: ' + rec.verdict + (fails.length ? ' (' + fails.join('; ') + ')' : '') + ' — nanoda ' + nanoda.claim.declarations + ' declarations; planted refused: ' + Object.entries(planted).filter(([, p]) => p.refused).map(([k]) => k).join(', '));
