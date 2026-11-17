#!/usr/bin/env node
/* mfg-certify.js — the cert-machine mean-field-game certifier, standalone.

   usage:  node mfg-certify.js '{"sigma":0.5,"c":[-16.03,-15.97],"A":[0.288,0.313]}'
           node mfg-certify.js < claim.json

   Verdicts: MULTIPLE (two exact solutions for EVERY parameter in the cell,
   in two provably disjoint certified balls) / UNIQUE (the monotone half-plane,
   where global uniqueness is Lasry-Lions' and the enclosure is ours) /
   UNDECIDED (with the reason) / REFUTED (mode "refute": no exact solution lies
   within delta of your candidate, and the equation that proves it) / REFUSED.

   Assembled from, and identical to, the repository sources:
     legacy/core/interval/interval.js  sha256 59556ef98bdd25a9f74a9d1b09b6bf8f9f2749fa461f04f4d01e6eecb64a9cd5
     legacy/core/mfg/mfg1d.js  sha256 da026d0638b75e6ab7dbf574387381fbcdee65ecb13277e0935b14e2b81c82a1
     instruments/interval/interval.js  sha256 5b25b6f6039ad303d4457106f1165b85f1ed150344759a1cf92aeba64fca4f2e
     instruments/interval/rational.js  sha256 59e97fc40328adc7866f148d8ee61156810dbbcd890b4361dca697aa58d71920
     instruments/interval/transcendental.js  sha256 7d62c491ab6e79a7873f78111f666eb71924b26cc406a8758b91ebd77ad69b79
     labs/mfg/box.js  sha256 bfa91bd5f5f828cfa628d2d4e40de39d44bcc1562cd25267d06c9d7ad8738a1d
   https://github.com/carlostoledo1891/cert-machine — MIT.
   No dependencies. Nothing is uploaded; there is nothing here that could be. */
