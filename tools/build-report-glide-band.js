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

/* ---- the scenario, stated (H4) ------------------------------------------- */
const NOMINAL_LD = 12.0;                       /* the single value a panel would use */
const ENV_LD = [10.2, 12.6];                   /* propeller state, weight, speed-hold */
const NOMINAL_VA_KT = 100, ENV_VA_KT = [92, 108];
const ALT_PAD_FT = 250;                        /* altimetry + pressure setting */
const WIND_REL = 0.25, WIND_DIR_PAD = 15;      /* forecast error on speed and direction */
const WINDS = [
  { name: 'still air', kt: 0, from: 270 },
  { name: '15 kt', kt: 15, from: 270 },
  { name: '35 kt', kt: 35, from: 270 },
  { name: '60 kt', kt: 60, from: 270 }
];
/* The envelope's wind is the TRUE wind; the panel's line is drawn from the
   FORECAST. Mode 1 separates the two by 180 degrees. */
const envFor = (w, mi) => {
  const trueFrom = w.from + (mi === 1 ? 180 : 0);
  return {
    LD: ENV_LD,
    Va: [ENV_VA_KT[0] * KT, ENV_VA_KT[1] * KT],
    Ws: [Math.max(0, w.kt * (1 - WIND_REL)) * KT, (w.kt * (1 + WIND_REL) + 4) * KT],
    Wdir: w.kt === 0 ? [0, 360] : [trueFrom - WIND_DIR_PAD, trueFrom + WIND_DIR_PAD]
  };
};
/* TWO MODES, because the comparison has two honest halves and they say
   different things.
   M0  the forecast is right: the panel's inputs sit INSIDE the envelope.
       Then its line always falls between the two certified boundaries, so
       nothing inside it can ever be refuted. The line cannot be caught being
       wrong — and cannot be shown right either. Structural; gated below.
   M1  the winds-aloft forecast is 180 degrees out. The panel still draws its
       ring from the forecast; the envelope carries the wind that is actually
       there. Not a tuned constant and not a strawman about any product — a
       documented failure of the input every glide ring depends on.        */
const MODES = [
  { key: 'right', label: 'forecast is right' },
  { key: 'reversed', label: 'forecast 180\u00b0 out' }
];
const nomFor = (w) => ({ LD: NOMINAL_LD, Va: NOMINAL_VA_KT * KT, Ws: w.kt * KT, Wdir: w.from });

/* ---- the track window: the cruise, where a glide ring is a live decision -- */
const hi = FLIGHT.track.filter((p) => p.alt >= 17000);
if (hi.length < 40) die('too few cruise points in the pinned trace: ' + hi.length);
const NPT = 36;
const TRACK = [];
for (let i = 0; i < NPT; i++) TRACK.push(hi[Math.round(i * (hi.length - 1) / (NPT - 1))]);

/* ---- the airports in play ------------------------------------------------ */
const REACH_CAP_M = 155000;
const relevant = AP.airports.filter((a) =>
  TRACK.some((p) => K.greatCircle(p.lat, p.lon, a.lat, a.lon).dist[0] < REACH_CAP_M));
relevant.sort((a, b) => a.ident.localeCompare(b.ident));
if (relevant.length < 20) die('only ' + relevant.length + ' airports in play — the corridor extract is wrong');

/* ---- the sweep ----------------------------------------------------------- */
const NB = 72;                                  /* bearings, 5 degrees */
const V = { REACHABLE: 'G', UNDECIDED: 'A', UNREACHABLE: 'R' };
const scen = [];
let heroIdx = 0, heroBest = -1;

