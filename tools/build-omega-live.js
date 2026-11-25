#!/usr/bin/env node
/* build-omega-live.js — site/omega/index.html: the claim that matrix multiplication has exponent 9/4, checked in the open.

   OpenAI published, on 24 November 2026 (github.com/openai/math, committed 25 November 00:04 UTC), a paper and a Lean
   formalization claiming that the exponent of matrix multiplication is 9/4 over every field; the new part is the lower
   bound. This page is the live audit of that release, in the order the pre-registration sets: what is not established,
   the gaps read at the pin (in PREREG.md's words), every pre-registered row and its state, what each verdict would mean
   (the sealed rule, quoted), the panel, the corrections ledger and the change log. Rigor is one click down, in "Why you
   can trust this": every record, seal, source and script with its hash. The copy is impartial: it says what each row
   checks and its state, never what the audit expects.

   EVERY STATE ON THE PAGE IS READ from corpus/omega-live/ (written from the lane's files by tools/omega-live-records.js,
   which refuses when a source no longer says what a record states). This builder reads nothing else, and refuses when
   the records disagree with each other, when the verdict is one the rows do not support, when the money is above the
   ceiling, when the newest page-log entry is not the records' state, or when the page's words would claim more than the
   records ("proved", priority) or take a side.

   Listed: in the sitemap and linked from the audits series of /reports/; the sync keeps its folder (tools/build-site.js)
   and does not write it. A marketing page in design/marketing.js's sense: no hash or record line on the surface.

   FINAL=1 builds the verdict's report from the same records, written with `node tools/omega-live-records.js --final`
   (refused while any row is running or pending, or before the lane declares its verdict in VERDICT.md): the verdict
   line from the records first, the same order after it, each row's record one click down, and the certificate
   certs/omega-nine-fourths.json checked against the records. A live build refuses final records, and FINAL=1 refuses
   live ones, a page-log entry not written for the final records, or a certificate that is not the records'.

   usage: node tools/build-omega-live.js, then `make page` (the sync and the page gates)
          FINAL=1 node tools/build-omega-live.js, then `make page`, once the records are final                MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const MKT = require(path.join(ROOT, 'design', 'marketing.js'));
const OUTDIR = path.join(ROOT, 'site', 'omega');
const die = (m) => { console.error('OMEGA PAGE REFUSED: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const esc = C.esc, ea = C.escAttr;
const DIR = 'corpus/omega-live/';
const J = (f) => { const p = path.join(ROOT, DIR + f); need(fs.existsSync(p), 'a record is gone: ' + DIR + f); return JSON.parse(fs.readFileSync(p, 'utf8')); };
const sha12 = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 12);
const S = J('state.json'), LG = J('ledger.json'), PL = J('page-log.json');
/* FINAL=1: the verdict's report, from the same records written with --final (the live page until then) */
const FINAL = process.env.FINAL === '1';
const N = (x) => Number(x).toLocaleString('en-US');
const WORDN = (n) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] || N(n);
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const hm = (iso) => { const d = new Date(iso); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0') + ' UTC'; };
const day = (iso) => { const d = new Date(iso); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
const utc = (iso) => iso.replace('T', ' ').replace(/^(\S+ \d\d:\d\d)(:\d\d)?Z$/, '$1 UTC');
/* backticked words of the pre-registration, set as code; everything else escaped */
const tick = (s) => C.breakable(s).replace(/`([^`]+)`/g, '<span class="m">$1</span>');   /* breakable: a long path in a ledger entry wraps at its slashes instead of widening a phone's page */
/* no hash on the surface (design/marketing.js): the release's commit is "the pinned commit", any other hash is one click down */
/* a full digest may break every 16 hex digits, so it wraps inside a phone's column instead of widening it */
const hexwrap = (h) => esc(h).replace(/([0-9a-f]{16})(?=[0-9a-f])/g, '$1<wbr>');
/* a log line, quoted in mono: breakable at its slashes, and a full digest inside it (a 64-hex run has no break of its
   own and ran 505px wide in a phone's 300px column, 2026-11-25) may break every 16 hex digits too */
const logLine = (s) => C.breakable(s.replace(/`/g, '')).replace(/([0-9a-f]{16})(?=[0-9a-f]{8})/g, '$1<wbr>');
const unhash = (s) => s.split(S.target.commit).join('the pinned commit').split(S.target.commit.slice(0, 8)).join('the pinned commit').replace(/\(sha256 (?=[0-9a-f]*[a-f])[0-9a-f]{7,64}…?\)/g, '(its hash one click down)').replace(/\b(?=[0-9a-f]*[a-f])[0-9a-f]{12,64}\b…?/g, '[a hash, one click down]');

/* ---------------------------------------------------------------- the records agree with each other */
const ROWS = S.phases.flatMap((p) => p.rows);
const STATES = ['passed', 'read', 'running', 'pending', 'failed', 'refused', 'open'];
need(ROWS.length === S.counts.all, 'the rows are not the count of rows');
for (const st of STATES) need(ROWS.filter((r) => r.state === st).length === S.counts[st], 'the count of ' + st + ' rows is not the rows’');
need(S.verdict !== 'OPEN' || ROWS.some((r) => !['passed', 'read'].includes(r.state)), 'the verdict is OPEN while every row has finished');
/* the sealed rule's rows (PREREG.md, Verdict rule): CERTIFIED needs every one of these passed (for C1–C3, refused by the
   checkers, which the records call passed); phase 3 is READ rows, beyond the verdict */
