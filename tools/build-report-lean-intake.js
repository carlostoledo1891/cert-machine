#!/usr/bin/env node
/* build-report-lean-intake.js — reports/lean-intake.html: the Lean intake (tools/lean-intake.js) and the two claims it has
   decided, Erdős #488 (the pilot, against a hand run's answers) and Erdős #786(i) (a claim it had not seen).

   Every number, statement and verdict word is read from certs/lean-intake-erdos-488.json and certs/lean-intake-erdos-786i.json
   (each re-derived from its run's facts by `tools/lean-intake.js record <id> --check`) and from their pre-registered specs;
   the build refuses when a verdict is not the one this page states. The limits and every amendment come before the results.

   usage: node tools/build-report-lean-intake.js                                                                     MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));   /* the page's own light art card (og-lean-intake.png) */
const die = (m) => { console.error('LEAN INTAKE REPORT REFUSED: ' + m); process.exit(1); };
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');

const IDS = ['erdos-488', 'erdos-786i'];
const R = {}, S = {};
for (const id of IDS) { R[id] = J('certs/lean-intake-' + id + '.json'); S[id] = J('corpus/lean-intake/' + id + '/spec.json'); }
const A = R['erdos-488'], B = R['erdos-786i'];

/* the words this page states, each read back from the records */
for (const id of IDS) {
  const r = R[id];
  if (r.verdict !== 'CERTIFIED') die(id + ' is ' + r.verdict + ', and this page states CERTIFIED');
  for (const k of ['F1', 'F3']) if (r.words[k] !== 'CERTIFIED') die(id + ' ' + k + ' is ' + r.words[k]);
  if (r.words.F1controls.word !== 'CERTIFIED' || r.words.plantedClaims.word !== 'CERTIFIED') die(id + ': a control is not as expected');
  if (!r.kernels.every((k) => k.word === 'ACCEPTS')) die(id + ': a kernel does not accept');
  if ([...r.F1.axioms].sort().join() !== 'Classical.choice,Quot.sound,propext') die(id + ' rests on more than the three standard axioms');
}
if (A.words.F2.word !== 'CERTIFIED' || !A.F2.kernel.confirmed) die('#488 F2 is not certified and kernel-confirmed');
if (!/^REFUSED \(not run\)/.test(B.words.F2.word)) die('#786(i) F2 is not the refusal this page explains');
const F2 = A.F2, F2c = F2.canonical;
if (!A.reproduces || !A.reproduces.rows.every((r) => r.same)) die('the #488 run no longer reaches the hand run\'s verdicts');
if (F2c.implicationDisagreements !== F2c.implicationExplained || F2c.explainedBy.join() !== '0 ∉ A' || F2c.explainedInstances.join() !== 'A = [0]') die('the #488 disagreements are no longer the A = {0} ones this page explains');
const ctl = (r, kind) => { const xs = r.mutants.filter((x) => x.kind === kind); return [xs.filter((x) => x.asExpected).length, xs.length]; };
const sum = (kind) => IDS.reduce((s, id) => [s[0] + ctl(R[id], kind)[0], s[1] + ctl(R[id], kind)[1]], [0, 0]);
const [wOk, wN] = sum('wrong'), [sOk, sN] = sum('same'), [eOk, eN] = sum('equivalent');
const redsOk = IDS.reduce((s, id) => s + R[id].reds.filter((x) => x.caught).length, 0), redsN = IDS.reduce((s, id) => s + R[id].reds.length, 0);
if (wOk !== wN || sOk !== sN || eOk !== eN || redsOk !== redsN) die('a planted statement or defect is not as expected');

/* the clock of the fresh claim: its spec's commit, then the last step of its run */
const specAt = cp.execSync('git log --diff-filter=A --format=%cI -- corpus/lean-intake/erdos-786i/spec.json', { cwd: ROOT }).toString().trim().split('\n').pop();
const status = fs.readFileSync(path.join(ROOT, B.run.facts, '_status.txt'), 'utf8').trim().split('\n');
const endAt = status[status.length - 1].split(' ')[0];
const minutes = Math.round((Date.parse(endAt) - Date.parse(specAt)) / 60000);
if (!(minutes > 0 && minutes < 240)) die('the fresh claim\'s clock reads ' + minutes + ' minutes');
const hhmm = (iso) => new Date(iso).toISOString().slice(11, 16);
const ndec = (B.kernels.find((k) => /^nanoda/.test(k.name)) || {}).name ? (fs.readFileSync(path.join(ROOT, B.run.facts, 'nanoda.log'), 'utf8').match(/Checked (\d+) declarations/) || [])[1] : null;
if (!ndec) die('the nanoda log of #786(i) does not print its declaration count');

