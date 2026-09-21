#!/usr/bin/env node
/* run-breaking-ledger.js — the Black Sea breaking-wave table decided against
   the references its own scripts draw, in exact arithmetic. Writes
   certs/breaking-ledger.json.

   usage: node tools/run-breaking-ledger.js           (about two seconds)
          node tools/run-breaking-ledger.js --check   re-derive and compare with the shipped ledger, write nothing */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const L = require(path.join(ROOT, 'instruments', 'breaking', 'lib.js'));
const D = require(path.join(ROOT, 'instruments', 'breaking', 'decide.js'));
const PP = require(path.join(ROOT, 'instruments', 'breaking', 'paper.js'));
const TR = require(path.join(ROOT, 'instruments', 'interval', 'transcendental.js'));
const Q = L.Q;
const die = (m) => { console.error('BREAKING LEDGER REFUSED: ' + m); process.exit(1); };
const CHECK = process.argv.includes('--check');
const OUT = path.join(ROOT, 'certs', 'breaking-ledger.json');

/* ---- the pins ---- */
const meta = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'meta.json'), 'utf8'));
const claims = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'claims.json'), 'utf8'));
for (const [rel, m] of Object.entries(Object.assign({}, meta.files, meta.paper.files))) {
  const p = path.join(L.CORPUS, rel);
  if (!fs.existsSync(p)) die('corpus/blacksea-breaking/' + rel + ' is absent');
  if (crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') !== m.sha256) die('corpus/blacksea-breaking/' + rel + ' does not hash to its pin');
}
const t0 = Date.now();
const T = L.readTable();
if (T.rows.length !== claims.table.rows || T.cols.length !== claims.table.columnCount) die('the table is not ' + claims.table.rows + ' × ' + claims.table.columnCount);
if (meta.files['blacksea_data.csv'] && T.sha256 !== meta.files['blacksea_data.csv'].sha256) die('the CSV does not hash to its pin');
const R = D.decide(T, claims.references, TR.PI);
const PR = PP.decidePaper(T, claims);

/* ---- serialise: every rational as an exact string and a 6-decimal reading ---- */
const S = (q) => ({ exact: Q.toString(q), dec: L.dec(q, 6) });
const SI = (iv) => ({ lo: L.dec(iv[0], 9), hi: L.dec(iv[1], 9) });
const qs = (Qn) => ({ n: Qn.n, min: S(Qn.min), max: S(Qn.max), q05: S(Qn.q['0.05']), q25: S(Qn.q['0.25']), median: S(Qn.q['0.5']), q75: S(Qn.q['0.75']), q95: S(Qn.q['0.95']), spreadIQ: S(Qn.spreadIQ), spread90: S(Qn.spread90) });
const corr = {};
for (const [k, v] of Object.entries(R.corr)) corr[k] = { spearman: { r2: S(v.spearman.r2), r: SI(v.spearman.r) }, pearson: { r2: S(v.pearson.r2), r: SI(v.pearson.r) } };
const records = Object.entries(R.records).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => ({ rec: k, n: v.n, wnd: L.dec(v.wnd, 2), Hs: L.dec(v.Hs, 3), fp: L.dec(v.fp, 4), constant: v.constant }));
const ledger = {
  what: 'The Black Sea breaking-wave table (Zenodo 10.5281/zenodo.18408002) decided in exact arithmetic against the references its own analysis scripts draw — Duncan (1981)\'s inclination band and aspect ratio event by event, the three self-similarity ratios as order statistics with exact spread factors, the breaking speed as a fraction of the peak phase speed (π enclosed), rank correlations between speed and geometry as exact rationals — and, under `paper`, every number printed in Guimarães, Stringari, Filipot, Leckler, Benetazzo, Chapron, GRL 2026-09-16 (10.1029/2026GL122293) read against the table with the scripts\' own definitions, plus the per-record stratification the paper leaves undone.',
  generated: new Date().toISOString().slice(0, 10),
  corpus: { doi: meta.record.doi, archiveMd5: meta.record.md5, csvSha256: T.sha256, rows: T.rows.length, columns: T.cols.length },
  conventions: { quantile: 'the k-th smallest value, k = ceil(p·n): a value that occurs in the table', ranks: 'average ranks for ties; Spearman ρ is Pearson r on them, exact', sqrt: 'r is enclosed to 12 decimals by integer square roots; r² is exact', pi: 'cm/cp uses the certified enclosure of π; each quantile is an enclosure', g: claims.references.g.value, Lb: claims.references.Lb.definition },
  n: R.n, records,
  duncan: {
    angle: Object.assign({ band: [claims.references.duncanAngle.lo, claims.references.duncanAngle.hi] }, R.angle, { fractionInside: S(Q.R(BigInt(R.angle.inside), BigInt(R.n))) }),
    aspect: { reference: claims.references.duncanAspect.value, above: R.aspect.above, equal: R.aspect.equal, below: R.aspect.below, within25pc: R.aspect.within25pc, within50pc: R.aspect.within50pc, medianOverReference: S(R.aspect.medianOverDuncan), distribution: qs(R.ratios.c) },
  },
  selfSimilarity: { a: qs(R.ratios.a), b: qs(R.ratios.b), c: qs(R.ratios.c) },
  cmOverCp: { q05: SI(R.cmcp.q['0.05']), q25: SI(R.cmcp.q['0.25']), median: SI(R.cmcp.q['0.5']), q75: SI(R.cmcp.q['0.75']), q95: SI(R.cmcp.q['0.95']), fasterThanHalfCp: R.fasterThanHalfCp },
  correlations: corr,
  distinct: R.distinct,
  paper: {
    doi: claims.paper.doi, published: claims.paper.published, citation: claims.paper.citation, xmlSha256: meta.paper.files['paper/grl.xml'].sha256,
    verdicts: 'REPRODUCED: the printed literal is the rounding of the exact value (both ends of an enclosure, where one is needed). TRUNCATION: not the rounding but the truncation. ON_THE_BOUNDARY: the exact value is a rounding tie. NOT_THE_TABLES: none of these under the definition the scripts use. NOT_DECIDABLE_RANSAC: a coefficient printed from a randomised fitter, not reproducible by any exact procedure; the least-squares slope and the Pearson r are given beside it. REPRODUCED_AS_TRUNCATION: the printed pair is the integer parts of the values under the definition named.',
    items: PR.items, table1: PR.table1, tails: PR.tails, pooledR: PR.pooledR, speedPearson: PR.speedPearson,
    columnIdentity: 'the table\'s column named Hs (0.20–0.75, multiples of 1/256) rounds to the printed Hs of Table 1 in ' + PR.table1.HsNamedColumnMatches + ' of 20 records; the column named sv_fp2 does in ' + PR.table1.rows.filter((x) => x.cells.Hs === 'REPRODUCED' || x.cells.Hs === 'TRUNCATION').length + ' of 20 — the printed Hs is sv_fp2',
    perRecord: PR.perRecord, seaState: PR.seaState,
  },
  seconds: Number(((Date.now() - t0) / 1000).toFixed(2)),
};
console.log('  ' + R.n + ' events, ' + records.length + ' records; angle inside ' + R.angle.inside + ' (' + L.dec(Q.mul(Q.R(100n), Q.R(BigInt(R.angle.inside), BigInt(R.n))), 1) + '%); aspect above ' + R.aspect.above + ', median/0.11 = ' + L.dec(R.aspect.medianOverDuncan, 3));
console.log('  self-similarity spread q75/q25: a ' + L.dec(R.ratios.a.spreadIQ, 3) + ', b ' + L.dec(R.ratios.b.spreadIQ, 3) + ', c ' + L.dec(R.ratios.c.spreadIQ, 3) + '; q95/q05: a ' + L.dec(R.ratios.a.spread90, 3) + ', b ' + L.dec(R.ratios.b.spread90, 3) + ', c ' + L.dec(R.ratios.c.spread90, 3));
for (const [k, v] of Object.entries(corr)) console.log('  ρ ' + k.padEnd(12) + v.spearman.r.lo + ' (r ' + v.pearson.r.lo + ')');
const tallyV = {}; for (const it of PR.items) tallyV[it.verdict] = (tallyV[it.verdict] || 0) + 1;
console.log('  paper: ' + PR.items.length + ' printed numbers — ' + JSON.stringify(tallyV) + '; Table 1 cells ' + PR.table1.reproduced + ' rounded, ' + PR.table1.truncation + ' truncated, ' + PR.table1.onTheBoundary + ' on a tie, ' + PR.table1.notTheTables + ' neither, of ' + PR.table1.cells);
console.log('  per record: slope g·Lb/cb² from ' + PR.seaState.slopeMin + ' to ' + PR.seaState.slopeMax + ' (' + PR.seaState.slopeSpread + '×); ρ(slope, Hs) = ' + PR.seaState.spearman['slope~Hs'].rho[0] + ', ρ(slope, wave age) = ' + PR.seaState.spearman['slope~waveAge'].rho[0]);
console.log('  cm/cp median ' + ledger.cmOverCp.median.lo + '..' + ledger.cmOverCp.median.hi + '; ' + R.fasterThanHalfCp + ' events faster than cp/2  (' + ledger.seconds + ' s)');

if (CHECK) {
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null, seconds: null }));
  if (strip(old) !== strip(ledger)) die('the re-derived ledger differs from certs/breaking-ledger.json');
  console.log('  --check: the shipped ledger re-derives identically');
} else {
  fs.writeFileSync(OUT, JSON.stringify(ledger, null, 1) + '\n');
  console.log('  certs/breaking-ledger.json written');
}
