#!/usr/bin/env node
/* record-eth-openai-chain.js — certs/eth-openai-chain.json: the OpenAI chain in one environment, claimbox's
   EthBridge.OpenAIChain.not_eth : ¬ETH := not_eth_of_ethIsFalse (not_positiveRateETH_implies_ethIsFalse not_positiveRateETH),
   where OpenAI's family-378 proof (openai/math at 7ef5c0cc) and Daniel Hawkley's two bridge theorems (thinkthoughts/math at
   d6b79b7d) are PORTED to Lean v4.36.0-rc2 (claimbox lean/eth-bridge/OpenAIEth, every change in its PORT.md; a proposal until
   decided here), decided from the facts the pod served (tools/runpod-eth-openai-chain.sh, imported by
   tools/import-runpod-facts.js <pod> corpus/eth-refutation/openai-chain/runs). The rule, stated once: CERTIFIED when the
   trusted statement is byte-equal to the pin (corpus/eth-refutation/openai-chain/statement.lean), the vendored
   MainResults.lean hashes to Anthropic's pinned bytes (corpus/eth-refutation/tsavo/pins.json), every ported file is
   byte-equal to its scout pin (corpus/eth-refutation/openai-chain/scout-pins.json) or modified exactly as PORT.md declares
   (one refusal in that ledger refuses the record), Hawkley's two theorem types print as pinned, the build exits 0, our
   axioms file shows the theorem and its links on propext, Classical.choice and Quot.sound only, nanoda accepts the
   theorem's export, leanchecker --fresh exits 0, AND every planted variant is refused (the changed statement by the
   statement check, the sorry and the axiom by the axioms file and by nanoda). A control that does not fire refuses the record.
   P3, OpenAI's own Comparator challenge (corpus/eth-refutation/openai-chain/challenge/, pinned at openai/math 7ef5c0cc) against
   the ported solution module (OpenAI's own Main), pre-registered as "attempted in addition": REJECTED refuses the record (the port would have
   changed OpenAI's statement); NOT RUN because the challenge does not compile on the new Mathlib is said with its reason and
   leaves the verdict alone; accepted adds one line to the scope.
   Amendment 2026-11-05 12:55 UTC (the pre-registration's dated amendments): the judge as shipped (`--paranoid`) is recorded as it
   ran — Lean paranoid and Lean default accept, the four bundled checkers stop at their own limits, each stop in the checker's
   words — and the VERDICT reads the judge re-run with NAMED checkers on a second run directory (the diagnostic pod): Q1 the
   chain, Q2 the planted statement (must be rejected on the statement), Q3 OpenAI's own challenge, with external_kernels =
   leanchecker-paranoid, our pinned nanoda (16 threads, 1 GiB stack) and lean4lean (fuel ×100), Lean's default kernel last.
   The by-hand stages (A: the comparator's configuration; B/C: larger limits, our pinned nanoda) are recorded as the diagnosis.

   usage: node tools/record-eth-openai-chain.js [<run-dir>] [--named <run-dir>]   (default: the newest completed run under
          corpus/eth-refutation/openai-chain/runs/ holding L3s.out, and the newest holding Q1.exit; with no decision run,
          "no run" and no record written; with no named run the verdict is REFUSED and says so) */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const RUNS = path.join(ROOT, 'corpus', 'eth-refutation', 'openai-chain', 'runs');
