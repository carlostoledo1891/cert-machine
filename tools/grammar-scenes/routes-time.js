/* routes-time.js — /grammar/, "Routes and time": where something went, when it can go, and how a forecast fared.
   tools/grammar-scenes/ · cert-machine · 2026-10-30

   Six ways of showing data that moves along a path or through a week, each drawn from an instrument's own record and,
   where an ordinary version exists, beside it (tools/grammar-scenes/README.md is the interface):

     1. a route on a map        SkyAudit: one helicopter's ADS-B track over New York, the eVTOL energy instrument
                                re-run at every report it sent
     2. a board of verdicts     Janela: a week of six-hour starts at nine open-sea sites, as its decision record keeps it
     3. a timeline over a forecast   Janela: one row of that board, over the band it was decided on
     4. a forecast, graded      Janela's ledger: two forecasts of Potiguar's sea against the satellite passes that came later
     5. a light curve           the exoplanet transit: binned measurements, each with its allowance, and the stars they admit
     6. a step function         PU Verificado: a bond price under its rule table, the printed digits as treads

   Swell, the beach app, draws its week the way scene 2 does (an activity by hour); its day lives on the swell-field
   branch, not on main, so the board here is drawn from Janela's kept decisions, the same engine's other face.

   Every number is read from its record as the page is built and every caption's claim is a guard: its plain words are
   the figure's stop sentence. MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..', '..');
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const C = require(path.join(ROOT, 'design', 'components.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const OUT = require(path.join(ROOT, 'design', 'outward.js'));
const PL = require(path.join(ROOT, 'tools', 'build-grammar-plates.js'));
const GAL = require(path.join(ROOT, 'tools', 'build-grammar-gallery.js'));
const { PLAIN, PW, PH, TOP } = GAL;
const { f1, line, poly, t, mood, eyebrow, svg, voidWords, head, plainDot, makeGuard } = GAL.atoms;
const esc = C.esc;

/* ------------------------------------------------------------- shared -- */
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
/* a guide says nothing: the corridor graph, a reference ruler */
const GUIDE = 'stroke="var(--ink-5)" stroke-width="1" fill="none" stroke-dasharray="' + G.GUIDE + '"';
const rect = (x, y, w, h, a) => '    <rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" ' + a + '/>';
const pathD = (pts) => pts.map(([x, y], i) => (i ? 'L' : 'M') + f1(x) + ',' + f1(y)).join('');
const dot = (x, y, r, a) => '    <circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" ' + a + '/>';
/* a verdict's body, by shape: cleared filled, blocked outlined (decided both, so the edge is solid) */
const FILLED = 'class="w-decided" fill="var(--ink-3)" stroke="var(--ink-3)" stroke-width="1"';
const OUTLINED = 'class="w-decided" fill="none" stroke="var(--ink-2)" stroke-width="1.2"';
/* a void along a path: a hatched ribbon with an edge, and no line inside it (refused draws no stroke) */
function ribbon(h, pts, w) {
  const d = pathD(pts);
  return ['    <path d="' + d + '" fill="none" stroke="var(--rule-strong)" stroke-width="' + (w + 2) + '" stroke-linecap="round" stroke-linejoin="round"/>',
    '    <path d="' + d + '" fill="none" stroke="var(--sunk)" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>',
    '    <path d="' + d + '" class="w-void" fill="none" stroke="url(#' + h.id + ')" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>'].join('\n');
}
/* a selection, named where it is drawn: its label underlined dotted, chosen (the brief's rule: a subset picked by a
   stated rule is a choice, said in the caption and drawn as one) */
const ADV = { 't-ax': 7.2, 't-note': 6.9, 't-lab': 7.8 };
const chosen = (x, y, s, cls) => t(x, y, s, cls || 't-note') + '\n' + line(x, y + 4, x + s.length * ADV[cls || 't-note'], y + 4, W.attrs(W.CHOSEN, { width: 1.4 }));
const after = (s, cls) => s.length * ADV[cls || 't-note'] + 7;
/* consecutive equal codes as runs: [{ c, i0, i1 }] (inclusive) */
function runsOf(codes) {
  const out = [];
  for (let i = 0; i < codes.length; i++) {
    if (out.length && out[out.length - 1].c === codes[i]) out[out.length - 1].i1 = i;
    else out.push({ c: codes[i], i0: i, i1: i });
  }
  return out;
}
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayOf = (iso) => new Date(iso.slice(0, 10) + 'T00:00:00Z');

/* Janela's public ledger, read once: the forecasts as committed before the sea was seen, and the scores the satellites
   gave them three days later (certs/janela-ledger/DEFINITIONS.json) */
const LEDGER = 'certs/janela-ledger/202610.jsonl';
let LEDGER_ROWS = null;
const ledger = () => LEDGER_ROWS || (LEDGER_ROWS = read(LEDGER).trim().split('\n').map((l) => JSON.parse(l)));
const Q = require(path.join(ROOT, 'instruments', 'window', 'q.js'));
const qf = (a) => Number(Q.dec(Q.parse(a), 6));          /* an exact rational, for placing on the screen only */

/* ============================================================ 1. a route on a map ==
   SkyAudit's day of 26 August 2026 over New York. The flight is picked by a stated rule; the reserve question is the
   instrument's own (apps/skyaudit/audit/mission.js), asked again at every report as if the flight had ended there. */
