#!/usr/bin/env node
/* video-tail.js — "Where the data ends, the models disagree": the Campos Basin's 32 years of daily maxima and the
   five certified fits, drawn as a looping chart on paper.
   tools/ · cert-machine · 2026-10-29

   The operator's rule for every video (2026-10-29): English only; always a chart of real data — lines, points — in
   motion, as a loop. This one: the dots are the hindcast's daily maxima at the Campos node placed at their empirical
   return period; the dashed lines are each certified family's return-level curve, computed in floating point from the
   fit's parameters (COMPUTED); the solid ticks are the 100- and 1000-year levels the ledger decides exactly (DECIDED).
   The float curve must pass through the ledger's own enclosures at 10, 50, 100 and 1000 years, or the build refuses:
   the curve drawn is the curve that was certified.

   Every number is read from certs/hseva-ledger.json and corpus/ww3-points (through instruments/hseva/blocks.js, the
   ledger's own loader). usage: node tools/video-tail.js [OUTDIR]                                              MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'social'));
const die = (m) => { console.error('video-tail: REFUSED — ' + m); process.exit(1); };
const BL = require(path.join(ROOT, 'instruments', 'hseva', 'blocks.js'));
const PT = require(path.join(ROOT, 'design', 'print', 'tokens.js'));
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const { renderVideo } = require(path.join(ROOT, 'design', 'video.js'));

const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'hseva-ledger.json'), 'utf8'));
const P = L.ww3.points.campos;
if (!P) die('the ledger has no campos node');
const Bk = P.blocks.daily;
const HOURS = Bk.hours, YEAR_H = 8766;                    /* the ledger's return level: F⁻¹(1 − hours/(T·8766)) */
if (HOURS !== 24) die('the daily block is not 24 hours');

