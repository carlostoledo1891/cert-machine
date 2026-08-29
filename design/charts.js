/* charts.js — the chart kit.
   design/ · cert-machine

   components.js owns the page's blocks; this file owns everything that plots a
   NUMBER. It is separate for one reason: a chart has rules that prose does not,
   and they are easier to keep in one place than to remember at every call site.

   THE RULES, applied by construction here so no builder has to re-derive them:

     · Colour is assigned by the JOB it does, never picked. Magnitude gets the
       one-hue sequential ramp; identity gets at most THREE hues (a fourth would
       have to be generated, and a generated hue is indistinguishable from an
       existing one under colour-vision deficiency); polarity gets two poles and
       a neutral middle; state gets the reserved verdict trio. The steps live in
       tokens.js and were snapped until the categorical checks passed — see the
       comment there for the measured numbers.
     · The trio's worst pair lands in the 6–8 CVD floor band, which is legal
       ONLY with secondary encoding. So a chart here with two or more series
       ALWAYS carries a labelled legend, and `legend()` refuses to render a
       swatch without a word beside it. Colour is never the only channel — the
       same rule the app doctrine states as "severity is never colour alone".
     · Text never wears the data colour. Values, axis ticks and legends use ink
       tokens; identity comes from the coloured mark BESIDE the text. A light
       plum is unreadable as 11px type on the figure surface.
     · Marks are thin and the grid is recessive: 2px lines, ≥8px end markers
       with a 2px surface ring so they stay legible where they cross, bars ≤24px
       with a 4px rounded data-end and a 2px surface gap between neighbours,
       hairline SOLID gridlines (a dashed grid reads as "threshold" when it is
       just a grid — dashes are reserved here for predicted/uncertified marks,
       which is a real distinction this machine has to draw).
     · Labels are selective. A number on every point is chaos and goes unread:
       label the endpoint, the extreme, or the one series the story is about,
       and let the axis, the legend and the hover readout carry the rest.
     · Never two y-scales on one plot. Two measures of different size become two
       charts, small multiples, or an indexed pair on one axis.

   HOVER. An SVG chart in a browser is interactive whether or not you plan for
   it, so every chart here ships a readout: nearest-point on the line forms,
   per-mark on the rest, keyboard-reachable, and never the only way to read a
   value. `script()` emits ONE listener for the whole page, delegated — the
   second scripted element this design system ships, after the machine
   schematic's readout.

   Every colour is a var(--token) from tokens.FIGURE_TOKENS. A literal hex in a
   figure is invisible in one of the two themes; design/battery.js fails the
   build on one. */
'use strict';

const T = require('./tokens.js');
const CO = require('./components.js');
const esc = CO.esc, escAttr = CO.escAttr;
const { CAT, SEQ, CTX, GRID, AXIS, SURFACE } = T.CHART;

/* ------------------------------------------------------------- numbers --- */
const nf = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
/* big values get compacted (12.6K, 4.2M); this is for axis ticks and labels,
   never for a value the reader is meant to check against a certificate */
function compact(v) {
  const a = Math.abs(v);
  if (a >= 1e9) return (v / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
  if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (a >= 1e4) return (v / 1e3).toFixed(0) + 'K';
  if (a >= 1) return nf(v, a >= 100 ? 0 : a >= 10 ? 1 : 2).replace(/\.0+$/, '');
  if (a === 0) return '0';
  if (a >= 0.001) return String(Number(v.toPrecision(2)));
  return v.toExponential(1).replace('e', 'e');
}
/* Ticks for a log axis. Whole decades where the range spans several; 1-2-5
   subdivisions where it does not, because an axis carrying a single tick is an
   axis that has stopped carrying the values you chose not to label. */
function decades(lo, hi, max) {
  const a = Math.ceil(Math.log10(lo)), b = Math.floor(Math.log10(hi));
  const whole = [];
  for (let e = a; e <= b; e++) whole.push(e);
  if (whole.length >= 3) {
    const step = Math.max(1, Math.ceil(whole.length / (max || 6)));
    return whole.filter((_, i) => i % step === 0).map(e => ({ v: Math.pow(10, e), t: '1e' + e }));
  }
  const out = [];
  for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
    for (const m of [1, 2, 5]) {
      const v = m * Math.pow(10, e);
      if (v >= lo && v <= hi) out.push({ v, t: (m === 1 ? '1e' + e : String(m) + 'e' + e) });
    }
  }
  return out;
}

/* ------------------------------------------------------------ geometry --- */
/* One plot frame, one set of scales. `logY` is honest about zero: a value at or
   below zero cannot be placed on a log axis, so it is REFUSED here rather than
   silently clamped to the floor — a clamped zero is a lie the reader cannot
   see. */
