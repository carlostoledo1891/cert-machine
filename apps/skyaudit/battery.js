/* battery.js — SkyAudit's gate: calibrations against known answers, reds
   that must fire. Run: node apps/skyaudit/battery.js   (exit != 0 on any
   failure; build.js will refuse without a green battery)                  */
'use strict';

const assert = require('assert');
const { segmentTrace } = require('./audit/flights.js');
const power = require('./audit/power.js');
const mission = require('./audit/mission.js');
const path = require('path');
const energy = require(path.join(__dirname, '../../instruments/evtol/energy.js'));

let n = 0;
function ok(name, fn) { fn(); n++; console.log('  ok ' + String(n).padStart(2) + '  ' + name); }

/* ---------- synthetic traces ---------- */
const BASE = 1756166400;
function mkTrace(entries) { return { icao: 'test01', timestamp: BASE, trace: entries }; }
const KT = 0.514444;                       /* kt -> m/s */
function north(entries, t0, nPts, lat0, lon0, gsKt, altFt) {
  const stepDeg = (gsKt * KT * 10) / 111194.9;     /* 10 s per point, deg lat */
  for (let i = 0; i < nPts; i++) {
    entries.push([t0 + i * 10, lat0 + i * stepDeg, lon0, altFt, gsKt, 0, 0, 0, null, 'adsb_icao']);
  }
  return t0 + nPts * 10;
}
function ground(entries, t0, nPts, lat, lon) {
  for (let i = 0; i < nPts; i++) entries.push([t0 + i * 10, lat, lon, 'ground', 0, 0, 0, 0, null, 'adsb_icao']);
  return t0 + nPts * 10;
}

console.log('skyaudit battery');
console.log('-- segmentation: calibration');

ok('single flight: count, duration, path within 1%', () => {
  const e = []; let t = ground(e, 0, 3, 40.70, -74.00);
  t = north(e, t, 60, 40.70, -74.00, 120, 1500);
  ground(e, t, 8, 40.75, -74.00);
  const f = segmentTrace(mkTrace(e));
  assert.strictEqual(f.length, 1);
  assert.strictEqual(f[0].durationS, 590);
  const expectKm = 59 * (120 * KT * 10) / 1000;    /* 59 hops of 617.3 m */
  assert.ok(Math.abs(f[0].pathKm - expectKm) / expectKm < 0.01, 'path ' + f[0].pathKm + ' vs ' + expectKm);
  assert.strictEqual(f[0].truncatedStart, false);
  assert.strictEqual(f[0].truncatedEnd, false);
});

ok('two hops split by 120 s ground; 20 s blip merges', () => {
  const e = []; let t = ground(e, 0, 2, 40.70, -74.00);
  t = north(e, t, 30, 40.70, -74.00, 100, 1200);
  t = ground(e, t, 12, 40.73, -74.00);              /* 120 s: closes */
  t = north(e, t, 30, 40.73, -74.00, 100, 1200);
  ground(e, t, 8, 40.76, -74.00);
  assert.strictEqual(segmentTrace(mkTrace(e)).length, 2);

  const e2 = []; let t2 = ground(e2, 0, 2, 40.70, -74.00);
  t2 = north(e2, t2, 30, 40.70, -74.00, 100, 1200);
  t2 = ground(e2, t2, 2, 40.73, -74.00);            /* 20 s blip: merges */
  t2 = north(e2, t2, 30, 40.73, -74.00, 100, 1200);
  ground(e2, t2, 8, 40.76, -74.00);
  assert.strictEqual(segmentTrace(mkTrace(e2)).length, 1);
});

console.log('-- segmentation: reds (must fire)');

ok('RED: scrambled timestamps THROW', () => {
  const e = []; let t = ground(e, 0, 2, 40.70, -74.00);
  north(e, t, 20, 40.70, -74.00, 100, 1200);
  const tmp = e[5][0]; e[5][0] = e[9][0]; e[9][0] = tmp;
  assert.throws(() => segmentTrace(mkTrace(e)), /non-monotonic/);
});