function route(guard) {
  guard = makeGuard(guard);
  const DAY = 'apps/skyaudit/data/day-2026-08-26/';
  const HELI = DAY + 'nyc.heli.jsonl.gz', CERTS = DAY + 'nyc.certs.jsonl.gz', CITY = 'apps/skyaudit/scenario/cities/nyc.json';
  const FL = require(path.join(ROOT, 'apps', 'skyaudit', 'audit', 'flights.js'));
  const M = require(path.join(ROOT, 'apps', 'skyaudit', 'audit', 'mission.js'));
  const SPEC = 'beta-alia', RULE = 'faa-sfar-vfr', NEAR_KM = 4;
  const gun = (rel) => zlib.gunzipSync(fs.readFileSync(path.join(ROOT, rel))).toString('utf8').trim().split('\n').map((l) => JSON.parse(l));
  const city = JSON.parse(read(CITY));
  const place = (p) => { let b = null; for (const [k, h] of Object.entries(city.heliports)) { const d = FL.havKm(p.lat, p.lon, h.lat, h.lon); if (!b || d < b.d) b = { k, d }; } return b; };
  const STOP = 'the flight stops being the one the stated rule picks, its track stops summing to the path the day\'s certificate flew, the reserve is decided again after the point where it stopped being decided, or the route\'s last report stops giving the verdict the day\'s certificate gives this flight';

  /* THE RULE THAT PICKS IT: of the flights the day's certificates cover, the longest seen from take-off to landing
     (neither end truncated) between two different places of the city pack, each end within 4 km of one */
  const certs = gun(CERTS), audited = new Map();
  for (const c of certs) audited.set(c.icao + ':' + c.flight.tStart, c.flight);
  const cands = [];
  for (const o of gun(HELI)) for (const f of FL.segmentTrace(o)) {
    if (f.truncatedStart || f.truncatedEnd) continue;
    const cf = [...audited.entries()].find(([key, x]) => key.startsWith(o.icao + ':') && Math.abs(x.tStart - f.tStart) < 0.01);
    if (!cf) continue;
    const a = place(f.start), b = place(f.end);
    if (a.k !== b.k && a.d < NEAR_KM && b.d < NEAR_KM) cands.push({ o, f, a, b });
  }
  cands.sort((x, y) => y.f.pathKm - x.f.pathKm);
  guard(STOP, cands.length > 1 && cands[0].f.pathKm > cands[1].f.pathKm, 'no unique longest flight');
  const { o, f, a, b } = cands[0];
  const flights = audited.size;
  const run = FL.parsePoints(o).filter((p) => p.t >= f.tStart && p.t <= f.tEnd && !p.ground);
  const at = [0];
  for (let i = 1; i < run.length; i++) at.push(at[i - 1] + FL.havKm(run[i - 1].lat, run[i - 1].lon, run[i].lat, run[i].lon));
  guard(STOP, run.length === f.points && at[at.length - 1] === f.pathKm, run.length + ' reports, ' + at[at.length - 1] + ' km');

  /* the certificate the day's ledger holds for this flight, spec and rule */
  const cert = certs.filter((c) => c.icao === o.icao && Math.abs(c.flight.tStart - f.tStart) < 0.01 && c.spec === SPEC && c.rule === RULE);
  guard(STOP, cert.length === 1 && Math.abs(cert[0].flight.pathKm - f.pathKm) < 0.05, 'certificate rows: ' + cert.length);

  /* the reserve, asked at every report: had the mission ended after this much of the route */
  const spec = M.loadSpec(SPEC), rule = M.loadRule(RULE), phys = M.loadPhysics('kasliwal-2019');
  const v = run.map((p, i) => (i === 0 ? null : M.auditFlight({ gcKm: FL.havKm(run[0].lat, run[0].lon, p.lat, p.lon), pathKm: at[i] }, spec, rule, phys).verdict));
  const k = v.findIndex((x, i) => i > 0 && x !== 'CERTIFIED');
  guard(STOP, k > 1 && v.slice(1, k).every((x) => x === 'CERTIFIED') && v.slice(k).every((x) => x === 'REFUSED') && v[v.length - 1] === cert[0].verdict,
    'change at ' + k + ', last ' + v[v.length - 1] + ', certificate ' + cert[0].verdict);
  const gaps = [];
  for (let i = 1; i < run.length; i++) if (run[i].t - run[i - 1].t > 60) gaps.push(i);
  guard(STOP, gaps.length === f.gapCount && gaps.every((i) => i < k), 'gaps ' + gaps.join(','));
  const heldKm = OUT.down(at[k - 1], 1), totalKm = OUT.down(f.pathKm, 1);
  const gapS = Math.round(run[gaps[0]].t - run[gaps[0] - 1].t), gapTxt = Math.floor(gapS / 60) + ' min ' + (gapS % 60) + ' s';

  /* the map: an equirectangular frame around the route and its two places, 2 km of margin, the city pack's places inside it */
  const lats = run.map((p) => p.lat), lons = run.map((p) => p.lon);
  const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2, kx = Math.cos(lat0 * Math.PI / 180), KM = 111.195;
  const E = (p) => [(p.lon) * kx * KM, -(p.lat) * KM];
  const pr = run.map(E), ends = [city.heliports[a.k], city.heliports[b.k]].map(E);
  const xs = pr.concat(ends).map((q) => q[0]), ys = pr.concat(ends).map((q) => q[1]);
  const pad = 2, bx0 = Math.min(...xs) - pad, bx1 = Math.max(...xs) + pad, by0 = Math.min(...ys) - pad, by1 = Math.max(...ys) + pad;
  const MX0 = 8, MX1 = PW - 8, MY0 = 42, MY1 = PH - 4;
  const s = Math.min((MX1 - MX0) / (bx1 - bx0), (MY1 - MY0) / (by1 - by0));
  const ox = MX0 + ((MX1 - MX0) - s * (bx1 - bx0)) / 2, oy = MY0 + ((MY1 - MY0) - s * (by1 - by0)) / 2;
  const P = (p) => { const [x, y] = E(p); return [ox + (x - bx0) * s, oy + (y - by0) * s]; };
  const inFrame = (p) => { const [x, y] = E(p); return x >= bx0 && x <= bx1 && y >= by0 && y <= by1; };
  const node = (id) => city.waypoints[id] || city.heliports[id];
  const base = (out, side) => {
    const clipId = 'rt-clip-' + o.icao + '-' + side;
    out.push('    <defs><clipPath id="' + clipId + '"><rect x="' + f1(ox) + '" y="' + f1(oy) + '" width="' + f1(s * (bx1 - bx0)) + '" height="' + f1(s * (by1 - by0)) + '"/></clipPath></defs>');
    out.push('    <g clip-path="url(#' + clipId + ')">');
    for (const [p, q] of city.edges) { const A = P(node(p)), B = P(node(q)); out.push(line(A[0], A[1], B[0], B[1], GUIDE)); }
    out.push('    </g>');
    for (const [id, h] of Object.entries(city.heliports)) {
      if (!inFrame(h)) continue;
      const [x, y] = P(h);
      out.push(rect(x - 2.5, y - 2.5, 5, 5, 'fill="none" stroke="var(--ink-4)" stroke-width="1"'));
      out.push(t(x + 5, y - 5, id, 't-note'));
    }
  };
  const when = new Date(f.tStart * 1000).toISOString().slice(11, 16);
  const title = o.r + ', ' + a.k + ' to ' + b.k + ', ' + when + ' UTC';

  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn')];
    base(out, 'u');
    out.push(poly(pr.map((_, i) => P(run[i])), PLAIN));
    out.push(plainDot(...P(run[0])), plainDot(...P(run[run.length - 1])));
    out.push(t(8, 34, title, 't-ax'));
    return svg(PW, PH, 'As usually drawn: a map of New York\'s helicopter corridors and one track, ' + title + ', drawn as a single line in one ink through all '
      + run.length + ' reports. The ' + gapTxt + ' with no reports is bridged like the rest, and nothing marks where along the route the question asked of it stops being decided.', out);
  })();

  const warrant = (() => {
    const h = PL.hatch(), out = [h.def, eyebrow(8, 14, 'in warrant')];
    base(out, 'w');
    /* refused from the change to the landing: the void along the path, no line inside it */
    out.push(ribbon(h, run.slice(k - 1).map(P), 9));
    /* decided from take-off to the change, broken where the reports stopped */
    const cuts = [0].concat(gaps, [k]);
    for (let j = 0; j + 1 < cuts.length; j++) out.push(poly(run.slice(cuts[j], cuts[j + 1]).map(P), W.attrs(W.DECIDED, { width: 2.4 })));
    for (const g of gaps) {
      const A = P(run[g - 1]), B = P(run[g]), mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
      out.push(dot(mx, my, 6.5, 'class="w-void" fill="url(#' + h.id + ')" stroke="var(--rule-strong)" stroke-width="1"'));
      out.push(t(mx - 20, my + 13, '∅ ' + gapTxt, 't-note', 'end'), t(mx - 20, my + 27, 'no reports', 't-note', 'end'));
      out.push(line(mx - 18, my + 9, mx - 6, my + 3, 'stroke="var(--ink-4)" stroke-width="1"'));
    }
    const S0 = P(run[0]), S1 = P(run[run.length - 1]), K = P(run[k - 1]);
    out.push(GAL.atoms.knot(S0[0], S0[1], W.DECIDED), GAL.atoms.knot(S1[0], S1[1], W.DECIDED));
    out.push('    <circle cx="' + f1(K[0]) + '" cy="' + f1(K[1]) + '" r="3.6" class="w-decided" fill="var(--sunk)" stroke="var(--ink)" stroke-width="1.6"/>');
    out.push(t(K[0] - 12, K[1] + 2, 'reserve holds,', 't-note', 'end'), t(K[0] - 12, K[1] + 16, 'decided to km ' + heldKm, 't-note', 'end'));
    out.push(t(S1[0] - 8, S1[1] - 9, 'landing, km ' + totalKm, 't-note', 'end'));
    /* the void's reason, in the corner under the ribbon's far arm */
    out.push(voidWords(PW - 54, PH - 22, ['∅ undecided:', 'boxes straddle']));
    out.push(chosen(8, 34, title, 't-ax'), mood(8, PH - 8, 'given Beta ALIA, FAA reserve'));
    return svg(PW, PH, 'In WARRANT: the same map and track. From take-off to kilometre ' + heldKm + ', where a Beta ALIA flying this far is decided to land above the FAA\'s 20-minute reserve at every point of its published boxes, the track is a solid line, decided; it breaks where no reports arrived for '
      + gapTxt + ', marked there with a hatched empty-set sign. From kilometre ' + heldKm + ' to the landing at kilometre ' + totalKm + ' the boxes straddle the reserve, so the route is a hatched void, refused, with no line inside it. Take-off and landing, both seen, are solid dots. The flight\'s name is underlined dotted: it was picked by a stated rule, a choice. The corridors are guides and assert nothing.', out);
  })();

  return {
    id: 'route-reserve', title: 'A route, and where a decision about it stops', form: 'a route on a map', kind: 'built',
    source: 'built: the day\'s pinned ADS-B traces (' + HELI + ') and the eVTOL energy instrument, re-run at every report',
    stop: STOP, usual, warrant, link: 'apps/skyaudit/',
    hides: 'The usual map draws a flight as one line. It bridges ' + gapTxt + ' without reports as if they were flown, and it cannot show where along the route a claim about the flight stops being decided. Here the track breaks where the reports stop, the stretch where the reserve is decided to hold is solid, and the rest is a void with its reason.',
    rule: 'Draw a route from the reports that were received, break it wherever they stop, and mark the point where a decision about the route changes, with a solid line where it is decided and a void where it is not.',
    caption: 'The day\'s longest flight seen from take-off to landing between two places of the city pack, picked by that rule: a ' + esc(String(o.desc).toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())) + ', '
      + esc(title) + ', 26 August 2026, ' + run.length + ' ADS-B reports, ' + totalKm + ' km. At each report the instrument asks whether a Beta ALIA, flown this far under the FAA\'s 20-minute reserve, lands above the floor at every point of its published boxes, <em>given those boxes</em> and the energy model of Kasliwal et al. (2019), a premise ' + W.grade(W.ASSUMED) + ' here. It does to kilometre ' + heldKm + '; past it the boxes straddle the floor, and at the landing the answer is the one the day\'s certificate gives, '
      + esc(cert[0].verdict) + '. The corridors are the city pack\'s simplified graph, a guide. Of the day\'s ' + flights + ' flights, one is drawn.',
  };
}

