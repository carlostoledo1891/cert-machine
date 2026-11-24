#!/usr/bin/env node
/* build-r310-live.js — site/r310/index.html: R(3,10), in the open. Research and its verification on one page, while it happens.

   R(3,10) is 40 or 41 and nothing here decides which. The page shows the process: the whole (3,10;40) question as a
   map of cases with who closed each (the hero), the boxes (two opened: Theorem C35 and a second computation of Case
   R(7); one sealed: a case worked on now), a replay of one recorded run, every error caught on the way, and the
   machine at work. Rigor is one click down, in "Why you can trust this": every record, every hash, every rule.

   EVERY NUMBER AND EVERY SENTENCE OF STATE IS READ from corpus/r310-live/ (written from the lane's files by
   tools/r310-live-records.js, which refuses when a source no longer says what a record states). This builder reads
   nothing else, and refuses when the records disagree with each other, when the newest page-log entry is not the
   records' state, or when the sealed box would show more than its name, its anchors and its progress.

   THE SEALED BOX shows its name, its three Bitcoin anchors and a percentage rounded down, and nothing else. Its
   corrections are one line each. The box's name is the only place its case number appears on the page, and the
   builder counts that.

   OPENED_UTC is the one switch the control room sets at launch: the time the two boxes open (the publication). While
   it is unset the build refuses, unless FOR_PREVIEW=1, which builds a preview saying "opening: at publication" and
   "published at launch". The page's text follows the reveal's source of truth (REVEAL-v2, 23 Nov).

   Unlisted: linked from no page, in no sitemap; the sync keeps its folder (tools/build-site.js) and does not write it.
   A marketing page in design/marketing.js's sense: no record line, hash or stop sentence on the surface.

   usage: node tools/build-r310-live.js, then `make page` (the sync and the page gates)                          MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const RS = require(path.join(ROOT, 'design', 'reasons.js'));
const MKT = require(path.join(ROOT, 'design', 'marketing.js'));
const OUTDIR = path.join(ROOT, 'site', 'r310');
const die = (m) => { console.error('R310 PAGE REFUSED: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const esc = C.esc, ea = C.escAttr;
const DIR = 'corpus/r310-live/';
const J = (f) => { const p = path.join(ROOT, DIR + f); need(fs.existsSync(p), 'a record is gone: ' + DIR + f); return JSON.parse(fs.readFileSync(p, 'utf8')); };
const sha12 = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 12);
const CASES = J('cases.json'), BX = J('boxes.json'), K = J('corrections.json'), M = J('machine.json'), RP = J('replay.json'), PL = J('page-log.json');
/* THE LAUNCH SWITCH: set to the publication time ('2026-11-23T12:00Z' form) by the control room, at launch */
const OPENED_UTC = '2026-11-23T05:48Z';
const PREVIEW = process.env.FOR_PREVIEW === '1';
need(OPENED_UTC !== null || PREVIEW, 'OPENED_UTC is unset: the control room sets it at launch (the publication time); FOR_PREVIEW=1 builds a preview');
need(OPENED_UTC === null || /^\d{4}-\d\d-\d\dT\d\d:\d\dZ$/.test(OPENED_UTC), 'OPENED_UTC is not a UTC time like 2026-11-23T12:00Z');
const RECORD_URL = 'https://github.com/carlostoledo1891/cert-machine/tree/main/corpus/r310-c35-r7';

/* ---------------------------------------------------------------- values, from their records */
const V = (file, ptr, standing = W.DECIDED, fmt = 'int') => W.val({ rec: { path: DIR + file, ptr }, standing, fmt });
const N = (x) => Number(x).toLocaleString('en-US');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const utc = (iso, withDay = true) => { const d = new Date(iso); const hm = String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
  return withDay ? d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ', ' + hm + ' UTC' : hm + ' UTC'; };
const utcs = (iso) => { const d = new Date(iso); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ', ' + d.toISOString().slice(11, 19) + ' UTC'; };

/* ---------------------------------------------------------------- the records agree with each other */
const B1 = BX.boxes.find((b) => b.id === 'c35'), B2 = BX.boxes.find((b) => b.id === 'r7'), B3 = BX.boxes.find((b) => b.id === 'c6');
need(B1 && B2 && B3 && BX.boxes.length === 3, 'the boxes record does not hold the three boxes');
need(B1.state === 'opened' && B2.state === 'opened' && B3.state === 'sealed', 'a box’s state is not the one the page draws');
const LABEL6 = B3.label;
need(LABEL6 === 'Case R(6): codegree six', 'the sealed box is not named as Chen’s report names its case');
need(Object.keys(B3).sort().join(',') === 'as_of,id,label,n,open_discrepancies,progress_percent,stamps,state', 'the sealed box’s record holds more than its name, its anchors and its progress');
need(Number.isInteger(B3.progress_percent) && B3.progress_percent >= 0 && B3.progress_percent <= 100, 'the sealed box’s progress is not a whole percent');
need(B3.stamps.length >= 3 && B3.stamps.every((s, i) => i === 0 || s.at > B3.stamps[i - 1].at) && B3.stamps.every((s) => Number.isInteger(s.block)), 'the sealed box’s anchors are not three or more blocks in time order');
const lv = B2.by_level, rl = RP.by_level;
need(lv.level3 === rl.level3 && lv.level4 === rl.level4 && lv.full === rl.full, 'the replay’s levels are not box 2’s');
need(lv.level3 + lv.level4 + lv.full === B2.configurations, 'box 2’s levels do not sum to its configurations');
need(RP.cores.reduce((s, c) => s + c.configurations, 0) === B2.configurations, 'the replay’s cores do not sum to box 2’s configurations');
need(RP.frames.refuted[RP.frames.n].join(',') === RP.cores.map((c) => c.configurations).join(','), 'the replay does not end with every configuration refuted');
const NODES = CASES.nodes, byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
need(byId.r7.box === 2 && byId.c35.box === 1 && byId.c6.box === 3 && byId.c6.state === 'sealed', 'the map’s boxes are not the boxes record’s');
need(byId.c6.label === LABEL6, 'the map names the sealed case otherwise than its box');
need(K.counts.all === K.rows.length && K.counts.sealed === K.rows.filter((r) => r.where === 'sealed').length, 'the corrections’ counts are not their rows’');
need(B3.open_discrepancies === K.rows.filter((r) => r.where === 'sealed' && r.status === 'open').length, 'the sealed box’s open discrepancies are not the ledger’s open sealed rows');
need(K.rows.filter((r) => r.where === 'sealed').every((r) => r.line_sha256_16 && !/R\(6\)/.test(r.what + r.how + r.outcome)), 'a sealed correction says more than one line');
/* the public change log: the newest entry states the state the page shows */
const LOGE = PL.entries, NEWEST = LOGE[LOGE.length - 1];
need(NEWEST && NEWEST.progress_percent === B3.progress_percent && NEWEST.corrections === K.counts.all,
  'the newest page-log entry says ' + (NEWEST ? NEWEST.progress_percent + '% and ' + NEWEST.corrections + ' corrections' : 'nothing') + ', the records ' + B3.progress_percent + '% and ' + K.counts.all
  + ': add a dated entry with node tools/r310-live-records.js --log "…"');
need(MKT.isMarketing('r310/index.html'), 'the page is not on design/marketing.js’s list: its figures would print hashes on the surface');