const RULE_ROWS = ['K0', 'K1', 'K1N', 'K2', 'K3', 'KR', 'CR', 'C1', 'C2', 'C3', 'F2', 'F3', 'F4'];
need(RULE_ROWS.every((id) => S.verdict_rule.certified.includes(id)), 'a row of this builder’s rule list is not in the sealed rule');
need(RULE_ROWS.every((id) => ROWS.some((r) => r.id === id)), 'a row of the sealed rule is missing from the state');
need(S.verdict !== 'CERTIFIED' || RULE_ROWS.every((id) => ROWS.find((r) => r.id === id).state === 'passed'), 'the verdict is CERTIFIED while a row of the sealed rule has not passed');
need(S.verdict !== 'REFUTED' || ROWS.some((r) => r.state === 'failed'), 'the verdict is REFUTED while no row has failed');
need(S.verdict !== 'REFUSED' || ROWS.some((r) => r.state === 'refused'), 'the verdict is REFUSED while every row could run');
const CERT = S.verdict === 'CERTIFIED';
need(S.spent_usd <= S.ceiling_usd, 'spent (US$' + S.spent_usd + ') is above the ceiling (US$' + S.ceiling_usd + '): the lane must say REFUSED, not this page');
need(S.gaps.length === 7 && S.gaps.every((g, i) => g.id === 'G' + (i + 1)), 'the gaps are not G1–G7');
const NEWEST = PL.entries[PL.entries.length - 1];
/* the newest entry must carry the records' state row by row; a refresh that moved only the clock needs no new entry */
const ROWSTATE = ROWS.map((r) => r.id + ':' + r.state).join(' ');
need(NEWEST && NEWEST.as_of <= S.as_of && NEWEST.rows === ROWSTATE && NEWEST.passed === S.counts.passed && NEWEST.running === S.counts.running && NEWEST.verdict === S.verdict,
  'the newest page-log entry is not the records’ state (as of ' + S.as_of + ', ' + S.counts.passed + ' passed, ' + S.counts.running + ' running, rows ' + ROWSTATE + '): add one with node tools/omega-live-records.js --log "…"');
need(FINAL || !S.final, 'the records are final (written with --final): build the report with FINAL=1');
if (FINAL) {
  need(S.final, 'FINAL=1, but the records were not written with --final (node tools/omega-live-records.js --final)');
  const open = ROWS.filter((r) => r.state === 'running' || r.state === 'pending');
  need(!open.length, 'FINAL=1 while ' + open.length + ' row(s) are running or pending: ' + open.map((r) => r.id).join(', '));
  need(S.verdict_declared, 'FINAL=1 with no verdict declared by the lane (VERDICT.md)');
  need(NEWEST.final === true, 'FINAL=1 needs a page-log entry written for the final records (node tools/omega-live-records.js --log "…" after --final)');
  const CP = path.join(ROOT, 'certs', 'omega-nine-fourths.json');
  need(fs.existsSync(CP), 'FINAL=1 with no certificate: certs/omega-nine-fourths.json');
  const CT = JSON.parse(fs.readFileSync(CP, 'utf8'));
  need(CT.verdict === S.verdict && CT.as_of === S.as_of && CT.rows.concat(CT.phase4 ? CT.phase4.rows : [], CT.phase5 ? CT.phase5.rows : []).map((r) => r.id + ':' + r.state).join(' ') === ROWS.map((r) => r.id + ':' + r.state).join(' '), 'the certificate is not the records’ verdict, minute and rows');
}
need(MKT.isMarketing('omega/index.html'), 'the page is not on design/marketing.js’s list: its figures would print hashes on the surface');
const S0 = S.seals.find((s) => s.id === 'SEAL-0');
need(S0 && S0.stamped_utc, 'the records hold no SEAL-0 with its stamp');

/* ---------------------------------------------------------------- the states: a word and a shape, never colour alone */
const WORD = { passed: 'passed', read: 'read', running: 'running', pending: 'pending', failed: 'failed', refused: 'refused', open: 'open' };
const KIND = { passed: 'held', read: 'held', running: 'open', pending: 'open', failed: 'dep', refused: 'open', open: 'open' };
function tile(st, x, y, w, h, id) {
  const o = [];
  /* passed: a heavy outline, a full bar along its foot and a tick; the label stays ink on the tile, readable on any ground */
  if (st === 'passed') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"/>'
    + '<rect x="' + (x + 3) + '" y="' + (y + h - 6) + '" width="' + (w - 6) + '" height="3.5" rx="1.75" fill="var(--ink)"/>'
    + '<path d="M' + (x + w - 13) + ' ' + (y + 7) + ' l3.2 3.2 l6 -6" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>');
  /* read (a READ row finished, no kernel verdict): a heavy outline and two short text lines in its corner */
  else if (st === 'read') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"/>'
    + '<path d="M' + (x + w - 15) + ' ' + (y + 6) + ' h9 M' + (x + w - 15) + ' ' + (y + 10.5) + ' h6" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>');
  else if (st === 'running') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"/>'
    + '<circle cx="' + (x + w - 8) + '" cy="' + (y + 8) + '" r="3.5" fill="var(--ink)"/>');
  else if (st === 'pending') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--sunk)" stroke="var(--ink-4)" stroke-width="1"/>');
  else if (st === 'failed') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>'
    + '<path d="M' + (x + w - 12) + ' ' + (y + 4) + ' l8 8 M' + (x + w - 4) + ' ' + (y + 4) + ' l-8 8" stroke="var(--ink)" stroke-width="1.6"/>');
  else o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface)" stroke="var(--ink-3)" stroke-width="1.4"/>'
    + '<path d="M' + (x + w - 12) + ' ' + (y + 12) + ' l8 -8" stroke="var(--ink-3)" stroke-width="1.6"/>');
  if (id) o.push('<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 4.5) + '" text-anchor="middle" class="t-lab' + (st === 'pending' ? ' vt-dim' : '') + '">' + esc(id) + '</text>');
  return o.join('');
}
/* the band's short label: phases 1–3 by number; the row added after the seal by when; the two bands added after the
   verdict by the lane's own names for them, Phase 4 (A13) and Phase 5 (A15, A16) */
const BAND = (p) => p.phase <= 3 ? 'phase ' + p.phase : p.phase === 4 ? 'after the seal' : 'phase ' + (p.phase - 1);
const AFTER_NOTE = { 5: ['after the verdict', '(amendment A13)'], 6: ['after the verdict', '(amendments A15, A16)'] };
const ICON = (st) => '<svg class="ic" viewBox="0 0 32 22" width="29" height="20" aria-hidden="true">' + tile(st, 1, 1, 30, 20, '') + '</svg>';
const SHAPE = { passed: 'a tick and a full bar', read: 'two short lines', running: 'a dot', pending: 'faint', failed: 'a cross', refused: 'a slash', open: 'a slash' };

