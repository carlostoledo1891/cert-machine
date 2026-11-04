#!/usr/bin/env node
/* record-eth-c1.js — certs/eth-c1.json: C1 of the ETH model-gap lane (notes/eth-model-gap-preregistration-2026-11-04.md),
   claimbox's EthBridge.WordRAM.not_eth_ram (ETH false on the word RAM at logarithmic word size; written by claimbox and
   an AI agent, a proposal until decided here), decided from the facts the pod served (tools/runpod-eth-c1.sh, imported
   by tools/import-runpod-facts.js). The rule, stated once: CERTIFIED when the trusted statement is byte-equal to the pin
   (corpus/eth-refutation/c1/statement.lean), the build exits 0, our axioms file shows the theorem and its helpers on
   propext, Classical.choice and Quot.sound only, nanoda accepts the theorem's export, leanchecker --fresh exits 0, AND
   every planted variant is refused (the changed statement by the statement check, the sorry and the axiom by the axioms
   file and by nanoda). A control that does not fire refuses the record.

   usage: node tools/record-eth-c1.js <run-dir> */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const dir = path.resolve(process.argv[2] || '');
const die = (m) => { console.error('record-eth-c1: REFUSED — ' + m); process.exit(1); };
if (!fs.existsSync(path.join(dir, '_run.json'))) die('no imported run at ' + dir);
const rd = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const ex = (s) => Number(rd(s + '.exit').trim());
const run = JSON.parse(rd('_run.json'));
const STD = ['propext', 'Classical.choice', 'Quot.sound'];
const axOf = (text, name) => {
  const m = new RegExp("'" + name.replace(/\./g, '\\.') + "' depends on axioms: \\[([^\\]]*)\\]").exec(text.replace(/\n\s+/g, ' '));
  return m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : null;
};
const HEAD = ['EthBridge.WordRAM.not_eth_ram', 'EthBridge.WordRAM.Sim.executes_simProgram_of_space',
  'EthBridge.WordRAM.Decide.uniformDecidable_of_timeSpace', 'EthBridge.WordRAM.Decider.exists_ksat3_decider'];
const axioms = Object.fromEntries(HEAD.map((h) => [h, axOf(rd('L3.out'), h)]));
const stmt = JSON.parse(rd('L3s.out'));
const pinBytes = fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'c1', 'statement.lean'));
const pinSha = crypto.createHash('sha256').update(pinBytes).digest('hex');
const nan = (t) => { const out = rd('L4.nanoda-' + t + '.out'), err = rd('L4.nanoda-' + t + '.err'), m = /Checked (\d+) declarations with no typechecker errors/.exec(out);
  return { exit: ex('L4.nanoda-' + t), declarations: m ? Number(m[1]) : null, accepted: !!m && ex('L4.nanoda-' + t) === 0,
    refusal: (/infer_const: [^\n]*/.exec(err) || [null])[0] }; };
