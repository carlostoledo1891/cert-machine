#!/usr/bin/env node
/* build-delta3-hol4-live.js — site/delta3-hol4/index.html: the δ₃-in-HOL4 work and its blind benchmark, live.

   The work: a checker for the five exact certificates behind δ₃ = 117/2192 (Erdős #1186), written in HOL4 so that its
   soundness can be proved there and the certificates run in HOL4's kernel. The benchmark: two model families (Claude
   Opus 5.5 and GPT-6.2 Astra) attempt the same statements about the checker — some false on purpose, some decoys —
   and the HOL4 kernel judges every attempt on a remote judge under the same limits. The page says, in this order: what
   went wrong during the run and what was done (the house rule: gaps lead), where the run stands per family, the run's
   timeline, how the benchmark works, what the checker is and what is proved and not, what happens next, and, one
   click down, why you can trust this.

   EVERY NUMBER ON THE PAGE IS READ from corpus/delta3-hol4-live/ (written by tools/delta3-hol4-live-records.js from the
   run's private files, read-only). This builder reads nothing else. While the run is open (state.run_open) the page
   shows aggregates only: it refuses records that carry any statement's outcome, and a page that prints a statement id.
   It refuses when the records disagree with each other, when the newest change-log entry is not the records' state,
   and when its words would claim more than the records: a "first", a proof of soundness, a verified computation
   primitive, a hash of a commit, the name of anyone the work may later be sent to, or a news site the house keeps off
   its pages.

   Listed: in the sitemap and linked from the audits series of /reports/; the sync keeps its folder (tools/build-site.js)
   and serves its share card. A marketing page in design/marketing.js's sense: no hash or record line on the surface.

   usage: node tools/delta3-hol4-live-records.js, then node tools/build-delta3-hol4-live.js, then `make page`      MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const MKT = require(path.join(ROOT, 'design', 'marketing.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const OUTDIR = path.join(ROOT, 'site', 'delta3-hol4');
const die = (m) => { console.error('DELTA3-HOL4 PAGE REFUSED: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const esc = C.esc, ea = C.escAttr;
const DIR = 'corpus/delta3-hol4-live/';
const J = (f) => { const p = path.join(ROOT, DIR + f); need(fs.existsSync(p), 'a record is gone: ' + DIR + f); return JSON.parse(fs.readFileSync(p, 'utf8')); };
const sha12 = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 12);
const S = J('state.json'), PL = J('page-log.json');
const N = (x) => Number(x).toLocaleString('en-US');
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const hm = (iso) => { const d = new Date(iso); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
const day = (iso) => { const d = new Date(iso); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
const utc = (iso) => iso.replace('T', ' ').replace(/^(\S+ \d\d:\d\d)(:\d\d)?Z$/, '$1 UTC');
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = (n) => WORDS[n] || N(n);
const fr = (f) => f[1] === 1 ? String(f[0]) : f[0] + '/' + f[1];
const plural = (n, a, b) => N(n) + ' ' + (n === 1 ? a : b);

/* ---------------------------------------------------------------- the records agree with each other */
need(typeof S.run_open === 'boolean', 'the records carry no run_open flag');
const R = S.run, FAM = S.families;
need(FAM.length === 2 && FAM[0].id === 'claude' && FAM[1].id === 'gpt', 'the records do not hold the two families, Claude then GPT');
const CLASSES = ['proved', 'refuted', 'cap', 'open', 'untouched'];
for (const f of FAM) {
  need(CLASSES.reduce((a, c) => a + f.statements[c], 0) === R.statements, f.name + ': the statement classes do not add up to ' + R.statements);
  need(f.batches.length === R.batches && f.batches_done === f.batches.filter((b) => b.state === 'done').length && f.batches_running === f.batches.filter((b) => b.state === 'running').length, f.name + ': the batch counts are not the batches’');
  need(f.attempts === Object.values(f.outcomes).reduce((a, b) => a + b, 0), f.name + ': the attempts are not the sum of their outcomes');
  need(f.statements.proved + f.statements.refuted <= f.attempts && f.attempts <= R.cap * (R.statements - f.statements.untouched), f.name + ': the attempts do not fit the cap');
  /* THE RUN_OPEN TEST: while the run is open the records carry no statement's outcome */
  need(!S.run_open || f.per_statement === null, 'the run is open, yet the records carry ' + f.name + '’s per-statement outcomes');
  need(S.run_open || (Array.isArray(f.per_statement) && f.per_statement.length === R.statements), 'the run has ended, and the records carry no per-statement strip for ' + f.name);
}
need(S.run_open === (R.ended_utc === null), 'run_open disagrees with the run’s end');
need(S.sig.startsWith(S.run_open ? 'open ' : 'ended '), 'the state’s signature disagrees with run_open');
const NEWEST = PL.entries[PL.entries.length - 1];
need(NEWEST && NEWEST.sig === S.sig && NEWEST.as_of <= S.as_of && NEWEST.run_open === S.run_open,
  'the newest page-log entry is not the records’ state (' + S.sig + '): run node tools/delta3-hol4-live-records.js (it logs batch changes), or add one with --log "…"');
need(MKT.isMarketing('delta3-hol4/index.html'), 'the page is not on design/marketing.js’s list: its figures would print hashes on the surface');
const OPEN = S.run_open;
const CL = FAM[0], GP = FAM[1];
const lane = (f) => f.id === 'claude' ? 'Claude' : 'GPT';

/* ---------------------------------------------------------------- shapes: a word and a shape, never colour alone */
const BWORD = { done: 'done', running: 'running', waiting: 'waiting' };
function tile(st, x, y, w, h, id) {
  const o = [];
  if (st === 'done') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"/>'
    + '<rect x="' + (x + 3) + '" y="' + (y + h - 6) + '" width="' + (w - 6) + '" height="3.5" rx="1.75" fill="var(--ink)"/>'
    + '<path d="M' + (x + w - 13) + ' ' + (y + 7) + ' l3.2 3.2 l6 -6" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>');
  else if (st === 'running') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"/>'
    + '<circle cx="' + (x + w - 8) + '" cy="' + (y + 8) + '" r="3.5" fill="var(--ink)"/>');
  else o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--sunk)" stroke="var(--ink-4)" stroke-width="1"/>');
  if (id) o.push('<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 4.5) + '" text-anchor="middle" class="t-lab' + (st === 'waiting' ? ' dh-dim' : '') + '">' + esc(id) + '</text>');
  return o.join('');
}
const HATCH = (id) => '<defs><pattern id="' + id + '" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="var(--surface)"/><path d="M0,6 l6,-6 M-1.5,1.5 l3,-3 M4.5,7.5 l3,-3" stroke="var(--ink-4)" stroke-width="0.7" fill="none"/></pattern></defs>';
/* the five classes of a statement for one family, each a shape: filled, outlined, hatched, thin, faint */
const CLS = {
  proved: { word: 'proved', paint: 'fill="var(--ink)" stroke="var(--ink)" stroke-width="1"', cls: '', shape: 'filled' },
  refuted: { word: 'refuted', paint: 'fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"', cls: '', shape: 'outlined' },
  cap: { word: 'at the cap, not judged', paint: 'fill="url(#HATCH)" stroke="var(--ink-3)" stroke-width="1"', cls: '', shape: 'hatched' },
  open: { word: 'tried, under the cap', paint: 'fill="var(--surface)" stroke="var(--ink-3)" stroke-width="1"', cls: '', shape: 'thin outline' },
  untouched: { word: 'not attempted yet', paint: 'fill="var(--sunk)" stroke="var(--ink-4)" stroke-width="1"', cls: '', shape: 'faint' } };