/* ---------------------------------------------------------------- HERO: every row, phase by phase */
function heroSvg(narrow) {
  const W0 = narrow ? 360 : 1000, LBL = narrow ? 0 : 236, TW = narrow ? 64 : 52, TH = narrow ? 34 : 40, GX = narrow ? 8 : 6, GY = 10, PER = narrow ? 5 : 13;
  const o = [];
  /* a phase title wraps at a word, so a long one never runs under the tiles (desktop) or off the figure (phone) */
  const wrap = (s, n) => s.split(' ').reduce((a, w) => { const l = a[a.length - 1]; if (l && (l + ' ' + w).length <= n) a[a.length - 1] = l + ' ' + w; else a.push(w); return a; }, []);
  let y = narrow ? 4 : 10;
  const bands = S.phases.map((p) => {
    const head = narrow ? wrap((p.phase === 4 ? p.title : BAND(p) + ' · ' + (AFTER_NOTE[p.phase] ? AFTER_NOTE[p.phase].join(' ') : p.title)), 50) : null;
    const lines = Math.max(1, Math.ceil(p.rows.length / PER)), top = y + (narrow ? 22 + 14 * (head.length - 1) : 0);
    const h = lines * TH + (lines - 1) * GY;
    y = top + h + (narrow ? 22 : 24);
    return { p, top, h, head };
  });
  const H = y - (narrow ? 10 : 14);
  const present = STATES.filter((st) => S.counts[st]);
  o.push('<svg viewBox="0 0 ' + W0 + ' ' + H + '" role="img" class="vt-svg" aria-label="' + ea('Every registered row of the audit, in ' + WORDN(S.phases.length) + ' bands, one tile each: '
    + present.map((st) => S.counts[st] + ' ' + WORD[st] + ' (' + SHAPE[st] + ')').join(', ') + '. The list below the figure says each in words.') + '">');
  for (const { p, top, h, head } of bands) {
    if (narrow) head.forEach((l, k) => o.push('<text x="0" y="' + (top - 8 - 14 * (head.length - 1 - k)) + '" class="t-note">' + esc(l) + '</text>'));
    else {
      const tl = AFTER_NOTE[p.phase] || wrap(p.title, 30), y0 = top + h / 2 - 3 - 8 * (tl.length - 1);
      o.push('<text x="0" y="' + y0 + '" class="t-lab">' + esc(BAND(p)) + '</text>');
      (p.phase === 4 ? [] : tl).forEach((l, k) => o.push('<text x="0" y="' + (y0 + 17 + 15 * k) + '" class="t-note">' + esc(l) + '</text>'));
    }
    p.rows.forEach((r, i) => {
      const x = LBL + (i % PER) * (TW + GX), yy = top + Math.floor(i / PER) * (TH + GY);
      o.push('<g class="vt-t" tabindex="0" aria-label="' + ea(r.id + ', ' + WORD[r.state] + ': ' + r.title) + '"><title>' + esc(r.id + ' · ' + WORD[r.state] + ' · ' + r.title) + '</title>' + tile(r.state, x, yy, TW, TH, r.id) + '</g>');
    });
  }
  o.push('</svg>');
  const svg = o.join('');
  need(!/stroke-dasharray/.test(svg), 'a dash pattern outside design/grammar.js');
  return svg;
}
const HERO = C.figure({
  hero: true, svgRaw: heroSvg(false), svgNarrowRaw: heroSvg(true), record: DIR + 'state.json', pins: false,
  captionRaw: 'Every row the audit registered before it ran, one tile each, as of ' + esc(hm(S.as_of)) + ' on ' + esc(day(S.as_of)) + '. '
    + STATES.filter((st) => S.counts[st] || ['passed', 'running', 'pending'].includes(st)).map((st) => (SHAPE[st][0].toUpperCase() + SHAPE[st].slice(1)) + ': ' + WORD[st] + '.').join(' ') + ' Each row is said in words below.'
});
const KEY = '<div class="wide vt-key" aria-label="the states">' + STATES.filter((st) => S.counts[st] || ['passed', 'running', 'pending'].includes(st))
  .map((st) => '<span>' + ICON(st) + esc(WORD[st]) + ' <span class="vt-kn">' + N(S.counts[st]) + '</span></span>').join('') + '</div>';
const blocks = S.seals.filter((s) => s.bitcoin_block).length;
const live = S.pods.filter((p) => !p.ended_utc);
const STATS = C.stats([
  { k: 'verdict today', v: S.verdict, n: S.verdict_words },
  { k: 'rows passed', v: N(S.counts.passed) + ' of ' + N(S.counts.all), n: N(S.counts.running) + ' running, ' + N(S.counts.pending) + ' pending' + (S.counts.read ? ', ' + N(S.counts.read) + ' read' : '') + (S.counts.failed ? ', ' + N(S.counts.failed) + ' failed' : '') },
  { k: 'rented machines', v: 'US$' + S.spent_usd.toFixed(2), n: 'of a ceiling of US$' + N(S.ceiling_usd) + (live.length ? '; ' + live.map((p) => 'US$' + p.usd_per_h.toFixed(2) + ' an hour since ' + hm(p.created_utc)).join(', ') : '') },
  { k: 'seals in Bitcoin', v: N(S.seals.length), n: blocks === S.seals.length ? 'each in a block' : blocks ? blocks + ' in a block, ' + (S.seals.length - blocks) + ' awaiting one' : 'awaiting a block' }]);

