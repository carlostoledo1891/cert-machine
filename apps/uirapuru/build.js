/* apps/uirapuru/build.js — the Uirapuru story: what cert-machine does, told with birds.
   A sibling of the easy read (apps/explained): the same house template, the same shared script (common.js), the same
   reader of the records (records.js) for the few real numbers the story quotes. Everything else on the page is a seeded
   toy — the forest, the birds, the notebook — and the page says so. The toy's own facts (how many birds of patch 7 are
   blue, which is the bluest) are computed HERE from forest.js, the one definition the page also runs, so the notebook,
   the stage and the instruments can never disagree.

     site/uirapuru/index.html      the page, from body.html + page.css + page.js with {{KEYS}} filled

   usage: node apps/uirapuru/build.js          (make site runs it; make page R=apps/uirapuru for the edit loop)
   apps/uirapuru · cert-machine                                                                                      MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, V, flatten, fill, need, git, T } = require('../explained/records.js');   /* the one reader of the records */
const { forest } = require('./forest.js').FOREST;
const SITE = path.join(ROOT, 'site', 'uirapuru');

/* ---- the toy's facts, from the one generator ---- */
const N7 = 144, BLUE = 70;
const b7 = forest(7, N7, 100);
let least = 0, most = 0, count = 0;
for (let i = 0; i < N7; i++) { if (b7[i] < b7[least]) least = i; if (b7[i] > b7[most]) most = i; if (b7[i] >= BLUE) count++; }
need(count >= 1 && b7[least] < BLUE, 'the story needs patch 7 to hold a blue bird and a bird that is not blue');
need(b7[16] > b7[17], 'the story says the bird at tree 17 is bluer than the one at tree 18');
V.F7_N = String(N7); V.F7_BLUE = String(BLUE); V.F7_COUNT = String(count); V.F7_BLUEST_TREE = String(most + 1); V.F7_BLUEST = String(b7[most]);
V.F7_LEAST_TREE = String(least + 1); V.F7_LEAST = String(b7[least]);
/* patch 3, Instrument 3's: its size and its claim's bar, once, for the prose, the panel and the page's script (they were
   typed in all three) */
const N3 = 36, MAX3 = 70, SEED3 = 60;
const b3 = forest(3, N3, SEED3); need(Math.max(...b3) <= MAX3, 'patch 3 must satisfy its claim as seeded');
V.F3_N = String(N3); V.F3_MAX = String(MAX3); V.F3_SEED = String(SEED3);