function frame(o) {
  const w = o.w || 900, h = o.h || 320;
  const L = o.padL === undefined ? 62 : o.padL, R = o.padR === undefined ? 22 : o.padR;
  const TOPP = o.padT === undefined ? 18 : o.padT, BOT = o.padB === undefined ? 46 : o.padB;
  const pw = w - L - R, ph = h - TOPP - BOT;
  const logY = !!o.logY;
  if (logY && !(o.y0 > 0)) throw new Error('charts: a log y-axis needs a strictly positive floor');
  const ys = v => (logY ? Math.log10(v) : v);
  const y0 = ys(o.y0), y1 = ys(o.y1);
  return {
    w, h, L, R, T: TOPP, B: BOT, pw, ph, logY,
    px: v => L + (v - o.x0) / (o.x1 - o.x0) * pw,
    py: v => {
      if (logY && !(v > 0)) throw new Error('charts: value ' + v + ' cannot sit on a log axis');
      return TOPP + ph - (ys(v) - y0) / (y1 - y0) * ph;
    },
    x0: o.x0, x1: o.x1, yv0: o.y0, yv1: o.y1
  };
}

const open = ({ w, h, alt, cls }) =>
  '  <svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + escAttr(alt) + '"'
  + (cls ? ' class="' + cls + '"' : '') + '>';
const close = '  </svg>';
const txt = (x, y, s, cls, anchor, extra) =>
  '    <text x="' + (+x).toFixed(1) + '" y="' + (+y).toFixed(1) + '"'
  + (anchor ? ' text-anchor="' + anchor + '"' : '') + ' class="' + (cls || 't-ax') + '"'
  + (extra || '') + '>' + esc(s) + '</text>';

/* the axes: hairline, SOLID, one step off the surface, drawn under the data */
function axes(f, o) {
  const out = [];
  const yt = o.yTicks || [];
  for (const t of yt) {
    const y = f.py(t.v !== undefined ? t.v : t);
    const lab = t.t !== undefined ? t.t : compact(t.v !== undefined ? t.v : t);
    out.push('    <line x1="' + f.L + '" y1="' + y.toFixed(1) + '" x2="' + (f.L + f.pw)
      + '" y2="' + y.toFixed(1) + '" stroke="' + GRID + '" stroke-width="1"/>');
    out.push(txt(f.L - 9, y + 4, lab, 't-ax', 'end'));
  }
  for (const t of (o.xTicks || [])) {
    const x = f.px(t.v !== undefined ? t.v : t);
    const lab = t.t !== undefined ? t.t : compact(t.v !== undefined ? t.v : t);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + (f.T + f.ph) + '" x2="' + x.toFixed(1)
      + '" y2="' + (f.T + f.ph + 5) + '" stroke="' + AXIS + '" stroke-width="1"/>');
    out.push(txt(x, f.T + f.ph + 20, lab, 't-ax', 'middle'));
  }
  out.push('    <line x1="' + f.L + '" y1="' + (f.T + f.ph) + '" x2="' + (f.L + f.pw)
    + '" y2="' + (f.T + f.ph) + '" stroke="' + AXIS + '" stroke-width="1"/>');
  /* The axis caption sits directly under the tick row; the legend gets its own
     line at the very bottom. Sharing one baseline is how they collide. */
  if (o.xLabel) out.push(txt(f.L + f.pw / 2, f.T + f.ph + 42, o.xLabel, 't-note', 'middle'));
  if (o.yLabel) out.push('    <text x="13" y="' + (f.T + f.ph / 2) + '" class="t-note" '
    + 'transform="rotate(-90 13 ' + (f.T + f.ph / 2) + ')" text-anchor="middle">' + esc(o.yLabel) + '</text>');
  return out.join('\n');
}

/* ---------------------------------------------------------- the legend ---
   A legend is present for every chart with two or more series, and a swatch
   without a word is refused: colour alone is not an identity channel here. */
/* Advance is MEASURED from the label, not assumed: a fixed gap collides the
   moment one series is called something longer than the others, and a collided
   legend is worse than no legend. 11.5px IBM Plex Mono advances 6.9px/char. */
const legendWidth = it => 19 + Math.ceil(String(it.t).length * 6.9) + 26;
/* How many lines a legend will take in the width available. Forms call this
   BEFORE sizing themselves, because a legend that silently runs off the right
   edge drops a key — and a dropped key is exactly the failure the legend
   exists to prevent. */
function legendLines(items, avail, gap) {
  if (!items || !items.length) return 0;
  let lines = 1, cx = 0;
  for (const it of items) {
    const w = it.w || gap || legendWidth(it);
    if (cx > 0 && cx + w > avail) { lines++; cx = 0; }
    cx += w;
  }
  return lines;
}
const LEGEND_LINE = 19;
function legend(items, x, y, gap, avail) {
  const out = [];
  let cx = x, cy = y;
  const lines = avail ? legendLines(items, avail, gap) : 1;
  cy = y - (lines - 1) * LEGEND_LINE;              /* grow upward from the baseline */
  for (const it of items) {
    if (!it.t) throw new Error('charts.legend: a swatch needs a label — colour alone is not allowed');
    const w = it.w || gap || legendWidth(it);
    if (avail && cx > x && cx + w > x + avail) { cx = x; cy += LEGEND_LINE; }
    const y2 = cy;
    if (it.kind === 'dash') {
      out.push('    <line x1="' + cx + '" y1="' + (y2 - 4) + '" x2="' + (cx + 14) + '" y2="' + (y2 - 4)
        + '" stroke="' + it.token + '" stroke-width="2" stroke-dasharray="4 3"/>');
    } else if (it.kind === 'line') {
      out.push('    <line x1="' + cx + '" y1="' + (y2 - 4) + '" x2="' + (cx + 14) + '" y2="' + (y2 - 4)
        + '" stroke="' + it.token + '" stroke-width="2" stroke-linecap="round"/>');
    } else if (it.kind === 'hatch') {
      out.push('    <rect x="' + cx + '" y="' + (y2 - 10) + '" width="14" height="10" fill="url(#cmHatch)"/>');
    } else {
      out.push('    <rect x="' + cx + '" y="' + (y2 - 10) + '" width="11" height="10" rx="2" fill="' + it.token + '"/>');
    }
    out.push(txt(cx + 19, y2, it.t, 't-note', 'start'));
    cx += w;
  }
  return out.join('\n');
}

