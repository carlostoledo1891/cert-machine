#!/usr/bin/env node
/* run.js — produce the record: certs/afg-enclosure.json.

   Both cases at the record grid (16384 thin cells, 2048 Jacobian cells, 256
   plot cells), the certificate object for each, and the provenance of the code
   that produced them. Deterministic: no timings inside the record, so a re-run
   that changes a byte is a change in the mathematics or in the code, never in
   the clock.

   usage: node instruments/afg/run.js            writes the record
          node instruments/afg/run.js --check    re-derives and compares, writes nothing */
'use strict';
const fs = require('fs');
const path = require('path');
const A = require(path.join(__dirname, 'afg.js'));

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'certs', 'afg-enclosure.json');
const K = { KF: 16384, KD: 2048, KP: 256 };

function provenance() {
  return {
    code: 'instruments/afg/afg.js',
    sha256: A.sha256File(path.join(__dirname, 'afg.js')),
    quadrature: 'instruments/interval/quadrature.js',
    quadratureSha256: A.sha256File(path.join(ROOT, 'instruments', 'interval', 'quadrature.js')),
    paper: 'Noha Almulla, Rita Ferreira, Diogo Gomes, "Two Numerical Approaches to Stationary Mean-Field Games", Dynamic Games and Applications 7(4) 657–682 (2017), DOI 10.1007/s13235-016-0203-5, arXiv:1511.06576 (v1, 20 Nov 2015)',
    reduction: 'the one-dimensional current formulation: Gomes, Nurbekyan, Prazeres, "One-dimensional stationary mean-field games with local coupling", Dynamic Games and Applications 8 (2018), arXiv:1611.08161; and "Explicit solutions of one-dimensional, first-order, stationary mean-field games with congestion", CDC 2016'
  };
}

function build() {
  const rec = {
    what: 'the first-order stationary MFG of Almulla–Ferreira–Gomes (1.1) on the torus, V = sin 2πx, enclosed by the current: two scalars (j, H̄) fixed by two integral conditions, a Krawczyk box, rigorous quadrature throughout',
    statement: 'CASE B (b = cos² 2πx, ∫b = 1/2, the case the paper says has no known closed form): a classical solution (u, m, H̄) of (1.1) EXISTS, with current j and ergodic constant H̄ enclosed in the recorded box, locally unique there, and density enclosed pointwise and certified strictly positive. CASE A (b = 0, the paper\'s closed form u = 0, m = e^V/∫e^V, H̄ = ln ∫e^V): the same certifier, run as its own control — the enclosure of H̄ contains the closed form enclosed independently, and j is enclosed at 0 to 1e-13. Global uniqueness is AFG Lemma 2.3 (monotone operator), cited and assumed, not re-proved. Every number below is an interval endpoint computed in outward-rounded arithmetic; the only floats trusted are the Newton candidate and the approximate inverse, and they are trusted for nothing.',
    verdict: 'VERIFIED',
    grid: K,
    cases: {},
    provenance: provenance(),
    generatedBy: 'node instruments/afg/run.js'
  };
  for (const id of ['A', 'B']) {
    const res = A.enclose(id, K);
    const cert = A.certificate(res, { code: 'instruments/afg/afg.js', sha256: rec.provenance.sha256 });
    if (!cert.proved) { console.error(cert.report()); process.exit(1); }
    rec.cases[id] = {
      label: res.label, words: res.words, x0: res.x0, rounds: res.rounds,
      j: res.j, H: res.H, jWidth: res.jWidth, HWidth: res.HWidth,
      mMin: res.mMin, mMax: res.mMax, closure: res.closure, uMean: res.uMean, F0: res.F0,
      closedForm: res.closedForm || null,
      mTube: res.mTube, uTube: res.uTube,
      certificate: cert.toJSON()
    };
  }
  if (rec.cases.A.j[0] > 0 || rec.cases.A.j[1] < 0) { console.error('case A: j box does not contain 0'); process.exit(1); }
  if (!(rec.cases.B.j[0] > 0)) { console.error('case B: j not certified positive'); process.exit(1); }
  const cf = rec.cases.A.closedForm.H, Hb = rec.cases.A.H;
  if (!(cf[0] <= Hb[1] && Hb[0] <= cf[1])) { console.error('case A: the closed form and the enclosure of H̄ do not meet'); process.exit(1); }
  return rec;
}

const rec = build();
const text = JSON.stringify(rec, null, 1) + '\n';
if (process.argv.includes('--check')) {
  const old = fs.readFileSync(OUT, 'utf8');
  if (old !== text) { console.error('afg record: the live re-derivation differs from certs/afg-enclosure.json'); process.exit(1); }
  console.log('afg record: re-derived identically');
} else {
  fs.writeFileSync(OUT, text);
  for (const id of ['A', 'B']) {
    const c = rec.cases[id];
    console.log('case ' + id + ' (' + c.label + '): j ∈ [' + c.j + ']  H̄ ∈ [' + c.H + ']  m ∈ [' + c.mMin.toFixed(7) + ', ' + c.mMax.toFixed(7) + ']  widths j ' + c.jWidth.toExponential(2) + ' H ' + c.HWidth.toExponential(2));
  }
  console.log('wrote ' + path.relative(ROOT, OUT));
}
