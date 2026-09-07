/* sl.js — the fully-discrete semi-Lagrangian scheme of Ashrafyan–Gomes §4 and §8, written from the paper.
   instruments/agtable · cert-machine · 2026-09-07

   THE SCHEME (their algorithm, p. 22):
     0) ϖ⁰ = −Q.
     1) backward: u_{i,k} = inf_α { I[u_{k+1}](x_i + hα) + h (l₀(α) + ϖ_k α + V_i) },  u_{i,N} = ū_i,
        I the P1 interpolant on the grid, α*_{i,k} the minimiser.
     2) forward: m_{i,k+1} = Σ_j β_i(x_j + hα*_{j,k}) m_{j,k},  m_{i,0} = m̄_i  (β the P1 basis).
     3) price: ϖ_k ← ϖ_k + Σ_i α*_{i,k} m_{i,k} Δx − Q_k  (test 1, explicit);
               Σ_i (ϖ_k^{new} − ϖ_k + (−α*_{i,k})^{1/3})³ m_{i,k} Δx = −Q_k  (test 2, implicit).
     4) stop when ‖ϖ^{new} − ϖ‖∞ < ε.

   TWO CHOICES THE PAPER LEAVES TO THE READER, made here and said on the page:
   · the minimisation over α ∈ ℝ. The interpolant is defined on [a, b] only; the paper keeps
     the unconstrained minimiser and shortens h at a node whose foot leaves [a, b]. Here the
     foot is constrained to [a, b], and the minimiser is EXACT: on each interpolation cell the
     objective is a convex function of α with a closed-form stationary point (quadratic for
     test 1, |α|^{4/3} for test 2), so the infimum is the least of the cell minima and the
     node values. No FindMin, no tolerance in the inner problem.
   · Q_k = Q(t_k), the closed-form supply at the grid time.
   Everything is float; nothing here is an authority. */
'use strict';

const cbrtSigned = (x) => Math.cbrt(x);

/* test: { l0, dl0inv, name } — l₀ and the inverse of l₀′ (solves l₀′(α) = r) */
const TESTS = {
  1: { l0: (a) => 0.5 * a * a, l0invd: (r) => r, V: (x) => 0.5 * (x - 0.25) ** 2, lam: 1.1, implicit: false },
  2: { l0: (a) => 0.75 * Math.pow(Math.abs(a), 4 / 3), l0invd: (r) => Math.sign(r) * Math.abs(r) ** 3, V: (x) => x, lam: 1.2, implicit: true }
};

function Qexact(t) {
  const w = 3 * Math.PI, den = 16 + w * w, A = 20 / den, B = -5 * w / den, C = -0.5 - B;
  return A * Math.sin(w * t) + B * Math.cos(w * t) + C * Math.exp(-4 * t);
}
function bumpHat(y, lam) { const v = 1 - (lam * y) ** 2; return v > 0 ? Math.exp(-1 / v) : 0; }

