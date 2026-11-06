/* zq-k0.js — exact arithmetic shared by the ZQ lanes (tools/zq-finite.js, tools/zq-h2.js): BigInt rationals; the
   field K0 = Q(√2) as pairs of rationals in the basis 1, √2; the curve E: y² = x³ + A·x over K0 with its affine
   chord-and-tangent group law; the division-polynomial values ψ_n at a point by the normalized recurrences of the
   manuscript (TeX lines 206-233, the JSON's definitions.psiNormalization); and univariate polynomials over Q with
   an exact Sturm count of distinct real roots.

   CLEAN ROOM: written from the manuscript's prose and the textbook formulas (Silverman III.2.3 for the group law;
   the Sturm sequence). No line of the claimant's .js or .py is read, copied or ported. One module because two
   records use the same arithmetic, and a rule written twice diverges. */
'use strict';

/* ---- rationals {n, d}: d > 0, gcd(n, d) = 1 ---- */
const babs = (a) => (a < 0n ? -a : a);
function euclid(a, b) { a = babs(a); b = babs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
/* Lehmer's gcd (Knuth, TAOCP vol. 2, 4.5.2 Algorithm L) on 62-bit leading parts: the same value as euclid, with far
   fewer full-size divisions. Checked against euclid by the callers' records (zq-finite.js row K0, zq-h2.js row K0). */
const SMALLGCD = 1n << 128n;
const hexBits = (x) => x.toString(16).length * 4;
function gcd(a, b) {
  a = babs(a); b = babs(b);
  for (;;) {
    if (a < b) { const t = a; a = b; b = t; }
    if (b === 0n) return a;
    if (a < SMALLGCD) return euclid(a, b);
    const h = BigInt(hexBits(a) - 62);
    let x = a >> h, y = b >> h, A = 1n, B = 0n, C = 0n, D = 1n;
    for (;;) {
      if (y + C === 0n || y + D === 0n) break;
      const q = (x + A) / (y + C);
      if (q !== (x + B) / (y + D)) break;
      let t = A - q * C; A = C; C = t;
      t = B - q * D; B = D; D = t;
      t = x - q * y; x = y; y = t;
    }
    if (B === 0n) { const t = a % b; a = b; b = t; } else { const na = A * a + B * b, nb = C * a + D * b; a = na; b = nb; }
  }
}
const Q = {
  make(n, d = 1n) { if (d === 0n) throw new Error('a zero denominator'); if (d < 0n) { n = -n; d = -d; } if (d === 1n) return { n, d }; const g = gcd(n, d); return g === 1n ? { n, d } : { n: n / g, d: d / g }; },
  int(k) { return { n: BigInt(k), d: 1n }; },
  parse(s) { const t = String(s).split('/'); return Q.make(BigInt(t[0]), t.length > 1 ? BigInt(t[1]) : 1n); },
  add(x, y) { return x.d === y.d ? Q.make(x.n + y.n, x.d) : Q.make(x.n * y.d + y.n * x.d, x.d * y.d); },
  neg(x) { return { n: -x.n, d: x.d }; },
  sub(x, y) { return Q.add(x, Q.neg(y)); },
  mul(x, y) { if (x.n === 0n || y.n === 0n) return { n: 0n, d: 1n }; const g1 = gcd(x.n, y.d), g2 = gcd(y.n, x.d); return { n: (x.n / g1) * (y.n / g2), d: (x.d / g2) * (y.d / g1) }; },
  inv(x) { if (x.n === 0n) throw new Error('the inverse of 0'); return x.n < 0n ? { n: -x.d, d: -x.n } : { n: x.d, d: x.n }; },
  div(x, y) { return Q.mul(x, Q.inv(y)); },
  isZero: (x) => x.n === 0n,
  eq: (x, y) => x.n === y.n && x.d === y.d,
  sign: (x) => (x.n > 0n ? 1 : x.n < 0n ? -1 : 0),
  lt: (x, y) => x.n * y.d < y.n * x.d,
  str: (x) => (x.d === 1n ? String(x.n) : x.n + '/' + x.d),
};
const Q0 = Q.int(0), Q1 = Q.int(1);

/* ---- K0 = Q(√2): [a, b] = a + b√2; product (a,b)(c,d) = (ac + 2bd, ad + bc) (the JSON's quadraticField.product) ---- */
const K = {
  of: (a, b) => [a, b],
  int: (a, b = 0) => [Q.int(a), Q.int(b)],
  parse: (a, b) => [Q.parse(a), Q.parse(b)],
  add: (x, y) => [Q.add(x[0], y[0]), Q.add(x[1], y[1])],
  sub: (x, y) => [Q.sub(x[0], y[0]), Q.sub(x[1], y[1])],
  neg: (x) => [Q.neg(x[0]), Q.neg(x[1])],
  mul: (x, y) => [Q.add(Q.mul(x[0], y[0]), Q.mul(Q.int(2), Q.mul(x[1], y[1]))), Q.add(Q.mul(x[0], y[1]), Q.mul(x[1], y[0]))],
  scale: (x, q) => [Q.mul(x[0], q), Q.mul(x[1], q)],
  conj: (x) => [x[0], Q.neg(x[1])],
  norm: (x) => Q.sub(Q.mul(x[0], x[0]), Q.mul(Q.int(2), Q.mul(x[1], x[1]))),
  inv(x) { const n = K.norm(x); if (Q.isZero(n)) throw new Error('the inverse of 0 in K0'); return K.scale(K.conj(x), Q.inv(n)); },
  div: (x, y) => K.mul(x, K.inv(y)),
  isZero: (x) => Q.isZero(x[0]) && Q.isZero(x[1]),
  eq: (x, y) => Q.eq(x[0], y[0]) && Q.eq(x[1], y[1]),
  pow(x, e) { let r = K.int(1), b = x; while (e > 0) { if (e & 1) r = K.mul(r, b); b = K.mul(b, b); e >>= 1; } return r; },
  str: (x) => Q.str(x[0]) + (Q.sign(x[1]) < 0 ? ' - ' + Q.str(Q.neg(x[1])) : ' + ' + Q.str(x[1])) + '·√2',
};

/* ---- the curve y² = x³ + A·x over K0; a point is null (the identity) or {x, y} ---- */
function curve(A) {
  const onCurve = (P) => P === null || K.eq(K.mul(P.y, P.y), K.add(K.mul(K.mul(P.x, P.x), P.x), K.mul(A, P.x)));
  const neg = (P) => (P === null ? null : { x: P.x, y: K.neg(P.y) });
  const dbl = (P) => {
    if (P === null || K.isZero(P.y)) return null;
    const lam = K.div(K.add(K.scale(K.mul(P.x, P.x), Q.int(3)), A), K.scale(P.y, Q.int(2)));
    const x3 = K.sub(K.mul(lam, lam), K.scale(P.x, Q.int(2)));
    return { x: x3, y: K.sub(K.mul(lam, K.sub(P.x, x3)), P.y) };
  };
  const add = (P, R) => {
    if (P === null) return R; if (R === null) return P;
    if (K.eq(P.x, R.x)) return K.eq(P.y, R.y) ? dbl(P) : null;
    const lam = K.div(K.sub(R.y, P.y), K.sub(R.x, P.x));
    const x3 = K.sub(K.sub(K.mul(lam, lam), P.x), R.x);
    return { x: x3, y: K.sub(K.mul(lam, K.sub(P.x, x3)), P.y) };
  };
  const mul = (n, P) => { if (n < 0) return neg(mul(-n, P)); let r = null, b = P; while (n > 0) { if (n & 1) r = add(r, b); b = dbl(b); n >>= 1; } return r; };
  /* the 5-coordinate code of the manuscript (TeX line 263): identity (1,0,0,0,0), affine (0,x0,x1,y0,y1) */
  const code = (P) => (P === null ? [Q1, Q0, Q0, Q0, Q0] : [Q0, P.x[0], P.x[1], P.y[0], P.y[1]]);
  return { A, onCurve, neg, dbl, add, mul, code };
}

/* ---- ψ_n at a point (x, y) ∈ K0², as the polynomial recurrences evaluated there (y never squared away: f_n is a
   polynomial in x and A; ψ_n = f_n for odd n, 2y·f_n for even n, ψ_{-n} = -ψ_n). `variant` exists only for the red
   controls: it plants one wrong recurrence. ---- */
/* the ring the recurrence runs in: K0 with normalized rationals by default; a caller may pass another representation
   of the same field (tools/zq-finite.js passes integers over a power of a common denominator) — one recurrence */
const KR = { add: K.add, sub: K.sub, mul: K.mul, neg: K.neg, smul: (v, k) => K.scale(v, Q.make(BigInt(k))), int: (k) => K.int(k) };
function psiTable(A, x, y, variant, ring) {
  const R = ring || KR, f = new Map();
  const x2 = R.mul(x, x), x4 = R.mul(x2, x2), x6 = R.mul(x4, x2), A2 = R.mul(A, A), A3 = R.mul(A2, A);
  f.set(0, R.int(0)); f.set(1, R.int(1)); f.set(2, R.int(1));
  f.set(3, R.sub(R.add(R.smul(x4, 3), R.smul(R.mul(A, x2), 6)), A2));
  const f4 = R.sub(R.sub(R.add(x6, R.smul(R.mul(A, x4), 5)), R.smul(R.mul(A2, x2), 5)), A3);
  f.set(4, variant === 'f4-without-2' ? f4 : R.smul(f4, 2));
  const cub = R.add(R.mul(x2, x), R.mul(A, x));
  const D0 = R.smul(R.mul(cub, cub), 16);
  const get = (n) => {
    if (f.has(n)) return f.get(n);
    let v;
    if (n % 2 === 0) {
      const m = n / 2;
      const fm1 = get(m - 1), fp1 = get(m + 1);
      v = R.mul(get(m), R.sub(R.mul(get(m + 2), R.mul(fm1, fm1)), R.mul(get(m - 2), R.mul(fp1, fp1))));
    } else {
      const m = (n - 1) / 2, fm = get(m), fp1 = get(m + 1);
      const L = R.mul(get(m + 2), R.mul(fm, R.mul(fm, fm))), Rr = R.mul(get(m - 1), R.mul(fp1, R.mul(fp1, fp1)));
      const even = variant === 'odd-parity-swapped' ? m % 2 === 1 : m % 2 === 0;
      v = even ? R.sub(R.mul(D0, L), Rr) : R.sub(L, R.mul(D0, Rr));
    }
    f.set(n, v); return v;
  };
  const psi = (n) => { if (n < 0) return R.neg(psi(-n)); const fn = get(n); return n % 2 === 1 ? fn : R.mul(R.smul(y, 2), fn); };
  return { f: get, psi };
}

/* the code of [n]P by the division polynomials (the JSON's definitions.fixedPointCodes): x_n = x − ψ_{n+1}ψ_{n−1}/ψ_n²,
   y_n = ψ_{2n}/(2ψ_n⁴), ι(−n) = ι(n) with both y coefficients negated, ι(0) = (1,0,0,0,0) */
function iotaByPsi(A, P, n, variant, table) {
  if (n === 0) return [Q1, Q0, Q0, Q0, Q0];
  const m = Math.abs(n), t = table || psiTable(A, P.x, P.y, variant), g = t.psi(m), g2 = K.mul(g, g);
  const xn = K.sub(P.x, K.div(K.mul(t.psi(m + 1), t.psi(m - 1)), g2));
  let yn = K.div(t.psi(2 * m), K.scale(K.mul(g2, g2), Q.int(2)));
  if (variant === 'omega-sign') {                     /* the Jacobian route with the numerator sign flipped */
    const om = K.div(K.add(K.mul(t.psi(m + 2), K.mul(t.psi(m - 1), t.psi(m - 1))), K.mul(t.psi(m - 2), K.mul(t.psi(m + 1), t.psi(m + 1)))), K.scale(P.y, Q.int(4)));
    yn = K.div(om, K.mul(g2, g));
  }
  if (n < 0) yn = K.neg(yn);
  return [Q0, xn[0], xn[1], yn[0], yn[1]];
}

/* ---- univariate polynomials over Q: arrays of rationals, ascending; [] is 0 ---- */
const P = {
  trim(p) { let k = p.length; while (k > 0 && Q.isZero(p[k - 1])) k--; return p.slice(0, k); },
  c: (q) => P.trim([q]),
  deg: (p) => P.trim(p).length - 1,
  add(a, b) { const n = Math.max(a.length, b.length), r = []; for (let i = 0; i < n; i++) r.push(Q.add(a[i] || Q0, b[i] || Q0)); return P.trim(r); },
  neg: (a) => a.map(Q.neg),
  sub: (a, b) => P.add(a, P.neg(b)),
  mul(a, b) { if (!a.length || !b.length) return []; const r = Array.from({ length: a.length + b.length - 1 }, () => Q0); for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) r[i + j] = Q.add(r[i + j], Q.mul(a[i], b[j])); return P.trim(r); },
  scale: (a, q) => P.trim(a.map((x) => Q.mul(x, q))),
  deriv: (a) => P.trim(a.slice(1).map((x, i) => Q.mul(x, Q.int(i + 1)))),
  at(a, x) { let r = Q0; for (let i = a.length - 1; i >= 0; i--) r = Q.add(Q.mul(r, x), a[i]); return r; },
  divmod(a, b) {
    b = P.trim(b); if (!b.length) throw new Error('polynomial division by 0');
    let r = P.trim(a); const q = []; const db = b.length - 1, lb = b[db];
    while (r.length - 1 >= db && r.length) { const k = r.length - 1 - db, coef = Q.div(r[r.length - 1], lb); q[k] = coef; const sub = []; for (let i = 0; i < k; i++) sub.push(Q0); for (const x of b) sub.push(Q.mul(x, coef)); r = P.sub(r, sub); }
    for (let i = 0; i < q.length; i++) if (!q[i]) q[i] = Q0;
    return { q: P.trim(q), r };
  },
  gcd(a, b) { a = P.trim(a); b = P.trim(b); while (b.length) { const r = P.divmod(a, b).r; a = b; b = r; } return a.length ? P.scale(a, Q.inv(a[a.length - 1])) : a; },
};
/* the number of distinct real roots of p (Sturm); Infinity for the zero polynomial */
function realRoots(p) {
  p = P.trim(p); if (!p.length) return Infinity; if (p.length === 1) return 0;
  const seq = [p, P.deriv(p)];
  for (;;) { const r = P.divmod(seq[seq.length - 2], seq[seq.length - 1]).r; if (!r.length) break; seq.push(P.neg(r)); }
  const signs = (plus) => seq.map((q) => { const s = Q.sign(q[q.length - 1]); return plus || (q.length - 1) % 2 === 0 ? s : -s; });
  const changes = (ss) => { let c = 0, prev = 0; for (const s of ss) { if (s && prev && s !== prev) c++; if (s) prev = s; } return c; };
  return changes(signs(false)) - changes(signs(true));
}
/* the rational witnesses of R(w) = 0: 'any' (R ≡ 0), 'none' (no real root), 'one' (one real root, rational, checked),
   or 'other' (a real root this module does not pin down; the caller refuses) */