/* the 45°/135° hatch, for the accessibility/print backup channel and for the
   one semantic place this machine needs it: "nothing was enclosed here" */
const HATCH_DEF = '    <defs><pattern id="cmHatch" width="6" height="6" patternUnits="userSpaceOnUse">'
  + '<rect width="6" height="6" fill="' + SURFACE + '"/>'
  + '<path d="M0,6 l6,-6 M-1.5,1.5 l3,-3 M4.5,7.5 l3,-3" stroke="' + CTX + '" stroke-width="0.7" fill="none"/>'
  + '</pattern></defs>';

/* ------------------------------------------------------------- the hover --
   Marks carry data-cm (the row label) and data-cmv (the value line). One
   delegated listener per page shows them; nothing here is the only route to a
   number — every chart is built beside prose, a table, or a direct label that
   already carries the value. */
const hit = (attrs, label, value) =>
  attrs + ' data-cm="' + escAttr(label) + '" data-cmv="' + escAttr(value) + '" tabindex="0"';

function script() {
  return '<script>' + `
(function(){
  var tip=null;
  function show(el){
    var box=el.closest('.figbox'); if(!box) return;
    if(!tip){ tip=document.createElement('div'); tip.className='cm-tip'; document.body.appendChild(tip); }
    tip.innerHTML='<b>'+el.getAttribute('data-cm')+'</b>'+(el.getAttribute('data-cmv')?'<span>'+el.getAttribute('data-cmv')+'</span>':'');
    tip.style.display='block';
    var r=el.getBoundingClientRect(), t=tip.getBoundingClientRect();
    var x=r.left+r.width/2-t.width/2, y=r.top-t.height-10;
    if(y<4) y=r.bottom+10;
    tip.style.left=Math.max(6,Math.min(x,innerWidth-t.width-6))+'px';
    tip.style.top=(y+scrollY)+'px';
    var c=el.ownerSVGElement&&el.ownerSVGElement.querySelector('.cm-cross');
    if(c&&el.hasAttribute('data-cmx')){ c.setAttribute('x1',el.getAttribute('data-cmx')); c.setAttribute('x2',el.getAttribute('data-cmx')); c.style.opacity=1; }
  }
  function hide(el){
    if(tip) tip.style.display='none';
    var c=el&&el.ownerSVGElement&&el.ownerSVGElement.querySelector('.cm-cross');
    if(c) c.style.opacity=0;
  }
  document.addEventListener('pointerover',function(e){ var el=e.target.closest('[data-cm]'); if(el) show(el); });
  document.addEventListener('pointerout',function(e){ var el=e.target.closest('[data-cm]'); if(el) hide(el); });
  document.addEventListener('focusin',function(e){ var el=e.target.closest&&e.target.closest('[data-cm]'); if(el) show(el); });
  document.addEventListener('focusout',function(e){ var el=e.target.closest&&e.target.closest('[data-cm]'); if(el) hide(el); });
  addEventListener('scroll',function(){ if(tip) tip.style.display='none'; },{passive:true});
})();` + '</script>';
}

/* ============================================================== the forms = */

/* LINES — trend over time / over an index. One series is a single hue and needs
   no legend box (the title names it); two or three get the trio and a legend.
   `series[i].dashed` marks a PREDICTED or uncertified line: predicted and
   decided never share a typography here, which is the whole audit posture.  */
