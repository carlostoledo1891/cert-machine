/* instruments/hseva/blocks.js — the significant-wave-height series and their
   block maxima.

   Two sources, one shape: a series is { t, h, den, step } — timestamps, values,
   the denominator every value is an exact multiple of (so the χ² binning can
   be decided in rationals), and the native step in hours.
     · the benchmark's NDBC buoys A, B, C (corpus/ec-benchmark): hourly Hs to four
       decimals (den 10⁴), ten provided years and ten retained years each; the
       provided years alone are what the benchmark's participants fitted;
     · the Ifremer WAVEWATCH III hindcast of the Ocean Engineering 2026 paper at
       the grid points of corpus/ww3-points (tools/fetch-ww3-points.py): 3-hourly,
       raw int16 / 500 m (den 500), 1993–2024; fill values dropped and counted.
   A block maximum is the largest value in a calendar block — day, ISO week,
   month or year of the UTC timestamp — which is exact because the values are
   exact multiples of 1/den. The native block is the series itself: hourly for
   the buoys, 3-hourly for the hindcast, the paper's "unfiltered" data. */
'use strict';
const fs = require('fs');
const path = require('path');
const EL = require(path.join(__dirname, '..', 'ecbench', 'lib.js'));
const ROOT = path.resolve(__dirname, '..', '..');

const BUOYS = { A: ['datasets/A.txt', 'datasets-retained/Ar.txt'], B: ['datasets/B.txt', 'datasets-retained/Br.txt'], C: ['datasets/C.txt', 'datasets-retained/Cr.txt'] };

const { BLOCKS, blockMaxima, isoWeek } = require('./blockrule.js');   /* the one block rule */

function series(buoy, opts) {
  const rels = (opts && opts.provided) ? BUOYS[buoy].slice(0, 1) : BUOYS[buoy];
  const parts = rels.map((rel) => EL.readDataset(rel));
  const t = [], h = [], tz = []; let dropped = 0;
  for (const p of parts) for (let i = 0; i < p.n; i++) { if (!Number.isFinite(p.h[i]) || !(p.h[i] > 0)) { dropped++; continue; } t.push(p.t[i]); h.push(p.h[i]); tz.push(p.u[i]); }
  return { source: 'ndbc', name: buoy, files: parts.map((p) => ({ rel: p.rel, sha256: p.sha256, n: p.n })), n: h.length, dropped, t, h, tz, den: 10000, step: 1, years: new Set(t.map((x) => x.slice(0, 4))).size };
}

/* the hindcast at one grid point, assembled from the pinned monthly extractions */
function ww3Series(point) {
  const dir = path.join(ROOT, 'corpus', 'ww3-points', 'months');
  const files = fs.readdirSync(dir).filter((f) => /^\d{6}\.json$/.test(f)).sort();
  const t = [], h = []; let dropped = 0;
  for (const f of files) {
    const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const v = r.points[point];
    if (!v) throw new Error('ww3: ' + f + ' has no point ' + point);
    for (let i = 0; i < r.steps; i++) { if (v[i] === r.hs.fill || !(v[i] > 0)) { dropped++; continue; } t.push(r.times[i]); h.push(v[i] / 500); }
  }
  return { source: 'ww3', name: point, months: files.length, n: h.length, dropped, t, h, den: 500, step: 3, years: new Set(t.map((x) => x.slice(0, 4))).size };
}

module.exports = { BUOYS, BLOCKS, series, ww3Series, blockMaxima, isoWeek };
