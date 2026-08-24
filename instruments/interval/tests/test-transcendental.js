#!/usr/bin/env node
/* test-transcendental.js — battery for src/transcendental.js
   (exp, log, sin, cos, tanh).

   Containment against independent exact-rational brackets / Math.*.
   Red controls: truncated series without a tail bound must miss; bad domains
   must throw.

   Run: node core/interval/tests/test-transcendental.js
*/
'use strict';
const path = require('path');
const I = require(path.join(__dirname, '..', 'interval.js'));
const Q = require(path.join(__dirname, '..', 'rational.js'));
const T = require(path.join(__dirname, '..', 'transcendental.js'));
const { iv } = I;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  cond ? pass++ : fail++;
}

function expExactBracket(x, terms) {
  const X = Q.fromDouble(x);
  let sum = Q.R(1n), term = Q.R(1n);
  for (let n = 1; n <= terms; n++) {
    term = Q.div(Q.mul(term, X), Q.R(BigInt(n)));
    sum = Q.add(sum, term);
  }
  const ax = Math.abs(x);
  let fact = 1, p = 1;
  for (let n = 1; n <= terms + 1; n++) { fact *= n; p *= ax; }
  const rem = Q.fromDouble((p / fact) / (1 - ax / (terms + 2)));
  return [Q.sub(sum, rem), Q.add(sum, rem)];
}

/* log(1+u) exact rational partial sum + remainder for u ∈ [0,1) */
function log1pExactBracket(u, terms) {
  const U = Q.fromDouble(u);
  let sum = Q.ZERO, pow = Q.ONE;
  for (let n = 1; n <= terms; n++) {
    pow = Q.mul(pow, U);
    const term = Q.div(pow, Q.R(BigInt(n)));
    sum = (n % 2 === 1) ? Q.add(sum, term) : Q.sub(sum, term);
  }
  let p = 1;
  for (let n = 0; n < terms + 1; n++) p *= u;
  const rem = Q.fromDouble(p / (terms + 1));
  return [Q.sub(sum, rem), Q.add(sum, rem)];
}

console.log('== eqcert transcendental (exp, log, sin, cos, tanh) ==\n');

console.log('LN2 enclosure');
{
  const L = T.LN2;
  check('LN2 well-formed', L[0] < L[1] && Number.isFinite(L[0]) && Number.isFinite(L[1]),
    '[' + L[0] + ',' + L[1] + ']');
  check('LN2 contains Math.log(2)', L[0] <= Math.log(2) && Math.log(2) <= L[1],
    'Math.log(2)=' + Math.log(2));
}

console.log('\nT1 exp encloses exact-rational bracket');
let worstRel = 0;
for (const x of [0, 0.5, -0.5, 1, -1, 2.5, -3.25, 7, -7, 12.75]) {
  const E = T.exp(iv(x));
  const [lo, hi] = expExactBracket(x, 60);
  const ok = Q.cmp(Q.fromDouble(E[0]), lo) <= 0 && Q.cmp(Q.fromDouble(E[1]), hi) >= 0;
  const rel = (E[1] - E[0]) / Math.max(1e-300, Math.abs((E[0] + E[1]) / 2));
  if (rel > worstRel) worstRel = rel;
  check('exp(' + x + ')', ok, 'rel width ' + rel.toExponential(2));
}

console.log('\nT2 red: exp without tail misses');
{
  const bad = (X) => {
    let s = I.ONE, t = I.ONE;
    for (let n = 1; n <= 3; n++) { t = I.div(I.mul(t, X), iv(n)); s = I.add(s, t); }
    return s;
  };
  const B = bad(iv(1)), [lo, hi] = expExactBracket(1, 60);
  const missed = Q.cmp(Q.fromDouble(B[1]), lo) < 0 || Q.cmp(Q.fromDouble(B[0]), hi) > 0;
  check('3-term exp misses true bracket', missed);
}

console.log('\nT3 wide exp via monotonicity');
for (const [a, b] of [[-0.1, 0.1], [0.9, 1.1], [-2, 2], [-8, 8]]) {
  const E = T.exp(iv(a, b));
  check('exp([' + a + ',' + b + '])', E[0] <= Math.exp(a) && E[1] >= Math.exp(b),
    '[' + E[0].toPrecision(8) + ',' + E[1].toPrecision(8) + ']');
}

console.log('\nT4 domain refusals');
{
  let wideOk = true;
  try { T.exp(iv(-3, 3)); } catch (e) { wideOk = false; }
  check('wide exp([-3,3]) via monotone endpoints', wideOk);
  let logThrew = false;
  try { T.log(iv(-1, 1)); } catch (e) { logThrew = true; }
  check('log on non-positive throws', logThrew);
  let log0 = false;
  try { T.log(iv(0, 1)); } catch (e) { log0 = true; }
  check('log including 0 throws', log0);
}

console.log('\nT5 log contains Math.log on (1,2)');
for (const u of [0, 0.1, 0.25, 0.5, 0.75, 0.9]) {
  if (u === 0) {
    const L = T.log(iv(1));
    check('log(1)=0', L[0] <= 0 && 0 <= L[1], String(L));
    continue;
  }
  const x = 1 + u;
  const L = T.log(iv(x));
  const containsMath = L[0] <= Math.log(x) && Math.log(x) <= L[1];
  check('log(' + x + ')', containsMath, 'width=' + (L[1] - L[0]).toExponential(2));
}

