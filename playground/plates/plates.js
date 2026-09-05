/* build-geometries.js — render site/geometries/index.html.
   node tools/build-geometries.js

   A plate series, not an instrument. Every figure is generated at build time
   from a stated rule and stated parameters, drawn into inline SVG, and read
   from a record on disk where it uses one. Nothing moves, nothing is clickable,
   and the caption under each plate is the rule that produced it.

   THE PREMISE. Goodfire's neural-geometry series extracts geometry from a
   working model and asks what it means: days of the week on a circle, colour as
   an HSL surface, a number stored as a residue across a product of circles, a
   story meandering along a manifold of emotions. We cannot do that here — a
   model call sends prompts off this machine and the send is held — and copying
   the pictures would be the wrong thing anyway. So the pass is inverted: their
   manifolds are FOUND and ours are STATED. Same subject, opposite direction.

   Data read, never retyped:
     experiments/interferometer/out/page-data.json   838 visibilities
     experiments/interferometer/out/cp-sweep.json    the certified brackets
     experiments/mfg-terra/band-sigma-0.0008-0.008.json  39 certified cells   */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
/* PATCH (declared in PROVENANCE.json): the bench page shell is replaced by
   build.js in this repository's design system. */

const { encodePNG } = require(path.join(__dirname, '..', 'png.js'));
/* PATCH: OUR certificate, not the bench's — 86 a-boxes and 1,350 b-boxes
   against their 332 and 40,000. Same theorem, same bound, a coarser box
   schedule, and the plate prints its own counts rather than theirs. */
const FORCE = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'certs', 'erdos1038-forcing-1.828.json'), 'utf8'));
const IFM = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'interferometer', 'out', 'page-data.json'), 'utf8'));
const SWEEP = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'interferometer', 'out', 'cp-sweep.json'), 'utf8'));
const BAND = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'band-sigma-0.0008-0.008.json'), 'utf8'));

const ink = (a) => `rgba(246,246,248,${a})`;
/* NO GROUND RECT, 2026-09-05. This helper painted a full-bleed rect of the PAGE
   ground inside every plate, while `.plate figure` around it paints --bg-raised.
   Two grounds, one nested in the other, one value apart: that is the visible
   inner panel inside the outer card reported as C-2 in the visual review. The
   SVG is transparent now and the figure's own surface shows through, which also
   puts plates on the same ground as every other figure on the site.

   CAP is the band reserved UNDER the drawing for a bottom caption. It used to
   be drawn at H - 22, inside the picture, so Plate I's threading ran straight
   through its own caption (C-1). The contract's rule for this is to widen the
   viewBox rather than move the text into the art. */
const CAP = 26;
const svg = (w, h, body, extra = '') =>
  `<svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet" ${extra}>${body}</svg>`;
const txt = (x, y, s, o = 0.42, size = 9, anchor = 'start') =>
  `<text x="${x}" y="${y}" fill="${ink(o)}" font-family="ui-monospace,monospace" font-size="${size}" text-anchor="${anchor}">${s}</text>`;

/* ---------------------------------------------------------------- PLATE 1 */
/* A number as a point on a product of circles. Goodfire's object, drawn from
   its definition rather than recovered from activations. */
function plateResidue() {
  const W = 980, H = 560, MODS = [2, 5, 10, 100], N = 100;
  const cx = W / 2, cy = H / 2 + 10;
  const radii = [58, 118, 186, 262];
  const parts = [];
  for (let i = 0; i < MODS.length; i++) {
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${radii[i]}" fill="none" stroke="${ink(0.1)}" stroke-width="1"/>`);
    /* the label goes on the ring's own top edge, not across the drawing */
    parts.push(txt(cx + 6, cy - radii[i] - 6, `mod ${MODS[i]}`, 0.28));
  }
  /* the thread: each n joins its residue on every circle */
  for (let n = 0; n < N; n++) {
    const pts = MODS.map((m, i) => {
      const th = 2 * Math.PI * ((n % m) / m) - Math.PI / 2;
      return [cx + radii[i] * Math.cos(th), cy + radii[i] * Math.sin(th)];
    });
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    parts.push(`<path d="${d}" fill="none" stroke="${ink(0.055 + 0.1 * (n % 10) / 10)}" stroke-width="0.7"/>`);
  }
  for (let i = 0; i < MODS.length; i++) {
    const m = MODS[i];
    for (let k = 0; k < m; k++) {
      const th = 2 * Math.PI * (k / m) - Math.PI / 2;
      const x = cx + radii[i] * Math.cos(th), y = cy + radii[i] * Math.sin(th);
      parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${m > 20 ? 1 : 2.2}" fill="${ink(m > 20 ? 0.35 : 0.85)}"/>`);
    }
  }
  /* 17, called out, because it is the example in the source */
  const seventeen = MODS.map((m, i) => {
    const th = 2 * Math.PI * ((17 % m) / m) - Math.PI / 2;
    return [cx + radii[i] * Math.cos(th), cy + radii[i] * Math.sin(th)];
  });
  parts.push(`<path d="${seventeen.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${ink(0.95)}" stroke-width="1.6"/>`);
  seventeen.forEach((p, i) => {
    parts.push(`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.4" fill="var(--bg-raised)" stroke="${ink(0.95)}" stroke-width="1.4"/>`);
    parts.push(txt(p[0] + 7, p[1] - 6, `${17 % MODS[i]}`, 0.9, 10));
  });
  parts.push(txt(28, 30, 'PLATE I', 0.3, 9));
  parts.push(txt(28, H + CAP - 9, 'n = 0 … 99 threaded across mod 2, 5, 10, 100.  the heavy thread is 17.', 0.3));
  return svg(W, H + CAP, parts.join(''));
}

