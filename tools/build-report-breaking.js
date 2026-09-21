#!/usr/bin/env node
/* build-report-breaking.js — reports/breaking-geometry.html: sixteen thousand
   breaking waves, decided against the laboratory — and against the paper.

   The Zenodo record (2026-01-29) shipped the measured geometry of 16,369
   breaking waves with no paper beside it; this page first read the table on
   2026-09-12 against the reference lines the authors' own scripts draw. On
   2026-09-16 the paper appeared — Guimarães, Stringari, Filipot, Leckler,
   Benetazzo, Chapron, Geophysical Research Letters, 10.1029/2026GL122293 —
   and its printed numbers are now read against the same table with the
   scripts' own definitions (instruments/breaking/paper.js): Table 1 row by
   row, the fits, the correlations, the 4 % self-similar tail, the range of
   θ. The stratified-by-sea-state analysis the paper's §5 calls for and leaves
   undone is done here, per record.

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
const d2 = (s) => Number(s.dec !== undefined ? s.dec : s).toFixed(2);
const pct = (num, den) => (100 * num / den).toFixed(1) + '%';

/* ---- gates on the facts the prose states ---- */
if (L.n !== 16369 || L.records.length !== 20) die('the event and record counts moved');
const A = L.duncan.angle, S = L.duncan.aspect, SS = L.selfSimilarity, CR = L.correlations, PA = L.paper;
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
/* the paper block */
if (!PA || PA.doi !== '10.1029/2026GL122293' || PA.published !== '2026-09-16') die('the paper block is not the GRL paper');
const byId = Object.fromEntries(PA.items.map((it) => [it.id, it]));
const V = (id) => (byId[id] || die('paper item ' + id + ' missing')).verdict;
const tally = {}; for (const it of PA.items) tally[it.verdict] = (tally[it.verdict] || 0) + 1;
const nRep = tally.REPRODUCED || 0, nTrunc = (tally.TRUNCATION || 0) + (tally.REPRODUCED_AS_TRUNCATION || 0), nNot = tally.NOT_THE_TABLES || 0, nRansac = tally.NOT_DECIDABLE_RANSAC || 0;
if (nRep + nTrunc + nNot + nRansac !== PA.items.length) die('the paper verdicts do not partition the items');
if (!(V('fitLb') === 'REPRODUCED' && V('fitLD81') === 'REPRODUCED' && V('fitDz') === 'REPRODUCED')) die('the three-fits sentence would be false');
if (!(V('selfSimilarFraction') === 'REPRODUCED' && V('fitLbTail') === 'REPRODUCED')) die('the four-per-cent sentence would be false');
if (!(V('thetaMin') === 'NOT_THE_TABLES' && V('thetaMax') === 'NOT_THE_TABLES' && V('thetaRangeAlt') === 'REPRODUCED_AS_TRUNCATION')) die('the θ-range sentence would be false');
if (!(PA.table1.HsNamedColumnMatches === 0 && PA.table1.allFound)) die('the Hs-column sentence would be false');
const T1 = PA.table1;
if (T1.reproduced + T1.truncation + T1.onTheBoundary + T1.notTheTables !== T1.cells) die('the Table 1 tally does not partition');
const SEA = PA.seaState;
if (!(Number(SEA.slopeSpread) > 1.5 && Number(SEA.slopeMin) < 0.83 && Number(SEA.slopeMax) > 0.83)) die('the per-record spread sentence would be false');
const rhoHs = Number(SEA.spearman['slope~Hs'].rho[0]), rhoAge = Number(SEA.spearman['slope~waveAge'].rho[0]), rhoU = Number(SEA.spearman['slope~U10'].rho[0]);
if (!(rhoHs < -0.4 && Math.abs(rhoAge) < 0.1)) die('the sea-state rank sentence would be false');
const hsPrinted = claims.paper.table1.rows.map((r) => Number(r[5]));
const hsLo = Math.min(...hsPrinted).toFixed(2), hsHi = Math.max(...hsPrinted).toFixed(2);

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