const die = (m) => { console.error('record-eth-openai-chain: REFUSED — ' + m); process.exit(1); };
const newest = (mark) => {
  if (!fs.existsSync(RUNS)) return null;
  const done = fs.readdirSync(RUNS).filter((d) => fs.existsSync(path.join(RUNS, d, '_run.json')) && fs.existsSync(path.join(RUNS, d, mark)))
    .map((d) => ({ d, run: JSON.parse(fs.readFileSync(path.join(RUNS, d, '_run.json'), 'utf8')) }))
    .filter((x) => x.run.status === 'completed').sort((a, b) => String(a.run.finishedAt).localeCompare(String(b.run.finishedAt)));
  return done.length ? path.join(RUNS, done[done.length - 1].d) : null;
};
const argNamed = process.argv.indexOf('--named');
const positional = process.argv.slice(2).filter((a, i, all) => a !== '--named' && all[i - 1] !== '--named');
const dir = positional[0] ? path.resolve(positional[0]) : newest('L3s.out');
const namedDir = argNamed > 0 ? path.resolve(process.argv[argNamed + 1]) : newest('Q1.exit');
if (!dir) die('no run: nothing completed under ' + path.relative(ROOT, RUNS) + ' (import one with tools/import-runpod-facts.js <pod> ' + path.relative(ROOT, RUNS) + ')');
if (!fs.existsSync(path.join(dir, '_run.json'))) die('no imported run at ' + dir);
const rd = (f) => { const p = path.join(dir, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
const ex = (s) => Number((rd(s + '.exit') || 'NaN').trim());
const run = JSON.parse(rd('_run.json'));
const STD = ['propext', 'Classical.choice', 'Quot.sound'];
const axOf = (text, name) => {
  const m = new RegExp("'" + name.replace(/\./g, '\\.') + "' depends on axioms: \\[([^\\]]*)\\]").exec(text.replace(/\n\s+/g, ' '));
  return m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : null;
};
const HEAD = ['EthBridge.OpenAIChain.not_eth', 'OAI.Bridges.ETH.not_positiveRateETH', 'OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse',
  'OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.exact_count_and_sat', 'OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.original_sat_main', 'EthBridge.Anthropic.not_eth_of_ethIsFalse'];
const axioms = Object.fromEntries(HEAD.map((h) => [h, axOf(rd('L3.out'), h)]));
/* the #check lines of our file: Hawkley's two theorem types as the pinned source states them (thinkthoughts/math @ d6b79b7d,
   OAI/Bridges/ETH/FinalImplication.lean line 22 and OAI/Bridges/AnthropicETH/Main.lean lines 23–24, pinned in
   corpus/eth-refutation/hawkley/pins.json) and the chain's own; whitespace as Lean prints it, compared collapsed */
const norm = (s) => s.replace(/\s+/g, ' ').replace(/¬\s+/g, '¬').trim();
const EXPECT = {
  'OAI.Bridges.ETH.not_positiveRateETH': '¬OAI.ParityWL.Complexity.PositiveRateETH',
  'OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse': '¬OAI.ParityWL.Complexity.PositiveRateETH → MainResults.ETHIsFalse',
  'EthBridge.OpenAIChain.not_eth': '¬ComplexityAbstracts.SubexponentialSATAbstract.ETH',
};
const statements = Object.fromEntries(Object.entries(EXPECT).map(([n, want]) => {
  // Lean breaks a long type after the colon onto an indented next line, so the type may start on either line
  const m = new RegExp('^' + n.replace(/\./g, '\\.') + ' :[ \\t]*\\n?[ \\t]*([^\\n]+(?:\\n[ \\t]+[^\\n]+)*)', 'm').exec(rd('L3.out'));
  const got = m ? norm(m[1]) : null;
  return [n, { printed: got, expected: want, equal: got !== null && norm(got) === norm(want) }];
}));
const stmt = JSON.parse(rd('L3s.out') || 'null');
if (!stmt) die('no L3s.out in ' + dir);
const pinBytes = fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'openai-chain', 'statement.lean'));
const pinSha = crypto.createHash('sha256').update(pinBytes).digest('hex');
const pinsBytes = fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'openai-chain', 'scout-pins.json'));
const pinsSha = crypto.createHash('sha256').update(pinsBytes).digest('hex');
const PINS = JSON.parse(pinsBytes);
const MAIN_PIN = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'tsavo', 'pins.json'), 'utf8')).statementPins.mainResults.sha256;
const port = stmt.port || { counts: {}, refusals: [{ file: '(none)', why: 'L3s served no port-ledger facts' }], modified: [] };
const nan = (t) => { const out = rd('L4.nanoda-' + t + '.out'), err = rd('L4.nanoda-' + t + '.err'), m = /Checked (\d+) declarations with no typechecker errors/.exec(out);
  return { exit: ex('L4.nanoda-' + t), declarations: m ? Number(m[1]) : null, accepted: !!m && ex('L4.nanoda-' + t) === 0,
    refusal: (/infer_const: [^\n]*/.exec(err) || [null])[0] }; };