if (!OPEN) CLS.untouched.word = 'not attempted';
const icon = (st) => '<svg class="dh-ic" viewBox="0 0 32 22" width="29" height="20" aria-hidden="true">' + tile(st, 1, 1, 30, 20, '') + '</svg>';
const swatch = (c) => '<svg class="dh-ic" viewBox="0 0 32 22" width="29" height="20" aria-hidden="true">' + HATCH('hk-' + c) + '<rect x="2" y="4" width="28" height="14" rx="2" ' + CLS[c].paint.replace('#HATCH', '#hk-' + c) + '/></svg>';
/* a stacked bar of the statements, by class, at x..x+w */
function bar(f, x, y, w, h, hid, labels) {
  const o = [];
  let cx = x;
  for (const c of CLASSES) {
    const n = f.statements[c];
    if (!n) continue;
    const sw = w * n / R.statements;
    o.push('<rect x="' + cx.toFixed(1) + '" y="' + y + '" width="' + Math.max(1, sw - 1.5).toFixed(1) + '" height="' + h + '" rx="2" ' + CLS[c].paint.replace('#HATCH', '#' + hid) + '/>');
    /* the count under its segment, in ink on the figure's own ground (a light label on a dark segment reads as faint there) */
    if (labels && sw >= 26) o.push('<text x="' + (cx + (sw - 1.5) / 2).toFixed(1) + '" y="' + (y + h + 16) + '" text-anchor="middle" class="t-lab">' + N(n) + '</text>');
    cx += sw;
  }
  return o.join('');
}

/* ---------------------------------------------------------------- HERO: each family, its batches and its statements */
function heroSvg(narrow) {
  const W0 = narrow ? 360 : 1000, LBL = narrow ? 0 : 206, TW = narrow ? 34 : 82, GX = narrow ? 6 : 7, TH = narrow ? 30 : 36, BH = narrow ? 22 : 28;
  const BW = 9 * TW + 8 * GX;
  need(R.batches === 9, 'the hero is drawn for nine batches');
  const o = [];
  let y = narrow ? 4 : 8;
  const parts = [];
  for (const f of FAM) {
    if (narrow) { parts.push('<text x="0" y="' + (y + 13) + '" class="t-lab">' + esc(f.name) + '</text><text x="' + W0 + '" y="' + (y + 13) + '" text-anchor="end" class="t-note">' + esc(f.batches_done + ' of ' + R.batches + ' batches done') + '</text>'); y += 22; }
    else parts.push('<text x="0" y="' + (y + TH / 2 + 1) + '" class="t-lab">' + esc(f.name) + '</text><text x="0" y="' + (y + TH / 2 + 19) + '" class="t-note">' + esc(f.batches_done + ' of ' + R.batches + ' done' + (f.batches_running ? ', ' + f.batches_running + ' running' : '')) + '</text>');
    f.batches.forEach((b, i) => parts.push('<g class="dh-t" tabindex="0" aria-label="' + ea(f.name + ', batch ' + b.id + ': ' + BWORD[b.state]) + '"><title>' + esc(f.name + ' · ' + b.id + ' · ' + BWORD[b.state]) + '</title>' + tile(b.state, LBL + i * (TW + GX), y, TW, TH, narrow ? '' : b.id) + '</g>'));
    y += TH + 10;
    const hid = 'hh-' + f.id + (narrow ? '-n' : '');
    parts.push(HATCH(hid) + '<g aria-label="' + ea(f.name + ': ' + CLASSES.filter((c) => f.statements[c]).map((c) => f.statements[c] + ' ' + CLS[c].word).join(', ')) + '">' + bar(f, LBL, y, BW, BH, hid, true) + '</g>');
    y += BH + (narrow ? 44 : 48);
  }
  const H = y - (narrow ? 22 : 26);
  o.push('<svg viewBox="0 0 ' + W0 + ' ' + H + '" role="img" class="dh-svg" aria-label="' + ea('For each model family: its ' + R.batches + ' batches as tiles (done: a tick and a full bar; running: a dot; waiting: faint), and its ' + R.statements + ' statements as one bar, split by what the kernel judged so far. The table below the figure gives every number.') + '">');
  o.push(parts.join(''));
  o.push('</svg>');
  return o.join('');
}
const HERO = C.figure({ hero: true, svgRaw: heroSvg(false), svgNarrowRaw: heroSvg(true), record: DIR + 'state.json', pins: false,
  captionRaw: 'Each family’s ' + word(R.batches) + ' batches of ' + N(R.batch_size) + ' statements, and its ' + N(R.statements) + ' statements by what the HOL4 kernel has judged, as of ' + esc(hm(S.as_of)) + ' UTC on ' + esc(day(S.as_of)) + '. '
    + (OPEN ? 'Totals only while the run is open: no statement’s outcome is shown until it ends, and nobody knows yet which statements are true, planted or decoys.' : 'The run has ended; which statements are true, planted or decoys is known only once the key is opened.') });
