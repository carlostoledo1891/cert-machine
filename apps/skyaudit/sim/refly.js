/* refly.js — RE-FLY THE DAY: the real demand served by a simulated eVTOL
   fleet, with the minimum fleet size PROVED in both directions.
   apps/skyaudit/sim · cert-machine

   THE POOL MODEL, stated: each real flight that is individually CERTIFIED
   for the spec+rule becomes a dispatch request at its historical departure
   time. Serving it occupies one aircraft for the flight's observed
   duration PLUS worst-corner recharge (charge_minutes_full.hi scaled by
   worst-case depth used.hi/usable.lo, capped at full). Repositioning legs
   are NOT modeled and departures are fixed — so the demand intervals are
   FIXED, and minimum fleet = maximum overlap of the extended intervals
   (interval-graph coloring):

     REFUTED at N-1 — pigeonhole: at the witness instant, N extended
       intervals contain the same point, so N-1 aircraft cannot serve them.
       Exact counting, no model beyond the interval definitions.
     CERTIFIED at N — constructive: the greedy schedule IS the witness
       (every leg assigned, no aircraft double-booked; verified exactly).

   Legs the audit could not certify (REFUTED/REFUSED solo) are reported as
   demand OUTSIDE the aircraft's provable envelope — never silently
   dropped. Zero randomness anywhere: the run is deterministic and its
   timeline hash is part of the record.                                    */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

function chargeSeconds(spec, usedHi, usableLo) {
  const box = spec.boxes.charge_minutes_full.v;
  const depth = Math.min(1, usedHi / usableLo);
  return Math.ceil(box[1] * 60 * depth);
}

/* max overlap of half-open intervals [s, e), with witness instant */
function sweepMax(iv) {
  const ev = [];
  for (const [s, e] of iv) { ev.push([s, +1]); ev.push([e, -1]); }
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);        /* end (-1) before start (+1) at ties */
  let cur = 0, max = 0, at = null;
  for (const [t, d] of ev) { cur += d; if (cur > max) { max = cur; at = t; } }
  return { max, at };
}

/* greedy interval-coloring: earliest-free aircraft serves each leg */
function greedy(legs) {
  const sorted = [...legs].sort((a, b) => a.s - b.s || a.e - b.e);
  const free = [];                                       /* free-at time per aircraft */
  const assign = [];
  for (const l of sorted) {
    let k = -1;
    for (let i = 0; i < free.length; i++) {
      if (free[i] <= l.s && (k === -1 || free[i] < free[k])) k = i;
    }
    if (k === -1) { k = free.length; free.push(0); }
    free[k] = l.e;
    assign.push({ id: l.id, aircraft: k, s: l.s, e: l.e });
  }
  return { fleet: free.length, assign };
}

/* exact verification: no aircraft double-booked, every leg assigned */
function verifySchedule(legs, assign) {
  if (assign.length !== legs.length) return false;
  const by = new Map();
  for (const a of assign) { if (!by.has(a.aircraft)) by.set(a.aircraft, []); by.get(a.aircraft).push(a); }
  for (const list of by.values()) {
    list.sort((x, y) => x.s - y.s);
    for (let i = 1; i < list.length; i++) if (list[i].s < list[i - 1].e) return false;
  }
  return true;
}

const TZ = { nyc: ['America/New_York', 'ET'], sp: ['America/Sao_Paulo', 'BRT'] };

function reflyKey(rows, spec, city) {
  const [tz, tzLabel] = TZ[city] || TZ.nyc;
  const legs = [], outside = { REFUTED: 0, REFUSED: 0 };
  for (const r of rows) {
    if (r.verdict !== 'CERTIFIED') { outside[r.verdict]++; continue; }
    const cs = chargeSeconds(spec, r.used_kwh[1], r.usable_kwh[0]);
    legs.push({ id: r.id, s: r.flight.tStart, e: r.flight.tStart + r.flight.durationS + cs, chargeS: cs });
  }
  if (legs.length === 0) return { certifiedLegs: 0, outside, fleetMin: 0 };
  const sweep = sweepMax(legs.map((l) => [l.s, l.e]));
  const g = greedy(legs);
  if (g.fleet !== sweep.max) throw new Error('refly: greedy ' + g.fleet + ' != sweep ' + sweep.max + ' — interval-coloring invariant broken');
  if (!verifySchedule(legs, g.assign)) throw new Error('refly: schedule failed exact verification');
  const hash = crypto.createHash('sha256').update(JSON.stringify(g.assign)).digest('hex');
  return { certifiedLegs: legs.length, outside, fleetMin: g.fleet,
    witnessInstant: sweep.at,
    witnessLocal: new Date(sweep.at * 1000).toLocaleTimeString('en-US', { timeZone: tz, hour12: false }) + ' ' + tzLabel,
    statement: { refuted: (g.fleet - 1) + ' aircraft REFUTED by pigeonhole at the witness instant',
      certified: g.fleet + ' aircraft CERTIFIED by the verified greedy schedule (pool model)' },
    timelineHash: hash };
}

function loadCertRows(city, dayDir) {
  const p = path.join(__dirname, '../data', dayDir, city + '.certs.jsonl');
  const raw = fs.existsSync(p) ? fs.readFileSync(p, 'utf8')
    : zlib.gunzipSync(fs.readFileSync(p + '.gz')).toString('utf8');
  return raw.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}

function runCity(city, dayDir) {
  dayDir = dayDir || 'day-2026-08-26';
  const rows = loadCertRows(city, dayDir);
  const specs = {};
  for (const id of ['joby-s4', 'archer-midnight', 'beta-alia', 'eve-100']) {
    specs[id] = JSON.parse(fs.readFileSync(path.join(__dirname, '../scenario/specs', id + '.json'), 'utf8'));
  }
  const out = { city, dayDir, model: 'pool (fixed departures, no repositioning) — fleetMin is exact IN THIS MODEL; the REFUTED direction needs no model beyond the interval definitions', keys: {} };
  const byKey = new Map();
  for (const r of rows) {
    const k = r.spec + '|' + r.rule;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(r);
  }
  for (const [k, list] of byKey) out.keys[k] = reflyKey(list, specs[k.split('|')[0]], city);
  return out;
}

module.exports = { chargeSeconds, sweepMax, greedy, verifySchedule, reflyKey, runCity };

if (require.main === module) {
  const city = process.argv[2] || 'nyc';
  const res = runCity(city, process.argv[3]);
  const out = path.join(__dirname, '../data', res.dayDir, city + '.refly.json');
  fs.writeFileSync(out, JSON.stringify(res, null, 2));
  for (const [k, v] of Object.entries(res.keys)) {
    console.log(k.padEnd(38) + ' legs ' + String(v.certifiedLegs).padStart(3) +
      '  fleetMin ' + String(v.fleetMin).padStart(2) + (v.witnessLocal ? '  witness ' + v.witnessLocal : ''));
  }
}
