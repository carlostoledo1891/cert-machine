#!/usr/bin/env node
/* run.js — produce the record: certs/maxval-cylinder.json.
   32 × 96 cells of the space–time cylinder, profiles at five times.
   usage: node instruments/maxval/run.js            writes the record
          node instruments/maxval/run.js --check    re-derives and compares */
'use strict';
const fs = require('fs');
const path = require('path');
const M = require(path.join(__dirname, 'maxval.js'));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'certs', 'maxval-cylinder.json');
const OPTS = { NT: 32, NX: 96, profileRows: [0, 8, 16, 24, 31] };

function build() {
  const sha = M.sha256File(path.join(__dirname, 'maxval.js'));
  const res = M.decide(OPTS);
  const cert = M.certificate(res, { code: 'instruments/maxval/maxval.js', sha256: sha });
  if (!cert.proved) { console.error(cert.report()); process.exit(1); }
  /* the cells are kept in a compact form: standing, region, u, u*, gap, m, per cell */
  const cells = res.cells.map(c => [c.i, c.j, c.region[0], c.standing[0], c.tight ? 1 : 0, c.gapProven ? 1 : 0,
    c.u, c.ustar, c.gap, c.m]);
  return {
    what: 'the maximal value function of Gomes–Üçer (Theorem 1.8) on an explicit first-order time-dependent MFG with a vacuum, built here: the parabolic bump of shrinking support on the circle of length 6 with H = ½p² − m',
    statement: cert.claim,
    verdict: 'VERIFIED',
    instance: { L: res.L, rho0: res.RHO0, r0: res.R0, rT: res.RT, T: res.T, thetaT: 'π/3', H: '½p² − m', formulas: {
      t: 't(θ) = √(2/3)(π − 2θ + sin 2θ)', r: 'r = 2 sin²θ', a: 'a = √(3/2) cos θ/(4 sin³θ)', A: 'A = 3/(8 sin²θ)', B: 'B = 3/(32 sin⁶θ)', b: 'b = √(3/2)(θ − π/3)',
      phi: 'φ = x² on |x| ≤ 9/4; ρ₀² + 2ρ₀s − ρ₀s²/w on s = |x| − ρ₀ ∈ [0, 3/4]', uT: 'u_T = a(T) φ' } },
    options: OPTS,
    counts: res.counts, pairOK: res.pairOK, gapOK: res.gapOK, terminalOK: res.terminalOK, maxGap: res.maxGap,
    massAlgebra: res.massAlgebra,
    cellFormat: '[i, j, region S/V/B, standing S/D/R, tight, gapProven, u, u*, gap, m]',
    cells,
    profiles: res.profiles,
    certificate: cert.toJSON(),
    provenance: { code: 'instruments/maxval/maxval.js', sha256: sha,
      paper: 'Diogo Gomes, Melih Üçer, "Existence and Structure for First-Order Time-Dependent Mean-Field Games with Local Couplings", arXiv:2606.28378 (19 Jun 2026): Definition 1.1, Definition 1.7, Theorem 1.8, Corollary 1.9, Example 2.7',
      identification: 'the maximal subsolution is the viscosity solution of −u_t + ½u_x² = m with u(T) = u_T, the value of inf ∫(½|ẋ|² + m) + u_T(x(T)) — Bardi & Capuzzo-Dolcetta, Optimal Control and Viscosity Solutions of HJB Equations (1997), classical; assumed' },
    generatedBy: 'node instruments/maxval/run.js'
  };
}

const rec = build();
const text = JSON.stringify(rec, null, 1) + '\n';
if (process.argv.includes('--check')) {
  const old = fs.readFileSync(OUT, 'utf8');
  if (old !== text) { console.error('maxval record: the live re-derivation differs from certs/maxval-cylinder.json'); process.exit(1); }
  console.log('maxval record: re-derived identically');
} else {
  fs.writeFileSync(OUT, text);
  console.log('cells ' + rec.cells.length + ' · ' + JSON.stringify(rec.counts) + ' · max gap ' + rec.maxGap.toFixed(4) + ' · T ∈ [' + rec.instance.T + ']');
  console.log('wrote ' + path.relative(ROOT, OUT));
}