'use strict';
/* assembled by labs/mfg/widget.js from the repository sources — do not edit here */
var EqInterval = (function(){var module={exports:{}};var exports=module.exports;var require=function(p){if(/legacy\/core\/interval\/interval\.js$/.test(p))return EqInterval;if(p==="./interval.js")return EqKernel;if(/rational\.js$/.test(p))return EqRational;if(/transcendental\.js$/.test(p))return EqTranscendental;if(/mfg1d\.js$/.test(p))return MFG1D;throw new Error("the bundle does not carry "+p);};var self=undefined;
/* interval.js — outward-rounded interval arithmetic over IEEE-754 doubles.

   RIGOR MODEL, stated once and relied on everywhere downstream. JavaScript has
   no access to the FPU rounding mode, so directed rounding is SIMULATED: every
   IEEE-754 basic operation (+ − × ÷ and sqrt) returns the correctly rounded
   nearest double, so the exact real result lies strictly within half an ulp of
   the computed value. Widening the computed bounds outward by ONE ulp (nextDown
   on the lower end, nextUp on the upper) therefore encloses the exact result.
   This is conservative by a factor of ~2 in the last bit and costs nothing at
   the accuracy we need.

   The library is not trusted on assertion: tests/test-interval.js checks every
   operation against EXACT BigInt rational arithmetic on thousands of random
   operands, and mutation-tests the widening (removing it turns the check red).

   That sentence was FALSE from the day it was written until 2026-07-28: the file it
   names did not exist, and the battery that did cover intervals (test-eqcert.js I2)
   exercises 4 of these exports. `pow` therefore had no coverage and was wrong —
   it returned [1,1] for every negative exponent. The file now exists, runs first in
   `make check-eqcert`, and covers every export. Left as a standing reminder that a cited
   test is not a test: the citation was read as evidence for months.

   Sequence algebra (weighted ell^1_nu, convolution, parity) lives in
   src/sequence.js; this file is arithmetic only.

   MIT licensed. Part of eqcert — the single source of truth for interval
   arithmetic across every project here. Vendored copies are gated
   byte-identical; never edit a copy. */
'use strict';

const _buf = new ArrayBuffer(8);
const _f64 = new Float64Array(_buf);
const _u64 = new BigUint64Array(_buf);

function nextUp(x) {
  if (Number.isNaN(x) || x === Infinity) return x;
  if (x === 0) return Number.MIN_VALUE;
  _f64[0] = x; _u64[0] += (x > 0 ? 1n : -1n); return _f64[0];
}
function nextDown(x) { return -nextUp(-x); }

/* an interval is a 2-array [lo, hi]; `iv(x)` is the thin (point) interval */
const iv = (lo, hi) => [lo, hi === undefined ? lo : hi];
const ZERO = iv(0), ONE = iv(1);

function add(a, b) { return [nextDown(a[0] + b[0]), nextUp(a[1] + b[1])]; }
function sub(a, b) { return [nextDown(a[0] - b[1]), nextUp(a[1] - b[0])]; }
function mul(a, b) {
  const p = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
  return [nextDown(Math.min(p[0], p[1], p[2], p[3])),
          nextUp(Math.max(p[0], p[1], p[2], p[3]))];
}
function div(a, b) {
  if (b[0] <= 0 && b[1] >= 0) throw new Error('interval division by an interval containing 0');
  const q = [a[0] / b[0], a[0] / b[1], a[1] / b[0], a[1] / b[1]];
  return [nextDown(Math.min(q[0], q[1], q[2], q[3])),
          nextUp(Math.max(q[0], q[1], q[2], q[3]))];
}
function neg(a) { return [-a[1], -a[0]]; }
/* A square is never negative, so the lower bound is clamped at 0. Without the clamp,
   sqr([0,0]) returned [-5e-324, 5e-324] — nextDown(0) steps to the smallest negative
   denormal — and a consumer testing `sqr(x)[0] >= 0` to prove non-negativity would be
   defeated by the one case where non-negativity is certain. Clamping only TIGHTENS: 0 is
   a true lower bound for x² always, so enclosure is preserved. The third branch below
   already did this; the first two did not. (2026-07-28, found by tests/test-interval.js.) */
function sqr(a) {                       /* tighter than mul(a,a) across 0 */
  if (a[0] >= 0) return [Math.max(0, nextDown(a[0] * a[0])), nextUp(a[1] * a[1])];
  if (a[1] <= 0) return [Math.max(0, nextDown(a[1] * a[1])), nextUp(a[0] * a[0])];
  const m = Math.max(-a[0], a[1]);
  return [0, nextUp(m * m)];
}
/* |a| as an interval of the modulus, and the scalar sup|a| */
function abs(a) {
  if (a[0] >= 0) return [a[0], a[1]];
  if (a[1] <= 0) return [-a[1], -a[0]];
  return [0, Math.max(-a[0], a[1])];
}
const mag = a => Math.max(Math.abs(a[0]), Math.abs(a[1]));   /* sup |a| */
const mig = a => (a[0] > 0 ? a[0] : a[1] < 0 ? -a[1] : 0);   /* inf |a| */
const contains = (a, x) => a[0] <= x && x <= a[1];
const subset = (a, b) => b[0] <= a[0] && a[1] <= b[1];       /* a ⊆ b */
const interior = (a, b) => b[0] < a[0] && a[1] < b[1];       /* a ⊂ int(b) */
const width = a => nextUp(a[1] - a[0]);

/* Integer power with a rigorous enclosure (repeated squaring).
   NEGATIVE EXPONENTS: `while (e > 0)` never runs for n < 0, so this silently returned
   ONE = [1,1] for every negative n — pow([2,2],-1) claimed to enclose 0.5 and did not.
   A wrong enclosure is worse than a refusal, and this one was silent. n < 0 now goes
   through div, which REFUSES a base straddling 0 (there 1/x is unbounded and no finite
   interval encloses it). Non-integer n is refused rather than truncated: `e >>= 1` would
   have quietly floored it. Found 2026-07-28 with 0 call sites in the tree — a loaded
   trap, not a live wound; every certificate in `ledger/` predates and avoids it. */
function pow(a, n) {
  if (!Number.isInteger(n)) throw new Error('interval pow: exponent must be an integer, got ' + n);
  if (n < 0) return div(ONE, pow(a, -n));
  let r = ONE, base = a, e = n;
  while (e > 0) { if (e & 1) r = mul(r, base); base = mul(base, base); e >>= 1; }
  return r;
}

/* ---------- Stage 2.4 — thin floats and the trigonometric pad ----------
   Math.cos / Math.sin are implementation-approximated with NO ECMAScript accuracy
   bound. The positivity kernels used a remembered ±1e-15 pad that under-covered the
   float mul-chain argument error by ≥16× on the Fourier grids in this monorepo
   (TOPIC B6: measured 1.641e-14). Until a Taylor / Payne–Hanek interval cos ships
   (sound interval exp/log: src/transcendental.js), enclose the float evaluation
   by a DERIVED absolute pad: |d cos/dθ|≤1 and |d sin/dθ|≤1, so
     pad(ang) = 2·ε·|ang| + ε
   dominates a 2-ulp relative argument defect plus one ulp of the result.
   encloseFloat widens a correctly-rounded image of a real (e.g. Math.PI) by one
   ulp each side — the last-ulp thin-scalar hardening for 2π. */
function trigAbsPad(ang) {
  return nextUp(2 * Number.EPSILON * Math.abs(ang) + Number.EPSILON);
}
function encloseCos(ang) {
  const cv = Math.cos(ang), p = trigAbsPad(ang);
  return [nextDown(cv - p), nextUp(cv + p)];
}
function encloseSin(ang) {
  const sv = Math.sin(ang), p = trigAbsPad(ang);
  return [nextDown(sv - p), nextUp(sv + p)];
}
function encloseFloat(x) {
  return [nextDown(x), nextUp(x)];
}

module.exports = {
  nextUp, nextDown, iv, ZERO, ONE,
  add, sub, mul, div, neg, sqr, abs, mag, mig,
  contains, subset, interior, width, pow,
  trigAbsPad, encloseCos, encloseSin, encloseFloat
};

return module.exports;})();
var MFG1D = (function(){var module={exports:{}};var exports=module.exports;var require=function(p){if(/legacy\/core\/interval\/interval\.js$/.test(p))return EqInterval;if(p==="./interval.js")return EqKernel;if(/rational\.js$/.test(p))return EqRational;if(/transcendental\.js$/.test(p))return EqTranscendental;if(/mfg1d\.js$/.test(p))return MFG1D;throw new Error("the bundle does not carry "+p);};var self=undefined;
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

return module.exports;})();
var EqKernel = (function(){var module={exports:{}};var exports=module.exports;var require=function(p){if(/legacy\/core\/interval\/interval\.js$/.test(p))return EqInterval;if(p==="./interval.js")return EqKernel;if(/rational\.js$/.test(p))return EqRational;if(/transcendental\.js$/.test(p))return EqTranscendental;if(/mfg1d\.js$/.test(p))return MFG1D;throw new Error("the bundle does not carry "+p);};var self=undefined;
/* interval.js — outward-rounded interval arithmetic over IEEE-754 doubles.

   RIGOR MODEL, stated once and relied on everywhere downstream. JavaScript has
   no access to the FPU rounding mode, so directed rounding is SIMULATED: every
   IEEE-754 basic operation (+ − × ÷ and sqrt) returns the correctly rounded
   nearest double, so the exact real result lies strictly within half an ulp of
   the computed value. Widening the computed bounds outward by ONE ulp (nextDown
   on the lower end, nextUp on the upper) therefore encloses the exact result.
   This is conservative by a factor of ~2 in the last bit and costs nothing at
   the accuracy we need.

   The library is not trusted on assertion: tests/test-interval.js checks every
   operation against EXACT BigInt rational arithmetic on thousands of random
   operands, and mutation-tests the widening (removing it turns the check red).

   That sentence was FALSE from the day it was written until 2026-07-28: the file it
   names did not exist, and the battery that did cover intervals (test-eqcert.js I2)
   exercises 4 of these exports. `pow` therefore had no coverage and was wrong —
   it returned [1,1] for every negative exponent. The file now exists, runs first in
   `make check-eqcert`, and covers every export. Left as a standing reminder that a cited
   test is not a test: the citation was read as evidence for months.

   Sequence algebra (weighted ell^1_nu, convolution, parity) lives in
   src/sequence.js; this file is arithmetic only.

   MIT licensed. Part of eqcert — the single source of truth for interval
   arithmetic across every project here. Vendored copies are gated
   byte-identical; never edit a copy. */
'use strict';

const _buf = new ArrayBuffer(8);
const _f64 = new Float64Array(_buf);
const _u64 = new BigUint64Array(_buf);

function nextUp(x) {
  if (Number.isNaN(x) || x === Infinity) return x;
  if (x === 0) return Number.MIN_VALUE;
  _f64[0] = x; _u64[0] += (x > 0 ? 1n : -1n); return _f64[0];
}
function nextDown(x) { return -nextUp(-x); }

/* an interval is a 2-array [lo, hi]; `iv(x)` is the thin (point) interval */
const iv = (lo, hi) => [lo, hi === undefined ? lo : hi];
const ZERO = iv(0), ONE = iv(1);

/* THE DOMAIN, ENFORCED (2026-10-09). The rigor model above is a statement about
   finite, well-formed operands: a pair of non-NaN doubles with lo <= hi, where an
   infinite endpoint is a sound (if useless) bound. Before this date nothing checked
   it: mul([0, Infinity], [0, 1]) returned [NaN, NaN], div by [NaN, NaN] was not
   refused (NaN fails the straddle test), and a consumer written as
   `if (!(x[1] > c)) proved` would have certified on a NaN. The batteries skipped
   non-finite results and so never saw it. Every arithmetic operation now refuses a
   malformed operand or an indeterminate result (0·∞, ∞−∞) by THROW — a refusal,
   never a decision — and the method paper states this domain beside its rounding
   proposition. Cost: a few comparisons per operation. */
function wf(a, op) {
  if (!Array.isArray(a) || a.length !== 2 || typeof a[0] !== 'number' || typeof a[1] !== 'number'
      || Number.isNaN(a[0]) || Number.isNaN(a[1]) || a[0] > a[1])
    throw new Error('interval ' + op + ': malformed operand ' + JSON.stringify(a) + ' — refused, not decided');
  return a;
}
function out(r, op) {
  if (Number.isNaN(r[0]) || Number.isNaN(r[1]))
    throw new Error('interval ' + op + ': indeterminate result (0·∞ or ∞−∞) — refused, not decided');
  return r;
}

function add(a, b) { wf(a, 'add'); wf(b, 'add'); return out([nextDown(a[0] + b[0]), nextUp(a[1] + b[1])], 'add'); }
function sub(a, b) { wf(a, 'sub'); wf(b, 'sub'); return out([nextDown(a[0] - b[1]), nextUp(a[1] - b[0])], 'sub'); }
function mul(a, b) {
  wf(a, 'mul'); wf(b, 'mul');
  const p = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
  return out([nextDown(Math.min(p[0], p[1], p[2], p[3])),
              nextUp(Math.max(p[0], p[1], p[2], p[3]))], 'mul');
}
function div(a, b) {
  wf(a, 'div'); wf(b, 'div');
  if (b[0] <= 0 && b[1] >= 0) throw new Error('interval division by an interval containing 0');
  const q = [a[0] / b[0], a[0] / b[1], a[1] / b[0], a[1] / b[1]];
  return out([nextDown(Math.min(q[0], q[1], q[2], q[3])),
              nextUp(Math.max(q[0], q[1], q[2], q[3]))], 'div');
}
function neg(a) { return [-a[1], -a[0]]; }
/* A square is never negative, so the lower bound is clamped at 0. Without the clamp,
   sqr([0,0]) returned [-5e-324, 5e-324] — nextDown(0) steps to the smallest negative
   denormal — and a consumer testing `sqr(x)[0] >= 0` to prove non-negativity would be
   defeated by the one case where non-negativity is certain. Clamping only TIGHTENS: 0 is
   a true lower bound for x² always, so enclosure is preserved. The third branch below
   already did this; the first two did not. (2026-07-28, found by tests/test-interval.js.) */
function sqr(a) {                       /* tighter than mul(a,a) across 0 */
  wf(a, 'sqr');
  if (a[0] >= 0) return [Math.max(0, nextDown(a[0] * a[0])), nextUp(a[1] * a[1])];
  if (a[1] <= 0) return [Math.max(0, nextDown(a[1] * a[1])), nextUp(a[0] * a[0])];
  const m = Math.max(-a[0], a[1]);
  return [0, nextUp(m * m)];
}
/* |a| as an interval of the modulus, and the scalar sup|a| */
function abs(a) {
  if (a[0] >= 0) return [a[0], a[1]];
  if (a[1] <= 0) return [-a[1], -a[0]];
  return [0, Math.max(-a[0], a[1])];
}
const mag = a => Math.max(Math.abs(a[0]), Math.abs(a[1]));   /* sup |a| */
const mig = a => (a[0] > 0 ? a[0] : a[1] < 0 ? -a[1] : 0);   /* inf |a| */
/* MEMBERSHIP HOLDS REALS ONLY (2026-11-16). Until this date contains(a, x) answered a[0] <= x && x <= a[1], so ±∞
   was a member of any interval with that infinite end: isMember(±∞, [entire]) came back true where IEEE 1788 says
   false (certs/kernel-itf1788.json, two violations found 2026-10-27). No enclosure was affected, every caller passes a
   finite point; the answer is now false for ±∞ and for NaN. */
const contains = (a, x) => Number.isFinite(x) && a[0] <= x && x <= a[1];
const subset = (a, b) => b[0] <= a[0] && a[1] <= b[1];       /* a ⊆ b */
const interior = (a, b) => b[0] < a[0] && a[1] < b[1];       /* a ⊂ int(b) */
const width = a => nextUp(a[1] - a[0]);

/* Integer power with a rigorous enclosure (repeated squaring).
   NEGATIVE EXPONENTS: `while (e > 0)` never runs for n < 0, so this silently returned
   ONE = [1,1] for every negative n — pow([2,2],-1) claimed to enclose 0.5 and did not.
   A wrong enclosure is worse than a refusal, and this one was silent. n < 0 now goes
   through div, which REFUSES a base straddling 0 (there 1/x is unbounded and no finite
   interval encloses it). Non-integer n is refused rather than truncated: `e >>= 1` would
   have quietly floored it. Found 2026-07-28 with 0 call sites in the tree — a loaded
   trap, not a live wound; every certificate in `ledger/` predates and avoids it. */
function pow(a, n) {
  if (!Number.isInteger(n)) throw new Error('interval pow: exponent must be an integer, got ' + n);
  /* `e & 1` and `e >>= 1` are 32-bit operations: pow([1,2], 2^31) returned [1,1] and
     pow([2,2], 2^53) returned [1,1] — silently, like the negative-exponent trap above.
     Found 2026-10-09 by a code read, with 0 call sites beyond exponents 2 and 3. Refused. */
  if (Math.abs(n) >= 2147483648) throw new Error('interval pow: exponent ' + n + ' is beyond 2^31 — refused (32-bit exponent arithmetic)');
  if (n < 0) return div(ONE, pow(a, -n));
  wf(a, 'pow');
  let r = ONE, base = a, e = n;
  while (e > 0) { if (e & 1) r = mul(r, base); base = mul(base, base); e >>= 1; }
  return r;
}

/* ---------- Stage 2.4 — thin floats ----------
   encloseFloat widens a correctly-rounded image of a real (e.g. Math.PI) by one
   ulp each side — the last-ulp thin-scalar hardening for 2π.

   THE PADDED PLATFORM COS/SIN, RETIRED (2026-11-16). encloseCos / encloseSin /
   trigAbsPad enclosed Math.cos / Math.sin — which ECMAScript gives NO accuracy
   bound — by a derived pad of 2·ε·|ang| + ε, under an unwritten contract that the
   argument carried at most 2 ulp of relative error. They are gone from the kernel:
   every caller now uses the proved series sin / cos of transcendental.js (a
   remainder after reduction by an enclosure of π/2, interval arguments, extrema
   inside a box enclosed), which the Arb audit covers. */
function encloseFloat(x) {
  return [nextDown(x), nextUp(x)];
}

module.exports = {
  nextUp, nextDown, iv, ZERO, ONE, wf,
  add, sub, mul, div, neg, sqr, abs, mag, mig,
  contains, subset, interior, width, pow,
  encloseFloat
};

return module.exports;})();
var EqRational = (function(){var module={exports:{}};var exports=module.exports;var require=function(p){if(/legacy\/core\/interval\/interval\.js$/.test(p))return EqInterval;if(p==="./interval.js")return EqKernel;if(/rational\.js$/.test(p))return EqRational;if(/transcendental\.js$/.test(p))return EqTranscendental;if(/mfg1d\.js$/.test(p))return MFG1D;throw new Error("the bundle does not carry "+p);};var self=undefined;
/* rational.js — exact arithmetic over BigInt fractions.

   Why this exists next to interval arithmetic rather than instead of it: the
   two answer different questions, and choosing the wrong one silently weakens
   a certificate.

     · INTERVAL arithmetic bounds a quantity you cannot compute exactly. It is
       the right tool when the problem is genuinely nonlinear (a Krawczyk
       enclosure, a radii polynomial).
     · EXACT arithmetic DECIDES. It is the right tool when the data is rational
       and the question is a sign — and it is the ONLY tool when the answer is
       a tie, because no interval method can ever decide whether a quantity is
       exactly zero.

   That distinction was learned, not designed. Certifying a multi-population
   Wardrop equilibrium, an unused edge turned out to carry a slack of exactly
   zero — an unused route exactly as short as the used ones. Interval
   arithmetic returned −1.6e−12 and could not conclude; exact rational
   arithmetic settled it immediately. Weak complementarity is invisible to
   floating point and to intervals alike.

   Every finite double is exactly m·2^e, so `fromDouble` is lossless and the
   bridge between the two worlds is exact in that direction.

   MIT licensed. Part of eqcert. */
'use strict';

function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; }

/* canonical: denominator > 0, reduced */
function R(n, d) {
  n = BigInt(n); d = d === undefined ? 1n : BigInt(d);
  if (d === 0n) throw new Error('rational: zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}
const ZERO = R(0n), ONE = R(1n);

/* every finite double is exactly m·2^e — this conversion loses nothing */
function fromDouble(x) {
  if (!Number.isFinite(x)) throw new Error('rational: non-finite double');
  let e = 0n, y = x;
  while (!Number.isInteger(y)) { y *= 2; e += 1n; if (e > 1200n) throw new Error('rational: conversion did not terminate'); }
  return R(BigInt(y), 1n << e);
}

const add = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => R(a.n * b.n, a.d * b.d);
const div = (a, b) => { if (b.n === 0n) throw new Error('rational: division by zero'); return R(a.n * b.d, a.d * b.n); };
const neg = a => R(-a.n, a.d);
const sign = a => (a.n < 0n ? -1 : a.n > 0n ? 1 : 0);
const cmp = (a, b) => { const l = a.n * b.d, r = b.n * a.d; return l < r ? -1 : l > r ? 1 : 0; };
const isZero = a => a.n === 0n;
const abs = a => (a.n < 0n ? neg(a) : a);

/* a double that is >= (resp <=) the exact value — for reporting only.
   Number(n)/Number(d) overflows on large heights, so scale first. */
function toDouble(a) {
  if (a.n === 0n) return 0;
  const sign = (a.n < 0n) !== (a.d < 0n) ? -1 : 1;
  const N = a.n < 0n ? -a.n : a.n;
  const D = a.d < 0n ? -a.d : a.d;
  const bn = N.toString(2).length, bd = D.toString(2).length;
  if (bn < 1000 && bd < 1000) return sign * (Number(N) / Number(D));
  const shift = BigInt(Math.max(bn, bd) - 1000);
  return sign * (Number(N >> shift) / Number(D >> shift));
}
const toString = a => (a.d === 1n ? a.n.toString() : a.n + '/' + a.d);

/* is the exact value inside the closed float interval [lo, hi]? */
const inClosed = (a, lo, hi) => cmp(fromDouble(lo), a) <= 0 && cmp(a, fromDouble(hi)) <= 0;

/* ---- exact dense linear algebra (Gaussian elimination, no pivoting error) ----
   Returns null iff the matrix is EXACTLY singular — which is information, not
   a failure: a singular exact system is a proof of degeneracy, whereas a small
   float determinant is only a suspicion. */
function solve(A, b, n) {
  A = A.map(r => r.slice()); b = b.slice();
  for (let k = 0; k < n; k++) {
    let p = -1;
    for (let r = k; r < n; r++) if (sign(A[r][k]) !== 0) { p = r; break; }
    if (p < 0) return null;
    if (p !== k) { const t = A[k]; A[k] = A[p]; A[p] = t; const tb = b[k]; b[k] = b[p]; b[p] = tb; }
    for (let r = k + 1; r < n; r++) {
      if (sign(A[r][k]) === 0) continue;
      const f = div(A[r][k], A[k][k]);
      for (let c = k; c < n; c++) A[r][c] = sub(A[r][c], mul(f, A[k][c]));
      b[r] = sub(b[r], mul(f, b[k]));
    }
  }
  const x = new Array(n).fill(ZERO);
  for (let k = n - 1; k >= 0; k--) {
    let s = b[k];
    for (let c = k + 1; c < n; c++) s = sub(s, mul(A[k][c], x[c]));
    x[k] = div(s, A[k][k]);
  }
  return x;
}

/* residual of A x − b, exactly. Zero here is a proof, not a tolerance. */
function residual(A, x, b, n) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = ZERO;
    for (let j = 0; j < n; j++) if (sign(A[i][j]) !== 0) s = add(s, mul(A[i][j], x[j]));
    out[i] = sub(s, b[i]);
  }
  return out;
}
const allZero = v => v.every(isZero);

module.exports = {
  R, ZERO, ONE, fromDouble, toDouble, toString,
  add, sub, mul, div, neg, abs, sign, cmp, isZero, inClosed,
  solve, residual, allZero, gcd
};

return module.exports;})();
var EqTranscendental = (function(){var module={exports:{}};var exports=module.exports;var require=function(p){if(/legacy\/core\/interval\/interval\.js$/.test(p))return EqInterval;if(p==="./interval.js")return EqKernel;if(/rational\.js$/.test(p))return EqRational;if(/transcendental\.js$/.test(p))return EqTranscendental;if(/mfg1d\.js$/.test(p))return MFG1D;throw new Error("the bundle does not carry "+p);};var self=undefined;
/* transcendental.js — sound interval exp / log / sin / cos / tanh.

   WHY THIS FILE EXISTS. PLAN.md §5.3 once said JS cannot soundly enclose
   transcendentals without Rust. core/interval/tests/probe-transcendental.js measured
   the opposite: a truncated series with a rigorous remainder, evaluated inside
   the already-validated interval model, produces a valid enclosure. Rust still
   buys tightness, speed, and a cross-language witness — not soundness.

   RIGOR. Every returned interval must CONTAIN the true real value. Containment
   is checked in tests/test-transcendental.js against independent exact-rational
   brackets (and red controls that omit the tail bound). Bad domains refuse by
   throw — never a silent wrong box.

   SCOPE (closed list). exp, log, sin, cos, tanh. Named consumers:
   attention-geometry / softmax H/PR enclose (exp/log); edge-of-chaos /
   aerospace / Path 5 (sin/cos/tanh). No fractional pow until a battery demands it.
   See research/interval-transcendentals.html.

   MIT licensed. Part of eqcert. */
'use strict';

const I = require('./interval.js');
const Q = require('./rational.js');
const { iv, add, sub, mul, div, neg, ONE, ZERO, nextUp, nextDown } = I;

const _buf = new ArrayBuffer(8);
const _f64 = new Float64Array(_buf);
const _u64 = new BigUint64Array(_buf);

const EXP_TERMS = 24;
const LOG_TERMS = 40;
const LN2_SERIES_TERMS = 48;
const TRIG_TERMS = 16;
const PI_ARCTAN_TERMS = 40;
const TANH_SAT = 20;

function qpowInt(a, n) {
  let r = Q.ONE;
  for (let i = 0; i < n; i++) r = Q.mul(r, a);
  return r;
}

function qToIv(loQ, hiQ) {
  let lo = Q.toDouble(loQ), hi = Q.toDouble(hiQ);
  while (Q.cmp(Q.fromDouble(lo), loQ) > 0) lo = nextDown(lo);
  while (Q.cmp(Q.fromDouble(hi), hiQ) < 0) hi = nextUp(hi);
  return iv(lo, hi);
}

/* ln(2) = 2 Σ_{k=0}^∞ 1/((2k+1) 3^{2k+1}), with a geometric remainder bound. */
function ln2Interval() {
  let sum = Q.ZERO;
  for (let k = 0; k < LN2_SERIES_TERMS; k++) {
    const odd = 2 * k + 1;
    const denom = Q.mul(Q.R(odd), qpowInt(Q.R(3), odd));
    sum = Q.add(sum, Q.div(Q.ONE, denom));
  }
  sum = Q.mul(Q.R(2), sum);
  const K = LN2_SERIES_TERMS;
  const oddK = 2 * K + 1;
  const rem = Q.div(Q.mul(Q.R(2), Q.R(9)), Q.mul(qpowInt(Q.R(3), oddK), Q.R(8)));
  return qToIv(Q.sub(sum, rem), Q.add(sum, rem));
}

const LN2 = ln2Interval();

/* arctan(u) for 0 < u < 1: Σ (-1)^k u^{2k+1}/(2k+1), |R| < u^{2K+1}/(2K+1). */
function arctanPosQ(uNum, uDen, terms) {
  const U = Q.div(Q.R(uNum), Q.R(uDen));
  let sum = Q.ZERO;
  let pow = U;
  const U2 = Q.mul(U, U);
  for (let k = 0; k < terms; k++) {
    const term = Q.div(pow, Q.R(2 * k + 1));
    sum = (k % 2 === 0) ? Q.add(sum, term) : Q.sub(sum, term);
    pow = Q.mul(pow, U2);
  }
  const rem = Q.div(pow, Q.R(2 * terms + 1));
  return [Q.sub(sum, rem), Q.add(sum, rem)];
}

/* Machin: π/4 = 4 arctan(1/5) − arctan(1/239). */
function piInterval() {
  const [aLo, aHi] = arctanPosQ(1, 5, PI_ARCTAN_TERMS);
  const [bLo, bHi] = arctanPosQ(1, 239, PI_ARCTAN_TERMS);
  const fourALo = Q.mul(Q.R(4), aLo);
  const fourAHi = Q.mul(Q.R(4), aHi);
  const qLo = Q.mul(Q.R(4), Q.sub(fourALo, bHi));
  const qHi = Q.mul(Q.R(4), Q.sub(fourAHi, bLo));
  return qToIv(qLo, qHi);
}

const PI = piInterval();
const TWO_PI = mul(iv(2), PI);
const HALF_PI = div(PI, iv(2));

/* Exact split x = m · 2^e for positive finite normals, m ∈ [1, 2). */
function splitPow2(x) {
  if (!(x > 0) || !Number.isFinite(x)) {
    throw new Error('transcendental: splitPow2 needs positive finite, got ' + x);
  }
  _f64[0] = x;
  let bits = _u64[0];
  const eBits = Number((bits >> 52n) & 0x7ffn);
  if (eBits === 0 || eBits === 2047) {
    throw new Error('transcendental: splitPow2 refuses subnormal/non-finite');
  }
  const e = eBits - 1023;
  bits = (bits & 0x800fffffffffffffn) | (1023n << 52n);
  _u64[0] = bits;
  return { m: _f64[0], e };
}

/* exp on a thin/narrow interval: x = k ln2 + r with |r| < 1, Taylor + tail. */
function expNarrow(X) {
  if (!(X[0] <= X[1]) || !Number.isFinite(X[0]) || !Number.isFinite(X[1])) {
    throw new Error('transcendental.exp: non-finite or inverted interval');
  }
  const mid = (X[0] + X[1]) / 2;
  const k = Math.round(mid / 0.6931471805599453);
  const r = sub(X, mul(iv(k), LN2));
  const rmag = Math.max(Math.abs(r[0]), Math.abs(r[1]));
  if (!(rmag < 1)) {
    throw new Error('transcendental.exp: argument reduction left |r|=' + rmag + ' >= 1');
  }
  let sum = ONE, term = ONE;
  for (let n = 1; n <= EXP_TERMS; n++) {
    term = div(mul(term, r), iv(n));
    sum = add(sum, term);
  }
  /* the tail |r|^{25}/25! · (1 − |r|/26)^{-1}, every operation outward (2026-10-21; it was round-to-nearest with one nextUp,
     sound only by the margin below the ulp of the sum — debt of 2026-09-04, paid) */
  let fact = ONE, p = ONE;
  for (let n = 1; n <= EXP_TERMS + 1; n++) { fact = mul(fact, iv(n)); p = mul(p, iv(rmag)); }
  const tail = div(p, mul(fact, sub(ONE, div(iv(rmag), iv(EXP_TERMS + 2)))))[1];
  sum = add(sum, iv(-tail, tail));
  if (k > 1023 || k < -1074) {
    throw new Error('transcendental.exp: 2^k out of finite range, k=' + k);
  }
  return mul(sum, iv(Math.pow(2, k)));
}

/** Interval exponential. Monotone ⇒ wide boxes use endpoint enclosures. */
function exp(X) {
  if (!Array.isArray(X) || X.length !== 2) X = iv(X);
  if (X[1] - X[0] > 1e-6) {
    return [expNarrow(iv(X[0]))[0], expNarrow(iv(X[1]))[1]];
  }
  return expNarrow(X);
}

function logMantissa(m) {
  if (m === 1) return ZERO;
  if (!(m >= 1 && m < 2)) {
    throw new Error('transcendental.logMantissa: need m in [1,2), got ' + m);
  }
  const V = div(sub(iv(m), ONE), add(iv(m), ONE));
  const vmax = Math.max(Math.abs(V[0]), Math.abs(V[1]));
  if (!(vmax < 0.34)) {
    throw new Error('transcendental.logMantissa: |v|=' + vmax + ' not in [0,1/3)');
  }
  let sum = ZERO;
  let vpow = V;
  const V2 = mul(V, V);
  for (let k = 0; k < LOG_TERMS; k++) {
    const odd = 2 * k + 1;
    sum = add(sum, div(vpow, iv(odd)));
    vpow = mul(vpow, V2);
  }
  /* the one-sided tail v^{2N+1} / ((2N+1)(1 − v²)), every operation outward (2026-10-21) */
  let p = ONE;
  for (let n = 0; n < 2 * LOG_TERMS + 1; n++) p = mul(p, iv(vmax));
  const denom = mul(iv(2 * LOG_TERMS + 1), sub(ONE, mul(iv(vmax), iv(vmax))));
  const tail = div(p, denom)[1];
  return mul(iv(2), add(sum, iv(0, tail)));
}

function logPoint(x) {
  if (!(x > 0) || !Number.isFinite(x)) {
    throw new Error('transcendental.log: need positive finite, got ' + x);
  }
  if (x === 1) return ZERO;
  const { m, e } = splitPow2(x);
  const lm = logMantissa(m);
  if (e === 0) return lm;
  return add(lm, mul(iv(e), LN2));
}

/** Interval natural log. Domain: lo > 0. Monotone ⇒ endpoints. */
function log(X) {
  if (!Array.isArray(X) || X.length !== 2) X = iv(X);
  if (!(X[0] > 0) || !(X[1] > 0) || !(X[0] <= X[1])) {
    throw new Error('transcendental.log: need positive interval, got [' + X[0] + ',' + X[1] + ']');
  }
  return [logPoint(X[0])[0], logPoint(X[1])[1]];
}

/* Taylor sin/cos on a box with |x| ≤ 2 (covers reduced [-π/2, π/2]).
   |R_n| ≤ |x|^{n+1}/(n+1)! since |f^{(n+1)}| ≤ 1. */
function sinSeries(X) {
  const rmag = Math.max(Math.abs(X[0]), Math.abs(X[1]));
  if (!(rmag <= 2)) {
    throw new Error('transcendental.sinSeries: |x|=' + rmag + ' > 2');
  }
  let sum = ZERO, term = X;
  for (let n = 0; n < TRIG_TERMS; n++) {
    sum = add(sum, term);
    const k = 2 * n + 2;
    term = neg(div(mul(term, mul(X, X)), iv(k * (k + 1))));
  }
  let fact = ONE, p = ONE;
  const deg = 2 * TRIG_TERMS + 1;
  for (let n = 1; n <= deg; n++) { fact = mul(fact, iv(n)); p = mul(p, iv(rmag)); }   /* outward (2026-10-21) */
  const tail = div(p, fact)[1];
  return add(sum, iv(-tail, tail));
}

function cosSeries(X) {
  const rmag = Math.max(Math.abs(X[0]), Math.abs(X[1]));
  if (!(rmag <= 2)) {
    throw new Error('transcendental.cosSeries: |x|=' + rmag + ' > 2');
  }
  let sum = ONE, term = ONE;
  for (let n = 0; n < TRIG_TERMS; n++) {
    const k = 2 * n + 1;
    term = neg(div(mul(term, mul(X, X)), iv(k * (k + 1))));
    sum = add(sum, term);
  }
  let fact = ONE, p = ONE;
  const deg = 2 * TRIG_TERMS + 2;
  for (let n = 1; n <= deg; n++) { fact = mul(fact, iv(n)); p = mul(p, iv(rmag)); }   /* outward (2026-10-21) */
  const tail = div(p, fact)[1];
  return add(sum, iv(-tail, tail));
}

/** Reduce x = n·(π/2) + r with |r| ≲ π/4…π/2; return series args + quadrant n mod 4.
   Quadrant table (n mod 4):
     0: sin=sin r,  cos=cos r
     1: sin=cos r,  cos=−sin r
     2: sin=−sin r, cos=−cos r
     3: sin=−cos r, cos=sin r */
function reduceTrigPoint(x) {
  if (!Number.isFinite(x)) {
    throw new Error('transcendental.reduce: non-finite angle');
  }
  const halfPiMid = (HALF_PI[0] + HALF_PI[1]) / 2;
  const n = Math.round(x / halfPiMid);
  const r = sub(iv(x), mul(iv(n), HALF_PI));
  const rmag = Math.max(Math.abs(r[0]), Math.abs(r[1]));
  if (!(rmag <= HALF_PI[1] + 0.02)) {
    throw new Error('transcendental.reduce: |r|=' + rmag + ' after n=' + n);
  }
  return { r, q: ((n % 4) + 4) % 4 };
}

function sinPoint(x) {
  if (x === 0) return ZERO;
  const { r, q } = reduceTrigPoint(x);
  const s = sinSeries(r), c = cosSeries(r);
  if (q === 0) return s;
  if (q === 1) return c;
  if (q === 2) return neg(s);
  return neg(c);
}

function cosPoint(x) {
  if (x === 0) return ONE;
  const { r, q } = reduceTrigPoint(x);
  const s = sinSeries(r), c = cosSeries(r);
  if (q === 0) return c;
  if (q === 1) return neg(s);
  if (q === 2) return neg(c);
  return s;
}

/* Enclosure of 3*pi/2, outward-rounded, for the sin minimum. */
const THREE_HALF_PI = [nextDown(PI[0] + HALF_PI[0]), nextUp(PI[1] + HALF_PI[1])];

/** Might [a,b] contain a real of the form BASE + k*2pi for some integer k?
 *
 *  CONSERVATIVE BY CONSTRUCTION: it may answer true when the critical point is
 *  merely near the box, and must NEVER answer false when one is inside. A false
 *  positive only widens the result; a false negative makes it unsound. Every
 *  candidate phase is built as an interval and pushed outward one ulp before the
 *  overlap test, and the k window carries one extra step on each side, so the
 *  error can only ever land on the safe side. */
function containsPhase(a, b, BASE) {
  if (b - a >= TWO_PI[0]) return true;
  const kLo = Math.floor((a - BASE[1]) / TWO_PI[0]) - 1;
  const kHi = Math.ceil((b - BASE[0]) / TWO_PI[0]) + 1;
  if (!Number.isFinite(kLo) || !Number.isFinite(kHi)) return true;   /* refuse to guess */
  for (let k = kLo; k <= kHi; k++) {
    /* enclosure of BASE + k*2pi; multiplying by a negative k swaps the bounds */
    const lo = k >= 0 ? BASE[0] + k * TWO_PI[0] : BASE[0] + k * TWO_PI[1];
    const hi = k >= 0 ? BASE[1] + k * TWO_PI[1] : BASE[1] + k * TWO_PI[0];
    if (nextUp(hi) >= a && nextDown(lo) <= b) return true;
  }
  return false;
}

/** Interval sin — a true enclosure over the whole box.
 *
 *  REWRITTEN 2026-08-08. Both previous branches were UNSOUND, and the file's own
 *  header ("Every returned interval must CONTAIN the true real value") was the
 *  claim they broke:
 *
 *    narrow (width <= 1e-6)  returned sinPoint(midpoint) — an enclosure of sin at
 *                            ONE POINT, not over the box. sin([1,1+1e-9]) came back
 *                            strictly INSIDE the true range, missing both endpoints.
 *    wide                    hulled the two endpoints and only widened to [-1,1]
 *                            when the width exceeded pi/2. But a critical point
 *                            needs no such width to sit inside: sin([1,2]) returned
 *                            [0.8415, 0.9093] while the true maximum is 1 at pi/2.
 *
 *  Why the battery never caught it: T10 tests sin(iv(x)) for SCALAR x — degenerate
 *  boxes, where the midpoint IS the whole interval and sinPoint is trivially right.
 *  The suite exercised D1 (accepts correct) and never D3 (rejects wrong), which is
 *  the exact failure research/evidence-first-bench measures in other people's
 *  suites. See tests/test-transcendental-enclosure.js, written with this fix.
 *
 *  Now: hull the endpoint enclosures, then force the bound to +/-1 whenever a
 *  critical point may lie inside. Monotone boxes stay tight; boxes straddling an
 *  extremum widen to the truth instead of reporting the chord. */
function sin(X) {
  if (!Array.isArray(X) || X.length !== 2) X = iv(X);
  if (!(X[0] <= X[1]) || !Number.isFinite(X[0]) || !Number.isFinite(X[1])) {
    throw new Error('transcendental.sin: bad interval');
  }
  if (X[1] - X[0] >= TWO_PI[0]) return iv(-1, 1);
  const a = sinPoint(X[0]), b = sinPoint(X[1]);
  let lo = Math.min(a[0], b[0]), hi = Math.max(a[1], b[1]);
  if (containsPhase(X[0], X[1], HALF_PI)) hi = 1;            /* sin = +1 */
  if (containsPhase(X[0], X[1], THREE_HALF_PI)) lo = -1;     /* sin = -1 */
  return iv(Math.max(-1, lo), Math.min(1, hi));
}

/** Interval cos. Same rewrite, same reasons; extrema at 2k*pi and pi + 2k*pi. */
function cos(X) {
  if (!Array.isArray(X) || X.length !== 2) X = iv(X);
  if (!(X[0] <= X[1]) || !Number.isFinite(X[0]) || !Number.isFinite(X[1])) {
    throw new Error('transcendental.cos: bad interval');
  }
  if (X[1] - X[0] >= TWO_PI[0]) return iv(-1, 1);
  const a = cosPoint(X[0]), b = cosPoint(X[1]);
  let lo = Math.min(a[0], b[0]), hi = Math.max(a[1], b[1]);
  if (containsPhase(X[0], X[1], [0, 0])) hi = 1;             /* cos = +1 */
  if (containsPhase(X[0], X[1], PI)) lo = -1;                /* cos = -1 */
  return iv(Math.max(-1, lo), Math.min(1, hi));
}

function tanhPoint(x) {
  if (!Number.isFinite(x)) {
    throw new Error('transcendental.tanh: non-finite');
  }
  if (x === 0) return ZERO;
  if (x < 0) return neg(tanhPoint(-x));
  if (x >= TANH_SAT) {
    /* 0 < 1 − tanh(x) = 2/(e^{2x}+1) < 2 e^{-2x} ≤ 2 e^{-40} < 4e-17 */
    const gap = nextUp(4e-17);
    return iv(nextDown(1 - gap), 1);
  }
  const E = exp(iv(2 * x));
  return div(sub(E, ONE), add(E, ONE));
}

/** Interval tanh. Odd, strictly increasing ⇒ endpoints. */
function tanh(X) {
  if (!Array.isArray(X) || X.length !== 2) X = iv(X);
  if (!(X[0] <= X[1]) || !Number.isFinite(X[0]) || !Number.isFinite(X[1])) {
    throw new Error('transcendental.tanh: bad interval');
  }
  return [tanhPoint(X[0])[0], tanhPoint(X[1])[1]];
}

module.exports = {
  exp, log, logPoint, sin, cos, tanh,
  LN2, PI, HALF_PI, TWO_PI,
  splitPow2, EXP_TERMS, LOG_TERMS, TRIG_TERMS
};

return module.exports;})();
var MFGBox = (function(){var module={exports:{}};var exports=module.exports;var require=function(p){if(/legacy\/core\/interval\/interval\.js$/.test(p))return EqInterval;if(p==="./interval.js")return EqKernel;if(/rational\.js$/.test(p))return EqRational;if(/transcendental\.js$/.test(p))return EqTranscendental;if(/mfg1d\.js$/.test(p))return MFG1D;throw new Error("the bundle does not carry "+p);};var self=undefined;
/* box.js — UNIFORM-OVER-A-PARAMETER-BOX validation for the stationary
   quadratic mean-field game, with a tangent predictor.

   WHAT IS NEW HERE. The lifted kernel (legacy/core/mfg/validate.js) proves, for
   ONE parameter triple s = (sigma, c, A):

       there exists an exact solution x* with ||x* - xbar|| <= r,
       and it is the only solution in that ball.

   This file proves the same sentence with a quantifier in front of it:

       for EVERY s in the box S, there exists an exact solution x*(s) with
       ||x*(s) - xbar(s)|| <= r, and it is the only solution in that ball,

   where xbar(s) is an explicit AFFINE predictor through the box. One solve, one
   radius, a whole rectangle of parameters. That upgrade is what turns the
   mfg-cap point result into a MAP: two disjoint box-certificates over the same
   cell prove multiplicity for every parameter in the cell, so a picture of the
   parameter plane can be partitioned with nothing unproved between the samples.

   WHY THE PREDICTOR IS NOT OPTIONAL. With a FIXED candidate, Y0 = ||A Phi_s(xbar)||
   grows linearly in the cell width h, and the radii polynomial needs
   2 Z2 Y0 < (1 - Z1)^2, so admissible cells shrink like 1/||A||^2 — measured on
   the multiplicity branch at c = -12, that is h < 0.004, a hairline, not a map.
   Carrying the tangent xdot (DPhi xdot = -d_s Phi, one linear solve per
   direction, reusing the Jacobian already factored for A) makes the first-order
   term cancel and leaves Y0 = O(h^2). The bound used is the mean-value form

       ||A Phi_s(xbar(s))||  <=  ||A Phi_s0(xbar(s0))||
                                 + sum_dir h_dir * sup_S || A d_dir[ Phi(xbar) ] ||,

   which is rigorous because Phi is a polynomial and S is a box, so the whole
   segment [s0, s] lies in S. The second term is evaluated in interval
   arithmetic over S; it vanishes at s0 by the choice of xdot, hence is itself
   O(h), hence the product is O(h^2).

   TWO THINGS TO WATCH, both handled explicitly below:
     (1) A must be a FIXED linear operator, or "I - A DPhi" is not one operator
         at all. So A is built once at the box midpoint: the dense inverse A_N of
         the midpoint Jacobian, and the tail diagonal 1/(sigma0 2 pi k) with
         sigma0 the MIDPOINT sigma.
     (2) Because of (1) the tail of I - A DPhi no longer cancels: at row k it
         carries 1 - sigma/sigma0, which does NOT decay in k. That term is the
         honest price of a wide sigma box and it is added to Z1 by hand in the
         analytic tail bound (explicit columns pick it up automatically).

   AT ZERO WIDTH this file must reproduce validate.js EXACTLY -- same Y0, Z1, Z2,
   same radius, same kappa, same verdict, bit for bit. That is not a hope, it is
   battery.js check G1, re-run at every build of the page. Two implementations of
   one argument WILL diverge unless something fires when they do.

   MIT licensed. Part of cert-machine (labs/mfg). */
'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../legacy/core/interval/interval.js'),
                             require('../../legacy/core/mfg/mfg1d.js'),
                             require('../../instruments/interval/transcendental.js'));
  } else {
    root.MFGBox = factory(root.EqInterval, root.MFG1D, root.EqTranscendental);
  }
})(typeof self !== 'undefined' ? self : this, function (I, M1D, T) {

const { iv, add, sub, mul, div, neg, abs, mag, mig, ZERO, ONE } = I;
const TWO_PI = 2 * Math.PI;
const TWO_PI_I = I.encloseFloat(TWO_PI);
const TWO_PI_HI = TWO_PI_I[1];

function wNuI(nu, k) {                       /* nu^k, never a thin Math.pow */
  if (k === 0) return ONE;
  let r = I.encloseFloat(nu);
  for (let i = 1; i < k; i++) r = mul(r, I.encloseFloat(nu));
  return mul(iv(2), r);
}
const IDX = K => ({
  n: 2 * K + 1, K, rho: 0, p: k => k, b: k => K + k,
  weight: (j, nu) => (j === 0 ? 1 : 2 * Math.pow(nu, j <= K ? j : j - K))
});

const atE = (f, j) => { const a = j < 0 ? -j : j; return a < f.length ? f[a] : ZERO; };
const atO = (f, j) => {
  const a = j < 0 ? -j : j;
  if (a >= f.length) return ZERO;
  return j < 0 ? neg(f[a]) : f[a];
};
function convI(f, g, K, pf, pg) {
  const gf = pf === 'o' ? atO : atE, gg = pg === 'o' ? atO : atE;
  const out = new Array(K + 1);
  const Jf = f.length - 1, Jg = g.length - 1;
  for (let k = 0; k <= K; k++) {
    let s = ZERO;
    for (let j = -Jf; j <= Jf; j++) {
      const t = k - j;
      if (t < -Jg || t > Jg) continue;
      s = add(s, mul(gf(f, j), gg(g, t)));
    }
    out[k] = s;
  }
  return out;
}
function normNu(f, nu, hasZero) {
  let s = hasZero ? abs(f[0]) : ZERO;
  let nk = ONE;
  const nuI = iv(nu);
  for (let k = 1; k < f.length; k++) { nk = mul(nk, nuI); s = add(s, mul(iv(2), mul(abs(f[k]), nk))); }
  return s;
}

/* ---- the box ------------------------------------------------------------
   box = { sigma:[lo,hi], c:[lo,hi], A:[lo,hi], N }; a thin box is [t,t].
   V(x) = A cos 2 pi x, so V_1 = A/2 and every other coefficient is zero.   */
const mid = t => 0.5 * (t[0] + t[1]);
const half = t => 0.5 * (t[1] - t[0]);
function midProblem(box) {
  return M1D.makeProblem({ sigma: mid(box.sigma), c: mid(box.c), A: mid(box.A), N: box.N });
}
/* halving is EXACT in binary floating point, so V_1 needs no outward pad and a
   thin A box stays thin -- which is what makes gate G1 an equality. */
function VboxI(box) {
  const V = new Array(box.N + 1).fill(ZERO);
  if (box.N >= 1) V[1] = iv(box.A[0] / 2, box.A[1] / 2);
  return V;
}

/* Phi over intervals: H rows k = 0..K, F rows k = 1..K */
function buildPhiI(xb, SIG, C, V, K) {
  const pp = convI(xb.p, xb.p, K, 'o', 'o');
  const bp = convI(xb.b, xb.p, K, 'e', 'o');
  const H = new Array(K + 1), F = new Array(K + 1);
  const Vi = k => (k < V.length ? V[k] : ZERO);
  const lam = k => mul(SIG, mul(TWO_PI_I, iv(k)));
  H[0] = add(sub(mul(iv(-0.5), pp[0]), mul(C, xb.b[0])), sub(xb.rho, Vi(0)));
  F[0] = ZERO;
  for (let k = 1; k <= K; k++) {
    H[k] = sub(sub(mul(lam(k), atO(xb.p, k)), mul(iv(0.5), pp[k])),
               add(mul(C, atE(xb.b, k)), Vi(k)));
    F[k] = add(mul(lam(k), atE(xb.b, k)), bp[k]);
  }
  return { H, F };
}

/* a row of DPhi over intervals */
function dRowI(type, k, xb, SIG, C, K) {
  const row = { rho: ZERO, p: new Array(K + 1).fill(ZERO), b: new Array(K + 1).fill(ZERO) };
  const lam = mul(SIG, mul(TWO_PI_I, iv(k)));
  if (type === 'H' && k === 0) {
    row.rho = ONE;
    for (let m = 1; m <= K; m++) row.p[m] = mul(iv(2), atO(xb.p, m));
    return row;
  }
  if (type === 'H') {
    for (let m = 1; m <= K; m++) {
      let v = neg(sub(atO(xb.p, k - m), atO(xb.p, k + m)));
      if (m === k) v = add(v, lam);
      row.p[m] = v;
      row.b[m] = (m === k) ? neg(C) : ZERO;
    }
    return row;
  }
  for (let m = 1; m <= K; m++) {
    row.p[m] = sub(atE(xb.b, k - m), atE(xb.b, k + m));
    let v = add(atO(xb.p, k - m), atO(xb.p, k + m));
    if (m === k) v = add(v, lam);
    row.b[m] = v;
  }
  return row;
}

/* DPhi(x) applied to a direction d = {rho, p[], b[]} (d_b0 = 0, b_0 is fixed):
     row H_0 : d_rho - (p * d_p)_0
     row H_k : sigma(2 pi k) d_p,k - (p * d_p)_k - c d_b,k
     row F_k : sigma(2 pi k) d_b,k + (b * d_p)_k + (d_b * p)_k                */
function dPhiApply(xb, d, SIG, C, K) {
  const pdp = convI(xb.p, d.p, K, 'o', 'o');
  const bdp = convI(xb.b, d.p, K, 'e', 'o');
  const dbp = convI(d.b, xb.p, K, 'e', 'o');
  const H = new Array(K + 1), F = new Array(K + 1);
  const lam = k => mul(SIG, mul(TWO_PI_I, iv(k)));
  H[0] = sub(d.rho, pdp[0]); F[0] = ZERO;
  for (let k = 1; k <= K; k++) {
    H[k] = sub(sub(mul(lam(k), atO(d.p, k)), pdp[k]), mul(C, atE(d.b, k)));
    F[k] = add(mul(lam(k), atE(d.b, k)), add(bdp[k], dbp[k]));
  }
  return { H, F };
}

/* d/d(dir) of Phi at fixed x — the parameter derivative
     c     : H_0 = -b_0 = -1,  H_k = -b_k,          F_k = 0
     sigma : H_0 = 0,          H_k = (2 pi k) p_k,  F_k = (2 pi k) b_k
     A     : H_1 = -1/2,       everything else 0     (V_1 = A/2)             */
function dParamPhi(dir, xb, K) {
  const H = new Array(K + 1).fill(ZERO), F = new Array(K + 1).fill(ZERO);
  if (dir === 'c') {
    H[0] = neg(xb.b[0]);
    for (let k = 1; k <= K; k++) H[k] = neg(atE(xb.b, k));
  } else if (dir === 'sigma') {
    for (let k = 1; k <= K; k++) {
      const tk = mul(TWO_PI_I, iv(k));
      H[k] = mul(tk, atO(xb.p, k));
      F[k] = mul(tk, atE(xb.b, k));
    }
  } else if (dir === 'A') {
    if (K >= 1) H[1] = iv(-0.5);
  }
  return { H, F };
}

/* ---- the validation, uniform over the box ------------------------------- */
function validateBox(xFloat, box, opts) {
  opts = opts || {};
  const N = box.N;
  const nu = opts.nu || 1.05;
  const KC = opts.KC || 3 * N;
  const KR = KC + N;
  if (!(box.sigma[0] > 0)) return { ok: false, why: 'sigma box must be strictly positive' };
  const SIG = iv(box.sigma[0], box.sigma[1]), C = iv(box.c[0], box.c[1]);
  const V = VboxI(box);
  const sigma0 = mid(box.sigma), c0 = mid(box.c), A0 = mid(box.A);
  const SIG0 = iv(sigma0), C0 = iv(c0);
  const V0 = VboxI({ N, A: [A0, A0] });
  const hs = { sigma: half(box.sigma), c: half(box.c), A: half(box.A) };
  const L = IDX(N), n = L.n;

  /* the candidate at the midpoint, in (rho, p, b), thin */
  const un = M1D.unpack(xFloat, N);
  const p0 = new Array(N + 1).fill(ZERO), b0 = new Array(N + 1).fill(ZERO);
  b0[0] = ONE;
  for (let k = 1; k <= N; k++) { p0[k] = mul(TWO_PI_I, iv(k * un.a[k])); b0[k] = iv(un.b[k]); }
  const xb0 = { rho: iv(un.rho), p: p0, b: b0 };

  /* A, part 1: the dense inverse of the MIDPOINT Jacobian on indices <= N */
  const Jf = new Float64Array(n * n);
  for (let k = 0; k <= N; k++) {
    const rowH = dRowI('H', k, xb0, SIG0, C0, N);
    const ri = (k === 0) ? 0 : L.p(k);
    Jf[ri * n + 0] = rowH.rho[0];
    for (let m = 1; m <= N; m++) { Jf[ri * n + L.p(m)] = rowH.p[m][0]; Jf[ri * n + L.b(m)] = rowH.b[m][0]; }
    if (k >= 1) {
      const rowF = dRowI('F', k, xb0, SIG0, C0, N);
      const rj = L.b(k);
      Jf[rj * n + 0] = rowF.rho[0];
      for (let m = 1; m <= N; m++) { Jf[rj * n + L.p(m)] = rowF.p[m][0]; Jf[rj * n + L.b(m)] = rowF.b[m][0]; }
    }
  }
  const AN = M1D.inverse(Jf, n);
  if (!AN) return { ok: false, why: 'midpoint Jacobian numerically singular' };
  /* A, part 2: the tail diagonal, at the MIDPOINT sigma (A must not vary over S) */
  const tailInv = k => div(ONE, mul(SIG0, mul(TWO_PI_I, iv(k))));

  /* ||A v|| for a row vector v given as H (k = 0..K) and F (k = 1..K) */
  function ANorm(H, F, K) {
    const rvec = new Array(n).fill(ZERO);
    rvec[0] = H[0];
    for (let k = 1; k <= N; k++) { rvec[L.p(k)] = H[k]; rvec[L.b(k)] = F[k]; }
    let s = ZERO;
    for (let i = 0; i < n; i++) {
      let acc = ZERO;
      for (let j = 0; j < n; j++) acc = add(acc, mul(iv(AN[i * n + j]), rvec[j]));
      s = add(s, mul(iv(L.weight(i, nu)), abs(acc)));
    }
    for (let k = N + 1; k <= K; k++) {
      const w = wNuI(nu, k);
      s = add(s, mul(w, abs(mul(tailInv(k), H[k]))));
      s = add(s, mul(w, abs(mul(tailInv(k), F[k]))));
    }
    return s;
  }

  /* ---- the tangent predictor: DPhi xdot = -d_dir Phi, one solve per live
     direction, reusing the factored midpoint Jacobian. A direction with zero
     width gets no tangent (and costs nothing).                             */
  const dirs = ['sigma', 'c', 'A'].filter(d => hs[d] > 0);
  const xdot = {};
  /* opts.freezePredictor sets every tangent to zero, which is exactly the
     FIXED-candidate bound the literature's single-point argument gives when it
     is pointed at a box. It exists so the battery can turn the predictor off
     and require the same cell to fail: a trick nobody can switch off is a trick
     nobody has measured. */
  for (const dir of dirs) {
    if (opts.freezePredictor) {
      xdot[dir] = { rho: ZERO, p: new Array(N + 1).fill(ZERO), b: new Array(N + 1).fill(ZERO) };
      continue;
    }
    const g = dParamPhi(dir, xb0, N);
    const rhs = new Float64Array(n);
    rhs[0] = -g.H[0][0];
    for (let k = 1; k <= N; k++) { rhs[L.p(k)] = -g.H[k][0]; rhs[L.b(k)] = -g.F[k][0]; }
    const z = M1D.solveLin(Jf, rhs, n);
    if (!z) return { ok: false, why: 'tangent solve failed (midpoint Jacobian singular)' };
    const d = { rho: iv(z[0]), p: new Array(N + 1).fill(ZERO), b: new Array(N + 1).fill(ZERO) };
    for (let k = 1; k <= N; k++) { d.p[k] = iv(z[L.p(k)]); d.b[k] = iv(z[L.b(k)]); }
    xdot[dir] = d;
  }

  /* the predictor over the box: xbar(s) = x0 + sum_dir (s_dir - s0_dir) xdot_dir */
  const xb = { rho: xb0.rho, p: p0.slice(), b: b0.slice() };
  for (const dir of dirs) {
    const t = iv(-hs[dir], hs[dir]), d = xdot[dir];
    xb.rho = add(xb.rho, mul(t, d.rho));
    for (let k = 1; k <= N; k++) { xb.p[k] = add(xb.p[k], mul(t, d.p[k])); xb.b[k] = add(xb.b[k], mul(t, d.b[k])); }
  }

  const normP = normNu(xb.p, nu, false);
  const normB = normNu(xb.b, nu, true);

  /* ---- Y0: centre term + mean-value term in each live direction ---- */
  let Y0;
  {
    const Phi0 = buildPhiI(xb0, SIG0, C0, V0, 2 * N);
    Y0 = ANorm(Phi0.H, Phi0.F, 2 * N);
    for (const dir of dirs) {
      /* d_dir [ Phi_s(xbar(s)) ] = DPhi_s(xbar(s)) xdot_dir + d_dir Phi(xbar(s)),
         enclosed over the whole box; it vanishes at the midpoint by the choice
         of xdot, so this whole term is O(h) and its product with h is O(h^2). */
      const a1 = dPhiApply(xb, xdot[dir], SIG, C, 2 * N);
      const a2 = dParamPhi(dir, xb, 2 * N);
      const H = new Array(2 * N + 1), F = new Array(2 * N + 1);
      for (let k = 0; k <= 2 * N; k++) { H[k] = add(a1.H[k], a2.H[k]); F[k] = add(a1.F[k] || ZERO, a2.F[k] || ZERO); }
      Y0 = add(Y0, mul(iv(hs[dir]), ANorm(H, F, 2 * N)));
    }
  }

  /* ---- Z1 = sup_S || I - A DPhi(xbar(s)) || (max over columns) ---- */
  let Z1 = ZERO, worstCol = null;
  {
    const rowsH = [], rowsF = [];
    for (let k = 0; k <= KR; k++) {
      rowsH.push(dRowI('H', k, xb, SIG, C, KC));
      rowsF.push(k >= 1 ? dRowI('F', k, xb, SIG, C, KC) : null);
    }
    const colNorm = (kind, m) => {
      const entH = new Array(KR + 1).fill(ZERO), entF = new Array(KR + 1).fill(ZERO);
      for (let k = 0; k <= KR; k++) {
        if (kind === 'rho') { entH[k] = (k === 0) ? ONE : ZERO; }
        else if (kind === 'p') { entH[k] = rowsH[k].p[m] || ZERO; if (k >= 1) entF[k] = rowsF[k].p[m] || ZERO; }
        else { entH[k] = rowsH[k].b[m] || ZERO; if (k >= 1) entF[k] = rowsF[k].b[m] || ZERO; }
      }
      const fin = new Array(n).fill(ZERO);
      fin[0] = entH[0];
      for (let k = 1; k <= N; k++) { fin[L.p(k)] = entH[k]; fin[L.b(k)] = entF[k]; }
      const out = new Array(n).fill(ZERO);
      for (let i = 0; i < n; i++) {
        let acc = ZERO;
        for (let jj = 0; jj < n; jj++) acc = add(acc, mul(iv(AN[i * n + jj]), fin[jj]));
        out[i] = acc;
      }
      const jIdx = kind === 'rho' ? 0 : (kind === 'p' ? (m <= N ? L.p(m) : -1) : (m <= N ? L.b(m) : -1));
      let s = ZERO;
      for (let i = 0; i < n; i++) {
        const e = (i === jIdx) ? ONE : ZERO;
        s = add(s, mul(iv(L.weight(i, nu)), abs(sub(e, out[i]))));
      }
      for (let k = N + 1; k <= KR; k++) {
        const w = wNuI(nu, k);
        const eH = (kind === 'p' && m === k) ? ONE : ZERO;
        const eF = (kind === 'b' && m === k) ? ONE : ZERO;
        s = add(s, mul(w, abs(sub(eH, mul(tailInv(k), entH[k])))));
        s = add(s, mul(w, abs(sub(eF, mul(tailInv(k), entF[k])))));
      }
      return div(s, kind === 'rho' ? ONE : wNuI(nu, m));
    };
    const cand = [['rho', 0]];
    for (let m = 1; m <= KC; m++) { cand.push(['p', m]); cand.push(['b', m]); }
    for (const [kind, m] of cand) {
      const v = colNorm(kind, m);
      if (v[1] > mag(Z1)) { Z1 = v; worstCol = kind + (kind === 'rho' ? '' : '_' + m); }
    }
    /* columns m > KC: A acts as the midpoint diagonal there, so
         (I - A DPhi) e_m = (1 - sigma/sigma0) e_m - (quadratic part)/(sigma0 2 pi k).
       The first term is the price of the sigma box and does NOT decay in k; the
       second is the lifted kernel's bound, with sigma0 in the denominator
       because that is the operator actually applied. */
    const diagDefect = mag(sub(ONE, div(SIG, SIG0)));
    const pert = Math.max(mag(add(normP, normB)), mag(add(abs(C), normP)));
    const denom = mul(SIG0, mul(TWO_PI_I, iv(KC + 1 - N)));
    const tailAnalytic = I.nextUp(diagDefect + mag(div(iv(pert), denom)));
    if (tailAnalytic > mag(Z1)) { Z1 = iv(tailAnalytic); worstCol = 'tail(analytic)'; }
  }

  /* ---- Z2 = 2||A||. Phi is quadratic in x and its x-quadratic part carries no
     parameter, so DPhi(x) - DPhi(y) is parameter-free: Z2 does not see the box. */
  let Z2;
  {
    let anorm = 0;
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let i = 0; i < n; i++) s = I.nextUp(s + L.weight(i, nu) * Math.abs(AN[i * n + j]));
      const v = I.nextUp(s / L.weight(j, nu));
      if (v > anorm) anorm = v;
    }
    const tailA = 1 / (sigma0 * TWO_PI * (N + 1));
    Z2 = iv(I.nextUp(2 * Math.max(anorm, tailA)));
  }

  /* ---- the radii polynomial, then the contraction factor ---- */
  const y0 = mag(Y0), z1 = mag(Z1), z2 = mag(Z2);
  const res = { N, nu, KC, dirs: dirs.slice(),
                box: { sigma: box.sigma.slice(), c: box.c.slice(), A: box.A.slice() },
                Y0: y0, Z1: z1, Z2: z2, worstCol };
  if (!(z1 < 1)) return Object.assign(res, { ok: false, why: 'Z1 >= 1 over the box — the midpoint inverse does not control the whole cell' });
  const disc = (1 - z1) * (1 - z1) - 2 * z2 * y0;
  if (!(disc > 0)) return Object.assign(res, { ok: false, why: 'discriminant <= 0 — no radius closes the contraction over the box' });
  const sq = Math.sqrt(disc);
  const rMin = I.nextUp(((1 - z1) - sq) / z2);
  const rMax = I.nextDown(((1 - z1) + sq) / z2);
  const pOf = rr => { const R = iv(rr); return add(sub(mul(mul(iv(0.5), Z2), mul(R, R)), mul(sub(ONE, Z1), R)), Y0); };
  let rStar = rMin, found = false;
  for (let t = 0; t < 400; t++) {
    if (rStar > rMax) break;
    if (pOf(rStar)[1] < 0) { found = true; break; }
    rStar = I.nextUp(rStar * 1.05 + Number.MIN_VALUE);
  }
  if (!found) return Object.assign(res, { ok: false, why: 'no radius verified p(r) < 0 in interval arithmetic', rMin, rMax });
  const kappa = add(Z1, mul(Z2, iv(rStar)));
  if (!(kappa[1] < 1)) {
    return Object.assign(res, { ok: false, r: rStar, kappa: kappa[1], rMin, rMax,
      why: 'contraction factor Z1 + Z2 r >= 1 at the smallest admissible radius — T is a self-map but not a contraction' });
  }
  return Object.assign(res, { ok: true, rMin, rMax, r: rStar, pAtR: pOf(rStar)[1], kappa: kappa[1], disc,
                              tangents: dirs.reduce((o, d) => (o[d] = { rho: xdot[d].rho[0],
                                p: xdot[d].p.map(z => z[0]), b: xdot[d].b.map(z => z[0]) }, o), {}),
                              predictor: { rho: [xb.rho[0], xb.rho[1]],
                                           p: xb.p.map(z => [z[0], z[1]]),
                                           b: xb.b.map(z => [z[0], z[1]]) } });
}