for (let ti = 0; ti < TRACK.length; ti++) {
  const p = TRACK[ti];
  for (let wi = 0; wi < WINDS.length; wi++) {
   for (let mi = 0; mi < MODES.length; mi++) {
    const env = envFor(WINDS[wi], mi), nom = nomFor(WINDS[wi]);
    const state = {
      lat: p.lat, lon: p.lon,
      alt_m: [(p.alt - ALT_PAD_FT) * FT, (p.alt + ALT_PAD_FT) * FT],
      alt_nom_m: p.alt * FT
    };
    /* rings, drawn at the mean field elevation so the picture is one shape */
    const refElev = 400 * FT;
    const h = [state.alt_m[0] - refElev, state.alt_m[1] - refElev];
    const rlo = [], rhi = [], rnom = [];
    for (let b = 0; b < NB; b++) {
      const bg = b * 360 / NB;
      const bd = K.band(bg, h, env);
      rlo.push(+(bd.lo / 1000).toFixed(2));
      rhi.push(+(bd.hi / 1000).toFixed(2));
      rnom.push(+(K.nominal(bg, state.alt_nom_m - refElev, nom) / 1000).toFixed(2));
    }
    /* verdicts */
    let vs = '', shown = '', nG = 0, nA = 0, nR = 0, nShown = 0, nFalse = 0, nDamning = 0;
    const rows = [];
    for (const a of relevant) {
      const r = K.decide(state, a, env, nom);
      vs += V[r.verdict];
      shown += r.shown ? 'Y' : 'n';
      if (r.verdict === K.REACHABLE) nG++; else if (r.verdict === K.UNDECIDED) nA++; else nR++;
      if (r.shown) {
        nShown++;
        if (r.verdict !== K.REACHABLE) {
          nFalse++;
          if (r.verdict === K.UNREACHABLE) nDamning++;
          rows.push({ a, r, gap: r.nom - r.lo });
        }
      }
    }
    rows.sort((x, y) => (y.r.verdict === K.UNREACHABLE ? 1e9 : 0) + y.gap - ((x.r.verdict === K.UNREACHABLE ? 1e9 : 0) + x.gap));
    const top = rows.slice(0, 10).map(({ a, r }) => {
      const need = K.requiredLD(state, a, env);
      return [a.ident, a.name.length > 34 ? a.name.slice(0, 33) + '\u2026' : a.name,
        +(r.D[0] / 1000).toFixed(1), +(r.lo / 1000).toFixed(1), +(r.hi / 1000).toFixed(1),
        +(r.nom / 1000).toFixed(1), r.verdict === K.UNREACHABLE ? 1 : 0,
        need === null ? 0 : +need.toFixed(1)];
    });
    scen.push({ t: ti, w: wi, m: mi, lat: p.lat, lon: p.lon, alt: p.alt,
                rlo, rhi, rnom, vs, shown,
                c: [nG, nA, nR, nShown, nFalse, nDamning], top });
    if (wi === 2 && mi === 0 && nFalse > heroBest) { heroBest = nFalse; heroIdx = scen.length - 1; }
   }
  }
}

/* THE STRUCTURAL GATE. In mode 0 the panel's inputs lie inside the envelope,
   so nominal <= d_hi at every bearing and a field inside the line can never
   be refuted. If that ever fails, the page's central sentence is false and
   the build must refuse rather than print it. */
const m0damning = scen.filter((s) => s.m === 0).reduce((a, s) => a + s.c[5], 0);
if (m0damning !== 0) die('mode 0 produced ' + m0damning + ' refutations inside the nominal ring — the page claims '
  + 'this is impossible when the panel\'s inputs sit inside the envelope, and it must not claim it when false');

const HERO = scen[heroIdx];
const heroCounts = HERO.c;
if (heroCounts[4] === 0) die('the comparison found no site the nominal ring shows but the band does not prove — '
  + 'the page has no finding and must not be written');

/* aggregate across the whole sweep at the moderate-wind preset, per mode */
const agg = (mi) => {
  const ss = scen.filter((s) => s.w === 2 && s.m === mi);
  const shown = ss.reduce((a, s) => a + s.c[3], 0);
  const bad = ss.reduce((a, s) => a + s.c[4], 0);
  const dam = ss.reduce((a, s) => a + s.c[5], 0);
  return { ss, shown, bad, dam, pct: 100 * bad / Math.max(1, shown), pctDam: 100 * dam / Math.max(1, shown) };
};
const A0 = agg(0), A1 = agg(1);
const modScen = A0.ss;
const totShown = A0.shown, totFalse = A0.bad, totDamning = A1.dam;
const pctFalse = A0.pct;

