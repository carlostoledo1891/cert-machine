#!/usr/bin/env node
/* video-campos.js — "Six families, six answers": the 100-year design wave at the Campos Basin, in motion, on paper.
   tools/ · cert-machine · 2026-10-29

   The first video in the house grammar (the operator: "Light for X, let's test it"; WARRANT v2.3, the print register).
   Fifteen seconds, looping: the six families the paper fits, each family's 100-year wave decided exactly at the
   Campos node of the atlas, the spread between them, and the family Anderson–Darling decides. Every number is read
   here from certs/hseva-atlas.json through the atlas's own rules (shared.js cmOut: outward to the centimetre; the
   family codes as the map reads them) and gated: a record that stops supporting a frame refuses the build.

   usage: node tools/video-campos.js [OUTDIR]     writes campos-six-families.mp4, its poster PNG and the scene HTML  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'social'));
const die = (m) => { console.error('video-campos: REFUSED — ' + m); process.exit(1); };
const SH = require(path.join(ROOT, 'playground', 'return-level-atlas', 'shared.js'));
const PT = require(path.join(ROOT, 'design', 'print', 'tokens.js'));
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const { renderVideo } = require(path.join(ROOT, 'design', 'video.js'));

/* ---- the record ---- */
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'hseva-atlas.json'), 'utf8'));
const M = JSON.parse(fs.readFileSync(path.join(ROOT, L.corpus.meta), 'utf8'));
const node = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ww3-points', 'points.json'), 'utf8')).points.find((p) => p.name === 'campos');
if (!node) die('corpus/ww3-points has no campos node');
const cell = L.cells.find((c) => c.id === node.lat + '_' + node.lon);
if (!cell) die('the atlas has no cell at the campos node');
const B = cell.blocks.daily;
if (!B) die('no daily block at campos');
const NAMES = { normal: 'Normal', lognormal: 'Lognormal', weibull: 'Weibull', expweibull: 'Exponentiated Weibull', gengamma: 'Generalized gamma', gumbel: 'Gumbel' };
if (JSON.stringify(Object.keys(NAMES)) !== JSON.stringify(L.families)) die('the ledger\'s families are not the six this scene names');
const T100 = L.returnPeriods[0];
if (T100 !== 100) die('the ledger\'s first return period is not 100 years');
const fams = L.families.map((f) => {
  const F = B.fits[f];
  if (F.c) { const q = SH.cmOut(F.l100); if (!q) die(f + ' is certified with no enclosed 100-year level'); return { f, name: NAMES[f], lo: q[0], hi: q[1] }; }
  if (F.e) return { f, name: NAMES[f], refused: 'proved to peak at the lognormal limit' };
  die(f + ' is refused for a reason this scene has no words for');
});
const decided = B.rank.ad;
if (!decided || decided === 'R') die('Anderson–Darling decides no family at campos');
const D = fams.find((x) => x.f === decided);
if (!D || D.refused) die('the decided family has no level');
const lv = fams.filter((x) => !x.refused);
const lo = Math.min(...lv.map((x) => x.lo)), hi = Math.max(...lv.map((x) => x.hi));
const spread = hi - lo;                                           /* an upper bound on the spread: outward ends */
const rec = B.max;                                                /* the largest day of the hindcast's series, metres */
const years = Math.round(M.days / 365.25), y0 = M.first.slice(0, 4), y1 = M.last.slice(0, 4);
if (!(Number.isFinite(rec) && years > 20)) die('the record or the corpus length is missing');
const m2 = (cm) => (cm / 100).toFixed(2);

