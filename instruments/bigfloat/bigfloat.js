/* bigfloat.js — dyadic big-float interval arithmetic with directed rounding.
   value = m · 2^e, m a BigInt of any sign, e a Number exponent. An interval is
   { lo, hi } of such values with the invariant lo <= truth <= hi; every
   operation rounds lo toward −∞ and hi toward +∞ at a caller-chosen precision
   P (bits of mantissa), so containment is preserved by construction.

   Why this exists next to instruments/interval/ (doubles) and rational.js
   (exact): doubles top out near 1e-16 relative — enough for 13-14 digits of a
   constant, not for deciding a 15-digit published claim with margin — and
   exact rationals explode through a 1.9-million-factor Euler product or a log
   series (the denominator of an exact partial product over primes to 3e7 is
   astronomically large). Directed dyadic rounding is the missing middle:
   arbitrary precision, linear cost, outward-safe.

   ROUNDING MODEL. BigInt >> is an arithmetic shift: floor division by 2^k for
   either sign. roundDown truncates the mantissa with >>, which can only move
   the value toward −∞; roundUp negates, rounds down, negates back. Both are
   identity when the mantissa already fits in P bits, so integers and dyadic
   constants pass through EXACTLY and equality tests on them stay decidable.

   The layer is not trusted on assertion: battery.js checks every operation
   against exact BigInt rationals on random operands and mutation-tests the
   rounding direction (swapping it turns the containment check red).

   MIT licensed. Part of cert-machine. */
'use strict';

const bitLen = (m) => (m < 0n ? -m : m).toString(2).length;

const bf = (m, e) => ({ m: BigInt(m), e: e | 0 });
const ZERO = bf(0n, 0);

function isZero(x) { return x.m === 0n; }

/* directed rounding to P bits of mantissa; exact when it already fits */
function roundDown(x, P) {
  const b = bitLen(x.m);
  if (b <= P) return x;
  const k = BigInt(b - P);
  return { m: x.m >> k, e: x.e + (b - P) };       /* >> floors toward −∞ */
}
function roundUp(x, P) {
  const b = bitLen(x.m);
  if (b <= P) return x;
  const k = BigInt(b - P);
  return { m: -((-x.m) >> k), e: x.e + (b - P) }; /* ceil via floor of the negation */
}

/* exact operations on values (no rounding — callers round) */
function addExact(a, b) {
  if (a.e === b.e) return { m: a.m + b.m, e: a.e };
  if (a.e < b.e) return { m: a.m + (b.m << BigInt(b.e - a.e)), e: a.e };
  return { m: (a.m << BigInt(a.e - b.e)) + b.m, e: b.e };
}
const negExact = (a) => ({ m: -a.m, e: a.e });
const subExact = (a, b) => addExact(a, negExact(b));
const mulExact = (a, b) => ({ m: a.m * b.m, e: a.e + b.e });

/* sign of a − b, exactly */
function cmp(a, b) {
  const d = subExact(a, b).m;
  return d < 0n ? -1 : d > 0n ? 1 : 0;
}

/* directed quotient a/b to P bits; sign handled through floor/ceil identities */
function floorDivBig(x, y) {
  const q = x / y, r = x % y;
  return (r !== 0n && ((r < 0n) !== (y < 0n))) ? q - 1n : q;
}
function divDown(a, b, P) {
  if (b.m === 0n) throw new Error('bigfloat: division by zero');
  const S = P + 2 + Math.max(0, bitLen(b.m) - bitLen(a.m));
  return roundDown({ m: floorDivBig(a.m << BigInt(S), b.m), e: a.e - b.e - S }, P);
}
function divUp(a, b, P) {
  if (b.m === 0n) throw new Error('bigfloat: division by zero');
  const S = P + 2 + Math.max(0, bitLen(b.m) - bitLen(a.m));
  return roundUp({ m: -floorDivBig(-(a.m << BigInt(S)), b.m), e: a.e - b.e - S }, P);
}

/* ---------------- intervals ---------------- */

const I = (lo, hi) => ({ lo, hi: hi === undefined ? lo : hi });
const fromInt = (n) => I(bf(n, 0));
const IZERO = fromInt(0), IONE = fromInt(1);

/* [lo, hi] enclosing the exact rational n/d */
function fromRatio(n, d, P) {
  n = BigInt(n); d = BigInt(d);
  if (d < 0n) { n = -n; d = -d; }
  const a = bf(n, 0), b = bf(d, 0);
  return I(divDown(a, b, P), divUp(a, b, P));
}

function checkI(x) {
  if (cmp(x.lo, x.hi) > 0) throw new Error('bigfloat: inverted interval');
  return x;
}

function add(x, y, P) { return I(roundDown(addExact(x.lo, y.lo), P), roundUp(addExact(x.hi, y.hi), P)); }
function sub(x, y, P) { return I(roundDown(subExact(x.lo, y.hi), P), roundUp(subExact(x.hi, y.lo), P)); }
function neg(x) { return I(negExact(x.hi), negExact(x.lo)); }

function mul(x, y, P) {
  const ps = [mulExact(x.lo, y.lo), mulExact(x.lo, y.hi), mulExact(x.hi, y.lo), mulExact(x.hi, y.hi)];
  let mn = ps[0], mx = ps[0];
  for (let i = 1; i < 4; i++) { if (cmp(ps[i], mn) < 0) mn = ps[i]; if (cmp(ps[i], mx) > 0) mx = ps[i]; }
  return I(roundDown(mn, P), roundUp(mx, P));
}