/* the single worst row anywhere in the sweep: shown by the line, proved out */
let worst = null;
for (const s of scen.filter((x) => x.m === 1)) for (const r of s.top) {
  if (r[6] === 1 && (!worst || (r[2] - r[4]) > (worst.row[2] - worst.row[4]))) worst = { row: r, s };
}

const bytes = JSON.stringify(scen).length;

/* ======================================================================== */
const B = [];
const pct = (x) => x.toFixed(0) + '%';

B.push(C.header({
  eyebrow: 'cert-machine · report · every number recomputed at build',
  title: 'The glide ring is unfalsifiable. That is the problem with it.',
  deck: 'When the engine quits, the panel draws one ring and calls it your reach \u2014 one glide ratio, one '
    + 'forecast wind, one weight, rendered as a promise. Recomputed as an enclosure over those same inputs\u2019 '
    + 'uncertainty, on a real pinned flight: ' + pct(pctFalse) + ' of the airfields inside that line cannot be '
    + 'proved reachable. None of them can be proved unreachable either, and that is not a coincidence \u2014 '
    + 'while the line\u2019s assumptions sit inside the envelope, it is incapable of being wrong.'
}));

B.push(C.tldr({
  findingRaw: '<strong>' + pct(pctFalse) + ' of the sites inside the single-line ring are not proved reachable \u2014 '
    + 'and zero are proved unreachable.</strong> Across ' + modScen.length + ' cruise states of a pinned '
    + C.esc(FLIGHT.type) + ' flight at the 35 kt preset, the line shows ' + totShown + ' site-states as within '
    + 'reach; the certified band proves ' + (totShown - totFalse) + ' and leaves ' + totFalse + ' undecided. The '
    + 'zero is structural and the build asserts it: while the line\u2019s inputs lie inside the envelope, nothing '
    + 'inside it can be refuted, so the line can never be caught being wrong. Reverse the winds-aloft '
    + 'forecast \u2014 a documented failure of the one input it leans on hardest \u2014 and ' + A1.dam
    + ' site-states inside that same line become provably out of reach.',
  mechanismRaw: 'Outward-rounded interval arithmetic over the glide model, with the box subdivided '
    + K.NVA + '\u00d7' + K.NWD + ' so the answer is not charged for a dependency the physics does not have. '
    + 'Both outer verdicts are conservative: a wider enclosure can only move a site INTO undecided, never into a '
    + 'wrong answer.',
  checkRaw: C.m('node apps/glide-band/battery.js') + ' — ' + nChecks + ' checks including a 4000-draw containment '
    + 'test, and ' + nReds + ' red controls that must fire, among them the point-estimate method itself.'
}));

B.push(C.stats([
  { k: 'shown by the line, not proved', v: pct(pctFalse), role: 'held',
    n: totFalse + ' of ' + totShown + ' site-states across ' + modScen.length + ' cruise positions at the 35 kt preset' },
  { k: 'shown by the line, refutable', v: '0', role: 'held',
    n: 'structural, and gated at build: while the line\u2019s inputs sit inside the envelope it cannot be proved '
       + 'wrong about anything \u2014 unfalsifiable, not correct' },
  { k: 'with the forecast 180\u00b0 out', v: pct(A1.pctDam), role: 'held',
    n: A1.dam + ' of ' + A1.shown + ' site-states inside the line become PROVABLY unreachable when the'
       + ' winds-aloft forecast is reversed \u2014 the line keeps drawing, and it is now refutable and refuted' },

  { k: 'the flight', v: C.esc(FLIGHT.reg || FLIGHT.icao), sm: true,
    n: C.esc(FLIGHT.desc || FLIGHT.type) + ', single-engine turboprop, ' + FLIGHT.day
       + ' — adsb.lol, pinned through apps/skyaudit' },
  { k: 'airfields in play', v: String(relevant.length), sm: true,
    n: 'OurAirports, public domain, sha256-pinned; heliports, seaplane bases and closed fields excluded' },
  { k: 'states swept', v: String(scen.length), sm: true,
    n: TRACK.length + ' cruise positions \u00d7 ' + WINDS.length + ' wind presets, each fully decided at build' },
  { k: 'battery', v: nChecks + ' checks', role: 'held', n: nReds + ' red controls fired during this build' }
]));

