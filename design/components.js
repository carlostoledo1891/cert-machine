/* components.js — every visual element this repository can put on a page.
   design/ · cert-machine

   THE RULE THIS FILE EXISTS TO ENFORCE: no page assembles HTML by hand. A page
   builder passes DATA to these functions and gets markup back. That is what
   makes a token change, a spacing change or an accessibility fix land on every
   page at once instead of on whichever page somebody remembered.

   Each component below is (data) -> string. None of them reads a file, none
   knows what a hunt is, and none contains a number. Adding a component means
   adding a function here and a row to DESIGN.md — never a <div> in a builder.

   ESCAPING. Everything that can carry a value from disk goes through esc().
   The one exception is `raw`-suffixed parameters, which exist for markup this
   file itself generated (an <svg> from fig(), a <td> row from table()), and
   they are named so the exception is visible at the call site. */
'use strict';

const T = require('./tokens.js');

/* --------------------------------------------------------------- escaping - */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
/* attribute values only; same table, kept separate so intent reads at the call */
const escAttr = esc;

/* ------------------------------------------------------------------ atoms - */

/* monospaced inline value — every number, id, path and hash on a page */
const m = (s) => '<span class="m">' + esc(s) + '</span>';

/* a status tag. `kind` is a ROLE, not a colour: held | cert | open | dep */
const TAG_KINDS = ['held', 'cert', 'open', 'dep'];
function tag(text, kind) {
  const k = TAG_KINDS.indexOf(kind) >= 0 ? kind : 'dep';
  return '<span class="tag ' + k + '">' + esc(text) + '</span>';
}

/* ---------------------------------------------------------------- blocks - */

/* The page header: eyebrow, title, deck. */
function header({ eyebrow, title, deck }) {
  return '<header class="col">\n'
    + (eyebrow ? '  <div class="eyebrow">' + esc(eyebrow) + '</div>\n' : '')
    + '  <h1>' + esc(title) + '</h1>\n'
    + (deck ? '  <p class="deck">' + esc(deck) + '</p>\n' : '')
    + '</header>';
}

/* The stat strip. Each: {k: label, v: value, n: note, sm: true for long values,
   role: 'sig'|'held'|'warn' to colour the value}. */
function stats(items) {
  const cells = items.map(it => {
    const cls = 'v' + (it.sm ? ' sm' : '') + (it.role ? ' ' + it.role : '');
    return '    <div class="stat"><div class="k">' + esc(it.k) + '</div>'
      + '<div class="' + cls + '">' + (it.vRaw || esc(it.v)) + '</div>'
      + (it.n ? '<div class="n">' + esc(it.n) + '</div>' : '') + '</div>';
  }).join('\n');
  return '<div class="wide">\n  <div class="stats">\n' + cells + '\n  </div>\n</div>';
}

/* The scope line under the hero — what this document is and is not. */
const scope = (text) => '<p class="scope">' + esc(text) + '</p>';

/* A section. `wide` puts the body in the 900px track instead of 64ch. */
function section({ lab, title, bodyRaw, wide }) {
  const cls = wide ? 'section' : 'col';
  return '<section class="' + (wide ? '' : 'col') + '">\n'
    + '  <div class="' + (wide ? 'col ' : '') + 'sec-head">\n'
    + (lab ? '    <div class="lab">' + esc(lab) + '</div>\n' : '')
    + '    <h2>' + esc(title) + '</h2>\n'
    + '  </div>\n'
    + bodyRaw + '\n'
    + '</section>';
}

const p = (text) => '<p>' + esc(text) + '</p>';
/* prose that needs inline markup this file produced (m(), tag(), <em>) */
const pRaw = (raw) => '<p>' + raw + '</p>';

const pull = (raw) => '<p class="pull">' + raw + '</p>';

const eq = (raw) => '<div class="eq">' + raw + '</div>';

function note({ lab, bodyRaw }) {
  return '<div class="note">\n'
    + (lab ? '  <span class="lab">' + esc(lab) + '</span>\n' : '')
    + bodyRaw + '\n</div>';
}