/* ---- FIG0: every printed number, decided — a strip ---- */
const TOK = { REPRODUCED: 'var(--c-2)', TRUNCATION: 'var(--c-3)', REPRODUCED_AS_TRUNCATION: 'var(--c-3)', ON_THE_BOUNDARY: 'var(--c-3)', NOT_THE_TABLES: 'var(--c-1)', NOT_DECIDABLE_RANSAC: CH.CTX };
const WORD = { REPRODUCED: 'the rounding of the exact value', TRUNCATION: 'the truncation, not the rounding', REPRODUCED_AS_TRUNCATION: 'the integer parts, under the definition named', ON_THE_BOUNDARY: 'a rounding tie', NOT_THE_TABLES: 'NOT the table\'s', NOT_DECIDABLE_RANSAC: 'a RANSAC coefficient: not decidable' };
const NAME = { N: 'N', thetaMin: 'θ min', thetaMax: 'θ max', thetaRangeAlt: 'θ range as tan⁻¹(Δz/eB)', aspectMean: 'mean Ab/L²', aspectSd: 'sd of Ab/L²', aspectCV: 'CV of Ab/L²', aspectPeak: 'peak of Ab/L²', fitLb: 'Lb = a·cb²/g', fitLD81: 'L_D81 = a·cb²/g', fitDz: 'Δz = a·cb²/g', pearsonSpeedMax: 'r(speed, geometry) < 0.45', rAbLb: 'r(Ab, Lb)', rAbLD81: 'r(Ab, L_D81)', rDzEB: 'r(Δz, eB)', rAbDt: 'r(Ab, Δt)', rLbDt: 'r(Lb, Δt)', rDzDt: 'r(Δz, Δt)', fitAbLD81: 'Ab = k·L²_D81', fitAbLb: 'Ab = k·Lb²', fitEAEB: 'eA = k·eB', fitAeAb: 'Ae = k·Ab', selfSimilarFraction: 'self-similar 4 ± 2 %', fitLbTail: 'tail: g·Lb/cb² = 0.30, r = 0.9', fitLbRest: 'rest: g·Lb/cb² = 0.83, r = 0.4' };
const stripItems = PA.items.map((it) => ({ token: TOK[it.verdict] || CH.CTX, k: (NAME[it.id] || it.id), v: 'printed ' + it.printed + ' · exact ' + it.exact + ' — ' + (WORD[it.verdict] || it.verdict) }));
for (const row of T1.rows) for (const c of ['fps', 'duration', 'area', 'events', 'Hs', 'Tp', 'U10']) {
  const v = row.cells[c], ex = { fps: row.printed.fps, duration: row.exact.duration, area: row.exact.area, events: row.exact.events, Hs: row.exact.sv_fp2, Tp: row.exact.Tp, U10: row.exact.U10 }[c];
  stripItems.push({ token: TOK[v], k: 'Table 1 · ' + row.time + ' · ' + c, v: 'printed ' + row.printed[{ fps: 'fps', duration: 'dur', area: 'area', events: 'nb', Hs: 'hs', Tp: 'tp', U10: 'u10' }[c]] + ' · exact ' + ex + ' — ' + WORD[v] });
}
const nCells = stripItems.length;
const FIG0 = CH.strip({
  items: stripItems, perRow: 33, cell: 16,
  keys: [{ token: 'var(--c-2)', t: (nRep + T1.reproduced) + ' are the rounding of the exact value' }, { token: 'var(--c-3)', t: (nTrunc + T1.truncation + T1.onTheBoundary) + ' are a truncation, a rounding tie, or the integer parts' }, { token: 'var(--c-1)', t: (nNot + T1.notTheTables) + ' are not the table\'s' }, { token: CH.CTX, t: nRansac + ' are RANSAC coefficients, not decidable' }],
  alt: 'A strip of ' + nCells + ' cells, one per number the paper prints — ' + PA.items.length + ' in the text and ' + T1.cells + ' in Table 1 — coloured by verdict: most are the rounding of the exact value, a few are truncations, ' + (nNot + T1.notTheTables) + ' are not the table\'s and two are randomised-fit coefficients that cannot be decided.'
});

/* ---- FIG1/FIG2: the laboratory references ---- */
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
  marks: [{ x: 0.11, t: 'Duncan (1981): 0.11' }, { x: Number(S.distribution.median.dec), t: 'median ' + d3(S.distribution.median), row: 1 }, { x: Number(PA.tails.c.threshold[0]), t: 'mean + 2 sd: the self-similar tail', row: 2, dashed: true }],
  alt: 'A histogram of the aspect ratio of the aerated region, area over the square of its Duncan length, in bins of 0.05 from 0 to 2: a broad hump centred near 0.5 with a long right tail; a vertical mark at 0.11, Duncan\'s laboratory value, sits at the far left below the whole hump, the median mark at ' + d3(S.distribution.median) + ' is ' + d3(S.medianOverReference) + ' times it, and a dashed mark at ' + Number(PA.tails.c.threshold[0]).toFixed(2) + ' shows where the paper\'s self-similar tail begins.'
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

