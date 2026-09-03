#!/usr/bin/env node
/* build-paper-grading.js — generate paper/certificate-grounded-grading.md.

   HOUSE PATTERN (build-lambda4-writeup.js): the prose is authored once, here,
   and EVERY constant is interpolated from certs/envs-record.json. A paper whose
   thesis is that numbers should come from records may not carry typed numbers.

   The paper is the frozen argument; reports/envs.html is the living companion,
   and each number below is stamped with the date it was read.

   DRAFT STATE: sections 2 and 3 only. The build refuses to claim otherwise.

   usage: node tools/build-paper-grading.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const die = (m) => { console.error('GRADING PAPER REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'envs-record.json'), 'utf8'));
const abs = R.graders.find(g => /absolute/.test(g.name));
const rel = R.graders.find(g => /relative/.test(g.name));
const exa = R.graders.find(g => /exact/.test(g.name));
const enc = R.graders.find(g => /enclosure/.test(g.name));
if (!abs || !rel || !exa || !enc) die('a grader row is missing from the record');
if (enc.falseAccept !== 0 || enc.falseReject !== 0) die('the certificate grader is not sound in the record — section 3 would be false');
if (abs.falseAccept < 0.5) die('the suite no longer breaks tolerance checking');

const num = (n) => n.toLocaleString('en-US');
const pct = (x) => (100 * x).toFixed(1) + '%';
const tols = R.tolerancesProbed.slice().sort((a, b) => b - a);
const curve = tols.map(t => '`' + t.toExponential(0) + '` → ' + pct(abs.falseAcceptByTolerance[String(t)]));
const named = R.corpus.filter(f => !/^(chowla|erdos852-constants|henon|holmes|keller|newman|oeis|ramanujan|strassen)/.test(f.id) || f.record !== 'ledger.json');
const zero = R.corpus.filter(f => f.hi === f.lo).length;
const pub = R.corpus.find(f => f.publishedWrong !== null);
if (!pub) die('the corpus carries no published-wrong fact');
const narrow = R.corpus.filter(f => f.width > 0).sort((a, b) => a.width - b.width)[0];
const wtyp = R.corpus.filter(f => f.width > 0).map(f => f.width).sort((a, b) => a - b);
const wmed = wtyp[Math.floor(wtyp.length / 2)];
const rho = (tol, w) => (2 * tol - w) / w;

const L = [];
L.push('# Certificate-grounded grading: a construction manual');
L.push('');
L.push('*Carlos Toledo · cert-machine · DRAFT, sections 2 and 3 only*');
L.push('');
L.push('> **Status.** Machine-assisted draft, not peer-reviewed, not submitted. Every number in this');
L.push('> document was read from `certs/envs-record.json` at build time (' + R.meta.date + ', git `'
  + R.meta.git + '`); the living version of each is at <https://carlostoledo.co/reports/envs.html>, where it is');
L.push('> recomputed on every build. Sections 1 and 4-11 are outlined and unwritten; this file does not');
L.push('> pretend otherwise.');
L.push('');
L.push('**Thesis.** Verifier false-accept rates are measured today against labels, behavioural diffs and human');
L.push('adjudicators. Where a certificate exists the negative set can be *proved* instead, generated in closed');
L.push('form rather than mutated — and the field\'s standard remedy for numeric grading, tightening the');
L.push('tolerance, provably does not close the hole.');
L.push('');
L.push('---');
L.push('');

/* ---- §2 ------------------------------------------------------------------ */
L.push('## 2 · What "wrong" means, and why it is usually a comparison');
L.push('');
L.push('Three recent studies measure how often a verifier accepts an incorrect submission. They agree that the');
L.push('rate is large, they disagree about almost everything else, and they establish *incorrectness* in three');
L.push('different ways — none of which is a proof. Each says so about itself.');
L.push('');
L.push('| study | what it measures | how it establishes that a submission is wrong |');
L.push('|---|---|---|');
L.push('| Ray, *Fuzzing RLVR Verifiers* (arXiv:2606.01066) | buggy math / tool-call / code verifiers at false-positive rates 0.832, 0.869, 0.557; a `math-verify` replay at 10/60 | a **label supplied by the workload design**, with a stricter verifier as an operational proxy |');
L.push('| Rajan, *Auditing Reward Hackability in Code RL* (arXiv:2606.16062) | 28.5% of a SWE-bench Verified sample and 25.0% of an R2E-Gym sample accept an incorrect patch; hackable tasks inflate Pass@1 by +14.14 pp across 134 models | an **LLM-generated patch that changes observable behaviour** and still passes, executed in Docker |');
L.push('| Zhang, *When the Reward Suite Is Leaky* (arXiv:2607.11022) | a preregistered causal contrast on MBPP; leak-stratum false-positive share +43.8 pt; 47.57% of rewarded false positives are genuinely wrong code | **signed, human-adjudicated rules** — a person read each one |');
L.push('');
L.push('The first is the most explicit about the limitation, and states it better than a critic would:');
L.push('');
L.push('> "Throughout the paper, T(c) is the intended semantic label supplied by the workload design. The strict');
L.push('> verifier is an operational proxy for T(c), not a formal proof of correctness. Accordingly, a strict');
L.push('> false-positive rate of zero means zero on the generated cases in this controlled evaluation, not zero');
L.push('> for all possible completions or deployments."');
L.push('');
L.push('That paragraph is the opening this paper walks through. When wrongness is a label, a measured');
L.push('false-accept rate is a **disagreement between two graders**, and it can be attacked by attacking the');
L.push('reference. When wrongness is a behavioural diff, the rate inherits whatever the diff missed. When it is');
L.push('a human adjudication, the rate inherits the adjudicator. In each case the number is an estimate of a');
L.push('quantity nobody can exhibit.');
L.push('');
L.push('### 2.1 What a certificate changes');
L.push('');
L.push('Let *q* be a quantity and let a **certificate** for *q* be a pair of exact rationals `[lo, hi]` with a');
L.push('machine-checkable proof that `lo ≤ q ≤ hi`, produced by outward-rounded interval arithmetic. Call');
L.push('`w = hi − lo` the **width**.');
L.push('');
L.push('A submitted value *v* is **refuted by the certificate** when `v < lo` or `v > hi`. This is not a');
L.push('comparison against a reference answer: it is a theorem, and it holds against every possible reference');
L.push('answer at once. There is no key to attack, no proxy to out-strict, and no adjudicator to disagree with.');
L.push('');
L.push('The consequence for measurement is the whole point of this paper. If a grader accepts a value that a');
L.push('certificate refutes, the false accept is **a proof about the grader**, not evidence about it. The rate');
L.push('stops being an estimate.');
L.push('');
L.push('### 2.2 Four grader shapes');
L.push('');
L.push('Fix a stored reference `k ∈ [lo, hi]` — a correct decimal, as an answer key is supposed to be — and a');
L.push('tolerance `tol > 0`. The shapes measured here are the ones deployed in practice:');
L.push('');
L.push('- **absolute tolerance** — accept `v` iff `|v − k| < tol`;');
L.push('- **relative tolerance** — accept `v` iff `|v − k| / |k| < tol`;');
L.push('- **exact match** — accept `v` iff `v = k` as a literal;');
L.push('- **certificate-grounded** — accept `v` iff `lo ≤ v ≤ hi`.');
L.push('');
L.push('Only the last consults the proof. The first two consult a decimal and a slack; the third consults a');
L.push('decimal and nothing else.');
L.push('');

