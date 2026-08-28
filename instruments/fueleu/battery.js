/* battery.js — the FuelEU instrument's gate: hand-computed known answers
   against the pinned regulation constants, and reds that must fire.
   Run: node instruments/fueleu/battery.js  (exit != 0 on any failure).
   instruments/fueleu · cert-machine                                        */
'use strict';

const assert = require('assert');
const F = require('./penalty.js');

let n = 0, reds = 0;
const ok = (name, fn) => { fn(); n++; console.log('PASS ' + name); };
const red = (name, fn) => { fn(); reds++; console.log('PASS ' + name + ' (RED ok)'); };

/* ---- known answers, every one derived by hand from the pinned bytes ------ */
ok('2025 limit is exactly 91,16 x 0,98 = 111671/1250 (= 89.3368)', () => {
  assert.strictEqual(F.str(F.targetFor(2025)), '111671/1250');
  assert.strictEqual(F.dec(F.targetFor(2025), 4), '89.3368');
});

ok('a step holds until the next one: 2026..2029 use the 2025 limit; 2030 drops to 107113/1250', () => {
  for (const y of [2026, 2027, 2028, 2029]) assert.strictEqual(F.str(F.targetFor(y)), '111671/1250');
  assert.strictEqual(F.str(F.targetFor(2030)), '107113/1250');
  assert.strictEqual(F.dec(F.targetFor(2030), 4), '85.6904');
});

ok('HFO default WtW intensity = 13,5 + (3,114 + 25x0,00005 + 298x0,00018)/0,0405 = 185782/2025 (= 91.7441...)', () => {
  assert.strictEqual(F.str(F.wtwIntensity('HFO')), '185782/2025');
  assert.strictEqual(F.dec(F.wtwIntensity('HFO'), 4), '91.7441');
});

ok('HFO vs 2025: NON-COMPLIANT by exactly 243749/101250 gCO2eq/MJ', () => {
  const v = F.decide(F.wtwIntensity('HFO'), 2025);
  assert.strictEqual(v.verdict, 'NON-COMPLIANT');
  assert.strictEqual(v.deficitStr, '243749/101250');
});

ok('Annex IV penalty hand case: actual 90, year 2025, E = 41 000 MJ -> exactly 6632/375 EUR (= 17.68...)', () => {
  const p = F.penaltyEUR(F.R(90), 2025, F.R(41000));
  assert.strictEqual(p.due, true);
  assert.strictEqual(p.penaltyStr, '6632/375');
  assert.strictEqual(p.penaltyDec, '17.68');
});

ok('compliant energy pays zero: actual 89, year 2025, any E -> penalty 0, not due', () => {
  const p = F.penaltyEUR(F.R(89), 2025, F.R(1000000));
  assert.strictEqual(p.due, false);
  assert.strictEqual(p.penaltyStr, '0');
});

ok('blend flip hand case: fossil 90, alt 0, 2025 -> p = exactly 829/112500 (= 0.736978%)', () => {
  const b = F.blendFlip(F.R(90), F.R(0), 2025);
  assert.strictEqual(b.verdict, 'FLIPS');
  assert.strictEqual(b.pStr, '829/112500');
});

ok('constrained intensity box: cf exactly at pure HFO collapses to the single point 185782/2025', () => {
  assert.strictEqual(F.str(F.cfgPerGram(F.FUELS.HFO)), '316889/100000');
  assert.strictEqual(F.str(F.cfgPerGram(F.FUELS.MGO)), '326089/100000');
  const b = F.intensityBoxFromCf(F.R(316889, 100000));
  assert.strictEqual(b.verdict, 'BOX');
  assert.strictEqual(F.str(b.iLo), '185782/2025');
  assert.strictEqual(F.str(b.iHi), '185782/2025');
});

ok('constrained box between fuels stays inside the pure-fuel spread and contains truth', () => {
  /* cf midway between LFO and MGO: box must sit within [LFO WtW, MGO WtW] */
  const cf = F.div(F.add(F.cfgPerGram(F.FUELS.LFO), F.cfgPerGram(F.FUELS.MGO)), F.R(2));
  const b = F.intensityBoxFromCf(cf);
  assert.strictEqual(b.verdict, 'BOX');
  assert.ok(F.cmp(b.iLo, F.R(88)) > 0 && F.cmp(b.iHi, F.R(92)) < 0);
  assert.ok(F.cmp(b.iLo, b.iHi) <= 0);
});

ok('printed decimals become exact rationals: "4785.45788" = 119636447/25000; floats refused', () => {
  assert.strictEqual(F.str(F.fromDec('4785.45788')), '119636447/25000');
  assert.strictEqual(F.str(F.fromDec('0.0')), '0');
  assert.throws(() => F.fromDec('1e-9'), /REFUSED/);
  assert.throws(() => F.fromDec(''), /REFUSED/);
});

/* ---- reds: the instrument must be able to say no -------------------------- */
red('RED: a 1e-9 intensity forgery at the boundary FLIPS the verdict — no tolerance window exists', () => {
  const t = F.targetFor(2025);
  assert.strictEqual(F.decide(t, 2025).verdict, 'COMPLIANT');            /* exactly at the limit */
  const forged = F.add(t, F.R(1, 1000000000));
  assert.strictEqual(F.decide(forged, 2025).verdict, 'NON-COMPLIANT');   /* one part in 10^9 over */
});

red('RED: a year before the regulation applies is REFUSED, never extrapolated', () => {
  assert.throws(() => F.targetFor(2024), /REFUSED/);
});

red('RED: a blend with an alternative fuel at or above the limit is REFUSED — no fraction can flip it', () => {
  const b = F.blendFlip(F.R(90), F.targetFor(2025), 2025);
  assert.strictEqual(b.verdict, 'REFUSED');
});

red('RED: negative energy and an unpinned fuel are REFUSED', () => {
  assert.throws(() => F.penaltyEUR(F.R(90), 2025, F.R(-1)), /REFUSED/);
  assert.throws(() => F.wtwIntensity('LNG'), /REFUSED/);
});

red('RED: a CO2eq/fuel ratio no oil mix can produce is REFUSED, never boxed', () => {
  assert.strictEqual(F.intensityBoxFromCf(F.R(275, 100)).verdict, 'REFUSED');   /* LNG-like */
  assert.strictEqual(F.intensityBoxFromCf(F.R(340, 100)).verdict, 'REFUSED');
});

console.log('ALL PASS: ' + n + ' checks, ' + reds + ' reds fired');
