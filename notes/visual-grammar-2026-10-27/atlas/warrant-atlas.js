/* WARRANT v2 over the live return-level atlas. The atlas already speaks v1 (decided solid, refused hatched,
   statistical screened). What v2 adds: each regional box is OUR READING of the paper's words, so it is a pick and is
   drawn dotted, with the readings one 4° cell in or out drawn beside it; a verdict stands only if every nearby
   reading gives it (ι over readings), otherwise it is REFUSED with a READING hole; and where a claim robustly does
   not hold, the cells that break it are outlined red, the page's only accent. The rules are the ledger's own,
   instruments/hseva/atlas-claims.js, inlined; they must reproduce the page's ten verdicts before anything is drawn. */
(function () {
  'use strict';
  const AC = (function () { const module = { exports: {} }; /*__AC__*/ return module.exports; })();
  const RED = '#e0574e';
  const wait = setInterval(() => {
    const X = window.__Watlas;
    if (!X || !X.A || !X.cells.length || !X.map || !X.map.isStyleLoaded() || !X.map.getLayer('hov')) return;
    clearInterval(wait); start(X);
  }, 250);

  function start(X) {
    const A = X.A, map = X.map, FAM = A.fam, BLK = A.blocks || ['daily', 'weekly', 'monthly'];
    const cells = X.cells.filter((c) => !c.ice).map((c) => {
      const blocks = {};
      BLK.forEach((b) => { const q = c.blocks[b], fam = q.ad === 6 ? 'R' : FAM[q.ad], fits = {}; if (fam !== 'R') fits[fam] = { l100: q.l100, l1000: q.l1000 }; blocks[b] = { rank: { ad: fam }, fits }; });
      return { id: c.id, lat: c.lat, lon: c.lon, sets: c.sets & 1 ? ['global4'] : [], blocks };
    });
    const ev = (K, box) => { const S = { cells: cells.filter((c) => c.sets.includes(K.set) && AC.inBox(c, box)) }; return S.cells.length ? Object.assign({ n: S.cells.length, S }, K.decide(S)) : { verdict: 'UNDECIDED', n: 0, S, counts: [] }; };
    const R = {}; let reproduced = 0;
    for (const K of AC.CLAIMS) {
      const base = ev(K, K.box), rec = A.claims.find((c) => c.id === K.id);
      if (rec && rec.verdict === base.verdict && JSON.stringify(rec.counts) === JSON.stringify(base.counts)) reproduced++;
      const B = K.box, reads = [];
      const edges = B.lon ? [['lat', 0, 'south'], ['lat', 1, 'north'], ['lon', 0, 'west'], ['lon', 1, 'east']] : B.lat[0] > -90 ? [['lat', 0, 'south'], ['lat', 1, 'north']] : [];
      for (const [ax, i, name] of edges) for (const d of [-4, 4]) {
        const nb = JSON.parse(JSON.stringify(B)); nb[ax][i] += d;
        if (nb.lat[0] >= nb.lat[1]) continue;
        const r = ev(K, nb);
        reads.push({ box: nb, verdict: r.verdict, n: r.n, words: `${name} edge moves ${d > 0 ? (ax === 'lat' ? 'north' : 'east') : (ax === 'lat' ? 'south' : 'west')} by 4°` });
      }
      R[K.id] = { K, base, reads, agree: reads.every((r) => r.verdict === base.verdict) };
    }
    if (reproduced !== AC.CLAIMS.length) { console.warn('warrant: the rules did not reproduce the page; nothing drawn'); return; }

    /* the readings and the red cells, on the globe */
    const lineOf = (b) => { const [s, n] = b.lat, w = b.lon ? b.lon[0] : -180, e0 = b.lon ? b.lon[1] : 180, E = e0 < w ? e0 + 360 : e0, ln = [];
      for (let x = w; x <= E; x += 1) ln.push([x, s]); for (let y = s; y <= n; y += 1) ln.push([E, y]); for (let x = E; x >= w; x -= 1) ln.push([x, n]); for (let y = n; y >= s; y -= 1) ln.push([w, y]);
      return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ln } }; };
    const sq = (c) => { const h = 1.84; return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[c.lon - h, c.lat - h], [c.lon + h, c.lat - h], [c.lon + h, c.lat + h], [c.lon - h, c.lat + h], [c.lon - h, c.lat - h]]] } }; };
    const FC = (f) => ({ type: 'FeatureCollection', features: f });
    map.addSource('w-reads', { type: 'geojson', data: FC([]) });
    map.addSource('w-red', { type: 'geojson', data: FC([]) });
    map.addLayer({ id: 'w-reads', type: 'line', source: 'w-reads', layout: { 'line-cap': 'round' }, paint: { 'line-color': 'rgba(246,246,248,0.42)', 'line-width': 1.2, 'line-dasharray': [0.2, 3] } }, 'hov');
    map.addLayer({ id: 'w-red', type: 'line', source: 'w-red', paint: { 'line-color': RED, 'line-width': 2 } }, 'hov');
    /* our box is a reading of prose: CHOSEN, so dotted */
    map.setPaintProperty('box', 'line-dasharray', [0.2, 2.4]); map.setLayoutProperty('box', 'line-cap', 'round');

    const famOf = (id) => (/weibull-rises|monsoon/.test(id) ? 'weibull' : /gg-/.test(id) ? 'gengamma' : /ew-|japan-ew/.test(id) ? 'expweibull' : null);
    /* the cells that break a robustly failed claim: the exhibited objects, so red */
    /* every claim here is a COUNT over a region: a count refutes it, never one cell, so no cell is red. The hook stays
       for a claim about a single cell or site, where one object can break it. */
    function breakers(r) {
      const K = r.K, S = r.base.S, fam = famOf(K.id);
      if (r.base.verdict !== 'DOES NOT HOLD' || !r.agree || /expands|monsoon|south-america|ew-|japan-ew|levels|rises/.test(K.id)) return [];
      if (/expands|monsoon/.test(K.id)) return S.cells.filter((c) => c.blocks[K.blocks[0]].rank.ad === fam && c.blocks[K.blocks[1]].rank.ad !== fam && c.blocks[K.blocks[1]].rank.ad !== 'R');
      if (/south-america|ew-|japan-ew/.test(K.id)) { const b = K.blocks[K.blocks.length - 1]; return S.cells.filter((c) => c.blocks[b].rank.ad !== fam && c.blocks[b].rank.ad !== 'R'); }
      return [];
    }
    window.__Wclaim = (id) => {
      const r = R[id]; if (!r) return;
      map.getSource('w-reads').setData(FC(r.reads.map((q) => lineOf(q.box))));
      map.getSource('w-red').setData(FC(breakers(r).map(sq)));
    };

    /* the words: one line under each claim, one paragraph above them */
    const chip = (s) => `<svg width="24" height="8" viewBox="0 0 24 8" style="display:inline-block;vertical-align:middle;margin-right:6px"><line x1="1" y1="4" x2="23" y2="4" stroke="rgba(246,246,248,.85)" stroke-width="2" ${s === 1 ? 'stroke-dasharray="1 5" stroke-dashoffset="-1.5" stroke-linecap="round"' : ''}/></svg>`;
    const flips = AC.CLAIMS.filter((K) => !R[K.id].agree);
    document.querySelectorAll('.ra-claim').forEach((li) => {
      const r = R[li.dataset.claim]; if (!r) return;
      const d = document.createElement('div'); d.className = 'w-claim';
      if (!r.reads.length) d.innerHTML = `${chip(3)}v2: the whole lattice, so there is no box to read; the verdict stands as decided`;
      else if (r.agree) d.innerHTML = `${chip(3)}v2: every nearby reading gives the same verdict (${r.reads.length} boxes, one 4° cell in or out), so the box does not matter${r.base.verdict === 'DOES NOT HOLD' ? '. A count refutes it, not any one cell, so no cell is drawn red' : ''}`;
      else {
        const other = r.reads.filter((q) => q.verdict !== r.base.verdict);
        d.innerHTML = `${chip(1)}v2: <b>REFUSED · HOLE READING</b>. ${r.base.verdict} for this box, but ${other.map((q) => q.verdict).filter((v, i, a) => a.indexOf(v) === i).join(' / ')} when the ${other.map((q) => q.words).join(', or the ')}. The paper’s words do not fix the box, so the verdict is a pick of ours.`;
      }
      li.appendChild(d);
    });
    const panel = document.getElementById('ra-p-claims'), first = panel && panel.querySelector('p');
    if (first) {
      const p = document.createElement('div'); p.className = 'w-sum';
      p.innerHTML = `<div class="w-k">the grammar · warrant v2</div>Each box below is our reading of the paper’s words: a pick, drawn dotted, with the readings one 4° cell in or out drawn faintly beside it. A verdict stands only if every nearby reading gives it. The ledger’s own rules, run in this tab, reproduce all ${reproduced} verdicts; ${AC.CLAIMS.length - flips.length} of them survive every reading, and ${flips.length === 1 ? 'one changes' : flips.length + ' change'}: ${flips.map((K) => K.where).join('; ')}. <em>Given six families · Anderson–Darling · the 4° lattice · the hindcast 1993–2024 · our reading of each region.</em>`;
      first.after(p);
    }
    if (X.claimOn) window.__Wclaim(X.claimOn);
  }
})();