/* ---------------------------------------------------------------- Phase 4 (after the verdict): what it closes */
const P5 = ROWS.filter((r) => S.phases.find((p) => p.phase === 5 && p.rows.includes(r)));
const G3_CLOSED = !!(S.phase4 && S.phase4.closes_g3 && P5.length && P5.every((r) => r.state === 'passed'));
need(!S.phase4 || S.phase4.closes_g3 === ['G3a', 'G3b', 'G3c', 'G3d', 'G3-CR'].every((id) => (ROWS.find((r) => r.id === id) || {}).state === 'passed') || !S.phase4.statements.sealed_by, 'the records’ Phase 4 summary disagrees with its rows');
/* Phase 5 (amendments A15, A16), the sixth band, also after the verdict */
const P6 = ROWS.filter((r) => S.phases.find((p) => p.phase === 6 && p.rows.includes(r)));
const passed = (id) => (ROWS.find((r) => r.id === id) || {}).state === 'passed';
const P6_DONE = !!(S.phase5 && S.phase5.proved_all && P6.length && P6.every((r) => r.state === 'passed'));
need(!S.phase5 || S.phase5.proved_all === (['G3e', 'G3f', 'G2a', 'G2b', 'P5-CR'].every(passed) && !!S.phase5.statements.sealed_by), 'the records’ Phase 5 summary disagrees with its rows');
const AFTER = P5.concat(P6);
/* the control room's correction after Phase 5 (the census's miss), said in plain words in the Phase 5 band and the lead */
const C4 = LG.corrections.find((c) => c.id === 'C-4');

/* ---------------------------------------------------------------- what is not established, first */
const LEAD = '<div class="col"><div class="note ne"><span class="lab">what is not established</span>' + C.plainList([
  FINAL && !CERT ? { b: 'The verdict is ' + S.verdict + '.', text: S.verdict_reason } : CERT ? { b: 'What is certified is the formal claim, not the mathematics.', text: 'By the rule sealed before any run, the verdict is CERTIFIED. ' + N(S.counts.passed) + ' of the ' + N(S.counts.all) + ' rows have passed' + (AFTER.length ? ' (' + WORDN(AFTER.filter((r) => r.state === 'passed').length) + ' of them added after the verdict, outside it)' : '')
      + (S.counts.read ? '; ' + N(S.counts.read) + ' were read, the paper beyond the Lean' : '') + (S.counts.open ? '; ' + N(S.counts.open) + ' ' + (S.counts.open === 1 ? 'is' : 'are') + ' left open with the reason (' + ROWS.filter((r) => r.state === 'open').map((r) => r.id).join(', ') + ')' : '')
      + (S.counts.running || S.counts.pending ? '; ' + N(S.counts.running + S.counts.pending) + ' go on' : '') + '.' }
    : { b: 'Nothing is decided yet.', text: 'The verdict today is ' + S.verdict + ': ' + N(S.counts.passed) + ' of the ' + N(S.counts.all) + ' rows ' + (S.counts.passed === 1 ? 'has' : 'have') + ' passed, ' + N(S.counts.running) + (S.counts.running === 1 ? ' is' : ' are') + ' running and ' + N(S.counts.pending) + (S.counts.pending === 1 ? ' has' : ' have') + ' not started' + (S.counts.read ? '; ' + N(S.counts.read) + (S.counts.read === 1 ? ' reading is in' : ' readings are in') : '') + (S.counts.failed ? '; ' + N(S.counts.failed) + ' failed' : '') + '.' },
  { b: 'The claim is OpenAI’s, and an OpenAI model sits on the panel.', raw: 'The release was made by OpenAI models. Beside Claude agents (Anthropic), two seats of the panel are held by GPT-6.2-astra, an OpenAI model. Independence here is by procedure (separate prompts, sealed outputs, no shared files), not by vendor. Who does what is <a href="#panel">below</a>.' },
  { b: 'No person checks the mathematics here.', text: 'The rows check what a machine can check: whether the Lean proof checks, and whether its Lean statement says what the paper claims. Even a CERTIFIED verdict would not say that any human has checked the mathematics.' },
  { b: CERT ? 'What the verdict does not settle.' : 'What a pass would still not settle.', text: 'By the sealed rule, CERTIFIED says nothing about divisions (G2), the per-n bound or Corollary 1.2 (G3) unless the census finds them proved, and nothing beyond the trusted base: the kernels, the three axioms and the Mathlib definitions the statements use.'
    + (G3_CLOSED ? ' After the verdict, and outside it: the release does not state G3’s statements; our Phase 4 proves them from the release’s theorems (below).' : '')
    + (P6_DONE ? ' Phase 5 does the same for Corollary 1.3, in every rectangular format, and for the paper’s bounds on α with division gates allowed.' : '')
    + (C4 ? ' One miss of ours belongs here: the release’s own files prove the rectangular exponent with divisions, which our census did not list (correction C-4).' : '') }]) + '</div></div>';

/* ---------------------------------------------------------------- the gaps, as the pre-registration words them */
const GAPS = C.section({ lab: 'the gaps', title: 'Seven gaps, read at the pin', id: 'gaps',
  bodyRaw: C.pRaw('Read from the release at the commit pinned before anything ran, and worded here as the pre-registration words them (sealed ' + esc(hm(S0.stamped_utc)) + ', ' + esc(day(S0.stamped_utc)) + '). Each is a fact about what the release states or checks; none is a verdict on the proof.')
    + C.plainList(S.gaps.map((g) => { const c = LG.corrections.filter((x) => x.gaps.includes(g.id)).map((x) => x.id); return { b: g.id + '.', raw: tick(g.text)
      + (g.id === 'G3' && G3_CLOSED ? ' <span class="vr-n"><b>Closed after the verdict by Phase 4 (amendment A13), outside it:</b> the release does not state it; our Phase 4 proves it from the release’s theorems (rows <a href="#rows">G3a–G3d</a> passed, and the clean-room replay G3-CR).'
        + (passed('G3e') && passed('G3f') ? ' Corollary 1.3, the same bounds for every rectangular format, is proved by Phase 5 (rows <a href="#rows">G3e, G3f</a>).' : '') + '</span>' : '')
      + (g.id === 'G2' && passed('G2a') && passed('G2b') ? ' <span class="vr-n"><b>After the verdict, outside it:</b> with division gates allowed, Phase 5 proves the paper’s bounds on α and the sharper α = 1/2 (rows <a href="#rows">G2a, G2b</a>).</span>' : '')
      + (c.length ? ' <span class="vr-n">(Read with ' + (c.length > 1 ? 'corrections ' : 'correction ') + c.map((id) => '<a href="#corrections">' + esc(id) + '</a>').join(', ') + '.)</span>' : '') }; }))
    + (S.facts.length ? '<h3>Found after the pin</h3>' + C.pRaw('Facts read after the seal, each dated by the amendment that records it and sourced in the provenance report; quoted as recorded.')
      + C.plainList(S.facts.map((f) => ({ b: f.id + ' (' + f.amendment + ', ' + f.when.replace('~', 'about ') + ').', raw: tick(unhash(f.text)) }))) : '') });

