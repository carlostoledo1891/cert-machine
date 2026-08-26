#!/usr/bin/env node
/* erdos290-lean-battery.js — the gate on the lean candidateDeltas fork.

   1  closed form == ENUMERATED, exactly, for every l <= 12, all five
      candidates (the enumeration below is written independently here,
      from the same class-equation semantics the lifted instrument uses)
   2  the instrument's own cross-validation value pinned: δ(ES0)(4) = 150/384
   3  RED: a broken signed EGF (the l·(u−1)^{l−1} term dropped) must DISAGREE
   4  the fork's analyze(8) reproduces the LIFTED analyze(8) verdict-for-
      verdict and rational-for-rational
   5  RED: the fork must refuse under mutateDisc (the lifted red pathway
      still fires through the splice)                                     */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const LEG = path.join(ROOT, 'legacy', 'research', 'challenges', 'erdos290');
const Q = require(path.join(LEG, 'rational.js'));
const { R, add, sub, mul, div, cmp } = Q;
const ZERO = R(0n, 1n), ONE = R(1n, 1n);

let pass = 0, fail = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); ok ? pass++ : fail++; };

/* ---- independent enumerated reference (small l only) --------------------- */
function enumDeltas(l) {
  const parts = [];
  (function rec(rem, maxPart, cur) {
    if (rem === 0) { parts.push(cur.slice()); return; }
    for (let k = Math.min(rem, maxPart); k >= 1; k--) { cur.push(k); rec(rem - k, k, cur); cur.pop(); }
  })(l, l, []);
  let lfact = 1n; for (let i = 2; i <= l; i++) lfact *= BigInt(i);
  const classes = parts.map((p) => {
    const mult = {}; for (const m of p) mult[m] = (mult[m] || 0) + 1;
    let denom = 1n;
    for (const [m, a] of Object.entries(mult)) {
      let f = 1n; for (let i = 2; i <= a; i++) f *= BigInt(i);
      denom *= (BigInt(m) ** BigInt(a)) * f;
    }
    return { size: lfact / denom, fix: mult[1] || 0, even: (l - p.length) % 2 === 0 };
  });
  const mk = (restrictEven, idBoost) => {
    let noFix = ZERO, total = ZERO;
    for (const c of classes) {
      if (restrictEven && !c.even) continue;
      const w = R(c.size, 1n);
      total = add(total, w);
      const isId = c.fix === l;
      const pn = isId && idBoost
        ? (l % 2 === 0 ? R(1n, 2n ** BigInt(l - 1)) : ZERO)
        : R(1n, 2n ** BigInt(c.fix));
      noFix = add(noFix, mul(w, pn));
    }
    return sub(ONE, div(noFix, total));
  };
  return { B: mk(false, false), FA: mk(true, false), ES0: mk(false, true), ESs: mk(false, true), EA0: mk(true, true) };
}

/* ---- the closed form under test (via the fork's compiled module) ---------
   candidateDeltas is internal to analyze, so the battery re-derives the
   closed form HERE with the same formulas the splice injects, and then
   separately proves the fork's analyze agrees with the lifted analyze —
   the two together pin the injected code from both sides. */
function leanDeltas(l, broken) {
  let L = 1n; for (let i = 2; i <= l; i++) L *= BigInt(i);
  const pow2l = 2n ** BigInt(l);
  let Anum = 0n, fall = L, sign = 1n;
  for (let j = 0; j <= l; j++) {
    Anum += sign * fall * (2n ** BigInt(l - j));
    sign = -sign;
    if (j < l) fall = fall / BigInt(j + 1);
  }
  const A = R(Anum, pow2l);
  /* RED variant: drop the l(u−1)^{l−1} term of the signed EGF */
  const As = broken
    ? R((l % 2 === 0 ? 1n : -1n), pow2l)
    : R((l % 2 === 0 ? 1n : -1n) * (1n - 2n * BigInt(l)), pow2l);
  const idA = R(1n, pow2l);
  const boost = l % 2 === 0 ? R(1n, pow2l / 2n) : ZERO;
  const totalAll = R(L, 1n), totalEven = l <= 1 ? R(L, 1n) : R(L, 2n);
  const evenA = div(add(A, As), R(2n, 1n));
  const dOf = (noFix, total) => sub(ONE, div(noFix, total));
  return {
    B: dOf(A, totalAll),
    FA: dOf(evenA, totalEven),
    ES0: dOf(add(sub(A, idA), boost), totalAll),
    ESs: dOf(add(sub(A, idA), boost), totalAll),
    EA0: dOf(add(sub(evenA, idA), boost), totalEven)
  };
}

const NAMES = ['B', 'FA', 'ES0', 'ESs', 'EA0'];
{
  let allEq = true;
  for (let l = 1; l <= 12; l++) {
    const e = enumDeltas(l), c = leanDeltas(l, false);
    for (const n of NAMES) if (cmp(e[n], c[n]) !== 0) { allEq = false; console.log('     mismatch at l=' + l + ' ' + n + ': ' + Q.toString(e[n]) + ' vs ' + Q.toString(c[n])); }
  }
  check(allEq, 'closed form == enumerated, all five candidates, l = 1..12 (exact rationals)');
}
{
  const c = leanDeltas(4, false);
  check(cmp(c.ES0, R(150n, 384n)) === 0, 'pin: δ(ES0)(4) = 150/384 — the instrument\'s own cross-validation value');
}
{
  const e = enumDeltas(4), b = leanDeltas(4, true);
  check(cmp(e.FA, b.FA) !== 0, 'RED: the broken signed EGF disagrees with the enumeration at l = 4 — the control can fire');
}
{
  /* silence the instruments' own console chatter for the two analyze runs */
  const realLog = console.log; console.log = () => {};
  const lean = require(path.join(ROOT, 'tools', 'galois-exceptions-lean.js'));
  const legacy = require(path.join(LEG, 'galois-exceptions.js'));
  const a = lean.analyze(8, { nPrimes: 600 });
  const b = legacy.analyze(8, { nPrimes: 600 });
  const red = lean.analyze(8, { nPrimes: 600, mutateDisc: true });
  console.log = realLog;
  const sameAlive = a.alive.length === b.alive.length && a.alive.every((x, i) =>
    x.name === b.alive[i].name && cmp(x.delta, b.alive[i].delta) === 0);
  const sameDeltas = NAMES.every((n) => cmp(a.deltas[n], b.deltas[n]) === 0);
  check(a.certsOk && b.certsOk && sameAlive && sameDeltas && a.fSquare === b.fSquare && a.hSquare === b.hSquare,
    'fork analyze(8) == lifted analyze(8): certificates green, same survivor, all five deltas rational-identical');
  check(!red.certsOk, 'RED: mutateDisc still refuses through the splice — the lifted red pathway is intact');
  check(lean.__lean === true && typeof lean.__pinnedSha === 'string', 'the fork self-identifies and carries its pin');
}

console.log(pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
