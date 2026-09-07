#!/usr/bin/env node
/* run.js — produce the record: certs/regatlas.json (the page reads only this).
   usage: node instruments/regatlas/run.js            writes
          node instruments/regatlas/run.js --check    re-derives and compares */
'use strict';
const fs = require('fs');
const path = require('path');
const DV = require(path.join(__dirname, 'derive.js'));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'certs', 'regatlas.json');

const R = DV.derive();
const rec = {
  what: 'the p-Laplacian regularisation of Ferreira–Gomes–Üçer (arXiv:2506.21212, operator (3.1)) on the one-dimensional stationary first-order MFG with H = |p|²/2 − m and V = A cos 2πx: every cell of a 10 × 5 atlas in (A, ε) certified as a unique classical even solution with positive density by a radii polynomial in a derivative-weighted ℓ¹ space, or refused by name; the distance between the regularised and the unregularised solution decided as a bracket',
  statement: R.counts.proved + ' of ' + R.cells.length + ' cells PROVED (' + R.counts.refused + ' refused: ' + Object.entries(R.counts.byWhy).map(([k, v]) => v + ' by ' + k).join(', ') + '). The unregularised game (ε = 0) certifies as readily as the regularised one: after eliminating m the linearisation is −(c h′)′ + e h with c = m + (1 + 3ε)u′² ≥ m > 0, elliptic wherever the density is positive, so the certifier needs no ε. Along A at fixed ε every row is PROVED then REFUSED; the frontier is ' + R.frontier.map(f => 'ε = ' + f.eps + ': proved to A = ' + f.lastProved + (f.firstRefused !== null ? ', refused from ' + f.firstRefused : '')).join('; ') + '. Where both cells are proved, ‖u_ε − u_0‖_2 is bracketed to the sum of the two radii; at A = 0 it equals ε exactly (u ≡ 1 − ε).',
  verdict: 'PROVED (cell by cell)',
  amps: R.amps, eps: R.eps, nu: R.nu, cells: R.cells, distances: R.distances, profiles: R.profiles, xs: R.xs, frontier: R.frontier, counts: R.counts,
  provenance: { code: 'instruments/regatlas/kernel.js', sha256: DV.sha(path.join(__dirname, 'kernel.js')), derive: 'instruments/regatlas/derive.js', deriveSha256: DV.sha(path.join(__dirname, 'derive.js')),
    paper: 'R. Ferreira, D. A. Gomes, M. Üçer, Solving mean-field games with monotonicity methods in Banach spaces, arXiv:2506.21212v3 (2026) — Problem 1, the power-growth case, the regularised operator (3.1) with γ̄ = α(β+1)/β' },
  generatedBy: 'node instruments/regatlas/run.js'
};
const text = JSON.stringify(rec, null, 1) + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(OUT, 'utf8') !== text) { console.error('regatlas record: the live re-derivation differs'); process.exit(1); }
  console.log('regatlas record: re-derived identically');
} else {
  fs.writeFileSync(OUT, text);
  for (const eps of R.eps) console.log('ε = ' + String(eps).padEnd(5) + R.amps.map(A => { const c = R.cells.find(c => c.A === A && c.eps === eps); return c.ok ? 'P(' + c.kappa.toFixed(2) + ')' : 'R:' + (c.why.startsWith('Z1') ? 'Z1' : c.why.startsWith('the density') ? 'm' : '?'); }).join(' '));
  console.log('distances at A = 0.4: ' + R.distances.filter(d => d.A === 0.4).map(d => d.decided ? d.eps + ' → [' + d.lo.toExponential(2) + ', ' + d.hi.toExponential(2) + ']' : d.eps + ' → undecided').join(' · '));
  console.log('wrote ' + path.relative(ROOT, OUT) + ' (' + text.length + ' bytes)');
}
