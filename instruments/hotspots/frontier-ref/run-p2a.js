/* EMBER P2a-1 — interval Galerkin assembly + certified eigenvalue UPPER
   bounds for the steep non-isosceles trapezoid specimen.

   Specimen (all coordinates rational): A=(0,0) B=(1,0) C=(17/20,9/10)
   D=(1/4,9/10). Side slopes 6 and 3.6 (not a lip domain), no symmetry axis
   (outside Jerison–Nadirashvili and the Apr-2026 symmetric classes).

   Pullback to the unit square: x = u·w(v) + dx·v, y = h·v with
   w(v) = b + w1·v (b=1, w1 = cx−dx−b = −2/5), s(u) = w1·u + dx.
     G11 = (h²+s(u)²)/(h·w(v))   [the ONLY rational-in-v piece]
     G12 = −s(u)/h               [polynomial]
     G22 = w(v)/h                [polynomial]
     mass weight = h·w(v)        [polynomial]
   Basis: cos(iπu)·P̃_j(v) (shifted Legendre), i=0..NU, j=0..NV — Neumann is
   the natural BC of the weak form, and the constant is EXACTLY basis (0,0).

   RIGOR MODEL of this file:
   - v-integrals: EXACT BigInt rationals (Legendre coefficient arrays); the
     1/w(v) integrals via the positive series ∫v^m/(1−qv) = Σ_t q^t/(m+t+1)
     (q=2/5), exact partial sum + certified tail interval [0, bound].
   - u-integrals: closed forms in 1/(mπ), 1/(m²π²) using eqcert's PI.
   - rational→interval bridge: toDouble, widened outward until the EXACT
     containment check rational.inClosed passes (the falsifier).
   - upper bounds: Rayleigh–Ritz min-max — for ANY r-dim trial subspace V,
     the r-th pencil eigenvalue bounds the r-th Galerkin eigenvalue above,
     and Galerkin bounds the PDE eigenvalue above (trial space ⊂ H¹). The
     small pencil is evaluated in interval arithmetic from float vectors;
     λmax(A,B) ≤ GershUpper(A)/GershLower(B).
   Floats (Cholesky+Jacobi eigensolve) only PICK the subspace — every
   claimed bound is interval-certified. Lower bounds: P2a-2 (not here). */
'use strict';

const I = require('../../lib/eqcert/interval.js');
const T = require('../../lib/eqcert/transcendental.js');
const Q = require('../../lib/eqcert/rational.js');
const { solveQuad } = require('./lib.js');

const NU = 12, NV = 12;

let failures = 0;
function check(name, cond, detail) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!cond) failures++;
}

/* ---------- rational helpers ---------- */
const r = (n, d) => Q.R(BigInt(n), BigInt(d === undefined ? 1 : d));
function ratToIv(a) {
  const q0 = Q.toDouble(a);
  let lo = q0, hi = q0;
  for (let w = 0; w < 60; w++) {
    if (Q.inClosed(a, lo, hi)) return [lo, hi];
    lo = I.nextDown(lo); hi = I.nextUp(hi);
  }
  throw new Error('ratToIv: containment never verified');
}

/* rational polynomials: ascending coefficient arrays */
const pAdd = (a, b) => {
  const out = [];
  for (let m = 0; m < Math.max(a.length, b.length); m++)
    out.push(Q.add(a[m] || Q.ZERO, b[m] || Q.ZERO));
  return out;
};
const pScale = (a, s) => a.map(c => Q.mul(c, s));
const pMul = (a, b) => {
  const out = Array.from({ length: a.length + b.length - 1 }, () => Q.ZERO);
  for (let m = 0; m < a.length; m++)
    for (let k = 0; k < b.length; k++)
      out[m + k] = Q.add(out[m + k], Q.mul(a[m], b[k]));
  return out;
};
const pDeriv = a => a.slice(1).map((c, m) => Q.mul(c, r(m + 1)));
const pInt01 = a => a.reduce((s, c, m) => Q.add(s, Q.div(c, r(m + 1))), Q.ZERO);