const TITLE = 'Does an AI’s Lean proof prove the right statement? One command to check';
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: TITLE,
  deck: 'A Lean proof can be correct and still prove the wrong thing: a dropped hypothesis, a changed constant, a definition that is not the one in the problem list. '
    + 'Lean’s kernels settle the first question. This tool settles the second with exact checks instead of a reader’s opinion, and tests itself on every run with planted wrong statements. '
    + 'Two AI-written refutations of Erdős problems, both waiting as pull requests on Google DeepMind’s list of open problems, went through it.'
}));

O.push(C.tldr({
  findingRaw: 'Both proofs refute Google DeepMind’s statements as they stand today, with only the standard axioms, under three kernels. On #786(i) the proof states its own copies of two definitions; the kernel accepts it against DeepMind’s, so they match. '
    + 'On #488 the formal statement agrees with Erdős’s sentence on every small case where the sentence is defined; where the two differ, at A = {0}, the sentence is false as written and the hypothesis DeepMind added excludes exactly those cases.',
  mechanismRaw: 'The kernel is given the claimant’s proof and DeepMind’s statement, taken from DeepMind’s own declaration and never retyped; it accepts only if the two statements are the same after unfolding definitions. '
    + 'Planted wrong statements must be refused and rewordings accepted; the hypotheses must have a model; on finite cases, Lean and an exact program written from the problem’s sentence alone must agree.',
  checkRaw: m('node tools/lean-intake.js record <id> --check') + ' re-derives each record from its run’s facts; ' + m('run <id>') + ' repeats the run from the pre-registered spec.'
}));

O.push(C.stats([
  { k: 'claims decided', v: '2', n: 'Erdős #488 and #786(i), both open pull requests' },
  { k: 'planted wrong statements refused', v: wOk + ' of ' + wN, n: 'and ' + sOk + ' of ' + sN + ' rewordings accepted' },
  { k: 'planted defects in the proofs caught', v: redsOk + ' of ' + redsN, n: 'a false step, a sorry, an axiom, native_decide' },
  { k: 'the fresh claim, rules to record', v: minutes + ' min', n: 'on a laptop, no rented machine' }
]));

O.push(C.scope('The mathematics is the claimants’: Declan Gessel’s, with OpenAI’s GPT-6 Astra in Codex, for both refutations; the statements are Google DeepMind’s, in formal-conjectures. This page checks their proofs against those statements; it is not new mathematics. The tool is mine, written with Claude (Anthropic).'));

O.push(C.section({
  lab: 'first, the limits', title: 'What these checks do not decide', id: 'limits',
  bodyRaw: C.plainList([
    { b: 'Whether the formal statement is the problem.', text: 'That stays a reading. The instance check below is evidence on finitely many cases, not a proof that the statement is the right one.' },
    { b: '“Same statement” means the same after unfolding definitions.', text: 'Two statements that are equivalent only by an argument are refused as different. The planted controls measure this: all ' + eN + ' such statements were refused.' },
    { b: 'The instance check compares true and false on small cases.', text: 'A change that never flips an answer there is invisible to it: on #488, a statement that counts from 2 instead of 1 changes the counts whenever 1 is in A, and never an answer.' },
    { b: 'Not every statement has small cases.', text: '#786(i) is about the density of infinite sets for a real ε; the instance check was refused there, as written down before the run.' },
    { b: 'Four of the checkers bundled with Lean 4.35 were not run.', text: 'Both claims are on Lean 4.33.1, which ships only leanchecker; ' + A.notRun.join(', ') + ' come with Lean 4.35 and later. nanoda was built here.' }
  ])
}));

