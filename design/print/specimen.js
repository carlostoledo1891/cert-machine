#!/usr/bin/env node
/* specimen.js — the print register on one A4 sheet, for the operator to judge. Nothing here is served.
   design/print/ · cert-machine (2026-10-29)

   One page, white paper: the four standings and their voices in text, the void, the witness ×, the guide, a premise
   chain, the register with its numbers, and two report figures redrawn from OUR public records —
     A  a design-wave figure: buoy A's certified 100-year Hs by block (certs/hseva-ledger.json; the same figure as
        /reports/hseva.html §3), the delta method's intervals as computed, the annual choice as the void;
     B  an environmental-contour figure: dataset A's 20-year contours from three contributions over the hours they
        were scored on (certs/ecbench-ledger.json, corpus/ec-benchmark pinned by sha256).
   Every number on the sheet is read from a record here and gated: a value that is gone, or that rounds differently
   at the two ends of its enclosure, stops the build rather than print a digit nothing decided.

   The same sheet is written twice: in colour, and in greyscale as a mono laser lays it (every register colour mapped
   to the grey of its CIE luminance, design/print/tokens.js mono()). Both SVGs go through design/print/check-svg.js
   (the dash census of tools/check-grammar.js, the register's colours) before the PDFs are printed, through
   design/cdp.js, the way design/paper.js prints the papers.

   usage: node design/print/specimen.js            writes specimen.svg, specimen-grey.svg, specimen.pdf, specimen-grey.pdf
          node design/print/specimen.js --no-pdf   the SVGs only
   MIT licensed. Part of cert-machine. */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const PR = require(path.join(__dirname, 'tokens.js'));
const CHK = require(path.join(__dirname, 'check-svg.js'));
const Lb = require(path.join(ROOT, 'instruments', 'ecbench', 'lib.js'));

const die = (m) => { console.error('specimen: ' + m); process.exit(1); };
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => Number(n).toLocaleString('en-US');

/* ---- rounding that a record can stand behind (WARRANT rule 8: round, never truncate; an enclosure prints a digit only
   when both of its ends round to it) ---- */
function roundDec(s, k) {
  const [i, fr = ''] = String(s).replace(/^-/, '').split('.');
  const N = BigInt(i + fr.padEnd(k + 1, '0').slice(0, Math.max(fr.length, k + 1)));
  const scale = 10n ** BigInt(Math.max(fr.length, k + 1) - k);
  const r = (2n * N + scale) / (2n * scale);
  const t = String(r).padStart(k + 1, '0');
  return (String(s).startsWith('-') ? '-' : '') + (k ? t.slice(0, -k) + '.' + t.slice(-k) : t);
}
function enc2(e, k = 2) { const a = roundDec(e.lo, k), b = roundDec(e.hi, k); if (a !== b) die('the enclosure [' + e.lo + ', ' + e.hi + '] does not decide ' + k + ' decimals'); return a; }

/* ================================================================ the records == */
const H = J('certs/hseva-ledger.json');
const E = J('certs/ecbench-ledger.json');
const GS = J('certs/gsm8k-ledger.json');
const BLOCKS = H.buoyBlocks;
if (BLOCKS.join() !== 'native,daily,weekly,monthly,annual') die('the buoy blocks moved: ' + BLOCKS.join());
const BLK = { native: 'hourly', daily: 'daily', weekly: 'weekly', monthly: 'monthly', annual: 'annual' };
const FAMW = { expweibull: 'exp. Weibull', lognormal: 'lognormal', gengamma: 'gen. gamma', gumbel: 'Gumbel', weibull: 'Weibull', normal: 'normal' };
const A = H.buoys.A;
const decided = BLOCKS.filter((b) => A.blocks[b].rankings.ad.verdict === 'DECIDED');
const picked = [...new Set(decided.map((b) => A.blocks[b].rankings.ad.best))];
if (picked.join() !== 'expweibull,lognormal') die('buoy A\'s Anderson–Darling picks moved: ' + picked.join());
const refusedBlocks = BLOCKS.filter((b) => A.blocks[b].rankings.ad.verdict === 'REFUSED');
if (refusedBlocks.join() !== 'annual') die('buoy A\'s refused blocks moved: ' + refusedBlocks.join());
const annualWhy = A.blocks.annual.rankings.ad.why || '';
if (!/^no certified fit for expweibull/.test(annualWhy)) die('the annual refusal no longer names the exponentiated Weibull: ' + annualWhy);
const levels = {};
for (const f of picked) for (const b of BLOCKS) {
  const F = A.blocks[b].fits[f];
  if (F.certified && F.returnLevel && F.returnLevel[100]) levels[f + '/' + b] = { lo: F.returnLevel[100].lo, hi: F.returnLevel[100].hi, txt: enc2(F.returnLevel[100]) };
}
const delta = {};
for (const b of decided) { const f = A.blocks[b].rankings.ad.best, s = A.blocks[b].stat && A.blocks[b].stat.fits[f] && A.blocks[b].stat.fits[f].l100; if (!s) die('no delta interval for ' + f + ' at ' + b); delta[b] = s.map(Number); delta[b].txt = s; }
const maxHour = A.blocks.native.max;
const agg = H.findings.buoys.aggregation.find((q) => q.series === 'buoy A');
if (!agg || agg.lo !== levels['lognormal/monthly'].txt || agg.hi !== levels['expweibull/weekly'].txt) die('the aggregation finding no longer matches the levels it names');
const split = H.findings.buoys.disagree.find((d) => d.series === 'buoy A' && d.block === 'monthly');
if (!split || split.winners.ad !== 'lognormal' || split.winners.ks !== 'expweibull') die('the monthly criteria split moved');
const nHours = A.n, years = A.years;
const nativeFile = A.files.find((x) => x.rel === 'datasets/A.txt');

