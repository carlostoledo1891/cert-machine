/* optimize.js — WHAT WOULD IT TAKE? Certified thresholds over the pinned
   day: the machine's answer to "how could this system be optimized",
   with a proof on BOTH sides of every flip. apps/skyaudit/sim

   Three levers, three certified analyses (FAA 20-min shape throughout):

   1. BATTERY FLOOR (design): the minimum integer nameplate B (kWh, the
      battery box collapsed to the stated point [B,B]; every other box as
      published) at which >= K of the day's flights come out CERTIFIED.
      Coverage is monotone in B (usable energy only grows), so bisection
      decides it; the certificate is the recount at B* and at B*-1.
   2. CHARGE LEVER (infrastructure): the pool-model fleet minimum as a
      function of charge-to-full minutes — the exact step curve, each
      point proved by pigeonhole + verified schedule (sim/refly.js).
   3. RESERVE PRICE (policy): provable legs at reserve = 5/10/15/20/25/30
      minutes at cruise power — the FAA-docket controversy, priced in
      exactly-counted legs per day.

   Deterministic; results are a gated record (build refuses on drift).   */
'use strict';

const fs = require('fs');
const path = require('path');
const M = require('../audit/mission.js');
const { loadHeli, isHeliStrict, primaryRule } = require('../audit/corpus.js');
const { segmentTrace } = require('../audit/flights.js');
const refly = require('./refly.js');

const SPEC_IDS = ['joby-s4', 'archer-midnight', 'beta-alia', 'eve-100'];

function dayFlights(city, dayDir) {
  const flights = [];
  for (const obj of loadHeli(city, dayDir).aircraft) {
    if (!isHeliStrict(obj)) continue;               /* one filter, all consumers */
    let fl; try { fl = segmentTrace(obj); } catch (e) { continue; }
    for (const f of fl) flights.push(f);
  }
  return flights;
}

function withBattery(spec, B) {
  const s = JSON.parse(JSON.stringify(spec));
  s.boxes.battery_kwh.v = [B, B];
  return s;
}
function withReserveMinutes(rule, min) {
  const r = JSON.parse(JSON.stringify(rule));
  r.reserve.t_s = [min * 60, min * 60];
  return r;
}

function coverage(flights, spec, rule, phys) {
  let c = 0;
  for (const f of flights) if (M.auditFlight(f, spec, rule, phys).verdict === 'CERTIFIED') c++;
  return c;
}

/* generic certified bisection: f monotone nondecreasing on integers in
   [lo, hi]; returns least x with f(x) >= target. The monotonicity GUARD
   throws if any evaluated pair violates it (battery red exercises this). */
function bisectLeast(lo, hi, f, target) {
  const seen = new Map();
  const ev = (x) => { if (!seen.has(x)) seen.set(x, f(x)); return seen.get(x); };
  if (ev(hi) < target) return { threshold: null, atHi: ev(hi) };
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ev(mid) >= target) hi = mid; else lo = mid + 1;
  }
  const pairs = [...seen.entries()].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < pairs.length; i++) {
    if (pairs[i][1] < pairs[i - 1][1]) throw new Error('optimize: monotonicity violated at ' + pairs[i][0]);
  }
  return { threshold: lo, below: lo > 0 ? (seen.get(lo - 1) ?? f(lo - 1)) : null, at: seen.get(lo) };
}

function batteryFloors(flights, phys, rule) {
  const out = {};
  for (const id of SPEC_IDS) {
    const spec = M.loadSpec(id);
    const total = flights.length;
    const cov = new Map();
    const f = (B) => { if (!cov.has(B)) cov.set(B, coverage(flights, withBattery(spec, B), rule, phys)); return cov.get(B); };
    out[id] = { published_box_kwh: spec.boxes.battery_kwh.v, published_q: spec.boxes.battery_kwh.q, targets: {} };
    for (const K of [0.5, 0.8, 0.95]) {
      const need = Math.ceil(K * total);
      const r = bisectLeast(40, 900, f, need);
      out[id].targets[K] = r.threshold === null
        ? { kwh: null, note: 'not reachable below 900 kWh', coverage_at_900: r.atHi + '/' + total }
        : { kwh: r.threshold, covered: f(r.threshold) + '/' + total,
            one_less: (r.threshold - 1) + ' kWh covers only ' + f(r.threshold - 1) + '/' + total };
    }
  }
  return out;
}

