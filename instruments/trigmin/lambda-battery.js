#!/usr/bin/env node
/* lambda-battery.js — the lambda instrument's gate.

   Calibration on PROVED mathematics: lambda({1,2}) = 9/8 and
   lambda({1,2,3}) = (17+7*sqrt 7)/27 are Mercer's proved closed forms —
   the first checked as an exact rational containment, the second against
   a bigfloat bracket of the algebraic number (never a remembered decimal:
   the source lab's battery once caught a FABRICATED decimal in exactly
   this row, and that lesson is why both targets are computed here).
   Cross-lab: the n=4 box-20 record reproduces the source lab's EXACT
   numbers — 4,845 sets, 2,818 killed at roots of unity, five survivors
   that are precisely the dilation orbit k=1..5 of {1,2,3,4}.
   Reds: the wrong-endpoint bar is refused BY NAME and its disaster is
   DEMONSTRATED (a positive bar kills the champion itself); a dropped
   verdict fails conservation; stage W is pinned exactly on {1,3,5,7,9}
   (whose minimum IS -5, at a root of unity, so the kill is earned);
   0-containing dyadic denominators cannot arise (dilation reduction). */
'use strict';

const L = require('#instruments/trigmin/lambda.js');
const B = require('#instruments/bigfloat/bigfloat.js');
const F = require('#instruments/bigfloat/functions.js');
const Q = require('#instruments/interval/rational.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* ---- proved closed forms, targets COMPUTED ---- */
{
  const c2 = L.certifyLambda([1, 2]);
  const inQ = (enc, num, den) => {                     /* exact rational containment */
    const lo = Q.fromDouble(enc[0]), hi = Q.fromDouble(enc[1]);
    return lo.n * den <= num * lo.d && num * hi.d <= hi.n * den;
  };
  ok(inQ(c2.lambda, 9n, 8n), 'CALIBRATION: lambda({1,2}) contains 9/8 EXACTLY (Mercer, proved)');
  const c3 = L.certifyLambda([1, 2, 3]);
  /* (17 + 7 sqrt 7)/27 via a certified bigfloat bracket — not a typed decimal */
  const s7 = F.sqrt(B.fromInt(7), 192);
  const target = B.div(B.add(B.fromInt(17), B.mul(B.fromInt(7), s7, 192), 192), B.fromInt(27), 192);
  const encLo = Q.fromDouble(c3.lambda[0]), encHi = Q.fromDouble(c3.lambda[1]);
  const inside = B.cmpRat(target.lo, encLo.n, encLo.d) >= 0 && B.cmpRat(target.hi, encHi.n, encHi.d) <= 0;
  ok(inside, 'CALIBRATION: lambda({1,2,3}) contains (17+7*sqrt 7)/27 — the closed form COMPUTED via certified sqrt, never remembered');
  /* dilation invariance: {2,4,6} reduces to {1,2,3} and certifies byte-identically */
  const c3d = L.certifyLambda([2, 4, 6]);
  ok(c3d.lambda[0] === c3.lambda[0] && c3d.lambda[1] === c3.lambda[1] && c3d.gcd === 2,
    'dilation invariance: {2,4,6} certifies BYTE-IDENTICAL to {1,2,3} through gcd reduction');
}

/* ---- cross-lab: the n=4 box-20 record, every number pinned ---- */
{
  const r = L.sweepLambdaBox({ n: 4, M: 20, seed: [1, 2, 3, 4] });
  ok(r.totalSets === 4845, 'n=4 box20: C(20,4) = 4,845 sets enumerated');
  ok(r.killedAtRootsOfUnity === 2818,
    'stage W kills exactly 2,818 by integer arithmetic — the source lab\'s measured count, reproduced independently');
  ok(r.survivors.length === 5 && r.maximumOrbit.uniqueUpToDilation === true
    && JSON.stringify(r.survivors.map(s => s.A)) === JSON.stringify([[1,2,3,4],[2,4,6,8],[3,6,9,12],[4,8,12,16],[5,10,15,20]]),
    'the five survivors are EXACTLY the dilation orbit k=1..5 of {1,2,3,4} — no reversal pairs on this side, as the theory says');
  ok(JSON.stringify(r.optimiser.A) === '[1,2,3,4]'
    && r.optimiser.lambda[0] <= 1.5195578816428481 && 1.5195578816428483 <= r.optimiser.lambda[1] + 3e-16,
    'the optimiser is Mercer\'s conjectured lambda(4) set at his certified value 1.519557881642848...');
  ok(/UPPER bound/.test(r.caveat) && /NO lower bound/.test(r.caveat),
    'the record itself carries the infimum caveat — a box orders nothing across n');
}

/* ---- REDS: the direction traps, demonstrated ---- */
{
  /* the wrong-endpoint bar is refused BY NAME */
  let threw = null;
  try { L.lambdaBarFromFloor(+1.5195578816428481); } catch (e) { threw = e.message; }
  ok(threw !== null && /LAMBDA-BAR-NOT-NEGATIVE/.test(threw),
    'RED: a POSITIVE bar (the wrong-endpoint bug: +1.5196 taken from lamLo instead of the min floor) is REFUSED by name');
  /* and the disaster it prevents is DEMONSTRATED: under a positive bar the
     champion itself dies at stage W — silent wrong answer, green output */
  const w2 = L.stageWMin2([1, 2, 3, 4]);
  ok(w2 < 2 * 1.5195578816428481 && w2 < 0,
    'RED (disaster shown): under that bar the champion {1,2,3,4} is killed by its own W value ' + (w2 / 2) + ' — the guard is not decoration');
  /* stage W pinned on a set whose minimum IS at a root of unity */
  ok(L.stageWMin2([1, 3, 5, 7, 9]) === -10,
    'stage W on {1,3,5,7,9}: 2f(pi) = -10 exactly — the certified minimum IS -5, so the kill is earned, not lucky');
  const c = L.certifyLambda([1, 3, 5, 7, 9]);
  ok(c.minEnclosure[0] <= -5 && -5 <= c.minEnclosure[1],
    'and the full certificate agrees: min enclosure contains -5');
  /* conservation */
  let threw2 = false;
  try { L.sweepLambdaBox({ n: 4, M: 12, seed: [1, 2, 3, 4], _dropVerdictAt: 100 }); }
  catch (e) { threw2 = /conservation|enumerated/.test(e.message); }
  ok(threw2, 'RED: a dropped verdict fails the conservation identity — no silent hole in an exhaustion');
  /* zero is not a member here */
  let threw3 = false;
  try { L.certifyLambda([0, 1, 2]); } catch (e) { threw3 = /POSITIVE/.test(e.message); }
  ok(threw3, 'RED: 0 as a member is REFUSED — this is the cosine-sum side, not the Newman side');
}

/* ---- Mercer's published conjectural rows as point-checks ---- */
{
  const rows = [
    { A: [1, 2, 4, 5, 6], printed: 1.627461 },
    { A: [1, 2, 4, 6, 7, 8], printed: 1.591832 }
  ];
  let good = 0;
  for (const row of rows) {
    const c = L.certifyLambda(row.A);
    if (Math.abs(c.lambda[0] - row.printed) < 1e-6) good++;
  }
  ok(good === 2, 'Mercer\'s printed lambda(5), lambda(6) champions certify at his 6-decimal values');
}

/* ---- the lambda-table records, if present ---- */
{
  const fs = require('fs');
  const path = require('path');
  const OUT = path.join(__dirname, '..', '..', 'certs', 'lambda-table.json');
  if (fs.existsSync(OUT)) {
    const t = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const keys = Object.keys(t.rows);
    let recert = 0, badCons = 0, badCaveat = 0;
    for (const k of keys) {
      const r = t.rows[k];
      const c = L.certifyLambda(r.optimiser.A);
      if (c.minEnclosure[0] === r.optimiser.minEnclosure[0] && c.minEnclosure[1] === r.optimiser.minEnclosure[1]) recert++;
      const m = /^(\d+)\+(\d+)\+(\d+)\+(\d+) = (\d+)$/.exec(r.conservation);
      if (!m || Number(m[1]) + Number(m[2]) + Number(m[3]) + Number(m[4]) !== Number(m[5]) || Number(m[5]) !== r.totalSets) badCons++;
      if (!/UPPER bound/.test(r.caveat)) badCaveat++;
    }
    ok(recert === keys.length, 'lambda-table: every stored optimiser (' + keys.join(', ') + ') re-certifies BYTE-IDENTICALLY');
    ok(badCons === 0, 'lambda-table: every conservation identity re-parses and sums');
    ok(badCaveat === 0, 'lambda-table: every record carries the infimum caveat in its own text');
  } else {
    console.log('SKIP  certs/lambda-table.json not present yet');
  }
}

console.log('');
console.log('lambda battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