/* ---- positivity of the density over the WHOLE enclosure, over the WHOLE box.
   The nu-norm dominates ell^1, which dominates the sup norm, so
       sup_x |m(x) - mbar(x)| <= r,
   and a rigorous lower bound on min mbar over the box, minus r, bounds min m
   below for every parameter in the cell. min mbar is bounded by sampling and
   paying the modulus of continuity with L = sum_k 2 (2 pi k) |b_k| -- no
   sampling argument is left unquantified. m > 0 is a HYPOTHESIS of the model,
   so it is certified, never assumed. At zero width this agrees with
   validate.js's certifyPositivity on L, G and the verdict, and on minMbar to
   within the old pad (gate G2): validate.js still pads the platform's cosine,
   this file no longer does.

   THE COSINES ARE PROVED (2026-11-16). Until this date each cos(2 pi k t) was
   Math.cos of the float angle TWO_PI*k*t widened by a derived pad (the kernel's
   encloseCos, now retired): ECMAScript gives Math.cos no accuracy bound, so the
   pad rested on an unwritten contract. Now every cosine is transcendental.js's
   series enclosure (Lemma S1.3: reduction by an enclosure of pi/2, a remainder
   bound), at the angle 2 pi (j/G) enclosed outward, with j = (k g) mod G:
   cos(2 pi k g/G) = cos(2 pi j/G) exactly, because k g - j is a multiple of G.
   One table per grid size serves every mode and every call (cosGrid below);
   the reduced angle lies in [0, 2 pi), which also keeps it tight.           */
