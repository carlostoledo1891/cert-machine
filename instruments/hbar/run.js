#!/usr/bin/env node
/* run.js — produce the record: certs/hbar-band.json (the page reads only this).
   usage: node instruments/hbar/run.js            writes
          node instruments/hbar/run.js --check    re-derives and compares */
'use strict';
const fs = require('fs');
const path = require('path');
const DV = require(path.join(__dirname, 'derive.js'));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'certs', 'hbar-band.json');

const R = DV.derive();
const f = (v, d) => v.toFixed(d);
const rec = {
  what: 'the effective Hamiltonian H̄(P) of the one-dimensional cell problem H(x, P + u′) = H̄(P) with H = p²/2 + V(x) (Gomes–Yang, arXiv:1810.03483, §6), enclosed as a band: the flat part decided exactly, the rotating part bracketed by bisection on a rigorously enclosed integral, the degeneracy at P₀ met as a widening band and an undecided point; the paper\'s Table 1 (and the Gomes–Oberman value it cites) and Table 2 held against the enclosures',
  statement: 'For V = sin 2πx: ' + R.counts.flat + ' of ' + R.band.length + ' sampled P are FLAT (H̄ = 1 exactly, |P| ≤ P₀ with P₀ ∈ [' + R.p0.sin.value.map(v => f(v, 9)).join(', ') + '] ∋ 4/π), ' + R.counts.rotating + ' ROTATING with H̄ bracketed to at most ' + R.widest.width.toExponential(1) + ' (at P = ' + R.widest.P + ', nearest the degeneracy), ' + R.counts.undecided + ' UNDECIDED (P = 4/π itself, inside the P₀ enclosure). Table 1: H̄(1.5, 2.5) for the separable cosine Hamiltonian is ' + R.table1.c15.map(v => f(v, 9)).join('..') + ' + ' + R.table1.c25.map(v => f(v, 9)).join('..') + ' = [' + R.table1.sum.map(v => f(v, 9)).join(', ') + ']; the value 4.4099660 the paper quotes from Gomes–Oberman lies ' + R.table1.citedPlace + ' the enclosure by ' + R.table1.citedGap.toExponential(1) + '; the paper\'s own k-sequence lies ' + R.table1.NM.map(x => x.place).join(', ') + ' (Newton) — below, as the entropy-penalized H̄^k must. Table 2: at P = 0.5 on −sin 2πx the exact value is 1 (FLAT, decided) and the printed H̄◇ = 0.96476 at k = 100 sits ' + f(R.table2.Hdiamond[3].gap, 5) + ' below it — the entropy penalization\'s gap, not the mesh\'s.',
  verdict: 'DECIDED (band), MEASURED (their numbers)',
  PS: R.PS, K: R.K, printed: R.printed, p0: R.p0, band: R.band, table1: R.table1, table2: R.table2, mather: R.mather, counts: R.counts, widest: R.widest,
  provenance: { code: 'instruments/hbar/exact.js', sha256: DV.sha(path.join(__dirname, 'exact.js')), derive: 'instruments/hbar/derive.js', deriveSha256: DV.sha(path.join(__dirname, 'derive.js')), taylor2Sha256: DV.sha(path.join(ROOT, 'instruments', 'interval', 'taylor2.js')),
    paper: 'D. A. Gomes, X. Yang, The Hessian Riemannian flow and Newton\'s method for effective Hamiltonians and Mather measures, arXiv:1810.03483v2; ESAIM M2AN 54 (2020) 1883–1915 — §6.1 (the one-dimensional formula), §6.2 (Table 1), §6.4 (Table 2)' },
  generatedBy: 'node instruments/hbar/run.js'
};
const text = JSON.stringify(rec, null, 1) + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(OUT, 'utf8') !== text) { console.error('hbar record: the live re-derivation differs'); process.exit(1); }
  console.log('hbar record: re-derived identically');
} else {
  fs.writeFileSync(OUT, text);
  for (const b of R.band) console.log('P = ' + b.P.toFixed(4).padEnd(7) + b.regime.padEnd(10) + (b.value ? '[' + b.value.map(v => v.toFixed(9)).join(', ') + '] w ' + b.width.toExponential(1) + (b.stalled ? ' stalled' : '') : b.why));
  console.log('Table 1 sum', R.table1.sum, 'cited 4.4099660 is', R.table1.citedPlace, 'gap', R.table1.citedGap.toExponential(2));
  console.log('wrote ' + path.relative(ROOT, OUT) + ' (' + text.length + ' bytes)');
}
