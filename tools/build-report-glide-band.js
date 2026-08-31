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
let worst = null;
for (const s of scen) for (const r of s.top) {
  if (r[5] === 1 && (!worst || (r[1] - r[3]) > (worst.row[1] - worst.row[3]))) worst = { row: r, s };
}

const bytes = JSON.stringify(scen).length;

/* ======================================================================== */
const B = [];
const pct = (x) => x.toFixed(0) + '%';
const AP_OF = (i) => relevant[i];

B.push(C.header({
  eyebrow: 'cert-machine · report · every number recomputed at build',
  title: 'The glide ring is unfalsifiable. That is the problem with it.',
  deck: 'When the engine quits the panel draws one ring and calls it your reach — one glide ratio, one '
    + 'forecast wind, one weight, rendered as a promise. Recomputed as an enclosure over those same inputs’ '
    + 'uncertainty, on a real pinned flight: ' + pct(pctFalse) + ' of the airfields inside that line cannot be '
    + 'proved reachable, and none can be proved unreachable either. That is not a coincidence. It is what makes '
    + 'the line safe to draw and impossible to check.'
}));

B.push(C.tldr({
  findingRaw: '<strong>' + pct(pctFalse) + ' of the sites inside the single-line ring are not proved reachable — '
    + 'and zero are proved unreachable.</strong> The zero is structural, and the build asserts it: while the '
    + 'panel’s configured glide ratio lies inside the honest envelope, its line always falls between the two '
    + 'certified boundaries, so nothing inside it can ever be refuted. Change one thing the glass cannot see '
    + '— the propeller does not feather — and ' + pct(NOFEATHER.pctDam) + ' of what that same line shows '
    + 'becomes provably out of reach. Reverse the winds-aloft forecast instead and it is '
    + pct(REVERSED.pctDam) + '.',
  mechanismRaw: 'Outward-rounded interval arithmetic over the glide model, the box subdivided ' + K.NVA + '×'
    + K.NWD + ' so the answer is not charged for a dependency the physics does not have, and the height lost '
    + 'turning onto each field taken from the aircraft’s actual ADS-B ground track. Both outer verdicts are '
    + 'conservative: a wider enclosure can only move a site INTO undecided, never into a wrong answer.',
  checkRaw: C.m('node apps/glide-band/battery.js') + ' — ' + nChecks + ' checks including a 4000-draw '
    + 'containment test, and ' + nReds + ' red controls that must fire, among them the point-estimate method itself.'
}));

B.push(C.stats([
  { k: 'shown by the line, not proved', v: pct(pctFalse), role: 'held',
    n: totFalse + ' of ' + totShown + ' site-states — turboprop, propeller feathered, 35 kt, forecast right' },
  { k: 'shown by the line, refutable', v: '0', role: 'held',
    n: 'structural, and gated at build: while the configured ratio sits inside the envelope the line cannot be '
       + 'proved wrong about anything — unfalsifiable, not correct' },
  { k: 'if the prop does not feather', v: pct(NOFEATHER.pctDam), role: 'held',
    n: NOFEATHER.dam + ' of ' + NOFEATHER.shown + ' site-states inside the same line become PROVABLY unreachable. '
       + 'Same aircraft, same flight, one action short — and the glass has no way to know' },
  { k: 'if the forecast is reversed', v: pct(REVERSED.pctDam), role: 'held',
    n: REVERSED.dam + ' of ' + REVERSED.shown + ' site-states refuted when the winds-aloft forecast is 180° out' },
  { k: 'the flight', v: C.esc(FLIGHT.reg || FLIGHT.icao), sm: true,
    n: C.esc(FLIGHT.desc || FLIGHT.type) + ', single-engine turboprop, ' + FLIGHT.day
       + ' — adsb.lol, pinned through apps/skyaudit' },
  { k: 'states swept', v: String(scen.length), sm: true,
    n: TRACK.length + ' cruise positions × ' + PACKS.length + ' aircraft scenarios × ' + WINDS.length
       + ' winds × ' + MODES.length + ' forecast modes, over ' + relevant.length
       + ' airfields, every one decided at build' }
]));

/* ---------------- the dashboard ------------------------------------------- */
const DATA = {
  scen, airports: relevant.map((a) => [a.ident, a.name, a.lat, a.lon, a.elev_ft]),
  winds: WINDS.map((w) => w.name), packs: PACKS.map((p) => p.label + ' · ' + p.sub),
  nb: NB, track: FLIGHT.track.filter((p) => p.alt >= 10000).map((p) => [+p.lat.toFixed(4), +p.lon.toFixed(4)])
};