function lines(o) {
  const S = o.series;
  const preKeys = o.keys || (S.length > 1 ? S.map(x => ({ t: x.name })) : null);
  const avail0 = (o.w || 900) - (o.padL === undefined ? 62 : o.padL) - (o.padR === undefined ? 22 : o.padR);
  const nLeg = legendLines(preKeys, avail0, o.legendGap);
  const f = frame(Object.assign({}, o, { padB: o.padB || (28 + (o.xLabel ? 22 : 0) + (nLeg ? 5 + nLeg * LEGEND_LINE : 0)) }));
  /* Only series drawing an IDENTITY hue count against the cap. A series painted
     in the context grey is the "emphasis" form — one line is the point and the
     rest are background — and background is not identity, so it is exempt. */
  const idn = S.filter(s => !s.token).length;
  if (idn > CAT.length) throw new Error('charts.lines: more than ' + CAT.length + ' identity series — use emphasis, fold the tail, or facet');
  const out = [open({ w: f.w, h: f.h, alt: o.alt })];
  out.push(HATCH_DEF);
  out.push(axes(f, o));
  for (const b of (o.bands || [])) {
    out.push('    <rect x="' + f.px(b.x0).toFixed(1) + '" y="' + f.T + '" width="'
      + (f.px(b.x1) - f.px(b.x0)).toFixed(1) + '" height="' + f.ph + '" fill="' + (b.token || GRID) + '"/>');
    /* centre the caption inside the band when it FITS; otherwise set it just
       outside the right edge. A centred label on a narrow band runs out over
       the y-axis and collides with a tick — measure, don't hope. */
    if (b.t) {
      const bx0 = f.px(b.x0), bx1 = f.px(b.x1), need = String(b.t).length * 6.9;
      if (bx1 - bx0 >= need + 12) out.push(txt((bx0 + bx1) / 2, f.T + 13, b.t, 't-note', 'middle'));
      else out.push(txt(bx1 + 7, f.T + 13, b.t, 't-note', 'start'));
    }
  }
  for (const r of (o.rules || [])) {
    const y = f.py(r.v);
    out.push('    <line x1="' + f.L + '" y1="' + y.toFixed(1) + '" x2="' + (f.L + f.pw) + '" y2="' + y.toFixed(1)
      + '" stroke="' + (r.token || CTX) + '" stroke-width="1"' + (r.dashed ? ' stroke-dasharray="4 3"' : '') + '/>');
    if (r.t) out.push(txt(f.L + f.pw - 4, y - 6, r.t, 't-note', 'end'));
  }
  /* vertical callouts: a named x, the way `rules` names a y. m.row stacks them. */
  for (const m of (o.vmarks || [])) {
    const x = f.px(m.x);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + f.T + '" x2="' + x.toFixed(1) + '" y2="' + (f.T + f.ph)
      + '" stroke="' + (m.token || CAT[2]) + '" stroke-width="2"' + (m.dashed ? ' stroke-dasharray="5 4"' : '') + '/>');
    if (m.t) out.push(txt(x + (m.anchor === 'end' ? -7 : 7), f.T + 13 + (m.row || 0) * 17, m.t, 't-lab', m.anchor || 'start'));
  }
  out.push('    <line class="cm-cross" x1="0" y1="' + f.T + '" x2="0" y2="' + (f.T + f.ph)
    + '" stroke="' + AXIS + '" stroke-width="1" style="opacity:0"/>');
  S.forEach((s, i) => {
    const tok = s.token || CAT[S.slice(0, i).filter(x => !x.token).length];
    const pts = s.pts.filter(p => p[1] !== null && p[1] !== undefined);
    if (!pts.length) return;
    const d = pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[1]).toFixed(2)).join(' ');
    if (s.area) {                                   /* a wash, never a block */
      out.push('    <path d="' + d + ' L' + f.px(pts[pts.length - 1][0]).toFixed(2) + ' ' + (f.T + f.ph)
        + ' L' + f.px(pts[0][0]).toFixed(2) + ' ' + (f.T + f.ph) + ' Z" fill="' + tok + '" opacity="0.10"/>');
    }
    out.push('    <path d="' + d + '" fill="none" stroke="' + tok + '" stroke-width="2" '
      + 'stroke-linejoin="round" stroke-linecap="round"'
      + (s.dashed ? ' stroke-dasharray="5 4"' : '') + '/>');
    const last = pts[pts.length - 1];
    out.push('    <circle cx="' + f.px(last[0]).toFixed(2) + '" cy="' + f.py(last[1]).toFixed(2)
      + '" r="4.5" fill="' + tok + '" stroke="' + SURFACE + '" stroke-width="2"/>');
    if (s.endLabel) out.push(txt(f.px(last[0]) - 10, f.py(last[1]) - 12, s.endLabel, 't-lab', 'end'));
    if (o.hover !== false) for (const p of pts) {
      out.push('    <circle ' + hit('cx="' + f.px(p[0]).toFixed(2) + '" cy="' + f.py(p[1]).toFixed(2)
        + '" r="12" fill="transparent" data-cmx="' + f.px(p[0]).toFixed(2) + '"',
        (s.name ? s.name + ' · ' : '') + (o.xOf ? o.xOf(p[0]) : compact(p[0])),
        (o.vOf ? o.vOf(p[1]) : compact(p[1]))) + '/>');
    }
  });
  const keys = o.keys || (S.length > 1
    ? S.map((s, i) => ({ token: s.token || CAT[S.slice(0, i).filter(x => !x.token).length], t: s.name,
                         kind: s.dashed ? 'dash' : 'line' }))
    : null);
  if (keys) out.push(legend(keys, f.L, f.h - 7, o.legendGap, f.pw));
  out.push(close);
  return out.join('\n');
}

/* BAND — an interval that narrows. The certified region is the fill; the two
   edges are the bounds; a marker calls out the places where the bound JUMPED,
   which in this machine is usually a theorem showing up in the data. */
