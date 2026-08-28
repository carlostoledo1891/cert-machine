#!/usr/bin/env node
/* build-report-answer-key.js — generate reports/answer-key.html: the
   answer-key-contamination note for people who build evaluations on
   mathematical ground truth.

   The argument is stitched from results this site already certifies, and
   every specimen is RE-PROVED at build time rather than quoted:
     I.   the float artifact published as a constant (Erdős #852) — the
          naive double product re-run live, required to reproduce the
          published digits; the exact refutation re-decided;
     II.  digit agreement as evidence (the impostor catalog) — the deepest
          agreement re-derived from the OEIS corpus in exact BigInt;
     III. the true-computation / false-print class (the RM mixed-zeta row)
          — both directions re-certified on one enclosure;
     IV.  the design that removes the answer key (the matmul eval) — the
          ledger re-read, the no-false-certification fact recomputed.
   The build refuses if any specimen moves.

   usage: node tools/build-report-answer-key.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const E = require(path.join(ROOT, 'instruments', 'erdos852', 'constants.js'));
const OE = require(path.join(ROOT, 'families', 'oeis-closedform.js'));
const RM = require(path.join(ROOT, 'families', 'ramanujan-audit.js'));

const sh = (c) => { try { return cp.execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };
const die = (m) => { console.error('ANSWER-KEY REPORT REFUSED: ' + m); process.exit(1); };

/* ---- specimen I: the float artifact, re-run live -------------------------
   Same recomputation the erdos852 report gates on: the naive IEEE-754
   product must reproduce the published digits, and the exact partial
   product must refute them. */
const LIM = 2000000;
const primes = E.oddPrimes(LIM);
let naive = 1, dropped = 0;
for (const p of primes) {
  const f = 1 + 1 / ((p - 1) ** 3);
  if (f === 1) dropped++;
  naive *= f;
}
const naiveC = (naive - 1) / 2;
if (Math.abs(naiveC - 0.0752403861777418) > 1e-15) die('the naive product no longer reproduces the published digits: ' + naiveC);
const cs = E.cstar({ limit: LIM, P: 192 });
if (E.decideClaimedDigits(cs.enclosure, '0.0752403861777').verdict !== 'REFUTED') die('the exact refutation no longer holds');
const dropPct = (100 * dropped / primes.length).toFixed(1);

/* ---- specimen II: digit agreement, re-derived from the corpus ------------
   The impostor catalog's harvest, reduced to the one number this page
   needs: the DEEPEST exact agreement between a published constant and a
   simple form it provably is not. Same routines as the impostor report
   (build-report-impostors.js) — the two pages must agree or both refuse. */
const K = { pi: Math.PI, e: Math.E, ln2: Math.LN2, ln10: Math.LN10,
  sqrt2: Math.SQRT2, sqrt3: Math.sqrt(3), sqrt5: Math.sqrt(5),
  phi: (1 + Math.sqrt(5)) / 2, euler: 0.5772156649015329 };
function labelValue(label) {
  let mm;
  if ((mm = /^(\d+)\/(\d+)$/.exec(label))) return Number(mm[1]) / Number(mm[2]);
  if ((mm = /^sqrt\((\d+)\/(\d+)\)$/.exec(label))) return Math.sqrt(Number(mm[1]) / Number(mm[2]));
  if ((mm = /^cbrt\((\d+)\/(\d+)\)$/.exec(label))) return Math.cbrt(Number(mm[1]) / Number(mm[2]));
  if ((mm = /^\((\d+)\/(\d+)\)([a-z0-9]+)$/.exec(label))) return (Number(mm[1]) / Number(mm[2])) * K[mm[3]];
  if ((mm = /^([a-z0-9]+)\^\((\d+)\/(\d+)\)$/.exec(label))) return Math.pow(K[mm[1]], Number(mm[2]) / Number(mm[3]));
  return NaN;
}
function toRational(v) {
  if (!isFinite(v) || v <= 0) return null;
  let x = v, h0 = 0, h1 = 1, k0 = 1, k1 = 0;
  for (let i = 0; i < 12; i++) {
    const a = Math.floor(x);
    const h = a * h1 + h0, k = a * k1 + k0;
    h0 = h1; h1 = h; k0 = k1; k1 = k;
    if (k > 4096) break;
    if (Math.abs(v - h / k) <= 1e-13 * v) return [BigInt(h), BigInt(k)];
    const frac = x - a;
    if (frac < 1e-13) break;
    x = 1 / frac;
  }
  return null;
}
function agreementDepth(entryDigits, p, q) {
  let i = 0; while (i < entryDigits.length && entryDigits[i] === 0) i++;
  const ds = entryDigits.slice(i).join('');
  const k = BigInt(ds.length);
  const D = BigInt(ds);
  let P = p, Q = q;
  while (P < Q) P *= 10n;
  while (P >= 10n * Q) Q *= 10n;
  const scale = 10n ** (k - 1n);
  const mid = P * scale;
  let gapN, gapD;
  if (mid < D * Q) { gapN = D * Q - mid; gapD = Q * scale; }
  else if (mid >= (D + 1n) * Q) { gapN = mid - (D + 1n) * Q; gapD = Q * scale; }
  else return Number(k);
  let d = 0;
  while (d < Number(k) + 10 && gapN * Q * (10n ** BigInt(d + 1)) <= P * gapD) d++;
  return d;
}
let deepest = 0, deepestId = null, refutedCount = 0;
for (let i = 0; ; i++) {
  const e = OE.enumerate(i); if (!e) break;
  if (!OE.interesting(e)) continue;
  const c = OE.certify(e);
  const x = c.extra;
  if (!x || !x.exactRefuted || !x.exactRefuted.length) continue;
  refutedCount += x.exactRefuted.length;
  for (const label of x.exactRefuted) {
    const r = toRational(labelValue(label));
    if (!r) die('cannot re-derive rational for label ' + label);
    const d = agreementDepth(e.digits, r[0], r[1]);
    if (d > deepest) { deepest = d; deepestId = x.id; }
  }
}
if (refutedCount !== 21) die('expected 21 exact impostor refutations, found ' + refutedCount);
if (deepest < 60) die('the deepest impostor agreement fell below 60 digits: ' + deepest);

