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
const TR = require(path.join(ROOT, 'instruments', 'interval', 'transcendental.js'));
const Q = L.Q;
const die = (m) => { console.error('BREAKING LEDGER REFUSED: ' + m); process.exit(1); };
const CHECK = process.argv.includes('--check');
const OUT = path.join(ROOT, 'certs', 'breaking-ledger.json');

/* ---- the pins ---- */
const meta = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'meta.json'), 'utf8'));
const claims = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'claims.json'), 'utf8'));
for (const [rel, m] of Object.entries(meta.files)) {
  const p = path.join(L.CORPUS, rel);
  if (!fs.existsSync(p)) die('corpus/blacksea-breaking/' + rel + ' is absent');
  if (crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') !== m.sha256) die('corpus/blacksea-breaking/' + rel + ' does not hash to its pin');
}
const t0 = Date.now();
const T = L.readTable();
if (T.rows.length !== claims.table.rows || T.cols.length !== claims.table.columnCount) die('the table is not ' + claims.table.rows + ' × ' + claims.table.columnCount);
if (meta.files['blacksea_data.csv'] && T.sha256 !== meta.files['blacksea_data.csv'].sha256) die('the CSV does not hash to its pin');
const R = D.decide(T, claims.references, TR.PI);

/* ---- serialise: every rational as an exact string and a 6-decimal reading ---- */
const S = (q) => ({ exact: Q.toString(q), dec: L.dec(q, 6) });
const SI = (iv) => ({ lo: L.dec(iv[0], 9), hi: L.dec(iv[1], 9) });
const qs = (Qn) => ({ n: Qn.n, min: S(Qn.min), max: S(Qn.max), q05: S(Qn.q['0.05']), q25: S(Qn.q['0.25']), median: S(Qn.q['0.5']), q75: S(Qn.q['0.75']), q95: S(Qn.q['0.95']), spreadIQ: S(Qn.spreadIQ), spread90: S(Qn.spread90) });
const corr = {};
for (const [k, v] of Object.entries(R.corr)) corr[k] = { spearman: { r2: S(v.spearman.r2), r: SI(v.spearman.r) }, pearson: { r2: S(v.pearson.r2), r: SI(v.pearson.r) } };
const records = Object.entries(R.records).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => ({ rec: k, n: v.n, wnd: L.dec(v.wnd, 2), Hs: L.dec(v.Hs, 3), fp: L.dec(v.fp, 4), constant: v.constant }));
const ledger = {
  what: 'The Black Sea breaking-wave table (Guimarães, Stringari, Leckler, Ardhuin, Zenodo 10.5281/zenodo.18408002) decided in exact arithmetic against the references its own analysis scripts draw: Duncan (1981)\'s inclination band and aspect ratio event by event, the three self-similarity ratios as order statistics with exact spread factors, the breaking speed as a fraction of the peak phase speed (π enclosed), and rank correlations between speed and geometry as exact rationals.',
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
  seconds: Number(((Date.now() - t0) / 1000).toFixed(2)),
};
console.log('  ' + R.n + ' events, ' + records.length + ' records; angle inside ' + R.angle.inside + ' (' + L.dec(Q.mul(Q.R(100n), Q.R(BigInt(R.angle.inside), BigInt(R.n))), 1) + '%); aspect above ' + R.aspect.above + ', median/0.11 = ' + L.dec(R.aspect.medianOverDuncan, 3));
console.log('  self-similarity spread q75/q25: a ' + L.dec(R.ratios.a.spreadIQ, 3) + ', b ' + L.dec(R.ratios.b.spreadIQ, 3) + ', c ' + L.dec(R.ratios.c.spreadIQ, 3) + '; q95/q05: a ' + L.dec(R.ratios.a.spread90, 3) + ', b ' + L.dec(R.ratios.b.spread90, 3) + ', c ' + L.dec(R.ratios.c.spread90, 3));
for (const [k, v] of Object.entries(corr)) console.log('  ρ ' + k.padEnd(12) + v.spearman.r.lo + ' (r ' + v.pearson.r.lo + ')');
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
