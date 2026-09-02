/* stage-spectrum.js — certified two-sided spectrum localization.
   instruments/hotspots · cert-machine (ember port, 2026-09-02)

   Port of run-p2a.js (interval Galerkin UPPER bounds: exact-rational
   v-tables, closed-form u-integrals over interval π, Rayleigh–Ritz with a
   Gershgorin pencil bound — floats only pick the trial subspace) and
   run-p2a2.js (Crouzeix–Raviart LOWER bounds: exact-rational assembly,
   K·1 = 0 exact, Liu's framework theorem + the 0.1893·h_K CR constant,
   discrete eigenvalue counts by interval LDLᵀ inertia with diagonal
   pivoting — Sylvester). Sources pinned in frontier-ref/. Deltas:
   the float-FEM cross-check (lib.js) is NOT ported — diagnostics; the
   independent upper bound lives in stage-cross.js on a different basis.
   Calibration: the 1×(9/10) rectangle regression (exact μ1 = π²) runs
   first, every run. MIT. */
'use strict';

const I = require('../interval/interval.js');
const T = require('../interval/transcendental.js');
const Q = require('../interval/rational.js');
const SP = require('./specimen.js');

const NU = 12, NV = 12;
const r = SP.r_;
const ratToIv = SP.ratToIv;
const iv2 = I.iv;

/* ---------- rational polynomial helpers ---------- */
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

/* ---------- specimen pullback constants ---------- */
function specimen(cxN, cxD, dxN, dxD, hN, hD) {
  const cx = r(cxN, cxD), dx = r(dxN, dxD), h = r(hN, hD), b = Q.ONE;
  const w1 = Q.sub(Q.sub(cx, dx), b);          // w(v) = b + w1 v
  const q = Q.neg(w1);                          // 1/w = 1/(1 - q v), need |q|<1
  return { cx, dx, h, b, w1, q };
}

/* ---------- shifted Legendre (exact) ---------- */
function legendre(NV_) {
  const P = [[Q.ONE], [r(-1), r(2)]];
  for (let j = 1; j < NV_; j++) {
    const t = pMul([r(-(2 * j + 1)), r(2 * (2 * j + 1))], P[j]);
    const u = pScale(P[j - 1], r(-j));
    P.push(pScale(pAdd(t, u), Q.div(Q.ONE, r(j + 1))));
  }
  return P;
}

/* ---------- v-tables (exact rationals; intervals enter LAST) ---------- */
function vTables(S) {
  const P = legendre(NV);
  const wPoly = [S.b, S.w1];
  const qd = Q.toDouble(S.q);
  if (!(qd > -1 && qd < 1)) throw new Error('specimen out of series range');
  const TT = 110;
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
  return { Vw, Dw, W, Vinv, P };
}

/* ---------- u-tables (closed forms over interval π) ---------- */
function uTables(S) {
  const PI = T.PI, PI2 = I.sqr(PI);
  const p0 = Q.add(Q.mul(S.h, S.h), Q.mul(S.dx, S.dx));
  const p1 = Q.mul(r(2), Q.mul(S.w1, S.dx));
  const p2 = Q.mul(S.w1, S.w1);
  const [ip0, ip1, ip2] = [p0, p1, p2].map(ratToIv);
  const idx = ratToIv(S.dx), iw1 = ratToIv(S.w1);
  const sgn = m => (m % 2 === 0 ? 1 : -1);
  function Cpoly(m) {
    m = Math.abs(m);
    if (m === 0) return ratToIv(Q.add(p0, Q.add(Q.div(p1, r(2)), Q.div(p2, r(3)))));
    const den = I.mul(iv2(m * m), PI2);
    const num = I.add(I.mul(ip1, iv2(sgn(m) - 1)), I.mul(ip2, iv2(2 * sgn(m))));
    return I.div(num, den);
  }
  function Spoly(m) {
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
  return { Ussp, Uscs, Ucc, PI2, p0, p1, p2 };
}

/* ---------- Galerkin assembly ---------- */
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
  return { K, M, dim, V, U };
}