/* ---------------- the dashboard ------------------------------------------- */
const DATA = {
  scen, airports: relevant.map((a) => [a.ident, a.name, a.lat, a.lon, a.elev_ft, a.type]),
  winds: WINDS.map((w) => w.name), nb: NB, hero: heroIdx,
  track: FLIGHT.track.filter((p) => p.alt >= 10000).map((p) => [+p.lat.toFixed(4), +p.lon.toFixed(4)])
};

const DASH = `
<div class="gb-wrap">
  <div class="gb-controls">
    <label class="gb-ctl"><span>Position along the cruise</span>
      <input id="gb-t" type="range" min="0" max="${TRACK.length - 1}" value="${HERO.t}" step="1">
      <output id="gb-tout"></output></label>
    <div class="gb-ctl"><span>Forecast wind (from 270\u00b0)</span>
      <div id="gb-w" class="gb-seg">${WINDS.map((w, i) =>
        `<button data-w="${i}"${i === HERO.w ? ' class="on"' : ''}>${C.esc(w.name)}</button>`).join('')}</div></div>
    <div class="gb-ctl"><span>What the panel assumes</span>
      <div id="gb-m" class="gb-seg">${MODES.map((m, i) =>
        `<button data-m="${i}"${i === HERO.m ? ' class="on"' : ''}>${C.esc(m.label)}</button>`).join('')}</div></div>
  </div>
  <div class="gb-stage">
    <svg id="gb-svg" viewBox="0 0 900 620" role="img" aria-label="Certified glide band around a pinned flight"></svg>
    <div class="gb-nav">NOT FOR NAVIGATION \u00b7 stated scenario, not manufacturer data</div>
  </div>
  <div class="gb-key">
    <span><i class="k-g"></i>PROVED REACHABLE <em>(if the path is unobstructed \u2014 H1)</em></span>
    <span><i class="k-a"></i>UNDECIDED <em>the envelope does not settle it</em></span>
    <span><i class="k-r"></i>REFUTED <em>unreachable for every value in the envelope</em></span>
    <span><i class="k-n"></i>the single line a panel draws</span>
  </div>
  <div id="gb-counts" class="gb-counts"></div>
  <div class="gb-tablewrap"><table class="gb-table"><thead><tr>
    <th>ident</th><th>airfield</th><th class="n">distance</th><th class="n">proved band</th>
    <th class="n">the line says</th><th>verdict</th><th class="n">needs L/D \u2265</th>
  </tr></thead><tbody id="gb-rows"></tbody></table></div>
  <p class="gb-cap" id="gb-cap"></p>
</div>
<script>
(function(){
var D = ${JSON.stringify(DATA)};
var svg = document.getElementById('gb-svg');
var NS='http://www.w3.org/2000/svg';
var ti=${HERO.t}, wi=${HERO.w}, mi=${HERO.m};
function scenOf(t,w,m){ for(var i=0;i<D.scen.length;i++){ var x=D.scen[i]; if(x.t===t&&x.w===w&&x.m===m) return x; } return D.scen[0]; }
function el(n,at){ var e=document.createElementNS(NS,n); for(var k in at) e.setAttribute(k,at[k]); return e; }

function draw(){
  var s=scenOf(ti,wi,mi);
  var W=900,H=620,cx=W*0.5,cy=H*0.5;
  var maxR=0; for(var i=0;i<s.rhi.length;i++) if(s.rhi[i]>maxR) maxR=s.rhi[i];
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

  var annulus=el('path',{d:ring(s.rhi)+' '+ring(s.rlo),'fill-rule':'evenodd',fill:'url(#gbHatch)'});
  svg.appendChild(annulus);
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
    /* a field far outside the outer boundary is decided and uninteresting;
       keep it for density but drop it back so the annulus reads first */
    var dx=p[0]-cx, dy=p[1]-cy, rr=Math.sqrt(dx*dx+dy*dy)/sc;
    var far=(!shown && v==='R' && rr>maxR*1.06);
    svg.appendChild(el('circle',{cx:p[0].toFixed(1),cy:p[1].toFixed(1),r:big?4.6:(far?1.7:2.6),
      fill:v==='G'?col:'var(--gb-paper)',stroke:col,'stroke-width':big?2:1.3,
      opacity:far?'0.28':'1'}));
    if(big&&v==='R'){
      svg.appendChild(el('path',{d:'M'+(p[0]-3.2)+' '+(p[1]-3.2)+'L'+(p[0]+3.2)+' '+(p[1]+3.2)+
        'M'+(p[0]+3.2)+' '+(p[1]-3.2)+'L'+(p[0]-3.2)+' '+(p[1]+3.2),stroke:'var(--gb-r)','stroke-width':'1.8'}));
    }
  }
  var ac=P(s.lat,s.lon);
  svg.appendChild(el('circle',{cx:ac[0],cy:ac[1],r:6,fill:'var(--gb-ink)'}));
  svg.appendChild(el('circle',{cx:ac[0],cy:ac[1],r:11,fill:'none',stroke:'var(--gb-ink)','stroke-width':'1.4','opacity':'.5'}));

  var barKm=Math.max(10,Math.round(span/4/10)*10);
  var bx=64, by=H-40;
  svg.appendChild(el('line',{x1:bx,y1:by,x2:bx+barKm*sc,y2:by,stroke:'var(--gb-ink)','stroke-width':'2'}));
  var tx=el('text',{x:bx,y:by-9,'font-size':'13',fill:'var(--gb-ink)'}); tx.textContent=barKm+' km';
  svg.appendChild(tx);

  document.getElementById('gb-tout').textContent = Math.round(s.alt).toLocaleString()+' ft \\u00b7 '+
    s.lat.toFixed(3)+', '+s.lon.toFixed(3);
  var c=s.c;
  document.getElementById('gb-counts').innerHTML =
    '<b>'+c[3]+'</b> airfields inside the single line &nbsp;\\u2192&nbsp; <span class="g"><b>'+(c[3]-c[4])+
    '</b> proved</span>, <span class="a"><b>'+(c[4]-c[5])+'</b> undecided</span>, <span class="r"><b>'+c[5]+
    '</b> refuted</span> &nbsp;\\u00b7&nbsp; band '+s.rlo[0].toFixed(0)+'\\u2013'+s.rhi[0].toFixed(0)+
    ' km north, line at '+s.rnom[0].toFixed(0)+' km';

  var tb=document.getElementById('gb-rows'); tb.innerHTML='';
  if(!s.top.length){ tb.innerHTML='<tr><td colspan="7">Nothing inside the line is left unproved at this state.</td></tr>'; }
  for(var r=0;r<s.top.length;r++){ var t=s.top[r];
    var tr=document.createElement('tr');
    tr.innerHTML='<td class="mono">'+t[0]+'</td><td>'+t[1]+'</td><td class="n mono">'+t[2].toFixed(1)+' km</td>'+
      '<td class="n mono">'+t[3].toFixed(0)+'\\u2013'+t[4].toFixed(0)+' km</td>'+
      '<td class="n mono">'+t[5].toFixed(0)+' km</td>'+
      '<td>'+(t[6]?'<span class="v-r">REFUTED</span>':'<span class="v-a">UNDECIDED</span>')+'</td>'+
      '<td class="n mono">'+(t[7]?t[7].toFixed(1):'\\u2014')+'</td>';
    tb.appendChild(tr);
  }
  document.getElementById('gb-cap').textContent =
    'Airfields the single line places inside your reach that the certified band does not prove, worst first. '+
    '"Needs L/D \\u2265" is the glide ratio you would have to KNOW you have for the field to turn green with '+
    'everything else unchanged \\u2014 the disclosure this verdict is asking for.';
}
document.getElementById('gb-t').addEventListener('input',function(e){ ti=+e.target.value; draw(); });
var segs=document.getElementById('gb-w').querySelectorAll('button');
for(var i=0;i<segs.length;i++) segs[i].addEventListener('click',function(e){
  wi=+e.target.getAttribute('data-w');
  for(var j=0;j<segs.length;j++) segs[j].className = (+segs[j].getAttribute('data-w')===wi)?'on':'';
  draw();
});
var msegs=document.getElementById('gb-m').querySelectorAll('button');
for(var i=0;i<msegs.length;i++) msegs[i].addEventListener('click',function(e){
  mi=+e.target.getAttribute('data-m');
  for(var j=0;j<msegs.length;j++) msegs[j].className = (+msegs[j].getAttribute('data-m')===mi)?'on':'';
  draw();
});
draw();
})();
</script>
<style>
.gb-wrap{--gb-g:#2C6142;--gb-g-soft:#DEEBE3;--gb-a:#8A5212;--gb-a-soft:#F6E9D8;--gb-r:#8E2B2B;
  --gb-n:#9A4E86;--gb-track:#544C5B;--gb-ink:#16121A;--gb-paper:#FBFAFB;margin:0 0 1rem;}
.gb-controls{display:flex;gap:1.6rem;flex-wrap:wrap;align-items:flex-end;margin:0 0 .9rem;}
.gb-ctl{display:flex;flex-direction:column;gap:.35rem;font-size:.82rem;}
.gb-ctl>span{text-transform:uppercase;letter-spacing:.06em;font-size:.7rem;opacity:.7;}
.gb-ctl input[type=range]{width:min(360px,64vw);}
.gb-ctl output{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.8rem;}
.gb-seg{display:flex;border:1px solid var(--gb-track);border-radius:3px;overflow:hidden;}
.gb-seg button{border:0;background:transparent;padding:.4rem .7rem;font:inherit;font-size:.8rem;cursor:pointer;
  border-right:1px solid var(--gb-track);}
.gb-seg button:last-child{border-right:0;}
.gb-seg button.on{background:var(--gb-ink);color:var(--gb-paper);}
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
@media(prefers-color-scheme:dark){.gb-wrap{--gb-ink:#EDEBEE;--gb-paper:#1A161E;--gb-track:#908995;--gb-g-soft:#1E3529;--gb-a-soft:#3A2E1C;}}
</style>`;

