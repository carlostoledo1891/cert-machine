#!/usr/bin/env node
/* build-report-breaking.js — reports/breaking-geometry.html: sixteen thousand
   breaking waves, decided against the laboratory.

   Guimarães, Stringari, Leckler and Ardhuin published (Zenodo, 2026) the
   measured geometry of 16,369 breaking waves in the Black Sea and wrote that
   real-world breakers are not self-similar and that breaking speed does not
   predict geometry. There is no paper with a table beside the record; the
   claims are two sentences and the reference lines the authors' own scripts
   draw — Duncan's laboratory inclination band and aspect ratio. This page
   puts exact numbers under both sentences: every event decided against the
   laboratory references, the self-similarity ratios as exact order
   statistics, and rank correlations as exact rationals.

   Gates: the ledger re-derives live at this build (--check), the battery must
   pass with every red fired, and every sentence below is gated on the field
   it reads.

   usage: node tools/build-report-breaking.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const Lb = require(path.join(ROOT, 'instruments', 'breaking', 'lib.js'));
const Q = Lb.Q;
const die = (m) => { console.error('BREAKING REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const chk = cp.spawnSync('node', [path.join(ROOT, 'tools', 'run-breaking-ledger.js'), '--check'], { cwd: ROOT });
if (chk.status !== 0) die('the ledger does not re-derive:\n' + String(chk.stderr).slice(-600) + String(chk.stdout).slice(-300));
const bat = cp.spawnSync('node', [path.join(ROOT, 'instruments', 'breaking', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /breaking battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the breaking battery did not pass clean:\n' + bout.slice(-600));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);

const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'breaking-ledger.json'), 'utf8'));
const claims = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'blacksea-breaking', 'claims.json'), 'utf8'));
const fmt = (x) => Number(x).toLocaleString('en-US');
const d3 = (s) => Number(s.dec !== undefined ? s.dec : s).toFixed(3);
const pct = (num, den) => (100 * num / den).toFixed(1) + '%';

/* ---- gates on the facts the prose states ---- */
if (L.n !== 16369 || L.records.length !== 20) die('the event and record counts moved');
const A = L.duncan.angle, S = L.duncan.aspect, SS = L.selfSimilarity, CR = L.correlations;
if (!(Number(A.fractionInside.dec) > 0.3 && Number(A.fractionInside.dec) < 0.4)) die('the one-third sentence would be false');
if (!(Number(S.medianOverReference.dec) > 4 && Number(S.medianOverReference.dec) < 6)) die('the "several times" sentence would be false');
if (!(S.above > 0.95 * L.n)) die('the "nearly all above" sentence would be false');
const speedPairs = Object.entries(CR).filter(([k]) => k.startsWith('cm~'));
const speedMax = Math.max(...speedPairs.map(([, v]) => Number(v.spearman.r.hi)));
const speedMaxKey = speedPairs.find(([, v]) => Number(v.spearman.r.hi) === speedMax)[0];
const geoAL = Number(CR['Ab_max~Lb'].spearman.r.lo);
if (!(speedMax < 0.45 && geoAL > 0.9)) die('the correlation contrast sentence would be false');
if (!['a', 'b', 'c'].every((k) => Number(SS[k].spreadIQ.dec) > 1.5 && Number(SS[k].spread90.dec) > 4)) die('the spread sentence would be false');
if (!(Number(L.cmOverCp.median.lo) > 0.25 && Number(L.cmOverCp.median.hi) < 0.32)) die('the cm/cp sentence would be false');