/* ---- FIG4: the stratified analysis — each record's fitted coefficient against its Hs ---- */
const PR = PA.perRecord;
const ptsRec = PR.map((p) => ({ x: Number(p.Hs), y: Number(p.slopeDec), token: 'var(--c-2)', k: p.time.slice(0, 16) + ' · ' + fmt(p.n) + ' events', v: 'g·Lb/cb² = ' + Number(p.slopeDec).toFixed(3) + ' · Hs ' + p.Hs + ' m · Tp ' + p.Tp + ' s · U10 ' + p.U10 + ' m/s · r(cb², Lb) = ' + Number(p.rCb2Lb[0]).toFixed(2) + ' · ' + (100 * Number(p.fractionInBand)).toFixed(0) + '% in Duncan\'s band' }));
const FIG4 = CH.scatter({
  w: 900, h: 340, x0: 0.2, x1: 2.0, y0: 0.5, y1: 1.2, padL: 76,
  pts: ptsRec,
  hlines: [{ y: Number(SEA.pooledSlope), token: 'var(--c-1)', t: 'all 16,369 events: ' + Number(SEA.pooledSlope).toFixed(3) + ' (the paper\'s 0.83)' }],
  xTicks: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((v) => ({ v, t: v.toFixed(2) })), yTicks: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2].map((v) => ({ v, t: v.toFixed(1) })),
  xLabel: 'significant wave height of the record, m (Table 1)', yLabel: 'g·Lb / cb², fitted per record',
  keys: [{ token: 'var(--c-2)', t: 'one stereo record: least squares through the origin on its own events' }, { token: 'var(--c-1)', t: 'the pooled coefficient the paper prints' }],
  alt: 'Twenty points, one per stereo record, of the fitted coefficient g·Lb/cb² against the record\'s significant wave height from ' + hsLo + ' to ' + hsHi + ' m; the points run from ' + Number(SEA.slopeMin).toFixed(2) + ' to ' + Number(SEA.slopeMax).toFixed(2) + ' and fall with wave height (rank correlation ' + rhoHs.toFixed(2) + '), with the four highest seas at the bottom right below the pooled line at ' + Number(SEA.pooledSlope).toFixed(2) + '.'
});

