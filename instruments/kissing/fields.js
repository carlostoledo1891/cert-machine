/* instruments/kissing/fields.js — the real quadratic fields the 2026 kissing records live in.

   kissing.js decides everything in Z[sqrt2] because the dimension-11 records live there. The
   September 2026 wave does not: Kravatsky's dimension-18 configuration has inner products in
   Z[sqrt3] and coordinates in Q(sqrt2, sqrt3), and the Leech liftings of dimensions 25-31 use
   (3 - sqrt3)/6, sqrt(2/3), (2 + sqrt2)/4 ... So the arithmetic is built once, as a TOWER:

       quad(base, m)  =  base[sqrt m],  elements [x, y] meaning x + y*sqrt(m), x, y in base,

   with ONE sign rule applied at every level. For x + y*sqrt(m): if x and y have the same sign
   (or one is zero) that is the sign; otherwise compare x^2 with m*y^2 in the base, which is
   again a sign in the base. The recursion bottoms out in BigInt. Z[sqrt3] = quad(INT, 3),
   Q(sqrt2, sqrt3) = quad(quad(INT, 2), 3), its elements [[a, b], [c, d]] meaning
   a + b sqrt2 + c sqrt3 + d sqrt6.

   The tie x^2 = m*y^2 with (x, y) != 0 is impossible exactly when sqrt(m) is not already in
   the base field, so the constructor REFUSES an m that is a square there (for base Q(sqrt m0):
   m or m*m0 a perfect square), and sign() THROWS if a tie ever appears — that throw is a
   falsifier for the arithmetic itself, and the battery forces it by building a tower the
   constructor would have refused.

   No float participates in any decision; approx() is for display only. */
'use strict';

const isqrt = (n) => {
  if (n < 0n) throw new Error('isqrt of a negative');
  if (n < 2n) return n;
  let x = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (x * x > n) x--;
  while ((x + 1n) * (x + 1n) <= n) x++;
  return x;
};
const isSquare = (n) => n >= 0n && isqrt(n) ** 2n === n;

const INT = {
  name: 'Z', depth: 0, zero: 0n, one: 1n,
  of: (v) => BigInt(v),
  add: (u, v) => u + v, sub: (u, v) => u - v, mul: (u, v) => u * v, neg: (u) => -u,
  eq: (u, v) => u === v, isZero: (u) => u === 0n,
  sign: (u) => (u > 0n ? 1 : u < 0n ? -1 : 0),
  scale: (u, k) => u * k,
  approx: (u) => Number(u),
  str: (u) => String(u),
};

/* quad(base, m, opts) — base[sqrt m]. opts.unchecked builds a tower the constructor would refuse
   (only the battery does that, to make the tie throw fire). */
function quad(base, m, opts = {}) {
  m = BigInt(m);
  if (m <= 1n) throw new Error('quad: m must be an integer > 1');
  if (!opts.unchecked) {
    if (base.depth === 0 && isSquare(m)) throw new Error('quad: ' + m + ' is a square in Z — sqrt(' + m + ') adds nothing');
    if (base.depth === 1 && (isSquare(m) || isSquare(m * base.m))) throw new Error('quad: sqrt(' + m + ') already lies in ' + base.name);
    if (base.depth > 1) throw new Error('quad: towers deeper than two are not certified here');
  }
  const B = base;
  const name = (base.depth === 0 ? 'Z' : base.name) + '[sqrt' + m + ']';
  const F = {
    name, depth: base.depth + 1, base: B, m,
    zero: [B.zero, B.zero], one: [B.one, B.zero],
    of: (x, y) => [x === undefined ? B.zero : x, y === undefined ? B.zero : y],
    add: (u, v) => [B.add(u[0], v[0]), B.add(u[1], v[1])],
    sub: (u, v) => [B.sub(u[0], v[0]), B.sub(u[1], v[1])],
    neg: (u) => [B.neg(u[0]), B.neg(u[1])],
    mul: (u, v) => [B.add(B.mul(u[0], v[0]), B.scale(B.mul(u[1], v[1]), m)), B.add(B.mul(u[0], v[1]), B.mul(u[1], v[0]))],
    scale: (u, k) => [B.scale(u[0], k), B.scale(u[1], k)],
    eq: (u, v) => B.eq(u[0], v[0]) && B.eq(u[1], v[1]),
    isZero: (u) => B.isZero(u[0]) && B.isZero(u[1]),
    sign(u) {
      const sx = B.sign(u[0]), sy = B.sign(u[1]);
      if (sx >= 0 && sy >= 0) return sx || sy ? 1 : 0;
      if (sx <= 0 && sy <= 0) return -1;
      const t = B.sub(B.mul(u[0], u[0]), B.scale(B.mul(u[1], u[1]), m));
      const st = B.sign(t);
      if (st === 0) throw new Error(name + ' sign: x^2 = ' + m + '*y^2 with (x, y) != 0 — impossible when sqrt' + m + ' is not in the base');
      return (sx > 0) === (st > 0) ? 1 : -1;
    },
    approx: (u) => B.approx(u[0]) + Math.sqrt(Number(m)) * B.approx(u[1]),
    str: (u) => '(' + B.str(u[0]) + ')+(' + B.str(u[1]) + ')*sqrt' + m,
  };
  return F;
}