/* ======================================================= 2. a board of verdicts ==
   Janela's run of 23 October 2026 at its nine open-sea sites: can a 48-hour launch start at each six-hour step? */
function board(guard) {
  guard = makeGuard(guard);
  const REC = 'certs/janela-decisions/20261023.json';
  const R = JSON.parse(read(REC));
  const OP = 'lancamento', N = R.t.length, ci = R.crits.indexOf('band');
  const pre = R.presets.find((p) => p.id === OP);
  const need = Math.ceil(pre.TR / 6);
  const NAME = { 'foz-amazonas': 'Amazon Mouth', potiguar: 'Potiguar', sergipe: 'Sergipe', 'espirito-santo': 'Espírito Santo', 'campos-p25': 'P-25 platform',
    campos: 'Campos', santos: 'Santos', floripa: 'Florianópolis', pelotas: 'Pelotas' };
  const rows = Object.entries(R.sites).map(([id, s]) => ({ id, lat: s.node[0], codes: s.dec[OP].slice(ci * N, (ci + 1) * N) })).sort((x, y) => y.lat - x.lat);
  const STOP = 'the operation stops being a 48-hour launch at Hs ≤ 2.0 m, a row holds a letter that is not a verdict, or a start whose 48 hours run past the forecast carries one';
  guard(STOP, pre.TR === 48 && pre.limits.length === 1 && pre.limits[0].var === 'hs' && pre.limits[0].op === '<=' && pre.limits[0].value === '2.0'
    && rows.length === Object.keys(NAME).length && rows.every((r) => NAME[r.id] && r.codes.length === N && /^[LVI]+$/.test(r.codes.slice(0, N - need)) && /^-+$/.test(r.codes.slice(N - need))),
  rows.map((r) => r.id + ' ' + r.codes).join('; '));
  const count = (c) => rows.reduce((n, r) => n + r.codes.split('').filter((x) => x === c).length, 0);
  const nL = count('L'), nV = count('V'), nI = count('I');
  guard(STOP, nL > 0 && nV > 0 && nI > 0);
  const GX0 = 112, GX1 = PW - 8, cw = (GX1 - GX0) / N, GY0 = TOP + 4, rh = 22, bh = 14;
  const cx = (i) => GX0 + i * cw, ry = (j) => GY0 + j * rh;
  const days = R.t.map((x, i) => [x, i]).filter(([x]) => x.slice(11, 13) === '00');
  const axis = (out) => {
    for (const [x, i] of days) {
      out.push(line(cx(i), GY0 - 2, cx(i), ry(rows.length) + 2, 'stroke="var(--c-grid)" stroke-width="1"'));
      if (i < N - 1) out.push(t(cx(i) + 2, ry(rows.length) + 14, String(+x.slice(8, 10)), 't-ax'));
    }
    out.push(t(GX0 - 6, ry(rows.length) + 14, 'Oct', 't-ax', 'end'));
    rows.forEach((r, j) => out.push(t(GX0 - 6, ry(j) + rh / 2 + 4, NAME[r.id], 't-note', 'end')));
  };
  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn')];
    axis(out);
    rows.forEach((r, j) => runsOf(r.codes).filter((u) => u.c === 'L').forEach((u) => out.push(rect(cx(u.i0) + 0.5, ry(j) + (rh - bh) / 2, (u.i1 - u.i0 + 1) * cw - 1, bh, 'fill="var(--ink-3)"'))));
    out.push(t(8, 34, 'workable starts, by site', 't-ax'));
    return svg(PW, PH, 'As usually drawn: a board of nine sites by the week\'s six-hour steps, a cell filled where a 48-hour launch can start and blank everywhere else, so a start that is blocked, one that cannot be decided and one whose 48 hours run past the forecast all look the same.', out);
  })();
  const warrant = (() => {
    const h = PL.hatch(), out = [h.def, eyebrow(8, 14, 'in warrant')];
    axis(out);
    rows.forEach((r, j) => runsOf(r.codes.slice(0, N - need)).forEach((u) => {
      const x = cx(u.i0) + 0.5, w = (u.i1 - u.i0 + 1) * cw - 1, y = ry(j) + (rh - bh) / 2;
      if (u.c === 'L') out.push(rect(x, y, w, bh, FILLED));
      else if (u.c === 'V') out.push(rect(x + 0.6, y + 0.6, w - 1.2, bh - 1.2, OUTLINED));
      else out.push(PL.voidRect(h, x, y, w, bh));
    }));
    /* the starts whose 48 hours run past the last forecast step: one void, for every site, with its reason */
    out.push(PL.voidRect(h, cx(N - need) + 0.5, ry(0) + 2, need * cw - 1, rows.length * rh - 4));
    out.push(voidWords(cx(N - need) + need * cw / 2, ry(0) + rows.length * rh / 2 - 10, ['∅ past', 'the', 'forecast']));
    /* the key, one shape per verdict, in words */
    const kx = 8, ky = 26;
    out.push(rect(kx, ky, 12, 9, FILLED), t(kx + 16, ky + 8, 'cleared', 't-note'));
    out.push(rect(kx + 80, ky, 12, 9, OUTLINED), t(kx + 96, ky + 8, 'blocked', 't-note'));
    out.push(PL.voidRect(h, kx + 160, ky, 12, 9), t(kx + 176, ky + 8, '∅ undecided', 't-note'));
    out.push(mood(PW - 8, ry(rows.length) + 30, 'given Hs ≤ 2.0 m for 48 h', 'end'));
    out.push(chosen(8, ry(rows.length) + 30, 'run of ' + (+R.run.slice(8, 10)) + ' Oct, ' + R.run.slice(11, 13) + ' UTC'));
    return svg(PW, PH, 'In WARRANT: the same board. A start where every limit holds at the band\'s unfavourable edge for all 48 hours is a filled bar, cleared, decided; one where even the favourable edge breaks the limit is an outlined bar, blocked, decided; one where the band straddles the limit is a hatched void, undecided; and the last '
      + need + ' starts of every row, whose 48 hours run past the last forecast step, are one hatched void with the words past the forecast. The run is underlined dotted: one of the kept runs, chosen.', out);
  })();
  return {
    id: 'window-board', title: 'A week of windows', form: 'a board of verdicts over time', kind: 'record', record: REC, stop: STOP, usual, warrant, link: 'janela/',
    hides: 'A go/no-go board fills the cells that are go and leaves the rest blank, so blocked, cannot tell and not forecast that far look alike. Here each has its own shape and its word, and the hours past the forecast are one void with its reason.',
    rule: 'Give each verdict on a board its own shape and its word (cleared filled, blocked outlined, undecided hatched), and draw the part with nothing to decide on as one void with its reason, never as a blank.',
    caption: 'Janela\'s decisions for the run of ' + esc(R.run.slice(0, 10)) + ', ' + esc(R.run.slice(11, 13)) + ' UTC, one of the runs its decision record keeps, chosen: at each open-sea site and each six-hour step of the week, can a 48-hour launch (significant wave height ≤ 2.0 m) start then, decided over the band the forecast\'s measured error gives. Of the '
      + (nL + nV + nI) + ' starts the forecast reaches, ' + nL + ' are cleared, ' + nV + ' blocked and ' + nI + ' undecided. Swell draws its week the same way, an activity by the hour.',
  };
}

