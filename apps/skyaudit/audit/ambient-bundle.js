/* ambient-bundle.js — the living-city layer: ALL non-helicopter traffic
   (every JFK/LGA/EWR airliner in the bbox), clipped and heavily
   downsampled, rendered dim beneath the helicopters. Decor, not data:
   non-pickable, no verdicts, no identities shipped. apps/skyaudit

   Input: data/<day>/<city>.full.jsonl (LOCAL artifact — regenerable
   byte-for-byte from the PINS.json-pinned tars via extract.js). If it is
   absent the build keeps any previously emitted bundle and moves on.

   Usage: node ambient-bundle.js <city> [dayDir] -> <city>.ambient.json   */
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { isHeliStrict } = require('./corpus.js');

const BBOX = { nyc: [40.45, 41.0, -74.4, -73.6], sp: [-23.8, -23.25, -47.0, -46.25] };
const STEP_S = 60, GAP_S = 900, PREC = 4;

async function run(city, dayDir) {
  dayDir = dayDir || 'day-2026-08-26';
  const src = path.join(__dirname, '../data', dayDir, city + '.full.jsonl');
  const out = path.join(__dirname, '../data', dayDir, city + '.ambient.json');
  if (!fs.existsSync(src)) {
    console.log('ambient: ' + src + ' absent (regenerable from pinned tars) — keeping any previous bundle');
    return null;
  }
  const replay = JSON.parse(fs.readFileSync(path.join(__dirname, '../data', dayDir, city + '.replay.json'), 'utf8'));
  const [latMin, latMax, lonMin, lonMax] = BBOX[city];
  const tracks = [];
  let points = 0, aircraft = 0;
  const rl = readline.createInterface({ input: fs.createReadStream(src), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj; try { obj = JSON.parse(line); } catch { continue; }
    if (isHeliStrict(obj) && obj.t) continue;         /* typed helicopters are the foreground */
    if (!obj.t) continue;                             /* untyped stay in the heli pipeline */
    const base = obj.timestamp || 0;
    let cur = [], last = -Infinity, lastT = -Infinity;
    const flush = () => { if (cur.length >= 2) { tracks.push(cur); points += cur.length; } cur = []; };
    for (const e of obj.trace || []) {
      if (!Array.isArray(e) || typeof e[1] !== 'number') continue;
      const t = base + e[0], lat = e[1], lon = e[2];
      if (lat < latMin || lat > latMax || lon < lonMin || lon > lonMax) { flush(); lastT = t; continue; }
      if (t - lastT > GAP_S) flush();
      lastT = t;
      if (t - last < STEP_S) continue;
      last = t;
      cur.push([Math.round(t - replay.t0), +lat.toFixed(PREC), +lon.toFixed(PREC)]);
    }
    flush();
    aircraft++;
  }
  const bundle = { city, day: replay.day, t0: replay.t0, tracks };
  fs.writeFileSync(out, JSON.stringify(bundle));
  console.log('ambient: ' + aircraft + ' aircraft, ' + tracks.length + ' track segments, ' +
    points + ' points, ' + (fs.statSync(out).size / 1e6).toFixed(1) + ' MB');
  return bundle;
}

module.exports = { run };
if (require.main === module) run(process.argv[2] || 'nyc', process.argv[3]);
