/* monoflow.js — monotone, and provably not a gradient: two certificates on one
   mean-field-game equilibrium.

   THE OBJECT. The stationary quadratic MFG of labs/mfg (legacy/core/mfg):

       −σ u'' + ½ (u')² + ρ = c m + A cos 2πx,     −σ m'' − (m u')' = 0,
       ∫m = 1, ∫u = 0, m > 0,

   in the even Fourier–Galerkin space of order N, and on it the MONOTONE FLOW
   of the Gomes school (Almulla–Ferreira–Gomes 2017, §2.6; Ferreira–Gomes–Tada
   2025): with the Lasry–Lions operator

       A(m, u) = ( c m + V + σ u'' − ½ (u')²  ,  −σ m'' − (m u')' )

   paired with (δm, δu) in L², the flow  (ṁ, u̇) = −A(m, u)  (the k = 0 mode
   held by the mass and mean normalisations, which is AFG's H̄(t) correction).
   Its equilibria are the MFG solutions.

   CERTIFICATE 1 — MONOTONE, in one exact line. For any (m, u) with m > 0 and
   any direction (δm, δu),

       ⟨DA(m,u)(δm,δu), (δm,δu)⟩_{L²}  =  c ∫δm²  +  ∫ m (δu')².

   The cross terms cancel by two integrations by parts on the torus. So the
   linearised operator is positive semidefinite exactly when c ≥ 0 — the
   Lasry–Lions condition — and for c < 0 the direction δm = cos 2πx, δu = 0
   is an exact negative witness with value c/2. This file evaluates the form
   from the interval Jacobian at every instance and requires c/2 back: that is
   a check on the Jacobian assembly, not a discovery.

   CERTIFICATE 2 — NOT A GRADIENT FLOW, under ANY Riemannian metric. If a flow
   is ż = −G(z)⁻¹ ∇E(z) then its Jacobian at an equilibrium is −G⁻¹ Hess E,
   similar to a symmetric matrix, so its spectrum is REAL. A certified
   non-real eigenvalue pair of the flow Jacobian at a certified equilibrium
   therefore rules out every (G, E) near it. The certificate is a Krawczyk
   enclosure of an eigenpair (v, μ) of the interval Jacobian over the
   equilibrium's own box, with Im μ enclosed away from zero.

   The equilibrium itself is enclosed first, by a finite-dimensional Krawczyk
   step on the Galerkin system Φ_N in the (ρ, p, b) variables of validate.js
   (p = u'); the same candidate is then enclosed as a solution of the PDE by
   validate.js, so the reader has both radii side by side.

   AT THE CONSTANT SOLUTION (A = 0, m ≡ 1, u ≡ 0) everything is exact per
   Fourier mode k, λ_k = (2πk)²: the flow Jacobian block is [[−c, σλ],[−σλ, −λ]],
   with eigenvalues ( −(c+λ) ± √((c−λ)² − 4σ²λ²) ) / 2 — non-real iff
   λ(1 − 2σ) < c < λ(1 + 2σ). That is the control every certified pair is
   checked against at A = 0.

   MIT licensed. Part of cert-machine (instruments/monoflow). */
'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const RD = require(path.join(ROOT, 'instruments', 'interval', 'radii.js'));
const CERT = require(path.join(ROOT, 'instruments', 'interval', 'certificate.js'));
const M1D = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'mfg1d.js'));
const VAL = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'validate.js'));
const BOX = require(path.join(ROOT, 'labs', 'mfg', 'box.js'));
const { iv, add, sub, mul, div, neg, mag, width, ZERO, ONE } = I;

const TWO_PI = 2 * Math.PI;
const TWO_PI_I = I.encloseFloat(TWO_PI);
const tpk = (k) => mul(TWO_PI_I, iv(k));               /* 2πk as an interval */

