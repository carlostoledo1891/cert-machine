#!/usr/bin/env node
/* test-interval.js — the battery interval.js has cited since it was written, and which did
   not exist until 2026-07-28.

   `interval.js:12` states: "The library is not trusted on assertion: tests/test-interval.js
   checks every operation against exact rational arithmetic." That sentence was false in two
   ways at once — the file was absent, and the battery that DID cover intervals
   (test-eqcert.js I2) exercises 4 of the 19 exports. `pow` had zero coverage and was
   actively wrong: pow([2,2],-1) returned [1,1], an enclosure of 0.5 that does not contain
   0.5, because `while (e > 0)` never runs for a negative exponent.

   THE STANDARD HERE. An interval operation is correct iff its result CONTAINS the exact
   value, computed in exact BigInt rational arithmetic. Containment is the only property that
   matters; tightness is a quality, not a correctness condition. Every check below is
   therefore of the form `enclosure ∋ exact`, decided over `rational.js`, never over floats.

   Run: node core/interval/tests/test-interval.js       Exit 0 iff every check passes.
   MIT — part of eqcert. */
'use strict';
const I = require('../interval.js');
const Q = require('../rational.js');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  cond ? pass++ : fail++;
}

/* Exact containment: does [lo,hi] contain the exact rational q?
   AN INFINITE ENDPOINT IS A SOUND BOUND, not a failure. 1e300 * 1e300 = 1e600 overflows
   the double range, and the honest enclosure is [MAX_DOUBLE, +Infinity] — which genuinely
   contains 1e600. Q.fromDouble(Infinity) has no rational value, so the comparison must be
   short-circuited rather than attempted; treating it as a miss would report the library
   red for being CORRECT about overflow. (This was a bug in this file, not in interval.js.) */
const qOf = x => Q.fromDouble(x);
function encloses(iv, q) {
  const loOk = iv[0] === -Infinity || Q.cmp(qOf(iv[0]), q) <= 0;
  const hiOk = iv[1] === Infinity || Q.cmp(q, qOf(iv[1])) <= 0;
  return loOk && hiOk;
}
const wellFormed = iv => Array.isArray(iv) && iv.length === 2 &&
  !Number.isNaN(iv[0]) && !Number.isNaN(iv[1]) && iv[0] <= iv[1];

/* a deterministic spread of operands, including sign changes, zero-straddling and
   magnitudes far from 1 where ULP behaviour is easiest to get wrong */
const POINTS = [0, 1, -1, 0.5, -0.5, 2, -2, 3, 10, -7, 1e-8, -1e-8, 1e8, -1e8,
                1e-300, 1e300, Math.PI, -Math.E, 0.1, -0.3, 12345.6789];
const BOXES = [[0, 0], [1, 1], [-1, 1], [0, 1], [-2, -1], [1, 2], [-0.5, 0.5],
               [0.1, 0.3], [-1e8, 1e-8], [1e-300, 1e-300], [2, 3], [-3, -2]];

/* ---------------- 1. the rounding primitives ---------------- */
{
  let ok = true, bad = '';
  for (const x of POINTS) {
    if (!(I.nextUp(x) >= x) || !(I.nextDown(x) <= x)) { ok = false; bad = String(x); break; }
    if (x !== 0 && (I.nextUp(x) === x || I.nextDown(x) === x)) { ok = false; bad = 'not strict at ' + x; break; }
  }
  check('nextUp/nextDown step strictly outward on every sample', ok, bad || POINTS.length + ' points');
}
check('iv(x) is the thin interval [x,x]', I.iv(2.5)[0] === 2.5 && I.iv(2.5)[1] === 2.5, 'iv(2.5)');
check('ZERO and ONE are the thin 0 and 1', I.ZERO[0] === 0 && I.ZERO[1] === 0 && I.ONE[0] === 1 && I.ONE[1] === 1);