function chargeCurve(city, dayDir, specId) {
  const spec = M.loadSpec(specId);
  const zlib = require('zlib');
  const p = path.join(__dirname, '../data', dayDir, city + '.certs.jsonl');
  const raw = fs.existsSync(p) ? fs.readFileSync(p, 'utf8')
    : zlib.gunzipSync(fs.readFileSync(p + '.gz')).toString('utf8');
  const rowsAll = raw.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l))
    .filter((r) => r.spec === specId && r.rule === primaryRule(city));
  if (!rowsAll.some((r) => r.verdict === 'CERTIFIED')) return { specId, curve: [], note: 'no certifiable legs' };
  const curve = [];
  let prev = null;
  for (let m = 0; m <= 60; m++) {
    const s = JSON.parse(JSON.stringify(spec));
    s.boxes.charge_minutes_full.v = [m, m];
    const res = refly.reflyKey(rowsAll, s, city);
    if (prev === null || res.fleetMin !== prev) {
      curve.push({ from_minutes: m, fleetMin: res.fleetMin, witnessLocal: res.witnessLocal || null });
      prev = res.fleetMin;
    }
  }
  return { specId, published_charge_box_min: spec.boxes.charge_minutes_full.v, curve,
    note: 'fleetMin per charge-to-full minutes; each point proved by pigeonhole (lower) + verified schedule (upper), pool model' };
}

function reservePrice(flights, phys, rule) {
  const out = {};
  for (const id of SPEC_IDS) {
    const spec = M.loadSpec(id);
    out[id] = {};
    for (const min of [5, 10, 15, 20, 25, 30]) {
      out[id][min] = coverage(flights, spec, withReserveMinutes(rule, min), phys);
    }
  }
  return { legs_total: flights.length, by_reserve_minutes: out,
    note: 'CERTIFIED legs at reserve = N minutes at cruise power (FAA VFR shape); exact counts, monotone nonincreasing in N' };
}

/* ---- the range-claim audit: manufacturers' own claims vs their own
   public boxes. A range claim is EXISTENTIAL ("can fly R km"): it is
   CONSISTENT iff the BEST corner of the honest boxes achieves it, and
   REFUTED iff no point of the published+assumed envelope does. Archer's
   "minimum 60 mi worst case" guarantee is UNIVERSAL: worst-corner test. */
const power = require('../audit/power.js');
const energyInstr = require(path.join(__dirname, '../../../instruments/evtol/energy.js'));

function claimAudit(distKm, spec, phys, withReserve, rule) {
  const B = (k) => spec.boxes[k].v, P = (k) => phys.boxes[k].v;
  const pHover = power.hoverKw({ m_kg: B('m_kg'), delta_nm2: B('delta_nm2'), eta_h: P('eta_h'), rho: P('rho') });
  const pCruise = power.cruiseKw({ m_kg: B('m_kg'), v_kmh: B('v_cruise_kmh'), ld: P('ld'), eta_c: P('eta_c') });
  const tCruise = power.cruiseTimeS([distKm, distKm], B('v_cruise_kmh'));
  const mission = { segments: [
    { name: 'hover', t_s: P('hover_budget_s'), p_kw: pHover },
    { name: 'cruise ' + distKm + ' km', t_s: tCruise, p_kw: pCruise } ] };
  const cap = B('battery_kwh'), uf = P('usable_frac');
  const battery = { usable_kwh: [cap[0] * uf[0], cap[1] * uf[1]], eta: P('eta_batt'),
    reserve: withReserve ? { t_s: rule.reserve.t_s, p_kw: pCruise } : { t_s: [0, 0], p_kw: [0, 0] } };
  return energyInstr.certify(mission, battery);
}

