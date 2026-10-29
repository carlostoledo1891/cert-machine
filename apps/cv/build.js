#!/usr/bin/env node
/* build.js — the public CV at /cv/: apps/cv/cv.md, its figures read from the records, printed in WARRANT's paper
   register (design/print/tokens.js) to site/cv/carlos-toledo-cv.pdf. The URL https://carlostoledo.co/cv/ redirects to
   the PDF (vercel.json), so the link never changes while the document is rebuilt with the site.
   apps/cv · cert-machine · 2026-10-29 (the operator: "a small CV/resume builder, based on the grammar light version,
   always updated and published at the same website link")

   EVERY FIGURE IS READ, NEVER TYPED. cv.md carries {{name}} tokens; FIGURES below maps each to a record cell through
   design/record.js (the same resolver and printer the pages use) or to a short computation over record cells. A token
   with no figure, a figure whose record moved, or an [OPERATOR FILLS …] mark with no block in the git-ignored
   outreach/resume/resume.private.md REFUSES the build: nothing with a placeholder is ever published.

   THE REGISTER is paper (WARRANT v2.3): ink #000000 and its two steps, the guide and grid greys, no colour. The page
   is never served as HTML (the site stays dark, battery T3b); only the PDF is. The faces are the site's.

   usage: node apps/cv/build.js          -> site/cv/carlos-toledo-cv.pdf
          make page R=apps/cv            the same, then the sync */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const LIB = require(path.join(ROOT, 'outreach', 'resume-lib.js'));
const R = require(path.join(ROOT, 'design', 'record.js'));
const OUT = require(path.join(ROOT, 'design', 'outward.js'));
const fail = (why) => { console.error('apps/cv/build.js: REFUSED — ' + why); process.exit(1); };

const int = (file, ptr) => R.print(R.read(file, ptr), 'int', 'decided');
const num = (file, ptr) => Number(R.read(file, ptr));
const sci15 = (n) => { const e = Math.floor(Math.log10(n)); return (n / 10 ** e).toFixed(2) + ' × 10' + String(e).replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]); };
const ASTER_WORD = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

