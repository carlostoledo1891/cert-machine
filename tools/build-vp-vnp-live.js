#!/usr/bin/env node
/* build-vp-vnp-live.js — site/vp-vnp/index.html: the VP ≠ VNP claim, checked in the open.

   Anthropic published, on 23 November 2026, a paper and a Lean proof claiming VP ≠ VNP over every field. This page is
   the live audit of that release: the gaps first (the release's own), then every pre-registered row and its state, what
   a verdict would and would not mean, who does the work, the corrections ledger and the change log. Rigor is one click
   down, in "Why you can trust this": every record, seal and script with its hash.

   EVERY STATE ON THE PAGE IS READ from corpus/vp-vnp-live/ (written from the lane's files by
   tools/vp-vnp-live-records.js, which refuses when a source no longer says what a record states). This builder reads
   nothing else, and refuses when the records disagree with each other, when the newest page-log entry is not the
   records' state, or when the page's words would claim more than the records (a verdict, "proved", "first").

   Listed: in the sitemap and linked from the audits series of /reports/; the sync keeps its folder (tools/build-site.js)
   and does not write it. A marketing page in design/marketing.js's sense: no hash or record line on the surface.

   usage: node tools/build-vp-vnp-live.js, then `make page` (the sync and the page gates)                       MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const MKT = require(path.join(ROOT, 'design', 'marketing.js'));
const OUTDIR = path.join(ROOT, 'site', 'vp-vnp');
const die = (m) => { console.error('VP-VNP PAGE REFUSED: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const esc = C.esc, ea = C.escAttr;
const DIR = 'corpus/vp-vnp-live/';
const J = (f) => { const p = path.join(ROOT, DIR + f); need(fs.existsSync(p), 'a record is gone: ' + DIR + f); return JSON.parse(fs.readFileSync(p, 'utf8')); };
const sha12 = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 12);
const S = J('state.json'), LG = J('ledger.json'), PL = J('page-log.json');
const N = (x) => Number(x).toLocaleString('en-US');
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const hm = (iso) => { const d = new Date(iso); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0') + ' UTC'; };
const day = (iso) => { const d = new Date(iso); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };

/* ---------------------------------------------------------------- the records agree with each other */
const ROWS = S.phases.flatMap((p) => p.rows);
const STATES = ['passed', 'running', 'pending', 'failed', 'refused', 'open'];
need(ROWS.length === S.counts.all, 'the rows are not the count of rows');
for (const st of STATES) need(ROWS.filter((r) => r.state === st).length === S.counts[st], 'the count of ' + st + ' rows is not the rows’');
need(S.verdict !== 'OPEN' || ROWS.some((r) => r.state !== 'passed'), 'the verdict is OPEN while every row has passed');
need(S.verdict !== 'CERTIFIED' || ROWS.filter((r) => r.phase !== 4).every((r) => r.state === 'passed'), 'the verdict is CERTIFIED while a row has not passed');
need(S.spent_usd <= S.ceiling_usd, 'spent is above the ceiling: the lane must say REFUSED, not this page');
need(S.gaps.length >= 1 && S.gaps.every((g) => /^G\d+$/.test(g.id)), 'the gaps are not G-numbered');
need(LG.entries.length >= 1 && LG.entries[0].id === 'D0', 'the corrections ledger has no D0');
const NEWEST = PL.entries[PL.entries.length - 1];
need(NEWEST && NEWEST.as_of === S.as_of && NEWEST.passed === S.counts.passed && NEWEST.running === S.counts.running && NEWEST.verdict === S.verdict,
  'the newest page-log entry is not the records’ state (as of ' + S.as_of + ', ' + S.counts.passed + ' passed, ' + S.counts.running + ' running): add one with node tools/vp-vnp-live-records.js --log "…"');
need(MKT.isMarketing('vp-vnp/index.html'), 'the page is not on design/marketing.js’s list: its figures would print hashes on the surface');