const seg = (id, items, sel) => '<div id="' + id + '" class="gb-seg">' + items.map((t, i) =>
  '<button data-v="' + i + '"' + (i === sel ? ' class="on"' : '') + '>' + C.esc(t) + '</button>').join('') + '</div>';

const DASH = `
<div class="gb-wrap">
  <div class="gb-controls">
    <label class="gb-ctl"><span>Position along the cruise</span>
      <input id="gb-t" type="range" min="0" max="${TRACK.length - 1}" value="${HERO.t}" step="1">
      <output id="gb-tout"></output></label>
    <div class="gb-ctl"><span>Aircraft &amp; configuration</span>
      ${seg('gb-p', PACKS.map((p) => p.label + ' · ' + p.sub), HERO.p)}</div>
  </div>
  <div class="gb-controls">
    <div class="gb-ctl"><span>Forecast wind (from 270°)</span>${seg('gb-w', WINDS.map((w) => w.name), HERO.w)}</div>
    <div class="gb-ctl"><span>Is the forecast right?</span>${seg('gb-m', MODES.map((m) => m.label), HERO.m)}</div>
  </div>
  <p id="gb-note" class="gb-note"></p>
  <div class="gb-stage">
    <svg id="gb-svg" viewBox="0 0 900 620" role="img" aria-label="Certified glide band around a pinned flight"></svg>
    <div class="gb-nav">NOT FOR NAVIGATION · illustrative scenario, not manufacturer data</div>
  </div>
  <div class="gb-key">
    <span><i class="k-g"></i>PROVED REACHABLE <em>(if the path is unobstructed — H1)</em></span>
    <span><i class="k-a"></i>UNDECIDED <em>the envelope does not settle it</em></span>
    <span><i class="k-r"></i>REFUTED <em>unreachable for every value in the envelope</em></span>
    <span><i class="k-n"></i>the single line a panel draws</span>
  </div>
  <div id="gb-counts" class="gb-counts"></div>
  <div class="gb-tablewrap"><table class="gb-table"><thead><tr>
    <th>ident</th><th>airfield</th><th class="n">distance</th><th class="n">proved band</th>
    <th class="n">the line says</th><th>verdict</th><th class="n">turn</th><th class="n">needs L/D ≥</th>
  </tr></thead><tbody id="gb-rows"></tbody></table></div>
  <p class="gb-cap" id="gb-cap"></p>
</div>
<script>
(function(){
var D = ${JSON.stringify(DATA)};
var NOTES = ${JSON.stringify(PACKS.map((p) => p.note))};
var svg = document.getElementById('gb-svg');
var NS='http://www.w3.org/2000/svg';
var ti=${HERO.t}, wi=${HERO.w}, mi=${HERO.m}, pi=${HERO.p};
function scenOf(){ for(var i=0;i<D.scen.length;i++){ var x=D.scen[i];
  if(x.t===ti&&x.w===wi&&x.m===mi&&x.p===pi) return x; } return D.scen[0]; }
function el(n,at){ var e=document.createElementNS(NS,n); for(var k in at) e.setAttribute(k,at[k]); return e; }

function draw(){
  var s=scenOf();
  var W=900,H=620,cx=W*0.5,cy=H*0.5;
  var maxR=0; for(var i=0;i<s.rhi.length;i++) if(s.rhi[i]>maxR) maxR=s.rhi[i];
  for(var i=0;i<s.rnom.length;i++) if(s.rnom[i]>maxR) maxR=s.rnom[i];
  var span=Math.max(maxR*1.18,20);
  var kmPerDegLat=110.574, kmPerDegLon=111.320*Math.cos(s.lat*Math.PI/180);
  var sc=(H*0.46)/span;
  function P(lat,lon){ return [cx+(lon-s.lon)*kmPerDegLon*sc, cy-(lat-s.lat)*kmPerDegLat*sc]; }
  function ring(rs){ var d=''; for(var b=0;b<rs.length;b++){ var th=b*2*Math.PI/rs.length;
      var x=cx+Math.sin(th)*rs[b]*sc, y=cy-Math.cos(th)*rs[b]*sc; d+=(b?'L':'M')+x.toFixed(1)+' '+y.toFixed(1); }
    return d+'Z'; }
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  var defs=el('defs');
  var pat=el('pattern',{id:'gbHatch',width:'7',height:'7',patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'});
  pat.appendChild(el('rect',{width:'7',height:'7',fill:'var(--gb-a-soft)'}));
  pat.appendChild(el('line',{x1:'0',y1:'0',x2:'0',y2:'7',stroke:'var(--gb-a)','stroke-width':'1.4','opacity':'.55'}));
  defs.appendChild(pat); svg.appendChild(defs);

  svg.appendChild(el('path',{d:ring(s.rhi)+' '+ring(s.rlo),'fill-rule':'evenodd',fill:'url(#gbHatch)'}));
  svg.appendChild(el('path',{d:ring(s.rlo),fill:'var(--gb-g-soft)',stroke:'var(--gb-g)','stroke-width':'2.2'}));
  svg.appendChild(el('path',{d:ring(s.rhi),fill:'none',stroke:'var(--gb-r)','stroke-width':'2.2'}));
  svg.appendChild(el('path',{d:ring(s.rnom),fill:'none',stroke:'var(--gb-n)','stroke-width':'2.6','stroke-dasharray':'9 6'}));

  var td=''; for(var i=0;i<D.track.length;i++){ var q=P(D.track[i][0],D.track[i][1]); td+=(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1); }
  svg.appendChild(el('path',{d:td,fill:'none',stroke:'var(--gb-track)','stroke-width':'1.6','opacity':'.75'}));

  var order={R:0,A:1,G:2};
  var idx=[]; for(var i=0;i<D.airports.length;i++) idx.push(i);
  idx.sort(function(a,b){ return order[s.vs[a]]-order[s.vs[b]]; });
  for(var k=0;k<idx.length;k++){
    var i=idx[k], a=D.airports[i], p=P(a[2],a[3]);
    if(p[0]<-40||p[0]>W+40||p[1]<-40||p[1]>H+40) continue;
    var v=s.vs[i], shown=s.shown[i]==='Y';
    var col=v==='G'?'var(--gb-g)':(v==='A'?'var(--gb-a)':'var(--gb-r)');
    var big=(shown&&v!=='G');
    var dx=p[0]-cx, dy=p[1]-cy, rr=Math.sqrt(dx*dx+dy*dy)/sc;
    var far=(!shown && v==='R' && rr>maxR*1.06);
    svg.appendChild(el('circle',{cx:p[0].toFixed(1),cy:p[1].toFixed(1),r:big?4.6:(far?1.7:2.6),
      fill:v==='G'?col:'var(--gb-paper)',stroke:col,'stroke-width':big?2:1.3,opacity:far?'0.28':'1'}));
    if(big&&v==='R'){
      svg.appendChild(el('path',{d:'M'+(p[0]-3.2)+' '+(p[1]-3.2)+'L'+(p[0]+3.2)+' '+(p[1]+3.2)+
        'M'+(p[0]+3.2)+' '+(p[1]-3.2)+'L'+(p[0]-3.2)+' '+(p[1]+3.2),stroke:'var(--gb-r)','stroke-width':'1.8'}));
    }
  }
  var ac=P(s.lat,s.lon);
  if(s.trk!==null&&s.trk!==undefined){
    var th=s.trk*Math.PI/180, L=26;
    svg.appendChild(el('path',{d:'M'+ac[0]+' '+ac[1]+'L'+(ac[0]+Math.sin(th)*L)+' '+(ac[1]-Math.cos(th)*L),
      stroke:'var(--gb-ink)','stroke-width':'2.4'}));
  }
  svg.appendChild(el('circle',{cx:ac[0],cy:ac[1],r:6,fill:'var(--gb-ink)'}));
  svg.appendChild(el('circle',{cx:ac[0],cy:ac[1],r:11,fill:'none',stroke:'var(--gb-ink)','stroke-width':'1.4','opacity':'.5'}));

  var barKm=Math.max(10,Math.round(span/4/10)*10), bx=64, by=H-40;
  svg.appendChild(el('line',{x1:bx,y1:by,x2:bx+barKm*sc,y2:by,stroke:'var(--gb-ink)','stroke-width':'2'}));
  var tx=el('text',{x:bx,y:by-9,'font-size':'13',fill:'var(--gb-ink)'}); tx.textContent=barKm+' km';
  svg.appendChild(tx);

  document.getElementById('gb-tout').textContent = Math.round(s.alt).toLocaleString()+' ft · track '+
    (s.trk===null?'—':Math.round(s.trk)+'°')+' · '+s.lat.toFixed(3)+', '+s.lon.toFixed(3);
  document.getElementById('gb-note').textContent = NOTES[pi];
  var c=s.c;
  document.getElementById('gb-counts').innerHTML =
    '<b>'+c[3]+'</b> airfields inside the single line &nbsp;→&nbsp; <span class="g"><b>'+(c[3]-c[4])+
    '</b> proved</span>, <span class="a"><b>'+(c[4]-c[5])+'</b> undecided</span>, <span class="r"><b>'+c[5]+
    '</b> refuted</span>';

  var tb=document.getElementById('gb-rows'); tb.innerHTML='';
  if(!s.top.length){ tb.innerHTML='<tr><td colspan="8">Nothing inside the line is left unproved at this state.</td></tr>'; }
  for(var r=0;r<s.top.length;r++){ var t=s.top[r], a=D.airports[t[0]];
    var nm=a[1].length>34?a[1].slice(0,33)+'…':a[1];
    var tr=document.createElement('tr');
    tr.innerHTML='<td class="mono">'+a[0]+'</td><td>'+nm+'</td><td class="n mono">'+t[1].toFixed(1)+' km</td>'+
      '<td class="n mono">'+t[2].toFixed(0)+'–'+t[3].toFixed(0)+' km</td>'+
      '<td class="n mono">'+t[4].toFixed(0)+' km</td>'+
      '<td>'+(t[5]?'<span class="v-r">REFUTED</span>':'<span class="v-a">UNDECIDED</span>')+'</td>'+
      '<td class="n mono">'+t[7]+' s</td>'+
      '<td class="n mono">'+(t[6]?t[6].toFixed(1):'—')+'</td>';
    tb.appendChild(tr);
  }
  document.getElementById('gb-cap').textContent =
    'Airfields the single line places inside your reach that the certified band does not prove, worst first. '+
    '"Turn" is the seconds of standard-rate turn needed to point at the field from the aircraft’s actual '+
    'ADS-B ground track, and the height lost doing it is charged to both instruments. "Needs L/D ≥" is the '+
    'glide ratio you would have to KNOW you have for the field to turn green with everything else unchanged '+
    '— the disclosure this verdict is asking for.';
}
function wire(id,set){ var b=document.getElementById(id).querySelectorAll('button');
  for(var i=0;i<b.length;i++) b[i].addEventListener('click',function(e){
    set(+e.target.getAttribute('data-v'));
    for(var j=0;j<b.length;j++) b[j].className=(+b[j].getAttribute('data-v')===set())?'on':'';
    draw(); }); }
wire('gb-w',function(v){ if(v!==undefined) wi=v; return wi; });
wire('gb-m',function(v){ if(v!==undefined) mi=v; return mi; });
wire('gb-p',function(v){ if(v!==undefined) pi=v; return pi; });
document.getElementById('gb-t').addEventListener('input',function(e){ ti=+e.target.value; draw(); });
draw();
})();
</script>
<style>
.gb-wrap{--gb-g:#2C6142;--gb-g-soft:#DEEBE3;--gb-a:#8A5212;--gb-a-soft:#F6E9D8;--gb-r:#8E2B2B;
  --gb-n:#9A4E86;--gb-track:#544C5B;--gb-ink:#16121A;--gb-paper:#FBFAFB;margin:0 0 1rem;}
.gb-controls{display:flex;gap:1.6rem;flex-wrap:wrap;align-items:flex-end;margin:0 0 .8rem;}
.gb-ctl{display:flex;flex-direction:column;gap:.35rem;font-size:.82rem;}
.gb-ctl>span{text-transform:uppercase;letter-spacing:.06em;font-size:.7rem;opacity:.7;}
.gb-ctl input[type=range]{width:min(360px,64vw);}
.gb-ctl output{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78rem;}
.gb-seg{display:flex;flex-wrap:wrap;border:1px solid var(--gb-track);border-radius:3px;overflow:hidden;}
.gb-seg button{border:0;background:transparent;padding:.4rem .7rem;font:inherit;font-size:.78rem;cursor:pointer;
  border-right:1px solid var(--gb-track);}
.gb-seg button:last-child{border-right:0;}
.gb-seg button.on{background:var(--gb-ink);color:var(--gb-paper);}
.gb-note{font-size:.8rem;opacity:.75;margin:.2rem 0 .8rem;max-width:70ch;}
.gb-stage{position:relative;}
.gb-stage svg{width:100%;height:auto;display:block;background:var(--gb-paper);border:1px solid var(--gb-track);}
.gb-nav{position:absolute;right:.6rem;bottom:.6rem;font-size:.66rem;letter-spacing:.09em;
  text-transform:uppercase;opacity:.72;background:var(--gb-paper);padding:.15rem .4rem;}
.gb-key{display:flex;gap:1.2rem;flex-wrap:wrap;margin:.7rem 0;font-size:.78rem;align-items:center;}
.gb-key i{display:inline-block;width:12px;height:12px;margin-right:.4rem;vertical-align:-2px;border-radius:50%;}
.gb-key em{opacity:.65;font-style:normal;}
.k-g{background:var(--gb-g);}.k-a{background:var(--gb-a-soft);border:2px solid var(--gb-a);}
.k-r{background:var(--gb-paper);border:2px solid var(--gb-r);}
.k-n{background:transparent;border-top:2px dashed var(--gb-n);border-radius:0!important;height:0!important;width:18px!important;}
.gb-counts{font-size:.95rem;margin:.5rem 0 1rem;}
.gb-counts .g{color:var(--gb-g);}.gb-counts .a{color:var(--gb-a);}.gb-counts .r{color:var(--gb-r);}
.gb-tablewrap{overflow-x:auto;}
.gb-table{width:100%;border-collapse:collapse;font-size:.82rem;}
.gb-table th,.gb-table td{padding:.38rem .6rem;border-bottom:1px solid var(--gb-a-soft);text-align:left;}
.gb-table th{font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;opacity:.7;}
.gb-table .n{text-align:right;}
.gb-table .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}
.v-r{color:var(--gb-r);font-weight:600;}.v-a{color:var(--gb-a);font-weight:600;}
.gb-cap{font-size:.78rem;opacity:.72;margin-top:.5rem;}
@media(prefers-color-scheme:dark){.gb-wrap{--gb-ink:#EDEBEE;--gb-paper:#1A161E;--gb-track:#908995;
  --gb-g-soft:#1E3529;--gb-a-soft:#3A2E1C;}}
</style>`;

