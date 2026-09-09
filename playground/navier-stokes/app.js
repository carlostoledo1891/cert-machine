/* app.js — the drawing and deciding half of /instruments/navier-stokes.
   Inlined into the page by playground/navier-stokes/build.js.

   THREE KINDS OF MARK, and the page never mixes them:
     DECIDED   every verdict about h is an exact rational inequality, decided here with
               BigInt. No float touches a verdict. The boundary cases h = 0 and h = 1/6
               are decided as equalities, not approached.
     COMPUTED  the exterior integral, the pulse ODE and the profile curves: floating
               point, with the residual or the source named on the page.
     DRAWN     the core picture. The exponents and incompressibility are the paper's and
               are exact; the radial profile shapes are chosen to be legible. No fluid is
               integrated anywhere on this page and none is claimed.
*/
(function () {
  'use strict';
  const S = JSON.parse(document.getElementById('ns-scene').textContent);
  const $ = (id) => document.getElementById(id);
  const HD = 1000n;                      /* h is hn/1000 — every verdict is exact in this grid */

  /* ---------------------------------------------------------------- exact rationals */
  const g = (a, b) => (b ? g(b, a % b) : (a < 0n ? -a : a));
  function Q(n, d) { if (d < 0n) { n = -n; d = -d; } const k = g(n < 0n ? -n : n, d) || 1n; return { n: n / k, d: d / k }; }
  const qcmp = (a, b) => { const l = a.n * b.d, r = b.n * a.d; return l < r ? -1 : l > r ? 1 : 0; };
  const qnum = (q) => Number(q.n) / Number(q.d);
  /* an exponent (n0 + n1·h)/d at h = hn/HD */
  const at = (e, hn) => Q(BigInt(e.n0) * HD + BigInt(e.n1) * hn, BigInt(e.d) * HD);
  const CMP = { '<': (a, b) => qcmp(a, b) < 0, '<=': (a, b) => qcmp(a, b) <= 0, '>': (a, b) => qcmp(a, b) > 0, '>=': (a, b) => qcmp(a, b) >= 0 };
  function qtext(q) {                    /* an exact rational, printed as one */
    if (q.d === 1n) return String(q.n);
    const w = q.n / q.d, r = q.n % q.d;
    return (r === 0n ? String(w) : String(q.n) + '/' + String(q.d));
  }

  /* ---------------------------------------------------------------- state */
  const st = {
    hn: 10n,            /* h = 10/1000 = 1/100, the paper's printed value */
    logTau: -1.3,       /* τ = 10^logTau */
    view: 'physical',   /* physical | similarity */
    axisym: false,      /* pretend the flow is axisymmetric (no pulses) */
    trails: true,
    k0: 26,             /* pulse: initial radial wavenumber */
    shear: 1.0,         /* pulse: background shear rate */
    spin: true,
  };
  const h = () => Number(st.hn) / 1000;
  const tau = () => Math.pow(10, st.logTau);

  /* ---------------------------------------------------------------- the profiles (DRAWN)
     E(X)  swirl profile: E/√(2X) smooth at the axis, E ~ X^{−1/2−h} far out (the paper's
           (4.29) tail). U(X,η) axial jet, compact. V0 from incompressibility, integrated,
           so the drawn field is divergence-free exactly. Shapes chosen; scalings the paper's. */
  const Xa = 0.55, Xb = 1.9, Xc = 2.6;             /* annulus and core cut, in X */
  const Eprof = (X) => Math.sqrt(2 * X) / Math.pow(1 + X, 1 + h());
  const Uprof = (X, eta) => 2.1 * Math.exp(-X) * eta * Math.max(0, 1 - eta * eta);

  /* similarity coordinates: τ = q(1−η²), z = q^D η, X = r²/(2q) */
  const Dexp = () => 0.5 - h(), Aexp = () => 0.5 + h();
  /* q(z, τ) solves q − z²q^{2h} = τ; one Newton pass from q ≈ τ + |z|^{1/D} is plenty here */
  function qOf(z, t) {
    const D = Dexp(), hh = h();
    let q = t + Math.pow(Math.abs(z), 1 / D) + 1e-300;
    for (let i = 0; i < 24; i++) {
      const f = q - z * z * Math.pow(q, 2 * hh) - t;
      const fp = 1 - 2 * hh * z * z * Math.pow(q, 2 * hh - 1);
      const s = f / (fp || 1);
      q -= s;
      if (q <= 0) q = 1e-300;
      if (Math.abs(s) < 1e-15 * q) break;
    }
    return q;
  }
  /* the velocity of the leading field at a physical point, in the paper's scalings */
  function vel(r, z, t) {
    const q = qOf(z, t), A = Aexp();
    const X = r * r / (2 * q), eta = z / Math.pow(q, Dexp());
    const uz = Math.pow(q, -A) * Uprof(X, eta);
    const uth = Math.pow(q, -A) * Eprof(X);
    /* u_r = V0/r with ∂_r V0 = −r ∂_z u_z, V0(0,z) = 0 — integrated on the spot, so the
       drawn field is exactly incompressible whatever the profile shapes are */
    const dz = Math.max(1e-9, 1e-3 * Math.pow(q, Dexp()));
    const N = 24; let V0 = 0;
    for (let i = 0; i < N; i++) {
      const s = r * (i + 0.5) / N, ds = r / N;
      const qz = qOf(z + dz, t), qm = qOf(z - dz, t);
      const up = Math.pow(qz, -A) * Uprof(s * s / (2 * qz), (z + dz) / Math.pow(qz, Dexp()));
      const um = Math.pow(qm, -A) * Uprof(s * s / (2 * qm), (z - dz) / Math.pow(qm, Dexp()));
      V0 += -s * (up - um) / (2 * dz) * ds;
    }
    return { ur: r > 1e-12 ? V0 / r : 0, uth, uz, X, eta, q };
  }

  /* ---------------------------------------------------------------- panel A: the core */
  const cv = $('ns-core'), ctx = cv.getContext('2d');
  let DPR = 1, W = 0, H = 0;
  function fit() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  let INK, INK3, INK4, INK5, GRID, SURF, S1, S2;
  function palette() {
    INK = css('--ink') || '#f6f6f8'; INK3 = css('--ink-3') || '#9a9aa6';
    INK4 = css('--ink-4') || '#6e6e7a'; INK5 = css('--ink-5') || '#4a4a55';
    GRID = css('--chart-grid') || '#1c1c22'; SURF = css('--bg-raised') || '#101014';
    S1 = css('--series-1') || '#f6f6f8'; S2 = css('--series-2') || '#a9a9b4';
  }

  /* THE PULSE COUNT, literal. Across the annulus it is (rb − ra)/ℓwave = √2(√Xb − √Xa)·q^{−h/2}.
     At the paper's h = 1/100 that is 1.02 per hundred decades of τ — which is why the picture
     barely changes when you drag τ, and why the h slider is the one that shows the mechanism.
     PULSES_DRAWN is a legibility factor and is stated on the page; it multiplies nothing that
     is decided. */
  const PULSES_DRAWN = 9;
  const pulseCount = (t) => {
    const n = Math.SQRT2 * (Math.sqrt(Xb) - Math.sqrt(Xa)) * Math.pow(t, -h() / 2);
    return Math.max(3, Math.min(220, Math.round(n * PULSES_DRAWN)));
  };

  /* the core's physical half-extents at time τ */
  const extents = (t) => ({ lr: Math.sqrt(2 * Xc * t), lz: Math.pow(t, Dexp()) });

  function drawCore(phase) {
    const t = tau(), pad = 26;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = SURF; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;

    if (st.view === 'similarity') {
      /* THE SAME PICTURE, in the coordinates the construction is written in: the horizontal
         axis is signed √X = r/√(2q), the vertical is η = z/q^D. Everything below is computed
         at a fixed reference τ and mapped here, which by self-similarity is what any τ gives —
         so flipping this switch freezes the collapse. Only the pulse count still moves, and
         that is the one thing that is genuinely not self-similar. */
      const TREF = 1e-2;
      const SX = 1.85, SY = 1.15;                       /* half-ranges in √X and η */
      const PX = (sx) => cx + sx / SX * (W / 2 - pad);
      const PY = (eta) => cy - eta / SY * (H / 2 - pad);
      /* the swirl, stationary: E(X) does not depend on τ at all */
      paintSwirlSim(PX, PY, SX, SY);
      /* level lines */
      ctx.strokeStyle = GRID; ctx.lineWidth = 1;
      for (const X of [0.25, Xa, 1.0, Xb, Xc]) for (const sgn of [1, -1]) {
        const x = PX(sgn * Math.sqrt(X));
        ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
      }
      for (const eta of [-1, -0.5, 0, 0.5, 1]) {
        ctx.beginPath(); ctx.moveTo(pad, PY(eta)); ctx.lineTo(W - pad, PY(eta)); ctx.stroke();
      }
      /* the annulus */
      ctx.fillStyle = 'rgba(246,246,248,0.05)';
      for (const sgn of [1, -1]) {
        const a = PX(sgn * Math.sqrt(Xa)), b = PX(sgn * Math.sqrt(Xb));
        ctx.fillRect(Math.min(a, b), PY(1), Math.abs(b - a), PY(-1) - PY(1));
      }
      /* the meridional flow, mapped: integrate at TREF and plot in (√X, η) */
      ctx.lineWidth = 1.25;
      const eR = extents(TREF);
      const sd = [];
      for (let i = 0; i < 9; i++) sd.push([eR.lr * 1.6, eR.lz * (-0.92 + 1.84 * i / 8)]);
      for (let i = 0; i < 3; i++) sd.push([eR.lr * (0.3 + 0.32 * i), eR.lz * 0.03]);
      for (const [r0, z0] of sd) for (const side of [1, -1]) for (const dir of [1, -1]) {
        let r = r0, z = z0, drew = 0, started = false;
        ctx.beginPath();
        for (let k = 0; k < 420; k++) {
          const v = vel(Math.max(r, 1e-12), z, TREF);
          const sp = Math.hypot(v.ur, v.uz) || 1e-30;
          const step = dir * eR.lr * 0.010;
          r += (v.ur / sp) * step; z += (v.uz / sp) * step;
          if (!isFinite(r) || !isFinite(z)) break;
          const q = qOf(z, TREF), X = r * r / (2 * q), eta = z / Math.pow(q, Dexp());
          if (X > SX * SX || Math.abs(eta) > SY) break;
          const px = PX(side * Math.sqrt(X)), py = PY(eta);
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          drew++;
        }
        if (drew > 3) { ctx.strokeStyle = 'rgba(246,246,248,0.46)'; ctx.stroke(); }
      }
      /* the pulses: the only thing on this panel that τ still moves */
      const nP = pulseCount(t);
      if (!st.axisym) {
        ctx.lineWidth = 0.9;
        for (let i = 0; i < nP; i++) for (const sgn of [1, -1]) {
          const X = Xa + (Xb - Xa) * (i + 0.5) / nP, x = PX(sgn * Math.sqrt(X));
          ctx.strokeStyle = 'rgba(246,246,248,' + (0.16 + 0.44 * Math.abs(Math.sin(6.283 * i / nP * 5 + phase * (st.spin ? 1 : 0)))).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(x, PY(1)); ctx.lineTo(x, PY(-1)); ctx.stroke();
        }
      }
      /* the core, stationary */
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.strokeRect(PX(-Math.sqrt(Xc)), PY(0.92), PX(Math.sqrt(Xc)) - PX(-Math.sqrt(Xc)), PY(-0.92) - PY(0.92));
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, 2.4, 0, 6.284); ctx.fill();

      label(cx, pad - 10, W < 620 ? 'similarity coordinates' : 'similarity coordinates — move τ and nothing here moves but the pulse count', INK4, 'center');
      label(pad, pad + 12, '← √X = r/√(2q) →', INK4);
      label(W - pad, pad + 12, 'η = z/q^D', INK4, 'right');
      label(pad, H - 26, W < 620 ? 'glow = E(X) — no τ in it' + (st.axisym ? '' : ' · ' + nP + ' pulse marks')
        : 'glow = E(X), the swirl profile — no τ in it at all' + (st.axisym ? '  ·  annulus, no pulses' : '  ·  ' + nP + ' pulse marks drawn across the annulus'), INK5);
      label(cx, H - 10, W < 620 ? 'in its own coordinates it stands still' : 'the whole point of a self-similar singularity: in its own coordinates it stands still', INK3, 'center');
      return;
    }

    /* PHYSICAL COORDINATES. One frame, fixed. The core collapses inside it. */
    const R0 = 1.15, Z0 = 1.15;
    const PX = (r) => cx + r / R0 * (W / 2 - pad);
    const PY = (z) => cy - z / Z0 * (H / 2 - pad);
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(PX(i * 0.25), pad); ctx.lineTo(PX(i * 0.25), H - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, PY(i * 0.25)); ctx.lineTo(W - pad, PY(i * 0.25)); ctx.stroke();
    }
    ctx.strokeStyle = INK5; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, pad); ctx.lineTo(cx, H - pad); ctx.stroke();

    /* the trail: the core's outline at earlier times — the funnel it traces in space-time */
    if (st.trails) {
      for (let k = 0; k <= 16; k++) {
        const tk = Math.pow(10, st.logTau + (16 - k) * 0.42);
        if (tk > 1) continue;
        const e = extents(tk);
        ctx.strokeStyle = 'rgba(246,246,248,' + (0.05 + 0.03 * k / 16) + ')';
        ctx.lineWidth = 1;
        ctx.strokeRect(PX(-e.lr), PY(e.lz), PX(e.lr) - PX(-e.lr), PY(-e.lz) - PY(e.lz));
      }
    }

    /* THE SWIRL POINTS OUT OF THE PAGE. In an (r,z) section a purely azimuthal flow has no
       in-plane component at all, so drawing it as curves would be a lie — an earlier version
       drew the exterior as ellipses and had to be thrown away. The swirl is painted as
       intensity, |uθ| = q^{−A}E(X); the lines are the meridional flow only. The field costs a
       Newton solve for q per cell, so it is cached and only the pulses redraw per frame. */
    const e = extents(t);
    paintSwirl(t);

    /* meridional streamlines, seeded at the outer edge across the height: they come in
       radially and turn to run out along the axis — the flow §2.1 describes. */
    ctx.lineWidth = 1.25;
    const seeds = [];
    for (let i = 0; i < 9; i++) seeds.push([e.lr * 1.6, e.lz * (-0.92 + 1.84 * i / 8)]);
    for (let i = 0; i < 3; i++) seeds.push([e.lr * (0.3 + 0.32 * i), e.lz * 0.03]);
    for (const [r0, z0] of seeds) for (const side of [1, -1]) {
      let r = r0, z = z0, drew = 0;
      ctx.beginPath(); ctx.moveTo(PX(side * r), PY(z));
      for (let k = 0; k < 420; k++) {
        const v = vel(Math.max(r, 1e-12), z, t);
        const sp = Math.hypot(v.ur, v.uz) || 1e-30;
        const step = e.lr * 0.010;
        r += (v.ur / sp) * step; z += (v.uz / sp) * step;
        if (!isFinite(r) || !isFinite(z)) break;
        if (r < e.lr * 0.02 || Math.abs(z) > Z0 * 1.02 || r > R0 * 1.02) break;
        ctx.lineTo(PX(side * r), PY(z)); drew++;
      }
      if (drew > 3) { ctx.strokeStyle = 'rgba(246,246,248,0.46)'; ctx.stroke(); }
    }

    /* the annulus, where the pulses live, and the pulses themselves */
    const ra = Math.sqrt(2 * Xa * t), rb = Math.sqrt(2 * Xb * t);
    ctx.fillStyle = 'rgba(246,246,248,0.05)';
    for (const sgn of [1, -1]) ctx.fillRect(Math.min(PX(sgn * ra), PX(sgn * rb)), PY(e.lz), Math.abs(PX(sgn * rb) - PX(sgn * ra)), PY(-e.lz) - PY(e.lz));
    if (!st.axisym) {
      const nP = pulseCount(t);
      ctx.lineWidth = 0.9;
      for (let i = 0; i < nP; i++) for (const sgn of [1, -1]) {
        const rr = ra + (rb - ra) * (i + 0.5) / nP;
        ctx.strokeStyle = 'rgba(246,246,248,' + (0.18 + 0.42 * Math.abs(Math.sin(6.283 * i / nP * 5 + phase * (st.spin ? 1 : 0)))).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(PX(sgn * rr), PY(e.lz)); ctx.lineTo(PX(sgn * rr), PY(-e.lz)); ctx.stroke();
      }
    }

    /* the core box: DECIDED geometry (the exponents), DRAWN contents */
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.strokeRect(PX(-e.lr), PY(e.lz), PX(e.lr) - PX(-e.lr), PY(-e.lz) - PY(e.lz));

    /* the singular point */
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, 2.4, 0, 6.284); ctx.fill();

    label(pad, pad + 12, 'r  (physical radius) →', INK4);
    label(pad, H - 26, W < 620 ? 'glow = swirl (out of the page) · lines = meridional flow' : 'glow = the swirl uθ, out of the page · lines = the meridional flow · the frame is fixed', INK5);
    label(W - pad, pad + 12, 'z', INK4, 'right');
    const asp = Math.pow(t, -h());
    label(cx, H - 10, W < 620 ? 'ℓr ' + fmtE(e.lr) + ' · ℓz ' + fmtE(e.lz) + ' · τ^(−h) ' + fmtE(asp)
      : 'ℓr = ' + fmtE(e.lr) + '    ℓz = ' + fmtE(e.lz) + '    the scaling ratio τ^(−h) = ' + fmtE(asp), INK3, 'center');
  }
  let scache = { key: '', cv: null };
  function paintSwirlSim(PX, PY, SX, SY) {
    const key = [h(), W, H].join('|');
    if (scache.key !== key) {
      const NX = 150, NY = 108;
      const off = document.createElement('canvas'); off.width = NX; off.height = NY;
      const octx = off.getContext('2d'); const img = octx.createImageData(NX, NY);
      let vmax = 0; const buf = new Float32Array(NX * NY);
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const sx = Math.abs((i + 0.5) / NX * 2 * SX - SX);
        const v = Eprof(sx * sx);                     /* the profile, in its own variable */
        buf[j * NX + i] = v; if (v > vmax) vmax = v;
      }
      for (let k = 0; k < NX * NY; k++) {
        const u = vmax > 0 ? Math.pow(buf[k] / vmax, 0.75) : 0;
        img.data[4 * k] = 246; img.data[4 * k + 1] = 246; img.data[4 * k + 2] = 248;
        img.data[4 * k + 3] = Math.round(120 * u);
      }
      octx.putImageData(img, 0, 0);
      scache = { key, cv: off };
    }
    ctx.save(); ctx.globalAlpha = 0.6; ctx.drawImage(scache.cv, 26, 26, W - 52, H - 52); ctx.restore();
  }

  let fcache = { key: '', cv: null };
  function paintSwirl(t) {
    const key = [t, h(), W, H].join('|');
    if (fcache.key !== key) {
      const NX = 150, NY = 108, R0 = 1.15, Z0 = 1.15;
      const off = document.createElement('canvas'); off.width = NX; off.height = NY;
      const octx = off.getContext('2d'); const img = octx.createImageData(NX, NY);
      let vmax = 0; const buf = new Float32Array(NX * NY);
      for (let j = 0; j < NY; j++) {
        const z = Z0 - (j + 0.5) / NY * 2 * Z0, q = qOf(z, t), qA = Math.pow(q, -Aexp());
        for (let i = 0; i < NX; i++) {
          const r = Math.abs((i + 0.5) / NX * 2 * R0 - R0);
          const v = qA * Eprof(r * r / (2 * q));
          buf[j * NX + i] = v; if (isFinite(v) && v > vmax) vmax = v;
        }
      }
      for (let k = 0; k < NX * NY; k++) {
        const u = vmax > 0 ? Math.pow(Math.min(1, buf[k] / vmax), 0.55) : 0;
        img.data[4 * k] = 246; img.data[4 * k + 1] = 246; img.data[4 * k + 2] = 248;
        img.data[4 * k + 3] = Math.round(160 * u);
      }
      octx.putImageData(img, 0, 0);
      fcache = { key, cv: off };
    }
    ctx.save(); ctx.globalAlpha = 0.6; ctx.drawImage(fcache.cv, 26, 26, W - 52, H - 52); ctx.restore();
  }

  function label(x, y, s, col, align) {
    ctx.fillStyle = col; ctx.font = '11px ' + (css('--font-mono') || 'monospace');
    ctx.textAlign = align || 'left'; ctx.fillText(s, x, y); ctx.textAlign = 'left';
  }
  const fmtE = (v) => (v === 0 ? '0' : (Math.abs(v) >= 1e-3 && Math.abs(v) < 1e5) ? v.toPrecision(3) : v.toExponential(2).replace('e', '×10^').replace('+', ''));

  /* ---------------------------------------------------------------- panel B: the window on h */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const mk = (t, a) => { const n = document.createElementNS(SVGNS, t); for (const k in a) n.setAttribute(k, a[k]); return n; };
  function drawWindow() {
    const el = $('ns-window'); el.innerHTML = '';
    const w = el.clientWidth || 900, hgt = 186, L = 44, R = 30, y = 108;
    el.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    const X = (v) => L + v / 0.3 * (w - L - R);
    const cap = (x, yy, s, anchor, cls) => { const t = mk('text', { x, y: yy, 'text-anchor': anchor || 'start', class: cls || 'lb' }); t.textContent = s; el.appendChild(t); };
    /* the forbidden ends */
    el.appendChild(mk('rect', { x: X(1 / 6), y: y - 30, width: X(0.3) - X(1 / 6) + 6, height: 60, fill: 'rgba(246,246,248,0.11)' }));
    el.appendChild(mk('rect', { x: X(0) - 6, y: y - 30, width: 6, height: 60, fill: 'rgba(246,246,248,0.55)' }));
    /* the window itself */
    el.appendChild(mk('rect', { x: X(0), y: y - 30, width: X(1 / 6) - X(0), height: 60, fill: 'rgba(246,246,248,0.035)' }));
    /* the axis */
    el.appendChild(mk('line', { x1: L, y1: y, x2: w - R, y2: y, stroke: css('--chart-axis'), 'stroke-width': 1 }));
    for (const v of [0, 0.05, 0.1, 1 / 6, 0.2, 0.25, 0.3]) {
      el.appendChild(mk('line', { x1: X(v), y1: y, x2: X(v), y2: y + 5, stroke: css('--chart-axis') }));
      cap(X(v), y + 18, v === 1 / 6 ? '1/6' : String(v), 'middle', 'ax');
    }
    cap(w - R + 4, y + 4, 'h', 'start', 'ax');
    /* what closes each end — one line each, on opposite sides, never crossing the markers */
    cap(X(0) + 8, y + 40, 'h = 0 is type I — the axisymmetric Liouville theorems exclude it', 'start');
    cap(w - R, y + 40, 'h ≥ 1/6 — the dissipation stops being integrable', 'end');
    cap(X(0.055), y - 42, 'the window the construction has to live in', 'start');
    /* the paper's value, and the reader's */
    const hv = h();
    el.appendChild(mk('line', { x1: X(0.01), y1: y - 22, x2: X(0.01), y2: y + 22, stroke: css('--series-2'), 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }));
    cap(X(0.01) + 7, y + 58, "the paper's 1/100", 'start', 'ax');
    el.appendChild(mk('line', { x1: X(hv), y1: y - 30, x2: X(hv), y2: y + 30, stroke: css('--ink'), 'stroke-width': 2 }));
    el.appendChild(mk('circle', { cx: X(hv), cy: y, r: 5, fill: css('--ink') }));
    cap(X(hv), y - 66, 'h = ' + qtext(Q(st.hn, HD)), 'middle', 'lb strong');
    el.appendChild(mk('line', { x1: X(hv), y1: y - 60, x2: X(hv), y2: y - 34, stroke: css('--ink-4'), 'stroke-width': 1 }));
  }

  /* ---------------------------------------------------------------- panel C: the criteria, decided */
  function drawCriteria() {
    const box = $('ns-criteria'); box.innerHTML = '';
    const hq = Q(st.hn, HD);
    let met = 0;
    for (const c of S.criteria) {
      const lhs = at(c.rule.lhs, st.hn), rhs = at(c.rule.rhs, st.hn);
      const ok = CMP[c.rule.cmp](lhs, rhs);
      const axisOnly = (c.id === 'typeI' || c.id === 'swirl');
      const live = !axisOnly || st.axisym;
      const verdict = ok ? c.met : c.fails;
      if (ok) met++;
      const row = document.createElement('div');
      row.className = 'crow' + (live ? '' : ' off') + (ok ? '' : ' bad');
      row.innerHTML = '<div class="cv">' + esc(live ? verdict : 'n/a') + '</div>'
        + '<div class="cn">' + esc(c.name) + '</div>'
        + '<div class="cs">' + esc(c.needs) + '</div>'
        + '<div class="ch">' + esc(c.here) + '<span class="ex"> · exact: ' + esc(qtext(lhs)) + ' ' + esc(c.rule.cmp) + ' ' + esc(qtext(rhs)) + ' is ' + (ok ? 'true' : 'false') + '</span></div>';
      box.appendChild(row);
    }
    /* the dichotomy, decided rather than asserted */
    const swirl = at(S.criteria.find((c) => c.id === 'swirl').rule.lhs, st.hn);   /* the Γ exponent */
    const typeI = qcmp(at(S.criteria.find((c) => c.id === 'typeI').rule.lhs, st.hn), at(S.criteria.find((c) => c.id === 'typeI').rule.rhs, st.hn)) < 0;
    const swirlBounded = qcmp(swirl, Q(0n, 1n)) >= 0;
    const verdict = $('ns-dich');
    const zero = st.hn === 0n;
    verdict.className = 'dich ' + (st.axisym ? (typeI || !swirlBounded ? 'no' : 'yes') : 'ok');
    verdict.innerHTML = st.axisym
      ? '<b>' + (zero ? 'h = 0 — the swirl is bounded and the maximum principle is satisfied. And the flow is exactly type I: |u| ≍ τ^{−1/2}, which the axisymmetric Liouville theorems exclude.'
        : (swirlBounded ? '' : 'h = ' + esc(qtext(hq)) + ' &gt; 0 — the flow is type II and escapes those theorems. And Γ ≍ τ^{−' + esc(qtext(hq)) + '} diverges, which the maximum principle forbids for an axisymmetric flow driven from rest by a bounded force.')) + '</b>'
        + '<span> Move h anywhere on the line: the two exclusions close on h = 0 from opposite sides. <em>There is no h at which an axisymmetric version of this construction can work.</em></span>'
      : '<b>The pulses carry nonzero integer angular frequencies, so the flow is not axisymmetric and neither exclusion applies.</b><span> That is the only reason the theorem is not false — and the paper never says it. Switch the flow to axisymmetric above and watch both exclusions fire.</span>';
    $('ns-met').textContent = met + ' of ' + S.criteria.length;
  }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------------------------------------------------------------- panel D: the swirl, drawn */
  function drawSwirl() {
    const el = $('ns-swirl'); el.innerHTML = '';
    const w = el.clientWidth || 520, hgt = 260, L = 52, R = 18, T = 18, B = 34;
    el.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    const lx0 = 0, lx1 = -12;                        /* log10 τ — time runs RIGHT, toward the singularity */
    const ly0 = -0.4, ly1 = 1.6;                     /* log10 Γ */
    const X = (v) => L + (v - lx0) / (lx1 - lx0) * (w - L - R);
    const Y = (v) => hgt - B - (v - ly0) / (ly1 - ly0) * (hgt - T - B);
    for (let k = 0; k >= -12; k -= 3) {
      el.appendChild(mk('line', { x1: X(k), y1: T, x2: X(k), y2: hgt - B, stroke: css('--chart-grid') }));
      const t = mk('text', { x: X(k), y: hgt - B + 15, 'text-anchor': 'middle', class: 'ax' }); t.textContent = '10^' + k; el.appendChild(t);
    }
    el.appendChild(mk('line', { x1: L, y1: hgt - B, x2: w - R, y2: hgt - B, stroke: css('--chart-axis') }));
    /* the ceiling: a constant, ∫|r f_θ| */
    const ceil = 0.35;
    el.appendChild(mk('line', { x1: L, y1: Y(ceil), x2: w - R, y2: Y(ceil), stroke: css('--series-2'), 'stroke-width': 2 }));
    const ct = mk('text', { x: L + 6, y: Y(ceil) + 16, 'text-anchor': 'start', class: 'lb' });
    ct.textContent = 'the ceiling a bounded force allows: sup|Γ| ≤ ∫|r f_θ|'; el.appendChild(ct);
    /* the construction's swirl: log Γ = −h log τ */
    const hv = h(); let d = '';
    for (let i = 0; i <= 120; i++) { const lt = lx0 + (lx1 - lx0) * i / 120; const lg = -hv * lt; d += (i ? 'L' : 'M') + X(lt).toFixed(1) + ' ' + Y(lg).toFixed(1); }
    el.appendChild(mk('path', { d, fill: 'none', stroke: css('--ink'), 'stroke-width': 2 }));
    const lt = mk('text', { x: w - R - 4, y: Y(-hv * lx1) - 10, 'text-anchor': 'end', class: 'lb strong' });
    lt.textContent = 'Γ = r·uθ ≍ τ^{−' + qtext(Q(st.hn, HD)) + '}'; el.appendChild(lt);
    /* where they cross */
    if (hv > 0) {
      const ltc = -ceil / hv;
      if (ltc < Math.max(lx0, lx1) && ltc > Math.min(lx0, lx1)) {
        el.appendChild(mk('line', { x1: X(ltc), y1: T, x2: X(ltc), y2: hgt - B, stroke: css('--ink-4'), 'stroke-dasharray': '2 3' }));
        const c2 = mk('text', { x: X(ltc) + 6, y: hgt - B - 8, 'text-anchor': 'start', class: 'lb strong' });
        c2.textContent = 'the swirl passes the ceiling at τ = 10^' + ltc.toFixed(1); el.appendChild(c2);
      }
    }
    const cur = mk('circle', { cx: X(st.logTau), cy: Y(-hv * st.logTau), r: 4, fill: css('--ink') });
    el.appendChild(cur);
    const yl = mk('text', { x: 6, y: T + 10, class: 'ax' }); yl.textContent = 'log₁₀ Γ'; el.appendChild(yl);
    const xl = mk('text', { x: w / 2, y: hgt - 4, 'text-anchor': 'middle', class: 'ax' }); xl.textContent = 'τ = 1 − t   →   toward the singularity'; el.appendChild(xl);
  }

  /* ---------------------------------------------------------------- panel E: the pulse (COMPUTED) */
  /* The WKB amplitude equation for an oscillation carried by a background shear:
       ξ̇ = −σ ξ⊥        (the shear tilts the wavevector, so |ξ|² = k₀²(1 + (στ)²))
       ȧ = λ(τ) a − ν|ξ(τ)|² a
     with λ the centrifugal/axial-shear amplification, which weakens as the wavevector
     tilts. Integrated here by RK4. This is the mechanism of §7 in its simplest honest
     form: growth first, viscous damping later, and the crossover set by the initial
     wavelength — the paper's Figure 3(b), reproduced from the mechanism rather than copied. */
  function pulse() {
    const k0 = st.k0, sig = st.shear, nu = 1;
    const N = 900, T1 = 3.4, dt = T1 / N;
    const k2 = (s) => k0 * k0 * (1 + (sig * s) * (sig * s));
    const lam = (s) => 2 * sig / (1 + (sig * s) * (sig * s));        /* amplification, tilting away */
    const f = (s, y) => (lam(s) - nu * k2(s) * 1e-3) * y;
    let y = 1, out = [[0, 1]], peak = 1, peakAt = 0;
    for (let i = 0; i < N; i++) {
      const s = i * dt;
      const k1 = f(s, y), k2_ = f(s + dt / 2, y + dt / 2 * k1), k3 = f(s + dt / 2, y + dt / 2 * k2_), k4 = f(s + dt, y + dt * k3);
      y += dt / 6 * (k1 + 2 * k2_ + 2 * k3 + k4);
      if (!isFinite(y)) break;
      if (y > peak) { peak = y; peakAt = s + dt; }
      out.push([s + dt, y]);
    }
    return { curve: out, peak, peakAt, end: y };
  }
  function drawPulse() {
    const el = $('ns-pulse'); el.innerHTML = '';
    const w = el.clientWidth || 520, hgt = 260, L = 52, R = 18, T = 18, B = 34;
    el.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    const P = pulse();
    const ymax = Math.max(1.2, P.peak * 1.12);
    const X = (v) => L + v / 3.4 * (w - L - R);
    const Y = (v) => hgt - B - v / ymax * (hgt - T - B);
    el.appendChild(mk('line', { x1: L, y1: hgt - B, x2: w - R, y2: hgt - B, stroke: css('--chart-axis') }));
    for (let k = 0; k <= 3; k++) {
      el.appendChild(mk('line', { x1: X(k), y1: T, x2: X(k), y2: hgt - B, stroke: css('--chart-grid') }));
      const t = mk('text', { x: X(k), y: hgt - B + 15, 'text-anchor': 'middle', class: 'ax' }); t.textContent = k; el.appendChild(t);
    }
    /* the growth region and the decay region, split at the peak */
    el.appendChild(mk('rect', { x: X(0), y: T, width: Math.max(0, X(P.peakAt) - X(0)), height: hgt - T - B, fill: 'rgba(246,246,248,0.05)' }));
    let d = '';
    for (const [s, v] of P.curve) d += (d ? 'L' : 'M') + X(s).toFixed(1) + ' ' + Y(v).toFixed(1);
    el.appendChild(mk('path', { d, fill: 'none', stroke: css('--ink'), 'stroke-width': 2 }));
    const cap = (x, y, s, a, c) => { const t = mk('text', { x, y, 'text-anchor': a || 'start', class: c || 'ax' }); t.textContent = s; el.appendChild(t); };
    cap(X(P.peakAt / 2), T + 14, 'growth: the shear feeds it', 'middle', 'lb');
    cap(X((P.peakAt + 3.4) / 2), T + 14, 'decay: the wavelength has shortened', 'middle', 'lb');
    cap(w / 2, hgt - 4, 'slot time', 'middle');
    cap(6, hgt - B - 6, 'amplitude', 'start');
    $('ns-peak').textContent = '×' + P.peak.toFixed(2) + ' at slot time ' + P.peakAt.toFixed(2) + ', ending at ×' + (P.end < 1e-4 ? P.end.toExponential(1) : P.end.toFixed(3));
    const k0o = $('ns-k0-v'), sho = $('ns-shear-v');
    if (k0o) k0o.textContent = String(st.k0);
    if (sho) sho.textContent = st.shear.toFixed(2);
  }

  /* ---------------------------------------------------------------- panel F: the exterior (COMPUTED) */
  function Hint(Z, hh) {
    const f = (wv) => { const v = wv * wv; return 2 * wv * Math.exp(-v) * Math.pow(v, hh) * Math.pow(1 + Z * v, -hh); };
    const a = 0, b = Math.sqrt(60), n = 1200, dw = (b - a) / n; let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * dw) * (i % 2 ? 4 : 2);
    return (s * dw / 3) / gamma(1 + hh);
  }
  function gamma(x) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
    x -= 1; let a = c[0]; const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
  }
  function drawExterior() {
    const el = $('ns-ext'); el.innerHTML = '';
    const w = el.clientWidth || 520, hgt = 220, L = 52, R = 18, T = 16, B = 32;
    el.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    const hh = Math.max(1e-4, h());
    const X = (lz) => L + (lz + 3) / 7 * (w - L - R);
    const Y = (v) => hgt - B - v / 1.05 * (hgt - T - B);
    el.appendChild(mk('line', { x1: L, y1: hgt - B, x2: w - R, y2: hgt - B, stroke: css('--chart-axis') }));
    for (let k = -3; k <= 4; k += 1) {
      el.appendChild(mk('line', { x1: X(k), y1: T, x2: X(k), y2: hgt - B, stroke: css('--chart-grid') }));
      if (k % 2 === 0) { const t = mk('text', { x: X(k), y: hgt - B + 14, 'text-anchor': 'middle', class: 'ax' }); t.textContent = '10^' + k; el.appendChild(t); }
    }
    let d = '', H0 = 0, H1 = 0, H2 = 0;
    for (let i = 0; i <= 140; i++) {
      const lz = -3 + 7 * i / 140, Z = Math.pow(10, lz), v = Hint(Z, hh);
      d += (i ? 'L' : 'M') + X(lz).toFixed(1) + ' ' + Y(v).toFixed(1);
    }
    el.appendChild(mk('path', { d, fill: 'none', stroke: css('--ink'), 'stroke-width': 2 }));
    /* the residual of (A.37) at one Z, by finite differences on the same quadrature */
    const Z = 1, e = 1e-4;
    H0 = Hint(Z, hh); H1 = (Hint(Z + e, hh) - Hint(Z - e, hh)) / (2 * e);
    H2 = (Hint(Z + e, hh) - 2 * H0 + Hint(Z - e, hh)) / (e * e);
    const res = Z * Z * H2 + (1 + 2 * (1 + hh) * Z) * H1 + hh * (1 + hh) * H0;
    $('ns-res').textContent = res.toExponential(1);
    const t = mk('text', { x: w / 2, y: hgt - 4, 'text-anchor': 'middle', class: 'ax' }); t.textContent = 'Z = 4τ/r²'; el.appendChild(t);
    const t2 = mk('text', { x: 6, y: T + 10, class: 'ax' }); t2.textContent = 'H(Z)'; el.appendChild(t2);
  }

  /* ---------------------------------------------------------------- readouts */
  function drawNumbers() {
    const box = $('ns-nums'); box.innerHTML = '';
    const t = tau(), lt = st.logTau;
    for (const x of S.exponents) {
      const q = at(x.e, st.hn), ex = qnum(q);
      const val = Math.pow(10, ex * lt);
      const row = document.createElement('div');
      row.className = 'nrow';
      row.innerHTML = '<span class="ns">' + esc(x.sym) + '</span>'
        + '<span class="ne">τ<sup>' + esc(qtext(q)) + '</sup></span>'
        + '<span class="nv">' + esc(fmtE(val)) + '</span>'
        + '<span class="nw">' + esc(x.what) + '</span>';
      box.appendChild(row);
    }
    const hv = h();
    const tau10 = hv > 0 ? Math.pow(10, -1 / hv) : null;
    const el10 = $('ns-el10');
    if (el10) el10.innerHTML = hv === 0
      ? 'at h = 0 the core never elongates: its two scales stay in a fixed ratio for ever.'
      : 'at this h the core is ten times longer than it is wide only at <b>τ = 10<sup>−' + Math.round(1 / hv) + '</sup></b>'
        + (1 / hv > 30 ? ' — a number with no physical meaning, which is what "asymptotic" costs.' : '.');
    $('ns-tau').textContent = '10^' + st.logTau.toFixed(2);
    $('ns-h').textContent = qtext(Q(st.hn, HD));
  }

  /* ---------------------------------------------------------------- loop and wiring */
  let phase = 0, raf = 0;
  function frame() { phase += 0.045; drawCore(phase); raf = requestAnimationFrame(frame); }
  function redraw() { palette(); fit(); drawCore(phase); drawWindow(); drawCriteria(); drawSwirl(); drawPulse(); drawExterior(); drawNumbers(); }

  function bind(id, fn) { const e = $(id); if (e) e.addEventListener('input', fn); }
  bind('ns-tau-r', (ev) => { st.logTau = Number(ev.target.value); drawCore(phase); drawSwirl(); drawNumbers(); });
  bind('ns-h-r', (ev) => { st.hn = BigInt(Math.round(Number(ev.target.value))); redrawSlow(); });
  bind('ns-k0', (ev) => { st.k0 = Number(ev.target.value); drawPulse(); });
  bind('ns-shear', (ev) => { st.shear = Number(ev.target.value); drawPulse(); });
  function redrawSlow() { drawCore(phase); drawWindow(); drawCriteria(); drawSwirl(); drawExterior(); drawNumbers(); }
  $('ns-view').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    st.view = b.dataset.view; for (const x of $('ns-view').querySelectorAll('button')) x.classList.toggle('on', x === b);
    drawCore(phase);
  });
  $('ns-axisym').addEventListener('change', (ev) => { st.axisym = ev.target.checked; drawCore(phase); drawCriteria(); });
  $('ns-trails').addEventListener('change', (ev) => { st.trails = ev.target.checked; drawCore(phase); });
  $('ns-spin').addEventListener('change', (ev) => { st.spin = ev.target.checked; });
  for (const b of document.querySelectorAll('[data-seth]')) b.addEventListener('click', () => {
    st.hn = BigInt(b.dataset.seth); $('ns-h-r').value = b.dataset.seth; redrawSlow();
  });
  window.addEventListener('resize', () => { clearTimeout(window.__nsT); window.__nsT = setTimeout(redraw, 120); });
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  palette(); fit(); redraw();
  if (!mq.matches) frame(); else drawCore(0);
})();
