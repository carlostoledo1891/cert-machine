/* maps.js — the scenes of /grammar/ that teach a MAP: cells, a region named in words, sites with a word each, a reach
   drawn as a band, and a model's field.
   tools/grammar-scenes/ · cert-machine · 2026-10-30

   Each scene is drawn from an instrument's tracked records, read at build: the return-level atlas's ledger
   (certs/hseva-atlas.json over corpus/ww3-grid/meta.json), Janela's public ledger (certs/janela-ledger/), the glide
   band's pinned flight and airfields (apps/glide-band/data/), and Swell's island model (apps/swell/data/). Coasts come
   from data the apps already ship: Natural Earth 1:50m land (corpus/basemap/, pinned by sha256) for the ocean maps, and
   the island model's own sea mask for Florianópolis. Every check a scene runs is a guard of the page; its plain words
   are the figure's stop sentence.

   PROJECTIONS, each stated on its figure: plate carrée for the Brazilian margin (a 1° cell is a square), an
   equirectangular map true to scale at 48° S for the claim south of South America, an azimuthal equidistant map
   centred on the aircraft for the glide band (a distance from the aircraft is a distance on the page), and the island
   model's own 60 m grid for Swell. A coast is clipped to the frame and simplified by Douglas–Peucker at a stated
   tolerance in drawing units.                                                                                  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const PL = require(path.join(ROOT, 'tools', 'build-grammar-plates.js'));
const GAL = require(path.join(ROOT, 'tools', 'build-grammar-gallery.js'));
const { PLAIN, PW, PH } = GAL;
const { f1, line, t, mood, eyebrow, svg, makeGuard } = GAL.atoms;
const esc = C.esc;

/* ------------------------------------------------------------- reading -- */
const abs = (rel) => path.join(ROOT, rel);
const readJSON = (rel) => JSON.parse(fs.readFileSync(abs(rel), 'utf8'));
const shaOf = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const sha = (rel) => shaOf(fs.readFileSync(abs(rel)));
const fin2 = (q) => Array.isArray(q) && q.length === 2 && q.every((x) => typeof x === 'number' && Number.isFinite(x));

/* ------------------------------------------------------------- drawing -- */
const T_ADV = 6.9;                                   /* t-note's advance per character, as the gallery measures it */
const rect = (x, y, w, h, a) => '    <rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" ' + a + '/>';
const pathEl = (d, a) => '    <path d="' + d + '" ' + a + '/>';
const ital = (x, y, s, anchor) => mood(x, y, s, anchor);
/* the three verdict shapes every scene here shares: the claim decided true (filled), decided false (a ring), and not
   decided (half filled). A verdict is a word and a shape, never a stroke pattern (rule 1) and never a colour alone. */
const YES = 'yes', NO = 'no', OPEN = 'open';
function mark(x, y, v, r) {
  r = r || 3.6;
  if (v === YES) return '    <circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" fill="var(--ink)" stroke="var(--ink)" stroke-width="1"/>';
  if (v === NO) return '    <circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" fill="var(--sunk)" stroke="var(--ink)" stroke-width="1.4"/>';
  return '    <circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" fill="var(--sunk)" stroke="var(--ink)" stroke-width="1.4"/>\n'
    + '    <path d="M' + f1(x) + ',' + f1(y - r) + 'A' + r + ',' + r + ' 0 0 1 ' + f1(x) + ',' + f1(y + r) + 'Z" fill="var(--ink)"/>';
}
/* many marks at once, one path per kind, so a field of hundreds of places stays small: a dot is a zero-length segment
   with round caps, a ring is an ink dot under a smaller ground dot, and the undecided half is an arc */
const dots = (pts) => pts.map((q) => 'M' + f1(q.x) + ',' + f1(q.y) + 'h0').join('');
const half = (x, y, r) => 'M' + f1(x) + ',' + f1(y - r) + 'a' + r + ',' + r + ' 0 0 1 0,' + 2 * r + 'z';
const capDots = (pts, w, ink) => pathEl(dots(pts), 'fill="none" stroke="' + ink + '" stroke-width="' + w + '" stroke-linecap="round"');
function marks(pts, r) {
  const by = (v) => pts.filter((q) => q.v === v), ring = by(NO).concat(by(OPEN)), out = [];
  if (by(YES).length) out.push(capDots(by(YES), 2 * r, 'var(--ink)'));
  if (ring.length) out.push(capDots(ring, 2 * r, 'var(--ink)'), capDots(ring, 2 * r - 2.2, 'var(--sunk)'));
  if (by(OPEN).length) out.push(pathEl(by(OPEN).map((q) => half(q.x, q.y, r - 0.3)).join(''), 'fill="var(--ink)" stroke="none"'));
  return out;
}
/* a dot in the usual panel's one ink */
const dot = (x, y, r) => '    <circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + (r || 3.2) + '" fill="var(--ink-2)"/>';

/* Douglas–Peucker on an open or closed polyline, tolerance in drawing units */
function simplify(pts, tol) {
  if (pts.length < 3) return pts.slice();
  /* a closed ring has no baseline: split it at the vertex farthest from its first, and simplify the two halves */
  const n = pts.length - 1;
  if (Math.hypot(pts[0][0] - pts[n][0], pts[0][1] - pts[n][1]) < 1e-9) {
    let k = 1, best = -1;
    for (let i = 1; i < n; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > best) { best = d; k = i; } }
    if (best <= 0) return [pts[0], pts[n]];
    return simplify(pts.slice(0, k + 1), tol).concat(simplify(pts.slice(k), tol).slice(1));
  }
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let best = -1, bi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-12;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > best) { best = d; bi = i; } }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
/* Sutherland–Hodgman: a ring clipped to an axis-aligned box (the box is convex, so the result is the ring's part in it) */
function clipRing(ring, [x0, y0, x1, y1]) {
  const edges = [[(p) => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1]]];
  let out = ring;
  for (const [inside, cut] of edges) {
    const src = out; out = [];
    for (let i = 0; i < src.length; i++) {
      const a = src[i], b = src[(i + 1) % src.length];
      if (inside(b)) { if (!inside(a)) out.push(cut(a, b)); out.push(b); } else if (inside(a)) out.push(cut(a, b));
    }
    if (!out.length) return [];
  }
  return out;
}
const dOf = (pts, close) => 'M' + pts.map(([x, y]) => f1(x) + ',' + f1(y)).join('L') + (close ? 'Z' : '');
/* Natural Earth 1:50m land in a lon/lat box, projected, clipped to the frame and simplified: one path, filled, no
   stroke (a clipped edge is the frame's, not a coast) */
const LAND = 'corpus/basemap/ne_50m_land.geojson';
let LANDG = null;
function land(box, proj, frame, tol) {
  if (!LANDG) {
    const pins = readJSON('corpus/basemap/PINS.json');
    const bytes = fs.readFileSync(abs(LAND));
    if (shaOf(bytes) !== pins.files['ne_50m_land.geojson'].sha256) throw new Error('maps: the land polygons are not the pinned bytes');
    LANDG = JSON.parse(bytes);
  }
  const [lo0, la0, lo1, la1] = box, parts = [];
  for (const f of LANDG.features) for (const poly of (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates)) {
    const r = poly[0];
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    for (const [x, y] of r) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); }
    if (b < lo0 || a > lo1 || d < la0 || c > la1) continue;
    const pr = clipRing(r.map(([x, y]) => proj(x, y)), frame);
    if (pr.length < 3) continue;
    const s = simplify(pr.concat([pr[0]]), tol);
    if (s.length >= 4) parts.push(dOf(s.slice(0, -1), true));
  }
  return parts.join('');
}
const landFill = 'fill="var(--rule-strong)" stroke="var(--ink-5)" stroke-width="0.8" stroke-linejoin="round"';
/* a hairline frame round a map, a guide: it says nothing */
const frameRect = (x0, y0, x1, y1) => rect(x0, y0, x1 - x0, y1 - y0, 'fill="none" stroke="var(--rule-strong)" stroke-width="1"');

