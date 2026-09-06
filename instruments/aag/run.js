#!/usr/bin/env node
/* run.js — produce the record: certs/aag-empty-region.json.

   Case 1 painted on 256 cells with the budget ladder 16 / 64 / 256 / 1024,
   case 2 over γ ∈ [−0.5, −0.3]. Deterministic; no timings inside.

   usage: node instruments/aag/run.js            writes the record
          node instruments/aag/run.js --check    re-derives and compares */
'use strict';
const fs = require('fs');
const path = require('path');
const A = require(path.join(__dirname, 'aag.js'));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'certs', 'aag-empty-region.json');
const OPTS = { K: 256, ladder: [16, 64, 256, 1024], gamma: [-0.5, -0.3] };

function build() {
  const sha = A.sha256File(path.join(__dirname, 'aag.js'));
  const res = A.decide(OPTS);
  const cert = A.certificate(res, { code: 'instruments/aag/aag.js', sha256: sha });
  if (!cert.proved) { console.error(cert.report()); process.exit(1); }
  return {
    what: 'the one-dimensional first-order MFG with mixed boundary conditions of Alharbi–Ashrafyan–Gomes (AMO 93:40, 2026; arXiv:2305.15952) §3.2: the empty region decided cell by cell with refusal at the free boundary, the two value functions enclosed, the boundary complementarity evaluated; case 2 certified over a γ box',
    statement: cert.claim,
    verdict: 'VERIFIED',
    options: OPTS,
    roots: res.roots,
    case1: res.case1,
    ladder: res.ladder,
    case2: res.case2,
    certificate: cert.toJSON(),
    provenance: { code: 'instruments/aag/aag.js', sha256: sha,
      paper: 'AbdulRahman M. Alharbi, Yuri Ashrafyan, Diogo Gomes, "A First-Order Mean-Field Game on a Bounded Domain with Mixed Boundary Conditions", Applied Mathematics & Optimization 93, Art. 40 (2026); arXiv:2305.15952v4 (2 Mar 2026). System (3.5), boundary conditions (3.6), Cases 1 and 2 of §3.2, Figures 1 and 2, Definition 2.11, Theorem 1.3.',
      gammaNote: 'γ of Figure 2 is not printed in the text; read from the figure as about −0.4; case 2 is certified for every γ in the recorded box' },
    generatedBy: 'node instruments/aag/run.js'
  };
}

const rec = build();
const text = JSON.stringify(rec, null, 1) + '\n';
if (process.argv.includes('--check')) {
  const old = fs.readFileSync(OUT, 'utf8');
  if (old !== text) { console.error('aag record: the live re-derivation differs from certs/aag-empty-region.json'); process.exit(1); }
  console.log('aag record: re-derived identically');
} else {
  fs.writeFileSync(OUT, text);
  console.log('case 1: ' + rec.case1.runs.map(r => r.standing[0] + '[' + r.x0.toFixed(4) + ',' + r.x1.toFixed(4) + ']').join(' '));
  console.log('ladder: ' + rec.ladder.map(l => 'K=' + l.K + ' refused ' + l.refused + ' cells, length ' + l.refusedLength).join(' · '));
  console.log('case 2: γ ∈ [' + rec.case2.gamma + '], m ∈ [' + rec.case2.mMin.toFixed(5) + ', ' + rec.case2.mMax.toFixed(5) + ']');
  console.log('wrote ' + path.relative(ROOT, OUT));
}
