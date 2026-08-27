/* mfg1d.js — the model, in Fourier, and a Newton solver for it (floats).
   The rigorous half lives in validate.js; this file only produces the numerical
   candidate that the validation then either certifies or refuses.

   THE MODEL — stationary (ergodic) mean-field game on the 1-torus:

       −σ u'' + ½ (u')² + ρ  =  c·m + V(x)        (HJB, backward)
       −σ m'' − ( m u' )'    =  0                  (Fokker–Planck, forward)
       ∫₀¹ m = 1,   ∫₀¹ u = 0,   m > 0.

   ρ is the unknown ergodic constant; (u, m, ρ) is the unknown triple. The
   coupling F(m) = c·m with c > 0 is strictly increasing, i.e. Lasry–Lions
   MONOTONE, so the system has a unique solution [STANDARD: Lasry–Lions]. That
   classical uniqueness is what upgrades the local statement the validation
   proves into a global one — see docs/THEORY.md.

   WHY FOURIER. Both nonlinearities are quadratic, and in the weighted ell^1_nu
   norm the Fourier coefficients form a Banach algebra, so every quadratic bound
   the radii-polynomial argument needs is an application of ||f*g|| <= ||f|| ||g||
   rather than a Sobolev embedding with an unevaluated constant. That is the
   whole reason this is computable: the constants are products of norms we are
   already computing.

   SYMMETRY. V is even, so we solve in the space of EVEN functions: all Fourier
   coefficients are real and f_{-k} = f_k. The validation therefore proves
   existence and local uniqueness in the even subspace; combined with the
   classical global uniqueness above, the true solution IS even, so nothing is
   lost. This is stated as a hypothesis, not hidden — see docs/THEORY.md §4.

   FOURIER FORM. Write u = Σ_k a_k e^{2πikx}, m = Σ_k b_k e^{2πikx}, with
   a_0 = 0, b_0 = 1 (the two normalisations) and p_k := 2πk a_k (so that
   (u')^_k = i p_k; p is odd, p_0 = 0). Then, with all convolutions over Z:

     H_k :  σ(2πk)² a_k − ½ (p*p)_k + ρ δ_{k0} − c b_k − V_k = 0      k ≥ 0
     F_k :  σ(2πk)² b_k + 2πk (b*p)_k                        = 0      k ≥ 1

   F_0 is 0 = 0 identically — the Fokker–Planck equation conserves mass, so its
   zero mode carries no information and is replaced by the normalisation b_0 = 1.
   H_0 is what determines ρ. Unknowns (ρ, a_1..a_N, b_1..b_N) and equations
   (H_0, H_1..H_N, F_1..F_N) both number 2N+1.

   MIT licensed. Part of mfg-cap. */
'use strict';

const TWO_PI = 2 * Math.PI;

/* PARITY MATTERS, and getting it wrong is invisible in the Fourier residual.
   u and m are EVEN (f_{-k} = f_k) because V is even, but their DERIVATIVES are
   ODD: p_k = 2πk a_k satisfies p_{-k} = −p_k. Extending p evenly makes the
   Fourier residual machine-zero at a point that does not solve the PDE — the
   Galerkin system is then simply a different (wrong) system. This was a live
   bug here, caught not by the residual but by evaluating the PDE pointwise and
   by the Gibbs identity below; both are independent of the solver.
   at()    — even extension, for u, m, V
   atOdd() — odd  extension, for p = u' and anything built from it            */
const at = (f, j) => { const a = j < 0 ? -j : j; return a < f.length ? f[a] : 0; };
const atOdd = (f, j) => {
  const a = j < 0 ? -j : j;
  if (a >= f.length) return 0;
  return j < 0 ? -f[a] : f[a];
};

/* (f*g)_k for k = 0..K over Z, with declared parities ('e' even, 'o' odd) */
function conv(f, g, K, pf, pg) {
  const gf = pf === 'o' ? atOdd : at, gg = pg === 'o' ? atOdd : at;
  const out = new Float64Array(K + 1);
  const Jf = f.length - 1, Jg = g.length - 1;
  for (let k = 0; k <= K; k++) {
    let s = 0;
    for (let j = -Jf; j <= Jf; j++) {
      const gk = k - j;
      if (gk < -Jg || gk > Jg) continue;
      s += gf(f, j) * gg(g, gk);
    }
    out[k] = s;
  }
  return out;
}

/* p_k = 2πk a_k on the stored band */
function pOf(a) {
  const p = new Float64Array(a.length);
  for (let k = 0; k < a.length; k++) p[k] = TWO_PI * k * a[k];
  return p;
}