function rangeClaims(phys, rule) {
  const rows = [];
  const add = (specId, distKm, kind, withReserve, claim) => {
    const spec = M.loadSpec(specId);
    const c = claimAudit(distKm, spec, phys, withReserve, rule);
    const best = typeof c.margin_kwh === 'number' ? c.margin_kwh : c.margin_kwh.best;
    const worst = typeof c.margin_kwh === 'number' ? c.margin_kwh : (c.margin_kwh.worst ?? c.margin_kwh);
    let verdict;
    if (kind === 'existential') {
      verdict = c.verdict === 'REFUTED' ? 'REFUTED' : 'CONSISTENT';
    } else {
      verdict = c.verdict;                       /* universal: the instrument's own three values */
    }
    rows.push({ spec: specId, claim, dist_km: distKm, kind,
      reserve: withReserve ? 'faa-20-min at cruise power' : 'none',
      verdict, instrument_verdict: c.verdict,
      margins_kwh: typeof c.margin_kwh === 'number' ? { worst: c.margin_kwh } : c.margin_kwh,
      note: kind === 'existential'
        ? 'CONSISTENT = some point of the published+assumed boxes achieves the claim; REFUTED = no point does'
        : 'universal guarantee: tested at the WORST corner of the boxes' });
    void best; void worst;
  };
  add('joby-s4', 161, 'existential', true,
    '100 mi range including energy reserves (evtol.news attributing Joby)');
  add('archer-midnight', 161, 'existential', false,
    'up to 100 mi (Archer PR)');
  add('archer-midnight', 96.6, 'universal', false,
    'guaranteed minimum 60 mi in the worst case condition (evtol.news attributing Archer)');
  add('eve-100', 100, 'existential', false,
    'designed for 100 km range (Eve institutional presentation, May 2026)');
  rows.push({ spec: 'beta-alia', verdict: 'NO CLAIM',
    note: 'no published VTOL-variant range claim to audit (336 nm demonstrated is the CTOL variant)' });
  return { rows, caveat: 'claims are audited against the aircraft\'s OWN public numbers plus the literature physics boxes; a REFUTED here means the claim and the public numbers cannot both be right as boxed - assumption-grade boxes (q flags) are stated in the spec packs' };
}

/* dense certified grids for the interactive fleet designer: every slider
   position on the page is one of these precomputed, gate-checked points */
function designerGrids(flights, phys, rule, city, dayDir) {
  const battery = {}, reserve = {};
  for (const id of SPEC_IDS) {
    const spec = M.loadSpec(id);
    battery[id] = [];
    for (let B = 60; B <= 700; B += 20) {
      battery[id].push([B, coverage(flights, withBattery(spec, B), rule, phys)]);
    }
    reserve[id] = [];
    for (let m = 0; m <= 45; m += 3) {
      reserve[id].push([m, coverage(flights, spec, withReserveMinutes(rule, m), phys)]);
    }
  }
  const cc = chargeCurve(city, dayDir, 'beta-alia');
  const charge = [];
  let ci = 0;
  for (let m = 0; m <= 60; m++) {
    while (ci + 1 < cc.curve.length && cc.curve[ci + 1].from_minutes <= m) ci++;
    charge.push(cc.curve.length ? cc.curve[ci].fleetMin : 0);
  }
  return { flights: flights.length, battery, reserve, charge_fleet_by_minute: charge };
}

function run(city, dayDir) {
  dayDir = dayDir || 'day-2026-08-26';
  const phys = M.loadPhysics('kasliwal-2019');
  const rule = M.loadRule(primaryRule(city));   /* the city's jurisdiction rule */
  const flights = dayFlights(city, dayDir);
  return {
    city, dayDir, flights: flights.length,
    what: 'certified thresholds: every number here is proved on BOTH sides of the flip',
    battery_floor: batteryFloors(flights, phys, rule),
    charge_lever: chargeCurve(city, dayDir, 'beta-alia'),
    reserve_price: reservePrice(flights, phys, rule),
    range_claims: rangeClaims(phys, rule),
    designer: designerGrids(flights, phys, rule, city, dayDir),
  };
}

module.exports = { run, bisectLeast, withBattery, withReserveMinutes, coverage, dayFlights };

if (require.main === module) {
  const city = process.argv[2] || 'nyc';
  const res = run(city, process.argv[3]);
  const out = path.join(__dirname, '../data', res.dayDir, city + '.optimize.json');
  fs.writeFileSync(out, JSON.stringify(res, null, 2));
  for (const [id, b] of Object.entries(res.battery_floor)) {
    const t = b.targets;
    console.log(id.padEnd(18) + ' 50%: ' + (t[0.5].kwh ?? '—') + ' kWh · 80%: ' + (t[0.8].kwh ?? '—')
      + ' kWh · 95%: ' + (t[0.95].kwh ?? '—') + ' kWh  (published ' + b.published_box_kwh + ' ' + b.published_q + ')');
  }
  console.log('charge lever (beta-alia):', JSON.stringify(res.charge_lever.curve));
  console.log('reserve price (beta-alia):', JSON.stringify(res.reserve_price.by_reserve_minutes['beta-alia']));
}
