#!/usr/bin/env node
/* run.js — produce the record: certs/price-band.json (the page reads only this).
   usage: node instruments/price/run.js            writes
          node instruments/price/run.js --check    re-derives and compares */
'use strict';
const fs = require('fs');
const path = require('path');
const PR = require(path.join(__dirname, 'price.js'));
const DV = require(path.join(__dirname, 'derive.js'));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'certs', 'price-band.json');

const R = DV.derive();
const L0 = R.exact.ladder[0];
if (L0.certificate.verdict !== 'PROVED') { console.error('price: the band certificate is ' + L0.certificate.verdict); process.exit(1); }
const rec = {
  what: 'the clearing price of the Gomes–Saúde price-formation model (arXiv:1807.07088, §6 linear-quadratic), closed in exact rationals on the source lab\'s supply scenario, with a ±15 % forecast box on the supply turned into a proved price band; and the lab\'s finite-difference kernel measured against the exact model',
  statement: 'With Π = ∫u_x m and Ξ = ∫x m the paper\'s averaged dynamics Ξ̇ = Q, Π̇ = −η(Ξ − κ) close under quadratic terminal data through Π(T) = γ(Ξ(T) − ζ), so ϖ(t) = −cQ(t) − γ(Ξ(T) − ζ) − η∫ₜᵀ(Ξ − κ): the price is affine in the supply path with every coefficient ≤ 0. Over lo ≤ Q ≤ hi the price band is price(hi) ≤ ϖ ≤ price(lo), attained at both edges, decided exactly. On the lab\'s scenario (η = 0) Θ = ' + R.exact.theta.exact + ' ≈ ' + R.exact.theta.value.toFixed(6) + ' and the widest band is ' + L0.maxWidth.value.toFixed(6) + ' at grid time ' + L0.maxWidth.at + '. The lab\'s kernel clears its market in the agents\' controls to 1e−14 while its fleet ends the day at Ξ(T) = ' + R.fdBox.lab.XiT.toFixed(5) + ' against the ' + R.exact.XiT.value.toFixed(5) + ' that conservation requires: ' + R.fdBox.lab.lost.toFixed(4) + ' of the day\'s ' + R.exact.energy.value.toFixed(4) + ' vanishes at the wall. Forbidding the wall-pointing control halves the loss; clearing on the Fokker–Planck flux removes it (Ξ(T) matches to 1e−14) and, on a domain where the walls do not bind, the same scheme approaches the closed form at first order in the mesh (error ratio ' + R.wideRuns.order.toFixed(2) + ' for H halved), while the lab\'s wall treatment does not converge to it (ratio ' + R.wideRuns.labOrder.toFixed(2) + ').',
  verdict: 'PROVED',
  sliders: R.sliders, model: R.model, wide: R.wide, lab: R.lab, Q: R.Q, exact: R.exact, fdBox: R.fdBox, wideRuns: R.wideRuns,
  provenance: {
    code: 'instruments/price/price.js', sha256: PR.sha256File(path.join(__dirname, 'price.js')),
    fd: 'instruments/price/fd.js', fdSha256: PR.sha256File(path.join(__dirname, 'fd.js')),
    derive: 'instruments/price/derive.js', deriveSha256: PR.sha256File(path.join(__dirname, 'derive.js')),
    labKernel: 'sin-mfg research/mfg-lab/mfg-lab.html, module MPR, kernel sha256 65c8909331322f85… in artifact sha256 37c0e3bd640ae4c7… (274157 bytes) — read-only; the port in fd.js reproduced its price to the last bit on 2026-09-07 (49 iterations, residual 8.037e−10), see FINDINGS_LIT.md',
    paper: 'D. A. Gomes, J. Saúde, A mean-field game approach to price formation in electricity markets, arXiv:1807.07088 (2018); Dyn. Games Appl. 11 (2021)'
  },
  generatedBy: 'node instruments/price/run.js'
};
const text = JSON.stringify(rec, null, 1) + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(OUT, 'utf8') !== text) { console.error('price record: the live re-derivation differs'); process.exit(1); }
  console.log('price record: re-derived identically');
} else {
  fs.writeFileSync(OUT, text);
  console.log('Θ = ' + R.exact.theta.value.toFixed(6) + '  Ξ(T) = ' + R.exact.XiT.value.toFixed(6) + '  widest band ' + L0.maxWidth.value.toFixed(6) + ' at n = ' + L0.maxWidth.at);
  console.log('lab box: Ξ(T) ' + R.fdBox.lab.XiT.toFixed(5) + ' lost ' + R.fdBox.lab.lost.toFixed(4) + ' · constrained ' + R.fdBox.constrained.lost.toFixed(4) + ' · consistent ' + R.fdBox.consistent.lost.toExponential(1) + ' · Π_mid lab ' + R.fdBox.lab.PiMid.toFixed(4) + ' consistent ' + R.fdBox.consistent.PiMid.toFixed(4) + ' exact ' + R.exact.ladder[0].Pi0.value.toFixed(4));
  console.log('wide: errors ' + R.wideRuns.consistent.map(c => c.maxErr.toFixed(4)).join(' → ') + ' (ratio ' + R.wideRuns.order.toFixed(2) + '); lab walls ' + R.wideRuns.lab.map(c => c.maxErr.toFixed(4)).join(' → ') + ' (ratio ' + R.wideRuns.labOrder.toFixed(2) + ')');
  console.log('wrote ' + path.relative(ROOT, OUT) + ' (' + text.length + ' bytes)');
}
