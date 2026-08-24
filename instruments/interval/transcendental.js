/* transcendental.js — sound interval exp / log / sin / cos / tanh.

   WHY THIS FILE EXISTS. PLAN.md §5.3 once said JS cannot soundly enclose
   transcendentals without Rust. core/interval/tests/probe-transcendental.js measured
   the opposite: a truncated series with a rigorous remainder, evaluated inside
   the already-validated interval model, produces a valid enclosure. Rust still
   buys tightness, speed, and a cross-language witness — not soundness.

   RIGOR. Every returned interval must CONTAIN the true real value. Containment
   is checked in tests/test-transcendental.js against independent exact-rational
   brackets (and red controls that omit the tail bound). Bad domains refuse by
   throw — never a silent wrong box.

   SCOPE (closed list). exp, log, sin, cos, tanh. Named consumers:
   attention-geometry / softmax H/PR enclose (exp/log); edge-of-chaos /
   aerospace / Path 5 (sin/cos/tanh). No fractional pow until a battery demands it.
   See research/interval-transcendentals.html.

   MIT licensed. Part of eqcert. */
'use strict';

const I = require('./interval.js');
const Q = require('./rational.js');
const { iv, add, sub, mul, div, neg, ONE, ZERO, nextUp, nextDown } = I;

const _buf = new ArrayBuffer(8);
const _f64 = new Float64Array(_buf);
const _u64 = new BigUint64Array(_buf);

const EXP_TERMS = 24;
const LOG_TERMS = 40;
const LN2_SERIES_TERMS = 48;
const TRIG_TERMS = 16;
const PI_ARCTAN_TERMS = 40;
const TANH_SAT = 20;

function qpowInt(a, n) {
  let r = Q.ONE;
  for (let i = 0; i < n; i++) r = Q.mul(r, a);
  return r;
}

function qToIv(loQ, hiQ) {
  let lo = Q.toDouble(loQ), hi = Q.toDouble(hiQ);
  while (Q.cmp(Q.fromDouble(lo), loQ) > 0) lo = nextDown(lo);
  while (Q.cmp(Q.fromDouble(hi), hiQ) < 0) hi = nextUp(hi);
  return iv(lo, hi);
}

/* ln(2) = 2 Σ_{k=0}^∞ 1/((2k+1) 3^{2k+1}), with a geometric remainder bound. */
function ln2Interval() {
  let sum = Q.ZERO;
  for (let k = 0; k < LN2_SERIES_TERMS; k++) {
    const odd = 2 * k + 1;
    const denom = Q.mul(Q.R(odd), qpowInt(Q.R(3), odd));
    sum = Q.add(sum, Q.div(Q.ONE, denom));
  }
  sum = Q.mul(Q.R(2), sum);
  const K = LN2_SERIES_TERMS;
  const oddK = 2 * K + 1;
  const rem = Q.div(Q.mul(Q.R(2), Q.R(9)), Q.mul(qpowInt(Q.R(3), oddK), Q.R(8)));
  return qToIv(Q.sub(sum, rem), Q.add(sum, rem));
}

const LN2 = ln2Interval();

/* arctan(u) for 0 < u < 1: Σ (-1)^k u^{2k+1}/(2k+1), |R| < u^{2K+1}/(2K+1). */
function arctanPosQ(uNum, uDen, terms) {
  const U = Q.div(Q.R(uNum), Q.R(uDen));
  let sum = Q.ZERO;
  let pow = U;
  const U2 = Q.mul(U, U);
  for (let k = 0; k < terms; k++) {
    const term = Q.div(pow, Q.R(2 * k + 1));
    sum = (k % 2 === 0) ? Q.add(sum, term) : Q.sub(sum, term);
    pow = Q.mul(pow, U2);
  }
  const rem = Q.div(pow, Q.R(2 * terms + 1));
  return [Q.sub(sum, rem), Q.add(sum, rem)];
}

/* Machin: π/4 = 4 arctan(1/5) − arctan(1/239). */
function piInterval() {
  const [aLo, aHi] = arctanPosQ(1, 5, PI_ARCTAN_TERMS);
  const [bLo, bHi] = arctanPosQ(1, 239, PI_ARCTAN_TERMS);
  const fourALo = Q.mul(Q.R(4), aLo);
  const fourAHi = Q.mul(Q.R(4), aHi);
  const qLo = Q.mul(Q.R(4), Q.sub(fourALo, bHi));
  const qHi = Q.mul(Q.R(4), Q.sub(fourAHi, bLo));
  return qToIv(qLo, qHi);
}

const PI = piInterval();
const TWO_PI = mul(iv(2), PI);
const HALF_PI = div(PI, iv(2));