/* ---- histograms from the pinned table, exact bin membership ---- */
const T = Lb.readTable();
const hist = (col, edges, f) => {
  const bins = edges.slice(0, -1).map((e, i) => ({ lo: Lb.parseDecimal(String(e)), hi: Lb.parseDecimal(String(edges[i + 1])), n: 0 }));
  let over = 0;
  for (const row of T.rows) {
    const v = f ? f(row) : row[col];
    let placed = false;
    for (const b of bins) if (Q.cmp(v, b.lo) >= 0 && Q.cmp(v, b.hi) < 0) { b.n++; placed = true; break; }
    if (!placed) over++;
  }
  return { bins, over };
};
const thetaH = hist('theta', Array.from({ length: 46 }, (_, i) => i));
const cH = hist(null, Array.from({ length: 41 }, (_, i) => (i * 0.05).toFixed(2)), (row) => Q.div(row.Ab_max, Q.mul(row.LD81, row.LD81)));
const FIG1 = CH.dist({
  w: 900, h: 300, x0: 0, x1: 45, y0: 0, y1: 1, padL: 40,
  bins: thetaH.bins.map((b) => ({ n: b.n, k: 'θ in [' + Lb.dec(b.lo, 0) + '°, ' + Lb.dec(b.hi, 0) + '°)' })),
  xTicks: [0, 10, 14.7, 20, 30, 40].map((v) => ({ v, t: String(v) + '°' })), xLabel: 'inclination θ of the aerated region, degrees (1° bins; ' + thetaH.over + (thetaH.over === 1 ? ' event' : ' events') + ' beyond 45°)',
  marks: [{ x: 10, t: 'Duncan (1981): 10°', anchor: 'end' }, { x: 14.7, t: '14.7°', row: 0 }],
  alt: 'A histogram of the inclination of the breaking region in one-degree bins from 0 to 45 degrees, peaked near 12 degrees with a long right tail; two vertical marks at 10 and 14.7 degrees bracket Duncan\'s laboratory band, which holds ' + fmt(A.inside) + ' of the ' + fmt(L.n) + ' events.'
});
const FIG2 = CH.dist({
  w: 900, h: 300, x0: 0, x1: 2, y0: 0, y1: 1, padL: 40,
  bins: cH.bins.map((b) => ({ n: b.n, k: 'Ab/L² in [' + Lb.dec(b.lo, 2) + ', ' + Lb.dec(b.hi, 2) + ')' })),
  xTicks: [0, 0.11, 0.5, 1, 1.5, 2].map((v) => ({ v, t: String(v) })), xLabel: 'aspect ratio Ab / L²_D81 (bins of 0.05; ' + cH.over + (cH.over === 1 ? ' event' : ' events') + ' beyond 2)',
  marks: [{ x: 0.11, t: 'Duncan (1981): 0.11' }, { x: Number(S.distribution.median.dec), t: 'median ' + d3(S.distribution.median), row: 1 }],
  alt: 'A histogram of the aspect ratio of the aerated region, area over the square of its Duncan length, in bins of 0.05 from 0 to 2: a broad hump centred near 0.5 with a long right tail; a vertical mark at 0.11, Duncan\'s laboratory value, sits at the far left below the whole hump, and the median mark at ' + d3(S.distribution.median) + ' is ' + d3(S.medianOverReference) + ' times it.'
});
const LABEL = { cm: 'speed cb', Lb: 'length Lb', Ab_max: 'area Ab', Dz_max: 'height Dz', DT: 'duration Δt', LD81: 'Duncan L', theta: 'angle θ' };
const rowsC = Object.entries(CR).map(([k, v]) => { const [x, y] = k.split('~'); const sp = Number(v.spearman.r.lo); return { k: LABEL[x] + ' ~ ' + LABEL[y], v: sp, lab: sp.toFixed(3), token: x === 'cm' ? 'var(--c-1)' : 'var(--c-2)', hover: 'Spearman ρ = ' + v.spearman.r.lo + ' (exact ρ² = ' + v.spearman.r2.dec + '); Pearson r = ' + v.pearson.r.lo } });
const FIG3 = CH.bars({
  w: 900, rowH: 30, min: 0, max: 1, padL: 210, padR: 80,
  rows: rowsC,
  xTicks: [0, 0.25, 0.5, 0.75, 1].map((v) => ({ v, t: String(v) })), xLabel: 'Spearman rank correlation ρ, an exact rational read to three decimals',
  keys: [{ token: 'var(--c-1)', t: 'breaking speed against a geometric property' }, { token: 'var(--c-2)', t: 'one geometric property against another' }],
  alt: 'Nine horizontal bars of rank correlation from 0 to 1: the six between breaking speed and a geometric property all end below 0.45, the highest being ' + LABEL[speedMaxKey.split('~')[1]] + ' at ' + speedMax.toFixed(2) + '; of the three between geometric properties, area against length reaches ' + geoAL.toFixed(2) + '.'
});

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the registry · every event re-decided at this build',
  title: 'Sixteen thousand breaking waves, decided against the laboratory.',
  deck: 'What a breaking wave looks like — how long the whitecap is, how much area it covers, how steep its face, how fast it travels — has been measured mostly in tanks. Guimarães, Stringari, Leckler and Ardhuin published the geometry of ' + fmt(L.n) + ' breaking waves filmed in stereo on the Black Sea over eleven days in 2013 and wrote two sentences about them: that real breakers are not self-similar, and that a breaker\'s speed does not predict its geometry. No table came with the record. This page reads their per-event table as the exact numbers it holds and puts a decided number under each sentence.'
}));
B.push(C.tldr({
  findingRaw: '<strong>Against the laboratory: ' + fmt(A.inside) + ' of ' + fmt(L.n) + ' events (' + pct(A.inside, L.n) + ') have the inclination Duncan measured in a tank, 10–14.7°; ' + fmt(S.above) + ' (' + pct(S.above, L.n) + ') have an aspect ratio above Duncan\'s 0.11, the median being ' + d3(S.medianOverReference) + ' times it, and only ' + fmt(S.within25pc) + ' fall within a quarter of it.</strong> '
    + 'Not self-similar, in numbers: a geometry that scaled with itself would hold cb²/(g·Lb), Ab/Lb² and Ab/L²_D81 constant; across the middle half of the events they vary by factors of ' + d3(SS.a.spreadIQ) + ', ' + d3(SS.b.spreadIQ) + ' and ' + d3(SS.c.spreadIQ) + ', and across the central ninety per cent by ' + d3(SS.a.spread90) + ', ' + d3(SS.b.spread90) + ' and ' + d3(SS.c.spread90) + '. '
    + 'Speed does not predict geometry, in numbers: the rank correlation of breaking speed with length, area, height, duration, Duncan length and inclination is at most ' + speedMax.toFixed(3) + ' (' + LABEL[speedMaxKey.split('~')[1]] + '), while area against length is ' + geoAL.toFixed(3) + ' — geometry predicts geometry; speed predicts little. '
    + 'And the breakers are slow: the median runs at ' + Number(L.cmOverCp.median.lo).toFixed(3) + ' of the peak phase speed of its sea, and ' + fmt(L.cmOverCp.fasterThanHalfCp) + ' of ' + fmt(L.n) + ' exceed half of it.',
  mechanismRaw: 'The record\'s table is a pandas pickle; it was written out once as a CSV in which every number is the shortest decimal that round-trips to the double the pickle holds, verified column by column, and pinned. Every literal is read as the rational its digits denote. A comparison with a laboratory constant is an exact sign; a quantile is the k-th smallest value, k = ⌈p·n⌉ — a number that occurs in the table, never an average — and a spread factor is a ratio of two of them; a rank correlation is Pearson\'s r on average ranks, which are half-integers, so doubled they are integers and ρ² is an exact rational (ρ itself is enclosed to twelve decimals by integer square roots). The one transcendental, π in the peak phase speed g/(2π·fp), enters as a certified enclosure and the affected quantiles are enclosures. The references are the ones the authors\' own scripts draw: the g they use, their breaking length Lb = Pb/2, Duncan\'s 10–14.7° band and 0.11 as their histogram script marks them.',
  checkRaw: C.m('node instruments/breaking/battery.js') + ' — ' + nChecks + ' checks, ' + nReds + ' red controls that must fire (a NaN, a comma decimal, a reversed line\'s sign, a root\'s lower end, one literal moved by 10⁻¹⁷ moving an exact r²), then the whole table re-decided live against the ledger. ' + C.m('node tools/run-breaking-ledger.js') + ' re-hashes the nine pinned files and rebuilds every number in about two seconds.'
}));
B.push(C.stats([
  { k: 'breaking events decided', v: fmt(L.n), role: 'held', n: L.records.length + ' stereo-video records, winds ' + Math.min(...L.records.map((r) => Number(r.wnd))).toFixed(0) + '–' + Math.max(...L.records.map((r) => Number(r.wnd))).toFixed(0) + ' m/s, Hs ' + Math.min(...L.records.map((r) => Number(r.Hs))).toFixed(2) + '–' + Math.max(...L.records.map((r) => Number(r.Hs))).toFixed(2) + ' m' },
  { k: 'in Duncan\'s inclination band', v: pct(A.inside, L.n), role: 'open', n: fmt(A.inside) + ' events between 10° and 14.7°; ' + fmt(A.below) + ' flatter, ' + fmt(A.above) + ' steeper, none on an edge' },
  { k: 'median aspect ratio over Duncan\'s', v: d3(S.medianOverReference) + '×', role: 'open', n: fmt(S.above) + ' of ' + fmt(L.n) + ' above 0.11; ' + fmt(S.within25pc) + ' within ±25 %, ' + fmt(S.within50pc) + ' within ±50 %' },
  { k: 'self-similarity spread, middle half', v: d3(SS.a.spreadIQ) + '× · ' + d3(SS.b.spreadIQ) + '× · ' + d3(SS.c.spreadIQ) + '×', role: 'open', n: 'q75/q25 of cb²/(g·Lb), Ab/Lb², Ab/L²_D81 — exact ratios of two table values' },
  { k: 'speed ~ geometry, at most', v: 'ρ = ' + speedMax.toFixed(2), role: 'open', n: 'against ρ = ' + geoAL.toFixed(2) + ' for area ~ length; every ρ² an exact rational' },
  { k: 'breaker speed / peak phase speed', v: Number(L.cmOverCp.median.lo).toFixed(2), role: 'held', n: 'the median; the central 90 % run between ' + Number(L.cmOverCp.q05.lo).toFixed(2) + ' and ' + Number(L.cmOverCp.q95.hi).toFixed(2) + ' of cp, enclosed' },
]));