/* ---------- specimen constants (rational) ---------- */
function specimen(cxN, cxD, dxN, dxD, hN, hD) {
  const cx = r(cxN, cxD), dx = r(dxN, dxD), h = r(hN, hD), b = Q.ONE;
  const w1 = Q.sub(Q.sub(cx, dx), b);          // w(v) = b + w1 v
  const q = Q.neg(w1);                          // 1/w = 1/(1 - q v), need 0<=q<1
  return { cx, dx, h, b, w1, q,
           quad: [[0, 0], [1, 0], [Q.toDouble(cx), Q.toDouble(h)], [Q.toDouble(dx), Q.toDouble(h)]] };
}

/* ---------- shifted Legendre coefficients (exact) ---------- */
function legendre(NV_) {
  const P = [[Q.ONE], [r(-1), r(2)]];
  for (let j = 1; j < NV_; j++) {
    const t = pMul([r(-(2 * j + 1)), r(2 * (2 * j + 1))], P[j]); // (2j+1)(2v-1)P_j
    const u = pScale(P[j - 1], r(-j));
    P.push(pScale(pAdd(t, u), Q.div(Q.ONE, r(j + 1))));
  }
  return P;
}

/* ---------- v-tables ---------- */
function vTables(S) {
  const P = legendre(NV);
  const wPoly = [S.b, S.w1];
  const qd = Q.toDouble(S.q);
  if (!(qd > -1 && qd < 1)) throw new Error('specimen out of series range');
  const TT = 110; // series terms for 1/(1-qv); tail ratio |q|^{TT+1}
  // exact I_m = sum_t q^t/(m+t+1); tail in [0, |q|^{TT+1}/((m+TT+2)(1-|q|))].
  // Keep the partial sum RATIONAL — converting per-term to intervals before
  // summing against ~1e13-sized Legendre monomial coefficients destroys the
  // exact cancellation (measured: Vinv[12][12] width 3.94 vs 1e-16 after fix).
  function Im(m) {
    let s = Q.ZERO, qp = Q.ONE;
    for (let t = 0; t <= TT; t++) {
      s = Q.add(s, Q.div(qp, r(m + t + 1)));
      qp = Q.mul(qp, S.q);
    }
    const tailTop = Math.pow(Math.abs(qd), TT + 1) / ((m + TT + 2) * (1 - Math.abs(qd)));
    return { sum: s, bound: I.nextUp(tailTop) };
  }
  const ImCache = [];
  const dim = NV + 1;
  const Vw = [], Dw = [], W = [], Vinv = [];
  for (let j = 0; j <= NV; j++) {
    Vw.push([]); Dw.push([]); W.push([]); Vinv.push([]);
    for (let l = 0; l <= NV; l++) {
      const prod = pMul(P[j], P[l]);
      Vw[j].push(ratToIv(pInt01(pMul(prod, wPoly))));
      Dw[j].push(ratToIv(pInt01(pMul(pMul(pDeriv(P[j]), pDeriv(P[l])), wPoly))));
      W[j].push(ratToIv(pInt01(pMul(P[j], pDeriv(P[l])))));
      let accExact = Q.ZERO, tailAll = 0;
      for (let m = 0; m < prod.length; m++) {
        if (Q.isZero(prod[m])) continue;
        if (!ImCache[m]) ImCache[m] = Im(m);
        accExact = Q.add(accExact, Q.mul(prod[m], ImCache[m].sum));
        tailAll = I.nextUp(tailAll + Math.abs(Q.toDouble(prod[m])) * ImCache[m].bound);
      }
      const base = ratToIv(accExact);
      Vinv[j].push([I.nextDown(base[0] - tailAll), I.nextUp(base[1] + tailAll)]);
    }
  }
  return { Vw, Dw, W, Vinv, P, dim };
}