B.push(C.section({
  lab: '\u00a71 \u00b7 the instrument', wide: true,
  title: 'One flight, ' + relevant.length + ' airfields, three verdicts',
  bodyRaw: '<div class="col">'
    + C.pRaw('Scrub the slider to fly the cruise. The dashed line is what a panel draws from point estimates. '
      + 'The filled boundary is the certified inner ring \u2014 every airfield inside it is reachable for '
      + '<em>every</em> value in the stated envelope. The outer boundary is refutation: beyond it, no value in '
      + 'the envelope reaches. The hatched annulus between them is the part nobody currently shows you, and it '
      + 'is where the dashed line spends most of its length.')
    + '</div>' + DASH
}));

/* ---------------- the comparison ------------------------------------------ */
const w = worst;
B.push(C.section({
  lab: '\u00a72 \u00b7 the comparison', title: 'What the single line hides',
  bodyRaw: '<div class="col">'
    + C.pRaw('The comparison is not "their number versus our number" \u2014 both come from the same physics and '
      + 'the same flight. It is a comparison of <em>methods</em>: one input value each, versus the range each '
      + 'input actually has. Nothing here asserts what any particular product computes internally; what is '
      + 'compared is the point-estimate method, which is what every shipped glide ring draws.')
    + C.pRaw('<strong>The first half of the comparison is the uncomfortable one, and it is about logic rather '
      + 'than arithmetic.</strong> While the panel\u2019s assumed glide ratio, airspeed and wind sit anywhere '
      + 'inside the honest envelope, its line always falls between the two certified boundaries \u2014 the build '
      + 'asserts this and refuses if it ever fails. So no airfield inside that line can be proved unreachable. '
      + 'The line is never caught being wrong, and it is never shown to be right either: ' + pct(pctFalse)
      + ' of what it claims is simply undecided by the evidence it was drawn from. An instrument that cannot '
      + 'fail a test is not passing one.')
    + C.pRaw('<strong>The second half is what happens when one input is not merely uncertain but wrong.</strong> '
      + 'Winds aloft is a forecast, and forecasts are sometimes reversed. Leave the panel drawing its ring from '
      + 'the forecast and let the envelope carry the wind that is actually there, 180\u00b0 the other way: the '
      + 'line now reaches far past the outer boundary on what it believes is the downwind side. ' + A1.dam
      + ' of the ' + A1.shown + ' site-states it shows as reachable, ' + pct(A1.pctDam) + ', are provably '
      + 'unreachable for every value in the envelope. Toggle \u201cforecast 180\u00b0 out\u201d above and watch '
      + 'the crosses appear. Note what changed: the line did not become less accurate, it became FALSIFIABLE '
      + '\u2014 and was falsified. That is the whole difference between the two instruments.')
    + (w ? C.pRaw('<strong>The sharpest single row in the sweep.</strong> At ' + Math.round(w.s.alt).toLocaleString()
        + ' ft with the ' + C.esc(DATA.winds[w.s.w]) + ' preset, <span class="m">' + C.esc(w.row[0]) + '</span> \u2014 '
        + C.esc(w.row[1]) + ' \u2014 lies ' + w.row[2].toFixed(1) + ' km away. The single line puts your reach at '
        + w.row[5].toFixed(0) + ' km, so it draws that field comfortably inside. The certified band is '
        + w.row[3].toFixed(0) + '\u2013' + w.row[4].toFixed(0) + ' km: the field is beyond the outer boundary, so it '
        + 'is unreachable for <em>every</em> value in the envelope. Not uncertain \u2014 refuted.') : '')
    + C.pRaw('Aggregated over the ' + modScen.length + ' cruise states at the 35 kt preset with the panel\u2019s '
      + 'assumptions inside the envelope: the line shows ' + totShown + ' site-states inside your reach, the band '
      + 'proves ' + (totShown - totFalse) + ' and leaves ' + totFalse + ' undecided. Under the reversed-forecast '
      + 'scenario the same sweep turns ' + A1.dam + ' of them from undecided into refuted.')
    + C.pRaw('<strong>The undecided annulus is the product, not a defect.</strong> A wider band is not a worse '
      + 'answer; it is the same answer with its width shown. And every undecided row carries the disclosure that '
      + 'would settle it \u2014 the last column of the table is the glide ratio you would have to know you have. '
      + 'That turns a verdict into a request, which is the only part of this a pilot can act on in the air.')
    + '</div>'
}));