const COS_GRID = new Map();
function cosGrid(G) {
  let tab = COS_GRID.get(G);
  if (!tab) {
    const lo = new Float64Array(G), hi = new Float64Array(G), Gi = iv(G);
    for (let j = 0; j < G; j++) {
      const c = T.cos(mul(T.TWO_PI, div(iv(j), Gi)));
      lo[j] = c[0]; hi[j] = c[1];
    }
    tab = { lo, hi };
    COS_GRID.set(G, tab);
  }
  return tab;
}
function boxPositivity(bI, N, r, G) {
  let L = 0;
  for (let k = 1; k <= N; k++) L = I.nextUp(L + 2 * TWO_PI_HI * k * mag(bI[k]));
  G = G || 4096;
  if (!(Number.isInteger(G) && G > 0 && N * G < 2 ** 53)) throw new Error('boxPositivity: the grid size must be a positive integer, got ' + G);
  let lo = Infinity, guard = 0;
  for (;;) {
    lo = Infinity;
    const tab = cosGrid(G);
    for (let g = 0; g < G; g++) {
      let m = iv(1);
      for (let k = 1; k <= N; k++) {
        const j = (k * g) % G;                                 /* exact: k g < 2^53 */
        const ci = [tab.lo[j], tab.hi[j]];
        m = add(m, mul([2 * bI[k][0], 2 * bI[k][1]], ci));   /* doubling is exact */
      }
      if (m[0] < lo) lo = m[0];
    }
    const slack = I.nextUp(L / (2 * G));
    if (slack < 0.25 * Math.abs(lo) || G >= (1 << 21) || ++guard > 12) break;
    G *= 4;
  }
  const minMbar = I.nextDown(lo - I.nextUp(L / (2 * G)));
  const minM = I.nextDown(minMbar - r);
  return { minMbar, minM, positive: minM > 0, L, G };
}

