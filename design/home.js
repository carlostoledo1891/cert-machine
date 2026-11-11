/* home.js — the home page's components: markup, rules and the one script, as (data) -> string.
   design/ · cert-machine · 2026-11-11

   WHY. The operator drew the home page he wanted (2026-11-11: several readers had called the site almost unreadable):
   one idea per section, plain words, a figure a reader can turn. Seven of its pieces did not exist in the design
   system. They are here, in the house grammar, and the page that uses them is tools/home-page.js, which reads every
   number from its record and hands these functions data. None of these functions reads a file or contains a number
   that belongs to the work.

     scope      THE ZOOM. A published configuration drawn on a canvas from its own coordinates, zoomed by a slider
                (or a mouse drag, or a pinch) onto the pair its record names. The sentence under it, the scale bar,
                the zoom word and the two chips all keep their boxes while their content changes. Under the
                controls, THE STILL: the last frame of the zoom, small, drawn in the build from the same geometry
                (zoomKit), so the finding is on the page before anything moves and for a reader who asked for no motion.
     words      three verdict words, compact, at the foot of the hero's left column, each with its small shape
     field      THE REGISTER FIELD. One cell per decided claim, grouped by month; the cell's SHAPE is its verdict
                (never colour alone), a readout of fixed height names the claim under the pointer or the focus, and
                the arrow keys move.
     pairs      what was printed (dashed: quoted, not decided here) above what was decided (plain), six to a grid
     chain      a row of statements joined by decided links; a link nobody decided has no line, only its word
     voices     quotations, each with who said it
     strokes    the house standing legend (playground/warrant.js legendHtml) set as a plate, in the page's plain words
     doors      three ways in

   NO LAYOUT SHIFT (the operator, 2026-11-11: "No layout shift, anywhere, when a control changes a chart"). Every
   element whose content changes has its size reserved: the canvas has a fixed aspect; the sentences are stacked in one
   box of fixed height and only their visibility changes; the scale bar is a fixed track whose bar is scaled by a
   transform; the zoom word and the scale's label are boxes of fixed width, set left; the two chips are there from the
   start and only their opacity changes; the witness × is moved by a transform; the readout has a fixed height at each
   breakpoint and clamps its lines; a cell under the pointer is outlined and scaled, never resized; the still is markup
   in a row of fixed height, and no script touches it. tools/check-home.js drives the page in Chrome and refuses a
   layout shift above zero under any of those controls.

   THE ONE RED (WARRANT rule 5). The witness red is on one mark here: the × drawn where the two circles overlap, at the
   figure's scale, the same × on the same point in the still (the operator, 2026-11-11), and the same glyph beside its
   words under the figure. A refuted claim's cell is a × in ink: a cell's shape is a verdict, and the red never marks a
   verdict. The overlap itself is filled in ink, never in red, in the figure and in the still: the red never fills a
   region.

   The rules use the template's tokens only (no literal spacing, size, weight, leading or duration: tools/check-style.js
   counts those), and a frame is drawn with an outline, never a border, so a framed block and its content share one
   left edge (tools/check-measure.js counts left edges).                                                         MIT */
'use strict';

const C = require('./components.js');
const G = require('./grammar.js');
const W = require('../playground/warrant.js');

const esc = C.esc;