/* ---------------------------------------------------------------- PLATE 2 */
/* The same object, handed to us by an instrument: each visibility is a known
   radius and an unknown angle. */
function platePhaseTorus() {
  const W = 980, H = 700, cx = W / 2, cy = H / 2 + 10;
  const u = IFM.vis.u, v = IFM.vis.v, A = IFM.vis.A;
  let uvMax = 0; for (let i = 0; i < u.length; i++) uvMax = Math.max(uvMax, Math.hypot(u[i], v[i]));
  const sc = (Math.min(W, H) / 2 - 70) / (uvMax * 1.03);
  const Amax = Math.max(...A);
  const parts = [];
  for (let g = 2; g <= 8; g += 2) {
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${(g * 1e9 * sc).toFixed(1)}" fill="none" stroke="${ink(0.055)}" stroke-width="1"/>`);
    parts.push(txt(cx + 6, cy - g * 1e9 * sc - 5, `${g} Gλ`, 0.22));
  }
  for (let i = 0; i < u.length; i++) {
    const r = 2 + 13 * Math.sqrt(A[i] / Amax);
    for (const s of [1, -1]) {
      const x = cx + s * u[i] * sc, y = cy - s * v[i] * sc;
      parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="none" stroke="${ink(0.2)}" stroke-width="0.6"/>`);
      parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.9" fill="${ink(0.7)}"/>`);
    }
  }
  parts.push(txt(28, 30, 'PLATE II', 0.3, 9));
  parts.push(txt(28, H + CAP - 9, `${u.length} visibilities from M87. each ring is one measurement: the radius is known, the angle on it is not.`, 0.3));
  return svg(W, H + CAP, parts.join(''));
}

/* ---------------------------------------------------------------- PLATE 3 */
/* The linearised congestion mean-field game, swept across the certified band.
   m(x) = 1 + 2 SUM_k B_k cos(2 pi k x),  B_k = -c(kappa_k) A_k,
   c(kappa) = kappa / ((1 + sigma kappa)^2 + gamma kappa),  kappa_k = (2 pi k)^2. */
