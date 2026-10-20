#!/usr/bin/env node
/* build-report-apn.js — reports/alphaproof-nexus.html: Google DeepMind's AlphaProof Nexus (Science,
   doi:10.1126/science.aej2213; arXiv 2605.22763), its published Erdős and OEIS proofs replayed under two kernels and read
   against what they claim. Every number comes from the three records, each re-derived here before a word is written:
   certs/apn-statements.json (tools/apn-statements.py), certs/apn-kernel.json (tools/record-apn-kernel.js, from the
   hosted-runner runs of .github/workflows/apn-kernel.yml), certs/apn-oeis.json (tools/apn-oeis.py).

   usage: node tools/build-report-apn.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('APN REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
for (const t of ['tools/apn-statements.py', 'tools/apn-oeis.py']) {
  try { cp.execFileSync('python3', ['-I', t, '--check'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die(t + ' does not re-derive: ' + (e.stdout || '') + (e.stderr || e.message)); }
}
const S = J('certs/apn-statements.json'), K = J('certs/apn-kernel.json'), O = J('certs/apn-oeis.json'), Q = J('corpus/alphaproof-nexus/quotes.json');
const sc = S.counts, oc = O.counts;
/* what the page says, held against the records */
if (sc.statements !== 9 || sc.problemNumbers !== 7 || sc.S1 !== 9 || sc.S2 !== 9 || sc.S3 !== 9 || sc.S4 !== 9) die('the statement record no longer says nine equal statements over seven problem numbers');
if (JSON.stringify(sc.changedAtHead) !== '["erdos_741.parts.i"]') die('the statements changed at head are no longer exactly erdos_741.parts.i');
if (!S.redControls.every((r) => r.fired)) die('a statement red control did not fire');
const certified = K.rows.filter((r) => r.word === 'CERTIFIED');
if (certified.length !== K.rows.length) die('the page says every kernel item is CERTIFIED; the ledger says ' + JSON.stringify(K.counts));
if (!K.redControls || !K.redControls.length || !K.redControls.every((r) => r.fired)) die('the kernel lane\'s red controls have not all fired: ' + JSON.stringify(K.redControls));
if (O.published !== 38 || O.claimed !== 44 || oc.definitionsAgreeWithOEIS !== 38) die('the OEIS record no longer says 38 published of 44, every definition agreeing');
if (JSON.stringify(oc.priorProofRows) !== '["A237271","A325046","A382590"]') die('the earlier-proof rows changed: ' + oc.priorProofRows);
const w = oc.words;
const fmt = (n) => Number(n).toLocaleString('en-US');
/* reading text marks Lean code with backticks: set those spans in the monospace style, never as literal backticks */
const codeRaw = (t) => String(t).split('`').map((part, i) => (i % 2 ? C.m(part) : C.esc(part))).join('');
const secs = certified.map((r) => r.runs[r.runs.length - 1].seconds);
const nonMatch = O.rows.filter((r) => r.word !== 'MATCHES');
const v = O.verified;

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · a peer-reviewed release, replayed and read',
  title: 'AlphaProof Nexus: the proofs hold under two kernels; three OEIS conjectures were already proved, and two statements are degenerate',
  deck: 'Google DeepMind’s AlphaProof Nexus (Science, October 2026; arXiv 2605.22763) reports that its agent “resolved 9 of 353 open Erdős problems” and “proved 44/492 OEIS conjectures”, the latter “correctly formalized and previously unproven”. '
    + 'Its results repository publishes the Lean proofs. Here every published Erdős proof — and the corrected #741(i) the paper says it also found — is replayed by Comparator against formal-conjectures’ own statement with two independently written kernels, '
    + 'and every published OEIS statement is read against the conjecture it claims, its definition checked against the OEIS terms. The proofs hold. What the release says about them holds less well.'
}));
B.push(C.scope('Pinned: google-deepmind/alphaproof-nexus-results @ ' + S.apnCommit.slice(0, 8) + ' (Lean v4.27.0, Mathlib a3a10db), formal-conjectures @ ' + S.fcPin.slice(0, 8) + ' (the commit the repository builds against) and @ ' + S.fcHead.slice(0, 8) + ' (today), '
  + 'the arXiv preprint v1 and the seven erdosproblems.com pages by digest, the 38 OEIS records and b-files, the MathOverflow thread behind A382590 — corpus/alphaproof-nexus, with every file’s sha256. '
  + 'Nothing of the claimant was run on this machine; the kernel lane ran on GitHub’s hosted runners. Decided: statement equality and kernel acceptance. Read, by an AI agent and re-checked before stating: what each OEIS statement says against its conjecture. '
  + 'Not decided: whether formal-conjectures’ Erdős statements are the problems Erdős posed (beyond the #741 density point), and the six OEIS proofs the repository does not publish.'));
