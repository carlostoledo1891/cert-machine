#!/usr/bin/env node
/* build-delta3-hol4-live.js — site/delta3-hol4/index.html: the δ₃-in-HOL4 work and its blind benchmark.

   The work: a checker for the five exact certificates behind δ₃ = 117/2192 (Erdős #1186), written in HOL4, run in HOL4's
   kernel and, since 25 November 2026, proved sound there (three soundness theorems and the Layer-1 theorem that puts the
   five certificates through them). The benchmark: two model families (Claude Opus 5.5 and GPT-6.2 Astra) attempted the
   same 162 statements about the checker — 42 of them the proof's lemmas, the rest false on purpose or decoys — and the
   HOL4 kernel judged every attempt on a remote judge under the same limits. The run ended, was rebuilt, read, audited
   for blinding twice and scored after the key was opened.

   The page says, in this order: what is now proved (the three soundness theorems and Layer 1 in plain words, what the
   kernel certifies, what is still data; the public repository); the run's results (per family and class, success with
   its exact interval; the gate; tokens; the Claude family's blind-only rows and why); what went wrong during the run and
   what was done (the house rule: gaps are said, never hidden; the two audits' sets; the rulings, the 16:19 one on the
   readers' style-only flags included); how each lemma on the chain was made (blind, clean-room, builder); what is next;
   then the day as it happened, how the benchmark worked, and, one click down, why you can trust this.

   EVERY NUMBER ON THE PAGE IS READ from corpus/delta3-hol4-live/ (written by tools/delta3-hol4-live-records.js from the
   run's private files, read-only: score.json, SOURCES.tsv, check.out, the work log and the rest). This builder reads
   nothing else. It refuses when the records disagree with each other, when the newest change-log entry is not the
   records' state, and when its words would claim more than the records: a "first", δ₃ itself as a HOL4 theorem, a
   verified computation primitive, a hash of a commit, the name of anyone the work may later be sent to, a mail, or a
   news site the house keeps off its pages.

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
const Word = (n) => { const w = word(n); return w[0].toUpperCase() + w.slice(1); };
const fr = (f) => f[1] === 1 ? String(f[0]) : f[0] + '/' + f[1];
const plural = (n, a, b) => N(n) + ' ' + (n === 1 ? a : b);
/* 2.7849e-4 → 2.7849·10⁻⁴ (text) */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (s, d) => { const m = /^([\d.]+)e(-?\d+)$/.exec(s); need(m, 'not a decimal in e-notation: ' + s); return Number(m[1]).toFixed(d === undefined ? 4 : d) + '·10' + m[2].split('').map((c) => SUP[c]).join(''); };

/* ---------------------------------------------------------------- the records agree with each other */
need(typeof S.run_open === 'boolean', 'the records carry no run_open flag');
const R = S.run, FAM = S.families;
need(FAM.length === 2 && FAM[0].id === 'claude' && FAM[1].id === 'gpt', 'the records do not hold the two families, Claude then GPT');
const OUT = ['proved', 'refuted', 'cap', 'open', 'untouched'];
for (const f of FAM) {
  need(OUT.reduce((a, c) => a + f.statements[c], 0) === R.statements, f.name + ': the statement outcomes do not add up to ' + R.statements);
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
  'the newest page-log entry is not the records’ state (' + S.sig + '): run node tools/delta3-hol4-live-records.js (it logs changes), or add one with --log "…"');
need(MKT.isMarketing('delta3-hol4/index.html'), 'the page is not on design/marketing.js’s list: its figures would print hashes on the surface');
const OPEN = S.run_open;
need(!OPEN && S.scored && S.proved && Array.isArray(S.lemmas) && Array.isArray(S.next), 'this build is for the scored run with Layer 1 assembled; the records carry no scoring or no Layer 1');
const SC = S.scored, PV = S.proved, LM = S.lemmas, Wk = S.work;
const CL = FAM[0], GP = FAM[1];
const CLS5 = ['T', 'P', 'P-vac', 'D-planted', 'D-true'];
need(CLS5.reduce((a, c) => a + SC.classes[c], 0) === R.statements, 'the classes do not add up to the statements');
const VAR = [{ family: 'claude', variant: 'all', label: CL.name, short: 'Claude' }, { family: 'claude', variant: 'blind', label: 'Claude, blind rows only', short: 'Claude, blind only' }, { family: 'gpt', variant: 'all', label: GP.name, short: 'GPT-6.2' }];
const row = (c, v) => { const r = SC.success.find((x) => x.cls === c && x.family === v.family && x.variant === v.variant); need(r, 'no success row for ' + c + ', ' + v.label); return r; };
for (const c of CLS5) for (const v of VAR) { const r = row(c, v); need(r.proved + r.refuted + r.not_judged === r.n && (v.variant === 'blind' || r.n === SC.classes[c]), 'the ' + c + ' row of ' + v.label + ' does not add up'); }
for (const f of FAM) need(SC.tokens[f.id].total === f.tokens.total && SC.tokens[f.id].judged === f.statements.proved + f.statements.refuted, f.name + ': the scored tokens are not the run’s');
need(SC.judged === FAM.reduce((a, f) => a + f.statements.proved + f.statements.refuted, 0) && SC.rebuilt === SC.judged, 'the scored judged attempts are not the run’s');
need(SC.blind.left_out === SC.blind.contaminated + SC.blind.visible_only && SC.blind.remaining === R.statements - SC.blind.left_out && VAR.slice(1, 2).every((v) => CLS5.reduce((a, c) => a + row(c, v).n, 0) === SC.blind.remaining), 'the blind rows do not add up');
const HOWS = ['gpt-blind', 'claude-blind', 'claude-visible', 'clean-room', 'builder'];
need(LM.length > 0 && LM.every((l, i) => l.id === 'L' + String(i + 1).padStart(2, '0') && HOWS.includes(l.how)), 'the chain’s lemmas are not L01, L02, … each with a known source');
need(PV.theorems.length === 3 && PV.bounds.length === 4, 'the records do not hold the three soundness theorems and the four slab bounds');
const howN = (h) => LM.filter((l) => l.how === h).length;

/* ---------------------------------------------------------------- shapes: a word and a shape, never colour alone */
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
/* the outcomes of a statement for one family, each a shape: filled, outlined, hatched, thin, faint */
const CLS = {
  proved: { word: 'proved', paint: 'fill="var(--ink)" stroke="var(--ink)" stroke-width="1"' },
  refuted: { word: 'refuted', paint: 'fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"' },
  cap: { word: 'at the cap, not judged', paint: 'fill="url(#HATCH)" stroke="var(--ink-3)" stroke-width="1"' },
  open: { word: 'tried, under the cap', paint: 'fill="var(--surface)" stroke="var(--ink-3)" stroke-width="1"' },
  untouched: { word: 'not attempted', paint: 'fill="var(--sunk)" stroke="var(--ink-4)" stroke-width="1"' } };
const swatchPaint = (paint, id) => '<svg class="dh-ic" viewBox="0 0 32 22" width="29" height="20" aria-hidden="true">' + HATCH(id) + '<rect x="2" y="4" width="28" height="14" rx="2" ' + paint.replace('#HATCH', '#' + id) + '/></svg>';
const swatch = (c) => swatchPaint(CLS[c].paint, 'hk-' + c);
const kItem = (svg, raw) => '<li><span class="dh-k">' + svg + '<span>' + raw + '</span></span></li>';

/* ---------------------------------------------------------------- 1. HERO: what is proved, on the interval the certificates cover */
const THM = [
  { id: 'slab_check_sound', title: 'slab check sound', line: 'accepts ⇒ Lθ ≥ its bound on the region' },
  { id: 'inner_check_sound', title: 'inner check sound', line: 'accepts ⇒ L₀ ≥ 0, and = 0 only at 0' },
  { id: 'cover_all_sound', title: 'cover check sound', line: 'accepts ⇒ the regions cover [0, 1/2]' }];