/* ================================================== 3. a timeline over a forecast ==
   One row of that board, Potiguar's, over the band it was decided on: the ledger's commits for that run, decided again
   here by the same decider, and refused if the windows differ from the ones Janela published. */
function timeline(guard) {
  guard = makeGuard(guard);
  const REC = 'certs/janela-decisions/20261023.json';
  const D = require(path.join(ROOT, 'instruments', 'window', 'decide.js'));
  const R = JSON.parse(read(REC));
  const SITE = 'potiguar', OP = 'lancamento', DOM = 'janela/hs-altimeter/union-v1';
  const STOP = 'the windows decided here from the band in the ledger stop being the windows Janela published for Potiguar that run, or a step of the band stops coming from the ledger';
  const byId = new Map(ledger().filter((r) => r.type === 'commit').map((r) => [r.id, r]));
  const steps = [];
  for (let lead = 12; lead <= 168; lead += 6) {
    const c = byId.get('janela:' + SITE + ':' + R.run + ':+' + lead + 'h:union-v1');
    guard(STOP, c && c.domain === DOM && c.forecast.lead === lead, 'lead ' + lead);
    steps.push({ t: c.targetTime.slice(0, 13), lead, lo: Q.parse(c.forecast.lo), hi: Q.parse(c.forecast.hi), alpha: c.forecast.alpha });
  }
  const pre = R.presets.find((p) => p.id === OP), need = Math.ceil(pre.TR / 6) * 6;
  const CODE = { LIBERADA: 'L', VETADA: 'V', INDEFINIDA: 'I', 'SEM DADOS': 'n' };
  const codes = steps.map((st) => {
    const idx = steps.filter((x) => x.lead >= st.lead && x.lead <= st.lead + need);
    if (idx[idx.length - 1].lead < st.lead + need) return '-';
    const fc = { unit: { hs: 'm' }, steps: idx.map((x) => ({ t: x.t, vars: { hs: { lo: Q.str(x.lo), hi: Q.str(x.hi) } } })) };
    return CODE[D.decide({ id: OP, limits: pre.limits }, fc, [idx[0].t, idx[idx.length - 1].t]).verdict];
  }).join('');
  const N = R.t.length, ci = R.crits.indexOf('band');
  const pub = R.sites[SITE].dec[OP].slice(ci * N, (ci + 1) * N).slice(R.lead.indexOf(12));
  guard(STOP, codes === pub, 'decided ' + codes + ' published ' + pub);
  const LIM = Q.parse(pre.limits[0].value);
  const ru = runsOf(codes), clr = ru.find((u) => u.c === 'L');
  guard(STOP, clr && ru.filter((u) => u.c === 'L').length === 1 && steps.some((st) => Q.cmp(st.hi, LIM) > 0));
  const claim = steps[0].alpha, claimIn = (claim[1] - claim[0]) + ' in ' + claim[1];
  guard(STOP, steps.every((st) => st.alpha[0] === claim[0] && st.alpha[1] === claim[1]));
  const lbl = (st) => WEEKDAY[dayOf(st.t).getUTCDay()] + ' ' + st.t.slice(11, 13) + 'h';
  const cFrom = lbl(steps[clr.i0]), cTo = lbl(steps[clr.i1]);
  const O = { w: PW, h: PH, padL: 40, padR: 12, padT: TOP, padB: 108, x0: 9, x1: 171, y0: 0.6, y1: 2.4 };
  const dayTicks = steps.filter((st) => st.t.slice(11, 13) === '00' && st.lead < 168).map((st) => ({ v: st.lead, t: WEEKDAY[dayOf(st.t).getUTCDay()] + ' ' + (+st.t.slice(8, 10)) }));
  const ax = (f) => CH.axes(f, { yTicks: [1, 1.5, 2].map((v) => ({ v, t: v.toFixed(1) })), xTicks: dayTicks });
  const LY = (f) => f.T + f.ph + 44, LH = 14;
  const strip = (f, i) => [f.px(steps[i].lead - 3), f.px(steps[i].lead + 3)];
  const stripHead = (f, s) => t(f.L, LY(f) - 6, s, 't-note');
  const usual = (() => {
    const f = CH.frame(O), out = [ax(f), eyebrow(8, 14, 'as usually drawn')];
    out.push(poly(steps.map((st) => [f.px(st.lead), f.py(qf(st.lo))]), PLAIN), poly(steps.map((st) => [f.px(st.lead), f.py(qf(st.hi))]), PLAIN));
    out.push(line(f.px(9), f.py(2), f.px(171), f.py(2), PLAIN));
    out.push(rect(strip(f, clr.i0)[0], LY(f), strip(f, clr.i1)[1] - strip(f, clr.i0)[0], LH, 'fill="var(--ink-3)"'));
    out.push(stripHead(f, 'launch window'));
    out.push(head(f, 'wave height at Potiguar, m', 't-ax'));
    return svg(PW, PH, 'As usually drawn: two lines for the forecast\'s lower and upper edge and a line at the 2.0 m limit, all in one ink, and below them one bar for the hours a launch can start. The starts that cannot be decided and the starts whose 48 hours run past the forecast are both left blank.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), h = PL.hatch(), out = [h.def, ax(f), eyebrow(8, 14, 'in warrant')];
    const band = steps.map((st) => [f.px(st.lead), f.py(qf(st.hi))]).concat(steps.slice().reverse().map((st) => [f.px(st.lead), f.py(qf(st.lo))]));
    out.push('    <path d="' + pathD(band) + 'Z" fill="var(--rule)" stroke="none"/>');
    out.push(poly(steps.map((st) => [f.px(st.lead), f.py(qf(st.lo))]), W.attrs(W.COMPUTED, { width: 1.6 })), poly(steps.map((st) => [f.px(st.lead), f.py(qf(st.hi))]), W.attrs(W.COMPUTED, { width: 1.6 })));
    out.push(line(f.px(9), f.py(2), f.px(171), f.py(2), W.attrs(W.DECIDED, { width: 1.4 })));
    out.push(mood(f.px(66), f.py(2) - 6, 'given Hs ≤ 2.0 m for 48 h'));
    ru.forEach((u) => {
      const x0 = strip(f, u.i0)[0] + 1, x1 = strip(f, u.i1)[1] - 1;
      if (u.c === 'L') out.push(rect(x0, LY(f), x1 - x0, LH, FILLED));
      else if (u.c === 'V') out.push(rect(x0, LY(f), x1 - x0, LH, OUTLINED));
      else out.push(PL.voidRect(h, x0, LY(f), x1 - x0, LH));
    });
    /* each run's word, in the order the runs come: the first line under the strip, the tail's on a second */
    const ty = LY(f) + LH + 14, first = ru[0], tail = ru.slice(ru.indexOf(clr) + 1);
    if (first.c === 'I') out.push(t(strip(f, first.i0)[0] + 1, ty + 14, '∅ undecided', 't-note'));
    out.push(t(strip(f, clr.i0)[0] + 4, ty, 'cleared: start ' + cFrom + ' – ' + cTo, 't-note'));
    out.push(t(strip(f, ru[ru.length - 1].i1)[1] - 1, ty + 14, tail.map((u) => (u.c === 'I' ? '∅ undecided' : '∅ past the forecast')).join(', then '), 't-note', 'end'));
    out.push(stripHead(f, 'start a 48 h launch at'));
    const who = 'Potiguar, run of ' + (+R.run.slice(8, 10)) + ' Oct';
    out.push(chosen(f.L, f.T - 12, who), t(f.L + after(who), f.T - 12, '· Hs, m', 't-note'));
    return svg(PW, PH, 'In WARRANT: the forecast band\'s two edges dashed, computed, a claim of ' + claimIn + '; the 2.0 m limit a solid line, decided, named in italic as the input the decision is made given; below, each start time\'s verdict for a 48-hour launch: a filled bar, cleared, from '
      + cFrom + ' to ' + cTo + ', where the band\'s top edge stays under the limit for all 48 hours; hatched voids, undecided, where the band straddles it; and a hatched void where the 48 hours would run past the forecast. The site and run are underlined dotted: one row of the week above, chosen.', out);
  })();
  return {
    id: 'window-timeline', title: 'An operating window', form: 'a timeline over a forecast', kind: 'record', record: [LEDGER, REC], stop: STOP, usual, warrant, link: 'janela/',
    hides: 'The usual chart draws the forecast as if it were the sea, with one bar for when the job can start. The forecast is a claim: here it is dashed, the limit it is decided against is solid, and below them each start time carries its verdict, cleared where the band\'s top edge stays under the limit for the whole job and a void where the band straddles it or the job outruns the forecast.',
    rule: 'Draw a forecast dashed, the limit it is decided against solid, and the window the decision opens as a span with its word; where the forecast straddles the limit, draw the void, not a guess.',
    caption: 'Potiguar, the run of ' + esc(R.run.slice(0, 10)) + ', 00 UTC, one row of the week above, chosen: the band Janela decides on (ECMWF\'s and NOAA\'s forecasts, each widened by the error measured against satellites at this site, joined; it claims ' + claimIn + '), from 12 to 168 hours ahead, as committed to the public ledger before the sea was seen. A 48-hour launch needs Hs ≤ 2.0 m at every forecast step of its window; decided here again from the ledger, the windows are the ones Janela published that morning.',
  };
}

/* ======================================================= 4. a forecast, graded ==
   Two forecasts of Potiguar's sea against the satellite passes that came later: the ECMWF ensemble (shown, never decided
   on) and the band Janela decides on. The grade admits or prunes a forecaster; it never decides a window. */
function graded(guard) {
  guard = makeGuard(guard);
  const SITE = 'potiguar';
  const PROP = [
    { dom: 'janela/hs-altimeter/ens-c40of50', suf: '', name: 'ECMWF ensemble, central 40 of 50' },
    { dom: 'janela/hs-altimeter/union-v1', suf: ':union-v1', name: 'the band Janela decides on' },
  ];
  const DEF = 'certs/janela-ledger/DEFINITIONS.json';
  const STOP = 'a score\'s hit or miss stops agreeing with its band and the satellite\'s height in exact arithmetic, the two forecasts stop being graded on the same passes, a forecast is drawn at any lead but the newest one before its pass, or the ledger\'s definitions stop matching a pass within 3 h and 100 km';
  /* the ledger's own definitions: what a pass is, and what each forecast claims */
  const defs = Object.values(JSON.parse(read(DEF)));
  const defOf = (dom) => defs.find((d) => d.domain === dom) || (dom.endsWith('/ens-c40of50') ? defs.find((d) => /central 40 of 50/.test(d.proposer || '') && !d.domain) : null);
  guard(STOP, PROP.every((p) => { const d = defOf(p.dom); return d && /within 100 km/.test(d.target) && /within 3 h/.test(d.target); }), PROP.map((p) => !!defOf(p.dom)).join(','));
  const rows = ledger(), com = new Map(), sco = new Map();
  for (const r of rows) (r.type === 'commit' ? com : sco).set(r.id, r);
  const inside = (c, s) => Q.cmp(Q.parse(c.forecast.lo), Q.parse(s.outcome)) <= 0 && Q.cmp(Q.parse(s.outcome), Q.parse(c.forecast.hi)) <= 0;
  /* every score of the two forecasts, everywhere, re-decided exactly */
  const tot = PROP.map((p) => {
    let n = 0, k = 0, bad = 0;
    for (const [id, s] of sco) { const c = com.get(id); if (!c || c.domain !== p.dom) continue; n++; if (s.covered) k++; if (s.covered !== inside(c, s)) bad++; }
    return { n, k, bad };
  });
  guard(STOP, tot.every((x) => x.n > 0 && x.bad === 0), JSON.stringify(tot));
  /* at the site: each pass, the newest forecast of each */
  const per = PROP.map((p) => {
    const by = new Map();
    for (const [id, s] of sco) {
      const c = com.get(id);
      if (!c || c.domain !== p.dom || id.split(':')[1] !== SITE) continue;
      const cur = by.get(c.targetTime);
      if (!cur || c.forecast.lead < cur.c.forecast.lead) by.set(c.targetTime, { c, s });
    }
    return by;
  });
  const T = [...per[0].keys()].filter((x) => per[1].has(x)).sort();
  guard(STOP, T.length > 6 && T.length === per[0].size && T.length === per[1].size && T.every((x) => per[0].get(x).c.forecast.lead === per[1].get(x).c.forecast.lead
    && per[0].get(x).s.outcome.join('/') === per[1].get(x).s.outcome.join('/')), T.length + ' passes');
  const claim = PROP.map((_, j) => { const a = per[j].get(T[0]).c.forecast.alpha; return { a, txt: (a[1] - a[0]) + ' in ' + a[1] }; });
  guard(STOP, PROP.every((p, j) => T.every((x) => per[j].get(x).c.forecast.alpha.join('/') === claim[j].a.join('/')) && defOf(p.dom).alpha === claim[j].a.join('/')));
  const hits = PROP.map((_, j) => T.filter((x) => per[j].get(x).s.covered).length);
  const leads = T.map((x) => per[0].get(x).c.forecast.lead), lmin = Math.min(...leads), lmax = Math.max(...leads);
  const dd = (iso) => (+iso.slice(8, 10)) + ' Oct';
  const X0 = 46, X1 = PW - 12, sx = (i) => X0 + (i + 0.5) * (X1 - X0) / T.length;
  const RY = [TOP + 14, TOP + 132], RH = 92, Y0 = 0.8, Y1 = 2.4, yv = (j, v) => RY[j] + RH - (v - Y0) / (Y1 - Y0) * RH;
  const frame = (out) => {
    PROP.forEach((_, j) => {
      for (const v of [1, 2]) { out.push(line(X0, yv(j, v), X1, yv(j, v), 'stroke="var(--c-grid)" stroke-width="1"')); out.push(t(X0 - 8, yv(j, v) + 4, v.toFixed(1) + ' m', 't-ax', 'end')); }
      out.push(line(X0, RY[j] + RH, X1, RY[j] + RH, 'stroke="var(--c-axis)" stroke-width="1"'));
    });
    out.push(t(sx(0), RY[1] + RH + 16, dd(T[0]), 't-ax', 'middle'), t(sx(T.length - 1), RY[1] + RH + 16, dd(T[T.length - 1]), 't-ax', 'middle'));
    out.push(t((X0 + X1) / 2, RY[1] + RH + 16, T.length + ' passes, in order', 't-note', 'middle'));
  };
  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn')];
    frame(out);
    PROP.forEach((p, j) => {
      out.push(t(X0, RY[j] - 8, j ? 'calibrated band' : 'ensemble', 't-ax'));
      T.forEach((x, i) => { const c = per[j].get(x).c; out.push(line(sx(i), yv(j, qf(c.forecast.lo)), sx(i), yv(j, qf(c.forecast.hi)), PLAIN)); });
      out.push(poly(T.map((x, i) => [sx(i), yv(j, qf(per[j].get(x).s.outcome))]), PLAIN));
      T.forEach((x, i) => out.push(plainDot(sx(i), yv(j, qf(per[j].get(x).s.outcome)), 2.6)));
    });
    return svg(PW, PH, 'As usually drawn: two rows, the ensemble and the calibrated band, each forecast an error bar and the satellite\'s height a dot joined by a line across the days without a pass, all in one ink; nothing says which bars missed or what each forecast claimed.', out);
  })();
  const warrant = (() => {
    const out = [eyebrow(8, 14, 'in warrant')];
    frame(out);
    out.push(chosen(8, 34, 'Potiguar', 't-ax'), t(8 + after('Potiguar', 't-ax'), 34, '· the newest forecast before each pass', 't-note'));
    PROP.forEach((p, j) => {
      out.push(t(X0, RY[j] - 8, j ? 'the band' : 'ECMWF ensemble', 't-note'));
      out.push(mood(X0 + (j ? 62 : 104), RY[j] - 8, 'claims ' + claim[j].txt));
      out.push(t(X1, RY[j] - 8, hits[j] + ' of ' + T.length + ' caught', 't-lab', 'end'));
      T.forEach((x, i) => {
        const { c, s } = per[j].get(x), lo = qf(c.forecast.lo), hi = qf(c.forecast.hi), ob = qf(s.outcome), bw = 7;
        const y0 = yv(j, hi), y1 = yv(j, lo);
        out.push(s.covered ? rect(sx(i) - bw / 2, y0, bw, Math.max(1.5, y1 - y0), 'class="w-computed" fill="var(--ink-4)" stroke="var(--ink-4)" stroke-width="1"')
          : rect(sx(i) - bw / 2 + 0.5, y0, bw - 1, Math.max(1.5, y1 - y0), 'class="w-computed" fill="none" stroke="var(--ink-3)" stroke-width="1"'));
        if (!s.covered) out.push(line(sx(i), ob > hi ? y0 : y1, sx(i), yv(j, ob), W.attrs(W.DECIDED, { width: 1.4 })));
        out.push(dot(sx(i), yv(j, ob), 3, 'class="w-decided" fill="var(--ink)" stroke="none"'));
      });
    });
    return svg(PW, PH, 'In WARRANT: the same two rows. Each forecast is a bar, an extent whose body is a computed claim: filled where the satellite\'s height fell inside it, outlined where it missed, with the miss drawn as a solid line from the bar\'s edge to the height. Each pass is a solid dot. Each row prints what its forecast claimed, in italic, and how many passes it caught: the ensemble '
      + hits[0] + ' of ' + T.length + ' against a claim of ' + claim[0].txt + ', the band ' + hits[1] + ' of ' + T.length + ' against ' + claim[1].txt + '. The site is underlined dotted: one of the ledger\'s sites, chosen.', out);
  })();
  return {
    id: 'forecast-graded', title: 'A forecast, graded', form: 'a forecast scored against what happened', kind: 'record', record: [LEDGER, DEF], stop: STOP, usual, warrant, link: 'janela/',
    hides: 'The usual verification plot lays forecasts and observations side by side and leaves the judging to the eye. Here each forecast is a claim, a miss is drawn as the gap between the claim and the sea, and the count of hits sits beside what each forecast claimed. The grade admits or prunes a forecaster; it never decides a window.',
    rule: 'Draw a forecast\'s band beside what was later observed, draw each miss as the gap between them, and print the count of hits against the coverage the forecast claimed.',
    caption: 'Potiguar, the site of the window above, chosen, ' + dd(T[0]) + ' to ' + dd(T[T.length - 1]) + ' 2026: each time a satellite altimeter passed within 100 km and 3 hours of a forecast step, the newest forecast for that step (' + lmin + ' to ' + lmax + ' hours ahead), as committed to the public ledger before the pass. Top, the ECMWF ensemble\'s central 40 of 50 members, shown on Janela and never decided on; bottom, the band Janela decides on. Across every site so far the ensemble caught '
      + tot[0].k + ' of ' + tot[0].n + ' passes and the band ' + tot[1].k + ' of ' + tot[1].n + '; every hit and miss re-decided here in exact arithmetic.',
  };
}