function plateSplitting() {
  const W = 980, H = 760, L = 152, R = W - 60, T = 74, B = H - 74;
  const gamma = 0.01, A1 = 0.003, A2 = 0.0006;
  const SIG_STAR = 1 / (8 * Math.PI * Math.PI);
  /* sweep PAST the crossover, not just across the certified band: the whole
     band splits, so a plate confined to it has no contrast and hides its own
     subject. The band is marked on the axis instead. */
  const S0 = 0.0008, S1 = 0.020, NS = 52;
  const cOf = (k, s) => { const kap = (2 * Math.PI * k) ** 2; return kap / ((1 + s * kap) ** 2 + gamma * kap); };
  /* the LINEAR model's own threshold, solved exactly rather than read off the
     sampling grid: |B1| = 4|B2|  <=>  c(k1) A1 = 4 c(k2) A2 */
  let tLo = 1e-5, tHi = 0.05;
  for (let it = 0; it < 200; it++) {
    const m = (tLo + tHi) / 2;
    if (Math.abs(cOf(1, m) * A1) < 4 * Math.abs(cOf(2, m) * A2)) tLo = m; else tHi = m;
  }
  const THRESH = (tLo + tHi) / 2;
  const rows = [];
  for (let i = 0; i < NS; i++) {
    const s = S0 * Math.pow(S1 / S0, i / (NS - 1));            // log sweep
    const B1 = -cOf(1, s) * A1, B2 = -cOf(2, s) * A2;
    const pts = [];
    for (let j = 0; j <= 300; j++) {
      const x = j / 300;
      pts.push(2 * B1 * Math.cos(2 * Math.PI * x) + 2 * B2 * Math.cos(4 * Math.PI * x));
    }
    /* per-row normalisation: this is a plate about SHAPE, and the modulation
       shrinks by two orders across the sweep. Stated in the rule below. */
    let lo = Infinity, hi = -Infinity;
    for (const y of pts) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    rows.push({ s, pts: pts.map(y => (y - lo) / (hi - lo || 1)), split: Math.abs(B1) < 4 * Math.abs(B2), inBand: s <= 0.008 + 1e-12 });
  }
  const amp = 2.6 * (B - T) / NS;
  const parts = [];
  const yOf = (i) => T + (i * (B - T)) / (NS - 1);
  rows.forEach((r, i) => {
    const y0 = yOf(i);
    const d = r.pts.map((y, j) => {
      const X = L + (j / 300) * (R - L);
      return (j ? 'L' : 'M') + X.toFixed(1) + ' ' + (y0 - (y - 0.5) * amp).toFixed(1);
    }).join(' ');
    parts.push(`<path d="${d}" fill="none" stroke="${ink(r.split ? 0.9 : 0.22)}" stroke-width="${r.split ? 1.05 : 0.75}"/>`);
    if (i % 7 === 0) parts.push(txt(L - 84, y0 + 3, r.s.toFixed(4), 0.28, 8, 'end'));
    /* the two maxima, marked on every fourth split row: the point of the plate
       is a count, and a count should be visible rather than asserted */
    if (r.split && i % 4 === 0) {
      for (let j = 1; j < r.pts.length - 1; j++) {
        if (r.pts[j] > r.pts[j - 1] && r.pts[j] >= r.pts[j + 1]) {
          const X = L + (j / 300) * (R - L);
          parts.push(`<circle cx="${X.toFixed(1)}" cy="${(y0 - (r.pts[j] - 0.5) * amp).toFixed(1)}" r="1.7" fill="${ink(0.95)}"/>`);
        }
      }
    }
  });
  /* the certified band, and the crossover, marked where they belong */
  const firstOut = rows.findIndex(r => !r.inBand);
  const yBand = yOf(Math.max(0, firstOut - 1));
  const xBar = L - 30;
  parts.push(`<line x1="${xBar}" y1="${yOf(0).toFixed(1)}" x2="${xBar}" y2="${yBand.toFixed(1)}" stroke="${ink(0.8)}" stroke-width="2"/>`);
  parts.push(`<line x1="${xBar - 4}" y1="${yOf(0).toFixed(1)}" x2="${xBar + 4}" y2="${yOf(0).toFixed(1)}" stroke="${ink(0.8)}" stroke-width="1.4"/>`);
  parts.push(`<line x1="${xBar - 4}" y1="${yBand.toFixed(1)}" x2="${xBar + 4}" y2="${yBand.toFixed(1)}" stroke="${ink(0.8)}" stroke-width="1.4"/>`);
  parts.push(txt(xBar - 6, (yOf(0) + yBand) / 2, 'certified', 0.62, 8, 'end'));
  const iStar = rows.findIndex(r => r.s >= SIG_STAR);
  if (iStar > 0) {
    const yS = yOf(iStar);
    parts.push(`<line x1="${L}" y1="${yS.toFixed(1)}" x2="${R}" y2="${yS.toFixed(1)}" stroke="${ink(0.3)}" stroke-dasharray="2 5"/>`);
    parts.push(txt(R, yS - 6, 'σ* = 1/(8π²) — where the second harmonic stops being amplified', 0.42, 9, 'end'));
  }
  const iSplit = rows.map((r, i) => (r.split ? i : -1)).filter(i => i >= 0).pop();
  if (iSplit >= 0 && iSplit < NS - 1) {
    const yT = (yOf(iSplit) + yOf(iSplit + 1)) / 2;
    parts.push(`<line x1="${L}" y1="${yT.toFixed(1)}" x2="${R}" y2="${yT.toFixed(1)}" stroke="${ink(0.55)}"/>`);
    parts.push(txt(R, yT + 14, `two maxima above this line, one below — the linear model's threshold, σ = ${THRESH.toFixed(9)}`, 0.55, 9, 'end'));
  }
  parts.push(txt(28, 30, 'PLATE III', 0.3, 9));
  parts.push(txt(L, B + 30, 'x on the torus  →', 0.3));
  parts.push(txt(L - 84, T - 20, 'σ', 0.3, 9, 'end'));
  return svg(W, H, parts.join(''));
}

/* ---------------------------------------------------------------- PLATE 4 */
/* The certificate, drawn. p(r) = (1/2) Z2 r^2 - (1 - Z1) r + Y0 for all 39
   certified cells, each with the radius at which p(r) < 0 was verified. */
