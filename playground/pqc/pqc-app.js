/* pqc-app.js — drawing half of site/pqc/index.html.
   Two views on one instrument. Everything solid on this page was decided in
   exact integer arithmetic; everything dashed is a heuristic that was asserted.
   No mark changes ink for any other reason. */
(function () {
  'use strict';
  const D = JSON.parse(document.getElementById('pqc-data').textContent);
  const R = D.reduce, HOF = D.hof, AUD = D.audit;
  const $ = id => document.getElementById(id);
  const st = { view: 'reduce', t: R.snaps.length - 1, playing: 0, gsa: 1, ghost: 1, trail: 1, wall: 1, decided: 1 };

  const cv = $('stage'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, PL = 0, PR = 0, PT = 0, PB = 0;
  const panelW = () => document.body.classList.contains('panel-hidden') ? 0 : Math.min(330, innerWidth * 0.88);
  function resize() {
    DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); layout(); draw();
  }
  function layout() {
    const avail = W - panelW();
    PL = Math.max(150, Math.min(avail * 0.37, 470)); PR = avail - Math.max(50, avail * 0.05);
    PT = Math.max(116, H * 0.15); PB = H - Math.max(215, H * 0.29);
  }
  const ink = a => `rgba(246,246,248,${a})`;
  const MONO = '9px ui-monospace,Menlo,monospace';

  /* ---------- view A: the reduction ---------- */
  const GH = R.final.norm / Number(R.final.ratioLo);          // for drawing only
  function drawReduce() {
    const s = R.snaps[st.t], n = R.dim;
    const all = R.snaps[0].profile.concat(R.gsa, s.profile);
    const hi = Math.max(...all), lo = Math.min(...R.gsa, ...s.profile) - 0.4;
    const top = st.ghost && st.t < 6 ? hi : Math.max(...s.profile, ...R.gsa) + 0.5;
    const X = i => PL + (i / (n - 1)) * (PR - PL);
    const Y = v => PB - (v - lo) / (top - lo) * (PB - PT);

    ctx.strokeStyle = ink(0.15); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PL, PT); ctx.lineTo(PL, PB); ctx.lineTo(PR, PB); ctx.stroke();
    ctx.font = MONO; ctx.fillStyle = ink(0.4); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let g = Math.ceil(lo); g <= top; g += Math.max(1, Math.round((top - lo) / 8))) {
      ctx.strokeStyle = ink(0.05); ctx.beginPath(); ctx.moveTo(PL, Y(g)); ctx.lineTo(PR, Y(g)); ctx.stroke();
      ctx.fillText('10^' + g, PL - 8, Y(g));
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillStyle = ink(0.45);
    ctx.fillText('‖b*ᵢ‖  — the Gram–Schmidt profile, from exact integer determinants', PL, PT - 16);

    /* where it started */
    if (st.ghost) {
      ctx.strokeStyle = ink(0.16); ctx.lineWidth = 1; ctx.setLineDash([2, 3]);   // a ghost is a guide
      ctx.beginPath(); R.snaps[0].profile.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))); ctx.stroke();
      ctx.setLineDash([]);
    }
    /* the heuristic — asserted, never proved, so it is dashed */
    if (st.gsa) {
      ctx.strokeStyle = ink(0.62); ctx.lineWidth = 1.3; ctx.setLineDash([5, 4]);   // asserted, never proved
      ctx.beginPath(); R.gsa.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ink(0.5); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('the geometric series assumption, δ₀ = ' + R.d0, X(2), Y(R.gsa[2]) - 7);
    }
    /* what the reduction actually reached — measured, so it is solid */
    ctx.strokeStyle = ink(0.95); ctx.lineWidth = 1.8;
    ctx.beginPath(); s.profile.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))); ctx.stroke();
    for (let i = 0; i < n; i++) { ctx.fillStyle = ink(0.9); ctx.beginPath(); ctx.arc(X(i), Y(s.profile[i]), 1.7, 0, 7); ctx.fill(); }

    /* the shortest vector so far, exactly, on its own strip */
    /* the profile falls left to right, so the top right corner is always free —
       the running exact norm goes there rather than under the readouts */
    const IW = Math.min(300, (PR - PL) * 0.42), SH = 58;
    const IX = PR - IW, SY = PT + 14;
    const logs = R.snaps.map(z => Math.log10(Math.max(z.minNorm, 1)));
    const l0 = Math.max(...logs), l1 = Math.min(...logs);
    const SX = i => IX + (i / (R.snaps.length - 1)) * IW;
    const SYy = v => SY + SH - (v - l1) / (l0 - l1) * SH;
    ctx.fillStyle = 'rgba(10,10,12,0.72)'; ctx.fillRect(IX - 10, SY - 12, IW + 20, SH + 42);
    ctx.strokeStyle = ink(0.12); ctx.beginPath(); ctx.moveTo(IX, SY + SH); ctx.lineTo(IX + IW, SY + SH); ctx.stroke();
    ctx.strokeStyle = ink(0.55); ctx.lineWidth = 1.2; ctx.beginPath();
    logs.forEach((v, i) => { if (i > st.t) return; i ? ctx.lineTo(SX(i), SYy(v)) : ctx.moveTo(SX(i), SYy(v)); });
    ctx.stroke();
    ctx.fillStyle = ink(0.95); ctx.beginPath(); ctx.arc(SX(st.t), SYy(logs[st.t]), 2.6, 0, 7); ctx.fill();
    ctx.font = MONO; ctx.fillStyle = ink(0.42); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('shortest ‖v‖, exact at every step', IX, SY + SH + 6);
    ctx.fillText(logs[0].toFixed(0) + ' decades → ' + logs[logs.length - 1].toFixed(1), IX, SY + SH + 18);

    $('rA').textContent = `step ${s.step} · ${s.swaps} swaps`;
    $('rB').textContent = st.t === R.snaps.length - 1 ? R.final.norm.toFixed(1) : s.minNorm.toExponential(2);
    $('rC').textContent = st.t === R.snaps.length - 1 ? `${R.final.ratioLo} → ${R.final.verdict}` : '—';
    $('rD').textContent = `${R.dim} · q has ${R.qDigits} digits`;
    $('rCap').textContent = st.t === R.snaps.length - 1
      ? `LLL finished. It found a vector of norm ${R.final.norm.toFixed(1)}, and that vector is ${R.final.ratioLo} times the Gaussian heuristic — decided in exact rational arithmetic, and REFUSED at the 1.05 wall. The published record at this dimension is 1273. LLL alone does not get into the hall of fame, and the gap between the solid line and the dashed one is the part the heuristic did not predict.`
      : `The solid profile is what the reduction has actually reached, computed as ratios of exact Gram determinants. The dashed line is what the geometric series assumption says it should reach. Nothing is estimated on the solid side and nothing is proved on the dashed one.`;
  }

  /* ---------- view B: the wall ---------- */
  function drawWall() {
    const dims = HOF.map(r => r.n), rats = HOF.map(r => r.ratio);
    const x0 = Math.min(...dims) - 4, x1 = Math.max(...dims) + 4;
    const y0 = Math.min(...rats) - 0.01, y1 = 1.062;
    const X = v => PL + (v - x0) / (x1 - x0) * (PR - PL);
    const Y = v => PB - (v - y0) / (y1 - y0) * (PB - PT);
    ctx.strokeStyle = ink(0.15); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PL, PT); ctx.lineTo(PL, PB); ctx.lineTo(PR, PB); ctx.stroke();
    ctx.font = MONO; ctx.fillStyle = ink(0.4);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let g = 0.7; g <= 1.06; g += 0.05) { ctx.fillText(g.toFixed(2), PL - 8, Y(g)); ctx.strokeStyle = ink(0.05); ctx.beginPath(); ctx.moveTo(PL, Y(g)); ctx.lineTo(PR, Y(g)); ctx.stroke(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let g = 40; g <= 210; g += 20) ctx.fillText(String(g), X(g), PB + 8);
    ctx.fillStyle = ink(0.45); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText('‖v‖ / GH   — every record in the hall of fame', PL, PT - 16);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('dimension', (PL + PR) / 2, PB + 26);

    /* the wall: a hard acceptance threshold, so it is drawn solid */
    if (st.wall) {
      ctx.strokeStyle = ink(0.8); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(PL, Y(1.05)); ctx.lineTo(PR, Y(1.05)); ctx.stroke();
      ctx.fillStyle = ink(0.75); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText('1.05 · GH — the acceptance wall', PR, Y(1.05) - 5);
    }
    for (const r of HOF) {
      ctx.fillStyle = ink(0.30);
      ctx.beginPath(); ctx.arc(X(r.n), Y(r.ratio), 1.5, 0, 7); ctx.fill();
    }
    /* the ones decided exactly: their whole consistency window is drawn */
    if (st.decided) for (const a of AUD) {
      const lo = Number(a.window[0]), hi = Number(a.window[1]);
      ctx.strokeStyle = ink(0.95); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(X(a.n), Y(lo)); ctx.lineTo(X(a.n), Y(hi)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(a.n) - 3.5, Y(lo)); ctx.lineTo(X(a.n) + 3.5, Y(lo));
      ctx.moveTo(X(a.n) - 3.5, Y(hi)); ctx.lineTo(X(a.n) + 3.5, Y(hi)); ctx.stroke();
      if (a.vN === 'ADMISSIBLE' && a.vHi !== 'ADMISSIBLE') {
        ctx.fillStyle = ink(1); ctx.beginPath(); ctx.arc(X(a.n), Y(a.ratio), 4, 0, 7); ctx.fill();
        ctx.strokeStyle = ink(0.9); ctx.beginPath(); ctx.arc(X(a.n), Y(a.ratio), 8, 0, 7); ctx.stroke();
        /* centred over the marker and clamped inside the plot — choosing a side
           only moves which edge the text falls off */
        const msg = `dim ${a.n} straddles the wall — undecidable from published data`;
        ctx.font = MONO; ctx.fillStyle = ink(0.9);
        const half = ctx.measureText(msg).width / 2 + 4;
        const tx = Math.max(PL + half, Math.min(PR - half, X(a.n)));
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(msg, tx, Y(a.ratio) - 13);
        ctx.strokeStyle = ink(0.45); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(a.n), Y(a.ratio) - 10); ctx.lineTo(tx, Y(a.ratio) - 11); ctx.stroke();
      }
    }
    $('rA').textContent = `${HOF.length} records`;
    $('rB').textContent = `${AUD.length} decided exactly`;
    $('rC').textContent = `0 inconsistent`;
    $('rD').textContent = `dims ${Math.min(...dims)}–${Math.max(...dims)}`;
    $('rCap').textContent = 'Each dot is a published record; the bar through the decided ones is the whole range of ratios consistent with a norm that prints as the integer it prints. Every one contains the published figure, so the field’s arithmetic holds up. One record’s bar crosses the wall, and that one cannot be decided from published data at all.';
  }

  function draw() { ctx.clearRect(0, 0, W, H); (st.view === 'reduce' ? drawReduce : drawWall)(); }

  /* ---------- wiring ---------- */
  let timer = null;
  function play(on) {
    st.playing = on ? 1 : 0;
    if (timer) { clearInterval(timer); timer = null; }
    if (on) timer = setInterval(() => {
      st.t = (st.t + 1) % R.snaps.length;
      $('cT').value = st.t; draw();
      if (st.t === R.snaps.length - 1) play(false), sync();
    }, 55);
    sync();
  }
  function sync() {
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === st.view));
    document.querySelectorAll('[data-flag]').forEach(b => b.classList.toggle('on', !!st[b.dataset.flag]));
    $('playBtn').textContent = st.playing ? 'pause' : 'play';
    $('playBtn').classList.toggle('on', !!st.playing);
    $('reduceOnly').style.display = st.view === 'reduce' ? '' : 'none';
    $('wallOnly').style.display = st.view === 'wall' ? '' : 'none';
    $('cTOut').textContent = `${st.t + 1} / ${R.snaps.length}`;
  }
  /* dev hook, as on the other instruments: #view=wall&t=40&gsa=0 */
  if (location.hash.length > 1) {
    for (const kv of location.hash.slice(1).split('&')) {
      const [k, v] = kv.split('=');
      if (k in st && v !== undefined) st[k] = isNaN(+v) ? v : +v;
    }
    st.t = Math.max(0, Math.min(R.snaps.length - 1, st.t));
  }
  document.querySelectorAll('[data-view]').forEach(b => { b.onclick = () => { st.view = b.dataset.view; play(false); sync(); draw(); }; });
  document.querySelectorAll('[data-flag]').forEach(b => { b.onclick = () => { st[b.dataset.flag] = st[b.dataset.flag] ? 0 : 1; sync(); draw(); }; });
  $('cT').max = R.snaps.length - 1; $('cT').value = st.t;
  $('cT').addEventListener('input', () => { st.t = +$('cT').value; play(false); draw(); sync(); });
  $('playBtn').onclick = () => { if (!st.playing && st.t === R.snaps.length - 1) st.t = 0; play(!st.playing); draw(); };
  $('panelToggle').onclick = () => { document.body.classList.toggle('panel-hidden'); setTimeout(() => { layout(); draw(); }, 300); };
  addEventListener('resize', resize);
  sync(); resize();
})();
