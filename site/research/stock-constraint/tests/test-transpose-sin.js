/* test-transpose-sin.js — certify FP = HJBᵀ for the SIN-MFG adjoint-matched
   operator pair (tools/continuum_reference.js), the "deferred but standard"
   Achdou road of SIN_MFG_Model_Spec_v0.3.md §A, now built headless.

   Context: the shipped note's kernel is deliberately NOT adjoint-matched
   (centered HJB + upwind FP; measured defect ≈ 1.0 at every slice — test-sin.js
   A22/A23/A25, FINDINGS_SIN Defect 4) and its prose says so. This battery
   certifies the MATCHED pair for the same model, kept headless: the note is
   untouched and its disclosure stands. Sibling certificate: mfg-lab's
   test-transpose.js (the lab kernel, congestion-weighted). What is certified
   here is the OPERATOR pair; the system-level discrete-KKT statement at a
   solved equilibrium is the Python-port milestone, deliberately not claimed.

   Doctrine compliance:
   · the battery require()s the module under test (no replicated copy to go
     stale) and prints the resolved path + sha256 + bytes it validated;
   · the module's model constants are ANCHORED against sin-mfg.html — the
     reference claims to be "the matched pair for THIS model", so the model
     identity is checked, not asserted; the anchor also pins that the note
     still ships the centered scheme (if that ever changes, this fires and
     the docs must be re-synced);
   · coverage is asserted before the certificate: the frozen test field must
     exercise clamped-positive, clamped-negative AND interior interfaces —
     a transpose check that never meets the clamp proves nothing there;
   · two mutants prove the gate can go red (drop the sign-split; break the
     clamp on one side only). A green suite that cannot fail is not a suite. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* A MISSING SUBJECT MUST BE A SENTENCE, NOT A STACK TRACE. Guard copied from
   test-index.js (which already solved this for itself). An unguarded
   readFileSync throws ENOENT: the runner sees a node internal frame and a
   nonzero exit, and cannot tell "the gate caught something" from "the gate is
   broken". Worse, the throw aborts the module, so every check after it — and
   the PASS/FAIL summary — silently stops running. MEASURED 2026-07-28: with
   SIN_HTML pointed at a missing path this battery printed ZERO PASS lines,
   ZERO FAIL lines and a node:fs frame. Both sides are guarded: this battery
   reads a module AND the artifact that module is anchored to. */
function mustExist(p, what, advice) {
  if (fs.existsSync(p)) return;
  console.log('FAIL  A0 ' + what + ' is not there: ' + p);
  console.log('      This is a MISSING FILE, not a failed assertion. ' + advice);
  console.log('\ntranspose-sin gate FAILED — one side is missing, so NO check in this battery ran.');
  process.exit(1);
}

const REF = process.env.CONT_REF || path.resolve(__dirname, '..', 'tools', 'continuum_reference.js');
/* One layout, one artifact — see the note in test-sin.js. */
const _sinCandidates = [path.resolve(__dirname, '..', 'stock-constraint.html')];
const HTML = process.env.SIN_HTML ||
  _sinCandidates.find(p => fs.existsSync(p)) || _sinCandidates[0];
mustExist(REF, 'the continuum reference module under test',
  'Re-point CONT_REF at tools/continuum_reference.js; if it moved, re-point this battery ' +
  'deliberately, do not let it crash.');
mustExist(HTML, 'the artifact whose constants and scheme this reference is anchored to',
  'Re-point SIN_HTML at the artifact carrying the note; the anchors are the only thing ' +
  'binding this reference to the note, so a missing artifact must be re-pointed deliberately.');
const refSrc = fs.readFileSync(REF, 'utf8');
const html = fs.readFileSync(HTML, 'utf8');
console.log('module under test : ' + REF);
console.log('  sha256 ' + crypto.createHash('sha256').update(refSrc).digest('hex').slice(0, 16) +
  '  (' + refSrc.length + ' bytes)');
console.log('anchored artifact : ' + HTML);
console.log('  sha256 ' + crypto.createHash('sha256').update(html).digest('hex').slice(0, 16) +
  '  (' + html.length + ' bytes)\n');

const K = require(REF);
const fails = [];
function check(name, cond, detail) {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '   [' + detail + ']' : ''));
  if (!cond) fails.push(name);
}

/* --- T1: model-identity anchors — the reference's constants are the note's --- */
const mGrid = html.match(/const NT=(\d+), dt=([\d.]+), NX=(\d+), XBAR=([\d.]+)/);
const mPhys = html.match(/const SIG=([\d.]+), ETA=([\d.]+), AMAX=([\d.]+)/);
check('anchor: sin-mfg.html grid constants found and matched by the reference',
  !!mGrid && +mGrid[1] === K.NT && +mGrid[2] === K.dt && +mGrid[3] === K.NX && +mGrid[4] === K.XBAR,
  mGrid ? `NT=${mGrid[1]} dt=${mGrid[2]} NX=${mGrid[3]} XBAR=${mGrid[4]}` : 'grid regex missed');