function plateContraction() {
  const W = 980, H = 620, L = 80, R = W - 60, T = 70, B = H - 80;
  const cells = BAND.cells.filter(c => c.ok);
  /* PATCH (declared in PROVENANCE.json). The axis used to run from 1e-12 to the
     largest rMax, which is two decades past the last verified radius — so every
     curve's zero crossing, which is the entire subject, was squeezed into a
     hairline at the bottom while the right quarter of the plate held nothing but
     the parabolas climbing out of range. The range is now set by the DECISIONS:
     a decade below the smallest verified radius, four times above the largest. */
  const rLo = Math.min(...cells.map(c => c.r)) / 10;
  const rmax = Math.max(...cells.map(c => c.r)) * 4;
  const lo10 = Math.log10(rLo), hi10 = Math.log10(rmax);
  const X = (r) => L + (Math.log10(Math.min(Math.max(r, rLo), rmax)) - lo10) / (hi10 - lo10) * (R - L);
  const pAt = (c, r) => 0.5 * c.Z2 * r * r - (1 - c.Z1) * r + c.Y0;
  /* PATCH (declared): the vertical range used to be the parabolas' own extremes,
     and those run four orders of magnitude below zero at the right-hand end — so
     the whole subject, the crossings, was pressed into a hairline at the top
     while the plate spent its height drawing curves diving out of frame. The
     range is now SYMMETRIC ABOUT ZERO and scaled to the defect Y0, which is what
     each curve has to be driven below. Curves that plunge past it are clipped at
     the frame, and the footer says so rather than letting the clip pass as data. */
  const yTop = Math.max(...cells.map((c) => c.Y0)) * 1.6;
  const pmin = -yTop, pmax = yTop;
  const Y = (p) => B - ((Math.min(Math.max(p, pmin), pmax) - pmin) / (pmax - pmin)) * (B - T);
  const parts = [`<line x1="${L}" y1="${Y(0).toFixed(1)}" x2="${R}" y2="${Y(0).toFixed(1)}" stroke="${ink(0.22)}" stroke-dasharray="3 4"/>`];
  cells.forEach((c, i) => {
    const d = [];
    for (let k = 0; k <= 120; k++) {
      const r = Math.pow(10, lo10 + (hi10 - lo10) * (k / 120));
      d.push((k ? 'L' : 'M') + X(r).toFixed(1) + ' ' + Y(pAt(c, r)).toFixed(1));
    }
    parts.push(`<path d="${d.join(' ')}" fill="none" stroke="${ink(0.13 + 0.5 * (i / cells.length))}" stroke-width="0.8"/>`);
    parts.push(`<circle cx="${X(c.r).toFixed(1)}" cy="${Y(pAt(c, c.r)).toFixed(1)}" r="2" fill="${ink(0.9)}"/>`);
  });
  parts.push(txt(28, 30, 'PLATE IV', 0.3, 9));
  parts.push(txt(L, B + 30, 'radius r, log scale  →', 0.3));
  /* PATCH (declared): this label sat at the LEFT end of the zero line, which is
     the middle of the plate and exactly where every curve is crossing it — the
     one place on the plate that is never empty. The range is symmetric about
     zero, every curve starts flat and high on the left and every one of them
     has crossed by the middle, so the quadrant BELOW the line and LEFT of the
     crossings is the one large empty field on the plate. The right end is not
     empty: the parabolas turn back up before rmax, which is visible and was
     the first place this label was moved to. */
  parts.push(txt(L, Y(0) + 17, 'p(r) = 0 — above this line nothing is proved', 0.35));
  parts.push(txt(R, B + 30, 'dots: the radius at which p(r) < 0 was verified in interval arithmetic', 0.42, 9, 'end'));
  parts.push(txt(L, T - 10, 'vertical range is ±1.6 × the largest defect; curves that plunge further are clipped at the frame', 0.32, 8));
  return svg(W, H, parts.join(''));
}

/* ---------------------------------------------------------------- PLATE 5 */
/* The enclosure as a solid: everything between the two curves is a sky the
   data still allow. */
function plateEnclosure() {
  const W = 980, H = 520, L = 90, R = W - 70, T = 70, B = H - 80;
  const rows = SWEEP.rows.slice().sort((a, b) => a.r0 - b.r0);
  const rmax = rows[rows.length - 1].r0, fmax = Math.max(...rows.map(r => r.ceiling)) * 1.15;
  const X = (r) => L + (r / rmax) * (R - L);
  const Y = (f) => B - (f / fmax) * (B - T);
  const up = rows.map((r, i) => (i ? 'L' : 'M') + X(r.r0).toFixed(1) + ' ' + Y(r.ceiling).toFixed(1)).join(' ');
  const dn = rows.slice().reverse().map((r) => 'L' + X(r.r0).toFixed(1) + ' ' + Y(r.witness).toFixed(1)).join(' ');
  const parts = [];
  for (let g = 0; g <= 4; g++) {
    const f = (fmax * g) / 4;
    parts.push(`<line x1="${L}" y1="${Y(f).toFixed(1)}" x2="${R}" y2="${Y(f).toFixed(1)}" stroke="${ink(0.06)}"/>`);
    parts.push(txt(L - 10, Y(f) + 3, f.toFixed(2), 0.28, 8, 'end'));
  }
  parts.push(`<path d="${up} ${dn} Z" fill="${ink(0.1)}" stroke="none"/>`);
  parts.push(`<path d="${up}" fill="none" stroke="${ink(0.85)}" stroke-width="1.4"/>`);
  parts.push(`<path d="${rows.map((r, i) => (i ? 'L' : 'M') + X(r.r0).toFixed(1) + ' ' + Y(r.witness).toFixed(1)).join(' ')}" fill="none" stroke="${ink(0.5)}" stroke-width="1.4" stroke-dasharray="4 3"/>`);
  rows.forEach(r => {
    parts.push(`<circle cx="${X(r.r0).toFixed(1)}" cy="${Y(r.ceiling).toFixed(1)}" r="2.6" fill="${ink(0.9)}"/>`);
    parts.push(`<circle cx="${X(r.r0).toFixed(1)}" cy="${Y(r.witness).toFixed(1)}" r="2.6" fill="var(--bg-raised)" stroke="${ink(0.6)}"/>`);
    parts.push(txt(X(r.r0), B + 22, `${r.r0}`, 0.3, 9, 'middle'));
    parts.push(txt(X(r.r0), Y(r.ceiling) - 10, `${r.ratio.toFixed(2)}×`, 0.45, 8, 'middle'));
  });
  parts.push(txt(28, 30, 'PLATE V', 0.3, 9));
  parts.push(txt(L, B + 42, 'radius r, µas  →', 0.3));
  parts.push(txt(L - 10, T - 18, 'Jy', 0.3, 9, 'end'));
  parts.push(txt(R, T - 18, 'solid: a bound on every sky.  dashed: a sky that exists.', 0.42, 9, 'end'));
  return svg(W, H, parts.join(''));
}