/* ---------------------------------------------------------------- the rows */
const rowItem = (r) => '<li class="vr-i"><span class="vr-s">' + ICON(r.state) + C.tag(WORD[r.state].toUpperCase(), KIND[r.state]) + '</span>'
  + '<span class="vr-t"><span class="m">' + esc(r.id) + '</span> ' + esc(r.title) + '</span>' + (r.note ? '<span class="vr-n">' + esc(unhash(r.note)) + '</span>' : '')
  /* the final report: the row's record one click down (every log line that names it, every file its state was read from) */
  + (FINAL && r.evidence && r.evidence.length ? '<details class="more vr-rec"><summary>the record</summary><ul class="plain">' + r.evidence.map((e) => '<li><span class="m">' + C.breakable(e.file) + '</span>'
    + (e.sha256_12 ? ' <span class="m">' + esc(e.sha256_12) + '</span>' : '') + (e.line ? '<br><span class="m">' + logLine(e.line) + '</span>' : '') + '</li>').join('') + '</ul></details>' : '') + '</li>';
/* a band's own words, under its title: Phase 5 says what it tries, in plain words, and then our miss, before its rows */
const BANDNOTE = {};
if (P6.length) BANDNOTE[6] = '<p class="vr-n">What Phase 5 tries: two things the paper states and the release does not prove. Corollary 1.3 bounds the cost of multiplying matrices of any shape, not only square ones; and the paper bounds α, which measures how wide the shared middle dimension of a product can grow (as a power of n) while it still costs about n² operations, in a model where a circuit may also divide. We added the sharper α = 1/2, which the paper does not claim. A Claude agent wrote these in Lean from the paper, without seeing the release’s Lean; the file was sealed before Lean ever read it; a second Claude agent proved them from the release’s theorems.</p>'
  + (C4 ? '<p class="vr-n"><b>Our own miss, before the results.</b> The census listed the release’s theorems with division gates for square matrices only. Phase 5’s prover found one more in the release’s files, the exponent of rectangular matrix multiplication with divisions, and used it for α = 1/2. So divisions beyond the square case are not in what the verdict checked, but the release does prove them (<a href="#corrections">correction C-4</a>).</p>' : '');
const HEROSEC = '<section class="vt-sec" id="progress"><div class="col sec-head"><div class="lab">the audit at a glance</div><h2>' + (FINAL ? 'Where it ended' : 'Where it stands') + '</h2></div>' + HERO + KEY + STATS + '</section>';
const ROWSEC = C.section({ lab: 'the rows', title: 'Every row, phase by phase', id: 'rows', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Each row was written down, with the rule that decides it, and stamped with OpenTimestamps at ' + esc(hm(S0.stamped_utc)) + ' on ' + esc(day(S0.stamped_utc)) + ', before any of them ran; changes since are dated amendments, listed below. A row changes state only when its result is in the lane’s files. Phase 3 is read, not checked by a kernel: it is outside the verdict.' + (S.phases.some((p) => p.phase === 4) ? ' The band after the seal holds a row registered by a dated amendment before it started; it is outside the verdict too.' : '')
    + (S.phases.some((p) => p.phase === 6) ? ' The last two bands were registered after the verdict, which they do not change: Phase 4 (amendment A13) and Phase 5 (amendments A15, A16), our own attempts at what the paper states and the release does not prove.'
      : S.phases.some((p) => p.phase === 5) ? ' The last band, Phase 4, was registered after the verdict (amendment A13), which it does not change: our attempt at the corollaries the release does not state (gap G3).' : '')) + '</div>'
    + '<div class="wide"><div class="vr-grid">' + S.phases.map((p) => '<article class="vr-p"><div class="vr-h">' + esc(BAND(p)) + '</div><h3>' + esc(p.title) + '</h3>' + (BANDNOTE[p.phase] || '') + '<ul class="vr-l">' + p.rows.map(rowItem).join('') + '</ul></article>').join('') + '</div></div>' });

/* ---------------------------------------------------------------- what each verdict would mean: the sealed rule, quoted */
const VR = S.verdict_rule;
const otherHead = VR.otherwise.slice(0, VR.otherwise.indexOf(':') + 1);
const parts = ['REFUTED', 'REFUSED', 'OPEN'].map((w) => { const m = new RegExp(w + ' \\([^)]*(?:\\([^)]*\\)[^)]*)*\\)').exec(VR.otherwise); need(m, 'the sealed rule has no ' + w + ' clause'); return m[0]; });
const RULE = C.section({ lab: CERT || FINAL ? 'what it means' : 'what would count', title: CERT || FINAL ? 'What the verdict means' : 'What each verdict would mean', id: 'verdict',
  bodyRaw: C.pRaw('The rule was sealed with the rows, before any run. Quoted as sealed:')
    + '<div class="vq">' + C.plainList([{ raw: '“' + esc(VR.certified) + '”' }, { raw: '“' + esc(otherHead) + '”' + C.plainList(parts.map((t) => ({ raw: '“' + esc(t) + '”' }))) }, { raw: '“' + esc(VR.not_say) + '”' }]) + '</div>'
    + S.scopes.map((x) => C.pRaw('Amended before any bridge attempt (' + esc(x.amendment) + ', ' + esc(x.when) + '): “' + esc(x.row) + '’s scope (' + esc(x.why) + '): ' + tick(x.text) + '”')).join('')
    + C.pRaw('In plain words: CERTIFIED would say that the release’s Lean theorems check under three kernels and on a second machine, that planted errors are refused, and that two statements of the claim written without seeing the release’s follow from its theorems. The rule’s own last sentence says what it would not say.') });