function quote({ text, cite }) {
  return '<blockquote>' + esc(text)
    + (cite ? '<cite>' + esc(cite) + '</cite>' : '') + '</blockquote>';
}

/* A data table. cols: [{h, cls}], rows: [[cell,...]] where a cell is either a
   string (escaped) or {raw} (already markup from this file). */
function table({ cols, rows }) {
  const head = '<thead><tr>' + cols.map(c => '<th>' + esc(c.h) + '</th>').join('') + '</tr></thead>';
  const body = '<tbody>' + rows.map(r =>
    '<tr>' + r.map((cell, i) => {
      const cls = cols[i] && cols[i].cls ? ' class="' + escAttr(cols[i].cls) + '"' : '';
      const inner = (cell && typeof cell === 'object' && 'raw' in cell) ? cell.raw : esc(cell);
      return '<td' + cls + '>' + inner + '</td>';
    }).join('') + '</tr>'
  ).join('') + '</tbody>';
  return '<div class="wide"><div class="tw"><table>' + head + body + '</table></div></div>';
}

/* An unadorned list where each item is a claim: {b: lead, text: rest}. */
function plainList(items) {
  return '<ul class="plain">' + items.map(it =>
    '<li>' + (it.b ? '<b>' + esc(it.b) + '</b> ' : '') + (it.raw || esc(it.text)) + '</li>'
  ).join('') + '</ul>';
}

/* A figure: an <svg> string this file's fig helpers produced, plus a caption.
   `alt` is REQUIRED — a figure with no text alternative is a figure that does
   not exist for some readers, and the page battery fails on a missing one. */
function figure({ svgRaw, caption, wide }) {
  const inner = '<figure>\n  <div class="figbox">\n' + svgRaw + '\n  </div>\n'
    + (caption ? '  <figcaption>' + esc(caption) + '</figcaption>\n' : '')
    + '</figure>';
  return wide === false ? inner : '<div class="wide">' + inner + '</div>';
}

/* ------------------------------------------------------------- figure kit -
   Small SVG builders. They take numbers and return markup that uses ONLY the
   token names in tokens.FIGURE_TOKENS — never a literal colour, because a
   literal is invisible in one of the two themes. */

function svgOpen({ w, h, alt }) {
  return '    <svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + escAttr(alt) + '">';
}
const svgClose = '    </svg>';

/* A horizontal scale with labelled ticks and an arbitrary set of marks. */
function numberLine({ x0, x1, y, lo, hi, ticks, marks, w, h, alt }) {
  const px = (v) => x0 + (v - lo) / (hi - lo) * (x1 - x0);
  const parts = [svgOpen({ w, h, alt })];
  for (const t of (ticks || [])) {
    parts.push('    <line x1="' + px(t).toFixed(1) + '" y1="' + (y - 36) + '" x2="' + px(t).toFixed(1) + '" y2="' + y + '" stroke="var(--rule-soft)" stroke-width="1"/>');
    parts.push('    <text x="' + px(t).toFixed(1) + '" y="' + (y + 22) + '" text-anchor="middle" class="t-ax">' + esc(t) + '</text>');
  }
  parts.push('    <line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="var(--rule)" stroke-width="1"/>');
  for (const mk of (marks || [])) parts.push(mk);
  parts.push(svgClose);
  return parts.join('\n');
}

/* a filled span on a number line */
function band({ xa, xb, y, hgt, token }) {
  return '    <rect x="' + xa.toFixed(1) + '" y="' + y + '" width="' + Math.max(1.5, xb - xa).toFixed(1)
    + '" height="' + hgt + '" rx="3" fill="var(' + token + ')"/>';
}
function vmark({ x, y0, y1, token, wdt }) {
  return '    <line x1="' + x.toFixed(1) + '" y1="' + y0 + '" x2="' + x.toFixed(1) + '" y2="' + y1
    + '" stroke="var(' + token + ')" stroke-width="' + (wdt || 3) + '"/>';
}
function label({ x, y, text, cls, anchor }) {
  return '    <text x="' + x.toFixed(1) + '" y="' + y + '"'
    + (anchor ? ' text-anchor="' + anchor + '"' : '') + ' class="' + cls + '">' + esc(text) + '</text>';
}