B.push(C.section({
  lab: '§1 · the instrument', wide: true,
  title: 'One flight, ' + relevant.length + ' airfields, five scenarios, three verdicts',
  bodyRaw: '<div class="col">'
    + C.pRaw('Scrub the slider to fly the cruise. The dashed line is what a panel draws from point estimates. '
      + 'The filled boundary is the certified inner ring — every airfield inside it is reachable for '
      + '<em>every</em> value in the stated envelope. The outer boundary is refutation: beyond it, no value in '
      + 'the envelope reaches. The hatched annulus between is the part nobody currently shows you.')
    + C.pRaw('The shapes lean forward because reaching a field behind you costs the height you lose turning '
      + 'onto it. The turn is taken from the aircraft’s <em>actual</em> ADS-B ground track (the needle on '
      + 'the aeroplane), charged at standard rate, and applied to the dashed line too — so the comparison '
      + 'stays about point estimate versus enclosure and nothing else.')
    + C.pRaw('Then change the aircraft. The two turboprop scenarios are the same aeroplane on the same flight, '
      + 'differing only in whether the propeller feathered.')
    + '</div>' + DASH
}));

B.push(C.section({
  lab: '§2 · the comparison', title: 'What the single line hides',
  bodyRaw: '<div class="col">'
    + C.pRaw('The comparison is not “their number versus our number” — both come from the same '
      + 'physics and the same flight. It is a comparison of <em>methods</em>: one value per input, versus the '
      + 'range each input actually has. Nothing here asserts what any particular product computes internally; '
      + 'what is compared is the point-estimate method, which is what every shipped glide ring draws.')
    + C.pRaw('<strong>The first half is about logic rather than arithmetic, and it is the uncomfortable one.</strong> '
      + 'While the panel’s configured glide ratio lies inside the honest envelope, its line always falls '
      + 'between the two certified boundaries — the build asserts this across every such scenario and '
      + 'refuses if it ever fails. So no airfield inside that line can be proved unreachable. The line is never '
      + 'caught being wrong, and never shown to be right either: ' + pct(pctFalse) + ' of what it claims is '
      + 'undecided by the evidence it was drawn from. An instrument that cannot fail a test is not passing one.')
    + C.pRaw('<strong>The second half is what happens when something the glass cannot see is false.</strong> '
      + 'Select <em>Turboprop · propeller did NOT feather</em>. Same aeroplane, same flight, same altitude; '
      + 'the drill was one action short, and an unfeathered propeller is a large draggy disc. The panel keeps '
      + 'drawing the ring it was configured with, because nothing tells it otherwise. Now '
      + NOFEATHER.dam + ' of the ' + NOFEATHER.shown + ' site-states it shows as reachable — '
      + pct(NOFEATHER.pctDam) + ' — are provably unreachable for every value in the envelope. Reverse the '
      + 'winds-aloft forecast instead, a documented failure of the other input the ring leans on, and it is '
      + REVERSED.dam + ' of ' + REVERSED.shown + ' (' + pct(REVERSED.pctDam) + ').')
    + (worst ? C.pRaw('<strong>The sharpest single row in the sweep.</strong> At '
        + Math.round(worst.s.alt).toLocaleString() + ' ft, <span class="m">' + C.esc(AP_OF(worst.row[0]).ident)
        + '</span> — ' + C.esc(AP_OF(worst.row[0]).name) + ' — lies ' + worst.row[1].toFixed(1)
        + ' km away. The single line puts your reach at ' + worst.row[4].toFixed(0) + ' km, so it draws that '
        + 'field comfortably inside. The certified band is ' + worst.row[2].toFixed(0) + '–'
        + worst.row[3].toFixed(0) + ' km: the field is beyond the outer boundary, unreachable for <em>every</em> '
        + 'value in the envelope. Not uncertain — refuted.') : '')
    + C.pRaw('<strong>What actually changed between the two halves is worth naming.</strong> The line did not '
      + 'become less accurate. It became FALSIFIABLE, and was falsified. That is the whole difference between '
      + 'the two instruments, and it is why the undecided annulus is the product rather than a defect: a wider '
      + 'band is the same answer with its width shown. Every undecided row carries the disclosure that would '
      + 'settle it — the last column is the glide ratio you would have to know you have.')
    + '</div>'
}));

