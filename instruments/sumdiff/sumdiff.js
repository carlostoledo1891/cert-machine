/* instruments/sumdiff/sumdiff.js — entropy certificates for the sum–difference constants of
   Tao–Davis–Ivanisvili's optimization-constants registry (C3b, C3c), decided here with no code shared
   with the claimants' checkers (theirs: Python Fractions + mpmath intervals; this: BigInt exact
   pushforwards + instruments/bigfloat directed-rounding intervals).

   THE CLAIM A CERTIFICATE MAKES. For a finitely supported law μ on Z² (a list of points with positive
   rational weights summing to exactly 1), write H_L for the Shannon entropy, in nats, of the pushforward of μ
   under a linear form L. The entropy formulation of the constant (registry 3b, 3c; Green–Ruzsa 2019):
     C3b = the least C with H(X−Y) ≤ C · max(H(X), H(Y), H(X+Y)),
     C3c = the least C with H(X−Y) ≤ C · max(H(X), H(Y), H(X+Y), H(X+2Y)),
   so ONE law gives the lower bound C ≥ ρ(μ) = H(X−Y) / max(…). A claim "C ≥ c" printed from a certificate is
   decided by enclosing ρ(μ): CERTIFIED when the enclosure lies above c, REFUTED when it lies below, and
   REFUSED when it straddles c at the largest precision tried (an equality is never certified).

   THE ARITHMETIC. Pushforwards are exact (BigInt numerators over the certificate's common denominator). Each
   entropy term −p ln p is an interval at P bits: p by fromRatio (outward), ln p by bigfloat's log (outward),
   the product and the sum rounded outward. max over intervals is taken endpoint-wise; the ratio is interval
   division. Precision starts at 128 bits and doubles to 1024 while the verdict straddles.

   THE DOOR. A certificate is refused before any arithmetic if a weight is not a positive integer over the
   common denominator, if the weights do not sum to it exactly, or if a coordinate is not an integer. */
'use strict';
const B = require('../bigfloat/bigfloat.js');
const F = require('../bigfloat/functions.js');

const FORMS = { '3b': [[1, 0], [0, 1], [1, 1]], '3c': [[1, 0], [0, 1], [1, 1], [1, 2]] };
const TARGET = [1, -1];
const PRECISIONS = [128, 256, 512, 1024];

/* JSON with integers past 2^53 (the certificates print 10^320-denominator numerators bare): every integer
   literal of 16+ digits in a value position is read as a string before JSON.parse, so none is rounded */
function parseExact(text) {
  return JSON.parse(text.replace(/([\[,:]\s*)(-?\d{16,})(?=\s*[,\]}])/g, '$1"$2"'));
}
const big = (v) => {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') { if (!Number.isSafeInteger(v)) throw new Error('an unsafe integer reached the reader: ' + v); return BigInt(v); }
  if (typeof v === 'string' && /^-?\d+$/.test(v)) return BigInt(v);
  throw new Error('not an integer: ' + v);
};
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const pow10 = (s) => { const m = /^10\^(\d+)$/.exec(String(s)); if (!m) throw new Error('denominator not of the form 10^k: ' + s); return 10n ** BigInt(m[1]); };

/* the three encodings on disk, read into one: { problem, pts: [[x, y, num]], den } with Σ num = den */
function readCertificate(obj) {
  const problem = String(obj.problem || '').replace(/^C_?/i, '').toLowerCase();
  if (!FORMS[problem]) throw new Error('not a 3b or 3c certificate: ' + obj.problem);
  let pts, den;
  if (Array.isArray(obj.weights)) {                                   /* MI2026 3b: {x, y, num, den} per point */
    den = obj.weights.reduce((L, w) => { const d = big(w.den); return L / gcd(L, d) * d; }, 1n);
    pts = obj.weights.map((w) => [big(w.x), big(w.y), big(w.num) * (den / big(w.den))]);
  } else if (Array.isArray(obj.distribution_x_y_numden)) {             /* MI2026 3c: [x, y, [num, den]] */
    den = obj.distribution_x_y_numden.reduce((L, [, , nd]) => { const d = big(nd[1]); return L / gcd(L, d) * d; }, 1n);
    pts = obj.distribution_x_y_numden.map(([x, y, nd]) => [big(x), big(y), big(nd[0]) * (den / big(nd[1]))]);
  } else if (Array.isArray(obj.distribution_x_y_num)) {               /* L2026 3c: [x, y, num] over 10^k */
    den = pow10(obj.denominator);
    pts = obj.distribution_x_y_num.map(([x, y, n]) => [big(x), big(y), big(n)]);
  } else throw new Error('no distribution in a known encoding');
  return door({ problem, pts, den });
}
function door(c) {
  let s = 0n;
  const seen = new Set();
  for (const [x, y, n] of c.pts) {
    if (!(n > 0n)) throw new Error('REFUSED: a weight is not positive');
    const k = x + ',' + y; if (seen.has(k)) throw new Error('REFUSED: a point is listed twice'); seen.add(k);
    s += n;
  }
  if (s !== c.den) throw new Error('REFUSED: the weights sum to ' + s + '/' + c.den + ', not 1');
  return c;
}

