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
  fs.writeFileSync(path.join(dataDir, CITY + '.audit-summary.json'), JSON.stringify(before, null, 2));
  die('re-certification deviates from the committed summary — investigate before shipping');
}

/* gate 3 — replay bundle regenerates and matches the audit */
console.log('gate: replay bundle');
run('node', ['audit/replay-bundle.js', CITY]);
const bundle = JSON.parse(fs.readFileSync(path.join(dataDir, CITY + '.replay.json'), 'utf8'));
if (bundle.flights.length !== after.flights) {
  die('bundle carries ' + bundle.flights.length + ' flights, audit certified ' + after.flights);
}

/* gate 4 — re-fly the day; the fleet frontier must match the record */
console.log('gate: refly frontier');
const reflyPath = path.join(dataDir, CITY + '.refly.json');
const reflyBefore = fs.existsSync(reflyPath) ? JSON.parse(fs.readFileSync(reflyPath, 'utf8')) : null;
run('node', ['sim/refly.js', CITY]);
const refly = JSON.parse(fs.readFileSync(reflyPath, 'utf8'));
if (reflyBefore && JSON.stringify(reflyBefore.keys) !== JSON.stringify(refly.keys)) {
  fs.writeFileSync(reflyPath, JSON.stringify(reflyBefore, null, 2));   /* keep the record — a drift must refuse EVERY run */
  die('re-fly frontier deviates from the committed record');
}

/* gate 5 — the certified thresholds must match the record */
console.log('gate: optimize thresholds');
const optPath = path.join(dataDir, CITY + '.optimize.json');
const optBefore = fs.existsSync(optPath) ? JSON.parse(fs.readFileSync(optPath, 'utf8')) : null;
run('node', ['sim/optimize.js', CITY]);
const optimize = JSON.parse(fs.readFileSync(optPath, 'utf8'));
if (optBefore && JSON.stringify(optBefore) !== JSON.stringify(optimize)) {
  fs.writeFileSync(optPath, JSON.stringify(optBefore, null, 2));
  die('certified thresholds deviate from the committed record');
}

/* gate 6 — the tiles are the pinned bytes */
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
fs.copyFileSync(path.join(APP, 'src/app.js'), path.join(outDir, 'app.js'));
fs.rmSync(path.join(outDir, 'tiles'), { recursive: true, force: true });   /* tiles serve from the repo raw URL (Vercel dropped the 36.9 MB upload) */

const style = JSON.parse(fs.readFileSync(path.join(APP, 'src/style.json'), 'utf8'));
if (!tilesPins.served_from) die('TILES-PINS.json has no served_from URL');
style.sources.protomaps.url = 'pmtiles://' + tilesPins.served_from;
fs.writeFileSync(path.join(outDir, 'style.json'), JSON.stringify(style));

const { renderApp } = require(path.join(ROOT, 'design/app-shell.js'));
const n = { C: {}, day: after };
const counts = after.bySpecRule['beta-alia|faa-sfar-vfr'];
const NAMES = { 'joby-s4': 'Joby S4', 'archer-midnight': 'Archer Midnight',
  'beta-alia': 'Beta ALIA', 'eve-100': 'Eve EVE-100' };
const frontierRows = ['beta-alia', 'joby-s4', 'archer-midnight', 'eve-100'].map((s) => {
  const k = refly.keys[s + '|faa-sfar-vfr'] || { certifiedLegs: 0, fleetMin: 0 };
  return k.certifiedLegs
    ? `<div class="as-frow"><span><span class="name">${NAMES[s]}</span>
       <span class="sub">${k.certifiedLegs} provable legs · witness ${k.witnessLocal} · pool model, FAA 20-min</span></span>
       <span class="val">exactly ${k.fleetMin} aircraft</span></div>`
    : `<div class="as-frow"><span><span class="name">${NAMES[s]}</span>
       <span class="sub">zero provable legs under FAA 20-min</span></span>
       <span class="val zero">no certifiable fleet</span></div>`;
}).join('');

