#!/usr/bin/env node
/* decide.js — what the model's own answers can and cannot be, decided exactly.
   node playground/neural-geometry/decide.js

   THE DATA IS INTEGERS, so the decisions are arithmetic and not thresholds.
   Three things get decided, in exact rationals, before anything is drawn:

   1. ASYMMETRY. D[i][j] and D[j][i] came from two calls that never saw each
      other. Their disagreement is a consistency test nobody asked the model to
      pass, and it is the first thing worth knowing: a model answering from a
      real geometry has a reason to be symmetric, and one answering from a
      reflex does not.

   2. THE CLOSURE RATIO — the headline, and it needs no embedding at all. Walk
      the items in their natural order and take the distances between
      neighbours; then take the distance from the last back to the first. On a
      CIRCLE that closing step is one more neighbour step and the ratio is
      about one. On a LINE it is the whole length and the ratio is about n − 1.
      This is a statement about the answers themselves, exact, with no
      projection in between.

   3. THE SIGNATURE. By Schoenberg, a distance matrix is Euclidean exactly when
      the doubly-centred Gram matrix is positive semidefinite, and then its rank
      is the smallest dimension the points fit in. Real answers are not exactly
      Euclidean, so the honest quantity is the SIGNATURE (p, q, z) computed by
      exact symmetric congruence — how many Euclidean directions the answers
      need, and how many directions of genuine non-Euclidean distortion they
      carry. Sylvester's law makes that basis-independent, and rationals make it
      decidable.

   The 2D coordinates the page draws come afterwards, from a float eigensolver,
   and are labelled as a view.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const R = require('../rational.js');
const SETS = require('./sets.js');
const HERE = __dirname;

const P = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'probe.json'), 'utf8'));
const half = R.make(1n, 2n);

/* --- exact pieces --------------------------------------------------------- */

/* symmetrised distances as exact rationals: integers, halved */
function symmetrise(raw, n) {
  const D = [];
  for (let i = 0; i < n; i++) {
    D.push([]);
    for (let j = 0; j < n; j++) {
      D[i][j] = R.mul(half, R.add(R.int(raw[i][j]), R.int(raw[j][i])));
    }
  }
  return D;
}

function asymmetry(raw, n) {
  let max = 0, sum = 0, k = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d = Math.abs(raw[i][j] - raw[j][i]); max = Math.max(max, d); sum += d; k++;
  }
  return { max, mean: k ? sum / k : 0, pairs: k };
}

/* the closing step against its neighbours, exactly. Returns the ratio as a
   rational and the pieces it is made of, because a ratio with no numerator on
   the page is a number nobody can check. */
function closure(D, n) {
  const steps = [];
  for (let i = 0; i + 1 < n; i++) steps.push(D[i][i + 1]);
  const close = D[n - 1][0];
  const sorted = steps.slice().sort((a, b) => R.cmp(a, b));
  const med = sorted.length % 2 ? sorted[(sorted.length - 1) / 2]
    : R.mul(half, R.add(sorted[sorted.length / 2 - 1], sorted[sorted.length / 2]));
  return {
    ratio: R.sign(med) === 0 ? null : R.toNumber(R.div(close, med)),
    closing: R.toNumber(close), median: R.toNumber(med),
    steps: steps.map(R.toNumber),
  };
}

/* Gram of the doubly-centred squared distances, exactly:
   G[i][j] = -½ ( D²[i][j] − rowᵢ − rowⱼ + grand ) */
function gram(D, n) {
  const S = D.map((r) => r.map((d) => R.mul(d, d)));
  const rows = S.map((r) => R.div(r.reduce((a, x) => R.add(a, x), R.int(0)), R.int(n)));
  const grand = R.div(rows.reduce((a, x) => R.add(a, x), R.int(0)), R.int(n));
  const G = [];
  for (let i = 0; i < n; i++) {
    G.push([]);
    for (let j = 0; j < n; j++) {
      G[i][j] = R.mul(R.int(-1), R.mul(half, R.add(R.sub(R.sub(S[i][j], rows[i]), rows[j]), grand)));
    }
  }
  return G;
}

/* Sylvester signature by exact symmetric congruence. Diagonal pivoting where a
   nonzero diagonal exists; where the diagonal is zero and an off-diagonal is
   not, one symmetric row+column operation exposes a pivot. Rationals
   throughout, so every sign is decided rather than compared to an epsilon. */
