/* stories.js — THE DAY: the human-readable shape of the pinned day.
   apps/skyaudit · cert-machine

   Leaderboard, records, the hourly rhythm, an INFERRED operation mix,
   and measured outliers. Classification heuristics are stated in the
   output and labeled INFERRED on the page — measurements, never
   judgments of anyone's mission.

   Usage: node stories.js <city> [dayDir] -> data/<day>/<city>.stories.json */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadHeli, isHeliStrict } = require('./corpus.js');
const { loadRegistry } = require('./registry.js');
const { segmentTrace } = require('./flights.js');

const TZ = { nyc: 'America/New_York', sp: 'America/Sao_Paulo' };

function classify(f, reg, type) {
  if (/PD$/.test(reg || '') || type === 'H60') return 'patrol/military';
  if (f.gcKm < 0.12 * f.pathKm && f.pathKm > 8) return 'tour loop';
  if (f.pathKm < 45 && f.gcKm / Math.max(1, f.pathKm) > 0.6) return 'shuttle hop';
  return 'charter/other';
}

function run(city, dayDir) {
  dayDir = dayDir || 'day-2026-08-26';
  const tz = TZ[city] || TZ.nyc;
  const registry = loadRegistry();
  const perAircraft = new Map();
  const all = [];
  for (const obj of loadHeli(city, dayDir).aircraft) {
    if (!isHeliStrict(obj)) continue;
    let fl; try { fl = segmentTrace(obj); } catch { continue; }
    if (!fl.length) continue;
    /* authoritative names from the pinned registries: FAA publishes the
       REGISTRANT ("registered to"), ANAC the operador — labeled per source */
    const hit = registry.lookup(obj);
    const name = hit ? (hit.registeredTo || (hit.operadores || [])[0] || null) : null;
    const a = { icao: obj.icao, reg: obj.r || obj.icao, type: obj.t || 'untyped',
      name, nameKind: name ? hit.nameKind : null,
      regType: hit ? (hit.typeDesignator || hit.model || null) : null,
      legs: fl.length, airborneMin: 0, km: 0 };
    for (const f of fl) {
      a.airborneMin += f.durationS / 60; a.km += f.pathKm;
      all.push({ ...f, reg: a.reg, type: a.type, ops: classify(f, obj.r, obj.t) });
    }
    perAircraft.set(obj.icao, a);
  }
  const board = [...perAircraft.values()].sort((x, y) => y.legs - x.legs || y.airborneMin - x.airborneMin)
    .slice(0, 5).map((a) => ({ ...a, airborneMin: Math.round(a.airborneMin), km: Math.round(a.km) }));

  const localHour = (t) => +new Date(t * 1000).toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
  const hourly = Array(24).fill(0);
  for (const f of all) {
    const h0 = localHour(f.tStart), h1 = localHour(f.tEnd);
    for (let h = h0; ; h = (h + 1) % 24) { hourly[h]++; if (h === h1 % 24) break; }
  }
  const peak = hourly.indexOf(Math.max(...hourly));

  const nameOf = new Map([...perAircraft.values()].map((a) => [a.reg, a.name]));
  const rec = (arr, key, fmt) => {
    const f = arr.reduce((a, b) => (key(b) > key(a) ? b : a));
    return { reg: f.reg, type: f.type, name: nameOf.get(f.reg) || null, value: fmt(f), ops: f.ops };
  };
  const records = {
    longest_km: rec(all, (f) => f.pathKm, (f) => Math.round(f.pathKm) + ' km'),
    longest_min: rec(all, (f) => f.durationS, (f) => Math.round(f.durationS / 60) + ' min'),
    highest_ft: rec(all, (f) => f.maxAltFt, (f) => f.maxAltFt + ' ft'),
    fastest_kt: rec(all.filter((f) => f.medianGsKt), (f) => f.medianGsKt || 0, (f) => Math.round(f.medianGsKt) + ' kt median'),
  };

  const mix = {};
  for (const f of all) mix[f.ops] = (mix[f.ops] || 0) + 1;

  const detours = all.filter((f) => f.gcKm > 2 && f.ops !== 'tour loop')
    .map((f) => ({ reg: f.reg, type: f.type, factor: +(f.pathKm / f.gcKm).toFixed(1), km: Math.round(f.pathKm) }))
    .sort((a, b) => b.factor - a.factor).slice(0, 3);
  const dwellers = all.filter((f) => f.durationS > 600 && f.dwellS != null)
    .map((f) => ({ reg: f.reg, type: f.type, dwellPct: Math.round(f.dwellS / f.durationS * 100), min: Math.round(f.durationS / 60) }))
    .sort((a, b) => b.dwellPct - a.dwellPct).slice(0, 3);

  return { city, dayDir, flights: all.length, aircraft: perAircraft.size,
    names_source: 'FAA Releasable Aircraft Database (registrant — "registered to", not necessarily the operator) / ANAC RAB (operador); pinned in data/registry/REGISTRY-PINS.json',
    heuristics: 'INFERRED ops classes: patrol/military = reg ..PD or type H60; tour loop = returns near start (gc < 12% of path) over >8 km; shuttle hop = <45 km mostly-direct; rest = charter/other. Detour factor = flown/direct distance; dwell = time under 10 kt.',
    leaderboard: board, hourly, peak_hour_local: peak, records, ops_mix: mix,
    outliers: { detours, dwellers } };
}

module.exports = { run, classify };

if (require.main === module) {
  const res = run(process.argv[2] || 'nyc', process.argv[3]);
  fs.writeFileSync(path.join(__dirname, '../data', res.dayDir, res.city + '.stories.json'),
    JSON.stringify(res, null, 2));
  console.log(JSON.stringify({ leaderboard: res.leaderboard.slice(0, 3), records: res.records,
    ops_mix: res.ops_mix, peak: res.peak_hour_local, outliers: res.outliers }, null, 1));
}
