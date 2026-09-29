#!/usr/bin/env node
/* run-design-table-audit.js — a printed design table decided against the nearest cells of the return-level atlas.
   Writes certs/design-table-audit.json; `--check` re-derives it and refuses on any difference.

   THE TABLE is corpus/design-tables/bhaskaran-2023.json: annual-maximum Hs fits printed for five South Atlantic
   offshore-wind lease areas (Gumbel by least squares, maximum likelihood and moments; GEV by maximum likelihood), made
   from a commercial hindcast (WaveClimate, 1992–2022) nobody outside it can re-run. THE RECORD it is decided against
   is the paper's public hindcast (Ifremer GLOBMULTI_ERA5_GLOBCUR_01, 1993–2024) at the two nearest open-sea cells of
   corpus/ww3-grid, each file checked against its sha256: the calendar-year maxima by THE block rule, the Gumbel and
   the GEV certified by instruments/hseva/fit.js, and the printed digits decided by THE decision of a printed fit
   (playground/return-level-check/printed.js — the atlas's tab and the return-level check run the same bytes).

   What a verdict here says: whether the printed digits are this record's maximum-likelihood fit. The two records are
   different hindcasts at points up to tens of kilometres apart, so OFF THE MAXIMUM measures how far apart the two
   records' fits lie, not an error in the table; the printed and certified 100-year waves are set side by side with
   the certified fit's 95% delta interval beside them — STATISTICAL, labelled, never an enclosure.

   usage: node tools/run-design-table-audit.js [--check] */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const FT = require(path.join(ROOT, 'instruments', 'hseva', 'fit.js'));