/* ============================================================ 1. a map of cells ==
   The return-level atlas on the Brazilian margin: the 100-year significant wave height at each 1° cell, from monthly
   maxima, the family Anderson–Darling decides. A cell whose choice is refused keeps its square, as a void. */
function atlasCells(guard) {
  guard = makeGuard(guard);
  const REC = 'certs/hseva-atlas.json', META = 'corpus/ww3-grid/meta.json';
  const SH = require(path.join(ROOT, 'playground', 'return-level-atlas', 'shared.js'));
  const L = readJSON(REC), M = readJSON(META);
  const STOP = 'the ledger was not made from this corpus, a cell of the Brazilian lattice loses its record, or a refused cell stops being one the ledger refuses';
  guard(STOP, L.corpus && L.corpus.sha256 === sha(META), 'corpus sha');
  const rec = new Map(L.cells.map((c) => [c.id, c]));
  const BLK = 'monthly', TT = 100;
  const YEARS = +M.last.slice(0, 4) - +M.first.slice(0, 4) + 1;
  guard(STOP, YEARS === 32, M.first + ' to ' + M.last);
  const cells = M.cells.filter((c) => c.sets.includes('brazil1') && c.status === 'sea').map((c) => {
    const r = rec.get(c.id);
    guard(STOP, !!r, c.id + ' has no record');
    const b = r.blocks[BLK], ad = b.rank.ad;
    if (ad === 'R') return { c, code: 'nofam' };
    const lv = b.fits[ad]['l' + TT];
    if (!fin2(lv) || !(lv[0] <= lv[1])) return { c, code: 'nolevel' };
    return { c, v: lv[1], K: SH.rampK(lv[1], SH.WAVE_BR) };
  });
  const refused = cells.filter((x) => x.code), nofam = refused.filter((x) => x.code === 'nofam').length, nolevel = refused.length - nofam;
  guard(STOP, cells.length > 700 && refused.length >= 1 && refused.length <= 20, cells.length + ' cells, ' + refused.length + ' refused');
  const decided = cells.filter((x) => !x.code);
  const top = Math.max(...decided.map((x) => x.v));
  const BR = SH.WAVE_BR, LAB = BR.map((b, k) => (k === BR.length - 1 ? '≥ ' + b : b + '–' + BR[k + 1]) + ' m');
  LAB[0] = '< ' + BR[1] + ' m';
  const used = new Set(decided.map((x) => x.K));
  /* plate carrée: a 1° cell is a square of S units */
  const S = 5.4, LON0 = -56.5, LAT1 = 6.5, X0 = 14, Y0 = 52;
  const px = (lon) => X0 + (lon - LON0) * S, py = (lat) => Y0 + (LAT1 - lat) * S;
  const x1 = px(-25.5), y1 = py(-36.5);
  const coast = land([-58, -38, -24, 8], (lo, la) => [px(lo), py(la)], [X0, Y0, x1, y1], 0.6);
  /* the field: runs of cells of one step along a row, one path per step */
  const field = (look) => {
    const by = {};
    for (const x of cells) { const k = look(x); if (k !== null) (by[k] = by[k] || []).push(x.c); }
    return Object.entries(by).map(([k, cs]) => {
      const rows = {}; for (const c of cs) (rows[c.lat] = rows[c.lat] || []).push(c.lon);
      let d = '';
      for (const [lat, lons] of Object.entries(rows)) {
        lons.sort((a, b) => a - b);
        let s = lons[0], p = lons[0];
        const flush = () => { d += 'M' + f1(px(s - 0.5)) + ',' + f1(py(+lat + 0.5)) + 'h' + f1((p - s + 1) * S) + 'v' + f1(S) + 'h' + f1(-(p - s + 1) * S) + 'z'; };
        for (const lon of lons.slice(1)) { if (lon === p + 1) p = lon; else { flush(); s = p = lon; } }
        flush();
      }
      return pathEl(d, 'fill="var(--c-s' + (+k + 1) + ')" stroke="none"');
    });
  };
  /* the key: the ramp's steps a cell here falls in */
  const KX = 214;
  const key = (warr) => {
    const out = [t(KX, 62, '100-year wave, metres', 't-ax')];
    let y = 80;
    for (let k = 0; k < BR.length; k++) {
      if (!used.has(k) && !(k === 0)) continue;
      out.push(rect(KX, y - 9, 18, 11, 'fill="var(--c-s' + (k + 1) + ')"'), t(KX + 26, y, LAB[k], 't-note'));
      y += 17;
    }
    return { out, y };
  };
  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn'), pathEl(coast, landFill)];
    /* a refused cell read as zero: it lands in the lowest step, beside the calm cells */
    out.push(...field((x) => (x.code ? 0 : x.K)));
    out.push(frameRect(X0, Y0, x1, y1));
    const k = key(false); out.push(...k.out);
    out.push(t(KX, k.y + 12, cells.length + ' cells, 1° each', 't-note'));
    out.push(t(X0, 40, 'Brazilian margin · monthly maxima', 't-ax'));
    return svg(PW, PH, 'As usually drawn: the Brazilian margin as ' + cells.length + ' one-degree cells, each shaded by its 100-year significant wave height on a five-step grey scale. The ' + refused.length + ' cells with no decided level are filled as zero, in the lowest step, and look like calm sea.', out);
  })();
  const warrant = (() => {
    const h = PL.hatch(), out = [h.def, eyebrow(8, 14, 'in warrant'), pathEl(coast, landFill)];
    out.push(...field((x) => (x.code ? null : x.K)));
    for (const x of refused) out.push(PL.voidRect(h, px(x.c.lon - 0.5), py(x.c.lat + 0.5), S, S).replace('stroke="var(--rule-strong)"', 'stroke="var(--ink-3)"'));
    /* each void ringed, so a reader finds a five-unit hole */
    for (const x of refused) out.push('    <circle cx="' + f1(px(x.c.lon)) + '" cy="' + f1(py(x.c.lat)) + '" r="6.4" fill="none" stroke="var(--ink-3)" stroke-width="1"/>');
    out.push(frameRect(X0, Y0, x1, y1));
    const k = key(true); out.push(...k.out);
    let y = k.y + 6;
    out.push(PL.voidRect(h, KX, y - 9, 18, 11), t(KX + 26, y, '∅ refused, ' + refused.length + ' cells:', 't-note'));
    out.push(t(KX + 26, y + 15, nofam + ' no family decided', 't-note'), t(KX + 26, y + 30, nolevel + ' level not enclosed', 't-note'));
    out.push(ital(KX, y + 52, 'given monthly maxima'));
    out.push(t(X0, 40, 'decided cells shaded · refused cells void', 't-ax'));
    return svg(PW, PH, 'In WARRANT: the same ' + cells.length + ' cells. The ' + decided.length + ' whose 100-year level the ledger encloses are shaded on the five-step scale; each enclosure is narrower than a centimetre, so the shade is decided. The ' + refused.length + ' refused cells keep their full square as a hatched void, ringed, ' + nofam + ' because Anderson–Darling decides no family there and ' + nolevel + ' because the decided family\'s level has no enclosure. The block, monthly maxima, is a chosen input, named in italic.', out);
  })();
  return {
    id: 'atlas-cells', title: 'A map of cells', form: 'a map of cells', kind: 'record', record: [REC, META], stop: STOP, usual, warrant,
    link: 'instruments/return-level-atlas/map/',
    hides: 'The usual map fills every cell. A cell where no family could be decided gets a zero, lands in the lowest shade, and reads as the calmest sea on the coast. Here a refused cell keeps its full square as a void with its reason, and the shades are only the cells the ledger decides.',
    caption: 'The return-level atlas on the Brazilian margin: the 100-year significant wave height at each of ' + cells.length + ' one-degree cells, from ' + YEARS + ' years of the hindcast’s monthly maxima, by the family Anderson–Darling decides there. The shade is the level’s certified upper end on the atlas’s own five steps (the highest here ' + OUT_UP(top) + ' m). Plate carrée; the coast is Natural Earth 1:50m, simplified by Douglas–Peucker to 0.6 drawing units.',
    rule: 'Shade a cell only where its value is decided, and draw a refused cell as a void the size of a cell, with its reason in words, never as zero.',
  };
}
/* a level's upper end printed outward to the centimetre (rule 8) */
const OUT_UP = (v) => (Math.ceil(v * 100) / 100).toFixed(2);

