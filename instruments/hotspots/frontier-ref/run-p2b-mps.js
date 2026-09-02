/* EMBER P2b (float) — Method of Particular Solutions for the trapezoid.

   P2a-3 verdict: Galerkin strong residuals DIVERGE at the corners (sNorm
   6.3→9.7 as N=8→20). Pivot: trial functions that satisfy −Δu = λu EXACTLY —
   Fourier–Bessel corner fans J_{kπ/ω}(√λ r)cos(kπθ/ω) in each corner's
   local frame (Neumann exact on both adjacent edges). Then the ONLY defect
   is the boundary normal derivative on non-adjacent edges, and the
   eigenfunction enclosure runs through Moler–Payne with the certified CR
   gap (P2a-2). MPS converges exponentially on polygons (Fox–Henrici–Moler,
   Betcke–Trefethen).

   This script is FLOAT: λ-scan minimizing the Neumann boundary defect
   σ(λ) = min_c ‖∂ν ũ_c‖_{L²(∂Ω)} / ‖ũ_c‖_{L²(Ω)}, and the defect-vs-basis
   curve. If σ decays exponentially in the fan size, the architecture is
   confirmed and P2b-rigor (interval Bessel + certified boundary integrals
   + Moler–Payne from the paper) is a straight build. */
'use strict';

const VERTS = [[0, 0], [1, 0], [0.85, 0.9], [0.25, 0.9]];

/* ---------- corner frames ---------- */
function corners() {
  const out = [];
  for (let k = 0; k < 4; k++) {
    const V = VERTS[k], Vn = VERTS[(k + 1) % 4], Vp = VERTS[(k + 3) % 4];
    const a1 = Math.atan2(Vn[1] - V[1], Vn[0] - V[0]);
    let om = Math.atan2(Vp[1] - V[1], Vp[0] - V[0]) - a1;
    while (om <= 0) om += 2 * Math.PI;
    out.push({ V, a1, om, nu: Math.PI / om });
  }
  return out;
}