need(THM.every((t, i) => PV.theorems[i] === t.id), 'the three soundness theorems are not slab, inner, cover in that order');
const boundOf = (id) => PV.bounds.find((b) => b.id === id);
function proofSvg(narrow) {
  const W0 = narrow ? 360 : 1000, x0 = narrow ? 0 : 0, x1 = W0, half = (v) => v[0] / v[1];
  const X = (f) => x0 + half(f) / 0.5 * (x1 - x0);
  const o = [], hid = 'hp-' + (narrow ? 'n' : 'w');
  let y = 2;
  o.push(HATCH(hid));
  o.push('<text x="0" y="' + (y + 13) + '" class="t-lab">' + esc(narrow ? 'Proved in HOL4, for any input:' : 'Proved in HOL4, for any certificate: the three soundness theorems') + '</text>');
  y += 24;
  /* the three soundness theorems: side by side on a desk, stacked on a phone */
  const TH = narrow ? 40 : 50, gap = 12, tw = narrow ? W0 : (W0 - 2 * gap) / 3;
  THM.forEach((t, i) => {
    const tx = narrow ? 0 : i * (tw + gap), ty = narrow ? y + i * (TH + 8) : y;
    o.push('<g class="dh-t" tabindex="0" aria-label="' + ea(t.id + ': if the check ' + t.line.replace(/^accepts ⇒ /, 'accepts, then ') + '. Proved in HOL4, no hypothesis.') + '"><title>' + esc(t.id + ' · ' + t.line) + '</title>' + tile('done', +tx.toFixed(1), ty, +tw.toFixed(1), TH, '') + '</g>');
    o.push('<text x="' + (tx + 12).toFixed(1) + '" y="' + (ty + (narrow ? 16 : 20)) + '" class="t-lab">' + esc(t.title) + '</text>');
    o.push('<text x="' + (tx + 12).toFixed(1) + '" y="' + (ty + (narrow ? 31 : 37)) + '" class="t-note dh-on">' + esc(t.line) + '</text>');
  });
  y += narrow ? 3 * (TH + 8) + 6 : TH + 18;
  o.push('<text x="0" y="' + (y + 12) + '" class="t-lab">' + esc(narrow ? 'Run on the five certificates (each check T):' : 'Applied to the five certificates, each checked true in the kernel: the bound holds on each region (Layer 1)') + '</text>');
  y += 22;
  const RH = narrow ? 44 : 62;
  for (const r of Wk.regions) {
    const a = X(r.lo), b = X(r.hi), w = b - a - (narrow ? 3 : 5), b4 = r.id === 'inner' ? null : boundOf(r.id);
    const name = r.id === 'inner' ? 'inner' : narrow ? r.id.slice(4) : 'slab ' + r.id.slice(4);
    /* a tile under 140 px drops the "Lθ" (its region's tooltip and the list below say it in full) */
    const val = r.id === 'inner' ? 'L₀ ≥ 0' : (w < 140 ? '≥ ' : 'Lθ ≥ ') + sci(b4.approx, 2);
    const lab = (r.id === 'inner' ? 'the inner certificate' : 'slab ' + r.id.slice(4)) + ' on [' + fr(r.lo) + ', ' + fr(r.hi) + ']: the check is true in the kernel, so ' + (r.id === 'inner' ? 'L₀ ≥ 0 there, with equality only at 0' : 'Lθ is at least ' + sci(b4.approx) + ' there');
    o.push('<g class="dh-t" tabindex="0" aria-label="' + ea(lab) + '"><title>' + esc(lab) + '</title>' + tile('done', +a.toFixed(1), y, +w.toFixed(1), RH, '') + '</g>');
    o.push('<text x="' + (a + w / 2).toFixed(1) + '" y="' + (y + (narrow ? 26 : 26)) + '" text-anchor="middle" class="t-lab">' + esc(name) + '</text>');
    if (!narrow) o.push('<text x="' + (a + w / 2).toFixed(1) + '" y="' + (y + 44) + '" text-anchor="middle" class="t-note dh-on">' + esc(val) + '</text>');
  }
  y += RH + 12;
  o.push('<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="var(--rule)" stroke-width="1"/>');
  const ticks = [[0, 1]].concat(Wk.regions.map((r) => r.hi));
  for (const t of ticks) {
    const tx = X(t), last = t[0] * 2 === t[1], quiet = narrow && !last && X(Wk.regions[Wk.regions.length - 1].hi) - tx < 40;
    o.push('<line x1="' + tx.toFixed(1) + '" y1="' + y + '" x2="' + tx.toFixed(1) + '" y2="' + (y + 5) + '" stroke="var(--rule)" stroke-width="1"/>');
    if (!quiet) o.push('<text x="' + tx.toFixed(1) + '" y="' + (y + 19) + '" text-anchor="' + (t[0] === 0 ? 'start' : last ? 'end' : 'middle') + '" class="t-ax">' + esc(fr(t)) + '</text>');
  }
  y += 34;
  o.push('<line x1="' + (x0 + 1) + '" y1="' + y + '" x2="' + (x1 - 1) + '" y2="' + y + '" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>');
  o.push('<text x="0" y="' + (y + 18) + '" class="t-note dh-on">' + esc(narrow ? 'the cover: [0, 1/2] lies in the five regions' : 'the cover: every point of [0, 1/2] lies in one of the five regions, also a theorem') + '</text>');
  y += 32;
  const HB = narrow ? 46 : 36;
  o.push('<rect x="' + x0 + '" y="' + y + '" width="' + (x1 - x0) + '" height="' + HB + '" rx="4" fill="url(#' + hid + ')" stroke="var(--ink-3)" stroke-width="1"/>');
  if (narrow) {
    o.push('<text x="10" y="' + (y + 18) + '" class="t-note dh-on dh-bg">Not in HOL4: the model constants (data)</text>');
    o.push('<text x="10" y="' + (y + 35) + '" class="t-note dh-on dh-bg">and the step to δ₃ = ' + esc(Wk.value) + '</text>');
  } else o.push('<text x="12" y="' + (y + 23) + '" class="t-note dh-on dh-bg">' + esc('Not in HOL4: the model constants, loaded as data, and the step from these bounds to δ₃ = ' + Wk.value) + '</text>');
  y += HB + 2;
  return '<svg viewBox="0 0 ' + W0 + ' ' + y + '" role="img" class="dh-svg" aria-label="' + ea('Three tiles with ticks: the three soundness theorems, proved in HOL4 for any input. Under them, the interval from 0 to 1/2 cut into the five regions the certificates cover, each a tile with a tick: the check is true in the kernel, so its bound holds there. A line from 0 to 1/2: the cover. At the foot, a hatched band: what is not in HOL4.') + '">' + o.join('') + '</svg>';
}
const HERO = C.figure({ hero: true, svgRaw: proofSvg(false), svgNarrowRaw: proofSvg(true), record: DIR + 'state.json', pins: false,
  captionRaw: 'What is proved, as of ' + esc(hm(S.as_of)) + ' UTC on ' + esc(day(S.as_of)) + '. The three soundness theorems hold for any input; the kernel runs each check on its certificate and gets true, so the bound holds on that certificate’s region of θ. The numbers are the exact rational lower bounds, rounded here. The hatched band is what HOL4 does not prove.' });
const PROVED_STATS = C.stats([
  { k: 'soundness theorems', v: N(PV.theorems.length), n: 'slab, inner and cover; no hypothesis' },
  { k: 'lemmas on the chain', v: N(LM.length), n: N(howN('gpt-blind') + howN('claude-blind')) + ' of them proved blind in the run' },
  { k: 'forgeries refused', v: N(PV.forgeries.total) + ' of ' + N(PV.forgeries.total), n: N(PV.forgeries.kernel) + ' by the kernel, ' + N(PV.forgeries.loader) + ' by the loader' },
  { k: 'axioms', v: 'four', n: 'HOL4’s standard ones, the only ones in ' + N(PV.ancestry) + ' theories' }]);
const bnd = PV.bounds.map((b) => sci(b.approx)).join(', ').replace(/, ([^,]+)$/, ' and $1');
const PLAIN = C.plainList([
  { b: 'The slab theorem.', text: 'If the slab check accepts a certificate, then the slab polynomial Lθ is at least the bound the certificate claims, at every point of its region.' },
  { b: 'The inner theorem.', text: 'If the inner check accepts, then L₀ ≥ 0 on its region, and L₀ = 0 only at y = 0.' },
  { b: 'The cover theorem.', text: 'If the cover check accepts a list of intervals, then every point of [0, 1/2] lies in one of them.' },
  { b: 'Layer 1.', text: 'The kernel runs each check on its certificate and gets true; put together with the three theorems, that gives one theorem: [0, 1/2] is covered by the five regions; on [0, 1/5], L₀ ≥ 0 with equality only at 0; and on the four slabs, Lθ is at least an exact rational, about ' + bnd + '.' }]);
