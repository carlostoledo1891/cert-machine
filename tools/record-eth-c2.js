#!/usr/bin/env node
/* record-eth-c2.js — certs/eth-c2.json: C2 of the ETH model-gap lane (notes/eth-model-gap-preregistration-2026-11-04.md),
   claimbox's EthBridge.Anthropic.not_eth_of_ethIsFalse (Anthropic's ETHIsFalse implies complexitylib's ¬ETH; written by
   claimbox and an AI agent, a proposal until decided here), decided from the facts the pod served
   (tools/runpod-eth-c2.sh, imported by tools/import-runpod-facts.js). The rule, stated once: CERTIFIED when the trusted
   statement is byte-equal to the pin (corpus/eth-refutation/c2/statement.lean), the vendored MainResults.lean hashes to
   Anthropic's pinned bytes (corpus/eth-refutation/tsavo/pins.json), the build exits 0, our axioms file shows the theorem and its helpers on
   propext, Classical.choice and Quot.sound only, nanoda accepts the theorem's export, leanchecker --fresh exits 0, AND
   every planted variant is refused (the changed statement by the statement check, the sorry and the axiom by the axioms
   file and by nanoda). A control that does not fire refuses the record.

   usage: node tools/record-eth-c2.js <run-dir> */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const dir = path.resolve(process.argv[2] || '');
const die = (m) => { console.error('record-eth-c2: REFUSED — ' + m); process.exit(1); };
if (!fs.existsSync(path.join(dir, '_run.json'))) die('no imported run at ' + dir);
const rd = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const ex = (s) => Number(rd(s + '.exit').trim());
const run = JSON.parse(rd('_run.json'));
const STD = ['propext', 'Classical.choice', 'Quot.sound'];
const axOf = (text, name) => {
  const m = new RegExp("'" + name.replace(/\./g, '\\.') + "' depends on axioms: \\[([^\\]]*)\\]").exec(text.replace(/\n\s+/g, ' '));
  return m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : null;
};
const HEAD = ['EthBridge.Anthropic.not_eth_of_ethIsFalse', 'EthBridge.Anthropic.Assemble.decidableInExpTime',
  'EthBridge.Anthropic.DegreeStep.stepTotalD', 'EthBridge.Anthropic.DegreeRun.runBitD',
  'EthBridge.Anthropic.Words.prep_polyTime', 'EthBridge.Anthropic.Prep.prep_spec'];
const axioms = Object.fromEntries(HEAD.map((h) => [h, axOf(rd('L3.out'), h)]));
const stmt = JSON.parse(rd('L3s.out'));
const pinBytes = fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'c2', 'statement.lean'));
const pinSha = crypto.createHash('sha256').update(pinBytes).digest('hex');
const MAIN_PIN = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'tsavo', 'pins.json'), 'utf8')).statementPins.mainResults.sha256;
const nan = (t) => { const out = rd('L4.nanoda-' + t + '.out'), err = rd('L4.nanoda-' + t + '.err'), m = /Checked (\d+) declarations with no typechecker errors/.exec(out);
  return { exit: ex('L4.nanoda-' + t), declarations: m ? Number(m[1]) : null, accepted: !!m && ex('L4.nanoda-' + t) === 0,
    refusal: (/infer_const: [^\n]*/.exec(err) || [null])[0] }; };