/* raster plates: some of these objects are hundreds of thousands of cells and
   belong in a pixel buffer, not in an SVG with 40,000 rects in it */
const dataURI = (w, h, rgb) => 'data:image/png;base64,' + encodePNG(w, h, rgb).toString('base64');
const framed = (uri, w, h, stamp, foot) => svg(w, h + 56,
  `<image x="0" y="26" width="${w}" height="${h}" href="${uri}" image-rendering="auto"/>` +
  txt(28, 20, stamp, 0.3, 9) + txt(28, h + 46, foot, 0.3));

/* ---------------------------------------------------------------- PLATE VI */
/* The array's own signature: what this telescope sees when it looks at a
   single point. Pure rule, no data beyond the 838 sampled frequencies. */
function plateBeam() {
  const N = 620, FOV = 170 * 4.84813681109536e-12;   // ±170 µas — enough field for the rings to close
  const u = IFM.vis.u, v = IFM.vis.v, K = u.length;
  const buf = new Float64Array(N * N);
  const co = new Float64Array(N);
  for (let i = 0; i < N; i++) co[i] = -FOV + (2 * FOV * i) / (N - 1);
  /* separable: cos(A+B) = cosA cosB − sinA sinB, so the inner loop is four
     multiplies instead of a trig call */
  const CA = new Float64Array(N * K), SA = new Float64Array(N * K);
  const CB = new Float64Array(N * K), SB = new Float64Array(N * K);
  for (let i = 0; i < N; i++) {
    const b = i * K;
    for (let k = 0; k < K; k++) {
      const A1 = 2 * Math.PI * u[k] * co[i], B1 = 2 * Math.PI * v[k] * co[i];
      CA[b + k] = Math.cos(A1); SA[b + k] = Math.sin(A1);
      CB[b + k] = Math.cos(B1); SB[b + k] = Math.sin(B1);
    }
  }
  let lo = Infinity, hi = -Infinity;
  for (let j = 0; j < N; j++) {
    const bj = j * K;
    for (let i = 0; i < N; i++) {
      const bi = i * K; let acc = 0;
      for (let k = 0; k < K; k++) acc += CA[bi + k] * CB[bj + k] - SA[bi + k] * SB[bj + k];
      buf[j * N + i] = acc; if (acc < lo) lo = acc; if (acc > hi) hi = acc;
    }
  }
  /* SIGNED, asinh-scaled. A linear ramp buries this figure: the central spike is
     the sum of all K terms and everything else is a small oscillation about
     zero, so a linear map paints the whole field one flat grey. asinh keeps the
     spike on scale while opening up four decades underneath it, and the two
     signs get different ceilings because a positive sidelobe and a negative one
     are different facts about the instrument. */
  const kk = 12;   /* 260 turned the field into camouflage; 12 keeps the spike a spike */
  const asinhN = (x) => Math.asinh(kk * x) / Math.asinh(kk);
  const rgb = new Float64Array(N * N * 3);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const v = buf[(N - 1 - j) * N + i];
    const g = v >= 0 ? 0.015 + 0.985 * asinhN(v / hi) : 0.015 + 0.20 * asinhN(-v / Math.abs(lo));
    const o = (j * N + i) * 3; rgb[o] = rgb[o + 1] = rgb[o + 2] = Math.min(1, g);
  }
  return framed(dataURI(N, N, rgb), 860, 860, 'PLATE VI',
    `the dirty beam: Σ over ${K} sampled frequencies of cos(2π u·x), ±170 µas, asinh-scaled. bright is positive, dim is negative.`);
}

/* --------------------------------------------------------------- PLATE VII */
/* A proof, tiled. 40,000 boxes, shaded by how much margin each one had. */
function plateProof() {
  const W = 1080, H = 620;
  const boxes = FORCE.boxes;
  let aLo = Infinity, aHi = -Infinity, bHi = 0, mLo = Infinity, mHi = 0, n = 0;
  for (const A of boxes) {
    aLo = Math.min(aLo, A.a[0]); aHi = Math.max(aHi, A.a[1]);
    for (const b of A.bboxes) { bHi = Math.max(bHi, b.b[1]); mLo = Math.min(mLo, b.min); mHi = Math.max(mHi, b.min); n++; }
  }
  const rgb = new Float64Array(W * H * 3).fill(0.0);   // uncovered is true black
  const L = Math.log10(mLo), Hh = Math.log10(mHi);
  for (const A of boxes) {
    const x0 = Math.round(((A.a[0] - aLo) / (aHi - aLo)) * (W - 1));
    const x1 = Math.max(x0 + 1, Math.round(((A.a[1] - aLo) / (aHi - aLo)) * (W - 1)));
    for (const b of A.bboxes) {
      const y0 = Math.round((1 - b.b[1] / bHi) * (H - 1));
      const y1 = Math.max(y0 + 1, Math.round((1 - b.b[0] / bHi) * (H - 1)));
      /* INVERTED on purpose. The first pass shaded comfortable boxes bright,
         which put all the ink on the easy part and left the ground and the
         tightest boxes the same black. The interesting object is where the
         argument nearly ran out, so that is what glows; uncovered stays 0. */
      const t = (Math.log10(Math.max(b.min, mLo)) - L) / (Hh - L);
      const g = 0.12 + 0.86 * Math.pow(1 - t, 1.4);
      for (let y = y0; y <= Math.min(H - 1, y1); y++) for (let x = x0; x <= Math.min(W - 1, x1); x++) {
        const o = (y * W + x) * 3; rgb[o] = rgb[o + 1] = rgb[o + 2] = g;
      }
    }
  }
  return framed(dataURI(W, H, rgb), 1080, 620, 'PLATE VII',
    `${n.toLocaleString('en')} boxes over a ∈ [${aLo.toFixed(3)}, ${aHi.toFixed(3)}] × b ∈ [0, ${bHi.toFixed(3)}]. bright is a box that nearly failed; black is outside the covering. the tightest margin in the whole proof is ${mLo.toExponential(2)}.`);
}