/* ---- the scene: paper, the print register, the house fonts ---- */
const C = { paper: PT.hex('--paper'), ink: PT.hex('--ink'), ink3: PT.hex('--ink-3'), guide: PT.hex('--guide'), grid: PT.hex('--grid') };
const DATA = { fams, decided, lo, hi, spread, rec, years, y0, y1, T: T100 };
const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${T.GOOGLE_FONTS}">
<style>html,body{margin:0;background:${C.paper}}svg{display:block}
text{font-family:${T.TYPE.body.replace(/"/g, "'")};fill:${C.ink};stroke:${C.paper};stroke-width:7px;stroke-linejoin:round;paint-order:stroke} .m{font-family:${T.TYPE.mono.replace(/"/g, "'")};fill:${C.ink3}}</style></head>
<body><svg id="s" width="1600" height="900" viewBox="0 0 1600 900"></svg>
<script>
const D = ${JSON.stringify(DATA)}, C = ${JSON.stringify(C)};
const X0 = 560, X1 = 1500, AX = [4, 7];                                   /* metres on the axis */
const xm = (m) => X0 + (m - AX[0]) / (AX[1] - AX[0]) * (X1 - X0), xc = (cm) => xm(cm / 100);
const ROW0 = 282, DY = 56, ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.pow(1 - u, 3)), cl = (u) => Math.max(0, Math.min(1, u));
const m2 = (cm) => (cm / 100).toFixed(2);
window.frame = function (t) {
  const fade = t < 0.6 ? t / 0.6 : t > 14.3 ? cl((15 - t) / 0.7) : 1;
  const a = (from, dur = 0.5) => cl((t - from) / dur);
  let s = '<g opacity="' + fade.toFixed(3) + '">';
  s += '<text x="96" y="118" font-size="54" font-weight="600">Six families, six answers</text>';
  s += '<text x="96" y="166" font-size="25" style="fill:' + C.ink3 + '">The ' + D.T + '-year design wave at the Campos Basin, Brazil, from ' + D.years + ' years of daily maxima (' + D.y0 + '–' + D.y1 + ')</text>';
  /* the axis: a hairline of the grid, its labels in ink-3 */
  s += '<line x1="' + X0 + '" x2="' + X1 + '" y1="700" y2="700" stroke="' + C.grid + '" stroke-width="1.5"/>';
  for (let m = AX[0]; m <= AX[1] + 1e-9; m += 0.5) s += '<line x1="' + xm(m) + '" x2="' + xm(m) + '" y1="694" y2="706" stroke="' + C.grid + '" stroke-width="1.5"/><text class="m" x="' + xm(m) + '" y="732" font-size="18" text-anchor="middle">' + (Number.isInteger(m) ? m + ' m' : m.toFixed(1)) + '</text>';
  /* the record: a guide (2 3), with its words */
  const ar = a(1.0, 0.6);
  if (ar > 0) {
    const xr = xm(D.rec), yTop = 236 + (1 - ar) * 420;
    s += '<line x1="' + xr + '" x2="' + xr + '" y1="' + yTop + '" y2="686" stroke="' + C.guide + '" stroke-width="1.5" stroke-dasharray="2 3"/>';
    s += '<text class="m" x="' + (xr + 10) + '" y="250" font-size="18" opacity="' + ar + '">the hindcast’s largest day: ' + D.rec.toFixed(3) + ' m</text>';
  }
  /* the six rows: a decided level APPEARS at its place (ruled 2026-10-29: a value never travels; it appears or its
     enclosure narrows onto it — it used to slide from the record, twenty frames at levels nobody decided); a refusal is the void */
  D.fams.forEach((F, i) => {
    const y = ROW0 + i * DY, t0 = 2.0 + i * 0.75, u = ease(a(t0, 0.7));
    if (u <= 0) return;
    const isD = F.f === D.decided, picked = t >= 9.2;
    s += '<text x="' + (X0 - 34) + '" y="' + (y + 9) + '" font-size="25" text-anchor="end" opacity="' + u + '" font-weight="' + (isD && picked ? 600 : 400) + '">' + F.name + '</text>';
    if (F.refused) {
      s += '<defs><pattern id="h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="' + C.guide + '" stroke-width="1"/></pattern></defs>';
      s += '<rect x="' + X0 + '" y="' + (y - 14) + '" width="64" height="28" fill="url(#h)" stroke="' + C.guide + '" stroke-width="1" opacity="' + u + '"/>';
      s += '<text class="m" x="' + (X0 + 80) + '" y="' + (y + 6) + '" font-size="18" opacity="' + u + '">∅ refused: ' + F.refused + '</text>';
      return;
    }
    const x = (xc(F.lo) + xc(F.hi)) / 2, w = isD && picked ? 7 : 3.5;
    s += '<line x1="' + x + '" x2="' + x + '" y1="' + (y - 20) + '" y2="' + (y + 20) + '" stroke="' + C.ink + '" stroke-width="' + w + '" stroke-linecap="butt" opacity="' + u + '"/>';
    const lab = a(t0 + 0.6, 0.4);
    if (lab > 0) s += '<text class="m" x="' + (x + 14) + '" y="' + (y + 6) + '" font-size="19" opacity="' + lab + '" style="fill:' + (isD && picked ? C.ink : C.ink3) + '">' + m2(F.lo) + '–' + m2(F.hi) + ' m</text>';
  });
  /* the spread: decided from decided ends, so solid */
  const as = ease(a(7.0, 0.9));
  if (as > 0) {
    const y = ROW0 + 6 * DY - 12, xa = xc(D.lo), xb = xa + (xc(D.hi) - xa) * as;
    s += '<line x1="' + xa + '" x2="' + xb + '" y1="' + y + '" y2="' + y + '" stroke="' + C.ink + '" stroke-width="2"/>';
    s += '<line x1="' + xa + '" x2="' + xa + '" y1="' + (y - 8) + '" y2="' + (y + 8) + '" stroke="' + C.ink + '" stroke-width="2"/>';
    if (as >= 1) s += '<line x1="' + xb + '" x2="' + xb + '" y1="' + (y - 8) + '" y2="' + (y + 8) + '" stroke="' + C.ink + '" stroke-width="2"/>';
    const al = a(7.8, 0.5);
    if (al > 0) s += '<text x="' + ((xa + xc(D.hi)) / 2) + '" y="' + (y + 34) + '" font-size="22" text-anchor="middle" opacity="' + al + '">' + m2(D.spread) + ' m between the families’ answers</text>';
  }
  /* the decision, then the line it earns */
  const av = a(9.4, 0.6);
  const DF = D.fams.find((F) => F.f === D.decided);
  if (av > 0) s += '<text x="96" y="796" font-size="29" font-weight="550" opacity="' + av + '">Anderson–Darling decides: the ' + DF.name.charAt(0).toLowerCase() + DF.name.slice(1) + ', ' + m2(DF.lo) + '–' + m2(DF.hi) + ' m.</text>';
  const ac = a(11.2, 0.7);
  if (ac > 0) s += '<text x="96" y="834" font-size="23" opacity="' + ac + '" style="fill:' + C.ink3 + '">Every level here is exact. The choice of family moves the design wave by up to ' + m2(D.spread) + ' m.</text>';
  s += '<text class="m" x="96" y="876" font-size="15">solid: decided exactly · ∅: refused · fine vertical line: the hindcast’s largest day · levels rounded outward to the centimetre</text>';
  s += '<text class="m" x="1504" y="876" font-size="15" text-anchor="end">carlostoledo.co</text>';
  s += '</g>';
  document.getElementById('s').innerHTML = s;
};
window.frame(0);
</script></body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const sceneFile = path.join(OUT, 'campos-six-families.html');
fs.writeFileSync(sceneFile, html);
(async () => {
  const r = await renderVideo({ html: sceneFile, out: path.join(OUT, 'campos-six-families.mp4'), width: 1600, height: 900, fps: 30, seconds: 15,
    poster: { t: 12.5, out: path.join(OUT, 'campos-six-families.png') } });
  console.log('video-campos: ' + r.frames + ' frames -> ' + path.relative(ROOT, r.out) + ' · ' + fams.length + ' families, decided ' + decided
    + ' ' + m2(D.lo) + '–' + m2(D.hi) + ' m, spread ≤ ' + m2(spread) + ' m, record ' + rec + ' m');
})().catch((e) => die(e.stack || String(e)));