function signature(Gin, n) {
  const G = Gin.map((r) => r.slice());
  const idx = Array.from({ length: n }, (_, i) => i);
  let p = 0, q = 0, z = 0, m = n;
  const rowop = (dst, src, f) => {           // row dst += f·row src, then same on columns
    for (let k = 0; k < m; k++) G[idx[dst]][idx[k]] = R.add(G[idx[dst]][idx[k]], R.mul(f, G[idx[src]][idx[k]]));
    for (let k = 0; k < m; k++) G[idx[k]][idx[dst]] = R.add(G[idx[k]][idx[dst]], R.mul(f, G[idx[k]][idx[src]]));
  };
  while (m > 0) {
    let piv = -1;
    for (let i = 0; i < m; i++) if (R.sign(G[idx[i]][idx[i]]) !== 0) { piv = i; break; }
    if (piv < 0) {
      let a = -1, b = -1;
      for (let i = 0; i < m && a < 0; i++) for (let j = i + 1; j < m; j++)
        if (R.sign(G[idx[i]][idx[j]]) !== 0) { a = i; b = j; break; }
      if (a < 0) { z += m; break; }           // the whole remaining block is zero
      rowop(a, b, R.int(1));                  // makes G[a][a] = 2·G[a][b] ≠ 0
      piv = a;
    }
    [idx[0], idx[piv]] = [idx[piv], idx[0]];
    const d = G[idx[0]][idx[0]];
    if (R.sign(d) > 0) p++; else q++;
    for (let i = 1; i < m; i++) {
      const f = R.mul(R.int(-1), R.div(G[idx[i]][idx[0]], d));
      if (R.sign(f) !== 0) rowop(i, 0, f);
    }
    idx.splice(0, 1); m--;
  }
  return { p, q, z, n };
}

/* --- float, and said so: the coordinates the page draws ------------------- */
function eigenJacobi(Ain, n, sweeps = 100) {
  const A = Ain.map((r) => r.map(R.toNumber));
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let s = 0; s < sweeps; s++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-22) break;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[i][j]) < 1e-18) continue;
      const th = 0.5 * Math.atan2(2 * A[i][j], A[i][i] - A[j][j]);
      const c = Math.cos(th), sn = Math.sin(th);
      for (let k = 0; k < n; k++) {
        const aik = A[i][k], ajk = A[j][k];
        A[i][k] = c * aik + sn * ajk; A[j][k] = -sn * aik + c * ajk;
      }
      for (let k = 0; k < n; k++) {
        const aki = A[k][i], akj = A[k][j];
        A[k][i] = c * aki + sn * akj; A[k][j] = -sn * aki + c * akj;
        const vki = V[k][i], vkj = V[k][j];
        V[k][i] = c * vki + sn * vkj; V[k][j] = -sn * vki + c * vkj;
      }
    }
  }
  const ord = Array.from({ length: n }, (_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  return { vals: ord.map((i) => A[i][i]), vecs: ord.map((i) => V.map((r) => r[i])) };
}

function coords2D(G, n) {
  const { vals, vecs } = eigenJacobi(G, n);
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push([Math.sqrt(Math.max(vals[0], 0)) * vecs[0][i], Math.sqrt(Math.max(vals[1], 0)) * vecs[1][i]]);
  }
  const tot = vals.reduce((a, v) => a + Math.max(v, 0), 0);
  return { pts, vals, captured: tot > 0 ? (Math.max(vals[0], 0) + Math.max(vals[1], 0)) / tot : 0 };
}

/* does the drawn configuration visit the items in their own order? a discrete
   fact about the picture, checked rather than eyeballed */
function angularOrder(pts) {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const ang = pts.map((p, i) => [Math.atan2(p[1] - cy, p[0] - cx), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const n = pts.length;
  for (const dir of [1, -1]) for (let r = 0; r < n; r++) {
    let ok = true;
    for (let k = 0; k < n; k++) if (ang[(((r + dir * k) % n) + n) % n] !== k) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}

/* --- run ------------------------------------------------------------------ */
const out = { meta: Object.assign({}, P.meta, { decided: new Date().toISOString().slice(0, 10) }), sets: [], models: P.models.map((m) => ({ id: m.id, effort: m.effort })) };

for (const S of SETS) {
  const row = { id: S.id, title: S.title, predict: S.predict, why: S.why, items: S.items, models: [] };
  for (const M of P.models) {
    const rec = M.sets[S.id];
    if (!rec || rec.raw.some((r) => r.some((x) => x === null))) { row.models.push({ id: M.id, incomplete: true }); continue; }
    const n = rec.n;
    const D = symmetrise(rec.raw, n);
    const G = gram(D, n);
    const sig = signature(G, n);
    const c = closure(D, n);
    const xy = coords2D(G, n);
    row.models.push({
      id: M.id, n, asym: asymmetry(rec.raw, n), closure: c, signature: sig,
      pts: xy.pts, captured: xy.captured, cyclic: angularOrder(xy.pts),
      D: D.map((r) => r.map(R.toNumber)),
    });
  }
  out.sets.push(row);
}

fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'out', 'geometry.json'), JSON.stringify(out) + '\n');

console.log(`${'set'.padEnd(11)} ${'model'.padEnd(17)} ${'closure'.padStart(8)} ${'signature'.padStart(11)} ${'2D holds'.padStart(9)} ${'asym'.padStart(6)}  cyclic`);
for (const s of out.sets) for (const m of s.models) {
  if (m.incomplete) { console.log(`${s.id.padEnd(11)} ${m.id.padEnd(17)}   (incomplete)`); continue; }
  console.log(`${s.id.padEnd(11)} ${m.id.padEnd(17)} ${m.closure.ratio.toFixed(2).padStart(8)} `
    + `${(m.signature.p + '+ ' + m.signature.q + '− ' + m.signature.z + 'z').padStart(11)} `
    + `${(100 * m.captured).toFixed(0).padStart(8)}% ${m.asym.max.toString().padStart(6)}  ${m.cyclic ? 'yes' : 'no'}`);
}
console.log(`\n→ out/geometry.json`);
