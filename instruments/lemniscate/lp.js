/* Tiny dense simplex for the max-min log-potential LPs (item 3).
   solveMaxMin(G, g0): maximize t s.t. Σᵢ wᵢ·G[x][i] + g0[x] ≥ t ∀x,
   wᵢ ≥ 0. Returns { t, w } (exact LP optimum up to float arithmetic).
   Method: substitute τ = t + S, S = −min(g0) + 1 ⇒ all RHS positive ⇒
   slack basis is feasible; single-phase primal simplex, Bland's rule.
   Sizes here: m ≤ ~600 constraints, n = k+1 ≤ 8 structural columns. */
'use strict';

function solveMaxMin(G, g0) {
  const m = g0.length, k = G[0].length, n = k + 1; // cols: w1..wk, tau
  const S = -Math.min(...g0) + 1;
  // tableau: rows 0..m-1 constraints, row m objective (maximize tau)
  // constraint x: -Σ w G + tau ≤ g0 + S
  const T = [];
  for (let r = 0; r < m; r++) {
    const row = new Float64Array(n + m + 1);
    for (let i = 0; i < k; i++) row[i] = -G[r][i];
    row[k] = 1;
    row[n + r] = 1;
    row[n + m] = g0[r] + S;
    T.push(row);
  }
  const obj = new Float64Array(n + m + 1);
  obj[k] = -1; // maximize tau ⇒ minimize −tau
  T.push(obj);
  const basis = [];
  for (let r = 0; r < m; r++) basis.push(n + r);
  const EPS = 1e-11;
  for (let iter = 0; iter < 20000; iter++) {
    // entering: Bland — smallest index with negative reduced cost
    let e = -1;
    for (let j = 0; j < n + m; j++) if (T[m][j] < -EPS) { e = j; break; }
    if (e < 0) break; // optimal
    // ratio test (Bland tie-break on basis index)
    let lv = -1, best = Infinity;
    for (let r = 0; r < m; r++) {
      if (T[r][e] > EPS) {
        const ratio = T[r][n + m] / T[r][e];
        if (ratio < best - EPS || (ratio < best + EPS && (lv < 0 || basis[r] < basis[lv]))) { best = ratio; lv = r; }
      }
    }
    if (lv < 0) {
      // a column with no positive entry: genuinely unbounded only if its reduced cost is
      // materially negative; at noise level (|rc| < 1e-8, seen with n ≈ 260 columns) the
      // tableau is optimal to float precision — stop here instead of returning null
      if (T[m][e] > -1e-8) break;
      return { t: Infinity, w: null };
    }
    // pivot
    const piv = T[lv][e];
    for (let j = 0; j <= n + m; j++) T[lv][j] /= piv;
    for (let r = 0; r <= m; r++) {
      if (r === lv) continue;
      const f = T[r][e];
      if (f !== 0) for (let j = 0; j <= n + m; j++) T[r][j] -= f * T[lv][j];
    }
    basis[lv] = e;
  }
  const z = new Float64Array(n);
  for (let r = 0; r < m; r++) if (basis[r] < n) z[basis[r]] = T[r][n + m];
  return { t: z[k] - S, w: Array.from(z.slice(0, k)) };
}

module.exports = { solveMaxMin };
