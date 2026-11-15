#!/usr/bin/env node
/* build.js — site/atalaia/index.html: Atalaia, a proposed protocol (doutrina) for flying military drones when the GPS
   cannot be trusted, with a mission simulated in Blumenau (SC). Unlisted (noindex, in no index or sitemap) on the
   operator's word of 2026-11-15 ("páginas live não listadas", hosted here, the battalion not named until it agrees).
   Written in Portuguese: the operator ruled "Pt-BR for this project" (2026-11-14), after the site-wide English rule of
   2026-10-30, for this audience.

   EVERY MISSION NUMBER IS READ HERE from apps/atalaia/data/ (central.json, missao.json), written by the Atalaia
   generators (private, ~/Projects/atalaia/ferramentas, scenario cenarios/blumenau.json) over the Copernicus GLO-90
   relief and the DJI FlyCart 30 spec sheet; PROVENANCE.json pins every input and every record by sha256, and this
   build refuses a record whose bytes no longer match it. The test results in §5 are the LOCUS and Veto records
   (frontier-apps), each named with its stage.

   usage: node apps/atalaia/build.js                                                                                MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OUT = path.join(ROOT, 'site', 'atalaia');
const DATA = path.join(__dirname, 'data');
const die = (m) => { console.error('ATALAIA PAGE REFUSED: ' + m); process.exit(1); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

/* ---- the records, checked against their pins */
const PROV = JSON.parse(fs.readFileSync(path.join(DATA, 'PROVENANCE.json'), 'utf8'));
for (const [f, h] of Object.entries(PROV.registros)) if (sha(path.join(DATA, f)) !== h) die(f + ' does not match its pin in PROVENANCE.json');
const CJ = JSON.parse(fs.readFileSync(path.join(DATA, 'central.json'), 'utf8'));
const MJ = JSON.parse(fs.readFileSync(path.join(DATA, 'missao.json'), 'utf8'));
const AV = CJ.avancado, DI = CJ.direto, AL = CJ.alcance, SI = CJ.sintetico, FR = CJ.frota, KG = CJ.carga_padrao_kg;
const R12 = AV.rows[KG], R30 = AV.rows[30], RS = DI.rows[KG];
if (R12.verdict !== 'PASSA') die('the mission load no longer passes: ' + R12.verdict);
if (R30.verdict !== 'FALTA DADO') die('30 kg is no longer FALTA DADO: ' + R30.verdict);
if (RS.verdict !== 'NAO PASSA') die('the serra no longer refuses: ' + RS.verdict);
if (MJ.posto.laudo.verdict !== 'PASSA') die('the route laudo to the post no longer passes');
const V = SI.voos;
const pa = V.filter((v) => v[2] === 'P'), fa = V.filter((v) => v[2] === 'F'), na = V.filter((v) => v[2] === 'N');
const paBad = pa.filter((v) => !v[3]).length, paMiss = pa.filter((v) => v[4]).length, faOk = fa.filter((v) => v[3]).length;
const naOk = na.filter((v) => v[3]).length;
const CAP = FR.capacidade.quente, RC = FR.recarga_par_min['15-45C'];
const zPost = Math.round(MJ.profile.reduce((b, p) => Math.abs(p[0] - AV.post_km) < Math.abs(b[0] - AV.post_km) ? p : b)[1]);
const zSerra = Math.round(MJ.profile[MJ.profile.length - 1][1]);
const zBase = Math.round(MJ.profile[0][1]);

/* pt-BR numbers */
const n = (x, d = 0) => Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = C.esc;
const st = (s) => '<span class="at-st">' + esc(s) + '</span>';
const vword = { 'PASSA': ['✓ PASSA', 'held'], 'NAO PASSA': ['× NÃO PASSA', 'dep'], 'FALTA DADO': ['∅ FALTA DADO', 'open'] };
const vt = (v) => C.tag(vword[v][0], vword[v][1]);

/* ---------------------------------------------------------------- figures */
const RW = 1300, RH = 937;                       /* the relief raster, the map frame of missao.json */
const MP = MJ.map;
const P = (k) => [MP.pts[k][0] * RW, MP.pts[k][1] * RH];
const kmPerU = MP.km_per_w / RW;                  /* km per viewBox unit */
const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const lbl = (x, y, t, cls, anchor) => '<text class="' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(t) + '</text>';
/* a label drawn k times larger without a second type rule: the group scales, the stylesheet keeps one size per class */
const lblk = (k, x, y, t, cls, anchor) => k === 1 ? lbl(x, y, t, cls, anchor)
  : '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + k + ')">' + lbl(0, 0, t, cls, anchor) + '</g>';

function mapa(narrow) {
  const B = P('base'), Q = P('posto'), S = P('serra');
  const k = narrow ? 1.45 : 1;                    /* marks and type grow on the phone drawing, which shows less ground */
  const marks = [[0.35, '3'], [0.62, '4'], [0.9, '5']].map(([t, m]) => {
    const [x, y] = along(B, Q, t);
    return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (13 * k).toFixed(1) + '" class="at-mk"/>' + lblk(k, x, y + 5 * k, m, 'at-mkt', 'middle');
  }).join('');
  const vb = narrow ? [Math.min(B[0], S[0]) - 90, Math.min(B[1], S[1]) - 90, 0, 0] : [0, 0, RW, RH];
  if (narrow) { vb[2] = Math.max(B[0], Q[0]) + 380 - vb[0]; vb[3] = Math.max(B[1], S[1]) + 120 - vb[1]; }
  const bar = 2 / kmPerU, bx = vb[0] + 30, by = vb[1] + vb[3] - 30;
  return '<svg class="at-svg' + (narrow ? ' at-n' : '') + '" viewBox="' + vb.map((v) => v.toFixed(1)).join(' ') + '" role="img" aria-label="Mapa de relevo do Vale do Itajaí: a rota do drone de Blumenau ao posto avançado, a 5 km, e a linha tracejada até a serra, a 15 km">'
    + '<rect width="' + RW + '" height="' + RH + '" class="at-ground"/>'
    + '<image href="relevo.webp" width="' + RW + '" height="' + RH + '" preserveAspectRatio="none"/>'
    + '<line x1="' + Q[0] + '" y1="' + Q[1] + '" x2="' + S[0] + '" y2="' + S[1] + '" class="at-beyond"/>'
    + '<line x1="' + B[0] + '" y1="' + B[1] + '" x2="' + Q[0] + '" y2="' + Q[1] + '" class="at-halo"/>'
    + '<line x1="' + B[0] + '" y1="' + B[1] + '" x2="' + Q[0] + '" y2="' + Q[1] + '" class="at-route"/>'
    + marks
    + '<circle cx="' + B[0] + '" cy="' + B[1] + '" r="' + (11 * k).toFixed(1) + '" class="at-base"/>'
    + '<circle cx="' + Q[0] + '" cy="' + Q[1] + '" r="' + (12 * k).toFixed(1) + '" class="at-post"/>'
    + '<circle cx="' + S[0] + '" cy="' + S[1] + '" r="' + (8 * k).toFixed(1) + '" class="at-serra"/>'
    + lblk(k, B[0] + 22 * k, B[1] + 8 * k, 'Base · Blumenau', 'at-lb') + lblk(k, B[0] + 22 * k, B[1] + 36 * k, zBase + ' m', 'at-lbs')
    + lblk(k, Q[0] + 24 * k, Q[1] + 8 * k, narrow ? 'Posto avançado' : 'Posto avançado · ' + n(AV.post_km) + ' km', 'at-lb') + lblk(k, Q[0] + 24 * k, Q[1] + 36 * k, (narrow ? n(AV.post_km) + ' km · ' : '') + zPost + ' m', 'at-lbs')
    + lblk(k, S[0] + 18 * k, S[1] + 8 * k, narrow ? 'Serra · 15 km' : 'Serra · 15 km, fora do alcance', 'at-lbd') + lblk(k, S[0] + 18 * k, S[1] + 36 * k, zSerra + ' m', 'at-lbs')
    + '<line x1="' + bx.toFixed(1) + '" y1="' + by.toFixed(1) + '" x2="' + (bx + bar).toFixed(1) + '" y2="' + by.toFixed(1) + '" class="at-scale"/>' + lblk(k, bx, by - 16 * k, '2 km', 'at-lbs')
    + '</svg>';
}
/* a figure that draws differently on a phone: both drawings ship, the stylesheet shows one (no script, no layout shift) */
const twin = (wide, narrow) => '<div class="at-w">' + wide + '</div><div class="at-nw">' + narrow + '</div>';

