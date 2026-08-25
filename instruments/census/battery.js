#!/usr/bin/env node
/* battery.js — the census instrument's gate.

   Calibration against the two cases with closed forms: the Hénon fixed points
   solve a x^2 + (1-b) x - 1 = 0, and the period-2 orbit solves
   t^2 - s t + P = 0 with s = (1-b)/a, P = (s(1-b) + a s^2 - 2)/(2a) — derived
   by subtracting and adding the two period-2 equations. A census that cannot
   reproduce a quadratic is not entitled to a period-8 count.

   Red controls: a deleted record and a sabotaged bound must BOTH be caught by
   the independent recheck. A control that cannot fire is decoration. */
'use strict';

const { census, recheckCensus, censusSpec, recheckSpec } = require('#instruments/census/henon-census.js');
const IV = require('#instruments/interval/interval.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

const a = 1.4, b = 0.3;

/* ---- p = 1: the closed-form fixed points ---- */
{
  const disc = Math.sqrt((1 - b) * (1 - b) + 4 * a);
  const roots = [((b - 1) + disc) / (2 * a), ((b - 1) - disc) / (2 * a)];
  const c1 = census(a, b, 1);
  ok(c1.ok, 'p=1 census completes (' + (c1.ok ? c1.stats.boxes + ' boxes' : c1.why) + ')');
  ok(c1.ok && c1.points === 2, 'EXACTLY 2 fixed points at a=1.4 (' + (c1.ok ? c1.points : '-') + ')');
  ok(c1.ok && c1.byMinimalPeriod['1'] === 2, 'both are minimal period 1');
  let matched = 0, straddle = 0;
  if (c1.ok) for (const r of roots) {
    const rec = c1.records.find(x => Math.abs(x.z[0] - r) < 1e-9);
    if (!rec) continue;
    matched++;
    /* the quadratic evaluated over the certified box must straddle 0 —
       an interval check, decisive at box width ~1e-12 */
    const S0 = rec.S[0];
    const q = IV.sub(IV.add(IV.mul(IV.iv(a), IV.sqr(S0)), IV.mul(IV.iv(1 - b), S0)), IV.ONE);
    if (q[0] <= 0 && q[1] >= 0) straddle++;
  }
  ok(matched === 2, 'both closed-form roots matched to certified records (' + matched + '/2)');
  ok(straddle === 2, 'the fixed-point quadratic straddles 0 over each certified box (' + straddle + '/2)');
}

/* ---- p = 2: the closed-form 2-cycle ---- */
let c2 = null;
{
  const s = (1 - b) / a, P = (s * (1 - b) + a * s * s - 2) / (2 * a);
  const d2 = Math.sqrt(s * s - 4 * P);
  const uv = [(s + d2) / 2, (s - d2) / 2];
  c2 = census(a, b, 2);
  ok(c2.ok, 'p=2 census completes (' + (c2.ok ? c2.stats.boxes + ' boxes' : c2.why) + ')');
  ok(c2.ok && c2.points === 4, 'EXACTLY 4 fixed points of H^2 (' + (c2.ok ? c2.points : '-') + ')');
  ok(c2.ok && c2.byMinimalPeriod['1'] === 2 && c2.byMinimalPeriod['2'] === 1,
    'classified as 2 fixed points + 1 genuine 2-cycle');
  const orb = c2.ok && c2.orbits.find(o => o.minimalPeriod === 2);
  const got = orb ? orb.vector.slice().sort((x, y) => x - y) : [];
  const want = uv.slice().sort((x, y) => x - y);
  ok(orb && Math.abs(got[0] - want[0]) < 1e-9 && Math.abs(got[1] - want[1]) < 1e-9,
    'the certified 2-cycle matches the closed form (' + (orb ? got.map(x => x.toFixed(10)).join(', ') : 'missing') + ')');
}

/* ---- cross-period consistency: p=4 must re-find the p=1 and p=2 counts ---- */
{
  const c4 = census(a, b, 4);
  ok(c4.ok, 'p=4 census completes (' + (c4.ok ? c4.stats.boxes + ' boxes, ' + c4.points + ' points' : c4.why) + ')');
  ok(c4.ok && c4.byMinimalPeriod['1'] === 2 && c4.byMinimalPeriod['2'] === 1,
    'the fixed points and the 2-cycle reappear inside the p=4 census');
  const total = c4.ok && c4.orbits.reduce((t, o) => t + o.points, 0);
  ok(c4.ok && total === c4.points, 'orbit sizes partition the point count (' + total + ' = ' + (c4.ok ? c4.points : '-') + ')');
}

/* ---- exactly zero: negative discriminant, the plane fully excluded ---- */
{
  const c0 = census(-0.5, b, 1);
  ok(c0.ok && c0.points === 0, 'a=-0.5: EXACTLY 0 fixed points, the whole plane excluded ('
    + (c0.ok ? c0.stats.boxes + ' boxes' : c0.why) + ')');
}

/* ---- determinism ---- */
{
  const r1 = census(a, b, 2), r2 = census(a, b, 2);
  const strip = r => JSON.stringify({ p: r.points, o: r.orbits, rec: r.records });
  ok(r1.ok && r2.ok && strip(r1) === strip(r2), 'two census runs are byte-identical (minus wall clock)');
}

/* ---- the recheck, honest and forged ---- */
{
  const honest = recheckCensus(a, b, 2, c2);
  ok(honest.ok && honest.converged > 0, 'RED control: the honest p=2 census passes the recheck ('
    + honest.converged + ' float solutions, all matched)');

  const forged = JSON.parse(JSON.stringify(c2));
  forged.records = forged.records.slice(1);          /* delete one certified zero */
  const caught = recheckCensus(a, b, 2, forged);
  ok(!caught.ok && caught.unmatched > 0, 'RED: a census with one record DELETED is refused ('
    + caught.unmatched + ' unmatched float solutions)');
}

/* ---- sabotaged bound: under-cover the plane, the recheck must fire ---- */
{
  const sab = census(a, b, 1, { sabotage: 'shrinkBound' });
  ok(sab.ok && sab.points < 2, 'sabotage bit: the shrunken bound cut off a fixed point ('
    + (sab.ok ? sab.points : sab.why) + ' of 2 found)');
  const caught = recheckCensus(a, b, 1, sab);
  ok(!caught.ok && caught.unmatched > 0, 'RED: the sabotaged census is refused by the recheck ('
    + caught.unmatched + ' unmatched)');
}

/* ---- the second map: Holmes cubic, x_{n+1} = d x - x^3 + b x_{n-1} ----
   The instrument is spec-general; this proves the generality is real and not
   Hénon-shaped by accident. Fixed points have closed forms — 0 and, past the
   pitchfork at d+b = 1, ±sqrt(d+b-1) — and the map is odd, so every record's
   negation must also be a record. */
{
  const { holmesSpec } = require('#families/holmes-census.js');
  const d = 2.77, bb = 0.2, spec = holmesSpec(d, bb);

  const c1 = censusSpec(spec, 1);
  ok(c1.ok && c1.points === 3, 'holmes p=1: EXACTLY 3 fixed points at d=2.77 (' + (c1.ok ? c1.points : '-') + ')');
  const r = Math.sqrt(d + bb - 1);
  let matched = 0, straddle = 0;
  if (c1.ok) for (const root of [0, r, -r]) {
    const rec = c1.records.find(x => Math.abs(x.z[0] - root) < 1e-9);
    if (!rec) continue;
    matched++;
    /* the cubic x^3 - (d+b-1)x must straddle 0 over the certified box */
    const S0 = rec.S[0];
    const q = IV.sub(IV.pow(S0, 3), IV.mul(IV.iv(d + bb - 1), S0));
    if (q[0] <= 0 && q[1] >= 0) straddle++;
  }
  ok(matched === 3, 'all three closed-form fixed points (0, ±sqrt(d+b-1)) matched to records (' + matched + '/3)');
  ok(straddle === 3, 'the fixed-point cubic straddles 0 over each certified box (' + straddle + '/3)');

  /* below the pitchfork only x = 0 remains */
  const cLow = censusSpec(holmesSpec(0.7, bb), 1);
  ok(cLow.ok && cLow.points === 1, 'below the pitchfork (d+b<1): EXACTLY 1 fixed point (' + (cLow.ok ? cLow.points : '-') + ')');

  /* odd symmetry: the negation of every certified point is a certified point */
  const c3 = censusSpec(spec, 3);
  let sym = c3.ok;
  if (c3.ok) for (const rec of c3.records) {
    if (!c3.records.some(o => rec.z.every((x, i) => Math.abs(x + o.z[i]) < 1e-9))) sym = false;
  }
  ok(sym && c3.ok && c3.points === 15, 'p=3: 15 points, and the census respects the map\'s oddness — every record\'s negation is a record');

  /* RED: the sabotaged bound cuts off the outer fixed points; the recheck fires */
  const sab = censusSpec(spec, 1, { sabotage: 'shrinkBound' });
  ok(sab.ok && sab.points === 1, 'sabotage bit: the shrunken bound leaves only x=0 (' + (sab.ok ? sab.points : sab.why) + ' of 3)');
  const caught = recheckSpec(spec, 1, sab);
  ok(!caught.ok && caught.unmatched > 0, 'RED: the sabotaged holmes census is refused by the recheck (' + caught.unmatched + ' unmatched)');

  /* RED: a deleted record is caught */
  const forged = JSON.parse(JSON.stringify(c1));
  forged.records = forged.records.slice(1);
  const caught2 = recheckSpec(spec, 1, forged);
  ok(!caught2.ok && caught2.unmatched > 0, 'RED: a holmes census with one record DELETED is refused (' + caught2.unmatched + ' unmatched)');
}

console.log('');
console.log('census battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
