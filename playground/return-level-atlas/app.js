/* app.js — the return-level atlas, in the tab.
   playground/return-level-atlas/ · cert-machine

   A globe of the paper's hindcast cut into cells, each a certificate from
   certs/hseva-atlas.json (atlas.json beside this page is the ledger's compact
   view). What a cell shows is chosen in the controls; a refused cell is
   hatched, a sea-ice cell dotted, never coloured as if decided. A click opens
   the cell: its choices per block, and a button that fetches the cell's daily
   maxima from the public repository (pinned by commit, checked by sha256) and
   certifies them again here, in a Web Worker running instruments/hseva/
   atlas.js — the bytes that wrote the ledger — then compares the record with
   the ledger's by sha256. Colours are read from the page's tokens; nothing
   here writes a colour of its own. There is no request in this file but the
   page's own data and the cell file the reader asks for. */
(function () {
  'use strict';
  const SPEC = JSON.parse(document.getElementById('ra-spec').textContent);
  const BUNDLE = document.getElementById('ra-bundle').textContent;
  const WORKER = document.getElementById('ra-worker').textContent;
  const WURL = URL.createObjectURL(new Blob([BUNDLE + '\n' + WORKER], { type: 'text/javascript' }));
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (x) => Number(x).toLocaleString('en-US');
  const tok = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C = { paper: tok('--paper'), sunk: tok('--sunk'), surface: tok('--surface'), surface2: tok('--surface2'), ink: tok('--ink'), ink2: tok('--ink-2'), ink3: tok('--ink-3'), ink4: tok('--ink-4'), ink5: tok('--ink-5'), rule: tok('--rule'), ruleStrong: tok('--rule-strong'), ruleSoft: tok('--rule-soft'), s: [tok('--c-s1'), tok('--c-s2'), tok('--c-s3'), tok('--c-s4'), tok('--c-s5')] };
  const FAM = ['normal', 'lognormal', 'weibull', 'expweibull', 'gengamma', 'gumbel'];
  const FW = { normal: 'normal', lognormal: 'lognormal', weibull: 'Weibull', expweibull: 'exp. Weibull', gengamma: 'gen. gamma', gumbel: 'Gumbel' };
  const BLK = ['daily', 'weekly', 'monthly'], BW = { daily: 'daily maxima', weekly: 'weekly maxima', monthly: 'monthly maxima' };
  const CRIT = ['ad', 'ks', 'mse', 'chi2'], CW = { ad: 'Anderson–Darling', ks: 'Kolmogorov–Smirnov', mse: 'MSE', chi2: 'χ²' };
  const famOf = (k) => (k === 6 || k === null || k === undefined ? null : FAM[k]);
  /* the exponentiated Weibull's state at a cell-block (build.js row) */
  const EWW = ['is certified in (α, k, λ)', 'climbs past α = 10⁴ and, in its Gumbel coordinates, on toward k → 0 — the Fréchet corner, nothing proved: refused', 'is refused', 'is certified in its Gumbel coordinates (k, θ = λᵏ, β = θ ln α), where (α, k, λ) could not hold it — α runs large', 'climbs past α = 10⁴ and is not certified in its Gumbel coordinates either: refused'];
  const place = (c) => Math.abs(c.lat) + '° ' + (c.lat < 0 ? 'S' : 'N') + ' · ' + Math.abs(c.lon) + '° ' + (c.lon < 0 ? 'W' : 'E');

  const MODES = [
    ['wave', 'design wave'], ['family', 'which family'], ['blocks', 'block sensitivity'], ['record', 'against the record'],
    ['criteria', 'criteria agree?'], ['gg', 'generalized gamma'], ['ew', 'exp. Weibull'], ['naive', 'a threshold fitter'],
  ];
  const GO = [
    ['globe', 'the whole globe', { center: [-28, -14], zoom: 1.75 }], ['brazil', 'Brazilian margin', { bounds: [[-58, -38], [-24, 8]] }],
    ['satl', 'South Atlantic', { bounds: [[-70, -60], [20, 10]] }], ['south', 'Southern Ocean', { center: [0, -55], zoom: 1.6 }],
    ['india', 'Indian Ocean', { bounds: [[40, -10], [100, 28]] }], ['japan', 'NW Pacific', { bounds: [[115, 10], [165, 45]] }],
    ['natl', 'North Atlantic', { bounds: [[-70, 30], [10, 68]] }],
  ];
  const state = { mode: 'wave', block: 'daily', crit: 'ad', T: 100, fam: 'expweibull' };
  let A = null, cells = [], byId = new Map(), map = null, sel = null, worker = null, hover = null, claimOn = null, lastCert = null, run = null;

  /* ---- the ledger's compact view ---- */
  function decode(r) {
    if (r[4] === 1) return { id: r[0], lat: r[1], lon: r[2], sets: r[3], ice: true, report: r[5], iceSteps: r[6], iceMonths: r[7], iceMax: r[8], fillDays: r[9], fillSteps: r[10] };
    const blocks = {};
    BLK.forEach((b, k) => { const q = r[9 + k]; blocks[b] = { ad: q[0], ks: q[1], mse: q[2], chi2: q[3], naive: q[4], gg: q[5], ew: q[6], l100: [q[7], q[8]], l1000: [q[9], q[10]], below: q[11] }; });
    return { id: r[0], lat: r[1], lon: r[2], sets: r[3], ice: false, report: r[5], sha: r[6], recSha: r[7], max: r[8], blocks };
  }
  const sizeOf = (c) => ((c.sets & 2) ? 1 : (c.sets & 1) ? 4 : 0.5);
  function square(c) {
    const h = sizeOf(c) * 0.46;
    return [[[c.lon - h, c.lat - h], [c.lon + h, c.lat - h], [c.lon + h, c.lat + h], [c.lon - h, c.lat + h], [c.lon - h, c.lat - h]]];
  }

  /* ---- what a cell shows: a colour and a kind (D decided, R refused, I ice) ---- */
  const ramp = (v, br) => { let k = 0; while (k < br.length && v >= br[k]) k++; return C.s[Math.min(4, Math.max(0, k - 1))]; };
  const WAVE_BR = [0, 4, 8, 12, 16];
  const BLOCK_BR = [1, 1.05, 1.15, 1.3, 1.5];
  const REC_BR = [0, 1, 1.25, 1.6, 2.2];
  /* a refused cell says why in the words of the view it is refused in */
  const noLevel = (b) => (b.ad === 6 ? 'no family decided by Anderson–Darling' : 'the decided family\'s ' + state.T + '-year level could not be enclosed');
  function look(c) {
    if (c.ice) return { k: 'I', col: C.rule };
    const b = c.blocks[state.block];
    const lv = state.T === 100 ? b.l100 : b.l1000;
    switch (state.mode) {
      case 'wave': return b.ad === 6 || lv[1] === null ? { k: 'R', why: noLevel(b) } : { k: 'D', col: ramp(lv[1], WAVE_BR), v: lv[1] };
      case 'family': {
        const r = b[state.crit];
        return r === 6 ? { k: 'R', why: 'no family decided by ' + CW[state.crit] } : { k: 'D', col: FAM[r] === state.fam ? C.ink : C.s[0], v: FAM[r] };
      }
      case 'blocks': {
        const miss = BLK.filter((x) => c.blocks[x].ad === 6 || (state.T === 100 ? c.blocks[x].l100 : c.blocks[x].l1000)[1] === null);
        if (miss.length) return { k: 'R', why: 'no ' + state.T + '-year level decided for the ' + miss.map((x) => BW[x]).join(' and ') };
        const ls = BLK.map((x) => (state.T === 100 ? c.blocks[x].l100 : c.blocks[x].l1000)[1]);
        const f = Math.max(...ls) / Math.min(...ls);
        return { k: 'D', col: ramp(f, BLOCK_BR), v: f };
      }
      case 'record': {
        if (b.ad === 6 || lv[1] === null) return { k: 'R', why: noLevel(b) };
        const f = lv[1] / c.max;
        return { k: 'D', col: ramp(f, REC_BR), v: f, below: lv[1] < c.max };
      }
      case 'criteria': {
        const rs = CRIT.map((k) => b[k]), off = CRIT.filter((k) => b[k] === 6);
        if (off.length) return { k: 'R', why: off.map((k) => CW[k]).join(', ') + ' decide' + (off.length > 1 ? '' : 's') + ' no family' };
        const agree = rs.every((x) => x === rs[0]);
        return { k: 'D', col: agree ? C.s[1] : C.ink, v: agree ? 'agree' : 'split' };
      }
      case 'gg': return b.gg === 3 ? { k: 'R', why: 'the generalized gamma is refused' } : { k: 'D', col: [C.s[2], C.ink, C.s[0]][b.gg], v: b.gg };
      case 'ew': return b.ew === 0 ? { k: 'D', col: C.s[2], v: 0 } : b.ew === 3 ? { k: 'D', col: C.ink, v: 3 } : { k: 'R', why: 'the exponentiated Weibull ' + EWW[b.ew] };
      case 'naive': {
        const differ = b.naive !== b.ad;
        return { k: 'D', col: differ ? C.ink : C.s[0], v: differ ? 'differs' : 'same' };
      }
    }
    return { k: 'R', why: 'not decided' };
  }
  function features() {
    return { type: 'FeatureCollection', features: cells.map((c, i) => { const L = look(c); return { type: 'Feature', id: i, properties: { i, k: L.k, col: L.col || C.rule, below: L.below ? 1 : 0, rep: (c.sets & 4) ? 1 : 0 }, geometry: { type: 'Polygon', coordinates: square(c) } }; }) };
  }

  /* ---- the map ---- */
  function pattern(kind) {
    const s = 8, cv = document.createElement('canvas'); cv.width = s; cv.height = s;
    const g = cv.getContext('2d');
    g.fillStyle = C.sunk; g.fillRect(0, 0, s, s);
    if (kind === 'hatch') { g.strokeStyle = C.ink4; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, s); g.lineTo(s, 0); g.moveTo(-2, 2); g.lineTo(2, -2); g.moveTo(s - 2, s + 2); g.lineTo(s + 2, s - 2); g.stroke(); }
    else { g.fillStyle = C.ink5; g.beginPath(); g.arc(4, 4, 1.1, 0, 2 * Math.PI); g.fill(); }
    return { width: s, height: s, data: new Uint8Array(g.getImageData(0, 0, s, s).data.buffer) };
  }
  function graticule() {
    const f = [];
    for (let lon = -180; lon < 180; lon += 30) { const ln = []; for (let la = -80; la <= 80; la += 2) ln.push([lon, la]); f.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ln } }); }
    for (let la = -60; la <= 60; la += 30) { const ln = []; for (let lo = -180; lo <= 180; lo += 2) ln.push([lo, la]); f.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ln } }); }
    return { type: 'FeatureCollection', features: f };
  }
  function boxGeo(b) {
    if (!b || !b.lon) return { type: 'FeatureCollection', features: [] };
    /* a box across the antimeridian keeps its east edge past 180 (the renderer wraps it): rewritten to −179 it would be drawn the long way round */
    const [s, n] = b.lat, [w, e] = b.lon, E = e < w ? e + 360 : e, ln = [];
    for (let x = w; x <= E; x += 1) ln.push([x, s]);
    for (let y = s; y <= n; y += 1) ln.push([E, y]);
    for (let x = E; x >= w; x -= 1) ln.push([x, n]);
    for (let y = n; y >= s; y -= 1) ln.push([w, y]);
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ln } }] };
  }
  function initMap(land) {
    map = new maplibregl.Map({
      container: 'ra-map', attributionControl: false, renderWorldCopies: false, maxPitch: 0, dragRotate: false, pitchWithRotate: false,
      center: GO[0][2].center, zoom: GO[0][2].zoom - ($('ra-map').clientWidth < 600 ? 0.75 : 0), minZoom: 0.6, maxZoom: 7,
      style: {
        version: 8, projection: { type: 'globe' },
        sources: { land: { type: 'geojson', data: land }, grat: { type: 'geojson', data: graticule() }, cells: { type: 'geojson', data: features() }, box: { type: 'geojson', data: boxGeo(null) } },
        layers: [
          { id: 'ocean', type: 'background', paint: { 'background-color': C.sunk } },
          { id: 'grat', type: 'line', source: 'grat', paint: { 'line-color': C.ruleSoft, 'line-width': 0.6 } },
          { id: 'cells', type: 'fill', source: 'cells', filter: ['==', ['get', 'k'], 'D'], paint: { 'fill-color': ['get', 'col'], 'fill-opacity': 0.95 } },
          { id: 'cells-r', type: 'fill', source: 'cells', filter: ['==', ['get', 'k'], 'R'], paint: { 'fill-pattern': 'hatch' } },
          { id: 'cells-i', type: 'fill', source: 'cells', filter: ['==', ['get', 'k'], 'I'], paint: { 'fill-pattern': 'dots', 'fill-opacity': 0.8 } },
          { id: 'below', type: 'line', source: 'cells', filter: ['==', ['get', 'below'], 1], paint: { 'line-color': C.ink, 'line-width': 1.4 } },   /* a fact, drawn solid: dash is reserved for standing (design/grammar.js) */
          { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': C.surface2 } },
          { id: 'coast', type: 'line', source: 'land', paint: { 'line-color': C.ruleStrong, 'line-width': 0.7 } },
          { id: 'rep', type: 'line', source: 'cells', filter: ['==', ['get', 'rep'], 1], paint: { 'line-color': C.ink2, 'line-width': 1.4 } },
          { id: 'box', type: 'line', source: 'box', paint: { 'line-color': C.ink, 'line-width': 1.6, 'line-dasharray': [2, 3] } },   /* design/grammar.js GUIDE */
          { id: 'hov', type: 'line', source: 'cells', filter: ['==', ['get', 'i'], -1], paint: { 'line-color': C.ink2, 'line-width': 1.4 } },
          { id: 'sel', type: 'line', source: 'cells', filter: ['==', ['get', 'i'], -1], paint: { 'line-color': C.ink, 'line-width': 2.4 } },
        ],
      },
    });
    map.on('style.load', () => { map.setProjection({ type: 'globe' }); });
    const img = (id) => { if (!map.hasImage(id)) map.addImage(id, pattern(id)); };
    map.on('load', () => { img('hatch'); img('dots'); });
    map.on('styleimagemissing', (e) => { if (e.id === 'hatch' || e.id === 'dots') img(e.id); });
    const layers = ['cells', 'cells-r', 'cells-i'];
    map.on('mousemove', (e) => {
      const f = map.queryRenderedFeatures(e.point, { layers })[0];
      const tip = $('ra-tip');
      if (!f) { tip.style.display = 'none'; map.getCanvas().style.cursor = ''; if (hover) map.setFilter('hov', ['==', ['get', 'i'], -1]); hover = null; return; }
      map.getCanvas().style.cursor = 'pointer';
      const c = cells[f.properties.i];
      if (hover !== c) { hover = c; tip.innerHTML = tipHtml(c); map.setFilter('hov', ['==', ['get', 'i'], f.properties.i]); }
      const r = $('ra-map').getBoundingClientRect(), st = $('ra-map').parentElement.getBoundingClientRect();
      tip.style.left = Math.min(r.left - st.left + e.point.x + 14, st.width - 330) + 'px';
      tip.style.top = (r.top - st.top + e.point.y + 14) + 'px';
      tip.style.display = 'block';
    });
    map.on('mouseout', () => { $('ra-tip').style.display = 'none'; hover = null; if (map.getLayer('hov')) map.setFilter('hov', ['==', ['get', 'i'], -1]); });
    map.on('click', (e) => {
      const f = map.queryRenderedFeatures(e.point, { layers })[0];
      if (f) select(cells[f.properties.i]);
    });
  }
  function refresh() {
    if (!map || !map.getSource('cells')) return;
    hover = null; $('ra-tip').style.display = 'none'; if (map.getLayer('hov')) map.setFilter('hov', ['==', ['get', 'i'], -1]);   /* the words under the pointer belong to the old view */
    map.getSource('cells').setData(features());
    legend();
    if (!sel) side();
  }

  /* ---- words ---- */
  const iceWords = (c) => 'the hindcast\'s sea ice reaches this node on ' + fmt(c.iceSteps) + ' three-hourly steps in ' + fmt(c.iceMonths) + ' months (up to ' + Math.round(100 * c.iceMax) + '% cover): shown, not certified';
  function valueWords(c) {
    if (c.ice) return iceWords(c);
    const b = c.blocks[state.block], L = look(c);
    if (L.k === 'R') return 'REFUSED — ' + L.why;
    switch (state.mode) {
      case 'wave': return famOf(b.ad) ? FW[famOf(b.ad)] + ' decided; ' + state.T + '-year wave ' + L.v.toFixed(2) + ' m' : '';
      case 'family': return FW[L.v] + ' decided by ' + CW[state.crit];
      case 'blocks': return 'the ' + state.T + '-year wave moves ×' + L.v.toFixed(2) + ' across the three blocks';
      case 'record': return state.T + '-year wave ' + (L.v).toFixed(2) + '× the largest day on record' + (L.below ? ' — below it' : '');
      case 'criteria': return L.v === 'agree' ? 'the four criteria decide ' + FW[famOf(b.ad)] : 'the criteria split: ' + CRIT.map((k) => CW[k] + ' ' + FW[famOf(b[k])]).join(', ');
      case 'gg': return ['a maximum inside the family', 'a maximum beside its lognormal limit (α > 500)', 'its likelihood peaks at the lognormal limit (proved)'][b.gg];
      case 'ew': return EWW[b.ew];
      case 'naive': return L.v === 'differs' ? 'a threshold fitter says ' + (famOf(b.naive) ? FW[famOf(b.naive)] : 'REFUSED') + '; the certificate ' + (famOf(b.ad) ? FW[famOf(b.ad)] : 'REFUSES') : 'the threshold fitter and the certificate agree';
    }
    return '';
  }
  const tipHtml = (c) => '<div>' + esc(place(c)) + (c.report ? ' · ' + esc(c.report) : '') + '</div><div class="n">' + esc(valueWords(c)) + '</div>';

  /* ---- controls ---- */
  /* a radio group of buttons; pressing one updates the others in place, so keyboard focus stays where it was */
  function seg(el, items, cur, on) {
    const keys = items.map(([v]) => v).join('|');
    if (el.dataset.keys !== keys) {
      el.innerHTML = items.map(([v, t]) => '<button type="button" role="radio" aria-checked="' + (v === cur) + '" data-v="' + v + '">' + esc(t) + '</button>').join('');
      el.dataset.keys = keys;
    } else el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === cur)));
    el.onclick = (e) => { const b = e.target.closest('button'); if (b) on(b.dataset.v); };
  }
  function controls() {
    seg($('ra-mode'), MODES, state.mode, (v) => { state.mode = v; controls(); refresh(); });
    seg($('ra-block'), BLK.map((b) => [b, b]), state.block, (v) => { state.block = v; controls(); refresh(); if (sel) side(); });
    const sub = $('ra-sub');
    if (state.mode === 'family') {
      if (!$('ra-fam')) sub.innerHTML = '<div class="ra-seg" id="ra-fam" role="radiogroup" aria-label="family"></div><div class="ra-seg" id="ra-crit" role="radiogroup" aria-label="criterion"></div>';
      seg($('ra-fam'), FAM.map((f) => [f, FW[f]]), state.fam, (v) => { state.fam = v; controls(); refresh(); });
      seg($('ra-crit'), CRIT.map((k) => [k, k === 'chi2' ? 'χ²' : k.toUpperCase()]), state.crit, (v) => { state.crit = v; controls(); refresh(); });
    } else if (state.mode === 'wave' || state.mode === 'blocks' || state.mode === 'record') {
      if (!$('ra-T')) sub.innerHTML = '<div class="ra-seg" id="ra-T" role="radiogroup" aria-label="return period"></div>';
      seg($('ra-T'), [['100', '100 years'], ['1000', '1000 years']], String(state.T), (v) => { state.T = Number(v); controls(); refresh(); });
    } else sub.innerHTML = '';
    const go = $('ra-go');
    if (!go.options.length) {
      go.innerHTML = GO.map(([v, t]) => '<option value="' + v + '">' + esc(t) + '</option>').join('');
      go.onchange = () => fly(GO.find((g) => g[0] === go.value)[2]);
    }
    const find = $('ra-find');
    if (find && !find.dataset.on) {                                  /* the keyboard's way to a cell: the one nearest a latitude and longitude */
      find.dataset.on = '1';
      find.onkeydown = (e) => {
        if (e.key !== 'Enter') return;
        const m = find.value.match(/(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)/);
        if (!m) { find.setAttribute('aria-invalid', 'true'); return; }
        find.removeAttribute('aria-invalid');
        const la = Number(m[1]), lo = Number(m[2]), r = Math.PI / 180;
        let best = null, bd = Infinity;
        for (const c of cells) { const d = Math.acos(Math.min(1, Math.sin(la * r) * Math.sin(c.lat * r) + Math.cos(la * r) * Math.cos(c.lat * r) * Math.cos((lo - c.lon) * r))); if (d < bd) { bd = d; best = c; } }
        if (best) { select(best); fly({ center: [best.lon, best.lat], zoom: Math.max(map ? map.getZoom() : 2, 3) }); }
      };
    }
  }
  function fly(v) {
    if (!map) return;
    if (v.bounds) map.fitBounds(v.bounds, { padding: 40, duration: 1400 });
    else map.flyTo({ center: v.center, zoom: v.zoom, duration: 1400 });
  }
  function legend() {
    const sw = (col, t, cls) => '<span class="ra-key"><i class="ra-sw' + (cls ? ' ' + cls : '') + '" style="--sw:' + col + '"></i>' + esc(t) + '</span>';
    const HATCH = { wave: 'REFUSED — no family, or no level, decided', family: 'REFUSED — ' + CW[state.crit] + ' decides no family', blocks: 'REFUSED — a block without a decided level', record: 'REFUSED — no family, or no level, decided', criteria: 'REFUSED — a criterion decides no family', gg: 'the generalized gamma REFUSED', naive: 'REFUSED' };
    let hatch = HATCH[state.mode];
    if (state.mode === 'ew') {                                     /* the refusals in view, counted from the ledger's codes */
      const n = [0, 0]; for (const c of cells) if (!c.ice) { const e = c.blocks[state.block].ew; if (e === 1) n[0]++; else if (e === 2 || e === 4) n[1]++; }
      hatch = 'REFUSED — toward k → 0 at ' + fmt(n[0]) + ' cells, otherwise at ' + fmt(n[1]);
    }
    const base = sw(C.sunk, hatch, 'hatch') + sw(C.sunk, 'sea ice — not certified', 'ice');
    const rampH = (br, lab, unit) => '<div class="ra-ramp">' + C.s.map((col, k) => '<div class="ra-rampcol"><i style="--sw:' + col + '"></i><span>' + (k === 0 ? '<' + br[1] : k === 4 ? '≥' + br[4] : br[k] + '–' + br[k + 1]) + unit + '</span></div>').join('') + '</div>';
    let t = '', body = '';
    switch (state.mode) {
      case 'wave': t = 'the ' + state.T + '-year Hs of the family Anderson–Darling decides · ' + BW[state.block]; body = rampH(WAVE_BR, '', ' m'); break;
      case 'family': t = FW[state.fam] + ', where ' + CW[state.crit] + ' decides it · ' + BW[state.block]; body = sw(C.ink, FW[state.fam] + ' decided') + sw(C.s[0], 'another family decided'); break;
      case 'blocks': t = 'how far the ' + state.T + '-year Hs moves across daily, weekly and monthly maxima (largest ÷ smallest)'; body = rampH(BLOCK_BR, '', '×'); break;
      case 'record': t = 'the ' + state.T + '-year Hs ÷ the largest day in 1993–2024 · ' + BW[state.block] + ' · outlined: below the record'; body = rampH(REC_BR, '', '×'); break;
      case 'criteria': t = 'do Anderson–Darling, KS, MSE and χ² decide the same family? · ' + BW[state.block]; body = sw(C.s[1], 'they agree') + sw(C.ink, 'they split'); break;
      case 'gg': t = 'the generalized gamma · ' + BW[state.block]; body = sw(C.s[2], 'a maximum inside the family') + sw(C.ink, 'a maximum beside its lognormal limit (α > 500)') + sw(C.s[0], 'peaks at the lognormal limit — proved'); break;
      case 'ew': t = 'the exponentiated Weibull · ' + BW[state.block]; body = sw(C.s[2], 'certified in (α, k, λ)') + sw(C.ink, 'certified in its Gumbel coordinates — α runs large'); break;
      case 'naive': t = 'a fitter that stops at α = 500 or α = 10⁴ and calls it the limit, against the certificate · ' + BW[state.block]; body = sw(C.ink, 'names a different family') + sw(C.s[0], 'agrees'); break;
    }
    /* the title is set in capitals: a Greek letter keeps its own case, or α would read as A */
    $('ra-legend').innerHTML = '<div class="t">' + esc(t).replace(/[α-ωχ]/g, (g) => '<span class="ra-nt">' + g + '</span>') + '</div><div class="ra-keys">' + body + base + '</div>';
  }

  /* ---- the side panel: the claims, the small multiples, or a cell ---- */
  function side() {
    const el = $('ra-side');
    if (sel) return cellPanel(el, sel);
    const V = { HOLDS: 'holds', 'DOES NOT HOLD': 'does-not-hold', UNDECIDED: 'undecided' };
    let html = '<h3>' + fmt(cells.filter((c) => !c.ice).length) + ' cells, each a certificate</h3><p class="n">Click a cell to open it and certify it again in this tab. The paper\'s claims, decided over the cells in their boxes:</p>';
    html += '<ul class="ra-claims">' + A.claims.map((k) => '<li class="ra-claim' + (claimOn === k.id ? ' on' : '') + '" data-claim="' + k.id + '" tabindex="0" role="button"><div class="ra-cv ra-v-' + V[k.verdict] + '">' + esc(k.verdict) + '</div><div><div class="ra-cq">' + esc(k.where) + '</div><div class="ra-cr">' + esc(k.rule) + '</div></div></li>').join('') + '</ul>';
    if (state.mode === 'family') {
      html += '<div class="k">where each family is decided · ' + esc(CW[state.crit]) + ' · ' + esc(BW[state.block]) + '</div><div class="ra-sm">' + FAM.map((f) => '<figure><canvas width="360" height="180" data-f="' + f + '"></canvas><figcaption>' + esc(FW[f]) + ' · ' + fmt(cells.filter((c) => !c.ice && c.blocks[state.block][state.crit] === FAM.indexOf(f)).length) + '</figcaption></figure>').join('') + '</div>';
    }
    el.innerHTML = html;
    el.querySelectorAll('canvas[data-f]').forEach(drawSmall);
  }
  function drawSmall(cv) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, f = FAM.indexOf(cv.dataset.f);
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    for (const c of cells) {
      const x = (c.lon + 180) / 360 * W, y = (90 - c.lat) / 180 * H, s = Math.max(1.5, sizeOf(c) / 360 * W * 0.9);
      g.fillStyle = c.ice ? C.rule : c.blocks[state.block][state.crit] === f ? C.ink : c.blocks[state.block][state.crit] === 6 ? C.ink5 : C.s[0];
      g.fillRect(x - s / 2, y - s / 2, s, s);
    }
  }
  function claimClick(id) {
    const k = A.claims.find((q) => q.id === id); if (!k) return;
    claimOn = id;
    const fam = /weibull-rises/.test(id) ? 'weibull' : /gg-/.test(id) ? 'gengamma' : /ew-|japan-ew/.test(id) ? 'expweibull' : /monsoon/.test(id) ? 'weibull' : null;
    state.block = k.blocks[k.blocks.length - 1];
    if (fam) { state.mode = 'family'; state.fam = fam; state.crit = 'ad'; } else { state.mode = 'blocks'; state.T = /1000|japan/.test(id) ? 1000 : 100; }
    if (worker) { worker.terminate(); worker = null; run = null; }
    sel = null; controls(); refresh();
    if (map && map.getSource('box')) map.getSource('box').setData(boxGeo(k.box));
    if (k.box && k.box.lon) {
      const [w, e] = k.box.lon, E = e < w ? e + 360 : e;
      fly({ bounds: [[w, k.box.lat[0]], [E, k.box.lat[1]]] });           /* east past 180 across the antimeridian: the whole box */
    } else if (k.box && k.box.lat[0] > -90) fly({ center: [0, (k.box.lat[0] + k.box.lat[1]) / 2], zoom: 1.6 });
    else fly(GO[0][2]);
    document.querySelectorAll('.ra-claim').forEach((li) => li.classList.toggle('on', li.dataset.claim === id));
  }
  const claimFrom = (li) => { claimClick(li.dataset.claim); if (li.closest('#ra-claims')) $('ra-map').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  document.addEventListener('click', (e) => { const li = e.target.closest && e.target.closest('.ra-claim'); if (li) claimFrom(li); });
  document.addEventListener('keydown', (e) => { const li = e.target.closest && e.target.closest('.ra-claim'); if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); claimFrom(li); } });

  function select(c) {
    if (c === sel) return;                                          /* the same cell again: a run in progress goes on */
    sel = c;
    if (worker) { worker.terminate(); worker = null; run = null; }
    if (map && map.getLayer('sel')) map.setFilter('sel', ['==', ['get', 'i'], cells.indexOf(c)]);
    side();
  }
  const FS = { normal: 'normal', lognormal: 'lognormal', weibull: 'Weibull', expweibull: 'exp. Weib.', gengamma: 'gen. gamma', gumbel: 'Gumbel' };
  function blockRows(c) {
    const cell = (k) => (famOf(k) ? '<td class="b">' + esc(FS[famOf(k)]) + '</td>' : '<td class="r">REFUSED</td>');
    const lvl = (q, T) => '<td>' + (famOf(q.ad) && q['l' + T][1] !== null ? q['l' + T][1].toFixed(2) + ' m' : '—') + '</td>';
    const rows = CRIT.map((k) => '<tr><th>' + (k === 'chi2' ? 'χ²' : k === 'ad' ? 'A²' : k.toUpperCase()) + '</th>' + BLK.map((b) => cell(c.blocks[b][k])).join('') + '</tr>')
      .concat(['<tr><th>100-yr</th>' + BLK.map((b) => lvl(c.blocks[b], 100)).join('') + '</tr>', '<tr><th>1000-yr</th>' + BLK.map((b) => lvl(c.blocks[b], 1000)).join('') + '</tr>',
        '<tr><th>threshold</th>' + BLK.map((b) => cell(c.blocks[b].naive)).join('') + '</tr>']);
    return '<div class="tw"><table><thead><tr><th></th>' + BLK.map((b) => '<th>' + b + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }
  function cellPanel(el, c) {
    let h = '<h3>' + esc(place(c)) + '</h3><p class="n">' + (c.report ? 'the report\'s ' + esc(c.report) + ' node · ' : '') + ((c.sets & 2) ? '1° Brazilian lattice' : (c.sets & 1) ? '4° global lattice' : 'a report node') + '</p>';
    const back = () => { sel = null; if (map) map.setFilter('sel', ['==', ['get', 'i'], -1]); if (worker) { worker.terminate(); worker = null; run = null; } side(); };
    if (c.ice) {
      el.innerHTML = h + '<p>The hindcast\'s own sea-ice field reaches this node on ' + fmt(c.iceSteps) + ' three-hourly steps, in ' + fmt(c.iceMonths) + ' of the 384 months, at up to ' + Math.round(100 * c.iceMax) + '% cover' + (c.fillDays ? '; on ' + fmt(c.fillDays) + ' days the model writes no wave at all' : '') + '. Under ice the model damps the waves to millimetres rather than leaving a gap, so the series is partly the ice\'s: the cell is shown and not certified.</p><div class="ra-go-row"><button type="button" id="ra-back">← the claims</button></div>';
      $('ra-back').onclick = back;
      return;
    }
    h += '<div class="k">the choice, by criterion (the ledger)</div>' + blockRows(c);
    const b = c.blocks[state.block];
    h += '<p class="n">' + esc(BW[state.block]) + ': the generalized gamma ' + ['has a maximum inside the family', 'has a maximum beside its lognormal limit (α > 500)', 'peaks at its lognormal limit — proved', 'is refused'][b.gg] + '; the exponentiated Weibull ' + EWW[b.ew] + '; a threshold fitter would name ' + (famOf(b.naive) ? esc(FW[famOf(b.naive)]) : 'no family') + '. The largest day on record: ' + c.max.toFixed(2) + ' m.</p>';
    h += '<div class="k">certify it again, here</div><p>Fetch this cell\'s ' + fmt(A.days) + ' daily maxima from the public repository, check their sha256, and run the ledger\'s own code on them in this tab — six families, three blocks, about ten seconds. The result is compared with the ledger\'s record by sha256. The series itself downloads as CSV, ready for <a href="../return-level-check/">the return-level check</a>, which decides a fit someone printed for this place.</p>'
      + '<div class="ra-go-row"><button type="button" id="ra-cert"' + (SPEC.served ? '' : ' disabled') + '>certify this cell in my tab</button><button type="button" id="ra-dl" disabled>download the certificate</button><button type="button" id="ra-csv" disabled>the series (CSV)</button><button type="button" id="ra-back">← the claims</button></div>'
      + '<p class="n" id="ra-prog" aria-live="polite">' + (SPEC.served ? '' : 'The cell files are not yet served from a published commit.') + '</p><div id="ra-full"></div>';
    el.innerHTML = h;
    $('ra-back').onclick = back;
    if (SPEC.served) $('ra-cert').onclick = () => certifyCell(c);
    if (run && run.id === c.id) { $('ra-prog').textContent = run.text; if (worker) $('ra-cert').disabled = true; }   /* a run in progress, or how the last one ended */
    else if (lastCert && lastCert.id === c.id) showCert(c, lastCert);
  }
  /* ---- the cell, certified again in this tab ---- */
  async function digest(buf) { const d = await crypto.subtle.digest('SHA-256', buf); return Array.from(new Uint8Array(d)).map((x) => x.toString(16).padStart(2, '0')).join(''); }
  async function certifyCell(c) {
    if (worker) { worker.terminate(); worker = null; }
    const me = run = { id: c.id, text: '' };
    /* every message looks the panel up again: a block switch re-renders it, and the run's words must follow */
    const say = (t, done) => { me.text = t; if (run !== me) return; const p = $('ra-prog'), b = $('ra-cert'); if (sel === c && p) p.textContent = t; if (sel === c && b) b.disabled = !done; };
    say('fetching the daily maxima …');
    let buf;
    try {
      const r = await fetch(SPEC.served + 'cells/' + c.id + '.i16');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      buf = await r.arrayBuffer();
    } catch (e) { say('REFUSED: the cell file could not be fetched (' + e.message + ')', true); return; }
    const h = await digest(buf);
    if (run !== me) return;
    if (h !== c.sha) { say('REFUSED: the bytes served are not the pinned bytes (sha256 ' + h.slice(0, 12) + '…)', true); return; }
    say('sha256 ' + h.slice(0, 12) + '… matches; certifying the daily maxima …');
    const csv = (() => { const v = new Int16Array(buf.slice(0)), d0 = Date.parse(A.first + 'T00:00:00Z'), L = ['date,hs_daily_max_m']; for (let i = 0; i < v.length; i++) L.push(new Date(d0 + i * 86400000).toISOString().slice(0, 10) + ',' + (v[i] / 500).toFixed(3)); return L.join('\n') + '\n'; })();
    const w = worker = new Worker(WURL), t0 = Date.now();
    w.onmessage = async (ev) => {
      if (w !== worker || run !== me) return;
      const m = ev.data;
      if (m.kind === 'progress') { const k = BLK.indexOf(m.block); say(BW[m.block] + ' certified' + (k < 2 ? '; certifying the ' + BW[BLK[k + 1]] + ' …' : '')); return; }
      w.terminate(); worker = null;
      if (m.kind === 'error') { say('REFUSED: ' + m.message, true); return; }
      const rec = m.record, json = JSON.stringify(rec);
      const rh = (await digest(new TextEncoder().encode(json))).slice(0, 32);
      /* the same decisions: every criterion's choice, the threshold fitter's, and both hard families' states, block by block */
      const sameDecisions = BLK.every((b, j) => CRIT.every((k) => (rec.blocks[b].rank[k] === 'R' ? 6 : FAM.indexOf(rec.blocks[b].rank[k])) === c.blocks[b][k])
        && (rec.blocks[b].naive === 'R' ? 6 : FAM.indexOf(rec.blocks[b].naive)) === c.blocks[b].naive && m.codes && m.codes[j].gg === c.blocks[b].gg && m.codes[j].ew === c.blocks[b].ew);
      lastCert = { id: c.id, rec, plot: m.plot || {}, rh, same: rh === c.recSha, sameDecisions, secs: (Date.now() - t0) / 1000, csv };
      run = null;
      if (sel === c) showCert(c, lastCert);
    };
    w.onerror = (e) => { if (w !== worker) return; worker = null; say('The run failed in the worker: ' + ((e && e.message) || 'no message'), true); };
    w.postMessage({ id: c.id, raw: buf, first: A.first }, [buf]);
  }
  /* a finished certification, shown (again) in the cell's panel: the verdict against the ledger, the return-level plot of the block in view, every fit */
  function showCert(c, R) {
    const prog = $('ra-prog'), rec = R.rec;
    if (!prog) return;
    prog.innerHTML = 'certified here in ' + R.secs.toFixed(1) + ' s. ' + (R.same ? '<span class="ra-ok">Identical to the ledger\'s record</span> (sha256 ' + R.rh.slice(0, 12) + '…).' : R.sameDecisions ? 'Every choice and every family\'s state is the ledger\'s; the enclosures differ in their last printed digits — this browser\'s own Math.exp and Math.log steered the floating-point search to a candidate a few bits away, and both boxes are certificates.' : '<b>Not the ledger\'s decisions</b> — report it: this tab and the ledger disagree.');
    const P = R.plot[state.block], B = rec.blocks[state.block];
    const drawn = P ? FAM.filter((f) => P.fam[f] && P.fam[f].length > 1) : [];
    const off = FAM.filter((f) => !drawn.includes(f));
    const best = B.rank.ad, dll = P && best !== 'R' && P.dll && P.dll[best];
    /* the upper end of the enclosure, rounded up to the centimetre: "above X with probability at most 10%" is then true of the fitted law */
    const up = dll ? Math.ceil(dll[1] * 100 - 1e-9) / 100 : null;
    const life = dll ? '<p class="ra-life">Under the ' + esc(FW[best]) + ' decided for the ' + esc(BW[state.block]) + ', a structure standing here for 25 years meets a ' + esc(state.block === 'daily' ? 'day' : state.block === 'weekly' ? 'week' : 'month') + '\'s maximum above <b>' + up.toFixed(2) + ' m</b> with probability at most 10% — the design-life level of Rootzén and Katz, here the ' + Math.round(P.hours / (8766 * -Math.expm1(Math.log(0.9) * P.hours / (8766 * 25)))) + '-year return level (' + (dll[1] - dll[0] < 5e-4 ? 'its enclosure narrower than a millimetre' : 'enclosed in [' + dll[0].toFixed(3) + ', ' + dll[1].toFixed(3) + '] m') + '). It is the fitted law\'s number: the fit\'s sampling error is not in it, successive ' + esc(BW[state.block]) + ' are taken as independent, and the climate as unchanging.</p>' : '';
    $('ra-full').innerHTML = life + (P ? '<div class="k">return levels · ' + esc(BW[state.block]) + '</div><canvas class="ra-rl" id="ra-rl" role="img" aria-label="Return level against return period for each certified family, with the block maxima and the largest day on record"></canvas>'
      + '<p class="n">Each curve is a certified fit\'s quantile F⁻¹(1 − b/(8766 T)), b the block in hours and T the return period in years, every point an enclosure narrower than the line; ' + (B.rank.ad !== 'R' ? 'the family Anderson–Darling decides, ' + esc(FW[B.rank.ad]) + ', in ink' : 'no family decided') + '. Dots: the ' + fmt(P.n) + ' ' + esc(BW[state.block]) + ' at their plotting positions, T = (n + 1)/i blocks; dashed: the largest day on record.' + (off.length ? ' Not drawn: ' + off.map((f) => esc(FW[f])).join(', ') + ' (no certified fit).' : '') + '</p>' : '')
      + fullTable(rec);
    if (P) drawRL($('ra-rl'), P, B, c, drawn);
    const dl = $('ra-dl'), sv = $('ra-csv'), btn = $('ra-cert');
    if (btn) btn.disabled = false;
    sv.disabled = false; dl.disabled = false;
    sv.onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([R.csv], { type: 'text/csv' })); a.download = 'ww3-daily-max-' + c.id + '.csv'; document.body.appendChild(a); a.click(); a.remove(); };
    dl.onclick = () => {
      const cert = { what: 'A return-level atlas cell, certified in the reader\'s browser by /instruments/return-level-atlas/: the daily maxima of the Ifremer WAVEWATCH III hindcast GLOBMULTI_ERA5_GLOBCUR_01 at this node (CC BY-SA 4.0), six families fitted by maximum likelihood on the daily, weekly and monthly maxima, each fit a box proved to hold the likelihood\'s one maximum or a refusal with its reason, the criteria and levels as enclosures, each choice DECIDED or REFUSED (instruments/hseva/atlas.js).',
        cell: { id: c.id, lat: c.lat, lon: c.lon, data: SPEC.served + 'cells/' + c.id + '.i16', sha256: c.sha, days: A.days, first: A.first },
        code: SPEC.modules, record: rec, ledgerRecordSha256: c.recSha, identical: R.same, generated: new Date().toISOString() };
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(cert, null, 1)], { type: 'application/json' })); a.download = 'atlas-cell-' + c.id + '.json'; document.body.appendChild(a); a.click(); a.remove();
    };
  }
  /* the return-level plot: log return period (years) across, Hs up; the decided family in ink, the others quiet, the maxima as dots, the record dashed */
  function drawRL(cv, P, B, c, drawn) {
    const dpr = window.devicePixelRatio || 1, W = Math.max(260, cv.clientWidth || 340), H = Math.round(W * 0.7);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px';
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mono = tok('--font-mono') || 'monospace', best = B.rank.ad;
    const m = { l: 30, r: 64, t: 10, b: 22 };
    const x0 = Math.log10(Math.min(P.pts.length ? P.pts[P.pts.length - 1][0] : 1, 2 * P.hours / 8766)), x1 = 4;
    const at100 = (f) => { const L = P.fam[f]; if (!L) return null; let q = null; for (const p of L) if (p[0] <= 100) q = p; return q ? q[2] : null; };
    let top = c.max * 1.5;
    if (best !== 'R' && at100(best)) top = Math.max(top, Math.min(at100(best) * 1.12, c.max * 4));
    const step = [0.5, 1, 2, 5, 10, 20, 50, 100].find((s) => top / s <= 6) || 200, yMax = Math.ceil(top / step) * step;
    const X = (T) => m.l + (Math.log10(T) - x0) / (x1 - x0) * (W - m.l - m.r), Y = (v) => H - m.b - v / yMax * (H - m.t - m.b);
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    g.font = '10px ' + mono; g.lineWidth = 1;
    for (let d = Math.ceil(x0); d <= x1; d++) {
      const x = X(Math.pow(10, d)); g.strokeStyle = d === 2 || d === 3 ? C.rule : C.ruleSoft; g.beginPath(); g.moveTo(x, m.t); g.lineTo(x, H - m.b); g.stroke();
      g.fillStyle = C.ink4; g.textAlign = 'center'; g.fillText(d === 4 ? '10⁴' : d >= 0 ? String(Math.pow(10, d)) : '10' + (d === -1 ? '⁻¹' : d === -2 ? '⁻²' : '⁻³'), x, H - 7);
    }
    g.textAlign = 'right';
    for (let v = 0; v <= yMax + 1e-9; v += step) { const y = Y(v); g.strokeStyle = C.ruleSoft; g.beginPath(); g.moveTo(m.l, y); g.lineTo(W - m.r, y); g.stroke(); g.fillStyle = C.ink4; g.fillText(String(v), m.l - 4, y + 3); }
    g.textAlign = 'left'; g.fillStyle = C.ink4; g.fillText('years', W - m.r + 4, H - 7); g.fillText('m', 4, m.t + 8);
    g.save(); g.beginPath(); g.rect(m.l, m.t, W - m.l - m.r, H - m.t - m.b); g.clip();
    g.strokeStyle = C.ink3; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(m.l, Y(c.max)); g.lineTo(W - m.r, Y(c.max)); g.stroke(); g.setLineDash([]);   /* design/grammar.js GUIDE: a ruler, not a claim */
    g.fillStyle = C.ink3; for (const p of P.pts) { g.beginPath(); g.arc(X(p[0]), Y(p[1]), 1.4, 0, 2 * Math.PI); g.fill(); }
    const ends = [];
    for (const f of drawn.filter((x) => x !== best).concat(drawn.includes(best) ? [best] : [])) {
      const L = P.fam[f], main = f === best;
      g.strokeStyle = main ? C.ink : C.ink4; g.lineWidth = main ? 2.2 : 1; g.beginPath();
      L.forEach((p, k) => { const x = X(p[0]), y = Y((p[1] + p[2]) / 2); if (k) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
      let e = L[L.length - 1]; for (const p of L) if ((p[1] + p[2]) / 2 > yMax) { e = p; break; }
      ends.push({ f, y: Math.max(m.t + 6, Math.min(H - m.b - 2, Y(Math.min(yMax, (e[1] + e[2]) / 2)))), main });
    }
    g.restore();
    ends.sort((a, b) => a.y - b.y);
    for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 11) ends[k].y = ends[k - 1].y + 11;
    g.textAlign = 'left'; g.font = '10px ' + mono;
    for (const e of ends) { g.fillStyle = e.main ? C.ink : C.ink4; g.fillText(FS[e.f], W - m.r + 4, e.y + 3); }
    g.fillStyle = C.ink3; g.fillText('record', W - m.r + 4, Math.min(H - m.b - 2, Math.max(m.t + 8, Y(c.max) + 3)) + (ends.some((e) => Math.abs(e.y - Y(c.max)) < 10) ? 11 : 0));
  }
  function fullTable(rec) {
    const g = (a, d) => (a && a.length === 2 ? Number(a[1]).toPrecision(d || 5) : '—');
    return BLK.map((b) => {
      const B = rec.blocks[b];
      return '<div class="k">' + esc(BW[b]) + ' · ' + fmt(B.n) + ' values</div><div class="tw"><table><thead><tr><th>family</th><th>A²</th><th>KS</th><th>χ²</th><th>100-yr</th><th>1000-yr</th></tr></thead><tbody>'
        + FAM.map((f) => {
          const F = B.fits[f];
          if (!F.c) return '<tr><td>' + esc(FW[f]) + '</td><td class="r" colspan="5">' + (F.e ? 'peaks at its lognormal limit (proved, k = ' + F.k + ', Q ≤ ' + F.q1 + ')' : F.s ? (/passed k = 0\.001/.test(F.w || '') ? 'past α = 10⁴, and toward k → 0 in its Gumbel coordinates: REFUSED' : 'past α = 10⁴, not certified in its Gumbel coordinates: REFUSED — ' + esc(F.w || '')) : 'REFUSED — ' + esc(F.w || '')) + '</td></tr>';
          const best = B.rank.ad === f;
          return '<tr><td' + (best ? ' class="b"' : '') + '>' + esc(FW[f]) + (F.p ? ' ᴾ' : '') + (F.g ? ' ᴳ' : '') + '</td><td>' + g(F.ad) + '</td><td>' + g(F.ks, 4) + '</td><td>' + (Array.isArray(F.chi2) ? g(F.chi2, 4) : F.chi2 === 'U' ? 'n/d' : 'REF') + '</td><td>' + (F.l100 ? F.l100[1].toFixed(2) : '—') + '</td><td>' + (F.l1000 ? F.l1000[1].toFixed(2) : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }).join('') + '<p class="n">Each number is the upper end of its enclosure; ᴾ: certified in Prentice\'s coordinates; ᴳ: certified in the Gumbel coordinates (k, θ = λ^k, β = θ ln α). The download carries every enclosure.</p>';
  }

  /* ---- start ---- */
  Promise.all([fetch('atlas.json').then((r) => r.json()), fetch('land.json').then((r) => r.json())]).then(([a, land]) => {
    A = a; cells = a.cells.map(decode); cells.forEach((c) => byId.set(c.id, c));
    controls(); legend(); side();
    if (typeof maplibregl === 'undefined') { $('ra-map').innerHTML = '<p class="n">The map could not load here; the claims and the cells are listed beside it.</p>'; return; }
    try { initMap(land); } catch (e) { $('ra-map').innerHTML = '<p class="n">This browser could not draw the map (' + esc(e.message) + '); the claims below still stand.</p>'; }
    /* a handle for the page's own gates (tools/check-*.js drive it in Chrome); it changes nothing */
    window.__atlas = { map: () => map, select: (id) => select(byId.get(id)), state, cells: () => cells.length };
  }).catch((e) => { $('ra-side').textContent = 'The atlas data could not be read: ' + e.message; });
})();
