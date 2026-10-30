#!/usr/bin/env node
/* build-report-skyaudit.js — generate reports/skyaudit.html: the citable
   methodology companion to the SkyAudit app (/apps/skyaudit/).

   The app is the interface; this page is the reference. Every number here
   is READ from the app's own gate-checked records and CROSS-CHECKED live
   at this build (certificate rows recounted from the ledger, verdict
   counts re-tallied, registry closure re-verified) — and the app's battery
   runs as this page's gate. The build refuses on any deviation. Nothing on
   the page is typed in.

   Wording discipline (aviation): "certified" on this page always means a
   MATHEMATICALLY certified enclosure. It carries no airworthiness meaning
   — the page says so where a reader could trip.

   usage: node tools/build-report-skyaudit.js */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'apps', 'skyaudit');
const DAY = path.join(APP, 'data', 'day-2026-08-26');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
/* WARRANT v2.1 (design/WARRANT.md), 2026-10-28. Every verdict, count, fleet and threshold here is DECIDED: interval
   arithmetic over the boxes, exact witnesses, recounted from the ledgers at this build. They stay plain. What a verdict
   says about an aircraft rests on premises — the observed route, the counterfactual, the spec boxes, the power model,
   the reserve rule — and those are named with their grades in §2 (rule 11). The reserve ladder is six decided knots;
   the line between two knots was drawn solid and with a wash under it, asserting counts at reserves nobody decided. The
   knots stay solid; the line between them is CHOSEN, dotted (WARRANT: "the line interpolated between two such knots is
   dotted"). */
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
/* a premise names its record by path; at 390 px a path is one unbreakable word and pushed SkyAudit's page 63 px wide
   (the ruler, 2026-10-28). A break opportunity after each slash, nothing else changes. */