/* the pushforward under x·a + y·b: value → numerator over the same denominator, exact */
function pushforward(c, [a, b]) {
  const m = new Map();
  for (const [x, y, n] of c.pts) { const v = (x * BigInt(a) + y * BigInt(b)).toString(); m.set(v, (m.get(v) || 0n) + n); }
  return m;
}
/* H = Σ −p ln p over the atoms, an interval at P bits */
function entropy(c, form, P) {
  let H = B.fromInt(0);
  for (const n of pushforward(c, form).values()) {
    const p = B.fromRatio(n, c.den, P);
    H = B.sub(H, B.mul(p, F.log(p, P), P), P);
  }
  return H;
}
const maxI = (xs) => ({ lo: xs.map((x) => x.lo).reduce((a, b) => (B.cmp(a, b) >= 0 ? a : b)), hi: xs.map((x) => x.hi).reduce((a, b) => (B.cmp(a, b) >= 0 ? a : b)) });
function ratio(c, P) {
  const Hs = FORMS[c.problem].map((f) => entropy(c, f, P));
  const HT = entropy(c, TARGET, P);
  return { rho: B.div(HT, maxI(Hs), P), HT, Hs };
}
/* a printed decimal as an exact rational */
function decimal(s) {
  const t = String(s).trim();
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(t);
  if (!m) throw new Error('not a plain decimal: ' + s);
  const frac = m[3] || '';
  return { n: BigInt(m[1] + m[2] + frac), d: 10n ** BigInt(frac.length) };
}
/* decide "C ≥ claim" from the certificate: the verdict, the precision it took, and the enclosure */
function decide(c, claim, precisions) {
  const q = decimal(claim);
  let last = null;
  for (const P of precisions || PRECISIONS) {
    const R = ratio(c, P), Q = B.fromRatio(q.n, q.d, P);
    last = { P, R };
    if (B.cmp(R.rho.lo, Q.hi) > 0) return { verdict: 'CERTIFIED', P, R };
    if (B.cmp(R.rho.hi, Q.lo) < 0) return { verdict: 'REFUTED', P, R };
  }
  return { verdict: 'REFUSED', P: last.P, R: last.R, why: 'the enclosure still straddles the claim at ' + last.P + ' bits' };
}
/* an interval's endpoints as decimal strings to k places, rounded outward */
function digits(x, k) {
  const scale = 10n ** BigInt(k);
  const floorDiv = (a, b) => (a >= 0n ? a / b : -((-a + b - 1n) / b));
  const ceilDiv = (a, b) => -floorDiv(-a, b);
  const at = (v, up) => {                                             /* v = m · 2^e */
    const num = v.e >= 0 ? v.m * (2n ** BigInt(v.e)) * scale : v.m * scale, den = v.e >= 0 ? 1n : 2n ** BigInt(-v.e);
    const q = up ? ceilDiv(num, den) : floorDiv(num, den), neg = q < 0n, a = (neg ? -q : q).toString().padStart(k + 1, '0');
    return (neg ? '-' : '') + a.slice(0, a.length - k) + '.' + a.slice(a.length - k);
  };
  return [at(x.lo, false), at(x.hi, true)];
}

module.exports = { FORMS, TARGET, PRECISIONS, parseExact, readCertificate, door, pushforward, entropy, ratio, decimal, decide, digits };