const html = renderApp({
  title: 'SkyAudit — one real day over New York, every flight decided',
  description: 'Real ADS-B helicopter traffic over NYC (2026-08-26), replayed — every flight audited against published eVTOL specs and energy-reserve rules with mathematically certified enclosures.',
  appName: 'SkyAudit',
  meta: 'NYC · 2026-08-26 · PINNED DAY',
  brand: 'CERT-MACHINE',
  homeHref: '/',
  navLinks: [{ href: '/reports/', label: 'reports' }, { href: 'https://github.com/carlostoledo1891/cert-machine', label: 'github' }],
  mapAria: 'replay map of New York helicopter traffic with certified verdicts',
  styles: ['vendor/maplibre-gl.css'],
  configJson: JSON.stringify({ style: '/apps/skyaudit/style.json',
    bundle: '/apps/skyaudit/data/nyc.replay.json', tiles: tilesPins.served_from }),
  scripts: ['vendor/maplibre-gl.js', 'vendor/deck.min.js', 'vendor/pmtiles.js', 'app.js'],
  panelHtml: `
  <section class="as-card">
    <div class="as-h">The audit</div>
    <div class="as-note">One real day of New York helicopter traffic — <b>${after.uniqueAircraft}
    aircraft, ${after.flights} flights</b>, ADS-B, hash-pinned. Each flight is re-flown on paper
    by an eVTOL: published numbers as honest parameter boxes, a reserve rule, and a three-valued
    verdict from interval arithmetic. <b>Mathematically certified enclosures</b> — no Monte
    Carlo, no airworthiness meaning. REFUSED is a first-class outcome: it measures what the
    manufacturer has not published. This is the exact traffic the industry intends to replace:
    Joby owns Blade's NYC helicopter routes (acquired Aug 2025, flying today), and flew its
    first JFK–Manhattan eVTOL demos from these same heliports in April 2026.</div>
    <details class="as-more"><summary>Honest boundaries</summary>
    <div class="as-fine">The corpus is what the receiver network saw; coverage gaps and truncated
    tracks are flagged per flight. The audit is counterfactual arithmetic over stated boxes
    (quality-flagged in the repo; Eve publishes least, so Eve REFUSES most). FAA = the 20-min VFR
    helicopter tier; EASA = the 5-min final reserve, a NECESSARY condition only. Data ©
    <a href="https://adsb.lol">adsb.lol</a> contributors (ODbL). Rerun everything:
    <a href="https://github.com/carlostoledo1891/cert-machine/tree/main/apps/skyaudit">apps/skyaudit</a>.</div>
    </details>
  </section>
  <section class="as-card">
    <div class="as-h">Aircraft × rule</div>
    <div id="keys" class="as-mx"></div>
  </section>
  <section class="as-card">
    <div class="as-h">This day, under the selection</div>
    <div id="counts" class="as-stats"></div>
  </section>
  <section class="as-card">
    <div class="as-h">Re-fly the day — fleet frontier</div>
    ${frontierRows}
  </section>
  <section class="as-card">
    <div class="as-h">What would it take? — certified thresholds</div>
    <div class="as-fine" style="margin-bottom:10px">The optimizer: bisect a lever until the
    verdict flips, and prove BOTH sides — one unit less fails (recounted), at the threshold
    it holds. Levers over the same pinned day, FAA 20-min shape.</div>
    ${['joby-s4', 'archer-midnight', 'beta-alia', 'eve-100'].map((s) => {
      const b = optimize.battery_floor[s], t = b.targets;
      const fmt = (x) => (x.kwh === null ? '—' : x.kwh + ' kWh');
      return `<div class="as-frow"><span><span class="name">${NAMES[s]} — battery floor</span>
        <span class="sub">published ${b.published_box_kwh[0]}–${b.published_box_kwh[1]} kWh (${b.published_q})</span></span>
        <span class="val">½ day: ${fmt(t[0.5])} · 80%: ${fmt(t[0.8])}</span></div>`;
    }).join('')}
    <div class="as-frow"><span><span class="name">Beta ALIA — the charge lever</span>
      <span class="sub">${optimize.charge_lever.curve.map((c, i, a) => {
        const to = a[i + 1] ? a[i + 1].from_minutes - 1 : 60;
        return (c.from_minutes === 0 ? '≤' + to : c.from_minutes + '–' + to) + ' min → ' + c.fleetMin;
      }).join(' · ')} aircraft — faster chargers are provably worth ${
        optimize.charge_lever.curve[optimize.charge_lever.curve.length - 1].fleetMin -
        optimize.charge_lever.curve[0].fleetMin} aircraft</span></span>
      <span class="val">5 → ${optimize.charge_lever.curve[0].fleetMin}</span></div>
    <div class="as-frow"><span><span class="name">The reserve rule, priced</span>
      <span class="sub">Beta ALIA provable legs at 5/10/15/20/25/30-min reserve:
      ${[5, 10, 15, 20, 25, 30].map((m) => optimize.reserve_price.by_reserve_minutes['beta-alia'][m]).join(' · ')}
      — at 30 minutes, nothing on this day is provable</span></span>
      <span class="val">${optimize.reserve_price.by_reserve_minutes['beta-alia'][5]} → 0</span></div>
  </section>
  <section class="as-card">
    <div class="as-h">Range claims, audited</div>
    <div class="as-fine" style="margin-bottom:8px">A range claim is EXISTENTIAL — CONSISTENT means
    some point of the maker's own public+assumed boxes achieves it; REFUTED means none does.
    A worst-case guarantee is UNIVERSAL and gets the worst corner.</div>
    ${optimize.range_claims.rows.map((r) => {
      const col = { CONSISTENT: '--v-cert', CERTIFIED: '--v-cert', REFUTED: '--v-refu',
        REFUSED: '--v-refd', 'NO CLAIM': '--v-refd' }[r.verdict] || '--v-refd';
      const label = r.verdict === 'REFUSED' ? 'UNDECIDABLE' : r.verdict;
      return `<div class="as-frow"><span><span class="name">${NAMES[r.spec]}</span>
        <span class="sub">${r.claim || r.note}</span></span>
        <span class="val" style="color:var(${col})">${label}</span></div>`;
    }).join('')}
    <div class="as-fine" style="margin-top:8px">Archer's 60-mi worst-case guarantee is the one
    UNIVERSAL claim — and it is undecidable from public numbers (margins straddle zero): a
    guarantee the public cannot check.</div>
  </section>
  <section class="as-card">
    <div class="as-h">Selected flight</div>
    <div id="flight"></div>
  </section>`,
  dockHtml: `
  <button class="as-play" id="play" aria-label="play/pause">❚❚</button>
  <input type="range" class="as-scrub" id="scrub" min="0" max="86400" step="1" value="0" aria-label="time of day">
  <span class="as-clock" id="clock">—</span>
  <span class="as-seg" id="speed" role="group" aria-label="replay speed">
    <button data-v="1">1×</button><button data-v="10">10×</button><button data-v="60" data-on="1">60×</button>
    <button data-v="120">120×</button><button data-v="300">300×</button>
  </span>
  <span class="as-seg" id="mode" role="group" aria-label="trail colors">
    <button data-v="v" data-on="1">VERDICT</button><button data-v="a">ALTITUDE</button>
  </span>
  <span class="attr">© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> · Protomaps ·
  data © <a href="https://adsb.lol">adsb.lol</a> (ODbL)</span>`,
});
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('skyaudit built green: ' + after.flights + ' flights, ' +
  counts.CERTIFIED + ' certified (beta-alia|faa), tiles ' + (fs.statSync(tilesPath).size / 1e6).toFixed(1) + ' MB');