/* ---------------- the grammar and the hypotheses -------------------------- */
B.push(C.section({
  lab: '\u00a73 \u00b7 what is and is not claimed', title: 'Four hypotheses, stated rather than buried',
  bodyRaw: '<div class="col">'
    + C.pRaw('<strong>H1 \u00b7 terrain is not modelled.</strong> The band is glide distance over ground at the '
      + 'field\u2019s own elevation. Rising ground between here and there can only REMOVE reach, so the asymmetry '
      + 'is load-bearing and runs the safe way: <em>REFUTED is unaffected by H1 and stays proved; PROVED '
      + 'REACHABLE carries H1 and means "reachable if the path is unobstructed".</em> A terrain layer would move '
      + 'green fields to undecided and never the reverse.')
    + C.pRaw('<strong>H2 \u00b7 steady state.</strong> Steady wind through the descent, steady-state glide, no '
      + 'pushover transient, no shear or thermal structure.')
    + C.pRaw('<strong>H3 \u00b7 geometry.</strong> Great circles on a sphere whose radius is enclosed by '
      + '[6356.752, 6378.137] km, pole to equator. Deliberately crude, deliberately conservative, and six orders '
      + 'of magnitude above the double-precision error of the haversine \u2014 so the geodesy needs no separate '
      + 'error argument.')
    + C.pRaw('<strong>H4 \u00b7 the envelope is a stated scenario, not manufacturer data.</strong> No published '
      + 'performance figure for any aircraft is asserted anywhere here. The nominal glide ratio is '
      + NOMINAL_LD.toFixed(1) + ' against an envelope of [' + ENV_LD[0] + ', ' + ENV_LD[1] + '] for propeller '
      + 'state, weight and speed-hold error; best-glide airspeed ' + NOMINAL_VA_KT + ' kt against ['
      + ENV_VA_KT[0] + ', ' + ENV_VA_KT[1] + ']; altitude \u00b1' + ALT_PAD_FT + ' ft; forecast wind \u00b1'
      + (100 * WIND_REL).toFixed(0) + '% on speed and \u00b1' + WIND_DIR_PAD + '\u00b0 on direction. Move any of '
      + 'them and every number on this page moves with it. The finding is about the <em>method</em>, and it '
      + 'survives any envelope wider than a point.')
    + C.note({ lab: 'wording', bodyRaw: C.pRaw('\u201cCertified\u201d on this page always means a '
        + '<em>mathematically certified enclosure</em> \u2014 an interval proved to contain the true value. It '
        + 'carries no airworthiness meaning, no design assurance and no approval of any kind. The artifact says '
        + 'NOT FOR NAVIGATION on its face, and it means it: this is a demonstration of a decision procedure, on '
        + 'a flight that had no emergency.') })
    + '</div>'
}));