function energia(narrow) {
  const rows = [
    ['Posto avançado, ' + KG + ' kg', R12], ['Posto avançado, 30 kg', R30], ['Serra a 15 km, ' + KG + ' kg', RS]];
  const A = Math.max(...rows.map(([, r]) => Math.max(Math.abs(r.margin_wh[0]), Math.abs(r.margin_wh[1])))) * 1.06;
  const cls = (v) => 'at-band ' + (v === 'PASSA' ? 'go' : v === 'FALTA DADO' ? 'na' : 'no');
  const aria = ' role="img" aria-label="Margem de energia, do pior ao melhor caso: o posto avançado com ' + KG + ' kg fica inteiro à direita do zero; com 30 kg cruza o zero; a serra fica inteira à esquerda">';
  const head = (x0, x1, mid) => lbl(mid, 16, '0', 'at-ax', 'middle') + lbl(x0, 16, '− ' + n(Math.round(A / 100) * 100), 'at-ax') + lbl(x1, 16, '+ ' + n(Math.round(A / 100) * 100) + ' Wh', 'at-ax', 'end');
  if (narrow) {
    const W = 420, x0 = 10, x1 = 410, mid = (x0 + x1) / 2, sx = (v) => mid + (v / A) * (x1 - x0) / 2, H = 34 + rows.length * 96;
    let g = '<line x1="' + mid + '" y1="24" x2="' + mid + '" y2="' + (H - 8) + '" class="at-zero"/>' + head(x0, x1, mid);
    rows.forEach(([name, r], i) => {
      const y = 50 + i * 96, [w, b] = r.margin_wh, a = Math.min(sx(w), sx(b)), z = Math.max(sx(w), sx(b));
      g += lbl(x0, y, name, 'at-rowl') + lbl(x1, y, vword[r.verdict][0], 'at-roww', 'end')
        + '<rect x="' + a.toFixed(1) + '" y="' + (y + 14) + '" width="' + Math.max(3, z - a).toFixed(1) + '" height="20" class="' + cls(r.verdict) + '"/>'
        + lbl(Math.max(x0, a), y + 56, n(w), 'at-ax', a - x0 < 30 ? 'start' : 'middle') + lbl(Math.min(x1, z), y + 56, (b > 0 ? '+' : '') + n(b), 'at-ax', x1 - z < 30 ? 'end' : 'middle');
    });
    return '<svg class="at-svg at-n" viewBox="0 0 ' + W + ' ' + H + '"' + aria + g + '</svg>';
  }
  const W = 900, x0 = 300, x1 = 880, mid = (x0 + x1) / 2, sx = (v) => mid + (v / A) * (x1 - x0) / 2;
  const H = 52 + rows.length * 58;
  let g = '<line x1="' + mid + '" y1="22" x2="' + mid + '" y2="' + (H - 18) + '" class="at-zero"/>' + head(x0, x1, mid);
  rows.forEach(([name, r], i) => {
    const y = 48 + i * 58, [w, b] = r.margin_wh;
    const a = Math.min(sx(w), sx(b)), z = Math.max(sx(w), sx(b));
    g += lbl(0, y + 6, name, 'at-rowl') + lbl(0, y + 28, vword[r.verdict][0], 'at-roww')
      + '<rect x="' + a.toFixed(1) + '" y="' + (y - 11) + '" width="' + Math.max(3, z - a).toFixed(1) + '" height="22" class="' + cls(r.verdict) + '"/>'
      + lbl(a - 8, y + 5, n(w), 'at-ax', 'end') + lbl(z + 8, y + 5, (b > 0 ? '+' : '') + n(b), 'at-ax');
  });
  return '<svg class="at-svg" viewBox="0 0 ' + W + ' ' + H + '"' + aria + g + '</svg>';
}

