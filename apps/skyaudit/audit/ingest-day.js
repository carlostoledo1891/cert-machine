/* ingest-day.js — one command ingests one adsb.lol day into the corpus:
   download → sha256 → extract → pin → certify → re-fly → compare → clean.
   apps/skyaudit · cert-machine

   The daily-ingest half of the prediction program (Phase A): each ingested
   day extends the pinned time series the forecast instrument calibrates
   on. Idempotent: a day whose PINS.json already exists is re-verified and
   the download is skipped. Raw tars and *.full.jsonl are DELETED after a
   green ingest (re-fetchable; their sha256 stays in PINS.json) unless
   --keep-raw is passed — disk is the constraint, pins are the memory.

   After adding a day the registry extracts must cover the new aircraft:
   if the raw registries are on disk this tool rebuilds the extracts;
   if not, it says so and exits nonzero (gate 10 would refuse anyway —
   nothing can be turned off silently).

   usage: node ingest-day.js YYYY-MM-DD [--keep-raw]                       */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, execSync } = require('child_process');

const APP = path.join(__dirname, '..');
const DATA = path.join(APP, 'data');
const RECORD_DAY = 'day-2026-08-26';
const date = process.argv[2];
const keepRaw = process.argv.includes('--keep-raw');
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) { console.error('usage: node ingest-day.js YYYY-MM-DD [--keep-raw]'); process.exit(2); }
const dayDir = 'day-' + date;
const dir = path.join(DATA, dayDir);
const raw = path.join(dir, 'raw');
const die = (m) => { console.error('INGEST REFUSED: ' + m); process.exit(1); };
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const run = (cmd, args, opts) => execFileSync(cmd, args, { stdio: 'inherit', cwd: APP, ...opts });

/* ---- 1 · download (skipped when the day is already pinned) --------------- */
const pinsPath = path.join(dir, 'PINS.json');
if (fs.existsSync(pinsPath)) {
  const pins = JSON.parse(fs.readFileSync(pinsPath, 'utf8'));
  for (const f of ['nyc.heli.jsonl.gz', 'sp.heli.jsonl.gz']) {
    if (sha256(path.join(dir, f)) !== pins.subsets_sha256[f]) die(f + ' drifted from its pin');
  }
  console.log(dayDir + ': already pinned, corpora verify — nothing to ingest');
  process.exit(0);
}
fs.mkdirSync(raw, { recursive: true });
const tagOf = (kind) => 'v' + date.replace(/-/g, '.') + '-planes-readsb-' + kind + '-0';
const assets = [];
for (const kind of ['prod', 'mlatonly']) {
  const tag = tagOf(kind);
  const api = execFileSync('curl', ['-sL', 'https://api.github.com/repos/adsblol/globe_history_' + date.slice(0, 4) + '/releases/tags/' + tag]).toString();
  const rel = JSON.parse(api);
  if (!rel.assets || !rel.assets.length) die('release ' + tag + ' not found or has no assets');
  for (const a of rel.assets) assets.push({ name: a.name, url: a.browser_download_url, size: a.size });
}
console.log(dayDir + ': downloading ' + assets.length + ' assets (' + (assets.reduce((s, a) => s + a.size, 0) / 1e9).toFixed(1) + ' GB)');
for (const a of assets) {
  const p = path.join(raw, a.name);
  if (fs.existsSync(p) && fs.statSync(p).size === a.size) { console.log('  have ' + a.name); continue; }
  run('curl', ['-sL', '--retry', '3', '-o', p, a.url]);
  if (fs.statSync(p).size !== a.size) die(a.name + ' size mismatch after download');
}
const assetSha = {};
for (const a of assets) assetSha[a.name] = sha256(path.join(raw, a.name));

