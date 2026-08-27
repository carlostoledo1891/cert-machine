/* replay-bundle.js — build the client replay JSON from the pinned corpus
   + the day's certificates. apps/skyaudit · cert-machine

   For each audited flight: a downsampled track (>= 4 s cadence, 5-decimal
   coords ~1 m) with times relative to the bundle's t0, its 8 verdicts
   (C/R/F per spec|rule), and the enclosure numbers the panel draws
   (usable / used / reserve intervals, margins, witness strings for
   REFUTED). Derived artifact — regenerable, not committed.

   Usage: node replay-bundle.js <city> [dayDir]                            */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { segmentTrace, parsePoints } = require('./flights.js');

const city = process.argv[2] || 'nyc';
const dayDir = process.argv[3] || 'day-2026-08-26';
const dataDir = path.join(__dirname, '../data', dayDir);
const readMaybeGz = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8')
  : zlib.gunzipSync(fs.readFileSync(p + '.gz')).toString('utf8');

/* certificates, grouped by flight id */
const byFlight = new Map();
for (const line of readMaybeGz(path.join(dataDir, city + '.certs.jsonl')).split('\n')) {
  if (!line.trim()) continue;
  const r = JSON.parse(line);
  if (!byFlight.has(r.id)) byFlight.set(r.id, { meta: r, rows: {} });
  byFlight.get(r.id).rows[r.spec + '|' + r.rule] = r;
}

/* raw traces for the tracks — the SAME deduped view certify-day audits */
const { loadHeli } = require('./corpus.js');
const traces = new Map();
for (const obj of loadHeli(city, dayDir).aircraft) traces.set(obj.icao, obj);

const V = { CERTIFIED: 'C', REFUTED: 'R', REFUSED: 'F' };
const r1 = (x) => Math.round(x * 10) / 10;
const flights = [];
let t0 = Infinity, t1 = -Infinity;

for (const [id, { meta, rows }] of byFlight) {
  const icao = meta.icao;
  const obj = traces.get(icao);
  if (!obj) continue;
  const fl = segmentTrace(obj);
  const idx = Number(id.split(':')[1]);
  const f = fl[idx];
  if (!f || f.tStart !== meta.flight.tStart) { console.error('bundle: id drift on ' + id); process.exit(1); }
  /* the track: airborne points of this flight window, downsampled */
  const pts = parsePoints(obj).filter((p) => !p.ground && p.t >= f.tStart && p.t <= f.tEnd);
  const track = [];
  let last = -Infinity;
  for (const p of pts) {
    if (p.t - last < 4) continue;
    last = p.t;
    track.push([p.t, +p.lat.toFixed(5), +p.lon.toFixed(5), Math.round(p.alt)]);
  }
  if (track.length < 2) continue;
  t0 = Math.min(t0, track[0][0]); t1 = Math.max(t1, track[track.length - 1][0]);
  const verdicts = {}, enc = {};
  for (const [k, row] of Object.entries(rows)) {
    verdicts[k] = V[row.verdict];
    enc[k] = { u: row.usable_kwh.map(r1), e: row.used_kwh.map(r1), r: row.reserve_kwh.map(r1),
      m: typeof row.margin_kwh === 'number' ? r1(row.margin_kwh) : { w: r1(row.margin_kwh.worst), b: r1(row.margin_kwh.best) },
      ...(row.witness ? { wit: row.witness.margin.length > 24 ? row.witness.margin.slice(0, 24) + '…' : row.witness.margin } : {}) };
  }
  flights.push({ id, icao, reg: meta.reg, type: meta.type,
    dur: meta.flight.durationS, km: meta.flight.pathKm, alt: meta.flight.maxAltFt,
    trunc: [meta.flight.truncatedStart, meta.flight.truncatedEnd],
    verdicts, enc, track });
}

for (const f of flights) f.track = f.track.map((p) => [p[0] - t0, p[1], p[2], p[3]]);
const bundle = { city, day: dayDir.replace('day-', ''), t0, t1, span: t1 - t0,
  specs: ['joby-s4', 'archer-midnight', 'beta-alia', 'eve-100'],
  rules: ['faa-sfar-vfr', 'easa-final-reserve'], flights };
const out = path.join(dataDir, city + '.replay.json');
fs.writeFileSync(out, JSON.stringify(bundle));
console.log('replay bundle: ' + flights.length + ' flights, ' +
  flights.reduce((n, f) => n + f.track.length, 0) + ' track points, ' +
  (fs.statSync(out).size / 1e6).toFixed(1) + ' MB -> ' + out);