/* ---- the quantile functions, in floating point, from each certified fit's parameters ---- */
function invNorm(p) {                                     /* Acklam's rational approximation, refined by one Halley step */
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425; let q, r, x;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  else if (p <= 1 - pl) { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const erfc = (z) => { const t = 1 / (1 + 0.5 * Math.abs(z)); const y = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return z >= 0 ? y : 2 - y; };
  const e = 0.5 * erfc(-x / Math.SQRT2) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
  return x - u / (1 + x * u / 2);
}
const Q = {
  normal: ([mu, s], p) => mu + s * invNorm(p),
  lognormal: ([mu, s], p) => Math.exp(mu + s * invNorm(p)),
  weibull: ([k, lam], p) => lam * Math.pow(-Math.log1p(-p), 1 / k),
  expweibull: ([al, k, lam], p) => lam * Math.pow(-Math.log1p(-Math.pow(p, 1 / al)), 1 / k),
  gumbel: ([mu, beta], p) => mu - beta * Math.log(-Math.log(p)),
};
const NAMES = { normal: 'Normal', lognormal: 'Lognormal', weibull: 'Weibull', expweibull: 'Exp. Weibull', gumbel: 'Gumbel' };
const level = (f, th, Ty) => Q[f](th, 1 - HOURS / (Ty * YEAR_H));
const fams = [];
for (const f of L.families) {
  const F = Bk.fits[f];
  if (!F.certified) { if (f !== 'gengamma') die(f + ' is not certified at campos, and this scene draws only certified fits'); continue; }
  if (!Q[f]) die('no quantile function for ' + f);
  const th = F.theta.map(Number);
  /* the gate: the float curve passes through the ledger's decided enclosures, to a micrometre */
  for (const Ty of ['10', '50', '100', '1000']) {
    const R = F.returnLevel[Ty], v = level(f, th, Number(Ty));
    if (!(v > Number(R.lo) - 1e-6 && v < Number(R.hi) + 1e-6)) die(f + ' at ' + Ty + ' years: the float curve gives ' + v + ', the ledger encloses [' + R.lo + ', ' + R.hi + ']');
  }
  const cm = (R) => [Math.floor(Number(R.lo) * 100), Math.ceil(Number(R.hi) * 100)];
  fams.push({ f, name: NAMES[f], l100: cm(F.returnLevel['100']), l1000: cm(F.returnLevel['1000']) });
  fams[fams.length - 1].curve = [];
  for (let i = 0; i <= 480; i++) { const Ty = Math.pow(10, -1 + 4 * i / 480); fams[fams.length - 1].curve.push([+Math.log10(Ty).toFixed(5), +level(f, th, Ty).toFixed(4)]); }
}
const decided = Bk.rankings && Bk.rankings.ad && Bk.rankings.ad.verdict === 'DECIDED' ? Bk.rankings.ad.best : null;
if (!decided || !fams.some((x) => x.f === decided)) die('Anderson–Darling decides no drawn family at campos');
if (Bk.fits.gengamma && Bk.fits.gengamma.certified) die('the generalized gamma is certified here; the scene says it is not');

/* ---- the data: the daily maxima at their empirical return period, from the ledger's own loader ---- */
const S = BL.ww3Series('campos');
const x = Array.from(BL.blockMaxima(S, 'daily').x).sort((a, b) => b - a);
if (x.length !== Bk.n || x[0] !== Number(Bk.max)) die('the series is not the ledger\'s: ' + x.length + ' maxima, largest ' + x[0]);
const dots = [];
for (let r = 1; r <= x.length; r++) { const Ty = (HOURS / YEAR_H) * (x.length + 1) / r; if (Ty < 0.1) break; dots.push([+Math.log10(Ty).toFixed(5), x[r - 1]]); }
const span = Math.log10((HOURS / YEAR_H) * (x.length + 1));
const lo1000 = Math.min(...fams.map((q) => q.l1000[0])), hi1000 = Math.max(...fams.map((q) => q.l1000[1]));

/* ---- the scene ---- */
const C = { paper: PT.hex('--paper'), ink: PT.hex('--ink'), ink2: PT.hex('--ink-2'), ink3: PT.hex('--ink-3'), guide: PT.hex('--guide'), grid: PT.hex('--grid') };
const DATA = { fams, decided, dots, span, years: P.years, y0: P.first.slice(0, 4), y1: P.last.slice(0, 4), lo1000, hi1000, n: x.length };
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${T.GOOGLE_FONTS}">
<style>html,body{margin:0;background:${C.paper}}svg{display:block}
text{font-family:${T.TYPE.body.replace(/"/g, "'")};fill:${C.ink};stroke:${C.paper};stroke-width:6px;stroke-linejoin:round;paint-order:stroke}
.m{font-family:${T.TYPE.mono.replace(/"/g, "'")};fill:${C.ink3}}</style></head>
<body><svg id="s" width="1600" height="900" viewBox="0 0 1600 900"></svg><script>
const D = ${JSON.stringify(DATA)}, C = ${JSON.stringify(C)};
const XA = 150, XB = 1290, YA = 760, YB = 230, LX = [-1, 3], LY = [3, 8.5];
const px = (lt) => XA + (lt - LX[0]) / (LX[1] - LX[0]) * (XB - XA), py = (m) => YA - (m - LY[0]) / (LY[1] - LY[0]) * (YA - YB);
const cl = (u) => Math.max(0, Math.min(1, u)), ease = (u) => { u = cl(u); return u * u * (3 - 2 * u); };
const cm2 = (v) => (v / 100).toFixed(2);
/* labels at the right edge, kept apart */
const lab = D.fams.map((F) => ({ F, y: py(F.l1000[0] / 100) })).sort((a, b) => a.y - b.y);
for (let i = 1; i < lab.length; i++) if (lab[i].y - lab[i - 1].y < 30) lab[i].y = lab[i - 1].y + 30;
window.frame = function (t) {
  const g = t > 14.2 ? 1 - ease((t - 14.2) / 0.8) : 1;                     /* the loop's turn */
  let s = '';
  s += '<text x="96" y="112" font-size="50" font-weight="600">Where the data ends, the models disagree</text>';
  s += '<text x="96" y="156" font-size="24" style="fill:' + C.ink3 + '">Campos Basin, Brazil: ' + D.years + ' years of daily maximum wave height (' + D.y0 + '–' + D.y1 + ') and five fitted distributions</text>';
  /* axes: hairlines of the grid, labels in ink-3 */
  for (const m of [3, 4, 5, 6, 7, 8]) s += '<line x1="' + XA + '" x2="' + XB + '" y1="' + py(m) + '" y2="' + py(m) + '" stroke="' + C.grid + '" stroke-width="1"/><text class="m" x="' + (XA - 14) + '" y="' + (py(m) + 6) + '" font-size="17" text-anchor="end">' + m + ' m</text>';
  for (const [lt, w] of [[-1, '0.1'], [0, '1'], [1, '10'], [2, '100'], [3, '1000']]) s += '<line x1="' + px(lt) + '" x2="' + px(lt) + '" y1="' + YA + '" y2="' + (YA + 8) + '" stroke="' + C.grid + '" stroke-width="1"/><text class="m" x="' + px(lt) + '" y="' + (YA + 32) + '" font-size="17" text-anchor="middle">' + w + '</text>';
  s += '<text class="m" x="' + ((XA + XB) / 2) + '" y="' + (YA + 62) + '" font-size="17" text-anchor="middle">return period, years</text>';
  /* where the data ends: a guide */
  const ge = ease((t - 2.0) / 0.8) * g;
  if (ge > 0) s += '<line x1="' + px(D.span) + '" x2="' + px(D.span) + '" y1="' + YB + '" y2="' + YA + '" stroke="' + C.guide + '" stroke-width="1.5" stroke-dasharray="2 3" opacity="' + ge + '"/><text class="m" x="' + (px(D.span) + 10) + '" y="' + (YB + 4) + '" font-size="16" opacity="' + ge + '">the data ends: ' + D.years + ' years</text>';
  /* the data, swept in from the left */
  const sweep = px(LX[0]) + ease(t / 2.2) * (px(D.span) - px(LX[0]) + 8);
  for (const [lt, h] of D.dots) { const X = px(lt); if (X <= sweep) s += '<circle cx="' + X.toFixed(1) + '" cy="' + py(h).toFixed(1) + '" r="2.4" fill="' + C.ink3 + '" opacity="' + (0.9 * g).toFixed(3) + '"/>'; }
  /* the curves: computed (dashed 5 4), revealed left to right by a clip so the dash pattern stays exact */
  const rv = ease((t - 2.6) / 4.2);
  s += '<defs><clipPath id="r"><rect x="0" y="0" width="' + (px(LX[0]) + rv * (XB - px(LX[0]) + 4)).toFixed(1) + '" height="900"/></clipPath></defs><g clip-path="url(#r)" opacity="' + g + '">';
  const heavy = ease((t - 10.0) / 1.2);
  for (const F of D.fams) {
    const w = F.f === D.decided ? 1.6 + 1.6 * heavy : 1.6;
    s += '<polyline fill="none" stroke="' + (F.f === D.decided && heavy > 0 ? C.ink : C.ink3) + '" stroke-width="' + w.toFixed(2) + '" stroke-dasharray="5 4" points="' + F.curve.map(([lt, h]) => px(lt).toFixed(1) + ',' + py(h).toFixed(1)).join(' ') + '"/>';
  }
  s += '</g>';
  /* the decided levels at 100 and 1000 years: solid ticks, then the names at the right */
  const tk = ease((t - 7.0) / 0.7) * g;
  if (tk > 0) for (const F of D.fams) for (const [lt, q] of [[2, F.l100], [3, F.l1000]]) { const y = py((q[0] + q[1]) / 200); s += '<line x1="' + (px(lt) - 9) + '" x2="' + (px(lt) + 9) + '" y1="' + y + '" y2="' + y + '" stroke="' + C.ink + '" stroke-width="3" opacity="' + tk + '"/>'; }
  const nm = ease((t - 7.6) / 0.7) * g;
  if (nm > 0) for (const L of lab) s += '<text x="' + (XB + 22) + '" y="' + (L.y + 7) + '" font-size="20" opacity="' + nm + '" font-weight="' + (L.F.f === D.decided && heavy > 0.5 ? 600 : 400) + '">' + L.F.name + ' <tspan class="m" font-size="17">' + cm2(L.F.l1000[0]) + '–' + cm2(L.F.l1000[1]) + ' m</tspan></text>';
  /* the spread at 1000 years: decided from decided ends, so solid */
  const br = ease((t - 8.4) / 0.9) * g;
  if (br > 0) {
    const xb = px(3) - 34, ya = py(D.lo1000 / 100), yb = ya + (py(D.hi1000 / 100) - ya) * br;
    s += '<line x1="' + xb + '" x2="' + xb + '" y1="' + ya + '" y2="' + yb + '" stroke="' + C.ink + '" stroke-width="2"/><line x1="' + (xb - 7) + '" x2="' + (xb + 7) + '" y1="' + ya + '" y2="' + ya + '" stroke="' + C.ink + '" stroke-width="2"/>';
    if (br > 0.99) s += '<line x1="' + (xb - 7) + '" x2="' + (xb + 7) + '" y1="' + yb + '" y2="' + yb + '" stroke="' + C.ink + '" stroke-width="2"/><text x="' + (xb + 8) + '" y="' + (yb - 22) + '" font-size="22" text-anchor="end" font-weight="550">' + cm2(D.hi1000 - D.lo1000) + ' m apart at 1000 years</text>';
  }
  s += '<text class="m" x="96" y="878" font-size="14">dots: daily maxima (hindcast) · dashed: each certified fit, in floating point · solid ticks: 100- and 1000-year levels, decided exactly</text>';
  s += '<text class="m" x="1504" y="878" font-size="15" text-anchor="end">carlostoledo.co</text>';
  document.getElementById('s').innerHTML = s;
};
window.frame(0);
</script></body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const sceneFile = path.join(OUT, 'campos-tail.html');
fs.writeFileSync(sceneFile, html);
(async () => {
  const r = await renderVideo({ html: sceneFile, out: path.join(OUT, 'campos-tail.mp4'), width: 1600, height: 900, fps: 30, seconds: 15, poster: { t: 12.5, out: path.join(OUT, 'campos-tail.png') } });
  console.log('video-tail: ' + r.frames + ' frames · ' + dots.length + ' dots, ' + fams.length + ' curves, decided ' + decided + ' · at 1000 years '
    + (lo1000 / 100).toFixed(2) + '–' + (hi1000 / 100).toFixed(2) + ' m · data to ' + Math.pow(10, span).toFixed(1) + ' years');
})().catch((e) => die(e.stack || String(e)));