/* =========================================================== 5. a light curve ==
   The exoplanet transit: TrES-2 b's folded Kepler light curve, the conventional fit, and the two most different stars
   the instrument found that pass through every bin's allowance. The radius ratio is decided as an interval. */
function lightCurve(guard) {
  guard = makeGuard(guard);
  const PAGE = 'instruments/transit/out/page.json', WIT = 'instruments/transit/out/witness.json';
  const TRN = require(path.join(ROOT, 'instruments', 'transit', 'transit.js')), FIT = require(path.join(ROOT, 'instruments', 'transit', 'fit.js'));
  const Dp = JSON.parse(read(PAGE)), Dw = JSON.parse(read(WIT));
  const T = Dp.targets[0], KEY = T.key, Wk = Dw.targets.find((x) => x.key === KEY);
  const res = T.results.find((r) => r.orbit === 'exact' && r.rung === 'monotone');
  const cv = (side) => Wk.curves.find((c) => c.orbit === 'exact' && c.rung === 'monotone' && c.side === side);
  const lo = cv('lo'), hi = cv('hi'), fit = T.fit, bud = T.budget;
  const STOP = 'the dotted stars stop being the ends of the admitted range the record decides, the decided range stops containing the fit and every published radius, or a bin is drawn without its allowance';
  guard(STOP, res.ok && lo.k === res.inner[0] && hi.k === res.inner[1] && res.outer[0] < res.inner[0] && res.inner[1] < res.outer[1]
    && fit.k > res.inner[0] && fit.k < res.inner[1] && T.published.length > 0 && T.published.every((p) => p.k >= res.outer[0] && p.k <= res.outer[1])
    && T.curve.length === T.nBins && T.curve.every((b) => b.length === 3 && b[2] > 0), T.published.length + ' published');
  const enc = OUT.enc(res.outer, 4), k3 = (x) => OUT.down(x, 3);
  /* the conventional model, evaluated from the record's fitted parameters (float: a quadratic limb-darkening law) */
  const QM = FIT.quadMeasure(fit.u1, fit.u2);
  const fitAt = (h) => 1 - FIT.depthOf(QM, TRN.zOf(h / 24, fit.aR, fit.b, T.P), fit.k);
  const XR = 1.3, H = []; for (let h = -XR; h <= XR + 1e-9; h += 0.013) H.push(h);
  const fitPts = H.map((h) => [h, fitAt(h)]);
  const bins = T.curve.filter((bn) => Math.abs(bn[0]) <= XR);
  const ppm = (fl) => (fl - 1) * 1e6;
  const O = { w: PW, h: PH, padL: 46, padR: 146, padT: TOP, padB: 44, x0: -XR, x1: XR, y0: -15800, y1: 1400 };
  const ax = (f) => CH.axes(f, { yTicks: [0, -5000, -10000, -15000].map((v) => ({ v, t: v ? '−' + (-v / 1000) + 'k' : '0' })),
    xTicks: [-1, 0, 1].map((v) => ({ v, t: (v < 0 ? '−' + (-v) : String(v)) + (v === 1 ? ' h' : '') })) });
  const P = (f, h, fl) => [f.px(h), f.py(ppm(fl))];
  const thin = (pts, n) => pts.filter((_, i) => i % n === 0 || i === pts.length - 1);
  const inX = (pts) => pts.filter(([h]) => Math.abs(h) <= XR);
  const CX = PW - 138, sw = (y, a) => line(CX, y - 4, CX + 20, y - 4, a);
  const usual = (() => {
    const f = CH.frame(O), out = [ax(f), eyebrow(8, 14, 'as usually drawn')];
    out.push('    <path d="' + bins.map((bn) => { const [x, y] = P(f, bn[0], bn[1]); return 'M' + f1(x) + ' ' + f1(y) + 'h0'; }).join('') + '" fill="none" stroke="var(--ink-3)" stroke-width="2.2" stroke-linecap="round"/>');
    out.push(poly(thin(fitPts, 2).map(([h, fl]) => P(f, h, fl)), PLAIN));
    out.push(t(CX, f.T + 20, 'Rp/R* = ' + fit.k.toFixed(4), 't-lab'));
    out.push(head(f, 'TrES-2 b, folded, ppm', 't-ax'));
    return svg(PW, PH, 'As usually drawn: TrES-2 b\'s folded light curve, the ' + bins.length + ' binned measurements of the middle ' + (2 * XR) + ' hours as dots, and one fitted curve drawn solid through them, with its radius ratio printed beside it, ' + fit.k.toFixed(4) + '; nothing shows that other stars fit the same points.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), out = [ax(f), eyebrow(8, 14, 'in warrant')];
    /* each bin as the allowance the decision is made on: the measurement, plus or minus nsig sigma + sys */
    const tick = (bn) => { const e = bud.nsig * bn[2] * 1e-6 + bud.sys, [x, y0] = P(f, bn[0], bn[1] + e), y1 = P(f, bn[0], bn[1] - e)[1]; return 'M' + f1(x) + ' ' + f1(y0) + 'V' + f1(y1); };
    out.push('    <path d="' + bins.map(tick).join('') + '" fill="none" stroke="var(--ink-4)" stroke-width="1.1"/>');
    out.push(poly(thin(fitPts, 2).map(([h, fl]) => P(f, h, fl)), W.attrs(W.COMPUTED, { width: 1.6 })));
    for (const c of [lo, hi]) out.push(poly(inX(c.depth).map(([h, fl]) => P(f, h, fl)), W.attrs(W.CHOSEN, { width: 1.8 })));
    /* the key: what is decided, in words, and one swatch per mark */
    const y0 = f.T + 8;
    out.push(t(CX, y0, 'radius ratio Rp/R*', 't-note'), t(CX, y0 + 14, 'decided:', 't-note'), t(CX, y0 + 34, enc, 't-lab'));
    out.push(sw(y0 + 66, W.attrs(W.CHOSEN, { width: 1.8 })), t(CX + 26, y0 + 62, 'two stars that', 't-note'), t(CX + 26, y0 + 76, 'fit every bin,', 't-note'), t(CX + 26, y0 + 90, 'k ' + k3(lo.k) + ', ' + k3(hi.k), 't-note'));
    out.push(sw(y0 + 120, W.attrs(W.COMPUTED, { width: 1.6 })), t(CX + 26, y0 + 116, 'the fit,', 't-note'), t(CX + 26, y0 + 130, 'k ' + k3(fit.k), 't-note'));
    out.push(line(CX + 10, y0 + 152, CX + 10, y0 + 164, 'stroke="var(--ink-4)" stroke-width="1.1"'), t(CX + 26, y0 + 156, 'a bin and its', 't-note'), t(CX + 26, y0 + 170, 'allowance', 't-note'));
    out.push(mood(PW - 8, PH - 6, 'given ' + bud.nsig + ' σ + ' + Math.round(bud.sys * 1e6 * 10) / 10 + ' ppm a bin', 'end'));
    out.push(chosen(f.L, f.T - 12, T.name), t(f.L + after(T.name), f.T - 12, 'folded, ppm', 't-note'));
    return svg(PW, PH, 'In WARRANT: the same light curve, each of the ' + bins.length + ' bins of the middle ' + (2 * XR) + ' hours drawn as a short vertical tick, the allowance the decision is made on; the conventional fit dashed, computed; two stars the instrument found that pass through every allowance, with radius ratios ' + k3(lo.k) + ' and ' + k3(hi.k)
      + ', dotted, each one member of the admitted set, chosen; and the radius ratio printed as the interval exact arithmetic decides, ' + enc + '. The planet\'s name is underlined dotted: one of the instrument\'s ' + (NUMW[Dp.targets.length] || Dp.targets.length) + ', chosen.', out);
  })();
  return {
    id: 'light-curve', title: 'A light curve, and the stars it admits', form: 'measurements over time, with what they admit', kind: 'record', record: [PAGE, WIT], stop: STOP, usual, warrant, link: 'instruments/transit/',
    hides: 'The usual chart draws one fitted curve through the points, solid, and quotes its radius to four decimals. Other stars fit the same points. Here each measurement is drawn as the allowance it is judged with, the fit is dashed, two very different stars that both pass through every allowance are dotted, and the radius is the interval the data decide.',
    rule: 'Draw each measurement as the allowance it is judged with, a fitted model dashed, the extreme members the data admit dotted, and print the decided range in words, never one fit as the answer.',
    caption: esc(T.name) + ' in Kepler short cadence, the first of the transit instrument\'s ' + (NUMW[Dp.targets.length] || Dp.targets.length) + ' planets: ' + T.nPoints.toLocaleString('en-US') + ' points folded on its period into ' + T.nBins + ' bins; drawn here, the middle ' + (2 * XR) + ' hours. The fit is the conventional analysis, a quadratic limb-darkening law, a premise ' + W.grade(W.ASSUMED)
      + ' here. Granting the orbit fitted here and only that the star is nowhere negative and does not brighten outward (<em>given those</em>), the radius ratio Rp/R* lies in ' + enc + ', printed outward, and all ' + T.published.length + ' published values sit inside it. The two dotted stars are the most different ones the instrument exhibited.',
  };
}

/* ========================================================== 6. a step function ==
   PU Verificado: a fixed-rate bond's price under the Treasury's rule table. The printed rate stands for a box of rates;
   across it the rule can print only these treads, and the file's price sits on none of them. */
function steps(guard) {
  guard = makeGuard(guard);
  const REC = 'certs/pu-ledger.json', HOL = 'corpus/pu/holidays.json';
  const D = require(path.join(ROOT, 'instruments', 'pu', 'decide.js'));
  const L = JSON.parse(read(REC)), cal = D.calendar(JSON.parse(read(HOL)));
  const r = L.offRows.find((x) => x.kind === 'LTN');
  const STOP = 'the row stops being the first LTN row of the ledger\'s OFF list, a tread stops being the price the rule prints across its rates, or the printed price comes to sit on a tread under either registered settlement or either printed reading';
  const HYP = [{ key: r.primary, settle: r.settle, pu6: r.pu6 }].concat(Object.entries(r.others).map(([key, o]) => ({ key, settle: o.settle, pu6: o.pu6 })));
  guard(STOP, r && HYP.length === 2 && HYP.every((h) => /^D\d$/.test(h.key)) && r.taxa.split(',')[1].length === 2, JSON.stringify(r && r.others));
  const [pn] = D.ratePercentToRational(r.taxa), HALF = 5000n, J = Number(2n * HALF);
  const pct = (x) => { const a = x.toString().padStart(7, '0'); return a.slice(0, -6) + ',' + a.slice(-6); };
  const rateAt = (j) => pn - HALF + BigInt(j);
  const printed = BigInt(r.printed.replace('.', ''));
  /* the treads: every rate of the box on the rule's own grid (the percent truncated at 6 decimals), cut where the
     two-decimal print changes; the price falls as the rate rises, so each cut is found by bisection */
  for (const h of HYP) {
    const val = (j) => { const d = D.decideLTN(pct(rateAt(j)), h.settle, r.maturity, cal); guard(STOP, d.decided, 'straddle at ' + j); return d.pu6; };
    const at = D.decideLTN(r.taxa, h.settle, r.maturity, cal);
    guard(STOP, at.decided && D.dec(at.pu6, 6) === h.pu6 && (h.key !== r.primary || at.du === r.du), h.key + ' ' + D.dec(at.pu6, 6));
    h.treads = [];
    for (let j = 0; j <= J;) {
      const v = D.trunc2(val(j));
      let lo = j, hi = J;
      if (D.trunc2(val(J)) === v) lo = J;
      else while (hi - lo > 1) { const m = (lo + hi) >> 1; if (D.trunc2(val(m)) === v) lo = m; else hi = m; }
      h.treads.push({ j0: j, j1: lo, c: v });
      j = lo + 1;
    }
    h.top = D.round2(val(0));
    h.atPrinted = D.trunc2(at.pu6);
  }
  guard(STOP, HYP.every((h) => printed > h.top && h.treads.every((u) => u.c !== printed)) && String(printed - HYP[0].atPrinted) === r.diffCents, 'diff ' + (printed - HYP[0].atPrinted));
  const cents = (c) => (Number(c) / 100).toFixed(2), x0 = Number(pn - HALF) / 1e6, x1 = Number(pn + HALF) / 1e6, xr = Number(pn) / 1e6;
  const ys = HYP.flatMap((h) => h.treads.map((u) => Number(u.c) / 100)).concat([Number(printed) / 100]);
  const O = { w: PW, h: PH, padL: 58, padR: 14, padT: TOP, padB: 58, x0: x0 - 0.0004, x1: x1 + 0.0004, y0: Math.floor(Math.min(...ys) * 10 - 1) / 10, y1: Math.ceil(Math.max(...ys) * 10 + 0.5) / 10 };
  const yt = []; for (let v = Math.ceil(O.y0 * 10) / 10; v <= O.y1 + 1e-9; v += 0.2) yt.push(+v.toFixed(1));
  const ax = (f) => CH.axes(f, { yTicks: yt.map((v) => ({ v, t: v.toFixed(2) })), xTicks: [x0, xr, x1].map((v) => ({ v, t: v.toFixed(3) + (v === x1 ? '%' : '') })) });
  const xj = (f, j) => f.px(Number(rateAt(j)) / 1e6);
  const ID = [G.IDENTITY[0], G.IDENTITY[1]];
  const [dd, mm, yy] = [r.date.slice(8, 10), r.date.slice(5, 7), r.date.slice(0, 4)];
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const usual = (() => {
    const f = CH.frame(O), out = [ax(f), eyebrow(8, 14, 'as usually drawn')];
    /* the default call: the printed price at the quoted grid of rates (every 0.001%), joined */
    HYP.forEach((h) => {
      const pts = [];
      for (let j = 0; j <= J; j += 1000) { const u = h.treads.find((q) => j >= q.j0 && j <= q.j1); pts.push([xj(f, j), f.py(Number(u.c) / 100)]); }
      out.push(poly(pts, PLAIN));
    });
    out.push(plainDot(f.px(xr), f.py(Number(printed) / 100)));
    out.push(head(f, 'price, R$, against the rate', 't-ax'));
    return svg(PW, PH, 'As usually drawn: the bond\'s price at two decimals against the rate, sampled every 0.001% and joined into two sloping lines, one per settlement date, all in one ink, and the price the file printed as a dot above them; nothing shows which prices the rule can print or what the dot\'s distance means.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), out = [ax(f), eyebrow(8, 14, 'in warrant')];
    HYP.forEach((h, k) => {
      const d = h.treads.map((u, i) => 'M' + f1(xj(f, u.j0)) + ',' + f1(f.py(Number(u.c) / 100)) + 'H' + f1(xj(f, i + 1 < h.treads.length ? u.j1 + 1 : u.j1))).join('');
      out.push('    <path d="' + d + '" ' + W.attrs(W.DECIDED, { width: ID[k].weight }) + ' stroke-opacity="' + ID[k].opacity + '"/>');
      const last = h.treads[h.treads.length - 1];
      out.push(mood(f.L + f.pw, f.py(Number(last.c) / 100) + 16, 'given settlement ' + h.key.replace('D', 'D+'), 'end'));
    });
    const P0 = f.py(Number(HYP[0].atPrinted) / 100), P1 = f.py(Number(printed) / 100), X = f.px(xr);
    out.push(line(X, P0, X, P1 + 4, W.attrs(W.DECIDED, { width: 1.4 })));
    out.push(rect(X - 4, P1 - 4, 8, 8, 'class="w-decided" fill="var(--ink)" stroke="var(--ink)" stroke-width="1"'));
    out.push(t(X + 9, P1 + 4, 'printed ' + cents(printed), 't-lab'), t(X + 9, P1 + 19, 'on no tread: OFF', 't-note'));
    out.push(t(X + 9, Math.max(P1 + 36, (P0 + P1) / 2 + 4), r.diffCents + ' centavos', 't-note'));
    /* the box of rates the printed 9,41 stands for: the decision ranges over all of it */
    const by = f.T + f.ph + 34;
    out.push('    <path d="M' + f1(f.px(x0)) + ',' + f1(by - 5) + 'V' + f1(by) + 'H' + f1(f.px(x1)) + 'V' + f1(by - 5) + '" class="w-decided" fill="none" stroke="var(--ink-2)" stroke-width="1.2"/>');
    out.push(t(f.px(xr), by + 15, 'every rate the printed ' + r.taxa + '% allows', 't-note', 'middle'));
    const who = 'LTN ' + r.maturity.slice(0, 4) + ', ' + (+dd) + ' ' + MON[+mm - 1].slice(0, 3) + ' ' + yy;
    out.push(chosen(f.L, f.T - 12, who), t(f.L + after(who), f.T - 12, '· price, R$, by rate', 't-note'));
    return svg(PW, PH, 'In WARRANT: the same frame. For each of the two registered settlement dates, named in italic, the prices the rule prints at two decimals across every rate the printed ' + r.taxa + '% allows, drawn as flat treads, decided, with no slope between them; the printed price, '
      + cents(printed) + ', a solid square above them, on no tread, and a solid line marking its ' + r.diffCents + ' centavos above the primary settlement\'s price at the printed rate; a solid bracket under the axis for the box of rates the decision covers. The bond and date are underlined dotted: one row of the ledger, chosen.', out);
  })();
  return {
    id: 'price-steps', title: 'A price under a rule table', form: 'a step function', kind: 'record', record: [REC, HOL], stop: STOP, usual, warrant, link: 'instruments/pu/',
    hides: 'The usual chart joins the prices into a sloping line and shows the printed one a little off it, which reads as rounding. The rule truncates, so the price moves in treads, and the printed rate stands for a whole box of rates. Here the treads are drawn flat, the box is marked, and the printed price sits on none of them: the gap is a decided fact, not noise.',
    rule: 'Draw a value a rule truncates or rounds as the flat treads it can take, never as a slope between them, mark the box of inputs a printed figure stands for, and say in words whether the printed output sits on a tread.',
    caption: 'A Tesouro Prefixado (LTN) maturing ' + (+r.maturity.slice(8, 10)) + ' ' + MON[+r.maturity.slice(5, 7) - 1] + ' ' + r.maturity.slice(0, 4) + ', as the Treasury\'s file printed it for ' + (+dd) + ' ' + MON[+mm - 1] + ' ' + yy + ': buy rate ' + esc(r.taxa) + '%, price R$ ' + cents(printed)
      + '; the first LTN row of PU Verificado\'s OFF list. The rule table (STN, Tabela 3) gives PU = 1000 / (1 + rate)^(du/252), the rate truncated at 6 decimals, the exponent at 14 and the price at 6, printed at 2; the one irrational step is an enclosure, so every tread is decided. The printed rate stands for any rate from '
      + pct(pn - HALF).replace(/0+$/, '').replace(',', '.') + ' to ' + pct(pn + HALF).replace(/0+$/, '').replace(',', '.') + '%; under both registered settlements and both printed readings (truncated or rounded), the file\'s price is on no tread.',
  };
}

module.exports = {
  topic: { id: 'routes-time', title: 'Routes and time',
    lead: 'Data that moves: a flight along its route, a week of six-hour windows, a forecast and the sea that came after it, a star dimming as a planet crosses it, a price stepping as its rate moves. Each is read from an instrument\'s own record, and each is drawn so the stretch nobody saw, the hours nobody can decide and the claim nobody has checked yet look like what they are.' },
  scenes: [route, board, timeline, graded, lightCurve, steps],
};
