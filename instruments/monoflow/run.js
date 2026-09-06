#!/usr/bin/env node
/* run.js — produce the record: certs/monoflow-spectrum.json.

   Six instances of the monotone flow, decided: the constant control at c = 1
   (closed form per mode), two non-constant monotone equilibria, one instance
   where every eigenvalue reached is real (NOT DECIDED, kept as such), and the
   herding branch at c = −12 with and without a potential, plus the constant
   solution at c = −12 (real spectrum by the closed form; the flow's unstable
   direction). Deterministic; no timings inside.

   usage: node instruments/monoflow/run.js            writes the record
          node instruments/monoflow/run.js --check    re-derives and compares */
'use strict';
const fs = require('fs');
const path = require('path');
const M = require(path.join(__dirname, 'monoflow.js'));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'certs', 'monoflow-spectrum.json');

const INSTANCES = [
  { id: 'C1', sigma: 0.5, c: 1, A: 0, N: 16, nu: 1.05, words: 'the constant solution, c = 1: the control — every mode has a closed form' },
  { id: 'M1', sigma: 0.5, c: 1, A: 1, N: 16, nu: 1.05, words: 'monotone (c = 1), potential A = 1: the non-constant equilibrium of the observatory' },
  { id: 'M2', sigma: 0.5, c: 1, A: 0.5, N: 16, nu: 1.05, words: 'monotone (c = 1), potential A = 0.5' },
  { id: 'R1', sigma: 0.3, c: 2, A: 1.5, N: 20, nu: 1.05, words: 'monotone (c = 2), σ = 0.3: every eigenvalue reached is real — NOT DECIDED, and kept as such' },
  { id: 'H1', sigma: 0.5, c: -12, A: 0, N: 16, nu: 1.02, branch: 'herding', words: 'herding (c = −12), the symmetry-broken branch of mfg-cap: not monotone, and not a gradient either' },
  { id: 'H2', sigma: 0.5, c: -12, A: 0.5, N: 16, nu: 1.02, branch: 'herding', words: 'herding (c = −12) with a potential, A = 0.5' },
  { id: 'H0', sigma: 0.5, c: -12, A: 0, N: 16, nu: 1.02, words: 'the constant solution at c = −12: real spectrum by the closed form, one eigenvalue positive — the flow leaves it' }
];

function build() {
  const sha = M.sha256File(path.join(__dirname, 'monoflow.js'));
  const rec = {
    what: 'the monotone flow of the quadratic stationary MFG (labs/mfg) on the even Galerkin space: at each certified equilibrium, the Lasry–Lions quadratic form evaluated from the interval Jacobian (must return c/2 at δm = cos 2πx) and, where a non-real eigenvalue pair exists, a Krawczyk enclosure of it — which rules out a gradient-flow structure under ANY Riemannian metric near that equilibrium',
    statement: 'CERTIFICATE 1 (monotone): ⟨DA v, v⟩ = c ∫δm² + ∫ m (δu\')² exactly, so the linearised Lasry–Lions operator is positive semidefinite iff c ≥ 0; the Jacobian assembled here returns c/2 at the witness direction on every instance. CERTIFICATE 2 (not a gradient flow): at C1, M1, M2, H1, H2 an eigenvalue μ of the flow Jacobian over the equilibrium\'s Galerkin box is enclosed with Im μ bounded away from 0, so no metric G and energy E make the flow −G⁻¹∇E near that equilibrium. At C1 the enclosed μ contains the closed-form mode-1 eigenvalue. R1 and H0 are NOT DECIDED: every eigenvalue reached by inverse iteration from the mode shifts is real to 1e-14, and a real spectrum is consistent with a gradient structure; nothing is claimed there. The theorem is about the finite-dimensional Galerkin ODE at the order N recorded; the same candidate is enclosed as a PDE solution by validate.js and both radii are recorded.',
    verdict: 'VERIFIED',
    instances: [],
    provenance: { code: 'instruments/monoflow/monoflow.js', sha256: sha,
      kernel: 'legacy/core/mfg/{mfg1d,validate}.js (the lifted mfg-cap kernel; Jacobian rows dRow, interval)',
      flow: 'Almulla–Ferreira–Gomes, DGA 7(4) 2017, §2.6 (2.7)–(2.8): the monotone flow; Ferreira–Gomes–Tada, arXiv:2502.20091: monotonicity methods',
      argument: 'a gradient flow ż = −G⁻¹∇E has Jacobian −G⁻¹ Hess E ~ symmetric at an equilibrium, hence real spectrum; a certified non-real pair excludes every (G, E)' },
    generatedBy: 'node instruments/monoflow/run.js'
  };
  for (const inst of INSTANCES) {
    const r = M.decide(inst);
    const cert = M.certificate(r, { code: 'instruments/monoflow/monoflow.js', sha256: sha });
    if (!r.ok) { console.error(inst.id + ': ' + r.why); process.exit(1); }
    rec.instances.push({
      id: inst.id, words: inst.words, sigma: r.sigma, c: r.c, A: r.A, N: r.N, branch: inst.branch || 'aligned',
      galerkinRadius: r.galerkin.maxRad, pde: r.pde,
      form: r.form, monotone: r.monotone,
      modes: r.modes, tried: r.tried,
      pairs: r.pairs.map(p => ({ shift: p.shift, muFloat: p.muFloat, ok: p.ok, why: p.why, mu: p.mu, muWidth: p.muWidth, nonReal: p.nonReal, rounds: p.rounds })),
      certified: r.certified.map(p => ({ mu: p.mu, muWidth: p.muWidth })),
      control: r.control,
      verdict: r.verdict,
      certificate: cert.toJSON(),
      x: r.x
    });
  }
  return rec;
}

const rec = build();
const text = JSON.stringify(rec, null, 1) + '\n';
if (process.argv.includes('--check')) {
  const old = fs.readFileSync(OUT, 'utf8');
  if (old !== text) { console.error('monoflow record: the live re-derivation differs from certs/monoflow-spectrum.json'); process.exit(1); }
  console.log('monoflow record: re-derived identically');
} else {
  fs.writeFileSync(OUT, text);
  for (const i of rec.instances) {
    const p = i.certified[0];
    console.log(i.id.padEnd(3) + ' (σ,c,A)=(' + i.sigma + ',' + i.c + ',' + i.A + ') ' + i.verdict.padEnd(20)
      + (p ? ' μ ∈ [' + p.mu[0].map(v => v.toFixed(6)) + '] + i [' + p.mu[1].map(v => v.toFixed(6)) + ']' : ' (' + i.tried.length + ' real eigenvalues reached)')
      + '  form ' + (i.form.contains ? 'c/2 ok' : 'FAIL') + '  r_G ' + i.galerkinRadius.toExponential(1) + '  r_PDE ' + (i.pde.r ? i.pde.r.toExponential(1) : 'refused'));
  }
  console.log('wrote ' + path.relative(ROOT, OUT));
}
