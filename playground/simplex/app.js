/* app.js — three views of one attention row, all of them the same point.

   Everyone draws an attention row as bars or as a stripe in a heatmap. Both
   throw away the one structural fact about it: the numbers are nonnegative and
   sum to one, so the row is a POINT IN A SIMPLEX and every question about it is
   a question about where in that simplex it sits.

   THE FAN is the whole simplex, affinely. Put the 31 vertices of Δ³⁰ on a
   regular 31-gon and plot Σ pᵢ vᵢ. The map is linear, so the barycentre lands
   in the middle, a vertex lands on a vertex, and the path between them is the
   real path — but two different rows can project to the same dot, and no
   contour drawn here would be true. So nothing is drawn here except the point,
   its trail, and the vertices it is heading for.

   THE FACE is exact and small. Restrict the row to three positions and
   renormalise: that is a genuine 2-face of the same simplex, in barycentric
   coordinates, where PR = 1/Σpᵢ² really is 1/Σpᵢ² and its level sets really are
   circles. So the contours live here and nowhere else.

   THE LADDER is the decision. PR against β, the row against its two planted
   mutants. The mutants must fail to descend, or the instrument is theatre.
*/
'use strict';
(function () {
  const D = JSON.parse(document.getElementById('sx-data').textContent);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in (a || {})) e.setAttribute(k, a[k]); return e; };
  const $ = (id) => document.getElementById(id);
  const N = D.meta.positions;
  const fmt = (x, d) => Number(x).toFixed(d === undefined ? 3 : d);
  const last = (a) => a[a.length - 1];

  /* the state is one number */
  let vi = 0;

  /* ---- the fan: a regular N-gon carrying the whole simplex --------------- */
  const FAN = { size: 1000, r: 372 };
  const vert = [];
  for (let i = 0; i < N; i++) {
    const th = -Math.PI / 2 + (2 * Math.PI * i) / N;
    vert.push([FAN.size / 2 + FAN.r * Math.cos(th), FAN.size / 2 + FAN.r * Math.sin(th)]);
  }
  const project = (w) => {
    let x = 0, y = 0;
    for (let i = 0; i < N; i++) { x += w[i] * vert[i][0]; y += w[i] * vert[i][1]; }
    return [x, y];
  };

  function drawFan() {
    const g = $('fan');
    g.textContent = '';
    /* the frame the point moves inside */
    g.appendChild(el('circle', { cx: FAN.size / 2, cy: FAN.size / 2, r: FAN.r, class: 'sx-hull' }));
    for (let i = 0; i < N; i++) {
      const [x, y] = vert[i];
      const top = D.top3.indexOf(i) >= 0;
      g.appendChild(el('circle', { cx: x, cy: y, r: top ? 5 : 3, class: 'sx-vert' + (top ? ' hi' : '') }));
      const th = -Math.PI / 2 + (2 * Math.PI * i) / N;
      const lx = FAN.size / 2 + (FAN.r + 26) * Math.cos(th), ly = FAN.size / 2 + (FAN.r + 26) * Math.sin(th);
      const t = el('text', { x: lx, y: ly + 4, class: 'sx-vlab' + (top ? ' hi' : ''), 'text-anchor': 'middle' });
      t.textContent = i;
      g.appendChild(t);
    }
    /* the trail: solid where the claim is decided, dashed where it is only drawn */
    const pts = D.view.map((v) => project(v.w));
    const cut = D.view.findIndex((v) => !v.certified);
    const path = (a, b) => pts.slice(a, b).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    g.appendChild(el('path', { d: path(0, cut < 0 ? pts.length : cut + 1), class: 'sx-trail cert' }));
    if (cut >= 0) g.appendChild(el('path', { d: path(cut, pts.length), class: 'sx-trail ext' }));
    /* the barycentre, named, because it is the whole reference */
    g.appendChild(el('circle', { cx: FAN.size / 2, cy: FAN.size / 2, r: 2.5, class: 'sx-bary' }));
    const bt = el('text', { x: FAN.size / 2, y: FAN.size / 2 - 12, class: 'sx-vlab', 'text-anchor': 'middle' });
    bt.textContent = 'uniform';
    g.appendChild(bt);
    if (cut > 0) {
      const e = pts[cut];
      g.appendChild(el('circle', { cx: e[0], cy: e[1], r: 4, class: 'sx-edge' }));
      const t = el('text', { x: e[0] + 10, y: e[1] + 4, class: 'sx-vlab' });
      t.textContent = 'β ' + fmt(D.exact[D.exact.length - 1].beta, 0) + ' — the decision ends here';
      g.appendChild(t);
    }
    g.appendChild(el('circle', { id: 'fanDot', r: 8, class: 'sx-dot' }));
  }

  /* ---- the face: an exact 2-face, where contours are honest -------------- */
  const FACE = { size: 620, pad: 74 };
  const triPt = (b) => {                        // barycentric → pixels
    const h = FACE.size - 2 * FACE.pad, w = h * 2 / Math.sqrt(3);
    const A = [FACE.size / 2, FACE.pad], B = [FACE.size / 2 - w / 2, FACE.pad + h], C = [FACE.size / 2 + w / 2, FACE.pad + h];
    return [b[0] * A[0] + b[1] * B[0] + b[2] * C[0], b[0] * A[1] + b[1] * B[1] + b[2] * C[1]];
  };
  const faceOf = (w) => { const s = D.top3.reduce((a, i) => a + w[i], 0); return D.top3.map((i) => w[i] / s); };

  function drawFace() {
    const g = $('face');
    g.textContent = '';
    const corners = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(triPt);
    g.appendChild(el('path', { d: 'M' + corners.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z', class: 'sx-tri' }));
    const labelled = new Set();
    for (const c of D.contours) {
      const d = c.pts.map((p, i) => { const q = triPt(p); return (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('') + (c.closed ? 'Z' : '');
      g.appendChild(el('path', { d, class: 'sx-iso' }));
      if (labelled.has(c.level)) continue;      // one label per level, not per arc
      labelled.add(c.level);
      /* label on the arc's own left flank rather than its top: the trail runs
         straight up the middle of this face and a centred label sits on it */
      const mid = c.pts[Math.floor(c.pts.length * 0.30)];
      const lp = triPt(mid);
      const t = el('text', { x: lp[0] - 7, y: lp[1] + 3, class: 'sx-isolab', 'text-anchor': 'end' });
      t.textContent = fmt(c.level, 2);
      g.appendChild(t);
    }
    D.top3.forEach((idx, k) => {
      const p = triPt([0, 1, 2].map((j) => (j === k ? 1 : 0)));
      const t = el('text', { x: p[0], y: p[1] + (k === 0 ? -14 : 22), class: 'sx-vlab hi', 'text-anchor': 'middle' });
      t.textContent = 'position ' + idx;
      g.appendChild(t);
    });
    const trail = D.view.map((v) => triPt(faceOf(v.w)));
    const cut = D.view.findIndex((v) => !v.certified);
    const seg = (a, b) => trail.slice(a, b).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    g.appendChild(el('path', { d: seg(0, cut < 0 ? trail.length : cut + 1), class: 'sx-trail cert' }));
    if (cut >= 0) g.appendChild(el('path', { d: seg(cut, trail.length), class: 'sx-trail ext' }));
    if (cut > 0) g.appendChild(el('circle', { cx: trail[cut][0], cy: trail[cut][1], r: 4, class: 'sx-edge' }));
    g.appendChild(el('circle', { id: 'faceDot', r: 7, class: 'sx-dot' }));
  }

  /* ---- the ladder: the decision, and the two mutants that must fail ------ */
  const LAD = { w: 620, h: 320, l: 52, r: 16, t: 30, b: 40 };
  function drawLadder() {
    const g = $('ladder');
    g.textContent = '';
    const bs = D.exact.map((r) => r.beta);
    const x0 = Math.log(bs[0]), x1 = Math.log(bs[bs.length - 1]);
    const all = [].concat(D.exact.map((r) => r.PR), D.mutants.quadratic.PR, [N]);
    const y0 = Math.min(...all) - 0.06, y1 = Math.max(...all) + 0.04;
    const X = (b) => LAD.l + ((Math.log(b) - x0) / (x1 - x0)) * (LAD.w - LAD.l - LAD.r);
    const Y = (v) => LAD.t + (1 - (v - y0) / (y1 - y0)) * (LAD.h - LAD.t - LAD.b);
    for (let k = 0; k <= 4; k++) {
      const v = y0 + (k / 4) * (y1 - y0);
      g.appendChild(el('line', { x1: LAD.l, x2: LAD.w - LAD.r, y1: Y(v), y2: Y(v), class: 'sx-grid' }));
      const t = el('text', { x: LAD.l - 8, y: Y(v) + 3, class: 'sx-ax', 'text-anchor': 'end' });
      t.textContent = fmt(v, 1);
      g.appendChild(t);
    }
    const line = (pts, cls) => g.appendChild(el('path', {
      d: pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(''), class: cls,
    }));
    line(bs.map((b, i) => [b, D.mutants.flat.PR[i]]), 'sx-mut');
    line(bs.map((b, i) => [b, D.mutants.quadratic.PR[i]]), 'sx-mut');
    line(D.exact.map((r) => [r.beta, r.PR]), 'sx-real');
    D.exact.forEach((r) => g.appendChild(el('circle', { cx: X(r.beta), cy: Y(r.PR), r: 3, class: 'sx-knot' })));
    for (const [b, lab] of [[bs[0], 'β ' + bs[0]], [bs[bs.length - 1], 'β ' + bs[bs.length - 1]]]) {
      const t = el('text', { x: X(b), y: LAD.h - 12, class: 'sx-ax', 'text-anchor': 'middle' });
      t.textContent = lab; g.appendChild(t);
    }
    /* labels placed off their own curves, and never on top of each other: the
       three lines all crowd the top of this panel, so each one gets a side and
       an offset chosen from where its curve actually is. */
    const lab = (txt, b, v, dy, anchor, cls) => {
      const t = el('text', { x: X(b), y: Y(v) + dy, class: 'sx-lab ' + (cls || ''), 'text-anchor': anchor || 'start' });
      t.textContent = txt; g.appendChild(t);
    };
    lab('flat mutant — PR = ' + N + ' at every β', bs[bs.length - 1], N, -8, 'end', 'mut');
    lab('(β−3)²·s mutant — dips, then turns back', bs[0], D.mutants.quadratic.PR[0], 16, 'start', 'mut');
    lab('the row — strictly down, decided exactly', bs[bs.length - 1], last(D.exact).PR, 16, 'end', 'real');
    g.appendChild(el('circle', { id: 'ladDot', r: 5, class: 'sx-dot' }));
    g._X = X; g._Y = Y;
  }

  /* ---- the one control -------------------------------------------------- */
  function paint() {
    const v = D.view[vi];
    const p = project(v.w); const f = triPt(faceOf(v.w));
    $('fanDot').setAttribute('cx', p[0]); $('fanDot').setAttribute('cy', p[1]);
    $('faceDot').setAttribute('cx', f[0]); $('faceDot').setAttribute('cy', f[1]);
    const g = $('ladder');
    const b = Math.min(Math.max(v.beta, D.exact[0].beta), D.exact[D.exact.length - 1].beta);
    const near = D.exact.reduce((a, r) => (Math.abs(r.beta - b) < Math.abs(a.beta - b) ? r : a));
    $('ladDot').setAttribute('cx', g._X(b)); $('ladDot').setAttribute('cy', g._Y(near.PR));
    $('rBeta').textContent = fmt(v.beta, v.beta < 10 ? 2 : 0);
    $('rPR').textContent = fmt(v.PR, 3);
    $('rMax').textContent = fmt(Math.max(...v.w), 4);
    $('rH').textContent = fmt(v.H, 4);
    $('rState').textContent = v.certified ? 'inside the decided grid' : 'drawn, not decided';
    document.body.classList.toggle('beyond', !v.certified);
    $('cBeta').value = vi; $('cBetaOut').textContent = 'β ' + fmt(v.beta, v.beta < 10 ? 2 : 0);
  }

  drawFan(); drawFace(); drawLadder();
  const slider = $('cBeta');
  slider.min = 0; slider.max = D.view.length - 1; slider.step = 1; slider.value = 0;
  slider.addEventListener('input', () => { vi = +slider.value; paint(); });
  $('sheetOpen').onclick = () => document.body.classList.add('sheet-open');
  $('sheetClose').onclick = () => document.body.classList.remove('sheet-open');
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.body.classList.remove('sheet-open'); });

  /* THE #hash DEV HOOK — see design/CONTRACT.md.
         #set=v:12            the position slider
         #set=sheet:open      the panel a screenshot never sees
     Drives the same slider and the same paint() the control does. */
  function applyHash() {
    const raw = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    const m = /(?:^|[&;])set=([^&;]*)/.exec(raw);
    if (!m) return;
    for (const pair of m[1].split(',')) {
      const [k, val] = pair.split(':');
      if (!k || val === undefined) continue;
      if (k === 'sheet') { document.body.classList.toggle('sheet-open', val === 'open'); continue; }
      if (k === 'v') {
        const n = Number(val);
        if (Number.isNaN(n)) continue;
        slider.value = String(Math.max(0, Math.min(D.view.length - 1, n)));
        vi = +slider.value;
      }
    }
    paint();
  }
  window.addEventListener('hashchange', applyHash);

  applyHash();
  paint();
})();
