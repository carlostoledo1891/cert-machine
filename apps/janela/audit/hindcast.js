/* hindcast.js — the 32-year WAVEWATCH III record at a Janela site, verified.
   apps/janela/audit · cert-machine

   Reads corpus/ww3-points (Ifremer GLOBMULTI_ERA5_GLOBCUR_01, 0.5°, 3-hourly,
   1993–2024, CC BY-SA 4.0 — the hindcast of the LabECO method paper), checks
   every monthly file against the sha256 pinned in meta.json, and returns one
   continuous series per node. A file that does not hash to its pin, or a
   time axis with a hole or a repeat, is REFUSED: the counts built on it
   would be counts of something else.

   MIT licensed (the series keep their CC BY-SA licence). Part of cert-machine. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..', '..');
const DIR = path.join(ROOT, 'corpus', 'ww3-points');

function load(node) {
  const meta = JSON.parse(fs.readFileSync(path.join(DIR, 'meta.json'), 'utf8'));
  const files = Object.keys(meta.files).sort();
  const x = [], times = [];
  for (const f of files) {
    const buf = fs.readFileSync(path.join(DIR, f));
    const h = crypto.createHash('sha256').update(buf).digest('hex');
    if (h !== meta.files[f].sha256) throw new Error('REFUSED: ' + f + ' does not hash to its pin');
    const m = JSON.parse(buf.toString('utf8'));
    const p = m.points[node];
    if (!p) throw new Error('REFUSED: node ' + node + ' is not in ' + f);
    if (p.length !== m.times.length) throw new Error('REFUSED: ' + f + ' ' + node + ' length mismatch');
    for (let k = 0; k < p.length; k++) { x.push(p[k]); times.push(m.times[k]); }
  }
  /* the time axis must be exactly 3-hourly with no hole and no repeat */
  for (let k = 1; k < times.length; k++) {
    const dt = (Date.parse(times[k] + ':00Z') - Date.parse(times[k - 1] + ':00Z')) / 3600e3;
    if (dt !== 3) throw new Error('REFUSED: time axis breaks at ' + times[k - 1] + ' -> ' + times[k]);
  }
  return { node, x, times, stepH: 3, scale: 500, fill: -32767, from: times[0], to: times[times.length - 1],
    source: 'Ifremer WAVEWATCH III GLOBMULTI_ERA5_GLOBCUR_01 (GLOB-30M), doi:10.12770/857a3337-f59a-481a-bf98-5561e8b61e7b, CC BY-SA 4.0',
    pinned: files.length + ' monthly files, each sha256-checked against corpus/ww3-points/meta.json' };
}

module.exports = { load };
