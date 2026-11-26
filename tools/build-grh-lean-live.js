#!/usr/bin/env node
/* build-grh-lean-live.js — site/grh-lean/index.html: the grh-lean release (Levent Alpöge's Lean formalization of RH and
   of GRH for Dirichlet L-functions, with Claude, in two editions), checked in the open.

   The page, plain words first and the dense material one click down: the gaps and limits before any result; what was
   checked, row by row, with the verdict the recorder gives (corpus/grh-lean-check/record.json, written by
   tools/check-grh-lean.py, the ONLY source of a verdict); why this run could finish when the same judge on the earlier
   release could not; D1, the declarations the five theorems never use, split by the rule stated once in
   tools/grh-lean-records.js; the timeline from the pod's log; the money; and "Why you can trust this": pins, versions,
   the statement files, the controls, the seals and every source with its hash.

   EVERY STATE ON THE PAGE IS READ from corpus/grh-lean-live/ (written by tools/grh-lean-records.js, which refuses when a
   source no longer says what a record states). This builder reads nothing else, and refuses when the records disagree
   with each other, when the claim's verdict is one its rows do not support, when the money is above the ceiling, when the
   newest page-log entry is not the records' state, or when the page's own words would call RH or GRH proved or settled,
   or claim priority.

   Listed: in the sitemap and in the audits series of /reports/; the sync keeps its folder (tools/build-site.js) and does
   not write it. A marketing page in design/marketing.js's sense: no hash or commit link on the surface.

   The update loop: pull the pod's /results (rsync, files under 5 MB), python3 -I tools/check-grh-lean.py --write,
   node tools/grh-lean-records.js, node tools/grh-lean-records.js --log "what changed" (when a row moved),
   node tools/build-grh-lean-live.js, then `make page`.                                                            MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const MKT = require(path.join(ROOT, 'design', 'marketing.js'));
const OUTDIR = path.join(ROOT, 'site', 'grh-lean');
const die = (m) => { console.error('GRH-LEAN PAGE REFUSED: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const esc = C.esc, ea = C.escAttr;
const DIR = 'corpus/grh-lean-live/';
const J = (f) => { const p = path.join(ROOT, DIR + f); need(fs.existsSync(p), 'a record is gone: ' + DIR + f + ' (node tools/grh-lean-records.js)'); return JSON.parse(fs.readFileSync(p, 'utf8')); };
const sha12 = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 12);
const S = J('state.json'), D = J('d1.json'), PL = J('page-log.json');
const N = (x) => Number(x).toLocaleString('en-US');
const WORDN = (n) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen'][n] || N(n);
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const hm = (iso) => iso.slice(11, 16) + ' UTC';
const day = (iso) => { const d = new Date(iso); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
const utc = (iso) => iso.replace('T', ' ').replace(/^(\S+ \d\d:\d\d)(:\d\d)?Z$/, '$1 UTC');
const dur = (s) => s >= 5400 ? (Math.round(s / 360) / 10) + ' h' : s < 60 ? Math.round(s) + ' s' : Math.round(s / 60) + ' min';
const GIB = (kib) => (Math.round(kib / 1048576 * 10) / 10).toFixed(1);
/* backticked words set as code; everything else escaped */
const tick = (s) => C.breakable(s).replace(/`([^`]+)`/g, '<span class="m">$1</span>');
/* no hash on the surface: a hex run of 7+ digits with a letter in it is one click down */
const unhash = (s) => String(s).replace(/\b(?=[0-9a-f]*[a-f])[0-9a-f]{7,64}\b…?/g, '[a hash, one click down]');
const hexwrap = (h) => esc(h).replace(/([0-9a-f]{16})(?=[0-9a-f])/g, '$1<wbr>');
const logLine = (s) => C.breakable(s.replace(/`/g, '')).replace(/([0-9a-f]{16})(?=[0-9a-f]{8})/g, '$1<wbr>');
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';

/* ---------------------------------------------------------------- the records agree with each other */
const ROWS = S.rows;
need(ROWS.length === S.counts.all, 'the rows are not the count of rows');
need(ROWS.filter((r) => r.verdict === 'CERTIFIED').length === S.counts.certified && ROWS.filter((r) => r.verdict === 'PENDING').length === S.counts.pending
  && ROWS.filter((r) => r.state === 'running').length === S.counts.running, 'the counts are not the rows’');
need(S.in_the_open === (S.counts.pending > 0) && S.remaining.join(' ') === ROWS.filter((r) => r.verdict === 'PENDING').map((r) => r.id).join(' '), 'the rows that remain are not the pending rows');
const rule = S.claim.rule_rows.map((id) => ROWS.find((r) => r.id === id));
need(rule.every(Boolean), 'a row of the verdict rule is missing');
need(S.claim.verdict !== 'CERTIFIED' || rule.every((r) => r.verdict === 'CERTIFIED'), 'the claim is CERTIFIED while a row of the verdict rule is not');
need(S.claim.verdict !== 'PENDING' || rule.some((r) => r.verdict === 'PENDING'), 'the claim is PENDING while every row of its rule has a verdict');
need(S.spent_usd <= S.ceiling_usd, 'spent (US$' + S.spent_usd + ') is above the ceiling (US$' + S.ceiling_usd + ')');
need(D.as_of === S.as_of, 'd1.json and state.json were not written at the same minute');
const NEWEST = PL.entries[PL.entries.length - 1];
const ROWSTATE = ROWS.map((r) => r.id + ':' + (r.verdict || 'null') + (r.state === 'running' ? '/running' : '')).join(' ');
need(NEWEST && NEWEST.as_of <= S.as_of && NEWEST.rows === ROWSTATE && NEWEST.claim === S.claim.verdict,
  'the newest page-log entry is not the records’ state (rows ' + ROWSTATE + '): add one with node tools/grh-lean-records.js --log "…"');