/* ---------------------------------------------------------------- the panel */
const PANEL = C.section({ lab: 'who does the work', title: 'The panel, and what independent means here', id: 'panel',
  bodyRaw: C.plainList(S.panel.map((p) => ({ b: p.who + '.', text: p.role[0].toUpperCase() + p.role.slice(1) + '.' })))
    + '<div class="note"><span class="lab">independence</span><p>“' + esc(S.independence) + '”</p><p class="vr-n">The pre-registration, sealed before any run; “the release” in that sentence is this audit’s own publication.</p></div>' });

/* ---------------------------------------------------------------- corrections */
const LEDGER = C.section({ lab: 'the corrections ledger', title: 'Every deviation from the plan, and every amendment', id: 'corrections',
  bodyRaw: C.pRaw(N(LG.corrections.length) + (LG.corrections.length === 1 ? ' correction' : ' corrections') + ' of the audit’s own errors, ' + (LG.deviations.length ? N(LG.deviations.length) + (LG.deviations.length === 1 ? ' deviation' : ' deviations') : 'no deviation') + ' from the plan, each written before the step it concerns, and ' + N(LG.amendments.length) + ' amendments, each dated and sealed. Nothing is edited away.')
    + (LG.corrections.length ? '<h3>Corrections</h3>' + C.plainList(LG.corrections.map((e) => ({ b: e.id + ' (' + (e.amendment || e.by) + ', ' + e.when.replace('~', 'about ') + ').', raw: tick(unhash(e.text)) }))) : '')
    + (LG.deviations.length ? '<h3>Deviations</h3>' + C.plainList(LG.deviations.map((e) => ({ b: e.id + ' (' + unhash(e.when) + ').', raw: tick(unhash(e.text)) }))) : '')
    + '<h3>Amendments</h3>' + C.plainList(LG.amendments.map((a) => ({ b: a.id + ' (' + a.when.replace('~', 'about ') + ').', raw: tick(unhash(a.title[0].toUpperCase() + a.title.slice(1))) + '.' + (a.correction ? ' ' + tick(unhash(a.correction)) : '') }))) });

/* ---------------------------------------------------------------- why you can trust this (one click down) */
const sealRows = S.seals.map((s) => [{ raw: '<b>' + esc(s.id) + '</b>' }, s.what, s.stamped_utc ? (s.stamped_approx ? 'about ' : '') + utc(s.stamped_utc) : '—', N(s.files),
  s.bitcoin_block ? 'Bitcoin block ' + String(s.bitcoin_block) : 'awaiting a block (OpenTimestamps, pending)']);