const KERNEL = C.plainList([
  { b: 'No hypothesis, no added axiom.', text: 'Each of these theorems carries only HOL4’s disk tag (the mark of a theorem read back from a theory file), no axiom tag and no hypothesis. In the ' + N(PV.ancestry) + ' theories behind the final theorem, the only axioms are HOL4’s ' + word(PV.axioms.length) + ' standard ones. Every lemma theorem they rest on reads back the same way (' + N(PV.lemmas_read_back) + ' read-backs over the three soundness theories).' },
  { b: 'The checks run in the kernel.', raw: 'HOL4 proves <span class="m">⊢ check &lt;data&gt; ⇔ T</span> for each certificate: the four slabs in ' + esc(Math.min(...Wk.regions.filter((r) => r.id !== 'inner').map((r) => r.check_s)).toFixed(2)) + '–' + esc(Math.max(...Wk.regions.filter((r) => r.id !== 'inner').map((r) => r.check_s)).toFixed(2)) + ' s each, the inner certificate (' + esc(N(Wk.regions.find((r) => r.id === 'inner').forms)) + ' forms) in ' + esc(Wk.regions.find((r) => r.id === 'inner').check_s.toFixed(2)) + ' s; the same check in JavaScript takes ' + esc(String(Wk.js_s)) + ' s, so the kernel is ' + esc(String(Wk.kernel_factor)) + ' times slower.' },
  { b: 'Forgeries are refused.', text: 'The battery’s ' + N(PV.forgeries.total) + ' forgeries (' + N(PV.forgeries.certs) + ' forged certificates, ' + N(PV.forgeries.covers) + ' forged covers): ' + N(PV.forgeries.kernel) + ' give false in the kernel, and the loader refuses the malformed one before the kernel.' },
  { b: 'A compiled copy.', text: 'The same checker, compiled by CakeML into a binary, agrees with the kernel on ' + Wk.binary.agree + ' of ' + Wk.binary.of + ' inputs, at ' + Wk.binary.lo_s + '–' + Wk.binary.hi_s + ' s per certificate. Kernel runs at two HOL4 releases give byte-identical theorems on all ' + Wk.v9_v10_inputs + ' inputs that reach the kernel.' }]);
const DATA = C.plainList([
  { b: 'The model constants are data.', text: 'The areas and constants of the extremal colouring, from which Lθ and L₀ are built, are computed by the JavaScript verifier and loaded into HOL4 as data. So the theorems are about Lθ and L₀ built from that data.' },
  { b: 'The step to δ₃ is not in HOL4.', text: 'The analysis that takes these bounds to δ₃ = ' + Wk.value + ', and the uniqueness of the extremal colouring, are not in HOL4. Each certificate also lives on its own grid; no theorem here joins them over one point.' },
  { b: 'The witness is untrusted.', text: 'The Gram factor, the weights and the scale are hints written in floating point. A wrong hint can only turn true into false, so false on a forgery says the check fails with that witness, not that no witness exists.' },
  { b: 'Strictness is tested by strict diagonal dominance,', text: 'now proved sufficient for positive definiteness, but not necessary; the JavaScript verifier tests leading minors, which is exact. Both accept all five certificates.' },
  { b: 'The trusted base.', text: 'HOL4’s kernel, including its compute primitive. That primitive is a port of the compute facility proved sound for Candle (O. Abrahamsson, M. O. Myreen, M. Norrish, H. Kanabar, J. Åman Pohjola, J. Automated Reasoning 69(1):7, 2025); the port itself is not proved inside HOL4. The binary adds CakeML’s released compiler binary, the C stubs of its basis library and the link step.' }]);