/* ---------- u-tables (intervals; PI from eqcert) ---------- */
function uTables(S) {
  const PI = T.PI, PI2 = I.sqr(PI);
  // h² + s(u)² = p0 + p1 u + p2 u²
  const p0 = Q.add(Q.mul(S.h, S.h), Q.mul(S.dx, S.dx));
  const p1 = Q.mul(r(2), Q.mul(S.w1, S.dx));
  const p2 = Q.mul(S.w1, S.w1);
  const [ip0, ip1, ip2] = [p0, p1, p2].map(ratToIv);
  const idx = ratToIv(S.dx), iw1 = ratToIv(S.w1);

  const sgn = m => (m % 2 === 0 ? 1 : -1);
  function Cpoly(m) {                  // ∫ (p0+p1u+p2u²) cos(mπu) du
    m = Math.abs(m);
    if (m === 0) return ratToIv(Q.add(p0, Q.add(Q.div(p1, r(2)), Q.div(p2, r(3)))));
    const den = I.mul(iv2(m * m), PI2);
    const num = I.add(I.mul(ip1, iv2(sgn(m) - 1)), I.mul(ip2, iv2(2 * sgn(m))));
    return I.div(num, den);
  }
  function Spoly(m) {                  // ∫ (dx + w1·u) sin(mπu) du, odd in m
    if (m === 0) return I.ZERO;
    const s = m > 0 ? 1 : -1; m = Math.abs(m);
    const den = I.mul(iv2(m), PI);
    const num = I.add(I.mul(idx, iv2(1 - sgn(m))), I.mul(iw1, iv2(-sgn(m))));
    return I.mul(iv2(s), I.div(num, den));
  }
  const half = iv2(0.5);
  const Ussp = [], Uscs = [], Ucc = [];
  for (let i = 0; i <= NU; i++) {
    Ussp.push([]); Uscs.push([]); Ucc.push([]);
    for (let k = 0; k <= NU; k++) {
      Ucc[i].push(i !== k ? I.ZERO : (i === 0 ? I.ONE : half));
      Ussp[i].push(i === 0 || k === 0 ? I.ZERO
        : I.mul(half, I.sub(Cpoly(i - k), Cpoly(i + k))));
      Uscs[i].push(i === 0 ? I.ZERO
        : I.mul(half, I.add(Spoly(i + k), Spoly(i - k))));
    }
  }
  return { Ussp, Uscs, Ucc, PI2 };
}
function iv2(x) { return I.iv(x); }

/* ---------- assembly ---------- */
function assembleGalerkin(S) {
  const V = vTables(S), U = uTables(S);
  const ih = ratToIv(S.h);
  const dim = (NU + 1) * (NV + 1);
  const id = (i, j) => i * (NV + 1) + j;
  const K = Array.from({ length: dim }, () => new Array(dim).fill(null));
  const M = Array.from({ length: dim }, () => new Array(dim).fill(null));
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
    for (let k = 0; k <= NU; k++) for (let l = 0; l <= NV; l++) {
      let kv = I.ZERO;
      if (i > 0 && k > 0) {
        const c = I.div(I.mul(iv2(i * k), U.PI2), ih);
        kv = I.add(kv, I.mul(c, I.mul(U.Ussp[i][k], V.Vinv[j][l])));
      }
      if (i > 0) {
        const c = I.div(I.mul(iv2(i), T.PI), ih);
        kv = I.add(kv, I.mul(c, I.mul(U.Uscs[i][k], V.W[j][l])));
      }
      if (k > 0) {
        const c = I.div(I.mul(iv2(k), T.PI), ih);
        kv = I.add(kv, I.mul(c, I.mul(U.Uscs[k][i], V.W[l][j])));
      }
      kv = I.add(kv, I.div(I.mul(U.Ucc[i][k], V.Dw[j][l]), ih));
      K[id(i, j)][id(k, l)] = kv;
      M[id(i, j)][id(k, l)] = I.mul(ih, I.mul(U.Ucc[i][k], V.Vw[j][l]));
    }
  }
  return { K, M, dim, id, V, U };
}

/* ---------- float dense generalized symmetric eigensolver ---------- */
function mid(A) { return A.map(row => row.map(e => (e[0] + e[1]) / 2)); }

