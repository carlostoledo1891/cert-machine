#!/usr/bin/env node
/* scene.js — playground/black-hole/out/scene.json, the record the black-hole viewer reads.
   node playground/black-hole/scene.js            write it
   node playground/black-hole/scene.js --check    re-derive it and refuse unless the file on disk is identical

   playground/black-hole/ · cert-machine · 2026-10-31 (Phase 2; pre-registered in
   notes/black-hole-phase0-preregistration-2026-10-31.md, § Phase 2, before any view off 17° existed).

   WHAT IT HOLDS, and the standing of each:
     · the DECIDED shadow edge for every map the viewer can show (four spins at 17°, the two views off it at a = 47/50),
       as a COVER: interval boxes from Phase 0's decider (instruments/kerr/kerr.js evalBox on u-boxes, outward-rounded
       doubles), each at most BOX_MAX M across in α and in β, a box dropped only where it is PROVEN off the curve
       (r u² > 4 or β² < 0). The viewer draws one solid stroke through the box centres; `strokeM` is the stroke's
       width in M, and it is at least twice `maxDistM`, the largest distance from any corner of any box to the drawn
       polyline (float, with slack). So every point of the true curve lies inside the drawn line.
     · the COMPUTED maps the viewer shades: their file names and sha256, read from corpus/bh-maps/manifest.json, and
       each map's grade, read from certs/bh-maps-check.json (a map that does not AGREE is refused here).
     · the numbers the page prints from Phase 0 are NOT copied here: the page reads them from certs/bh-shadow.json
       itself (W.val), so there is one copy.                                                                       */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const HERE = __dirname;
const ROOT = path.join(HERE, '..', '..');
const K = require(path.join(ROOT, 'instruments', 'kerr', 'kerr.js'));
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const A = require(path.join(ROOT, 'instruments', 'interval', 'algebraic.js'));
const Q = require(path.join(ROOT, 'instruments', 'interval', 'rational.js'));
const OUT = path.join(HERE, 'out', 'scene.json');
const MAN = 'corpus/bh-maps/manifest.json', CHECK = 'certs/bh-maps-check.json', SHADOW = 'certs/bh-shadow.json';
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const shaOf = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const die = (m) => { console.error('black-hole scene: REFUSED — ' + m); process.exit(1); };

const BOX_MAX = 0.02;          /* M: the widest a cover box may be, in α and in β */
const KNOT = 0.1;              /* M: the drawn polyline keeps a box centre once it is this far from the last kept one */
const STROKE_MIN = 0.12;       /* M: the drawn line is never thinner than this (1.5 px at 512 px over 40 M) */

const pq = (s) => (s.includes('/') ? Q.R(BigInt(s.split('/')[0]), BigInt(s.split('/')[1])) : Q.R(BigInt(s)));

