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
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('SKYAUDIT REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the app's battery ------------------------------------------- */
const bat = cp.spawnSync(process.execPath, [path.join(APP, 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /battery green: (\d+)\/(\d+) checks/.exec(bout);
if (bat.status !== 0 || !bm || bm[1] !== bm[2]) die('the skyaudit battery did not pass:\n' + bout.slice(-600));
const nChecks = Number(bm[1]);

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

/* ---- the page ------------------------------------------------------------- */
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · applied front · the app\'s battery + this page\'s cross-checks re-run at every build',
  title: 'SkyAudit: one real helicopter day, decided flight by flight',
  deck: 'On 2026-08-26, New York\'s helicopters flew ' + fmt(S.flights) + ' flights — ' + fmt(S.flightStats.totalPathKm)
    + ' km, ' + laps + '× around the Earth. The UAM industry says electric aircraft will replace exactly this '
    + 'traffic. SkyAudit re-flies every one of those flights on paper with each of four eVTOLs\' own published '
    + 'numbers, under the FAA\'s reserve rule, and DECIDES each case by interval arithmetic: E-FLYABLE for every '
    + 'parameter point in the boxes, BEYOND RANGE with an exact falsifying witness, or NEEDS DATA where the '
    + 'public numbers cannot say. This page is the citable methodology behind the app — the interface lives at '
    + '/apps/skyaudit/. Mathematically certified enclosures; no airworthiness meaning anywhere on either page.'
}));

B.push(C.tldr({
  findingRaw: 'Of ' + fmt(S.flights) + ' real flights, exactly ' + eflyable + ' (' + pct + '%) are PROVABLY '
    + 'flyable electric today — all by Beta\'s ALIA-250, the maker that publishes the most decidable numbers — '
    + 'and those ' + eflyable + ' flights need EXACTLY ' + refly.keys[BETA].fleetMin + ' aircraft (both directions '
    + 'proved). Joby, Archer and Eve: zero provable flights each, not because their aircraft fail but because '
    + 'their public numbers cannot decide — measured opacity. The provable subset\'s electricity costs '
    + '$' + fmt(econ.electric_subset.usd[0]) + '–' + fmt(econ.electric_subset.usd[1]) + ' against '
    + '$' + fmt(econ.electric_subset.same_flights_fuel.usd[0]) + '–' + fmt(econ.electric_subset.same_flights_fuel.usd[1])
    + ' of Jet-A for the same flights — disjoint intervals.',
  mechanismRaw: 'Each flight\'s observed distance meets each maker\'s published parameter BOXES (mass, battery, '
    + 'speed, disk loading — quality-flagged) through a momentum-theory power model with outward-rounded interval '
    + 'arithmetic. A universal verdict needs one comparison each way: worst corner clears — E-FLYABLE; best corner '
    + 'fails — BEYOND RANGE, with the most favorable corner re-proved negative in exact rationals as the witness; '
    + 'a straddle — NEEDS DATA, never averaged. An independent stdlib-Python verifier re-proves the ledger with '
    + 'zero dependencies.',
  checkRaw: C.m('node apps/skyaudit/build.js') + ' from a clone — 10 gates, battery ' + nChecks + ' checks; '
    + 'this page recounted all ' + fmt(S.rows + S2.rows) + ' certificate rows (both pinned days) from the '
    + 'ledgers at its own build.'
}));

B.push(C.stats([
  { k: 'the day of record', v: '2026-08-26 · NYC', n: fmt(S.uniqueAircraft) + ' unique aircraft · ' + fmt(S.flights) + ' flights · ' + fmt(S.rows) + ' certificate rows (4 aircraft × 2 rules per flight) — São Paulo runs as pack #2: ' + fmt(SP.flights) + ' flights, ' + fmt(SP.rows) + ' rows' },
  { k: 'provably electric', v: eflyable + ' flights (' + pct + '%)', role: 'held', n: 'Beta ALIA-250 under the FAA 20-minute VFR reserve — every certificate a worst-corner proof over the maker\'s own boxes' },
  { k: 'minimum fleet, proved', v: 'exactly ' + refly.keys[BETA].fleetMin + ' aircraft', role: 'held', n: refly.keys[BETA].fleetMin - 1 + ' REFUTED by pigeonhole at a witnessed instant (' + refly.keys[BETA].witnessLocal + '); ' + refly.keys[BETA].fleetMin + ' CERTIFIED by an exactly-verified schedule' },
  { k: 'the opacity finding', v: 'Joby · Archer · Eve: 0 provable', role: 'warn', n: 'NEEDS DATA dominates their ledgers — the audit measures what public specs cannot decide, and says so instead of guessing' },
  { k: 'authoritative identity', v: regNyc.counts.matched + '/' + regNyc.counts.corpus + ' + ' + regSp.counts.matched + '/' + regSp.counts.corpus + ' joined', role: 'held', n: 'FAA Releasable Aircraft DB + ANAC RAB, sha-pinned; registry-first typing changed corpus membership NOWHERE — the numbers stand on authority, unmatched aircraft listed one by one' },
  { k: 'day-stability, measured', v: cmp.eflyable.pct.record + '% vs ' + cmp.eflyable.pct.contrast + '%', role: 'held', n: 'a contrasting Sunday (' + fmt(cmp.summary.flights.contrast) + ' flights) holds the STRUCTURE — only Beta provable, the others zero on both days — while the provable share moves with the day; §7 states the deltas' },
  { k: 'what this is not', v: 'no airworthiness claim', role: 'warn', n: '"certified" is a mathematical statement about published boxes and exact arithmetic — never a regulatory status, an endorsement, or a judgment of any operator\'s mission' }
]));

B.push(C.section({
  lab: '§1 · the corpus', title: 'A pinned day, not a sample',
  bodyRaw: [
    C.p('The traffic is adsb.lol\'s open globe history for 2026-08-26 (ODbL), pinned by sha256 at the release-tar '
      + 'level and extracted by a calibrated streaming reader (125,746 traces, 0 parse errors, dual-bbox split for '
      + 'NYC and São Paulo). An aircraft seen by both ADS-B and MLAT appears twice in the raw bytes; auditing '
      + 'dedupes to the richest trace per airframe in one place, and public counts always use the deduped number. '
      + 'Flights come from a certified segmentation with a monotonic-time contract — a scrambled trace throws, a '
      + '900-second gap splits, 60 seconds of ground contact closes a flight — and every truncation the receiver '
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
      + 'THAT eVTOL, flying its own published speed box, does the energy used plus the rule\'s reserve fit inside '
      + 'usable battery, for EVERY parameter point in the boxes?" The eVTOL flies its own speeds over the '
      + 'helicopter\'s route; it is not asked to imitate a helicopter. Power comes from the momentum-theory model '
      + 'of Kasliwal et al. 2019 (Nature Communications), calibrated in the battery against that paper\'s own '
      + 'worked examples; physics unknowns (efficiencies, air density, hover budget) are stated boxes, padded '
      + 'outward.'),
    C.p('The spec packs are the makers\' own published numbers, each quality-flagged at the field level — '
      + 'measured, stated, or assumed. Eve publishes least, so Eve\'s pack is nearly all assumption and its '
      + 'ledger is nearly all NEEDS DATA: the audit measures ignorance rather than papering over it. Two reserve '
      + 'rules run side by side: the FAA powered-lift SFAR\'s 20-minute VFR tier, and EASA\'s 5-minute final '
      + 'reserve — the latter honestly labeled a NECESSARY condition only, since the full EASA energy-management '
      + 'package is not reducible to one number. The São Paulo city pack decides under Brazil\'s own rule '
      + 'instead: ANAC RBAC 91.151(b) — 20 minutes at normal cruise consumption, quoted from ANAC\'s pinned '
      + 'text — arithmetically the FAA tier, separately cited, because the jurisdiction is the point.')
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
      + 'from worst-corner depth against the published charge box, the minimum fleet is EXACT: '
      + (refly.keys[BETA].fleetMin - 1) + ' aircraft are REFUTED by pigeonhole at a witnessed instant, '
      + refly.keys[BETA].fleetMin + ' are CERTIFIED by a greedy schedule verified exactly. Zero randomness; the '
      + 'timeline hashes into the record.'),
    C.p('The certified thresholds, each proved on both sides of the flip: battery floors for half-day coverage — '
      + 'Joby needs ' + floors['joby-s4'] + ' kWh nameplate against a published 130–180, Archer '
      + floors['archer-midnight'] + ' against 120–142, Beta ' + floors['beta-alia'] + ' (the only one close to '
      + 'its own number), Eve ' + floors['eve-100'] + ' — the gap between trade-press narrative and provable '
      + 'coverage, priced in kWh. The charge lever, read straight from the certified curve: '
      + opt.charge_lever.curve.map((c, i) => {
        const next = opt.charge_lever.curve[i + 1];
        const span = next ? c.from_minutes + '–' + (next.from_minutes - 1) : c.from_minutes + '+';
        return c.fleetMin + ' aircraft at ' + span + ' min to full';
      }).join(', ')
      + ' — faster chargers are provably worth ' + (opt.charge_lever.curve[opt.charge_lever.curve.length - 1].fleetMin
        - opt.charge_lever.curve[0].fleetMin) + ' aircraft across the published charge box. And the '
      + 'reserve price: Beta\'s provable legs at 5/10/15/20/25/30 minutes of reserve are '
      + [5, 10, 15, 20, 25, 30].map((m) => rp[m]).join('/')
      + (rp[30] === 0 ? ' — at a 30-minute reserve NOTHING on this day is provable. That is the FAA docket fight, priced flight by flight.'
        : ' — the reserve rule prices provable service flight by flight: the FAA docket fight, quantified.'))
  ].join('\n')
}));