/* -------------------------------------------------------------- PLATE VIII */
/* The certificate's actual content: the forcing weights, as a texture. */
function plateWeights() {
  /* PATCH (declared in PROVENANCE.json). This drew all 61 teeth at 14px and 2px
     a row, and the linear programme never reaches past the first handful — so
     92% of the picture was black by construction and the rest was a 172px strip.
     The plate now measures how many teeth are ever used, crops to those, and
     says the count in its own footer, because "the programme used three of
     sixty-one" is the finding rather than an excuse for the crop. */
  const rows = FORCE.boxes.length;
  const ROWSUM = FORCE.boxes.map((A) => {
    const acc = new Float64Array(61); let cnt = 0;
    for (const b of A.bboxes) { for (let i = 0; i < Math.min(61, b.w.length); i++) acc[i] += b.w[i]; cnt++; }
    let mx = 0; for (let i = 0; i < 61; i++) { acc[i] /= (cnt || 1); mx = Math.max(mx, acc[i]); }
    return { acc, mx, used: acc.reduce((n, v) => n + (v > 1e-9 * mx ? 1 : 0), 0) };
  });
  const lastLit = Math.max(...ROWSUM.map((r) => {
    let last = 0; for (let i = 0; i < 61; i++) if (r.mx > 0 && r.acc[i] / r.mx > 0.005) last = i;
    return last;
  }));
  const cols = Math.min(61, lastLit + 2);
  const CELL = Math.max(14, Math.round(840 / cols)), SCALE = 6;
  const W = cols * CELL, H = rows * SCALE;
  const rgb = new Float64Array(W * H * 3).fill(0.03);
  ROWSUM.forEach((row, r) => {
    for (let c = 0; c < cols; c++) {
      const g = row.mx > 0 ? 0.03 + 0.95 * Math.pow(row.acc[c] / row.mx, 0.42) : 0.03;
      for (let dy = 0; dy < SCALE; dy++) for (let dx = 0; dx < CELL; dx++) {
        const x = c * CELL + dx, y = r * SCALE + dy;
        if (x < W && y < H) { const o = (y * W + x) * 3; rgb[o] = rgb[o + 1] = rgb[o + 2] = g; }
      }
    }
  });
  const used = ROWSUM.map((r) => r.used);
  used.sort((a, b) => a - b);
  return framed(dataURI(W, H, rgb), 900, Math.round(900 * H / W), 'PLATE VIII',
    `${rows} rows, one per a-box, top to bottom. 61 teeth were available and the programme never used more than `
    + `${used[used.length - 1]}, usually ${used[Math.floor(used.length / 2)]} — so the plate is cropped to the first ${cols} `
    + `and the rest would be black by construction. brightness is the mean forcing weight, normalised per row.`);
}

const CSS = `
.plate { margin-top: var(--s-8); }
.plate.wide .container { max-width: 1320px; }
.plate figure { margin: 0; background: var(--bg-raised); border: 1px solid var(--border); border-radius: var(--radius-m); padding: var(--s-4); }
.plate figcaption { margin-top: var(--s-4); display: grid; grid-template-columns: minmax(0,1.15fr) minmax(0,0.85fr); gap: var(--s-5); }
@media (max-width: 900px) { .plate figcaption { grid-template-columns: 1fr; } }
.plate figcaption .what { font-size: var(--text-small); color: var(--ink-3); line-height: 1.65; }
.plate figcaption .rule { font-family: var(--font-mono); font-size: 0.7rem; line-height: 1.7; color: var(--ink-4); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-s); padding: var(--s-4); overflow-x: auto; }
.plate h3 { font-size: var(--text-2); margin-bottom: var(--s-3); }
.plate .idx { font-family: var(--font-mono); font-size: var(--text-eyebrow); letter-spacing: .16em; color: var(--ink-5); }`;

const plate = ({ idx, title, art, what, rule, wide }) => `
<section class="section plate${wide ? ' wide' : ''}">
  <div class="container">
    <div class="reveal"><div class="idx">${idx}</div><h3 class="t2" style="margin-top:var(--s-2);">${title}</h3></div>
    <figure class="reveal" style="margin-top:var(--s-5);">${art}</figure>
    <figcaption class="reveal">
      <div class="what">${what}</div>
      <pre class="rule">${rule}</pre>
    </figcaption>
  </div>
</section>`;

