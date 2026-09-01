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
/* The GitHub mark, inline. aria-hidden — the link that carries it holds the
   accessible name, so the icon never speaks twice. */
const GH_ICON = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">'
  + '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49'
  + '-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66'
  + '.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82'
  + '.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95'
  + '.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

/* The fixed top bar. Emitted by the template on every page — a builder never
   calls it directly, so navigation cannot drift between pages.
   On narrow viewports the links fold into a drawer driven by a checkbox and
   a label — CSS state, no script, so the design system still ships exactly
   one scripted element (the flow readout). The GitHub link is the mark alone
   on desktop; the drawer shows its text label beside it. */
function nav({ brand, brandHref, links, github }) {
  return '<nav class="topnav">'
    + '<input type="checkbox" id="navdrawer" class="nav-ck">'
    + '<div class="topnav-in">'
    + '<a class="brand" href="' + escAttr(brandHref || '/') + '">' + esc(brand) + '</a>'
    + '<label class="nav-burger" for="navdrawer" aria-label="Toggle navigation"><span class="nb"></span></label>'
    + '<div class="navlinks">'
    + (links || []).map((l) => '<a href="' + escAttr(l.href) + '">' + esc(l.t) + '</a>').join('')
    + (github ? '<a class="ghbtn" href="' + escAttr(github) + '" aria-label="GitHub">' + GH_ICON + '<span class="gh-t">GitHub</span></a>' : '')
    + '</div></div></nav>';
}

function header({ eyebrow, title, deck }) {
  return '<header class="col">\n'
    + (eyebrow ? '  <div class="eyebrow">' + esc(eyebrow) + '</div>\n' : '')
    + '  <h1>' + esc(title) + '</h1>\n'
    + (deck ? '  <p class="deck">' + esc(deck) + '</p>\n' : '')
    + '</header>';
}

/* The stat strip. Each: {k: label, v: value, n: note, sm: true for long values}.
   The big number is ALWAYS the signature pink (operator ruling 2026-08-31: the
   value in a stat grid never wears a verdict colour — verdicts belong to tags
   and prose). A `role` field is still accepted from older builders and ignored,
   so no class ships without a rule. */
function stats(items) {
  const cells = items.map(it => {
    const cls = 'v' + (it.sm ? ' sm' : '');
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

/* A command / code block: recessed like .eq but left-aligned and small —
   shell lines, file snippets. Text only; everything is escaped. */
const code = (text) => '<pre class="code">' + esc(text) + '</pre>';

function note({ lab, bodyRaw }) {
  return '<div class="note">\n'
    + (lab ? '  <span class="lab">' + esc(lab) + '</span>\n' : '')
    + bodyRaw + '\n</div>';
}

/* The ten-second block under a report's header: the three lines a 90-second
   reader needs — what was found, the mechanism, and how a stranger re-checks
   it. Raw-suffixed fields because a check line is usually a command in m().
   Wraps its own .col so it can sit between header and first section. */
function tldr({ findingRaw, mechanismRaw, checkRaw }) {
  return '<div class="col"><div class="note">\n  <span class="lab">tl;dr</span>\n'
    + '<ul class="plain">'
    + '<li><b>The finding.</b> ' + findingRaw + '</li>'
    + '<li><b>The mechanism.</b> ' + mechanismRaw + '</li>'
    + '<li><b>Check it.</b> ' + checkRaw + '</li>'
    + '</ul>\n</div></div>';
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

/* A grid of link cards — the whole card is the anchor. Two columns on a
   desk, one on a phone; the template owns the breakpoint.
   items: [{href, k: mono kicker, title, desc, n: mono footer line}] */
function cards(items) {
  return '<div class="wide"><div class="cards">' + items.map(it =>
    '<a class="card" href="' + escAttr(it.href) + '">'
    + (it.k ? '<span class="card-k">' + esc(it.k) + '</span>' : '')
    + '<span class="card-t">' + esc(it.title) + '</span>'
    + (it.desc ? '<span class="card-d">' + esc(it.desc) + '</span>' : '')
    + (it.n ? '<span class="card-n">' + esc(it.n) + '</span>' : '')
    + '</a>'
  ).join('\n') + '</div></div>';
}

/* PICKER — a tabbed panel driven by CSS state, no script. `name` is the radio
   group; items are [{k: kicker, t: tab word, title, tagRaw, leadRaw, boxes:
   [{lab, bodyRaw, warn}]}]. The first item opens.

   The radios come FIRST in source order because the template's rules reach the
   tabs and panels through the sibling combinator. Every panel is present in the
   markup — a reader with no CSS at all sees all six, which is the right
   degradation for a page whose point is that nothing is hidden.

   The cap is 12: the template generates that many nth-of-type pairs, and a
   silently truncated picker would show the wrong panel, so it throws instead. */
function picker({ name, items }) {
  if (items.length > 12) throw new Error('picker: ' + items.length + ' items exceeds the 12 the template styles');
  const id = (i) => 'pk-' + name + '-' + i;
  const radios = items.map((it, i) =>
    '<input class="pk-r" type="radio" name="' + escAttr(name) + '" id="' + escAttr(id(i)) + '"'
    + (i === 0 ? ' checked' : '') + '>').join('\n');
  const tabs = items.map((it, i) =>
    '<label class="pk-t" for="' + escAttr(id(i)) + '">'
    + '<span class="pk-k">' + esc(it.k) + '</span>'
    + '<span class="pk-n">' + esc(it.t) + '</span></label>').join('\n');
  const panes = items.map(it =>
    '<div class="pk-p">'
    + '<div class="pk-head"><h3>' + esc(it.title) + '</h3>' + (it.tagRaw || '') + '</div>'
    + (it.leadRaw ? '<p>' + it.leadRaw + '</p>' : '')
    + (it.boxes && it.boxes.length
      ? '<div class="pk-grid">' + it.boxes.map(b =>
        '<div class="pk-box' + (b.warn ? ' warn' : '') + '">'
        + '<span class="lab">' + esc(b.lab) + '</span><p>' + b.bodyRaw + '</p></div>').join('') + '</div>'
      : '')
    + '</div>').join('\n');
  return '<div class="wide"><div class="picker">\n' + radios
    + '\n<div class="pk-tabs">\n' + tabs + '\n</div>\n<div class="pk-panes">\n' + panes + '\n</div>\n</div></div>';
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
  nav, header, stats, scope, section, p, pRaw, pull, eq, code, note, tldr, quote,
  table, plainList, cards, picker, figure, flow,
  svgOpen, svgClose, numberLine, band, vmark, label,
  tokens: T
};
