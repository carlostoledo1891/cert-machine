#!/usr/bin/env node
/* battery.js — the gate on instruments/regatlas: the record, the kernel against independent routes,
   the atlas's structure, the distances, and five red controls.
   usage: node instruments/regatlas/battery.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const K = require(path.join(__dirname, 'kernel.js'));
const DV = require(path.join(__dirname, 'derive.js'));
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));

let checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'regatlas.json'), 'utf8'));
const t0 = Date.now();
const R = DV.derive();
const ms = Date.now() - t0;
const find = (A, eps) => R.cells.find(c => c.A === A && c.eps === eps);

check('R1  the record re-derived live equals the record (' + (ms / 1000).toFixed(1) + ' s)', JSON.stringify([R.cells, R.distances, R.frontier, R.counts]) === JSON.stringify([REC.cells, REC.distances, REC.frontier, REC.counts]));
check('R2  the code that produced the record is the code on disk', DV.sha(path.join(__dirname, 'kernel.js')) === REC.provenance.sha256 && DV.sha(path.join(__dirname, 'derive.js')) === REC.provenance.deriveSha256);

/* ---- the kernel against independent routes ---- */
/* the constant solution at A = 0: u ≡ 1 − ε exactly; the ball must contain it */
/* at A = 0 the solution is the constant root of ε u³ + u = 1: the cubic must change sign across the ball's zero mode */
const cubic = (eps, u) => I.sub(I.add(I.mul(I.iv(eps), I.pow(u, 3)), u), I.ONE);
check('K1  at A = 0 every ε certifies, the higher modes are 0, and the cubic ε u³ + u − 1 changes sign across [ū_0 − r, ū_0 + r] (the ball holds the exact constant solution)', R.eps.every(eps => { const c = find(0, eps); return c.ok && c.u.slice(1).every(v => v === 0) && cubic(eps, I.iv(c.u[0] - c.r))[1] < 0 && cubic(eps, I.iv(c.u[0] + c.r))[0] > 0; }), R.eps.map(eps => find(0, eps).r.toExponential(1)).join(' '));
/* a finite-difference Newton solve on a periodic grid, an independent discretisation */
function fdSolve(P, M) {
  const h = 1 / M, x = Array.from({ length: M }, (_, j) => j * h), V = x.map(xx => P.A * Math.cos(2 * Math.PI * xx));
  const F = (u) => { const up = u.map((_, j) => (u[(j + 1) % M] - u[(j - 1 + M) % M]) / (2 * h)); const m = u.map((v, j) => v + up[j] * up[j] / 2 - V[j]); const q = m.map((v, j) => v * up[j] + P.eps * up[j] ** 3); return u.map((v, j) => m[j] - (q[(j + 1) % M] - q[(j - 1 + M) % M]) / (2 * h) + P.eps * v ** 3 - 1); };
  let u = new Array(M).fill(1 - P.eps);
  for (let it = 0; it < 30; it++) {
    const f = F(u); if (Math.max(...f.map(Math.abs)) < 1e-12) break;
    const J = []; for (let i = 0; i < M; i++) J.push(new Array(M).fill(0));
    for (let j = 0; j < M; j++) { const u2 = u.slice(); u2[j] += 1e-7; const f2 = F(u2); for (let i = 0; i < M; i++) J[i][j] = (f2[i] - f[i]) / 1e-7; }
    const A = J.map(r => r.slice()), b = f.map(v => -v);
    for (let k = 0; k < M; k++) { let p = k; for (let r = k + 1; r < M; r++) if (Math.abs(A[r][k]) > Math.abs(A[p][k])) p = r; [A[k], A[p]] = [A[p], A[k]]; [b[k], b[p]] = [b[p], b[k]]; for (let r = k + 1; r < M; r++) { const fct = A[r][k] / A[k][k]; if (!fct) continue; for (let c = k; c < M; c++) A[r][c] -= fct * A[k][c]; b[r] -= fct * b[k]; } }
    const du = new Array(M); for (let k = M - 1; k >= 0; k--) { let s = b[k]; for (let c = k + 1; c < M; c++) s -= A[k][c] * du[c]; du[k] = s / A[k][k]; }
    for (let j = 0; j < M; j++) u[j] += du[j];
  }
  return { u, x };
}
{
  let ok = true, worst = 0;
  for (const [A, eps] of [[0.3, 0], [0.5, 0.1], [0.5, 0.3]]) {
    const c = find(A, eps); if (!c.ok) { ok = false; continue; }
    const cand = K.candidate({ A, eps }, c.N), fd = fdSolve({ A, eps }, 96);
    let d = 0; for (let j = 0; j < 96; j++) d = Math.max(d, Math.abs(fd.u[j] - DV.evalCos(cand.u, fd.x[j])));
    worst = Math.max(worst, d); if (d > 1e-3) ok = false;
  }
  check('K2  a second-order finite-difference solve on 96 points (an independent discretisation) agrees with the certified candidate to 1e−3 at three proved cells', ok, 'max deviation ' + worst.toExponential(2));
}
check('K3  every PROVED cell has κ < 1, r > 0, Y0 ≤ r, and the density bounded below by a positive number on the ball', R.cells.filter(c => c.ok).every(c => c.kappa < 1 && c.r > 0 && c.Y0 <= c.r && c.mLow > 0));
check('K4  the linearisation is elliptic on every certified cell: c_0 > 0 and e_0 ≥ 0 as intervals, at ε = 0 as at ε > 0', R.cells.filter(c => c.ok).every(c => c.c0[0] > 0 && c.e0[0] >= 0));