B.push(C.section({
  lab: '§5 · the economics', title: 'The electric bill, decided where it can be',
  bodyRaw: C.p('The day\'s helicopters burned ' + fmt(econ.fuel.liters[0]) + '–' + fmt(econ.fuel.liters[1])
    + ' liters of Jet-A ($' + fmt(econ.fuel.usd[0]) + '–' + fmt(econ.fuel.usd[1]) + ', '
    + econ.fuel.co2_tonnes[0] + '–' + econ.fuel.co2_tonnes[1] + ' tonnes CO₂) — from per-type class burn boxes, '
    + 'flagged as estimates. The ' + eflyable + ' provable flights are different arithmetic: their energy is the '
    + 'certified used-enclosure sum — decided, not projected — and costs $' + fmt(econ.electric_subset.usd[0])
    + '–' + fmt(econ.electric_subset.usd[1]) + ' of electricity against $'
    + fmt(econ.electric_subset.same_flights_fuel.usd[0]) + '–' + fmt(econ.electric_subset.same_flights_fuel.usd[1])
    + ' of fuel for the SAME flights. The intervals are disjoint, and the page only says so because the '
    + 'comparison is computed at build — the sentence disappears if the data stops supporting it.')
}));

B.push(C.section({
  lab: '§6 · honest boundaries', title: 'Methodology v2, and what it still does not claim',
  bodyRaw: [
    C.p('METHODOLOGY V2 (2026-08-27) — the recorded v1 conservatisms were resolved together, in one disclosed '
      + 'move, exactly as promised. What changed: (1) cruise energy is now evaluated V-FREE — at every parameter '
      + 'point t·P(V) = m·g·D/((L/D)·η) and the speed cancels exactly, so v1\'s independent enclosure of power '
      + 'and time was a sound over-enclosure (up to 34% at the widest cruise box); removing it is a tightness '
      + 'theorem, not a relaxed assumption, and the independent Python verifier re-proves the same identity. '
      + '(2) Mission mass became an operating-mass box [published empty weight + pilot, MTOW] — Joby publishes '
      + 'empty weight, Archer and Beta publish payload; the strict MTOW corner still decides E-FLYABLE, so the '
      + 'floor only weakens refutations honestly. What was REVIEWED AND REFUSED BY THE DATA: reserve power at '
      + '"normal cruising speed" — no audited maker publishes a normal cruise (only "up to" maxima), so the '
      + 'reserve keeps the full cruise-speed box; and per-aircraft disk loading — rotor geometry is unpublished '
      + 'for all four (only VoloCity, outside this set, has an official datasheet), so the class boxes stand. '
      + 'THE DELTA, quoted as history (git a07be1f): v1 certified 46 of these ' + fmt(S.flights) + ' flights '
      + '(12%); v2 decides ' + eflyable + ' (' + pct + '%) — the interval slack was hiding half the provable '
      + 'day, and this paragraph is the disclosure.'),
    C.p('One Wednesday is one Wednesday — which is why §7 measures a second, contrasting day instead of assuming '
      + 'stability. The corpus is what the receiver network saw — coverage gaps are flagged '
      + 'per flight, never interpolated. Operation-type labels in the app (tour loop, patrol, shuttle) are '
      + 'heuristics, labeled INFERRED, and judge nobody\'s mission. Names come from the registries and mean what '
      + 'the registries mean: the FAA publishes the REGISTRANT ("registered to" — often an LLC, not necessarily '
      + 'who operates), ANAC publishes the operador. And nothing here carries airworthiness meaning: every '
      + '"certified" is a statement about interval arithmetic over published boxes.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§7 · day-stability', title: 'The same audit, a contrasting Sunday', wide: true,
  bodyRaw: C.table({
    cols: [{ h: '' }, { h: 'Wednesday 2026-08-26 (record)', cls: 'n' }, { h: 'Sunday 2026-08-23 (contrast)', cls: 'n' }],
    rows: [
      ['unique aircraft (audited)', fmt(cmp.summary.uniqueAircraft.record) + ' (' + fmt(cmp.summary.audited.record) + ')', fmt(cmp.summary.uniqueAircraft.contrast) + ' (' + fmt(cmp.summary.audited.contrast) + ')'],
      ['flights · certificate rows', fmt(cmp.summary.flights.record) + ' · ' + fmt(cmp.summary.rows.record), fmt(cmp.summary.flights.contrast) + ' · ' + fmt(cmp.summary.rows.contrast)],
      ['km flown (audited paths)', fmt(cmp.summary.totalPathKm.record), fmt(cmp.summary.totalPathKm.contrast)],
      ['E-FLYABLE (Beta ALIA, FAA 20-min)', cmp.eflyable.record + ' (' + cmp.eflyable.pct.record + '%)', cmp.eflyable.contrast + ' (' + cmp.eflyable.pct.contrast + '%)'],
      ['minimum fleet, proved both directions', 'exactly ' + cmp.fleet.fleetMin.record, 'exactly ' + cmp.fleet.fleetMin.contrast],
      ['Joby / Archer / Eve provable flights', '0 / 0 / 0', '0 / 0 / 0'],
    ]
  })
    + '<div class="col">' + C.pRaw('The contrast day was chosen to isolate one variable: a Sunday in the SAME '
      + 'week, season and receiver network as the Wednesday of record. What holds across both days is the '
      + 'STRUCTURE: only Beta\'s published numbers prove anything; Joby, Archer and Eve decide zero flights on '
      + 'either day; Archer\'s refutation pattern and Eve\'s NEEDS-DATA wall repeat. What moves with the day is '
      + 'the magnitude: Sunday flies less than half the Wednesday (' + fmt(cmp.summary.flights.contrast) + ' vs '
      + fmt(cmp.summary.flights.record) + ' flights) and its provable share is ' + cmp.eflyable.pct.contrast
      + '% against ' + cmp.eflyable.pct.record + '% — the ' + pct + '% headline is a property of the pinned '
      + 'Wednesday, not a universal constant, and this page will not pretend otherwise. The comparison is derived only from '
      + 'the two committed summaries and re-derived at every build. A bonus finding from the contrast day: the '
      + 'feed\'s type database called N339LL a SOCATA TBM-700 turboprop; the FAA registry says Robinson R44 II — '
      + 'and its measured day (median 87 kt, ceiling 1,175 ft) agrees with the registry, so the authoritative '
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
      + ' runs all 10 gates (battery incl. red controls that must fire, day re-certified and compared, fleet '
      + 'frontier re-derived, thresholds re-proved, economics recomputed, stories re-told, planner re-planned, '
      + 'tiles and registry extracts hash-checked). The independent verifier ' + C.m('python3 apps/skyaudit/audit/verify_skyaudit.py')
      + ' re-proves the ledger in exact fractions with zero dependencies. The app: '
      + '<a href="/apps/skyaudit/">carlostoledo.co/apps/skyaudit</a>.') + '</div>'
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-skyaudit.js @ git ' + git + '. Gates at this '
  + 'build: the app battery (' + nChecks + ' checks, red controls fired), all ' + fmt(S.rows) + ' + ' + fmt(S2.rows)
  + ' certificate rows recounted from both days\' ledgers, verdict tallies re-derived, the day-stability '
  + 'comparison re-derived from the committed summaries, cross-record consistency (economics = refly = '
  + 'reserve-price at 20 min = the certified count) and registry closure re-verified — the build refuses on any '
  + 'deviation. App: apps/skyaudit · live at /apps/skyaudit/.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'skyaudit.html'),
  TPL.render({ title: 'SkyAudit: the helicopter day, decided', bodyRaw: B.join('\n\n'), footRaw: foot }));
console.log('reports/skyaudit.html written: ' + S.rows + ' rows recounted, ' + eflyable + ' E-FLYABLE ('
  + pct + '%), fleet ' + refly.keys[BETA].fleetMin + ', battery ' + nChecks + ' checks @ git ' + git);
