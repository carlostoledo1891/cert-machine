#!/usr/bin/env node
/* instruments/bandeira/verify.js — the Lai--Lim (5,5) Farkas certificate decided a second time, in JavaScript, in exact
   BigInt rationals, from the same definition and sharing no code with instruments/bandeira/verify.py (the same author,
   the same specification: an N-version check, counted as such).

   The SDP's constraints are built here from Lai--Lim's definition: the 3906 monomials of degree <= 5 over five
   letters in order (by degree, then lexicographic), the 31 basis monomials of degree <= 2, the six linear constraints
   X_1..X_5 and 5 - sum X_i, the Gram form under a stated transpose convention; the certificate (y0, y) is a Farkas
   certificate iff m00 = y0 + y_1 < 0, each block Phi_i is positive definite (exact LDL^T, every pivot > 0) and
   120 y0 - sum_{distinct 5-words} y_w > 0.

   usage: node instruments/bandeira/verify.js corpus/bandeira/certificate-cm.json [leftT|rightT|none]          MIT */
'use strict';
const fs = require('fs');

/* ---- exact rationals on BigInt ---- */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
const Q = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; };
const add = (x, y) => Q(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
const sub = (x, y) => Q(x[0] * y[1] - y[0] * x[1], x[1] * y[1]);
const mul = (x, y) => Q(x[0] * y[0], x[1] * y[1]);
const div = (x, y) => Q(x[0] * y[1], x[1] * y[0]);
const sign = (x) => (x[0] > 0n ? 1 : x[0] < 0n ? -1 : 0);
const show = (x) => x[1] === 1n ? String(x[0]) : String(x[0]) + '/' + String(x[1]);

/* ---- words and the Gram form ---- */
function words(n, dmax) {
  const out = [[]];
  let layer = [[]];
  for (let d = 1; d <= dmax; d++) {
    const next = [];
    for (const w of layer) for (let i = 0; i < n; i++) next.push(w.concat([i]));
    out.push(...next); layer = next;
  }
  return out;
}
const key = (w) => w.join(',');

function decide(cert, convention) {
  const N = 5, DB = 2, DM = 5, L0 = 120n;
  const monos = words(N, DM);
  if (cert.y_num.length !== monos.length) return { verdict: 'REFUSED', why: 'wrong number of multipliers' };
  const phi = new Map();
  monos.forEach((w, t) => phi.set(key(w), Q(BigInt(cert.y_num[t]), BigInt(cert.y_den[t]))));
  const y0 = Q(BigInt(cert.y0[0]), BigInt(cert.y0[1]));
  const beta = words(N, DB);
  const ell = [];
  for (let i = 0; i < N; i++) ell.push([[[i], Q(1n)]]);
  ell.push([[[], Q(BigInt(N))]].concat(Array.from({ length: N }, (_, i) => [[i], Q(-1n)])));
  const rev = (w) => w.slice().reverse();
  const blocks = [];
  for (let i = 0; i <= N; i++) {
    const q = beta.length;
    const P = Array.from({ length: q }, () => Array(q));
    for (let a = 0; a < q; a++) for (let b = 0; b < q; b++) {
      const ba = convention === 'leftT' ? rev(beta[a]) : beta[a];
      const bb = convention === 'rightT' ? rev(beta[b]) : beta[b];
      let s = Q(0n);
      for (const [mid, c] of ell[i]) s = add(s, mul(c, phi.get(key(ba.concat(mid, bb)))));
      P[a][b] = s;
    }
    const Phi = Array.from({ length: q }, (_, a) => Array.from({ length: q }, (_, b) => div(add(P[a][b], P[b][a]), Q(2n))));
    /* exact LDL^T */
    let pd = true, minPiv = null;
    const M = Phi.map((r) => r.slice());
    for (let k = 0; k < q && pd; k++) {
      const d = M[k][k];
      if (sign(d) <= 0) { pd = false; minPiv = d; break; }
      if (minPiv === null || sign(sub(d, minPiv)) < 0) minPiv = d;
      for (let r = k + 1; r < q; r++) {
        if (sign(M[r][k]) === 0) continue;
        const f = div(M[r][k], d);
        for (let c = k; c < q; c++) M[r][c] = sub(M[r][c], mul(f, M[k][c]));
      }
    }
    blocks.push({ block: i + 1, positiveDefinite: pd, minPivot: show(minPiv) });
  }
  const m00 = add(y0, phi.get(''));
  let scalar = mul(Q(L0), y0);
  for (const w of monos) if (w.length === DM && new Set(w).size === DM) scalar = sub(scalar, phi.get(key(w)));
  const ok = sign(m00) < 0 && blocks.every((b) => b.positiveDefinite) && sign(scalar) > 0;
  return { verdict: ok ? 'CERTIFIED' : 'REFUTED', convention, m00: show(m00), scalar: show(scalar), blocks };
}

if (require.main === module) {
  const cert = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const conv = process.argv[3] || 'leftT';
  const t0 = Date.now();
  const r = decide(cert, conv);
  r.ms = Date.now() - t0;
  console.log(JSON.stringify(r));
  process.exit(r.verdict === 'CERTIFIED' ? 0 : 1);
}
module.exports = { decide };
