#!/usr/bin/env node
/* build-r310-live.js — site/r310/index.html: R(3,10), in the open. Research and its verification on one page, while it happens.

   R(3,10) is 40 or 41 and nothing here decides which. The page shows the whole lane: the (3,10;40) question as a map
   of cases with who closed each (the hero), the question explained from the ground up (the field map's content), the
   lane's own map of strata, the three boxes (Theorem C35, a second computation of Case R(7), and Case R(6)'s three-edge
   branch, sealed until 25 Nov 2026 and opened on the operator's word with the rest of the case), the whole process
   (every round, line and gate, dead ends with the passes, and what runs now), the path ledger, six open questions,
   the lane's forecasts set apart as forecasts, a replay of one recorded run, every error caught on the way, and the
   machine at work. Rigor is one click down, in "Why you can trust this": every record, every hash, every rule.

   EVERY NUMBER AND EVERY SENTENCE OF STATE IS READ from corpus/r310-live/ (written from the lane's files by
   tools/r310-live-records.js, which refuses when a source no longer says what a record states). This builder reads
   nothing else, and refuses when the records disagree with each other or when the newest page-log entry is not the
   records' state.

   FORECASTS never share a typography or a frame with a decided number (WARRANT): they are drawn only in the forecasts
   section, in their own italic type and dashed frame, and the builder counts that.

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
const PR = J('process.json'), PA = J('paths.json'), FM = J('fieldmap.json'), MAN = J('sources/MANIFEST.json');
/* THE LAUNCH SWITCH: set to the publication time ('2026-11-23T12:00Z' form) by the control room, at launch */
const OPENED_UTC = '2026-11-23T05:48Z';
const PREVIEW = process.env.FOR_PREVIEW === '1';
need(OPENED_UTC !== null || PREVIEW, 'OPENED_UTC is unset: the control room sets it at launch (the publication time); FOR_PREVIEW=1 builds a preview');
need(OPENED_UTC === null || /^\d{4}-\d\d-\d\dT\d\d:\d\dZ$/.test(OPENED_UTC), 'OPENED_UTC is not a UTC time like 2026-11-23T12:00Z');
const RECORD_URL = 'https://github.com/carlostoledo1891/cert-machine/tree/main/corpus/r310-c35-r7';
const SRC_URL = 'https://github.com/carlostoledo1891/cert-machine/tree/main/corpus/r310-live/sources';

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
need(B1.state === 'opened' && B2.state === 'opened' && B3.state === 'opened', 'a box’s state is not the one the page draws');
const LABEL6 = B3.map_label;
need(LABEL6 === 'Case R(6): codegree six', 'box 3 is not named as Chen’s report names its case');
const T6 = B3.tally;
need(T6.excluded === T6.cores && T6.open === 0 && T6.witness === 0 && T6.refuted_by_tests + T6.open_by_tests === T6.screened && T6.open_by_tests === T6.infeasible_by_search, 'box 3’s tally does not sum');
need(B3.run.first.cores + B3.run.second.cores === T6.cores && B3.run.per_hour.counts.reduce((a, b) => a + b, 0) === T6.cores, 'box 3’s machines do not hold every core');
need(B3.stamps.length >= 2 && B3.stamps.every((s) => Number.isInteger(s.block)) && B3.stamps.every((s, i) => i === 0 || s.block > B3.stamps[i - 1].block), 'box 3’s anchors are not blocks in order');
const lv = B2.by_level, rl = RP.by_level;
need(lv.level3 === rl.level3 && lv.level4 === rl.level4 && lv.full === rl.full, 'the replay’s levels are not box 2’s');
need(lv.level3 + lv.level4 + lv.full === B2.configurations, 'box 2’s levels do not sum to its configurations');
need(RP.cores.reduce((s, c) => s + c.configurations, 0) === B2.configurations, 'the replay’s cores do not sum to box 2’s configurations');
need(RP.frames.refuted[RP.frames.n].join(',') === RP.cores.map((c) => c.configurations).join(','), 'the replay does not end with every configuration refuted');
const NODES = CASES.nodes, byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
need(byId.r7.box === 2 && byId.c35.box === 1 && byId.c6.box === 3 && byId.c6.state === 'open', 'the map’s boxes are not the boxes record’s (Case R(6) is not closed: its node must not be decided)');
need(byId.c6.label === LABEL6, 'the map names the sealed case otherwise than its box');
need(K.counts.all === K.rows.length && K.counts.r6 === K.rows.filter((r) => r.where === 'r6').length && K.rows.every((r) => r.src && r.where !== 'sealed'), 'the corrections’ counts are not their rows’, or a row has no source');
need(PR.gates.length === Object.values(PR.tally).reduce((a, b) => a + b, 0) && PR.rounds.length >= 6, 'the process record’s tally is not its gates’');
need(MAN.files.length === CASES.sources.length, 'the sources manifest does not list every cited file');
/* the public change log: the newest entry states the state the page shows */
const LOGE = PL.entries, NEWEST = LOGE[LOGE.length - 1];
need(NEWEST && NEWEST.box3 === B3.state && NEWEST.corrections === K.counts.all && LOGE.some((e) => /seal/i.test(e.what) && e.box3 === 'opened'),
  'the newest page-log entry says ' + (NEWEST ? (NEWEST.box3 || NEWEST.progress_percent + '%') + ' and ' + NEWEST.corrections + ' corrections' : 'nothing') + ', the records box 3 ' + B3.state + ' and ' + K.counts.all + ' (and an entry must say the seal was opened)'
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
    + ' cases. Each box is a case with its state: a filled dot decided, a hollow dot open. Select a case to zoom to it and read who decided it.') + '">'];
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
const KEY = '<div class="cm-key" aria-label="the states">' + ['decided', 'open', 'refused'].map((st) => {
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
const stamp6 = (s, i) => '<li><span class="bk">block ' + V('boxes.json', '/boxes[id=c6]/stamps/' + i + '/block', W.DECIDED, 'raw') + '</span> '
  + (s.at ? esc(utcs(s.at)) : 'confirmed by ' + esc(utc(s.by))) + ' — ' + esc(s.what) + '</li>';
const hourSvg = (() => {
  const c = B3.run.per_hour.counts, w = 300, h = 92, bw = w / c.length, mx = Math.max(...c);
  const o = ['<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" class="r6h" aria-label="' + ea('Cores of the three-edge run finished per hour, ' + c.length + ' hours from 22 Nov 18:00 UTC: ' + N(B3.run.first.cores) + ' on the first machine, then ' + N(B3.run.second.cores) + ' on the second') + '">'];
  c.forEach((v, i) => { const hh = (v / mx) * (h - 26); o.push('<rect x="' + (i * bw + 0.5).toFixed(1) + '" y="' + (h - 18 - hh).toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="var(--c-s4)"/>'); });
  const sx = ((Date.parse(B3.run.first.stop) - Date.parse(B3.run.per_hour.from)) / 3600000) * bw;
  o.push('<line x1="' + sx.toFixed(1) + '" x2="' + sx.toFixed(1) + '" y1="4" y2="' + (h - 18) + '" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="2 3"/>');
  o.push('<text x="2" y="' + (h - 4) + '" class="t-ax">22 Nov 18:00</text><text x="' + (w - 2) + '" y="' + (h - 4) + '" text-anchor="end" class="t-ax">24 Nov 00:45</text><text x="' + (sx - 4).toFixed(1) + '" y="12" text-anchor="end" class="t-note">machine 2 →</text></svg>');
  return o.join('');
})();
const premItems = (ps) => '<ul class="bx-rows bx-lim">' + ps.map((p) => '<li><b>' + esc(p.id) + '</b> ' + esc(p.text) + ' <span class="bx-pc">— ' + esc(p.checked) + '.</span></li>').join('') + '</ul>';
const R6V = (ptr) => V('boxes.json', '/boxes[id=c6]/tally/' + ptr);
const R6BOX = '<article class="bx bx-open" id="box-3"><div class="bx-h">' + ICON(lockOpen(11, 12, 11), 22, 20, '0 0 22 20') + '<span>box 3 · opened</span></div>'
  + '<h3>' + esc(B3.label) + '</h3>'
  + '<p class="bx-p bx-first"><b>The seal, opened.</b> ' + esc(B3.opened.what) + '</p>'
  + '<p class="bx-p bx-gap bx-gap-top"><b>Not established, first:</b></p><ul class="bx-rows bx-lim">' + B3.limits.map((l) => '<li><b>' + esc(l.b) + '</b> ' + esc(l.text) + '</li>').join('') + '</ul>'
  + '<p class="bx-p">It holds only under six premises:</p>' + premItems(B3.premises)
  + '<p class="bx-p">Then: ' + R6V('excluded') + ' of ' + R6V('cores') + ' cores excluded, ' + R6V('open') + ' open, ' + R6V('completions') + ' with a completion. A core is the graph on the 26 vertices adjacent to neither marked vertex. For each core the run lists every admissible choice of the six side rows: '
    + R6V('baseline') + ' in all. A screen leaves ' + R6V('screened') + '. Two tests refute ' + R6V('refuted_by_tests') + ' of those. The ' + R6V('open_by_tests') + ' left, on ' + R6V('open_cores') + ' cores, are each shown infeasible by an exhaustive search that uses neither test. The same search also took a sample on every core, '
    + R6V('sampled') + ' records in all: none completes, and none contradicts the tests. That sample is ' + V('boxes.json', '/boxes[id=c6]/tally/sample_share_percent', W.DECIDED, 'raw') + '% of the screened records: it can catch an unsound test, not one false refutation among millions.</p>'
  + '<figure class="r6f">' + hourSvg + '<figcaption data-record="' + ea(DIR + 'boxes.json@' + sha12(DIR + 'boxes.json')) + '">Cores finished per hour, by the machines’ own clock: ' + V('boxes.json', '/boxes[id=c6]/run/first/cores') + ' on the first machine, then, after a stop on the money rule, ' + V('boxes.json', '/boxes[id=c6]/run/second/cores') + ' on a second; about ' + V('boxes.json', '/boxes[id=c6]/run/cpu_hours') + ' CPU-hours.</figcaption></figure>'
  + said(B3.statement)
  + '<p class="bx-p"><b>A second program, and where it stops.</b> ' + esc(B3.second_program) + '</p>'
  + '<p class="bx-p">' + esc(B3.chen) + '</p>'
  + '<p class="bx-p bx-anchor">In Bitcoin</p><ul class="bx-stamps">' + B3.stamps.map(stamp6).join('') + '</ul>'
  + '<p class="bx-p bx-pc">The rules were stamped at 18:07 UTC by our clock, before the machine existed; Bitcoin confirms them from 18:17:27 UTC, seven minutes after the run began, when ' + V('boxes.json', '/boxes[id=c6]/results_before_first_block') + ' of the 23,409 cores had a result. The final record is confirmed 25 minutes after the run ended. A stamp proves a date, nothing else. Blocks 977089 and 977108 were shown while the box was sealed, as “further derivations” and “a draw registration”: they anchor the four-edge derivations and a toy registration of the draw gate.</p>'
  + '<p class="bx-p bx-open-at">Opened 25 Nov 2026, on the operator’s word</p>'
  + '<p class="bx-p"><b>The rest of the case.</b> ' + esc(B3.rest.four_edge) + ' ' + esc(B3.rest.five_to_nine) + '</p>'
  + '<p class="bx-p"><b>Corrections beside the record.</b> ' + esc(B3.corrections_beside) + '</p>'
  + '<p class="bx-p">The run’s working files the page cites are public in <a href="' + ea(SRC_URL) + '">corpus/r310-live/sources/</a>; the full ledger (one row per core) is named by its sha256 in the trust layer below.</p>'
  + '</article>';
const BOXES = C.section({ lab: 'the boxes', title: 'Three boxes, all opened', id: 'boxes', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Work in progress was kept in a sealed box: what it is, its rules stamped in Bitcoin, how far it had got, and nothing else; a box opened only after its audit. The first two opened on 23 November. The third, Case R(6), opened on 25 November 2026 on the operator’s word, with the rest of its case: the seal of this lane is gone.') + '</div>'
    + '<div class="wide"><div class="bx-grid">' + C35BOX + R7BOX + R6BOX + '</div></div>' });

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
    + 'The times are interpolated between the run log’s checkpoints. Box 3’s run is drawn hour by hour inside its box.</figcaption></figure></div>'
    + '<script type="application/json" id="rp-data">' + JSON.stringify(RPDATA).replace(/</g, '\\u003c') + '</script>' });

/* ---------------------------------------------------------------- the corrections ledger */
const WHERE = { c35: 'box 1', r7: 'box 2', r6: 'box 3', lane: 'the lane' };
const T0 = Date.parse('2026-11-21T12:00:00Z'), T1 = Date.parse('2026-11-25T03:00:00Z');
function shape(where, x, y, side, s) {
  const f = side === 'cert-machine' ? 'var(--ink)' : 'none', st = 'stroke="var(--ink)" stroke-width="1.4"';
  if (where === 'r6') return '<path d="M' + x + ' ' + (y - s) + ' L' + (x + s) + ' ' + (y + s * 0.8) + ' L' + (x - s) + ' ' + (y + s * 0.8) + 'Z" fill="' + f + '" ' + st + '/>';
  if (where === 'c35') return '<path d="M' + x + ' ' + (y - s) + ' L' + (x + s) + ' ' + y + ' L' + x + ' ' + (y + s) + ' L' + (x - s) + ' ' + y + 'Z" fill="' + f + '" ' + st + '/>';
  if (where === 'lane') return '<rect x="' + (x - s * 0.8) + '" y="' + (y - s * 0.8) + '" width="' + (s * 1.6) + '" height="' + (s * 1.6) + '" fill="' + f + '" ' + st + '/>';
  return '<circle cx="' + x + '" cy="' + y + '" r="' + (s * 0.85) + '" fill="' + f + '" ' + st + '/>';
}
function ledgerSvg(narrow) {
  const w = narrow ? 360 : 1000, L = narrow ? 8 : 150, R = narrow ? 8 : 16, laneH = narrow ? 124 : 96, top = narrow ? 34 : 14, s = narrow ? 5 : 5.5;
  const X = (iso) => L + (Date.parse(iso) - T0) / (T1 - T0) * (w - L - R);
  const lanes = [['cert-machine', 'cert-machine', 'and its agents'], ['a model track', 'the two', 'model tracks']];
  const h = top + lanes.length * laneH + 34;
  const o = ['<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + ea(K.counts.all + ' errors caught in this lane between 21 and 25 November, on a time axis: the upper lane the errors of cert-machine and its agents, the lower lane those of the two model tracks. A diamond is box 1, a dot box 2, a triangle box 3, a square the lane’s own files.') + '">'];
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
  const ticks = narrow ? ['2026-11-22T00:00:00Z', '2026-11-23T00:00:00Z', '2026-11-24T00:00:00Z', '2026-11-25T00:00:00Z'] : ['2026-11-22T00:00:00Z', '2026-11-22T12:00:00Z', '2026-11-23T00:00:00Z', '2026-11-23T12:00:00Z', '2026-11-24T00:00:00Z', '2026-11-24T12:00:00Z', '2026-11-25T00:00:00Z'];
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
const legendShapes = '<div class="lg-key">' + [['c35', 'box 1'], ['r7', 'box 2'], ['r6', 'box 3'], ['lane', 'the lane’s own files']].map(([wh, t]) => '<span>' + ICON(shape(wh, 11, 9, 'cert-machine', 5), 22, 18) + esc(t) + '</span>').join('')
  + '<span>' + ICON(shape('r7', 11, 9, 'cert-machine', 5), 22, 18) + 'filled: ours</span><span>' + ICON(shape('r7', 11, 9, 'a model track', 5), 22, 18) + 'hollow: a model’s</span></div>';
const srcOf = (r) => r.src;
const ledgerList = (rows) => '<ol class="gts">' + rows.map((r) => '<li class="gt"><div class="gt-h">' + ICON(shape(r.where, 11, 9, r.side, 5), 22, 18) + '<span class="gt-t">' + esc(utc(r.at)) + ' · ' + esc(WHERE[r.where]) + '</span></div>'
  + '<p class="gt-c">' + esc(r.what) + '</p>' + (r.resolution ? '<p class="gt-l">' + esc(r.resolution) + '</p>' : '')
  + '<p class="gt-l"><b>Whose</b> ' + esc(r.whose) + ' · <b>caught by</b> ' + esc(r.caught_by) + ', ' + esc(r.how) + ' · <b>then</b> ' + esc(r.outcome) + '</p><p class="gt-s">' + C.breakable(srcOf(r)) + '</p></li>').join('') + '</ol>';
const FIVE = K.rows.filter((r) => r.mattered).sort((a, b) => a.mattered.n - b.mattered.n);
need(FIVE.length === 5, 'the ledger’s record does not mark five that mattered');
const STRIP = '<ol class="f5">' + FIVE.map((r) => '<li class="f5-i"><span class="f5-k">' + ICON(shape(r.where, 11, 9, r.side, 5), 22, 18) + esc(utc(r.at)) + ' · ' + esc(WHERE[r.where]) + '</span>'
  + '<span class="f5-t">' + esc(r.mattered.title) + '</span><span class="f5-d">' + esc(r.mattered.line) + '</span></li>').join('') + '</ol>';
const span = ((Date.parse(K.rows[K.rows.length - 1].at) - Date.parse(K.rows[0].at)) / 3600000);
const LEDGER = C.section({ lab: 'the corrections ledger', title: 'Every error caught, by whom and how', id: 'corrections', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw(V('corrections.json', '/counts/all') + ' errors in about ' + Math.round(span) + ' hours, ours and the models’ alike: '
    + V('corrections.json', '/counts/cert_machine') + ' by cert-machine and its agents, ' + V('corrections.json', '/counts/model_tracks') + ' by the two model tracks. '
    + V('corrections.json', '/counts/r6') + ' concern box 3; while it was sealed they were one line each, and since 25 November they carry their words and their sources. ' + (K.counts.open ? V('corrections.json', '/counts/open') + ' still open' : 'None is open') + '. Five that mattered:') + '</div>'
    + '<div class="wide">' + STRIP + '</div>'
    + '<div class="wide"><figure><div class="figbox dual"><div class="hv-w">' + ledgerSvg(false) + '</div><div class="hv-n">' + ledgerSvg(true) + '</div></div>'
    + '<figcaption data-record="' + ea(DIR + 'corrections.json@' + sha12(DIR + 'corrections.json')) + '">' + legendShapes + 'Each mark is one error, at the time it was recorded; hover or focus one to read it.</figcaption></figure></div>'
    + '<div class="wide"><details class="more"><summary>All ' + N(K.counts.all) + ', with sources</summary>' + ledgerList(K.rows) + '</details></div>' });

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
  { k: 'rented machines, box 3', vRaw: V('machine.json', '/now/rented/vcpu') + ' vCPU', nRaw: 'US$' + V('machine.json', '/now/rented/usd_per_hour', W.COMPUTED, 'raw') + ' an hour each, ' + esc(M.now.rented.state) },
  { k: 'GPT-6.2-astra sessions', vRaw: V('machine.json', '/now/astra/started'), nRaw: 'since ' + esc(utc(AS.since)) + ': ' + V('machine.json', '/now/astra/tasks') + ' tasks, ' + V('machine.json', '/now/astra/running') + ' running now' },
  { k: 'audit notes, boxes 1 and 2', vRaw: V('machine.json', '/audits/boxes_1_2'), nRaw: 'and ' + V('machine.json', '/audits/box_3') + ' on box 3' },
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

/* ---------------------------------------------------------------- the question from the ground up (the field map's content) */
const figRec = (file, cap) => '<figcaption data-record="' + ea(DIR + file + '@' + sha12(DIR + file)) + '">' + cap + '</figcaption>';
const dualFig = (w, n, cap, file) => '<div class="wide"><figure><div class="figbox dual"><div class="hv-w">' + w + '</div><div class="hv-n">' + n + '</div></div>' + figRec(file, cap) + '</figure></div>';
function ladderSvg(narrow) {
  const W0 = narrow ? 360 : 1000, H0 = narrow ? 250 : 260, x0 = narrow ? 34 : 60, x1 = W0 - 12, y0 = H0 - 46, top = 22, max = 44;
  const step = (x1 - x0) / FM.ladder.length, bw = Math.min(narrow ? 26 : 56, step * 0.62), y = (v) => y0 - (v / max) * (y0 - top);
  const o = ['<svg viewBox="0 0 ' + W0 + ' ' + H0 + '" role="img" aria-label="' + ea('Known values of R(3,k): ' + FM.ladder.map((d) => 'k = ' + d.k + ': ' + (d.value === null ? '40 or 41' : d.value)).join('; ')) + '">'];
  for (const v of [0, 10, 20, 30, 40]) o.push('<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke="var(--rule)" stroke-width="1"/><text x="' + (x0 - 8) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end" class="t-ax">' + v + '</text>');
  FM.ladder.forEach((d, i) => {
    const cx = x0 + step * i + step / 2;
    if (d.value === null) {
      o.push('<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + y(40).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (y0 - y(40)).toFixed(1) + '" rx="3" fill="var(--c-s4)"/>');
      o.push('<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + y(41).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (y(40) - y(41)).toFixed(1) + '" rx="2" fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="2 3"/>');
      o.push('<text x="' + cx.toFixed(1) + '" y="' + (y(41) - 7).toFixed(1) + '" text-anchor="middle" class="t-lab">40 or 41</text>');
    } else {
      o.push('<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + y(d.value).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (y0 - y(d.value)).toFixed(1) + '" rx="3" fill="var(--c-s4)"/>');
      o.push('<text x="' + cx.toFixed(1) + '" y="' + (y(d.value) - 7).toFixed(1) + '" text-anchor="middle" class="t-lab">' + d.value + '</text>');
    }
    o.push('<text x="' + cx.toFixed(1) + '" y="' + (y0 + 16) + '" text-anchor="middle" class="t-ax">' + d.k + '</text>');
  });
  o.push('<text x="' + ((x0 + x1) / 2) + '" y="' + (y0 + 36) + '" text-anchor="middle" class="t-note">k, the size of the forbidden independent set</text></svg>');
  return o.join('');
}
function nestedSvg(narrow) {
  const W0 = narrow ? 360 : 1000, rowH = narrow ? 30 : 28, top = 30, x0 = narrow ? 30 : 70, xm = narrow ? 200 : 560, H0 = top + FM.nested.length * rowH + 8;
  const w = (v) => (v / 40) * (xm - x0);
  const o = ['<svg viewBox="0 0 ' + W0 + ' ' + H0 + '" role="img" aria-label="' + ea('Choose j independent vertices; the vertices none of them touches number at most: ' + FM.nested.map((d) => 'j = ' + d.j + ': ' + d.cap).join(', ')) + '">'];
  o.push('<text x="' + (x0 - 8) + '" y="16" text-anchor="end" class="t-note">j</text><text x="' + x0 + '" y="16" class="t-note">at most this many untouched</text>' + (narrow ? '' : '<text x="' + (xm + 70) + '" y="16" class="t-note">graphs exactly at that cap</text>'));
  FM.nested.forEach((d, i) => {
    const yy = top + i * rowH;
    o.push('<text x="' + (x0 - 8) + '" y="' + (yy + 14) + '" text-anchor="end" class="t-lab">' + d.j + '</text>');
    if (d.cap > 0) o.push('<rect x="' + x0 + '" y="' + (yy + 2) + '" width="' + w(d.cap).toFixed(1) + '" height="16" rx="3" fill="' + (d.j === 0 ? 'none' : 'var(--c-s4)') + '"' + (d.j === 0 ? ' stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="2 3"' : '') + '/>');
    o.push('<text x="' + (x0 + w(d.cap) + 8).toFixed(1) + '" y="' + (yy + 14) + '" class="t-lab">' + d.cap + (narrow ? '' : '') + '</text>');
    if (!narrow) o.push('<text x="' + (xm + 70) + '" y="' + (yy + 14) + '" class="t-note">' + esc(d.by + ' · ' + d.count) + '</text>');
    else o.push('<text x="' + (x0 + w(d.cap) + 34).toFixed(1) + '" y="' + (yy + 14) + '" class="t-note">' + esc(d.count.replace(/ graphs?$/, '').replace(/: .*/, '')) + '</text>');
  });
  o.push('</svg>');
  return o.join('');
}
function slackSvg(narrow) {
  const W0 = narrow ? 360 : 1000, H0 = 250, x0 = narrow ? 36 : 60, x1 = W0 - 10, top = 20, bot = 190, min = -6, max = 14;
  const step = (x1 - x0) / FM.slack.length, bw = Math.min(48, step * 0.55), y = (v) => bot - ((v - min) / (max - min)) * (bot - top);
  const o = ['<svg viewBox="0 0 ' + W0 + ' ' + H0 + '" role="img" aria-label="' + ea('The slack left by counting in the regular case: ' + FM.slack.map((d) => d.n + ' vertices, ' + (d.slack > 0 ? '+' : '') + d.slack).join('; ')) + '">'];
  for (const v of [-5, 0, 5, 10]) o.push('<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke="' + (v === 0 ? 'var(--rule-strong)' : 'var(--rule)') + '" stroke-width="1"/><text x="' + (x0 - 8) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end" class="t-ax">' + (v > 0 ? '+' : '') + v + '</text>');
  FM.slack.forEach((d, i) => {
    const cx = x0 + step * i + step / 2, open = d.n === 40, yy = Math.min(y(d.slack), y(0)), hh = Math.max(2, Math.abs(y(d.slack) - y(0)));
    o.push('<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="3" fill="' + (open ? 'none' : 'var(--c-s4)') + '"' + (open ? ' stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="2 3"' : '') + '/>');
    o.push('<text x="' + cx.toFixed(1) + '" y="' + (d.slack < 0 ? y(d.slack) + 15 : y(d.slack) - 7).toFixed(1) + '" text-anchor="middle" class="t-lab">' + (d.slack > 0 ? '+' : '') + d.slack + '</text>');
    o.push('<text x="' + cx.toFixed(1) + '" y="' + (bot + 18) + '" text-anchor="middle" class="t-ax">' + d.n + '</text>');
    o.push('<text x="' + cx.toFixed(1) + '" y="' + (bot + 34) + '" text-anchor="middle" class="t-note">' + (open ? 'open' : d.slack < 0 ? 'by counting' : 'closed') + '</text>');
  });
  o.push('<text x="' + x0 + '" y="' + (bot + 54) + '" class="t-note">vertices, regular case</text></svg>');
  return o.join('');
}
function reachSvg(narrow) {
  const rows = FM.methods.map((m) => ({ v: m.reach, name: m.name, pub: false })).concat(FM.published.map((p) => ({ v: p.reach, name: 'published, ' + p.year + ', with a census of the level below', pub: true })));
  const W0 = narrow ? 360 : 1000, lab = narrow ? 0 : 400, x0 = lab + (narrow ? 8 : 16), x1 = W0 - 30, rh = narrow ? 12 : 15, top = 22, lo = 38, hi = 47;
  const H0 = top + rows.length * rh + 30, x = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
  const o = ['<svg viewBox="0 0 ' + W0 + ' ' + H0 + '" role="img" aria-label="' + ea('Reach of ' + FM.methods.length + ' measured methods at k = 10, the smallest number of vertices each proves impossible: ' + FM.methods.map((m) => m.name + ' ' + m.reach).join('; ') + '; the published proofs reached 42 (2013) and 41 (2025) with a census of the level below; the answer is 40 or 41') + '">'];
  for (const v of [40, 41]) o.push('<line x1="' + x(v).toFixed(1) + '" x2="' + x(v).toFixed(1) + '" y1="' + (top - 8) + '" y2="' + (H0 - 24) + '" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="2 3"/>');
  o.push('<text x="' + x(40.5).toFixed(1) + '" y="' + (top - 10) + '" text-anchor="middle" class="t-note">the answer: 40 or 41</text>');
  rows.forEach((r, i) => {
    const yy = top + i * rh;
    o.push('<rect x="' + x0 + '" y="' + (yy + 1) + '" width="' + (x(r.v) - x0).toFixed(1) + '" height="' + (rh - 4) + '" rx="2" fill="' + (r.pub ? 'none' : 'var(--c-s4)') + '"' + (r.pub ? ' stroke="var(--ink)" stroke-width="1.2"' : '') + '><title>' + esc('Reach ' + r.v + ': ' + r.name) + '</title></rect>');
    o.push('<text x="' + (x(r.v) + 5).toFixed(1) + '" y="' + (yy + rh - 4) + '" class="t-ax">' + r.v + '</text>');
    if (!narrow) o.push('<text x="' + lab + '" y="' + (yy + rh - 4) + '" text-anchor="end" class="t-note">' + esc(r.name.length > 58 ? r.name.slice(0, 56) + '…' : r.name) + '</text>');
  });
  for (const v of [38, 40, 42, 44, 46]) o.push('<text x="' + x(v).toFixed(1) + '" y="' + (H0 - 8) + '" text-anchor="middle" class="t-ax">' + v + '</text>');
  o.push('</svg>');
  return o.join('');
}
const PHANT = '<div class="cardgrid g3">' + FM.phantoms.map((p) => '<article class="card"><span class="card-k">' + ICON(glyphOut('FAIL', 11, 9), 22, 18) + esc(p.blind) + '</span><h3>' + esc(p.name) + '</h3><p>' + esc(p.what) + '</p><p class="card-d">' + esc(p.why) + '</p></article>').join('') + '</div>';
const EXPLAIN = C.section({ lab: 'the question, from the ground up', title: 'Two rules that pull against each other', id: 'explain', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Take 40 points and join some pairs. Two rules: no three points all joined to each other, and no ten points with no line among them. Lines kill the unjoined sets; too many lines close a triangle. If no drawing obeys both rules, R(3,10) = 40; if one does, it is 41.') + '</div>'
    + '<div class="col"><h3 class="lg-h">Inside the 40-point question sits every smaller one</h3>' + C.pRaw('Pick j points with no lines among them. The points none of them touches must obey the same two rules with 10 − j in place of 10, so their number is capped by a smaller Ramsey number, and those are all known exactly. In the hard case every point has 9 neighbours and leaves 30 untouched, under the cap of 35.') + '</div>'
    + dualFig(nestedSvg(false), nestedSvg(true), 'Bars: the most points that can stay untouched after j independent points are chosen; beside them, how many graphs exist exactly at that cap (every one on disk). Only the top, 40 itself, is unknown.', 'fieldmap.json')
    + '<div class="col"><h3 class="lg-h">The ladder: seven rungs are solid</h3>' + C.pRaw('R(3,k) is the first number of points at which no triangle and no independent k-set cannot both hold. Up to 23 there is a proof a person can read; 28 and 36 needed a computer.') + '</div>'
    + dualFig(ladderSvg(false), ladderSvg(true), FM.ladder.map((d) => 'R(3,' + d.k + '): ' + d.why).map(esc).join(' '), 'fieldmap.json')
    + '<div class="col"><h3 class="lg-h">Why 40 is different: the slack is 13</h3>' + C.pRaw('In the hard, regular case the untouched part of each point has a fixed number of lines. Counting works when that number falls below the fewest lines such a graph can have. The bars show how far above the minimum it lands. No regular case ever closed had more than 5.') + '</div>'
    + dualFig(slackSvg(false), slackSvg(true), FM.slack.map((d) => d.n + ' points (' + d.k + '): ' + d.why).map(esc).join(' ') + ' Two programs derived these terms from published tables.', 'fieldmap.json')
    + '<div class="col"><h3 class="lg-h">The reach of methods: none gets under 43</h3>' + C.pRaw('Each method was run on the solved rungs first, then at k = 10. Its reach is the smallest number of points it can prove impossible; the answer needs 40. One more method, colouring, reaches only 82.') + '</div>'
    + dualFig(reachSvg(false), reachSvg(true), 'Filled bars: the ' + N(FM.methods.length) + ' methods measured here, each to the smallest number of vertices it can prove impossible. Outlined bars: the published bounds, which needed years of computing and a list of part of the level below.', 'fieldmap.json')
    + '<div class="col"><h3 class="lg-h">Three phantoms explain almost every failure</h3>' + C.pRaw('A phantom passes all of a method’s checks without being a graph on 40 points. A method that accepts a phantom can never prove that 40 is impossible.') + '</div>'
    + '<div class="wide">' + PHANT + '</div>'
    + '<div class="col"><div class="note"><span class="lab">a fourth fact, not a phantom</span>' + C.pRaw(esc(FM.fourth) + ' ' + esc(FM.not_fooled)) + '</div></div>' });

/* ---------------------------------------------------------------- the lane's own map of strata */
const STRATA = C.section({ lab: 'where a counterexample could still hide', title: 'Every stratum, and how far it has got', id: 'strata', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Any (3,10;40)-graph may be taken maximal triangle-free, so it falls in exactly one stratum below. A proof of R(3,10) = 40 has to empty all of them. The hard half is the regular one, split by its largest codegree c*: the most neighbours two unjoined vertices have in common.') + '</div>'
    + '<div class="wide"><div class="cardgrid g3">' + FM.strata.map((s, i) => '<article class="card"><span class="card-k">' + esc(s.state) + '</span><h3>' + esc(s.k) + '</h3><p class="card-d">' + esc(s.what) + '</p>'
      + (s.of ? '<svg class="meter" viewBox="0 0 200 8" preserveAspectRatio="none" role="img" aria-label="' + ea(s.done + ' of ' + s.of + ' ' + s.unit) + '"><rect x="0" y="0" width="200" height="8" rx="4" fill="var(--mark)"/>'
        + (s.done ? '<rect x="0" y="0" width="' + Math.max(4, 200 * s.done / s.of).toFixed(1) + '" height="8" rx="4" fill="var(--ink)"/>' : '') + '</svg><p class="card-n">' + V('fieldmap.json', '/strata/' + i + '/done') + ' of ' + V('fieldmap.json', '/strata/' + i + '/of') + ' ' + esc(s.unit) + '</p>' : '')
      + '<p>' + esc(s.text) + '</p></article>').join('') + '</div></div>'
    + '<div class="col">' + C.pRaw(esc(FM.settled)) + '</div>' });

/* ---------------------------------------------------------------- the whole process */
const OUTWORD = { PASS: 'pass', FAIL: 'fail', PARTIAL: 'partial', CONFIRMED: 'confirmed', 'NOT CONFIRMED': 'not confirmed', OPEN: 'open', DEAD: 'dead', UNDECIDED: 'undecided', RUNNING: 'running' };
function glyphOut(o, x0, y0) {   const x = Number(x0), y = Number(y0);   /* an outcome by shape, never by colour: filled = stands, cross = failed, half = partial, ring = open */
  const st = 'stroke="var(--ink)" stroke-width="1.5"';
  if (o === 'PASS') return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="var(--ink)"/>';
  if (o === 'CONFIRMED') return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="var(--ink)"/><circle cx="' + x + '" cy="' + y + '" r="7.5" fill="none" ' + st + '/>';
  if (o === 'FAIL' || o === 'DEAD' || o === 'NOT CONFIRMED') return '<path d="M' + (x - 4.5) + ' ' + (y - 4.5) + ' L' + (x + 4.5) + ' ' + (y + 4.5) + ' M' + (x + 4.5) + ' ' + (y - 4.5) + ' L' + (x - 4.5) + ' ' + (y + 4.5) + '" ' + st + ' fill="none"/>' + (o === 'DEAD' ? '<rect x="' + (x - 7) + '" y="' + (y - 7) + '" width="14" height="14" fill="none" stroke="var(--ink-3)" stroke-width="1"/>' : '');
  if (o === 'PARTIAL') return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="none" ' + st + '/><path d="M' + x + ' ' + (y - 5) + ' A5 5 0 0 1 ' + x + ' ' + (y + 5) + 'Z" fill="var(--ink)"/>';
  return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="none" ' + st + '/>';
}
const GT0 = Date.parse('2026-11-24T00:00:00Z'), GT1 = Date.parse('2026-11-26T10:00:00Z');
function gatesSvg(narrow) {
  const w = narrow ? 360 : 1000, L = narrow ? 10 : 20, R = 12, top = 24, lane = narrow ? 13 : 15;
  const X = (iso) => L + (Date.parse(iso) - GT0) / (GT1 - GT0) * (w - L - R);
  const kinds = ['PASS', 'CONFIRMED', 'PARTIAL', 'OPEN', 'UNDECIDED', 'FAIL', 'DEAD', 'NOT CONFIRMED'];
  const bins = {}, marks = [];
  let maxY = 0;
  for (const g of PR.gates) { const b = Math.round((Date.parse(g.ruled) - GT0) / (narrow ? 5400000 : 2400000)); const k = bins[b] = (bins[b] || 0) + 1; const y = top + 10 + (k - 1) * lane; maxY = Math.max(maxY, y); marks.push([g, X(g.ruled), y]); }
  const h = maxY + 46;
  const o = ['<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + ea(PR.gates.length + ' gates ruled between 24 and 26 November on a time axis, each drawn by its outcome: ' + Object.entries(PR.tally).map(([k, v]) => v + ' ' + OUTWORD[k]).join(', ')) + '">'];
  const ticks = narrow ? ['2026-11-24T12:00:00Z', '2026-11-25T00:00:00Z', '2026-11-25T12:00:00Z', '2026-11-26T00:00:00Z'] : ['2026-11-24T06:00:00Z', '2026-11-24T12:00:00Z', '2026-11-24T18:00:00Z', '2026-11-25T00:00:00Z', '2026-11-25T06:00:00Z', '2026-11-25T12:00:00Z', '2026-11-25T18:00:00Z', '2026-11-26T00:00:00Z', '2026-11-26T06:00:00Z'];
  for (const t of ticks) { const x = X(t), d = new Date(t), lab = d.getUTCHours() === 0 ? d.getUTCDate() + ' Nov' : String(d.getUTCHours()).padStart(2, '0') + ':00';
    o.push('<line x1="' + x.toFixed(1) + '" y1="' + (top - 4) + '" x2="' + x.toFixed(1) + '" y2="' + (h - 30) + '" stroke="var(--rule)" stroke-width="1"/><text x="' + x.toFixed(1) + '" y="' + (h - 14) + '" text-anchor="middle" class="t-ax">' + esc(lab) + '</text>'); }
  for (const [g, x, y] of marks) o.push('<g class="lg-m" tabindex="0" data-cm="' + ea(g.id + ' · ' + utc(g.ruled) + ' · ' + OUTWORD[g.outcome]) + '" data-cmv="' + ea(g.count) + '">' + glyphOut(g.outcome, x.toFixed(1), y) + '</g>');
  o.push('<text x="' + (w - R) + '" y="' + (h - 2) + '" text-anchor="end" class="t-note">UTC, when the control room ruled</text></svg>');
  need(kinds.every((k) => k) && h < 600, 'the gates figure stacks too high');
  return o.join('');
}
const gateKey = '<div class="lg-key">' + ['PASS', 'CONFIRMED', 'PARTIAL', 'OPEN', 'FAIL', 'DEAD'].map((k) => '<span>' + ICON(glyphOut(k, 11, 9), 22, 18) + esc(OUTWORD[k]) + (k === 'OPEN' ? ' or undecided' : k === 'FAIL' ? ' or not confirmed' : '') + '</span>').join('') + '</div>';
const gateCard = (g) => '<li class="gt"><div class="gt-h">' + ICON(glyphOut(g.outcome, 11, 9), 22, 18) + '<b class="m">' + esc(g.id) + '</b><span class="gt-o">' + esc(OUTWORD[g.outcome]) + '</span><span class="gt-t">' + esc(utc(g.ruled)) + '</span></div>'
  + '<p class="gt-c">' + esc(g.count) + '</p><p class="gt-l"><b>Passes when</b> ' + esc(g.condition) + (g.condition_written_first ? '' : ' <em>(sent in a message, never written to disk: the ledger’s words)</em>') + '</p>'
  + '<p class="gt-l"><b>What it ruled</b> ' + esc(g.ruled_out) + '</p><p class="gt-s">' + esc(g.line) + ' · condition: ' + C.breakable(g.condition_src || 'the ledger') + (g.report ? ' · report: ' + C.breakable(g.report) : '') + ' · ruling: ' + C.breakable(g.src) + '</p></li>';
/* round 6's source, credited as the operator asked: what was kept and what was parked */
const XN = PR.external_note;
const XNOTE = '<p class="gt-l"><b>Its source</b> ' + esc(XN.credit.charAt(0).toUpperCase() + XN.credit.slice(1)) + ' (' + esc(XN.language) + ', ' + esc(XN.written) + '). ' + esc(XN.label) + '</p>'
  + '<p class="gt-l"><b>Kept</b> ' + XN.kept.map((k) => esc(k.route) + ': ' + esc(k.text)).join(' ') + '</p>'
  + '<p class="gt-l"><b>Parked</b> ' + XN.parked.map((k) => esc(k.route) + ': ' + esc(k.text)).join(' ') + '</p>'
  + '<p class="gt-s">note: ' + C.breakable(XN.src) + ' · triage: ' + C.breakable(XN.triage) + '</p>';
const roundsHtml = PR.rounds.map((r) => { const gs = PR.gates.filter((g) => g.round === r.round);
  const t = {}; for (const g of gs) t[g.outcome] = (t[g.outcome] || 0) + 1;
  return '<details class="more rd"><summary>' + (r.round === '41' ? 'The 41 side' : 'Round ' + esc(r.round)) + ', from ' + esc(r.opened.length > 10 ? utc(r.opened) : r.opened.slice(8, 10).replace(/^0/, '') + ' Nov') + ': ' + esc(r.plain) + (gs.length ? ' <span class="rd-n">' + N(gs.length) + ' gate' + (gs.length === 1 ? '' : 's') + ': ' + Object.entries(t).map(([k, v]) => v + ' ' + OUTWORD[k]).join(', ') + '</span>' : '') + '</summary>'
    + (r.round === '6' ? XNOTE : '') + (gs.length ? '<ol class="gts">' + gs.map(gateCard).join('') + '</ol>' : '<p class="gt-l">No gate is ruled in this round’s rows; its ideas and checks are in the ledger’s first table.</p>') + '</details>'; }).join('');
const RUNNOW = '<div class="cardgrid g3">' + PR.running.map((r, i) => '<article class="card run"><span class="card-k">' + ICON(glyphOut('OPEN', 11, 9), 22, 18) + (r.running ? 'running now' : r.stopped ? 'stopped, no verdict' : 'idle') + '</span><h3>' + esc(r.line) + (r.running || r.stopped ? ', gate ' + esc(r.gate) : '') + '</h3>'
  + (r.running ? '<p><b>Passes when</b> ' + esc(r.condition.replace(/^PASS when /, '')) + '.</p><p class="card-d">Task ' + V('process.json', '/running/' + i + '/task') + ' of this session, started ' + esc(utc(r.resumed)) + '; budget ' + esc(r.budget || 'as briefed') + '.</p>'
    + (r.checkpoint ? '<p class="card-d">Its own newest checkpoint (' + esc(r.checkpoint.hhmm_utc) + ' UTC), not a ruling: <span class="m">' + esc(r.checkpoint.line) + '</span></p>' : '<p class="card-d">No checkpoint written yet for this gate.</p>')
    : r.stopped ? '<p><b>Would pass when</b> ' + esc(r.condition.replace(/^PASS when /, '')) + '.</p><p class="card-d">Task ' + V('process.json', '/running/' + i + '/task') + ' of this session, started ' + esc(utc(r.resumed)) + '; its run file ends ' + esc(utc(r.ended)) + ' with exit ' + V('process.json', '/running/' + i + '/exit') + ': ' + esc(r.why) + '. Its partial work stays in ' + C.breakable(r.work) + ', not accepted.</p>'
    : '<p>' + esc(r.last) + '</p>') + '</article>').join('') + '</div>';
const NRUN = PR.running.filter((r) => r.running).length;
const RUNHEAD = NRUN ? 'Running now' : 'Running now: nothing';
const RUNINTRO = (PR.stopped ? esc(PR.stopped.text) + ' ' : '') + 'Read from the ' + N(PR.running.length) + ' sessions’ own run files at the records’ minute' + (PR.stopped ? ' and from the ledger (' + esc(PR.stopped.src) + ')' : '') + '. A checkpoint is the session’s own words; a gate counts only when the control room rules it.';
const FUNNEL = '<ol class="pl">' + FM.funnel.map(([t, d], i) => '<li class="pl-s"><span class="pl-n">' + (i + 1) + '</span><span class="pl-t">' + esc(t) + '</span><span class="pl-d">' + esc(d) + '</span></li>').join('') + '</ol>';
const EARLY = '<details class="more rd"><summary>Before the attack on 40: the control room’s ' + N(PR.early.rounds.length) + ' rounds of 22 and 23 November (Theorem C35, Case R(7), Case R(6)), as its log heads them</summary><ol class="early">'
  + PR.early.rounds.map((e) => '<li><b class="m">' + e.n + '</b> ' + esc(e.heading) + '</li>').join('') + '</ol><p class="gt-s">Source: ' + esc(PR.early.src) + ', published in the record below.</p></details>';
const PROCESS = C.section({ lab: 'the whole process', title: 'Every gate, the dead ends with the passes', id: 'process', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Brute force was ruled out, so ideas are cheap and tests must be cheaper. Every idea gets a row before work starts, is tried first where the answer is known, and is ruled against a gate written before its run. A failed gate leaves with the number that killed it.') + '</div>'
    + '<div class="wide">' + FUNNEL + '</div>'
    + '<div class="col">' + C.pRaw(esc(FM.bench)) + '</div>'
    + '<div class="col">' + C.pRaw(N(PR.gates.length) + ' gates and measured rows ruled from 24 to 26 November: ' + Object.entries(PR.tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => N(v) + ' ' + esc(OUTWORD[k])).join(', ') + '. Each is shown with its pass condition, its count and what it ruled out; a failure gets the same space as a pass.') + '</div>'
    + '<div class="wide"><figure><div class="figbox dual"><div class="hv-w">' + gatesSvg(false) + '</div><div class="hv-n">' + gatesSvg(true) + '</div></div>' + figRec('process.json', gateKey + 'Each mark is one gate at the time the control room ruled it; hover or focus one to read its count.') + '</figure></div>'
    + '<div class="col"><h3 class="lg-h">' + esc(RUNHEAD) + '</h3>' + C.pRaw(RUNINTRO) + '</div>'
    + '<div class="wide">' + RUNNOW + '</div>'
    + '<div class="col"><h3 class="lg-h">Round by round</h3></div><div class="wide rds">' + EARLY + roundsHtml + '</div>'
    + '<div class="col"><h3 class="lg-h">The tools of the funnel</h3>' + C.plainList(FM.tools.map(({ b, t }) => ({ b: b + '.', text: t }))) + '</div>' });

/* ---------------------------------------------------------------- the path ledger */
const PCLS = { dead: 'dead', stands: 'stands', open: 'open or partial', running: 'running', queued: 'queued' };
const pathCard = (r) => '<li class="gt"><div class="gt-h">' + ICON(glyphOut(r.class === 'dead' ? 'DEAD' : r.class === 'stands' ? 'PASS' : r.class === 'open' ? 'PARTIAL' : 'OPEN', 11, 9), 22, 18) + '<b class="m">' + esc(r.id) + '</b><span class="gt-o">' + esc(PCLS[r.class]) + '</span>' + (r.family ? '<span class="gt-t">' + esc(r.family) + '</span>' : '') + '</div>'
  + '<p class="gt-c">' + esc(r.path) + '</p><p class="gt-l"><b>Status</b> ' + esc(r.status) + '</p>' + (r.later ? '<p class="gt-l"><b>Later, in the ledger</b> ' + esc(r.later) + '</p>' : '') + '<p class="gt-s">' + C.breakable(r.by) + '</p></li>';
const PATHS = C.section({ lab: 'the path ledger', title: 'Every route tried or queued, and what happened to it', id: 'paths', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw(N(PA.rows.length) + ' paths toward 40: ' + Object.entries(PA.tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => N(v) + ' ' + esc(PCLS[k])).join(', ') + '. A path is dead only with the number that killed it, and survives only after a second program reproduces it. Then ' + N(PA.side41.rows.length) + ' rows on the 41 side: the search for one (3,10;40)-graph, which would make R(3,10) = 41.') + '</div>'
    + '<div class="wide"><details class="more"><summary>The ' + N(PA.rows.length) + ' paths toward 40</summary><ol class="gts">' + PA.rows.map(pathCard).join('') + '</ol></details>'
    + '<details class="more"><summary>The ' + N(PA.side41.rows.length) + ' rows of the 41 side</summary><ol class="gts">' + PA.side41.rows.map(pathCard).join('') + '</ol></details></div>' });

/* ---------------------------------------------------------------- open questions, forecasts, words */
const QUESTIONS = C.section({ lab: 'where an idea could enter', title: 'Six questions open in the plain sense', id: 'questions', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('None of these needs the machinery. Each is a place where a new way of looking would change what gets tried next.') + '</div>'
    + '<div class="wide"><div class="cardgrid g3">' + FM.questions.map((q) => '<article class="card"><h3>' + esc(q.q) + '</h3><p>' + esc(q.text) + '</p></article>').join('') + '</div></div>' });
const FC = FM.forecasts;
const FORECASTS = C.section({ lab: 'forecasts, not facts', title: 'Three bets, and what would move them', id: 'forecasts', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('These are forecasts, written in the lane’s private field map at ' + esc(utc(FC.at)) + '. Nothing decided them and nothing on this page rests on them. They are set apart in their own type and frame so that they cannot be read as results.') + '</div>'
    + '<div class="wide"><div class="fc-grid">' + FC.items.map((f) => '<div class="fc"><span class="fc-k">forecast</span><span class="fc-v">' + esc(f.value) + '</span><span class="fc-d">' + esc(f.what) + '</span></div>').join('') + '</div></div>'
    + '<div class="col"><p class="fc-note">' + esc(FC.moves) + '</p></div>' });
const GLOSSARY = C.section({ lab: 'words', title: 'Glossary', id: 'glossary',
  bodyRaw: C.plainList(FM.glossary.map((g) => ({ b: g.word + '.', text: g.def }))) });

/* ---------------------------------------------------------------- credits */
const CREDITS = C.section({ lab: 'credits', title: 'Whose work this is', id: 'credits', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Carlos Toledo ran the lane: the target, the tracks side by side, every go and every cost. The work was done with Claude Opus 5.5 and Claude Fable 5.2 (Anthropic) and GPT-6.2-astra (OpenAI, in Codex), each model read from the session that wrote each file.') + '</div>'
    + C.table({ cols: [{ h: 'who' }, { h: 'model' }, { h: 'what' }], rows: BX.credits.map((c) => [{ raw: '<b>' + esc(c.who) + '</b>' }, c.model, c.what]) })
    + '<div class="col">' + C.plainList([
      { b: 'Cited first.', text: 'Exoo: the 39-vertex graph and R(3,10) ≥ 40. Kalbfleisch: the circulant C35(1,7,11,16), in his 1966 thesis, as Goedgebeur and Radziszowski credit it. Goedgebeur and Radziszowski: R(3,10) ≤ 42, the uniqueness of the (3,9;35)-graph, e(3,8,27) = 85 and the tables. Brinkmann and Goedgebeur: the complete list of (3,8;27)-graphs (2012). McKay: the graph lists. Angeltveit: R(3,10) ≤ 41. Zhiyang Chen: the case R(7), its Lemma R7, the report, the run and C-004. Unsolved Lab and andrey-kokoev/marici: the induced-C35 question posed. Daugherty, Ward and Ryan, McCrea, Pandey and Ravi, algal-lab: the earlier results on the map.' },
      { b: 'An external note.', text: 'Round 6 began from ' + XN.credit + ', written on 25 November. Kept: ' + XN.kept.map((k) => k.route).join(' and ') + ', each re-derived by a fresh agent before use (X1). Parked: ' + XN.parked.map((k) => k.route).join(' and ') + ', each with the measured trigger that would reopen it.' },
      { b: 'Tools.', text: 'CaDiCaL 3.0.1 (Biere); lrat-check from drat-trim (Heule); cake_lpr, the formally verified checker (Heule, Myreen, Tan); Lean 4.35.0 and Mathlib; nanoda; con-leche; kissat; nauty; OpenTimestamps.' }]) + '</div>'
  });

/* ---------------------------------------------------------------- what is not established (first) */
const GAPS = '<div class="col"><div class="note ne"><span class="lab">what is not established, first</span>' + C.plainList([
  { b: 'R(3,10) is open.', text: '40 ≤ R(3,10) ≤ 41 still stands. Neither opened result decides it, and nothing here moves its value.' },
  { b: 'Case R(7) was closed first by someone else.', text: 'Zhiyang Chen’s own AI run excluded it on 21 November. Ours is a second computation of it, and it holds only under six premises the run does not check.' },
  { b: 'Nobody outside has read any of it.', text: 'No referee, no outside replay, no reply. Most sources on the map are unrefereed too, and each is marked.' },
  { b: 'One person, models of two families, no second party.', text: 'The tracks are AI sessions working for one person. “Own” and “independent” mean code written without reading the other track’s code, nothing more.' },
  { b: 'Case R(6) is not closed.', text: 'One of its branches, three cross-edges, is computed here under six premises, with a second program for the counting only. Of the four-edge branch only a 20-core cost pilot ran; five to nine cross-edges were not run.' },
  { b: 'Most of the attack on 40 failed, and says so.', text: 'Every gate is shown with its outcome. The passes are partial results inside one stratum or another; none closes a stratum of the regular case.' },
  { b: 'The map is a reading.', text: 'It is the known reduction as read from the sources on a date, not a proof that its cases cover every graph.' }]) + '</div></div>';

/* ---------------------------------------------------------------- why you can trust this (one click down) */
const RECS = ['cases.json', 'boxes.json', 'corrections.json', 'machine.json', 'replay.json', 'process.json', 'paths.json', 'fieldmap.json', 'sources/MANIFEST.json', 'page-log.json'];
const trustBody = [
  C.pRaw('<b>Every number on this page is read from a record.</b> The records below are written from the lane’s own files by <span class="m">tools/r310-live-records.js</span>, which refuses when a source no longer says what a record states; this page is built from them by <span class="m">tools/build-r310-live.js</span>, which refuses when they disagree.'),
  '<ul class="tl-list">' + RECS.map((f) => '<li><span class="m">' + esc(DIR + f) + '</span> <span class="hx">' + sha12(DIR + f) + '</span><br>' + esc(J(f).what) + '</li>').join('') + '</ul>',
  C.pRaw('<b>The sources.</b> The records cite ' + N(CASES.sources.length) + ' files of the lane by a phrase each must contain; their hashes are fixed here so that the files, when they open, can be checked against them:'),
  '<ul class="tl-list">' + CASES.sources.map((s) => '<li><span class="m">' + C.breakable(s.file) + '</span> <span class="hx">' + esc(s.sha256_12) + '</span></li>').join('') + '</ul>',
  C.pRaw('<b>The sources, published.</b> ' + N(MAN.files.filter((f) => f.published).length) + ' of the ' + N(MAN.files.length) + ' cited files are public in <a href="' + ea(SRC_URL) + '">corpus/r310-live/sources/</a>, copied after a redaction pass; <span class="m">sources/MANIFEST.json</span> names every withheld line (' + N(MAN.files.reduce((t, f) => t + (f.withheld ? f.withheld.length : 0), 0)) + ' in all) with its reason. Not republished, and why:'),
  '<ul class="tl-list">' + MAN.files.filter((f) => !f.published).map((f) => '<li><span class="m">' + C.breakable(f.file) + '</span>: ' + esc(f.why) + '</li>').join('') + '</ul>',
  C.pRaw('<b>Box 3’s ledger</b> (one row per core, ' + N(B3.ledger.bytes) + ' bytes) is <span class="m">' + esc(B3.ledger.file) + '</span>, sha256 <span class="hx">' + esc(B3.ledger.sha256) + '</span>; the final hash list that block 977301 confirms, <span class="m">FINAL.sha256</span>, has sha256 <span class="hx">' + esc(B3.ledger.final_sha256) + '</span>; the catalogue of 23,409 cores, sha256 <span class="hx">' + esc(B3.catalogue.sha256) + '</span>; the bundle of the run, sha256 <span class="hx">' + esc(B3.bundle_sha256) + '</span>. While box 3 was sealed, its corrections cited their source lines by hash; they now cite the files.'),
  C.pRaw('<b>The seal, opened.</b> On 25 November 2026 the operator answered a dialog with the options spelled out: “' + esc(B3.opened.words) + '”. The lane’s privacy ended that night: box 3, the whole process and the working files are public, and the anchors shown while it was sealed are kept.'),
  C.pRaw('<b>The seals.</b> Box 1’s digest is <span class="hx">' + esc(B1.seal.digest) + '</span> (line ' + B1.seal.registry_line + ' of <span class="m">seals/registry.jsonl</span>, Bitcoin block ' + B1.seal.block + '); box 2’s is <span class="hx">' + esc(B2.seal.digest)
    + '</span> (line ' + B2.seal.registry_line + ', block ' + B2.seal.block + '). An opened seal publishes its files, salt and manifest, and anyone re-derives the digest with <span class="m">instruments/seal/</span>. The opened seals and the record: '
    + (OPENED_UTC ? '<a href="' + ea(RECORD_URL) + '">corpus/r310-c35-r7/ in the cert-machine repository</a>.' : 'published at launch, in the cert-machine repository at <span class="m">corpus/r310-c35-r7/</span>.') + ' A seal proves possession by a date, nothing else.'),
  C.pRaw('<b>The R(7) ledger</b> is published as a sealed reveal package (index ' + B2.ledger_release.index + ') in <a href="' + ea(B2.ledger_release.url) + '">the release r310-r7-ledger-2026-11-23</a>: <span class="m">' + esc(B2.ledger_release.package) + '</span>, sha256 <span class="hx">'
    + esc(B2.ledger_release.package_sha256) + '</span>; the ledger inside it, <span class="m">prod.tsv</span>, sha256 <span class="hx">' + esc(B2.ledger_release.prod_sha256) + '</span>.'),
  C.pRaw('<b>The two regenerated configurations</b> (' + B2.regenerated.ids.map((x) => N(x).replace(/,/g, '')).join(' and ') + '): the kit is <a href="' + ea(B2.regenerated.kit_url) + '">' + esc(B2.regenerated.kit) + '</a>, with a README and <span class="m">' + esc(B2.regenerated.tar) + '</span>, sha256 <span class="hx">' + esc(B2.regenerated.tar_sha256) + '</span>.'),
  C.pRaw('<b>Chen’s claim C-004</b> is commit <span class="m">' + esc(CASES.chen_c004.commit) + '</span> of github.com/jeffchen006/Ramsey-R3-10, committed ' + esc(utcs(CASES.chen_c004.at)) + ' (the committer’s clock).'),
  C.pRaw('<b>What the build refuses.</b> The page is not built when: the replay’s counts are not box 2’s; box 2’s levels do not sum to its configurations; box 3’s tally does not sum (refuted and open make the screened records; the two machines make the 23,409 cores) or its map node says decided; a correction has no source; the gates’ tally is not the gates’; the sources manifest misses a cited file; the newest change-log entry is not the records’ state, or no entry says the seal was opened; a forecast’s type appears outside the forecasts section; the opening time is unset outside a preview. The records tool refuses before that when a source no longer says what a record states, or when box 3’s ledger, recounted row by row, does not give its tally.'),
  C.pRaw('<b>How to read a mark.</b> A plain number is decided: exact arithmetic or a checker backs it. A number underlined in dashes is computed or quoted: someone printed it and nothing here decided it (a price, a claimant’s count).'),
  W.legendHtml()];
const TRUST = C.section({ lab: 'one click down', title: 'Why you can trust this', id: 'trust', wide: true,
  bodyRaw: '<div class="wide"><details class="more trust"><summary>The records, the hashes and the rules</summary><div class="col">' + trustBody.join('\n') + '</div></details></div>' });

/* ---------------------------------------------------------------- changes */
const CHANGES = C.section({ lab: 'changes', title: 'Changes to this page', id: 'changes',
  bodyRaw: C.plainList(LOGE.slice().reverse().map((e) => ({ b: e.at.replace('T', ' ').replace('Z', ' UTC') + '.', text: e.what + (e.box3 ? ' (Box 3 ' + e.box3 + '; ' : ' (Box 3 at ' + e.progress_percent + '%; ') + e.corrections + ' corrections.)' }))) });

/* ---------------------------------------------------------------- the page */
const TITLE = 'R(3,10), in the open';   /* the operator's title and URL, from REVEAL-v2 */
const HEADER = C.header({ eyebrow: 'Carlos Toledo · live research and its verification', title: TITLE,
  deck: 'Is there a graph on 40 vertices with no triangle and no 10 vertices pairwise unjoined? If none exists, R(3,10) = 40; if one does, 41. Nobody knows, and nothing on this page decides it. This is the whole lane, shown as it happened: every case of the question and who closed it, three opened boxes, every gate with its dead ends, what runs now, and every error caught on the way.' })
  + '<div class="col">' + C.scope('A live page, rebuilt from its records; this build reads them up to ' + (() => { const d = new Date([M.as_of].concat(PR.running.filter((r) => r.running).map((r) => r.resumed)).sort().pop());
    return utc(d.toISOString(), false) + ' on ' + d.getUTCDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getUTCMonth()] + ' ' + d.getUTCFullYear(); })()
    + '. Nothing on it is refereed. The lane was private until 25 November 2026; that night its seal was opened. How this page updates: it is rebuilt from its records at every phase finish, and its change log at the foot says what changed.') + '</div>';
const MAPSEC = '<section class="cm-sec" id="map"><div class="col sec-head"><div class="lab">the case map</div><h2>The whole question, case by case</h2></div>' + MAPBLOCK + '</section>';
let body = [HEADER, GAPS, MAPSEC, EXPLAIN, STRATA, BOXES, PROCESS, PATHS, QUESTIONS, FORECASTS, REPLAY, LEDGER, MACHINE, CREDITS, GLOSSARY, TRUST, CHANGES].join('\n\n');
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
.cardgrid{display:grid;gap:var(--s-4);align-items:start}
.cardgrid.g3{grid-template-columns:repeat(3,minmax(0,1fr))}.cardgrid.g2{grid-template-columns:repeat(2,minmax(0,1fr))}
@media (max-width:1000px){.cardgrid.g3,.cardgrid.g2{grid-template-columns:minmax(0,1fr)}}
.card{background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:var(--s-5);min-width:0;display:flex;flex-direction:column;gap:var(--s-2)}
.card h3{margin:0}
.card p{margin:0;font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-2)}
.card p.card-d{color:var(--ink-3)}
.card-k{display:flex;align-items:center;gap:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.card-n{font-family:var(--f-mono);color:var(--ink)!important}
.meter{display:block;width:100%;height:var(--s-2);margin:var(--s-1) 0 0}
.gts{list-style:none;margin:var(--s-3) 0 0;padding:0;display:grid;gap:var(--s-3)}
.gt{background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:var(--s-5);min-width:0}
.gt-h{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-1) var(--s-3);font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3)}
.gt-h b{color:var(--ink);font-weight:var(--weight-medium)}
.gt-o{text-transform:uppercase;letter-spacing:var(--track-loose);color:var(--ink)}
.gt-c{margin:var(--s-2) 0 var(--s-1);color:var(--ink);font-size:var(--text-small);line-height:var(--leading-body)}
.gt-l{margin:0 0 var(--s-1);font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-2)}
.gt-l b{color:var(--ink);font-weight:var(--weight-medium)}
.gt-s{margin:0;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);overflow-wrap:anywhere}
.rds>details{margin-top:var(--s-2)}
.rd-n{display:block;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3);margin-top:var(--s-1)}
.early{margin:var(--s-3) 0 var(--s-2);padding:0;list-style:none;display:grid;gap:var(--s-1);font-size:var(--text-small);color:var(--ink-2);line-height:var(--leading-snug)}
.early b{display:inline-block;min-width:var(--s-6);color:var(--ink-4)}
.fc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-4)}
@media (max-width:1000px){.fc-grid{grid-template-columns:minmax(0,1fr)}}
.fc{border:1px solid var(--rule-strong);outline:1px solid var(--ink-4);outline-offset:calc(-1 * var(--s-2));border-radius:var(--radius-m);padding:var(--s-5);display:flex;flex-direction:column;gap:var(--s-1);background:transparent;min-width:0}
.fc-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.fc-v{font-family:var(--f-sans);font-style:italic;font-weight:var(--weight-body);font-size:var(--text-2);color:var(--ink-2)}
.fc-d{font-style:italic;font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-3)}
.fc-note{font-style:italic;color:var(--ink-3);font-size:var(--text-small)}
.r6f{margin:var(--s-3) 0}
.r6f figcaption{font-size:var(--text-eyebrow);color:var(--ink-3);line-height:var(--leading-snug)}
.r6h{width:100%;height:auto;display:block}
.bx-gap-top{border-top:none;padding-top:0;margin-top:0}
.bx-lim li b{color:var(--ink)}
.tl-list{list-style:none;margin:0 0 var(--s-4);padding:0;display:grid;gap:var(--s-2);font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink-2);overflow-wrap:anywhere}
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
  desc: 'R(3,10) is 40 or 41, and nothing here decides which. A live page of the whole lane: the (3,10;40) question as a map of cases and who closed each, the question explained, three opened results (Theorem C35, a second computation of Case R(7), the three-edge branch of Case R(6)), every gate with its dead ends, what runs now, and every error caught.',
  og: { image: '/og-r310.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('r310') }
});
/* a forecast's type is drawn only in the forecasts section */
const visible = html.replace(/<script[\s\S]*?<\/script>/g, '');
const fcSec = (/<section[^>]*id="forecasts"[\s\S]*?<\/section>/.exec(visible) || [''])[0];
need((visible.match(/class="fc[ "-]/g) || []).length === (fcSec.match(/class="fc[ "-]/g) || []).length && fcSec.length > 0, 'a forecast is drawn outside the forecasts section');
need(!/\b(?:TODO|undefined|NaN)\b/.test(visible.replace(/<[^>]+>/g, ' ')), 'a placeholder reached the page');
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(path.join(OUTDIR, 'index.html'), html);
console.log('site/r310/index.html written: ' + NODES.length + ' cases, box 3 ' + B3.state + ', ' + PR.gates.length + ' gates, ' + PA.rows.length + ' paths, ' + K.counts.all + ' corrections, ' + M.verdicts.rows.length + ' verdicts; '
  + (OPENED_UTC ? 'opened ' + OPENED_UTC : 'PREVIEW: opening at publication'));
