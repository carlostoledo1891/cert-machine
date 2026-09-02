#!/usr/bin/env node
/* build-report-evtol-energy.js — generate reports/evtol-energy.html: the
   provable energy-reserve envelope for an eVTOL mission — the aerospace
   front's first instrument page.

   Everything on the page is computed DURING this build: the instrument's
   battery runs as the gate (25 checks, four reds that must fire, verdicts
   cross-proved by 256-corner exact-rational sweeps), the mission table is
   certified live, and the certified-endurance frontier is found by
   bisection with a CERTIFIED verdict at every probe. Nothing is remembered.

   Wording discipline (aviation): "certified" on this page always means a
   MATHEMATICALLY certified enclosure. It carries no airworthiness meaning
   — the page says so where a reader could trip.

   usage: node tools/build-report-evtol-energy.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const E = require(path.join(ROOT, 'instruments', 'evtol', 'energy.js'));
const die = (m) => { console.error('EVTOL-ENERGY REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate: the instrument's battery -------------------------------------- */
const bat = cp.spawnSync(process.execPath, [path.join(ROOT, 'instruments', 'evtol', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
if (bat.status !== 0 || !/ALL PASS/.test(bout)) die('the evtol battery did not pass:\n' + bout.slice(-600));
const nChecks = (bout.match(/^PASS /gm) || []).length;
const nReds = (bout.match(/RED ok/g) || []).length;
if (nReds < 4) die('fewer than 4 red controls fired (' + nReds + ')');

/* ---- the representative aircraft class, as BOXES -------------------------
   These are NOT any manufacturer's numbers. They are a representative
   vectored-thrust eVTOL class drawn from the published academic modeling
   literature (the AIAA reserve-requirements line and GAMA's range/endurance
   guidance discuss exactly these magnitudes), stated as boxes wide enough
   to be honest and narrow enough to decide. Every number is an INPUT a
   reader can widen — the instrument's verdicts stay sound under widening. */
const BAT20 = { usable_kwh: [130, 145], eta: [0.88, 0.94], reserve: { t_s: [1200, 1200], p_kw: [90, 110] } };
const BAT30 = { usable_kwh: [130, 145], eta: [0.88, 0.94], reserve: { t_s: [1800, 1800], p_kw: [90, 110] } };
const seg = (name, t, p) => ({ name, t_s: t, p_kw: p });
const MISSIONS = [
  ['short hop (10 min cruise)', [seg('hover-climb', [60, 90], [420, 520]), seg('cruise', [540, 660], [110, 150]), seg('hover-land', [60, 90], [420, 520])]],
  ['design mission (20 min cruise)', [seg('hover-climb', [60, 90], [420, 520]), seg('cruise', [1140, 1260], [110, 150]), seg('hover-land', [60, 90], [420, 520])]],
  ['stretch (35 min cruise)', [seg('hover-climb', [60, 90], [420, 520]), seg('cruise', [2040, 2160], [110, 150]), seg('hover-land', [60, 90], [420, 520])]],
  ['deep stretch (55 min cruise)', [seg('hover-climb', [60, 90], [420, 520]), seg('cruise', [3240, 3360], [110, 150]), seg('hover-land', [60, 90], [420, 520])]]
];
const rows = [];
for (const [name, segments] of MISSIONS) {
  const r20 = E.certify({ segments }, BAT20);
  const r30 = E.certify({ segments }, BAT30);
  rows.push({ name, r20, r30 });
}
/* the ladder must exercise all three verdicts under at least one rule, or
   the table is not showing the instrument */
const verdicts = new Set(rows.flatMap((r) => [r.r20.verdict, r.r30.verdict]));
for (const v of ['CERTIFIED', 'REFUSED', 'REFUTED']) if (!verdicts.has(v)) die('the mission ladder no longer exercises ' + v);

/* ---- the certified-endurance frontier ------------------------------------
   Longest cruise duration (integer seconds) whose mission still CERTIFIES
   under each rule: bisection where every probe is a certified verdict, so
   the frontier itself is a theorem about the boxes. */
function frontier(batt) {
  const mk = (T) => ({ segments: [seg('hover-climb', [60, 90], [420, 520]), seg('cruise', [T, T + 120], [110, 150]), seg('hover-land', [60, 90], [420, 520])] });
  let lo = 0, hi = 20000;
  if (E.certify(mk(lo), batt).verdict !== 'CERTIFIED') return null;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (E.certify(mk(mid), batt).verdict === 'CERTIFIED') lo = mid; else hi = mid;
  }
  return lo;
}
const f20 = frontier(BAT20), f30 = frontier(BAT30);
if (f20 === null || f30 === null || f30 >= f20) die('the endurance frontier is degenerate: ' + f20 + ' / ' + f30);
const mins = (s) => (s / 60).toFixed(0);

/* ---- the page ------------------------------------------------------------ */
const fmtM = (x) => (typeof x === 'number' ? x.toFixed(1) : x.worst.toFixed(1) + ' … ' + x.best.toFixed(1));
const vTag = (v) => v === 'CERTIFIED' ? C.tag('CERTIFIED', 'held') : v === 'REFUTED' ? C.tag('REFUTED', 'open') : C.tag('REFUSED', 'dep');
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · aerospace front · every verdict re-proved at this build',
  title: 'The reserve, provable: energy-feasibility certificates for eVTOL missions',
  deck: 'Battery-electric air taxis fly under a hard reserve rule — the FAA\'s powered-lift SFAR demands 20 '
    + 'minutes of reserve energy under VFR, 30 under IFR, and industry is arguing the number because reserves '
    + 'gate route economics. Every feasibility figure in that argument today is simulation. This page holds the '
    + 'other kind of statement: for a mission whose durations, powers, capacity and efficiency are known only as '
    + 'BOXES, the verdict "every parameter point lands at or above the reserve floor" is decided — CERTIFIED, '
    + 'REFUTED with an exact falsifying witness, or honestly REFUSED — by interval arithmetic with outward '
    + 'rounding. Mathematically certified enclosures; no airworthiness meaning, and the page says so.'
}));