/* ---------------------------------------------------------------- glyphs: state by shape and word, never by colour */
const STATE_WORD = { decided: 'decided', sealed: 'running, sealed', open: 'open', refused: 'refused' };
function glyph(state, x, y, r = 5.5) {
  if (state === 'decided') return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="var(--ink)"/>';
  if (state === 'open') return '<circle cx="' + x + '" cy="' + y + '" r="' + (r - 0.6) + '" fill="none" stroke="var(--ink-3)" stroke-width="1.4"/>';
  if (state === 'sealed') return lock(x, y, r * 1.9);
  return '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" class="t-note">∅</text>';
}
function lock(x, y, s) {   /* a padlock, closed: the sealed box */
  const w = s, h = s * 0.72, top = y - h * 0.15;
  return '<path d="M' + (x - w * 0.27).toFixed(1) + ' ' + top.toFixed(1) + ' v' + (-h * 0.42).toFixed(1) + ' a' + (w * 0.27).toFixed(1) + ' ' + (w * 0.27).toFixed(1) + ' 0 0 1 ' + (w * 0.54).toFixed(1) + ' 0 v' + (h * 0.42).toFixed(1)
    + '" fill="none" stroke="var(--ink)" stroke-width="1.5"/><rect x="' + (x - w / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="1.5" fill="var(--ink)"/>';
}
function lockOpen(x, y, s) {   /* the same padlock with its shackle up: an opened box */
  const w = s, h = s * 0.72, top = y - h * 0.15;
  return '<path d="M' + (x + w * 0.27).toFixed(1) + ' ' + (top - h * 0.2).toFixed(1) + ' v' + (-h * 0.42).toFixed(1) + ' a' + (w * 0.27).toFixed(1) + ' ' + (w * 0.27).toFixed(1) + ' 0 0 1 ' + (w * 0.54).toFixed(1) + ' 0 v' + (h * 0.22).toFixed(1)
    + '" fill="none" stroke="var(--ink)" stroke-width="1.5"/><rect x="' + (x - w / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="1.5" fill="none" stroke="var(--ink)" stroke-width="1.5"/>';
}
const ICON = (inner, w = 22, h = 18, vb = '0 0 22 18') => '<svg class="ic" viewBox="' + vb + '" width="' + w + '" height="' + h + '" aria-hidden="true">' + inner + '</svg>';
const ICON_STATE = (st) => ICON(glyph(st, 11, 10, 5), 22, 18);

/* ---------------------------------------------------------------- HERO: the case map */
const kids = (id) => NODES.filter((n) => n.parent === id);
const depth = (n) => (n.parent ? 1 + depth(byId[n.parent]) : 0);
function layoutWide() {
  const COLX = [14, 240, 490, 724], COLW = [204, 222, 214, 262], H = 54, PITCH = 68, TOP = 40, GAP = 34;
  const leaves = [], dfs = (n) => { const k = kids(n.id); if (!k.length) leaves.push(n.id); k.forEach(dfs); };
  dfs(byId.root);
  const pos = {};
  leaves.forEach((id, i) => { const n = byId[id], d = depth(n); pos[id] = { x: COLX[d], w: COLW[d], y: TOP + i * PITCH + (n.route ? GAP : 0), h: H }; });
  const place = (n) => { const k = kids(n.id); if (!k.length) return; k.forEach(place); const d = depth(n);
    const ys = k.filter((c) => !c.route).map((c) => pos[c.id].y), y = (Math.min(...ys) + Math.max(...ys)) / 2; pos[n.id] = { x: COLX[d], w: COLW[d], y, h: H }; };
  place(byId.root);
  const h = Math.max(...Object.values(pos).map((p) => p.y + p.h)) + 34;
  return { pos, w: 1000, h, routeY: Math.min(...NODES.filter((n) => n.route).map((n) => pos[n.id].y)) - GAP / 2 - 4 };
}
function layoutNarrow() {
  const pos = {}, H = 50, PITCH = 58, TOP = 12, GAP = 30;
  let row = 0, extra = 0;
  const dfs = (n) => { if (n.route && !extra) extra = GAP; const d = depth(n), x = 8 + d * 18; pos[n.id] = { x, w: 352 - x, y: TOP + row * PITCH + extra, h: H }; row++; kids(n.id).forEach(dfs); };
  dfs(byId.root);
  const h = Math.max(...Object.values(pos).map((p) => p.y + p.h)) + 12;
  return { pos, w: 360, h, routeY: Math.min(...NODES.filter((n) => n.route).map((n) => pos[n.id].y)) - GAP / 2 - 2 };
}
/* the zoom target of a case: its own subtree, or its parent's for a leaf, widened to the drawing's aspect so the
   figure never changes height */
function zoomBox(L, id) {
  const n = byId[id];
  const root = kids(id).length ? n : (n.parent ? byId[n.parent] : n);
  if (root.id === 'root') return '0 0 ' + L.w + ' ' + L.h;
  const ids = [], walk = (m) => { ids.push(m.id); kids(m.id).forEach(walk); };
  walk(root);
  let x0 = Math.min(...ids.map((i) => L.pos[i].x)) - 12, x1 = Math.max(...ids.map((i) => L.pos[i].x + L.pos[i].w)) + 12;
  let y0 = Math.min(...ids.map((i) => L.pos[i].y)) - 14, y1 = Math.max(...ids.map((i) => L.pos[i].y + L.pos[i].h)) + 14;
  const ar = L.w / L.h;
  let w = x1 - x0, h = y1 - y0;
  if (w / h > ar) { const nh = w / ar; y0 -= (nh - h) / 2; h = nh; } else { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; }
  return [x0, y0, w, h].map((v) => v.toFixed(1)).join(' ');
}
function mapSvg(L, narrow) {
  const o = ['<svg viewBox="0 0 ' + L.w + ' ' + L.h + '" role="img" class="cm-svg" data-base="0 0 ' + L.w + ' ' + L.h + '" aria-label="' + ea('The (3,10;40) question as a tree of ' + NODES.length
    + ' cases. Each box is a case with its state: a filled dot decided, a closed padlock running under seal, a hollow dot open. Select a case to zoom to it and read who decided it.') + '">'];
  /* edges: structure, drawn first */
  for (const n of NODES) {
    if (!n.parent) continue;
    const a = L.pos[n.parent], b = L.pos[n.id];
    let d;
    if (!narrow) { const x0 = a.x + a.w, y0 = a.y + a.h / 2, x1 = b.x, y1 = b.y + b.h / 2, xm = x0 + 14; d = 'M' + x0 + ' ' + y0.toFixed(1) + ' H' + xm + ' V' + y1.toFixed(1) + ' H' + x1; }
    else { const x0 = a.x + 9, y0 = a.y + a.h, x1 = b.x, y1 = b.y + b.h / 2; d = 'M' + x0 + ' ' + y0 + ' V' + y1.toFixed(1) + ' H' + x1; }
    o.push('<path class="cm-e" d="' + d + '" fill="none" stroke="var(--rule-strong)" stroke-width="1.2"/>');
  }
  /* the line that sets the other routes apart from the cover */
  o.push('<line x1="' + (narrow ? 8 : 236) + '" y1="' + L.routeY.toFixed(1) + '" x2="' + (L.w - 8) + '" y2="' + L.routeY.toFixed(1) + '" stroke="var(--rule)" stroke-width="1"/>');
  o.push('<text x="' + (L.w - 10) + '" y="' + (L.routeY - 6).toFixed(1) + '" text-anchor="end" class="t-note">other routes, beside the cover</text>');
  for (const n of NODES) {
    const p = L.pos[n.id], st = n.state;
    const z = zoomBox(L, n.id);
    o.push('<g class="cm-n cm-' + st + '" data-id="' + n.id + '" data-z="' + z + '" tabindex="0" role="button" aria-label="' + ea(n.label + ': ' + STATE_WORD[st]) + '">');
    if (st === 'sealed') {
      o.push('<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="6" fill="var(--sunk)" stroke="var(--ink)" stroke-width="2"/>');
      o.push('<rect x="' + (p.x + 4) + '" y="' + (p.y + 4) + '" width="' + (p.w - 8) + '" height="' + (p.h - 8) + '" rx="3" fill="none" stroke="var(--ink-4)" stroke-width="1"/>');
    } else if (st === 'decided') o.push('<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="6" fill="var(--surface2)" stroke="var(--ink-3)" stroke-width="1.2"/>');
    else o.push('<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="6" fill="var(--sunk)" stroke="var(--ink-4)" stroke-width="1"/>');
    o.push(glyph(st, p.x + 15, p.y + 19));
    o.push('<text x="' + (p.x + 30) + '" y="' + (p.y + 23) + '" class="t-lab' + (st === 'open' ? ' cm-dim' : '') + '">' + esc(n.map[0]) + '</text>');
    if (st === 'sealed') {
      const bx = p.x + 30, bw = Math.min(110, p.w - 92), by = p.y + 36;
      o.push('<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="6" rx="3" fill="var(--mark)"/>');
      o.push('<rect x="' + bx + '" y="' + by + '" width="' + (bw * B3.progress_percent / 100).toFixed(1) + '" height="6" rx="3" fill="var(--ink)"/>');
      o.push('<text x="' + (bx + bw + 8) + '" y="' + (by + 6.5) + '" class="t-note">' + B3.progress_percent + (B3.progress_percent === 100 ? '% · finished' : '% · running') + '</text>');
    } else o.push('<text x="' + (p.x + 30) + '" y="' + (p.y + 41) + '" class="t-note">' + esc(n.map[1]) + '</text>');
    /* a box's number as a tab on the case's top edge, in the gap above it */
    if (n.box) o.push('<rect x="' + (p.x + p.w - 52) + '" y="' + (p.y - 8) + '" width="42" height="15" rx="7.5" fill="var(--sunk)" stroke="var(--ink-3)" stroke-width="1"/>'
      + '<text x="' + (p.x + p.w - 31) + '" y="' + (p.y + 3) + '" text-anchor="middle" class="t-note">box ' + n.box + '</text>');
    o.push('</g>');
  }
  o.push('</svg>');
  return o.join('\n');
}
const LW = layoutWide(), LN = layoutNarrow();
for (const L of [LW, LN]) for (const n of NODES) {
  const p = L.pos[n.id];
  need(p && p.x >= 0 && p.x + p.w <= L.w && p.y >= 0 && p.y + p.h <= L.h, 'case ' + n.id + ' falls outside the map');
  need(30 + n.map[0].length * 0.62 * 13 <= p.w, 'the map label of ' + n.id + ' is wider than its box');
  need(n.state === 'sealed' || 30 + n.map[1].length * 0.62 * 11.5 <= p.w, 'the second line of ' + n.id + ' is wider than its box');
}
/* the detail of a case, as the list below the map holds it (the panel shows a copy) */
const KIND = { literature: 'the literature', 'chen-report': 'Chen’s report', 'chen-run': 'Chen’s run', ours: 'this lane' };
function caseDetail(n) {
  const credits = n.credits.map((c) => '<li><span class="cr-k">' + esc(KIND[c.kind]) + '</span> <b>' + esc(c.who) + '</b>: ' + esc(c.what)
    + (c.label ? ' <em>(' + esc(c.label) + ')</em>' : '') + ' <span class="cr-w">' + esc(c.where) + ' · ' + esc(c.when) + ' · ' + (c.refereed === true ? 'refereed' : c.refereed === false ? '<b>unrefereed</b>' : esc(c.refereed)) + '</span></li>').join('');
  return '<div class="cd-h">' + ICON_STATE(n.state) + '<span class="cd-st">' + esc(STATE_WORD[n.state]) + '</span>' + (n.box ? '<span class="cd-bx">box ' + n.box + '</span>' : '') + '</div>'
    + '<h3>' + esc(n.label) + '</h3><p class="cd-sub">' + esc(n.sub) + '. ' + esc(n.note) + '</p><ul class="cd-cr">' + credits + '</ul>';
}
const NARROW_MAP = mapSvg(LN, true), WIDE_MAP = mapSvg(LW, false);
const KEY = '<div class="cm-key" aria-label="the states">' + ['decided', 'sealed', 'open', 'refused'].map((st) => {
  const n = NODES.filter((x) => x.state === st).length;
  return '<span>' + ICON_STATE(st) + esc(STATE_WORD[st]) + ' <span class="cm-kn">' + (n ? N(n) : 'none today') + '</span></span>';
}).join('') + '</div>';
const HERO = C.figure({
  hero: true, svgRaw: WIDE_MAP, svgNarrowRaw: NARROW_MAP, record: DIR + 'cases.json', pins: false,
  captionRaw: 'The known reduction of the question, as read from the sources between 21 and 23 November 2026: a map, not a proof that the cases are exhaustive. Select a case to zoom to it.'
}).replace('<div class="wide hero" data-hero>', '<div class="wide hero cm-fig" data-hero data-cmap>');
const MAPBLOCK = HERO
  + '<div class="wide cm-under">' + KEY + '<button type="button" class="cm-reset" data-cm-reset>Whole map</button></div>'
  + '<div class="wide"><div class="cm-panel" id="cm-panel" aria-live="polite">' + caseDetail(byId.root) + '</div></div>'
  + '<div class="wide"><details class="more"><summary>Every case, as a list (' + NODES.length + ')</summary><ol class="cm-list">'
  + NODES.map((n) => '<li class="cm-li" id="case-' + n.id + '" style="--d:' + depth(n) + '">' + caseDetail(n) + '</li>').join('') + '</ol></details></div>';

/* ---------------------------------------------------------------- the boxes */
const said = (s) => '<blockquote class="bx-st">' + esc(s) + '</blockquote>';
const rowsList = (rows) => '<ul class="bx-rows">' + rows.map((r) => '<li>' + C.tag(r.verdict) + ' <span class="m">' + esc(r.id) + '</span> ' + esc(r.what) + '</li>').join('') + '</ul>';
const stamp = (b, i, box) => '<li><span class="bk">block ' + V('boxes.json', '/boxes[id=' + box + ']' + (i === null ? '/seal/block' : '/stamps/' + i + '/block'), W.DECIDED, 'raw') + '</span> '
  + esc(utcs(i === null ? b.seal.at : b.stamps[i].at)) + (i === null ? '' : ' — ' + esc(b.stamps[i].what)) + '</li>';
const C35BOX = '<article class="bx bx-open" id="box-1"><div class="bx-h">' + ICON(lockOpen(11, 12, 11), 22, 20, '0 0 22 20') + '<span>box 1 · opened</span></div>'
  + '<h3>' + esc(B1.label) + '</h3>' + said(B1.statement) + '<p class="bx-p">' + esc(B1.attained) + ' ' + esc(B1.also) + '</p>'
  + '<p class="bx-p bx-why"><b>Why 39.</b> ' + esc(B1.why39) + '</p>'
  + '<p class="bx-p bx-why"><b>Exoo’s square.</b> ' + esc(B1.exoo_square.text) + ' <span class="bx-pc">(' + esc(B1.exoo_square.caveat) + '.)</span></p>'
  + '<p class="bx-p bx-why"><b>A smaller certificate.</b> ' + esc(B1.smaller_certificate.replace(/^A smaller certificate for Lemma P: /, 'For Lemma P, ')) + '</p>'
  + '<p class="bx-p bx-pc">' + esc(B1.found_by) + '</p>'
  + '<p class="bx-p">Proved in Lean ' + esc(B1.lean.lean) + ' with Mathlib, on the three standard axioms only. Its key lemma is checked by Lean’s kernel on a certificate of '
  + V('boxes.json', '/boxes[id=c35]/lean/nodes') + ' nodes, with no native code. It was also decided twice outside Lean, by a SAT proof two checkers accept and by our own search over '
  + V('boxes.json', '/boxes[id=c35]/lean/search_nodes') + ' nodes.</p>'
  + rowsList(B1.rows)
  + '<p class="bx-p"><b>A corollary,</b> <em>' + esc(B1.corollary.label) + '</em>: ' + esc(B1.corollary.text) + ' It contains the degree-4 corollary, which was known before.</p>'
  + '<p class="bx-p">' + esc(B1.posed) + '</p>'
  + '<p class="bx-p bx-anchor">Sealed in Bitcoin</p><ul class="bx-stamps">' + stamp(B1, null, 'c35') + '</ul>'
  + '<p class="bx-p bx-open-at">' + (OPENED_UTC ? 'Opened ' + esc(utc(OPENED_UTC)) : 'Opening: at publication') + '</p>'
  + '<p class="bx-p bx-gap"><b>Not established:</b> no referee and no outside reader; its novelty rests on one more reading of the prior art, today’s, by one agent; the Lean statements were read once, by cert-machine; there is no human-readable proof of its key lemma; Lean’s fresh replay was not run for it. The seal proves possession by a date, nothing else.</p>'
  + '</article>';
const premList = '<ol class="bx-prem">' + B2.premises.map((p) => '<li><b>' + esc(p.id) + '</b> ' + esc(p.text) + ' <span class="bx-pc">— ' + esc(p.checked) + '.</span></li>').join('') + '</ol>';
const levelBar = (() => {
  const tot = B2.configurations, f = (x) => (100 * x / tot).toFixed(3);
  return '<div class="lv" role="img" aria-label="' + ea(N(lv.level3) + ' at level 3, ' + N(lv.level4) + ' at level 4, ' + N(lv.full) + ' on the full CNF') + '">'
    + '<span class="lv3" style="--w:' + f(lv.level3) + '%"></span><span class="lv4" style="--w:' + f(lv.level4) + '%"></span><span class="lv7" style="--w:' + f(lv.full) + '%"></span></div>';
})();
const C4 = CASES.chen_c004;
const R7BOX = '<article class="bx bx-open" id="box-2"><div class="bx-h">' + ICON(lockOpen(11, 12, 11), 22, 20, '0 0 22 20') + '<span>box 2 · opened</span></div>'
  + '<h3>' + esc(B2.label) + '</h3>'
  + '<p class="bx-p bx-first"><b>Closed first by Zhiyang Chen’s own AI run</b>, r310_ralph: claim ' + esc(C4.claim) + ', added in its round ' + C4.round + ' (' + esc(utcs(C4.at)) + ') and confirmed in round ' + C4.confirmed.round + ' (' + esc(utc(C4.confirmed.at, false).replace(' UTC', ':' + C4.confirmed.at.slice(17, 19) + ' UTC')) + ') as a certificate with a custom trace, over all '
  + V('cases.json', '/chen_c004/pairs', W.COMPUTED) + ' admissible package pairs; a hand reduction, not Lean. Claude Opus 5.5 re-derived that reduction in his run, so Claude models worked on both sides.</p>'
  + '<p class="bx-p">Ours is a second computation of the case, with our own reduction and code, registered at ' + esc(utc(B2.registered)) + ', before the rented machine existed; the reduction uses Chen’s Lemma R7. ' + esc(B2.set_equal) + ' It holds only under six premises, listed first:</p>'
  + premList
  + '<p class="bx-p">Then: ' + V('boxes.json', '/boxes[id=r7]/configurations') + ' of ' + V('boxes.json', '/boxes[id=r7]/configurations') + ' configurations refuted, each by an LRAT proof that lrat-check and the formally verified cake_lpr both accept: '
  + V('boxes.json', '/boxes[id=r7]/by_level/level3') + ' at level 3, ' + V('boxes.json', '/boxes[id=r7]/by_level/level4') + ' at level 4, ' + V('boxes.json', '/boxes[id=r7]/by_level/full') + ' on the full CNF.</p>'
  + levelBar
  + said('If P1–P6 hold: ' + B2.statement.replace(/^If P1–P6 hold \(as they stand in item 1 above\): /, ''))
  + '<p class="bx-p">' + esc(B2.adds) + '</p>'
  + '<p class="bx-p bx-anchor">Sealed in Bitcoin</p><ul class="bx-stamps">' + stamp(B2, null, 'r7') + '</ul>'
  + '<p class="bx-p bx-open-at">' + (OPENED_UTC ? 'Opened ' + esc(utc(OPENED_UTC)) : 'Opening: at publication') + '</p>'
  + '<p class="bx-p">The full ledger is published, one row per configuration with both checkers’ verdicts: <a href="' + ea(B2.ledger_release.url) + '">the release r310-r7-ledger-2026-11-23</a>, a sealed reveal package.</p>'
  + '<p class="bx-p"><b>Deleted, and regenerable, for two of them.</b> The two configurations that needed the full formula were regenerated from public sources on ' + esc(B2.regenerated.where)
    + ': the pinned CaDiCaL 3.0.1 from its GitHub commit and the tools of the sealed bundle. Both CNFs and both LRAT proofs came out byte-identical to the ledger’s hashes, and lrat-check and cake_lpr accepted each proof; the whole replay took '
    + V('boxes.json', '/boxes[id=r7]/regenerated/seconds', W.DECIDED, 'raw') + ' seconds. The other configurations were not regenerated.</p>'
  + '<p class="bx-p bx-fix"><b>A correction beside the seal.</b> ' + esc(B2.sealed_correction) + ' Sealed bytes cannot change, so it is corrected here.</p>'
  + '<p class="bx-p bx-gap"><b>Not established:</b> the run checks none of the six premises; the proofs were deleted after both checkers read them (about 2.5 TB), as registered, and the ledger keeps each one’s hash and both verdicts; the ledger is the machine’s own account; nobody outside has read it. It does not decide R(3,10).</p>'
  + '</article>';
const SEALBOX = '<article class="bx bx-sealed" id="box-3"><div class="bx-h">' + ICON(lock(11, 12, 11), 22, 20, '0 0 22 20') + '<span>box 3 · sealed</span></div>'
  + '<h3>' + esc(LABEL6) + '</h3>'
  + '<p class="bx-p">' + (B3.progress_percent === 100 ? 'Finished; the box stays sealed. Its rules were stamped before and while it ran, and its final record when it ended; these Bitcoin blocks confirm the stamps, each from its own time:' : 'Running now. Its rules were stamped before and while it runs; these Bitcoin blocks confirm the stamps, each from its own time:') + '</p><ul class="bx-stamps">' + B3.stamps.map((s, i) => stamp(B3, i, 'c6')).join('') + '</ul>'
  + '<div class="pg" role="img" aria-label="' + ea(B3.progress_percent + ' percent done') + '"><span style="--w:' + B3.progress_percent + '%"></span></div>'
  + '<p class="pg-n"><span class="pg-v">' + V('boxes.json', '/boxes[id=c6]/progress_percent') + '%</span> done, rounded down, at ' + esc(utc(B3.as_of)) + ' (the newest copy of its ledger at home)</p>'
  + (B3.open_discrepancies ? '<p class="pg-n pg-open"><b>' + V('boxes.json', '/boxes[id=c6]/open_discrepancies') + ' open discrepanc' + (B3.open_discrepancies === 1 ? 'y' : 'ies') + '</b> (in the corrections ledger)</p>' : '')
  + '<p class="bx-p">Nothing else about it is shown. It opens only after audit, on my word; its replay waits for that.</p></article>';
const BOXES = C.section({ lab: 'the boxes', title: 'Two boxes opened, one sealed', id: 'boxes', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Work in progress is kept in a sealed box: what it is, its rules stamped in Bitcoin, how far it has got, and nothing else. A box opens only after its audit. These are the first two to open.') + '</div>'
    + '<div class="wide"><div class="bx-grid">' + C35BOX + R7BOX + SEALBOX + '</div></div>' });

/* ---------------------------------------------------------------- watch a core die: the replay */
const share = (s, n) => (s[1] / n < 0.05 ? 0 : s[1] / n < 0.15 ? 1 : 2);
function replaySvg(cols, narrow) {
  const S = narrow ? 14 : 20, G = narrow ? 2 : 3, LBL = narrow ? 0 : 0;
  const o = [];
  let y = 0;
  const blocks = RP.cores.map((c) => {
    const rows = Math.ceil(c.squares.length / cols), top = y; y += 26 + rows * (S + G) + (narrow ? 14 : 18);
    return { c, rows, top };
  });
  const w = cols * (S + G) - G + LBL, h = y;
  o.push('<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" class="rp-svg" aria-label="' + ea('The four cores of the recorded run, one block each, a square per 1,000 configurations. Every square is filled: every configuration was refuted. Replay the run to watch the cores die one after another.') + '">');
  for (const { c, top } of blocks) {
    o.push('<text x="0" y="' + (top + 16) + '" class="t-lab">core ' + esc(c.core) + '</text>');
    o.push('<text x="' + w + '" y="' + (top + 16) + '" text-anchor="end" class="t-note rp-c" data-core="' + c.core + '">' + N(c.configurations) + ' of ' + N(c.configurations) + ' refuted</text>');
    c.squares.forEach((s, j) => {
      const n = j < c.squares.length - 1 ? RP.square : c.configurations - RP.square * (c.squares.length - 1);
      const x = (j % cols) * (S + G), yy = top + 26 + Math.floor(j / cols) * (S + G);
      o.push('<rect class="rp-q q' + share(s, n) + '" x="' + x + '" y="' + yy + '" width="' + S + '" height="' + S + '" rx="2" data-t="' + s[0] + '"/>');
      if (s[2]) o.push('<rect class="rp-full" x="' + (x - 2) + '" y="' + (yy - 2) + '" width="' + (S + 4) + '" height="' + (S + 4) + '" rx="3" fill="none" stroke="var(--ink)" stroke-width="2" data-t="' + s[0] + '"/>');
    });
  }
  o.push('</svg>');
  return o.join('');
}
const RPW = replaySvg(44, false), RPN = replaySvg(22, true);
const speed = Math.round(RP.run.wall_s / 24);
const RPDATA = { wall: RP.run.wall_s, start: RP.run.start, every: RP.frames.every_s, n: RP.frames.n, refuted: RP.frames.refuted, cores: RP.cores.map((c) => c.core), total: B2.configurations };
const REPLAY = C.section({ lab: 'watch a core die', title: 'A replay of the R(7) run', id: 'replay', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('The second computation of Case R(7), replayed from its ledger: ' + V('replay.json', '/run/workers') + ' workers on a rented machine, '
    + 'from ' + esc(utc(RP.run.start, false).replace(' UTC', '')) + ' to ' + esc(utc(RP.run.end, false)) + ' on ' + new Date(RP.run.start).getUTCDate() + ' November. Each square is ' + V('replay.json', '/square') + ' configurations of one core; it fills when the last of them is refuted. The four cores die one after another.') + '</div>'
    + '<div class="wide"><figure class="rp-fig"><div class="rp-bar"><button type="button" class="rp-go" data-rp-go>Replay the run</button><span class="rp-clock" data-rp-clock>08:32 UTC · finished</span>'
    + '<span class="rp-tot" data-rp-tot>' + N(B2.configurations) + ' of ' + N(B2.configurations) + ' refuted</span></div>'
    + '<div class="figbox dual"><div class="hv-w">' + RPW + '</div><div class="hv-n">' + RPN + '</div></div>'
    + '<figcaption data-record="' + ea(DIR + 'replay.json@' + sha12(DIR + 'replay.json')) + '">A <b>replay</b> of the recorded run, about ' + N(speed) + ' times faster than it ran; not live. '
    + 'Shade: the share of a square’s configurations that needed level 4 (light under 5%, middle 5 to 15%, bright 15% or more); a ring: one of the ' + N(lv.full) + ' configurations that needed the full CNF. '
    + 'The times are interpolated between the run log’s checkpoints. The replay of the sealed case waits for its box to open.</figcaption></figure></div>'
    + '<script type="application/json" id="rp-data">' + JSON.stringify(RPDATA).replace(/</g, '\\u003c') + '</script>' });

/* ---------------------------------------------------------------- the corrections ledger */
const WHERE = { c35: 'box 1', r7: 'box 2', lane: 'the lane', sealed: 'box 3 (sealed)' };
const T0 = Date.parse('2026-11-21T17:00:00Z'), T1 = Date.parse('2026-11-23T07:00:00Z');
function shape(where, x, y, side, s) {
  const f = side === 'cert-machine' ? 'var(--ink)' : 'none', st = 'stroke="var(--ink)" stroke-width="1.4"';
  if (where === 'sealed') return lock(x, y + 1, s * 1.7).replace('fill="var(--ink)"', 'fill="' + (f === 'none' ? 'var(--sunk)' : f) + '" stroke="var(--ink)" stroke-width="1.2"');
  if (where === 'c35') return '<path d="M' + x + ' ' + (y - s) + ' L' + (x + s) + ' ' + y + ' L' + x + ' ' + (y + s) + ' L' + (x - s) + ' ' + y + 'Z" fill="' + f + '" ' + st + '/>';
  if (where === 'lane') return '<rect x="' + (x - s * 0.8) + '" y="' + (y - s * 0.8) + '" width="' + (s * 1.6) + '" height="' + (s * 1.6) + '" fill="' + f + '" ' + st + '/>';
  return '<circle cx="' + x + '" cy="' + y + '" r="' + (s * 0.85) + '" fill="' + f + '" ' + st + '/>';
}
function ledgerSvg(narrow) {
  const w = narrow ? 360 : 1000, L = narrow ? 8 : 150, R = narrow ? 8 : 16, laneH = narrow ? 124 : 96, top = narrow ? 34 : 14, s = narrow ? 5 : 5.5;
  const X = (iso) => L + (Date.parse(iso) - T0) / (T1 - T0) * (w - L - R);
  const lanes = [['cert-machine', 'cert-machine', 'and its agents'], ['a model track', 'the two', 'model tracks']];
  const h = top + lanes.length * laneH + 34;
  const o = ['<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + ea(K.counts.all + ' errors caught in this lane between 21 and 23 November, on a time axis: the upper lane the errors of cert-machine and its agents, the lower lane those of the two model tracks. A diamond is box 1, a dot box 2, a square the lane’s own files, a padlock the sealed box.') + '">'];
  lanes.forEach(([side, name1, name2], i) => {
    const y0 = top + i * laneH;
    o.push('<rect x="' + L + '" y="' + y0 + '" width="' + (w - L - R) + '" height="' + (laneH - 8) + '" rx="4" fill="var(--surface)"/>');
    if (narrow) o.push('<text x="' + (L + 6) + '" y="' + (y0 - 6) + '" class="t-note">' + esc(name1 + ' ' + name2) + '</text>');
    else o.push('<text x="' + (L - 14) + '" y="' + (y0 + laneH / 2 - 4) + '" text-anchor="end" class="t-note">' + esc(name1) + '</text><text x="' + (L - 14) + '" y="' + (y0 + laneH / 2 + 11) + '" text-anchor="end" class="t-note">' + esc(name2) + '</text>');
    const rows = K.rows.filter((r) => r.side === side || (side === 'cert-machine' && r.side === 'not yet known')), bins = {};
    for (const r of rows) {
      const b = Math.round((Date.parse(r.at) - T0) / (narrow ? 5400000 : 2700000));
      const k = bins[b] = (bins[b] || 0) + 1;
      const x = X(r.at), y = y0 + laneH - 8 - 10 - (k - 1) * (s * 2.3);
      need(y > y0 + 4, 'the ledger’s figure stacks more errors at one time than its lane holds');
      o.push('<g class="lg-m" data-cm="' + ea(utc(r.at) + ' · ' + WHERE[r.where]) + '" data-cmv="' + ea(r.what) + '" tabindex="0">' + shape(r.where, x, y, side, s) + '</g>');
    }
  });
  const ticks = narrow ? ['2026-11-22T00:00:00Z', '2026-11-22T12:00:00Z', '2026-11-23T00:00:00Z'] : ['2026-11-21T18:00:00Z', '2026-11-22T00:00:00Z', '2026-11-22T06:00:00Z', '2026-11-22T12:00:00Z', '2026-11-22T18:00:00Z', '2026-11-23T00:00:00Z', '2026-11-23T06:00:00Z'];   /* the axis runs to 07:00 so the last label stays inside */
  const yb = top + lanes.length * laneH;
  for (const t of ticks) {
    const x = X(t), d = new Date(t), lab = d.getUTCHours() === 0 ? d.getUTCDate() + ' Nov' : String(d.getUTCHours()).padStart(2, '0') + ':00';
    o.push('<line x1="' + x.toFixed(1) + '" y1="' + (top - 2) + '" x2="' + x.toFixed(1) + '" y2="' + (yb - 4) + '" stroke="var(--rule)" stroke-width="1"/>');
    o.push('<text x="' + x.toFixed(1) + '" y="' + (yb + 14) + '" text-anchor="middle" class="t-ax">' + esc(lab) + '</text>');
  }
  o.push('<text x="' + (w - R) + '" y="' + (yb + 30) + '" text-anchor="end" class="t-note">UTC</text>');
  o.push('</svg>');
  return o.join('');
}
const legendShapes = '<div class="lg-key">' + [['c35', 'box 1'], ['r7', 'box 2'], ['lane', 'the lane’s own files'], ['sealed', 'box 3, sealed']].map(([wh, t]) => '<span>' + ICON(shape(wh, 11, 9, 'cert-machine', 5), 22, 18) + esc(t) + '</span>').join('')
  + '<span>' + ICON(shape('r7', 11, 9, 'cert-machine', 5), 22, 18) + 'filled: ours</span><span>' + ICON(shape('r7', 11, 9, 'a model track', 5), 22, 18) + 'hollow: a model’s</span></div>';
const srcOf = (r) => r.line_sha256_16 ? 'a line of the control room’s notes, sealed (sha256 ' + r.line_sha256_16 + '…)' : r.src;
const ledgerTable = (rows, sealed) => C.table({
  cols: sealed ? [{ h: 'when' }, { h: 'what, and its source' }, { h: 'whose' }, { h: 'caught by' }, { h: 'then' }] : [{ h: 'when' }, { h: 'where' }, { h: 'what, and its source' }, { h: 'whose' }, { h: 'caught by, how' }, { h: 'then' }],
  rows: rows.map((r) => { const what = { raw: esc(r.what) + (r.resolution ? '<span class="lg-res">' + esc(r.resolution) + '</span>' : '') + '<span class="lg-src">' + C.breakable(srcOf(r)) + '</span>' };
    return sealed ? [utc(r.at), what, r.whose, r.caught_by, r.outcome] : [utc(r.at), WHERE[r.where], what, r.whose, r.caught_by + ', ' + r.how, r.outcome]; }) }).replace('<table>', '<table class="lg-t">');
const OPENROWS = K.rows.filter((r) => r.where !== 'sealed'), SEALROWS = K.rows.filter((r) => r.where === 'sealed');
const FIVE = K.rows.filter((r) => r.mattered).sort((a, b) => a.mattered.n - b.mattered.n);
need(FIVE.length === 5, 'the ledger’s record does not mark five that mattered');
const STRIP = '<ol class="f5">' + FIVE.map((r) => '<li class="f5-i"><span class="f5-k">' + ICON(shape(r.where, 11, 9, r.side, 5), 22, 18) + esc(utc(r.at)) + ' · ' + esc(WHERE[r.where]) + '</span>'
  + '<span class="f5-t">' + esc(r.mattered.title) + '</span><span class="f5-d">' + esc(r.mattered.line) + '</span></li>').join('') + '</ol>';
const span = ((Date.parse(K.rows[K.rows.length - 1].at) - Date.parse(K.rows[0].at)) / 3600000);
const LEDGER = C.section({ lab: 'the corrections ledger', title: 'Every error caught, by whom and how', id: 'corrections', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw(V('corrections.json', '/counts/all') + ' errors in about ' + Math.round(span) + ' hours, ours and the models’ alike: '
    + V('corrections.json', '/counts/cert_machine') + ' by cert-machine and its agents, ' + V('corrections.json', '/counts/model_tracks') + ' by the two model tracks. '
    + (K.counts.not_yet_known ? V('corrections.json', '/counts/not_yet_known') + ' not yet known (drawn in the upper lane). ' : '')
    + V('corrections.json', '/counts/sealed') + ' are inside the sealed box, one line each with nothing of the method; ' + (K.counts.open ? V('corrections.json', '/counts/open') + ' still open' : 'none is open') + '. Five that mattered:') + '</div>'
    + '<div class="wide">' + STRIP + '</div>'
    + '<div class="wide"><figure><div class="figbox dual"><div class="hv-w">' + ledgerSvg(false) + '</div><div class="hv-n">' + ledgerSvg(true) + '</div></div>'
    + '<figcaption data-record="' + ea(DIR + 'corrections.json@' + sha12(DIR + 'corrections.json')) + '">' + legendShapes + 'Each mark is one error, at the time it was recorded; hover or focus one to read it.</figcaption></figure></div>'
    + '<div class="wide"><details class="more"><summary>All ' + N(K.counts.all) + ', with sources</summary>'
    + '<div class="col"><h3 class="lg-h">The opened boxes and the lane, in full (' + N(OPENROWS.length) + ')</h3></div>' + ledgerTable(OPENROWS, false)
    + '<div class="col"><h3 class="lg-h">Inside the sealed box (' + N(SEALROWS.length) + ')</h3></div>' + ledgerTable(SEALROWS, true) + '</details></div>' });

/* ---------------------------------------------------------------- the machine at work */
const STEPS = [
  ['Proposed', 'One model family proposes: Claude, or GPT-6.2-astra. Until something checks it, it is ' + W.value('a claim', W.COMPUTED, { derived: [DIR + 'machine.json#/verdicts/rows'] }) + '.'],
  ['Checked', 'Code written from the statement alone, without reading the proposer’s code, or the other family: an exact checker, a kernel, a second enumeration.'],
  ['Audited', 'By us, not a second party: a control-room note, gaps first: what holds, what the report says that the files do not, what was not run.'],
  ['Verdict', 'CERTIFIED, REFUTED or REFUSED, each with its reason. A refusal is a verdict.'],
  ['Sealed', 'The record’s digest is stamped in Bitcoin, before anyone outside sees it.'],
  ['Opened', 'After its audit, on my word: the files, the salt and the digest, so anyone can re-derive the anchor.']];
const RAIL = '<ol class="pl">' + STEPS.map(([t, d], i) => '<li class="pl-s"><span class="pl-n">' + (i + 1) + '</span><span class="pl-t">' + esc(t) + '</span><span class="pl-d">' + d + '</span></li>').join('') + '</ol>';
const vt = M.verdicts.tally;
const AS = M.now.astra;
const SEC = M.now.rented.second;
const NOW = C.stats([
  { k: 'rented machine, box 3', vRaw: V('machine.json', '/now/rented/vcpu') + ' vCPU', nRaw: 'US$' + V('machine.json', '/now/rented/usd_per_hour', W.COMPUTED, 'raw') + ' an hour, ' + esc(M.now.rented.state) },
  { k: 'GPT-6.2-astra sessions', vRaw: V('machine.json', '/now/astra/started'), nRaw: 'since ' + esc(utc(AS.since, false)) + ' today: ' + V('machine.json', '/now/astra/finished') + ' done, ' + V('machine.json', '/now/astra/running') + ' running' },
  { k: 'audit notes, opened boxes', vRaw: V('machine.json', '/audits/opened_boxes'), nRaw: 'and ' + V('machine.json', '/audits/sealed_box') + ' inside the sealed box' },
  { k: 'errors caught', vRaw: V('corrections.json', '/counts/all'), n: 'the ledger above' }]);
const vRows = C.table({ cols: [{ h: 'when' }, { h: 'box' }, { h: 'what was checked' }, { h: 'verdict' }],
  rows: M.verdicts.rows.map((r) => [utc(r.at), r.box === 'c35' ? 'box 1' : 'box 2', r.what, { raw: C.tag(r.verdict, 'held') }]) });
const money = C.table({ cols: [{ h: 'result' }, { h: 'where it ran' }, { h: 'cost' }],
  rows: [[{ raw: '<b>Theorem C35</b>' }, M.money.c35.where, { raw: 'US$' + V('machine.json', '/money/c35/usd', W.COMPUTED, 'raw') }]]
    .concat(M.money.r7.items.map((it, i) => [i ? '' : { raw: '<b>Case R(7), the second computation</b>' }, it.what, { raw: 'about US$' + V('machine.json', '/money/r7/items/' + i + '/usd', W.COMPUTED, 'raw') }]))
    .concat([[{ raw: '' }, { raw: '<b>in all</b>' }, { raw: '<b>about US$' + V('machine.json', '/money/r7/total_usd', W.COMPUTED, 'raw') + '</b>' }]]) });
const MACHINE = C.section({ lab: 'the machine at work', title: 'What runs now, and what it costs', id: 'machine', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('As of ' + esc(utc(M.as_of)) + ', from the records. One person runs it with models of two families; cert-machine, the control room, is a Claude model too. “Independent” here means code written without reading the other side’s code, not a second party.') + '</div>'
    + NOW
    + (SEC ? '<div class="col">' + C.pRaw('Also: ' + esc(SEC.what) + ' (' + V('machine.json', '/now/rented/second/vcpu') + ' vCPU, US$' + V('machine.json', '/now/rented/second/usd_per_hour', W.COMPUTED, 'raw') + ' an hour), from '
      + esc(utc(SEC.from, false)) + ' to ' + esc(SEC.to) + ' on 23 November, now ' + esc(SEC.state) + ', and ' + esc(SEC.earlier) + '. About US$' + V('machine.json', '/now/rented/second/usd_both', W.COMPUTED, 'raw') + ' for both.') + '</div>' : '')
    + '<div class="col"><h3 class="lg-h">How a claim travels</h3></div><div class="wide">' + RAIL + '</div>'
    + '<div class="col">' + C.pRaw('On the two opened boxes, ' + N(M.verdicts.rows.length) + ' checks have a verdict: ' + Object.entries(vt).map(([k, v]) => N(v) + ' ' + esc(k)).join(', ') + '. Each is counted once; our own corrections are never counted as findings.') + '</div>'
    + '<div class="wide"><details class="more"><summary>The ' + N(M.verdicts.rows.length) + ' checks, one by one</summary>' + vRows + '</details></div>'
    + '<div class="col"><h3 class="lg-h">Money per result</h3></div>' + money });

/* ---------------------------------------------------------------- credits */
const CREDITS = C.section({ lab: 'credits', title: 'Whose work this is', id: 'credits', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Carlos Toledo ran the lane: the target, the tracks side by side, every go and every cost. The work was done with Claude Opus 5.5 and Claude Fable 5.2 (Anthropic) and GPT-6.2-astra (OpenAI, in Codex), each model read from the session that wrote each file.') + '</div>'
    + C.table({ cols: [{ h: 'who' }, { h: 'model' }, { h: 'what' }], rows: BX.credits.map((c) => [{ raw: '<b>' + esc(c.who) + '</b>' }, c.model, c.what]) })
    + '<div class="col">' + C.plainList([
      { b: 'Cited first.', text: 'Exoo: the 39-vertex graph and R(3,10) ≥ 40. Kalbfleisch: the circulant C35(1,7,11,16), in his 1966 thesis, as Goedgebeur and Radziszowski credit it. Goedgebeur and Radziszowski: R(3,10) ≤ 42, the uniqueness of the (3,9;35)-graph, e(3,8,27) = 85 and the tables. Brinkmann and Goedgebeur: the complete list of (3,8;27)-graphs (2012). McKay: the graph lists. Angeltveit: R(3,10) ≤ 41. Zhiyang Chen: the case R(7), its Lemma R7, the report, the run and C-004. Unsolved Lab and andrey-kokoev/marici: the induced-C35 question posed. Daugherty, Ward and Ryan, McCrea, Pandey and Ravi, algal-lab: the earlier results on the map.' },
      { b: 'Tools.', text: 'CaDiCaL 3.0.1 (Biere); lrat-check from drat-trim (Heule); cake_lpr, the formally verified checker (Heule, Myreen, Tan); Lean 4.35.0 and Mathlib; nanoda; con-leche; kissat; nauty; OpenTimestamps.' }]) + '</div>'
  });

/* ---------------------------------------------------------------- what is not established (first) */
const GAPS = '<div class="col"><div class="note ne"><span class="lab">what is not established, first</span>' + C.plainList([
  { b: 'R(3,10) is open.', text: '40 ≤ R(3,10) ≤ 41 still stands. Neither opened result decides it, and nothing here moves its value.' },
  { b: 'Case R(7) was closed first by someone else.', text: 'Zhiyang Chen’s own AI run excluded it on 21 November. Ours is a second computation of it, and it holds only under six premises the run does not check.' },
  { b: 'Nobody outside has read any of it.', text: 'No referee, no outside replay, no reply. Most sources on the map are unrefereed too, and each is marked.' },
  { b: 'One person, models of two families, no second party.', text: 'The tracks are AI sessions working for one person. “Own” and “independent” mean code written without reading the other track’s code, nothing more.' },
  { b: 'The sealed box claims nothing.', text: 'It shows what it is, its anchors and its progress. Its contents are not shown and are not stated.' },
  { b: 'The map is a reading.', text: 'It is the known reduction as read from the sources on a date, not a proof that its cases cover every graph.' }]) + '</div></div>';

/* ---------------------------------------------------------------- why you can trust this (one click down) */
const RECS = ['cases.json', 'boxes.json', 'corrections.json', 'machine.json', 'replay.json', 'page-log.json'];
const trustBody = [
  C.pRaw('<b>Every number on this page is read from a record.</b> The six records below are written from the lane’s own files by <span class="m">tools/r310-live-records.js</span>, which refuses when a source no longer says what a record states; this page is built from them by <span class="m">tools/build-r310-live.js</span>, which refuses when they disagree.'),
  C.table({ cols: [{ h: 'record' }, { h: 'sha256, first 12' }, { h: 'what it holds' }], rows: RECS.map((f) => [{ raw: '<span class="m">' + esc(DIR + f) + '</span>' }, { raw: '<span class="m">' + sha12(DIR + f) + '</span>' }, J(f).what]) }),
  C.pRaw('<b>The sources.</b> The records cite ' + N(CASES.sources.length) + ' files of the lane by a phrase each must contain; their hashes are fixed here so that the files, when they open, can be checked against them:'),
  C.table({ cols: [{ h: 'source' }, { h: 'sha256, first 12' }], rows: CASES.sources.map((s) => [{ raw: '<span class="m">' + C.breakable(s.file) + '</span>' }, { raw: '<span class="m">' + esc(s.sha256_12) + '</span>' }]) }),
  C.pRaw('The sealed box’s corrections cite their source line by the first 16 hex digits of its hash, so nothing of the sealed work is quoted.'),
  C.pRaw('<b>The seals.</b> Box 1’s digest is <span class="hx">' + esc(B1.seal.digest) + '</span> (line ' + B1.seal.registry_line + ' of <span class="m">seals/registry.jsonl</span>, Bitcoin block ' + B1.seal.block + '); box 2’s is <span class="hx">' + esc(B2.seal.digest)
    + '</span> (line ' + B2.seal.registry_line + ', block ' + B2.seal.block + '). An opened seal publishes its files, salt and manifest, and anyone re-derives the digest with <span class="m">instruments/seal/</span>. The opened seals and the record: '
    + (OPENED_UTC ? '<a href="' + ea(RECORD_URL) + '">corpus/r310-c35-r7/ in the cert-machine repository</a>.' : 'published at launch, in the cert-machine repository at <span class="m">corpus/r310-c35-r7/</span>.') + ' A seal proves possession by a date, nothing else.'),
  C.pRaw('<b>The R(7) ledger</b> is published as a sealed reveal package (index ' + B2.ledger_release.index + ') in <a href="' + ea(B2.ledger_release.url) + '">the release r310-r7-ledger-2026-11-23</a>: <span class="m">' + esc(B2.ledger_release.package) + '</span>, sha256 <span class="hx">'
    + esc(B2.ledger_release.package_sha256) + '</span>; the ledger inside it, <span class="m">prod.tsv</span>, sha256 <span class="hx">' + esc(B2.ledger_release.prod_sha256) + '</span>.'),
  C.pRaw('<b>The two regenerated configurations</b> (' + B2.regenerated.ids.map((x) => N(x).replace(/,/g, '')).join(' and ') + '): the kit is <a href="' + ea(B2.regenerated.kit_url) + '">' + esc(B2.regenerated.kit) + '</a>, with a README and <span class="m">' + esc(B2.regenerated.tar) + '</span>, sha256 <span class="hx">' + esc(B2.regenerated.tar_sha256) + '</span>.'),
  C.pRaw('<b>Chen’s claim C-004</b> is commit <span class="m">' + esc(CASES.chen_c004.commit) + '</span> of github.com/jeffchen006/Ramsey-R3-10, committed ' + esc(utcs(CASES.chen_c004.at)) + ' (the committer’s clock).'),
  C.pRaw('<b>What the build refuses.</b> The page is not built when: the replay’s counts are not box 2’s; box 2’s levels do not sum to its configurations; the sealed box’s record holds anything beyond its name, its three anchors and a whole percent; the map names the sealed case otherwise than its box; a sealed correction says more than one line; the newest change-log entry is not the records’ state; the case number of the sealed box appears anywhere but in its name; the opening time is unset outside a preview.'),
  C.pRaw('<b>How to read a mark.</b> A plain number is decided: exact arithmetic or a checker backs it. A number underlined in dashes is computed or quoted: someone printed it and nothing here decided it (a price, a claimant’s count).'),
  W.legendHtml()];
const TRUST = C.section({ lab: 'one click down', title: 'Why you can trust this', id: 'trust', wide: true,
  bodyRaw: '<div class="wide"><details class="more trust"><summary>The records, the hashes and the rules</summary><div class="col">' + trustBody.join('\n') + '</div></details></div>' });

/* ---------------------------------------------------------------- changes */
const CHANGES = C.section({ lab: 'changes', title: 'Changes to this page', id: 'changes',
  bodyRaw: C.plainList(LOGE.slice().reverse().map((e) => ({ b: e.at.replace('T', ' ').replace('Z', ' UTC') + '.', text: e.what + ' (Box 3 at ' + e.progress_percent + '%; ' + e.corrections + ' corrections.)' }))) });

/* ---------------------------------------------------------------- the page */
const TITLE = 'R(3,10), in the open';   /* the operator's title and URL, from REVEAL-v2 */
const HEADER = C.header({ eyebrow: 'Carlos Toledo · live research and its verification', title: TITLE,
  deck: 'Is there a graph on 40 vertices with no triangle and no 10 vertices pairwise unjoined? If none exists, R(3,10) = 40; if one does, 41. Nobody knows, and nothing on this page decides it. This is the work, shown while it happens: every case of the question and who closed it, what runs now in a sealed box, and every error caught on the way.' })
  + '<div class="col">' + C.scope('A live page, rebuilt from its records; this build reads them up to ' + (() => { const d = new Date(M.as_of > B3.as_of ? M.as_of : B3.as_of);
    return utc(d.toISOString(), false) + ' on ' + d.getUTCDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getUTCMonth()] + ' ' + d.getUTCFullYear(); })()
    + '. Nothing on it is refereed. How this page updates: it is rebuilt from its records at every phase finish, and its change log at the foot says what changed.') + '</div>';
const MAPSEC = '<section class="cm-sec" id="map"><div class="col sec-head"><div class="lab">the case map</div><h2>The whole question, case by case</h2></div>' + MAPBLOCK + '</section>';
let body = [HEADER, GAPS, MAPSEC, BOXES, REPLAY, LEDGER, MACHINE, CREDITS, TRUST, CHANGES].join('\n\n');
/* marketing page: a value's tooltip says its standing's word; the reasons are said once, in the trust layer, by the legend */
body = body.replace(/(<span class="w-val (w-(decided|computed|chosen|refused))\b[^"]*"[^>]*?) title="[^"]*"/g, (m0, pre, cls, st) => pre + ' title="' + st + '"');

const STYLE = `
.cm-sec .sec-head{margin-bottom:var(--s-5)}
.cm-fig .figbox{padding:var(--s-3)}
.cm-svg .cm-n{cursor:pointer;outline:none}
.cm-svg .cm-n:focus-visible rect:first-of-type,.cm-svg .cm-n.on rect:first-of-type{stroke:var(--ink);stroke-width:2.4}
.cm-svg .cm-n:hover rect:first-of-type{stroke:var(--ink)}
.cm-svg .cm-dim{fill:var(--ink-2)}
.cm-under{display:flex;flex-wrap:wrap;gap:var(--s-3) var(--s-5);align-items:center;justify-content:space-between;margin-top:var(--s-3)}
.cm-key{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-5);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.cm-key>span{display:inline-flex;align-items:center;gap:var(--s-2)}
.cm-kn{color:var(--ink-4);text-transform:none;letter-spacing:0}
.ic{display:inline-block;vertical-align:middle;flex:none}
.cm-reset,.rp-go{font:inherit;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink);background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius-pill);padding:var(--s-2) var(--s-4);cursor:pointer}
.cm-reset:hover,.rp-go:hover{border-color:var(--ink-3)}
.cm-panel{margin-top:var(--s-4);background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-5)}
.cm-panel h3,.cm-li h3{margin:var(--s-2) 0 var(--s-2)}
.cd-h{display:flex;align-items:center;gap:var(--s-2);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.cd-bx{margin-left:auto;border:1px solid var(--rule-strong);border-radius:var(--radius-pill);padding:0 var(--s-2)}
.cd-sub{color:var(--ink-2);max-width:var(--read);margin:0 0 var(--s-3)}
.cd-cr{list-style:none;padding:0;margin:0;display:grid;gap:var(--s-2)}
.cd-cr li{font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-2);border-top:1px solid var(--rule);padding-top:var(--s-2)}
.cd-cr b{color:var(--ink);font-weight:var(--weight-medium)}
.cr-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-4);margin-right:var(--s-1)}
.cr-w{display:block;color:var(--ink-4);font-size:var(--text-eyebrow);font-family:var(--f-mono)}
.cr-w b{color:var(--ink-2)}
.cm-list{list-style:none;padding:0;margin:0;display:grid;gap:var(--s-4)}
.cm-li{padding-left:calc(var(--d) * var(--s-4));border-left:1px solid var(--rule);padding-top:var(--s-1)}
.cm-li .cd-h,.cm-li h3,.cm-li .cd-sub,.cm-li .cd-cr{margin-left:var(--s-3)}
.ne .plain li{padding:var(--s-2) 0}
.bx-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-4);align-items:start}
@media (max-width:1000px){.bx-grid{grid-template-columns:minmax(0,1fr)}}
.bx{background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:var(--s-5);min-width:0}
.bx-sealed{border:2px solid var(--ink);outline:1px solid var(--ink-4);outline-offset:calc(-1 * var(--s-2));background:var(--sunk)}
.bx-h{display:flex;align-items:center;gap:var(--s-2);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.bx h3{margin:var(--s-3) 0 var(--s-3)}
.bx-st{margin:0 0 var(--s-3);padding:var(--s-3) var(--s-4);border-left:2px solid var(--ink);background:var(--sunk);font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink)}
.bx-p{font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-2);margin:0 0 var(--s-3)}
.bx-first{color:var(--ink)}
.bx-anchor{margin:var(--s-4) 0 var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-4)}
.bx-fix{border-left:2px solid var(--ink-3);padding-left:var(--s-3);color:var(--ink-2)}
.bx-why b{color:var(--ink)}
.pg-open b{color:var(--ink)}
.bx-open-at{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.f5{list-style:none;margin:var(--s-2) 0 var(--s-5);padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:var(--s-3)}
@media (max-width:1000px){.f5{grid-template-columns:minmax(0,1fr)}}
.f5-i{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-4);display:flex;flex-direction:column;gap:var(--s-2);min-width:0}
.f5-k{display:flex;align-items:center;gap:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4)}
.f5-t{font-family:var(--f-display);font-weight:var(--weight-title);color:var(--ink);line-height:var(--leading-snug)}
.f5-d{font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-3)}
.lg-res{display:block;margin-top:var(--s-1);color:var(--ink-2)}
.lg-src{display:block;margin-top:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4)}
.bx-gap{border-top:1px solid var(--rule);padding-top:var(--s-3);margin-top:var(--s-4);color:var(--ink-3)}
.bx-rows,.bx-stamps{list-style:none;padding:0;margin:0 0 var(--s-3);display:grid;gap:var(--s-2);font-size:var(--text-small);color:var(--ink-2);line-height:var(--leading-snug)}
.bx-stamps .bk{font-family:var(--f-mono);color:var(--ink)}
.bx-prem{margin:0 0 var(--s-3);padding-left:var(--s-5);display:grid;gap:var(--s-2);font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink)}
.bx-pc{color:var(--ink-3)}
.lv{display:flex;height:var(--s-2);border-radius:var(--radius-pill);overflow:hidden;background:var(--mark);margin:0 0 var(--s-3)}
.lv span{display:block;width:var(--w);min-width:var(--s-1)}
.lv3{background:var(--c-s3)}.lv4{background:var(--c-s5)}.lv7{background:var(--ink);min-width:var(--s-1)}
.pg{height:var(--s-3);border-radius:var(--radius-pill);background:var(--mark);overflow:hidden;margin:var(--s-4) 0 var(--s-2)}
.pg span{display:block;height:100%;width:var(--w);background:var(--ink);border-radius:var(--radius-pill)}
.pg-n{font-size:var(--text-small);color:var(--ink-3);margin:0 0 var(--s-3)}
.pg-v{font-family:var(--f-display);font-size:var(--text-2);color:var(--ink);font-weight:var(--weight-title);margin-right:var(--s-1)}
.dual .hv-n{display:none}
@media (max-width:680px){.dual .hv-w{display:none}.dual .hv-n{display:block}}
.rp-bar{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-3) var(--s-5);margin:0 0 var(--s-3)}
.rp-clock,.rp-tot{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-2)}
.rp-tot{margin-left:auto;color:var(--ink)}
.rp-q{stroke:none}
.rp-q.q0{fill:var(--c-s3)}.rp-q.q1{fill:var(--c-s4)}.rp-q.q2{fill:var(--c-s5)}
.rp-q.live{fill:none;stroke:var(--rule-strong);stroke-width:1}
.rp-full.live{stroke:var(--rule-strong)}
.lg-key{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-4);margin:0 0 var(--s-2);color:var(--ink-3)}
.lg-key>span{display:inline-flex;align-items:center;gap:var(--s-1)}
.lg-m{cursor:crosshair;outline:none}
.lg-h{margin:var(--s-6) 0 var(--s-3)}
.lg-t td:first-child{white-space:nowrap}
.pl{list-style:none;margin:var(--s-2) 0 var(--s-5);padding:0;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:var(--s-3)}
@media (max-width:980px){.pl{grid-template-columns:minmax(0,1fr)}}
.pl-s{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-4);display:flex;flex-direction:column;gap:var(--s-2);min-width:0}
.pl-n{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4)}
.pl-t{font-family:var(--f-display);font-weight:var(--weight-title);color:var(--ink)}
.pl-d{font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-3)}
.trust .col>p{color:var(--ink-2)}
.hx{font-family:var(--f-mono);font-size:var(--text-small);overflow-wrap:anywhere}
.lg-src{overflow-wrap:anywhere}
`;
const SCRIPT = `<script>(function(){
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* the case map: select a case, zoom to it, show its detail */
var fig=document.querySelector('[data-cmap]'),panel=document.getElementById('cm-panel');
function vb(s){return s.split(' ').map(Number)}
function zoom(svg,to){var a=vb(svg.getAttribute('viewBox')),b=vb(to);if(reduce){svg.setAttribute('viewBox',to);return}
var t0=null;function f(t){if(t0===null)t0=t;var k=Math.min(1,(t-t0)/420),e=1-Math.pow(1-k,3);svg.setAttribute('viewBox',a.map(function(v,i){return (v+(b[i]-v)*e).toFixed(1)}).join(' '));if(k<1)requestAnimationFrame(f)}requestAnimationFrame(f)}
function show(id){var li=document.getElementById('case-'+id);if(li&&panel){panel.innerHTML=li.innerHTML}
if(fig)fig.querySelectorAll('g.cm-n').forEach(function(g){g.classList.toggle('on',g.getAttribute('data-id')===id)})}
if(fig){fig.querySelectorAll('svg.cm-svg').forEach(function(svg){svg.querySelectorAll('g.cm-n').forEach(function(g){
function go(){show(g.getAttribute('data-id'));fig.querySelectorAll('svg.cm-svg').forEach(function(s){var m=s.querySelector('g.cm-n[data-id="'+g.getAttribute('data-id')+'"]');if(m)zoom(s,m.getAttribute('data-z'))})}
g.addEventListener('click',go);g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})})});
var rs=document.querySelector('[data-cm-reset]');if(rs)rs.addEventListener('click',function(){show('root');fig.querySelectorAll('svg.cm-svg').forEach(function(s){zoom(s,s.getAttribute('data-base'))})})}
/* the replay: every square alive, then the ledger's order at speed; the final frame is the page as built */
var D=document.getElementById('rp-data'),go=document.querySelector('[data-rp-go]');
if(D&&go){D=JSON.parse(D.textContent);var clock=document.querySelector('[data-rp-clock]'),tot=document.querySelector('[data-rp-tot]');
var qs=[].slice.call(document.querySelectorAll('.rp-q,.rp-full')),cs=[].slice.call(document.querySelectorAll('.rp-c'));
var start=Date.parse(D.start),run=false;function fmt(n){return n.toLocaleString('en-US')}
function paint(t){var i=Math.min(D.n,Math.floor(t/D.every)),r=D.refuted[i],s=0;
qs.forEach(function(q){var dead=Number(q.getAttribute('data-t'))<=t;q.classList.toggle('live',!dead)});
cs.forEach(function(c){var k=D.cores.indexOf(c.getAttribute('data-core'));var n=D.refuted[D.n][k];c.textContent=fmt(r[k])+' of '+fmt(n)+' refuted'+(r[k]===n?' · dead':'')});
r.forEach(function(x){s+=x});var d=new Date(start+t*1000);clock.textContent=String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')+' UTC'+(t>=D.wall?' · finished':' · replay');
tot.textContent=fmt(s)+' of '+fmt(D.total)+' refuted'}
go.addEventListener('click',function(){if(run)return;if(reduce){paint(D.wall);return}run=true;var t0=null,dur=24000;
function f(now){if(t0===null)t0=now;var k=Math.min(1,(now-t0)/dur);paint(k*D.wall);if(k<1)requestAnimationFrame(f);else run=false}requestAnimationFrame(f)})}
})();</script>`;

let html = TPL.render({
  title: TITLE, bodyRaw: body, footRaw: '<p>Built by tools/build-r310-live.js from the records in corpus/r310-live/. The research and its checks by Carlos Toledo with Claude Opus 5.5 and Claude Fable 5.2 (Anthropic) and GPT-6.2-astra (OpenAI, in Codex); the page built with Claude Opus 5.5. Unrefereed.</p>',
  path: '/r310/', cssRaw: STYLE, scriptRaw: require(path.join(ROOT, 'design', 'charts.js')).script() + SCRIPT, lang: 'en',
  desc: 'R(3,10) is 40 or 41, and nothing here decides which. A live page of the research and its checks: the whole (3,10;40) question as a map of cases and who closed each, two opened results (Theorem C35 and a second computation of Case R(7)), one case running under seal, every error caught, and what the machine costs.',
  og: { image: '/og-r310.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('r310') }
});
/* the sealed case's number appears only in its name (the box, the map's box and list, a title) */
const visible = html.replace(/<script[\s\S]*?<\/script>/g, '');
const all6 = (visible.match(/R\(6\)/g) || []).length, named6 = (visible.match(/Case R\(6\): codegree six/g) || []).length;
need(all6 === named6, 'the sealed case’s number appears ' + (all6 - named6) + ' time(s) outside its name');
need(!/\b(?:TODO|undefined|NaN)\b/.test(visible.replace(/<[^>]+>/g, ' ')), 'a placeholder reached the page');
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(path.join(OUTDIR, 'index.html'), html);
console.log('site/r310/index.html written: ' + NODES.length + ' cases, box 3 at ' + B3.progress_percent + '%, ' + K.counts.all + ' corrections, ' + M.verdicts.rows.length + ' verdicts; '
  + (OPENED_UTC ? 'opened ' + OPENED_UTC : 'PREVIEW: opening at publication'));