/* Exact split x = m · 2^e for positive finite normals, m ∈ [1, 2). */
function splitPow2(x) {
  if (!(x > 0) || !Number.isFinite(x)) {
    throw new Error('transcendental: splitPow2 needs positive finite, got ' + x);
  }
  _f64[0] = x;
  let bits = _u64[0];
  const eBits = Number((bits >> 52n) & 0x7ffn);
  if (eBits === 0 || eBits === 2047) {
    throw new Error('transcendental: splitPow2 refuses subnormal/non-finite');
  }
  const e = eBits - 1023;
  bits = (bits & 0x800fffffffffffffn) | (1023n << 52n);
  _u64[0] = bits;
  return { m: _f64[0], e };
}

/* exp on a thin/narrow interval: x = k ln2 + r with |r| < 1, Taylor + tail. */
function expNarrow(X) {
  if (!(X[0] <= X[1]) || !Number.isFinite(X[0]) || !Number.isFinite(X[1])) {
    throw new Error('transcendental.exp: non-finite or inverted interval');
  }
  const mid = (X[0] + X[1]) / 2;
  const k = Math.round(mid / 0.6931471805599453);
  const r = sub(X, mul(iv(k), LN2));
  const rmag = Math.max(Math.abs(r[0]), Math.abs(r[1]));
  if (!(rmag < 1)) {
    throw new Error('transcendental.exp: argument reduction left |r|=' + rmag + ' >= 1');
  }
  let sum = ONE, term = ONE;
  for (let n = 1; n <= EXP_TERMS; n++) {
    term = div(mul(term, r), iv(n));
    sum = add(sum, term);
  }
  let fact = 1, p = 1;
  for (let n = 1; n <= EXP_TERMS + 1; n++) { fact *= n; p *= rmag; }
  const tail = nextUp((p / fact) / (1 - rmag / (EXP_TERMS + 2)));
  sum = add(sum, iv(-tail, tail));
  if (k > 1023 || k < -1074) {
    throw new Error('transcendental.exp: 2^k out of finite range, k=' + k);
  }
  return mul(sum, iv(Math.pow(2, k)));
}

/** Interval exponential. Monotone ⇒ wide boxes use endpoint enclosures. */
function exp(X) {
  if (!Array.isArray(X) || X.length !== 2) X = iv(X);
  if (X[1] - X[0] > 1e-6) {
    return [expNarrow(iv(X[0]))[0], expNarrow(iv(X[1]))[1]];
  }
  return expNarrow(X);
}

function logMantissa(m) {
  if (m === 1) return ZERO;
  if (!(m >= 1 && m < 2)) {
    throw new Error('transcendental.logMantissa: need m in [1,2), got ' + m);
  }
  const V = div(sub(iv(m), ONE), add(iv(m), ONE));
  const vmax = Math.max(Math.abs(V[0]), Math.abs(V[1]));
  if (!(vmax < 0.34)) {
    throw new Error('transcendental.logMantissa: |v|=' + vmax + ' not in [0,1/3)');
  }
  let sum = ZERO;
  let vpow = V;
  const V2 = mul(V, V);
  for (let k = 0; k < LOG_TERMS; k++) {
    const odd = 2 * k + 1;
    sum = add(sum, div(vpow, iv(odd)));
    vpow = mul(vpow, V2);
  }
  let p = 1;
  for (let n = 0; n < 2 * LOG_TERMS + 1; n++) p *= vmax;
  const denom = (2 * LOG_TERMS + 1) * (1 - vmax * vmax);
  const tail = nextUp(p / denom);
  return mul(iv(2), add(sum, iv(0, tail)));
}

function logPoint(x) {
  if (!(x > 0) || !Number.isFinite(x)) {
    throw new Error('transcendental.log: need positive finite, got ' + x);
  }
  if (x === 1) return ZERO;
  const { m, e } = splitPow2(x);
  const lm = logMantissa(m);
  if (e === 0) return lm;
  return add(lm, mul(iv(e), LN2));
}

/** Interval natural log. Domain: lo > 0. Monotone ⇒ endpoints. */
function log(X) {
  if (!Array.isArray(X) || X.length !== 2) X = iv(X);
  if (!(X[0] > 0) || !(X[1] > 0) || !(X[0] <= X[1])) {
    throw new Error('transcendental.log: need positive interval, got [' + X[0] + ',' + X[1] + ']');
  }
  return [logPoint(X[0])[0], logPoint(X[1])[1]];
}

/* Taylor sin/cos on a box with |x| ≤ 2 (covers reduced [-π/2, π/2]).
   |R_n| ≤ |x|^{n+1}/(n+1)! since |f^{(n+1)}| ≤ 1. */
