#!/usr/bin/env node
/* build.js — site/atalaia/doutrina/index.html: Atalaia, a proposed mission protocol (minuta, v0.4.1) and the technical
   basis of an applied-research programme, for operating drones when satellite navigation (GNSS) is degraded, jammed or
   spoofed, civil use first and military later, with worked missions simulated in Santa Catarina. Unlisted
   (noindex, in no index or sitemap) on the operator's word of 2026-11-15 ("páginas live não listadas", hosted here,
   the unit not named until it agrees). Written in Portuguese: the operator ruled "Pt-BR for this project"
   (2026-11-14), after the site-wide English rule of 2026-10-30, for this audience.

   v0.4.1 (2026-11-16, D31, after an outside review of v0.4): a terminology and consistency pass, not a v0.5 — the
   position region is the "região de proteção", defined at once in its two levels (deterministic under declared bounds,
   probabilistic under the declared noise model), "região garantida" kept only as the name it had up to v0.4; the IBGE
   result says it ran on recorded data from fixed stations with synthetic drags, and what it needed (a motion
   constraint); an environment matrix in section 12; the embedded box named an engineering hypothesis in section 11;
   the test results and the records read once, in registros.js, which the landing and /atalaia/eb/ read too.
   v0.4 (2026-11-16, D30, after an outside review of v0.3): GNSS vocabulary; four quantitative claims restated with their
   model and limits (the 6e-8 integrity bound, the 24,300 correlated checks, OSNMA on test vectors, energy without
   temperature and ageing); sensor independence a hypothesis to measure; the cost of caution a named metric; landing
   where it is needs the ground risk assessed; research-first roles; the three moments in generic words; a current-
   version block and a version history; the airport-zone case from the island record.
   v0.3 (2026-11-16, D27/D28): the research basis — the Florianópolis island first (its results from the private
   generator, ilha.json; the instruments stay private), the Médio Vale as the operational reference, the next step an
   applied research programme before any military evaluation; the carga x distância scatter dropped (the reach map
   replaces it).
   v0.2 (2026-11-15, the operator: "follow this way … dig even more"): the page became a minuta that keeps apart
   principles, responsibilities, procedures, technical requirements and validation criteria, with a governance part;
   every claim carries one of three maturity levels (Demonstrado / Validado em campo / Proposto) and the stat strip
   counts them as the page is built.

   EVERY MISSION NUMBER IS READ HERE from apps/atalaia/data/ (central.json, missao.json), written by the Atalaia
   generators (private, ~/Projects/atalaia/ferramentas, scenario cenarios/blumenau.json) over the Copernicus GLO-90
   relief and the DJI FlyCart 30 spec sheet; PROVENANCE.json pins every input and every record by sha256, and this
   build refuses a record whose bytes no longer match it. The test results are the LOCUS and Veto records
   (frontier-apps: docs/drone6.md, docs/gnss.md, docs/osnma.md, docs/live.md), each named with its stage.

   usage: node apps/atalaia/build.js                                                                                MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OUT = path.join(ROOT, 'site', 'atalaia', 'doutrina');   /* v0.3: the minuta moved here; /atalaia/ is the landing (landing.js) */
const DATA = path.join(__dirname, 'data');
const die = (m) => { console.error('ATALAIA PAGE REFUSED: ' + m); process.exit(1); };

/* ---- the records: read, pinned and asserted ONCE, in registros.js (v0.4.1), which landing.js and eb.js read too */
const R = require('./registros.js');
const { VERSAO, CJ, MJ, IL, ILM, AV, AL, SI, FR, KG, R12, R30, RS, pa, fa, na, paMiss, faOk, naOk, CAP, zPost, zSerra, zBase, RES_MIN, CTRV, n } = R;
/* the Amazon route's length, read once from the record (the last profile row); the minuta printed MJ.amazonia.km, a field the record never had (NaN on the page until 2026-11-17) */
const AMZ_KM = MJ.amazonia.rows[MJ.amazonia.rows.length - 1].km;
if (!(AMZ_KM > 0)) die('the Amazon route has no length in missao.json');
const esc = C.esc;
const vword = R.VWORD;
const vt = (v) => C.tag(vword[v][0], vword[v][1]);

/* THE MATURITY CONVENTION (v0.2): every claim on the page carries one of three levels, and the stat strip counts the
   marked claims as the page is built — a level is never typed into a number by hand. */
const LV = { D: ['Demonstrado', 'd'], V: ['Validado em campo', 'v'], P: ['Proposto', 'p'] };
const chip = (l, det) => '<span class="at-st ' + LV[l][1] + '">' + esc(LV[l][0] + (det ? ' · ' + det : '')) + '</span>';
const TALLY = { D: 0, V: 0, P: 0 };
const mt = (l, det) => { TALLY[l] += 1; return chip(l, det); };
const src = (raw) => C.pRaw('<span class="at-src">' + raw + '</span>');
/* two-column rows (v0.2): a four- or five-column table scrolls sideways on a phone, so each row is the item, with its
   level under it, and one cell that says the rest in labelled lines */
const c1 = (title, lv) => ({ raw: '<b>' + esc(title) + '</b>' + (lv ? '<span class="at-cl">' + lv + '</span>' : '') });
const c2 = (pairs) => ({ raw: pairs.map(([k, v]) => '<span class="at-cl">' + (k ? '<b>' + esc(k) + '</b> ' : '') + esc(v) + '</span>').join('') });
const a = (href, raw) => '<a href="' + href + '" target="_blank" rel="noopener">' + raw + '</a>';   /* raw: this file's own text */

/* ---------------------------------------------------------------- figures */
const RW = 1300, RH = 937;                       /* the relief raster, the map frame of missao.json */
const MP = MJ.map;
const P = (k) => [MP.pts[k][0] * RW, MP.pts[k][1] * RH];
const kmPerU = MP.km_per_w / RW;                  /* km per viewBox unit */
const along = (p0, p1, t) => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
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
/* THE ISLAND (v0.3, D28): the relief of the north of the Florianópolis island, the reach at the mission load from the
   base, and the four computed missions, each drawn by its worst verdict (route or energy): solid passes, the claim dash
   is undecided, the guide dash does not pass. Equirectangular on the relief's own frame (relevo-ilha.json). */
function ilhaMapa(narrow) {
  const F = IL.quadro, [W0, E0, S0, N0] = F.bounds;
  const X = (p) => (p[0] - W0) / (E0 - W0) * F.w, Y = (p) => (N0 - p[1]) / (N0 - S0) * F.h;
  const k = narrow ? 1.6 : 1;
  const worst = (m) => [m.rota.verdict, m.energia12.verdict].includes('NAO PASSA') ? 'NAO PASSA' : [m.rota.verdict, m.energia12.verdict].includes('FALTA DADO') ? 'FALTA DADO' : 'PASSA';
  const poly = (pts, cls) => '<polygon points="' + pts.map((p) => X(p).toFixed(1) + ',' + Y(p).toFixed(1)).join(' ') + '" class="' + cls + '"/>';
  const B = IL.base;
  let g = '<rect width="' + F.w + '" height="' + F.h + '" class="at-ground"/><image href="relevo-ilha.webp" width="' + F.w + '" height="' + F.h + '" preserveAspectRatio="none"/>'
    + poly(IL.alcance.falta, 'at-ring-open') + poly(IL.alcance.passa, 'at-ring-pass');
  const lab = [];
  for (const m of IL.missoes) {
    const v = worst(m), cls = v === 'PASSA' ? 'at-route' : v === 'FALTA DADO' ? 'at-leg-open' : 'at-beyond';
    const o = [X(m.origem), Y(m.origem)], d = [X(m.destino), Y(m.destino)];
    if (v === 'PASSA') g += '<line x1="' + o[0].toFixed(1) + '" y1="' + o[1].toFixed(1) + '" x2="' + d[0].toFixed(1) + '" y2="' + d[1].toFixed(1) + '" class="at-halo"/>';
    g += '<line x1="' + o[0].toFixed(1) + '" y1="' + o[1].toFixed(1) + '" x2="' + d[0].toFixed(1) + '" y2="' + d[1].toFixed(1) + '" class="' + cls + '"/>';
    if (o[0] !== X(B) || o[1] !== Y(B)) g += '<circle cx="' + o[0].toFixed(1) + '" cy="' + o[1].toFixed(1) + '" r="' + (7 * k).toFixed(1) + '" class="at-base"/>';
    g += '<circle cx="' + d[0].toFixed(1) + '" cy="' + d[1].toFixed(1) + '" r="' + (10 * k).toFixed(1) + '" class="' + (v === 'NAO PASSA' ? 'at-serra' : 'at-post') + '"/>';
    lab.push([d, m.id]);
  }
  g += '<circle cx="' + X(B).toFixed(1) + '" cy="' + Y(B).toFixed(1) + '" r="' + (11 * k).toFixed(1) + '" class="at-base"/>';
  const T = { 'costa-base': 'Costa da Lagoa', 'costa-rv': '', morros: 'Posto nos morros', agua: 'Barco ao largo' };
  const off = { 'costa-base': [16, 8], morros: [18, 8], agua: [16, -6] };
  for (const [d, id] of lab) if (T[id]) g += lblk(k, d[0] + off[id][0] * k, d[1] + off[id][1] * k, T[id], 'at-lb');
  g += lblk(k, X(B) - 18 * k, Y(B) - 14 * k, 'Base', 'at-lb', 'end');
  const rv = ILM['costa-rv'].origem;
  g += lblk(k, X(rv) + 14 * k, Y(rv) - 10 * k, 'Rio Vermelho', 'at-lbs');
  const vb = narrow ? (() => { const xs = IL.missoes.flatMap((m) => [X(m.origem), X(m.destino)]).concat([X(B)]), ys = IL.missoes.flatMap((m) => [Y(m.origem), Y(m.destino)]).concat([Y(B)]);
    const x0 = Math.min(...xs) - 150, x1 = Math.max(...xs) + 470, y0 = Math.min(...ys) - 80, y1 = Math.max(...ys) + 80; return [x0, y0, x1 - x0, y1 - y0]; })() : [0, 0, F.w, F.h];
  return '<svg class="at-svg' + (narrow ? ' at-n' : '') + '" viewBox="' + vb.map((v) => v.toFixed(1)).join(' ') + '" role="img" aria-label="Mapa de relevo do norte da ilha de Florianópolis: a base, o alcance com ' + IL.carga_kg + ' kg e as quatro missões sintéticas, cada uma desenhada pelo seu pior veredito">' + g + '</svg>';
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
      const y = 50 + i * 96, [w, b] = r.margin_wh, lo = Math.min(sx(w), sx(b)), hi = Math.max(sx(w), sx(b));
      g += lbl(x0, y, name, 'at-rowl') + lbl(x1, y, vword[r.verdict][0], 'at-roww', 'end')
        + '<rect x="' + lo.toFixed(1) + '" y="' + (y + 14) + '" width="' + Math.max(3, hi - lo).toFixed(1) + '" height="20" class="' + cls(r.verdict) + '"/>'
        + lbl(Math.max(x0, lo), y + 56, n(w), 'at-ax', lo - x0 < 30 ? 'start' : 'middle') + lbl(Math.min(x1, hi), y + 56, (b > 0 ? '+' : '') + n(b), 'at-ax', x1 - hi < 30 ? 'end' : 'middle');
    });
    return '<svg class="at-svg at-n" viewBox="0 0 ' + W + ' ' + H + '"' + aria + g + '</svg>';
  }
  const W = 900, x0 = 300, x1 = 880, mid = (x0 + x1) / 2, sx = (v) => mid + (v / A) * (x1 - x0) / 2;
  const H = 52 + rows.length * 58;
  let g = '<line x1="' + mid + '" y1="22" x2="' + mid + '" y2="' + (H - 18) + '" class="at-zero"/>' + head(x0, x1, mid);
  rows.forEach(([name, r], i) => {
    const y = 48 + i * 58, [w, b] = r.margin_wh;
    const lo = Math.min(sx(w), sx(b)), hi = Math.max(sx(w), sx(b));
    g += lbl(0, y + 6, name, 'at-rowl') + lbl(0, y + 28, vword[r.verdict][0], 'at-roww')
      + '<rect x="' + lo.toFixed(1) + '" y="' + (y - 11) + '" width="' + Math.max(3, hi - lo).toFixed(1) + '" height="22" class="' + cls(r.verdict) + '"/>'
      + lbl(lo - 8, y + 5, n(w), 'at-ax', 'end') + lbl(hi + 8, y + 5, (b > 0 ? '+' : '') + n(b), 'at-ax');
  });
  return '<svg class="at-svg" viewBox="0 0 ' + W + ' ' + H + '"' + aria + g + '</svg>';
}

/* THE MISSION STATES (v0.2): six states, drawn as the protocol defines them. Severity is drawn by weight, never by
   colour: a hairline for normal, a heavier outline as the situation degrades, the last state inverted. */
