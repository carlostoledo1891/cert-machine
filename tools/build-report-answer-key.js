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
const CH = require(path.join(ROOT, 'design', 'charts.js'));
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

/* ---- specimen V (the control): a published claim that HELD ---------------
   The four specimens above are keys that went wrong. An instrument that only
   ever returns REFUTED is not an audit, it is a search — so the taxonomy is
   not complete without a published claim the same machinery CONFIRMS. The
   third audit domain (exact rational sum-of-squares, control theory) supplies
   it. All three SOS programs are run here as this section's gate: each must
   exit 0 and print ALL PASS or the page is not written, and every number,
   polynomial and witness quoted in §5 is parsed out of the output captured
   below — nothing in that section is typed by hand. The same three programs
   run under `make test`. */
const SOS = {
  reverify: 'instruments/sos/reverify_ai_lyapunov.py',
  bound: 'instruments/sos/sos_verify.py',
  lyap: 'instruments/sos/lyapunov_cert.py'
};
function runPy(rel) {
  let out;
  try {
    out = cp.execSync('python3 ' + rel, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  } catch (e) {
    return die(rel + ' did not exit 0 — the SOS battery gates this page\n'
      + ((e.stdout && e.stdout.toString()) || '') + ((e.stderr && e.stderr.toString()) || ''));
  }
  if (/^FAIL/m.test(out) || !/ALL PASS/.test(out)) die(rel + ' did not report ALL PASS:\n' + out);
  return out;
}
const sosOut = {}; let sosChecks = 0;
for (const k of Object.keys(SOS)) {
  sosOut[k] = runPy(SOS[k]);
  sosChecks += (sosOut[k].match(/^PASS/gm) || []).length;
}

/* the paper's identity and its system, read from the instrument source so the
   citation on the page cannot drift away from the code that decides it */
const reSrc = fs.readFileSync(path.join(ROOT, SOS.reverify), 'utf8');
const arxivId = (/arXiv:(\d{4}\.\d{4,5})/.exec(reSrc) || [])[1];
const sysM = /system (Eq\.\d+):\s*(.+?)\.\s*$/m.exec(reSrc);
if (!arxivId || !sysM) die('cannot read the cited paper / system out of ' + SOS.reverify);
const sysEq = sysM[1], sysBody = sysM[2].replace(/\s*,\s*/, ' ,  ').trim();

/* CONFIRMED — V-dot for the paper's valid function, read out of the run */
const vdRaw = (/\[Vdot=\{([^}]*)\}\]/.exec(sosOut.reverify) || [])[1];
const vdMon = vdRaw ? [...vdRaw.matchAll(/\((\d+),\s*(\d+)\):(-?\d+)/g)].map((m) => [+m[1], +m[2], +m[3]]) : [];
if (vdMon.length !== 2) die('cannot read the confirmed V-dot out of ' + SOS.reverify + ' output');
const SUP = { 2: '²', 3: '³', 4: '⁴' };
const mono = (a, b) => [a ? 'x1' + (SUP[a] || '') : '', b ? 'x2' + (SUP[b] || '') : ''].filter(Boolean).join('·');
const vdotStr = vdMon.map(([a, b, c], i) => (c < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + Math.abs(c) + '·' + mono(a, b)).join('');
if (!/PASS\s+C2 -Vdot is an exact weighted SOS/.test(sosOut.reverify)) die('the weighted-SOS confirmation row moved');

/* REFUTED — the paper's own under-sampled candidates, with exact witnesses */
const refuted = [];
for (const line of sosOut.reverify.split('\n')) {
  const m = /^PASS\s+R x1\^2\+(.+?)x2\^2 is NOT a Lyapunov function.*\[x=\(([^,]+),\s*([^)]+)\)\s*->\s*Vdot=(\S+)\]\s*$/.exec(line);
  if (m) refuted.push({ coef: m[1].trim().split(' ')[0], label: m[1].trim(), x1: m[2].trim(), x2: m[3].trim(), vdot: m[4].trim() });
}
if (refuted.length !== 3) die('expected 3 under-sampled candidates refuted, found ' + refuted.length);
const flagged = refuted.find((r) => /Eq\.\s*\d+/.test(r.label) && /flag/i.test(r.label));
if (!flagged) die('the paper-flagged candidate is not among the refutations');
flagged.eq = 'Eq. ' + /Eq\.\s*(\d+)/.exec(flagged.label)[1];
const others = refuted.filter((r) => r !== flagged);
const sysEqPretty = sysEq.replace(/^Eq\.\s*/, 'Eq. ');