function cholesky(B) {
  const n = B.length, L = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = B[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) { if (s <= 0) throw new Error('mass matrix not PD (float)'); L[i][i] = Math.sqrt(s); }
      else L[i][j] = s / L[j][j];
    }
  }
  return L;
}
function forwardSolve(L, x) {           // L y = x
  const n = L.length, y = Float64Array.from(x);
  for (let i = 0; i < n; i++) { for (let k = 0; k < i; k++) y[i] -= L[i][k] * y[k]; y[i] /= L[i][i]; }
  return y;
}
function backSolveT(L, x) {             // Lᵀ y = x
  const n = L.length, y = Float64Array.from(x);
  for (let i = n - 1; i >= 0; i--) { for (let k = i + 1; k < n; k++) y[i] -= L[k][i] * y[k]; y[i] /= L[i][i]; }
  return y;
}
function jacobiEig(C) {
  const n = C.length;
  const A = C.map(row => Float64Array.from(row));
  const V = Array.from({ length: n }, (_, i) => { const v = new Float64Array(n); v[i] = 1; return v; });
  for (let sweep = 0; sweep < 30; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let qq = p + 1; qq < n; qq++) off += A[p][qq] * A[p][qq];
    if (off < 1e-22 * n * n) break;
    for (let p = 0; p < n; p++) for (let qq = p + 1; qq < n; qq++) {
      if (Math.abs(A[p][qq]) < 1e-15) continue;
      const theta = (A[qq][qq] - A[p][p]) / (2 * A[p][qq]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) {
        const akp = A[k][p], akq = A[k][qq];
        A[k][p] = c * akp - s * akq; A[k][qq] = s * akp + c * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = A[p][k], aqk = A[qq][k];
        A[p][k] = c * apk - s * aqk; A[qq][k] = s * apk + c * aqk;
      }
      for (let k = 0; k < n; k++) {
        const vkp = V[k][p], vkq = V[k][qq];
        V[k][p] = c * vkp - s * vkq; V[k][qq] = s * vkp + c * vkq;
      }
    }
  }
  const lam = A.map((row, i) => row[i]);
  return { lam, V };
}
function floatEig(Kf, Mf, count) {
  const n = Kf.length;
  const L = cholesky(Mf);
  // C = L⁻¹ K L⁻ᵀ
  const C = [];
  for (let i = 0; i < n; i++) C.push(new Float64Array(n));
  // columns of L⁻ᵀ: solve per unit vector — O(n³) acceptable at n=169
  const cols = [];
  for (let j = 0; j < n; j++) {
    const e = new Float64Array(n); e[j] = 1;
    cols.push(backSolveT(L, e));
  }
  for (let j = 0; j < n; j++) {
    const Kx = new Float64Array(n);
    for (let a = 0; a < n; a++) { let s2 = 0; for (let b2 = 0; b2 < n; b2++) s2 += Kf[a][b2] * cols[j][b2]; Kx[a] = s2; }
    const y = forwardSolve(L, Kx);
    for (let i = 0; i < n; i++) C[i][j] = y[i];
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) { const a = (C[i][j] + C[j][i]) / 2; C[i][j] = a; C[j][i] = a; }
  const { lam, V } = jacobiEig(C);
  const order = lam.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (let m = 0; m < count; m++) {
    const [val, idx0] = order[m];
    const y = new Float64Array(n);
    for (let k2 = 0; k2 < n; k2++) y[k2] = V[k2][idx0];
    out.push({ lam: val, vec: backSolveT(L, y) });
  }
  return out;
}

/* ---------- certified small-pencil upper bound ---------- */
function ivQuadForm(A, v, w) {         // vᵀ A w with float v,w, interval A
  let s = I.ZERO;
  const n = v.length;
  for (let i = 0; i < n; i++) {
    if (v[i] === 0) continue;
    let row = I.ZERO;
    for (let j = 0; j < n; j++) {
      if (w[j] === 0) continue;
      row = I.add(row, I.mul(A[i][j], iv2(w[j])));
    }
    s = I.add(s, I.mul(iv2(v[i]), row));
  }
  return s;
}
function certifiedUpper(K, M, vecs) {  // r-dim subspace → upper bound on r-th pencil eigenvalue
  const rdim = vecs.length;
  const A = [], B = [];
  for (let a = 0; a < rdim; a++) {
    A.push([]); B.push([]);
    for (let b = 0; b < rdim; b++) {
      A[a].push(ivQuadForm(K, vecs[a], vecs[b]));
      B[a].push(ivQuadForm(M, vecs[a], vecs[b]));
    }
  }
  // λmax(A,B) ≤ GershUpper(A) / GershLower(B), needs GershLower(B) > 0
  let gU = -Infinity, gL = Infinity;
  for (let a = 0; a < rdim; a++) {
    let offA = 0, offB = 0;
    for (let b = 0; b < rdim; b++) if (b !== a) { offA += I.mag(A[a][b]); offB += I.mag(B[a][b]); }
    gU = Math.max(gU, I.nextUp(A[a][a][1] + offA));
    gL = Math.min(gL, I.nextDown(B[a][a][0] - offB));
  }
  if (!(gL > 0)) throw new Error('trial Gram matrix not certified PD');
  if (gU <= 0) return 0;
  return I.div([gU, gU], [gL, gL])[1];
}

