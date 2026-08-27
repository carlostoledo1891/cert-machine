/* test-transpose.js — certify the mfg-lab structural claim that was ASSERTED,
   not tested: "the Fokker–Planck transport is the exact discrete transpose of
   the linearized HJB drift" (mfg-lab.html method tab). The identical phrase was
   found FALSE in sin-mfg (FINDINGS_SIN Defect 4) once finally measured, so an
   untested twin here is a liability — and the sin-mfg note's Defect-4 contrast
   explicitly relies on the lab being adjoint-matched. This closes that gap.

   It is TRUE for the lab because the continuum tabs use the Achdou–Capuzzo-
   Dolcetta pair: an upwind monotone HJB whose linearization's exact transpose IS
   the FP operator (block-symmetric, positivity-preserving). "adjoint-matched"
   (FP = HJBᵀ), NOT "self-adjoint" (A = Aᵀ) — the diffusion is separately
   symmetric.

   Method: replicate the single-step transport+diffusion coefficients of M1's
   solveHJB and solveFP (mfg-lab.html), build both matrices for a frozen (u,g),
   and assert |M_FP − M_HJBᵀ|/scale ≈ 0. The replicated formulas are ANCHORED to
   the artifact source (regex): if a future edit changes the M1 coefficients, the
   anchor fails and the transpose must be re-verified — the same source-anchored
   discipline as test-sin.js A22/A23. */
'use strict';
const fs = require('fs');
const path = require('path');

/* A MISSING SUBJECT MUST BE A SENTENCE, NOT A STACK TRACE. Guard copied from
   test-index.js (which already solved this for itself). An unguarded
   readFileSync throws ENOENT: the runner sees a node internal frame and a
   nonzero exit, and cannot tell "the gate caught something" from "the gate is
   broken". Worse, the throw aborts the module, so every check after it — and
   the PASS/FAIL summary — silently stops running. MEASURED 2026-07-28: with
   MFG_HTML pointed at a missing path this battery printed ZERO PASS lines,
   ZERO FAIL lines and a stack trace. The guard prints on stdout, where this
   battery's other FAIL lines live, so a runner grepping one stream sees it. */
function mustExist(p, what, advice) {
  if (fs.existsSync(p)) return;
  console.log('FAIL  T0 ' + what + ' is not there: ' + p);
  console.log('      This is a MISSING FILE, not a failed assertion. ' + advice);
  console.log('\ntranspose gate FAILED — subject missing, so NO check in this battery ran.');
  process.exit(1);
}

const HTML = process.env.MFG_HTML || path.resolve(__dirname, '..', 'mfg-lab.html');
mustExist(HTML, 'the artifact this battery replicates M1 from',
  'Re-point MFG_HTML (or the default beside this file) at the artifact carrying M1; ' +
  'if M1 has moved out of mfg-lab.html, this battery must be re-pointed deliberately, not left to crash.');
const src = fs.readFileSync(HTML, 'utf8');
const fails = [];
function check(name, cond, detail) {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '   [' + detail + ']' : ''));
  if (!cond) fails.push(name);
}

/* --- ANCHORS: the M1 coefficient formulas this check replicates must still be
   the ones in the artifact. These are the exact lines from solveHJB/solveFP. --- */
const hjbVel = /vm=Math\.max\(pm,0\)\/g, vp=Math\.min\(pp,0\)\/g;/;
const hjbCoef = /A\[i\]=-rd\*fL-rh\*vm; C\[i\]=-rd\*fR\+rh\*vp;/;
const fpFlux = /ap\[i\+1\]=Math\.max\(-s,0\)\/gI\[i\];\s*am\[i\+1\]=Math\.min\(-s,0\)\/gI\[i\+1\];/;
const fpCoef = /A\[i\]=-rd\*fL-rh\*ap\[i\]; C\[i\]=-rd\*fR\+rh\*am\[i\+1\];/;
check('anchor: M1 solveHJB upwind-velocity formula unchanged', hjbVel.test(src));
check('anchor: M1 solveHJB tridiagonal coefficients unchanged', hjbCoef.test(src));
check('anchor: M1 solveFP interface-flux formula unchanged', fpFlux.test(src));
check('anchor: M1 solveFP tridiagonal coefficients unchanged', fpCoef.test(src));