function solveWitness(R) {
  R = P.trim(R);
  if (!R.length) return { kind: 'any', root: Q0 };
  const n = realRoots(R);
  if (n === 0) return { kind: 'none', realRoots: 0 };
  const sf = P.divmod(R, P.gcd(R, P.deriv(R))).q;
  if (n === 1 && sf.length === 2) { const root = Q.neg(Q.div(sf[0], sf[1])); if (Q.isZero(P.at(R, root))) return { kind: 'one', root, realRoots: 1 }; }
  return { kind: 'other', realRoots: n };
}

/* a self-test of the fast gcd against Euclid on deterministic pseudo-random pairs (64 to ~6,000 digits); callers
   record its outcome as a row */
function gcdSelfTest() {
  let s = 0x2545F4914F6CDD1Dn, bad = 0, n = 0; const M = (1n << 64n) - 1n;
  const rnd = (words) => { let x = 0n; for (let i = 0; i < words; i++) { s ^= (s << 13n) & M; s ^= s >> 7n; s ^= (s << 17n) & M; x = (x << 64n) | s; } return x; };
  for (const words of [1, 2, 3, 5, 9, 33, 129, 300]) for (let k = 0; k < 12; k++) {
    const g = rnd(1 + (k % 4) * Math.max(1, words >> 2)), a = rnd(words) * g + BigInt(k), b = rnd(Math.max(1, words - (k % 3))) * g;
    n++; if (gcd(a, b) !== euclid(a, b) || gcd(-a, b) !== euclid(a, b) || gcd(a * g, b * g) !== euclid(a * g, b * g)) bad++;
  }
  return { pairs: n, disagreements: bad };
}

module.exports = { gcd, euclid, gcdSelfTest, Q, Q0, Q1, K, curve, psiTable, iotaByPsi, P, realRoots, solveWitness };