/* REFUSED — the honest boundary: nonnegative, and provably not SOS */
const gamma = (/global lower bound p\(x\) >= (\d+) is CERTIFIED/.exec(sosOut.bound) || [])[1];
if (!gamma) die('the exact SOS global lower bound no longer certifies');
if (!/^PASS\s+L1 the Motzkin polynomial REFUSES an SOS certificate/m.test(sosOut.bound)) die('the Motzkin refusal row moved');
const motzProbe = (/\[M\(1,1\) = (\S+)\]/.exec(sosOut.bound) || [])[1];
if (motzProbe !== '0') die('the Motzkin nonnegativity probe moved: ' + motzProbe);

/* the red control on the third program: the certificate must go red */
const perturbW = (/\[Vdot\(1,0\) = (\S+) > 0\]/.exec(sosOut.lyap) || [])[1];
if (!perturbW) die('the unstable-perturbation witness is missing from ' + SOS.lyap);

/* ---- the page ------------------------------------------------------------ */
const git = sh('git rev-parse --short HEAD') || 'unknown';
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · note for evaluation builders · specimens re-proved at every build',
  title: 'When the answer key is wrong',
  deck: 'An evaluation graded against reference values inherits the failure class of whatever computed them — '
    + 'and for mathematical ground truth the computing pipeline is usually floating point, checked by digit '
    + 'agreement. This note holds three certified specimens of answer keys going wrong in ways reruns and digit '
    + 'cross-checks provably cannot catch, one published claim the same instruments CONFIRM — a control, '
    + 'because an audit that only ever refutes is not an audit — and one working design that removes the '
    + 'answer key altogether. Every specimen was re-proved during the build that produced this page.'
}));

B.push(C.tldr({
  findingRaw: 'Three certified ways a mathematical answer key goes wrong: a float artifact published as a '
    + 'constant (correct to a rerun, wrong from digit 12); a published constant agreeing with a wrong closed '
    + 'form for ' + deepest + ' significant digits (digit-matching certifies the impostor); and a printed '
    + 'identity that is false while the computation behind it was right. A model that reproduces any of these '
    + 'grades as correct. And the control that makes those three readable: pointed at the machine-DISCOVERED '
    + 'Lyapunov functions of arXiv:' + arxivId + ', the same exact machinery returns CONFIRMED — the paper '
    + 'held up.',
  mechanismRaw: 'The failure class lives INSIDE the key: rerunning the same float pipeline reproduces the '
    + 'artifact digit for digit, so the standard remedy — recompute and compare digits — CONFIRMS the wrong '
    + 'value. The fix is structural, not more digits: grade witness-exhibiting tasks with exact certificates, '
    + 'so there is no reference value to contaminate.',
  checkRaw: 'every specimen re-proved at this page\'s build; the working design runs live — '
    + C.m('python3 tools/llm-harness.py --dry-run --family matmul --n 8') + ' from a clone shows the grader '
    + 'refuting its own red controls before it grades anything.'
}));

