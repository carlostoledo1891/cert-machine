/* registry.js — authoritative aircraft identity: the civil registries.
   apps/skyaudit · cert-machine

   Two open datasets, pinned by sha256 + date in REGISTRY-PINS.json:
     FAA Releasable Aircraft Database (US, public domain) — joined by
       Mode S hex (primary) and N-number (secondary); MASTER row +
       ACFTREF model row give model, TYPE-ACFT code ('6' = rotorcraft)
       and the REGISTRANT name (the FAA publishes the registrant, not
       the operator — the page must label it "registered to").
     ANAC RAB dados_aeronaves.csv (Brazil, open data) — joined by
       registration mark (dash stripped); CD_CLS ('H…' = helicopter),
       CD_TIPO_ICAO (authoritative type designator), OPERADORES and
       PROPRIETARIOS names.

   The raw datasets are LOCAL (data/registry/raw/, gitignored, re-
   fetchable + hash-verifiable). What ships is the EXTRACT: only the
   rows joining this repo's committed corpora, only the fields used —
   data/registry/<city>.<src>.json, sha-pinned. loadRegistry() verifies
   the extract bytes against the pin and REFUSES on drift.

   usage: node registry.js build   (needs the raw files present)
          node registry.js verify  (extracts against their pins)        */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const DATA = path.join(__dirname, '../data');
const DIR = path.join(DATA, 'registry');
const RAW = path.join(DIR, 'raw');
const PINS_PATH = path.join(DIR, 'REGISTRY-PINS.json');

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/* ---- corpus keys: every (icao, reg) in a city's committed heli corpus ---- */
function corpusKeys(city, dayDir) {
  const p = path.join(DATA, dayDir || 'day-2026-08-26', city + '.heli.jsonl');
  const raw = fs.existsSync(p) ? fs.readFileSync(p, 'utf8')
    : zlib.gunzipSync(fs.readFileSync(p + '.gz')).toString('utf8');
  const keys = new Map(); /* icao -> reg|null (icao is unique per aircraft) */
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const o = JSON.parse(line);
    if (!keys.has(o.icao) || (keys.get(o.icao) == null && o.r)) keys.set(o.icao, o.r || null);
  }
  return keys;
}

/* ---- FAA: stream MASTER.txt for our hexes/N-numbers, join ACFTREF ---- */
function buildFaa(keys) {
  const wantHex = new Set([...keys.keys()].map((h) => h.toUpperCase()));
  const wantN = new Set([...keys.values()].filter((r) => r && /^N/.test(r)).map((r) => r.slice(1).toUpperCase()));
  const master = fs.readFileSync(path.join(RAW, 'MASTER.txt'), 'latin1').split('\n');
  const hits = [];
  for (let i = 1; i < master.length; i++) {
    const f = master[i].split(',');
    if (f.length < 34) continue;
    const nnum = f[0].trim(), hex = f[33].trim().toUpperCase();
    if (!wantHex.has(hex) && !wantN.has(nnum)) continue;
    hits.push({ nnum, hex, mfrMdl: f[2].trim(), registrant: f[6].trim(), typeAcftMaster: f[18].trim() });
  }
  const wantCodes = new Set(hits.map((h) => h.mfrMdl));
  const ref = new Map();
  for (const line of fs.readFileSync(path.join(RAW, 'ACFTREF.txt'), 'latin1').split('\n')) {
    const f = line.split(',');
    if (f.length < 5 || !wantCodes.has(f[0].trim())) continue;
    ref.set(f[0].trim(), { mfr: f[1].trim(), model: f[2].trim(), typeAcft: f[3].trim() });
  }
  const rows = {};
  for (const h of hits) {
    const r = ref.get(h.mfrMdl) || {};
    const typeAcft = r.typeAcft || h.typeAcftMaster;
    rows['N' + h.nnum] = {
      reg: 'N' + h.nnum, icaoHex: h.hex.toLowerCase(),
      registeredTo: h.registrant, nameKind: 'registrant',
      mfr: r.mfr || null, model: r.model || null,
      typeAcft, rotorcraft: typeAcft === '6',
      typeConflict: r.typeAcft && h.typeAcftMaster && r.typeAcft !== h.typeAcftMaster ? { acftref: r.typeAcft, master: h.typeAcftMaster } : undefined,
    };
  }
  return rows;
}

/* ---- ANAC: quoted-semicolon CSV (fields hold JSON with ; and "") ---- */
function csvSplit(line) {
  const out = []; let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ';') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