/* the key under the hero, every number in it: a grid, not a table, so the two numbers stay in view on a phone */
const kcell = (raw, cls) => '<span class="' + cls + '">' + raw + '</span>';
const krow = (labRaw, a, b) => kcell(labRaw, 'dh-kl') + kcell(esc(a), 'dh-kv') + kcell(esc(b), 'dh-kv');
const TABLE = '<div class="col"><div class="dh-kt" role="table" aria-label="' + ea('Each family’s statements by what the kernel judged, its attempts and its batches') + '">'
  + '<span class="dh-kh" role="columnheader">statements</span><span class="dh-kh dh-kv" role="columnheader">' + esc(lane(CL)) + '</span><span class="dh-kh dh-kv" role="columnheader">' + esc(lane(GP)) + '</span>'
  + CLASSES.map((c) => krow('<span class="dh-k">' + swatch(c) + esc(CLS[c].word) + '</span>', N(CL.statements[c]), N(GP.statements[c]))).join('')
  + krow('<span class="dh-k">attempts used</span>', N(CL.attempts), N(GP.attempts))
  + krow('<span class="dh-k">' + icon('done') + 'batches done</span>', N(CL.batches_done) + ' of ' + R.batches, N(GP.batches_done) + ' of ' + R.batches)
  + krow('<span class="dh-k">' + icon('running') + 'batches running</span>', N(CL.batches_running), N(GP.batches_running)) + '</div></div>';
const STATS = C.stats([
  { k: 'the run', v: OPEN ? 'OPEN' : 'ENDED', n: OPEN ? 'since ' + hm(R.start_utc) + ' UTC; paused ' + R.pause.lasted : 'from ' + hm(R.start_utc) + ' to ' + hm(R.ended_utc) + ' UTC' },
  { k: 'statements', v: N(R.statements), n: word(R.batches) + ' batches of ' + N(R.batch_size) + ', the same for both families' },
  { k: CL.name, v: CL.batches_done + ' of ' + R.batches, n: 'batches done' + (CL.batches_running ? '; ' + CL.batches_running + ' running' : '') + '; ' + N(CL.attempts) + ' attempts' },
  { k: GP.name, v: GP.batches_done + ' of ' + R.batches, n: 'batches done' + (GP.batches_running ? '; ' + GP.batches_running + ' running' : '') + '; ' + N(GP.attempts) + ' attempts' }]);
/* after the run: each family's statements in their order, one cell each (only once the run has ended) */
function stripSvg(narrow) {
  const W0 = narrow ? 360 : 1000, LBL = narrow ? 0 : 206, PER = narrow ? 54 : 81, cw = (W0 - LBL) / PER, ch = narrow ? 12 : 14, o = [];
  let y = 4;
  for (const f of FAM) {
    o.push('<text x="0" y="' + (y + 12) + '" class="t-lab">' + esc(f.name) + '</text>');
    if (narrow) y += 20;
    const hid = 'hs-' + f.id + (narrow ? '-n' : '');
    o.push(HATCH(hid));
    f.per_statement.forEach((c, i) => o.push('<rect x="' + (LBL + (i % PER) * cw).toFixed(1) + '" y="' + (y + Math.floor(i / PER) * (ch + 3)) + '" width="' + (cw - 1.5).toFixed(1) + '" height="' + ch + '" rx="1.5" ' + CLS[c].paint.replace('#HATCH', '#' + hid) + '><title>' + esc('S' + String(i + 1).padStart(3, '0') + ' · ' + CLS[c].word) + '</title></rect>'));
    y += Math.ceil(R.statements / PER) * (ch + 3) + 18;
  }
  return '<svg viewBox="0 0 ' + W0 + ' ' + (y - 10) + '" role="img" class="dh-svg" aria-label="' + ea('Each family’s statements in their order, one cell each, shaped by what the kernel judged.') + '">' + o.join('') + '</svg>';
}
const STRIP = OPEN ? '' : '<div class="wide dh-fig">' + C.figure({ wide: false, svgRaw: '<div class="hv-w">' + stripSvg(false) + '</div><div class="hv-n">' + stripSvg(true) + '</div>', captionRaw: 'After the run: every statement of each family in the list’s order, shaped as in the table above.' }) + '</div>';