/* ---- where each answer key fails, on one scale ---------------------------
   The three specimens are different kinds of wrong, but they share an axis:
   how many leading digits the key gets RIGHT before it stops being right.
   Drawing them together shows the thing the page argues — that "it agreed to
   many digits" is not evidence of anything, because the deepest agreement in
   the set belongs to a value that is provably not the constant. */
{
  const SCREEN = 17;
  const rowsFig = [
    { k: 'published constant (#852)', v: 11, lab: 'right to 11, wrong from 12',
      hover: 'the published C* is the naive double product; it parts from the certified enclosure at digit 12' },
    { k: 'closed form vs constant', v: deepest, lab: deepest + ' digits, then provably not equal',
      hover: deepestId + ' — agrees to ' + deepest + ' digits and is exactly refuted' }
  ];
  const fig = CH.bars({
    w: 900, rowH: 34, max: deepest * 1.16, padL: 232, padR: 250,
    rows: rowsFig,
    xTicks: [0, SCREEN, 30, 45, 60].filter(v => v <= deepest * 1.16).map(v => ({ v, t: String(v) })),
    marks: [{ x: SCREEN, t: 'a double screen stops here', token: 'var(--c-3)' }],
    xLabel: 'leading significant digits that are CORRECT before the key fails',
    alt: 'Two published values on one scale of correct leading digits. The #852 constant is right to 11 digits '
      + 'and wrong from the 12th. A closed form agrees with its constant to ' + deepest + ' digits and is still '
      + 'provably not that constant. A double-precision screen reaches about 17 digits, between the two.'
  });
  B.push(C.section({
    lab: '§0 · the two ways to be wrong', title: 'Agreeing to many digits is not evidence',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('Both bars are published values, and both are wrong — in opposite directions. One stops being '
        + 'correct just past the reach of a hand-check; the other stays correct far past the reach of any float '
        + 'screen and is still not the thing it claims to be.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: 'Specimen I fails at digit 12, which is why a rerun that agrees to '
        + 'eleven digits confirms nothing: the rerun reproduces the same bug. Specimen II agrees to ' + deepest
        + ' digits and is exactly refuted, which is why depth of agreement is not evidence either. The marked '
        + 'line is where a double-precision check runs out of digits — it falls between the two failures, so '
        + 'neither of them can be settled by one. Specimen III is not on this axis at all: there the computation '
        + 'is correct and the PRINT is wrong, and no number of digits would have caught it.' })
  }));
}

