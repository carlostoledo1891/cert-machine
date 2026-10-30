/* map-client.js — the return-level atlas as a flat map, in the tab.
   playground/return-level-atlas/ · cert-machine · 2026-10-29

   ONE QUESTION AT A TIME: the design wave, for one return period and one block. The map is the paper's hindcast cut
   into cells on an EQUAL-AREA projection (Equal Earth: Šavrič, Patterson & Jenny 2018), drawn here on a canvas from
   the globe's own data (../atlas.json, ../land.json) by the globe's own rules (shared.js); a cell is filled with the
   order greys where its level is decided, hatched where it is refused, dotted where sea ice touches it. A tap opens
   the cell's card: product words first, the rigour one click down, every number from the ledger (cells.json carries
   the six families' levels, rounded outward to the centimetre by the builder with shared.js cmOut).

   No colour is written here: every paint is read from the page's tokens. No request but the page's own data. The
   grammar's marks come from playground/warrant.js and design/grammar.js, shipped beside this file (mods.js).    MIT */
(function () {
  'use strict';
  const CFG = window.RLA_MAP, MODS = window.RLA_MAP_MODS;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---- the modules, by name, as text (Swell's way): the grammar and the shared rules ---- */
  const cache = {};
  function req(name) {
    const base = String(name).split('/').pop();
    if (cache[base]) return cache[base].exports;
    if (!MODS || !Object.prototype.hasOwnProperty.call(MODS.src, base)) throw new Error('map: no module ' + name);
    const m = { exports: {} }; cache[base] = m;
    (new Function('module', 'exports', 'require', MODS.src[base]))(m, m.exports, req);
    return m.exports;
  }
  const W = req('warrant.js'), G = req('grammar.js'), SH = req('shared.js');
  const tok = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  /* the colours, read from the tokens and read AGAIN when the pill flips the theme (the "warrant-theme" event, below).
     The land on paper is the page itself: its screen value (--surface2) is the order ramp's first step in the light
     theme, and a land the colour of the lowest class would read as a class. */
  const C = {};
  function colours() {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    Object.assign(C, { paper: tok('--paper'), sunk: tok('--sunk'), surface2: tok('--surface2'), ink: tok('--ink'), ink2: tok('--ink-2'), ink4: tok('--ink-4'), ink5: tok('--ink-5'),
      rule: tok('--rule'), ruleStrong: tok('--rule-strong'), ruleSoft: tok('--rule-soft'), s: [1, 2, 3, 4, 5].map((k) => tok('--c-s' + k)),
      land: tok(light ? '--paper' : '--surface2') });
  }
  colours();
  const FAM = CFG.fam, BLK = CFG.blocks, PER = CFG.periods, CRIT = ['ad', 'ks', 'mse', 'chi2'];

  /* ---- the words (English only since 2026-10-30: the operator's "no more pt-BR pages") ---- */
  const STR = {
    en: {
      T: '{T} years', blk: { daily: 'daily', weekly: 'weekly', monthly: 'monthly' }, blkL: { daily: 'daily maxima', weekly: 'weekly maxima', monthly: 'monthly maxima' },
      fam: { normal: 'normal', lognormal: 'lognormal', weibull: 'Weibull', expweibull: 'exponentiated Weibull', gengamma: 'generalized gamma', gumbel: 'Gumbel' },
      famS: { normal: 'Normal', lognormal: 'Lognormal', weibull: 'Weibull', expweibull: 'Exp. Weibull', gengamma: 'Gen. gamma', gumbel: 'Gumbel' },
      the: (f) => 'the ' + STR.en.fam[f], of: (f) => 'of the ' + STR.en.fam[f], and: ' and ',
      num: { 3: 'three', 4: 'four', 5: 'five', 6: 'six' },
      keyT: 'design wave · {T} years · {blk}', refK: 'refused', iceK: 'sea ice', keyN: 'decided at {d} of {n} open-sea cells; refused at {r}; {i} touched by sea ice, shown and not certified',
      margin: 'Brazilian margin', others: 'Other nodes of the report', placesN: 'The nodes of the return-level report. Tap any cell of the map to open its card.',
      go: 'go to', goPh: 'lat, lon (e.g. -22.5, -40)', goBad: 'type a latitude and a longitude, separated by a comma or a space',
      back: 'Places', onGlobe: 'On the globe', link: 'Link', copied: 'link copied',
      lat1: 'Brazilian-margin lattice', lat4: 'global lattice', rep: 'report node',
      heroL: 'design wave · {T} years', recL: 'largest day, {a}–{b}', iceL: 'sea ice',
      famLine: 'Decided by the <b>{fam}</b>, the family Anderson–Darling chooses among {six} on the {n} {blkL}. An exact interval, rounded outward to the centimetre.',
      statLine: 'Another {y} years of the same sea could put it anywhere in {v} ({lvl}%, the delta method: statistical, computed, not decided).', statNone: 'No statistical interval could be formed here.',
      refH: 'refused', whyB: 'the fit {of} is not certified, and its maximum might exist and win: the choice is refused.',
      whyT: 'a tie: the A² enclosures {of} overlap, and the data do not separate those families.', whyU: 'A² could not be enclosed for {of}.', whyN: 'no family has an enclosed A².',
      whyL: 'Anderson–Darling decides {the}, but its {T}-year level does not close into an exact interval.',
      iceTxt: 'The hindcast\'s own sea ice reaches this node on {steps} three-hourly steps, in {months} months, at up to {max}% cover. Under ice the model damps the waves to millimetres rather than leaving a gap, so the series is partly the ice\'s: the cell is shown, not certified.',
      sixH: '{Six} families, {six} answers', spread: 'Among the {k} families certified here, the design wave runs from {lo} ({flo}) to {hi} ({fhi}).', spreadWhy: ' It is the choice of family, not the arithmetic, that moves the number.',
      spread1: 'Only one family has a certified level here.', noLv: 'no level', guide: 'In bold, the decided family; dashed, its statistical width; the vertical guide line, the largest day on record ({m}).', dec: 'decided', refW: 'refused',
      fr: { e: 'peaks at its lognormal limit, proved: it counts as the lognormal', k: 'the climb runs toward k → 0, the Fréchet corner: nothing proved', s: 'the climb ran past the edge of its coordinates and was not certified in its Gumbel ones: nothing proved', b: 'the climb stopped at the family\'s edge: nothing proved', r: 'not certified', n: 'certified; its level does not close into an exact interval' },
      survH: 'Does it hold?', survC: 'Under the {four} criteria, {blkL}:', survB: 'Over the {three} blocks, by Anderson–Darling:', survS: '{The} holds under {a} of {na} criteria and over {b} of {nb} blocks.',
      survR: 'With no family decided here there is nothing to hold: each criterion and each block, as the record decides them.',
      trust: 'Why you can trust this number', encH: 'The arithmetic', encTxt: 'The {T}-year level {of} lies, proved, in [{lo}, {hi}] m, over the {n} {blkL}: the ends as the record prints them, outward, to eight figures. The card shows it rounded outward to the centimetre.',
      restsH: 'What this rests on', certH: 'The certificate', certTxt: 'On the globe this cell opens with the choice by criterion in each block, every fit, and a button that certifies it again in your browser, with the record\'s own code, from the data pinned by sha256.', certBtn: 'Open the certificate on the globe',
      iid: 'the {n} {blkL} are taken as independent and from one law, and {y} years of one climate stand for {T}.', storms: ' Daily maxima come in storms: above {u} (the series\' 95th percentile) the runs estimator puts the extremal index at {th} here (statistical), storms of {d} days on average.',
      choiceD: 'Anderson–Darling chooses {the} among {six} on the same {n} maxima they were fitted to; no held-out sample decides between families.', choiceR: 'Anderson–Darling does not choose here: {why}',
      buoy: ' One of those nodes is this cell: the {b} buoy ({p} pairs, {f}–{t}), bias {bias} and RMS {rms}.',
      tipR: 'refused', tipI: 'sea ice: shown, not certified', fail: 'The atlas data could not be read here ({e}). Open the page from the site, not as a file.', world: 'World', brazil: 'Brazilian margin',
    },
  };
  const S = () => STR.en;
  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] !== undefined && v[k] !== null ? v[k] : m));
  const dcm = (cmv) => (cmv / 100).toFixed(2);                                                   /* centimetres, as metres */
  const rng = (q) => dcm(q[0]) + '–' + dcm(q[1]) + ' m';
  const intf = (n) => Number(n).toLocaleString('en-US');
  const dec = (x, d) => Number(x).toFixed(d);
  const exact = (x) => String(x);                                                                 /* a number as the record holds it */
  const wnum = (n) => S().num[n] || intf(n);
  const per = (T) => String(T);                                                                /* a return period, as the ledger names it */
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  /* a value with its standing, its tooltip the legend's words */
  const LG = {}; W.LEGEND.forEach((L) => { LG[L.s] = L; });
  const val = (text, s) => W.value(text, s, { title: LG[s].label + ' — ' + LG[s].gloss });
  const place = (c) => { const la = Math.abs(c.lat), lo = Math.abs(c.lon); return exact(la) + '° ' + (c.lat < 0 ? 'S' : 'N') + ' · ' + exact(lo) + '° ' + (c.lon < 0 ? 'W' : 'E'); };

  /* ---- state: the question, the chosen cell, the view; the address carries all of it ---- */
  const ST = { block: BLK[0], T: PER[0], sel: null, tab: 'places', trust: false };
  let A = null, FD = null, cells = [], byId = new Map(), PLACES = CFG.places.slice();
  function readHash() {
    const q = new URLSearchParams(location.hash.slice(1));
    if (BLK.includes(q.get('b'))) ST.block = q.get('b');
    if (PER.map(String).includes(q.get('T'))) ST.T = Number(q.get('T'));
    const at = (q.get('at') || '').split(',').map(Number);
    return { cell: q.get('c'), at: at.length === 3 && at.every(isFinite) ? at : null };
  }
  let hashT = null;
  function writeHash() {
    clearTimeout(hashT);
    hashT = setTimeout(() => {
      const q = new URLSearchParams();
      q.set('b', ST.block); q.set('T', ST.T);
      if (ST.sel) q.set('c', ST.sel.id);
      if (V.S) { const c = viewCenter(); q.set('at', [c[0].toFixed(4), c[1].toFixed(4), (V.S / V.S0).toFixed(3)].join(',')); }
      history.replaceState(null, '', location.pathname + location.search + '#' + q.toString());
      /* the globe opens on the same question and the same cell */
      const g = $('#rm-to-globe'); if (g) g.setAttribute('href', globeHref(ST.sel));
    }, 200);
  }
  /* the globe's own address: its view, the question, and the cell with its camera over it (app.js readHash) */
  const globeHref = (c) => '../#' + new URLSearchParams(Object.assign({ v: 'wave', b: ST.block, T: String(ST.T) }, c ? { c: c.id, t: 'cell', at: [c.lat, c.lon, SH.sizeOf(c) >= 4 ? 2.5 : 4].join(',') } : {})).toString();

  /* ================================================================ EQUAL EARTH
     Šavrič, Patterson & Jenny (2018): x = λ cos θ / (M (A1 + 3A2θ² + θ⁶(7A3 + 9A4θ²))), y = θ (A1 + A2θ² + θ⁶(A3 + A4θ²)),
     sin θ = M sin φ, M = √3/2. Equal-area: a cell's drawn area is in proportion to its area on the sphere. */
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, MM = Math.sqrt(3) / 2, RAD = Math.PI / 180;
  function proj(lon, lat) {
    const th = Math.asin(MM * Math.sin(lat * RAD)), t2 = th * th, t6 = t2 * t2 * t2;
    return [lon * RAD * Math.cos(th) / (MM * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))), -th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
  }
  const XM = proj(180, 0)[0], YM = -proj(0, 90)[1];                                   /* the world's half extents */
  /* a lon/lat ring, its edges cut into steps so meridians bend as the projection bends them */
  function ringOf(pts, k) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < k; j++) { const a = pts[i], b = pts[i + 1], s = j / k; out.push(proj(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s)); }
    return out;
  }
  const addRing = (P, r) => { P.moveTo(r[0][0], r[0][1]); for (let i = 1; i < r.length; i++) P.lineTo(r[i][0], r[i][1]); P.closePath(); };
  let GEO = null;
  function geometry(land) {
    const outline = new Path2D(), o = [];
    for (let la = -90; la <= 90; la += 2) o.push(proj(180, la));
    for (let la = 90; la >= -90; la -= 2) o.push(proj(-180, la));
    addRing(outline, o);
    const grat = new Path2D();
    for (let lon = -150; lon <= 150; lon += 30) { const r = []; for (let la = -90; la <= 90; la += 2) r.push(proj(lon, la)); grat.moveTo(r[0][0], r[0][1]); r.forEach((p) => grat.lineTo(p[0], p[1])); }
    for (let la = -60; la <= 60; la += 30) { const r = []; for (let lo = -180; lo <= 180; lo += 2) r.push(proj(lo, la)); grat.moveTo(r[0][0], r[0][1]); r.forEach((p) => grat.lineTo(p[0], p[1])); }
    const L = new Path2D();
    for (const f of land.features) for (const poly of (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates)) for (const ring of poly) {
      if (ring.length < 3) continue;
      L.moveTo.apply(L, proj(ring[0][0], ring[0][1]));
      for (let i = 1; i < ring.length; i++) { const p = proj(ring[i][0], ring[i][1]); L.lineTo(p[0], p[1]); }
      L.closePath();
    }
    /* each cell's drawn square (shared.js), and a copy across the antimeridian where it reaches past ±180 */
    for (const c of cells) {
      const sq = SH.square(c)[0], h = SH.sizeOf(c) * 0.46, rings = [ringOf(sq, 4)];
      if (c.lon + h > 180) rings.push(ringOf(sq.map((p) => [p[0] - 360, p[1]]), 4));
      if (c.lon - h < -180) rings.push(ringOf(sq.map((p) => [p[0] + 360, p[1]]), 4));
      c.rings = rings;
      c.bb = rings.reduce((b, r) => r.reduce((q, p) => [Math.min(q[0], p[0]), Math.min(q[1], p[1]), Math.max(q[2], p[0]), Math.max(q[3], p[1])], b), [Infinity, Infinity, -Infinity, -Infinity]);
      c.path = new Path2D(); rings.forEach((r) => addRing(c.path, r));
    }
    const rep = new Path2D(); cells.filter((c) => c.sets & 4).forEach((c) => c.rings.forEach((r) => addRing(rep, r)));
    GEO = { outline, grat, land: L, rep };
  }
  /* the cells of the question, grouped by how they are drawn: five steps of the ramp, refused, sea ice. Drawn 4° first,
     then 1°, then the report's nodes, so the finer lattice lies on top where the two meet */
  let PATHS = null, COUNT = null;
  function paths() {
    const P = { cls: [0, 1, 2, 3, 4].map(() => new Path2D()), R: new Path2D(), I: new Path2D() }, K = { D: 0, R: 0, I: 0 };
    const order = cells.slice().sort((a, b) => SH.sizeOf(b) - SH.sizeOf(a));
    for (const c of order) {
      const L = SH.waveLook(c, ST.block, ST.T);
      c.look = L; K[L.k]++;
      const to = L.k === 'D' ? P.cls[L.K] : P[L.k];
      c.rings.forEach((r) => addRing(to, r));
    }
    PATHS = P; COUNT = K;
  }

  /* ================================================================ the canvas and the view */
  const V = { S: 0, S0: 0, tx: 0, ty: 0 };
  let cv = null, g = null, dpr = 1, raf = 0, hover = null;
  const AV = { l: 0, t: 0, r: 0, b: 0 };
  const phone = window.matchMedia('(max-width: 899px)');
  function layout() {
    const w = innerWidth, h = innerHeight, ctl = $('#rm-ctl').getBoundingClientRect();
    if (phone.matches) { const p = $('#panel').getBoundingClientRect(); Object.assign(AV, { l: 8, r: w - 8, t: ctl.bottom + 8, b: Math.max(ctl.bottom + 120, Math.min(h, p.top) - 8) }); }
    else { const p = $('#panel').getBoundingClientRect(); Object.assign(AV, { l: 16, r: Math.max(320, p.left - 16), t: ctl.bottom + 12, b: h - 16 }); }
  }
  function sizeCanvas() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
  }
  const viewCenter = () => [((AV.l + AV.r) / 2 - V.tx) / V.S, ((AV.t + AV.b) / 2 - V.ty) / V.S];
  const atCenter = (c, s) => ({ S: s, tx: (AV.l + AV.r) / 2 - c[0] * s, ty: (AV.t + AV.b) / 2 - c[1] * s });
  function fitBox(x0, y0, x1, y1) { const s = Math.min((AV.r - AV.l) / (x1 - x0), (AV.b - AV.t) / (y1 - y0)); return atCenter([(x0 + x1) / 2, (y0 + y1) / 2], s); }
  const worldView = () => fitBox(-XM, -YM, XM, YM);
  function boxView(b) {                                                       /* a lon/lat box, by its projected corners and edges */
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let k = 0; k <= 8; k++) for (const [lo, la] of [[b[0][0] + (b[1][0] - b[0][0]) * k / 8, b[0][1]], [b[0][0] + (b[1][0] - b[0][0]) * k / 8, b[1][1]], [b[0][0], b[0][1] + (b[1][1] - b[0][1]) * k / 8], [b[1][0], b[0][1] + (b[1][1] - b[0][1]) * k / 8]]) {
      const p = proj(lo, la); x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
    }
    return fitBox(x0, y0, x1, y1);
  }
  function clampView(v) {
    const s = Math.max(V.S0 * 0.8, Math.min(V.S0 * 80, v.S));
    const k = s / v.S, cx = (AV.l + AV.r) / 2, cy = (AV.t + AV.b) / 2;
    let tx = cx - (cx - v.tx) * k, ty = cy - (cy - v.ty) * k;
    if (s === v.S) { tx = v.tx; ty = v.ty; }
    const m = 60;                                                            /* keep some of the world in the window */
    tx = Math.min(innerWidth - m + XM * s, Math.max(m - XM * s, tx));
    ty = Math.min(innerHeight - m + YM * s, Math.max(m - YM * s, ty));
    return { S: s, tx, ty };
  }
  function setView(v) { Object.assign(V, clampView(v)); redraw(); writeHash(); }
  let anim = null;
  function flyTo(v, ms) {
    cancelAnimationFrame(anim);
    const from = { S: V.S, c: viewCenter() }, to = { S: v.S, c: [((AV.l + AV.r) / 2 - v.tx) / v.S, ((AV.t + AV.b) / 2 - v.ty) / v.S] }, t0 = performance.now(), dur = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : (ms || 650);
    const step = (now) => {
      const u = dur ? Math.min(1, (now - t0) / dur) : 1, e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      const s = Math.exp(Math.log(from.S) + (Math.log(to.S) - Math.log(from.S)) * e);
      Object.assign(V, clampView(atCenter([from.c[0] + (to.c[0] - from.c[0]) * e, from.c[1] + (to.c[1] - from.c[1]) * e], s)));
      redraw();
      if (u < 1) anim = requestAnimationFrame(step); else writeHash();
    };
    anim = requestAnimationFrame(step);
  }
  function zoomAt(f, sx, sy) {
    const s = Math.max(V.S0 * 0.8, Math.min(V.S0 * 80, V.S * f)), k = s / V.S;
    setView({ S: s, tx: sx - (sx - V.tx) * k, ty: sy - (sy - V.ty) * k });
  }

  /* the two fills that are not a colour: the refused void, hatched, and sea ice, dotted — the globe's two patterns */
  const PAT = {};
  function pattern(kind) {
    const key = kind + dpr; if (PAT[key]) return PAT[key];
    const s = 8, t = document.createElement('canvas'); t.width = t.height = Math.round(s * dpr);
    const q = t.getContext('2d'); q.scale(dpr, dpr);
    q.fillStyle = C.sunk; q.fillRect(0, 0, s, s);
    if (kind === 'hatch') { q.strokeStyle = C.ink4; q.lineWidth = 1.2; q.beginPath(); q.moveTo(0, s); q.lineTo(s, 0); q.moveTo(-2, 2); q.lineTo(2, -2); q.moveTo(s - 2, s + 2); q.lineTo(s + 2, s - 2); q.stroke(); }
    else { q.fillStyle = C.ink5; q.beginPath(); q.arc(4, 4, 1.1, 0, 2 * Math.PI); q.fill(); }
    return (PAT[key] = g.createPattern(t, 'repeat'));
  }
  function redraw() { if (!raf) raf = requestAnimationFrame(draw); }
  /* the pill flips the theme: the tokens again, the two patterns again, the same paths drawn again (nothing re-decided) */
  document.addEventListener('warrant-theme', () => { colours(); Object.keys(PAT).forEach((k) => delete PAT[k]); redraw(); });
  function draw() {
    raf = 0;
    if (!g || !GEO) return;
    const w = innerWidth, h = innerHeight;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
    g.save(); g.translate(V.tx, V.ty); g.scale(V.S, V.S);
    g.fillStyle = C.sunk; g.fill(GEO.outline);
    g.save(); g.clip(GEO.outline);
    g.lineWidth = 0.6 / V.S; g.strokeStyle = C.ruleSoft; g.stroke(GEO.grat);
    if (PATHS) {
      PATHS.cls.forEach((p, k) => { g.fillStyle = C.s[k]; g.fill(p); });
      const m = new DOMMatrix().scale(1 / (V.S * dpr));
      const ph = pattern('hatch'); ph.setTransform(m); g.fillStyle = ph; g.fill(PATHS.R);
      const pd = pattern('dots'); pd.setTransform(m); g.globalAlpha = 0.8; g.fillStyle = pd; g.fill(PATHS.I); g.globalAlpha = 1;
    }
    g.fillStyle = C.land; g.fill(GEO.land, 'evenodd');
    g.lineWidth = 0.7 / V.S; g.strokeStyle = C.ruleStrong; g.stroke(GEO.land);
    g.lineWidth = 1.4 / V.S; g.strokeStyle = C.ink2; g.stroke(GEO.rep);
    if (hover && hover !== ST.sel) { g.lineWidth = 1.4 / V.S; g.strokeStyle = C.ink2; g.stroke(hover.path); }
    if (ST.sel) { g.lineWidth = 2.4 / V.S; g.strokeStyle = C.ink; g.stroke(ST.sel.path); }
    g.restore();
    g.lineWidth = 1 / V.S; g.strokeStyle = C.ruleStrong; g.stroke(GEO.outline);
    g.restore();
  }
  /* the cell under a point of the window: the smallest drawn square that holds it */
  function inRing(r, x, y) { let a = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const p = r[i], q = r[j]; if ((p[1] > y) !== (q[1] > y) && x < (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]) + p[0]) a = !a; } return a; }
  function hit(sx, sy) {
    const x = (sx - V.tx) / V.S, y = (sy - V.ty) / V.S;
    let best = null;
    for (const c of cells) {
      const b = c.bb; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
      if (c.rings.some((r) => inRing(r, x, y)) && (!best || SH.sizeOf(c) < SH.sizeOf(best))) best = c;
    }
    return best;
  }
  function interact() {
    const pts = new Map(); let drag = null, pinch = null;
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); cancelAnimationFrame(anim);
      if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, tx: V.tx, ty: V.ty, moved: false };
      else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), S: V.S, tx: V.tx, ty: V.ty, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; if (drag) drag.moved = true; }
      tipOff();
    });
    cv.addEventListener('pointermove', (e) => {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && pts.size >= 2) {
        const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), s = Math.max(V.S0 * 0.8, Math.min(V.S0 * 80, pinch.S * d / pinch.d)), k = s / pinch.S, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        Object.assign(V, clampView({ S: s, tx: m[0] - (pinch.m[0] - pinch.tx) * k, ty: m[1] - (pinch.m[1] - pinch.ty) * k })); redraw(); return;
      }
      if (drag && pts.size === 1) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        if (drag.moved) { Object.assign(V, clampView({ S: V.S, tx: drag.tx + dx, ty: drag.ty + dy })); redraw(); }
        return;
      }
      if (e.pointerType === 'mouse') { const c = hit(e.clientX, e.clientY); if (c !== hover) { hover = c; redraw(); } cv.style.cursor = c ? 'pointer' : 'grab'; if (c) tipOn(c, e.clientX, e.clientY); else tipOff(); }
    });
    const up = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 0) {
        if (drag && !drag.moved && e.type === 'pointerup') { const c = hit(e.clientX, e.clientY); if (c) select(c, false); }
        drag = null; writeHash();
      } else if (pts.size === 1) { const [p] = [...pts.values()]; drag = { x: p[0], y: p[1], tx: V.tx, ty: V.ty, moved: true }; }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { if (hover) { hover = null; redraw(); } tipOff(); });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX, e.clientY); }, { passive: false });
    cv.addEventListener('dblclick', (e) => { e.preventDefault(); zoomAt(2, e.clientX, e.clientY); });
    $('#rm-world').onclick = () => { if (phone.matches) setSheet('peek'); flyTo(worldView()); };
    $('#rm-brazil').onclick = () => { if (phone.matches) setSheet('peek'); flyTo(boxView(CFG.frame.brazil)); };
    $('#rm-zin').onclick = () => zoomAt(1.6, (AV.l + AV.r) / 2, (AV.t + AV.b) / 2);
    $('#rm-zout').onclick = () => zoomAt(1 / 1.6, (AV.l + AV.r) / 2, (AV.t + AV.b) / 2);
    document.addEventListener('keydown', (e) => {
      if (/^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || '')) return;
      if (e.key === '+' || e.key === '=') zoomAt(1.6, (AV.l + AV.r) / 2, (AV.t + AV.b) / 2);
      else if (e.key === '-') zoomAt(1 / 1.6, (AV.l + AV.r) / 2, (AV.t + AV.b) / 2);
      else if (e.key === 'Escape' && ST.sel) closeCard();
    });
  }

  /* ---- the tooltip: where the pointer is, and what the question says there ---- */
  function lookWords(c) {
    const s = S();
    if (c.ice) return s.tipI;
    const L = c.look || SH.waveLook(c, ST.block, ST.T);
    if (L.k === 'R') return '∅ ' + s.tipR;
    const F = FD.cells[c.id][BLK.indexOf(ST.block)][0][c.blocks[ST.block].ad], k = ST.T === PER[0] ? 0 : 2;
    return rng([F[k], F[k + 1]]) + ' · ' + s.fam[FAM[c.blocks[ST.block].ad]];
  }
  const nameOf = (c) => { const p = PLACES.find((q) => q.id === c.id); return p ? p.label : null; };
  function tipOn(c, x, y) {
    const t = $('#rm-tip'), nm = nameOf(c);
    t.innerHTML = '<b>' + esc(nm || place(c)) + '</b>' + (nm ? '<span>' + esc(place(c)) + '</span>' : '') + '<span class="v">' + esc(lookWords(c)) + '</span>';
    t.hidden = false;
    const r = t.getBoundingClientRect();
    t.style.left = Math.min(innerWidth - r.width - 8, x + 14) + 'px'; t.style.top = Math.min(innerHeight - r.height - 8, y + 14) + 'px';
  }
  function tipOff() { const t = $('#rm-tip'); if (t) t.hidden = true; }

  /* ================================================================ the panel */
  function seg(el, items, cur, on) {
    el.innerHTML = items.map(([v, txt]) => '<button type="button" role="radio" aria-checked="' + (String(v) === String(cur)) + '" data-v="' + esc(v) + '">' + esc(txt) + '</button>').join('');
    el.onclick = (e) => { const b = e.target.closest('button'); if (b) on(b.dataset.v); };
  }
  function controls() {
    seg($('#rm-T'), PER.map((T) => [T, fill(S().T, { T: per(T) })]), ST.T, (v) => { ST.T = Number(v); question(); });
    seg($('#rm-B'), BLK.map((b) => [b, S().blk[b]]), ST.block, (v) => { ST.block = v; question(); });
  }
  function question() { controls(); paths(); key(); redraw(); list(); if (ST.sel) card(); writeHash(); }
  function key() {
    const s = S(), br = SH.WAVE_BR;
    const lab = (k) => (k === 0 ? '< ' + br[1] + ' m' : k === 4 ? '≥ ' + br[4] + ' m' : br[k] + '–' + br[k + 1]);
    const sea = cells.filter((c) => !c.ice).length;
    $('#rm-key').innerHTML = '<div class="rm-kt">' + esc(fill(s.keyT, { T: per(ST.T), blk: s.blkL[ST.block] })) + '</div>'
      + '<div class="rm-ramp">' + C.s.map((col, k) => '<span><i style="--sw:var(--c-s' + (k + 1) + ')"></i><em>' + esc(lab(k)) + '</em></span>').join('') + '</div>'
      + '<div class="rm-kx"><span><i class="rm-sw hatch"></i>' + esc(s.refK) + '</span><span><i class="rm-sw ice"></i>' + esc(s.iceK) + '</span></div>'
      + '<p class="rm-kn">' + esc(fill(s.keyN, { d: intf(COUNT.D), n: intf(sea), r: intf(COUNT.R), i: intf(COUNT.I) })) + '</p>';
  }
  /* a cell's design wave in the list's short form */
  function shortOf(c) {
    if (c.ice) return '<span class="h r">' + esc(S().iceK) + '</span>';
    const L = SH.waveLook(c, ST.block, ST.T);
    if (L.k === 'R') return '<span class="h r">' + val(esc(S().refW), W.REFUSED) + '</span>';
    const F = FD.cells[c.id][BLK.indexOf(ST.block)][0][c.blocks[ST.block].ad], k = ST.T === PER[0] ? 0 : 2;
    return '<span class="h">' + esc(rng([F[k], F[k + 1]])) + '</span>';
  }
  function list() {
    const el = $('#rm-list'); if (!el || !A) return;
    const s = S(), grp = (m) => PLACES.filter((p) => p.margin === m && byId.has(p.id));
    const row = (p) => { const c = byId.get(p.id); return '<li><button type="button" data-id="' + esc(c.id) + '"><span class="b">' + esc(p.label) + '<small>' + esc(place(c)) + '</small></span>' + shortOf(c) + '</button></li>'; };
    el.innerHTML = '<h2 class="rm-sec">' + esc(s.margin) + '</h2><ol class="rm-places">' + grp(true).map(row).join('') + '</ol>'
      + '<h2 class="rm-sec">' + esc(s.others) + '</h2><ol class="rm-places">' + grp(false).map(row).join('') + '</ol>'
      + '<p class="rm-note">' + esc(s.placesN) + '</p>'
      + '<div class="rm-find"><label for="rm-go">' + esc(s.go) + '</label><input id="rm-go" type="text" inputmode="decimal" autocomplete="off" placeholder="' + esc(s.goPh) + '"></div><p class="rm-note" id="rm-go-msg" aria-live="polite"></p>';
    el.querySelectorAll('[data-id]').forEach((b) => { b.onclick = () => select(byId.get(b.dataset.id), true); });
    const go = $('#rm-go');
    go.onkeydown = (e) => {
      if (e.key !== 'Enter') return;
      const m = go.value.replace(/(\d),(\d)/g, '$1.$2').match(/(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)/);
      if (!m || Math.abs(Number(m[1])) > 90 || Math.abs(Number(m[2])) > 180) { $('#rm-go-msg').textContent = s.goBad; return; }
      $('#rm-go-msg').textContent = '';
      const la = Number(m[1]) * RAD, lo = Number(m[2]) * RAD;
      let best = null, bd = Infinity;
      for (const c of cells) { const d = Math.acos(Math.min(1, Math.sin(la) * Math.sin(c.lat * RAD) + Math.cos(la) * Math.cos(c.lat * RAD) * Math.cos(lo - c.lon * RAD))); if (d < bd) { bd = d; best = c; } }
      if (best) select(best, true);
    };
  }
  function setTab(t) {
    ST.tab = t;
    document.querySelectorAll('.rm-tab').forEach((b) => { const on = b.dataset.tab === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    document.querySelectorAll('.rm-pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === t));
    $('#rm-scroll').scrollTop = 0;
  }

  /* ================================================================ a cell */
  function select(c, fly) {
    if (!c) return;
    ST.sel = c; ST.trust = false; hover = null; tipOff(); document.body.classList.add('rm-open');
    setTab('places'); card(); redraw(); writeHash();
    if (phone.matches && UI.sheet === 'peek') setSheet('half');
    if (fly) {
      later(() => {
        const s = Math.max(V.S, V.S0 * (SH.sizeOf(c) >= 4 ? 3 : 7)), p = proj(c.lon, c.lat);
        flyTo(atCenter(p, s));
      });
    }
  }
  function closeCard() { document.body.classList.remove('rm-open'); ST.sel = null; $('#rm-card').hidden = true; $('#rm-list').hidden = false; redraw(); writeHash(); list(); }
  const later = (f) => setTimeout(() => { layout(); f(); }, phone.matches ? 340 : 0);
  /* the state of a family at this cell, block and period: [lo, hi] in centimetres, or the code of its refusal */
  const famAt = (F, i, Tk) => { const s = F[i]; if (!Array.isArray(s)) return { code: s }; return s[Tk] === null ? { code: 'n' } : { v: [s[Tk], s[Tk + 1]] }; };
  function whyWords(why, ad, b) {
    const s = S();
    if (!why) return fill(s.whyL, { the: s.the(FAM[ad]), T: per(ST.T) });
    if (why[0] === 'b') return fill(s.whyB, { of: why[1].map((i) => s.of(FAM[i])).join(s.and) });
    if (why[0] === 't') return fill(s.whyT, { of: why[1].map((i) => s.of(FAM[i])).join(s.and) });
    if (why[0] === 'u') return fill(s.whyU, { of: why[1].map((i) => s.the(FAM[i])).join(s.and) });
    return s.whyN;
  }
  function niceStep(top) { return [0.5, 1, 2, 5, 10, 20, 50].find((q) => top / q <= 5) || 100; }
  /* SIX FAMILIES SIDE BY SIDE: a shared metre axis, each certified family's level a solid tick (decided), the decided
     family heavier (identity by weight, never by dash), its statistical interval dashed (computed), the record a guide;
     a refused family has no mark: ∅ and its reason */
  function strip(c, F, ad, Tk, stat) {
    const s = S(), recCm = Math.round(c.max * 100);
    let top = recCm;
    FAM.forEach((f, i) => { const q = famAt(F, i, Tk); if (q.v) top = Math.max(top, q.v[1]); });
    if (stat && stat[Tk + 1] !== null) top = Math.max(top, stat[Tk + 1]);
    const st = niceStep(top / 100 * 1.04), xmax = Math.ceil(top / 100 * 1.04 / st) * st, X = (cmv) => (cmv / 100 / xmax * 100).toFixed(2);
    const guide = '<line x1="' + X(c.max * 100) + '" x2="' + X(c.max * 100) + '" y1="0" y2="20" class="rm-guide" stroke-width="1" stroke-dasharray="' + G.GUIDE + '" vector-effect="non-scaling-stroke"/>';
    const rows = FAM.map((f, i) => {
      const q = famAt(F, i, Tk), on = i === ad;
      if (!q.v) return '<div class="rm-fr r"><span class="nm">' + esc(s.famS[f]) + '</span><svg class="tr" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">' + guide + '</svg><span class="v">' + val(esc(q.code === 'n' ? s.noLv : s.refW), W.REFUSED) + '</span><span class="w">' + esc(s.fr[q.code] || s.fr.r) + '</span></div>';
      const mid = (q.v[0] + q.v[1]) / 2;
      const tick = '<line x1="' + X(mid) + '" x2="' + X(mid) + '" y1="' + (on ? 2 : 5) + '" y2="' + (on ? 18 : 15) + '" ' + W.attrs(W.DECIDED, { width: on ? 2.6 : 1.4 }) + ' vector-effect="non-scaling-stroke"/>';
      const band = on && stat && stat[Tk] !== null ? '<line x1="' + X(stat[Tk]) + '" x2="' + X(stat[Tk + 1]) + '" y1="10" y2="10" ' + W.attrs(W.COMPUTED, { width: 1.5 }) + ' vector-effect="non-scaling-stroke"/>' : '';
      return '<div class="rm-fr' + (on ? ' on' : '') + '"><span class="nm"' + (on ? ' title="' + esc(s.dec) + '"' : '') + '>' + esc(s.famS[f]) + '</span><svg class="tr" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">' + guide + band + tick + '</svg><span class="v">' + val(esc(rng(q.v)), W.DECIDED) + '</span></div>';
    }).join('');
    const ticks = []; for (let v = 0; v <= xmax + 1e-9; v += st) ticks.push('<span style="--x:' + (v / xmax * 100).toFixed(2) + '%">' + esc(dec(v, st < 1 ? 1 : 0)) + '</span>');
    return '<div class="rm-strip">' + rows + '<div class="rm-fax"><span class="nm">m</span><div class="ax">' + ticks.join('') + '</div><span class="v"></span></div></div>'
      + '<p class="rm-note">' + esc(fill(s.guide, { m: exact(c.max) + ' m' })) + '</p>';
  }
  function survive(c, b) {
    const s = S(), CW = { ad: 'A²', ks: 'KS', mse: 'MSE', chi2: 'χ²' };
    const chip = (code, ref, label) => (code === ref ? '<span class="rm-sv ok">✓ ' + esc(label) + '</span>' : code === 6 ? '<span class="rm-sv r">∅ ' + esc(label) + '</span>' : '<span class="rm-sv no">≠ ' + esc(label) + ': ' + esc(s.fam[FAM[code]]) + '</span>');
    const ad = b.ad, cr = CRIT.map((k) => chip(b[k], ad, CW[k])).join(''), bl = BLK.map((x) => chip(c.blocks[x].ad, ad, s.blk[x])).join('');
    let sum = '';
    if (ad !== 6) {
      const a = CRIT.filter((k) => b[k] === ad).length, bb = BLK.filter((x) => c.blocks[x].ad === ad).length;
      sum = '<p class="rm-sum">' + esc(fill(s.survS, { The: cap(s.the(FAM[ad])), a: intf(a), na: intf(CRIT.length), b: intf(bb), nb: intf(BLK.length) })) + '</p>';
    } else sum = '<p class="rm-note">' + esc(s.survR) + '</p>';
    return '<h2 class="rm-sec">' + esc(s.survH) + '</h2>' + sum
      + '<div class="rm-svrow"><span class="k">' + esc(fill(s.survC, { four: wnum(CRIT.length), blkL: s.blkL[ST.block] })) + '</span><span class="cs">' + cr + '</span></div>'
      + '<div class="rm-svrow"><span class="k">' + esc(fill(s.survB, { three: wnum(BLK.length) })) + '</span><span class="cs">' + bl + '</span></div>';
  }
  /* WHAT THIS RESTS ON (WARRANT v2.1): the builder's chain (CFG.prem, every figure gated there), with this cell's own
     figures in the independence of its maxima and the choice of its family, and its buoy where one was moored here */
  function restsOn(c, b, why) {
    const s = S(), P = CFG.prem, items = P.items.map((x) => Object.assign({}, x)), n = CFG.nBlock[ST.block];
    const buoys = CFG.pnb && CFG.pnb.at && CFG.pnb.at[c.id];
    if (buoys) items[0].evidence += buoys.map((q) => fill(s.buoy, { b: esc(q.buoy), p: intf(q.pairs), f: q.from.slice(0, 4), t: q.to.slice(0, 4),
      bias: val((q.bias < 0 ? '−' : '+') + dec(Math.abs(q.bias), 2) + ' m', W.COMPUTED), rms: val(dec(q.rms, 2) + ' m', W.COMPUTED) })).join('');
    items[1].evidence = esc(fill(s.iid, { n: intf(n), blkL: s.blkL[ST.block], y: intf(CFG.years.n), T: per(ST.T) }))
      + (c.ei && ST.block === BLK[0] ? fill(esc(s.storms), { u: val(dec(c.ei.u, 2) + ' m', W.COMPUTED), th: val('θ = ' + dec(c.ei.theta, 2), W.COMPUTED), d: val(dec(1 / c.ei.theta, 1), W.COMPUTED) }) : '');
    items[4].evidence = b.ad !== 6 ? esc(fill(s.choiceD, { the: s.the(FAM[b.ad]), six: wnum(FAM.length), n: intf(n) })) : esc(fill(s.choiceR, { why: whyWords(why, b.ad, b) }));
    return '<h3>' + esc(s.restsH) + '</h3>' + W.premisesHtml(items, { meetLine: P.meet });
  }
  function card() {
    const c = ST.sel, s = S(), el = $('#rm-card'); if (!c || !el) return;
    $('#rm-list').hidden = true; el.hidden = false;
    const nm = nameOf(c), lattice = (c.sets & 4) ? s.rep : (c.sets & 2) ? s.lat1 : s.lat4;
    const head = '<div class="rm-cbar"><button type="button" class="rm-btn" id="rm-back">← ' + esc(s.back) + '</button><span class="sp"></span>'
      + '<a class="rm-btn" href="' + esc(globeHref(c)) + '">' + esc(s.onGlobe) + ' ↗</a><button type="button" class="rm-btn" id="rm-link">' + esc(s.link) + '</button></div>'
      + '<h1>' + esc(nm || place(c)) + '</h1><div class="rm-where">' + esc([nm ? place(c) : null, lattice, fill(s.T, { T: per(ST.T) }), s.blkL[ST.block]].filter(Boolean).join(' · ')) + '</div>';
    let h = head;
    if (c.ice) {
      h += '<div class="rm-void ice"><b>' + esc(s.iceL) + '</b><span>' + esc(fill(s.iceTxt, { steps: intf(c.iceSteps), months: intf(c.iceMonths), max: intf(Math.round(100 * c.iceMax)) })) + '</span></div>'
        + '<h2 class="rm-sec">' + esc(s.certH) + '</h2><p class="rm-note">' + esc(s.certTxt) + '</p><a class="rm-btn rm-go" href="' + esc(globeHref(c)) + '">' + esc(s.certBtn) + ' ↗</a>';
      el.innerHTML = h; wireCard(c); return;
    }
    const bi = BLK.indexOf(ST.block), b = c.blocks[ST.block], D = FD.cells[c.id][bi], F = D[0], why = D[1], stat = D[2], Tk = ST.T === PER[0] ? 0 : 2;
    const code = SH.levelCode(b, ST.T), ad = b.ad === 6 ? null : b.ad;
    const rec = '<div class="rc"><b>' + esc(exact(c.max)) + '<small> m</small></b><span>' + esc(fill(s.recL, { a: CFG.years.first, b: CFG.years.last })) + '</span></div>';
    if (!code) {
      const q = famAt(F, ad, Tk).v;
      h += '<div class="rm-hero"><div class="hb"><b>' + esc(dcm(q[0])) + '–' + esc(dcm(q[1])) + '<small> m</small></b><span>' + esc(fill(s.heroL, { T: per(ST.T) })) + '</span></div>' + rec + '</div>'
        + '<p class="rm-fam">' + fill(s.famLine, { fam: esc(s.fam[FAM[ad]]), six: esc(wnum(FAM.length)), n: esc(intf(CFG.nBlock[ST.block])), blkL: esc(s.blkL[ST.block]) }) + '</p>'
        + '<p class="rm-stat">' + (stat && stat[Tk] !== null ? fill(esc(s.statLine), { y: intf(CFG.years.n), v: val(esc(rng([stat[Tk], stat[Tk + 1]])), W.COMPUTED), lvl: intf(CFG.stat.level) }) : esc(s.statNone)) + '</p>';
    } else {
      h += '<div class="rm-hero"><div class="rm-void"><b>' + val(esc(s.refH), W.REFUSED) + '</b><span>' + esc(cap(whyWords(code === 'nolevel' ? null : why, b.ad, b))) + '</span></div>' + rec + '</div>';
    }
    /* the six families side by side */
    const certified = FAM.map((f, i) => ({ f, q: famAt(F, i, Tk) })).filter((x) => x.q.v);
    let spread = '';
    if (certified.length > 1) {
      const lo = certified.reduce((m, x) => (x.q.v[0] < m.q.v[0] ? x : m)), hi = certified.reduce((m, x) => (x.q.v[1] > m.q.v[1] ? x : m));
      const t = fill(s.spread, { k: wnum(certified.length), lo: dcm(lo.q.v[0]) + ' m', flo: s.fam[lo.f], hi: dcm(hi.q.v[1]) + ' m', fhi: s.fam[hi.f] });
      /* the last sentence only where the families' answers lie more than a centimetre or two apart */
      spread = '<p class="rm-sum">' + esc(t + (hi.q.v[1] - lo.q.v[0] > 2 ? s.spreadWhy : '')) + '</p>';
    } else spread = '<p class="rm-note">' + esc(s.spread1) + '</p>';
    h += '<h2 class="rm-sec">' + esc(fill(s.sixH, { Six: cap(wnum(FAM.length)), six: wnum(FAM.length) })) + '</h2>' + spread + strip(c, F, ad, Tk, code ? null : stat)
      + W.legendHtml({ compact: true, from: h });   /* derived from the card it closes (R20) */
    h += survive(c, b);
    /* the rigour, one click down */
    h += '<button type="button" class="rm-trustb" id="rm-trust" aria-expanded="' + ST.trust + '" aria-controls="rm-trustp">' + esc(s.trust) + ' <span class="chev">›</span></button><div class="rm-trustp" id="rm-trustp"' + (ST.trust ? '' : ' hidden') + '>';
    if (!code) {
      const lv = b['l' + ST.T];
      h += '<h3>' + esc(s.encH) + '</h3><p>' + esc(fill(s.encTxt, { T: per(ST.T), of: s.of(FAM[ad]), lo: exact(lv[0]), hi: exact(lv[1]), n: intf(CFG.nBlock[ST.block]), blkL: s.blkL[ST.block] })) + '</p>';
    }
    h += restsOn(c, b, code === 'nolevel' ? null : why)
      + '<h3>' + esc(s.certH) + '</h3><p>' + esc(s.certTxt) + '</p><a class="rm-btn rm-go" href="' + esc(globeHref(c)) + '">' + esc(s.certBtn) + ' ↗</a></div>';
    el.innerHTML = h; wireCard(c);
  }
  function wireCard(c) {
    $('#rm-back').onclick = closeCard;
    $('#rm-link').onclick = (e) => {
      writeHash(); const btn = e.currentTarget, u = location.origin + location.pathname + '#' + new URLSearchParams({ b: ST.block, T: String(ST.T), c: c.id }).toString();
      const done = () => { const t0 = btn.textContent; btn.textContent = S().copied; setTimeout(() => { btn.textContent = t0; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(done, () => window.prompt(S().link, u)); else window.prompt(S().link, u);
    };
    const tb = $('#rm-trust');
    if (tb) tb.onclick = () => { ST.trust = !ST.trust; tb.setAttribute('aria-expanded', String(ST.trust)); $('#rm-trustp').hidden = !ST.trust; };
  }

  /* ================================================================ the sheet, the start */
  const UI = { sheet: 'peek' };
  function setSheet(st) {
    UI.sheet = st; const p = $('#panel');
    p.classList.toggle('half', st === 'half'); p.classList.toggle('full', st === 'full');
    setTimeout(() => { layout(); }, 340);
  }
  function sheetWire() {
    const grab = $('.rm-grab'), p = $('#panel'); let y0 = null, base = 0, t0 = 0;
    const off = (st) => (st === 'full' ? 0 : st === 'half' ? 0.40 * innerHeight : 0.90 * innerHeight - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rm-peek')) || 200));
    const start = (e) => { if (!phone.matches) return; y0 = e.clientY; t0 = performance.now(); base = off(UI.sheet); p.classList.add('dragging'); };
    const move = (e) => { if (y0 === null) return; p.style.transform = 'translateY(' + Math.max(0, base + e.clientY - y0) + 'px)'; };
    const end = (e) => {
      if (y0 === null) return;
      p.classList.remove('dragging'); p.style.transform = '';
      const dy = e.clientY - y0, v = dy / Math.max(1, performance.now() - t0), y = base + dy; y0 = null;
      if (Math.abs(dy) < 6) { setSheet(UI.sheet === 'peek' ? 'half' : UI.sheet === 'half' ? 'full' : 'peek'); return; }
      let st = ['full', 'half', 'peek'].reduce((a, s2) => (Math.abs(off(s2) - y) < Math.abs(off(a) - y) ? s2 : a));
      if (v > 0.6) st = UI.sheet === 'full' ? 'half' : 'peek'; else if (v < -0.6) st = UI.sheet === 'peek' ? 'half' : 'full';
      setSheet(st);
    };
    grab.addEventListener('pointerdown', start); addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end);
    document.querySelectorAll('.rm-tab').forEach((b) => { b.onclick = () => { setTab(b.dataset.tab); if (phone.matches && UI.sheet === 'peek') setSheet('half'); }; });
  }
  function fail(e) {
    const w = $('#rm-wait'); if (w) w.innerHTML = '<span>' + esc(fill(S().fail, { e: e && e.message ? e.message : String(e) })) + '</span>';
  }

  sheetWire();
  const get = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u + ': HTTP ' + r.status); return r.json(); });
  Promise.all([get('../atlas.json'), get('../land.json'), get('cells.json')]).then(([a, land, fd]) => {
    A = a; FD = fd;
    cells = a.cells.map((r) => SH.decode(r)); cells.forEach((c) => byId.set(c.id, c));
    if (JSON.stringify(fd.fam) !== JSON.stringify(FAM) || cells.some((c) => !c.ice && !fd.cells[c.id])) throw new Error('cells.json is not the atlas\'s');
    const H = readHash();
    cv = document.createElement('canvas'); cv.id = 'rm-cv'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', $('#map').getAttribute('aria-label') || '');
    $('#map').appendChild(cv); g = cv.getContext('2d');
    sizeCanvas(); layout(); geometry(land); paths();
    V.S0 = worldView().S;
    if (H.at) setView(atCenter([H.at[0], H.at[1]], V.S0 * H.at[2])); else setView(worldView());
    interact(); controls(); key(); list();
    if (H.cell && byId.has(H.cell)) select(byId.get(H.cell), !H.at);
    document.body.classList.add('rm-ready');
    addEventListener('resize', () => { const c = viewCenter(), k = V.S / V.S0; sizeCanvas(); layout(); V.S0 = worldView().S; Object.assign(V, clampView(atCenter(c, V.S0 * k))); redraw(); });
    /* a handle for the page's own drives (Chrome); it changes nothing */
    window.__map = { select: (id) => select(byId.get(id), true), state: ST, view: V, brazil: () => $('#rm-brazil').click(), world: () => $('#rm-world').click(), setSheet, cells: () => cells.length };
  }).catch(fail);
})();
