#!/usr/bin/env node
/* run.js — the hunt, over every set and model already on disk, plus the two
   synthetic sets that decide whether the hunter works at all.
   node playground/shape-hunt/run.js

   No model calls. Everything here is arithmetic on answers already given.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./hunt.js');
const E = require('./engine.js');
const { NULLS, RING_K, EPS, regularNgon, noiseD, hunt, nearestShape, symmetry, nullHunt, certify, coords } = E;
const HERE = __dirname;

const G = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'neural-geometry', 'out', 'geometry.json'), 'utf8'));
console.log(`calibration: a perfect 12-gon on this integer grid produces Ptolemy dips to ${(-EPS).toFixed(5)} from rounding alone — that is the floor, and nothing above it is counted as a violation.`);

const rows = [];
const cases = [];
for (const s of G.sets) for (const m of s.models) {
  if (m.incomplete) continue;
  cases.push({ set: s.id, shape: s.shape, model: m.id, items: s.items, D: m.D, pts: m.pts, synthetic: false });
}
cases.push({ set: 'a perfect 12-gon', shape: 'synthetic', model: 'not a model', synthetic: true,
  items: Array.from({ length: 12 }, (_, i) => 'p' + i), D: regularNgon(12), pts: 'mds' });
cases.push({ set: 'pure noise', shape: 'synthetic', model: 'not a model', synthetic: true,
  items: Array.from({ length: 12 }, (_, i) => 'n' + i), D: noiseD(12), pts: 'mds' });

for (const c of cases) {
  const rnd = H.seeded(20260904);
  const h = hunt(c.D);
  const nl = nullHunt(c.D, rnd);
  const sym = symmetry(c.D, rnd);
  const near = nearestShape(c.D, rnd);
  const ex = certify(c.D, h);
  rows.push({
    set: c.set, shape: c.shape, model: c.model, synthetic: c.synthetic, items: c.items,
    n: h.n, tests: h.tests, pts: c.pts === 'mds' ? coords(c.D) : c.pts, D: c.D,
    found: {
      collinear: { sub: h.collinear.s, screen: h.collinear.v, exact: ex.collinear, null: nl.collinear, beats: ex.collinear < nl.collinear },
      equilateral: { sub: h.equilateral.s, screen: h.equilateral.v, exact: ex.equilateral, null: nl.equilateral, beats: ex.equilateral < nl.equilateral },
      concyclic: { sub: h.concyclic.s, screen: h.concyclic.v, exact: ex.concyclic, null: nl.concyclic, beats: ex.concyclic < nl.concyclic },
      rings: Object.fromEntries(Object.keys(h.rings).map((k) => [k, {
        sub: h.rings[k].s, screen: h.rings[k].v, exact: ex.rings[k], null: nl.rings[k], beats: ex.rings[k] < nl.rings[k],
      }])),
    },
    ringWhole: h.ring_whole,
    ptolemy: h.ptolemy, triangle: h.triangle,
    symmetry: sym, nearest: near,
    nullTrials: nl.trials,
  });
  process.stdout.write(`\r  hunted ${rows.length}/${cases.length}  ${c.set} · ${c.model.replace('claude-','')}          `);
}
process.stdout.write('\n');

const totalTests = rows.reduce((a, r) => a + r.tests * (1 + r.nullTrials), 0);
const out = { meta: { date: new Date().toISOString().slice(0, 10), cases: rows.length, nulls: NULLS, totalTests, eps: EPS }, rows };
fs.writeFileSync(path.join(HERE, 'out', 'shapes.json'), JSON.stringify(out) + '\n');

const f = (v) => (v === null || v === undefined ? '  —  ' : v.toFixed(4));
console.log(`\n${'set'.padEnd(16)} ${'model'.padEnd(10)} ${'concyclic'.padStart(9)} ${'vs null'.padStart(8)} ${'best ring'.padStart(9)} ${'vs null'.padStart(8)} ${'symmetry'.padStart(9)} ${'vs null'.padStart(8)}  ptolemy viol`);
for (const r of rows) {
  const rk = Object.keys(r.found.rings).map((k) => [k, r.found.rings[k]]).sort((a, b) => a[1].exact - b[1].exact)[0];
  console.log(`${r.set.padEnd(16)} ${r.model.replace('claude-', '').padEnd(10)} `
    + `${f(r.found.concyclic.exact)} ${f(r.found.concyclic.null).padStart(8)} `
    + `${(rk ? f(rk[1].exact) : '—').padStart(9)} ${(rk ? f(rk[1].null) : '—').padStart(8)} `
    + `${f(r.symmetry.best.defect).padStart(9)} ${f(r.symmetry.nullP05).padStart(8)}  `
    + `${(r.ptolemy.violations + '/' + r.ptolemy.of).padStart(9)}  `
    + `${(r.nearest ? r.nearest.best.name + ' ' + r.nearest.best.d.toFixed(3) + (r.nearest.best.d < r.nearest.nullP05 ? ' ✓' : ' ✗') : '').padEnd(30)}`
    + `${r.symmetry.best.defect < r.symmetry.nullMatched ? 'SYM ' + r.symmetry.best.kind : ''}`);
}
console.log(`\n${totalTests.toLocaleString('en-US')} shape tests · ${NULLS} shuffles per case · out/shapes.json`);