/* the contours: three well-formed submissions for dataset A's 20-year contour, one of them an open file */
const CON = ['1', '6', '3'].map((id) => E.rows.find((r) => r.dataset === 'A' && r.returnPeriod === 20 && r.contribution === id));
if (CON.some((r) => !r)) die('a contour row is missing');
const cmp = (r) => E.comparisons.find((c) => c.contribution === r.contribution && c.returnPeriod === 20 && c.quantity === 'outside' && (c.dataset === 'A' || String(c.dataset).includes('A')));
for (const r of CON) { const c = cmp(r); if (!c || !c.agrees || c.printed !== r.counts.full.out) die('contribution ' + r.contribution + '\'s printed count no longer reproduces'); if (!r.polygon.simple) die('contribution ' + r.contribution + ' is no longer simple'); }
if (!CON[0].polygon.closed || !CON[1].polygon.closed || CON[2].polygon.closed) die('the closed/open pattern of the three contours moved');
const exp20 = E.expected.find((e) => e.dataset === 'A' && e.returnPeriod === 20);
if (exp20.total.exact !== '1') die('the expected number outside a total-class 20-year contour is no longer 1');
const expIform = enc2(exp20.iform, 1);
const dsA = E.datasets.A;
if (dsA.full !== nHours || dsA.maxHs.full.hs !== maxHour) die('the hseva and ecbench records disagree about buoy A');
if (E.summary.rulesDisagreeTotal !== 0) die('the even-odd and winding rules disagree somewhere');
/* the validator's own verdict, read from its report and re-derived here: the sheet never states a count the run did not make */
const VR = require(path.join(__dirname, 'validate.js')).run();
if (VR.verdict !== 'PASS') die('the validator does not pass; run node design/print/validate.js');
const gw = GS.test.rows.find((r) => r.i === 501);
if (!gw || gw.class !== 'PRINTED_STEP_WRONG' || gw.witness.exact !== '91') die('the GSM8K witness moved');

/* the hours, counted exactly into chosen cells (0.25 s × 0.2 m) from the pinned files */
Lb.ensureCorpus();
const pv = Lb.readDataset('datasets/A.txt'), rv = Lb.readDataset('datasets-retained/Ar.txt');
if (pv.sha256 !== nativeFile.sha256) die('datasets/A.txt does not match its pin');
const NX = 80, NY = 60, X1 = 20, Y1 = 12;   /* Tz 0–20 s by 0.25, Hs 0–12 m by 0.2 */
const cells = new Array(NX * NY).fill(0); let clipped = 0, counted = 0;
const intOf = (s) => { const [i, fr = ''] = s.split('.'); return { N: Number(i + fr), d: fr.length }; };
for (const ds of [pv, rv]) for (let i = 0; i < ds.n; i++) {
  const u = intOf(ds.us[i]), h = intOf(ds.hs[i]);
  const ix = Math.floor(4 * u.N / 10 ** u.d), iy = Math.floor(5 * h.N / 10 ** h.d);
  if (ix < 0 || iy < 0 || ix >= NX || iy >= NY) { clipped++; continue; }
  cells[iy * NX + ix]++; counted++;
}
if (counted + clipped !== nHours) die('the cells hold ' + (counted + clipped) + ' hours, the record ' + nHours);
if (clipped) die(clipped + ' hours fall outside the drawn window');
const CLASS = [[1, 9], [10, 99], [100, 499], [500, 1999], [2000, Infinity]];
const classOf = (n) => CLASS.findIndex(([a, b]) => n >= a && n <= b);
const maxCell = Math.max(...cells);
if (maxCell < CLASS[4][0]) die('no cell reaches the top class; re-cut the classes');
const perClass = CLASS.map(() => 0); for (const n of cells) if (n) perClass[classOf(n)]++;