/* ---- separation: a rigorous LOWER bound on ||xbar1(s) - xbar2(s)||_nu, valid
   for EVERY s in the cell. Weights w(rho) = 1, w(p_k) = w(b_k) = 2 nu^k, as in
   validate.js. Each coefficient difference is an interval (the two predictors
   move with s); mig() takes the smallest modulus it can have, and every step
   rounds DOWN, because the multiplicity claim needs the separation to be at
   least this large.                                                         */
function separationBox(v1, v2, N, nu) {
  const dr = sub(v1.rho, v2.rho);
  let s = mig(dr), nk = 1;
  for (let k = 1; k <= N; k++) {
    nk = I.nextDown(nk * nu);
    const dp = mig(sub(v1.p[k], v2.p[k]));       /* already in p = u' coordinates */
    const db = mig(sub(v1.b[k], v2.b[k]));
    s = I.nextDown(s + I.nextDown(2 * nk * dp));
    s = I.nextDown(s + I.nextDown(2 * nk * db));
  }
  /* nextDown(0) steps to a negative denormal, and a NORM is never negative:
     clamping at 0 only TIGHTENS a lower bound, so the enclosure survives. Same
     lesson as sqr() in the interval library's own header. */
  return Math.max(0, s);
}
/* the same for two plain float candidates (thin cell) — the (rho, a, b) form
   the solver returns, matching test-cap.js's M1 exactly. */