/* ---- 2 · extract --------------------------------------------------------- */
const parts = assets.map((a) => path.join(raw, a.name)).sort((x, y) => {
  /* prod parts first, in .aa/.ab/.ac order; mlatonly last */
  const mx = /mlatonly/.test(x) ? 1 : 0, my = /mlatonly/.test(y) ? 1 : 0;
  return mx - my || x.localeCompare(y);
});
console.log(dayDir + ': extracting');
execSync('cat ' + parts.map((p) => JSON.stringify(p)).join(' ') + ' | node ' + JSON.stringify(path.join(__dirname, 'extract.js')) + ' ' + JSON.stringify(dir), { stdio: 'inherit' });
const stats = JSON.parse(fs.readFileSync(path.join(dir, 'extract-stats.json'), 'utf8'));
if (stats.parseErrors !== 0) die('extraction reported ' + stats.parseErrors + ' parse errors');

/* ---- 3 · pin ------------------------------------------------------------- */
for (const c of ['nyc', 'sp']) execSync('gzip -9 -k -f ' + JSON.stringify(path.join(dir, c + '.heli.jsonl')));
const subsets = {};
for (const f of ['nyc.heli.jsonl', 'sp.heli.jsonl', 'nyc.heli.jsonl.gz', 'sp.heli.jsonl.gz']) subsets[f] = sha256(path.join(dir, f));
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(pinsPath, JSON.stringify({
  what: 'SkyAudit ingested day (prediction-program time series): adsb.lol globe_history ' + date + ', acquired ' + today,
  source: {
    project: 'adsb.lol open data', docs: 'https://www.adsb.lol/docs/open-data/historical/',
    license: 'ODbL-1.0 (see ../LICENSE-DATA)',
    releases: [tagOf('prod'), tagOf('mlatonly')].map((t) => 'https://github.com/adsblol/globe_history_' + date.slice(0, 4) + '/releases/tag/' + t),
  },
  assets_sha256: assetSha,
  extraction: { tool: 'apps/skyaudit/audit/ingest-day.js -> extract.js', bboxes: 'identical to ' + RECORD_DAY, traceFiles: stats.traceFiles, parseErrors: 0 },
  subsets_sha256: subsets,
  committed: '*.heli.jsonl.gz + certs + records; raw tars and *.full.jsonl deleted after ingest (re-fetchable, sha256 above)',
  role: 'time-series day for the forecast calibration corpus — the app stays pinned to ' + RECORD_DAY,
}, null, 2) + '\n');

/* ---- 4 · registry coverage ----------------------------------------------- */
const registry = require('./registry.js');
const haveRaws = fs.existsSync(path.join(DATA, 'registry', 'raw', 'MASTER.txt')) && fs.existsSync(path.join(DATA, 'registry', 'raw', 'dados_aeronaves.csv'));
if (haveRaws) {
  console.log(dayDir + ': rebuilding registry extracts over the union of days');
  registry.build();
} else {
  const ex = JSON.parse(fs.readFileSync(path.join(DATA, 'registry', 'nyc.registry.json'), 'utf8'));
  if (registry.unionKeys('nyc').size !== ex.counts.corpus) {
    die('new aircraft need registry coverage but the raw registries are not on disk — re-fetch them (REGISTRY-PINS.json has urls+shas) and run: node audit/registry.js build');
  }
}

/* ---- 5 · certify · re-fly · compare -------------------------------------- */
for (const c of ['nyc', 'sp']) {
  run(process.execPath, [path.join(__dirname, 'certify-day.js'), c, dayDir]);
  run(process.execPath, [path.join(APP, 'sim', 'refly.js'), c, dayDir]);
  execSync('gzip -9 -k -f ' + JSON.stringify(path.join(dir, c + '.certs.jsonl')));
}
run(process.execPath, [path.join(__dirname, 'compare-days.js'), 'nyc', RECORD_DAY, dayDir]);

/* ---- 6 · clean ------------------------------------------------------------ */
if (!keepRaw) {
  fs.rmSync(raw, { recursive: true, force: true });
  for (const c of ['nyc', 'sp']) fs.rmSync(path.join(dir, c + '.full.jsonl'), { force: true });
  console.log(dayDir + ': raw tars + full.jsonl deleted (pinned, re-fetchable)');
}
console.log(dayDir + ': INGESTED GREEN');