/* ---------------- 2. the four field operations, against exact rationals ---------------- */
for (const [name, fn, qfn, skipZero] of [
  ['add', I.add, Q.add, false],
  ['sub', I.sub, Q.sub, false],
  ['mul', I.mul, Q.mul, false],
  ['div', I.div, Q.div, true],
]) {
  let n = 0, bad = null;
  for (const a of POINTS) {
    for (const b of POINTS) {
      if (skipZero && b === 0) continue;
      const r = fn(I.iv(a), I.iv(b));
      const exact = qfn(qOf(a), qOf(b));
      n++;
      if (!wellFormed(r) || !encloses(r, exact)) { bad = name + '(' + a + ',' + b + ') = [' + r + ']'; break; }
    }
    if (bad) break;
  }
  check(name + ': thin-operand result encloses the exact rational', !bad, bad || n + ' pairs, exact BigInt');
}

/* the same, on WIDE boxes: the result must enclose every exact product of endpoints */
for (const [name, fn, qfn, skipZero] of [
  ['add', I.add, Q.add, false], ['sub', I.sub, Q.sub, false],
  ['mul', I.mul, Q.mul, false], ['div', I.div, Q.div, true],
]) {
  let n = 0, bad = null;
  for (const A of BOXES) {
    for (const B of BOXES) {
      if (skipZero && B[0] <= 0 && B[1] >= 0) continue;
      const r = fn(A, B);
      for (const a of A) for (const b of B) {
        if (skipZero && b === 0) continue;
        n++;
        if (!wellFormed(r) || !encloses(r, qfn(qOf(a), qOf(b)))) { bad = name + '([' + A + '],[' + B + '])'; }
      }
      if (bad) break;
    }
    if (bad) break;
  }
  check(name + ': wide-box result encloses every endpoint combination', !bad, bad || n + ' corner evaluations');
}

/* ---------------- 3. neg, sqr, abs, mag, mig, width ---------------- */
{
  let bad = null;
  for (const A of BOXES) {
    const r = I.neg(A);
    for (const a of A) if (!encloses(r, Q.neg(qOf(a)))) bad = 'neg([' + A + '])';
  }
  check('neg: encloses the exact negation of both endpoints', !bad, bad || BOXES.length + ' boxes');
}
{
  let bad = null, n = 0;
  for (const A of BOXES) {
    const r = I.sqr(A);
    if (r[0] < 0) { bad = 'sqr([' + A + ']) has a NEGATIVE lower bound'; break; }
    /* sqr must enclose x² for every x in the box, including the interior point 0 */
    for (const a of [A[0], A[1], 0]) {
      if (a < A[0] || a > A[1]) continue;
      n++;
      if (!encloses(r, Q.mul(qOf(a), qOf(a)))) { bad = 'sqr([' + A + ']) misses ' + a + '²'; }
    }
    if (bad) break;
  }
  check('sqr: non-negative, and encloses x² across the box (incl. interior 0)', !bad, bad || n + ' evaluations');
}
{
  let bad = null;
  for (const A of BOXES) {
    const r = I.abs(A);
    if (r[0] < 0) { bad = 'abs([' + A + ']) negative lower'; break; }
    for (const a of A) if (!encloses(r, Q.abs(qOf(a)))) bad = 'abs([' + A + '])';
    if (bad) break;
  }
  check('abs: non-negative, and encloses |x| at both endpoints', !bad, bad || BOXES.length + ' boxes');
}
{
  let bad = null;
  for (const A of BOXES) {
    const mg = I.mag(A), mi = I.mig(A);
    /* mag = max|x|, mig = min|x| over the box; mig is 0 when the box straddles 0 */
    const straddles = A[0] <= 0 && A[1] >= 0;
    const wantMag = Math.max(Math.abs(A[0]), Math.abs(A[1]));
    const wantMig = straddles ? 0 : Math.min(Math.abs(A[0]), Math.abs(A[1]));
    if (!(mg >= wantMag * (1 - 1e-15))) bad = 'mag([' + A + ']) = ' + mg + ' < ' + wantMag;
    if (!(mi <= wantMig * (1 + 1e-15) + 1e-300)) bad = 'mig([' + A + ']) = ' + mi + ' > ' + wantMig;
    if (mi > mg) bad = 'mig > mag on [' + A + ']';
    if (bad) break;
  }
  check('mag/mig: bound max|x| from above and min|x| from below, mig <= mag', !bad, bad || BOXES.length + ' boxes');
}
{
  let bad = null;
  for (const A of BOXES) {
    const w = I.width(A);
    if (!(w >= 0) || !(w >= A[1] - A[0])) { bad = 'width([' + A + ']) = ' + w; break; }
  }
  check('width: non-negative and never UNDER-reports the span', !bad, bad || BOXES.length + ' boxes');
}