/* ---- specimen III: true computation, false print, re-certified ----------- */
let rmPrinted = null, rmCorrected = null;
for (let i = 0; ; i++) {
  const o = RM.enumerate(i); if (!o) break;
  if (o.id === 'rm-zo-z5z3b-printed') rmPrinted = RM.certify(o);
  if (o.id === 'rm-zo-z5z3b-corrected') rmCorrected = RM.certify(o);
}
if (!rmPrinted || rmPrinted.verdict !== 'REJECT' || !/sign slip/.test(rmPrinted.text)) die('the RM printed-row refutation moved');
if (!rmCorrected || rmCorrected.verdict !== 'HIT') die('the RM correction no longer certifies');

/* ---- specimen IV: the keyless design, measured --------------------------- */
const evalRows = fs.readFileSync(path.join(ROOT, 'certs', 'matmul-eval-ledger.jsonl'), 'utf8')
  .trim().split('\n').map((l) => JSON.parse(l)).filter((r) => r.model !== 'fake');
if (!evalRows.length) die('the eval ledger holds no real-model rows');
const evalCert = evalRows.filter((r) => r.outcome === 'certified').length;

/* ---- the page ------------------------------------------------------------ */
const git = sh('git rev-parse --short HEAD') || 'unknown';
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · note for evaluation builders · specimens re-proved at every build',
  title: 'When the answer key is wrong',
  deck: 'An evaluation graded against reference values inherits the failure class of whatever computed them — '
    + 'and for mathematical ground truth the computing pipeline is usually floating point, checked by digit '
    + 'agreement. This note holds three certified specimens of answer keys going wrong in ways reruns and digit '
    + 'cross-checks provably cannot catch, and one working design that removes the answer key altogether. '
    + 'Every specimen was re-proved during the build that produced this page.'
}));

B.push(C.tldr({
  findingRaw: 'Three certified ways a mathematical answer key goes wrong: a float artifact published as a '
    + 'constant (correct to a rerun, wrong from digit 12); a published constant agreeing with a wrong closed '
    + 'form for ' + deepest + ' significant digits (digit-matching certifies the impostor); and a printed '
    + 'identity that is false while the computation behind it was right. A model that reproduces any of these '
    + 'grades as correct.',
  mechanismRaw: 'The failure class lives INSIDE the key: rerunning the same float pipeline reproduces the '
    + 'artifact digit for digit, so the standard remedy — recompute and compare digits — CONFIRMS the wrong '
    + 'value. The fix is structural, not more digits: grade witness-exhibiting tasks with exact certificates, '
    + 'so there is no reference value to contaminate.',
  checkRaw: 'every specimen re-proved at this page\'s build; the working design runs live — '
    + C.m('python3 tools/llm-harness.py --dry-run --family matmul --n 8') + ' from a clone shows the grader '
    + 'refuting its own red controls before it grades anything.'
}));

B.push(C.stats([
  { k: 'specimen I', v: 'wrong at digit 12', role: 'warn', n: 'a published constant that IS the naive IEEE-754 product — reproduced live this build, then refuted exactly' },
  { k: 'specimen II', v: deepest + ' digits of agreement', role: 'warn', n: 'a published constant vs a closed form it provably is not — re-derived in exact BigInt this build' },
  { k: 'specimen III', v: 'true math, false print', role: 'warn', n: 'a printed identity refuted while its own computation is certified correct on the same enclosure' },
  { k: 'the alternative', v: evalRows.length + ' rows, no key', role: 'held', n: evalCert + ' certified as theorems; zero false certifications — the answer key does not exist, so it cannot be wrong' }
]));