console.log('\nT5b independent artanh rational bracket ⊂ enclosure');
for (const x of [1.1, 1.5, 1.75, 1.9]) {
  /* log(x) = 2 Σ v^{2k+1}/(2k+1), v=(x-1)/(x+1) — exact partial sum ± rem */
  const v = (x - 1) / (x + 1);
  const V = Q.fromDouble(v);
  let sum = Q.ZERO, oddPow = V;
  const V2 = Q.mul(V, V);
  const terms = 60;
  for (let k = 0; k < terms; k++) {
    sum = Q.add(sum, Q.div(oddPow, Q.R(BigInt(2 * k + 1))));
    oddPow = Q.mul(oddPow, V2);
  }
  let p = 1;
  for (let n = 0; n < 2 * terms + 1; n++) p *= Math.abs(v);
  const rem = Q.fromDouble(p / ((2 * terms + 1) * (1 - v * v)));
  const lo = Q.mul(Q.R(2), Q.sub(sum, rem));
  const hi = Q.mul(Q.R(2), Q.add(sum, rem));
  const L = T.log(iv(x));
  const ok = Q.cmp(Q.fromDouble(L[0]), lo) <= 0 && Q.cmp(Q.fromDouble(L[1]), hi) >= 0;
  check('log(' + x + ') encloses artanh bracket', ok);
}

console.log('\nT6 log on scattered positives contains Math.log');
for (const x of [0.5, 2, Math.E, 10, 1e-6, 1e6, 0.125, 1024]) {
  const L = T.log(iv(x));
  check('log(' + x + ')', L[0] <= Math.log(x) && Math.log(x) <= L[1],
    '[' + L[0] + ',' + L[1] + ']');
}

console.log('\nT7 exp/log roundtrip enclosure contains x');
for (const x of [0.25, 1, 2, 5, 0.1]) {
  const E = T.exp(T.log(iv(x)));
  check('exp(log(' + x + ')) ∋ x', E[0] <= x && x <= E[1], String(E));
}

console.log('\nT8 wide log monotone');
{
  const L = T.log(iv(0.5, 2));
  check('log([0.5,2])', L[0] <= Math.log(0.5) && Math.log(2) <= L[1]);
}

console.log('\nT9 PI enclosure contains Math.PI');
{
  const P = T.PI;
  check('PI well-formed', P[0] < P[1] && Number.isFinite(P[0]),
    '[' + P[0] + ',' + P[1] + ']');
  check('PI contains Math.PI', P[0] <= Math.PI && Math.PI <= P[1],
    'Math.PI=' + Math.PI);
}

console.log('\nT10 sin contains Math.sin');
for (const x of [0, 0.1, -0.1, 0.5, 1, -1, Math.PI / 2, Math.PI, 2, -2, 3.5, -4, 10, -20]) {
  const S = T.sin(iv(x));
  const m = Math.sin(x);
  check('sin(' + x + ')', S[0] <= m && m <= S[1],
    '[' + S[0] + ',' + S[1] + '] ∋ ' + m);
}

console.log('\nT11 cos contains Math.cos');
for (const x of [0, 0.1, -0.1, 0.5, 1, -1, Math.PI / 2, Math.PI, 2, -2, 3.5, 10, -20]) {
  const C = T.cos(iv(x));
  const m = Math.cos(x);
  check('cos(' + x + ')', C[0] <= m && m <= C[1],
    '[' + C[0] + ',' + C[1] + '] ∋ ' + m);
}

console.log('\nT12 red: sin series without tail misses');
{
  const bad = (X) => {
    let sum = I.ZERO, term = X;
    for (let n = 0; n < 3; n++) {
      sum = I.add(sum, term);
      const k = 2 * n + 2;
      term = I.neg(I.div(I.mul(term, I.mul(X, X)), iv(k * (k + 1))));
    }
    return sum;
  };
  const x = 1.2;
  const B = bad(iv(x));
  const missed = B[1] < Math.sin(x) || B[0] > Math.sin(x);
  check('3-term sin misses Math.sin(1.2)', missed);
}

console.log('\nT13 tanh contains Math.tanh');
for (const x of [0, 0.1, -0.1, 0.5, 1, -1, 2, -2, 5, -5, 20, -20, 40]) {
  const H = T.tanh(iv(x));
  const m = Math.tanh(x);
  check('tanh(' + x + ')', H[0] <= m && m <= H[1],
    '[' + H[0] + ',' + H[1] + '] ∋ ' + m);
}

console.log('\nT14 tanh odd + monotone wide');
{
  const a = T.tanh(iv(1.3)), b = T.tanh(iv(-1.3));
  check('tanh odd', Math.abs(a[0] + b[1]) < 1e-12 && Math.abs(a[1] + b[0]) < 1e-12);
  const W = T.tanh(iv(-0.5, 0.5));
  check('tanh([-0.5,0.5])', W[0] <= Math.tanh(-0.5) && Math.tanh(0.5) <= W[1]);
}

console.log('\nT15 sin²+cos² encloses 1');
for (const x of [0.3, 1.1, -2.2, 7]) {
  const S = T.sin(iv(x)), C = T.cos(iv(x));
  const sum = I.add(I.mul(S, S), I.mul(C, C));
  check('sin²+cos²(' + x + ') ∋ 1', sum[0] <= 1 && 1 <= sum[1],
    '[' + sum[0] + ',' + sum[1] + ']');
}

console.log('\nworst T1 relative width: ' + worstRel.toExponential(2));
console.log('== transcendental: ' + pass + ' passed, ' + fail + ' failed ==');
process.exit(fail ? 1 : 0);
