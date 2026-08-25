#!/usr/bin/env node
/* sweep-battery.js — the box-sweep instrument's gate.

   CALIBRATION with a known answer, cross-lab: Goddard's 1992 box (n=6,
   exponents <= 30) was closed under exact arithmetic in the source lab —
   142,506 sets, 104,468 killed by integer arithmetic at roots of unity,
   142,504 killed total, 2 survivors, champion {0,6,9,10,17,24}. This
   battery re-closes the whole box on every run with an INDEPENDENT
   implementation and requires every one of those numbers to reproduce.
   Plus: a small box where every set is fully certified with no cascade at
   all, and the cascade must agree set-for-set (a 100% kill audit, not a
   sample); the stage-W threshold pinned at its exact integer; reds on the
   conservation identity (a dropped verdict must throw), the bar (a
   nonpositive floor must refuse), and the equality certificate (two
   distinct refusal reasons). Every red fires or the battery is red. */
'use strict';

const S = require('#instruments/trigmin/sweep.js');
const N = require('#instruments/trigmin/newman.js');
const Q = require('#instruments/interval/rational.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* ---- cross-lab calibration: Goddard's box, every number pinned ---- */
{
  const r = S.sweepBox({ n: 6, maxA: 30, seed: [0, 6, 9, 10, 17, 24] });
  ok(r.totalSets === 142506, 'Goddard box: C(30,5) = 142,506 sets enumerated');
  ok(r.killedAtRootsOfUnity === 104468, 'stage W kills exactly 104,468 by integer arithmetic — the source lab\'s measured count, reproduced independently');
  ok(r.killedAtRootsOfUnity + r.killedDyadic === 142504 && r.certifiedBelow === 0,
    '142,504 sets killed exactly, none needed a rescue certification');
  ok(r.survivors.length === 2
    && JSON.stringify(r.champion.A) === '[0,6,9,10,17,24]'
    && r.survivors.some(s => JSON.stringify(s.A) === '[0,7,14,15,18,24]'),
    'the two survivors are Goddard\'s champion and its reversal — nothing else in the box clears the bar');
  ok(r.champion.modulus[0] >= 1.0652858911344154 - 3e-16 && r.champion.modulus[0] <= 1.0652858911344156,
    'champion floor min|f| >= 1.06528589113441... (Goddard\'s 1.1348 is min|f|^2 — the 1992 label slip, kept honest here)');
  ok(r.maximumOrbit.uniqueUpToDilationAndReversal === true,
    'the maximum is unique up to dilation and reversal in this box (classified, not assumed)');

  /* stage W threshold, pinned at its exact integer: min |f(w)|^2 over the
     four moduli is EXACTLY 4 (the source lab's pinned value; our scaling
     carries 4|f|^2 = 16) */
  ok(S.stageWMin4([0, 6, 9, 10, 17, 24]) === 16,
    'the champion\'s smallest |f(w)|^2 over the four moduli is EXACTLY 4 (stored as 4|f|^2 = 16)');
  const kills = (fsq) => { const b = S.barFromFloorSq(fsq); return 16n * b.bd < 4n * b.bn; };
  ok(!kills(4.0) && kills(4.1),
    'RED both directions: the W kill is inert at barSq = 4 (strict inequality) and lethal just above it');
}

/* ---- the 100% kill audit: a box with no cascade at all ---- */
{
  const n = 4, maxA = 12;
  const all = [];
  const rec = (A) => { const c = N.certifyNewman(A, { bar: 0 }); all.push({ A: A.slice(), lo: c.modSq[0] }); };
  const idx = [1, 2, 3];
  for (;;) {
    rec([0, idx[0], idx[1], idx[2]]);
    let i = 2; while (i >= 0 && idx[i] === maxA - (2 - i)) i--;
    if (i < 0) break; idx[i]++;
    for (let j = i + 1; j < 3; j++) idx[j] = idx[j - 1] + 1;
  }
  ok(all.length === 220, 'brute force: all C(12,3) = 220 sets fully certified, no cascade');
  const best = all.reduce((a, b) => (b.lo > a.lo ? b : a));
  const r = S.sweepBox({ n, maxA, seed: best.A });
  ok(JSON.stringify(r.champion.A) === JSON.stringify(best.A) && r.champion.modSq[0] === best.lo,
    'the cascade finds the same champion at the same certified floor as brute force');
  /* every set the cascade killed must certify below the bar — 0 breaches allowed */
  const surv = new Set(r.survivors.map(s => JSON.stringify(s.A)));
  const barQ = Q.fromDouble(r.barSq.asDouble);
  let breaches = 0;
  for (const s of all) {
    const killed = !surv.has(JSON.stringify(s.A));
    const below = Q.cmp(Q.fromDouble(s.lo), barQ) <= 0;
    if (killed && !below) breaches++;
  }
  ok(breaches === 0, 'KILL AUDIT over all ' + (220 - r.survivors.length) + ' killed sets: 0 breaches — the kill stages\' word is never taken');
}

/* ---- reds: conservation, bar, orbit ---- */
{
  let threw = false;
  try { S.sweepBox({ n: 4, maxA: 8, seed: [0, 1, 2, 4], _dropVerdictAt: 17 }); }
  catch (e) { threw = /conservation|enumerated/.test(e.message); }
  ok(threw, 'RED: a deliberately dropped verdict is caught by the conservation identity — a silent hole cannot become an exhaustion claim');
  for (const bad of [0, -1, NaN]) {
    let t = false; try { S.barFromFloorSq(bad); } catch (e) { t = true; }
    ok(t, 'RED: barFromFloorSq(' + bad + ') REFUSES');
  }
  const O = S._orbit;
  ok(O.inOrbit([0, 2, 6], [0, 1, 3], 12) && O.inOrbit([0, 4, 6], [0, 1, 3], 12) && !O.inOrbit([0, 1, 4], [0, 1, 3], 12),
    'orbit classification: dilation and reversed-dilation are in, a stranger is out');
}

/* ---- the equality certificate: M(0,1,2,6,9) = 1 exactly ---- */
{
  const e = S.certifyMinEqualsOne([0, 1, 2, 6, 9]);
  ok(e.verdict === 'EQUALITY' && e.k === 1 && /H\(-1\) = 92/.test(e.proof),
    'M(0,1,2,6,9) = 1 EXACTLY (Mercer\'s witness): |f|^2 - 1 = (y+1)·H, H > 0 on [-1,1] by Sturm — a tie no enclosure decides');
  const r1 = S.certifyMinEqualsOne([0, 1, 3]);
  ok(r1.verdict === 'REFUSED' && /root/.test(r1.why),
    'RED: {0,1,3} passes the boundary check (|f(-1)| = 1) but Sturm finds interior roots — REFUSED');
  const r2 = S.certifyMinEqualsOne([0, 1, 2]);
  ok(r2.verdict === 'REFUSED' && /endpoint/.test(r2.why),
    'RED: {0,1,2} (vanishes at a cube root of unity) fails the endpoint positivity — REFUSED for a different reason');
  /* and the sqrt of the certified enclosure agrees: certifyNewman on the same
     set must produce an enclosure CONTAINING 1 — the two roads meet */
  const c = N.certifyNewman([0, 1, 2, 6, 9], { bar: 0 });
  ok(c.modSq[0] <= 1 && 1 <= c.modSq[1],
    'the enclosure road contains 1 where the exact road proves 1 — consistent, and the exact road is strictly stronger');
}

/* ---- the mu-table records, if present: champions re-certified from their
   stored exponents, conservation re-parsed, floors monotone-checkable ---- */
{
  const fs = require('fs');
  const path = require('path');
  const OUT = path.join(__dirname, '..', '..', 'certs', 'mu-table.json');
  if (fs.existsSync(OUT)) {
    const t = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const ns = Object.keys(t.rows).map(Number).sort((a, b) => a - b);
    let recert = 0, badConservation = 0, badOrbit = 0;
    for (const n of ns) {
      const r = t.rows[n];
      const c = N.certifyNewman(r.champion.A, { bar: 0 });
      if (c.modSq[0] === r.champion.modSq[0] && c.modSq[1] === r.champion.modSq[1]) recert++;
      const m = /^(\d+)\+(\d+)\+(\d+)\+(\d+) = (\d+)$/.exec(r.conservation);
      if (!m || Number(m[1]) + Number(m[2]) + Number(m[3]) + Number(m[4]) !== Number(m[5])
        || Number(m[5]) !== r.totalSets) badConservation++;
      const P = S._orbit.primitiveOf(r.champion.A);
      for (const s of r.survivors) if (r.maximumOrbit.uniqueUpToDilationAndReversal && !S._orbit.inOrbit(s.A, P, r.maxA)) badOrbit++;
    }
    ok(recert === ns.length, 'mu-table: every stored champion (n = ' + ns.join(',') + ') re-certifies BYTE-IDENTICALLY from its exponents');
    ok(badConservation === 0, 'mu-table: every row\'s conservation identity re-parses and sums to its box cardinality');
    ok(badOrbit === 0, 'mu-table: every orbit-uniqueness claim re-verifies against its survivors');
    if (t.rows[9]) {
      const r9 = t.rows[9];
      const pub = r9.survivors.find(s => JSON.stringify(s.A) === '[0,1,2,3,4,7,8,10,12]');
      ok(!!pub && pub.modulus[0] === 1.3623731781333241,
        'mu-table VALIDATION ROW (n=9): the PUBLISHED witness is found inside the box at floor 1.3623731781333241 — the source-lab record, reproduced');
      ok(r9.champion.modulus[0] > pub.modulus[1],
        'mu-table: the n=9 box champion strictly beats the published witness (certified floor above certified ceiling)');
    }
  } else {
    console.log('SKIP  certs/mu-table.json not present yet (ladder still running)');
  }
}

console.log('');
console.log('sweep battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