/* each figure: a record cell, or a short computation over cells, every path under certs/ or corpus/ */
const FIGURES = {
  claims_decided: () => int('certs/claims-ledger.json', '/decided'),
  oai_manuscripts: () => int('corpus/openai-math/release.json', '/counted/manuscriptLinks'),
  oai_challenges: () => int('certs/openai-math-kernel.json', '/counts/of'),
  oai_certified: () => int('certs/openai-math-kernel.json', '/counts/words/CERTIFIED'),
  oai_refused: () => int('certs/openai-math-kernel.json', '/counts/words/REFUSED'),
  oai_families: () => int('certs/openai-math-statements.json', '/counts/families'),
  oai_short: () => String(num('certs/openai-math-statements.json', '/counts/words/DIFFERENT') + num('certs/openai-math-statements.json', '/counts/words/NARROWER — UNDECLARED')),
  oai_gaps: () => String(R.read('corpus/openai-math/findings.json', '/findings').length),
  envs_n: () => { const g = R.read('certs/envs-record.json', '/graders').find((x) => /absolute/.test(x.name)); return Number(g.wrongSubmissions).toLocaleString('en-US'); },
  envs_k: () => { const g = R.read('certs/envs-record.json', '/graders').find((x) => /absolute/.test(x.name)); const n = g.wrongSubmissions, k = Math.round(g.falseAccept * n);
    if (k / n !== g.falseAccept) fail('the tolerance grader\'s rate is not an exact count'); return k.toLocaleString('en-US'); },
  hz_certified: () => int('certs/horizon-ledger.json', '/counts/certified'),
  hz_fits: () => int('certs/horizon-ledger.json', '/counts/fits'),
  hz_dbl23: () => { const [lo, hi] = R.read('certs/horizon-ledger.json', '/trend/certified/from_2023_on/doublingDays');
    const a = OUT.fixed(lo, 3, false), b = OUT.fixed(hi, 3, true); return a === b ? a : 'between ' + a + ' and ' + b; },   /* outward, never nearest (rule 8) */
  hz_printed23: () => R.print(R.read('certs/horizon-ledger.json', '/trend/printed/from_2023_on/point_estimate'), 'raw'),
  gsm_keys: () => (num('certs/gsm8k-ledger.json', '/test/items') + num('certs/gsm8k-ledger.json', '/train/items')).toLocaleString('en-US'),
  gsm_steps: () => int('certs/gsm8k-ledger.json', '/test/annotations/EXACT'),
  gsm_wrong: () => String(num('certs/gsm8k-ledger.json', '/findings/printedStepWrongTest') + num('certs/gsm8k-ledger.json', '/findings/printedStepWrongTrain')),
  gsm_underived: () => String(num('certs/gsm8k-ledger.json', '/findings/printedStepWrongTestAnswerNotHeld') + num('certs/gsm8k-ledger.json', '/findings/printedStepWrongTrainAnswerNotHeld')),
  kiss_rows: () => { const q = R.read('certs/kissing-wave.json', '/rows').filter((r) => r.claimant === 'qiushi');
    if (!q.every((r) => r.verdict === 'WITNESSED' && r.engine.violations === 0)) fail('a Qiushi row is not witnessed clean'); return String(q.length); },
  kiss_pairs: () => sci15(R.read('certs/kissing-wave.json', '/rows').filter((r) => r.claimant === 'qiushi').reduce((a, r) => a + r.engine.pairs, 0)),
  k18_claimed: () => int('certs/kissing-wave.json', '/rows[id=kravatsky-18]/claimed'),
  k18_pairs: () => { if (num('certs/kissing-wave.json', '/rows[id=kravatsky-18]/engine/violations') !== 0) fail('K(18) has a violation'); return int('certs/kissing-wave.json', '/rows[id=kravatsky-18]/engine/pairs'); },
  asterisks: () => { const arr = R.read('corpus/recognition.json', '/rows').filter((r) => r.kind === 'registry' && /asterisks? removed/i.test(r.what));
    const n = arr.reduce((a, r) => a + (ASTER_WORD[(/^(\w+)/.exec(r.what) || [])[1].toLowerCase()] || 0), 0); if (!n) fail('no asterisk credits in corpus/recognition.json'); return String(n); },
  optq_cert: () => int('certs/optq-ledger.json', '/counts/CERTIFIED'),
  optq_ref: () => int('certs/optq-ledger.json', '/counts/REFUSED'),
  aerp_cert: () => int('certs/aerp-ledger.json', '/counts/CERTIFIED'),
  aerp_ref: () => int('certs/aerp-ledger.json', '/counts/REFUSED'),
  wowii_cert: () => int('certs/wowii-ledger.json', '/counts/CERTIFIED'),
  pu_reproduced: () => int('certs/pu-ledger.json', '/counts/byVerdict/REPRODUCED'),
  pu_consistent: () => int('certs/pu-ledger.json', '/counts/byVerdict/CONSISTENT'),
  pu_off: () => int('certs/pu-ledger.json', '/counts/byVerdict/OFF'),
  pu_needs: () => int('certs/pu-ledger.json', '/counts/byVerdict/NEEDS DATA'),
  pu_total: () => Object.values(R.read('certs/pu-ledger.json', '/counts/byVerdict')).reduce((a, b) => a + b, 0).toLocaleString('en-US'),
};