ok('RED: all-ground and empty traces yield zero flights', () => {
  const e = []; ground(e, 0, 50, 40.70, -74.00);
  assert.strictEqual(segmentTrace(mkTrace(e)).length, 0);
  assert.strictEqual(segmentTrace(mkTrace([])).length, 0);
});

ok('RED: duplicated instants create no phantom flight', () => {
  const e = []; let t = ground(e, 0, 2, 40.70, -74.00);
  t = north(e, t, 30, 40.70, -74.00, 100, 1200);
  ground(e, t, 8, 40.73, -74.00);
  const dup = e.slice(0, 10).map((x) => x.slice());  /* re-append first 10 instants */
  const withDup = e.concat(dup).sort((a, b) => a[0] - b[0]);
  assert.strictEqual(segmentTrace(mkTrace(withDup)).length, 1);
});

console.log('-- power model: literature calibration (Kasliwal 2019 worked examples)');

ok('hover 250.6 kW and cruise 59.7 kW reproduced within tolerance', () => {
  const h = power.hoverKw({ m_kg: [1187.5, 1187.5], delta_nm2: [450, 450], eta_h: [0.63, 0.63], rho: [1.22, 1.22] });
  assert.ok(Math.abs((h[0] + h[1]) / 2 - 250.6) < 1.5, 'hover ' + h);
  const c = power.cruiseKw({ m_kg: [1187.5, 1187.5], v_kmh: [240.12, 240.12], ld: [17, 17], eta_c: [0.765, 0.765] });
  assert.ok(Math.abs((c[0] + c[1]) / 2 - 59.7) < 0.3, 'cruise ' + c);
});

console.log('-- instrument bridge: dyadic hand-computed verdicts');

const dyMission = { segments: [{ name: 'seg', t_s: [900, 900], p_kw: [100, 100] }] };
const dyBase = { eta: [0.5, 0.5], reserve: { t_s: [450, 450], p_kw: [64, 64] } };
/* used = 900/3600*100/0.5 = 50 kWh; reserve = 450/3600*64/0.5 = 16 kWh */

ok('CERTIFIED with margin 14 (usable 80): hand-computed exactly', () => {
  const r = energy.certify(dyMission, { ...dyBase, usable_kwh: [80, 80] });
  assert.strictEqual(r.verdict, 'CERTIFIED');
  assert.ok(Math.abs(r.margin_kwh - 14) < 1e-9, 'margin ' + r.margin_kwh);
});

ok('REFUTED with exact witness -2 (usable 60..64)', () => {
  const r = energy.certify(dyMission, { ...dyBase, usable_kwh: [60, 64] });
  assert.strictEqual(r.verdict, 'REFUTED');
  assert.ok(Math.abs(r.margin_kwh + 2) < 1e-9, 'best margin ' + r.margin_kwh);
  assert.ok(r.witness && /^-/.test(r.witness.margin_str), 'exact witness must be negative');
});

ok('REFUSED on a straddle (usable 64..68)', () => {
  const r = energy.certify(dyMission, { ...dyBase, usable_kwh: [64, 68] });
  assert.strictEqual(r.verdict, 'REFUSED');
});

console.log('-- audit honesty: assumption-grade specs cannot decide long missions');

ok('Eve (all-assumption boxes) on a 100 km flight REFUSES — measured ignorance', () => {
  const phys = mission.loadPhysics('kasliwal-2019');
  const spec = mission.loadSpec('eve-100');
  const rule = mission.loadRule('easa-final-reserve');
  const flight = { pathKm: 100, gcKm: 90, durationS: 2400 };
  const row = mission.auditFlight(flight, spec, rule, phys);
  assert.strictEqual(row.verdict, 'REFUSED');
});

ok('every spec/rule pack loads and has well-formed boxes', () => {
  const phys = mission.loadPhysics('kasliwal-2019');
  for (const id of ['joby-s4', 'archer-midnight', 'beta-alia', 'eve-100']) {
    const s = mission.loadSpec(id);
    for (const k of ['m_kg', 'battery_kwh', 'v_cruise_kmh', 'delta_nm2']) {
      const b = s.boxes[k].v;
      assert.ok(Array.isArray(b) && b[0] > 0 && b[0] <= b[1], id + '.' + k);
    }
    /* a 10 km hop must produce SOME verdict without throwing, both rules */
    for (const rid of ['faa-sfar-vfr', 'easa-final-reserve']) {
      const row = mission.auditFlight({ pathKm: 10, gcKm: 8, durationS: 600 }, s, mission.loadRule(rid), phys);
      assert.ok(['CERTIFIED', 'REFUTED', 'REFUSED'].includes(row.verdict));
    }
  }
});

