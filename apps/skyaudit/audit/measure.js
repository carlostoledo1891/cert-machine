/* measure.js — the city-decision measurement over extracted heli subsets.
   apps/skyaudit · cert-machine

   A trace is an aircraft's whole day; a FLIGHT PROXY is a trace segment
   split at gaps > 15 min, kept when it spans >= 180 s, has >= 2 airborne
   points (altitude !== "ground"), and touches the city bbox. This is a
   MEASUREMENT heuristic for choosing the flagship city — the certified
   segmentation (Phase 1, battery-gated) replaces it for the audit.

   Usage: node measure.js <outdir>   (reads <city>.heli.jsonl written by
   extract.js; prints a per-city comparison table)                        */
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BBOXES = {
  nyc: { latMin: 40.50, latMax: 40.95, lonMin: -74.35, lonMax: -73.65 },
  sp:  { latMin: -23.75, latMax: -23.30, lonMin: -46.95, lonMax: -46.30 },
};
const GAP_S = 15 * 60, MIN_SPAN_S = 180;

function inBox(b, lat, lon) {
  return typeof lat === 'number' && typeof lon === 'number' &&
    lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax;
}

async function measure(city, file) {
  const b = BBOXES[city];
  const out = { city, aircraft: 0, flights: 0, airborneMin: 0, points: 0, types: {}, regs: new Set() };
  if (!fs.existsSync(file)) return { ...out, regs: 0, missing: true };
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj; try { obj = JSON.parse(line); } catch { continue; }
    out.aircraft++;
    if (obj.r) out.regs.add(obj.r);
    const t = (obj.t || 'A7-untyped').toUpperCase();
    const tr = obj.trace || [];
    out.points += tr.length;
    let seg = [];
    const segments = [];
    let lastTs = null;
    for (const e of tr) {
      const ts = e && e[0];
      if (typeof ts !== 'number') continue;
      if (lastTs !== null && ts - lastTs > GAP_S && seg.length) { segments.push(seg); seg = []; }
      seg.push(e); lastTs = ts;
    }
    if (seg.length) segments.push(seg);
    for (const s of segments) {
      const span = s[s.length - 1][0] - s[0][0];
      const airborne = s.filter((e) => e[3] !== 'ground');
      const touches = s.some((e) => inBox(b, e[1], e[2]));
      if (span >= MIN_SPAN_S && airborne.length >= 2 && touches) {
        out.flights++;
        out.airborneMin += span / 60;
        out.types[t] = (out.types[t] || 0) + 1;
      }
    }
  }
  return { ...out, regs: out.regs.size };
}

(async () => {
  const outdir = process.argv[2];
  if (!outdir) { console.error('usage: node measure.js <outdir>'); process.exit(2); }
  const rows = [];
  for (const city of Object.keys(BBOXES)) {
    rows.push(await measure(city, path.join(outdir, city + '.heli.jsonl')));
  }
  for (const r of rows) {
    r.airborneMin = Math.round(r.airborneMin);
    console.log(`\n== ${r.city.toUpperCase()} ==`);
    if (r.missing) { console.log('  (no heli subset found)'); continue; }
    console.log(`  distinct helicopters : ${r.aircraft} (${r.regs} with registrations)`);
    console.log(`  flight proxies       : ${r.flights}`);
    console.log(`  airborne minutes     : ${r.airborneMin}`);
    console.log(`  trace points         : ${r.points}`);
    const top = Object.entries(r.types).sort((a, z) => z[1] - a[1]).slice(0, 12);
    console.log(`  flights by type      : ${top.map(([t, n]) => `${t}:${n}`).join(' ')}`);
  }
  fs.writeFileSync(path.join(outdir, 'measure.json'), JSON.stringify(rows, null, 2));
})();