const nanoda = { claim: nan('claim'), plantedSorry: nan('sorry'), plantedAxiom: nan('axiom') };
const planted = {
  statement: { refused: stmt.plantedStatement.found && stmt.plantedStatement.equalsPin === false, by: 'the statement check: the trusted block differs from the pin', sha256: stmt.plantedStatement.sha256 },
  sorry: { refused: (axOf(rd('L3p.out'), 'planted_openai_chain_sorry') || []).includes('sorryAx') && !nanoda.plantedSorry.accepted, axioms: axOf(rd('L3p.out'), 'planted_openai_chain_sorry'), by: 'the axioms file (sorryAx) and nanoda (' + nanoda.plantedSorry.refusal + ')' },
  axiom: { refused: (axOf(rd('L3p.out'), 'planted_openai_chain_axiom') || []).includes('planted_openai_chain_cheat') && !nanoda.plantedAxiom.accepted, axioms: axOf(rd('L3p.out'), 'planted_openai_chain_axiom'), by: 'the axioms file (planted_openai_chain_cheat) and nanoda (' + nanoda.plantedAxiom.refusal + ')' },
};
const fails = [];
if (stmt.pinSha256 !== pinSha) fails.push('the pod checked against a different pin');
if (!stmt.claim.equalsPin) fails.push('the trusted statement differs from the pin');
if (stmt.mainResultsSha256 !== MAIN_PIN) fails.push('the vendored MainResults.lean is not Anthropic\'s pinned bytes');
if (port.pinsSha256 !== pinsSha) fails.push('the pod checked the port against a different scout-pins.json');
if (port.pinCommit !== PINS.commit) fails.push('the scout pins on the pod name another commit');
if (!port.portMdFound) fails.push('OpenAIEth/PORT.md is missing');
if (port.refusals.length) fails.push('the port ledger refuses ' + port.refusals.length + ' file(s): ' + port.refusals.slice(0, 5).map((r) => r.file + ' (' + r.why + ')').join('; ') + (port.refusals.length > 5 ? '; …' : ''));
if (port.counts.present !== port.counts.pinned) fails.push('the port holds ' + port.counts.present + ' .lean files, the pin ' + port.counts.pinned);
for (const s of ['L1', 'L2', 'L3', 'L3p', 'L3s', 'L5']) if (ex(s) !== 0) fails.push(s + ' exit ' + ex(s));
for (const [h, a] of Object.entries(axioms)) if (!a || a.some((x) => !STD.includes(x))) fails.push(h + ' axioms ' + JSON.stringify(a));
for (const [n, s] of Object.entries(statements)) if (!s.equal) fails.push(n + ' prints as ' + JSON.stringify(s.printed) + ', the pin states ' + JSON.stringify(s.expected));
if (!nanoda.claim.accepted) fails.push('nanoda on not_eth');
const J = require('./record-eth-comparator.js');
const challenge = JSON.parse(rd('P0.out') || '{}');
function challengeShaOf() { return challenge.challenge; }
const judge = J.judged(dir, 'P1'), plantedJudge = J.judged(dir, 'P2');
const judgeAll = judge.exit === 0 && judge.okay && J.KERNELS.every((k) => judge.accepted.includes(k));
if (!(plantedJudge.exit !== 0 && plantedJudge.mismatch)) fails.push('the planted statement was NOT rejected by the judge');
/* the four bundled checkers' stops, each in its own words (the judge's stderr) */
const stops = (err) => {
  const out = {};
  const l4 = /uncaught exception: at ([^:\n]+): \((kernel)\) deterministic timeout/.exec(err); if (l4) out.lean4lean = '(kernel) deterministic timeout at ' + l4[1];
  if (/has overflowed its stack/.test(err)) out.nanoda = 'thread has overflowed its stack';
  const cl = /con-leche: internal error: ([^\n]+?)(?: \(--verified\))? t=/.exec(err); if (cl) out['con-leche'] = 'internal error: ' + cl[1];
  const cr = /con-ron: error: ([^\n]+?)(?: \(--verified\))? t=/.exec(err); if (cr) out['con-ron'] = 'error: ' + cr[1];
  return out;
};
/* the judge with NAMED checkers (the amendment of 2026-11-05 12:55 UTC): the second run directory */
const NAMED = ['Lean default', 'paranoid', 'nanoda-pinned', 'lean4lean-fuel'];
const judgedNamed = (d, step) => {
  if (!d) return null;
  const r = (f) => { const q = path.join(d, f); return fs.existsSync(q) ? fs.readFileSync(q, 'utf8') : ''; };
  if (!fs.existsSync(path.join(d, step + '.exit'))) return null;
  const out = r(step + '.out'), err = r(step + '.err');
  return { exit: Number((r(step + '.exit') || 'NaN').trim()), okay: /^Your solution is okay!$/m.test(out),
    accepted: [...out.matchAll(/^(.+) kernel accepts the solution$/gm)].map((m) => m[1]),
    rejected: [...out.matchAll(/^(.+) kernel rejected the solution$/gm)].map((m) => m[1]),
    sandbox: (r(step + '.mode').trim() || 'unknown'), mismatch: (err.match(/error: (?:Const does not match between challenge and target|Challenge and solution theorem statement do not match:) '[^']+'/) || [null])[0],
    seconds: Number(r(step + '.end')) - Number(r(step + '.start')) };
};
const nrd = (f) => { if (!namedDir) return ''; const q = path.join(namedDir, f); return fs.existsSync(q) ? fs.readFileSync(q, 'utf8') : ''; };
const q1 = judgedNamed(namedDir, 'Q1'), q2 = judgedNamed(namedDir, 'Q2'), q3 = judgedNamed(namedDir, 'Q3');
const q0 = JSON.parse(nrd('Q0.out') || 'null');
const q1ok = !!q1 && q1.exit === 0 && q1.okay && NAMED.every((k) => q1.accepted.includes(k));
if (!q1ok) fails.push('lake comparator with the named checkers did not accept the chain (' + (q1 ? 'accepting: ' + q1.accepted.join(', ') : 'no named run') + ')');
if (!(q2 && q2.exit !== 0 && q2.mismatch)) fails.push('the planted statement was NOT rejected by the judge with the named checkers');
if (q0 && q0.challenge !== challengeShaOf()) fails.push('the named run\'s challenge differs from the decision run\'s');
if (q0 && q0.pin !== pinSha) fails.push('the named run\'s challenge was written from another pin');
/* the diagnosis by hand on the comparator's own export (stages A: its configuration; B/C: larger limits) */
const diagStep = (n) => {
  if (!namedDir || !fs.existsSync(path.join(namedDir, n + '.exit'))) return null;
  const err = nrd(n + '.err'), out = nrd(n + '.out');
  const reason = err.split('\n').filter((l) => l && !/^\s/.test(l) && l !== 'unlimited' && !/^Command /.test(l) && !/^timeout: /.test(l) && !/inductive blocks modelled/.test(l))[0] || null;
  const checked = /Checked (\d+) declarations with no typechecker errors/.exec(out);
  return { exit: Number((nrd(n + '.exit') || 'NaN').trim()), seconds: Number(nrd(n + '.end')) - Number(nrd(n + '.start')),
    maxRssKb: Number((/Maximum resident set size \(kbytes\): (\d+)/.exec(err) || [])[1]) || null, reason, declarations: checked ? Number(checked[1]) : null };
};
const diagnosis = namedDir ? {
  export: { madeAs: 'leanexport (the toolchain\'s), the module and the declaration list the comparator printed', bytes: Number((/^\S+ \S+ \S+ \S+ (\d+) /m.exec(nrd('D3.out')) || [])[1]) || null, sha256: (/^([0-9a-f]{64}) /m.exec(nrd('D3.out')) || [])[1] || null },
  bundled: { 'nanoda (the comparator\'s configuration: 4 threads, no stack size)': diagStep('A.nanoda'), 'nanoda (stack_size_bytes 1 GiB, 16 threads: the bundled build has no such field)': diagStep('B.nanoda'), 'nanoda (RUST_MIN_STACK 1 GiB)': diagStep('C.nanoda-rustminstack'),
    'lean4lean (default fuel)': diagStep('A.lean4lean'), 'lean4lean (every fuel field ×100)': diagStep('C.lean4lean-fuel100'), 'leanchecker-paranoid --from-export': diagStep('B.paranoid'),
    'con-leche': diagStep('A.con-leche'), 'con-leche --jobs=16': diagStep('C.con-leche-j16'), 'con-ron': diagStep('A.con-ron'), 'con-ron --jobs=16': diagStep('C.con-ron-j16') },
  ours: { 'nanoda, our pinned build (ammkrn/nanoda_lib 8de7e0c4; 16 threads, 1 GiB stack)': diagStep('C.nanoda-pinned') },
  checkers: nrd('named-checkers.sha256').trim().split('\n').filter(Boolean).map((l) => ({ sha256: l.split(/\s+/)[0], path: l.split(/\s+/)[1] })),
  wrapper: nrd('named-nanoda-pinned.sh') || null,
} : null;
if (challenge.pin !== pinSha) fails.push('the judge\'s challenge was written from another pin');
for (const [k, p] of Object.entries(planted)) if (!p.refused) fails.push('the planted ' + k + ' was NOT refused');
/* P3: OpenAI's own challenge. The pod checked the fetched .lean against PINS.json; we check the same sha256 here. */
const CH = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'openai-chain', 'challenge', 'PINS.json'), 'utf8'));
const p30 = JSON.parse(rd('P3.0.out') || 'null');
const notRun = rd('P3.notrun').trim() || null;
const p3j = fs.existsSync(path.join(dir, 'P3.exit')) ? J.judged(dir, 'P3') : null;
const p3shippedRan = !notRun && !!p3j && Number.isFinite(p3j.exit);
const p3ran = p3shippedRan && !!q3 && Number.isFinite(q3.exit);
const p3accepted = p3ran && q3.exit === 0 && q3.okay && NAMED.every((k) => q3.accepted.includes(k));
const p3 = {
  challenge: { pin: 'corpus/eth-refutation/openai-chain/challenge/SubexponentialSAT.lean', sha256: CH.files['SubexponentialSAT.lean'].sha256, upstream: CH.upstream.commit, served: p30 ? p30.leanSha256 : null, module: 'Challenge.OpenAISubexponentialSAT' },
  ran: p3ran, accepted: p3accepted, checkers: q3 ? q3.accepted : [], sandbox: q3 ? q3.sandbox : null, named: q3,
  shipped: p3j ? { ...p3j, stops: stops(rd('P3.err')) } : null,
  rejection: p3ran && !p3accepted ? (q3.mismatch || ('exit ' + q3.exit)) : null,
  notRunReason: notRun, configChanges: p30 ? p30.configChanges : null, config: p30 ? p30.config : null,
  buildError: notRun && /does not compile/.test(notRun) ? rd('P3b.err').split('\n').filter((l) => /error/.test(l)).slice(0, 5) : null,
};
if (!p30) fails.push('P3 left no facts (P3.0.out)');
else if (p30.leanSha256 !== CH.files['SubexponentialSAT.lean'].sha256) fails.push('the pod\'s copy of OpenAI\'s challenge is not the pinned bytes');
if (notRun && !/does not compile/.test(notRun)) fails.push('P3 ' + notRun);
if (p3shippedRan && !p3ran) fails.push('OpenAI\'s own challenge: no named run (Q3)');
if (p3ran && !p3accepted) fails.push('OpenAI\'s own challenge with the named checkers did not accept the ported proof (' + p3.rejection + '; checkers accepting: ' + q3.accepted.join(', ') + ')');
const n = (x) => (x || 0).toLocaleString('en-US');
const rec = {
  what: 'The OpenAI chain in one environment: OpenAI\'s family-378 proof (exact_count_and_sat, original_sat_main) and Hawkley\'s two bridge theorems ported to complexitylib\'s Lean (v4.36.0-rc2) prove MainResults.ETHIsFalse against the vendored MainResults.lean, and with C2 give ¬ETH on cslib\'s multitape Turing machine, decided here with our statement pin, the port ledger against the scout pins, axioms files, nanoda (two negative controls), leanchecker --fresh, three planted variants, and Lean\'s own judge (lake comparator) with named checkers — leanchecker-paranoid, nanoda (our pinned build, 1 GiB stack), lean4lean (fuel ×100) and Lean\'s default kernel — beside the judge as shipped (--paranoid), whose four bundled checkers stop at their own limits on this export.',
  generated: new Date().toISOString().slice(0, 10),
  claim: { repo: 'https://github.com/carlostoledo1891/claimbox', commit: JSON.parse(rd('_status.json') || '{}')._claimbox, folder: 'lean/eth-bridge',
    theorem: 'EthBridge.OpenAIChain.not_eth', builtOn: 'cslib-community/complexitylib 7c66eb71 (Lean v4.36.0-rc2)',
    port: { of: 'openai/math @ 7ef5c0cc (OpenAI\'s family-378 proof and ParityLifts, 3,183 files) and thinkthoughts/math @ d6b79b7d (Hawkley\'s OAI.Bridges, 27 files), the closure of the two bridge files, pinned at d6b79b7d',
      files: port.counts.present, byteIdentical: port.counts.unchanged, modified: port.counts.modifiedDeclared, ledger: 'lean/eth-bridge/OpenAIEth/PORT.md', pins: 'corpus/eth-refutation/openai-chain/scout-pins.json' },
    authors: 'the statement by hand; the port and the corollary by an AI agent (Claude), in claimbox' },
  verdict: fails.length ? 'REFUSED' : 'CERTIFIED',
  scope: 'ETH (complexitylib\'s, on cslib\'s deterministic multitape Turing machine with encCNF) is false, from OpenAI\'s own proof through Hawkley\'s two links and C2, every step elaborated and checked in one Lean (v4.36.0-rc2): no step from OpenAI\'s proof to the standard machine crosses a version seam. Decided: the statement byte-equal to the pin, MainResults.lean byte-equal to Anthropic\'s, every ported file byte-equal to its scout pin (' + n(port.counts.unchanged) + ') or modified as PORT.md declares (' + n(port.counts.modifiedDeclared) + '), Hawkley\'s two theorem types as pinned, the three standard axioms, nanoda accepting all ' + n(nanoda.claim.declarations) + ' declarations beneath it, leanchecker --fresh, the three planted variants refused, and lake comparator accepting with its named checkers (' + (q1 ? q1.accepted.join(', ') : 'none') + '). As shipped, lake comparator --paranoid accepts with Lean paranoid and Lean default and its four bundled checkers stop at their own limits (nanoda: a worker thread\'s stack; lean4lean: its fuel; con-leche and con-ron: a compiled fuel constant, "never a verdict" in their charter) — recorded, not counted as a rejection.'
    + (p3accepted ? ' OpenAI\'s own Comparator challenge (its SubexponentialSAT.lean at 7ef5c0cc, unchanged; the path in p3.challenge) accepts the ported proof of exact_count_and_sat in the new Lean with the same named checkers.' : notRun ? ' OpenAI\'s own challenge against the ported proof: NOT RUN (' + notRun.replace(/^NOT RUN: /, '') + ').' : ''),
  fails,
  statement: { pin: 'corpus/eth-refutation/openai-chain/statement.lean', sha256: pinSha, mainResults: { pin: 'corpus/eth-refutation/tsavo/pins.json', sha256: MAIN_PIN, served: stmt.mainResultsSha256 } },
  reading: [
    'The proof that checks here is a modified copy of OpenAI\'s and Hawkley\'s: ' + n(port.counts.modifiedDeclared) + ' of its ' + n(port.counts.present) + ' files were changed to build on the newer Lean and Mathlib (every change listed with both sha256s in OpenAIEth/PORT.md, and every file checked here against the scout pins: byte-equal to its pin, or modified exactly as declared, nothing else). Lean checks whatever proof is there against the unchanged statements (Hawkley\'s two theorem types printed by our file, MainResults.lean byte-equal to Anthropic\'s), so the port changes nothing that is decided; it is said here because the proof is not OpenAI\'s or Hawkley\'s bytes.',
    'This closes the version seam on OpenAI\'s side the way Anthropic\'s was closed (certs/eth-chain.json): by rebuilding the proof in the statement\'s Lean (v4.36.0-rc2), not by comparing kernels across v4.34.1 → v4.36.0-rc2. That complexitylib\'s ETH is the textbook ETH stays a reading of a definition.',
    'Lean\'s judge ran without its sandbox (bubblewrap cannot create a user namespace on RunPod\'s containers). The sandbox protects the judge from a hostile build; the build here is our own claimbox\'s.',
    'The judge\'s --paranoid run did not finish on this export (2.45 GB; the Anthropic chain\'s was 0.65 GB and all six checkers accepted there): the bundled nanoda 0.4.17 overflows a worker thread\'s stack and has no stack setting, lean4lean\'s fuel counter reaches zero, con-leche and con-ron exhaust a compiled fuel constant — each stop reproduced by hand on the comparator\'s own export (judge.diagnosis). The verdict reads the judge re-run with checkers that can finish: leanchecker-paranoid, our pinned nanoda with a 1 GiB thread stack, lean4lean with its fuel raised 100×, and Lean\'s default kernel. con-leche and con-ron are not among them; nothing here is their verdict either way. The amendment is dated in the pre-registration.',
    'claimbox and cert-machine have the same operator: this decision separates the roles of author and checker; it is not a second party.'
  ],
  judge: { named: { chain: q1, planted: q2, checkers: NAMED, externalKernels: q0 ? q0.externalKernels : null, challengeSha256: q0 ? q0.challenge : null, facts: namedDir ? path.relative(ROOT, namedDir) : null },
    shipped: { claim: { ...judge, stops: stops(rd('P1.err')) }, planted: plantedJudge, challengeSha256: challenge.challenge }, diagnosis },
  p3,
  port: { pins: 'corpus/eth-refutation/openai-chain/scout-pins.json', pinsSha256: pinsSha, pinCommit: PINS.commit, portMd: { found: port.portMdFound, sha256: port.portMdSha256 }, counts: port.counts, modified: port.modified, refusals: port.refusals },
  statements, axioms, nanoda, planted,
  steps: { buildSeconds: Number(rd('L2.end')) - Number(rd('L2.start')), leancheckerSeconds: Number(rd('L5.end')) - Number(rd('L5.start')) },
  run: { id: run.run, auditSha: run.auditSha, host: run.host, startedAt: run.startedAt, finishedAt: run.finishedAt, facts: path.relative(ROOT, dir) },
};
fs.writeFileSync(path.join(ROOT, 'certs', 'eth-openai-chain.json'), JSON.stringify(rec, null, 1) + '\n');
console.log('certs/eth-openai-chain.json: ' + rec.verdict + (fails.length ? ' (' + fails.join('; ') + ')' : '') + ' — port ' + port.counts.unchanged + ' unchanged, ' + port.counts.modifiedDeclared + ' modified as declared, ' + port.refusals.length + ' refused; nanoda ' + nanoda.claim.declarations + ' declarations; planted refused: ' + Object.entries(planted).filter(([, p]) => p.refused).map(([k]) => k).join(', ') + '; P3 ' + (p3accepted ? 'accepted' : p3ran ? 'REJECTED' : notRun || 'no facts'));
