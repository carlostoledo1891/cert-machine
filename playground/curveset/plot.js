/* plot.js — the figures, drawn once for both halves of the page.

   This file is required by build.js at build time AND inlined verbatim into the
   page, so the SVG the server ships and the SVG the slider redraws come out of
   the same function. Two copies of "where does the envelope go" would drift
   within a week, and the drift would be invisible: both would look like plots.

   Every stroke here takes its dash pattern from ../warrant.js. No dasharray is
   written by hand in this file, which is the point of having a grammar.
*/
'use strict';
const W = require('../warrant.js');
const { ARITHMETIC } = require('./envelope.js');

/* WHAT THE ENVELOPE IS STANDING ON, derived rather than typed. The formula is
   closed form; the evaluation is float, and warrant.js's first composition rule
   says a float step takes DECIDED to COMPUTED automatically. It applies to this
   file too. Flip envelope.js's ARITHMETIC to 'exact' once the piecewise-linear
   solve replaces the bisection and every mark below re-promotes on its own —
   including the legend, which is rendered from the same lattice. */
const BAND = ARITHMETIC === 'exact' ? W.DECIDED : W.throughFloat(W.DECIDED);

const PAD = { l: 74, r: 26, t: 20, b: 54 };
const fmt = (v, d = 4) => (Math.abs(v) >= 1e4 ? Math.round(v).toLocaleString('en-US') : Number(v).toPrecision(d));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---- scales -------------------------------------------------------------- */
function scales(set, w, h) {
  const LOG = set.xScale === 'log';
  const fx = (x) => (LOG ? Math.log10(x) : x);
  const px = set.x.filter((x) => !LOG || x > 0);
  const x0 = fx(Math.min(...px)), x1 = fx(Math.max(...px));
  const padx = 0.06 * (x1 - x0);
  const ax = x0 - padx, bx = x1 + padx;
  const ys = set.y.filter((_, i) => !LOG || set.x[i] > 0);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pady = 0.10 * (y1 - y0);
  const ay = y0 - pady, by = y1 + pady;
  return {
    LOG, ax, bx, ay, by,
    X: (x) => PAD.l + ((fx(x) - ax) / (bx - ax)) * (w - PAD.l - PAD.r),
    Xu: (u) => PAD.l + ((u - ax) / (bx - ax)) * (w - PAD.l - PAD.r),
    Y: (y) => h - PAD.b - ((y - ay) / (by - ay)) * (h - PAD.t - PAD.b),
    clampY: (y) => Math.min(Math.max(y, ay), by),
  };
}
function ticksX(S, set) {
  const out = [];
  if (S.LOG) {
    for (let e = Math.ceil(S.ax); e <= Math.floor(S.bx); e++) out.push({ u: e, label: e >= 0 ? String(10 ** e) : (10 ** e).toFixed(-e) });
    if (out.length < 3) for (const x of set.x.filter((v) => v > 0)) out.push({ u: Math.log10(x), label: String(x) });
  } else {
    const n = 5, step = (S.bx - S.ax) / n;
    for (let i = 0; i <= n; i++) { const u = S.ax + i * step; const v = u / 1e6; out.push({ u, label: (Math.abs(v) < 0.05 ? 0 : v).toFixed(1) + 'M' }); }
  }
  return out;
}
function ticksY(S) {
  const out = [], n = 4, step = (S.by - S.ay) / n;
  for (let i = 0; i <= n; i++) { const v = S.ay + i * step; out.push({ v, label: Number(v).toPrecision(3) }); }
  return out;
}

/* ---- the envelope for one rung, sampled ---------------------------------- */
/* E is envelope.js. The rung is either bare monotonicity or a local wander
   claim; both come out of the same file the tests run against. */