need(MKT.isMarketing('grh-lean/index.html'), 'the page is not on design/marketing.js’s list: its figures would print hashes on the surface');
const CERT = S.claim.verdict === 'CERTIFIED';
const R = (id) => ROWS.find((r) => r.id === id);

/* ---------------------------------------------------------------- the states: a word and a shape, never colour alone */
const ST = (r) => r.verdict === 'CERTIFIED' ? 'certified' : r.verdict === 'COMPUTED' ? 'computed' : r.verdict === 'REFUSED' ? 'refused' : r.verdict === null ? 'unreadable' : r.state === 'running' ? 'running' : 'waiting';
const WORD = { certified: 'CERTIFIED', computed: 'COMPUTED', refused: 'REFUSED', unreadable: 'no verdict', running: 'PENDING · running', waiting: 'PENDING · waiting' };
const KIND = { certified: 'held', computed: 'cert', refused: 'open', unreadable: 'dep', running: 'open', waiting: 'open' };
const SHAPE = { certified: 'a tick and a full bar', computed: 'two short lines', refused: 'a slash', unreadable: 'a cross', running: 'a dot', waiting: 'faint' };
const ORDER = ['certified', 'computed', 'running', 'waiting', 'refused', 'unreadable'];
function tile(st, x, y, w, h, id) {
  const o = [];
  if (st === 'certified') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"/>'
    + '<rect x="' + (x + 3) + '" y="' + (y + h - 6) + '" width="' + (w - 6) + '" height="3.5" rx="1.75" fill="var(--ink)"/>'
    + '<path d="M' + (x + w - 13) + ' ' + (y + 7) + ' l3.2 3.2 l6 -6" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>');
  else if (st === 'computed') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"/>'
    + '<path d="M' + (x + w - 15) + ' ' + (y + 6) + ' h9 M' + (x + w - 15) + ' ' + (y + 10.5) + ' h6" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>');
  else if (st === 'running') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"/>'
    + '<circle cx="' + (x + w - 8) + '" cy="' + (y + 8) + '" r="3.5" fill="var(--ink)"/>');
  else if (st === 'waiting') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--sunk)" stroke="var(--ink-4)" stroke-width="1"/>');
  else if (st === 'unreadable') o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>'
    + '<path d="M' + (x + w - 12) + ' ' + (y + 4) + ' l8 8 M' + (x + w - 4) + ' ' + (y + 4) + ' l-8 8" stroke="var(--ink)" stroke-width="1.6"/>');
  else o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--surface)" stroke="var(--ink-3)" stroke-width="1.4"/>'
    + '<path d="M' + (x + w - 12) + ' ' + (y + 12) + ' l8 -8" stroke="var(--ink-3)" stroke-width="1.6"/>');
  if (id) o.push('<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 4.5) + '" text-anchor="middle" class="t-lab' + (st === 'waiting' ? ' vt-dim' : '') + '">' + esc(id.replace('-', '–')) + '</text>');
  return o.join('');
}
const ICON = (st) => '<svg class="ic" viewBox="0 0 32 22" width="29" height="20" aria-hidden="true">' + tile(st, 1, 1, 30, 20, '') + '</svg>';
const present = ORDER.filter((st) => ROWS.some((r) => ST(r) === st));
/* the hero: the rows in three bands — the build and the axioms; the kernels, the judge and the controls; the meaning and the list */
const BANDS = [['the release', 'integrity, builds, axioms', ['I1', 'B1', 'B2', 'A1']], ['the checkers', 'kernels, judge, controls', ['S1', 'S2', 'K1', 'K2', 'KR', 'C1-C3', 'E1']], ['the statements', 'meaning, unused names', ['CHAR', 'D1']]];
need(BANDS.flatMap((b) => b[2]).sort().join() === ROWS.map((r) => r.id).sort().join(), 'the hero’s bands are not the rows');
function heroSvg(narrow) {
  const W0 = narrow ? 360 : 1000, LBL = narrow ? 0 : 236, TW = narrow ? 66 : 74, TH = narrow ? 34 : 40, GX = narrow ? 7 : 8, GY = 10, PER = narrow ? 5 : 7;
  const o = [];
  let y = narrow ? 4 : 10;
  const bands = BANDS.map(([lab, sub, ids]) => {
    const lines = Math.ceil(ids.length / PER), top = y + (narrow ? 22 : 0), h = lines * TH + (lines - 1) * GY;
    y = top + h + (narrow ? 22 : 24);
    return { lab, sub, ids, top, h };
  });
  const H = y - (narrow ? 10 : 14);
  o.push('<svg viewBox="0 0 ' + W0 + ' ' + H + '" role="img" class="vt-svg" aria-label="' + ea('Every registered row of the check, one tile each: ' + present.map((st) => ROWS.filter((r) => ST(r) === st).length + ' ' + WORD[st] + ' (' + SHAPE[st] + ')').join(', ') + '. The list below the figure says each in words.') + '">');
  for (const b of bands) {
    if (narrow) o.push('<text x="0" y="' + (b.top - 8) + '" class="t-note">' + esc(b.lab + ' · ' + b.sub) + '</text>');
    else { o.push('<text x="0" y="' + (b.top + b.h / 2 - 3) + '" class="t-lab">' + esc(b.lab) + '</text>'); o.push('<text x="0" y="' + (b.top + b.h / 2 + 14) + '" class="t-note">' + esc(b.sub) + '</text>'); }
    b.ids.forEach((id, i) => {
      const r = R(id), x = LBL + (i % PER) * (TW + GX), yy = b.top + Math.floor(i / PER) * (TH + GY);
      o.push('<g class="vt-t" tabindex="0" aria-label="' + ea(id + ', ' + WORD[ST(r)] + ': ' + r.title) + '"><title>' + esc(id + ' · ' + WORD[ST(r)] + ' · ' + r.title) + '</title>' + tile(ST(r), x, yy, TW, TH, id) + '</g>');
    });
  }
  o.push('</svg>');
  const svg = o.join('');
  need(!/stroke-dasharray/.test(svg), 'a dash pattern outside design/grammar.js');
  return svg;
}
const HERO = C.figure({ hero: true, svgRaw: heroSvg(false), svgNarrowRaw: heroSvg(true), record: DIR + 'state.json', pins: false,
  captionRaw: 'Every row registered before the run, one tile each, as of ' + esc(hm(S.as_of)) + ' on ' + esc(day(S.as_of)) + '. ' + present.map((st) => SHAPE[st][0].toUpperCase() + SHAPE[st].slice(1) + ': ' + WORD[st] + '.').join(' ') + ' Each verdict is the recorder’s; each row is said in words below.' });