/* ---- problem definition ----
   V is given by its (even, real) Fourier coefficients V_k, k = 0..; the default
   is V(x) = A cos(2πx), i.e. V_1 = V_{-1} = A/2. */
function makeProblem({ sigma, c, A, N, Vcoef }) {
  const V = new Float64Array(N + 1);
  if (Vcoef) { for (let k = 0; k < Vcoef.length && k <= N; k++) V[k] = Vcoef[k]; }
  else if (N >= 1) V[1] = A / 2;                 /* A cos(2πx) */
  return { sigma, c, A, N, V };
}

/* unpack/pack the unknown vector x = [rho, a_1..a_N, b_1..b_N] */
function unpack(x, N) {
  const a = new Float64Array(N + 1), b = new Float64Array(N + 1);
  const rho = x[0];
  b[0] = 1;                                       /* ∫m = 1 */
  for (let k = 1; k <= N; k++) { a[k] = x[k]; b[k] = x[N + k]; }
  return { rho, a, b };                           /* a[0] = 0 by construction */
}

/* residual F(x) in R^{2N+1}: [H_0, H_1..H_N, F_1..F_N] */
function residual(x, P) {
  const { sigma, c, N, V } = P;
  const { rho, a, b } = unpack(x, N);
  const p = pOf(a);
  const pp = conv(p, p, N, 'o', 'o');       /* (u')² : odd * odd -> even */
  const bp = conv(b, p, N, 'e', 'o');       /* m u'  : even * odd -> odd  */
  const R = new Float64Array(2 * N + 1);
  R[0] = -0.5 * pp[0] + rho - c * b[0] - V[0];
  for (let k = 1; k <= N; k++) {
    const l = sigma * (TWO_PI * k) * (TWO_PI * k);
    R[k] = l * a[k] - 0.5 * pp[k] - c * b[k] - V[k];
    R[N + k] = l * b[k] + TWO_PI * k * bp[k];
  }
  return R;
}

/* analytic Jacobian DF(x), dense (2N+1)x(2N+1).
   Derivations (m >= 1, symmetric extension so a_{-m} = a_m):
     ∂p_j/∂a_m      = 2πm (δ_{j,m} − δ_{j,−m})
     ∂(p*p)_k/∂a_m  = 4πm ( p_{k−m} − p_{k+m} )
     ∂(b*p)_k/∂a_m  = 2πm ( b_{k−m} − b_{k+m} )
     ∂(b*p)_k/∂b_m  =        p_{k−m} + p_{k+m}                          */
function jacobian(x, P) {
  const { sigma, c, N } = P;
  const { a, b } = unpack(x, N);
  const p = pOf(a);
  const n = 2 * N + 1;
  const J = new Float64Array(n * n);
  const set = (i, j, v) => { J[i * n + j] = v; };

  /* H_0 */
  set(0, 0, 1);                                             /* ∂/∂ρ */
  for (let m = 1; m <= N; m++) {
    set(0, m, -0.5 * 4 * Math.PI * m * (atOdd(p, 0 - m) - atOdd(p, 0 + m)));
    set(0, N + m, 0);                                       /* b_0 is fixed */
  }
  /* H_k, k >= 1 */
  for (let k = 1; k <= N; k++) {
    const l = sigma * (TWO_PI * k) * (TWO_PI * k);
    set(k, 0, 0);
    for (let m = 1; m <= N; m++) {
      let v = -0.5 * 4 * Math.PI * m * (atOdd(p, k - m) - atOdd(p, k + m));
      if (m === k) v += l;
      set(k, m, v);
      set(k, N + m, m === k ? -c : 0);
    }
  }
  /* F_k, k >= 1 */
  for (let k = 1; k <= N; k++) {
    const l = sigma * (TWO_PI * k) * (TWO_PI * k);
    set(N + k, 0, 0);
    for (let m = 1; m <= N; m++) {
      set(N + k, m, TWO_PI * k * (TWO_PI * m) * (at(b, k - m) - at(b, k + m)));
      let v = TWO_PI * k * (atOdd(p, k - m) + atOdd(p, k + m));
      if (m === k) v += l;
      set(N + k, N + m, v);
    }
  }
  return J;
}

