/* mfg2p.js — the TWO-POPULATION model, in Fourier, and a Newton solver for it
   (floats). The rigorous half lives in box2p.js; this file only produces the
   numerical candidate that the validation then either certifies or refuses.

   THE MODEL — stationary (ergodic) two-population mean-field game on the
   1-torus, one shared viscosity sigma, quadratic Hamiltonian:

       −σ u_i'' + ½ (u_i')² + ρ_i  =  Σ_j c_ij m_j + V_i(x)    (HJB_i)
       −σ m_i'' − ( m_i u_i' )'    =  0                         (FP_i)
       ∫₀¹ m_i = 1,   ∫₀¹ u_i = 0,   m_i > 0,       i = 1, 2.

   WHY THIS SYSTEM. It is the two-population case of the model already certified
   in labs/mfg, and the ergodic quadratic two-population system is exactly the
   one Cirant–Verzini [arXiv:1511.09343] study — via Hopf–Cole it becomes a
   semilinear elliptic system, and they prove bifurcation (hence multiplicity)
   and segregation in the vanishing-viscosity limit. Their result is abstract
   and asymptotic; this lab decides concrete parameters over whole rectangles.

   THE COUPLING MATRIX is the new object. C = (c_ij): c_ii is self-interaction
   (c_ii > 0 crowd-averse), c_ij the cross-interaction. Lasry–Lions monotonicity
   — the hypothesis that buys uniqueness — asks that

       Σ_ij c_ij ∫ w_i w_j  >=  0   for all w,     i.e.   C + Cᵀ  ⪰  0.

   For C = [[cs, c12], [c21, cs]] that is |s| <= cs with s = (c12+c21)/2: ONLY
   the SYMMETRIC part of the cross-coupling can break monotonicity. The
   antisymmetric part d = (c12−c21)/2 — which is precisely the attack–defense
   asymmetry, one population pursuing what the other flees — drops out of the
   condition entirely. That is a sharp, falsifiable prediction about the shape
   of the uniqueness region, and deciding it over boxes is what regime2p.js
   does. [Lasry–Lions is CITED, not ours; the enclosures are ours.]

   FOURIER FORM. Per population, exactly as in mfg1d.js: u_i and m_i are even
   (V_i is even), their derivatives odd, a_{i,0} = 0 and b_{i,0} = 1 are the two
   normalisations, and p_{i,k} := 2πk a_{i,k}. Then

     H_{i,k} :  σ(2πk) p_{i,k} − ½ (p_i*p_i)_k − Σ_j c_ij b_{j,k} − V_{i,k} = 0
     F_{i,k} :  σ(2πk) b_{i,k} + (b_i*p_i)_k                                = 0
     H_{i,0} :  −½ (p_i*p_i)_0 + ρ_i − Σ_j c_ij b_{j,0} − V_{i,0}           = 0

   for k >= 1, with F_{i,0} identically zero (mass conservation) and replaced by
   b_{i,0} = 1. Unknowns (ρ_i, a_{i,1..N}, b_{i,1..N}) per population: 2(2N+1).

   THE BLOCK STRUCTURE IS THE POINT. Every nonlinearity is intra-population, so
   the Jacobian's diagonal blocks are literally the single-population Jacobian
   and the off-diagonal blocks are the constant −c_ij on the b-columns of the H
   rows. Setting c_12 = c_21 = 0 therefore DECOUPLES the system into two
   independent copies of the model in labs/mfg — which is battery check D1: at
   zero cross-coupling this file must reproduce mfg1d.js to the last bit. A
   two-population solver that cannot reproduce the one-population one at zero
   coupling is not a generalisation, it is a different program.

   MIT licensed. Part of cert-machine (labs/mfg2p). */
'use strict';

const M1D = require('../../legacy/core/mfg/mfg1d.js');
const { TWO_PI, at, atOdd, conv, pOf, solveLin, inverse } = M1D;

const P = 2;                                   /* two populations, throughout */

/* ---- problem definition ----
   C is the 2x2 coupling matrix given row-major as [c11, c12, c21, c22].
   V_i(x) = A_i cos(2πx), i.e. V_{i,1} = A_i/2 and every other coefficient 0. */