/* ---------------------------------------------------------------- the timeline: batches as bars, the pause, numbered events */
const T0 = Math.floor(Date.parse(R.start_utc) / 1800000) * 1800000;
const asOfMs = Date.parse(S.as_of);
const TEND = Math.max(asOfMs, ...S.events.map((e) => Date.parse(e.at)));
const T1 = Math.ceil((TEND + 60000) / 1800000) * 1800000;
need(Number.isFinite(asOfMs) && T1 > T0, 'the timeline’s clock is not readable');
function timelineSvg(narrow) {
  const W0 = narrow ? 360 : 1000, LBL = narrow ? 26 : 150, X1 = W0 - (narrow ? 4 : 10), LH = narrow ? 9 : 11, LG = narrow ? 4 : 5, R0 = narrow ? 8 : 9;
  const X = (ms) => LBL + (ms - T0) / (T1 - T0) * (X1 - LBL);
  /* the numbered markers: in rows, so two never overlap */
  const rowsX = [], mk = S.events.map((e, i) => { const x = X(Date.parse(e.at)); let r = 0; while (rowsX[r] !== undefined && x - rowsX[r] < 2 * R0 + 3) r++; rowsX[r] = x; return { n: i + 1, x, r, e }; });
  const nRows = rowsX.length, top = 4 + nRows * (2 * R0 + 4) + 6;
  const o = [];
  let y = top;
  const groups = FAM.map((f) => { const head = y; y += narrow ? 18 : 20; const g = { f, head, y0: y }; y += R.batches * (LH + LG) - LG; g.y1 = y; y += narrow ? 14 : 18; return g; });
  const yAx = y + 2, H = yAx + 24;
  o.push('<svg viewBox="0 0 ' + W0 + ' ' + H + '" role="img" class="dh-svg" aria-label="' + ea('The run in time, from ' + hm(new Date(T0).toISOString()) + ' to ' + hm(new Date(T1).toISOString()) + ' UTC: each batch of each family as a bar from its start to its end (a running batch is an outline ending in a dot), the pause as a hatched band, and ' + S.events.length + ' numbered events, listed in words below the figure.') + '">');
  o.push(HATCH('ht-' + (narrow ? 'n' : 'w')));
  /* the half-hour grid and its labels */
  for (let t = T0; t <= T1; t += 1800000) {
    o.push('<line x1="' + X(t).toFixed(1) + '" y1="' + top + '" x2="' + X(t).toFixed(1) + '" y2="' + yAx + '" stroke="var(--rule-soft)" stroke-width="1"/>');
    if (!narrow || (t - T0) % 3600000 === 0) o.push('<text x="' + X(t).toFixed(1) + '" y="' + (yAx + 17) + '" text-anchor="' + (t === T0 ? 'start' : t === T1 ? 'end' : 'middle') + '" class="t-ax">' + esc(hm(new Date(t).toISOString())) + '</text>');
  }
  /* the pause */
  const px0 = X(Date.parse(R.pause.from)), px1 = X(Date.parse(R.pause.to));
  o.push('<rect x="' + px0.toFixed(1) + '" y="' + top + '" width="' + (px1 - px0).toFixed(1) + '" height="' + (yAx - top) + '" fill="url(#ht-' + (narrow ? 'n' : 'w') + ')" stroke="var(--ink-4)" stroke-width="1"/>');
  o.push('<text x="' + ((px0 + px1) / 2).toFixed(1) + '" y="' + (yAx - 5) + '" text-anchor="middle" class="t-note dh-on">pause, ' + esc(R.pause.lasted) + '</text>');
  for (const g of groups) {
    o.push('<text x="' + (narrow ? 0 : 0) + '" y="' + (g.head + 13) + '" class="t-lab">' + esc(narrow ? g.f.name : g.f.name) + '</text>');
    g.f.batches.forEach((b, i) => {
      const yy = g.y0 + i * (LH + LG);
      o.push('<text x="' + (LBL - 6) + '" y="' + (yy + LH - 1) + '" text-anchor="end" class="t-note">' + esc(b.id) + '</text>');
      if (!b.started_utc) return;
      const x0 = X(Date.parse(b.started_utc)), x1 = X(b.ended_utc ? Date.parse(b.ended_utc) : asOfMs);
      const lab = g.f.name + ', ' + b.id + ': ' + (b.ended_utc ? 'from ' + hm(b.started_utc) + ' to ' + hm(b.ended_utc) + ' UTC' : 'running since ' + hm(b.started_utc) + ' UTC');
      o.push('<g class="dh-t" tabindex="0" aria-label="' + ea(lab) + '"><title>' + esc(lab) + '</title>' + (b.ended_utc
        ? '<rect x="' + x0.toFixed(1) + '" y="' + yy + '" width="' + Math.max(2, x1 - x0).toFixed(1) + '" height="' + LH + '" rx="2" fill="var(--ink)"/>'
        : '<rect x="' + x0.toFixed(1) + '" y="' + yy + '" width="' + Math.max(2, x1 - x0).toFixed(1) + '" height="' + LH + '" rx="2" fill="var(--surface2)" stroke="var(--ink)" stroke-width="1.6"/><circle cx="' + x1.toFixed(1) + '" cy="' + (yy + LH / 2) + '" r="' + (LH / 2 + 0.5) + '" fill="var(--ink)"/>') + '</g>');
    });
  }
  /* the markers and their guides (the grammar's guide dash: it says nothing) */
  for (const m of mk) {
    const cy = 4 + R0 + m.r * (2 * R0 + 4);
    o.push('<line x1="' + m.x.toFixed(1) + '" y1="' + (cy + R0) + '" x2="' + m.x.toFixed(1) + '" y2="' + yAx + '" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="' + G.GUIDE + '"/>');
    o.push('<g class="dh-t" tabindex="0" aria-label="' + ea(m.n + ': ' + hm(m.e.at) + ' UTC, ' + m.e.title) + '"><title>' + esc(m.n + ' · ' + hm(m.e.at) + ' UTC · ' + m.e.title) + '</title><circle cx="' + m.x.toFixed(1) + '" cy="' + cy + '" r="' + R0 + '" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6"/>'
      + '<text x="' + m.x.toFixed(1) + '" y="' + (cy + 4) + '" text-anchor="middle" class="t-note dh-on">' + m.n + '</text></g>');
  }
  if (OPEN) o.push('<line x1="' + X(asOfMs).toFixed(1) + '" y1="' + top + '" x2="' + X(asOfMs).toFixed(1) + '" y2="' + yAx + '" stroke="var(--ink)" stroke-width="1.4"/><text x="' + (X(asOfMs) - 4).toFixed(1) + '" y="' + (yAx - 4) + '" text-anchor="end" class="t-note dh-on">now</text>');
  o.push('<line x1="' + LBL + '" y1="' + yAx + '" x2="' + X1 + '" y2="' + yAx + '" stroke="var(--rule)" stroke-width="1"/>');
  o.push('</svg>');
  const svg = o.join('');
  need(!/stroke-dasharray="(?!2 3")/.test(svg), 'a dash pattern other than the grammar’s guide');
  return svg;
}
const TIMELINE = '<div class="wide dh-fig">' + C.figure({ wide: false, svgRaw: '<div class="hv-w">' + timelineSvg(false) + '</div><div class="hv-n">' + timelineSvg(true) + '</div>',
  captionRaw: 'The run in time (UTC), as of ' + esc(hm(S.as_of)) + '. A filled bar is a batch from its start to its end; an outline ending in a dot is a batch still running. The hatched band is the pause. The numbers are the events below.' }) + '</div>';
const EVENTS = '<ol class="dh-ev">' + S.events.map((e, i) => '<li><span class="dh-n">' + (i + 1) + '</span><span><b>' + esc(hm(e.at)) + ' UTC · ' + esc(e.title) + '.</b> ' + esc(e.text) + '</span></li>').join('') + '</ol>';