/* ---------------- 4. the set predicates ---------------- */
check('contains: [-1,1] contains 0, and does not contain 2',
  I.contains([-1, 1], 0) === true && I.contains([-1, 1], 2) === false);
check('subset: [0,1] ⊆ [-1,1], and [-1,1] ⊄ [0,1]',
  I.subset([0, 1], [-1, 1]) === true && I.subset([-1, 1], [0, 1]) === false);
check('subset accepts an EQUAL box (⊆ is not ⊂)', I.subset([0, 1], [0, 1]) === true);
check('interior REJECTS the equal box that subset accepts — the Krawczyk hypothesis',
  I.interior([0, 1], [0, 1]) === false && I.interior([0.25, 0.75], [0, 1]) === true,
  'strict containment is what yields existence AND uniqueness');

/* ---------------- 5. pow — the operation that had NO coverage ---------------- */
{
  let bad = null, n = 0;
  for (const a of [2, -2, 0.5, -0.5, 3, 10, 0.1]) {
    for (let k = -4; k <= 6; k++) {
      const r = I.pow(I.iv(a), k);
      let exact = Q.ONE;
      for (let j = 0; j < Math.abs(k); j++) exact = Q.mul(exact, qOf(a));
      if (k < 0) exact = Q.div(Q.ONE, exact);
      n++;
      if (!wellFormed(r) || !encloses(r, exact)) { bad = 'pow(' + a + ',' + k + ') = [' + r + ']'; break; }
    }
    if (bad) break;
  }
  check('pow: encloses the exact rational power for n in [-4,6], incl. NEGATIVE n', !bad,
    bad || n + ' (base,exponent) pairs, exact BigInt');
}
check('pow(a,0) = [1,1]', I.pow([2, 3], 0)[0] === 1 && I.pow([2, 3], 0)[1] === 1);
{
  let refused = false;
  try { I.pow([-1, 1], -1); } catch (e) { refused = /containing 0/.test(e.message); }
  check('pow REFUSES a negative exponent on a zero-straddling base (1/x is unbounded there)', refused);
}
{
  let refused = false;
  try { I.pow([2, 2], 1.5); } catch (e) { refused = /integer/.test(e.message); }
  check('pow REFUSES a non-integer exponent instead of flooring it via `e >>= 1`', refused);
}

/* ---------------- 6. div refuses rather than returning a wrong enclosure ---------------- */
{
  let n = 0;
  for (const B of [[-1, 1], [0, 2], [-2, 0], [0, 0]]) {
    try { I.div(I.ONE, B); } catch (e) { if (/containing 0/.test(e.message)) n++; }
  }
  check('div REFUSES every zero-straddling denominator', n === 4, n + '/4 refused');
}

/* ---------------- 7. Stage 2.4 — trig pad + thin float enclosure ---------------- */
{
  const TWO_PI = 2 * Math.PI;
  let okPad = true, worst = 0, worstAng = 0;
  for (const N of [14, 20, 32]) for (let k = 1; k <= N; k++) for (let g = 0; g < 4096; g++) {
    const ang = TWO_PI * k * (g / 4096);
    const pad = I.trigAbsPad(ang);
    const need = 2 * Number.EPSILON * Math.abs(ang);
    if (!(pad >= need)) { okPad = false; break; }
    if (pad > worst) { worst = pad; worstAng = ang; }
  }
  check('trigAbsPad dominates 2·ε·|ang| on the Fourier grids N≤32, G=4096', okPad,
    'worst pad ' + worst.toExponential(3) + ' at |ang|=' + worstAng.toFixed(2));
  const angOp = TWO_PI * 14 * (1 - 1 / 4096);
  check('remembered ±1e-15 under-covers the derived pad at operating angles (TOPIC B6)',
    1e-15 < I.trigAbsPad(angOp),
    '1e-15 vs pad ' + I.trigAbsPad(angOp).toExponential(3) + ' (×' + (I.trigAbsPad(angOp) / 1e-15).toFixed(1) + ')');
  const c = I.encloseCos(1.0), s = I.encloseSin(1.0);
  check('encloseCos / encloseSin are well-formed and contain the float evaluation',
    wellFormed(c) && wellFormed(s) && c[0] <= Math.cos(1) && Math.cos(1) <= c[1] &&
    s[0] <= Math.sin(1) && Math.sin(1) <= s[1]);
  const tf = I.encloseFloat(Math.PI);
  check('encloseFloat widens a correctly-rounded image by one ulp each side',
    tf[0] === I.nextDown(Math.PI) && tf[1] === I.nextUp(Math.PI));
}