/* ===================================================== 2. a region named in words ==
   A paper's sentence about a region ("the coastal region south of South America") becomes a box only by a reading.
   The atlas decides the claim for its box and again with each edge moved one 4° cell; this is the one claim whose
   verdict turns on the box. */
function claimBox(guard) {
  guard = makeGuard(guard);
  const REC = 'certs/hseva-atlas.json', META = 'corpus/ww3-grid/meta.json';
  const AC = require(path.join(ROOT, 'instruments', 'hseva', 'atlas-claims.js'));
  const L = readJSON(REC), M = readJSON(META);
  const STOP = 'the claim’s verdict for its box, or for a box with one edge moved one cell, stops being what the atlas’s own rule decides from the ledger, or the verdict stops turning on the box';
  guard(STOP, L.corpus && L.corpus.sha256 === sha(META), 'corpus sha');
  const K = AC.CLAIMS.find((q) => q.id === 'gg-south-america-daily');
  guard(STOP, !!K, 'claim missing');
  const rec = new Map(L.cells.map((c) => [c.id, c]));
  const sea = M.cells.filter((c) => c.status === 'sea').map((c) => Object.assign({}, c, { blocks: rec.get(c.id).blocks }));
  const inK = (box) => sea.filter((c) => c.sets.includes(K.set) && AC.inBox(c, box));
  const here = K.decide({ cells: inK(K.box) });
  /* the eight readings: each edge one 4° cell in and one out, the atlas page's rule */
  const reads = [];
  for (const [ax, i, edge] of [['lat', 0, 'south'], ['lat', 1, 'north'], ['lon', 0, 'west'], ['lon', 1, 'east']]) for (const d of [-4, 4]) {
    const box = JSON.parse(JSON.stringify(K.box)); box[ax][i] += d;
    reads.push({ ax, i, edge, d, box, verdict: K.decide({ cells: inK(box) }).verdict });
  }
  const flips = reads.filter((r) => r.verdict !== here.verdict);
  const Q1 = 'the Generalized Gamma gains prominence', Q2 = 'along the coastal region south of South America';
  guard(STOP, K.quote.includes(Q1 + ' ' + Q2) && /daily/.test(K.quote) && K.blocks.join() === 'daily', 'the quote');
  const deg = (a, h) => Math.abs(a[1]) + '–' + Math.abs(a[0]) + '° ' + h;            /* [−58, −40] → 40–58° S */
  const BOXW = deg(K.box.lat, 'S') + ', ' + deg(K.box.lon, 'W');
  const by = here.counts[0].by, n = here.counts[0].n;
  guard(STOP, here.verdict === AC.VERDICTS.F && flips.length === 2 && flips.every((r) => r.verdict === AC.VERDICTS.H)
    && (by.expweibull || 0) > (by.gengamma || 0) && here.counts[0].refused === 0, here.verdict + ' ' + flips.length);
  /* the drawn cells: the 4° lattice from 60° S to 36° S and 84° W to 48° W, sea or sea ice */
  const R = { lat: [-60, -36], lon: [-84, -48] };
  const cells = M.cells.filter((c) => c.sets.includes('global4') && c.lat >= R.lat[0] && c.lat <= R.lat[1] && c.lon >= R.lon[0] && c.lon <= R.lon[1])
    .map((c) => ({ c, f: c.status === 'sea' ? rec.get(c.id).blocks.daily.rank.ad : 'ice' }));
  /* equirectangular, true to scale at 48° S */
  const S = 7.8, KX = Math.cos(48 * Math.PI / 180), LON0 = -86, LAT1 = -34, X0 = 12, Y0 = 72;
  const px = (lon) => X0 + (lon - LON0) * S * KX, py = (lat) => Y0 + (LAT1 - lat) * S;
  const x1 = px(-46), y1 = py(-62);
  /* a box is drawn round the cells it counts: a cell counts when its centre lies in the box, edges included, and the
     lattice's centres are multiples of 4°, so the drawn edge runs 2° past the outermost centre, along the cells' gap */
  const edgesOf = (b) => ({ lat: [Math.ceil(b.lat[0] / 4) * 4 - 2, Math.floor(b.lat[1] / 4) * 4 + 2], lon: [Math.ceil(b.lon[0] / 4) * 4 - 2, Math.floor(b.lon[1] / 4) * 4 + 2] });
  const coast = land([-90, -62, -40, -30], (lo, la) => [px(lo), py(la)], [X0, Y0, x1, y1], 0.6);
  const cw = 4 * S * KX * 0.92, chh = 4 * S * 0.92;
  const cell = (c, a) => rect(px(c.lon) - cw / 2, py(c.lat) - chh / 2, cw, chh, a);
  const GG = 'fill="var(--ink-2)"', EW = 'fill="none" stroke="var(--ink-2)" stroke-width="1.4"', OTH = 'fill="var(--ink-5)"';
  const famMark = (x) => (x.f === 'gengamma' ? cell(x.c, GG) : x.f === 'expweibull' ? cell(x.c, EW) : cell(x.c, OTH));
  const KXX = 240;
  const keyRows = (y) => [cell({ lon: 0, lat: 0 }, GG).replace(/x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"/, 'x="' + KXX + '" y="' + (y - 9) + '" width="12" height="12"'),
    t(KXX + 18, y + 1, 'gen. gamma', 't-note'),
    rect(KXX + 0.7, y + 8.7, 10.6, 10.6, EW), t(KXX + 18, y + 19, 'exp. Weibull', 't-note'),
    rect(KXX, y + 27, 12, 12, OTH), t(KXX + 18, y + 37, 'other family', 't-note')];
  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn'), pathEl(coast, landFill)];
    for (const x of cells) if (x.f !== 'ice' && x.f !== 'R') out.push(famMark(x));
    out.push(frameRect(X0, Y0, x1, y1), ...keyRows(Y0 + 10));
    out.push(t(8, 36, '“' + Q1, 't-ax'), t(8, 52, Q2 + '”', 't-ax'));
    out.push(t(KXX, Y0 + 70, 'daily maxima', 't-note'));
    return svg(PW, PH, 'As usually drawn: the four-degree cells south of South America, each marked by the family Anderson–Darling decides on daily maxima, filled for the generalized gamma, hollow for the exponentiated Weibull, dim for any other; the paper’s sentence sits above it, and the eye decides whether the generalized gamma has prominence there. Cells under sea ice are left blank.', out);
  })();
  const warrant = (() => {
    const h = PL.hatch(), out = [h.def, eyebrow(8, 14, 'in warrant'), pathEl(coast, landFill)];
    for (const x of cells) out.push(x.f === 'ice' || x.f === 'R' ? PL.voidRect(h, px(x.c.lon) - cw / 2, py(x.c.lat) - chh / 2, cw, chh) : famMark(x));
    /* the box the words were read as, dotted: a reading is a choice */
    const B = edgesOf(K.box);
    out.push(rect(px(B.lon[0]), py(B.lat[1]), px(B.lon[1]) - px(B.lon[0]), py(B.lat[0]) - py(B.lat[1]), W.attrs(W.CHOSEN, { width: 2 })));
    /* the two readings one cell away whose verdict differs, each a dotted edge where it would run */
    const tag = (x, y, s) => ['    <rect x="' + f1(x - 2) + '" y="' + f1(y - 10) + '" width="' + f1(s.length * T_ADV + 4) + '" height="13" rx="2" fill="var(--sunk)"/>', t(x, y, s, 't-note')].join('\n');
    for (const r of flips) {
      const b = edgesOf(r.box);
      if (r.ax === 'lat') { const y = py(b.lat[r.i]); out.push(line(px(b.lon[0]), y, px(b.lon[1]), y, W.attrs(W.CHOSEN, { width: 1.2 })), tag(px(b.lon[1]) + 4, y + 4, 'holds')); }
      else { const x = px(b.lon[r.i]); out.push(line(x, py(b.lat[0]), x, py(b.lat[1]), W.attrs(W.CHOSEN, { width: 1.2 })), tag(x - 18, py(b.lat[0]) + 13, 'holds')); }
    }
    out.push(frameRect(X0, Y0, x1, y1), ...keyRows(Y0 + 10));
    out.push(PL.voidRect(h, KXX, Y0 + 55, 12, 12), t(KXX + 18, Y0 + 65, '∅ sea ice', 't-note'));
    let y = Y0 + 94;
    out.push(t(KXX, y, 'in the box:', 't-ax'), t(KXX, y + 16, 'exp. Weibull ' + (by.expweibull || 0), 't-note'), t(KXX, y + 31, 'gen. gamma ' + (by.gengamma || 0), 't-note'));
    out.push(t(KXX, y + 51, 'does not hold', 't-lab'));
    out.push(t(KXX, y + 75, flips.length + ' of ' + reads.length + ' readings', 't-note'), t(KXX, y + 90, 'one cell away hold', 't-note'));
    out.push(t(8, 36, 'the claim as a box: dotted, a reading', 't-ax'));
    out.push(ital(8, 54, 'given ' + BOXW + ' for “south of South America”'));
    return svg(PW, PH, 'In WARRANT: the same cells and families, cells under sea ice hatched as voids. The box the paper’s words were read as, ' + BOXW + ', is drawn dotted, a chosen reading named in italic. Inside it the exponentiated Weibull is decided at ' + (by.expweibull || 0) + ' cells and the generalized gamma at ' + (by.gengamma || 0) + ', so the claim does not hold for this box. Two thinner dotted edges mark the readings one cell away, the north edge moved south or the east edge moved west, under which it holds.', out);
  })();
  return {
    id: 'claim-box', title: 'A region named in words', form: 'a claim’s region on a map', kind: 'record', record: [REC, META], stop: STOP, usual, warrant,
    link: 'instruments/return-level-atlas/',
    hides: 'The usual map puts a sentence over a picture and lets the eye agree. A region named in words has no edge until someone reads one in. Here the box is drawn dotted as the reading it is, the count inside it decides the claim, and the readings one cell away that change the verdict are drawn too.',
    caption: 'Reis, Guimarães et al. (2026, ' + esc(K.cite) + ') on daily maxima: “' + Q1 + ' ' + Q2 + '”. The atlas reads it as the ' + n + ' certified four-degree cells whose centres lie in ' + BOXW + ', and decides it by the paper’s own family choice in each. With each edge moved one cell in or out, ' + (reads.length - flips.length) + ' of ' + reads.length + ' readings agree and ' + flips.length + ' hold. Equirectangular, true to scale at 48° S; the coast is Natural Earth 1:50m, simplified by Douglas–Peucker to 0.6 drawing units.',
    rule: 'Draw a region that a sentence names as a dotted box, the reading it is, decide the claim inside it, and show the readings one step away when they change the verdict.',
  };
}

