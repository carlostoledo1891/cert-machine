/* build.js — SkyAudit's gated build: battery green, the day re-certified
   and compared against the committed summary (refuses on drift), replay
   bundle regenerated, then the app is emitted to site/apps/skyaudit/.
   apps/skyaudit · cert-machine                                            */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP = __dirname;
const ROOT = path.join(APP, '../..');
const DAY = 'day-2026-08-26';
const CITY = 'nyc';
const dataDir = path.join(APP, 'data', DAY);
const outDir = path.join(ROOT, 'site/apps/skyaudit');

function die(msg) { console.error('build REFUSED: ' + msg); process.exit(1); }
function run(cmd, args) { return execFileSync(cmd, args, { cwd: APP, encoding: 'utf8' }); }

/* gate 1 — the battery */
console.log('gate: battery');
try { run('node', ['battery.js']); } catch (e) { die('battery not green\n' + (e.stdout || e.message)); }

/* gate 2 — re-certify the pinned day; verdict counts must match the record */
console.log('gate: re-certify ' + CITY);
const before = JSON.parse(fs.readFileSync(path.join(dataDir, CITY + '.audit-summary.json'), 'utf8'));
run('node', ['audit/certify-day.js', CITY]);
const after = JSON.parse(fs.readFileSync(path.join(dataDir, CITY + '.audit-summary.json'), 'utf8'));
if (JSON.stringify(before.bySpecRule) !== JSON.stringify(after.bySpecRule) ||
    before.flights !== after.flights || before.uniqueAircraft !== after.uniqueAircraft) {
  die('re-certification deviates from the committed summary — investigate before shipping');
}

/* gate 3 — replay bundle regenerates and matches the audit */
console.log('gate: replay bundle');
run('node', ['audit/replay-bundle.js', CITY]);
const bundle = JSON.parse(fs.readFileSync(path.join(dataDir, CITY + '.replay.json'), 'utf8'));
if (bundle.flights.length !== after.flights) {
  die('bundle carries ' + bundle.flights.length + ' flights, audit certified ' + after.flights);
}

/* gate 4 — the tiles are the pinned bytes */
const tilesPins = JSON.parse(fs.readFileSync(path.join(APP, 'data/tiles/TILES-PINS.json'), 'utf8'));
const tilesPath = path.join(APP, 'data/tiles', tilesPins.file);
const sha = require('crypto').createHash('sha256').update(fs.readFileSync(tilesPath)).digest('hex');
if (sha !== tilesPins.sha256) die('basemap tiles drifted from TILES-PINS.json');

/* ---- emit ---- */
console.log('emit: ' + outDir);
fs.mkdirSync(path.join(outDir, 'vendor'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'data'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'tiles'), { recursive: true });

for (const f of fs.readdirSync(path.join(APP, 'vendor'))) {
  fs.copyFileSync(path.join(APP, 'vendor', f), path.join(outDir, 'vendor', f));
}
fs.copyFileSync(path.join(dataDir, CITY + '.replay.json'), path.join(outDir, 'data', CITY + '.replay.json'));
fs.copyFileSync(tilesPath, path.join(outDir, 'tiles', tilesPins.file));
fs.copyFileSync(path.join(APP, 'src/app.js'), path.join(outDir, 'app.js'));

const style = JSON.parse(fs.readFileSync(path.join(APP, 'src/style.json'), 'utf8'));
style.sources.protomaps.url = 'pmtiles:///apps/skyaudit/tiles/' + tilesPins.file;
fs.writeFileSync(path.join(outDir, 'style.json'), JSON.stringify(style));

const { renderApp } = require(path.join(ROOT, 'design/app-shell.js'));
const n = { C: {}, day: after };
const counts = after.bySpecRule['beta-alia|faa-sfar-vfr'];
const html = renderApp({
  title: 'SkyAudit — one real day over New York, every flight decided',
  description: 'Real ADS-B helicopter traffic over NYC (2026-08-26), replayed — every flight audited against published eVTOL specs and energy-reserve rules with mathematically certified enclosures.',
  appName: 'SKYAUDIT · NYC · 2026-08-26',
  brand: 'CERT-MACHINE',
  homeHref: '/',
  navLinks: [{ href: '/reports/', label: 'reports' }, { href: 'https://github.com/carlostoledo1891/cert-machine', label: 'github' }],
  mapAria: 'replay map of New York helicopter traffic with certified verdicts',
  styles: ['vendor/maplibre-gl.css'],
  configJson: JSON.stringify({ style: '/apps/skyaudit/style.json', bundle: '/apps/skyaudit/data/nyc.replay.json' }),
  scripts: ['vendor/maplibre-gl.js', 'vendor/deck.min.js', 'vendor/pmtiles.js', 'app.js'],
  panelHtml: `
  <div class="as-h">the audit</div>
  <div class="as-note">One real day of New York helicopter traffic (${after.uniqueAircraft} unique aircraft,
  ${after.flights} flights, ADS-B, hash-pinned). Each flight is re-flown on paper by an eVTOL:
  its published numbers as honest parameter boxes, a reserve rule, and a three-valued verdict
  from interval arithmetic — <b>mathematically certified enclosures</b>, no Monte Carlo,
  no airworthiness meaning. REFUSED is a first-class outcome: it measures what the
  manufacturer has not published.</div>
  <div class="as-h">aircraft · rule</div><div id="keys"></div>
  <div class="as-h">this day, under the selection</div><div id="counts"></div>
  <div class="as-h">selected flight</div><div id="flight"></div>
  <details style="margin-top:12px"><summary class="as-h" style="cursor:pointer">honest boundaries</summary>
  <div class="as-note">The corpus is what the receiver network saw — equipage in NYC is mandated
  (14 CFR 91.225 inside the Mode C veil) but coverage gaps and truncated tracks are flagged per
  flight. The audit is counterfactual arithmetic over stated boxes (specs quality-flagged in the
  repo; Eve publishes least, so Eve REFUSES most). FAA rule = the 20-min VFR helicopter tier;
  EASA rule = the 5-min final reserve as a NECESSARY condition only. Data © adsb.lol contributors
  (ODbL). Rerun everything: <a href="https://github.com/carlostoledo1891/cert-machine/tree/main/apps/skyaudit">apps/skyaudit</a>.</div>
  </details>`,
  dockHtml: `
  <button class="as-btn" id="play">❚❚</button>
  <input type="range" class="as-scrub" id="scrub" min="0" max="86400" step="1" value="0" aria-label="time of day">
  <span class="as-clock" id="clock">—</span>
  <select class="as-sel" id="speed" aria-label="replay speed">
    <option value="1">1×</option><option value="10">10×</option><option value="60" selected>60×</option>
    <option value="120">120×</option><option value="300">300×</option>
  </select>
  <button class="as-btn" id="mode">color: verdict</button>
  <span class="attr">© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> · Protomaps ·
  data © <a href="https://adsb.lol">adsb.lol</a> (ODbL)</span>`,
});
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('skyaudit built green: ' + after.flights + ' flights, ' +
  counts.CERTIFIED + ' certified (beta-alia|faa), tiles ' + (fs.statSync(tilesPath).size / 1e6).toFixed(1) + ' MB');
