/* continuum_reference.js — the Achdou adjoint-matched (FP = HJBᵀ) operator pair
   for the SIN-MFG storage Hamiltonian, built HEADLESS. This is the "deferred but
   standard" road of SIN_MFG_Model_Spec_v0.3.md §A closed at the operator level:
   the shipped note (sin-mfg.html) deliberately keeps its centered-HJB / upwind-FP
   pair (measured NOT adjoint-matched — FINDINGS_SIN Defect 4, test-sin.js A22/A23),
   and this module builds the matched pair the spec names as the fix, for the SAME
   model (same grid, same constants, same Hamiltonian, same reflecting BCs).

   The model (sin-mfg.html:135): agent maximizes; H(p) = max_{|α|≤ᾱ} (αp − ½ηα²),
   drift α*(p) = clamp(p/η, ±ᾱ), p = u_x − ϖ. Constant η (no crowd congestion in
   the HJB — the mean-field coupling is only the scalar price per slice), so the
   pair is simpler than mfg-lab's congestion-weighted one (test-transpose.js).

   Construction (the crux): both operators consume the SAME frozen interface
   velocities. At interfaces f = 1..NX−1 (f between cells f−1 and f), from a
   frozen value field u and slice price ϖ:

     s_f  = (u[f] − u[f−1]) / hx
     α_f  = clamp((s_f − ϖ)/η, ±ᾱ),   α_0 = α_NX = 0   (zero-flux/reflecting)
     α_f⁺ = max(α_f, 0),  α_f⁻ = min(α_f, 0)

   FP transport (conservative donor-cell upwind, flux_f = α_f⁺ m_{f−1} + α_f⁻ m_f)
   and HJB advection (generator-form upwind: forward difference where α > 0,
   backward where α < 0) then satisfy L_HJB = L_FPᵀ EXACTLY — algebraically, at
   clamped interfaces too (the transpose is purely algebraic in α⁺/α⁻ and does not
   use the form of α). Folding the already-symmetric reflecting diffusion
   (sin-mfg.html:356-362) into one implicit tridiagonal per slice gives

     M_HJB = I − dt(L_HJB + L_diff),  M_FP = I − dt(L_FP + L_diff),
     M_FP  = M_HJBᵀ  (adjoint-matched, block-symmetric — NOT self-adjoint A=Aᵀ)

   Consequences, each an identity of the matrices (certified in
   tests/test-transpose-sin.js, never asserted):
     · positivity: M_FP is a strict M-matrix ⇒ m ≥ 0 unconditionally, no CFL
       sub-stepping (the shipped kernel needs ns ≤ 64 sub-steps; this pair runs
       CFL 1.4 in a single implicit step);
     · mass conservation AS AN ADJOINT IDENTITY: 1ᵀL_FP = (L_HJB·𝟙)ᵀ = 0 — the
       column sums vanish BECAUSE advection annihilates constants, not merely by
       the flux form;
     · the discrete-KKT pairing of Spec v0.3 §A: with FP = HJBᵀ the discrete
       system is eligible to BE the KKT of the discrete convex program. The
       operator pair is what this module certifies; the system-level KKT
       statement at a solved equilibrium is the mfglab continuum-port
       milestone (Spec v0.3 §G), deliberately not claimed here.

   Time staggering mirrors the lab convention (mfg-lab.html solveHJB/solveFP):
   the backward HJB step for u^n freezes α from u^{n+1}; the forward FP step
   n → n+1 freezes α from u^n. The transpose certificate is at a COMMON frozen
   (u, ϖ), exactly as in test-transpose.js.

   Run directly (node tools/continuum_reference.js) for a self-demo; the
   certificate battery is research/stock-constraint/tests/test-transpose-sin.js, which require()s
   this module (no copy to go stale) and prints the path + sha256 it validated. */
'use strict';

/* --- model constants: MIRRORS of sin-mfg.html:333-337,353,355. The battery
   anchors these against the artifact so the reference cannot silently drift
   from the model the note ships. --- */