function separationNu(x1, x2, N, nu) {
  const u1 = M1D.unpack(x1, N), u2 = M1D.unpack(x2, N);
  let s = Math.abs(u1.rho - u2.rho), nk = 1;
  for (let k = 1; k <= N; k++) {
    nk = I.nextDown(nk * nu);
    s = I.nextDown(s + I.nextDown(2 * nk * Math.abs(TWO_PI * k * u1.a[k] - TWO_PI * k * u2.a[k])));
    s = I.nextDown(s + I.nextDown(2 * nk * Math.abs(u1.b[k] - u2.b[k])));
  }
  return s;
}

/* ---- REFUTATION: no exact solution within delta of a claimed equilibrium ---
   Given a candidate x (Fourier coefficients, exactly as the model stores them)
   and a claimed accuracy delta in the nu-norm, this decides the NEGATIVE
   statement. For any y with ||y - x||_nu <= delta and any single equation j,

       |Phi_j(y)|  >=  |Phi_j(x)|  -  L_j * delta,      L_j := max_i |DPhi_j,i| / w_i

   (the dual norm of the row, over the whole ball and the whole parameter box).
   So one equation whose residual exceeds its own row bound times delta REFUTES
   the claim outright: no exact solution of the system lies that close, whatever
   the rest of the vector does. The witness is that equation, its enclosed
   residual, and its row bound -- checkable by hand.

   This is the direction a solver can never give you. A residual near zero is
   evidence; a residual provably too large is a proof.                        */