function names(jsonArr) {
  try { return JSON.parse(jsonArr).map((o) => o.NOME).filter(Boolean); } catch { return []; }
}
function buildRab(keys) {
  const wantMark = new Map(); /* dashless mark -> original reg */
  for (const r of keys.values()) if (r && !/^N/.test(r)) wantMark.set(r.replace(/-/g, '').toUpperCase(), r);
  const lines = fs.readFileSync(path.join(RAW, 'dados_aeronaves.csv'), 'utf8').split('\n');
  const updated = (lines[0].match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
  const header = csvSplit(lines[1]);
  const col = (n) => header.findIndex((h) => h.replace(/^﻿/, '') === n);
  const iMark = col('MARCAS'), iOp = col('OPERADORES'), iProp = col('PROPRIETARIOS'),
    iCls = col('CD_CLS'), iIcaoT = col('CD_TIPO_ICAO'), iModel = col('DS_MODELO'), iMfr = col('NM_FABRICANTE');
  const rows = {};
  for (let i = 2; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const f = csvSplit(lines[i]);
    const mark = (f[iMark] || '').trim().toUpperCase();
    if (!wantMark.has(mark)) continue;
    const cls = (f[iCls] || '').trim();
    rows[wantMark.get(mark)] = {
      reg: wantMark.get(mark), mark,
      operadores: names(f[iOp]), proprietarios: names(f[iProp]), nameKind: 'operador',
      mfr: (f[iMfr] || '').trim() || null, model: (f[iModel] || '').trim() || null,
      typeDesignator: (f[iIcaoT] || '').trim() || null, cls,
      rotorcraft: cls.charAt(0) === 'H',
    };
  }
  return { rows, updated };
}

/* ---- build: deterministic extracts + pins ---- */
function build(dayDir) {
  const cities = ['nyc', 'sp'];
  const pins = fs.existsSync(PINS_PATH) ? JSON.parse(fs.readFileSync(PINS_PATH, 'utf8')) : {};
  const out = {};
  for (const city of cities) {
    const keys = corpusKeys(city, dayDir);
    const faa = buildFaa(keys);
    const { rows: rab, updated } = buildRab(keys);
    /* coverage closure: every corpus aircraft is matched or listed unmatched */
    const matched = new Set(), unmatched = [];
    for (const [icao, reg] of keys) {
      const hit = (reg && (faa[reg] || rab[reg])) || Object.values(faa).find((r) => r.icaoHex === icao);
      if (hit) matched.add(icao); else unmatched.push({ icao, reg });
    }
    unmatched.sort((a, b) => a.icao.localeCompare(b.icao));
    const extract = {
      what: 'SkyAudit registry extract — only corpus-joined rows, only used fields',
      city, dayDir: dayDir || 'day-2026-08-26',
      sources: { faa: 'FAA Releasable Aircraft Database (public domain)', rab: 'ANAC RAB dados_aeronaves.csv (open data)' },
      rab_updated: updated,
      counts: { corpus: keys.size, matched: matched.size, unmatched: unmatched.length },
      unmatched,
      faa: Object.fromEntries(Object.entries(faa).sort()),
      rab: Object.fromEntries(Object.entries(rab).sort()),
    };
    const file = path.join(DIR, city + '.registry.json');
    const bytes = JSON.stringify(extract, null, 1) + '\n';
    fs.writeFileSync(file, bytes);
    out[city] = { file: path.basename(file), sha256: sha256(bytes), counts: extract.counts };
    console.log(city + ': corpus ' + keys.size + ' · matched ' + matched.size + ' · unmatched ' + unmatched.length + ' · sha ' + out[city].sha256.slice(0, 12));
  }
  pins.what = 'SkyAudit registry pins: raw datasets (local, re-fetchable) + committed extracts';
  pins.raw = {
    'ReleasableAircraft.zip': {
      url: 'https://registry.faa.gov/database/ReleasableAircraft.zip',
      license: 'public domain (US government work)',
      acquired: '2026-08-27', dataset_date: '2026-08-26 (file dates inside the zip)',
      sha256: fs.existsSync(path.join(RAW, 'ReleasableAircraft.zip')) ? sha256(fs.readFileSync(path.join(RAW, 'ReleasableAircraft.zip'))) : (pins.raw && pins.raw['ReleasableAircraft.zip'].sha256),
    },
    'dados_aeronaves.csv': {
      url: 'https://sistemas.anac.gov.br/dadosabertos/Aeronaves/RAB/dados_aeronaves.csv',
      license: 'ANAC dados abertos',
      acquired: '2026-08-27', dataset_date: null,
      sha256: fs.existsSync(path.join(RAW, 'dados_aeronaves.csv')) ? sha256(fs.readFileSync(path.join(RAW, 'dados_aeronaves.csv'))) : (pins.raw && pins.raw['dados_aeronaves.csv'].sha256),
    },
  };
  const rabUpdated = JSON.parse(fs.readFileSync(path.join(DIR, 'sp.registry.json'), 'utf8')).rab_updated;
  pins.raw['dados_aeronaves.csv'].dataset_date = rabUpdated;
  pins.extracts = out;
  pins.tool = 'node apps/skyaudit/audit/registry.js build';
  fs.writeFileSync(PINS_PATH, JSON.stringify(pins, null, 1) + '\n');
  return out;
}

/* ---- load: verify the extract against its pin, REFUSE on drift ----
   opts.extracts substitutes extract bytes and opts.pins the pin table —
   the seams the battery's red controls forge through; never passed by a
   consumer. */
let cached = null;
function loadRegistry(opts) {
  if (!opts && cached) return cached;
  const pins = (opts && opts.pins) || JSON.parse(fs.readFileSync(PINS_PATH, 'utf8'));
  const byIcao = new Map(), byReg = new Map();
  for (const city of ['nyc', 'sp']) {
    const pin = pins.extracts[city];
    const bytes = (opts && opts.extracts && opts.extracts[city]) || fs.readFileSync(path.join(DIR, pin.file), 'utf8');
    const got = sha256(bytes);
    if (got !== pin.sha256) {
      throw new Error('REFUSED: registry extract ' + pin.file + ' drifted from its pin (' + got.slice(0, 12) + ' != ' + pin.sha256.slice(0, 12) + ')');
    }
    const ex = JSON.parse(bytes);
    for (const r of Object.values(ex.faa)) { byReg.set(r.reg, r); if (r.icaoHex) byIcao.set(r.icaoHex, r); }
    for (const r of Object.values(ex.rab)) byReg.set(r.reg, r);
  }
  const reg = { byIcao, byReg, lookup: (obj) => byIcao.get(obj.icao) || (obj.r ? byReg.get(obj.r) : undefined) };
  if (!opts) cached = reg;
  return reg;
}

module.exports = { build, loadRegistry, corpusKeys };

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'build') build(process.argv[3]);
  else if (cmd === 'verify') { loadRegistry(); console.log('registry extracts verify against their pins'); }
  else { console.log('usage: node registry.js build|verify [dayDir]'); process.exit(2); }
}