O.push(C.section({
  lab: 'also first', title: 'Where the runs differed from the plan', id: 'amendments',
  bodyRaw: C.pRaw('Each claim’s spec, with every planted statement and its expected outcome, was committed before any run. Four expectations or files were wrong, and each was amended in the open, with the first outcome kept beside the new one.')
    + C.plainList([
      { b: '#488, a planted “wrong” statement was the same.', text: 'Counting from 0 instead of 1 changes nothing, because 0 is never in the set counted; the kernel saw it by reduction and accepted. The pre-registration’s label was wrong, not the check (' + A.words.F1controls.asPreregistered + ' as first written).' },
      { b: '#488, the instance check found more than expected.', text: 'The pre-registration expected the formal statement and Erdős’s sentence to agree everywhere; they differ on ' + F2c.implicationDisagreements + ' cases, all explained below.' },
      { b: '#488, one planted statement was invisible to the instance check.', text: 'Counting from 2 changes counts, never answers: the limit above, now measured.' },
      { b: '#786(i), a defect in the tool.', text: 'The generated test files lacked one line of DeepMind’s file (an open namespace), so the planted statements did not parse on the first run; fixed, and run again with no statement or expectation changed; then ' + B.words.F1controls.asPreregistered + ' came out as written.' }
    ])
}));

const row = (q, r488, r786) => [{ raw: C.esc(q) }, { raw: r488 }, { raw: r786 }];
const t = (v, k) => C.tag(v, k || 'held');
O.push(C.section({
  lab: 'the checks', title: 'The checks, claim by claim', id: 'checks', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'question' }, { h: 'Erdős #488' }, { h: 'Erdős #786(i)' }],
    rows: [
      row('Does the proof refute DeepMind’s statement, taken from its declaration?', t('yes, the kernel accepts'), t('yes, the kernel accepts')),
      row('Wrong statements planted: refused?', C.esc(ctl(A, 'wrong').join(' of ')), C.esc(ctl(B, 'wrong').join(' of '))),
      row('The same statement in other words: accepted?', C.esc(ctl(A, 'same').join(' of ')), C.esc(ctl(B, 'same').join(' of '))),
      row('Do the hypotheses have a model?', C.esc(A.F3.witness.replace(/^a model of the canonical statement's hypotheses: /, '')), C.esc(B.F3.witness.replace(/^a model of the canonical statement's hypotheses: /, ''))),
      row('Small cases: Lean against the problem’s sentence?', C.esc('agrees on all ' + N(F2c.conclusionCompared) + ' defined cases; the kernel confirms'), t('no small cases', 'open')),
      row('Defects planted in the proof: caught?', C.esc(A.words.plantedClaims.caught), C.esc(B.words.plantedClaims.caught)),
      row('Kernels', C.esc(A.kernels.length + ' accept'), C.esc(B.kernels.length + ' accept: Lean, leanchecker, nanoda (' + N(ndec) + ' declarations)')),
      row('Axioms', C.esc('the three standard'), C.esc('the three standard'))
    ]
  })
}));

O.push(C.section({
  lab: 'Erdős #488', title: 'The formal statement against Erdős’s sentence, case by case', id: 'erdos-488',
  bodyRaw: C.pRaw('Erdős asked: for a finite set A and B the numbers n ≥ 1 with a divisor in A, is ' + m('|B ∩ [1,m]|/m < 2|B ∩ [1,n]|/n') + ' for every ' + m('m > n ≥ max(A)') + '? '
      + 'Gessel’s proof refutes DeepMind’s Lean statement of it; this run reached the three verdicts a separate hand-written check of 6 November had reached, from a spec and one command.')
    + C.pRaw('The new check: Lean evaluated DeepMind’s statement, part by part, on ' + N(F2.instances) + ' small cases (A a nonempty subset of {0, …, 5}, n below 6, m below 8), and the kernel confirmed every value. '
      + 'A program written from Erdős’s sentence alone, in exact integers, with no Lean, evaluated the same cases. Each part of the statement agrees with it on every case where the sentence is defined (' + N(F2c.conclusionCompared) + '; the other ' + N(F2c.undefinedInInformal) + ' divide by zero).')
    + C.pRaw('The whole statements differ on ' + F2c.implicationDisagreements + ' cases, all with A = {0}. There B is empty, the sentence reads 0 < 0, and it is false as written. DeepMind’s statement adds three hypotheses Erdős did not write; one of them, '
      + m('0 ∉ A') + ', excludes exactly these cases, and ' + a('https://github.com/google-deepmind/formal-conjectures/pull/256', 'their pull request #256') + ' gives the reason. The check found that reason without being told.')
}));

