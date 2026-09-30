/* numbers.js — every number Decidível's page and deck display, read from the
   records: the ledger (apps/decidivel/data/decidivel-ledger.json), the declared
   ranges and their sources (declared.json), and the UNISIM-IV porosity
   histogram (corpus/unisim-iv). ONE module for both consumers.
   apps/decidivel · cert-machine                                          MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const R = require('./engine/rockphys.js');
const APP = __dirname, ROOT = path.join(APP, '..', '..');
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const need = (c, m) => { if (!c) throw new Error('decidivel numbers: ' + m); };

function load() {
  const L = J(path.join(APP, 'data', 'decidivel-ledger.json'));
  const D = J(path.join(APP, 'declared.json'));
  const Hst = J(path.join(ROOT, 'corpus', 'unisim-iv', 'porosity-histogram.json'));
  const M = J(path.join(ROOT, 'corpus', 'unisim-iv', 'meta.json'));
  const nx = L.axes.phi.length, ny = L.axes.sg.length;
  need(nx === 30 && ny === 12, 'the grid is not 30 × 12');
  /* cells of the benchmark per map column: bins 0..29, the open bin above 0.30 folded into the last */
  const perCol = new Array(nx).fill(0);
  for (const k of Object.keys(Hst.counts)) Hst.counts[k].forEach((c, i) => { perCol[Math.min(i, nx - 1)] += c; });
  need(perCol.reduce((a, b) => a + b, 0) === Hst.active, 'the histogram does not add up to the active cells');
  const cls = (v, th) => R.classifyAbs({ lo: v[0], loA: v[1], hiA: v[2], hi: v[3] }, th);
  /* the benchmark's cells by verdict, for a scenario, a threshold and a gas-saturation row */
  function field(k, th, row) {
    const o = { PROVADO: 0, REFUTADO: 0, RECUSADO: 0, open: 0 };
    for (let i = 0; i < nx; i++) { const v = cls(L.maps[k][row * nx + i], th); o[v || 'open'] += perCol[i]; }
    return o;
  }
  const count = (k, th) => { const o = { PROVADO: 0, REFUTADO: 0, RECUSADO: 0, open: 0 }; L.maps[k].forEach((v) => { o[cls(v, th) || 'open']++; }); return o; };
  const H = L.headline;
  need(H.receipt.verdict === 'RECUSADO', 'the headline is no longer RECUSADO');
  return {
    L, D, perCol, field, count, cls,
    active: Hst.active, rockCounts: Object.fromEntries(Object.entries(Hst.counts).map(([k, v]) => [M.rockTypes[k], v.reduce((a, b) => a + b, 0)])),
    unisim: M, cells: nx * ny, boxes: nx * ny * L.scenarios.length, theta: Number(H.theta) * 100,
    H
  };
}
const br = {
  int: (x) => Math.round(x).toLocaleString('pt-BR'),
  dec: (x, d) => Number(x).toFixed(d).replace('.', ','),
  pct: (x, d) => Number(x).toFixed(d === undefined ? 2 : d).replace('.', ',') + '%'
};
module.exports = { load, br };