const Z2 = quad(INT, 2);          /* Z[sqrt2], the dimension-11 field (kissing.js keeps its own copy) */
const Z3 = quad(INT, 3);          /* Z[sqrt3], Kravatsky's dimension-18 inner products */
const Z5 = quad(INT, 5);          /* Z[sqrt5], the icosahedron calibration */
const Z23 = quad(Z2, 3);          /* Q(sqrt2, sqrt3) = Z[sqrt2][sqrt3]: a + b sqrt2 + c sqrt3 + d sqrt6 */

/* element of Z23 from the four integers of the Q-basis {1, sqrt2, sqrt3, sqrt6} */
const z23 = (a, b, c, d) => [[BigInt(a), BigInt(b)], [BigInt(c), BigInt(d)]];
const z23coeffs = (u) => [u[0][0], u[0][1], u[1][0], u[1][1]];

/* certifyField(F, vectors, opts) — vectors: arrays of F-elements, all of one length. The
   kissing decision per pair, exact: <x,y> <= 0 or 4<x,y>^2 <= <x,x><y,y>. When every norm is the
   same element N (checked exactly, opts.uniform not needed) the linear form 2<x,y> <= N is used,
   which is the same inequality. A REFUTED carries the exact witness pair. */
function certifyField(F, vectors, opts = {}) {
  const n = vectors.length, t0 = Date.now();
  if (!n) throw new Error('empty configuration');
  const dim = vectors[0].length;
  const dot = (x, y) => { let s = F.zero; for (let i = 0; i < dim; i++) s = F.add(s, F.mul(x[i], y[i])); return s; };
  const norms = vectors.map((v, i) => {
    if (v.length !== dim) throw new Error('ragged dimensions at row ' + i);
    return dot(v, v);
  });
  for (let i = 0; i < n; i++) if (F.sign(norms[i]) <= 0) return { verdict: 'REFUTED', reason: 'zero vector', row: i, n, dim, pairs: 0, ms: Date.now() - t0 };
  const uniform = norms.every((N) => F.eq(N, norms[0]));
  const four = F.scale(F.one, 4n);
  let pairs = 0, contacts = 0, worst = null;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs++;
      const s = dot(vectors[i], vectors[j]);
      let sg;
      if (uniform) sg = F.sign(F.sub(norms[0], F.scale(s, 2n)));
      else {
        if (F.sign(s) <= 0) { continue; }
        sg = F.sign(F.sub(F.mul(norms[i], norms[j]), F.mul(four, F.mul(s, s))));
      }
      if (sg < 0) return { verdict: 'REFUTED', n, dim, pairs, ms: Date.now() - t0, witness: { i, j, dot: F.str(s), cosApprox: F.approx(s) / Math.sqrt(F.approx(norms[i]) * F.approx(norms[j])) } };
      if (sg === 0) contacts++;
      if (F.sign(s) > 0) {
        /* worst = the pair maximising s^2 / (N_i N_j) among s > 0, compared exactly */
        const s2 = F.mul(s, s), NN = F.mul(norms[i], norms[j]);
        if (!worst || F.sign(F.sub(F.mul(s2, worst.NN), F.mul(worst.s2, NN))) > 0) worst = { i, j, s2, NN, s };
      }
    }
  }
  return {
    verdict: 'CERTIFIED', n, dim, pairs, contacts, uniformNorm: uniform ? F.str(norms[0]) : null,
    worst: worst ? { i: worst.i, j: worst.j, dot: F.str(worst.s), cos2Approx: F.approx(worst.s2) / F.approx(worst.NN) } : null,
    ms: Date.now() - t0,
  };
}

/* icosahedron(): the 12 vertices (0, +-1, +-phi) and cyclic shifts, doubled into Z[sqrt5]:
   (0, +-2, +-(1 + sqrt5)). K(3) = 12 (Schutte - van der Waerden 1953). No pair touches: the
   nearest neighbours sit at cos = 1/sqrt5 exactly, the calibration's whole point. */
function icosahedron() {
  const rows = [];
  for (const s1 of [1n, -1n]) for (const s2 of [1n, -1n]) {
    const t = [[0n, 0n], [2n * s1, 0n], [s2, s2]];
    for (let r = 0; r < 3; r++) rows.push([t[(0 + r) % 3], t[(1 + r) % 3], t[(2 + r) % 3]]);
  }
  return rows;
}

module.exports = { INT, quad, Z2, Z3, Z5, Z23, z23, z23coeffs, certifyField, icosahedron, isqrt, isSquare };