const KEY = '<div class="wide vt-key" aria-label="the states">' + present.map((st) => '<span>' + ICON(st) + esc(WORD[st]) + ' <span class="vt-kn">' + N(ROWS.filter((r) => ST(r) === st).length) + '</span></span>').join('') + '</div>';
const STATS = C.stats([
  { k: 'the formal claim today', v: S.claim.verdict, n: CERT ? 'by the rule sealed before the run' : S.in_the_open ? 'rows still to run: ' + S.remaining.map((x) => x.replace('-', '–')).join(', ') : 'every row has a verdict' },
  { k: 'rows certified', v: N(S.counts.certified) + ' of ' + N(S.counts.all), n: [S.counts.running ? N(S.counts.running) + ' running' : '', S.counts.not_started ? N(S.counts.not_started) + ' waiting' : '', S.counts.computed ? N(S.counts.computed) + ' computed' : '', S.counts.refused ? N(S.counts.refused) + ' refused' : ''].filter(Boolean).join(', ') || 'none left' },
  S.compare ? { k: 'the judge on this release', v: dur(S.compare.here.wall_seconds), n: GIB(S.compare.here.rss_kib) + ' GiB at its peak; on the earlier release it was stopped after ' + Math.floor(S.compare.earlier.wall_seconds / 3600) + ' h with no verdict' } : { k: 'the judge on this release', v: R('S1').verdict || 'no verdict', n: 'row S1' },
  { k: 'rented machine', v: 'US$' + S.spent_usd.toFixed(2), n: 'of a ceiling of US$' + N(S.ceiling_usd) + (S.pod.deleted_utc ? '; deleted ' + hm(S.pod.deleted_utc) : '; US$' + S.pod.usd_per_h.toFixed(2) + ' an hour since ' + hm(S.pod.created_utc)) }]);

/* ---------------------------------------------------------------- gaps and limits, before the results */
const GAPS = C.section({ lab: 'gaps and limits', title: 'What this check does not establish, before the results', id: 'gaps',
  bodyRaw: '<div class="note ne"><span class="lab">before any result</span>' + C.plainList(S.gaps.map((g) => ({ b: g.b, raw: tick(unhash(g.text)) }))) + '</div>'
    + C.pRaw('The pre-registration’s verdict rule, sealed before the run, says the same in its own words; it is quoted in full <a href="#trust">one click down</a>.') });

/* ---------------------------------------------------------------- the rows */
const rowItem = (r) => '<li class="vr-i"><span class="vr-s">' + ICON(ST(r)) + C.tag(WORD[ST(r)], KIND[ST(r)]) + '</span>'
  + '<span class="vr-t"><span class="m">' + esc(r.id.replace('-', '–')) + '</span> ' + esc(r.title) + '</span><span class="vr-n">' + tick(unhash(r.note)) + '</span>'
  + (r.id === 'C1-C3' && S.controls.some((c) => c.refusals.length) ? '<ul class="vr-c">' + S.controls.map((c) => '<li><b>' + esc(c.id) + '</b> ' + tick(c.planted[0].toUpperCase() + c.planted.slice(1)) + '. '
    + (c.refusals.length ? c.refusals.map((f) => esc(f.by) + ', exit ' + f.exit + ': <span class="m">' + esc(f.line) + '</span>').join('; ') : 'no refusal on file yet') + '.</li>').join('') + '</ul>' : '')
  + '</li>';
const CLAIMLINE = CERT ? 'By the rule sealed before the run, the formal claim is CERTIFIED: Lean accepts proofs of the five stated theorems from the three standard axioms, checked by Lean’s own replay and by two kernels written apart from it, and the planted errors were refused.'
  : S.claim.verdict === 'PENDING' ? 'The formal claim is PENDING: of the rows its rule rests on (' + S.claim.rule_rows.map((x) => x.replace('-', '–')).join(', ') + '), ' + rule.filter((r) => r.verdict === 'CERTIFIED').map((r) => r.id.replace('-', '–')).join(', ') + ' are CERTIFIED; ' + rule.filter((r) => r.verdict === 'PENDING').map((r) => r.id.replace('-', '–')).join(', ') + (rule.filter((r) => r.verdict === 'PENDING').length === 1 ? ' still waits' : ' still wait') + (rule.filter((r) => r.verdict === 'PENDING').map((r) => r.id).join() === 'A1' ? ' for the compact edition’s axioms.' : '.')
    : 'The formal claim reads ' + S.claim.verdict + ', as the recorder gives it: ' + S.claim.why;