/* ---------- selftests: numerical parity by 1-D Simpson ---------- */
function simpson(f, n) {
  let s = f(0) + f(1);
  for (let i = 1; i < n; i++) s += f(i / n) * (i % 2 ? 4 : 2);
  return s / (3 * n);
}
function parityTests(S, V, U) {
  const P = V.P;
  const evalPoly = (p, x) => { let s = 0, xx = 1; for (const c of p) { s += Q.toDouble(c) * xx; xx *= x; } return s; };
  const w1 = Q.toDouble(S.w1), dx = Q.toDouble(S.dx), h = Q.toDouble(S.h), qd = Q.toDouble(S.q);
  let worst = 0, count = 0;
  for (const [j, l] of [[0, 0], [1, 3], [4, 2], [7, 7], [12, 5], [12, 12], [2, 11]]) {
    const pj = x => evalPoly(P[j], x), pl = x => evalPoly(P[l], x);
    const num = simpson(v => pj(v) * pl(v) / (1 - qd * v), 4000);
    const e = Math.abs(num - (V.Vinv[j][l][0] + V.Vinv[j][l][1]) / 2);
    worst = Math.max(worst, e); count++;
    // slack 3e-7: float monomial evaluation of degree-24 Legendre products
    // carries ~1e7-size coefficients; the interval side is exact rational
    if (!(num >= V.Vinv[j][l][0] - 3e-7 && num <= V.Vinv[j][l][1] + 3e-7)) return { ok: false, where: `Vinv ${j},${l}` };
  }
  for (const [i, k] of [[1, 1], [2, 5], [7, 3], [12, 12], [1, 12], [9, 0], [3, 3]]) {
    if (i > 0 && k > 0) {
      const num = simpson(u => Math.sin(i * Math.PI * u) * Math.sin(k * Math.PI * u) * (h * h + Math.pow(w1 * u + dx, 2)), 4000);
      const e = Math.abs(num - (U.Ussp[i][k][0] + U.Ussp[i][k][1]) / 2);
      worst = Math.max(worst, e); count++;
      if (!(num >= U.Ussp[i][k][0] - 1e-9 && num <= U.Ussp[i][k][1] + 1e-9)) return { ok: false, where: `Ussp ${i},${k}` };
    }
    const num2 = simpson(u => Math.sin(Math.max(i, 1) * Math.PI * u) * Math.cos(k * Math.PI * u) * (w1 * u + dx), 4000);
    const e2 = Math.abs(num2 - (U.Uscs[Math.max(i, 1)][k][0] + U.Uscs[Math.max(i, 1)][k][1]) / 2);
    worst = Math.max(worst, e2); count++;
    if (!(num2 >= U.Uscs[Math.max(i, 1)][k][0] - 1e-9 && num2 <= U.Uscs[Math.max(i, 1)][k][1] + 1e-9)) return { ok: false, where: `Uscs ${i},${k}` };
  }
  return { ok: true, worst, count };
}

