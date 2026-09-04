/* hunt.js — look for perfect shapes inside a distance matrix, and decide the
   ones you find in exact arithmetic.

   THE PICTURE IS NOT THE EVIDENCE. Those 2D coordinates are a float shadow of
   something living in four to ten dimensions, so a pentagon spotted in the
   drawing may not be in the data at all. Every test below is a statement about
   D itself, which arrived as whole numbers and is exact.

   And every classical regularity IS such a statement:

     three points collinear   d(a,c) = d(a,b) + d(b,c)          (triangle equality)
     four points CONCYCLIC    PTOLEMY: of the three ways to pair four points,
                              the largest product of opposite sides equals the
                              sum of the other two — with equality exactly when
                              the four lie on one circle
     a regular k-gon          D restricted to them is CIRCULANT: it depends only
                              on how far apart the two are around the ring
     a symmetry               a permutation π with D[π(i)][π(j)] = D[i][j]

   THE SCREEN AND THE DECISION are separate, as everywhere else in this machine.
   Floats enumerate candidates — hundreds of subsets, fast, and allowed only to
   PRUNE. The survivors are recomputed in exact rationals, and it is the exact
   number that is reported.

   THE NULL IS NOT OPTIONAL. Searching 495 quadruples for the roundest one will
   find a round one in anything. So each hunt is re-run on matrices whose
   distances have been SHUFFLED into new positions — same numbers, no geometry —
   and what gets published is the best real defect against the best shuffled one.
*/
'use strict';
const R = require('../rational.js');

const half = R.make(1n, 2n);
const comb = (n, k) => {                       /* all k-subsets of 0..n-1 */
  const out = [], cur = [];
  (function rec(start) {
    if (cur.length === k) { out.push(cur.slice()); return; }
    for (let i = start; i <= n - (k - cur.length); i++) { cur.push(i); rec(i + 1); cur.pop(); }
  })(0);
  return out;
};

/* ---- the defects, in floats, for the screen ------------------------------ */

/* collinear: the longest side must be the sum of the other two. The SIGN
   matters and is its own finding — negative means the triangle inequality
   itself failed, so those three points are in no metric space at all. The
   search minimises the magnitude; the sign is counted separately. */
function collinearSigned(D, [a, b, c]) {
  const s = [D[a][b], D[b][c], D[a][c]].sort((x, y) => y - x);
  return s[0] > 0 ? (s[1] + s[2] - s[0]) / s[0] : 1;
}
const collinearF = (D, t) => Math.abs(collinearSigned(D, t));

/* concyclic, by Ptolemy: pair the four points three ways, take the products of
   opposite sides. The largest is at most the sum of the other two, with equality
   exactly on a circle — so the gap, normalised, is the defect. */
function ptolemySigned(D, [a, b, c, d]) {
  const P = [D[a][b] * D[c][d], D[a][c] * D[b][d], D[a][d] * D[b][c]];
  const s = P.reduce((x, y) => x + y, 0), m = Math.max(...P);
  return s > 0 ? (s - 2 * m) / s : 1;
}
/* Ptolemy's inequality holds in every Euclidean space, so a NEGATIVE value is
   not a near-miss — it is four answers that no Euclidean arrangement can
   produce, a stronger failure than breaking the triangle inequality. The hunt
   minimises the magnitude, and counts the negatives on their own. */
const ptolemyF = (D, q) => Math.abs(ptolemySigned(D, q));

/* equilateral: all three sides the same */
function equilateralF(D, [a, b, c]) {
  const s = [D[a][b], D[b][c], D[a][c]];
  const mx = Math.max(...s), mn = Math.min(...s);
  return mx > 0 ? (mx - mn) / mx : 1;
}

/* a regular k-gon: walk the subset in some cyclic order and require that the
   distance depend only on the lag. All cyclic orders are tried for k <= 6. */
function ringDefectF(D, order) {
  const k = order.length;
  let worst = 0;
  for (let lag = 1; lag <= Math.floor(k / 2); lag++) {
    const v = [];
    for (let i = 0; i < k; i++) v.push(D[order[i]][order[(i + lag) % k]]);
    const mx = Math.max(...v), mn = Math.min(...v);
    worst = Math.max(worst, mx > 0 ? (mx - mn) / mx : 1);
  }
  return worst;
}
function cyclicOrders(sub) {                   /* fixed first element, halve for reflection */
  const [first, ...rest] = sub, out = [];
  (function perm(cur, left) {
    if (!left.length) { if (cur.length < 2 || cur[0] < cur[cur.length - 1]) out.push([first, ...cur]); return; }
    for (let i = 0; i < left.length; i++) perm([...cur, left[i]], left.filter((_, j) => j !== i));
  })([], rest);
  return out;
}