const body = `
<header class="hero">
  <div class="container">
    <div class="eyebrow reveal">plates &middot; geometry, stated rather than found</div>
    <h1 class="display reveal" style="margin-top:var(--s-5); max-width:17ch;">Manifolds we are handed</h1>
    <p class="lede reveal" style="margin-top:var(--s-6);">Interpretability research pulls geometry out of a working model and asks what it means &mdash; days of the week on a circle, a number stored across a product of circles, a story meandering along a manifold of emotions. This bench cannot do that: a model call would send prompts off this machine. So the direction is inverted. Their manifolds are found; these are stated, as a rule and its parameters, and then drawn.</p>
    <div class="hero-meta reveal">
      <span class="item"><span class="k">plates</span><span class="v">8</span></span>
      <span class="item"><span class="k">interaction</span><span class="v">none</span></span>
      <span class="item"><span class="k">drawn from</span><span class="v">rules and records on disk</span></span>
      <span class="item"><span class="k">palette</span><span class="v">ink on ground</span></span>
    </div>
  </div>
</header>

${plate({
  idx: 'PLATE I',
  title: 'A number as a point on a product of circles',
  art: plateResidue(),
  what: `Language models are reported to store a number not as a magnitude but as a set of residues, one angle per modulus &mdash; 17 sits at 1 on the mod-2 circle, 2 on mod-5, 7 on mod-10, 17 on mod-100 &mdash; and to add by rotating all of them at once. That is a residue number system, and it is a very old idea wearing new clothes. Here it is drawn from the definition rather than recovered from activations, which is the honest way for this bench to hold the object: we are not claiming to have found it, only to have understood what shape it is.`,
  rule: `n  ↦  ( n mod 2, n mod 5, n mod 10, n mod 100 )
angle on circle m  =  2π · (n mod m) / m
n = 0 … 99, one thread each
heavy thread: n = 17`,
})}

${plate({
  idx: 'PLATE II',
  title: 'The same object, handed over by an instrument',
  art: platePhaseTorus(),
  what: `And then the joke writes itself. The Event Horizon Telescope hands this bench ${IFM.vis.u.length} measurements of M87, and every one of them is a circle: the amplitude is measured, the phase is not calibrated. The data is literally a point on a ${IFM.vis.u.length}-dimensional torus whose radii we know and whose angles we do not. Nobody had to go looking for this geometry inside anything. It is the input. Every certified statement this bench makes about that black hole is a statement about what stays true no matter where you are on this torus &mdash; which is also why those statements can say how bright the source can be, and can never say where.`,
  rule: `each ring: one visibility V(u,v)
radius  ∝  √( |V| + 3σ + per-station gain allowance )
centre  =  (u, v) and its Hermitian mirror (−u, −v)
${IFM.vis.u.length} rings × 2, out to ${(Math.max(...IFM.vis.u.map((x, i) => Math.hypot(x, IFM.vis.v[i]))) / 1e9).toFixed(2)} Gλ`,
})}

${plate({
  idx: 'PLATE III',
  title: 'Where one peak becomes two',
  art: plateSplitting(),
  what: `A crowd distributing itself in a landscape with a single valley, drawn as viscosity falls. Near the top of the plate the density has one maximum, where the cost function has one minimum, and everything is as it should be. Downward, a second harmonic overtakes the first and the crowd splits into two peaks the landscape never asked for. The bright curves are the ones where the second harmonic has won. The bar on the left marks the part of this sweep that is certified &mdash; every viscosity in [${BAND.lo}, ${BAND.hi}], ${BAND.cells.length} closed cells &mdash; and <a href="../mfg/index.html">the crossing itself sits at 1/(8π²)</a>, exactly, with the congestion coupling cancelling out of it.`,
  rule: `m(x) − 1  =  2 Σ_k B_k cos(2πkx)
B_k        =  − c(κ_k) · A_k
c(κ)       =  κ / ( (1 + σκ)² + γκ )      κ_k = (2πk)²
γ = 1/100,  A₁ = 3/1000,  A₂ = 3/5000
σ = 0.0008 … 0.020, log-spaced, 52 rows
each row normalised to its own range — this is a
plate about SHAPE, and the modulation shrinks by
two orders across the sweep
bright ⟺ |B₁| < 4|B₂|, i.e. two maxima`,
})}

${plate({
  idx: 'PLATE IV',
  title: 'Thirty-nine contractions, and where each one closes',
  art: plateContraction(),
  what: `This is what a certificate looks like when you draw it. Each curve is one cell of the same band: a parabola in the radius, opening upward, whose value must be driven below zero for anything to be proved. Where a curve dips under the dashed line there is an interval in which a solution exists and is unique; where it does not, the method abstains and says so. The marked point on each curve is the radius at which the negativity was verified in interval arithmetic rather than in floating point &mdash; not the root itself, which proves nothing, but a radius strictly past it.`,
  rule: `p(r)  =  ½ Z₂ r²  −  (1 − Z₁) r  +  Y₀