const ROWSEC = C.section({ lab: 'what was checked', title: 'What was checked, and the answer so far', id: 'rows', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('The claim checked is the formal one: Lean accepts proofs of these five stated theorems, ' + S.target.theorems.map((t) => '<span class="m">' + esc(t) + '</span>').join(', ') + ', from the three standard axioms. Each row below was written down, with the rule that decides it, before any run; each verdict is the one the recorder gives from the machine’s own output files.')
    + '<div class="note"><span class="lab">the answer so far</span><p>' + esc(CLAIMLINE) + '</p>' + (S.in_the_open ? '<p class="vr-n">This page is in the open: ' + WORDN(S.remaining.length) + (S.remaining.length === 1 ? ' row remains (' : ' rows remain (') + S.remaining.map((x) => x.replace('-', '–')).join(', ') + '), and it is rebuilt as each comes in.</p>' : '') + '</div></div>'
    + HERO + KEY + STATS
    + '<div class="wide"><div class="vr-grid">' + BANDS.map(([lab, sub, ids]) => '<article class="vr-p"><div class="vr-h">' + esc(lab) + '</div><h3>' + esc(sub[0].toUpperCase() + sub.slice(1)) + '</h3><ul class="vr-l">' + ids.map((id) => rowItem(R(id))).join('') + '</ul></article>').join('') + '</div></div>' });

/* ---------------------------------------------------------------- why this run could finish */
const CP = S.compare;
const WHY = CP ? C.section({ lab: 'the same judge, twice', title: 'Why this run could finish when the earlier one could not', id: 'why',
  bodyRaw: C.pRaw('Comparator, the judge that checks a proof against a statement file of its own, was run on ' + esc(CP.earlier.release) + ' by our earlier lane. It was stopped on cost after ' + Math.floor(CP.earlier.wall_seconds / 3600) + ' hours on a machine with ' + N(CP.earlier.machine_memory_bytes / 1e9) + ' GB of memory, holding ' + GIB(CP.earlier.rss_kib) + ' GiB at the stop, without printing a verdict either way. On this release the same judge, at the version that matches its Lean, accepted the readable edition in ' + dur(CP.here.wall_seconds) + ' at ' + GIB(CP.here.rss_kib) + ' GiB, on a machine with ' + esc(CP.here.machine.replace(/^(\S+) (\d+) vCPU \/ (\d+ GB)$/, '$2 vCPU and $3 ($1)')) + '.')
    + C.table({ cols: [{ h: '' }, { h: 'the earlier release (20 Nov)' }, { h: 'this release (25 Nov)' }], rows: [
      ['the judge', CP.earlier.judge + ', Lean ' + CP.earlier.lean, CP.here.judge + ', Lean ' + CP.here.lean],
      ['what the build compiled', N(CP.earlier.files) + ' files, ' + dur(CP.earlier.build_seconds), N(CP.here.modules) + ' modules, ' + dur(CP.here.build_seconds)],
      ['declarations nanoda checked', N(CP.earlier.nanoda_declarations), N(CP.here.nanoda_declarations)],
      ['the judge’s time', dur(CP.earlier.wall_seconds) + ', stopped on cost', dur(CP.here.wall_seconds) + ', finished'],
      ['the judge’s peak memory', GIB(CP.earlier.rss_kib) + ' GiB', GIB(CP.here.rss_kib) + ' GiB'],
      ['its verdict', 'none printed', R('S1').verdict]] })
    + C.pRaw('What changed between the two runs, besides the versions: what there was to check. By nanoda’s count, the closure of the five theorems, everything they use, is about ' + N(Math.round(CP.earlier.nanoda_declarations / CP.here.nanoda_declarations)) + ' times smaller here. Memory is in GiB, from the peak resident size the operating system reports in KiB' + (S.s1_progress_gb ? '; the lane’s progress log writes the same peak as ' + S.s1_progress_gb + ' GB, the KiB figure divided by a million' : '') + '.') }) : '';