/* dense LU solve with partial pivoting (n <= a few hundred) */
function solveLin(M, rhs, n) {
  const A = Float64Array.from(M), x = Float64Array.from(rhs);
  const piv = new Int32Array(n);
  for (let i = 0; i < n; i++) piv[i] = i;
  for (let k = 0; k < n; k++) {
    let pr = k, mx = Math.abs(A[k * n + k]);
    for (let r = k + 1; r < n; r++) { const v = Math.abs(A[r * n + k]); if (v > mx) { mx = v; pr = r; } }
    if (mx === 0) return null;
    if (pr !== k) {
      for (let cc = 0; cc < n; cc++) { const t = A[k * n + cc]; A[k * n + cc] = A[pr * n + cc]; A[pr * n + cc] = t; }
      const t = x[k]; x[k] = x[pr]; x[pr] = t;
    }
    for (let r = k + 1; r < n; r++) {
      const f = A[r * n + k] / A[k * n + k];
      if (f === 0) continue;
      for (let cc = k; cc < n; cc++) A[r * n + cc] -= f * A[k * n + cc];
      x[r] -= f * x[k];
    }
  }
  for (let k = n - 1; k >= 0; k--) {
    let s = x[k];
    for (let cc = k + 1; cc < n; cc++) s -= A[k * n + cc] * x[cc];
    x[k] = s / A[k * n + k];
  }
  return x;
}

/* numerical inverse of a dense n x n matrix, column by column */
function inverse(M, n) {
  const Inv = new Float64Array(n * n), e = new Float64Array(n);
  for (let cIdx = 0; cIdx < n; cIdx++) {
    e.fill(0); e[cIdx] = 1;
    const col = solveLin(M, e, n);
    if (!col) return null;
    for (let r = 0; r < n; r++) Inv[r * n + cIdx] = col[r];
  }
  return Inv;
}

/* Newton from the trivial branch (u = 0, m = 1, ρ = c), which is the EXACT
   solution when V ≡ 0 — so the continuation is from a genuine solution. */
function solve(P, opts) {
  opts = opts || {};
  const { N, c } = P;
  const n = 2 * N + 1;
  let x = new Float64Array(n);
  x[0] = c;
  if (opts.x0) x = Float64Array.from(opts.x0);
  let res = residual(x, P), nrm = Infinity, it = 0;
  const hist = [];
  for (it = 0; it < (opts.maxIter || 60); it++) {
    nrm = 0; for (const v of res) nrm = Math.max(nrm, Math.abs(v));
    hist.push(nrm);
    if (nrm < (opts.tol || 1e-14)) break;
    const J = jacobian(x, P);
    const dx = solveLin(J, res, n);
    if (!dx) return { ok: false, why: 'singular Jacobian', x, hist };
    let damp = 1;
    for (let t = 0; t < 30; t++) {                       /* simple line search */
      const y = Float64Array.from(x);
      for (let i = 0; i < n; i++) y[i] -= damp * dx[i];
      const r2 = residual(y, P);
      let n2 = 0; for (const v of r2) n2 = Math.max(n2, Math.abs(v));
      if (n2 < nrm || damp < 1e-6) { x = y; res = r2; break; }
      damp *= 0.5;
    }
  }
  let fin = 0; for (const v of res) fin = Math.max(fin, Math.abs(v));
  return { ok: fin < (opts.tol || 1e-14) * 1e3, x, res, resNorm: fin, iters: it, hist };
}

/* evaluate u, m on a grid from the coefficients (for plotting only) */
function evalOnGrid(x, P, M) {
  const { N } = P;
  const { a, b } = unpack(x, N);
  const xs = [], us = [], ms = [];
  for (let i = 0; i < M; i++) {
    const t = i / M;
    let u = 0, m = b[0];
    for (let k = 1; k <= N; k++) {
      u += 2 * a[k] * Math.cos(TWO_PI * k * t);
      m += 2 * b[k] * Math.cos(TWO_PI * k * t);
    }
    xs.push(t); us.push(u); ms.push(m);
  }
  return { xs, us, ms };
}

/* Follow a solution branch in the coupling c by natural continuation. The
   non-constant branches past the pitchfork cannot be reached by Newton from
   the constant state — that state is itself a regular solution and attracts —
   so the branch is entered just past the bifurcation, where its amplitude is
   still O(sqrt(c* − c)), and then continued. */
function continueBranch(mk, cFrom, cTo, steps, x0) {
  let x = Float64Array.from(x0), P = mk(cFrom), out = [];
  for (let i = 0; i <= steps; i++) {
    const c = cFrom + (cTo - cFrom) * (i / steps);
    P = mk(c);
    const r = solve(P, { x0: x, maxIter: 200 });
    if (!(r.resNorm < 1e-11)) return { ok: false, why: 'branch lost at c=' + c, out };
    x = r.x;
    out.push({ c, x: Float64Array.from(x), res: r.resNorm });
  }
  return { ok: true, out, x, P };
}

module.exports = {
  TWO_PI, at, atOdd, conv, pOf, continueBranch, makeProblem, unpack,
  residual, jacobian, solveLin, inverse, solve, evalOnGrid
};