/* ---- the same defects, exactly, for the decision ------------------------- */
const Q = (D) => D.map((r) => r.map((x) => R.mul(half, R.int(Math.round(2 * x)))));  /* integers/2, as elicited */

function collinearX(Dq, [a, b, c]) {
  const s = [Dq[a][b], Dq[b][c], Dq[a][c]].sort((x, y) => R.cmp(y, x));
  if (R.sign(s[0]) === 0) return null;
  return R.div(R.sub(R.add(s[1], s[2]), s[0]), s[0]);
}
function ptolemyX(Dq, [a, b, c, d]) {
  const P = [R.mul(Dq[a][b], Dq[c][d]), R.mul(Dq[a][c], Dq[b][d]), R.mul(Dq[a][d], Dq[b][c])];
  const s = P.reduce((x, y) => R.add(x, y), R.int(0));
  const m = P.reduce((x, y) => (R.gt(y, x) ? y : x), P[0]);
  if (R.sign(s) === 0) return null;
  return R.div(R.sub(s, R.mul(R.int(2), m)), s);
}
function equilateralX(Dq, [a, b, c]) {
  const s = [Dq[a][b], Dq[b][c], Dq[a][c]];
  const mx = s.reduce((x, y) => (R.gt(y, x) ? y : x), s[0]);
  const mn = s.reduce((x, y) => (R.lt(y, x) ? y : x), s[0]);
  if (R.sign(mx) === 0) return null;
  return R.div(R.sub(mx, mn), mx);
}
function ringX(Dq, order) {
  const k = order.length;
  let worst = R.int(0);
  for (let lag = 1; lag <= Math.floor(k / 2); lag++) {
    const v = [];
    for (let i = 0; i < k; i++) v.push(Dq[order[i]][order[(i + lag) % k]]);
    const mx = v.reduce((x, y) => (R.gt(y, x) ? y : x), v[0]);
    const mn = v.reduce((x, y) => (R.lt(y, x) ? y : x), v[0]);
    if (R.sign(mx) === 0) return null;
    const d = R.div(R.sub(mx, mn), mx);
    if (R.gt(d, worst)) worst = d;
  }
  return worst;
}

/* ---- the symmetry test --------------------------------------------------- */
/* how well a permutation preserves the matrix, worst entry, over the diameter */
function permDefect(D, perm) {
  const n = D.length;
  let worst = 0, diam = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) diam = Math.max(diam, D[i][j]);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
    worst = Math.max(worst, Math.abs(D[perm[i]][perm[j]] - D[i][j]));
  return diam > 0 ? worst / diam : 1;
}
function dihedral(n) {
  const out = [];
  for (let r = 0; r < n; r++) out.push({ kind: r === 0 ? 'identity' : 'rotation by ' + r, perm: Array.from({ length: n }, (_, i) => (i + r) % n) });
  for (let r = 0; r < n; r++) out.push({ kind: 'reflection ' + r, perm: Array.from({ length: n }, (_, i) => (r - i + n) % n) });
  return out.slice(1);                          /* the identity is not a finding */
}

/* ---- the null: same numbers, no geometry -------------------------------- */
function shuffledD(D, rnd) {
  const n = D.length, vals = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) vals.push(D[i][j]);
  for (let i = vals.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [vals[i], vals[j]] = [vals[j], vals[i]]; }
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  let k = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { out[i][j] = out[j][i] = vals[k++]; }
  return out;
}
function randPerm(n, rnd) {
  const p = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  return p;
}
/* a fixed generator: the null is part of the record, not a mood */
const seeded = (s) => () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };

module.exports = { comb, cyclicOrders, collinearF, ptolemyF, equilateralF, ringDefectF,
                   collinearSigned, ptolemySigned,
                   collinearX, ptolemyX, equilateralX, ringX, Q,
                   permDefect, dihedral, shuffledD, randPerm, seeded };