/* the scheme: opts = { test, M (space cells on [−1, 1]), N (time steps), eps, maxIter, bruteForce } */
function solve(opts) {
  const test = TESTS[opts.test], M = opts.M, N = opts.N, eps = opts.eps, maxIter = opts.maxIter || 500;
  const a = -1, b = 1, rho = (b - a) / M, h = 1 / N;
  const xs = new Float64Array(M + 1); for (let i = 0; i <= M; i++) xs[i] = a + i * rho;
  const V = new Float64Array(M + 1); for (let i = 0; i <= M; i++) V[i] = test.V(xs[i]);
  const Q = new Float64Array(N + 1); for (let k = 0; k <= N; k++) Q[k] = Qexact(k * h);
  /* m̄ on the grid, normalised by the trapezoid rule on the grid (the paper: m̂/∫m̂) */
  const m0 = new Float64Array(M + 1); let Z = 0;
  for (let i = 0; i <= M; i++) { m0[i] = bumpHat(xs[i], test.lam); Z += m0[i] * rho * (i === 0 || i === M ? 0.5 : 1); }
  for (let i = 0; i <= M; i++) m0[i] /= Z;

  const U = new Float64Array((N + 1) * (M + 1)), Mm = new Float64Array((N + 1) * (M + 1)), AL = new Float64Array(N * (M + 1));
  const w = new Float64Array(N + 1); for (let k = 0; k <= N; k++) w[k] = -Q[k];
  const wNew = new Float64Array(N + 1);

  /* the exact minimiser of  I[u](y) + h (l₀(α) + ϖα + V_i),  y = x_i + hα ∈ [a, b] */
  function minimise(u, i, wk) {
    let best = Infinity, bestA = 0;
    const consider = (y) => {
      const al = (y - xs[i]) / h;
      const j = Math.min(M - 1, Math.max(0, Math.floor((y - a) / rho)));
      const th = (y - xs[j]) / rho;
      const val = u[j] * (1 - th) + u[j + 1] * th + h * (test.l0(al) + wk * al + V[i]);
      if (val < best) { best = val; bestA = al; }
    };
    const cell = (j) => {                                                  /* the interior stationary point of cell j, if it lies inside */
      const slope = (u[j + 1] - u[j]) / rho;                                 /* dI/dy on the cell */
      /* d/dα: h·slope + h(l₀′(α) + ϖ) = 0  →  l₀′(α) = −(slope + ϖ) */
      const al = test.l0invd(-(slope + wk));
      const y = xs[i] + h * al;
      if (y > xs[j] && y < xs[j + 1]) consider(y);
    };
    if (opts.bruteForce) {
      for (let j = 0; j <= M; j++) consider(xs[j]);
      for (let j = 0; j < M; j++) cell(j);
      return { val: best, al: bestA };
    }
    /* u is convex in both tests (convex data, P1 interpolation), so dφ/dy = slope_j + l₀′(α) + ϖ is
       non-decreasing across the cells: binary-search the first cell whose right-end derivative is
       ≥ 0, then examine it and its neighbours. battery check S1 compares this with the brute force. */
    const dRight = (j) => (u[j + 1] - u[j]) / rho + (test.l0invd === TESTS[1].l0invd ? (xs[j + 1] - xs[i]) / h : Math.cbrt((xs[j + 1] - xs[i]) / h)) + wk;
    let lo = 0, hi = M - 1;
    while (lo < hi) { const md = (lo + hi) >> 1; if (dRight(md) >= 0) hi = md; else lo = md + 1; }
    for (let j = Math.max(0, lo - 2); j <= Math.min(M - 1, lo + 2); j++) { consider(xs[j]); consider(xs[j + 1]); cell(j); }
    return { val: best, al: bestA };
  }

  let it = 0, resid = Infinity, hist = [];
  for (;;) {
    /* 1) backward */
    const uN = U.subarray(N * (M + 1)); for (let i = 0; i <= M; i++) uN[i] = 0;   /* ū ≡ 0 in both tests */
    for (let k = N - 1; k >= 0; k--) {
      const uNext = U.subarray((k + 1) * (M + 1), (k + 2) * (M + 1)), uC = U.subarray(k * (M + 1), (k + 1) * (M + 1)), alk = AL.subarray(k * (M + 1), (k + 1) * (M + 1));
      for (let i = 0; i <= M; i++) { const r = minimise(uNext, i, w[k]); uC[i] = r.val; alk[i] = r.al; }
    }
    /* 2) forward */
    Mm.subarray(0, M + 1).set(m0);
    for (let k = 0; k < N; k++) {
      const mk = Mm.subarray(k * (M + 1), (k + 1) * (M + 1)), mn = Mm.subarray((k + 1) * (M + 1), (k + 2) * (M + 1)), alk = AL.subarray(k * (M + 1), (k + 1) * (M + 1));
      mn.fill(0);
      for (let j = 0; j <= M; j++) {
        if (mk[j] === 0) continue;
        const y = Math.min(b, Math.max(a, xs[j] + h * alk[j]));
        const c = Math.min(M - 1, Math.max(0, Math.floor((y - a) / rho))), th = (y - xs[c]) / rho;
        mn[c] += (1 - th) * mk[j]; mn[c + 1] += th * mk[j];
      }
    }
    /* 3) the price */
    resid = 0;
    for (let k = 0; k < N; k++) {
      const mk = Mm.subarray(k * (M + 1), (k + 1) * (M + 1)), alk = AL.subarray(k * (M + 1), (k + 1) * (M + 1));
      if (!test.implicit) {
        let s = 0; for (let i = 0; i <= M; i++) s += alk[i] * mk[i] * rho;
        wNew[k] = w[k] + s - Q[k];
      } else {
        /* Σ (d + (−α*)^{1/3})³ m Δx = −Q for d = ϖ_new − ϖ: increasing in d, bisection */
        const g = (d) => { let s = 0; for (let i = 0; i <= M; i++) s += Math.pow(d + cbrtSigned(-alk[i]), 3) * mk[i] * rho; return s + Q[k]; };
        let lo = -4, hi = 4; while (g(lo) > 0) lo *= 2; while (g(hi) < 0) hi *= 2;
        for (let s = 0; s < 60; s++) { const mid = 0.5 * (lo + hi); if (g(mid) > 0) hi = mid; else lo = mid; }
        wNew[k] = w[k] + 0.5 * (lo + hi);
      }
      resid = Math.max(resid, Math.abs(wNew[k] - w[k]));
    }
    wNew[N] = w[N];
    hist.push(resid);
    it++;
    if (resid < eps || it >= maxIter) { for (let k = 0; k < N; k++) w[k] = wNew[k]; break; }
    for (let k = 0; k < N; k++) w[k] = wNew[k];
  }
  /* the state at the accepted price: one more backward/forward pass so u, m, α belong to it */
  {
    const uN = U.subarray(N * (M + 1)); for (let i = 0; i <= M; i++) uN[i] = 0;
    for (let k = N - 1; k >= 0; k--) {
      const uNext = U.subarray((k + 1) * (M + 1), (k + 2) * (M + 1)), uC = U.subarray(k * (M + 1), (k + 1) * (M + 1)), alk = AL.subarray(k * (M + 1), (k + 1) * (M + 1));
      for (let i = 0; i <= M; i++) { const r = minimise(uNext, i, w[k]); uC[i] = r.val; alk[i] = r.al; }
    }
    Mm.subarray(0, M + 1).set(m0);
    for (let k = 0; k < N; k++) {
      const mk = Mm.subarray(k * (M + 1), (k + 1) * (M + 1)), mn = Mm.subarray((k + 1) * (M + 1), (k + 2) * (M + 1)), alk = AL.subarray(k * (M + 1), (k + 1) * (M + 1));
      mn.fill(0);
      for (let j = 0; j <= M; j++) { if (mk[j] === 0) continue; const y = Math.min(b, Math.max(a, xs[j] + h * alk[j])); const c = Math.min(M - 1, Math.max(0, Math.floor((y - a) / rho))), th = (y - xs[c]) / rho; mn[c] += (1 - th) * mk[j]; mn[c + 1] += th * mk[j]; }
    }
  }
  return { xs, Q, w, u0: Array.from(U.subarray(0, M + 1)), mT: Array.from(Mm.subarray(N * (M + 1))), m0: Array.from(m0), it, resid, hist, rho, h, converged: resid < eps };
}

module.exports = { solve, Qexact, bumpHat, TESTS };