/* ---------------- the candidate ---------------------------------------- */
function candidate(inst) {
  const { sigma, c, A, N } = inst;
  const P = M1D.makeProblem({ sigma, c, A, N });
  let x;
  if (inst.branch === 'herding') {
    x = BOX.seedHerding ? null : null;
    /* box.js does not export its seeds; reproduce the recorded recipe here */
    const cStar = -(sigma * sigma) * TWO_PI * TWO_PI;
    const cEnter = cStar - 0.25;
    const seed = new Float64Array(2 * N + 1);
    seed[0] = cEnter; seed[1] = -sigma * 0.35; seed[N + 1] = 0.35;
    const st = M1D.solve(M1D.makeProblem({ sigma, c: cEnter, A: 0, N }), { x0: seed, maxIter: 400 });
    if (!(st.resNorm < 1e-11)) throw new Error('herding seed did not converge');
    const steps = Math.max(8, Math.ceil(Math.abs(cEnter - c) / 0.25));
    const br = M1D.continueBranch(cc => M1D.makeProblem({ sigma, c: cc, A: 0, N }), cEnter, c, steps, st.x);
    if (!br.ok) throw new Error('herding branch lost: ' + br.why);
    x = br.x;
    if (A !== 0) {
      const as = Math.max(1, Math.ceil(A / 0.05));
      for (let i = 1; i <= as; i++) {
        const r = M1D.solve(M1D.makeProblem({ sigma, c, A: A * i / as, N }), { x0: x, maxIter: 300 });
        if (!(r.resNorm < 1e-11)) throw new Error('herding branch lost in A');
        x = r.x;
      }
    }
  } else {
    x = new Float64Array(2 * N + 1); x[0] = c;
    const steps = Math.max(1, Math.ceil(A / 0.05));
    for (let i = 1; i <= steps; i++) {
      const r = M1D.solve(M1D.makeProblem({ sigma, c, A: A * i / steps, N }), { x0: x, maxIter: 300 });
      if (!(r.resNorm < 1e-11)) throw new Error('aligned branch lost at A=' + (A * i / steps));
      x = r.x;
    }
    if (A === 0) { const r = M1D.solve(P, { x0: x }); x = r.x; }
  }
  return { P, x };
}

/* (ρ, a, b) floats -> (ρ, p, b) floats, p_k = 2πk a_k (the validate.js variables) */
function toPB(x, N) {
  const y = new Float64Array(2 * N + 1);
  y[0] = x[0];
  for (let k = 1; k <= N; k++) { y[k] = TWO_PI * k * x[k]; y[N + k] = x[N + k]; }
  return y;
}
function xbOf(X, N) {
  const p = new Array(N + 1).fill(ZERO), b = new Array(N + 1).fill(ZERO);
  b[0] = ONE;
  for (let k = 1; k <= N; k++) { p[k] = X[k]; b[k] = X[N + k]; }
  return { rho: X[0], p, b };
}

/* ---------------- 1. the Galerkin equilibrium, enclosed ------------------ */
function galerkinBox(P, xFloat) {
  const N = P.N, n = 2 * N + 1;
  const y0 = toPB(xFloat, N);
  const F = (X) => {
    const { H, F: Fr } = VAL.buildPhi(xbOf(X, N), P, N);
    const out = new Array(n);
    out[0] = H[0];
    for (let k = 1; k <= N; k++) { out[k] = H[k]; out[N + k] = Fr[k]; }
    return out;
  };
  const DF = (X) => {
    const xb = xbOf(X, N);
    const J = [];
    for (let k = 0; k <= N; k++) {
      const r = VAL.dRow('H', k, xb, P, N);
      const row = new Array(n);
      row[0] = r.rho;
      for (let m = 1; m <= N; m++) { row[m] = r.p[m]; row[N + m] = r.b[m]; }
      J[k] = row;
    }
    for (let k = 1; k <= N; k++) {
      const r = VAL.dRow('F', k, xb, P, N);
      const row = new Array(n);
      row[0] = r.rho;
      for (let m = 1; m <= N; m++) { row[m] = r.p[m]; row[N + m] = r.b[m]; }
      J[N + k] = row;
    }
    return J;
  };
  const J0 = DF(Array.from(y0, v => iv(v)));
  const Jf = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Jf[i * n + j] = (J0[i][j][0] + J0[i][j][1]) / 2;
  const inv = M1D.inverse(Jf, n);
  if (!inv) return { ok: false, why: 'float Jacobian singular' };
  const A = [];
  for (let i = 0; i < n; i++) { A[i] = []; for (let j = 0; j < n; j++) A[i][j] = inv[i * n + j]; }
  const kr = RD.krawczyk(F, DF, Array.from(y0), A, { maxRounds: 20, radCap: 1e-3 });
  if (!kr.ok) return { ok: false, why: kr.why };
  let maxRad = 0;
  for (let i = 0; i < n; i++) maxRad = Math.max(maxRad, width(kr.box[i]) / 2);
  return { ok: true, box: kr.box, y0, maxRad, rounds: kr.rounds };
}