let md = fs.readFileSync(path.join(__dirname, 'cv.md'), 'utf8');
const used = new Set();
md = md.replace(/\{\{(\w+)\}\}/g, (all, k) => {
  if (!FIGURES[k]) fail('no figure named ' + k);
  used.add(k);
  try { return FIGURES[k](); } catch (e) { fail('figure ' + k + ': ' + e.message); }
});
const tail = md.lastIndexOf('\n---\n');
const body = tail > 0 ? md.slice(0, tail) : md;
if (/\{\{/.test(body)) fail('a token survived substitution');

const fills = LIB.readFills(path.join(ROOT, 'outreach', 'resume', 'resume.private.md'));
for (const k of ['experience', 'education']) if (!fills[k]) fail('no @@ ' + k + ' block in outreach/resume/resume.private.md — the public CV is never published with a placeholder');
/* THE TOUCH OF DESIGN (the operator, 2026-10-29: "the visuals are too simple"), inside the grammar: four record numbers
   as a strip, and one real-data figure — the register's own count, decided claims by day since August, a solid step
   (DECIDED: counts over a record) in ink, the axis in the guide grey, the last value labelled. No colour. */
const P = require(path.join(ROOT, 'design', 'print', 'tokens.js'));
const INK = P.hex('--ink'), GUIDE = P.hex('--guide'), GRID = P.hex('--grid');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = [
  { v: FIGURES.claims_decided(), k: 'claims decided', n: 'since August 2026, each with the record that decided it' },
  { v: FIGURES.asterisks(), k: 'asterisks removed', n: 'from Tao\'s optimization-constants registry, on our replays' },
  { v: FIGURES.envs_k() + ' / ' + FIGURES.envs_n(), k: 'wrong answers a tolerance grader admits', n: 'a certificate grader admits none' },
  { v: FIGURES.kiss_pairs(), k: 'pairs of points decided exactly', n: 'the Qiushi Engine\'s nineteen kissing bounds' },
];
for (const k of ['claims_decided', 'asterisks', 'envs_k', 'envs_n', 'kiss_pairs']) used.add(k);
for (const k of Object.keys(FIGURES)) if (!used.has(k)) fail('figure ' + k + ' is defined but neither cv.md nor the strip prints it');
const stripHtml = '<div class="stats">' + strip.map((s) => `<div><div class="v">${esc(s.v)}</div><div class="k">${esc(s.k)}</div><div class="n">${esc(s.n)}</div></div>`).join('') + '</div>';
const curve = (() => {
  const rows = R.read('certs/claims-ledger.json', '/rows').filter((r) => r.verdict !== 'QUEUED');
  const days = rows.map((r) => String(r.recordedOn)).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
  if (days.length !== rows.length) fail('a decided row of the register has no recordedOn date');
  const t0 = Date.parse(days[0]), t1 = Date.parse(days[days.length - 1]), span = Math.max(1, t1 - t0);
  const W = 540, H = 44, L = 2, Rr = 2, T = 8, B = 12, pw = W - L - Rr, ph = H - T - B;
  const px = (t) => L + pw * (t - t0) / span, py = (n) => T + ph * (1 - n / rows.length);
  let d = 'M' + px(t0).toFixed(1) + ',' + py(0).toFixed(1), n = 0, last = null;
  for (const day of days) { const t = Date.parse(day); if (last !== null && t !== last) d += 'H' + px(t).toFixed(1); n++; d += 'V' + py(n).toFixed(1); last = t; }
  d += 'H' + px(t1).toFixed(1);
  const months = [...new Set(days.map((x) => x.slice(0, 7)))];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ticks = months.map((m) => { const t = Math.max(t0, Date.parse(m + '-01')); return `<line x1="${px(t).toFixed(1)}" y1="${T + ph}" x2="${px(t).toFixed(1)}" y2="${T + ph + 2.5}" stroke="${GUIDE}" stroke-width="0.5"/>`
    + `<text x="${px(t).toFixed(1)}" y="${H - 3}" font-size="6.2" fill="${GUIDE}" font-family="Inter, sans-serif">${MON[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}</text>`; }).join('');
  return `<div class="fig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Decided claims by day since ${days[0]}: ${rows.length} on ${days[days.length - 1]}.">`
    + `<line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}" stroke="${GRID}" stroke-width="0.6"/>` + ticks
    + `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<circle cx="${px(t1).toFixed(1)}" cy="${py(rows.length).toFixed(1)}" r="2" fill="${INK}"/>`
    + `<text x="${(px(t1) - 5).toFixed(1)}" y="${(py(rows.length) - 3).toFixed(1)}" text-anchor="end" font-size="7.2" font-weight="600" fill="${INK}" font-family="Inter, sans-serif">${rows.length} decided by ${days[days.length - 1]}</text>`
    + `</svg><p class="cap">The register (certs/claims-ledger.json), read when this page was built: decided claims by day; a solid step, because every count is exact.</p></div>`;
})();
const { html, head, left, register } = LIB.renderHtml(md, { fills: { experience: fills.experience, education: fills.education }, register: 'paper', docWord: 'CV', compact: true, afterLeadRaw: stripHtml + curve });
if (left) fail(left + ' mark(s) unfilled');
if (/\bphone|\+55/.test(html)) fail('a phone number reached the public CV');

const outPath = path.join(ROOT, 'site', 'cv', 'carlos-toledo-cv.pdf');
LIB.printPdf(html, { footerLeft: head.name + ' · CV · carlostoledo.co/cv · rebuilt from the records ' + new Date().toISOString().slice(0, 10), outPath, port: 9233, ink4: register.ink4 })
  .then(({ pages }) => { console.log('site/cv/carlos-toledo-cv.pdf written, ' + pages + ' page(s), ' + used.size + ' figures read from the records'); })
  .catch((e) => fail(e.message || e));