const NT = 24, dt = 1.0, NX = 16, XBAR = 4.0, hx = XBAR / NX;
const SIG = 0.10, ETA = 8.0, AMAX = 0.35;
const KAPT = 0.6, XSTAR = 2.0;
const nu = 0.5 * SIG * SIG;
const xs = Array.from({ length: NX }, (_, i) => (i + 0.5) * hx);
const clampA = v => Math.max(-AMAX, Math.min(AMAX, v));

/* thomas — verbatim algorithm of sin-mfg.html:343-350 */
function thomas(a, b, c, d) {
  const n = d.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

/* shared frozen interface velocities — THE single choice that forces FP = HJBᵀ */
function interfaceAlpha(u, pt) {
  const al = new Float64Array(NX + 1);            // al[0] = al[NX] = 0: zero-flux
  for (let f = 1; f < NX; f++) {
    const s = (u[f] - u[f - 1]) / hx;
    al[f] = clampA((s - pt) / ETA);
  }
  return al;
}

/* M_HJB tridiagonal: sub A, diag B, super C.
     A[i] = −rd·fL + rh·α_i⁻          (≤ 0)
     C[i] = −rd·fR − rh·α_{i+1}⁺      (≤ 0)
     B[i] = 1 + rd(fL+fR) + rh(α_{i+1}⁺ − α_i⁻)   (≥ 1; strict M-matrix) */
function hjbCoeffs(al) {
  const rd = nu * dt / (hx * hx), rh = dt / hx;
  const A = new Float64Array(NX), B = new Float64Array(NX), C = new Float64Array(NX);
  for (let i = 0; i < NX; i++) {
    const fL = i > 0 ? 1 : 0, fR = i < NX - 1 ? 1 : 0;
    const aLm = Math.min(al[i], 0), aRp = Math.max(al[i + 1], 0);
    A[i] = -rd * fL + rh * aLm;
    C[i] = -rd * fR - rh * aRp;
    B[i] = 1 + rd * (fL + fR) + rh * (aRp - aLm);
  }
  return { A, B, C };
}

/* M_FP tridiagonal — the EXACT transpose of hjbCoeffs at the same al:
     A[i] = −rd·fL − rh·α_i⁺          ( = C[i−1] of HJB )
     C[i] = −rd·fR + rh·α_{i+1}⁻      ( = A[i+1] of HJB )
     B[i] = 1 + rd(fL+fR) + rh(α_{i+1}⁺ − α_i⁻)   (identical diagonal) */
function fpCoeffs(al) {
  const rd = nu * dt / (hx * hx), rh = dt / hx;
  const A = new Float64Array(NX), B = new Float64Array(NX), C = new Float64Array(NX);
  for (let i = 0; i < NX; i++) {
    const fL = i > 0 ? 1 : 0, fR = i < NX - 1 ? 1 : 0;
    const aLp = Math.max(al[i], 0), aRm = Math.min(al[i + 1], 0);
    A[i] = -rd * fL - rh * aLp;
    C[i] = -rd * fR + rh * aRm;
    B[i] = 1 + rd * (fL + fR) + rh * (Math.max(al[i + 1], 0) - Math.min(al[i], 0));
  }
  return { A, B, C };
}

/* one backward HJB slice: u^n from u^{n+1}, α frozen from u^{n+1}.
   Explicit source is the Legendre remainder of H at the frozen split controls
   (same structure as the shipped kernel's explicit step, sin-mfg.html:372:
   u += dt(α(u_x−ϖ) − ½ηα²), with the α·u_x part taken implicit here):
     src_i = −(aR + aL)·ϖ − ½η(aR² + aL²),  aR = α_{i+1}⁺, aL = α_i⁻
   (generically at most one of aR, aL is nonzero — the Godunov two-sided form). */
function hjbStep(uNext, pt) {
  const al = interfaceAlpha(uNext, pt);
  const { A, B, C } = hjbCoeffs(al);
  const D = new Float64Array(NX);
  for (let i = 0; i < NX; i++) {
    const aLm = Math.min(al[i], 0), aRp = Math.max(al[i + 1], 0);
    D[i] = uNext[i] + dt * (-(aRp + aLm) * pt - 0.5 * ETA * (aRp * aRp + aLm * aLm));
  }
  return thomas(A, B, C, D);
}

/* one forward FP slice: m^{n+1} from m^n, α frozen from u^n (lab convention) */
function fpStep(m, u, pt) {
  const al = interfaceAlpha(u, pt);
  const { A, B, C } = fpCoeffs(al);
  return thomas(A, B, C, Float64Array.from(m));
}

/* full backward+forward pass at a frozen price path. Terminal condition and
   initial density mirror sin-mfg.html:353 (Ψ = −κ_T(x−x*)²) and :379-381. */
function solvePass(price) {
  const u = [...Array(NT + 1)].map(() => new Float64Array(NX));
  for (let i = 0; i < NX; i++) u[NT][i] = -KAPT * (xs[i] - XSTAR) ** 2;
  for (let t = NT - 1; t >= 0; t--) u[t].set(hjbStep(u[t + 1], price[t]));
  const m = [...Array(NT + 1)].map(() => new Float64Array(NX));
  { const sd = 0.7; let Z = 0;
    for (let i = 0; i < NX; i++) { m[0][i] = Math.exp(-0.5 * ((xs[i] - 1.2) / sd) ** 2); Z += m[0][i] * hx; }
    for (let i = 0; i < NX; i++) m[0][i] /= Z; }
  for (let t = 0; t < NT; t++) m[t + 1].set(fpStep(m[t], u[t], price[t]));
  const mass = t => { let s = 0; for (let i = 0; i < NX; i++) s += m[t][i] * hx; return s; };
  let drift = 0, minM = Infinity, maxCFL = 0;
  for (let t = 0; t <= NT; t++) {
    drift = Math.max(drift, Math.abs(mass(t) - mass(0)));
    for (let i = 0; i < NX; i++) minM = Math.min(minM, m[t][i]);
  }
  for (let t = 0; t < NT; t++) {
    const al = interfaceAlpha(u[t], price[t]);
    for (let f = 0; f <= NX; f++) maxCFL = Math.max(maxCFL, Math.abs(al[f]) * dt / hx);
  }
  return { u, m, massDrift: drift, minM, maxCFL };
}

/* dense builders for the certificate battery */
function matFromTri(A, B, C) {
  const M = Array.from({ length: NX }, () => new Array(NX).fill(0));
  for (let i = 0; i < NX; i++) {
    if (i > 0) M[i][i - 1] = A[i];
    M[i][i] = B[i];
    if (i < NX - 1) M[i][i + 1] = C[i];
  }
  return M;
}
function matHJB(u, pt) { const { A, B, C } = hjbCoeffs(interfaceAlpha(u, pt)); return matFromTri(A, B, C); }
function matFP(u, pt) { const { A, B, C } = fpCoeffs(interfaceAlpha(u, pt)); return matFromTri(A, B, C); }
/* diffusion block alone (α ≡ 0) — the separately-symmetric part */
function matDiff() { const { A, B, C } = fpCoeffs(new Float64Array(NX + 1)); return matFromTri(A, B, C); }

if (require.main === module) {
  /* self-demo at a synthetic in-band price path (NOT an equilibrium — the
     equilibrium solve with clearing/dispatch is the Python-port milestone) */
  const bump = (t, c, s) => Math.exp(-0.5 * ((t - c) / s) ** 2);
  const price = Array.from({ length: NT }, (_, t) => 0.6 + 0.5 * bump(t, 19, 2.0) - 0.3 * bump(t, 12.5, 2.6));
  const r = solvePass(price);
  console.log('continuum_reference self-demo (frozen synthetic price path):');
  console.log('  mass drift over 24 slices : ' + r.massDrift.toExponential(2) + '  (exact by adjoint identity)');
  console.log('  min m over grid           : ' + r.minM.toExponential(2) + '  (M-matrix positivity)');
  console.log('  max CFL |α|dt/hx          : ' + r.maxCFL.toFixed(2) + '  (single implicit step, no sub-stepping)');
  console.log('certificates live in tests/test-transpose-sin.js — run that, not this.');
}

module.exports = {
  NT, dt, NX, XBAR, hx, SIG, ETA, AMAX, KAPT, XSTAR, nu, xs,
  thomas, interfaceAlpha, hjbCoeffs, fpCoeffs, hjbStep, fpStep, solvePass,
  matFromTri, matHJB, matFP, matDiff,
};
