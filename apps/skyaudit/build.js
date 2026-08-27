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

/* gate 6 — the electric bill must match the record */
console.log('gate: economics');
const ecoPath = path.join(dataDir, CITY + '.economics.json');
const ecoBefore = fs.existsSync(ecoPath) ? JSON.parse(fs.readFileSync(ecoPath, 'utf8')) : null;
run('node', ['audit/economics.js', CITY]);
const economics = JSON.parse(fs.readFileSync(ecoPath, 'utf8'));
if (ecoBefore && JSON.stringify(ecoBefore) !== JSON.stringify(economics)) {
  fs.writeFileSync(ecoPath, JSON.stringify(ecoBefore, null, 2));
  die('the electric bill deviates from the committed record');
}

/* gate 7 — the day stories must match the record */
console.log('gate: stories');
const stPath = path.join(dataDir, CITY + '.stories.json');
const stBefore = fs.existsSync(stPath) ? JSON.parse(fs.readFileSync(stPath, 'utf8')) : null;
run('node', ['audit/stories.js', CITY]);
const stories = JSON.parse(fs.readFileSync(stPath, 'utf8'));
if (stBefore && JSON.stringify(stBefore) !== JSON.stringify(stories)) {
  fs.writeFileSync(stPath, JSON.stringify(stBefore, null, 2));
  die('day stories deviate from the committed record');
}

/* gate 8 — the flight planner must match the record */
console.log('gate: planner');
const plPath = path.join(dataDir, CITY + '.planner.json');
const plBefore = fs.existsSync(plPath) ? JSON.parse(fs.readFileSync(plPath, 'utf8')) : null;
run('node', ['sim/planner.js', CITY]);
const planner = JSON.parse(fs.readFileSync(plPath, 'utf8'));
if (plBefore && JSON.stringify(plBefore) !== JSON.stringify(planner)) {
  fs.writeFileSync(plPath, JSON.stringify(plBefore, null, 1));
  die('the flight planner deviates from the committed record');
}

/* gate 9 — the tiles are the pinned bytes */
const tilesPins = JSON.parse(fs.readFileSync(path.join(APP, 'data/tiles/TILES-PINS.json'), 'utf8'));
const tilesPath = path.join(APP, 'data/tiles', tilesPins.file);
const sha = require('crypto').createHash('sha256').update(fs.readFileSync(tilesPath)).digest('hex');
if (sha !== tilesPins.sha256) die('basemap tiles drifted from TILES-PINS.json');

/* gate 10 — the registry extracts are the pinned bytes and still cover the corpus */
console.log('gate: registry');
const registry = require('./audit/registry.js');
try { registry.loadRegistry(); } catch (e) { die(e.message); }
for (const city of ['nyc', 'sp']) {
  const ex = JSON.parse(fs.readFileSync(path.join(APP, 'data/registry', city + '.registry.json'), 'utf8'));
  const keys = registry.unionKeys(city);          /* every committed day */
  if (ex.counts.corpus !== keys.size || ex.counts.matched + ex.counts.unmatched !== ex.counts.corpus) {
    die('registry extract ' + city + ' no longer covers the corpus (union ' + keys.size + ', extract says ' + JSON.stringify(ex.counts) + ')');
  }
}

/* ---- emit ---- */
console.log('emit: ' + outDir);
fs.mkdirSync(path.join(outDir, 'vendor'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'data'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'tiles'), { recursive: true });