check('anchor: sin-mfg.html physics constants found and matched by the reference',
  !!mPhys && +mPhys[1] === K.SIG && +mPhys[2] === K.ETA && +mPhys[3] === K.AMAX,
  mPhys ? `SIG=${mPhys[1]} ETA=${mPhys[2]} AMAX=${mPhys[3]}` : 'physics regex missed');
check('anchor: the note still ships the CENTERED HJB gradient (disclosure stands)',
  /const ux=0\.5\*\(uxp\+uxm\);/.test(html));
check('anchor: the note still ships the symmetric reflecting diffusion BC',
  /b\[0\]=1\+r;b\[NX-1\]=1\+r;/.test(html));

/* THE ANCHORS ARE THE ONLY THING BINDING THIS BATTERY TO THE ARTIFACT.
   Everything below runs against the reference MODULE, not the note, so with the
   anchors red the battery measures the module against itself and still prints
   `PASS  FP is the EXACT discrete transpose of the linearized HJB` — a
   certificate about a note it could not read. MEASURED 2026-07-28: pointed at
   research/mfg-congest/mfg-congest.html it printed TEN such PASS lines under four red
   anchors. Refuse by name instead, before the replication runs. */
if (fails.length) {
  console.log('      This is an UNBOUND subject, not a failed assertion. The transpose result');
  console.log('      below is a property of ' + REF + '; the anchors are what make it a');
  console.log('      statement about ' + HTML + '. With them red it is neither.');
  console.log('      If the note\'s constants or scheme changed, re-verify and re-point the');
  console.log('      anchors; if the note moved, re-point SIN_HTML.');
  console.log('\n' + fails.length + ' FAILURE(S) — anchors unresolved, so the transpose checks were NOT run.');
  process.exit(1);
}

/* --- frozen test field: sign-varying gradient that exercises the clamp both
   ways AND the interior. u(x) = 1.8(x−2.8)² + 0.4 sin(3x), ϖ = 0.8. --- */
const NX = K.NX;
const u = K.xs.map(x => 1.8 * (x - 2.8) ** 2 + 0.4 * Math.sin(3 * x));
const PT = 0.8;
const al = K.interfaceAlpha(u, PT);
let nPos = 0, nNeg = 0, nInt = 0;
for (let f = 1; f < NX; f++) {
  if (al[f] >= K.AMAX) nPos++;
  else if (al[f] <= -K.AMAX) nNeg++;
  else nInt++;
}
check('coverage: test field hits clamp+ / clamp− / interior interfaces',
  nPos >= 1 && nNeg >= 1 && nInt >= 1, `clamp+ ${nPos}, clamp− ${nNeg}, interior ${nInt} of ${NX - 1}`);
check('coverage: zero-flux boundary velocities', al[0] === 0 && al[NX] === 0);

/* --- T2: THE CERTIFICATE — M_FP is the exact discrete transpose of M_HJB --- */
function transposeDefect(F, A) {
  let dT = 0, scale = 0;
  for (let i = 0; i < NX; i++) for (let j = 0; j < NX; j++) {
    dT = Math.max(dT, Math.abs(F[i][j] - A[j][i]));
    scale = Math.max(scale, Math.abs(F[i][j]));
  }
  return dT / scale;
}
const MH = K.matHJB(u, PT), MF = K.matFP(u, PT);
const defect = transposeDefect(MF, MH);
check('FP is the EXACT discrete transpose of the linearized HJB (adjoint-matched)',
  defect < 1e-12, '|M_FP − M_HJBᵀ|/scale = ' + defect.toExponential(2));

/* same certificate on a second frozen pair (different price, different shape) —
   the identity is structural, not an accident of one test point */
const u2 = K.xs.map(x => -1.1 * (x - 1.0) ** 2 + 0.6 * Math.cos(2.2 * x));
const d2 = transposeDefect(K.matFP(u2, 2.4), K.matHJB(u2, 2.4));
check('transpose holds at a second frozen (u, ϖ)', d2 < 1e-12,
  '|M_FP − M_HJBᵀ|/scale = ' + d2.toExponential(2));

/* --- T3: diffusion block alone is SYMMETRIC (the self-adjoint part; the full
   pair is adjoint-matched FP=HJBᵀ, NOT self-adjoint — keep the distinction) --- */
const MD = K.matDiff();
let dSym = 0;
for (let i = 0; i < NX; i++) for (let j = 0; j < NX; j++) dSym = Math.max(dSym, Math.abs(MD[i][j] - MD[j][i]));
check('diffusion block alone is symmetric (reflecting BC self-adjoint)', dSym < 1e-15,
  '|D − Dᵀ| = ' + dSym.toExponential(2));