/* ---- §3 ------------------------------------------------------------------ */
L.push('## 3 · The acceptance band');
L.push('');
L.push('### 3.1 The band, and its width');
L.push('');
L.push('Write `A = (k − tol, k + tol)` for the values an absolute-tolerance grader accepts and');
L.push('`Rc = (−∞, lo) ∪ (hi, ∞)` for the values the certificate refutes. The **acceptance band** is');
L.push('`B = A ∩ Rc`: the values that are simultaneously accepted by the grader and proved wrong.');
L.push('');
L.push('**Proposition 1.** *If `k` is the midpoint of `[lo, hi]` and `tol > w/2`, then*');
L.push('');
L.push('```');
L.push('    |B| = 2·tol − w,');
L.push('```');
L.push('');
L.push('*and `B` is empty precisely when `tol ≤ w/2`.*');
L.push('');
L.push('*Proof.* `B = (k − tol, lo) ∪ (hi, k + tol)`. With `k = (lo + hi)/2` each part has length');
L.push('`tol − w/2`, which is positive exactly when `tol > w/2`; the two are disjoint. ∎');
L.push('');
L.push('Define the **band ratio**');
L.push('');
L.push('```');
L.push('    ρ = |B| / w = 2·tol/w − 1,');
L.push('```');
L.push('');
L.push('the number of certificate-widths of wrongness the grader will accept. It is the single tuning number of');
L.push('this paper, and it depends on the *ratio* of tolerance to certificate width — not on either alone.');
L.push('');
L.push('### 3.2 The remedy that does not work');
L.push('');
L.push('The bug taxonomy in Ray (2606.01066) lists the failure mode directly — *"Math · Loose tolerance ·');
L.push('accepts nearby wrong value"* — and prescribes the obvious fix: **"uses tight numeric tolerance."**');
L.push('');
L.push('Proposition 1 says that fix is insufficient in a specific and quantitative way. Tightening `tol` shrinks');
L.push('`|B|` linearly and closes it only at `tol = w/2` — at which point the grader accepts a *sub-interval* of');
L.push('the certificate and has become a certificate-grounded grader with gratuitous false rejects. For every');
L.push('tolerance above that threshold the band is non-empty, and for the widths this lab actually holds it is');
L.push('enormous: a typical certificate here has `w ≈ ' + wmed.toExponential(0) + '`, so a routine `tol = 1e-9`');
L.push('gives `ρ ≈ ' + Math.round(rho(1e-9, wmed)).toLocaleString('en-US') + '` — the grader accepts a band');
L.push('roughly ' + Math.round(rho(1e-9, wmed)).toLocaleString('en-US') + ' times wider than the proof.');
L.push('');
L.push('The narrowest non-degenerate certificate in the corpus has `w = ' + narrow.width.toExponential(2)
  + '`; at the same tolerance its ratio is `ρ ≈ ' + Math.round(rho(1e-9, narrow.width)).toLocaleString('en-US') + '`.');