B.push(C.tldr({
  findingRaw: '<b>Gaps, first.</b> '
    + '(1) <b>' + O.published + ' of the ' + O.claimed + ' OEIS proofs</b> the paper counts are published. '
    + '(2) <b>Three of those ' + O.published + ' conjectures already had a proof on record</b> before the preprint (21 May 2026), against the paper’s “previously unproven”: A325046 (Sela Fried, approved on OEIS 17 Dec 2025), A382590 (Terence Tao’s accepted MathOverflow answer, 31 Mar 2025), A237271 (equivalent, per OEIS, to an A384149 conjecture Hoft proved on 11 Jan 2026). '
    + '(3) <b>Two OEIS statements hold for a reason unrelated to their conjecture</b>: A382590 counts prime factors with multiplicity, so its “k-th prime factor” is eventually the constant 2; A237271 defines the sequence by an already-proved characterization, which leaves a two-line divisor fact. '
    + '(4) “9 of 353 open Erdős problems” counts <b>formal statements</b>: nine statements over <b>seven</b> problem numbers — two parts each of #12 and #741, and three variants, one of them (#26) not posed by Erdős. The paper’s Table 1 marks this; the abstract does not. '
    + '(5) The published #741(i) proof is of the <b>natural-density</b> reading, which formal-conjectures demoted to a variant in August; the corrected upper-density proof the paper also counts is not in the results repository (it sits on formal-conjectures’ merged pull request #3778). It holds too.',
  mechanismRaw: '<b>What holds.</b> All <b>' + certified.length + '</b> kernel items are <b>CERTIFIED</b>: for each, Comparator builds OUR challenge — formal-conjectures’ statement file at the commit the repository builds against, the theorem renamed — and THEIR solution, byte for byte, in a sandbox, '
    + 'checks that the solution proves exactly the challenge’s elaborated statement with only propext, Quot.sound and Classical.choice, and replays it through Lean’s kernel and through nanoda, an independently written kernel. '
    + secs.length + ' jobs, ' + Math.min(...secs) + '–' + Math.max(...secs) + ' s each after the Mathlib cache. Textually too: the nine statements equal formal-conjectures’ at the pin, their definitions verbatim, nothing shadowed, no kernel-bypassing construct. '
    + 'All ' + O.published + ' OEIS definitions, translated into exact Python, reproduce the OEIS terms. Of the ' + O.published + ' OEIS statements: ' + (w.MATCHES || 0) + ' match, ' + (w.NARROWER || 0) + ' are narrower, ' + (w.STRONGER || 0) + ' stronger (harmlessly), ' + (w['VACUOUS/TRIVIAL'] || 0) + ' degenerate.',
  checkRaw: 'Red controls, which must be rejected, are: a weakened challenge statement and a solution whose proof is replaced by sorry (Comparator: ' + K.redControls.map((r) => C.esc(r.word)).join(', ') + '); in the textual lane, five planted changes (a weakened bound, a flipped answer, a changed definition, a shadowing declaration, an axiom), all caught. '
    + 'Re-derive: ' + C.m('python3 tools/apn-statements.py --check') + ', ' + C.m('python3 tools/apn-oeis.py --check') + ', ' + C.m('gh workflow run apn-kernel.yml -f items="…"') + ' then ' + C.m('node tools/record-apn-kernel.js <run>') + '.'
}));
B.push(C.section({
  lab: '§1 · OEIS', title: 'The OEIS conjectures: three already proved, two degenerate', id: 'oeis',
  bodyRaw: C.pRaw('The paper: “We used Gemini to autoformalize 492 open questions from the OEIS … ' + C.esc('The agent found proofs for 44 conjectures that a manual review found to be correctly formalized and previously unproven.') + '” The repository publishes ' + O.published + '. '
      + 'Each was read against its OEIS entry by an AI agent not told what to look for; each definition was translated into exact Python and run against the OEIS terms; every row below was re-checked against the sources before it is stated here. The readings are AI-made and unconfirmed by a specialist, and they say what a statement does not say — never that a proof is wrong.')
    + C.plainList([
      { b: 'A382590 — degenerate.', raw: codeRaw(v.A382590.finding) + ' ' + codeRaw(v.A382590.priorProof) },
      { b: 'A237271 — degenerate given its definition.', raw: codeRaw(v.A237271.finding) + ' ' + codeRaw(v.A237271.priorProof) },
      { b: 'A325046 — already proved.', raw: 'The statement matches the conjecture. ' + codeRaw(v.A325046.priorProof) }
    ].concat(nonMatch.filter((r) => !['A382590', 'A237271'].includes(r.anumber)).map((r) => ({ b: r.anumber + ' — ' + r.word.toLowerCase() + (r.declared === true ? ', declared' : r.declared === false ? ', not declared' : '') + '.', raw: codeRaw(r.reason) }))))
    + C.pRaw('Every definition agrees with the OEIS terms on the range its translation checks (from 9 to 10,000 terms; the ranges are in ' + C.m('certs/apn-oeis.json') + '). The translations re-run with ' + C.m('python3 -I corpus/alphaproof-nexus/oeis-reading/run_all.py') + ' (about two minutes).')
}));
B.push(C.section({
  lab: '§2 · Erdős', title: 'Nine statements, seven problems, two kernels', id: 'erdos',
  bodyRaw: C.pRaw('The paper: “Our most capable agent autonomously resolved 9 of 353 open Erdős problems”, and, in Table 1’s caption: “' + C.esc(Q.paper.table1Caption) + '” The 353 are formal-conjectures’ statements “at the time of the run”, parts and variants included.')
    + C.plainList(S.rows.map((r) => ({ b: r.theorem + ' — ' + r.kind + ', answer ' + r.answer + '.', raw: 'Statement equal to formal-conjectures’ at the pin; kernel lane '
      + C.esc((K.rows.find((k) => k.item === r.theorem) || {}).word || 'not run') + '.' + (r.S5 === 'changed' ? ' <b>Changed at formal-conjectures’ head</b>: the main statement is now the upper-density reading; this one survives as a variant.' : '') })))
    + C.pRaw('<b>#741(i).</b> erdosproblems.com: “' + C.esc((Q.erdosproblems['741'].sentences.find((s) => /upper density most likely/.test(s)) || '')) + '” The paper says the interpretation “was amended to … ‘upper density’ … after our full-featured agent found proofs using density as ‘natural density.’ Following the correction of the ambiguity, the agent was still able to resolve the questions.” '
      + 'The results repository publishes the natural-density proof; the corrected one is linked from formal-conjectures at commit 9d492049, the head of its merged pull request #3778. Both are CERTIFIED here.')
}));
B.push(C.section({
  lab: '§3 · method', title: 'How the kernel lane runs, and what was changed to run it', id: 'method',
  bodyRaw: C.pRaw('Comparator is the Lean FRO’s judge: it builds the challenge and the solution in a landrun sandbox, exports both with lean4export, compares every constant the theorem’s statement mentions, checks the axioms, and replays the proof through Lean’s kernel and nanoda. '
      + 'The repository is on Lean v4.27.0, and two declared amendments were needed, each found by a pilot that stopped and was recorded as REFUSED: '
      + '(1) Comparator before v4.34 does not pass “--” before the sandboxed command, so landrun consumed lean4export’s separator — the one-line v4.34 fix is applied; '
      + '(2) Comparator v4.27.0 parses only the old export format 2.0.0, which no lean4export for v4.27 writes — Comparator v4.28.0 and the lean4export its manifest pins are built with v4.27.0 instead. nanoda runs with a 1 GiB worker stack, as in the openai/math audit. Both are in the workflow’s comments.')
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-apn.js from certs/apn-statements.json, certs/apn-kernel.json and certs/apn-oeis.json, the first and last re-derived at build; @ git ' + git + '.') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'alphaproof-nexus.html'), TPL.render({
  title: 'AlphaProof Nexus, replayed and read · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'Google DeepMind’s AlphaProof Nexus: the published Erdős proofs CERTIFIED under two kernels against formal-conjectures’ statements; of the 38 published OEIS proofs (44 claimed), three conjectures already had a proof and two statements are degenerate.',
  path: '/reports/alphaproof-nexus.html'
}));
console.log('reports/alphaproof-nexus.html written: ' + certified.length + ' kernel items CERTIFIED, ' + O.published + '/' + O.claimed + ' OEIS published @ git ' + git);