for (const f of fs.readdirSync(path.join(APP, 'vendor'))) {
  fs.copyFileSync(path.join(APP, 'vendor', f), path.join(outDir, 'vendor', f));
}
fs.copyFileSync(path.join(dataDir, CITY + '.replay.json'), path.join(outDir, 'data', CITY + '.replay.json'));
run('node', ['audit/ambient-bundle.js', CITY]);           /* decor layer; keeps previous bundle if full.jsonl absent */
const ambientPath = path.join(dataDir, CITY + '.ambient.json');
if (fs.existsSync(ambientPath)) fs.copyFileSync(ambientPath, path.join(outDir, 'data', CITY + '.ambient.json'));
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
    bundle: '/apps/skyaudit/data/nyc.replay.json', tiles: tilesPins.served_from,
    ambient: '/apps/skyaudit/data/nyc.ambient.json', designer: optimize.designer,
    planner: { heliports: planner.heliports, routes: planner.routes, bands: planner.bandsLegend },
    sim: (() => {   /* mid-box parameters for the LIVE MISSION simulation (labeled sim, not certificate) */
      const phys = JSON.parse(fs.readFileSync(path.join(APP, 'scenario/physics/kasliwal-2019.json'), 'utf8'));
      const mid = (b) => (b[0] + b[1]) / 2;
      const specs = {};
      for (const id of ['joby-s4', 'archer-midnight', 'beta-alia', 'eve-100']) {
        const s = JSON.parse(fs.readFileSync(path.join(APP, 'scenario/specs', id + '.json'), 'utf8'));
        specs[id] = { m: mid(s.boxes.m_kg.v), kwh: mid(s.boxes.battery_kwh.v),
          vBox: s.boxes.v_cruise_kmh.v, delta: mid(s.boxes.delta_nm2.v),
          chargeMin: s.boxes.charge_minutes_full.v[1] };
      }
      return { specs, etaC: 0.765, etaH: 0.63, etaB: 0.9, usableFrac: 0.8, rho: 1.225,
        ld: { anchors: [[241, 17], [322, 13]], cite: 'Uber Elevate 2016: L/D 17 @ 150 mph, 13 @ 200 mph' } };
    })() }),
  scripts: ['vendor/maplibre-gl.js', 'vendor/deck.min.js', 'vendor/pmtiles.js', 'app.js'],
  leftHtml: `
  <section class="as-card">
    <div class="as-lhead"><span class="t">SELECTED FLIGHT</span>
      <button id="lp-min" title="minimize">–</button>
      <button id="lp-close" title="deselect">×</button></div>
    <div id="flight"></div>
  </section>`,
  panelHtml: `
  <nav class="as-tabs" id="tabs">
    <button data-tab="day" data-on="1">DAY</button>
    <button data-tab="fleet">FLEET</button>
    <button data-tab="plan">PLAN</button>
  </nav>
  <div class="as-tabbody on" data-body="day">
  <section class="as-card">
    <div class="as-h">The audit</div>
    <div class="as-note">One real day of New York helicopter traffic — <b>${after.uniqueAircraft}
    aircraft, ${after.flights} flights, ${after.flightStats.totalPathKm.toLocaleString('en-US')} km
    flown (${(after.flightStats.totalPathKm / 40075).toFixed(1)}× around the Earth)</b> — ADS-B,
    hash-pinned. Each flight is re-flown on paper by an eVTOL and decided by interval arithmetic.
    This is the exact traffic the industry intends to replace: Joby owns Blade\'s NYC helicopter
    routes (acquired Aug 2025, flying today), and flew its first JFK–Manhattan eVTOL demos from
    these same heliports in April 2026. <b>Click any aircraft — its certificate opens on the left.</b></div>
    <details class="as-more"><summary>Honest boundaries</summary>
    <div class="as-fine">The corpus is what the receiver network saw; coverage gaps and truncated
    tracks are flagged per flight. The audit is counterfactual arithmetic over stated boxes
    (quality-flagged in the repo; Eve publishes least, so Eve needs data most). FAA = the 20-min VFR
    helicopter tier; EASA = the 5-min final reserve, a NECESSARY condition only. Ambient layer =
    all other traffic, decor only. Data © <a href="https://adsb.lol">adsb.lol</a> contributors
    (ODbL). Rerun everything:
    <a href="https://github.com/carlostoledo1891/cert-machine/tree/main/apps/skyaudit">apps/skyaudit</a>.
    Methodology, sources and boundaries, citable: <a href="/reports/skyaudit.html">the companion note</a>.</div>
    </details>
  </section>
  <section class="as-card">
    <div class="as-h">This day, under the selection</div>
    <div id="counts" class="as-stats"></div>
  </section>
  <section class="as-card">
    <div class="as-h">The day</div>
    <svg viewBox="0 0 100 15" preserveAspectRatio="none" style="width:100%;height:38px;display:block;margin-bottom:2px">
      ${stories.hourly.map((v, h) => {
        const max = Math.max(...stories.hourly);
        const bh = Math.max(0.6, v / max * 13);
        return `<rect x="${(h * 4.17).toFixed(1)}" y="${(14 - bh).toFixed(1)}" width="3.3" height="${bh.toFixed(1)}"
          fill="${h === stories.peak_hour_local ? 'var(--sig)' : 'var(--rule)'}"/>`;
      }).join('')}
    </svg>
    <div class="as-fine" style="margin-bottom:10px">flights in the air by hour · peak at ${stories.peak_hour_local}:00 local</div>
    <div class="as-frow"><span><span class="name">Hardest-working aircraft</span>
      <span class="sub">${stories.leaderboard.slice(0, 3).map((a, i) => `${['🥇', '🥈', '🥉'][i] || ''} ${a.reg}${a.name ? ' — ' + a.name : ''} (${a.type}) ${a.legs} legs · ${Math.round(a.airborneMin / 60 * 10) / 10} h`).join(' · ')}</span>
      <span class="sub" style="color:var(--ink-3)">names: FAA registry (registered to — not necessarily who operates) / ANAC RAB (operador); both pinned</span></span></div>
    <div class="as-frow"><span><span class="name">Records</span>
      <span class="sub">longest ${stories.records.longest_km.value} (${stories.records.longest_km.reg}${stories.records.longest_km.name ? ', ' + stories.records.longest_km.name : ''}) ·
      ${stories.records.longest_min.value} airborne (${stories.records.longest_min.reg}, ${stories.records.longest_min.ops}) ·
      highest ${stories.records.highest_ft.value} (${stories.records.highest_ft.type}) ·
      fastest ${stories.records.fastest_kt.value} (${stories.records.fastest_kt.type})</span></span></div>
    <div class="as-frow"><span><span class="name">What was flying <span style="color:var(--ink-3);font-weight:400">(inferred)</span></span>
      <span class="sub">${Object.entries(stories.ops_mix).sort((a, z) => z[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}</span></span></div>
    <div class="as-frow"><span><span class="name">Measured outliers</span>
      <span class="sub">widest orbit: ${stories.outliers.detours[0].reg} (${stories.outliers.detours[0].type}) flew
      ${stories.outliers.detours[0].factor}× its direct distance · longest hoverer: ${stories.outliers.dwellers[0].reg}
      under 10 kt for ${stories.outliers.dwellers[0].dwellPct}% of a ${stories.outliers.dwellers[0].min}-min flight</span></span></div>
  </section>
  <section class="as-card">
    <div class="as-h">The electric bill</div>
    <div class="as-note">This day\'s helicopters burned <b>${economics.fuel.liters[0].toLocaleString('en-US')}–${economics.fuel.liters[1].toLocaleString('en-US')} L
    of Jet-A</b> — $${economics.fuel.usd[0].toLocaleString('en-US')}–$${economics.fuel.usd[1].toLocaleString('en-US')},
    ${economics.fuel.co2_tonnes[0]}–${economics.fuel.co2_tonnes[1]} tonnes of CO₂.</div>
    <div class="as-note" style="margin-top:8px">The ${economics.electric_subset.flights} provably-electric flights:
    <b>$${economics.electric_subset.usd[0]}–$${economics.electric_subset.usd[1]} of electricity</b> vs
    <b>$${economics.electric_subset.same_flights_fuel.usd[0].toLocaleString('en-US')}–$${economics.electric_subset.same_flights_fuel.usd[1].toLocaleString('en-US')}
    of fuel for the same flights</b>${economics.electric_subset.usd[1] < economics.electric_subset.same_flights_fuel.usd[0]
      ? ' — the cost intervals don\'t overlap: the electric worst case beats the fuel best case'
      : ''}. ${economics.electric_subset.same_flights_fuel.co2_tonnes[0]}–${economics.electric_subset.same_flights_fuel.co2_tonnes[1]} t CO₂ avoided.</div>
    <div class="as-fine" style="margin-top:8px">Fuel from per-type class burn boxes (stated estimates);
    electricity from the certified energy enclosures — decided, not projected.</div>
  </section>
  </div>
  <div class="as-tabbody" data-body="fleet">
  <section class="as-card">
    <div class="as-h">Aircraft × rule</div>
    <div id="keys" class="as-mx"></div>
  </section>
  <section class="as-card">
    <div class="as-h">Fleet designer — every position is a proof</div>
    <div id="dz-gauge-wrap" style="display:flex;align-items:center;gap:16px;margin-bottom:8px">
      <div>
        <svg class="as-gauge" id="dz-gauge" width="110" height="66" viewBox="0 0 110 66">
          <path class="bg" d="M 10 60 A 45 45 0 0 1 100 60"/>
          <path class="fg" id="dz-arc" d="M 10 60 A 45 45 0 0 1 100 60" stroke-dasharray="141.4" stroke-dashoffset="141.4"/>
          <text id="dz-pct" x="55" y="52" text-anchor="middle" font-size="20" font-weight="600">–</text>
        </svg>
        <div class="as-gaugelbl">day provable</div>
      </div>
      <div style="flex:1">
        <div class="as-batt"><div class="shell"><div class="fill" id="dz-bfill"></div></div>
          <span class="as-encvals" id="dz-b-out"></span></div>
        <input type="range" class="as-scrub" id="dz-b" min="60" max="700" step="20" value="320" style="width:100%">
      </div>
    </div>
    <div class="as-h">If the reserve rule were…</div>
    <input type="range" class="as-scrub" id="dz-r" min="0" max="45" step="3" value="20" style="width:100%">
    <div class="as-encvals" id="dz-r-out"></div>
    <div class="as-h" style="margin-top:12px">If charging took… <span id="dz-c-lbl"></span></div>
    <input type="range" class="as-scrub" id="dz-c" min="0" max="60" step="1" value="45" style="width:100%">
    <div class="as-fleet" id="dz-fleet"></div>
    <div class="as-encvals" id="dz-c-out"></div>
    <div class="as-fine" style="margin-top:8px">Battery and reserve apply to the aircraft selected
    above; charging applies to the Beta ALIA fleet re-flying its provable day. Each slider position
    looks up a precomputed, gate-checked certified point.</div>
  </section>
  <section class="as-card">
    <div class="as-h">Re-fly the day — fleet frontier</div>
    ${frontierRows}
  </section>
  <section class="as-card">
    <div class="as-h">Range claims, audited</div>
    <div class="as-fine" style="margin-bottom:8px">A range claim is EXISTENTIAL — CONSISTENT means
    some point of the maker\'s own public+assumed boxes achieves it. A worst-case guarantee is
    UNIVERSAL and gets the worst corner.</div>
    ${optimize.range_claims.rows.map((r) => {
      const col = { CONSISTENT: '--v-cert', CERTIFIED: '--v-cert', REFUTED: '--v-refu',
        REFUSED: '--v-refd', 'NO CLAIM': '--v-refd' }[r.verdict] || '--v-refd';
      const label = r.verdict === 'REFUSED' ? 'UNDECIDABLE' : r.verdict;
      return `<div class="as-frow"><span><span class="name">${NAMES[r.spec]}</span>
        <span class="sub">${r.claim || r.note}</span></span>
        <span class="val" style="color:var(${col})">${label}</span></div>`;
    }).join('')}
  </section>
  </div>
  <div class="as-tabbody" data-body="plan">
  <section class="as-card">
    <div class="as-h">Flight planner — a plan that comes with a proof</div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <select class="as-sel" id="pl-from" style="flex:1">${Object.entries(planner.heliports).map(([k, h]) => `<option value="${k}">${h.name}</option>`).join('')}</select>
      <button class="as-btn" id="pl-swap" title="swap">⇄</button>
      <select class="as-sel" id="pl-to" style="flex:1">${Object.entries(planner.heliports).map(([k, h], i) => `<option value="${k}" ${i === 3 ? 'selected' : ''}>${h.name}</option>`).join('')}</select>
    </div>
    <div id="pl-out"></div>
    <div class="as-fine" style="margin-top:10px">${planner.honesty}</div>
  </section>
  <section class="as-card" id="mission-card" style="display:none">
    <div class="as-h">Live mission</div>
    <div id="mission"></div>
  </section>
  </div>`,

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