function semana(narrow) {
  const W = narrow ? 420 : 900, H = narrow ? 410 : 500, L = narrow ? 40 : 70, R = W - (narrow ? 10 : 20), T = narrow ? 14 : 24, Bt = narrow ? 336 : 430;
  const sx = (km) => L + (km - 2) / 9.6 * (R - L), sy = (kg) => Bt - (kg - 5) / 25 * (Bt - T);
  let g = '';
  for (const kg of [5, 10, 15, 20, 25, 30]) g += '<line x1="' + L + '" x2="' + R + '" y1="' + sy(kg) + '" y2="' + sy(kg) + '" class="at-grid"/>' + lbl(L - 12, sy(kg) + 5, String(kg), 'at-ax', 'end');
  for (const km of [2, 4, 6, 8, 10]) g += '<line y1="' + T + '" y2="' + Bt + '" x1="' + sx(km) + '" x2="' + sx(km) + '" class="at-grid"/>' + lbl(sx(km), Bt + 26, String(km), 'at-ax', 'middle');
  g += lbl((L + R) / 2, Bt + (narrow ? 54 : 58), 'distância do posto à base, km', 'at-axl', 'middle');
  g += '<text class="at-axl" text-anchor="middle" transform="translate(' + (narrow ? 12 : 18) + ' ' + ((T + Bt) / 2) + ') rotate(-90)">carga, kg</text>';
  V.forEach(([kg, km, v], i) => {
    const jx = ((i * 37) % 11 - 5) / 5 * 0.13, jy = ((i * 53) % 11 - 5) / 5 * 0.42;
    const X = sx(km + jx), Y = sy(kg + jy);
    const r = narrow ? 3.6 : 5.5;
    if (v === 'P') g += '<circle cx="' + X.toFixed(1) + '" cy="' + Y.toFixed(1) + '" r="' + r + '" class="at-dot go"/>';
    else if (v === 'F') g += '<circle cx="' + X.toFixed(1) + '" cy="' + Y.toFixed(1) + '" r="' + (r - 0.4) + '" class="at-dot na"/>';
    else g += '<path d="M' + (X - r * 0.8).toFixed(1) + ' ' + (Y - r * 0.8).toFixed(1) + 'l' + (r * 1.6).toFixed(1) + ' ' + (r * 1.6).toFixed(1) + 'm0 -' + (r * 1.6).toFixed(1) + 'l-' + (r * 1.6).toFixed(1) + ' ' + (r * 1.6).toFixed(1) + '" class="at-dot no"/>';
  });
  const mx = sx(AV.post_km), my = sy(KG);
  g += '<circle cx="' + mx + '" cy="' + my + '" r="' + (narrow ? 11 : 15) + '" class="at-ring"/>' + lbl(mx + (narrow ? 15 : 22), my - (narrow ? 11 : 14), 'a missão', 'at-lbm');
  return '<svg class="at-svg' + (narrow ? ' at-n' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Semana sintética: ' + V.length + ' saídas por distância e carga. Passam as saídas perto e leves; não passam as longe e pesadas; no meio, falta dado">' + g + '</svg>';
}

/* the synthetic flight: the leg, zoomed, and the energy that remains along it (the script draws it) */
function voo() {
  const B = P('base'), Q = P('posto');
  /* a 2:1 window on the leg: the figure stays shorter than it is wide (the operator, 2026-11-15: nothing gigantic) */
  const cx = (B[0] + Q[0]) / 2, cy = (B[1] + Q[1]) / 2, h = Math.max(Math.abs(Q[1] - B[1]), Math.abs(Q[0] - B[0]) / 2) * 1.5, w = h * 2;
  const vb = [cx - w / 2, cy - h / 2, w, h].map((v) => v.toFixed(1)).join(' ');
  return '<div class="at-rp" id="at-rp">'
    + '<div class="at-rpmap"><svg class="at-svg" id="at-rpmap" viewBox="' + vb + '" role="img" aria-label="Voo sintético: o drone vai da base ao posto avançado e volta; no meio do caminho o GPS é falsificado e o drone segue pela área garantida">'
    + '<image href="relevo.webp" width="' + RW + '" height="' + RH + '" preserveAspectRatio="none"/>'
    + '<line x1="' + B[0] + '" y1="' + B[1] + '" x2="' + Q[0] + '" y2="' + Q[1] + '" class="at-halo"/>'
    + '<line x1="' + B[0] + '" y1="' + B[1] + '" x2="' + Q[0] + '" y2="' + Q[1] + '" class="at-route"/>'
    + '<circle cx="' + B[0] + '" cy="' + B[1] + '" r="6" class="at-base"/><circle cx="' + Q[0] + '" cy="' + Q[1] + '" r="6.5" class="at-post"/>'
    + lbl(B[0] + 12, B[1] + 5, 'Base', 'at-lbz') + lbl(Q[0] + 12, Q[1] + 5, 'Posto', 'at-lbz')
    + '<g id="at-drone" style="display:none"><circle id="at-area" r="6" class="at-area"/><circle r="4.5" class="at-dr"/></g>'
    + '</svg><span class="at-now" id="at-now">pronto para decolar</span></div>'
    + '<div class="at-strip"><svg id="at-strip" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"></svg>'
    + '<span class="at-sl" style="top:2%">' + n(CJ.timeline.avancado.usable[1]) + ' Wh</span><span class="at-sl at-slr" id="at-res">reserva</span></div>'
    + '<div class="at-bar"><button type="button" id="at-go">▶ Ver o voo sintético</button><span class="at-clock" id="at-clock">08:40</span></div>'
    + '</div>';
}
function vooScript() {
  const T = CJ.timeline.avancado;
  const rows = MJ.posto.rows;
  const rAt = (km) => rows.reduce((b, r) => Math.abs(r.km - km) < Math.abs(b.km - km) ? r : b).r_m || 600;
  const D = { B: P('base'), Q: P('posto'), mpx: 1 / (kmPerU * 1000), usable: T.usable, res: T.res, voo: FR.voo_min[1],
    pts: T.pts.map((q) => [q.s, q.pos, q.rem_best, q.rem_worst, q.gps === 'falso' ? 1 : 0, rAt(q.km)]) };
  return '<script>(function(){var D=' + JSON.stringify(D) + ';' + `
var NS='http://www.w3.org/2000/svg',$=function(i){return document.getElementById(i)};
var strip=$('at-strip'),dr=$('at-drone'),ar=$('at-area'),now=$('at-now'),btn=$('at-go'),clk=$('at-clock');if(!strip)return;
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
var P=D.pts,ymax=D.usable[1]*1.04,y=function(v){return 100-100*v/ymax};
var top=P.map(function(p){return p[0]*1000+','+y(p[2]).toFixed(2)}),bot=P.slice().reverse().map(function(p){return p[0]*1000+','+y(p[3]).toFixed(2)});
var cl=el('clipPath',{id:'at-clip'},el('defs',{},strip)),rv=el('rect',{x:0,y:-10,width:1000,height:120},cl),g=el('g',{'clip-path':'url(#at-clip)'},strip);
el('polygon',{points:top.concat(bot).join(' '),'class':'at-fill'},g);
el('polyline',{points:top.join(' '),'class':'at-best','vector-effect':'non-scaling-stroke'},g);
el('polyline',{points:P.map(function(p){return p[0]*1000+','+y(p[3]).toFixed(2)}).join(' '),'class':'at-worst','vector-effect':'non-scaling-stroke'},g);
el('line',{x1:0,x2:1000,y1:y(D.res[1]),y2:y(D.res[1]),'class':'at-resl','vector-effect':'non-scaling-stroke'},strip);
el('line',{x1:500,x2:500,y1:0,y2:100,'class':'at-midl','vector-effect':'non-scaling-stroke'},strip);
var cur=el('line',{x1:0,x2:0,y1:0,y2:100,'class':'at-cur','vector-effect':'non-scaling-stroke',style:'display:none'},strip);
$('at-res').style.top=y(D.res[1])+'%';
function at(s){var f=s*(P.length-1),i=Math.max(0,Math.min(P.length-2,Math.floor(f))),u=f-i,a=P[i],b=P[i+1];return a.map(function(v,k){return k===4?(u<.5?a[4]:b[4]):v+(b[k]-v)*u})}
function ph(s,p){if(s<.04)return'decolagem';if(s<.47)return p[4]?'GPS falso: segue pela área garantida':'ida ao posto';if(s<.56)return'chegada: marcador e entrega';if(s<.97)return p[4]?'volta, GPS ainda falso':'volta à base';return'pouso'}
function draw(s){var p=at(s),x=D.B[0]+(D.Q[0]-D.B[0])*p[1],yy=D.B[1]+(D.Q[1]-D.B[1])*p[1];
dr.style.display='';dr.setAttribute('transform','translate('+x.toFixed(1)+','+yy.toFixed(1)+')');
ar.setAttribute('r',Math.max(p[5]*D.mpx,6).toFixed(1));ar.setAttribute('class','at-area'+(p[4]?' falso':''));
rv.setAttribute('width',(s*1000).toFixed(1));cur.style.display='';cur.setAttribute('x1',s*1000);cur.setAttribute('x2',s*1000);
var m=40+s*D.voo;clk.textContent='08:'+String(Math.floor(m)).padStart(2,'0');
now.textContent=s>=1?'pousou com reserva: no pior caso, '+Math.round(p[3]-D.res[1]).toLocaleString('pt-BR')+' Wh além dela':ph(s,p)}
var raf=0,busy=false;
function play(){if(busy)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){draw(1);return}
busy=true;btn.disabled=true;var t0=performance.now();
function step(t){var s=Math.max(0,Math.min(1,(t-t0)/14000));draw(s);if(s<1)raf=requestAnimationFrame(step);else{busy=false;btn.disabled=false;btn.textContent='↺ Ver de novo'}}
raf=requestAnimationFrame(step)}
btn.addEventListener('click',play);
if('IntersectionObserver'in window){var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting})){io.disconnect();play()}},{threshold:.6});io.observe($('at-rpmap'))}
})();</script>`;
}

/* ---------------------------------------------------------------- the page */
const B = [];
B.push(C.header({ eyebrow: 'Proposta ao Exército Brasileiro · documento de trabalho',
  title: 'Atalaia: um protocolo para usar drones quando o GPS não é confiável',
  deck: 'O GPS de um drone pode ser bloqueado ou falsificado com um aparelho barato, e quase nenhum drone percebe quando isso acontece. O Atalaia propõe um protocolo para a Força planejar, voar e conferir missões de drone nessa condição: regras simples, ferramentas que as tornam praticáveis, e cada decisão registrada de um jeito que qualquer um possa conferir depois.' }));
B.push('<div class="col">' + C.scope('Esta página descreve o protocolo e o testa numa missão simulada em Blumenau (SC). Nada aqui foi voado ainda: cada número diz de onde veio, e o que é proposta está marcado como proposta.') + '</div>');
B.push(C.stats([
  { k: 'A missão simulada', v: n(AV.post_km) + ' km', n: 'da base ao posto avançado, em Blumenau' },
  { k: 'Carga por saída', v: KG + ' kg', n: 'passa até ' + AV.passa_ate_kg + ' kg no pior caso' },
  { k: 'Voos sintéticos', v: String(SI.n), n: pa.length + ' liberados, ' + fa.length + ' à espera de dado, ' + na.length + ' recusados' },
  { k: 'Voos reais', v: '0', n: 'tudo aqui é simulação ou teste de bancada' }]));

B.push(C.section({ lab: '1 · O problema', title: 'O GPS pode mentir, e o drone acredita', bodyRaw:
  C.p('Todo drone moderno usa o GPS para saber onde está. O sinal chega do espaço muito fraco e, por isso, é fácil de abafar ou de imitar. Em janeiro de 2025, um bloqueador escondido em Belo Horizonte fez 21 aeronaves perderem o GPS na aproximação do aeroporto da Pampulha, e a Anatel só achou o aparelho rastreando o sinal em campo. Um drone que confia cegamente no GPS pode ser desviado devagar, sem que o piloto perceba, ou simplesmente se perder.')
  + C.p('O Exército já estuda drones para levar suprimento a tropas isoladas. Em 2025, oficiais da Escola de Aperfeiçoamento de Oficiais simularam um drone de carga DJI FlyCart 30 abastecendo um pelotão na montanha. O drone fez até 89% das entregas, e o estudo registra uma variação considerável do GPS em áreas montanhosas e recomenda ensaios práticos.')
  + C.p('O que falta não é só um aparelho melhor. Falta uma regra comum para quatro perguntas: quando confiar no GPS, quando a bateria basta para ir e voltar, o que fazer quando o sinal mente e como provar depois o que aconteceu em cada voo. Responder a isso é trabalho de doutrina. O Atalaia é uma proposta dessa doutrina, acompanhada das ferramentas que a tornam praticável.')
  + C.pRaw('<span class="at-src">Fontes: Anatel e Polícia Militar, apreensão do bloqueador (Convergência Digital, 24/01/2025); Souza e Burity, <em>Revista Agulhas Negras</em> v. 9, n. 14 (2025), doi:10.70545/ran.v9i14.13519.</span>') }));

const RULES = [
  ['Antes do voo', [
    ['Nenhuma missão decola sem quatro laudos favoráveis.', 'Rota, energia, clima e GPS, cada um calculado no pior caso. Quando um laudo não consegue decidir, a missão espera o dado que falta em vez de arriscar.', 'testado em simulação'],
    ['A reserva de energia é uma regra da Força.', 'Proposta: o drone pousa com energia para mais cinco minutos pairando. A reserva não é decidida pelo piloto no momento, e a Central não libera uma missão que a consuma.', 'proposta'],
    ['Todo laudo diz o que mudaria o resultado.', 'Por exemplo: “passa até ' + AV.passa_ate_kg + ' kg” ou “com esta carga, passa até ' + n(AL.passa_ate_km) + ' km”. Assim o planejador sabe o que ajustar, e a Força sabe que dado vale a pena medir.', 'testado em simulação']]],
  ['Durante o voo', [
    ['A posição do drone é uma área garantida, não um ponto.', 'Uma caixa a bordo calcula, a todo momento, a região onde o drone certamente está, com os próprios sensores e o relevo. Um GPS que aponta para fora dessa região é declarado falso, e o piloto recebe o alarme com o culpado apontado.', 'testado em simulação'],
    ['Com o GPS falso, o drone nunca volta para casa guiado por ele.', 'Ele segue pela área garantida se o laudo de rota permitir; se não, para e pousa por ordem do piloto. Voltar para casa guiado por um GPS falso é exatamente o que um atacante quer.', 'proposta'],
    ['O piloto responde pelo voo e pode intervir a qualquer momento.', 'O protocolo não prevê voo sem piloto. As normas civis já exigem que alguém possa assumir o controle (RBAC-E 94), e a ICA 100-40 do DECEA vale também para drones militares.', 'norma em vigor']]],
  ['Na chegada', [
    ['Descida de precisão só sobre o marcador de quem recebe.', 'O posto estende no chão um painel com um código de uso único, recebido junto com a missão. A descida de precisão só acontece sobre esse marcador e depois que o piloto confirma. Sem o marcador da tropa amiga, a função não existe: ela não serve para apontar um ponto qualquer do terreno.', 'proposta']]],
  ['Depois do voo', [
    ['Todo voo deixa um registro lacrado.', 'Cada leitura é assinada na hora, encadeada com a anterior e carimbada com o tempo da Força. Uma alteração feita depois é detectada, e um programa escrito por outra instituição refaz cada decisão a partir do registro.', 'testado em bancada'],
    ['O que o voo mede volta para os laudos.', 'Onde o GPS falhou, quanto a bateria gastou e quanto o vento real se afastou da previsão: cada voo estreita as faixas da missão seguinte. Uma previsão que erra mais do que prometeu deixa de ser usada até ser recalibrada.', 'proposta']]],
  ['Sempre', [
    ['Só escutar, nunca emitir.', 'O Atalaia só recebe sinais. Não bloqueia nem falsifica GPS fora de área autorizada, não guia armas, não designa alvos e não rastreia pessoas: a tropa recebe alertas por área, sem identificação.', 'linha vermelha']]]];
let rn = 0;
const rulesHtml = '<div class="at-rules">' + RULES.map(([mom, list]) => '<p class="at-mom">' + esc(mom) + '</p><ol start="' + (rn + 1) + '">'
  + list.map(([h, t, s]) => { rn += 1; return '<li><p><b>' + esc(h) + '</b> ' + esc(t) + '</p>' + st(s) + '</li>'; }).join('') + '</ol>').join('') + '</div>';
B.push(C.section({ lab: '2 · O protocolo', title: rn ? 'Dez regras, do planejamento à prova do voo' : '', bodyRaw:
  C.p('O protocolo acompanha a missão em quatro momentos: antes do voo, durante, na chegada e depois. Cada regra diz o que se exige e por quê, e traz o estágio da ferramenta que a cumpre hoje.')
  + rulesHtml }));
if (rn !== 10) die('the protocol has ' + rn + ' rules, the title says ten');

const PH = [
  ['1', 'Planejar', 'A Central dá os quatro laudos', 'Antes de decolar, a Central de operações confere a rota, a energia, o clima e os alertas de GPS da área, cada um no pior caso. Nesta missão os quatro passam; a seção 4 mostra as contas.', 'Regras 1, 2 e 3.', 'Laudos calculados em simulação sobre o relevo de Blumenau e a ficha da DJI.'],
  ['2', 'Decolar', 'A caixa confere o GPS antes de sair', 'A caixa compara o GPS com os próprios sensores de movimento e confere a assinatura digital que o satélite europeu Galileo coloca no sinal. Só então indica que o drone pode sair.', 'Regra 4.', 'A conferência da assinatura passou nos testes oficiais do Galileo: 193.887 conferências, nenhuma falha. Ainda não foi feita com sinal ao vivo.'],
  ['3', 'Ataque', 'Alguém começa a falsificar o GPS', 'No meio do caminho, um aparelho passa a imitar o GPS e a puxar o drone devagar para o lado. A posição informada sai da área onde o drone certamente está, e a caixa avisa o piloto de que o culpado é o GPS.', 'Regra 4.', 'Numa viagem simulada de caminhão na BR-040, o alarme veio em 3 segundos. Com dados reais do IBGE, desvios lentos assim passaram despercebidos sem a caixa em 24 de 24 tentativas.'],
  ['4', 'Sem GPS', 'O drone segue sabendo onde está', 'A caixa ignora o GPS e continua com a área garantida: o movimento dá um círculo, e o relevo visto pela câmera estreita esse círculo. Em Blumenau o relevo ajuda em todo o caminho, que é a situação favorável.', 'Regras 4 e 5.', 'Em voos simulados de 45 minutos sobre relevo e imagens reais de Minas Gerais, o erro ficou em 12 m, e a posição real ficou dentro da área calculada em 24.300 de 24.300 verificações. Num DJI, seguir a rota com a posição da caixa depende de um modo que a DJI documentou e ainda não liberou; até lá, a caixa avisa e o piloto para ou pousa.'],
  ['5', 'Chegada', 'A câmera acha o marcador do posto', 'Perto do posto, a câmera compara o chão com o mapa de imagens e leva o drone até lá. No ponto final, a caixa reconhece o painel com o código de uso único e corrige a descida; o piloto vê o marcador na tela e autoriza.', 'Regras 6 e 7.', 'A comparação entre câmera e mapa errou cerca de 10 m em voos simulados, mais altos que uma entrega. O marcador e a descida de precisão são proposta.'],
  ['6', 'Entrega', 'A carga chega, com prova de onde e quando', 'O registro do voo é lacrado: onde a entrega aconteceu, quando aconteceu cada etapa, o que houve no caminho e as contas da carga, com o pedido, o embarcado e o entregue.', 'Regra 8.', 'O laudo e o lacre foram testados em bancada no Veto, o nosso instrumento de perícia: 53 erros plantados de propósito, todos pegos.'],
  ['7', 'Retorno', 'Na volta, a frota mostra de onde veio o ataque', 'Cada drone que passa pela área registra onde perdeu e onde manteve o GPS. Juntos, apontam a região do aparelho que atacou, só escutando. O que o voo mediu volta para os laudos da próxima missão.', 'Regras 9 e 10.', 'Em simulação, com 10 receptores a região do aparelho ficou com 26 km; com 250, 6 km; com três postos fixos em terra, 350 m. Os receptores do teste eram aviões; com drones, falta validar.']];
B.push(C.section({ lab: '3 · O cenário', title: 'Uma missão de ressuprimento em Blumenau', wide: true, bodyRaw:
  '<div class="col">'
  + C.p('Para ver o protocolo funcionando, montamos uma missão hipotética no Vale do Itajaí. A base fica em Blumenau, a ' + zBase + ' m de altitude. O posto avançado fica a ' + n(AV.post_km) + ' km, nos morros a sudoeste da cidade, a ' + zPost + ' m, e recebe ' + KG + ' kg de suprimento por saída: ' + CAP.saidas_precisa + ' saídas cobrem os ' + FR.pedido_kg_dia + ' kg por dia que o estudo da ESAO usou para um pelotão.')
  + C.p('O drone do exemplo é o DJI FlyCart 30, o mesmo do estudo, porque a DJI publica a ficha dele e as contas de energia precisam dela. O protocolo não depende do modelo: com outro drone, troca-se a ficha e as contas são refeitas, e as regras continuam as mesmas. A base e o posto são pontos escolhidos sobre o relevo real; nenhuma instalação real é indicada.')
  + '</div>'
  + C.figure({ hero: true, svgRaw: mapa(false), svgNarrowRaw: mapa(true), record: ['apps/atalaia/data/missao.json', 'apps/atalaia/data/central.json'],
    caption: 'A missão sobre o relevo real do Vale do Itajaí (modelo Copernicus GLO-90). A linha cheia é o voo do drone, da base ao posto avançado; os números marcam onde, na simulação, começa o ataque ao GPS (3), onde o drone segue sem GPS (4) e onde acha o marcador do posto (5). A linha tracejada continua até a serra: ali a bateria não leva e traz o drone.' })
  + '<div class="col"><p class="at-k">A missão fase a fase</p></div>'
  + C.picker({ name: 'fase', items: PH.map(([k, t, title, lead, regra, teste]) => ({ k, t, title, leadRaw: esc(lead),
    boxes: [{ lab: 'Regras do protocolo', bodyRaw: esc(regra) }, { lab: 'O que já foi testado', bodyRaw: esc(teste) }] })) }) }));

B.push(C.section({ lab: '4 · Antes de voar', title: 'Os quatro laudos da missão', bodyRaw:
  C.p('Cada laudo responde a uma pergunta e dá um de três vereditos: passa, não passa ou falta dado. O de energia usa o método do SkyAudit, que decidiu um dia real de voos de helicóptero em Nova York: cada número entra como uma faixa, do pior ao melhor caso, e a missão só passa se a bateria cobrir o gasto e a reserva na faixa inteira.')
  + C.table({ cols: [{ h: 'Laudo' }, { h: 'A pergunta' }, { h: 'Nesta missão' }, { h: 'Veredito' }], rows: [
    ['Rota', 'Sem GPS, o relevo devolve a posição do drone a tempo?', 'O relevo ajuda em ' + Math.round(MJ.posto.laudo.share_ajuda * 100) + '% do caminho.', { raw: vt('PASSA') }],
    ['Energia', 'A bateria leva e traz, com a reserva intacta, no pior caso?', 'Com ' + KG + ' kg, sobram ao menos ' + n(R12.margin_wh[0]) + ' Wh além da reserva. Passa até ' + AV.passa_ate_kg + ' kg.', { raw: vt('PASSA') }],
    ['Clima', 'O vento e a temperatura previstos estão dentro do que o fabricante garante?', 'Vento previsto de ' + n(CJ.clima.vento_ms[0]) + ' a ' + n(CJ.clima.vento_ms[1]) + ' m/s; o limite é ' + n(CJ.ficha.vento_max_ms) + ' m/s. Previsão simulada.', { raw: vt('PASSA') }],
    ['GPS', 'Há alerta de interferência na área?', 'Nenhum nas últimas 24 h. Leitura simulada.', { raw: vt('PASSA') }]] })
  + C.figure({ svgRaw: twin(energia(false), energia(true)), record: 'apps/atalaia/data/central.json',
    caption: 'A margem de energia, que é a bateria menos o gasto menos a reserva, do pior ao melhor caso, para três missões a partir da mesma base. Inteira à direita do zero, passa; cruzando o zero, falta dado; inteira à esquerda, não passa.' })
  + C.p('Com 30 kg, o laudo não decide. No pior caso o drone pousaria abaixo da reserva; no melhor, sobraria energia. O instrumento não chuta e diz o que decidiria: o consumo real com carga, medido num voo de calibração. Já um posto na serra, a 15 km, não passa nem com o drone vazio, porque ida e volta somam 30 km e a ficha da DJI dá ' + n(CJ.ficha.alcance_vazio_km) + ' km ao FlyCart 30 sem carga.')
  + C.p('Com ' + KG + ' kg, a distância garantida hoje é de ' + n(AL.passa_ate_km) + ' km. Entre ' + n(AL.passa_ate_km + 0.5, 1) + ' e ' + n(AL.nao_passa_de_km - 0.5, 1) + ' km falta dado, e a partir de ' + n(AL.nao_passa_de_km) + ' km não passa. Cada voo de calibração estreita as faixas, e a distância garantida cresce.')
  + C.note({ lab: 'De onde vêm as contas de energia', bodyRaw: C.plainList([
    { b: 'Da ficha da DJI.', text: 'Duas baterias de ' + n(CJ.ficha.bateria_wh, 1) + ' Wh; ' + n(CJ.ficha.alcance_vazio_km) + ' km sem carga e ' + n(CJ.ficha.alcance_cheio_km) + ' km com 30 kg; ' + n(CJ.ficha.pairar_vazio_min) + ' e ' + n(CJ.ficha.pairar_cheio_min) + ' minutos pairando; vento máximo de ' + n(CJ.ficha.vento_max_ms) + ' m/s (dji.com, lida em 15/11/2026).' },
    { b: 'Premissas declaradas.', text: 'A ficha usou de 85% a 100% da bateria; a bateria tem de 90% a 100% da saúde; o ar fica mais fino com a altitude; o vento é o da previsão; decolagem, pouso e descarga levam de ' + n(CJ.premissas.paira_min[0]) + ' a ' + n(CJ.premissas.paira_min[1]) + ' minutos; a reserva é de ' + n(CJ.premissas.reserva_min) + ' minutos pairando.' },
    { b: 'O que substitui cada premissa.', text: 'Uma leitura da bateria, um voo de calibração ou uma previsão melhor. Cada uma estreita a faixa e pode virar um falta dado em passa.' }]) }) }));

B.push(C.section({ lab: '5 · O experimento', title: 'Primeiro em simulação, depois no campo', bodyRaw:
  C.p('O primeiro passo é testar o protocolo inteiro no computador, sobre o relevo de Blumenau, antes de qualquer voo. Fizemos isso de duas formas.')
  + C.p('A primeira é o voo sintético da própria missão. O drone sai da base, sofre o ataque ao GPS no meio do caminho, segue pela área garantida, entrega e volta, e a cada instante a Central acompanha quanta energia sobra, do pior ao melhor caso.')
  + C.figure({ svgRaw: voo(), record: 'apps/atalaia/data/central.json',
    caption: 'O voo sintético da missão, com ' + KG + ' kg. A faixa cinza é a energia que sobra, do pior caso (linha forte) ao melhor; a linha tracejada é a reserva. O círculo em volta do drone é a área garantida, e fica vermelho enquanto o GPS é falso. Simulação; não foi voado.' })
  + C.p('A segunda é uma semana sintética da frota: ' + SI.n + ' saídas da base, com o posto a uma distância de 2 a 11 km, carga de 5 a 30 kg e previsão de vento sorteadas. A Central decidiu cada saída antes do voo. Depois, um simulador voou cada uma com um drone e um vento sorteados, e em uma de cada vinte o vento real passou da previsão.')
  + C.figure({ svgRaw: twin(semana(false), semana(true)), record: 'apps/atalaia/data/central.json',
    caption: 'Cada ponto é uma saída. Ponto cheio: a Central liberou (' + pa.length + '). Anel: faltou dado, e a saída esperou (' + fa.length + '). Xis: não passa (' + na.length + '). As saídas perto e leves passam; as longe e pesadas não passam; no meio, o instrumento não chuta.' })
  + C.p('Nenhuma das ' + pa.length + ' saídas liberadas pousou abaixo da reserva, ' + (paMiss === 1 ? 'nem a única' : 'nem as ' + paMiss) + ' em que o vento passou da previsão. Das ' + fa.length + ' que esperaram dado, ' + faOk + ' teriam chegado com reserva: é o preço de não chutar, e ele cai quando um voo de calibração mede o consumo real. Das ' + na.length + ' recusadas, ' + (naOk === 0 ? 'nenhuma teria chegado' : naOk + ' teriam chegado') + '.')
  + C.p('O que a simulação não prova: dentro das premissas, uma saída liberada não falha por construção, porque é aritmética. O teste confere as contas e mede o custo da cautela e o efeito de uma previsão errada. O comportamento do drone, da bateria e do vento reais só se mede em campo.')
  + C.p('Depois da primeira conversa com o batalhão, o experimento vai a campo em três etapas: a bancada no quartel, com o drone em solo; voos de calibração no campo de instrução, que medem o consumo e o relevo; e um exercício em que o ataque ao GPS é reproduzido sem emitir sinal, injetando na caixa a gravação de um ataque, ou em área autorizada pela Anatel.')
  + C.table({ cols: [{ h: 'Resultado' }, { h: 'O que mostra' }, { h: 'Estágio' }], rows: [
    ['12 m', 'erro depois de 45 minutos voando sem GPS', 'voos simulados sobre relevo e imagens reais de Minas Gerais'],
    ['24.300 de 24.300', 'vezes em que a posição real ficou dentro da área calculada', 'os mesmos voos simulados'],
    ['3 s', 'até o alarme, com o GPS apontado como culpado', 'viagem simulada de caminhão na BR-040'],
    ['24 de 24', 'desvios lentos que passariam despercebidos sem a caixa', 'dados reais da rede de estações do IBGE'],
    ['0 de 193.887', 'falhas na conferência da assinatura do Galileo', 'testes oficiais do sistema Galileo'],
    ['53 de 53', 'erros plantados no laudo e no lacre que foram pegos', 'bancada, no Veto']] }) }));

B.push(C.section({ lab: '6 · O drone', title: 'O protocolo vale para o drone que o batalhão tiver', bodyRaw:
  C.p('As regras não dependem do modelo. O que muda de um drone para outro é a ficha que alimenta o laudo de energia e a forma de ligar a caixa. Nos drones DJI, a porta oficial do fabricante entrega os dados de voo e recebe os comandos de parar e pousar; em autopilotos abertos, como PX4 e ArduPilot, a caixa também pode fornecer a posição para o drone seguir a rota.')
  + C.plainList([
    { b: 'Drones de carga (FlyCart 30 e 100).', text: 'Servem à entrega do exemplo. A ficha é publicada e a porta é simples: dados a 50 vezes por segundo, sem relógio comum com a caixa.' },
    { b: 'Drones de medição (Matrice 350 ou 300).', text: 'Os melhores para o experimento: relógio comum com a caixa e sensores do drone a 400 vezes por segundo. Carregam pouco, cerca de 2,7 kg.' },
    { b: 'Drones pequenos de reconhecimento.', text: 'O protocolo se aplica igual: os quatro laudos, a área garantida e o registro lacrado. A missão de exemplo vira reconhecimento em vez de entrega.' }])
  + C.p('A pergunta ao batalhão, antes de qualquer teste, é simples: que drones vocês usam hoje, e para quais missões?') }));

B.push(C.section({ lab: '7 · Auditável', title: 'A Força não precisa confiar em nós: pode conferir', bodyRaw:
  C.p('Um protocolo de defesa só vale se as decisões puderem ser conferidas por quem não escreveu o sistema. Por isso cada registro passa por cinco etapas.')
  + C.plainList([
    { b: 'Assina.', text: 'Cada leitura e cada foto são assinadas pela caixa no momento em que são feitas, com uma chave guardada em hardware.' },
    { b: 'Encadeia.', text: 'Cada registro carrega a impressão digital do anterior: apagar ou trocar um deles quebra a corrente.' },
    { b: 'Carimba.', text: 'O tempo do voo é carimbado por uma autoridade da própria Força nas missões, e pela ICP-Brasil nos laudos que vão a terceiros.' },
    { b: 'Guarda a custódia.', text: 'Cada passagem do registro, do drone à base e da base ao perito, é anotada na ordem que o Código de Processo Penal exige.' },
    { b: 'Refaz.', text: 'Um verificador escrito à parte, de preferência pelo IME ou pelo CTEx, refaz cada decisão a partir do registro. Se discordar da caixa, o caso é investigado.' }])
  + C.p('As peças já existem e foram testadas em bancada no Veto, o nosso instrumento de perícia de evidências. Montá-las na caixa do drone é trabalho da fase de bancada.') }));

B.push(C.section({ lab: '8 · Limites', title: 'O que o Atalaia não faz, e o que ainda não sabemos', bodyRaw: C.plainList([
  { b: 'Não emite.', text: 'Não bloqueia nem falsifica sinal fora de área autorizada, não faz guerra eletrônica de ataque e não decodifica comunicações.' },
  { b: 'Não guia armas nem rastreia pessoas.', text: 'A descida de precisão só existe sobre o marcador de quem recebe; a tropa recebe alertas por área, sem identificação.' },
  { b: 'Ainda não voou.', text: 'Tudo nesta página é simulação ou teste de bancada. O primeiro voo real é a etapa de calibração do experimento.' },
  { b: 'Num DJI, hoje, a caixa avisa e manda parar ou pousar.', text: 'Seguir a rota com a posição da caixa depende de um modo que a DJI documentou e ainda não liberou, ou de um autopiloto aberto.' },
  { b: 'As contas de energia começam como premissas.', text: 'Até os voos de calibração, muitas missões vão dar falta dado. É o comportamento certo: a Central não chuta.' },
  { b: 'Onde o relevo não ajuda, o laudo de rota diz falta dado.', text: 'Numa rota de 15 km a partir de Tabatinga, na fronteira amazônica, o relevo plano não ajuda em nenhum ponto; sem GPS, o drone chegaria com até ' + n(MJ.amazonia.laudo.err_max_m / 1000, 1) + ' km de dúvida. O laudo diz o que decidiria: o mapa magnético do Serviço Geológico do Brasil, imagens do INPE ou um voo de reconhecimento.' }]) }));

B.push(C.section({ lab: '9 · Próximo passo', title: 'Uma conversa com o batalhão', bodyRaw:
  C.p('O que propomos é começar pequeno: apresentar o protocolo, ouvir que missões o batalhão tem e com que drones, e escolher juntos o primeiro teste de campo. O primeiro passo não exige compra de equipamento.')
  + C.plainList([
    { b: 'Que drones o batalhão usa hoje,', text: 'e para quais missões: reconhecimento, ligação, entrega?' },
    { b: 'Onde o GPS já falhou', text: 'em exercício ou em operação, e o que a tropa fez quando isso aconteceu?' },
    { b: 'Que regras de voo e de reserva', text: 'a unidade já segue, para o protocolo partir delas e não de uma folha em branco?' },
    { b: 'Onde testar', text: 'a calibração e o exercício, e com que autorizações?' }]) }));

const foot = '<p>' + esc('Preparado por Carlos Toledo, com ajuda de IA (Claude) na pesquisa e na redação. Documento de trabalho para revisão: não é proposta comercial nem documento oficial de nenhum órgão. Os números da missão vêm de apps/atalaia/data (relevo Copernicus GLO-90 e ficha da DJI, cada entrada fixada por sha256 em PROVENANCE.json); os resultados de teste, dos registros do LOCUS e do Veto, cada um com o seu estágio.') + '</p>';

const css = `
.at-src{font-size:var(--text-small);color:var(--ink-4)}
.at-nw{display:none}
@media (max-width:640px){.at-w{display:none}.at-nw{display:block}}
.at-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4);margin:8px 0 0}
.at-st{display:inline-block;font-family:var(--f-mono);font-size:.6875rem;letter-spacing:.06em;color:var(--ink-3);border:1px solid var(--rule);border-radius:var(--radius-s);padding:1px 8px;margin-top:6px;white-space:nowrap}
.at-rules{display:flex;flex-direction:column;gap:6px}
.at-mom{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4);margin:18px 0 0;padding-top:12px;border-top:1px solid var(--rule)}
.at-rules ol{margin:0;padding-left:1.6em;display:flex;flex-direction:column;gap:14px}
.at-rules li{padding-left:.3em}
.at-rules li::marker{font-family:var(--f-mono);color:var(--ink-4)}
.at-rules li p{margin:0}
.at-svg{display:block;width:100%;height:auto}
.at-svg text{font-family:var(--f-sans)}
.at-ground{fill:var(--sunk)}
.at-route{stroke:var(--ink);stroke-width:5;stroke-linecap:round}
.at-halo{stroke:var(--paper);stroke-width:11;stroke-linecap:round}
.at-beyond{stroke:var(--ink-4);stroke-width:2.5;stroke-dasharray:2 3}
.at-base{fill:var(--ink);stroke:var(--paper);stroke-width:4}
.at-post{fill:var(--paper);stroke:var(--ink);stroke-width:4.5}
.at-serra{fill:var(--paper);stroke:var(--ink-4);stroke-width:3}
.at-mk{fill:var(--paper);stroke:var(--ink-2);stroke-width:2}
.at-mkt{font-family:var(--f-mono)!important;font-size:15px;font-weight:600;fill:var(--ink)}
.at-lb{font-size:26px;font-weight:600;fill:var(--ink);paint-order:stroke;stroke:var(--paper);stroke-width:6px;stroke-linejoin:round}
.at-lbd{font-size:24px;font-weight:500;fill:var(--ink-3);paint-order:stroke;stroke:var(--paper);stroke-width:6px;stroke-linejoin:round}
.at-lbs{font-family:var(--f-mono)!important;font-size:19px;fill:var(--ink-3);paint-order:stroke;stroke:var(--paper);stroke-width:5px;stroke-linejoin:round}
.at-lbz{font-size:13px;font-weight:600;fill:var(--ink);paint-order:stroke;stroke:var(--paper);stroke-width:3px;stroke-linejoin:round}
.at-lbm{font-size:15px;font-weight:600;fill:var(--ink)}
.at-scale{stroke:var(--ink);stroke-width:5}
.at-zero{stroke:var(--ink);stroke-width:2}
.at-ax{font-family:var(--f-mono)!important;font-size:13px;fill:var(--ink-3)}
.at-axl{font-size:14px;fill:var(--ink-3)}
.at-rowl{font-size:15px;font-weight:600;fill:var(--ink)}
.at-roww{font-family:var(--f-mono)!important;font-size:12px;letter-spacing:.08em;fill:var(--ink-3)}
.at-band{stroke:var(--ink-2);stroke-width:1.5}
.at-band.go{fill:var(--ink-2)}
.at-band.na{fill:var(--band-fill);stroke-dasharray:5 4}
.at-band.no{fill:none}
.at-grid{stroke:var(--rule);stroke-width:1}
.at-dot.go{fill:var(--held)}
.at-dot.na{fill:none;stroke:var(--warn);stroke-width:1.8}
.at-dot.no{fill:none;stroke:var(--ink-3);stroke-width:2}
.at-ring{fill:none;stroke:var(--ink);stroke-width:2}
.at-rp{display:flex;flex-direction:column;gap:10px}
.at-rpmap{position:relative;border:1px solid var(--rule);border-radius:var(--radius-s);overflow:hidden;background:var(--sunk);aspect-ratio:2/1;max-width:100%}
.at-rpmap svg{position:absolute;inset:0;width:100%;height:100%}
.at-now{position:absolute;left:10px;top:10px;font-family:var(--f-mono);font-size:.6875rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink);background:var(--paper);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:3px 8px;max-width:calc(100% - 20px)}
.at-area{fill:none;stroke:var(--ink);stroke-width:1.2;stroke-dasharray:1.5 2}
.at-area.falso{stroke:var(--witness)}
.at-dr{fill:var(--ink);stroke:var(--paper);stroke-width:2}
.at-strip{position:relative;height:84px;border-bottom:1px solid var(--rule)}
.at-strip svg{position:absolute;inset:0;width:100%;height:100%}
.at-sl{position:absolute;left:0;transform:translateY(-50%);font-family:var(--f-mono);font-size:.625rem;color:var(--ink-4);background:var(--paper);padding-right:4px}
.at-slr{left:auto;right:0;padding:0 0 0 4px}
.at-fill{fill:var(--band-fill)}
.at-best{fill:none;stroke:var(--ink-3);stroke-width:1.5}
.at-worst{fill:none;stroke:var(--ink);stroke-width:2.5}
.at-resl{stroke:var(--ink);stroke-width:1.5;stroke-dasharray:5 4}
.at-midl{stroke:var(--rule-strong);stroke-width:1;stroke-dasharray:2 3}
.at-cur{stroke:var(--ink);stroke-width:1.5}
.at-bar{display:flex;align-items:center;gap:14px}
.at-bar button{font:600 var(--text-small) var(--f-sans);color:var(--paper);background:var(--ink);border:0;border-radius:var(--radius-pill);padding:9px 18px;cursor:pointer}
.at-bar button[disabled]{opacity:.5;cursor:default}
.at-bar button:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.at-clock{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-3)}
`;

let html = TPL.render({ title: 'Atalaia: um protocolo para usar drones quando o GPS não é confiável', bodyRaw: B.join('\n\n'), footRaw: foot, lang: 'pt-BR',
  cssRaw: css, scriptRaw: vooScript(),
  desc: 'Proposta de protocolo para a Força usar drones quando o GPS não é confiável, com uma missão simulada em Blumenau (SC): quatro laudos antes do voo, área garantida em voo, descida só sobre o marcador de quem recebe e registro lacrado.',
  path: '/atalaia/' });
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.copyFileSync(path.join(DATA, 'relevo.webp'), path.join(OUT, 'relevo.webp'));
console.log('site/atalaia/index.html written (unlisted): posto ' + AV.post_km + ' km, ' + KG + ' kg ' + R12.verdict + '; 30 kg ' + R30.verdict + '; serra ' + RS.verdict
  + '; synthetic ' + pa.length + '/' + fa.length + '/' + na.length);
