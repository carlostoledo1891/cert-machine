/* derive.js — the atlas: every (A, ε) cell certified or refused by name, the regularisation measured.
   instruments/regatlas · cert-machine · 2026-09-07 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const K = require(path.join(__dirname, 'kernel.js'));
const CERT = require(path.join(__dirname, '..', 'interval', 'certificate.js'));

const AMPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const EPS = [0, 0.01, 0.1, 0.3, 1];
const NU = 1.05;
const NOF = (A) => (A <= 0.4 ? 24 : A <= 0.7 ? 32 : 40);
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const evalCos = (u, x) => { let s = u[0]; for (let k = 1; k < u.length; k++) s += 2 * u[k] * Math.cos(2 * Math.PI * k * x); return s; };
const mOf = (u, P, x) => { let up = 0; for (let k = 1; k < u.length; k++) up -= 2 * u[k] * 2 * Math.PI * k * Math.sin(2 * Math.PI * k * x); return evalCos(u, x) + up * up / 2 - P.A * Math.cos(2 * Math.PI * x); };

function cell(A, eps) {
  const P = { A, eps }, N = NOF(A);
  const cand = K.candidate(P, N);
  const c = K.certify(cand.u, P, { nu: NU });
  const falsifier = [
    'a candidate shifted by 1e−3 in its first mode: Y0 rises by the shift and the ball, if any, must be wider than it',
    'ε < 0 (the regularisation with the wrong sign): e_0 < 0 and the tail bound is refused by name',
    'the mean of the principal coefficient forced negative: refused before any radius',
    'a candidate on no branch (u ≡ 1 − ε + ½): the defect is order one and no radius closes',
    'a density with a dip below zero: the torus minimum is negative and the ball is refused'
  ];
  const provenance = { code: 'instruments/regatlas/kernel.js' };
  const claim = 'F_ε(u) = 0 with V = ' + A + ' cos 2πx, ε = ' + eps + ': a unique even solution in the ball of radius r about the ' + N + '-mode candidate in X_2 (ν = ' + NU + '), classical, with density m > 0 on the ball';
  const cert = c.ok
    ? CERT.proved({ claim, evidence: { r: c.r, kappa: c.kappa, Y0: c.Y0, Z1: c.Z1, mLow: c.mLow }, assumes: ['the radii-polynomial bounds of kernel.js (Z1 explicit to 6N columns, analytic beyond; Z2 from the algebra property of the weighted ℓ¹ norm)'], falsifier, provenance })
    : CERT.refused({ claim, why: c.why, falsifier, provenance });
  const out = { A, eps, N, ok: c.ok, verdict: cert.verdict, why: c.ok ? null : c.why, r: c.r === undefined ? null : c.r, kappa: c.kappa === undefined ? null : c.kappa, Y0: c.Y0, Z1: c.Z1, Z1tail: c.Z1tail, Z1worst: c.Z1worst, Anorm: c.Anorm, Z2: c.Z2 === undefined ? null : c.Z2, c0: c.c0, e0: c.e0,
    mMin: c.mMin === undefined ? null : c.mMin, mLow: c.mLow === undefined ? null : c.mLow, mMinFloat: Math.min(...Array.from({ length: 512 }, (_, j) => mOf(cand.u, P, j / 512))), newton: { res: cand.res, it: cand.it }, u: cand.u.slice(0, 6), uAt0: evalCos(cand.u, 0), uAtHalf: evalCos(cand.u, 0.5), mAt0: mOf(cand.u, P, 0), mAtHalf: mOf(cand.u, P, 0.5),
    uFull: cand.u };
  return out;
}

function derive() {
  const cells = [];
  for (const A of AMPS) for (const eps of EPS) cells.push(cell(A, eps));
  const find = (A, eps) => cells.find(c => c.A === A && c.eps === eps);
  /* the regularisation measured: ‖u_ε − u_0‖_2 as a decided bracket wherever both cells are proved */
  const distances = [];
  for (const A of AMPS) {
    const base = find(A, 0);
    for (const eps of EPS.slice(1)) {
      const c = find(A, eps);
      if (!base.ok || !c.ok) { distances.push({ A, eps, decided: false }); continue; }
      const d = K.dist2(c.uFull, base.uFull, NU);
      distances.push({ A, eps, decided: true, d: [d[0], d[1]], lo: Math.max(0, d[0] - c.r - base.r), hi: d[1] + c.r + base.r });
    }
  }
  /* the profiles at A = 0.6: u and m on 129 points, at every proved ε */
  const xs = Array.from({ length: 129 }, (_, j) => j / 128);
  const profiles = EPS.map(eps => { const c = find(0.6, eps); return c.ok ? { eps, u: xs.map(x => evalCos(c.uFull, x)), m: xs.map(x => mOf(c.uFull, { A: 0.6, eps }, x)), r: c.r } : { eps, refused: c.why }; });
  /* the frontier in A at each ε: the last proved amplitude and the first refused one */
  const frontier = EPS.map(eps => { const row = AMPS.map(A => find(A, eps)); const lastOk = row.filter(c => c.ok).map(c => c.A); const firstBad = row.find(c => !c.ok); return { eps, lastProved: lastOk.length ? Math.max(...lastOk) : null, firstRefused: firstBad ? firstBad.A : null, firstWhy: firstBad ? firstBad.why : null, monotone: row.every((c, i) => i === 0 || c.ok || !row.slice(i).some(d => d.ok)) }; });
  const counts = { proved: cells.filter(c => c.ok).length, refused: cells.filter(c => !c.ok).length, byWhy: {} };
  for (const c of cells) if (!c.ok) { const key = c.why.startsWith('Z1') ? 'Z1 ≥ 1' : c.why.startsWith('discriminant') ? 'Z1 near 1, no radius closes' : c.why.startsWith('the density') ? 'density floor' : 'other'; counts.byWhy[key] = (counts.byWhy[key] || 0) + 1; }
  const light = cells.map(c => { const o = Object.assign({}, c); delete o.uFull; return o; });
  return { amps: AMPS, eps: EPS, nu: NU, cells: light, distances, profiles, xs, frontier, counts };
}

module.exports = { derive, cell, AMPS, EPS, NU, NOF, sha, evalCos, mOf };