/* ======================================================== 3. sites with a word ==
   Janela's open-sea sites, at one forecast step, against one operation's wave limit: each site's word decided over
   the band Janela committed to its public ledger. */
const JANELA_NAME = { 'foz-amazonas': 'Foz Amazonas', potiguar: 'Potiguar', sergipe: 'Sergipe', 'espirito-santo': 'Esp. Santo',
  'campos-p25': 'P-25', campos: 'Campos', santos: 'Santos', floripa: 'Florianópolis', pelotas: 'Pelotas' };
function janelaSites(guard) {
  guard = makeGuard(guard);
  const REC = 'certs/janela-ledger/202610.jsonl', SITES = 'apps/janela/scenario/sites.json';
  /* chosen: the run of 29 October 00 UTC, 48 hours ahead, and the lifting example's limit, Hs at most 1.5 m */
  const RUN = '2026-10-29T00', LEAD = 48, LIMIT = [3n, 2n], LIMIT_S = '1.5';
  const STOP = 'a site’s band stops being the one Janela committed for this run, or a site’s word stops following from its band and the limit by exact comparison, or the three words stop all occurring';
  const rows = fs.readFileSync(abs(REC), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const sitesDef = readJSON(SITES).sites;
  const P = require(path.join(ROOT, 'apps', 'janela', 'app', 'model.js')).PRESETS;
  const lift = P.find((p) => p.id === 'icamento');
  guard(STOP, lift && lift.limits.some((l) => l.var === 'hs' && l.op === '<=' && l.value === LIMIT_S) && lift.kind === 'example', 'the lifting limit');
  const fr = (s) => (Array.isArray(s) ? [BigInt(s[0]), BigInt(s[1])] : ((p) => [BigInt(p[0]), BigInt(p[1] || '1')])(String(s).split('/')));
  const cmp = (a, b) => { const l = a[0] * b[1], r = b[0] * a[1]; return l < r ? -1 : l > r ? 1 : 0; };
  /* a band's ends printed outward to the millimetre (rule 8): to the centimetre, Pelotas's lower end, a hair over the
     limit, would print as the limit itself */
  const floorMm = (q) => { const n = q[0] * 1000n, d = q[1]; return (n >= 0n ? n / d : -((-n + d - 1n) / d)); };
  const ceilMm = (q) => { const n = q[0] * 1000n, d = q[1]; return (n >= 0n ? (n + d - 1n) / d : -((-n) / d)); };
  const mm = (c) => (Number(c) / 1000).toFixed(3);
  const sites = sitesDef.filter((s) => ['field', 'platform', 'coast'].includes(s.kind)).map((s) => {
    const r = rows.find((l) => l.type === 'commit' && l.id.startsWith('janela:' + s.id + ':' + RUN + ':+' + LEAD + 'h:')
      && /\/calibrated-(sergipe-)?v1$/.test(l.domain));
    guard(STOP, !!r && r.forecast.lead === LEAD && !!JANELA_NAME[s.id], s.id + ' has no committed band');
    const lo = fr(r.forecast.lo), hi = fr(r.forecast.hi), det = fr(r.forecast.det);
    guard(STOP, cmp(lo, hi) <= 0, s.id + ' band order');      /* the calibrated band need not hold the central number: it corrects its bias */
    const v = cmp(hi, LIMIT) <= 0 ? YES : cmp(lo, LIMIT) > 0 ? NO : OPEN;
    return { id: s.id, domain: r.domain, name: JANELA_NAME[s.id], lat: r.forecast.node[0], lon: r.forecast.node[1], lo, hi, det, v, alpha: r.forecast.alpha, target: r.targetTime,
      band: mm(floorMm(lo)) + '–' + mm(ceilMm(hi)), central: (Number(det[0] * 1000n / det[1]) / 1000).toFixed(2) };
  });
  guard(STOP, sites.length === 9 && [YES, NO, OPEN].every((v) => sites.some((s) => s.v === v)), sites.map((s) => s.v).join(','));
  guard(STOP, sites.every((s) => s.alpha[0] === 1 && s.alpha[1] === 10 && s.target === sites[0].target), 'claim or target');
  guard(STOP, sites.filter((s) => /sergipe-v1$/.test(s.domain)).map((s) => s.id).join() === 'sergipe', 'Sergipe’s own band');
  const WORD = { [YES]: 'cleared', [NO]: 'blocked', [OPEN]: 'undecided' };
  const nCentralUnder = sites.filter((s) => cmp(s.det, LIMIT) <= 0).length;
  const nOpenUnder = sites.filter((s) => s.v === OPEN && cmp(s.det, LIMIT) <= 0).length;
  const count = (v) => sites.filter((s) => s.v === v).length;
  const tgt = new Date(sites[0].target), MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const when = String(tgt.getUTCHours()).padStart(2, '0') + ' UTC, ' + tgt.getUTCDate() + ' ' + MON[tgt.getUTCMonth()];
  /* plate carrée */
  const S = 4.9, LON0 = -55, LAT1 = 7, X0 = 8, Y0 = 62;
  const px = (lon) => X0 + (lon - LON0) * S, py = (lat) => Y0 + (LAT1 - lat) * S;
  const x1 = px(-33), y1 = py(-35);
  const coast = land([-60, -40, -28, 10], (lo, la) => [px(lo), py(la)], [X0, Y0, x1, y1], 0.6);
  /* a key table beside the map, one row per site from north to south, joined to its point by a hairline */
  const order = sites.slice().sort((a, b) => b.lat - a.lat);
  const RY0 = Y0 + 12, RDY = (y1 - 8 - RY0) / (order.length - 1), NX = x1 + 20;
  const rowY = (i) => RY0 + i * RDY;
  const leader = (s, i) => line(px(s.lon) + 4, py(s.lat), NX - 4, rowY(i) - 4, 'stroke="var(--ink-5)" stroke-width="1"');
  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn'), pathEl(coast, landFill), frameRect(X0, Y0, x1, y1)];
    order.forEach((s, i) => { out.push(leader(s, i), dot(px(s.lon), py(s.lat)), t(NX, rowY(i), s.name, 't-ax'), t(NX + 112, rowY(i), s.central + ' m', 't-ax')); });
    out.push(t(8, 36, 'wave height, ' + when + ' · limit ' + LIMIT_S + ' m', 't-ax'));
    out.push(t(8, 52, 'the forecast, one number a site', 't-note'));
    return svg(PW, PH, 'As usually drawn: nine offshore sites on the Brazilian coast, each a dot with the forecast’s one wave height for ' + when + ' beside its name, and the limit of ' + LIMIT_S + ' m in the title. ' + nCentralUnder + ' of the nine numbers read under the limit. Nothing says how far any number may be off.', out);
  })();
  const warrant = (() => {
    const out = [eyebrow(8, 14, 'in warrant'), pathEl(coast, landFill), frameRect(X0, Y0, x1, y1)];
    order.forEach((s, i) => {
      out.push(leader(s, i), mark(px(s.lon), py(s.lat), s.v), t(NX, rowY(i), s.name, 't-ax'),
        t(NX + 103, rowY(i), WORD[s.v], s.v === OPEN ? 't-ax' : 't-lab'), t(NX + 176, rowY(i), s.band, 't-note'));
    });
    out.push(t(8, 36, 'Hs ≤ ' + LIMIT_S + ' m at ' + when + '? · band, m', 't-ax'));
    out.push(ital(8, 52, 'given the lifting limit and Janela’s band, 9 in 10'));
    return svg(PW, PH, 'In WARRANT: the same nine sites. Each carries a word decided by exact comparison of its forecast band, the one Janela committed to its public ledger, against the lifting limit of ' + LIMIT_S + ' m: cleared (a filled dot) where the whole band is under the limit, at ' + count(YES) + ' site; blocked (a ring) where all of it is over, at ' + count(NO) + '; undecided (a half-filled dot) where the band straddles the limit, at ' + count(OPEN) + '. The band’s ends are printed outward to the millimetre. The limit and the band are the givens, named in italic.', out);
  })();
  return {
    id: 'janela-sites', title: 'Sites with a word each', form: 'sites as points with decided words', kind: 'record', record: [REC, SITES], stop: STOP, usual, warrant,
    link: 'janela/',
    hides: 'The usual map prints the forecast’s one number at each site, and ' + nCentralUnder + ' of the nine read under the limit. Read against the band the forecast is known to miss by, only ' + count(YES) + ' is cleared and ' + count(NO) + ' are blocked; the other ' + count(OPEN) + ' are undecided, ' + nOpenUnder + ' of them sites whose one number looked fine. Here each site carries its decided word, its shape and the band it was decided on.',
    caption: 'Janela’s nine open-sea sites, the ECMWF run of 29 October 00 UTC read ' + LEAD + ' hours ahead, against the lifting example’s wave limit, Hs at most ' + LIMIT_S + ' m. The band is the one Janela committed to its public ledger for that step, calibrated against satellite passes to hold nine times in ten (Sergipe has its own); the word is decided over it by exact rational comparison. The run, the step and the operation were chosen so that all three words occur. Plate carrée; Natural Earth 1:50m coast, simplified by Douglas–Peucker to 0.6 drawing units.',
    rule: 'Mark each site with the word its band decides against the limit, cleared, blocked or undecided, in a shape as well as a word, and print the band it was decided on, never the forecast’s one number alone.',
  };
}

