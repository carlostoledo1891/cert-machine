/* economics.js — THE ELECTRIC BILL: what this real day burned, and what
   the provably-electric subset would have drawn instead. apps/skyaudit

   Fuel side: per-type burn boxes (scenario/fuel-rates.json, class
   estimates q:E) x observed durations -> liters, dollars, CO2 as
   INTERVALS. Electric side: the E-FLYABLE subset's energy comes from the
   CERTIFIED enclosures themselves (used_kwh of the beta-alia|faa rows) —
   the one place the comparison is decided, not projected. All interval
   arithmetic is monotone products/sums on box endpoints.

   Usage: node economics.js <city> [dayDir] -> data/<day>/<city>.economics.json */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const RATES = JSON.parse(fs.readFileSync(path.join(__dirname, '../scenario/fuel-rates.json'), 'utf8'));

function burnBox(type) {
  return RATES.burn_lph[String(type || '').toUpperCase()] || RATES.burn_lph._default;
}
const mul = (a, b) => [a[0] * b[0], a[1] * b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];

function loadRows(city, dayDir) {
  const p = path.join(__dirname, '../data', dayDir, city + '.certs.jsonl');
  const raw = fs.existsSync(p) ? fs.readFileSync(p, 'utf8')
    : zlib.gunzipSync(fs.readFileSync(p + '.gz')).toString('utf8');
  return raw.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}

function run(city, dayDir) {
  dayDir = dayDir || 'day-2026-08-26';
  /* one row per flight: the beta-alia|faa slice covers every flight once */
  const rows = loadRows(city, dayDir).filter((r) => r.spec === 'beta-alia' && r.rule === require('./corpus.js').primaryRule(city));
  let liters = [0, 0], eKwh = [0, 0], eLiters = [0, 0];
  const byType = {};
  let eFlights = 0, defaultTyped = 0;
  for (const r of rows) {
    const b = burnBox(r.type);
    if (b === RATES.burn_lph._default) defaultTyped++;
    const h = [r.flight.durationS / 3600, r.flight.durationS / 3600];
    const L = mul(b, h);
    liters = add(liters, L);
    const t = String(r.type).toUpperCase();
    byType[t] = add(byType[t] || [0, 0], L);
    if (r.verdict === 'CERTIFIED') { eFlights++; eKwh = add(eKwh, r.used_kwh); eLiters = add(eLiters, L); }
  }
  const usd = mul(liters, RATES.jet_a.usd_per_liter);
  const co2t = mul(liters, RATES.jet_a.co2_kg_per_liter).map((x) => x / 1000);
  const eUsd = mul(eKwh, RATES.electricity.usd_per_kwh);
  const topTypes = Object.entries(byType).sort((a, z) => z[1][1] - a[1][1]).slice(0, 6)
    .map(([t, L]) => ({ type: t, liters: L.map(Math.round) }));
  return {
    city, dayDir, flights: rows.length, defaultTyped,
    what: 'THE ELECTRIC BILL — fuel from class burn boxes (q:E, stated), electric from the CERTIFIED enclosures',
    fuel: { liters: liters.map(Math.round), usd: usd.map(Math.round), co2_tonnes: co2t.map((x) => +x.toFixed(1)), topTypes },
    electric_subset: { flights: eFlights, spec: 'beta-alia|' + require('./corpus.js').primaryRule(city),
      kwh: eKwh.map(Math.round), usd: eUsd.map(Math.round),
      same_flights_fuel: { liters: eLiters.map(Math.round),
        usd: mul(eLiters, RATES.jet_a.usd_per_liter).map(Math.round),
        co2_tonnes: mul(eLiters, RATES.jet_a.co2_kg_per_liter).map((x) => +(x / 1000).toFixed(1)) },
      note: 'energy is the certified used-enclosure sum of the E-FLYABLE flights — decided, not projected; same_flights_fuel is the apples-to-apples fuel bill of those SAME flights' },
  };
}

module.exports = { run, burnBox, mul, add };

if (require.main === module) {
  const res = run(process.argv[2] || 'nyc', process.argv[3]);
  fs.writeFileSync(path.join(__dirname, '../data', res.dayDir, res.city + '.economics.json'),
    JSON.stringify(res, null, 2));
  console.log(JSON.stringify({ fuel: res.fuel, electric: res.electric_subset }, null, 1));
}