/* ---------- Bessel J_nu by series (x modest, nu >= 0) ---------- */
function lgamma(x) {
  // Lanczos
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
function besselJ(nu, x) {
  if (x === 0) return nu === 0 ? 1 : 0;
  let sum = 0, m = 0;
  const lx = Math.log(x / 2);
  for (; m < 200; m++) {
    const lt = (nu + 2 * m) * lx - lgamma(m + 1) - lgamma(nu + m + 1);
    const t = ((m % 2) ? -1 : 1) * Math.exp(lt);
    sum += t;
    if (m > 4 && Math.abs(t) < 1e-18 * Math.abs(sum)) break;
  }
  return sum;
}
function besselJd(nu, x) { // derivative
  if (x === 0) return nu === 1 ? 0.5 : 0;
  return (nu === 0 ? -besselJ(1, x) : besselJ(nu - 1, x) - (nu / x) * besselJ(nu, x));
}

/* basis function idx -> corner c, mode k (k=0..K-1) */
function basisEval(cs, K, sqlam, x, y, needGrad) {
  const vals = [], gx = [], gy = [];
  for (const C of cs) {
    const rx = x - C.V[0], ry = y - C.V[1];
    const r = Math.hypot(rx, ry);
    let th = Math.atan2(ry, rx) - C.a1;
    while (th < -1e-12) th += 2 * Math.PI;
    for (let k = 0; k < K; k++) {
      const nu = k * C.nu;
      const J = besselJ(nu, sqlam * r);
      const ct = Math.cos(nu * th);
      vals.push(J * ct);
      if (needGrad) {
        const Jd = besselJd(nu, sqlam * r) * sqlam;
        const st = Math.sin(nu * th);
        // ∂r, (1/r)∂θ in local polar; convert to x,y
        const dr = Jd * ct;
        const dth = r > 1e-14 ? -nu * J * st / r : 0;
        const cA = Math.cos(C.a1 + th), sA = Math.sin(C.a1 + th);
        gx.push(dr * cA - dth * sA);
        gy.push(dr * sA + dth * cA);
      }
    }
  }
  return { vals, gx, gy };
}

/* ---------- boundary + interior sampling ---------- */
function gauss(n) {
  const x = new Float64Array(n), w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let t = Math.cos(Math.PI * (i + 0.75) / (n + 0.5));
    for (let it = 0; it < 100; it++) {
      let p0 = 1, p1 = t;
      for (let k = 2; k <= n; k++) { const p2 = ((2 * k - 1) * t * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; }
      const dp = n * (t * p1 - p0) / (t * t - 1);
      const dt = p1 / dp; t -= dt;
      if (Math.abs(dt) < 1e-15) break;
    }
    let p0 = 1, p1 = t;
    for (let k = 2; k <= n; k++) { const p2 = ((2 * k - 1) * t * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; }
    const dp = n * (t * p1 - p0) / (t * t - 1);
    x[i] = (t + 1) / 2; w[i] = 1 / ((1 - t * t) * dp * dp);
  }
  return { x, w };
}

function buildMatrices(cs, K, lam, nb, ni) {
  const sqlam = Math.sqrt(lam);
  const nbasis = cs.length * K;
  // boundary rows: sqrt(ds-weight) * ∂ν(basis)
  const gb = gauss(nb);
  const rowsA = [];
  for (let e = 0; e < 4; e++) {
    const A = VERTS[e], B = VERTS[(e + 1) % 4];
    const ex = B[0] - A[0], ey = B[1] - A[1], len = Math.hypot(ex, ey);
    const nrm = [ey / len, -ex / len];
    for (let q = 0; q < nb; q++) {
      const t = gb.x[q];
      const x = A[0] + ex * t, y = A[1] + ey * t;
      const bv = basisEval(cs, K, sqlam, x, y, true);
      const wq = Math.sqrt(gb.w[q] * len);
      rowsA.push(bv.gx.map((g, i) => (g * nrm[0] + bv.gy[i] * nrm[1]) * wq));
    }
  }
  // interior rows: sqrt(area-weight) * basis values (on a mapped grid)
  const gi = gauss(ni);
  const rowsB = [];
  for (let a = 0; a < ni; a++) for (let b2 = 0; b2 < ni; b2++) {
    const u = gi.x[a], v = gi.x[b2];
    const w = 1 - 0.4 * v;
    const x = u * w + 0.25 * v, y = 0.9 * v;
    const det = 0.9 * w;
    const bv = basisEval(cs, K, sqlam, x, y, false);
    const wq = Math.sqrt(gi.w[a] * gi.w[b2] * det);
    rowsB.push(bv.vals.map(z => z * wq));
  }
  return { rowsA, rowsB, nbasis };
}

/* Betcke–Trefethen subspace angle with rank truncation:
   one-sided Jacobi SVD of the stacked S=[A;B]; drop σ_i < 1e-10 σmax
   (kills the spurious everywhere-tiny functions that fake zero defect);
   then the smallest singular value of the boundary block of the
   orthonormalized columns = sin(angle) ≈ ‖∂νu‖/‖u‖_total. */
function subspaceAngle(rowsA, rowsB, n) {
  const mA = rowsA.length, mB = rowsB.length, m = mA + mB;
  const raw = [];
  const rawNorm = new Float64Array(n);
  let maxRaw = 0;
  for (let j = 0; j < n; j++) {
    const col = new Float64Array(m);
    for (let i = 0; i < mA; i++) col[i] = rowsA[i][j];
    for (let i = 0; i < mB; i++) col[mA + i] = rowsB[i][j];
    let nr = 0;
    for (let i = 0; i < m; i++) nr += col[i] * col[i];
    rawNorm[j] = Math.sqrt(nr);
    maxRaw = Math.max(maxRaw, rawNorm[j]);
    raw.push(col);
  }
  // drop numerically-void columns (J_ν at huge ν is double-precision noise;
  // normalizing noise manufactures fake small angles), then normalize
  const use = [];
  for (let j = 0; j < n; j++) if (rawNorm[j] > 1e-12 * maxRaw) use.push(j);
  const S = [], cscale = [];
  for (const j of use) {
    const col = raw[j];
    for (let i = 0; i < m; i++) col[i] /= rawNorm[j];
    S.push(col); cscale.push(rawNorm[j]);
  }
  const nUse = use.length;
  const V = Array.from({ length: nUse }, (_, i) => { const v = new Float64Array(nUse); v[i] = 1; return v; });
  for (let sweep = 0; sweep < 14; sweep++) {
    let rotated = 0;
    for (let p = 0; p < nUse; p++) for (let q2 = p + 1; q2 < nUse; q2++) {
      let a = 0, b2 = 0, g = 0;
      const sp = S[p], sq = S[q2];
      for (let i = 0; i < m; i++) { a += sp[i] * sp[i]; b2 += sq[i] * sq[i]; g += sp[i] * sq[i]; }
      if (Math.abs(g) < 1e-28 || Math.abs(g) < 1e-15 * Math.sqrt(a * b2)) continue;
      const zeta = (b2 - a) / (2 * g);
      const t = Math.sign(zeta || 1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
      const c2 = 1 / Math.sqrt(1 + t * t), s2 = t * c2;
      for (let i = 0; i < m; i++) { const x = sp[i], y = sq[i]; sp[i] = c2 * x - s2 * y; sq[i] = s2 * x + c2 * y; }
      for (let i = 0; i < nUse; i++) { const x = V[p][i], y = V[q2][i]; V[p][i] = c2 * x - s2 * y; V[q2][i] = s2 * x + c2 * y; }
      rotated++;
    }
    if (rotated === 0) break;
  }
  let smax = 0;
  const sig = S.map(col => { let s2 = 0; for (let i = 0; i < m; i++) s2 += col[i] * col[i]; const nr = Math.sqrt(s2); smax = Math.max(smax, nr); return nr; });
  const kept = [];
  for (let j = 0; j < nUse; j++) if (sig[j] > 1e-10 * smax) kept.push(j);
  // QA = boundary block of orthonormalized kept columns; G = QAᵀQA (small)
  const nk = kept.length;
  const G = Array.from({ length: nk }, () => new Float64Array(nk));
  for (let a = 0; a < nk; a++) for (let b2 = a; b2 < nk; b2++) {
    let s2 = 0;
    const ca = S[kept[a]], cb = S[kept[b2]];
    for (let i = 0; i < mA; i++) s2 += ca[i] * cb[i];
    G[a][b2] = s2 / (sig[kept[a]] * sig[kept[b2]]);
    G[b2][a] = G[a][b2];
  }
  // smallest eigenvalue of G by Jacobi, with eigenvector for coefficients
  const W = Array.from({ length: nk }, (_, i) => { const v = new Float64Array(nk); v[i] = 1; return v; });
  for (let sweep = 0; sweep < 40; sweep++) {
    let off = 0;
    for (let p = 0; p < nk; p++) for (let q2 = p + 1; q2 < nk; q2++) off += G[p][q2] * G[p][q2];
    if (off < 1e-32 * nk * nk) break;
    for (let p = 0; p < nk; p++) for (let q2 = p + 1; q2 < nk; q2++) {
      if (Math.abs(G[p][q2]) < 1e-24) continue;
      const th = (G[q2][q2] - G[p][p]) / (2 * G[p][q2]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c2 = 1 / Math.sqrt(t * t + 1), s2 = t * c2;
      for (let k = 0; k < nk; k++) { const a = G[k][p], b2 = G[k][q2]; G[k][p] = c2 * a - s2 * b2; G[k][q2] = s2 * a + c2 * b2; }
      for (let k = 0; k < nk; k++) { const a = G[p][k], b2 = G[q2][k]; G[p][k] = c2 * a - s2 * b2; G[q2][k] = s2 * a + c2 * b2; }
      for (let k = 0; k < nk; k++) { const a = W[k][p], b2 = W[k][q2]; W[k][p] = c2 * a - s2 * b2; W[k][q2] = s2 * a + c2 * b2; }
    }
  }
  let best = Infinity, bidx = -1;
  for (let i = 0; i < nk; i++) if (G[i][i] < best) { best = G[i][i]; bidx = i; }
  // coefficient vector in the ORIGINAL basis: c = Σ_a W[a][bidx] * V[kept[a]] / sig
  const coef = new Float64Array(n);
  for (let a = 0; a < nk; a++) {
    const scale = W[a][bidx] / sig[kept[a]];
    for (let i = 0; i < nUse; i++) coef[use[i]] += scale * V[kept[a]][i] / cscale[i];
  }
  return { d: Math.sqrt(Math.max(0, best)), kept: nk, coef };
}

/* legacy shim (unused) */
function smallestGen(AtA, BtB) {
  const n = AtA.length;
  // Cholesky of BtB + jitter
  const B = BtB.map((r2, i) => Float64Array.from(r2));
  let jit = 0;
  for (let i = 0; i < n; i++) jit = Math.max(jit, B[i][i]);
  jit *= 1e-13;
  for (let i = 0; i < n; i++) B[i][i] += jit;
  const L = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = B[i][j];
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) { if (s <= 0) return { bad: true }; L[i][i] = Math.sqrt(s); }
    else L[i][j] = s / L[j][j];
  }
  const fwd = xx => { const y = Float64Array.from(xx); for (let i = 0; i < n; i++) { for (let k = 0; k < i; k++) y[i] -= L[i][k] * y[k]; y[i] /= L[i][i]; } return y; };
  const back = xx => { const y = Float64Array.from(xx); for (let i = n - 1; i >= 0; i--) { for (let k = i + 1; k < n; k++) y[i] -= L[k][i] * y[k]; y[i] /= L[i][i]; } return y; };
  // C = L^{-1} AtA L^{-T}; inverse power iteration on C + small shift
  const C = [];
  for (let i2 = 0; i2 < n; i2++) C.push(new Float64Array(n));
  for (let j = 0; j < n; j++) {
    const e = new Float64Array(n); e[j] = 1;
    const col = back(e);
    const Ax = new Float64Array(n);
    for (let a = 0; a < n; a++) { let s = 0; for (let b2 = 0; b2 < n; b2++) s += AtA[a][b2] * col[b2]; Ax[a] = s; }
    const y = fwd(Ax);
    for (let i2 = 0; i2 < n; i2++) C[i2][j] = y[i2];
  }
  for (let i2 = 0; i2 < n; i2++) for (let j = 0; j < i2; j++) { const a = (C[i2][j] + C[j][i2]) / 2; C[i2][j] = a; C[j][i2] = a; }
  // C is symmetric PSD small (n ≤ ~100): Jacobi
  for (let sweep = 0; sweep < 30; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q2 = p + 1; q2 < n; q2++) off += C[p][q2] * C[p][q2];
    if (off < 1e-30 * n * n) break;
    for (let p = 0; p < n; p++) for (let q2 = p + 1; q2 < n; q2++) {
      if (Math.abs(C[p][q2]) < 1e-22) continue;
      const th = (C[q2][q2] - C[p][p]) / (2 * C[p][q2]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c2 = 1 / Math.sqrt(t * t + 1), s2 = t * c2;
      for (let k = 0; k < n; k++) { const a = C[k][p], b2 = C[k][q2]; C[k][p] = c2 * a - s2 * b2; C[k][q2] = s2 * a + c2 * b2; }
      for (let k = 0; k < n; k++) { const a = C[p][k], b2 = C[q2][k]; C[p][k] = c2 * a - s2 * b2; C[q2][k] = s2 * a + c2 * b2; }
    }
  }
  let best = Infinity;
  for (let i2 = 0; i2 < n; i2++) best = Math.min(best, C[i2][i2]);
  return { sig: Math.sqrt(Math.max(0, best)) };
}

/* ---------- main: λ scan + defect curve ---------- */
const cs = corners();
console.log('corner openings (deg):', cs.map(c => +(c.om * 180 / Math.PI).toFixed(2)).join(' '),
  ' ν = π/ω:', cs.map(c => +c.nu.toFixed(4)).join(' '));

function defectAt(K, lam) {
  const { rowsA, rowsB, nbasis } = buildMatrices(cs, K, lam, 90, 28);
  return subspaceAngle(rowsA, rowsB, nbasis);
}

/* physical defect for a coefficient vector: fresh, denser quadrature */
function physicalDefect(K, lam, coef) {
  const sqlam = Math.sqrt(lam);
  const gb = gauss(160);
  let bd2 = 0;
  for (let e = 0; e < 4; e++) {
    const A = VERTS[e], B = VERTS[(e + 1) % 4];
    const ex = B[0] - A[0], ey = B[1] - A[1], len = Math.hypot(ex, ey);
    const nrm = [ey / len, -ex / len];
    for (let q = 0; q < 160; q++) {
      const t = gb.x[q];
      const bv = basisEval(cs, K, sqlam, A[0] + ex * t, A[1] + ey * t, true);
      let fl = 0;
      for (let i = 0; i < coef.length; i++) fl += coef[i] * (bv.gx[i] * nrm[0] + bv.gy[i] * nrm[1]);
      bd2 += fl * fl * len * gb.w[q];
    }
  }
  const gi = gauss(48);
  let m2 = 0;
  for (let a = 0; a < 48; a++) for (let b2 = 0; b2 < 48; b2++) {
    const u = gi.x[a], v = gi.x[b2];
    const w = 1 - 0.4 * v;
    const bv = basisEval(cs, K, sqlam, u * w + 0.25 * v, 0.9 * v, false);
    let val = 0;
    for (let i = 0; i < coef.length; i++) val += coef[i] * bv.vals[i];
    m2 += val * val * 0.9 * w * gi.w[a] * gi.w[b2];
  }
  return Math.sqrt(bd2) / Math.sqrt(m2);
}

module.exports = { VERTS, corners, gauss, basisEval, buildMatrices, subspaceAngle, defectAt, physicalDefect, besselJ, besselJd };
if (require.main === module)
for (const K of [6, 10, 14, 18]) {
  const t0 = Date.now();
  let lo = 11.99, hi = 12.06;
  let bestLam = 0, bestD = Infinity, bestCoef = null, bestKept = 0;
  for (let round = 0; round < 5; round++) {
    const step = (hi - lo) / 6;
    for (let lam = lo; lam <= hi + 1e-12; lam += step) {
      const r2 = defectAt(K, lam);
      if (r2.d < bestD) { bestD = r2.d; bestLam = lam; bestCoef = r2.coef; bestKept = r2.kept; }
    }
    lo = Math.max(11.99, bestLam - step); hi = Math.min(12.06, bestLam + step);
  }
  const phys = physicalDefect(K, bestLam, bestCoef);
  console.log(JSON.stringify({
    K, nbasis: 4 * K, kept: bestKept, lambdaStar: +bestLam.toFixed(9),
    angle: +bestD.toExponential(3), physDefect: +phys.toExponential(3),
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  }));
}