/* A categorical chart: one column per x category, each carrying a stack of
   marks. Used for the landscape (best certified value at each term count) and
   general enough for any "value per named bucket" figure.

   cats:   [{x: label, bars: [{v, token, w}], rule: {v, token}, note}]
   yLo/yHi: the value axis; yTicks: values to label. */
function categoryChart({ cats, yLo, yHi, yTicks, w, h, alt, yLabel }) {
  const padL = 74, padR = 20, padT = 22, padB = 46;
  const x0 = padL, x1 = w - padR, y0 = padT, y1 = h - padB;
  const step = (x1 - x0) / Math.max(1, cats.length);
  const py = (v) => y1 - (v - yLo) / (yHi - yLo) * (y1 - y0);
  const parts = [svgOpen({ w, h, alt })];

  for (const t of (yTicks || [])) {
    const y = py(t);
    parts.push('    <line x1="' + x0 + '" y1="' + y.toFixed(1) + '" x2="' + x1 + '" y2="' + y.toFixed(1) + '" stroke="var(--rule-soft)" stroke-width="1"/>');
    parts.push('    <text x="' + (x0 - 10) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" class="t-ax">' + esc(t) + '</text>');
  }
  if (yLabel) parts.push('    <text x="' + x0 + '" y="' + (y0 - 8) + '" class="t-note">' + esc(yLabel) + '</text>');

  cats.forEach((c, i) => {
    const cx = x0 + step * (i + 0.5);
    const bw = Math.min(20, step * 0.52);
    for (const b of (c.bars || [])) {
      const top = py(b.v);
      parts.push('    <rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + top.toFixed(1)
        + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1.5, y1 - top).toFixed(1)
        + '" rx="2" fill="var(' + b.token + ')"/>');
    }
    if (c.rule) {
      const ry = py(c.rule.v);
      parts.push('    <line x1="' + (cx - bw / 2 - 4).toFixed(1) + '" y1="' + ry.toFixed(1)
        + '" x2="' + (cx + bw / 2 + 4).toFixed(1) + '" y2="' + ry.toFixed(1)
        + '" stroke="var(' + c.rule.token + ')" stroke-width="2"/>');
    }
    parts.push('    <text x="' + cx.toFixed(1) + '" y="' + (y1 + 18) + '" text-anchor="middle" class="t-ax">' + esc(c.x) + '</text>');
    if (c.note) parts.push('    <text x="' + cx.toFixed(1) + '" y="' + (y1 + 34) + '" text-anchor="middle" class="t-note">' + esc(c.note) + '</text>');
  });

  parts.push('    <line x1="' + x0 + '" y1="' + y1 + '" x2="' + x1 + '" y2="' + y1 + '" stroke="var(--rule)" stroke-width="1"/>');
  parts.push(svgClose);
  return parts.join('\n');
}

/* A legend strip for a figure: [{text, token, cls}] */
function legend({ items, x, y, gap }) {
  const out = [];
  let cx = x;
  for (const it of items) {
    out.push('    <rect x="' + cx + '" y="' + (y - 7) + '" width="10" height="3" fill="var(' + it.token + ')"/>');
    out.push('    <text x="' + (cx + 16) + '" y="' + y + '" class="' + (it.cls || 't-note') + '">' + esc(it.text) + '</text>');
    cx += (gap || 230);
  }
  return out.join('\n');
}

