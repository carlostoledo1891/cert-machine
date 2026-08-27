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

module.exports = { loadHeli };