/* ---------------------------------------------------------------- the states: a word and a shape, never colour alone */
const WORD = { passed: 'passed', running: 'running', pending: 'pending', failed: 'failed', refused: 'refused', open: 'open' };
const KIND = { passed: 'held', running: 'open', pending: 'open', failed: 'dep', refused: 'open', open: 'open' };
function tile(st, x, y, w, h, id) {
  const o = [];
  /* passed: a heavy outline, a full bar along its foot and a tick; the label stays ink on the tile, readable on any ground */
  if (st === 'passed') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"/>'
    + '<rect x="' + (x + 3) + '" y="' + (y + h - 6) + '" width="' + (w - 6) + '" height="3.5" rx="1.75" fill="var(--ink)"/>'
    + '<path d="M' + (x + w - 13) + ' ' + (y + 7) + ' l3.2 3.2 l6 -6" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>');
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
const ICON = (st) => '<svg class="ic" viewBox="0 0 32 22" width="29" height="20" aria-hidden="true">' + tile(st, 1, 1, 30, 20, '') + '</svg>';

/* ---------------------------------------------------------------- HERO: every row, phase by phase */
function heroSvg(narrow) {
  const W0 = narrow ? 360 : 1000, LBL = narrow ? 0 : 230, TW = narrow ? 62 : 68, TH = narrow ? 34 : 40, GX = 8, GY = 10, PER = narrow ? 5 : 10;
  const o = [];
  let y = narrow ? 4 : 10;
  const bands = S.phases.map((p) => {
    const lines = Math.max(1, Math.ceil(p.rows.length / PER)), top = y + (narrow ? 22 : 0);
    const h = lines * TH + (lines - 1) * GY;
    y = top + h + (narrow ? 22 : 24);
    return { p, top, h };
  });
  const H = y - (narrow ? 10 : 14);
  o.push('<svg viewBox="0 0 ' + W0 + ' ' + H + '" role="img" class="vt-svg" aria-label="' + ea('Every pre-registered row of the audit, in five phases, one tile each: '
    + S.counts.passed + ' passed (a tick and a full bar), ' + S.counts.running + ' running (a dot), ' + S.counts.pending + ' pending (faint)'
    + (S.counts.failed ? ', ' + S.counts.failed + ' failed (a cross)' : '') + '. The list below the figure says each in words.') + '">');
  for (const { p, top, h } of bands) {
    if (narrow) o.push('<text x="0" y="' + (top - 8) + '" class="t-note">phase ' + p.phase + ' · ' + esc(p.title) + '</text>');
    else {
      o.push('<text x="0" y="' + (top + h / 2 - 3) + '" class="t-lab">phase ' + p.phase + '</text>');
      o.push('<text x="0" y="' + (top + h / 2 + 14) + '" class="t-note">' + esc(p.title) + '</text>');
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
  captionRaw: 'Every row the audit registered before it ran, one tile each, as of ' + esc(hm(S.as_of)) + ' on ' + esc(day(S.as_of)) + '. A tick and a full bar: passed. A dot: running. Faint: pending.'
    + (S.counts.failed ? ' A cross: failed.' : '') + ' Each row is said in words below.'
});
const KEY = '<div class="wide vt-key" aria-label="the states">' + STATES.filter((st) => S.counts[st] || ['passed', 'running', 'pending'].includes(st))
  .map((st) => '<span>' + ICON(st) + esc(WORD[st]) + ' <span class="vt-kn">' + N(S.counts[st]) + '</span></span>').join('') + '</div>';
const blocks = S.seals.filter((s) => s.bitcoin_block).length;
const STATS = C.stats([
  { k: 'verdict today', v: S.verdict, n: S.verdict_words },
  { k: 'rows passed', v: N(S.counts.passed) + ' of ' + N(S.counts.all), n: N(S.counts.running) + ' running, ' + N(S.counts.pending) + ' pending' + (S.counts.failed ? ', ' + N(S.counts.failed) + ' failed' : '') },
  { k: 'rented machines', v: 'US$' + S.spent_usd.toFixed(2), n: 'of a ceiling of US$' + N(S.ceiling_usd) },
  { k: 'seals in Bitcoin', v: N(S.seals.length), n: blocks === S.seals.length ? 'each in a block' : blocks ? blocks + ' in a block, ' + (S.seals.length - blocks) + ' awaiting one' : 'awaiting a block' }]);

/* ---------------------------------------------------------------- what is not established, first */
const LEAD = '<div class="col"><div class="note ne"><span class="lab">what is not established</span>' + C.plainList([
  { b: 'Nothing is decided yet.', text: 'The verdict today is ' + S.verdict + ': ' + N(S.counts.passed) + ' of the ' + N(S.counts.all) + ' rows have passed, ' + N(S.counts.running) + ' are running and ' + N(S.counts.pending) + ' have not started' + (S.counts.failed ? '; ' + N(S.counts.failed) + ' failed' : '') + '.' },
  { b: 'No person has checked it.', raw: 'The release says so itself: “' + esc(S.quotes[1]) + '” This page does not change that. It checks what a machine can check: whether the proof checks, and whether its statement says what the paper claims.' },
  { b: 'Claude is checking a Claude claim.', raw: 'The release says: “' + esc(S.quotes[0]) + '” Claude models do most of this audit too. Who does what, and what “independent” means here, is <a href="#panel">below</a>.' },
  { b: 'A pass would not settle it for everyone.', text: 'Even if every row passes, what is certified is the formal statement as the textbooks define it, checked by machines. Whether those are the right definitions, and whether the proof is the one people wanted, is for those who work on the question.' }]) + '</div></div>';

/* ---------------------------------------------------------------- the gaps */
const GAPS = C.section({ lab: 'the gaps', title: 'What the release itself leaves open', id: 'gaps',
  bodyRaw: C.pRaw('Read from the release’s own text, at the commit pinned before anything ran. The audit tries to close the first four; the last two it can only report.')
    + C.plainList(S.gaps.map((g) => ({ b: g.id + '.', text: g.text }))) });

/* ---------------------------------------------------------------- the rows */
const rowItem = (r) => '<li class="vr-i"><span class="vr-s">' + ICON(r.state) + C.tag(WORD[r.state].toUpperCase(), KIND[r.state]) + '</span>'
  + '<span class="vr-t"><span class="m">' + esc(r.id) + '</span> ' + esc(r.title) + '</span>' + (r.note ? '<span class="vr-n">' + esc(r.note) + '</span>' : '') + '</li>';
const ROWSEC = C.section({ lab: 'the rows', title: 'Every row, phase by phase', id: 'rows', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Each row was written down, with the rule that decides it, and timestamped in Bitcoin before any of them ran. A row changes state only when its result is in the lane’s files.') + '</div>'
    + '<div class="wide"><div class="vr-grid">' + S.phases.map((p) => '<article class="vr-p"><div class="vr-h">phase ' + p.phase + '</div><h3>' + esc(p.title) + '</h3><ul class="vr-l">' + p.rows.map(rowItem).join('') + '</ul></article>').join('') + '</div></div>' });

/* ---------------------------------------------------------------- what would count */
const RULE = C.section({ lab: 'what would count', title: 'What a verdict would mean', id: 'verdict',
  bodyRaw: C.plainList([
    { b: 'CERTIFIED would mean:', text: 'the proof checks in Lean’s own kernel, in nanoda and in con-leche, and again on a second machine that never ran the release’s code; two planted errors are refused; two statements of the claim, written from the textbooks by writers who never saw the release’s, are both proved from its theorems; the statement is shown not to be empty; a planted false version is proved false; and every real difference an adversarial reader finds is decided.' },
    { b: 'Anything less', text: 'and the verdict names the row that failed: REFUTED, if a defect in meaning is proved (the Lean says less than the paper, or nothing); REFUSED, if a row cannot be run within the money or the time; OPEN, if it is undecided, with the reason.' },
    { b: 'What CERTIFIED would still not say:', text: 'that any person has checked the mathematics, or anything beyond what the checkers, the three standard axioms and the Mathlib definitions the statements use can carry.' }])
    + C.pRaw('The rule above is the plain-words reading of the one sealed before the run; its exact text is one click down.') });

/* ---------------------------------------------------------------- the panel */
const PANEL = C.section({ lab: 'who does the work', title: 'The panel, and what independent means here', id: 'panel',
  bodyRaw: C.plainList(S.panel.map((p) => ({ b: p.who + '.', text: (p.role[0].toUpperCase() + p.role.slice(1)).replace(/\bthe operator\b/g, 'Carlos Toledo') + '.' })))   /* the lane's word for him, said as his name on a public page */
    + '<div class="note"><span class="lab">independence</span><p>' + esc(S.independence) + '</p></div>' });

/* ---------------------------------------------------------------- corrections */
const LEDGER = C.section({ lab: 'the corrections ledger', title: 'Every deviation from the plan', id: 'corrections',
  bodyRaw: C.pRaw(N(LG.entries.length) + (LG.entries.length === 1 ? ' deviation so far' : ' deviations so far') + '. Each is kept, never edited away.')
    + C.plainList(LG.entries.map((e) => ({ b: e.id + ' (' + e.when + ').', text: e.text }))) });

/* ---------------------------------------------------------------- why you can trust this (one click down) */
const sealRows = S.seals.map((s) => [{ raw: '<b>' + esc(s.id) + '</b>' }, s.what, s.stamped_utc.replace('T', ' ').replace('Z', ' UTC'), N(s.files),
  s.bitcoin_block ? 'Bitcoin block ' + N(s.bitcoin_block).replace(/,/g, '') : 'awaiting a block (OpenTimestamps, pending)']);
const trustBody = [
  C.pRaw('<b>Every state on this page is read from a record.</b> The records below are written from the lane’s own files by <span class="m">tools/vp-vnp-live-records.js</span>, which refuses when a source no longer says what a record states; this page is built from them by <span class="m">tools/build-vp-vnp-live.js</span>, which refuses when they disagree.'),
  C.table({ cols: [{ h: 'record' }, { h: 'sha256, 12 hex digits' }, { h: 'what it holds' }], rows: ['state.json', 'ledger.json', 'page-log.json'].map((f) => [{ raw: '<span class="m">' + esc(DIR + f) + '</span>' }, { raw: '<span class="m">' + sha12(DIR + f) + '</span>' }, J(f).what]) }),
  C.pRaw('<b>The sources</b>, in the cert-machine repository under <span class="m">corpus/vp-vnp/</span>: the control room’s state, the pre-registration, the deviations, the target’s 333 file hashes, the two briefs and the seals.'),
  C.table({ cols: [{ h: 'source' }, { h: 'sha256, 12 hex digits' }], rows: S.sources.map((s) => [{ raw: '<span class="m">' + C.breakable(s.file) + '</span>' }, { raw: '<span class="m">' + esc(s.sha256_12) + '</span>' }]) }),
  C.pRaw('<b>The seals.</b> Each lists files by their sha256; the records refuse when a listed file no longer hashes to its sealed value. The stamp is an OpenTimestamps proof, upgraded to a Bitcoin block once one confirms it. A seal proves possession by a date, nothing else.'),
  C.table({ cols: [{ h: 'seal' }, { h: 'what' }, { h: 'stamped' }, { h: 'files' }, { h: 'anchor' }], rows: sealRows }),
  C.pRaw('<b>The scripts that run the checks</b>, committed before they ran:'),
  C.table({ cols: [{ h: 'script' }, { h: 'sha256, 12 hex digits' }], rows: S.scripts.map((s) => [{ raw: '<span class="m">' + C.breakable(s.file) + '</span>' }, { raw: '<span class="m">' + esc(s.sha256_12) + '</span>' }]) }),
  C.pRaw('<b>The target.</b> ' + esc(S.target.repo) + ', folder <span class="m">' + esc(S.target.folder) + '</span>, last changed at commit <span class="m">' + esc(S.target.commit) + '</span> (' + esc(S.target.published_utc.replace('T', ' ').replace('Z', ' UTC')) + '): '
    + N(S.target.files) + ' files, ' + N(S.target.lean_files) + ' Lean files, ' + N(S.target.lean_lines) + ' lines of Lean; Lean ' + esc(S.target.lean) + ', Mathlib <span class="m">' + esc(S.target.mathlib.slice(0, 12)) + '</span>.'),
  C.pRaw('<b>The verdict rule, as sealed.</b> ' + esc(S.verdict_rule)),
  C.pRaw('<b>What the build refuses.</b> The page is not built when: a row or gap the state names does not stand in the pre-registration; a file a seal lists no longer hashes to its sealed value; the release’s README copy is not the pinned one, or no longer says the two sentences quoted here; the counts are not the rows’; the verdict disagrees with the rows; the money is above its ceiling; the newest change-log entry is not the records’ state; the words would say proved, or claim priority.')];
const TRUST = C.section({ lab: 'one click down', title: 'Why you can trust this', id: 'trust', wide: true,
  bodyRaw: '<div class="wide"><details class="more trust"><summary>The records, the seals and the rules</summary><div class="col">' + trustBody.join('\n') + '</div></details></div>' });

/* ---------------------------------------------------------------- changes */
const CHANGES = C.section({ lab: 'changes', title: 'Changes to this page', id: 'changes',
  bodyRaw: C.plainList(PL.entries.slice().reverse().map((e) => ({ b: e.at.replace('T', ' ').replace('Z', ' UTC') + '.', text: e.what }))) });

/* ---------------------------------------------------------------- the page */
const TITLE = 'The VP ≠ VNP claim, checked in the open';
const HEADER = C.header({ eyebrow: 'Carlos Toledo · an audit, in the open', title: TITLE,
  deck: 'On 23 November 2026 Anthropic published a paper and a Lean proof claiming VP ≠ VNP over every field: arithmetic circuits for the permanent, and for the Hamiltonian cycle polynomial, need superpolynomially many gates. Both were written by AI models. This page checks, while it happens, what a machine can check: whether the proof checks, and whether its Lean statement says what the paper claims.' })
  + '<div class="col">' + C.scope('A live page, rebuilt from its records at every phase finish; this build reads them up to ' + hm(S.as_of) + ' on ' + day(S.as_of) + '. Nothing on it is refereed, and its change log at the foot says what changed.') + '</div>';
const HEROSEC = '<section class="vt-sec" id="progress"><div class="col sec-head"><div class="lab">the audit at a glance</div><h2>Where it stands</h2></div>' + HERO + KEY + STATS + '</section>';
let body = [HEADER, LEAD, HEROSEC, GAPS, ROWSEC, RULE, PANEL, LEDGER, TRUST, CHANGES].join('\n\n');

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
.vr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-4);align-items:start}
@media (max-width:900px){.vr-grid{grid-template-columns:minmax(0,1fr)}}
.vr-p{background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:var(--s-5);min-width:0}
.vr-h{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.vr-p h3{margin:var(--s-2) 0 var(--s-3)}
.vr-l{list-style:none;margin:0;padding:0;display:grid;gap:var(--s-3)}
.vr-i{display:grid;gap:var(--s-1);border-top:1px solid var(--rule);padding-top:var(--s-3);min-width:0}
.vr-s{display:flex;align-items:center;gap:var(--s-2)}
.vr-t{font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink)}
.vr-n{font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-3)}
.trust .col>p{color:var(--ink-2)}
`;

let html = TPL.render({
  title: TITLE, bodyRaw: body, footRaw: '<p>Built by tools/build-vp-vnp-live.js from the records in corpus/vp-vnp-live/. The audit by Carlos Toledo with Claude Opus 5.5 (Anthropic) and GPT-6.2-astra (OpenAI, in Codex); readings by Grok and Gemini pasted by him; the page built with Claude Opus 5.5. Unrefereed.</p>',
  path: '/vp-vnp/', cssRaw: STYLE, lang: 'en',
  desc: 'An audit, in the open, of Anthropic’s claim that VP ≠ VNP over every field: whether its Lean proof checks under independent checkers, and whether its Lean statement says what the paper claims, row by row, with the gaps first.',
  og: fs.existsSync(path.join(ROOT, 'design', 'assets', 'og-vp-vnp.png')) ? { image: '/og-vp-vnp.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('vp-vnp') } : undefined
});
/* the words never claim more than the records */
const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
need(!/\b(the )?first (to|independent|audit|outside|external|check|replay|ever|one to)\b|\bfor the first time\b|\bnobody (else )?has\b/i.test(visible), 'the page claims priority (“the first to …”): never');
need(!/(VP ≠ VNP|the claim|the conjecture|the separation|Valiant’s conjecture) (is|has been|was|stands) (now )?(proved|settled|true|established|confirmed)|\bproves (that )?VP\b|\bVP ≠ VNP,? proved\b/i.test(visible), 'the page says the claim is proved');
need(!/\b(?:TODO|undefined|NaN)\b/.test(visible), 'a placeholder reached the page');
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(path.join(OUTDIR, 'index.html'), html);
console.log('site/vp-vnp/index.html written: ' + S.counts.all + ' rows (' + S.counts.passed + ' passed, ' + S.counts.running + ' running), verdict ' + S.verdict + ', '
  + LG.entries.length + ' deviation(s), ' + PL.entries.length + ' change-log entr' + (PL.entries.length === 1 ? 'y' : 'ies') + ', as of ' + S.as_of);