/* ------------------------------------------------------------ the machine -
   An interactive schematic: nodes, the edges records flow along, and a
   readout that narrates whichever node the reader activates. The builder
   passes PURE DATA — geometry, labels, descriptions — and this component
   decides every byte of markup, like everything else in this file.

   nodes: [{id, x, y, w, h, role: 'sig'|'held'|'warn'|'dep', k, v, t, d}]
     k/v render inside the node; t/d feed the readout on click (t short, d prose).
   edges: [{d: svg path, flow: false to disable the animated overlay,
            lab, lx, ly, anchor: optional tiny label}]
   readout: {k, d} — the default narration, and the no-script fallback.

   The script is the ONE scripted element the design system ships: activation
   swaps the readout text, nothing more. Scripts off: hover still highlights,
   the default narration stands, the caption still explains. */
function flow({ w, h, alt, readout, nodes, edges, caption }) {
  const parts = [];
  parts.push('    <svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + escAttr(alt) + '">');
  parts.push('      <defs><marker id="mfa" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">'
    + '<path d="M0 0L8 4L0 8z" fill="var(--ink-3)"/></marker></defs>');
  for (const e of edges) {
    parts.push('      <path class="ed" d="' + escAttr(e.d) + '" marker-end="url(#mfa)"/>');
    if (e.flow !== false) parts.push('      <path class="ed-f" d="' + escAttr(e.d) + '"/>');
  }
  for (const n of nodes) {
    parts.push('      <g class="nd" tabindex="0" role="button" aria-label="' + escAttr(n.t) + '"'
      + ' data-t="' + escAttr(n.t) + '" data-d="' + escAttr(n.d) + '">');
    parts.push('        <rect class="nd-box" x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="5"/>');
    const acc = ['sig', 'held', 'warn', 'dep'].indexOf(n.role) >= 0 ? n.role : 'dep';
    parts.push('        <rect class="acc-' + acc + '" x="' + n.x + '" y="' + n.y + '" width="3" height="' + n.h + '" rx="1.5"/>');
    parts.push('        <text class="nd-k" x="' + (n.x + 14) + '" y="' + (n.y + 18) + '">' + esc(n.k) + '</text>');
    if (n.v) parts.push('        <text class="nd-v" x="' + (n.x + 14) + '" y="' + (n.y + n.h - 11) + '">' + esc(n.v) + '</text>');
    parts.push('      </g>');
  }
  /* labels after nodes, so a label near a box is never buried under it */
  for (const e of edges) {
    if (e.lab) parts.push('      <text class="ed-lab" x="' + e.lx + '" y="' + e.ly + '"'
      + (e.anchor ? ' text-anchor="' + escAttr(e.anchor) + '"' : ' text-anchor="middle"') + '>' + esc(e.lab) + '</text>');
  }
  parts.push('    </svg>');

  const script = [
    '<script>(function(){',
    'var f=document.querySelector("figure.mach");if(!f)return;',
    'var k=f.querySelector("[data-ro-k]"),d=f.querySelector("[data-ro-d]");',
    'function on(g){var o=f.querySelector("g.nd.on");if(o)o.classList.remove("on");',
    'g.classList.add("on");k.textContent=g.getAttribute("data-t");d.textContent=g.getAttribute("data-d");}',
    'f.querySelectorAll("g.nd").forEach(function(g){',
    'g.addEventListener("click",function(){on(g)});',
    'g.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();on(g)}});',
    '});})();</scr' + 'ipt>'
  ].join('');

  return '<div class="wide"><figure class="mach">\n  <div class="figbox">\n'
    + '    <div class="mach-ro"><div class="k" data-ro-k>' + esc(readout.k) + '</div>'
    + '<div class="d" data-ro-d>' + esc(readout.d) + '</div></div>\n'
    + parts.join('\n') + '\n  </div>\n'
    + (caption ? '  <figcaption>' + esc(caption) + '</figcaption>\n' : '')
    + '</figure></div>\n' + script;
}

module.exports = {
  esc, escAttr, m, tag, TAG_KINDS, categoryChart, legend,
  header, stats, scope, section, p, pRaw, pull, eq, note, quote,
  table, plainList, figure, flow,
  svgOpen, svgClose, numberLine, band, vmark, label,
  tokens: T
};