/* ---------------------------------------------------------------- the work: five certificates on [0, 1/2], and what is not proved */
const Wk = S.work;
function workSvg(narrow) {
  const W0 = narrow ? 360 : 1000, x0 = narrow ? 6 : 20, x1 = W0 - (narrow ? 8 : 20), half = (v) => v[0] / v[1];
  const X = (f) => x0 + half(f) / 0.5 * (x1 - x0);
  const yLab = 14, yH = narrow ? 34 : 24, hH = 26, yT = yH + hH + 12, TH = narrow ? 46 : 54, yAx = yT + TH + 14, yC = yAx + 40;
  const o = ['<svg viewBox="0 0 ' + W0 + ' ' + (yC + 26) + '" role="img" class="dh-svg" aria-label="' + ea('The interval from 0 to 1/2, cut into the five regions the certificates cover. Each region is a tile with a tick: the HOL4 kernel proves that the checker returns true on its certificate. Above them, one hatched band across the whole interval: the soundness theorem, not yet proved. Below, one line from 0 to 1/2: the cover check, also true.') + '">', HATCH('hw-' + (narrow ? 'n' : 'w'))];
  o.push('<text x="' + x0 + '" y="' + yLab + '" class="t-lab">' + esc(narrow ? 'Not yet proved: the soundness theorem' : 'Not yet proved: that an accepting check implies the bound on its region (the benchmark’s lemmas build it)') + '</text>');
  if (narrow) o.push('<text x="' + x0 + '" y="' + (yLab + 15) + '" class="t-note">an accepting check implies the bound</text>');
  o.push('<rect x="' + x0 + '" y="' + yH + '" width="' + (x1 - x0) + '" height="' + hH + '" rx="4" fill="url(#hw-' + (narrow ? 'n' : 'w') + ')" stroke="var(--ink-3)" stroke-width="1"/>');
  for (const r of Wk.regions) {
    const a = X(r.lo), b = X(r.hi), w = b - a - 4, name = r.id === 'inner' ? 'inner' : narrow ? r.id.slice(4) : 'slab ' + r.id.slice(4);
    const lab = (r.id === 'inner' ? 'the inner certificate' : 'slab ' + r.id.slice(4)) + ' on [' + fr(r.lo) + ', ' + fr(r.hi) + ']: the kernel proves the check true, cv_eval ' + r.check_s + ' s';
    o.push('<g class="dh-t" tabindex="0" aria-label="' + ea(lab) + '"><title>' + esc(lab) + '</title>' + tile('done', +(a + 2).toFixed(1), yT, +w.toFixed(1), TH, '') + '</g>');
    o.push('<text x="' + ((a + b) / 2).toFixed(1) + '" y="' + (yT + (narrow ? 34 : 24)) + '" text-anchor="middle" class="t-lab">' + esc(name) + '</text>');
    if (!narrow) o.push('<text x="' + ((a + b) / 2).toFixed(1) + '" y="' + (yT + 41) + '" text-anchor="middle" class="t-note dh-on">' + esc(r.check_s.toFixed(2) + ' s') + '</text>');
  }
  o.push('<line x1="' + x0 + '" y1="' + yAx + '" x2="' + x1 + '" y2="' + yAx + '" stroke="var(--rule)" stroke-width="1"/>');
  const ticks = [[0, 1]].concat(Wk.regions.map((r) => r.hi));
  /* on a phone the last two cuts sit 34 px apart: 9/20 keeps its tick and loses its label */
  for (const t of ticks) {
    const tx = X(t), quiet = narrow && t[0] * 2 !== t[1] && X(Wk.regions[Wk.regions.length - 1].hi) - tx < 40;
    o.push('<line x1="' + tx.toFixed(1) + '" y1="' + yAx + '" x2="' + tx.toFixed(1) + '" y2="' + (yAx + 5) + '" stroke="var(--rule)" stroke-width="1"/>');
    if (!quiet) o.push('<text x="' + tx.toFixed(1) + '" y="' + (yAx + 19) + '" text-anchor="' + (t[0] === 0 ? 'start' : t[0] * 2 === t[1] ? 'end' : 'middle') + '" class="t-ax">' + esc(fr(t)) + '</text>');
  }
  o.push('<line x1="' + x0 + '" y1="' + yC + '" x2="' + x1 + '" y2="' + yC + '" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>');
  o.push('<text x="' + x0 + '" y="' + (yC + 18) + '" class="t-note dh-on">' + esc(narrow ? 'the cover check: true' : 'the cover check: the five regions reach from 0 to 1/2 with no gap, also true in the kernel') + '</text>');
  o.push('</svg>');
  return o.join('');
}
const WORKFIG = '<div class="wide dh-fig">' + C.figure({ wide: false, svgRaw: '<div class="hv-w">' + workSvg(false) + '</div><div class="hv-n">' + workSvg(true) + '</div>',
  captionRaw: 'The ' + word(Wk.certificates) + ' certificates on the interval of θ they cover, [0, 1/2]. Each tile is a kernel theorem: the checker returns true on that certificate (seconds of <span class="m">cv_eval</span>: the four slabs at HOL4 release v9 on a rented 8-core machine, the inner certificate at release ' + esc(Wk.hol_tag.replace(/^trindemossen-\d+-/, '')) + ' on a laptop). The hatched band is what is not proved yet.' }) + '</div>';

/* ---------------------------------------------------------------- the copy */
const TITLE = 'δ₃ in HOL4: the checker and its blind benchmark, live';
const HEADER = C.header({ eyebrow: 'Carlos Toledo · a certificate checker in HOL4, in the open', title: TITLE,
  deck: 'δ₃ = ' + Wk.value + ' (' + Wk.problem + ') rests on ' + word(Wk.certificates) + ' exact certificates. A checker for them is written in HOL4 and runs in HOL4’s kernel; the proof that the checker is sound is being built. Its lemmas are a blind benchmark: ' + CL.name + ' and ' + GP.name + ' attempt the same ' + N(R.statements) + ' statements, some false on purpose, and the HOL4 kernel judges every attempt.' })
  + '<div class="col"><p class="scope">A live page, rebuilt from its records as the run moves; this build reads them up to ' + esc(hm(S.as_of)) + ' UTC on ' + esc(day(S.as_of)) + '. '
  + (OPEN ? 'While the run is open it shows totals only: no statement’s outcome appears until the run has ended. ' : 'The run has ended. ')
  + 'The certificates, and the exact verifier that decided them, are on <a href="/reports/delta3.html">the δ₃ report</a>. Nothing here is refereed; the change log is at the foot.</p></div>';

const gapItem = (g) => '<li class="dh-g"><div class="dh-gh"><span class="m">' + esc(g.when) + ' UTC</span> <b>' + esc(g.title) + '.</b></div>'
  + '<p>' + esc(g.happened) + '</p><p><b>Done.</b> ' + esc(g.done) + '</p><p class="dh-n2"><b>In the scoring.</b> ' + esc(g.scoring) + '</p></li>';
const LEAD = C.section({ lab: 'what went wrong, first', title: 'What went wrong during the run, and what was done', id: 'gaps',
  bodyRaw: C.pRaw('Said first, in plain words, as the records state it. Each was found and acted on while the run was open, before the answer key is opened.')
    + '<ol class="dh-gl">' + S.gaps.map(gapItem).join('') + '</ol>'
    + '<h3>The rulings made during the run</h3>' + C.plainList(S.rulings.map((r) => ({ b: r.when + ' UTC.', text: r.text })))
    + '<h3>Known limits, said before the results</h3>' + C.plainList(S.limits_known.map((l) => ({ text: l.text }))) });

const HEROSEC = '<section class="dh-sec" id="progress"><div class="col sec-head"><div class="lab">the run at a glance</div><h2>' + (OPEN ? 'Where the run stands' : 'Where the run ended') + '</h2></div>' + HERO + STATS + TABLE + STRIP
  + '<div class="col"><p class="dh-n2">A statement at the cap had ' + R.cap + ' attempts and none was judged proved or refuted. “Tried, under the cap” counts statements with fewer attempts and no judged outcome' + (OPEN ? ' — still in progress, or left by an agent that has finished its batch' : '') + '. Each family stops at a statement’s first judged outcome.</p></div></section>';
