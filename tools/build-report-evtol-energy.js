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
/* WARRANT v2.1 (design/WARRANT.md), 2026-10-28. Every verdict, margin and frontier on this page is DECIDED: interval
   arithmetic over boxes, the refutations re-proved in exact rationals. So they stay plain and solid. What they rest on
   is a model (energy bookkeeping), boxes chosen for a representative class, and a reserve rule read from a pinned
   rule pack: those are PREMISES, named with their grades in §2 (rule 11), never carried by the stroke. A printed
   margin or frontier is a BOUND and rounds outward (rule 8): until this pass the 20-minute frontier, 18 min 41 s, was
   printed as "19 minutes" and the mission ladder's margins were rounded to nearest. */
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
/* a premise names its record by path; at 390 px a path is one unbreakable word and pushed SkyAudit's page 63 px wide
   (the ruler, 2026-10-28). A break opportunity after each slash, nothing else changes. */
const PREM = (items, o) => W.premisesHtml(items, o).replace(/([\w.-])\/(?=[\w.-])/g, '$1/<wbr>');
const die = (m) => { console.error('EVTOL-ENERGY REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
/* a bound printed at d decimals rounds OUTWARD: a lower end down, an upper end up */
const outF = (x, up, d) => { const k = 10 ** d; let v = (up ? Math.ceil(x * k) : Math.floor(x * k)) / k;
  while (up ? Number(v.toFixed(d)) < x : Number(v.toFixed(d)) > x) v += (up ? 1 : -1) / k; return v.toFixed(d); };
/* a whole number of seconds, exactly: never rounded to the minute */
const mmss = (s) => Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '');

/* ---- gate: the instrument's battery -------------------------------------- */
const bat = cp.spawnSync(process.execPath, [path.join(ROOT, 'instruments', 'evtol', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const ball = /ALL PASS — (\d+) checks/.exec(bout);
if (bat.status !== 0 || !ball) die('the evtol battery did not pass:\n' + bout.slice(-600));
const nChecks = (bout.match(/^PASS /gm) || []).length;
const nReds = (bout.match(/RED ok/g) || []).length;
if (nReds < 4) die('fewer than 4 red controls fired (' + nReds + ')');
/* the battery counts its red controls among its checks: the page printed "21 checks · 4 reds" for a battery that says
   25 checks. The total is the battery's own, and it must be the passes plus the reds. */
const nTotal = Number(ball[1]);
if (nTotal !== nChecks + nReds) die('the battery total ' + nTotal + ' is not its ' + nChecks + ' passes plus ' + nReds + ' reds');
/* the battery lines the premise chain and the prose cite */
const CAL = /^PASS\s+calibration margin is EXACTLY (\d+) kWh in rationals/m.exec(bout);
if (!CAL) die('the battery no longer matches its calibration instance exactly');
const SWEEPS = (bout.match(/SOUND (?:lower|upper) bound on all 256 exact corners/g) || []).length;
if (SWEEPS < 6) die('the 256-corner exact sweeps the page cites are not in the battery (' + SWEEPS + ')');

/* ---- the reserve rule, read from the pinned rule pack ---------------------
   The page used to say "the FAA's powered-lift SFAR demands 20 minutes of reserve energy under VFR, 30 under IFR".
   Nothing pinned here carries an IFR reserve. The rule pack apps/skyaudit/scenario/rules/faa-sfar-vfr.json does carry
   the VFR rule, and it is conditional: 20 minutes at normal cruise ONLY IF the flight manual shows vertical-landing
   capability along the route, otherwise 30 minutes by day and 45 by night. Both rows of this page are read from it. */
const RULE = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps', 'skyaudit', 'scenario', 'rules', 'faa-sfar-vfr.json'), 'utf8'));
if (!(RULE.reserve.t_s[0] === 1200 && RULE.reserve.t_s[1] === 1200)) die('the SFAR rule pack no longer holds 20 minutes');
if (!/otherwise 30 min day \/ 45 night/.test(RULE.cite) || !/vertical-landing/.test(RULE.cite)) die('the SFAR rule pack no longer states its condition and its 30-minute day tier');
const RULE_CITE = (/^(14 CFR Part 194, [^(]+\(\d{4}-\d\d-\d\d, eff\. \d{4}-\d\d-\d\d\))/.exec(RULE.cite) || die('the SFAR rule pack\'s citation moved'))[1];

/* ---- the representative aircraft class, as BOXES -------------------------
   These are NOT any manufacturer's numbers. They are a representative
   vectored-thrust eVTOL class drawn from the published academic modeling
   literature (the AIAA reserve-requirements line and GAMA's range/endurance
   guidance discuss exactly these magnitudes), stated as boxes wide enough
   to be honest and narrow enough to decide. Every number is an INPUT a
   reader can widen — the instrument's verdicts stay sound under widening. */
const BAT20 = { usable_kwh: [130, 145], eta: [0.88, 0.94], reserve: { t_s: [1200, 1200], p_kw: [90, 110] } };
const BAT30 = { usable_kwh: [130, 145], eta: [0.88, 0.94], reserve: { t_s: [1800, 1800], p_kw: [90, 110] } };
if (BAT20.reserve.t_s[0] !== RULE.reserve.t_s[0]) die('the 20-minute row is not the rule pack\'s reserve');
const seg = (name, t, p) => ({ name, t_s: t, p_kw: p });
const HOVER = [420, 520], CRUISE = [110, 150], HOVER_T = [60, 90], CRUISE_PAD = 120;
if (RULE.reserve.power !== 'cruise' || !(BAT20.reserve.p_kw[1] <= CRUISE[0])) die('the reserve-power sentence no longer holds: the rule pack\'s power or the boxes moved');
/* a mission: hover-climb, a cruise whose duration box is [T, T + 2 min], hover-land */
const mk = (T) => ({ segments: [seg('hover-climb', HOVER_T, HOVER), seg('cruise', [T, T + CRUISE_PAD], CRUISE), seg('hover-land', HOVER_T, HOVER)] });
const MISSIONS = [
  ['short hop (10 min cruise)', 540], ['design mission (20 min cruise)', 1140],
  ['stretch (35 min cruise)', 2040], ['deep stretch (55 min cruise)', 3240]
].map(([name, T]) => [name, mk(T).segments]);
for (const [name, segments] of MISSIONS) {
  const c = segments[1].t_s, mid = (c[0] + c[1]) / 2 / 60;
  if (!new RegExp('\\(' + mid + ' min cruise\\)').test(name)) die('the mission "' + name + '" is not centred on its cruise box');
}
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
/* energy.js takes its last step, usable − used − reserve, in round-to-nearest float. No verdict on this page may rest on
   that step: every margin it prints is required to clear zero by more than a nanowatt-hour's worth (1e−9 kWh). */
const clear = (r) => (typeof r.margin_kwh === 'number' ? Math.abs(r.margin_kwh) : Math.min(Math.abs(r.margin_kwh.worst), Math.abs(r.margin_kwh.best))) > 1e-9;
if (!rows.every((r) => clear(r.r20) && clear(r.r30))) die('a mission verdict rests on the last float subtraction (|margin| ≤ 1e−9 kWh)');

/* ---- the certified-endurance frontier ------------------------------------
   Longest cruise (integer seconds, the low end of a two-minute cruise box) whose mission still CERTIFIES under each
   rule: bisection where every probe is a certified verdict. The energy used grows with the cruise, so the verdict runs
   CERTIFIED, then REFUSED, then REFUTED as the cruise grows; the sweep below checks that order at every 15 s before any
   boundary is drawn, and both boundaries are found by bisection to the second. */
const VORD = { CERTIFIED: 0, REFUSED: 1, REFUTED: 2 };
function firstAtLeast(batt, k) {             /* the first whole second whose verdict is at or past k in that order */
  let lo = 0, hi = 20000;
  if (VORD[E.certify(mk(lo), batt).verdict] >= k) return 0;
  if (VORD[E.certify(mk(hi), batt).verdict] < k) return null;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (VORD[E.certify(mk(mid), batt).verdict] >= k) hi = mid; else lo = mid;
  }
  return hi;
}
const B20 = { c: firstAtLeast(BAT20, 1), r: firstAtLeast(BAT20, 2) }, B30 = { c: firstAtLeast(BAT30, 1), r: firstAtLeast(BAT30, 2) };
if ([B20.c, B20.r, B30.c, B30.r].some((x) => x === null || x <= 0)) die('a verdict boundary was not found');
const f20 = B20.c - 1, f30 = B30.c - 1;      /* the last certified second */
if (f30 >= f20) die('the endurance frontier is degenerate: ' + f20 + ' / ' + f30);
for (const [b, B] of [[BAT20, B20], [BAT30, B30]]) {
  if (!clear(E.certify(mk(B.c - 1), b)) || !clear(E.certify(mk(B.c), b)) || !clear(E.certify(mk(B.r - 1), b)) || !clear(E.certify(mk(B.r), b))) die('a boundary verdict rests on the last float subtraction');
}
const dF = f20 - f30;

/* ---- the page ------------------------------------------------------------ */
/* a margin is an enclosure end: the worst case a lower bound (down), the best case an upper bound (up) */
const fmtM = (r) => (r.verdict === 'CERTIFIED' ? outF(r.margin_kwh, false, 1)
  : r.verdict === 'REFUTED' ? outF(r.margin_kwh, true, 1)
  : outF(r.margin_kwh.worst, false, 1) + ' … ' + outF(r.margin_kwh.best, true, 1));
const vTag = (v) => v === 'CERTIFIED' ? C.tag('CERTIFIED', 'held') : v === 'REFUTED' ? C.tag('REFUTED', 'open') : C.tag('REFUSED', 'dep');
const box = (b) => b[0] + '–' + b[1];
const B = [];
const rule30 = '30 minutes, the same rule\'s day tier when that condition is not shown';

B.push(C.header({
  eyebrow: 'cert-machine · aerospace front · every verdict re-proved at this build',
  title: 'The reserve, provable: energy-feasibility certificates for eVTOL missions',
  deck: 'Battery-electric air taxis fly under a hard reserve rule — the FAA\'s powered-lift SFAR (' + RULE_CITE + ') allows a VFR '
    + 'reserve of 20 minutes at normal cruise only where the flight manual shows a vertical landing is possible along the '
    + 'whole route, and 30 minutes by day otherwise — and industry is arguing the number because reserves '
    + 'gate route economics. Every feasibility figure in that argument today is simulation. This page holds the '
    + 'other kind of statement: for a mission whose durations, powers, capacity and efficiency are known only as '
    + 'BOXES, the verdict "every parameter point lands at or above the reserve floor" is decided — CERTIFIED, '
    + 'REFUTED with an exact falsifying witness, or honestly REFUSED — by interval arithmetic with outward '
    + 'rounding. Mathematically certified enclosures; no airworthiness meaning, and the page says so.'
}));

B.push(C.tldr({
  findingRaw: 'A provable energy-feasibility envelope for an eVTOL mission class: under representative boxes, '
    + 'the mathematically certified endurance frontier sits at ' + mmss(f20) + ' of cruise under the '
    + '20-minute reserve and ' + mmss(f30) + ' under the 30-minute one — every probe of that frontier a '
    + 'certified verdict, not a Monte Carlo percentile. The ten extra minutes of reserve cost '
    + mmss(dF) + ' of certified cruise, to the second.',
  mechanismRaw: 'Used and reserve energy are enclosed over the whole parameter box (outward-rounded interval '
    + 'arithmetic); the universal verdict needs one one-sided comparison each way. A refutation re-proves the '
    + 'most favorable corner in exact BigInt rationals — if even that corner fails, all points do — and a box '
    + 'that straddles the floor is REFUSED, never averaged. The battery checks the interval bounds against all 256 '
    + 'corners of three instances in exact rationals and fires ' + nReds + ' red controls per run. What every verdict '
    + 'rests on, and how far each premise was checked, is §2.',
  checkRaw: C.m('node instruments/evtol/battery.js') + ' from a clone — ' + nTotal + ' checks, ' + nReds + ' of them red '
    + 'controls; the mission table below was certified during this page\'s build.'
}));

B.push(C.stats([
  { k: 'certified endurance, 20-min reserve', v: mmss(f20) + ' cruise', role: 'held', n: 'the longest cruise (the low end of a two-minute cruise box) whose mission CERTIFIES for every parameter point in the boxes — found by bisection with a certified verdict at every probe' },
  { k: 'certified endurance, 30-min reserve', v: mmss(f30) + ' cruise', role: 'held', n: 'the same frontier under ' + rule30 + ' — the ten extra minutes cost ' + mmss(dF) + ' of certified cruise' },
  { k: 'verdicts', v: '3, all exercised', n: 'CERTIFIED / REFUTED-with-witness / REFUSED — the mission ladder below shows each, live' },
  { k: 'witness arithmetic', v: 'BigInt rationals', role: 'held', n: 'every refutation carries its most-favorable corner re-proved exactly; the calibration instance\'s margin is matched exactly in rationals (' + CAL[1] + ' kWh)' },
  { k: 'battery', v: nTotal + ' checks · ' + nReds + ' reds', role: 'held', n: 'interval bounds checked against 256-corner exact sweeps; forged inputs must be refused at the door' },
  { k: 'what this is not', v: 'no airworthiness claim', role: 'warn', n: '"certified" here is a mathematical statement about boxes and arithmetic — never a regulatory status' }
]));

/* ---- the three-valued verdict, swept -------------------------------------
   Decide the same mission at every cruise duration and draw the result: a region where the stated boxes PROVE the
   flight, a region where they REFUTE it, and between them a band where they decide nothing. That band is not a
   defect of the method; it is the width of the boxes, measured.

   UNTIL 2026-10-28 the strips were a 15-second sample: each probe's verdict was painted forward to the next probe, so
   the CERTIFIED strip ran 4 s past the last certified second and the caption said "nothing here is sampled". Now the
   15-second sweep only CHECKS the order (CERTIFIED, then REFUSED, then REFUTED, never back), and the two boundaries
   drawn are the bisected ones, to the second. */
{
  const STEP = 15, MAXT = 3900;
  const checkOrder = (batt, Bd) => {
    let last = 0;
    for (let T = 0; T <= MAXT; T += STEP) {
      const k = VORD[E.certify(mk(T), batt).verdict];
      if (k < last) die('the verdict is not monotone in the cruise at T = ' + T + ' s');
      last = k;
      if (k !== (T < Bd.c ? 0 : T < Bd.r ? 1 : 2)) die('the sweep disagrees with the bisected boundaries at T = ' + T + ' s');
    }
  };
  checkOrder(BAT20, B20); checkOrder(BAT30, B30);
  if (!(B20.r < MAXT && B30.r < MAXT)) die('a refuted region starts past the drawn axis');
  const TOK = { CERTIFIED: 'var(--c-2)', REFUTED: 'var(--c-1)', REFUSED: 'var(--c-3)' };
  const WORD = { CERTIFIED: 'CERTIFIED — every corner of the box clears the rule',
                 REFUTED: 'REFUTED — an exact falsifying corner exists',
                 REFUSED: 'REFUSED — the stated boxes decide nothing here' };
  const strips = (Bd) => [['CERTIFIED', 0, Bd.c], ['REFUSED', Bd.c, Bd.r], ['REFUTED', Bd.r, MAXT]];
  const mkRow = (k, Bd, front) => ({
    k, segs: strips(Bd).map(([v, a, b]) => ({ x0: a / 60, x1: b / 60, token: TOK[v], hatch: v === 'REFUSED',
      k: k + ' · ' + mmss(a) + ' to ' + mmss(b) + ' of cruise', v: WORD[v] })),
    marks: [{ x: front / 60, t: 'frontier ' + mmss(front) }]
  });
  const fig = CH.segments({
    w: 900, rowH: 52, x0: 0, x1: MAXT / 60,
    xTicks: [0, 10, 20, 30, 40, 50, 60].filter(v => v <= MAXT / 60).map(v => ({ v, t: v + ' min' })),
    xLabel: 'cruise duration of the mission, the low end of its two-minute box  (hover-climb and hover-land held fixed)',
    rows: [mkRow('20-min reserve', B20, f20), mkRow('30-min reserve', B30, f30)],
    keys: [{ token: TOK.CERTIFIED, t: 'CERTIFIED' }, { token: TOK.REFUSED, t: 'REFUSED (undecidable)', kind: 'hatch' },
           { token: TOK.REFUTED, t: 'REFUTED' }],
    alt: 'Two reserve rules swept across cruise duration. Under the 20-minute reserve the mission is '
      + 'certified out to ' + mmss(f20) + ' of cruise, undecidable from there to ' + mmss(B20.r) + ', then '
      + 'refuted; under the 30-minute reserve the certified region ends at ' + mmss(f30) + ' and the refuted one starts at ' + mmss(B30.r) + '.'
  });
  B.push(C.section({
    lab: '§0 · the frontier', title: 'Where proof ends, and what sits in the gap',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('The same mission, decided at every cruise duration under each rule. Both strip boundaries are '
        + 'located to the second by bisection, with a certified verdict on each side; a sweep every 15 seconds checks '
        + 'that the verdict only ever moves from CERTIFIED to REFUSED to REFUTED as the cruise grows, and the build '
        + 'refuses the page if it does not.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: 'Under the 20-minute reserve the mission certifies out to '
        + mmss(f20) + ' of cruise; a 30-minute reserve pulls that back to ' + mmss(f30) + ' — '
        + mmss(dF) + ' of certified cruise is what the extra ten minutes of reserve cost, to the second. '
        + 'The hatched band between CERTIFIED and REFUTED is the honest one: there the stated boxes straddle the rule and the instrument '
        + 'refuses rather than guessing, and its width is a measurement of the boxes, not of an aircraft.' })
  }));
}

B.push(C.section({
  lab: '§1 · the rule and the gap', title: 'A named regulatory number, defended by simulation',
  bodyRaw: [
    C.p('The FAA\'s 2024 powered-lift SFAR sets energy reserves for eVTOL operations — under VFR, 20 minutes at '
      + 'normal cruise where the flight manual shows a vertical landing is possible along the whole route, otherwise '
      + '30 minutes by day and 45 by night (the rule pack apps/skyaudit/scenario/rules/faa-sfar-vfr.json, pinned to the '
      + 'Federal Register text) — and the industry pushback is public and quantitative: reserves determine which routes '
      + 'close. EASA sets a 5-minute final reserve inside a wider energy plan that does not reduce to one number '
      + '(apps/skyaudit/scenario/rules/easa-final-reserve.json). Yet every number in that argument — mission '
      + 'feasibility, deconfliction energy overhead, reserve adequacy — is produced by simulation: Monte Carlo '
      + 'percentiles over sampled parameters, floating-point optimizers, no statement that survives an adversarial '
      + 'reading of "for every case in the stated envelope".'),
    C.pRaw('The gap is not modeling sophistication — the field\'s power models are fine. The gap is the QUANTIFIER. '
      + '"Feasible in 10,000 samples" and "feasible for every point in the box" are different claims, and only '
      + 'the second is the shape a reserve rule actually asserts. Interval arithmetic decides the second shape '
      + 'directly. <em>We have not found such a certificate in the eVTOL energy literature; no search record is pinned '
      + 'here, so that is a statement about our reading, not a survey.</em>')
  ].join('\n')
}));

/* §2 — the premise chain (WARRANT rule 11). Every grade is read from what this build ran: the battery's own lines, the
   rule pack, and the boxes typed in this file. */
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
    C.p('The corner-witness logic is checked, not assumed: the battery sweeps all 256 corners of three two-segment '
      + 'instances (feasible, marginal, doomed) in exact rationals and requires the interval bounds to be sound AND '
      + 'corner-achieving (tight to rounding) on each. Scope, honestly: this is energy accounting — '
      + 'Σ duration·power/efficiency against usable capacity — not electrochemistry. Voltage sag, temperature and '
      + 'aging live INSIDE the boxes a user states, which is exactly why the inputs are boxes: widen them to '
      + 'cover what the model does not resolve, and every verdict above stays sound.'),
    '<div class="col">' + C.pRaw('Every verdict is exact about the boxes it was given. What it says about an aircraft rests on '
      + 'premises the arithmetic cannot reach. In the order a verdict travels through them, each with the rung its checking '
      + 'reached — <b>validated</b> (against the thing itself, held out), <b>compared</b> (against a model that keeps more), '
      + '<b>verified</b> (the code against an exact solution of its own equations) or <b>assumed</b> (adopted; nothing here checked it):')
    + PREM([
      { grade: W.ASSUMED, label: 'The mission and the aircraft, as boxes',
        evidence: 'hover ' + box(HOVER) + ' kW for ' + box(HOVER_T) + ' s each way, cruise ' + box(CRUISE) + ' kW, usable '
          + box(BAT20.usable_kwh) + ' kWh, efficiency ' + box(BAT20.eta) + ', reserve power ' + box(BAT20.reserve.p_kw)
          + ' kW: a representative vectored-thrust class chosen for this page, not any maker\'s published numbers, typed in '
          + 'tools/build-report-evtol-energy.js. Nothing here measured an aircraft.' },
      { grade: W.ASSUMED, label: 'Energy as bookkeeping',
        evidence: 'used energy is Σ duration × power / efficiency against usable capacity. No voltage sag, temperature or '
          + 'ageing: they are meant to sit inside the boxes, and whether these boxes are wide enough to hold them is not '
          + 'measured here.' },
      { grade: W.ASSUMED, label: 'The reserve rule',
        evidence: '20 minutes from the SFAR rule pack (' + C.esc(RULE_CITE) + '), which grants it only where a vertical landing '
          + 'is possible along the whole route; 30 minutes is the same rule\'s day tier otherwise. Whether a route qualifies is '
          + 'not decided here. The rule asks for those minutes at normal cruising speed; this page holds them at a reserve '
          + 'power of ' + box(BAT20.reserve.p_kw) + ' kW, at or below its own cruise box of ' + box(CRUISE) + ' kW — a chosen '
          + 'reading of "normal cruise", not the rule\'s number.' },
      { grade: W.VERIFIED, label: 'The arithmetic',
        evidence: 'the interval bounds are checked against all 256 corners of three instances in exact rationals, sound and '
          + 'tight on each; the calibration instance\'s margin is exactly ' + CAL[1] + ' kWh in rationals; every refutation is '
          + 're-proved at its best corner in BigInt rationals (instruments/evtol/battery.js, ' + nTotal + ' checks, run at this '
          + 'build). The last step, usable − used − reserve, is a round-to-nearest subtraction, so the build refuses any '
          + 'verdict on this page whose margin is within 1e−9 kWh of zero.' },
    ], { meetLine: 'The arithmetic is verified; the weakest premise is <b>assumed</b>. A verdict here is exact <em>given the '
      + 'boxes and the rule</em>: about a real aircraft it says what those boxes say, and no more.' }) + '</div>'
  ].join('\n')
}));

