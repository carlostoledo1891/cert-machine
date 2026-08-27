/* test-wardrop-diff.js — the differential test that closes the Tab 07 landmine.

   THE LANDMINE (FINDINGS_SIN.md). test-wardrop.js carries its OWN embedded copy
   of the Wardrop/HRF kernel — it contains no fs call and never opens
   mfg-lab.html. So it validates a copy, and nothing on disk proves the copy
   still equals the MWD kernel actually SHIPPED in the artifact. It has not bitten
   only because nobody has touched Tab 07 since the port. It is the same species
   as test-sinmfg.js, undetonated.

   THE FIX. Extract the MWD kernel FROM mfg-lab.html at run time (the test-sin.js
   pattern), extract test-wardrop.js's kernel too, and drive identical inputs
   through both. Both use a deterministic start interiorStart(pop, null), so if
   the kernels have not drifted the whole trajectory is bit-for-bit identical and
   the certified totals agree to machine zero. If they have drifted in any
   numerically meaningful way, the totals diverge and this fails.

   It also validates the SHIPPED kernel directly against paper Table I — so the
   artifact's headline reproduction claim no longer rests on a copy.

   Scenarios (paper arXiv:2504.16028, Table I edge order):
     S1 validation  makeSystem(1,2,100,100)   S2 cars+trucks makeSystem(2,2,100,50)
     S3 emissions   makeSystem(3,2,100,50)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const fails = [];
function check(name, cond, detail) {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '   [' + detail + ']' : ''));
  if (!cond) fails.push(name);
}

/* A MISSING SUBJECT MUST BE A SENTENCE, NOT A STACK TRACE. Guard copied from
   test-index.js (which already solved this for itself). An unguarded
   readFileSync throws ENOENT: the runner sees a node internal frame and a
   nonzero exit, and cannot tell "the gate caught something" from "the gate is
   broken". Worse, the throw aborts the module, so every check after it — and
   the PASS/FAIL summary — silently stops running. MEASURED 2026-07-28: with
   MFG_HTML pointed at a missing path this battery printed ZERO PASS lines,
   ZERO FAIL lines and a stack trace. This battery reads TWO files and BOTH are
   guarded — a differential test with one side missing is not a weaker test, it
   is no test at all. The guard prints on stdout, where the other FAIL lines
   live, so a runner grepping one stream sees it. */
function mustExist(p, what, advice) {
  if (fs.existsSync(p)) return;
  console.log('FAIL  W0 ' + what + ' is not there: ' + p);
  console.log('      This is a MISSING FILE, not a failed assertion. ' + advice);
  console.log('\nwardrop-diff gate FAILED — one side of the differential is missing, ' +
              'so NO check in this battery ran.');
  process.exit(1);
}

const ROOT = require('./_root.js').treeRoot(__dirname);
const HTML = process.env.MFG_HTML || path.resolve(__dirname, '..', 'mfg-lab.html');
const WARD = path.resolve(__dirname, 'test-wardrop.js');
mustExist(HTML, 'the artifact holding the SHIPPED MWD kernel',
  'Re-point MFG_HTML (or the default beside this file) at the artifact carrying MWD; ' +
  'if MWD has moved out of mfg-lab.html, re-point this battery deliberately, do not let it crash.');
mustExist(WARD, 'the reference battery whose kernel is diffed against the artifact',
  'test-wardrop.js must sit beside this file; without it there is nothing to diff against, ' +
  'and the Tab 07 landmine this gate exists to defuse is live again.');

/* ---- extract the SHIPPED MWD kernel from the artifact ------------------- */
const html = fs.readFileSync(HTML, 'utf8');
const sha = crypto.createHash('sha256').update(html).digest('hex').slice(0, 16);
console.log('harness: ' + HTML);
console.log('         ' + Buffer.byteLength(html, 'utf8') + ' bytes · sha256 ' + sha);

const OPEN = 'const MWD=(()=>{';
const DOM = 'const cvG=$(';                       // first DOM access in the module
const iOpen = html.indexOf(OPEN);
const iDom = html.indexOf(DOM, iOpen);
check('extract: MWD module and its DOM boundary are both found',
  iOpen >= 0 && iDom > iOpen, 'open@' + iOpen + ' dom@' + iDom);
const mwdSrc = html.slice(iOpen + OPEN.length, iDom);

/* purity guard — same discipline as test-sin.js: if a future edit drags DOM
   code above the boundary, fail loudly rather than test something unrunnable. */
