/* interferometer-app.js — the drawing half.  Inlined into
   site/interferometer/index.html by tools/build-interferometer.js.

   The pipeline (experiments/interferometer/make-page-data.js) does the science:
   it produces an ENSEMBLE of skies, every one of which the released EHT data
   allow.  This file only draws them, and the drawing is the point — what the
   ensemble agrees on becomes ink, what it disagrees on becomes texture.  No
   scientific quantity is recomputed here. */
(function () {
  'use strict';
  const D = JSON.parse(document.getElementById('ifm-data').textContent);
  const M = D.meta, N = M.N, NP = N * N;
  const $ = id => document.getElementById(id);

  /* ---------- decode the ensemble ---------- */
  /* REGISTRATION.  Neither the amplitudes nor the closure phases can see
     absolute position — both are invariant under translating the sky — so every
     fitted member sits wherever its descent happened to leave it, and averaging
     them raw turns a set of rings into one blob.  That blur is real ambiguity,
     but it is ambiguity about WHERE, and it hides the ambiguity about WHAT.
     So each member is decoded twice: centred on its own flux centroid, and left
     where it fell.  The `register` control switches between the two, and the
     difference between them is the position-blindness, drawn. */
  function decode(x) {
    const bin = atob(x.b64), a = new Float32Array(NP);
    let tot = 0;
    for (let i = 0; i < NP; i++) { a[i] = (bin.charCodeAt(i) / 255) * x.peak; tot += a[i]; }
    for (let i = 0; i < NP; i++) a[i] /= (tot || 1);          // compare SHAPES, not brightness
    let cx = 0, cy = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = a[j * N + i]; cx += v * i; cy += v * j; }
    const c = (N - 1) / 2, dx = cx - c, dy = cy - c;
    const b = new Float32Array(NP);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const sx = i + dx, sy = j + dy;                          // bilinear resample
      const i0 = Math.floor(sx), j0 = Math.floor(sy), fx = sx - i0, fy = sy - j0;
      const g = (ii, jj) => (ii < 0 || ii >= N || jj < 0 || jj >= N) ? 0 : a[jj * N + ii];
      b[j * N + i] = g(i0, j0) * (1 - fx) * (1 - fy) + g(i0 + 1, j0) * fx * (1 - fy)
        + g(i0, j0 + 1) * (1 - fx) * fy + g(i0 + 1, j0 + 1) * fx * fy;
    }
    return { raw: a, reg: b, dx, dy };
  }
  const MEM = D.members.map(m => ({ meta: m, d: decode(m), phase: m.phase, drop: m.drop, chi2: m.chi2, total: m.total }));
  const EXT = D.ceiling.map(m => ({ meta: m, d: decode(m), phase: -1, drop: null, chi2: m.chi2, total: m.total, r0: m.r0 }));
  const ALL = MEM.concat(EXT);

  /* ---------- controls ---------- */
  const st = {
    phase: 1, extremes: 0, chiMax: 200, mode: 'contour',
    gamma: 1.1, black: 0.45, levels: 11, density: 1.0, spreadGain: 1.0, beam: 5,
    zoom: 1, ring: 1, uv: 1, grid: 0, invert: 0, register: 1, fluxMax: D.meta.F,
    stOn: M.stations.map(() => true),
  };

  /* ---------- the reduction: weighted mean and spread over the live ensemble -- */
  const RG = 288;                                   // render grid (bilinear from N)
  const mean = new Float32Array(NP), spread = new Float32Array(NP);
  const meanR = new Float32Array(RG * RG), sprR = new Float32Array(RG * RG);
  let nLive = 0, liveFlux = [0, 0];

  function weightOf(m) {
    if (m.phase < 0) return st.extremes ? 1 : 0;
    if (m.chi2 > st.chiMax) return 0;
    if (m.total > st.fluxMax) return 0;      // the stated flux hypothesis, as a filter
    if (m.drop && !st.stOn[M.stations.indexOf(m.drop)]) return 0;   // a dropped-station member belongs to that station
    const d = m.phase - st.phase;
    return Math.exp(-(d * d) / (2 * 0.22 * 0.22));
  }

  function reduce() {
    const wts = ALL.map(weightOf);
    let sw = 0; nLive = 0;
    let flo = 1e9, fhi = 0;
    for (let i = 0; i < ALL.length; i++) if (wts[i] > 0.02) { sw += wts[i]; nLive++; flo = Math.min(flo, ALL[i].total); fhi = Math.max(fhi, ALL[i].total); }
    liveFlux = nLive ? [flo, fhi] : [0, 0];
    mean.fill(0); spread.fill(0);
    if (!sw) return;
    for (let m = 0; m < ALL.length; m++) {
      const wt = wts[m]; if (wt <= 0.02) continue;
      const img = st.register ? ALL[m].d.reg : ALL[m].d.raw;
      for (let i = 0; i < NP; i++) mean[i] += wt * img[i];
    }
    for (let i = 0; i < NP; i++) mean[i] /= sw;
    for (let m = 0; m < ALL.length; m++) {
      const wt = wts[m]; if (wt <= 0.02) continue;
      const img = st.register ? ALL[m].d.reg : ALL[m].d.raw;
      for (let i = 0; i < NP; i++) { const d = img[i] - mean[i]; spread[i] += wt * d * d; }
    }
    for (let i = 0; i < NP; i++) spread[i] = Math.sqrt(spread[i] / sw);
    /* RELATIVE disagreement.  An absolute spread is largest wherever the skies
       are brightest, which just redraws the source; and in the empty parts of
       the field the ensemble agrees on nothing and it does not matter.  What is
       worth drawing is disagreement PER UNIT BRIGHTNESS, and only where there is
       brightness to disagree about. */
    { let hm = 0; for (let i = 0; i < NP; i++) if (mean[i] > hm) hm = mean[i];
      for (let i = 0; i < NP; i++) spread[i] = spread[i] / (mean[i] + 0.18 * hm); }
    // normalise for display
    let hi = 0, shi = 0;
    for (let i = 0; i < NP; i++) { if (mean[i] > hi) hi = mean[i]; if (spread[i] > shi) shi = spread[i]; }
    for (let i = 0; i < NP; i++) { mean[i] /= (hi || 1); spread[i] /= (shi || 1); }
    upsample(mean, meanR); upsample(spread, sprR);
    blurR(meanR); blurR(sprR);
    renorm(meanR); renorm(sprR);
  }

  /* THE RESTORING BEAM.  An interferometer measures nothing beyond its longest
     baseline, so structure finer than the fringe spacing is the fitter talking
     to itself.  Blurring to a stated beam is what radio astronomy has always
     done, and here it is a control rather than a default nobody sees. */
  const tmpR = new Float32Array(RG * RG);
  function blurR(g) {
    const pxUas = (2 * M.fov) / (RG - 1), sg = st.beam / pxUas;
    if (sg < 0.4) return;
    const r = Math.min(40, Math.ceil(3 * sg)), ker = new Float64Array(2 * r + 1);
    let sum = 0;
    for (let d = -r; d <= r; d++) { const v = Math.exp(-d * d / (2 * sg * sg)); ker[d + r] = v; sum += v; }
    for (let i = 0; i < ker.length; i++) ker[i] /= sum;
    for (let j = 0; j < RG; j++) for (let i = 0; i < RG; i++) {
      let v = 0;
      for (let d = -r; d <= r; d++) { const q = Math.min(RG - 1, Math.max(0, i + d)); v += ker[d + r] * g[j * RG + q]; }
      tmpR[j * RG + i] = v;
    }
    for (let j = 0; j < RG; j++) for (let i = 0; i < RG; i++) {
      let v = 0;
      for (let d = -r; d <= r; d++) { const q = Math.min(RG - 1, Math.max(0, j + d)); v += ker[d + r] * tmpR[q * RG + i]; }
      g[j * RG + i] = v;
    }
  }
  function renorm(g) { let hi = 0; for (let i = 0; i < g.length; i++) if (g[i] > hi) hi = g[i]; if (hi > 0) for (let i = 0; i < g.length; i++) g[i] /= hi; }

  function upsample(src, dst) {
    const s = (N - 1) / (RG - 1);
    for (let j = 0; j < RG; j++) {
      const y = j * s, j0 = Math.min(N - 2, Math.floor(y)), fy = y - j0;
      for (let i = 0; i < RG; i++) {
        const x = i * s, i0 = Math.min(N - 2, Math.floor(x)), fx = x - i0;
        const a = src[j0 * N + i0], b = src[j0 * N + i0 + 1], c = src[(j0 + 1) * N + i0], d = src[(j0 + 1) * N + i0 + 1];
        dst[j * RG + i] = a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
      }
    }
  }

  /* ---------- drawing ---------- */
  const cv = $('stage'), ctx = cv.getContext('2d');
  let W = 0, H = 0, SQ = 0, OX = 0, OY = 0, DPR = 1;
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    layout(); draw();
  }
  /* the panel is opaque, so the sky is centred in what is LEFT of the screen —
     otherwise half the source sits behind the controls on a narrow window */
  function panelW() {
    if (document.body.classList.contains('panel-hidden')) return 0;
    const p = document.querySelector('.panel');
    return p ? Math.min(p.getBoundingClientRect().width, W * 0.5) : 0;
  }
  function layout() {
    const avail = W - panelW();
    SQ = Math.min(avail, H) * 0.82 * st.zoom;
    OX = (avail - SQ) / 2; OY = (H - SQ) / 2;
  }
  const ink = a => `rgba(246,246,248,${a})`;
  const val = (g, x, y) => {                       // bilinear sample of a render grid, x,y in [0,1]
    const fx = Math.max(0, Math.min(RG - 1.001, x * (RG - 1)));
    const fy = Math.max(0, Math.min(RG - 1.001, y * (RG - 1)));
    const i0 = Math.floor(fx), j0 = Math.floor(fy), dx = fx - i0, dy = fy - j0;
    const a = g[j0 * RG + i0], b = g[j0 * RG + i0 + 1], c = g[(j0 + 1) * RG + i0], d = g[(j0 + 1) * RG + i0 + 1];
    return a * (1 - dx) * (1 - dy) + b * dx * (1 - dy) + c * (1 - dx) * dy + d * dx * dy;
  };
  const shape = v => Math.pow(Math.max(0, (v - st.black) / (1 - st.black)), st.gamma);

  function px(i, j) { return [OX + (i / (RG - 1)) * SQ, OY + (1 - j / (RG - 1)) * SQ]; }

  function drawField() {
    const img = ctx.createImageData(RG, RG);
    for (let j = 0; j < RG; j++) for (let i = 0; i < RG; i++) {
      const o = ((RG - 1 - j) * RG + i) * 4;
      const t = shape(meanR[j * RG + i]);
      let g = 8 + 247 * t;
      const s = sprR[j * RG + i] * t * st.spreadGain;
      if (s > 0.10) {                                   // disagreement becomes hatch
        const hatch = ((i + j) % Math.max(3, Math.round(9 - 6 * Math.min(1, s)))) === 0;
        if (hatch) g = Math.min(255, g + 70 * Math.min(1, s));
        else g *= (1 - 0.42 * Math.min(1, s));
      }
      img.data[o] = img.data[o + 1] = img.data[o + 2] = g; img.data[o + 3] = 255;
    }
    const off = document.createElement('canvas'); off.width = off.height = RG;
    off.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, OX, OY, SQ, SQ);
  }

  /* marching squares on meanR */
  function contoursAt(level) {
    const segs = [];
    for (let j = 0; j < RG - 1; j++) for (let i = 0; i < RG - 1; i++) {
      const a = meanR[j * RG + i], b = meanR[j * RG + i + 1], c = meanR[(j + 1) * RG + i + 1], d = meanR[(j + 1) * RG + i];
      let idx = (a > level ? 1 : 0) | (b > level ? 2 : 0) | (c > level ? 4 : 0) | (d > level ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const ip = (p, q, vp, vq) => { const t = (level - vp) / (vq - vp || 1e-9); return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]; };
      const P = [i, j], Q = [i + 1, j], Rr = [i + 1, j + 1], Sx = [i, j + 1];
      const eAB = () => ip(P, Q, a, b), eBC = () => ip(Q, Rr, b, c), eCD = () => ip(Rr, Sx, c, d), eDA = () => ip(Sx, P, d, a);
      const push = (p, q) => segs.push([p, q]);
      switch (idx) {
        case 1: case 14: push(eDA(), eAB()); break;
        case 2: case 13: push(eAB(), eBC()); break;
        case 3: case 12: push(eDA(), eBC()); break;
        case 4: case 11: push(eBC(), eCD()); break;
        case 6: case 9: push(eAB(), eCD()); break;
        case 7: case 8: push(eDA(), eCD()); break;
        case 5: push(eDA(), eAB()); push(eBC(), eCD()); break;
        case 10: push(eAB(), eBC()); push(eCD(), eDA()); break;
      }
    }
    return segs;
  }

  function drawContour() {
    const L = st.levels;
    for (let l = 1; l <= L; l++) {
      const lv = Math.pow(l / (L + 1), 1 / Math.max(0.2, st.gamma)) * (1 - st.black) + st.black;
      const segs = contoursAt(lv);
      const a = 0.22 + 0.68 * (l / L);
      for (const [p, q] of segs) {
        const sp = val(sprR, p[0] / (RG - 1), p[1] / (RG - 1)) * shape(val(meanR, p[0] / (RG - 1), p[1] / (RG - 1))) * st.spreadGain;
        const band = Math.min(6, Math.round(1 + 7 * sp));       // disagreement widens the line into a band
        const A = px(p[0], p[1]), B = px(q[0], q[1]);
        ctx.strokeStyle = ink(a * (band > 1 ? 0.5 : 1));
        ctx.lineWidth = 1;
        for (let k = 0; k < band; k++) {
          const off = band === 1 ? 0 : (k - (band - 1) / 2) * 1.35;
          ctx.beginPath(); ctx.moveTo(A[0] + off, A[1] + off); ctx.lineTo(B[0] + off, B[1] + off); ctx.stroke();
        }
      }
    }
  }

  let rnd = 12345; const rand = () => { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return rnd / 0x7fffffff; };
  function drawStipple() {
    rnd = 12345;
    const n = Math.round(26000 * st.density);
    ctx.fillStyle = ink(0.9);
    for (let k = 0; k < n; k++) {
      const x = rand(), y = rand();
      const v = shape(val(meanR, x, y));
      if (rand() > v) continue;
      const s = val(sprR, x, y) * v * st.spreadGain;
      const jx = (rand() - 0.5) * s * 0.09, jy = (rand() - 0.5) * s * 0.09;
      const X = OX + (x + jx) * SQ, Y = OY + (1 - (y + jy)) * SQ;
      const r = 0.5 + 1.1 * v * (1 - 0.5 * Math.min(1, s));
      ctx.fillRect(X, Y, r, r);
    }
  }

  function drawScan() {
    const rowsN = Math.round(96 * st.density);
    const amp = SQ * 0.085;
    for (let r = 0; r < rowsN; r++) {
      const y = r / (rowsN - 1);
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= RG; i++) {
        const x = i / RG;
        const v = shape(val(meanR, x, y));
        const s = val(sprR, x, y) * v * st.spreadGain;
        const X = OX + x * SQ, Y = OY + (1 - y) * SQ - v * amp;
        const gap = s > 0.5 && ((i + r) % 3 === 0);
        if (gap) { started = false; continue; }
        if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      }
      ctx.strokeStyle = ink(0.16 + 0.5 * (1 - Math.abs(2 * y - 1)));
      ctx.lineWidth = 1; ctx.stroke();
    }
  }

  function drawOverlays() {
    const c = [OX + SQ / 2, OY + SQ / 2], scale = SQ / (2 * M.fov);
    if (st.grid) {
      ctx.strokeStyle = ink(0.07); ctx.lineWidth = 1;
      for (let g = -60; g <= 60; g += 20) {
        ctx.beginPath(); ctx.moveTo(c[0] + g * scale, OY); ctx.lineTo(c[0] + g * scale, OY + SQ); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(OX, c[1] + g * scale); ctx.lineTo(OX + SQ, c[1] + g * scale); ctx.stroke();
      }
    }
    if (st.ring) {
      ctx.setLineDash([3, 5]); ctx.strokeStyle = ink(0.32); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(c[0], c[1], (M.ringDiamUas / 2) * scale, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ink(0.4); ctx.font = '10px ui-monospace, monospace';
      const rr = (M.ringDiamUas / 2) * scale * 0.7071;
      ctx.fillText('published ring ' + M.ringDiamUas + ' µas', c[0] + rr + 6, c[1] + rr + 12);
    }
    /* scale bar, anchored to the RIGHT edge of the render square. On the left it
       sat exactly where the bottom overlay's source line lands at common widths,
       and two true things overprinting each other read as one broken one. */
    const bar = 20 * scale;
    const bx = OX + SQ - bar, by = OY + SQ + 18;
    ctx.strokeStyle = ink(0.5); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bar, by); ctx.stroke();
    ctx.fillStyle = ink(0.5); ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('20 µas', bx - 8, by + 4);
    ctx.textAlign = 'left';
    if (st.uv) drawUV();
  }

  function drawUV() {
    const s = Math.min(140, SQ * 0.2), x0 = OX + SQ - s, y0 = OY + SQ - s - 4;
    ctx.save();
    ctx.fillStyle = 'rgba(10,10,12,0.72)'; ctx.fillRect(x0, y0, s, s);
    ctx.strokeStyle = ink(0.14); ctx.strokeRect(x0, y0, s, s);
    const c = [x0 + s / 2, y0 + s / 2], sc = (s / 2 - 3) / (M.uvMax * 1.02);
    for (let k = 0; k < D.vis.u.length; k++) {
      const on = st.stOn[D.vis.s1[k]] && st.stOn[D.vis.s2[k]];
      ctx.fillStyle = on ? ink(0.75) : ink(0.14);
      const X = c[0] + D.vis.u[k] * sc, Y = c[1] - D.vis.v[k] * sc;
      ctx.fillRect(X, Y, 1, 1); ctx.fillRect(2 * c[0] - X, 2 * c[1] - Y, 1, 1);
    }
    ctx.fillStyle = ink(0.4); ctx.font = '9px ui-monospace, monospace';
    ctx.fillText('u–v coverage', x0, y0 - 4);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (st.invert) { ctx.fillStyle = '#f6f6f8'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'difference'; }
    if (st.mode === 'field') drawField();
    else if (st.mode === 'contour') drawContour();
    else if (st.mode === 'stipple') drawStipple();
    else drawScan();
    drawOverlays();
    ctx.globalCompositeOperation = 'source-over';
    readout();
  }

  function readout() {
    $('rSkies').textContent = nLive;
    $('rPhase').textContent = st.phase < 0.05 ? 'amplitudes only' : (st.phase > 0.85 ? 'closure phases, full weight' : 'closure phases, ' + (100 * st.phase).toFixed(0) + '% weight');
    $('rFlux').textContent = nLive ? liveFlux[0].toFixed(2) + ' – ' + liveFlux[1].toFixed(2) + ' Jy' : '—';
    let dis = 0; for (let i = 0; i < NP; i++) dis += spread[i];
    $('rSpread').textContent = nLive ? (dis / NP).toFixed(3) : '—';
    $('rCap').textContent = !st.register
      ? 'Unregistered: neither the amplitudes nor the closure phases can see absolute position, so every sky sits where its fit left it. That blur is a real ambiguity — about where, not about what.'
      : st.phase < 0.05
      ? 'Amplitudes cannot see position: every one of these skies stays legal wherever you slide it. The ring is not in this picture because it is not in this data.'
      : 'Closure phases are the only phase information that survives calibration. Slide them in and position returns.';
  }

  /* ---------- wiring ---------- */
  function bind(id, key, fmt, after) {
    const el = $(id), out = $(id + 'Out');
    el.value = st[key];
    if (out) out.textContent = fmt(st[key]);
    el.addEventListener('input', () => {
      st[key] = +el.value; if (out) out.textContent = fmt(st[key]);
      if (after) after(); else { reduce(); draw(); }
    });
  }
  function chips() {
    const box = $('stations'); box.innerHTML = '';
    M.stations.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'chip' + (st.stOn[i] ? ' on' : '');
      b.textContent = s;
      b.addEventListener('click', () => { st.stOn[i] = !st.stOn[i]; chips(); reduce(); draw(); });
      box.appendChild(b);
    });
  }
  function modes() {
    document.querySelectorAll('[data-mode]').forEach(b => {
      b.classList.toggle('on', b.dataset.mode === st.mode);
      b.onclick = () => { st.mode = b.dataset.mode; modes(); draw(); };
    });
  }
  function toggles() {
    document.querySelectorAll('[data-flag]').forEach(b => {
      b.classList.toggle('on', !!st[b.dataset.flag]);
      b.onclick = () => { st[b.dataset.flag] = st[b.dataset.flag] ? 0 : 1; toggles(); reduce(); draw(); };
    });
  }

  /* dev hook, same idea as the pedals' #panel: #mode=field&phase=0&beam=6 */
  if (location.hash.length > 1) {
    for (const kv of location.hash.slice(1).split('&')) {
      const [k, v] = kv.split('=');
      if (k in st && v !== undefined) st[k] = isNaN(+v) ? v : +v;
    }
  }
  bind('cPhase', 'phase', v => v.toFixed(2));
  bind('cChi', 'chiMax', v => '≤ ' + v.toFixed(0));
  bind('cFlux', 'fluxMax', v => '≤ ' + v.toFixed(1) + ' Jy');
  bind('cGamma', 'gamma', v => v.toFixed(2), () => draw());
  bind('cBlack', 'black', v => v.toFixed(2), () => draw());
  bind('cLevels', 'levels', v => v.toFixed(0), () => draw());
  bind('cDensity', 'density', v => v.toFixed(2), () => draw());
  bind('cSpread', 'spreadGain', v => v.toFixed(2), () => draw());
  bind('cBeam', 'beam', v => v.toFixed(0) + ' µas');
  bind('cZoom', 'zoom', v => v.toFixed(2) + '×', () => { layout(); draw(); });
  chips(); modes(); toggles();
  $('panelToggle').onclick = () => { document.body.classList.toggle('panel-hidden'); setTimeout(() => { layout(); draw(); }, 300); };
  window.addEventListener('resize', resize);
  reduce(); resize();
})();
