/* decide.js — what an integer distance table can and cannot be, decided exactly.
   node experiments/exact-geometry/decide.js  ->  out/geometry.json

   Nothing here is a threshold. The tables are integers by construction, so every
   question below is a question about signs of exact rationals, and lib/eqcert's
   BigInt fractions answer them. Five things get decided, in this order, and the
   order matters because the first one can stop the rest.

   0. IS IT A DISTANCE AT ALL. Symmetry, positivity, and the triangle inequality
      d(i,k) ≤ d(i,j) + d(j,k) for every triple. If that fails, no set of points
      in any space has these distances and everything downstream is decoration.
      The reference playground has no such gate because a model's answers are
      never expected to be a metric; here the tables claim to be one, so they
      have to earn it. A refusal is a verdict, not a gap.

   1. THE CLOSURE RATIO, where the items have an order. Walk them, take the
      neighbour steps, then take the step from the last back to the first. On a
      cycle that closing step is one more neighbour and the ratio is one; on a
      line it is the whole journey and the ratio is about n − 1. This needs no
      embedding and no projection — it is a statement about the table itself.

   2. THE SIGNATURE. By Schoenberg, a table is Euclidean exactly when its
      doubly-centred Gram matrix B = −½ J D² J is positive semidefinite, and
      then the rank of B is the smallest dimension the points fit in. Computed
      by exact symmetric congruence, so the answer is a triple (p, q, z):
      p Euclidean directions, q directions of genuine non-Euclidean distortion,
      z flat ones. Sylvester's law of inertia makes that basis-independent and
      rationals make it decidable — including the case q = 0 exactly, which no
      floating-point eigensolver can ever certify.

   3. HYPERBOLICITY, the Gromov four-point condition. For every quadruple form
      the three pairings d(i,j)+d(k,l), d(i,k)+d(j,l), d(i,l)+d(j,k); δ is half
      the gap between the largest two, maximised over quadruples and divided by
      the diameter. A tree has δ = 0; a circle does not. This is what separates
      KINDS of structure once the signature has said how much there is.

   4. THE MINIMUM SPANNING TREE, for sets with no canonical order, so the plate
      has a skeleton that came from the numbers rather than from a story.

   4b. THE SPECTRUM, and it is not optional. An exact signature answers "is this
      EXACTLY Euclidean" and nothing else, and that question is infinitely
      sensitive: perturb one entry of a rank-2 table by a single unit and the
      signature goes full rank, because a sign is a sign no matter how small the
      number carrying it. Measured here — twelve points that genuinely live in a
      three-dimensional box came back (6,5,1) after quantisation. So the exact
      triple is reported next to the float spectrum, and a set is called
      Euclidean to within quantisation when its negative directions carry a
      negligible share of the mass. Reporting the triple alone would be exact
      and misleading, which is the worst combination available.

   The two-dimensional coordinates the plates draw come last, from the same
   float eigensolver, and are labelled a view rather than a result.             */
'use strict';
const fs = require('fs');
const path = require('path');
const Q = require('../../lib/eqcert/rational.js');
const SETS = require('./sets.js');

const { R, add, sub, mul, div, cmp, sign, toDouble } = Q;
const int = (k) => R(BigInt(Math.round(k)));

/* ---- 0. is it a distance ------------------------------------------------ */
function metricGate(D, n) {
  const bad = [];
  for (let i = 0; i < n && bad.length < 4; i++) for (let j = 0; j < n; j++) {
    if (i === j) { if (D[i][j] !== 0) bad.push({ why: 'nonzero on the diagonal', at: [i, j] }); continue; }
    if (D[i][j] !== D[j][i]) bad.push({ why: 'asymmetric', at: [i, j] });
    if (D[i][j] <= 0) bad.push({ why: 'nonpositive off the diagonal', at: [i, j] });
  }
  let worst = null;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
    if (i === j || j === k || i === k) continue;
    const slack = D[i][j] + D[j][k] - D[i][k];       // integers: exact
    if (slack < 0 && (worst === null || slack < worst.slack)) worst = { slack, i, j, k };
  }
  if (worst) bad.push({ why: `triangle inequality fails: d(${worst.i},${worst.k}) = ${D[worst.i][worst.k]} > ${D[worst.i][worst.j]} + ${D[worst.j][worst.k]}`, at: [worst.i, worst.j, worst.k] });
  return { ok: bad.length === 0, violations: bad, worstSlack: worst ? worst.slack : null };
}