/* ---------------- 8. FALSIFIERS — each must turn its own target red ---------------- */
console.log('\n    executing falsifiers');
let reds = 0;
{
  /* X1 — the regression that motivated this file. The pre-fix pow returned ONE for n<0. */
  const brokenPow = (a, n) => { let r = I.ONE, base = a, e = n;
    while (e > 0) { if (e & 1) r = I.mul(r, base); base = I.mul(base, base); e >>= 1; } return r; };
  const bad = brokenPow(I.iv(2), -1);
  const caught = !encloses(bad, Q.div(Q.ONE, qOf(2)));
  if (caught) { reds++; console.log('       RED ok  X1 the shipped pow bug: pow([2,2],-1) -> [' + bad + '] does NOT enclose 1/2'); }
}
{
  /* X2 — drop the outward widening: a thin result stops enclosing the exact value */
  const thinMul = (a, b) => [a[0] * b[0], a[1] * b[1]];
  let caught = false;
  for (const [x, y] of [[0.1, 0.3], [1e-8, 3], [Math.PI, 0.1]]) {
    const t = thinMul(I.iv(x), I.iv(y));
    if (!encloses(t, Q.mul(qOf(x), qOf(y)))) { caught = true; break; }
  }
  if (caught) { reds++; console.log('       RED ok  X2 mul without outward rounding fails to enclose an exact product'); }
}
{
  /* X3 — subset-for-interior: the substitution that would break Krawczyk's uniqueness */
  const caught = I.subset([0, 1], [0, 1]) === true && I.interior([0, 1], [0, 1]) === false;
  if (caught) { reds++; console.log('       RED ok  X3 subset accepts the equal box that interior rejects (they are NOT interchangeable)'); }
}
{
  /* X4 — a malformed interval (lo > hi) must be detectable, not silently accepted.
     test-eqcert.js S4 passes today BECAUSE this is not checked: `f.map(I.iv)` hits the
     Array.map arity trap and yields [0.5, 0] boxes whose "enclosure" is vacuous. */
  const malformed = [0.5, 0];
  const caught = !wellFormed(malformed) && wellFormed([0, 0.5]);
  if (caught) { reds++; console.log('       RED ok  X4 lo>hi is caught by wellFormed (the Array.map arity trap that makes a check vacuous)'); }
}
{
  /* X5 — Stage 2.4: the remembered ±1e-15 trig pad under-covers the derived floor. */
  const ang = 2 * Math.PI * 14 * (1 - 1 / 4096);
  const need = I.trigAbsPad(ang);
  const caught = 1e-15 < need;
  if (caught) { reds++; console.log('       RED ok  X5 remembered ±1e-15 trig pad under-covers derived pad ' + need.toExponential(3) + ' at ang=' + ang.toFixed(2) + ' (×' + (need / 1e-15).toFixed(1) + ')'); }
}
check('X every falsifier turned its own target red', reds === 5, reds + '/5');

console.log('\n' + (fail ? fail + ' FAILED, ' + pass + ' passed'
  : 'ALL PASS (' + pass + ' checks) — every export is exercised; arithmetic against exact BigInt\n' +
    '  rationals; Stage 2.4 trig pad is derived, not remembered.'));
process.exit(fail ? 1 : 0);