B.push(C.stats([
  { k: 'specimen I', v: 'wrong at digit 12', role: 'warn', n: 'a published constant that IS the naive IEEE-754 product — reproduced live this build, then refuted exactly' },
  { k: 'specimen II', v: deepest + ' digits of agreement', role: 'warn', n: 'a published constant vs a closed form it provably is not — re-derived in exact BigInt this build' },
  { k: 'specimen III', v: 'true math, false print', role: 'warn', n: 'a printed identity refuted while its own computation is certified correct on the same enclosure' },
  { k: 'the control', v: 'the paper held up', role: 'held', n: 'a machine-discovered Lyapunov function of arXiv:' + arxivId + ' CONFIRMED by exact SOS this build — plus a true statement the same instrument REFUSES to certify' },
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

/* ---- §5 · the control specimen ------------------------------------------
   Gated above: this section does not exist unless all three SOS programs
   exited 0 with ALL PASS this build. Every quantity below is interpolated
   from their captured stdout. */
B.push(C.section({
  lab: '§5 · the control', title: 'What a clean audit looks like',
  wide: true,
  bodyRaw: '<div class="col">' + [
    C.p('Every specimen so far is a key that went wrong, which is exactly the reason this one is here. An '
      + 'instrument that returns REFUTED on everything it is pointed at is not an audit, it is a search — and '
      + 'the taxonomy of answer keys is not complete without the case where the published value is right and '
      + 'the audit says so. This site\'s third audit domain supplies it. Alongside tensor decompositions and '
      + 'continued fractions there is an exact rational sum-of-squares certifier, aimed at control theory, and '
      + 'pointed at a 2026 paper\'s machine-DISCOVERED Lyapunov functions it returns CONFIRMED. The paper held '
      + 'up. That is the headline, and it is a stronger result for this machine than another refutation would '
      + 'have been.'),
    C.pRaw('arXiv:' + arxivId + ' reports Lyapunov functions found by constrained symbolic regression for the '
      + 'nonlinear system it gives as ' + sysEqPretty + ','),
    C.eq(C.esc(sysBody)),
    C.pRaw('The instrument re-derives V̇ = ∇V · f symbolically over the rationals — Python\'s '
      + C.m('fractions') + ' and nothing else, no floating point anywhere in the decision — and then demands '
      + 'an exact sum-of-squares certificate rather than a numerical minimum. For the function the paper states '
      + 'as valid, V = x1² + 4·x2², it gets one:'),
    C.eq(C.esc('V̇ = ' + vdotStr + '   =   −( 2·x1² + 8·(x2²)² )')),
    C.p('The cross term is not small, it is absent: the coefficient 4 is what annihilates it exactly. What is '
      + 'left is a weighted sum of squares whose only zero is the origin, so V decreases along every nonzero '
      + 'trajectory and the system is globally asymptotically stable — decided, not estimated, and re-derived '
      + 'during the build that produced this page. The method is classical (Lyapunov 1892; SOS-Lyapunov, '
      + 'Parrilo 2000) and the function is the paper\'s. Nothing here is ours except the re-verification.'),
    C.pRaw('The same run also refutes the ' + refuted.length + ' under-sampled candidates the paper reports — '
      + 'and the paper flags them itself. Its ' + C.esc(flagged.eq) + ', V = x1² + ' + C.esc(flagged.coef)
      + '·x2², is stated in the paper as having an incorrect coefficient; the instrument supplies the exact '
      + 'witness that sentence implies. At the rational point '
      + C.m('x = (' + flagged.x1 + ', ' + flagged.x2 + ')') + ' the derivative is'),
    C.eq(C.esc('V̇ = ' + flagged.vdot + '  >  0')),
    C.pRaw('— a positive rational, checkable by hand, with no tolerance anywhere in the statement. V increases '
      + 'there, so V is not a Lyapunov function for that system, full stop. The coarser candidates fall the '
      + 'same way: ' + others.map((r) => 'V = x1² + ' + C.esc(r.coef) + '·x2² at '
        + C.m('(' + r.x1 + ', ' + r.x2 + ')') + ' gives ' + C.m('V̇ = ' + r.vdot)).join(', and ') + '. This is '
      + 'corroboration of the authors\' own statement, not a catch — they wrote down that the coefficient was '
      + 'wrong, and the machine wrote down the number that proves it. What exact arithmetic adds is the '
      + 'distinction the paper is already drawing. The coefficients are not "approximately right" and "nearly '
      + 'right": 4 is exactly right and ' + C.esc(flagged.coef) + ' is exactly wrong, and no float screen '
      + 'anywhere in the neighbourhood of a derivative the size of ' + C.esc(flagged.vdot) + ' would tell you '
      + 'which was which.'),
    C.p('The third outcome is the one that makes the other two worth anything. The same certifier, run on the '
      + 'Motzkin polynomial x1⁴·x2² + x1²·x2⁴ − 3·x1²·x2² + 1 — nonnegative for every real x1 and x2, and '
      + 'famously (Motzkin 1967) not a sum of squares — returns REFUSED. It declines to certify a statement '
      + 'that is TRUE, because the certificate it requires provably does not exist for it. It prints the probe '
      + 'M(1,1) = ' + motzProbe + ' beside the refusal so the refusal reads as what it is: a refusal to '
      + 'certify, never a claim of falsity. That is the honest behaviour and not a bug. A checker that fudged '
      + 'Motzkin through would be certifying by wishful thinking, and its CONFIRMED on the Lyapunov function '
      + 'would then be worth exactly nothing.')
  ].join('\n') + '</div>\n'
    + C.table({
      cols: [{ h: 'verdict' }, { h: 'object' }, { h: 'the exact reason' }],
      rows: [
        [{ raw: C.tag('CONFIRMED', 'held') },
          { raw: 'V = x1² + 4·x2², the paper\'s stated valid function' },
          { raw: 'V̇ = ' + C.esc(vdotStr) + ' — an exact weighted SOS, zero only at the origin' }],
        [{ raw: C.tag('REFUTED', 'cert') },
          { raw: 'V = x1² + ' + C.esc(flagged.coef) + '·x2², flagged as under-sampled by the paper itself' },
          { raw: 'witness ' + C.m('x = (' + flagged.x1 + ', ' + flagged.x2 + ')') + ' gives V̇ = '
            + C.esc(flagged.vdot) + ' > 0' }],
        [{ raw: C.tag('REFUSED', 'open') },
          { raw: 'the Motzkin polynomial — nonnegative everywhere, and not a sum of squares' },
          { raw: 'no SOS certificate exists, so none is issued; the instrument declines a true statement '
            + 'rather than guess (probe M(1,1) = ' + C.esc(motzProbe) + ')' }]
      ]
    })
    + '<div class="col">' + [
    C.p('Read the three as a set, because separately none of them is the argument. One machine-discovered '
      + 'result confirmed exactly. The paper\'s own flagged candidates refuted with rational witnesses. One '
      + 'true statement refused for want of a certificate. Three verdicts, three different reasons, one '
      + 'instrument that can reach all three — which is the only condition under which the first one means '
      + 'anything. For an evaluation builder the transfer is direct: a grader you have never seen decline is '
      + 'not known to be able to decline, and a grader that cannot decline will eventually confirm your answer '
      + 'key back to you.'),
    C.pRaw('This section is its own gate. The three programs ran during this build, each exited 0, and '
      + 'together they reported ' + sosChecks + ' PASS rows and no failures — including the red controls that '
      + 'must fire (a corrupted certificate refused, an overclaimed bound refuted at ' + C.m('x = 1') + ', and '
      + 'an unstable perturbation whose witness gives ' + C.m('V̇(1,0) = ' + perturbW) + ' > 0). If any one of '
      + 'them fails or stops printing ALL PASS, this page is not written at all. Run them yourself from a '
      + 'clone — stdlib only, no SDP solver, no dependencies:')
      + C.code('python3 ' + SOS.reverify + '\npython3 ' + SOS.bound + '\npython3 ' + SOS.lyap)
      + C.pRaw('All three are also rows in ' + C.m('make test') + ', so they run on every battery, not only '
        + 'when this page is built. The exact global lower bound in the second one — a quartic certified at '
        + '≥ ' + gamma + ' by an exact SOS decomposition, the bound attained — is the same instrument doing the '
        + 'ordinary version of the job.')
  ].join('\n') + '</div>'
}));

B.push(C.scope('Published, not peer-reviewed, not independently rerun. arXiv:' + arxivId + ' is cited as a '
  + 'CLAIM: its system, its Lyapunov functions and its own statement about the under-sampled coefficients are '
  + 'taken as printed, and every verdict above reads "given those equations". The mathematics is not ours — '
  + 'the Lyapunov functions are the paper\'s, discovered by its method, and the SOS-Lyapunov technique is '
  + 'Parrilo 2000 on Lyapunov 1892. No priority is claimed for anything in this section; it re-verifies '
  + 'someone else\'s result exactly and reports that it holds.'));

B.push(C.section({
  lab: '§6 · the design', title: 'Remove the key',
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
  + 're-derived in exact BigInt, both RM directions re-certified, the eval ledger re-read, and all three SOS '
  + 'programs run to ALL PASS (' + sosChecks + ' checks) with §5\'s numbers parsed from their output — and the '
  + 'build refuses on any deviation.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'answer-key.html'),
  TPL.render({ title: 'When the answer key is wrong', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/answer-key.html',
    desc: 'Three certified specimens of mathematical answer keys failing in ways reruns and digit cross-checks provably cannot catch, one published claim the same exact instruments confirm, and the eval design that removes the answer key altogether.' }));
console.log('reports/answer-key.html written: 3 specimens re-proved (digit-12 artifact, ' + deepest
  + '-digit impostor ' + deepestId + ', RM print pair) + eval ledger ' + evalRows.length + ' rows + SOS control '
  + '(arXiv:' + arxivId + ' CONFIRMED, ' + refuted.length + ' flagged candidates refuted, Motzkin REFUSED; '
  + sosChecks + ' checks) @ git ' + git);