/* ---------------------------------------------------------------- D1 */
const D1rows = D.editions;
const EDW = { grh: 'the readable edition', compact: 'the compact edition' };
const d1Body = D1rows.length ? D1rows.map((e) => {
  const s = e.summary, gen = e.rules.filter((r) => r.class === 'generated').reduce((a, r) => a + r.count, 0), inst = e.rules.find((r) => r.id === 'I').count;
  const top = e.areas.slice(0, 10), rest = e.areas.slice(10).reduce((a, x) => a + x.n, 0);
  return '<h3>' + esc(EDW[e.edition][0].toUpperCase() + EDW[e.edition].slice(1)) + '</h3>'
    + C.stats([{ k: 'release constants', v: N(s.release_constants), n: 'in its own files' }, { k: 'used by the five', v: N(s.release_in_closure), n: 'inside the closure' }, { k: 'never used', v: N(s.release_outside), n: N(s.outside_aux) + ' made by Lean, by the census’s own mark' }, { k: 'written, never used', v: N(e.written), n: 'by the rule below, in ' + N(e.written_files) + ' files' }])
    + '<div class="col d1c">' + C.pRaw('Of the ' + N(s.release_outside) + ' constants outside the closure, the census itself marks ' + N(s.outside_aux) + ' as made by Lean’s compiler or elaborator (a name part starting with an underscore, constructors, recursors, the usual generated suffixes) and leaves ' + N(s.outside_decl) + ' unmarked. Those ' + N(s.outside_decl) + ' are split here by the last parts of their names, and nothing else:')
    + C.plainList(e.rules.map((r) => ({ b: N(r.count) + (r.id === 'W' ? ' written.' : r.id === 'I' ? ' instance names.' : ' generated.'), raw: '<span class="m">' + esc(r.id) + '</span> ' + tick(r.words.replace(/\(name ends ([^)]+)\)/, '(name ends `$1`)')) + '.' })))
    + C.pRaw('So ' + N(gen) + ' are made by Lean, ' + N(inst) + ' carry instance names of Lean’s automatic form (a person may have written the instance without a name, or chosen such a name; the name alone cannot tell), and <b>' + N(e.written) + '</b> are declarations written in the release’s files that the five theorems never use: ' + N(e.written_kinds.theorem) + ' theorems and ' + N(e.written_kinds.def) + ' definitions' + (e.written_kinds.other ? ' and ' + N(e.written_kinds.other) + ' others' : '') + '. What the names cannot tell: a lemma an attribute writes (such as <span class="m">@[simps]</span>) and a structure’s field are counted as written.')
    + C.pRaw('The authors’ README says “several hundred of the more than 20,000 declarations are not used by the five theorems”. This count is by the rule above, on ' + EDW[e.edition] + '. Where the written ones sit, by area:') + '</div>'
    + C.table({ cols: [{ h: 'area of the release' }, { h: 'written, never used' }], rows: top.map((a) => [{ raw: '<span class="m">' + esc(a.area) + '</span>' }, N(a.n)]).concat(rest ? [['the other ' + N(e.areas.length - top.length) + ' areas', N(rest)]] : []) })
    + '<div class="wide"><details class="more d1d"><summary>All ' + N(e.written) + ' written declarations the five theorems never use, by file</summary><div class="col">'
    + C.pRaw('The full split, every unmarked row with its rule, kind, module and file, is the file <a href="' + ea(GH + e.tsv) + '"><span class="m">' + C.breakable(e.tsv) + '</span></a>; the census’s own output, all ' + N(s.release_outside) + ' rows, is <a href="' + ea(GH + e.source) + '"><span class="m">' + C.breakable(e.source) + '</span></a>.')
    + '<ul class="d1l">' + e.by_file.map((f) => '<li><span class="m d1f">' + C.breakable(f.file) + '</span> <span class="vr-n">' + N(f.names.length) + '</span><br><span class="m d1n">' + f.names.map((x) => esc(x.name)).join(', ') + '</span></li>').join('') + '</ul></div></details></div>';
}).join('') : '<div class="col">' + C.p('The census has not run yet.') + '</div>';
const D1SEC = C.section({ lab: 'D1 · a list, not a verdict', title: 'The declarations the five theorems never use', id: 'd1', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('The closure of the five theorems is every constant their statements and proofs use, followed to the end. The census, run in each edition’s own Lean environment after its build, lists every constant of the release’s own files that falls outside it. It is offered as a cleanup aid, not a judgment: an unused declaration is not an error. ' + (D.pending ? 'The compact edition’s census has not come in yet.' : 'Both editions are in.')) + '</div>' + d1Body });

/* ---------------------------------------------------------------- the timeline */
const GROUPS = [['Setup, the sandbox probes, the de-risk checks, integrity, our statement files built', /^(setup|LL\d|DERISK|I1|CHB-|CACHE-)/], ['B1 · the readable edition built', /^B1$/], ['A1 · axioms, readable edition', /^A1-grh$/], ['Export of the closure, for the outside kernels', /^EXP/],
  ['K1 · nanoda', /^K1$/], ['K2 · con-leche, and C3’s check by it', /^(K2|C3K$)/], ['C1, C2 · the planted controls', /^(CTL|C1|C2|C3X)/], ['S1 · Comparator, our statement file', /^S1$/], ['KR · Lean’s replay, beside the judge', /^KR$/], ['C3 · Comparator on the planted 1/3', /^C3S$/],
  ['D1 · the census, readable edition', /^D1-grh$/], ['B2 · the compact edition built', /^B2$/], ['A1 · axioms, compact edition', /^A1-compact$/], ['E1 · Comparator on the compact edition', /^E1$/], ['D1 · the census, compact edition', /^D1-compact$/], ['S2 · Comparator, the release’s own statement file', /^S2/]];
const seen = new Set();
const tl = GROUPS.map(([lab, re]) => {
  const st = S.steps.filter((s) => re.test(s.step) && !seen.has(s.step));
  st.forEach((s) => seen.add(s.step));
  if (!st.length) return null;
  const run = st.some((s) => s.end_utc === undefined);
  const a = st.map((s) => s.start_utc).sort()[0], b = run ? null : st.map((s) => s.end_utc).sort().pop();
  return { lab, a, b, run, n: st.length };
}).filter(Boolean);
need(seen.size === S.steps.length, 'a step of the pod’s log falls in no group of the timeline: ' + S.steps.filter((s) => !seen.has(s.step)).map((s) => s.step).join(', '));
tl.sort((x, y) => (x.a < y.a ? -1 : x.a > y.a ? 1 : 0));
const TIMELINE = C.section({ lab: 'the timeline', title: 'What ran, and when', id: 'timeline', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('From the pod’s own log, every step’s start and exit, grouped; times are UTC, and a day number marks the next day. The pod was created at ' + esc(hm(S.pod.created_utc)) + ' on ' + esc(day(S.pod.created_utc)) + '; the run that stands started at ' + esc(hm(S.runner.restart_utc)) + ', after a start that ran nothing (said below).') + '</div>'
    + C.table({ cols: [{ h: 'step' }, { h: 'from' }, { h: 'to' }, { h: 'time' }], rows: tl.map((g) => [g.lab, (g.a.slice(0, 10) !== S.pod.created_utc.slice(0, 10) ? g.a.slice(8, 10) + ' · ' : '') + g.a.slice(11, 16), g.run ? 'running' : (g.b.slice(0, 10) !== S.pod.created_utc.slice(0, 10) ? g.b.slice(8, 10) + ' · ' : '') + g.b.slice(11, 16), g.run ? 'since ' + g.a.slice(11, 16) : dur((Date.parse(g.b) - Date.parse(g.a)) / 1000)]) })
    + '<div class="col">' + C.pRaw('The lane’s progress log, event by event as the control room wrote it (hashes one click down):')
    + C.plainList(S.progress.slice().reverse().map((p) => ({ b: utc(p.at) + '.', raw: tick(unhash(p.text)) }))) + '</div>' });

