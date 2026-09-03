/* instruments/kissing — exact certification of kissing configurations.

   A kissing configuration in R^d is a set of nonzero DIRECTION vectors with
   every pairwise angle >= 60 degrees: place a unit sphere at 2x/|x| for each
   direction and all of them touch the central unit sphere without overlap.
   The angle condition is scale-invariant per vector, so ANY exact
   representative of each direction decides the claim:

       <x,y> <= 0   OR   4<x,y>^2 <= <x,x><y,y>.

   Everything runs in Z[sqrt2] on BigInt — pairs [a,b] meaning a + b*sqrt2 —
   because the 2026 records (the Station's three 604-point configurations)
   live in Q(sqrt2); plain rational and integer inputs are the b = 0 special
   case. No float participates in any decision; floats appear only in the
   display fields, labeled approx.

   Sign of a + b*sqrt2 is decided by the classical two-case test; the
   mixed-sign tie a^2 = 2b^2 is impossible for integers (sqrt2 is irrational)
   and the code THROWS if it ever sees one — that throw is a falsifier for
   the arithmetic itself, exercised by the battery. */
'use strict';

/* ---------------- Z[sqrt2] on BigInt ---------------- */
const Z = {
  zero: [0n, 0n],
  add: (u, v) => [u[0] + v[0], u[1] + v[1]],
  sub: (u, v) => [u[0] - v[0], u[1] - v[1]],
  mul: (u, v) => [u[0] * v[0] + 2n * u[1] * v[1], u[0] * v[1] + u[1] * v[0]],
  eq: (u, v) => u[0] === v[0] && u[1] === v[1],
  sign(u) {
    const [a, b] = u;
    if (a === 0n && b === 0n) return 0;
    if (a >= 0n && b >= 0n) return 1;
    if (a <= 0n && b <= 0n) return -1;
    const t = a * a - 2n * b * b;
    if (t === 0n) throw new Error('Z[sqrt2] sign: a^2 = 2b^2 with (a,b) != 0 — impossible for integers');
    return (a > 0n) === (t > 0n) ? 1 : -1;
  },
  approx: (u) => Number(u[0]) + Math.SQRT2 * Number(u[1]),
};

/* ---------------- input adapters ---------------- */
/* integers (number|string|bigint) -> {P,Q} with Q = 0 */
function fromIntegers(rows) {
  return rows.map((r) => ({ P: r.map((x) => BigInt(x)), Q: r.map(() => 0n) }));
}

/* decimal literals ("-0.1449", "2", 3) -> exact rationals, cleared per vector.
   The literal IS the rational: -0.1449 = -1449/10000. Scale-invariance per
   vector makes the per-vector clearing sound. */
function parseDecimal(s) {
  s = String(s).trim();
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(s);
  if (!m) throw new Error('not a decimal literal: ' + s);
  const neg = m[1] === '-', frac = m[3] || '';
  let num = BigInt(m[2] + frac), k = frac.length;
  if (m[4]) {
    const e = Number(m[4]);
    if (e > 0) { num *= 10n ** BigInt(e); } else { k += -e; }
  }
  return { num: neg ? -num : num, k };
}
function fromDecimals(rows) {
  return rows.map((r) => {
    const parsed = r.map(parseDecimal);
    const kmax = Math.max(...parsed.map((p) => p.k));
    return { P: parsed.map((p) => p.num * 10n ** BigInt(kmax - p.k)), Q: parsed.map(() => 0n) };
  });
}

/* rows of [a,b] int pairs meaning a + b*sqrt2 (common denominator cancels) */
function fromSqrt2Pairs(rows) {
  return rows.map((r) => ({ P: r.map((e) => BigInt(e[0])), Q: r.map((e) => BigInt(e[1])) }));
}

/* ---------------- the certifier ---------------- */
function dot(x, y) {
  let acc = Z.zero;
  for (let i = 0; i < x.P.length; i++) acc = Z.add(acc, Z.mul([x.P[i], x.Q[i]], [y.P[i], y.Q[i]]));
  return acc;
}