/* ---- 1. the closing step against its neighbours ------------------------- */
function closure(D, n) {
  const steps = [];
  for (let i = 0; i + 1 < n; i++) steps.push(D[i][i + 1]);
  const closing = D[n - 1][0];
  const s = steps.slice().sort((a, b) => a - b);
  const med = s.length % 2 ? R(BigInt(s[(s.length - 1) / 2]))
    : div(add(R(BigInt(s[s.length / 2 - 1])), R(BigInt(s[s.length / 2]))), R(2n));
  return {
    ratio: sign(med) === 0 ? null : toDouble(div(R(BigInt(closing)), med)),
    closing, median: toDouble(med), steps, n,
  };
}

/* ---- 2. Schoenberg, then Sylvester -------------------------------------- */
/* B = −½ J D² J with J = I − (1/n)11ᵀ, in exact rationals */
function gram(D, n) {
  const S = D.map(row => row.map(x => R(BigInt(x) * BigInt(x))));
  const rowMean = [], nR = R(BigInt(n));
  for (let i = 0; i < n; i++) { let a = R(0n); for (let j = 0; j < n; j++) a = add(a, S[i][j]); rowMean.push(div(a, nR)); }
  let all = R(0n);
  for (let i = 0; i < n; i++) all = add(all, rowMean[i]);
  all = div(all, nR);
  const B = [];
  for (let i = 0; i < n; i++) {
    B.push([]);
    for (let j = 0; j < n; j++) {
      B[i][j] = mul(R(-1n, 2n), add(sub(sub(S[i][j], rowMean[i]), rowMean[j]), all));
    }
  }
  return B;
}

/* exact symmetric congruence — the diagonalisation Sylvester's law protects */
function signature(Bin, n) {
  const B = Bin.map(r => r.slice());
  const live = Array.from({ length: n }, (_, i) => i);
  let p = 0, q = 0, z = 0;
  while (live.length) {
    let k = live.findIndex(i => sign(B[i][i]) !== 0);
    if (k < 0) {
      /* every diagonal entry is zero: find an off-diagonal one and rotate it
         onto the diagonal by a congruence (row i += row j, col i += col j),
         which makes B[i][i] = 2·B[i][j] ≠ 0 */
      let a = -1, b = -1;
      outer: for (let x = 0; x < live.length; x++) for (let y = x + 1; y < live.length; y++) {
        if (sign(B[live[x]][live[y]]) !== 0) { a = live[x]; b = live[y]; break outer; }
      }
      if (a < 0) { z += live.length; break; }          // the whole block is zero
      for (const c of live) B[a][c] = add(B[a][c], B[b][c]);
      for (const r of live) B[r][a] = add(B[r][a], B[r][b]);
      k = live.indexOf(a);
    }
    const i = live[k];
    const piv = B[i][i];
    sign(piv) > 0 ? p++ : q++;
    live.splice(k, 1);
    for (const r of live) {
      if (sign(B[r][i]) === 0) continue;
      const f = div(B[r][i], piv);
      for (const c of live) B[r][c] = sub(B[r][c], mul(f, B[i][c]));
      B[r][i] = R(0n);
    }
  }
  return { p, q, z, euclidean: q === 0, rank: p + q };
}

/* ---- 3. the four-point condition ---------------------------------------- */
function hyperbolicity(D, n) {
  let worst = 0, diam = 0, at = null;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) diam = Math.max(diam, D[i][j]);
  const quad = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) for (let l = k + 1; l < n; l++) {
    const s = [D[i][j] + D[k][l], D[i][k] + D[j][l], D[i][l] + D[j][k]].sort((a, b) => b - a);
    const d = (s[0] - s[1]) / 2;
    if (d > worst) { worst = d; at = [i, j, k, l]; }
    quad.push(d);
  }
  return { delta: worst, relative: diam ? worst / diam : 0, at, quadruples: quad.length };
}