const REPO_A = '<a href="' + ea(PV.repo.url) + '">' + esc(PV.repo.url.replace(/^https:\/\//, '')) + '</a>';
const PROVEDSEC = '<section id="proved"><div class="col sec-head"><div class="lab">what is proved</div><h2>What is now proved</h2></div>' + HERO + PROVED_STATS
  + '<div class="col">' + C.pRaw('The checker is a set of HOL4 functions over integers and lists. Given a certificate, it rebuilds the polynomial identity, forms the integer matrix, tests it and returns true or false. Since ' + esc(PV.layer1_at) + ' UTC on ' + esc(day(S.as_of)) + ', HOL4 also proves what a true answer means.')
  + '<h3>In plain words</h3>' + PLAIN
  + '<h3>What the kernel certifies</h3>' + KERNEL
  + '<h3>What is still data, or not in HOL4</h3>' + DATA
  + '<h3>All of it, in public</h3>' + C.pRaw('The checker, the proofs, the certificates, the run’s logs and the answer key are in the repository ' + REPO_A + '. Its README says what is proved and how each lemma was made. One command, <span class="m">replay.sh</span>, rebuilds it all from the pinned HOL4: from a fresh copy it ended with exit 0 in ' + esc(N(Math.round(PV.replay.s))) + ' s, with the same ' + esc(String(PV.replay.verdicts)) + ' kernel verdicts and the three soundness theorems exactly as stated. A workflow runs it on every push' + (PV.repo.ci_green ? ': its first run, on GitHub’s own runner with Poly/ML and HOL4 built from scratch, passed in ' + esc(PV.repo.ci_green.took) + ' (' + esc(PV.repo.ci_green.from) + '–' + esc(PV.repo.ci_green.to) + ' UTC).' : '; the first run started at ' + esc(PV.repo.ci_started) + ' UTC.')
    + (PV.repo.cakeml_green ? ' Its second job, run by hand, also builds CakeML’s basis, translates and compiles the checker and runs the binary on all ' + esc(String(PV.repo.cakeml_green.inputs)) + ' inputs: it passed on GitHub’s runner in ' + esc(String(PV.repo.cakeml_green.min)) + ' min (' + esc(PV.repo.cakeml_green.from) + '–' + esc(PV.repo.cakeml_green.to) + ' UTC).' : ''))
  + '<h3>Related work</h3>' + C.pRaw('The full statement δ₃ = ' + esc(Wk.value) + ' is formalised in Lean by Snively (<a href="' + ea(Wk.lean.url) + '">erdos-1186</a>, v' + esc(Wk.lean.version) + ', ' + esc(Wk.lean.date) + '). Star Fleet Math stated the value, with an exact rational sum-of-squares certificate, by ' + esc(Wk.sfm.date) + ' (Internet Archive capture ' + esc(Wk.sfm.capture) + '). This work is a checker in HOL4 for the certificates; it does not state δ₃ as a HOL4 theorem.') + '</div></section>';

/* ---------------------------------------------------------------- 2. the results: per class and family, success and its exact interval */
const CLASS = {
  T: { name: 'True statements', short: 'True', rule: 'success: proved', note: 'the lemmas of the proof' },
  P: { name: 'Planted false statements', short: 'Planted, false', rule: 'success: refuted', note: 'false on purpose' },
  'P-vac': { name: 'Planted statements that hold vacuously', short: 'Planted, vacuous', rule: 'success: proved; a refuted text is also correct', note: 'false text, but a hypothesis it may use is false too' },
  'D-planted': { name: 'Decoys with a false text', short: 'Decoy, false text', rule: 'success: proved; a refuted text is also correct', note: 'true as a whole, vacuously' },
  'D-true': { name: 'Decoys with a true text', short: 'Decoy, true text', rule: 'success: proved', note: 'true' } };
const ivs = (x) => x.rate + '% [' + x.lo + ', ' + x.hi + ']';
function classSvg(narrow) {
  const W0 = narrow ? 360 : 1000, L = narrow ? 4 : 230, Rx = narrow ? 355 : 820, BH = narrow ? 12 : 14, hid = 'hc-' + (narrow ? 'n' : 'w');
  const X = (p) => L + p / 100 * (Rx - L);
  /* the layout first, so the grid can sit under the marks */
  const items = [];
  let y = 4;
  for (const c of CLS5) {
    items.push({ head: c, y });
    y += narrow ? 38 : 40;
    for (const v of VAR) {
      if (narrow) y += 15;
      items.push({ c, v, y });
      y += BH + (narrow ? 15 : 16);
    }
    y += narrow ? 8 : 6;
  }
  const yAx = y, H = yAx + 30;
  const o = [HATCH(hid)];
  for (const p of [0, 25, 50, 75, 100]) {
    o.push('<line x1="' + X(p).toFixed(1) + '" y1="4" x2="' + X(p).toFixed(1) + '" y2="' + yAx + '" stroke="var(--rule-soft)" stroke-width="1"/>');
    o.push('<text x="' + X(p).toFixed(1) + '" y="' + (yAx + 18) + '" text-anchor="' + (p === 0 ? 'start' : p === 100 ? 'end' : 'middle') + '" class="t-ax">' + p + '%</text>');
  }
  for (const it of items) {
    if (it.head) {
      const k = CLASS[it.head];
      o.push('<text x="0" y="' + (it.y + 14) + '" class="t-lab">' + esc((narrow ? k.short : k.name) + ' (' + SC.classes[it.head] + ')') + '</text>');
      o.push('<text x="0" y="' + (it.y + 30) + '" class="t-note dh-on">' + esc(k.rule) + '</text>');
      continue;
    }
    const r = row(it.c, it.v), yy = it.y;
    const lab = it.v.label + ', ' + CLASS[it.c].name.toLowerCase() + ': ' + r.proved + ' proved, ' + r.refuted + ' refuted, ' + r.not_judged + ' not judged, of ' + r.n + '; success ' + r.success.k + ' of ' + r.n + ', ' + ivs(r.success);
    if (narrow) o.push('<text x="0" y="' + (yy - 4) + '" class="t-note dh-on">' + esc(it.v.short + ' · ' + ivs(r.success)) + '</text>');
    else {
      o.push('<text x="' + (L - 12) + '" y="' + (yy + BH - 2) + '" text-anchor="end" class="t-note dh-on">' + esc(it.v.label) + '</text>');
      o.push('<text x="' + (Rx + 14) + '" y="' + (yy + BH - 2) + '" class="t-note dh-on">' + esc(ivs(r.success)) + '</text>');
    }
    const segs = [];
    let x = L;
    for (const [k, n] of [['proved', r.proved], ['refuted', r.refuted], ['cap', r.not_judged]]) {
      if (!n) continue;
      const w = (Rx - L) * n / r.n;
      segs.push('<rect x="' + x.toFixed(1) + '" y="' + yy + '" width="' + Math.max(1, w - 1.5).toFixed(1) + '" height="' + BH + '" rx="2" ' + CLS[k].paint.replace('#HATCH', '#' + hid) + '/>');
      x += w;
    }
    /* the exact 95% interval of the success rate, a whisker under the bar, and the rate as a dot on it */
    const wy = yy + BH + 6, a = X(Number(r.success.lo)), b = X(Number(r.success.hi)), m = X(100 * r.success.k / r.success.n);
    segs.push('<line x1="' + a.toFixed(1) + '" y1="' + wy + '" x2="' + b.toFixed(1) + '" y2="' + wy + '" stroke="var(--ink-2)" stroke-width="1.6"/>');
    for (const e of [a, b]) segs.push('<line x1="' + e.toFixed(1) + '" y1="' + (wy - 3.5) + '" x2="' + e.toFixed(1) + '" y2="' + (wy + 3.5) + '" stroke="var(--ink-2)" stroke-width="1.6"/>');
    segs.push('<circle cx="' + m.toFixed(1) + '" cy="' + wy + '" r="3" fill="var(--ink)" stroke="var(--surface)" stroke-width="1.2"/>');
    o.push('<g class="dh-t" tabindex="0" aria-label="' + ea(lab) + '"><title>' + esc(lab) + '</title>' + segs.join('') + '</g>');
  }
  o.push('<line x1="' + L + '" y1="' + yAx + '" x2="' + Rx + '" y2="' + yAx + '" stroke="var(--rule)" stroke-width="1"/>');
  return '<svg viewBox="0 0 ' + W0 + ' ' + H + '" role="img" class="dh-svg" aria-label="' + ea('For each of the five classes of statement, three bars: Claude Opus 5.5, Claude on its blind rows only, and GPT-6.2 Astra. Each bar is the class’s statements, split into proved (filled), refuted (outlined) and not judged (hatched). Under each bar, a whisker: the exact 95% interval of the success rate, with the rate as a dot. The table below gives every number.') + '">' + o.join('') + '</svg>';
}
const RESFIG = '<div class="wide dh-fig">' + C.figure({ wide: false, svgRaw: '<div class="hv-w">' + classSvg(false) + '</div><div class="hv-n">' + classSvg(true) + '</div>',
  captionRaw: 'Per class and family, what the kernel judged, and the success rate with its exact (Clopper–Pearson) 95% interval, rounded outward. For the planted statements that hold vacuously and the decoys with a false text, both decisions are correct: proving the statement or refuting its text.' }) + '</div>';
const whisk = '<svg class="dh-ic" viewBox="0 0 32 22" width="29" height="20" aria-hidden="true"><line x1="4" y1="11" x2="28" y2="11" stroke="var(--ink-2)" stroke-width="1.6"/><line x1="4" y1="7.5" x2="4" y2="14.5" stroke="var(--ink-2)" stroke-width="1.6"/><line x1="28" y1="7.5" x2="28" y2="14.5" stroke="var(--ink-2)" stroke-width="1.6"/><circle cx="19" cy="11" r="3" fill="var(--ink)"/></svg>';
const RESKEY = '<div class="col"><ul class="dh-key">' + kItem(swatch('proved'), 'proved') + kItem(swatch('refuted'), 'refuted (for the two vacuous classes: the statement’s text refuted, also correct)') + kItem(swatch('cap'), 'not judged: at the cap of ' + R.cap + ' attempts, or not attempted') + kItem(whisk, 'the success rate and its exact 95% interval') + '</ul></div>';
const cell = (x) => x.k + '/' + x.n + ' · ' + ivs(x);
/* every number of the figure, as a grid that stacks on a phone (a four-column table would scroll sideways there) */
const RESGRID = '<div class="col"><div class="dh-rg">' + CLS5.map((c) => '<p class="dh-rh"><b>' + esc(CLASS[c].name) + '</b> (' + SC.classes[c] + '): ' + esc(CLASS[c].rule) + '</p>'
  + VAR.map((v) => {
    const r = row(c, v), lines = [r.success_is + ' ' + cell(r.success)];
    if (r.beside) lines.push('text refuted ' + cell(r.beside), 'either ' + cell(r.either));
    return '<div class="dh-rr"><span class="dh-rl">' + esc(v.label) + '</span><span class="dh-rv">' + lines.map(esc).join('<br>') + '</span></div>';
  }).join('')).join('') + '</div></div>';
const RESSTATS = C.stats([
  { k: 'the gate', v: 'HELD', n: 'no proof of a false goal, no refutation of a true text' },
  { k: 'judged attempts', v: N(SC.judged), n: N(CL.statements.proved + CL.statements.refuted) + ' Claude, ' + N(GP.statements.proved + GP.statements.refuted) + ' GPT; all ' + N(SC.rebuilt) + ' rebuilt, all counted' },
  { k: CL.name + ' tokens', v: N(SC.tokens.claude.total), n: N(SC.tokens.claude.per_judged) + ' per judged statement', sm: true },
  { k: GP.name + ' tokens', v: N(SC.tokens.gpt.total), n: N(SC.tokens.gpt.per_judged) + ' per judged statement', sm: true }]);
const rf = (fam, c) => row(c, VAR.find((v) => v.family === fam && v.variant === 'all')).refuted;
const RESTEXT = C.plainList([
  { b: 'The gate held.', text: 'The gate is the check for a kernel or judge fault: in ' + N(SC.judged) + ' judged attempts there is no proof of a statement whose goal is false and no refutation of a statement whose text is true, in either family. Every judged attempt was built again alone and gave the same decision, and every one counts.' },
  { b: 'Why the Claude family has blind-only rows.', text: 'The two blinding audits found that some Claude agents saw what they should not have: for ' + SC.blind.contaminated + ' statements, material from before the run written by an agent that had read the answers; for ' + SC.blind.visible_only + ' more, the GPT family’s outcome on the same statement, through the judge’s log. The blind rows leave those ' + SC.blind.left_out + ' out: ' + SC.blind.remaining + ' statements remain, ' + SC.blind.judged_remaining + ' of them judged. No GPT session read any of it, so its rows are all its statements.' },
  { b: 'Each family stops at its first judged outcome.', text: 'On the two vacuous classes either decision is correct, and a refuted text cannot then be proved: Claude refuted the text first on ' + rf('claude', 'P-vac') + ' of the ' + SC.classes['P-vac'] + ' vacuous planted statements and ' + rf('claude', 'D-planted') + ' of the ' + SC.classes['D-planted'] + ' decoys with a false text, GPT on ' + rf('gpt', 'P-vac') + ' and ' + rf('gpt', 'D-planted') + '. That is why the proved rate is low there while every decision is right.' },
  { b: 'Tokens.', text: CL.name + ' used ' + N(SC.tokens.claude.total) + ' tokens over its ' + plural(CL.tokens.batches, 'batch', 'batches') + ' (' + N(SC.tokens.claude.per_judged) + ' per judged statement), by the Agent tool’s report for each agent; ' + GP.name + ' used ' + N(SC.tokens.gpt.total) + ' (' + N(SC.tokens.gpt.per_judged) + '), by Codex’s own count for each session. The two counters are not one measure, so the totals are not compared here.' }]);
/* every statement of each family, in order */
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
  return '<svg viewBox="0 0 ' + W0 + ' ' + (y - 10) + '" role="img" class="dh-svg" aria-label="' + ea('Each family’s ' + R.statements + ' statements in their order, one cell each, shaped by what the kernel judged: proved filled, refuted outlined, at the cap hatched, not attempted faint.') + '">' + o.join('') + '</svg>';
}
const STRIP = '<div class="wide dh-fig">' + C.figure({ wide: false, svgRaw: '<div class="hv-w">' + stripSvg(false) + '</div><div class="hv-n">' + stripSvg(true) + '</div>', captionRaw: 'Every statement of each family in the list’s order, ' + esc(N(R.statements)) + ' cells a family, shaped as in the table below it.' }) + '</div>';
const kcell = (raw, cls) => '<span class="' + cls + '">' + raw + '</span>';
const krow = (labRaw, a, b) => kcell(labRaw, 'dh-kl') + kcell(esc(a), 'dh-kv') + kcell(esc(b), 'dh-kv');
const SHOWN = OUT.filter((c) => CL.statements[c] || GP.statements[c]);
const OUTTABLE = '<div class="col"><div class="dh-kt" role="table" aria-label="' + ea('Each family’s statements by what the kernel judged, and its attempts') + '">'
  + '<span class="dh-kh" role="columnheader">statements</span><span class="dh-kh dh-kv" role="columnheader">Claude</span><span class="dh-kh dh-kv" role="columnheader">GPT</span>'
  + SHOWN.map((c) => krow('<span class="dh-k">' + swatch(c) + esc(CLS[c].word) + '</span>', N(CL.statements[c]), N(GP.statements[c]))).join('')
  + krow('<span class="dh-k">attempts used</span>', N(CL.attempts), N(GP.attempts)) + '</div></div>';
const RESULTS = '<section class="dh-sec" id="results"><div class="col sec-head"><div class="lab">the run’s results</div><h2>The run’s results</h2></div>'
  + '<div class="col">' + C.pRaw('The run went from ' + esc(hm(R.start_utc)) + ' to ' + esc(hm(R.ended_utc)) + ' UTC. It was scored at ' + esc(hm(SC.scored_utc)) + ' UTC, once the answer key was opened, by a scoring program frozen before the key at ' + esc(SC.frozen_scorer) + ' UTC (' + esc(SC.scorer_tests) + ' tests passed). The key sorts the ' + esc(N(R.statements)) + ' statements into five classes; success is what the kernel should judge for each.') + '</div>'
  + RESFIG + RESKEY + RESSTATS + '<div class="col">' + RESTEXT + '</div>' + RESGRID
  + '<div class="col"><h3>Every statement, in order</h3></div>' + STRIP + OUTTABLE
  + '<div class="col"><p class="dh-n2">A statement at the cap had ' + R.cap + ' attempts and none was judged proved or refuted. Nobody read the accepted scripts but the two agent readers.</p></div></section>';

/* ---------------------------------------------------------------- 3. what went wrong, and what was done */
const GAPS_DURING = S.gaps.filter((g) => g.when <= hm(R.ended_utc)).length;
need(S.gaps.slice(GAPS_DURING).every((g) => g.when > hm(R.ended_utc) && g.when < hm(SC.scored_utc)), 'the gaps are not those of the run first, then those found after it and before the key');
const gapItem = (g) => '<li class="dh-g"><div class="dh-gh"><span class="m">' + esc(g.when) + ' UTC</span> <b>' + esc(g.title) + '.</b></div>'
  + '<p>' + esc(g.happened) + '</p><p><b>Done.</b> ' + esc(g.done) + '</p><p class="dh-n2"><b>In the scoring.</b> ' + esc(g.scoring) + '</p></li>';
function auditSvg(narrow) {
  const W0 = narrow ? 360 : 1000, LBL = narrow ? 0 : 206, BW = W0 - LBL, BH = narrow ? 22 : 28, hid = 'ha-' + (narrow ? 'n' : 'w'), o = [HATCH(hid)];
  const PAINT = { blind: CLS.proved.paint, contaminated: CLS.cap.paint, visible: CLS.refuted.paint };
  const parts = [
    { f: CL, segs: [['blind', SC.blind.remaining], ['contaminated', SC.blind.contaminated], ['visible', SC.blind.visible_only]] },
    { f: GP, segs: [['blind', R.statements - SC.blind.gpt_left_out]] }];
  let y = 4;
  for (const p of parts) {
    if (narrow) { o.push('<text x="0" y="' + (y + 12) + '" class="t-lab">' + esc(p.f.name) + '</text>'); y += 20; }
    else o.push('<text x="0" y="' + (y + BH / 2 + 5) + '" class="t-lab">' + esc(p.f.name) + '</text>');
    let x = LBL;
    const lab = p.f.name + ': ' + p.segs.map(([k, n]) => n + ' ' + (k === 'blind' ? 'in the blind rows' : k === 'contaminated' ? 'contaminated' : 'GPT outcome visible')).join(', ');
    const g = [];
    for (const [k, n] of p.segs) {
      const w = BW * n / R.statements;
      g.push('<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + Math.max(1, w - 1.5).toFixed(1) + '" height="' + BH + '" rx="2" ' + PAINT[k].replace('#HATCH', '#' + hid) + '/>');
      if (w >= 26) g.push('<text x="' + (x + (w - 1.5) / 2).toFixed(1) + '" y="' + (y + BH + 16) + '" text-anchor="middle" class="t-lab">' + N(n) + '</text>');
      x += w;
    }
    o.push('<g aria-label="' + ea(lab) + '"><title>' + esc(lab) + '</title>' + g.join('') + '</g>');
    y += BH + (narrow ? 30 : 34);
  }
  return '<svg viewBox="0 0 ' + W0 + ' ' + (y - 8) + '" role="img" class="dh-svg" aria-label="' + ea('Each family’s ' + R.statements + ' statements as one bar: in the blind rows (filled), contaminated (hatched), or with the GPT outcome visible first (outlined). The GPT bar is all filled.') + '">' + o.join('') + '</svg>';
}
const AUDFIG = '<div class="wide dh-fig">' + C.figure({ wide: false, svgRaw: '<div class="hv-w">' + auditSvg(false) + '</div><div class="hv-n">' + auditSvg(true) + '</div>',
  captionRaw: 'What the blinding audits leave in each family’s blind rows: the union of the two audits’ sets, the stricter reading. Filled: in the blind rows; hatched: contaminated (an agent used or read material from before the run); outlined: the GPT outcome could be seen first.' }) + '</div>';
const SETWORD = { CONTAMINATED: 'contaminated: used or read the material from before the run', 'OTHER-FAMILY-VISIBLE': 'GPT outcome visible first', 'SAME-FAMILY-REUSE': 'read another Claude agent’s script (allowed; reported, not left out)' };
const AUDTABLE = '<div class="col">' + C.pRaw('The first audit was a Claude agent’s, the second a GPT-6.2 agent’s, done on its own; scoring uses the union of the two.')
  + '<div class="dh-kt dh-k4" role="table" aria-label="' + ea('The Claude family’s statements in each blinding set, by audit') + '">'
  + '<span class="dh-kh" role="columnheader">Claude statements</span><span class="dh-kh dh-kv" role="columnheader">first</span><span class="dh-kh dh-kv" role="columnheader">second</span><span class="dh-kh dh-kv" role="columnheader">union</span>'
  + SC.blind.audits.map((a) => '<span class="dh-kl">' + esc(SETWORD[a.set] || a.set) + '</span><span class="dh-kv">' + N(a.first) + '</span><span class="dh-kv">' + N(a.second) + '</span><span class="dh-kv">' + N(a.union) + '</span>').join('')
  + '<span class="dh-kl"><b>left out of the blind rows</b> (GPT: ' + N(SC.blind.gpt_left_out) + ')</span><span class="dh-kv"></span><span class="dh-kv"></span><span class="dh-kv"><b>' + N(SC.blind.left_out) + '</b></span></div></div>';
const LEAD = C.section({ lab: 'what went wrong', title: 'What went wrong during the run, and what was done', id: 'gaps', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Said in plain words, as the records state it. ' + Word(GAPS_DURING) + ' were found and acted on while the run was open; ' + (S.gaps.length - GAPS_DURING === 1 ? 'one' : 'the other ' + word(S.gaps.length - GAPS_DURING)) + ' after it ended, before the answer key was opened.')
    + '<ol class="dh-gl">' + S.gaps.map(gapItem).join('') + '</ol>'
    + '<h3>The two blinding audits, side by side</h3></div>' + AUDFIG + AUDTABLE
    + '<div class="col"><h3>The rulings made during the run and before the key</h3>' + C.plainList(S.rulings.map((r) => ({ b: r.when + ' UTC.', text: r.text })))
    + '<h3>Known limits</h3>' + C.plainList(S.limits_known.map((l) => ({ text: l.text }))) + '</div>' });

/* ---------------------------------------------------------------- 4. how each lemma on the chain was made */
const HOW = {
  'gpt-blind': { word: 'blind, by GPT-6.2 Astra, in the run', paint: 'fill="var(--ink)" stroke="var(--ink)" stroke-width="1"', inv: true },
  'claude-blind': { word: 'blind, by Claude Opus 5.5, in the run', paint: 'fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"' },
  'claude-visible': { word: 'by Claude in the run, after its agent had seen GPT’s three failed attempts (not counted as blind)', paint: 'fill="var(--surface2)" stroke="var(--ink)" stroke-width="2"', dot: true },
  'clean-room': { word: 'clean room, after scoring: a fresh Claude agent that never saw an earlier proof', paint: 'fill="url(#HATCH)" stroke="var(--ink)" stroke-width="1.6"' },
  builder: { word: 'by the builder, after scoring, who had read the key (not blind)', paint: 'fill="var(--sunk)" stroke="var(--ink-3)" stroke-width="1"', bar: true } };
const PARTS = [['SLAB', 'slab'], ['STRICT', 'strictness'], ['INNER', 'inner'], ['COVER', 'cover']];
need(LM.every((l) => PARTS.some((p) => p[0] === l.part)), 'a lemma of the chain is in no known part');
function lemmaTile(l, x, y, w, h, hid) {
  const k = HOW[l.how], o = ['<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="4" ' + k.paint.replace('#HATCH', '#' + hid) + '/>'];
  if (k.dot) o.push('<circle cx="' + (x + w - 5).toFixed(1) + '" cy="' + (y + 5) + '" r="2.6" fill="var(--ink)"/>');
  if (k.bar) o.push('<rect x="' + (x + 3).toFixed(1) + '" y="' + (y + h - 5) + '" width="' + (w - 6).toFixed(1) + '" height="2.5" rx="1.25" fill="var(--ink-3)"/>');
  /* a number only where the tile's own ground is the figure's: on a filled tile it would sit on the ink (the tooltip names it) */
  if (!k.inv) o.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (y + h / 2 + 4) + '" text-anchor="middle" class="t-note dh-on">' + Number(l.id.slice(1)) + '</text>');
  return o.join('');
}
function lemmaSvg(narrow) {
  const W0 = narrow ? 360 : 1000, LBL = narrow ? 0 : 150, PER = narrow ? 13 : 28, GX = narrow ? 3.5 : 4.5, TW = (W0 - LBL - (PER - 1) * GX) / PER, TH = narrow ? 26 : 30, hid = 'hl-' + (narrow ? 'n' : 'w'), o = [HATCH(hid)];
  let y = 4;
  for (const [part, name] of PARTS) {
    const ls = LM.filter((l) => l.part === part);
    if (!ls.length) continue;
    const head = name + ' (' + (ls.length === 1 ? ls[0].id : ls[0].id + '–' + ls[ls.length - 1].id) + ')';
    if (narrow) { o.push('<text x="0" y="' + (y + 12) + '" class="t-lab">' + esc(head) + '</text>'); y += 18; }
    else o.push('<text x="0" y="' + (y + TH / 2 + 5) + '" class="t-lab">' + esc(head) + '</text>');
    ls.forEach((l, i) => {
      const x = LBL + (i % PER) * (TW + GX), yy = y + Math.floor(i / PER) * (TH + 5);
      const lab = l.id + ' · ' + l.statement + ' · ' + l.name + ' · ' + HOW[l.how].word;
      o.push('<g class="dh-t" tabindex="0" aria-label="' + ea(lab) + '"><title>' + esc(lab) + '</title>' + lemmaTile(l, x, yy, TW, TH, hid) + '</g>');
    });
    y += Math.ceil(ls.length / PER) * (TH + 5) + (narrow ? 10 : 8);
  }
  return '<svg viewBox="0 0 ' + W0 + ' ' + (y - 4) + '" role="img" class="dh-svg" aria-label="' + ea('The ' + LM.length + ' lemmas of the chain, numbered, in rows by part, each shaped by how its proof was made: filled, blind by GPT-6.2; outlined, blind by Claude; outlined with a dot, by Claude after seeing GPT’s attempts; hatched, clean room after scoring; faint with a bar, by the builder after scoring. The list below says the same in words.') + '">' + o.join('') + '</svg>';
}
const LEMFIG = '<div class="wide dh-fig">' + C.figure({ wide: false, svgRaw: '<div class="hv-w">' + lemmaSvg(false) + '</div><div class="hv-n">' + lemmaSvg(true) + '</div>',
  captionRaw: 'The ' + esc(N(LM.length)) + ' lemmas the three soundness theorems rest on, L01 to L' + esc(String(LM.length)) + ', in order, each with the one proof on the chain, shaped by how it was made. The tiles that are not GPT-6.2’s carry their number.' }) + '</div>';
const howSw = (h) => '<svg class="dh-ic" viewBox="0 0 32 22" width="29" height="20" aria-hidden="true">' + HATCH('hh-' + h) + lemmaTile({ id: 'L0', how: h }, 3, 1, 26, 20, 'hh-' + h).replace(/<text[\s\S]*?<\/text>/, '') + '</svg>';
const LEMKEY = '<div class="col"><ul class="dh-key">' + HOWS.map((h) => kItem(howSw(h), '<b>' + N(howN(h)) + '</b> ' + esc(HOW[h].word))).join('') + '</ul></div>';
const lname = (l) => l.id + ' (' + l.statement + ', ' + l.name + ')';
const list = (a) => a.length === 1 ? a[0] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const byHow = (h) => LM.filter((l) => l.how === h);
need(byHow('claude-blind').every((l) => l.only) && byHow('claude-visible').every((l) => l.only), 'a Claude proof on the chain that is not the only accepted one: the words below would be wrong');
const crAt = [...new Set(byHow('clean-room').map((l) => hm(l.proved_at)))], bAt = [...new Set(byHow('builder').map((l) => hm(l.proved_at)))];
const LEMTEXT = C.plainList([
  { b: 'The rule.', text: 'One proof per lemma, each built unchanged and checked to be exactly its judged statement. Where both families had a blind proof, the one judged first was taken; in all, ' + N(howN('gpt-blind')) + ' of the ' + N(LM.length) + ' proofs on the chain are GPT-6.2’s. Every proof on the chain, the ones made after scoring included, was accepted by the same judge code against the same frozen statements. None of this changes the scores, which count only the run’s attempts.' },
  { b: Word(howN('claude-blind')) + ' blind proofs by Claude.', text: list(byHow('claude-blind').map(lname)) + ': the only accepted proofs of these lemmas in the run.' },
  { b: 'One proof by Claude, not counted as blind.', text: list(byHow('claude-visible').map(lname)) + ': the only accepted proof in the run, by an agent that had seen the GPT family’s three failed attempts at it first.' },
  { b: Word(howN('clean-room')) + ' proofs made again, in a clean room.', text: list(byHow('clean-room').map(lname)) + ', the diagonal-dominance lemma and its strict form. The run’s only accepted proofs of them were contaminated: built on a proof from before the run, by an agent that had read the key. After scoring, a fresh Claude agent that saw only the public brief, the definitions, the judge and HOL4’s sources proved both, each at its first attempt (' + (crAt.length === 1 && howN('clean-room') > 1 ? 'both at ' : '') + list(crAt) + ' UTC), judged by a copy of the frozen judge; an audit of its tool calls found no read of an earlier proof or of the key. Those proofs are on the chain; the contaminated ones stay in the repository as the run’s record.' },
  { b: 'One proof by the builder.', text: list(byHow('builder').map(lname)) + ': the slab soundness theorem itself, the one true statement neither family proved in its three attempts. The builder, who had read the key, fixed the last step of Claude’s third attempt, and the same judge code accepted it at ' + list(bAt) + ' UTC. It is labelled not blind.' }]);
const LEMMAS = C.section({ lab: 'how the proof was made', title: 'How each lemma on the chain was made', id: 'lemmas', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('The soundness proof is ' + esc(N(LM.length)) + ' true lemmas, mixed into the run’s ' + esc(N(R.statements)) + ' statements with false ones and decoys. With the clean-room proofs, no lemma on the chain rests on a contaminated proof.') + '</div>'
    + LEMFIG + LEMKEY + '<div class="col">' + LEMTEXT + '</div>' });

/* ---------------------------------------------------------------- 5. what happens next */
function nextSvg(narrow) {
  const n = S.next.length, per = narrow ? 1 : n, W0 = narrow ? 360 : 1000, TW = narrow ? 360 : Math.floor((1000 - (n - 1) * 14) / n), GAP = per > 1 ? (W0 - per * TW) / (per - 1) : 0, TH = narrow ? 46 : 60, rows = Math.ceil(n / per), o = [];
  const H = rows * (TH + 10) - 10 + 4;
  o.push('<svg viewBox="0 0 ' + W0 + ' ' + H + '" role="img" class="dh-svg" aria-label="' + ea(n + ' steps, none done yet: ' + S.next.map((s) => s.short).join(', ') + '. Each is said in words below.') + '">');
  S.next.forEach((s, i) => {
    need(s.short && s.short.length <= 22, 'a step has no short label, or one too long to fit its tile');
    const r = Math.floor(i / per), c = i % per, x = c * (TW + GAP), y = 2 + r * (TH + 10);
    if (c < per - 1 && i < n - 1) o.push('<line x1="' + (x + TW + 2).toFixed(1) + '" y1="' + (y + TH / 2) + '" x2="' + (x + TW + GAP - 2).toFixed(1) + '" y2="' + (y + TH / 2) + '" stroke="var(--ink-4)" stroke-width="1.4"/>');
    need(s.state && s.state.length <= 30, 'a step has no state word, or one too long for its tile');
    /* an outline, no tick: started, not done (a tick and a bar mean done on this page) */
    o.push('<g class="dh-t" tabindex="0" aria-label="' + ea((i + 1) + ': ' + s.title + ', ' + s.state) + '"><title>' + esc((i + 1) + ' · ' + s.title + ' · ' + s.state) + '</title>'
      + '<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + TW + '" height="' + TH + '" rx="5" fill="var(--surface2)" stroke="var(--ink-3)" stroke-width="1.4"/>'
      + '<text x="' + (x + 12).toFixed(1) + '" y="' + (y + 19) + '" class="t-note dh-on">' + (i + 1) + '</text>'
      + '<text x="' + (x + TW / 2).toFixed(1) + '" y="' + (y + TH / 2 - (narrow ? 1 : 2)) + '" text-anchor="middle" class="t-lab">' + esc(s.short) + '</text>'
      + '<text x="' + (x + TW / 2).toFixed(1) + '" y="' + (y + TH / 2 + (narrow ? 14 : 16)) + '" text-anchor="middle" class="t-note dh-on">' + esc(s.state) + '</text></g>');
  });
  o.push('</svg>');
  return o.join('');
}
const NEXT = C.section({ lab: 'what is next', title: 'What is next', id: 'next', wide: true,
  bodyRaw: '<div class="wide dh-fig">' + C.figure({ wide: false, svgRaw: '<div class="hv-w">' + nextSvg(false) + '</div><div class="hv-n">' + nextSvg(true) + '</div>', captionRaw: 'The next steps, each with where it stands; none is done yet.' }) + '</div>'
    + '<div class="col"><ol class="dh-ev">' + S.next.map((s, i) => '<li><span class="dh-n">' + (i + 1) + '</span><span><b>' + esc(s.title) + '.</b> ' + esc(s.text) + '</span></li>').join('') + '</ol></div>' });

/* ---------------------------------------------------------------- the day, as it happened: batches as bars, the pause, numbered events */
const T0 = Math.floor(Date.parse(R.start_utc) / 1800000) * 1800000;
const asOfMs = Date.parse(S.as_of);
const TEND = OPEN ? Math.max(asOfMs, ...S.events.map((e) => Date.parse(e.at))) : Math.max(...S.events.map((e) => Date.parse(e.at)));
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
  o.push('<svg viewBox="0 0 ' + W0 + ' ' + H + '" role="img" class="dh-svg" aria-label="' + ea('The run and the hours after it, from ' + hm(new Date(T0).toISOString()) + ' to ' + hm(new Date(T1).toISOString()) + ' UTC: each batch of each family as a bar from its start to its end, the pause as a hatched band, and ' + S.events.length + ' numbered events, listed in words below the figure.') + '">');
  o.push(HATCH('ht-' + (narrow ? 'n' : 'w')));
  for (let t = T0; t <= T1; t += 1800000) {
    o.push('<line x1="' + X(t).toFixed(1) + '" y1="' + top + '" x2="' + X(t).toFixed(1) + '" y2="' + yAx + '" stroke="var(--rule-soft)" stroke-width="1"/>');
    if ((t - T0) % (narrow ? 7200000 : 3600000) === 0) o.push('<text x="' + X(t).toFixed(1) + '" y="' + (yAx + 17) + '" text-anchor="' + (t === T0 ? 'start' : t === T1 ? 'end' : 'middle') + '" class="t-ax">' + esc(hm(new Date(t).toISOString())) + '</text>');
  }
  const px0 = X(Date.parse(R.pause.from)), px1 = X(Date.parse(R.pause.to));
  o.push('<rect x="' + px0.toFixed(1) + '" y="' + top + '" width="' + (px1 - px0).toFixed(1) + '" height="' + (yAx - top) + '" fill="url(#ht-' + (narrow ? 'n' : 'w') + ')" stroke="var(--ink-4)" stroke-width="1"/>');
  o.push('<text x="' + ((px0 + px1) / 2).toFixed(1) + '" y="' + (yAx - 5) + '" text-anchor="middle" class="t-note dh-on">' + esc(narrow ? 'pause' : 'pause, ' + R.pause.lasted) + '</text>');
  for (const g of groups) {
    o.push('<text x="0" y="' + (g.head + 13) + '" class="t-lab">' + esc(g.f.name) + '</text>');
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
  captionRaw: 'The run and the hours after it, in UTC. A filled bar is a batch from its start to its end; the hatched band is the pause. The numbers are the events below.' }) + '</div>';