/* ---- the atlas ---- */
check('A1  every row of the atlas is PROVED then REFUSED along A (no proved cell beyond a refused one)', R.frontier.every(f => f.monotone), R.frontier.map(f => 'ε = ' + f.eps + ' → ' + f.lastProved).join(' · '));
check('A2  ε = 0 certifies at every amplitude the smallest positive ε does: the certifier needs no regularisation', R.frontier[0].lastProved >= R.frontier[1].lastProved, R.frontier[0].lastProved + ' vs ' + R.frontier[1].lastProved);
check('A3  every refusal is by name: Z1 ≥ 1, Z1 near 1 with no radius closing, or the density floor; none is a crash', R.cells.filter(c => !c.ok).every(c => c.why.startsWith('Z1') || c.why.startsWith('discriminant') || c.why.startsWith('the density') || c.why.startsWith('the mean')) && !R.counts.byWhy.other, JSON.stringify(R.counts.byWhy));
check('D1  at A = 0 the decided distance is 1 − u_ε with u_ε the enclosed root of the cubic: the bracket contains 1 − ū_ε to the radii', R.distances.filter(d => d.A === 0).every(d => { const c = find(0, d.eps); return d.decided && d.lo <= 1 - c.u[0] + c.r && 1 - c.u[0] - c.r <= d.hi; }));
check('D2  at every proved amplitude the distance ‖u_ε − u_0‖ increases with ε, and its bracket is narrower than 1e−5', R.amps.every(A => { const ds = R.distances.filter(d => d.A === A && d.decided); return ds.every((d, i) => i === 0 || d.lo >= ds[i - 1].hi) && ds.every(d => d.hi - d.lo < 1e-5); }), 'widest bracket ' + Math.max(...R.distances.filter(d => d.decided).map(d => d.hi - d.lo)).toExponential(1));
check('D3  the distance is of order ε and sublinear: at A = 0.4 the ratio ‖u_ε − u_0‖/ε decreases with ε and stays between 0.3 and 2', (() => { const ds = R.distances.filter(d => d.A === 0.4 && d.decided); return ds.every(d => d.hi / d.eps > 0.3 && d.lo / d.eps < 2) && ds.every((d, i) => i === 0 || d.hi / d.eps <= ds[i - 1].hi / ds[i - 1].eps); })(), R.distances.filter(d => d.A === 0.4 && d.decided).map(d => (d.hi / d.eps).toFixed(3)).join(' '));

/* ---- red controls ---- */
{ const c = find(0.3, 0), cand = K.candidate({ A: 0.3, eps: 0 }, c.N); const u2 = cand.u.slice(); u2[1] += 1e-3; const r2 = K.certify(u2, { A: 0.3, eps: 0 }, { nu: R.nu });
  check('X1  RED ok: the candidate shifted by 1e−3 in mode 1 is refused or enclosed only by a ball wider than the shift', !r2.ok || r2.r >= 1e-3, r2.ok ? 'r = ' + r2.r.toExponential(2) : r2.why.slice(0, 40)); }
{ const c = find(0.3, 0.1), cand = K.candidate({ A: 0.3, eps: 0.1 }, c.N); const r2 = K.certify(cand.u, { A: 0.3, eps: -0.5 }, { nu: R.nu });
  check('X2  RED ok: the regularisation with the wrong sign (ε = −0.5) is refused by name', !r2.ok, r2.why && r2.why.slice(0, 50)); }
{ const cand = K.candidate({ A: 0.3, eps: 0 }, 24); const u2 = cand.u.slice(); u2[0] += 0.5; const r2 = K.certify(u2, { A: 0.3, eps: 0 }, { nu: R.nu });
  check('X3  RED ok: a candidate on no branch (u + ½) closes no radius', !r2.ok, r2.why && r2.why.slice(0, 50)); }
{ const dip = [I.iv(0.5), I.iv(-0.4)]; check('X4  RED ok: the torus minimum of 0.5 − 0.8 cos 2πx is negative', K.minOnTorus(dip, 256) < 0, K.minOnTorus(dip, 256).toFixed(3)); }
{ const c = find(0.9, 0); check('X5  RED ok: the refused cell at A = 0.9 stays refused when its candidate is re-certified with a wider ν (the refusal is not a ν artefact)', !K.certify(K.candidate({ A: 0.9, eps: 0 }, c.N).u, { A: 0.9, eps: 0 }, { nu: 1.02 }).ok); }

console.log(fails === 0 ? 'ALL PASS   (' + checks + ' checks, 5 red controls)' : fails + ' FAILED of ' + checks);
process.exit(fails === 0 ? 0 : 1);