function envelopeBand(E, set, rung, S, N = 260) {
  const LOG = S.LOG;
  const keep = set.x.map((x, i) => i).filter((i) => !LOG || set.x[i] > 0);
  const C = E.prepare(keep.map((i) => (LOG ? Math.log10(set.x[i]) : set.x[i])), keep.map((i) => set.y[i]), keep.map((i) => set.errs[i]), set.sense);
  const u = [], l = [];
  for (let k = 0; k < N; k++) {
    const ux = S.ax + ((S.bx - S.ax) * k) / (N - 1);
    let hi, lo;
    if (rung.kind === 'monotone') { hi = E.upper(C, ux, 0, Infinity); lo = E.lower(C, ux, 0, Infinity); }
    else { const b = E.localBounds(C, ux, rung.tol); hi = b.u; lo = b.l; }
    u.push({ ux, v: set.sense * hi });
    l.push({ ux, v: set.sense * lo });
  }
  return { u, l, C };
}

/* ---- the main figure ----------------------------------------------------- */
function calibrationPlot(E, set, ri, { w = 900, h = 460 } = {}) {
  const rung = set.rungs[ri];
  const S = scales(set, w, h);
  const band = envelopeBand(E, set, rung, S);
  const LOG = S.LOG;

  /* THE ENVELOPE IS DECIDED: it is what the standards and the stated assumption
     force, computed in closed form. Its edges are solid and its interior is the
     set — every curve in there is admissible and none outside it is. */
  const clip = (v) => S.Y(S.clampY(v));
  const pathU = band.u.map((p, i) => (i ? 'L' : 'M') + S.Xu(p.ux).toFixed(1) + ',' + clip(p.v).toFixed(1)).join('');
  const pathL = band.l.map((p, i) => (i ? 'L' : 'M') + S.Xu(p.ux).toFixed(1) + ',' + clip(p.v).toFixed(1)).join('');
  const fill = `<path d="${pathU + band.l.slice().reverse().map((p) => 'L' + S.Xu(p.ux).toFixed(1) + ',' + clip(p.v).toFixed(1)).join('') + 'Z'}" class="cs-fill"/>`;

  /* THE PUBLISHED CURVE IS CHOSEN: an argmin of a fitting criterion over a family
     nobody derived from the data. Rule 3. It is dotted, and it is drawn on top so
     it is impossible to miss that it lies inside a set. */
  const F = set.reported.form;
  const evalF = (x) => (F.form === 'poly' ? F.c.reduce((t, c, k) => t + c * Math.pow(x, k), 0)
    : F.p[1] + (F.p[0] - F.p[1]) / (1 + Math.pow(x / F.p[2], F.p[3])));
  const fitPts = [];
  for (let k = 0; k < 200; k++) {
    const ux = S.ax + ((S.bx - S.ax) * k) / 199;
    const x = LOG ? Math.pow(10, ux) : ux;
    if (x <= 0) continue;
    fitPts.push([S.Xu(ux), S.Y(S.clampY(evalF(x)))]);
  }
  const fitPath = `<path d="${fitPts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('')}" ${W.attrs(W.CHOSEN, { width: 2.6 })}/>`;

  /* the standards: measured, with the error budget the page states */
  const pts = set.x.map((x, i) => {
    if (LOG && x <= 0) return '';
    const cx = S.X(x), cy = S.Y(set.y[i]), e = set.errs[i];
    const yTop = S.Y(set.y[i] + e), yBot = S.Y(set.y[i] - e);
    return `<line x1="${cx.toFixed(1)}" y1="${yTop.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yBot.toFixed(1)}" class="cs-err"/>`
      + `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.4" class="cs-std"/>`;
  }).join('');

  /* the reading, and the interval it maps to */
  const yAsk = S.Y(set.ask);
  const r = rung.r;
  const askLine = `<line x1="${PAD.l}" y1="${yAsk.toFixed(1)}" x2="${(w - PAD.r).toFixed(1)}" y2="${yAsk.toFixed(1)}" class="cs-ask"/>`
    + `<text x="${PAD.l + 6}" y="${(yAsk - 7).toFixed(1)}" class="cs-asklab">${esc(set.askLabel)} ${set.ask}</text>`;

  let readMark = '';
  if (r && r.bounded) {
    const a = S.X(r.lo), b = S.X(r.hi), yb = h - PAD.b;
    readMark = `<line x1="${a.toFixed(1)}" y1="${yb}" x2="${b.toFixed(1)}" y2="${yb}" ${W.extentAttrs(BAND, { width: 5 })} stroke-linecap="butt"/>`
      + `<line x1="${a.toFixed(1)}" y1="${(yb - 7).toFixed(1)}" x2="${a.toFixed(1)}" y2="${(yb + 7).toFixed(1)}" ${W.extentAttrs(BAND, { width: 2 })}/>`
      + `<line x1="${b.toFixed(1)}" y1="${(yb - 7).toFixed(1)}" x2="${b.toFixed(1)}" y2="${(yb + 7).toFixed(1)}" ${W.extentAttrs(BAND, { width: 2 })}/>`
      + `<line x1="${a.toFixed(1)}" y1="${yAsk.toFixed(1)}" x2="${a.toFixed(1)}" y2="${yb}" class="cs-drop"/>`
      + `<line x1="${b.toFixed(1)}" y1="${yAsk.toFixed(1)}" x2="${b.toFixed(1)}" y2="${yb}" class="cs-drop"/>`;
  } else {
    /* REFUSED: the reading is over range and no admissible curve bounds it.
       There is no mark and the void is drawn — a hatched field to the right,
       which is what "over range" actually means. */
    const a = r ? S.X(r.lo) : PAD.l, b = w - PAD.r, yb = h - PAD.b;
    readMark = `<rect x="${a.toFixed(1)}" y="${(yb - 9).toFixed(1)}" width="${Math.max(0, b - a).toFixed(1)}" height="18" class="w-void"/>`
      + `<text x="${(a + 8).toFixed(1)}" y="${(yb + 4).toFixed(1)}" class="cs-void-lab">unbounded above — over range</text>`;
  }

  /* the reported +/- , which is a CHOSEN width because it is the fit's width */
  let repMark = '';
  {
    const c = S.X(set.reported.xHat), u = set.reported.uFit;
    const a = S.X(Math.max(set.reported.xHat - u, LOG ? 1e-9 : -Infinity)), b2 = S.X(set.reported.xHat + u);
    const yb = h - PAD.b + 20;
    const tiny = (b2 - a) < 6;
    repMark = `<line x1="${a.toFixed(1)}" y1="${yb}" x2="${b2.toFixed(1)}" y2="${yb}" ${W.attrs(W.CHOSEN, { width: 4 })}/>`
      + `<circle cx="${c.toFixed(1)}" cy="${yb}" r="2.6" class="cs-fitdot"/>`
      + `<text x="${(c + 10).toFixed(1)}" y="${(yb + 3.5).toFixed(1)}" class="cs-void-lab">reported \u00b1${fmt(u, 3)}${set.xUnit ? ' ' + set.xUnit : ''}${tiny ? ' \u2014 narrower than the dot drawing it' : ''}</text>`;
  }

  const gx = ticksX(S, set).map((t) => `<line x1="${S.Xu(t.u).toFixed(1)}" y1="${PAD.t}" x2="${S.Xu(t.u).toFixed(1)}" y2="${h - PAD.b}" class="cs-grid"/>`
    + `<text x="${S.Xu(t.u).toFixed(1)}" y="${h - PAD.b + 38}" class="cs-tick tx">${esc(t.label)}</text>`).join('');
  const gy = ticksY(S).map((t) => `<line x1="${PAD.l}" y1="${S.Y(t.v).toFixed(1)}" x2="${(w - PAD.r).toFixed(1)}" y2="${S.Y(t.v).toFixed(1)}" class="cs-grid"/>`
    + `<text x="${PAD.l - 10}" y="${(S.Y(t.v) + 3.5).toFixed(1)}" class="cs-tick ty">${esc(t.label)}</text>`).join('');

  return `<svg viewBox="0 0 ${w} ${h}" class="cs-plot" role="img" aria-label="${esc(set.title)}: the envelope of calibration curves the standards allow, with the published fit drawn inside it.">
<g class="cs-grids">${gx}${gy}</g>
${fill}
<path d="${pathU}" ${W.attrs(BAND, { width: 2 })}/>
<path d="${pathL}" ${W.attrs(BAND, { width: 2 })}/>
${fitPath}${askLine}${pts}${readMark}${repMark}
<text x="${(w - PAD.r).toFixed(1)}" y="${h - 6}" class="cs-axname tx">${esc(set.xName)}${set.xUnit ? ' (' + esc(set.xUnit) + ')' : ''}${S.LOG ? ', log scale' : ''}</text>
<text x="${PAD.l - 10}" y="${PAD.t - 6}" class="cs-axname ty">${esc(set.yName)}${set.yUnit ? ' (' + esc(set.yUnit) + ')' : ''}</text>
</svg>`;
}