const EVENTS = '<ol class="dh-ev">' + S.events.map((e, i) => '<li><span class="dh-n">' + (i + 1) + '</span><span><b>' + esc(hm(e.at)) + ' UTC · ' + esc(e.title) + '.</b> ' + esc(e.text) + '</span></li>').join('') + '</ol>';
const TIMESEC = C.section({ lab: 'the timeline', title: 'The day, as it happened', id: 'timeline', wide: true, bodyRaw: TIMELINE + '<div class="col">' + EVENTS + '</div>' });

/* ---------------------------------------------------------------- how the benchmark worked */
const RULES = C.section({ lab: 'how it worked', title: 'How the benchmark worked', id: 'benchmark',
  bodyRaw: C.plainList([
    { b: 'Two model families.', text: CL.name + ' (' + CL.model + '), one agent per batch, and ' + GP.name + ' (' + GP.model + ', through the Codex command line), one session per batch.' },
    { b: 'The same statements, the same order.', text: 'Both families got the same ' + N(R.statements) + ' statements about the checker, in the same ' + word(R.batches) + ' batches of ' + N(R.batch_size) + ', with the same brief and no hints beyond it. The agents were told some statements are false.' },
    { b: 'At most ' + R.cap + ' attempts per statement.', text: 'Proofs and refutations together, per family. A family stops at its first judged outcome on a statement: proved, or refuted (the statement’s text shown false).' },
    { b: 'One judge, the same limits.', text: 'Every attempt was a complete HOL4 script, built on a rented judge machine with no network, under the same limits for both families: ' + N(R.limits.wall_s) + ' s of wall time, ' + N(R.limits.cpu_s) + ' s of CPU per process, ' + N(R.limits.mem_gb) + ' GB of memory. The kernel’s answer is the outcome: proved, refuted, failed, timeout or refused. HOL4 is pinned at ' + R.hol_tag + ', Poly/ML at ' + R.poly_tag + '.'
      + (R.uniform.judge_code === 1 && R.uniform.freeze === 1 && R.uniform.host === 1 && R.uniform.limits ? ' Every attempt of the run was judged on that one machine, by one version of the judge, against one frozen statement list.' : '') },
    { b: 'A sealed answer key.', text: 'Which statements are true, planted or decoys was in a key encrypted before the run (frozen ' + hm(S.freeze.frozen_utc) + ' UTC on ' + day(S.freeze.frozen_utc) + ') under a passphrase that one person, Carlos Toledo, holds. He opened it at ' + SC.unlocked + ' UTC, after the run, the rebuilds, the readers and the audits; it is now public, with its hashes, in the repository.' },
    { b: 'What an agent may not do.', text: 'Run HOL4 itself (every build goes through the judge), or read the true statements’ texts, the other family’s folder, or any agent’s session transcript. Every agent’s tool log was audited for this after the run, twice.' },
    { b: 'Controls first.', text: R.judge.controls[0].toUpperCase() + R.judge.controls.slice(1) + '.' }]) });

