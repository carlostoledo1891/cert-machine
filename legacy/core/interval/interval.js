/* interval.js — outward-rounded interval arithmetic over IEEE-754 doubles.

   RIGOR MODEL, stated once and relied on everywhere downstream. JavaScript has
   no access to the FPU rounding mode, so directed rounding is SIMULATED: every
   IEEE-754 basic operation (+ − × ÷ and sqrt) returns the correctly rounded
   nearest double, so the exact real result lies strictly within half an ulp of
   the computed value. Widening the computed bounds outward by ONE ulp (nextDown
   on the lower end, nextUp on the upper) therefore encloses the exact result.
   This is conservative by a factor of ~2 in the last bit and costs nothing at
   the accuracy we need.

   The library is not trusted on assertion: tests/test-interval.js checks every
   operation against EXACT BigInt rational arithmetic on thousands of random
   operands, and mutation-tests the widening (removing it turns the check red).

   That sentence was FALSE from the day it was written until 2026-07-28: the file it
   names did not exist, and the battery that did cover intervals (test-eqcert.js I2)
   exercises 4 of these exports. `pow` therefore had no coverage and was wrong —
   it returned [1,1] for every negative exponent. The file now exists, runs first in
   `make check-eqcert`, and covers every export. Left as a standing reminder that a cited
   test is not a test: the citation was read as evidence for months.

   Sequence algebra (weighted ell^1_nu, convolution, parity) lives in
   src/sequence.js; this file is arithmetic only.

   MIT licensed. Part of eqcert — the single source of truth for interval
   arithmetic across every project here. Vendored copies are gated
   byte-identical; never edit a copy. */
'use strict';

const _buf = new ArrayBuffer(8);
const _f64 = new Float64Array(_buf);
const _u64 = new BigUint64Array(_buf);

function nextUp(x) {
  if (Number.isNaN(x) || x === Infinity) return x;
  if (x === 0) return Number.MIN_VALUE;
  _f64[0] = x; _u64[0] += (x > 0 ? 1n : -1n); return _f64[0];
}
function nextDown(x) { return -nextUp(-x); }

/* an interval is a 2-array [lo, hi]; `iv(x)` is the thin (point) interval */
const iv = (lo, hi) => [lo, hi === undefined ? lo : hi];
const ZERO = iv(0), ONE = iv(1);

function add(a, b) { return [nextDown(a[0] + b[0]), nextUp(a[1] + b[1])]; }
function sub(a, b) { return [nextDown(a[0] - b[1]), nextUp(a[1] - b[0])]; }
function mul(a, b) {
  const p = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
  return [nextDown(Math.min(p[0], p[1], p[2], p[3])),
          nextUp(Math.max(p[0], p[1], p[2], p[3]))];
}
function div(a, b) {
  if (b[0] <= 0 && b[1] >= 0) throw new Error('interval division by an interval containing 0');
  const q = [a[0] / b[0], a[0] / b[1], a[1] / b[0], a[1] / b[1]];
  return [nextDown(Math.min(q[0], q[1], q[2], q[3])),
          nextUp(Math.max(q[0], q[1], q[2], q[3]))];
}
function neg(a) { return [-a[1], -a[0]]; }
/* A square is never negative, so the lower bound is clamped at 0. Without the clamp,
   sqr([0,0]) returned [-5e-324, 5e-324] — nextDown(0) steps to the smallest negative
   denormal — and a consumer testing `sqr(x)[0] >= 0` to prove non-negativity would be
   defeated by the one case where non-negativity is certain. Clamping only TIGHTENS: 0 is
   a true lower bound for x² always, so enclosure is preserved. The third branch below
   already did this; the first two did not. (2026-07-28, found by tests/test-interval.js.) */