/* ---------------- 2. the flow Jacobian over the box ---------------------- */
/* z = (b_1..b_N, a_1..a_N);  ż = ( H_k(z), −F_k(z) ),  H = Φ^H, F = 2πk Φ^F, a_m = p_m/(2πm) */
function flowJacobian(P, X) {
  const N = P.N, xb = xbOf(X, N);
  const J = [];
  for (let k = 1; k <= N; k++) {
    const r = VAL.dRow('H', k, xb, P, N);
    const row = new Array(2 * N);
    for (let m = 1; m <= N; m++) { row[m - 1] = r.b[m]; row[N + m - 1] = mul(r.p[m], tpk(m)); }
    J[k - 1] = row;
  }
  for (let k = 1; k <= N; k++) {
    const r = VAL.dRow('F', k, xb, P, N);
    const row = new Array(2 * N);
    const s = neg(tpk(k));
    for (let m = 1; m <= N; m++) { row[m - 1] = mul(s, r.b[m]); row[N + m - 1] = mul(s, mul(r.p[m], tpk(m))); }
    J[N + k - 1] = row;
  }
  return J;
}
const midM = (J) => J.map(r => r.map(e => (e[0] + e[1]) / 2));

/* the Lasry–Lions quadratic form from the same rows: ⟨DA v, v⟩ with
   A = (−H, F) paired with (δm, δu), L² weight ½ on every k ≥ 1 mode;
   v = (δb, δa). Must return c/2 for δb = e_1, δa = 0. */
function llForm(P, X, v) {
  const N = P.N, xb = xbOf(X, N);
  let s = ZERO;
  for (let k = 1; k <= N; k++) {
    const rH = VAL.dRow('H', k, xb, P, N), rF = VAL.dRow('F', k, xb, P, N);
    let dA1 = ZERO, dA2 = ZERO;                 /* (−DH v)_k and (DF v)_k in the flow's (b, a) variables */
    for (let m = 1; m <= N; m++) {
      dA1 = add(dA1, add(mul(rH.b[m], iv(v[m - 1])), mul(mul(rH.p[m], tpk(m)), iv(v[N + m - 1]))));
      dA2 = add(dA2, add(mul(rF.b[m], iv(v[m - 1])), mul(mul(rF.p[m], tpk(m)), iv(v[N + m - 1]))));
    }
    dA1 = neg(dA1);
    dA2 = mul(dA2, tpk(k));
    s = add(s, mul(iv(0.5), add(mul(dA1, iv(v[k - 1])), mul(dA2, iv(v[N + k - 1])))));
  }
  return s;
}

