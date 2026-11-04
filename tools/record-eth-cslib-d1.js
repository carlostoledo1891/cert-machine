#!/usr/bin/env node
/* record-eth-cslib-d1.js — certs/eth-cslib-d1.json: D1 of the ETH model-gap lane (notes/eth-model-gap-preregistration-
   2026-11-04.md), decided from the facts the pod served (corpus/eth-refutation/cslib/runs/runpod-<pod>/, imported by
   tools/import-runpod-facts.js). The rule, stated once: CERTIFIED when the build exits 0, our own axioms file shows each
   headline resting on propext, Classical.choice and Quot.sound or a subset of them, nanoda reports no typechecker error
   on each export, and leanchecker --fresh exits 0; otherwise the failing step is the verdict's reason.

   usage: node tools/record-eth-cslib-d1.js <run-dir> */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const dir = path.resolve(process.argv[2] || '');
const die = (m) => { console.error('record-eth-cslib-d1: REFUSED — ' + m); process.exit(1); };
if (!fs.existsSync(path.join(dir, '_run.json'))) die('no imported run at ' + dir);
const rd = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const ex = (s) => Number(rd(s + '.exit').trim());
const run = JSON.parse(rd('_run.json'));
const STD = ['propext', 'Classical.choice', 'Quot.sound'];
const HEAD = ['ComplexityAbstracts.SubexponentialSATAbstract.not_eth', 'ComplexityAbstracts.SubexponentialSATAbstract.not_seth',
  'ComplexityAbstracts.SubexponentialSATAbstract.exact_count', 'ComplexityAbstracts.SubexponentialSATAbstract.satExponent_eq_zero',
  'ComplexityAbstracts.SubexponentialSATAbstract.length_encCNF', 'Cslib.WordRAM.OfTuring.executes_simProgram',
  'Turing.MultiTapeTM.ComputableInPolyTime.exists_wordRAM'];
const ax = rd('L3.out').replace(/\n\s+/g, ' ');
const axioms = {};
for (const h of HEAD) {
  const m = new RegExp("'" + h.replace(/\./g, '\\.') + "' depends on axioms: \\[([^\\]]*)\\]").exec(ax);
  if (!m) die('our axioms file printed nothing for ' + h);
  axioms[h] = m[1].split(',').map((s) => s.trim()).filter(Boolean);
}
const nanoda = {};
for (const t of ['not_eth', 'exact_count', 'executes_simProgram']) {
  const out = rd('L4.nanoda-' + t + '.out'), m = /Checked (\d+) declarations with no typechecker errors/.exec(out);
  const sha = (/([0-9a-f]{64})\s/.exec(rd('L4.export-' + t + '.out')) || [])[1];
  nanoda[t] = { exportExit: ex('L4.export-' + t), exit: ex('L4.nanoda-' + t), declarations: m ? Number(m[1]) : null,
    accepted: !!m && ex('L4.nanoda-' + t) === 0, exportSha256: sha || null,
    note: /Unable to print axioms/.test(out) ? 'nanoda\'s pretty-printer could not print the axiom list (a display limit, not a check)' : null };
}
const fails = [];
if (ex('L1') !== 0) fails.push('L1 prepare');
if (ex('L2') !== 0) fails.push('L2 build');
if (ex('L3') !== 0) fails.push('L3 axioms file');
for (const [h, a] of Object.entries(axioms)) if (a.some((x) => !STD.includes(x))) fails.push(h + ' uses ' + a.filter((x) => !STD.includes(x)).join(', '));
for (const [t, n] of Object.entries(nanoda)) if (!n.accepted) fails.push('nanoda on ' + t);
if (ex('L5') !== 0) fails.push('L5 leanchecker --fresh');
const secs = (s) => Number(rd(s + '.end').trim()) - Number(rd(s + '.start').trim());
const rec = {
  what: 'D1 of the ETH model-gap lane: cslib-community/complexitylib\'s native ETH refutation (PR #1338) and its word-RAM simulation (PR #2027), built from source at the pin and decided here with our own axioms file, nanoda on lean4export exports, and leanchecker --fresh. No code of the claimant\'s audit is run.',
  generated: new Date().toISOString().slice(0, 10),
  claim: { repo: 'https://github.com/cslib-community/complexitylib', commit: '1b7d62a8655b08351ba37684f3318257c3cd63f9', toolchain: 'leanprover/lean4:v4.36.0-rc2',
    authors: 'AI agents (Codex and Claude Code workers) with an AI reviewer, per the PR bodies' },
  verdict: fails.length ? 'REFUSED' : 'CERTIFIED',
  scope: 'The headlines not_eth, not_seth, exact_count, satExponent_eq_zero, length_encCNF (abstract), executes_simProgram and ComputableInPolyTime.exists_wordRAM compile at the pin and rest on the three standard axioms; nanoda accepts not_eth, exact_count and executes_simProgram with every declaration beneath them; leanchecker --fresh replays the abstract module.',
  fails,
  reading: [
    'ETH here is ∃ δ > 0 such that 3-SAT (clauses of at most 3 literals, any variable labels, repeats allowed) is not decided by a deterministic multitape Turing machine of cslib within c·2^(δ·n)·(L+1)^e + c steps with some space bound, n the number of distinct variables and L the length of encCNF. That is Impagliazzo–Paturi\'s s₃ > 0 with a polynomial factor in L, which changes no infimum.',
    'The machine is cslib\'s Turing.MultiTapeTM: finitely many states, a fixed number of work tapes, a read-only input tape and a write-only output tape, time counted in transitions. encCNF writes each literal\'s variable in binary with a polarity bit, framed; its exact length is a theorem (length_encCNF). This is the closest a Lean statement of ETH has come to the textbook model; that it IS the textbook ETH stays a reading.',
    'It formalizes the interpolation-scale route of OpenAI\'s Proposition 6.4, not the sharper Theorem 1.1 / Appendix D bound (their issue #1538 is open). It is a native re-proof, not a bridge from either lab\'s own Lean statement.'
  ],
  gaps: [
    'No planted-wrong control was run for nanoda in this run, so this run alone does not show nanoda rejecting a bad proof (earlier lanes ran one: certs/eth-hawkley-heavy.json).',
    'The word-RAM theorem executes_simProgram bounds addresses by the running time; it is decided here as stated, and it does not by itself give ETH on a word RAM at logarithmic word size (C1 of the pre-registration).',
    'Mathlib came from its published cache (lake exe cache get); cslib and complexitylib were built from source.'
  ],
  axioms,
  nanoda,
  steps: { buildSeconds: secs('L2'), leancheckerSeconds: secs('L5'), leancheckerExit: ex('L5') },
  run: { id: run.run, auditSha: run.auditSha, host: run.host, startedAt: run.startedAt, finishedAt: run.finishedAt, facts: path.relative(ROOT, dir) },
};
fs.writeFileSync(path.join(ROOT, 'certs', 'eth-cslib-d1.json'), JSON.stringify(rec, null, 1) + '\n');
console.log('certs/eth-cslib-d1.json: ' + rec.verdict + (fails.length ? ' (' + fails.join('; ') + ')' : '') + ' — nanoda ' + Object.values(nanoda).map((n) => n.declarations).join('/') + ' declarations');