B.push(C.section({
  lab: '§3 · the scenarios', title: 'Five illustrative packs, and what each is for',
  bodyRaw: C.table({
    cols: [{ h: 'scenario' }, { h: 'glide ratio, envelope', cls: 'n' }, { h: 'panel is set to', cls: 'n' },
           { h: 'best glide, kt', cls: 'n' }, { h: 'what it is for' }],
    rows: PACKS.map((p) => [
      p.label + ' · ' + p.sub,
      { raw: C.m(p.LD[0] + '–' + p.LD[1]) },
      { raw: C.m(String(p.panelLD)) + (p.panelLD > p.LD[1] ? ' <strong>(outside)</strong>' : '') },
      { raw: C.m(p.Va[0] + '–' + p.Va[1]) },
      p.note
    ])
  }) + '<div class="col">'
    + C.pRaw('These are <em>illustrative classes in stated configurations</em>, not manufacturer data, and that '
      + 'is H4 below. The point of the table is the third column: in four of the five packs the panel’s '
      + 'configured ratio sits inside the envelope, and in those four it is unfalsifiable. In the fifth it sits '
      + 'outside — not because anyone chose a bad number, but because the propeller did something the panel '
      + 'was never told about.')
    + '</div>'
}));

B.push(C.section({
  lab: '§4 · what is and is not claimed', title: 'Five hypotheses, stated rather than buried',
  bodyRaw: '<div class="col">'
    + C.pRaw('<strong>H1 · terrain is not modelled.</strong> The band is glide distance over ground at the '
      + 'field’s own elevation. Rising ground between here and there can only REMOVE reach, so the asymmetry '
      + 'is load-bearing and runs the safe way: <em>REFUTED is unaffected by H1 and stays proved; PROVED '
      + 'REACHABLE carries H1 and means “reachable if the path is unobstructed”.</em> A terrain layer '
      + 'would move green fields to undecided and never the reverse.')
    + C.pRaw('<strong>H2 · steady state.</strong> Steady wind through the descent and a steady-state glide: '
      + 'no pushover transient, no shear or thermal structure, and no credit for trading cruise speed for height.')
    + C.pRaw('<strong>H3 · geometry.</strong> Great circles on a sphere whose radius is enclosed by '
      + '[6356.752, 6378.137] km, pole to equator — deliberately crude, deliberately conservative, and six '
      + 'orders of magnitude above the double-precision error of the haversine, so the geodesy needs no separate '
      + 'error argument.')
    + C.pRaw('<strong>H4 · the envelopes are illustrative scenarios, not manufacturer data.</strong> No '
      + 'published performance figure for any aircraft is asserted anywhere here; the packs of §3 are stated '
      + 'classes with stated spans for propeller state, weight and speed-hold error. Altitude carries ±'
      + ALT_PAD_FT + ' ft, forecast wind ±' + (100 * WIND_REL).toFixed(0) + '% on speed and ±'
      + WIND_DIR_PAD + '° on direction. Move any of them and every number moves. The <em>structural</em> '
      + 'finding does not: it holds for any envelope wider than a point.')
    + C.pRaw('<strong>H5 · the turn.</strong> Reaching a field behind you costs the height lost turning '
      + 'onto it: a standard-rate turn from the aircraft’s actual ADS-B ground track, with progress during '
      + 'the turn counted as zero. Conservative, and charged to both instruments equally.')
    + C.note({ lab: 'wording', bodyRaw: C.pRaw('“Certified” on this page always means a '
        + '<em>mathematically certified enclosure</em> — an interval proved to contain the true value. It '
        + 'carries no airworthiness meaning, no design assurance and no approval of any kind. The artifact says '
        + 'NOT FOR NAVIGATION on its face and means it: this is a demonstration of a decision procedure, on a '
        + 'flight that had no emergency and whose crew did nothing of the sort.') })
    + '</div>'
}));