function band(o) {
  const f = frame(o);
  const pts = o.pts;
  const up = pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[2]).toFixed(2)).join(' ');
  const dn = pts.slice().reverse().map(p => 'L' + f.px(p[0]).toFixed(2) + ' ' + f.py(p[1]).toFixed(2)).join(' ');
  const out = [open({ w: f.w, h: f.h, alt: o.alt })];
  out.push(axes(f, o));
  out.push('    <path d="' + up + ' ' + dn + ' Z" fill="' + (o.token || CAT[0]) + '" opacity="0.14"/>');
  for (const idx of [1, 2]) {
    out.push('    <path d="' + pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' '
      + f.py(p[idx]).toFixed(2)).join(' ') + '" fill="none" stroke="' + (o.token || CAT[0])
      + '" stroke-width="2" stroke-linejoin="round"/>');
  }
  for (const m of (o.marks || [])) {
    const x = f.px(m.x);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + f.T + '" x2="' + x.toFixed(1) + '" y2="' + (f.T + f.ph)
      + '" stroke="' + (m.token || CTX) + '" stroke-width="1" stroke-dasharray="3 3"/>');
    out.push(txt(x, f.T + 13, m.t, 't-note', m.anchor || 'middle'));
  }
  if (o.hover !== false) for (const p of pts) {
    out.push('    <rect ' + hit('x="' + (f.px(p[0]) - 6).toFixed(1) + '" y="' + f.T + '" width="12" height="' + f.ph
      + '" fill="transparent" data-cmx="' + f.px(p[0]).toFixed(1) + '"',
      (o.xOf ? o.xOf(p[0]) : compact(p[0])),
      (o.vOf ? o.vOf(p) : compact(p[1]) + ' … ' + compact(p[2]))) + '/>');
  }
  out.push('    <line class="cm-cross" x1="0" y1="' + f.T + '" x2="0" y2="' + (f.T + f.ph)
    + '" stroke="' + AXIS + '" stroke-width="1" style="opacity:0"/>');
  out.push(close);
  return out.join('\n');
}

/* BARS — ranked magnitude, horizontal so long names read. One series, one
   colour: colouring each bar by its own value would spend the identity channel
   re-encoding what the bar length already shows. Values ride the tips. */
function bars(o) {
  const rows = o.rows;
  const rowH = o.rowH || 26, barH = Math.min(24, rowH - 8);
  const hasMarks = !!(o.marks && o.marks.length);
  const h = o.h || (rows.length * rowH + 56 + (o.xLabel ? 18 : 0) + (hasMarks ? 20 : 0));
  /* a log x-axis needs a strictly positive floor, and the bar then grows from
     that floor rather than from zero — which is stated on the axis, because a
     bar whose baseline is not zero is a bar that can mislead */
  const lg = !!o.logX;
  const f = frame(Object.assign({ h, y0: 0, y1: 1, x0: lg ? Math.log10(o.min) : 0,
    x1: lg ? Math.log10(o.max) : o.max, padB: 34 + (o.xLabel ? 18 : 0), padT: 10 + (hasMarks ? 20 : 0) },
    { w: o.w, padL: o.padL === undefined ? 168 : o.padL, padR: o.padR === undefined ? 74 : o.padR }));
  const X = v => f.px(lg ? Math.log10(v) : v);
  const out = [open({ w: f.w, h: f.h, alt: o.alt })];
  for (const t of (o.xTicks || [])) {
    const x = X(t.v !== undefined ? t.v : t);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + f.T + '" x2="' + x.toFixed(1) + '" y2="'
      + (f.T + rows.length * rowH) + '" stroke="' + GRID + '" stroke-width="1"/>');
    out.push(txt(x, f.T + rows.length * rowH + 20, t.t !== undefined ? t.t : compact(t.v !== undefined ? t.v : t), 't-ax', 'middle'));
  }
  for (const m of (o.marks || [])) {
    const x = X(m.x);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + (f.T - 3) + '" x2="' + x.toFixed(1) + '" y2="'
      + (f.T + rows.length * rowH + 3) + '" stroke="' + (m.token || CAT[2]) + '" stroke-width="2"'
      + (m.dashed ? ' stroke-dasharray="5 4"' : '') + '/>');
    /* the callout sits ABOVE the bars, in the headroom padT reserved for it —
       inside the plot it would land on the first bar */
    if (m.t) out.push(txt(x + (m.anchor === 'end' ? -7 : 7), f.T - 8 - (m.row || 0) * 17, m.t, 't-lab', m.anchor || 'start'));
  }
  rows.forEach((r, i) => {
    const y = f.T + i * rowH + (rowH - barH) / 2;
    const wpx = Math.max(2, X(r.v) - f.L);
    const tok = r.token || o.token || CAT[0];
    /* 4px rounded data-end, square at the baseline */
    out.push('    <path ' + hit('d="M' + f.L + ' ' + y + ' h' + Math.max(0, wpx - 4)
      + ' a4 4 0 0 1 4 4 v' + (barH - 8) + ' a4 4 0 0 1 -4 4 h' + -Math.max(0, wpx - 4) + ' Z" fill="' + tok + '"',
      r.k, r.hover || (o.vOf ? o.vOf(r.v) : compact(r.v))) + '/>');
    out.push(txt(f.L - 10, y + barH / 2 + 4, r.k, 't-ax', 'end'));
    out.push(txt(f.L + wpx + 8, y + barH / 2 + 4, r.lab || compact(r.v), 't-lab', 'start'));
  });
  if (o.xLabel) out.push(txt(f.L + f.pw / 2, f.T + rows.length * rowH + 42, o.xLabel, 't-note', 'middle'));
  if (o.keys) out.push(legend(o.keys, f.L, f.h - 6, o.legendGap, f.pw));
  out.push(close);
  return out.join('\n');
}