function sinSeries(X) {
  const rmag = Math.max(Math.abs(X[0]), Math.abs(X[1]));
  if (!(rmag <= 2)) {
    throw new Error('transcendental.sinSeries: |x|=' + rmag + ' > 2');
  }
  let sum = ZERO, term = X;
  for (let n = 0; n < TRIG_TERMS; n++) {
    sum = add(sum, term);
    const k = 2 * n + 2;
    term = neg(div(mul(term, mul(X, X)), iv(k * (k + 1))));
  }
  let fact = 1, p = 1;
  const deg = 2 * TRIG_TERMS + 1;
  for (let n = 1; n <= deg; n++) { fact *= n; p *= rmag; }
  const tail = nextUp(p / fact);
  return add(sum, iv(-tail, tail));
}

function cosSeries(X) {
  const rmag = Math.max(Math.abs(X[0]), Math.abs(X[1]));
  if (!(rmag <= 2)) {
    throw new Error('transcendental.cosSeries: |x|=' + rmag + ' > 2');
  }
  let sum = ONE, term = ONE;
  for (let n = 0; n < TRIG_TERMS; n++) {
    const k = 2 * n + 1;
    term = neg(div(mul(term, mul(X, X)), iv(k * (k + 1))));
    sum = add(sum, term);
  }
  let fact = 1, p = 1;
  const deg = 2 * TRIG_TERMS + 2;
  for (let n = 1; n <= deg; n++) { fact *= n; p *= rmag; }
  const tail = nextUp(p / fact);
  return add(sum, iv(-tail, tail));
}

/** Reduce x = n·(π/2) + r with |r| ≲ π/4…π/2; return series args + quadrant n mod 4.
   Quadrant table (n mod 4):
     0: sin=sin r,  cos=cos r
     1: sin=cos r,  cos=−sin r
     2: sin=−sin r, cos=−cos r
     3: sin=−cos r, cos=sin r */
function reduceTrigPoint(x) {
  if (!Number.isFinite(x)) {
    throw new Error('transcendental.reduce: non-finite angle');
  }
  const halfPiMid = (HALF_PI[0] + HALF_PI[1]) / 2;
  const n = Math.round(x / halfPiMid);
  const r = sub(iv(x), mul(iv(n), HALF_PI));
  const rmag = Math.max(Math.abs(r[0]), Math.abs(r[1]));
  if (!(rmag <= HALF_PI[1] + 0.02)) {
    throw new Error('transcendental.reduce: |r|=' + rmag + ' after n=' + n);
  }
  return { r, q: ((n % 4) + 4) % 4 };
}

function sinPoint(x) {
  if (x === 0) return ZERO;
  const { r, q } = reduceTrigPoint(x);
  const s = sinSeries(r), c = cosSeries(r);
  if (q === 0) return s;
  if (q === 1) return c;
  if (q === 2) return neg(s);
  return neg(c);
}

function cosPoint(x) {
  if (x === 0) return ONE;
  const { r, q } = reduceTrigPoint(x);
  const s = sinSeries(r), c = cosSeries(r);
  if (q === 0) return c;
  if (q === 1) return neg(s);
  if (q === 2) return neg(c);
  return s;
}

/* Enclosure of 3*pi/2, outward-rounded, for the sin minimum. */
const THREE_HALF_PI = [nextDown(PI[0] + HALF_PI[0]), nextUp(PI[1] + HALF_PI[1])];

/** Might [a,b] contain a real of the form BASE + k*2pi for some integer k?
 *
 *  CONSERVATIVE BY CONSTRUCTION: it may answer true when the critical point is
 *  merely near the box, and must NEVER answer false when one is inside. A false
 *  positive only widens the result; a false negative makes it unsound. Every
 *  candidate phase is built as an interval and pushed outward one ulp before the
 *  overlap test, and the k window carries one extra step on each side, so the
 *  error can only ever land on the safe side. */
function containsPhase(a, b, BASE) {
  if (b - a >= TWO_PI[0]) return true;
  const kLo = Math.floor((a - BASE[1]) / TWO_PI[0]) - 1;
  const kHi = Math.ceil((b - BASE[0]) / TWO_PI[0]) + 1;
  if (!Number.isFinite(kLo) || !Number.isFinite(kHi)) return true;   /* refuse to guess */
  for (let k = kLo; k <= kHi; k++) {
    /* enclosure of BASE + k*2pi; multiplying by a negative k swaps the bounds */
    const lo = k >= 0 ? BASE[0] + k * TWO_PI[0] : BASE[0] + k * TWO_PI[1];
    const hi = k >= 0 ? BASE[1] + k * TWO_PI[1] : BASE[1] + k * TWO_PI[0];
    if (nextUp(hi) >= a && nextDown(lo) <= b) return true;
  }
  return false;
}