/* ---------------- what it would take -------------------------------------- */
B.push(C.section({
  lab: '\u00a74 \u00b7 the honest gap', title: 'What would have to be true for this to be in a cockpit',
  bodyRaw: '<div class="col">'
    + C.pRaw('Three things this does not have, named so nobody has to ask. <strong>Terrain.</strong> H1 is the '
      + 'big one; a certified band with a terrain floor is the same arithmetic over a pinned DEM, and it is the '
      + 'next build rather than a research problem. <strong>Real performance data.</strong> The envelope here is '
      + 'stated, not measured; a manufacturer\u2019s flight-test data would replace H4 with something narrower and '
      + 'the annulus would shrink accordingly \u2014 which is exactly the point, because the width is a measure '
      + 'of what is not known. <strong>Design assurance.</strong> Nothing here is DO-178C evidence, and the '
      + 'distance between an exact enclosure and certifiable software is the real cost in avionics.')
    + C.pRaw('What it does have is the part that is hard to buy: a verdict that cannot be argued with, an '
      + 'annulus that is honest about what is not known, and a published threshold that says what would settle '
      + 'it. The same arithmetic is what an exactly certified overbound for ARAIM protection levels would need '
      + '\u2014 a proof that a nominal error distribution bounds the real one, in rational arithmetic rather than '
      + 'with margins and floating point. That is where the expensive line item is.')
    + '</div>'
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-glide-band.js @ git ' + git + '. The app\u2019s '
  + 'battery ran as this page\u2019s gate (' + nChecks + ' checks, ' + nReds + ' reds fired), the data pins were '
  + 're-hashed, and all ' + scen.length + ' states were decided during this build \u2014 the build refuses on any '
  + 'deviation. Flight: ' + C.esc(FLIGHT.reg || FLIGHT.icao) + ', adsb.lol ' + FLIGHT.day + ', pinned through '
  + 'apps/skyaudit \u2014 ADS-B data \u00a9 adsb.lol, ODbL. Airfields: OurAirports (public domain), sha256 '
  + PINS.files['airports.csv'].sha256.slice(0, 12)
  + '\u2026. Instrument: apps/glide-band/kernel.js.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'glide-band.html'),
  TPL.render({ title: 'Your glide ring is one line', bodyRaw: B.join('\n\n'), footRaw: foot,
    path: '/reports/glide-band.html',
    desc: 'The engine-out glide ring recomputed as a certified enclosure on a real pinned flight: an inner '
      + 'boundary proved reachable, an outer boundary proved not, and the honest annulus between that no shipped '
      + 'product draws.' }));

console.log('reports/glide-band.html written: ' + pct(pctFalse) + ' of shown sites unproved, ' + totDamning
  + ' refuted, ' + relevant.length + ' airfields, ' + scen.length + ' states, payload '
  + (bytes / 1024).toFixed(0) + ' KB, battery ' + nChecks + '/' + nReds + ' @ git ' + git);