/* ---------------------------------------------------------------- the money */
const MONEY = C.section({ lab: 'the money', title: 'What it cost', id: 'money',
  bodyRaw: C.pRaw('One rented machine, ' + esc(S.pod.machine) + ', at US$' + S.pod.usd_per_h.toFixed(2) + ' an hour, created at ' + esc(hm(S.pod.created_utc)) + ' on ' + esc(day(S.pod.created_utc)) + (S.pod.deleted_utc ? ' and deleted at ' + esc(utc(S.pod.deleted_utc)) : ', still running') + ': US$' + S.spent_usd.toFixed(2) + ' as of ' + esc(hm(S.as_of)) + ', the price times the time since it was created, rounded down. The lane’s ceiling is US$' + N(S.ceiling_usd) + ' (amendment A1); its deadline, set from the ceiling and the account’s balance, is ' + esc(S.deadline_utc) + ' UTC (amendment A4), and no step starts within ten minutes of it.')
    + C.pRaw('The textbook bridge (CHAR) ran on another lane’s machine, already running, and is paid by that lane (amendment A2).') });

/* ---------------------------------------------------------------- why you can trust this (one click down) */
const REPO = 'https://github.com/lsernau/grh-lean/tree/' + S.target.commit;
const V = S.versions;
const sealRows = S.seals.map((s) => [{ raw: '<b>' + esc(s.id) + '</b>' }, s.what + (s.whole ? '' : ' (its opening ' + N(s.stamps_bytes) + ' bytes, the file being append-only)'), { raw: '<span class="m">' + C.breakable(s.file) + '</span>' }, s.ots_state === 'bitcoin' ? 'Bitcoin block ' + String(s.bitcoin_block) : 'pending at the calendars, not yet in a block']);
const trustBody = [
  C.pRaw('<b>Every state on this page is read from a record.</b> The verdicts come only from <span class="m">corpus/grh-lean-check/record.json</span>, written by <span class="m">tools/check-grh-lean.py</span> from the pod’s output files; <span class="m">tools/grh-lean-records.js</span> refuses to write this page’s records unless that file re-derives from the pulled outputs, and reads every other fact on the page from the file that states it, word for word. This page is built from those records by <span class="m">tools/build-grh-lean-live.js</span>, which refuses when they disagree.'),
  C.table({ cols: [{ h: 'record' }, { h: 'sha256, 12 hex digits' }], rows: ['state.json', 'd1.json', 'page-log.json'].concat(D1rows.map((e) => path.basename(e.tsv))).map((f) => [{ raw: '<span class="m">' + esc(DIR + f) + '</span>' }, { raw: '<span class="m">' + sha12(DIR + f) + '</span>' }]) }),
  C.pRaw('<b>The target.</b> <a href="' + ea(REPO) + '">' + esc(S.target.repo) + '</a> at commit <span class="m">' + hexwrap(S.target.commit) + '</span> (' + esc(S.target.committed_utc) + ' UTC), tree <span class="m">' + esc(S.target.tree) + '</span>, ' + N(S.target.files) + ' files; two editions, <span class="m">grh/</span> (readable, about ' + esc(S.target.editions.readable) + ' lines) and <span class="m">grh-compact/</span> (about ' + esc(S.target.editions.compact) + ' lines). The credit is the README’s: “' + esc(S.target.credit) + '”. The files the pre-registration pins:'),
  C.table({ cols: [{ h: 'file' }, { h: 'sha256' }], rows: S.target.pinned.map((f) => [{ raw: '<span class="m">' + esc(f.file) + '</span>' + (f.about ? ' <span class="vr-n">(' + tick(f.about) + ')</span>' : '') }, { raw: '<span class="m">' + hexwrap(f.sha256) + '</span>' }]) }),
  C.pRaw('<b>Versions.</b> Lean <span class="m">' + esc(V.lean) + '</span> and Mathlib <span class="m">' + hexwrap(V.mathlib) + '</span> (the release’s pins); Comparator <span class="m">' + hexwrap(V.comparator) + '</span>, lean4export <span class="m">' + hexwrap(V.lean4export) + '</span>, nanoda <span class="m">' + hexwrap(V.nanoda) + '</span>, con-leche <span class="m">' + hexwrap(V['con-leche']) + '</span> (built with Lean ' + esc(V.conleche_lean) + '), landrun <span class="m">' + hexwrap(V.landrun) + '</span>; the host’s Landlock ABI ' + esc(V.landlock_abi) + '. The export of the closure the outside kernels read: ' + N(S.export.bytes) + ' bytes, sha256 <span class="m">' + hexwrap(S.export.sha256) + '</span>.'),
  C.pRaw('<b>The statement files and the controls</b>, each as it stands in this repository; the pod fetched each from the run’s audit commit <span class="m">' + hexwrap(S.runner.audit_commit) + '</span>, and the recorder found every one equal to it. Our statement file for the judge writes the four definitions from Mathlib alone and imports nothing of the release; the judge’s gate before S1 read: “' + esc(S.challenge_seal) + '”.'),
  C.table({ cols: [{ h: 'file' }, { h: 'sha256' }], rows: S.instruments.map((f) => [{ raw: '<span class="m">' + C.breakable(f.file) + '</span>' }, { raw: '<span class="m">' + hexwrap(f.sha256) + '</span>' }]) }),
  C.pRaw('<b>The planted controls.</b> ' + S.controls.map((c) => '<b>' + esc(c.id) + '</b>: ' + tick(c.planted) + '; ' + (c.refusals.length ? c.refusals.map((f) => esc(f.step) + ' (' + esc(f.by) + ') exit ' + f.exit + ', “<span class="m">' + esc(f.line) + '</span>”').join('; ') : 'no refusal yet') + '.').join(' ')),
  C.pRaw('<b>The runner, changed after its seal.</b> Amendment A3’s seal lists <span class="m">' + esc(S.runner.file) + '</span> at sha256 <span class="m">' + hexwrap(S.runner.sealed_sha256) + '</span>. The pod ran it at <span class="m">' + hexwrap(S.runner.run_sha256) + '</span> (the script named in each invocation of the pod’s log, the file at the audit commit, and the file as it stands); the change came before the run that stands, which started at ' + esc(hm(S.runner.restart_utc)) + '.'),
  C.pRaw('<b>The seals.</b> The pre-registration was written at about ' + esc(S.prereg_written) + ', before any build, check or run, and stamped with OpenTimestamps; each amendment’s seal lists files by their sha256. The records refuse when a listed file no longer hashes to its sealed value (the append-only amendments must still begin with the sealed bytes), with the one recorded exception above, and when a proof does not stamp its own file. A seal proves possession by a date, nothing else.'),
  C.table({ cols: [{ h: 'seal' }, { h: 'what' }, { h: 'file' }, { h: 'anchor' }], rows: sealRows }),
  C.pRaw('<b>The amendments</b>, each dated and sealed: ' + S.amendments.map((a) => '<b>' + esc(a.id) + '</b> (' + esc(a.when.replace(/(\d\d):(\d)x\b/, (m, h, d) => h + ':' + d + '0–' + h + ':' + d + '9')) + ', ' + esc(a.note) + '): ' + tick(a.title) + '.').join(' ')),
  C.pRaw('<b>The verdict rule</b>, quoted as sealed: “' + tick(S.verdict_rule) + '”'),
  C.pRaw('<b>Each row, in the recorder’s own words.</b>' + (/user-written/.test((ROWS.find((r) => r.id === 'D1') || {}).why || '') ? ' Its “user-written” in D1 counts every row the census leaves unmarked, before the split by name in the D1 section above, which separates the ones Lean makes from the ones written in the release’s files.' : '')),
  C.plainList(ROWS.map((r) => ({ b: r.id + ' · ' + (r.verdict || 'no verdict') + '.', raw: tick(r.why) }))),
  C.pRaw('<b>The pod’s log</b>, every step with its start and exit, is <a href="' + ea(GH + S.run_dir + '/_phase.log') + '"><span class="m">' + C.breakable(S.run_dir + '/_phase.log') + '</span></a>; the lane’s progress log, verbatim:'),
  C.plainList(S.progress.map((p) => ({ b: utc(p.at) + '.', raw: '<span class="m">' + logLine(p.text) + '</span>' }))),
  C.pRaw('<b>The sources</b>, in the cert-machine repository:'),
  C.table({ cols: [{ h: 'source' }, { h: 'sha256, 12 hex digits' }], rows: S.sources.map((s) => [{ raw: '<span class="m">' + C.breakable(s.file) + '</span>' }, { raw: '<span class="m">' + esc(s.sha256_12) + '</span>' }]) }),
  C.pRaw('<b>What the build refuses.</b> The records are not written when: the recorder’s file does not re-derive from the pulled outputs; a row id does not stand in the pre-registration; a needle quoted on this page is no longer in its file; a sealed file no longer hashes to its seal, beyond the one recorded change; a time in a source is ahead of the clock; the census’s summary does not count its own lines; the money is above the ceiling. The page is not built when the counts are not the rows’, the claim’s verdict disagrees with its rule’s rows, the newest change-log entry does not carry the records’ state, or its own words would call RH or GRH proved or settled, or claim priority.')];