function makeProblem({ sigma, C, A, N, Vcoef }) {
  const As = Array.isArray(A) ? A : [A, A];
  const V = [];
  for (let i = 0; i < P; i++) {
    const Vi = new Float64Array(N + 1);
    if (Vcoef && Vcoef[i]) { for (let k = 0; k < Vcoef[i].length && k <= N; k++) Vi[k] = Vcoef[i][k]; }
    else if (N >= 1) Vi[1] = As[i] / 2;
    V.push(Vi);
  }
  return { sigma, C: Float64Array.from(C), A: As, N, V };
}

/* the per-population block length, and the index of population i's block */
const blk = N => 2 * N + 1;
const off = (i, N) => i * blk(N);

/* unpack x = [ (rho_i, a_{i,1..N}, b_{i,1..N}) for i = 0,1 ] */
function unpack(x, N) {
  const out = [];
  for (let i = 0; i < P; i++) {
    const o = off(i, N);
    const a = new Float64Array(N + 1), b = new Float64Array(N + 1);
    b[0] = 1;                                   /* ∫m_i = 1 */
    for (let k = 1; k <= N; k++) { a[k] = x[o + k]; b[k] = x[o + N + k]; }
    out.push({ rho: x[o], a, b });              /* a[0] = 0 by construction */
  }
  return out;
}

/* residual F(x) in R^{2(2N+1)}, blocks [H_{i,0}, H_{i,1..N}, F_{i,1..N}] */
function residual(x, Pb) {
  const { sigma, C, N, V } = Pb;
  const st = unpack(x, N);
  const R = new Float64Array(P * blk(N));
  for (let i = 0; i < P; i++) {
    const { rho, a, b } = st[i];
    const p = pOf(a);
    const pp = conv(p, p, N, 'o', 'o');         /* (u_i')² : odd * odd -> even */
    const bp = conv(b, p, N, 'e', 'o');         /* m_i u_i' : even * odd -> odd */
    const o = off(i, N);
    /* the coupling enters ONLY here: Σ_j c_ij b_{j,k} */
    const cpl = k => { let s = 0; for (let j = 0; j < P; j++) s += C[i * P + j] * st[j].b[k]; return s; };
    R[o] = -0.5 * pp[0] + rho - cpl(0) - V[i][0];
    for (let k = 1; k <= N; k++) {
      const l = sigma * (TWO_PI * k) * (TWO_PI * k);
      R[o + k] = l * a[k] - 0.5 * pp[k] - cpl(k) - V[i][k];
      R[o + N + k] = l * b[k] + TWO_PI * k * bp[k];
    }
  }
  return R;
}

/* analytic Jacobian, dense 2(2N+1) x 2(2N+1).
   Diagonal blocks: exactly mfg1d.js's Jacobian with c := c_ii.
   Off-diagonal block (i,j), i != j: −c_ij on the (H_{i,k}, b_{j,k}) entries
   only — the nonlinearities never mix populations.                          */
function jacobian(x, Pb) {
  const { sigma, C, N } = Pb;
  const st = unpack(x, N);
  const n = P * blk(N);
  const J = new Float64Array(n * n);
  for (let i = 0; i < P; i++) {
    const { a, b } = st[i];
    const p = pOf(a);
    const o = off(i, N);
    /* --- diagonal block: the single-population Jacobian at c = c_ii --- */
    J[o * n + (o + 0)] = 1;                                        /* ∂H_0/∂ρ_i */
    for (let m = 1; m <= N; m++) {
      J[o * n + (o + m)] = -0.5 * 4 * Math.PI * m * (atOdd(p, 0 - m) - atOdd(p, 0 + m));
    }
    for (let k = 1; k <= N; k++) {
      const l = sigma * (TWO_PI * k) * (TWO_PI * k);
      for (let m = 1; m <= N; m++) {
        let v = -0.5 * 4 * Math.PI * m * (atOdd(p, k - m) - atOdd(p, k + m));
        if (m === k) v += l;
        J[(o + k) * n + (o + m)] = v;
        J[(o + N + k) * n + (o + m)] = TWO_PI * k * (TWO_PI * m) * (at(b, k - m) - at(b, k + m));
        let w = TWO_PI * k * (atOdd(p, k - m) + atOdd(p, k + m));
        if (m === k) w += l;
        J[(o + N + k) * n + (o + N + m)] = w;
      }
    }
    /* --- coupling: ∂H_{i,k}/∂b_{j,m} = −c_ij δ_{km}, every j (i included) --- */
    for (let j = 0; j < P; j++) {
      const oj = off(j, N), cij = C[i * P + j];
      for (let k = 1; k <= N; k++) J[(o + k) * n + (oj + N + k)] = -cij;
      /* b_{j,0} is fixed at 1, so H_{i,0} contributes no column */
    }
  }
  return J;
}