Y₀ defect · Z₁ contraction · Z₂ curvature
${BAND.cells.filter(c => c.ok).length} certified cells, read from the record
dot: the r where p(r) < 0 was verified outward-rounded`,
})}

${plate({
  idx: 'PLATE V',
  title: 'Every sky the data still allow',
  art: plateEnclosure(),
  what: `The last plate is the only one that is a picture of an unknown rather than of a rule. The upper curve is a bound on every brightness distribution consistent with the measurements in Plate II; the lower one is a distribution that exists and was exhibited. The band between them is not error and not uncertainty in the statistical sense &mdash; it is the set of answers that survive, and the width of it is a fact about the telescope rather than about the analyst. <a href="../interferometer/index.html">The instrument that produced it</a> narrowed this band from a factor of seventy-three to under two.`,
  rule: `upper:  sup ∫f dμ over every nonnegative μ
        with |V_μ(u_k)| ≤ A_k and μ(Ω) ≤ F
lower:  one such μ, exhibited and checked
f = indicator of a disk of radius r
${SWEEP.rows.map(r => `r ≤ ${String(r.r0).padStart(2)} µas   [${r.witness.toFixed(4)}, ${r.ceiling.toFixed(4)}] Jy   ${r.ratio.toFixed(2)}×`).join('\n')}`,
})}

${plate({
  idx: 'PLATE VI',
  title: 'What the array sees when it looks at a point',
  wide: true,
  art: plateBeam(),
  what: `Before any sky, the instrument has a shape of its own. Put a single point in front of this array and what comes back is not a point but this &mdash; a central spike wrapped in rings and spokes, one spoke for every direction the ${IFM.vis.u.length} sampled frequencies happen to line up in. Every image ever made from these data is the true sky convolved with this figure, and every argument about what is really there is an argument about how much of this pattern to believe. It is drawn from the frequencies alone: no sky, no model, no fit.`,
  rule: `PSF(x)  =  Σ_k cos( 2π u_k · x )
u_k: the ${IFM.vis.u.length} measured baselines, unweighted
±170 µas, 620 × 620, asinh-scaled
bright: positive.  dim: the negative sidelobes,
which is where reconstructions go to argue.`,
})}

${plate({
  idx: 'PLATE VII',
  title: 'A proof, tiled',
  wide: true,
  art: plateProof(),
  what: `This is one certificate, drawn at its own resolution. Proving a lower bound on an Erdős problem meant covering a rectangle with boxes and forcing an inequality inside each one; the covering is not uniform, because the difficulty is not uniform. Brightness is how little room each box had, so the bright seams are where the argument nearly ran out and the dim expanse is where it was never in doubt. The tightest box in the picture cleared its inequality by ${FORCE.summary.worstCertifiedMargin.toExponential(2)}, and that single number is what the whole result rests on. The covering is a triangle because the range of b that has to be checked shrinks as a moves, and the terraces are the subdivision deciding, region by region, how hard it needs to work. A proof has a shape, and this is what that one looks like.`,
  rule: `covering of a ∈ [−${FORCE.summary.cap}, −√2] × b ∈ [0, 0.414]
${FORCE.summary.aBoxes} a-boxes · ${FORCE.summary.bBoxes.toLocaleString('en')} b-boxes · ${FORCE.summary.lpCalls.toLocaleString('en')} linear programmes
shade = log of the certified margin, INVERTED —
        bright is tight, black is uncovered
worst margin ${FORCE.summary.worstCertifiedMargin.toExponential(3)} · ${(FORCE.summary.secs / 60).toFixed(0)} minutes`,
})}

${plate({
  idx: 'PLATE VIII',
  title: 'The weights a proof chose',
  wide: true,
  art: plateWeights(),
  what: `And this is what is inside those boxes. Forcing the inequality means picking nonnegative weights on a comb of translated potentials, and a linear programme picks them &mdash; one vector per box, most entries zero. Averaged over each row of the covering and stacked, the choices stop looking like arithmetic and start looking like a material: bands where the same few teeth carry everything, a front where the programme changes its mind and reaches for others. Nothing here was designed. It is what optimisation under a constraint happens to look like when you stack ${FORCE.summary.bBoxes.toLocaleString('en')} of its answers.`,
  rule: `w  =  argmax over nonnegative weights of the
       forced minimum, one LP per b-box
rows: ${FORCE.boxes.length} a-boxes, in order
cols: up to 61 teeth
brightness = mean weight, normalised per row`,
})}

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">On the difference</h2>
      <p>The geometry found inside a model is evidence: it was not designed, it emerged from the data, and the interesting question is what it means. The geometry drawn here is the opposite kind of object &mdash; it is a definition, and the interesting question is what can be proven about it. Plate I is the hinge between them, the same shape read both ways.</p>
      <p>What the two directions share is that in both cases the geometry is <em>what survives</em>. For a trained model it is the structure that survived the training data. For an instrument it is the structure that survives every hypothesis you cannot pin down &mdash; which, on Plate II, is every angle on a ${IFM.vis.u.length}-dimensional torus at once.</p>
    </div>
  </div>
</section>`;

/* PATCH (declared): the bench wrote its own page here. This exports the body
   and the plate CSS instead, and build.js renders them in our shell. */
module.exports = {
  body, CSS,
  counts: {
    plates: 8,
    visibilities: IFM.vis.u.length,
    cells: BAND.cells.filter((c) => c.ok).length,
    aBoxes: FORCE.summary.aBoxes,
    bBoxes: FORCE.summary.bBoxes,
    worstMargin: FORCE.summary.worstCertifiedMargin,
    lpCalls: FORCE.summary.lpCalls,
  },
};