/* DIST — where a population actually sits. A histogram in the sequential ramp
   (magnitude, one hue) with the median and any named thresholds called out.
   The bins carry a 2px surface gap; nothing is outlined. */
function dist(o) {
  const f = frame(Object.assign({ padB: 28 + (o.xLabel ? 22 : 0) }, o));
  const bins = o.bins;
  const bw = f.pw / bins.length;
  const maxN = Math.max.apply(null, bins.map(b => b.n));
  const out = [open({ w: f.w, h: f.h, alt: o.alt })];
  out.push(axes(f, Object.assign({}, o, { yTicks: o.yTicks || [] })));
  bins.forEach((b, i) => {
    if (!b.n) return;
    const x = f.L + i * bw, hgt = (b.n / maxN) * f.ph;
    const y = f.T + f.ph - hgt;
    /* ONE hue for one series. Ramping the bins along x would spend the identity
       channel re-encoding the axis, which the bar position already carries. A
       caller passes b.token only when the bins mean different THINGS. */
    const tok = b.token || o.token || SEQ[3];
    const bwx = Math.max(1, bw - 2);                   /* the 2px surface gap */
    const r = Math.min(4, bwx / 2, hgt);
    out.push('    <path ' + hit('d="M' + x.toFixed(2) + ' ' + (f.T + f.ph) + ' V' + (y + r).toFixed(2)
      + ' a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + -r + ' h' + (bwx - 2 * r).toFixed(2)
      + ' a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + ' V' + (f.T + f.ph) + ' Z" fill="' + tok + '"',
      b.k, b.n.toLocaleString() + (o.unit ? ' ' + o.unit : '')) + '/>');
  });
  /* m.row stacks a second or third callout instead of letting labels collide:
     nudging them apart horizontally would detach them from their rules */
  for (const m of (o.marks || [])) {
    const x = f.px(m.x);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + (f.T - 4) + '" x2="' + x.toFixed(1) + '" y2="' + (f.T + f.ph)
      + '" stroke="' + (m.token || CAT[2]) + '" stroke-width="2"' + (m.dashed ? ' stroke-dasharray="5 4"' : '') + '/>');
    out.push(txt(x + (m.anchor === 'end' ? -7 : 7), f.T + 9 + (m.row || 0) * 17, m.t, 't-lab', m.anchor || 'start'));
  }
  out.push(close);
  return out.join('\n');
}

/* DUMBBELL — before → after for a handful of named items. One hue, two shades,
   because the two ends are the SAME measure at two times: that is ordinal, not
   identity. The connector carries the direction. */
function dumbbell(o) {
  const rows = o.rows, rowH = o.rowH || 30;
  const h = o.h || (rows.length * rowH + 74);
  const f = frame(Object.assign({ h, y0: 0, y1: 1, padT: 12, padB: 52 },
    { w: o.w, x0: o.x0, x1: o.x1, padL: o.padL === undefined ? 168 : o.padL, padR: 70 }));
  const out = [open({ w: f.w, h: f.h, alt: o.alt })];
  for (const t of (o.xTicks || [])) {
    const x = f.px(t.v !== undefined ? t.v : t);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + f.T + '" x2="' + x.toFixed(1) + '" y2="'
      + (f.T + rows.length * rowH) + '" stroke="' + GRID + '" stroke-width="1"/>');
    out.push(txt(x, f.T + rows.length * rowH + 20, t.t !== undefined ? t.t : compact(t.v !== undefined ? t.v : t), 't-ax', 'middle'));
  }
  rows.forEach((r, i) => {
    const y = f.T + i * rowH + rowH / 2;
    const xa = f.px(r.a), xb = f.px(r.b);
    out.push('    <line x1="' + xa.toFixed(1) + '" y1="' + y + '" x2="' + xb.toFixed(1) + '" y2="' + y
      + '" stroke="' + SEQ[2] + '" stroke-width="2" stroke-linecap="round"/>');
    out.push('    <circle ' + hit('cx="' + xa.toFixed(1) + '" cy="' + y + '" r="5" fill="' + SEQ[1]
      + '" stroke="' + SURFACE + '" stroke-width="2"', r.k + ' · ' + (o.aName || 'before'), o.vOf ? o.vOf(r.a) : compact(r.a)) + '/>');
    out.push('    <circle ' + hit('cx="' + xb.toFixed(1) + '" cy="' + y + '" r="5" fill="' + SEQ[4]
      + '" stroke="' + SURFACE + '" stroke-width="2"', r.k + ' · ' + (o.bName || 'after'), o.vOf ? o.vOf(r.b) : compact(r.b)) + '/>');
    out.push(txt(f.L - 10, y + 4, r.k, 't-ax', 'end'));
    /* the value rides a fixed column at the right, not the far end of the
       connector: a label pinned to whichever dot happens to be rightmost sits
       beside the wrong number half the time */
    if (r.lab) out.push(txt(f.L + f.pw + 12, y + 4, r.lab, 't-lab', 'start'));
  });
  out.push(legend([{ token: SEQ[1], t: o.aName || 'before' }, { token: SEQ[4], t: o.bName || 'after' }],
    f.L, f.h - 6, o.legendGap, f.pw));
  out.push(close);
  return out.join('\n');
}