L.push('');
L.push('### 3.3 The measurement');
L.push('');
L.push('The band is not an argument about what *could* happen; it is a generator. Every value in `B` is a');
L.push('submission that is provably wrong and guaranteed to pass, so the adversarial set is enumerated rather');
L.push('than mutated, and it is unbounded.');
L.push('');
L.push('Corpus: **' + num(R.corpus.length) + ' certified facts**, each read from a record in this repository and');
L.push('sha256-pinned to it — ' + num(zero) + ' of them exact integers (width zero: a tensor rank, a contact');
L.push('count, a period count). Tolerances probed: ' + tols.map(t => '`' + t.toExponential(0) + '`').join(', ') + '.');
L.push('Submissions: **' + num(R.submissions) + '**, of which **' + num(R.provablyWrong) + ' are provably wrong**');
L.push('and ' + num(R.provablyRight) + ' are provably right — the second half matters, because a false-accept');
L.push('benchmark with no controls is passed perfectly by a grader that rejects everything.');
L.push('');
L.push('| grader | false-accept | false-reject | soundness `(1−FA)(1−FR)` |');
L.push('|---|---|---|---|');
for (const g of [abs, rel, exa, enc]) {
  /* the grader names contain pipes (|v - key| < tol); escape or the table breaks */
  L.push('| ' + g.name.replace(/\s*<-.*$/, '').replace(/\|/g, '\\|') + ' | ' + pct(g.falseAccept) + ' | '
    + pct(g.falseReject) + ' | ' + pct(g.soundness) + ' |');
}
L.push('');
L.push('And the curve that carries §3.2 — absolute-tolerance false-accept as the tolerance tightens:');
L.push('');
L.push(curve.join(' · '));
L.push('');
L.push('It declines, and Proposition 1 says exactly why: the band closes **fact by fact**, as `tol` drops below');
L.push('half that fact\'s width. The aggregate reaches zero only when the tolerance is under half the width of');
L.push('*every* certificate in the corpus — at which point the grader has become certificate-grounded for all of');
L.push('them, and has paid for it in false rejects. At `' + tols[tols.length - 1].toExponential(0) + '`, a');
L.push('tolerance at the edge of what a double can carry, it still accepts '
  + pct(abs.falseAcceptByTolerance[String(tols[tols.length - 1])]) + ' of submissions that are proved wrong —');
L.push('those whose certificates are wider than ' + (2 * tols[tols.length - 1]).toExponential(0) + '.');
L.push('');
L.push('### 3.4 The strictness tradeoff is not fundamental');
L.push('');
L.push('Ray reports the cost of strictness as an operational fact: a SymPy-backed replacement removes the');
L.push('measured false positives, but acceptance falls from 0.500 to 0.400 and coverage from 0.900 to 0.760.');
L.push('Narrowing the accepted *language* buys soundness and pays in rejection.');
L.push('');
L.push('The exact-match row above reproduces that shape — ' + pct(exa.falseAccept) + ' false-accept at');
L.push(pct(exa.falseReject) + ' false-reject — and the certificate-grounded row breaks it: '
  + pct(enc.falseAccept) + ' and ' + pct(enc.falseReject) + '. The tradeoff is an artifact of grading against a');
L.push('decimal. A certificate does not narrow the accepted language heuristically; it *defines* it, and the');
L.push('definition is exactly the set of values not yet refuted.');
L.push('');
L.push('### 3.5 One canary that is not synthetic');
L.push('');
L.push('Every family above is constructed. One is not. The corpus fact `' + pub.id + '` carries the value a real');
L.push('problem thread published for the quantity, `' + pub.publishedWrong + '`, which lies outside this');
L.push('lab\'s certificate by `'
  + Math.abs(pub.publishedWrong < pub.lo ? pub.lo - pub.publishedWrong : pub.publishedWrong - pub.hi).toExponential(2)
  + '` and inside any ordinary tolerance of it. It is a member of the acceptance band that nobody had to mint:');
L.push('it was printed, in public, as a result.');
L.push('');
L.push('---');
L.push('');
L.push('*Sections 1 and 4-11 are outlined and unwritten. Generated by `tools/build-paper-grading.js` from');
L.push('`certs/envs-record.json`; git `' + git + '`.*');
L.push('');

fs.writeFileSync(path.join(ROOT, 'paper', 'certificate-grounded-grading.md'), L.join('\n'));
console.log('paper/certificate-grounded-grading.md written: sections 2-3, ' + num(R.corpus.length) + ' facts, '
  + num(R.submissions) + ' submissions, band ratio at 1e-9 vs median width ' + Math.round(rho(1e-9, wmed)) + ' @ git ' + git);