const TRUST = C.section({ lab: 'one click down', title: 'Why you can trust this', id: 'trust', wide: true,
  bodyRaw: '<div class="wide"><details class="more trust"><summary>The pins, the versions, the statement files, the controls and the seals</summary><div class="col">' + trustBody.join('\n') + '</div></details></div>' });

/* ---------------------------------------------------------------- changes */
const CHANGES = C.section({ lab: 'changes', title: 'Changes to this page', id: 'changes', bodyRaw: C.plainList(PL.entries.slice().reverse().map((e) => ({ b: utc(e.at) + '.', text: e.what }))) });

/* ---------------------------------------------------------------- the page */
const TITLE = 'A Lean release on RH and GRH for Dirichlet L-functions, checked in the open';
const PREREG_URL = GH + 'corpus/grh-lean-check/PREREG.md';
const HEADER = C.header({ eyebrow: 'Carlos Toledo · an audit, in the open', title: TITLE,
  deck: 'On ' + day(S.target.committed_utc.replace(' ', 'T') + 'Z') + ' a Lean 4 formalization of the Riemann Hypothesis and of GRH for Dirichlet L-functions was released in two editions, a readable one of about ' + S.target.editions.readable + ' lines and a compact one of about ' + S.target.editions.compact + '. The proof is Levent Alpöge’s, with Claude, as its README says; the check is ours. This page checks what a machine can check, by rules sealed before any run: whether Lean, and two kernels written apart from it, accept proofs of its five stated theorems from the three standard axioms.' })
  + '<div class="col"><p class="scope">Read <a href="https://github.com/lsernau/grh-lean">the release</a>, at the commit pinned for this check, and <a href="' + ea(PREREG_URL) + '">the pre-registration</a>, sealed before any run. '
  + (S.in_the_open ? 'A live page, rebuilt from its records as the rows come in; this build reads them up to ' + esc(hm(S.as_of)) + ' on ' + esc(day(S.as_of)) + ', with ' + WORDN(S.remaining.length) + (S.remaining.length === 1 ? ' row' : ' rows') + ' still to come.' : 'Every row has a verdict; this build reads the records up to ' + esc(hm(S.as_of)) + ' on ' + esc(day(S.as_of)) + '.') + ' Nothing on it is refereed; its change log at the foot says what changed.</p></div>';