/* STRIP — one cell per item, coloured by VERDICT. This is the form for "every
   row of a published table, decided": it shows the population and the
   exceptions at once, and the exceptions are labelled, never colour-only. */
function strip(o) {
  const items = o.items, per = o.perRow || Math.min(items.length, 60);
  const rows = Math.ceil(items.length / per);
  const cell = o.cell || 14, gapw = 2;                 /* the 2px surface gap */
  const w = o.w || 900;
  const L = o.padL === undefined ? 4 : o.padL;
  const h = rows * (cell + gapw) + 44;
  const out = [open({ w, h, alt: o.alt })];
  out.push(HATCH_DEF);
  items.forEach((it, i) => {
    const r = Math.floor(i / per), c = i % per;
    const x = L + c * ((w - L - 4) / per), y = 6 + r * (cell + gapw);
    const cw = (w - L - 4) / per - gapw;
    out.push('    <rect ' + hit('x="' + x.toFixed(2) + '" y="' + y + '" width="' + Math.max(1, cw).toFixed(2)
      + '" height="' + cell + '" rx="2" fill="' + it.token + '"', it.k, it.v || '') + '/>');
  });
  out.push(legend(o.keys, L, h - 8, o.legendGap, w - L - 4));
  out.push(close);
  return out.join('\n');
}

/* INTERVALS — a certified enclosure with claims placed against it. This is the
   machine's most common picture and the one with the most at stake: an interval
   is a PROOF, a claim beside it is somebody's number, and the whole point is
   whether the claim is inside or outside. So the enclosure is a solid capsule,
   a claim is a point with a 2px surface ring, and a claim that falls outside
   gets the word REFUTED beside it rather than a colour the reader has to
   decode. The caller supplies already-offset coordinates and their own tick
   labels, because at these zoom levels the axis is in units of 1e-13 and only
   the caller knows what the offset means. */
function intervals(o) {
  const rows = o.rows, rowH = o.rowH || 44;
  const f = frame(Object.assign({ h: o.h || (rows.length * rowH + 78), y0: 0, y1: 1, padT: 16, padB: 56 },
    { w: o.w, x0: o.x0, x1: o.x1, padL: o.padL === undefined ? 150 : o.padL, padR: o.padR === undefined ? 26 : o.padR }));
  const out = [open({ w: f.w, h: f.h, alt: o.alt })];
  for (const t of (o.xTicks || [])) {
    const x = f.px(t.v);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + f.T + '" x2="' + x.toFixed(1) + '" y2="'
      + (f.T + rows.length * rowH) + '" stroke="' + GRID + '" stroke-width="1"/>');
    out.push(txt(x, f.T + rows.length * rowH + 20, t.t, 't-ax', 'middle'));
  }
  rows.forEach((r, i) => {
    const y = f.T + i * rowH + rowH / 2;
    out.push(txt(f.L - 12, y + 4, r.k, 't-ax', 'end'));
    if (r.lo !== undefined) {
      const x0 = f.px(r.lo), x1 = f.px(r.hi), wpx = Math.max(3, x1 - x0);
      out.push('    <rect ' + hit('x="' + x0.toFixed(1) + '" y="' + (y - 7) + '" width="' + wpx.toFixed(1)
        + '" height="14" rx="3" fill="' + (r.token || CAT[1]) + '"', r.k, r.v || '') + '/>');
      /* end caps make a hairline-thin enclosure visible without faking width */
      for (const x of [x0, x1]) out.push('    <line x1="' + x.toFixed(1) + '" y1="' + (y - 12) + '" x2="'
        + x.toFixed(1) + '" y2="' + (y + 12) + '" stroke="' + (r.token || CAT[1]) + '" stroke-width="2"/>');
    }
    if (r.point !== undefined) {
      out.push('    <circle ' + hit('cx="' + f.px(r.point).toFixed(1) + '" cy="' + y + '" r="6" fill="'
        + (r.token || CAT[0]) + '" stroke="' + SURFACE + '" stroke-width="2"', r.k, r.v || '') + '/>');
    }
    if (r.note) out.push(txt(f.px(r.point !== undefined ? r.point : r.hi) + 14, y + 4, r.note, 't-lab', 'start'));
  });
  if (o.xLabel) out.push(txt(f.L + f.pw / 2, f.h - 24, o.xLabel, 't-note', 'middle'));
  if (o.keys) out.push(legend(o.keys, f.L, f.h - 5, o.legendGap, f.pw));
  out.push(close);
  return out.join('\n');
}

/* SEGMENTS — the three-valued verdict, over a continuum. This machine's
   signature picture: sweep one parameter, decide at every step, and draw where
   CERTIFIED turns into REFUSED (undecidable on the published numbers) and then
   into REFUTED. The undecided band is the point of the form, so it is drawn
   with the hatch as well as a colour — the reader must be able to tell the
   three apart in greyscale, in print, and with any colour vision.
   rows: [{k, segs: [{x0, x1, token, hatch, k}]}]                            */