/* ========================================================== 4. a reach as a band ==
   The engine-out glide from one instant of a real flight: where the aircraft can land. The panel draws one ring; the
   glide band draws the two edges an envelope of inputs decides, and the airfields between them are undecided. */
function glideReach(guard) {
  guard = makeGuard(guard);
  const FL = 'apps/glide-band/data/flight.json', AP = 'apps/glide-band/data/airports.json', PINS = 'apps/glide-band/data/PINS.json';
  const K = require(path.join(ROOT, 'apps', 'glide-band', 'kernel.js'));
  const STOP = 'a pinned file no longer matches its sha256, the rings computed here stop matching the glide-band report’s own for this instant, or the panel’s ring leaves the band between the two decided edges';
  const pins = readJSON(PINS);
  for (const [name, r] of Object.entries(pins.derived)) guard(STOP, sha('apps/glide-band/data/' + name) === r.sha256, name + ' pin');
  const FLIGHT = readJSON(FL), AIR = readJSON(AP).airports;
  /* the report's instant and envelope (tools/build-report-glide-band.js): the cruise sampled at 16 points, the ninth; the
     single-engine turboprop with its propeller feathered; a 35 kt forecast wind from 270°, right; altitude ± 250 ft */
  const hi = FLIGHT.track.filter((p) => p.alt >= 17000), NPT = 16, TI = Math.floor(NPT / 2);
  const p = hi[Math.round(TI * (hi.length - 1) / (NPT - 1))];
  const KT = K.KT, FT = K.FT, LD = [10.2, 12.6], VA = [92, 108], PANEL_LD = 12.0, WKT = 35, WFROM = 270, ALT_PAD = 250;
  const env = { LD, Va: [VA[0] * KT, VA[1] * KT], Ws: [WKT * 0.75 * KT, (WKT * 1.25 + 4) * KT], Wdir: [WFROM - 15, WFROM + 15] };
  const nom = { LD: PANEL_LD, Va: (VA[0] + VA[1]) / 2 * KT, Ws: WKT * KT, Wdir: WFROM };
  const state = { lat: p.lat, lon: p.lon, track: p.trk, alt_m: [(p.alt - ALT_PAD) * FT, (p.alt + ALT_PAD) * FT], alt_nom_m: p.alt * FT };
  const refElev = 400 * FT, h = [state.alt_m[0] - refElev, state.alt_m[1] - refElev];
  const NB = 48, rlo = [], rhi = [], rnom = [];
  for (let b = 0; b < NB; b++) {
    const bg = b * 360 / NB, tT = K.turnSeconds(state.track, bg), bd = K.band(bg, h, env, tT);
    rlo.push(Math.floor(bd.lo / 10) / 100); rhi.push(Math.ceil(bd.hi / 10) / 100);          /* km: inner edge in, outer edge out */
    rnom.push(+(K.nominal(bg, state.alt_nom_m - refElev, nom, tT) / 1000).toFixed(2));
  }
  guard(STOP, rlo.every((r, b) => r <= rnom[b] && rnom[b] <= rhi[b]), 'the panel ring leaves the band');
  /* the report's own rings for this instant, if the built report is present */
  const REP = abs('site/reports/glide-band.html');
  if (fs.existsSync(REP)) {
    const html = fs.readFileSync(REP, 'utf8'), at = html.indexOf('{"t":' + TI + ',"w":1,"m":0,"p":2,');
    guard(STOP, at > 0, 'the report has no scenario for this instant');
    const arr = (k) => JSON.parse(new RegExp('"' + k + '":(\\[[^\\]]*\\])').exec(html.slice(at))[1]);
    guard(STOP, JSON.stringify(arr('rlo')) === JSON.stringify(rlo) && JSON.stringify(arr('rhi')) === JSON.stringify(rhi) && JSON.stringify(arr('rnom')) === JSON.stringify(rnom), 'rings differ from the report');
  }
  /* azimuthal equidistant about the aircraft: an airfield at its great-circle distance and bearing */
  const RK = Math.ceil(Math.max(...rhi) * 1.12 / 10) * 10;                 /* the frame's half-width, km */
  const MX = 8, MY = 62, MS = 228, sc = MS / (2 * RK), cx = MX + MS / 2, cy = MY + MS / 2;
  const P = (km, bdeg) => [cx + km * Math.sin(bdeg * Math.PI / 180) * sc, cy - km * Math.cos(bdeg * Math.PI / 180) * sc];
  const ringD = (rs) => dOf(rs.map((r, b) => P(r, b * 360 / NB)), true);
  const fields = AIR.map((a) => {
    const g = K.greatCircle(p.lat, p.lon, a.lat, a.lon), km = g.dist[0] / 1000;
    const [x, y] = P(km, g.bearing);
    if (km > RK - 1.5 / sc) return null;                                /* the frame is a circle of radius RK */
    const r = K.decide(state, a, env, nom);
    return { a, x, y, v: r.verdict === K.REACHABLE ? YES : r.verdict === K.UNREACHABLE ? NO : OPEN, shown: r.shown };
  }).filter(Boolean);
  const n = (v) => fields.filter((f) => f.v === v).length, inLine = fields.filter((f) => f.shown), inLineOpen = inLine.filter((f) => f.v !== YES).length;
  guard(STOP, n(YES) > 0 && n(OPEN) > n(YES) && inLine.every((f) => f.v !== NO) && inLineOpen > 0, [n(YES), n(OPEN), n(NO), inLineOpen].join(','));
  const plane = (() => { const a = p.trk * Math.PI / 180, s = 6; const q = (dx, dy) => [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
    return pathEl(dOf([q(0, -s), q(s * 0.6, s * 0.7), q(-s * 0.6, s * 0.7)], true), 'fill="var(--ink)" stroke="var(--sunk)" stroke-width="1"'); })();
  const scaleBar = (() => { const km = RK >= 100 ? 50 : 25, y = MY + MS + 14; return [line(MX, y, MX + km * sc, y, 'stroke="var(--ink-4)" stroke-width="1"'), t(MX + km * sc + 6, y + 4, km + ' km', 't-note')]; })();
  const KX = MX + MS + 14;
  const frameCirc = '    <circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(RK * sc) + '" fill="none" stroke="var(--rule-strong)" stroke-width="1"/>';
  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn'), frameCirc];
    out.push(pathEl(ringD(rnom), PLAIN));
    out.push(capDots(fields, 4, 'var(--ink-2)'));
    out.push(plane, ...scaleBar);
    out.push(t(8, 36, 'glide range, engine out', 't-ax'));
    out.push(t(KX, MY + 14, 'the panel’s ring', 't-ax'), t(KX, MY + 30, inLine.length + ' airfields inside', 't-note'), t(KX, MY + 46, fields.length + ' within ' + RK + ' km', 't-note'));
    return svg(PW, PH, 'As usually drawn: a cockpit glide ring around an aircraft at ' + p.alt + ' ft, one solid line computed from one glide ratio and one forecast wind, and the ' + fields.length + ' airfields in the frame as identical dots. The ' + inLine.length + ' inside the ring read as reachable.', out);
  })();
  const warrant = (() => {
    const id = 'gx-glide-halo', out = [eyebrow(8, 14, 'in warrant'), frameCirc];
    /* the halo (rule 13): the glide model was never validated, so its error has no edge to draw */
    out.push('    <defs><filter id="' + id + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter></defs>');
    out.push('    <path d="' + ringD(rhi) + ringD(rlo) + '" fill-rule="evenodd" fill="var(--ink-4)" opacity="0.4" filter="url(#' + id + ')"/>');
    out.push(pathEl(ringD(rlo), W.attrs(W.DECIDED, { width: 1.8 })), pathEl(ringD(rhi), W.attrs(W.DECIDED, { width: 1.8 })));
    out.push(pathEl(ringD(rnom), W.attrs(W.COMPUTED, { width: 1.6 })));
    out.push(...marks(fields, 2.2));
    out.push(plane, ...scaleBar);
    out.push(t(8, 36, 'where it can land, decided', 't-ax'));
    out.push(ital(8, 52, 'given L/D ' + LD.join('–') + ', ' + VA.join('–') + ' kt, wind ' + WKT + ' kt ± 25%'));
    let y = MY + 14;
    out.push(mark(KX + 4, y - 4, YES, 3), t(KX + 14, y, 'reachable ' + n(YES), 't-note'));
    out.push(mark(KX + 4, y + 12, OPEN, 3), t(KX + 14, y + 16, 'undecided ' + n(OPEN), 't-note'));
    out.push(mark(KX + 4, y + 28, NO, 3), t(KX + 14, y + 32, 'unreachable ' + n(NO), 't-note'));
    y += 60;
    out.push(line(KX, y - 4, KX + 22, y - 4, W.attrs(W.DECIDED, { width: 1.8 })), t(KX + 28, y, 'two edges,', 't-note'), t(KX + 28, y + 14, 'decided', 't-note'));
    out.push(line(KX, y + 30, KX + 22, y + 30, W.attrs(W.COMPUTED, { width: 1.6 })), t(KX + 28, y + 34, 'the panel’s ring', 't-note'));
    out.push(t(KX, y + 62, inLineOpen + ' of the ' + inLine.length, 't-note'), t(KX, y + 76, 'inside it are', 't-note'), t(KX, y + 90, 'not proved', 't-note'));
    return svg(PW, PH, 'In WARRANT: the same instant. Two solid rings are the edges the envelope decides: inside the inner one every airfield is reachable for every value of the inputs, outside the outer one none is. A soft halo past them says the glide model itself was never measured against a flight. The panel’s ring runs dashed between them, computed from one value per input. The airfields carry their decided verdicts as shapes: ' + n(YES) + ' reachable, filled; ' + n(OPEN) + ' undecided, half filled; ' + n(NO) + ' unreachable, rings. ' + inLineOpen + ' of the ' + inLine.length + ' inside the panel’s ring are not proved reachable. The envelope is a chosen input, named in italic.', out);
  })();
  return {
    id: 'glide-reach', title: 'A reach drawn as a band', form: 'a region whose edges are decided', kind: 'record', record: [FL, AP], stop: STOP, usual, warrant,
    link: 'reports/glide-band.html',
    hides: 'The usual ring is one line from one glide ratio and one forecast wind, and everything inside it looks reachable. Here the inputs are ranges: the two solid edges are decided, the panel’s ring runs dashed between them, and ' + inLineOpen + ' of the ' + inLine.length + ' airfields inside it are undecided, not reachable.',
    caption: 'An engine-out glide from one instant of a real flight (' + FLIGHT.reg + ', a ' + FLIGHT.type + ', at ' + p.alt.toLocaleString('en-US') + ' ft on ' + FLIGHT.day + ', from its pinned ADS-B trace), in the glide-band report’s headline scenario: the propeller feathered, a ' + WKT + ' kt wind from ' + WFROM + '°. The two edges are interval enclosures of the reach on ' + NB + ' bearings, for a field at 400 ft; each airfield (OurAirports) is decided at its own elevation. Every verdict holds <em>given</em> the stated envelope and the report’s hypotheses (terrain not modelled, a steady glide), which is what the halo draws. Not for navigation. Azimuthal equidistant about the aircraft.',
    rule: 'Draw a reach as the two edges the inputs decide, solid, with a halo where the model was never validated, the one-value ring dashed between them, and each place inside marked with its own verdict.',
  };
}

