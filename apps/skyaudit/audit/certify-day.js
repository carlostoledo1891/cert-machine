/* certify-day.js — run the audit over a pinned day corpus: every observed
   helicopter flight x every spec pack x every rule pack -> certificates.
   apps/skyaudit · cert-machine

   Usage: node certify-day.js <city> [<dayDir>]
   Reads  data/<dayDir>/<city>.heli.jsonl[.gz]  (default day-2026-08-26),
   writes <city>.certs.jsonl + <city>.audit-summary.json beside it.

   The strict helicopter filter (PINS.json known_data_quirks): an aircraft
   with a type designator NOT in the rotorcraft set is excluded even if a
   trace point squawks emitter category A7 — an A320 with a miscoded
   category is not a helicopter. Untyped A7 aircraft stay in.              */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { segmentTrace } = require('./flights.js');
const M = require('./mission.js');

const HELI_TYPES = new Set([
  'AS50','AS55','AS65','AS32','R22','R44','R66','A109','A119','A139',
  'A169','A189','EC20','EC30','EC35','EC45','EC55','EC25','H160','BK17',
  'S76','S92','S61','S64','S330','B06','B06T','B222','B230','B407','B412',
  'B429','B505','H500','H520','H269','EN28','EN48','H60','MD60','EXPL','S108',
]);
function isHeliStrict(obj) {
  if (obj.t) return HELI_TYPES.has(String(obj.t).toUpperCase());
  return true;   /* untyped rows reached the corpus via category A7 */
}

const { loadHeli } = require('./corpus.js');

const city = process.argv[2];
if (!city) { console.error('usage: node certify-day.js <city> [dayDir]'); process.exit(2); }
const dayDir = process.argv[3] || 'day-2026-08-26';
const dataDir = path.join(__dirname, '../data', dayDir);
const corpus = loadHeli(city, dayDir);

const phys = M.loadPhysics('kasliwal-2019');
const specs = ['joby-s4', 'archer-midnight', 'beta-alia', 'eve-100'].map(M.loadSpec);
const rules = ['faa-sfar-vfr', 'easa-final-reserve'].map(M.loadRule);

const out = fs.createWriteStream(path.join(dataDir, city + '.certs.jsonl'));
const summary = { city, dayDir, rawLines: corpus.rawLines, uniqueAircraft: corpus.unique,
  aircraft: 0, excludedMiscodedA7: 0, flights: 0, rows: 0,
  bySpecRule: {}, flightStats: { totalPathKm: 0, totalAirborneMin: 0, truncated: 0 } };
for (const s of specs) for (const r of rules) {
  summary.bySpecRule[s.id + '|' + r.id] = { CERTIFIED: 0, REFUTED: 0, REFUSED: 0 };
}

for (const obj of corpus.aircraft) {
  if (!isHeliStrict(obj)) { summary.excludedMiscodedA7++; continue; }
  summary.aircraft++;
  let flights;
  try { flights = segmentTrace(obj); } catch (e) {
    console.error('segmentation refused ' + obj.icao + ': ' + e.message); continue;
  }
  flights.forEach((f, i) => {
    summary.flights++;
    summary.flightStats.totalPathKm += f.pathKm;
    summary.flightStats.totalAirborneMin += f.durationS / 60;
    if (f.truncatedStart || f.truncatedEnd) summary.flightStats.truncated++;
    const id = obj.icao + ':' + i + ':' + f.tStart;
    for (const s of specs) for (const r of rules) {
      const row = M.auditFlight(f, s, r, phys);
      summary.bySpecRule[s.id + '|' + r.id][row.verdict]++;
      summary.rows++;
      out.write(JSON.stringify({ id, icao: obj.icao, reg: obj.r || null, type: obj.t || 'A7-untyped',
        flight: { tStart: f.tStart, durationS: f.durationS, pathKm: +f.pathKm.toFixed(2),
          gcKm: +f.gcKm.toFixed(2), maxAltFt: f.maxAltFt, truncatedStart: f.truncatedStart,
          truncatedEnd: f.truncatedEnd, gapCount: f.gapCount },
        ...row }) + '\n');
    }
  });
}

out.end(() => {
  summary.flightStats.totalPathKm = Math.round(summary.flightStats.totalPathKm);
  summary.flightStats.totalAirborneMin = Math.round(summary.flightStats.totalAirborneMin);
  fs.writeFileSync(path.join(dataDir, city + '.audit-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
});