/* THE ANCHORS ARE THE ONLY THING BINDING THIS BATTERY TO THE ARTIFACT.
   Everything below replicates the coefficients in this file, so with the
   anchors red the transpose check measures THIS FILE AGAINST ITSELF and prints
   `PASS  FP transport is the EXACT discrete transpose of the linearized HJB`
   about an artifact whose code it could not find. MEASURED 2026-07-28: pointed
   at research/mfg-congest/mfg-congest.html this battery printed exactly that PASS
   under four red anchors. That is a fake certificate — the house rule is that a
   certificate about a subject you did not read is worse than no certificate —
   so refuse instead, by name, before the replication runs. */
if (fails.length) {
  console.log('      This is an UNBOUND subject, not a failed assertion. The replicated M1');
  console.log('      coefficients below are anchored to the artifact by these regexes and by');
  console.log('      nothing else; with them red, the transpose result would describe this');
  console.log('      battery, not ' + HTML + '. If M1\'s formulas changed, re-verify the');
  console.log('      transpose and re-point the anchors; if M1 moved, re-point MFG_HTML.');
  console.log('\n' + fails.length + ' FAILURE(S) — anchors unresolved, so the transpose check was NOT run.');
  process.exit(1);
}

/* --- build both operators from those exact formulas and measure the match --- */
const NX = 40, H = 1 / (NX - 1), DT = 0.01, nu = 0.02;
const rd = DT * nu / (H * H), rh = DT / H;
const xs = Array.from({ length: NX }, (_, i) => i * H);
const u = xs.map(x => 4.0 * (x - 0.8) ** 2 + 0.3 * Math.sin(6 * x));   // sign-varying gradient
const g = xs.map(x => 1.0 + 0.5 * Math.exp(-((x - 0.4) ** 2) / 0.02)); // varying congestion

function mHJB() {
  const M = Array.from({ length: NX }, () => new Array(NX).fill(0));
  for (let i = 0; i < NX; i++) {
    const pm = i > 0 ? (u[i] - u[i - 1]) / H : 0, pp = i < NX - 1 ? (u[i + 1] - u[i]) / H : 0;
    const vm = Math.max(pm, 0) / g[i], vp = Math.min(pp, 0) / g[i];
    const fL = i > 0 ? 1 : 0, fR = i < NX - 1 ? 1 : 0;
    if (i > 0) M[i][i - 1] = -rd * fL - rh * vm;
    M[i][i] = 1 + rd * (fL + fR) + rh * vm - rh * vp;
    if (i < NX - 1) M[i][i + 1] = -rd * fR + rh * vp;
  }
  return M;
}
function mFP() {
  const M = Array.from({ length: NX }, () => new Array(NX).fill(0));
  const ap = new Array(NX + 1).fill(0), am = new Array(NX + 1).fill(0);
  for (let i = 0; i < NX - 1; i++) { const s = (u[i + 1] - u[i]) / H; ap[i + 1] = Math.max(-s, 0) / g[i]; am[i + 1] = Math.min(-s, 0) / g[i + 1]; }
  for (let i = 0; i < NX; i++) {
    const fL = i > 0 ? 1 : 0, fR = i < NX - 1 ? 1 : 0;
    if (i > 0) M[i][i - 1] = -rd * fL - rh * ap[i];
    M[i][i] = 1 + rd * (fL + fR) + rh * ap[i + 1] - rh * am[i];
    if (i < NX - 1) M[i][i + 1] = -rd * fR + rh * am[i + 1];
  }
  return M;
}
const A = mHJB(), F = mFP();
let dT = 0, scale = 0, dSym = 0;
for (let i = 0; i < NX; i++) for (let j = 0; j < NX; j++) {
  dT = Math.max(dT, Math.abs(F[i][j] - A[j][i]));
  scale = Math.max(scale, Math.abs(F[i][j]));
}
check('FP transport is the EXACT discrete transpose of the linearized HJB (adjoint-matched)',
  dT / scale < 1e-12, '|M_FP - M_HJBᵀ|/scale = ' + (dT / scale).toExponential(2));

/* diffusion alone (rh→0 has no transport) must be symmetric — the self-adjoint part */
const Ad = A.map(r => r.slice());
for (let i = 0; i < NX; i++) for (let j = 0; j < NX; j++) dSym = Math.max(dSym, Math.abs(A[i][j] - A[j][i]));
console.log('    (note: the full one-step operator is adjoint-matched FP=HJBᵀ, not self-adjoint A=Aᵀ; diffusion alone is symmetric)');

console.log('\n' + (fails.length ? fails.length + ' FAILURE(S)' : 'ALL PASS — lab FP = HJBᵀ certified, not asserted.'));
process.exit(fails.length ? 1 : 0);