/* Newton from the trivial branch (u_i = 0, m_i = 1, ρ_i = Σ_j c_ij), which is
   the EXACT solution when every V_i ≡ 0 — so continuation starts on a genuine
   solution, never on a guess. */
function solve(Pb, opts) {
  opts = opts || {};
  const { N, C } = Pb;
  const n = P * blk(N);
  let x = new Float64Array(n);
  for (let i = 0; i < P; i++) { let s = 0; for (let j = 0; j < P; j++) s += C[i * P + j]; x[off(i, N)] = s; }
  if (opts.x0) x = Float64Array.from(opts.x0);
  let res = residual(x, Pb), nrm = Infinity, it = 0;
  const hist = [];
  for (it = 0; it < (opts.maxIter || 60); it++) {
    nrm = 0; for (const v of res) nrm = Math.max(nrm, Math.abs(v));
    hist.push(nrm);
    if (nrm < (opts.tol || 1e-14)) break;
    const dx = solveLin(jacobian(x, Pb), res, n);
    if (!dx) return { ok: false, why: 'singular Jacobian', x, hist };
    let damp = 1;
    for (let t = 0; t < 30; t++) {
      const y = Float64Array.from(x);
      for (let q = 0; q < n; q++) y[q] -= damp * dx[q];
      const r2 = residual(y, Pb);
      let n2 = 0; for (const v of r2) n2 = Math.max(n2, Math.abs(v));
      if (n2 < nrm || damp < 1e-6) { x = y; res = r2; break; }
      damp *= 0.5;
    }
  }
  let fin = 0; for (const v of res) fin = Math.max(fin, Math.abs(v));
  return { ok: fin < (opts.tol || 1e-14) * 1e3, x, res, resNorm: fin, iters: it, hist };
}

/* evaluate m_i on a grid from the coefficients (plotting only) */
function evalOnGrid(x, Pb, M) {
  const { N } = Pb;
  const st = unpack(x, N);
  const xs = [], ms = [[], []];
  for (let q = 0; q < M; q++) {
    const t = q / M;
    xs.push(t);
    for (let i = 0; i < P; i++) {
      let m = st[i].b[0];
      for (let k = 1; k <= N; k++) m += 2 * st[i].b[k] * Math.cos(TWO_PI * k * t);
      ms[i].push(m);
    }
  }
  return { xs, ms };
}

/* THE MONOTONICITY TEST, exact in rationals when the entries are rationals.
   C + Cᵀ ⪰ 0  <=>  its diagonal entries are >= 0 and its determinant is >= 0
   (a symmetric 2x2 is PSD iff both leading principal minors and the trailing
   diagonal entry are >= 0). Returns the decision and the exact 2x2 form, so a
   page can print the witness rather than assert the verdict. */
function lasryLionsMonotone(C) {
  const s11 = 2 * C[0], s12 = C[1] + C[2], s22 = 2 * C[3];
  const det = s11 * s22 - s12 * s12;
  return { monotone: s11 >= 0 && s22 >= 0 && det >= 0, s11, s12, s22, det };
}

module.exports = {
  P, TWO_PI, blk, off, makeProblem, unpack, residual, jacobian, solve,
  evalOnGrid, lasryLionsMonotone, solveLin, inverse, conv, at, atOdd, pOf
};