const REPO = 'https://github.com/openai/math/tree/' + S.target.commit;
const trustBody = [
  C.pRaw('<b>Every state on this page is read from a record.</b> The records below are written from the lane’s own files by <span class="m">tools/omega-live-records.js</span>, which refuses when a source no longer says what a record states; this page is built from them by <span class="m">tools/build-omega-live.js</span>, which refuses when they disagree.'),
  C.table({ cols: [{ h: 'record' }, { h: 'sha256, 12 hex digits' }, { h: 'what it holds' }], rows: ['state.json', 'ledger.json', 'page-log.json'].map((f) => [{ raw: '<span class="m">' + esc(DIR + f) + '</span>' }, { raw: '<span class="m">' + sha12(DIR + f) + '</span>' }, J(f).what]) }),
  C.pRaw('<b>The target.</b> <a href="' + ea(REPO) + '">' + esc(S.target.repo) + '</a> at commit <span class="m">' + esc(S.target.commit) + '</span> (' + esc(S.target.committed) + ' UTC), the paper in <span class="m">' + C.breakable(S.target.paper_folder) + '/</span>. The files the pre-registration pins, with their sha256:'),
  C.table({ cols: [{ h: 'file' }, { h: 'sha256' }], rows: S.target.pinned.map((f) => [{ raw: '<span class="m">' + C.breakable(f.file) + '</span>' + (f.about ? ' <span class="vr-n">(' + esc(f.about) + ')</span>' : '') }, { raw: '<span class="m">' + C.breakable(f.sha256) + '</span>' }]) }),
  C.pRaw('<b>The sources</b>, in the cert-machine repository under <span class="m">corpus/omega-nine-fourths/</span>: the pre-registration, the amendments, the deviations, the briefs each agent was given (sealed before it started), the runs’ start and end lines, the Phase 1 log and the seals.'),
  C.table({ cols: [{ h: 'source' }, { h: 'sha256, 12 hex digits' }], rows: S.sources.map((s) => [{ raw: '<span class="m">' + C.breakable(s.file) + '</span>' }, { raw: '<span class="m">' + esc(s.sha256_12) + '</span>' }]) }),
  C.pRaw('<b>The seals.</b> Each lists files by their sha256; the records refuse when a listed file no longer hashes to its sealed value (an append-only file must still begin with the sealed bytes), and when an OpenTimestamps proof does not stamp its own seal file. The proof is upgraded to a Bitcoin block once one confirms it. A seal proves possession by a date, nothing else.'),
  C.table({ cols: [{ h: 'seal' }, { h: 'what' }, { h: 'stamped' }, { h: 'files' }, { h: 'anchor' }], rows: sealRows }),
  S.progress.length ? C.pRaw('<b>The Phase 1 log</b>, line by line as the runner wrote it:') + C.plainList(S.progress.map((p) => ({ raw: '<span class="m">' + logLine(p.line) + '</span>' })))   /* the line is mono already: its code ticks are dropped, not printed */ : '',
  LG.deviations.length ? C.pRaw('<b>The deviations, verbatim.</b>') + C.plainList(LG.deviations.map((e) => ({ b: e.id + ' (' + e.when + ').', raw: tick(e.text) }))) : '',
  S.scripts.length ? C.pRaw('<b>The scripts that run the checks</b>, committed before they ran:') + C.table({ cols: [{ h: 'script' }, { h: 'sha256, 12 hex digits' }], rows: S.scripts.map((s) => [{ raw: '<span class="m">' + C.breakable(s.file) + '</span>' }, { raw: '<span class="m">' + esc(s.sha256_12) + '</span>' }]) }) : '',
  S.phase4 ? C.pRaw('<b>Phase 4, after the verdict.</b> Our statements of the corollaries, written without seeing the release’s Lean: <span class="m">' + C.breakable(S.phase4.statements.file) + '</span>, sha256 <span class="m">' + hexwrap(S.phase4.statements.sha256 || '') + '</span>, sealed by ' + esc(S.phase4.statements.sealed_by || '—') + ' before it was elaborated. The prover’s log, line by line, is in each row’s record above and in <span class="m">corpus/omega-nine-fourths/phase4/prover/PROGRESS.md</span>.') : '',
  S.phase5 ? C.pRaw('<b>Phase 5, after the verdict.</b> Our statements, written without seeing the release’s Lean: <span class="m">' + C.breakable(S.phase5.statements.file) + '</span>, sha256 <span class="m">' + hexwrap(S.phase5.statements.sha256 || '') + '</span>, sealed by ' + esc(S.phase5.statements.sealed_by || '—') + ' before Lean read it. The solution export the three checkers accepted on the prover’s machine: <span class="m">' + esc(S.phase5.solution_export.file) + '</span>, ' + N(S.phase5.solution_export.bytes) + ' bytes, sha256 <span class="m">' + hexwrap(S.phase5.solution_export.sha256) + '</span>. The prover’s log and the clean-room replay’s, line by line, are in each row’s record above and in <span class="m">corpus/omega-nine-fourths/phase5/prover/PROGRESS.md</span>.') : '',
  S.deposit ? C.pRaw('<b>The archive.</b> Every record of the audit (the pre-registration and its seals, the amendments, the logs, the readings, the Phase 4 and Phase 5 proofs), with the three exports below, is deposited on Zenodo under CC BY 4.0: <a href="https://doi.org/' + ea(S.deposit.doi) + '">doi:' + esc(S.deposit.doi) + '</a>, published ' + esc(utc(S.deposit.published_utc)) + '; each export there is the size the lane recorded.') : '',
  S.exports ? C.pRaw('<b>The exported proofs</b>, published as release assets of the public repository (tag <a href="' + ea(S.exports.url) + '"><span class="m">' + esc(S.exports.tag) + '</span></a>)' + (S.exports.files.some((f) => !f.url) ? ' once uploaded' : '') + '; each sha256 and size is the one the lane recorded when the file came home:')
    /* a list, not a table: four columns of a 64-hex digest widen the column on a phone and add spines on a desk */
    + C.plainList(S.exports.files.map((f) => ({ raw: (f.url ? '<a href="' + ea(f.url) + '"><span class="m">' + esc(f.name) + '</span></a>' : '<span class="m">' + esc(f.name) + '</span> (not yet published)') + ', ' + esc(f.what) + ': ' + N(f.bytes) + ' bytes, sha256 <span class="m">' + hexwrap(f.sha256) + '</span>.' }))) : '',
  C.pRaw('<b>The money.</b> ' + S.pods.map((p) => 'Machine <span class="m">' + esc(p.id) + '</span> (' + esc(p.machine) + '), US$' + p.usd_per_h.toFixed(2) + ' an hour, created ' + esc(utc(p.created_utc)) + (p.ended_utc ? ', deleted ' + esc(utc(p.ended_utc)) : ', still running') + '.').join(' ') + ' The figure above is the price times the time since creation, at the minute the records were written, rounded down; the ceiling, US$' + N(S.ceiling_usd) + ', is the pre-registration’s.'),
  C.pRaw('<b>What the build refuses.</b> The page is not built when: a row or gap the records name does not stand in the pre-registration; a file a seal lists no longer hashes to its sealed value, or a timestamp proof does not stamp its seal; a run started from a brief that is not its sealed one; a time in a source is ahead of the clock; a log line names a row with a word the records cannot read; the counts are not the rows’; the verdict disagrees with the rows; the money is above its ceiling; the newest change-log entry does not carry the records’ state row by row; the words would call the claim proved or settled, claim priority, or take a side.')].filter(Boolean);
const TRUST = C.section({ lab: 'one click down', title: 'Why you can trust this', id: 'trust', wide: true,
  bodyRaw: '<div class="wide"><details class="more trust"><summary>The records, the seals and the rules</summary><div class="col">' + trustBody.join('\n') + '</div></details></div>' });

/* ---------------------------------------------------------------- changes */
const CHANGES = C.section({ lab: 'changes', title: 'Changes to this page', id: 'changes',
  bodyRaw: C.plainList(PL.entries.slice().reverse().map((e) => ({ b: utc(e.at) + '.', text: e.what }))) });

/* ---------------------------------------------------------------- the page */
const TITLE = 'The claim that matrix multiplication has exponent 9/4, checked in the open';
const PREREG_URL = 'https://github.com/carlostoledo1891/cert-machine/blob/main/corpus/omega-nine-fourths/PREREG.md';
const HEADER = C.header({ eyebrow: 'Carlos Toledo · ' + (FINAL ? 'an audit, the final report' : 'an audit, in the open'), title: TITLE,
  deck: 'OpenAI’s November 24 release says the exponent of matrix multiplication is 9/4 over every field; the new part is the lower bound. The paper credits the upper bound, ω ≤ 9/4, to an OpenAI preprint (over the complex numbers) and to Amanov, van den Berg and Zuiddam (over every field); its Lean formalization states both directions. ' + (FINAL ? 'This report gives what a machine could check: whether the Lean proof checks, and whether its statement says what the paper claims.' : 'This page checks, while it happens, what a machine can check: whether the Lean proof checks, and whether its statement says what the paper claims.') })
  + '<div class="col"><p class="scope">Read <a href="' + ea(REPO) + '">the release</a>, at the commit pinned for this audit, and <a href="' + ea(PREREG_URL) + '">the pre-registration</a>, sealed before any run. '
  + (FINAL ? 'The final report, built from the records as they stood at ' + esc(hm(S.as_of)) + ' on ' + esc(day(S.as_of)) + ', by the rule sealed before any run.' : 'A live page, rebuilt from its records as the rows move; this build reads them up to ' + esc(hm(S.as_of)) + ' on ' + esc(day(S.as_of)) + '.') + ' Nothing on it is refereed, and its change log at the foot says what changed.'
  + (S.deposit ? ' The records, the sealed rules and the exported proofs are archived on Zenodo: <a href="https://doi.org/' + ea(S.deposit.doi) + '">doi:' + esc(S.deposit.doi) + '</a>.' : '') + '</p></div>'
  /* the final report's verdict line, from the records, before anything else */
  + (FINAL ? '<div class="col"><div class="note"><span class="lab">the verdict</span><p><b>' + esc(S.verdict) + '.</b> ' + esc(S.verdict_reason) + '</p></div></div>' : '');