/* ---------------------------------------------------------------- one click down */
const trustBody = [
  C.pRaw('<b>Every number on this page is read from a record.</b> The records are written by <span class="m">tools/delta3-hol4-live-records.js</span> from the run’s own files, which it reads and never changes: the scoring program’s output, the two audits’ sets, the readers’ counts, the Layer-1 read-back and the chain’s sources among them. It refuses when a source no longer says what a record states, when two sources disagree (each success rate is read from the scorer’s output and found again in its printed report), and when a time a source states is ahead of the clock. This page is built from the records by <span class="m">tools/build-delta3-hol4-live.js</span>, which refuses when they disagree.'),
  C.table({ cols: [{ h: 'record' }, { h: 'sha256, 12 hex digits' }, { h: 'what it holds' }], rows: ['state.json', 'page-log.json'].map((f) => [{ raw: '<span class="m">' + esc(DIR + f) + '</span>' }, { raw: '<span class="m">' + sha12(DIR + f) + '</span>' }, J(f).what]) }),
  C.pRaw('<b>The sources</b>, read as they stood at ' + esc(hm(S.as_of)) + ' UTC. The private ones are not published from here; their public copies are in the repository. The answer key is never opened by these tools.'),
  C.table({ cols: [{ h: 'source' }, { h: 'sha256, 12 hex digits' }], rows: S.sources.map((s) => [{ raw: '<span class="m">' + C.breakable(s.file) + '</span>' }, { raw: '<span class="m">' + esc(s.sha256_12) + '</span>' }]) }),
  C.pRaw('<b>The freeze.</b> Frozen ' + esc(utc(S.freeze.frozen_utc)) + ', digest of its public files <span class="m">' + esc(S.freeze.digest_12) + '</span>, encrypted with <span class="m">' + esc(S.freeze.cipher) + '</span>. It replaced the freeze of ' + esc(utc(S.freeze.supersedes_utc)) + '. Its public files, the ones every agent read: ' + S.freeze.public_files.map((f) => '<span class="m">' + C.breakable(f) + '</span>').join(', ') + '.'),
  C.pRaw('<b>The judge.</b> One version of the judge for the whole run (<span class="m">' + esc(R.judge.code_12) + '</span>, the first twelve hex digits of the sha256 over its files); ' + esc(R.judge.controls) + '. The proofs made after scoring were judged by copies of the same judge code.'),
  C.pRaw('<b>What the build refuses.</b> The page is not built when: the statement outcomes or the classes do not add up; the scored counts are not the judge’s log; the blind rows do not add up; the chain’s lemmas are not numbered in order with a known source; the newest change-log entry is not the records’ state; the words would say “first”, call δ₃ itself a HOL4 theorem, call the compute primitive verified, print a commit’s hash, or name anyone the work may later be sent to.')];