const nanoda = { claim: nan('claim'), plantedSorry: nan('sorry'), plantedAxiom: nan('axiom') };
const planted = {
  statement: { refused: stmt.plantedStatement.found && stmt.plantedStatement.equalsPin === false, by: 'the statement check: the trusted block differs from the pin', sha256: stmt.plantedStatement.sha256 },
  sorry: { refused: (axOf(rd('L3p.out'), 'planted_c2_sorry') || []).includes('sorryAx') && !nanoda.plantedSorry.accepted, axioms: axOf(rd('L3p.out'), 'planted_c2_sorry'), by: 'the axioms file (sorryAx) and nanoda (' + nanoda.plantedSorry.refusal + ')' },
  axiom: { refused: (axOf(rd('L3p.out'), 'planted_c2_axiom') || []).includes('planted_c2_cheat') && !nanoda.plantedAxiom.accepted, axioms: axOf(rd('L3p.out'), 'planted_c2_axiom'), by: 'the axioms file (planted_c2_cheat) and nanoda (' + nanoda.plantedAxiom.refusal + ')' },
};
const fails = [];
if (stmt.pinSha256 !== pinSha) fails.push('the pod checked against a different pin');
if (!stmt.claim.equalsPin) fails.push('the trusted statement differs from the pin');
if (stmt.mainResultsSha256 !== MAIN_PIN) fails.push('the vendored MainResults.lean is not Anthropic\'s pinned bytes');
for (const s of ['L1', 'L2', 'L3', 'L3p', 'L3s', 'L5']) if (ex(s) !== 0) fails.push(s + ' exit ' + ex(s));
for (const [h, a] of Object.entries(axioms)) if (!a || a.some((x) => !STD.includes(x))) fails.push(h + ' axioms ' + JSON.stringify(a));
if (!nanoda.claim.accepted) fails.push('nanoda on not_eth_of_ethIsFalse');
for (const [k, p] of Object.entries(planted)) if (!p.refused) fails.push('the planted ' + k + ' was NOT refused');
const rec = {
  what: 'C2 of the ETH model-gap lane: claimbox\'s proof that Anthropic\'s ETHIsFalse implies complexitylib\'s ¬ETH on cslib\'s multitape Turing machine, decided here from claimbox\'s pinned commit with our own statement pin, axioms files, nanoda (with two negative controls) and leanchecker --fresh, and three planted wrong variants that must be refused.',
  generated: new Date().toISOString().slice(0, 10),
  claim: { repo: 'https://github.com/carlostoledo1891/claimbox', commit: JSON.parse(rd('_status.json'))._claimbox, folder: 'lean/eth-bridge',
    theorem: 'EthBridge.Anthropic.not_eth_of_ethIsFalse', builtOn: 'cslib-community/complexitylib 7c66eb71 (Lean v4.36.0-rc2)',
    authors: 'the statement by hand (cert-machine\'s operator session); the proof by an AI agent (Claude), in claimbox' },
  verdict: fails.length ? 'REFUSED' : 'CERTIFIED',
  scope: 'If Anthropic\'s ETHIsFalse holds (for every δ > 0 a deterministic Mathlib FinTM2 machine decides 3-SAT on duplicate-free formulas written as encClauses 3 within ⌊c·2^(δ·n)⌋ steps), then complexitylib\'s ETH is false: for every δ > 0 a deterministic cslib multitape Turing machine decides 3-SAT on every formula, written as the binary encCNF, within c·2^(δ·n)·(L+1)^e + c steps. Decided: the statement byte-equal to the pin, MainResults.lean byte-equal to Anthropic\'s, the three standard axioms, nanoda accepting all ' + (nanoda.claim.declarations || 0).toLocaleString('en-US') + ' declarations beneath it, leanchecker --fresh, and the three planted variants refused.',
  fails,
  statement: { pin: 'corpus/eth-refutation/c2/statement.lean', sha256: pinSha, mainResults: { pin: 'corpus/eth-refutation/tsavo/pins.json', sha256: MAIN_PIN, served: stmt.mainResultsSha256 } },
  reading: [
    'MainResults.lean is Anthropic\'s file byte for byte, but elaborated here against complexitylib\'s Mathlib (Lean v4.36.0-rc2), not Anthropic\'s (v4.33.1). That ETHIsFalse here means what Anthropic proved there is the version seam: read, not decided.',
    'C2 is an implication. Its conclusion is already proved outright by complexitylib\'s own not_eth (certs/eth-cslib-d1.json); what C2 adds is the link from a lab\'s statement to the standard machine, so Anthropic\'s proof, and with Hawkley\'s chain OpenAI\'s, refutes ETH on cslib\'s multitape machine with encCNF, up to the seam.',
    'claimbox and cert-machine have the same operator: this decision separates the roles of author and checker; it is not a second party.'
  ],
  axioms, nanoda, planted,
  steps: { buildSeconds: Number(rd('L2.end')) - Number(rd('L2.start')), leancheckerSeconds: Number(rd('L5.end')) - Number(rd('L5.start')) },
  run: { id: run.run, auditSha: run.auditSha, host: run.host, startedAt: run.startedAt, finishedAt: run.finishedAt, facts: path.relative(ROOT, dir) },
};
fs.writeFileSync(path.join(ROOT, 'certs', 'eth-c2.json'), JSON.stringify(rec, null, 1) + '\n');
console.log('certs/eth-c2.json: ' + rec.verdict + (fails.length ? ' (' + fails.join('; ') + ')' : '') + ' — nanoda ' + nanoda.claim.declarations + ' declarations; planted refused: ' + Object.entries(planted).filter(([, p]) => p.refused).map(([k]) => k).join(', '));