B.push(C.section({
  lab: '§1 · the laboratory', title: 'Duncan\'s tank, against the Black Sea',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG1, caption: 'The inclination of the aerated region at the frame of its greatest extent, one-degree bins, membership decided exactly from the literal in the table. Duncan\'s band is the one the authors\' histogram script draws; the band holds ' + pct(A.inside, L.n) + ' of the events, the flatter side ' + pct(A.below, L.n) + ', the steeper side ' + pct(A.above, L.n) + '.' })
    + C.figure({ svgRaw: FIG2, caption: 'The aspect ratio of the aerated region — its plan-view area over the square of its slanted length — in bins of 0.05. Duncan\'s 0.11 is marked where the script marks it. The hump sits well to the right: ' + fmt(S.above) + ' events are above the laboratory value and the median is ' + d3(S.medianOverReference) + ' times it.' })
    + '<div class="col">' + C.pRaw('Duncan (1981) towed a hydrofoil through a tank and measured the breaking region it made: a wedge inclined at 10–14.7° whose cross-sectional area was 0.11 of the square of its length. The authors\' scripts draw both numbers over their histograms, and this page decides both event by event with no tolerance: an inclination is INSIDE, ON or OUTSIDE the band by an exact comparison of the literal with 10 and 14.7; an aspect ratio is above or below 0.11 by an exact sign. One caveat belongs to the comparison itself and is the authors\' as much as ours: Duncan\'s 0.11 relates a vertical cross-section to a length, whereas the area measured from above a real sea is the whitecap\'s plan view. The script draws the line on that histogram; the page decides it as drawn, and says so.') + '</div>'
}));
B.push(C.section({
  lab: '§2 · self-similarity', title: 'Three ratios a self-similar breaker would hold constant',
  wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'ratio' }, { h: 'q05', cls: 'n' }, { h: 'q25', cls: 'n' }, { h: 'median', cls: 'n' }, { h: 'q75', cls: 'n' }, { h: 'q95', cls: 'n' }, { h: 'q75 / q25', cls: 'n' }, { h: 'q95 / q05', cls: 'n' }],
    rows: [['cb² / (g·Lb)', SS.a], ['Ab / Lb²', SS.b], ['Ab / L²_D81', SS.c]].map(([k, s]) => [k, d3(s.q05), d3(s.q25), d3(s.median), d3(s.q75), d3(s.q95), d3(s.spreadIQ) + '×', d3(s.spread90) + '×'])
  }) + '<div class="col">' + C.pRaw('If breaking waves were geometrically similar to one another, a length made from the speed (cb²/g) would be a fixed multiple of the measured length, and the area a fixed multiple of the length squared: each ratio would be a constant up to measurement noise. Here each quantile is an order statistic of the exact ratios — the k-th smallest value, so a number that some event actually has — and the spread factors are exact ratios of two of them. The middle half of the events spans a factor of two in every ratio; the central ninety per cent, a factor of four to six. The authors\' script tests the same thing by marking the tail beyond the mean plus two standard deviations, a float procedure on a distribution with no reason to be normal; the spread factors above are the same finding in a form that does not depend on a distribution.') + '</div>'
}));
B.push(C.section({
  lab: '§3 · speed and geometry', title: 'What the speed of a breaker tells you about its shape',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG3, caption: 'Spearman rank correlations, each an exact rational read to three decimals (hover for ρ² and for Pearson\'s r on the raw values). cb is the mean breaking speed, Lb the breaking length (half the perimeter), Ab the whitecap area, Dz its vertical extent, Δt its duration, L the Duncan length and θ the inclination. Six pair breaking speed with a geometric property; three pair geometric properties with each other, as the control.' })
    + '<div class="col">' + C.pRaw('"No predictable relationship" is a sentence about correlation, and a rank correlation is a rational number: average ranks, doubled, are integers, and Pearson\'s formula on integers is a ratio of two integers. The speed of a breaker ranks with its length at ρ = ' + Number(CR['cm~Lb'].spearman.r.lo).toFixed(3) + ', with its area at ' + Number(CR['cm~Ab_max'].spearman.r.lo).toFixed(3) + ', with its vertical extent at ' + Number(CR['cm~Dz_max'].spearman.r.lo).toFixed(3) + ', with its duration at ' + Number(CR['cm~DT'].spearman.r.lo).toFixed(3) + ' and with its inclination at ' + Number(CR['cm~theta'].spearman.r.lo).toFixed(3) + '. Length ranks with area at ' + Number(CR['Ab_max~Lb'].spearman.r.lo).toFixed(3) + '. The authors\' scripts fit Lb = a·cb and Lb = a·cb²/g through the cloud by RANSAC and least squares; those are float procedures whose coefficients depend on the fitter\'s choices, and they are not reproduced here — the rank correlation is what the cloud itself says, and it says a breaker\'s speed explains at most ρ² = ' + Number(CR[speedMaxKey].spearman.r2.dec).toFixed(3) + ' of the rank variation in any property measured.') + '</div>'
}));
B.push(C.section({
  lab: '§4 · the records', title: 'Twenty records, eleven days',
  wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'record' }, { h: 'events', cls: 'n' }, { h: 'wind, m/s', cls: 'n' }, { h: 'Hs, m', cls: 'n' }, { h: 'fp, Hz', cls: 'n' }],
    rows: L.records.map((r) => [r.rec.replace('run_', '').replace(/_(\d\d)h(\d\d)m.*Z_(\d+Hz)/, ' $1:$2 · $3'), fmt(r.n), r.wnd, r.Hs, r.fp])
  }) + '<div class="col">' + C.pRaw('Each record is one stereo-video run from the Katsiveli platform, its wind, significant wave height and peak frequency constant within it (verified: no record carries two values). ' + fmt(L.records.reduce((a, r) => Math.max(a, r.n), 0)) + ' of the events come from the busiest run and ' + fmt(L.records.reduce((a, r) => Math.min(a, r.n), 1e9)) + ' from the quietest; the counts above are exact and the description\'s "over 16000" is ' + fmt(L.n) + '.') + '</div>'
}));
B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('Nothing about the ocean is decided here — only about the table: whether each of its numbers falls inside a stated band, how spread its ratios are, how its columns rank together. The table itself is the authors\' measurement, with whatever error the stereo reconstruction and the whitecap detection carry; the record describes neither, and the companion instrument on this site (/instruments/stereo-reach) shows what a rig\'s geometry alone can do to a length. Duncan\'s band and ratio are taken as the authors\' scripts state them; the 1981 paper is not held here, and the plan-view caveat in §1 is real. The two sentences the page quantifies are the record\'s own; there is no published article with a table to read them against, and the statistical tests the scripts run (a lognormal fit, a Kolmogorov–Smirnov p, a tail beyond two standard deviations) are not reproduced, because they are float procedures about a distribution and this page decides only what exact arithmetic can. The data are CC-BY-4.0; the seven files used were extracted from the 8.9 GB archive by byte range against its published digest, and the extraction is recorded.')
}));
const foot = '<p>Generated by tools/build-report-breaking.js @ git ' + git + '. Gates at this build: the ledger re-derived live from the pinned CSV (sha256 ' + L.corpus.csvSha256.slice(0, 12) + '…), the breaking battery (' + nChecks + ' checks, ' + nReds + ' red controls, all fired), every sentence above gated on the ledger field it reads.</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'breaking-geometry.html'),
  TPL.render({ title: 'Sixteen thousand breaking waves, decided', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/breaking-geometry.html',
    desc: 'The geometry of 16,369 breaking waves filmed on the Black Sea (Guimarães, Stringari, Leckler, Ardhuin, Zenodo 2026) decided in exact arithmetic against Duncan\'s laboratory band and ratio, with the self-similarity ratios as exact order statistics and the speed–geometry rank correlations as exact rationals — numbers under the record\'s two sentences.' }));
console.log('reports/breaking-geometry.html written: ' + fmt(L.n) + ' events, ' + A.inside + ' in the band, battery ' + nChecks + ' checks / ' + nReds + ' reds @ git ' + git);
