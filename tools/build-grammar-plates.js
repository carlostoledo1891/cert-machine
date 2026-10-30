/* build-grammar-plates.js — the drawings of /grammar/: the four marks as cards, their order as an algebra, every rule
   as a before-and-after, the colour law as swatches, the premise ladder, the issues and their fixes.
   tools/ · cert-machine · 2026-10-30

   WHY A SECOND FILE. tools/build-grammar.js reads the records, the rulebook and the checks, and refuses when one stops
   saying what the page says; this file only draws. Every mark in it is drawn by playground/warrant.js (W.attrs,
   W.witnessMark, the legend's own hatch idea) or is a guide, so a drawing here is the grammar, never a picture of it.
   It invents no data: a curve is √x or a straight line, a number is passed in from a record, and a shape that only
   stands for a kind of mark (the wavy lines of rule 4) carries no number at all.

   Each plate is a small SVG with its own viewBox, laid out by the page's grid, so a phone reads it at the size a desk
   does.                                                                                                        MIT */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const C = require(path.join(ROOT, 'design', 'components.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const esc = C.esc;

/* ------------------------------------------------------------- atoms -- */
const f1 = (v) => (+v).toFixed(1);
const svg = (w, h, alt, inner) => CH.open({ w, h, alt }) + '\n' + inner + '\n' + CH.close;
const t = (x, y, s, cls, anchor) => CH.txt(x, y, s, cls || 't-note', anchor || 'start');
const line = (x1, y1, x2, y2, a) => '    <line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2) + '" y2="' + f1(y2) + '" ' + a + '/>';
const pathD = (d, a) => '    <path d="' + d + '" ' + a + '/>';
const guide = 'stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="' + G.GUIDE + '"';
const hair = (tok) => 'stroke="var(' + (tok || '--rule-strong') + ')" stroke-width="1" fill="none"';
let HID = 0;
/* the void's hatch, one pattern per drawing (an id lives in the drawing that defines it) */
const hatch = () => { const id = 'gx-h' + (++HID);
  return { id, def: '    <defs><pattern id="' + id + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-4)" stroke-width="1"/></pattern></defs>' }; };
const voidRect = (h, x, y, w, hh) => '    <rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(hh) + '" class="w-void" fill="url(#' + h.id + ')" stroke="var(--rule-strong)" stroke-width="1"/>';
/* a verdict chip, drawn as the site draws it (design/components.js tag(): one shape per word) */
const CHIP = { held: 'fill="var(--ink)"', dep: 'fill="none" stroke="var(--rule-strong)"', open: 'fill="none" stroke="var(--ink-4)"' };
const chip = (x, y, word, kind) => { const w = 14 + word.length * 7.2;
  return '    <rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="18" rx="' + (kind === 'open' ? 4 : 2) + '" ' + CHIP[kind] + ' stroke-width="1"/>\n'
    + '    <text x="' + f1(x + w / 2) + '" y="' + f1(y + 12.5) + '" text-anchor="middle" font-size="10" class="gx-chip' + (kind === 'held' ? ' on' : '') + '">' + esc(word) + '</text>'; };
/* the grade glyph, the three bars of W.grade, at (x, y) top-left, filled to the rung */
const glyph = (x, y, g, verified) => {
  const bars = [[0, 6, 3], [5, 3, 6], [10, 0, 9]];
  const on = verified === undefined ? [g >= 0, g >= 2, g >= 3].map((v, i) => (i === 0 ? true : v)) : [verified, g >= 2, g >= 3];
  return bars.map(([bx, by, bh], i) => '    <rect x="' + f1(x + bx * 1.3) + '" y="' + f1(y + by * 1.3) + '" width="3.9" height="' + f1(bh * 1.3) + '" rx="0.6" fill="var(' + (on[i] ? '--ink' : '--ink-5') + ')"/>').join('\n');
};
const ring = (x, y, n) => '    <circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="10" fill="var(--paper)" stroke="var(--ink-3)" stroke-width="1"/>\n'
  + '    <text x="' + f1(x) + '" y="' + f1(y + 4) + '" text-anchor="middle" font-size="11" class="gx-n">' + n + '</text>';
const eb = (x, y, s, anchor) => '    <text x="' + f1(x) + '" y="' + f1(y) + '" class="gx-eb"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>';
/* SVG type sizes are presentation attributes, in the drawing's own units, so they scale with it */
const SIZE = { 'gx-big': 22, 'gx-huge': 34, 'gx-num': 24, 'gx-op': 20, 'gx-ans': 16 };
const big = (x, y, s, anchor, cls) => { const c = cls || 'gx-big';
  return '    <text x="' + f1(x) + '" y="' + f1(y) + '" class="' + c + '" font-size="' + SIZE[c] + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>'; };
/* a wave that carries no number: the shape of "a line", for the rules that are about lines in general */
const wave = (x0, x1, y, amp, ph) => { const pts = []; for (let i = 0; i <= 40; i++) { const x = x0 + (x1 - x0) * i / 40; pts.push(f1(x) + ',' + f1(y + amp * Math.sin(ph + i / 40 * Math.PI * 2))); } return pts.join(' '); };
const poly = (pts, a) => '    <polyline points="' + pts + '" ' + a + ' stroke-linejoin="round"/>';

/* a card: eyebrow, title, the drawing, a sentence, the fix line, an optional code line */
function card({ k, title, art, d, f, code, cls }) {
  return '<div class="gx-card' + (cls ? ' ' + cls : '') + '">'
    + (k ? '<div class="gx-k">' + k + '</div>' : '')
    + (title ? '<div class="gx-t">' + title + '</div>' : '')
    + (art ? '<div class="gx-art">' + art + '</div>' : '')
    + (d ? '<div class="gx-d">' + d + '</div>' : '')
    + (code ? '<div class="gx-code">' + code + '</div>' : '')
    + (f ? '<div class="gx-f">' + f + '</div>' : '')
    + '</div>';
}
const grid = (cols, cards) => '<div class="gx-grid c' + cols + '">' + cards.join('\n') + '</div>';

/* ============================================================ the marks == */
const STANDINGS = [W.DECIDED, W.COMPUTED, W.CHOSEN, W.REFUSED];
const NUM = { [W.DECIDED]: '1', [W.COMPUTED]: '2', [W.CHOSEN]: '3', [W.REFUSED]: '4' };
/* each mark's own drawing: the stroke at two widths (the patterns change below G.SMALL_BELOW px) and the mark at work */
function markArt(s) {
  const out = [];
  if (s === W.REFUSED) {
    const h = hatch(); out.push(h.def, voidRect(h, 16, 18, 268, 92), big(150, 62, '∅', 'middle', 'gx-huge'), t(150, 90, 'no stroke; the void is drawn', 't-note', 'middle'));
    return svg(300, 128, 'The refused mark: no stroke at all, a hatched void and the empty-set sign.', out.join('\n'));
  }
  out.push(line(16, 26, 284, 26, W.attrs(s, { width: 3 })), t(284, 46, '3 px', 't-ax', 'end'));
  out.push(line(16, 58, 284, 58, W.attrs(s, { width: 1.2 })), t(284, 76, '1.2 px', 't-ax', 'end'));
  /* at work: √x on [0, 4], the way the hero draws it in this standing */
  const fx = (x) => 16 + x / 4 * 268, fy = (y) => 120 - y / 2 * 34;
  if (s === W.DECIDED) out.push(pathD('M' + [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((x, i) => (i ? 'V' + f1(fy(Math.sqrt(x + 0.5))) : f1(fx(0)) + ',' + f1(fy(Math.sqrt(0.5)))) + 'H' + f1(fx(x + 0.5))).join(''), W.attrs(s, { width: 1.6 })));
  else if (s === W.COMPUTED) { const p = []; for (let i = 0; i <= 80; i++) { const x = 4 * i / 80; p.push(f1(fx(x)) + ',' + f1(fy(Math.sqrt(x)))); } out.push(poly(p.join(' '), W.attrs(s, { width: 1.6 }))); }
  else out.push(pathD('M' + [[0, 0], [0.25, 0.5], [1, 1], [2.25, 1.5], [4, 2]].map(([x, y]) => f1(fx(x)) + ',' + f1(fy(y))).join('L'), W.attrs(s, { width: 1.8 })));
  return svg(300, 128, 'The ' + W.NAME[s].toLowerCase() + ' mark: its stroke at 3 and at 1.2 pixels, and the same mark drawing the square root of x.', out.join('\n'));
}

/* the order and the meet, drawn: four strokes in the tones they take, then the three ways a path weakens */
function ladderOfStandings() {
  const cells = STANDINGS.map((s, i) => {
    const art = s === W.REFUSED
      ? (() => { const h = hatch(); return svg(200, 70, 'Refused: a hatched void, the weakest standing.', h.def + '\n' + voidRect(h, 12, 18, 176, 30)); })()
      : svg(200, 70, W.NAME[s] + ': its stroke in its tone.', line(12, 33, 188, 33, W.attrs(s, { width: 3 })));
    return '<div class="gx-step"><div class="gx-k">' + NUM[s] + ' · ' + esc(W.NAME[s].toLowerCase()) + '</div>' + art + '</div>';
  });
  const eq = (a, b, note) => {
    const m = W.meet(a, b), seg = (x, s) => (s === W.REFUSED ? '' : line(x, 30, x + 54, 30, W.attrs(s, { width: 2.4 })));
    const h = hatch(), vd = (x) => voidRect(h, x, 20, 54, 20);
    const inner = [h.def, a === W.REFUSED ? vd(8) : seg(8, a), big(80, 36, '∧', 'middle', 'gx-op'), b === W.REFUSED ? vd(98) : seg(98, b),
      big(170, 36, '=', 'middle', 'gx-op'), m === W.REFUSED ? vd(188) : seg(188, m)].join('\n');
    return '<div class="gx-eq">' + svg(250, 56, W.NAME[a] + ' meet ' + W.NAME[b] + ' is ' + W.NAME[m] + '.', inner) + '<div class="gx-d">' + note + '</div></div>';
  };
  return '<div class="gx-steps">' + cells.join('') + '</div>'
    + '<div class="gx-arrow"><span>stronger</span><span>weaker</span></div>'
    + '<div class="gx-eqs">'
    + eq(W.DECIDED, W.COMPUTED, 'A float anywhere on the path: the mark is ' + W.value('computed', W.COMPUTED) + '.')
    + eq(W.DECIDED, W.CHOSEN, 'A choice anywhere on the path: ' + W.value('chosen', W.CHOSEN) + '. A straight line between two exact knots is one of many.')
    + eq(W.COMPUTED, W.REFUSED, 'A refusal anywhere on the path: nothing is drawn, and the void says so.')
    + '</div>';
}

/* ========================================================== the rules == */
/* each rule's drawing is 300 × 140: a before and an after, or two cases, with an eyebrow over each half */
const RW = 300, RH = 140;
const halves = (l, r, alt, inner) => svg(RW, RH, alt, [eb(8, 16, l), eb(158, 16, r), line(150, 8, 150, RH - 8, hair('--rule')), inner].join('\n'));
const RULE_ART = {
  /* 1. standing is not a verdict */
  1: () => halves('before', 'after', 'Before: a number struck through to say a verdict failed. After: the number keeps its own dashed underline and the verdict is a word in a chip.', [
    big(28, 74, '0.83', 'start', 'gx-num'), line(24, 66, 104, 66, 'stroke="var(--ink-2)" stroke-width="2"'), t(8, 116, 'a verdict as a strike'),
    big(176, 70, '0.83', 'start', 'gx-num'), line(176, 78, 256, 78, W.attrs(W.COMPUTED, { width: 1.2 })), chip(176, 90, 'REFUTED', 'dep'), t(158, 130, 'a word, and its own mark')].join('\n')),
  /* 2. a pick is a member */
  2: () => halves('before', 'after', 'Before: a picked point drawn outside the box the data admit. After: the pick sits inside the box, and membership is checked exactly.', [
    '    <rect x="16" y="40" width="80" height="58" fill="var(--band-fill)" ' + W.extentAttrs(W.DECIDED, { width: 1.5 }).replace('fill="none" ', '') + '/>',
    '    <circle cx="118" cy="52" r="8" ' + W.attrs(W.CHOSEN, { width: 2.4 }) + '/>', t(8, 122, 'outside the set'),
    '    <rect x="166" y="40" width="80" height="58" fill="var(--band-fill)" ' + W.extentAttrs(W.DECIDED, { width: 1.5 }).replace('fill="none" ', '') + '/>',
    '    <circle cx="206" cy="69" r="8" ' + W.attrs(W.CHOSEN, { width: 2.4 }) + '/>', big(262, 72, '∈', 'start', 'gx-op'), t(158, 122, 'a member, checked')].join('\n')),
  /* 3. a tie is chosen */
  3: () => { const node = (x, y) => '    <circle cx="' + x + '" cy="' + y + '" r="4" fill="var(--ink-3)"/>';
    const tri = (o, a) => [line(o + 22, 78, o + 92, 44, a), line(o + 22, 78, o + 92, 112, hair('--ink-5')), node(o + 22, 78), node(o + 92, 44), node(o + 92, 112), t(o + 100, 82, '= length', 't-ax')].join('\n');
    return halves('before', 'after', 'Before: one of two equally short edges drawn solid, as if the tree were unique. After: the picked edge is dotted, one of two.', [
      tri(0, W.attrs(W.DECIDED, { width: 2 })), t(8, 132, 'drawn as if unique'),
      tri(150, W.attrs(W.CHOSEN, { width: 2.2 })), t(158, 132, 'one of two: dotted')].join('\n')); },
  /* 4. dash is for standing only */
  4: () => halves('before', 'after', 'Before: three models told apart by dash pattern. After: the same three by weight and opacity, all solid.', [
    poly(wave(12, 128, 46, 6, 0), W.attrs(W.DECIDED, { width: 1.6 })), poly(wave(12, 128, 74, 6, 1), W.attrs(W.COMPUTED, { width: 1.6 })), poly(wave(12, 128, 102, 6, 2), W.attrs(W.CHOSEN, { width: 1.8 })),
    t(8, 132, 'a dash for a model'),
    ...G.IDENTITY.map((idn, i) => poly(wave(162, 278, 46 + 28 * i, 6, i), 'fill="none" stroke="var(--ink)" stroke-width="' + idn.weight + '" stroke-opacity="' + idn.opacity + '"')),
    t(158, 132, 'weight and opacity')].join('\n')),
  /* 5. the one accent */
  5: () => halves('ink', 'witness', 'Left: a box that clears a box is a scalar comparison and is drawn in ink. Right: an object that breaks a claim made about it gets the red cross, with words.', [
    '    <rect x="18" y="34" width="40" height="70" ' + W.extentAttrs(W.DECIDED, { width: 1.5 }) + '/>', '    <rect x="74" y="56" width="52" height="48" fill="var(--band-fill)" stroke="var(--ink-4)" stroke-width="1"/>',
    t(8, 126, 'a box clears a box'),
    line(162, 96, 290, 52, W.attrs(W.DECIDED, { width: 1.8 })), W.witnessMark(226, 46, { size: 7, width: 2.8 }), t(238, 40, 'the object', 't-ax'), t(158, 126, 'an object breaks a claim')].join('\n')),
  /* 6. mood */
  6: () => svg(RW, RH, 'A verdict that holds given a chosen input names the input in italic.', [
    chip(20, 30, 'HOLDS', 'held'), '    <text x="88" y="44" class="gx-mood" font-size="16">given h = 3/50</text>',
    t(20, 78, 'the verdict holds for the input it names;'), t(20, 94, 'a hypothesis read, not machine-checked,'), t(20, 110, 'is named the same way:'),
    '    <text x="20" y="130" class="gx-mood" font-size="14">given Theorem 2 as published</text>'].join('\n')),
  /* 7. an empty set is ∅ */
  7: () => { const h = hatch(); const bars = (o) => [[0, 52], [1, 30]].map(([i, hh]) => '    <rect x="' + (o + 16 + i * 36) + '" y="' + (110 - hh) + '" width="26" height="' + hh + '" fill="var(--c-3)"/>').join('\n');
    return halves('before', 'after', 'Before: an empty set drawn as a bar of height zero with a 0. After: the slot is a hatched void with the empty-set sign.', [h.def,
      bars(0), line(88, 110, 114, 110, 'stroke="var(--ink-2)" stroke-width="2"'), t(101, 102, '0', 't-ax', 'middle'), line(10, 110, 140, 110, hair('--c-axis')), t(8, 130, 'a zero-height bar'),
      bars(150), voidRect(h, 238, 50, 26, 60), big(251, 86, '∅', 'middle', 'gx-op'), line(160, 110, 290, 110, hair('--c-axis')), t(158, 130, 'none fits: ∅ and a word')].join('\n')); },
  /* 9. a legend wherever a mark is */
  9: () => { const lines = (o) => [poly(wave(o + 10, o + 130, 40, 5, 0), W.attrs(W.DECIDED, { width: 1.6 })), poly(wave(o + 10, o + 130, 62, 5, 1.4), W.attrs(W.COMPUTED, { width: 1.6 }))].join('\n');
    return halves('before', 'after', 'Before: a figure with a solid and a dashed line and no legend. After: the same figure with its key.', [
      lines(0), t(8, 130, 'marks with no key'),
      lines(150), line(162, 92, 186, 92, W.attrs(W.DECIDED, { width: 2 })), t(192, 96, 'decided', 't-ax'), line(162, 110, 186, 110, W.attrs(W.COMPUTED, { width: 2 })), t(192, 114, 'computed', 't-ax'), t(158, 132, 'the key beside it')].join('\n')); },
  /* 10. a page copied in is never edited */
  10: () => halves('before', 'after', 'Before: a copied page edited inside its bytes. After: the copy untouched, changed only by a wrapper whose replacements each match one anchor.', [
    '    <rect x="20" y="34" width="104" height="70" ' + hair('--ink-4') + '/>', t(72, 56, 'copied bytes', 't-ax', 'middle'), t(72, 72, 'sha256 pinned', 't-ax', 'middle'),
    pathD('M44,88 l10,-6 l10,6 l10,-6 l10,6', 'fill="none" stroke="var(--ink-2)" stroke-width="1.6"'), t(8, 126, 'an edit inside the copy'),
    '    <rect x="160" y="26" width="132" height="86" rx="6" ' + hair('--rule-strong') + '/>', '    <rect x="178" y="42" width="96" height="54" ' + hair('--ink-4') + '/>',
    t(226, 64, 'copied bytes', 't-ax', 'middle'), t(226, 80, 'untouched', 't-ax', 'middle'), t(158, 126, 'changed by its wrapper')].join('\n')),
  /* 11. a number that rests on a model names its premises */
  11: (chain) => svg(RW, RH, 'A premise chain: each premise with its grade glyph, in the order the number travelled, the weakest named last.', [
    ...chain.map((c, i) => [glyph(16, 24 + i * 28, c.grade, c.verified), t(40, 34 + i * 28, c.short, 't-lab'), t(284, 34 + i * 28, W.GRADE[c.grade], 't-ax', 'end')].join('\n')),
    line(16, 24 + chain.length * 28, 284, 24 + chain.length * 28, hair('--rule')),
    t(16, 42 + chain.length * 28, 'the weakest: ' + W.GRADE[Math.min(...chain.map((c) => c.grade))], 't-lab')].join('\n')),
  /* 12. calibrate first */
  12: (sw) => svg(RW, RH, 'Two steps: first reproduce the published comparison, then compare on the current tables, with the numbers the record holds.', [
    '    <rect x="12" y="28" width="122" height="78" rx="6" ' + hair('--rule-strong') + '/>', eb(22, 46, '1 · reproduce'), t(22, 66, 'the published', 't-lab'), t(22, 82, 'comparison: same', 't-lab'), t(22, 98, 'probes, same tables', 't-lab'),
    line(138, 67, 160, 67, 'stroke="var(--ink-3)" stroke-width="1.5"'), pathD('M156,62 L162,67 L156,72', 'fill="none" stroke="var(--ink-3)" stroke-width="1.5"'),
    '    <rect x="166" y="28" width="122" height="78" rx="6" ' + hair('--rule-strong') + '/>', eb(176, 46, '2 · then compare'), t(176, 66, 'N ' + sw.n, 't-lab'), t(176, 82, 'r ' + sw.r, 't-lab'), t(176, 98, 'bias ' + sw.bias + ' m', 't-lab'),
    t(12, 128, 'a comparison is trusted once it reproduces')].join('\n')),
  /* 13. the halo */
  13: () => { const band = (x, halo) => (halo ? '    <rect class="gr-halo" filter="url(#gx-blur)" x="' + x + '" y="50" width="116" height="34"/>\n' : '')
      + '    <rect x="' + x + '" y="50" width="116" height="34" fill="var(--band-fill)"/>\n' + line(x, 50, x + 116, 50, W.attrs(W.DECIDED, { width: 1.5 })) + '\n' + line(x, 84, x + 116, 84, W.attrs(W.DECIDED, { width: 1.5 }));
    return halves('validated here', 'carried here', 'Left: a band validated where it is drawn, crisp edges and no halo. Right: the same band carried by a model not validated there keeps its edges and gains a blur outside them.', [
      '    <defs><filter id="gx-blur" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>',
      band(16, false), t(8, 124, 'crisp edges'), band(166, true), t(158, 124, 'edges, and a halo')].join('\n')); },
  /* 14. a forecast line is computed, on canvas too */
  14: () => halves('before', 'after', 'Before: a forecast drawn solid. After: the same forecast dashed, on a canvas with setLineDash from the same patterns.', [
    poly(wave(12, 138, 70, 14, 0.4), 'fill="none" stroke="var(--ink)" stroke-width="1.8"'), t(8, 126, 'a forecast, solid'),
    poly(wave(162, 288, 70, 14, 0.4), W.attrs(W.COMPUTED, { width: 1.8 })), t(158, 126, 'dashed: setLineDash([5, 4])')].join('\n')),
  /* 15. a field drawn from a model is a picture of the model */
  15: () => svg(RW, RH, 'Wave crests drawn from a model, with a legend line saying they are a picture of the model.', [
    ...[0, 1, 2, 3].map((i) => poly(wave(20, 280, 30 + i * 18, 4, i * 0.9), 'fill="none" stroke="var(--ink-3)" stroke-width="1.2"')),
    line(20, 112, 44, 112, 'stroke="var(--ink-3)" stroke-width="1.2"'), t(52, 116, 'crests · a picture of the island model', 't-ax'), t(20, 134, 'said once, in the legend')].join('\n')),
  /* 16. where the model reads low, "under the limit" is flagged */
  16: (low) => svg(RW, RH, 'A decided "under the limit" at a beach where the model reads low carries a flag naming the comparison.', [
    chip(16, 28, 'UNDER THE LIMIT', 'held'), t(16, 70, 'exact, given the band that reaches the beach', 't-lab'),
    pathD('M18,88 V108 M18,88 H30 L27,93 L30,98 H18', 'fill="none" stroke="var(--ink-2)" stroke-width="1.4"'),
    t(38, 100, 'the model reads low here (' + low + ')', 't-lab'), t(16, 128, 'a flag, never a refusal')].join('\n')),
  /* the two rulings of 28 October */
  layout: () => { const P = [[40, 46], [70, 34], [64, 70], [96, 58], [210, 40], [236, 66], [260, 44], [228, 96]];
    const E = [[0, 1], [1, 2], [0, 2], [2, 3], [4, 5], [5, 6], [5, 7]];
    return svg(RW, RH, 'A map placed by a float solver: the edges that exist are solid, the ring around a group is dotted, and the layout as a whole is said to be a chosen picture.', [
      ...E.map(([a, b]) => line(P[a][0], P[a][1], P[b][0], P[b][1], W.attrs(W.DECIDED, { width: 1.4 }))),
      ...P.map(([x, y]) => '    <circle cx="' + x + '" cy="' + y + '" r="4" fill="var(--ink-2)"/>'),
      '    <ellipse cx="235" cy="62" rx="44" ry="42" ' + W.attrs(W.CHOSEN, { width: 1.6 }) + '/>',
      t(12, 126, 'edges solid; the ring and the layout chosen')].join('\n')); },
  answer: () => svg(RW, RH, 'A model\'s answer flows into a figure on a dashed wire and prints with a dashed underline: a claim someone made.', [
    '    <rect x="16" y="40" width="96" height="44" rx="6" ' + hair('--rule-strong') + '/>', t(64, 66, 'a model', 't-lab', 'middle'),
    line(112, 62, 196, 62, W.attrs(W.COMPUTED, { width: 1.8 })),
    big(206, 68, 'answer', 'start', 'gx-ans'), line(206, 74, 270, 74, W.attrs(W.COMPUTED, { width: 1.2 })),
    t(16, 126, 'computed, like a number someone printed')].join('\n')),
};
/* rule 8, outward, on the hero's own enclosure: the top of the step [1, 3/2] is hi exactly; cut to d digits it moves
   inside the record, rounded up it stays outside. Every position is passed in, exactly computed by the builder. */
RULE_ART[8] = ({ hi, hiStr, cut, up }) => {
  const lo = hi - 0.012, span = 0.024, x = (v) => 20 + (v - lo) / span * 260;
  const axis = line(20, 92, 280, 92, hair('--c-axis'));
  return svg(RW, RH, 'A number line near the top of a decided step: the exact upper end, the bound printed by cutting digits, which falls inside the record, and the bound rounded outward, which does not.', [
    axis, line(x(hi), 40, x(hi), 100, W.attrs(W.DECIDED, { width: 2 })), t(x(hi), 32, 'the record: √x ≤ ' + hiStr, 't-lab', 'middle'),
    line(x(cut), 70, x(cut), 100, 'stroke="var(--ink-2)" stroke-width="1.6"'), t(x(cut) - 4, 116, String(cut) + ': cut, inside', 't-ax', 'end'),
    line(x(up), 70, x(up), 100, 'stroke="var(--ink)" stroke-width="2.4"'), t(x(up) + 4, 116, String(up) + ': outward', 't-ax', 'start'),
    t(20, 134, 'a printed upper end rounds up, never down')].join('\n'));
};

/* ========================================================= the colours == */
/* a swatch with its token, its lightness and a word, drawn as the figure kit draws: a fill from a token, a hairline */
function inkRamp({ ramp, tones }) {
  /* ramp: [{ tok, L }]; tones: { decided: tok, computed: tok, chosen: tok } */
  const w = 340, cw = (w - 24) / ramp.length;
  const out = ramp.map((r, i) => {
    const x = 12 + i * cw;
    return '    <rect x="' + f1(x) + '" y="20" width="' + f1(cw - 6) + '" height="44" rx="4" fill="var(' + r.tok + ')"/>\n'
      + t(x, 82, r.tok, 't-ax') + '\n' + t(x, 98, 'L ' + r.L.toFixed(2), 't-ax');
  });
  const at = (tok) => ramp.findIndex((r) => r.tok === tok);
  const lab = Object.entries(tones).map(([k, tok], j) => { const i = at(tok), x = 12 + i * cw + (cw - 6) / 2;
    return line(x, 106, x, 116 + j * 0, 'stroke="var(--ink-4)" stroke-width="1"') + '\n' + t(x, 130, k, 't-lab', 'middle'); });
  return svg(w, 140, 'The ink ramp: five greys from brightest to darkest with their OKLab lightness; decided strokes take the brightest, computed the next, chosen the third, so lightness falls with standing.', out.concat(lab).join('\n'));
}
/* the four kinds of colour, each on a shape with a word */
function kindsOfColour({ contrast, identity, order, status }) {
  const wit = svg(220, 120, 'The witness: one red cross, on an object, with words.', [W.witnessMark(56, 56, { size: 18, width: 5 }), t(96, 52, '--witness', 't-lab'), t(96, 70, contrast.toFixed(1) + ':1 on the ground', 't-ax')].join('\n'));
  const shapes = ['circle', 'rect', 'tri'];
  const shp = (k, x, y, v) => (k === 'circle' ? '    <circle cx="' + x + '" cy="' + y + '" r="9" fill="var(' + v + ')"/>'
    : k === 'rect' ? '    <rect x="' + (x - 8) + '" y="' + (y - 8) + '" width="16" height="16" fill="var(' + v + ')"/>'
      : '    <path d="M' + x + ',' + (y - 10) + ' L' + (x + 10) + ',' + (y + 8) + ' L' + (x - 10) + ',' + (y + 8) + ' Z" fill="var(' + v + ')"/>');
  const idn = svg(220, 120, 'Identity: at most three hues, each with its own shape and a word.', identity.map((c, i) => shp(shapes[i], 22, 30 + i * 30, c.v) + '\n' + t(42, 34 + i * 30, c.word, 't-ax')).join('\n'));
  const ord = svg(220, 120, 'Order: one hue in lightness steps, each step with its word.', order.map((c, i) => '    <rect x="' + (12 + i * 66) + '" y="26" width="60" height="40" rx="3" fill="var(' + c.v + ')"/>\n' + t(12 + i * 66, 86, c.word, 't-ax')).join('\n'));
  const st = svg(220, 120, 'Status: an app\'s decided state, always with an icon and a word.', status.map((c, i) => {
    const y = 18 + i * 32;
    return '    <rect x="12" y="' + y + '" width="196" height="24" rx="4" fill="none" stroke="var(' + c.v + ')" stroke-width="1.2"/>\n'
      + '    <text x="26" y="' + (y + 16.5) + '" class="gx-ic" font-size="14" fill="var(' + c.v + ')">' + c.icon + '</text>\n' + t(46, y + 16.5, c.word, 't-lab');
  }).join('\n'));
  return grid(4, [
    card({ k: 'the witness', art: wit, d: 'One red, for a shown counterexample and nothing else.' }),
    card({ k: 'identity', art: idn, d: 'At most three hues for the series in one figure, each with its own shape.' }),
    card({ k: 'order', art: ord, d: 'One hue in lightness steps, for an ordered scale.' }),
    card({ k: 'status', art: st, d: 'An app’s decided states, always with an icon and a word.' }),
  ]);
}
/* the validator, before and after: a pair as everyone sees it and as a deuteranope does (Machado 2009), with ΔE */
function validatorPlate({ before, after, threshold }) {
  const row = (y, label, p, key) => [t(12, y + 22, label, 't-ax'),
    '    <rect x="118" y="' + y + '" width="44" height="32" rx="3" fill="var(' + p[key][0] + ')"/>',
    '    <rect x="164" y="' + y + '" width="44" height="32" rx="3" fill="var(' + p[key][1] + ')"/>',
    t(222, y + 22, 'ΔE ' + p.dE[key].toFixed(1) + (p.dE[key] < threshold ? '  below ' + threshold : ''), p.dE[key] < threshold ? 't-lab' : 't-ax')].join('\n');
  const panel = (p, title, alt) => svg(340, 130, alt, [eb(12, 18, title), row(32, 'as most see it', p, 'normal'), row(76, 'as a deuteranope', p, 'deutan'), t(12, 126, p.words, 't-note')].join('\n'));
  return grid(2, [
    card({ k: 'before', art: panel(before, 'two series, one figure', 'Before: two series colours, distinct to most readers, the same colour to a deuteranope.'), d: before.d }),
    card({ k: 'after', art: panel(after, 'the same two, re-stepped', 'After: the re-stepped pair, distinct for both.'), d: after.d }),
  ]);
}

/* ========================================================= the ladder == */
function premiseLadder(items) {
  /* four rungs, strongest at the top; each premise of a chain sits on the rung it reached */
  const rungs = [W.VALIDATED, W.COMPARED, W.VERIFIED, W.ASSUMED];
  const out = [];
  rungs.forEach((g, i) => {
    const y = 20 + i * 44;
    out.push('    <rect x="12" y="' + y + '" width="' + (220 - i * 40) + '" height="34" rx="4" fill="var(--surface2)" stroke="var(--rule)" stroke-width="1"/>');
    out.push(glyph(22, y + 11, g, g === W.VERIFIED ? true : undefined));
    out.push(t(46, y + 22, W.GRADE[g], 't-lab'));
    const here = items.filter((it) => it.grade === g);
    here.forEach((it, j) => out.push(t(250, y + 22 + j * 14, '← ' + it.short, 't-ax')));
  });
  return svg(520, 200, 'The premise ladder: four rungs from validated at the top to assumed at the bottom; each premise behind a wave limit on Swell sits on the rung its checking reached.', out.join('\n'));
}

/* ========================================================= the issues == */
/* before and after as two bars per measure, each row on its own scale; every value a count */
function pairsArt(rows, alt) {
  const w = 300, rh = 58, h = 10 + rows.length * rh;
  const o = [];
  rows.forEach((r, i) => {
    const y = 10 + i * rh, L = 58, R = w - 64, mx = Math.max(r.then, r.now, 1), x = (v) => L + v / mx * (R - L);
    o.push(t(0, y + 10, r.k, 't-ax'));
    for (const [j, v, word, op] of [[0, r.then, 'before', 0.38], [1, r.now, 'now', 1]]) {
      const yy = y + 18 + j * 18;
      o.push(t(L - 8, yy + 10, word, 't-ax', 'end'));
      if (v > 0) o.push('    <rect x="' + L + '" y="' + yy + '" width="' + f1(x(v) - L) + '" height="12" fill="var(--ink)" fill-opacity="' + op + '"/>' + '\n' + t(x(v) + 6, yy + 10, Number(v).toLocaleString('en-US'), 't-ax'));
      else o.push(t(L, yy + 10, '0', 't-ax'));
    }
  });
  return svg(w, h, alt, o.join('\n'));
}
/* the stroke tones before and after the order was fixed */
function tonesArt(TB, TA) {
  const col = (x, title, tones, cls) => ['    <g class="' + cls + '">', eb(x, 16, title),
    ...tones.map((r, i) => line(x, 36 + i * 26, x + 40, 36 + i * 26, W.attrs(r.s, { width: 2.4 })) + '\n' + t(x + 48, 40 + i * 26, r.k + ' ' + r.L.toFixed(2).replace(/^0/, ''), 't-ax')), '    </g>'].join('\n');
  return svg(300, 116, 'The three standing strokes in the tones they had before the fix and the tones they have now: before, chosen read brighter than computed; now lightness falls with standing.',
    [col(0, 'before', TB, 'gx-before'), col(154, 'now', TA, 'gx-now'), line(150, 8, 150, 108, hair('--rule'))].join('\n'));
}
/* the outward fix in pixels: the top of one step, magnified, in the specimen's own pixel rows */
function outwardArt({ rowExact, rowOld, rowNew, labels, r0, r1 }) {
  const top = 26, hh = 70, zy = (r) => top + (r - r0) / (r1 - r0) * hh;
  const ln = (r, a) => line(12, zy(r), 130, zy(r), a);
  return svg(300, 126, 'The top of one step of the decided staircase, magnified: the record\'s edge, the edge drawn before the fix just inside it, and the edge drawn now just outside it.', [
    ln(rowNew, W.attrs(W.DECIDED, { width: 2 })), t(138, zy(rowNew) + 4, labels.now, 't-ax'),
    ln(rowExact, 'stroke="var(--ink-3)" stroke-width="1"'), t(138, zy(rowExact) + 4, labels.exact, 't-ax'),
    ln(rowOld, W.attrs(W.COMPUTED, { width: 2 })), t(138, zy(rowOld) + 4, labels.old, 't-ax'),
    t(12, 118, labels.foot)].join('\n'));
}
/* the ink each pattern lays down, against stroke width */
function inkArt({ inkC, inkP, small, legendW }) {
  const o = { w: 300, h: 150, padL: 34, padR: 10, padT: 12, padB: 34, x0: 0.5, x1: 3, y0: 0.3, y1: 0.75 };
  const f = CH.frame(o);
  const ln = (g, sw) => { const a = [], b = []; for (let i = 0; i <= 120; i++) { const w = 0.5 + 2.5 * i / 120; (w < small ? a : b).push(f1(f.px(w)) + ',' + f1(f.py(g(w)))); }
    return [a, b].map((seg) => poly(seg.join(' '), 'fill="none" stroke="var(--ink)" stroke-width="' + sw + '"')).join('\n'); };
  return svg(o.w, o.h, 'The fraction of its length each pattern inks, against stroke width: the dashed line is flat, the dotted line rises with width and crosses above it.', [
    CH.axes(f, { yTicks: [0.4, 0.6].map((v) => ({ v, t: v.toFixed(1) })), xTicks: [1, 2, 3].map((v) => ({ v, t: v + ' px' })) }),
    ln(inkC, 1.2), ln(inkP, 2.4), line(f.px(legendW), f.T, f.px(legendW), f.T + f.ph, guide),
    t(f.px(legendW) + 4, f.T + 10, 'the legend', 't-ax'), t(f.px(2.05), f.py(inkP(2.05)) - 8, 'dotted', 't-ax', 'end'), t(f.px(2.05), f.py(inkC(2.05)) + 16, 'dashed', 't-ax', 'end')].join('\n'));
}
/* a first tile, then and now */
function tileArt(then, now) {
  const tile = (x, title, words) => ['    <rect x="' + x + '" y="24" width="138" height="78" rx="4" fill="var(--sunk)" stroke="var(--rule)" stroke-width="1"/>', eb(x + 10, 42, title),
    ...words.map((s, i) => t(x + 10, 62 + i * 15, s, i ? 't-ax' : 't-lab'))].join('\n');
  return svg(300, 116, 'The first tile of a report, before and after: before it said CERTIFIED where the page did not decide the headline claim; now it says not decided here.', [eb(0, 14, 'before'), eb(154, 14, 'now'), tile(0, then.k, then.lines), tile(154, now.k, now.lines)].join('\n'));
}

/* ======================================================= the dash census == */
function censusArt({ uses, labels }) {
  const ks = Object.keys(uses), mx = Math.max(...ks.map((k) => uses[k]));
  const o = ks.map((k, i) => { const y = 14 + i * 30, w = 120 * uses[k] / mx;
    return line(12, y + 8, 60, y + 8, k === G.GUIDE ? guide : (k === G.CLAIM || k === G.CLAIM_SM ? W.attrs(W.COMPUTED, { width: k === G.CLAIM ? 2 : 1.2 }) : W.attrs(W.CHOSEN, { width: k === G.PICK ? 2.2 : 1.2 })))
      + '\n' + t(70, y + 12, k, 't-ax') + '\n' + '    <rect x="112" y="' + (y + 2) + '" width="' + f1(Math.max(1, w)) + '" height="12" fill="var(--ink)" fill-opacity="0.75"/>'
      + '\n' + t(118 + w, y + 12, uses[k].toLocaleString('en-US') + ' · ' + labels[k], 't-ax');
  });
  return svg(400, 14 + ks.length * 30, 'The dash census: how many times each of the five permitted patterns appears on the built site.', o.join('\n'));
}

module.exports = { card, grid, markArt, ladderOfStandings, RULE_ART, inkRamp, kindsOfColour, validatorPlate, premiseLadder,
  pairsArt, tonesArt, outwardArt, inkArt, tileArt, censusArt, glyph, hatch, voidRect, ring, svg, t, line, eb, big, chip };