/* ---- the price of every assumption, on one scale ------------------------- */
function ladderPlot(set, ri, { w = 900, h = 250 } = {}) {
  const P = { l: 152, r: 96, t: 16, b: 34 };
  const rows = set.rungs;
  const ratios = rows.map((g) => (g.r && g.r.bounded ? g.r.width / (2 * set.reported.uFit) : null)).filter((v) => v !== null);
  const hi = Math.max(...ratios, 2);
  const X = (v) => P.l + (Math.log10(Math.max(v, 0.6)) / Math.log10(hi * 1.25)) * (w - P.l - P.r);
  const rowH = (h - P.t - P.b) / rows.length;

  const bars = rows.map((g, i) => {
    const y = P.t + rowH * (i + 0.5);
    const label = g.kind === 'monotone' ? 'monotone only' : g.kind === 'interpolate' ? 'join the dots' : `wander ≤ ±${(100 * g.tol).toFixed(0)}%`;
    const lab = `<text x="${P.l - 12}" y="${(y + 3.5).toFixed(1)}" class="cs-tick ty${i === ri ? ' on' : ''}">${label}</text>`;
    if (!g.r || !g.r.bounded) {
      return lab + `<rect x="${P.l}" y="${(y - 6).toFixed(1)}" width="${(w - P.l - P.r).toFixed(1)}" height="12" class="w-void"/>`
        + `<text x="${(P.l + 10).toFixed(1)}" y="${(y + 3.5).toFixed(1)}" class="cs-void-lab">unbounded</text>`;
    }
    const v = g.r.width / (2 * set.reported.uFit);
    return lab
      /* the bar starts AT the axis. X(0.6) puts it 65px to the LEFT of it, which
         ran every bar through its own row label — every ratio here is >= 1, so
         there was never anything out there to show. */
      + `<line x1="${P.l}" y1="${y.toFixed(1)}" x2="${X(v).toFixed(1)}" y2="${y.toFixed(1)}" ${W.extentAttrs(BAND, { width: i === ri ? 7 : 4 })} stroke-linecap="butt"${i === ri ? '' : ' opacity="0.5"'}/>`
      + `<text x="${(X(v) + 10).toFixed(1)}" y="${(y + 3.5).toFixed(1)}" class="cs-val${i === ri ? ' on' : ''}">${v >= 10 ? v.toFixed(0) : v.toFixed(1)}×</text>`;
  }).join('');

  const marks = [1, 2, 5, 10, 25, 50, 100].filter((v) => v <= hi * 1.25).map((v) =>
    `<line x1="${X(v).toFixed(1)}" y1="${P.t}" x2="${X(v).toFixed(1)}" y2="${(h - P.b).toFixed(1)}" class="cs-grid"/>`
    + `<text x="${X(v).toFixed(1)}" y="${(h - P.b + 20).toFixed(1)}" class="cs-tick tx">${v}×</text>`).join('');

  return `<svg viewBox="0 0 ${w} ${h}" class="cs-plot" role="img" aria-label="How wide the answer is under each assumption, as a multiple of the reported uncertainty.">
<g class="cs-grids">${marks}</g>
<line x1="${X(1).toFixed(1)}" y1="${P.t}" x2="${X(1).toFixed(1)}" y2="${(h - P.b).toFixed(1)}" ${W.attrs(W.CHOSEN, { width: 2 })}/>
${bars}
<text x="${(w - P.r + 8).toFixed(1)}" y="${(h - P.b + 20).toFixed(1)}" class="cs-axname tx">vs the reported ±</text></svg>`;
}

module.exports = { calibrationPlot, ladderPlot, scales, envelopeBand, PAD, fmt };