/* ---------------- 3. the float eigenpair: complex inverse iteration ------ */
function csolve(Jm, mu, rhs) {                       /* (Jm − μ I) w = rhs, complex, Gaussian elimination */
  const n = Jm.length;
  const Ar = [], Ai = [];
  for (let i = 0; i < n; i++) {
    Ar[i] = Jm[i].slice(); Ai[i] = new Array(n).fill(0);
    Ar[i][i] -= mu[0]; Ai[i][i] -= mu[1];
  }
  const br = rhs[0].slice(), bi = rhs[1].slice();
  for (let k = 0; k < n; k++) {
    let p = k, best = -1;
    for (let r = k; r < n; r++) { const v = Ar[r][k] * Ar[r][k] + Ai[r][k] * Ai[r][k]; if (v > best) { best = v; p = r; } }
    if (!(best > 1e-24)) return null;                /* an exactly singular shift: refuse, do not divide */
    [Ar[k], Ar[p]] = [Ar[p], Ar[k]]; [Ai[k], Ai[p]] = [Ai[p], Ai[k]];
    [br[k], br[p]] = [br[p], br[k]]; [bi[k], bi[p]] = [bi[p], bi[k]];
    const dr = Ar[k][k], di = Ai[k][k], dd = dr * dr + di * di;
    for (let r = k + 1; r < n; r++) {
      const nr = Ar[r][k], ni = Ai[r][k];
      const fr = (nr * dr + ni * di) / dd, fi = (ni * dr - nr * di) / dd;   /* (nr+i ni)/(dr+i di) */
      if (fr === 0 && fi === 0) continue;
      for (let j = k; j < n; j++) {
        Ar[r][j] -= fr * Ar[k][j] - fi * Ai[k][j];
        Ai[r][j] -= fr * Ai[k][j] + fi * Ar[k][j];
      }
      br[r] -= fr * br[k] - fi * bi[k];
      bi[r] -= fr * bi[k] + fi * br[k];
    }
  }
  const xr = new Array(n).fill(0), xi = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sr = br[r], si = bi[r];
    for (let j = r + 1; j < n; j++) { sr -= Ar[r][j] * xr[j] - Ai[r][j] * xi[j]; si -= Ar[r][j] * xi[j] + Ai[r][j] * xr[j]; }
    const dr = Ar[r][r], di = Ai[r][r], dd = dr * dr + di * di;
    xr[r] = (sr * dr + si * di) / dd; xi[r] = (si * dr - sr * di) / dd;
  }
  return [xr, xi];
}
function eigFloat(Jm, shift) {
  const n = Jm.length;
  let vr = new Array(n).fill(0).map((_, i) => Math.cos(i + 1)), vi = new Array(n).fill(0).map((_, i) => Math.sin(2 * i + 1));
  /* the shift is nudged off its seed: a seed that IS an eigenvalue (the closed
     form at A = 0) makes J − μI exactly singular and the first solve garbage */
  let mu = [shift[0] * (1 + 1e-3) + 1e-3, shift[1] * (1 + 1e-3) + 1e-3];
  const norm = () => { let s = 0; for (let i = 0; i < n; i++) s += vr[i] * vr[i] + vi[i] * vi[i]; s = Math.sqrt(s); for (let i = 0; i < n; i++) { vr[i] /= s; vi[i] /= s; } };
  norm();
  for (let it = 0; it < 60; it++) {
    const w = csolve(Jm, mu, [vr, vi]);
    if (!w) break;
    vr = w[0]; vi = w[1]; norm();
    /* Rayleigh quotient μ = v* J v / v* v  (v* v = 1) */
    let nr = 0, ni = 0;
    for (let i = 0; i < n; i++) {
      let jr = 0, ji = 0;
      for (let j = 0; j < n; j++) { jr += Jm[i][j] * vr[j]; ji += Jm[i][j] * vi[j]; }
      nr += vr[i] * jr + vi[i] * ji; ni += vr[i] * ji - vi[i] * jr;
    }
    const dmu = Math.hypot(nr - mu[0], ni - mu[1]);
    mu = [nr, ni];
    if (dmu < 1e-15 * (1 + Math.hypot(nr, ni))) break;
  }
  /* the residual decides whether this is an eigenpair at all */
  let rmax = 0, jmax = 0;
  for (let i = 0; i < n; i++) {
    let sr = 0, si = 0;
    for (let j = 0; j < n; j++) { sr += Jm[i][j] * vr[j]; si += Jm[i][j] * vi[j]; jmax = Math.max(jmax, Math.abs(Jm[i][j])); }
    rmax = Math.max(rmax, Math.abs(sr - mu[0] * vr[i] + mu[1] * vi[i]), Math.abs(si - mu[0] * vi[i] - mu[1] * vr[i]));
  }
  if (!(rmax < 1e-9 * (1 + jmax))) return { ok: false, mu, residual: rmax };
  /* phase: make the largest component real and positive */
  let i0 = 0, best = -1;
  for (let i = 0; i < n; i++) { const a = vr[i] * vr[i] + vi[i] * vi[i]; if (a > best) { best = a; i0 = i; } }
  const pr = vr[i0], pi = vi[i0], pd = pr * pr + pi * pi;
  const ur = new Array(n), ui = new Array(n);
  for (let i = 0; i < n; i++) { ur[i] = (vr[i] * pr + vi[i] * pi) / pd; ui[i] = (vi[i] * pr - vr[i] * pi) / pd; }
  return { ok: true, mu, vr: ur, vi: ui, i0, v: [ur, ui], residual: rmax };
}