/* ---- 4. the cheapest tree the numbers admit ----------------------------- */
function mst(D, n) {
  const inT = [0], out = Array.from({ length: n - 1 }, (_, i) => i + 1), E = [];
  while (out.length) {
    let best = null;
    for (const a of inT) for (const b of out) if (!best || D[a][b] < best.w) best = { a, b, w: D[a][b] };
    E.push([best.a, best.b]); inT.push(best.b); out.splice(out.indexOf(best.b), 1);
  }
  return E;
}

/* ---- the view: floats, and labelled as such ----------------------------- */
function spectrumOf(B, n) {
  const { vals } = jacobi(B, n);
  const s = vals.slice().sort((a, b) => Math.abs(b) - Math.abs(a));
  const tot = s.reduce((t, x) => t + Math.abs(x), 0) || 1;
  let acc = 0, eff = 0;
  for (const x of s) { acc += Math.abs(x); eff++; if (acc / tot >= 0.99) break; }
  const negMass = s.filter(x => x < 0).reduce((t, x) => t - x, 0) / tot;
  return { vals: s.map(x => x / (Math.abs(s[0]) || 1)), effRank: eff, negMass, leading: s[0] };
}

function jacobi(B, n) {
  const A = B.map(r => (typeof r[0] === 'number' ? r.slice() : r.map(toDouble)));
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 80; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-22) break;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[i][j]) < 1e-18) continue;
      const th = 0.5 * Math.atan2(2 * A[i][j], A[i][i] - A[j][j]), c = Math.cos(th), s = Math.sin(th);
      for (let k = 0; k < n; k++) { const a = A[i][k], b = A[j][k]; A[i][k] = c * a + s * b; A[j][k] = -s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = A[k][i], b = A[k][j]; A[k][i] = c * a + s * b; A[k][j] = -s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = V[k][i], b = V[k][j]; V[k][i] = c * a + s * b; V[k][j] = -s * a + c * b; }
    }
  }
  return { vals: Array.from({ length: n }, (_, i) => A[i][i]), vecs: V };
}

function coords2D(B, n) {
  const { vals, vecs } = jacobi(B, n);
  const ord = Array.from({ length: n }, (_, i) => i).sort((a, b) => vals[b] - vals[a]);
  const [e1, e2] = ord;
  const s1 = Math.sqrt(Math.max(0, vals[e1])), s2 = Math.sqrt(Math.max(0, vals[e2]));
  return Array.from({ length: n }, (_, i) => [vecs[i][e1] * s1, vecs[i][e2] * s2]);
}

module.exports = { metricGate, closure, gram, signature, spectrumOf, hyperbolicity, mst, coords2D };

/* ---- run ---------------------------------------------------------------- */
if (require.main !== module) return;
const out = { builtAt: new Date().toISOString(), sets: [] };
for (const S of SETS) {
  const n = S.items.length, D = S.D;
  const gate = metricGate(D, n);
  const rec = { id: S.id, title: S.title, shape: S.shape, order: !!S.order, predict: S.predict, why: S.why,
    items: S.items, scale: S.scale, note: S.note || null, n, D, gate };
  if (gate.ok) {
    const B = gram(D, n);
    rec.signature = signature(B, n);
    rec.spectrum = spectrumOf(B, n);
    rec.hyper = hyperbolicity(D, n);
    rec.mst = mst(D, n);
    rec.pts = coords2D(B, n);
    if (S.order) rec.closure = closure(D, n);
  }
  out.sets.push(rec);
  const g = gate.ok ? `(${rec.signature.p},${rec.signature.q},${rec.signature.z})` : 'REFUSED';
  const sp = rec.spectrum ? `eff ${rec.spectrum.effRank}  neg ${(100 * rec.spectrum.negMass).toFixed(2)}%` : '';
  const cl = rec.closure ? `closure ${rec.closure.ratio.toFixed(2)}×` : '';
  const hy = rec.hyper ? `δ/diam ${rec.hyper.relative.toFixed(3)}` : '';
  console.log(`  ${S.id.padEnd(15)} n=${String(n).padStart(2)}  exact ${g.padEnd(11)} ${(sp || '').padEnd(22)} ${cl.padEnd(15)} ${hy}`);
}
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'out', 'geometry.json'), JSON.stringify(out));
console.log(`\nwritten out/geometry.json  (${out.sets.length} sets)`);