const PREM = (items, o) => W.premisesHtml(items, o).replace(/([\w.-])\/(?=[\w.-])/g, '$1/<wbr>');
const die = (m) => { console.error('SKYAUDIT REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the app's battery ------------------------------------------- */
const bat = cp.spawnSync(process.execPath, [path.join(APP, 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /battery green: (\d+)\/(\d+) checks/.exec(bout);
if (bat.status !== 0 || !bm || bm[1] !== bm[2]) die('the skyaudit battery did not pass:\n' + bout.slice(-600));
const nChecks = Number(bm[1]);
if (!/ok\s+\d+\s+membership stands on authority: .*miscoded A320 \+ BD-500 excluded BY THE REGISTRY/.test(bout)) die('the battery no longer excludes the A320 and the BD-500 by the registry');
if (!/ok\s+\d+\s+hover [0-9.]+ kW and cruise [0-9.]+ kW reproduced within tolerance/.test(bout) || !/Kasliwal 2019 worked examples/.test(bout)) die('the battery no longer reproduces Kasliwal 2019\'s worked examples');

/* ---- the gated records ---------------------------------------------------- */
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const S = J(path.join(DAY, 'nyc.audit-summary.json'));
const SP = J(path.join(DAY, 'sp.audit-summary.json'));
const refly = J(path.join(DAY, 'nyc.refly.json'));
const opt = J(path.join(DAY, 'nyc.optimize.json'));
const econ = J(path.join(DAY, 'nyc.economics.json'));
const stories = J(path.join(DAY, 'nyc.stories.json'));
const dayPins = J(path.join(DAY, 'PINS.json'));
const regPins = J(path.join(APP, 'data', 'registry', 'REGISTRY-PINS.json'));
const srcPins = J(path.join(APP, 'data', 'sources', 'SOURCES-PINS.json'));
const regNyc = J(path.join(APP, 'data', 'registry', 'nyc.registry.json'));
const regSp = J(path.join(APP, 'data', 'registry', 'sp.registry.json'));

/* ---- gate 2: recount the certificate ledger against the summary ---------- */
const certsRaw = zlib.gunzipSync(fs.readFileSync(path.join(DAY, 'nyc.certs.jsonl.gz'))).toString('utf8');
const tally = {}; let rowCount = 0;
for (const line of certsRaw.split('\n')) {
  if (!line.trim()) continue;
  rowCount++;
  const r = JSON.parse(line);
  const k = r.spec + '|' + r.rule;
  (tally[k] = tally[k] || { CERTIFIED: 0, REFUTED: 0, REFUSED: 0 })[r.verdict]++;
}
if (rowCount !== S.rows) die('ledger recount ' + rowCount + ' != summary rows ' + S.rows);
for (const [k, v] of Object.entries(S.bySpecRule)) {
  for (const verdict of ['CERTIFIED', 'REFUTED', 'REFUSED']) {
    if ((tally[k] && tally[k][verdict] || 0) !== (v[verdict] || 0)) die('verdict recount deviates at ' + k + ' ' + verdict);
  }
}

/* ---- the contrast day (7.4 day-stability) --------------------------------- */
const DAY2 = path.join(APP, 'data', 'day-2026-08-23');
const S2 = J(path.join(DAY2, 'nyc.audit-summary.json'));
const cmp = J(path.join(DAY2, 'nyc.compare.json'));
const day2Pins = J(path.join(DAY2, 'PINS.json'));

/* gate 2b: re-derive the comparison and recount the contrast-day ledger */
const rederived = require(path.join(APP, 'audit', 'compare-days.js')).derive('nyc', 'day-2026-08-26', 'day-2026-08-23');
if (JSON.stringify(rederived) !== JSON.stringify(cmp)) die('the day comparison no longer re-derives from the committed summaries');
const certs2 = zlib.gunzipSync(fs.readFileSync(path.join(DAY2, 'nyc.certs.jsonl.gz'))).toString('utf8');
const rows2 = certs2.split('\n').filter((l) => l.trim()).length;
if (rows2 !== S2.rows || rows2 !== cmp.summary.rows.contrast) die('contrast-day ledger recount ' + rows2 + ' != summary ' + S2.rows);

/* ---- gate 3: cross-record consistency ------------------------------------- */
const BETA = 'beta-alia|faa-sfar-vfr';
const eflyable = S.bySpecRule[BETA].CERTIFIED;
if (econ.electric_subset.flights !== eflyable) die('economics electric subset != certified count');
if (refly.keys[BETA].certifiedLegs !== eflyable) die('refly certified legs != certified count');
if (opt.reserve_price.by_reserve_minutes['beta-alia']['20'] !== eflyable) die('reserve price at 20 min != certified count');
const { unionKeys } = require(path.join(APP, 'audit', 'registry.js'));
for (const [city, ex] of [['nyc', regNyc], ['sp', regSp]]) {
  if (ex.counts.matched + ex.counts.unmatched !== ex.counts.corpus) die('registry closure broken for ' + city);
  if (ex.counts.corpus !== unionKeys(city).size) die('registry extract ' + city + ' no longer covers the union of committed days');
}

/* ---- gate 4: the sentences, read against the records (WARRANT rule 8, 2026-10-28) -----------------------------
   Each of these was a typed number or a claim no gate stood behind; four of them were wrong. */
const OTHERS = ['joby-s4', 'archer-midnight', 'eve-100'];
const RULE_IDS = ['faa-sfar-vfr', 'easa-final-reserve'];
/* "Joby, Archer and Eve: zero provable flights each" — on both pinned days and under both rules */
for (const sum of [S, S2]) for (const k of OTHERS) for (const r of RULE_IDS) if ((sum.bySpecRule[k + '|' + r] || {}).CERTIFIED !== 0) die('a non-Beta aircraft proves a flight: ' + k + ' ' + r);
/* the TL;DR said they score zero "not because their aircraft fail but because their public numbers cannot decide".
   Their own numbers REFUTE 25 (Joby), 129 (Archer) and 35 (Eve) of the day's flights under the FAA rule. */
const refutedFaa = OTHERS.map((k) => S.bySpecRule[k + '|faa-sfar-vfr'].REFUTED);
const needsFaa = OTHERS.map((k) => S.bySpecRule[k + '|faa-sfar-vfr'].REFUSED);
if (!refutedFaa.every((n) => n > 0)) die('the opacity sentence names refutations for all three');
if (!needsFaa.every((n, i) => n > refutedFaa[i])) die('NEEDS DATA no longer dominates every non-Beta FAA ledger');
const eveShare = S.bySpecRule['eve-100|faa-sfar-vfr'].REFUSED / S.flights;
if (!(eveShare >= 0.85)) die('Eve\'s ledger is no longer nearly all NEEDS DATA: ' + eveShare);
/* rows = flights × 4 aircraft × 2 rules */
if (S.rows !== S.flights * 8 || S2.rows !== S2.flights * 8) die('rows are not flights × 4 aircraft × 2 rules');
/* the corpus sentence: 125,746 traces, 0 parse errors; the segmentation's 900 s split and 60 s ground close */
const XS = J(path.join(DAY, 'extract-stats.json'));
if (XS.parseErrors !== 0) die('the extract now has parse errors');
const FL = require(path.join(APP, 'audit', 'flights.js'));
if (FL.GAP_SPLIT_S !== 900 || FL.GROUND_END_S !== 60) die('the segmentation constants the page states moved');
/* the economics: the prose promised "the sentence disappears if the data stops supporting it" — and printed it
   unconditionally. It is conditional now. */
const eUsd = econ.electric_subset.usd, fUsd = econ.electric_subset.same_flights_fuel.usd;
const DISJOINT = eUsd[1] < fUsd[0];
/* the spec packs: battery sizes are quality E — "NEVER published; trade estimates" for Joby — so the page may not call
   them published, which §4 did ("against a published 130–180") */
const SPEC = Object.fromEntries(['joby-s4', 'archer-midnight', 'beta-alia', 'eve-100'].map((k) => [k, J(path.join(APP, 'scenario', 'specs', k + '.json'))]));
for (const k of Object.keys(SPEC)) {
  const b = SPEC[k].boxes.battery_kwh, f = opt.battery_floor[k];
  if (!f || f.published_box_kwh[0] !== b.v[0] || f.published_box_kwh[1] !== b.v[1] || f.published_q !== b.q) die('the battery floor record and the spec pack disagree for ' + k);
}
if (!Object.values(SPEC).every((sp) => ['E', 'A'].includes(sp.boxes.battery_kwh.q))) die('a maker now publishes its battery: the §2 sentence says none does');
const eveA = Object.values(SPEC['eve-100'].boxes).filter((b) => b.q === 'A').length, eveN = Object.keys(SPEC['eve-100'].boxes).length;
if (!(eveA >= eveN - 1)) die('Eve\'s pack is no longer nearly all assumption');
const RULE_FAA = J(path.join(APP, 'scenario', 'rules', 'faa-sfar-vfr.json'));
if (!/vertical-landing condition is assumed satisfied/.test(RULE_FAA.condition_note)) die('the FAA rule pack no longer states its assumed condition');
const boxWords = (k) => (SPEC[k].boxes.battery_kwh.q === 'A' ? 'an assumed ' : 'an estimated ') + SPEC[k].boxes.battery_kwh.v.join('–');
const FLOOR_IN = Object.keys(SPEC).filter((k) => opt.battery_floor[k].targets['0.5'].kwh <= SPEC[k].boxes.battery_kwh.v[1]);
if (FLOOR_IN.length !== 1 || FLOOR_IN[0] !== 'beta-alia') die('Beta is no longer the only half-day floor inside its own box: ' + FLOOR_IN.join(', '));
const RATES = J(path.join(APP, 'scenario', 'fuel-rates.json'));
if (RATES.q !== 'E' || !RATES.electricity) die('the fuel and electricity boxes are no longer public class estimates');
const QWORD = { M: 'from the manufacturer', T: 'from trade press attributing the maker', E: 'estimates', A: 'assumptions', 'M/E': 'manufacturer figures widened by estimate' };
const qCount = {};
for (const k of Object.keys(SPEC)) for (const b of Object.values(SPEC[k].boxes)) qCount[b.q] = (qCount[b.q] || 0) + 1;
/* "up to 34% at the widest cruise box": v_hi / v_lo over the four packs, rounded up */
const vRatio = Math.max(...Object.values(SPEC).map((s) => s.boxes.v_cruise_kmh.v[1] / s.boxes.v_cruise_kmh.v[0]));
const V1_SLACK = Math.ceil((vRatio - 1) * 100);
/* the v1 delta "quoted as history (git a07be1f)": read from that commit, not typed */
const V1 = (() => { try { return JSON.parse(cp.execSync('git show a07be1f:apps/skyaudit/data/day-2026-08-26/nyc.audit-summary.json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString()); } catch (e) { return null; } })();
if (!V1 || V1.flights !== S.flights) die('the v1 summary at a07be1f is not readable, or not the same day');
const v1Cert = V1.bySpecRule[BETA].CERTIFIED;
/* the page said "10 gates" twice: apps/skyaudit/build.js has eleven (gate 11 is the forecast ledger); counted from its source */
const nGates = Math.max(...[...fs.readFileSync(path.join(APP, 'build.js'), 'utf8').matchAll(/\/\* gates? (?:\d+–)?(\d+)\b/g)].map((m) => Number(m[1])));
if (!(nGates >= 10)) die('could not count the app build\'s gates');
if (!/20-mi trips/.test(JSON.stringify(SPEC['archer-midnight']))) die('the Archer pack no longer records its 20-mile design trips');
if (nGates !== 11) die('apps/skyaudit/build.js no longer has the eleven gates the §8 list names: ' + nGates);
/* N339LL on the contrast day: the median ground speed and the highest altitude, read from its trace */
const N339 = (() => {
  const line = zlib.gunzipSync(fs.readFileSync(path.join(DAY2, 'nyc.heli.jsonl.gz'))).toString('utf8').split('\n').find((l) => l.includes('"r":"N339LL"'));
  if (!line) return null;
  const r = JSON.parse(line), gs = r.trace.map((p) => p[4]).filter((x) => typeof x === 'number').sort((a, b) => a - b);
  return { feeder: r.desc, gsMed: gs[Math.floor(gs.length / 2)], altMax: Math.max(...r.trace.map((p) => p[3]).filter((x) => typeof x === 'number')) };
})();
const reg339 = (regNyc.faa || {}).N339LL || null;
if (!reg339 || reg339.model !== 'R44 II' || !reg339.rotorcraft) die('the FAA registry no longer calls N339LL a Robinson R44 II rotorcraft');
if (!N339 || !/TBM-700/.test(N339.feeder)) die('N339LL\'s feeder type is no longer the TBM-700 the page names');

/* ---- the whole series (7 · day-stability) ---------------------------------
   The day scan and the E-FLYABLE definition live in ONE module: audit/forecast.js
   owns them, the prediction ledger calls the same function, and this page calls it
   too — so the page and the forecaster can never disagree about which days exist
   or what E-FLYABLE means. A rule defined twice WILL diverge. */
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK = require(path.join(APP, 'audit', 'forecast.js')).series().map((d) => {
  const dir = path.join(APP, 'data', 'day-' + d.date);
  const s = J(path.join(dir, 'nyc.audit-summary.json'));
  const rf = J(path.join(dir, 'nyc.refly.json'));
  const dow = new Date(d.date + 'T12:00:00Z').getUTCDay();
  /* gate 2c: EVERY day shown is recounted from its own committed ledger, not just
     the record and contrast days — a page that displays seven days must gate seven.
     The VERDICTS are re-tallied, not merely the row count: series() reads the same
     summary file, so comparing the summary against itself would pass vacuously, and
     a corrupted CERTIFIED leaves `rows` untouched. The ledger is the only independent
     witness here, so the tally is what the displayed number is checked against. */
  const tallyD = {}; let nD = 0;
  for (const line of zlib.gunzipSync(fs.readFileSync(path.join(dir, 'nyc.certs.jsonl.gz'))).toString('utf8').split('\n')) {
    if (!line.trim()) continue;
    nD++;
    const r = JSON.parse(line);
    const k = r.spec + '|' + r.rule;
    (tallyD[k] = tallyD[k] || { CERTIFIED: 0, REFUTED: 0, REFUSED: 0 })[r.verdict]++;
  }
  if (nD !== s.rows) die('series recount ' + d.date + ': ' + nD + ' rows != summary ' + s.rows);
  for (const [k, v] of Object.entries(s.bySpecRule)) {
    for (const verdict of ['CERTIFIED', 'REFUTED', 'REFUSED']) {
      if ((tallyD[k] && tallyD[k][verdict] || 0) !== (v[verdict] || 0)) {
        die('series verdict recount deviates at ' + d.date + ' ' + k + ' ' + verdict);
      }
    }
  }
  if (!tallyD[BETA] || tallyD[BETA].CERTIFIED !== d.eflyable) die('series E-FLYABLE disagrees with the ledger at ' + d.date);
  /* "the STRUCTURE holds on every one — only Beta provable, the others zero": checked on every day shown */
  for (const k of OTHERS) if ((tallyD[k + '|faa-sfar-vfr'] || {}).CERTIFIED) die('a non-Beta aircraft proves a flight on ' + d.date);
  return { date: d.date, dow, dowName: DOW[dow], weekend: dow === 0 || dow === 6,
    flights: d.flights, eflyable: d.eflyable, rows: s.rows, uniqueAircraft: s.uniqueAircraft,
    km: s.flightStats.totalPathKm, fleetMin: rf.keys[BETA].fleetMin,
    pct: Math.round(d.eflyable / d.flights * 1000) / 10 };
});
if (WEEK.length < 2) die('the day-stability section needs at least two days');
/* the shape of the series, computed — never asserted in prose. The run is measured
   from the first day whose share is the maximum, so a later day breaking the decline
   shortens it instead of quietly invalidating the sentence built on it. */
const peakIx = WEEK.reduce((b, r, i) => (r.pct > WEEK[b].pct ? i : b), 0);
let runEnd = peakIx;
while (runEnd + 1 < WEEK.length && WEEK[runEnd + 1].pct < WEEK[runEnd].pct) runEnd++;
const RUN = WEEK.slice(peakIx, runEnd + 1);
const monotone = RUN.length === WEEK.length - peakIx;
const wkEnd = WEEK.filter((r) => r.weekend), wkDay = WEEK.filter((r) => !r.weekend);
const lo = (a) => Math.min(...a.map((r) => r.pct)), hi = (a) => Math.max(...a.map((r) => r.pct));
/* does a weekday/weekend split actually separate the two groups? Only if the
   weekday MINIMUM sits above the weekend MAXIMUM. It does not, and the page says so
   rather than quoting a range that drops the weekday which breaks it. */
const splitHolds = wkEnd.length && wkDay.length && lo(wkDay) > hi(wkEnd);
if (!(hi(WEEK) - lo(WEEK) > 10)) die('the provable share no longer moves by more than ten points across the series');

/* ---- derived, from records only ------------------------------------------- */
const pct = Math.round(eflyable / S.flights * 100);
const laps = (S.flightStats.totalPathKm / 40075).toFixed(1);
const floors = {};
for (const [spec, row] of Object.entries(opt.battery_floor)) floors[spec] = row.targets['0.5'].kwh;
const rp = opt.reserve_price.by_reserve_minutes['beta-alia'];
const fmt = (n) => n.toLocaleString('en-US');
const NAMES = { 'joby-s4': 'Joby S4', 'archer-midnight': 'Archer Midnight', 'beta-alia': 'Beta ALIA-250', 'eve-100': 'Eve (EVE-100)' };
const RULES = { 'faa-sfar-vfr': 'FAA SFAR 20-min VFR reserve', 'easa-final-reserve': 'EASA 5-min final reserve (necessary condition)' };
const vTag = (v) => v === 'CERTIFIED' ? C.tag('CERTIFIED', 'held') : v === 'REFUTED' ? C.tag('REFUTED', 'open') : C.tag('REFUSED', 'dep');
const top = stories.leaderboard[0];
const andList = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

/* ---- the page ------------------------------------------------------------- */
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · applied front · the app\'s battery + this page\'s cross-checks re-run at every build',
  title: 'SkyAudit: one real helicopter day, decided flight by flight',
  deck: 'On 2026-08-26, New York\'s helicopters flew ' + fmt(S.flights) + ' flights — ' + fmt(S.flightStats.totalPathKm)
    + ' km, ' + laps + '× around the Earth. The UAM industry says electric aircraft will replace exactly this '
    + 'traffic. SkyAudit re-flies every one of those flights on paper with each of four eVTOLs\' public numbers — '
    + 'the makers\' own where they publish them, flagged trade estimates and assumptions where they do not — '
    + 'under the FAA\'s reserve rule, and DECIDES each case by interval arithmetic: E-FLYABLE for every '
    + 'parameter point in the boxes, BEYOND RANGE with an exact falsifying witness, or NEEDS DATA where the '
    + 'public numbers cannot say. This page is the citable methodology behind the app — the interface lives at '
    + '/apps/skyaudit/. Mathematically certified enclosures; no airworthiness meaning anywhere on either page.'
}));

B.push(C.tldr({
  findingRaw: 'Of ' + fmt(S.flights) + ' real flights, exactly ' + eflyable + ' (' + pct + '%) are PROVABLY '
    + 'flyable electric today — all by Beta\'s ALIA-250, whose public numbers are the most decidable of the four — '
    + 'and those ' + eflyable + ' flights need EXACTLY ' + refly.keys[BETA].fleetMin + ' aircraft (both directions '
    + 'proved). Joby, Archer and Eve: zero provable flights each. Their own public numbers prove '
    + andList(refutedFaa.map((n, i) => n + ' (' + NAMES[OTHERS[i]].split(' ')[0] + ')')) + ' of the day\'s flights BEYOND RANGE '
    + 'and cannot decide the rest (' + andList(needsFaa.map(String)) + ' flights of NEEDS DATA) — measured opacity. '
    + 'The provable subset\'s electricity costs '
    + '$' + fmt(eUsd[0]) + '–' + fmt(eUsd[1]) + ' against '
    + '$' + fmt(fUsd[0]) + '–' + fmt(fUsd[1])
    + ' of Jet-A for the same flights' + (DISJOINT ? ' — disjoint intervals' : '') + ', <em>given the price and burn boxes of §5</em>.',
  mechanismRaw: 'Each flight\'s observed distance meets each aircraft\'s parameter BOXES (mass, battery, '
    + 'speed, disk loading — each flagged manufacturer, trade, estimate or assumption) through a momentum-theory power model with outward-rounded interval '
    + 'arithmetic. A universal verdict needs one comparison each way: worst corner clears — E-FLYABLE; best corner '
    + 'fails — BEYOND RANGE, with the most favorable corner re-proved negative in exact rationals as the witness; '
    + 'a straddle — NEEDS DATA, never averaged. An independent stdlib-Python verifier re-proves the ledger with '
    + 'zero dependencies. What a verdict rests on, and how far each premise was checked, is at the end of §2.',
  checkRaw: C.m('node apps/skyaudit/build.js') + ' from a clone — ' + nGates + ' gates, battery ' + nChecks + ' checks; '
    + 'this page recounted all ' + fmt(S.rows + S2.rows) + ' certificate rows (both pinned days) from the '
    + 'ledgers at its own build.'
}));

B.push(C.stats([
  { k: 'the day of record', v: '2026-08-26 · NYC', n: fmt(S.uniqueAircraft) + ' unique aircraft · ' + fmt(S.flights) + ' flights · ' + fmt(S.rows) + ' certificate rows (4 aircraft × 2 rules per flight) — São Paulo runs as pack #2: ' + fmt(SP.flights) + ' flights, ' + fmt(SP.rows) + ' rows' },
  { k: 'provably electric', v: eflyable + ' flights (' + pct + '%)', role: 'held', n: 'Beta ALIA-250 under the FAA 20-minute VFR reserve — every certificate a worst-corner proof over its parameter boxes' },
  { k: 'minimum fleet, proved', v: 'exactly ' + refly.keys[BETA].fleetMin + ' aircraft', role: 'held', n: refly.keys[BETA].fleetMin - 1 + ' REFUTED by pigeonhole at a witnessed instant (' + refly.keys[BETA].witnessLocal + '); ' + refly.keys[BETA].fleetMin + ' CERTIFIED by an exactly-verified schedule' },
  { k: 'the opacity finding', v: 'Joby · Archer · Eve: 0 provable', role: 'warn', n: 'NEEDS DATA dominates their ledgers (' + andList(needsFaa.map(String)) + ' of ' + fmt(S.flights) + ' flights under the FAA rule; ' + andList(refutedFaa.map(String)) + ' proved BEYOND RANGE) — the audit measures what public specs cannot decide, and says so instead of guessing' },
  { k: 'authoritative identity', v: regNyc.counts.matched + '/' + regNyc.counts.corpus + ' + ' + regSp.counts.matched + '/' + regSp.counts.corpus + ' joined', role: 'held', n: 'FAA Releasable Aircraft DB + ANAC RAB, sha-pinned; registry-first typing changed corpus membership NOWHERE — the numbers stand on authority, unmatched aircraft listed one by one' },
  { k: 'day-stability, measured', v: lo(WEEK).toFixed(1) + '% – ' + hi(WEEK).toFixed(1) + '% across ' + WEEK.length + ' days', role: 'held', n: 'the audit was run over ' + WEEK.length + ' consecutive days; the STRUCTURE holds on every one — only Beta provable, the others zero — while the provable share moves by more than ten points, so the headline is a property of its day; §7 shows the whole series' },
  { k: 'what this is not', v: 'no airworthiness claim', role: 'warn', n: '"certified" is a mathematical statement about stated boxes and exact arithmetic — never a regulatory status, an endorsement, or a judgment of any operator\'s mission' }
]));

/* ---- the reserve ladder --------------------------------------------------
   The one chart this day earns. Four aircraft, one axis, and the shape IS the
   finding: three of them are at zero before the rule's own reserve begins, and
   the fourth walks down to zero at 30 minutes. Emphasis, not four hues — the
   story is one line and three that never leave the floor.

   WARRANT, 2026-10-28: each knot is a re-decision of the whole day at that reserve — DECIDED, a solid dot. Between two
   knots nothing was decided, so the joining line is CHOSEN and dotted, drawn through W.attrs; the wash that filled
   under Beta's line asserted the same in-between counts and is gone, and Beta's emphasis is carried by weight, opacity
   and its larger dots (design/grammar.js IDENTITY). charts.lines draws only solid or dashed, so the figure is drawn on
   its frame here. */
{
  const MINS = [5, 10, 15, 20, 25, 30];
  const RL = opt.reserve_price.by_reserve_minutes;
  const NAME = { 'beta-alia': 'Beta ALIA-250', 'joby-s4': 'Joby S4',
                 'archer-midnight': 'Archer Midnight', 'eve-100': 'Eve 100' };
  /* the keys and the caption name these shapes; the build checks them */
  for (const k of OTHERS) if (MINS.some((m) => m >= 15 && RL[k][String(m)] !== 0)) die(k + ' is no longer zero from 15 minutes on');
  if (!(RL['beta-alia']['15'] > 0)) die('Beta is no longer provable past 10 minutes');
  if (RL['beta-alia']['20'] !== eflyable) die('the ladder at 20 minutes is not the day\'s certified count');
  const rule = S.flights;
  const o = { w: 900, h: 320, x0: 5, x1: 30, y0: 0, y1: Math.max(rule, RL['beta-alia']['5']) * 1.06,
    xTicks: MINS.map(m => ({ v: m, t: m + ' min' })), yTicks: [0, 100, 200, 300, rule].map(v => ({ v, t: fmt(v) })),
    xLabel: 'energy reserve held back at cruise power  (the FAA VFR rule sits at 20 minutes)', yLabel: 'flights PROVABLY flyable' };
  const keys = [
    { t: NAME['beta-alia'] + ' — the only aircraft provable past 10 minutes', width: 2.4, opacity: 0.95, r: 4.5, tok: 'var(--c-1)' },
    { t: 'Joby S4 · Archer Midnight · Eve 100 — zero from 15 minutes on', width: 1.6, opacity: 0.42, r: 3, tok: 'var(--c-ctx)' }];
  const f = CH.frame(Object.assign({}, o, { padB: 28 + 22 + 5 + keys.length * 19 }));
  const out = [CH.open({ w: f.w, h: f.h, alt: 'Certified flights against the reserve held back, decided at 5, 10, 15, 20, 25 and 30 minutes. Beta ALIA-250 falls from '
      + RL['beta-alia']['5'] + ' at 5 minutes through ' + RL['beta-alia']['20'] + ' at the FAA\'s 20 minutes to '
      + RL['beta-alia']['30'] + ' at 30. Joby, Archer and Eve are at ' + andList(OTHERS.map((k) => RL[k]['10'])) + ' by 10 minutes and on zero after that. '
      + 'The dots are decided; the dotted lines between them only join them.' })];
  out.push('    <rect x="' + f.px(19.4).toFixed(1) + '" y="' + f.T + '" width="' + (f.px(20.6) - f.px(19.4)).toFixed(1) + '" height="' + f.ph + '" fill="var(--c-grid)"/>');
  out.push(CH.txt(f.px(20.6) + 7, f.T + 13, 'the rule', 't-note', 'start'));
  out.push(CH.axes(f, o));
  out.push('    <line x1="' + f.L + '" y1="' + f.py(rule).toFixed(1) + '" x2="' + (f.L + f.pw) + '" y2="' + f.py(rule).toFixed(1) + '" stroke="var(--c-grid)" stroke-width="1"/>');
  out.push(CH.txt(f.L + f.pw - 4, f.py(rule) - 6, 'all ' + fmt(rule) + ' flights in the day', 't-note', 'end'));
  const ser = OTHERS.map((k) => ({ k, key: keys[1] })).concat([{ k: 'beta-alia', key: keys[0] }]);
  for (const s of ser) {
    const pts = MINS.map((m) => [m, RL[s.k][String(m)]]);
    out.push('    <path d="' + pts.map((p, i) => (i ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[1]).toFixed(2)).join(' ') + '" '
      + W.attrs(W.CHOSEN, { width: s.key.width }) + ' opacity="' + s.key.opacity + '" stroke-linejoin="round"/>');
    for (const p of pts) out.push('    <circle ' + CH.hit('cx="' + f.px(p[0]).toFixed(2) + '" cy="' + f.py(p[1]).toFixed(2) + '" r="' + s.key.r + '" fill="' + s.key.tok + '"',
      NAME[s.k] + ' · reserve ' + p[0] + ' min', p[1] + ' flights certified — decided') + '/>');
  }
  out.push(CH.txt(f.px(30) - 10, f.py(RL['beta-alia']['30']) - 12, String(RL['beta-alia']['30']), 't-lab', 'end'));
  keys.forEach((kk, i) => {
    const y = f.h - 7 - (keys.length - 1 - i) * 19;
    out.push('    <line x1="' + f.L + '" y1="' + (y - 4) + '" x2="' + (f.L + 22) + '" y2="' + (y - 4) + '" ' + W.attrs(W.CHOSEN, { width: kk.width }) + ' opacity="' + kk.opacity + '"/>');
    out.push('    <circle cx="' + (f.L + 11) + '" cy="' + (y - 4) + '" r="' + kk.r + '" fill="' + kk.tok + '"/>');
    out.push(CH.txt(f.L + 30, y, kk.t, 't-note', 'start'));
  });
  out.push(CH.close);
  const fig = out.join('\n');
  B.push(C.section({
    lab: '§0 · the price of the rule', title: 'What a reserve minute actually costs',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('The reserve is the regulator\'s dial, so the honest way to show an energy audit is to sweep it. '
        + 'Every point is a re-decision of the whole day at that reserve — exact-corner proofs over each '
        + 'aircraft\'s parameter boxes, not one model re-scaled.')
      + '</div>'
      + C.figure({ svgRaw: fig, record: ['apps/skyaudit/data/day-2026-08-26/nyc.optimize.json', 'apps/skyaudit/data/day-2026-08-26/nyc.audit-summary.json'], stop: 'Beta is no longer provable past 10 minutes, another aircraft is no longer zero from 15 minutes on, or the ladder at 20 minutes is not the day\'s certified count', caption: 'Beta ALIA-250 covers ' + RL['beta-alia']['5'] + ' of the day\'s '
        + fmt(S.flights) + ' flights with a 5-minute reserve, ' + RL['beta-alia']['20'] + ' at the FAA\'s 20 '
        + 'minutes, ' + RL['beta-alia']['25'] + ' at 25, and ' + RL['beta-alia']['30'] + ' at 30 — the rule as '
        + 'written is close to the edge of what today\'s public specs can prove. The other three publish too '
        + 'little to certify a single flight past 10 minutes, which is a statement about DISCLOSURE, not about '
        + 'their aircraft: the verdict is what their own numbers can be made to prove. The dots are decided, one '
        + 'whole-day re-decision each; the dotted lines only join them, because no reserve between two dots was decided.' })
      + '<div class="col">' + W.legendHtml({ compact: true }) + '</div>'
  }));
}

B.push(C.section({
  lab: '§1 · the corpus', title: 'A pinned day, not a sample',
  bodyRaw: [
    C.p('The traffic is adsb.lol\'s open globe history for 2026-08-26 (ODbL), pinned by sha256 at the release-tar '
      + 'level and extracted by a calibrated streaming reader (' + fmt(XS.traceFiles) + ' traces, ' + XS.parseErrors + ' parse errors, dual-bbox split for '
      + 'NYC and São Paulo). An aircraft seen by both ADS-B and MLAT appears twice in the raw bytes; auditing '
      + 'dedupes to the richest trace per airframe in one place, and public counts always use the deduped number. '
      + 'Flights come from a certified segmentation with a monotonic-time contract — a scrambled trace throws, a '
      + FL.GAP_SPLIT_S + '-second gap splits, ' + FL.GROUND_END_S + ' seconds of ground contact closes a flight — and every truncation the receiver '
      + 'network caused is flagged on the flight it touched, never smoothed over.'),
    C.p('Which aircraft count as helicopters is decided by ONE function, and since the registry joins it answers '
      + 'from authority first: the FAA Releasable Aircraft Database (joined by Mode S hex and N-number) and '
      + 'Brazil\'s ANAC RAB (joined by registration mark) supply the authoritative type — FAA TYPE-ACFT 6, ANAC '
      + 'class H — with the trace\'s own type designator deciding only for unmatched aircraft (military serials, '
      + 'one Canadian, a handful of reg-less transponders; each listed in the committed extract). On the pinned '
      + 'day the registries CONFIRM the trace filter exactly: membership changed nowhere, so '
      + fmt(S.uniqueAircraft) + '/' + fmt(S.flights) + '/' + fmt(S.rows) + ' stand — on authority instead of '
      + 'feeder typing. The two jets squawking helicopter category (an A320 and a BD-500) are now excluded by '
      + 'the registry, not by a hand-kept list.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · the counterfactual', title: 'Precisely what question each certificate answers',
  bodyRaw: [
    C.p('Each certificate decides: "if THIS observed flight — its distance box, with stated pads — were flown by '
      + 'THAT eVTOL, flying its own speed box, does the energy used plus the rule\'s reserve fit inside '
      + 'usable battery, for EVERY parameter point in the boxes?" The eVTOL flies its own speeds over the '
      + 'helicopter\'s route; it is not asked to imitate a helicopter. Power comes from the momentum-theory model '
      + 'of Kasliwal et al. 2019 (Nature Communications), calibrated in the battery against that paper\'s own '
      + 'worked examples; physics unknowns (efficiencies, air density, hover budget) are stated boxes, padded '
      + 'outward.'),
    C.p('The spec packs carry each aircraft\'s public numbers, each box flagged at the field level by where it '
      + 'comes from — the manufacturer, trade press attributing the manufacturer, an estimate, or an assumption where '
      + 'nothing is published. No maker in the set publishes its battery\'s capacity: every battery box is an estimate '
      + 'or an assumption. Eve publishes least, so Eve\'s pack is nearly all assumption and its '
      + 'ledger is nearly all NEEDS DATA: the audit measures ignorance rather than papering over it. Two reserve '
      + 'rules run side by side: the FAA powered-lift SFAR\'s 20-minute VFR tier, and EASA\'s 5-minute final '
      + 'reserve — the latter honestly labeled a NECESSARY condition only, since the full EASA energy-management '
      + 'package is not reducible to one number. The São Paulo city pack decides under Brazil\'s own rule '
      + 'instead: ANAC RBAC 91.151(b) — 20 minutes at normal cruise consumption, quoted from ANAC\'s pinned '
      + 'text — arithmetically the FAA tier, separately cited, because the jurisdiction is the point.'),
    /* WARRANT rule 11: the premise chain, each grade read from what this build ran or loaded */
    '<div class="col">' + C.pRaw('Every verdict is exact about its boxes. What it says about an aircraft flying that route rests on '
      + 'premises the arithmetic cannot reach. In the order a verdict travels through them, each with the rung its checking '
      + 'reached — <b>validated</b> (against the thing itself, held out), <b>compared</b> (against a model that keeps more), '
      + '<b>verified</b> (the code against an exact solution of its own equations) or <b>assumed</b> (adopted; nothing here checked it):')
    + PREM([
      { grade: W.ASSUMED, label: 'The route, as the receivers saw it',
        evidence: 'adsb.lol\'s pinned day, segmented by the battery-checked rules above (a ' + FL.GAP_SPLIT_S + ' s gap splits, ' + FL.GROUND_END_S + ' s on the ground closes a flight; checks 1–5 of apps/skyaudit/battery.js), each flight\'s distance a box with stated pads. The code is checked; the trace against the aircraft\'s real path is not, and gaps are flagged rather than filled.' },
      { grade: W.ASSUMED, label: 'The counterfactual',
        evidence: 'the eVTOL flies the helicopter\'s route at its own cruise-speed box. That this is the mission an operator would fly is the question\'s premise, not a finding.' },
      { grade: W.ASSUMED, label: 'The aircraft, as boxes',
        evidence: 'of the ' + Object.values(qCount).reduce((a, b) => a + b, 0) + ' boxes in the four spec packs, '
          + andList(Object.entries(qCount).sort((a, b) => b[1] - a[1]).map(([q, n]) => n + ' ' + (QWORD[q] || q))) + ' (apps/skyaudit/scenario/specs). Taken as stated; nothing here measured an aircraft.' },
      { grade: W.ASSUMED, label: 'Momentum theory as these aircraft\'s physics',
        evidence: 'hover and cruise power from Kasliwal et al. 2019 with its efficiency, lift-to-drag and air-density boxes (apps/skyaudit/scenario/physics/kasliwal-2019.json). Whether it describes Joby\'s, Archer\'s, Beta\'s or Eve\'s aircraft has not been held against a measured flight.' },
      { grade: W.VERIFIED, label: 'The power model\'s code',
        evidence: 'it reproduces the paper\'s own worked examples (hover and cruise power, and the cruise energy over its example distance), and the instrument bridge reproduces three hand-computed dyadic verdicts exactly (apps/skyaudit/battery.js, ' + nChecks + ' checks, run at this build). An independent Python verifier re-proves the ledger in exact fractions.' },
      { grade: W.ASSUMED, label: 'The reserve rule',
        evidence: 'the SFAR\'s 20-minute tier is granted only where the flight manual shows a vertical landing is possible along the whole route; the audit assumes that condition is met for every flight and states it (apps/skyaudit/scenario/rules/faa-sfar-vfr.json). EASA\'s 5-minute final reserve is a necessary condition only.' },
    ], { meetLine: 'The arithmetic is verified; the weakest premise is <b>assumed</b>. A verdict here is exact <em>given the route, the boxes, '
      + 'momentum theory and the rule</em>: E-FLYABLE means the stated boxes prove it, BEYOND RANGE that they refute it, and neither is a statement about an aircraft that has flown the route.' }) + '</div>'
  ].join('\n')
}));

B.push(C.section({
  lab: '§3 · the verdicts', title: 'The day\'s ledger, recounted at this build', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'aircraft (published pack)' }, { h: 'rule' }, { h: 'E-FLYABLE', cls: 'n' }, { h: 'BEYOND RANGE', cls: 'n' }, { h: 'NEEDS DATA', cls: 'n' }],
    rows: Object.entries(S.bySpecRule).map(([k, v]) => {
      const [spec, rule] = k.split('|');
      return [NAMES[spec], RULES[rule], String(v.CERTIFIED || 0), String(v.REFUTED || 0), String(v.REFUSED || 0)];
    })
  })
    + '<div class="col">' + C.pRaw('Surface labels map to verdict classes one-to-one: E-FLYABLE = CERTIFIED '
      + '(worst corner clears), BEYOND RANGE = REFUTED (best corner fails; the certificate carries the most '
      + 'favorable corner re-proved negative in exact rationals), NEEDS DATA = REFUSED (the boxes straddle the '
      + 'floor and no honest instrument can say more). The REFUSED mass is a FINDING, not a failure: it measures '
      + 'public-spec opacity and the very reserve conservatism the industry itself contests in the FAA docket. '
      + 'Archer\'s ' + S.bySpecRule['archer-midnight|faa-sfar-vfr'].REFUTED + ' refutations under the FAA rule are '
      + 'exact witnesses, and unsurprising: its design mission is 20-mile hops, and New York\'s tour and charter '
      + 'days exceed it.') + '</div>'
}));

B.push(C.section({
  lab: '§4 · the fleet, the thresholds', title: 'Answers with proofs on both sides',
  bodyRaw: [
    C.p('RE-FLY THE DAY: holding the ' + eflyable + ' provable departures fixed and modeling charge occupancy '
      + 'from worst-corner depth against the charge box, the minimum fleet is EXACT: '
      + (refly.keys[BETA].fleetMin - 1) + ' aircraft are REFUTED by pigeonhole at a witnessed instant, '
      + refly.keys[BETA].fleetMin + ' are CERTIFIED by a greedy schedule verified exactly. Zero randomness; the '
      + 'timeline hashes into the record.'),
    C.p('The certified thresholds, each proved on both sides of the flip: battery floors for half-day coverage — '
      + 'Joby needs ' + floors['joby-s4'] + ' kWh nameplate against ' + boxWords('joby-s4') + ', Archer '
      + floors['archer-midnight'] + ' against ' + boxWords('archer-midnight') + ', Beta ' + floors['beta-alia'] + ' against ' + boxWords('beta-alia') + ' (the only floor inside its '
      + 'own box), Eve ' + floors['eve-100'] + ' against ' + boxWords('eve-100') + ' — none of them a number its maker publishes; the gap between trade-press narrative and provable '
      + 'coverage, priced in kWh. The charge lever, read straight from the certified curve: '
      + opt.charge_lever.curve.map((c, i) => {
        const next = opt.charge_lever.curve[i + 1];
        const span = next ? c.from_minutes + '–' + (next.from_minutes - 1) : c.from_minutes + '+';
        return c.fleetMin + ' aircraft at ' + span + ' min to full';
      }).join(', ')
      + ' — faster chargers are provably worth ' + (opt.charge_lever.curve[opt.charge_lever.curve.length - 1].fleetMin
        - opt.charge_lever.curve[0].fleetMin) + ' aircraft across the charge box. And the '
      + 'reserve price: Beta\'s provable legs at 5/10/15/20/25/30 minutes of reserve are '
      + [5, 10, 15, 20, 25, 30].map((m) => rp[m]).join('/')
      + (rp[30] === 0 ? ' — at a 30-minute reserve NOTHING on this day is provable. That is the FAA docket fight, priced flight by flight.'
        : ' — the reserve rule prices provable service flight by flight: the FAA docket fight, quantified.'))
  ].join('\n')
}));

B.push(C.section({
  lab: '§5 · the economics', title: 'The electric bill, decided where it can be',
  bodyRaw: C.pRaw('The day\'s helicopters burned ' + fmt(econ.fuel.liters[0]) + '–' + fmt(econ.fuel.liters[1])
    + ' liters of Jet-A ($' + fmt(econ.fuel.usd[0]) + '–' + fmt(econ.fuel.usd[1]) + ', '
    + econ.fuel.co2_tonnes[0] + '–' + econ.fuel.co2_tonnes[1] + ' tonnes CO₂) — from per-type class burn boxes, '
    + 'flagged as estimates. The ' + eflyable + ' provable flights are different arithmetic: their energy is the '
    + 'certified used-enclosure sum — decided, not projected — and costs $' + fmt(econ.electric_subset.usd[0])
    + '–' + fmt(econ.electric_subset.usd[1]) + ' of electricity against $'
    + fmt(econ.electric_subset.same_flights_fuel.usd[0]) + '–' + fmt(econ.electric_subset.same_flights_fuel.usd[1])
    + ' of fuel for the SAME flights.' + (DISJOINT ? ' The intervals are disjoint, and the page only says so because the '
    + 'comparison is computed at build — the sentence disappears if the data stops supporting it.' : '')
    + ' Both bills are exact sums over boxes taken as given — the burn boxes per helicopter class and the price boxes '
    + 'for fuel and electricity (apps/skyaudit/scenario/fuel-rates.json, every number a public class estimate) — so each holds <em>given those boxes</em>.')
}));

B.push(C.section({
  lab: '§6 · honest boundaries', title: 'Methodology v2, and what it still does not claim',
  bodyRaw: [
    C.p('METHODOLOGY V2 (2026-08-27) — the recorded v1 conservatisms were resolved together, in one disclosed '
      + 'move, exactly as promised. What changed: (1) cruise energy is now evaluated V-FREE — at every parameter '
      + 'point t·P(V) = m·g·D/((L/D)·η) and the speed cancels exactly, so v1\'s independent enclosure of power '
      + 'and time was a sound over-enclosure (up to ' + V1_SLACK + '% at the widest cruise box); removing it is a tightness '
      + 'theorem, not a relaxed assumption, and the independent Python verifier re-proves the same identity. '
      + '(2) Mission mass became an operating-mass box [published empty weight + pilot, MTOW] — Joby publishes '
      + 'empty weight, Archer and Beta publish payload; the strict MTOW corner still decides E-FLYABLE, so the '
      + 'floor only weakens refutations honestly. What was REVIEWED AND REFUSED BY THE DATA: reserve power at '
      + '"normal cruising speed" — no audited maker publishes a normal cruise (only "up to" maxima), so the '
      + 'reserve keeps the full cruise-speed box; and per-aircraft disk loading — rotor geometry is unpublished '
      + 'for all four (only VoloCity, outside this set, has an official datasheet), so the class boxes stand. '
      + 'THE DELTA, quoted as history (git a07be1f): v1 certified ' + v1Cert + ' of these ' + fmt(S.flights) + ' flights '
      + '(' + Math.round(100 * v1Cert / S.flights) + '%); v2 decides ' + eflyable + ' (' + pct + '%) — the interval slack was hiding half the provable '
      + 'day, and this paragraph is the disclosure.'),
    C.p('One Wednesday is one Wednesday — which is why §7 runs the same audit over ' + WEEK.length + ' consecutive days instead of assuming '
      + 'stability. The corpus is what the receiver network saw — coverage gaps are flagged '
      + 'per flight, never interpolated. Operation-type labels in the app (tour loop, patrol, shuttle) are '
      + 'heuristics, labeled INFERRED, and judge nobody\'s mission. Names come from the registries and mean what '
      + 'the registries mean: the FAA publishes the REGISTRANT ("registered to" — often an LLC, not necessarily '
      + 'who operates), ANAC publishes the operador. And nothing here carries airworthiness meaning: every '
      + '"certified" is a statement about interval arithmetic over the stated boxes.')
  ].join('\n')
}));

/* §7 — the whole series first, the controlled pair second */
const wkFig = CH.bars({
  w: 900, max: Math.max(...WEEK.map(r => r.pct)) * 1.18, padL: 108,
  rows: WEEK.map(r => ({
    k: r.dowName + ' ' + r.date.slice(5),
    v: r.pct,
    lab: r.pct.toFixed(1) + '%  (' + r.eflyable + ' of ' + fmt(r.flights) + ')',
    token: r.weekend ? 'var(--c-2)' : 'var(--c-1)',
    hover: r.dowName + ' ' + r.date + ': ' + r.eflyable + ' of ' + fmt(r.flights) + ' flights provable',
  })),
  xTicks: [0, 10, 20, 30].map(v => ({ v, t: v + '%' })),
  xLabel: 'share of the day\'s flights PROVABLY flyable — Beta ALIA-250 under the FAA 20-minute VFR reserve',
  keys: [{ token: 'var(--c-1)', t: 'Monday–Friday' },
         { token: 'var(--c-2)', t: 'Saturday · Sunday' }],
  alt: 'Provable share for each of seven consecutive days: '
    + WEEK.map(r => r.dowName + ' ' + r.pct.toFixed(1) + '%').join(', ')
    + '. The highest is ' + WEEK[peakIx].dowName + ' at ' + WEEK[peakIx].pct.toFixed(1)
    + '% and the lowest is ' + WEEK.reduce((a, b) => (b.pct < a.pct ? b : a)).pct.toFixed(1) + '%.',
});
B.push(C.section({
  lab: '§7 · day-stability', title: 'The same audit, ' + WEEK.length + ' consecutive days', wide: true,
  bodyRaw: '<div class="col">'
    + C.pRaw('One Wednesday proves nothing about a Tuesday, so the audit was run over '
      + fmt(WEEK.length) + ' consecutive days, each ingested from its own sha-pinned adsb.lol release, each '
      + 'certified independently, and each recounted from its own committed certificate ledger as a gate on '
      + 'this build. Nothing here is modelled or interpolated: every row is a day that was actually flown.')
    + '</div>'
    + C.figure({ svgRaw: wkFig, caption: 'The provable share moves across the series by '
      + (hi(WEEK) - lo(WEEK)).toFixed(1) + ' points — from ' + hi(WEEK).toFixed(1) + '% down to '
      + lo(WEEK).toFixed(1) + '%. The headline ' + pct + '% is a property of the pinned Wednesday, '
      + 'not a constant.' })
    + C.table({
      cols: [{ h: 'day' }, { h: 'flights', cls: 'n' }, { h: 'certificate rows', cls: 'n' },
             { h: 'aircraft', cls: 'n' }, { h: 'E-FLYABLE', cls: 'n' }, { h: 'share', cls: 'n' },
             { h: 'min fleet', cls: 'n' }],
      rows: WEEK.map(r => [r.dowName + ' ' + r.date, fmt(r.flights), fmt(r.rows), fmt(r.uniqueAircraft),
        String(r.eflyable), r.pct.toFixed(1) + '%', 'exactly ' + r.fleetMin]),
    })
    + '<div class="col">'
    + C.pRaw('<strong>What the week shows, computed rather than asserted.</strong> The share peaks on '
      + WEEK[peakIx].dowName + ' at ' + WEEK[peakIx].pct.toFixed(1) + '% and then falls on every following day '
      + 'without exception, down to ' + RUN[RUN.length - 1].pct.toFixed(1) + '% on '
      + RUN[RUN.length - 1].dowName + ' — a run of ' + RUN.length + ' days'
      + (monotone ? ', which is every day from the peak to the end of the series' : '') + '. '
      + (splitHolds
        ? ('A weekday/weekend split also separates these days, but only just: the lowest weekday ('
          + wkDay.reduce((a, b) => (b.pct < a.pct ? b : a)).dowName + ', ' + lo(wkDay).toFixed(1)
          + '%) sits <strong>' + (lo(wkDay) - hi(wkEnd)).toFixed(1) + ' points</strong> above the highest '
          + 'weekend day (' + wkEnd.reduce((a, b) => (b.pct > a.pct ? b : a)).dowName + ', '
          + hi(wkEnd).toFixed(1) + '%). That margin is far too thin to carry weight, and the Friday that '
          + 'defines it is nearer the weekend than to any other weekday.')
        : ('A weekday/weekend split does NOT separate these days: the lowest weekday sits at '
          + lo(wkDay).toFixed(1) + '%, at or below the highest weekend day at ' + hi(wkEnd).toFixed(1) + '%.'))
      + '</p><p>So two readings fit the same ' + WEEK.length + ' numbers — a weekly cycle, and a monotone drift that has '
      + 'nothing to do with the day of the week — and <strong>one week cannot tell them apart</strong>. This '
      + 'page will not pick one. What it does claim is the part that needs no model: on each of these days, '
      + 'that many flights were provably flyable and the rest were not, and the number moved by '
      + (hi(WEEK) - lo(WEEK)).toFixed(1) + ' points across a single week. Any vendor statistic quoted '
      + 'without its day is missing its most '
      + 'important qualifier. The series extends by one row per day through the same one-command ingest, and '
      + 'the reading here will be revised by arithmetic, not by preference, as it does.')
    + '</div>'
}));

B.push(C.section({
  lab: '§7b · the controlled pair', title: 'One variable isolated: the same week, a Sunday', wide: true,
  bodyRaw: C.table({
    cols: [{ h: '' }, { h: 'Wednesday 2026-08-26 (record)', cls: 'n' }, { h: 'Sunday 2026-08-23 (contrast)', cls: 'n' }],
    rows: [
      ['unique aircraft (audited)', fmt(cmp.summary.uniqueAircraft.record) + ' (' + fmt(cmp.summary.audited.record) + ')', fmt(cmp.summary.uniqueAircraft.contrast) + ' (' + fmt(cmp.summary.audited.contrast) + ')'],
      ['flights · certificate rows', fmt(cmp.summary.flights.record) + ' · ' + fmt(cmp.summary.rows.record), fmt(cmp.summary.flights.contrast) + ' · ' + fmt(cmp.summary.rows.contrast)],
      ['km flown (audited paths)', fmt(cmp.summary.totalPathKm.record), fmt(cmp.summary.totalPathKm.contrast)],
      ['E-FLYABLE (Beta ALIA, FAA 20-min)', cmp.eflyable.record + ' (' + cmp.eflyable.pct.record + '%)', cmp.eflyable.contrast + ' (' + cmp.eflyable.pct.contrast + '%)'],
      ['minimum fleet, proved both directions', 'exactly ' + cmp.fleet.fleetMin.record, 'exactly ' + cmp.fleet.fleetMin.contrast],
      ['Joby / Archer / Eve provable flights', OTHERS.map((k) => S.bySpecRule[k + '|faa-sfar-vfr'].CERTIFIED).join(' / '), OTHERS.map((k) => S2.bySpecRule[k + '|faa-sfar-vfr'].CERTIFIED).join(' / ')],
    ]
  })
    + '<div class="col">' + C.pRaw('The contrast day was chosen to isolate one variable: a Sunday in the SAME '
      + 'week, season and receiver network as the Wednesday of record. What holds across both days is the '
      + 'STRUCTURE: only Beta\'s public numbers prove anything; Joby, Archer and Eve decide zero flights on '
      + 'either day; Archer\'s refutation pattern and Eve\'s NEEDS-DATA wall repeat. What moves with the day is '
      + 'the magnitude: Sunday flies ' + (2 * cmp.summary.flights.contrast < cmp.summary.flights.record ? 'less than half' : 'fewer flights than') + ' the Wednesday (' + fmt(cmp.summary.flights.contrast) + ' vs '
      + fmt(cmp.summary.flights.record) + ' flights) and its provable share is ' + cmp.eflyable.pct.contrast
      + '% against ' + cmp.eflyable.pct.record + '% — the ' + pct + '% headline is a property of the pinned '
      + 'Wednesday, not a universal constant, and this page will not pretend otherwise. The comparison is derived only from '
      + 'the two committed summaries and re-derived at every build. A bonus finding from the contrast day: the '
      + 'feed\'s type database called N339LL a ' + C.esc(N339.feeder) + ' turboprop; the FAA registry says ' + C.esc(reg339.mfr.split(' ')[0].charAt(0) + reg339.mfr.split(' ')[0].slice(1).toLowerCase() + ' ' + reg339.model) + ' — '
      + 'and its measured day (median ' + N339.gsMed + ' kt ground speed, highest report ' + fmt(N339.altMax) + ' ft) agrees with the registry, so the authoritative '
      + 'filter admitted a real helicopter the feeder typing would have dropped.') + '</div>'
}));

B.push(C.section({
  lab: '§8 · sources and rerun', title: 'Every dataset pinned, every gate rerunnable', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'dataset' }, { h: 'license' }, { h: 'pinned' }, { h: 'sha256 (prefix)' }],
    rows: [
      ['adsb.lol globe history 2026-08-26 (4 release assets)', 'ODbL-1.0', 'day-2026-08-26/PINS.json',
        dayPins.assets_sha256['v2026.08.26-planes-readsb-prod-0.tar.aa'].slice(0, 12) + '… (+3)'],
      ['adsb.lol globe history 2026-08-23 — the contrast day (3 assets)', 'ODbL-1.0', 'day-2026-08-23/PINS.json',
        day2Pins.assets_sha256['v2026.08.23-planes-readsb-prod-0.tar.aa'].slice(0, 12) + '… (+2)'],
      ['FAA Releasable Aircraft Database', 'public domain', 'registry/REGISTRY-PINS.json · acquired ' + regPins.raw['ReleasableAircraft.zip'].acquired,
        regPins.raw['ReleasableAircraft.zip'].sha256.slice(0, 12) + '…'],
      ['ANAC RAB dados_aeronaves.csv', 'ANAC dados abertos', 'registry/REGISTRY-PINS.json · dataset ' + regPins.raw['dados_aeronaves.csv'].dataset_date,
        regPins.raw['dados_aeronaves.csv'].sha256.slice(0, 12) + '…'],
      [Object.keys(srcPins.files).length + ' rule/spec/physics source PDFs (FAA SFAR, SC-VTOL + MOCs, Kasliwal 2019, ANAC criteria, …)', 'cited', 'sources/SOURCES-PINS.json', 'per-file'],
    ]
  })
    + '<div class="col">' + C.pRaw('Licenses stay separated: code MIT, traffic corpora ODbL, FAA data public '
      + 'domain, ANAC open data — pins beside every dataset. Rerun: ' + C.m('node apps/skyaudit/build.js')
      + ' runs all ' + nGates + ' gates (battery incl. red controls that must fire, day re-certified and compared, fleet '
      + 'frontier re-derived, thresholds re-proved, economics recomputed, stories re-told, planner re-planned, '
      + 'tiles and registry extracts hash-checked, the forecast ledger recounted). The independent verifier ' + C.m('python3 apps/skyaudit/audit/verify_skyaudit.py')
      + ' re-proves the ledger in exact fractions with zero dependencies. The app: '
      + '<a href="/apps/skyaudit/">carlostoledo.co/apps/skyaudit</a>.') + '</div>'
}));

const foot = '<p>Generated by tools/build-report-skyaudit.js @ git ' + git + '. Gates at this '
  + 'build: the app battery (' + nChecks + ' checks, red controls fired), all ' + fmt(S.rows) + ' + ' + fmt(S2.rows)
  + ' certificate rows recounted from every day\'s own ledger (' + WEEK.length + ' days), verdict tallies re-derived, the day-stability '
  + 'comparison re-derived from the committed summaries, cross-record consistency (economics = refly = '
  + 'reserve-price at 20 min = the certified count) and registry closure re-verified — the build refuses on any '
  + 'deviation. App: apps/skyaudit · live at /apps/skyaudit/.</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'skyaudit.html'),
  TPL.render({ title: 'SkyAudit: the helicopter day, decided', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/skyaudit.html',
    desc: 'SkyAudit\'s citable methodology: one pinned day of New York helicopter traffic re-flown on paper by four eVTOLs\' public numbers under the FAA reserve rule — every flight decided or honestly refused.' }));
console.log('reports/skyaudit.html written: ' + S.rows + ' rows recounted, ' + eflyable + ' E-FLYABLE ('
  + pct + '%), fleet ' + refly.keys[BETA].fleetMin + ', battery ' + nChecks + ' checks @ git ' + git);
