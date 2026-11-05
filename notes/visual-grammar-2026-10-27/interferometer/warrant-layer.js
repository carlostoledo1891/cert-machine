/* WARRANT v2 layer over the live instrument. Greyscale like the page; red is the only accent and marks only an
   exhibited counterexample. Nothing in the instrument's own drawing changes except the contours, which are drawn
   dotted while the grammar is on, because the mean of picks is itself a pick. */
(function () {
  'use strict';
  const I = window.__inst; if (!I) return;
  const D = I.D, M = D.meta, st = I.st;
  const N = M.N, NP = N * N, K = D.vis.u.length, UAS = 4.84813681109536e-12, RF = M.fov * UAS, ST = M.stations;
  const RED = '#e0574e', inkA = a => `rgba(246,246,248,${a})`;
  const DELTA = { AA: 0.05, AX: 0.055, MG: 0.035, MM: 0.07, LM: 0.26, SW: 0.075, PV: 0.05, GL: 0.10 };
  const SWEEP = __SWEEP__;
  const W = { on: 1, lid: 1, witness: 0, void: 0, H: { model: 'station', nsig: 3, out: 0 }, broken: [], live: [] };

  /* |V_k| of a sky on the grid, exactly the instrument's convention, separable in l and m */
  const co = Float64Array.from({ length: N }, (_, i) => -RF + (2 * RF * i) / (N - 1)), cu = Array.from(co, c => c / UAS);
  const Eu = new Float64Array(K * N * 2), Ev = new Float64Array(K * N * 2);
  for (let k = 0; k < K; k++) for (let i = 0; i < N; i++) {
    const a = -2 * Math.PI * D.vis.u[k] * co[i], b = -2 * Math.PI * D.vis.v[k] * co[i], o = (k * N + i) * 2;
    Eu[o] = Math.cos(a); Eu[o + 1] = Math.sin(a); Ev[o] = Math.cos(b); Ev[o + 1] = Math.sin(b);
  }
  function vis(w) {
    const nz = []; for (let j = 0; j < N; j++) { const l = []; for (let i = 0; i < N; i++) if (w[j * N + i]) l.push(i); nz.push(l); }
    const out = new Float64Array(K);
    for (let k = 0; k < K; k++) {
      let re = 0, im = 0; const ok = k * N * 2;
      for (let j = 0; j < N; j++) {
        const l = nz[j]; if (!l.length) continue; let sr = 0, si = 0;
        for (const i of l) { const v = w[j * N + i]; sr += v * Eu[ok + 2 * i]; si += v * Eu[ok + 2 * i + 1]; }
        const c = Ev[ok + 2 * j], s = Ev[ok + 2 * j + 1]; re += sr * c - si * s; im += sr * s + si * c;
      }
      out[k] = Math.hypot(re, im);
    }
    return out;
  }
  /* each 8-bit record is an enclosure: every pixel within peak/510, so every |V| within E */
  const decode = x => { const b = atob(x.b64), w = new Float64Array(NP); for (let i = 0; i < NP; i++) w[i] = (b.charCodeAt(i) / 255) * x.peak; return { w, E: (NP * x.peak) / 510 }; };
  const RECS = D.members.map(m => Object.assign({ meta: m, kind: 'pick' }, decode(m))).concat(D.ceiling.map(c => Object.assign({ meta: c, kind: 'witness' }, decode(c))));
  function Avec(h) {
    const A = new Float64Array(K);
    for (let k = 0; k < K; k++) { const amp = D.vis.amp[k], num = amp + h.nsig * D.vis.sig[k]; A[k] = h.model === 'add' ? num + M.gain * amp : num / ((1 - DELTA[ST[D.vis.s1[k]]]) * (1 - DELTA[ST[D.vis.s2[k]]])); }
    return A;
  }
  function judge(V, E, A, out) {
    const br = []; let und = 0, worst = 0, wk = 0;
    for (let k = 0; k < K; k++) { const r = V[k] / A[k]; if (r > worst) { worst = r; wk = k; } if (V[k] - E > A[k]) br.push(k); else if (V[k] + E > A[k]) und++; }
    return { v: br.length > out ? 'R' : br.length + und <= out ? 'C' : 'X', br, und, worst, wk };
  }
  const LIDS = [
    { h: { model: 'station', nsig: 3, out: 0 }, rows: SWEEP.map(r => ({ r: r.r0, lo: r.witness, hi: r.ceiling })) },
    { h: { model: 'add', nsig: 3, out: 0 }, rows: D.ceiling.map(c => ({ r: c.r0, lo: c.value, hi: c.upper })) },
  ];
  LIDS.forEach(L => { L.A = Avec(L.h); });
  function lidFor(h) {   /* a lid carries over to any hypothesis stricter on every row; the tightest one wins */
    if (h.out > 0) return null;
    const A = Avec(h), ok = LIDS.filter(L => { for (let k = 0; k < K; k++) if (A[k] > L.A[k]) return false; return true; });
    if (!ok.length) return null;
    return { rows: [6, 12, 20, 28].map(r => ({ r, hi: Math.min(...ok.map(L => L.rows.find(q => q.r === r).hi)) })), own: ok.some(L => L.h.model === h.model && L.h.nsig === h.nsig) };
  }
  const hName = h => `${h.model === 'station' ? 'per-station gains' : 'additive 5% gains'} · ${h.nsig}σ · ${h.out ? 'up to ' + h.out + ' rows may break' : 'every row'}`;

  /* the witness, as a red ghost over the sky */
  const wit = RECS.find(r => r.kind === 'witness' && r.meta.r0 === 6);
  const ghost = document.createElement('canvas'); ghost.width = ghost.height = N;
  { const g = ghost.getContext('2d'), img = g.createImageData(N, N); let pk = 0; for (const v of wit.w) if (v > pk) pk = v;
    /* only the witness's bright structure: red is scarce, so the faint wash stays unpainted */
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const p = ((N - 1 - j) * N + i) * 4, a = Math.max(0, (wit.w[j * N + i] / pk - 0.35) / 0.65);
      img.data[p] = 224; img.data[p + 1] = 87; img.data[p + 2] = 78; img.data[p + 3] = Math.round(230 * Math.sqrt(a)); }
    g.putImageData(img, 0, 0); }

  /* hooks the instrument calls */
  window.__Wdash = [1, 2.5];
  window.__W = (ctx, c, scale, OX, OY, SQ) => {
    if (!W.on) return;
    ctx.save();
    if (W.witness) {
      ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 0.9; ctx.drawImage(ghost, OX, OY, SQ, SQ); ctx.globalAlpha = 1;
      ctx.strokeStyle = RED; ctx.lineWidth = 1.5; ctx.setLineDash([4, 2]); ctx.beginPath(); ctx.arc(c[0], c[1], 6 * scale, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = RED; ctx.font = '11px ui-monospace, monospace';
      ctx.fillText('witness: 0.140 Jy inside 6 µas', c[0] + 6 * scale + 8, c[1] + 4);
    }
    const lid = lidFor(W.H);
    if (W.lid) {
      ctx.lineWidth = 1; ctx.setLineDash([4, 2]);
      [6, 12, 20, 28].forEach((r, n) => {
        ctx.strokeStyle = inkA(lid ? 0.55 : 0.18); ctx.beginPath(); ctx.arc(c[0], c[1], r * scale, 0, 7); ctx.stroke();
        if (lid) { ctx.fillStyle = inkA(0.62); ctx.font = 'italic 10px ui-monospace, monospace';
          const a = -Math.PI / 4 - n * 0.16; ctx.fillText('≤ ' + lid.rows[n].hi.toFixed(3) + ' Jy', c[0] + Math.cos(a) * r * scale + 5, c[1] + Math.sin(a) * r * scale); }
      });
      ctx.setLineDash([]);
    }
    if (W.void) {
      const R = 7 * scale; ctx.save(); ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, 7); ctx.clip();
      ctx.strokeStyle = inkA(0.45); ctx.lineWidth = 1;
      for (let x = -R * 2; x < R * 2; x += 6) { ctx.beginPath(); ctx.moveTo(c[0] + x, c[1] - R); ctx.lineTo(c[0] + x + 2 * R, c[1] + R); ctx.stroke(); }
      ctx.restore(); ctx.strokeStyle = inkA(0.5); ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, 7); ctx.stroke();
      ctx.fillStyle = inkA(0.7); ctx.font = '11px ui-monospace, monospace'; ctx.fillText('where: VOID', c[0] + R + 8, c[1] - R);
    }
    ctx.fillStyle = inkA(0.5); ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'right'; ctx.fillText('drawn: the mean of ' + W.live.length + ' picks · CHOSEN, so its contours are dotted', OX + SQ, OY - 8); ctx.textAlign = 'left';
    ctx.restore();
  };
  window.__Wuv = (ctx, c, sc) => {
    if (!W.on || !W.broken.length) return;
    ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 1.4;
    for (const k of W.broken) for (const s of [1, -1]) {
      const X = c[0] + s * D.vis.u[k] * sc, Y = c[1] - s * D.vis.v[k] * sc;
      ctx.beginPath(); ctx.moveTo(X - 3, Y - 3); ctx.lineTo(X + 3, Y + 3); ctx.moveTo(X + 3, Y - 3); ctx.lineTo(X - 3, Y + 3); ctx.stroke();
    }
    ctx.restore();
  };

  /* the panel group */
  const grp = document.getElementById('w-grp'), read = document.getElementById('w-read'), note = document.getElementById('w-note');
  let V = null;   /* every record's |V|, computed once after the first paint */
  const chip = (s) => `<svg width="26" height="8" viewBox="0 0 26 8" style="vertical-align:middle;margin-right:6px"><line x1="1" y1="4" x2="25" y2="4" stroke="rgba(246,246,248,.8)" stroke-width="2" ${s === 2 ? 'stroke-dasharray="4 2"' : s === 1 ? 'stroke-dasharray="1 5" stroke-dashoffset="-1.5" stroke-linecap="round"' : ''}/></svg>`;
  function update() {
    W.live = RECS.map((r, i) => i).filter(i => I.weightOf(I.ALL[i]) > 0.02);
    const A = Avec(W.H), lid = lidFor(W.H);
    let html = `<div class="w-row">${chip(1)}<b>drawn</b> the mean of ${W.live.length} picks: CHOSEN</div>`;
    html += `<div class="w-row">${chip(2)}<b>the lid</b> COMPUTED, grid-checked in floating point · <em>given ${hName(W.H)}</em>${lid ? '' : ' · <span>no lid holds: re-solve the dual</span>'}</div>`;
    if (V) {
      const picks = W.live.filter(i => RECS[i].kind === 'pick'), js = picks.map(i => judge(V[i], RECS[i].E, A, W.H.out));
      const bad = js.filter(j => j.v === 'R'), set = new Set(); bad.forEach(j => j.br.forEach(k => set.add(k))); W.broken = [...set];
      const worst = js.reduce((a, j) => (j.worst > a.worst ? j : a), { worst: 0, wk: 0 });
      html += `<div class="w-row">${chip(2)}<b>checked here</b> ${bad.length ? `<span class="wx">×</span> ` : ''}${bad.length} of ${picks.length} drawn picks break the one-sided ceilings${bad.length ? ` at ${Math.min(...bad.map(j => j.br.length))}–${Math.max(...bad.map(j => j.br.length))} rows, worst ×${worst.worst.toFixed(2)} on ${ST[D.vis.s1[worst.wk]]}–${ST[D.vis.s2[worst.wk]]}: the red × on the u–v plane` : ''} · <em>given ${hName(W.H)}</em></div>`;
      const wj = judge(V[RECS.indexOf(wit)], wit.E, A, W.H.out);
      html += `<div class="w-row">${chip(2)}<b>the witness</b> <span class="wx">×</span> refutes “the amplitudes force a dark centre”; ${wj.v === 'R' ? 'but breaks this hypothesis' : 'breaks no row beyond the rounding of its 8-bit copy'}</div>`;
      if (note) note.innerHTML = bad.length ? `<span class="wx">×</span> Checked against the one-sided ceilings, ${bad.length} of these ${picks.length} break some rows: the red × on the u–v plane. Here “allow” means a two-sided χ² fit.` : '';
    } else html += '<div class="w-row">checking every drawn sky against 838 ceilings…</div>';
    html += `<div class="w-row">${chip(0).replace('<line', '<rect x="1" y="1" width="24" height="6" fill="none" stroke="rgba(246,246,248,.5)"/><line stroke-opacity="0"')}<b>where</b> VOID: amplitudes and closure phases cannot locate the source</div>`;
    read.innerHTML = html;
    grp.querySelectorAll('[data-w]').forEach(b => b.classList.toggle('on', !!W[b.dataset.w]));
  }
  grp.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => {
    W[b.dataset.w] = W[b.dataset.w] ? 0 : 1; window.__Wdash = W.on ? [1, 2.5] : null; update(); I.draw();
  }));
  ['w-model', 'w-n', 'w-o'].forEach(id => document.getElementById(id).addEventListener('change', () => {
    W.H = { model: document.getElementById('w-model').value, nsig: +document.getElementById('w-n').value, out: +document.getElementById('w-o').value }; update(); I.draw();
  }));
  /* recheck whenever the instrument redraws with a different live set */
  const draw0 = I.draw; let lastLive = '';
  I.onDraw = () => { const live = RECS.map((r, i) => i).filter(i => I.weightOf(I.ALL[i]) > 0.02).join(','); if (live !== lastLive) { lastLive = live; update(); } };
  update(); I.draw();
  setTimeout(() => { V = RECS.map(r => vis(r.w)); update(); I.draw(); }, 60);
})();