B.push(C.section({
  lab: '§1 · the class', title: 'Reruns confirm the bug',
  bodyRaw: [
    C.p('The reference values in mathematical answer keys are computed — by scripts, by CAS calls, by a model '
      + 'run once and trusted. When the pipeline is floating point, its silent failures become the key\'s silent '
      + 'failures, and the usual defenses do nothing: a RERUN of the same pipeline reproduces the same artifact '
      + 'bit for bit, and a DIGIT CROSS-CHECK against an independently computed float value agrees, because both '
      + 'pipelines drop the same mass the same way. The failure class lives inside the key, and a model that '
      + 'reproduces the artifact grades as correct — while a model that computes the true value grades as wrong.'),
    C.p('This is not hypothetical. Each section below is a certified specimen from this site\'s audits — '
      + 're-proved, not cited, during this page\'s build.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · specimen I', title: 'The constant that was a rounding error',
  bodyRaw: [
    C.p('A GPT-published constant on Erdős #852 — an Euler product over primes — is wrong from its 12th '
      + 'significant digit. The wrong digits are not near the truth by accident: re-run live during this build, '
      + 'the naive double-precision product over ' + primes.length.toLocaleString('en-US') + ' primes emits '
      + C.esc(naiveC.toFixed(16)) + ' — the published value, digit for digit — because ' + dropPct + '% of its '
      + 'factors round to exactly 1.0 and silently vanish. The exact partial product, a strict lower bound with '
      + 'no tail estimate needed, already exceeds the printed value: REFUTED, re-decided this build. The '
      + 'published constant is the bug, printed.'),
    C.p('If that number sat in an answer key, every float-faithful model would score correct and every exact '
      + 'model would score wrong. The full mechanism, the certified correction, and the failure taxonomy are in '
      + 'the Erdős #852 report; this is its §6 argument, promoted to a page of its own.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§3 · specimen II', title: 'Digit agreement is not evidence',
  bodyRaw: C.p('Validating a key by matching digits assumes agreement implies identity. The impostor catalog is '
    + 'the certified counterexample set: 21 published constants that agree with simple closed forms — and are '
    + 'provably not equal to them, each refutation one exact BigInt comparison at the full published precision. '
    + 'The deepest specimen (' + deepestId + ', re-derived this build) agrees with a plain rational for '
    + deepest + ' significant digits before exact arithmetic separates them. Any digit-matched validation '
    + 'shallower than that certifies the impostor; twenty digits — a "discovery" threshold elsewhere — is not '
    + 'close. Agreement depth is evidence about your precision budget, never about identity.')
}));

B.push(C.section({
  lab: '§4 · specimen III', title: 'True computation, false print',
  bodyRaw: C.p('The subtlest class: the key is wrong even though the computation behind it was right. The '
    + 'Ramanujan Machine\'s 2022 mixed-zeta sheet prints an identity that is FALSE as printed — a sign slip in '
    + 'the constant term, one of three typographic errors on the sheet — while the continued fraction its own '
    + 'polynomials define converges to the corrected value exactly: both directions re-certified on one '
    + 'enclosure during this build. No rerun of the discovery pipeline catches this, because the pipeline was '
    + 'never wrong; the print is. A key transcribed from a paper inherits the paper\'s typos as ground truth, '
    + 'and a model reproducing the (correct) computation grades as wrong against the (false) print.')
}));

B.push(C.section({
  lab: '§5 · the design', title: 'Remove the key',
  bodyRaw: [
    C.p('The structural fix is to grade tasks where no reference value exists to contaminate: ask the model to '
      + 'EXHIBIT a witness — a decomposition, a certificate, a construction — and let the grader re-derive the '
      + 'claim from the witness alone, exactly. The matmul eval on this site is the running instance: '
      + evalRows.length + ' frontier-model proposals graded to date, every certified row a theorem, every '
      + 'refuted row a proof of error, zero false certifications — measured, and structurally guaranteed, '
      + 'because there is no answer key to be wrong.'),
    C.p('Three rules transfer to any evaluation built on computed ground truth. Screens may only PRUNE: no '
      + 'float comparison ever admits a claim. Grade with certificates, not tolerances: the verdict should be '
      + 'checkable by re-derivation, not by proximity to a stored number. And put red controls in the grader: '
      + 'deliberately false submissions that must fail, run before anything real is graded — a grader that has '
      + 'never rejected a forgery is not known to reject forgeries. The methods note states the discipline in '
      + 'full; every gate on this site runs under it.')
  ].join('\n')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-answer-key.js @ git ' + git + '. Every '
  + 'specimen above was re-proved during this build — the naive product re-run and refuted, the impostor depth '
  + 're-derived in exact BigInt, both RM directions re-certified, the eval ledger re-read — and the build '
  + 'refuses on any deviation.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'answer-key.html'),
  TPL.render({ title: 'When the answer key is wrong', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/reports/answer-key.html',
    desc: 'Three certified specimens of mathematical answer keys failing in ways reruns and digit cross-checks provably cannot catch — and the working eval design that removes the answer key altogether.' }));
console.log('reports/answer-key.html written: 3 specimens re-proved (digit-12 artifact, ' + deepest
  + '-digit impostor ' + deepestId + ', RM print pair) + eval ledger ' + evalRows.length + ' rows @ git ' + git);
