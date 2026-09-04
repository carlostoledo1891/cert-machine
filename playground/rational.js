/* rational.js — exact rationals on BigInt. Small, and ours.

   The decision on this page is an ORDER between numbers that differ in the
   fourteenth decimal place. Floats cannot be trusted with that, and the whole
   point of the object is that concentration is monotone — so the monotonicity
   is decided here, exactly, and the pictures are drawn in float afterwards.

   Every IEEE double is exactly a dyadic rational, so nothing is lost turning
   the frozen scores into fractions: `fromFloat` is lossless, not a rounding.
*/
'use strict';

const abs = (a) => (a < 0n ? -a : a);
function gcd(a, b) { a = abs(a); b = abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }

function make(n, d) {
  if (d === 0n) throw new Error('rational: zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

const int = (k) => ({ n: BigInt(k), d: 1n });

/* lossless: decompose the double into mantissa × 2^exp and keep both exactly */
function fromFloat(x) {
  if (!Number.isFinite(x)) throw new Error('rational: non-finite');
  if (x === 0) return int(0);
  const buf = new DataView(new ArrayBuffer(8));
  buf.setFloat64(0, x);
  const hi = buf.getUint32(0), lo = buf.getUint32(4);
  const sign = hi >>> 31 ? -1n : 1n;
  const exp = (hi >>> 20) & 0x7ff;
  let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let e;
  if (exp === 0) { e = -1074; }                       // subnormal
  else { mant |= 1n << 52n; e = exp - 1075; }
  return e >= 0 ? make(sign * mant * (1n << BigInt(e)), 1n)
                : make(sign * mant, 1n << BigInt(-e));
}

const add = (a, b) => make(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => make(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => make(a.n * b.n, a.d * b.d);
const div = (a, b) => { if (b.n === 0n) throw new Error('rational: divide by zero'); return make(a.n * b.d, a.d * b.n); };
const cmp = (a, b) => { const l = a.n * b.d, r = b.n * a.d; return l < r ? -1 : l > r ? 1 : 0; };
const lt = (a, b) => cmp(a, b) < 0;
const gt = (a, b) => cmp(a, b) > 0;
const sign = (a) => (a.n < 0n ? -1 : a.n > 0n ? 1 : 0);

function pow(a, k) {
  let r = int(1), b = a, e = BigInt(k);
  while (e > 0n) { if (e & 1n) r = mul(r, b); b = mul(b, b); e >>= 1n; }
  return r;
}

/* a float VIEW of an exact number — for drawing only, never for deciding */
function toNumber(a) {
  const q = Number(a.n) / Number(a.d);
  if (Number.isFinite(q)) return q;
  // fall back through a scaled division when the parts overflow a double
  const shift = BigInt(Math.max(0, (a.n.toString(2).length - 900)));
  return Number(a.n >> shift) / Number(a.d >> shift);
}

module.exports = { make, int, fromFloat, add, sub, mul, div, cmp, lt, gt, sign, pow, toNumber };