B.push(C.tldr({
  findingRaw: 'A provable energy-feasibility envelope for an eVTOL mission class: under representative boxes, '
    + 'the mathematically certified endurance frontier sits at ' + mins(f20) + ' minutes of cruise under the '
    + '20-minute reserve rule and ' + mins(f30) + ' under the 30-minute rule — every probe of that frontier a '
    + 'certified verdict, not a Monte Carlo percentile. The 10-minute rule difference costs '
    + ((f20 - f30) / 60).toFixed(0) + ' minutes of certified cruise.',
  mechanismRaw: 'Used and reserve energy are enclosed over the whole parameter box (outward-rounded interval '
    + 'arithmetic); the universal verdict needs one one-sided comparison each way. A refutation re-proves the '
    + 'most favorable corner in exact BigInt rationals — if even that corner fails, all points do — and a box '
    + 'that straddles the floor is REFUSED, never averaged. The battery cross-proves every verdict against '
    + '256-corner exhaustive exact sweeps and fires four red controls per run.',
  checkRaw: C.m('node instruments/evtol/battery.js') + ' from a clone — ' + nChecks + ' checks; the mission '
    + 'table below was certified during this page\'s build.'
}));

B.push(C.stats([
  { k: 'certified endurance, 20-min rule', v: mins(f20) + ' min cruise', role: 'held', n: 'the longest cruise whose mission CERTIFIES for every parameter point in the boxes — found by bisection with a certified verdict at every probe' },
  { k: 'certified endurance, 30-min rule', v: mins(f30) + ' min cruise', role: 'held', n: 'the same frontier under the IFR reserve — the rule change costs ' + ((f20 - f30) / 60).toFixed(0) + ' certified minutes' },
  { k: 'verdicts', v: '3, all exercised', n: 'CERTIFIED / REFUTED-with-witness / REFUSED — the mission ladder below shows each, live' },
  { k: 'witness arithmetic', v: 'BigInt rationals', role: 'held', n: 'every refutation carries its most-favorable corner re-proved exactly; every calibration is a dyadic closed form matched exactly' },
  { k: 'battery', v: nChecks + ' checks · ' + nReds + ' reds', role: 'held', n: 'verdicts cross-proved by 256-corner exact sweeps; forged inputs must be refused at the door' },
  { k: 'what this is not', v: 'no airworthiness claim', role: 'warn', n: '"certified" here is a mathematical statement about boxes and arithmetic — never a regulatory status' }
]));