/* --- T4: conservation AS AN ADJOINT IDENTITY. Column sums of M_FP equal 1
   (mass exactly conserved by the implicit step) and row sums of M_HJB equal 1
   (advection+diffusion annihilate constants). Each is the other's transpose:
   this is conservation BECAUSE adjoint, not merely by the flux form. --- */
let colDev = 0, rowDev = 0;
for (let j = 0; j < NX; j++) { let s = 0; for (let i = 0; i < NX; i++) s += MF[i][j]; colDev = Math.max(colDev, Math.abs(s - 1)); }
for (let i = 0; i < NX; i++) { let s = 0; for (let j = 0; j < NX; j++) s += MH[i][j]; rowDev = Math.max(rowDev, Math.abs(s - 1)); }
check('1ᵀM_FP = 1ᵀ  (mass conservation as adjoint identity)', colDev < 1e-13, 'max dev ' + colDev.toExponential(2));
check('M_HJB·𝟙 = 𝟙  (advection annihilates constants — the transposed fact)', rowDev < 1e-13, 'max dev ' + rowDev.toExponential(2));

/* --- T5: M-matrix structure ⇒ positivity with NO CFL sub-stepping --- */
let offDiagOK = true, diagOK = true;
for (let i = 0; i < NX; i++) for (let j = 0; j < NX; j++) {
  if (i === j) { if (MF[i][j] < 1) diagOK = false; }
  else if (MF[i][j] > 1e-15) offDiagOK = false;
}
check('M_FP is a strict M-matrix (off-diag ≤ 0, diag ≥ 1)', offDiagOK && diagOK);

/* --- T6: live pass at a synthetic price path — the structural properties hold
   along a whole trajectory, above CFL 1, in single implicit steps --- */
const bump = (t, c, s) => Math.exp(-0.5 * ((t - c) / s) ** 2);
const price = Array.from({ length: K.NT }, (_, t) => 0.6 + 0.5 * bump(t, 19, 2.0) - 0.3 * bump(t, 12.5, 2.6));
const pass = K.solvePass(price);
check('trajectory: mass drift over all 24 slices < 1e-13', pass.massDrift < 1e-13,
  'drift ' + pass.massDrift.toExponential(2));
check('trajectory: m > 0 strictly everywhere (M-matrix positivity)', pass.minM > 0,
  'min m ' + pass.minM.toExponential(2));
check('trajectory: ran above CFL 1 in single implicit steps (shipped kernel would sub-step)',
  pass.maxCFL > 1.0, 'max |α|dt/hx = ' + pass.maxCFL.toFixed(2));

/* --- T7: MUTANTS — the gate must be able to go red. Each mutant rebuilds M_FP
   through the module's OWN fpCoeffs at a deliberately broken α while M_HJB
   keeps the correct one; the same defect metric that T2 gates must catch it. --- */
const rd = K.nu * K.dt / (K.hx * K.hx), rh = K.dt / K.hx;
/* mutant 1: sign-split dropped — donor-left flux always (flux_f = α_f·m_{f−1}),
   the classic wrong-way upwinding wherever α_f < 0 */
function matFPnosplit(alF) {
  const M = Array.from({ length: NX }, () => new Array(NX).fill(0));
  for (let i = 0; i < NX; i++) {
    const fL = i > 0 ? 1 : 0, fR = i < NX - 1 ? 1 : 0;
    if (i > 0) M[i][i - 1] = -rd * fL - rh * alF[i];
    M[i][i] = 1 + rd * (fL + fR) + rh * alF[i + 1];
    if (i < NX - 1) M[i][i + 1] = -rd * fR;
  }
  return M;
}
const dMut1 = transposeDefect(matFPnosplit(al), MH);
check('mutant 1 (sign-split dropped) is CAUGHT', dMut1 > 1e-3,
  'defect ' + dMut1.toExponential(2) + ' — gate can go red');
/* mutant 2: clamp released on the negative side in FP's α only (HJB keeps the
   clamped α) — proves the clamped interfaces are load-bearing in the metric */
const alMut = Float64Array.from(al);
for (let f = 1; f < NX; f++) if (al[f] <= -K.AMAX) {
  const s = (u[f] - u[f - 1]) / K.hx;
  alMut[f] = (s - PT) / K.ETA;                    // raw, unclamped (< −AMAX here)
}
const cMut = K.fpCoeffs(alMut);
const dMut2 = transposeDefect(K.matFromTri(cMut.A, cMut.B, cMut.C), MH);
check('mutant 2 (clamp released on − side in FP only) is CAUGHT — clamped interfaces are load-bearing',
  dMut2 > 1e-3, 'defect ' + dMut2.toExponential(2));

console.log('\n' + (fails.length ? fails.length + ' FAILURE(S)'
  : 'ALL PASS — sin-mfg adjoint-matched pair FP = HJBᵀ certified (operator level), note untouched.'));
process.exit(fails.length ? 1 : 0);
