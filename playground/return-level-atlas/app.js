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
  const state = { mode: 'wave', block: 'daily', crit: 'ad', T: 100, fam: 'expweibull', tab: 'claims' };
  let A = null, cells = [], byId = new Map(), map = null, sel = null, worker = null, hover = null, claimOn = null, lastCert = null, run = null;

  /* ---- the ledger's compact view ---- */
  function decode(r) {
    if (r[4] === 1) return { id: r[0], lat: r[1], lon: r[2], sets: r[3], ice: true, report: r[5], iceSteps: r[6], iceMonths: r[7], iceMax: r[8], fillDays: r[9], fillSteps: r[10], native: nativeOf(r[5]) };
    const blocks = {};
    BLK.forEach((b, k) => { const q = r[9 + k]; blocks[b] = { ad: q[0], ks: q[1], mse: q[2], chi2: q[3], naive: q[4], gg: q[5], ew: q[6], l100: [q[7], q[8]], l1000: [q[9], q[10]], below: q[11] }; });
    return { id: r[0], lat: r[1], lon: r[2], sets: r[3], ice: false, report: r[5], sha: r[6], recSha: r[7], max: r[8], blocks, native: nativeOf(r[5]) };
  }
  /* a report node's unfiltered 3-hourly block: the report ledger's record (build.js nativeOf), shown beside the atlas's own */
  function nativeOf(name) {
    const q = name && A.native && A.native.nodes[name];
    return q ? { n: q[0], max: q[1], hours: q[2], ad: q[3], ks: q[4], mse: q[5], chi2: q[6], l100: [q[7], q[8]], l1000: [q[9], q[10]], gg: q[11], ew: q[12] } : null;
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
      if (drawing || Date.now() - drew < 500) return;                /* the release of a drawn rectangle is not a choice of cell */
      const f = map.queryRenderedFeatures(e.point, { layers })[0];
      if (f) select(cells[f.properties.i]);
    });
  }
  function refresh() {
    if (!map || !map.getSource('cells')) return;
    hover = null; $('ra-tip').style.display = 'none'; if (map.getLayer('hov')) map.setFilter('hov', ['==', ['get', 'i'], -1]);   /* the words under the pointer belong to the old view */
    map.getSource('cells').setData(features());
    legend();
    panel();
    writeHash();
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
    const ms = $('ra-mode-sel');                                    /* the same eight views as one control, where eight buttons will not fit */
    if (!ms.options.length) { ms.innerHTML = MODES.map(([v, t]) => '<option value="' + v + '">' + esc(t) + '</option>').join(''); ms.onchange = () => { state.mode = ms.value; controls(); refresh(); }; }
    ms.value = state.mode;
    seg($('ra-block'), BLK.map((b) => [b, b]), state.block, (v) => { state.block = v; controls(); refresh(); if (sel) panel(); });
    const sub = $('ra-sub'), n = narrow(), kind = state.mode === 'family' ? 'family' + (n ? '-n' : '') : ['wave', 'blocks', 'record'].includes(state.mode) ? 'T' + (n ? '-n' : '') : '';
    if (sub.dataset.kind !== kind) { sub.dataset.kind = kind; sub.innerHTML = ''; }
    if (kind === 'family') {                                          /* six families and four criteria: buttons where they fit, selects on a phone */
      if (!$('ra-fam')) sub.innerHTML = '<div class="ra-seg" id="ra-fam" role="radiogroup" aria-label="family"></div><div class="ra-seg" id="ra-crit" role="radiogroup" aria-label="criterion"></div>';
      seg($('ra-fam'), FAM.map((f) => [f, FW[f]]), state.fam, (v) => { state.fam = v; controls(); refresh(); });
      seg($('ra-crit'), CRIT.map((k) => [k, k === 'chi2' ? 'χ²' : k.toUpperCase()]), state.crit, (v) => { state.crit = v; controls(); refresh(); });
    } else if (kind === 'family-n') {
      if (!$('ra-fam-s')) {
        sub.innerHTML = '<select id="ra-fam-s" class="ra-select" aria-label="family">' + FAM.map((f) => '<option value="' + f + '">' + esc(FW[f]) + '</option>').join('') + '</select><select id="ra-crit-s" class="ra-select" aria-label="criterion">' + CRIT.map((k) => '<option value="' + k + '">' + (k === 'chi2' ? 'χ²' : k.toUpperCase()) + '</option>').join('') + '</select>';
        $('ra-fam-s').onchange = (e) => { state.fam = e.target.value; controls(); refresh(); };
        $('ra-crit-s').onchange = (e) => { state.crit = e.target.value; controls(); refresh(); };
      }
      $('ra-fam-s').value = state.fam; $('ra-crit-s').value = state.crit;
    } else if (kind) {
      if (!$('ra-T')) sub.innerHTML = '<div class="ra-seg" id="ra-T" role="radiogroup" aria-label="return period"></div>';
      seg($('ra-T'), [['100', n ? '100 yr' : '100 years'], ['1000', n ? '1000 yr' : '1000 years']], String(state.T), (v) => { state.T = Number(v); controls(); refresh(); });
    }
    const go = $('ra-go');
    if (!go.options.length) {
      go.innerHTML = GO.map(([v, t]) => '<option value="' + v + '">' + esc(t) + '</option>').join('');
      go.setAttribute('aria-label', 'go to a region');
      go.onchange = () => { if (sheetMode()) setSheet('peek'); const g = GO.find((q) => q[0] === go.value)[2]; fly(go.value === 'globe' ? { center: g.center, zoom: globeZoom() } : g); };
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
        find.blur();
      };
    }
  }
  /* the globe is centred in what the controls, the legend and (on a phone) the sheet leave of the window */
  function pad() {
    const m = $('ra-map').getBoundingClientRect();
    if (!m.height) return { top: 0, bottom: 0, left: 0, right: 0 };
    const top = Math.max(0, $('ra-ctl').getBoundingClientRect().bottom - m.top);
    let floor = m.bottom;
    const lg = $('ra-legend');
    if (lg.offsetHeight && getComputedStyle(lg).visibility !== 'hidden') floor = Math.min(floor, lg.getBoundingClientRect().top);
    if (sheetMode()) floor = Math.min(floor, $('ra-panel').getBoundingClientRect().top);
    return { top: Math.round(top + 12), bottom: Math.round(Math.max(0, m.bottom - floor) + 12), left: 12, right: 12 };
  }
  /* the zoom at which the whole globe fills that room: its radius measured on screen (a point 80° from the centre sits
     at R sin 80°), so the answer holds for any window and any projection detail */
  function globeZoom() {
    if (!map) return 1.5;
    const m = $('ra-map').getBoundingClientRect(), p = pad();
    const room = Math.max(60, Math.min(m.width - p.left - p.right, m.height - p.top - p.bottom) / 2 * 0.96);
    const c = map.getCenter(), a = map.project(c), q = map.project([c.lng, c.lat > 0 ? c.lat - 80 : c.lat + 80]);
    const r = Math.hypot(q.x - a.x, q.y - a.y) / Math.sin(80 * Math.PI / 180);
    return r > 1 ? Math.min(3, map.getZoom() + Math.log2(room / r)) : map.getZoom();
  }
  function fly(v) {
    if (!map) return;
    if (v.bounds) map.fitBounds(v.bounds, { padding: pad(), duration: 1400 });
    else map.flyTo({ center: v.center, zoom: v.zoom, padding: pad(), duration: 1400 });
  }
  function legend() {
    const n = narrow(), L = (long, short) => (n ? short : long);            /* on a phone every line of the key is short */
    const sw = (col, t, cls) => '<span class="ra-key"><i class="ra-sw' + (cls ? ' ' + cls : '') + '" style="--sw:' + col + '"></i>' + esc(t) + '</span>';
    const HATCH = { wave: L('REFUSED — no family, or no level, decided', 'REFUSED'), family: L('REFUSED — ' + CW[state.crit] + ' decides no family', 'REFUSED'), blocks: L('REFUSED — a block without a decided level', 'REFUSED'), record: L('REFUSED — no family, or no level, decided', 'REFUSED'), criteria: L('REFUSED — a criterion decides no family', 'REFUSED'), gg: L('the generalized gamma REFUSED', 'REFUSED'), naive: 'REFUSED' };
    let hatch = HATCH[state.mode];
    if (state.mode === 'ew') {                                     /* the refusals in view, counted from the ledger's codes */
      const k = [0, 0]; for (const c of cells) if (!c.ice) { const e = c.blocks[state.block].ew; if (e === 1) k[0]++; else if (e === 2 || e === 4) k[1]++; }
      hatch = L('REFUSED — toward k → 0 at ' + fmt(k[0]) + ' cells, otherwise at ' + fmt(k[1]), 'REFUSED (' + fmt(k[0]) + ' toward k → 0)');
    }
    const base = sw(C.sunk, hatch, 'hatch') + sw(C.sunk, L('sea ice — not certified', 'sea ice'), 'ice');
    const rampH = (br, unit) => '<div class="ra-ramp">' + C.s.map((col, k) => '<div class="ra-rampcol"><i style="--sw:' + col + '"></i><span>' + (k === 0 ? '<' + br[1] : k === 4 ? '≥' + br[4] : br[k] + '–' + br[k + 1]) + unit + '</span></div>').join('') + '</div>';
    const B = BW[state.block], b = state.block;
    let t = '', body = '';
    switch (state.mode) {
      case 'wave': t = L('the ' + state.T + '-year Hs of the family Anderson–Darling decides · ' + B, state.T + '-year Hs · ' + b); body = rampH(WAVE_BR, ' m'); break;
      case 'family': t = L(FW[state.fam] + ', where ' + CW[state.crit] + ' decides it · ' + B, FW[state.fam] + ' · ' + (state.crit === 'chi2' ? 'χ²' : state.crit.toUpperCase()) + ' · ' + b); body = sw(C.ink, L(FW[state.fam] + ' decided', FW[state.fam])) + sw(C.s[0], L('another family decided', 'another family')); break;
      case 'blocks': t = L('how far the ' + state.T + '-year Hs moves across daily, weekly and monthly maxima (largest ÷ smallest)', state.T + '-year Hs across the blocks · largest ÷ smallest'); body = rampH(BLOCK_BR, '×'); break;
      case 'record': t = L('the ' + state.T + '-year Hs ÷ the largest day in 1993–2024 · ' + B + ' · outlined: below the record', state.T + '-year Hs ÷ the record · ' + b + ' · outlined: below'); body = rampH(REC_BR, '×'); break;
      case 'criteria': t = L('do Anderson–Darling, KS, MSE and χ² decide the same family? · ' + B, 'do the four criteria agree? · ' + b); body = sw(C.s[1], L('they agree', 'agree')) + sw(C.ink, L('they split', 'split')); break;
      case 'gg': t = L('the generalized gamma · ' + B, 'generalized gamma · ' + b); body = sw(C.s[2], L('a maximum inside the family', 'inside')) + sw(C.ink, L('a maximum beside its lognormal limit (α > 500)', 'beside the limit')) + sw(C.s[0], L('peaks at the lognormal limit — proved', 'at the limit, proved')); break;
      case 'ew': t = L('the exponentiated Weibull · ' + B, 'exp. Weibull · ' + b); body = sw(C.s[2], L('certified in (α, k, λ)', 'in (α, k, λ)')) + sw(C.ink, L('certified in its Gumbel coordinates — α runs large', 'in Gumbel coordinates')); break;
      case 'naive': t = L('a fitter that stops at α = 500 or α = 10⁴ and calls it the limit, against the certificate · ' + B, 'a threshold fitter vs the certificate · ' + b); body = sw(C.ink, L('names a different family', 'differs')) + sw(C.s[0], L('agrees', 'agrees')); break;
    }
    /* the title is set in capitals: a Greek letter keeps its own case, or α would read as A */
    $('ra-legend').innerHTML = '<div class="t">' + esc(t).replace(/[α-ωχ]/g, (g) => '<span class="ra-nt">' + g + '</span>') + '</div><div class="ra-keys">' + body + base + '</div>';
  }

  /* ---- the panel: three tabs beside the globe, a sheet over it on a phone ---- */
  const narrow = () => window.matchMedia('(max-width: 899px)').matches;          /* compact controls and a short key */
  /* the panel is a sheet over the globe on a narrow screen held upright; a phone held sideways keeps it beside the globe */
  const sheetMode = () => narrow() && !window.matchMedia('(max-height: 540px) and (orientation: landscape)').matches;
  const TABS = ['claims', 'cell', 'method'];
  function setTab(t, focus) {
    state.tab = t;
    for (const x of TABS) {
      const b = $('ra-t-' + x), on = x === t;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      $('ra-p-' + x).hidden = !on;
    }
    if (focus) $('ra-t-' + t).focus();
    $('ra-body').scrollTop = 0;
    writeHash();
    if (sheetMode() && $('ra-app').dataset.sheet === 'peek') setSheet('half');
    panel();
  }
  /* the sheet's three heights: a peek (title and tabs), half the window, and nearly all of it */
  function setSheet(h) {
    const app = $('ra-app');
    if (app.dataset.sheet === h) return;
    app.dataset.sheet = h;
    $('ra-grip').setAttribute('aria-label', h === 'full' ? 'Show less of the panel' : 'Show more of the panel');
    later(() => { if (map) map.easeTo({ padding: pad(), duration: 320 }); });
  }
  /* the wide screen's panel folds away and the globe takes the whole window */
  function setPanel(open) {
    const app = $('ra-app');
    app.dataset.panel = open ? 'open' : 'closed';
    for (const id of ['ra-close', 'ra-reopen']) $(id).setAttribute('aria-expanded', String(open));
    later(() => { if (map) { map.resize(); map.easeTo({ padding: pad(), duration: 0 }); } });
    (open ? $('ra-close') : $('ra-reopen')).focus();
  }
  /* after a transition: the panel's and the sheet's are --dur-med */
  const later = (f) => setTimeout(f, 320);
  function panel() {
    document.querySelectorAll('.ra-claim').forEach((li) => li.classList.toggle('on', !!li.dataset.claim && li.dataset.claim === claimOn));
    if (state.tab === 'claims') mineForm();
    const sm = $('ra-sm');
    if (state.mode === 'family' && state.tab === 'claims') {
      sm.innerHTML = '<div class="k">where each family is decided · ' + esc(CW[state.crit]) + ' · ' + esc(BW[state.block]) + '</div><div class="ra-sm">' + FAM.map((f) => '<figure><canvas width="360" height="180" data-f="' + f + '"></canvas><figcaption>' + esc(FW[f]) + ' · ' + fmt(cells.filter((c) => !c.ice && c.blocks[state.block][state.crit] === FAM.indexOf(f)).length) + '</figcaption></figure>').join('') + '</div>';
      sm.querySelectorAll('canvas[data-f]').forEach(drawSmall);
    } else sm.innerHTML = '';
    if (state.tab === 'cell') {
      const box = $('ra-cellbox');
      if (sel) cellPanel(box, sel);
      else box.innerHTML = '<p class="n">Choose a cell on the globe, or type a latitude and longitude: its choices open here, and it can be certified again in this tab from the pinned data, with the ledger\'s own code.</p>';
    }
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
    claimOn = id; MY.on = false;
    const fam = /weibull-rises/.test(id) ? 'weibull' : /gg-/.test(id) ? 'gengamma' : /ew-|japan-ew/.test(id) ? 'expweibull' : /monsoon/.test(id) ? 'weibull' : null;
    state.block = k.blocks[k.blocks.length - 1];
    if (fam) { state.mode = 'family'; state.fam = fam; state.crit = 'ad'; } else { state.mode = 'blocks'; state.T = /1000|japan/.test(id) ? 1000 : 100; }
    if (worker) { worker.terminate(); worker = null; run = null; }
    sel = null; if (map) map.setFilter('sel', ['==', ['get', 'i'], -1]);
    if (sheetMode()) setSheet('peek');                              /* on a phone the claim is read on the globe: the sheet steps aside */
    controls(); refresh();
    if (map && map.getSource('box')) map.getSource('box').setData(boxGeo(k.box));
    if (k.box && k.box.lon) {
      const [w, e] = k.box.lon, E = e < w ? e + 360 : e;
      fly({ bounds: [[w, k.box.lat[0]], [E, k.box.lat[1]]] });           /* east past 180 across the antimeridian: the whole box */
    } else if (k.box && k.box.lat[0] > -90) fly({ center: [0, (k.box.lat[0] + k.box.lat[1]) / 2], zoom: 1.6 });
    else fly(GO[0][2]);
    panel();
    writeHash();
  }
  const claimFrom = (li) => claimClick(li.dataset.claim);
  document.addEventListener('click', (e) => { const li = e.target.closest && e.target.closest('.ra-claim'); if (li) claimFrom(li); });
  document.addEventListener('keydown', (e) => { const li = e.target.closest && e.target.closest('.ra-claim'); if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); claimFrom(li); } });

  function select(c) {
    if (c !== sel) {                                                /* the same cell again: a run in progress goes on */
      sel = c;
      if (worker) { worker.terminate(); worker = null; run = null; }
      if (map && map.getLayer('sel')) map.setFilter('sel', ['==', ['get', 'i'], cells.indexOf(c)]);
    }
    loadData(c);
    if (state.tab !== 'cell') setTab('cell'); else panel();
    if (sheetMode() && $('ra-app').dataset.sheet === 'peek') setSheet('half');
    writeHash();
  }
  const FS = { normal: 'normal', lognormal: 'lognormal', weibull: 'Weibull', expweibull: 'exp. Weib.', gengamma: 'gen. gamma', gumbel: 'Gumbel' };
  /* the choice by criterion, block by block; at a report node the report's 3-hourly block stands first, its header the
     link to the report (an ice node has that column alone: the atlas certifies no block there) */
  const REPORT = '/reports/return-levels.html';
  function blockRows(c) {
    const cols = (c.native ? [['3-hourly', c.native]] : []).concat(c.ice ? [] : BLK.map((b) => [b, c.blocks[b]]));
    const cell = (k) => (famOf(k) ? '<td class="b">' + esc(FS[famOf(k)]) + '</td>' : '<td class="r">REFUSED</td>');
    const lvl = (q, T) => '<td>' + (famOf(q.ad) && q['l' + T][1] !== null ? q['l' + T][1].toFixed(2) + ' m' : '—') + '</td>';
    const rows = CRIT.map((k) => '<tr><th>' + (k === 'chi2' ? 'χ²' : k === 'ad' ? 'A²' : k.toUpperCase()) + '</th>' + cols.map(([, q]) => cell(q[k])).join('') + '</tr>')
      .concat(['<tr><th>100-yr</th>' + cols.map(([, q]) => lvl(q, 100)).join('') + '</tr>', '<tr><th>1000-yr</th>' + cols.map(([, q]) => lvl(q, 1000)).join('') + '</tr>']);
    if (!c.ice) rows.push('<tr><th>threshold</th>' + cols.map(([b, q]) => (b === '3-hourly' ? '<td class="r">—</td>' : cell(q.naive))).join('') + '</tr>');
    return '<div class="tw"><table><thead><tr><th></th>' + cols.map(([b]) => '<th>' + (b === '3-hourly' ? '<a href="' + REPORT + '">3-hourly</a>' : b) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }
  /* what the 3-hourly column is, in words: whose record, how many values, the two hard families there */
  function nativeWords(c) {
    const q = c.native;
    return (c.ice ? 'The column is' : '3-hourly:') + ' the unfiltered series, ' + fmt(q.n) + ' values to ' + q.max.toFixed(2) + ' m, as <a href="' + REPORT + '">the return-level report</a> certifies it (§5): that ledger\'s record, not certified again in this tab. There the generalized gamma '
      + ['has a maximum inside the family', 'has a maximum beside its lognormal limit (α > 500)', 'peaks at its lognormal limit (proved)', 'is refused'][q.gg] + ', and the exponentiated Weibull ' + EWW[q.ew] + (c.ice ? '.' : '; the report runs no threshold fitter.');
  }
  function cellPanel(el, c) {
    let h = '<div class="ra-celltitle"><h3>' + esc(place(c)) + '</h3><button type="button" class="ra-linkbtn" id="ra-link-cell">link to this cell</button></div><p class="n">' + [c.report ? 'the report\'s ' + esc(c.report) + ' node' : '', (c.sets & 2) ? '1° Brazilian lattice' : (c.sets & 1) ? '4° global lattice' : ''].filter(Boolean).join(' · ') + '</p>';
    const back = () => { sel = null; if (map) map.setFilter('sel', ['==', ['get', 'i'], -1]); if (worker) { worker.terminate(); worker = null; run = null; } setTab('claims'); };
    if (c.ice) {
      el.innerHTML = h + '<p>The hindcast\'s own sea-ice field reaches this node on ' + fmt(c.iceSteps) + ' three-hourly steps, in ' + fmt(c.iceMonths) + ' of the 384 months, at up to ' + Math.round(100 * c.iceMax) + '% cover' + (c.fillDays ? '; on ' + fmt(c.fillDays) + ' days the model writes no wave at all' : '') + '. Under ice the model damps the waves to millimetres rather than leaving a gap, so the series is partly the ice\'s: the cell is shown and not certified.</p>'
        + (c.native ? '<div class="k">the report\'s 3-hourly block</div>' + blockRows(c) + '<p class="n">The return-level report certifies this node\'s series as the model gives it, the ice\'s millimetres included; the atlas, which certifies only water the ice never touches, does not. ' + nativeWords(c) + '</p>' : '')
        + '<div class="ra-go-row"><button type="button" id="ra-back">← the claims</button></div>';
      $('ra-back').onclick = back; $('ra-link-cell').onclick = (e) => copyLink(e.target);
      return;
    }
    /* the action first, its result right under it; the cell's own data drawn as soon as it arrives; the ledger's table and the words after */
    h += '<div class="ra-go-row"><button type="button" id="ra-cert"' + (SPEC.served ? '' : ' disabled') + '>certify this cell in my tab</button><button type="button" id="ra-csv" disabled>the series (CSV)</button><button type="button" id="ra-dl" disabled>the certificate</button></div>'
      + '<p class="n" id="ra-prog" aria-live="polite">' + (SPEC.served ? '' : 'The cell files are not yet served from a published commit.') + '</p><div id="ra-life"></div><div id="ra-charts"></div><div id="ra-full"></div>';
    h += '<div class="k">the choice, by criterion (the ledger' + (c.native ? 's' : '') + ')</div>' + blockRows(c) + (c.native ? '<p class="n">' + nativeWords(c) + '</p>' : '');
    const b = c.blocks[state.block];
    h += '<p class="n">' + esc(BW[state.block]) + ': the generalized gamma ' + ['has a maximum inside the family', 'has a maximum beside its lognormal limit (α > 500)', 'peaks at its lognormal limit — proved', 'is refused'][b.gg] + '; the exponentiated Weibull ' + EWW[b.ew] + '; a threshold fitter would name ' + (famOf(b.naive) ? esc(FW[famOf(b.naive)]) : 'no family') + '. The largest day on record: ' + c.max.toFixed(2) + ' m.</p>';
    h += '<div class="k">what certifying here does</div><p>The cell\'s ' + fmt(A.days) + ' daily maxima come from the public repository, pinned by commit, and are checked against their sha256 before anything is drawn. Certifying runs the ledger\'s own code on them in this tab — six families, three blocks, about ten seconds — and compares the record with the ledger\'s by sha256. The series downloads as CSV, ready for <a href="../return-level-check/">the return-level check</a>, which decides a fit someone printed for this place.</p>'
      + '<div class="ra-go-row"><button type="button" id="ra-back">← the claims</button></div>';
    el.innerHTML = h;
    $('ra-back').onclick = back;
    $('ra-link-cell').onclick = (e) => copyLink(e.target);
    if (SPEC.served) $('ra-cert').onclick = () => certifyCell(c);
    if (run && run.id === c.id) { $('ra-prog').textContent = run.text; if (worker) $('ra-cert').disabled = true; }   /* a run in progress, or how the last one ended */
    else if (lastCert && lastCert.id === c.id) showCert(c, lastCert);
    const D = data.get(c.id);
    if (D && D.status === 'ok') enableCsv(c, D);
    charts(c);
  }

  /* ---- the cell's own data: fetched and checked against its pin when the cell is chosen ---- */
  const data = new Map();
  const RULES = window.ATLAS_RULES || null;                          /* the ledger's block rule and claims code, inlined by build.js */
  async function digest(buf) { const d = await crypto.subtle.digest('SHA-256', buf); return Array.from(new Uint8Array(d)).map((x) => x.toString(16).padStart(2, '0')).join(''); }
  function loadData(c) {
    if (!SPEC.served || c.ice) return null;
    if (data.has(c.id)) return data.get(c.id).done;
    const D = { status: 'loading' };
    D.done = (async () => {
      try {
        const r = await fetch(SPEC.served + 'cells/' + c.id + '.i16');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const buf = await r.arrayBuffer(), sh = await digest(buf);
        if (sh !== c.sha) { D.status = 'refused'; D.why = 'the bytes served are not the pinned bytes (sha256 ' + sh.slice(0, 12) + '…)'; }
        else {
          const v = new Int16Array(buf), d0 = Date.parse(A.first + 'T00:00:00Z'), t = new Array(v.length), x = new Array(v.length);
          for (let i = 0; i < v.length; i++) { t[i] = new Date(d0 + i * 86400000).toISOString().slice(0, 10); x[i] = v[i] / 500; }
          Object.assign(D, { status: 'ok', buf, sha: sh, t, h: x, bm: {} });
        }
      } catch (e) { D.status = 'refused'; D.why = 'the cell file could not be fetched (' + e.message + ')'; }
      if (sel === c && state.tab === 'cell') { if (D.status === 'ok') enableCsv(c, D); charts(c); }
      return D;
    })();
    data.set(c.id, D);
    return D.done;
  }
  /* the block maxima by THE block rule, with the day each one fell on */
  function bmOf(D, blk) {
    if (D.bm[blk]) return D.bm[blk];
    const BM = RULES.BR.blockMaxima({ n: D.h.length, t: D.t, h: D.h, step: 24 }, blk), key = RULES.BR.BLOCKS[blk].key, at = new Map();
    for (let i = 0; i < D.h.length; i++) { const k = key(D.t[i]), q = at.get(k); if (q === undefined || D.h[i] > D.h[q]) at.set(k, i); }
    BM.at = BM.keys.map((k) => at.get(k));
    /* the histogram's bins and the QQ plot's plotting positions (Gringorten), chosen here and sent to the worker, so the
       fits are drawn against exactly the counts shown */
    let mx = 0; for (const v of BM.x) if (v > mx) mx = v;
    const nb = Math.min(40, Math.max(12, Math.round(Math.sqrt(BM.n) / 1.4))), wd = mx * 1.04 / nb;
    BM.edges = Array.from({ length: nb + 1 }, (_, k) => k * wd);
    BM.obs = new Array(nb).fill(0); for (const v of BM.x) BM.obs[Math.min(nb - 1, Math.floor(v / wd))]++;
    const s = BM.x.slice().sort((a, b) => a - b), n = s.length, keep = new Set();
    for (let i = Math.max(0, n - 60); i < n; i++) keep.add(i);
    for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 140))) keep.add(i);
    const idx = [...keep].sort((a, b) => a - b);
    BM.qx = idx.map((i) => s[i]); BM.qp = idx.map((i) => (i + 1 - 0.44) / (n + 0.12));
    return (D.bm[blk] = BM);
  }
  function enableCsv(c, D) {
    const sv = $('ra-csv'); if (!sv) return;
    sv.disabled = false;
    sv.onclick = () => { const L = ['date,hs_daily_max_m']; for (let i = 0; i < D.h.length; i++) L.push(D.t[i] + ',' + D.h[i].toFixed(3)); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([L.join('\n') + '\n'], { type: 'text/csv' })); a.download = 'ww3-daily-max-' + c.id + '.csv'; document.body.appendChild(a); a.click(); a.remove(); };
  }

  /* ---- the cell, certified again in this tab ---- */
  async function certifyCell(c) {
    if (worker) { worker.terminate(); worker = null; }
    const me = run = { id: c.id, text: '' };
    /* every message looks the panel up again: a block switch re-renders it, and the run's words must follow */
    const say = (t, done) => { me.text = t; if (run !== me) return; const p = $('ra-prog'), b = $('ra-cert'); if (sel === c && p) p.textContent = t; if (sel === c && b) b.disabled = !done; };
    say('fetching the daily maxima …');
    const D = await loadData(c);
    if (run !== me) return;
    if (!D || D.status !== 'ok') { say('REFUSED: ' + (D ? D.why : 'no cell file is served'), true); return; }
    say('sha256 ' + D.sha.slice(0, 12) + '… matches; certifying the daily maxima …');
    const bins = {}, qqp = {};
    for (const b of BLK) { const BM = bmOf(D, b); bins[b] = BM.edges; qqp[b] = BM.qp; }
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
      lastCert = { id: c.id, rec, plot: m.plot || {}, rh, same: rh === c.recSha, sameDecisions, secs: (Date.now() - t0) / 1000 };
      run = null;
      if (!state.chartPicked) state.chart = 'rl';
      if (sel === c) showCert(c, lastCert);
    };
    w.onerror = (e) => { if (w !== worker) return; worker = null; say('The run failed in the worker: ' + ((e && e.message) || 'no message'), true); };
    w.postMessage({ id: c.id, raw: D.buf.slice(0), first: A.first, bins, qqp });
  }
  /* a finished certification, shown (again) in the cell's panel: the verdict against the ledger, the design-life level, every fit */
  function showCert(c, R) {
    const prog = $('ra-prog'), rec = R.rec;
    if (!prog) return;
    prog.innerHTML = 'certified here in ' + R.secs.toFixed(1) + ' s. ' + (R.same ? '<span class="ra-ok">Identical to the ledger\'s record</span> (sha256 ' + R.rh.slice(0, 12) + '…).' : R.sameDecisions ? 'Every choice and every family\'s state is the ledger\'s; the enclosures differ in their last printed digits — this browser\'s own Math.exp and Math.log steered the floating-point search to a candidate a few bits away, and both boxes are certificates.' : '<b>Not the ledger\'s decisions</b> — report it: this tab and the ledger disagree.');
    const P = R.plot[state.block], B = rec.blocks[state.block];
    const best = B.rank.ad, dll = P && best !== 'R' && P.dll && P.dll[best];
    /* the upper end of the enclosure, rounded up to the centimetre: "above X with probability at most 10%" is then true of the fitted law */
    const up = dll ? Math.ceil(dll[1] * 100 - 1e-9) / 100 : null;
    $('ra-life').innerHTML = dll ? '<p class="ra-life">Under the ' + esc(FW[best]) + ' decided for the ' + esc(BW[state.block]) + ', a structure standing here for 25 years meets a ' + esc(state.block === 'daily' ? 'day' : state.block === 'weekly' ? 'week' : 'month') + '\'s maximum above <b>' + up.toFixed(2) + ' m</b> with probability at most 10% — the design-life level of Rootzén and Katz, here the ' + Math.round(P.hours / (8766 * -Math.expm1(Math.log(0.9) * P.hours / (8766 * 25)))) + '-year return level (' + (dll[1] - dll[0] < 5e-4 ? 'its enclosure narrower than a millimetre' : 'enclosed in [' + dll[0].toFixed(3) + ', ' + dll[1].toFixed(3) + '] m') + '). It is the fitted law\'s number: the fit\'s sampling error is not in it, successive ' + esc(BW[state.block]) + ' are taken as independent, and the climate as unchanging.</p>' : '';
    $('ra-full').innerHTML = '<div class="k">every fit, certified here</div>' + fullTable(rec);
    charts(c);
    const dl = $('ra-dl'), btn = $('ra-cert');
    if (btn) btn.disabled = false;
    dl.disabled = false;
    dl.onclick = () => {
      const cert = { what: 'A return-level atlas cell, certified in the reader\'s browser by /instruments/return-level-atlas/: the daily maxima of the Ifremer WAVEWATCH III hindcast GLOBMULTI_ERA5_GLOBCUR_01 at this node (CC BY-SA 4.0), six families fitted by maximum likelihood on the daily, weekly and monthly maxima, each fit a box proved to hold the likelihood\'s one maximum or a refusal with its reason, the criteria and levels as enclosures, each choice DECIDED or REFUSED (instruments/hseva/atlas.js).',
        cell: { id: c.id, lat: c.lat, lon: c.lon, data: SPEC.served + 'cells/' + c.id + '.i16', sha256: c.sha, days: A.days, first: A.first },
        code: SPEC.modules, record: rec, ledgerRecordSha256: c.recSha, identical: R.same, generated: new Date().toISOString() };
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(cert, null, 1)], { type: 'application/json' })); a.download = 'atlas-cell-' + c.id + '.json'; document.body.appendChild(a); a.click(); a.remove();
    };
  }

  /* ---- four ways to look at a cell: its series, a histogram, a QQ plot, the return levels ---- */
  const VIEWS = [['series', 'the series'], ['hist', 'histogram'], ['qq', 'QQ'], ['rl', 'return levels']];
  function charts(c) {
    const box = $('ra-charts'); if (!box) return;
    const D = data.get(c.id);
    if (!SPEC.served) { box.innerHTML = ''; return; }
    if (!D || D.status === 'loading') { box.innerHTML = '<p class="n">fetching this cell\'s daily maxima from the public repository …</p>'; return; }
    if (D.status === 'refused') { box.innerHTML = '<p class="n">REFUSED: ' + esc(D.why) + '</p>'; return; }
    const R = lastCert && lastCert.id === c.id ? lastCert : null, P = R ? R.plot[state.block] : null, B = R ? R.rec.blocks[state.block] : null;
    const v = state.chart || 'series', BM = bmOf(D, state.block);
    const best = B ? (B.rank.ad !== 'R' ? B.rank.ad : null) : famOf(c.blocks[state.block].ad);
    const avail = P ? FAM.filter((f) => (v === 'qq' ? P.qq && P.qq.q[f] : P.hist && P.hist.exp[f])) : [];
    const hl = avail.includes(state.hl) ? state.hl : avail.includes(best) ? best : avail[0] || null;
    let h = '<div class="ra-seg ra-cviews" id="ra-cviews" role="radiogroup" aria-label="how to look at the cell"></div>';
    if ((v === 'hist' || v === 'qq') && avail.length) h += '<div class="ra-seg ra-cfams" id="ra-cfams" role="radiogroup" aria-label="which fit to draw in ink"></div>';
    h += '<canvas class="ra-rl" id="ra-cv" role="img" aria-label="' + esc(VIEWS.find((q) => q[0] === v)[1]) + ' of this cell\'s ' + esc(BW[state.block]) + '"></canvas><p class="n" id="ra-cap"></p>';
    box.innerHTML = h;
    seg($('ra-cviews'), VIEWS, v, (x) => { state.chart = x; state.chartPicked = true; charts(c); writeHash(); });
    if ($('ra-cfams')) seg($('ra-cfams'), avail.map((f) => [f, FS[f]]), hl, (x) => { state.hl = x; charts(c); });
    const cv = $('ra-cv'), cap = $('ra-cap'), need = ' Certify the cell to draw the six fits.';
    if (v === 'series') { drawSeries(cv, D, BM, c); cap.textContent = 'The ' + fmt(D.h.length) + ' daily maxima, ' + A.first.slice(0, 4) + '–' + A.last.slice(0, 4) + ' (each pixel column the range of its days)' + (state.block === 'daily' ? '' : '; dots: the ' + fmt(BM.n) + ' ' + BW[state.block] + ' the fits see') + '; ringed: the largest day.'; }
    else if (v === 'hist') { drawHist(cv, BM, P && P.hist, hl); cap.textContent = 'The ' + fmt(BM.n) + ' ' + BW[state.block] + ' (bars) ' + (P && hl ? 'and what each certified fit expects in the same bins (lines); the ' + FW[hl] + ' in ink' + (hl === best ? ', the family Anderson–Darling decides' : '') + '.' : '.' + need); }
    else if (v === 'qq') { if (P && hl) { const off = drawQQ(cv, BM, P.qq.q[hl]); cap.textContent = 'Each of the ' + fmt(BM.n) + ' ' + BW[state.block] + ' (the top sixty all shown) against the ' + FW[hl] + ' fit\'s quantile at its plotting position (Gringorten): on the diagonal where the fit is right, above it where the data run heavier than the family, below it where the family\'s tail runs heavier than the sea.' + (off.n ? ' ' + off.n + ' point' + (off.n > 1 ? 's lie' : ' lies') + ' past the axis, the fit\'s quantile reaching ' + off.max.toFixed(1) + ' m.' : ''); } else { blank(cv); cap.textContent = 'The QQ plot needs the fits.' + need; } }
    else { if (P) { const drawn = FAM.filter((f) => P.fam[f] && P.fam[f].length > 1), off = FAM.filter((f) => !drawn.includes(f)); drawRL(cv, P, B, c, drawn); cap.textContent = 'Each curve is a certified fit\'s quantile F⁻¹(1 − b/(8766 T)), b the block in hours and T the return period in years, every point an enclosure narrower than the line; ' + (B.rank.ad !== 'R' ? 'the family Anderson–Darling decides, ' + FW[B.rank.ad] + ', in ink' : 'no family decided') + '. Dots: the ' + fmt(P.n) + ' ' + BW[state.block] + ' at their plotting positions, T = (n + 1)/i blocks; dashed: the largest day on record.' + (off.length ? ' Not drawn: ' + off.map((f) => FW[f]).join(', ') + ' (no certified fit).' : ''); } else { blank(cv); cap.textContent = 'The return levels need the fits.' + need; } }
  }
  /* a canvas sized to its column, in device pixels */
  function canvasOf(cv, ratio) {
    const dpr = window.devicePixelRatio || 1, W = Math.max(260, cv.clientWidth || 340), H = Math.round(W * ratio);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px';
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H); g.font = '10px ' + (tok('--font-mono') || 'monospace'); g.lineWidth = 1;
    return { g, W, H };
  }
  function blank(cv) { canvasOf(cv, 0.18); }
  const niceStep = (top, k) => [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200].find((s) => top / s <= (k || 6)) || 500;
  function yAxis(g, m, W, H, top, Y) {
    const st = niceStep(top); g.textAlign = 'right';
    for (let v = 0; v <= top + 1e-9; v += st) { const y = Y(v); g.strokeStyle = C.ruleSoft; g.beginPath(); g.moveTo(m.l, y); g.lineTo(W - m.r, y); g.stroke(); g.fillStyle = C.ink4; g.fillText(String(+v.toFixed(2)), m.l - 4, y + 3); }
    g.textAlign = 'left'; g.fillText('m', 4, m.t + 8);
  }
  function drawSeries(cv, D, BM, c) {
    const { g, W, H } = canvasOf(cv, 0.5), m = { l: 30, r: 10, t: 10, b: 22 }, n = D.h.length;
    let mx = 0, im = 0; for (let i = 0; i < n; i++) if (D.h[i] > mx) { mx = D.h[i]; im = i; }
    const top = Math.ceil(mx * 1.12 / niceStep(mx * 1.12)) * niceStep(mx * 1.12);
    const X = (i) => m.l + i / (n - 1) * (W - m.l - m.r), Y = (v) => H - m.b - v / top * (H - m.t - m.b);
    yAxis(g, m, W, H, top, Y);
    const y0 = Number(A.first.slice(0, 4)), y1 = Number(A.last.slice(0, 4)) + 1, d0 = Date.parse(A.first + 'T00:00:00Z');
    g.textAlign = 'center';
    for (let y = y0; y <= y1; y += 4) { const i = (Date.UTC(y, 0, 1) - d0) / 86400000, x = X(Math.min(n - 1, Math.max(0, i))); g.strokeStyle = C.ruleSoft; g.beginPath(); g.moveTo(x, m.t); g.lineTo(x, H - m.b); g.stroke(); g.fillStyle = C.ink4; g.fillText(String(y), x, H - 7); }
    const cols = Math.max(1, Math.floor(W - m.l - m.r)); g.strokeStyle = C.ink4;
    for (let k = 0; k < cols; k++) {                              /* each pixel column: the range of its days */
      const a = Math.floor(k / cols * n), b = Math.max(a + 1, Math.floor((k + 1) / cols * n)); let lo = Infinity, hi = -Infinity;
      for (let i = a; i < b && i < n; i++) { if (D.h[i] < lo) lo = D.h[i]; if (D.h[i] > hi) hi = D.h[i]; }
      g.beginPath(); g.moveTo(m.l + k + 0.5, Y(lo)); g.lineTo(m.l + k + 0.5, Y(hi) - 0.5); g.stroke();
    }
    if (BM.block !== 'daily') { g.fillStyle = C.ink2; for (let k = 0; k < BM.n; k++) { g.beginPath(); g.arc(X(BM.at[k]), Y(BM.x[k]), BM.n > 1000 ? 0.9 : 1.4, 0, 2 * Math.PI); g.fill(); } }
    g.strokeStyle = C.ink; g.lineWidth = 1.4; g.beginPath(); g.arc(X(im), Y(mx), 4, 0, 2 * Math.PI); g.stroke();
    g.fillStyle = C.ink; g.textAlign = X(im) > W / 2 ? 'right' : 'left'; g.fillText(mx.toFixed(2) + ' m · ' + D.t[im], X(im) + (X(im) > W / 2 ? -8 : 8), Math.max(m.t + 8, Y(mx) + 3));
  }
  function drawHist(cv, BM, HS, hl) {
    const { g, W, H } = canvasOf(cv, 0.6), m = { l: 30, r: 10, t: 10, b: 22 }, E = BM.edges, nb = E.length - 1, wd = E[1] - E[0];
    const dens = BM.obs.map((k) => k / (BM.n * wd));
    let top = Math.max(...dens);
    if (HS) for (const f in HS.exp) for (const e of HS.exp[f]) if (isFinite(e)) top = Math.max(top, Math.min(e / (BM.n * wd), top * 1.6));
    top *= 1.08;
    const X = (v) => m.l + v / E[nb] * (W - m.l - m.r), Y = (d) => H - m.b - Math.min(d, top) / top * (H - m.t - m.b);
    const st = niceStep(E[nb], 7); g.textAlign = 'center';
    for (let v = 0; v <= E[nb] + 1e-9; v += st) { const x = X(v); g.strokeStyle = C.ruleSoft; g.beginPath(); g.moveTo(x, m.t); g.lineTo(x, H - m.b); g.stroke(); g.fillStyle = C.ink4; g.fillText(String(+v.toFixed(2)), x, H - 7); }
    g.textAlign = 'left'; g.fillText('m', W - m.r - 8, H - 7);
    g.fillStyle = C.s[0];
    for (let j = 0; j < nb; j++) g.fillRect(X(E[j]) + 0.5, Y(dens[j]), Math.max(1, X(E[j + 1]) - X(E[j]) - 1), H - m.b - Y(dens[j]));
    if (HS) {
      const order = Object.keys(HS.exp).filter((f) => f !== hl).concat(HS.exp[hl] ? [hl] : []);
      g.save(); g.beginPath(); g.rect(m.l, m.t, W - m.l - m.r, H - m.t - m.b); g.clip();
      for (const f of order) {
        const e = HS.exp[f], main = f === hl; g.strokeStyle = main ? C.ink : C.ink4; g.lineWidth = main ? 2 : 1; g.beginPath();
        for (let j = 0; j < nb; j++) { const d = isFinite(e[j]) ? e[j] / (BM.n * wd) : 0; if (j) g.lineTo(X(E[j]), Y(d)); else g.moveTo(X(E[j]), Y(d)); g.lineTo(X(E[j + 1]), Y(d)); }
        g.stroke();
      }
      g.restore();
    }
  }
  function drawQQ(cv, BM, q) {
    const { g, W, H } = canvasOf(cv, 0.85), m = { l: 30, r: 12, t: 12, b: 22 };
    const xs = BM.qx, pts = xs.map((x, i) => [q[i], x]).filter((p) => p[0] !== null && isFinite(p[0]));
    const xmax = Math.max(...xs), lim = Math.max(xmax, Math.min(Math.max(...pts.map((p) => p[0])), xmax * 1.8)) * 1.05;
    const top = Math.ceil(lim / niceStep(lim)) * niceStep(lim);
    const X = (v) => m.l + v / top * (W - m.l - m.r), Y = (v) => H - m.b - v / top * (H - m.t - m.b);
    yAxis(g, m, W, H, top, Y);
    const st = niceStep(top); g.textAlign = 'center';
    for (let v = st; v <= top + 1e-9; v += st) { g.fillStyle = C.ink4; g.fillText(String(+v.toFixed(2)), X(v), H - 7); }
    g.strokeStyle = C.ink4; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(top), Y(top)); g.stroke(); g.setLineDash([]);   /* design/grammar.js GUIDE */
    g.save(); g.beginPath(); g.rect(m.l, m.t, W - m.l - m.r, H - m.t - m.b); g.clip();
    g.fillStyle = C.ink; for (const [a, b] of pts) { g.beginPath(); g.arc(X(Math.min(a, top)), Y(b), 1.8, 0, 2 * Math.PI); g.fill(); }
    g.restore();
    g.fillStyle = C.ink4; g.textAlign = 'right'; g.fillText('the fit\'s quantile, m', W - m.r, H - m.b - 6);
    const past = pts.filter((p) => p[0] > top);                        /* drawn on the edge, and counted in the caption */
    return { n: past.length, max: past.length ? Math.max(...past.map((p) => p[0])) : 0 };
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

  /* ---- your own claim: a region drawn or typed, a rule, decided here by the ledger's own claims code ---- */
  /* the page's compact cell, read the way instruments/hseva/atlas-claims.js reads a ledger cell; for a criterion other
     than Anderson–Darling only the choice is carried (the levels on the page are the Anderson–Darling family's) */
  function asLedger(c, crit) {
    const sets = []; if (c.sets & 1) sets.push('global4'); if (c.sets & 2) sets.push('brazil1'); if (c.sets & 4) sets.push('report:' + c.report);
    const blocks = {};
    for (const b of BLK) {
      const q = c.blocks[b], f = famOf(q[crit || 'ad']) || 'R', fits = {};
      if (f !== 'R' && (crit || 'ad') === 'ad') fits[f] = { l100: q.l100[0] === null ? null : q.l100, l1000: q.l1000[0] === null ? null : q.l1000 };
      blocks[b] = { rank: { ad: f }, fits };
    }
    return { id: c.id, lat: c.lat, lon: c.lon, sets, blocks };
  }
  const RULE_W = [['plurality', 'is the most frequent choice'], ['majority', 'is chosen at more than half the cells'], ['more', 'is chosen at more cells as the block grows'], ['fewer', 'is chosen at fewer cells as the block grows'], ['falls', 'the design wave falls as the block grows'], ['rises', 'the design wave rises as the block grows']];
  const SEQ = { dw: ['daily', 'weekly'], wm: ['weekly', 'monthly'], dm: ['daily', 'monthly'], dwm: ['daily', 'weekly', 'monthly'] };
  const MY = { box: null, cells: 'g4', rule: 'plurality', fam: 'expweibull', blk: 'monthly', crit: 'ad', seq: 'dm', T: 100, on: false };
  const mySpec = () => ['box:' + (MY.box ? (MY.box.lon ? [MY.box.lat[0], MY.box.lat[1], MY.box.lon[0], MY.box.lon[1]] : [MY.box.lat[0], MY.box.lat[1]]).join(',') : 'globe'), 'cells:' + MY.cells, 'rule:' + MY.rule, 'fam:' + MY.fam, 'blk:' + MY.blk, 'crit:' + MY.crit, 'seq:' + MY.seq, 'T:' + MY.T].join(';');
  function readMy(spec) {
    for (const part of String(spec).split(';')) {
      const [k, v] = part.split(':'); if (!v) continue;
      if (k === 'box') { const n = v === 'globe' ? [] : v.split(',').map(Number); MY.box = n.length === 4 && n.every(isFinite) ? { lat: [Math.min(n[0], n[1]), Math.max(n[0], n[1])], lon: [n[2], n[3]] } : n.length === 2 && n.every(isFinite) ? { lat: [Math.min(n[0], n[1]), Math.max(n[0], n[1])] } : null; }
      else if (k === 'cells' && ['g4', 'b1', 'all'].includes(v)) MY.cells = v;
      else if (k === 'rule' && RULE_W.some((r) => r[0] === v)) MY.rule = v;
      else if (k === 'fam' && FAM.includes(v)) MY.fam = v;
      else if (k === 'blk' && BLK.includes(v)) MY.blk = v;
      else if (k === 'crit' && CRIT.includes(v)) MY.crit = v;
      else if (k === 'seq' && SEQ[v]) MY.seq = v;
      else if (k === 'T' && (v === '100' || v === '1000')) MY.T = Number(v);
    }
  }
  const boxWords = (b) => (!b ? 'the whole globe' : (b.lon ? latW(b.lat[0]) + ' to ' + latW(b.lat[1]) + ', ' + lonW(b.lon[0]) + ' to ' + lonW(b.lon[1]) : latW(b.lat[0]) + ' to ' + latW(b.lat[1]) + ', all longitudes'));
  const latW = (v) => Math.abs(v) + '° ' + (v < 0 ? 'S' : 'N'), lonW = (v) => Math.abs(v) + '° ' + (v < 0 ? 'W' : 'E');
  function mineForm() {
    const el = $('ra-mine'); if (!el || el.dataset.on) return;
    el.dataset.on = '1';
    const opt = (items, cur) => items.map(([v, t]) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>').join('');
    el.innerHTML = '<div class="k">your own claim</div><p class="n">Draw a region on the globe or type it, say what should hold there, and it is decided here — the way the paper\'s ten below are, by the same rule code, from the certificates the map shows.</p>'
      + '<div class="ra-mine"><div class="ra-go-row"><button type="button" id="ra-draw">draw a region on the globe</button><button type="button" id="ra-whole">the whole globe</button></div>'
      + '<div class="ra-box4"><label class="ra-lab">from<input id="ra-b-s" class="ra-select" type="number" step="0.5" min="-90" max="90" placeholder="lat"></label><label class="ra-lab">to<input id="ra-b-n" class="ra-select" type="number" step="0.5" min="-90" max="90" placeholder="lat"></label><label class="ra-lab">west<input id="ra-b-w" class="ra-select" type="number" step="0.5" min="-180" max="180" placeholder="lon"></label><label class="ra-lab">east<input id="ra-b-e" class="ra-select" type="number" step="0.5" min="-180" max="180" placeholder="lon"></label></div>'
      + '<div class="ra-mrow"><label class="ra-lab" for="ra-m-cells">cells</label><select id="ra-m-cells" class="ra-select">' + opt([['g4', 'the 4° globe'], ['b1', 'the 1° Brazilian margin'], ['all', 'both lattices']], MY.cells) + '</select></div>'
      + '<div class="ra-mrow"><label class="ra-lab" for="ra-m-rule">claim</label><select id="ra-m-rule" class="ra-select">' + opt(RULE_W, MY.rule) + '</select></div>'
      + '<div class="ra-mrow" id="ra-m-args"></div>'
      + '<div class="ra-go-row"><button type="button" id="ra-decide">decide it</button><button type="button" class="ra-linkbtn" id="ra-link-mine" disabled>link to this claim</button></div>'
      + '<div id="ra-m-out" aria-live="polite"></div></div>';
    $('ra-draw').onclick = () => startDraw();
    $('ra-whole').onclick = () => { MY.box = null; fillBox(); decideMine(true); };
    for (const id of ['ra-b-s', 'ra-b-n', 'ra-b-w', 'ra-b-e']) $(id).onchange = () => { readBox(); };
    $('ra-m-cells').onchange = (e) => { MY.cells = e.target.value; };
    $('ra-m-rule').onchange = (e) => { MY.rule = e.target.value; mineArgs(); };
    $('ra-decide').onclick = () => { readBox(); decideMine(true); };
    $('ra-link-mine').onclick = (e) => copyLink(e.target);
    mineArgs(); fillBox();
  }
  function mineArgs() {
    const el = $('ra-m-args'), opt = (items, cur) => items.map(([v, t]) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>').join('');
    const lvl = MY.rule === 'falls' || MY.rule === 'rises', seqd = lvl || MY.rule === 'more' || MY.rule === 'fewer';
    let h = '';
    if (!lvl) h += '<select id="ra-m-fam" class="ra-select" aria-label="family">' + opt(FAM.map((f) => [f, FW[f]]), MY.fam) + '</select>';
    if (lvl) h += '<select id="ra-m-T" class="ra-select" aria-label="return period">' + opt([[100, 'the 100-year wave'], [1000, 'the 1000-year wave']], MY.T) + '</select>';
    h += seqd ? '<select id="ra-m-seq" class="ra-select" aria-label="blocks">' + opt((lvl ? ['dw', 'wm', 'dm'] : ['dw', 'wm', 'dm', 'dwm']).map((k) => [k, SEQ[k].join(' → ')]), MY.seq) + '</select>'
      : '<select id="ra-m-blk" class="ra-select" aria-label="block">' + opt(BLK.map((b) => [b, BW[b]]), MY.blk) + '</select>';
    if (!lvl) h += '<select id="ra-m-crit" class="ra-select" aria-label="criterion">' + opt(CRIT.map((k) => [k, CW[k]]), MY.crit) + '</select>';
    el.innerHTML = h;
    if (lvl && MY.seq === 'dwm') MY.seq = 'dm';
    const on = (id, k, num) => { const x = $(id); if (x) x.onchange = (e) => { MY[k] = num ? Number(e.target.value) : e.target.value; }; };
    on('ra-m-fam', 'fam'); on('ra-m-T', 'T', true); on('ra-m-seq', 'seq'); on('ra-m-blk', 'blk'); on('ra-m-crit', 'crit');
  }
  function fillBox() {
    const b = MY.box, set = (id, v) => { const x = $(id); if (x) x.value = v === undefined || v === null ? '' : v; };
    set('ra-b-s', b ? b.lat[0] : ''); set('ra-b-n', b ? b.lat[1] : ''); set('ra-b-w', b && b.lon ? b.lon[0] : ''); set('ra-b-e', b && b.lon ? b.lon[1] : '');
  }
  function readBox() {
    const v = (id) => { const x = $(id); return x && x.value !== '' ? Number(x.value) : null; };
    const s = v('ra-b-s'), n = v('ra-b-n'), w = v('ra-b-w'), e = v('ra-b-e');
    if (s === null && n === null && w === null && e === null) return;
    if ([s, n].every((x) => x !== null && isFinite(x))) {
      const lat = [Math.max(-90, Math.min(s, n)), Math.min(90, Math.max(s, n))];
      MY.box = w !== null && e !== null && isFinite(w) && isFinite(e) ? { lat, lon: [Math.max(-180, Math.min(180, w)), Math.max(-180, Math.min(180, e))] } : { lat };
    }
  }
  function decideMine(andFly) {
    if (!RULES) return;
    const AC = RULES.AC, crit = MY.rule === 'falls' || MY.rule === 'rises' ? 'ad' : MY.crit;
    const box = MY.box || { lat: [-90, 90] };
    const inSet = (c) => (MY.cells === 'g4' ? c.sets & 1 : MY.cells === 'b1' ? c.sets & 2 : c.sets & 3);
    const S = { cells: cells.filter((c) => !c.ice && inSet(c)).map((c) => asLedger(c, crit)).filter((c) => AC.inBox(c, box)) };
    const R = AC.rules, blocks = SEQ[MY.seq];
    let r;
    if (!S.cells.length) r = { verdict: AC.VERDICTS.U, counts: [] };
    else if (MY.rule === 'plurality') r = R.plurality(S, MY.fam, MY.blk);
    else if (MY.rule === 'majority') r = R.majority(S, MY.fam, MY.blk);
    else if (MY.rule === 'more' || MY.rule === 'fewer') r = R.monotone(S, MY.fam, blocks, MY.rule === 'more' ? 1 : -1);
    else r = R.levelShift(S, 'l' + MY.T, blocks[0], blocks[blocks.length - 1], MY.rule === 'rises' ? 1 : -1);
    MY.on = true;
    const V = { HOLDS: 'holds', 'DOES NOT HOLD': 'does-not-hold', UNDECIDED: 'undecided' };
    const lvl = MY.rule === 'falls' || MY.rule === 'rises';
    const what = lvl ? 'the ' + MY.T + '-year wave of the decided family is ' + (MY.rule === 'falls' ? 'lower' : 'higher') + ' for the ' + BW[blocks[blocks.length - 1]] + ' than for the ' + BW[blocks[0]] + ' at more than half the cells'
      : 'the ' + FW[MY.fam] + ' ' + RULE_W.find((q) => q[0] === MY.rule)[1] + ' (' + (MY.rule === 'more' || MY.rule === 'fewer' ? blocks.join(' → ') : BW[MY.blk]) + ', ' + CW[crit] + ')';
    const cnt = (r.counts || []).map((q) => (q.against !== undefined ? q.block + ': ' + q.relation + ' at ' + q.decided + ', not ' + q.relation + ' at ' + q.against + ', not decided at ' + q.refused + ' of ' + q.n
      : q.by ? q.block + ': the ' + FS[MY.fam] + ' at ' + q.decided + ' of ' + q.n + ' cells, ' + q.refused + ' refused; decided: ' + Object.entries(q.by).sort((a, b) => b[1] - a[1]).map(([f, k]) => FS[f] + ' ' + k).join(', ')
      : (q.family ? FS[q.family] + ', ' : '') + q.block + ': ' + q.decided + ' decided, ' + q.refused + ' refused of ' + q.n)).join(' · ');
    $('ra-m-out').innerHTML = '<div class="ra-claim ra-mine-out"><div class="ra-cv ra-v-' + V[r.verdict] + '">' + esc(r.verdict) + '</div><div class="ra-cq">In ' + esc(boxWords(MY.box)) + ', ' + esc(MY.cells === 'g4' ? 'the 4° globe' : MY.cells === 'b1' ? 'the 1° Brazilian margin' : 'both lattices') + ' (' + fmt(S.cells.length) + ' certified cell' + (S.cells.length === 1 ? '' : 's') + '): ' + esc(what) + '.</div><div class="ra-cn mono">' + esc(cnt || 'no certified cell in the region') + '</div></div>';
    $('ra-link-mine').disabled = false;
    /* the globe shows what the claim is about */
    claimOn = null; state.block = lvl ? blocks[blocks.length - 1] : MY.rule === 'more' || MY.rule === 'fewer' ? blocks[blocks.length - 1] : MY.blk;
    if (lvl) { state.mode = 'blocks'; state.T = MY.T; } else { state.mode = 'family'; state.fam = MY.fam; state.crit = crit; }
    controls(); refresh();
    if (map && map.getSource('box')) map.getSource('box').setData(boxGeo(MY.box));
    if (andFly && MY.box && MY.box.lon) { const [w, e] = MY.box.lon, E = e < w ? e + 360 : e; if (sheetMode()) setSheet('peek'); later(() => fly({ bounds: [[w, MY.box.lat[0]], [E, MY.box.lat[1]]] })); }
    writeHash();
  }
  /* drawing: press and drag on the globe; the rectangle runs east when the pointer moves right */
  let drawing = false, d0 = null, drew = 0;
  function startDraw() {
    if (!map) return;
    drawing = true; map.dragPan.disable(); map.touchZoomRotate.disable(); map.getCanvas().style.cursor = 'crosshair';
    const hint = $('ra-hint'); hint.textContent = 'press and drag across the region · Esc to stop'; hint.classList.add('on');
    if (sheetMode()) setSheet('peek');
  }
  function stopDraw() {
    drawing = false; d0 = null; if (!map) return;
    map.dragPan.enable(); map.touchZoomRotate.enable(); map.getCanvas().style.cursor = '';
    $('ra-hint').classList.remove('on');
  }
  function toBox(a, b) {
    const r = (v) => Math.round(v * 2) / 2, la = [r(Math.min(a.lat, b.lat)), r(Math.max(a.lat, b.lat))];
    const [w, e] = b.x >= a.x ? [a.lng, b.lng] : [b.lng, a.lng];
    const wrap = (v) => ((v + 540) % 360) - 180;
    return { lat: [Math.max(-89.5, la[0]), Math.min(89.5, la[1])], lon: [r(wrap(w)), r(wrap(e))] };
  }
  function drawEvents() {
    const at = (e) => (e.lngLat && isFinite(e.lngLat.lat) && isFinite(e.lngLat.lng) ? { lat: e.lngLat.lat, lng: e.lngLat.lng, x: e.point.x } : null);
    const down = (e) => { if (!drawing) return; const p = at(e); if (!p) return; e.preventDefault(); d0 = p; };
    const move = (e) => { if (!drawing || !d0) return; const p = at(e); if (!p) return; map.getSource('box').setData(boxGeo(toBox(d0, p))); };
    const up = (e) => {
      if (!drawing || !d0) return;
      const p = at(e) || d0, b = toBox(d0, p); stopDraw(); drew = Date.now();
      if (b.lat[1] - b.lat[0] < 1 || Math.abs(b.lon[1] - b.lon[0]) < 1) { $('ra-hint').textContent = ''; return; }
      MY.box = b; fillBox(); setTab('claims'); if (sheetMode()) setSheet('half'); decideMine(false);
    };
    map.on('mousedown', down); map.on('mousemove', move); map.on('mouseup', up);
    map.on('touchstart', down); map.on('touchmove', move); map.on('touchend', up);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawing) stopDraw(); });
  }

  /* ---- links: the view, the cell, the claim and the camera, in the address; history is not spammed ---- */
  let hashTimer = null, ready = false;
  function writeHash(now) {
    if (!ready) return;
    const go = () => {
      const q = new URLSearchParams();
      q.set('v', state.mode); q.set('b', state.block);
      if (['wave', 'blocks', 'record'].includes(state.mode)) q.set('T', state.T);
      if (state.mode === 'family') { q.set('f', state.fam); q.set('k', state.crit); }
      if (state.tab !== 'claims') q.set('t', state.tab);
      if (sel) q.set('c', sel.id);
      if (sel && state.chartPicked) q.set('ch', state.chart);
      if (claimOn) q.set('cl', claimOn);
      if (MY.on) q.set('my', mySpec());
      if (map) { const c = map.getCenter(); q.set('at', [c.lat.toFixed(2), c.lng.toFixed(2), map.getZoom().toFixed(2)].join(',')); }
      history.replaceState(null, '', '#' + q.toString());
    };
    clearTimeout(hashTimer);
    if (now) go(); else hashTimer = setTimeout(go, 250);
  }
  function readHash() {
    const q = new URLSearchParams(location.hash.slice(1)), g = (k) => q.get(k);
    if (MODES.some(([v]) => v === g('v'))) state.mode = g('v');
    if (BLK.includes(g('b'))) state.block = g('b');
    if (g('T') === '100' || g('T') === '1000') state.T = Number(g('T'));
    if (FAM.includes(g('f'))) state.fam = g('f');
    if (CRIT.includes(g('k'))) state.crit = g('k');
    if (VIEWS.some(([v]) => v === g('ch'))) { state.chart = g('ch'); state.chartPicked = true; }
    const at = (g('at') || '').split(',').map(Number);
    return { tab: TABS.includes(g('t')) ? g('t') : null, cell: g('c'), claim: g('cl'), my: g('my'), at: at.length === 3 && at.every(isFinite) ? at : null };
  }
  function copyLink(btn) {
    writeHash(true);
    const done = () => { const t = btn.textContent; btn.textContent = 'link copied'; setTimeout(() => { btn.textContent = t; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, () => window.prompt('the link', location.href));
    else window.prompt('the link', location.href);
  }

  /* ---- the paper's ten, decided again in this tab from the map's own data by the ledger's rule code ---- */
  function recheck() {
    const el = $('ra-recheck'); if (!el || !RULES) return;
    const K = RULES.AC.evaluate(cells.filter((c) => !c.ice).map((c) => asLedger(c, 'ad')));
    const bad = A.claims.filter((k) => { const r = K.find((q) => q.id === k.id); return !r || r.verdict !== k.verdict || JSON.stringify(r.counts) !== JSON.stringify(k.counts); });
    el.textContent = bad.length ? 'Decided again in this tab from the map\'s data: ' + bad.length + ' of the ' + A.claims.length + ' differ from the build (' + bad.map((k) => k.id).join(', ') + ') — report it.'
      : 'Decided again in this tab, from the map\'s own data by the ledger\'s rule code: all ' + A.claims.length + ' verdicts and their counts are the build\'s.';
  }

  /* ---- the panel's own controls: tabs (arrow keys between them), the fold, the sheet's grip ---- */
  function wire() {
    for (const t of TABS) $('ra-t-' + t).onclick = () => setTab(t);
    $('ra-t-claims').parentElement.onkeydown = (e) => {
      const k = TABS.indexOf(state.tab), d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); setTab(TABS[(k + d + TABS.length) % TABS.length], true); }
    };
    $('ra-close').onclick = () => setPanel(false);
    $('ra-reopen').onclick = () => setPanel(true);
    /* the sheet: a tap on the grip or the title steps it up (and from the top back to a peek); a swipe moves it one step */
    const STEPS = ['peek', 'half', 'full'];
    const step = (d) => { const k = STEPS.indexOf($('ra-app').dataset.sheet); setSheet(STEPS[Math.max(0, Math.min(2, k + d))]); };
    for (const el of [$('ra-grip'), $('ra-panel').querySelector('.ra-titlerow')]) {
      let y0 = null;
      el.addEventListener('pointerdown', (e) => { if (sheetMode()) y0 = e.clientY; });
      el.addEventListener('pointerup', (e) => {
        if (y0 === null || !sheetMode()) return;
        const dy = e.clientY - y0; y0 = null;
        if (Math.abs(dy) < 10) { const k = STEPS.indexOf($('ra-app').dataset.sheet); setSheet(k === 2 ? 'peek' : STEPS[k + 1]); }
        else step(dy < 0 ? 1 : -1);
      });
    }
    $('ra-grip').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const k = STEPS.indexOf($('ra-app').dataset.sheet); setSheet(k === 2 ? 'peek' : STEPS[k + 1]); } };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheetMode() && $('ra-app').dataset.sheet !== 'peek') setSheet('peek'); });
    /* crossing the breakpoint: the fold belongs to the wide screen, the sheet to the narrow one */
    let wasNarrow = narrow(), wasSheet = sheetMode();
    window.addEventListener('resize', () => {
      const n = narrow(), sh = sheetMode();
      if (sh !== wasSheet) { wasSheet = sh; if (sh) $('ra-app').dataset.panel = 'open'; }
      if (n !== wasNarrow) { wasNarrow = n; controls(); legend(); }
      if (map) later(() => map.easeTo({ padding: pad(), duration: 0 }));
    });
  }

  /* ---- start ---- */
  Promise.all([fetch('atlas.json').then((r) => r.json()), fetch('land.json').then((r) => r.json())]).then(([a, land]) => {
    A = a; cells = a.cells.map(decode); cells.forEach((c) => byId.set(c.id, c));
    const H = readHash();
    if (H.my) readMy(H.my);                                          /* before the form is first drawn, so it opens on the claim */
    wire(); controls(); legend(); panel(); recheck();
    $('ra-app').dataset.ready = '1';
    /* what the address names: a claim of the paper's or one's own, a cell, a tab — the view after them, as written */
    const view = { mode: state.mode, block: state.block, T: state.T, fam: state.fam, crit: state.crit };
    if (H.my) { mineForm(); decideMine(false); }
    else if (H.claim && A.claims.some((k) => k.id === H.claim)) claimClick(H.claim);
    Object.assign(state, view); controls(); legend();
    if (H.cell && byId.has(H.cell)) select(byId.get(H.cell));
    if (H.tab) setTab(H.tab);
    if (typeof maplibregl === 'undefined') { $('ra-map').innerHTML = '<p class="n">The map could not load here; the claims and the cells are listed in the panel.</p>'; ready = true; return; }
    try { initMap(land); } catch (e) { $('ra-map').innerHTML = '<p class="n">This browser could not draw the map (' + esc(e.message) + '); the claims in the panel still stand.</p>'; }
    if (map) {
      drawEvents();
      map.on('load', () => {
        map.jumpTo({ padding: pad() });
        if (H.at) map.jumpTo({ center: [H.at[1], H.at[0]], zoom: H.at[2] }); else map.jumpTo({ zoom: globeZoom() });
        if (sel && map.getLayer('sel')) map.setFilter('sel', ['==', ['get', 'i'], cells.indexOf(sel)]);
        if (MY.on && MY.box) map.getSource('box').setData(boxGeo(MY.box));
        else if (claimOn) { const k = A.claims.find((q) => q.id === claimOn); if (k) map.getSource('box').setData(boxGeo(k.box)); }
        ready = true; writeHash();
        map.on('moveend', () => writeHash());
      });
    } else ready = true;
    /* a handle for the page's own gates (tools/check-*.js drive it in Chrome); it changes nothing */
    window.__atlas = { map: () => map, select: (id) => select(byId.get(id)), state, cells: () => cells.length, setTab, setSheet, setPanel };
  }).catch((e) => { $('ra-map').innerHTML = '<p class="n ra-fail">The atlas data could not be read here (' + esc(e.message) + '); the paper\'s claims beside the globe stand, decided when the page was built.</p>'; });
})();