const ESTADOS = [
  [0, ['Normal'], ''], [1, ['GNSS em dúvida'], 's1'], [2, ['GNSS falso', 'ou negado'], 's2'],
  [3, ['Enlace perdido'], 's1'], [4, ['GNSS e enlace', 'perdidos'], 's2'], [5, ['Estimativa', 'não confiável'], 's5']];
const ARESTAS = [[0, 1], [0, 3], [1, 2], [3, 4], [2, 4], [2, 5], [4, 5]];
function estados(narrow) {
  const bw = narrow ? 186 : 170, bh = narrow ? 92 : 74, k = narrow ? 1.3 : 1;   /* the phone drawing's type grows */
  const pos = narrow
    ? { 0: [117, 4], 1: [4, 136], 3: [230, 136], 2: [4, 268], 4: [230, 268], 5: [117, 400] }
    : { 0: [0, 108], 1: [243, 20], 3: [243, 196], 2: [486, 20], 4: [486, 196], 5: [730, 108] };
  const W = narrow ? 420 : 900, H = narrow ? 496 : 290, id = 'at-arw-' + (narrow ? 'n' : 'w');
  const box = (k) => { const [x, y] = pos[k]; return { x, y, cx: x + bw / 2, cy: y + bh / 2, r: x + bw, b: y + bh }; };
  const edge = (f, t) => {
    const A = box(f), B = box(t);
    let p0, p1;
    if (narrow) {
      if (A.y === B.y) { p0 = [A.r, A.cy]; p1 = [B.x - 2, B.cy]; }
      else { p0 = [A.cx + (B.cx - A.cx) * 0.25, A.b]; p1 = [B.cx - (B.cx - A.cx) * 0.25, B.y - 2]; }
    } else if (A.x === B.x) { p0 = [A.cx, A.b]; p1 = [B.cx, B.y - 2]; }
    else { p0 = [A.r, A.cy + (B.cy - A.cy) * 0.25]; p1 = [B.x - 2, B.cy - (B.cy - A.cy) * 0.25]; }
    return '<line x1="' + p0[0].toFixed(1) + '" y1="' + p0[1].toFixed(1) + '" x2="' + p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) + '" class="at-edge" marker-end="url(#' + id + ')"/>';
  };
  let g = '<defs><marker id="' + id + '" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" class="at-arrow"/></marker></defs>';
  g += ARESTAS.map(([f, t]) => edge(f, t)).join('');
  for (const [num, name, cls] of ESTADOS) {
    const b = box(num);
    /* the last state is drawn with a double outline: the heaviest, and still ink on paper (an inverted box reads as
       a faint mark to the render gate, which measures text against the page ground) */
    g += '<rect x="' + b.x + '" y="' + b.y + '" width="' + bw + '" height="' + bh + '" rx="6" class="at-node' + (cls ? ' ' + cls : '') + '"/>'
      + (cls === 's5' ? '<rect x="' + (b.x + 5) + '" y="' + (b.y + 5) + '" width="' + (bw - 10) + '" height="' + (bh - 10) + '" rx="3" class="at-node s5"/>' : '')
      + lblk(k, b.x + 14, b.y + 22 * k, 'ESTADO ' + num, 'at-roww')
      + name.map((ln, i) => lblk(k, b.x + 14, b.y + (44 + i * 19) * k, ln, 'at-rowl')).join('');
  }
  return '<svg class="at-svg' + (narrow ? ' at-n' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Os seis estados da missão: do normal, a missão passa a GNSS em dúvida ou a enlace perdido; daí a GNSS falso ou negado e a GNSS e enlace perdidos; dos dois, a estimativa não confiável">' + g + '</svg>';
}