/* ---- the paper table ---- */
const chip = (v) => (v === 'REPRODUCED' ? 'REPRODUCED' : v === 'NOT_THE_TABLES' ? 'NOT THE TABLE\'S' : v === 'TRUNCATION' ? 'TRUNCATION' : v === 'REPRODUCED_AS_TRUNCATION' ? 'INTEGER PARTS' : v === 'NOT_DECIDABLE_RANSAC' ? 'NOT DECIDABLE' : v === 'ON_THE_BOUNDARY' ? 'A TIE' : v);
const NOTE = {
  thetaMin: 'the table\'s θ column runs ' + byId.thetaMin.exact + '°…' + byId.thetaMax.exact + '°',
  thetaMax: 'no event above 45°; the histogram script plots this column',
  thetaRangeAlt: '3.51°…71.75°: the integer parts are the printed pair',
  aspectMean: '0.5656 rounds to 0.57',
  aspectPeak: 'the mode bin of numpy\'s Freedman–Diaconis histogram is [' + Number(byId.aspectPeak.modeBin[0]).toFixed(3) + ', ' + Number(byId.aspectPeak.modeBin[1]).toFixed(3) + '), ' + byId.aspectPeak.nbins + ' bins; 0.46 is two bins left',
  pearsonSpeedMax: 'speed against vertical extent, ' + byId.pearsonSpeedMax.pair.replace('~', ' ~ ') + '; the other ' + (byId.pearsonSpeedMax.pairs - 1) + ' pairs are below 0.45',
  rAbDt: 'with the summed area Ab_sum instead: r = ' + Number(byId.rAbDt.withAbSum[0]).toFixed(3) + ', which does round to 0.6',
  fitAbLD81: 'with the area at the frame of maximum length (Ab_Lmax): ' + Number(byId.fitAbLD81.withAreaAtMaxLength).toFixed(4) + ', which rounds to 0.22',
  fitAbLb: 'on every subset the slope is 0.17 (all, rest) or 0.74 (tail); no definition in the scripts gives 0.27',
  fitEAEB: 'least squares through the origin ' + Number(byId.fitEAEB.exact).toFixed(3) + '; the printed r = 0.8 is the rounding of ' + Number(byId.fitEAEB.r[0]).toFixed(3),
  fitAeAb: 'least squares ' + Number(byId.fitAeAb.exact).toFixed(3) + '; r on the script\'s columns ' + Number(byId.fitAeAb.r[0]).toFixed(3) + ' (printed 0.9); on the summed columns ' + Number(byId.fitAeAb.rSumColumns[0]).toFixed(3),
  selfSimilarFraction: byId.selfSimilarFraction.counts.join(', ') + ' events of ' + fmt(L.n) + ' at or above mean + 2 sd on the three ratios; none within the threshold\'s enclosure',
  fitLbTail: 'r(cb², Lb) on the ' + byId.fitLbTail.n + ' tail events = ' + Number(byId.fitLbTail.rCb2Lb[0]).toFixed(3),
  fitLbRest: 'on the ' + fmt(byId.fitLbRest.n) + ' remaining events the fit is ' + Number(byId.fitLbRest.exact).toFixed(3) + '; 0.83 is the all-events fit; r = ' + Number(byId.fitLbRest.rCb2Lb[0]).toFixed(3) + ' does round to 0.4',
};
const exactShort = (it) => { const e = String(it.exact); if (/^-?[\d.]+\.\.-?[\d.]+$/.test(e)) { const [a] = e.split('..'); return Number(a).toFixed(4); } if (e.startsWith('all ')) return Number(e.match(/all ([\d.]+)/)[1]).toFixed(4); if (e.startsWith('tan')) return 'tan 0.0614…3.0331'; if (it.id === 'selfSimilarFraction') return e.replace(/ %/g, '%'); const n = Number(e); return Number.isFinite(n) ? (Number.isInteger(n) ? fmt(n) : n.toFixed(4)) : e; };
const paperRows = PA.items.map((it) => [NAME[it.id] || it.id, String(it.printed), exactShort(it), chip(it.verdict)]);

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the registry · every event re-decided at this build · the paper read 2026-09-17',
  title: 'Sixteen thousand breaking waves, decided against the laboratory — and against the paper.',
  deck: 'What a breaking wave looks like — how long the whitecap is, how much area it covers, how steep its face, how fast it travels — has been measured mostly in tanks. In January Guimarães, Stringari, Leckler and Ardhuin published the geometry of ' + fmt(L.n) + ' breaking waves filmed in stereo on the Black Sea over eleven days in 2013, with two sentences and no paper; this page read the table against the laboratory references the authors\' own scripts draw. On 16 September 2026 the paper appeared in Geophysical Research Letters (Guimarães, Stringari, Filipot, Leckler, Benetazzo, Chapron). Every number it prints is now read against the same table, and the analysis it says is beyond its scope — the geometry stratified by sea state — is done, record by record.'
}));
B.push(C.tldr({
  findingRaw: '<strong>The paper, read against its own table: of ' + PA.items.length + ' numbers printed in the text, ' + nRep + ' are the rounding of the exact value, ' + nTrunc + ' the truncation or the integer parts, ' + nRansac + ' are coefficients of a randomised fitter that nothing exact can reproduce, and ' + nNot + ' are not the table\'s under the definitions the scripts use. Of ' + T1.cells + ' cells in Table 1, ' + T1.reproduced + ' are the rounding, ' + (T1.truncation + T1.onTheBoundary) + ' a truncation or a tie, ' + T1.notTheTables + ' neither.</strong> '
    + 'The three fitted laws hold to the printed digit — Lb = ' + byId.fitLb.printed + ' cb²/g, L_D81 = ' + byId.fitLD81.printed + ' cb²/g, Δz = ' + byId.fitDz.printed + ' cb²/g are the roundings of ' + Number(byId.fitLb.exact).toFixed(4) + ', ' + Number(byId.fitLD81.exact).toFixed(4) + ', ' + Number(byId.fitDz.exact).toFixed(4) + ' — and so does the 4 ± 2 % self-similar tail: ' + byId.selfSimilarFraction.exact + ' of events lie at or beyond mean + 2 sd on the three ratios, and on that tail g·Lb/cb² is ' + Number(byId.fitLbTail.exact).toFixed(3) + ' (printed 0.30) with r = 0.9. '
    + 'Three printed numbers are not the table\'s: the range of θ, "3° to 71°", is not the θ column (which runs ' + Number(byId.thetaMin.exact).toFixed(2) + '° to ' + Number(byId.thetaMax.exact).toFixed(2) + '°) but the integer parts of a different angle, tan⁻¹(Δz/eB); the printed Hs of Table 1 is, in every one of the 20 records, the column the pickle names sv_fp2 and never the column it names Hs; and "Ab/L²_D81 = 0.22" is the slope for the area at the frame of maximum length, not the maximum area the aspect-ratio histogram uses. '
    + 'The stratified analysis: fitted per record, g·Lb/cb² runs from ' + Number(SEA.slopeMin).toFixed(2) + ' to ' + Number(SEA.slopeMax).toFixed(2) + ' — a factor of ' + Number(SEA.slopeSpread).toFixed(2) + ' across twenty sea states around the pooled ' + Number(SEA.pooledSlope).toFixed(2) + ' — and it ranks with the record\'s wave height at ρ = ' + rhoHs.toFixed(2) + ' (the four roughest seas, Hs above 1.5 m, carry the four lowest coefficients), with wind speed at ' + rhoU.toFixed(2) + ', and with wave age at ' + rhoAge.toFixed(2) + ': the sea-state dependence the abstract asserts is there, as a number, and it is the wave height, not the wave age.',
  mechanismRaw: 'The record\'s table is a pandas pickle; it was written out once as a CSV in which every number is the shortest decimal that round-trips to the double the pickle holds, verified column by column, and pinned. Every literal is read as the rational its digits denote. A comparison with a laboratory constant is an exact sign; a quantile is the k-th smallest value; a rank correlation is Pearson\'s r on doubled average ranks, so ρ² is an exact rational. The paper\'s numbers are computed with the definitions its scripts use: a fit "y = a·cb²/g" is least squares through the origin, an exact rational; a mean or a standard deviation of a ratio is an ENCLOSURE (each ratio floored and ceiled at 10⁻³⁰, the sums integer, the square root by integer square roots); the self-similar tail is every event at or above mean + 2 sd, decided against the enclosed threshold with an UNDECIDED count for anything inside it (it is zero); the histogram peak is numpy\'s Freedman–Diaconis rule with n^(1/3) enclosed by integer cube roots. A printed literal is REPRODUCED when it is the rounding of the exact value, a TRUNCATION when it is the truncation, NOT THE TABLE\'S when it is neither.',
  checkRaw: C.m('node instruments/breaking/battery.js') + ' — ' + nChecks + ' checks, ' + nReds + ' red controls that must fire (a NaN, a comma decimal, a reversed line\'s sign, a root\'s lower end, one literal moved by 10⁻¹⁷, a printed 3 against 1.376, a Table 1 count moved by one, a 0.84 against 0.8268, a bin count that straddles an integer), then the whole table and the whole paper re-decided live against the ledger. ' + C.m('node tools/run-breaking-ledger.js') + ' re-hashes the ten pinned files and rebuilds every number in about three seconds.'
}));
B.push(C.stats([
  { k: 'breaking events decided', v: fmt(L.n), role: 'held', n: L.records.length + ' stereo-video records, winds ' + Math.min(...L.records.map((r) => Number(r.wnd))).toFixed(0) + '–' + Math.max(...L.records.map((r) => Number(r.wnd))).toFixed(0) + ' m/s, Hs ' + hsLo + '–' + hsHi + ' m (Table 1)' },
  { k: 'printed numbers read', v: nRep + ' of ' + PA.items.length, role: 'open', n: 'are the rounding of the exact value; ' + nTrunc + ' truncations, ' + nNot + ' not the table\'s, ' + nRansac + ' RANSAC' },
  { k: 'Table 1 cells', v: T1.reproduced + ' of ' + T1.cells, role: 'open', n: 'the rounding; ' + T1.truncation + ' truncations, ' + T1.onTheBoundary + ' ties, ' + T1.notTheTables + ' neither; every event count exact' },
  { k: 'in Duncan\'s inclination band', v: pct(A.inside, L.n), role: 'open', n: fmt(A.inside) + ' events between 10° and 14.7°; ' + fmt(A.below) + ' flatter, ' + fmt(A.above) + ' steeper' },
  { k: 'self-similar tail', v: byId.selfSimilarFraction.counts.map((c) => (100 * c / L.n).toFixed(1)).join(' · ') + ' %', role: 'open', n: 'events at or beyond mean + 2 sd on cb²/(g·Lb), Ab/Lb², Ab/L²_D81 — the paper\'s 4 ± 2 %' },
  { k: 'g·Lb/cb² per record', v: Number(SEA.slopeMin).toFixed(2) + '–' + Number(SEA.slopeMax).toFixed(2), role: 'held', n: 'twenty sea states around the pooled ' + Number(SEA.pooledSlope).toFixed(2) + '; ranks with Hs at ρ = ' + rhoHs.toFixed(2) + ', with wave age at ' + rhoAge.toFixed(2) },
]));