const { FAMILIES } = require(path.join(ROOT, 'instruments', 'hseva', 'families.js'));
const BR = require(path.join(ROOT, 'instruments', 'hseva', 'blockrule.js'));
const PRINTED_REL = 'playground/return-level-check/printed.js';
const PR = require(path.join(ROOT, PRINTED_REL));
const { CORE } = require(path.join(ROOT, 'playground', 'return-level-check', 'bundle.js'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const die = (m) => { console.error('design-table-audit: ' + m); process.exit(1); };

const TABLE_REL = 'corpus/design-tables/bhaskaran-2023.json', OUT = path.join(ROOT, 'certs', 'design-table-audit.json');
const tableBytes = fs.readFileSync(path.join(ROOT, TABLE_REL)), TB = JSON.parse(tableBytes);
const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ww3-grid', 'meta.json'), 'utf8'));
const H = { FT, FAM: { FAMILIES } }, T = [100, 1000];
const METHODS = [['gumbelLS', 'gumbel'], ['gumbelML', 'gumbel'], ['gumbelMOM', 'gumbel'], ['gevML', 'gev']];
/* the GEV printed as (k, σ, µ) with k = −ξ: the digits of ξ are the digits of k with the sign changed, the box the same box negated */
const neg = (s) => (s.startsWith('-') ? s.slice(1) : '-' + s);
const asDecided = (m, P) => (m === 'gevML' ? [P.mu, P.sigma, neg(P.k)] : P);
/* the great-circle distance; the nearest cells among those the atlas certifies (open sea) */
const R = Math.PI / 180, km = (a, b, c, d) => 6371 * Math.acos(Math.min(1, Math.sin(a * R) * Math.sin(c * R) + Math.cos(a * R) * Math.cos(c * R) * Math.cos((b - d) * R)));
const up8 = (v, u) => { if (!Number.isFinite(v)) return v; let s = Number(v.toPrecision(8)); if (u ? s < v : s > v) s = Number((u ? s + Math.pow(10, Math.floor(Math.log10(Math.abs(s))) - 7) : s - Math.pow(10, Math.floor(Math.log10(Math.abs(s))) - 7)).toPrecision(8)); return s; };
const iv8 = (a) => (a ? [up8(a[0], false), up8(a[1], true)] : null);
const s4 = (v, u) => { if (!Number.isFinite(v)) return null; const st = Math.pow(10, Math.floor(Math.log10(Math.abs(v))) - 3); return Number(((u ? Math.ceil(v / st) : Math.floor(v / st)) * st).toPrecision(4)); };

function cellSeries(c) {
  const buf = fs.readFileSync(path.join(ROOT, 'corpus', 'ww3-grid', c.file));
  if (sha(buf) !== c.sha256) die(c.id + ': the cell file is not the pinned bytes');
  const v = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2), d0 = Date.parse(M.first + 'T00:00:00Z'), t = [], h = [];
  for (let i = 0; i < v.length; i++) { if (!(v[i] > 0)) die(c.id + ': day ' + i + ' is not a positive value'); t.push(new Date(d0 + i * 864e5).toISOString().slice(0, 10)); h.push(v[i] / 500); }
  return { n: v.length, t, h, den: 500, step: 24 };
}
function fitOf(f, BM) {
  const c = FT.certify(f, BM.x), r = PR.recordOf(H, c, T, BM.hours);
  if (!r.certified) return { rec: r, out: { c: 0, why: r.why } };
  let d = null; try { d = FT.deltaLevel(c, 100, BM.hours); } catch (e) { d = null; }
  return { rec: r, out: { c: 1, box: r.box.map(iv8), ll: iv8(r.ll), l100: iv8(r.returnLevel[100]), l1000: iv8(r.returnLevel[1000]), s100: d ? [s4(d.lo, false), s4(d.hi, true)] : null } };
}
function build() {
  const sea = M.cells.filter((c) => c.status === 'sea');
  const rows = TB.rows.map((row) => {
    const near = sea.map((c) => [km(row.lat, row.lon, c.lat, c.lon), c]).sort((a, b) => a[0] - b[0]).slice(0, 2);
    const cells = near.map(([d, c]) => {
      const BM = BR.blockMaxima(cellSeries(c), 'annual');
      let mx = -Infinity, sum = 0; for (const x of BM.x) { if (x > mx) mx = x; sum += x; }
      const fits = { gumbel: fitOf('gumbel', BM), gev: fitOf('gev', BM) };
      const decided = {};
      for (const [m, f] of METHODS) {
        const strs = asDecided(m, row[m]);
        const D = PR.decide(H, { f, strs, loc: '', x: BM.x, hours: BM.hours, fit: fits[f].rec, lognormal: null, T });
        let L = null; try { L = FT.levelAt(f, strs.map(FT.printedBox), null, 100, BM.hours); } catch (e) { L = null; }
        decided[m] = { family: f, digits: strs, verdict: D.code, printed100: iv8(L) };
      }
      return { id: c.id, km: Math.round(d), sha256: c.sha256, years: BM.n, first: BM.keys[0], last: BM.keys[BM.n - 1], mean: Number((sum / BM.n).toFixed(3)), max: mx, gumbel: fits.gumbel.out, gev: fits.gev.out, decided };
    });
    return { la: row.la, name: row.name, lat: row.lat, lon: row.lon, depth: row.depth, cells };
  });
  const all = rows.flatMap((r) => Object.values(r.cells[0].decided).map((q) => q.verdict));
  const count = (v) => all.filter((x) => x === v).length;
  const diffs = rows.flatMap((r) => Object.entries(r.cells[0].decided).map(([m, q]) => {
    const f = q.family, c = r.cells[0][f];
    return c.c && q.printed100 ? { la: r.la, method: m, printed: q.printed100[1], certified: c.l100[1], d: Number((q.printed100[1] - c.l100[1]).toFixed(2)), outside: c.s100 ? q.printed100[0] > c.s100[1] || q.printed100[1] < c.s100[0] : null } : null;
  }).filter(Boolean));
  const sameAtSecond = rows.every((r) => Object.keys(r.cells[0].decided).every((m) => r.cells[0].decided[m].verdict === r.cells[1].decided[m].verdict));
  const code = { [PRINTED_REL]: sha(fs.readFileSync(path.join(ROOT, PRINTED_REL))) };
  for (const [, rel] of CORE) code[rel] = sha(fs.readFileSync(path.join(ROOT, rel)));
  return {
    what: 'A printed design table decided against the nearest open-sea cells of the return-level atlas. The table: ' + TB.source.citation + ' — annual-maximum Hs fits for the five South Atlantic lease areas (Table 3), from a commercial hindcast (WaveClimate, 1992–2022) that cannot be re-run outside it. The record: the paper\'s public hindcast (Ifremer GLOBMULTI_ERA5_GLOBCUR_01, 1993–2024, CC BY-SA 4.0) at the two nearest cells of corpus/ww3-grid, their calendar-year maxima by THE block rule, the Gumbel and the GEV certified (fit.js), the printed digits decided by ' + PRINTED_REL + '. A verdict says whether the digits are THIS record\'s maximum-likelihood fit; the two records are different hindcasts at different points, so OFF THE MAXIMUM measures how far apart their fits lie, not an error in the table.',
    generated: new Date().toISOString().slice(0, 10),
    table: { file: TABLE_REL, sha256: sha(tableBytes), source: TB.source },
    conventions: {
      block: 'annual: the calendar year\'s largest daily maximum (instruments/hseva/blockrule.js), 32 values at every cell',
      gev: 'the table prints (k, σ, µ) with F = exp(−(1 − k(x − µ)/σ)^{1/k}); decided as (µ, σ, ξ) with ξ = −k — the digits of k with the sign changed',
      levels: 'printed100: the 100-year level over every value the printed digits allow, on these annual blocks; l100/l1000: the certified fit\'s, enclosures printed outward to eight digits',
      s100: 'STATISTICAL, NOT CERTIFIED: the delta method\'s 95% interval on the certified fit\'s 100-year level (fit.js deltaLevel, on ln q), four figures rounded outward',
      cells: 'cells[0] is the nearest open-sea cell, cells[1] the next; km by great circle from the printed coordinates',
    },
    code,
    rows,
    summary: { decided: all.length, verdicts: Object.fromEntries([...new Set(all)].map((v) => [v, count(v)])), sameAtSecondCell: sameAtSecond, levels: diffs },
  };
}

const L = build();
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no ledger to check');
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
  if (strip(old) !== strip(L)) die('the ledger is not what the table, the cells and the code give now');
  console.log('design-table-audit: the ledger re-derived, identical (' + L.summary.decided + ' printed fits)');
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('design-table-audit: ' + L.summary.decided + ' printed fits decided at the nearest cells — ' + Object.entries(L.summary.verdicts).map(([k, v]) => v + ' ' + k).join(', ') + '; the same verdicts at the second-nearest cell: ' + L.summary.sameAtSecondCell);
  for (const r of L.rows) console.log('  LA' + r.la + ' ' + r.name.padEnd(16) + ' → ' + r.cells.map((c) => c.id + ' ' + c.km + ' km').join(', ') + ' · ' + Object.entries(r.cells[0].decided).map(([m, q]) => m + ' ' + q.verdict).join(' · '));
  for (const d of L.summary.levels) console.log('  LA' + d.la + ' ' + d.method.padEnd(10) + ' printed 100-yr ' + d.printed.toFixed(2) + ' m, certified ' + d.certified.toFixed(2) + ' m (' + (d.d > 0 ? '+' : '') + d.d.toFixed(2) + '), outside the 95%: ' + d.outside);
}
