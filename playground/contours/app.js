/* app.js — the contour instrument, in the tab.
   playground/contours/ · cert-machine

   Reads the JSON the builder embedded (the ledger's rows, every submitted
   contour's vertices as the literal strings its file carries, a density grid
   of each dataset), draws the chosen contour over the chosen data, and decides
   any sea state the reader names — by click or by typing — with ECGEO, the
   same bytes that decided the ledger. Nothing here is a port of the decider. */
(function () {
  'use strict';
  const S = JSON.parse(document.getElementById('ec-spec').textContent);
  const G = window.ECGEO;
  const $ = (id) => document.getElementById(id);
  const W = 900, H = 540, ML = 58, MR = 16, MT = 14, MB = 44;
  const PW = W - ML - MR, PH = H - MT - MB;

  const selDs = $('ec-ds'), selC = $('ec-c'), selT = $('ec-t');
  const canvas = $('ec-canvas'), svg = $('ec-svg');
  const ctx = canvas.getContext('2d');
  canvas.width = W * 2; canvas.height = H * 2;   /* 2× for a crisp density on retina */

  const fmt = (x) => Number(x).toLocaleString('en-US');
  let poly = null, row = null, bounds = null;

  function fill() {
    for (const ch of S.order.datasets) { const o = document.createElement('option'); o.value = ch; o.textContent = ch + ' · ' + S.datasets[ch].variables + ' · ' + S.datasets[ch].source; selDs.appendChild(o); }
    for (const c of S.contributions) { const o = document.createElement('option'); o.value = c.key; o.textContent = c.key + ' · ' + c.method + ' · ' + c.authors; selC.appendChild(o); }
    selDs.value = 'A'; selC.value = '4';
    fillT();
  }
  function fillT() {
    const ch = selDs.value, key = selC.value;
    const keep = selT.value;
    selT.innerHTML = '';
    const rows = S.rows.filter((r) => r.dataset === ch && r.contribution === key).sort((a, b) => a.returnPeriod - b.returnPeriod);
    for (const r of rows) { const o = document.createElement('option'); o.value = String(r.returnPeriod); o.textContent = r.returnPeriod + '-year contour'; selT.appendChild(o); }
    const want = rows.find((r) => String(r.returnPeriod) === keep) ? keep : String(rows[rows.length - 1].returnPeriod);
    selT.value = want;
  }

  /* plot mapping */
  const px = (u) => ML + (u - bounds.x0) / (bounds.x1 - bounds.x0) * PW;
  const py = (h) => MT + PH - (h - bounds.y0) / (bounds.y1 - bounds.y0) * PH;
  const ux = (x) => bounds.x0 + (x - ML) / PW * (bounds.x1 - bounds.x0);
  const hy = (y) => bounds.y0 + (MT + PH - y) / PH * (bounds.y1 - bounds.y0);

  function drawDensity(ch) {
    const g = S.datasets[ch].grid;
    bounds = { x0: g.x0, x1: g.x1, y0: g.y0, y1: g.y1 };
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const cs = getComputedStyle(document.documentElement);
    const ink = cs.getPropertyValue('--ink').trim() || '#e8e8ec';
    const cw = PW / g.nx, chh = PH / g.ny;
    const lmax = Math.log1p(g.max);
    for (let j = 0; j < g.ny; j++) for (let i = 0; i < g.nx; i++) {
      const c = g.counts[j * g.nx + i]; if (!c) continue;
      const a = 0.08 + 0.72 * Math.log1p(c) / lmax;
      ctx.globalAlpha = a; ctx.fillStyle = ink;
      ctx.fillRect(ML + i * cw, MT + PH - (j + 1) * chh, cw + 0.5, chh + 0.5);
    }
    ctx.globalAlpha = 1;
  }

  function drawOverlay() {
    const ch = selDs.value, kind = S.datasets[ch].kind;
    const out = [];
    /* axes */
    const xt = kind === 'tz' ? [0, 4, 8, 12, 16, 20] : [0, 5, 10, 15, 20, 25, 30, 35];
    const yt = kind === 'tz' ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 4, 8, 12, 16, 20];
    for (const v of xt) if (v >= bounds.x0 && v <= bounds.x1) { const x = px(v); out.push('<line class="ec-grid" x1="' + x + '" y1="' + MT + '" x2="' + x + '" y2="' + (MT + PH) + '"/>', '<text class="ec-tick" x="' + x + '" y="' + (MT + PH + 16) + '" text-anchor="middle">' + v + '</text>'); }
    for (const v of yt) if (v >= bounds.y0 && v <= bounds.y1) { const y = py(v); out.push('<line class="ec-grid" x1="' + ML + '" y1="' + y + '" x2="' + (ML + PW) + '" y2="' + y + '"/>', '<text class="ec-tick" x="' + (ML - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + v + '</text>'); }
    out.push('<line class="ec-axis" x1="' + ML + '" y1="' + (MT + PH) + '" x2="' + (ML + PW) + '" y2="' + (MT + PH) + '"/>');
    out.push('<text class="ec-lab" x="' + (ML + PW / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + (kind === 'tz' ? 'zero-up-crossing period Tz (s)' : 'wind speed u₁₀ (m/s)') + '</text>');
    out.push('<text class="ec-lab" transform="rotate(-90 14 ' + (MT + PH / 2) + ')" x="14" y="' + (MT + PH / 2) + '" text-anchor="middle">significant wave height Hs (m)</text>');
    /* the contour: the file's polygon, closed from last to first as the benchmark closed it */
    if (poly) {
      const d = poly.pts.map((p, i) => (i ? 'L' : 'M') + px(p.u.v).toFixed(1) + ' ' + py(p.h.v).toFixed(1)).join(' ') + ' Z';
      out.push('<path class="ec-poly" d="' + d + '"/>');
      /* crossings: their NUMBER is decided; their positions are drawn in float, so the mark is dashed */
      for (const c of (row.crossings || [])) { const x = px(c[0]), y = py(c[1]); out.push('<path ' + S.marks.cross + ' d="M' + x + ' ' + (y - 6) + ' L' + (x + 6) + ' ' + y + ' L' + x + ' ' + (y + 6) + ' L' + (x - 6) + ' ' + y + ' Z"/>'); }
      for (const o of (row.on || [])) { out.push('<circle class="ec-on" cx="' + px(Number(o.u)) + '" cy="' + py(Number(o.h)) + '" r="6"/>'); }
    }
    if (pick) { out.push('<circle class="ec-pick" cx="' + px(pick.u) + '" cy="' + py(pick.h) + '" r="4.5"/>'); }
    svg.innerHTML = out.join('');
  }

  let pick = null;
  function select() {
    const ch = selDs.value, key = selC.value, T = Number(selT.value);
    row = S.rows.find((r) => r.dataset === ch && r.contribution === key && r.returnPeriod === T);
    const V = S.contours[row.id];
    const pts = V.u.map((u, i) => ({ u: G.lit(u), h: G.lit(V.h[i]) }));
    poly = G.polygon(pts);
    drawDensity(ch);
    pick = null;
    drawOverlay();
    readout();
    verdict(null);
    highlightTable();
  }

  function readout() {
    const c = row.counts, d = S.datasets[row.dataset];
    const pr = row.printed;
    $('r-out').textContent = fmt(c.full.out);
    $('r-out-note').textContent = c.full.on ? '+ ' + c.full.on + ' exactly on the contour' : 'none on the contour';
    $('r-printed').textContent = pr ? fmt(pr.value) : '—';
    $('r-printed-note').textContent = pr ? (pr.kind === 'mean' ? 'the paper prints only a three-dataset mean for 1-yr contours' : pr.agrees ? 'agrees with the exact count' : 'is not the count of this file') : 'the paper prints no count for this file';
    $('r-above').textContent = fmt(c.full.outAboveThreshold);
    $('r-ret').textContent = fmt(c.retained.out) + ' / ' + fmt(c.provided.out);
    $('r-ret-note').textContent = 'expected ' + (row.class === 'total' ? d.retainedExpected.total : '≈ ' + d.retainedExpected.iform) + ' in the retained years for this class';
    $('r-poly').textContent = row.polygon.simple ? 'simple' : row.polygon.selfCrossings + ' self-crossing' + (row.polygon.selfCrossings === 1 ? '' : 's');
    $('r-poly-note').textContent = fmt(row.polygon.distinctVertices) + ' distinct vertices · ' + (row.polygon.closed ? 'closed in the file' : 'closed by the test, ' + row.polygon.closingEdgeLength.replace(/0+$/, '') + ' m') + (row.polygon.duplicates ? ' · ' + row.polygon.duplicates + ' duplicate vertices' : '');
    $('r-max').textContent = Number(row.polygon.maxHs).toFixed(2) + ' m';
    $('r-max-note').textContent = 'observed maximum ' + d.maxHs + ' m' + (row.maxHsAboveObserved ? ' — below the contour' : ' — above the contour');
  }

  function decide(uStr, hStr) {
    let U, Hh;
    try { U = G.lit(uStr); Hh = G.lit(hStr); } catch (e) { verdict({ error: 'not a decimal literal: ' + e.message }); return; }
    const c = G.classify(poly, U, Hh);
    pick = { u: U.v, h: Hh.v };
    drawOverlay();
    verdict({ where: c.where, u: U.s, h: Hh.s, winding: c.winding });
  }
  function verdict(v) {
    const kind = S.datasets[selDs.value].kind;
    const el = $('ec-verdict');
    if (!v) { el.innerHTML = '<div class="why">Click anywhere on the plot, or type a sea state, and the tab decides whether it lies inside, outside or on this contour — exactly, with the code that decided the ledger.</div>'; return; }
    if (v.error) { el.innerHTML = '<div class="word on">REFUSED</div><div class="why">' + v.error + '</div>'; return; }
    const name = kind === 'tz' ? 'Tz = ' + v.u + ' s' : 'u₁₀ = ' + v.u + ' m/s';
    const word = v.where === 'IN' ? 'INSIDE' : v.where === 'OUT' ? 'OUTSIDE' : 'ON THE CONTOUR';
    el.innerHTML = '<div class="word' + (v.where === 'ON' ? ' on' : '') + ' w-decided">' + word + '</div>'
      + '<div class="why">Hs = ' + v.h + ' m, ' + name + ' — decided by the even-odd crossing count in exact arithmetic' + (v.where === 'ON' ? ': the point lies on an edge or a vertex, an answer the float test does not have' : v.winding !== null && v.winding !== undefined ? ' (winding number ' + v.winding + ')' : '') + '.</div>';
  }

  svg.addEventListener('click', (ev) => {
    const r = svg.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
    if (x < ML || x > ML + PW || y < MT || y > MT + PH) return;
    /* the click becomes a literal at the data's own resolution, four decimals; the decision is about that literal */
    const u = ux(x).toFixed(4), h = hy(y).toFixed(4);
    $('ec-u').value = u; $('ec-h').value = h;
    decide(u, h);
  });
  $('ec-go').addEventListener('click', () => decide($('ec-u').value, $('ec-h').value));
  for (const id of ['ec-u', 'ec-h']) $(id).addEventListener('keydown', (ev) => { if (ev.key === 'Enter') decide($('ec-u').value, $('ec-h').value); });

  function highlightTable() {
    for (const tr of document.querySelectorAll('.ec-tbl tr[data-id]')) tr.classList.toggle('sel', tr.dataset.id === row.id);
  }
  for (const tr of document.querySelectorAll('.ec-tbl tr[data-id]')) tr.addEventListener('click', () => {
    const r = S.rows.find((x) => x.id === tr.dataset.id);
    selDs.value = r.dataset; selC.value = r.contribution; fillT(); selT.value = String(r.returnPeriod); select();
  });

  selDs.addEventListener('change', () => { fillT(); select(); });
  selC.addEventListener('change', () => { fillT(); select(); });
  selT.addEventListener('change', select);
  fill();
  select();
})();