B.push(C.section({
  lab: '§5 · the honest gap', title: 'What would have to be true for this to be in a cockpit',
  bodyRaw: '<div class="col">'
    + C.pRaw('Three things this does not have, named so nobody has to ask. <strong>Terrain.</strong> H1 is the '
      + 'big one; a certified band with a terrain floor is the same arithmetic over a pinned elevation model, '
      + 'and it is the next build rather than a research problem. <strong>Real performance data.</strong> The '
      + 'envelopes are stated, not measured; flight-test data would replace H4 with something narrower and the '
      + 'annulus would shrink accordingly — which is exactly the point, because the width is a measure of '
      + 'what is not known. <strong>Design assurance.</strong> Nothing here is DO-178C evidence, and the distance '
      + 'between an exact enclosure and certifiable software is the real cost in avionics.')
    + C.pRaw('What it does have is the part that is hard to buy: a verdict that cannot be argued with, an '
      + 'annulus that is honest about what is not known, and a published threshold that says what would settle '
      + 'it. And the defect it exhibits is not really about glide rings. “We ran ten thousand sorties and '
      + 'saw no failure” has the same shape: it cannot be refuted by the evidence it rests on. The glide '
      + 'ring is simply the most legible instance of it.')
    + '</div>'
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-glide-band.js @ git ' + git + '. The '
  + 'app’s battery ran as this page’s gate (' + nChecks + ' checks, ' + nReds + ' reds fired), the data '
  + 'pins were re-hashed, and all ' + scen.length + ' states were decided during this build — the build '
  + 'refuses on any deviation. Flight: ' + C.esc(FLIGHT.reg || FLIGHT.icao) + ', adsb.lol ' + FLIGHT.day
  + ', pinned through apps/skyaudit — ADS-B data © adsb.lol, ODbL. Airfields: OurAirports (public '
  + 'domain), sha256 ' + PINS.files['airports.csv'].sha256.slice(0, 12) + '…. Instrument: '
  + 'apps/glide-band/kernel.js.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'glide-band.html'),
  TPL.render({ title: 'Your glide ring is one line', bodyRaw: B.join('\n\n'), footRaw: foot,
    path: '/reports/glide-band.html',
    desc: 'The engine-out glide ring recomputed as a certified enclosure on a real pinned flight: an inner '
      + 'boundary proved reachable, an outer boundary proved not, and the honest annulus between that no shipped '
      + 'product draws.' }));

console.log('reports/glide-band.html written: base ' + pct(pctFalse) + ' unproved / 0 refuted, no-feather '
  + pct(NOFEATHER.pctDam) + ' refuted, reversed ' + pct(REVERSED.pctDam) + ' refuted, ' + relevant.length
  + ' airfields, ' + scen.length + ' states, payload ' + (bytes / 1024).toFixed(0) + ' KB, battery '
  + nChecks + '/' + nReds + ' @ git ' + git);