const TRUST = C.section({ lab: 'one click down', title: 'Why you can trust this', id: 'trust', wide: true,
  bodyRaw: '<div class="wide"><details class="more trust"><summary>The records, the sources and the rules</summary><div class="col">' + trustBody.join('\n') + '</div></details></div>' });

const CHANGES = C.section({ lab: 'changes', title: 'Changes to this page', id: 'changes',
  bodyRaw: C.plainList(PL.entries.slice().reverse().map((e) => ({ b: utc(e.at) + '.', text: e.what }))) });

/* ---------------------------------------------------------------- the copy */
const TITLE = 'δ₃ in HOL4: the checker and its blind benchmark, live';
const HEADER = C.header({ eyebrow: 'Carlos Toledo · a certificate checker in HOL4, in the open', title: TITLE,
  deck: 'δ₃ = ' + Wk.value + ' (' + Wk.problem + ') rests on ' + word(Wk.certificates) + ' exact certificates. A checker for them is written in HOL4 and runs in HOL4’s kernel, and HOL4 now proves it sound: when it accepts a certificate, the bound that certificate claims holds on its whole region. The ' + N(LM.length) + ' lemmas of that proof were a blind benchmark: ' + CL.name + ' and ' + GP.name + ' attempted the same ' + N(R.statements) + ' statements, some false on purpose, and the HOL4 kernel judged every attempt.' })
  + '<div class="col"><p class="scope">This page is rebuilt from its records; this build reads them up to ' + esc(hm(S.as_of)) + ' UTC on ' + esc(day(S.as_of)) + '. The run ended at ' + esc(hm(R.ended_utc)) + ' UTC and was scored at ' + esc(hm(SC.scored_utc)) + ' UTC, after the answer key was opened. Everything is in the public repository ' + REPO_A + '. The certificates, and the exact verifier that decided them first, are on <a href="/reports/delta3.html">the δ₃ report</a>. Nothing here is refereed; the change log is at the foot.</p></div>';

