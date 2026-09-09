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
    follow: true, axisym: false, tracers: true, panel: null, zoom: 0, mode: 'both',
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
  const cv = $('stage'), ctx = cv.getContext('2d', { alpha: false });
  let W = 0, H = 0, DPR = 1;
  function fit() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, W, H);
  }

  /* ------------------------------------------------------------------ the drawing
     THE PICTURE IS A DRAWING, not a bloom. Iso-speed contours and streamlines, both hairline,
     both computed ONCE per h in the construction's own coordinates (X, η) and mapped to the
     screen each frame — which is exact, because the field is self-similar: a point (X, η)
     sits at q = τ/(1−η²), r = √(2qX), z = q^D·η, and the SHAPE never changes. That is why
     this holds sixty frames a second while thirteen decades go by. */
  let geo = null, geoH = -1;
  /* |η| < 1 is the core's own range: at η → ±1 the coordinate q = τ/(1−η²) runs to infinity and
   the picture there is not the core at all but the far field at t = 1. An earlier lattice ran to
   1.22 and drew the whole frame full of sweeping tails. */
  const CN = 200, CM = 150, CXMAX = 2.15, CYMAX = 0.92;

  function buildGeometry() {
    const hh = h();
    /* the speed field on the lattice, in profile units */
    const g = new Float32Array(CN * CM);
    let vmax = 0;
    for (let j = 0; j < CM; j++) {
      const eta = -CYMAX + 2 * CYMAX * j / (CM - 1);
      for (let i = 0; i < CN; i++) {
        const sx = -CXMAX + 2 * CXMAX * i / (CN - 1), X = sx * sx;
        const a1 = sample(F.fs, Math.min(GX, Math.abs(sx)), Math.max(-GY, Math.min(GY, eta)));
        const a2 = sample(F.fz, Math.min(GX, Math.abs(sx)), Math.max(-GY, Math.min(GY, eta)));
        const a3 = sample(F.fr, Math.min(GX, Math.abs(sx)), Math.max(-GY, Math.min(GY, eta)));
        /* the physical speed at (X, η) is τ^{−A}(1−η²)^A·|F|, so the SHAPE of every contour
           is the shape of G = (1−η²)^A|F| — one field, every τ, no per-frame marching. */
        const v = Math.pow(Math.max(1e-9, 1 - eta * eta), 0.5 + hh) * Math.sqrt(a1 * a1 + a2 * a2 + a3 * a3);
        g[j * CN + i] = v; if (v > vmax) vmax = v;
      }
    }
    /* marching squares, one closed set per level; levels geometric so the eye reads decades */
    const NL = 16, contours = [];
    for (let L = 0; L < NL; L++) {
      const frac = Math.pow(0.70, NL - 1 - L);
      contours.push({ level: frac * vmax, frac, segs: march(g, frac * vmax) });
    }
    /* STREAMLINES. Integrated in PHYSICAL (r, z) at one reference τ and stored in (√X, η):
       by self-similarity that curve is every τ's curve. An earlier version integrated a made-up
       rule directly in (X, η) and drew nonsense, because the coordinate change is not separable
       — q depends on z. */
    const TREF = 1e-2, DD = 0.5 - hh, AA = 0.5 + hh;
    const lines = [];
    const lrRef = Math.sqrt(2 * Xc * TREF);
    for (let k = 0; k < 21; k++) {
      const eta0 = -0.86 + 1.72 * (k + 0.5) / 21;
      const q0 = TREF / Math.max(1e-6, 1 - eta0 * eta0);
      for (const side of [1, -1]) {
        const pts = [];
        let r = 1.92 * Math.sqrt(2 * q0), z = Math.pow(q0, DD) * eta0;
        for (let n = 0; n < 900; n++) {
          const q = qOf(z, TREF, hh, DD);
          const sxa = r / Math.sqrt(2 * q), et = z / Math.pow(q, DD);
          if (!(sxa <= GX) || !(Math.abs(et) <= GY)) break;
          const qA = Math.pow(q, -AA);
          const ur = qA * sample(F.fr, sxa, et), uz = qA * sample(F.fz, sxa, et);
          const nn = Math.hypot(ur, uz) || 1e-30;
          r += ur / nn * lrRef * 0.012; z += uz / nn * lrRef * 0.012;
          if (!(r > lrRef * 0.004)) break;
          const q2 = qOf(z, TREF, hh, DD);
          const sx2 = r / Math.sqrt(2 * q2), e2 = z / Math.pow(q2, DD);
          if (!(sx2 <= CXMAX) || !(Math.abs(e2) <= CYMAX)) break;
          pts.push(side * sx2, e2);
        }
        if (pts.length > 20) lines.push(new Float32Array(pts));
      }
    }
    /* stipple: points with density following the speed */
    const dots = [];
    for (let n = 0; n < 2600; n++) {
      const sx = (Math.random() * 2 - 1) * CXMAX, eta = (Math.random() * 2 - 1) * CYMAX;
      const i = Math.round((sx + CXMAX) / (2 * CXMAX) * (CN - 1)), j = Math.round((eta + CYMAX) / (2 * CYMAX) * (CM - 1));
      const v = g[j * CN + i] / vmax;
      if (Math.random() < Math.pow(v, 1.5)) dots.push(sx, eta);
    }
    geo = { contours, lines, dots: new Float32Array(dots), vmax }; geoH = hh;
  }

  /* marching squares on the lattice, returning flat segment pairs in (√X, η) */
  function march(g, lev) {
    const out = [];
    const at = (i, j) => g[j * CN + i];
    const sxOf = (i) => -CXMAX + 2 * CXMAX * i / (CN - 1);
    const etOf = (j) => -CYMAX + 2 * CYMAX * j / (CM - 1);
    for (let j = 0; j < CM - 1; j++) for (let i = 0; i < CN - 1; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      let k = 0;
      if (a > lev) k |= 1; if (b > lev) k |= 2; if (c > lev) k |= 4; if (d > lev) k |= 8;
      if (k === 0 || k === 15) continue;
      const lerp = (v1, v2, p1, p2) => { const t = (lev - v1) / ((v2 - v1) || 1e-30); return p1 + t * (p2 - p1); };
      const P = {
        b: [lerp(a, b, sxOf(i), sxOf(i + 1)), etOf(j)],
        r: [sxOf(i + 1), lerp(b, c, etOf(j), etOf(j + 1))],
        t: [lerp(d, c, sxOf(i), sxOf(i + 1)), etOf(j + 1)],
        l: [sxOf(i), lerp(a, d, etOf(j), etOf(j + 1))],
      };
      const push = (p, q) => out.push(p[0], p[1], q[0], q[1]);
      switch (k) {
        case 1: case 14: push(P.l, P.b); break;
        case 2: case 13: push(P.b, P.r); break;
        case 3: case 12: push(P.l, P.r); break;
        case 4: case 11: push(P.r, P.t); break;
        case 6: case 9: push(P.b, P.t); break;
        case 7: case 8: push(P.l, P.t); break;
        case 5: push(P.l, P.b); push(P.r, P.t); break;
        case 10: push(P.l, P.t); push(P.b, P.r); break;
      }
    }
    return new Float32Array(out);
  }

  /* (√X, η) → screen at this τ, exactly */
  function mapper(t, scale, cx, cy) {
    const D = Dexp();
    return (sx, eta) => {
      const q = t / Math.max(1e-12, 1 - eta * eta);
      const r = Math.sign(sx) * Math.abs(sx) * Math.sqrt(2 * q);
      const z = Math.pow(q, D) * eta;
      return [cx + r * scale, cy - z * scale];
    };
  }

  /* ------------------------------------------------------------------ the frame */
  let last = 0, fps = 60, frames = 0, fpsT = 0, hudT = 0, phase = 0;
  const PULSES = 9;
  const pulseCount = (t) => Math.max(3, Math.min(190, Math.round(Math.SQRT2 * (Math.sqrt(Xb) - Math.sqrt(Xa)) * Math.pow(t, -h() / 2) * PULSES)));

  function draw(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    phase += dt;
    if (st.playing) {
      st.logTau -= st.speed * dt;
      if (st.logTau < -13) st.logTau = -0.15;
      $('sc').value = st.logTau;
    }
    if (Fh !== h()) buildField();
    if (geoH !== h()) buildGeometry();
    const t = tau(), e = ext(t);

    const base = 0.30 * Math.min(W - (W < 820 ? 0 : 330), H);
    const target = st.follow ? base / e.lr : base;
    if (!st.zoom) st.zoom = target;
    st.zoom += (target - st.zoom) * Math.min(1, dt * 3.2);
    /* the drawing is centred in what is VISIBLE, not in the window: the panel takes the right
       third and the title the top left, so a window-centred figure sits under both. */
    const panelW = document.body.classList.contains('ov-panel-hidden') ? 0 : Math.min(330, W * 0.88);
    const scale = st.zoom, cx = (W - panelW) / 2 + (W < 820 ? 0 : 40), cy = H / 2;
    const M = mapper(t, scale, cx, cy);

    ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, W, H);

    if (st.mode === 'contour' || st.mode === 'both') {
      ctx.lineWidth = 1;
      for (const c of geo.contours) {
        ctx.strokeStyle = 'rgba(246,246,248,' + (0.10 + 0.62 * Math.pow(c.frac, 0.42)).toFixed(3) + ')';
        ctx.beginPath();
        const sg = c.segs;
        for (let k = 0; k < sg.length; k += 4) {
          const p = M(sg[k], sg[k + 1]), q = M(sg[k + 2], sg[k + 3]);
          if (!isFinite(p[0]) || !isFinite(q[0])) continue;
          if ((p[0] < -60 && q[0] < -60) || (p[0] > W + 60 && q[0] > W + 60)) continue;
          ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
        }
        ctx.stroke();
      }
    }

    if (st.mode === 'stream' || st.mode === 'both') {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(246,246,248,0.28)';
      ctx.beginPath();
      for (const L of geo.lines) {
        let started = false;
        for (let k = 0; k < L.length; k += 2) {
          const p = M(L[k], L[k + 1]);
          if (!isFinite(p[0])) { started = false; continue; }
          if (started) ctx.lineTo(p[0], p[1]); else { ctx.moveTo(p[0], p[1]); started = true; }
        }
      }
      ctx.stroke();
      if (st.tracers) {
        ctx.fillStyle = 'rgba(246,246,248,0.9)';
        for (const L of geo.lines) {
          const n = L.length / 2;
          for (let m = 0; m < 3; m++) {
            const u = ((phase * 0.19 + m / 3 + Math.abs(L[0] * 7.3 % 1)) % 1);
            const idx = Math.min(n - 1, Math.floor(u * n)) * 2;
            const p = M(L[idx], L[idx + 1]);
            if (!isFinite(p[0]) || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;
            ctx.fillRect(p[0] - 1, p[1] - 1, 2, 2);
          }
        }
      }
    }

    if (st.mode === 'stipple') {
      ctx.fillStyle = 'rgba(246,246,248,0.5)';
      const dd = geo.dots;
      for (let k = 0; k < dd.length; k += 2) {
        const p = M(dd[k], dd[k + 1]);
        if (!isFinite(p[0]) || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;
        ctx.fillRect(p[0], p[1], 1, 1);
      }
    }

    /* the references. The axis and the annulus are dotted because they are rulers; the core
       box is solid because its two edges are exactly what the exponents fix. */
    ctx.save();
    ctx.setLineDash([1, 3]); ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(246,246,248,0.20)';
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    const ra = Math.sqrt(2 * Xa * t), rb = Math.sqrt(2 * Xb * t);
    ctx.setLineDash([2, 3]); ctx.strokeStyle = 'rgba(246,246,248,0.28)';
    for (const sg of [1, -1]) for (const rr of [ra, rb]) {
      const x = cx + sg * rr * scale;
      if (x < -20 || x > W + 20) continue;
      ctx.beginPath(); ctx.moveTo(x, cy - e.lz * scale * 1.3); ctx.lineTo(x, cy + e.lz * scale * 1.3); ctx.stroke();
    }
    ctx.setLineDash([]);
    if (!st.axisym) {
      const n = pulseCount(t);
      ctx.strokeStyle = 'rgba(246,246,248,0.09)';
      ctx.beginPath();
      for (let k = 0; k < n; k++) for (const sg of [1, -1]) {
        const x = cx + sg * (ra + (rb - ra) * (k + 0.5) / n) * scale;
        if (x < -6 || x > W + 6) continue;
        ctx.moveTo(x, cy - e.lz * scale); ctx.lineTo(x, cy + e.lz * scale);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(246,246,248,0.26)'; ctx.lineWidth = 1;
    ctx.strokeRect(cx - e.lr * scale, cy - e.lz * scale, 2 * e.lr * scale, 2 * e.lz * scale);
    ctx.fillStyle = '#f6f6f8'; ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, 6.284); ctx.fill();
    ctx.restore();

    annotate(cx, cy, scale, e, t, ra, rb);
    cxNow = cx; scaleBar(scale);

    frames++; if (ts - fpsT > 600) { fps = Math.round(frames * 1000 / (ts - fpsT)); frames = 0; fpsT = ts; }
    if (ts - hudT > 110) { hudT = ts; hud(t, e, scale, base); }
    requestAnimationFrame(draw);
  }

  function annotate(cx, cy, scale, e, t, ra, rb) {
    ctx.font = '9.5px ui-monospace,SFMono-Regular,Menlo,monospace';
    const lab = (x, y, s, anchor, col) => {
      ctx.fillStyle = col || 'rgba(154,154,166,0.92)';
      ctx.textAlign = anchor || 'left'; ctx.fillText(s, x, y); ctx.textAlign = 'left';
    };
    const rp = e.lr * scale, zp = e.lz * scale;
    if (rp > 26 && cx - rp > 130) {
      ctx.strokeStyle = 'rgba(154,154,166,0.32)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - rp, cy + zp); ctx.lineTo(cx - rp - 16, cy + zp + 12); ctx.stroke();
      lab(cx - rp - 20, cy + zp + 15, 'the core · ℓr = τ^1/2 · ℓz = τ^' + fmtExp(0.5 - h()), 'right');
    }
    const xb = cx - rb * scale;
    if (xb > 150 && zp > 14) lab(xb - 8, cy + 4, st.axisym ? 'annulus · no pulses' : 'pulse annulus · ' + Xa + ' < X < ' + Xb, 'right');
    lab(cx + 6, 16, 'axis', 'left', 'rgba(110,110,122,0.9)');
  }
  const fmtExp = (v) => String(Number(v.toFixed(4)));

  let cxNow = 0;
  function scaleBar(scale) {
    const want = Math.min(200, W * 0.15);
    let world = want / scale;
    const p = Math.pow(10, Math.floor(Math.log10(world)));
    const m = [1, 2, 5, 10].find((k) => k * p >= world * 0.55) || 10;
    world = m * p;
    /* the ruler goes where nothing else is: the top right of the stage, left of the panel */
    const panelW = document.body.classList.contains('ov-panel-hidden') ? 0 : Math.min(330, W * 0.88);
    const wpx = world * scale;
    const x0 = W < 820 ? Math.max(14, W - 20 - wpx) : Math.max(20, W - panelW - 34 - wpx);
    const y0 = W < 820 ? H - 120 : 74;
    ctx.strokeStyle = 'rgba(246,246,248,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x0 + wpx, y0);
    ctx.moveTo(x0, y0 - 4); ctx.lineTo(x0, y0 + 4);
    ctx.moveTo(x0 + wpx, y0 - 4); ctx.lineTo(x0 + wpx, y0 + 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(246,246,248,0.55)'; ctx.font = '9.5px ui-monospace,SFMono-Regular,monospace';
    ctx.textAlign = 'right'; ctx.fillText(fmtE(world) + '  ·  in units of the initial core', x0 + wpx, y0 - 8); ctx.textAlign = 'left';
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
      b.className = 'chip' + (live && !ok ? ' on' : '');
      b.style.opacity = live ? '1' : '0.38';
      b.textContent = c.name.split(',')[0].split('(')[0].trim();
      b.addEventListener('click', () => {
        $('why').innerHTML = '<b>' + esc(c.name) + '</b>'
          + '<span>' + esc(c.needs) + '</span><span>' + esc(c.here) + '</span>'
          + '<code>' + esc(qtext(lhs)) + ' ' + esc(c.rule.cmp) + ' ' + esc(qtext(rhs)) + '  →  ' + (ok ? 'true' : 'false')
          + (live ? '' : '   · axisymmetric only, not live') + '</code>';
        $('why').className = 'ov ov-why on';
      });
      chips.appendChild(b);
    }
    const sw = at(S.criteria.find((c) => c.id === 'swirl').rule.lhs, st.hn);
    const bounded = qcmp(sw, Q(0n, 1n)) >= 0;
    const v = $('verdict');
    if (!st.axisym) { v.className = 'ov ov-verdict'; v.innerHTML = ''; }
    else {
      v.className = 'ov ov-verdict on';
      v.innerHTML = st.hn === 0n
        ? '<span class="tag">type I</span><p>h = 0 — the swirl stays bounded and the maximum principle is satisfied. And |u| ≍ τ<sup>−1/2</sup> is exactly type I, which the axisymmetric Liouville theorems exclude.</p>'
        : '<span class="tag">swirl unbounded</span><p>h = ' + esc(qtext(Q(st.hn, HD))) + ' — type II, so those theorems do not reach it. And Γ = r·u<sub>θ</sub> ≍ τ<sup>−' + esc(qtext(Q(st.hn, HD))) + '</sup> diverges, which the maximum principle forbids for an axisymmetric flow driven from rest by a bounded force.</p>';
    }
    $('h-met').textContent = met + '/' + S.criteria.length;
    $('h-h').textContent = qtext(Q(st.hn, HD));
    $('h-10').textContent = st.hn === 0n ? 'never' : '10^−' + Math.round(1 / h());
    exactTable();
  }
  function exactTable() {
    const box = $('exact-body'); box.innerHTML = '';
    for (const x of S.exponents) {
      const q = at(x.e, st.hn), row = document.createElement('div');
      row.className = 'erow';
      row.innerHTML = '<span class="s">' + esc(x.sym) + '</span><span class="e">τ<sup>' + esc(qtext(q)) + '</sup></span>'
        + '<span class="v">' + esc(fmtE(Math.pow(10, qnum(q) * st.logTau))) + '</span>';
      row.title = x.what;
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
  let panelTouched = false;
  const autoPanel = () => { if (!panelTouched) document.body.classList.toggle('ov-panel-hidden', window.innerWidth < 820); };
  const sc = $('sc'), hs = $('hs'), spd = $('sp');
  sc.addEventListener('input', () => { st.logTau = Number(sc.value); st.playing = false; syncPlay(); });
  hs.addEventListener('input', () => { st.hn = BigInt(hs.value); $('hsOut').textContent = qtext(Q(st.hn, HD)); decide(); insets(); });
  spd.addEventListener('input', () => { st.speed = Number(spd.value); $('spOut').textContent = st.speed.toFixed(2); });
  for (const b of document.querySelectorAll('[data-h]')) b.addEventListener('click', () => {
    st.hn = BigInt(b.dataset.h); hs.value = b.dataset.h; $('hsOut').textContent = qtext(Q(st.hn, HD)); decide(); insets();
  });
  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => {
    st.mode = b.dataset.mode;
    for (const x of document.querySelectorAll('[data-mode]')) x.classList.toggle('on', x === b);
  });
  function syncPlay() { $('play').textContent = st.playing ? '❚❚' : '▶'; }
  $('play').addEventListener('click', () => { st.playing = !st.playing; syncPlay(); });
  const toggle = (id, key, after) => $(id).addEventListener('click', () => {
    st[key] = !st[key]; $(id).classList.toggle('on', st[key]); if (after) after();
  });
  toggle('follow', 'follow');
  toggle('trace', 'tracers');
  toggle('axi', 'axisym', decide);
  $('pt').addEventListener('click', () => { panelTouched = true; document.body.classList.toggle('ov-panel-hidden'); });
  $('why').addEventListener('click', () => { $('why').className = 'ov ov-why'; });
  document.addEventListener('keydown', (ev) => {
    if (ev.target.tagName === 'INPUT') return;
    if (ev.key === ' ') { ev.preventDefault(); $('play').click(); }
    else if (ev.key === 'f') $('follow').click();
    else if (ev.key === 'a') $('axi').click();
    else if (ev.key === 't') $('trace').click();
    else if (ev.key === 'c') $('pt').click();
    else if (ev.key === 'Escape') { $('why').className = 'ov ov-why'; }
  });
  window.addEventListener('resize', () => { clearTimeout(window.__t); window.__t = setTimeout(() => { autoPanel(); fit(); }, 120); });

  /* ------------------------------------------------------------------ go */
  /* the panel is the whole screen on a phone, so it starts closed there and the drawing is
     what you land on; the toggle is in the corner either way */
  /* auto-closed on a phone, and re-evaluated on resize until the reader touches the toggle:
     a class latched at one window size and carried to another is how the ruler caught this. */
  autoPanel();
  buildField(); buildGeometry(); fit(); decide(); insets(); syncPlay();
  hs.value = String(st.hn); sc.value = String(st.logTau);
  $('hsOut').textContent = qtext(Q(st.hn, HD));
  $('trace').classList.add('on'); $('follow').classList.add('on');
  document.querySelector('[data-mode="both"]').classList.add('on');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { st.playing = false; st.tracers = false; $('trace').classList.remove('on'); syncPlay(); }
  requestAnimationFrame(draw);
})();