function sqr(a) {                       /* tighter than mul(a,a) across 0 */
  if (a[0] >= 0) return [Math.max(0, nextDown(a[0] * a[0])), nextUp(a[1] * a[1])];
  if (a[1] <= 0) return [Math.max(0, nextDown(a[1] * a[1])), nextUp(a[0] * a[0])];
  const m = Math.max(-a[0], a[1]);
  return [0, nextUp(m * m)];
}
/* |a| as an interval of the modulus, and the scalar sup|a| */
function abs(a) {
  if (a[0] >= 0) return [a[0], a[1]];
  if (a[1] <= 0) return [-a[1], -a[0]];
  return [0, Math.max(-a[0], a[1])];
}
const mag = a => Math.max(Math.abs(a[0]), Math.abs(a[1]));   /* sup |a| */
const mig = a => (a[0] > 0 ? a[0] : a[1] < 0 ? -a[1] : 0);   /* inf |a| */
const contains = (a, x) => a[0] <= x && x <= a[1];
const subset = (a, b) => b[0] <= a[0] && a[1] <= b[1];       /* a ⊆ b */
const interior = (a, b) => b[0] < a[0] && a[1] < b[1];       /* a ⊂ int(b) */
const width = a => nextUp(a[1] - a[0]);

/* Integer power with a rigorous enclosure (repeated squaring).
   NEGATIVE EXPONENTS: `while (e > 0)` never runs for n < 0, so this silently returned
   ONE = [1,1] for every negative n — pow([2,2],-1) claimed to enclose 0.5 and did not.
   A wrong enclosure is worse than a refusal, and this one was silent. n < 0 now goes
   through div, which REFUSES a base straddling 0 (there 1/x is unbounded and no finite
   interval encloses it). Non-integer n is refused rather than truncated: `e >>= 1` would
   have quietly floored it. Found 2026-07-28 with 0 call sites in the tree — a loaded
   trap, not a live wound; every certificate in `ledger/` predates and avoids it. */
function pow(a, n) {
  if (!Number.isInteger(n)) throw new Error('interval pow: exponent must be an integer, got ' + n);
  if (n < 0) return div(ONE, pow(a, -n));
  let r = ONE, base = a, e = n;
  while (e > 0) { if (e & 1) r = mul(r, base); base = mul(base, base); e >>= 1; }
  return r;
}

/* ---------- Stage 2.4 — thin floats and the trigonometric pad ----------
   Math.cos / Math.sin are implementation-approximated with NO ECMAScript accuracy
   bound. The positivity kernels used a remembered ±1e-15 pad that under-covered the
   float mul-chain argument error by ≥16× on the Fourier grids in this monorepo
   (TOPIC B6: measured 1.641e-14). Until a Taylor / Payne–Hanek interval cos ships
   (sound interval exp/log: src/transcendental.js), enclose the float evaluation
   by a DERIVED absolute pad: |d cos/dθ|≤1 and |d sin/dθ|≤1, so
     pad(ang) = 2·ε·|ang| + ε
   dominates a 2-ulp relative argument defect plus one ulp of the result.
   encloseFloat widens a correctly-rounded image of a real (e.g. Math.PI) by one
   ulp each side — the last-ulp thin-scalar hardening for 2π. */
function trigAbsPad(ang) {
  return nextUp(2 * Number.EPSILON * Math.abs(ang) + Number.EPSILON);
}
function encloseCos(ang) {
  const cv = Math.cos(ang), p = trigAbsPad(ang);
  return [nextDown(cv - p), nextUp(cv + p)];
}
function encloseSin(ang) {
  const sv = Math.sin(ang), p = trigAbsPad(ang);
  return [nextDown(sv - p), nextUp(sv + p)];
}
function encloseFloat(x) {
  return [nextDown(x), nextUp(x)];
}

module.exports = {
  nextUp, nextDown, iv, ZERO, ONE,
  add, sub, mul, div, neg, sqr, abs, mag, mig,
  contains, subset, interior, width, pow,
  trigAbsPad, encloseCos, encloseSin, encloseFloat
};
