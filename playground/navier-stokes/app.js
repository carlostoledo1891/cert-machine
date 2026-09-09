/* app.js — the whole of /instruments/navier-stokes: one canvas, the size of the window.
   Inlined by playground/navier-stokes/build.js.

   THE FIELD IS SELF-SIMILAR, so it is computed ONCE per h on a grid in the paper's own
   coordinates (√X, η) and read by lookup afterwards. Every tracer is advected in physical
   space by u = q^{−A}·F(X, η) with q(z,τ) solved by three Newton steps inline. That is what
   makes several thousand tracers possible at sixty frames a second, and it is also the
   mathematics: the whole construction is one profile and a scaling.

   THREE KINDS OF MARK, and the readout says which:
     DECIDED   every verdict about h — exact rational inequalities decided with BigInt.
     COMPUTED  the exterior integral and the pulse equation, residual shown.
     DRAWN     the tracers and the glow: the paper's scalings and exact incompressibility,
               profile shapes chosen to be legible. No fluid is integrated here. */
(function () {
  'use strict';
  const S = JSON.parse(document.getElementById('ns-scene').textContent);
  const $ = (id) => document.getElementById(id);
  const HD = 1000n;

  /* ------------------------------------------------------------------ exact rationals */
  const gcd = (a, b) => (b ? gcd(b, a % b) : (a < 0n ? -a : a));
  function Q(n, d) { if (d < 0n) { n = -n; d = -d; } const k = gcd(n < 0n ? -n : n, d) || 1n; return { n: n / k, d: d / k }; }
  const qcmp = (a, b) => { const l = a.n * b.d, r = b.n * a.d; return l < r ? -1 : l > r ? 1 : 0; };
  const qnum = (q) => Number(q.n) / Number(q.d);
  const at = (e, hn) => Q(BigInt(e.n0) * HD + BigInt(e.n1) * hn, BigInt(e.d) * HD);
  const CMP = { '<': (a, b) => qcmp(a, b) < 0, '<=': (a, b) => qcmp(a, b) <= 0, '>': (a, b) => qcmp(a, b) > 0, '>=': (a, b) => qcmp(a, b) >= 0 };
  const qtext = (q) => (q.d === 1n ? String(q.n) : String(q.n) + '/' + String(q.d));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ------------------------------------------------------------------ state */
  const st = {
    hn: 10n, logTau: -0.6, playing: true, speed: 0.17,
    follow: true, axisym: false, tracers: true, panel: null, zoom: 0,
  };
  const h = () => Number(st.hn) / 1000;
  const tau = () => Math.pow(10, st.logTau);
  const Dexp = () => 0.5 - h(), Aexp = () => 0.5 + h();
  const Xa = 0.55, Xb = 1.9, Xc = 2.6;
  const ext = (t) => ({ lr: Math.sqrt(2 * Xc * t), lz: Math.pow(t, 0.5 - h()) });

  /* ------------------------------------------------------------------ the profile, once per h */
  const GN = 150, GM = 112, GX = 2.0, GY = 1.25;
  let F = null, Fh = -1;
  const Eprof = (X, hh) => Math.sqrt(2 * X) / Math.pow(1 + X, 1 + hh);
  const Uprof = (X, eta) => 2.4 * Math.exp(-X) * eta * Math.max(0, 1 - eta * eta);
  function buildField() {
    const hh = h();
    const fr = new Float32Array(GN * GM), fz = new Float32Array(GN * GM), fs = new Float32Array(GN * GM);
    for (let j = 0; j < GM; j++) {
      const eta = -GY + 2 * GY * j / (GM - 1), de = 2 * GY / (GM - 1);
      let acc = 0, Xprev = 0;
      for (let i = 0; i < GN; i++) {
        const sx = GX * i / (GN - 1), X = sx * sx, k = j * GN + i;
        fz[k] = Uprof(X, eta);
        fs[k] = Eprof(X, hh);
        const dU = (Uprof(X, Math.min(GY, eta + de)) - Uprof(X, Math.max(-GY, eta - de))) / (2 * de);
        acc += -dU * (X - Xprev); Xprev = X;
        fr[k] = X > 1e-9 ? acc / Math.sqrt(2 * X) : 0;   /* u_r = V0/r, incompressibility exactly */
      }
    }
    F = { fr, fz, fs }; Fh = hh;
  }
  function sample(arr, sx, eta) {
    const u = Math.min(GN - 1.001, Math.max(0, sx / GX * (GN - 1)));
    const v = Math.min(GM - 1.001, Math.max(0, (eta + GY) / (2 * GY) * (GM - 1)));
    const i = u | 0, j = v | 0, a = u - i, b = v - j, k = j * GN + i;
    return arr[k] * (1 - a) * (1 - b) + arr[k + 1] * a * (1 - b) + arr[k + GN] * (1 - a) * b + arr[k + GN + 1] * a * b;
  }
  function qOf(z, t, hh, D) {
    let q = t + Math.pow(Math.abs(z), 1 / D);
    if (!(q > 0)) return 1e-300;
    for (let k = 0; k < 3; k++) {
      const p = Math.pow(q, 2 * hh);
      const f = q - z * z * p - t, fp = 1 - 2 * hh * z * z * p / q;
      q -= f / (fp || 1);
      if (!(q > 0)) return 1e-300;
    }
    return q;
  }

  /* ------------------------------------------------------------------ canvas */
  const cv = $('ns-cv'), ctx = cv.getContext('2d', { alpha: false });
  /* THE TRAILS LIVE ON THEIR OWN LAYER. Painting the glow over the main canvas every frame
     erased them; the trail canvas fades on its own and is composited with 'lighter', so the
     tracers add light to the glow instead of being wiped by it. */
  const tcv = document.createElement('canvas');
  let tctx = tcv.getContext('2d');
  let W = 0, H = 0, DPR = 1, glow = null, glowKey = '';
  function fit() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    tcv.width = cv.width; tcv.height = cv.height;
    tctx = tcv.getContext('2d');
    tctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    tctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, W, H);
    glowKey = '';
  }

  /* ------------------------------------------------------------------ tracers */
  const NP = 4600;
  const pr = new Float32Array(NP), pz = new Float32Array(NP), pa = new Float32Array(NP);
  /* seeds are placed in the CORE'S OWN units, so the swarm follows the collapse instead of
     being left behind by it — and biased inward, because that is where the picture is. */
  function seed(i, wide) {
    const e = ext(tau()), u = Math.random();
    const rr = e.lr * (wide ? (0.8 + 2.6 * u * u) : (0.12 + 1.5 * u));
    pr[i] = rr * (Math.random() < 0.5 ? 1 : -1);
    pz[i] = e.lz * (Math.random() * 2 - 1) * (wide ? 2.2 : 1.0);
    pa[i] = Math.random() * 0.85;
  }
  for (let i = 0; i < NP; i++) seed(i, true);

  /* ------------------------------------------------------------------ the glow */
  function paintGlow(scale) {
    const key = [h(), W, H, Math.round(Math.log10(scale) * 30), Math.round(st.logTau * 30)].join('|');
    if (glowKey !== key) {
      const NX = 190, NY = Math.max(90, Math.round(190 * H / W));
      const off = document.createElement('canvas'); off.width = NX; off.height = NY;
      const octx = off.getContext('2d'), img = octx.createImageData(NX, NY);
      const halfW = W / 2 / scale, halfH = H / 2 / scale;
      const t = tau(), hh = h(), D = Dexp(), A = Aexp();
      let vmax = 0; const buf = new Float32Array(NX * NY);
      for (let j = 0; j < NY; j++) {
        const z = halfH - (j + 0.5) / NY * 2 * halfH;
        const q = qOf(z, t, hh, D), qA = Math.pow(q, -A), qD = Math.pow(q, D), sq = Math.sqrt(2 * q);
        for (let i = 0; i < NX; i++) {
          const r = Math.abs((i + 0.5) / NX * 2 * halfW - halfW);
          const sx = Math.min(GX, r / sq), et = Math.max(-GY, Math.min(GY, z / qD));
          const a1 = sample(F.fs, sx, et), a2 = sample(F.fz, sx, et), a3 = sample(F.fr, sx, et);
          const v = qA * Math.sqrt(a1 * a1 + a2 * a2 + a3 * a3);
          buf[j * NX + i] = v; if (v > vmax && isFinite(v)) vmax = v;
        }
      }
      for (let k = 0; k < NX * NY; k++) {
        /* a steep curve: the 1/r tail of the swirl is real and reaches the whole frame, but
           at a gentle exponent it reads as fog. 2.6 keeps the tail visible and lets the core
           dominate, which is what the eye needs and what the mathematics says. */
        const u = vmax > 0 ? Math.pow(Math.min(1, buf[k] / vmax), 2.3) : 0;
        img.data[4 * k] = 228; img.data[4 * k + 1] = 232; img.data[4 * k + 2] = 242;
        img.data[4 * k + 3] = Math.round(178 * u);
      }
      octx.putImageData(img, 0, 0);
      glow = off; glowKey = key;
    }
    ctx.save(); ctx.globalAlpha = 0.95; ctx.drawImage(glow, 0, 0, W, H); ctx.restore();
  }

  /* ------------------------------------------------------------------ the frame */
  let last = 0, fps = 60, frames = 0, fpsT = 0, hudT = 0;
  const PULSES = 9;
  const pulseCount = (t) => Math.max(3, Math.min(190, Math.round(Math.SQRT2 * (Math.sqrt(Xb) - Math.sqrt(Xa)) * Math.pow(t, -h() / 2) * PULSES)));

  function draw(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    if (st.playing) {
      st.logTau -= st.speed * dt;
      if (st.logTau < -13) { st.logTau = -0.15; for (let i = 0; i < NP; i++) seed(i, true); }
      $('sc').value = st.logTau;
    }
    if (Fh !== h()) { buildField(); glowKey = ''; }
    const t = tau(), e = ext(t), hh = h(), A = Aexp(), D = Dexp();

    const base = 0.34 * Math.min(W, H);
    const target = st.follow ? base / e.lr : base / 1.0;
    if (!st.zoom) st.zoom = target;
    st.zoom += (target - st.zoom) * Math.min(1, dt * 3.2);
    const scale = st.zoom, cx = W / 2, cy = H / 2;
    const PX = (r) => cx + r * scale, PY = (z) => cy - z * scale;

    ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, W, H);
    paintGlow(scale);

    /* the trail layer fades on its own */
    tctx.globalCompositeOperation = 'destination-out';
    tctx.fillStyle = 'rgba(0,0,0,' + (st.tracers ? 0.055 : 1) + ')';
    tctx.fillRect(0, 0, W, H);
    tctx.globalCompositeOperation = 'source-over';

    if (st.tracers) {
      const dtau = Math.max(1e-19, t * 0.013);
      for (let i = 0; i < NP; i++) {
        const r = pr[i], z = pz[i], ar = Math.abs(r), sg = r < 0 ? -1 : 1;
        const q = qOf(z, t, hh, D);
        const sx = ar / Math.sqrt(2 * q), eta = z / Math.pow(q, D);
        if (!(sx <= GX) || !(Math.abs(eta) <= GY)) { pa[i] += dt * 0.6; if (pa[i] > 1) seed(i, true); continue; }
        const qA = Math.pow(q, -A);
        const ur = qA * sample(F.fr, sx, eta), uz = qA * sample(F.fz, sx, eta);
        const nr = ar + ur * dtau, nz = z + uz * dtau;
        pa[i] += dt * 0.30;
        if (pa[i] > 1 || !(nr > e.lr * 0.004) || Math.abs(nz) > 8 * e.lz || nr > 8 * e.lr) { seed(i, Math.random() < 0.5); continue; }
        const x0 = PX(sg * ar), y0 = PY(z), x1 = PX(sg * nr), y1 = PY(nz);
        pr[i] = sg * nr; pz[i] = nz;
        if (x1 < -30 || x1 > W + 30 || y1 < -30 || y1 > H + 30) continue;
        const sp = Math.min(1, Math.hypot(ur, uz) * Math.pow(t, A) / 3.2);
        const g = Math.round(210 + 46 * sp);
        tctx.strokeStyle = 'rgba(' + g + ',' + g + ',' + Math.min(255, g + 6) + ','
          + ((0.18 + 0.72 * sp) * (1 - pa[i] * pa[i])).toFixed(3) + ')';
        tctx.lineWidth = 0.7 + 1.5 * sp;
        tctx.beginPath(); tctx.moveTo(x0, y0); tctx.lineTo(x1, y1); tctx.stroke();
      }
    }

    /* the tracers, added as light */
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(tcv, 0, 0, W, H); ctx.restore();

    /* the geometry the exponents fix */
    const ra = Math.sqrt(2 * Xa * t), rb = Math.sqrt(2 * Xb * t);
    ctx.strokeStyle = 'rgba(246,246,248,0.24)'; ctx.lineWidth = 1;
    ctx.strokeRect(PX(-e.lr), PY(e.lz), 2 * e.lr * scale, 2 * e.lz * scale);
    if (!st.axisym) {
      const n = pulseCount(t); ctx.lineWidth = 0.8;
      for (let k = 0; k < n; k++) for (const s of [1, -1]) {
        const x = PX(s * (ra + (rb - ra) * (k + 0.5) / n));
        if (x < -8 || x > W + 8) continue;
        ctx.strokeStyle = 'rgba(226,230,240,' + (0.05 + 0.16 * Math.abs(Math.sin(k * 1.7 + ts * 0.004))).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(x, PY(e.lz)); ctx.lineTo(x, PY(-e.lz)); ctx.stroke();
      }
    }
    ctx.fillStyle = '#f6f6f8'; ctx.beginPath(); ctx.arc(cx, cy, 2, 0, 6.284); ctx.fill();
    scaleBar(scale);

    frames++; if (ts - fpsT > 600) { fps = Math.round(frames * 1000 / (ts - fpsT)); frames = 0; fpsT = ts; }
    if (ts - hudT > 100) { hudT = ts; hud(t, e, scale, base); }
    requestAnimationFrame(draw);
  }

  function scaleBar(scale) {
    const want = Math.min(200, W * 0.15);
    let world = want / scale;
    const p = Math.pow(10, Math.floor(Math.log10(world)));
    const m = [1, 2, 5, 10].find((k) => k * p >= world * 0.55) || 10;
    world = m * p;
    const wpx = world * scale, x0 = W < 820 ? 16 : 26, y0 = H - (W < 820 ? 64 : 26);
    ctx.strokeStyle = 'rgba(246,246,248,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x0 + wpx, y0);
    ctx.moveTo(x0, y0 - 4); ctx.lineTo(x0, y0 + 4);
    ctx.moveTo(x0 + wpx, y0 - 4); ctx.lineTo(x0 + wpx, y0 + 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(246,246,248,0.62)'; ctx.font = '10.5px ui-monospace,SFMono-Regular,monospace';
    ctx.fillText(fmtE(world), x0, y0 - 9);
  }
  const fmtE = (v) => (!isFinite(v) ? '∞' : v === 0 ? '0' : (Math.abs(v) >= 1e-3 && Math.abs(v) < 1e4) ? String(Number(v.toPrecision(3))) : v.toExponential(1).replace('e+', 'e').replace('e', '·10^'));

  function hud(t, e, scale, base) {
    $('h-tau').textContent = '10^' + st.logTau.toFixed(2);
    $('h-zoom').textContent = '×' + fmtE(scale / base);
    $('h-u').textContent = fmtE(Math.pow(t, -Aexp()));
    $('h-asp').textContent = fmtE(Math.pow(t, -h()));
    $('h-fps').textContent = fps;
  }

  /* ------------------------------------------------------------------ verdicts, decided */
  function decide() {
    const chips = $('chips'); chips.innerHTML = '';
    let met = 0;
    for (const c of S.criteria) {
      const lhs = at(c.rule.lhs, st.hn), rhs = at(c.rule.rhs, st.hn);
      const ok = CMP[c.rule.cmp](lhs, rhs);
      const axisOnly = (c.id === 'typeI' || c.id === 'swirl');
      const live = !axisOnly || st.axisym;
      if (ok) met++;
      const b = document.createElement('button');
      b.className = 'chip' + (live ? (ok ? ' ok' : ' bad') : ' off');
      b.textContent = c.name.split(',')[0].split('(')[0].trim();
      b.addEventListener('click', () => {
        $('why').innerHTML = '<b>' + esc(c.name) + '</b>'
          + '<span>' + esc(c.needs) + '</span><span>' + esc(c.here) + '</span>'
          + '<code>' + esc(qtext(lhs)) + ' ' + esc(c.rule.cmp) + ' ' + esc(qtext(rhs)) + '  →  ' + (ok ? 'true' : 'false')
          + (live ? '' : '   · axisymmetric only, not live') + '</code>';
        $('why').classList.add('on');
      });
      chips.appendChild(b);
    }
    const sw = at(S.criteria.find((c) => c.id === 'swirl').rule.lhs, st.hn);
    const bounded = qcmp(sw, Q(0n, 1n)) >= 0;
    const v = $('verdict');
    if (!st.axisym) v.className = 'verdict';
    else {
      v.className = 'verdict on';
      v.innerHTML = st.hn === 0n
        ? '<b>type I</b><em>h = 0 — the swirl stays bounded and the maximum principle is satisfied. And |u| ≍ τ<sup>−1/2</sup> is exactly type I, which the axisymmetric Liouville theorems exclude.</em>'
        : '<b>swirl unbounded</b><em>h = ' + esc(qtext(Q(st.hn, HD))) + ' — type II, so those theorems do not reach it. And Γ = r·u<sub>θ</sub> ≍ τ<sup>−' + esc(qtext(Q(st.hn, HD))) + '</sup> diverges, which the maximum principle forbids for an axisymmetric flow driven from rest by a bounded force.</em>';
    }
    $('h-met').textContent = met + '/' + S.criteria.length;
    $('h-h').textContent = qtext(Q(st.hn, HD));
    $('h-10').textContent = st.hn === 0n ? 'never' : '10^−' + Math.round(1 / h());
    if (st.panel === 'exact') exactTable();
  }
  function exactTable() {
    const box = $('exact-body'); box.innerHTML = '';
    for (const x of S.exponents) {
      const q = at(x.e, st.hn), row = document.createElement('div');
      row.className = 'erow';
      row.innerHTML = '<span>' + esc(x.sym) + '</span><b>τ<sup>' + esc(qtext(q)) + '</sup></b><i>'
        + esc(fmtE(Math.pow(10, qnum(q) * st.logTau))) + '</i><em>' + esc(x.what) + '</em>';
      box.appendChild(row);
    }
  }

  /* ------------------------------------------------------------------ the computed insets */
  function insets() {
    const hh = Math.max(1e-4, h());
    const gam = (x) => { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gam(1 - x)); x -= 1; let a = c[0]; const t = x + g + 0.5; for (let i = 1; i < g + 2; i++) a += c[i] / (x + i); return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a; };
    const Hf = (Z) => { const f = (w) => { const v = w * w; return 2 * w * Math.exp(-v) * Math.pow(v, hh) * Math.pow(1 + Z * v, -hh); }; const b = Math.sqrt(60), n = 600, dw = b / n; let s = f(0) + f(b); for (let i = 1; i < n; i++) s += f(i * dw) * (i % 2 ? 4 : 2); return (s * dw / 3) / gam(1 + hh); };
    const pts = []; for (let i = 0; i <= 60; i++) { const lz = -3 + 7 * i / 60; pts.push([lz, Hf(Math.pow(10, lz))]); }
    spark('sp-ext', pts, -3, 4, 0, 1.05);
    const Z = 1, ep = 1e-4, H0 = Hf(Z), H1 = (Hf(Z + ep) - Hf(Z - ep)) / (2 * ep), H2 = (Hf(Z + ep) - 2 * H0 + Hf(Z - ep)) / (ep * ep);
    $('ext-res').textContent = (Z * Z * H2 + (1 + 2 * (1 + hh) * Z) * H1 + hh * (1 + hh) * H0).toExponential(1);
    const k0 = 26, sig = 1, N = 420, T1 = 3.4, dt = T1 / N;
    const k2 = (s) => k0 * k0 * (1 + (sig * s) * (sig * s)), lam = (s) => 2 * sig / (1 + (sig * s) * (sig * s));
    const f2 = (s, y) => (lam(s) - k2(s) * 1e-3) * y;
    let y = 1, pk = 1; const cur = [[0, 1]];
    for (let i = 0; i < N; i++) { const s = i * dt, a = f2(s, y), b = f2(s + dt / 2, y + dt / 2 * a), c = f2(s + dt / 2, y + dt / 2 * b), d = f2(s + dt, y + dt * c); y += dt / 6 * (a + 2 * b + 2 * c + d); if (y > pk) pk = y; cur.push([s + dt, y]); }
    spark('sp-pulse', cur, 0, T1, 0, pk * 1.1);
    $('pulse-pk').textContent = '×' + pk.toFixed(2);
  }
  function spark(id, pts, x0, x1, y0, y1) {
    const el = $(id); if (!el) return;
    const w = 190, hh2 = 46; el.setAttribute('viewBox', '0 0 ' + w + ' ' + hh2);
    let d = '';
    for (const [x, y] of pts) d += (d ? 'L' : 'M') + (3 + (x - x0) / (x1 - x0) * (w - 6)).toFixed(1) + ' ' + (hh2 - 3 - (y - y0) / (y1 - y0) * (hh2 - 6)).toFixed(1);
    el.innerHTML = '<path d="' + d + '" fill="none" stroke="rgba(246,246,248,0.8)" stroke-width="1.4"/>';
  }

  /* ------------------------------------------------------------------ wiring */
  const sc = $('sc'), hs = $('hs');
  sc.addEventListener('input', () => { st.logTau = Number(sc.value); st.playing = false; syncPlay(); });
  hs.addEventListener('input', () => { st.hn = BigInt(hs.value); glowKey = ''; decide(); insets(); });
  for (const b of document.querySelectorAll('[data-h]')) b.addEventListener('click', () => { st.hn = BigInt(b.dataset.h); hs.value = b.dataset.h; glowKey = ''; decide(); insets(); });
  function syncPlay() { $('play').textContent = st.playing ? '❚❚' : '▶'; }
  const toggle = (id, key, after) => $(id).addEventListener('click', () => {
    st[key] = !st[key]; $(id).classList.toggle('on', st[key]); if (after) after();
  });
  $('play').addEventListener('click', () => { st.playing = !st.playing; syncPlay(); });
  toggle('follow', 'follow', () => { glowKey = ''; });
  toggle('axi', 'axisym', () => { document.body.classList.toggle('axi', st.axisym); decide(); });
  toggle('trace', 'tracers');
  for (const b of document.querySelectorAll('[data-panel]')) b.addEventListener('click', () => {
    const p = b.dataset.panel;
    st.panel = st.panel === p ? null : p;
    for (const el of document.querySelectorAll('.panel')) el.classList.toggle('on', el.id === 'p-' + st.panel);
    for (const x of document.querySelectorAll('[data-panel]')) x.classList.toggle('on', x.dataset.panel === st.panel);
    document.body.classList.remove('faded');
    if (st.panel === 'exact') exactTable();
  });
  $('why').addEventListener('click', () => $('why').classList.remove('on'));
  document.addEventListener('keydown', (ev) => {
    if (ev.target.tagName === 'INPUT') return;
    if (ev.key === ' ') { ev.preventDefault(); $('play').click(); }
    else if (ev.key === 'f') $('follow').click();
    else if (ev.key === 'a') $('axi').click();
    else if (ev.key === 't') $('trace').click();
    else if (ev.key === 'Escape') {
      st.panel = null;
      for (const el of document.querySelectorAll('.panel')) el.classList.remove('on');
      for (const x of document.querySelectorAll('[data-panel]')) x.classList.remove('on');
      $('why').classList.remove('on');
    }
  });
  window.addEventListener('resize', () => { clearTimeout(window.__t); window.__t = setTimeout(fit, 120); });

  /* ------------------------------------------------------------------ go */
  buildField(); fit(); decide(); insets(); syncPlay();
  hs.value = String(st.hn); sc.value = String(st.logTau);
  $('trace').classList.add('on'); $('follow').classList.add('on');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { st.playing = false; st.tracers = false; $('trace').classList.remove('on'); syncPlay(); }
  requestAnimationFrame(draw);
  setTimeout(() => document.body.classList.add('ready'), 30);
  const fade = setTimeout(() => { if (!st.panel) document.body.classList.add('faded'); }, 7000);
  document.addEventListener('pointerdown', () => { clearTimeout(fade); document.body.classList.remove('faded'); }, { once: true });
})();