const TIMESEC = C.section({ lab: 'the timeline', title: 'The run, as it happened', id: 'timeline', wide: true, bodyRaw: TIMELINE + '<div class="col">' + EVENTS + '</div>' });

const RULES = C.section({ lab: 'how it works', title: 'The benchmark', id: 'benchmark',
  bodyRaw: C.plainList([
    { b: 'Two model families.', text: CL.name + ' (' + CL.model + '), one agent per batch, and ' + GP.name + ' (' + GP.model + ', through the Codex command line), one session per batch.' },
    { b: 'The same statements, the same order.', text: 'Both families get the same ' + N(R.statements) + ' statements about the checker, in the same ' + word(R.batches) + ' batches of ' + N(R.batch_size) + ', with the same brief and no hints beyond it. Each statement either holds, or is false on purpose (planted), or is a decoy; the agents are told some are false.' },
    { b: 'At most ' + R.cap + ' attempts per statement.', text: 'Proofs and refutations together, per family. A family stops at its first judged outcome on a statement: proved, or refuted (the statement shown false).' },
    { b: 'One judge, the same limits.', text: 'Every attempt is a complete HOL4 script, built on a rented judge machine with no network, under the same limits for both families: ' + N(R.limits.wall_s) + ' s of wall time, ' + N(R.limits.cpu_s) + ' s of CPU per process, ' + N(R.limits.mem_gb) + ' GB of memory. The kernel’s answer is the outcome: proved, refuted, failed, timeout or refused. HOL4 is pinned at ' + R.hol_tag + ', Poly/ML at ' + R.poly_tag + '.'
      + (R.uniform.judge_code === 1 && R.uniform.freeze === 1 && R.uniform.host === 1 && R.uniform.limits ? ' Every attempt of the run so far was judged on that one machine, by one version of the judge, against one frozen statement list.' : '') },
    { b: 'A sealed answer key.', text: 'Which statements are true, planted or decoys is in a key encrypted before the run (frozen ' + hm(S.freeze.frozen_utc) + ' UTC on ' + day(S.freeze.frozen_utc) + ') under a passphrase that one person, Carlos Toledo, holds. Nobody knows which statements are which until it is opened, after the run.' },
    { b: 'What an agent may not do.', text: 'Run HOL4 itself (every build goes through the judge), or read the true statements’ texts, the other family’s folder, or any agent’s session transcript. Every agent’s tool log is audited for this after the run.' },
    { b: 'Controls first.', text: R.judge.controls[0].toUpperCase() + R.judge.controls.slice(1) + '.' }]) });

const PROVED = C.plainList([
  { b: 'The checker runs in the kernel.', raw: 'For each of the ' + word(Wk.regions.length) + ' certificates, HOL4 proves <span class="m">⊢ check &lt;data&gt; ⇔ T</span>: the four slabs in ' + esc(Math.min(...Wk.regions.filter((r) => r.id !== 'inner').map((r) => r.check_s)).toFixed(2)) + '–' + esc(Math.max(...Wk.regions.filter((r) => r.id !== 'inner').map((r) => r.check_s)).toFixed(2)) + ' s each, the inner certificate (' + esc(N(Wk.regions.find((r) => r.id === 'inner').forms)) + ' forms) in ' + esc(Wk.regions.find((r) => r.id === 'inner').check_s.toFixed(2)) + ' s. The same check in JavaScript takes ' + esc(String(Wk.js_s)) + ' s on the same machine: the kernel is ' + esc(String(Wk.kernel_factor)) + ' times slower. A cover check proves the five regions reach from 0 to 1/2 with no gap. Each theorem carries only HOL4’s disk tag, with no axioms and no hypotheses.' },
  { b: 'Forgeries are refused.', text: 'Of the ' + Wk.battery.planted + ' planted forgeries of the existing battery, ' + Wk.battery.kernel_f + ' give F in the kernel, the ' + Wk.battery.cover_f + ' cover forgeries give F, and the loader refuses the ' + (Wk.battery.loader === 1 ? 'malformed one' : Wk.battery.loader + ' malformed ones') + ' before the kernel; ' + Wk.more_forgeries + ' more forgeries give F too.' },
  { b: 'The dominance lemma.', text: 'Weighted diagonal dominance implies positive semidefiniteness (and, strictly, definiteness), proved in HOL4. A search of HOL4’s sources at the pinned release found no theorem on semidefiniteness or diagonal dominance.' },
  { b: 'A compiled copy.', text: 'The same checker, compiled by CakeML into a binary, agrees with the kernel on ' + Wk.binary.agree + ' of ' + Wk.binary.of + ' inputs, at ' + Wk.binary.lo_s + '–' + Wk.binary.hi_s + ' s per certificate. Kernel runs at two HOL4 releases (-v9 and -v10) give byte-identical theorems on all ' + Wk.v9_v10_inputs + ' inputs that reach the kernel.' }]);
const NOTPROVED = C.plainList([
  { b: 'Soundness, not yet.', text: 'A kernel theorem above says the checker returns true on the data. It does not yet say the bound holds. The next theorem is that an accepting slab check implies the bound on its region; the same for the inner and cover checks comes after. The benchmark’s statements are the lemmas of that proof.' },
  { b: 'The model constants are data.', text: 'The areas and constants of the extremal colouring are computed by the JavaScript verifier and loaded into HOL4 as data, not derived in it.' },
  { b: 'The analytic reduction is not in HOL4.', text: 'The step from the five inequalities to δ₃ = ' + Wk.value + ', and the uniqueness of the extremal colouring, are not in HOL4.' },
  { b: 'The witness is untrusted.', text: 'The Gram factor, the weights and the scale are hints written in floating point. A wrong hint can only turn T into F, so F on a forgery says the check fails with that witness, not that no witness exists.' },
  { b: 'Strictness is tested by strict diagonal dominance,', text: 'which is sufficient for positive definiteness but not necessary; the JavaScript verifier tests leading minors, which is exact. Both accept all five certificates.' },
  { b: 'The trusted base.', text: 'HOL4’s kernel, including its compute primitive. That primitive is a port of the compute facility proved sound for Candle (O. Abrahamsson, M. O. Myreen, M. Norrish, H. Kanabar, J. Åman Pohjola, J. Automated Reasoning 69(1):7, 2025); the port itself is not proved inside HOL4. The binary adds CakeML’s released compiler binary, the C stubs of its basis library and the link step.' }]);