/* ---------------- 4. the eigenpair, enclosed ------------------------------ */
/* unknowns y = (vr[0..n-1], vi[0..n-1], μr, μi); equations
     J vr − μr vr + μi vi = 0,  J vi − μr vi − μi vr = 0,  vr[i0] − 1 = 0,  vi[i0] = 0 */
function eigenBox(J, e) {
  const n = J.length, N2 = 2 * n + 2;
  const { i0 } = e;
  const F = (Y) => {
    const out = new Array(N2);
    const mr = Y[2 * n], mi = Y[2 * n + 1];
    for (let i = 0; i < n; i++) {
      let sr = ZERO, si = ZERO;
      for (let j = 0; j < n; j++) {
        const jij = J[i][j];
        if (jij[0] === 0 && jij[1] === 0) continue;
        sr = add(sr, mul(jij, Y[j])); si = add(si, mul(jij, Y[n + j]));
      }
      out[i] = add(sub(sr, mul(mr, Y[i])), mul(mi, Y[n + i]));
      out[n + i] = sub(sub(si, mul(mr, Y[n + i])), mul(mi, Y[i]));
    }
    out[2 * n] = sub(Y[i0], ONE);
    out[2 * n + 1] = Y[n + i0];
    return out;
  };
  const DF = (Y) => {
    const mr = Y[2 * n], mi = Y[2 * n + 1];
    const D = [];
    for (let i = 0; i < N2; i++) D[i] = new Array(N2).fill(ZERO);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) { D[i][j] = J[i][j]; D[n + i][n + j] = J[i][j]; }
      D[i][i] = sub(D[i][i], mr);           D[i][n + i] = mi;
      D[n + i][n + i] = sub(D[n + i][n + i], mr); D[n + i][i] = neg(mi);
      D[i][2 * n] = neg(Y[i]);      D[i][2 * n + 1] = Y[n + i];
      D[n + i][2 * n] = neg(Y[n + i]); D[n + i][2 * n + 1] = neg(Y[i]);
    }
    D[2 * n][i0] = ONE;
    D[2 * n + 1][n + i0] = ONE;
    return D;
  };
  const y0 = e.vr.concat(e.vi, [e.mu[0], e.mu[1]]);
  const D0 = DF(y0.map(v => iv(v)));
  const Df = new Float64Array(N2 * N2);
  for (let i = 0; i < N2; i++) for (let j = 0; j < N2; j++) Df[i * N2 + j] = (D0[i][j][0] + D0[i][j][1]) / 2;
  const inv = M1D.inverse(Df, N2);
  if (!inv) return { ok: false, why: 'eigen-system Jacobian singular (a multiple eigenvalue?)' };
  const A = [];
  for (let i = 0; i < N2; i++) { A[i] = []; for (let j = 0; j < N2; j++) A[i][j] = inv[i * N2 + j]; }
  const kr = RD.krawczyk(F, DF, y0, A, { maxRounds: 20, radCap: 0.5 });
  if (!kr.ok) return { ok: false, why: kr.why };
  const mu = [kr.box[2 * n], kr.box[2 * n + 1]];
  return { ok: true, mu, muWidth: [width(mu[0]), width(mu[1])], nonReal: !(mu[1][0] <= 0 && 0 <= mu[1][1]), rounds: kr.rounds };
}

