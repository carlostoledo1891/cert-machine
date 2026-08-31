#!/usr/bin/env node
/* build-report-glide-band.js — generate reports/glide-band.html.

   The engine-out glide ring, drawn honestly: an inner boundary every landing
   site inside which is provably reachable over the whole uncertainty
   envelope, an outer boundary beyond which no site is reachable for any
   value in it, and the annulus between where nothing is decided.

   WORDING DISCIPLINE (aviation). "Certified" here ALWAYS means a
   mathematically certified enclosure. It carries NO airworthiness meaning.
   The page repeats this where a reader could trip, and says NOT FOR
   NAVIGATION on the artifact itself.

   Every number is computed during this build from the pinned records — the
   adsb.lol flight (via apps/skyaudit's day pin) and the OurAirports extract —
   with the app's battery as this page's gate. Nothing is typed in.

   usage: node tools/build-report-glide-band.js                              */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'apps', 'glide-band');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const K = require(path.join(APP, 'kernel.js'));
const { FT, KT } = K;

const die = (m) => { console.error('GLIDE-BAND REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the app's battery ------------------------------------------- */
const bat = cp.spawnSync(process.execPath, [path.join(APP, 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /battery green: (\d+)\/(\d+) checks \((\d+) red controls fired\)/.exec(bout);
if (bat.status !== 0 || !bm || bm[1] !== bm[2]) die('the glide-band battery did not pass:\n' + bout.slice(-800));
const nChecks = Number(bm[1]), nReds = Number(bm[3]);
if (nReds < 4) die('expected at least 4 red controls to fire, saw ' + nReds);

/* ---- gate 2: the data pins still hold ------------------------------------ */
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const PINS = J(path.join(APP, 'data', 'PINS.json'));
for (const [name, rec] of Object.entries(PINS.derived)) {
  const got = sha(path.join(APP, 'data', name));
  if (got !== rec.sha256) die('pin broken for ' + name + ': ' + got + ' != ' + rec.sha256);
}
const FLIGHT = J(path.join(APP, 'data', 'flight.json'));
const AP = J(path.join(APP, 'data', 'airports.json'));

/* ---- the illustrative scenarios (H4) --------------------------------------
   Each pack is a CLASS of aeroplane in a stated configuration, with the
   envelope that class plausibly spans and the glide ratio the panel would be
   CONFIGURED with. No manufacturer figure is asserted anywhere. The fourth
   pack is the one that matters: the aircraft and the flight are identical to
   the third, and the only difference is that the propeller did not feather —
   which the glass has no way of knowing, so it keeps drawing the ring it was
   configured with.                                                          */
const PACKS = [
  { key: 'trainer', label: 'Trainer', sub: 'fixed-pitch, prop windmilling',
    LD: [6.8, 8.2], Va: [60, 72], panelLD: 7.5,
    note: 'a light fixed-pitch single; the published glide figure for this class is already a windmilling one, so the panel sits inside the envelope' },
  { key: 'hp', label: 'High-performance single', sub: 'prop windmilling',
    LD: [8.0, 9.6], Va: [78, 92], panelLD: 8.8,
    note: 'a faster piston single, still windmilling, panel inside the envelope' },
  { key: 'tp-feather', label: 'Turboprop', sub: 'propeller FEATHERED',
    LD: [10.2, 12.6], Va: [92, 108], panelLD: 12.0,
    note: 'the single-engine turboprop actually flying this trace, with the propeller feathered as the drill intends' },
  { key: 'tp-windmill', label: 'Turboprop', sub: 'propeller did NOT feather',
    LD: [6.5, 8.5], Va: [92, 108], panelLD: 12.0,
    note: 'the SAME aircraft on the SAME flight, one action short. The panel is still configured with the feathered ratio because nothing tells it otherwise' },
  { key: 'glider', label: 'Glider', sub: 'clean', LD: [30, 40], Va: [50, 62], panelLD: 35,
    note: 'the contrast case: an enormous reach, and an enormous annulus with it' }
];
const ALT_PAD_FT = 250;                        /* altimetry + pressure setting */
const WIND_REL = 0.25, WIND_DIR_PAD = 15;      /* forecast error on speed and direction */
const WINDS = [
  { name: 'still air', kt: 0, from: 270 },
  { name: '35 kt', kt: 35, from: 270 },
  { name: '60 kt', kt: 60, from: 270 }
];
const MODES = [
  { key: 'right', label: 'forecast is right' },
  { key: 'reversed', label: 'forecast 180\u00b0 out' }
];
const envFor = (w, mi, pk) => {
  const trueFrom = w.from + (mi === 1 ? 180 : 0);
  return {
    LD: pk.LD,
    Va: [pk.Va[0] * KT, pk.Va[1] * KT],
    Ws: [Math.max(0, w.kt * (1 - WIND_REL)) * KT, (w.kt * (1 + WIND_REL) + 4) * KT],
    Wdir: w.kt === 0 ? [0, 360] : [trueFrom - WIND_DIR_PAD, trueFrom + WIND_DIR_PAD]
  };
};
const nomFor = (w, pk) => ({ LD: pk.panelLD, Va: (pk.Va[0] + pk.Va[1]) / 2 * KT, Ws: w.kt * KT, Wdir: w.from });

/* ---- the track window: the cruise, where a glide ring is a live decision -- */
const hiPts = FLIGHT.track.filter((p) => p.alt >= 17000);
if (hiPts.length < 40) die('too few cruise points in the pinned trace: ' + hiPts.length);
const NPT = 16;
const TRACK = [];
for (let i = 0; i < NPT; i++) TRACK.push(hiPts[Math.round(i * (hiPts.length - 1) / (NPT - 1))]);

/* ---- the airfields in play ----------------------------------------------- */
const REACH_CAP_M = 150000;
const withDist = AP.airports.map((a) => ({
  a, d: Math.min.apply(null, TRACK.map((p) => K.greatCircle(p.lat, p.lon, a.lat, a.lon).dist[0]))
})).filter((x) => x.d < REACH_CAP_M).sort((x, y) => x.d - y.d).slice(0, 320);
const relevant = withDist.map((x) => x.a).sort((a, b) => a.ident.localeCompare(b.ident));
if (relevant.length < 20) die('only ' + relevant.length + ' airfields in play — the corridor extract is wrong');

/* ---- the sweep ----------------------------------------------------------- */
const NB = 48;                                  /* bearings, 7.5 degrees */
const V = { REACHABLE: 'G', UNDECIDED: 'A', UNREACHABLE: 'R' };
const scen = [];
const key = (t, w, m, pk) => t + ':' + w + ':' + m + ':' + pk;
const byKey = new Map();

for (let ti = 0; ti < TRACK.length; ti++) {
  const p = TRACK[ti];
  for (let wi = 0; wi < WINDS.length; wi++) {
   for (let mi = 0; mi < MODES.length; mi++) {
    for (let pi = 0; pi < PACKS.length; pi++) {
     const pk = PACKS[pi];
     const env = envFor(WINDS[wi], mi, pk), nom = nomFor(WINDS[wi], pk);
     const state = {
       lat: p.lat, lon: p.lon, track: p.trk,
       alt_m: [(p.alt - ALT_PAD_FT) * FT, (p.alt + ALT_PAD_FT) * FT],
       alt_nom_m: p.alt * FT
     };
     const refElev = 400 * FT;
     const h = [state.alt_m[0] - refElev, state.alt_m[1] - refElev];
     const rlo = [], rhi = [], rnom = [];
     for (let b = 0; b < NB; b++) {
       const bg = b * 360 / NB;
       const tT = K.turnSeconds(state.track, bg);
       const bd = K.band(bg, h, env, tT);
       rlo.push(+(bd.lo / 1000).toFixed(2));
       rhi.push(+(bd.hi / 1000).toFixed(2));
       rnom.push(+(K.nominal(bg, state.alt_nom_m - refElev, nom, tT) / 1000).toFixed(2));
     }
     let vs = '', shown = '', nG = 0, nA = 0, nR = 0, nShown = 0, nFalse = 0, nDamning = 0;
     const rows = [];
     for (let ai = 0; ai < relevant.length; ai++) {
       const a = relevant[ai];
       const r = K.decide(state, a, env, nom);
       vs += V[r.verdict];
       shown += r.shown ? 'Y' : 'n';
       if (r.verdict === K.REACHABLE) nG++; else if (r.verdict === K.UNDECIDED) nA++; else nR++;
       if (r.shown) {
         nShown++;
         if (r.verdict !== K.REACHABLE) {
           nFalse++;
           if (r.verdict === K.UNREACHABLE) nDamning++;
           rows.push({ ai, r, gap: r.nom - r.lo });
         }
       }
     }
     rows.sort((x, y) => (y.r.verdict === K.UNREACHABLE ? 1e9 : 0) + y.gap
                       - ((x.r.verdict === K.UNREACHABLE ? 1e9 : 0) + x.gap));
     const top = rows.slice(0, 10).map(({ ai, r }) => {
       const need = K.requiredLD(state, relevant[ai], env);
       return [ai, +(r.D[0] / 1000).toFixed(1), +(r.lo / 1000).toFixed(1), +(r.hi / 1000).toFixed(1),
         +(r.nom / 1000).toFixed(1), r.verdict === K.UNREACHABLE ? 1 : 0,
         need === null ? 0 : +need.toFixed(1), Math.round(r.tTurn)];
     });
     const rec = { t: ti, w: wi, m: mi, p: pi, lat: p.lat, lon: p.lon, alt: p.alt, trk: p.trk,
                   rlo, rhi, rnom, vs, shown, c: [nG, nA, nR, nShown, nFalse, nDamning], top };
     scen.push(rec);
     byKey.set(key(ti, wi, mi, pi), rec);
    }
   }
  }
}

/* ---- gates on the claims the page makes ---------------------------------- */
/* (a) whenever the panel's configured ratio lies INSIDE the pack's envelope,
       its line falls between the boundaries and nothing inside it can be
       refuted. Packs 0,1,2,4 are of that kind, with the forecast right. */
const insidePacks = PACKS.map((pk, i) => i).filter((i) =>
  PACKS[i].panelLD >= PACKS[i].LD[0] && PACKS[i].panelLD <= PACKS[i].LD[1]);
const structuralViolations = scen.filter((s) => s.m === 0 && insidePacks.includes(s.p))
  .reduce((a, s) => a + s.c[5], 0);
if (structuralViolations !== 0) die(structuralViolations + ' refutations appeared inside a nominal ring whose '
  + 'configured ratio lies inside the envelope — the page\'s central claim says this is impossible');
/* (b) the two failure scenarios must actually bite, or there is nothing to report */
const aggOf = (pi, wi, mi) => {
  const ss = scen.filter((s) => s.p === pi && s.w === wi && s.m === mi);
  const shown = ss.reduce((a, s) => a + s.c[3], 0);
  const bad = ss.reduce((a, s) => a + s.c[4], 0);
  const dam = ss.reduce((a, s) => a + s.c[5], 0);
  return { ss, shown, bad, dam, pct: 100 * bad / Math.max(1, shown), pctDam: 100 * dam / Math.max(1, shown) };
};
const PI_FEATHER = 2, PI_WINDMILL = 3, WI_MID = 1;
const BASE = aggOf(PI_FEATHER, WI_MID, 0);
const NOFEATHER = aggOf(PI_WINDMILL, WI_MID, 0);
const REVERSED = aggOf(PI_FEATHER, WI_MID, 1);
if (NOFEATHER.dam === 0) die('the unfeathered-propeller scenario produced no refutation — nothing to report');
if (REVERSED.dam === 0) die('the reversed-forecast scenario produced no refutation — nothing to report');

const HERO = byKey.get(key(Math.floor(NPT / 2), WI_MID, 0, PI_FEATHER));
const modScen = BASE.ss;
const totShown = BASE.shown, totFalse = BASE.bad, pctFalse = BASE.pct;

/* the single worst row anywhere: shown by the line, proved out */
/* the worst row IN THE SCENARIO THE PARAGRAPH IS ABOUT — the unfeathered
   propeller, forecast right. Scanning every scenario instead quotes a
   reversed-forecast row under a heading about the propeller: the kind of small
   mismatch nobody catches on the page and everybody catches in the room. */
let worst = null;
for (const s of scen.filter((x) => x.p === PI_WINDMILL && x.m === 0)) for (const r of s.top) {
  if (r[5] === 1 && (!worst || (r[1] - r[3]) > (worst.row[1] - worst.row[3]))) worst = { row: r, s };
}

const bytes = JSON.stringify(scen).length;

/* ======================================================================
   THE FIGURES. Every mark below reaches for a design token by name and
   never for a literal colour — a literal is invisible in one of the two
   themes, and that rule is why design/tokens.js exists. The verdict roles
   are fixed once here and used identically by the static figures and by
   the interactive map, so the page reads as one system:

     proved reachable  --c-2   undecided  --c-3   refuted  --c-1
     the panel's line  --ink-2, dashed          context  --ink-3
   ====================================================================== */
const V_G = 'var(--c-2)', V_A = 'var(--c-3)', V_R = 'var(--c-1)';
const V_LINE = 'var(--ink-2)', V_CTX = 'var(--ink-3)';

const pct = (x) => x.toFixed(0) + '%';
const AP_OF = (i) => relevant[i];

/* a closed polar path from an array of radii, in a local px scale */
function ringPath(rs, cx, cy, sc) {
  let d = '';
  for (let b = 0; b < rs.length; b++) {
    const th = b * 2 * Math.PI / rs.length;
    d += (b ? 'L' : 'M') + (cx + Math.sin(th) * rs[b] * sc).toFixed(1) + ' '
       + (cy - Math.cos(th) * rs[b] * sc).toFixed(1);
  }
  return d + 'Z';
}
const HATCH = (id) => '<pattern id="' + id + '" width="7" height="7" patternUnits="userSpaceOnUse" '
  + 'patternTransform="rotate(45)"><rect width="7" height="7" fill="var(--warn-soft)"/>'
  + '<line x1="0" y1="0" x2="0" y2="7" stroke="' + V_A + '" stroke-width="1.3" opacity=".6"/></pattern>';

/* ---------- FIGURE 1 · the idea, on real numbers -------------------------- */
function figIdea() {
  const s = HERO;
  let maxR = 0;
  for (const r of s.rhi) if (r > maxR) maxR = r;
  for (const r of s.rnom) if (r > maxR) maxR = r;
  const W = 900, H = 430, cx = 250, cy = H / 2, sc = (H * 0.42) / maxR;
  const o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="One line versus three zones">'];
  o.push('<defs>' + HATCH('h1') + '</defs>');
  o.push('<path d="' + ringPath(s.rhi, cx, cy, sc) + ' ' + ringPath(s.rlo, cx, cy, sc)
    + '" fill-rule="evenodd" fill="url(#h1)"/>');
  o.push('<path d="' + ringPath(s.rlo, cx, cy, sc) + '" fill="var(--held-soft)" stroke="' + V_G + '" stroke-width="2.4"/>');
  o.push('<path d="' + ringPath(s.rhi, cx, cy, sc) + '" fill="none" stroke="' + V_R + '" stroke-width="2.4"/>');
  o.push('<path d="' + ringPath(s.rnom, cx, cy, sc) + '" fill="none" stroke="' + V_LINE
    + '" stroke-width="2.6" stroke-dasharray="9 6"/>');
  o.push('<circle cx="' + cx + '" cy="' + cy + '" r="5.5" fill="var(--ink)"/>');

  /* label column on the right; each block connects to its ring at its own
     angle, so no leader ever crosses a boundary it does not belong to */
  const CX = 520;
  const at = (rs, ang) => {
    const k = Math.round(((ang % 360) / 360) * rs.length) % rs.length;
    return [cx + Math.sin(ang * Math.PI / 180) * rs[k] * sc, cy - Math.cos(ang * Math.PI / 180) * rs[k] * sc];
  };
  const blocks = [
    { y: 92, t: 'YOU WILL REACH THESE', sub: 'true for every value in the envelope', col: V_G,
      pt: at(s.rlo, 38), sw: 'fill="var(--held-soft)" stroke="' + V_G + '" stroke-width="2"' },
    { y: 176, t: 'NOBODY CAN SAY', sub: 'the evidence does not settle it', col: V_A,
      pt: at(s.rlo.map((v, k) => (v + s.rhi[k]) / 2), 25), sw: 'fill="url(#h1)" stroke="' + V_A + '" stroke-width="1.6"' },
    { y: 260, t: 'YOU WILL NOT', sub: 'true for no value in the envelope', col: V_R,
      pt: at(s.rhi, 14), sw: 'fill="none" stroke="' + V_R + '" stroke-width="2"' },
    { y: 352, t: 'THE LINE YOUR PANEL DRAWS', sub: 'one value per input, and it runs', sub2: 'through the middle zone',
      col: V_LINE, pt: at(s.rnom, 155), line: true }
  ];
  for (const b of blocks) {
    o.push('<path d="M' + b.pt[0].toFixed(1) + ' ' + b.pt[1].toFixed(1) + ' L' + (CX - 26) + ' ' + b.y
      + ' L' + (CX - 12) + ' ' + b.y + '" fill="none" stroke="var(--rule)" stroke-width="1.2"/>');
    if (b.line) {
      o.push('<line x1="' + (CX - 8) + '" y1="' + (b.y - 5) + '" x2="' + (CX + 12) + '" y2="' + (b.y - 5)
        + '" stroke="' + V_LINE + '" stroke-width="2.6" stroke-dasharray="7 5"/>');
    } else {
      o.push('<rect x="' + (CX - 8) + '" y="' + (b.y - 13) + '" width="16" height="16" ' + b.sw + '/>');
    }
    o.push('<text x="' + (CX + 22) + '" y="' + (b.y - 1) + '" font-size="15.5" font-weight="600" fill="'
      + b.col + '">' + b.t + '</text>');
    o.push('<text x="' + (CX + 22) + '" y="' + (b.y + 18) + '" font-size="13.5" fill="var(--ink-2)">' + b.sub + '</text>');
    if (b.sub2) o.push('<text x="' + (CX + 22) + '" y="' + (b.y + 35) + '" font-size="13.5" fill="var(--ink-2)">'
      + b.sub2 + '</text>');
  }
  o.push('</svg>');
  return o.join('\n');
}

/* ---------- FIGURE 2 · the route ------------------------------------------ */
function figRoute() {
  const pts = FLIGHT.track.filter((p) => p.alt >= 3000);
  const las = pts.map((p) => p.lat), los = pts.map((p) => p.lon);
  const la0 = Math.min.apply(null, las), la1 = Math.max.apply(null, las);
  const lo0 = Math.min.apply(null, los), lo1 = Math.max.apply(null, los);
  const W = 900, H = 440, M = 40;
  const kx = 111.32 * Math.cos((la0 + la1) / 2 * Math.PI / 180), ky = 110.57;
  const spanX = (lo1 - lo0) * kx, spanY = (la1 - la0) * ky;
  const sc = Math.min((W - 2 * M - 300) / spanX, (H - 2 * M - 26) / spanY);
  const ox = M + ((W - 2 * M - 300) - spanX * sc) / 2, oy = M + ((H - 2 * M - 26) - spanY * sc) / 2;
  const X = (lo) => ox + (lo - lo0) * kx * sc, Y = (la) => oy + (la1 - la) * ky * sc;
  const o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="The pinned flight track">'];
  for (const a of relevant) {
    if (a.lon < lo0 || a.lon > lo1 || a.lat < la0 || a.lat > la1) continue;
    o.push('<circle cx="' + X(a.lon).toFixed(1) + '" cy="' + Y(a.lat).toFixed(1) + '" r="1.7" fill="var(--mark)"/>');
  }
  o.push('<path d="' + pts.map((p, i) => (i ? 'L' : 'M') + X(p.lon).toFixed(1) + ' ' + Y(p.lat).toFixed(1)).join('')
    + '" fill="none" stroke="' + V_CTX + '" stroke-width="1.6"/>');
  const cruise = TRACK;
  o.push('<path d="' + cruise.map((p, i) => (i ? 'L' : 'M') + X(p.lon).toFixed(1) + ' ' + Y(p.lat).toFixed(1)).join('')
    + '" fill="none" stroke="var(--sig)" stroke-width="4.5" stroke-linecap="round"/>');
  const p0 = cruise[0], p1 = cruise[cruise.length - 1];
  o.push('<circle cx="' + X(p0.lon).toFixed(1) + '" cy="' + Y(p0.lat).toFixed(1) + '" r="4.5" fill="var(--sig)"/>');
  o.push('<circle cx="' + X(p1.lon).toFixed(1) + '" cy="' + Y(p1.lat).toFixed(1) + '" r="4.5" fill="var(--sig)"/>');

  /* the caption column, so nothing is written over the map */
  const LX = W - 322, altMax = Math.max.apply(null, cruise.map((c) => c.alt));
  const rows = [
    ['var(--sig)', C.esc(FLIGHT.reg) + ' \u00b7 ' + C.esc(FLIGHT.type),
      'the cruise decided here, ' + Math.round(cruise[0].alt).toLocaleString() + '\u2013'
      + Math.round(altMax).toLocaleString() + ' ft'],
    [V_CTX, 'the rest of the trace', 'climb and descent, not decided here'],
    ['var(--mark)', relevant.length + ' airfields', 'each decided at all ' + scen.length + ' states']
  ];
  /* wrap the sub-lines so nothing runs off the viewBox edge */
  const AVAIL = W - (LX + 24) - 10, CHW = 7.45;
  const wrap = (t) => {
    const words = t.split(' '), out = []; let line = '';
    for (const w of words) {
      if (line && (line.length + 1 + w.length) * CHW > AVAIL) { out.push(line); line = w; }
      else line = line ? line + ' ' + w : w;
    }
    if (line) out.push(line);
    return out;
  };
  rows.forEach((r, i) => {
    const y = 120 + i * 74;
    o.push('<rect x="' + LX + '" y="' + (y - 11) + '" width="14" height="4" fill="' + r[0] + '"/>');
    o.push('<text x="' + (LX + 24) + '" y="' + (y - 3) + '" font-size="14.5" font-weight="600" fill="var(--ink)">'
      + r[1] + '</text>');
    wrap(r[2]).forEach((ln, k) => o.push('<text x="' + (LX + 24) + '" y="' + (y + 16 + k * 17)
      + '" font-size="13" fill="var(--ink-2)">' + ln + '</text>'));
  });
  o.push('<text x="' + LX + '" y="' + (H - 24) + '" font-size="12.5" fill="var(--ink-3)">'
    + C.esc(FLIGHT.desc || FLIGHT.type) + ' \u00b7 ' + FLIGHT.day + '</text>');
  o.push('</svg>');
  return o.join('\n');
}

/* ---------- FIGURE 3 · the five scenarios, one scale ---------------------- */
function figPacks() {
  const ti = HERO.t;
  /* the glider is excluded from THIS figure on purpose: its reach is about
     four times the others, so putting it on the shared scale collapses the
     four powered cells to dots and the comparison the figure exists for is
     lost. It stays in the composition chart, where the axis is a proportion
     and the scale problem does not arise. */
  const idxs = PACKS.map((pk, i) => i).filter((i) => PACKS[i].key !== 'glider');
  const cells = idxs.map((pi) => byKey.get(key(ti, WI_MID, 0, pi)));
  let maxR = 0;
  for (const s of cells) { for (const r of s.rhi) if (r > maxR) maxR = r;
                           for (const r of s.rnom) if (r > maxR) maxR = r; }
  const CW = 222, CH = 214, W = 900, H = CH + 46;
  const sc = (CW * 0.40) / maxR;
  const o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Four powered scenarios at one scale">'];
  o.push('<defs>' + HATCH('h3') + '</defs>');
  cells.forEach((s, i) => {
    const pk = PACKS[idxs[i]];
    const cx = 111 + i * CW, cy = 106;
    o.push('<path d="' + ringPath(s.rhi, cx, cy, sc) + ' ' + ringPath(s.rlo, cx, cy, sc)
      + '" fill-rule="evenodd" fill="url(#h3)"/>');
    o.push('<path d="' + ringPath(s.rlo, cx, cy, sc) + '" fill="var(--held-soft)" stroke="' + V_G + '" stroke-width="1.8"/>');
    o.push('<path d="' + ringPath(s.rhi, cx, cy, sc) + '" fill="none" stroke="' + V_R + '" stroke-width="1.8"/>');
    o.push('<path d="' + ringPath(s.rnom, cx, cy, sc) + '" fill="none" stroke="' + V_LINE
      + '" stroke-width="2" stroke-dasharray="7 5"/>');
    o.push('<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="var(--ink)"/>');
    const outside = pk.panelLD > pk.LD[1];
    o.push('<text x="' + cx + '" y="' + (CH - 8) + '" text-anchor="middle" font-size="13.5" font-weight="600" fill="'
      + (outside ? V_R : 'var(--ink)') + '">' + C.esc(pk.label) + '</text>');
    o.push('<text x="' + cx + '" y="' + (CH + 9) + '" text-anchor="middle" font-size="12" fill="var(--ink-2)">'
      + C.esc(pk.sub.length > 30 ? pk.sub.replace('fixed-pitch, ', '') : pk.sub) + '</text>');
    o.push('<text x="' + cx + '" y="' + (CH + 28) + '" text-anchor="middle" font-size="12" font-weight="'
      + (s.c[5] ? '600' : '400') + '" fill="' + (s.c[5] ? V_R : V_CTX) + '">' + s.c[5] + ' refuted</text>');
  });
  o.push('</svg>');
  return o.join('\n');
}

/* ---------- FIGURE 4 · what the line claims, and what survives ------------ */
function figComposition(rows) {
  const W = 900, L = 268, R = 96, rowH = 46, H = rows.length * rowH + 62;
  const bw = W - L - R;
  const o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Verdict composition per scenario">'];
  rows.forEach((r, i) => {
    const y = 28 + i * rowH;
    const tot = Math.max(1, r.shown);
    const wG = bw * (r.shown - r.bad) / tot, wA = bw * (r.bad - r.dam) / tot, wR = bw * r.dam / tot;
    o.push('<text x="' + (L - 12) + '" y="' + (y + 13) + '" text-anchor="end" font-size="13" font-weight="'
      + (r.emph ? '600' : '400') + '" fill="var(--ink)">' + C.esc(r.label) + '</text>');
    if (r.sub) o.push('<text x="' + (L - 12) + '" y="' + (y + 29) + '" text-anchor="end" font-size="11.5" fill="var(--ink-3)">'
      + C.esc(r.sub) + '</text>');
    o.push('<rect x="' + L + '" y="' + y + '" width="' + wG.toFixed(1) + '" height="22" fill="' + V_G + '"/>');
    o.push('<rect x="' + (L + wG).toFixed(1) + '" y="' + y + '" width="' + wA.toFixed(1) + '" height="22" fill="' + V_A + '" opacity=".55"/>');
    o.push('<rect x="' + (L + wG + wA).toFixed(1) + '" y="' + y + '" width="' + wR.toFixed(1) + '" height="22" fill="' + V_R + '"/>');
    if (wG > 34) o.push('<text x="' + (L + 8) + '" y="' + (y + 16) + '" font-size="12" fill="var(--surface)">'
      + pct(100 * (r.shown - r.bad) / tot) + '</text>');
    if (wR > 34) o.push('<text x="' + (L + bw - 8) + '" y="' + (y + 16) + '" text-anchor="end" font-size="12" fill="var(--surface)">'
      + pct(100 * r.dam / tot) + '</text>');
    o.push('<text x="' + (W - R + 12) + '" y="' + (y + 16) + '" font-size="12.5" fill="var(--ink-2)">'
      + r.shown.toLocaleString() + '</text>');
  });
  const y0 = H - 20;
  const sw = (x, c, t, op) => '<rect x="' + x + '" y="' + (y0 - 9) + '" width="11" height="11" fill="' + c
    + '"' + (op ? ' opacity="' + op + '"' : '') + '/><text x="' + (x + 17) + '" y="' + y0
    + '" font-size="12.5" fill="var(--ink-2)">' + t + '</text>';
  o.push(sw(L, V_G, 'proved reachable'));
  o.push(sw(L + 152, V_A, 'undecided', '.55'));
  o.push(sw(L + 268, V_R, 'REFUTED \u2014 provably not'));
  o.push('<text x="' + (W - R + 12) + '" y="' + y0 + '" font-size="11.5" fill="var(--ink-3)">claims</text>');
  o.push('</svg>');
  return o.join('\n');
}

const COMP_ROWS = PACKS.map((pk, pi) => {
  const a = aggOf(pi, WI_MID, 0);
  return { label: pk.label, sub: pk.sub, shown: a.shown, bad: a.bad, dam: a.dam,
           emph: pi === PI_WINDMILL };
}).concat([{ label: 'Turboprop', sub: 'feathered, forecast 180\u00b0 out',
             shown: REVERSED.shown, bad: REVERSED.bad, dam: REVERSED.dam, emph: true }]);

/* ======================================================================== */
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine \u00b7 report \u00b7 every number recomputed at build',
  title: 'The ring shows you one answer. There are three.',
  deck: 'When the engine quits your panel draws a single ring and calls it your reach. The honest picture has '
    + 'three parts: airfields you will reach whatever the assumptions, airfields you will reach under none, and '
    + '\u2014 the largest group \u2014 the ones the evidence does not settle. Today that third group is drawn '
    + 'inside the line, where it looks exactly like the first.'
}));

B.push(C.figure({ svgRaw: figIdea(), caption: 'The same instant, computed both ways \u2014 real numbers from the '
  + 'flight below, not a schematic. The dashed line is a point estimate: one glide ratio, one forecast wind, one '
  + 'weight. The two solid boundaries enclose every value those inputs can take. The line spends most of its '
  + 'length inside the zone where nothing is settled.' }));

B.push(C.stats([
  { k: 'inside the line, not proved', v: pct(pctFalse), role: 'warn',
    n: totFalse + ' of ' + totShown + ' claims \u2014 turboprop, propeller feathered, 35 kt, forecast right' },
  { k: 'inside the line, refutable', v: '0',
    n: 'structural, and gated at build: while the panel\u2019s configured ratio sits inside the envelope, its '
       + 'line cannot be proved wrong about anything' },
  { k: 'if the propeller does not feather', v: pct(NOFEATHER.pctDam),
    n: NOFEATHER.dam + ' of ' + NOFEATHER.shown + ' claims become PROVABLY unreachable \u2014 same aircraft, same '
       + 'flight, one action short, and the glass has no way to know' }
]));

/* ---------------- §1 the flight ------------------------------------------- */
B.push(C.section({
  lab: '\u00a71 \u00b7 the flight', title: 'A real aeroplane, on a real afternoon',
  bodyRaw: '<div class="col">'
    + C.pRaw('Everything here is decided on one pinned ADS-B trace: ' + C.esc(FLIGHT.reg) + ', a '
      + C.esc(FLIGHT.desc || FLIGHT.type) + ' \u2014 a <em>single-engine</em> turboprop, which is why a glide '
      + 'ring is a live instrument and not a curiosity \u2014 cruising at ' + Math.round(HERO.alt).toLocaleString()
      + ' ft on ' + FLIGHT.day + '. Nothing happened on this flight. The question is what the panel would have '
      + 'been telling the crew if something had.')
    + '</div>'
}));
B.push(C.figure({ svgRaw: figRoute(), caption: 'The trace, with the cruise segment this page decides marked in '
  + 'the signature colour. The ' + relevant.length + ' airfields in play are the grey dots. Flight data '
  + '\u00a9 adsb.lol under ODbL, ingested and pinned by apps/skyaudit; airfields from OurAirports, public domain.' }));

/* ---------------- §2 the instrument --------------------------------------- */
const DATA = {
  scen, airports: relevant.map((a) => [a.ident, a.name, a.lat, a.lon, a.elev_ft]),
  winds: WINDS.map((w) => w.name), nb: NB,
  track: FLIGHT.track.filter((p) => p.alt >= 10000).map((p) => [+p.lat.toFixed(4), +p.lon.toFixed(4)])
};
const seg = (id, items, sel) => '<div id="' + id + '" class="gb-seg" role="group">' + items.map((t, i) =>
  '<button type="button" data-v="' + i + '"' + (i === sel ? ' class="on"' : '') + '>' + C.esc(t) + '</button>').join('') + '</div>';

const DASH = `
<div class="gb">
  <div class="gb-bar">
    <label class="gb-ctl"><span>Position along the cruise</span>
      <input id="gb-t" type="range" min="0" max="${TRACK.length - 1}" value="${HERO.t}" step="1">
      <output id="gb-tout"></output></label>
    <div class="gb-ctl"><span>Aircraft &amp; configuration</span>
      ${seg('gb-p', PACKS.map((p) => p.label + ' \u00b7 ' + p.sub), HERO.p)}</div>
    <div class="gb-ctl"><span>Forecast wind</span>${seg('gb-w', WINDS.map((w) => w.name), HERO.w)}</div>
    <div class="gb-ctl"><span>Is the forecast right?</span>${seg('gb-m', MODES.map((m) => m.label), HERO.m)}</div>
  </div>
  <p id="gb-note" class="gb-note"></p>
  <div class="gb-stage">
    <svg id="gb-svg" viewBox="0 0 900 620" role="img" aria-label="Certified glide band on a pinned flight"></svg>
    <div class="gb-nav">NOT FOR NAVIGATION \u00b7 illustrative scenario, not manufacturer data</div>
  </div>
  <div class="gb-key">
    <span><i class="k-g"></i>PROVED REACHABLE <em>if the path is unobstructed (H1)</em></span>
    <span><i class="k-a"></i>UNDECIDED <em>the evidence does not settle it</em></span>
    <span><i class="k-r"></i>REFUTED <em>unreachable for every value in the envelope</em></span>
    <span><i class="k-n"></i><em>the single line a panel draws</em></span>
  </div>
  <p id="gb-counts" class="gb-counts"></p>
  <div class="gb-tw"><table class="gb-table"><thead><tr>
    <th>ident</th><th>airfield</th><th class="n">distance</th><th class="n">proved band</th>
    <th class="n">the line says</th><th>verdict</th><th class="n">turn</th><th class="n">needs L/D \u2265</th>
  </tr></thead><tbody id="gb-rows"></tbody></table></div>
  <p class="gb-cap" id="gb-cap"></p>
</div>
<script>
(function(){
var D=${JSON.stringify(DATA)}, NOTES=${JSON.stringify(PACKS.map((p) => p.note))};
var svg=document.getElementById('gb-svg'), NS='http://www.w3.org/2000/svg';
var ti=${HERO.t}, wi=${HERO.w}, mi=${HERO.m}, pi=${HERO.p};
function S(){ for(var i=0;i<D.scen.length;i++){ var x=D.scen[i];
  if(x.t===ti&&x.w===wi&&x.m===mi&&x.p===pi) return x; } return D.scen[0]; }
function el(n,at){ var e=document.createElementNS(NS,n); for(var k in at) e.setAttribute(k,at[k]); return e; }
function draw(){
  var s=S(), W=900,H=620,cx=W*0.5,cy=H*0.5, i;
  var maxR=0; for(i=0;i<s.rhi.length;i++) if(s.rhi[i]>maxR) maxR=s.rhi[i];
  for(i=0;i<s.rnom.length;i++) if(s.rnom[i]>maxR) maxR=s.rnom[i];
  var span=Math.max(maxR*1.16,20), sc=(H*0.45)/span;
  var kLat=110.574, kLon=111.320*Math.cos(s.lat*Math.PI/180);
  function P(la,lo){ return [cx+(lo-s.lon)*kLon*sc, cy-(la-s.lat)*kLat*sc]; }
  function ring(rs){ var d='',b,th,x,y; for(b=0;b<rs.length;b++){ th=b*2*Math.PI/rs.length;
      x=cx+Math.sin(th)*rs[b]*sc; y=cy-Math.cos(th)*rs[b]*sc; d+=(b?'L':'M')+x.toFixed(1)+' '+y.toFixed(1); }
    return d+'Z'; }
  while(svg.firstChild) svg.removeChild(svg.firstChild);
  var defs=el('defs');
  var pat=el('pattern',{id:'gbH',width:'7',height:'7',patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'});
  pat.appendChild(el('rect',{width:'7',height:'7',fill:'var(--warn-soft)'}));
  pat.appendChild(el('line',{x1:'0',y1:'0',x2:'0',y2:'7',stroke:'var(--c-3)','stroke-width':'1.3',opacity:'.6'}));
  defs.appendChild(pat); svg.appendChild(defs);
  svg.appendChild(el('path',{d:ring(s.rhi)+' '+ring(s.rlo),'fill-rule':'evenodd',fill:'url(#gbH)'}));
  svg.appendChild(el('path',{d:ring(s.rlo),fill:'var(--held-soft)',stroke:'var(--c-2)','stroke-width':'2.2'}));
  svg.appendChild(el('path',{d:ring(s.rhi),fill:'none',stroke:'var(--c-1)','stroke-width':'2.2'}));
  svg.appendChild(el('path',{d:ring(s.rnom),fill:'none',stroke:'var(--ink-2)','stroke-width':'2.6','stroke-dasharray':'9 6'}));
  var td=''; for(i=0;i<D.track.length;i++){ var q=P(D.track[i][0],D.track[i][1]); td+=(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1); }
  svg.appendChild(el('path',{d:td,fill:'none',stroke:'var(--ink-3)','stroke-width':'1.5',opacity:'.7'}));
  var order={R:0,A:1,G:2}, idx=[]; for(i=0;i<D.airports.length;i++) idx.push(i);
  idx.sort(function(a,b){ return order[s.vs[a]]-order[s.vs[b]]; });
  for(var k=0;k<idx.length;k++){
    var j=idx[k], a=D.airports[j], p=P(a[2],a[3]);
    if(p[0]<-40||p[0]>W+40||p[1]<-40||p[1]>H+40) continue;
    var v=s.vs[j], shown=s.shown[j]==='Y';
    var col=v==='G'?'var(--c-2)':(v==='A'?'var(--c-3)':'var(--c-1)');
    var big=(shown&&v!=='G');
    var dx=p[0]-cx, dy=p[1]-cy, rr=Math.sqrt(dx*dx+dy*dy)/sc;
    var far=(!shown&&v==='R'&&rr>maxR*1.05);
    svg.appendChild(el('circle',{cx:p[0].toFixed(1),cy:p[1].toFixed(1),r:big?4.6:(far?1.6:2.5),
      fill:v==='G'?col:'var(--surface)',stroke:col,'stroke-width':big?2:1.3,opacity:far?'0.3':'1'}));
    if(big&&v==='R') svg.appendChild(el('path',{d:'M'+(p[0]-3.2)+' '+(p[1]-3.2)+'L'+(p[0]+3.2)+' '+(p[1]+3.2)+
      'M'+(p[0]+3.2)+' '+(p[1]-3.2)+'L'+(p[0]-3.2)+' '+(p[1]+3.2),stroke:'var(--c-1)','stroke-width':'1.8'}));
  }
  var ac=P(s.lat,s.lon);
  if(s.trk!==null&&s.trk!==undefined){ var th=s.trk*Math.PI/180,L=26;
    svg.appendChild(el('path',{d:'M'+ac[0]+' '+ac[1]+'L'+(ac[0]+Math.sin(th)*L)+' '+(ac[1]-Math.cos(th)*L),
      stroke:'var(--ink)','stroke-width':'2.4'})); }
  svg.appendChild(el('circle',{cx:ac[0],cy:ac[1],r:5.5,fill:'var(--ink)'}));
  svg.appendChild(el('circle',{cx:ac[0],cy:ac[1],r:11,fill:'none',stroke:'var(--ink)','stroke-width':'1.3',opacity:'.45'}));
  var barKm=Math.max(10,Math.round(span/4/10)*10), bx=60, by=H-38;
  svg.appendChild(el('line',{x1:bx,y1:by,x2:bx+barKm*sc,y2:by,stroke:'var(--ink-2)','stroke-width':'2'}));
  var tx=el('text',{x:bx,y:by-9,'font-size':'13',fill:'var(--ink-2)'}); tx.textContent=barKm+' km'; svg.appendChild(tx);
  document.getElementById('gb-tout').textContent=Math.round(s.alt).toLocaleString()+' ft \\u00b7 track '+
    (s.trk==null?'\\u2014':Math.round(s.trk)+'\\u00b0');
  document.getElementById('gb-note').textContent=NOTES[pi];
  var c=s.c;
  document.getElementById('gb-counts').innerHTML='<b>'+c[3]+'</b> airfields inside the single line &nbsp;\\u2192&nbsp; '+
    '<span class="g"><b>'+(c[3]-c[4])+'</b> proved</span>, <span class="a"><b>'+(c[4]-c[5])+
    '</b> undecided</span>, <span class="r"><b>'+c[5]+'</b> refuted</span>';
  var tb=document.getElementById('gb-rows'); tb.innerHTML='';
  if(!s.top.length) tb.innerHTML='<tr><td colspan="8">Nothing inside the line is left unproved at this state.</td></tr>';
  for(var r=0;r<s.top.length;r++){ var t=s.top[r], ap=D.airports[t[0]];
    var nm=ap[1].length>34?ap[1].slice(0,33)+'\\u2026':ap[1], tr=document.createElement('tr');
    tr.innerHTML='<td class="mono">'+ap[0]+'</td><td>'+nm+'</td><td class="n mono">'+t[1].toFixed(1)+'</td>'+
      '<td class="n mono">'+t[2].toFixed(0)+'\\u2013'+t[3].toFixed(0)+'</td><td class="n mono">'+t[4].toFixed(0)+'</td>'+
      '<td>'+(t[5]?'<span class="v-r">REFUTED</span>':'<span class="v-a">UNDECIDED</span>')+'</td>'+
      '<td class="n mono">'+t[7]+' s</td><td class="n mono">'+(t[6]?t[6].toFixed(1):'\\u2014')+'</td>';
    tb.appendChild(tr); }
  document.getElementById('gb-cap').textContent='Distances in km. Airfields the single line places inside your '+
    'reach that the certified band does not prove, worst first. "Turn" is the seconds of standard-rate turn to '+
    'point at the field from the aircraft\\u2019s actual ADS-B ground track \\u2014 the height lost doing it is '+
    'charged to both instruments. "Needs L/D \\u2265" is the glide ratio you would have to KNOW you have for the '+
    'field to turn green, everything else unchanged: the disclosure this verdict is asking for.';
}
function wire(id,get,set){ var b=document.getElementById(id).querySelectorAll('button'), i;
  for(i=0;i<b.length;i++) b[i].addEventListener('click',function(e){
    set(+e.currentTarget.getAttribute('data-v'));
    for(var j=0;j<b.length;j++) b[j].className=(+b[j].getAttribute('data-v')===get())?'on':'';
    draw(); }); }
wire('gb-w',function(){return wi;},function(v){wi=v;});
wire('gb-m',function(){return mi;},function(v){mi=v;});
wire('gb-p',function(){return pi;},function(v){pi=v;});
document.getElementById('gb-t').addEventListener('input',function(e){ ti=+e.target.value; draw(); });
draw();
})();
</script>`;

B.push(C.section({
  lab: '\u00a72 \u00b7 the instrument', wide: true,
  title: 'Fly the cruise. Watch the three zones move.',
  bodyRaw: '<div class="col">'
    + C.pRaw('Scrub along the flight. The shapes lean forward because reaching a field <em>behind</em> you costs '
      + 'the height you lose turning onto it \u2014 taken from the aircraft\u2019s actual ADS-B ground track, and '
      + 'charged to the dashed line too, so the comparison stays about method and nothing else.')
    + C.pRaw('Then change the aircraft. The two turboprop rows are the <strong>same aeroplane on the same '
      + 'flight</strong>, differing only in whether the propeller feathered.')
    + '</div>' + DASH
}));

/* ---------------- §3 the comparison --------------------------------------- */
B.push(C.section({
  lab: '\u00a73 \u00b7 the comparison', title: 'One assumption the glass cannot check',
  bodyRaw: '<div class="col">'
    + C.pRaw('Four powered scenarios, same flight, same instant, drawn at one scale. Three of them are '
      + 'ordinary: the panel\u2019s configured glide ratio sits inside the honest envelope, so its dashed line '
      + 'falls between the two boundaries and the picture is the familiar one \u2014 a solid core, a wide '
      + 'undecided annulus, nothing refuted. Watch the fourth.')
    + '</div>'
}));
B.push(C.figure({ svgRaw: figPacks(), caption: 'The fourth cell is the same aircraft as the third with the '
  + 'propeller unfeathered. Nothing about the panel changed \u2014 it is still configured with the feathered '
  + 'ratio, because nothing tells it otherwise \u2014 so its dashed line now sits outside the boundary beyond '
  + 'which nothing is reachable at all. The glider scenario is left off this figure deliberately: its reach is '
  + 'roughly four times the others and on a shared scale it collapses these four to dots. It appears in the '
  + 'composition chart below, where the axis is a proportion.' }));

B.push(C.section({
  lab: '', title: 'What an unfeathered propeller does to the picture',
  bodyRaw: '<div class="col">'
    + C.pull('The failure is not a bad number. It is an event the instrument cannot observe.')
    + C.pRaw('An unfeathered propeller is a large draggy disc, and it roughly halves what the aeroplane can '
      + 'reach. The ring on the glass does not move, because nothing in the system knows. Of the '
      + NOFEATHER.shown + ' claims that line makes across the cruise, ' + NOFEATHER.dam + ' \u2014 '
      + pct(NOFEATHER.pctDam) + ' \u2014 are now provably unreachable for every value in the envelope. '
      + (worst ? 'The worst single row in that scenario: <span class="m">' + C.esc(AP_OF(worst.row[0]).ident)
        + '</span>, ' + C.esc(AP_OF(worst.row[0]).name) + ', at ' + Math.round(worst.s.alt).toLocaleString()
        + ' ft. The field is ' + worst.row[1].toFixed(0) + ' km away, the line promises ' + worst.row[4].toFixed(0)
        + ' km of reach, and the band ends at ' + worst.row[3].toFixed(0) + ' km \u2014 not close, and not a '
        + 'judgement call.' : ''))
    + '</div>'
}));
B.push(C.figure({ svgRaw: figComposition(COMP_ROWS), caption: 'Every claim the single line makes across the '
  + 'cruise, sorted by what survives checking. The right-hand column is how many claims it made. Reversing the '
  + 'winds-aloft forecast \u2014 a documented failure of the other input the ring leans on \u2014 does the same '
  + 'thing by a different route.' }));

/* ---------------- §4 the argument ----------------------------------------- */
B.push(C.section({
  lab: '\u00a74 \u00b7 the argument', title: 'Why the line could never have warned you',
  bodyRaw: '<div class="col">'
    + C.pRaw('Look again at the four ordinary scenarios. Not one of them contains a <em>single</em> refuted '
      + 'airfield, and that is not luck. While the panel\u2019s assumed glide ratio, airspeed and wind sit '
      + 'anywhere inside the honest envelope, its line is mathematically guaranteed to fall between the two '
      + 'boundaries \u2014 this build asserts it across every such scenario and refuses to publish if it ever '
      + 'fails. So nothing inside that line can be proved unreachable.')
    + C.pull('The line is drawn from the very assumptions it would have to doubt. It cannot be caught being '
      + 'wrong \u2014 and it is never shown to be right either.')
    + C.pRaw('That is the whole case, and it is worth being precise about what it does and does not say. It does '
      + 'not say the ring is inaccurate. It says the ring is <em>unfalsifiable</em>: ' + pct(pctFalse) + ' of what '
      + 'it claims is undecided by the evidence it was drawn from, and it has no way to tell you which part. An '
      + 'instrument that cannot fail a test is not passing one.')
    + C.pRaw('What changed in the unfeathered case was not accuracy. The line became <strong>falsifiable</strong>, '
      + 'and was falsified. That is the difference between the two instruments, and it is why the undecided '
      + 'annulus is the product rather than a defect: a wider band is the same answer with its width shown. '
      + 'Narrow the inputs \u2014 real flight-test data, a propeller-state signal, a better wind \u2014 and the '
      + 'annulus shrinks. Its width is a measurement of what nobody knows yet.')
    + '</div>'
}));

/* ---------------- §5 the hypotheses --------------------------------------- */
B.push(C.section({
  lab: '\u00a75 \u00b7 what is not claimed', title: 'Five hypotheses, on the page rather than in a footnote',
  bodyRaw: C.table({
    cols: [{ h: '' }, { h: 'the hypothesis' }, { h: 'which way it can be wrong' }],
    rows: [
      [{ raw: C.m('H1') }, 'Terrain is not modelled. The band is glide distance over ground at the field\u2019s own elevation.',
        { raw: '<strong>Asymmetric, and it runs the safe way.</strong> Rising ground can only REMOVE reach, so REFUTED is unaffected and stays proved; PROVED REACHABLE means \u201creachable if the path is unobstructed\u201d. A terrain layer moves green fields to undecided, never the reverse.' }],
      [{ raw: C.m('H2') }, 'Steady wind through the descent and a steady-state glide.',
        'No pushover transient, no shear or thermal structure, and no credit for trading cruise speed back into height.'],
      [{ raw: C.m('H3') }, 'Great circles on a sphere whose radius is enclosed by [6356.752, 6378.137] km.',
        'Deliberately crude and deliberately conservative \u2014 six orders of magnitude above the double-precision error of the haversine, so the geodesy needs no separate error argument.'],
      [{ raw: C.m('H4') }, 'The envelopes are illustrative classes in stated configurations \u2014 not manufacturer data.',
        { raw: 'No published performance figure for any aircraft is asserted anywhere here, and nothing claims what any product computes internally; what is compared is the point-estimate METHOD. Move the envelope and every percentage moves. <strong>The structural finding of \u00a74 does not \u2014 it holds for any envelope wider than a point.</strong>' }],
      [{ raw: C.m('H5') }, 'The turn: height lost turning onto each field at standard rate from the actual ADS-B ground track.',
        'Progress during the turn counted as zero \u2014 conservative \u2014 and charged to both instruments equally.']
    ]
  }) + '<div class="col">'
    + C.note({ lab: 'wording', bodyRaw: C.pRaw('\u201cCertified\u201d on this page always means a '
        + '<em>mathematically certified enclosure</em>: an interval proved to contain the true value. It carries '
        + 'no airworthiness meaning, no design assurance and no approval of any kind. The artifact says NOT FOR '
        + 'NAVIGATION on its face and means it \u2014 this is a demonstration of a decision procedure, on a '
        + 'flight that had no emergency and a crew who did nothing of the sort.') })
    + '</div>'
}));

/* ---------------- §6 the gap ---------------------------------------------- */
B.push(C.section({
  lab: '\u00a76 \u00b7 the honest gap', title: 'What would have to be true for this to be in a cockpit',
  bodyRaw: '<div class="col">'
    + C.pRaw('<strong>Terrain.</strong> H1 is the big one. A certified band with a terrain floor is the same '
      + 'arithmetic over a pinned elevation model \u2014 the next build, not a research problem.')
    + C.pRaw('<strong>Real performance data.</strong> The envelopes are stated, not measured. Flight-test data '
      + 'would replace H4 with something narrower and the annulus would shrink, which is exactly the point.')
    + C.pRaw('<strong>Design assurance.</strong> Nothing here is DO-178C evidence, and the distance between an '
      + 'exact enclosure and certifiable software is the real cost in avionics.')
    + C.pull('\u201cWe ran ten thousand sorties and saw no failure\u201d has the same shape. It cannot be refuted '
      + 'by the evidence it rests on.')
    + C.pRaw('Which is the reason this is worth more than a display feature. The defect on this page is not '
      + 'really about glide rings \u2014 it is what happens whenever a point estimate is handed over as a '
      + 'decision boundary, and it is the same defect that makes a test campaign an unfalsifiable safety '
      + 'argument. The glide ring is simply the most legible instance of it: one line, one aeroplane, and a '
      + 'field you either reach or you do not.')
    + '</div>'
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-glide-band.js @ git ' + git + '. The app\u2019s '
  + 'battery ran as this page\u2019s gate (' + nChecks + ' checks, ' + nReds + ' reds fired), the data pins were '
  + 're-hashed, and all ' + scen.length + ' states \u2014 ' + TRACK.length + ' cruise positions \u00d7 '
  + PACKS.length + ' scenarios \u00d7 ' + WINDS.length + ' winds \u00d7 ' + MODES.length + ' forecast modes over '
  + relevant.length + ' airfields \u2014 were decided during this build. The build refuses on any deviation, and '
  + 'refuses if either failure scenario stops biting. Flight: ' + C.esc(FLIGHT.reg || FLIGHT.icao)
  + ', adsb.lol ' + FLIGHT.day + ', pinned through apps/skyaudit \u2014 ADS-B data \u00a9 adsb.lol, ODbL. '
  + 'Airfields: OurAirports (public domain), sha256 ' + PINS.files['airports.csv'].sha256.slice(0, 12)
  + '\u2026. Instrument: apps/glide-band/kernel.js.</p></footer>';

const STYLE = `
<style>
.gb{margin:0 0 1rem;}
.gb-bar{display:flex;gap:1.5rem;flex-wrap:wrap;align-items:flex-end;margin:0 0 .7rem;}
.gb-ctl{display:flex;flex-direction:column;gap:.34rem;}
.gb-ctl>span{text-transform:uppercase;letter-spacing:.07em;font-size:.68rem;color:var(--ink-3);}
.gb-ctl input[type=range]{width:min(320px,60vw);accent-color:var(--sig);}
.gb-ctl output{font-family:var(--mono,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:.78rem;color:var(--ink-2);}
.gb-seg{display:flex;flex-wrap:wrap;border:1px solid var(--rule);border-radius:2px;overflow:hidden;background:var(--surface);}
.gb-seg button{border:0;background:transparent;padding:.4rem .72rem;font:inherit;font-size:.78rem;
  color:var(--ink-2);cursor:pointer;border-right:1px solid var(--rule);}
.gb-seg button:last-child{border-right:0;}
.gb-seg button:hover{background:var(--sunk);}
.gb-seg button.on{background:var(--sig);color:var(--surface);}
.gb-note{font-size:.82rem;color:var(--ink-2);margin:.1rem 0 .8rem;max-width:74ch;}
.gb-stage{position:relative;}
.gb-stage svg{width:100%;height:auto;display:block;background:var(--surface);border:1px solid var(--rule);}
.gb-nav{position:absolute;right:.55rem;bottom:.55rem;font-size:.64rem;letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink-3);background:var(--surface);padding:.12rem .38rem;}
.gb-key{display:flex;gap:1.15rem;flex-wrap:wrap;margin:.75rem 0 .3rem;font-size:.78rem;color:var(--ink);}
.gb-key i{display:inline-block;width:11px;height:11px;margin-right:.4rem;vertical-align:-1px;border-radius:50%;}
.gb-key em{color:var(--ink-3);font-style:normal;margin-left:.3rem;}
.k-g{background:var(--c-2);}
.k-a{background:var(--warn-soft);border:2px solid var(--c-3);}
.k-r{background:var(--surface);border:2px solid var(--c-1);}
.k-n{border-radius:0!important;height:0!important;width:17px!important;border-top:2px dashed var(--ink-2);}
.gb-counts{font-size:.95rem;margin:.55rem 0 1rem;color:var(--ink);}
.gb-counts .g{color:var(--c-2);}.gb-counts .a{color:var(--c-3);}.gb-counts .r{color:var(--c-1);}
.gb-tw{overflow-x:auto;}
.gb-table{width:100%;border-collapse:collapse;font-size:.82rem;}
.gb-table th,.gb-table td{padding:.36rem .6rem;border-bottom:1px solid var(--rule-soft);text-align:left;}
.gb-table th{font-size:.66rem;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-3);font-weight:400;}
.gb-table td{color:var(--ink-2);} .gb-table .n{text-align:right;}
.gb-table .mono{font-family:var(--mono,ui-monospace,SFMono-Regular,Menlo,monospace);color:var(--ink);}
.v-r{color:var(--c-1);font-weight:600;}.v-a{color:var(--c-3);font-weight:600;}
.gb-cap{font-size:.78rem;color:var(--ink-3);margin-top:.5rem;}
.rv{opacity:0;transform:translateY(14px);transition:opacity .55s ease,transform .55s ease;}
.rv.in{opacity:1;transform:none;}
@media(prefers-reduced-motion:reduce){.rv{opacity:1;transform:none;transition:none;}}
</style>
<script>
/* Scroll reveal, built so it CANNOT hide content. Three guards, because a
   reading page that goes blank when an observer misbehaves is worse than a
   page with no animation at all:
     1. nothing is hidden unless IntersectionObserver exists;
     2. anything already on screen is never hidden in the first place;
     3. a 1.5 s failsafe reveals everything regardless of what the observer did. */
(function(){
  if(!('IntersectionObserver' in window)) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var all=document.querySelectorAll('figure, .gb, .stats, .pull'), t=[], i;
  for(i=0;i<all.length;i++){
    var r=all[i].getBoundingClientRect();
    if(r.top < (window.innerHeight||800) * 1.05) continue;   /* already in view */
    all[i].classList.add('rv'); t.push(all[i]);
  }
  var reveal=function(el){ el.classList.add('in'); };
  var io=new IntersectionObserver(function(es){
    for(var k=0;k<es.length;k++) if(es[k].isIntersecting){ reveal(es[k].target); io.unobserve(es[k].target); }
  },{rootMargin:'0px 0px -6% 0px',threshold:0.05});
  for(i=0;i<t.length;i++) io.observe(t[i]);
  setTimeout(function(){ for(var k=0;k<t.length;k++) reveal(t[k]); }, 1500);
})();
</script>`;

fs.writeFileSync(path.join(ROOT, 'reports', 'glide-band.html'),
  TPL.render({ title: 'The ring shows you one answer. There are three.',
    bodyRaw: B.join('\n\n') + STYLE, footRaw: foot, path: '/reports/glide-band.html',
    desc: 'The engine-out glide ring recomputed as a certified enclosure on a real pinned flight: airfields you '
      + 'will reach whatever the assumptions, airfields you will reach under none, and the undecided annulus '
      + 'between that no shipped product draws.' }));

console.log('reports/glide-band.html written: base ' + pct(pctFalse) + ' unproved / 0 refuted, no-feather '
  + pct(NOFEATHER.pctDam) + ' refuted, reversed ' + pct(REVERSED.pctDam) + ' refuted, ' + relevant.length
  + ' airfields, ' + scen.length + ' states, payload ' + (bytes / 1024).toFixed(0) + ' KB, battery '
  + nChecks + '/' + nReds + ' @ git ' + git);