B.push(C.section({
  lab: '§3 · the mission ladder', title: 'Certified live at this build, under both reserve rules', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'mission' }, { h: '20-min reserve' }, { h: 'margin (kWh)', cls: 'n' }, { h: '30-min reserve' }, { h: 'margin (kWh)', cls: 'n' }],
    rows: rows.map((r) => [
      r.name,
      { raw: vTag(r.r20.verdict) }, fmtM(r.r20),
      { raw: vTag(r.r30.verdict) }, fmtM(r.r30)
    ])
  })
    + '<div class="col">' + C.pRaw('Margins are worst-case for CERTIFIED rows, best-case for REFUTED rows, and '
      + 'the worst…best pair for REFUSED rows — the two numbers a refusal honestly has — each printed rounded outward, '
      + 'a worst case down and a best case up. The parameter boxes are '
      + 'a representative vectored-thrust class (hover ' + box(HOVER) + ' kW, cruise ' + box(CRUISE) + ' kW, usable '
      + box(BAT20.usable_kwh) + ' kWh, efficiency ' + box(BAT20.eta) + ', reserve power ' + box(BAT20.reserve.p_kw) + ' kW), '
      + 'stated in the page source as inputs — they are NOT any manufacturer\'s aircraft, '
      + 'and tightening or widening them re-decides every row by the same arithmetic.') + '</div>'
}));