/* a section's head: one sentence as the title, at most one more under it */
function head({ title, titleRaw, pRaw }) {
  return '<div class="hm-head"><h2>' + (titleRaw || esc(title)) + '</h2>' + (pRaw ? '<p>' + pRaw + '</p>' : '') + '</div>';
}
function section({ id, cls, bodyRaw }) {
  return '<section' + (id ? ' id="' + C.escAttr(id) + '"' : '') + (cls ? ' class="' + C.escAttr(cls) + '"' : '') + '>\n' + bodyRaw + '\n</section>';
}
/* a button-shaped link; `solid` fills it */
const btn = ({ href, raw, solid }) => '<a class="hm-btn' + (solid ? ' solid' : '') + '" href="' + C.escAttr(href) + '">' + raw + '</a>';
/* a small link in the mono voice; one that leaves the site opens a new tab (the operator, 2026-10-28) */
const more = ({ href, text }) => '<a class="hm-more" href="' + C.escAttr(href) + '"' + (/^https?:\/\//.test(href) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(text) + '</a>';

/* ---- THE ZOOM'S GEOMETRY, ONCE --------------------------------------------------------------------------------
   Where the pair's point is, how a zoom frames it, which part of a circle falls in the frame, how dark the overlap is
   filled and how a zoom is said in words. The canvas draws with these in the browser and the still is drawn with them
   in the build: the same source, inlined into the page's script (as readoutHtml is), so the two cannot differ. ES5, no
   closure.
     at(C, pair)        the point the zoom ends on, midway across the overlap on the line of centres, and the overlap's
                        depth (the two radii less the distance between the centres)
     view(P, S, s)      the frame of a square of side S px at zoom 10^s: the magnification, the scale, the centre
     arc(c, P, V, n)    a circle in that frame: { o: [x, y, R] } whole while it is small on the screen; once it is not,
                        { p: [[x, y], …] } the arc near the point in n chords, closed far outside the frame;
                        { all: 1 } when the frame is inside it; null when it is nowhere near
     word(Z)            the magnification in words
     OVER               the overlap's fill at full strength (ink, at this opacity) */
function zoomKit() {
  var K = { OVER: 0.3 };
  K.at = function (C, pair) {
    var A = C[pair[0]], B = C[pair[1]];
    var dx = B[0] - A[0], dy = B[1] - A[1], dist = Math.sqrt(dx * dx + dy * dy), ux = dx / dist, uy = dy / dist;
    var depth = (A[2] + B[2]) - dist, mid = A[2] - depth / 2;
    return { P: [A[0] + ux * mid, A[1] + uy * mid], depth: depth };
  };
  /* at ×1 the square sits a little high, clear of the scale in the corner; zoomed in, the point is at the centre */
  K.view = function (P, S, s) {
    var Z = Math.pow(10, s), f = Math.pow(Z, -1.5);
    return { S: S, Z: Z, k: S * 0.86, f: f, cx: P[0] + (0.5 - P[0]) * f, cy: P[1] + (0.5 - P[1]) * f, my: S / 2 - 14 * Math.min(1, f) };
  };
  K.arc = function (c, P, V, n) {
    var S = V.S, Z = V.Z, k = V.k, cx = V.cx, cy = V.cy, my = V.my;
    var d = Math.sqrt((P[0] - c[0]) * (P[0] - c[0]) + (P[1] - c[1]) * (P[1] - c[1])), R = c[2] * Z * k, view = S * 1.6;
    if (R < view * 3) return { o: [(c[0] - cx) * Z * k + S / 2, (c[1] - cy) * Z * k + my, R] };
    if (Math.abs(d - c[2]) * Z * k > view) return d < c[2] ? { all: 1 } : null;
    var t0 = Math.atan2(P[1] - c[1], P[0] - c[0]), h = Math.min(Math.PI, view / R), p = [], i, th, x, y, fx, fy;
    for (i = 0; i <= n; i++) { th = t0 - h + 2 * h * i / n; x = ((c[0] - cx) + c[2] * Math.cos(th)) * Z * k + S / 2; y = ((c[1] - cy) + c[2] * Math.sin(th)) * Z * k + my; p.push([x, y]); }
    fx = -Math.cos(t0) * view * 2; fy = -Math.sin(t0) * view * 2;
    p.push([x + fx, y + fy]);
    th = t0 - h; p.push([((c[0] - cx) + c[2] * Math.cos(th)) * Z * k + S / 2 + fx, ((c[1] - cy) + c[2] * Math.sin(th)) * Z * k + my + fy]);
    return { p: p };
  };
  K.word = function (Z) { return '×' + (Z < 1e3 ? Math.round(Z) : Z < 1e6 ? (Math.round(Z / 100) / 10) + ' thousand' : (Math.round(Z / 1e5) / 10) + ' million'); };
  return K;
}
const ZK = zoomKit();
/* the slider's end, as a power of ten: the still is the frame at this zoom, and its label is this zoom in words */
const ZMAX = 6.2;

/* ---- THE STILL: the zoom's last frame, small, as markup --------------------------------------------------------
   The frame the slider ends on, drawn in the build by the kit the canvas draws with, at the still's own size: each
   circle's ground, the overlap filled in ink at the figure's own strength, the two edges in ink, and the witness × on
   the point (W.witnessMark, no thinner than the edges). Nothing here is drawn by hand and no script touches it, so it
   is on the page at first paint, with motion or without. `alt` states what it shows; `textRaw` is the figure's own
   sentence for this frame. */
const STILL = { side: 48, line: 1.5, chords: 8 };
function still({ circles, pair, alt, textRaw }) {
  if (!alt) throw new Error('home.still: the still needs a text alternative that states the finding');
  const T = STILL.side, g = ZK.at(circles, pair), V = ZK.view(g.P, T, ZMAX), f = (v) => String(Math.round(v * 100) / 100);
  const shape = (a, attrs) => (a.o ? '<circle cx="' + f(a.o[0]) + '" cy="' + f(a.o[1]) + '" r="' + f(a.o[2]) + '"' + attrs + '/>'
    : a.all ? '<rect x="-9" y="-9" width="' + (T + 18) + '" height="' + (T + 18) + '"' + attrs + '/>'
      : '<path d="' + a.p.map((q, i) => (i ? 'L' : 'M') + f(q[0]) + ',' + f(q[1])).join('') + 'Z"' + attrs + '/>');
  const arcs = circles.map((c) => ZK.arc(c, g.P, V, STILL.chords)), drawn = arcs.map((a, i) => i).filter((i) => arcs[i]);
  const gap = g.depth * V.Z * V.k;
  /* the test the figure makes before it says "They overlap": the two edges stand apart on the screen */
  if (!arcs[pair[0]] || !arcs[pair[1]] || !(gap > 3)) throw new Error('home.still: at the slider\'s end the two circles do not overlap on the screen, so the still would show nothing');
  const px = (g.P[0] - V.cx) * V.Z * V.k + T / 2, py = (g.P[1] - V.cy) * V.Z * V.k + V.my;
  /* each circle's shape is written once and used three times: as a ground, as the clip of the overlap, as an edge */
  const use = (i, attrs) => '<use href="#hm-still-' + i + '"' + attrs + '/>';
  return '<div class="hm-still">'
    + '<svg viewBox="0 0 ' + T + ' ' + T + '" role="img" aria-label="' + C.escAttr(alt) + '">'
    + '<defs>' + drawn.map((i) => shape(arcs[i], ' id="hm-still-' + i + '"')).join('') + '<clipPath id="hm-still-clip">' + use(pair[0], '') + '</clipPath></defs>'
    + drawn.map((i) => use(i, ' class="hm-still-g"')).join('')
    + use(pair[1], ' class="hm-still-o" fill-opacity="' + ZK.OVER + '" clip-path="url(#hm-still-clip)"')
    + drawn.map((i) => use(i, ' class="hm-still-l" stroke-width="' + STILL.line + '"')).join('')
    + W.witnessMark(px, py, { size: 5, width: 2.4 })
    + '</svg>'
    + '<p class="hm-still-t"><span class="lab">At ' + esc(ZK.word(Math.pow(10, ZMAX))) + '</span><span>' + textRaw + '</span></p>'
    + '</div>';
}

/* ---- THE ZOOM ------------------------------------------------------------------------------------------------
   circles   [[x, y, r], …] as the decimal literals of the published file (strings), so the page draws the bytes
   pair      [i, j]: the pair the record names; the zoom ends on the point between them
   says      five sentences, in order: the three before the overlap resolves, the overlap, the overlap with its size
             (markup the builder made: the size is a value read from its record)
   chipsRaw  two cells of markup: the verdict as the claimant stated the claim, and what the strict reading finds
   record    the files the figure is drawn from (the figcaption carries them in data-record; nothing is printed)
   stillAlt  (the slider's end in words) -> what the still shows, in words; the still says the fourth sentence */
function scope({ caption, alt, circles, pair, saysRaw, chipsRaw, record, sliderLabel, stillAlt }) {
  if (!Array.isArray(saysRaw) || saysRaw.length !== 5) throw new Error('home.scope: five sentences, in order');
  if (!Array.isArray(chipsRaw) || chipsRaw.length !== 2) throw new Error('home.scope: two chips');
  if (!alt) throw new Error('home.scope: the canvas needs a text alternative that states the finding');
  if (typeof stillAlt !== 'function') throw new Error('home.scope: the still needs its text alternative');
  const data = { c: circles.map((t) => t.map(Number)), pair, guide: G.dash.guide };
  return '<figure class="hm-scope" data-hero>\n'
    + '  <figcaption class="hm-scope-top"' + C.recordLine(record).attr + '><span class="lab">' + esc(caption) + '</span></figcaption>\n'
    + '  <div class="hm-stage" id="hm-stage">\n'
    + '    <canvas id="hm-cv" role="img" aria-label="' + C.escAttr(alt) + '"></canvas>\n'
    /* the witness, as an event at the figure's own scale (D12): W.witnessMark, moved by a transform, shown once the
       overlap is wider than the mark */
    + '    <svg class="hm-wx" id="hm-wx" viewBox="-14 -14 28 28" aria-hidden="true">' + W.witnessMark(0, 0, { size: 8, width: 3 }) + '</svg>\n'
    /* the scale, in the stage's corner as on a map: a fixed track whose bar is scaled by a transform, and its label */
    + '    <div class="hm-bar" aria-hidden="true"><span class="hm-bar-track"><i id="hm-bar"></i></span><span class="lab hm-bar-l" id="hm-bar-l"></span></div>\n'
    + '  </div>\n'
    + '  <p class="hm-say-t" id="hm-say">' + saysRaw.map((s, i) => '<span data-k="' + i + '"' + (i === 0 ? ' class="on"' : '') + '>' + s + '</span>').join('') + '</p>\n'
    + '  <div class="hm-ctrl">\n'
    /* the still, where the zoom ends, on the page from the first paint; beside it the button that plays the way there */
    + '    ' + still({ circles: data.c, pair, alt: stillAlt(ZK.word(Math.pow(10, ZMAX)).replace(/^×/, '')), textRaw: saysRaw[3] }) + '\n'
    + '    <button class="hm-btn sm" id="hm-replay" type="button">Replay</button>\n'
    + '    <span class="lab hm-zw">Zoom <b class="hm-zl" id="hm-zl">×1</b></span>\n'
    + '    <input id="hm-zoom" type="range" min="0" max="' + ZMAX + '" step="0.01" value="0" aria-label="' + C.escAttr(sliderLabel) + '">\n'
    + '  </div>\n'
    + '  <div class="hm-twist off" id="hm-twist">' + chipsRaw.map((c) => '<div>' + c + '</div>').join('') + '</div>\n'
    + '</figure>\n'
    + '<script type="application/json" id="hm-scope-data">' + JSON.stringify(data).replace(/</g, '\\u003c') + '</script>';
}

/* the page's first screen: the headline in two lines, the lede and the calls to action; the zoom beside them; and, at the
   foot of the left column (the operator, 2026-11-11: "too big" as a section of its own), the three words. The words
   come after the figure in the markup: on a phone they read after it, and the figure's own × stays the first on the
   page (tools/check-wiring.js reads the order). */
function hero({ lines, ledeRaw, ctasRaw, scopeRaw, wordsRaw }) {
  return '<div class="hm-hero">\n<div class="hm-hero-t">\n'
    + '  <h1>' + lines.map((l) => '<span>' + esc(l) + '</span>').join(' ') + '</h1>\n'
    + '  <p class="hm-lede">' + ledeRaw + '</p>\n'
    + '  <div class="hm-cta">' + ctasRaw + '</div>\n'
    + '</div>\n' + scopeRaw + '\n' + (wordsRaw || '') + '\n</div>';
}

/* ---- three words, compact, each with its small shape: filled (it holds), the witness × (the thing that breaks it),
   ∅ (no mark: refused). The × is the KEY of the witness mark, drawn by W.witnessMark as the figure draws it. -------- */
const WORD_SHAPE = ['c', 'x', 'n'];
function words({ label, items }) {
  if (items.length !== 3) throw new Error('home.words: three words');
  const glyph = (k) => (k === 'x' ? '<svg class="hm-w3-g" viewBox="-14 -14 28 28" aria-hidden="true">' + W.witnessMark(0, 0, { size: 9, width: 3.4 }) + '</svg>'
    : '<span class="hm-w3-g ' + k + '" aria-hidden="true">' + (k === 'n' ? '∅' : '') + '</span>');
  return '<div class="hm-w3"><p class="lab">' + esc(label) + '</p><div class="hm-w3-row">'
    + items.map((it, i) => '<div class="hm-w3-i">' + glyph(WORD_SHAPE[i]) + '<b>' + esc(it.word) + '</b><p>' + esc(it.text) + '</p></div>').join('') + '</div></div>';
}

/* ---- THE REGISTER FIELD ----------------------------------------------------------------------------------------
   The cell's shape is its verdict; the letter is the cell's class and nothing else. */
const CELL = { CERTIFIED: 'c', PARTIAL: 'p', MIXED: 'm', REPAIRED: 'r', REFUTED: 'x', 'NEEDS DATA': 'n' };
/* one readout, written by this function in the build (the first one) and in the browser (every other): the same
   source, inlined into the page's script, so the two cannot differ. ES5, no closure. */
function readoutHtml(r, chips) {
  var e = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  return '<div class="hm-ro-meta"><span class="lab">' + e(r.d) + '</span>' + chips[r.v] + '</div>'
    + '<div class="hm-ro-body"><div class="hm-ro-who">' + e(r.w) + '</div><div class="hm-ro-what">' + e(r.t) + '</div></div>'
    + '<a class="hm-more" href="' + e(r.h) + '"' + (r.x ? ' target="_blank" rel="noopener"' : '') + '>Open the record</a>';
}
/* months   [{ label, rows: [index into rows] }] in time order
   rows     [{ d: date in words, verdict, w: who, t: what, h: href }] in time order
   legend   [{ verdict, nRaw: its count (a value read from the record), note: plain words }]
   first    the row shown before anything is touched */
function field({ months, rows, legend, first, label, record }) {
  for (const r of rows) if (!CELL[r.verdict]) throw new Error('home.field: no cell shape for the verdict ' + r.verdict);
  const chips = {};
  for (const [word, v] of Object.entries(CELL)) chips[v] = C.tag(word);
  const data = rows.map((r) => ({ d: r.d, v: CELL[r.verdict], w: r.w, t: r.t, h: r.h, x: /^https?:\/\//.test(r.h) ? 1 : 0 }));
  const word = (v) => v.charAt(0) + v.slice(1).toLowerCase();
  const cell = (i) => '<button type="button" class="hm-cell ' + data[i].v + (i === first ? ' on' : '') + '" data-i="' + i + '" tabindex="' + (i === first ? 0 : -1) + '" aria-label="'
    + C.escAttr(word(rows[i].verdict) + ': ' + rows[i].w + '. ' + rows[i].t) + '"></button>';
  return '<figure class="hm-field">\n'
    + '<div class="hm-months" id="hm-months" role="group" aria-label="' + C.escAttr(label) + '">'
    + months.map((m) => '<div class="hm-month"><div class="lab hm-month-l"><span>' + esc(m.label) + '</span><span>' + m.rows.length + '</span></div><div class="hm-cells">' + m.rows.map(cell).join('') + '</div></div>').join('\n')
    + '</div>\n'
    + '<div class="hm-readout" id="hm-readout" aria-live="polite">' + readoutHtml(data[first], chips) + '</div>\n'
    /* the legend is the figure's caption, and carries the figure's record (data-record; nothing is printed) */
    + '<figcaption class="hm-legend"' + C.recordLine(record).attr + '>' + legend.map((l) => '<span><i class="hm-cell ' + CELL[l.verdict] + '" aria-hidden="true"></i><b>' + l.nRaw + '</b> ' + esc(l.note) + '</span>').join('') + '</figcaption>\n'
    + '</figure>\n'
    + '<script type="application/json" id="hm-reg-data">' + JSON.stringify({ first, chips, rows: data }).replace(/</g, '\\u003c') + '</script>';
}

/* ---- what was printed, above what was decided ------------------------------------------------------------------
   wasRaw   the claimant's words and number (the builder marks the number computed: dashed means quoted)
   isRaw    the decided value; `smallRaw` the words under it; `text` one or two plain sentences */
function pairs(items) {
  return '<div class="hm-pairs">' + items.map((it) => '<a class="hm-pair" href="' + C.escAttr(it.href) + '">'
    + '<span class="lab">' + esc(it.k) + '</span>'
    + '<span class="hm-was w-computed">' + it.wasRaw + '</span>'
    + '<span class="hm-is">' + it.isRaw + (it.smallRaw ? '<small>' + it.smallRaw + '</small>' : '') + '</span>'
    + '<span class="hm-pair-p">' + it.textRaw + '</span></a>').join('\n') + '</div>';
}

/* ---- a chain of statements: a decided link is a solid line; a link nobody decided has no line, only its word ---- */
function chain({ nodes, links, alt }) {
  if (links.length !== nodes.length - 1) throw new Error('home.chain: one link between each two nodes');
  const out = [];
  nodes.forEach((n, i) => {
    out.push('<div class="hm-node' + (n.read ? ' read' : '') + '"><b>' + esc(n.title) + '</b><span>' + esc(n.sub) + '</span></div>');
    if (i < links.length) out.push(links[i].decided
      ? '<div class="hm-link"><small>' + esc(links[i].word) + '</small><i></i></div>'
      : '<div class="hm-link gap"><small><span class="w-refused">' + esc(links[i].word) + '</span></small></div>');
  });
  return '<div class="hm-chain" role="img" aria-label="' + C.escAttr(alt) + '">' + out.join('') + '</div>';
}

/* ---- quotations, each with who said it ----------------------------------------------------------------------- */
/* `href` is where it was said (the public source its record pins) and `go` the link's plain words; the link sits at the
   foot of its column, so the three stand on one line */
function voices(items) {
  for (const it of items) if (!/^https:\/\//.test(String(it.href || '')) || !it.go) throw new Error('home.voices: a quotation links to where it was said');
  return '<div class="hm-voices">' + items.map((it) => '<div class="hm-voice"><blockquote>“' + esc(it.quote) + '”</blockquote><p>' + it.byRaw + '</p>'
    + more({ href: it.href, text: it.go }) + '</div>').join('') + '</div>';
}

/* ---- the standing legend as a plate: the house renderer's marks, the page's plain words -------------------------
   `say` maps a standing's label to { k, g }: the key's word and its gloss. The swatches, the structure and data-s are
   playground/warrant.js's own, so the legend is still derived from the page and read by tools/check-wiring.js. */
function strokes(say) {
  const labels = W.LEGEND.map((L) => L.label);
  for (const k of Object.keys(say)) if (!labels.includes(k)) throw new Error('home.strokes: not a standing: ' + k);
  for (const k of labels) if (!say[k] || !say[k].k || !say[k].g) throw new Error('home.strokes: no words for ' + k);
  let n = 0;
  const html = W.legendHtml().replace(/(<div class="item" data-s="(\w+)">[\s\S]*?<\/svg><div>)<div class="k">[\s\S]*?<\/div><div class="g">[\s\S]*?<\/div>/g,
    (m, pre, label) => { n++; return pre + '<div class="k">' + esc(say[label].k) + '</div><div class="g">' + esc(say[label].g) + '</div>'; });
  if (n !== labels.length) throw new Error('home.strokes: the legend renderer changed shape');
  return '<div class="hm-plate">' + html + '</div>';
}

/* ---- three ways in ------------------------------------------------------------------------------------------- */
function doors(items) {
  return '<div class="hm-doors">' + items.map((it) => '<div class="hm-door"><span class="lab">' + esc(it.k) + '</span><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p>' + it.goRaw + '</div>').join('') + '</div>';
}

/* ---- THE RULES ------------------------------------------------------------------------------------------------- */
function css() {
  return `
/* ---- the home page (design/home.js). Tokens only; a frame is an outline, so its content keeps its left edge ---- */
.page > section{margin-top:var(--s-9);padding-top:var(--s-9);border-top:1px solid var(--rule)}
.hm-head{display:grid;gap:var(--s-4);margin-bottom:var(--s-7)}
.hm-head h2{margin:0;font-size:calc(var(--text-1) * 1.2);line-height:var(--leading-tight);letter-spacing:var(--track-display);
  font-weight:var(--weight-display);max-width:calc(var(--title) * .8)}
.hm-head p{margin:0;color:var(--ink-3);font-size:var(--text-3);max-width:calc(var(--read) * .56)}
a.hm-btn,button.hm-btn{display:inline-flex;align-items:center;padding:var(--s-3) var(--s-5);border:1px solid var(--rule-strong);
  border-radius:var(--radius-pill);background:none;color:var(--ink);font-family:var(--f-sans);font-weight:var(--weight-title);
  font-size:var(--text-body);line-height:var(--leading-snug);cursor:pointer;
  transition:border-color var(--dur-fast) var(--ease-out),background var(--dur-fast) var(--ease-out)}
a.hm-btn:hover,button.hm-btn:hover{border-color:var(--ink)}
a.hm-btn.solid{background:var(--ink);color:var(--paper);border-color:var(--ink)}
a.hm-btn.solid:hover{background:var(--ink-2);border-color:var(--ink-2)}
button.hm-btn.sm{padding:var(--s-1) var(--s-4);font-size:var(--text-small)}
button.hm-btn:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
a.hm-more{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;
  color:var(--ink);white-space:nowrap}

/* the first screen */
/* two columns, two rows: the headline block is centred in the room above the three words, the three words end where
   the figure's card ends, and the figure takes both rows, so the page is no taller for them */
.hm-hero{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:1fr auto;gap:var(--s-6) var(--s-7);padding-top:var(--s-5)}
.hm-hero-t{grid-column:1;grid-row:1;align-self:center}
.hm-scope{grid-column:2;grid-row:1 / span 2}
.hm-w3{grid-column:1;grid-row:2;align-self:end}
.hm-hero h1{margin:0}
.hm-hero h1 span{display:block}
.hm-hero h1 span:first-child{color:var(--ink-4)}
/* the lede's measure is a length, not a count of characters, and its four lines are reserved: a measure in ch is as wide
   as the face that happens to be loaded, so the paragraph re-wrapped, and the column moved, when the webfont arrived */
.hm-lede{margin:var(--s-6) 0 0;font-size:calc(var(--text-3) * 1.15);line-height:var(--leading-body);color:var(--ink-3);
  max-width:calc(var(--s-10) * 3.75);min-height:calc(var(--text-3) * 1.15 * var(--leading-body) * 4)}
.hm-lede b{color:var(--ink);font-weight:var(--weight-title)}
.hm-cta{display:flex;flex-wrap:wrap;gap:var(--s-3);margin-top:var(--s-6)}

/* the zoom: every row keeps its box while its content changes */
.hm-scope{margin:0;padding:var(--s-5);display:grid;gap:var(--s-4);background:var(--sunk);border-radius:var(--radius-l);
  outline:1px solid var(--rule);outline-offset:-1px}
/* the caption's one line is a block in its own face: an inline label inside a line set in another face made the line as
   tall as whichever faces had loaded, half a pixel that moved everything under it when the webfont arrived */
figcaption.hm-scope-top{margin:0;font-size:var(--text-eyebrow);line-height:var(--leading-snug)}
figcaption.hm-scope-top .lab{display:block;line-height:var(--leading-snug)}
.hm-stage{position:relative;aspect-ratio:1 / 1;overflow:hidden;cursor:ns-resize;touch-action:pan-y;background:var(--paper);
  border-radius:var(--radius-m);outline:1px solid var(--rule);outline-offset:-1px}
.hm-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.hm-wx{--x:0px;--y:0px;--w:calc(var(--s-6) + var(--s-2));position:absolute;left:0;top:0;width:var(--w);height:var(--w);margin:calc(var(--w) / -2) 0 0 calc(var(--w) / -2);
  transform:translate(var(--x),var(--y));opacity:0;pointer-events:none}
.hm-wx.on{opacity:1}
.hm-say-t{position:relative;margin:0;height:calc(var(--text-2) * var(--leading-snug));font-family:var(--f-display);
  font-size:var(--text-2);line-height:var(--leading-snug);letter-spacing:var(--track-title);font-weight:var(--weight-display);
  color:var(--ink);font-variant-numeric:tabular-nums}
.hm-say-t span[data-k]{position:absolute;left:0;top:0;white-space:nowrap;visibility:hidden}
.hm-say-t span[data-k].on{visibility:visible}
.hm-bar{position:absolute;left:var(--s-1);bottom:var(--s-1);display:flex;align-items:center;gap:var(--s-2);padding:var(--s-1) var(--s-2);
  background:var(--paper);border-radius:var(--radius-s);pointer-events:none}
.hm-bar-track{display:block;width:calc(var(--s-10) - var(--s-4));flex:none}
.hm-bar-track i{--f:1;display:block;height:2px;background:var(--ink-3);transform-origin:left center;transform:scaleX(var(--f))}
.hm-bar-l{display:block;width:calc(var(--s-10) - var(--s-2));flex:none;white-space:nowrap;color:var(--ink-3);letter-spacing:var(--track-loose)}
/* two rows of fixed height: the still with Replay beside it (where the zoom ends, and the button that plays the way
   there), and under them the zoom's word and its slider */
.hm-ctrl{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:var(--s-7) var(--s-6);gap:var(--s-4);align-items:center}
.hm-ctrl .hm-btn{grid-column:3;grid-row:1}
.hm-zw{grid-column:1;grid-row:2;white-space:nowrap}
.hm-zl{display:inline-block;width:calc(var(--s-10) + var(--s-3));margin-left:var(--s-2);color:var(--ink);font-weight:var(--weight-strong);
  font-variant-numeric:tabular-nums;white-space:nowrap}
.hm-ctrl input{grid-column:2 / -1;grid-row:2;width:100%;height:var(--s-5);margin:0;background:transparent;cursor:pointer;appearance:none;-webkit-appearance:none}
.hm-ctrl input::-webkit-slider-runnable-track{height:2px;background:var(--rule-strong)}
.hm-ctrl input::-moz-range-track{height:2px;background:var(--rule-strong)}
.hm-ctrl input::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border:0;border-radius:var(--radius-pill);
  background:var(--ink);margin-top:calc(var(--s-2) * -1)}
.hm-ctrl input::-moz-range-thumb{width:18px;height:18px;border:0;border-radius:var(--radius-pill);background:var(--ink)}
.hm-ctrl input:focus-visible{outline:2px solid var(--ink);outline-offset:3px;border-radius:var(--radius-s)}
/* the still: the zoom's last frame, small, on the stage's own ground; markup of fixed size that no script touches */
.hm-still{grid-column:1 / 3;grid-row:1;display:grid;grid-template-columns:var(--s-7) auto;justify-content:start;align-items:center;gap:var(--s-3);
  height:var(--s-7)}
.hm-still svg{display:block;width:var(--s-7);height:var(--s-7);overflow:hidden;background:var(--paper);border-radius:var(--radius-s);
  outline:1px solid var(--rule);outline-offset:-1px}
.hm-still-g{fill:var(--band-fill)}
.hm-still-o{fill:var(--ink)}
.hm-still-l{fill:none;stroke:var(--ink);stroke-linejoin:round}
.hm-still-t{display:grid;gap:var(--s-1);margin:0}
.hm-still-t span{display:block;line-height:var(--leading-snug);white-space:nowrap}
.hm-still-t span:last-child{color:var(--ink);font-size:var(--text-small);font-weight:var(--weight-title)}
.hm-twist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-4);padding-top:var(--s-4);border-top:1px solid var(--rule);
  transition:opacity var(--dur-slow) var(--ease-out)}
.hm-twist.off{opacity:.3}
.hm-twist > div{display:grid;gap:var(--s-2);justify-items:start;align-content:start;font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink-3)}
.hm-twist .hm-chip{display:inline-flex;align-items:center;gap:var(--s-2)}

/* three words, compact, at the foot of the hero's left column: quiet beside the figure. The sentences' two lines are
   reserved, so the block ends on the card's bottom edge whichever face is loaded */
.hm-w3{display:grid;gap:var(--s-4);padding-top:var(--s-4);border-top:1px solid var(--rule)}
.hm-w3 .lab{margin:0;line-height:var(--leading-snug)}
.hm-w3-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-5)}
.hm-w3-i{display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--s-2) var(--s-3);align-items:center;align-content:start}
.hm-w3-g{display:grid;place-items:center;width:var(--s-6);height:var(--s-6);border-radius:var(--radius-s)}
.hm-w3-g.c{background:var(--ink)}
.hm-w3-g.n{font-family:var(--f-mono);font-weight:var(--weight-mono);font-size:var(--s-6);line-height:var(--leading-tight);color:var(--ink-4)}
.hm-w3-i b{font-family:var(--f-display);font-size:var(--text-3);line-height:var(--leading-snug);letter-spacing:var(--track-title);
  font-weight:var(--weight-display);color:var(--ink);justify-self:start}
.hm-w3-i p{grid-column:1 / -1;margin:0;height:calc(var(--text-small) * var(--leading-snug) * 2);color:var(--ink-3);font-size:var(--text-small);
  line-height:var(--leading-snug)}

/* the register field: one cell per decided claim, its shape the verdict */
.hm-field{margin:0;padding:var(--s-5);display:grid;gap:var(--s-5);background:var(--sunk);border-radius:var(--radius-l);
  outline:1px solid var(--rule);outline-offset:-1px}
.hm-months{display:grid;gap:var(--s-4)}
.hm-month{display:grid;grid-template-columns:calc(var(--s-10) - var(--s-4)) minmax(0,1fr);gap:var(--s-4);align-items:start}
.hm-month-l{display:flex;justify-content:space-between;gap:var(--s-2);padding:var(--s-1) 0}
.hm-month-l span:last-child{color:var(--ink-3)}
.hm-cells{display:flex;flex-wrap:wrap;gap:var(--s-2)}
.hm-cell{--z:var(--s-5);position:relative;display:block;flex:none;width:var(--z);height:var(--z);padding:0;background:none;
  border:1.5px solid var(--ink-3);border-radius:4px;color:var(--ink-3);cursor:pointer;
  font-family:var(--f-mono);font-weight:var(--weight-mono);font-size:var(--z);line-height:var(--leading-tight);
  transition:transform var(--dur-fast) var(--ease-out)}
.hm-cell.c{background:var(--ink);border-color:var(--ink)}
.hm-cell.p{background:linear-gradient(90deg,var(--ink) 50%,transparent 50%);border-color:var(--ink)}
.hm-cell.m{background:linear-gradient(135deg,var(--ink) 50%,transparent 50%);border-color:var(--ink)}
.hm-cell.r::after{content:"";position:absolute;inset:calc(var(--z) * .22);border-radius:var(--radius-pill);background:var(--ink)}
.hm-cell.x,.hm-cell.n{border-color:transparent}
.hm-cell.x::before,.hm-cell.x::after{content:"";position:absolute;left:50%;top:50%;width:calc(var(--z) * 1.08);height:calc(var(--z) * .11);
  background:var(--ink);border-radius:2px;transform:translate(-50%,-50%) rotate(45deg)}
.hm-cell.x::after{transform:translate(-50%,-50%) rotate(-45deg)}
.hm-cell.n::before{content:"\\2205";position:absolute;inset:0;display:grid;place-items:center}
button.hm-cell:hover,button.hm-cell.on,button.hm-cell:focus-visible{outline:1.5px solid var(--ink);outline-offset:3px;transform:scale(1.18)}
.hm-readout{display:grid;grid-template-columns:calc(var(--s-10) - var(--s-4)) minmax(0,1fr) auto;gap:var(--s-2) var(--s-4);align-items:center;
  height:calc(var(--s-9) + var(--s-4));padding-top:var(--s-4);border-top:1px solid var(--rule);overflow:hidden}
.hm-ro-meta{display:grid;gap:var(--s-2);justify-items:start;font-variant-numeric:tabular-nums}
.hm-ro-body{min-width:0}
.hm-ro-who,.hm-ro-what{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.hm-ro-who{-webkit-line-clamp:1;color:var(--ink);font-weight:var(--weight-title);font-size:var(--text-body);line-height:var(--leading-snug)}
.hm-ro-what{-webkit-line-clamp:2;margin-top:var(--s-1);color:var(--ink-3);font-size:var(--text-small);line-height:var(--leading-body)}
figcaption.hm-legend{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-5);margin:0;padding-top:var(--s-4);border-top:1px solid var(--rule);
  font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink-3)}
.hm-legend span{display:inline-flex;align-items:center;gap:var(--s-2)}
.hm-legend .hm-cell{--z:var(--s-4);cursor:default;border-width:1px}
.hm-legend b{color:var(--ink);font-weight:var(--weight-strong);font-variant-numeric:tabular-nums}
.hm-legend b .w-val{text-decoration:none}

/* printed, then decided */
.hm-pairs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-7)}
a.hm-pair{display:grid;gap:var(--s-2);align-content:start;padding-top:var(--s-4);border:0;border-top:1px solid var(--rule-strong);color:inherit;
  transition:border-color var(--dur-fast) var(--ease-out)}
a.hm-pair:hover{border-top-color:var(--ink)}
.hm-was{display:block;margin-top:var(--s-4);font-family:var(--f-display);font-size:var(--text-2);line-height:var(--leading-snug);
  letter-spacing:var(--track-title);font-weight:var(--weight-medium);font-variant-numeric:tabular-nums;text-underline-offset:.24em;
  text-decoration-thickness:from-font;width:fit-content}
/* the whole printed phrase is underlined once, as quoted; the number inside it keeps its address, not a second underline */
.hm-was .w-val{text-decoration:none}
.hm-is{display:block;margin-top:var(--s-1);font-family:var(--f-display);font-size:calc(var(--text-display) * .72);line-height:var(--leading-tight);
  letter-spacing:var(--track-display);font-weight:var(--weight-display);color:var(--ink);font-variant-numeric:tabular-nums}
.hm-is small{display:block;margin-top:var(--s-2);font-size:var(--text-3);line-height:var(--leading-snug);letter-spacing:var(--track-title);
  font-weight:var(--weight-medium);color:var(--ink-3)}
.hm-pair-p{display:block;margin-top:var(--s-3);color:var(--ink-3);font-size:var(--text-body);max-width:calc(var(--read) * .4)}
.hm-key{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-5);margin:var(--s-7) 0 0;font-size:var(--text-small);color:var(--ink-3)}
.hm-key span{text-underline-offset:.24em}

/* the chain */
.hm-chain{display:grid;grid-template-columns:minmax(0,1fr) var(--s-9) minmax(0,1fr) var(--s-9) minmax(0,1fr) var(--s-9) minmax(0,1fr);align-items:stretch}
.hm-node{display:grid;gap:var(--s-2);align-content:start;min-height:calc(var(--s-10) - var(--s-4));padding:var(--s-4);outline:1.5px solid var(--ink);outline-offset:-1.5px;
  border-radius:var(--radius-m)}
.hm-node b{color:var(--ink);font-weight:var(--weight-display);font-size:var(--text-3);line-height:var(--leading-snug)}
.hm-node span{color:var(--ink-3);font-size:var(--text-small);line-height:var(--leading-snug)}
.hm-node.read{outline-color:var(--rule-strong)}
.hm-link{display:grid;gap:var(--s-2);justify-items:center;align-content:center;text-align:center}
.hm-link i{display:block;width:100%;border-top:2px solid var(--ink)}
.hm-link small{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3);
  line-height:var(--leading-snug)}
.hm-after{display:flex;flex-wrap:wrap;gap:var(--s-3) var(--s-6);justify-content:space-between;align-items:baseline;margin-top:var(--s-5)}
.hm-after p{margin:0;color:var(--ink-3);font-size:var(--text-body);max-width:calc(var(--read) * .8)}

/* voices */
.hm-voices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-7)}
.hm-voice{display:grid;grid-template-rows:auto 1fr auto;gap:var(--s-4);padding-top:var(--s-4);border-top:2px solid var(--ink)}
.hm-voice .hm-more{justify-self:start;align-self:end}
.hm-voice blockquote{margin:0;padding:0;border:0;color:var(--ink);font-size:var(--text-2);line-height:var(--leading-snug);letter-spacing:var(--track-title);
  font-weight:var(--weight-medium)}
.hm-voice p{margin:0;color:var(--ink-3);font-size:var(--text-body)}

/* the grammar: the house legend as a plate */
.hm-gram{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-7);align-items:center}
.hm-gram .hm-head{margin-bottom:0}
.hm-gram-links{display:flex;flex-wrap:wrap;gap:var(--s-3) var(--s-5)}
.hm-plate{padding:var(--s-2) var(--s-5);background:var(--sunk);border-radius:var(--radius-l);outline:1px solid var(--rule);outline-offset:-1px}
.hm-plate .w-legend,.hm-plate .w-legend[data-n]{margin:0;gap:0;grid-template-columns:minmax(0,1fr);max-width:none}
.hm-plate .w-legend[data-n] .item:nth-child(n){grid-column:auto;grid-template-columns:46px minmax(0,1fr);gap:var(--s-5);padding:var(--s-4) 0;
  border-top:1px solid var(--rule)}
.hm-plate .w-legend[data-n] .item:first-child{border-top:0}
.hm-plate .w-legend .k{color:var(--ink)}
.hm-plate .w-legend .g{font-size:var(--text-3);color:var(--ink-3)}

/* three ways in */
.hm-doors{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-7)}
.hm-door{display:grid;gap:var(--s-3);align-content:start;padding-top:var(--s-4);border-top:1px solid var(--rule-strong)}
.hm-door h3{margin:0;font-size:var(--text-2);line-height:var(--leading-snug);letter-spacing:var(--track-title)}
.hm-door p{margin:0;color:var(--ink-3);font-size:var(--text-body)}
.hm-door .hm-btn{justify-self:start;margin-top:var(--s-3)}

/* the close */
.hm-contact h2{margin:0;font-size:calc(var(--text-display) * .9);line-height:var(--leading-tight);letter-spacing:var(--track-display);
  font-weight:var(--weight-display);max-width:calc(var(--title) * .5)}
a.hm-mail{display:inline-block;margin-top:var(--s-6);font-family:var(--f-display);font-size:var(--text-2);letter-spacing:var(--track-title);
  color:var(--ink);border-bottom:2px solid var(--ink);overflow-wrap:anywhere}
.hm-d1{margin:var(--s-7) 0 0;color:var(--ink-4);font-size:var(--text-small);max-width:calc(var(--read) * .8)}
.hm-docs{display:flex;flex-wrap:wrap;gap:var(--s-3) var(--s-6);margin-top:var(--s-5)}

@media (max-width:900px){
  .hm-hero{grid-template-columns:minmax(0,1fr);grid-template-rows:none}
  .hm-hero-t,.hm-scope,.hm-w3{grid-column:auto;grid-row:auto}
  .hm-pairs{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hm-voices,.hm-doors,.hm-gram{grid-template-columns:minmax(0,1fr)}
  .hm-gram{gap:var(--s-6)}
  .hm-chain{grid-template-columns:minmax(0,1fr)}
  .hm-node{min-height:0;padding:var(--s-4) var(--s-5)}
  .hm-link{grid-template-columns:var(--s-2) minmax(0,1fr);gap:var(--s-4);justify-items:start;align-items:center;text-align:left;
    min-height:var(--s-7);padding:0 0 0 var(--s-5)}
  .hm-link i{width:0;height:100%;min-height:var(--s-7);border-top:0;border-left:2px solid var(--ink);order:-1}
  .hm-link.gap small{grid-column:1 / -1}
}
@media (max-width:700px){
  .page > section{margin-top:var(--s-8);padding-top:var(--s-8)}
  .hm-hero{margin-top:var(--s-7);padding-top:0}
  .hm-head{margin-bottom:var(--s-6)}
  .hm-scope,.hm-field{padding:var(--s-4)}
  .hm-plate{padding:var(--s-1) var(--s-4)}
  .hm-node,.hm-link{padding-left:var(--s-4)}
  .hm-ctrl{grid-template-columns:minmax(0,1fr) auto;grid-template-rows:var(--s-7) var(--s-5) var(--s-5)}
  .hm-ctrl .hm-btn{grid-column:2}
  /* beside Replay the still takes the room there is; on the narrowest phones its label wraps before it reaches the button */
  .hm-still{grid-column:1;grid-template-columns:var(--s-7) minmax(0,1fr)}
  .hm-still-t span{white-space:normal}
  .hm-zw{grid-column:1 / -1}
  .hm-ctrl input{grid-column:1 / -1;grid-row:3}
  .hm-twist{grid-template-columns:minmax(0,1fr)}
  /* on a phone the three stand one under another; each sentence keeps the page's left edge under its glyph and word */
  .hm-w3-row{grid-template-columns:minmax(0,1fr);gap:var(--s-4)}
  .hm-w3-i p{height:auto}
  .hm-month{grid-template-columns:minmax(0,1fr);gap:var(--s-2)}
  .hm-month-l{justify-content:flex-start;gap:var(--s-3)}
  /* on a phone the readout sits above the cells (the operator, 2026-11-11): the cells are many rows there, and under
     them the readout was a screen away from a touched cell. Order only: the same element at its reserved height, its
     rule at its foot; the legend stays under the cells */
  .hm-readout{order:-1;grid-template-columns:minmax(0,1fr);align-content:start;height:calc(var(--s-10) + var(--s-8));
    padding:0 0 var(--s-4);border-top:0;border-bottom:1px solid var(--rule)}
  .hm-ro-meta{display:flex;align-items:center;gap:var(--s-3)}
  .hm-readout .hm-more{justify-self:start}
  .hm-ro-who{-webkit-line-clamp:2}
  .hm-ro-what{-webkit-line-clamp:3}
}
@media (max-width:560px){
  .hm-pairs{grid-template-columns:minmax(0,1fr);gap:var(--s-6)}
}
@media (prefers-reduced-motion:reduce){.hm-cell,.hm-twist{transition:none}}
`.trim();
}

/* ---- THE SCRIPT: the zoom and the register, ES5, no library. It reads its data from the two JSON blocks beside the
   figures and changes nothing that takes part in layout (see the head of this file). ------------------------------- */
function client() {
  var root = document.documentElement;
  var tok = function (v) { return getComputedStyle(root).getPropertyValue(v).trim(); };

  /* the zoom */
  (function () {
    var src = document.getElementById('hm-scope-data'), cv = document.getElementById('hm-cv');
    if (!src || !cv || !cv.getContext) return;
    var D = JSON.parse(src.textContent), C = D.c, at = ZK.at(C, D.pair), depth = at.depth, P = at.P;
    var ctx = cv.getContext('2d'), stage = document.getElementById('hm-stage'), zin = document.getElementById('hm-zoom');
    var zl = document.getElementById('hm-zl'), bar = document.getElementById('hm-bar'), barl = document.getElementById('hm-bar-l');
    var twist = document.getElementById('hm-twist'), wx = document.getElementById('hm-wx');
    var says = document.getElementById('hm-say').querySelectorAll('[data-k]');
    var MAX = parseFloat(zin.max), s = 0, S = 0, dpr = 1, raf = 0, playing = false, said = 0, zText = '', bText = '';
    var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    var sup = function (n) { return String(n).split('').map(function (c) { return SUP[c]; }).join(''); };
    function size() { dpr = Math.min(window.devicePixelRatio || 1, 2); S = stage.clientWidth; cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr); draw(); }
    /* a circle as a path, from the kit's reading of it in the frame (zoomKit): whole, the arc near the point, or all */
    function path(c, V) {
      var a = ZK.arc(c, P, V, 64), p, i;
      if (!a) return null;
      p = new Path2D();
      if (a.o) { p.arc(a.o[0], a.o[1], a.o[2], 0, Math.PI * 2); return p; }
      if (a.all) { p.rect(-9, -9, S + 18, S + 18); return p; }
      for (i = 0; i < a.p.length; i++) { if (i) p.lineTo(a.p[i][0], a.p[i][1]); else p.moveTo(a.p[i][0], a.p[i][1]); }
      p.closePath(); return p;
    }
    function draw() {
      if (!S) return;
      var V = ZK.view(P, S, s), Z = V.Z, k = V.k, cx = V.cx, cy = V.cy, my = V.my;
      var ink = tok('--ink'), ink4 = tok('--ink-4'), rule = tok('--rule-strong'), band = tok('--band-fill');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, S, S);
      if (Z < 400) { ctx.strokeStyle = rule; ctx.lineWidth = 1; ctx.strokeRect((0 - cx) * Z * k + S / 2, (0 - cy) * Z * k + my, Z * k, Z * k); }
      var paths = [], i, p;
      for (i = 0; i < C.length; i++) { p = path(C[i], V); paths[i] = p; if (p) { ctx.fillStyle = band; ctx.fill(p); } }
      /* where the two overlap: filled in ink (a decided extent), never in the witness red */
      var gap = depth * Z * k, pa = paths[D.pair[0]], pb = paths[D.pair[1]];
      if (gap > 0.6 && pa && pb) { ctx.save(); ctx.clip(pa); ctx.fillStyle = ink; ctx.globalAlpha = Math.min(ZK.OVER, 0.1 + gap / 500); ctx.fill(pb); ctx.restore(); }
      ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
      for (i = 0; i < C.length; i++) if (paths[i]) ctx.stroke(paths[i]);
      /* where to look: a guide, in the guide's pattern */
      var px = (P[0] - cx) * Z * k + S / 2, py = (P[1] - cy) * Z * k + my;
      if (Z < 3e4) { ctx.strokeStyle = ink4; ctx.lineWidth = 1; ctx.setLineDash(D.guide); ctx.beginPath(); ctx.arc(px, py, Math.max(9, 14 - s * 1.2), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      /* the words around the figure: each in a box of fixed size, written only when it changes */
      var z = ZK.word(Z);
      if (z !== zText) { zText = z; zl.textContent = z; zin.setAttribute('aria-valuetext', z); }
      var e = Math.floor(Math.log(110 / (Z * k)) / Math.LN10), len = Math.pow(10, e) * Z * k;
      bar.style.setProperty('--f', (len / 112).toFixed(4));
      var b = e === 0 ? '1 side' : '10' + sup(e) + ' of a side';
      if (b !== bText) { bText = b; barl.textContent = b; }
      var bad = gap > 3, now = bad ? (gap > 40 ? 4 : 3) : (s < 1.2 ? 0 : s < 3 ? 1 : 2);
      if (now !== said) { says[said].className = ''; says[now].className = 'on'; said = now; }
      twist.className = 'hm-twist' + (gap > 40 ? '' : ' off');
      wx.style.setProperty('--x', px.toFixed(1) + 'px'); wx.style.setProperty('--y', py.toFixed(1) + 'px');
      wx.setAttribute('class', 'hm-wx' + (gap > 22 ? ' on' : ''));
    }
    function set(v) { s = Math.max(0, Math.min(MAX, v)); zin.value = s; draw(); }
    function stop() { playing = false; cancelAnimationFrame(raf); }
    function play() {
      stop(); playing = true; var t0 = null, to = MAX - 0.1, dur = 7000;
      (function step(t) { if (!playing) return; if (t0 === null) t0 = t; var u = Math.min(1, (t - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; set(to * e); if (u < 1) raf = requestAnimationFrame(step); else playing = false; })(performance.now());
    }
    zin.addEventListener('input', function () { stop(); set(parseFloat(zin.value)); });
    /* a pinch (the browser sends it as ctrl + wheel) zooms; a plain wheel scrolls the page, as a reader expects */
    stage.addEventListener('wheel', function (e) { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); stop(); set(s - e.deltaY * 0.01); }, { passive: false });
    var drag = null;
    stage.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; drag = { y: e.clientY, s: s }; stage.setPointerCapture(e.pointerId); stop(); });
    stage.addEventListener('pointermove', function (e) { if (drag) set(drag.s + (drag.y - e.clientY) * 0.02); });
    stage.addEventListener('pointerup', function () { drag = null; });
    stage.addEventListener('pointercancel', function () { drag = null; });
    document.getElementById('hm-replay').addEventListener('click', play);
    window.addEventListener('resize', size);
    document.addEventListener('warrant-theme', draw);
    size();
    /* a dev hook (design/CONTRACT.md): #zoom=6.2 sets the zoom through the control's own path and plays nothing */
    var hook = /[#&]zoom=([0-9.]+)/.exec(location.hash);
    if (hook) set(parseFloat(hook[1]));
    else if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) setTimeout(play, 900);
  })();

  /* the register */
  (function () {
    var src = document.getElementById('hm-reg-data'), months = document.getElementById('hm-months'), ro = document.getElementById('hm-readout');
    if (!src || !months || !ro) return;
    var R = JSON.parse(src.textContent), rows = R.rows, cells = months.querySelectorAll('.hm-cell'), cur = R.first;
    function show(i, focus) {
      if (i !== cur) {
        cells[cur].classList.remove('on'); cells[cur].tabIndex = -1;
        cur = i; cells[i].classList.add('on'); cells[i].tabIndex = 0;
        ro.innerHTML = readoutHtml(rows[i], R.chips);
      }
      if (focus) cells[i].focus();
    }
    var at = function (e) { var b = e.target && e.target.closest ? e.target.closest('.hm-cell') : null; return b ? parseInt(b.getAttribute('data-i'), 10) : -1; };
    months.addEventListener('mouseover', function (e) { var i = at(e); if (i >= 0) show(i); });
    months.addEventListener('focusin', function (e) { var i = at(e); if (i >= 0) show(i); });
    months.addEventListener('click', function (e) { var i = at(e); if (i >= 0) show(i); });
    months.addEventListener('keydown', function (e) {
      var n = cur;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = Math.min(rows.length - 1, cur + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = Math.max(0, cur - 1);
      else return;
      e.preventDefault(); show(n, true);
    });
    var hook = /[#&]cell=([0-9]+)/.exec(location.hash);
    if (hook && cells[+hook[1]]) show(+hook[1]);
  })();
}
const script = () => '<script>(function(){var readoutHtml=' + readoutHtml.toString() + ',ZK=(' + zoomKit.toString() + ')();(' + client.toString() + ')();})();</script>';

module.exports = { head, section, btn, more, hero, scope, still, words, field, pairs, chain, voices, strokes, doors, css, script, CELL, readoutHtml, zoomKit, ZMAX };
