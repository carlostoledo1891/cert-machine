/* autos.js — every permutation, not just the twenty-three.

   The symmetry test on the main page tries the 2n - 1 non-identity rotations and
   reflections. That is a strong test precisely because it is small: there is
   almost nothing to overfit. It is also a test that can only find what it was
   told to look for, and it was told to look for the symmetries of a ring.

   So on the eight-item sets — where the whole symmetric group is 40,320
   permutations and fits in a loop — every one is tried. Two things can come out
   that the dihedral search cannot produce:

     · a symmetry NOBODY PREDICTED, better than any rotation or reflection;
     · nothing, at a much harder bar, which is itself worth having.

   AND THE BAR REALLY IS HARDER. Best-of-40,320 will beat best-of-23 on random
   numbers too, so the null has to be given the same 40,320 tries: the same
   distances shuffled into new positions, the identical exhaustive search, its
   own minimum, repeated. Anything else compares a bigger search against a
   smaller one and calls the difference a finding.

   CLOSURE IS THE HONEST TEST FOR A GROUP. The permutations that beat the null
   are a SET; a symmetry group is a set closed under composition. So the closure
   is checked rather than assumed, and what gets reported is the group actually
   generated — which, when the set is only near-symmetries, is usually bigger
   than the set and sometimes is everything.
*/
'use strict';
const R = require('../rational.js');

/* all permutations of 0..n-1, flat, in lexicographic order */
function allPerms(n) {
  let count = 1;
  for (let i = 2; i <= n; i++) count *= i;
  const out = new Uint8Array(count * n);
  const cur = Array.from({ length: n }, (_, i) => i);
  let w = 0;
  (function rec(depth, left) {
    if (depth === n) { for (let i = 0; i < n; i++) out[w++] = cur[i]; return; }
    for (let i = 0; i < left.length; i++) {
      cur[depth] = left[i];
      rec(depth + 1, left.slice(0, i).concat(left.slice(i + 1)));
    }
  })(0, cur.slice());
  return { perms: out, count };
}

/* the search: minimum unnormalised defect over every permutation, with an early
   exit as soon as a candidate is worse than the best so far */
function searchAll(D, perms, count, n, skipIdentity = true) {
  const flat = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) flat[i * n + j] = D[i][j];
  let best = Infinity, bestAt = -1;
  for (let t = 0; t < count; t++) {
    const o = t * n;
    if (skipIdentity) {
      let id = true;
      for (let i = 0; i < n; i++) if (perms[o + i] !== i) { id = false; break; }
      if (id) continue;
    }
    let worst = 0, dead = false;
    for (let i = 0; i < n && !dead; i++) {
      const pi = perms[o + i], ri = i * n, rpi = pi * n;
      for (let j = i + 1; j < n; j++) {
        const v = flat[rpi + perms[o + j]] - flat[ri + j];
        const a = v < 0 ? -v : v;
        if (a > worst) { worst = a; if (worst >= best) { dead = true; break; } }
      }
    }
    if (!dead && worst < best) { best = worst; bestAt = t; }
  }
  return { best, bestAt };
}

/* every permutation strictly under a threshold */
function collectUnder(D, perms, count, n, thr, cap = 3000) {
  const flat = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) flat[i * n + j] = D[i][j];
  const out = [];
  for (let t = 0; t < count; t++) {
    const o = t * n;
    let worst = 0, dead = false;
    for (let i = 0; i < n && !dead; i++) {
      const pi = perms[o + i], ri = i * n, rpi = pi * n;
      for (let j = i + 1; j < n; j++) {
        const v = flat[rpi + perms[o + j]] - flat[ri + j];
        const a = v < 0 ? -v : v;
        if (a > worst) { worst = a; if (worst >= thr) { dead = true; break; } }
      }
    }
    if (!dead) { out.push({ t, perm: Array.from(perms.subarray(o, o + n)), defect: worst }); if (out.length >= cap) return out; }
  }
  return out;
}

/* the group these permutations generate, by closing under composition */
function generated(list, n, cap = 100000) {
  const key = (p) => p.join(',');
  const idp = Array.from({ length: n }, (_, i) => i);
  const seen = new Map([[key(idp), idp]]);
  let frontier = list.slice();
  for (const p of frontier) seen.set(key(p), p);
  while (frontier.length) {
    const next = [];
    for (const a of frontier) for (const b of list) {
      const c = a.map((_, i) => a[b[i]]);
      const k = key(c);
      if (!seen.has(k)) { seen.set(k, c); next.push(c); if (seen.size > cap) return { order: seen.size, capped: true }; }
    }
    frontier = next;
  }
  return { order: seen.size, capped: false };
}
/* is the set already a group? */
function isClosed(list, n) {
  const key = (p) => p.join(',');
  const set = new Set(list.map(key));
  set.add(Array.from({ length: n }, (_, i) => i).join(','));
  let good = 0, total = 0;
  for (const a of list) for (const b of list) { total++; if (set.has(a.map((_, i) => a[b[i]]).join(','))) good++; }
  return { closed: good === total, good, total };
}

/* the exact re-decision of the winner: the entries are whole halves, so the
   defect is a ratio of exact rationals and gets decided as one */
function exactDefect(D, perm) {
  const n = D.length;
  const q = (x) => R.make(BigInt(Math.round(2 * x)), 2n);
  let worst = R.int(0), diam = R.int(0);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d = q(D[i][j]);
    if (R.gt(d, diam)) diam = d;
    let e = R.sub(q(D[perm[i]][perm[j]]), d);
    if (R.sign(e) < 0) e = R.sub(R.int(0), e);
    if (R.gt(e, worst)) worst = e;
  }
  return R.sign(diam) === 0 ? null : R.div(worst, diam);
}

/* THE SECOND NULL LIVES IN engine.js, because the dihedral test on the main
   page needs exactly the same one and a null defined twice would drift. See
   engine.js configD: random genuine configurations of the same size, rounded
   onto the same grid, carrying every constraint a distance matrix carries and
   no reason at all to be symmetric. */

module.exports = { allPerms, searchAll, collectUnder, generated, isClosed, exactDefect };