let body = [HEADER, LEAD, GAPS, HEROSEC, ROWSEC, RULE, PANEL, LEDGER, TRUST, CHANGES].join('\n\n');

const STYLE = `
.vt-sec .sec-head{margin-bottom:var(--s-5)}
.vt-svg .vt-t{outline:none}
.vt-svg .vt-t:focus-visible rect{stroke:var(--ink);stroke-width:2.6}
.vt-svg .vt-dim{fill:var(--ink-3)}
.vt-key{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-5);margin:var(--s-3) auto var(--s-5);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.vt-key>span{display:inline-flex;align-items:center;gap:var(--s-2)}
.vt-kn{color:var(--ink-4);text-transform:none;letter-spacing:0}
.ic{display:inline-block;vertical-align:middle;flex:none}
.ne .plain li{padding:var(--s-2) 0}
.vq .plain .plain{margin-top:var(--s-2)}
.vr-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--s-4)}
.vr-p{background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:var(--s-5);min-width:0}
.vr-h{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.vr-p h3{margin:var(--s-2) 0 var(--s-3)}
.vr-l{list-style:none;margin:0;padding:0;display:grid;gap:var(--s-3)}
.vr-i{display:grid;gap:var(--s-1);border-top:1px solid var(--rule);padding-top:var(--s-3);min-width:0}
.vr-s{display:flex;align-items:center;gap:var(--s-2)}
.vr-t{font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink)}
.vr-n{font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-3)}
.trust .col>p{color:var(--ink-2)}
.vr-rec{margin-top:var(--s-1)}
`;

let html = TPL.render({
  title: TITLE, bodyRaw: body, footRaw: '<p>Built by tools/build-omega-live.js from the records in corpus/omega-live/. The audit by Carlos Toledo with Claude agents (Anthropic) and GPT-6.2-astra (OpenAI, in Codex); the page built with Claude Opus 5.5. Unrefereed.</p>',
  path: '/omega/', cssRaw: STYLE, lang: 'en',
  desc: 'An audit, in the open, of OpenAI’s claim that the exponent of matrix multiplication is 9/4 over every field: whether its Lean proof checks under independent checkers, and whether its Lean statement says what the paper claims, row by row.',
  og: fs.existsSync(path.join(ROOT, 'design', 'assets', 'og-omega.png')) ? { image: '/og-omega.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('omega') } : undefined
});
/* the words never claim more than the records, and never take a side */
const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<wbr>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');   /* &gt; and &lt; too: a quoted log line with "β > 1/2" must match its source to be set aside as quoted */
/* the sealed files' own words are quoted as they stand (the verdict rule's "first failing row", a deviation's "first PIN
   run"); every other word on the page is this builder's, and none of those says "first" */
let ours = visible;
const quoted = [VR.certified, VR.otherwise, VR.not_say, otherHead, ...parts, S.independence].concat(S.gaps.map((g) => g.text), LG.deviations.flatMap((e) => [e.text, unhash(e.text), e.when, unhash(e.when)]), LG.amendments.map((a) => a.title[0].toUpperCase() + a.title.slice(1)), LG.amendments.map((a) => a.title), LG.amendments.filter((a) => a.correction).flatMap((a) => [a.correction, unhash(a.correction)]), LG.corrections.flatMap((e) => [e.text, unhash(e.text)]), S.facts.flatMap((f) => [f.text, unhash(f.text)]), S.scopes.map((x) => x.text), S.progress.map((p) => p.line.replace(/`/g, '')), PL.entries.map((e) => e.what), [S.verdict_reason || '']).filter(Boolean);
const ws = (s) => s.replace(/\s+/g, ' ');
ours = ws(ours);
for (const q of quoted.sort((a, b) => b.length - a.length)) for (const v of [ws(q.replace(/`/g, '')), ws(q.replace(/`([^`]+)`/g, ' $1 '))]) ours = ws(ours.split(v).join(' '));
need(!/\bfirst\b/i.test(ours), 'the page’s own words say "first" (never: no priority): ' + (/.{0,60}\bfirst\b.{0,40}/i.exec(ours) || [''])[0]);
need(!/\b(the )?first (to|independent|audit|outside|external|check|replay|ever|one to)\b|\bfor the first time\b|\bnobody (else )?has\b/i.test(visible), 'the page claims priority (“the first to …”): never');
need(!/(ω = 9\/4|the claim|the lower bound|the exponent|the result) (is|has been|was|stands) (now )?(proved|settled|true|false|established|confirmed|wrong)/i.test(visible), 'the page says the claim is settled');
need(!/\bhostile\b|\battack|\bgaps first\b|\bbefore anyone\b|\bus first\b/i.test(visible), 'the page takes a side (“hostile”, “attack”, “gaps first”, “before anyone”): the copy is impartial');
need(!/\b(?:TODO|undefined|NaN)\b/.test(visible), 'a placeholder reached the page');
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(path.join(OUTDIR, 'index.html'), html);
console.log('site/omega/index.html written' + (FINAL ? ' (FINAL)' : '') + ': ' + S.counts.all + ' rows (' + S.counts.passed + ' passed, ' + S.counts.running + ' running), verdict ' + S.verdict + ', '
  + LG.deviations.length + ' deviation(s), ' + LG.amendments.length + ' amendment(s), ' + PL.entries.length + ' change-log entr' + (PL.entries.length === 1 ? 'y' : 'ies') + ', as of ' + S.as_of);