/* ---------- run one specimen ---------- */
function runSpecimen(name, S, expect) {
  console.log(`\n=== ${name} ===`);
  const t0 = Date.now();
  const G = assembleGalerkin(S);
  const par = parityTests(S, G.V, G.U);
  check(name + ' table parity vs Simpson', par.ok, par.ok ? `${par.count} integrals, worst dev ${par.worst.toExponential(1)}` : par.where);
  // constant row of K encloses 0
  let constOk = true;
  for (let c = 0; c < G.dim; c++) {
    const e = G.K[0][c];
    if (!(e[0] <= 1e-10 && e[1] >= -1e-10)) constOk = false;
  }
  check(name + ' constant-mode row ≈ 0', constOk);
  // symmetry
  let symOk = true;
  for (let a = 0; a < G.dim; a += 17) for (let b = 0; b < G.dim; b += 13) {
    const x = G.K[a][b], y = G.K[b][a];
    if (Math.abs(((x[0] + x[1]) - (y[0] + y[1])) / 2) > 1e-9 * (1 + Math.abs(x[0]))) symOk = false;
  }
  check(name + ' K symmetry', symOk);

  const Kf = mid(G.K), Mf = mid(G.M);
  const eigs = floatEig(Kf, Mf, 4);
  const lam = eigs.map(e => e.lam);
  check(name + ' float λ0 ≈ 0 (constant)', Math.abs(lam[0]) < 1e-8, 'λ0=' + lam[0].toExponential(2));

  // M-normalize trial vectors in float (keeps the small Gram matrix ≈ I, so
  // the Gershgorin pencil bound stays tight; rigor is unaffected — any
  // float subspace is a valid trial subspace)
  const mNorm = v => {
    let s = 0;
    for (let a = 0; a < G.dim; a++) { let row = 0; for (let b = 0; b < G.dim; b++) row += Mf[a][b] * v[b]; s += v[a] * row; }
    return Math.sqrt(s);
  };
  const scale = v => { const n2 = mNorm(v); return Float64Array.from(v, x => x / n2); };
  const e0 = new Float64Array(G.dim); e0[0] = 1;
  const v0 = scale(e0), v1 = scale(eigs[1].vec), v2 = scale(eigs[2].vec);
  const up1 = certifiedUpper(G.K, G.M, [v0, v1]);
  const up2 = certifiedUpper(G.K, G.M, [v0, v1, v2]);
  console.log(JSON.stringify({
    floatMu1: +lam[1].toFixed(8), floatMu2: +lam[2].toFixed(8),
    certUpperMu1: +up1.toFixed(8), certUpperMu2: +up2.toFixed(8),
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  }));
  check(name + ' certified upper ≥ float (sanity)', up1 >= lam[1] - 1e-9 && up2 >= lam[2] - 1e-9);
  if (expect) {
    check(name + ' μ1 upper vs exact', up1 >= expect.mu1 && up1 < expect.mu1 * 1.02,
      `upper ${up1.toFixed(6)} vs exact ${expect.mu1.toFixed(6)}`);
  }
  return { up1, up2, floatMu1: lam[1], floatMu2: lam[2] };
}

/* ---------- main ---------- */
// regression: rectangle 1×(9/10)  (cx=1, dx=0) — exact μ1 = π²
const rect = specimen(1, 1, 0, 1, 9, 10);
const rr = runSpecimen('rectangle 1x0.9', rect, { mu1: Math.PI * Math.PI });

// the flag specimen: steep non-isosceles trapezoid
const trap = specimen(17, 20, 1, 4, 9, 10);
const tr = runSpecimen('steep trapezoid', trap, null);

// FEM cross-check on the trapezoid
const f1 = solveQuad(trap.quad, 64), f2 = solveQuad(trap.quad, 96);
const rich = f2.mu1 + (f2.mu1 - f1.mu1) / (Math.pow(96 / 64, 2) - 1);
console.log(JSON.stringify({ fem64: +f1.mu1.toFixed(6), fem96: +f2.mu1.toFixed(6), femRich: +rich.toFixed(6) }));
check('trapezoid: FEM(rich) ≤ certified upper', rich <= tr.up1 + 1e-6,
  `FEM→${rich.toFixed(6)} vs upper ${tr.up1.toFixed(6)}`);
check('trapezoid: upper is tight (< 1% above FEM)', tr.up1 < rich * 1.01,
  `ratio ${(tr.up1 / rich).toFixed(5)}`);

console.log(failures ? `\nFAILURES: ${failures}` : '\nALL PASS');
process.exit(failures ? 1 : 0);