O.push(C.section({
  lab: 'Erdős #786(i)', title: 'Its own definitions, checked against DeepMind’s', id: 'erdos-786',
  bodyRaw: C.pRaw('Part (i) asks whether, for every ε > 0, some set of density above 1 − ε has all its equal products of equal length. Gessel’s refutation (' + a('https://github.com/google-deepmind/formal-conjectures/pull/5299', 'pull request #5299') + ', open since 6 September) proves the density is at most 7/8. '
      + 'Its file states its own versions of the two definitions, and the pull request says they match the module’s. The kernel accepts the proof against DeepMind’s declaration as it stands today, so they do.')
    + C.pRaw('One thing the run turned up for the pull request: on 14 October DeepMind removed the ' + m('answer(…)') + ' wrapper from this statement, so the pull request’s change no longer applies to the file, and GitHub reports a conflict. The proof still refutes the statement on the current main branch.')
    + C.pRaw('This was the first claim the tool had not seen. From the spec’s commit at ' + hhmm(specAt) + ' UTC to the last step at ' + hhmm(endAt) + ': ' + minutes + ' minutes on a laptop, including the fix above. The hand-built check of #488 took hours of scripting and an hour on a rented machine.')
}));

O.push(C.section({
  lab: 'how it works', title: 'What one command does', id: 'how',
  bodyRaw: C.plainList([
    { b: 'Pins.', text: 'Both repositories are fetched at fixed commits and the two files compared by sha256; nothing of the claimant’s is copied into this repository.' },
    { b: 'Identity.', text: 'A theorem whose statement is DeepMind’s declaration, read with type_of%, and whose proof is the claimant’s term: the kernel accepts it only if the statements match.' },
    { b: 'Controls.', text: 'Planted statements: wrong ones must be refused at the claimant’s proof and nowhere else; rewordings must be accepted.' },
    { b: 'Non-vacuity.', text: 'The statement’s hypotheses, read as written, must have a model the kernel checks.' },
    { b: 'Small cases.', text: 'Each hypothesis and the conclusion as a decision, evaluated by Lean, confirmed by the kernel, and compared with an exact program written from the problem’s sentence alone.' },
    { b: 'Planted defects.', text: 'Copies of the proof with a false step, a sorry, an axiom or native_decide; each must be caught by a failed build or an axiom outside the standard three.' },
    { b: 'Kernels.', text: 'Lean’s, leanchecker, and nanoda through an export; the ones not run are named in the record.' }
  ])
}));

O.push(C.section({
  lab: 'check it yourself', title: 'How to re-run it', id: 'rerun',
  bodyRaw: C.plainList([
    { b: 'The records.', raw: IDS.map((id) => m('node tools/lean-intake.js record ' + id + ' --check')).join(' and ') + ' re-derive every verdict from ' + rec('corpus/lean-intake') + '.' },
    { b: 'The runs.', raw: m('node tools/lean-intake.js run <id>') + ' fetches the pins and repeats every step (Lean via elan; about 6 GB of Mathlib per claim).' },
    { b: 'The specs.', raw: IDS.map((id) => rec('corpus/lean-intake/' + id + '/spec.json')).join(' and ') + ', with their dated amendments.' },
    { b: 'The program for Erdős’s sentence.', raw: rec('instruments/intake/erdos-488.js') + ', standard library only.' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-lean-intake.js from certs/lean-intake-erdos-488.json and certs/lean-intake-erdos-786i.json (tools/lean-intake.js record --check). I built the tool with Claude (Anthropic).') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'lean-intake.html'),
  TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/lean-intake.html', og: { image: '/og-lean-intake.png', alt: OG.alt('lean-intake') },
    desc: 'A one-command check that an AI-written Lean proof proves the statement it claims: two refutations of Erdős problems (#488, #786(i)) checked against Google DeepMind’s statements, with planted wrong statements refused, rewordings accepted, and the formal statement compared with Erdős’s sentence on small cases.' }));
console.log('reports/lean-intake.html written · #488 ' + A.verdict + ' · #786(i) ' + B.verdict + ' · ' + wOk + '/' + wN + ' wrong refused · ' + minutes + ' min');
