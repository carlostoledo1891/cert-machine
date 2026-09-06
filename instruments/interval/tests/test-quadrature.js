#!/usr/bin/env node
/* test-quadrature.js — the midpoint rule with its remainder, checked against
   values known exactly or to more digits than the rule can reach, and then
   FALSIFIED: the remainder dropped on a coarse grid must miss the truth.

   usage: node instruments/interval/tests/test-quadrature.js   (exit 0 and "ALL PASS") */
'use strict';
const path = require('path');
const I = require(path.join(__dirname, '..', 'interval.js'));
const TR = require(path.join(__dirname, '..', 'transcendental.js'));
const Q = require(path.join(__dirname, '..', 'quadrature.js'));
const { iv, mul, sqr, add, sub, neg, contains, width } = I;

let checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}

/* Q1 · ∫_0^1 x² dx = 1/3, f'' = 2 */
{
  const r = Q.midpoint01({ K: 64, fAt: c => sqr(iv(c)), f2On: () => iv(2) });
  check('Q1  ∫ x² = 1/3 contained', contains(r, 1 / 3), '[' + r[0] + ', ' + r[1] + ']');
}

/* Q2 · ∫_0^1 sin²(2πx) dx = 1/2 exactly, f'' = 2(2π)² cos(4πx) */
{
  const TP2 = sqr(TR.TWO_PI);
  const r = Q.midpoint01({
    K: 256,
    fAt: c => sqr(TR.sin(mul(TR.TWO_PI, iv(c)))),
    f2On: X => mul(mul(iv(2), TP2), TR.cos(mul(mul(iv(2), TR.TWO_PI), X)))
  });
  check('Q2  ∫ sin²(2πx) = 1/2 contained', contains(r, 0.5), 'width ' + width(r).toExponential(2));
}

/* Q3 · ∫_0^1 e^{sin 2πx} dx = I₀(1) = 1.2660658777520083… (Abramowitz–Stegun 9.8; NIST DLMF 10.25)
        f'' = e^V (V'² + V''), V' = 2π cos θ, V'' = −(2π)² sin θ */
{
  const I0 = 1.2660658777520083;
  const TP2 = sqr(TR.TWO_PI);
  const r = Q.midpoint01({
    K: 4096,
    fAt: c => TR.exp(TR.sin(mul(TR.TWO_PI, iv(c)))),
    f2On: X => {
      const th = mul(TR.TWO_PI, X), s = TR.sin(th), co = TR.cos(th);
      const V1 = mul(TR.TWO_PI, co), V2 = neg(mul(TP2, s));
      return mul(TR.exp(s), add(sqr(V1), V2));
    }
  });
  check('Q3  ∫ e^{sin 2πx} = I₀(1) contained', contains(r, I0), 'width ' + width(r).toExponential(2));
  check('Q3b the enclosure is tight (width < 1e-6 at K = 4096)', width(r) < 1e-6, width(r).toExponential(2));
}

/* Q4 · the cumulative rule agrees with the total and starts at zero */
{
  const U = Q.cumulative01({ K: 64, fAt: c => sqr(iv(c)), f2On: () => iv(2) });
  check('Q4  cumulative: U_0 = 0 and U_K ∋ 1/3', U[0][0] === 0 && U[0][1] === 0 && contains(U[64], 1 / 3));
  check('Q4b cumulative: U_{K/2} ∋ 1/24', contains(U[32], 1 / 24));
}

/* X · falsifiers */
{
  const r = Q.midpoint01({ K: 8, fAt: c => sqr(iv(c)), f2On: () => iv(2), remainder: false });
  check('X1  RED ok: the remainder dropped at K = 8 MISSES 1/3', !contains(r, 1 / 3), '[' + r[0] + ', ' + r[1] + ']');
  let threw = false;
  try { Q.midpoint01({ K: 12, fAt: c => iv(c), f2On: () => iv(0) }); } catch (e) { threw = true; }
  check('X2  RED ok: K = 12 (not a power of two) is refused', threw);
  const fake = Q.midpoint01({ K: 64, fAt: c => sqr(iv(c)), f2On: () => iv(0) });   /* a lying f'' */
  check('X3  RED ok: a zero second-derivative bound (a lie) makes the rule miss 1/3', !contains(fake, 1 / 3));
}

console.log(fails === 0 ? 'ALL PASS   (' + checks + ' checks)' : fails + ' FAILED of ' + checks);
process.exit(fails === 0 ? 0 : 1);