/* ---------- float eigensolve (subspace picker only) ---------- */
const mid = A => A.map(row => row.map(e => (e[0] + e[1]) / 2));
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
function forwardSolve(L, x) {
  const n = L.length, y = Float64Array.from(x);
  for (let i = 0; i < n; i++) { for (let k = 0; k < i; k++) y[i] -= L[i][k] * y[k]; y[i] /= L[i][i]; }
  return y;
}
function backSolveT(L, x) {
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
  const C = [];
  for (let i = 0; i < n; i++) C.push(new Float64Array(n));
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

/* ---------- certified small-pencil upper bound (Gershgorin) ---------- */
function ivQuadForm(A, v, w) {
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
function certifiedUpper(K, M, vecs) {
  const rdim = vecs.length;
  const A = [], B = [];
  for (let a = 0; a < rdim; a++) {
    A.push([]); B.push([]);
    for (let b = 0; b < rdim; b++) {
      A[a].push(ivQuadForm(K, vecs[a], vecs[b]));
      B[a].push(ivQuadForm(M, vecs[a], vecs[b]));
    }
  }
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

/* ---------- parity selftests vs Simpson ---------- */
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

/* ---------- Galerkin upper bounds for one specimen ---------- */
function galerkinUppers(S, checks, name) {
  const G = assembleGalerkin(S);
  const par = parityTests(S, G.V, G.U);
  checks.push({ name: name + ': table parity vs Simpson', ok: par.ok, detail: par.ok ? `${par.count} integrals, worst dev ${par.worst.toExponential(1)}` : par.where });
  let constOk = true;
  for (let c = 0; c < G.dim; c++) {
    const e = G.K[0][c];
    if (!(e[0] <= 1e-10 && e[1] >= -1e-10)) constOk = false;
  }
  checks.push({ name: name + ': constant-mode row encloses 0', ok: constOk });
  const Kf = mid(G.K), Mf = mid(G.M);
  const eigs = floatEig(Kf, Mf, 4);
  const lam = eigs.map(e => e.lam);
  checks.push({ name: name + ': float λ0 ≈ 0 (constant)', ok: Math.abs(lam[0]) < 1e-8 });
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
  checks.push({ name: name + ': certified upper ≥ float (sanity)', ok: up1 >= lam[1] - 1e-9 && up2 >= lam[2] - 1e-9 });
  return { up1, up2, floatMu1: lam[1], floatMu2: lam[2] };
}

/* ---------- CR lower bounds ---------- */
function buildCR(spec, n) {
  const { b, w1, dx, h } = spec;
  const N = n + 1;
  const X = [], Y = [];
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const u = r(i, n), v = r(j, n);
      const w = Q.add(b, Q.mul(w1, v));
      X.push(Q.add(Q.mul(u, w), Q.mul(dx, v)));
      Y.push(Q.mul(h, v));
    }
  }
  const edgeId = new Map();
  const edges = [];
  const eid = (p, q2) => {
    const key = p < q2 ? p + ':' + q2 : q2 + ':' + p;
    if (!edgeId.has(key)) { edgeId.set(key, edges.length); edges.push([Math.min(p, q2), Math.max(p, q2)]); }
    return edgeId.get(key);
  };
  const tris = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = j * N + i, bb = a + 1, c = a + N, d = c + 1;
    tris.push([a, bb, d], [a, d, c]);
  }
  for (const [p1, p2, p3] of tris) { eid(p1, p2); eid(p2, p3); eid(p3, p1); }
  const ndof = edges.length;
  const K = Array.from({ length: ndof }, () => new Map());
  const Md = Array.from({ length: ndof }, () => Q.ZERO);
  let hmax2 = Q.ZERO;
  for (const [p1, p2, p3] of tris) {
    const x1 = X[p1], y1 = Y[p1], x2 = X[p2], y2 = Y[p2], x3 = X[p3], y3 = Y[p3];
    const twoA = Q.sub(Q.mul(Q.sub(x2, x1), Q.sub(y3, y1)), Q.mul(Q.sub(x3, x1), Q.sub(y2, y1)));
    if (Q.sign(twoA) <= 0) throw new Error('non-positive triangle');
    const A = Q.div(twoA, r(2));
    const g = [
      [Q.sub(y2, y3), Q.sub(x3, x2)],
      [Q.sub(y3, y1), Q.sub(x1, x3)],
      [Q.sub(y1, y2), Q.sub(x2, x1)],
    ];
    const ids = [eid(p2, p3), eid(p3, p1), eid(p1, p2)];
    for (let a2 = 0; a2 < 3; a2++) {
      for (let b2 = 0; b2 < 3; b2++) {
        const val = Q.div(Q.add(Q.mul(g[a2][0], g[b2][0]), Q.mul(g[a2][1], g[b2][1])), A);
        const row = K[ids[a2]];
        row.set(ids[b2], Q.add(row.get(ids[b2]) || Q.ZERO, val));
      }
      Md[ids[a2]] = Q.add(Md[ids[a2]], Q.div(A, r(3)));
    }
    for (const [pa, pb] of [[p1, p2], [p2, p3], [p3, p1]]) {
      const l2 = Q.add(Q.mul(Q.sub(X[pa], X[pb]), Q.sub(X[pa], X[pb])),
                       Q.mul(Q.sub(Y[pa], Y[pb]), Q.sub(Y[pa], Y[pb])));
      if (Q.cmp(l2, hmax2) > 0) hmax2 = l2;
    }
  }
  return { K, Md, ndof, hmax2, X, Y, tris };
}
function checkKernelExact(K) {
  for (const row of K) {
    let s = Q.ZERO;
    for (const v of row.values()) s = Q.add(s, v);
    if (!Q.isZero(s)) return false;
  }
  return true;
}
function jacobiSmallest(Kq, Mdq, count) {
  const n = Kq.length;
  const d = Mdq.map(x => 1 / Math.sqrt(Q.toDouble(x)));
  const A = Array.from({ length: n }, () => new Float64Array(n));
  for (let i2 = 0; i2 < n; i2++)
    for (const [j2, v] of Kq[i2]) A[i2][j2] = Q.toDouble(v) * d[i2] * d[j2];
  for (let sweep = 0; sweep < 24; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q3 = p + 1; q3 < n; q3++) off += A[p][q3] * A[p][q3];
    if (off < 1e-20 * n * n) break;
    for (let p = 0; p < n; p++) for (let q3 = p + 1; q3 < n; q3++) {
      if (Math.abs(A[p][q3]) < 1e-14) continue;
      const th = (A[q3][q3] - A[p][p]) / (2 * A[p][q3]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k2 = 0; k2 < n; k2++) {
        const akp = A[k2][p], akq = A[k2][q3];
        A[k2][p] = c * akp - s * akq; A[k2][q3] = s * akp + c * akq;
      }
      for (let k2 = 0; k2 < n; k2++) {
        const apk = A[p][k2], aqk = A[q3][k2];
        A[p][k2] = c * apk - s * aqk; A[q3][k2] = s * apk + c * aqk;
      }
    }
  }
  const lam = [];
  for (let i2 = 0; i2 < n; i2++) lam.push(A[i2][i2]);
  lam.sort((a, b) => a - b);
  return lam.slice(0, count);
}
function mulIv(al, ah, bl, bh) {
  const p1 = al * bl, p2 = al * bh, p3 = ah * bl, p4 = ah * bh;
  return [I.nextDown(Math.min(p1, p2, p3, p4)), I.nextUp(Math.max(p1, p2, p3, p4))];
}
function inertiaBelow(Kq, Mdq, sigmaQ) {
  const n = Kq.length;
  const s = new Float64Array(n);
  for (let i2 = 0; i2 < n; i2++) {
    const dQ = Q.sub(Kq[i2].get(i2) || Q.ZERO, Q.mul(sigmaQ, Mdq[i2]));
    const dv = Math.abs(Q.toDouble(dQ));
    s[i2] = dv > 0 ? 1 / Math.sqrt(dv) : 1;
  }
  const lo = Array.from({ length: n }, () => new Float64Array(n));
  const hi = Array.from({ length: n }, () => new Float64Array(n));
  for (let i2 = 0; i2 < n; i2++) {
    for (const [j2, v] of Kq[i2]) {
      const e = ratToIv(j2 === i2 ? Q.sub(v, Q.mul(sigmaQ, Mdq[i2])) : v);
      const sc = mulIv(e[0], e[1], s[i2] * s[j2], s[i2] * s[j2]);
      lo[i2][j2] = sc[0]; hi[i2][j2] = sc[1];
    }
    if (!Kq[i2].has(i2)) {
      const e = ratToIv(Q.neg(Q.mul(sigmaQ, Mdq[i2])));
      const sc = mulIv(e[0], e[1], s[i2] * s[i2], s[i2] * s[i2]);
      lo[i2][i2] = sc[0]; hi[i2][i2] = sc[1];
    }
  }
  const perm = Array.from({ length: n }, (_, i2) => i2);
  let neg = 0;
  for (let step = 0; step < n; step++) {
    let best = -1, bestMig = -1;
    for (let t = step; t < n; t++) {
      const i2 = perm[t];
      const a = lo[i2][i2], b2 = hi[i2][i2];
      const mig = a > 0 ? a : (b2 < 0 ? -b2 : -1);
      if (mig > bestMig) { bestMig = mig; best = t; }
    }
    if (bestMig <= 0) {
      const i2 = perm[best < 0 ? step : best];
      return { ok: false, at: step, piv: [lo[i2][i2], hi[i2][i2]], neg };
    }
    const tmp = perm[step]; perm[step] = perm[best]; perm[best] = tmp;
    const p = perm[step];
    const plo = lo[p][p], phi = hi[p][p];
    if (phi < 0) neg++;
    for (let ti = step + 1; ti < n; ti++) {
      const i2 = perm[ti];
      const ra = lo[i2][p], rb = hi[i2][p];
      if (ra === 0 && rb === 0) continue;
      const q1 = ra / plo, q2 = ra / phi, q3 = rb / plo, q4 = rb / phi;
      const tl = I.nextDown(Math.min(q1, q2, q3, q4)), th = I.nextUp(Math.max(q1, q2, q3, q4));
      for (let tj = ti; tj < n; tj++) {
        const j2 = perm[tj];
        const ja = lo[j2][p], jb = hi[j2][p];
        if (ja === 0 && jb === 0) continue;
        const m = mulIv(tl, th, ja, jb);
        const nlo = I.nextDown(lo[i2][j2] - m[1]);
        const nhi = I.nextUp(hi[i2][j2] - m[0]);
        lo[i2][j2] = nlo; hi[i2][j2] = nhi;
        lo[j2][i2] = nlo; hi[j2][i2] = nhi;
      }
    }
  }
  return { ok: true, neg };
}
function certifiedLower(Kq, Mdq, lamFloat, kNonzero, Ch2) {
  const target = lamFloat[kNonzero];
  const sigma = Q.fromDouble(target * (1 - 1e-4));
  const inr = inertiaBelow(Kq, Mdq, sigma);
  if (!inr.ok) return { ok: false, why: 'pivot sign undecided at ' + inr.at };
  if (inr.neg !== kNonzero) return { ok: false, why: `inertia ${inr.neg} ≠ ${kNonzero}` };
  const sIv = ratToIv(sigma);
  const denom = I.add(I.ONE, I.mul(Ch2, sIv));
  const bound = I.div(sIv, denom);
  return { ok: true, lower: bound[0], sigma: Q.toDouble(sigma) };
}
function crLowers(spec, n, checks, name) {
  const { K, Md, ndof, hmax2 } = buildCR(spec, n);
  checks.push({ name: name + ': K·1 = 0 exactly (rational)', ok: checkKernelExact(K) });
  let mdPos = true;
  for (const v of Md) if (Q.sign(v) <= 0) mdPos = false;
  checks.push({ name: name + ': M diagonal positive', ok: mdPos });
  const lam = jacobiSmallest(K, Md, 5);
  checks.push({ name: name + ': float λ_h,1 ≈ 0', ok: Math.abs(lam[0]) < 1e-9 });
  const Ch2 = ratToIv(Q.mul(Q.mul(r(1893, 10000), r(1893, 10000)), hmax2));
  const lo1 = certifiedLower(K, Md, lam, 1, Ch2);
  const lo2 = certifiedLower(K, Md, lam, 2, Ch2);
  checks.push({ name: name + ': inertia certificate μ1', ok: lo1.ok, detail: lo1.ok ? `σ=${lo1.sigma.toFixed(6)}` : lo1.why });
  checks.push({ name: name + ': inertia certificate μ2', ok: lo2.ok, detail: lo2.ok ? `σ=${lo2.sigma.toFixed(6)}` : lo2.why });
  return { lo1, lo2, ndof, hmax: Math.sqrt(Q.toDouble(hmax2)) };
}