console.log('-- sim/refly: the fleet frontier (pool model)');

const refly = require('./sim/refly.js');
const SPEC1 = { boxes: { charge_minutes_full: { v: [10, 10] } } };   /* 600 s charge */
const mkRow = (id, t, dur, verdict) => ({ id, verdict, flight: { tStart: t, durationS: dur },
  used_kwh: [50, 100], usable_kwh: [100, 120] });                     /* depth 1 -> full charge */

ok('known answer: two abutting legs + charge need 2 aircraft; a later leg reuses one', () => {
  const rows = [mkRow('A', 0, 600, 'CERTIFIED'), mkRow('B', 600, 600, 'CERTIFIED'),
    mkRow('C', 5000, 600, 'CERTIFIED')];
  const r = refly.reflyKey(rows, SPEC1);
  assert.strictEqual(r.fleetMin, 2);
  assert.strictEqual(r.certifiedLegs, 3);
});

ok('RED: removing charge time must flip the frontier 2 -> 1', () => {
  const rows = [mkRow('A', 0, 600, 'CERTIFIED'), mkRow('B', 600, 600, 'CERTIFIED')];
  const withCharge = refly.reflyKey(rows, SPEC1);
  const noCharge = refly.reflyKey(rows, { boxes: { charge_minutes_full: { v: [0, 0] } } });
  assert.strictEqual(withCharge.fleetMin, 2);
  assert.strictEqual(noCharge.fleetMin, 1);
});

ok('RED: a double-booked schedule fails exact verification', () => {
  const legs = [{ id: 'A', s: 0, e: 1200 }, { id: 'B', s: 600, e: 1800 }];
  const bad = [{ id: 'A', aircraft: 0, s: 0, e: 1200 }, { id: 'B', aircraft: 0, s: 600, e: 1800 }];
  assert.strictEqual(refly.verifySchedule(legs, bad), false);
});

ok('non-certified legs are counted outside the envelope, never served', () => {
  const rows = [mkRow('A', 0, 600, 'CERTIFIED'), mkRow('B', 0, 600, 'REFUTED'),
    mkRow('C', 0, 600, 'REFUSED')];
  const r = refly.reflyKey(rows, SPEC1);
  assert.strictEqual(r.certifiedLegs, 1);
  assert.deepStrictEqual(r.outside, { REFUTED: 1, REFUSED: 1 });
});

ok('determinism: two runs, identical timeline hash', () => {
  const rows = Array.from({ length: 40 }, (_, i) => mkRow('L' + i, i * 300, 500, 'CERTIFIED'));
  const a = refly.reflyKey(rows, SPEC1), b = refly.reflyKey(rows, SPEC1);
  assert.strictEqual(a.timelineHash, b.timelineHash);
  assert.ok(/^[0-9a-f]{64}$/.test(a.timelineHash));
});

console.log('-- sim/optimize: certified thresholds');

const opt = require('./sim/optimize.js');

ok('bisection known answer: least x with x >= 37 is 37', () => {
  const r = opt.bisectLeast(0, 100, (x) => x, 37);
  assert.strictEqual(r.threshold, 37);
});

ok('RED: a non-monotone lever must THROW, never return a threshold', () => {
  /* the spike sits ON the bisection path (first midpoint of [0,40] is 20),
     so the guard's sampled pairs contain (20,100) followed by (40,40) */
  assert.throws(() => opt.bisectLeast(0, 40, (x) => (x === 20 ? 100 : x), 15), /monotonicity/);
});