/* the cover of the critical curve at spin s (a rational string) and inclination deg (a decimal string) */
function cover(s, deg) {
  const Ab = K.qIv(pq(s)), th = K.incl(deg);
  const boxes = [];
  let evals = 0;
  const visit = (u0, u1, depth) => {
    evals++;
    const e = K.evalBox(Ab, I.iv(u0, u1), th);
    if (e.ru2[0] > 4 || e.b2[1] < 0) return;                         /* proven off the curve */
    const bHi = A.sqrtInterval(I.iv(Math.max(0, e.b2[1])))[1];
    const bLo = e.b2[0] > 0 ? A.sqrtInterval(I.iv(e.b2[0]))[0] : 0;
    const wA = e.alpha[1] - e.alpha[0], wB = bHi - bLo;
    if ((wA > BOX_MAX || wB > BOX_MAX) && depth < 60) { const m = (u0 + u1) / 2; visit(u0, m, depth + 1); visit(m, u1, depth + 1); return; }
    if (wA > BOX_MAX || wB > BOX_MAX) throw new Error('cover: a box would not shrink below ' + BOX_MAX + ' M at u = ' + u0);
    boxes.push({ u0, a: [e.alpha[0], e.alpha[1]], b: [bLo, bHi] });
  };
  const n0 = 256;
  for (let k = 0; k < n0; k++) visit(-2 + 4 * k / n0, -2 + 4 * (k + 1) / n0, 0);   /* dyadic ends: exact */
  if (!boxes.length) throw new Error('cover: empty at ' + s + ', ' + deg + '°');
  boxes.sort((x, y) => x.u0 - y.u0);
  /* the closed traversal: the upper half (β ≥ 0) by increasing u, then the mirror (β ≤ 0) back; each box with its
     mirror image is part of the cover */
  const up = boxes.map((b) => ({ a: b.a, b: b.b })), dn = boxes.slice().reverse().map((b) => ({ a: b.a, b: [-b.b[1], -b.b[0]] }));
  const all = up.concat(dn);
  const ctr = (b) => [(b.a[0] + b.a[1]) / 2, (b.b[0] + b.b[1]) / 2];
  const r4 = (x) => Math.round(x * 1e4) / 1e4;
  const knots = [];
  let last = null;
  all.forEach((b, i) => {
    const c = ctr(b);
    if (!last || Math.hypot(c[0] - last[0], c[1] - last[1]) >= KNOT || i === all.length - 1) { last = c; knots.push([r4(c[0]), r4(c[1])]); }
  });
  knots.push(knots[0]);                                              /* closed */
  /* the farthest any corner of any box lies from the drawn polyline (float, a bound with slack added below) */
  const segDist = (p, q, x) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = dx * dx + dy * dy;
    let t = L ? ((x[0] - p[0]) * dx + (x[1] - p[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(x[0] - p[0] - t * dx, x[1] - p[1] - t * dy); };
  let maxDist = 0, seg = 0;
  for (const b of all) {
    const c = ctr(b);
    /* the nearest segment around the box: search a window of segments near the last one */
    let best = Infinity, bestK = seg;
    for (let k = Math.max(0, seg - 4); k < Math.min(knots.length - 1, seg + 40); k++) {
      const d = segDist(knots[k], knots[k + 1], c); if (d < best) { best = d; bestK = k; }
    }
    seg = bestK;
    let worst = 0;
    for (const x of [[b.a[0], b.b[0]], [b.a[0], b.b[1]], [b.a[1], b.b[0]], [b.a[1], b.b[1]]]) {
      let d = Infinity;
      for (let k = Math.max(0, seg - 4); k < Math.min(knots.length - 1, seg + 6); k++) d = Math.min(d, segDist(knots[k], knots[k + 1], x));
      worst = Math.max(worst, d);
    }
    maxDist = Math.max(maxDist, worst);
  }
  maxDist = maxDist * (1 + 1e-9) + 1e-6;
  const maxBox = Math.max(...all.map((b) => Math.max(b.a[1] - b.a[0], b.b[1] - b.b[0])));
  const strokeM = Math.max(STROKE_MIN, Math.ceil(2 * maxDist * 1000) / 1000);
  return { boxes: all.length, evaluations: evals, maxBoxM: Number(maxBox.toExponential(3)), maxDistM: Number(maxDist.toExponential(3)),
    strokeM, knots: knots.length, points: knots.flat() };
}

function derive() {
  const man = read(MAN), chk = read(CHECK), sh = read(SHADOW);
  if (chk.verdict !== 'AGREES') die(CHECK + ' does not AGREE');
  if (chk.maps.manifestSha256 !== shaOf(MAN)) die('the check record was made on another manifest');
  const views = [];
  const add = (key, s, deg, grade) => {
    if (!grade || ['retrace', 'closedForm', 'pointwise', 'texture', 'convergence'].some((k) => grade[k].verdict !== 'AGREES')) die('the map ' + key + ' does not AGREE in ' + CHECK);
    const tagS = 'a' + s.replace('/', '_') + (deg === '17' ? '' : '-i' + deg);
    const files = {};
    for (const n of ['n0', 'n1', 'n2', 'fate']) {
      const name = tagS + (n === 'fate' ? '-fate.u8.gz' : '-' + n + '.rpg.f16.gz');
      const f = man.files[name];
      if (!f) die('no file ' + name + ' in the manifest');
      if (shaOf('corpus/bh-maps/' + name) !== f.sha256) die(name + ' is not the pinned file');
      files[n] = { name, sha256: f.sha256, rawSha256: f.rawSha256, bytes: f.bytes };
    }
    const iscoKey = s + ' pro';
    if (!sh.enclosures.isco.at[iscoKey]) die('no ISCO enclosure for ' + iscoKey);
    views.push({ key, spin: s, inclinationDeg: deg, model: deg !== '17', riscoUsed: man.disk.riscoUsed[s], iscoKey, files, curve: cover(s, deg) });
  };
  for (const s of man.spins) add(s, s, '17', chk.checks.perSpin[s]);
  for (const v of man.views) add(v.key, v.spin, v.inclinationDeg, chk.checks.perView[v.key]);
  return {
    what: 'the black-hole viewer\'s scene (Phase 2): for every map it can show, the files it shades (COMPUTED, graded AGREES in ' + CHECK + ') and the DECIDED shadow edge as a cover of interval boxes from Phase 0\'s decider, drawn as one solid stroke at least as wide as twice the farthest box corner from its polyline',
    generatedBy: 'node playground/black-hole/scene.js',
    inputs: { [MAN]: shaOf(MAN), [CHECK]: shaOf(CHECK), [SHADOW]: shaOf(SHADOW), 'instruments/kerr/kerr.js': shaOf('instruments/kerr/kerr.js') },
    grid: man.grid, defaultSpin: man.defaultSpin, cover: { boxMaxM: BOX_MAX, knotM: KNOT, strokeMinM: STROKE_MIN,
      rule: 'every box of the cover lies within maxDistM of the drawn polyline; the stroke is strokeM ≥ 2·maxDistM wide, so the curve, which lies in the union of the boxes, lies inside the drawn line' },
    views
  };
}

module.exports = { derive, OUT };

if (require.main === module) {
  const rec = derive();
  const text = JSON.stringify(rec, null, 1) + '\n';
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== text) die(path.relative(ROOT, OUT) + ' does not re-derive identically');
    console.log('black-hole scene: PASS — re-derives; ' + rec.views.length + ' views, every one AGREES');
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, text);
    console.log('wrote ' + path.relative(ROOT, OUT) + ': ' + rec.views.map((v) => v.key + ' (' + v.curve.boxes + ' boxes, ' + v.curve.knots + ' knots, max box ' + v.curve.maxBoxM + ' M, stroke ' + v.curve.strokeM + ' M)').join('; '));
  }
}