const nanoda = { claim: nan('claim'), plantedSorry: nan('sorry'), plantedAxiom: nan('axiom') };
const planted = {
  statement: { refused: stmt.plantedStatement.found && stmt.plantedStatement.equalsPin === false, by: 'the statement check: the trusted block differs from the pin', sha256: stmt.plantedStatement.sha256 },
  sorry: { refused: (axOf(rd('L3p.out'), 'planted_sorry') || []).includes('sorryAx') && !nanoda.plantedSorry.accepted, axioms: axOf(rd('L3p.out'), 'planted_sorry'), by: 'the axioms file (sorryAx) and nanoda (' + nanoda.plantedSorry.refusal + ')' },
  axiom: { refused: (axOf(rd('L3p.out'), 'planted_axiom') || []).includes('planted_cheat') && !nanoda.plantedAxiom.accepted, axioms: axOf(rd('L3p.out'), 'planted_axiom'), by: 'the axioms file (planted_cheat) and nanoda (' + nanoda.plantedAxiom.refusal + ')' },
};
const fails = [];
if (stmt.pinSha256 !== pinSha) fails.push('the pod checked against a different pin');
if (!stmt.claim.equalsPin) fails.push('the trusted statement differs from the pin');
for (const s of ['L1', 'L2', 'L3', 'L3p', 'L3s', 'L5']) if (ex(s) !== 0) fails.push(s + ' exit ' + ex(s));
for (const [h, a] of Object.entries(axioms)) if (!a || a.some((x) => !STD.includes(x))) fails.push(h + ' axioms ' + JSON.stringify(a));
if (!nanoda.claim.accepted) fails.push('nanoda on not_eth_ram');
for (const [k, p] of Object.entries(planted)) if (!p.refused) fails.push('the planted ' + k + ' was NOT refused');
const rec = {
  what: 'C1 of the ETH model-gap lane: claimbox\'s proof that ETH is false on the word RAM at logarithmic word size, decided here from claimbox\'s pinned commit with our own statement pin, axioms files, nanoda (with two negative controls) and leanchecker --fresh, and three planted wrong variants that must be refused.',
  generated: new Date().toISOString().slice(0, 10),
  claim: { repo: 'https://github.com/carlostoledo1891/claimbox', commit: run.steps && JSON.parse(rd('_status.json'))._claimbox, folder: 'lean/eth-bridge',
    theorem: 'EthBridge.WordRAM.not_eth_ram', builtOn: 'cslib-community/complexitylib 7c66eb71 (Lean v4.36.0-rc2)',
    authors: 'the statement by hand (cert-machine\'s operator session); the proof by an AI agent (Claude), in claimbox' },
  verdict: fails.length ? 'REFUSED' : 'CERTIFIED',
  scope: 'For every δ > 0 one fixed word-RAM program over the additive basis, reading the bits of encCNF φ one per word, decides 3-SAT within c·⌈2^(δ·n)⌉·(L+1)^e + c instructions at every word size of at least k·(⌊log₂ L⌋+1) bits: ETH is false on the word RAM with O(log L)-bit words. Decided: the statement byte-equal to the pin, the three standard axioms, nanoda accepting all ' + (nanoda.claim.declarations || 0).toLocaleString('en-US') + ' declarations beneath it, leanchecker --fresh, and the three planted variants refused.',
  fails,
  statement: { pin: 'corpus/eth-refutation/c1/statement.lean', sha256: pinSha },
  reading: [
    'The word RAM is complexitylib\'s (cslib\'s Basis.additive: addition, truncated subtraction, constants, copies, loads, stores, branches; unit cost per instruction) under its transdichotomous convention (UniformDecidableInTimeLogWord: every word size at least k·(⌊log₂ L⌋+1) admitted). Words hold one input bit each. That is the standard word RAM with Θ(log L)-bit words up to the basis chosen; a richer basis only helps an upper bound.',
    'The decider is built from complexitylib\'s native model counter (polynomial work space), not from either lab\'s statement: C1 closes the model step for complexitylib\'s native proof (decided in certs/eth-cslib-d1.json), not for the labs\' own Lean statements (C2).',
    'claimbox and cert-machine have the same operator: this decision separates the roles of author and checker; it is not a second party.'
  ],
  axioms, nanoda, planted,
  steps: { buildSeconds: Number(rd('L2.end')) - Number(rd('L2.start')), leancheckerSeconds: Number(rd('L5.end')) - Number(rd('L5.start')) },
  run: { id: run.run, auditSha: run.auditSha, host: run.host, startedAt: run.startedAt, finishedAt: run.finishedAt, facts: path.relative(ROOT, dir) },
};
fs.writeFileSync(path.join(ROOT, 'certs', 'eth-c1.json'), JSON.stringify(rec, null, 1) + '\n');
console.log('certs/eth-c1.json: ' + rec.verdict + (fails.length ? ' (' + fails.join('; ') + ')' : '') + ' — nanoda ' + nanoda.claim.declarations + ' declarations; planted refused: ' + Object.entries(planted).filter(([, p]) => p.refused).map(([k]) => k).join(', '));