const body = [HEADER, GAPS, ROWSEC, WHY, D1SEC, TIMELINE, MONEY, TRUST, CHANGES].filter(Boolean).join('\n\n');

const STYLE = `
.vt-svg .vt-t{outline:none}
.vt-svg .vt-t:focus-visible rect{stroke:var(--ink);stroke-width:2.6}
.vt-svg .vt-dim{fill:var(--ink-3)}
.vt-key{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-5);margin:var(--s-3) auto var(--s-5);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.vt-key>span{display:inline-flex;align-items:center;gap:var(--s-2)}
.vt-kn{color:var(--ink-4);text-transform:none;letter-spacing:0}
.ic{display:inline-block;vertical-align:middle;flex:none}
.ne .plain li{padding:var(--s-2) 0}
.vr-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--s-4);margin-top:var(--s-5)}
.vr-p{background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:var(--s-5);min-width:0}
.vr-h{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.vr-p h3{margin:var(--s-2) 0 var(--s-3)}
.vr-l{list-style:none;margin:0;padding:0;display:grid;gap:var(--s-3)}
.vr-i{display:grid;gap:var(--s-1);border-top:1px solid var(--rule);padding-top:var(--s-3);min-width:0}
.vr-s{display:flex;align-items:center;gap:var(--s-2)}
.vr-t{font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink)}
.vr-n{font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-3)}
.vr-c{margin:var(--s-2) 0 0;padding-left:var(--s-4);font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-3);overflow-wrap:anywhere}
.vr-c li{margin:var(--s-1) 0}
.trust .col>p{color:var(--ink-2)}
.d1d .col>p{color:var(--ink-2)}
.d1l{list-style:none;margin:var(--s-3) 0 0;padding:0;display:grid;gap:var(--s-3)}
.d1l li{border-top:1px solid var(--rule);padding-top:var(--s-2);min-width:0}
.d1n{font-size:var(--text-small);color:var(--ink-3);overflow-wrap:anywhere;word-break:break-all}
.d1f{overflow-wrap:anywhere}
.d1c{margin-top:var(--s-5)}
`;
let html = TPL.render({
  title: TITLE, bodyRaw: body, path: '/grh-lean/', cssRaw: STYLE, lang: 'en',
  footRaw: '<p>Built by tools/build-grh-lean-live.js from the records in corpus/grh-lean-live/. The proof is Levent Alpöge’s, with Claude; the check by Carlos Toledo with Claude agents (Anthropic); the page built with Claude Opus 5.5. Unrefereed.</p>',
  desc: 'An independent check, in the open, of a Lean 4 release on the Riemann Hypothesis and GRH for Dirichlet L-functions (Levent Alpöge’s, with Claude): the build, the axioms, three kernels and a judge against our own statement file, planted errors, the textbook bridge, and the declarations the five theorems never use, row by row by rules sealed before the run.',
  og: fs.existsSync(path.join(ROOT, 'design', 'assets', 'og-grh-lean.png')) ? { image: '/og-grh-lean.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('grh-lean') } : undefined
});

/* the words never claim more than the records, and never claim priority */
const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<wbr>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
const ws = (s) => s.replace(/\s+/g, ' ');
/* the lane's own words are quoted as they stand (its progress log says "First start"); every other word is this builder's */
let ours = ws(visible);
const quoted = S.progress.flatMap((p) => [p.text, unhash(p.text)]).concat(ROWS.map((r) => r.why), [S.verdict_rule], S.amendments.map((a) => a.title), PL.entries.map((e) => e.what));
for (const q of quoted.sort((a, b) => b.length - a.length)) for (const v of [ws(q.replace(/`/g, '')), ws(q.replace(/`([^`]+)`/g, ' $1 '))]) ours = ws(ours.split(v).join(' '));
need(!/\bfirst\b/i.test(ours), 'the page’s own words say "first" (never: no priority): ' + (/.{0,60}\bfirst\b.{0,40}/i.exec(ours) || [''])[0]);
need(!/\b(the )?first (to|independent|audit|outside|external|check|replay|ever|one to)\b|\bfor the first time\b|\bnobody (else )?has\b/i.test(visible), 'the page claims priority');
need(!/\b(RH|GRH|the Riemann Hypothesis|the hypothesis|the claim|the conjecture)\b[^.]{0,30}\b(is|are|has been|have been|was|were|stands|now) (now )?(proved|proven|settled|established|resolved|true|confirmed)\b/i.test(ours), 'the page’s words call RH or GRH proved or settled');
need(!/\b(proof|proofs) of (RH|GRH|the Riemann Hypothesis)\b/i.test(ours), 'the page’s words speak of a proof of RH or GRH: the claim checked is the formal one');
need(!/\b(?:TODO|undefined|NaN)\b/.test(visible), 'a placeholder reached the page');
/* above the trust layer, no hash and no commit link */
const surface = html.slice(0, html.indexOf('id="trust"'));
need(!/\b(?=[0-9a-f]*[a-f])[0-9a-f]{12,64}\b/.test(surface.replace(/<[^>]+>/g, ' ')), 'a hash is printed above the trust layer');
need(!/href="[^"]*(?:tree|commit|blob)\/[0-9a-f]{7,40}/.test(surface), 'a commit link above the trust layer');
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(path.join(OUTDIR, 'index.html'), html);
console.log('site/grh-lean/index.html written: claim ' + S.claim.verdict + ', ' + S.counts.certified + ' of ' + S.counts.all + ' rows CERTIFIED, ' + S.counts.pending + ' pending (' + S.counts.running + ' running)'
  + (D1rows.length ? ', D1 ' + D1rows.map((e) => e.edition + ' ' + e.written + ' written').join(', ') : '') + ', ' + PL.entries.length + ' change-log entr' + (PL.entries.length === 1 ? 'y' : 'ies') + ', as of ' + S.as_of);