/** Interval sin — a true enclosure over the whole box.
 *
 *  REWRITTEN 2026-08-08. Both previous branches were UNSOUND, and the file's own
 *  header ("Every returned interval must CONTAIN the true real value") was the
 *  claim they broke:
 *
 *    narrow (width <= 1e-6)  returned sinPoint(midpoint) — an enclosure of sin at
 *                            ONE POINT, not over the box. sin([1,1+1e-9]) came back
 *                            strictly INSIDE the true range, missing both endpoints.
 *    wide                    hulled the two endpoints and only widened to [-1,1]
 *                            when the width exceeded pi/2. But a critical point
 *                            needs no such width to sit inside: sin([1,2]) returned
 *                            [0.8415, 0.9093] while the true maximum is 1 at pi/2.
 *
 *  Why the battery never caught it: T10 tests sin(iv(x)) for SCALAR x — degenerate
 *  boxes, where the midpoint IS the whole interval and sinPoint is trivially right.
 *  The suite exercised D1 (accepts correct) and never D3 (rejects wrong), which is
 *  the exact failure research/evidence-first-bench measures in other people's
 *  suites. See tests/test-transcendental-enclosure.js, written with this fix.
 *
 *  Now: hull the endpoint enclosures, then force the bound to +/-1 whenever a
 *  critical point may lie inside. Monotone boxes stay tight; boxes straddling an
 *  extremum widen to the truth instead of reporting the chord. */
function sin(X) {
  if (!Array.isArray(X) || X.length !== 2) X = iv(X);
  if (!(X[0] <= X[1]) || !Number.isFinite(X[0]) || !Number.isFinite(X[1])) {
    throw new Error('transcendental.sin: bad interval');
  }
  if (X[1] - X[0] >= TWO_PI[0]) return iv(-1, 1);
  const a = sinPoint(X[0]), b = sinPoint(X[1]);
  let lo = Math.min(a[0], b[0]), hi = Math.max(a[1], b[1]);
  if (containsPhase(X[0], X[1], HALF_PI)) hi = 1;            /* sin = +1 */
  if (containsPhase(X[0], X[1], THREE_HALF_PI)) lo = -1;     /* sin = -1 */
  return iv(Math.max(-1, lo), Math.min(1, hi));
}

/** Interval cos. Same rewrite, same reasons; extrema at 2k*pi and pi + 2k*pi. */
function cos(X) {
  if (!Array.isArray(X) || X.length !== 2) X = iv(X);
  if (!(X[0] <= X[1]) || !Number.isFinite(X[0]) || !Number.isFinite(X[1])) {
    throw new Error('transcendental.cos: bad interval');
  }
  if (X[1] - X[0] >= TWO_PI[0]) return iv(-1, 1);
  const a = cosPoint(X[0]), b = cosPoint(X[1]);
  let lo = Math.min(a[0], b[0]), hi = Math.max(a[1], b[1]);
  if (containsPhase(X[0], X[1], [0, 0])) hi = 1;             /* cos = +1 */
  if (containsPhase(X[0], X[1], PI)) lo = -1;                /* cos = -1 */
  return iv(Math.max(-1, lo), Math.min(1, hi));
}

function tanhPoint(x) {
  if (!Number.isFinite(x)) {
    throw new Error('transcendental.tanh: non-finite');
  }
  if (x === 0) return ZERO;
  if (x < 0) return neg(tanhPoint(-x));
  if (x >= TANH_SAT) {
    /* 0 < 1 − tanh(x) = 2/(e^{2x}+1) < 2 e^{-2x} ≤ 2 e^{-40} < 4e-17 */
    const gap = nextUp(4e-17);
    return iv(nextDown(1 - gap), 1);
  }
  const E = exp(iv(2 * x));
  return div(sub(E, ONE), add(E, ONE));
}

/** Interval tanh. Odd, strictly increasing ⇒ endpoints. */
function tanh(X) {
  if (!Array.isArray(X) || X.length !== 2) X = iv(X);
  if (!(X[0] <= X[1]) || !Number.isFinite(X[0]) || !Number.isFinite(X[1])) {
    throw new Error('transcendental.tanh: bad interval');
  }
  return [tanhPoint(X[0])[0], tanhPoint(X[1])[1]];
}

module.exports = {
  exp, log, logPoint, sin, cos, tanh,
  LN2, PI, HALF_PI, TWO_PI,
  splitPow2, EXP_TERMS, LOG_TERMS, TRIG_TERMS
};