/* ------------------------------------------------- an image and its level lines -- */
/* a PNG read with zlib alone: 8-bit RGBA, not interlaced (the island model's textures; anything else refuses) */
function png(rel) {
  const b = fs.readFileSync(abs(rel));
  let p = 8, w = 0, h = 0, ok = false; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('latin1', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ok = d[8] === 8 && d[9] === 6 && d[12] === 0; }
    else if (type === 'IDAT') idat.push(d); else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (!ok) throw new Error('maps: ' + rel + ' is not an 8-bit RGBA PNG');
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, st = w * bpp, out = Buffer.alloc(h * st);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)], s = y * (st + 1) + 1, o = y * st;
    for (let x = 0; x < st; x++) {
      const a = x >= bpp ? out[o + x - bpp] : 0, u = y ? out[o - st + x] : 0, c = x >= bpp && y ? out[o - st + x - bpp] : 0;
      let v = raw[s + x];
      if (f === 1) v += a; else if (f === 2) v += u; else if (f === 3) v += (a + u) >> 1;
      else if (f === 4) { const q = a + u - c, pa = Math.abs(q - a), pb = Math.abs(q - u), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c; }
      out[o + x] = v & 255;
    }
  }
  return { w, h, px: (x, y, k) => out[(y * w + x) * 4 + k] };
}
/* marching squares: the level line of val over an nx × ny grid, only through cells whose four corners are ok; the
   segments chained into polylines (closed where they close). A saddle is split by the cell's mean. */