/* ================================================================ drawing ===== */
function sheet(mode) {
  const C = (name) => (mode === 'mono' ? PR.mono(PR.hex(name)) : PR.hex(name));
  const SANS = "'Inter','Helvetica Neue',Arial,sans-serif", MONO = "'JetBrains Mono','SF Mono',Menlo,monospace";
  const out = [];
  const put = (s) => out.push(s);
  const num = (v) => +Number(v).toFixed(2);
  const text = (x, y, s, o = {}) => put('<text x="' + num(x) + '" y="' + num(y) + '" font-family="' + (o.mono ? MONO : SANS) + '" font-size="' + (o.size || 7) + '"'
    + ' fill="' + C(o.fill || '--ink') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + (o.italic ? ' font-style="italic"' : '')
    + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.track ? ' letter-spacing="' + o.track + '"' : '') + '>' + (o.raw ? s : esc(s)) + '</text>');
  const tspan = (s, o = {}) => '<tspan' + (o.fill ? ' fill="' + C(o.fill) + '"' : '') + (o.italic ? ' font-style="italic"' : '') + (o.weight ? ' font-weight="' + o.weight + '"' : '') + (o.mono ? ' font-family="' + MONO + '"' : '') + '>' + esc(s) + '</tspan>';
  const line = (x1, y1, x2, y2, o = {}) => put('<line x1="' + num(x1) + '" y1="' + num(y1) + '" x2="' + num(x2) + '" y2="' + num(y2) + '" stroke="' + C(o.tok || '--ink') + '" stroke-width="' + (o.w || PR.LINE_PT) + '"'
    + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + (o.cap ? ' stroke-linecap="' + o.cap + '"' : '') + '/>');
  const poly = (pts, o = {}) => put('<path d="' + pts.map((p, i) => (i ? 'L' : 'M') + num(p[0]) + ' ' + num(p[1])).join('') + (o.close ? 'Z' : '') + '" fill="none" stroke="' + C(o.tok || '--ink') + '" stroke-width="' + (o.w || PR.LINE_PT) + '"'
    + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + (o.cap ? ' stroke-linecap="' + o.cap + '"' : '') + ' stroke-linejoin="round"/>');
  const ST = Object.fromEntries(PR.STANDINGS.map((s) => [s.standing, s]));
  /* a stroke of a standing; identity (a series colour) replaces the standing's tone, never its dash */
  const sline = (x1, y1, x2, y2, standing, o = {}) => { const s = ST[standing], w = o.w || PR.LINE_PT; line(x1, y1, x2, y2, { tok: o.tok || s.token, w, dash: s.dash(w), cap: s.cap }); };
  const spoly = (pts, standing, o = {}) => { const s = ST[standing], w = o.w || PR.LINE_PT; if (o.casing) poly(pts, { tok: '--paper', w: w + 2, close: o.close }); poly(pts, { tok: o.tok || s.token, w, dash: s.dash(w), cap: s.cap, close: o.close }); };
  const MONO_W = 0.6;   /* JetBrains Mono's advance, em */
  /* a value in text with its standing on it: the same patterns as the lines, drawn as the underline */
  const value = (x, y, s, standing, o = {}) => {
    const size = o.size || 7, wpt = s.length * MONO_W * size, uw = 0.6;
    if (standing === 'REFUSED') { text(x, y, '∅ ' + s, { mono: true, size, fill: '--ink-3' }); return; }
    text(x, y, s, { mono: true, size, fill: standing === 'DECIDED' ? '--ink' : '--ink-2' });
    if (standing === 'COMPUTED') line(x, y + 1.8, x + wpt, y + 1.8, { tok: '--ink-3', w: uw, dash: G.claim(uw) });
    if (standing === 'CHOSEN') line(x + 0.3, y + 1.8, x + wpt, y + 1.8, { tok: '--ink-3', w: uw, dash: G.pick(uw), cap: 'round' });
  };
  const label = (x, y, s) => text(x, y, s.toUpperCase(), { mono: true, size: 6, fill: '--ink-3', track: 0.6, weight: 500 });
  const marker = (x, y, kind, o = {}) => {
    const r = o.r || 2.6, tok = o.tok || '--ink', fill = o.hollow ? C('--paper') : C(tok), sw = o.hollow ? 1 : 0.6;
    const st = ' fill="' + fill + '" stroke="' + C(tok) + '" stroke-width="' + sw + '"';
    if (kind === 'o') put('<circle cx="' + num(x) + '" cy="' + num(y) + '" r="' + num(r) + '"' + st + '/>');
    else if (kind === 's') put('<rect x="' + num(x - r * 0.9) + '" y="' + num(y - r * 0.9) + '" width="' + num(r * 1.8) + '" height="' + num(r * 1.8) + '"' + st + '/>');
    else if (kind === '^') put('<path d="M' + num(x) + ' ' + num(y - r * 1.1) + 'L' + num(x + r) + ' ' + num(y + r * 0.75) + 'L' + num(x - r) + ' ' + num(y + r * 0.75) + 'Z"' + st + '/>');
  };
  const HATCH = 'hatch-' + mode;
  const voidRect = (x, y, w, h) => put('<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '" fill="url(#' + HATCH + ')" stroke="' + C('--guide') + '" stroke-width="0.6"/>');
  const witness = (x, y, size = 9) => text(x, y, '×', { size, fill: '--witness', weight: 700 });
  const grade = (x, y, g) => { const tok = g === 0 ? '--ink-3' : '--ink';
    for (let k = 0; k < 3; k++) { const on = k < g; put('<rect x="' + num(x + k * 3.4) + '" y="' + num(y - 2 - 2 * k) + '" width="2.2" height="' + num(2 + 2 * k) + '" fill="' + (on ? C(tok) : 'none') + '" stroke="' + C(tok) + '" stroke-width="0.5"/>'); }
    text(x + 12, y, W.GRADE[g].toUpperCase(), { mono: true, size: 5.6, fill: tok, track: 0.4 }); };

  const PW = 595.28, PH = 841.89, M = 34;
  put('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + PW + ' ' + PH + '" width="210mm" height="297mm" role="img" aria-label="WARRANT print register specimen, ' + (mode === 'mono' ? 'greyscale' : 'colour') + '">');
  put('<defs><pattern id="' + HATCH + '" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3.2" stroke="' + C('--guide') + '" stroke-width="0.6"/></pattern></defs>');
  put('<rect x="0" y="0" width="' + PW + '" height="' + PH + '" fill="' + C('--paper') + '"/>');

  /* ---- header ---- */
  text(M, 50, 'WARRANT on paper: the print register', { size: 14, weight: 600 });
  text(PW - M, 50, mode === 'mono' ? 'GREYSCALE SHEET · AS A MONO LASER PRINTS IT (CIE Y)' : 'COLOUR SHEET', { mono: true, size: 6, fill: '--ink-3', anchor: 'end', track: 0.6 });
  text(M, 63, 'A specimen for the operator’s judgement. A proposal: nothing on this sheet is approved, served or applied. Every number is read from a record named below it.', { size: 7, fill: '--ink-3' });
  line(M, 71, PW - M, 71, { tok: '--grid', w: 0.5 });

  /* ---- 1 · the four standings: a line, and the same standing on a value in text ---- */
  label(M, 86, '1 · the four standings: a line, and a value in text');
  const LG = Object.fromEntries(W.LEGEND.map((L) => [W.NAME[L.s], L]));
  const rowsS = [
    ['DECIDED', levels['expweibull/daily'].txt + ' m', 'certified 100-year Hs, daily, exp. Weibull'],
    ['COMPUTED', delta.daily.txt[0] + '–' + delta.daily.txt[1] + ' m', 'its delta-method 95% interval: float'],
    ['CHOSEN', roundDec(CON[2].polygon.closingEdgeLength, 2) + ' m', 'the edge a test adds to close an open file'],
    ['REFUSED', 'annual', 'no certified exp. Weibull: choice refused'],
  ];
  rowsS.forEach(([st, v, ex], i) => {
    const y = 101 + i * 22;
    if (st === 'REFUSED') voidRect(M, y - 6, 40, 9); else sline(M, y - 1.5, M + 40, y - 1.5, st);
    text(M + 48, y - 2, LG[st].label.toUpperCase(), { mono: true, size: 6.2, weight: 600, track: 0.5 });
    text(M + 48, y + 6, LG[st].gloss, { size: 5.6, fill: '--ink-3' });
    value(M + 214, y - 2, v, st, { size: 7 });
    text(M + 214, y + 6, ex, { size: 5.2, fill: '--ink-3' });
  });

  /* ---- 2 · the void, the witness, the guide, the mood ---- */
  const X2 = 374, XT = X2 + 32;
  label(X2, 86, '2 · the void, the witness ×, the guide, the mood');
  voidRect(X2, 94, 24, 11);
  text(XT, 99, '∅ and words, never a zero or a gap.', { size: 6.2 });
  text(XT, 106, 'Buoy A, annual maxima: ' + annualWhy.split(' — ')[0].replace('expweibull', 'exp. Weibull') + '.', { size: 5.2, fill: '--ink-3' });
  witness(X2 + 8, 124, 11);
  put('<text x="' + XT + '" y="118" font-family="' + SANS + '" font-size="6.2" fill="' + C('--ink') + '">GSM8K test item ' + gw.i + ' prints ' + tspan('“' + gw.witness.lhs + ' = ' + gw.witness.rhs + '”', { mono: true }) + ';</text>');
  put('<text x="' + XT + '" y="125.5" font-family="' + SANS + '" font-size="6.2" fill="' + C('--ink') + '">exactly, it is ' + tspan(gw.witness.exact, { mono: true }) + '. The one red, only on the × beside words.</text>');
  text(XT, 132, 'certs/gsm8k-ledger.json: a counterexample shown, not deduced.', { size: 5.2, fill: '--ink-3' });
  line(X2, 143, X2 + 24, 143, { tok: '--guide', w: 1, dash: G.GUIDE });
  text(XT, 145, 'The guide, ' + G.GUIDE + ': a ruler, a ghost, a leader. It says nothing.', { size: 6.2 });
  text(X2, 162, 'given', { size: 6.2, italic: true, fill: '--ink-3' });
  put('<text x="' + XT + '" y="158" font-family="' + SANS + '" font-size="6.2" fill="' + C('--ink') + '">The monthly pick is lognormal ' + tspan('given A²', { italic: true }) + ': a verdict that holds</text>');
  text(XT, 165.5, 'given a chosen input names it, in italic. At that block KS picks', { size: 6.2 });
  text(XT, 173, 'exp. Weibull; A², χ² and MSE pick lognormal (certs/hseva-ledger.json).', { size: 5.2, fill: '--ink-3' });

  /* ---- 3 · the register ---- */
  label(M, 196, '3 · the register: value, contrast on white, role');
  const CH = require(path.join(ROOT, 'design', 'colour.js'));
  const chips = [['--ink', 'decided · text · ●'], ['--ink-2', 'chosen · text'], ['--ink-3', 'computed · text · ▲'], ['--guide', 'guide · the void'],
    ['--grid', 'hairline grid'], ['--witness', 'the × only'], ['--id-2', '■ · PROPOSED']];
  chips.forEach(([n, role], i) => {
    const x = M + i * 75.3, y = 203, t = PR.BY[n];
    put('<rect x="' + num(x) + '" y="' + y + '" width="18" height="14" fill="' + C(n) + '"' + (n === '--grid' ? ' stroke="' + C('--guide') + '" stroke-width="0.4"' : '') + '/>');
    text(x + 22, y + 5.5, n.replace(/^--/, ''), { mono: true, size: 6, weight: 600 });
    text(x + 22, y + 12.5, t.hex, { mono: true, size: 5.2, fill: '--ink-3' });
    text(x, y + 22, CH.contrast(t.hex, PR.hex('--paper')).toFixed(2) + ':1 · ' + role, { size: 5.2, fill: '--ink-3' });
  });
  PR.RAMP.forEach((n, i) => {
    const x = M + i * 38, y = 236;
    put('<rect x="' + x + '" y="' + y + '" width="34" height="12" fill="' + C(n) + '"/>');
    text(x, y + 19, PR.BY[n].hex, { mono: true, size: 5.2, fill: '--ink-3' });
  });
  text(M + 200, 241, 'The order ramp: neutral, darker with magnitude, every step ΔL ≥ ' + VR.floors.rampStep + '; black text reads on every step.', { size: 6.2 });
  text(M + 200, 249, 'Identity, at most three series: ● ink, ■ the print blue (proposed), ▲ ink-3, each with its own marker.', { size: 6.2 });
  text(M + 200, 257, 'Validator: design/print/REPORT.md, ' + VR.verdict + ': ' + VR.checks.filter((c) => c.pass).length + ' of ' + VR.checks.length + ' checks, ' + VR.redControls.filter((r) => r.refused).length + ' of ' + VR.redControls.length + ' red controls refused; every pair under protan, deutan, tritan.', { size: 5.2, fill: '--ink-3' });
  line(M, 274, PW - M, 274, { tok: '--grid', w: 0.5 });

  /* ================= 4 · figure A: the design wave ================= */
  label(M, 288, '4 · a design-wave figure, redrawn: buoy A, the certified 100-year wave by block');
  const ax = { x0: M + 30, x1: 340, y0: 300, y1: 470, v0: 8, v1: 22 };
  const Y = (v) => ax.y1 - (v - ax.v0) / (ax.v1 - ax.v0) * (ax.y1 - ax.y0);
  const pad = 12, slot = (ax.x1 - ax.x0 - pad) / BLOCKS.length, Xc = (i) => ax.x0 + pad + slot * (i + 0.5);   /* a pad, so the first label clears the axis */
  for (const v of [8, 12, 16, 20]) { line(ax.x0, Y(v), ax.x1, Y(v), { tok: '--grid', w: 0.4 }); text(ax.x0 - 4, Y(v) + 2.2, v + ' m', { mono: true, size: 5.8, fill: '--ink-3', anchor: 'end' }); }
  line(ax.x0, ax.y1, ax.x1, ax.y1, { tok: '--ink-3', w: 0.6 });
  line(ax.x0, ax.y0, ax.x0, ax.y1, { tok: '--ink-3', w: 0.6 });
  /* the annual slot: the choice is refused, so the void, and words */
  const ai = BLOCKS.indexOf('annual');
  voidRect(ax.x0 + pad + slot * ai + 3, ax.y0, slot - 6, ax.y1 - ax.y0 - 0.5);
  put('<rect x="' + num(Xc(ai) - 25) + '" y="' + num(Y(20.6) - 7) + '" width="50" height="17" fill="' + C('--paper') + '"/>');
  text(Xc(ai), Y(20.6), '∅ choice refused', { size: 5.8, anchor: 'middle', weight: 600 });
  text(Xc(ai), Y(20.6) + 7, 'no certified exp. Weibull', { size: 5.2, anchor: 'middle', fill: '--ink-3' });
  /* the largest hour on the record: a datum, solid */
  sline(ax.x0, Y(Number(maxHour)), ax.x0 + pad + slot * ai, Y(Number(maxHour)), 'DECIDED', { tok: '--ink-3', w: 0.8 });
  text(ax.x0 + 3, Y(Number(maxHour)) + 6.5, 'largest hour on record ' + roundDec(maxHour, 2) + ' m', { size: 5.4, fill: '--ink-3' });
  /* the families: identity by colour + marker; the pick at each block filled, the other hollow; the pick's delta
     interval dashed (computed) */
  const ID = { expweibull: PR.IDENTITY[0], lognormal: PR.IDENTITY[1] };
  const off = { expweibull: -6, lognormal: 6 };
  BLOCKS.forEach((b, i) => {
    text(Xc(i), ax.y1 + 9, BLK[b], { size: 6.2, anchor: 'middle' });
    const best = A.blocks[b].rankings.ad.verdict === 'DECIDED' ? A.blocks[b].rankings.ad.best : null;
    for (const f of picked) {
      const lv = levels[f + '/' + b]; if (!lv) continue;
      const x = Xc(i) + off[f], tok = ID[f].token;
      if (best === f) { const d = delta[b]; sline(x, Y(d[0]), x, Y(d[1]), 'COMPUTED', { tok }); }
      marker(x, Y(Number(lv.hi)), ID[f].marker, { tok, hollow: best !== f, r: best === f ? 3 : 2.4 });
      if (best === f) text(x + (f === 'lognormal' ? 5 : -5), Y(Number(lv.hi)) + 2, lv.txt, { mono: true, size: 5.8, anchor: f === 'lognormal' ? 'start' : 'end', fill: tok });
    }
  });
  put('<text transform="translate(' + (ax.x0 - 22) + ' ' + ((ax.y0 + ax.y1) / 2) + ') rotate(-90)" text-anchor="middle" font-family="' + SANS + '" font-size="6.2" fill="' + C('--ink-3') + '">100-year significant wave height</text>');
  /* the panel: legend, then what it rests on */
  const PX = 356;
  label(PX, 304, 'legend');
  marker(PX + 4, 314, 'o', { tok: '--ink', r: 3 }); text(PX + 14, 316, 'exp. Weibull, the block’s A² pick', { size: 6.2 });
  marker(PX + 4, 324, 's', { tok: ID.lognormal.token, r: 3 }); text(PX + 14, 326, 'lognormal, the block’s A² pick', { size: 6.2 });
  marker(PX + 1, 334, 'o', { tok: '--ink', hollow: true }); marker(PX + 8, 334, 's', { tok: ID.lognormal.token, hollow: true }); text(PX + 14, 336, 'hollow: the same family where A² picks the other', { size: 6.2 });
  text(PX + 14, 343, 'every marker decided: an enclosure narrower than the dot', { size: 5.4, fill: '--ink-3' });
  sline(PX, 351, PX + 10, 351, 'COMPUTED'); text(PX + 14, 353, 'the pick’s delta-method 95% interval: computed', { size: 6.2 });
  sline(PX, 361, PX + 10, 361, 'DECIDED', { tok: '--ink-3', w: 0.8 }); text(PX + 14, 363, 'a datum read from the record: decided', { size: 6.2 });
  voidRect(PX, 367, 10, 7); text(PX + 14, 373, '∅ refused: no mark, the void and words', { size: 6.2 });
  label(PX, 388, 'what a level rests on');
  const prem = [
    ['The record', 'NDBC hourly Hs, ' + fmt(nHours) + ' hours over ' + years + ' years, pinned by sha256'],
    ['Independence', 'hours and block maxima as independent draws from one law'],
    ['The estimator', 'maximum likelihood, no added location: a choice'],
    ['The family', 'picked by A² on the same sample; its tail is not tested'],
    ['The return period', 'the record’s climate held, unchanged, for 100 years'],
  ];
  prem.forEach(([k, ev], i) => { const y = 399 + i * 12.5; grade(PX, y, W.ASSUMED); text(PX + 52, y, k, { size: 6.2, weight: 600 }); text(PX + 52, y + 5.6, ev, { size: 5.2, fill: '--ink-3' }); });
  text(PX, 466, 'The arithmetic is exact; the weakest premise is ' + W.GRADE[W.weakest(...prem.map(() => W.ASSUMED))] + ', and so is every one.', { size: 5.8, fill: '--ink-2' });
  text(PX, 473, 'Grades from /reports/hseva.html §3 (WARRANT v2.1); none was checked against the sea.', { size: 5.2, fill: '--ink-3' });
  /* caption */
  const capA = 'Buoy A (NDBC, the benchmark’s dataset A): the certified 100-year significant wave height of the two families Anderson–Darling picks somewhere on this buoy, by the block the maxima are taken over. The block alone moves the picked level from '
    + agg.lo + ' m (' + BLK[agg.loBlock] + ', ' + FAMW[agg.loFamily] + ') to ' + agg.hi + ' m (' + BLK[agg.hiBlock] + ', ' + FAMW[agg.hiFamily] + '), a factor of ' + Number(agg.factor).toFixed(2) + '.';
  wrap(capA, M, 496, 527, 6.2, '--ink-2');
  text(M, 520, 'Source: certs/hseva-ledger.json (generated ' + H.generated + '): fits, return levels, rankings, delta intervals, the aggregation finding.', { size: 5.4, fill: '--ink-3' });
  line(M, 530, PW - M, 530, { tok: '--grid', w: 0.5 });

  /* ================= 5 · figure B: environmental contours ================= */
  label(M, 544, '5 · an environmental-contour figure, redrawn: dataset A, three 20-year contours over the hours');
  const bx = { x0: M + 30, x1: 340, y0: 556, y1: 744, u1: X1, h1: Y1 };
  const BX = (u) => bx.x0 + u / bx.u1 * (bx.x1 - bx.x0), BY = (h) => bx.y1 - h / bx.h1 * (bx.y1 - bx.y0);
  /* the field: one path per class, cells merged into runs along each row */
  const cw = (bx.x1 - bx.x0) / NX, chh = (bx.y1 - bx.y0) / NY;
  for (let k = 0; k < CLASS.length; k++) {
    let d = '';
    for (let iy = 0; iy < NY; iy++) {
      let ix = 0;
      while (ix < NX) {
        const n = cells[iy * NX + ix];
        if (!n || classOf(n) !== k) { ix++; continue; }
        let jx = ix; while (jx + 1 < NX && cells[iy * NX + jx + 1] && classOf(cells[iy * NX + jx + 1]) === k) jx++;
        d += 'M' + num(bx.x0 + ix * cw) + ' ' + num(bx.y1 - (iy + 1) * chh) + 'h' + num((jx - ix + 1) * cw) + 'v' + num(chh) + 'h' + num(-(jx - ix + 1) * cw) + 'Z';
        ix = jx + 1;
      }
    }
    if (d) put('<path d="' + d + '" fill="' + C(PR.RAMP[k]) + '"/>');
  }
  for (let u = 0; u <= 20; u += 4) text(BX(u), bx.y1 + 8, String(u), { mono: true, size: 5.8, fill: '--ink-3', anchor: 'middle' });
  for (let h = 0; h <= 12; h += 3) text(bx.x0 - 4, BY(h) + 2.2, h + ' m', { mono: true, size: 5.8, fill: '--ink-3', anchor: 'end' });
  line(bx.x0, bx.y1, bx.x1, bx.y1, { tok: '--ink-3', w: 0.6 });
  line(bx.x0, bx.y0, bx.x0, bx.y1, { tok: '--ink-3', w: 0.6 });
  text((bx.x0 + bx.x1) / 2, bx.y1 + 16, 'zero-up-crossing period Tz, s', { size: 6.2, anchor: 'middle', fill: '--ink-3' });
  put('<text transform="translate(' + (bx.x0 - 22) + ' ' + ((bx.y0 + bx.y1) / 2) + ') rotate(-90)" text-anchor="middle" font-family="' + SANS + '" font-size="6.2" fill="' + C('--ink-3') + '">significant wave height Hs</text>');
  /* the contours: the file's vertices in its order, decided, on a paper casing (the field is under them); the open
     file's closing edge, which the test adds, chosen and dotted */
  const idOf = [PR.IDENTITY[0], PR.IDENTITY[1], PR.IDENTITY[2]];
  const polys = CON.map((r) => {
    const K = Lb.readContour(r.file);
    if (K.sha256 !== r.sha256) die('contour ' + r.file + ' does not match its pin');
    return K.pts.map((p) => [BX(p.u.v), BY(p.h.v)]);
  });
  /* pass 1: every contour's listed edges, each on its casing */
  CON.forEach((r, i) => spoly(polys[i], 'DECIDED', { tok: idOf[i].token, casing: true, close: false }));
  /* pass 2: the open file's closing edge, and a leader to the words that name it (on paper, so no line crosses them) */
  CON.forEach((r, i) => {
    if (r.polygon.closed) return;
    const P = polys[i], a = P[P.length - 1], b = P[0];
    spoly([a, b], 'CHOSEN', { tok: idOf[i].token });
    const tx = BX(20) - 2, ty = BY(5.2);
    line(BX(18.6), ty + 12, (a[0] + b[0]) / 2 + 0.5, (a[1] + b[1]) / 2 - 2.5, { tok: '--guide', w: 0.6, dash: G.GUIDE });
    put('<rect x="' + num(tx - 78) + '" y="' + num(ty - 7) + '" width="79" height="20" fill="' + C('--paper') + '"/>');
    text(tx, ty - 1, 'file ' + r.contribution + ' never closes: the test', { size: 5.4, fill: '--ink-2', anchor: 'end' });
    text(tx, ty + 5.5, 'adds the last edge (chosen),', { size: 5.4, fill: '--ink-2', anchor: 'end' });
    text(tx, ty + 12, roundDec(r.polygon.closingEdgeLength, 2) + ' m long, dotted', { size: 5.4, fill: '--ink-2', anchor: 'end' });
  });
  /* pass 3: the marker on each contour's highest vertex (the ledger's maxHs and its Tz), so greyscale keeps the identity */
  CON.forEach((r, i) => {
    const x = BX(Number(r.polygon.atMaxHs.u)), y = BY(Number(r.polygon.maxHs)), tok = idOf[i].token;
    marker(x, y, idOf[i].marker, { tok, r: 2.8 });
    const left = r.contribution === '6';   /* 3's line runs down-left past 6's vertex: 6 is named on its other side */
    text(x + (left ? -4.5 : 5), y - 3.5, r.contribution, { mono: true, size: 6.2, weight: 600, fill: tok, anchor: left ? 'end' : null });
  });
  /* the largest hour: a datum, a ring */
  put('<circle cx="' + num(BX(Number(dsA.maxHs.full.u))) + '" cy="' + num(BY(Number(dsA.maxHs.full.hs))) + '" r="2.4" fill="none" stroke="' + C('--ink') + '" stroke-width="0.8"/>');
  text(BX(Number(dsA.maxHs.full.u)) + 5, BY(Number(dsA.maxHs.full.hs)) + 2, 'largest hour ' + roundDec(dsA.maxHs.full.hs, 2) + ' m at ' + roundDec(dsA.maxHs.full.u, 2) + ' s, ' + dsA.maxHs.full.t.slice(0, 10), { size: 5.4, fill: '--ink-2' });
  /* the panel */
  label(PX, 560, 'legend: hours outside, exact; printed');
  const methodOf = { '1': 'ISORM', '6': 'IFORM', '3': 'IDSCM' };
  CON.forEach((r, i) => {
    const y = 572 + i * 19, tok = idOf[i].token;
    sline(PX, y - 2, PX + 12, y - 2, 'DECIDED', { tok }); marker(PX + 6, y - 2, idOf[i].marker, { tok, r: 2.4 });
    text(PX + 17, y, r.contribution + ' · ' + methodOf[r.contribution] + ' (' + r.authors.replace(/, /g, ' & ') + ')', { size: 6.2, weight: 600 });
    text(PX + 17, y + 7.5, r.class + ' class:', { size: 5.6, fill: '--ink-3' });
    value(PX + 64, y + 7.5, fmt(r.counts.full.out), 'DECIDED', { size: 6.2 });
    text(PX + 64 + fmt(r.counts.full.out).length * 0.6 * 6.2 + 4, y + 7.5, 'outside · printed', { size: 5.6, fill: '--ink-3' });
    value(PX + 64 + fmt(r.counts.full.out).length * 0.6 * 6.2 + 52, y + 7.5, String(cmp(r).printed), 'COMPUTED', { size: 6.2 });
  });
  text(PX, 631, 'expected outside by construction: ' + exp20.total.exact + ' (total class, exact) · ' + expIform + ' (IFORM, enclosed)', { size: 5.4, fill: '--ink-3' });
  sline(PX, 640, PX + 12, 640, 'CHOSEN', { tok: '--ink-3' }); text(PX + 17, 642, 'an edge the file never listed: chosen', { size: 6.2 });
  PR.RAMP.forEach((n, k) => { put('<rect x="' + num(PX + k * 16) + '" y="648" width="15" height="8" fill="' + C(n) + '"/>'); });
  text(PX + 84, 654, 'hours per cell: ' + CLASS.map(([a, b]) => (b === Infinity ? '≥ ' + fmt(a) : fmt(a) + '–' + fmt(b))).join(', '), { size: 5.2, fill: '--ink-2' });
  text(PX, 663, 'exact counts in chosen 0.25 s × 0.2 m cells: a drawing; ' + fmt(perClass[4]) + ' cells reach the top class', { size: 5.2, fill: '--ink-3' });
  label(PX, 678, 'what it rests on');
  const rest = [
    'the hours: NDBC’s, ' + fmt(dsA.provided) + ' provided + ' + fmt(dsA.retained) + ' retained, pinned by sha256',
    'the contours: each file’s literal vertices, pinned at the benchmark’s commit ' + E.corpus.commit.slice(0, 8),
    'the test: even-odd on the closed path (matplotlib’s convention), decided exactly;',
    '   the winding rule agrees on every hour (' + E.summary.rulesDisagreeTotal + ' disagreements)',
    'no × here: nobody claimed a count these files miss; a printed count that',
    '   differs would be a scalar that differs, not a witness (/instruments/contours)',
  ];
  rest.forEach((s, i) => text(PX, 688 + i * 7.6, s, { size: 5.4, fill: i >= 4 ? '--ink-3' : '--ink-2' }));
  const capB = 'Dataset A of the environmental-contour benchmark (Haselsteiner et al. 2021), ' + fmt(nHours) + ' hours: three of the submitted 20-year contours drawn as their files list them, over the hours they were scored on. The printed counts (the organizers’ float64 test: computed) reproduce exactly for all three.';
  wrap(capB, M, 770, 527, 6.2, '--ink-2');
  text(M, 794, 'Source: certs/ecbench-ledger.json (generated ' + E.generated + '); corpus/ec-benchmark datasets/A.txt + datasets-retained/Ar.txt and the three contour files, each checked against its sha256 pin here.', { size: 5.4, fill: '--ink-3' });
  line(M, 804, PW - M, 804, { tok: '--grid', w: 0.5 });
  text(M, 815, 'design/print/specimen.js · the register: design/print/tokens.js · the validator: design/print/REPORT.md · the stroke patterns: design/grammar.js, unchanged · MIT', { mono: true, size: 5, fill: '--ink-3' });
  text(M, 823, 'Checked by design/print/check-svg.js before printing: only the five permitted dashes, only the register’s colours' + (mode === 'mono' ? ' (here, their greys)' : '') + '.', { mono: true, size: 5, fill: '--ink-3' });
  put('</svg>');
  return out.join('\n');

  /* a caption wrapped at a measure, by character count (the sans has no metrics here: 0.5 em a character is
     conservative for Inter at this size) */
  function wrap(s, x, y, width, size, fill) {
    const per = Math.floor(width / (size * 0.5)), words = s.split(' '), lines = [];
    let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > per) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
    if (cur.trim()) lines.push(cur.trim());
    lines.forEach((l, i) => text(x, y + i * (size + 2), l, { size, fill }));
  }
}

/* ================================================================ out ========= */
async function main() {
  const noPdf = process.argv.includes('--no-pdf');
  const files = { colour: path.join(__dirname, 'specimen.svg'), mono: path.join(__dirname, 'specimen-grey.svg') };
  let bad = 0;
  for (const [mode, f] of Object.entries(files)) {
    const svg = sheet(mode);
    const r = CHK.check(svg, { mode, file: path.basename(f) });
    if (!r.ok) { bad++; console.log('FAIL  ' + path.basename(f)); r.violations.slice(0, 10).forEach((v) => console.log('        ' + v)); continue; }
    fs.writeFileSync(f, svg + '\n');
    console.log('PASS  ' + path.basename(f) + ' (' + mode + ')   [dashes ' + Object.entries(r.dashes).map(([p, n]) => '"' + p + '"×' + n).join(' ') + ' · ' + Object.keys(r.colours).length + ' colours, all in the register]');
  }
  if (bad) die(bad + ' sheet(s) refused by check-svg; nothing printed');
  if (noPdf) return;
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  for (const [mode, f] of Object.entries(files)) {
    const svg = fs.readFileSync(f, 'utf8');
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>WARRANT print register specimen</title>'
      + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap">'
      + '<style>@page{size:210mm 297mm;margin:0}html,body{margin:0;padding:0;background:' + PR.hex('--paper') + '}svg{display:block;width:210mm;height:297mm}</style></head><body>' + svg + '</body></html>';
    const tmp = path.join(os.tmpdir(), 'print-specimen-' + process.pid + '-' + mode + '.html');
    fs.writeFileSync(tmp, html);
    const out = f.replace(/\.svg$/, '.pdf');
    try {
      await withChrome(async (send) => {
        await send('Page.enable');
        await send('Page.navigate', { url: 'file://' + tmp });
        await settle(3000);                                             /* real wait: the fonts */
        const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false,
          marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paperWidth: 8.2677, paperHeight: 11.6929 });
        fs.writeFileSync(out, Buffer.from(pdf.data, 'base64'));
      });
    } finally { fs.unlinkSync(tmp); }
    console.log('PDF   ' + path.relative(ROOT, out) + '  ' + fs.statSync(out).size + ' bytes');
  }
}
main().catch((e) => die(e.stack || e.message));