const WORK = C.section({ lab: 'the work', title: 'The checker: what is proved, and what is not', id: 'checker', wide: true,
  bodyRaw: WORKFIG + '<div class="col">' + C.pRaw('The checker is a set of HOL4 functions over integers and lists. Given a certificate, it rebuilds the polynomial identity, forms the integer matrix and tests it, and returns T or F. It is written in HOL4 so that two things become possible: running the certificates inside HOL4’s kernel, and proving there that a T means the bound holds.')
    + '<h3>Proved</h3>' + PROVED + '<h3>Not proved</h3>' + NOTPROVED
    + '<h3>Related work</h3>' + C.pRaw('The full statement δ₃ = ' + esc(Wk.value) + ' is formalised in Lean by Snively (<a href="' + ea(Wk.lean.url) + '">erdos-1186</a>, v' + esc(Wk.lean.version) + ', ' + esc(Wk.lean.date) + '). Star Fleet Math stated the value, with an exact rational sum-of-squares certificate, by ' + esc(Wk.sfm.date) + ' (Internet Archive capture ' + esc(Wk.sfm.capture) + '). This work is a checker in HOL4 for the certificates; it does not state δ₃ as a HOL4 theorem.') + '</div>' });

function nextSvg(narrow) {
  const n = S.next.length, per = narrow ? 3 : n, W0 = narrow ? 360 : 1000, TW = narrow ? 104 : Math.floor((1000 - (n - 1) * 14) / n), GAP = per > 1 ? (W0 - per * TW) / (per - 1) : 0, TH = 54, rows = Math.ceil(n / per), o = [];
  const H = rows * (TH + 16) - 16 + 4;
  const lines = (s) => s.split(' ').reduce((a, w) => { const l = a[a.length - 1]; if (l && (l + ' ' + w).length <= 11) a[a.length - 1] = l + ' ' + w; else a.push(w); return a; }, []);
  o.push('<svg viewBox="0 0 ' + W0 + ' ' + H + '" role="img" class="dh-svg" aria-label="' + ea(n + ' steps in order, none started yet: ' + S.next.map((s) => s.short).join(', ') + '. Each is said in words below.') + '">');
  S.next.forEach((s, i) => {
    need(s.short && s.short.length <= 22, 'a step has no short label, or one too long to fit its tile');
    const r = Math.floor(i / per), c = i % per, x = c * (TW + GAP), y = 2 + r * (TH + 16);
    if (c < per - 1 && i < n - 1) o.push('<line x1="' + (x + TW + 2).toFixed(1) + '" y1="' + (y + TH / 2) + '" x2="' + (x + TW + GAP - 2).toFixed(1) + '" y2="' + (y + TH / 2) + '" stroke="var(--ink-4)" stroke-width="1.4"/>');
    const L = lines(s.short);
    o.push('<g class="dh-t" tabindex="0" aria-label="' + ea((i + 1) + ': ' + s.title + ', not started') + '"><title>' + esc((i + 1) + ' · ' + s.title) + '</title>' + tile('waiting', +x.toFixed(1), y, TW, TH, '')
      + '<text x="' + (x + 8).toFixed(1) + '" y="' + (y + 15) + '" class="t-note dh-on">' + (i + 1) + '</text>'
      + L.map((l, k) => '<text x="' + (x + TW / 2).toFixed(1) + '" y="' + (y + 31 + k * 14 - (L.length - 1) * 4) + '" text-anchor="middle" class="t-note dh-on">' + esc(l) + '</text>').join('') + '</g>');
  });
  o.push('</svg>');
  return o.join('');
}
const NEXT = C.section({ lab: 'what happens next', title: 'What happens next, in order', id: 'next', wide: true,
  bodyRaw: '<div class="wide dh-fig">' + C.figure({ wide: false, svgRaw: '<div class="hv-w">' + nextSvg(false) + '</div><div class="hv-n">' + nextSvg(true) + '</div>', captionRaw: 'The steps after the run, in the order they happen; none has started.' }) + '</div>'
    + '<div class="col"><ol class="dh-ev">' + S.next.map((s, i) => '<li><span class="dh-n">' + (i + 1) + '</span><span><b>' + esc(s.title) + '.</b> ' + esc(s.text) + '</span></li>').join('') + '</ol></div>' });

const TOKENS = FAM.map((f) => f.name + ': ' + N(f.tokens.total) + ' tokens over its ' + plural(f.tokens.batches, 'finished batch', 'finished batches') + ', by ' + f.tokens.counter).join('. ') + '. The two counters are not the same measure, so the totals are not compared here.';
const trustBody = [
  C.pRaw('<b>Every number on this page is read from a record.</b> The records are written by <span class="m">tools/delta3-hol4-live-records.js</span> from the run’s own files, which it reads and never changes; it refuses when a source no longer says what a record states, and when a time a source states is ahead of the clock. This page is built from the records by <span class="m">tools/build-delta3-hol4-live.js</span>, which refuses when they disagree.'),
  C.table({ cols: [{ h: 'record' }, { h: 'sha256, 12 hex digits' }, { h: 'what it holds' }], rows: ['state.json', 'page-log.json'].map((f) => [{ raw: '<span class="m">' + esc(DIR + f) + '</span>' }, { raw: '<span class="m">' + sha12(DIR + f) + '</span>' }, J(f).what]) }),
  C.pRaw('<b>The sources</b>, private until the run is scored, read as they stood at ' + esc(hm(S.as_of)) + ' UTC. The judge’s log and the token table are counted, never copied: no statement’s outcome leaves them while the run is open. The answer key is never opened by these tools.'),
  C.table({ cols: [{ h: 'source' }, { h: 'sha256, 12 hex digits' }], rows: S.sources.map((s) => [{ raw: '<span class="m">' + C.breakable(s.file) + '</span>' }, { raw: '<span class="m">' + esc(s.sha256_12) + '</span>' }]) }),
  C.pRaw('<b>The freeze.</b> Frozen ' + esc(utc(S.freeze.frozen_utc)) + ', digest of its public files <span class="m">' + esc(S.freeze.digest_12) + '</span>, encrypted with <span class="m">' + esc(S.freeze.cipher) + '</span>. It replaced the freeze of ' + esc(utc(S.freeze.supersedes_utc)) + '. Its public files, the ones every agent reads: ' + S.freeze.public_files.map((f) => '<span class="m">' + C.breakable(f) + '</span>').join(', ') + '.'),
  C.pRaw('<b>The judge.</b> One version of the judge for the whole run (<span class="m">' + esc(R.judge.code_12) + '</span>, the first twelve hex digits of the sha256 over its files); ' + esc(R.judge.controls) + '.'),
  C.pRaw('<b>Tokens.</b> ' + esc(TOKENS)),
  C.pRaw('<b>What the build refuses.</b> The page is not built when: the records carry a statement’s outcome while the run is open, or the page would print a statement’s id; the statement classes do not add up; the batch counts are not the batches’; the attempts do not fit the cap; the newest change-log entry is not the records’ state; the words would say “first”, call the checker proved sound, call the compute primitive verified, print a commit’s hash, or name anyone the work may later be sent to.')];