/* ---------- the stage ---------- */
function run() {
  const checks = [];
  const t0 = Date.now();

  /* the two literature inputs enter HERE (Thm 2.4 + Lemma 3.2's 0.1893);
     the pinned source is re-hashed at certify time — drift refuses */
  const pin = require('../pin.js').verify('liu2018_arxiv-1808-08148.pdf');
  checks.push({ name: 'Liu arXiv:1808.08148 pin re-hashed (the two literature inputs)', ok: pin.ok, detail: pin.ok ? pin.sha256.slice(0, 16) : pin.why });

  /* calibration: rectangle 1×(9/10), exact μ1 = π² */
  const rect = specimen(1, 1, 0, 1, 9, 10);
  const rg = galerkinUppers(rect, checks, 'rectangle');
  checks.push({
    name: 'rectangle: certified upper vs exact π²',
    ok: rg.up1 >= Math.PI * Math.PI && rg.up1 < Math.PI * Math.PI * 1.02,
    detail: `upper ${rg.up1.toFixed(7)} vs π² ${(Math.PI * Math.PI).toFixed(7)}`,
  });
  const rc = crLowers(rect, 12, checks, 'rectangle CR');
  checks.push({
    name: 'rectangle: two-sided enclosure contains π²',
    ok: rc.lo1.ok && rc.lo1.lower <= Math.PI * Math.PI && Math.PI * Math.PI <= rg.up1,
    detail: `[${rc.lo1.lower.toFixed(6)}, ${rg.up1.toFixed(6)}]`,
  });

  /* the specimen */
  const trap = specimen(17, 20, 1, 4, 9, 10);
  const tg = galerkinUppers(trap, checks, 'trapezoid');
  const tc = crLowers(trap, 12, checks, 'trapezoid CR');
  const mu1 = [tc.lo1.lower, tg.up1];
  const mu2lo = tc.lo2.lower;
  checks.push({ name: 'trapezoid: μ1 lower ≤ upper', ok: mu1[0] <= mu1[1], detail: `[${mu1[0].toFixed(6)}, ${mu1[1].toFixed(6)}]` });
  checks.push({
    name: 'trapezoid: CERTIFIED SPECTRAL GAP — lower(μ2) > upper(μ1) ⇒ μ1 SIMPLE',
    ok: mu2lo > mu1[1],
    detail: `${mu2lo.toFixed(6)} > ${mu1[1].toFixed(6)}`,
  });

  const ok = checks.every(c => c.ok);
  return {
    verdict: ok ? 'VERIFIED' : 'REFUSED',
    statement: 'Two-sided spectrum localization for the trapezoid: μ1 ∈ [lower, upper] with exactly one nonzero eigenvalue below μ2lo, hence μ1 is simple. Uppers: interval Galerkin Rayleigh–Ritz (floats only pick the subspace). Lowers: exact-rational Crouzeix–Raviart + interval LDLᵀ inertia + Liu framework Thm 2.4 with the CR constant 0.1893·h_K.',
    mu1,
    mu2lo,
    mu2up: tg.up2,
    simple: mu2lo > mu1[1],
    galerkin: { NU, NV, dim: (NU + 1) * (NV + 1), upperMu1: tg.up1, upperMu2: tg.up2, floatMu1: tg.floatMu1, floatMu2: tg.floatMu2 },
    cr: { n: 12, ndof: tc.ndof, hmax: tc.hmax, sigma1: tc.lo1.sigma, sigma2: tc.lo2.sigma, lowerMu1: tc.lo1.lower, lowerMu2: tc.lo2.lower },
    calibration: { rectangleUpperMu1: rg.up1, rectangleLowerMu1: rc.lo1.lower, exact: 'π²' },
    checks,
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  };
}

module.exports = { run, specimen, buildCR, checkKernelExact, jacobiSmallest, inertiaBelow, certifiedLower, assembleGalerkin, floatEig, certifiedUpper, galerkinUppers };