/* ---- WARRANT v2 on a page that mixes a toy with the records (2026-10-28) ----------------------------------------------
   The forest is one seeded forest of all the forests the seed could have drawn: CHOSEN. Its facts are decided exactly OVER
   that forest, so they meet at CHOSEN and are underlined dotted; the machine's own numbers (the register, the self-audit,
   the wave) stay plain, DECIDED. A toy in a tree holds no number and is drawn as the void. The compact legend sits once,
   under the stats strip, with the sentence that says so. */
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const TOY = 'chosen — the toy\'s: decided exactly over one seeded forest, one of all the forests a seed could have drawn';
const toy = (x) => W.value(String(x), W.CHOSEN, { title: TOY });
V.F7_N_C = toy(V.F7_N); V.F7_COUNT_C = toy(V.F7_COUNT); V.F3_N_C = toy(V.F3_N); V.F3_MAX_C = toy(V.F3_MAX);
V.TOY_LEGEND = W.legendHtml({ compact: true, exclude: [W.COMPUTED] });
/* the real wave, said the way the records say it: the GPU ran the seven largest, a laptop the other twelve */
const { numword } = require('../explained/records.js');
V.KW_GPU_ROWS_WORD = numword(Number(V.KW_GPU_ROWS)); V.KW_DESK_ROWS_WORD = numword(Number(V.KW_DESK_ROWS));
/* Instrument 4's tally, counted in the page's own list of sentences ("Four refusals" was printed over five) */
{ const js = T('apps/uirapuru/page.js'); const rows = /const ROWS=\[\n([\s\S]*?)\n \];/.exec(js); need(rows, 'Instrument 4 has no ROWS list');
  const lines = rows[1].split('\n').filter((l) => /^\s*\['/.test(l)); const refusals = lines.filter((l) => /\(\)=>refused\(/.test(l)).length;
  need(lines.length >= 2 && refusals >= 1 && refusals < lines.length, 'Instrument 4\'s sentences do not parse');
  V.ASK_N_WORD = numword(lines.length); V.ASK_N_WORD_CAP = V.ASK_N_WORD.replace(/^./, (c) => c.toUpperCase());
  V.ASK_REFUSED_WORD = numword(refusals).replace(/^./, (c) => c.toUpperCase()); }
/* Instrument 2's real gaps, |double(k/10) − k/10| over the printed positions 0.1 … 0.9 the slider offers, exactly (a double is
   a dyadic rational): the drawing shows every gap at one fixed width, and the caption said "exaggerated by a factor of ten
   to the seventeenth", which held for none of them (the factor runs from about 10¹⁵ to 10¹⁶). Printed as a range rounded
   OUTWARD: the low end down, the high end up. */
{ const dyadic = (x) => { const b = Buffer.alloc(8); b.writeDoubleBE(x); const bits = b.readBigUInt64BE(); const e = Number((bits >> 52n) & 0x7ffn) - 1075; const m = (bits & ((1n << 52n) - 1n)) | (1n << 52n); return e >= 0 ? [m << BigInt(e), 1n] : [m, 1n << BigInt(-e)]; };
  const gaps = []; for (let k = 1; k <= 9; k++) { const [n, d] = dyadic(k / 10); const g = n * 10n - BigInt(k) * d; if (g !== 0n) gaps.push([g < 0n ? -g : g, d * 10n]); }   /* |n/d − k/10| = |10n − kd| / 10d */
  need(gaps.length === 8, 'only 0.5 should read the same both ways');
  /* two significant digits of p/q·10^e, rounded down or up */
  const sig2 = ([p, q], up) => { let e = 0, P = p, Q = q; while (P < Q) { P *= 10n; e--; } while (P >= Q * 10n) { Q *= 10n; e++; }
    /* now 1 ≤ P/Q < 10 */ const t = P * 10n / Q + (up && (P * 10n) % Q !== 0n ? 1n : 0n); need(t < 100n, 'a gap rounded up past a decade'); const sup = String(e).replace(/-/g, '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]);
    return (t / 10n) + '.' + (t % 10n) + '·10' + sup; };
  const cmp = (a, b) => (a[0] * b[1] < b[0] * a[1] ? -1 : a[0] * b[1] > b[0] * a[1] ? 1 : 0);
  gaps.sort(cmp); V.F2_GAP_LO = sig2(gaps[0], false); V.F2_GAP_HI = sig2(gaps[gaps.length - 1], true);
  need(V.F2_GAP_LO === '5.5·10⁻¹⁸' && V.F2_GAP_HI === '4.5·10⁻¹⁷', 'the double gaps of 0.1 … 0.9 are not the ones the caption was checked against: ' + V.F2_GAP_LO + ', ' + V.F2_GAP_HI); }

/* ---- the mapping table: the story, the machine, the record ---- */
const C = require(path.join(ROOT, 'design', 'components.js'));
V.MAP = C.table({
  cols: [{ h: 'in the story', cls: 'k' }, { h: 'in the machine' }, { h: 'on the record' }],
  rows: [
    ['a Uirapuru', 'an object a program can enumerate and decide exactly', V.REG_ROWS + ' claims from ' + V.REG_CLAIMANTS + ' claimants in the register'],
    ['the patch', 'the box of inputs the claim is made over', 'every claim names one, or is refused'],
    ['blue, at least ' + BLUE, 'an inequality with a printed number', 'the number read as the exact rational its digits mean'],
    ['calling every bird', 'exact arithmetic over every input, no sampling', V.KW_PAIRS_SCI_PLAIN + ' pairs decided in one wave, ' + V.KW_CONTACTS + ' at exactly sixty degrees'],
    ['the bird\'s tree', 'the witness shipped with a refutation', V.REG_DEFECTS + ' defects on record, each with its witness'],
    ['the painted birds', 'the self-audit\'s planted errors', V.SA_MUTANTS + ' tries, ' + V.SA_FALSE_CERT + ' false certifications'],
    ['the two readings of 0.3', 'the printed digits and the double they denote', V.SIX_VIOL_DIGITS + ' and ' + V.SIX_VIOL_DOUBLES + ' violating pairs on the ' + V.SIX_N + '-point record'],
    ['a toucan', 'a claim with no exact decider', 'refused, with the reason'],
    ['every bird, forever', 'a theorem', 'refused; left to proofs and proof assistants'],
    ['the recording', 'a file the public cannot read', 'refused; the ask is the file']
  ]
});

/* ---- fill the parts and render through the house template ---- */
const bodyRaw = fill(T('apps/uirapuru/body.html'), 'body.html');
const cssRaw = fill(T('apps/explained/page.css'), 'explained/page.css') + '\n' + fill(T('apps/uirapuru/page.css'), 'page.css');
const scriptRaw = '<script>\n(function(){\n\'use strict\';\n' + T('apps/explained/common.js') + '\n' + T('apps/uirapuru/forest.js') + '\n' + fill(T('apps/uirapuru/page.js'), 'page.js') + '\n})();</script>';
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const footRaw = '<p>This page is a story. The forest, the birds, the patches and the notebook are invented and seeded, and the instruments decide them in your browser in plain integers; the Uirapuru (Cyphorhinus arada) is a real bird, and its colour here is a number on an invented scale. The real numbers on the page — ' + V.REG_ROWS + ' claims, ' + V.SA_MUTANTS + ' planted errors, ' + V.KW_PAIRS_SCI_PLAIN + ' pairs, ' + V.RfSentences + ' sentences — were read at build time from the records of the cert-machine repository at commit ' + git + ' on ' + V.DATE + ', through the same reader as the easy read. Written with AI assistance (Claude) under a written brief; the verdicts quoted are the machine\'s.</p>';
const html = TPL.render({
  title: 'The Uirapuru test · a story', lang: 'en', bodyClass: 'easy', path: '/uirapuru/',
  desc: 'Someone says there is a blue Uirapuru in the forest. Nobody has seen it. A machine that can call every Uirapuru in a patch, and cannot call a toucan: what cert-machine does, told as a story with four things to touch.',
  bodyRaw, footRaw, cssRaw, scriptRaw
});
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'index.html'), html);
console.log('site/uirapuru/index.html written (' + Math.round(html.length / 1024) + ' KB; ' + Object.keys(flatten()).length + ' numbers from the records and the toy) @ git ' + git);