function contour(nx, ny, val, ok, level) {
  const H = (i, j) => j * nx + i, V = (i, j) => nx * ny + j * nx + i;
  const at = new Map(), nb = new Map();
  const put = (k, x, y) => { if (!at.has(k)) at.set(k, [x, y]); };
  const link = (a, b) => { (nb.get(a) || nb.set(a, []).get(a)).push(b); (nb.get(b) || nb.set(b, []).get(b)).push(a); };
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    if (!ok(i, j) || !ok(i + 1, j) || !ok(i, j + 1) || !ok(i + 1, j + 1)) continue;
    const a = val(i, j), b = val(i + 1, j), c = val(i + 1, j + 1), d = val(i, j + 1);
    const ea = [];
    if ((a > level) !== (b > level)) { const k = H(i, j); put(k, i + (level - a) / (b - a), j); ea.push(k); }
    if ((b > level) !== (c > level)) { const k = V(i + 1, j); put(k, i + 1, j + (level - b) / (c - b)); ea.push(k); }
    if ((d > level) !== (c > level)) { const k = H(i, j + 1); put(k, i + (level - d) / (c - d), j + 1); ea.push(k); }
    if ((a > level) !== (d > level)) { const k = V(i, j); put(k, i, j + (level - a) / (d - a)); ea.push(k); }
    if (ea.length === 2) link(ea[0], ea[1]);
    else if (ea.length === 4) { if (((a + b + c + d) / 4 > level) === (a > level)) { link(ea[0], ea[1]); link(ea[2], ea[3]); } else { link(ea[0], ea[3]); link(ea[1], ea[2]); } }
  }
  const seen = new Set(), lines = [];
  const walk = (k0) => { const pts = [at.get(k0)]; seen.add(k0); let prev = null, k = k0;
    for (;;) { const nx2 = (nb.get(k) || []).find((q) => q !== prev && !seen.has(q)); if (nx2 === undefined) { if ((nb.get(k) || []).includes(k0) && pts.length > 2) pts.push(at.get(k0)); break; } seen.add(nx2); pts.push(at.get(nx2)); prev = k; k = nx2; }
    return pts; };
  for (const [k, n] of nb) if (n.length === 1 && !seen.has(k)) lines.push(walk(k));
  for (const k of nb.keys()) if (!seen.has(k)) lines.push(walk(k));
  return lines;
}

/* ====================================================== 5. a model's field ==
   Swell's island model: the crests of one swell case as the model refracts them round Florianópolis, the island's coast
   from the model's own sea mask, and the 34 beaches by how far the model was checked at each. */
