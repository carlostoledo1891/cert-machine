/* extract.js — one pass over an adsb.lol globe_history day tar (stdin),
   emitting per-city trace subsets + counts. apps/skyaudit · cert-machine

   The tar holds one gzipped readsb trace JSON per aircraft per day
   (traces/<last2>/trace_full_<icao>.json; format:
   github.com/wiedehopf/readsb README-json.md). A trace belongs to a city
   when ANY position falls inside its bbox. Two outputs per city:
   <city>.full.jsonl (all in-bbox aircraft; local artifact, gitignored,
   regenerable from the pinned tars) and <city>.heli.jsonl (helicopters —
   ICAO type designator in HELI_TYPES, or emitter category A7 in any trace
   point's aircraft object; committed under ODbL, see LICENSE-DATA).

   Usage: cat day.tar [mlat.tar] | node extract.js <outdir>
   (concatenated tars are fine — the zero-block tail of one archive is
   skipped and parsing continues into the next)                            */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BBOXES = {
  nyc: { latMin: 40.50, latMax: 40.95, lonMin: -74.35, lonMax: -73.65 },
  sp:  { latMin: -23.75, latMax: -23.30, lonMin: -46.95, lonMax: -46.30 },
};

/* ICAO type designators for helicopters plausible over either city
   (RESEARCH.md §2) + A7 category catch-all at trace level */
const HELI_TYPES = new Set([
  'AS50','AS55','AS65','AS32','R22','R44','R66','A109','A119','A139',
  'A169','A189','EC20','EC30','EC35','EC45','EC55','EC25','H160','BK17',
  'S76','S92','S61','S64','S330','B06','B06T','B222','B230','B407','B412',
  'B429','B505','H500','H520','H269','EN28','EN48','H60','MD60',
]);

function isHeli(obj) {
  if (obj.t && HELI_TYPES.has(String(obj.t).toUpperCase())) return true;
  if (Array.isArray(obj.trace)) {
    for (const e of obj.trace) {
      const ac = e && e[8];
      if (ac && typeof ac === 'object' && ac.category === 'A7') return true;
    }
  }
  return false;
}

function citiesOf(obj) {
  const hit = [];
  for (const [name, b] of Object.entries(BBOXES)) {
    for (const e of obj.trace || []) {
      const lat = e && e[1], lon = e && e[2];
      if (typeof lat === 'number' && typeof lon === 'number' &&
          lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax) {
        hit.push(name); break;
      }
    }
  }
  return hit;
}

const outdir = process.argv[2];
if (!outdir) { console.error('usage: cat day.tar | node extract.js <outdir>'); process.exit(2); }
fs.mkdirSync(outdir, { recursive: true });

const streams = {};
for (const city of Object.keys(BBOXES)) {
  streams[city] = {
    full: fs.createWriteStream(path.join(outdir, city + '.full.jsonl')),
    heli: fs.createWriteStream(path.join(outdir, city + '.heli.jsonl')),
  };
}
const stats = {};
for (const city of Object.keys(BBOXES)) {
  stats[city] = { aircraft: 0, helis: 0, points: 0, heliPoints: 0, heliTypes: {} };
}
let entries = 0, traceFiles = 0, parseErrors = 0;

/* ---- minimal streaming ustar reader ---- */
let pending = Buffer.alloc(0);
let need = 512;           // bytes required before the next step can run
let fileRemain = 0;       // content bytes (padded) left to consume
let filePad = 0;
let fileBufs = null;      // collecting content when non-null
let fileName = '';

function headerName(h) {
  const name = h.toString('utf8', 0, 100).replace(/\0.*$/, '');
  const prefix = h.toString('utf8', 345, 500).replace(/\0.*$/, '');
  return prefix ? prefix + '/' + name : name;
}

function onTrace(name, buf) {
  traceFiles++;
  let body = buf;
  if (buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    try { body = zlib.gunzipSync(buf); } catch (e) { parseErrors++; return; }
  }
  let obj;
  try { obj = JSON.parse(body.toString('utf8')); } catch (e) { parseErrors++; return; }
  if (!Array.isArray(obj.trace) || obj.trace.length === 0) return;
  const hit = citiesOf(obj);
  if (hit.length === 0) return;
  const heli = isHeli(obj);
  const line = JSON.stringify(obj) + '\n';
  for (const city of hit) {
    const s = stats[city];
    s.aircraft++; s.points += obj.trace.length;
    streams[city].full.write(line);
    if (heli) {
      s.helis++; s.heliPoints += obj.trace.length;
      const t = (obj.t || 'A7-untyped').toUpperCase();
      s.heliTypes[t] = (s.heliTypes[t] || 0) + 1;
      streams[city].heli.write(line);
    }
  }
}

process.stdin.on('data', (chunk) => {
  pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
  for (;;) {
    if (fileRemain > 0) {
      if (pending.length === 0) return;
      const take = Math.min(fileRemain, pending.length);
      if (fileBufs) fileBufs.push(pending.subarray(0, take));
      pending = pending.subarray(take);
      fileRemain -= take;
      if (fileRemain === 0) {
        if (fileBufs) {
          let content = Buffer.concat(fileBufs);
          content = content.subarray(0, content.length - filePad);
          onTrace(fileName, content);
          fileBufs = null;
        }
        continue;
      }
      return;
    }
    if (pending.length < 512) return;
    const h = pending.subarray(0, 512);
    pending = pending.subarray(512);
    if (h.every((b) => b === 0)) continue;      // zero block: archive tail / split seam
    entries++;
    const size = parseInt(h.toString('utf8', 124, 136).replace(/\0/g, '').trim() || '0', 8) || 0;
    const type = String.fromCharCode(h[156]);
    const name = headerName(h);
    filePad = (512 - (size % 512)) % 512;
    fileRemain = size + filePad;
    const wanted = (type === '0' || type === '\0') && /trace_full_/.test(name) &&
      !/(^|\/)\._/.test(name);
    fileBufs = wanted ? [] : null;
    fileName = name;
    if (fileRemain === 0) continue;
  }
});

process.stdin.on('end', () => {
  const done = Object.values(streams).flatMap((s) => [s.full, s.heli]);
  let left = done.length;
  for (const s of done) s.end(() => { if (--left === 0) report(); });
});

function report() {
  const out = { entries, traceFiles, parseErrors, cities: stats };
  fs.writeFileSync(path.join(outdir, 'extract-stats.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}