function div(x, y, P) {
  if (y.lo.m <= 0n && y.hi.m >= 0n) {
    throw new Error('bigfloat: interval division by an interval containing 0');
  }
  const cs = [
    [divDown(x.lo, y.lo, P), divUp(x.lo, y.lo, P)],
    [divDown(x.lo, y.hi, P), divUp(x.lo, y.hi, P)],
    [divDown(x.hi, y.lo, P), divUp(x.hi, y.lo, P)],
    [divDown(x.hi, y.hi, P), divUp(x.hi, y.hi, P)]
  ];
  let mn = cs[0][0], mx = cs[0][1];
  for (let i = 1; i < 4; i++) { if (cmp(cs[i][0], mn) < 0) mn = cs[i][0]; if (cmp(cs[i][1], mx) > 0) mx = cs[i][1]; }
  return I(mn, mx);
}

/* x², clamped at 0 below — a square is never negative */
function sqr(x, P) {
  const r = mul(x, x, P);
  if (r.lo.m < 0n) r.lo = ZERO;
  return r;
}

const containsZero = (x) => x.lo.m <= 0n && x.hi.m >= 0n;
const isPositive = (x) => x.lo.m > 0n;   /* certified: truth > 0 */
const isNegative = (x) => x.hi.m < 0n;   /* certified: truth < 0 */
/* certified subset: x ⊆ y */
const subset = (x, y) => cmp(y.lo, x.lo) <= 0 && cmp(x.hi, y.hi) <= 0;
/* certified disjoint: x ∩ y = ∅ */
const disjoint = (x, y) => cmp(x.hi, y.lo) < 0 || cmp(y.hi, x.lo) < 0;

/* width as a double (reporting only) */
function toNumber(x) {
  const b = bitLen(x.m);
  if (b <= 900) return Number(x.m) * Math.pow(2, x.e);
  const k = b - 64;
  return Number(x.m >> BigInt(k)) * Math.pow(2, x.e + k);
}
const widthNumber = (x) => toNumber(subExact(x.hi, x.lo));

/* directed conversion to doubles — for handing an enclosure to consumers that
   live in floats (the closed-form hunter): lo rounds down, hi rounds up, so
   the double interval still contains the truth. */
const _buf = new ArrayBuffer(8);
const _f64 = new Float64Array(_buf);
const _u64 = new BigUint64Array(_buf);
function _nextUp(x) {
  if (Number.isNaN(x) || x === Infinity) return x;
  if (x === 0) return Number.MIN_VALUE;
  _f64[0] = x; _u64[0] += (x > 0 ? 1n : -1n); return _f64[0];
}
const _nextDown = (x) => -_nextUp(-x);
function fromDoubleExact(x) {
  if (!Number.isFinite(x)) throw new Error('bigfloat: non-finite double');
  let e = 0, y = x;
  while (!Number.isInteger(y)) { y *= 2; e--; if (e < -1200) throw new Error('bigfloat: double conversion did not terminate'); }
  return { m: BigInt(y), e };
}
function toNumberDown(v) {
  let d = toNumber(v);
  while (cmp(fromDoubleExact(d), v) > 0) d = _nextDown(d);
  return d;
}
function toNumberUp(v) {
  let d = toNumber(v);
  while (cmp(fromDoubleExact(d), v) < 0) d = _nextUp(d);
  return d;
}

/* decimal string of value, rounded toward −∞ (down) or +∞ (up) to `digits`
   places after the point. Exact integer arithmetic throughout. */
function toDecimal(x, digits, dir) {
  const scale = 10n ** BigInt(digits);
  let v; /* floor(value·10^digits) or ceil */
  if (x.e >= 0) {
    v = x.m * (1n << BigInt(x.e)) * scale;
  } else {
    const num = x.m * scale, den = 1n << BigInt(-x.e);
    v = dir === 'up' ? -floorDivBig(-num, den) : floorDivBig(num, den);
  }
  const negv = v < 0n; if (negv) v = -v;
  let s = v.toString().padStart(digits + 1, '0');
  const ip = s.slice(0, s.length - digits), fp = s.slice(s.length - digits);
  return (negv ? '-' : '') + ip + (digits ? '.' + fp : '');
}

/* exact comparison of a value m·2^e against a rational n/d (d > 0): sign of v − n/d */
function cmpRat(v, n, d) {
  let lhs, rhs;
  if (v.e >= 0) { lhs = v.m * d * (1n << BigInt(v.e)); rhs = n; }
  else { lhs = v.m * d; rhs = n * (1n << BigInt(-v.e)); }
  return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
}

/* the longest decimal prefix on which lo and hi agree — the certified digits */
function agreedDecimal(x, maxDigits) {
  let out = '';
  for (let d = maxDigits; d >= 0; d--) {
    const a = toDecimal(x.lo, d, 'down'), b = toDecimal(x.hi, d, 'down');
    if (a === b) { out = a; break; }
  }
  return out;
}

module.exports = {
  bf, ZERO, isZero, bitLen, roundDown, roundUp,
  addExact, subExact, negExact, mulExact, cmp, divDown, divUp, floorDivBig,
  I, fromInt, fromRatio, IZERO, IONE, checkI,
  add, sub, neg, mul, div, sqr,
  containsZero, isPositive, isNegative, subset, disjoint,
  toNumber, widthNumber, toNumberDown, toNumberUp, fromDoubleExact,
  toDecimal, agreedDecimal, cmpRat
};