B.push(C.section({
  lab: '§4 · the frontier', title: 'Where the certified envelope ends',
  bodyRaw: C.p('Bisecting on cruise duration with a certified verdict at every probe puts the end of the '
    + 'mathematically certified envelope at ' + mmss(f20) + ' of cruise under the 20-minute reserve and '
    + mmss(f30) + ' under the 30-minute one, for the stated boxes; each is the low end of a two-minute cruise box, so '
    + 'the cruise it certifies runs up to two minutes longer. That difference — '
    + mmss(dF) + ' of provable endurance — is the quantity the reserve debate is '
    + 'actually about, computed here as a theorem about the boxes rather than a fleet average. The same '
    + 'bisection run against an operator\'s own measured boxes is the instrument\'s intended use.')
}));

/* §5 used to name "the next two" instruments of the front — a UAM capacity audit and an aeroelastic limit-cycle
   enclosure "with, as far as three independent searches can establish, no certified instance anywhere". Neither was
   built and no search record is pinned. What the front built next is SkyAudit and the glide band; §5 says so. */
B.push(C.section({
  lab: '§5 · where this went', title: 'The aerospace front, opened',
  bodyRaw: C.pRaw('This was the first instrument of this site\'s aerospace front: the cheapest object where a '
    + 'certified universal statement replaces a simulation percentile in a live regulatory argument. The same verdict '
    + 'was then run on a real day: <a href="skyaudit.html">SkyAudit</a> re-flies a pinned day of New York helicopter '
    + 'traffic with four eVTOLs\' own published boxes under the same SFAR rule pack, and <a href="glide-band.html">the '
    + 'glide band</a> draws an engine-out reach as a proved inner ring, a refuted outer one and the undecided annulus '
    + 'between.')
}));

const foot = '<p>Generated by tools/build-report-evtol-energy.js @ git ' + git + '. The '
  + 'instrument\'s battery ran as this page\'s gate (' + nTotal + ' checks, ' + nReds + ' of them red controls, all fired), every '
  + 'mission row was certified during the build, and both verdict boundaries were re-bisected — the build refuses '
  + 'on any deviation, or if a verdict it prints rests on the last float subtraction. Reserve rule: '
  + 'apps/skyaudit/scenario/rules/faa-sfar-vfr.json. Instrument: instruments/evtol/energy.js.</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'evtol-energy.html'),
  TPL.render({ title: 'The reserve, provable', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/evtol-energy.html',
    desc: 'Energy-feasibility certificates for eVTOL missions under the FAA reserve rule: CERTIFIED over whole parameter boxes, REFUTED with an exact witness, or REFUSED.' }));
console.log('reports/evtol-energy.html written: frontier ' + mmss(f20) + ' / ' + mmss(f30) + ', ladder '
  + rows.length + ' missions x 2 rules, battery ' + nTotal + ' checks @ git ' + git);