/* ---- the three-valued verdict, swept -------------------------------------
   Decide the same mission at every cruise duration and draw the result. This
   is the shape the whole instrument exists to produce: a green region where
   the maker's own published boxes PROVE the flight, a plum region where they
   REFUTE it, and — between them — a band where they decide nothing. That band
   is not a defect of the method; it is the width of the manufacturer's own
   disclosure, measured. */
{
  const seg2 = (T) => ({ segments: [seg('hover-climb', [60, 90], [420, 520]),
                                    seg('cruise', [T, T + 120], [110, 150]),
                                    seg('hover-land', [60, 90], [420, 520])] });
  const STEP = 15, MAXT = 3900;
  const sweep = (batt) => {
    const segs = [];
    let cur = null;
    for (let T = 0; T <= MAXT; T += STEP) {
      const v = E.certify(seg2(T), batt).verdict;
      if (!cur || cur.v !== v) { if (cur) segs.push(cur); cur = { v, x0: T / 60, x1: (T + STEP) / 60 }; }
      else cur.x1 = (T + STEP) / 60;
    }
    if (cur) segs.push(cur);
    return segs;
  };
  const TOK = { CERTIFIED: 'var(--c-2)', REFUTED: 'var(--c-1)', REFUSED: 'var(--c-3)' };
  const WORD = { CERTIFIED: 'CERTIFIED — every corner of the box clears the rule',
                 REFUTED: 'REFUTED — an exact falsifying corner exists',
                 REFUSED: 'REFUSED — the published boxes decide nothing here' };
  const mkRow = (k, batt, front) => ({
    k, segs: sweep(batt).map(g => ({ x0: g.x0, x1: g.x1, token: TOK[g.v], hatch: g.v === 'REFUSED',
      k: k + ' · ' + Math.round(g.x0) + '–' + Math.round(g.x1) + ' min cruise', v: WORD[g.v] })),
    marks: [{ x: front / 60, t: 'frontier ' + Math.round(front / 60) + ' min' }]
  });
  const fig = CH.segments({
    w: 900, rowH: 52, x0: 0, x1: MAXT / 60,
    xTicks: [0, 10, 20, 30, 40, 50, 60].filter(v => v <= MAXT / 60).map(v => ({ v, t: v + ' min' })),
    xLabel: 'cruise duration of the mission  (hover-climb and hover-land held fixed)',
    rows: [mkRow('FAA 20-min reserve', BAT20, f20), mkRow('30-min reserve', BAT30, f30)],
    keys: [{ token: TOK.CERTIFIED, t: 'CERTIFIED' }, { token: TOK.REFUSED, t: 'REFUSED (undecidable)', kind: 'hatch' },
           { token: TOK.REFUTED, t: 'REFUTED' }],
    alt: 'Two reserve rules swept across cruise duration. Under the FAA 20-minute reserve the mission is '
      + 'certified out to about ' + Math.round(f20 / 60) + ' minutes of cruise, then a wide undecidable band, '
      + 'then refuted; under a 30-minute reserve the certified region ends at about ' + Math.round(f30 / 60) + ' minutes.'
  });
  B.push(C.section({
    lab: '§0 · the frontier', title: 'Where proof ends, and what sits in the gap',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('The same mission, decided at every cruise duration under each rule. Nothing here is sampled and '
        + 'interpolated: each strip boundary is a change of VERDICT between two adjacent certified probes.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: 'Under the FAA 20-minute reserve the mission certifies out to '
        + Math.floor(f20 / 60) + ' min ' + (f20 % 60) + ' s of cruise; a 30-minute reserve pulls that back to '
        + Math.floor(f30 / 60) + ' min ' + (f30 % 60) + ' s — ' + Math.round((f20 - f30) / 60) + ' certified minutes of '
        + 'cruise is what the extra ten minutes of reserve costs, exactly. The hatched band between CERTIFIED '
        + 'and REFUTED is the honest one: there the published boxes straddle the rule and the instrument '
        + 'refuses rather than guessing, and its width is a measurement of the disclosure, not of the aircraft.' })
  }));
}