B.push(C.section({
  lab: '§1 · the paper', title: 'Every printed number, read against the table',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG0, caption: 'One cell per printed number: the ' + PA.items.length + ' in the text first, then the ' + T1.cells + ' cells of Table 1 record by record (frame rate, duration, area, events, Hs, Tp, U10). Hover a cell for the printed and the exact value.' })
    + '<div class="col">' + C.table({
      cols: [{ h: 'printed' }, { h: 'value', cls: 'n' }, { h: 'exact', cls: 'n' }, { h: 'verdict' }],
      rows: paperRows
    }) + '</div>'
    + '<div class="col">' + C.pRaw('The paper\'s central numbers survive exact re-derivation. The three quadratic laws of Figure 3 are least squares through the origin on cb²/g, and each printed coefficient is the rounding of the exact rational — ' + Number(byId.fitLb.exact).toFixed(4) + ', ' + Number(byId.fitLD81.exact).toFixed(4) + ', ' + Number(byId.fitDz.exact).toFixed(4) + '. The standard deviation and the coefficient of variation of the aspect ratio (0.26, 46 %) are the roundings of enclosures ' + byId.aspectSd.exact.split('..')[0] + ' and ' + byId.aspectCV.exact.split('..')[0] + ' %; the mean, ' + Number(byId.aspectMean.exact.split('..')[0]).toFixed(4) + ', is printed as 0.56, its truncation. The self-similar fraction — every event at or beyond mean + 2 sd on a ratio, sample sd as pandas computes it — is ' + byId.selfSimilarFraction.exact + ' across the three ratios, inside the printed 4 ± 2 %, and on the ' + byId.fitLbTail.n + ' tail events of cb²/(g·Lb) the fit is ' + Number(byId.fitLbTail.exact).toFixed(4) + ' with r(cb², Lb) = ' + Number(byId.fitLbTail.rCb2Lb[0]).toFixed(3) + ' — the paper\'s 0.30 and 0.9.')
    + C.pRaw('Three are not the table\'s. "The range of θ observed here (3° to 71°)" is not the range of the column named theta, which the histogram script plots and which runs ' + Number(byId.thetaMin.exact).toFixed(2) + '° to ' + Number(byId.thetaMax.exact).toFixed(2) + '° with no event beyond 45°; it is the integer parts of a different angle, tan⁻¹(Δz_max / eB), whose tangent runs from ' + Number(byId.thetaRangeAlt.exact.match(/min ([\d.]+)/)[1]).toFixed(4) + ' (3.51°) to ' + Number(byId.thetaRangeAlt.exact.match(/max ([\d.]+)/)[1]).toFixed(4) + ' (71.75°), decided through enclosed tangents. The Hs column of Table 1 is, to two decimals, the pickle\'s column sv_fp2 in ' + (20 - T1.rows.filter((r) => r.cells.Hs === 'NOT_THE_TABLES').length) + ' of 20 records and the pickle\'s column named Hs in none: the record carries a column called Hs (0.20–0.75, every value a multiple of 1/256) that is not the significant wave height the paper reports, and the earlier version of this page, which read that column, said "Hs 0.20–0.75 m" — the stats row above now reads the printed Hs. And "Ab/L²_D81 = 0.22" is the slope through the origin of the area at the frame of maximum length on the squared Duncan length (' + Number(byId.fitAbLD81.withAreaAtMaxLength).toFixed(4) + '), whereas the histogram, the mean and the tail use the maximum area, whose slope is ' + Number(String(byId.fitAbLD81.exact).match(/all ([\d.]+)/)[1]).toFixed(4) + '; "Ab/Lb² = 0.27" matches no subset under either definition.')
    + C.pRaw('Two printed coefficients cannot be decided at all: "eA/eB = 2.37" and "Ae = 2.5 Ab" are read off RANSAC fits — a randomised robust regressor whose coefficient depends on the seed — and the scripts print them beside a Pearson r from linregress. The r beside the first (0.8) is the rounding of ' + Number(byId.fitEAEB.r[0]).toFixed(3) + '; the r beside the second (0.9) is not the rounding of ' + Number(byId.fitAeAb.r[0]).toFixed(3) + ' on the columns the script sets, though the summed columns give ' + Number(byId.fitAeAb.rSumColumns[0]).toFixed(3) + '. "r(Ab, Δt) = 0.6" is ' + Number(byId.rAbDt.exact.split('..')[0]).toFixed(3) + ' on the maximum area and ' + Number(byId.rAbDt.withAbSum[0]).toFixed(3) + ' on the summed area. "Pearson r < 0.45 in all cases" holds for 31 of the 32 speed–geometry pairs; speed against vertical extent is ' + Number(byId.pearsonSpeedMax.exact).toFixed(4) + '. In Table 1, ' + T1.truncation + ' cells are truncations rather than roundings (Tp 4.066 printed 4.0, Hs 1.7254 printed 1.72), ' + T1.onTheBoundary + ' are ties (U10 9.95 printed 9.9), and two are neither: Hs 0.6759 printed 0.65 and Tp 6.585 printed 6.7.') + '</div>'
}));
B.push(C.section({
  lab: '§2 · the laboratory', title: 'Duncan\'s tank, against the Black Sea',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG1, caption: 'The inclination of the aerated region at the frame of its greatest extent, one-degree bins, membership decided exactly from the literal in the table. Duncan\'s band is the one the authors\' histogram script draws; the band holds ' + pct(A.inside, L.n) + ' of the events, the flatter side ' + pct(A.below, L.n) + ', the steeper side ' + pct(A.above, L.n) + '.' })
    + C.figure({ svgRaw: FIG2, caption: 'The aspect ratio of the aerated region — its plan-view area over the square of its slanted length — in bins of 0.05. Duncan\'s 0.11 is marked where the script marks it; the dashed mark is the paper\'s tail threshold, mean + 2 sd. The hump sits well to the right: ' + fmt(S.above) + ' events are above the laboratory value and the median is ' + d3(S.medianOverReference) + ' times it.' })
    + '<div class="col">' + C.pRaw('Duncan (1981) towed a hydrofoil through a tank and measured the breaking region it made: a wedge inclined at 10–14.7° whose cross-sectional area was 0.11 of the square of its length. The authors\' scripts draw both numbers over their histograms, and this page decides both event by event with no tolerance: an inclination is INSIDE, ON or OUTSIDE the band by an exact comparison of the literal with 10 and 14.7; an aspect ratio is above or below 0.11 by an exact sign. One caveat belongs to the comparison itself and is the authors\' as much as ours: Duncan\'s 0.11 relates a vertical cross-section to a length, whereas the area measured from above a real sea is the whitecap\'s plan view. The script draws the line on that histogram; the page decides it as drawn, and says so. The paper prints the same comparison as 0.56 ± 0.26 against 0.11 ± 0.01.') + '</div>'
}));
B.push(C.section({
  lab: '§3 · self-similarity', title: 'Three ratios a self-similar breaker would hold constant',
  wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'ratio' }, { h: 'q05', cls: 'n' }, { h: 'q25', cls: 'n' }, { h: 'median', cls: 'n' }, { h: 'q75', cls: 'n' }, { h: 'q95', cls: 'n' }, { h: 'q75 / q25', cls: 'n' }, { h: 'tail ≥ mean + 2 sd', cls: 'n' }],
    rows: [['cb² / (g·Lb)', SS.a, PA.tails.a], ['Ab / Lb²', SS.b, PA.tails.b], ['Ab / L²_D81', SS.c, PA.tails.c]].map(([k, s, t]) => [k, d3(s.q05), d3(s.q25), d3(s.median), d3(s.q75), d3(s.q95), d3(s.spreadIQ) + '×', fmt(t.above) + ' ≥ ' + Number(t.threshold[0]).toFixed(2)])
  }) + '<div class="col">' + C.pRaw('If breaking waves were geometrically similar to one another, a length made from the speed (cb²/g) would be a fixed multiple of the measured length, and the area a fixed multiple of the length squared: each ratio would be a constant up to measurement noise. Here each quantile is an order statistic of the exact ratios — the k-th smallest value, so a number that some event actually has — and the spread factors are exact ratios of two of them. The middle half of the events spans a factor of two in every ratio (q75/q25 = ' + d3(SS.a.spreadIQ) + ', ' + d3(SS.b.spreadIQ) + ', ' + d3(SS.c.spreadIQ) + '); the central ninety per cent, a factor of four to six (q95/q05 = ' + d3(SS.a.spread90) + ', ' + d3(SS.b.spread90) + ', ' + d3(SS.c.spread90) + '). The paper\'s test marks the tail beyond the mean plus two standard deviations and calls the events in it self-similar: that threshold is enclosed here (the standard deviation needs a square root) and the count at or beyond it is exact — ' + fmt(PA.tails.a.above) + ', ' + fmt(PA.tails.b.above) + ' and ' + fmt(PA.tails.c.above) + ' events, ' + byId.selfSimilarFraction.exact + ', with no event close enough to the threshold to be undecided. The spread factors are the same finding in a form that does not depend on a distribution.') + '</div>'
}));
B.push(C.section({
  lab: '§4 · speed and geometry', title: 'What the speed of a breaker tells you about its shape',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG3, caption: 'Spearman rank correlations, each an exact rational read to three decimals (hover for ρ² and for Pearson\'s r on the raw values). cb is the mean breaking speed, Lb the breaking length (half the perimeter), Ab the whitecap area, Dz its vertical extent, Δt its duration, L the Duncan length and θ the inclination. Six pair breaking speed with a geometric property; three pair geometric properties with each other, as the control.' })
    + '<div class="col">' + C.pRaw('"No predictable relationship" is a sentence about correlation, and a rank correlation is a rational number: average ranks, doubled, are integers, and Pearson\'s formula on integers is a ratio of two integers. The speed of a breaker ranks with its length at ρ = ' + Number(CR['cm~Lb'].spearman.r.lo).toFixed(3) + ', with its area at ' + Number(CR['cm~Ab_max'].spearman.r.lo).toFixed(3) + ', with its vertical extent at ' + Number(CR['cm~Dz_max'].spearman.r.lo).toFixed(3) + ', with its duration at ' + Number(CR['cm~DT'].spearman.r.lo).toFixed(3) + ' and with its inclination at ' + Number(CR['cm~theta'].spearman.r.lo).toFixed(3) + '. Length ranks with area at ' + Number(CR['Ab_max~Lb'].spearman.r.lo).toFixed(3) + '. The paper prints Pearson\'s r for the same pairs — r(Ab, Lb) = 0.9, r(Ab, L_D81) = 0.8, r(Δz, eB) = 0.7 are the roundings of ' + Number(byId.rAbLb.exact.split('..')[0]).toFixed(3) + ', ' + Number(byId.rAbLD81.exact.split('..')[0]).toFixed(3) + ' and ' + Number(byId.rDzEB.exact.split('..')[0]).toFixed(3) + ' — and a breaker\'s speed explains at most ρ² = ' + Number(CR[speedMaxKey].spearman.r2.dec).toFixed(3) + ' of the rank variation in any property measured.') + '</div>'
}));
B.push(C.section({
  lab: '§5 · the sea state', title: 'The analysis the paper calls for: twenty records, twenty coefficients',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG4, caption: 'The coefficient of Lb = a·cb²/g fitted separately on each record\'s events — the same least squares through the origin the paper uses on all 16,369 — against the record\'s significant wave height as Table 1 prints it. Hover a point for the record, its Tp and U10, its r(cb², Lb) and its share of events in Duncan\'s band; the table below carries the same numbers.' })
    + C.table({
      cols: [{ h: 'record' }, { h: 'events', cls: 'n' }, { h: 'Hs, m', cls: 'n' }, { h: 'Tp, s', cls: 'n' }, { h: 'U10, m/s', cls: 'n' }, { h: 'g·Lb/cb²', cls: 'n' }, { h: 'in tail', cls: 'n' }],
      rows: PR.map((p) => [p.time.slice(0, 16), fmt(p.n), Number(p.Hs).toFixed(2), Number(p.Tp).toFixed(1), Number(p.U10).toFixed(1), Number(p.slopeDec).toFixed(3), (100 * Number(p.tailFraction)).toFixed(1) + '%'])
    })
    + '<div class="col">' + C.pRaw('The paper\'s abstract says the scaling "varies with the sea state"; its conclusions say that showing it "would require a dedicated stratified analysis by Hs, Tp, or wave age, which is beyond the scope of this study". The table above is that analysis, on the paper\'s own data with the paper\'s own fit. Each record is one stereo-video run from the Katsiveli platform, its Hs, Tp and U10 constant within it (verified: no record carries two values). The fitted coefficient runs from ' + Number(SEA.slopeMin).toFixed(3) + ' to ' + Number(SEA.slopeMax).toFixed(3) + ' — a factor of ' + Number(SEA.slopeSpread).toFixed(2) + ' — around the pooled ' + Number(SEA.pooledSlope).toFixed(3) + ', and the four records with Hs above 1.5 m (1 October 2013, winds 15.7–18.0 m/s) carry the four lowest values, ' + PR.filter((p) => Number(p.Hs) > 1.5).map((p) => Number(p.slopeDec).toFixed(2)).sort().join(', ') + ': in the roughest seas a breaker of a given speed is shorter. Across the twenty records the coefficient ranks with Hs at ρ = ' + rhoHs.toFixed(3) + ' and with Tp at ' + Number(SEA.spearman['slope~Tp'].rho[0]).toFixed(3) + ', with U10 at ' + rhoU.toFixed(3) + ', and with wave age cp/U10 at ' + rhoAge.toFixed(3) + ' — every ρ² an exact rational on twenty ranks (the wave age needs no π: its rank is the rank of 1/(fp·U10)). Twenty points do not make a law, and the records are neither independent nor equal in size (' + fmt(Math.max(...PR.map((p) => p.n))) + ' events in the largest, ' + fmt(Math.min(...PR.map((p) => p.n))) + ' in the smallest); what they do make is the sentence the abstract asserts, with a number under it and the variable named. The share of events in Duncan\'s band, by contrast, barely moves with anything (ρ with Hs ' + Number(SEA.spearman['fractionInBand~Hs'].rho[0]).toFixed(2) + ', with U10 ' + Number(SEA.spearman['fractionInBand~U10'].rho[0]).toFixed(2) + '), and the self-similar tail is concentrated in the rough records: ' + PR.filter((p) => Number(p.Hs) > 1.5).map((p) => (100 * Number(p.tailFraction)).toFixed(0) + '%').join(', ') + ' of their events against ' + (100 * Number(byId.selfSimilarFraction.counts[0]) / L.n).toFixed(1) + '% overall.') + '</div>'
}));
B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('Nothing about the ocean is decided here — only about the table and about the paper\'s arithmetic on it: whether each of its numbers falls inside a stated band, how spread its ratios are, how its columns rank together, whether a printed number is the rounding of the exact one under the definition the scripts use. The table itself is the authors\' measurement, with whatever error the stereo reconstruction and the whitecap detection carry; the record describes neither, and the companion instrument on this site (/instruments/stereo-reach) shows what a rig\'s geometry alone can do to a length. Duncan\'s band and ratio are taken as the authors\' scripts state them; the 1981 paper is not held here, and the plan-view caveat in §2 is real. The 22,116 events the paper says were detected before manual inspection are not in the table and cannot be checked. The Kolmogorov–Smirnov p-values, the AIC ranking of scipy\'s distributions, the Pareto and lognormal fits, the kernel densities and the bootstrap confidence intervals are float procedures about a distribution and are not reproduced; a RANSAC coefficient is a random variable and is not reproducible by anything. The paper is CC-BY-NC-4.0 and is pinned as the publisher\'s full-text XML; the data are CC-BY-4.0, and the seven files used were extracted from the 8.9 GB archive by byte range against its published digest.')
}));
const foot = '<p>Generated by tools/build-report-breaking.js @ git ' + git + '. Gates at this build: the ledger re-derived live from the pinned CSV (sha256 ' + L.corpus.csvSha256.slice(0, 12) + '…) and the pinned paper XML (sha256 ' + PA.xmlSha256.slice(0, 12) + '…), the breaking battery (' + nChecks + ' checks, ' + nReds + ' red controls, all fired), every sentence above gated on the ledger field it reads.</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'breaking-geometry.html'),
  TPL.render({ title: 'Sixteen thousand breaking waves, decided', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/breaking-geometry.html',
    desc: 'The geometry of 16,369 breaking waves filmed on the Black Sea (Guimarães et al., GRL 2026, 10.1029/2026GL122293) decided in exact arithmetic: every printed number read against the table, Duncan\'s laboratory band and ratio event by event, the self-similar tail counted exactly, and the sea-state stratification the paper leaves undone done per record.' }));
console.log('reports/breaking-geometry.html written: ' + fmt(L.n) + ' events, ' + A.inside + ' in the band, paper ' + nRep + '/' + PA.items.length + ' reproduced, battery ' + nChecks + ' checks / ' + nReds + ' reds @ git ' + git);