function segments(o) {
  const rows = o.rows, rowH = o.rowH || 44;
  const hasLegend = !!o.keys;
  const stack = Math.max(0, ...rows.map(r => Math.max(0, ...(r.marks || []).map(m => m.row || 0))));
  const availS = (o.w || 900) - (o.padL === undefined ? 176 : o.padL) - (o.padR === undefined ? 26 : o.padR);
  const nLegS = legendLines(o.keys, availS, o.legendGap);
  const legH = nLegS ? 5 + nLegS * LEGEND_LINE : 0;
  const f = frame(Object.assign({ h: o.h || (rows.length * rowH + 30 + (o.xLabel ? 22 : 0) + legH + 22 + stack * 17),
    y0: 0, y1: 1, padT: 16 + stack * 17, padB: 30 + (o.xLabel ? 22 : 0) + legH },
    { w: o.w, x0: o.x0, x1: o.x1, padL: o.padL === undefined ? 176 : o.padL, padR: o.padR === undefined ? 26 : o.padR }));
  const out = [open({ w: f.w, h: f.h, alt: o.alt })];
  out.push(HATCH_DEF);
  const bottom = f.T + rows.length * rowH;
  for (const t of (o.xTicks || [])) {
    const x = f.px(t.v !== undefined ? t.v : t);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + f.T + '" x2="' + x.toFixed(1) + '" y2="' + bottom
      + '" stroke="' + GRID + '" stroke-width="1"/>');
    out.push(txt(x, bottom + 20, t.t !== undefined ? t.t : compact(t.v !== undefined ? t.v : t), 't-ax', 'middle'));
  }
  rows.forEach((r, i) => {
    const y = f.T + i * rowH + (rowH - 20) / 2;
    out.push(txt(f.L - 12, y + 14, r.k, 't-ax', 'end'));
    for (const g of r.segs) {
      const x0 = f.px(g.x0), x1 = f.px(g.x1);
      const wpx = Math.max(1, x1 - x0 - 2);            /* the 2px surface gap */
      out.push('    <rect ' + hit('x="' + x0.toFixed(2) + '" y="' + y + '" width="' + wpx.toFixed(2)
        + '" height="20" rx="3" fill="' + (g.hatch ? 'url(#cmHatch)' : g.token) + '"',
        g.k || r.k, g.v || '') + '/>');
      if (g.hatch) out.push('    <rect x="' + x0.toFixed(2) + '" y="' + y + '" width="' + wpx.toFixed(2)
        + '" height="20" rx="3" fill="none" stroke="' + (g.token || CTX) + '" stroke-width="1"/>');
    }
    /* m.row stacks callouts; m.anchor pulls the last one back inside the frame.
       Nudging labels sideways to dodge each other detaches them from the rule
       they belong to, so they move UP instead. */
    if (r.note) out.push(txt(f.L + f.pw + 12, y + 14, r.note, 't-lab', 'start'));
    for (const m of (r.marks || [])) {
      const x = f.px(m.x);
      out.push('    <line x1="' + x.toFixed(1) + '" y1="' + (y - 5) + '" x2="' + x.toFixed(1) + '" y2="' + (y + 25)
        + '" stroke="' + (m.token || 'var(--ink)') + '" stroke-width="2"/>');
      if (m.t) out.push(txt(x + (m.anchor === 'end' ? -7 : 7), y - 8 - (m.row || 0) * 17, m.t, 't-lab', m.anchor || 'start'));
    }
  });
  if (o.xLabel) out.push(txt(f.L + f.pw / 2, bottom + 42, o.xLabel, 't-note', 'middle'));
  if (o.keys) out.push(legend(o.keys, f.L, f.h - 7, o.legendGap, f.pw));
  out.push(close);
  return out.join('\n');
}

/* SPARKLINE — for a stat tile. Context in the de-emphasis hue, the current
   point in the accent. No axis, no labels: it is a shape, not a reading. */
function sparkline(vals, o) {
  o = o || {};
  const w = o.w || 132, h = o.h || 30, pad = 3;
  const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
  const px = i => pad + (i / (vals.length - 1)) * (w - 2 * pad);
  const py = v => h - pad - (hi === lo ? 0.5 : (v - lo) / (hi - lo)) * (h - 2 * pad);
  const d = vals.map((v, i) => (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(v).toFixed(1)).join(' ');
  return '<svg class="cm-spark" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + escAttr(o.alt || '') + '">'
    + '<path d="' + d + '" fill="none" stroke="' + CTX + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<circle cx="' + px(vals.length - 1).toFixed(1) + '" cy="' + py(vals[vals.length - 1]).toFixed(1)
    + '" r="3.5" fill="' + CAT[0] + '" stroke="' + SURFACE + '" stroke-width="2"/></svg>';
}

module.exports = {
  frame, axes, open, close, txt, legend, legendLines, hit, script, HATCH_DEF,
  lines, band, bars, dist, dumbbell, strip, intervals, segments, sparkline,
  compact, decades, nf, CAT, SEQ, CTX, GRID, AXIS, SURFACE
};