const body = [HEADER, PROVEDSEC, RESULTS, LEAD, LEMMAS, NEXT, TIMESEC, RULES, TRUST, CHANGES].join('\n\n');

const STYLE = `
.dh-sec .sec-head{margin-bottom:var(--s-5)}
.dh-svg .dh-t{outline:none}
.dh-svg .dh-t:focus-visible rect{stroke:var(--ink);stroke-width:2.6}
.dh-svg .dh-dim{fill:var(--ink-3)}
.dh-svg .dh-on{fill:var(--ink-2)}
.dh-svg .dh-bg{paint-order:stroke;stroke:var(--surface);stroke-width:4px;stroke-linejoin:round}
.dh-fig .hv-n{display:none}
@media (max-width:680px){.dh-fig .hv-w{display:none}.dh-fig .hv-n{display:block}}
.dh-ic{display:inline-block;vertical-align:middle;flex:none}
.dh-k{display:inline-flex;align-items:center;gap:var(--s-2)}
.dh-key{list-style:none;margin:var(--s-4) 0 var(--s-5);padding:0;display:grid;gap:var(--s-2);font-size:var(--text-small);color:var(--ink-2)}
.dh-key .dh-k{align-items:flex-start}
.dh-kt{display:grid;grid-template-columns:minmax(0,1fr) auto auto;column-gap:var(--s-5);margin:var(--s-5) auto var(--s-5);font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-2)}
.dh-kt>span{padding:var(--s-2) 0;border-bottom:1px solid var(--rule);min-width:0}
.dh-kh{font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-4)}
.dh-kv{text-align:right;color:var(--ink)}
.dh-kt.dh-k4{grid-template-columns:minmax(0,1fr) auto auto auto;column-gap:var(--s-4);width:100%}
.dh-rg{margin:var(--s-4) 0 var(--s-6);font-size:var(--text-small)}
.dh-rh{margin:var(--s-5) 0 var(--s-1);color:var(--ink-2)}
/* label above value at every width: a value column of its own would put each row on its own left edge */
.dh-rr{display:grid;grid-template-columns:minmax(0,1fr);padding:var(--s-2) 0;border-bottom:1px solid var(--rule)}
.dh-rl{color:var(--ink-2);min-width:0}
.dh-rv{font-family:var(--f-mono);color:var(--ink)}
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
  desc: 'A checker for the five certificates behind δ₃ = 117/2192 (Erdős #1186), written in HOL4, run in its kernel and proved sound there, and the blind benchmark that proved its lemmas: Claude Opus 5.5 and GPT-6.2 Astra on the same statements, every attempt judged by the HOL4 kernel.',
  og: fs.existsSync(path.join(ROOT, 'design', 'assets', 'og-delta3-hol4.png')) ? { image: '/og-delta3-hol4.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('delta3-hol4') } : undefined
});

/* ---------------------------------------------------------------- the words never claim more than the records */
const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<wbr>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const surface = visible.slice(0, visible.indexOf('Why you can trust this'));
need(!OPEN || !/\bS\d{3}\b/.test(html), 'the run is open, and the page prints a statement id: ' + (/.{0,40}\bS\d{3}\b.{0,20}/.exec(html) || [''])[0]);
need(!/sequent|verifereum/i.test(html), 'the page names someone the work may later be sent to: never');
/* the page's own words (the template's contact form has a mail field of its own) */
need(!/\be-?mails?\b/i.test(body.replace(/<[^>]+>/g, ' ')), 'the page speaks of a mail: the work stands on its own');
need(!/\bfirst (HOL4|formali[sz]|to\b|ever|work on|machine|kernel|proof of)|\bthe first (HOL4|formal|independent|verified|complete)|\bfor the first time\b/i.test(visible), 'the page claims priority (a “first”): ' + (/.{0,60}\bfirst\b.{0,40}/i.exec(visible) || [''])[0]);
need(!/\bverified (in-kernel )?comput|\bverified (compute|in-kernel)/i.test(visible), 'the page calls the compute primitive verified (it is a port of Candle’s proved-sound facility)');
/* soundness may be said only because the records read back the three theorems; δ₃ itself is never said to be a HOL4 theorem */
need(PV.theorems.length === 3 || !/(checker|it) (is|has been|was) (now )?(proved|verified) sound|proves it sound|soundness (is|has been|was) (now )?proved/i.test(visible), 'the page says the checker is proved sound, and the records do not read back the three theorems');
need(!/δ₃[^.]{0,40}\b(is|has been|was) (now )?(proved|formali[sz]ed|a theorem) in HOL4|HOL4 (now )?(proves|has proved) δ₃|δ₃ = 117\/2192 is a HOL4 theorem/i.test(visible), 'the page says δ₃ itself is proved in HOL4: it is not (the analysis and the model constants are outside HOL4)');
const hnM = /.{0,80}(hacker ?news|news\.ycombinator).{0,40}/i.exec(html); need(!hnM, "Hacker News on the page: " + (hnM ? hnM[0] : ""));
need(!/\b[0-9a-f]{40}\b/.test(html) && !/\/commit\//.test(html), 'a commit hash or commit link on the page');
need(!/\b(?=[0-9a-f]*[a-f])[0-9a-f]{12,}\b/.test(surface), 'a hash on the surface (above "Why you can trust this")');
need(SC || !/\b\d+ (true statements|planted statements|decoys)\b/i.test(visible), 'the page states how many statements of a class there are before the key is opened');
need(!/\b(?:TODO|undefined|NaN)\b/.test(visible), 'a placeholder reached the page');
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(path.join(OUTDIR, 'index.html'), html);
console.log('site/delta3-hol4/index.html written: run ' + (OPEN ? 'OPEN' : 'ENDED') + ', scored at ' + hm(SC.scored_utc) + ' (gate held), ' + PV.theorems.length + ' soundness theorems, ' + LM.length + ' lemmas on the chain; '
  + FAM.map((f) => f.name + ' ' + f.statements.proved + ' proved, ' + f.statements.refuted + ' refuted').join('; ') + '; ' + S.gaps.length + ' gaps, ' + S.events.length + ' events, ' + PL.entries.length + ' change-log entr' + (PL.entries.length === 1 ? 'y' : 'ies') + ', as of ' + S.as_of);