function refuteCandidate(xFloat, box, delta, opts) {
  opts = opts || {};
  const N = box.N, nu = opts.nu || 1.05;
  if (!(delta > 0)) return { verdict: 'REFUSED', reason: 'delta must be a positive number' };
  if (!(box.sigma[0] > 0)) return { verdict: 'REFUSED', reason: 'sigma must be strictly positive' };
  const SIG = iv(box.sigma[0], box.sigma[1]), C = iv(box.c[0], box.c[1]), V = VboxI(box);
  const un = M1D.unpack(xFloat, N);
  const p0 = new Array(N + 1).fill(ZERO), b0 = new Array(N + 1).fill(ZERO);
  b0[0] = ONE;
  for (let k = 1; k <= N; k++) { p0[k] = mul(TWO_PI_I, iv(k * un.a[k])); b0[k] = iv(un.b[k]); }
  /* the ball itself: every coefficient may move by delta/w_i, so enclose it */
  const D = iv(-delta, delta);
  const ball = { rho: add(iv(un.rho), D), p: p0.slice(), b: b0.slice() };
  for (let k = 1; k <= N; k++) {
    const wk = div(D, wNuI(nu, k));
    ball.p[k] = add(ball.p[k], wk); ball.b[k] = add(ball.b[k], wk);
  }
  const xb = { rho: iv(un.rho), p: p0, b: b0 };
  const Phi = buildPhiI(xb, SIG, C, V, 2 * N);
  const rowBound = (type, k) => {
    const KK = k + N + 1;
    const row = dRowI(type, k, ball, SIG, C, KK);
    let L = mag(row.rho);                                  /* w(rho) = 1 */
    for (let m = 1; m <= KK; m++) {
      const w = wNuI(nu, m);
      L = Math.max(L, mag(div(row.p[m], w)), mag(div(row.b[m], w)));
    }
    return L;
  };
  let best = null;
  for (let k = 0; k <= 2 * N; k++) {
    for (const type of (k === 0 ? ['H'] : ['H', 'F'])) {
      const v = type === 'H' ? Phi.H[k] : Phi.F[k];
      const lo = mig(v);                                   /* |Phi_j(x)| from below */
      if (!(lo > 0)) continue;
      const L = k <= N ? rowBound(type, k) : mag(mul(SIG, mul(TWO_PI_I, iv(k))));
      const margin = I.nextDown(lo - I.nextUp(L * delta));
      if (margin > 0 && (!best || margin > best.margin)) {
        best = { equation: type + '_' + k, residual: lo, rowBound: L, margin };
      }
    }
  }
  if (best) {
    return { verdict: 'REFUTED', mechanism: Object.assign({ kind: 'residual_exceeds_row_bound', delta, nu }, best),
      statement: 'no exact solution of this MFG lies within ' + delta + ' (nu-weighted ell^1, nu = ' + nu
        + ') of the pasted candidate: equation ' + best.equation + ' has |Phi| >= ' + best.residual.toExponential(6)
        + ' while the whole ball can move it by at most ' + I.nextUp(best.rowBound * delta).toExponential(6) + '.' };
  }
  return { verdict: 'REFUSED',
    reason: 'no single equation exceeds its own row bound at delta = ' + delta
      + ' — this candidate is not refuted at that accuracy (which is NOT a certificate that it is right; '
      + 'run the certifier for that)' };
}

/* ---- THE CELL DECISION, self-contained -----------------------------------
   ONE definition, used by the sweep (labs/mfg/regime.js) and by the in-browser
   paste box (labs/mfg/widget.js). Both branches are re-derived from scratch
   here -- no atlas, no remembered candidate -- so the answer depends on nothing
   but the cell you hand it:

     aligned  the continuation of the constant state (u = 0, m = 1, rho = c),
              which is the EXACT solution at A = 0; continued up in A.
     herding  born at the pitchfork c* = -sigma^2 (2 pi)^2, continued down in c
              at A = 0, then up in A.

   Verdicts:
     MULTIPLE   both branches certified over the cell, balls provably disjoint,
                both densities positive: at least two exact solutions for EVERY
                parameter in the cell.
     UNIQUE     the cell lies in c >= 0, where Lasry-Lions gives GLOBAL
                uniqueness [cited, not proved here], and our certificate
                encloses that solution uniformly over the cell.
     UNDECIDED  everything else, reason kept verbatim.                       */
function seedAligned(box) {
  const cm = mid(box.c), am = mid(box.A), sg = mid(box.sigma), N = box.N;
  let x = new Float64Array(2 * N + 1); x[0] = cm;
  const steps = Math.max(1, Math.ceil(am / 0.05));
  for (let i = 1; i <= steps; i++) {
    const r = M1D.solve(M1D.makeProblem({ sigma: sg, c: cm, A: am * i / steps, N }), { x0: x, maxIter: 300 });
    if (!(r.resNorm < 1e-11)) return seedDirect(box);   /* the branch folded — try a cold start */
    x = r.x;
  }
  return x;
}
/* Above the fold the constant-state continuation dies, but solutions still
   exist there (measured: at c = -12, A >= 1.1 a branch with b_1 < 0, the
   density peaked AWAY from the potential minimum). A cold Newton from a few
   structured starts finds one; which seeding produced a certificate is recorded
   on the cell, because a reader is entitled to know how the candidate was
   reached even though only the certificate decides anything. */
