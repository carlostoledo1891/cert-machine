#!/usr/bin/env node
/* run.js — produce the record: certs/agtable-redecided.json (the page reads only this).
   usage: node instruments/agtable/run.js            writes
          node instruments/agtable/run.js --check    re-derives and compares */
'use strict';
const fs = require('fs');
const path = require('path');
const DV = require(path.join(__dirname, 'derive.js'));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'certs', 'agtable-redecided.json');

const R = DV.derive();
const f2 = (v) => v.toExponential(1);
const rec = {
  what: 'Tables 1 and 2 of Ashrafyan–Gomes (arXiv:2403.02785v2, §8) re-decided: the two analytic solutions the paper tests against are enclosed in interval arithmetic (every π, e, sin, cos, tanh, cube root and integral with its rounding), the semi-Lagrangian scheme is written from the paper and run on the paper\'s four meshes at the paper\'s tolerance and at a tight one, and every printed relative error is met by an interval and given a verdict',
  statement: 'The exact price of test 1, ϖ = −Q + (1 − t)/4 − ∫ₜ¹∫₀ˢQ, satisfies the clearing identity ϖ + a₁ + 2a₂K = −Q at 21 times as an interval fact; the value function\'s constant a₀(0) is enclosed to ' + R.exact.a0.remainder.toExponential(1) + '. Of the 24 printed cells, ' + (R.counts[1].reproduced + R.counts[2].reproduced) + ' are REPRODUCED within their two printed digits by an independent implementation of the scheme, ' + (R.counts[1].near + R.counts[2].near) + ' are within 15 % and ' + (R.counts[1].differs + R.counts[2].differs) + ' differ — the value function and density columns of test 1 at the fine meshes, where the port\'s errors are up to ' + Math.max(R.runs[1][3].theirs.verdicts.u.factor, R.runs[1][3].theirs.verdicts.m.factor).toFixed(1) + ' times the printed ones, and the price of test 2 at the finest mesh, where the port does better than printed (×' + R.runs[2][3].theirs.verdicts.w.factor.toFixed(2) + '). The price column of test 1 is reproduced at every mesh to its two digits. At the finest mesh of test 1 the paper\'s tolerance ε = 0.004 changes the price error by ' + (100 * R.tolerance[1].w.change).toFixed(0) + ' % against ε = 1e−8: the printed number there is part tolerance. The density printed for both tests, read literally, has a mass above ' + f2(R.asPrinted[1.1].lowerMass) + ' on a sliver of width 0.001 just outside |x| = 1/λ and is not a probability density; the integrable reading (support |x| < 1/λ) is the one enclosed.',
  verdict: 'MEASURED',
  pins: R.pins, meshes: R.meshes, tight: R.tight, printed: R.printed, exact: R.exact, runs: R.runs, coarse: R.coarse, orders: R.orders, tolerance: R.tolerance, counts: R.counts, asPrinted: R.asPrinted,
  provenance: {
    code: 'instruments/agtable/exact.js', sha256: DV.sha(path.join(__dirname, 'exact.js')),
    scheme: 'instruments/agtable/sl.js', schemeSha256: DV.sha(path.join(__dirname, 'sl.js')),
    derive: 'instruments/agtable/derive.js', deriveSha256: DV.sha(path.join(__dirname, 'derive.js')),
    taylor2: 'instruments/interval/taylor2.js', taylor2Sha256: DV.sha(path.join(ROOT, 'instruments', 'interval', 'taylor2.js')),
    tables: 'corpus/ashrafyan-gomes-2403.02785/tables.json — the printed numbers, read from the PDF on 2026-09-07',
    paper: 'Y. Ashrafyan, D. A. Gomes, A fully-discrete semi-Lagrangian scheme for a price formation MFG model, arXiv:2403.02785v2 (2025)'
  },
  generatedBy: 'node instruments/agtable/run.js'
};
const text = JSON.stringify(rec, null, 1) + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(OUT, 'utf8') !== text) { console.error('agtable record: the live re-derivation differs'); process.exit(1); }
  console.log('agtable record: re-derived identically');
} else {
  fs.writeFileSync(OUT, text);
  for (const test of [1, 2]) for (const R of rec.runs[test]) console.log('test ' + test + ' ρ = ' + R.rho + ' h = ' + R.h + '  ours ' + ['w', 'u', 'm'].map(c => c + ' ' + f2(R.theirs[c].rel[1]) + ' [' + R.theirs.verdicts[c].verdict[0] + ']').join(' ') + '  printed ' + f2(R.printed.w) + ' ' + f2(R.printed.u) + ' ' + f2(R.printed.m) + '  it ' + R.theirs.it + '/' + R.tight.it);
  console.log('counts', JSON.stringify(rec.counts), ' tolerance share at the finest mesh', JSON.stringify(rec.tolerance[1].w));
  console.log('wrote ' + path.relative(ROOT, OUT) + ' (' + text.length + ' bytes)');
}