ok('optimizer agrees with the gated audit: reserve-price at 20 min == the day\'s CERTIFIED count', () => {
  const res = opt.run('nyc');
  const summary = JSON.parse(require('fs').readFileSync(
    require('path').join(__dirname, 'data/day-2026-08-26/nyc.audit-summary.json'), 'utf8'));
  assert.strictEqual(res.reserve_price.by_reserve_minutes['beta-alia'][20],
    summary.bySpecRule['beta-alia|faa-sfar-vfr'].CERTIFIED);
  /* and the charge curve's top step must equal the committed refly frontier */
  const refly = JSON.parse(require('fs').readFileSync(
    require('path').join(__dirname, 'data/day-2026-08-26/nyc.refly.json'), 'utf8'));
  const top = res.charge_lever.curve[res.charge_lever.curve.length - 1];
  assert.strictEqual(top.fleetMin, refly.keys['beta-alia|faa-sfar-vfr'].fleetMin);
  /* reserve price monotone nonincreasing */
  for (const [, row] of Object.entries(res.reserve_price.by_reserve_minutes)) {
    const vals = [5, 10, 15, 20, 25, 30].map((m) => row[m]);
    for (let i = 1; i < vals.length; i++) assert.ok(vals[i] <= vals[i - 1], 'reserve price must be monotone');
  }
});

ok('range claims: reds fire in both directions', () => {
  const phys = mission.loadPhysics('kasliwal-2019');
  const rule = mission.loadRule('faa-sfar-vfr');
  const joby = mission.loadSpec('joby-s4');
  /* a 5000 km claim must be REFUTED even at the best corner */
  assert.strictEqual(farClaim(5000, joby, phys, rule).verdict, 'REFUTED');
  /* a 2 km mission must CERTIFY at the worst corner (universal) */
  const trivial = farClaim(2, mission.loadSpec('archer-midnight'), phys, null);
  assert.strictEqual(trivial.verdict, 'CERTIFIED');
  function farClaim(km, spec, ph, r) {
    const power = require('./audit/power.js');
    const energy = require(path.join(__dirname, '../../instruments/evtol/energy.js'));
    const B = (k) => spec.boxes[k].v, P = (k) => ph.boxes[k].v;
    const pH = power.hoverKw({ m_kg: B('m_kg'), delta_nm2: B('delta_nm2'), eta_h: P('eta_h'), rho: P('rho') });
    const pC = power.cruiseKw({ m_kg: B('m_kg'), v_kmh: B('v_cruise_kmh'), ld: P('ld'), eta_c: P('eta_c') });
    const cap = B('battery_kwh'), uf = P('usable_frac');
    return energy.certify(
      { segments: [{ name: 'h', t_s: P('hover_budget_s'), p_kw: pH },
        { name: 'c', t_s: power.cruiseTimeS([km, km], B('v_cruise_kmh')), p_kw: pC }] },
      { usable_kwh: [cap[0] * uf[0], cap[1] * uf[1]], eta: P('eta_batt'),
        reserve: r ? { t_s: r.reserve.t_s, p_kw: pC } : { t_s: [0, 0], p_kw: [0, 0] } });
  }
});

console.log('-- real-corpus regression (operator-inspected 2026-08-27: speeds/altitudes/patterns type-consistent)');

ok('pinned flights reproduce exactly from the pinned corpus', () => {
  const { loadHeli } = require('./audit/corpus.js');
  const byIcao = new Map(loadHeli('nyc').aircraft.map((o) => [o.icao, o]));
  /* N833MK (H160, 8 clean ground-to-ground shuttle legs) — flight #1 */
  const h160 = segmentTrace(byIcao.get('ab649c'));
  assert.strictEqual(h160.length, 8);
  assert.strictEqual(h160[1].truncatedStart || h160[1].truncatedEnd, false);
  assert.ok(Math.abs(h160[1].pathKm - 60) < 1, 'H160 leg ~60 km, got ' + h160[1].pathKm);
  assert.ok(Math.abs(h160[1].durationS / 60 - 15) < 1.5, 'H160 leg ~15 min');
  /* N48ZA (B407 charter) — 2 flights, first ~160 km */
  const b407 = segmentTrace(byIcao.get('a5e880'));
  assert.strictEqual(b407.length, 2);
  assert.ok(Math.abs(b407[0].pathKm - 160) < 2, 'B407 day leg ~160 km');
});

console.log('battery green: ' + n + '/' + n + ' checks');