function seedDirect(box) {
  const cm = mid(box.c), am = mid(box.A), sg = mid(box.sigma), N = box.N;
  const P = M1D.makeProblem({ sigma: sg, c: cm, A: am, N });
  for (const [p1, b1] of [[0, 0], [-0.2, 0.2], [0.4, -0.4], [-0.6, 0.6], [0.8, -0.8]]) {
    const x = new Float64Array(2 * N + 1);
    x[0] = cm; x[1] = p1; x[N + 1] = b1;
    const r = M1D.solve(P, { x0: x, maxIter: 500 });
    if (r.resNorm < 1e-11) return r.x;
  }
  return null;
}
/* a supplied warm start is always re-solved AT the cell midpoint before it is
   used, so a stale seed cannot smuggle in a candidate for the wrong parameters */
function refine(x0, box) {
  const P = M1D.makeProblem({ sigma: mid(box.sigma), c: mid(box.c), A: mid(box.A), N: box.N });
  const r = M1D.solve(P, { x0, maxIter: 400 });
  return r.resNorm < 1e-11 ? r.x : null;
}
function seedHerding(box) {
  const cm = mid(box.c), am = mid(box.A), sg = mid(box.sigma), N = box.N;
  const cStar = -(sg * sg) * TWO_PI * TWO_PI;
  if (!(cm < cStar)) return null;                    /* the branch is not born yet */
  const cEnter = cStar - 0.25;                       /* just past the pitchfork, where the branch amplitude is still O(sqrt(c*-c)) */
  const seed = new Float64Array(2 * N + 1);
  seed[0] = cEnter; seed[1] = -sg * 0.35; seed[N + 1] = 0.35;
  const st = M1D.solve(M1D.makeProblem({ sigma: sg, c: cEnter, A: 0, N }), { x0: seed, maxIter: 400 });
  if (!(st.resNorm < 1e-11)) return null;
  const steps = Math.max(8, Math.ceil(Math.abs(cEnter - cm) / 0.25));
  const br = M1D.continueBranch(c => M1D.makeProblem({ sigma: sg, c, A: 0, N }), cEnter, cm, steps, st.x);
  if (!br.ok) return null;
  let x = br.x;
  const as = Math.max(1, Math.ceil(am / 0.05));
  for (let i = 1; i <= as; i++) {
    const r = M1D.solve(M1D.makeProblem({ sigma: sg, c: cm, A: am * i / as, N }), { x0: x, maxIter: 300 });
    if (!(r.resNorm < 1e-11)) return null;
    x = r.x;
  }
  return x;
}
function decideCell(box, opts) {
  opts = opts || {};
  const nu = opts.nu || 1.02, N = box.N;
  const collapseTol = opts.collapseTol === undefined ? 0.05 : opts.collapseTol;
  const out = { c0: box.c[0], c1: box.c[1], a0: box.A[0], a1: box.A[1] };
  const rec = ct => ({ r: ct.r, Z1: ct.Z1, Z2: ct.Z2, Y0: ct.Y0, kappa: ct.kappa });

  /* A SEED IS NOT EVIDENCE. Supplied or self-found, the candidate is only a
     starting point; the certificate is the only thing that decides. */
  let xT = opts.seedT ? refine(opts.seedT, box) : seedAligned(box);
  if (!xT) xT = seedAligned(box);
  if (!xT) { out.verdict = 'UNDECIDED'; out.why = 'no numerical candidate on the aligned branch at the cell midpoint'; out.enclosures = 0; out.refinable = false; return out; }
  const certT = validateBox(xT, box, { nu });
  let posT = null;
  if (certT.ok) {
    posT = boxPositivity(certT.predictor.b, N, certT.r);
    if (!posT.positive) { certT.ok = false; certT.why = 'density positivity not certified over the ball (min m <= 0)'; }
  }

  let xH = opts.seedH ? refine(opts.seedH, box) : seedHerding(box);
  let certH = null, posH = null, sep = null;
  if (xH && separationNu(xH, xT, N, nu) <= collapseTol) xH = null;   /* same branch, not two */
  if (xH) {
    certH = validateBox(xH, box, { nu });
    if (certH.ok) {
      posH = boxPositivity(certH.predictor.b, N, certH.r);
      if (!posH.positive) { certH.ok = false; certH.why = 'density positivity not certified over the ball (min m <= 0)'; }
    }
    if (certT.ok && certH.ok) sep = separationBox(certT.predictor, certH.predictor, N, nu);
  }
  out.enclosures = (certT.ok ? 1 : 0) + (certH && certH.ok ? 1 : 0);

  if (certT.ok && certH && certH.ok && sep !== null && sep > certT.r + certH.r) {
    out.verdict = 'MULTIPLE';
    out.witness = { separation: sep, rSum: certT.r + certH.r, aligned: rec(certT), herding: rec(certH),
                    minM: Math.min(posT.minM, posH.minM),
                    b1: [certT.predictor.b[1], certH.predictor.b[1]] };
    out.refinable = false;
    return out;
  }
  if (box.c[0] >= 0 && certT.ok) {
    out.verdict = 'UNIQUE';
    out.witness = { basis: 'Lasry-Lions monotone coupling (c >= 0) — global uniqueness is CITED, not proved here',
                    enclosure: rec(certT), minM: posT.minM };
    out.refinable = false;
    return out;
  }
  out.verdict = 'UNDECIDED';
  out.why = !certT.ok ? ('aligned branch: ' + certT.why)
          : !xH ? 'only one solution found at the cell midpoint — a second branch is not excluded, it is not exhibited'
          : !certH.ok ? ('herding branch: ' + certH.why)
          : 'two solutions found but their certified balls are not yet disjoint (separation ' + sep.toExponential(3)
            + ' <= r1+r2 ' + (certT.r + certH.r).toExponential(3) + ')';
  out.refinable = !certT.ok || (!!xH && (!certH.ok || sep <= certT.r + certH.r));
  if (certT.ok) out.aligned = rec(certT);
  return out;
}

/* the bifurcation curve of the constant state: c* = -sigma^2 (2 pi)^2, where the
   linearisation loses invertibility and NO enclosure can exist. Returned as an
   interval over a sigma box, so a cell can be tested for straddling it. */
function cStarBox(sigmaBox) {
  const S = iv(sigmaBox[0], sigmaBox[1]);
  return neg(mul(mul(S, S), mul(TWO_PI_I, TWO_PI_I)));
}

return { validateBox, boxPositivity, cosGrid, refuteCandidate, decideCell, seedAligned, seedHerding, seedDirect,
         separationBox, separationNu, cStarBox,
         midProblem, VboxI, normNu, IDX, wNuI, mid, half, buildPhiI, convI };
});

return module.exports;})();

function mfgParseNum(x, what) {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (typeof x === 'string' && /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(x.trim())) return Number(x);
  throw new Error(what + ' must be a finite number');
}
function mfgParseRange(x, what) {
  if (Array.isArray(x)) {
    if (x.length !== 2) throw new Error(what + ' must be a number or a [lo, hi] pair');
    var lo = mfgParseNum(x[0], what + '[0]'), hi = mfgParseNum(x[1], what + '[1]');
    if (!(lo <= hi)) throw new Error(what + ' must have lo <= hi');
    return [lo, hi];
  }
  var v = mfgParseNum(x, what);
  return [v, v];
}
function mfgCertify(claim) {
  var refused = function (r) { return { verdict: 'REFUSED', reason: r }; };
  if (!claim || typeof claim !== 'object' || Array.isArray(claim)) return refused('the claim must be a JSON object');
  var box, nu, N;
  try {
    N = claim.N === undefined ? 16 : (claim.N | 0);
    if (!(N >= 4 && N <= 24)) return refused('N must be an integer in 4..24 (the certified band of Fourier modes)');
    nu = claim.nu === undefined ? 1.02 : mfgParseNum(claim.nu, 'nu');
    if (!(nu >= 1 && nu <= 1.2)) return refused('nu must lie in [1, 1.2] — outside that the Banach-algebra weights are useless');
    box = { sigma: mfgParseRange(claim.sigma === undefined ? 0.5 : claim.sigma, 'sigma'),
            c: mfgParseRange(claim.c, 'c'), A: mfgParseRange(claim.A === undefined ? 0 : claim.A, 'A'), N: N };
  } catch (e) { return refused(e.message); }
  if (!(box.sigma[0] > 0)) return refused('sigma must be strictly positive');
  if (box.A[0] < 0) return refused('A is the depth of the potential well and is taken >= 0');
  var wc = box.c[1] - box.c[0], wa = box.A[1] - box.A[0], ws = box.sigma[1] - box.sigma[0];
  if (wc > 4 || wa > 1 || ws > 0.4) return refused('that cell is far wider than anything this argument closes — try a cell of a few hundredths');

  var mode = claim.mode || 'cell';
  if (mode === 'refute') {
    var cand = claim.candidate;
    if (!cand || typeof cand !== 'object') return refused("mode 'refute' needs a candidate {rho, a:[...], b:[...]} and a delta");
    var delta;
    try { delta = mfgParseNum(claim.delta, 'delta'); } catch (e) { return refused(e.message); }
    var x = new Float64Array(2 * N + 1);
    try {
      x[0] = mfgParseNum(cand.rho, 'candidate.rho');
      for (var k = 1; k <= N; k++) {
        x[k] = cand.a && cand.a[k - 1] !== undefined ? mfgParseNum(cand.a[k - 1], 'candidate.a[' + (k - 1) + ']') : 0;
        x[N + k] = cand.b && cand.b[k - 1] !== undefined ? mfgParseNum(cand.b[k - 1], 'candidate.b[' + (k - 1) + ']') : 0;
      }
    } catch (e) { return refused(e.message); }
    return MFGBox.refuteCandidate(x, box, delta, { nu: nu });
  }
  if (mode !== 'cell') return refused("mode must be 'cell' or 'refute'");

  var d;
  try { d = MFGBox.decideCell(box, { nu: nu }); }
  catch (e) { return refused('the certifier stopped: ' + e.message); }
  var head = { verdict: d.verdict, cell: { sigma: box.sigma, c: box.c, A: box.A }, N: N, nu: nu,
               enclosures: d.enclosures };
  if (d.verdict === 'MULTIPLE') {
    head.statement = 'For EVERY (sigma, c, A) in this cell the system has at least TWO exact solutions: two '
      + 'certified balls, separation ' + d.witness.separation.toExponential(6) + ' against a combined radius '
      + d.witness.rSum.toExponential(6) + ', both densities bounded below by ' + d.witness.minM.toExponential(6) + '.';
    head.witness = d.witness;
  } else if (d.verdict === 'UNIQUE') {
    head.statement = 'This cell lies in the monotone half-plane c >= 0, where Lasry-Lions gives GLOBAL uniqueness '
      + '(cited, not proved here). What is proved here is the enclosure: one exact solution within '
      + d.witness.enclosure.r.toExponential(6) + ' of the predictor, uniformly over the cell, density >= '
      + d.witness.minM.toExponential(6) + '.';
    head.witness = d.witness;
  } else {
    head.statement = 'UNDECIDED — and that is a measurement, not a shrug: ' + d.why;
    if (d.aligned) head.enclosure = d.aligned;
  }
  return head;
}
function main(argv) {
  var text = argv[2];
  if (!text) {
    try { text = require('fs').readFileSync(0, 'utf8'); } catch (e) { text = ''; }
  }
  if (!text.trim()) {
    console.error('usage: node mfg-certify.js \'{"sigma":0.5,"c":[-16.03,-15.97],"A":[0.288,0.313]}\'');
    process.exit(2);
  }
  var claim;
  try { claim = JSON.parse(text); }
  catch (e) { console.log(JSON.stringify({ verdict: 'REFUSED', reason: 'not JSON — ' + e.message }, null, 1)); process.exit(1); }
  var r = mfgCertify(claim);
  console.log(JSON.stringify(r, null, 1));
  process.exit(r.verdict === 'REFUSED' ? 1 : 0);
}
if (require.main === module) main(process.argv);