function swellField(guard) {
  guard = makeGuard(guard);
  const DIR = 135, PER = 12;                      /* chosen: a south-easterly swell of 12 s, a long swell (rule 16) */
  const IDX = 'apps/swell/data/island/index.json', BEA = 'apps/swell/data/beaches.json', CMP = 'certs/swell-island-boussinesq.json', PINS = 'apps/swell/data/PINS.json';
  const STOP = 'a texture or the beach table stops matching its pin, a beach’s refusal stops following from its distance to the box’s side edges, or the comparison stops naming the beaches where the island model reads low';
  const I = readJSON(IDX), B = readJSON(BEA), CM = readJSON(CMP), PIN = readJSON(PINS);
  const SURF = require(path.join(ROOT, 'apps', 'swell', 'model', 'surf.js'));
  const cs = I.cases.find((c) => c.dir === DIR && c.T === PER);
  guard(STOP, !!cs, 'no case');
  const DEPTH = 'apps/swell/data/island/' + I.texture.depth, CASE = 'apps/swell/data/island/' + cs.file;
  for (const [rel, name] of [[DEPTH, 'island/' + I.texture.depth], [CASE, 'island/' + cs.file], [BEA, 'beaches.json'], [IDX, 'island/index.json']]) {
    const pn = PIN.files[name] && PIN.files[name].sha256;
    guard(STOP, !!pn && pn === sha(rel), name + ' pin');
  }
  const D = png(DEPTH), Pc = png(CASE);
  guard(STOP, D.w === I.texture.nx && D.h === I.texture.ny && Pc.w === D.w && Pc.h === D.h, 'texture size');
  const [LO0, LO1] = I.texture.lon, [LA0, LA1] = I.texture.lat, NX = D.w, NY = D.h, DX = I.texture.dx;
  /* the model's own grid, row 0 north, drawn square: 60 m a pixel each way */
  const MX = 8, MY = 62, SC = 228 / Math.max(NX, NY), x1 = MX + NX * SC, y1 = MY + NY * SC;
  const gx = (i) => MX + i * SC, gy = (j) => MY + j * SC;
  const lonX = (lon) => gx((lon - LO0) / (LO1 - LO0) * NX), latY = (lat) => gy((LA1 - lat) / (LA1 - LA0) * NY);
  /* the coast: the sea mask's half level on a 2-pixel grid (120 m), padded with sea so every land is a closed ring */
  const ST = 2, cx = Math.ceil(NX / ST) + 2, cy = Math.ceil(NY / ST) + 2;
  const seaAt = (i, j) => { const x = (i - 1) * ST, y = (j - 1) * ST; return x < 0 || y < 0 || x >= NX || y >= NY ? 255 : D.px(x, y, 2); };
  const coastRings = contour(cx, cy, seaAt, () => true, 127.5).map((r) => simplify(r.map(([i, j]) => [gx((i - 1) * ST), gy((j - 1) * ST)]), 0.5)).filter((r) => r.length > 3);
  const coastD = coastRings.map((r) => dOf(r, true)).join('');
  /* the crests: level lines of the phase (cycles) at every twenty-fifth crest, on a 3-pixel grid, where the wave reaches
     (K > 0) over the sea; EDGE_KM from the box's north and south edges the model is refused (surf.js) */
  const NTH = { 10: 'tenth', 20: 'twentieth', 25: 'twenty-fifth' };
  const EVERY = 25, SP = 3, px3 = Math.ceil(NX / SP), py3 = Math.ceil(NY / SP);
  const EDGE_KM = SURF.C.EDGE_KM, edgePx = EDGE_KM * 1000 / DX;
  const ph = (i, j) => { const x = Math.min(NX - 1, i * SP), y = Math.min(NY - 1, j * SP); return (Pc.px(x, y, 0) * 256 + Pc.px(x, y, 1)) * cs.phiScale; };
  const reach = (i, j) => { const x = Math.min(NX - 1, i * SP), y = Math.min(NY - 1, j * SP); return D.px(x, y, 2) > 127 && Pc.px(x, y, 2) > 0; };
  const inside = (i, j) => { const y = Math.min(NY - 1, j * SP); return y >= edgePx && y <= NY - 1 - edgePx; };
  let pmax = 0; for (let j = 0; j < py3; j++) for (let i = 0; i < px3; i++) if (reach(i, j)) pmax = Math.max(pmax, ph(i, j));
  const crests = (okf) => { const out = []; for (let L = EVERY; L < pmax; L += EVERY)
    for (const c of contour(px3, py3, ph, okf, L)) { const s = simplify(c.map(([i, j]) => [gx(i * SP), gy(j * SP)]), 0.45); if (s.length > 1 && Math.hypot(s[0][0] - s[s.length - 1][0], s[0][1] - s[s.length - 1][1]) + s.length > 6) out.push(dOf(s)); }
    return out.join(''); };
  /* the beaches, their refusal by the model's own rule, and the comparison's verdict on each */
  const beaches = B.beaches.map((b) => ({ b, x: lonX(b.lon), y: latY(b.lat), refused: SURF.refused(b) }));
  const refusedB = beaches.filter((q) => q.refused);
  const near = (q) => ['N', 'S', 'W'].some((k) => q.b.edges[k] != null && q.b.edges[k] < EDGE_KM);
  guard(STOP, beaches.length === 34 && beaches.every((q) => !!q.refused === near(q)) && refusedB.length === 1, refusedB.map((q) => q.b.name).join());
  const long = CM.readings.swell.byBeachLong, compared = new Set(Object.keys(long));
  guard(STOP, compared.size === CM.beaches && [...compared].every((n) => beaches.some((q) => q.b.name === n)), 'compared beaches');
  const low = Object.entries(long).filter(([, v]) => v.medianRatio < 1).sort((a, b) => a[1].medianRatio - b[1].medianRatio);
  guard(STOP, low.map(([n]) => n).join('|') === 'Pântano do Sul|Ingleses|Galheta' && PER >= 11, low.map(([n]) => n).join('|'));
  const nCmp = beaches.filter((q) => compared.has(q.b.name)).length, nAss = beaches.length - nCmp - refusedB.length;
  /* a square for a grade (a circle on this page is a verdict): filled where the model was compared, hollow where not */
  const sq = (q, r) => compared.has(q.b.name) ? rect(q.x - r, q.y - r, 2 * r, 2 * r, 'fill="var(--ink)" stroke="var(--sunk)" stroke-width="0.8"')
    : rect(q.x - r, q.y - r, 2 * r, 2 * r, 'fill="var(--sunk)" stroke="var(--ink)" stroke-width="1"');
  const KX = x1 + 14;
  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn'), rect(MX, MY, x1 - MX, y1 - MY, 'fill="none" stroke="var(--rule-strong)" stroke-width="1"')];
    out.push(pathEl(coastD, landFill + ' fill-rule="evenodd"'));
    out.push(pathEl(crests(reach), PLAIN));
    out.push(capDots(beaches, 4.4, 'var(--ink-2)'));
    out.push(t(8, 36, 'swell crests round the island', 't-ax'));
    out.push(t(KX, MY + 14, 'crests, from', 't-note'), t(KX, MY + 28, 'the south-east', 't-note'), t(KX, MY + 50, beaches.length + ' beaches', 't-note'));
    return svg(PW, PH, 'As usually drawn: Florianópolis with a swell from the south-east, its crests drawn as solid lines bending round the island and into the bays, across the whole model box, and the ' + beaches.length + ' beaches as identical dots.', out);
  })();
  const warrant = (() => {
    const h = PL.hatch(), out = [h.def, eyebrow(8, 14, 'in warrant'), rect(MX, MY, x1 - MX, y1 - MY, 'fill="none" stroke="var(--rule-strong)" stroke-width="1"')];
    /* the two strips the model refuses, under the land */
    const eh = edgePx * SC;
    out.push(PL.voidRect(h, MX, MY, x1 - MX, eh), PL.voidRect(h, MX, y1 - eh, x1 - MX, eh));
    out.push(pathEl(coastD, landFill + ' fill-rule="evenodd"'));
    out.push(pathEl(crests((i, j) => reach(i, j) && inside(i, j)), W.attrs(W.COMPUTED, { width: 1.6 }) + ' stroke-linejoin="round"'));
    for (const q of beaches) if (!q.refused) out.push(sq(q, 2.4));
    /* the beaches with words: the refused one, and the three where the comparison says the model reads low */
    const named = refusedB.map((q) => ({ q, l1: '∅ ' + q.b.name, l2: String(q.b.edges.S) + ' km from edge' }))
      .concat(low.map(([n, v]) => ({ q: beaches.find((q) => q.b.name === n), l1: n, l2: 'reads low, ×' + v.medianRatio.toFixed(2) })));
    named.sort((a, b) => a.q.y - b.q.y);
    named.forEach((m, k) => {
      const ly = MY + 104 + k * 34;
      out.push(line(m.q.x + 3, m.q.y, KX - 4, ly - 4, 'stroke="var(--ink-5)" stroke-width="1"'), t(KX, ly, m.l1, 't-ax'), t(KX, ly + 14, m.l2, 't-note'));
      if (m.q.refused) out.push('    <circle cx="' + f1(m.q.x) + '" cy="' + f1(m.q.y) + '" r="3.4" fill="var(--sunk)" stroke="var(--ink-3)" stroke-width="1"/>');
    });
    out.push(rect(KX, MY + 5, 8, 8, 'fill="var(--ink)"'), t(KX + 14, MY + 13, 'compared ' + nCmp, 't-note'));
    out.push(rect(KX + 0.5, MY + 21.5, 7, 7, 'fill="var(--sunk)" stroke="var(--ink)" stroke-width="1"'), t(KX + 14, MY + 29, 'assumed ' + nAss, 't-note'));
    out.push(PL.voidRect(h, KX, MY + 38, 8, 8), t(KX + 14, MY + 46, 'refused ' + EDGE_KM + ' km strip', 't-note'));
    out.push(line(KX, MY + 61, KX + 22, MY + 61, W.attrs(W.COMPUTED, { width: 1.6 })), t(KX + 28, MY + 65, 'crest, computed', 't-note'));
    out.push(t(8, 36, 'a picture of the island model', 't-ax'));
    out.push(ital(8, 52, 'given a swell from ' + DIR + '° at ' + PER + ' s'));
    return svg(PW, PH, 'In WARRANT: the same field, said to be a picture of the island model. Its crests are dashed, computed by a linear refraction solver, and stop ' + EDGE_KM + ' km from the box’s north and south edges, where the model is refused because the wave enters there unrefracted; those strips are hatched voids. The beaches are squares by how far the model was checked there: ' + nCmp + ' filled, compared with a Boussinesq model; ' + nAss + ' hollow, assumed, never compared. ' + refusedB[0].b.name + ' lies in the southern strip and is refused. Three beaches are named where the comparison says the model reads low on long swells: ' + low.map(([n, v]) => n + ' at ' + v.medianRatio.toFixed(2) + ' times').join(', ') + '. The swell is a chosen input, named in italic.', out);
  })();
  return {
    id: 'swell-field', title: 'A model’s field', form: 'a field drawn from a model', kind: 'record', record: [CASE, DEPTH, BEA, CMP], stop: STOP, usual, warrant,
    link: 'swell/',
    hides: 'The usual map draws a model’s crests like a photograph, edge to edge, and every beach alike. Here the crests are dashed and the figure says it is a picture of the model; they stop where the model is refused, the beaches show where the model was checked and where it was only assumed, and the three where the check says it reads low are named.',
    caption: 'Swell’s island model of Florianópolis, the case of a ' + PER + ' s swell from ' + DIR + '°: every ' + NTH[EVERY] + ' crest, a level line of the solved phase, where the wave reaches the water. The coast is the model’s own sea mask at half, on a ' + ST * DX + ' m grid, simplified by Douglas–Peucker to 0.5 drawing units; the map is the model’s ' + DX + ' m grid, north up. The island model is ' + W.grade(W.COMPARED) + ' against a Boussinesq model at ' + nCmp + ' beaches; its code was never verified against an exact solution of its own equations, and it was never measured against the sea at a beach; the long-swell ratios are the comparison’s medians (island over Boussinesq).',
    rule: 'Draw a model’s field dashed and say once that it is a picture of the model, leave a void where the model is refused, and mark each place by how far the model was checked there, naming the places where the check says it reads low.',
  };
}

module.exports = { topic: { id: 'maps', title: 'Maps', lead: 'Cells, regions, sites, reaches and fields: what a map says about each place, and what it may not.' }, scenes: [atlasCells, claimBox, janelaSites, glideReach, swellField] };