/* the synthetic flight: the leg, zoomed, and the energy that remains along it (the script draws it) */
function voo() {
  const B = P('base'), Q = P('posto');
  /* a 2:1 window on the leg: the figure stays shorter than it is wide (the operator, 2026-11-15: nothing gigantic) */
  const cx = (B[0] + Q[0]) / 2, cy = (B[1] + Q[1]) / 2, h = Math.max(Math.abs(Q[1] - B[1]), Math.abs(Q[0] - B[0]) / 2) * 1.5, w = h * 2;
  const vb = [cx - w / 2, cy - h / 2, w, h].map((v) => v.toFixed(1)).join(' ');
  return '<div class="at-rp" id="at-rp">'
    + '<div class="at-rpmap"><svg class="at-svg" id="at-rpmap" viewBox="' + vb + '" role="img" aria-label="Voo sintético: o drone vai da base ao posto avançado e volta; no meio do caminho o GNSS é falsificado e o drone segue pela área garantida">'
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
function ph(s,p){if(s<.04)return'decolagem · estado 0';if(s<.47)return p[4]?'estado 2: GNSS falso, segue pela região':'ida ao posto · estado 0';if(s<.56)return'chegada: marcador e entrega';if(s<.97)return p[4]?'volta, GNSS ainda falso · estado 2':'volta à base · estado 0';return'pouso'}
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
B.push(C.header({ eyebrow: 'Atalaia · ' + R.MARCA.lema + ' · minuta para revisão técnica · versão ' + VERSAO.n + ' · ' + VERSAO.data,
  title: 'Atalaia: operar drones quando a navegação por satélite deixa de ser confiável',
  deck: 'Proposta de protocolo de missão e base técnica de um programa de pesquisa aplicada, para drones com o GNSS degradado ou negado: uso civil primeiro, militar depois. A tese é que resiliência não é garantir que o drone nunca perca a referência de navegação; é garantir que a organização continue tomando decisões justificáveis e verificáveis quando essa referência deixa de ser confiável.' }));
B.push('<div class="col">' + C.scope(R.MARCA.familia + ' Esta minuta é a base técnica de um programa de pesquisa aplicada para o ar: separa princípios, responsabilidades, procedimentos, requisitos técnicos, critérios de validação e governança, e mostra o protocolo em testes sintéticos na ilha de Florianópolis e no Médio Vale do Itajaí (SC). A avaliação militar vem depois, com resultados documentados. Não é doutrina aprovada, nem certificação de prontidão, nem proposta comercial. Nada aqui voou: cada afirmação traz o seu nível de maturidade. Hoje o Atalaia já pode ser avaliado como proposta metodológica; ainda precisa mostrar que pode ser implementado como sistema e validado como capacidade.') + '</div>');
B.push('<div class="col">' + C.note({ lab: 'Versão vigente', bodyRaw: C.plainList([
  { b: 'Versão ' + VERSAO.n + ', de ' + VERSAO.data + '.', text: 'A marca da família na entrada (integridade verificável para sistemas autônomos e infraestrutura crítica, em quatro domínios, o ar primeiro) e o princípio 10 reescrito: de só recepção para silencioso por padrão, com um módulo ativo opcional, proposto, que liga só dentro de um envelope aprovado antes da missão. O que nunca muda continua escrito ali. O histórico está na seção 13.' },
  { b: 'Finalidade.', text: 'Base técnica de um programa de pesquisa aplicada e minuta de protocolo para revisão técnica.' },
  { b: 'Público.', text: 'Engenharia, pesquisa aplicada e quem opera drones em logística, defesa civil e inspeção; mais tarde, avaliadores militares.' },
  { b: 'Situação experimental.', text: 'Simulação e bancada. Nenhum voo real.' },
  { b: 'Próxima etapa.', text: 'Pesquisa aplicada com um instituto de engenharia: bancada, voos de calibração em campo autorizado e validação independente (seção 12).' }]) }) + '</div>');
const STATS_AT = B.push('') - 1;                  /* the strip is written last, from the tally of marked claims */
B.push('<div class="col">' + C.note({ lab: 'Como ler esta minuta: três níveis de maturidade', bodyRaw: C.plainList([
  { raw: chip('D') + ' Resultado obtido em teste documentado, em simulação ou em bancada, com registro que pode ser entregue a quem avalia, para refazer o teste. Demonstrado não é validado: a simulação confere as contas e o programa, não o equipamento.' },
  { raw: chip('V') + ' Resultado observado em equipamento e ambiente reais. Nesta versão, nenhum item chegou a esse nível.' },
  { raw: chip('P') + ' Requisito, regra ou comportamento ainda não demonstrado, ou decisão que cabe à organização que opera. A minuta diz o que precisa acontecer para que ele suba de nível.' }]) }) + '</div>');

/* 1 · the thesis */
B.push(C.section({ lab: '1 · A tese', title: 'Saber o que se pode garantir, não só onde se está', bodyRaw:
  C.p('Todo drone moderno usa a navegação por satélite para saber onde está: o GPS americano, o Galileo europeu e sistemas parecidos, que juntos se chamam GNSS. O sinal chega do espaço muito fraco e, por isso, é fácil de abafar ou de imitar. Em janeiro de 2025, um bloqueador escondido em Belo Horizonte fez 21 aeronaves perderem o GPS na aproximação do aeroporto da Pampulha, e a Anatel só achou o aparelho rastreando o sinal em campo. Na guerra da Ucrânia, um estudo do RUSI de 2023 estimou em cerca de 10 mil por mês as perdas de drones ucranianos, num trecho dedicado à guerra eletrônica russa. Um drone que confia cegamente no GNSS pode ser desviado devagar, sem que o piloto perceba, ou simplesmente se perder.')
  + C.p('O problema aparece onde quer que um drone precise chegar sem ser guiado à mão: na logística para comunidades isoladas, nas entregas de emergência, na defesa civil durante uma enchente, na inspeção de linhas e de encostas, no monitoramento ambiental. O Exército também estuda drones para levar suprimento a tropas isoladas. Em 2025, oficiais da Escola de Aperfeiçoamento de Oficiais simularam um drone de carga DJI FlyCart 30 abastecendo um pelotão na montanha. O drone fez até 89% das entregas, e o estudo registra uma variação considerável do GPS em áreas montanhosas e recomenda ensaios práticos.')
  + C.p('A resposta comum é dar ao drone sensores melhores, para que ele nunca se perca. O Atalaia parte de outra pergunta. Em vez de “onde o drone está?”, pergunta “o que a operação consegue garantir sobre onde o drone está?”, e só deixa a missão prosseguir quando as condições de segurança podem ser demonstradas dentro de limites combinados antes do voo. A confiança deixa de estar num sensor isolado e passa a estar num conjunto de evidências que precisam concordar.')
  + C.table({ cols: [{ h: '' }, { h: 'A abordagem comum, e a do Atalaia' }], rows: [
    [c1('A pergunta'), c2([['Comum:', 'onde o drone está?'], ['Atalaia:', 'o que se pode garantir sobre onde o drone está?']])],
    [c1('A posição'), c2([['Comum:', 'um ponto, a melhor estimativa disponível.'], ['Atalaia:', 'uma região de proteção, que contém a posição real se as hipóteses declaradas valerem.']])],
    [c1('A confiança'), c2([['Comum:', 'no sensor principal, em geral o GNSS.'], ['Atalaia:', 'no acordo entre evidências de física diferente; nenhuma fonte vale sozinha, e a independência entre elas é medida, não suposta.']])],
    [c1('Quando faltam evidências'), c2([['Comum:', 'o sistema responde mesmo assim.'], ['Atalaia:', 'o laudo pode dizer “falta dado” e nomear o dado que decidiria.']])],
    [c1('Quando a missão termina'), c2([['Comum:', 'no pouso.'], ['Atalaia:', 'quando o registro permite reconstruir e conferir cada decisão.']])],
    [c1('Quando muda o fabricante'), c2([['Comum:', 'muda a forma de operar.'], ['Atalaia:', 'muda a ficha técnica; o protocolo fica.']])]] })
  + C.pull(esc('A resiliência não está em garantir que o equipamento nunca perca a referência de navegação, mas em garantir que a organização continue tomando decisões justificáveis e verificáveis quando essa referência deixa de ser confiável.'))
  + src('Fontes: Anatel e Polícia Militar, apreensão do bloqueador (Convergência Digital, 24/01/2025); J. Watling e N. Reynolds, ' + a('https://rusi.org/explore-our-research/publications/special-resources/meatgrinder-russian-tactics-second-year-its-invasion-ukraine', '<em>Meatgrinder</em>') + ', RUSI, 19/05/2023; Souza e Burity, <em>Revista Agulhas Negras</em> v. 9, n. 14 (2025), ' + a('https://doi.org/10.70545/ran.v9i14.13519', 'doi:10.70545/ran.v9i14.13519') + '.') }));

/* 2 · where it sits */
B.push(C.section({ lab: '2 · O que já existe', title: 'Uma tradição que já existe: o PNT assegurado', bodyRaw:
  C.p('Navegação resiliente não é uma ideia nova, e o Atalaia não a reivindica. O Exército dos Estados Unidos trata há anos o GPS como um serviço que pode faltar, sob o nome de PNT assegurado (posição, navegação e tempo). O manual FM 3-14, de 2019, lembra que uma brigada típica tem mais de 2.500 equipamentos que dependem de PNT, pede que as operações considerem a interferência no GPS e ajudem os comandantes a entender quanto dependem dele, e diz que as unidades treinam também para operar num ambiente espacial negado, degradado ou interrompido. O centro de lições aprendidas daquele exército publicou em 2018 um manual inteiro sobre esse ambiente, com um exercício-padrão de reação à interferência. E a arquitetura que ele adota hoje combina o GPS com sensores inerciais, odômetros e relógios atômicos em chip, que servem para conferir a integridade do sinal recebido.')
  + C.p('Um estudo do Belfer Center, de Harvard, publicado em junho de 2026, resume o problema para sistemas autônomos: sem PNT resiliente, eles podem falhar, e quando nenhuma fonte devolve a posição, o sistema passa a estimá-la pelo próprio movimento, com um erro que cresce sem limite. A aviação civil formalizou a mesma preocupação com outro vocabulário. Um receptor certificado não informa só a posição: informa um nível de proteção, a região que deve conter a posição verdadeira com um risco declarado, e cada fase do voo tem um limite de alerta, de 40 m na horizontal numa aproximação de precisão. Se o nível de proteção passa do limite, a navegação é declarada indisponível para aquela fase.')
  + C.p('O que o Atalaia acrescenta é a organização dessas peças num protocolo que se pode conferir: quatro perguntas com veredito antes do voo, a posição como região com limite por fase, estados da missão com ação e autoridade combinadas antes, e um registro que outra instituição refaz. Em uma frase, levar o PNT assegurado até a execução assegurada da missão.')
  + C.table({ cols: [{ h: 'Dimensão' }, { h: 'A tradição, e o que o Atalaia acrescenta' }], rows: [
    [c1('Integridade', mt('D', 'simulação')), c2([['Hoje:', 'fontes confiáveis e redundantes; na aviação, nível de proteção e limite de alerta.'], ['Atalaia:', 'um teste explícito: a posição do GNSS precisa caber na região calculada com evidências independentes.']])],
    [c1('Navegação', mt('D', 'simulação')), c2([['Hoje:', 'fusão de sensores, que entrega a melhor estimativa.'], ['Atalaia:', 'a região de proteção ao lado da melhor estimativa; quando as duas discordam, vale a região.']])],
    [c1('Planejamento', mt('D', 'simulação')), c2([['Hoje:', 'avaliação de disponibilidade e de risco.'], ['Atalaia:', 'quatro perguntas com veredito (passa, não passa, falta dado) e o dado que mudaria cada um.']])],
    [c1('Segurança', mt('P')), c2([['Hoje:', 'proteções e procedimentos de contingência.'], ['Atalaia:', 'seis estados da missão, com ação e autoridade combinadas antes do voo.']])],
    [c1('Pós-missão', mt('D', 'bancada')), c2([['Hoje:', 'registros de voo e avaliação.'], ['Atalaia:', 'registro assinado a bordo, encadeado e refeito por um verificador independente.']])],
    [c1('Aprendizado', mt('P')), c2([['Hoje:', 'atualização de capacidades.'], ['Atalaia:', 'cada voo estreita as faixas dos laudos; um laudo que erra mais do que declarou é suspenso.']])]] })
  + src('Fontes: Exército dos EUA, FM 3-14, <em>Army Space Operations</em>, 30/10/2019 (cap. 1; §2-29, §2-30, §3-4); Center for Army Lessons Learned, ' + a('https://api.army.mil/e2/c/downloads/2023/01/19/7f7281ee/18-28-operating-in-a-denied-degraded-and-disrupted-space-operational-environment-handbook-jun-18-public.pdf', 'Handbook 18-28') + ', jun. 2018; ' + a('https://www.army.mil/article/262096', 'army.mil') + ', 18/11/2022, e ' + a('https://insidegnss.com/u-s-army-taking-a-layered-approach-to-pnt/', 'Inside GNSS') + ', 03/06/2025 (a arquitetura em camadas); C. Mignone, ' + a('https://www.belfercenter.org/research-analysis/navigating-without-gps-cascading-alt-pnt-architecture-american-defense', '<em>Navigating Without GPS</em>') + ', Belfer Center, 29/06/2026; FAA, ' + a('https://www.nstb.tc.faa.gov/Terms.html', 'WAAS/GPS Terms and Definitions') + ' (nível de proteção horizontal; limite de alerta LPV).') }));

/* 3 · the worked mission */
const PH = [
  ['1', 'Planejar', 'As quatro perguntas', 'Antes de decolar, a Central responde as quatro perguntas da seção 6. A viabilidade passa: rota, energia, clima e GNSS passam no pior caso. As outras três dizem falta dado, e a seção 6 mostra por quê.', 'Procedimento antes do voo (seção 6).', mt('D', 'simulação') + ' Laudos calculados sobre o relevo de Blumenau e a ficha da DJI.'],
  ['2', 'Decolar', 'Estado 0: o GNSS é conferido antes de sair', 'A caixa a bordo compara o GNSS com os próprios sensores de movimento e confere a assinatura digital que o satélite europeu Galileo coloca nas mensagens. São dois testes separados: a assinatura diz que os dados vêm do Galileo; a comparação diz se a posição faz sentido.', 'Princípios 1 e 4; estado 0 (seção 7).', mt('D', 'vetores oficiais') + ' A conferência da assinatura passou nos vetores de teste oficiais do Galileo: 193.887 conferências, nenhuma falha. Isso mostra que a conferência funciona nesses vetores, não que um receptor resista a falsificação ou retransmissão; ainda não foi feita com sinal ao vivo.'],
  ['3', 'Ataque', 'Estados 1 e 2: alguém falsifica o GNSS', 'No meio do caminho, um aparelho passa a imitar o GNSS e a puxar o drone devagar para o lado. A posição informada encosta na borda da região (estado 1) e depois sai dela (estado 2): a caixa declara o GNSS falso e avisa o piloto, apontando o culpado.', 'Estados 1 e 2 (seção 7).', mt('D', 'simulação') + ' Numa viagem simulada de caminhão na BR-040, o alarme veio 3 segundos depois de a posição real sair da estrada. Em dados GNSS reais gravados em estações fixas do IBGE, desvios lentos sintéticos foram detectados em 24 de 24 tentativas quando o teste sabia que a estação estava parada, e em nenhuma sem essa restrição de movimento: num drone, ela viria do sensor de movimento da caixa, e isso ainda não foi testado com dados de voo.'],
  ['4', 'Sem GNSS', 'Estado 2: segue pela região', 'A caixa deixa o GNSS de lado e continua com a região: o movimento a faz crescer, o relevo e a imagem a estreitam. Em Blumenau o relevo ajuda em todo o caminho, que é o caso favorável. Num DJI de hoje, a caixa não pode guiar o drone: avisa, e o piloto manda parar ou pousar.', 'Estado 2 e o limite do DJI (seção 7).', mt('D', 'simulação') + ' Em 45 voos simulados de 45 minutos sobre relevo e imagens reais de Minas Gerais, a posição real ficou dentro da região em todas as 24.300 verificações. São instantes de 45 trajetórias, correlacionados dentro de cada voo: não são 24.300 experimentos independentes.'],
  ['5', 'Chegada', 'A descida só sobre o marcador de quem recebe', 'Perto do posto, a câmera compara o chão com o mapa, e a região se estreita. No ponto final, a caixa reconhece o painel com o código de uso único, e o piloto vê o marcador e autoriza a descida. Sem enlace não há autorização, e sem autorização não há descida de precisão: valem os estados 3 e 4.', 'Procedimento na chegada (seção 7).', mt('P') + ' O marcador e a descida de precisão são proposta. Em simulação, a comparação entre câmera e mapa errou até cerca de 10 m em 95% dos casos, de alturas maiores que a de uma entrega.'],
  ['6', 'Entrega', 'O registro é lacrado', 'O registro do voo é lacrado a bordo: onde a entrega aconteceu, quando aconteceu cada etapa, em que estado a missão esteve e as contas da carga, com o pedido, o embarcado e o entregue.', 'Governança (seção 10).', mt('D', 'bancada') + ' O laudo e o lacre foram testados em bancada no Veto, o nosso instrumento de perícia: 53 erros plantados de propósito, todos pegos.'],
  ['7', 'Retorno', 'A frota aponta a região do ataque', 'Cada drone que passa pela área registra onde perdeu e onde manteve o GNSS. Juntos, apontam a região do aparelho que atacou, só escutando. O que o voo mediu volta para os laudos da próxima missão.', 'Princípio 10; governança (seção 10).', mt('D', 'simulação') + ' Em simulação, com 10 receptores a região do aparelho ficou com 26 km; com 250, 6 km; com três postos fixos em terra, 350 m. Os receptores do teste eram aviões; com drones, falta validar.']];
const vIl = (m) => ([m.rota.verdict, m.energia12.verdict].includes('NAO PASSA') ? 'NAO PASSA' : [m.rota.verdict, m.energia12.verdict].includes('FALTA DADO') ? 'FALTA DADO' : 'PASSA');
const enTxt = (m) => (m.energia12.verdict === 'PASSA' ? 'com ' + IL.carga_kg + ' kg, sobram ao menos ' + n(m.energia12.margin_wh[0]) + ' Wh além da reserva.'
  : m.energia12.verdict === 'FALTA DADO' ? 'entre ' + n(m.energia12.margin_wh[0]) + ' e +' + n(m.energia12.margin_wh[1]) + ' Wh: nenhuma medida sozinha decide; decidem juntas as de um programa de voos de calibração (consumo com carga, subida, saúde das baterias e tempo de pouso).'
  : 'ida e volta de ' + n(2 * m.km, 1) + ' km passam do alcance' + (m.energia5.verdict === 'NAO PASSA' ? ', mesmo com 5 kg.' : '.'));
const roTxt = (m) => (m.rota.verdict === 'PASSA' ? 'sem GNSS, o relevo devolve a posição em ' + Math.round(m.rota.ajuda * 100) + '% do caminho.'
  : 'sem GNSS, sobre a água nem o relevo nem a imagem devolvem a posição no fim da perna. Decide: voar só com o GNSS íntegro e voltar ao primeiro alarme, ou um marcador no destino.');
B.push(C.section({ lab: '3 · Os testes', title: 'Testes sintéticos: a ilha primeiro, o Vale como referência', wide: true, bodyRaw:
  '<div class="col">'
  + C.p('Os testes começam em simulação, em duas áreas de Santa Catarina. A primeira é o norte da ilha de Florianópolis, ao lado de um instituto de engenharia: em poucos quilômetros estão morros, praias, dunas, a lagoa, o mar e o espaço aéreo controlado do aeroporto Hercílio Luz. Lá os testes são só sintéticos; voo real, só em campo autorizado.')
  + C.p('O mapa mostra a base, até onde o drone de exemplo vai e volta com ' + IL.carga_kg + ' kg e quatro missões calculadas, cada uma desenhada pelo pior dos seus vereditos. A comunidade da Costa da Lagoa só é acessível por barco ou por trilha, e é o caso civil que motiva o protocolo.')
  + '</div>'
  + C.figure({ hero: true, svgRaw: ilhaMapa(false), svgNarrowRaw: ilhaMapa(true), record: ['apps/atalaia/data/ilha.json'],
    caption: 'O norte da ilha de Florianópolis sobre o relevo Copernicus GLO-30. O anel cheio é até onde o drone vai e volta com ' + IL.carga_kg + ' kg no pior caso (' + n(IL.alcance.passa_km[0], 1) + ' a ' + n(IL.alcance.passa_km[1], 1) + ' km); o tracejado longo, até onde falta dado. Linha cheia: a missão passa; tracejado longo: falta dado; tracejado curto: não passa. Simulação; nada voou.' })
  + C.table({ cols: [{ h: 'Missão' }, { h: 'Rota e energia, com ' + IL.carga_kg + ' kg' }], rows: [
    [c1('Costa da Lagoa, direto da base · ' + n(ILM['costa-base'].km, 1) + ' km', vt(vIl(ILM['costa-base']))), c2([['Energia:', enTxt(ILM['costa-base'])], ['Rota:', roTxt(ILM['costa-base'])]])],
    [c1('Costa da Lagoa, de uma base avançada no Rio Vermelho · ' + n(ILM['costa-rv'].km, 1) + ' km', vt(vIl(ILM['costa-rv']))), c2([['Energia:', enTxt(ILM['costa-rv'])], ['Rota:', roTxt(ILM['costa-rv'])]])],
    [c1('Posto nos morros · ' + n(ILM.morros.km, 1) + ' km', vt(vIl(ILM.morros))), c2([['Energia:', enTxt(ILM.morros)], ['Rota:', roTxt(ILM.morros)]])],
    [c1('Barco ao largo, 4 km mar adentro', vt(vIl(ILM.agua))), c2([['Energia:', enTxt(ILM.agua)], ['Rota:', roTxt(ILM.agua)]])]] })
  + '<div class="col">'
  + C.pRaw(esc('A mesma lição aparece duas vezes: a missão que não passa direto da base pode passar de uma base mais perto, e o que decide o resto é medido, não suposto. Um quinto caso, uma rota de ' + n(IL.caso_ctr.km, 1) + ' km que entra na zona de controle do aeroporto (' + CTRV.tipo + ' ' + CTRV.designador + ', da superfície a ' + n(+CTRV.limites[2]) + ' pés, controle militar), dá falta dado no laudo de espaço aéreo: decide a autorização do órgão que controla esse espaço, pedida no SARPAS. Os volumes vêm do pacote de dados do DECEA, conferido na publicação de informação aeronáutica (AIP).') + ' ' + mt('D', 'simulação'))
  + C.p('A segunda área é o Médio Vale do Itajaí, o cenário operacional de referência. A base fica em Blumenau, a ' + zBase + ' m de altitude; o posto avançado fica a ' + n(AV.post_km) + ' km, nos morros a sudoeste, a ' + zPost + ' m, e recebe ' + KG + ' kg por saída: ' + CAP.saidas_precisa + ' saídas cobrem os ' + FR.pedido_kg_dia + ' kg por dia que o estudo da ESAO usou para um pelotão. É também onde as enchentes isolam comunidades.')
  + C.p('O drone dos exemplos é o DJI FlyCart 30, porque a DJI publica a ficha dele e as contas de energia precisam dela. O protocolo não depende do modelo: com outro drone, troca-se a ficha e refazem-se as contas. As bases e os destinos são pontos escolhidos sobre o relevo real; nenhuma instalação real é indicada.')
  + '</div>'
  + C.figure({ svgRaw: twin(mapa(false), mapa(true)), record: ['apps/atalaia/data/missao.json', 'apps/atalaia/data/central.json'],
    caption: 'A missão de referência sobre o relevo do Vale do Itajaí (Copernicus GLO-90). A linha cheia é o voo, da base ao posto avançado; os números marcam onde, na simulação, começa o ataque ao GNSS (3), onde o drone segue sem GNSS (4) e onde acha o marcador do posto (5). A linha tracejada continua até a serra: ali a bateria não leva e traz o drone.' })
  + '<div class="col"><p class="at-k">A missão de referência fase a fase</p></div>'
  + C.picker({ name: 'fase', items: PH.map(([k, t, title, lead, onde, mat]) => ({ k, t, title, leadRaw: esc(lead),
    boxes: [{ lab: 'Onde está na minuta', bodyRaw: esc(onde) }, { lab: 'Maturidade', bodyRaw: mat }] })) }) }));

/* 4 · principles */
const PRINC = [
  ['Confiança proporcional à evidência.', 'Nenhuma fonte de posição é aceita sozinha, nem o GNSS nem a alternativa a ele. A posição vale quando fontes de natureza física diferente concordam, e vale só na medida em que concordam. Física diferente não garante erros independentes: a independência é uma hipótese, medida na qualificação.'],
  ['A posição é uma região.', 'O protocolo trabalha com a região de proteção, que contém a posição do drone se as hipóteses declaradas valerem, e cada fase da missão tem um tamanho máximo de região que tolera. Um ponto sem região não autoriza nada.'],
  ['Desconfiar também da alternativa.', 'O sistema precisa perceber quando a própria estimativa deixou de valer. Quando duas evidências que deveriam valer juntas se contradizem, a região fica vazia: isso é um alarme, e prova que alguma hipótese falhou.'],
  ['Autenticar não é garantir a posição.', 'Uma assinatura válida no sinal do satélite prova de onde vieram os dados, não que o sinal chegou direto do satélite ao drone. A autenticação da mensagem e a integridade da posição são dois controles, conferidos em separado.'],
  ['O direito de não decidir.', 'Toda pergunta tem três respostas: passa, não passa e falta dado. Falta dado nunca vira passa por pressa; vira o pedido do dado que decidiria.'],
  ['Interromper é sempre permitido; continuar exige evidência.', 'Qualquer elo da cadeia pode interromper uma missão sem justificar antes. Continuar, ou retomar depois de um alarme, exige os laudos e a autorização de quem responde.'],
  ['Responsabilidade humana.', 'Toda missão tem quem a autoriza e um piloto que responde pelo voo. O sistema calcula, alerta e registra; as decisões são de pessoas com função definida, e ficam no registro.'],
  ['Quem executa não é quem verifica.', 'Os registros são conferidos por outra instituição, com um programa escrito por ela. Um sistema que só pode ser conferido por quem o fez não serve a quem depende dele.'],
  ['Independência de fabricante.', 'O protocolo exige evidências e comportamentos, não um modelo de drone. Um equipamento entra quando passa na qualificação da seção 9, e a doutrina não muda quando o fornecedor muda.'],
  ['Cada voo ensina, em silêncio por padrão.', 'O que o voo mede estreita os laudos do voo seguinte, e um laudo que erra mais do que declarou é suspenso. ' + R.MARCA.sinais + ' Não guia armas, não designa alvos e não rastreia pessoas.']];
if (PRINC.length !== 10) die('the principles section says ten and holds ' + PRINC.length);
B.push(C.section({ lab: '4 · Princípios', title: 'Dez princípios que não mudam com o equipamento', bodyRaw:
  C.p('Os princípios são a parte da minuta que deve sobreviver à troca de drone, de sensor e de fornecedor. As responsabilidades, os procedimentos e os requisitos das seções seguintes derivam deles, e cada um pode ser cobrado de qualquer equipamento.')
  + '<div class="at-rules"><ol>' + PRINC.map(([h, t]) => '<li><p><b>' + esc(h) + '</b> ' + esc(t) + '</p></li>').join('') + '</ol></div>' }));

/* 5 · responsibilities */
B.push(C.section({ lab: '5 · Responsabilidades', title: 'O drone é uma parte; a resiliência é da organização', bodyRaw:
  C.p('Uma doutrina centrada no drone deixa de fora quem autoriza, quem supervisiona e quem mantém os mapas e as calibrações de que o drone depende. O protocolo cobre cinco camadas e uma verificação de fora, e cada uma responde por uma parte da decisão.')
  + C.table({ cols: [{ h: 'Camada' }, { h: 'Quem, e por que responde' }], rows: [
    [c1('Comando e controle'), c2([['Quem:', 'quem responde pela missão na organização que opera (na defesa civil, a coordenação da operação; numa Força, o comandante), e a cadeia acima.'], ['Responde por:', 'autorizar a missão, aceitar por escrito o risco que sobra, interromper.']])],
    [c1('Central de operações'), c2([['Quem:', 'o operador da Central, junto ao planejamento.'], ['Responde por:', 'calcular as quatro perguntas, acompanhar o voo, receber e guardar os registros (Atalaia Central).']])],
    [c1('Piloto'), c2([['Quem:', 'o piloto remoto responsável.'], ['Responde por:', 'conduzir o voo, agir pelo procedimento, autorizar a descida.']])],
    [c1('Plataforma aérea'), c2([['Quem:', 'o drone e a caixa a bordo (Atalaia Bordo).'], ['Responde por:', 'sensores, região de proteção, energia, registro assinado a bordo.']])],
    [c1('Apoio'), c2([['Quem:', 'manutenção, cartografia e calibração.'], ['Responde por:', 'mapas e suas datas, calibração dos sensores, baterias, chaves da caixa.']])],
    [c1('Verificação independente'), c2([['Quem:', 'outra instituição: na pesquisa, um laboratório de universidade; numa avaliação militar, o IME ou o CTEx.'], ['Responde por:', 'refazer cada decisão a partir do registro, com um programa próprio.']])]] })
  + C.p('A resiliência também tem cinco dimensões, e cada uma pede uma resposta diferente.')
  + C.table({ cols: [{ h: 'Dimensão' }, { h: 'A pergunta, e a resposta do protocolo' }], rows: [
    [c1('Técnica', mt('D', 'simulação')), c2([['O sistema depende de uma fonte só?', 'O GNSS é conferido contra inércia, relevo e imagem, e a posição é uma região.']])],
    [c1('Operacional', mt('P')), c2([['A equipe cumpre ou interrompe a missão de modo controlado?', 'Seis estados da missão, com ação e autoridade combinadas antes (seção 7).']])],
    [c1('Organizacional', mt('P')), c2([['Quem faz o quê está definido e treinado antes?', 'As camadas acima, adestramento com ataques gravados e qualificação dos pilotos em cada estado.']])],
    [c1('Informacional', mt('D', 'bancada')), c2([['Os registros continuam confiáveis sem conexão?', 'Assinatura e encadeamento a bordo, sem depender do enlace; uma lacuna na corrente fica visível.']])],
    [c1('Institucional', mt('P')), c2([['Quem não fez o equipamento consegue conferir?', 'Um verificador independente e registros em formato aberto.']])]] })
  + C.p('Uma doutrina, ao contrário de uma tecnologia, precisa responder também a perguntas de organização. As respostas abaixo são propostas; a cadeia exata de cada uma é decisão da organização que opera.')
  + C.plainList([
    { b: 'Quem autoriza a missão?', raw: esc('Quem a comanda, com as quatro perguntas da Central em mãos. A autorização entra no registro com a função de quem autorizou e a hora.') + ' ' + mt('P') },
    { b: 'Quem pode interromper?', raw: esc('Qualquer um: quem comanda, o operador da Central, o piloto, e a própria caixa, por alarme. Ninguém precisa justificar uma interrupção antes de fazê-la.') + ' ' + mt('P') },
    { b: 'Quem responde quando o equipamento diverge do procedimento?', raw: esc('O piloto segue o procedimento, não o equipamento. A divergência fica no registro, o equipamento é suspenso até ser conferido, e o caso é tratado primeiro como investigação técnica.') + ' ' + mt('P') },
    { b: 'Como a equipe treina para a degradação?', raw: esc('Com ataques gravados injetados na caixa com o drone em solo, sem emitir sinal; depois, com exercícios em área autorizada. Cada piloto se qualifica em cada estado da missão.') + ' ' + mt('P') },
    { b: 'Como o sistema age quando as próprias evidências não bastam?', raw: esc('Antes do voo, a pergunta dá falta dado e a missão espera. Em voo, a região vazia ou grande demais leva ao estado 5 e à ação mais conservadora já autorizada.') + ' ' + mt('D', 'simulação') },
    { b: 'Como a instituição aprende?', raw: esc('Cada voo lacrado alimenta os laudos do voo seguinte, e uma mudança na minuta passa pelo canal de normas da organização (numa Força, o de doutrina), com versão e motivo escritos.') + ' ' + mt('P') }]) }));

/* 6 · procedure before flight */
B.push(C.section({ lab: '6 · Procedimento: antes do voo', title: 'Quatro perguntas antes de decolar', bodyRaw:
  C.p('Antes de cada missão, a Central responde quatro perguntas, cada uma com veredito próprio: passa, não passa ou falta dado. Uma missão pode ser viável e, ainda assim, não estar pronta, e separar as perguntas deixa isso à vista.')
  + C.table({ cols: [{ h: 'Pergunta' }, { h: 'O que se confere, e nesta missão' }], rows: [
    [c1('Viabilidade', vt('PASSA')), c2([['A missão pode ser feita nas condições conhecidas?', ''], ['Confere:', 'os quatro laudos, no pior caso: rota, energia, clima e GNSS.'], ['Nesta missão:', 'os quatro passam (abaixo).']])],
    [c1('Resiliência', vt('FALTA DADO')), c2([['Se o GNSS e o enlace caírem no pior ponto, há uma saída segura já autorizada?', ''], ['Confere:', 'a energia para esperar o enlace e chegar a uma zona de pouso de contingência levantada no terreno.'], ['Nesta missão:', 'a reserva dá ' + n(RES_MIN) + ' minutos de espera; nenhuma zona de contingência foi levantada.']])],
    [c1('Segurança', vt('FALTA DADO')), c2([['Os estados da missão, os limites e as ações estão aprovados?', ''], ['Confere:', 'a tabela de estados (seção 7), o limite de região por fase e o risco que sobra, aceito por escrito.'], ['Nesta missão:', 'definidos nesta minuta; a aprovação cabe à organização que opera.']])],
    [c1('Auditabilidade', vt('FALTA DADO')), c2([['O voo vai poder ser reconstruído?', ''], ['Confere:', 'a chave da caixa guardada em hardware, o relógio, a corrente de registros, o verificador.'], ['Nesta missão:', 'a caixa ainda não existe; o lacre foi testado só em bancada.']])]] })
  + C.p('Pelo próprio protocolo, a missão de exemplo hoje não seria liberada. Ela é viável, mas faltam a zona de pouso de contingência, a aprovação dos estados pela organização que opera e a caixa que lacra o registro. É o comportamento pedido: a Central não libera o que não consegue demonstrar, e diz o que falta.')
  + '<h3 class="at-h3">A viabilidade, laudo por laudo</h3>'
  + C.p('Cada laudo de viabilidade responde a uma pergunta. O de energia usa o método do SkyAudit, que decidiu um dia real de voos de helicóptero em Nova York: cada número entra como uma faixa, do pior ao melhor caso, e a missão só passa se a bateria cobrir o gasto e a reserva na faixa inteira. A reserva é uma regra da organização que opera, não uma escolha do piloto no momento; até que ela a fixe, a minuta propõe ' + n(RES_MIN) + ' minutos pairando.')
  + C.table({ cols: [{ h: 'Laudo' }, { h: 'A pergunta, e nesta missão' }], rows: [
    [c1('Rota', vt('PASSA')), c2([['Sem GNSS, o relevo devolve a posição do drone a tempo?', ''], ['Nesta missão:', 'o relevo ajuda em ' + Math.round(MJ.posto.laudo.share_ajuda * 100) + '% do caminho.']])],
    [c1('Energia', vt('PASSA')), c2([['A bateria leva e traz, com a reserva intacta, no pior caso?', ''], ['Nesta missão:', 'com ' + KG + ' kg, sobram ao menos ' + n(R12.margin_wh[0]) + ' Wh além da reserva. Passa até ' + AV.passa_ate_kg + ' kg.']])],
    [c1('Clima', vt('PASSA')), c2([['O vento e a temperatura previstos estão dentro do que o fabricante garante?', ''], ['Nesta missão:', 'vento previsto de ' + n(CJ.clima.vento_ms[0]) + ' a ' + n(CJ.clima.vento_ms[1]) + ' m/s; o limite é ' + n(CJ.ficha.vento_max_ms) + ' m/s. Previsão simulada.']])],
    [c1('GNSS', vt('PASSA')), c2([['Há alerta de interferência na área?', ''], ['Nesta missão:', 'nenhum nas últimas 24 h. Leitura simulada.']])]] })
  + C.figure({ svgRaw: twin(energia(false), energia(true)), record: 'apps/atalaia/data/central.json',
    caption: 'A margem de energia, que é a bateria menos o gasto menos a reserva, do pior ao melhor caso, para três missões a partir da mesma base. Inteira à direita do zero, passa; cruzando o zero, falta dado; inteira à esquerda, não passa.' })
  + C.p('Todo laudo diz o que mudaria o resultado, para que o planejador saiba o que ajustar e a organização saiba que dado vale a pena medir. Com 30 kg, o laudo não decide: no pior caso o drone pousaria abaixo da reserva; no melhor, sobraria energia. O instrumento não chuta e diz o que decidiria: nenhuma medida sozinha basta, e juntas decidem as de um programa de voos de calibração (consumo com carga, subida, saúde das baterias e tempo de pouso). Já um posto na serra, a 15 km, não passa nem com o drone vazio, porque ida e volta somam 30 km e a ficha da DJI dá ' + n(CJ.ficha.alcance_vazio_km) + ' km ao FlyCart 30 sem carga.')
  + C.p('Com ' + KG + ' kg, a distância que passa no pior caso, dentro das premissas, é hoje de ' + n(AL.passa_ate_km) + ' km. Entre ' + n(AL.passa_ate_km + 0.5, 1) + ' e ' + n(AL.nao_passa_de_km - 0.5, 1) + ' km falta dado, e a partir de ' + n(AL.nao_passa_de_km) + ' km não passa. Cada voo de calibração estreita as faixas, e essa distância cresce.')
  + C.note({ lab: 'De onde vêm as contas de energia', bodyRaw: C.plainList([
    { b: 'Da ficha da DJI.', text: 'Duas baterias de ' + n(CJ.ficha.bateria_wh, 1) + ' Wh; ' + n(CJ.ficha.alcance_vazio_km) + ' km sem carga e ' + n(CJ.ficha.alcance_cheio_km) + ' km com 30 kg; ' + n(CJ.ficha.pairar_vazio_min) + ' e ' + n(CJ.ficha.pairar_cheio_min) + ' minutos pairando; vento máximo de ' + n(CJ.ficha.vento_max_ms) + ' m/s (dji.com, lida em 15/11/2026).' },
    { b: 'Premissas declaradas.', text: 'A ficha usou de 85% a 100% da bateria; a bateria tem de 90% a 100% da saúde; o ar fica mais fino com a altitude; o vento é o da previsão; decolagem, pouso e descarga levam de ' + n(CJ.premissas.paira_min[0]) + ' a ' + n(CJ.premissas.paira_min[1]) + ' minutos; a reserva é de ' + n(RES_MIN) + ' minutos pairando.' },
    { b: 'O que substitui cada premissa.', text: 'Uma leitura da bateria, um voo de calibração ou uma previsão melhor. Cada uma estreita a faixa e pode virar um falta dado em passa.' },
    { b: 'O que ainda não entra.', text: 'A temperatura e o envelhecimento da bateria entram só pela faixa de saúde declarada. As margens simuladas precisam ser confrontadas com medições reais sob carga, vento, temperatura e bateria envelhecida: é o que os voos de calibração fazem.' }]) }) }));

/* 7 · procedure in flight: the mission states */
const EST_ROWS = [
  ['0 · Normal', 'O GNSS cabe na região e o enlace está ativo', 'Segue o plano', 'o piloto', mt('D', 'simulação')],
  ['1 · GNSS em dúvida', 'A assinatura do Galileo falha, ou o GNSS encosta na borda da região', 'Avisa o piloto e passa a navegar pela região, sem descartar o GNSS ainda', 'o piloto: continuar ou interromper', mt('D', 'simulação')],
  ['2 · GNSS falso ou negado', 'O GNSS sai da região, ou some', 'Declara o GNSS falso; segue pela região se a rota permitir e a região couber no corredor da fase; senão, para e pousa. Nunca volta para casa guiado pelo GNSS', 'o piloto, dentro do que foi autorizado', mt('D', 'simulação')],
  ['3 · Enlace perdido', 'Sem contato com a estação, com o GNSS confiável', 'Executa a ação de enlace perdido escolhida no planejamento e conferida na pergunta de segurança', 'ninguém em voo: a decisão foi tomada antes', mt('P')],
  ['4 · GNSS e enlace perdidos', 'As duas coisas ao mesmo tempo', 'Espera o enlace dentro da região até o limite da reserva; se ele não voltar, vai à zona de contingência que contém a região com folga; se não houver nenhuma, pousa onde está. Esse risco foi avaliado no solo ao longo da rota e aceito por escrito antes do voo', 'ninguém em voo: a decisão foi tomada antes', mt('P')],
  ['5 · Estimativa não confiável', 'A região fica vazia, ou maior que o limite da fase', 'Declara-se perdido, registra o motivo e executa a ação mais conservadora já autorizada, em geral pousar', 'o piloto, se houver enlace; senão, a regra', mt('D', 'simulação: o alarme')]];
B.push(C.section({ lab: '7 · Procedimento: durante o voo', title: 'Seis estados da missão, combinados antes do voo', bodyRaw:
  C.p('O que fazer quando o GNSS mente, quando o enlace com a estação cai, ou quando as duas coisas acontecem juntas, não pode ser decidido no ar. O protocolo define seis estados. Para cada um, combina antes do voo o que o drone faz sozinho, o que o piloto decide e quanto tempo a situação pode durar. Não basta o sistema saber que está perdido: a organização precisa saber, antes, o que fazer quando isso acontece.')
  + C.p('As regras de voo já pedem essa preparação, sem dizer como cumpri-la com o GNSS falso. A ICA 100-40 do DECEA, na edição de 2026, vale também para drones militares fora da circulação operacional militar, exige no planejamento uma alternativa para o caso de o voo não poder ser completado e um plano de terminação de voo antes do pedido de acesso ao espaço aéreo. O RBAC nº 100 da ANAC, que em junho de 2026 substituiu o RBAC-E 94 para o uso civil, exige que o piloto remoto possa intervir em qualquer fase do voo. Nas publicações abertas do Exército que lemos, não encontramos uma regra de enlace perdido para drones. Os estados abaixo são a proposta de como preencher essas exigências quando a referência de navegação deixa de ser confiável.')
  + C.figure({ svgRaw: twin(estados(false), estados(true)), source: 'built: a tabela de estados desta minuta',
    caption: 'Os seis estados. A missão sai do normal por uma de duas portas: o GNSS entra em dúvida ou o enlace cai. Os dois caminhos podem se juntar no estado 4, e qualquer um termina no estado 5 quando a própria estimativa deixa de valer. Em qualquer estado, interromper é permitido; voltar ao normal exige que a causa tenha sumido e a palavra do piloto.' })
  + C.table({ cols: [{ h: 'Estado' }, { h: 'Quando, o que o drone faz e quem decide' }], rows: EST_ROWS.map((r) => [c1(r[0], r[4]), c2([['Quando:', r[1] + '.'], ['O drone:', r[2] + '.'], ['Decide:', r[3] + '.']])]) })
  + C.pRaw(esc('Pousar onde está não é uma saída neutra. A navegação pode estar íntegra e o lugar, perigoso: uma rua, uma casa, uma rede elétrica, a água. Por isso o planejamento olha o que há no solo ao longo da rota, trecho por trecho, e só aceita por escrito os trechos em que pousar ali é tolerável; os outros pedem outra rota ou uma zona de contingência levantada. Como medir esse risco no solo é uma pergunta da pesquisa.') + ' ' + mt('P'))
  + C.p('Num drone DJI de hoje, a caixa a bordo avisa e pode mandar parar e pousar, mas não pode guiar o drone pela região: isso depende de um modo que a DJI documentou e ainda não liberou, ou de um autopiloto aberto, como PX4 ou ArduPilot. Por isso, num DJI, a ação autorizada nos estados 2, 4 e 5 é pousar. E a ação de enlace perdido precisa ser conferida no planejamento: se ela for voltar para casa, depende do GNSS, e voltar para casa guiado por um GNSS falso é exatamente o que um atacante quer.')
  + src('Fontes: DECEA, ' + a('https://www.gov.br/defesa/pt-br/assuntos/aerolevantamento/arquivos/2026/ica-100-40-publicada-port-2094-dnor8-18-03-2026-bca-058-30-03-2026.pdf', 'ICA 100-40') + ', Portaria nº 2.094/DNOR8, 18/03/2026 (art. 33, art. 73, V, e art. 74); ANAC, ' + a('https://pergamum.anac.gov.br/arquivos/RBAC100EMD00.pdf', 'RBAC nº 100') + ', Resolução nº 805, 15/06/2026 (§ 100.19(c)).')
  + C.p('Na chegada, a descida de precisão só acontece sobre o painel que o posto estende no chão, com um código de uso único recebido junto com a missão, e só depois que o piloto confirma. Sem o marcador de quem recebe a função não existe: ela não serve para apontar um ponto qualquer do terreno. E, sem enlace, não há confirmação; vale o estado 3 ou 4.')
  + C.p('O voo sintético abaixo mostra os estados 0 e 2 numa missão inteira. O drone sai da base, sofre o ataque ao GNSS no meio do caminho, segue pela região, entrega e volta, e a cada instante a Central acompanha quanta energia sobra, do pior ao melhor caso.')
  + C.figure({ svgRaw: voo(), record: 'apps/atalaia/data/central.json',
    caption: 'O voo sintético da missão, com ' + KG + ' kg. A faixa cinza é a energia que sobra, do pior caso (linha forte) ao melhor; a linha tracejada é a reserva. O círculo em volta do drone é a região de proteção, e fica vermelho enquanto o GNSS é falso. Seguir pela região supõe um autopiloto que aceite a posição da caixa; num DJI de hoje, a ação no estado 2 seria pousar. Simulação; não foi voado.' }) }));

/* 8 · technical requirements */
B.push(C.section({ lab: '8 · Requisitos técnicos', title: 'O que a região de proteção garante, e sob que hipóteses', bodyRaw:
  C.p('A região de proteção é o centro técnico do protocolo e a sua afirmação mais forte, por isso precisa ser lida com cuidado. Ela garante em dois níveis, e nenhum dos dois é absoluto.')
  + C.plainList([
    { b: 'Garantia determinística, sob limites declarados.', text: 'Se cada erro de cada sensor ficar dentro do limite declarado na ficha de calibração, a posição real está dentro da região. É uma consequência matemática, calculada com aritmética de intervalos: dentro dessas hipóteses, vale por construção.' },
    { b: 'Garantia probabilística, sob um modelo de ruído declarado.', text: 'A chance de o ruído dos sensores sair desses limites durante o voo é limitada dentro de um modelo estatístico declarado (abaixo). Fora do modelo, o número não vale.' }])
  + C.p('Fora das hipóteses, a região não vale, e o protocolo exige perceber quando se saiu delas. O nome vem da aviação, onde o nível de proteção de um receptor certificado é a região que deve conter a posição com um risco declarado (seção 2); usar o nome não sugere equivalência com um sistema aeronáutico certificado. Até a versão 0.4, esta minuta a chamava de região garantida.')
  + C.plainList([
    { b: 'O que está provado.', raw: esc('Se os erros ficam dentro dos limites, a posição real está dentro da região. O limite da deriva inercial tem demonstração escrita. Para o ruído dos sensores, a prova vale dentro de um modelo declarado: se o ruído de cada sensor for gaussiano, com a densidade declarada na ficha, a chance de a sua soma acumulada sair do envelope de seis desvios num voo de 45 minutos é no máximo de 6 em 100 milhões por componente (o princípio da reflexão, somado sobre cerca de 15 intervalos do voo). Esse é o risco de integridade da região de proteção, no sentido em que a aviação usa o termo, e vale só dentro do modelo: caudas mais pesadas que a gaussiana, sensores com erros correlacionados ou uma densidade declarada errada não estão cobertos. É isso que a bancada mede.') + ' ' + mt('D', 'prova escrita') },
    { b: 'O que foi testado.', raw: esc('Em 45 voos simulados de 45 minutos sobre relevo e imagens reais de Minas Gerais, a posição real ficou dentro da região em todas as 24.300 verificações; são instantes de 45 trajetórias, correlacionados dentro de cada voo, e não 24.300 experimentos independentes. Com sensor inercial de classe tática e câmera, a melhor estimativa errou até 12 m em 95% do tempo, e a região teve raio típico de 200 m. Um sensor inercial seis vezes pior que o declarado quebrou o limite, como deveria.') + ' ' + mt('D', 'simulação') },
    { b: 'O que ainda não se sabe.', raw: esc('Se os sensores reais respeitam os limites declarados. Na simulação, cada erro foi sorteado dentro do seu limite; por isso o teste confere a matemática e o programa, não o equipamento. Só voos reais respondem, na etapa de calibração da seção 9.') + ' ' + mt('P') }])
  + C.p('Cada hipótese da garantia pode falhar de um jeito próprio. A tabela diz o que acontece e como o protocolo detecta ou limita cada falha.')
  + C.table({ cols: [{ h: 'Hipótese' }, { h: 'O que pode dar errado, e como o protocolo detecta ou limita' }], rows: [
    [c1('Erros independentes entre sensores', mt('P')), c2([['Risco:', 'duas fontes que erram juntas parecem concordar, e a região encolhe sem razão.'], ['Controle:', 'fontes de física diferente: inércia, relevo pelo altímetro radar, imagem. Física diferente não garante independência estatística: vento, vibração, temperatura ou um relógio comum podem mover duas fontes juntas. Por isso a independência é medida: na qualificação, um teste de erro comum para cada par de fontes; na pesquisa, uma das perguntas da seção 12.']])],
    [c1('Deriva inercial dentro do limite', mt('D', 'simulação')), c2([['Risco:', 'o erro do sensor de movimento cresce com o tempo.'], ['Controle:', 'a região cresce pelo limite escrito do sensor. Com sensor de consumo, o limite se perde em cerca de 3 minutos; por isso o protocolo exige classe tática.']])],
    [c1('Sincronização de tempo', mt('P')), c2([['Risco:', 'uma medida com atraso desconhecido desloca a posição.'], ['Controle:', 'relógio comum entre a caixa e o drone, ou o atraso entra como faixa na região. Nos FlyCart, a porta não tem relógio comum; nos Matrice 350 e 300, tem.']])],
    [c1('Imagem comparável com o mapa', mt('D', 'simulação')), c2([['Risco:', 'iluminação, vegetação, estação do ano e nuvens fazem a câmera errar.'], ['Controle:', 'a câmera só propõe: uma comparação entra na região só se for única e cair dentro dela. Em simulação, com imagens de duas estações, 1.412 comparações aceitas e nenhuma falsa.']])],
    [c1('Mapa atual', mt('P')), c2([['Risco:', 'obra, desmatamento ou enchente mudam o terreno.'], ['Controle:', 'o laudo de rota registra a data de cada mapa e dá falta dado quando ela passa do limite da fase.']])],
    [c1('Terreno distinto', mt('D', 'simulação')), c2([['Risco:', 'relevo plano ou repetitivo não distingue um lugar do outro.'], ['Controle:', 'a região guarda todas as posições possíveis e nunca escolhe a mais provável. Em relevo plano, o laudo de rota dá falta dado (Tabatinga, seção 11).']])],
    [c1('Altitude e modelo de elevação', mt('P')), c2([['Risco:', 'o modelo Copernicus erra menos de 4 m em 90% dos pontos, segundo a própria especificação, e é um modelo de superfície: sobre mata e prédios, mede o topo.'], ['Controle:', 'o erro do modelo e o do altímetro entram na conta como faixas; sobre mata alta, o limite precisa ser medido antes de valer.']])],
    [c1('Cada limite declarado está certo', mt('P')), c2([['Risco:', 'um limite errado deixa a região errada sem aviso, se nenhuma outra fonte o contradisser.'], ['Controle:', 'só a contradição entre fontes revela um limite errado; por isso a calibração em campo mede cada limite antes de ele valer.']])]] })
  + C.p('Quando duas evidências se contradizem, a região fica vazia, e o sistema sabe que alguma hipótese falhou. Retirar uma fonte de cada vez mostra qual. Numa simulação, uma falha de 80 m num satélite esvaziou a região, e o satélite foi apontado; em outra, uma comparação de câmera plantada 1,5 km fora do lugar deu um alarme, e a câmera foi apontada. Uma mentira pequena, dentro dos limites declarados, desloca a região sem esvaziá-la; por isso os limites são medidos, e não supostos.')
  + '<h3 class="at-h3">Autenticar a mensagem não é garantir a posição</h3>'
  + C.p('O Galileo, o sistema europeu de navegação por satélite, assina digitalmente parte das mensagens que transmite, num serviço chamado OSNMA, declarado em operação em 24 de julho de 2025. A caixa confere essa assinatura: nos vetores de teste oficiais, foram 193.887 conferências sem nenhuma falha. Isso mostra que a conferência funciona nesses vetores; não mostra que um receptor resista a falsificação ou a retransmissão. E a assinatura prova que os dados vieram do Galileo e não foram alterados; não prova que o sinal chegou direto do satélite ao drone. A própria agência europeia avisa que o serviço aumenta a capacidade de detectar uma falsificação, mas não a impede, nem protege contra bloqueio, e a autenticação do sinal em si fica para um serviço futuro. Um aparelho que grava o sinal verdadeiro e o retransmite com poucos segundos de atraso entrega dados genuínos, que passam na assinatura, e ainda assim desloca a posição. E o serviço exige que o receptor já saiba a hora certa, com erro de até 30 segundos, antes de conferir qualquer assinatura: um relógio acertado por um GNSS já falso desarma a regra.')
  + C.p('Por isso o protocolo trata os dois controles em separado. A autenticação diz se a mensagem é genuína. A integridade diz se a posição que resulta dela cabe na região calculada sem o GNSS, e se o relógio do receptor concorda com um relógio independente. Uma posição precisa passar nos dois.')
  + src('Fontes: a garantia sob limites declarados e a região vazia como prova de erro são resultados conhecidos da estimação por conjuntos (L. Jaulin, M. Kieffer, O. Didrit e É. Walter, <em>Applied Interval Analysis</em>, Springer, 2001; D. Meizel e outros, ' + a('https://webperso.ensta.fr/jaulin/paper_meizel_ieee.pdf', 'IEEE Trans. Robotics and Automation') + ' 18(6), 2002; B. Desrochers e outros, ' + a('https://webperso.ensta.fr/jaulin/paper_desrochers_iros15.pdf', 'IROS 2015') + '); Copernicus, ' + a('https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM', 'COP-DEM') + '; EUSPA, ' + a('https://www.euspa.europa.eu/newsroom-events/news/galileo-open-service-navigation-message-authentication-adds-another-layer', 'OSNMA') + ', 22/07/2025, e ' + a('https://www.gsc-europa.eu/sites/default/files/sites/all/files/Galileo_OSNMA_Receiver_Guidelines_v1.3.pdf', 'Receiver Guidelines 1.3') + ' (§ 2.1), e ' + a('https://www.euspa.europa.eu/galileo-osnma', 'a página do serviço') + '; os resultados de simulação, registros do LOCUS (voos de 6 graus de liberdade, GNSS e OSNMA).')
  + '<h3 class="at-h3">O que se exige do drone</h3>'
  + C.p('As regras não dependem do modelo. O que muda de um drone para outro é a ficha que alimenta o laudo de energia e a forma de ligar a caixa. O mínimo que o protocolo pede de qualquer equipamento:')
  + C.plainList([
    { b: 'Dados de voo e comandos de parar e pousar', raw: esc('por uma porta oficial do fabricante. Nos DJI, a porta entrega os dados e recebe esses comandos; nos autopilotos abertos, como PX4 e ArduPilot, a caixa também pode fornecer a posição para o drone seguir a rota.') + ' ' + mt('P') },
    { b: 'Ação de enlace perdido que não dependa do GNSS,', raw: esc('configurável no planejamento.') + ' ' + mt('P') },
    { b: 'Um sensor inercial de classe tática, um altímetro radar e uma câmera voltada para baixo', raw: esc('na caixa ou no drone, cada um com o limite de erro declarado na ficha de calibração.') + ' ' + mt('P') },
    { b: 'Relógio comum com a caixa, de preferência;', raw: esc('sem ele, o atraso entra como faixa e a região fica maior. Os Matrice 350 e 300 têm; os FlyCart 30 e 100 não.') + ' ' + mt('P') }]) }));

/* 9 · validation */
B.push(C.section({ lab: '9 · Critérios de validação', title: 'Como um resultado sobe de nível', bodyRaw:
  C.p('O protocolo é qualificado em quatro etapas, e cada etapa tem critério de aceitação escrito antes do teste. Um item só passa de proposto a demonstrado, e de demonstrado a validado em campo, quando cumpre o critério da etapa. Um equipamento novo, de qualquer fabricante, passa pelas mesmas quatro etapas com a própria ficha; é assim que a doutrina fica independente do fornecedor.')
  + C.table({ cols: [{ h: 'Etapa' }, { h: 'O que se testa, e o critério de aceitação' }], rows: [
    [c1('1. Simulação', mt('D', 'simulação')), c2([['Testa:', 'o protocolo inteiro, sobre o relevo real da área de emprego.'], ['Aceita se:', 'nenhuma saída liberada pousa abaixo da reserva, a posição real fica dentro da região em todas as verificações, e o custo da cautela é relatado junto.']])],
    [c1('2. Bancada', mt('P')), c2([['Testa:', 'a caixa ligada ao drone em solo, em laboratório ou na base; ataques gravados injetados; o lacre.'], ['Aceita se:', 'o alarme vem dentro do tempo declarado em todos os ataques injetados, e todo erro plantado no registro é detectado.']])],
    [c1('3. Calibração em campo', mt('P')), c2([['Testa:', 'voos curtos que medem o consumo com carga e o erro real de cada sensor.'], ['Aceita se:', 'cada erro medido cabe no limite declarado. Um único escape suspende aquele limite até ele ser recalibrado.']])],
    [c1('4. Exercício', mt('P')), c2([['Testa:', 'a missão com a equipe que opera, civil ou militar; o ataque reproduzido sem emitir, por injeção na caixa, ou em área autorizada pela Anatel.'], ['Aceita se:', 'cada estado acionado leva à ação combinada, e o verificador independente reconstrói o voo pelo registro.']])]] })
  + C.p('A primeira etapa já foi feita para a missão de referência. Uma semana sintética da frota: ' + SI.n + ' saídas da base de Blumenau, com o posto a uma distância de 2 a 11 km, carga de 5 a 30 kg e previsão de vento sorteadas. A Central decidiu cada saída antes do voo: liberou ' + pa.length + ', esperou dado em ' + fa.length + ' e recusou ' + na.length + '. Depois, um simulador voou cada uma com um drone e um vento sorteados, e em uma de cada vinte o vento real passou da previsão. O padrão é o do mapa de alcance da seção 3: perto e leve passa, longe e pesado não passa, e no meio o instrumento não chuta.')
  + C.p('Nenhuma das ' + pa.length + ' saídas liberadas pousou abaixo da reserva, ' + (paMiss === 1 ? 'nem a única' : 'nem as ' + paMiss) + ' em que o vento passou da previsão. Das ' + fa.length + ' que esperaram dado, ' + faOk + ' teriam chegado com reserva: é o preço de não chutar, e ele cai quando um voo de calibração mede o consumo real. Das ' + na.length + ' recusadas, ' + (naOk === 0 ? 'nenhuma teria chegado' : naOk + ' teriam chegado') + '. Dentro das premissas, uma saída liberada não falha por construção, porque é aritmética: o teste confere as contas e mede o custo da cautela, e o comportamento do drone, da bateria e do vento reais só se mede em campo.')
  + C.pRaw(esc('O custo da cautela é uma métrica central da pesquisa, não um efeito colateral. Uma tecnologia de segurança se mede pelas situações perigosas que evita e também pela indisponibilidade que causa: nesta semana sintética, ' + faOk + ' das ' + fa.length + ' saídas retidas por falta de dado teriam chegado. Cada etapa da qualificação relata as duas coisas, e os voos de calibração são avaliados pelo quanto reduzem esse custo sem liberar nenhuma saída que não chegaria.') + ' ' + mt('D', 'simulação'))
  + C.table({ cols: [{ h: 'Resultado' }, { h: 'O que mostra' }], rows: R.EVID.map((e) => [c1(e.k, mt(e.l, e.det)), c2([['', e.t]])]) }) }));

/* 10 · governance */
B.push(C.section({ lab: '10 · Governança', title: 'A missão termina quando pode ser conferida', bodyRaw:
  C.p('A missão não termina no pouso. Termina quando existe evidência suficiente para reconstruir e conferir cada decisão tomada, por quem não escreveu o sistema. Por isso cada registro passa por cinco etapas, e todas acontecem a bordo, sem depender do enlace.')
  + C.plainList([
    { b: 'Assina.', text: 'Cada leitura e cada foto são assinadas pela caixa no momento em que são feitas, com uma chave guardada em hardware.' },
    { b: 'Encadeia.', text: 'Cada registro carrega a impressão digital do anterior: apagar ou trocar um deles quebra a corrente, e uma lacuna fica visível.' },
    { b: 'Carimba.', text: 'O tempo do voo é carimbado por uma autoridade de carimbo da organização que opera (numa Força, a dela), e pela ICP-Brasil nos laudos que vão a terceiros.' },
    { b: 'Guarda a custódia.', text: 'Cada passagem do registro, do drone à base e da base ao perito, é anotada na ordem que o Código de Processo Penal exige.' },
    { b: 'Refaz.', text: 'Um verificador escrito à parte, por outra instituição (na pesquisa, um laboratório de universidade; numa avaliação militar, o IME ou o CTEx), refaz cada decisão a partir do registro. Se discordar da caixa, o caso é investigado.' }])
  + C.p('As peças já existem e foram testadas em bancada no Veto, o nosso instrumento de perícia de evidências. Montá-las na caixa do drone é trabalho da etapa de bancada.')
  + C.plainList([
    { b: 'Atualização.', raw: esc('Cada voo alimenta os laudos: onde o GNSS falhou, quanto a bateria gastou, quanto o vento real se afastou da previsão. Uma previsão ou um limite que erra mais do que declarou deixa de ser usado até ser recalibrado.') + ' ' + mt('P') },
    { b: 'Versões.', raw: esc('A minuta tem número de versão e histórico de mudanças (seção 13). Cada mudança traz o motivo escrito e o teste que a sustenta. Numa adoção militar, as mudanças seguiriam o sistema de doutrina do Exército, e o que os voos ensinam entraria pela sistemática de lições aprendidas do COTER.') + ' ' + mt('P') },
    { b: 'Certificação.', raw: esc('Quem qualifica um equipamento não deve ser quem o desenvolveu. A proposta é que a qualificação da seção 9 e o verificador fiquem com uma instituição que não desenvolveu o equipamento: na pesquisa, uma universidade ou uma equipe separada do instituto; numa avaliação militar, uma instituição da Força.') + ' ' + mt('P') }]) }));

/* 11 · limits */
B.push(C.section({ lab: '11 · Limites', title: 'O que ainda não está demonstrado', bodyRaw:
  C.plainList([
    { b: 'Ainda não voou.', text: 'Tudo nesta minuta é simulação ou teste de bancada. O primeiro voo real é a etapa de calibração.' },
    { b: 'Os casos favoráveis vêm primeiro.', text: 'No Vale do Itajaí e nos morros da ilha, o relevo ajuda em todo o caminho; sobre a água, não ajuda, e a ilha já mostra isso. Numa rota de ' + n(AMZ_KM) + ' km a partir de Tabatinga, na fronteira amazônica, o relevo plano não ajuda em nenhum ponto; sem GNSS, o drone chegaria com até ' + n(MJ.amazonia.laudo.err_max_m / 1000, 1) + ' km de dúvida, e o laudo de rota diz falta dado. O laudo nomeia o que decidiria: o mapa magnético do Serviço Geológico do Brasil, imagens do INPE ou um voo de reconhecimento. Os resultados de Blumenau e da ilha não são uma capacidade geral: ainda não há evidência de que o protocolo funcione igual em outros terrenos.' },
    { b: 'A ilha está sob espaço aéreo controlado.', text: 'O aeroporto Hercílio Luz controla o espaço aéreo da ilha. Lá, os testes são só sintéticos; voo real, só em campo autorizado.' },
    { b: 'Num DJI, hoje, a caixa avisa e manda parar ou pousar.', text: 'Seguir a rota com a posição da caixa depende de um modo que a DJI documentou e ainda não liberou, ou de um autopiloto aberto.' },
    { b: 'As contas de energia começam como premissas.', text: 'Até os voos de calibração, muitas missões vão dar falta dado. É o comportamento certo, e tem um custo: missões retidas que teriam chegado. A pesquisa mede os dois lados.' },
    { b: 'A caixa embarcada ainda é uma hipótese de engenharia.', text: 'Ela ainda não existe. Precisa mostrar que recebe os dados do drone, mantém a sincronização, calcula a região, registra os eventos e cabe nos limites de energia, peso e processamento da plataforma. É um problema de engenharia embarcada, não só de matemática ou de programa, e é o maior salto entre a maturidade de hoje e uma demonstração experimental.' },
    { b: 'As garantias valem dentro de modelos.', text: 'A região de proteção vale se os limites declarados valerem; o risco de integridade, se o ruído seguir o modelo gaussiano declarado; a concordância entre fontes, se os erros delas forem independentes. Nenhuma dessas hipóteses foi medida em sensores reais.' },
    { b: 'A minuta não está completa.', text: 'Faltam a cadeia de autorização da organização que opera, o programa de adestramento, a aprovação dos estados e dos limites por fase, e a revisão técnica e, depois, a militar.' },
    { b: 'Silencioso por padrão, não guia armas, não rastreia pessoas.', text: R.MARCA.sinais + ' Não faz guerra eletrônica de ataque e não decodifica comunicações. A descida de precisão só existe sobre o marcador de quem recebe, e quem está em terra recebe alertas por área, sem identificação.' }])
  + C.table({ cols: [{ h: 'Aspecto' }, { h: 'Estado nesta versão' }], rows: [
    ['Arquitetura do protocolo', 'proposta, para revisão'],
    ['Tratamento da incerteza', 'demonstrado em simulação'],
    ['Verificação independente', 'proposta; um programa de pesquisa aplicada com um instituto de engenharia em preparação'],
    ['Maturidade experimental', 'inicial: simulação e bancada'],
    ['Completude doutrinária', 'minuta: faltam autorização, adestramento e aprovação'],
    ['Prontidão operacional', 'não demonstrada']] })
  + C.p('Em resumo: o Atalaia já pode ser avaliado como proposta metodológica; ainda precisa mostrar que pode ser implementado como sistema e validado como capacidade.') }));

/* 12 · next step */
B.push(C.section({ lab: '12 · Próximo passo', title: 'Pesquisa aplicada primeiro, avaliação militar depois', bodyRaw:
  C.p('O próximo passo é um programa de pesquisa aplicada com um instituto de engenharia, antes de qualquer avaliação militar: engenharia embarcada, experimento controlado e validação independente, com critérios escritos antes de cada teste e os resultados ruins relatados junto com os bons. O programa tem cinco pacotes de trabalho.')
  + C.plainList([
    { b: 'Ameaças e falhas.', raw: esc('Bloqueio, falsificação, retransmissão, multicaminho em vale, perda de enlace, falhas de sensor e erro de causa comum, cada um com um modelo e um conjunto de falhas gravadas para injetar.') + ' ' + mt('P') },
    { b: 'Arquitetura de integridade.', raw: esc('A região de proteção, o teste do GNSS contra a região, a conferência do Galileo em separado e os estados da missão, integrados numa caixa de bancada.') + ' ' + mt('P') },
    { b: 'Ambiente experimental.', raw: esc('Simulação reproduzível e bancada com sinais gravados, na ilha e no Vale, e voos de calibração em campo autorizado, percorrendo a matriz de ambientes abaixo.') + ' ' + mt('P') },
    { b: 'Validação independente.', raw: esc('Contenção da posição real pela região, tempo até o alarme, falsos alarmes por hora de voo, disponibilidade, custo da cautela e erro da melhor estimativa, medidos contra critérios escritos antes, por quem não desenvolveu o sistema.') + ' ' + mt('P') },
    { b: 'Revisão da doutrina.', raw: esc('O que os resultados sustentarem sobe de nível nesta minuta; o que não sustentarem é rebaixado.') + ' ' + mt('P') }])
  + '<h3 class="at-h3">Uma matriz de ambientes</h3>'
  + C.p('A navegação pelo relevo e pela imagem depende do terreno, e os casos de hoje são, em boa parte, favoráveis. O objetivo da matriz é descobrir em que ambientes a arquitetura mantém utilidade, não demonstrar que ela funciona em todo lugar. Onde ela não ajudar, o resultado esperado é o laudo dizer falta dado ou não passa, e nomear o que decidiria.')
  + C.table({ cols: [{ h: 'Ambiente' }, { h: 'Onde, e o que se sabe hoje' }], rows: [
    [c1('Relevo montanhoso', mt('D', 'simulação')), c2([['Onde:', 'o Médio Vale do Itajaí e os morros do norte da ilha.'], ['Hoje:', 'o relevo devolve a posição em todo o caminho das missões simuladas. É o caso favorável.']])],
    [c1('Relevo plano', mt('D', 'simulação')), c2([['Onde:', 'uma rota de ' + n(AMZ_KM) + ' km a partir de Tabatinga, na fronteira amazônica.'], ['Hoje:', 'o relevo não ajuda em nenhum ponto; sem GNSS, o drone chegaria com até ' + n(MJ.amazonia.laudo.err_max_m / 1000, 1) + ' km de dúvida, e o laudo de rota diz falta dado.']])],
    [c1('Área costeira', mt('D', 'simulação')), c2([['Onde:', 'o norte da ilha: morros, praias, dunas e a lagoa em poucos quilômetros.'], ['Hoje:', 'nas missões simuladas, o relevo devolve a posição, e quem decide é a energia.']])],
    [c1('Ambiente marítimo', mt('D', 'simulação')), c2([['Onde:', 'um barco a 4 km da praia.'], ['Hoje:', 'nem o relevo nem a imagem devolvem a posição no fim da perna, e a rota não passa sem o GNSS íntegro.']])],
    [c1('Ambiente urbano', mt('P')), c2([['Onde:', 'nenhuma missão simulada ainda.'], ['Hoje:', 'prédios refletem o sinal de satélite, e o modelo de elevação mede o topo deles. Não testado.']])],
    [c1('Vegetação densa', mt('P')), c2([['Onde:', 'nenhuma missão simulada ainda.'], ['Hoje:', 'o modelo de elevação mede o topo da mata, e o limite do altímetro sobre mata alta precisa ser medido antes de valer. Não testado.']])]] })
  + C.p('A sequência pretendida tem três momentos. Primeiro, a pesquisa aplicada com um instituto de engenharia, para obter validação externa, engenharia experimental e evidência reproduzível; ali o interlocutor é técnico. Depois, uma demonstração a uma organização usuária, com resultados, limitações e custos, pedindo uma avaliação de interesse, não a adoção. Só então, se houver interesse, o encaminhamento a um escalão técnico, para discutir experimentação doutrinária e requisitos específicos. Um resultado favorável não precisa ser a adoção: um parecer técnico independente e uma experimentação autorizada já seriam resultados.')
  + C.p('O Exército entra depois, como avaliador, com os resultados documentados e requisitos operacionais específicos. Até lá, a minuta serve de referência para quem opera drones e quer discutir os requisitos.')
  + C.pRaw(esc('Para interlocutores militares, um resumo do que se propõe ao Exército, do que já foi demonstrado e do que ainda não foi está em ') + '<a href="/atalaia/eb/">/atalaia/eb/</a>.')
  + C.p('Quando chegar a hora da avaliação militar, a proposta tem caminho conhecido no Exército. A doutrina é produzida pelo Sistema de Doutrina Militar Terrestre, o SIDOMT, e o COTER, por intermédio do Centro de Doutrina do Exército, prepara a diretriz de cada produto doutrinário, de um manual de campanha a um caderno de instrução. Antes de virar manual, uma ideia passa pela sistemática de experimentação doutrinária. E a Doutrina Militar Terrestre mede uma capacidade por sete fatores inseparáveis, o DOAMEPI. A tabela diz o que cada fator pediria do Atalaia; nenhum deles é atendido só com equipamento.')
  + C.table({ cols: [{ h: 'Fator' }, { h: 'O que o protocolo pediria' }], rows: [
    [c1('Doutrina', mt('P')), c2([['', 'Esta minuta, revista e transformada no produto que o COTER indicar: princípios, estados da missão, critérios de validação.']])],
    [c1('Organização', mt('P')), c2([['', 'As camadas da seção 5 e as quatro perguntas como processo de autorização, com quem assina cada uma.']])],
    [c1('Adestramento', mt('P')), c2([['', 'Ataques gravados injetados com o drone em solo, exercícios por estado da missão e qualificação de pilotos e operadores da Central.']])],
    [c1('Material', mt('P')), c2([['', 'A caixa a bordo e a Central, com qualquer drone que passe na qualificação da seção 9; os instrumentos foram testados em simulação e bancada, a caixa ainda não existe.']])],
    [c1('Educação', mt('P')), c2([['', 'O que um piloto e um oficial de operações precisam entender: a posição como região, o falta dado, a diferença entre autenticar a mensagem e confiar na posição.']])],
    [c1('Pessoal', mt('P')), c2([['', 'O piloto remoto, o operador da Central, o responsável pela calibração e, fora da unidade, quem verifica.']])],
    [c1('Infraestrutura', mt('P')), c2([['', 'Mapas com data, zonas de pouso de contingência levantadas, o carimbo de tempo da Força, carregadores e geração na base.']])]] })
  + src('Fontes: Exército Brasileiro, EB20-MF-10.102, ' + a('https://bdex.eb.mil.br/jspui/bitstream/123456789/11768/1/EB20MF10102.pdf', '<em>Doutrina Militar Terrestre</em>') + ', 3ª ed., 2022 (§ 3.3.4, DOAMEPI); COTER, ' + a('https://bdex.eb.mil.br/jspui/bitstream/123456789/14389/1/PDDMT2025.pdf', 'Plano de Desenvolvimento da Doutrina Militar Terrestre 2025') + ' (§ 4 e § 5); Instruções Reguladoras da Sistemática de Experimentação Doutrinária (EB70-IR-10.002), 2018.')
  + C.p('As perguntas que a pesquisa responde:')
  + C.plainList([
    { b: 'Os limites de erro declarados se mantêm em sensores reais,', text: 'na bancada e em voo: o inercial, o altímetro, a câmera e o relógio?' },
    { b: 'A região de proteção contém a posição real em todas as épocas,', text: 'e qual o tamanho dela na prática?' },
    { b: 'Em que ambientes a arquitetura mantém utilidade,', text: 'na matriz acima, e onde ela só consegue dizer falta dado?' },
    { b: 'Os sensores erram de modo independente,', text: 'e o risco de integridade medido fica abaixo do que o modelo gaussiano prevê?' },
    { b: 'Quanto custa a cautela:', text: 'quantas missões retidas teriam chegado, e quanto os voos de calibração reduzem esse número?' },
    { b: 'Como medir o risco no solo', text: 'de pousar onde está, trecho por trecho da rota?' },
    { b: 'Em quanto tempo e com quantos falsos alarmes', text: 'a falsificação, a retransmissão e o bloqueio são detectados?' },
    { b: 'A arquitetura cabe num módulo embarcado', text: 'ligado a drones de fabricantes diferentes?' },
    { b: 'Que mudanças nesta minuta', text: 'os resultados exigem?' }]) }));

/* 13 · versions (v0.4, D30; v0.4.1, D31) */
B.push(C.section({ lab: '13 · Versões', title: 'Histórico desta minuta', bodyRaw:
  C.plainList([
    { b: 'v0.5, 16/11/2026.', text: 'A marca da família na entrada da página e o princípio 10 reescrito: o Atalaia recebe sinais e fica em silêncio por padrão; um módulo ativo opcional, proposto, liga só dentro de um envelope aprovado antes da missão, com equipamento homologado de baixa potência, e cada acionamento fica no registro. Em nenhum modo bloqueia, falsifica ou interfere em sinais de terceiros, nem transmite nas faixas do GNSS; não guia armas, não designa alvos e não rastreia pessoas. As mesmas palavras estão na seção de limites e no resumo para interlocutores militares.' },
    { b: 'v0.4.1, 16/11/2026.', text: 'Revisão de terminologia e de consistência, sem mudar a proposta: a região garantida passa a se chamar região de proteção, definida logo na seção 8 nos seus dois níveis, o determinístico, sob limites declarados, e o probabilístico, sob o modelo de ruído declarado; o resultado com as estações do IBGE diz que foram dados gravados em estações fixas, com desvios sintéticos, e o que o teste precisou saber; a matriz de ambientes na seção 12; a caixa embarcada como hipótese de engenharia na seção 11; um resumo para interlocutores militares, com a comparação com a simulação da ESAO de 2025, em /atalaia/eb/.' },
    { b: 'v0.4, 16/11/2026.', text: 'Depois de uma revisão externa da v0.3: vocabulário GNSS; quatro afirmações quantitativas reescritas com o modelo e os limites (o risco de integridade, as 24.300 verificações, a conferência do Galileo nos vetores de teste, a energia sem temperatura nem envelhecimento); a independência entre sensores como hipótese a medir; o custo da cautela como métrica; o risco no solo de pousar onde está; papéis de pesquisa antes dos militares; os três momentos; o caso da zona de controle do aeroporto; esta seção.' },
    { b: 'v0.3, 16/11/2026.', text: 'Base técnica de um programa de pesquisa aplicada, uso civil primeiro: a ilha de Florianópolis como área principal de testes sintéticos, o Médio Vale do Itajaí como referência operacional; a minuta passa a viver em /atalaia/doutrina/, e /atalaia/ vira a página de entrada.' },
    { b: 'v0.2, 15/11/2026.', text: 'Minuta doutrinária: princípios, responsabilidades, procedimentos, requisitos, critérios de validação e governança separados; cada afirmação com o seu nível de maturidade.' },
    { b: 'v0.1, 15/11/2026.', text: 'Primeira página: um protocolo proposto para drones militares, com uma missão simulada em Blumenau.' }]) }));

/* the stat strip, from the tally (the levels were counted as the sections were written) */
B[STATS_AT] = C.stats([
  { k: 'Demonstrado', v: String(TALLY.D), n: 'afirmações marcadas, em simulação ou bancada' },
  { k: 'Validado em campo', v: String(TALLY.V), n: 'nenhum voo real ainda' },
  { k: 'Proposto', v: String(TALLY.P), n: 'à espera de teste ou de decisão de quem opera' },
  { k: 'Áreas de teste', v: '2', n: 'a ilha de Florianópolis e o Médio Vale do Itajaí (SC)' }]);
if (TALLY.V !== 0) die('a claim is marked field-validated, and nothing has flown');

const foot = '<p>' + esc('Minuta v' + VERSAO.n + ', ' + VERSAO.data + '. Preparada por Carlos Toledo, com ajuda de IA (Claude) na pesquisa e na redação. Documento de trabalho para revisão: não é doutrina aprovada, proposta comercial nem documento oficial de nenhum órgão. Os números das missões vêm de apps/atalaia/data (relevo Copernicus GLO-90 e GLO-30, ficha da DJI; cada registro fixado por sha256 em PROVENANCE.json); os resultados de teste, dos registros do LOCUS e do Veto, cada um com o seu nível de maturidade.') + '</p>';

const css = R.CSS_BASE + `
.at-nw{display:none}
@media (max-width:640px){.at-w{display:none}.at-nw{display:block}}
.at-rules ol{margin:0;padding-left:1.6em;display:flex;flex-direction:column;gap:var(--s-4)}
.at-rules li::marker{font-family:var(--f-mono);color:var(--ink-4)}
.at-rules li p{margin:0}
.at-svg{display:block;width:100%;height:auto}
.at-svg text{font-family:var(--f-sans)}
.at-ground{fill:var(--sunk)}
.at-route{stroke:var(--ink);stroke-width:5;stroke-linecap:round}
.at-halo{stroke:var(--paper);stroke-width:11;stroke-linecap:round}
.at-beyond{stroke:var(--ink-4);stroke-width:2.5;stroke-dasharray:2 3}
.at-leg-open{stroke:var(--ink);stroke-width:3;stroke-dasharray:5 4}
.at-ring-pass{fill:var(--band-fill);stroke:var(--ink-2);stroke-width:1.5}
.at-ring-open{fill:none;stroke:var(--ink-3);stroke-width:1.5;stroke-dasharray:5 4}
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
.at-node{fill:var(--paper);stroke:var(--ink-3);stroke-width:1.5}
.at-node.s1{stroke:var(--ink-2);stroke-width:2.5}
.at-node.s2{stroke:var(--ink);stroke-width:4}
.at-node.s5{fill:none;stroke:var(--ink);stroke-width:2.5}
.at-edge{stroke:var(--ink-3);stroke-width:1.5}
.at-arrow{fill:var(--ink-3)}
.at-band{stroke:var(--ink-2);stroke-width:1.5}
.at-band.go{fill:var(--ink-2)}
.at-band.na{fill:var(--band-fill);stroke-dasharray:5 4}
.at-band.no{fill:none}
.at-grid{stroke:var(--rule);stroke-width:1}
.at-dot.go{fill:var(--held)}
.at-dot.na{fill:none;stroke:var(--warn);stroke-width:1.8}
.at-dot.no{fill:none;stroke:var(--ink-3);stroke-width:2}
.at-ring{fill:none;stroke:var(--ink);stroke-width:2}
.at-rp{display:flex;flex-direction:column;gap:var(--s-3)}
.at-rpmap{position:relative;border:1px solid var(--rule);border-radius:var(--radius-s);overflow:hidden;background:var(--sunk);aspect-ratio:2/1;max-width:100%}
.at-rpmap svg{position:absolute;inset:0;width:100%;height:100%}
.at-now{position:absolute;left:10px;top:10px;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-slight);text-transform:uppercase;color:var(--ink);background:var(--paper);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:3px var(--s-2);max-width:calc(100% - 20px)}
.at-area{fill:none;stroke:var(--ink);stroke-width:1.2;stroke-dasharray:1.5 2}
.at-area.falso{stroke:var(--witness)}
.at-dr{fill:var(--ink);stroke:var(--paper);stroke-width:2}
.at-strip{position:relative;height:84px;border-bottom:1px solid var(--rule)}
.at-strip svg{position:absolute;inset:0;width:100%;height:100%}
.at-sl{position:absolute;left:0;transform:translateY(-50%);font-family:var(--f-mono);font-size:.625rem;color:var(--ink-4);background:var(--paper);padding-right:var(--s-1)}
.at-slr{left:auto;right:0;padding:0 0 0 var(--s-1)}
.at-fill{fill:var(--band-fill)}
.at-best{fill:none;stroke:var(--ink-3);stroke-width:1.5}
.at-worst{fill:none;stroke:var(--ink);stroke-width:2.5}
.at-resl{stroke:var(--ink);stroke-width:1.5;stroke-dasharray:5 4}
.at-midl{stroke:var(--rule-strong);stroke-width:1;stroke-dasharray:2 3}
.at-cur{stroke:var(--ink);stroke-width:1.5}
.at-bar{display:flex;align-items:center;gap:var(--s-4)}
.at-bar button{font:600 var(--text-small) var(--f-sans);color:var(--paper);background:var(--ink);border:0;border-radius:var(--radius-pill);padding:9px 18px;cursor:pointer}
.at-bar button[disabled]{opacity:.5;cursor:default}
.at-bar button:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.at-clock{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-3)}
`;

let html = TPL.render({ title: 'Atalaia: operar drones quando a navegação por satélite deixa de ser confiável', bodyRaw: B.join('\n\n'), footRaw: foot, lang: 'pt-BR',
  cssRaw: css, scriptRaw: vooScript(),
  desc: 'Atalaia v' + VERSAO.n + ': minuta de protocolo de missão e base técnica de um programa de pesquisa aplicada para drones com o GNSS degradado ou negado, civil primeiro e militar depois; princípios, estados da missão, requisitos, critérios de validação e governança, com testes sintéticos em Santa Catarina.',
  path: '/atalaia/doutrina/' });
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.copyFileSync(path.join(DATA, 'relevo.webp'), path.join(OUT, 'relevo.webp'));
fs.copyFileSync(path.join(DATA, 'relevo-ilha.webp'), path.join(OUT, 'relevo-ilha.webp'));
console.log('site/atalaia/doutrina/index.html written (unlisted, minuta v' + VERSAO.n + '): posto ' + AV.post_km + ' km, ' + KG + ' kg ' + R12.verdict + '; 30 kg ' + R30.verdict + '; serra ' + RS.verdict
  + '; synthetic ' + pa.length + '/' + fa.length + '/' + na.length + '; maturity D ' + TALLY.D + ' · V ' + TALLY.V + ' · P ' + TALLY.P);

require('./landing.js');                          /* the landing page, from the same records (v0.4) */
require('./eb.js');                               /* the page for military interlocutors, /atalaia/eb/ (v0.4.1, D31) */
require('./central.js');                          /* the Central behind a simple password, /atalaia/central/ (D34) */
require('./nucleo.js');                           /* the technical-details page, /atalaia/nucleo/ (D36) */