const domHits = (mwdSrc.match(/document\s*\.|getComputedStyle|getContext|\$\(/g) || []);
check('extract: the MWD kernel slice is DOM-free', domHits.length === 0,
  domHits.length + ' DOM reference(s)');

/* ---- extract test-wardrop.js's kernel (everything before the battery) --- */
const wardFull = fs.readFileSync(WARD, 'utf8');
const BAT = '/* ================= BATTERY =================';   // cut before the comment opener
const iBat = wardFull.indexOf(BAT);
const wardSrc = wardFull.slice(0, iBat);
check('extract: test-wardrop.js kernel boundary found', iBat > 0);

const API = ['makeSystem', 'interiorStart', 'integrate', 'polish', 'wardropGap',
  'totals', 'kirchhoffRes', 'totalsKKTGap', 'minPos', 'EDGES', 'TABLE1', 'NE'];
function build(src, label) {
  try {
    return new Function(src + '\nreturn {' + API.join(',') + '};')();
  } catch (e) {
    check('extract: ' + label + ' kernel evaluates', false, e.message);
    return null;
  }
}
const H = build(mwdSrc, 'mfg-lab.html MWD');   // shipped
const J = build(wardSrc, 'test-wardrop.js');   // dev battery
check('extract: both kernels evaluate and export the full API',
  H && J && API.every(k => H[k] !== undefined && J[k] !== undefined));

if (!H || !J) {
  console.log('\nFATAL: cannot continue without both kernels.');
  process.exit(2);
}

/* ---- solve a scenario to a certified equilibrium with one kernel -------- */
function solve(K, scen, wT, Q1, Q2, tol, maxSteps) {
  const sys = K.makeSystem(scen, wT, Q1, Q2);
  const th1 = K.interiorStart(sys.P1, null);     // deterministic start
  const th2 = K.interiorStart(sys.P2, null);
  const r = K.integrate(sys, th1, th2, { tol, maxSteps });
  const pol = K.polish(sys, th1, th2);
  return {
    totals: Array.from(K.totals(sys, th1, th2)),
    gap: K.wardropGap(sys, th1, th2),
    kirch: Math.max(K.kirchhoffRes(sys.P1, th1), K.kirchhoffRes(sys.P2, th2)),
    kkt: K.totalsKKTGap(K.totals(sys, th1, th2)),
    pol, steps: r.steps
  };
}

const SCEN = [
  { name: 'S1 validation', scen: 1, wT: 2, Q1: 100, Q2: 100, tol: 1e-8, maxSteps: 6000 },
  { name: 'S2 cars+trucks', scen: 2, wT: 2, Q1: 100, Q2: 50, tol: 1e-8, maxSteps: 6000 },
  { name: 'S3 emissions', scen: 3, wT: 2, Q1: 100, Q2: 50, tol: 1e-7, maxSteps: 12000 },
];

console.log('\n--- differential: shipped MWD kernel vs test-wardrop.js kernel ---');
for (const s of SCEN) {
  const h = solve(H, s.scen, s.wT, s.Q1, s.Q2, s.tol, s.maxSteps);
  const j = solve(J, s.scen, s.wT, s.Q1, s.Q2, s.tol, s.maxSteps);

  /* totals are the unique, physical content (the split is not unique for S1,
     but totals are — see test-wardrop.js). Compare them across kernels. */
  let dT = 0;
  for (let k = 0; k < h.totals.length; k++) dT = Math.max(dT, Math.abs(h.totals[k] - j.totals[k]));
  check(s.name + ': shipped totals == battery totals (< 1e-9)', dT < 1e-9,
    'max |Δtotal| = ' + dT.toExponential(2));

  /* both must actually be certified equilibria, or "agreement" is vacuous */
  check(s.name + ': both kernels reach a certified equilibrium',
    h.pol && j.pol && h.gap < 1e-9 && j.gap < 1e-9 && h.kirch < 1e-8 && j.kirch < 1e-8,
    'shipped gap ' + h.gap.toExponential(2) + ' · battery gap ' + j.gap.toExponential(2));
}

/* ---- the shipped kernel, directly against the paper -------------------- */
console.log('\n--- shipped kernel vs paper Table I (no copy in the loop) ---');
{
  const h = solve(H, 1, 2, 100, 100, 1e-8, 6000);
  let maxDev = 0;
  for (let k = 0; k < H.NE; k++) maxDev = Math.max(maxDev, Math.abs(h.totals[k] - H.TABLE1[k]));
  check('shipped S1 totals match Table I within its rounding (max dev <= 2)', maxDev <= 2.0,
    'max dev ' + maxDev.toFixed(3));
  check('shipped S1 carries an independent single-population KKT certificate (< 1e-12)',
    h.kkt < 1e-12, h.kkt.toExponential(2));
}

console.log('\n' + '='.repeat(60));
if (fails.length) {
  console.log(fails.length + ' FAILURE(S):');
  fails.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
console.log('ALL PASS — the shipped MWD kernel matches the battery and the paper.');
