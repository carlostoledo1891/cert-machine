/* corpus.js — the one loader for a city's helicopter corpus.
   apps/skyaudit · cert-machine

   The committed corpus is the RAW extraction: an aircraft tracked by both
   ADS-B (prod tar) and MLAT (mlatonly tar) appears as TWO lines for one
   icao — honest bytes, inflated counts. Auditing dedupes here, in one
   place: per icao keep the RICHEST trace (most points; the MLAT scrap is
   a subset view of the same day). Counting rule: public counts use the
   DEDUPED aircraft number, stated as "unique aircraft".                   */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* the strict rotorcraft filter (PINS known_data_quirks): an aircraft with
   a NON-rotorcraft type designator is excluded even when its emitter
   category squawks A7 — an A320 with a miscoded category is not a
   helicopter. Untyped A7 aircraft stay in. One definition, all consumers. */
const HELI_TYPES = new Set([
  'AS50','AS55','AS65','AS32','R22','R44','R66','A109','A119','A139',
  'A169','A189','EC20','EC30','EC35','EC45','EC55','EC25','H160','BK17',
  'S76','S92','S61','S64','S330','B06','B06T','B222','B230','B407','B412',
  'B429','B505','H500','H520','H269','EN28','EN48','H60','MD60','EXPL','S108',
]);
function isHeliStrict(obj) {
  if (obj.t) return HELI_TYPES.has(String(obj.t).toUpperCase());
  return true;
}

function loadHeli(city, dayDir) {
  const p = path.join(__dirname, '../data', dayDir || 'day-2026-08-26', city + '.heli.jsonl');
  const raw = fs.existsSync(p) ? fs.readFileSync(p, 'utf8')
    : zlib.gunzipSync(fs.readFileSync(p + '.gz')).toString('utf8');
  const best = new Map();
  let lines = 0;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    lines++;
    const obj = JSON.parse(line);
    const prev = best.get(obj.icao);
    if (!prev || (obj.trace || []).length > (prev.trace || []).length) best.set(obj.icao, obj);
  }
  return { aircraft: [...best.values()], rawLines: lines, unique: best.size };
}

module.exports = { loadHeli, isHeliStrict, HELI_TYPES };