/* ---------------- the closed form at the constant solution --------------- */
function constantModes(sigma, c, N) {
  const out = [];
  for (let k = 1; k <= N; k++) {
    const lam = (TWO_PI * k) * (TWO_PI * k);
    const disc = (c - lam) * (c - lam) - 4 * sigma * sigma * lam * lam;
    const re = -(c + lam) / 2;
    out.push(disc < 0 ? { k, re, im: Math.sqrt(-disc) / 2, complex: true }
                      : { k, mu1: re + Math.sqrt(disc) / 2, mu2: re - Math.sqrt(disc) / 2, complex: false });
  }
  return out;
}
/* the same, as intervals, for the control: block [[−c, σλ],[−σλ, −λ]] */
function constantModeI(sigma, c, k) {
  const lam = mul(tpk(k), tpk(k));
  const s = iv(sigma), C = iv(c);
  const disc = sub(mul(sub(C, lam), sub(C, lam)), mul(mul(iv(4), mul(s, s)), mul(lam, lam)));
  const re = neg(div(add(C, lam), iv(2)));
  if (disc[1] < 0) {
    const nd = neg(disc);
    const sq = [Math.sqrt(nd[0]) * (1 - 1e-15), Math.sqrt(nd[1]) * (1 + 1e-15)];
    return { complex: true, re, im: div(sq, iv(2)) };
  }
  return { complex: false, re, disc };
}

/* ---------------- one instance, end to end ------------------------------- */
function decide(inst, opts) {
  opts = opts || {};
  const { P, x } = candidate(inst);
  const N = P.N;
  const G = galerkinBox(P, x);
  if (!G.ok) return { ok: false, inst, why: 'Galerkin equilibrium not enclosed: ' + G.why };
  const pde = VAL.validate(x, P, { nu: inst.nu || 1.05 });
  const pos = pde.ok ? VAL.certifyPositivity(x, P, pde.r, 2048) : null;
  const J = flowJacobian(P, G.box);
  const Jm = midM(J);
  /* the Lasry–Lions form at δm = cos 2πx (δb_1 = 1), δu = 0: must be c/2 */
  const v1 = new Array(2 * N).fill(0); v1[0] = 1;
  const form = llForm(P, G.box, v1);
  /* shifts: the constant-solution modes k = 1..4 (complex ones first) */
  const modes = constantModes(P.sigma, P.c, Math.min(N, 4));
  const shifts = [];
  for (const m of modes) if (m.complex) shifts.push([m.re, m.im]);
  for (const m of modes) if (!m.complex) { shifts.push([m.mu1, 0.3 * Math.abs(m.mu1) + 1]); shifts.push([m.mu2, 0.3 * Math.abs(m.mu2) + 1]); }
  const tried = [], pairs = [];
  const seen = [];
  for (const sh of shifts) {
    const e = eigFloat(Jm, sh);
    if (!e.ok || !Number.isFinite(e.mu[0]) || !Number.isFinite(e.mu[1])) { tried.push({ shift: sh, mu: e.mu, failed: true }); continue; }
    if (seen.some(s => Math.hypot(s[0] - e.mu[0], s[1] - Math.abs(e.mu[1])) < 1e-6)) continue;
    seen.push([e.mu[0], Math.abs(e.mu[1])]);
    tried.push({ shift: sh, mu: e.mu });
    if (Math.abs(e.mu[1]) < 1e-9) continue;                         /* a real eigenvalue: no use to certificate 2 */
    if (e.mu[1] < 0) { e.mu[1] = -e.mu[1]; e.vi = e.vi.map(v => -v); e.v = [e.vr, e.vi]; }   /* take the upper one of the pair */
    const eb = eigenBox(J, e);
    pairs.push(Object.assign({ shift: sh, muFloat: e.mu }, eb));
    if (eb.ok && eb.nonReal && !opts.all) break;
  }
  const certified = pairs.filter(p => p.ok && p.nonReal);
  let control = null;
  if (P.A === 0 && inst.branch !== 'herding') {
    control = modes.map(m => Object.assign({ k: m.k }, constantModeI(P.sigma, P.c, m.k)));
  }
  return {
    ok: true, inst, sigma: P.sigma, c: P.c, A: P.A, N,
    galerkin: { maxRad: G.maxRad, rounds: G.rounds },
    pde: pde.ok ? { r: pde.r, Z1: pde.Z1, kappa: pde.kappa, minM: pos ? pos.minM : null } : { ok: false, why: pde.why },
    form: { value: form, expected: P.c / 2, contains: form[0] <= P.c / 2 && P.c / 2 <= form[1] },
    monotone: P.c >= 0,
    modes, tried, pairs, certified,
    verdict: certified.length ? 'NOT A GRADIENT FLOW' : 'NOT DECIDED',
    control,
    x: Array.from(x)
  };
}