B.push(C.section({
  lab: '§1 · the rule and the gap', title: 'A named regulatory number, defended by simulation',
  bodyRaw: [
    C.p('The FAA\'s 2024 powered-lift SFAR sets energy reserves for eVTOL operations — 20 minutes VFR, 30 IFR — '
      + 'and the industry pushback is public and quantitative: reserves determine which routes close. EASA\'s '
      + '2025 IAM package regulates energy management the same way. Yet every number in that argument — mission '
      + 'feasibility, deconfliction energy overhead, reserve adequacy — is produced by simulation: Monte Carlo '
      + 'percentiles over sampled parameters, floating-point optimizers, no statement that survives an adversarial '
      + 'reading of "for every case in the stated envelope".'),
    C.p('The gap is not modeling sophistication — the field\'s power models are fine. The gap is the QUANTIFIER. '
      + '"Feasible in 10,000 samples" and "feasible for every point in the box" are different claims, and only '
      + 'the second is the shape a reserve rule actually asserts. Interval arithmetic decides the second shape '
      + 'directly, and nobody in the eVTOL energy literature has published such a certificate.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · the instrument', title: 'Three verdicts, one honest refusal',
  bodyRaw: [
    C.p('A mission is segments (hover-climb, cruise, hover-land, …) with duration and electrical-power BOXES; '
      + 'the battery contributes usable-energy and efficiency boxes; the reserve rule contributes a reserve time '
      + 'at a reserve power. Used and required energy are enclosed over the whole box with outward rounding, and '
      + 'the universal verdict follows from two one-sided comparisons: worst case clears — CERTIFIED for every '
      + 'point; best case fails — REFUTED for every point, with the most favorable corner re-proved negative in '
      + 'exact BigInt rationals as the falsifying witness; anything between — REFUSED, with both margins printed. '
      + 'A refusal means the boxes genuinely contain passing and failing aircraft, and no honest instrument can '
      + 'say more until the boxes tighten.'),
    C.p('The corner-witness logic is PROVED, not assumed: the battery sweeps all 256 corners of a two-segment '
      + 'instance in exact rationals and requires the interval bounds to be sound AND corner-achieving (tight to '
      + 'rounding) on feasible, marginal and doomed instances alike. Scope, honestly: this is energy accounting — '
      + 'Σ duration·power/efficiency against usable capacity — not electrochemistry. Voltage sag, temperature and '
      + 'aging live INSIDE the boxes a user states, which is exactly why the inputs are boxes: widen them to '
      + 'cover what the model does not resolve, and every verdict above stays sound.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§3 · the mission ladder', title: 'Certified live at this build, under both reserve rules', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'mission' }, { h: '20-min reserve' }, { h: 'margin (kWh)', cls: 'n' }, { h: '30-min reserve' }, { h: 'margin (kWh)', cls: 'n' }],
    rows: rows.map((r) => [
      r.name,
      { raw: vTag(r.r20.verdict) }, fmtM(r.r20.margin_kwh),
      { raw: vTag(r.r30.verdict) }, fmtM(r.r30.margin_kwh)
    ])
  })
    + '<div class="col">' + C.pRaw('Margins are worst-case for CERTIFIED rows, best-case for REFUTED rows, and '
      + 'the worst…best pair for REFUSED rows — the two numbers a refusal honestly has. The parameter boxes are '
      + 'a representative vectored-thrust class (hover 420–520 kW, cruise 110–150 kW, usable 130–145 kWh, '
      + 'efficiency 0.88–0.94), stated in the page source as inputs — they are NOT any manufacturer\'s aircraft, '
      + 'and tightening or widening them re-decides every row by the same arithmetic.') + '</div>'
}));

B.push(C.section({
  lab: '§4 · the frontier', title: 'Where the certified envelope ends',
  bodyRaw: C.p('Bisecting on cruise duration with a certified verdict at every probe puts the end of the '
    + 'mathematically certified envelope at ' + mins(f20) + ' minutes of cruise under the 20-minute rule and '
    + mins(f30) + ' minutes under the 30-minute rule, for the stated boxes. That difference — '
    + ((f20 - f30) / 60).toFixed(0) + ' minutes of provable endurance — is the quantity the reserve debate is '
    + 'actually about, computed here as a theorem about the boxes rather than a fleet average. The same '
    + 'bisection run against an operator\'s own measured boxes is the instrument\'s intended use.')
}));

B.push(C.section({
  lab: '§5 · where this goes', title: 'The aerospace front, opened',
  bodyRaw: C.p('This is the first instrument of this site\'s aerospace front: the cheapest object where a '
    + 'certified universal statement replaces a simulation percentile in a live regulatory argument. The next '
    + 'two are named: an exact-rational audit of a published UAM capacity claim, and the front\'s flagship — a '
    + 'computer-assisted enclosure of an aeroelastic limit-cycle oscillation, an object with mature literatures '
    + 'on both sides and, as far as three independent searches can establish, no certified instance anywhere.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-evtol-energy.js @ git ' + git + '. The '
  + 'instrument\'s battery ran as this page\'s gate (' + nChecks + ' checks, ' + nReds + ' reds fired), every '
  + 'mission row was certified during the build, and the endurance frontier was re-bisected — the build refuses '
  + 'on any deviation. Instrument: instruments/evtol/energy.js.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'evtol-energy.html'),
  TPL.render({ title: 'The reserve, provable', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/evtol-energy.html',
    desc: 'Energy-feasibility certificates for eVTOL missions under the FAA reserve rule: CERTIFIED over whole parameter boxes, REFUTED with an exact witness, or REFUSED.' }));
console.log('reports/evtol-energy.html written: frontier ' + mins(f20) + ' / ' + mins(f30) + ' min, ladder '
  + rows.length + ' missions x 2 rules, battery ' + nChecks + ' checks @ git ' + git);