/* certify(vectors, opts) — vectors: [{P,Q}], opts.uniformNorm: [a,b] each
   cleared vector's <x,x> must equal exactly (claimant's stated shell norm).
   Returns the full decision; a REFUTED carries the exact witness pair. */
function certify(vectors, opts = {}) {
  const n = vectors.length;
  if (!n) throw new Error('empty configuration');
  const dim = vectors[0].P.length;
  const t0 = Date.now();
  const norms = new Array(n);
  for (let i = 0; i < n; i++) {
    if (vectors[i].P.length !== dim || vectors[i].Q.length !== dim) throw new Error('ragged dimensions at row ' + i);
    norms[i] = dot(vectors[i], vectors[i]);
    if (Z.sign(norms[i]) <= 0) {
      return { verdict: 'REFUTED', reason: 'zero vector', row: i, n, dim, pairs: 0, ms: Date.now() - t0 };
    }
  }
  let uniform = null;
  if (opts.uniformNorm) {
    const target = [BigInt(opts.uniformNorm[0]), BigInt(opts.uniformNorm[1])];
    uniform = norms.every((N) => Z.eq(N, target));
  }
  let pairs = 0, contacts = 0;
  let worst = null; /* {i,j,s2,NN} maximizing s^2/NxNy among s > 0 */
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs++;
      const s = dot(vectors[i], vectors[j]);
      if (Z.sign(s) <= 0) continue;
      const s2 = Z.mul(s, s);
      const NN = Z.mul(norms[i], norms[j]);
      const slack = Z.sub(NN, Z.mul([4n, 0n], s2));
      const sg = Z.sign(slack);
      if (sg < 0) {
        return {
          verdict: 'REFUTED', n, dim, pairs, ms: Date.now() - t0,
          witness: { i, j, dotRational: String(s[0]), dotSqrt2: String(s[1]),
            cos2Approx: Z.approx(s2) / Z.approx(NN) },
        };
      }
      if (sg === 0) contacts++;
      if (!worst || Z.sign(Z.sub(Z.mul(s2, worst.NN), Z.mul(worst.s2, NN))) > 0) worst = { i, j, s2, NN };
    }
  }
  return {
    verdict: 'CERTIFIED', n, dim, pairs, contacts,
    uniformNorm: uniform,
    worst: worst ? { i: worst.i, j: worst.j, cos2Approx: Z.approx(worst.s2) / Z.approx(worst.NN) } : null,
    ms: Date.now() - t0,
  };
}

/* ---------------- calibration generators (known witnesses) ---------------- */
/* D4 root directions: all permutations of (+-1, +-1, 0, 0) — K(4) >= 24 */
function d4() {
  const rows = [];
  for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++)
    for (const sa of [1, -1]) for (const sb of [1, -1]) {
      const v = [0, 0, 0, 0]; v[a] = sa; v[b] = sb; rows.push(v);
    }
  return fromIntegers(rows);
}
/* E8 roots scaled by 2: (+-2,+-2,0^6) patterns and (+-1)^8 with an even
   number of minus signs — 112 + 128 = 240 = K(8), Levenshtein/Odlyzko-Sloane exact */
function e8() {
  const rows = [];
  for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++)
    for (const sa of [2, -2]) for (const sb of [2, -2]) {
      const v = [0, 0, 0, 0, 0, 0, 0, 0]; v[a] = sa; v[b] = sb; rows.push(v);
    }
  for (let m = 0; m < 256; m++) {
    let bits = 0; for (let i = 0; i < 8; i++) if (m & (1 << i)) bits++;
    if (bits % 2) continue;
    rows.push([...Array(8)].map((_, i) => (m & (1 << i) ? -1 : 1)));
  }
  return fromIntegers(rows);
}

module.exports = { Z, fromIntegers, fromDecimals, fromSqrt2Pairs, certify, d4, e8, parseDecimal };