function certificate(res, provenance) {
  const falsifier = [
    'the Lasry–Lions form evaluated from the assembled Jacobian at δm = cos 2πx must return c/2 — a sign error in the assembly breaks it',
    'a symmetric matrix handed to the eigenpair certifier with a complex shift must NOT return a non-real pair',
    'the eigenpair certifier started 0.5 away from the eigenvalue must return no contraction',
    'at A = 0 the certified pair must contain the closed-form mode eigenvalue, and the closed form with σ replaced by 1 − σ must be excluded',
    'the Galerkin equilibrium certifier started from a candidate perturbed by 1e-2 must return no contraction'
  ];
  const lab = '(σ, c, A, N) = (' + res.sigma + ', ' + res.c + ', ' + res.A + ', ' + res.N + ')' + (res.inst.branch === 'herding' ? ' herding branch' : '');
  if (!res.ok) return CERT.refused({ claim: 'monotone flow spectrum at ' + lab, why: res.why, falsifier, provenance });
  if (!res.form.contains) return CERT.refused({ claim: 'monotone flow spectrum at ' + lab, why: 'the Lasry–Lions form did not return c/2 from the Jacobian', falsifier, provenance });
  if (!res.certified.length) return CERT.notChecked({
    claim: 'the monotone flow at ' + lab + ' is not a gradient flow under any metric — NOT DECIDED: no non-real eigenpair was certified (every float eigenvalue reached was real)',
    falsifier, provenance });
  const p = res.certified[0];
  return CERT.proved({
    claim: 'the monotone flow of the Galerkin MFG at ' + lab + ' is NOT a gradient flow under any Riemannian metric near its certified equilibrium: an eigenvalue μ of the flow Jacobian is enclosed with Re μ ∈ ' + CERT.fmt(p.mu[0]) + ', Im μ ∈ ' + CERT.fmt(p.mu[1]) + ' (Im μ ≠ 0); the linearised Lasry–Lions form is ' + (res.monotone ? 'positive semidefinite (c ≥ 0): monotone' : 'indefinite (c < 0, witness value c/2 = ' + res.c / 2 + '): not monotone'),
    evidence: { galerkinRadius: res.galerkin.maxRad, pdeRadius: res.pde.r, muRe: p.mu[0], muIm: p.mu[1], formValue: res.form.value },
    assumes: [
      'the flow is the L²-paired monotone flow (ṁ, u̇) = −A(m, u) restricted to the even Galerkin space of order N with mass and mean held; the theorem is about that finite-dimensional ODE',
      'a gradient flow ż = −G⁻¹∇E has a Jacobian similar to a symmetric matrix at an equilibrium, hence real spectrum (linear algebra, not re-proved)'
    ],
    falsifier, provenance
  });
}

function sha256File(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

module.exports = { candidate, toPB, xbOf, galerkinBox, flowJacobian, midM, llForm, eigFloat, eigenBox, constantModes, constantModeI, decide, certificate, sha256File };