const TRUST = C.section({ lab: 'one click down', title: 'Why you can trust this', id: 'trust', wide: true,
  bodyRaw: '<div class="wide"><details class="more trust"><summary>The records, the sources and the rules</summary><div class="col">' + trustBody.join('\n') + '</div></details></div>' });

const CHANGES = C.section({ lab: 'changes', title: 'Changes to this page', id: 'changes',
  bodyRaw: C.plainList(PL.entries.slice().reverse().map((e) => ({ b: utc(e.at) + '.', text: e.what }))) });

const body = [HEADER, LEAD, HEROSEC, TIMESEC, RULES, WORK, NEXT, TRUST, CHANGES].join('\n\n');

const STYLE = `
.dh-sec .sec-head{margin-bottom:var(--s-5)}
.dh-svg .dh-t{outline:none}
.dh-svg .dh-t:focus-visible rect{stroke:var(--ink);stroke-width:2.6}
.dh-svg .dh-dim{fill:var(--ink-3)}
.dh-svg .dh-on{fill:var(--ink-2)}
.dh-fig .hv-n{display:none}
@media (max-width:680px){.dh-fig .hv-w{display:none}.dh-fig .hv-n{display:block}}
.dh-ic{display:inline-block;vertical-align:middle;flex:none}
.dh-k{display:inline-flex;align-items:center;gap:var(--s-2)}
.dh-kt{display:grid;grid-template-columns:minmax(0,1fr) auto auto;column-gap:var(--s-5);margin:var(--s-5) auto var(--s-5);font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-2)}
.dh-kt>span{padding:var(--s-2) 0;border-bottom:1px solid var(--rule);min-width:0}
.dh-kh{font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-4)}
.dh-kv{text-align:right;color:var(--ink)}
.dh-n2{font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-3)}
.dh-gl{list-style:none;margin:0 0 var(--s-6);padding:0;display:grid;gap:var(--s-4)}
.dh-g{background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:var(--s-5);min-width:0}
.dh-g p{margin:var(--s-2) 0 0}
.dh-gh{line-height:var(--leading-snug)}
.dh-ev{list-style:none;margin:var(--s-4) 0 0;padding:0;display:grid;gap:var(--s-3)}
.dh-ev li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--s-3);align-items:start}
.dh-n{font-family:var(--f-mono);font-size:var(--text-eyebrow);border:1px solid var(--ink);border-radius:999px;min-width:2.2em;text-align:center;padding:var(--s-1) var(--s-2);color:var(--ink)}
.trust .col>p{color:var(--ink-2)}
`;

let html = TPL.render({
  title: TITLE, bodyRaw: body, path: '/delta3-hol4/', cssRaw: STYLE, lang: 'en',
  footRaw: '<p>Built by tools/build-delta3-hol4-live.js from the records in corpus/delta3-hol4-live/. The work by Carlos Toledo with Claude agents (Anthropic) and GPT-6.2 Astra (OpenAI, in Codex); the page built with Claude Opus 5.5. Unrefereed.</p>',
  desc: 'A checker for the five certificates behind δ₃ = 117/2192 (Erdős #1186), written in HOL4 and run in its kernel, and the live blind benchmark of its soundness lemmas: Claude Opus 5.5 and GPT-6.2 Astra on the same statements, every attempt judged by the HOL4 kernel.',
  og: fs.existsSync(path.join(ROOT, 'design', 'assets', 'og-delta3-hol4.png')) ? { image: '/og-delta3-hol4.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('delta3-hol4') } : undefined
});

/* ---------------------------------------------------------------- the words never claim more than the records */
const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<wbr>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const surface = visible.slice(0, visible.indexOf('Why you can trust this'));
need(!OPEN || !/\bS\d{3}\b/.test(html), 'the run is open, and the page prints a statement id: ' + (/.{0,40}\bS\d{3}\b.{0,20}/.exec(html) || [''])[0]);
need(!/sequent|verifereum/i.test(html), 'the page names someone the work may later be sent to: never');
need(!/\bfirst (HOL4|formali[sz]|to\b|ever|work on|machine|kernel|proof of)|\bthe first (HOL4|formal|independent|verified|complete)|\bfor the first time\b/i.test(visible), 'the page claims priority (a “first”): ' + (/.{0,60}\bfirst\b.{0,40}/i.exec(visible) || [''])[0]);
need(!/\bverified (in-kernel )?comput|\bverified (compute|in-kernel)/i.test(visible), 'the page calls the compute primitive verified (it is a port of Candle’s proved-sound facility)');
need(!/(checker|it) (is|has been|was) (now )?(proved|verified) sound|soundness (is|has been|was) (now )?proved/i.test(visible), 'the page says the checker is proved sound');
const hnM = /.{0,80}(hacker ?news|news\.ycombinator).{0,40}/i.exec(html); need(!hnM, "Hacker News on the page: " + (hnM ? hnM[0] : ""));
need(!/\b[0-9a-f]{40}\b/.test(html) && !/\/commit\//.test(html), 'a commit hash or commit link on the page');
need(!/\b(?=[0-9a-f]*[a-f])[0-9a-f]{12,}\b/.test(surface), 'a hash on the surface (above "Why you can trust this")');
need(!/\b\d+ (true statements|planted statements|decoys)\b/i.test(visible), 'the page states how many statements of a class there are in this run');
need(!/\b(?:TODO|undefined|NaN)\b/.test(visible), 'a placeholder reached the page');
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(path.join(OUTDIR, 'index.html'), html);
console.log('site/delta3-hol4/index.html written: run ' + (OPEN ? 'OPEN' : 'ENDED') + ', ' + FAM.map((f) => f.name + ' ' + f.batches_done + '/' + R.batches + ' batches, ' + f.statements.proved + ' proved, ' + f.statements.refuted + ' refuted, ' + f.statements.cap + ' at the cap').join('; ')
  + ', ' + S.gaps.length + ' gaps, ' + S.events.length + ' events, ' + PL.entries.length + ' change-log entr' + (PL.entries.length === 1 ? 'y' : 'ies') + ', as of ' + S.as_of);
